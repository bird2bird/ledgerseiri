import {
  assertAmazonSpApiOauthCallbackRouteImplementationContract,
  buildAmazonSpApiOauthCallbackRouteImplementationContract,
  type AmazonSpApiOauthCallbackRouteImplementationContract,
} from './amazon-sp-api-oauth-callback-route-implementation-contract.dto';

export const AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_RUNTIME_SMOKE_CONTRACT_VERSION =
  'amazon-sp-api-oauth-callback-route-runtime-smoke-contract-v1' as const;

export type AmazonSpApiOauthCallbackRouteRuntimeSmokeContract = {
  version: typeof AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_RUNTIME_SMOKE_CONTRACT_VERSION;
  sourceStep127B: AmazonSpApiOauthCallbackRouteImplementationContract;

  runtimeSmokeImplementedNow: true;
  realNestHttpRouteSmokeNow: true;

  authorizationRouteAddedNow: false;
  tokenExchangeHttpCallNow: false;
  lwaHttpCallNow: false;
  tokenPersistenceDatabaseWriteNow: false;
  frontendAddedNow: false;
  realSpApiRequestNow: false;
  importJobWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;

  runtimeAssertions: {
    callbackErrorReturnsSanitizedFailure: true;
    missingStateReturnsSanitizedFailure: true;
    missingAuthorizationCodeReturnsSanitizedFailure: true;
    missingSellingPartnerIdReturnsSanitizedFailure: true;
    codeSuccessReturnsAcceptedForTokenExchangeLater: true;
    spapiOauthCodeSuccessReturnsAcceptedForTokenExchangeLater: true;
    spapiOauthCodeUsedFlagVerified: true;
    bridgeServiceReadyFlagVerified: true;
    responseDoesNotLeakAuthorizationCode: true;
    responseDoesNotLeakRefreshToken: true;
    responseDoesNotLeakAccessToken: true;
    responseDoesNotLeakEncryptedToken: true;
  };

  securityBoundary: {
    noHttpFetchToAmazonLwa: true;
    noLwaEndpoint: true;
    noTokenPersistenceDatabaseWrite: true;
    noTokenPersistenceServiceWriteCall: true;
    noRealAmazonSpApiCall: true;
    noFrontend: true;
  };

  nextAllowedWork: {
    oauthCallbackRouteRuntimeSmokeRecord: true;
    tokenExchangeServicePreimplementationContract: true;
    authorizationRouteImplementation: false;
    tokenExchangeHttpImplementation: false;
    frontendConnectionPanelImplementation: false;
    realSpApiReportRequestImplementation: false;
  };

  summary: {
    readyForStep127DOauthCallbackRouteRuntimeSmokeRecord: true;
    readyForTokenExchangeServicePreimplementationContract: true;
    readyForAuthorizationRouteImplementation: false;
    readyForTokenExchangeHttpImplementation: false;
    readyForFrontendConnectionPanelImplementation: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiOauthCallbackRouteRuntimeSmokeContract(): AmazonSpApiOauthCallbackRouteRuntimeSmokeContract {
  const step127B = assertAmazonSpApiOauthCallbackRouteImplementationContract(
    buildAmazonSpApiOauthCallbackRouteImplementationContract(),
  );

  return {
    version: AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_RUNTIME_SMOKE_CONTRACT_VERSION,
    sourceStep127B: step127B,

    runtimeSmokeImplementedNow: true,
    realNestHttpRouteSmokeNow: true,

    authorizationRouteAddedNow: false,
    tokenExchangeHttpCallNow: false,
    lwaHttpCallNow: false,
    tokenPersistenceDatabaseWriteNow: false,
    frontendAddedNow: false,
    realSpApiRequestNow: false,
    importJobWriteNow: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,

    runtimeAssertions: {
      callbackErrorReturnsSanitizedFailure: true,
      missingStateReturnsSanitizedFailure: true,
      missingAuthorizationCodeReturnsSanitizedFailure: true,
      missingSellingPartnerIdReturnsSanitizedFailure: true,
      codeSuccessReturnsAcceptedForTokenExchangeLater: true,
      spapiOauthCodeSuccessReturnsAcceptedForTokenExchangeLater: true,
      spapiOauthCodeUsedFlagVerified: true,
      bridgeServiceReadyFlagVerified: true,
      responseDoesNotLeakAuthorizationCode: true,
      responseDoesNotLeakRefreshToken: true,
      responseDoesNotLeakAccessToken: true,
      responseDoesNotLeakEncryptedToken: true,
    },

    securityBoundary: {
      noHttpFetchToAmazonLwa: true,
      noLwaEndpoint: true,
      noTokenPersistenceDatabaseWrite: true,
      noTokenPersistenceServiceWriteCall: true,
      noRealAmazonSpApiCall: true,
      noFrontend: true,
    },

    nextAllowedWork: {
      oauthCallbackRouteRuntimeSmokeRecord: true,
      tokenExchangeServicePreimplementationContract: true,
      authorizationRouteImplementation: false,
      tokenExchangeHttpImplementation: false,
      frontendConnectionPanelImplementation: false,
      realSpApiReportRequestImplementation: false,
    },

    summary: {
      readyForStep127DOauthCallbackRouteRuntimeSmokeRecord: true,
      readyForTokenExchangeServicePreimplementationContract: true,
      readyForAuthorizationRouteImplementation: false,
      readyForTokenExchangeHttpImplementation: false,
      readyForFrontendConnectionPanelImplementation: false,
      readyForRealSpApiReportRequest: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiOauthCallbackRouteRuntimeSmokeContract(
  contract: AmazonSpApiOauthCallbackRouteRuntimeSmokeContract,
): AmazonSpApiOauthCallbackRouteRuntimeSmokeContract {
  if (contract.version !== AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_RUNTIME_SMOKE_CONTRACT_VERSION) {
    throw new Error('Step127-C OAuth callback route runtime smoke contract violation: version mismatch.');
  }

  assertAmazonSpApiOauthCallbackRouteImplementationContract(contract.sourceStep127B);

  if (
    contract.runtimeSmokeImplementedNow !== true ||
    contract.realNestHttpRouteSmokeNow !== true ||
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
    throw new Error('Step127-C OAuth callback route runtime smoke contract violation: boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    runtimeAssertions: contract.runtimeAssertions,
    securityBoundary: contract.securityBoundary,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step127-C OAuth callback route runtime smoke contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.nextAllowedWork.oauthCallbackRouteRuntimeSmokeRecord !== true ||
    contract.nextAllowedWork.tokenExchangeServicePreimplementationContract !== true ||
    contract.nextAllowedWork.authorizationRouteImplementation !== false ||
    contract.nextAllowedWork.tokenExchangeHttpImplementation !== false ||
    contract.nextAllowedWork.frontendConnectionPanelImplementation !== false ||
    contract.nextAllowedWork.realSpApiReportRequestImplementation !== false ||
    contract.summary.readyForStep127DOauthCallbackRouteRuntimeSmokeRecord !== true ||
    contract.summary.readyForTokenExchangeServicePreimplementationContract !== true ||
    contract.summary.readyForAuthorizationRouteImplementation !== false ||
    contract.summary.readyForTokenExchangeHttpImplementation !== false ||
    contract.summary.readyForFrontendConnectionPanelImplementation !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step127-C OAuth callback route runtime smoke contract violation: summary mismatch.');
  }

  return contract;
}
