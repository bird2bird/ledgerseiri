export type AmazonSpApiOrdersTransactionDryRunProjectionRequest = {
  importJobId?: string;
  dryRun?: boolean;
};

export type AmazonSpApiOrdersTransactionDraftProjection = {
  stagingRowId: string;
  rowNo: number;
  transactionDate: string;
  businessMonth: string | null;
  amount: number;
  currency: string;
  direction: 'income';
  transactionType: 'amazon-order-item-sale';
  counterparty: string;
  source: 'amazon-sp-api-orders';
  sourceOrderId: string | null;
  sourceOrderItemId: string | null;
  sellerSku: string | null;
  asin: string | null;
  targetEntityType: string | null;
  targetEntityId: string | null;
  evidenceType: 'ImportStagingRow';
  evidenceImportJobId: string;
  evidenceStagingRowId: string;
  evidenceSourceRowNo: number;
  dedupeHash: string;
};

export type AmazonSpApiOrdersTransactionDryRunExcludedRow = {
  stagingRowId: string;
  rowNo: number;
  amazonOrderId: string | null;
  orderItemId: string | null;
  sellerSku: string | null;
  readiness: 'READY' | 'BLOCKED';
  excludedReasons: string[];
  warnings: string[];
};

export type AmazonSpApiOrdersTransactionDryRunProjectionResult = {
  source: 'amazon-sp-api-orders-transaction-dry-run-projection';
  routeImplementedNow: true;
  route: '/api/imports/amazon-sp-api/orders/transaction-dry-run-projection';
  guardedBy: 'JwtAuthGuard';
  companyScoped: true;
  dryRun: true;
  importJobId: string;
  readinessSource: 'amazon-sp-api-orders-staging-commit-readiness';
  writesDatabase: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;
  createsTransactionNow: false;
  createsInventoryMovementNow: false;
  historicalSyncNow: false;
  totalReadinessRows: number;
  projectedTransactionRows: number;
  excludedRows: number;
  amountTotal: number;
  currency: string;
  drafts: AmazonSpApiOrdersTransactionDraftProjection[];
  excluded: AmazonSpApiOrdersTransactionDryRunExcludedRow[];
  blockers: string[];
  warnings: string[];
};

export function assertAmazonSpApiOrdersTransactionDryRunProjectionContract(
  value: AmazonSpApiOrdersTransactionDryRunProjectionResult,
): AmazonSpApiOrdersTransactionDryRunProjectionResult {
  if (value.source !== 'amazon-sp-api-orders-transaction-dry-run-projection') {
    throw new Error('STEP151_O_TRANSACTION_PROJECTION_SOURCE_MISMATCH');
  }

  if (value.routeImplementedNow !== true) {
    throw new Error('STEP151_O_TRANSACTION_PROJECTION_ROUTE_NOT_IMPLEMENTED');
  }

  if (value.dryRun !== true) {
    throw new Error('STEP151_O_TRANSACTION_PROJECTION_MUST_REMAIN_DRY_RUN');
  }

  if (
    value.writesDatabase !== false ||
    value.transactionWriteNow !== false ||
    value.inventoryWriteNow !== false ||
    value.createsTransactionNow !== false ||
    value.createsInventoryMovementNow !== false ||
    value.historicalSyncNow !== false
  ) {
    throw new Error('STEP151_O_TRANSACTION_PROJECTION_WRITE_BOUNDARY_DRIFT');
  }

  if (!Array.isArray(value.drafts)) {
    throw new Error('STEP151_O_TRANSACTION_PROJECTION_DRAFTS_MUST_BE_ARRAY');
  }

  if (!Array.isArray(value.excluded)) {
    throw new Error('STEP151_O_TRANSACTION_PROJECTION_EXCLUDED_MUST_BE_ARRAY');
  }

  return value;
}
