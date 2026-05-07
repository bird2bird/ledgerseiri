import {
  type AmazonSpApiSandboxPermanentImportJobCommitCleanupSimulation,
  assertAmazonSpApiSandboxPermanentImportJobCommitCleanupSimulation,
} from './amazon-sp-api-sandbox-permanent-importjob-commit-cleanup-simulation.dto';

export const AMAZON_SP_API_SANDBOX_PERMANENT_IMPORTJOB_SERVICE_METHOD_DESIGN_VERSION =
  'amazon-sp-api-sandbox-permanent-importjob-service-method-design-v1' as const;

export type AmazonSpApiSandboxPermanentImportJobServiceMethodDesignDecision =
  | 'DESIGN_READY_IMPLEMENTATION_BLOCKED_BY_ENV_GATE'
  | 'COMMIT_CLEANUP_SIMULATION_NOT_READY'
  | 'BLOCKED_NOW';

export type AmazonSpApiSandboxPermanentImportJobServiceMethodDesign = {
  version: typeof AMAZON_SP_API_SANDBOX_PERMANENT_IMPORTJOB_SERVICE_METHOD_DESIGN_VERSION;
  module: 'store-orders';
  sourceType: 'amazon-sp-api-sandbox';
  normalizedSourceType: 'AMAZON_ORDER_SP_API';

  decision: AmazonSpApiSandboxPermanentImportJobServiceMethodDesignDecision;
  designOnly: true;
  serviceMethodName: 'persistAmazonSpApiSandboxImportJobOnly';
  serviceMethodImplementedNow: false;
  implementationAllowedNow: false;
  executionAllowedNow: false;
  controllerCallable: false;
  frontendCallable: false;

  sourceSimulation: AmazonSpApiSandboxPermanentImportJobCommitCleanupSimulation;

  requiredMethodArgs: {
    companyId: 'string';
    filename: 'string';
    aggregate: 'AmazonSpApiSandboxPlanningAggregate';
    persistenceMode: 'importjob-and-staging-only';
    requireEnvGate: 'AMAZON_SP_API_SANDBOX_IMPORTJOB_PERSISTENCE_ENABLED=true';
    allowTransactions: false;
    allowInventory: false;
    allowRealSpApi: false;
    allowTokenPersistence: false;
  };

  requiredGuards: {
    internalSandboxEnv: true;
    futurePersistenceEnvGate: true;
    duplicateFilenamePrecheck: true;
    aggregatePlanOnlyRequired: true;
    readinessPlanRequired: true;
    commitCleanupSimulationCovered: true;
    controllerDisabled: true;
    frontendDisabled: true;
  };

  plannedBehavior: {
    createImportJob: true;
    createImportStagingRows: true;
    returnCreatedImportJobId: true;
    returnCreatedStagingRowIds: true;
    statusInitial: 'PENDING';
    targetEntityIdMustRemainNull: true;
    transactionCommit: false;
    transactionOverwrite: false;
    inventoryMovementCreate: false;
    inventoryBalanceUpdate: false;
    realSpApiCall: false;
    tokenPersistence: false;
  };

  cleanupPolicyForFutureSmoke: {
    serviceMethodSmokeMustCleanup: true;
    deleteImportStagingRowsByImportJobId: true;
    deleteImportJobById: true;
    verifyLeakZero: true;
  };

  blockedNow: {
    implementation: true;
    execution: true;
    dryRunFalse: true;
    transactions: true;
    inventory: true;
    controller: true;
    frontend: true;
    realSpApi: true;
    oauth: true;
    tokenPersistence: true;
    schemaMigration: true;
  };

  summary: {
    readyForServiceImplementationBehindEnvGate: true;
    readyForExecution: false;
    readyForController: false;
    readyForFrontend: false;
  };
};

export function buildAmazonSpApiSandboxPermanentImportJobServiceMethodDesign(args: {
  simulation: AmazonSpApiSandboxPermanentImportJobCommitCleanupSimulation;
}): AmazonSpApiSandboxPermanentImportJobServiceMethodDesign {
  const simulation = assertAmazonSpApiSandboxPermanentImportJobCommitCleanupSimulation(
    args.simulation,
  );

  const readyForDesign =
    simulation.decision === 'COMMIT_CLEANUP_SIMULATION_ALLOWED_SERVICE_NOT_IMPLEMENTED' &&
    simulation.summary.readyForPermanentServiceMethodDesign === true &&
    simulation.permanentServiceImplementationAllowedNow === false &&
    simulation.permanentExecutionAllowedNow === false &&
    simulation.writesDatabaseAfterCleanup === false &&
    simulation.allowedSimulationWriteScope.importJobCreate === true &&
    simulation.allowedSimulationWriteScope.importStagingRowCreate === true &&
    simulation.allowedSimulationWriteScope.transactionCreate === false &&
    simulation.allowedSimulationWriteScope.inventoryMovementCreate === false;

  return {
    version: AMAZON_SP_API_SANDBOX_PERMANENT_IMPORTJOB_SERVICE_METHOD_DESIGN_VERSION,
    module: 'store-orders',
    sourceType: 'amazon-sp-api-sandbox',
    normalizedSourceType: 'AMAZON_ORDER_SP_API',

    decision: readyForDesign
      ? 'DESIGN_READY_IMPLEMENTATION_BLOCKED_BY_ENV_GATE'
      : 'COMMIT_CLEANUP_SIMULATION_NOT_READY',
    designOnly: true,
    serviceMethodName: 'persistAmazonSpApiSandboxImportJobOnly',
    serviceMethodImplementedNow: false,
    implementationAllowedNow: false,
    executionAllowedNow: false,
    controllerCallable: false,
    frontendCallable: false,

    sourceSimulation: simulation,

    requiredMethodArgs: {
      companyId: 'string',
      filename: 'string',
      aggregate: 'AmazonSpApiSandboxPlanningAggregate',
      persistenceMode: 'importjob-and-staging-only',
      requireEnvGate: 'AMAZON_SP_API_SANDBOX_IMPORTJOB_PERSISTENCE_ENABLED=true',
      allowTransactions: false,
      allowInventory: false,
      allowRealSpApi: false,
      allowTokenPersistence: false,
    },

    requiredGuards: {
      internalSandboxEnv: true,
      futurePersistenceEnvGate: true,
      duplicateFilenamePrecheck: true,
      aggregatePlanOnlyRequired: true,
      readinessPlanRequired: true,
      commitCleanupSimulationCovered: true,
      controllerDisabled: true,
      frontendDisabled: true,
    },

    plannedBehavior: {
      createImportJob: true,
      createImportStagingRows: true,
      returnCreatedImportJobId: true,
      returnCreatedStagingRowIds: true,
      statusInitial: 'PENDING',
      targetEntityIdMustRemainNull: true,
      transactionCommit: false,
      transactionOverwrite: false,
      inventoryMovementCreate: false,
      inventoryBalanceUpdate: false,
      realSpApiCall: false,
      tokenPersistence: false,
    },

    cleanupPolicyForFutureSmoke: {
      serviceMethodSmokeMustCleanup: true,
      deleteImportStagingRowsByImportJobId: true,
      deleteImportJobById: true,
      verifyLeakZero: true,
    },

    blockedNow: {
      implementation: true,
      execution: true,
      dryRunFalse: true,
      transactions: true,
      inventory: true,
      controller: true,
      frontend: true,
      realSpApi: true,
      oauth: true,
      tokenPersistence: true,
      schemaMigration: true,
    },

    summary: {
      readyForServiceImplementationBehindEnvGate: true,
      readyForExecution: false,
      readyForController: false,
      readyForFrontend: false,
    },
  };
}

export function assertAmazonSpApiSandboxPermanentImportJobServiceMethodDesign(
  design: AmazonSpApiSandboxPermanentImportJobServiceMethodDesign,
): AmazonSpApiSandboxPermanentImportJobServiceMethodDesign {
  if (design.version !== AMAZON_SP_API_SANDBOX_PERMANENT_IMPORTJOB_SERVICE_METHOD_DESIGN_VERSION) {
    throw new Error('Step121-D permanent service method design violation: version mismatch.');
  }

  if (design.designOnly !== true) {
    throw new Error('Step121-D permanent service method design violation: designOnly must be true.');
  }

  if (design.serviceMethodImplementedNow !== false) {
    throw new Error('Step121-D permanent service method design violation: service method must not be implemented now.');
  }

  if (design.implementationAllowedNow !== false || design.executionAllowedNow !== false) {
    throw new Error('Step121-D permanent service method design violation: implementation/execution must remain blocked.');
  }

  if (design.controllerCallable !== false || design.frontendCallable !== false) {
    throw new Error('Step121-D permanent service method design violation: controller/frontend must remain false.');
  }

  if (
    design.plannedBehavior.transactionCommit !== false ||
    design.plannedBehavior.inventoryMovementCreate !== false ||
    design.plannedBehavior.realSpApiCall !== false ||
    design.plannedBehavior.tokenPersistence !== false
  ) {
    throw new Error('Step121-D permanent service method design violation: out-of-scope behavior must remain false.');
  }

  for (const [key, blocked] of Object.entries(design.blockedNow)) {
    if (blocked !== true) {
      throw new Error(`Step121-D permanent service method design violation: blockedNow.${key} must remain true.`);
    }
  }

  return design;
}
