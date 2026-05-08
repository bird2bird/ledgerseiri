import {
  assertAmazonSpApiOauthCallbackTokenPersistenceRuntimeSmokeContract,
  buildAmazonSpApiOauthCallbackTokenPersistenceRuntimeSmokeContract,
  type AmazonSpApiOauthCallbackTokenPersistenceRuntimeSmokeContract,
} from './amazon-sp-api-oauth-callback-token-persistence-runtime-smoke-contract.dto';

export const AMAZON_SP_API_OAUTH_CALLBACK_TOKEN_PERSISTENCE_RUNTIME_RECORD_HANDOFF_CONTRACT_VERSION =
  'amazon-sp-api-oauth-callback-token-persistence-runtime-record-handoff-contract-v1' as const;

export type AmazonSpApiOauthCallbackTokenPersistenceRuntimeRecordHandoffContract = {
  version: typeof AMAZON_SP_API_OAUTH_CALLBACK_TOKEN_PERSISTENCE_RUNTIME_RECORD_HANDOFF_CONTRACT_VERSION;
  sourceStep131C: AmazonSpApiOauthCallbackTokenPersistenceRuntimeSmokeContract;

  runtimeRecordImplementedNow: true;
  oauthCallbackTokenPersistencePhaseCompletedNow: true;

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

  completedPhaseAssertions: {
    step131AContractCompleted: true;
    step131BImplementationCompleted: true;
    step131CRuntimeSmokeCompleted: true;
    callbackCodePathReturnsTokenPersistenceCompleted: true;
    callbackSpapiOauthCodePathReturnsTokenPersistenceCompleted: true;
    rejectPathsDoNotPersistTokens: true;
    refreshCredentialPersisted: true;
    accessTokenCachePersisted: true;
    tokenPersistenceDatabaseWriteNowTrue: true;
    tokenPersistencePendingFalse: true;
    tokenExchangeHttpCallFalse: true;
    realSpApiRequestFalse: true;
    noRawAuthorizationCodeLeak: true;
    noRawSpapiOauthCodeLeak: true;
    noRawRefreshTokenLeak: true;
    noRawAccessTokenLeak: true;
    noClientSecretLeak: true;
  };

  phaseCorrectRegressionPolicy: {
    keepStep131CRuntimeSmokeActive: true;
    keepStep131BImplementationContractActive: true;
    keepStep131AContractActive: true;
    keepStep130DRecordActive: true;
    keepStep130CRuntimeSmokeActive: true;
    keepStep130BImplementationContractActive: true;
    keepStep130AIntegrationContractActive: true;
    keepStep127CRuntimeSmokeActive: true;
    keepStep123EPhaseAwarePreflightRegressionActive: true;

    allowCallbackTokenPersistenceWiring: true;
    allowEncryptedRefreshCredentialPersistence: true;
    allowEncryptedAccessTokenCachePersistence: true;
    forbidRealLwaHttpBeforeExplicitLaterStep: true;
    forbidRealSpApiReportsBeforeStep135: true;
    forbidFrontendConnectionPanelBeforeStep132: true;
    forbidCommittedSalesImportNow: true;
    forbidInventoryExecutionNow: true;
  };

  nextAllowedWork: {
    step132AFrontendConnectionStatusPanelContract: true;
    step132BFrontendConnectionStatusPanelImplementation: false;
    step135RealSpApiReportsRequestImplementation: false;
  };

  summary: {
    step131DCompleted: true;
    oauthCallbackTokenPersistencePhaseCompleted: true;
    readyForStep132AFrontendConnectionStatusPanelContract: true;
    readyForStep132BFrontendConnectionStatusPanelImplementation: false;
    readyForStep135RealSpApiReports: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiOauthCallbackTokenPersistenceRuntimeRecordHandoffContract(): AmazonSpApiOauthCallbackTokenPersistenceRuntimeRecordHandoffContract {
  const sourceStep131C = assertAmazonSpApiOauthCallbackTokenPersistenceRuntimeSmokeContract(
    buildAmazonSpApiOauthCallbackTokenPersistenceRuntimeSmokeContract(),
  );

  return {
    version: AMAZON_SP_API_OAUTH_CALLBACK_TOKEN_PERSISTENCE_RUNTIME_RECORD_HANDOFF_CONTRACT_VERSION,
    sourceStep131C,

    runtimeRecordImplementedNow: true,
    oauthCallbackTokenPersistencePhaseCompletedNow: true,

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

    completedPhaseAssertions: {
      step131AContractCompleted: true,
      step131BImplementationCompleted: true,
      step131CRuntimeSmokeCompleted: true,
      callbackCodePathReturnsTokenPersistenceCompleted: true,
      callbackSpapiOauthCodePathReturnsTokenPersistenceCompleted: true,
      rejectPathsDoNotPersistTokens: true,
      refreshCredentialPersisted: true,
      accessTokenCachePersisted: true,
      tokenPersistenceDatabaseWriteNowTrue: true,
      tokenPersistencePendingFalse: true,
      tokenExchangeHttpCallFalse: true,
      realSpApiRequestFalse: true,
      noRawAuthorizationCodeLeak: true,
      noRawSpapiOauthCodeLeak: true,
      noRawRefreshTokenLeak: true,
      noRawAccessTokenLeak: true,
      noClientSecretLeak: true,
    },

    phaseCorrectRegressionPolicy: {
      keepStep131CRuntimeSmokeActive: true,
      keepStep131BImplementationContractActive: true,
      keepStep131AContractActive: true,
      keepStep130DRecordActive: true,
      keepStep130CRuntimeSmokeActive: true,
      keepStep130BImplementationContractActive: true,
      keepStep130AIntegrationContractActive: true,
      keepStep127CRuntimeSmokeActive: true,
      keepStep123EPhaseAwarePreflightRegressionActive: true,

      allowCallbackTokenPersistenceWiring: true,
      allowEncryptedRefreshCredentialPersistence: true,
      allowEncryptedAccessTokenCachePersistence: true,
      forbidRealLwaHttpBeforeExplicitLaterStep: true,
      forbidRealSpApiReportsBeforeStep135: true,
      forbidFrontendConnectionPanelBeforeStep132: true,
      forbidCommittedSalesImportNow: true,
      forbidInventoryExecutionNow: true,
    },

    nextAllowedWork: {
      step132AFrontendConnectionStatusPanelContract: true,
      step132BFrontendConnectionStatusPanelImplementation: false,
      step135RealSpApiReportsRequestImplementation: false,
    },

    summary: {
      step131DCompleted: true,
      oauthCallbackTokenPersistencePhaseCompleted: true,
      readyForStep132AFrontendConnectionStatusPanelContract: true,
      readyForStep132BFrontendConnectionStatusPanelImplementation: false,
      readyForStep135RealSpApiReports: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiOauthCallbackTokenPersistenceRuntimeRecordHandoffContract(
  contract: AmazonSpApiOauthCallbackTokenPersistenceRuntimeRecordHandoffContract,
): AmazonSpApiOauthCallbackTokenPersistenceRuntimeRecordHandoffContract {
  if (contract.version !== AMAZON_SP_API_OAUTH_CALLBACK_TOKEN_PERSISTENCE_RUNTIME_RECORD_HANDOFF_CONTRACT_VERSION) {
    throw new Error('Step131-D OAuth callback token persistence runtime record/handoff contract violation: version mismatch.');
  }

  assertAmazonSpApiOauthCallbackTokenPersistenceRuntimeSmokeContract(contract.sourceStep131C);

  if (
    contract.sourceStep131C.summary.readyForStep131DTokenPersistenceRuntimeRecordHandoff !== true ||
    contract.runtimeRecordImplementedNow !== true ||
    contract.oauthCallbackTokenPersistencePhaseCompletedNow !== true ||
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
    throw new Error('Step131-D OAuth callback token persistence runtime record/handoff contract violation: boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    completedPhaseAssertions: contract.completedPhaseAssertions,
    phaseCorrectRegressionPolicy: contract.phaseCorrectRegressionPolicy,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step131-D OAuth callback token persistence runtime record/handoff contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.nextAllowedWork.step132AFrontendConnectionStatusPanelContract !== true ||
    contract.nextAllowedWork.step132BFrontendConnectionStatusPanelImplementation !== false ||
    contract.nextAllowedWork.step135RealSpApiReportsRequestImplementation !== false ||
    contract.summary.step131DCompleted !== true ||
    contract.summary.oauthCallbackTokenPersistencePhaseCompleted !== true ||
    contract.summary.readyForStep132AFrontendConnectionStatusPanelContract !== true ||
    contract.summary.readyForStep132BFrontendConnectionStatusPanelImplementation !== false ||
    contract.summary.readyForStep135RealSpApiReports !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step131-D OAuth callback token persistence runtime record/handoff contract violation: next-work summary mismatch.');
  }

  return contract;
}
