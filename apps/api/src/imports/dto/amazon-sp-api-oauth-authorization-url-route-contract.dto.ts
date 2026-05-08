import {
  assertAmazonSpApiTokenExchangeServiceFakeTransportRuntimeRecordHandoffContract,
  buildAmazonSpApiTokenExchangeServiceFakeTransportRuntimeRecordHandoffContract,
  type AmazonSpApiTokenExchangeServiceFakeTransportRuntimeRecordHandoffContract,
} from './amazon-sp-api-token-exchange-service-fake-transport-runtime-record-handoff-contract.dto';

export const AMAZON_SP_API_OAUTH_AUTHORIZATION_URL_ROUTE_CONTRACT_VERSION =
  'amazon-sp-api-oauth-authorization-url-route-contract-v1' as const;

export type AmazonSpApiOauthAuthorizationUrlRouteContract = {
  version: typeof AMAZON_SP_API_OAUTH_AUTHORIZATION_URL_ROUTE_CONTRACT_VERSION;
  sourceStep128D: AmazonSpApiTokenExchangeServiceFakeTransportRuntimeRecordHandoffContract;

  contractOnly: true;
  routeImplementedNow: false;
  controllerMutationNow: false;
  serviceImplementationNow: false;
  authorizationUrlBuilderImplementedNow: false;
  oauthStateDatabaseWriteNow: false;
  tokenExchangeHttpCallNow: false;
  tokenPersistenceDatabaseWriteNow: false;
  frontendAddedNow: false;
  realSpApiRequestNow: false;
  importJobWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;

  plannedRoute: {
    method: 'GET';
    path: '/api/imports/amazon-sp-api/oauth/authorization-url';
    controllerPath: 'apps/api/src/imports/imports.controller.ts';
    currentStepAddsControllerRoute: false;
    currentStepAddsProvider: false;
  };

  plannedRequestQueryShape: {
    storeIdRequired: true;
    marketplaceIdRequired: true;
    regionRequired: true;
    returnToOptional: true;
    sandboxOptional: true;
    forceReauthorizeOptional: true;
    localeOptional: true;
  };

  plannedAuthorizationUrlShape: {
    baseUrl: 'https://sellercentral.amazon.co.jp/apps/authorize/consent';
    queryApplicationIdRequired: true;
    queryStateRequired: true;
    queryVersionRequired: true;
    redirectUriIncludedInSignedState: true;
    marketplaceIdIncludedInSignedState: true;
    regionIncludedInSignedState: true;
    storeIdIncludedInSignedState: true;
    companyIdIncludedInSignedState: true;
    antiCsrfNonceRequired: true;
    expiresAtRequired: true;
  };

  plannedResponseShape: {
    okBoolean: true;
    authorizationUrlRequired: true;
    stateIssuedBoolean: true;
    stateExpiresAtRequired: true;
    redirectUriRequired: true;
    marketplaceIdRequired: true;
    regionRequired: true;
    storeIdRequired: true;
    sandboxBoolean: true;
    nextStepMessageRedacted: true;
  };

  securityBoundary: {
    clientSecretNotExposed: true;
    rawStateNotLogged: true;
    signedStateRequiredBeforeRedirect: true;
    companyStoreOwnershipValidationRequired: true;
    callbackRedirectUriMustMatchStep127CallbackRoute: true;
    noTokenExchangeNow: true;
    noTokenPersistenceNow: true;
    noRealAmazonRedirectNow: true;
    noFrontendMutationNow: true;
  };

  nextAllowedWork: {
    step129BAuthorizationUrlRouteImplementation: true;
    step129CAuthorizationUrlRouteRuntimeSmoke: false;
    step130CallbackRouteServiceIntegration: false;
    step130TokenPersistenceFromCallback: false;
    step132FrontendConnectionPanelImplementation: false;
    step135RealSpApiReportsRequestImplementation: false;
  };

  summary: {
    step129ACompleted: true;
    readyForStep129BAuthorizationUrlRouteImplementation: true;
    readyForStep129CAuthorizationUrlRouteRuntimeSmoke: false;
    readyForStep130CallbackRoutePersistenceIntegration: false;
    readyForStep132FrontendConnectionStatusPanel: false;
    readyForStep135RealSpApiReports: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiOauthAuthorizationUrlRouteContract(): AmazonSpApiOauthAuthorizationUrlRouteContract {
  const sourceStep128D = assertAmazonSpApiTokenExchangeServiceFakeTransportRuntimeRecordHandoffContract(
    buildAmazonSpApiTokenExchangeServiceFakeTransportRuntimeRecordHandoffContract(),
  );

  return {
    version: AMAZON_SP_API_OAUTH_AUTHORIZATION_URL_ROUTE_CONTRACT_VERSION,
    sourceStep128D,

    contractOnly: true,
    routeImplementedNow: false,
    controllerMutationNow: false,
    serviceImplementationNow: false,
    authorizationUrlBuilderImplementedNow: false,
    oauthStateDatabaseWriteNow: false,
    tokenExchangeHttpCallNow: false,
    tokenPersistenceDatabaseWriteNow: false,
    frontendAddedNow: false,
    realSpApiRequestNow: false,
    importJobWriteNow: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,

    plannedRoute: {
      method: 'GET',
      path: '/api/imports/amazon-sp-api/oauth/authorization-url',
      controllerPath: 'apps/api/src/imports/imports.controller.ts',
      currentStepAddsControllerRoute: false,
      currentStepAddsProvider: false,
    },

    plannedRequestQueryShape: {
      storeIdRequired: true,
      marketplaceIdRequired: true,
      regionRequired: true,
      returnToOptional: true,
      sandboxOptional: true,
      forceReauthorizeOptional: true,
      localeOptional: true,
    },

    plannedAuthorizationUrlShape: {
      baseUrl: 'https://sellercentral.amazon.co.jp/apps/authorize/consent',
      queryApplicationIdRequired: true,
      queryStateRequired: true,
      queryVersionRequired: true,
      redirectUriIncludedInSignedState: true,
      marketplaceIdIncludedInSignedState: true,
      regionIncludedInSignedState: true,
      storeIdIncludedInSignedState: true,
      companyIdIncludedInSignedState: true,
      antiCsrfNonceRequired: true,
      expiresAtRequired: true,
    },

    plannedResponseShape: {
      okBoolean: true,
      authorizationUrlRequired: true,
      stateIssuedBoolean: true,
      stateExpiresAtRequired: true,
      redirectUriRequired: true,
      marketplaceIdRequired: true,
      regionRequired: true,
      storeIdRequired: true,
      sandboxBoolean: true,
      nextStepMessageRedacted: true,
    },

    securityBoundary: {
      clientSecretNotExposed: true,
      rawStateNotLogged: true,
      signedStateRequiredBeforeRedirect: true,
      companyStoreOwnershipValidationRequired: true,
      callbackRedirectUriMustMatchStep127CallbackRoute: true,
      noTokenExchangeNow: true,
      noTokenPersistenceNow: true,
      noRealAmazonRedirectNow: true,
      noFrontendMutationNow: true,
    },

    nextAllowedWork: {
      step129BAuthorizationUrlRouteImplementation: true,
      step129CAuthorizationUrlRouteRuntimeSmoke: false,
      step130CallbackRouteServiceIntegration: false,
      step130TokenPersistenceFromCallback: false,
      step132FrontendConnectionPanelImplementation: false,
      step135RealSpApiReportsRequestImplementation: false,
    },

    summary: {
      step129ACompleted: true,
      readyForStep129BAuthorizationUrlRouteImplementation: true,
      readyForStep129CAuthorizationUrlRouteRuntimeSmoke: false,
      readyForStep130CallbackRoutePersistenceIntegration: false,
      readyForStep132FrontendConnectionStatusPanel: false,
      readyForStep135RealSpApiReports: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiOauthAuthorizationUrlRouteContract(
  contract: AmazonSpApiOauthAuthorizationUrlRouteContract,
): AmazonSpApiOauthAuthorizationUrlRouteContract {
  if (contract.version !== AMAZON_SP_API_OAUTH_AUTHORIZATION_URL_ROUTE_CONTRACT_VERSION) {
    throw new Error('Step129-A OAuth authorization URL route contract violation: version mismatch.');
  }

  assertAmazonSpApiTokenExchangeServiceFakeTransportRuntimeRecordHandoffContract(contract.sourceStep128D);

  if (
    contract.sourceStep128D.summary.readyForStep129AAuthorizationUrlRouteContract !== true ||
    contract.contractOnly !== true ||
    contract.routeImplementedNow !== false ||
    contract.controllerMutationNow !== false ||
    contract.serviceImplementationNow !== false ||
    contract.authorizationUrlBuilderImplementedNow !== false ||
    contract.oauthStateDatabaseWriteNow !== false ||
    contract.tokenExchangeHttpCallNow !== false ||
    contract.tokenPersistenceDatabaseWriteNow !== false ||
    contract.frontendAddedNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.importJobWriteNow !== false ||
    contract.transactionWriteNow !== false ||
    contract.inventoryWriteNow !== false
  ) {
    throw new Error('Step129-A OAuth authorization URL route contract violation: boundary mismatch.');
  }

  if (
    contract.plannedRoute.method !== 'GET' ||
    contract.plannedRoute.path !== '/api/imports/amazon-sp-api/oauth/authorization-url' ||
    contract.plannedRoute.controllerPath !== 'apps/api/src/imports/imports.controller.ts' ||
    contract.plannedRoute.currentStepAddsControllerRoute !== false ||
    contract.plannedRoute.currentStepAddsProvider !== false
  ) {
    throw new Error('Step129-A OAuth authorization URL route contract violation: planned route mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    plannedRequestQueryShape: contract.plannedRequestQueryShape,
    plannedAuthorizationUrlShape: contract.plannedAuthorizationUrlShape,
    plannedResponseShape: contract.plannedResponseShape,
    securityBoundary: contract.securityBoundary,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (key === 'baseUrl') {
        if (value !== 'https://sellercentral.amazon.co.jp/apps/authorize/consent') {
          throw new Error('Step129-A OAuth authorization URL route contract violation: baseUrl mismatch.');
        }
        continue;
      }

      if (value !== true) {
        throw new Error(`Step129-A OAuth authorization URL route contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.nextAllowedWork.step129BAuthorizationUrlRouteImplementation !== true ||
    contract.nextAllowedWork.step129CAuthorizationUrlRouteRuntimeSmoke !== false ||
    contract.nextAllowedWork.step130CallbackRouteServiceIntegration !== false ||
    contract.nextAllowedWork.step130TokenPersistenceFromCallback !== false ||
    contract.nextAllowedWork.step132FrontendConnectionPanelImplementation !== false ||
    contract.nextAllowedWork.step135RealSpApiReportsRequestImplementation !== false ||
    contract.summary.step129ACompleted !== true ||
    contract.summary.readyForStep129BAuthorizationUrlRouteImplementation !== true ||
    contract.summary.readyForStep129CAuthorizationUrlRouteRuntimeSmoke !== false ||
    contract.summary.readyForStep130CallbackRoutePersistenceIntegration !== false ||
    contract.summary.readyForStep132FrontendConnectionStatusPanel !== false ||
    contract.summary.readyForStep135RealSpApiReports !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step129-A OAuth authorization URL route contract violation: next-work summary mismatch.');
  }

  return contract;
}
