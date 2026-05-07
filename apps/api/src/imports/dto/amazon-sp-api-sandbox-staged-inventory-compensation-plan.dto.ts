import {
  type AmazonSpApiSandboxStagedTransactionOverwriteOperation,
  type AmazonSpApiSandboxStagedTransactionOverwritePlan,
  assertAmazonSpApiSandboxStagedTransactionOverwritePlan,
} from './amazon-sp-api-sandbox-staged-transaction-overwrite-plan.dto';
import { assertAmazonSpApiSandboxPermissionBoundary } from './amazon-sp-api-sandbox-permission-boundary.dto';

export const AMAZON_SP_API_SANDBOX_STAGED_INVENTORY_COMPENSATION_PLAN_VERSION =
  'amazon-sp-api-sandbox-staged-inventory-compensation-plan-v1' as const;

export type AmazonSpApiSandboxInventoryCompensationOperationStatus =
  | 'BLOCKED_NOW'
  | 'PLAN_ONLY_REVIEW_REQUIRED'
  | 'NO_COMPENSATION_REQUIRED'
  | 'INSUFFICIENT_SKU_OR_QUANTITY';

export type AmazonSpApiSandboxPlannedInventoryMovement = {
  sourceType: 'AMAZON_ORDER_SP_API_OVERRIDE_COMPENSATION';
  type: 'ADJUST';
  quantityDelta: number;
  occurredAt: string | null;
  businessMonth: string | null;
  sourceId: string;
  sourceRowNo: number | null;
  transactionId: null;
  importJobId: null;
  memoMarkers: readonly [
    '[source:AMAZON_ORDER_SP_API]',
    '[inventory-compensation:planned-only]',
    '[override:planned-only]',
  ];
};

export type AmazonSpApiSandboxStagedInventoryCompensationOperation = {
  operationId: string;
  status: AmazonSpApiSandboxInventoryCompensationOperationStatus;
  planOnly: true;
  writesDatabase: false;
  currentExecutionAllowed: false;
  canonicalDedupeKey: string | null;
  amazonOrderId: string;
  sellerSku: string;
  normalizedSellerSku: string;
  quantityBefore: number | null;
  quantityAfter: number | null;
  quantityDelta: number | null;
  requiresSkuResolution: boolean;
  requiresManualReview: boolean;
  requiresInventoryCompensationPlanApproval: boolean;
  plannedMovement: AmazonSpApiSandboxPlannedInventoryMovement | null;
  warningCodes: string[];
};

export type AmazonSpApiSandboxStagedInventoryCompensationPlan = {
  version: typeof AMAZON_SP_API_SANDBOX_STAGED_INVENTORY_COMPENSATION_PLAN_VERSION;
  planOnly: true;
  writesDatabase: false;
  currentExecutionAllowed: false;
  futureExecutionRequiresPreflight: true;
  sourceType: 'amazon-sp-api-sandbox';
  normalizedSourceType: 'AMAZON_ORDER_SP_API';
  module: 'store-orders';
  transactionOverwritePlan: AmazonSpApiSandboxStagedTransactionOverwritePlan;
  operations: AmazonSpApiSandboxStagedInventoryCompensationOperation[];
  blockedNow: {
    updateInventoryBalance: true;
    createInventoryMovement: true;
    linkInventoryMovementToTransaction: true;
    resolveSkuAutomatically: true;
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

function buildInventoryOperationId(args: {
  canonicalDedupeKey: string | null;
  index: number;
}): string {
  const base = `${args.canonicalDedupeKey || 'missing-canonical-key'}|inventory|${args.index}`;
  let hash = 0;
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash * 37 + base.charCodeAt(i)) >>> 0;
  }
  return `step118c-inv-${hash.toString(16).padStart(8, '0')}`;
}

function buildOperationFromTransactionOverwrite(args: {
  operation: AmazonSpApiSandboxStagedTransactionOverwriteOperation;
  index: number;
}): AmazonSpApiSandboxStagedInventoryCompensationOperation {
  const beforeQty = toNumberOrNull(args.operation.beforeTransactionSnapshot.quantity);
  const afterQty = toNumberOrNull(args.operation.afterTransactionSnapshot.quantity);
  const quantityDelta =
    beforeQty == null || afterQty == null ? null : afterQty - beforeQty;

  const amazonOrderId = normalizeString(args.operation.afterTransactionSnapshot.amazonOrderId);
  const sellerSku = normalizeString(args.operation.afterTransactionSnapshot.sellerSku);
  const normalizedSellerSku = normalizeString(
    args.operation.afterTransactionSnapshot.normalizedSellerSku,
  );
  const requiresSkuResolution = normalizedSellerSku.length === 0 || sellerSku.length === 0;
  const requiresManualReview =
    args.operation.requiresManualReview ||
    args.operation.warningCodes.some((code) => code.includes('MANUAL_REVIEW'));
  const requiresInventoryCompensationPlanApproval =
    args.operation.requiresInventoryCompensationPlan || quantityDelta !== 0;

  const warningCodes: string[] = [];

  if (quantityDelta == null) {
    warningCodes.push('INSUFFICIENT_QUANTITY_FOR_INVENTORY_COMPENSATION');
  }

  if (requiresSkuResolution) {
    warningCodes.push('SKU_RESOLUTION_REQUIRED_BEFORE_INVENTORY_COMPENSATION');
  }

  if (quantityDelta && quantityDelta !== 0) {
    warningCodes.push('INVENTORY_COMPENSATION_QUANTITY_DELTA_DETECTED');
  }

  if (requiresManualReview) {
    warningCodes.push('MANUAL_REVIEW_REQUIRED_BEFORE_INVENTORY_COMPENSATION');
  }

  const status: AmazonSpApiSandboxInventoryCompensationOperationStatus =
    quantityDelta == null || requiresSkuResolution
      ? 'INSUFFICIENT_SKU_OR_QUANTITY'
      : quantityDelta === 0
        ? 'NO_COMPENSATION_REQUIRED'
        : 'PLAN_ONLY_REVIEW_REQUIRED';

  const plannedMovement =
    quantityDelta == null || quantityDelta === 0
      ? null
      : {
          sourceType: 'AMAZON_ORDER_SP_API_OVERRIDE_COMPENSATION' as const,
          type: 'ADJUST' as const,
          quantityDelta,
          occurredAt: args.operation.plannedPatch.occurredAt,
          businessMonth: args.operation.plannedPatch.businessMonth,
          sourceId: args.operation.operationId,
          sourceRowNo: null,
          transactionId: null,
          importJobId: null,
          memoMarkers: [
            '[source:AMAZON_ORDER_SP_API]',
            '[inventory-compensation:planned-only]',
            '[override:planned-only]',
          ] as const,
        };

  return {
    operationId: buildInventoryOperationId({
      canonicalDedupeKey: args.operation.canonicalDedupeKey,
      index: args.index,
    }),
    status: 'BLOCKED_NOW',
    planOnly: true,
    writesDatabase: false,
    currentExecutionAllowed: false,
    canonicalDedupeKey: args.operation.canonicalDedupeKey,
    amazonOrderId,
    sellerSku,
    normalizedSellerSku,
    quantityBefore: beforeQty,
    quantityAfter: afterQty,
    quantityDelta,
    requiresSkuResolution,
    requiresManualReview,
    requiresInventoryCompensationPlanApproval,
    plannedMovement,
    warningCodes: [
      ...warningCodes,
      status,
    ],
  };
}

export function buildAmazonSpApiSandboxStagedInventoryCompensationPlan(args: {
  transactionOverwritePlan: AmazonSpApiSandboxStagedTransactionOverwritePlan;
}): AmazonSpApiSandboxStagedInventoryCompensationPlan {
  const permission = assertAmazonSpApiSandboxPermissionBoundary();
  const transactionOverwritePlan = assertAmazonSpApiSandboxStagedTransactionOverwritePlan(
    args.transactionOverwritePlan,
  );

  const warnings: string[] = [];

  if (permission.apiPriorityPolicy.currentOverwriteAllowed !== false) {
    warnings.push('UNEXPECTED_CURRENT_OVERWRITE_ALLOWED');
  }

  if (transactionOverwritePlan.currentExecutionAllowed !== false) {
    warnings.push('UNEXPECTED_TRANSACTION_OVERWRITE_EXECUTION_ALLOWED');
  }

  const operations = transactionOverwritePlan.operations.map((operation, index) =>
    buildOperationFromTransactionOverwrite({ operation, index }),
  );

  if (operations.length === 0) {
    warnings.push('NO_INVENTORY_COMPENSATION_OPERATIONS_PLANNED');
  }

  if (operations.some((operation) => operation.quantityDelta && operation.quantityDelta !== 0)) {
    warnings.push('INVENTORY_COMPENSATION_QUANTITY_DELTA_DETECTED');
  }

  if (operations.some((operation) => operation.requiresSkuResolution)) {
    warnings.push('SKU_RESOLUTION_REQUIRED_BEFORE_INVENTORY_COMPENSATION');
  }

  if (operations.some((operation) => operation.requiresManualReview)) {
    warnings.push('MANUAL_REVIEW_REQUIRED_BEFORE_INVENTORY_COMPENSATION');
  }

  return {
    version: AMAZON_SP_API_SANDBOX_STAGED_INVENTORY_COMPENSATION_PLAN_VERSION,
    planOnly: true,
    writesDatabase: false,
    currentExecutionAllowed: false,
    futureExecutionRequiresPreflight: true,
    sourceType: 'amazon-sp-api-sandbox',
    normalizedSourceType: 'AMAZON_ORDER_SP_API',
    module: 'store-orders',
    transactionOverwritePlan,
    operations,
    blockedNow: {
      updateInventoryBalance: true,
      createInventoryMovement: true,
      linkInventoryMovementToTransaction: true,
      resolveSkuAutomatically: true,
      controllerRoute: true,
      frontendRoute: true,
    },
    warnings,
  };
}

export function assertAmazonSpApiSandboxStagedInventoryCompensationPlan(
  plan: AmazonSpApiSandboxStagedInventoryCompensationPlan,
): AmazonSpApiSandboxStagedInventoryCompensationPlan {
  if (plan.version !== AMAZON_SP_API_SANDBOX_STAGED_INVENTORY_COMPENSATION_PLAN_VERSION) {
    throw new Error('Step118-C inventory compensation plan violation: version mismatch.');
  }

  if (plan.planOnly !== true) {
    throw new Error('Step118-C inventory compensation plan violation: planOnly must be true.');
  }

  if (plan.writesDatabase !== false) {
    throw new Error('Step118-C inventory compensation plan violation: writesDatabase must be false.');
  }

  if (plan.currentExecutionAllowed !== false) {
    throw new Error('Step118-C inventory compensation plan violation: execution must remain disabled.');
  }

  for (const operation of plan.operations) {
    if (operation.status !== 'BLOCKED_NOW') {
      throw new Error('Step118-C inventory compensation plan violation: operation must remain blocked.');
    }

    if (operation.writesDatabase !== false) {
      throw new Error('Step118-C inventory compensation plan violation: operation must not write DB.');
    }

    if (operation.currentExecutionAllowed !== false) {
      throw new Error('Step118-C inventory compensation plan violation: operation execution must remain disabled.');
    }
  }

  for (const [key, blocked] of Object.entries(plan.blockedNow)) {
    if (blocked !== true) {
      throw new Error(`Step118-C inventory compensation plan violation: blockedNow.${key} must remain true.`);
    }
  }

  return plan;
}
