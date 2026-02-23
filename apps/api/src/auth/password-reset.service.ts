import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import crypto from 'crypto';
import * as bcrypt from 'bcrypt';

type RequestMeta = {
  ip?: string;
  ua?: string;
};

@Injectable()
export class PasswordResetService {
  constructor(private readonly prisma: PrismaService) {}

  private hashToken(raw: string) {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  private async rateLimitByEmail(email: string) {
    // DB-based throttling: per-email window
    const since = new Date(Date.now() - 15 * 60 * 1000);
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return;

    const cnt = await this.prisma.passwordResetToken.count({
      where: { userId: user.id, createdAt: { gte: since } },
    });

    if (cnt >= 5) {
      throw new HttpException('TOO_MANY_REQUESTS', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  async requestReset(email: string, meta: RequestMeta) {
    // Do not leak whether the email exists.
    if (!email || typeof email !== 'string') {
      // still keep generic
      throw new BadRequestException('INVALID_REQUEST');
    }

    await this.rateLimitByEmail(email);

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { ok: true };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    // TODO: integrate real email provider.
    // For now: log reset link
    const link = `https://ledgerseiri.com/ja/reset-password?token=${rawToken}`;
    // eslint-disable-next-line no-console
    console.log('[PasswordReset] send link:', link, 'to', email, meta);

    return { ok: true };
  }

  async resetPassword(rawToken: string, newPassword: string) {
    if (!rawToken || typeof rawToken !== 'string') {
      throw new BadRequestException('INVALID_TOKEN');
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      throw new BadRequestException('WEAK_PASSWORD');
    }

    const tokenHash = this.hashToken(rawToken);
    const rec = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!rec || rec.usedAt) {
      throw new BadRequestException('INVALID_TOKEN');
    }
    if (rec.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('TOKEN_EXPIRED');
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: rec.userId },
        data: { password: hashed },
      }),
      this.prisma.passwordResetToken.update({
        where: { tokenHash },
        data: { usedAt: new Date() },
      }),
    ]);

    return { ok: true };
  }
}
