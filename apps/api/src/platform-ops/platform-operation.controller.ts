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

  @Get('analytics')
  analytics() {
    return this.service.getAnalytics();
  }

  @Get('metrics')
  metrics() {
    return this.service.getMetrics();
  }

  @Get('list')
  list(
    @Query('scope') scope?: string,
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.listOperations({
      scope,
      status,
      q,
      page: Number(page ?? 1),
      limit: Number(limit ?? 20),
    });
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
