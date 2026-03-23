import { Controller, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { PlatformAdminGuard } from '../platform-auth/platform-admin.guard';
import { PlatformReconciliationOverrideService } from './platform-reconciliation-override.service';

@Controller('api/platform/reconciliation')
@UseGuards(PlatformAdminGuard)
export class PlatformReconciliationOverrideController {
  constructor(private readonly service: PlatformReconciliationOverrideService) {}

  @Patch(':id/override')
  override(
    @Param('id') id: string,
    @Body() body: { decision: string }
  ) {
    return this.service.override(id, body.decision);
  }
}
