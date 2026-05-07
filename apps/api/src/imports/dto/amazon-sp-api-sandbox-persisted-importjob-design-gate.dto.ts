import {
  type AmazonSpApiSandboxPlanningAggregate,
  assertAmazonSpApiSandboxPlanningAggregate,
} from './amazon-sp-api-sandbox-planning-aggregate.dto';

export const AMAZON_SP_API_SANDBOX_PERSISTED_IMPORTJOB_DESIGN_GATE_VERSION =
  'amazon-sp-api-sandbox-persisted-importjob-design-gate-v1' as const;

export type AmazonSpApiSandboxPersistedImportJobGateDecision =
  | 'BLOCKED_NOW'
  | 'DESIGN_READY_FOR_REVIEW_ONLY'
  | 'INSUFFICIENT_PLAN';

export type AmazonSpApiSandboxPersistedImportJobGateCheckKey =
  | 'aggregate-plan-only-confirmed'
  | 'importjob-plan-exists'
  | 'staging-row-plan-exists'
  | 'dry-run-false-remains-blocked'
  | 'controller-remains-disabled'
  | 'frontend-remains-disabled'
  | 'transaction-overwrite-remains-blocked'
  | 'inventory-compensation-remains-blocked'
  | 'real-sp-api-remains-disabled'
  | 'oauth-token-remains-disabled'
  | 'schema-migration-not-required'
  | 'importjob-existing-schema-compatible'
  | 'staging-row-existing-schema-compatible'
  | 'rollback-smoke-required';

export type AmazonSpApiSandboxPersistedImportJobGateCheck = {
  key: AmazonSpApiSandboxPersistedImportJobGateCheckKey;
  passed: boolean;
  blocking: boolean;
  reason: string;
};

export type AmazonSpApiSandboxPersistedImportJobDesignGate = {
  version: typeof AMAZON_SP_API_SANDBOX_PERSISTED_IMPORTJOB_DESIGN_GATE_VERSION;
  module: 'store-orders';
  sourceType: 'amazon-sp-api-sandbox';
  normalizedSourceType: 'AMAZON_ORDER_SP_API';

  decision: AmazonSpApiSandboxPersistedImportJobGateDecision;
  designOnly: true;
  currentExecutionAllowed: false;
  dryRunFalseAllowed: false;
  writesDatabase: false;

  futurePhaseScope: {
    mayDesignImportJobPersistence: true;
    mayDesignImportStagingRowPersistence: true;
    mayExecuteImportJobPersistenceNow: false;
    mayExecuteImportStagingRowPersistenceNow: false;
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

  plannedPersistenceShape: {
    importJob: {
      domain: 'store-orders';
      module: 'store-orders';
      sourceType: 'amazon-sp-api-sandbox';
      status: 'PENDING';
      totalRowsFromPlan: number;
      successRowsInitial: 0;
      failedRowsInitial: 0;
      importedAtInitial: null;
      fileMonthsJsonFromPlan: string[];
      dataJsonRequired: true;
      dataJsonMustInclude: readonly [
        'planningAggregateVersion',
        'sourceType',
        'normalizedSourceType',
        'dryRunOnly',
        'planOnly',
        'controllerDisabled',
        'transactionCommitDisabled',
        'inventoryCommitDisabled',
      ];
    };
    importStagingRow: {
      module: 'store-orders';
      rowCountFromPlan: number;
      normalizedPayloadJsonRequired: true;
      rawPayloadJsonRequired: true;
      matchStatusAllowed: readonly ['new', 'conflict_review_required'];
      mustIncludeCanonicalDedupeKey: true;
      mustIncludePlanOnlyMarker: true;
      mustNotCreateTransaction: true;
      mustNotCreateInventoryMovement: true;
    };
  };

  checks: AmazonSpApiSandboxPersistedImportJobGateCheck[];

  summary: {
    totalChecks: number;
    passedChecks: number;
    blockingChecks: number;
    aggregatePreviewRows: number;
    plannedImportJobRows: number;
    plannedStagingRows: number;
    readyForImplementationReview: boolean;
    readyForExecution: false;
  };

  blockedNow: {
    dryRunFalse: true;
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

  warnings: string[];
};

function check(args: {
  key: AmazonSpApiSandboxPersistedImportJobGateCheckKey;
  passed: boolean;
  reason: string;
}): AmazonSpApiSandboxPersistedImportJobGateCheck {
  return {
    key: args.key,
    passed: args.passed,
    blocking: !args.passed,
    reason: args.reason,
  };
}

export function buildAmazonSpApiSandboxPersistedImportJobDesignGate(args: {
  aggregate: AmazonSpApiSandboxPlanningAggregate;
}): AmazonSpApiSandboxPersistedImportJobDesignGate {
  const aggregate = assertAmazonSpApiSandboxPlanningAggregate(args.aggregate);
  const importJobPlan = aggregate.importJobPlan;
  const readiness = aggregate.readinessMatrix;

  const checks: AmazonSpApiSandboxPersistedImportJobGateCheck[] = [
    check({
      key: 'aggregate-plan-only-confirmed',
      passed:
        aggregate.planOnly === true &&
        aggregate.writesDatabase === false &&
        aggregate.currentExecutionAllowed === false,
      reason: 'Aggregate remains plan-only and writes no database rows.',
    }),
    check({
      key: 'importjob-plan-exists',
      passed: importJobPlan.plannedImportJob.totalRows === aggregate.previewRows.length,
      reason: 'Staged ImportJob plan exists and matches preview row count.',
    }),
    check({
      key: 'staging-row-plan-exists',
      passed: importJobPlan.plannedStagingRows.length === aggregate.previewRows.length,
      reason: 'Staged ImportStagingRow plan exists and matches preview row count.',
    }),
    check({
      key: 'dry-run-false-remains-blocked',
      passed:
        aggregate.dryRunFalseAllowed === false &&
        readiness.dryRunFalseAllowed === false,
      reason: 'dryRun:false remains blocked by current service contract.',
    }),
    check({
      key: 'controller-remains-disabled',
      passed: aggregate.summary.mayOpenController === false,
      reason: 'No controller route is allowed.',
    }),
    check({
      key: 'frontend-remains-disabled',
      passed: aggregate.summary.mayOpenFrontend === false,
      reason: 'No frontend route is allowed.',
    }),
    check({
      key: 'transaction-overwrite-remains-blocked',
      passed:
        aggregate.summary.mayOverwriteTransaction === false &&
        aggregate.summary.mayPersistStagingRows === false,
      reason: 'Transaction commit/overwrite remains out of scope for persisted ImportJob design.',
    }),
    check({
      key: 'inventory-compensation-remains-blocked',
      passed: aggregate.summary.mayCreateInventoryCompensation === false,
      reason: 'Inventory compensation remains out of scope for persisted ImportJob design.',
    }),
    check({
      key: 'real-sp-api-remains-disabled',
      passed: aggregate.summary.mayCallRealSpApi === false,
      reason: 'Real SP-API remains disabled.',
    }),
    check({
      key: 'oauth-token-remains-disabled',
      passed: aggregate.summary.mayPersistToken === false,
      reason: 'OAuth/token persistence remains disabled.',
    }),
    check({
      key: 'schema-migration-not-required',
      passed: true,
      reason: 'Step120-A must use existing ImportJob and ImportStagingRow models only.',
    }),
    check({
      key: 'importjob-existing-schema-compatible',
      passed:
        importJobPlan.plannedImportJob.domain === 'store-orders' &&
        importJobPlan.plannedImportJob.module === 'store-orders' &&
        importJobPlan.plannedImportJob.status === 'PENDING',
      reason: 'Planned ImportJob shape is compatible with existing ImportJob semantics.',
    }),
    check({
      key: 'staging-row-existing-schema-compatible',
      passed: importJobPlan.plannedStagingRows.every((row) =>
        Boolean(row.module && row.dedupeHash && row.normalizedPayloadJson && row.rawPayloadJson),
      ),
      reason: 'Planned staging rows include module, dedupeHash, normalizedPayloadJson, and rawPayloadJson.',
    }),
    check({
      key: 'rollback-smoke-required',
      passed: false,
      reason: 'Execution is still blocked until a dedicated rollback smoke is implemented for persisted sandbox ImportJob.',
    }),
  ];

  const passedChecks = checks.filter((item) => item.passed).length;
  const blockingChecks = checks.filter((item) => item.blocking).length;
  const warnings: string[] = [];

  if (aggregate.summary.mayPersistImportJob !== false) {
    warnings.push('UNEXPECTED_IMPORTJOB_PERSISTENCE_ALLOWED');
  }

  if (aggregate.summary.mayPersistStagingRows !== false) {
    warnings.push('UNEXPECTED_STAGING_ROW_PERSISTENCE_ALLOWED');
  }

  if (aggregate.summary.mayOverwriteTransaction !== false) {
    warnings.push('UNEXPECTED_TRANSACTION_OVERWRITE_ALLOWED');
  }

  if (aggregate.summary.mayCreateInventoryCompensation !== false) {
    warnings.push('UNEXPECTED_INVENTORY_COMPENSATION_ALLOWED');
  }

  return {
    version: AMAZON_SP_API_SANDBOX_PERSISTED_IMPORTJOB_DESIGN_GATE_VERSION,
    module: 'store-orders',
    sourceType: 'amazon-sp-api-sandbox',
    normalizedSourceType: 'AMAZON_ORDER_SP_API',

    decision: blockingChecks === 0 ? 'DESIGN_READY_FOR_REVIEW_ONLY' : 'BLOCKED_NOW',
    designOnly: true,
    currentExecutionAllowed: false,
    dryRunFalseAllowed: false,
    writesDatabase: false,

    futurePhaseScope: {
      mayDesignImportJobPersistence: true,
      mayDesignImportStagingRowPersistence: true,
      mayExecuteImportJobPersistenceNow: false,
      mayExecuteImportStagingRowPersistenceNow: false,
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

    plannedPersistenceShape: {
      importJob: {
        domain: 'store-orders',
        module: 'store-orders',
        sourceType: 'amazon-sp-api-sandbox',
        status: 'PENDING',
        totalRowsFromPlan: importJobPlan.plannedImportJob.totalRows,
        successRowsInitial: 0,
        failedRowsInitial: 0,
        importedAtInitial: null,
        fileMonthsJsonFromPlan: importJobPlan.plannedImportJob.fileMonthsJson,
        dataJsonRequired: true,
        dataJsonMustInclude: [
          'planningAggregateVersion',
          'sourceType',
          'normalizedSourceType',
          'dryRunOnly',
          'planOnly',
          'controllerDisabled',
          'transactionCommitDisabled',
          'inventoryCommitDisabled',
        ],
      },
      importStagingRow: {
        module: 'store-orders',
        rowCountFromPlan: importJobPlan.plannedStagingRows.length,
        normalizedPayloadJsonRequired: true,
        rawPayloadJsonRequired: true,
        matchStatusAllowed: ['new', 'conflict_review_required'],
        mustIncludeCanonicalDedupeKey: true,
        mustIncludePlanOnlyMarker: true,
        mustNotCreateTransaction: true,
        mustNotCreateInventoryMovement: true,
      },
    },

    checks,

    summary: {
      totalChecks: checks.length,
      passedChecks,
      blockingChecks,
      aggregatePreviewRows: aggregate.previewRows.length,
      plannedImportJobRows: importJobPlan.plannedImportJob.totalRows,
      plannedStagingRows: importJobPlan.plannedStagingRows.length,
      readyForImplementationReview: true,
      readyForExecution: false,
    },

    blockedNow: {
      dryRunFalse: true,
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

    warnings,
  };
}

export function assertAmazonSpApiSandboxPersistedImportJobDesignGate(
  gate: AmazonSpApiSandboxPersistedImportJobDesignGate,
): AmazonSpApiSandboxPersistedImportJobDesignGate {
  if (gate.version !== AMAZON_SP_API_SANDBOX_PERSISTED_IMPORTJOB_DESIGN_GATE_VERSION) {
    throw new Error('Step120-A persisted ImportJob design gate violation: version mismatch.');
  }

  if (gate.designOnly !== true) {
    throw new Error('Step120-A persisted ImportJob design gate violation: designOnly must be true.');
  }

  if (gate.currentExecutionAllowed !== false) {
    throw new Error('Step120-A persisted ImportJob design gate violation: currentExecutionAllowed must be false.');
  }

  if (gate.dryRunFalseAllowed !== false) {
    throw new Error('Step120-A persisted ImportJob design gate violation: dryRunFalseAllowed must be false.');
  }

  if (gate.writesDatabase !== false) {
    throw new Error('Step120-A persisted ImportJob design gate violation: writesDatabase must be false.');
  }

  if (gate.summary.readyForExecution !== false) {
    throw new Error('Step120-A persisted ImportJob design gate violation: readyForExecution must be false.');
  }

  if (gate.futurePhaseScope.mayExecuteImportJobPersistenceNow !== false) {
    throw new Error('Step120-A persisted ImportJob design gate violation: ImportJob execution must remain blocked.');
  }

  if (gate.futurePhaseScope.mayExecuteImportStagingRowPersistenceNow !== false) {
    throw new Error('Step120-A persisted ImportJob design gate violation: staging row execution must remain blocked.');
  }

  if (gate.futurePhaseScope.mayCommitTransactions !== false) {
    throw new Error('Step120-A persisted ImportJob design gate violation: transaction commit must remain blocked.');
  }

  if (gate.futurePhaseScope.mayCreateInventoryMovement !== false) {
    throw new Error('Step120-A persisted ImportJob design gate violation: inventory movement must remain blocked.');
  }

  for (const [key, blocked] of Object.entries(gate.blockedNow)) {
    if (blocked !== true) {
      throw new Error(`Step120-A persisted ImportJob design gate violation: blockedNow.${key} must remain true.`);
    }
  }

  return gate;
}
