import {
  assertAmazonSpApiConnectionStatusBackendEndpointContract,
  buildAmazonSpApiConnectionStatusBackendEndpointContract,
  type AmazonSpApiConnectionStatusBackendEndpointContract,
} from './amazon-sp-api-connection-status-backend-endpoint-contract.dto';

export const AMAZON_SP_API_CONNECTION_STATUS_BACKEND_ENDPOINT_IMPLEMENTATION_CONTRACT_VERSION =
  'amazon-sp-api-connection-status-backend-endpoint-implementation-contract-v1' as const;

export type AmazonSpApiConnectionStatusBackendEndpointImplementationContract = {
  version: typeof AMAZON_SP_API_CONNECTION_STATUS_BACKEND_ENDPOINT_IMPLEMENTATION_CONTRACT_VERSION;
  sourceStep133A: AmazonSpApiConnectionStatusBackendEndpointContract;

  backendImplementationNow: true;
  controllerMutationNow: true;
  serviceMutationNow: false;
  repositoryMutationNow: false;
  frontendMutationNow: false;

  implementedEndpoint: {
    method: 'GET';
    controllerPath: "amazon-sp-api/connection/status";
    fullPath: '/api/imports/amazon-sp-api/connection/status';
    guardedByJwt: true;
    queryStoreIdRequired: true;
    queryMarketplaceIdDefault: 'A1VC38T7YXB528';
    queryRegionDefault: 'JP';
  };

  implementedServiceIntegration: {
    serviceName: 'AmazonSpApiTokenPersistenceService';
    serviceMethod: 'readConnectionStatus';
    repositoryMethod: 'readConnectionStatus';
    readOnly: true;
  };

  implementedResponse: {
    source: 'amazon-sp-api-connection-status';
    statuses: ['NOT_CONNECTED', 'CONNECTED', 'RECONNECT_REQUIRED', 'ERROR'];
    includesConnectedBoolean: true;
    includesNeedsReconnectBoolean: true;
    includesMarketplaceId: true;
    includesRegion: true;
    includesStoreId: true;
    includesSellingPartnerIdRedacted: true;
    includesConnectedAt: true;
    includesRevokedAt: true;
    includesLastTokenRefreshAt: true;
    includesLastHealthCheckAt: true;
    includesLastSyncAt: true;
    includesLastErrorCode: true;
    includesLastErrorMessageRedacted: true;
  };

  securityBoundary: {
    noRealSpApiReportsNow: true;
    noRealLwaHttpNow: true;
    noTokenExchangeHttpNow: true;
    noTokenPersistenceWriteNow: true;
    noImportJobCreationNow: true;
    noTransactionWriteNow: true;
    noInventoryWriteNow: true;
    noRawRefreshTokenReturn: true;
    noRawAccessTokenReturn: true;
    noClientSecretReturn: true;
    noFrontendMutationNow: true;
  };

  nextAllowedWork: {
    step133CConnectionStatusBackendEndpointRuntimeSmoke: true;
    step134FrontendPanelReadsBackendStatus: false;
    step135RealSpApiReportsRequestImplementation: false;
  };

  summary: {
    step133BCompleted: true;
    readyForStep133CConnectionStatusBackendEndpointRuntimeSmoke: true;
    readyForStep134FrontendPanelReadsBackendStatus: false;
    readyForStep135RealSpApiReports: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiConnectionStatusBackendEndpointImplementationContract(): AmazonSpApiConnectionStatusBackendEndpointImplementationContract {
  const sourceStep133A = assertAmazonSpApiConnectionStatusBackendEndpointContract(
    buildAmazonSpApiConnectionStatusBackendEndpointContract(),
  );

  return {
    version: AMAZON_SP_API_CONNECTION_STATUS_BACKEND_ENDPOINT_IMPLEMENTATION_CONTRACT_VERSION,
    sourceStep133A,

    backendImplementationNow: true,
    controllerMutationNow: true,
    serviceMutationNow: false,
    repositoryMutationNow: false,
    frontendMutationNow: false,

    implementedEndpoint: {
      method: 'GET',
      controllerPath: "amazon-sp-api/connection/status",
      fullPath: '/api/imports/amazon-sp-api/connection/status',
      guardedByJwt: true,
      queryStoreIdRequired: true,
      queryMarketplaceIdDefault: 'A1VC38T7YXB528',
      queryRegionDefault: 'JP',
    },

    implementedServiceIntegration: {
      serviceName: 'AmazonSpApiTokenPersistenceService',
      serviceMethod: 'readConnectionStatus',
      repositoryMethod: 'readConnectionStatus',
      readOnly: true,
    },

    implementedResponse: {
      source: 'amazon-sp-api-connection-status',
      statuses: ['NOT_CONNECTED', 'CONNECTED', 'RECONNECT_REQUIRED', 'ERROR'],
      includesConnectedBoolean: true,
      includesNeedsReconnectBoolean: true,
      includesMarketplaceId: true,
      includesRegion: true,
      includesStoreId: true,
      includesSellingPartnerIdRedacted: true,
      includesConnectedAt: true,
      includesRevokedAt: true,
      includesLastTokenRefreshAt: true,
      includesLastHealthCheckAt: true,
      includesLastSyncAt: true,
      includesLastErrorCode: true,
      includesLastErrorMessageRedacted: true,
    },

    securityBoundary: {
      noRealSpApiReportsNow: true,
      noRealLwaHttpNow: true,
      noTokenExchangeHttpNow: true,
      noTokenPersistenceWriteNow: true,
      noImportJobCreationNow: true,
      noTransactionWriteNow: true,
      noInventoryWriteNow: true,
      noRawRefreshTokenReturn: true,
      noRawAccessTokenReturn: true,
      noClientSecretReturn: true,
      noFrontendMutationNow: true,
    },

    nextAllowedWork: {
      step133CConnectionStatusBackendEndpointRuntimeSmoke: true,
      step134FrontendPanelReadsBackendStatus: false,
      step135RealSpApiReportsRequestImplementation: false,
    },

    summary: {
      step133BCompleted: true,
      readyForStep133CConnectionStatusBackendEndpointRuntimeSmoke: true,
      readyForStep134FrontendPanelReadsBackendStatus: false,
      readyForStep135RealSpApiReports: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiConnectionStatusBackendEndpointImplementationContract(
  contract: AmazonSpApiConnectionStatusBackendEndpointImplementationContract,
): AmazonSpApiConnectionStatusBackendEndpointImplementationContract {
  if (contract.version !== AMAZON_SP_API_CONNECTION_STATUS_BACKEND_ENDPOINT_IMPLEMENTATION_CONTRACT_VERSION) {
    throw new Error('Step133-B Amazon SP-API connection status backend endpoint implementation contract violation: version mismatch.');
  }

  assertAmazonSpApiConnectionStatusBackendEndpointContract(contract.sourceStep133A);

  if (
    contract.sourceStep133A.summary.readyForStep133BConnectionStatusBackendEndpointImplementation !== true ||
    contract.backendImplementationNow !== true ||
    contract.controllerMutationNow !== true ||
    contract.serviceMutationNow !== false ||
    contract.repositoryMutationNow !== false ||
    contract.frontendMutationNow !== false
  ) {
    throw new Error('Step133-B Amazon SP-API connection status backend endpoint implementation contract violation: implementation boundary mismatch.');
  }

  if (
    contract.implementedEndpoint.method !== 'GET' ||
    contract.implementedEndpoint.controllerPath !== "amazon-sp-api/connection/status" ||
    contract.implementedEndpoint.fullPath !== '/api/imports/amazon-sp-api/connection/status' ||
    contract.implementedEndpoint.guardedByJwt !== true ||
    contract.implementedServiceIntegration.serviceName !== 'AmazonSpApiTokenPersistenceService' ||
    contract.implementedServiceIntegration.serviceMethod !== 'readConnectionStatus' ||
    contract.implementedServiceIntegration.repositoryMethod !== 'readConnectionStatus' ||
    contract.implementedServiceIntegration.readOnly !== true
  ) {
    throw new Error('Step133-B Amazon SP-API connection status backend endpoint implementation contract violation: endpoint/service mismatch.');
  }

  for (const [key, value] of Object.entries(contract.securityBoundary)) {
    if (value !== true) {
      throw new Error(`Step133-B Amazon SP-API connection status backend endpoint implementation contract violation: securityBoundary.${key} must remain true.`);
    }
  }

  if (
    contract.nextAllowedWork.step133CConnectionStatusBackendEndpointRuntimeSmoke !== true ||
    contract.nextAllowedWork.step134FrontendPanelReadsBackendStatus !== false ||
    contract.nextAllowedWork.step135RealSpApiReportsRequestImplementation !== false ||
    contract.summary.step133BCompleted !== true ||
    contract.summary.readyForStep133CConnectionStatusBackendEndpointRuntimeSmoke !== true ||
    contract.summary.readyForStep134FrontendPanelReadsBackendStatus !== false ||
    contract.summary.readyForStep135RealSpApiReports !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step133-B Amazon SP-API connection status backend endpoint implementation contract violation: next-work summary mismatch.');
  }

  return contract;
}
