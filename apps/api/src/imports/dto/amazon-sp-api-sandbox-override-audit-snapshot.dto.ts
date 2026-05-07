import {
  type AmazonOrderNormalizedPayload,
  normalizeAmazonOrderText,
  normalizeAmazonSellerSku,
} from '../amazon-order-normalized-contract';
import {
  type AmazonOrderCrossSourceDedupeComparison,
  buildAmazonOrderCrossSourceDedupeKey,
  compareAmazonOrderCsvAndSpApiDedupeKeys,
} from './amazon-sp-api-sandbox-csv-dedupe-boundary.dto';
import { assertAmazonSpApiSandboxPermissionBoundary } from './amazon-sp-api-sandbox-permission-boundary.dto';

export const AMAZON_SP_API_SANDBOX_OVERRIDE_AUDIT_SNAPSHOT_VERSION =
  'amazon-sp-api-sandbox-override-audit-snapshot-v1' as const;

export type AmazonSpApiSandboxOverrideStatus =
  | 'BLOCKED_NOW'
  | 'READY_FOR_FUTURE_APPROVAL'
  | 'INSUFFICIENT_KEYS'
  | 'MANUAL_REVIEW_REQUIRED';

export type AmazonSpApiSandboxOverrideChangedField = {
  field: string;
  before: unknown;
  after: unknown;
  severity: 'info' | 'warning' | 'critical';
};

export type AmazonSpApiSandboxOverrideSnapshotPayload = {
  sourceType: 'AMAZON_ORDER_CSV' | 'AMAZON_ORDER_SP_API' | 'MANUAL_DB_EXISTING';
  orderId: string;
  amazonOrderId: string;
  sellerSku: string;
  normalizedSellerSku: string;
  businessMonth: string | null;
  occurredAt: string | null;
  quantity: number | null;
  grossAmount: number | null;
  netAmount: number | null;
  feeAmount: number | null;
  currency: string | null;
  importJobId: string | null;
  sourceFileName: string | null;
  sourceRowNo: number | null;
  rawPayload: unknown;
};

export type AmazonSpApiSandboxOverrideAuditSnapshot = {
  version: typeof AMAZON_SP_API_SANDBOX_OVERRIDE_AUDIT_SNAPSHOT_VERSION;
  module: 'store-orders';
  overrideStatus: AmazonSpApiSandboxOverrideStatus;
  currentExecutionAllowed: false;
  futureExecutionRequiresApproval: true;
  authoritativeSource: 'AMAZON_ORDER_SP_API';
  overwrittenSource: 'AMAZON_ORDER_CSV' | 'MANUAL_DB_EXISTING';

  canonicalKey: string | null;
  dedupeComparison: AmazonOrderCrossSourceDedupeComparison;
  beforeSnapshot: AmazonSpApiSandboxOverrideSnapshotPayload;
  afterSnapshot: AmazonSpApiSandboxOverrideSnapshotPayload;
  changedFields: AmazonSpApiSandboxOverrideChangedField[];

  auditRequirements: {
    requiresExplicitPermission: true;
    requiresBeforeAfterSnapshot: true;
    requiresAuditLog: true;
    requiresNoSilentOverwrite: true;
    requiresManualReviewForAmountOrQuantityMismatch: true;
    requiresInventoryCompensationPlanBeforeInventoryOverwrite: true;
    requiresRollbackPlan: true;
  };

  blockedNow: {
    overwriteExistingTransaction: true;
    overwriteExistingInventoryMovement: true;
    persistImportJob: true;
    persistImportStagingRows: true;
    commitTransactions: true;
  };

  warningCodes: string[];
};

function toFiniteNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = Number(value.replace(/[,\s円¥￥]/g, ''));
    if (Number.isFinite(normalized)) return normalized;
  }
  return null;
}

function buildSnapshotPayload(args: {
  payload: AmazonOrderNormalizedPayload | Record<string, unknown>;
  fallbackSourceType: 'AMAZON_ORDER_CSV' | 'AMAZON_ORDER_SP_API' | 'MANUAL_DB_EXISTING';
}): AmazonSpApiSandboxOverrideSnapshotPayload {
  const payload = args.payload as Record<string, unknown>;

  const sellerSku = normalizeAmazonOrderText(
    payload.sellerSku || payload.sku || payload.skuCode,
  );
  const normalizedSellerSku = normalizeAmazonSellerSku(
    payload.normalizedSellerSku || sellerSku,
  );
  const orderId = normalizeAmazonOrderText(payload.orderId || payload.amazonOrderId);
  const amazonOrderId = normalizeAmazonOrderText(payload.amazonOrderId || payload.orderId);

  return {
    sourceType:
      payload.sourceType === 'AMAZON_ORDER_CSV' || payload.sourceType === 'AMAZON_ORDER_SP_API'
        ? payload.sourceType
        : args.fallbackSourceType,
    orderId,
    amazonOrderId,
    sellerSku,
    normalizedSellerSku,
    businessMonth:
      typeof payload.businessMonth === 'string' && payload.businessMonth
        ? payload.businessMonth
        : null,
    occurredAt:
      typeof payload.occurredAt === 'string' && payload.occurredAt
        ? payload.occurredAt
        : null,
    quantity: toFiniteNumberOrNull(payload.quantity),
    grossAmount: toFiniteNumberOrNull(payload.grossAmount ?? payload.amount),
    netAmount: toFiniteNumberOrNull(payload.netAmount),
    feeAmount: toFiniteNumberOrNull(payload.feeAmount),
    currency:
      typeof payload.currency === 'string' && payload.currency
        ? payload.currency
        : null,
    importJobId:
      typeof payload.importJobId === 'string' && payload.importJobId
        ? payload.importJobId
        : null,
    sourceFileName:
      typeof payload.sourceFileName === 'string' && payload.sourceFileName
        ? payload.sourceFileName
        : null,
    sourceRowNo:
      typeof payload.sourceRowNo === 'number' && Number.isFinite(payload.sourceRowNo)
        ? payload.sourceRowNo
        : null,
    rawPayload: payload,
  };
}

function changedField(
  field: string,
  before: unknown,
  after: unknown,
  severity: 'info' | 'warning' | 'critical',
): AmazonSpApiSandboxOverrideChangedField | null {
  return Object.is(before, after) ? null : { field, before, after, severity };
}

export function buildAmazonSpApiSandboxOverrideAuditSnapshot(args: {
  existingPayload: AmazonOrderNormalizedPayload | Record<string, unknown>;
  spApiPayload: AmazonOrderNormalizedPayload;
  overwrittenSource?: 'AMAZON_ORDER_CSV' | 'MANUAL_DB_EXISTING';
}): AmazonSpApiSandboxOverrideAuditSnapshot {
  const permission = assertAmazonSpApiSandboxPermissionBoundary();

  if (permission.apiPriorityPolicy.authoritativeSourceWhenSameCanonicalOrderItem !== 'AMAZON_ORDER_SP_API') {
    throw new Error('Step117-E violation: SP-API must remain authoritative future source.');
  }

  const overwrittenSource = args.overwrittenSource || 'AMAZON_ORDER_CSV';
  const beforeSnapshot = buildSnapshotPayload({
    payload: args.existingPayload,
    fallbackSourceType: overwrittenSource,
  });
  const afterSnapshot = buildSnapshotPayload({
    payload: args.spApiPayload,
    fallbackSourceType: 'AMAZON_ORDER_SP_API',
  });

  const csvLikePayload = {
    ...(args.existingPayload as Record<string, unknown>),
    sourceType: 'AMAZON_ORDER_CSV',
  } as AmazonOrderNormalizedPayload;

  const dedupeComparison = compareAmazonOrderCsvAndSpApiDedupeKeys({
    csvPayload: csvLikePayload,
    spApiPayload: args.spApiPayload,
  });

  const beforeKey = buildAmazonOrderCrossSourceDedupeKey({
    payload: csvLikePayload,
  });
  const canonicalKey = beforeKey.canonicalKey || dedupeComparison.csvKey.canonicalKey || null;

  const changedFields = [
    changedField('quantity', beforeSnapshot.quantity, afterSnapshot.quantity, 'critical'),
    changedField('grossAmount', beforeSnapshot.grossAmount, afterSnapshot.grossAmount, 'critical'),
    changedField('netAmount', beforeSnapshot.netAmount, afterSnapshot.netAmount, 'warning'),
    changedField('feeAmount', beforeSnapshot.feeAmount, afterSnapshot.feeAmount, 'warning'),
    changedField('occurredAt', beforeSnapshot.occurredAt, afterSnapshot.occurredAt, 'warning'),
    changedField('currency', beforeSnapshot.currency, afterSnapshot.currency, 'critical'),
    changedField('sellerSku', beforeSnapshot.normalizedSellerSku, afterSnapshot.normalizedSellerSku, 'critical'),
  ].filter((x): x is AmazonSpApiSandboxOverrideChangedField => Boolean(x));

  const warningCodes: string[] = [];

  if (dedupeComparison.decision === 'INSUFFICIENT_KEYS') {
    warningCodes.push('INSUFFICIENT_DEDUPE_KEYS');
  }

  if (dedupeComparison.decision === 'DIFFERENT_ORDER_ITEM') {
    warningCodes.push('DIFFERENT_CANONICAL_ORDER_ITEM');
  }

  if (!dedupeComparison.sameQuantity) {
    warningCodes.push('QUANTITY_MISMATCH_REQUIRES_MANUAL_REVIEW');
  }

  if (!dedupeComparison.sameGrossAmount) {
    warningCodes.push('AMOUNT_MISMATCH_REQUIRES_MANUAL_REVIEW');
  }

  if (!dedupeComparison.sameOccurredAtDate) {
    warningCodes.push('ORDER_DATE_MISMATCH_REQUIRES_MANUAL_REVIEW');
  }

  if (changedFields.some((field) => field.field === 'quantity')) {
    warningCodes.push('INVENTORY_COMPENSATION_PLAN_REQUIRED');
  }

  const overrideStatus: AmazonSpApiSandboxOverrideStatus =
    dedupeComparison.decision === 'INSUFFICIENT_KEYS'
      ? 'INSUFFICIENT_KEYS'
      : warningCodes.some((code) => code.includes('MANUAL_REVIEW') || code.includes('INVENTORY_COMPENSATION'))
        ? 'MANUAL_REVIEW_REQUIRED'
        : 'READY_FOR_FUTURE_APPROVAL';

  return {
    version: AMAZON_SP_API_SANDBOX_OVERRIDE_AUDIT_SNAPSHOT_VERSION,
    module: 'store-orders',
    overrideStatus: permission.apiPriorityPolicy.currentOverwriteAllowed
      ? overrideStatus
      : 'BLOCKED_NOW',
    currentExecutionAllowed: false,
    futureExecutionRequiresApproval: true,
    authoritativeSource: 'AMAZON_ORDER_SP_API',
    overwrittenSource,
    canonicalKey,
    dedupeComparison,
    beforeSnapshot,
    afterSnapshot,
    changedFields,
    auditRequirements: {
      requiresExplicitPermission: true,
      requiresBeforeAfterSnapshot: true,
      requiresAuditLog: true,
      requiresNoSilentOverwrite: true,
      requiresManualReviewForAmountOrQuantityMismatch: true,
      requiresInventoryCompensationPlanBeforeInventoryOverwrite: true,
      requiresRollbackPlan: true,
    },
    blockedNow: {
      overwriteExistingTransaction: true,
      overwriteExistingInventoryMovement: true,
      persistImportJob: true,
      persistImportStagingRows: true,
      commitTransactions: true,
    },
    warningCodes,
  };
}

export function assertAmazonSpApiSandboxOverrideAuditSnapshot(
  snapshot: AmazonSpApiSandboxOverrideAuditSnapshot,
): AmazonSpApiSandboxOverrideAuditSnapshot {
  if (snapshot.version !== AMAZON_SP_API_SANDBOX_OVERRIDE_AUDIT_SNAPSHOT_VERSION) {
    throw new Error('Step117-E audit violation: version mismatch.');
  }

  if (snapshot.currentExecutionAllowed !== false) {
    throw new Error('Step117-E audit violation: current execution must remain blocked.');
  }

  if (snapshot.futureExecutionRequiresApproval !== true) {
    throw new Error('Step117-E audit violation: future execution must require approval.');
  }

  if (snapshot.authoritativeSource !== 'AMAZON_ORDER_SP_API') {
    throw new Error('Step117-E audit violation: authoritative source must be SP-API.');
  }

  if (snapshot.auditRequirements.requiresBeforeAfterSnapshot !== true) {
    throw new Error('Step117-E audit violation: before/after snapshot required.');
  }

  if (snapshot.auditRequirements.requiresAuditLog !== true) {
    throw new Error('Step117-E audit violation: audit log required.');
  }

  if (snapshot.auditRequirements.requiresNoSilentOverwrite !== true) {
    throw new Error('Step117-E audit violation: silent overwrite forbidden.');
  }

  for (const [key, blocked] of Object.entries(snapshot.blockedNow)) {
    if (blocked !== true) {
      throw new Error(`Step117-E audit violation: blockedNow.${key} must remain true.`);
    }
  }

  return snapshot;
}
