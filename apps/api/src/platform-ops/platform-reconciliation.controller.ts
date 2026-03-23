import { Controller, Get, UseGuards } from '@nestjs/common';
import { PlatformAdminGuard } from '../platform-auth/platform-admin.guard';
import { PlatformReconciliationService } from './platform-reconciliation.service';

@Controller('api/platform/reconciliation')
@UseGuards(PlatformAdminGuard)
export class PlatformReconciliationController {
  constructor(private readonly platformReconciliationService: PlatformReconciliationService) {}

  @Get('summary')
  getSummary() {
    return this.platformReconciliationService.getSummary();
  }
}
