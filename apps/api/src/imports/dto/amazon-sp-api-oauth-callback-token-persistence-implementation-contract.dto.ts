import {
  assertAmazonSpApiOauthCallbackTokenPersistenceContract,
  buildAmazonSpApiOauthCallbackTokenPersistenceContract,
  type AmazonSpApiOauthCallbackTokenPersistenceContract,
} from './amazon-sp-api-oauth-callback-token-persistence-contract.dto';

export const AMAZON_SP_API_OAUTH_CALLBACK_TOKEN_PERSISTENCE_IMPLEMENTATION_CONTRACT_VERSION =
  'amazon-sp-api-oauth-callback-token-persistence-implementation-contract-v1' as const;

export type AmazonSpApiOauthCallbackTokenPersistenceImplementationContract = {
  version: typeof AMAZON_SP_API_OAUTH_CALLBACK_TOKEN_PERSISTENCE_IMPLEMENTATION_CONTRACT_VERSION;
  sourceStep131A: AmazonSpApiOauthCallbackTokenPersistenceContract;

  tokenPersistenceImplementationNow: true;
  controllerMutationNow: true;
  persistenceBridgeBuildPlanCalledNow: true;
  tokenPersistenceServiceInjectedNow: true;
  refreshCredentialPersistenceCalledNow: true;
  accessTokenCachePersistenceCalledNow: true;

  realLwaTransportImplementedNow: false;
  tokenExchangeHttpCallNow: false;
  lwaHttpCallNow: false;
  realSpApiRequestNow: false;
  frontendAddedNow: false;
  importJobWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;

  implementedPersistenceIntegration: {
    callbackRoutePath: '/api/imports/amazon-sp-api/oauth/callback';
    controllerPath: 'apps/api/src/imports/imports.controller.ts';
    persistenceBridgeName: 'AmazonSpApiOauthStatePersistenceBridgeService';
    persistenceBridgeMethod: 'buildPersistencePlan';
    tokenPersistenceServiceName: 'AmazonSpApiTokenPersistenceService';
    refreshCredentialMethod: 'persistEncryptedRefreshCredential';
    accessTokenCacheMethod: 'persistEncryptedAccessTokenCache';
    successStatus: 'token_persistence_completed';
    tokenPersistenceDatabaseWriteNowTrue: true;
    refreshCredentialPersistedFlagReturned: true;
    accessTokenCachePersistedFlagReturned: true;
    tokenPersistencePendingFalseAfterSuccess: true;
  };

  securityBoundary: {
    noRealLwaHttpBeforeExplicitLaterStep: true;
    noRealSpApiBeforeReportsStep: true;
    noFrontendMutationNow: true;
    noImportJobWriteNow: true;
    noTransactionWriteNow: true;
    noInventoryWriteNow: true;
    noRawAuthorizationCodeReturned: true;
    noRawRefreshTokenReturned: true;
    noRawAccessTokenReturned: true;
    noClientSecretReturned: true;
  };

  nextAllowedWork: {
    step131CTokenPersistenceRuntimeSmoke: true;
    step131DTokenPersistenceRuntimeRecordHandoff: false;
    step132FrontendConnectionPanelImplementation: false;
    step135RealSpApiReportsRequestImplementation: false;
  };

  summary: {
    step131BCompleted: true;
    readyForStep131CTokenPersistenceRuntimeSmoke: true;
    readyForStep131DTokenPersistenceRuntimeRecordHandoff: false;
    readyForStep132FrontendConnectionStatusPanel: false;
    readyForStep135RealSpApiReports: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiOauthCallbackTokenPersistenceImplementationContract(): AmazonSpApiOauthCallbackTokenPersistenceImplementationContract {
  const sourceStep131A = assertAmazonSpApiOauthCallbackTokenPersistenceContract(
    buildAmazonSpApiOauthCallbackTokenPersistenceContract(),
  );

  return {
    version: AMAZON_SP_API_OAUTH_CALLBACK_TOKEN_PERSISTENCE_IMPLEMENTATION_CONTRACT_VERSION,
    sourceStep131A,

    tokenPersistenceImplementationNow: true,
    controllerMutationNow: true,
    persistenceBridgeBuildPlanCalledNow: true,
    tokenPersistenceServiceInjectedNow: true,
    refreshCredentialPersistenceCalledNow: true,
    accessTokenCachePersistenceCalledNow: true,

    realLwaTransportImplementedNow: false,
    tokenExchangeHttpCallNow: false,
    lwaHttpCallNow: false,
    realSpApiRequestNow: false,
    frontendAddedNow: false,
    importJobWriteNow: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,

    implementedPersistenceIntegration: {
      callbackRoutePath: '/api/imports/amazon-sp-api/oauth/callback',
      controllerPath: 'apps/api/src/imports/imports.controller.ts',
      persistenceBridgeName: 'AmazonSpApiOauthStatePersistenceBridgeService',
      persistenceBridgeMethod: 'buildPersistencePlan',
      tokenPersistenceServiceName: 'AmazonSpApiTokenPersistenceService',
      refreshCredentialMethod: 'persistEncryptedRefreshCredential',
      accessTokenCacheMethod: 'persistEncryptedAccessTokenCache',
      successStatus: 'token_persistence_completed',
      tokenPersistenceDatabaseWriteNowTrue: true,
      refreshCredentialPersistedFlagReturned: true,
      accessTokenCachePersistedFlagReturned: true,
      tokenPersistencePendingFalseAfterSuccess: true,
    },

    securityBoundary: {
      noRealLwaHttpBeforeExplicitLaterStep: true,
      noRealSpApiBeforeReportsStep: true,
      noFrontendMutationNow: true,
      noImportJobWriteNow: true,
      noTransactionWriteNow: true,
      noInventoryWriteNow: true,
      noRawAuthorizationCodeReturned: true,
      noRawRefreshTokenReturned: true,
      noRawAccessTokenReturned: true,
      noClientSecretReturned: true,
    },

    nextAllowedWork: {
      step131CTokenPersistenceRuntimeSmoke: true,
      step131DTokenPersistenceRuntimeRecordHandoff: false,
      step132FrontendConnectionPanelImplementation: false,
      step135RealSpApiReportsRequestImplementation: false,
    },

    summary: {
      step131BCompleted: true,
      readyForStep131CTokenPersistenceRuntimeSmoke: true,
      readyForStep131DTokenPersistenceRuntimeRecordHandoff: false,
      readyForStep132FrontendConnectionStatusPanel: false,
      readyForStep135RealSpApiReports: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiOauthCallbackTokenPersistenceImplementationContract(
  contract: AmazonSpApiOauthCallbackTokenPersistenceImplementationContract,
): AmazonSpApiOauthCallbackTokenPersistenceImplementationContract {
  if (contract.version !== AMAZON_SP_API_OAUTH_CALLBACK_TOKEN_PERSISTENCE_IMPLEMENTATION_CONTRACT_VERSION) {
    throw new Error('Step131-B OAuth callback token persistence implementation contract violation: version mismatch.');
  }

  assertAmazonSpApiOauthCallbackTokenPersistenceContract(contract.sourceStep131A);

  if (
    contract.sourceStep131A.summary.readyForStep131BTokenPersistenceImplementation !== true ||
    contract.tokenPersistenceImplementationNow !== true ||
    contract.controllerMutationNow !== true ||
    contract.persistenceBridgeBuildPlanCalledNow !== true ||
    contract.tokenPersistenceServiceInjectedNow !== true ||
    contract.refreshCredentialPersistenceCalledNow !== true ||
    contract.accessTokenCachePersistenceCalledNow !== true ||
    contract.realLwaTransportImplementedNow !== false ||
    contract.tokenExchangeHttpCallNow !== false ||
    contract.lwaHttpCallNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.frontendAddedNow !== false ||
    contract.importJobWriteNow !== false ||
    contract.transactionWriteNow !== false ||
    contract.inventoryWriteNow !== false
  ) {
    throw new Error('Step131-B OAuth callback token persistence implementation contract violation: boundary mismatch.');
  }

  if (
    contract.implementedPersistenceIntegration.persistenceBridgeMethod !== 'buildPersistencePlan' ||
    contract.implementedPersistenceIntegration.refreshCredentialMethod !== 'persistEncryptedRefreshCredential' ||
    contract.implementedPersistenceIntegration.accessTokenCacheMethod !== 'persistEncryptedAccessTokenCache' ||
    contract.implementedPersistenceIntegration.successStatus !== 'token_persistence_completed'
  ) {
    throw new Error('Step131-B OAuth callback token persistence implementation contract violation: implemented integration mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    implementedPersistenceIntegration: contract.implementedPersistenceIntegration,
    securityBoundary: contract.securityBoundary,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (
        [
          'callbackRoutePath',
          'controllerPath',
          'persistenceBridgeName',
          'persistenceBridgeMethod',
          'tokenPersistenceServiceName',
          'refreshCredentialMethod',
          'accessTokenCacheMethod',
          'successStatus',
        ].includes(key)
      ) {
        continue;
      }

      if (value !== true) {
        throw new Error(`Step131-B OAuth callback token persistence implementation contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.nextAllowedWork.step131CTokenPersistenceRuntimeSmoke !== true ||
    contract.nextAllowedWork.step131DTokenPersistenceRuntimeRecordHandoff !== false ||
    contract.nextAllowedWork.step132FrontendConnectionPanelImplementation !== false ||
    contract.nextAllowedWork.step135RealSpApiReportsRequestImplementation !== false ||
    contract.summary.step131BCompleted !== true ||
    contract.summary.readyForStep131CTokenPersistenceRuntimeSmoke !== true ||
    contract.summary.readyForStep131DTokenPersistenceRuntimeRecordHandoff !== false ||
    contract.summary.readyForStep132FrontendConnectionStatusPanel !== false ||
    contract.summary.readyForStep135RealSpApiReports !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step131-B OAuth callback token persistence implementation contract violation: next-work summary mismatch.');
  }

  return contract;
}
