import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class TransactionController {
  constructor(private readonly service: TransactionService) {}

  @Get('api/transactions')
  list(
    @Req() req: any,
    @Query('direction') direction?: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  ) {
    return this.service.list(req.user?.companyId, direction);
  }

  @Post('api/transactions')
  create(@Req() req: any, @Body() body: unknown) {
    return this.service.create({
      ...((body || {}) as any),
      companyId: req.user?.companyId,
    });
  }

  @Patch('api/transactions/:id')
  update(@Req() req: any, @Param('id') id: string, @Body() body: unknown) {
    return this.service.update(id, {
      ...((body || {}) as any),
      companyId: req.user?.companyId,
    });
  }

  @Delete('api/transactions/:id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.service.remove(id, {
      companyId: req.user?.companyId,
    });
  }
}
