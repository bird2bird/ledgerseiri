import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';
import { AmazonSpApiTokenPersistenceService } from './amazon-sp-api-token-persistence.service';
import { AmazonSpApiTokenPersistenceRepository } from './amazon-sp-api-token-persistence.repository';
import { AmazonSpApiOauthStatePersistenceBridgeService } from './amazon-sp-api-oauth-state-persistence-bridge.service';

@Module({
  controllers: [ImportsController],
  providers: [
    ImportsService,
    PrismaService,
    AmazonSpApiTokenPersistenceRepository,
    AmazonSpApiTokenPersistenceService,
    AmazonSpApiOauthStatePersistenceBridgeService,
  ],
  exports: [
    ImportsService,
    AmazonSpApiTokenPersistenceService,
    AmazonSpApiOauthStatePersistenceBridgeService,
  ],
})
export class ImportsModule {}
