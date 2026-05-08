import {
  assertAmazonSpApiOauthCallbackRoutePreimplementationContract,
  buildAmazonSpApiOauthCallbackRoutePreimplementationContract,
  type AmazonSpApiOauthCallbackRoutePreimplementationContract,
} from './amazon-sp-api-oauth-callback-route-preimplementation-contract.dto';

export const AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_IMPLEMENTATION_CONTRACT_VERSION =
  'amazon-sp-api-oauth-callback-route-implementation-contract-v1' as const;

export type AmazonSpApiOauthCallbackRouteImplementationContract = {
  version: typeof AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_IMPLEMENTATION_CONTRACT_VERSION;
  sourceStep127A: AmazonSpApiOauthCallbackRoutePreimplementationContract;

  routeImplementedNow: true;
  routeDesignOnlyNow: false;
  oauthCallbackRouteAddedNow: true;

  authorizationRouteAddedNow: false;
  tokenExchangeHttpCallNow: false;
  lwaHttpCallNow: false;
  tokenPersistenceDatabaseWriteNow: false;
  frontendAddedNow: false;
  realSpApiRequestNow: false;
  importJobWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;

  implementedRoute: {
    controller: 'apps/api/src/imports/imports.controller.ts';
    httpMethod: 'GET';
    nestRoutePath: 'amazon-sp-api/oauth/callback';
    fullPath: '/api/imports/amazon-sp-api/oauth/callback';
  };

  implementedQueryHandling: {
    state: true;
    code: true;
    spapi_oauth_code: true;
    selling_partner_id: true;
    error: true;
    error_description: true;
  };

  implementedResponses: {
    callbackErrorSanitizedFailure: true;
    missingStateSanitizedFailure: true;
    missingAuthorizationCodeSanitizedFailure: true;
    missingSellingPartnerIdSanitizedFailure: true;
    acceptedForTokenExchangeLaterSanitizedSuccess: true;
    spapiOauthCodeFallbackFlag: true;
    bridgeServiceReadinessFlag: true;
  };

  securityBoundary: {
    noAuthorizationCodeReturned: true;
    noRefreshTokenReturned: true;
    noAccessTokenReturned: true;
    noEncryptedTokenReturned: true;
    noLwaEndpoint: true;
    noHttpFetch: true;
    noDatabaseWrite: true;
    noTokenPersistenceServiceWriteCall: true;
    noRealAmazonSpApiCall: true;
  };

  phaseCorrectRegressionPlan: {
    skipRoutePreimplementationSmokesAfterRouteImplementation: true;
    oldNoRouteLeakSmokesWouldFailByDesign: true;
    runStep127BRouteImplementationSmoke: true;
    runBuildAndStaticNoLwaNoDbGuards: true;
  };

  nextAllowedWork: {
    oauthCallbackRouteRuntimeSmoke: true;
    tokenExchangeServicePreimplementationContract: true;
    authorizationRouteImplementation: false;
    tokenExchangeHttpImplementation: false;
    frontendConnectionPanelImplementation: false;
    realSpApiReportRequestImplementation: false;
  };

  summary: {
    readyForStep127COauthCallbackRouteRuntimeSmoke: true;
    readyForTokenExchangeServicePreimplementationContract: true;
    readyForAuthorizationRouteImplementation: false;
    readyForTokenExchangeHttpImplementation: false;
    readyForFrontendConnectionPanelImplementation: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiOauthCallbackRouteImplementationContract(): AmazonSpApiOauthCallbackRouteImplementationContract {
  const step127A = assertAmazonSpApiOauthCallbackRoutePreimplementationContract(
    buildAmazonSpApiOauthCallbackRoutePreimplementationContract(),
  );

  return {
    version: AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_IMPLEMENTATION_CONTRACT_VERSION,
    sourceStep127A: step127A,

    routeImplementedNow: true,
    routeDesignOnlyNow: false,
    oauthCallbackRouteAddedNow: true,

    authorizationRouteAddedNow: false,
    tokenExchangeHttpCallNow: false,
    lwaHttpCallNow: false,
    tokenPersistenceDatabaseWriteNow: false,
    frontendAddedNow: false,
    realSpApiRequestNow: false,
    importJobWriteNow: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,

    implementedRoute: {
      controller: 'apps/api/src/imports/imports.controller.ts',
      httpMethod: 'GET',
      nestRoutePath: 'amazon-sp-api/oauth/callback',
      fullPath: '/api/imports/amazon-sp-api/oauth/callback',
    },

    implementedQueryHandling: {
      state: true,
      code: true,
      spapi_oauth_code: true,
      selling_partner_id: true,
      error: true,
      error_description: true,
    },

    implementedResponses: {
      callbackErrorSanitizedFailure: true,
      missingStateSanitizedFailure: true,
      missingAuthorizationCodeSanitizedFailure: true,
      missingSellingPartnerIdSanitizedFailure: true,
      acceptedForTokenExchangeLaterSanitizedSuccess: true,
      spapiOauthCodeFallbackFlag: true,
      bridgeServiceReadinessFlag: true,
    },

    securityBoundary: {
      noAuthorizationCodeReturned: true,
      noRefreshTokenReturned: true,
      noAccessTokenReturned: true,
      noEncryptedTokenReturned: true,
      noLwaEndpoint: true,
      noHttpFetch: true,
      noDatabaseWrite: true,
      noTokenPersistenceServiceWriteCall: true,
      noRealAmazonSpApiCall: true,
    },

    phaseCorrectRegressionPlan: {
      skipRoutePreimplementationSmokesAfterRouteImplementation: true,
      oldNoRouteLeakSmokesWouldFailByDesign: true,
      runStep127BRouteImplementationSmoke: true,
      runBuildAndStaticNoLwaNoDbGuards: true,
    },

    nextAllowedWork: {
      oauthCallbackRouteRuntimeSmoke: true,
      tokenExchangeServicePreimplementationContract: true,
      authorizationRouteImplementation: false,
      tokenExchangeHttpImplementation: false,
      frontendConnectionPanelImplementation: false,
      realSpApiReportRequestImplementation: false,
    },

    summary: {
      readyForStep127COauthCallbackRouteRuntimeSmoke: true,
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

export function assertAmazonSpApiOauthCallbackRouteImplementationContract(
  contract: AmazonSpApiOauthCallbackRouteImplementationContract,
): AmazonSpApiOauthCallbackRouteImplementationContract {
  if (contract.version !== AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_IMPLEMENTATION_CONTRACT_VERSION) {
    throw new Error('Step127-B OAuth callback route implementation contract violation: version mismatch.');
  }

  assertAmazonSpApiOauthCallbackRoutePreimplementationContract(contract.sourceStep127A);

  if (
    contract.routeImplementedNow !== true ||
    contract.routeDesignOnlyNow !== false ||
    contract.oauthCallbackRouteAddedNow !== true ||
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
    throw new Error('Step127-B OAuth callback route implementation contract violation: boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    implementedQueryHandling: contract.implementedQueryHandling,
    implementedResponses: contract.implementedResponses,
    securityBoundary: contract.securityBoundary,
    phaseCorrectRegressionPlan: contract.phaseCorrectRegressionPlan,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step127-B OAuth callback route implementation contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.implementedRoute.httpMethod !== 'GET' ||
    contract.implementedRoute.nestRoutePath !== 'amazon-sp-api/oauth/callback' ||
    contract.implementedRoute.fullPath !== '/api/imports/amazon-sp-api/oauth/callback' ||
    contract.nextAllowedWork.oauthCallbackRouteRuntimeSmoke !== true ||
    contract.nextAllowedWork.tokenExchangeServicePreimplementationContract !== true ||
    contract.nextAllowedWork.authorizationRouteImplementation !== false ||
    contract.nextAllowedWork.tokenExchangeHttpImplementation !== false ||
    contract.nextAllowedWork.frontendConnectionPanelImplementation !== false ||
    contract.nextAllowedWork.realSpApiReportRequestImplementation !== false ||
    contract.summary.readyForStep127COauthCallbackRouteRuntimeSmoke !== true ||
    contract.summary.readyForTokenExchangeServicePreimplementationContract !== true ||
    contract.summary.readyForAuthorizationRouteImplementation !== false ||
    contract.summary.readyForTokenExchangeHttpImplementation !== false ||
    contract.summary.readyForFrontendConnectionPanelImplementation !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step127-B OAuth callback route implementation contract violation: summary mismatch.');
  }

  return contract;
}
