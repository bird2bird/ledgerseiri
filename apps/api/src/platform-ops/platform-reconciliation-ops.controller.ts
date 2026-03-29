import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PlatformAdminGuard } from '../platform-auth/platform-admin.guard';
import { PlatformReconciliationOpsService } from './platform-reconciliation-ops.service';

@Controller('api/platform/reconciliation')
@UseGuards(PlatformAdminGuard)
export class PlatformReconciliationOpsController {
  constructor(private readonly service: PlatformReconciliationOpsService) {}

  @Get('ops-summary')
  getOpsSummary(
    @Query('companyId') companyId?: string,
    @Query('candidateId') candidateId?: string,
    @Query('persistenceKey') persistenceKey?: string,
  ) {
    return this.service.getOpsSummary({
      companyId,
      candidateId,
      persistenceKey,
    });
  }
}
