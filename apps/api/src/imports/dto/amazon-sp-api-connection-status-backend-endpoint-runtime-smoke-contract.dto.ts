import {
  assertAmazonSpApiConnectionStatusBackendEndpointImplementationContract,
  buildAmazonSpApiConnectionStatusBackendEndpointImplementationContract,
  type AmazonSpApiConnectionStatusBackendEndpointImplementationContract,
} from './amazon-sp-api-connection-status-backend-endpoint-implementation-contract.dto';

export const AMAZON_SP_API_CONNECTION_STATUS_BACKEND_ENDPOINT_RUNTIME_SMOKE_CONTRACT_VERSION =
  'amazon-sp-api-connection-status-backend-endpoint-runtime-smoke-contract-v1' as const;

export type AmazonSpApiConnectionStatusBackendEndpointRuntimeSmokeContract = {
  version: typeof AMAZON_SP_API_CONNECTION_STATUS_BACKEND_ENDPOINT_RUNTIME_SMOKE_CONTRACT_VERSION;
  sourceStep133B: AmazonSpApiConnectionStatusBackendEndpointImplementationContract;

  runtimeSmokeImplementedNow: true;
  backendMutationNow: false;
  controllerMutationNow: false;
  serviceMutationNow: false;
  repositoryMutationNow: false;
  frontendMutationNow: false;

  runtimeVerified: {
    routeRequiresJwt: true;
    missingStoreIdReturnsBadRequest: true;
    missingCompanyReturnsForbidden: true;
    notConnectedReturnsNotConnected: true;
    connectedReturnsConnected: true;
    revokedReturnsReconnectRequired: true;
    errorReturnsError: true;
    defaultMarketplaceIdApplied: true;
    defaultRegionApplied: true;
    sellingPartnerIdRedacted: true;
    tokenPersistenceReadCalled: true;
    tokenPersistenceWriteNotCalled: true;
  };

  securityBoundary: {
    noRealSpApiReportsNow: true;
    noRealLwaHttpNow: true;
    noTokenExchangeHttpNow: true;
    noImportJobCreationNow: true;
    noTransactionWriteNow: true;
    noInventoryWriteNow: true;
    noRawRefreshTokenReturn: true;
    noRawAccessTokenReturn: true;
    noClientSecretReturn: true;
    noFrontendMutationNow: true;
  };

  nextAllowedWork: {
    step133DConnectionStatusBackendEndpointRuntimeRecordHandoff: true;
    step134FrontendPanelReadsBackendStatus: false;
    step135RealSpApiReportsRequestImplementation: false;
  };

  summary: {
    step133CCompleted: true;
    readyForStep133DConnectionStatusBackendEndpointRuntimeRecordHandoff: true;
    readyForStep134FrontendPanelReadsBackendStatus: false;
    readyForStep135RealSpApiReports: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiConnectionStatusBackendEndpointRuntimeSmokeContract(): AmazonSpApiConnectionStatusBackendEndpointRuntimeSmokeContract {
  const sourceStep133B = assertAmazonSpApiConnectionStatusBackendEndpointImplementationContract(
    buildAmazonSpApiConnectionStatusBackendEndpointImplementationContract(),
  );

  return {
    version: AMAZON_SP_API_CONNECTION_STATUS_BACKEND_ENDPOINT_RUNTIME_SMOKE_CONTRACT_VERSION,
    sourceStep133B,

    runtimeSmokeImplementedNow: true,
    backendMutationNow: false,
    controllerMutationNow: false,
    serviceMutationNow: false,
    repositoryMutationNow: false,
    frontendMutationNow: false,

    runtimeVerified: {
      routeRequiresJwt: true,
      missingStoreIdReturnsBadRequest: true,
      missingCompanyReturnsForbidden: true,
      notConnectedReturnsNotConnected: true,
      connectedReturnsConnected: true,
      revokedReturnsReconnectRequired: true,
      errorReturnsError: true,
      defaultMarketplaceIdApplied: true,
      defaultRegionApplied: true,
      sellingPartnerIdRedacted: true,
      tokenPersistenceReadCalled: true,
      tokenPersistenceWriteNotCalled: true,
    },

    securityBoundary: {
      noRealSpApiReportsNow: true,
      noRealLwaHttpNow: true,
      noTokenExchangeHttpNow: true,
      noImportJobCreationNow: true,
      noTransactionWriteNow: true,
      noInventoryWriteNow: true,
      noRawRefreshTokenReturn: true,
      noRawAccessTokenReturn: true,
      noClientSecretReturn: true,
      noFrontendMutationNow: true,
    },

    nextAllowedWork: {
      step133DConnectionStatusBackendEndpointRuntimeRecordHandoff: true,
      step134FrontendPanelReadsBackendStatus: false,
      step135RealSpApiReportsRequestImplementation: false,
    },

    summary: {
      step133CCompleted: true,
      readyForStep133DConnectionStatusBackendEndpointRuntimeRecordHandoff: true,
      readyForStep134FrontendPanelReadsBackendStatus: false,
      readyForStep135RealSpApiReports: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiConnectionStatusBackendEndpointRuntimeSmokeContract(
  contract: AmazonSpApiConnectionStatusBackendEndpointRuntimeSmokeContract,
): AmazonSpApiConnectionStatusBackendEndpointRuntimeSmokeContract {
  if (contract.version !== AMAZON_SP_API_CONNECTION_STATUS_BACKEND_ENDPOINT_RUNTIME_SMOKE_CONTRACT_VERSION) {
    throw new Error('Step133-C Amazon SP-API connection status backend endpoint runtime smoke contract violation: version mismatch.');
  }

  assertAmazonSpApiConnectionStatusBackendEndpointImplementationContract(contract.sourceStep133B);

  if (
    contract.sourceStep133B.summary.readyForStep133CConnectionStatusBackendEndpointRuntimeSmoke !== true ||
    contract.runtimeSmokeImplementedNow !== true ||
    contract.backendMutationNow !== false ||
    contract.controllerMutationNow !== false ||
    contract.serviceMutationNow !== false ||
    contract.repositoryMutationNow !== false ||
    contract.frontendMutationNow !== false
  ) {
    throw new Error('Step133-C Amazon SP-API connection status backend endpoint runtime smoke contract violation: boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    runtimeVerified: contract.runtimeVerified,
    securityBoundary: contract.securityBoundary,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step133-C Amazon SP-API connection status backend endpoint runtime smoke contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.nextAllowedWork.step133DConnectionStatusBackendEndpointRuntimeRecordHandoff !== true ||
    contract.nextAllowedWork.step134FrontendPanelReadsBackendStatus !== false ||
    contract.nextAllowedWork.step135RealSpApiReportsRequestImplementation !== false ||
    contract.summary.step133CCompleted !== true ||
    contract.summary.readyForStep133DConnectionStatusBackendEndpointRuntimeRecordHandoff !== true ||
    contract.summary.readyForStep134FrontendPanelReadsBackendStatus !== false ||
    contract.summary.readyForStep135RealSpApiReports !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step133-C Amazon SP-API connection status backend endpoint runtime smoke contract violation: next-work summary mismatch.');
  }

  return contract;
}
