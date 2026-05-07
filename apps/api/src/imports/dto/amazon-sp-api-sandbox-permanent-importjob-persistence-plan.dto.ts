import {
  type AmazonSpApiSandboxPermanentImportJobReadinessGate,
  assertAmazonSpApiSandboxPermanentImportJobReadinessGate,
} from './amazon-sp-api-sandbox-permanent-importjob-readiness-gate.dto';

export const AMAZON_SP_API_SANDBOX_PERMANENT_IMPORTJOB_PERSISTENCE_PLAN_VERSION =
  'amazon-sp-api-sandbox-permanent-importjob-persistence-plan-v1' as const;

export type AmazonSpApiSandboxPermanentImportJobPersistencePlanDecision =
  | 'PLAN_READY_IMPLEMENTATION_NOT_ALLOWED'
  | 'READINESS_GATE_NOT_SATISFIED'
  | 'BLOCKED_NOW';

export type AmazonSpApiSandboxPermanentImportJobPersistencePlan = {
  version: typeof AMAZON_SP_API_SANDBOX_PERMANENT_IMPORTJOB_PERSISTENCE_PLAN_VERSION;
  module: 'store-orders';
  sourceType: 'amazon-sp-api-sandbox';
  normalizedSourceType: 'AMAZON_ORDER_SP_API';

  decision: AmazonSpApiSandboxPermanentImportJobPersistencePlanDecision;
  planOnly: true;
  implementationAllowedNow: false;
  executionAllowedNow: false;
  dryRunFalseAllowed: false;
  writesDatabase: false;

  sourceReadinessGate: AmazonSpApiSandboxPermanentImportJobReadinessGate;

  plannedServiceMethod: {
    name: 'persistAmazonSpApiSandboxImportJobOnly';
    visibility: 'internal-service-only';
    requiresInternalSandboxEnv: true;
    requiresFutureEnvGate: 'AMAZON_SP_API_SANDBOX_IMPORTJOB_PERSISTENCE_ENABLED';
    requiresFutureEnvGateValue: 'true';
    requiresExplicitPersistenceMode: 'importjob-and-staging-only';
    controllerCallable: false;
    frontendCallable: false;
  };

  plannedWriteScope: {
    importJob: {
      create: true;
      update: false;
      delete: false;
      statusInitial: 'PENDING';
      successRowsInitial: 0;
      failedRowsInitial: 0;
      importedAtInitial: null;
      useExistingSchemaOnly: true;
      allowedMetadataColumn: 'conflictMonthsJson';
    };
    importStagingRow: {
      create: true;
      update: false;
      delete: false;
      module: 'store-orders';
      useExistingSchemaOnly: true;
      requireCompanyId: true;
      requireImportJobId: true;
      requireNormalizedPayloadJson: true;
      requireRawPayloadJson: true;
      matchStatusAllowed: readonly ['new', 'conflict_review_required'];
    };
  };

  explicitlyOutOfScope: {
    transactionCreate: true;
    transactionUpdate: true;
    transactionOverwrite: true;
    inventoryMovementCreate: true;
    inventoryBalanceUpdate: true;
    controllerRoute: true;
    frontendRoute: true;
    realSpApiClient: true;
    oauth: true;
    tokenPersistence: true;
    credentialPersistence: true;
    schemaMigration: true;
  };

  futureExecutionPreconditions: {
    envGateEnabled: false;
    cleanupSmokeRequiredBeforeServiceImplementation: true;
    duplicateFilenamePolicyRequired: true;
    dedupeHashPolicyRequired: true;
    importCenterVisibilityPolicyRequired: true;
    rollbackPlanRequired: true;
  };

  blockedNow: {
    permanentImportJobPersistence: true;
    permanentImportStagingRowPersistence: true;
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
    readyForCommitCleanupSimulationDesign: true;
    readyForPermanentServiceImplementation: false;
    readyForPermanentExecution: false;
    readyForController: false;
    readyForFrontend: false;
  };
};

export function buildAmazonSpApiSandboxPermanentImportJobPersistencePlan(args: {
  readinessGate: AmazonSpApiSandboxPermanentImportJobReadinessGate;
}): AmazonSpApiSandboxPermanentImportJobPersistencePlan {
  const readinessGate = assertAmazonSpApiSandboxPermanentImportJobReadinessGate(
    args.readinessGate,
  );

  const readyForPlan =
    readinessGate.decision === 'READY_FOR_PERMANENT_IMPORTJOB_DESIGN_REVIEW_ONLY' &&
    readinessGate.readyForPermanentPersistenceReview === true &&
    readinessGate.readyForPermanentExecution === false &&
    readinessGate.writesDatabase === false &&
    readinessGate.futurePhaseScope.mayDesignPermanentImportJobPersistence === true &&
    readinessGate.futurePhaseScope.mayExecutePermanentImportJobPersistenceNow === false &&
    readinessGate.allowedFuturePermanentWriteScope.importJobCreate === true &&
    readinessGate.allowedFuturePermanentWriteScope.importStagingRowCreate === true &&
    readinessGate.allowedFuturePermanentWriteScope.transactionCreate === false &&
    readinessGate.allowedFuturePermanentWriteScope.inventoryMovementCreate === false;

  return {
    version: AMAZON_SP_API_SANDBOX_PERMANENT_IMPORTJOB_PERSISTENCE_PLAN_VERSION,
    module: 'store-orders',
    sourceType: 'amazon-sp-api-sandbox',
    normalizedSourceType: 'AMAZON_ORDER_SP_API',

    decision: readyForPlan ? 'PLAN_READY_IMPLEMENTATION_NOT_ALLOWED' : 'READINESS_GATE_NOT_SATISFIED',
    planOnly: true,
    implementationAllowedNow: false,
    executionAllowedNow: false,
    dryRunFalseAllowed: false,
    writesDatabase: false,

    sourceReadinessGate: readinessGate,

    plannedServiceMethod: {
      name: 'persistAmazonSpApiSandboxImportJobOnly',
      visibility: 'internal-service-only',
      requiresInternalSandboxEnv: true,
      requiresFutureEnvGate: 'AMAZON_SP_API_SANDBOX_IMPORTJOB_PERSISTENCE_ENABLED',
      requiresFutureEnvGateValue: 'true',
      requiresExplicitPersistenceMode: 'importjob-and-staging-only',
      controllerCallable: false,
      frontendCallable: false,
    },

    plannedWriteScope: {
      importJob: {
        create: true,
        update: false,
        delete: false,
        statusInitial: 'PENDING',
        successRowsInitial: 0,
        failedRowsInitial: 0,
        importedAtInitial: null,
        useExistingSchemaOnly: true,
        allowedMetadataColumn: 'conflictMonthsJson',
      },
      importStagingRow: {
        create: true,
        update: false,
        delete: false,
        module: 'store-orders',
        useExistingSchemaOnly: true,
        requireCompanyId: true,
        requireImportJobId: true,
        requireNormalizedPayloadJson: true,
        requireRawPayloadJson: true,
        matchStatusAllowed: ['new', 'conflict_review_required'],
      },
    },

    explicitlyOutOfScope: {
      transactionCreate: true,
      transactionUpdate: true,
      transactionOverwrite: true,
      inventoryMovementCreate: true,
      inventoryBalanceUpdate: true,
      controllerRoute: true,
      frontendRoute: true,
      realSpApiClient: true,
      oauth: true,
      tokenPersistence: true,
      credentialPersistence: true,
      schemaMigration: true,
    },

    futureExecutionPreconditions: {
      envGateEnabled: false,
      cleanupSmokeRequiredBeforeServiceImplementation: true,
      duplicateFilenamePolicyRequired: true,
      dedupeHashPolicyRequired: true,
      importCenterVisibilityPolicyRequired: true,
      rollbackPlanRequired: true,
    },

    blockedNow: {
      permanentImportJobPersistence: true,
      permanentImportStagingRowPersistence: true,
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
      readyForCommitCleanupSimulationDesign: true,
      readyForPermanentServiceImplementation: false,
      readyForPermanentExecution: false,
      readyForController: false,
      readyForFrontend: false,
    },
  };
}

export function assertAmazonSpApiSandboxPermanentImportJobPersistencePlan(
  plan: AmazonSpApiSandboxPermanentImportJobPersistencePlan,
): AmazonSpApiSandboxPermanentImportJobPersistencePlan {
  if (plan.version !== AMAZON_SP_API_SANDBOX_PERMANENT_IMPORTJOB_PERSISTENCE_PLAN_VERSION) {
    throw new Error('Step121-B permanent ImportJob persistence plan violation: version mismatch.');
  }

  if (plan.planOnly !== true) {
    throw new Error('Step121-B permanent ImportJob persistence plan violation: planOnly must be true.');
  }

  if (plan.implementationAllowedNow !== false) {
    throw new Error('Step121-B permanent ImportJob persistence plan violation: implementation must not be allowed yet.');
  }

  if (plan.executionAllowedNow !== false) {
    throw new Error('Step121-B permanent ImportJob persistence plan violation: execution must not be allowed yet.');
  }

  if (plan.dryRunFalseAllowed !== false) {
    throw new Error('Step121-B permanent ImportJob persistence plan violation: dryRun:false must remain blocked.');
  }

  if (plan.writesDatabase !== false) {
    throw new Error('Step121-B permanent ImportJob persistence plan violation: writesDatabase must remain false.');
  }

  if (plan.plannedServiceMethod.controllerCallable !== false) {
    throw new Error('Step121-B permanent ImportJob persistence plan violation: controllerCallable must be false.');
  }

  if (plan.plannedServiceMethod.frontendCallable !== false) {
    throw new Error('Step121-B permanent ImportJob persistence plan violation: frontendCallable must be false.');
  }

  if (plan.summary.readyForPermanentServiceImplementation !== false) {
    throw new Error('Step121-B permanent ImportJob persistence plan violation: permanent service implementation readiness must be false.');
  }

  if (plan.summary.readyForPermanentExecution !== false) {
    throw new Error('Step121-B permanent ImportJob persistence plan violation: permanent execution readiness must be false.');
  }

  for (const [key, blocked] of Object.entries(plan.blockedNow)) {
    if (blocked !== true) {
      throw new Error(`Step121-B permanent ImportJob persistence plan violation: blockedNow.${key} must remain true.`);
    }
  }

  return plan;
}
