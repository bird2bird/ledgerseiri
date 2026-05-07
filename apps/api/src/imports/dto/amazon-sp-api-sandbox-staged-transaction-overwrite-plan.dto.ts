import type { AmazonOrderNormalizedPayload } from '../amazon-order-normalized-contract';
import {
  type AmazonSpApiSandboxOverrideAuditSnapshot,
  assertAmazonSpApiSandboxOverrideAuditSnapshot,
} from './amazon-sp-api-sandbox-override-audit-snapshot.dto';
import {
  type AmazonSpApiSandboxStagedImportJobPersistencePlan,
  assertAmazonSpApiSandboxStagedImportJobPersistencePlan,
} from './amazon-sp-api-sandbox-staged-importjob-persistence-plan.dto';
import { assertAmazonSpApiSandboxPermissionBoundary } from './amazon-sp-api-sandbox-permission-boundary.dto';

export const AMAZON_SP_API_SANDBOX_STAGED_TRANSACTION_OVERWRITE_PLAN_VERSION =
  'amazon-sp-api-sandbox-staged-transaction-overwrite-plan-v1' as const;

export type AmazonSpApiSandboxTransactionOverwriteOperationStatus =
  | 'BLOCKED_NOW'
  | 'PLAN_ONLY_REVIEW_REQUIRED'
  | 'INSUFFICIENT_AUDIT_SNAPSHOT';

export type AmazonSpApiSandboxPlannedTransactionPatch = {
  sourceType: 'AMAZON_ORDER_SP_API';
  amount: number | null;
  currency: string | null;
  occurredAt: string | null;
  businessMonth: string | null;
  quantity: number | null;
  sellerSku: string;
  normalizedSellerSku: string;
  amazonOrderId: string;
  memoMarkers: readonly [
    '[source:AMAZON_ORDER_SP_API]',
    '[override:planned-only]',
    '[authoritative:amazon-sp-api]',
  ];
  rawPayloadJson: AmazonOrderNormalizedPayload & Record<string, unknown>;
};

export type AmazonSpApiSandboxStagedTransactionOverwriteOperation = {
  operationId: string;
  status: AmazonSpApiSandboxTransactionOverwriteOperationStatus;
  planOnly: true;
  writesDatabase: false;
  currentExecutionAllowed: false;
  canonicalDedupeKey: string | null;
  authoritativeSource: 'AMAZON_ORDER_SP_API';
  overwrittenSource: 'AMAZON_ORDER_CSV' | 'MANUAL_DB_EXISTING';
  beforeTransactionSnapshot: AmazonSpApiSandboxOverrideAuditSnapshot['beforeSnapshot'];
  afterTransactionSnapshot: AmazonSpApiSandboxOverrideAuditSnapshot['afterSnapshot'];
  changedFields: AmazonSpApiSandboxOverrideAuditSnapshot['changedFields'];
  warningCodes: string[];
  plannedPatch: AmazonSpApiSandboxPlannedTransactionPatch;
  requiresManualReview: boolean;
  requiresInventoryCompensationPlan: boolean;
  requiresRollbackPlan: true;
};

export type AmazonSpApiSandboxStagedTransactionOverwritePlan = {
  version: typeof AMAZON_SP_API_SANDBOX_STAGED_TRANSACTION_OVERWRITE_PLAN_VERSION;
  planOnly: true;
  writesDatabase: false;
  currentExecutionAllowed: false;
  futureExecutionRequiresPreflight: true;
  sourceType: 'amazon-sp-api-sandbox';
  normalizedSourceType: 'AMAZON_ORDER_SP_API';
  module: 'store-orders';
  importJobPlan: AmazonSpApiSandboxStagedImportJobPersistencePlan;
  operations: AmazonSpApiSandboxStagedTransactionOverwriteOperation[];
  blockedNow: {
    updateTransaction: true;
    createTransaction: true;
    deleteTransaction: true;
    createAuditLog: true;
    updateInventory: true;
    createInventoryMovement: true;
    controllerRoute: true;
    frontendRoute: true;
  };
  warnings: string[];
};

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function toNumberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function buildOperationId(args: {
  canonicalDedupeKey: string | null;
  index: number;
}): string {
  const base = `${args.canonicalDedupeKey || 'missing-canonical-key'}|${args.index}`;
  let hash = 0;
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash * 33 + base.charCodeAt(i)) >>> 0;
  }
  return `step118b-op-${hash.toString(16).padStart(8, '0')}`;
}

export function buildAmazonSpApiSandboxStagedTransactionOverwritePlan(args: {
  importJobPlan: AmazonSpApiSandboxStagedImportJobPersistencePlan;
  overrideAuditSnapshots: AmazonSpApiSandboxOverrideAuditSnapshot[];
}): AmazonSpApiSandboxStagedTransactionOverwritePlan {
  const permission = assertAmazonSpApiSandboxPermissionBoundary();
  const importJobPlan = assertAmazonSpApiSandboxStagedImportJobPersistencePlan(args.importJobPlan);
  const snapshots = args.overrideAuditSnapshots.map((snapshot) =>
    assertAmazonSpApiSandboxOverrideAuditSnapshot(snapshot),
  );

  const warnings: string[] = [];

  if (permission.apiPriorityPolicy.currentOverwriteAllowed !== false) {
    warnings.push('UNEXPECTED_CURRENT_OVERWRITE_ALLOWED');
  }

  if (importJobPlan.currentExecutionAllowed !== false) {
    warnings.push('UNEXPECTED_IMPORTJOB_PLAN_EXECUTION_ALLOWED');
  }

  const operations: AmazonSpApiSandboxStagedTransactionOverwriteOperation[] = snapshots.map(
    (snapshot, index) => {
      const requiresManualReview = snapshot.warningCodes.some((code) =>
        code.includes('MANUAL_REVIEW'),
      );
      const requiresInventoryCompensationPlan = snapshot.warningCodes.includes(
        'INVENTORY_COMPENSATION_PLAN_REQUIRED',
      );

      const status: AmazonSpApiSandboxTransactionOverwriteOperationStatus =
        snapshot.canonicalKey ? 'PLAN_ONLY_REVIEW_REQUIRED' : 'INSUFFICIENT_AUDIT_SNAPSHOT';

      return {
        operationId: buildOperationId({
          canonicalDedupeKey: snapshot.canonicalKey,
          index,
        }),
        status: 'BLOCKED_NOW',
        planOnly: true,
        writesDatabase: false,
        currentExecutionAllowed: false,
        canonicalDedupeKey: snapshot.canonicalKey,
        authoritativeSource: 'AMAZON_ORDER_SP_API',
        overwrittenSource: snapshot.overwrittenSource,
        beforeTransactionSnapshot: snapshot.beforeSnapshot,
        afterTransactionSnapshot: snapshot.afterSnapshot,
        changedFields: snapshot.changedFields,
        warningCodes: [
          ...snapshot.warningCodes,
          status === 'INSUFFICIENT_AUDIT_SNAPSHOT'
            ? 'INSUFFICIENT_AUDIT_SNAPSHOT'
            : 'PLAN_ONLY_REVIEW_REQUIRED',
        ],
        plannedPatch: {
          sourceType: 'AMAZON_ORDER_SP_API',
          amount: toNumberOrNull(snapshot.afterSnapshot.grossAmount),
          currency: snapshot.afterSnapshot.currency,
          occurredAt: snapshot.afterSnapshot.occurredAt,
          businessMonth: snapshot.afterSnapshot.businessMonth,
          quantity: toNumberOrNull(snapshot.afterSnapshot.quantity),
          sellerSku: normalizeString(snapshot.afterSnapshot.sellerSku),
          normalizedSellerSku: normalizeString(snapshot.afterSnapshot.normalizedSellerSku),
          amazonOrderId: normalizeString(snapshot.afterSnapshot.amazonOrderId),
          memoMarkers: [
            '[source:AMAZON_ORDER_SP_API]',
            '[override:planned-only]',
            '[authoritative:amazon-sp-api]',
          ],
          rawPayloadJson: snapshot.afterSnapshot.rawPayload as AmazonOrderNormalizedPayload &
            Record<string, unknown>,
        },
        requiresManualReview,
        requiresInventoryCompensationPlan,
        requiresRollbackPlan: true,
      };
    },
  );

  if (operations.length === 0) {
    warnings.push('NO_TRANSACTION_OVERWRITE_OPERATIONS_PLANNED');
  }

  if (operations.some((operation) => operation.requiresManualReview)) {
    warnings.push('MANUAL_REVIEW_REQUIRED_BEFORE_ANY_FUTURE_OVERWRITE');
  }

  if (operations.some((operation) => operation.requiresInventoryCompensationPlan)) {
    warnings.push('INVENTORY_COMPENSATION_PLAN_REQUIRED_BEFORE_ANY_FUTURE_OVERWRITE');
  }

  return {
    version: AMAZON_SP_API_SANDBOX_STAGED_TRANSACTION_OVERWRITE_PLAN_VERSION,
    planOnly: true,
    writesDatabase: false,
    currentExecutionAllowed: false,
    futureExecutionRequiresPreflight: true,
    sourceType: 'amazon-sp-api-sandbox',
    normalizedSourceType: 'AMAZON_ORDER_SP_API',
    module: 'store-orders',
    importJobPlan,
    operations,
    blockedNow: {
      updateTransaction: true,
      createTransaction: true,
      deleteTransaction: true,
      createAuditLog: true,
      updateInventory: true,
      createInventoryMovement: true,
      controllerRoute: true,
      frontendRoute: true,
    },
    warnings,
  };
}

export function assertAmazonSpApiSandboxStagedTransactionOverwritePlan(
  plan: AmazonSpApiSandboxStagedTransactionOverwritePlan,
): AmazonSpApiSandboxStagedTransactionOverwritePlan {
  if (plan.version !== AMAZON_SP_API_SANDBOX_STAGED_TRANSACTION_OVERWRITE_PLAN_VERSION) {
    throw new Error('Step118-B transaction overwrite plan violation: version mismatch.');
  }

  if (plan.planOnly !== true) {
    throw new Error('Step118-B transaction overwrite plan violation: planOnly must be true.');
  }

  if (plan.writesDatabase !== false) {
    throw new Error('Step118-B transaction overwrite plan violation: writesDatabase must be false.');
  }

  if (plan.currentExecutionAllowed !== false) {
    throw new Error('Step118-B transaction overwrite plan violation: execution must remain disabled.');
  }

  for (const operation of plan.operations) {
    if (operation.status !== 'BLOCKED_NOW') {
      throw new Error('Step118-B transaction overwrite plan violation: operation must remain blocked.');
    }

    if (operation.writesDatabase !== false) {
      throw new Error('Step118-B transaction overwrite plan violation: operation must not write DB.');
    }

    if (operation.currentExecutionAllowed !== false) {
      throw new Error('Step118-B transaction overwrite plan violation: operation execution must remain disabled.');
    }

    if (operation.authoritativeSource !== 'AMAZON_ORDER_SP_API') {
      throw new Error('Step118-B transaction overwrite plan violation: authoritative source must be SP-API.');
    }
  }

  for (const [key, blocked] of Object.entries(plan.blockedNow)) {
    if (blocked !== true) {
      throw new Error(`Step118-B transaction overwrite plan violation: blockedNow.${key} must remain true.`);
    }
  }

  return plan;
}
