import {
  assertAmazonSpApiConnectionStatusBackendEndpointRuntimeSmokeContract,
  buildAmazonSpApiConnectionStatusBackendEndpointRuntimeSmokeContract,
  type AmazonSpApiConnectionStatusBackendEndpointRuntimeSmokeContract,
} from './amazon-sp-api-connection-status-backend-endpoint-runtime-smoke-contract.dto';

export const AMAZON_SP_API_CONNECTION_STATUS_BACKEND_ENDPOINT_RUNTIME_RECORD_HANDOFF_CONTRACT_VERSION =
  'amazon-sp-api-connection-status-backend-endpoint-runtime-record-handoff-contract-v1' as const;

export type AmazonSpApiConnectionStatusBackendEndpointRuntimeRecordHandoffContract = {
  version: typeof AMAZON_SP_API_CONNECTION_STATUS_BACKEND_ENDPOINT_RUNTIME_RECORD_HANDOFF_CONTRACT_VERSION;
  sourceStep133C: AmazonSpApiConnectionStatusBackendEndpointRuntimeSmokeContract;

  runtimeRecordImplementedNow: true;
  connectionStatusBackendEndpointPhaseCompletedNow: true;

  backendMutationNow: false;
  controllerMutationNow: false;
  serviceMutationNow: false;
  repositoryMutationNow: false;
  frontendMutationNow: false;

  completedPhaseAssertions: {
    step133AContractCompleted: true;
    step133BImplementationCompleted: true;
    step133CRuntimeSmokeCompleted: true;
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

  handoffNotes: {
    backendEndpoint: '/api/imports/amazon-sp-api/connection/status';
    controllerMethod: 'amazonSpApiConnectionStatusBackendEndpoint';
    serviceMethod: 'AmazonSpApiTokenPersistenceService.readConnectionStatus';
    frontendPanelComponent: 'apps/web/src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx';
    frontendApiHelperFile: 'apps/web/src/core/imports/api.ts';
    nextFrontendGap: 'frontend panel still does not read backend connection status endpoint';
    nextSuggestedStep: 'Step134-A: Frontend panel reads Amazon SP-API connection status backend endpoint contract';
  };

  nextAllowedWork: {
    step134AFrontendPanelReadsBackendStatusContract: true;
    step134BFrontendPanelReadsBackendStatusImplementation: false;
    step135RealSpApiReportsRequestImplementation: false;
  };

  summary: {
    step133DCompleted: true;
    connectionStatusBackendEndpointPhaseCompleted: true;
    readyForStep134AFrontendPanelReadsBackendStatusContract: true;
    readyForStep134BFrontendPanelReadsBackendStatusImplementation: false;
    readyForStep135RealSpApiReports: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiConnectionStatusBackendEndpointRuntimeRecordHandoffContract(): AmazonSpApiConnectionStatusBackendEndpointRuntimeRecordHandoffContract {
  const sourceStep133C = assertAmazonSpApiConnectionStatusBackendEndpointRuntimeSmokeContract(
    buildAmazonSpApiConnectionStatusBackendEndpointRuntimeSmokeContract(),
  );

  return {
    version: AMAZON_SP_API_CONNECTION_STATUS_BACKEND_ENDPOINT_RUNTIME_RECORD_HANDOFF_CONTRACT_VERSION,
    sourceStep133C,

    runtimeRecordImplementedNow: true,
    connectionStatusBackendEndpointPhaseCompletedNow: true,

    backendMutationNow: false,
    controllerMutationNow: false,
    serviceMutationNow: false,
    repositoryMutationNow: false,
    frontendMutationNow: false,

    completedPhaseAssertions: {
      step133AContractCompleted: true,
      step133BImplementationCompleted: true,
      step133CRuntimeSmokeCompleted: true,
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

    handoffNotes: {
      backendEndpoint: '/api/imports/amazon-sp-api/connection/status',
      controllerMethod: 'amazonSpApiConnectionStatusBackendEndpoint',
      serviceMethod: 'AmazonSpApiTokenPersistenceService.readConnectionStatus',
      frontendPanelComponent: 'apps/web/src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx',
      frontendApiHelperFile: 'apps/web/src/core/imports/api.ts',
      nextFrontendGap: 'frontend panel still does not read backend connection status endpoint',
      nextSuggestedStep: 'Step134-A: Frontend panel reads Amazon SP-API connection status backend endpoint contract',
    },

    nextAllowedWork: {
      step134AFrontendPanelReadsBackendStatusContract: true,
      step134BFrontendPanelReadsBackendStatusImplementation: false,
      step135RealSpApiReportsRequestImplementation: false,
    },

    summary: {
      step133DCompleted: true,
      connectionStatusBackendEndpointPhaseCompleted: true,
      readyForStep134AFrontendPanelReadsBackendStatusContract: true,
      readyForStep134BFrontendPanelReadsBackendStatusImplementation: false,
      readyForStep135RealSpApiReports: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiConnectionStatusBackendEndpointRuntimeRecordHandoffContract(
  contract: AmazonSpApiConnectionStatusBackendEndpointRuntimeRecordHandoffContract,
): AmazonSpApiConnectionStatusBackendEndpointRuntimeRecordHandoffContract {
  if (contract.version !== AMAZON_SP_API_CONNECTION_STATUS_BACKEND_ENDPOINT_RUNTIME_RECORD_HANDOFF_CONTRACT_VERSION) {
    throw new Error('Step133-D Amazon SP-API connection status backend endpoint runtime record/handoff contract violation: version mismatch.');
  }

  assertAmazonSpApiConnectionStatusBackendEndpointRuntimeSmokeContract(contract.sourceStep133C);

  if (
    contract.sourceStep133C.summary.readyForStep133DConnectionStatusBackendEndpointRuntimeRecordHandoff !== true ||
    contract.runtimeRecordImplementedNow !== true ||
    contract.connectionStatusBackendEndpointPhaseCompletedNow !== true ||
    contract.backendMutationNow !== false ||
    contract.controllerMutationNow !== false ||
    contract.serviceMutationNow !== false ||
    contract.repositoryMutationNow !== false ||
    contract.frontendMutationNow !== false
  ) {
    throw new Error('Step133-D Amazon SP-API connection status backend endpoint runtime record/handoff contract violation: boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    completedPhaseAssertions: contract.completedPhaseAssertions,
    securityBoundary: contract.securityBoundary,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step133-D Amazon SP-API connection status backend endpoint runtime record/handoff contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.handoffNotes.backendEndpoint !== '/api/imports/amazon-sp-api/connection/status' ||
    contract.handoffNotes.controllerMethod !== 'amazonSpApiConnectionStatusBackendEndpoint' ||
    contract.handoffNotes.serviceMethod !== 'AmazonSpApiTokenPersistenceService.readConnectionStatus' ||
    contract.nextAllowedWork.step134AFrontendPanelReadsBackendStatusContract !== true ||
    contract.nextAllowedWork.step134BFrontendPanelReadsBackendStatusImplementation !== false ||
    contract.nextAllowedWork.step135RealSpApiReportsRequestImplementation !== false ||
    contract.summary.step133DCompleted !== true ||
    contract.summary.connectionStatusBackendEndpointPhaseCompleted !== true ||
    contract.summary.readyForStep134AFrontendPanelReadsBackendStatusContract !== true ||
    contract.summary.readyForStep134BFrontendPanelReadsBackendStatusImplementation !== false ||
    contract.summary.readyForStep135RealSpApiReports !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step133-D Amazon SP-API connection status backend endpoint runtime record/handoff contract violation: handoff summary mismatch.');
  }

  return contract;
}
