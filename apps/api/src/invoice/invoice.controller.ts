import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/invoices')
export class InvoiceController {
  constructor(private readonly service: InvoiceService) {}

  @Get()
  list(@Req() req: any) {
    return this.service.list(req.user?.companyId);
  }

  @Get('meta')
  meta() {
    return this.service.getMeta();
  }

  @Get('unpaid')
  unpaid(@Req() req: any) {
    return this.service.unpaid(req.user?.companyId);
  }

  @Get('history')
  history(@Req() req: any) {
    return this.service.history(req.user?.companyId);
  }

  @Post()
  create(@Req() req: any, @Body() body: unknown) {
    return this.service.create({
      ...((body || {}) as any),
      companyId: req.user?.companyId,
    });
  }
}
