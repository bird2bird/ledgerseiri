import type {
  AmazonSpApiOrdersFinalCommitReviewResult,
} from './amazon-sp-api-orders-final-commit-review-contract.dto';

export type AmazonSpApiOrdersTransactionCommitRequest = {
  importJobId?: string;
  explicitOperatorConfirmation?: boolean;
  finalReviewAccepted?: boolean;
};

export type AmazonSpApiOrdersTransactionCommitCreatedRow = {
  stagingRowId: string;
  sourceRowNo: number;
  transactionId: string;
  dedupeHash: string;
  externalRef: string;
  amount: number;
  currency: string;
  storeId: string;
};

export type AmazonSpApiOrdersTransactionCommitSkippedRow = {
  stagingRowId: string;
  sourceRowNo: number;
  dedupeHash: string | null;
  reason: string;
};

export type AmazonSpApiOrdersTransactionCommitResult = {
  source: 'amazon-sp-api-orders-transaction-commit';
  routeImplementedNow: true;
  route: '/api/imports/amazon-sp-api/orders/transaction-commit';
  guardedBy: 'JwtAuthGuard';
  companyScoped: true;

  importJobId: string;
  explicitOperatorConfirmation: true;
  finalReviewAccepted: true;

  finalReview: AmazonSpApiOrdersFinalCommitReviewResult;

  writesDatabase: true;
  transactionWriteNow: true;
  inventoryWriteNow: false;
  createsTransactionNow: true;
  createsInventoryMovementNow: false;
  createsExpenseTransactionNow: false;
  touchesInventoryNow: false;
  historicalSyncNow: false;
  settlementOrFeeImportNow: false;
  bankReconciliationNow: false;

  createdTransactionRows: number;
  skippedRows: number;
  duplicateSkippedRows: number;
  amountTotal: number;
  currency: 'JPY';
  created: AmazonSpApiOrdersTransactionCommitCreatedRow[];
  skipped: AmazonSpApiOrdersTransactionCommitSkippedRow[];
  blockers: string[];
  warnings: string[];
};

export function assertAmazonSpApiOrdersTransactionCommitContract(
  value: AmazonSpApiOrdersTransactionCommitResult,
): AmazonSpApiOrdersTransactionCommitResult {
  if (value.source !== 'amazon-sp-api-orders-transaction-commit') {
    throw new Error('STEP151_S_TRANSACTION_COMMIT_SOURCE_MISMATCH');
  }

  if (value.route !== '/api/imports/amazon-sp-api/orders/transaction-commit') {
    throw new Error('STEP151_S_TRANSACTION_COMMIT_ROUTE_MISMATCH');
  }

  if (value.explicitOperatorConfirmation !== true || value.finalReviewAccepted !== true) {
    throw new Error('STEP151_S_TRANSACTION_COMMIT_CONFIRMATION_REQUIRED');
  }

  if (
    value.writesDatabase !== true ||
    value.transactionWriteNow !== true ||
    value.createsTransactionNow !== true
  ) {
    throw new Error('STEP151_S_TRANSACTION_COMMIT_TRANSACTION_WRITE_EXPECTED');
  }

  if (
    value.inventoryWriteNow !== false ||
    value.createsInventoryMovementNow !== false ||
    value.createsExpenseTransactionNow !== false ||
    value.touchesInventoryNow !== false ||
    value.historicalSyncNow !== false ||
    value.settlementOrFeeImportNow !== false ||
    value.bankReconciliationNow !== false
  ) {
    throw new Error('STEP151_S_TRANSACTION_COMMIT_SCOPE_DRIFT');
  }

  if (value.finalReview.finalCanCommit !== true) {
    throw new Error('STEP151_S_TRANSACTION_COMMIT_FINAL_REVIEW_NOT_COMMITTABLE');
  }

  if (value.finalReview.writesDatabase !== false) {
    throw new Error('STEP151_S_TRANSACTION_COMMIT_FINAL_REVIEW_MUST_REMAIN_DRY_RUN');
  }

  if (!Array.isArray(value.created) || !Array.isArray(value.skipped)) {
    throw new Error('STEP151_S_TRANSACTION_COMMIT_ROWS_MUST_BE_ARRAYS');
  }

  return value;
}
