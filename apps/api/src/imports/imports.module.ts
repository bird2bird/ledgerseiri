import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';
import { AmazonSpApiTokenPersistenceService } from './amazon-sp-api-token-persistence.service';
import { AmazonSpApiTokenPersistenceRepository } from './amazon-sp-api-token-persistence.repository';
import { AmazonSpApiOauthStatePersistenceBridgeService } from './amazon-sp-api-oauth-state-persistence-bridge.service';
import { AmazonSpApiTokenExchangeService } from './amazon-sp-api-token-exchange.service';
import { AmazonSpApiOauthAuthorizationUrlService } from './amazon-sp-api-oauth-authorization-url.service';
import { AmazonSpApiLwaEnvConfigValidationService } from './amazon-sp-api-lwa-env-config-validation.service';
import { AmazonSpApiRealLwaActivationGateService } from './amazon-sp-api-real-lwa-activation-gate.service';
import { AmazonSpApiOauthCallbackCommitGateService } from './amazon-sp-api-oauth-callback-commit-gate.service';
import { AmazonSpApiTokenPersistenceOrchestrator } from './amazon-sp-api-token-persistence.orchestrator';

@Module({
  controllers: [ImportsController],
  providers: [
    ImportsService,
    PrismaService,
    AmazonSpApiTokenPersistenceRepository,
    AmazonSpApiTokenPersistenceService,
    AmazonSpApiOauthStatePersistenceBridgeService,
    AmazonSpApiTokenExchangeService,
    AmazonSpApiOauthAuthorizationUrlService,
    AmazonSpApiLwaEnvConfigValidationService,
    AmazonSpApiRealLwaActivationGateService,
    AmazonSpApiOauthCallbackCommitGateService,
    AmazonSpApiTokenPersistenceOrchestrator,
    AmazonSpApiOauthCallbackCommitGateService,
    AmazonSpApiTokenPersistenceOrchestrator,
  ],
  exports: [
    ImportsService,
    AmazonSpApiTokenPersistenceService,
    AmazonSpApiOauthStatePersistenceBridgeService,
    AmazonSpApiTokenExchangeService,
    AmazonSpApiOauthAuthorizationUrlService,
    AmazonSpApiLwaEnvConfigValidationService,
    AmazonSpApiRealLwaActivationGateService,
  ],
})
export class ImportsModule {}
