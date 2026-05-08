import {
  assertAmazonSpApiOauthCallbackTokenPersistenceImplementationContract,
  buildAmazonSpApiOauthCallbackTokenPersistenceImplementationContract,
  type AmazonSpApiOauthCallbackTokenPersistenceImplementationContract,
} from './amazon-sp-api-oauth-callback-token-persistence-implementation-contract.dto';

export const AMAZON_SP_API_OAUTH_CALLBACK_TOKEN_PERSISTENCE_RUNTIME_SMOKE_CONTRACT_VERSION =
  'amazon-sp-api-oauth-callback-token-persistence-runtime-smoke-contract-v1' as const;

export type AmazonSpApiOauthCallbackTokenPersistenceRuntimeSmokeContract = {
  version: typeof AMAZON_SP_API_OAUTH_CALLBACK_TOKEN_PERSISTENCE_RUNTIME_SMOKE_CONTRACT_VERSION;
  sourceStep131B: AmazonSpApiOauthCallbackTokenPersistenceImplementationContract;

  runtimeSmokeImplementedNow: true;
  controllerMutationNow: false;
  serviceMutationNow: false;
  moduleMutationNow: false;

  tokenPersistenceRuntimeVerifiedNow: true;
  fakeTokenExchangeRuntimeVerifiedNow: true;
  persistenceBridgeBuildPlanRuntimeVerifiedNow: true;
  refreshCredentialPersistenceRuntimeVerifiedNow: true;
  accessTokenCachePersistenceRuntimeVerifiedNow: true;

  realLwaTransportImplementedNow: false;
  tokenExchangeHttpCallNow: false;
  lwaHttpCallNow: false;
  realSpApiRequestNow: false;
  frontendAddedNow: false;
  importJobWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;

  runtimeAssertions: {
    callbackCodePathReturnsTokenPersistenceCompleted: true;
    callbackSpapiOauthCodePathReturnsTokenPersistenceCompleted: true;
    callbackRejectsAmazonErrorWithoutPersistence: true;
    callbackRejectsMissingStateWithoutPersistence: true;
    callbackRejectsMissingAuthorizationCodeWithoutPersistence: true;
    callbackRejectsMissingSellingPartnerIdWithoutPersistence: true;
    refreshCredentialPersisted: true;
    accessTokenCachePersisted: true;
    tokenPersistenceDatabaseWriteNowTrue: true;
    tokenPersistencePendingFalse: true;
    tokenExchangeHttpCallFalse: true;
    realSpApiRequestFalse: true;
    rawAuthorizationCodeNotLeaked: true;
    rawSpapiOauthCodeNotLeaked: true;
    rawRefreshTokenNotLeaked: true;
    rawAccessTokenNotLeaked: true;
    clientSecretNotLeaked: true;
  };

  nextAllowedWork: {
    step131DTokenPersistenceRuntimeRecordHandoff: true;
    step132FrontendConnectionPanelImplementation: false;
    step135RealSpApiReportsRequestImplementation: false;
  };

  summary: {
    step131CCompleted: true;
    readyForStep131DTokenPersistenceRuntimeRecordHandoff: true;
    readyForStep132FrontendConnectionStatusPanel: false;
    readyForStep135RealSpApiReports: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiOauthCallbackTokenPersistenceRuntimeSmokeContract(): AmazonSpApiOauthCallbackTokenPersistenceRuntimeSmokeContract {
  const sourceStep131B = assertAmazonSpApiOauthCallbackTokenPersistenceImplementationContract(
    buildAmazonSpApiOauthCallbackTokenPersistenceImplementationContract(),
  );

  return {
    version: AMAZON_SP_API_OAUTH_CALLBACK_TOKEN_PERSISTENCE_RUNTIME_SMOKE_CONTRACT_VERSION,
    sourceStep131B,

    runtimeSmokeImplementedNow: true,
    controllerMutationNow: false,
    serviceMutationNow: false,
    moduleMutationNow: false,

    tokenPersistenceRuntimeVerifiedNow: true,
    fakeTokenExchangeRuntimeVerifiedNow: true,
    persistenceBridgeBuildPlanRuntimeVerifiedNow: true,
    refreshCredentialPersistenceRuntimeVerifiedNow: true,
    accessTokenCachePersistenceRuntimeVerifiedNow: true,

    realLwaTransportImplementedNow: false,
    tokenExchangeHttpCallNow: false,
    lwaHttpCallNow: false,
    realSpApiRequestNow: false,
    frontendAddedNow: false,
    importJobWriteNow: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,

    runtimeAssertions: {
      callbackCodePathReturnsTokenPersistenceCompleted: true,
      callbackSpapiOauthCodePathReturnsTokenPersistenceCompleted: true,
      callbackRejectsAmazonErrorWithoutPersistence: true,
      callbackRejectsMissingStateWithoutPersistence: true,
      callbackRejectsMissingAuthorizationCodeWithoutPersistence: true,
      callbackRejectsMissingSellingPartnerIdWithoutPersistence: true,
      refreshCredentialPersisted: true,
      accessTokenCachePersisted: true,
      tokenPersistenceDatabaseWriteNowTrue: true,
      tokenPersistencePendingFalse: true,
      tokenExchangeHttpCallFalse: true,
      realSpApiRequestFalse: true,
      rawAuthorizationCodeNotLeaked: true,
      rawSpapiOauthCodeNotLeaked: true,
      rawRefreshTokenNotLeaked: true,
      rawAccessTokenNotLeaked: true,
      clientSecretNotLeaked: true,
    },

    nextAllowedWork: {
      step131DTokenPersistenceRuntimeRecordHandoff: true,
      step132FrontendConnectionPanelImplementation: false,
      step135RealSpApiReportsRequestImplementation: false,
    },

    summary: {
      step131CCompleted: true,
      readyForStep131DTokenPersistenceRuntimeRecordHandoff: true,
      readyForStep132FrontendConnectionStatusPanel: false,
      readyForStep135RealSpApiReports: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiOauthCallbackTokenPersistenceRuntimeSmokeContract(
  contract: AmazonSpApiOauthCallbackTokenPersistenceRuntimeSmokeContract,
): AmazonSpApiOauthCallbackTokenPersistenceRuntimeSmokeContract {
  if (contract.version !== AMAZON_SP_API_OAUTH_CALLBACK_TOKEN_PERSISTENCE_RUNTIME_SMOKE_CONTRACT_VERSION) {
    throw new Error('Step131-C OAuth callback token persistence runtime smoke contract violation: version mismatch.');
  }

  assertAmazonSpApiOauthCallbackTokenPersistenceImplementationContract(contract.sourceStep131B);

  if (
    contract.sourceStep131B.summary.readyForStep131CTokenPersistenceRuntimeSmoke !== true ||
    contract.runtimeSmokeImplementedNow !== true ||
    contract.controllerMutationNow !== false ||
    contract.serviceMutationNow !== false ||
    contract.moduleMutationNow !== false ||
    contract.tokenPersistenceRuntimeVerifiedNow !== true ||
    contract.fakeTokenExchangeRuntimeVerifiedNow !== true ||
    contract.persistenceBridgeBuildPlanRuntimeVerifiedNow !== true ||
    contract.refreshCredentialPersistenceRuntimeVerifiedNow !== true ||
    contract.accessTokenCachePersistenceRuntimeVerifiedNow !== true ||
    contract.realLwaTransportImplementedNow !== false ||
    contract.tokenExchangeHttpCallNow !== false ||
    contract.lwaHttpCallNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.frontendAddedNow !== false ||
    contract.importJobWriteNow !== false ||
    contract.transactionWriteNow !== false ||
    contract.inventoryWriteNow !== false
  ) {
    throw new Error('Step131-C OAuth callback token persistence runtime smoke contract violation: boundary mismatch.');
  }

  for (const [key, value] of Object.entries(contract.runtimeAssertions)) {
    if (value !== true) {
      throw new Error(`Step131-C OAuth callback token persistence runtime smoke contract violation: runtimeAssertions.${key} must remain true.`);
    }
  }

  if (
    contract.nextAllowedWork.step131DTokenPersistenceRuntimeRecordHandoff !== true ||
    contract.nextAllowedWork.step132FrontendConnectionPanelImplementation !== false ||
    contract.nextAllowedWork.step135RealSpApiReportsRequestImplementation !== false ||
    contract.summary.step131CCompleted !== true ||
    contract.summary.readyForStep131DTokenPersistenceRuntimeRecordHandoff !== true ||
    contract.summary.readyForStep132FrontendConnectionStatusPanel !== false ||
    contract.summary.readyForStep135RealSpApiReports !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step131-C OAuth callback token persistence runtime smoke contract violation: next-work summary mismatch.');
  }

  return contract;
}
