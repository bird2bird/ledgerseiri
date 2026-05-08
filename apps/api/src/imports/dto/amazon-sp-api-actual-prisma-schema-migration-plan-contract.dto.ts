import {
  assertAmazonSpApiTokenPersistenceImplementationPreflightContract,
  buildAmazonSpApiTokenPersistenceImplementationPreflightContract,
  type AmazonSpApiTokenPersistenceImplementationPreflightContract,
} from './amazon-sp-api-token-persistence-implementation-preflight.dto';

export const AMAZON_SP_API_ACTUAL_PRISMA_SCHEMA_MIGRATION_PLAN_CONTRACT_VERSION =
  'amazon-sp-api-actual-prisma-schema-migration-plan-contract-v1' as const;

export type AmazonSpApiPrismaPlannedModelName =
  | 'AmazonSpApiConnection'
  | 'AmazonSpApiCredential'
  | 'AmazonSpApiAccessTokenCache'
  | 'AmazonSpApiConnectionAudit';

export type AmazonSpApiPrismaMigrationPlanContract = {
  version: typeof AMAZON_SP_API_ACTUAL_PRISMA_SCHEMA_MIGRATION_PLAN_CONTRACT_VERSION;
  sourceStep123M: AmazonSpApiTokenPersistenceImplementationPreflightContract;

  contractOnly: true;
  schemaPlanOnly: true;
  implementationNow: false;
  prismaSchemaChangedNow: false;
  migrationFileAddedNow: false;
  prismaGenerateNow: false;
  migrateDevNow: false;
  migrateDeployNow: false;
  databaseWriteNow: false;
  tokenPersistenceWriteNow: false;
  tokenExchangeHttpCallNow: false;
  backendRouteAddedNow: false;
  frontendAddedNow: false;
  realSpApiRequestNow: false;
  writesDatabase: false;

  migrationBoundary: {
    purpose: 'design-amazon-sp-api-actual-prisma-schema-migration-plan-contract-only';
    noSchemaChangeNow: true;
    noMigrationFileNow: true;
    noPrismaGenerateNow: true;
    noMigrateDevNow: true;
    noMigrateDeployNow: true;
    noDatabaseWriteNow: true;
    noTokenPersistenceNow: true;
    noRouteNow: true;
    noFrontendNow: true;
  };

  plannedModels: Record<AmazonSpApiPrismaPlannedModelName, {
    required: true;
    purpose: string;
    companyIdIsolationRequired?: true;
    storeIdIsolationRequired?: true;
    encryptedSecretOnly?: true;
    noPlaintextTokenField?: true;
    redactedAuditOnly?: true;
  }>;

  connectionModelPlan: {
    modelName: 'AmazonSpApiConnection';
    requiredFields: readonly [
      'id',
      'companyId',
      'storeId',
      'marketplaceId',
      'region',
      'sellingPartnerId',
      'appId',
      'status',
      'connectedAt',
      'revokedAt',
      'lastTokenRefreshAt',
      'lastHealthCheckAt',
      'lastSyncAt',
      'lastErrorCode',
      'lastErrorMessageRedacted',
      'createdAt',
      'updatedAt'
    ];
    requiredRelations: readonly ['company', 'store', 'credential', 'accessTokenCache', 'audits'];
    requiredIndexes: readonly [
      'companyId',
      'storeId',
      'marketplaceId',
      'region',
      'status',
      'lastSyncAt'
    ];
    requiredUniqueConstraints: readonly [
      'companyId_storeId_marketplaceId_region',
      'sellingPartnerId_marketplaceId_region'
    ];
    cascadeDeleteForbiddenByDefault: true;
  };

  credentialModelPlan: {
    modelName: 'AmazonSpApiCredential';
    requiredFields: readonly [
      'id',
      'connectionId',
      'encryptedRefreshToken',
      'encryptionKeyId',
      'encryptionAlgorithm',
      'tokenVersion',
      'rotatedAt',
      'revokedAt',
      'createdAt',
      'updatedAt'
    ];
    requiredRelations: readonly ['connection'];
    requiredUniqueConstraints: readonly ['connectionId'];
    plaintextRefreshTokenForbidden: true;
    clientSecretPersistenceForbidden: true;
  };

  accessTokenCacheModelPlan: {
    modelName: 'AmazonSpApiAccessTokenCache';
    requiredFields: readonly [
      'id',
      'connectionId',
      'encryptedAccessToken',
      'tokenType',
      'scope',
      'expiresAt',
      'createdAt',
      'updatedAt'
    ];
    requiredRelations: readonly ['connection'];
    requiredUniqueConstraints: readonly ['connectionId'];
    requiredIndexes: readonly ['expiresAt'];
    plaintextAccessTokenForbidden: true;
    cacheMayBeDeletedWithoutLosingConnection: true;
  };

  auditModelPlan: {
    modelName: 'AmazonSpApiConnectionAudit';
    requiredFields: readonly [
      'id',
      'connectionId',
      'companyId',
      'storeId',
      'eventType',
      'messageRedacted',
      'metadataJson',
      'createdAt'
    ];
    requiredRelations: readonly ['connection', 'company', 'store'];
    requiredIndexes: readonly ['companyId', 'storeId', 'connectionId', 'eventType', 'createdAt'];
    rawTokenLoggingForbidden: true;
    redactedMetadataOnly: true;
  };

  migrationOrderingPlan: {
    step1AddConnectionModel: true;
    step2AddCredentialModel: true;
    step3AddAccessTokenCacheModel: true;
    step4AddAuditModel: true;
    step5AddIndexesAndUniqueConstraints: true;
    step6RunPrismaValidate: true;
    step7RunPrismaGenerateInSeparateStep: true;
    step8RunRegressionSmokes: true;
  };

  safetyPlan: {
    productionBackupRequiredBeforeMigration: true;
    noDestructiveMigration: true;
    noExistingTableDrop: true;
    noExistingColumnDrop: true;
    noExistingColumnRename: true;
    noBackfillWithoutDryRun: true;
    rollbackPlanRequired: true;
    migrationDiffReviewRequired: true;
    prismaValidateRequired: true;
    fullSmokeRegressionRequired: true;
  };

  rollbackPlan: {
    rollbackScriptRequired: true;
    rollbackMustNotDeleteExistingAccountingData: true;
    rollbackMayDropOnlyNewAmazonSpApiTables: true;
    rollbackRequiresTokenDataExportIfProductionDataExists: true;
    rollbackRequiresServiceDisableFlag: true;
  };

  plaintextSecretPolicy: {
    forbiddenFieldNames: readonly [
      'refreshToken',
      'accessToken',
      'clientSecret',
      'authorizationCode',
      'spapiOAuthCode',
      'rawOAuthState'
    ];
    requiredEncryptedFieldNames: readonly [
      'encryptedRefreshToken',
      'encryptedAccessToken'
    ];
    frontendExposureForbidden: true;
    logExposureForbidden: true;
  };

  forbiddenNow: {
    schemaPrismaEdit: true;
    prismaMigrationFile: true;
    prismaGenerate: true;
    prismaMigrateDev: true;
    prismaMigrateDeploy: true;
    databaseWrite: true;
    tokenPersistenceDatabaseWrite: true;
    tokenExchangeHttpCall: true;
    callbackControllerRoute: true;
    authorizationControllerRoute: true;
    frontendButton: true;
    frontendApiClient: true;
    realSpApiHttpCall: true;
    createReportCall: true;
    getReportCall: true;
    getReportDocumentCall: true;
    importJobWrite: true;
    transactionWrite: true;
    inventoryWrite: true;
  };

  summary: {
    readyForPrismaSchemaDryRunDiffSmoke: true;
    readyForActualPrismaSchemaMigration: false;
    readyForPrismaGenerate: false;
    readyForTokenPersistenceDatabaseImplementation: false;
    readyForTokenExchangeHttpImplementation: false;
    readyForCallbackRouteImplementation: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiActualPrismaSchemaMigrationPlanContract(): AmazonSpApiPrismaMigrationPlanContract {
  const step123M = assertAmazonSpApiTokenPersistenceImplementationPreflightContract(
    buildAmazonSpApiTokenPersistenceImplementationPreflightContract(),
  );

  return {
    version: AMAZON_SP_API_ACTUAL_PRISMA_SCHEMA_MIGRATION_PLAN_CONTRACT_VERSION,
    sourceStep123M: step123M,

    contractOnly: true,
    schemaPlanOnly: true,
    implementationNow: false,
    prismaSchemaChangedNow: false,
    migrationFileAddedNow: false,
    prismaGenerateNow: false,
    migrateDevNow: false,
    migrateDeployNow: false,
    databaseWriteNow: false,
    tokenPersistenceWriteNow: false,
    tokenExchangeHttpCallNow: false,
    backendRouteAddedNow: false,
    frontendAddedNow: false,
    realSpApiRequestNow: false,
    writesDatabase: false,

    migrationBoundary: {
      purpose: 'design-amazon-sp-api-actual-prisma-schema-migration-plan-contract-only',
      noSchemaChangeNow: true,
      noMigrationFileNow: true,
      noPrismaGenerateNow: true,
      noMigrateDevNow: true,
      noMigrateDeployNow: true,
      noDatabaseWriteNow: true,
      noTokenPersistenceNow: true,
      noRouteNow: true,
      noFrontendNow: true,
    },

    plannedModels: {
      AmazonSpApiConnection: {
        required: true,
        purpose: 'store redacted Amazon SP-API connection identity and lifecycle status',
        companyIdIsolationRequired: true,
        storeIdIsolationRequired: true,
      },
      AmazonSpApiCredential: {
        required: true,
        purpose: 'store encrypted refresh token and credential rotation metadata',
        encryptedSecretOnly: true,
        noPlaintextTokenField: true,
      },
      AmazonSpApiAccessTokenCache: {
        required: true,
        purpose: 'store encrypted short-lived access token cache metadata',
        encryptedSecretOnly: true,
        noPlaintextTokenField: true,
      },
      AmazonSpApiConnectionAudit: {
        required: true,
        purpose: 'store redacted lifecycle audit events',
        redactedAuditOnly: true,
      },
    },

    connectionModelPlan: {
      modelName: 'AmazonSpApiConnection',
      requiredFields: [
        'id',
        'companyId',
        'storeId',
        'marketplaceId',
        'region',
        'sellingPartnerId',
        'appId',
        'status',
        'connectedAt',
        'revokedAt',
        'lastTokenRefreshAt',
        'lastHealthCheckAt',
        'lastSyncAt',
        'lastErrorCode',
        'lastErrorMessageRedacted',
        'createdAt',
        'updatedAt',
      ],
      requiredRelations: ['company', 'store', 'credential', 'accessTokenCache', 'audits'],
      requiredIndexes: ['companyId', 'storeId', 'marketplaceId', 'region', 'status', 'lastSyncAt'],
      requiredUniqueConstraints: [
        'companyId_storeId_marketplaceId_region',
        'sellingPartnerId_marketplaceId_region',
      ],
      cascadeDeleteForbiddenByDefault: true,
    },

    credentialModelPlan: {
      modelName: 'AmazonSpApiCredential',
      requiredFields: [
        'id',
        'connectionId',
        'encryptedRefreshToken',
        'encryptionKeyId',
        'encryptionAlgorithm',
        'tokenVersion',
        'rotatedAt',
        'revokedAt',
        'createdAt',
        'updatedAt',
      ],
      requiredRelations: ['connection'],
      requiredUniqueConstraints: ['connectionId'],
      plaintextRefreshTokenForbidden: true,
      clientSecretPersistenceForbidden: true,
    },

    accessTokenCacheModelPlan: {
      modelName: 'AmazonSpApiAccessTokenCache',
      requiredFields: [
        'id',
        'connectionId',
        'encryptedAccessToken',
        'tokenType',
        'scope',
        'expiresAt',
        'createdAt',
        'updatedAt',
      ],
      requiredRelations: ['connection'],
      requiredUniqueConstraints: ['connectionId'],
      requiredIndexes: ['expiresAt'],
      plaintextAccessTokenForbidden: true,
      cacheMayBeDeletedWithoutLosingConnection: true,
    },

    auditModelPlan: {
      modelName: 'AmazonSpApiConnectionAudit',
      requiredFields: [
        'id',
        'connectionId',
        'companyId',
        'storeId',
        'eventType',
        'messageRedacted',
        'metadataJson',
        'createdAt',
      ],
      requiredRelations: ['connection', 'company', 'store'],
      requiredIndexes: ['companyId', 'storeId', 'connectionId', 'eventType', 'createdAt'],
      rawTokenLoggingForbidden: true,
      redactedMetadataOnly: true,
    },

    migrationOrderingPlan: {
      step1AddConnectionModel: true,
      step2AddCredentialModel: true,
      step3AddAccessTokenCacheModel: true,
      step4AddAuditModel: true,
      step5AddIndexesAndUniqueConstraints: true,
      step6RunPrismaValidate: true,
      step7RunPrismaGenerateInSeparateStep: true,
      step8RunRegressionSmokes: true,
    },

    safetyPlan: {
      productionBackupRequiredBeforeMigration: true,
      noDestructiveMigration: true,
      noExistingTableDrop: true,
      noExistingColumnDrop: true,
      noExistingColumnRename: true,
      noBackfillWithoutDryRun: true,
      rollbackPlanRequired: true,
      migrationDiffReviewRequired: true,
      prismaValidateRequired: true,
      fullSmokeRegressionRequired: true,
    },

    rollbackPlan: {
      rollbackScriptRequired: true,
      rollbackMustNotDeleteExistingAccountingData: true,
      rollbackMayDropOnlyNewAmazonSpApiTables: true,
      rollbackRequiresTokenDataExportIfProductionDataExists: true,
      rollbackRequiresServiceDisableFlag: true,
    },

    plaintextSecretPolicy: {
      forbiddenFieldNames: [
        'refreshToken',
        'accessToken',
        'clientSecret',
        'authorizationCode',
        'spapiOAuthCode',
        'rawOAuthState',
      ],
      requiredEncryptedFieldNames: ['encryptedRefreshToken', 'encryptedAccessToken'],
      frontendExposureForbidden: true,
      logExposureForbidden: true,
    },

    forbiddenNow: {
      schemaPrismaEdit: true,
      prismaMigrationFile: true,
      prismaGenerate: true,
      prismaMigrateDev: true,
      prismaMigrateDeploy: true,
      databaseWrite: true,
      tokenPersistenceDatabaseWrite: true,
      tokenExchangeHttpCall: true,
      callbackControllerRoute: true,
      authorizationControllerRoute: true,
      frontendButton: true,
      frontendApiClient: true,
      realSpApiHttpCall: true,
      createReportCall: true,
      getReportCall: true,
      getReportDocumentCall: true,
      importJobWrite: true,
      transactionWrite: true,
      inventoryWrite: true,
    },

    summary: {
      readyForPrismaSchemaDryRunDiffSmoke: true,
      readyForActualPrismaSchemaMigration: false,
      readyForPrismaGenerate: false,
      readyForTokenPersistenceDatabaseImplementation: false,
      readyForTokenExchangeHttpImplementation: false,
      readyForCallbackRouteImplementation: false,
      readyForRealSpApiReportRequest: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiActualPrismaSchemaMigrationPlanContract(
  contract: AmazonSpApiPrismaMigrationPlanContract,
): AmazonSpApiPrismaMigrationPlanContract {
  if (contract.version !== AMAZON_SP_API_ACTUAL_PRISMA_SCHEMA_MIGRATION_PLAN_CONTRACT_VERSION) {
    throw new Error('Step123-N actual Prisma schema migration plan contract violation: version mismatch.');
  }

  assertAmazonSpApiTokenPersistenceImplementationPreflightContract(contract.sourceStep123M);

  if (
    contract.contractOnly !== true ||
    contract.schemaPlanOnly !== true ||
    contract.implementationNow !== false ||
    contract.prismaSchemaChangedNow !== false ||
    contract.migrationFileAddedNow !== false ||
    contract.prismaGenerateNow !== false ||
    contract.migrateDevNow !== false ||
    contract.migrateDeployNow !== false ||
    contract.databaseWriteNow !== false ||
    contract.tokenPersistenceWriteNow !== false ||
    contract.tokenExchangeHttpCallNow !== false ||
    contract.backendRouteAddedNow !== false ||
    contract.frontendAddedNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step123-N actual Prisma schema migration plan contract violation: implementation boundary mismatch.');
  }

  for (const [key, value] of Object.entries(contract.migrationBoundary)) {
    if (key === 'purpose') continue;
    if (value !== true) {
      throw new Error(`Step123-N actual Prisma schema migration plan contract violation: migrationBoundary.${key} must remain true.`);
    }
  }

  const requiredModels: AmazonSpApiPrismaPlannedModelName[] = [
    'AmazonSpApiConnection',
    'AmazonSpApiCredential',
    'AmazonSpApiAccessTokenCache',
    'AmazonSpApiConnectionAudit',
  ];

  for (const modelName of requiredModels) {
    if (contract.plannedModels[modelName]?.required !== true) {
      throw new Error(`Step123-N actual Prisma schema migration plan contract violation: planned model missing: ${modelName}.`);
    }
  }

  for (const field of contract.plaintextSecretPolicy.forbiddenFieldNames) {
    if (
      contract.connectionModelPlan.requiredFields.includes(field as never) ||
      contract.credentialModelPlan.requiredFields.includes(field as never) ||
      contract.accessTokenCacheModelPlan.requiredFields.includes(field as never) ||
      contract.auditModelPlan.requiredFields.includes(field as never)
    ) {
      throw new Error(`Step123-N actual Prisma schema migration plan contract violation: plaintext field planned: ${field}.`);
    }
  }

  for (const encryptedField of contract.plaintextSecretPolicy.requiredEncryptedFieldNames) {
    const exists =
      contract.credentialModelPlan.requiredFields.includes(encryptedField as never) ||
      contract.accessTokenCacheModelPlan.requiredFields.includes(encryptedField as never);

    if (!exists) {
      throw new Error(`Step123-N actual Prisma schema migration plan contract violation: encrypted field missing: ${encryptedField}.`);
    }
  }

  for (const [sectionName, section] of Object.entries({
    migrationOrderingPlan: contract.migrationOrderingPlan,
    safetyPlan: contract.safetyPlan,
    rollbackPlan: contract.rollbackPlan,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step123-N actual Prisma schema migration plan contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  for (const [key, value] of Object.entries(contract.forbiddenNow)) {
    if (value !== true) {
      throw new Error(`Step123-N actual Prisma schema migration plan contract violation: forbiddenNow.${key} must remain true.`);
    }
  }

  if (
    contract.summary.readyForPrismaSchemaDryRunDiffSmoke !== true ||
    contract.summary.readyForActualPrismaSchemaMigration !== false ||
    contract.summary.readyForPrismaGenerate !== false ||
    contract.summary.readyForTokenPersistenceDatabaseImplementation !== false ||
    contract.summary.readyForTokenExchangeHttpImplementation !== false ||
    contract.summary.readyForCallbackRouteImplementation !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSales !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step123-N actual Prisma schema migration plan contract violation: summary readiness mismatch.');
  }

  return contract;
}
