import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PlatformAdminGuard } from '../platform-auth/platform-admin.guard';
import { PlatformReconciliationListService } from './platform-reconciliation-list.service';

@Controller('api/platform/reconciliation')
@UseGuards(PlatformAdminGuard)
export class PlatformReconciliationListController {
  constructor(private readonly service: PlatformReconciliationListService) {}

  @Get('operation-link')
  getOperationLink(@Query('operationId') operationId?: string) {
    return this.service.getOperationLink(operationId || '');
  }

  @Get('list')
  getList(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('actionType') actionType?: string,
    @Query('source') source?: string,
    @Query('changed') changed?: string,
    @Query('companyId') companyId?: string,
    @Query('candidateId') candidateId?: string,
    @Query('persistenceKey') persistenceKey?: string,
  ) {
    return this.service.getList({
      page,
      limit,
      q,
      actionType,
      source,
      changed,
      companyId,
      candidateId,
      persistenceKey,
    });
  }
}
