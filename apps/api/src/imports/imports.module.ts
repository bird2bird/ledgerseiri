import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';
import { AmazonSpApiTokenPersistenceService } from './amazon-sp-api-token-persistence.service';
import { AmazonSpApiTokenPersistenceRepository } from './amazon-sp-api-token-persistence.repository';

@Module({
  controllers: [ImportsController],
  providers: [
    ImportsService,
    PrismaService,
    AmazonSpApiTokenPersistenceRepository,
    AmazonSpApiTokenPersistenceService,
  ],
  exports: [ImportsService, AmazonSpApiTokenPersistenceService],
})
export class ImportsModule {}
