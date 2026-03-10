import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { TransactionService } from './transaction.service';

@Controller()
export class TransactionController {
  constructor(private readonly service: TransactionService) {}

  @Get('api/transactions')
  list(@Query('direction') direction?: 'INCOME' | 'EXPENSE' | 'TRANSFER') {
    return this.service.list(direction);
  }

  @Post('api/transactions')
  create(@Body() body: unknown) {
    return this.service.create((body || {}) as any);
  }

  @Get('api/transaction-categories')
  listCategories(@Query('direction') direction?: 'INCOME' | 'EXPENSE' | 'TRANSFER') {
    return this.service.listCategories(direction);
  }

  @Post('api/transaction-categories')
  createCategory(@Body() body: unknown) {
    return this.service.createCategory((body || {}) as any);
  }

  @Post('api/transaction-categories/seed')
  seedDefaultCategories() {
    return this.service.seedDefaultCategories();
  }

  @Get('transaction')
  legacyList(@Query('direction') direction?: 'INCOME' | 'EXPENSE' | 'TRANSFER') {
    return this.service.list(direction);
  }

  @Post('transaction')
  legacyCreate(@Body() body: unknown) {
    return this.service.create((body || {}) as any);
  }
}
