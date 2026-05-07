import type { AmazonOrderNormalizedPayload } from '../amazon-order-normalized-contract';
import {
  type AmazonSpApiSandboxOverrideAuditSnapshot,
  assertAmazonSpApiSandboxOverrideAuditSnapshot,
} from './amazon-sp-api-sandbox-override-audit-snapshot.dto';
import {
  type AmazonSpApiSandboxPersistencePreflightChecklist,
  assertAmazonSpApiSandboxPersistencePreflightChecklist,
} from './amazon-sp-api-sandbox-persistence-preflight-checklist.dto';
import {
  type AmazonSpApiSandboxStagedImportJobPersistencePlan,
  assertAmazonSpApiSandboxStagedImportJobPersistencePlan,
} from './amazon-sp-api-sandbox-staged-importjob-persistence-plan.dto';
import {
  type AmazonSpApiSandboxStagedTransactionOverwritePlan,
  assertAmazonSpApiSandboxStagedTransactionOverwritePlan,
} from './amazon-sp-api-sandbox-staged-transaction-overwrite-plan.dto';
import {
  type AmazonSpApiSandboxStagedInventoryCompensationPlan,
  assertAmazonSpApiSandboxStagedInventoryCompensationPlan,
} from './amazon-sp-api-sandbox-staged-inventory-compensation-plan.dto';
import {
  type AmazonSpApiSandboxGuardedExecutionReadinessMatrix,
  assertAmazonSpApiSandboxGuardedExecutionReadinessMatrix,
} from './amazon-sp-api-sandbox-guarded-execution-readiness-matrix.dto';

export const AMAZON_SP_API_SANDBOX_PLANNING_AGGREGATE_VERSION =
  'amazon-sp-api-sandbox-planning-aggregate-v1' as const;

export type AmazonSpApiSandboxPlanningAggregatePreviewRow = {
  rowNo: number;
  businessMonth: string | null;
  dedupeHash: string;
  payload: AmazonOrderNormalizedPayload & Record<string, unknown>;
};

export type AmazonSpApiSandboxPlanningAggregate = {
  version: typeof AMAZON_SP_API_SANDBOX_PLANNING_AGGREGATE_VERSION;
  module: 'store-orders';
  sourceType: 'amazon-sp-api-sandbox';
  normalizedSourceType: 'AMAZON_ORDER_SP_API';

  planOnly: true;
  writesDatabase: false;
  currentExecutionAllowed: false;
  dryRunFalseAllowed: false;

  companyId: string;
  filename: string;

  previewRows: AmazonSpApiSandboxPlanningAggregatePreviewRow[];
  overrideAuditSnapshots: AmazonSpApiSandboxOverrideAuditSnapshot[];
  preflightChecklist: AmazonSpApiSandboxPersistencePreflightChecklist;
  importJobPlan: AmazonSpApiSandboxStagedImportJobPersistencePlan;
  transactionOverwritePlan: AmazonSpApiSandboxStagedTransactionOverwritePlan;
  inventoryCompensationPlan: AmazonSpApiSandboxStagedInventoryCompensationPlan;
  readinessMatrix: AmazonSpApiSandboxGuardedExecutionReadinessMatrix;

  chain: readonly [
    'preview',
    'override-audit-snapshot',
    'persistence-preflight-checklist',
    'staged-importjob-persistence-plan',
    'staged-transaction-overwrite-plan',
    'staged-inventory-compensation-plan',
    'guarded-execution-readiness-matrix',
  ];

  summary: {
    previewRows: number;
    auditSnapshots: number;
    plannedImportJobRows: number;
    transactionOverwriteOperations: number;
    inventoryCompensationOperations: number;
    allowedCapabilities: number;
    blockedCapabilities: number;
    mayContinuePlanOnly: true;
    mayPersistImportJob: false;
    mayPersistStagingRows: false;
    mayOverwriteTransaction: false;
    mayCreateInventoryCompensation: false;
    mayOpenController: false;
    mayOpenFrontend: false;
    mayCallRealSpApi: false;
    mayPersistToken: false;
  };

  blockedNow: {
    createImportJob: true;
    createImportStagingRows: true;
    updateTransaction: true;
    createInventoryMovement: true;
    updateInventoryBalance: true;
    callRealSpApi: true;
    oauth: true;
    persistToken: true;
    controllerRoute: true;
    frontendRoute: true;
  };

  warnings: string[];
};

function normalizePreviewRows(rows: Array<{
  rowNo: number;
  businessMonth: string | null;
  dedupeHash: string;
  payload: AmazonOrderNormalizedPayload & Record<string, unknown>;
}>): AmazonSpApiSandboxPlanningAggregatePreviewRow[] {
  return rows.map((row, index) => ({
    rowNo: row.rowNo || index + 1,
    businessMonth: row.businessMonth || row.payload.businessMonth || null,
    dedupeHash: row.dedupeHash,
    payload: row.payload,
  }));
}

export function buildAmazonSpApiSandboxPlanningAggregate(args: {
  companyId: string;
  filename: string;
  previewRows: Array<{
    rowNo: number;
    businessMonth: string | null;
    dedupeHash: string;
    payload: AmazonOrderNormalizedPayload & Record<string, unknown>;
  }>;
  overrideAuditSnapshots: AmazonSpApiSandboxOverrideAuditSnapshot[];
  preflightChecklist: AmazonSpApiSandboxPersistencePreflightChecklist;
  importJobPlan: AmazonSpApiSandboxStagedImportJobPersistencePlan;
  transactionOverwritePlan: AmazonSpApiSandboxStagedTransactionOverwritePlan;
  inventoryCompensationPlan: AmazonSpApiSandboxStagedInventoryCompensationPlan;
  readinessMatrix: AmazonSpApiSandboxGuardedExecutionReadinessMatrix;
}): AmazonSpApiSandboxPlanningAggregate {
  const overrideAuditSnapshots = args.overrideAuditSnapshots.map((snapshot) =>
    assertAmazonSpApiSandboxOverrideAuditSnapshot(snapshot),
  );
  const preflightChecklist = assertAmazonSpApiSandboxPersistencePreflightChecklist(
    args.preflightChecklist,
  );
  const importJobPlan = assertAmazonSpApiSandboxStagedImportJobPersistencePlan(
    args.importJobPlan,
  );
  const transactionOverwritePlan = assertAmazonSpApiSandboxStagedTransactionOverwritePlan(
    args.transactionOverwritePlan,
  );
  const inventoryCompensationPlan = assertAmazonSpApiSandboxStagedInventoryCompensationPlan(
    args.inventoryCompensationPlan,
  );
  const readinessMatrix = assertAmazonSpApiSandboxGuardedExecutionReadinessMatrix(
    args.readinessMatrix,
  );
  const previewRows = normalizePreviewRows(args.previewRows);

  const warnings: string[] = [];

  if (previewRows.length === 0) {
    warnings.push('NO_PREVIEW_ROWS');
  }

  if (overrideAuditSnapshots.length === 0) {
    warnings.push('NO_OVERRIDE_AUDIT_SNAPSHOTS');
  }

  if (importJobPlan.plannedStagingRows.length !== previewRows.length) {
    warnings.push('IMPORTJOB_PLAN_ROW_COUNT_DIFFERS_FROM_PREVIEW');
  }

  if (readinessMatrix.globalExecutionAllowed !== false) {
    warnings.push('UNEXPECTED_GLOBAL_EXECUTION_ALLOWED');
  }

  if (readinessMatrix.writesDatabase !== false) {
    warnings.push('UNEXPECTED_READINESS_WRITES_DATABASE');
  }

  if (readinessMatrix.finalDecision.mayContinuePlanOnly !== true) {
    warnings.push('PLAN_ONLY_CONTINUATION_NOT_ALLOWED');
  }

  if (readinessMatrix.finalDecision.mayPersistImportJob !== false) {
    warnings.push('UNEXPECTED_IMPORTJOB_PERSISTENCE_ALLOWED');
  }

  if (readinessMatrix.finalDecision.mayOverwriteTransaction !== false) {
    warnings.push('UNEXPECTED_TRANSACTION_OVERWRITE_ALLOWED');
  }

  if (readinessMatrix.finalDecision.mayCreateInventoryCompensation !== false) {
    warnings.push('UNEXPECTED_INVENTORY_COMPENSATION_ALLOWED');
  }

  return {
    version: AMAZON_SP_API_SANDBOX_PLANNING_AGGREGATE_VERSION,
    module: 'store-orders',
    sourceType: 'amazon-sp-api-sandbox',
    normalizedSourceType: 'AMAZON_ORDER_SP_API',

    planOnly: true,
    writesDatabase: false,
    currentExecutionAllowed: false,
    dryRunFalseAllowed: false,

    companyId: args.companyId,
    filename: args.filename,

    previewRows,
    overrideAuditSnapshots,
    preflightChecklist,
    importJobPlan,
    transactionOverwritePlan,
    inventoryCompensationPlan,
    readinessMatrix,

    chain: [
      'preview',
      'override-audit-snapshot',
      'persistence-preflight-checklist',
      'staged-importjob-persistence-plan',
      'staged-transaction-overwrite-plan',
      'staged-inventory-compensation-plan',
      'guarded-execution-readiness-matrix',
    ],

    summary: {
      previewRows: previewRows.length,
      auditSnapshots: overrideAuditSnapshots.length,
      plannedImportJobRows: importJobPlan.plannedStagingRows.length,
      transactionOverwriteOperations: transactionOverwritePlan.operations.length,
      inventoryCompensationOperations: inventoryCompensationPlan.operations.length,
      allowedCapabilities: readinessMatrix.summary.allowedCapabilities,
      blockedCapabilities: readinessMatrix.summary.blockedCapabilities,
      mayContinuePlanOnly: readinessMatrix.finalDecision.mayContinuePlanOnly,
      mayPersistImportJob: readinessMatrix.finalDecision.mayPersistImportJob,
      mayPersistStagingRows: readinessMatrix.finalDecision.mayPersistStagingRows,
      mayOverwriteTransaction: readinessMatrix.finalDecision.mayOverwriteTransaction,
      mayCreateInventoryCompensation: readinessMatrix.finalDecision.mayCreateInventoryCompensation,
      mayOpenController: readinessMatrix.finalDecision.mayOpenController,
      mayOpenFrontend: readinessMatrix.finalDecision.mayOpenFrontend,
      mayCallRealSpApi: readinessMatrix.finalDecision.mayCallRealSpApi,
      mayPersistToken: readinessMatrix.finalDecision.mayPersistToken,
    },

    blockedNow: {
      createImportJob: true,
      createImportStagingRows: true,
      updateTransaction: true,
      createInventoryMovement: true,
      updateInventoryBalance: true,
      callRealSpApi: true,
      oauth: true,
      persistToken: true,
      controllerRoute: true,
      frontendRoute: true,
    },

    warnings,
  };
}

export function assertAmazonSpApiSandboxPlanningAggregate(
  aggregate: AmazonSpApiSandboxPlanningAggregate,
): AmazonSpApiSandboxPlanningAggregate {
  if (aggregate.version !== AMAZON_SP_API_SANDBOX_PLANNING_AGGREGATE_VERSION) {
    throw new Error('Step119-A planning aggregate violation: version mismatch.');
  }

  if (aggregate.planOnly !== true) {
    throw new Error('Step119-A planning aggregate violation: planOnly must be true.');
  }

  if (aggregate.writesDatabase !== false) {
    throw new Error('Step119-A planning aggregate violation: writesDatabase must be false.');
  }

  if (aggregate.currentExecutionAllowed !== false) {
    throw new Error('Step119-A planning aggregate violation: currentExecutionAllowed must be false.');
  }

  if (aggregate.dryRunFalseAllowed !== false) {
    throw new Error('Step119-A planning aggregate violation: dryRunFalseAllowed must be false.');
  }

  if (aggregate.summary.mayContinuePlanOnly !== true) {
    throw new Error('Step119-A planning aggregate violation: plan-only continuation must be allowed.');
  }

  for (const key of [
    'mayPersistImportJob',
    'mayPersistStagingRows',
    'mayOverwriteTransaction',
    'mayCreateInventoryCompensation',
    'mayOpenController',
    'mayOpenFrontend',
    'mayCallRealSpApi',
    'mayPersistToken',
  ] as const) {
    if (aggregate.summary[key] !== false) {
      throw new Error(`Step119-A planning aggregate violation: summary.${key} must remain false.`);
    }
  }

  for (const [key, blocked] of Object.entries(aggregate.blockedNow)) {
    if (blocked !== true) {
      throw new Error(`Step119-A planning aggregate violation: blockedNow.${key} must remain true.`);
    }
  }

  return aggregate;
}
