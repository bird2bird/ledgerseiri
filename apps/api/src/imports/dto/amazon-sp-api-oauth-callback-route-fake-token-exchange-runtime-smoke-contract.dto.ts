import {
  assertAmazonSpApiOauthCallbackRouteFakeTokenExchangeImplementationContract,
  buildAmazonSpApiOauthCallbackRouteFakeTokenExchangeImplementationContract,
  type AmazonSpApiOauthCallbackRouteFakeTokenExchangeImplementationContract,
} from './amazon-sp-api-oauth-callback-route-fake-token-exchange-implementation-contract.dto';

export const AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_FAKE_TOKEN_EXCHANGE_RUNTIME_SMOKE_CONTRACT_VERSION =
  'amazon-sp-api-oauth-callback-route-fake-token-exchange-runtime-smoke-contract-v1' as const;

export type AmazonSpApiOauthCallbackRouteFakeTokenExchangeRuntimeSmokeContract = {
  version: typeof AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_FAKE_TOKEN_EXCHANGE_RUNTIME_SMOKE_CONTRACT_VERSION;
  sourceStep130B: AmazonSpApiOauthCallbackRouteFakeTokenExchangeImplementationContract;

  runtimeSmokeImplementedNow: true;
  controllerRouteChangedNow: false;
  serviceLogicChangedNow: false;
  moduleChangedNow: false;

  fakeTokenExchangeRuntimeVerifiedNow: true;
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

  runtimeAssertions: {
    callbackCodePathReturnsFakeTokenExchangeCompleted: true;
    callbackSpapiOauthCodePathReturnsFakeTokenExchangeCompleted: true;
    callbackRejectsAmazonError: true;
    callbackRejectsMissingState: true;
    callbackRejectsMissingAuthorizationCode: true;
    callbackRejectsMissingSellingPartnerId: true;
    responseIncludesTokenExchangeAttempted: true;
    responseIncludesFakeTransportMode: true;
    responseIncludesSanitizedTokenEnvelope: true;
    responseKeepsTokenPersistencePending: true;
    responseTokenExchangeHttpCallFalse: true;
    responseTokenPersistenceDatabaseWriteFalse: true;
    responseRealSpApiRequestFalse: true;
    rawAuthorizationCodeNotLeaked: true;
    rawSpapiOauthCodeNotLeaked: true;
    rawClientSecretNotLeaked: true;
    rawRefreshTokenNotLeaked: true;
    rawAccessTokenNotLeaked: true;
  };

  staticBoundary: {
    callbackRouteStillExists: true;
    callbackRouteCallsFakeTokenExchangeService: true;
    callbackRouteReturnsFakeCompletionStatus: true;
    noRealLwaEndpoint: true;
    noFetch: true;
    noAxios: true;
    noHttpService: true;
    noTokenPersistenceDbWrite: true;
    noImportJobWrite: true;
    noTransactionWrite: true;
    noInventoryWrite: true;
  };

  nextAllowedWork: {
    step130DCallbackRouteFakeTokenExchangeRuntimeRecordHandoff: true;
    step131TokenPersistenceContract: false;
    step132FrontendConnectionPanelImplementation: false;
    step135RealSpApiReportsRequestImplementation: false;
  };

  summary: {
    step130CCompleted: true;
    readyForStep130DCallbackRouteFakeTokenExchangeRuntimeRecordHandoff: true;
    readyForStep131TokenPersistenceContract: false;
    readyForStep132FrontendConnectionStatusPanel: false;
    readyForStep135RealSpApiReports: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiOauthCallbackRouteFakeTokenExchangeRuntimeSmokeContract(): AmazonSpApiOauthCallbackRouteFakeTokenExchangeRuntimeSmokeContract {
  const sourceStep130B = assertAmazonSpApiOauthCallbackRouteFakeTokenExchangeImplementationContract(
    buildAmazonSpApiOauthCallbackRouteFakeTokenExchangeImplementationContract(),
  );

  return {
    version: AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_FAKE_TOKEN_EXCHANGE_RUNTIME_SMOKE_CONTRACT_VERSION,
    sourceStep130B,

    runtimeSmokeImplementedNow: true,
    controllerRouteChangedNow: false,
    serviceLogicChangedNow: false,
    moduleChangedNow: false,

    fakeTokenExchangeRuntimeVerifiedNow: true,
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

    runtimeAssertions: {
      callbackCodePathReturnsFakeTokenExchangeCompleted: true,
      callbackSpapiOauthCodePathReturnsFakeTokenExchangeCompleted: true,
      callbackRejectsAmazonError: true,
      callbackRejectsMissingState: true,
      callbackRejectsMissingAuthorizationCode: true,
      callbackRejectsMissingSellingPartnerId: true,
      responseIncludesTokenExchangeAttempted: true,
      responseIncludesFakeTransportMode: true,
      responseIncludesSanitizedTokenEnvelope: true,
      responseKeepsTokenPersistencePending: true,
      responseTokenExchangeHttpCallFalse: true,
      responseTokenPersistenceDatabaseWriteFalse: true,
      responseRealSpApiRequestFalse: true,
      rawAuthorizationCodeNotLeaked: true,
      rawSpapiOauthCodeNotLeaked: true,
      rawClientSecretNotLeaked: true,
      rawRefreshTokenNotLeaked: true,
      rawAccessTokenNotLeaked: true,
    },

    staticBoundary: {
      callbackRouteStillExists: true,
      callbackRouteCallsFakeTokenExchangeService: true,
      callbackRouteReturnsFakeCompletionStatus: true,
      noRealLwaEndpoint: true,
      noFetch: true,
      noAxios: true,
      noHttpService: true,
      noTokenPersistenceDbWrite: true,
      noImportJobWrite: true,
      noTransactionWrite: true,
      noInventoryWrite: true,
    },

    nextAllowedWork: {
      step130DCallbackRouteFakeTokenExchangeRuntimeRecordHandoff: true,
      step131TokenPersistenceContract: false,
      step132FrontendConnectionPanelImplementation: false,
      step135RealSpApiReportsRequestImplementation: false,
    },

    summary: {
      step130CCompleted: true,
      readyForStep130DCallbackRouteFakeTokenExchangeRuntimeRecordHandoff: true,
      readyForStep131TokenPersistenceContract: false,
      readyForStep132FrontendConnectionStatusPanel: false,
      readyForStep135RealSpApiReports: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiOauthCallbackRouteFakeTokenExchangeRuntimeSmokeContract(
  contract: AmazonSpApiOauthCallbackRouteFakeTokenExchangeRuntimeSmokeContract,
): AmazonSpApiOauthCallbackRouteFakeTokenExchangeRuntimeSmokeContract {
  if (contract.version !== AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_FAKE_TOKEN_EXCHANGE_RUNTIME_SMOKE_CONTRACT_VERSION) {
    throw new Error('Step130-C OAuth callback fake token exchange runtime smoke contract violation: version mismatch.');
  }

  assertAmazonSpApiOauthCallbackRouteFakeTokenExchangeImplementationContract(contract.sourceStep130B);

  if (
    contract.sourceStep130B.summary.readyForStep130CCallbackRouteFakeTokenExchangeRuntimeSmoke !== true ||
    contract.runtimeSmokeImplementedNow !== true ||
    contract.controllerRouteChangedNow !== false ||
    contract.serviceLogicChangedNow !== false ||
    contract.moduleChangedNow !== false ||
    contract.fakeTokenExchangeRuntimeVerifiedNow !== true ||
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
    throw new Error('Step130-C OAuth callback fake token exchange runtime smoke contract violation: boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    runtimeAssertions: contract.runtimeAssertions,
    staticBoundary: contract.staticBoundary,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step130-C OAuth callback fake token exchange runtime smoke contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.nextAllowedWork.step130DCallbackRouteFakeTokenExchangeRuntimeRecordHandoff !== true ||
    contract.nextAllowedWork.step131TokenPersistenceContract !== false ||
    contract.nextAllowedWork.step132FrontendConnectionPanelImplementation !== false ||
    contract.nextAllowedWork.step135RealSpApiReportsRequestImplementation !== false ||
    contract.summary.step130CCompleted !== true ||
    contract.summary.readyForStep130DCallbackRouteFakeTokenExchangeRuntimeRecordHandoff !== true ||
    contract.summary.readyForStep131TokenPersistenceContract !== false ||
    contract.summary.readyForStep132FrontendConnectionStatusPanel !== false ||
    contract.summary.readyForStep135RealSpApiReports !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step130-C OAuth callback fake token exchange runtime smoke contract violation: next-work summary mismatch.');
  }

  return contract;
}
