import {
  assertFrontendAmazonSpApiConnectionStatusPanelContract,
  buildFrontendAmazonSpApiConnectionStatusPanelContract,
  type FrontendAmazonSpApiConnectionStatusPanelContract,
} from './frontend-amazon-sp-api-connection-status-panel-contract.dto';

export const FRONTEND_AMAZON_SP_API_CONNECTION_STATUS_PANEL_IMPLEMENTATION_CONTRACT_VERSION =
  'frontend-amazon-sp-api-connection-status-panel-implementation-contract-v1' as const;

export type FrontendAmazonSpApiConnectionStatusPanelImplementationContract = {
  version: typeof FRONTEND_AMAZON_SP_API_CONNECTION_STATUS_PANEL_IMPLEMENTATION_CONTRACT_VERSION;
  sourceStep132A: FrontendAmazonSpApiConnectionStatusPanelContract;

  frontendImplementationNow: true;
  backendImplementationNow: false;
  controllerMutationNow: false;
  webRouteMutationNow: true;
  uiComponentMutationNow: true;

  implementedFrontendSurface: {
    targetRoutePattern: '/[lang]/app/data/import';
    componentPath: 'apps/web/src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx';
    apiHelperPath: 'apps/web/src/core/imports/api.ts';
    componentName: 'AmazonSpApiConnectionStatusPanel';
    connectButtonTestId: 'amazon-sp-api-connect-button';
    statusBadgeTestId: 'amazon-sp-api-connection-status-badge';
    panelTestId: 'amazon-sp-api-connection-status-panel';
    primaryCtaLabelJa: 'Amazonと接続';
    refreshCtaLabelJa: '接続状態を更新';
    reconnectCtaLabelJa: '再接続';
    revokeCtaLabelJa: '接続を解除';
  };

  implementedApiHelpers: {
    requestAuthorizationUrlHelper: 'requestAmazonSpApiAuthorizationUrl';
    authorizationUrlPath: '/api/imports/amazon-sp-api/oauth/authorization-url';
    usesCredentialsInclude: true;
    usesNoStoreCache: true;
    sendsStoreId: true;
    sendsMarketplaceId: true;
    sendsRegion: true;
    sendsReturnTo: true;
    sendsSandbox: true;
    sendsForceReauthorize: true;
  };

  implementedUiStates: {
    notConnected: true;
    connecting: true;
    authorizationReady: true;
    connectedHint: true;
    error: true;
    disabledRevokeUntilBackendRoute: true;
  };

  securityBoundary: {
    noBackendImplementationNow: true;
    noRealSpApiReportsNow: true;
    noImportJobCreationNow: true;
    noTransactionWriteNow: true;
    noInventoryWriteNow: true;
    noRawRefreshTokenRendered: true;
    noRawAccessTokenRendered: true;
    noClientSecretRendered: true;
    noRawSecretLocalStorage: true;
  };

  nextAllowedWork: {
    step132CFrontendConnectionStatusPanelRuntimeSmoke: true;
    step132DFrontendConnectionStatusPanelRecordHandoff: false;
    step133ConnectionStatusBackendEndpoint: false;
    step135RealSpApiReportsRequestImplementation: false;
  };

  summary: {
    step132BCompleted: true;
    readyForStep132CFrontendConnectionStatusPanelRuntimeSmoke: true;
    readyForStep132DFrontendConnectionStatusPanelRecordHandoff: false;
    readyForStep133ConnectionStatusBackendEndpoint: false;
    readyForStep135RealSpApiReports: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildFrontendAmazonSpApiConnectionStatusPanelImplementationContract(): FrontendAmazonSpApiConnectionStatusPanelImplementationContract {
  const sourceStep132A = assertFrontendAmazonSpApiConnectionStatusPanelContract(
    buildFrontendAmazonSpApiConnectionStatusPanelContract(),
  );

  return {
    version: FRONTEND_AMAZON_SP_API_CONNECTION_STATUS_PANEL_IMPLEMENTATION_CONTRACT_VERSION,
    sourceStep132A,

    frontendImplementationNow: true,
    backendImplementationNow: false,
    controllerMutationNow: false,
    webRouteMutationNow: true,
    uiComponentMutationNow: true,

    implementedFrontendSurface: {
      targetRoutePattern: '/[lang]/app/data/import',
      componentPath: 'apps/web/src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx',
      apiHelperPath: 'apps/web/src/core/imports/api.ts',
      componentName: 'AmazonSpApiConnectionStatusPanel',
      connectButtonTestId: 'amazon-sp-api-connect-button',
      statusBadgeTestId: 'amazon-sp-api-connection-status-badge',
      panelTestId: 'amazon-sp-api-connection-status-panel',
      primaryCtaLabelJa: 'Amazonと接続',
      refreshCtaLabelJa: '接続状態を更新',
      reconnectCtaLabelJa: '再接続',
      revokeCtaLabelJa: '接続を解除',
    },

    implementedApiHelpers: {
      requestAuthorizationUrlHelper: 'requestAmazonSpApiAuthorizationUrl',
      authorizationUrlPath: '/api/imports/amazon-sp-api/oauth/authorization-url',
      usesCredentialsInclude: true,
      usesNoStoreCache: true,
      sendsStoreId: true,
      sendsMarketplaceId: true,
      sendsRegion: true,
      sendsReturnTo: true,
      sendsSandbox: true,
      sendsForceReauthorize: true,
    },

    implementedUiStates: {
      notConnected: true,
      connecting: true,
      authorizationReady: true,
      connectedHint: true,
      error: true,
      disabledRevokeUntilBackendRoute: true,
    },

    securityBoundary: {
      noBackendImplementationNow: true,
      noRealSpApiReportsNow: true,
      noImportJobCreationNow: true,
      noTransactionWriteNow: true,
      noInventoryWriteNow: true,
      noRawRefreshTokenRendered: true,
      noRawAccessTokenRendered: true,
      noClientSecretRendered: true,
      noRawSecretLocalStorage: true,
    },

    nextAllowedWork: {
      step132CFrontendConnectionStatusPanelRuntimeSmoke: true,
      step132DFrontendConnectionStatusPanelRecordHandoff: false,
      step133ConnectionStatusBackendEndpoint: false,
      step135RealSpApiReportsRequestImplementation: false,
    },

    summary: {
      step132BCompleted: true,
      readyForStep132CFrontendConnectionStatusPanelRuntimeSmoke: true,
      readyForStep132DFrontendConnectionStatusPanelRecordHandoff: false,
      readyForStep133ConnectionStatusBackendEndpoint: false,
      readyForStep135RealSpApiReports: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertFrontendAmazonSpApiConnectionStatusPanelImplementationContract(
  contract: FrontendAmazonSpApiConnectionStatusPanelImplementationContract,
): FrontendAmazonSpApiConnectionStatusPanelImplementationContract {
  if (contract.version !== FRONTEND_AMAZON_SP_API_CONNECTION_STATUS_PANEL_IMPLEMENTATION_CONTRACT_VERSION) {
    throw new Error('Step132-B frontend Amazon SP-API connection status panel implementation contract violation: version mismatch.');
  }

  assertFrontendAmazonSpApiConnectionStatusPanelContract(contract.sourceStep132A);

  if (
    contract.sourceStep132A.summary.readyForStep132BFrontendConnectionStatusPanelImplementation !== true ||
    contract.frontendImplementationNow !== true ||
    contract.backendImplementationNow !== false ||
    contract.controllerMutationNow !== false ||
    contract.webRouteMutationNow !== true ||
    contract.uiComponentMutationNow !== true
  ) {
    throw new Error('Step132-B frontend Amazon SP-API connection status panel implementation contract violation: implementation boundary mismatch.');
  }

  if (
    contract.implementedFrontendSurface.componentName !== 'AmazonSpApiConnectionStatusPanel' ||
    contract.implementedFrontendSurface.panelTestId !== 'amazon-sp-api-connection-status-panel' ||
    contract.implementedApiHelpers.requestAuthorizationUrlHelper !== 'requestAmazonSpApiAuthorizationUrl' ||
    contract.implementedApiHelpers.authorizationUrlPath !== '/api/imports/amazon-sp-api/oauth/authorization-url'
  ) {
    throw new Error('Step132-B frontend Amazon SP-API connection status panel implementation contract violation: frontend surface mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    implementedApiHelpers: contract.implementedApiHelpers,
    implementedUiStates: contract.implementedUiStates,
    securityBoundary: contract.securityBoundary,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (typeof value === 'string') continue;
      if (value !== true) {
        throw new Error(`Step132-B frontend Amazon SP-API connection status panel implementation contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.nextAllowedWork.step132CFrontendConnectionStatusPanelRuntimeSmoke !== true ||
    contract.nextAllowedWork.step132DFrontendConnectionStatusPanelRecordHandoff !== false ||
    contract.nextAllowedWork.step133ConnectionStatusBackendEndpoint !== false ||
    contract.nextAllowedWork.step135RealSpApiReportsRequestImplementation !== false ||
    contract.summary.step132BCompleted !== true ||
    contract.summary.readyForStep132CFrontendConnectionStatusPanelRuntimeSmoke !== true ||
    contract.summary.readyForStep132DFrontendConnectionStatusPanelRecordHandoff !== false ||
    contract.summary.readyForStep133ConnectionStatusBackendEndpoint !== false ||
    contract.summary.readyForStep135RealSpApiReports !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step132-B frontend Amazon SP-API connection status panel implementation contract violation: next-work summary mismatch.');
  }

  return contract;
}
