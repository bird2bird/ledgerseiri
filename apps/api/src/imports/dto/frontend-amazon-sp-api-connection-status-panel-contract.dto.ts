import {
  assertAmazonSpApiOauthCallbackTokenPersistenceRuntimeRecordHandoffContract,
  buildAmazonSpApiOauthCallbackTokenPersistenceRuntimeRecordHandoffContract,
  type AmazonSpApiOauthCallbackTokenPersistenceRuntimeRecordHandoffContract,
} from './amazon-sp-api-oauth-callback-token-persistence-runtime-record-handoff-contract.dto';

export const FRONTEND_AMAZON_SP_API_CONNECTION_STATUS_PANEL_CONTRACT_VERSION =
  'frontend-amazon-sp-api-connection-status-panel-contract-v1' as const;

export type FrontendAmazonSpApiConnectionStatusPanelContract = {
  version: typeof FRONTEND_AMAZON_SP_API_CONNECTION_STATUS_PANEL_CONTRACT_VERSION;
  sourceStep131D: AmazonSpApiOauthCallbackTokenPersistenceRuntimeRecordHandoffContract;

  contractOnly: true;
  frontendImplementationNow: false;
  backendImplementationNow: false;
  controllerMutationNow: false;
  webRouteMutationNow: false;
  uiComponentMutationNow: false;

  plannedFrontendSurface: {
    targetArea: 'Import Center / Data Import';
    targetRoutePattern: '/[lang]/app/data/import';
    targetPurpose: 'Amazon SP-API connection status panel';
    panelName: 'AmazonSpApiConnectionStatusPanel';
    placement: 'above import history and before report import actions';
    primaryCtaLabelJa: 'Amazonと接続';
    secondaryCtaLabelJa: '接続状態を更新';
    reconnectCtaLabelJa: '再接続';
    revokeCtaLabelJa: '接続を解除';
  };

  plannedBackendEndpoints: {
    authorizationUrlRouteReady: true;
    authorizationUrlMethod: 'GET';
    authorizationUrlPath: '/api/imports/amazon-sp-api/oauth/authorization-url';
    callbackRouteReady: true;
    callbackMethod: 'GET';
    callbackPath: '/api/imports/amazon-sp-api/oauth/callback';
    connectionStatusReadServiceReady: true;
    connectionStatusServiceMethod: 'readConnectionStatus';
    revokeConnectionServiceReady: true;
    revokeConnectionServiceMethod: 'revokeConnection';
    frontendStatusEndpointImplementationNow: false;
    frontendRevokeEndpointImplementationNow: false;
  };

  plannedUiStates: {
    notConnected: true;
    connecting: true;
    connected: true;
    reconnectRequired: true;
    error: true;
    loading: true;
    disabled: true;
  };

  plannedUiData: {
    connectionStatus: true;
    marketplaceId: true;
    region: true;
    sellingPartnerIdRedacted: true;
    connectedAt: true;
    lastTokenRefreshAt: true;
    lastHealthCheckAt: true;
    lastSyncAt: true;
    lastErrorCode: true;
    lastErrorMessageRedacted: true;
    rawRefreshTokenNeverRendered: true;
    rawAccessTokenNeverRendered: true;
    clientSecretNeverRendered: true;
  };

  plannedUserFlows: {
    initialLoadReadsConnectionStatus: true;
    connectButtonRequestsAuthorizationUrl: true;
    authorizationUrlOpensAmazonOAuth: true;
    callbackReturnsToImportCenter: true;
    successfulCallbackShowsConnectedState: true;
    failedCallbackShowsRedactedError: true;
    reconnectUsesAuthorizationUrlAgain: true;
    revokeRequiresConfirmation: true;
  };

  boundary: {
    noFrontendImplementationNow: true;
    noRealSpApiReportsNow: true;
    noImportJobCreationNow: true;
    noTransactionWriteNow: true;
    noInventoryWriteNow: true;
    noRealLwaHttpNow: true;
    noRawSecretDisplay: true;
    noRawSecretLocalStorage: true;
    noRawSecretUrlEcho: true;
  };

  nextAllowedWork: {
    step132BFrontendConnectionStatusPanelImplementation: true;
    step132CFrontendConnectionStatusPanelRuntimeSmoke: false;
    step135RealSpApiReportsRequestImplementation: false;
  };

  summary: {
    step132ACompleted: true;
    readyForStep132BFrontendConnectionStatusPanelImplementation: true;
    readyForStep132CFrontendConnectionStatusPanelRuntimeSmoke: false;
    readyForStep135RealSpApiReports: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildFrontendAmazonSpApiConnectionStatusPanelContract(): FrontendAmazonSpApiConnectionStatusPanelContract {
  const sourceStep131D = assertAmazonSpApiOauthCallbackTokenPersistenceRuntimeRecordHandoffContract(
    buildAmazonSpApiOauthCallbackTokenPersistenceRuntimeRecordHandoffContract(),
  );

  return {
    version: FRONTEND_AMAZON_SP_API_CONNECTION_STATUS_PANEL_CONTRACT_VERSION,
    sourceStep131D,

    contractOnly: true,
    frontendImplementationNow: false,
    backendImplementationNow: false,
    controllerMutationNow: false,
    webRouteMutationNow: false,
    uiComponentMutationNow: false,

    plannedFrontendSurface: {
      targetArea: 'Import Center / Data Import',
      targetRoutePattern: '/[lang]/app/data/import',
      targetPurpose: 'Amazon SP-API connection status panel',
      panelName: 'AmazonSpApiConnectionStatusPanel',
      placement: 'above import history and before report import actions',
      primaryCtaLabelJa: 'Amazonと接続',
      secondaryCtaLabelJa: '接続状態を更新',
      reconnectCtaLabelJa: '再接続',
      revokeCtaLabelJa: '接続を解除',
    },

    plannedBackendEndpoints: {
      authorizationUrlRouteReady: true,
      authorizationUrlMethod: 'GET',
      authorizationUrlPath: '/api/imports/amazon-sp-api/oauth/authorization-url',
      callbackRouteReady: true,
      callbackMethod: 'GET',
      callbackPath: '/api/imports/amazon-sp-api/oauth/callback',
      connectionStatusReadServiceReady: true,
      connectionStatusServiceMethod: 'readConnectionStatus',
      revokeConnectionServiceReady: true,
      revokeConnectionServiceMethod: 'revokeConnection',
      frontendStatusEndpointImplementationNow: false,
      frontendRevokeEndpointImplementationNow: false,
    },

    plannedUiStates: {
      notConnected: true,
      connecting: true,
      connected: true,
      reconnectRequired: true,
      error: true,
      loading: true,
      disabled: true,
    },

    plannedUiData: {
      connectionStatus: true,
      marketplaceId: true,
      region: true,
      sellingPartnerIdRedacted: true,
      connectedAt: true,
      lastTokenRefreshAt: true,
      lastHealthCheckAt: true,
      lastSyncAt: true,
      lastErrorCode: true,
      lastErrorMessageRedacted: true,
      rawRefreshTokenNeverRendered: true,
      rawAccessTokenNeverRendered: true,
      clientSecretNeverRendered: true,
    },

    plannedUserFlows: {
      initialLoadReadsConnectionStatus: true,
      connectButtonRequestsAuthorizationUrl: true,
      authorizationUrlOpensAmazonOAuth: true,
      callbackReturnsToImportCenter: true,
      successfulCallbackShowsConnectedState: true,
      failedCallbackShowsRedactedError: true,
      reconnectUsesAuthorizationUrlAgain: true,
      revokeRequiresConfirmation: true,
    },

    boundary: {
      noFrontendImplementationNow: true,
      noRealSpApiReportsNow: true,
      noImportJobCreationNow: true,
      noTransactionWriteNow: true,
      noInventoryWriteNow: true,
      noRealLwaHttpNow: true,
      noRawSecretDisplay: true,
      noRawSecretLocalStorage: true,
      noRawSecretUrlEcho: true,
    },

    nextAllowedWork: {
      step132BFrontendConnectionStatusPanelImplementation: true,
      step132CFrontendConnectionStatusPanelRuntimeSmoke: false,
      step135RealSpApiReportsRequestImplementation: false,
    },

    summary: {
      step132ACompleted: true,
      readyForStep132BFrontendConnectionStatusPanelImplementation: true,
      readyForStep132CFrontendConnectionStatusPanelRuntimeSmoke: false,
      readyForStep135RealSpApiReports: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertFrontendAmazonSpApiConnectionStatusPanelContract(
  contract: FrontendAmazonSpApiConnectionStatusPanelContract,
): FrontendAmazonSpApiConnectionStatusPanelContract {
  if (contract.version !== FRONTEND_AMAZON_SP_API_CONNECTION_STATUS_PANEL_CONTRACT_VERSION) {
    throw new Error('Step132-A frontend Amazon SP-API connection status panel contract violation: version mismatch.');
  }

  assertAmazonSpApiOauthCallbackTokenPersistenceRuntimeRecordHandoffContract(contract.sourceStep131D);

  if (
    contract.sourceStep131D.summary.readyForStep132AFrontendConnectionStatusPanelContract !== true ||
    contract.contractOnly !== true ||
    contract.frontendImplementationNow !== false ||
    contract.backendImplementationNow !== false ||
    contract.controllerMutationNow !== false ||
    contract.webRouteMutationNow !== false ||
    contract.uiComponentMutationNow !== false
  ) {
    throw new Error('Step132-A frontend Amazon SP-API connection status panel contract violation: implementation boundary mismatch.');
  }

  if (
    contract.plannedFrontendSurface.targetRoutePattern !== '/[lang]/app/data/import' ||
    contract.plannedFrontendSurface.panelName !== 'AmazonSpApiConnectionStatusPanel' ||
    contract.plannedBackendEndpoints.authorizationUrlPath !== '/api/imports/amazon-sp-api/oauth/authorization-url' ||
    contract.plannedBackendEndpoints.callbackPath !== '/api/imports/amazon-sp-api/oauth/callback' ||
    contract.plannedBackendEndpoints.connectionStatusServiceMethod !== 'readConnectionStatus' ||
    contract.plannedBackendEndpoints.revokeConnectionServiceMethod !== 'revokeConnection'
  ) {
    throw new Error('Step132-A frontend Amazon SP-API connection status panel contract violation: planned surface/backend mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    plannedUiStates: contract.plannedUiStates,
    plannedUiData: contract.plannedUiData,
    plannedUserFlows: contract.plannedUserFlows,
    boundary: contract.boundary,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step132-A frontend Amazon SP-API connection status panel contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.plannedBackendEndpoints.authorizationUrlRouteReady !== true ||
    contract.plannedBackendEndpoints.callbackRouteReady !== true ||
    contract.plannedBackendEndpoints.connectionStatusReadServiceReady !== true ||
    contract.plannedBackendEndpoints.revokeConnectionServiceReady !== true ||
    contract.plannedBackendEndpoints.frontendStatusEndpointImplementationNow !== false ||
    contract.plannedBackendEndpoints.frontendRevokeEndpointImplementationNow !== false ||
    contract.nextAllowedWork.step132BFrontendConnectionStatusPanelImplementation !== true ||
    contract.nextAllowedWork.step132CFrontendConnectionStatusPanelRuntimeSmoke !== false ||
    contract.nextAllowedWork.step135RealSpApiReportsRequestImplementation !== false ||
    contract.summary.step132ACompleted !== true ||
    contract.summary.readyForStep132BFrontendConnectionStatusPanelImplementation !== true ||
    contract.summary.readyForStep132CFrontendConnectionStatusPanelRuntimeSmoke !== false ||
    contract.summary.readyForStep135RealSpApiReports !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step132-A frontend Amazon SP-API connection status panel contract violation: next-work summary mismatch.');
  }

  return contract;
}
