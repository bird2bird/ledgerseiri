import { Body, Controller, Get, Post } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('api/inventory/balances')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get('meta')
  meta() {
    return this.service.getMeta();
  }

  @Get('movements')
  movements() {
    return {
      ok: true,
      domain: 'inventory',
      action: 'movements',
      items: [],
      message: 'inventory movements skeleton ready',
    };
  }

  @Post('movements')
  createMovement(@Body() body: unknown) {
    return {
      ok: true,
      domain: 'inventory',
      action: 'create-movement',
      payload: body,
      mode: 'stub',
      message: 'inventory movement create stub',
    };
  }

  @Post()
  create(@Body() body: unknown) {
    return this.service.create(body);
  }
}
