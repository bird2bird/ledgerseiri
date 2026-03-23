import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import crypto from 'crypto';

type PlatformRefreshPayload = {
  sub: string;
  sid: string;
  typ: 'platform_refresh';
};

@Injectable()
export class PlatformAuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private platformAccessExpiresMinutes(): number {
    const v = parseInt(process.env.PLATFORM_JWT_ACCESS_EXPIRES_MINUTES || '30', 10);
    return Number.isFinite(v) ? v : 30;
  }

  private platformRefreshExpiresDays(): number {
    const v = parseInt(process.env.PLATFORM_JWT_REFRESH_EXPIRES_DAYS || '14', 10);
    return Number.isFinite(v) ? v : 14;
  }

  private hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private createPlatformAccessToken(admin: { id: string; email: string; role: string }): string {
    const minutes = this.platformAccessExpiresMinutes();
    return this.jwt.sign(
      {
        sub: admin.id,
        email: admin.email,
        role: admin.role,
        typ: 'platform_access',
      },
      {
        secret: process.env.PLATFORM_JWT_SECRET || 'platform_dev_secret_change_me',
        expiresIn: `${minutes}m`,
      },
    );
  }

  private createPlatformRefreshToken(adminId: string, sessionId: string): string {
    const days = this.platformRefreshExpiresDays();
    return this.jwt.sign(
      {
        sub: adminId,
        sid: sessionId,
        typ: 'platform_refresh',
      },
      {
        secret: process.env.PLATFORM_JWT_REFRESH_SECRET || 'platform_refresh_dev_secret_change_me',
        expiresIn: `${days}d`,
      },
    );
  }

  private verifyPlatformRefreshToken(token: string): PlatformRefreshPayload {
    try {
      const payload = this.jwt.verify(token, {
        secret: process.env.PLATFORM_JWT_REFRESH_SECRET || 'platform_refresh_dev_secret_change_me',
      }) as PlatformRefreshPayload;

      if (!payload?.sub || !payload?.sid || payload?.typ !== 'platform_refresh') {
        throw new Error('bad payload');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('PLATFORM_REFRESH_INVALID');
    }
  }

  async login(email: string, password: string) {
    if (!email || !password) {
      throw new UnauthorizedException('PLATFORM_INVALID_CREDENTIALS');
    }

    const admin = await this.prisma.platformAdmin.findUnique({
      where: { email },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('PLATFORM_INVALID_CREDENTIALS');
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);

    if (!ok) {
      throw new UnauthorizedException('PLATFORM_INVALID_CREDENTIALS');
    }

    const sessionId = crypto.randomUUID();
    const refreshToken = this.createPlatformRefreshToken(admin.id, sessionId);
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const days = this.platformRefreshExpiresDays();
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await this.prisma.platformAdminSession.create({
      data: {
        id: sessionId,
        adminId: admin.id,
        refreshTokenHash,
        expiresAt,
      },
    });

    const accessToken = this.createPlatformAccessToken({
      id: admin.id,
      email: admin.email,
      role: admin.role,
    });

    return {
      accessToken,
      refreshToken,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
      session: {
        id: sessionId,
        expiresAt: expiresAt.toISOString(),
      },
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('PLATFORM_REFRESH_REQUIRED');
    }

    const payload = this.verifyPlatformRefreshToken(refreshToken);
    const refreshTokenHash = this.hashRefreshToken(refreshToken);

    const session = await this.prisma.platformAdminSession.findUnique({
      where: { id: payload.sid },
    });

    if (!session) {
      throw new UnauthorizedException('PLATFORM_REFRESH_SESSION_NOT_FOUND');
    }

    if (session.adminId !== payload.sub) {
      throw new UnauthorizedException('PLATFORM_REFRESH_SESSION_MISMATCH');
    }

    if (session.revokedAt) {
      throw new UnauthorizedException('PLATFORM_REFRESH_REVOKED');
    }

    if (session.expiresAt <= new Date()) {
      throw new UnauthorizedException('PLATFORM_REFRESH_EXPIRED');
    }

    if (session.refreshTokenHash !== refreshTokenHash) {
      throw new UnauthorizedException('PLATFORM_REFRESH_HASH_MISMATCH');
    }

    const admin = await this.prisma.platformAdmin.findUnique({
      where: { id: session.adminId },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('PLATFORM_ADMIN_NOT_AVAILABLE');
    }

    const accessToken = this.createPlatformAccessToken({
      id: admin.id,
      email: admin.email,
      role: admin.role,
    });

    return {
      accessToken,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
      session: {
        id: session.id,
        expiresAt: session.expiresAt.toISOString(),
      },
    };
  }

  async logout(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('PLATFORM_REFRESH_REQUIRED');
    }

    const payload = this.verifyPlatformRefreshToken(refreshToken);
    const refreshTokenHash = this.hashRefreshToken(refreshToken);

    const session = await this.prisma.platformAdminSession.findUnique({
      where: { id: payload.sid },
    });

    if (!session) {
      throw new UnauthorizedException('PLATFORM_REFRESH_SESSION_NOT_FOUND');
    }

    if (session.adminId !== payload.sub) {
      throw new UnauthorizedException('PLATFORM_REFRESH_SESSION_MISMATCH');
    }

    if (session.refreshTokenHash !== refreshTokenHash) {
      throw new UnauthorizedException('PLATFORM_REFRESH_HASH_MISMATCH');
    }

    await this.prisma.platformAdminSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return {
      ok: true,
      revokedSessionId: session.id,
    };
  }

  async me() {
    return {
      enabled: true,
      mode: 'platform-auth-session-phase-3',
    };
  }
}
