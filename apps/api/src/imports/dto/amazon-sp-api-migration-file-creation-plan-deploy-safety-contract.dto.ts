import {
  assertAmazonSpApiPrismaClientGenerationModelAvailabilityContract,
  buildAmazonSpApiPrismaClientGenerationModelAvailabilityContract,
  type AmazonSpApiPrismaClientGenerationModelAvailabilityContract,
} from './amazon-sp-api-prisma-client-generation-model-availability.dto';

export const AMAZON_SP_API_MIGRATION_FILE_CREATION_PLAN_DEPLOY_SAFETY_CONTRACT_VERSION =
  'amazon-sp-api-migration-file-creation-plan-deploy-safety-contract-v1' as const;

export type AmazonSpApiMigrationFileCreationPlanDeploySafetyContract = {
  version: typeof AMAZON_SP_API_MIGRATION_FILE_CREATION_PLAN_DEPLOY_SAFETY_CONTRACT_VERSION;
  sourceStep124B: AmazonSpApiPrismaClientGenerationModelAvailabilityContract;

  contractOnly: true;
  migrationPlanOnly: true;
  migrationFileCreatedNow: false;
  prismaMigrateDevNow: false;
  prismaMigrateDeployNow: false;
  prismaDbPushNow: false;
  databaseWriteNow: false;
  backendRouteAddedNow: false;
  frontendAddedNow: false;
  tokenPersistenceWriteNow: false;
  tokenExchangeHttpCallNow: false;
  realSpApiRequestNow: false;
  writesDatabase: false;

  migrationNamingPlan: {
    recommendedName: 'add_amazon_sp_api_connection_models';
    expectedPathPattern: 'apps/api/prisma/migrations/YYYYMMDDHHMMSS_add_amazon_sp_api_connection_models/migration.sql';
    mustBeReviewedBeforeCommit: true;
    mustBeGeneratedFromCurrentSchema: true;
  };

  allowedSqlPlan: {
    createEnumAmazonSpApiConnectionStatus: true;
    createTableAmazonSpApiConnection: true;
    createTableAmazonSpApiCredential: true;
    createTableAmazonSpApiAccessTokenCache: true;
    createTableAmazonSpApiConnectionAudit: true;
    createUniqueIndexes: true;
    createNonUniqueIndexes: true;
    addForeignKeysWithRestrictDelete: true;
  };

  destructiveSqlForbidden: {
    dropTable: true;
    dropColumn: true;
    dropIndex: true;
    alterExistingAccountingTables: true;
    truncate: true;
    deleteFrom: true;
    updateExistingRows: true;
    cascadeDelete: true;
    renameExistingTable: true;
    renameExistingColumn: true;
  };

  existingModelProtection: {
    Transaction: true;
    ImportJob: true;
    ImportStagingRow: true;
    InventoryBalance: true;
    InventoryMovement: true;
    Product: true;
    ProductSku: true;
    ProductSkuAlias: true;
    Account: true;
    Invoice: true;
    PaymentReceipt: true;
  };

  preDeployGate: {
    productionBackupRequired: true;
    prismaValidateRequired: true;
    prismaGenerateRequired: true;
    apiBuildRequired: true;
    migrationSqlReviewRequired: true;
    destructiveSqlScannerRequired: true;
    rollbackProcedureRequired: true;
    maintenanceWindowRecommended: true;
    envGateForRuntimeUsageRequired: true;
  };

  deployCommandPlan: {
    localReviewCommand: 'npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script';
    migrationCreationCommandToRunNextStepOnly: 'npx prisma migrate dev --name add_amazon_sp_api_connection_models --create-only';
    productionDeployCommandFutureOnly: 'npx prisma migrate deploy';
    noCommandRunsInThisStep: true;
  };

  rollbackPlan: {
    rollbackRequiresFreshBackup: true;
    rollbackMustNotDeleteAccountingData: true;
    rollbackMayDropOnlyNewAmazonSpApiTablesIfNoProductionTokenData: true;
    rollbackRequiresTokenExportIfProductionTokenDataExists: true;
    runtimeFeatureFlagMustBeDisabledBeforeRollback: true;
    rollbackSqlMustBeReviewedSeparately: true;
  };

  postMigrationValidationPlan: {
    prismaValidateAfterMigration: true;
    prismaGenerateAfterMigration: true;
    apiBuildAfterMigration: true;
    prismaClientDelegateSmokeAfterMigration: true;
    noServiceRouteFrontendUntilMigrationVerified: true;
  };

  forbiddenNow: {
    prismaMigrationFile: true;
    prismaMigrateDev: true;
    prismaMigrateDeploy: true;
    prismaDbPush: true;
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
    readyForCreateOnlyMigrationScript: true;
    readyForActualMigrationDeploy: false;
    readyForTokenPersistenceServiceImplementation: false;
    readyForTokenExchangeHttpImplementation: false;
    readyForCallbackRouteImplementation: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiMigrationFileCreationPlanDeploySafetyContract(): AmazonSpApiMigrationFileCreationPlanDeploySafetyContract {
  const step124B = assertAmazonSpApiPrismaClientGenerationModelAvailabilityContract(
    buildAmazonSpApiPrismaClientGenerationModelAvailabilityContract(),
  );

  return {
    version: AMAZON_SP_API_MIGRATION_FILE_CREATION_PLAN_DEPLOY_SAFETY_CONTRACT_VERSION,
    sourceStep124B: step124B,

    contractOnly: true,
    migrationPlanOnly: true,
    migrationFileCreatedNow: false,
    prismaMigrateDevNow: false,
    prismaMigrateDeployNow: false,
    prismaDbPushNow: false,
    databaseWriteNow: false,
    backendRouteAddedNow: false,
    frontendAddedNow: false,
    tokenPersistenceWriteNow: false,
    tokenExchangeHttpCallNow: false,
    realSpApiRequestNow: false,
    writesDatabase: false,

    migrationNamingPlan: {
      recommendedName: 'add_amazon_sp_api_connection_models',
      expectedPathPattern: 'apps/api/prisma/migrations/YYYYMMDDHHMMSS_add_amazon_sp_api_connection_models/migration.sql',
      mustBeReviewedBeforeCommit: true,
      mustBeGeneratedFromCurrentSchema: true,
    },

    allowedSqlPlan: {
      createEnumAmazonSpApiConnectionStatus: true,
      createTableAmazonSpApiConnection: true,
      createTableAmazonSpApiCredential: true,
      createTableAmazonSpApiAccessTokenCache: true,
      createTableAmazonSpApiConnectionAudit: true,
      createUniqueIndexes: true,
      createNonUniqueIndexes: true,
      addForeignKeysWithRestrictDelete: true,
    },

    destructiveSqlForbidden: {
      dropTable: true,
      dropColumn: true,
      dropIndex: true,
      alterExistingAccountingTables: true,
      truncate: true,
      deleteFrom: true,
      updateExistingRows: true,
      cascadeDelete: true,
      renameExistingTable: true,
      renameExistingColumn: true,
    },

    existingModelProtection: {
      Transaction: true,
      ImportJob: true,
      ImportStagingRow: true,
      InventoryBalance: true,
      InventoryMovement: true,
      Product: true,
      ProductSku: true,
      ProductSkuAlias: true,
      Account: true,
      Invoice: true,
      PaymentReceipt: true,
    },

    preDeployGate: {
      productionBackupRequired: true,
      prismaValidateRequired: true,
      prismaGenerateRequired: true,
      apiBuildRequired: true,
      migrationSqlReviewRequired: true,
      destructiveSqlScannerRequired: true,
      rollbackProcedureRequired: true,
      maintenanceWindowRecommended: true,
      envGateForRuntimeUsageRequired: true,
    },

    deployCommandPlan: {
      localReviewCommand: 'npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script',
      migrationCreationCommandToRunNextStepOnly: 'npx prisma migrate dev --name add_amazon_sp_api_connection_models --create-only',
      productionDeployCommandFutureOnly: 'npx prisma migrate deploy',
      noCommandRunsInThisStep: true,
    },

    rollbackPlan: {
      rollbackRequiresFreshBackup: true,
      rollbackMustNotDeleteAccountingData: true,
      rollbackMayDropOnlyNewAmazonSpApiTablesIfNoProductionTokenData: true,
      rollbackRequiresTokenExportIfProductionTokenDataExists: true,
      runtimeFeatureFlagMustBeDisabledBeforeRollback: true,
      rollbackSqlMustBeReviewedSeparately: true,
    },

    postMigrationValidationPlan: {
      prismaValidateAfterMigration: true,
      prismaGenerateAfterMigration: true,
      apiBuildAfterMigration: true,
      prismaClientDelegateSmokeAfterMigration: true,
      noServiceRouteFrontendUntilMigrationVerified: true,
    },

    forbiddenNow: {
      prismaMigrationFile: true,
      prismaMigrateDev: true,
      prismaMigrateDeploy: true,
      prismaDbPush: true,
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
      readyForCreateOnlyMigrationScript: true,
      readyForActualMigrationDeploy: false,
      readyForTokenPersistenceServiceImplementation: false,
      readyForTokenExchangeHttpImplementation: false,
      readyForCallbackRouteImplementation: false,
      readyForRealSpApiReportRequest: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiMigrationFileCreationPlanDeploySafetyContract(
  contract: AmazonSpApiMigrationFileCreationPlanDeploySafetyContract,
): AmazonSpApiMigrationFileCreationPlanDeploySafetyContract {
  if (contract.version !== AMAZON_SP_API_MIGRATION_FILE_CREATION_PLAN_DEPLOY_SAFETY_CONTRACT_VERSION) {
    throw new Error('Step124-C migration file creation plan contract violation: version mismatch.');
  }

  assertAmazonSpApiPrismaClientGenerationModelAvailabilityContract(contract.sourceStep124B);

  if (
    contract.contractOnly !== true ||
    contract.migrationPlanOnly !== true ||
    contract.migrationFileCreatedNow !== false ||
    contract.prismaMigrateDevNow !== false ||
    contract.prismaMigrateDeployNow !== false ||
    contract.prismaDbPushNow !== false ||
    contract.databaseWriteNow !== false ||
    contract.backendRouteAddedNow !== false ||
    contract.frontendAddedNow !== false ||
    contract.tokenPersistenceWriteNow !== false ||
    contract.tokenExchangeHttpCallNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step124-C migration file creation plan contract violation: boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    allowedSqlPlan: contract.allowedSqlPlan,
    destructiveSqlForbidden: contract.destructiveSqlForbidden,
    existingModelProtection: contract.existingModelProtection,
    preDeployGate: contract.preDeployGate,
    rollbackPlan: contract.rollbackPlan,
    postMigrationValidationPlan: contract.postMigrationValidationPlan,
    forbiddenNow: contract.forbiddenNow,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step124-C migration file creation plan contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.migrationNamingPlan.recommendedName !== 'add_amazon_sp_api_connection_models' ||
    contract.migrationNamingPlan.mustBeReviewedBeforeCommit !== true ||
    contract.migrationNamingPlan.mustBeGeneratedFromCurrentSchema !== true ||
    contract.deployCommandPlan.noCommandRunsInThisStep !== true
  ) {
    throw new Error('Step124-C migration file creation plan contract violation: migration naming/deploy command mismatch.');
  }

  if (
    contract.summary.readyForCreateOnlyMigrationScript !== true ||
    contract.summary.readyForActualMigrationDeploy !== false ||
    contract.summary.readyForTokenPersistenceServiceImplementation !== false ||
    contract.summary.readyForTokenExchangeHttpImplementation !== false ||
    contract.summary.readyForCallbackRouteImplementation !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSales !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step124-C migration file creation plan contract violation: summary mismatch.');
  }

  return contract;
}
