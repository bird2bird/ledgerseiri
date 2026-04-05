import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type TrackConversionPayload = {
  eventType?: string | null;
  email?: string | null;
  userId?: string | null;
  ctaName?: string | null;
  source?: string | null;
  locale?: string | null;
  referrer?: string | null;
  visitorId?: string | null;
  sessionId?: string | null;
  path?: string | null;
};

@Injectable()
export class PlatformLpConversionService {
  constructor(private readonly prisma: PrismaService) {}

  async track(payload: TrackConversionPayload) {
    const eventType = String(payload?.eventType || '').trim();
    if (!eventType) return { ok: false, reason: 'EVENT_TYPE_REQUIRED' };

    const row = await this.prisma.lpConversionEvent.create({
      data: {
        eventType,
        email: payload?.email || null,
        userId: payload?.userId || null,
        ctaName: payload?.ctaName || null,
        source: payload?.source || null,
        locale: payload?.locale || null,
        referrer: payload?.referrer || null,
        visitorId: payload?.visitorId || null,
        sessionId: payload?.sessionId || null,
        path: payload?.path || null,
      },
      select: {
        id: true,
        eventType: true,
        createdAt: true,
      },
    });

    return { ok: true, event: row };
  }
}
