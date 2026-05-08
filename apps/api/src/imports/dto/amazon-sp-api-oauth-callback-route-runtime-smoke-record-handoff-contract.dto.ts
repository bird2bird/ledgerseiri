import {
  assertAmazonSpApiOauthCallbackRouteRuntimeSmokeContract,
  buildAmazonSpApiOauthCallbackRouteRuntimeSmokeContract,
  type AmazonSpApiOauthCallbackRouteRuntimeSmokeContract,
} from './amazon-sp-api-oauth-callback-route-runtime-smoke-contract.dto';

export const AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_RUNTIME_SMOKE_RECORD_HANDOFF_CONTRACT_VERSION =
  'amazon-sp-api-oauth-callback-route-runtime-smoke-record-handoff-contract-v1' as const;

export type AmazonSpApiOauthCallbackRouteRuntimeSmokeRecordHandoffContract = {
  version: typeof AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_RUNTIME_SMOKE_RECORD_HANDOFF_CONTRACT_VERSION;
  sourceStep127C: AmazonSpApiOauthCallbackRouteRuntimeSmokeContract;

  runtimeSmokeRecordImplementedNow: true;
  oauthCallbackRouteBoundaryPhaseCompletedNow: true;

  observedRuntimeSmokePassed: true;
  observedRuntimeSmokeContractPassed: true;

  authorizationRouteAddedNow: false;
  tokenExchangeServiceImplementedNow: false;
  tokenExchangeHttpCallNow: false;
  lwaHttpCallNow: false;
  tokenPersistenceDatabaseWriteNow: false;
  frontendAddedNow: false;
  realSpApiRequestNow: false;
  importJobWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;

  recordedRuntimeAssertions: {
    callbackErrorReturnsSanitizedFailure: true;
    missingStateReturnsSanitizedFailure: true;
    missingAuthorizationCodeReturnsSanitizedFailure: true;
    missingSellingPartnerIdReturnsSanitizedFailure: true;
    codeSuccessReturnsAcceptedForTokenExchangeLater: true;
    spapiOauthCodeSuccessReturnsAcceptedForTokenExchangeLater: true;
    spapiOauthCodeUsedFlagVerified: true;
    bridgeServiceReadyFlagVerified: true;
    noAuthorizationCodeLeak: true;
    noRefreshTokenLeak: true;
    noAccessTokenLeak: true;
    noEncryptedTokenLeak: true;
    noLwaHttpCall: true;
    noTokenDatabaseWrite: true;
  };

  phaseCorrectRegressionPolicy: {
    keepStep127BImplementationContractActive: true;
    keepStep127CRuntimeSmokeActive: true;
    keepStep127CRuntimeSmokeContractActive: true;
    keepStep126COauthStatePersistenceBridgeRuntimeActive: true;
    keepStep125CTokenPersistenceRuntimeActive: true;
    keepStep124GMigrationDeployExecutionRecordActive: true;

    forbidOldNoRoutePreimplementationRegressionAsPrimary: true;
    forbidLwaTokenExchangeBeforeStep128: true;
    forbidTokenPersistenceFromCallbackBeforeStep130: true;
    forbidFrontendConnectionPanelBeforeStep132: true;
    forbidRealSpApiReportsBeforeStep135: true;
  };

  nextAllowedWork: {
    step128ATokenExchangeServicePreimplementationContract: true;
    step128BTokenExchangeServiceFakeTransportImplementation: false;
    authorizationUrlRouteImplementation: false;
    callbackRoutePersistenceIntegration: false;
    frontendConnectionPanelImplementation: false;
    realSpApiReportsRequestImplementation: false;
  };

  summary: {
    step127DCompleted: true;
    oauthCallbackRouteBoundaryPhaseCompleted: true;
    readyForStep128ATokenExchangeServicePreimplementationContract: true;
    readyForStep128BTokenExchangeServiceFakeTransportImplementation: false;
    readyForStep130CallbackRoutePersistenceIntegration: false;
    readyForStep132FrontendConnectionStatusPanel: false;
    readyForStep135RealSpApiReports: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiOauthCallbackRouteRuntimeSmokeRecordHandoffContract(): AmazonSpApiOauthCallbackRouteRuntimeSmokeRecordHandoffContract {
  const sourceStep127C = assertAmazonSpApiOauthCallbackRouteRuntimeSmokeContract(
    buildAmazonSpApiOauthCallbackRouteRuntimeSmokeContract(),
  );

  return {
    version: AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_RUNTIME_SMOKE_RECORD_HANDOFF_CONTRACT_VERSION,
    sourceStep127C,

    runtimeSmokeRecordImplementedNow: true,
    oauthCallbackRouteBoundaryPhaseCompletedNow: true,

    observedRuntimeSmokePassed: true,
    observedRuntimeSmokeContractPassed: true,

    authorizationRouteAddedNow: false,
    tokenExchangeServiceImplementedNow: false,
    tokenExchangeHttpCallNow: false,
    lwaHttpCallNow: false,
    tokenPersistenceDatabaseWriteNow: false,
    frontendAddedNow: false,
    realSpApiRequestNow: false,
    importJobWriteNow: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,

    recordedRuntimeAssertions: {
      callbackErrorReturnsSanitizedFailure: true,
      missingStateReturnsSanitizedFailure: true,
      missingAuthorizationCodeReturnsSanitizedFailure: true,
      missingSellingPartnerIdReturnsSanitizedFailure: true,
      codeSuccessReturnsAcceptedForTokenExchangeLater: true,
      spapiOauthCodeSuccessReturnsAcceptedForTokenExchangeLater: true,
      spapiOauthCodeUsedFlagVerified: true,
      bridgeServiceReadyFlagVerified: true,
      noAuthorizationCodeLeak: true,
      noRefreshTokenLeak: true,
      noAccessTokenLeak: true,
      noEncryptedTokenLeak: true,
      noLwaHttpCall: true,
      noTokenDatabaseWrite: true,
    },

    phaseCorrectRegressionPolicy: {
      keepStep127BImplementationContractActive: true,
      keepStep127CRuntimeSmokeActive: true,
      keepStep127CRuntimeSmokeContractActive: true,
      keepStep126COauthStatePersistenceBridgeRuntimeActive: true,
      keepStep125CTokenPersistenceRuntimeActive: true,
      keepStep124GMigrationDeployExecutionRecordActive: true,

      forbidOldNoRoutePreimplementationRegressionAsPrimary: true,
      forbidLwaTokenExchangeBeforeStep128: true,
      forbidTokenPersistenceFromCallbackBeforeStep130: true,
      forbidFrontendConnectionPanelBeforeStep132: true,
      forbidRealSpApiReportsBeforeStep135: true,
    },

    nextAllowedWork: {
      step128ATokenExchangeServicePreimplementationContract: true,
      step128BTokenExchangeServiceFakeTransportImplementation: false,
      authorizationUrlRouteImplementation: false,
      callbackRoutePersistenceIntegration: false,
      frontendConnectionPanelImplementation: false,
      realSpApiReportsRequestImplementation: false,
    },

    summary: {
      step127DCompleted: true,
      oauthCallbackRouteBoundaryPhaseCompleted: true,
      readyForStep128ATokenExchangeServicePreimplementationContract: true,
      readyForStep128BTokenExchangeServiceFakeTransportImplementation: false,
      readyForStep130CallbackRoutePersistenceIntegration: false,
      readyForStep132FrontendConnectionStatusPanel: false,
      readyForStep135RealSpApiReports: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiOauthCallbackRouteRuntimeSmokeRecordHandoffContract(
  contract: AmazonSpApiOauthCallbackRouteRuntimeSmokeRecordHandoffContract,
): AmazonSpApiOauthCallbackRouteRuntimeSmokeRecordHandoffContract {
  if (contract.version !== AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_RUNTIME_SMOKE_RECORD_HANDOFF_CONTRACT_VERSION) {
    throw new Error('Step127-D OAuth callback route runtime smoke record/handoff contract violation: version mismatch.');
  }

  assertAmazonSpApiOauthCallbackRouteRuntimeSmokeContract(contract.sourceStep127C);

  if (
    contract.runtimeSmokeRecordImplementedNow !== true ||
    contract.oauthCallbackRouteBoundaryPhaseCompletedNow !== true ||
    contract.observedRuntimeSmokePassed !== true ||
    contract.observedRuntimeSmokeContractPassed !== true ||
    contract.authorizationRouteAddedNow !== false ||
    contract.tokenExchangeServiceImplementedNow !== false ||
    contract.tokenExchangeHttpCallNow !== false ||
    contract.lwaHttpCallNow !== false ||
    contract.tokenPersistenceDatabaseWriteNow !== false ||
    contract.frontendAddedNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.importJobWriteNow !== false ||
    contract.transactionWriteNow !== false ||
    contract.inventoryWriteNow !== false
  ) {
    throw new Error('Step127-D OAuth callback route runtime smoke record/handoff contract violation: boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    recordedRuntimeAssertions: contract.recordedRuntimeAssertions,
    phaseCorrectRegressionPolicy: contract.phaseCorrectRegressionPolicy,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step127-D OAuth callback route runtime smoke record/handoff contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.nextAllowedWork.step128ATokenExchangeServicePreimplementationContract !== true ||
    contract.nextAllowedWork.step128BTokenExchangeServiceFakeTransportImplementation !== false ||
    contract.nextAllowedWork.authorizationUrlRouteImplementation !== false ||
    contract.nextAllowedWork.callbackRoutePersistenceIntegration !== false ||
    contract.nextAllowedWork.frontendConnectionPanelImplementation !== false ||
    contract.nextAllowedWork.realSpApiReportsRequestImplementation !== false ||
    contract.summary.step127DCompleted !== true ||
    contract.summary.oauthCallbackRouteBoundaryPhaseCompleted !== true ||
    contract.summary.readyForStep128ATokenExchangeServicePreimplementationContract !== true ||
    contract.summary.readyForStep128BTokenExchangeServiceFakeTransportImplementation !== false ||
    contract.summary.readyForStep130CallbackRoutePersistenceIntegration !== false ||
    contract.summary.readyForStep132FrontendConnectionStatusPanel !== false ||
    contract.summary.readyForStep135RealSpApiReports !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step127-D OAuth callback route runtime smoke record/handoff contract violation: next-work summary mismatch.');
  }

  return contract;
}
