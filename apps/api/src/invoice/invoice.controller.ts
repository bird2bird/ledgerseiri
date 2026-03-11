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
    return this.service.unpaid();
  }

  @Get('history')
  history() {
    return this.service.history();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.service.create((body || {}) as any);
  }
}
