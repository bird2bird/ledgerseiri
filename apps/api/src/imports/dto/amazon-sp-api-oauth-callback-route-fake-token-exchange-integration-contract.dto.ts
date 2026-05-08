import {
  assertAmazonSpApiOauthAuthorizationUrlRouteRuntimeRecordHandoffContract,
  buildAmazonSpApiOauthAuthorizationUrlRouteRuntimeRecordHandoffContract,
  type AmazonSpApiOauthAuthorizationUrlRouteRuntimeRecordHandoffContract,
} from './amazon-sp-api-oauth-authorization-url-route-runtime-record-handoff-contract.dto';

export const AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_FAKE_TOKEN_EXCHANGE_INTEGRATION_CONTRACT_VERSION =
  'amazon-sp-api-oauth-callback-route-fake-token-exchange-integration-contract-v1' as const;

export type AmazonSpApiOauthCallbackRouteFakeTokenExchangeIntegrationContract = {
  version: typeof AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_FAKE_TOKEN_EXCHANGE_INTEGRATION_CONTRACT_VERSION;
  sourceStep129D: AmazonSpApiOauthAuthorizationUrlRouteRuntimeRecordHandoffContract;

  contractOnly: true;
  callbackRouteIntegrationImplementedNow: false;
  controllerMutationNow: false;
  tokenExchangeServiceAlreadyExists: true;
  fakeTokenExchangeIntegrationPlannedNow: true;

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

  plannedCallbackIntegration: {
    existingCallbackRoutePath: '/api/imports/amazon-sp-api/oauth/callback';
    existingControllerPath: 'apps/api/src/imports/imports.controller.ts';
    plannedServiceName: 'AmazonSpApiTokenExchangeService';
    plannedServiceMethod: 'exchangeAuthorizationCodeDryRunnable';
    plannedTransportMode: 'fake';
    dryRunRequired: true;
    useCallbackQuerySpapiOauthCode: true;
    useCallbackQuerySellingPartnerId: true;
    useCallbackQueryState: true;
    useCompanyIdFromAuthenticatedOrBoundaryFallback: true;
    useStoreMarketplaceRegionFromSignedStateOrBoundaryFallback: true;
  };

  plannedCallbackResponse: {
    okBoolean: true;
    acceptedBoolean: true;
    transportModeReturned: true;
    tokenExchangeHttpCallNowFalse: true;
    tokenPersistenceDatabaseWriteNowFalse: true;
    realSpApiRequestNowFalse: true;
    sanitizedTokenEnvelopeReturned: true;
    rawAuthorizationCodeNotReturned: true;
    rawClientSecretNotReturned: true;
    rawAccessTokenNotReturned: true;
    rawRefreshTokenNotReturned: true;
  };

  securityBoundary: {
    callbackStateValidationRequiredBeforeExchange: true;
    sellingPartnerIdRequiredBeforeExchange: true;
    authorizationCodeRequiredBeforeExchange: true;
    clientSecretConfiguredFlagRequired: true;
    noRealLwaHttpBeforeExplicitLaterStep: true;
    noTokenPersistenceBeforeExplicitLaterStep: true;
    noRawSecretLogging: true;
    noFrontendMutationNow: true;
    noRealSpApiNow: true;
  };

  nextAllowedWork: {
    step130BCallbackRouteFakeTokenExchangeIntegration: true;
    step130CCallbackRouteFakeTokenExchangeRuntimeSmoke: false;
    step130DCallbackRouteTokenPersistenceContract: false;
    step132FrontendConnectionPanelImplementation: false;
    step135RealSpApiReportsRequestImplementation: false;
  };

  summary: {
    step130ACompleted: true;
    readyForStep130BCallbackRouteFakeTokenExchangeIntegration: true;
    readyForStep130CCallbackRouteFakeTokenExchangeRuntimeSmoke: false;
    readyForStep130DCallbackRouteTokenPersistenceContract: false;
    readyForStep132FrontendConnectionStatusPanel: false;
    readyForStep135RealSpApiReports: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiOauthCallbackRouteFakeTokenExchangeIntegrationContract(): AmazonSpApiOauthCallbackRouteFakeTokenExchangeIntegrationContract {
  const sourceStep129D = assertAmazonSpApiOauthAuthorizationUrlRouteRuntimeRecordHandoffContract(
    buildAmazonSpApiOauthAuthorizationUrlRouteRuntimeRecordHandoffContract(),
  );

  return {
    version: AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_FAKE_TOKEN_EXCHANGE_INTEGRATION_CONTRACT_VERSION,
    sourceStep129D,

    contractOnly: true,
    callbackRouteIntegrationImplementedNow: false,
    controllerMutationNow: false,
    tokenExchangeServiceAlreadyExists: true,
    fakeTokenExchangeIntegrationPlannedNow: true,

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

    plannedCallbackIntegration: {
      existingCallbackRoutePath: '/api/imports/amazon-sp-api/oauth/callback',
      existingControllerPath: 'apps/api/src/imports/imports.controller.ts',
      plannedServiceName: 'AmazonSpApiTokenExchangeService',
      plannedServiceMethod: 'exchangeAuthorizationCodeDryRunnable',
      plannedTransportMode: 'fake',
      dryRunRequired: true,
      useCallbackQuerySpapiOauthCode: true,
      useCallbackQuerySellingPartnerId: true,
      useCallbackQueryState: true,
      useCompanyIdFromAuthenticatedOrBoundaryFallback: true,
      useStoreMarketplaceRegionFromSignedStateOrBoundaryFallback: true,
    },

    plannedCallbackResponse: {
      okBoolean: true,
      acceptedBoolean: true,
      transportModeReturned: true,
      tokenExchangeHttpCallNowFalse: true,
      tokenPersistenceDatabaseWriteNowFalse: true,
      realSpApiRequestNowFalse: true,
      sanitizedTokenEnvelopeReturned: true,
      rawAuthorizationCodeNotReturned: true,
      rawClientSecretNotReturned: true,
      rawAccessTokenNotReturned: true,
      rawRefreshTokenNotReturned: true,
    },

    securityBoundary: {
      callbackStateValidationRequiredBeforeExchange: true,
      sellingPartnerIdRequiredBeforeExchange: true,
      authorizationCodeRequiredBeforeExchange: true,
      clientSecretConfiguredFlagRequired: true,
      noRealLwaHttpBeforeExplicitLaterStep: true,
      noTokenPersistenceBeforeExplicitLaterStep: true,
      noRawSecretLogging: true,
      noFrontendMutationNow: true,
      noRealSpApiNow: true,
    },

    nextAllowedWork: {
      step130BCallbackRouteFakeTokenExchangeIntegration: true,
      step130CCallbackRouteFakeTokenExchangeRuntimeSmoke: false,
      step130DCallbackRouteTokenPersistenceContract: false,
      step132FrontendConnectionPanelImplementation: false,
      step135RealSpApiReportsRequestImplementation: false,
    },

    summary: {
      step130ACompleted: true,
      readyForStep130BCallbackRouteFakeTokenExchangeIntegration: true,
      readyForStep130CCallbackRouteFakeTokenExchangeRuntimeSmoke: false,
      readyForStep130DCallbackRouteTokenPersistenceContract: false,
      readyForStep132FrontendConnectionStatusPanel: false,
      readyForStep135RealSpApiReports: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiOauthCallbackRouteFakeTokenExchangeIntegrationContract(
  contract: AmazonSpApiOauthCallbackRouteFakeTokenExchangeIntegrationContract,
): AmazonSpApiOauthCallbackRouteFakeTokenExchangeIntegrationContract {
  if (contract.version !== AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_FAKE_TOKEN_EXCHANGE_INTEGRATION_CONTRACT_VERSION) {
    throw new Error('Step130-A OAuth callback fake token exchange integration contract violation: version mismatch.');
  }

  assertAmazonSpApiOauthAuthorizationUrlRouteRuntimeRecordHandoffContract(contract.sourceStep129D);

  if (
    contract.sourceStep129D.summary.readyForStep130ACallbackRouteFakeTokenExchangeIntegrationContract !== true ||
    contract.contractOnly !== true ||
    contract.callbackRouteIntegrationImplementedNow !== false ||
    contract.controllerMutationNow !== false ||
    contract.tokenExchangeServiceAlreadyExists !== true ||
    contract.fakeTokenExchangeIntegrationPlannedNow !== true ||
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
    throw new Error('Step130-A OAuth callback fake token exchange integration contract violation: boundary mismatch.');
  }

  if (
    contract.plannedCallbackIntegration.existingCallbackRoutePath !== '/api/imports/amazon-sp-api/oauth/callback' ||
    contract.plannedCallbackIntegration.existingControllerPath !== 'apps/api/src/imports/imports.controller.ts' ||
    contract.plannedCallbackIntegration.plannedServiceName !== 'AmazonSpApiTokenExchangeService' ||
    contract.plannedCallbackIntegration.plannedServiceMethod !== 'exchangeAuthorizationCodeDryRunnable' ||
    contract.plannedCallbackIntegration.plannedTransportMode !== 'fake'
  ) {
    throw new Error('Step130-A OAuth callback fake token exchange integration contract violation: planned integration mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    plannedCallbackIntegration: contract.plannedCallbackIntegration,
    plannedCallbackResponse: contract.plannedCallbackResponse,
    securityBoundary: contract.securityBoundary,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (
        [
          'existingCallbackRoutePath',
          'existingControllerPath',
          'plannedServiceName',
          'plannedServiceMethod',
          'plannedTransportMode',
        ].includes(key)
      ) {
        continue;
      }

      if (value !== true) {
        throw new Error(`Step130-A OAuth callback fake token exchange integration contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.nextAllowedWork.step130BCallbackRouteFakeTokenExchangeIntegration !== true ||
    contract.nextAllowedWork.step130CCallbackRouteFakeTokenExchangeRuntimeSmoke !== false ||
    contract.nextAllowedWork.step130DCallbackRouteTokenPersistenceContract !== false ||
    contract.nextAllowedWork.step132FrontendConnectionPanelImplementation !== false ||
    contract.nextAllowedWork.step135RealSpApiReportsRequestImplementation !== false ||
    contract.summary.step130ACompleted !== true ||
    contract.summary.readyForStep130BCallbackRouteFakeTokenExchangeIntegration !== true ||
    contract.summary.readyForStep130CCallbackRouteFakeTokenExchangeRuntimeSmoke !== false ||
    contract.summary.readyForStep130DCallbackRouteTokenPersistenceContract !== false ||
    contract.summary.readyForStep132FrontendConnectionStatusPanel !== false ||
    contract.summary.readyForStep135RealSpApiReports !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step130-A OAuth callback fake token exchange integration contract violation: next-work summary mismatch.');
  }

  return contract;
}
