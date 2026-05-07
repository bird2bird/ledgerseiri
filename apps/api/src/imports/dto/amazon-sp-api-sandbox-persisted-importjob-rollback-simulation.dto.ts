import {
  type AmazonSpApiSandboxPersistedImportJobDesignGate,
  assertAmazonSpApiSandboxPersistedImportJobDesignGate,
} from './amazon-sp-api-sandbox-persisted-importjob-design-gate.dto';

export const AMAZON_SP_API_SANDBOX_PERSISTED_IMPORTJOB_ROLLBACK_SIMULATION_VERSION =
  'amazon-sp-api-sandbox-persisted-importjob-rollback-simulation-v1' as const;

export type AmazonSpApiSandboxRollbackSimulationMode =
  | 'ROLLBACK_ONLY'
  | 'EXECUTION_BLOCKED';

export type AmazonSpApiSandboxRollbackSimulationPlannedWrite = {
  target: 'ImportJob' | 'ImportStagingRow';
  operation: 'create';
  rowCount: number;
  allowedInsideRollbackOnlyTransaction: true;
  allowedToCommit: false;
};

export type AmazonSpApiSandboxPersistedImportJobRollbackSimulation = {
  version: typeof AMAZON_SP_API_SANDBOX_PERSISTED_IMPORTJOB_ROLLBACK_SIMULATION_VERSION;
  module: 'store-orders';
  sourceType: 'amazon-sp-api-sandbox';
  normalizedSourceType: 'AMAZON_ORDER_SP_API';

  mode: AmazonSpApiSandboxRollbackSimulationMode;
  simulationOnly: true;
  rollbackRequired: true;
  rollbackVerifiedRequired: true;
  currentCommitAllowed: false;
  writesDatabasePermanently: false;

  designGate: AmazonSpApiSandboxPersistedImportJobDesignGate;

  plannedWrites: readonly [
    AmazonSpApiSandboxRollbackSimulationPlannedWrite,
    AmazonSpApiSandboxRollbackSimulationPlannedWrite,
  ];

  transactionPolicy: {
    mustRunInsideTransaction: true;
    mustForceRollback: true;
    mustVerifyNoImportJobLeak: true;
    mustVerifyNoImportStagingRowLeak: true;
    mustVerifyNoTransactionLeak: true;
    mustVerifyNoInventoryMovementLeak: true;
  };

  blockedOutsideRollback: {
    createImportJob: true;
    createImportStagingRows: true;
    commitTransactions: true;
    overwriteTransactions: true;
    createInventoryMovement: true;
    updateInventoryBalance: true;
    controllerRoute: true;
    frontendRoute: true;
    realSpApi: true;
    oauth: true;
    tokenPersistence: true;
  };

  summary: {
    plannedImportJobRows: number;
    plannedStagingRows: number;
    rollbackSmokeCoversImportJob: true;
    rollbackSmokeCoversImportStagingRows: true;
    readyForPermanentPersistence: false;
  };
};

export function buildAmazonSpApiSandboxPersistedImportJobRollbackSimulation(args: {
  designGate: AmazonSpApiSandboxPersistedImportJobDesignGate;
}): AmazonSpApiSandboxPersistedImportJobRollbackSimulation {
  const designGate = assertAmazonSpApiSandboxPersistedImportJobDesignGate(args.designGate);
  const plannedImportJobRows = designGate.plannedPersistenceShape.importJob.totalRowsFromPlan > 0 ? 1 : 0;
  const plannedStagingRows = designGate.plannedPersistenceShape.importStagingRow.rowCountFromPlan;

  return {
    version: AMAZON_SP_API_SANDBOX_PERSISTED_IMPORTJOB_ROLLBACK_SIMULATION_VERSION,
    module: 'store-orders',
    sourceType: 'amazon-sp-api-sandbox',
    normalizedSourceType: 'AMAZON_ORDER_SP_API',

    mode: 'ROLLBACK_ONLY',
    simulationOnly: true,
    rollbackRequired: true,
    rollbackVerifiedRequired: true,
    currentCommitAllowed: false,
    writesDatabasePermanently: false,

    designGate,

    plannedWrites: [
      {
        target: 'ImportJob',
        operation: 'create',
        rowCount: plannedImportJobRows,
        allowedInsideRollbackOnlyTransaction: true,
        allowedToCommit: false,
      },
      {
        target: 'ImportStagingRow',
        operation: 'create',
        rowCount: plannedStagingRows,
        allowedInsideRollbackOnlyTransaction: true,
        allowedToCommit: false,
      },
    ],

    transactionPolicy: {
      mustRunInsideTransaction: true,
      mustForceRollback: true,
      mustVerifyNoImportJobLeak: true,
      mustVerifyNoImportStagingRowLeak: true,
      mustVerifyNoTransactionLeak: true,
      mustVerifyNoInventoryMovementLeak: true,
    },

    blockedOutsideRollback: {
      createImportJob: true,
      createImportStagingRows: true,
      commitTransactions: true,
      overwriteTransactions: true,
      createInventoryMovement: true,
      updateInventoryBalance: true,
      controllerRoute: true,
      frontendRoute: true,
      realSpApi: true,
      oauth: true,
      tokenPersistence: true,
    },

    summary: {
      plannedImportJobRows,
      plannedStagingRows,
      rollbackSmokeCoversImportJob: true,
      rollbackSmokeCoversImportStagingRows: true,
      readyForPermanentPersistence: false,
    },
  };
}

export function assertAmazonSpApiSandboxPersistedImportJobRollbackSimulation(
  simulation: AmazonSpApiSandboxPersistedImportJobRollbackSimulation,
): AmazonSpApiSandboxPersistedImportJobRollbackSimulation {
  if (simulation.version !== AMAZON_SP_API_SANDBOX_PERSISTED_IMPORTJOB_ROLLBACK_SIMULATION_VERSION) {
    throw new Error('Step120-B rollback simulation violation: version mismatch.');
  }

  if (simulation.mode !== 'ROLLBACK_ONLY') {
    throw new Error('Step120-B rollback simulation violation: mode must be ROLLBACK_ONLY.');
  }

  if (simulation.simulationOnly !== true) {
    throw new Error('Step120-B rollback simulation violation: simulationOnly must be true.');
  }

  if (simulation.rollbackRequired !== true) {
    throw new Error('Step120-B rollback simulation violation: rollbackRequired must be true.');
  }

  if (simulation.rollbackVerifiedRequired !== true) {
    throw new Error('Step120-B rollback simulation violation: rollback verification must be required.');
  }

  if (simulation.currentCommitAllowed !== false) {
    throw new Error('Step120-B rollback simulation violation: current commit must remain blocked.');
  }

  if (simulation.writesDatabasePermanently !== false) {
    throw new Error('Step120-B rollback simulation violation: permanent writes must remain false.');
  }

  if (simulation.summary.readyForPermanentPersistence !== false) {
    throw new Error('Step120-B rollback simulation violation: permanent persistence readiness must remain false.');
  }

  for (const write of simulation.plannedWrites) {
    if (write.allowedInsideRollbackOnlyTransaction !== true) {
      throw new Error(`Step120-B rollback simulation violation: ${write.target} rollback-only write must be allowed.`);
    }

    if (write.allowedToCommit !== false) {
      throw new Error(`Step120-B rollback simulation violation: ${write.target} commit must remain blocked.`);
    }
  }

  for (const [key, blocked] of Object.entries(simulation.blockedOutsideRollback)) {
    if (blocked !== true) {
      throw new Error(`Step120-B rollback simulation violation: blockedOutsideRollback.${key} must remain true.`);
    }
  }

  return simulation;
}
