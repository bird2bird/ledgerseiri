import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('api/inventory/balances')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get()
  listBalances(
    @Query('storeId') storeId?: string,
    @Query('status') status?: string,
    @Query('q') q?: string,
  ) {
    return this.service.listStocks({ storeId, status, q });
  }

  @Get('meta')
  meta() {
    return this.service.getMeta();
  }

  @Get('movements')
  movements(
    @Query('skuId') skuId?: string,
    @Query('skuCode') skuCode?: string,
    @Query('storeId') storeId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.listMovements({ skuId, skuCode, storeId, limit });
  }

  @Post('movements')
  createMovement(@Body() body: unknown) {
    return this.service.createManualAdjustment(body);
  }

  @Post()
  create(@Body() body: unknown) {
    return this.service.createManualAdjustment(body);
  }
}

@Controller('api/inventory')
export class InventoryRootController {
  constructor(private readonly service: InventoryService) {}

  @Get('stocks')
  stocks(
    @Query('storeId') storeId?: string,
    @Query('status') status?: string,
    @Query('q') q?: string,
  ) {
    return this.service.listStocks({ storeId, status, q });
  }

  @Get('meta')
  meta() {
    return this.service.getMeta();
  }

  @Get('movements')
  movements(
    @Query('skuId') skuId?: string,
    @Query('skuCode') skuCode?: string,
    @Query('storeId') storeId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.listMovements({ skuId, skuCode, storeId, limit });
  }

  @Get('audit-issues')
  auditIssues(
    @Query('status') status?: string,
    @Query('reason') reason?: string,
    @Query('sku') sku?: string,
    @Query('importJobId') importJobId?: string,
    @Query('businessMonth') businessMonth?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.listAuditIssues({
      status,
      reason,
      sku,
      importJobId,
      businessMonth,
      limit,
      offset,
    });
  }

  @Post('manual-adjustments')
  manualAdjustment(@Body() body: unknown) {
    return this.service.createManualAdjustment(body);
  }
}
