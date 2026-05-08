import {
  assertAmazonSpApiConnectionStatusReadModelContract,
  buildAmazonSpApiConnectionStatusReadModelContract,
  type AmazonSpApiConnectionStatusReadModelContract,
  type AmazonSpApiConnectionStatusReadModelStatus,
} from './amazon-sp-api-connection-status-read-model-contract.dto';

export const AMAZON_SP_API_FRONTEND_CONNECTION_STATUS_PANEL_CONTRACT_VERSION =
  'amazon-sp-api-frontend-connection-status-panel-contract-v1' as const;

export type AmazonSpApiFrontendConnectionStatusPanelPlacement =
  | 'ImportCenter'
  | 'SettingsIntegrations';

export type AmazonSpApiFrontendConnectionStatusJapaneseLabel =
  | '未接続'
  | '接続準備中'
  | '接続済み'
  | '連携解除済み'
  | '認証期限切れ'
  | 'エラー';

export type AmazonSpApiFrontendConnectionStatusPanelContract = {
  version: typeof AMAZON_SP_API_FRONTEND_CONNECTION_STATUS_PANEL_CONTRACT_VERSION;
  sourceStep123G: AmazonSpApiConnectionStatusReadModelContract;

  contractOnly: true;
  implementationNow: false;
  backendRouteAddedNow: false;
  frontendComponentAddedNow: false;
  frontendApiClientAddedNow: false;
  buttonHandlerAddedNow: false;
  browserRedirectAddedNow: false;
  schemaChangedNow: false;
  migrationAddedNow: false;
  tokenPersistenceNow: false;
  realSpApiRequestNow: false;
  writesDatabase: false;

  panelBoundary: {
    purpose: 'design-amazon-sp-api-frontend-connection-status-panel-contract-only';
    uiShapeDesignOnly: true;
    reactComponentForbiddenNow: true;
    apiClientForbiddenNow: true;
    buttonHandlerForbiddenNow: true;
    browserRedirectForbiddenNow: true;
    backendRouteForbiddenNow: true;
  };

  placementContract: {
    importCenterPlacementRequiredInFuture: true;
    settingsIntegrationsPlacementRequiredInFuture: true;
    importCenterContext: AmazonSpApiFrontendConnectionStatusPanelPlacement;
    settingsIntegrationsContext: AmazonSpApiFrontendConnectionStatusPanelPlacement;
    storeScopedRenderingRequired: true;
    marketplaceScopedRenderingRequired: true;
  };

  japaneseLabelContract: Record<AmazonSpApiConnectionStatusReadModelStatus, AmazonSpApiFrontendConnectionStatusJapaneseLabel>;

  badgeStateContract: {
    notConnectedBadgeRequired: true;
    authorizationPendingBadgeRequired: true;
    connectedBadgeRequired: true;
    revokedBadgeRequired: true;
    expiredBadgeRequired: true;
    errorBadgeRequired: true;
    badgeMustNotRevealSecrets: true;
  };

  actionVisibilityContract: {
    notConnectedShowsConnect: true;
    authorizationPendingShowsDisabledConnect: true;
    connectedShowsReconnect: true;
    connectedShowsDisconnect: true;
    revokedShowsReconnect: true;
    expiredShowsReconnect: true;
    errorShowsReconnect: true;
    destructiveDisconnectRequiresConfirmationInFuture: true;
  };

  metadataDisplayContract: {
    marketplaceDisplayRequired: true;
    storeDisplayRequired: true;
    regionDisplayRequired: true;
    sellingPartnerIdMaskedDisplayRequired: true;
    appIdMaskedDisplayRequired: true;
    connectedAtDisplayNullable: true;
    lastTokenRefreshAtDisplayNullable: true;
    lastHealthCheckAtDisplayNullable: true;
    lastSyncAtDisplayNullable: true;
    redactedErrorMessageDisplayNullable: true;
  };

  loadingAndEmptyStateContract: {
    loadingSkeletonRequiredInFuture: true;
    notConfiguredEmptyStateRequired: true;
    permissionErrorStateRequired: true;
    networkErrorStateRequired: true;
    retryHintRequired: true;
    supportHintRequired: true;
  };

  noSecretExposureContract: {
    refreshTokenNeverRendered: true;
    accessTokenNeverRendered: true;
    clientSecretNeverRendered: true;
    authorizationCodeNeverRendered: true;
    rawOAuthStateNeverRendered: true;
    encryptedTokenCiphertextNeverRendered: true;
    rawSellingPartnerIdNeverRenderedByDefault: true;
  };

  forbiddenNow: {
    reactComponentFile: true;
    frontendApiClient: true;
    fetchCall: true;
    connectionButtonHandler: true;
    reconnectButtonHandler: true;
    disconnectButtonHandler: true;
    browserRedirectToAmazon: true;
    backendControllerRoute: true;
    backendServiceImplementation: true;
    databaseRead: true;
    prismaSchemaChange: true;
    migrationFile: true;
    tokenPersistenceWrite: true;
    tokenExchangeHttpCall: true;
    refreshTokenExposure: true;
    accessTokenExposure: true;
    clientSecretExposure: true;
    rawOAuthStateExposure: true;
    realSpApiHttpCall: true;
    createReportCall: true;
    getReportCall: true;
    getReportDocumentCall: true;
    importJobWrite: true;
    transactionWrite: true;
    inventoryWrite: true;
  };

  summary: {
    readyForFrontendConnectionStatusImplementation: false;
    readyForAuthorizationUrlImplementationPreflight: true;
    readyForOauthStateSigningImplementationPreflight: true;
    readyForActualPrismaSchemaMigration: false;
    readyForTokenPersistenceImplementation: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiFrontendConnectionStatusPanelContract(): AmazonSpApiFrontendConnectionStatusPanelContract {
  const step123G = assertAmazonSpApiConnectionStatusReadModelContract(
    buildAmazonSpApiConnectionStatusReadModelContract(),
  );

  return {
    version: AMAZON_SP_API_FRONTEND_CONNECTION_STATUS_PANEL_CONTRACT_VERSION,
    sourceStep123G: step123G,

    contractOnly: true,
    implementationNow: false,
    backendRouteAddedNow: false,
    frontendComponentAddedNow: false,
    frontendApiClientAddedNow: false,
    buttonHandlerAddedNow: false,
    browserRedirectAddedNow: false,
    schemaChangedNow: false,
    migrationAddedNow: false,
    tokenPersistenceNow: false,
    realSpApiRequestNow: false,
    writesDatabase: false,

    panelBoundary: {
      purpose: 'design-amazon-sp-api-frontend-connection-status-panel-contract-only',
      uiShapeDesignOnly: true,
      reactComponentForbiddenNow: true,
      apiClientForbiddenNow: true,
      buttonHandlerForbiddenNow: true,
      browserRedirectForbiddenNow: true,
      backendRouteForbiddenNow: true,
    },

    placementContract: {
      importCenterPlacementRequiredInFuture: true,
      settingsIntegrationsPlacementRequiredInFuture: true,
      importCenterContext: 'ImportCenter',
      settingsIntegrationsContext: 'SettingsIntegrations',
      storeScopedRenderingRequired: true,
      marketplaceScopedRenderingRequired: true,
    },

    japaneseLabelContract: {
      NOT_CONNECTED: '未接続',
      AUTHORIZATION_PENDING: '接続準備中',
      CONNECTED: '接続済み',
      REVOKED: '連携解除済み',
      EXPIRED: '認証期限切れ',
      ERROR: 'エラー',
    },

    badgeStateContract: {
      notConnectedBadgeRequired: true,
      authorizationPendingBadgeRequired: true,
      connectedBadgeRequired: true,
      revokedBadgeRequired: true,
      expiredBadgeRequired: true,
      errorBadgeRequired: true,
      badgeMustNotRevealSecrets: true,
    },

    actionVisibilityContract: {
      notConnectedShowsConnect: true,
      authorizationPendingShowsDisabledConnect: true,
      connectedShowsReconnect: true,
      connectedShowsDisconnect: true,
      revokedShowsReconnect: true,
      expiredShowsReconnect: true,
      errorShowsReconnect: true,
      destructiveDisconnectRequiresConfirmationInFuture: true,
    },

    metadataDisplayContract: {
      marketplaceDisplayRequired: true,
      storeDisplayRequired: true,
      regionDisplayRequired: true,
      sellingPartnerIdMaskedDisplayRequired: true,
      appIdMaskedDisplayRequired: true,
      connectedAtDisplayNullable: true,
      lastTokenRefreshAtDisplayNullable: true,
      lastHealthCheckAtDisplayNullable: true,
      lastSyncAtDisplayNullable: true,
      redactedErrorMessageDisplayNullable: true,
    },

    loadingAndEmptyStateContract: {
      loadingSkeletonRequiredInFuture: true,
      notConfiguredEmptyStateRequired: true,
      permissionErrorStateRequired: true,
      networkErrorStateRequired: true,
      retryHintRequired: true,
      supportHintRequired: true,
    },

    noSecretExposureContract: {
      refreshTokenNeverRendered: true,
      accessTokenNeverRendered: true,
      clientSecretNeverRendered: true,
      authorizationCodeNeverRendered: true,
      rawOAuthStateNeverRendered: true,
      encryptedTokenCiphertextNeverRendered: true,
      rawSellingPartnerIdNeverRenderedByDefault: true,
    },

    forbiddenNow: {
      reactComponentFile: true,
      frontendApiClient: true,
      fetchCall: true,
      connectionButtonHandler: true,
      reconnectButtonHandler: true,
      disconnectButtonHandler: true,
      browserRedirectToAmazon: true,
      backendControllerRoute: true,
      backendServiceImplementation: true,
      databaseRead: true,
      prismaSchemaChange: true,
      migrationFile: true,
      tokenPersistenceWrite: true,
      tokenExchangeHttpCall: true,
      refreshTokenExposure: true,
      accessTokenExposure: true,
      clientSecretExposure: true,
      rawOAuthStateExposure: true,
      realSpApiHttpCall: true,
      createReportCall: true,
      getReportCall: true,
      getReportDocumentCall: true,
      importJobWrite: true,
      transactionWrite: true,
      inventoryWrite: true,
    },

    summary: {
      readyForFrontendConnectionStatusImplementation: false,
      readyForAuthorizationUrlImplementationPreflight: true,
      readyForOauthStateSigningImplementationPreflight: true,
      readyForActualPrismaSchemaMigration: false,
      readyForTokenPersistenceImplementation: false,
      readyForRealSpApiReportRequest: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiFrontendConnectionStatusPanelContract(
  contract: AmazonSpApiFrontendConnectionStatusPanelContract,
): AmazonSpApiFrontendConnectionStatusPanelContract {
  if (contract.version !== AMAZON_SP_API_FRONTEND_CONNECTION_STATUS_PANEL_CONTRACT_VERSION) {
    throw new Error('Step123-H frontend connection status panel contract violation: version mismatch.');
  }

  assertAmazonSpApiConnectionStatusReadModelContract(contract.sourceStep123G);

  if (
    contract.contractOnly !== true ||
    contract.implementationNow !== false ||
    contract.backendRouteAddedNow !== false ||
    contract.frontendComponentAddedNow !== false ||
    contract.frontendApiClientAddedNow !== false ||
    contract.buttonHandlerAddedNow !== false ||
    contract.browserRedirectAddedNow !== false ||
    contract.schemaChangedNow !== false ||
    contract.migrationAddedNow !== false ||
    contract.tokenPersistenceNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step123-H frontend connection status panel contract violation: implementation boundary mismatch.');
  }

  for (const [key, value] of Object.entries(contract.panelBoundary)) {
    if (key === 'purpose') continue;
    if (value !== true) {
      throw new Error(`Step123-H frontend connection status panel contract violation: panelBoundary.${key} must remain true.`);
    }
  }

  if (
    contract.placementContract.importCenterContext !== 'ImportCenter' ||
    contract.placementContract.settingsIntegrationsContext !== 'SettingsIntegrations'
  ) {
    throw new Error('Step123-H frontend connection status panel contract violation: placement context mismatch.');
  }

  for (const [key, value] of Object.entries(contract.placementContract)) {
    if (key === 'importCenterContext' || key === 'settingsIntegrationsContext') continue;
    if (value !== true) {
      throw new Error(`Step123-H frontend connection status panel contract violation: placementContract.${key} must remain true.`);
    }
  }

  const expectedLabels: Record<AmazonSpApiConnectionStatusReadModelStatus, AmazonSpApiFrontendConnectionStatusJapaneseLabel> = {
    NOT_CONNECTED: '未接続',
    AUTHORIZATION_PENDING: '接続準備中',
    CONNECTED: '接続済み',
    REVOKED: '連携解除済み',
    EXPIRED: '認証期限切れ',
    ERROR: 'エラー',
  };

  for (const [status, label] of Object.entries(expectedLabels)) {
    if (contract.japaneseLabelContract[status as AmazonSpApiConnectionStatusReadModelStatus] !== label) {
      throw new Error(`Step123-H frontend connection status panel contract violation: Japanese label mismatch for ${status}.`);
    }
  }

  for (const [sectionName, section] of Object.entries({
    badgeStateContract: contract.badgeStateContract,
    actionVisibilityContract: contract.actionVisibilityContract,
    metadataDisplayContract: contract.metadataDisplayContract,
    loadingAndEmptyStateContract: contract.loadingAndEmptyStateContract,
    noSecretExposureContract: contract.noSecretExposureContract,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step123-H frontend connection status panel contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenNow)) {
    if (forbidden !== true) {
      throw new Error(`Step123-H frontend connection status panel contract violation: forbiddenNow.${key} must remain true.`);
    }
  }

  if (
    contract.summary.readyForFrontendConnectionStatusImplementation !== false ||
    contract.summary.readyForAuthorizationUrlImplementationPreflight !== true ||
    contract.summary.readyForOauthStateSigningImplementationPreflight !== true ||
    contract.summary.readyForActualPrismaSchemaMigration !== false ||
    contract.summary.readyForTokenPersistenceImplementation !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSales !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step123-H frontend connection status panel contract violation: summary readiness mismatch.');
  }

  return contract;
}
