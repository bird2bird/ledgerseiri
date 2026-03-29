import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { PlatformAdminGuard } from '../platform-auth/platform-admin.guard';
import { PlatformReconciliationBatchService } from './platform-reconciliation-batch.service';

type BatchOverrideBody = {
  ids: string[];
  decision: string;
};

@Controller('api/platform/reconciliation')
@UseGuards(PlatformAdminGuard)
export class PlatformReconciliationBatchController {
  constructor(
    private readonly service: PlatformReconciliationBatchService,
  ) {}

  @Patch('batch/override')
  batchOverride(@Body() body: BatchOverrideBody) {
    return this.service.batchOverride(body?.ids ?? [], body?.decision);
  }
}
