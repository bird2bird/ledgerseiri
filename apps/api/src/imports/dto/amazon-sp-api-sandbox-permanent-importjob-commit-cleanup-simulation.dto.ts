import {
  type AmazonSpApiSandboxPermanentImportJobPersistencePlan,
  assertAmazonSpApiSandboxPermanentImportJobPersistencePlan,
} from './amazon-sp-api-sandbox-permanent-importjob-persistence-plan.dto';

export const AMAZON_SP_API_SANDBOX_PERMANENT_IMPORTJOB_COMMIT_CLEANUP_SIMULATION_VERSION =
  'amazon-sp-api-sandbox-permanent-importjob-commit-cleanup-simulation-v1' as const;

export type AmazonSpApiSandboxPermanentImportJobCommitCleanupSimulationDecision =
  | 'COMMIT_CLEANUP_SIMULATION_ALLOWED_SERVICE_NOT_IMPLEMENTED'
  | 'PLAN_NOT_READY'
  | 'BLOCKED_NOW';

export type AmazonSpApiSandboxPermanentImportJobCommitCleanupSimulation = {
  version: typeof AMAZON_SP_API_SANDBOX_PERMANENT_IMPORTJOB_COMMIT_CLEANUP_SIMULATION_VERSION;
  module: 'store-orders';
  sourceType: 'amazon-sp-api-sandbox';
  normalizedSourceType: 'AMAZON_ORDER_SP_API';

  decision: AmazonSpApiSandboxPermanentImportJobCommitCleanupSimulationDecision;
  simulationOnly: true;
  commitAllowedInsideSmokeOnly: true;
  cleanupRequired: true;
  cleanupVerifiedRequired: true;

  serviceMethodImplemented: false;
  controllerCallable: false;
  frontendCallable: false;

  permanentServiceImplementationAllowedNow: false;
  permanentExecutionAllowedNow: false;
  dryRunFalseAllowed: false;
  writesDatabaseAfterCleanup: false;

  sourcePlan: AmazonSpApiSandboxPermanentImportJobPersistencePlan;

  allowedSimulationWriteScope: {
    importJobCreate: true;
    importStagingRowCreate: true;
    transactionCreate: false;
    transactionUpdate: false;
    transactionOverwrite: false;
    inventoryMovementCreate: false;
    inventoryBalanceUpdate: false;
    tokenCreate: false;
    credentialCreate: false;
    schemaMigration: false;
  };

  cleanupPolicy: {
    deleteImportStagingRowsByImportJobId: true;
    deleteImportJobById: true;
    verifyImportJobLeakZero: true;
    verifyImportStagingRowLeakZero: true;
    verifyTransactionLeakZero: true;
    verifyInventoryMovementLeakZero: true;
    cleanupInFinally: true;
  };

  futurePhaseScope: {
    mayDesignPermanentServiceMethodAfterCleanupSmoke: true;
    mayImplementPermanentServiceMethodNow: false;
    mayOpenControllerNow: false;
    mayOpenFrontendNow: false;
    mayCallRealSpApiNow: false;
    mayUseOAuthNow: false;
    mayPersistTokenNow: false;
    mayCommitTransactionsNow: false;
    mayCreateInventoryMovementNow: false;
  };

  summary: {
    readyForCommitCleanupSmoke: true;
    readyForPermanentServiceMethodDesign: true;
    readyForPermanentServiceImplementation: false;
    readyForPermanentExecution: false;
    readyForController: false;
    readyForFrontend: false;
  };
};

export function buildAmazonSpApiSandboxPermanentImportJobCommitCleanupSimulation(args: {
  plan: AmazonSpApiSandboxPermanentImportJobPersistencePlan;
}): AmazonSpApiSandboxPermanentImportJobCommitCleanupSimulation {
  const plan = assertAmazonSpApiSandboxPermanentImportJobPersistencePlan(args.plan);

  const allowed =
    plan.decision === 'PLAN_READY_IMPLEMENTATION_NOT_ALLOWED' &&
    plan.planOnly === true &&
    plan.summary.readyForCommitCleanupSimulationDesign === true &&
    plan.implementationAllowedNow === false &&
    plan.executionAllowedNow === false &&
    plan.writesDatabase === false &&
    plan.plannedWriteScope.importJob.create === true &&
    plan.plannedWriteScope.importStagingRow.create === true;

  return {
    version: AMAZON_SP_API_SANDBOX_PERMANENT_IMPORTJOB_COMMIT_CLEANUP_SIMULATION_VERSION,
    module: 'store-orders',
    sourceType: 'amazon-sp-api-sandbox',
    normalizedSourceType: 'AMAZON_ORDER_SP_API',

    decision: allowed
      ? 'COMMIT_CLEANUP_SIMULATION_ALLOWED_SERVICE_NOT_IMPLEMENTED'
      : 'PLAN_NOT_READY',
    simulationOnly: true,
    commitAllowedInsideSmokeOnly: true,
    cleanupRequired: true,
    cleanupVerifiedRequired: true,

    serviceMethodImplemented: false,
    controllerCallable: false,
    frontendCallable: false,

    permanentServiceImplementationAllowedNow: false,
    permanentExecutionAllowedNow: false,
    dryRunFalseAllowed: false,
    writesDatabaseAfterCleanup: false,

    sourcePlan: plan,

    allowedSimulationWriteScope: {
      importJobCreate: true,
      importStagingRowCreate: true,
      transactionCreate: false,
      transactionUpdate: false,
      transactionOverwrite: false,
      inventoryMovementCreate: false,
      inventoryBalanceUpdate: false,
      tokenCreate: false,
      credentialCreate: false,
      schemaMigration: false,
    },

    cleanupPolicy: {
      deleteImportStagingRowsByImportJobId: true,
      deleteImportJobById: true,
      verifyImportJobLeakZero: true,
      verifyImportStagingRowLeakZero: true,
      verifyTransactionLeakZero: true,
      verifyInventoryMovementLeakZero: true,
      cleanupInFinally: true,
    },

    futurePhaseScope: {
      mayDesignPermanentServiceMethodAfterCleanupSmoke: true,
      mayImplementPermanentServiceMethodNow: false,
      mayOpenControllerNow: false,
      mayOpenFrontendNow: false,
      mayCallRealSpApiNow: false,
      mayUseOAuthNow: false,
      mayPersistTokenNow: false,
      mayCommitTransactionsNow: false,
      mayCreateInventoryMovementNow: false,
    },

    summary: {
      readyForCommitCleanupSmoke: true,
      readyForPermanentServiceMethodDesign: true,
      readyForPermanentServiceImplementation: false,
      readyForPermanentExecution: false,
      readyForController: false,
      readyForFrontend: false,
    },
  };
}

export function assertAmazonSpApiSandboxPermanentImportJobCommitCleanupSimulation(
  simulation: AmazonSpApiSandboxPermanentImportJobCommitCleanupSimulation,
): AmazonSpApiSandboxPermanentImportJobCommitCleanupSimulation {
  if (
    simulation.version !==
    AMAZON_SP_API_SANDBOX_PERMANENT_IMPORTJOB_COMMIT_CLEANUP_SIMULATION_VERSION
  ) {
    throw new Error('Step121-C commit cleanup simulation violation: version mismatch.');
  }

  if (simulation.simulationOnly !== true) {
    throw new Error('Step121-C commit cleanup simulation violation: simulationOnly must be true.');
  }

  if (simulation.commitAllowedInsideSmokeOnly !== true) {
    throw new Error('Step121-C commit cleanup simulation violation: commit must be smoke-only.');
  }

  if (simulation.cleanupRequired !== true || simulation.cleanupVerifiedRequired !== true) {
    throw new Error('Step121-C commit cleanup simulation violation: cleanup must be required and verified.');
  }

  if (simulation.permanentServiceImplementationAllowedNow !== false) {
    throw new Error('Step121-C commit cleanup simulation violation: permanent service implementation must remain false.');
  }

  if (simulation.permanentExecutionAllowedNow !== false) {
    throw new Error('Step121-C commit cleanup simulation violation: permanent execution must remain false.');
  }

  if (simulation.writesDatabaseAfterCleanup !== false) {
    throw new Error('Step121-C commit cleanup simulation violation: writesDatabaseAfterCleanup must remain false.');
  }

  if (
    simulation.allowedSimulationWriteScope.transactionCreate !== false ||
    simulation.allowedSimulationWriteScope.inventoryMovementCreate !== false ||
    simulation.allowedSimulationWriteScope.tokenCreate !== false ||
    simulation.allowedSimulationWriteScope.schemaMigration !== false
  ) {
    throw new Error('Step121-C commit cleanup simulation violation: out-of-scope writes must remain false.');
  }

  return simulation;
}
