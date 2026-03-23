import { Controller, Get, UseGuards } from '@nestjs/common';
import { PlatformAdminGuard } from '../platform-auth/platform-admin.guard';
import { PlatformRevenueService } from './platform-revenue.service';

@Controller('api/platform/revenue')
@UseGuards(PlatformAdminGuard)
export class PlatformRevenueController {
  constructor(private readonly service: PlatformRevenueService) {}

  @Get('summary')
  getSummary() {
    return this.service.getSummary();
  }
}
