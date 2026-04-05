import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PlatformLpAnalyticsService } from './platform-lp-analytics.service';

@Controller('api/platform/lp-analytics')
export class PlatformLpAnalyticsController {
  constructor(private readonly service: PlatformLpAnalyticsService) {}

  @Post('track')
  track(@Body() body: any, @Req() req: Request) {
    return this.service.track(body || {}, req);
  }
}
