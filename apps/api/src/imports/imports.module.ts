import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';
import { AmazonSpApiTokenPersistenceService } from './amazon-sp-api-token-persistence.service';
import { AmazonSpApiTokenPersistenceRepository } from './amazon-sp-api-token-persistence.repository';
import { AmazonSpApiOauthStatePersistenceBridgeService } from './amazon-sp-api-oauth-state-persistence-bridge.service';
import { AmazonSpApiTokenExchangeService } from './amazon-sp-api-token-exchange.service';

@Module({
  controllers: [ImportsController],
  providers: [
    ImportsService,
    PrismaService,
    AmazonSpApiTokenPersistenceRepository,
    AmazonSpApiTokenPersistenceService,
    AmazonSpApiOauthStatePersistenceBridgeService,
    AmazonSpApiTokenExchangeService,
  ],
  exports: [
    ImportsService,
    AmazonSpApiTokenPersistenceService,
    AmazonSpApiOauthStatePersistenceBridgeService,
    AmazonSpApiTokenExchangeService,
  ],
})
export class ImportsModule {}
