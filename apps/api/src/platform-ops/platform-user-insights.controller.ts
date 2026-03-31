import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PlatformAdminGuard } from '../platform-auth/platform-admin.guard';
import { PlatformUserInsightsService } from './platform-user-insights.service';

@Controller('api/platform/users-insights')
@UseGuards(PlatformAdminGuard)
export class PlatformUserInsightsController {
  constructor(private readonly service: PlatformUserInsightsService) {}

  @Get('list')
  list() {
    return this.service.list();
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.service.detail(id);
  }
}
