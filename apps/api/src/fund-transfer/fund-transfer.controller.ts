import { Body, Controller, Get, Post } from '@nestjs/common';
import { FundTransferService } from './fund-transfer.service';

@Controller('api/fund-transfer')
export class FundTransferController {
  constructor(private readonly service: FundTransferService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get('meta')
  meta() {
    return this.service.getMeta();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.service.create((body || {}) as any);
  }
}
