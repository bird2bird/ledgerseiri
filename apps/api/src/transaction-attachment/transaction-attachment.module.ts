import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TransactionAttachmentController } from './transaction-attachment.controller';
import { TransactionAttachmentService } from './transaction-attachment.service';
import { TransactionAttachmentStorage } from './transaction-attachment.storage';

@Module({
  controllers: [TransactionAttachmentController],
  providers: [TransactionAttachmentService, TransactionAttachmentStorage, PrismaService],
  exports: [TransactionAttachmentService, TransactionAttachmentStorage],
})
export class TransactionAttachmentModule {}
