import {
  assertAmazonSpApiTokenPersistenceSchemaContract,
  buildAmazonSpApiTokenPersistenceSchemaContract,
  type AmazonSpApiConnectionStatus,
  type AmazonSpApiTokenPersistenceSchemaContract,
} from './amazon-sp-api-token-persistence-schema-contract.dto';

export const AMAZON_SP_API_CONNECTION_STATUS_READ_MODEL_CONTRACT_VERSION =
  'amazon-sp-api-connection-status-read-model-contract-v1' as const;

export type AmazonSpApiConnectionStatusReadModelStatus = AmazonSpApiConnectionStatus;

export type AmazonSpApiConnectionStatusReadModelContract = {
  version: typeof AMAZON_SP_API_CONNECTION_STATUS_READ_MODEL_CONTRACT_VERSION;
  sourceStep123F: AmazonSpApiTokenPersistenceSchemaContract;

  contractOnly: true;
  implementationNow: false;
  backendRouteAddedNow: false;
  frontendRouteAddedNow: false;
  serviceMethodAddedNow: false;
  databaseReadNow: false;
  schemaChangedNow: false;
  migrationAddedNow: false;
  tokenPersistenceNow: false;
  realSpApiRequestNow: false;
  writesDatabase: false;

  readModelBoundary: {
    purpose: 'design-amazon-sp-api-connection-status-read-model-contract-only';
    responseShapeDesignOnly: true;
    controllerRouteForbiddenNow: true;
    serviceImplementationForbiddenNow: true;
    databaseReadForbiddenNow: true;
    frontendConsumptionForbiddenNow: true;
  };

  statusEnumContract: {
    notConnected: 'NOT_CONNECTED';
    authorizationPending: 'AUTHORIZATION_PENDING';
    connected: 'CONNECTED';
    revoked: 'REVOKED';
    expired: 'EXPIRED';
    error: 'ERROR';
    unknownStatusRejectedInFuture: true;
  };

  responseShapeContract: {
    companyIdRequired: true;
    storeIdRequired: true;
    marketplaceIdRequired: true;
    regionRequired: true;
    statusRequired: true;
    isConnectedRequired: true;
    canConnectRequired: true;
    canReconnectRequired: true;
    canDisconnectRequired: true;
    sellingPartnerIdMaskedRequired: true;
    appIdMaskedRequired: true;
    connectedAtNullable: true;
    revokedAtNullable: true;
    lastTokenRefreshAtNullable: true;
    lastHealthCheckAtNullable: true;
    lastSyncAtNullable: true;
    lastErrorCodeNullable: true;
    lastErrorMessageRedactedNullable: true;
  };

  redactionContract: {
    refreshTokenForbidden: true;
    accessTokenForbidden: true;
    clientSecretForbidden: true;
    authorizationCodeForbidden: true;
    rawOAuthStateForbidden: true;
    rawSellingPartnerIdForbiddenByDefault: true;
    maskedSellingPartnerIdOnly: true;
    redactedErrorMessageOnly: true;
  };

  isolationContract: {
    companyIdFilterRequired: true;
    storeIdFilterRequired: true;
    marketplaceIdFilterRequired: true;
    regionFilterRequired: true;
    crossCompanyReadForbidden: true;
    crossStoreReadForbidden: true;
    marketplaceMismatchRejectedInFuture: true;
    regionMismatchRejectedInFuture: true;
  };

  healthMetadataContract: {
    tokenHealthStatusRequiredInFuture: true;
    connectionHealthStatusRequiredInFuture: true;
    lastTokenRefreshAtRequiredWhenConnectedInFuture: true;
    accessTokenExpiresAtNullable: true;
    refreshTokenRotatedAtNullable: true;
    permissionErrorCodeNullable: true;
    throttlingErrorCodeNullable: true;
    revokedDetectionRequiresSeparateStep: true;
  };

  uiReadinessContract: {
    japaneseStatusLabelRequiredInFrontendFuture: true;
    notConnectedShowsConnectActionInFuture: true;
    connectedShowsDisconnectAndReconnectActionsInFuture: true;
    expiredShowsReconnectActionInFuture: true;
    revokedShowsReconnectActionInFuture: true;
    errorShowsRedactedErrorAndReconnectActionInFuture: true;
  };

  forbiddenNow: {
    controllerRoute: true;
    serviceMethodImplementation: true;
    databaseRead: true;
    frontendPanel: true;
    frontendConnectionButton: true;
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
    readyForConnectionStatusReadModelImplementation: false;
    readyForFrontendConnectionStatusContract: true;
    readyForFrontendConnectionStatusImplementation: false;
    readyForActualPrismaSchemaMigration: false;
    readyForTokenPersistenceImplementation: false;
    readyForAuthorizationUrlImplementationPreflight: true;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiConnectionStatusReadModelContract(): AmazonSpApiConnectionStatusReadModelContract {
  const step123F = assertAmazonSpApiTokenPersistenceSchemaContract(
    buildAmazonSpApiTokenPersistenceSchemaContract(),
  );

  return {
    version: AMAZON_SP_API_CONNECTION_STATUS_READ_MODEL_CONTRACT_VERSION,
    sourceStep123F: step123F,

    contractOnly: true,
    implementationNow: false,
    backendRouteAddedNow: false,
    frontendRouteAddedNow: false,
    serviceMethodAddedNow: false,
    databaseReadNow: false,
    schemaChangedNow: false,
    migrationAddedNow: false,
    tokenPersistenceNow: false,
    realSpApiRequestNow: false,
    writesDatabase: false,

    readModelBoundary: {
      purpose: 'design-amazon-sp-api-connection-status-read-model-contract-only',
      responseShapeDesignOnly: true,
      controllerRouteForbiddenNow: true,
      serviceImplementationForbiddenNow: true,
      databaseReadForbiddenNow: true,
      frontendConsumptionForbiddenNow: true,
    },

    statusEnumContract: {
      notConnected: 'NOT_CONNECTED',
      authorizationPending: 'AUTHORIZATION_PENDING',
      connected: 'CONNECTED',
      revoked: 'REVOKED',
      expired: 'EXPIRED',
      error: 'ERROR',
      unknownStatusRejectedInFuture: true,
    },

    responseShapeContract: {
      companyIdRequired: true,
      storeIdRequired: true,
      marketplaceIdRequired: true,
      regionRequired: true,
      statusRequired: true,
      isConnectedRequired: true,
      canConnectRequired: true,
      canReconnectRequired: true,
      canDisconnectRequired: true,
      sellingPartnerIdMaskedRequired: true,
      appIdMaskedRequired: true,
      connectedAtNullable: true,
      revokedAtNullable: true,
      lastTokenRefreshAtNullable: true,
      lastHealthCheckAtNullable: true,
      lastSyncAtNullable: true,
      lastErrorCodeNullable: true,
      lastErrorMessageRedactedNullable: true,
    },

    redactionContract: {
      refreshTokenForbidden: true,
      accessTokenForbidden: true,
      clientSecretForbidden: true,
      authorizationCodeForbidden: true,
      rawOAuthStateForbidden: true,
      rawSellingPartnerIdForbiddenByDefault: true,
      maskedSellingPartnerIdOnly: true,
      redactedErrorMessageOnly: true,
    },

    isolationContract: {
      companyIdFilterRequired: true,
      storeIdFilterRequired: true,
      marketplaceIdFilterRequired: true,
      regionFilterRequired: true,
      crossCompanyReadForbidden: true,
      crossStoreReadForbidden: true,
      marketplaceMismatchRejectedInFuture: true,
      regionMismatchRejectedInFuture: true,
    },

    healthMetadataContract: {
      tokenHealthStatusRequiredInFuture: true,
      connectionHealthStatusRequiredInFuture: true,
      lastTokenRefreshAtRequiredWhenConnectedInFuture: true,
      accessTokenExpiresAtNullable: true,
      refreshTokenRotatedAtNullable: true,
      permissionErrorCodeNullable: true,
      throttlingErrorCodeNullable: true,
      revokedDetectionRequiresSeparateStep: true,
    },

    uiReadinessContract: {
      japaneseStatusLabelRequiredInFrontendFuture: true,
      notConnectedShowsConnectActionInFuture: true,
      connectedShowsDisconnectAndReconnectActionsInFuture: true,
      expiredShowsReconnectActionInFuture: true,
      revokedShowsReconnectActionInFuture: true,
      errorShowsRedactedErrorAndReconnectActionInFuture: true,
    },

    forbiddenNow: {
      controllerRoute: true,
      serviceMethodImplementation: true,
      databaseRead: true,
      frontendPanel: true,
      frontendConnectionButton: true,
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
      readyForConnectionStatusReadModelImplementation: false,
      readyForFrontendConnectionStatusContract: true,
      readyForFrontendConnectionStatusImplementation: false,
      readyForActualPrismaSchemaMigration: false,
      readyForTokenPersistenceImplementation: false,
      readyForAuthorizationUrlImplementationPreflight: true,
      readyForRealSpApiReportRequest: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiConnectionStatusReadModelContract(
  contract: AmazonSpApiConnectionStatusReadModelContract,
): AmazonSpApiConnectionStatusReadModelContract {
  if (contract.version !== AMAZON_SP_API_CONNECTION_STATUS_READ_MODEL_CONTRACT_VERSION) {
    throw new Error('Step123-G connection status read-model contract violation: version mismatch.');
  }

  assertAmazonSpApiTokenPersistenceSchemaContract(contract.sourceStep123F);

  if (
    contract.contractOnly !== true ||
    contract.implementationNow !== false ||
    contract.backendRouteAddedNow !== false ||
    contract.frontendRouteAddedNow !== false ||
    contract.serviceMethodAddedNow !== false ||
    contract.databaseReadNow !== false ||
    contract.schemaChangedNow !== false ||
    contract.migrationAddedNow !== false ||
    contract.tokenPersistenceNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step123-G connection status read-model contract violation: implementation boundary mismatch.');
  }

  for (const [key, value] of Object.entries(contract.readModelBoundary)) {
    if (key === 'purpose') continue;
    if (value !== true) {
      throw new Error(`Step123-G connection status read-model contract violation: readModelBoundary.${key} must remain true.`);
    }
  }

  if (
    contract.statusEnumContract.notConnected !== 'NOT_CONNECTED' ||
    contract.statusEnumContract.authorizationPending !== 'AUTHORIZATION_PENDING' ||
    contract.statusEnumContract.connected !== 'CONNECTED' ||
    contract.statusEnumContract.revoked !== 'REVOKED' ||
    contract.statusEnumContract.expired !== 'EXPIRED' ||
    contract.statusEnumContract.error !== 'ERROR' ||
    contract.statusEnumContract.unknownStatusRejectedInFuture !== true
  ) {
    throw new Error('Step123-G connection status read-model contract violation: status enum mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    responseShapeContract: contract.responseShapeContract,
    redactionContract: contract.redactionContract,
    isolationContract: contract.isolationContract,
    healthMetadataContract: contract.healthMetadataContract,
    uiReadinessContract: contract.uiReadinessContract,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step123-G connection status read-model contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenNow)) {
    if (forbidden !== true) {
      throw new Error(`Step123-G connection status read-model contract violation: forbiddenNow.${key} must remain true.`);
    }
  }

  if (
    contract.summary.readyForConnectionStatusReadModelImplementation !== false ||
    contract.summary.readyForFrontendConnectionStatusContract !== true ||
    contract.summary.readyForFrontendConnectionStatusImplementation !== false ||
    contract.summary.readyForActualPrismaSchemaMigration !== false ||
    contract.summary.readyForTokenPersistenceImplementation !== false ||
    contract.summary.readyForAuthorizationUrlImplementationPreflight !== true ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSales !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step123-G connection status read-model contract violation: summary readiness mismatch.');
  }

  return contract;
}
