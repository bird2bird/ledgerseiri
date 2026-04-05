import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type TrackPayload = {
  path?: string | null;
  locale?: string | null;
  eventType?: string | null;
  ctaName?: string | null;
  referrer?: string | null;
  visitorId?: string | null;
  sessionId?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
};

@Injectable()
export class PlatformLpAnalyticsService {
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

  async track(payload: TrackPayload, req: any) {
    const path = String(payload?.path || '').trim();
    if (!path) return { ok: false, reason: 'PATH_REQUIRED' };

    const row = await this.prisma.lpVisitEvent.create({
      data: {
        path,
        locale: payload?.locale || null,
        eventType: payload?.eventType || 'view',
        ctaName: payload?.ctaName || null,
        referrer: payload?.referrer || null,
        visitorId: payload?.visitorId || null,
        sessionId: payload?.sessionId || null,
        ipAddress: this.extractIp(req),
        userAgent: this.extractUserAgent(req),
        utmSource: payload?.utmSource || null,
        utmMedium: payload?.utmMedium || null,
        utmCampaign: payload?.utmCampaign || null,
        utmTerm: payload?.utmTerm || null,
        utmContent: payload?.utmContent || null,
      },
      select: {
        id: true,
        path: true,
        eventType: true,
        createdAt: true,
      },
    });

    return { ok: true, event: row };
  }
}
