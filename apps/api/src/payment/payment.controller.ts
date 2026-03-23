import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/payments')
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  @Get()
  list(@Req() req: any) {
    return this.service.list(req.user?.companyId);
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
