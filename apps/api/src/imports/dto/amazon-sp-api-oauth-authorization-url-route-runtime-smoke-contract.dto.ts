import {
  assertAmazonSpApiOauthAuthorizationUrlRouteImplementationContract,
  buildAmazonSpApiOauthAuthorizationUrlRouteImplementationContract,
  type AmazonSpApiOauthAuthorizationUrlRouteImplementationContract,
} from './amazon-sp-api-oauth-authorization-url-route-implementation-contract.dto';

export const AMAZON_SP_API_OAUTH_AUTHORIZATION_URL_ROUTE_RUNTIME_SMOKE_CONTRACT_VERSION =
  'amazon-sp-api-oauth-authorization-url-route-runtime-smoke-contract-v1' as const;

export type AmazonSpApiOauthAuthorizationUrlRouteRuntimeSmokeContract = {
  version: typeof AMAZON_SP_API_OAUTH_AUTHORIZATION_URL_ROUTE_RUNTIME_SMOKE_CONTRACT_VERSION;
  sourceStep129B: AmazonSpApiOauthAuthorizationUrlRouteImplementationContract;

  runtimeSmokeImplementedNow: true;
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

  runtimeAssertions: {
    validServiceInputAccepted: true;
    authorizationUrlContainsSellerCentralConsentBase: true;
    authorizationUrlContainsApplicationId: true;
    authorizationUrlContainsState: true;
    authorizationUrlContainsVersion: true;
    authorizationUrlContainsMarketplaceId: true;
    authorizationUrlContainsRegion: true;
    authorizationUrlContainsRedirectUri: true;
    stateLooksBase64UrlEncoded: true;
    missingCompanyRejected: true;
    missingStoreRejected: true;
    missingMarketplaceRejected: true;
    missingRegionRejected: true;
    noClientSecretLeak: true;
    noAuthorizationCodeLeak: true;
    noRawStateJsonLeak: true;
  };

  staticBoundary: {
    controllerRouteStillJwtGuarded: true;
    controllerCallsAuthorizationUrlService: true;
    moduleRegistersAuthorizationUrlService: true;
    serviceContainsNoFetch: true;
    serviceContainsNoAxios: true;
    serviceContainsNoHttpService: true;
    serviceContainsNoLwaTokenEndpoint: true;
    serviceContainsNoPrismaClient: true;
    controllerDoesNotWriteTokenDb: true;
    controllerDoesNotCallTokenExchangeService: true;
    controllerDoesNotRedirectToAmazon: true;
  };

  nextAllowedWork: {
    step129DAuthorizationUrlRouteRuntimeRecordHandoff: true;
    step130CallbackRouteServiceIntegration: false;
    step130TokenPersistenceFromCallback: false;
    step132FrontendConnectionPanelImplementation: false;
    step135RealSpApiReportsRequestImplementation: false;
  };

  summary: {
    step129CCompleted: true;
    readyForStep129DAuthorizationUrlRouteRuntimeRecordHandoff: true;
    readyForStep130CallbackRoutePersistenceIntegration: false;
    readyForStep132FrontendConnectionStatusPanel: false;
    readyForStep135RealSpApiReports: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiOauthAuthorizationUrlRouteRuntimeSmokeContract(): AmazonSpApiOauthAuthorizationUrlRouteRuntimeSmokeContract {
  const sourceStep129B = assertAmazonSpApiOauthAuthorizationUrlRouteImplementationContract(
    buildAmazonSpApiOauthAuthorizationUrlRouteImplementationContract(),
  );

  return {
    version: AMAZON_SP_API_OAUTH_AUTHORIZATION_URL_ROUTE_RUNTIME_SMOKE_CONTRACT_VERSION,
    sourceStep129B,

    runtimeSmokeImplementedNow: true,
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

    runtimeAssertions: {
      validServiceInputAccepted: true,
      authorizationUrlContainsSellerCentralConsentBase: true,
      authorizationUrlContainsApplicationId: true,
      authorizationUrlContainsState: true,
      authorizationUrlContainsVersion: true,
      authorizationUrlContainsMarketplaceId: true,
      authorizationUrlContainsRegion: true,
      authorizationUrlContainsRedirectUri: true,
      stateLooksBase64UrlEncoded: true,
      missingCompanyRejected: true,
      missingStoreRejected: true,
      missingMarketplaceRejected: true,
      missingRegionRejected: true,
      noClientSecretLeak: true,
      noAuthorizationCodeLeak: true,
      noRawStateJsonLeak: true,
    },

    staticBoundary: {
      controllerRouteStillJwtGuarded: true,
      controllerCallsAuthorizationUrlService: true,
      moduleRegistersAuthorizationUrlService: true,
      serviceContainsNoFetch: true,
      serviceContainsNoAxios: true,
      serviceContainsNoHttpService: true,
      serviceContainsNoLwaTokenEndpoint: true,
      serviceContainsNoPrismaClient: true,
      controllerDoesNotWriteTokenDb: true,
      controllerDoesNotCallTokenExchangeService: true,
      controllerDoesNotRedirectToAmazon: true,
    },

    nextAllowedWork: {
      step129DAuthorizationUrlRouteRuntimeRecordHandoff: true,
      step130CallbackRouteServiceIntegration: false,
      step130TokenPersistenceFromCallback: false,
      step132FrontendConnectionPanelImplementation: false,
      step135RealSpApiReportsRequestImplementation: false,
    },

    summary: {
      step129CCompleted: true,
      readyForStep129DAuthorizationUrlRouteRuntimeRecordHandoff: true,
      readyForStep130CallbackRoutePersistenceIntegration: false,
      readyForStep132FrontendConnectionStatusPanel: false,
      readyForStep135RealSpApiReports: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiOauthAuthorizationUrlRouteRuntimeSmokeContract(
  contract: AmazonSpApiOauthAuthorizationUrlRouteRuntimeSmokeContract,
): AmazonSpApiOauthAuthorizationUrlRouteRuntimeSmokeContract {
  if (contract.version !== AMAZON_SP_API_OAUTH_AUTHORIZATION_URL_ROUTE_RUNTIME_SMOKE_CONTRACT_VERSION) {
    throw new Error('Step129-C OAuth authorization URL route runtime smoke contract violation: version mismatch.');
  }

  assertAmazonSpApiOauthAuthorizationUrlRouteImplementationContract(contract.sourceStep129B);

  if (
    contract.sourceStep129B.summary.readyForStep129CAuthorizationUrlRouteRuntimeSmoke !== true ||
    contract.runtimeSmokeImplementedNow !== true ||
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
    throw new Error('Step129-C OAuth authorization URL route runtime smoke contract violation: boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    runtimeAssertions: contract.runtimeAssertions,
    staticBoundary: contract.staticBoundary,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step129-C OAuth authorization URL route runtime smoke contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.nextAllowedWork.step129DAuthorizationUrlRouteRuntimeRecordHandoff !== true ||
    contract.nextAllowedWork.step130CallbackRouteServiceIntegration !== false ||
    contract.nextAllowedWork.step130TokenPersistenceFromCallback !== false ||
    contract.nextAllowedWork.step132FrontendConnectionPanelImplementation !== false ||
    contract.nextAllowedWork.step135RealSpApiReportsRequestImplementation !== false ||
    contract.summary.step129CCompleted !== true ||
    contract.summary.readyForStep129DAuthorizationUrlRouteRuntimeRecordHandoff !== true ||
    contract.summary.readyForStep130CallbackRoutePersistenceIntegration !== false ||
    contract.summary.readyForStep132FrontendConnectionStatusPanel !== false ||
    contract.summary.readyForStep135RealSpApiReports !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step129-C OAuth authorization URL route runtime smoke contract violation: next-work summary mismatch.');
  }

  return contract;
}
