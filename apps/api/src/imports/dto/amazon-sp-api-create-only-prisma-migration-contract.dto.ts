import {
  assertAmazonSpApiMigrationFileCreationPlanDeploySafetyContract,
  buildAmazonSpApiMigrationFileCreationPlanDeploySafetyContract,
  type AmazonSpApiMigrationFileCreationPlanDeploySafetyContract,
} from './amazon-sp-api-migration-file-creation-plan-deploy-safety-contract.dto';

export const AMAZON_SP_API_CREATE_ONLY_PRISMA_MIGRATION_CONTRACT_VERSION =
  'amazon-sp-api-create-only-prisma-migration-contract-v3' as const;

export type AmazonSpApiCreateOnlyPrismaMigrationContract = {
  version: typeof AMAZON_SP_API_CREATE_ONLY_PRISMA_MIGRATION_CONTRACT_VERSION;
  sourceStep124C: AmazonSpApiMigrationFileCreationPlanDeploySafetyContract;

  migrationFileCreatedNow: true;
  createOnlyMigrationNow: true;
  migrationGeneratedViaDiffBecauseLegacyShadowDbBlockedMigrateDev: true;
  robustSqlScanDoesNotDependOnGeneratedIndexNames: true;
  updateStatementScannerIgnoresForeignKeyOnUpdateClause: true;

  prismaMigrateDeployNow: false;
  prismaDbPushNow: false;
  databaseWriteNow: false;
  runtimeFeatureEnabledNow: false;
  backendRouteAddedNow: false;
  frontendAddedNow: false;
  tokenPersistenceWriteNow: false;
  tokenExchangeHttpCallNow: false;
  realSpApiRequestNow: false;
  writesDatabase: false;

  expectedMigration: {
    name: 'add_amazon_sp_api_connection_models';
    sqlFileRequired: true;
    manualReviewRequiredBeforeDeploy: true;
    generatedFromCurrentDatabaseAndSchema: true;
  };

  requiredSqlSemantics: {
    createEnumAmazonSpApiConnectionStatus: true;
    createTableAmazonSpApiConnection: true;
    createTableAmazonSpApiCredential: true;
    createTableAmazonSpApiAccessTokenCache: true;
    createTableAmazonSpApiConnectionAudit: true;
    uniqueIndexesVerifiedByColumns: true;
    nonUniqueIndexesVerifiedByColumns: true;
    foreignKeysVerifiedByColumns: true;
    restrictOrNoActionDeleteBehavior: true;
  };

  destructiveSqlForbidden: {
    dropTable: true;
    dropColumn: true;
    dropIndex: true;
    truncate: true;
    deleteFrom: true;
    updateExistingRows: true;
    alterExistingAccountingTables: true;
    cascadeDelete: true;
    renameExistingTableOrColumn: true;
  };

  validationPlan: {
    migrationSqlSafetyScanRequired: true;
    prismaValidateRequired: true;
    prismaGenerateRequired: true;
    apiBuildRequired: true;
    step124DSmokeRequired: true;
    previousPreMigrationSmokesSkippedByDesign: true;
  };

  forbiddenNow: {
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
    readyForMigrationDeployPlan: true;
    readyForActualMigrationDeploy: false;
    readyForTokenPersistenceServiceImplementation: false;
    readyForTokenExchangeHttpImplementation: false;
    readyForCallbackRouteImplementation: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiCreateOnlyPrismaMigrationContract(): AmazonSpApiCreateOnlyPrismaMigrationContract {
  const step124C = assertAmazonSpApiMigrationFileCreationPlanDeploySafetyContract(
    buildAmazonSpApiMigrationFileCreationPlanDeploySafetyContract(),
  );

  return {
    version: AMAZON_SP_API_CREATE_ONLY_PRISMA_MIGRATION_CONTRACT_VERSION,
    sourceStep124C: step124C,

    migrationFileCreatedNow: true,
    createOnlyMigrationNow: true,
    migrationGeneratedViaDiffBecauseLegacyShadowDbBlockedMigrateDev: true,
    robustSqlScanDoesNotDependOnGeneratedIndexNames: true,
    updateStatementScannerIgnoresForeignKeyOnUpdateClause: true,

    prismaMigrateDeployNow: false,
    prismaDbPushNow: false,
    databaseWriteNow: false,
    runtimeFeatureEnabledNow: false,
    backendRouteAddedNow: false,
    frontendAddedNow: false,
    tokenPersistenceWriteNow: false,
    tokenExchangeHttpCallNow: false,
    realSpApiRequestNow: false,
    writesDatabase: false,

    expectedMigration: {
      name: 'add_amazon_sp_api_connection_models',
      sqlFileRequired: true,
      manualReviewRequiredBeforeDeploy: true,
      generatedFromCurrentDatabaseAndSchema: true,
    },

    requiredSqlSemantics: {
      createEnumAmazonSpApiConnectionStatus: true,
      createTableAmazonSpApiConnection: true,
      createTableAmazonSpApiCredential: true,
      createTableAmazonSpApiAccessTokenCache: true,
      createTableAmazonSpApiConnectionAudit: true,
      uniqueIndexesVerifiedByColumns: true,
      nonUniqueIndexesVerifiedByColumns: true,
      foreignKeysVerifiedByColumns: true,
      restrictOrNoActionDeleteBehavior: true,
    },

    destructiveSqlForbidden: {
      dropTable: true,
      dropColumn: true,
      dropIndex: true,
      truncate: true,
      deleteFrom: true,
      updateExistingRows: true,
      alterExistingAccountingTables: true,
      cascadeDelete: true,
      renameExistingTableOrColumn: true,
    },

    validationPlan: {
      migrationSqlSafetyScanRequired: true,
      prismaValidateRequired: true,
      prismaGenerateRequired: true,
      apiBuildRequired: true,
      step124DSmokeRequired: true,
      previousPreMigrationSmokesSkippedByDesign: true,
    },

    forbiddenNow: {
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
      readyForMigrationDeployPlan: true,
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

export function assertAmazonSpApiCreateOnlyPrismaMigrationContract(
  contract: AmazonSpApiCreateOnlyPrismaMigrationContract,
): AmazonSpApiCreateOnlyPrismaMigrationContract {
  if (contract.version !== AMAZON_SP_API_CREATE_ONLY_PRISMA_MIGRATION_CONTRACT_VERSION) {
    throw new Error('Step124-D create-only Prisma migration contract violation: version mismatch.');
  }

  assertAmazonSpApiMigrationFileCreationPlanDeploySafetyContract(contract.sourceStep124C);

  if (
    contract.migrationFileCreatedNow !== true ||
    contract.createOnlyMigrationNow !== true ||
    contract.migrationGeneratedViaDiffBecauseLegacyShadowDbBlockedMigrateDev !== true ||
    contract.robustSqlScanDoesNotDependOnGeneratedIndexNames !== true ||
    contract.updateStatementScannerIgnoresForeignKeyOnUpdateClause !== true ||
    contract.prismaMigrateDeployNow !== false ||
    contract.prismaDbPushNow !== false ||
    contract.databaseWriteNow !== false ||
    contract.runtimeFeatureEnabledNow !== false ||
    contract.backendRouteAddedNow !== false ||
    contract.frontendAddedNow !== false ||
    contract.tokenPersistenceWriteNow !== false ||
    contract.tokenExchangeHttpCallNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step124-D create-only Prisma migration contract violation: boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    requiredSqlSemantics: contract.requiredSqlSemantics,
    destructiveSqlForbidden: contract.destructiveSqlForbidden,
    validationPlan: contract.validationPlan,
    forbiddenNow: contract.forbiddenNow,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step124-D create-only Prisma migration contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.summary.readyForMigrationDeployPlan !== true ||
    contract.summary.readyForActualMigrationDeploy !== false ||
    contract.summary.readyForTokenPersistenceServiceImplementation !== false ||
    contract.summary.readyForTokenExchangeHttpImplementation !== false ||
    contract.summary.readyForCallbackRouteImplementation !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSales !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step124-D create-only Prisma migration contract violation: summary mismatch.');
  }

  return contract;
}
