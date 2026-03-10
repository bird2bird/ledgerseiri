import { Body, Controller, Get, Post } from '@nestjs/common';
import { InvoiceService } from './invoice.service';

@Controller('api/invoices')
export class InvoiceController {
  constructor(private readonly service: InvoiceService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get('meta')
  meta() {
    return this.service.getMeta();
  }

  @Get('unpaid')
  unpaid() {
    return {
      ok: true,
      domain: 'invoices',
      action: 'unpaid',
      items: [],
      message: 'invoice unpaid skeleton ready',
    };
  }

  @Get('history')
  history() {
    return {
      ok: true,
      domain: 'invoices',
      action: 'history',
      items: [],
      message: 'invoice history skeleton ready',
    };
  }

  @Post()
  create(@Body() body: unknown) {
    return this.service.create(body);
  }
}
