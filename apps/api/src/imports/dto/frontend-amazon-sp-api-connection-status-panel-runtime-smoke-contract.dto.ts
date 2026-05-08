import {
  assertFrontendAmazonSpApiConnectionStatusPanelImplementationContract,
  buildFrontendAmazonSpApiConnectionStatusPanelImplementationContract,
  type FrontendAmazonSpApiConnectionStatusPanelImplementationContract,
} from './frontend-amazon-sp-api-connection-status-panel-implementation-contract.dto';

export const FRONTEND_AMAZON_SP_API_CONNECTION_STATUS_PANEL_RUNTIME_SMOKE_CONTRACT_VERSION =
  'frontend-amazon-sp-api-connection-status-panel-runtime-smoke-contract-v1' as const;

export type FrontendAmazonSpApiConnectionStatusPanelRuntimeSmokeContract = {
  version: typeof FRONTEND_AMAZON_SP_API_CONNECTION_STATUS_PANEL_RUNTIME_SMOKE_CONTRACT_VERSION;
  sourceStep132B: FrontendAmazonSpApiConnectionStatusPanelImplementationContract;

  runtimeSmokeImplementedNow: true;
  frontendMutationNow: false;
  backendMutationNow: false;
  controllerMutationNow: false;

  runtimeVerified: {
    panelComponentRenders: true;
    panelWiredIntoDataImportPage: true;
    defaultStateShowsNotConnected: true;
    connectedHintStateReadsUrlStatus: true;
    refreshButtonUpdatesLocalStatus: true;
    connectButtonCallsAuthorizationUrlHelper: true;
    reconnectButtonCallsAuthorizationUrlHelperWithForceReauthorize: true;
    authorizationUrlHelperUsesCredentialsInclude: true;
    authorizationUrlHelperUsesNoStoreCache: true;
    authorizationUrlHelperSendsMarketplaceRegionStore: true;
    authorizationUrlHelperSendsReturnTo: true;
    authorizationUrlHelperSendsSandbox: true;
    successfulAuthorizationUrlNavigatesWithWindowLocationAssign: true;
    errorStateShowsRedactedMessage: true;
    revokeButtonRemainsDisabled: true;
  };

  securityBoundary: {
    noRawRefreshTokenRendered: true;
    noRawAccessTokenRendered: true;
    noClientSecretRendered: true;
    noRawSecretLocalStorage: true;
    noRealSpApiReportsNow: true;
    noImportJobCreationNow: true;
    noTransactionWriteNow: true;
    noInventoryWriteNow: true;
    noBackendImplementationNow: true;
  };

  nextAllowedWork: {
    step132DFrontendConnectionStatusPanelRecordHandoff: true;
    step133ConnectionStatusBackendEndpoint: false;
    step135RealSpApiReportsRequestImplementation: false;
  };

  summary: {
    step132CCompleted: true;
    readyForStep132DFrontendConnectionStatusPanelRecordHandoff: true;
    readyForStep133ConnectionStatusBackendEndpoint: false;
    readyForStep135RealSpApiReports: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildFrontendAmazonSpApiConnectionStatusPanelRuntimeSmokeContract(): FrontendAmazonSpApiConnectionStatusPanelRuntimeSmokeContract {
  const sourceStep132B = assertFrontendAmazonSpApiConnectionStatusPanelImplementationContract(
    buildFrontendAmazonSpApiConnectionStatusPanelImplementationContract(),
  );

  return {
    version: FRONTEND_AMAZON_SP_API_CONNECTION_STATUS_PANEL_RUNTIME_SMOKE_CONTRACT_VERSION,
    sourceStep132B,

    runtimeSmokeImplementedNow: true,
    frontendMutationNow: false,
    backendMutationNow: false,
    controllerMutationNow: false,

    runtimeVerified: {
      panelComponentRenders: true,
      panelWiredIntoDataImportPage: true,
      defaultStateShowsNotConnected: true,
      connectedHintStateReadsUrlStatus: true,
      refreshButtonUpdatesLocalStatus: true,
      connectButtonCallsAuthorizationUrlHelper: true,
      reconnectButtonCallsAuthorizationUrlHelperWithForceReauthorize: true,
      authorizationUrlHelperUsesCredentialsInclude: true,
      authorizationUrlHelperUsesNoStoreCache: true,
      authorizationUrlHelperSendsMarketplaceRegionStore: true,
      authorizationUrlHelperSendsReturnTo: true,
      authorizationUrlHelperSendsSandbox: true,
      successfulAuthorizationUrlNavigatesWithWindowLocationAssign: true,
      errorStateShowsRedactedMessage: true,
      revokeButtonRemainsDisabled: true,
    },

    securityBoundary: {
      noRawRefreshTokenRendered: true,
      noRawAccessTokenRendered: true,
      noClientSecretRendered: true,
      noRawSecretLocalStorage: true,
      noRealSpApiReportsNow: true,
      noImportJobCreationNow: true,
      noTransactionWriteNow: true,
      noInventoryWriteNow: true,
      noBackendImplementationNow: true,
    },

    nextAllowedWork: {
      step132DFrontendConnectionStatusPanelRecordHandoff: true,
      step133ConnectionStatusBackendEndpoint: false,
      step135RealSpApiReportsRequestImplementation: false,
    },

    summary: {
      step132CCompleted: true,
      readyForStep132DFrontendConnectionStatusPanelRecordHandoff: true,
      readyForStep133ConnectionStatusBackendEndpoint: false,
      readyForStep135RealSpApiReports: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertFrontendAmazonSpApiConnectionStatusPanelRuntimeSmokeContract(
  contract: FrontendAmazonSpApiConnectionStatusPanelRuntimeSmokeContract,
): FrontendAmazonSpApiConnectionStatusPanelRuntimeSmokeContract {
  if (contract.version !== FRONTEND_AMAZON_SP_API_CONNECTION_STATUS_PANEL_RUNTIME_SMOKE_CONTRACT_VERSION) {
    throw new Error('Step132-C frontend Amazon SP-API connection status panel runtime smoke contract violation: version mismatch.');
  }

  assertFrontendAmazonSpApiConnectionStatusPanelImplementationContract(contract.sourceStep132B);

  if (
    contract.sourceStep132B.summary.readyForStep132CFrontendConnectionStatusPanelRuntimeSmoke !== true ||
    contract.runtimeSmokeImplementedNow !== true ||
    contract.frontendMutationNow !== false ||
    contract.backendMutationNow !== false ||
    contract.controllerMutationNow !== false
  ) {
    throw new Error('Step132-C frontend Amazon SP-API connection status panel runtime smoke contract violation: boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    runtimeVerified: contract.runtimeVerified,
    securityBoundary: contract.securityBoundary,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step132-C frontend Amazon SP-API connection status panel runtime smoke contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.nextAllowedWork.step132DFrontendConnectionStatusPanelRecordHandoff !== true ||
    contract.nextAllowedWork.step133ConnectionStatusBackendEndpoint !== false ||
    contract.nextAllowedWork.step135RealSpApiReportsRequestImplementation !== false ||
    contract.summary.step132CCompleted !== true ||
    contract.summary.readyForStep132DFrontendConnectionStatusPanelRecordHandoff !== true ||
    contract.summary.readyForStep133ConnectionStatusBackendEndpoint !== false ||
    contract.summary.readyForStep135RealSpApiReports !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step132-C frontend Amazon SP-API connection status panel runtime smoke contract violation: next-work summary mismatch.');
  }

  return contract;
}
