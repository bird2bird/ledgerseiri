import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PlatformAdminGuard } from '../platform-auth/platform-admin.guard';
import { PlatformReconciliationOperationService } from './platform-reconciliation-operation.service';

@Controller('api/platform/reconciliation/operations')
@UseGuards(PlatformAdminGuard)
export class PlatformReconciliationOperationController {
  constructor(private readonly service: PlatformReconciliationOperationService) {}

  @Post('batch-override')
  batchOverride(
    @Body()
    body: {
      ids: string[];
      decision: 'APPROVED' | 'REJECTED';
      source?: string;
      note?: string;
      requestedByAdminId?: string | null;
      requestedByAdminEmail?: string | null;
    },
  ) {
    return this.service.batchOverride({
      ids: body.ids || [],
      decision: body.decision,
      note: body.note,
      adminId: body.requestedByAdminId ?? null,
      adminEmail: body.requestedByAdminEmail ?? null,
    });
  }
}
