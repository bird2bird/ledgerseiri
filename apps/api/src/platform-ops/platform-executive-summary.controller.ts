import { Controller, Get, UseGuards } from '@nestjs/common';
import { PlatformAdminGuard } from '../platform-auth/platform-admin.guard';
import { PlatformExecutiveSummaryService } from './platform-executive-summary.service';

@Controller('api/platform')
@UseGuards(PlatformAdminGuard)
export class PlatformExecutiveSummaryController {
  constructor(private readonly service: PlatformExecutiveSummaryService) {}

  @Get('executive-summary')
  getSummary() {
    return this.service.getSummary();
  }
}
