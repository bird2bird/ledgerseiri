import { Controller, Get, UseGuards } from '@nestjs/common';
import { PlatformAdminGuard } from '../platform-auth/platform-admin.guard';
import { PlatformReconciliationListService } from './platform-reconciliation-list.service';

@Controller('api/platform/reconciliation')
@UseGuards(PlatformAdminGuard)
export class PlatformReconciliationListController {
  constructor(private readonly service: PlatformReconciliationListService) {}

  @Get('list')
  getList() {
    return this.service.getList();
  }
}
