import {
  assertAmazonSpApiTokenExchangeServicePreimplementationContract,
  buildAmazonSpApiTokenExchangeServicePreimplementationContract,
  type AmazonSpApiTokenExchangeServicePreimplementationContract,
} from './amazon-sp-api-token-exchange-service-preimplementation-contract.dto';

export const AMAZON_SP_API_TOKEN_EXCHANGE_SERVICE_FAKE_TRANSPORT_IMPLEMENTATION_CONTRACT_VERSION =
  'amazon-sp-api-token-exchange-service-fake-transport-implementation-contract-v1' as const;

export type AmazonSpApiTokenExchangeServiceFakeTransportImplementationContract = {
  version: typeof AMAZON_SP_API_TOKEN_EXCHANGE_SERVICE_FAKE_TRANSPORT_IMPLEMENTATION_CONTRACT_VERSION;
  sourceStep128A: AmazonSpApiTokenExchangeServicePreimplementationContract;

  serviceFileAddedNow: true;
  providerRegisteredNow: true;
  fakeTransportImplementedNow: true;
  realLwaTransportImplementedNow: false;
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

  serviceContract: {
    serviceName: 'AmazonSpApiTokenExchangeService';
    serviceFile: 'apps/api/src/imports/amazon-sp-api-token-exchange.service.ts';
    methodName: 'exchangeAuthorizationCodeDryRunnable';
    transportMode: 'fake';
    dryRunRequired: true;
    deterministicFakeTokenEnvelope: true;
    noRawAuthorizationCodeInResponse: true;
    noRawClientSecretInResponse: true;
    noRawAccessTokenInResponse: true;
    noRawRefreshTokenInResponse: true;
  };

  runtimeBoundary: {
    validatesState: true;
    validatesAuthorizationCode: true;
    validatesSellingPartnerId: true;
    validatesRedirectUri: true;
    validatesClientId: true;
    validatesClientSecretConfiguredFlag: true;
    validatesMarketplaceId: true;
    validatesRegion: true;
    validatesCompanyId: true;
    validatesStoreId: true;
    rejectsNonDryRun: true;
    returnsSanitizedFakeEncryptedTokenEnvelope: true;
  };

  securityBoundary: {
    noFetch: true;
    noAxios: true;
    noHttpService: true;
    noAmazonLwaEndpointReferenceInService: true;
    noPrismaClient: true;
    noTokenRepositoryWrite: true;
    noCallbackControllerMutation: true;
    noFrontend: true;
    noRealSpApi: true;
  };

  nextAllowedWork: {
    step128CTokenExchangeServiceRuntimeSmoke: true;
    step129AuthorizationUrlRouteContract: false;
    step130CallbackRouteServiceIntegration: false;
    step130TokenPersistenceFromCallback: false;
    step132FrontendConnectionPanelImplementation: false;
    step135RealSpApiReportsRequestImplementation: false;
  };

  summary: {
    step128BCompleted: true;
    readyForStep128CTokenExchangeServiceRuntimeSmoke: true;
    readyForStep129AuthorizationUrlRouteContract: false;
    readyForStep130CallbackRoutePersistenceIntegration: false;
    readyForStep132FrontendConnectionStatusPanel: false;
    readyForStep135RealSpApiReports: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiTokenExchangeServiceFakeTransportImplementationContract(): AmazonSpApiTokenExchangeServiceFakeTransportImplementationContract {
  const sourceStep128A = assertAmazonSpApiTokenExchangeServicePreimplementationContract(
    buildAmazonSpApiTokenExchangeServicePreimplementationContract(),
  );

  return {
    version: AMAZON_SP_API_TOKEN_EXCHANGE_SERVICE_FAKE_TRANSPORT_IMPLEMENTATION_CONTRACT_VERSION,
    sourceStep128A,

    serviceFileAddedNow: true,
    providerRegisteredNow: true,
    fakeTransportImplementedNow: true,
    realLwaTransportImplementedNow: false,
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

    serviceContract: {
      serviceName: 'AmazonSpApiTokenExchangeService',
      serviceFile: 'apps/api/src/imports/amazon-sp-api-token-exchange.service.ts',
      methodName: 'exchangeAuthorizationCodeDryRunnable',
      transportMode: 'fake',
      dryRunRequired: true,
      deterministicFakeTokenEnvelope: true,
      noRawAuthorizationCodeInResponse: true,
      noRawClientSecretInResponse: true,
      noRawAccessTokenInResponse: true,
      noRawRefreshTokenInResponse: true,
    },

    runtimeBoundary: {
      validatesState: true,
      validatesAuthorizationCode: true,
      validatesSellingPartnerId: true,
      validatesRedirectUri: true,
      validatesClientId: true,
      validatesClientSecretConfiguredFlag: true,
      validatesMarketplaceId: true,
      validatesRegion: true,
      validatesCompanyId: true,
      validatesStoreId: true,
      rejectsNonDryRun: true,
      returnsSanitizedFakeEncryptedTokenEnvelope: true,
    },

    securityBoundary: {
      noFetch: true,
      noAxios: true,
      noHttpService: true,
      noAmazonLwaEndpointReferenceInService: true,
      noPrismaClient: true,
      noTokenRepositoryWrite: true,
      noCallbackControllerMutation: true,
      noFrontend: true,
      noRealSpApi: true,
    },

    nextAllowedWork: {
      step128CTokenExchangeServiceRuntimeSmoke: true,
      step129AuthorizationUrlRouteContract: false,
      step130CallbackRouteServiceIntegration: false,
      step130TokenPersistenceFromCallback: false,
      step132FrontendConnectionPanelImplementation: false,
      step135RealSpApiReportsRequestImplementation: false,
    },

    summary: {
      step128BCompleted: true,
      readyForStep128CTokenExchangeServiceRuntimeSmoke: true,
      readyForStep129AuthorizationUrlRouteContract: false,
      readyForStep130CallbackRoutePersistenceIntegration: false,
      readyForStep132FrontendConnectionStatusPanel: false,
      readyForStep135RealSpApiReports: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiTokenExchangeServiceFakeTransportImplementationContract(
  contract: AmazonSpApiTokenExchangeServiceFakeTransportImplementationContract,
): AmazonSpApiTokenExchangeServiceFakeTransportImplementationContract {
  if (contract.version !== AMAZON_SP_API_TOKEN_EXCHANGE_SERVICE_FAKE_TRANSPORT_IMPLEMENTATION_CONTRACT_VERSION) {
    throw new Error('Step128-B token exchange service fake-transport implementation contract violation: version mismatch.');
  }

  assertAmazonSpApiTokenExchangeServicePreimplementationContract(contract.sourceStep128A);

  if (
    contract.sourceStep128A.summary.readyForStep128BTokenExchangeServiceFakeTransportImplementation !== true ||
    contract.serviceFileAddedNow !== true ||
    contract.providerRegisteredNow !== true ||
    contract.fakeTransportImplementedNow !== true ||
    contract.realLwaTransportImplementedNow !== false ||
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
    throw new Error('Step128-B token exchange service fake-transport implementation contract violation: boundary mismatch.');
  }

  if (
    contract.serviceContract.serviceName !== 'AmazonSpApiTokenExchangeService' ||
    contract.serviceContract.serviceFile !== 'apps/api/src/imports/amazon-sp-api-token-exchange.service.ts' ||
    contract.serviceContract.methodName !== 'exchangeAuthorizationCodeDryRunnable' ||
    contract.serviceContract.transportMode !== 'fake'
  ) {
    throw new Error('Step128-B token exchange service fake-transport implementation contract violation: service contract mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    serviceContract: contract.serviceContract,
    runtimeBoundary: contract.runtimeBoundary,
    securityBoundary: contract.securityBoundary,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (
        ['serviceName', 'serviceFile', 'methodName', 'transportMode'].includes(key)
      ) {
        continue;
      }

      if (value !== true) {
        throw new Error(`Step128-B token exchange service fake-transport implementation contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.nextAllowedWork.step128CTokenExchangeServiceRuntimeSmoke !== true ||
    contract.nextAllowedWork.step129AuthorizationUrlRouteContract !== false ||
    contract.nextAllowedWork.step130CallbackRouteServiceIntegration !== false ||
    contract.nextAllowedWork.step130TokenPersistenceFromCallback !== false ||
    contract.nextAllowedWork.step132FrontendConnectionPanelImplementation !== false ||
    contract.nextAllowedWork.step135RealSpApiReportsRequestImplementation !== false ||
    contract.summary.step128BCompleted !== true ||
    contract.summary.readyForStep128CTokenExchangeServiceRuntimeSmoke !== true ||
    contract.summary.readyForStep129AuthorizationUrlRouteContract !== false ||
    contract.summary.readyForStep130CallbackRoutePersistenceIntegration !== false ||
    contract.summary.readyForStep132FrontendConnectionStatusPanel !== false ||
    contract.summary.readyForStep135RealSpApiReports !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step128-B token exchange service fake-transport implementation contract violation: next-work summary mismatch.');
  }

  return contract;
}
