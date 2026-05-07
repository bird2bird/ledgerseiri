import {
  type AmazonSpApiSandboxPersistedImportJobExecutionGateUpgrade,
  assertAmazonSpApiSandboxPersistedImportJobExecutionGateUpgrade,
} from './amazon-sp-api-sandbox-persisted-importjob-execution-gate-upgrade.dto';

export const AMAZON_SP_API_SANDBOX_ROLLBACK_ONLY_SERVICE_METHOD_DESIGN_VERSION =
  'amazon-sp-api-sandbox-rollback-only-service-method-design-v1' as const;

export type AmazonSpApiSandboxRollbackOnlyServiceMethodDesignDecision =
  | 'DESIGN_ALLOWED_SERVICE_NOT_IMPLEMENTED'
  | 'INSUFFICIENT_EXECUTION_GATE'
  | 'BLOCKED_NOW';

export type AmazonSpApiSandboxRollbackOnlyServiceMethodDesign = {
  version: typeof AMAZON_SP_API_SANDBOX_ROLLBACK_ONLY_SERVICE_METHOD_DESIGN_VERSION;
  module: 'store-orders';
  sourceType: 'amazon-sp-api-sandbox';
  normalizedSourceType: 'AMAZON_ORDER_SP_API';

  decision: AmazonSpApiSandboxRollbackOnlyServiceMethodDesignDecision;
  designOnly: true;
  serviceMethodImplemented: false;
  serviceMethodMayBeDesigned: true;
  controllerMayCallServiceMethod: false;
  frontendMayCallServiceMethod: false;

  proposedServiceMethod: {
    name: 'rollbackOnlyPersistAmazonSpApiSandboxImportJob';
    visibility: 'internal-service-only';
    requiresInternalSandboxEnv: true;
    requiresRollbackOnly: true;
    requiresForceRollback: true;
    allowsPermanentCommit: false;
    allowsDryRunFalse: false;
    returnsRollbackVerification: true;
  };

  requiredArgs: {
    companyId: 'string';
    filename: 'string';
    aggregate: 'AmazonSpApiSandboxPlanningAggregate';
    executionGate: 'AmazonSpApiSandboxPersistedImportJobExecutionGateUpgrade';
    rollbackOnly: true;
    forceRollback: true;
  };

  plannedTransactionBehavior: {
    createImportJobInsideTransaction: true;
    createImportStagingRowsInsideTransaction: true;
    forceRollbackBeforeReturn: true;
    verifyNoImportJobLeak: true;
    verifyNoImportStagingRowLeak: true;
    verifyNoTransactionLeak: true;
    verifyNoInventoryMovementLeak: true;
  };

  outOfScope: {
    permanentImportJobPersistence: true;
    permanentImportStagingRowPersistence: true;
    transactionCommit: true;
    transactionOverwrite: true;
    inventoryMovementCreation: true;
    inventoryBalanceUpdate: true;
    controllerRoute: true;
    frontendRoute: true;
    realSpApiClient: true;
    oauth: true;
    tokenPersistence: true;
    schemaMigration: true;
  };

  currentBlocks: {
    currentExecutionAllowed: false;
    dryRunFalseAllowed: false;
    writesDatabasePermanently: false;
    readyForPermanentPersistence: false;
    readyForController: false;
    readyForFrontend: false;
  };

  sourceGate: AmazonSpApiSandboxPersistedImportJobExecutionGateUpgrade;

  summary: {
    rollbackSmokeCovered: true;
    readyForRollbackOnlyServiceMethodImplementation: true;
    readyForPermanentPersistence: false;
    readyForController: false;
    readyForFrontend: false;
  };
};

export function buildAmazonSpApiSandboxRollbackOnlyServiceMethodDesign(args: {
  executionGate: AmazonSpApiSandboxPersistedImportJobExecutionGateUpgrade;
}): AmazonSpApiSandboxRollbackOnlyServiceMethodDesign {
  const executionGate = assertAmazonSpApiSandboxPersistedImportJobExecutionGateUpgrade(
    args.executionGate,
  );

  const designAllowed =
    executionGate.decision === 'ROLLBACK_SMOKE_COVERED_BUT_EXECUTION_BLOCKED' &&
    executionGate.rollbackSmokeCovered === true &&
    executionGate.futurePhaseScope.mayDesignRollbackOnlyServiceMethod === true &&
    executionGate.currentExecutionAllowed === false &&
    executionGate.dryRunFalseAllowed === false &&
    executionGate.writesDatabase === false;

  return {
    version: AMAZON_SP_API_SANDBOX_ROLLBACK_ONLY_SERVICE_METHOD_DESIGN_VERSION,
    module: 'store-orders',
    sourceType: 'amazon-sp-api-sandbox',
    normalizedSourceType: 'AMAZON_ORDER_SP_API',

    decision: designAllowed ? 'DESIGN_ALLOWED_SERVICE_NOT_IMPLEMENTED' : 'INSUFFICIENT_EXECUTION_GATE',
    designOnly: true,
    serviceMethodImplemented: false,
    serviceMethodMayBeDesigned: true,
    controllerMayCallServiceMethod: false,
    frontendMayCallServiceMethod: false,

    proposedServiceMethod: {
      name: 'rollbackOnlyPersistAmazonSpApiSandboxImportJob',
      visibility: 'internal-service-only',
      requiresInternalSandboxEnv: true,
      requiresRollbackOnly: true,
      requiresForceRollback: true,
      allowsPermanentCommit: false,
      allowsDryRunFalse: false,
      returnsRollbackVerification: true,
    },

    requiredArgs: {
      companyId: 'string',
      filename: 'string',
      aggregate: 'AmazonSpApiSandboxPlanningAggregate',
      executionGate: 'AmazonSpApiSandboxPersistedImportJobExecutionGateUpgrade',
      rollbackOnly: true,
      forceRollback: true,
    },

    plannedTransactionBehavior: {
      createImportJobInsideTransaction: true,
      createImportStagingRowsInsideTransaction: true,
      forceRollbackBeforeReturn: true,
      verifyNoImportJobLeak: true,
      verifyNoImportStagingRowLeak: true,
      verifyNoTransactionLeak: true,
      verifyNoInventoryMovementLeak: true,
    },

    outOfScope: {
      permanentImportJobPersistence: true,
      permanentImportStagingRowPersistence: true,
      transactionCommit: true,
      transactionOverwrite: true,
      inventoryMovementCreation: true,
      inventoryBalanceUpdate: true,
      controllerRoute: true,
      frontendRoute: true,
      realSpApiClient: true,
      oauth: true,
      tokenPersistence: true,
      schemaMigration: true,
    },

    currentBlocks: {
      currentExecutionAllowed: false,
      dryRunFalseAllowed: false,
      writesDatabasePermanently: false,
      readyForPermanentPersistence: false,
      readyForController: false,
      readyForFrontend: false,
    },

    sourceGate: executionGate,

    summary: {
      rollbackSmokeCovered: true,
      readyForRollbackOnlyServiceMethodImplementation: true,
      readyForPermanentPersistence: false,
      readyForController: false,
      readyForFrontend: false,
    },
  };
}

export function assertAmazonSpApiSandboxRollbackOnlyServiceMethodDesign(
  design: AmazonSpApiSandboxRollbackOnlyServiceMethodDesign,
): AmazonSpApiSandboxRollbackOnlyServiceMethodDesign {
  if (design.version !== AMAZON_SP_API_SANDBOX_ROLLBACK_ONLY_SERVICE_METHOD_DESIGN_VERSION) {
    throw new Error('Step120-D rollback-only service method design violation: version mismatch.');
  }

  if (design.designOnly !== true) {
    throw new Error('Step120-D rollback-only service method design violation: designOnly must be true.');
  }

  if (design.serviceMethodImplemented !== false) {
    throw new Error('Step120-D rollback-only service method design violation: service method must not be implemented yet.');
  }

  if (design.controllerMayCallServiceMethod !== false) {
    throw new Error('Step120-D rollback-only service method design violation: controller must not call service method.');
  }

  if (design.frontendMayCallServiceMethod !== false) {
    throw new Error('Step120-D rollback-only service method design violation: frontend must not call service method.');
  }

  if (design.proposedServiceMethod.allowsPermanentCommit !== false) {
    throw new Error('Step120-D rollback-only service method design violation: permanent commit must remain false.');
  }

  if (design.proposedServiceMethod.allowsDryRunFalse !== false) {
    throw new Error('Step120-D rollback-only service method design violation: dryRun:false must remain false.');
  }

  if (design.currentBlocks.currentExecutionAllowed !== false) {
    throw new Error('Step120-D rollback-only service method design violation: current execution must remain false.');
  }

  if (design.currentBlocks.writesDatabasePermanently !== false) {
    throw new Error('Step120-D rollback-only service method design violation: permanent DB writes must remain false.');
  }

  if (design.summary.readyForPermanentPersistence !== false) {
    throw new Error('Step120-D rollback-only service method design violation: permanent persistence readiness must remain false.');
  }

  for (const [key, blocked] of Object.entries(design.outOfScope)) {
    if (blocked !== true) {
      throw new Error(`Step120-D rollback-only service method design violation: outOfScope.${key} must remain true.`);
    }
  }

  return design;
}
