import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TransactionCategoryController } from './transaction-category.controller';
import { TransactionCategoryService } from './transaction-category.service';

@Module({
  controllers: [TransactionCategoryController],
  providers: [TransactionCategoryService, PrismaService],
  exports: [TransactionCategoryService],
})
export class TransactionCategoryModule {}
