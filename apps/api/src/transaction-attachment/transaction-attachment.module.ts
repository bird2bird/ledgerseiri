import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TransactionAttachmentController } from './transaction-attachment.controller';
import { TransactionAttachmentService } from './transaction-attachment.service';

@Module({
  controllers: [TransactionAttachmentController],
  providers: [TransactionAttachmentService, PrismaService],
  exports: [TransactionAttachmentService],
})
export class TransactionAttachmentModule {}
