import {
  type AmazonOrderNormalizedPayload,
  normalizeAmazonOrderText,
  normalizeAmazonSellerSku,
} from '../amazon-order-normalized-contract';
import { assertAmazonSpApiSandboxImportCenterVisibilityPolicy } from './amazon-sp-api-sandbox-import-center-visibility-policy.dto';

export const AMAZON_SP_API_SANDBOX_CSV_DEDUPE_BOUNDARY_VERSION =
  'amazon-sp-api-sandbox-csv-dedupe-boundary-v1' as const;

export type AmazonOrderCrossSourceDedupeSourceType =
  | 'AMAZON_ORDER_CSV'
  | 'AMAZON_ORDER_SP_API';

export type AmazonOrderCrossSourceDedupeDecision =
  | 'SAME_ORDER_ITEM_CANDIDATE'
  | 'DIFFERENT_ORDER_ITEM'
  | 'INSUFFICIENT_KEYS'
  | 'BLOCKED_UNTIL_PERSISTENCE_POLICY_APPROVED';

export type AmazonOrderCrossSourceDedupeBoundary = {
  version: typeof AMAZON_SP_API_SANDBOX_CSV_DEDUPE_BOUNDARY_VERSION;
  module: 'store-orders';
  comparedSourceTypes: readonly ['AMAZON_ORDER_CSV', 'AMAZON_ORDER_SP_API'];
  currentPolicy: {
    crossSourcePersistAllowed: false;
    crossSourceTransactionCommitAllowed: false;
    crossSourceInventoryDeductionAllowed: false;
    sandboxDedupeCanOnlyPreview: true;
    sandboxDedupeCanBlockPersist: true;
  };
  canonicalKeyPolicy: {
    primaryKey: readonly [
      'amazonOrderId',
      'normalizedSellerSku',
      'businessMonth',
    ];
    secondaryTieBreakers: readonly [
      'quantity',
      'grossAmount',
      'occurredAtDate',
    ];
    excludedFields: readonly [
      'sourceType',
      'importJobId',
      'sourceFileName',
      'sourceRowNo',
      'raw',
      'description',
    ];
  };
  csvVsSpApiPolicy: {
    sameCanonicalKeyMeansSameCandidate: true;
    sameCandidateMustNotAutoCommitTwice: true;
    csvCommittedTransactionWinsOverSandboxPreview: true;
    sandboxPreviewMustSurfaceCsvConflict: true;
    sandboxDryRunMustRollbackEvenWhenNoConflict: true;
  };
  futurePersistenceRequirement: {
    requiresExistingTransactionLookupByCanonicalKey: true;
    requiresExistingStagingLookupByCanonicalKey: true;
    requiresImportJobSourceTypeFilter: true;
    requiresManualConflictReviewForAmountMismatch: true;
    requiresNoInventoryDeductionForSandboxUntilApproved: true;
  };
};

export type AmazonOrderCrossSourceDedupeInput = {
  payload: AmazonOrderNormalizedPayload;
};

export type AmazonOrderCrossSourceDedupeKey = {
  version: typeof AMAZON_SP_API_SANDBOX_CSV_DEDUPE_BOUNDARY_VERSION;
  module: 'store-orders';
  sourceType: AmazonOrderCrossSourceDedupeSourceType;
  amazonOrderId: string;
  normalizedSellerSku: string;
  businessMonth: string | null;
  quantity: number;
  grossAmount: number;
  occurredAtDate: string | null;
  canonicalKey: string | null;
  insufficientReasons: string[];
};

export type AmazonOrderCrossSourceDedupeComparison = {
  version: typeof AMAZON_SP_API_SANDBOX_CSV_DEDUPE_BOUNDARY_VERSION;
  decision: AmazonOrderCrossSourceDedupeDecision;
  sameCanonicalKey: boolean;
  sameQuantity: boolean;
  sameGrossAmount: boolean;
  sameOccurredAtDate: boolean;
  csvKey: AmazonOrderCrossSourceDedupeKey;
  spApiKey: AmazonOrderCrossSourceDedupeKey;
  warnings: string[];
};

export function getAmazonSpApiSandboxCsvDedupeBoundary(): AmazonOrderCrossSourceDedupeBoundary {
  assertAmazonSpApiSandboxImportCenterVisibilityPolicy();

  return {
    version: AMAZON_SP_API_SANDBOX_CSV_DEDUPE_BOUNDARY_VERSION,
    module: 'store-orders',
    comparedSourceTypes: ['AMAZON_ORDER_CSV', 'AMAZON_ORDER_SP_API'],
    currentPolicy: {
      crossSourcePersistAllowed: false,
      crossSourceTransactionCommitAllowed: false,
      crossSourceInventoryDeductionAllowed: false,
      sandboxDedupeCanOnlyPreview: true,
      sandboxDedupeCanBlockPersist: true,
    },
    canonicalKeyPolicy: {
      primaryKey: ['amazonOrderId', 'normalizedSellerSku', 'businessMonth'],
      secondaryTieBreakers: ['quantity', 'grossAmount', 'occurredAtDate'],
      excludedFields: [
        'sourceType',
        'importJobId',
        'sourceFileName',
        'sourceRowNo',
        'raw',
        'description',
      ],
    },
    csvVsSpApiPolicy: {
      sameCanonicalKeyMeansSameCandidate: true,
      sameCandidateMustNotAutoCommitTwice: true,
      csvCommittedTransactionWinsOverSandboxPreview: true,
      sandboxPreviewMustSurfaceCsvConflict: true,
      sandboxDryRunMustRollbackEvenWhenNoConflict: true,
    },
    futurePersistenceRequirement: {
      requiresExistingTransactionLookupByCanonicalKey: true,
      requiresExistingStagingLookupByCanonicalKey: true,
      requiresImportJobSourceTypeFilter: true,
      requiresManualConflictReviewForAmountMismatch: true,
      requiresNoInventoryDeductionForSandboxUntilApproved: true,
    },
  };
}

function normalizeOccurredAtDate(value: unknown): string | null {
  const raw = normalizeAmazonOrderText(value);
  if (!raw) return null;

  const date = new Date(raw);
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().slice(0, 10);
  }

  const match = raw.match(/(20\d{2})[\/\-.年]?[\s]*(0?[1-9]|1[0-2])[\/\-.月]?[\s]*(0?[1-9]|[12]\d|3[01])/);
  if (!match) return null;

  return `${match[1]}-${String(Number(match[2])).padStart(2, '0')}-${String(Number(match[3])).padStart(2, '0')}`;
}

export function buildAmazonOrderCrossSourceDedupeKey(
  input: AmazonOrderCrossSourceDedupeInput,
): AmazonOrderCrossSourceDedupeKey {
  // Step117-C Fix2:
  // Dedupe boundary must evaluate incomplete candidates and return
  // INSUFFICIENT_KEYS instead of failing before boundary comparison.
  const payload = input.payload;

  const sourceType = payload.sourceType as AmazonOrderCrossSourceDedupeSourceType;
  const amazonOrderId = normalizeAmazonOrderText(payload.amazonOrderId || payload.orderId);
  const normalizedSellerSku = normalizeAmazonSellerSku(
    payload.normalizedSellerSku || payload.sellerSku || payload.sku,
  );
  const businessMonth = payload.businessMonth || null;
  const occurredAtDate = normalizeOccurredAtDate(payload.occurredAt || payload.orderDate);
  const insufficientReasons: string[] = [];

  if (sourceType !== 'AMAZON_ORDER_CSV' && sourceType !== 'AMAZON_ORDER_SP_API') {
    insufficientReasons.push('UNSUPPORTED_SOURCE_TYPE');
  }

  if (!amazonOrderId) {
    insufficientReasons.push('MISSING_AMAZON_ORDER_ID');
  }

  if (!normalizedSellerSku) {
    insufficientReasons.push('MISSING_NORMALIZED_SELLER_SKU');
  }

  if (!businessMonth) {
    insufficientReasons.push('MISSING_BUSINESS_MONTH');
  }

  const canonicalKey =
    insufficientReasons.length === 0
      ? [
          'amazon-order-v1',
          'store-orders',
          amazonOrderId,
          normalizedSellerSku,
          businessMonth,
        ].join('|')
      : null;

  return {
    version: AMAZON_SP_API_SANDBOX_CSV_DEDUPE_BOUNDARY_VERSION,
    module: 'store-orders',
    sourceType,
    amazonOrderId,
    normalizedSellerSku,
    businessMonth,
    quantity: payload.quantity,
    grossAmount: payload.grossAmount,
    occurredAtDate,
    canonicalKey,
    insufficientReasons,
  };
}

export function compareAmazonOrderCsvAndSpApiDedupeKeys(args: {
  csvPayload: AmazonOrderNormalizedPayload;
  spApiPayload: AmazonOrderNormalizedPayload;
}): AmazonOrderCrossSourceDedupeComparison {
  const boundary = getAmazonSpApiSandboxCsvDedupeBoundary();

  if (boundary.currentPolicy.crossSourcePersistAllowed !== false) {
    throw new Error('Step117-C violation: cross-source persistence must remain blocked.');
  }

  const csvKey = buildAmazonOrderCrossSourceDedupeKey({ payload: args.csvPayload });
  const spApiKey = buildAmazonOrderCrossSourceDedupeKey({ payload: args.spApiPayload });
  const warnings: string[] = [];

  if (csvKey.sourceType !== 'AMAZON_ORDER_CSV') {
    warnings.push('LEFT_PAYLOAD_NOT_CSV');
  }

  if (spApiKey.sourceType !== 'AMAZON_ORDER_SP_API') {
    warnings.push('RIGHT_PAYLOAD_NOT_SP_API');
  }

  if (csvKey.insufficientReasons.length || spApiKey.insufficientReasons.length) {
    return {
      version: AMAZON_SP_API_SANDBOX_CSV_DEDUPE_BOUNDARY_VERSION,
      decision: 'INSUFFICIENT_KEYS',
      sameCanonicalKey: false,
      sameQuantity: false,
      sameGrossAmount: false,
      sameOccurredAtDate: false,
      csvKey,
      spApiKey,
      warnings,
    };
  }

  const sameCanonicalKey = csvKey.canonicalKey === spApiKey.canonicalKey;
  const sameQuantity = csvKey.quantity === spApiKey.quantity;
  const sameGrossAmount = csvKey.grossAmount === spApiKey.grossAmount;
  const sameOccurredAtDate = csvKey.occurredAtDate === spApiKey.occurredAtDate;

  if (sameCanonicalKey && (!sameQuantity || !sameGrossAmount || !sameOccurredAtDate)) {
    warnings.push('SAME_CANONICAL_KEY_WITH_AMOUNT_OR_DATE_DIFFERENCE');
  }

  return {
    version: AMAZON_SP_API_SANDBOX_CSV_DEDUPE_BOUNDARY_VERSION,
    decision: sameCanonicalKey
      ? 'SAME_ORDER_ITEM_CANDIDATE'
      : 'DIFFERENT_ORDER_ITEM',
    sameCanonicalKey,
    sameQuantity,
    sameGrossAmount,
    sameOccurredAtDate,
    csvKey,
    spApiKey,
    warnings,
  };
}

export function assertAmazonSpApiSandboxCsvDedupeBoundary(): AmazonOrderCrossSourceDedupeBoundary {
  const boundary = getAmazonSpApiSandboxCsvDedupeBoundary();

  if (boundary.currentPolicy.crossSourcePersistAllowed !== false) {
    throw new Error('Step117-C dedupe violation: cross-source persistence must remain disabled.');
  }

  if (boundary.currentPolicy.crossSourceTransactionCommitAllowed !== false) {
    throw new Error('Step117-C dedupe violation: cross-source transaction commit must remain disabled.');
  }

  if (boundary.currentPolicy.crossSourceInventoryDeductionAllowed !== false) {
    throw new Error('Step117-C dedupe violation: cross-source inventory deduction must remain disabled.');
  }

  if (boundary.csvVsSpApiPolicy.sameCandidateMustNotAutoCommitTwice !== true) {
    throw new Error('Step117-C dedupe violation: same candidate must not auto-commit twice.');
  }

  if (boundary.futurePersistenceRequirement.requiresExistingTransactionLookupByCanonicalKey !== true) {
    throw new Error('Step117-C dedupe violation: future Transaction lookup requirement missing.');
  }

  if (boundary.futurePersistenceRequirement.requiresManualConflictReviewForAmountMismatch !== true) {
    throw new Error('Step117-C dedupe violation: manual conflict review requirement missing.');
  }

  return boundary;
}
