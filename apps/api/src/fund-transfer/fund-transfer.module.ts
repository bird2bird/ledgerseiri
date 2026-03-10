import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FundTransferController } from './fund-transfer.controller';
import { FundTransferService } from './fund-transfer.service';

@Module({
  controllers: [FundTransferController],
  providers: [FundTransferService, PrismaService],
  exports: [FundTransferService],
})
export class FundTransferModule {}
