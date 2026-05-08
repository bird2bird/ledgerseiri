import {
  assertAmazonSpApiOauthCallbackRouteRuntimeSmokeRecordHandoffContract,
  buildAmazonSpApiOauthCallbackRouteRuntimeSmokeRecordHandoffContract,
  type AmazonSpApiOauthCallbackRouteRuntimeSmokeRecordHandoffContract,
} from './amazon-sp-api-oauth-callback-route-runtime-smoke-record-handoff-contract.dto';
import {
  assertAmazonSpApiTokenExchangePreflightContract,
  buildAmazonSpApiTokenExchangePreflightContract,
  type AmazonSpApiTokenExchangePreflightContract,
} from './amazon-sp-api-token-exchange-preflight-contract.dto';

export const AMAZON_SP_API_TOKEN_EXCHANGE_SERVICE_PREIMPLEMENTATION_CONTRACT_VERSION =
  'amazon-sp-api-token-exchange-service-preimplementation-contract-v1' as const;

export type AmazonSpApiTokenExchangeServicePreimplementationContract = {
  version: typeof AMAZON_SP_API_TOKEN_EXCHANGE_SERVICE_PREIMPLEMENTATION_CONTRACT_VERSION;

  sourceStep127D: AmazonSpApiOauthCallbackRouteRuntimeSmokeRecordHandoffContract;
  sourceStep123E: AmazonSpApiTokenExchangePreflightContract;

  contractOnly: true;
  serviceImplementationNow: false;
  serviceFileAddedNow: false;
  controllerIntegrationNow: false;
  callbackRouteCallsServiceNow: false;
  tokenExchangeHttpCallNow: false;
  lwaHttpCallNow: false;
  tokenPersistenceDatabaseWriteNow: false;
  frontendAddedNow: false;
  realSpApiRequestNow: false;
  importJobWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;

  plannedServiceBoundary: {
    serviceName: 'AmazonSpApiTokenExchangeService';
    plannedFile: 'apps/api/src/imports/amazon-sp-api-token-exchange.service.ts';
    plannedMethod: 'exchangeAuthorizationCodeDryRunnable';
    currentStepAddsConcreteServiceFile: false;
    currentStepAddsProviderRegistration: false;
    currentStepAddsControllerCall: false;
  };

  plannedRequestShape: {
    stateRequired: true;
    authorizationCodeRequired: true;
    sellingPartnerIdRequired: true;
    redirectUriRequired: true;
    clientIdRequired: true;
    clientSecretRequiredInServerConfigLater: true;
    marketplaceIdResolutionRequiredBeforePersistence: true;
    regionResolutionRequiredBeforePersistence: true;
    companyIdRequiredBeforePersistence: true;
    storeIdRequiredBeforePersistence: true;
    dryRunRequiredUntilImplementationStep: true;
  };

  plannedLwaRequestShape: {
    endpoint: 'https://api.amazon.com/auth/o2/token';
    method: 'POST';
    contentType: 'application/x-www-form-urlencoded';
    grantType: 'authorization_code';
    requiredFormFields: readonly [
      'grant_type',
      'code',
      'redirect_uri',
      'client_id',
      'client_secret',
    ];
    actualHttpForbiddenNow: true;
    rawAuthorizationCodeLoggingForbidden: true;
    rawClientSecretLoggingForbidden: true;
  };

  plannedSuccessResponseShape: {
    accessTokenRequired: true;
    refreshTokenRequired: true;
    tokenTypeRequired: true;
    expiresInRequired: true;
    scopeOptional: true;
    rawResponseLoggingForbidden: true;
    persistenceDeferredToLaterStep: true;
    encryptionDeferredToTokenPersistenceBoundary: true;
  };

  plannedFailureResponseShape: {
    invalidGrantRejected: true;
    invalidClientRejected: true;
    invalidRequestRejected: true;
    unauthorizedClientRejected: true;
    serverErrorRetriableLater: true;
    throttlingRetriableLater: true;
    rawErrorBodyLoggingForbidden: true;
    sanitizedErrorOnly: true;
  };

  securityBoundary: {
    noFetchImportNow: true;
    noAxiosImportNow: true;
    noAmazonLwaEndpointCallNow: true;
    noPrismaClientNow: true;
    noTokenRepositoryWriteNow: true;
    noRefreshTokenPersistenceNow: true;
    noAccessTokenCachePersistenceNow: true;
    noCallbackRouteMutationNow: true;
    noFrontendMutationNow: true;
  };

  nextAllowedWork: {
    step128BTokenExchangeServiceFakeTransportImplementation: true;
    step128CTokenExchangeServiceRuntimeSmoke: false;
    authorizationUrlRouteImplementation: false;
    callbackRouteServiceIntegration: false;
    tokenPersistenceFromCallback: false;
    frontendConnectionPanelImplementation: false;
    realSpApiReportsRequestImplementation: false;
  };

  summary: {
    step128ACompleted: true;
    readyForStep128BTokenExchangeServiceFakeTransportImplementation: true;
    readyForStep128CTokenExchangeServiceRuntimeSmoke: false;
    readyForStep130CallbackRoutePersistenceIntegration: false;
    readyForStep132FrontendConnectionStatusPanel: false;
    readyForStep135RealSpApiReports: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiTokenExchangeServicePreimplementationContract(): AmazonSpApiTokenExchangeServicePreimplementationContract {
  const sourceStep127D = assertAmazonSpApiOauthCallbackRouteRuntimeSmokeRecordHandoffContract(
    buildAmazonSpApiOauthCallbackRouteRuntimeSmokeRecordHandoffContract(),
  );

  const sourceStep123E = assertAmazonSpApiTokenExchangePreflightContract(
    buildAmazonSpApiTokenExchangePreflightContract(),
  );

  return {
    version: AMAZON_SP_API_TOKEN_EXCHANGE_SERVICE_PREIMPLEMENTATION_CONTRACT_VERSION,

    sourceStep127D,
    sourceStep123E,

    contractOnly: true,
    serviceImplementationNow: false,
    serviceFileAddedNow: false,
    controllerIntegrationNow: false,
    callbackRouteCallsServiceNow: false,
    tokenExchangeHttpCallNow: false,
    lwaHttpCallNow: false,
    tokenPersistenceDatabaseWriteNow: false,
    frontendAddedNow: false,
    realSpApiRequestNow: false,
    importJobWriteNow: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,

    plannedServiceBoundary: {
      serviceName: 'AmazonSpApiTokenExchangeService',
      plannedFile: 'apps/api/src/imports/amazon-sp-api-token-exchange.service.ts',
      plannedMethod: 'exchangeAuthorizationCodeDryRunnable',
      currentStepAddsConcreteServiceFile: false,
      currentStepAddsProviderRegistration: false,
      currentStepAddsControllerCall: false,
    },

    plannedRequestShape: {
      stateRequired: true,
      authorizationCodeRequired: true,
      sellingPartnerIdRequired: true,
      redirectUriRequired: true,
      clientIdRequired: true,
      clientSecretRequiredInServerConfigLater: true,
      marketplaceIdResolutionRequiredBeforePersistence: true,
      regionResolutionRequiredBeforePersistence: true,
      companyIdRequiredBeforePersistence: true,
      storeIdRequiredBeforePersistence: true,
      dryRunRequiredUntilImplementationStep: true,
    },

    plannedLwaRequestShape: {
      endpoint: 'https://api.amazon.com/auth/o2/token',
      method: 'POST',
      contentType: 'application/x-www-form-urlencoded',
      grantType: 'authorization_code',
      requiredFormFields: [
        'grant_type',
        'code',
        'redirect_uri',
        'client_id',
        'client_secret',
      ],
      actualHttpForbiddenNow: true,
      rawAuthorizationCodeLoggingForbidden: true,
      rawClientSecretLoggingForbidden: true,
    },

    plannedSuccessResponseShape: {
      accessTokenRequired: true,
      refreshTokenRequired: true,
      tokenTypeRequired: true,
      expiresInRequired: true,
      scopeOptional: true,
      rawResponseLoggingForbidden: true,
      persistenceDeferredToLaterStep: true,
      encryptionDeferredToTokenPersistenceBoundary: true,
    },

    plannedFailureResponseShape: {
      invalidGrantRejected: true,
      invalidClientRejected: true,
      invalidRequestRejected: true,
      unauthorizedClientRejected: true,
      serverErrorRetriableLater: true,
      throttlingRetriableLater: true,
      rawErrorBodyLoggingForbidden: true,
      sanitizedErrorOnly: true,
    },

    securityBoundary: {
      noFetchImportNow: true,
      noAxiosImportNow: true,
      noAmazonLwaEndpointCallNow: true,
      noPrismaClientNow: true,
      noTokenRepositoryWriteNow: true,
      noRefreshTokenPersistenceNow: true,
      noAccessTokenCachePersistenceNow: true,
      noCallbackRouteMutationNow: true,
      noFrontendMutationNow: true,
    },

    nextAllowedWork: {
      step128BTokenExchangeServiceFakeTransportImplementation: true,
      step128CTokenExchangeServiceRuntimeSmoke: false,
      authorizationUrlRouteImplementation: false,
      callbackRouteServiceIntegration: false,
      tokenPersistenceFromCallback: false,
      frontendConnectionPanelImplementation: false,
      realSpApiReportsRequestImplementation: false,
    },

    summary: {
      step128ACompleted: true,
      readyForStep128BTokenExchangeServiceFakeTransportImplementation: true,
      readyForStep128CTokenExchangeServiceRuntimeSmoke: false,
      readyForStep130CallbackRoutePersistenceIntegration: false,
      readyForStep132FrontendConnectionStatusPanel: false,
      readyForStep135RealSpApiReports: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiTokenExchangeServicePreimplementationContract(
  contract: AmazonSpApiTokenExchangeServicePreimplementationContract,
): AmazonSpApiTokenExchangeServicePreimplementationContract {
  if (contract.version !== AMAZON_SP_API_TOKEN_EXCHANGE_SERVICE_PREIMPLEMENTATION_CONTRACT_VERSION) {
    throw new Error('Step128-A token exchange service preimplementation contract violation: version mismatch.');
  }

  assertAmazonSpApiOauthCallbackRouteRuntimeSmokeRecordHandoffContract(contract.sourceStep127D);
  assertAmazonSpApiTokenExchangePreflightContract(contract.sourceStep123E);

  if (
    contract.sourceStep127D.summary.readyForStep128ATokenExchangeServicePreimplementationContract !== true ||
    contract.sourceStep123E.tokenExchangeBoundary.httpCallForbiddenNow !== true
  ) {
    throw new Error('Step128-A token exchange service preimplementation contract violation: source readiness mismatch.');
  }

  if (
    contract.contractOnly !== true ||
    contract.serviceImplementationNow !== false ||
    contract.serviceFileAddedNow !== false ||
    contract.controllerIntegrationNow !== false ||
    contract.callbackRouteCallsServiceNow !== false ||
    contract.tokenExchangeHttpCallNow !== false ||
    contract.lwaHttpCallNow !== false ||
    contract.tokenPersistenceDatabaseWriteNow !== false ||
    contract.frontendAddedNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.importJobWriteNow !== false ||
    contract.transactionWriteNow !== false ||
    contract.inventoryWriteNow !== false
  ) {
    throw new Error('Step128-A token exchange service preimplementation contract violation: implementation boundary mismatch.');
  }

  if (
    contract.plannedServiceBoundary.serviceName !== 'AmazonSpApiTokenExchangeService' ||
    contract.plannedServiceBoundary.plannedFile !== 'apps/api/src/imports/amazon-sp-api-token-exchange.service.ts' ||
    contract.plannedServiceBoundary.plannedMethod !== 'exchangeAuthorizationCodeDryRunnable' ||
    contract.plannedServiceBoundary.currentStepAddsConcreteServiceFile !== false ||
    contract.plannedServiceBoundary.currentStepAddsProviderRegistration !== false ||
    contract.plannedServiceBoundary.currentStepAddsControllerCall !== false
  ) {
    throw new Error('Step128-A token exchange service preimplementation contract violation: service boundary mismatch.');
  }

  for (const [key, value] of Object.entries(contract.plannedRequestShape)) {
    if (value !== true) {
      throw new Error(`Step128-A token exchange service preimplementation contract violation: plannedRequestShape.${key} must remain true.`);
    }
  }

  if (
    contract.plannedLwaRequestShape.endpoint !== 'https://api.amazon.com/auth/o2/token' ||
    contract.plannedLwaRequestShape.method !== 'POST' ||
    contract.plannedLwaRequestShape.contentType !== 'application/x-www-form-urlencoded' ||
    contract.plannedLwaRequestShape.grantType !== 'authorization_code' ||
    contract.plannedLwaRequestShape.actualHttpForbiddenNow !== true ||
    contract.plannedLwaRequestShape.rawAuthorizationCodeLoggingForbidden !== true ||
    contract.plannedLwaRequestShape.rawClientSecretLoggingForbidden !== true
  ) {
    throw new Error('Step128-A token exchange service preimplementation contract violation: planned LWA request mismatch.');
  }

  const expectedFields = ['grant_type', 'code', 'redirect_uri', 'client_id', 'client_secret'];
  if (
    contract.plannedLwaRequestShape.requiredFormFields.length !== expectedFields.length ||
    expectedFields.some((field) => !contract.plannedLwaRequestShape.requiredFormFields.includes(field as never))
  ) {
    throw new Error('Step128-A token exchange service preimplementation contract violation: required form fields mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    plannedSuccessResponseShape: contract.plannedSuccessResponseShape,
    plannedFailureResponseShape: contract.plannedFailureResponseShape,
    securityBoundary: contract.securityBoundary,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step128-A token exchange service preimplementation contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.nextAllowedWork.step128BTokenExchangeServiceFakeTransportImplementation !== true ||
    contract.nextAllowedWork.step128CTokenExchangeServiceRuntimeSmoke !== false ||
    contract.nextAllowedWork.authorizationUrlRouteImplementation !== false ||
    contract.nextAllowedWork.callbackRouteServiceIntegration !== false ||
    contract.nextAllowedWork.tokenPersistenceFromCallback !== false ||
    contract.nextAllowedWork.frontendConnectionPanelImplementation !== false ||
    contract.nextAllowedWork.realSpApiReportsRequestImplementation !== false ||
    contract.summary.step128ACompleted !== true ||
    contract.summary.readyForStep128BTokenExchangeServiceFakeTransportImplementation !== true ||
    contract.summary.readyForStep128CTokenExchangeServiceRuntimeSmoke !== false ||
    contract.summary.readyForStep130CallbackRoutePersistenceIntegration !== false ||
    contract.summary.readyForStep132FrontendConnectionStatusPanel !== false ||
    contract.summary.readyForStep135RealSpApiReports !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step128-A token exchange service preimplementation contract violation: next-work summary mismatch.');
  }

  return contract;
}
