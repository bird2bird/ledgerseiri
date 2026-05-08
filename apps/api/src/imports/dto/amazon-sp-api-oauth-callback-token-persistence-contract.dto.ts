import {
  assertAmazonSpApiOauthCallbackRouteFakeTokenExchangeRuntimeRecordHandoffContract,
  buildAmazonSpApiOauthCallbackRouteFakeTokenExchangeRuntimeRecordHandoffContract,
  type AmazonSpApiOauthCallbackRouteFakeTokenExchangeRuntimeRecordHandoffContract,
} from './amazon-sp-api-oauth-callback-route-fake-token-exchange-runtime-record-handoff-contract.dto';

export const AMAZON_SP_API_OAUTH_CALLBACK_TOKEN_PERSISTENCE_CONTRACT_VERSION =
  'amazon-sp-api-oauth-callback-token-persistence-contract-v1' as const;

export type AmazonSpApiOauthCallbackTokenPersistenceContract = {
  version: typeof AMAZON_SP_API_OAUTH_CALLBACK_TOKEN_PERSISTENCE_CONTRACT_VERSION;
  sourceStep130D: AmazonSpApiOauthCallbackRouteFakeTokenExchangeRuntimeRecordHandoffContract;

  contractOnly: true;
  tokenPersistenceImplementationNow: false;
  controllerMutationNow: false;
  persistenceBridgeAlreadyExists: true;
  callbackTokenPersistencePlannedNow: true;

  realLwaTransportImplementedNow: false;
  tokenExchangeHttpCallNow: false;
  lwaHttpCallNow: false;
  oauthStateDatabaseWriteNow: false;
  tokenPersistenceDatabaseWriteNow: false;
  frontendAddedNow: false;
  realSpApiRequestNow: false;
  importJobWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;

  plannedPersistenceIntegration: {
    callbackRoutePath: '/api/imports/amazon-sp-api/oauth/callback';
    controllerPath: 'apps/api/src/imports/imports.controller.ts';
    persistenceBridgeName: 'AmazonSpApiOauthStatePersistenceBridgeService';
    persistenceBridgeMethod: 'buildPersistencePlan';
    sourceEnvelopeField: 'sanitizedTokenEnvelope';
    plannedRefreshPlanField: 'refreshCredentialInput';
    plannedAccessPlanField: 'accessTokenCacheInput';
    persistOnlyAfterFakeTokenExchangeAccepted: true;
    buildPersistencePlanBeforeRepositoryWrite: true;
    persistRefreshCredentialFromPlan: true;
    persistAccessTokenCacheFromPlanWhenPresent: true;
    requireCompanyId: true;
    requireStoreId: true;
    requireMarketplaceId: true;
    requireRegion: true;
    requireSellingPartnerId: true;
    keepTokenPersistencePendingFalseAfterSuccess: true;
  };

  plannedPersistencePayload: {
    encryptedRefreshTokenRequired: true;
    encryptedAccessTokenOptional: true;
    accessTokenExpiresAtRequiredWhenAccessTokenPresent: true;
    tokenTypeRequiredWhenAccessTokenPresent: true;
    sellingPartnerIdRequired: true;
    marketplaceIdRequired: true;
    regionRequired: true;
    appIdRequired: true;
    sourceRecordedAsOAuthCallbackFakeExchange: true;
    rawAuthorizationCodeNotPersisted: true;
    rawRefreshTokenNotPersisted: true;
    rawAccessTokenNotPersisted: true;
    clientSecretNotPersisted: true;
  };

  securityBoundary: {
    noRealLwaHttpBeforeExplicitLaterStep: true;
    noRealSpApiBeforeReportsStep: true;
    noFrontendMutationNow: true;
    noImportJobWriteNow: true;
    noTransactionWriteNow: true;
    noInventoryWriteNow: true;
    noRawSecretLogging: true;
    persistenceIsLimitedToEncryptedEnvelopePlan: true;
  };

  nextAllowedWork: {
    step131BTokenPersistenceImplementation: true;
    step131CTokenPersistenceRuntimeSmoke: false;
    step132FrontendConnectionPanelImplementation: false;
    step135RealSpApiReportsRequestImplementation: false;
  };

  summary: {
    step131ACompleted: true;
    readyForStep131BTokenPersistenceImplementation: true;
    readyForStep131CTokenPersistenceRuntimeSmoke: false;
    readyForStep132FrontendConnectionStatusPanel: false;
    readyForStep135RealSpApiReports: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiOauthCallbackTokenPersistenceContract(): AmazonSpApiOauthCallbackTokenPersistenceContract {
  const sourceStep130D = assertAmazonSpApiOauthCallbackRouteFakeTokenExchangeRuntimeRecordHandoffContract(
    buildAmazonSpApiOauthCallbackRouteFakeTokenExchangeRuntimeRecordHandoffContract(),
  );

  return {
    version: AMAZON_SP_API_OAUTH_CALLBACK_TOKEN_PERSISTENCE_CONTRACT_VERSION,
    sourceStep130D,

    contractOnly: true,
    tokenPersistenceImplementationNow: false,
    controllerMutationNow: false,
    persistenceBridgeAlreadyExists: true,
    callbackTokenPersistencePlannedNow: true,

    realLwaTransportImplementedNow: false,
    tokenExchangeHttpCallNow: false,
    lwaHttpCallNow: false,
    oauthStateDatabaseWriteNow: false,
    tokenPersistenceDatabaseWriteNow: false,
    frontendAddedNow: false,
    realSpApiRequestNow: false,
    importJobWriteNow: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,

    plannedPersistenceIntegration: {
      callbackRoutePath: '/api/imports/amazon-sp-api/oauth/callback',
      controllerPath: 'apps/api/src/imports/imports.controller.ts',
      persistenceBridgeName: 'AmazonSpApiOauthStatePersistenceBridgeService',
      persistenceBridgeMethod: 'buildPersistencePlan',
      sourceEnvelopeField: 'sanitizedTokenEnvelope',
      plannedRefreshPlanField: 'refreshCredentialInput',
      plannedAccessPlanField: 'accessTokenCacheInput',
      persistOnlyAfterFakeTokenExchangeAccepted: true,
      buildPersistencePlanBeforeRepositoryWrite: true,
      persistRefreshCredentialFromPlan: true,
      persistAccessTokenCacheFromPlanWhenPresent: true,
      requireCompanyId: true,
      requireStoreId: true,
      requireMarketplaceId: true,
      requireRegion: true,
      requireSellingPartnerId: true,
      keepTokenPersistencePendingFalseAfterSuccess: true,
    },

    plannedPersistencePayload: {
      encryptedRefreshTokenRequired: true,
      encryptedAccessTokenOptional: true,
      accessTokenExpiresAtRequiredWhenAccessTokenPresent: true,
      tokenTypeRequiredWhenAccessTokenPresent: true,
      sellingPartnerIdRequired: true,
      marketplaceIdRequired: true,
      regionRequired: true,
      appIdRequired: true,
      sourceRecordedAsOAuthCallbackFakeExchange: true,
      rawAuthorizationCodeNotPersisted: true,
      rawRefreshTokenNotPersisted: true,
      rawAccessTokenNotPersisted: true,
      clientSecretNotPersisted: true,
    },

    securityBoundary: {
      noRealLwaHttpBeforeExplicitLaterStep: true,
      noRealSpApiBeforeReportsStep: true,
      noFrontendMutationNow: true,
      noImportJobWriteNow: true,
      noTransactionWriteNow: true,
      noInventoryWriteNow: true,
      noRawSecretLogging: true,
      persistenceIsLimitedToEncryptedEnvelopePlan: true,
    },

    nextAllowedWork: {
      step131BTokenPersistenceImplementation: true,
      step131CTokenPersistenceRuntimeSmoke: false,
      step132FrontendConnectionPanelImplementation: false,
      step135RealSpApiReportsRequestImplementation: false,
    },

    summary: {
      step131ACompleted: true,
      readyForStep131BTokenPersistenceImplementation: true,
      readyForStep131CTokenPersistenceRuntimeSmoke: false,
      readyForStep132FrontendConnectionStatusPanel: false,
      readyForStep135RealSpApiReports: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiOauthCallbackTokenPersistenceContract(
  contract: AmazonSpApiOauthCallbackTokenPersistenceContract,
): AmazonSpApiOauthCallbackTokenPersistenceContract {
  if (contract.version !== AMAZON_SP_API_OAUTH_CALLBACK_TOKEN_PERSISTENCE_CONTRACT_VERSION) {
    throw new Error('Step131-A OAuth callback token persistence contract violation: version mismatch.');
  }

  assertAmazonSpApiOauthCallbackRouteFakeTokenExchangeRuntimeRecordHandoffContract(contract.sourceStep130D);

  if (
    contract.sourceStep130D.summary.readyForStep131ATokenPersistenceContract !== true ||
    contract.contractOnly !== true ||
    contract.tokenPersistenceImplementationNow !== false ||
    contract.controllerMutationNow !== false ||
    contract.persistenceBridgeAlreadyExists !== true ||
    contract.callbackTokenPersistencePlannedNow !== true ||
    contract.realLwaTransportImplementedNow !== false ||
    contract.tokenExchangeHttpCallNow !== false ||
    contract.lwaHttpCallNow !== false ||
    contract.oauthStateDatabaseWriteNow !== false ||
    contract.tokenPersistenceDatabaseWriteNow !== false ||
    contract.frontendAddedNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.importJobWriteNow !== false ||
    contract.transactionWriteNow !== false ||
    contract.inventoryWriteNow !== false
  ) {
    throw new Error('Step131-A OAuth callback token persistence contract violation: boundary mismatch.');
  }

  if (
    contract.plannedPersistenceIntegration.callbackRoutePath !== '/api/imports/amazon-sp-api/oauth/callback' ||
    contract.plannedPersistenceIntegration.controllerPath !== 'apps/api/src/imports/imports.controller.ts' ||
    contract.plannedPersistenceIntegration.persistenceBridgeName !== 'AmazonSpApiOauthStatePersistenceBridgeService' ||
    contract.plannedPersistenceIntegration.persistenceBridgeMethod !== 'buildPersistencePlan' ||
    contract.plannedPersistenceIntegration.sourceEnvelopeField !== 'sanitizedTokenEnvelope' ||
    contract.plannedPersistenceIntegration.plannedRefreshPlanField !== 'refreshCredentialInput' ||
    contract.plannedPersistenceIntegration.plannedAccessPlanField !== 'accessTokenCacheInput'
  ) {
    throw new Error('Step131-A OAuth callback token persistence contract violation: planned integration mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    plannedPersistenceIntegration: contract.plannedPersistenceIntegration,
    plannedPersistencePayload: contract.plannedPersistencePayload,
    securityBoundary: contract.securityBoundary,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (
        [
          'callbackRoutePath',
          'controllerPath',
          'persistenceBridgeName',
          'persistenceBridgeMethod',
          'sourceEnvelopeField',
          'plannedRefreshPlanField',
          'plannedAccessPlanField',
        ].includes(key)
      ) {
        continue;
      }

      if (value !== true) {
        throw new Error(`Step131-A OAuth callback token persistence contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.nextAllowedWork.step131BTokenPersistenceImplementation !== true ||
    contract.nextAllowedWork.step131CTokenPersistenceRuntimeSmoke !== false ||
    contract.nextAllowedWork.step132FrontendConnectionPanelImplementation !== false ||
    contract.nextAllowedWork.step135RealSpApiReportsRequestImplementation !== false ||
    contract.summary.step131ACompleted !== true ||
    contract.summary.readyForStep131BTokenPersistenceImplementation !== true ||
    contract.summary.readyForStep131CTokenPersistenceRuntimeSmoke !== false ||
    contract.summary.readyForStep132FrontendConnectionStatusPanel !== false ||
    contract.summary.readyForStep135RealSpApiReports !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step131-A OAuth callback token persistence contract violation: next-work summary mismatch.');
  }

  return contract;
}
