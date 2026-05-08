import {
  assertFrontendAmazonSpApiConnectionStatusPanelRuntimeRecordHandoffContract,
  buildFrontendAmazonSpApiConnectionStatusPanelRuntimeRecordHandoffContract,
  type FrontendAmazonSpApiConnectionStatusPanelRuntimeRecordHandoffContract,
} from './frontend-amazon-sp-api-connection-status-panel-runtime-record-handoff-contract.dto';

export const AMAZON_SP_API_CONNECTION_STATUS_BACKEND_ENDPOINT_CONTRACT_VERSION =
  'amazon-sp-api-connection-status-backend-endpoint-contract-v1' as const;

export type AmazonSpApiConnectionStatusValue =
  | 'NOT_CONNECTED'
  | 'CONNECTED'
  | 'RECONNECT_REQUIRED'
  | 'ERROR';

export type AmazonSpApiConnectionStatusBackendEndpointContract = {
  version: typeof AMAZON_SP_API_CONNECTION_STATUS_BACKEND_ENDPOINT_CONTRACT_VERSION;
  sourceStep132D: FrontendAmazonSpApiConnectionStatusPanelRuntimeRecordHandoffContract;

  contractOnly: true;
  backendImplementationNow: false;
  controllerMutationNow: false;
  serviceMutationNow: false;
  repositoryMutationNow: false;
  frontendMutationNow: false;

  plannedEndpoint: {
    method: 'GET';
    path: '/api/imports/amazon-sp-api/connection/status';
    queryStoreId: 'storeId';
    queryMarketplaceId: 'marketplaceId';
    queryRegion: 'region';
    defaultMarketplaceId: 'A1VC38T7YXB528';
    defaultRegion: 'JP';
    responseShape: 'AmazonSpApiConnectionStatusResponse';
  };

  plannedServiceIntegration: {
    serviceName: 'AmazonSpApiTokenPersistenceService';
    serviceMethod: 'readConnectionStatus';
    revokeMethodExistingButNotWiredNow: 'revokeConnection';
    repositoryReadOnlyNow: true;
    usesCompanyStoreMarketplaceRegion: true;
  };

  plannedResponseFields: {
    status: AmazonSpApiConnectionStatusValue;
    connected: boolean;
    needsReconnect: boolean;
    marketplaceId: string;
    region: string;
    storeId: string;
    sellingPartnerIdRedacted: string | null;
    connectedAt: string | null;
    lastTokenRefreshAt: string | null;
    lastHealthCheckAt: string | null;
    lastSyncAt: string | null;
    lastErrorCode: string | null;
    lastErrorMessageRedacted: string | null;
  };

  plannedUiConsumer: {
    frontendPanelComponent: 'apps/web/src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx';
    frontendApiHelper: 'apps/web/src/core/imports/api.ts';
    futureHelperName: 'readAmazonSpApiConnectionStatus';
    futureRefreshButtonUsesEndpoint: true;
    futureInitialLoadUsesEndpoint: true;
  };

  boundary: {
    noImplementationNow: true;
    noFrontendMutationNow: true;
    noRealSpApiReportsNow: true;
    noRealLwaHttpNow: true;
    noImportJobCreationNow: true;
    noTransactionWriteNow: true;
    noInventoryWriteNow: true;
    noRawRefreshTokenReturn: true;
    noRawAccessTokenReturn: true;
    noClientSecretReturn: true;
    noSecretPersistenceMutationNow: true;
  };

  nextAllowedWork: {
    step133BConnectionStatusBackendEndpointImplementation: true;
    step133CConnectionStatusBackendEndpointRuntimeSmoke: false;
    step134FrontendPanelReadsBackendStatus: false;
    step135RealSpApiReportsRequestImplementation: false;
  };

  summary: {
    step133ACompleted: true;
    readyForStep133BConnectionStatusBackendEndpointImplementation: true;
    readyForStep133CConnectionStatusBackendEndpointRuntimeSmoke: false;
    readyForStep134FrontendPanelReadsBackendStatus: false;
    readyForStep135RealSpApiReports: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiConnectionStatusBackendEndpointContract(): AmazonSpApiConnectionStatusBackendEndpointContract {
  const sourceStep132D = assertFrontendAmazonSpApiConnectionStatusPanelRuntimeRecordHandoffContract(
    buildFrontendAmazonSpApiConnectionStatusPanelRuntimeRecordHandoffContract(),
  );

  return {
    version: AMAZON_SP_API_CONNECTION_STATUS_BACKEND_ENDPOINT_CONTRACT_VERSION,
    sourceStep132D,

    contractOnly: true,
    backendImplementationNow: false,
    controllerMutationNow: false,
    serviceMutationNow: false,
    repositoryMutationNow: false,
    frontendMutationNow: false,

    plannedEndpoint: {
      method: 'GET',
      path: '/api/imports/amazon-sp-api/connection/status',
      queryStoreId: 'storeId',
      queryMarketplaceId: 'marketplaceId',
      queryRegion: 'region',
      defaultMarketplaceId: 'A1VC38T7YXB528',
      defaultRegion: 'JP',
      responseShape: 'AmazonSpApiConnectionStatusResponse',
    },

    plannedServiceIntegration: {
      serviceName: 'AmazonSpApiTokenPersistenceService',
      serviceMethod: 'readConnectionStatus',
      revokeMethodExistingButNotWiredNow: 'revokeConnection',
      repositoryReadOnlyNow: true,
      usesCompanyStoreMarketplaceRegion: true,
    },

    plannedResponseFields: {
      status: 'NOT_CONNECTED',
      connected: false,
      needsReconnect: false,
      marketplaceId: 'A1VC38T7YXB528',
      region: 'JP',
      storeId: 'store-step130b-boundary',
      sellingPartnerIdRedacted: null,
      connectedAt: null,
      lastTokenRefreshAt: null,
      lastHealthCheckAt: null,
      lastSyncAt: null,
      lastErrorCode: null,
      lastErrorMessageRedacted: null,
    },

    plannedUiConsumer: {
      frontendPanelComponent: 'apps/web/src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx',
      frontendApiHelper: 'apps/web/src/core/imports/api.ts',
      futureHelperName: 'readAmazonSpApiConnectionStatus',
      futureRefreshButtonUsesEndpoint: true,
      futureInitialLoadUsesEndpoint: true,
    },

    boundary: {
      noImplementationNow: true,
      noFrontendMutationNow: true,
      noRealSpApiReportsNow: true,
      noRealLwaHttpNow: true,
      noImportJobCreationNow: true,
      noTransactionWriteNow: true,
      noInventoryWriteNow: true,
      noRawRefreshTokenReturn: true,
      noRawAccessTokenReturn: true,
      noClientSecretReturn: true,
      noSecretPersistenceMutationNow: true,
    },

    nextAllowedWork: {
      step133BConnectionStatusBackendEndpointImplementation: true,
      step133CConnectionStatusBackendEndpointRuntimeSmoke: false,
      step134FrontendPanelReadsBackendStatus: false,
      step135RealSpApiReportsRequestImplementation: false,
    },

    summary: {
      step133ACompleted: true,
      readyForStep133BConnectionStatusBackendEndpointImplementation: true,
      readyForStep133CConnectionStatusBackendEndpointRuntimeSmoke: false,
      readyForStep134FrontendPanelReadsBackendStatus: false,
      readyForStep135RealSpApiReports: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiConnectionStatusBackendEndpointContract(
  contract: AmazonSpApiConnectionStatusBackendEndpointContract,
): AmazonSpApiConnectionStatusBackendEndpointContract {
  if (contract.version !== AMAZON_SP_API_CONNECTION_STATUS_BACKEND_ENDPOINT_CONTRACT_VERSION) {
    throw new Error('Step133-A Amazon SP-API connection status backend endpoint contract violation: version mismatch.');
  }

  assertFrontendAmazonSpApiConnectionStatusPanelRuntimeRecordHandoffContract(contract.sourceStep132D);

  if (
    contract.sourceStep132D.summary.readyForStep133AConnectionStatusBackendEndpointContract !== true ||
    contract.contractOnly !== true ||
    contract.backendImplementationNow !== false ||
    contract.controllerMutationNow !== false ||
    contract.serviceMutationNow !== false ||
    contract.repositoryMutationNow !== false ||
    contract.frontendMutationNow !== false
  ) {
    throw new Error('Step133-A Amazon SP-API connection status backend endpoint contract violation: implementation boundary mismatch.');
  }

  if (
    contract.plannedEndpoint.method !== 'GET' ||
    contract.plannedEndpoint.path !== '/api/imports/amazon-sp-api/connection/status' ||
    contract.plannedEndpoint.queryStoreId !== 'storeId' ||
    contract.plannedEndpoint.queryMarketplaceId !== 'marketplaceId' ||
    contract.plannedEndpoint.queryRegion !== 'region' ||
    contract.plannedServiceIntegration.serviceName !== 'AmazonSpApiTokenPersistenceService' ||
    contract.plannedServiceIntegration.serviceMethod !== 'readConnectionStatus'
  ) {
    throw new Error('Step133-A Amazon SP-API connection status backend endpoint contract violation: planned endpoint/service mismatch.');
  }

  for (const [key, value] of Object.entries(contract.boundary)) {
    if (value !== true) {
      throw new Error(`Step133-A Amazon SP-API connection status backend endpoint contract violation: boundary.${key} must remain true.`);
    }
  }

  if (
    contract.plannedUiConsumer.futureHelperName !== 'readAmazonSpApiConnectionStatus' ||
    contract.plannedUiConsumer.futureRefreshButtonUsesEndpoint !== true ||
    contract.plannedUiConsumer.futureInitialLoadUsesEndpoint !== true ||
    contract.nextAllowedWork.step133BConnectionStatusBackendEndpointImplementation !== true ||
    contract.nextAllowedWork.step133CConnectionStatusBackendEndpointRuntimeSmoke !== false ||
    contract.nextAllowedWork.step134FrontendPanelReadsBackendStatus !== false ||
    contract.nextAllowedWork.step135RealSpApiReportsRequestImplementation !== false ||
    contract.summary.step133ACompleted !== true ||
    contract.summary.readyForStep133BConnectionStatusBackendEndpointImplementation !== true ||
    contract.summary.readyForStep133CConnectionStatusBackendEndpointRuntimeSmoke !== false ||
    contract.summary.readyForStep134FrontendPanelReadsBackendStatus !== false ||
    contract.summary.readyForStep135RealSpApiReports !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step133-A Amazon SP-API connection status backend endpoint contract violation: next-work summary mismatch.');
  }

  return contract;
}
