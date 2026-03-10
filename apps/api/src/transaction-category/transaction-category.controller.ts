import { Body, Controller, Get, Post } from '@nestjs/common';
import { TransactionCategoryService } from './transaction-category.service';

@Controller('api/transaction-categories')
export class TransactionCategoryController {
  constructor(private readonly service: TransactionCategoryService) {}

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
    return this.service.create(body);
  }
}
