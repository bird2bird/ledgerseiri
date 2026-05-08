import {
  assertAmazonSpApiCreateOnlyPrismaMigrationContract,
  buildAmazonSpApiCreateOnlyPrismaMigrationContract,
  type AmazonSpApiCreateOnlyPrismaMigrationContract,
} from './amazon-sp-api-create-only-prisma-migration-contract.dto';

export const AMAZON_SP_API_MIGRATION_DEPLOY_READINESS_PRODUCTION_GATE_CONTRACT_VERSION =
  'amazon-sp-api-migration-deploy-readiness-production-gate-contract-v1' as const;

export type AmazonSpApiMigrationDeployReadinessProductionGateContract = {
  version: typeof AMAZON_SP_API_MIGRATION_DEPLOY_READINESS_PRODUCTION_GATE_CONTRACT_VERSION;
  sourceStep124D: AmazonSpApiCreateOnlyPrismaMigrationContract;

  deployReadinessContractOnly: true;
  productionGateOnly: true;
  migrationFileAlreadyCreated: true;
  migrationSqlReviewedNow: true;

  prismaMigrateDeployNow: false;
  prismaMigrateResolveNow: false;
  prismaDbPushNow: false;
  databaseWriteNow: false;
  runtimeFeatureEnabledNow: false;
  backendRouteAddedNow: false;
  frontendAddedNow: false;
  tokenPersistenceWriteNow: false;
  tokenExchangeHttpCallNow: false;
  realSpApiRequestNow: false;
  writesDatabase: false;

  preDeployProductionGate: {
    productionDatabaseBackupRequired: true;
    backupRestoreDryRunRecommended: true;
    maintenanceWindowRequired: true;
    deploymentOperatorApprovalRequired: true;
    databaseUrlTargetVerificationRequired: true;
    migrationSqlManualReviewRequired: true;
    destructiveSqlScannerRequired: true;
    runtimeFeatureFlagDisabledRequired: true;
    amazonSpApiRoutesDisabledRequired: true;
    rollbackPlanRequired: true;
    monitoringReadyRequired: true;
  };

  migrationStatusGate: {
    prismaMigrateStatusBeforeDeployRequired: true;
    targetMigrationMustBePendingBeforeDeploy: true;
    failedMigrationMustBeAbsent: true;
    shadowDatabaseNotRequiredForDeploy: true;
    legacyPlaceholderMigrationAwarenessRequired: true;
  };

  allowedFutureDeployCommand: {
    command: 'npx prisma migrate deploy';
    runOnlyAfterManualApproval: true;
    runOnlyAfterBackup: true;
    runOnlyInMaintenanceWindow: true;
    runOnlyAgainstVerifiedProductionDatabaseUrl: true;
    notRunInThisStep: true;
  };

  forbiddenDeployCommandsNow: {
    prismaMigrateDeploy: true;
    prismaMigrateDev: true;
    prismaMigrateReset: true;
    prismaDbPush: true;
    manualPsqlExecution: true;
  };

  rollbackGate: {
    rollbackRunbookRequired: true;
    rollbackMustDisableRuntimeFeatureFirst: true;
    rollbackMustNotDropAccountingTables: true;
    rollbackMayDropOnlyAmazonSpApiTablesBeforeProductionTokenData: true;
    rollbackRequiresTokenExportIfAnyTokenDataExists: true;
    rollbackRequiresSeparateManualReview: true;
  };

  postDeployValidationPlan: {
    prismaMigrateStatusAfterDeployRequired: true;
    prismaValidateRequired: true;
    prismaGenerateRequired: true;
    apiBuildRequired: true;
    prismaClientDelegateSmokeRequired: true;
    schemaTableExistenceCheckRequired: true;
    noTokenRowsExpectedImmediatelyAfterMigration: true;
    appRuntimeSmokeRequiredBeforeFeatureEnable: true;
  };

  featureEnableGate: {
    tokenPersistenceServiceImplementationStillBlocked: true;
    tokenExchangeRouteImplementationStillBlocked: true;
    oauthCallbackRouteImplementationStillBlocked: true;
    frontendConnectionButtonStillBlocked: true;
    realAmazonReportRequestStillBlocked: true;
    enableOnlyAfterMigrationDeployVerified: true;
  };

  forbiddenNow: {
    prismaMigrateDeploy: true;
    prismaMigrateResolve: true;
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
    readyForManualMigrationDeployScript: true;
    readyForActualMigrationDeploy: false;
    readyForTokenPersistenceServiceImplementation: false;
    readyForTokenExchangeHttpImplementation: false;
    readyForCallbackRouteImplementation: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiMigrationDeployReadinessProductionGateContract(): AmazonSpApiMigrationDeployReadinessProductionGateContract {
  const step124D = assertAmazonSpApiCreateOnlyPrismaMigrationContract(
    buildAmazonSpApiCreateOnlyPrismaMigrationContract(),
  );

  return {
    version: AMAZON_SP_API_MIGRATION_DEPLOY_READINESS_PRODUCTION_GATE_CONTRACT_VERSION,
    sourceStep124D: step124D,

    deployReadinessContractOnly: true,
    productionGateOnly: true,
    migrationFileAlreadyCreated: true,
    migrationSqlReviewedNow: true,

    prismaMigrateDeployNow: false,
    prismaMigrateResolveNow: false,
    prismaDbPushNow: false,
    databaseWriteNow: false,
    runtimeFeatureEnabledNow: false,
    backendRouteAddedNow: false,
    frontendAddedNow: false,
    tokenPersistenceWriteNow: false,
    tokenExchangeHttpCallNow: false,
    realSpApiRequestNow: false,
    writesDatabase: false,

    preDeployProductionGate: {
      productionDatabaseBackupRequired: true,
      backupRestoreDryRunRecommended: true,
      maintenanceWindowRequired: true,
      deploymentOperatorApprovalRequired: true,
      databaseUrlTargetVerificationRequired: true,
      migrationSqlManualReviewRequired: true,
      destructiveSqlScannerRequired: true,
      runtimeFeatureFlagDisabledRequired: true,
      amazonSpApiRoutesDisabledRequired: true,
      rollbackPlanRequired: true,
      monitoringReadyRequired: true,
    },

    migrationStatusGate: {
      prismaMigrateStatusBeforeDeployRequired: true,
      targetMigrationMustBePendingBeforeDeploy: true,
      failedMigrationMustBeAbsent: true,
      shadowDatabaseNotRequiredForDeploy: true,
      legacyPlaceholderMigrationAwarenessRequired: true,
    },

    allowedFutureDeployCommand: {
      command: 'npx prisma migrate deploy',
      runOnlyAfterManualApproval: true,
      runOnlyAfterBackup: true,
      runOnlyInMaintenanceWindow: true,
      runOnlyAgainstVerifiedProductionDatabaseUrl: true,
      notRunInThisStep: true,
    },

    forbiddenDeployCommandsNow: {
      prismaMigrateDeploy: true,
      prismaMigrateDev: true,
      prismaMigrateReset: true,
      prismaDbPush: true,
      manualPsqlExecution: true,
    },

    rollbackGate: {
      rollbackRunbookRequired: true,
      rollbackMustDisableRuntimeFeatureFirst: true,
      rollbackMustNotDropAccountingTables: true,
      rollbackMayDropOnlyAmazonSpApiTablesBeforeProductionTokenData: true,
      rollbackRequiresTokenExportIfAnyTokenDataExists: true,
      rollbackRequiresSeparateManualReview: true,
    },

    postDeployValidationPlan: {
      prismaMigrateStatusAfterDeployRequired: true,
      prismaValidateRequired: true,
      prismaGenerateRequired: true,
      apiBuildRequired: true,
      prismaClientDelegateSmokeRequired: true,
      schemaTableExistenceCheckRequired: true,
      noTokenRowsExpectedImmediatelyAfterMigration: true,
      appRuntimeSmokeRequiredBeforeFeatureEnable: true,
    },

    featureEnableGate: {
      tokenPersistenceServiceImplementationStillBlocked: true,
      tokenExchangeRouteImplementationStillBlocked: true,
      oauthCallbackRouteImplementationStillBlocked: true,
      frontendConnectionButtonStillBlocked: true,
      realAmazonReportRequestStillBlocked: true,
      enableOnlyAfterMigrationDeployVerified: true,
    },

    forbiddenNow: {
      prismaMigrateDeploy: true,
      prismaMigrateResolve: true,
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
      readyForManualMigrationDeployScript: true,
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

export function assertAmazonSpApiMigrationDeployReadinessProductionGateContract(
  contract: AmazonSpApiMigrationDeployReadinessProductionGateContract,
): AmazonSpApiMigrationDeployReadinessProductionGateContract {
  if (contract.version !== AMAZON_SP_API_MIGRATION_DEPLOY_READINESS_PRODUCTION_GATE_CONTRACT_VERSION) {
    throw new Error('Step124-E migration deploy readiness production gate contract violation: version mismatch.');
  }

  assertAmazonSpApiCreateOnlyPrismaMigrationContract(contract.sourceStep124D);

  if (
    contract.deployReadinessContractOnly !== true ||
    contract.productionGateOnly !== true ||
    contract.migrationFileAlreadyCreated !== true ||
    contract.migrationSqlReviewedNow !== true ||
    contract.prismaMigrateDeployNow !== false ||
    contract.prismaMigrateResolveNow !== false ||
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
    throw new Error('Step124-E migration deploy readiness production gate contract violation: boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    preDeployProductionGate: contract.preDeployProductionGate,
    migrationStatusGate: contract.migrationStatusGate,
    allowedFutureDeployCommand: contract.allowedFutureDeployCommand,
    forbiddenDeployCommandsNow: contract.forbiddenDeployCommandsNow,
    rollbackGate: contract.rollbackGate,
    postDeployValidationPlan: contract.postDeployValidationPlan,
    featureEnableGate: contract.featureEnableGate,
    forbiddenNow: contract.forbiddenNow,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (key === 'command') continue;
      if (value !== true) {
        throw new Error(`Step124-E migration deploy readiness production gate contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.allowedFutureDeployCommand.command !== 'npx prisma migrate deploy' ||
    contract.summary.readyForManualMigrationDeployScript !== true ||
    contract.summary.readyForActualMigrationDeploy !== false ||
    contract.summary.readyForTokenPersistenceServiceImplementation !== false ||
    contract.summary.readyForTokenExchangeHttpImplementation !== false ||
    contract.summary.readyForCallbackRouteImplementation !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSales !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step124-E migration deploy readiness production gate contract violation: summary/future command mismatch.');
  }

  return contract;
}
