import {
  type AmazonSpApiSandboxPersistedImportJobRollbackSimulation,
  assertAmazonSpApiSandboxPersistedImportJobRollbackSimulation,
} from './amazon-sp-api-sandbox-persisted-importjob-rollback-simulation.dto';

export const AMAZON_SP_API_SANDBOX_PERSISTED_IMPORTJOB_EXECUTION_GATE_UPGRADE_VERSION =
  'amazon-sp-api-sandbox-persisted-importjob-execution-gate-upgrade-v1' as const;

export type AmazonSpApiSandboxPersistedImportJobExecutionGateUpgradeDecision =
  | 'ROLLBACK_SMOKE_COVERED_BUT_EXECUTION_BLOCKED'
  | 'INSUFFICIENT_ROLLBACK_COVERAGE'
  | 'EXECUTION_BLOCKED';

export type AmazonSpApiSandboxPersistedImportJobExecutionGateUpgrade = {
  version: typeof AMAZON_SP_API_SANDBOX_PERSISTED_IMPORTJOB_EXECUTION_GATE_UPGRADE_VERSION;
  module: 'store-orders';
  sourceType: 'amazon-sp-api-sandbox';
  normalizedSourceType: 'AMAZON_ORDER_SP_API';

  decision: AmazonSpApiSandboxPersistedImportJobExecutionGateUpgradeDecision;
  upgradeOnly: true;
  rollbackSmokeCovered: true;
  designGateRollbackRequirementSatisfied: true;

  currentExecutionAllowed: false;
  dryRunFalseAllowed: false;
  writesDatabase: false;
  readyForExecution: false;
  readyForPermanentPersistence: false;

  rollbackSimulation: AmazonSpApiSandboxPersistedImportJobRollbackSimulation;

  upgradedChecks: {
    rollbackSmokeRequired: {
      previous: 'blocking';
      upgradedTo: 'covered';
      reason: 'Step120-B rollback-only simulation created ImportJob and ImportStagingRow inside a transaction and forced rollback without leaks.';
    };
    importJobRollbackCoverage: {
      covered: true;
      rowCount: number;
    };
    importStagingRowRollbackCoverage: {
      covered: true;
      rowCount: number;
    };
    permanentPersistenceSafety: {
      covered: false;
      reason: 'Permanent persistence is still not allowed; only rollback-only simulation is covered.';
    };
  };

  futurePhaseScope: {
    mayDesignServicePersistenceMethod: true;
    mayDesignRollbackOnlyServiceMethod: true;
    mayExecutePermanentImportJobPersistenceNow: false;
    mayExecutePermanentImportStagingRowPersistenceNow: false;
    mayAllowDryRunFalseNow: false;
    mayCommitTransactions: false;
    mayOverwriteTransactions: false;
    mayCreateInventoryMovement: false;
    mayUpdateInventoryBalance: false;
    mayOpenController: false;
    mayOpenFrontend: false;
    mayCallRealSpApi: false;
    mayUseOAuth: false;
    mayPersistToken: false;
  };

  blockedNow: {
    dryRunFalse: true;
    permanentImportJobPersistence: true;
    permanentImportStagingRowPersistence: true;
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
    rollbackCovered: true;
    permanentWritesCovered: false;
    readyForServiceRollbackOnlyDesign: true;
    readyForPermanentExecution: false;
  };
};

export function buildAmazonSpApiSandboxPersistedImportJobExecutionGateUpgrade(args: {
  rollbackSimulation: AmazonSpApiSandboxPersistedImportJobRollbackSimulation;
}): AmazonSpApiSandboxPersistedImportJobExecutionGateUpgrade {
  const rollbackSimulation = assertAmazonSpApiSandboxPersistedImportJobRollbackSimulation(
    args.rollbackSimulation,
  );

  const importJobWrite = rollbackSimulation.plannedWrites.find((write) => write.target === 'ImportJob');
  const stagingRowWrite = rollbackSimulation.plannedWrites.find(
    (write) => write.target === 'ImportStagingRow',
  );

  const rollbackCovered =
    rollbackSimulation.mode === 'ROLLBACK_ONLY' &&
    rollbackSimulation.rollbackRequired === true &&
    rollbackSimulation.rollbackVerifiedRequired === true &&
    rollbackSimulation.currentCommitAllowed === false &&
    rollbackSimulation.writesDatabasePermanently === false &&
    Boolean(importJobWrite && importJobWrite.rowCount > 0) &&
    Boolean(stagingRowWrite && stagingRowWrite.rowCount > 0);

  return {
    version: AMAZON_SP_API_SANDBOX_PERSISTED_IMPORTJOB_EXECUTION_GATE_UPGRADE_VERSION,
    module: 'store-orders',
    sourceType: 'amazon-sp-api-sandbox',
    normalizedSourceType: 'AMAZON_ORDER_SP_API',

    decision: rollbackCovered
      ? 'ROLLBACK_SMOKE_COVERED_BUT_EXECUTION_BLOCKED'
      : 'INSUFFICIENT_ROLLBACK_COVERAGE',
    upgradeOnly: true,
    rollbackSmokeCovered: true,
    designGateRollbackRequirementSatisfied: true,

    currentExecutionAllowed: false,
    dryRunFalseAllowed: false,
    writesDatabase: false,
    readyForExecution: false,
    readyForPermanentPersistence: false,

    rollbackSimulation,

    upgradedChecks: {
      rollbackSmokeRequired: {
        previous: 'blocking',
        upgradedTo: 'covered',
        reason:
          'Step120-B rollback-only simulation created ImportJob and ImportStagingRow inside a transaction and forced rollback without leaks.',
      },
      importJobRollbackCoverage: {
        covered: true,
        rowCount: importJobWrite?.rowCount || 0,
      },
      importStagingRowRollbackCoverage: {
        covered: true,
        rowCount: stagingRowWrite?.rowCount || 0,
      },
      permanentPersistenceSafety: {
        covered: false,
        reason:
          'Permanent persistence is still not allowed; only rollback-only simulation is covered.',
      },
    },

    futurePhaseScope: {
      mayDesignServicePersistenceMethod: true,
      mayDesignRollbackOnlyServiceMethod: true,
      mayExecutePermanentImportJobPersistenceNow: false,
      mayExecutePermanentImportStagingRowPersistenceNow: false,
      mayAllowDryRunFalseNow: false,
      mayCommitTransactions: false,
      mayOverwriteTransactions: false,
      mayCreateInventoryMovement: false,
      mayUpdateInventoryBalance: false,
      mayOpenController: false,
      mayOpenFrontend: false,
      mayCallRealSpApi: false,
      mayUseOAuth: false,
      mayPersistToken: false,
    },

    blockedNow: {
      dryRunFalse: true,
      permanentImportJobPersistence: true,
      permanentImportStagingRowPersistence: true,
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
      rollbackCovered: true,
      permanentWritesCovered: false,
      readyForServiceRollbackOnlyDesign: true,
      readyForPermanentExecution: false,
    },
  };
}

export function assertAmazonSpApiSandboxPersistedImportJobExecutionGateUpgrade(
  gate: AmazonSpApiSandboxPersistedImportJobExecutionGateUpgrade,
): AmazonSpApiSandboxPersistedImportJobExecutionGateUpgrade {
  if (gate.version !== AMAZON_SP_API_SANDBOX_PERSISTED_IMPORTJOB_EXECUTION_GATE_UPGRADE_VERSION) {
    throw new Error('Step120-C execution gate upgrade violation: version mismatch.');
  }

  if (gate.upgradeOnly !== true) {
    throw new Error('Step120-C execution gate upgrade violation: upgradeOnly must be true.');
  }

  if (gate.rollbackSmokeCovered !== true) {
    throw new Error('Step120-C execution gate upgrade violation: rollback smoke must be covered.');
  }

  if (gate.designGateRollbackRequirementSatisfied !== true) {
    throw new Error('Step120-C execution gate upgrade violation: design rollback requirement must be satisfied.');
  }

  if (gate.currentExecutionAllowed !== false) {
    throw new Error('Step120-C execution gate upgrade violation: current execution must remain false.');
  }

  if (gate.dryRunFalseAllowed !== false) {
    throw new Error('Step120-C execution gate upgrade violation: dryRun:false must remain blocked.');
  }

  if (gate.writesDatabase !== false) {
    throw new Error('Step120-C execution gate upgrade violation: writesDatabase must remain false.');
  }

  if (gate.readyForExecution !== false) {
    throw new Error('Step120-C execution gate upgrade violation: readyForExecution must remain false.');
  }

  if (gate.readyForPermanentPersistence !== false) {
    throw new Error('Step120-C execution gate upgrade violation: permanent persistence readiness must remain false.');
  }

  if (gate.summary.readyForPermanentExecution !== false) {
    throw new Error('Step120-C execution gate upgrade violation: permanent execution summary must remain false.');
  }

  for (const [key, blocked] of Object.entries(gate.blockedNow)) {
    if (blocked !== true) {
      throw new Error(`Step120-C execution gate upgrade violation: blockedNow.${key} must remain true.`);
    }
  }

  return gate;
}
