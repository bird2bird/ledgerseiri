import {
  assertAmazonSpApiOauthStatePersistenceBridgeImplementationContract,
  buildAmazonSpApiOauthStatePersistenceBridgeImplementationContract,
  type AmazonSpApiOauthStatePersistenceBridgeImplementationContract,
} from './amazon-sp-api-oauth-state-persistence-bridge-implementation-contract.dto';

export const AMAZON_SP_API_OAUTH_STATE_PERSISTENCE_BRIDGE_RUNTIME_SMOKE_CONTRACT_VERSION =
  'amazon-sp-api-oauth-state-persistence-bridge-runtime-smoke-contract-v2' as const;

export type AmazonSpApiOauthStatePersistenceBridgeRuntimeSmokeContract = {
  version: typeof AMAZON_SP_API_OAUTH_STATE_PERSISTENCE_BRIDGE_RUNTIME_SMOKE_CONTRACT_VERSION;
  sourceStep126B: AmazonSpApiOauthStatePersistenceBridgeImplementationContract;

  runtimeSmokeImplementedNow: true;
  pureRuntimeOnly: true;
  databaseWriteNow: false;
  httpCallNow: false;

  oauthCallbackRouteAddedNow: false;
  authorizationRouteAddedNow: false;
  tokenExchangeHttpCallNow: false;
  lwaHttpCallNow: false;
  tokenPersistenceDatabaseWriteNow: false;
  frontendAddedNow: false;
  realSpApiRequestNow: false;
  importJobWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;

  runtimeSmokeFixes: {
    spapiOauthCodeFallbackPositivePathOnly: true;
    removedIncorrectUnexpectedRejectionAssertion: true;
  };

  runtimeAssertions: {
    acceptedCallbackMapsToRefreshCredentialInput: true;
    acceptedCallbackMapsToAccessTokenCacheInput: true;
    sanitizedResultDoesNotContainAuthorizationCode: true;
    sanitizedResultDoesNotContainRefreshToken: true;
    sanitizedResultDoesNotContainAccessToken: true;
    spapiOauthCodeFallbackAccepted: true;
    noAccessTokenBranchReturnsNullAccessTokenCacheInput: true;
    callbackErrorShortCircuits: true;
    missingAuthorizationCodeRejected: true;
    missingSellingPartnerIdRejected: true;
    expiredStateRejected: true;
    nonceMismatchRejected: true;
    companyMismatchRejected: true;
    storeMismatchRejected: true;
    marketplaceMismatchRejected: true;
    regionMismatchRejected: true;
    appMismatchRejected: true;
    missingEncryptedRefreshTokenRejected: true;
    invalidTokenMetadataRejected: true;
    invalidStateVersionRejected: true;
    invalidStateDateRejected: true;
  };

  securityBoundary: {
    noHttpFetch: true;
    noLwaEndpoint: true;
    noDatabaseWrite: true;
    noTokenPersistenceServiceCall: true;
    noControllerRoute: true;
    noFrontend: true;
    noRealAmazonSpApiCall: true;
  };

  nextAllowedWork: {
    oauthStatePersistenceBridgeRuntimeSmokeRecord: true;
    oauthCallbackRoutePreimplementationContract: true;
    oauthCallbackRouteImplementation: false;
    authorizationRouteImplementation: false;
    tokenExchangeHttpImplementation: false;
    frontendConnectionPanelImplementation: false;
    realSpApiReportRequestImplementation: false;
  };

  summary: {
    readyForStep126DOauthStatePersistenceBridgeRuntimeSmokeRecord: true;
    readyForStep127AOauthCallbackRoutePreimplementationContract: true;
    readyForOauthCallbackRouteImplementation: false;
    readyForAuthorizationRouteImplementation: false;
    readyForTokenExchangeHttpImplementation: false;
    readyForFrontendConnectionPanelImplementation: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiOauthStatePersistenceBridgeRuntimeSmokeContract(): AmazonSpApiOauthStatePersistenceBridgeRuntimeSmokeContract {
  const step126B = assertAmazonSpApiOauthStatePersistenceBridgeImplementationContract(
    buildAmazonSpApiOauthStatePersistenceBridgeImplementationContract(),
  );

  return {
    version: AMAZON_SP_API_OAUTH_STATE_PERSISTENCE_BRIDGE_RUNTIME_SMOKE_CONTRACT_VERSION,
    sourceStep126B: step126B,

    runtimeSmokeImplementedNow: true,
    pureRuntimeOnly: true,
    databaseWriteNow: false,
    httpCallNow: false,

    oauthCallbackRouteAddedNow: false,
    authorizationRouteAddedNow: false,
    tokenExchangeHttpCallNow: false,
    lwaHttpCallNow: false,
    tokenPersistenceDatabaseWriteNow: false,
    frontendAddedNow: false,
    realSpApiRequestNow: false,
    importJobWriteNow: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,

    runtimeSmokeFixes: {
      spapiOauthCodeFallbackPositivePathOnly: true,
      removedIncorrectUnexpectedRejectionAssertion: true,
    },

    runtimeAssertions: {
      acceptedCallbackMapsToRefreshCredentialInput: true,
      acceptedCallbackMapsToAccessTokenCacheInput: true,
      sanitizedResultDoesNotContainAuthorizationCode: true,
      sanitizedResultDoesNotContainRefreshToken: true,
      sanitizedResultDoesNotContainAccessToken: true,
      spapiOauthCodeFallbackAccepted: true,
      noAccessTokenBranchReturnsNullAccessTokenCacheInput: true,
      callbackErrorShortCircuits: true,
      missingAuthorizationCodeRejected: true,
      missingSellingPartnerIdRejected: true,
      expiredStateRejected: true,
      nonceMismatchRejected: true,
      companyMismatchRejected: true,
      storeMismatchRejected: true,
      marketplaceMismatchRejected: true,
      regionMismatchRejected: true,
      appMismatchRejected: true,
      missingEncryptedRefreshTokenRejected: true,
      invalidTokenMetadataRejected: true,
      invalidStateVersionRejected: true,
      invalidStateDateRejected: true,
    },

    securityBoundary: {
      noHttpFetch: true,
      noLwaEndpoint: true,
      noDatabaseWrite: true,
      noTokenPersistenceServiceCall: true,
      noControllerRoute: true,
      noFrontend: true,
      noRealAmazonSpApiCall: true,
    },

    nextAllowedWork: {
      oauthStatePersistenceBridgeRuntimeSmokeRecord: true,
      oauthCallbackRoutePreimplementationContract: true,
      oauthCallbackRouteImplementation: false,
      authorizationRouteImplementation: false,
      tokenExchangeHttpImplementation: false,
      frontendConnectionPanelImplementation: false,
      realSpApiReportRequestImplementation: false,
    },

    summary: {
      readyForStep126DOauthStatePersistenceBridgeRuntimeSmokeRecord: true,
      readyForStep127AOauthCallbackRoutePreimplementationContract: true,
      readyForOauthCallbackRouteImplementation: false,
      readyForAuthorizationRouteImplementation: false,
      readyForTokenExchangeHttpImplementation: false,
      readyForFrontendConnectionPanelImplementation: false,
      readyForRealSpApiReportRequest: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiOauthStatePersistenceBridgeRuntimeSmokeContract(
  contract: AmazonSpApiOauthStatePersistenceBridgeRuntimeSmokeContract,
): AmazonSpApiOauthStatePersistenceBridgeRuntimeSmokeContract {
  if (contract.version !== AMAZON_SP_API_OAUTH_STATE_PERSISTENCE_BRIDGE_RUNTIME_SMOKE_CONTRACT_VERSION) {
    throw new Error('Step126-C OAuth state persistence bridge runtime smoke contract violation: version mismatch.');
  }

  assertAmazonSpApiOauthStatePersistenceBridgeImplementationContract(contract.sourceStep126B);

  if (
    contract.runtimeSmokeImplementedNow !== true ||
    contract.pureRuntimeOnly !== true ||
    contract.databaseWriteNow !== false ||
    contract.httpCallNow !== false ||
    contract.oauthCallbackRouteAddedNow !== false ||
    contract.authorizationRouteAddedNow !== false ||
    contract.tokenExchangeHttpCallNow !== false ||
    contract.lwaHttpCallNow !== false ||
    contract.tokenPersistenceDatabaseWriteNow !== false ||
    contract.frontendAddedNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.importJobWriteNow !== false ||
    contract.transactionWriteNow !== false ||
    contract.inventoryWriteNow !== false
  ) {
    throw new Error('Step126-C OAuth state persistence bridge runtime smoke contract violation: boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    runtimeSmokeFixes: contract.runtimeSmokeFixes,
    runtimeAssertions: contract.runtimeAssertions,
    securityBoundary: contract.securityBoundary,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step126-C OAuth state persistence bridge runtime smoke contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.nextAllowedWork.oauthStatePersistenceBridgeRuntimeSmokeRecord !== true ||
    contract.nextAllowedWork.oauthCallbackRoutePreimplementationContract !== true ||
    contract.nextAllowedWork.oauthCallbackRouteImplementation !== false ||
    contract.nextAllowedWork.authorizationRouteImplementation !== false ||
    contract.nextAllowedWork.tokenExchangeHttpImplementation !== false ||
    contract.nextAllowedWork.frontendConnectionPanelImplementation !== false ||
    contract.nextAllowedWork.realSpApiReportRequestImplementation !== false ||
    contract.summary.readyForStep126DOauthStatePersistenceBridgeRuntimeSmokeRecord !== true ||
    contract.summary.readyForStep127AOauthCallbackRoutePreimplementationContract !== true ||
    contract.summary.readyForOauthCallbackRouteImplementation !== false ||
    contract.summary.readyForAuthorizationRouteImplementation !== false ||
    contract.summary.readyForTokenExchangeHttpImplementation !== false ||
    contract.summary.readyForFrontendConnectionPanelImplementation !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step126-C OAuth state persistence bridge runtime smoke contract violation: summary mismatch.');
  }

  return contract;
}
