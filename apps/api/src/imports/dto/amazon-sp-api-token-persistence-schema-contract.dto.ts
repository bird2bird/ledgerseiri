import {
  assertAmazonSpApiTokenExchangePreflightContract,
  buildAmazonSpApiTokenExchangePreflightContract,
  type AmazonSpApiTokenExchangePreflightContract,
} from './amazon-sp-api-token-exchange-preflight-contract.dto';

export const AMAZON_SP_API_TOKEN_PERSISTENCE_SCHEMA_CONTRACT_VERSION =
  'amazon-sp-api-token-persistence-schema-contract-v1' as const;

export type AmazonSpApiConnectionStatus =
  | 'NOT_CONNECTED'
  | 'AUTHORIZATION_PENDING'
  | 'CONNECTED'
  | 'REVOKED'
  | 'EXPIRED'
  | 'ERROR';

export type AmazonSpApiTokenPersistenceSchemaContract = {
  version: typeof AMAZON_SP_API_TOKEN_PERSISTENCE_SCHEMA_CONTRACT_VERSION;
  sourceStep123E: AmazonSpApiTokenExchangePreflightContract;

  contractOnly: true;
  implementationNow: false;
  backendRouteAddedNow: false;
  frontendRouteAddedNow: false;
  schemaChangedNow: false;
  migrationAddedNow: false;
  tokenPersistenceNow: false;
  realSpApiRequestNow: false;
  writesDatabase: false;

  schemaBoundary: {
    purpose: 'design-amazon-sp-api-token-persistence-schema-contract-only';
    prismaSchemaChangeForbiddenNow: true;
    migrationForbiddenNow: true;
    databaseWriteForbiddenNow: true;
    tokenPersistenceForbiddenNow: true;
    encryptionDesignOnlyNow: true;
  };

  connectionModelContract: {
    modelName: 'AmazonSpApiConnection';
    companyIdRequired: true;
    storeIdRequired: true;
    marketplaceIdRequired: true;
    regionRequired: true;
    sellingPartnerIdRequired: true;
    statusRequired: true;
    appIdRequired: true;
    connectedAtRequiredInFuture: true;
    revokedAtNullable: true;
    lastTokenRefreshAtNullable: true;
    lastHealthCheckAtNullable: true;
    errorCodeNullable: true;
    errorMessageRedactedNullable: true;
  };

  credentialModelContract: {
    modelName: 'AmazonSpApiCredential';
    connectionIdRequired: true;
    encryptedRefreshTokenRequired: true;
    refreshTokenCiphertextOnly: true;
    refreshTokenPlaintextForbidden: true;
    encryptionKeyIdRequired: true;
    encryptionAlgorithmRequired: true;
    tokenVersionRequired: true;
    rotatedAtNullable: true;
    revokedAtNullable: true;
  };

  accessTokenCacheContract: {
    modelName: 'AmazonSpApiAccessTokenCache';
    connectionIdRequired: true;
    encryptedAccessTokenRequired: true;
    accessTokenPlaintextForbidden: true;
    expiresAtRequired: true;
    scopesJsonOptional: true;
    cacheMayBeDeletedWithoutLosingConnection: true;
    refreshOnExpiryRequiredInFuture: true;
  };

  uniquenessAndIsolationPolicy: {
    uniqueCompanyStoreMarketplaceRegionRequired: true;
    uniqueSellingPartnerMarketplaceRegionRequired: true;
    companyIdRowIsolationRequired: true;
    storeIdRowIsolationRequired: true;
    marketplaceIdIsolationRequired: true;
    regionIsolationRequired: true;
    sellingPartnerIdIsolationRequired: true;
    cascadeDeleteForbiddenByDefault: true;
  };

  auditAndLifecyclePolicy: {
    connectAuditRequired: true;
    tokenExchangeAuditRequired: true;
    tokenRefreshAuditRequired: true;
    revokeAuditRequired: true;
    disconnectAuditRequired: true;
    tokenRotationAuditRequired: true;
    rawTokenLoggingForbidden: true;
    redactedIdentifierLoggingOnly: true;
  };

  securityPolicy: {
    encryptedAtRestRequired: true;
    applicationLevelEncryptionRequired: true;
    databaseOnlyEncryptionInsufficient: true;
    keyRotationRequired: true;
    secretRedactionRequired: true;
    leastPrivilegeAccessRequired: true;
    frontendTokenExposureForbidden: true;
    backupEncryptionRequired: true;
  };

  migrationPolicy: {
    migrationRequiresSeparateStep: true;
    prismaSchemaRequiresSeparateStep: true;
    noDestructiveMigration: true;
    noBackfillWithoutDryRun: true;
    rollbackPlanRequired: true;
    zeroTokenDataLossRequired: true;
    productionBackupRequiredBeforeMigration: true;
  };

  futureReadModelPolicy: {
    connectionStatusReadModelRequiresSeparateStep: true;
    tokenHealthReadModelRequiresSeparateStep: true;
    frontendConnectionStatusRequiresSeparateStep: true;
    noTokenValueInReadModel: true;
    onlyRedactedConnectionMetadataExposed: true;
  };

  forbiddenNow: {
    prismaSchemaChange: true;
    migrationFile: true;
    tokenPersistenceWrite: true;
    credentialPersistenceWrite: true;
    accessTokenCacheWrite: true;
    refreshTokenPersistence: true;
    accessTokenPersistence: true;
    clientSecretPersistence: true;
    oauthStatePersistence: true;
    tokenExchangeHttpCall: true;
    callbackControllerRoute: true;
    authorizationControllerRoute: true;
    frontendConnectionButton: true;
    realSpApiHttpCall: true;
    createReportCall: true;
    getReportCall: true;
    getReportDocumentCall: true;
    importJobWrite: true;
    transactionWrite: true;
    inventoryWrite: true;
  };

  summary: {
    readyForActualPrismaSchemaMigration: false;
    readyForTokenPersistenceImplementation: false;
    readyForConnectionStatusReadModelContract: true;
    readyForFrontendConnectionStatusContract: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiTokenPersistenceSchemaContract(): AmazonSpApiTokenPersistenceSchemaContract {
  const step123E = assertAmazonSpApiTokenExchangePreflightContract(
    buildAmazonSpApiTokenExchangePreflightContract(),
  );

  return {
    version: AMAZON_SP_API_TOKEN_PERSISTENCE_SCHEMA_CONTRACT_VERSION,
    sourceStep123E: step123E,

    contractOnly: true,
    implementationNow: false,
    backendRouteAddedNow: false,
    frontendRouteAddedNow: false,
    schemaChangedNow: false,
    migrationAddedNow: false,
    tokenPersistenceNow: false,
    realSpApiRequestNow: false,
    writesDatabase: false,

    schemaBoundary: {
      purpose: 'design-amazon-sp-api-token-persistence-schema-contract-only',
      prismaSchemaChangeForbiddenNow: true,
      migrationForbiddenNow: true,
      databaseWriteForbiddenNow: true,
      tokenPersistenceForbiddenNow: true,
      encryptionDesignOnlyNow: true,
    },

    connectionModelContract: {
      modelName: 'AmazonSpApiConnection',
      companyIdRequired: true,
      storeIdRequired: true,
      marketplaceIdRequired: true,
      regionRequired: true,
      sellingPartnerIdRequired: true,
      statusRequired: true,
      appIdRequired: true,
      connectedAtRequiredInFuture: true,
      revokedAtNullable: true,
      lastTokenRefreshAtNullable: true,
      lastHealthCheckAtNullable: true,
      errorCodeNullable: true,
      errorMessageRedactedNullable: true,
    },

    credentialModelContract: {
      modelName: 'AmazonSpApiCredential',
      connectionIdRequired: true,
      encryptedRefreshTokenRequired: true,
      refreshTokenCiphertextOnly: true,
      refreshTokenPlaintextForbidden: true,
      encryptionKeyIdRequired: true,
      encryptionAlgorithmRequired: true,
      tokenVersionRequired: true,
      rotatedAtNullable: true,
      revokedAtNullable: true,
    },

    accessTokenCacheContract: {
      modelName: 'AmazonSpApiAccessTokenCache',
      connectionIdRequired: true,
      encryptedAccessTokenRequired: true,
      accessTokenPlaintextForbidden: true,
      expiresAtRequired: true,
      scopesJsonOptional: true,
      cacheMayBeDeletedWithoutLosingConnection: true,
      refreshOnExpiryRequiredInFuture: true,
    },

    uniquenessAndIsolationPolicy: {
      uniqueCompanyStoreMarketplaceRegionRequired: true,
      uniqueSellingPartnerMarketplaceRegionRequired: true,
      companyIdRowIsolationRequired: true,
      storeIdRowIsolationRequired: true,
      marketplaceIdIsolationRequired: true,
      regionIsolationRequired: true,
      sellingPartnerIdIsolationRequired: true,
      cascadeDeleteForbiddenByDefault: true,
    },

    auditAndLifecyclePolicy: {
      connectAuditRequired: true,
      tokenExchangeAuditRequired: true,
      tokenRefreshAuditRequired: true,
      revokeAuditRequired: true,
      disconnectAuditRequired: true,
      tokenRotationAuditRequired: true,
      rawTokenLoggingForbidden: true,
      redactedIdentifierLoggingOnly: true,
    },

    securityPolicy: {
      encryptedAtRestRequired: true,
      applicationLevelEncryptionRequired: true,
      databaseOnlyEncryptionInsufficient: true,
      keyRotationRequired: true,
      secretRedactionRequired: true,
      leastPrivilegeAccessRequired: true,
      frontendTokenExposureForbidden: true,
      backupEncryptionRequired: true,
    },

    migrationPolicy: {
      migrationRequiresSeparateStep: true,
      prismaSchemaRequiresSeparateStep: true,
      noDestructiveMigration: true,
      noBackfillWithoutDryRun: true,
      rollbackPlanRequired: true,
      zeroTokenDataLossRequired: true,
      productionBackupRequiredBeforeMigration: true,
    },

    futureReadModelPolicy: {
      connectionStatusReadModelRequiresSeparateStep: true,
      tokenHealthReadModelRequiresSeparateStep: true,
      frontendConnectionStatusRequiresSeparateStep: true,
      noTokenValueInReadModel: true,
      onlyRedactedConnectionMetadataExposed: true,
    },

    forbiddenNow: {
      prismaSchemaChange: true,
      migrationFile: true,
      tokenPersistenceWrite: true,
      credentialPersistenceWrite: true,
      accessTokenCacheWrite: true,
      refreshTokenPersistence: true,
      accessTokenPersistence: true,
      clientSecretPersistence: true,
      oauthStatePersistence: true,
      tokenExchangeHttpCall: true,
      callbackControllerRoute: true,
      authorizationControllerRoute: true,
      frontendConnectionButton: true,
      realSpApiHttpCall: true,
      createReportCall: true,
      getReportCall: true,
      getReportDocumentCall: true,
      importJobWrite: true,
      transactionWrite: true,
      inventoryWrite: true,
    },

    summary: {
      readyForActualPrismaSchemaMigration: false,
      readyForTokenPersistenceImplementation: false,
      readyForConnectionStatusReadModelContract: true,
      readyForFrontendConnectionStatusContract: false,
      readyForRealSpApiReportRequest: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiTokenPersistenceSchemaContract(
  contract: AmazonSpApiTokenPersistenceSchemaContract,
): AmazonSpApiTokenPersistenceSchemaContract {
  if (contract.version !== AMAZON_SP_API_TOKEN_PERSISTENCE_SCHEMA_CONTRACT_VERSION) {
    throw new Error('Step123-F token persistence schema contract violation: version mismatch.');
  }

  assertAmazonSpApiTokenExchangePreflightContract(contract.sourceStep123E);

  if (
    contract.contractOnly !== true ||
    contract.implementationNow !== false ||
    contract.backendRouteAddedNow !== false ||
    contract.frontendRouteAddedNow !== false ||
    contract.schemaChangedNow !== false ||
    contract.migrationAddedNow !== false ||
    contract.tokenPersistenceNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step123-F token persistence schema contract violation: implementation boundary mismatch.');
  }

  for (const [key, required] of Object.entries(contract.schemaBoundary)) {
    if (key === 'purpose') continue;
    if (required !== true) {
      throw new Error(`Step123-F token persistence schema contract violation: schemaBoundary.${key} must remain true.`);
    }
  }

  for (const [sectionName, section] of Object.entries({
    connectionModelContract: contract.connectionModelContract,
    credentialModelContract: contract.credentialModelContract,
    accessTokenCacheContract: contract.accessTokenCacheContract,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (key === 'modelName') continue;
      if (value !== true) {
        throw new Error(`Step123-F token persistence schema contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  for (const [sectionName, section] of Object.entries({
    uniquenessAndIsolationPolicy: contract.uniquenessAndIsolationPolicy,
    auditAndLifecyclePolicy: contract.auditAndLifecyclePolicy,
    securityPolicy: contract.securityPolicy,
    migrationPolicy: contract.migrationPolicy,
    futureReadModelPolicy: contract.futureReadModelPolicy,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step123-F token persistence schema contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenNow)) {
    if (forbidden !== true) {
      throw new Error(`Step123-F token persistence schema contract violation: forbiddenNow.${key} must remain true.`);
    }
  }

  if (
    contract.summary.readyForActualPrismaSchemaMigration !== false ||
    contract.summary.readyForTokenPersistenceImplementation !== false ||
    contract.summary.readyForConnectionStatusReadModelContract !== true ||
    contract.summary.readyForFrontendConnectionStatusContract !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSales !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step123-F token persistence schema contract violation: summary readiness mismatch.');
  }

  return contract;
}
