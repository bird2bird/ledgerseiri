import {
  type AmazonSpApiSandboxPersistedImportJobExecutionGateUpgrade,
  assertAmazonSpApiSandboxPersistedImportJobExecutionGateUpgrade,
} from './amazon-sp-api-sandbox-persisted-importjob-execution-gate-upgrade.dto';

export const AMAZON_SP_API_SANDBOX_PERMANENT_IMPORTJOB_READINESS_GATE_VERSION =
  'amazon-sp-api-sandbox-permanent-importjob-readiness-gate-v1' as const;

export type AmazonSpApiSandboxPermanentImportJobReadinessDecision =
  | 'READY_FOR_PERMANENT_IMPORTJOB_DESIGN_REVIEW_ONLY'
  | 'INSUFFICIENT_ROLLBACK_ONLY_SERVICE_COVERAGE'
  | 'BLOCKED_NOW';

export type AmazonSpApiSandboxPermanentImportJobReadinessCheckKey =
  | 'rollback-only-service-method-implemented'
  | 'rollback-only-service-method-controller-disabled'
  | 'rollback-only-service-method-force-rollback-covered'
  | 'rollback-smoke-covered'
  | 'execution-gate-permanent-execution-blocked'
  | 'schema-existing-importjob-compatible'
  | 'schema-existing-importstagingrow-compatible'
  | 'transaction-commit-remains-blocked'
  | 'inventory-movement-remains-blocked'
  | 'real-sp-api-remains-disabled'
  | 'oauth-token-remains-disabled'
  | 'dry-run-false-remains-blocked';

export type AmazonSpApiSandboxPermanentImportJobReadinessCheck = {
  key: AmazonSpApiSandboxPermanentImportJobReadinessCheckKey;
  passed: boolean;
  blocking: boolean;
  reason: string;
};

export type AmazonSpApiSandboxPermanentImportJobReadinessGate = {
  version: typeof AMAZON_SP_API_SANDBOX_PERMANENT_IMPORTJOB_READINESS_GATE_VERSION;
  module: 'store-orders';
  sourceType: 'amazon-sp-api-sandbox';
  normalizedSourceType: 'AMAZON_ORDER_SP_API';

  decision: AmazonSpApiSandboxPermanentImportJobReadinessDecision;
  readinessOnly: true;
  currentExecutionAllowed: false;
  dryRunFalseAllowed: false;
  writesDatabase: false;
  readyForPermanentPersistenceReview: true;
  readyForPermanentExecution: false;

  sourceExecutionGate: AmazonSpApiSandboxPersistedImportJobExecutionGateUpgrade;

  futurePhaseScope: {
    mayDesignPermanentImportJobPersistence: true;
    mayDesignPermanentImportStagingRowPersistence: true;
    mayDesignPermanentPersistenceEnvGate: true;
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
    mayModifySchema: false;
  };

  requiredFutureEnvGate: {
    name: 'AMAZON_SP_API_SANDBOX_IMPORTJOB_PERSISTENCE_ENABLED';
    requiredValueForFutureExecution: 'true';
    currentDefault: 'false';
    requiredBeforeAnyPermanentWrite: true;
  };

  allowedFuturePermanentWriteScope: {
    importJobCreate: true;
    importStagingRowCreate: true;
    transactionCreate: false;
    transactionUpdate: false;
    transactionOverwrite: false;
    inventoryMovementCreate: false;
    inventoryBalanceUpdate: false;
    tokenCreate: false;
    credentialCreate: false;
  };

  checks: AmazonSpApiSandboxPermanentImportJobReadinessCheck[];

  summary: {
    totalChecks: number;
    passedChecks: number;
    blockingChecks: number;
    rollbackOnlyCoverageConfirmed: true;
    readyForPermanentImportJobPersistenceDesign: true;
    readyForPermanentImportJobPersistenceExecution: false;
    readyForController: false;
    readyForFrontend: false;
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
    schemaMigration: true;
  };
};

function check(args: {
  key: AmazonSpApiSandboxPermanentImportJobReadinessCheckKey;
  passed: boolean;
  reason: string;
}): AmazonSpApiSandboxPermanentImportJobReadinessCheck {
  return {
    key: args.key,
    passed: args.passed,
    blocking: !args.passed,
    reason: args.reason,
  };
}

export function buildAmazonSpApiSandboxPermanentImportJobReadinessGate(args: {
  executionGate: AmazonSpApiSandboxPersistedImportJobExecutionGateUpgrade;
  serviceMethodImplemented: boolean;
  controllerDisabled: boolean;
  rollbackOnlyGuarded: boolean;
  forceRollbackGuarded: boolean;
  permanentWriteFalseGuarded: boolean;
}): AmazonSpApiSandboxPermanentImportJobReadinessGate {
  const executionGate = assertAmazonSpApiSandboxPersistedImportJobExecutionGateUpgrade(
    args.executionGate,
  );

  const checks: AmazonSpApiSandboxPermanentImportJobReadinessCheck[] = [
    check({
      key: 'rollback-only-service-method-implemented',
      passed: args.serviceMethodImplemented === true,
      reason: 'rollbackOnlyPersistAmazonSpApiSandboxImportJob exists in ImportsService.',
    }),
    check({
      key: 'rollback-only-service-method-controller-disabled',
      passed: args.controllerDisabled === true,
      reason: 'Controller must not expose rollback-only service method.',
    }),
    check({
      key: 'rollback-only-service-method-force-rollback-covered',
      passed:
        args.rollbackOnlyGuarded === true &&
        args.forceRollbackGuarded === true &&
        args.permanentWriteFalseGuarded === true,
      reason: 'Rollback-only service method requires rollbackOnly=true, forceRollback=true, and returns permanent writes as false.',
    }),
    check({
      key: 'rollback-smoke-covered',
      passed: executionGate.rollbackSmokeCovered === true,
      reason: 'Step120-B/C rollback coverage is available.',
    }),
    check({
      key: 'execution-gate-permanent-execution-blocked',
      passed:
        executionGate.currentExecutionAllowed === false &&
        executionGate.readyForPermanentPersistence === false &&
        executionGate.summary.readyForPermanentExecution === false,
      reason: 'Execution gate still blocks permanent persistence.',
    }),
    check({
      key: 'schema-existing-importjob-compatible',
      passed: true,
      reason: 'Future Step121 design must use existing ImportJob model only.',
    }),
    check({
      key: 'schema-existing-importstagingrow-compatible',
      passed: true,
      reason: 'Future Step121 design must use existing ImportStagingRow model only.',
    }),
    check({
      key: 'transaction-commit-remains-blocked',
      passed: executionGate.futurePhaseScope.mayCommitTransactions === false,
      reason: 'Transaction commit remains blocked.',
    }),
    check({
      key: 'inventory-movement-remains-blocked',
      passed: executionGate.futurePhaseScope.mayCreateInventoryMovement === false,
      reason: 'Inventory movement remains blocked.',
    }),
    check({
      key: 'real-sp-api-remains-disabled',
      passed: executionGate.futurePhaseScope.mayCallRealSpApi === false,
      reason: 'Real SP-API client remains disabled.',
    }),
    check({
      key: 'oauth-token-remains-disabled',
      passed:
        executionGate.futurePhaseScope.mayUseOAuth === false &&
        executionGate.futurePhaseScope.mayPersistToken === false,
      reason: 'OAuth and token persistence remain disabled.',
    }),
    check({
      key: 'dry-run-false-remains-blocked',
      passed:
        executionGate.dryRunFalseAllowed === false &&
        executionGate.futurePhaseScope.mayAllowDryRunFalseNow === false,
      reason: 'dryRun:false remains blocked.',
    }),
  ];

  const passedChecks = checks.filter((item) => item.passed).length;
  const blockingChecks = checks.filter((item) => item.blocking).length;
  const readyForReview = blockingChecks === 0;

  return {
    version: AMAZON_SP_API_SANDBOX_PERMANENT_IMPORTJOB_READINESS_GATE_VERSION,
    module: 'store-orders',
    sourceType: 'amazon-sp-api-sandbox',
    normalizedSourceType: 'AMAZON_ORDER_SP_API',

    decision: readyForReview
      ? 'READY_FOR_PERMANENT_IMPORTJOB_DESIGN_REVIEW_ONLY'
      : 'INSUFFICIENT_ROLLBACK_ONLY_SERVICE_COVERAGE',
    readinessOnly: true,
    currentExecutionAllowed: false,
    dryRunFalseAllowed: false,
    writesDatabase: false,
    readyForPermanentPersistenceReview: true,
    readyForPermanentExecution: false,

    sourceExecutionGate: executionGate,

    futurePhaseScope: {
      mayDesignPermanentImportJobPersistence: true,
      mayDesignPermanentImportStagingRowPersistence: true,
      mayDesignPermanentPersistenceEnvGate: true,
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
      mayModifySchema: false,
    },

    requiredFutureEnvGate: {
      name: 'AMAZON_SP_API_SANDBOX_IMPORTJOB_PERSISTENCE_ENABLED',
      requiredValueForFutureExecution: 'true',
      currentDefault: 'false',
      requiredBeforeAnyPermanentWrite: true,
    },

    allowedFuturePermanentWriteScope: {
      importJobCreate: true,
      importStagingRowCreate: true,
      transactionCreate: false,
      transactionUpdate: false,
      transactionOverwrite: false,
      inventoryMovementCreate: false,
      inventoryBalanceUpdate: false,
      tokenCreate: false,
      credentialCreate: false,
    },

    checks,

    summary: {
      totalChecks: checks.length,
      passedChecks,
      blockingChecks,
      rollbackOnlyCoverageConfirmed: true,
      readyForPermanentImportJobPersistenceDesign: true,
      readyForPermanentImportJobPersistenceExecution: false,
      readyForController: false,
      readyForFrontend: false,
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
      schemaMigration: true,
    },
  };
}

export function assertAmazonSpApiSandboxPermanentImportJobReadinessGate(
  gate: AmazonSpApiSandboxPermanentImportJobReadinessGate,
): AmazonSpApiSandboxPermanentImportJobReadinessGate {
  if (gate.version !== AMAZON_SP_API_SANDBOX_PERMANENT_IMPORTJOB_READINESS_GATE_VERSION) {
    throw new Error('Step121-A permanent ImportJob readiness gate violation: version mismatch.');
  }

  if (gate.readinessOnly !== true) {
    throw new Error('Step121-A permanent ImportJob readiness gate violation: readinessOnly must be true.');
  }

  if (gate.currentExecutionAllowed !== false) {
    throw new Error('Step121-A permanent ImportJob readiness gate violation: current execution must remain false.');
  }

  if (gate.dryRunFalseAllowed !== false) {
    throw new Error('Step121-A permanent ImportJob readiness gate violation: dryRun:false must remain blocked.');
  }

  if (gate.writesDatabase !== false) {
    throw new Error('Step121-A permanent ImportJob readiness gate violation: writesDatabase must remain false.');
  }

  if (gate.readyForPermanentPersistenceReview !== true) {
    throw new Error('Step121-A permanent ImportJob readiness gate violation: review readiness must be true.');
  }

  if (gate.readyForPermanentExecution !== false) {
    throw new Error('Step121-A permanent ImportJob readiness gate violation: permanent execution must remain false.');
  }

  if (gate.summary.readyForPermanentImportJobPersistenceExecution !== false) {
    throw new Error('Step121-A permanent ImportJob readiness gate violation: summary execution must remain false.');
  }

  for (const [key, blocked] of Object.entries(gate.blockedNow)) {
    if (blocked !== true) {
      throw new Error(`Step121-A permanent ImportJob readiness gate violation: blockedNow.${key} must remain true.`);
    }
  }

  return gate;
}
