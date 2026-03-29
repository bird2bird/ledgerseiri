import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { PlatformAdminGuard } from '../platform-auth/platform-admin.guard';
import { PlatformOperationService } from './platform-operation.service';
import { PlatformReconciliationOperationService } from './platform-reconciliation-operation.service';

@Controller('api/platform/operations')
@UseGuards(PlatformAdminGuard)
export class PlatformOperationController {
  constructor(
    private readonly service: PlatformOperationService,
    private readonly reconciliationOperationService: PlatformReconciliationOperationService,
  ) {}

  @Get('list')
  list(
    @Query('scope') scope?: 'RECONCILIATION',
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = Number(limit ?? 20);
    const safeLimit = Number.isFinite(parsedLimit) ? parsedLimit : 20;
    return this.service.listOperations(scope, safeLimit);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.service.getOperation(id);
  }


  @Post(':id/retry-failed')
  retryFailed(
    @Param('id') id: string,
    @Body()
    body?: {
      source?: string;
    },
  ) {
    return this.reconciliationOperationService.retryFailed(id);
  }

}
