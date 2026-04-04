import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UserLoginAuditService {
  constructor(private readonly prisma: PrismaService) {}

  extractIp(req: any): string | null {
    const xff = req?.headers?.['x-forwarded-for'];
    if (typeof xff === 'string' && xff.trim()) {
      return xff.split(',')[0]?.trim() || null;
    }
    if (Array.isArray(xff) && xff.length > 0) {
      return String(xff[0] || '').split(',')[0]?.trim() || null;
    }
    return req?.ip || req?.socket?.remoteAddress || req?.connection?.remoteAddress || null;
  }

  extractUserAgent(req: any): string | null {
    const ua = req?.headers?.['user-agent'];
    return typeof ua === 'string' && ua.trim() ? ua.trim() : null;
  }

  async recordSuccessfulLoginByEmail(email: string, req: any) {
    if (!email) return null;

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) return null;

    const now = new Date();
    const ipAddress = this.extractIp(req);
    const userAgent = this.extractUserAgent(req);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: now,
          lastLoginIp: ipAddress || null,
        },
      }),
      this.prisma.userLoginEvent.create({
        data: {
          userId: user.id,
          loggedInAt: now,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          loginMethod: 'password',
          success: true,
        },
      }),
    ]);

    return { userId: user.id, loggedInAt: now };
  }
}
