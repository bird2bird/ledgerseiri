import {
  assertFrontendAmazonSpApiConnectionStatusPanelRuntimeSmokeContract,
  buildFrontendAmazonSpApiConnectionStatusPanelRuntimeSmokeContract,
  type FrontendAmazonSpApiConnectionStatusPanelRuntimeSmokeContract,
} from './frontend-amazon-sp-api-connection-status-panel-runtime-smoke-contract.dto';

export const FRONTEND_AMAZON_SP_API_CONNECTION_STATUS_PANEL_RUNTIME_RECORD_HANDOFF_CONTRACT_VERSION =
  'frontend-amazon-sp-api-connection-status-panel-runtime-record-handoff-contract-v1' as const;

export type FrontendAmazonSpApiConnectionStatusPanelRuntimeRecordHandoffContract = {
  version: typeof FRONTEND_AMAZON_SP_API_CONNECTION_STATUS_PANEL_RUNTIME_RECORD_HANDOFF_CONTRACT_VERSION;
  sourceStep132C: FrontendAmazonSpApiConnectionStatusPanelRuntimeSmokeContract;

  runtimeRecordImplementedNow: true;
  frontendConnectionPanelPhaseCompletedNow: true;

  frontendMutationNow: false;
  backendMutationNow: false;
  controllerMutationNow: false;
  uiComponentMutationNow: false;
  apiHelperMutationNow: false;

  completedPhaseAssertions: {
    step132AContractCompleted: true;
    step132BImplementationCompleted: true;
    step132CRuntimeSmokeCompleted: true;
    panelComponentRenders: true;
    panelWiredIntoDataImportPage: true;
    defaultStateShowsNotConnected: true;
    connectedHintStateReadsUrlStatus: true;
    connectButtonCallsAuthorizationUrlHelper: true;
    reconnectButtonCallsAuthorizationUrlHelperWithForceReauthorize: true;
    authorizationUrlHelperUsesCredentialsInclude: true;
    authorizationUrlHelperUsesNoStoreCache: true;
    authorizationUrlHelperSendsMarketplaceRegionStore: true;
    authorizationUrlHelperSendsReturnTo: true;
    authorizationUrlHelperSendsSandbox: true;
    successfulAuthorizationUrlNavigatesWithWindowLocationAssign: true;
    revokeButtonRemainsDisabled: true;
  };

  securityBoundary: {
    noRawRefreshTokenRendered: true;
    noRawAccessTokenRendered: true;
    noClientSecretRendered: true;
    noRawSecretLocalStorage: true;
    noRawSecretSessionStorage: true;
    noRealSpApiReportsNow: true;
    noImportJobCreationNow: true;
    noTransactionWriteNow: true;
    noInventoryWriteNow: true;
    noConnectionStatusBackendEndpointNow: true;
  };

  handoffNotes: {
    frontendPanelComponent: 'apps/web/src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx';
    frontendApiHelper: 'apps/web/src/core/imports/api.ts';
    frontendWiredPage: 'apps/web/src/app/[lang]/app/data/import/page.tsx';
    authorizationUrlRoute: '/api/imports/amazon-sp-api/oauth/authorization-url';
    callbackRoute: '/api/imports/amazon-sp-api/oauth/callback';
    nextBackendGap: 'connection status endpoint is not exposed to frontend yet';
    nextSuggestedStep: 'Step133-A: Amazon SP-API connection status backend endpoint contract';
  };

  nextAllowedWork: {
    step133AConnectionStatusBackendEndpointContract: true;
    step133BConnectionStatusBackendEndpointImplementation: false;
    step135RealSpApiReportsRequestImplementation: false;
  };

  summary: {
    step132DCompleted: true;
    frontendConnectionStatusPanelPhaseCompleted: true;
    readyForStep133AConnectionStatusBackendEndpointContract: true;
    readyForStep133BConnectionStatusBackendEndpointImplementation: false;
    readyForStep135RealSpApiReports: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildFrontendAmazonSpApiConnectionStatusPanelRuntimeRecordHandoffContract(): FrontendAmazonSpApiConnectionStatusPanelRuntimeRecordHandoffContract {
  const sourceStep132C = assertFrontendAmazonSpApiConnectionStatusPanelRuntimeSmokeContract(
    buildFrontendAmazonSpApiConnectionStatusPanelRuntimeSmokeContract(),
  );

  return {
    version: FRONTEND_AMAZON_SP_API_CONNECTION_STATUS_PANEL_RUNTIME_RECORD_HANDOFF_CONTRACT_VERSION,
    sourceStep132C,

    runtimeRecordImplementedNow: true,
    frontendConnectionPanelPhaseCompletedNow: true,

    frontendMutationNow: false,
    backendMutationNow: false,
    controllerMutationNow: false,
    uiComponentMutationNow: false,
    apiHelperMutationNow: false,

    completedPhaseAssertions: {
      step132AContractCompleted: true,
      step132BImplementationCompleted: true,
      step132CRuntimeSmokeCompleted: true,
      panelComponentRenders: true,
      panelWiredIntoDataImportPage: true,
      defaultStateShowsNotConnected: true,
      connectedHintStateReadsUrlStatus: true,
      connectButtonCallsAuthorizationUrlHelper: true,
      reconnectButtonCallsAuthorizationUrlHelperWithForceReauthorize: true,
      authorizationUrlHelperUsesCredentialsInclude: true,
      authorizationUrlHelperUsesNoStoreCache: true,
      authorizationUrlHelperSendsMarketplaceRegionStore: true,
      authorizationUrlHelperSendsReturnTo: true,
      authorizationUrlHelperSendsSandbox: true,
      successfulAuthorizationUrlNavigatesWithWindowLocationAssign: true,
      revokeButtonRemainsDisabled: true,
    },

    securityBoundary: {
      noRawRefreshTokenRendered: true,
      noRawAccessTokenRendered: true,
      noClientSecretRendered: true,
      noRawSecretLocalStorage: true,
      noRawSecretSessionStorage: true,
      noRealSpApiReportsNow: true,
      noImportJobCreationNow: true,
      noTransactionWriteNow: true,
      noInventoryWriteNow: true,
      noConnectionStatusBackendEndpointNow: true,
    },

    handoffNotes: {
      frontendPanelComponent: 'apps/web/src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx',
      frontendApiHelper: 'apps/web/src/core/imports/api.ts',
      frontendWiredPage: 'apps/web/src/app/[lang]/app/data/import/page.tsx',
      authorizationUrlRoute: '/api/imports/amazon-sp-api/oauth/authorization-url',
      callbackRoute: '/api/imports/amazon-sp-api/oauth/callback',
      nextBackendGap: 'connection status endpoint is not exposed to frontend yet',
      nextSuggestedStep: 'Step133-A: Amazon SP-API connection status backend endpoint contract',
    },

    nextAllowedWork: {
      step133AConnectionStatusBackendEndpointContract: true,
      step133BConnectionStatusBackendEndpointImplementation: false,
      step135RealSpApiReportsRequestImplementation: false,
    },

    summary: {
      step132DCompleted: true,
      frontendConnectionStatusPanelPhaseCompleted: true,
      readyForStep133AConnectionStatusBackendEndpointContract: true,
      readyForStep133BConnectionStatusBackendEndpointImplementation: false,
      readyForStep135RealSpApiReports: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertFrontendAmazonSpApiConnectionStatusPanelRuntimeRecordHandoffContract(
  contract: FrontendAmazonSpApiConnectionStatusPanelRuntimeRecordHandoffContract,
): FrontendAmazonSpApiConnectionStatusPanelRuntimeRecordHandoffContract {
  if (contract.version !== FRONTEND_AMAZON_SP_API_CONNECTION_STATUS_PANEL_RUNTIME_RECORD_HANDOFF_CONTRACT_VERSION) {
    throw new Error('Step132-D frontend Amazon SP-API connection status panel runtime record/handoff contract violation: version mismatch.');
  }

  assertFrontendAmazonSpApiConnectionStatusPanelRuntimeSmokeContract(contract.sourceStep132C);

  if (
    contract.sourceStep132C.summary.readyForStep132DFrontendConnectionStatusPanelRecordHandoff !== true ||
    contract.runtimeRecordImplementedNow !== true ||
    contract.frontendConnectionPanelPhaseCompletedNow !== true ||
    contract.frontendMutationNow !== false ||
    contract.backendMutationNow !== false ||
    contract.controllerMutationNow !== false ||
    contract.uiComponentMutationNow !== false ||
    contract.apiHelperMutationNow !== false
  ) {
    throw new Error('Step132-D frontend Amazon SP-API connection status panel runtime record/handoff contract violation: boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    completedPhaseAssertions: contract.completedPhaseAssertions,
    securityBoundary: contract.securityBoundary,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step132-D frontend Amazon SP-API connection status panel runtime record/handoff contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.handoffNotes.frontendPanelComponent !== 'apps/web/src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx' ||
    contract.handoffNotes.frontendApiHelper !== 'apps/web/src/core/imports/api.ts' ||
    contract.handoffNotes.frontendWiredPage !== 'apps/web/src/app/[lang]/app/data/import/page.tsx' ||
    contract.handoffNotes.authorizationUrlRoute !== '/api/imports/amazon-sp-api/oauth/authorization-url' ||
    contract.handoffNotes.callbackRoute !== '/api/imports/amazon-sp-api/oauth/callback' ||
    contract.nextAllowedWork.step133AConnectionStatusBackendEndpointContract !== true ||
    contract.nextAllowedWork.step133BConnectionStatusBackendEndpointImplementation !== false ||
    contract.nextAllowedWork.step135RealSpApiReportsRequestImplementation !== false ||
    contract.summary.step132DCompleted !== true ||
    contract.summary.frontendConnectionStatusPanelPhaseCompleted !== true ||
    contract.summary.readyForStep133AConnectionStatusBackendEndpointContract !== true ||
    contract.summary.readyForStep133BConnectionStatusBackendEndpointImplementation !== false ||
    contract.summary.readyForStep135RealSpApiReports !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step132-D frontend Amazon SP-API connection status panel runtime record/handoff contract violation: handoff summary mismatch.');
  }

  return contract;
}
