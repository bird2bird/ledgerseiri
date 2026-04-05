import { Body, Controller, Post } from '@nestjs/common';
import { PlatformLpConversionService } from './platform-lp-conversion.service';

@Controller('api/platform/lp-analytics')
export class PlatformLpConversionController {
  constructor(private readonly service: PlatformLpConversionService) {}

  @Post('conversion')
  track(@Body() body: any) {
    return this.service.track(body || {});
  }
}
