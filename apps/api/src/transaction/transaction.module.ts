import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TransactionApiController } from "./transaction_api.controller";
import { TransactionController } from './transaction.controller';

@Module({
  controllers: [TransactionController, TransactionApiController],
  providers: [PrismaService],
})
export class TransactionModule {}
