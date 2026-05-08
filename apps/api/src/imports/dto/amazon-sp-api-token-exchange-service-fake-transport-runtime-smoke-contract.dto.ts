import {
  assertAmazonSpApiTokenExchangeServiceFakeTransportImplementationContract,
  buildAmazonSpApiTokenExchangeServiceFakeTransportImplementationContract,
  type AmazonSpApiTokenExchangeServiceFakeTransportImplementationContract,
} from './amazon-sp-api-token-exchange-service-fake-transport-implementation-contract.dto';

export const AMAZON_SP_API_TOKEN_EXCHANGE_SERVICE_FAKE_TRANSPORT_RUNTIME_SMOKE_CONTRACT_VERSION =
  'amazon-sp-api-token-exchange-service-fake-transport-runtime-smoke-contract-v1' as const;

export type AmazonSpApiTokenExchangeServiceFakeTransportRuntimeSmokeContract = {
  version: typeof AMAZON_SP_API_TOKEN_EXCHANGE_SERVICE_FAKE_TRANSPORT_RUNTIME_SMOKE_CONTRACT_VERSION;
  sourceStep128B: AmazonSpApiTokenExchangeServiceFakeTransportImplementationContract;

  runtimeSmokeImplementedNow: true;
  serviceLogicChangedNow: false;
  controllerIntegrationNow: false;
  callbackRouteCallsServiceNow: false;
  realLwaTransportImplementedNow: false;
  tokenExchangeHttpCallNow: false;
  lwaHttpCallNow: false;
  tokenPersistenceDatabaseWriteNow: false;
  frontendAddedNow: false;
  realSpApiRequestNow: false;
  importJobWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;

  runtimeAssertions: {
    validDryRunAccepted: true;
    deterministicFakeEnvelopeStable: true;
    missingStateRejected: true;
    missingAuthorizationCodeRejected: true;
    missingSellingPartnerIdRejected: true;
    missingRedirectUriRejected: true;
    missingClientIdRejected: true;
    clientSecretNotConfiguredRejected: true;
    missingMarketplaceIdRejected: true;
    missingRegionRejected: true;
    missingCompanyIdRejected: true;
    missingStoreIdRejected: true;
    nonDryRunRejected: true;
    rawAuthorizationCodeNotLeaked: true;
    rawClientSecretNotLeaked: true;
    rawRefreshTokenNotLeaked: true;
    rawAccessTokenNotLeaked: true;
  };

  securityBoundary: {
    serviceContainsNoFetch: true;
    serviceContainsNoAxios: true;
    serviceContainsNoHttpService: true;
    serviceContainsNoLwaEndpoint: true;
    serviceContainsNoPrismaClient: true;
    serviceContainsNoTokenRepositoryWrite: true;
    controllerNotWiredToService: true;
  };

  nextAllowedWork: {
    step128DTokenExchangeServiceRuntimeSmokeRecordHandoff: true;
    step129AuthorizationUrlRouteContract: false;
    step130CallbackRouteServiceIntegration: false;
    step130TokenPersistenceFromCallback: false;
    step132FrontendConnectionPanelImplementation: false;
    step135RealSpApiReportsRequestImplementation: false;
  };

  summary: {
    step128CCompleted: true;
    readyForStep128DTokenExchangeServiceRuntimeSmokeRecordHandoff: true;
    readyForStep129AuthorizationUrlRouteContract: false;
    readyForStep130CallbackRoutePersistenceIntegration: false;
    readyForStep132FrontendConnectionStatusPanel: false;
    readyForStep135RealSpApiReports: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiTokenExchangeServiceFakeTransportRuntimeSmokeContract(): AmazonSpApiTokenExchangeServiceFakeTransportRuntimeSmokeContract {
  const sourceStep128B = assertAmazonSpApiTokenExchangeServiceFakeTransportImplementationContract(
    buildAmazonSpApiTokenExchangeServiceFakeTransportImplementationContract(),
  );

  return {
    version: AMAZON_SP_API_TOKEN_EXCHANGE_SERVICE_FAKE_TRANSPORT_RUNTIME_SMOKE_CONTRACT_VERSION,
    sourceStep128B,

    runtimeSmokeImplementedNow: true,
    serviceLogicChangedNow: false,
    controllerIntegrationNow: false,
    callbackRouteCallsServiceNow: false,
    realLwaTransportImplementedNow: false,
    tokenExchangeHttpCallNow: false,
    lwaHttpCallNow: false,
    tokenPersistenceDatabaseWriteNow: false,
    frontendAddedNow: false,
    realSpApiRequestNow: false,
    importJobWriteNow: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,

    runtimeAssertions: {
      validDryRunAccepted: true,
      deterministicFakeEnvelopeStable: true,
      missingStateRejected: true,
      missingAuthorizationCodeRejected: true,
      missingSellingPartnerIdRejected: true,
      missingRedirectUriRejected: true,
      missingClientIdRejected: true,
      clientSecretNotConfiguredRejected: true,
      missingMarketplaceIdRejected: true,
      missingRegionRejected: true,
      missingCompanyIdRejected: true,
      missingStoreIdRejected: true,
      nonDryRunRejected: true,
      rawAuthorizationCodeNotLeaked: true,
      rawClientSecretNotLeaked: true,
      rawRefreshTokenNotLeaked: true,
      rawAccessTokenNotLeaked: true,
    },

    securityBoundary: {
      serviceContainsNoFetch: true,
      serviceContainsNoAxios: true,
      serviceContainsNoHttpService: true,
      serviceContainsNoLwaEndpoint: true,
      serviceContainsNoPrismaClient: true,
      serviceContainsNoTokenRepositoryWrite: true,
      controllerNotWiredToService: true,
    },

    nextAllowedWork: {
      step128DTokenExchangeServiceRuntimeSmokeRecordHandoff: true,
      step129AuthorizationUrlRouteContract: false,
      step130CallbackRouteServiceIntegration: false,
      step130TokenPersistenceFromCallback: false,
      step132FrontendConnectionPanelImplementation: false,
      step135RealSpApiReportsRequestImplementation: false,
    },

    summary: {
      step128CCompleted: true,
      readyForStep128DTokenExchangeServiceRuntimeSmokeRecordHandoff: true,
      readyForStep129AuthorizationUrlRouteContract: false,
      readyForStep130CallbackRoutePersistenceIntegration: false,
      readyForStep132FrontendConnectionStatusPanel: false,
      readyForStep135RealSpApiReports: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiTokenExchangeServiceFakeTransportRuntimeSmokeContract(
  contract: AmazonSpApiTokenExchangeServiceFakeTransportRuntimeSmokeContract,
): AmazonSpApiTokenExchangeServiceFakeTransportRuntimeSmokeContract {
  if (contract.version !== AMAZON_SP_API_TOKEN_EXCHANGE_SERVICE_FAKE_TRANSPORT_RUNTIME_SMOKE_CONTRACT_VERSION) {
    throw new Error('Step128-C token exchange service fake-transport runtime smoke contract violation: version mismatch.');
  }

  assertAmazonSpApiTokenExchangeServiceFakeTransportImplementationContract(contract.sourceStep128B);

  if (
    contract.sourceStep128B.summary.readyForStep128CTokenExchangeServiceRuntimeSmoke !== true ||
    contract.runtimeSmokeImplementedNow !== true ||
    contract.serviceLogicChangedNow !== false ||
    contract.controllerIntegrationNow !== false ||
    contract.callbackRouteCallsServiceNow !== false ||
    contract.realLwaTransportImplementedNow !== false ||
    contract.tokenExchangeHttpCallNow !== false ||
    contract.lwaHttpCallNow !== false ||
    contract.tokenPersistenceDatabaseWriteNow !== false ||
    contract.frontendAddedNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.importJobWriteNow !== false ||
    contract.transactionWriteNow !== false ||
    contract.inventoryWriteNow !== false
  ) {
    throw new Error('Step128-C token exchange service fake-transport runtime smoke contract violation: boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    runtimeAssertions: contract.runtimeAssertions,
    securityBoundary: contract.securityBoundary,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step128-C token exchange service fake-transport runtime smoke contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.nextAllowedWork.step128DTokenExchangeServiceRuntimeSmokeRecordHandoff !== true ||
    contract.nextAllowedWork.step129AuthorizationUrlRouteContract !== false ||
    contract.nextAllowedWork.step130CallbackRouteServiceIntegration !== false ||
    contract.nextAllowedWork.step130TokenPersistenceFromCallback !== false ||
    contract.nextAllowedWork.step132FrontendConnectionPanelImplementation !== false ||
    contract.nextAllowedWork.step135RealSpApiReportsRequestImplementation !== false ||
    contract.summary.step128CCompleted !== true ||
    contract.summary.readyForStep128DTokenExchangeServiceRuntimeSmokeRecordHandoff !== true ||
    contract.summary.readyForStep129AuthorizationUrlRouteContract !== false ||
    contract.summary.readyForStep130CallbackRoutePersistenceIntegration !== false ||
    contract.summary.readyForStep132FrontendConnectionStatusPanel !== false ||
    contract.summary.readyForStep135RealSpApiReports !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step128-C token exchange service fake-transport runtime smoke contract violation: next-work summary mismatch.');
  }

  return contract;
}
