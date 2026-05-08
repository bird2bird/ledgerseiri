import {
  assertAmazonSpApiOauthAuthorizationUrlRouteContract,
  buildAmazonSpApiOauthAuthorizationUrlRouteContract,
  type AmazonSpApiOauthAuthorizationUrlRouteContract,
} from './amazon-sp-api-oauth-authorization-url-route-contract.dto';

export const AMAZON_SP_API_OAUTH_AUTHORIZATION_URL_ROUTE_IMPLEMENTATION_CONTRACT_VERSION =
  'amazon-sp-api-oauth-authorization-url-route-implementation-contract-v1' as const;

export type AmazonSpApiOauthAuthorizationUrlRouteImplementationContract = {
  version: typeof AMAZON_SP_API_OAUTH_AUTHORIZATION_URL_ROUTE_IMPLEMENTATION_CONTRACT_VERSION;
  sourceStep129A: AmazonSpApiOauthAuthorizationUrlRouteContract;

  routeImplementedNow: true;
  controllerMutationNow: true;
  serviceImplementationNow: true;
  providerRegisteredNow: true;
  authorizationUrlBuilderImplementedNow: true;

  oauthStateDatabaseWriteNow: false;
  tokenExchangeHttpCallNow: false;
  tokenPersistenceDatabaseWriteNow: false;
  frontendAddedNow: false;
  realSpApiRequestNow: false;
  realAmazonRedirectNow: false;
  importJobWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;

  implementedRoute: {
    method: 'GET';
    path: '/api/imports/amazon-sp-api/oauth/authorization-url';
    jwtGuardRequired: true;
    companyIdRequiredFromRequestUser: true;
    storeIdRequiredFromQuery: true;
    marketplaceIdRequiredFromQuery: true;
    regionRequiredFromQuery: true;
  };

  implementedService: {
    serviceName: 'AmazonSpApiOauthAuthorizationUrlService';
    serviceFile: 'apps/api/src/imports/amazon-sp-api-oauth-authorization-url.service.ts';
    methodName: 'buildAuthorizationUrl';
    providerRegisteredInImportsModule: true;
    exportedFromImportsModule: true;
  };

  responseBoundary: {
    returnsAuthorizationUrl: true;
    returnsStateIssued: true;
    returnsStateExpiresAt: true;
    returnsRedirectUri: true;
    returnsMarketplaceId: true;
    returnsRegion: true;
    returnsStoreId: true;
    returnsSandboxFlag: true;
    returnsSanitizedResultOnly: true;
    doesNotExposeClientSecret: true;
    doesNotExposeRawStateJson: true;
  };

  securityBoundary: {
    noOAuthStateDbWrite: true;
    noTokenExchangeHttpCall: true;
    noTokenPersistenceDbWrite: true;
    noRealAmazonRedirect: true;
    noFrontendMutation: true;
    noRealSpApiRequest: true;
    callbackRouteNotIntegratedWithTokenExchange: true;
  };

  nextAllowedWork: {
    step129CAuthorizationUrlRouteRuntimeSmoke: true;
    step129DAuthorizationUrlRouteRuntimeRecordHandoff: false;
    step130CallbackRouteServiceIntegration: false;
    step130TokenPersistenceFromCallback: false;
    step132FrontendConnectionPanelImplementation: false;
    step135RealSpApiReportsRequestImplementation: false;
  };

  summary: {
    step129BCompleted: true;
    readyForStep129CAuthorizationUrlRouteRuntimeSmoke: true;
    readyForStep129DAuthorizationUrlRouteRuntimeRecordHandoff: false;
    readyForStep130CallbackRoutePersistenceIntegration: false;
    readyForStep132FrontendConnectionStatusPanel: false;
    readyForStep135RealSpApiReports: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiOauthAuthorizationUrlRouteImplementationContract(): AmazonSpApiOauthAuthorizationUrlRouteImplementationContract {
  const sourceStep129A = assertAmazonSpApiOauthAuthorizationUrlRouteContract(
    buildAmazonSpApiOauthAuthorizationUrlRouteContract(),
  );

  return {
    version: AMAZON_SP_API_OAUTH_AUTHORIZATION_URL_ROUTE_IMPLEMENTATION_CONTRACT_VERSION,
    sourceStep129A,

    routeImplementedNow: true,
    controllerMutationNow: true,
    serviceImplementationNow: true,
    providerRegisteredNow: true,
    authorizationUrlBuilderImplementedNow: true,

    oauthStateDatabaseWriteNow: false,
    tokenExchangeHttpCallNow: false,
    tokenPersistenceDatabaseWriteNow: false,
    frontendAddedNow: false,
    realSpApiRequestNow: false,
    realAmazonRedirectNow: false,
    importJobWriteNow: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,

    implementedRoute: {
      method: 'GET',
      path: '/api/imports/amazon-sp-api/oauth/authorization-url',
      jwtGuardRequired: true,
      companyIdRequiredFromRequestUser: true,
      storeIdRequiredFromQuery: true,
      marketplaceIdRequiredFromQuery: true,
      regionRequiredFromQuery: true,
    },

    implementedService: {
      serviceName: 'AmazonSpApiOauthAuthorizationUrlService',
      serviceFile: 'apps/api/src/imports/amazon-sp-api-oauth-authorization-url.service.ts',
      methodName: 'buildAuthorizationUrl',
      providerRegisteredInImportsModule: true,
      exportedFromImportsModule: true,
    },

    responseBoundary: {
      returnsAuthorizationUrl: true,
      returnsStateIssued: true,
      returnsStateExpiresAt: true,
      returnsRedirectUri: true,
      returnsMarketplaceId: true,
      returnsRegion: true,
      returnsStoreId: true,
      returnsSandboxFlag: true,
      returnsSanitizedResultOnly: true,
      doesNotExposeClientSecret: true,
      doesNotExposeRawStateJson: true,
    },

    securityBoundary: {
      noOAuthStateDbWrite: true,
      noTokenExchangeHttpCall: true,
      noTokenPersistenceDbWrite: true,
      noRealAmazonRedirect: true,
      noFrontendMutation: true,
      noRealSpApiRequest: true,
      callbackRouteNotIntegratedWithTokenExchange: true,
    },

    nextAllowedWork: {
      step129CAuthorizationUrlRouteRuntimeSmoke: true,
      step129DAuthorizationUrlRouteRuntimeRecordHandoff: false,
      step130CallbackRouteServiceIntegration: false,
      step130TokenPersistenceFromCallback: false,
      step132FrontendConnectionPanelImplementation: false,
      step135RealSpApiReportsRequestImplementation: false,
    },

    summary: {
      step129BCompleted: true,
      readyForStep129CAuthorizationUrlRouteRuntimeSmoke: true,
      readyForStep129DAuthorizationUrlRouteRuntimeRecordHandoff: false,
      readyForStep130CallbackRoutePersistenceIntegration: false,
      readyForStep132FrontendConnectionStatusPanel: false,
      readyForStep135RealSpApiReports: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiOauthAuthorizationUrlRouteImplementationContract(
  contract: AmazonSpApiOauthAuthorizationUrlRouteImplementationContract,
): AmazonSpApiOauthAuthorizationUrlRouteImplementationContract {
  if (contract.version !== AMAZON_SP_API_OAUTH_AUTHORIZATION_URL_ROUTE_IMPLEMENTATION_CONTRACT_VERSION) {
    throw new Error('Step129-B OAuth authorization URL route implementation contract violation: version mismatch.');
  }

  assertAmazonSpApiOauthAuthorizationUrlRouteContract(contract.sourceStep129A);

  if (
    contract.sourceStep129A.summary.readyForStep129BAuthorizationUrlRouteImplementation !== true ||
    contract.routeImplementedNow !== true ||
    contract.controllerMutationNow !== true ||
    contract.serviceImplementationNow !== true ||
    contract.providerRegisteredNow !== true ||
    contract.authorizationUrlBuilderImplementedNow !== true ||
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
    throw new Error('Step129-B OAuth authorization URL route implementation contract violation: boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    implementedRoute: contract.implementedRoute,
    implementedService: contract.implementedService,
    responseBoundary: contract.responseBoundary,
    securityBoundary: contract.securityBoundary,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (['method', 'path', 'serviceName', 'serviceFile', 'methodName'].includes(key)) {
        continue;
      }

      if (value !== true) {
        throw new Error(`Step129-B OAuth authorization URL route implementation contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.implementedRoute.method !== 'GET' ||
    contract.implementedRoute.path !== '/api/imports/amazon-sp-api/oauth/authorization-url' ||
    contract.implementedService.serviceName !== 'AmazonSpApiOauthAuthorizationUrlService' ||
    contract.implementedService.serviceFile !== 'apps/api/src/imports/amazon-sp-api-oauth-authorization-url.service.ts' ||
    contract.implementedService.methodName !== 'buildAuthorizationUrl'
  ) {
    throw new Error('Step129-B OAuth authorization URL route implementation contract violation: implementation shape mismatch.');
  }

  if (
    contract.nextAllowedWork.step129CAuthorizationUrlRouteRuntimeSmoke !== true ||
    contract.nextAllowedWork.step129DAuthorizationUrlRouteRuntimeRecordHandoff !== false ||
    contract.nextAllowedWork.step130CallbackRouteServiceIntegration !== false ||
    contract.nextAllowedWork.step130TokenPersistenceFromCallback !== false ||
    contract.nextAllowedWork.step132FrontendConnectionPanelImplementation !== false ||
    contract.nextAllowedWork.step135RealSpApiReportsRequestImplementation !== false ||
    contract.summary.step129BCompleted !== true ||
    contract.summary.readyForStep129CAuthorizationUrlRouteRuntimeSmoke !== true ||
    contract.summary.readyForStep129DAuthorizationUrlRouteRuntimeRecordHandoff !== false ||
    contract.summary.readyForStep130CallbackRoutePersistenceIntegration !== false ||
    contract.summary.readyForStep132FrontendConnectionStatusPanel !== false ||
    contract.summary.readyForStep135RealSpApiReports !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step129-B OAuth authorization URL route implementation contract violation: next-work summary mismatch.');
  }

  return contract;
}
