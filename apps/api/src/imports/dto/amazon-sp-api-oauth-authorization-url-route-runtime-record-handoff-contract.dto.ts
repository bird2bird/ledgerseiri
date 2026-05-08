import {
  assertAmazonSpApiOauthAuthorizationUrlRouteRuntimeSmokeContract,
  buildAmazonSpApiOauthAuthorizationUrlRouteRuntimeSmokeContract,
  type AmazonSpApiOauthAuthorizationUrlRouteRuntimeSmokeContract,
} from './amazon-sp-api-oauth-authorization-url-route-runtime-smoke-contract.dto';

export const AMAZON_SP_API_OAUTH_AUTHORIZATION_URL_ROUTE_RUNTIME_RECORD_HANDOFF_CONTRACT_VERSION =
  'amazon-sp-api-oauth-authorization-url-route-runtime-record-handoff-contract-v1' as const;

export type AmazonSpApiOauthAuthorizationUrlRouteRuntimeRecordHandoffContract = {
  version: typeof AMAZON_SP_API_OAUTH_AUTHORIZATION_URL_ROUTE_RUNTIME_RECORD_HANDOFF_CONTRACT_VERSION;
  sourceStep129C: AmazonSpApiOauthAuthorizationUrlRouteRuntimeSmokeContract;

  runtimeRecordImplementedNow: true;
  authorizationUrlRoutePhaseCompletedNow: true;

  serviceLogicChangedNow: false;
  controllerRouteChangedNow: false;
  moduleChangedNow: false;

  oauthStateDatabaseWriteNow: false;
  tokenExchangeHttpCallNow: false;
  tokenPersistenceDatabaseWriteNow: false;
  frontendAddedNow: false;
  realSpApiRequestNow: false;
  realAmazonRedirectNow: false;
  importJobWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;

  completedPhaseAssertions: {
    step129AContractFinished: true;
    step129BRouteImplemented: true;
    step129CRuntimeSmokePassed: true;
    authorizationUrlRouteJwtGuarded: true;
    authorizationUrlServiceRegistered: true;
    authorizationUrlContainsSellerCentralConsentBase: true;
    authorizationUrlContainsApplicationId: true;
    authorizationUrlContainsState: true;
    authorizationUrlContainsMarketplaceAndRegion: true;
    missingRequiredFieldsRejected: true;
    noClientSecretLeak: true;
    noRawStateJsonLeak: true;
    noOAuthStateDbWrite: true;
    noTokenExchangeHttpCall: true;
    noTokenPersistenceDbWrite: true;
    noRealAmazonRedirect: true;
    noRealSpApiRequest: true;
  };

  phaseCorrectRegressionPolicy: {
    keepStep129CRuntimeSmokeActive: true;
    keepStep129BImplementationContractActive: true;
    keepStep129AContractActive: true;
    keepStep128DFakeTransportRecordActive: true;
    keepStep123EPhaseAwarePreflightRegressionActive: true;

    allowAuthorizationUrlRouteAndService: true;
    forbidOAuthStateDbWriteBeforeExplicitStep: true;
    forbidTokenExchangeCallbackIntegrationBeforeStep130: true;
    forbidTokenPersistenceFromCallbackBeforeStep130: true;
    forbidFrontendConnectionPanelBeforeStep132: true;
    forbidRealSpApiReportsBeforeStep135: true;
    forbidCommittedSalesImportNow: true;
    forbidInventoryExecutionNow: true;
  };

  nextAllowedWork: {
    step130ACallbackRouteFakeTokenExchangeIntegrationContract: true;
    step130BCallbackRouteFakeTokenExchangeIntegration: false;
    step130CTokenPersistenceFromCallback: false;
    step132FrontendConnectionPanelImplementation: false;
    step135RealSpApiReportsRequestImplementation: false;
  };

  summary: {
    step129DCompleted: true;
    authorizationUrlRoutePhaseCompleted: true;
    readyForStep130ACallbackRouteFakeTokenExchangeIntegrationContract: true;
    readyForStep130BCallbackRouteFakeTokenExchangeIntegration: false;
    readyForStep130CTokenPersistenceFromCallback: false;
    readyForStep132FrontendConnectionStatusPanel: false;
    readyForStep135RealSpApiReports: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiOauthAuthorizationUrlRouteRuntimeRecordHandoffContract(): AmazonSpApiOauthAuthorizationUrlRouteRuntimeRecordHandoffContract {
  const sourceStep129C = assertAmazonSpApiOauthAuthorizationUrlRouteRuntimeSmokeContract(
    buildAmazonSpApiOauthAuthorizationUrlRouteRuntimeSmokeContract(),
  );

  return {
    version: AMAZON_SP_API_OAUTH_AUTHORIZATION_URL_ROUTE_RUNTIME_RECORD_HANDOFF_CONTRACT_VERSION,
    sourceStep129C,

    runtimeRecordImplementedNow: true,
    authorizationUrlRoutePhaseCompletedNow: true,

    serviceLogicChangedNow: false,
    controllerRouteChangedNow: false,
    moduleChangedNow: false,

    oauthStateDatabaseWriteNow: false,
    tokenExchangeHttpCallNow: false,
    tokenPersistenceDatabaseWriteNow: false,
    frontendAddedNow: false,
    realSpApiRequestNow: false,
    realAmazonRedirectNow: false,
    importJobWriteNow: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,

    completedPhaseAssertions: {
      step129AContractFinished: true,
      step129BRouteImplemented: true,
      step129CRuntimeSmokePassed: true,
      authorizationUrlRouteJwtGuarded: true,
      authorizationUrlServiceRegistered: true,
      authorizationUrlContainsSellerCentralConsentBase: true,
      authorizationUrlContainsApplicationId: true,
      authorizationUrlContainsState: true,
      authorizationUrlContainsMarketplaceAndRegion: true,
      missingRequiredFieldsRejected: true,
      noClientSecretLeak: true,
      noRawStateJsonLeak: true,
      noOAuthStateDbWrite: true,
      noTokenExchangeHttpCall: true,
      noTokenPersistenceDbWrite: true,
      noRealAmazonRedirect: true,
      noRealSpApiRequest: true,
    },

    phaseCorrectRegressionPolicy: {
      keepStep129CRuntimeSmokeActive: true,
      keepStep129BImplementationContractActive: true,
      keepStep129AContractActive: true,
      keepStep128DFakeTransportRecordActive: true,
      keepStep123EPhaseAwarePreflightRegressionActive: true,

      allowAuthorizationUrlRouteAndService: true,
      forbidOAuthStateDbWriteBeforeExplicitStep: true,
      forbidTokenExchangeCallbackIntegrationBeforeStep130: true,
      forbidTokenPersistenceFromCallbackBeforeStep130: true,
      forbidFrontendConnectionPanelBeforeStep132: true,
      forbidRealSpApiReportsBeforeStep135: true,
      forbidCommittedSalesImportNow: true,
      forbidInventoryExecutionNow: true,
    },

    nextAllowedWork: {
      step130ACallbackRouteFakeTokenExchangeIntegrationContract: true,
      step130BCallbackRouteFakeTokenExchangeIntegration: false,
      step130CTokenPersistenceFromCallback: false,
      step132FrontendConnectionPanelImplementation: false,
      step135RealSpApiReportsRequestImplementation: false,
    },

    summary: {
      step129DCompleted: true,
      authorizationUrlRoutePhaseCompleted: true,
      readyForStep130ACallbackRouteFakeTokenExchangeIntegrationContract: true,
      readyForStep130BCallbackRouteFakeTokenExchangeIntegration: false,
      readyForStep130CTokenPersistenceFromCallback: false,
      readyForStep132FrontendConnectionStatusPanel: false,
      readyForStep135RealSpApiReports: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiOauthAuthorizationUrlRouteRuntimeRecordHandoffContract(
  contract: AmazonSpApiOauthAuthorizationUrlRouteRuntimeRecordHandoffContract,
): AmazonSpApiOauthAuthorizationUrlRouteRuntimeRecordHandoffContract {
  if (contract.version !== AMAZON_SP_API_OAUTH_AUTHORIZATION_URL_ROUTE_RUNTIME_RECORD_HANDOFF_CONTRACT_VERSION) {
    throw new Error('Step129-D OAuth authorization URL route runtime record/handoff contract violation: version mismatch.');
  }

  assertAmazonSpApiOauthAuthorizationUrlRouteRuntimeSmokeContract(contract.sourceStep129C);

  if (
    contract.sourceStep129C.summary.readyForStep129DAuthorizationUrlRouteRuntimeRecordHandoff !== true ||
    contract.runtimeRecordImplementedNow !== true ||
    contract.authorizationUrlRoutePhaseCompletedNow !== true ||
    contract.serviceLogicChangedNow !== false ||
    contract.controllerRouteChangedNow !== false ||
    contract.moduleChangedNow !== false ||
    contract.oauthStateDatabaseWriteNow !== false ||
    contract.tokenExchangeHttpCallNow !== false ||
    contract.tokenPersistenceDatabaseWriteNow !== false ||
    contract.frontendAddedNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.realAmazonRedirectNow !== false ||
    contract.importJobWriteNow !== false ||
    contract.transactionWriteNow !== false ||
    contract.inventoryWriteNow !== false
  ) {
    throw new Error('Step129-D OAuth authorization URL route runtime record/handoff contract violation: boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    completedPhaseAssertions: contract.completedPhaseAssertions,
    phaseCorrectRegressionPolicy: contract.phaseCorrectRegressionPolicy,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step129-D OAuth authorization URL route runtime record/handoff contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.nextAllowedWork.step130ACallbackRouteFakeTokenExchangeIntegrationContract !== true ||
    contract.nextAllowedWork.step130BCallbackRouteFakeTokenExchangeIntegration !== false ||
    contract.nextAllowedWork.step130CTokenPersistenceFromCallback !== false ||
    contract.nextAllowedWork.step132FrontendConnectionPanelImplementation !== false ||
    contract.nextAllowedWork.step135RealSpApiReportsRequestImplementation !== false ||
    contract.summary.step129DCompleted !== true ||
    contract.summary.authorizationUrlRoutePhaseCompleted !== true ||
    contract.summary.readyForStep130ACallbackRouteFakeTokenExchangeIntegrationContract !== true ||
    contract.summary.readyForStep130BCallbackRouteFakeTokenExchangeIntegration !== false ||
    contract.summary.readyForStep130CTokenPersistenceFromCallback !== false ||
    contract.summary.readyForStep132FrontendConnectionStatusPanel !== false ||
    contract.summary.readyForStep135RealSpApiReports !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step129-D OAuth authorization URL route runtime record/handoff contract violation: next-work summary mismatch.');
  }

  return contract;
}
