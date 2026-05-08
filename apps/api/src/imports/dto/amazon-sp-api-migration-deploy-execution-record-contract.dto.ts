import {
  assertAmazonSpApiManualMigrationDeployNoAutoExecuteRunbookContract,
  buildAmazonSpApiManualMigrationDeployNoAutoExecuteRunbookContract,
  type AmazonSpApiManualMigrationDeployNoAutoExecuteRunbookContract,
} from './amazon-sp-api-manual-migration-deploy-no-auto-execute-runbook-contract.dto';

export const AMAZON_SP_API_MIGRATION_DEPLOY_EXECUTION_RECORD_CONTRACT_VERSION =
  'amazon-sp-api-migration-deploy-execution-record-contract-v1' as const;

export type AmazonSpApiMigrationDeployExecutionRecordContract = {
  version: typeof AMAZON_SP_API_MIGRATION_DEPLOY_EXECUTION_RECORD_CONTRACT_VERSION;
  sourceStep124F: AmazonSpApiManualMigrationDeployNoAutoExecuteRunbookContract;

  migrationDeployExecutedNow: true;
  runbookExecutedWithExplicitConfirmations: true;
  prismaMigrateDeployExecuted: true;
  databaseSchemaChangedNow: true;
  amazonSpApiTablesCreatedNow: true;
  prismaMigrationRecordVerifiedNow: true;

  prismaDbPushNow: false;
  prismaMigrateResetNow: false;
  manualPsqlExecutionNow: false;
  tokenPersistenceWriteNow: false;
  tokenExchangeHttpCallNow: false;
  oauthCallbackRouteAddedNow: false;
  authorizationRouteAddedNow: false;
  frontendAddedNow: false;
  realSpApiRequestNow: false;
  applicationDataWriteNow: false;

  deployedMigration: {
    name: '20260508_123732_add_amazon_sp_api_connection_models';
    tables: readonly [
      'AmazonSpApiConnection',
      'AmazonSpApiCredential',
      'AmazonSpApiAccessTokenCache',
      'AmazonSpApiConnectionAudit'
    ];
  };

  note: {
    step110ExistingInventoryTraceabilityWasAlsoAppliedBecauseItWasPending: true;
  };

  summary: {
    readyForStep125TokenPersistencePreImplementationContract: true;
    readyForTokenPersistenceServiceImplementation: false;
    readyForTokenExchangeHttpImplementation: false;
    readyForCallbackRouteImplementation: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiMigrationDeployExecutionRecordContract(): AmazonSpApiMigrationDeployExecutionRecordContract {
  const step124F = assertAmazonSpApiManualMigrationDeployNoAutoExecuteRunbookContract(
    buildAmazonSpApiManualMigrationDeployNoAutoExecuteRunbookContract(),
  );

  return {
    version: AMAZON_SP_API_MIGRATION_DEPLOY_EXECUTION_RECORD_CONTRACT_VERSION,
    sourceStep124F: step124F,

    migrationDeployExecutedNow: true,
    runbookExecutedWithExplicitConfirmations: true,
    prismaMigrateDeployExecuted: true,
    databaseSchemaChangedNow: true,
    amazonSpApiTablesCreatedNow: true,
    prismaMigrationRecordVerifiedNow: true,

    prismaDbPushNow: false,
    prismaMigrateResetNow: false,
    manualPsqlExecutionNow: false,
    tokenPersistenceWriteNow: false,
    tokenExchangeHttpCallNow: false,
    oauthCallbackRouteAddedNow: false,
    authorizationRouteAddedNow: false,
    frontendAddedNow: false,
    realSpApiRequestNow: false,
    applicationDataWriteNow: false,

    deployedMigration: {
      name: '20260508_123732_add_amazon_sp_api_connection_models',
      tables: [
        'AmazonSpApiConnection',
        'AmazonSpApiCredential',
        'AmazonSpApiAccessTokenCache',
        'AmazonSpApiConnectionAudit',
      ],
    },

    note: {
      step110ExistingInventoryTraceabilityWasAlsoAppliedBecauseItWasPending: true,
    },

    summary: {
      readyForStep125TokenPersistencePreImplementationContract: true,
      readyForTokenPersistenceServiceImplementation: false,
      readyForTokenExchangeHttpImplementation: false,
      readyForCallbackRouteImplementation: false,
      readyForRealSpApiReportRequest: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiMigrationDeployExecutionRecordContract(
  contract: AmazonSpApiMigrationDeployExecutionRecordContract,
): AmazonSpApiMigrationDeployExecutionRecordContract {
  if (contract.version !== AMAZON_SP_API_MIGRATION_DEPLOY_EXECUTION_RECORD_CONTRACT_VERSION) {
    throw new Error('Step124-G migration deploy execution record contract violation: version mismatch.');
  }

  assertAmazonSpApiManualMigrationDeployNoAutoExecuteRunbookContract(contract.sourceStep124F);

  if (
    contract.migrationDeployExecutedNow !== true ||
    contract.runbookExecutedWithExplicitConfirmations !== true ||
    contract.prismaMigrateDeployExecuted !== true ||
    contract.databaseSchemaChangedNow !== true ||
    contract.amazonSpApiTablesCreatedNow !== true ||
    contract.prismaMigrationRecordVerifiedNow !== true ||
    contract.prismaDbPushNow !== false ||
    contract.prismaMigrateResetNow !== false ||
    contract.manualPsqlExecutionNow !== false ||
    contract.tokenPersistenceWriteNow !== false ||
    contract.tokenExchangeHttpCallNow !== false ||
    contract.oauthCallbackRouteAddedNow !== false ||
    contract.authorizationRouteAddedNow !== false ||
    contract.frontendAddedNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.applicationDataWriteNow !== false ||
    contract.summary.readyForStep125TokenPersistencePreImplementationContract !== true
  ) {
    throw new Error('Step124-G migration deploy execution record contract violation: boundary mismatch.');
  }

  return contract;
}
