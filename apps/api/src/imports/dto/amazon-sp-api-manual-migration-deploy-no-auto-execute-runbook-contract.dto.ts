import {
  assertAmazonSpApiMigrationDeployReadinessProductionGateContract,
  buildAmazonSpApiMigrationDeployReadinessProductionGateContract,
  type AmazonSpApiMigrationDeployReadinessProductionGateContract,
} from './amazon-sp-api-migration-deploy-readiness-production-gate-contract.dto';

export const AMAZON_SP_API_MANUAL_MIGRATION_DEPLOY_NO_AUTO_EXECUTE_RUNBOOK_CONTRACT_VERSION =
  'amazon-sp-api-manual-migration-deploy-no-auto-execute-runbook-contract-v2' as const;

export type AmazonSpApiManualMigrationDeployNoAutoExecuteRunbookContract = {
  version: typeof AMAZON_SP_API_MANUAL_MIGRATION_DEPLOY_NO_AUTO_EXECUTE_RUNBOOK_CONTRACT_VERSION;
  sourceStep124E: AmazonSpApiMigrationDeployReadinessProductionGateContract;

  runbookScriptCreatedNow: true;
  deployRunbookOnly: true;
  noAutoExecute: true;
  defaultDryRun: true;
  dryRunSmokeCanBypassCleanTreeOnlyWithExplicitSmokeFlag: true;

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

  runbookPath: 'apps/api/scripts/manual-amazon-sp-api-migration-deploy-runbook.sh';

  requiredExplicitConfirmations: {
    CONFIRM_AMAZON_SP_API_MIGRATION_DEPLOY: 'YES';
    AMAZON_SP_API_MIGRATION_BACKUP_CONFIRMED: 'YES';
    AMAZON_SP_API_MIGRATION_DATABASE_TARGET_CONFIRMED: 'YES';
    AMAZON_SP_API_MIGRATION_MAINTENANCE_WINDOW_CONFIRMED: 'YES';
    AMAZON_SP_API_MIGRATION_FEATURE_FLAGS_DISABLED: 'YES';
    DRY_RUN: '0';
  };

  runbookPrechecks: {
    expectedGitShaCheck: true;
    cleanWorkingTreeCheck: true;
    migrationFileExistsCheck: true;
    migrationSqlSafetyScan: true;
    prismaValidate: true;
    prismaGenerate: true;
    apiBuild: true;
    step124DSmoke: true;
    step124ESmoke: true;
    prismaMigrateStatusPreview: true;
  };

  runbookDeployCommand: {
    command: 'npx prisma migrate deploy';
    printedInDryRun: true;
    executedOnlyWhenDryRunIsZeroAndAllConfirmationsAreYes: true;
    notExecutedByThisStep: true;
  };

  runbookPostDeployValidation: {
    prismaMigrateStatus: true;
    prismaValidate: true;
    prismaGenerate: true;
    apiBuild: true;
    step124DSmoke: true;
    step124ESmoke: true;
  };

  stillForbiddenNow: {
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
    readyForManuallyConfirmedMigrationDeployExecution: true;
    readyForActualMigrationDeployInThisStep: false;
    readyForTokenPersistenceServiceImplementation: false;
    readyForTokenExchangeHttpImplementation: false;
    readyForCallbackRouteImplementation: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiManualMigrationDeployNoAutoExecuteRunbookContract(): AmazonSpApiManualMigrationDeployNoAutoExecuteRunbookContract {
  const step124E = assertAmazonSpApiMigrationDeployReadinessProductionGateContract(
    buildAmazonSpApiMigrationDeployReadinessProductionGateContract(),
  );

  return {
    version: AMAZON_SP_API_MANUAL_MIGRATION_DEPLOY_NO_AUTO_EXECUTE_RUNBOOK_CONTRACT_VERSION,
    sourceStep124E: step124E,

    runbookScriptCreatedNow: true,
    deployRunbookOnly: true,
    noAutoExecute: true,
    defaultDryRun: true,
    dryRunSmokeCanBypassCleanTreeOnlyWithExplicitSmokeFlag: true,

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

    runbookPath: 'apps/api/scripts/manual-amazon-sp-api-migration-deploy-runbook.sh',

    requiredExplicitConfirmations: {
      CONFIRM_AMAZON_SP_API_MIGRATION_DEPLOY: 'YES',
      AMAZON_SP_API_MIGRATION_BACKUP_CONFIRMED: 'YES',
      AMAZON_SP_API_MIGRATION_DATABASE_TARGET_CONFIRMED: 'YES',
      AMAZON_SP_API_MIGRATION_MAINTENANCE_WINDOW_CONFIRMED: 'YES',
      AMAZON_SP_API_MIGRATION_FEATURE_FLAGS_DISABLED: 'YES',
      DRY_RUN: '0',
    },

    runbookPrechecks: {
      expectedGitShaCheck: true,
      cleanWorkingTreeCheck: true,
      migrationFileExistsCheck: true,
      migrationSqlSafetyScan: true,
      prismaValidate: true,
      prismaGenerate: true,
      apiBuild: true,
      step124DSmoke: true,
      step124ESmoke: true,
      prismaMigrateStatusPreview: true,
    },

    runbookDeployCommand: {
      command: 'npx prisma migrate deploy',
      printedInDryRun: true,
      executedOnlyWhenDryRunIsZeroAndAllConfirmationsAreYes: true,
      notExecutedByThisStep: true,
    },

    runbookPostDeployValidation: {
      prismaMigrateStatus: true,
      prismaValidate: true,
      prismaGenerate: true,
      apiBuild: true,
      step124DSmoke: true,
      step124ESmoke: true,
    },

    stillForbiddenNow: {
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
      readyForManuallyConfirmedMigrationDeployExecution: true,
      readyForActualMigrationDeployInThisStep: false,
      readyForTokenPersistenceServiceImplementation: false,
      readyForTokenExchangeHttpImplementation: false,
      readyForCallbackRouteImplementation: false,
      readyForRealSpApiReportRequest: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiManualMigrationDeployNoAutoExecuteRunbookContract(
  contract: AmazonSpApiManualMigrationDeployNoAutoExecuteRunbookContract,
): AmazonSpApiManualMigrationDeployNoAutoExecuteRunbookContract {
  if (contract.version !== AMAZON_SP_API_MANUAL_MIGRATION_DEPLOY_NO_AUTO_EXECUTE_RUNBOOK_CONTRACT_VERSION) {
    throw new Error('Step124-F manual migration deploy runbook contract violation: version mismatch.');
  }

  assertAmazonSpApiMigrationDeployReadinessProductionGateContract(contract.sourceStep124E);

  if (
    contract.runbookScriptCreatedNow !== true ||
    contract.deployRunbookOnly !== true ||
    contract.noAutoExecute !== true ||
    contract.defaultDryRun !== true ||
    contract.dryRunSmokeCanBypassCleanTreeOnlyWithExplicitSmokeFlag !== true ||
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
    throw new Error('Step124-F manual migration deploy runbook contract violation: boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    runbookPrechecks: contract.runbookPrechecks,
    runbookPostDeployValidation: contract.runbookPostDeployValidation,
    stillForbiddenNow: contract.stillForbiddenNow,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step124-F manual migration deploy runbook contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  for (const [key, value] of Object.entries(contract.requiredExplicitConfirmations)) {
    if (!value) {
      throw new Error(`Step124-F manual migration deploy runbook contract violation: missing confirmation value for ${key}.`);
    }
  }

  if (
    contract.runbookDeployCommand.command !== 'npx prisma migrate deploy' ||
    contract.runbookDeployCommand.printedInDryRun !== true ||
    contract.runbookDeployCommand.executedOnlyWhenDryRunIsZeroAndAllConfirmationsAreYes !== true ||
    contract.runbookDeployCommand.notExecutedByThisStep !== true ||
    contract.summary.readyForManuallyConfirmedMigrationDeployExecution !== true ||
    contract.summary.readyForActualMigrationDeployInThisStep !== false ||
    contract.summary.readyForTokenPersistenceServiceImplementation !== false ||
    contract.summary.readyForTokenExchangeHttpImplementation !== false ||
    contract.summary.readyForCallbackRouteImplementation !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSales !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step124-F manual migration deploy runbook contract violation: summary/deploy command mismatch.');
  }

  return contract;
}
