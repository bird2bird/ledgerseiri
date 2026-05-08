import {
  assertAmazonSpApiOauthCallbackRouteFakeTokenExchangeIntegrationContract,
  buildAmazonSpApiOauthCallbackRouteFakeTokenExchangeIntegrationContract,
  type AmazonSpApiOauthCallbackRouteFakeTokenExchangeIntegrationContract,
} from './amazon-sp-api-oauth-callback-route-fake-token-exchange-integration-contract.dto';

export const AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_FAKE_TOKEN_EXCHANGE_IMPLEMENTATION_CONTRACT_VERSION =
  'amazon-sp-api-oauth-callback-route-fake-token-exchange-implementation-contract-v1' as const;

export type AmazonSpApiOauthCallbackRouteFakeTokenExchangeImplementationContract = {
  version: typeof AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_FAKE_TOKEN_EXCHANGE_IMPLEMENTATION_CONTRACT_VERSION;
  sourceStep130A: AmazonSpApiOauthCallbackRouteFakeTokenExchangeIntegrationContract;

  callbackRouteIntegrationImplementedNow: true;
  controllerMutationNow: true;
  tokenExchangeServiceInjectedNow: true;
  fakeTokenExchangeCalledFromCallbackNow: true;

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

  implementedCallbackIntegration: {
    existingCallbackRoutePath: '/api/imports/amazon-sp-api/oauth/callback';
    controllerPath: 'apps/api/src/imports/imports.controller.ts';
    injectedServiceName: 'AmazonSpApiTokenExchangeService';
    invokedServiceMethod: 'exchangeAuthorizationCodeDryRunnable';
    transportMode: 'fake';
    dryRunRequired: true;
    usesSpapiOauthCodeWhenPresent: true;
    fallsBackToCodeQuery: true;
    returnsFakeTokenEnvelope: true;
    keepsTokenPersistencePending: true;
  };

  responseBoundary: {
    successStatusFakeTokenExchangeCompleted: true;
    tokenExchangeAttemptedFlagReturned: true;
    tokenExchangeTransportModeReturned: true;
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
    callbackStillRejectsError: true;
    callbackStillRejectsMissingState: true;
    callbackStillRejectsMissingAuthorizationCode: true;
    callbackStillRejectsMissingSellingPartnerId: true;
    noRealLwaHttp: true;
    noTokenPersistence: true;
    noRawSecretLogging: true;
    noFrontendMutationNow: true;
    noRealSpApiNow: true;
  };

  nextAllowedWork: {
    step130CCallbackRouteFakeTokenExchangeRuntimeSmoke: true;
    step130DCallbackRouteTokenPersistenceContract: false;
    step132FrontendConnectionPanelImplementation: false;
    step135RealSpApiReportsRequestImplementation: false;
  };

  summary: {
    step130BCompleted: true;
    readyForStep130CCallbackRouteFakeTokenExchangeRuntimeSmoke: true;
    readyForStep130DCallbackRouteTokenPersistenceContract: false;
    readyForStep132FrontendConnectionStatusPanel: false;
    readyForStep135RealSpApiReports: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiOauthCallbackRouteFakeTokenExchangeImplementationContract(): AmazonSpApiOauthCallbackRouteFakeTokenExchangeImplementationContract {
  const sourceStep130A = assertAmazonSpApiOauthCallbackRouteFakeTokenExchangeIntegrationContract(
    buildAmazonSpApiOauthCallbackRouteFakeTokenExchangeIntegrationContract(),
  );

  return {
    version: AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_FAKE_TOKEN_EXCHANGE_IMPLEMENTATION_CONTRACT_VERSION,
    sourceStep130A,

    callbackRouteIntegrationImplementedNow: true,
    controllerMutationNow: true,
    tokenExchangeServiceInjectedNow: true,
    fakeTokenExchangeCalledFromCallbackNow: true,

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

    implementedCallbackIntegration: {
      existingCallbackRoutePath: '/api/imports/amazon-sp-api/oauth/callback',
      controllerPath: 'apps/api/src/imports/imports.controller.ts',
      injectedServiceName: 'AmazonSpApiTokenExchangeService',
      invokedServiceMethod: 'exchangeAuthorizationCodeDryRunnable',
      transportMode: 'fake',
      dryRunRequired: true,
      usesSpapiOauthCodeWhenPresent: true,
      fallsBackToCodeQuery: true,
      returnsFakeTokenEnvelope: true,
      keepsTokenPersistencePending: true,
    },

    responseBoundary: {
      successStatusFakeTokenExchangeCompleted: true,
      tokenExchangeAttemptedFlagReturned: true,
      tokenExchangeTransportModeReturned: true,
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
      callbackStillRejectsError: true,
      callbackStillRejectsMissingState: true,
      callbackStillRejectsMissingAuthorizationCode: true,
      callbackStillRejectsMissingSellingPartnerId: true,
      noRealLwaHttp: true,
      noTokenPersistence: true,
      noRawSecretLogging: true,
      noFrontendMutationNow: true,
      noRealSpApiNow: true,
    },

    nextAllowedWork: {
      step130CCallbackRouteFakeTokenExchangeRuntimeSmoke: true,
      step130DCallbackRouteTokenPersistenceContract: false,
      step132FrontendConnectionPanelImplementation: false,
      step135RealSpApiReportsRequestImplementation: false,
    },

    summary: {
      step130BCompleted: true,
      readyForStep130CCallbackRouteFakeTokenExchangeRuntimeSmoke: true,
      readyForStep130DCallbackRouteTokenPersistenceContract: false,
      readyForStep132FrontendConnectionStatusPanel: false,
      readyForStep135RealSpApiReports: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiOauthCallbackRouteFakeTokenExchangeImplementationContract(
  contract: AmazonSpApiOauthCallbackRouteFakeTokenExchangeImplementationContract,
): AmazonSpApiOauthCallbackRouteFakeTokenExchangeImplementationContract {
  if (contract.version !== AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_FAKE_TOKEN_EXCHANGE_IMPLEMENTATION_CONTRACT_VERSION) {
    throw new Error('Step130-B OAuth callback fake token exchange implementation contract violation: version mismatch.');
  }

  assertAmazonSpApiOauthCallbackRouteFakeTokenExchangeIntegrationContract(contract.sourceStep130A);

  if (
    contract.sourceStep130A.summary.readyForStep130BCallbackRouteFakeTokenExchangeIntegration !== true ||
    contract.callbackRouteIntegrationImplementedNow !== true ||
    contract.controllerMutationNow !== true ||
    contract.tokenExchangeServiceInjectedNow !== true ||
    contract.fakeTokenExchangeCalledFromCallbackNow !== true ||
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
    throw new Error('Step130-B OAuth callback fake token exchange implementation contract violation: boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    implementedCallbackIntegration: contract.implementedCallbackIntegration,
    responseBoundary: contract.responseBoundary,
    securityBoundary: contract.securityBoundary,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (
        [
          'existingCallbackRoutePath',
          'controllerPath',
          'injectedServiceName',
          'invokedServiceMethod',
          'transportMode',
        ].includes(key)
      ) {
        continue;
      }

      if (value !== true) {
        throw new Error(`Step130-B OAuth callback fake token exchange implementation contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.implementedCallbackIntegration.injectedServiceName !== 'AmazonSpApiTokenExchangeService' ||
    contract.implementedCallbackIntegration.invokedServiceMethod !== 'exchangeAuthorizationCodeDryRunnable' ||
    contract.implementedCallbackIntegration.transportMode !== 'fake' ||
    contract.nextAllowedWork.step130CCallbackRouteFakeTokenExchangeRuntimeSmoke !== true ||
    contract.nextAllowedWork.step130DCallbackRouteTokenPersistenceContract !== false ||
    contract.nextAllowedWork.step132FrontendConnectionPanelImplementation !== false ||
    contract.nextAllowedWork.step135RealSpApiReportsRequestImplementation !== false ||
    contract.summary.step130BCompleted !== true ||
    contract.summary.readyForStep130CCallbackRouteFakeTokenExchangeRuntimeSmoke !== true ||
    contract.summary.readyForStep130DCallbackRouteTokenPersistenceContract !== false ||
    contract.summary.readyForStep132FrontendConnectionStatusPanel !== false ||
    contract.summary.readyForStep135RealSpApiReports !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step130-B OAuth callback fake token exchange implementation contract violation: next-work summary mismatch.');
  }

  return contract;
}
