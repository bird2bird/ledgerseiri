import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { FundTransferService } from './fund-transfer.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/fund-transfer')
export class FundTransferController {
  constructor(private readonly service: FundTransferService) {}

  @Get()
  list(@Req() req: any) {
    return this.service.list(req.user?.companyId);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() body: unknown) {
    return this.service.update(id, {
      ...((body || {}) as any),
      companyId: req.user?.companyId,
    });
  }

  @Get('meta')
  meta() {
    return this.service.getMeta();
  }

  @Post()
  create(@Req() req: any, @Body() body: unknown) {
    return this.service.create({
      ...((body || {}) as any),
      companyId: req.user?.companyId,
    });
  }
}
