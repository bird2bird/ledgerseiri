import {
  assertAmazonSpApiConnectionStatusBackendEndpointRuntimeRecordHandoffContract,
  buildAmazonSpApiConnectionStatusBackendEndpointRuntimeRecordHandoffContract,
  type AmazonSpApiConnectionStatusBackendEndpointRuntimeRecordHandoffContract,
} from './amazon-sp-api-connection-status-backend-endpoint-runtime-record-handoff-contract.dto';

export const FRONTEND_AMAZON_SP_API_CONNECTION_STATUS_PANEL_READ_BACKEND_CONTRACT_VERSION =
  'frontend-amazon-sp-api-connection-status-panel-read-backend-contract-v1' as const;

export type FrontendAmazonSpApiConnectionStatusPanelReadBackendContract = {
  version: typeof FRONTEND_AMAZON_SP_API_CONNECTION_STATUS_PANEL_READ_BACKEND_CONTRACT_VERSION;
  sourceStep133D: AmazonSpApiConnectionStatusBackendEndpointRuntimeRecordHandoffContract;

  contractOnly: true;
  frontendImplementationNow: false;
  backendImplementationNow: false;
  uiComponentMutationNow: false;
  apiHelperMutationNow: false;
  controllerMutationNow: false;

  plannedFrontendApiHelper: {
    helperName: 'readAmazonSpApiConnectionStatus';
    helperFile: 'apps/web/src/core/imports/api.ts';
    method: 'GET';
    path: '/api/imports/amazon-sp-api/connection/status';
    queryStoreId: 'storeId';
    queryMarketplaceId: 'marketplaceId';
    queryRegion: 'region';
    defaultMarketplaceId: 'A1VC38T7YXB528';
    defaultRegion: 'JP';
    usesCredentialsInclude: true;
    usesNoStoreCache: true;
  };

  plannedPanelIntegration: {
    componentFile: 'apps/web/src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx';
    componentName: 'AmazonSpApiConnectionStatusPanel';
    initialLoadReadsBackendStatus: true;
    refreshButtonReadsBackendStatus: true;
    connectButtonRemainsAuthorizationUrlFlow: true;
    reconnectButtonRemainsAuthorizationUrlFlow: true;
    callbackUrlHintStillSupportedAsFallback: true;
    revokeButtonRemainsDisabledNow: true;
  };

  plannedStatusMapping: {
    notConnected: 'NOT_CONNECTED';
    connected: 'CONNECTED';
    reconnectRequired: 'RECONNECT_REQUIRED';
    error: 'ERROR';
    connectedMapsToConnectedHint: true;
    reconnectRequiredMapsToReconnectRequired: true;
    errorMapsToError: true;
    notConnectedMapsToNotConnected: true;
  };

  plannedResponseDataUsage: {
    source: 'amazon-sp-api-connection-status';
    status: true;
    connected: true;
    needsReconnect: true;
    marketplaceId: true;
    region: true;
    storeId: true;
    sellingPartnerIdRedacted: true;
    connectedAt: true;
    revokedAt: true;
    lastTokenRefreshAt: true;
    lastHealthCheckAt: true;
    lastSyncAt: true;
    lastErrorCode: true;
    lastErrorMessageRedacted: true;
  };

  securityBoundary: {
    noImplementationNow: true;
    noBackendMutationNow: true;
    noRealSpApiReportsNow: true;
    noRealLwaHttpNow: true;
    noTokenExchangeHttpNow: true;
    noImportJobCreationNow: true;
    noTransactionWriteNow: true;
    noInventoryWriteNow: true;
    noRawRefreshTokenRender: true;
    noRawAccessTokenRender: true;
    noClientSecretRender: true;
    noRawSecretLocalStorage: true;
    noRawSecretSessionStorage: true;
  };

  nextAllowedWork: {
    step134BFrontendPanelReadsBackendStatusImplementation: true;
    step134CFrontendPanelReadsBackendStatusRuntimeSmoke: false;
    step135RealSpApiReportsRequestImplementation: false;
  };

  summary: {
    step134ACompleted: true;
    readyForStep134BFrontendPanelReadsBackendStatusImplementation: true;
    readyForStep134CFrontendPanelReadsBackendStatusRuntimeSmoke: false;
    readyForStep135RealSpApiReports: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildFrontendAmazonSpApiConnectionStatusPanelReadBackendContract(): FrontendAmazonSpApiConnectionStatusPanelReadBackendContract {
  const sourceStep133D = assertAmazonSpApiConnectionStatusBackendEndpointRuntimeRecordHandoffContract(
    buildAmazonSpApiConnectionStatusBackendEndpointRuntimeRecordHandoffContract(),
  );

  return {
    version: FRONTEND_AMAZON_SP_API_CONNECTION_STATUS_PANEL_READ_BACKEND_CONTRACT_VERSION,
    sourceStep133D,

    contractOnly: true,
    frontendImplementationNow: false,
    backendImplementationNow: false,
    uiComponentMutationNow: false,
    apiHelperMutationNow: false,
    controllerMutationNow: false,

    plannedFrontendApiHelper: {
      helperName: 'readAmazonSpApiConnectionStatus',
      helperFile: 'apps/web/src/core/imports/api.ts',
      method: 'GET',
      path: '/api/imports/amazon-sp-api/connection/status',
      queryStoreId: 'storeId',
      queryMarketplaceId: 'marketplaceId',
      queryRegion: 'region',
      defaultMarketplaceId: 'A1VC38T7YXB528',
      defaultRegion: 'JP',
      usesCredentialsInclude: true,
      usesNoStoreCache: true,
    },

    plannedPanelIntegration: {
      componentFile: 'apps/web/src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx',
      componentName: 'AmazonSpApiConnectionStatusPanel',
      initialLoadReadsBackendStatus: true,
      refreshButtonReadsBackendStatus: true,
      connectButtonRemainsAuthorizationUrlFlow: true,
      reconnectButtonRemainsAuthorizationUrlFlow: true,
      callbackUrlHintStillSupportedAsFallback: true,
      revokeButtonRemainsDisabledNow: true,
    },

    plannedStatusMapping: {
      notConnected: 'NOT_CONNECTED',
      connected: 'CONNECTED',
      reconnectRequired: 'RECONNECT_REQUIRED',
      error: 'ERROR',
      connectedMapsToConnectedHint: true,
      reconnectRequiredMapsToReconnectRequired: true,
      errorMapsToError: true,
      notConnectedMapsToNotConnected: true,
    },

    plannedResponseDataUsage: {
      source: 'amazon-sp-api-connection-status',
      status: true,
      connected: true,
      needsReconnect: true,
      marketplaceId: true,
      region: true,
      storeId: true,
      sellingPartnerIdRedacted: true,
      connectedAt: true,
      revokedAt: true,
      lastTokenRefreshAt: true,
      lastHealthCheckAt: true,
      lastSyncAt: true,
      lastErrorCode: true,
      lastErrorMessageRedacted: true,
    },

    securityBoundary: {
      noImplementationNow: true,
      noBackendMutationNow: true,
      noRealSpApiReportsNow: true,
      noRealLwaHttpNow: true,
      noTokenExchangeHttpNow: true,
      noImportJobCreationNow: true,
      noTransactionWriteNow: true,
      noInventoryWriteNow: true,
      noRawRefreshTokenRender: true,
      noRawAccessTokenRender: true,
      noClientSecretRender: true,
      noRawSecretLocalStorage: true,
      noRawSecretSessionStorage: true,
    },

    nextAllowedWork: {
      step134BFrontendPanelReadsBackendStatusImplementation: true,
      step134CFrontendPanelReadsBackendStatusRuntimeSmoke: false,
      step135RealSpApiReportsRequestImplementation: false,
    },

    summary: {
      step134ACompleted: true,
      readyForStep134BFrontendPanelReadsBackendStatusImplementation: true,
      readyForStep134CFrontendPanelReadsBackendStatusRuntimeSmoke: false,
      readyForStep135RealSpApiReports: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertFrontendAmazonSpApiConnectionStatusPanelReadBackendContract(
  contract: FrontendAmazonSpApiConnectionStatusPanelReadBackendContract,
): FrontendAmazonSpApiConnectionStatusPanelReadBackendContract {
  if (contract.version !== FRONTEND_AMAZON_SP_API_CONNECTION_STATUS_PANEL_READ_BACKEND_CONTRACT_VERSION) {
    throw new Error('Step134-A frontend Amazon SP-API connection status panel read-backend contract violation: version mismatch.');
  }

  assertAmazonSpApiConnectionStatusBackendEndpointRuntimeRecordHandoffContract(contract.sourceStep133D);

  if (
    contract.sourceStep133D.summary.readyForStep134AFrontendPanelReadsBackendStatusContract !== true ||
    contract.contractOnly !== true ||
    contract.frontendImplementationNow !== false ||
    contract.backendImplementationNow !== false ||
    contract.uiComponentMutationNow !== false ||
    contract.apiHelperMutationNow !== false ||
    contract.controllerMutationNow !== false
  ) {
    throw new Error('Step134-A frontend Amazon SP-API connection status panel read-backend contract violation: implementation boundary mismatch.');
  }

  if (
    contract.plannedFrontendApiHelper.helperName !== 'readAmazonSpApiConnectionStatus' ||
    contract.plannedFrontendApiHelper.path !== '/api/imports/amazon-sp-api/connection/status' ||
    contract.plannedFrontendApiHelper.usesCredentialsInclude !== true ||
    contract.plannedFrontendApiHelper.usesNoStoreCache !== true ||
    contract.plannedPanelIntegration.componentName !== 'AmazonSpApiConnectionStatusPanel' ||
    contract.plannedPanelIntegration.initialLoadReadsBackendStatus !== true ||
    contract.plannedPanelIntegration.refreshButtonReadsBackendStatus !== true
  ) {
    throw new Error('Step134-A frontend Amazon SP-API connection status panel read-backend contract violation: planned frontend integration mismatch.');
  }

  if (
    contract.plannedStatusMapping.notConnected !== 'NOT_CONNECTED' ||
    contract.plannedStatusMapping.connected !== 'CONNECTED' ||
    contract.plannedStatusMapping.reconnectRequired !== 'RECONNECT_REQUIRED' ||
    contract.plannedStatusMapping.error !== 'ERROR' ||
    contract.plannedStatusMapping.connectedMapsToConnectedHint !== true ||
    contract.plannedStatusMapping.reconnectRequiredMapsToReconnectRequired !== true ||
    contract.plannedStatusMapping.errorMapsToError !== true ||
    contract.plannedStatusMapping.notConnectedMapsToNotConnected !== true
  ) {
    throw new Error('Step134-A frontend Amazon SP-API connection status panel read-backend contract violation: status mapping mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    plannedResponseDataUsage: contract.plannedResponseDataUsage,
    securityBoundary: contract.securityBoundary,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (typeof value === 'string') continue;
      if (value !== true) {
        throw new Error(`Step134-A frontend Amazon SP-API connection status panel read-backend contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.nextAllowedWork.step134BFrontendPanelReadsBackendStatusImplementation !== true ||
    contract.nextAllowedWork.step134CFrontendPanelReadsBackendStatusRuntimeSmoke !== false ||
    contract.nextAllowedWork.step135RealSpApiReportsRequestImplementation !== false ||
    contract.summary.step134ACompleted !== true ||
    contract.summary.readyForStep134BFrontendPanelReadsBackendStatusImplementation !== true ||
    contract.summary.readyForStep134CFrontendPanelReadsBackendStatusRuntimeSmoke !== false ||
    contract.summary.readyForStep135RealSpApiReports !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step134-A frontend Amazon SP-API connection status panel read-backend contract violation: next-work summary mismatch.');
  }

  return contract;
}
