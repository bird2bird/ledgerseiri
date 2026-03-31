import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { PlatformAdminGuard } from '../platform-auth/platform-admin.guard';
import { PlatformReconciliationOperationService } from './platform-reconciliation-operation.service';

@Controller('api/platform/reconciliation')
@UseGuards(PlatformAdminGuard)
export class PlatformReconciliationBatchController {
  constructor(private readonly service: PlatformReconciliationOperationService) {}

  @Post('batch-override')
  batchOverride(
    @Body() body: { ids: string[]; decision: string; dryRun?: boolean; note?: string },
    @Req() req: any,
  ) {
    return this.service.batchOverride({
      ids: body.ids || [],
      decision: body.decision,
      dryRun: !!body.dryRun,
      note: body.note || '',
      adminId: req?.platformAdmin?.id || null,
      adminEmail: req?.platformAdmin?.email || null,
    });
  }
}
