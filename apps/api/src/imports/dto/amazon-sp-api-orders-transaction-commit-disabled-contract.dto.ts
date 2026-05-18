import type {
  AmazonSpApiOrdersFinalCommitReviewResult,
} from './amazon-sp-api-orders-final-commit-review-contract.dto';

export type AmazonSpApiOrdersTransactionCommitDisabledRequest = {
  importJobId?: string;
  explicitOperatorConfirmation?: boolean;
  finalReviewAccepted?: boolean;
  dryRun?: boolean;
};

export type AmazonSpApiOrdersTransactionCommitDisabledResult = {
  source: 'amazon-sp-api-orders-transaction-commit-disabled';
  routeImplementedNow: true;
  route: '/api/imports/amazon-sp-api/orders/transaction-commit';
  guardedBy: 'JwtAuthGuard';
  companyScoped: true;
  disabled: true;
  accepted: false;
  reason: 'STEP151_S_TRANSACTION_COMMIT_DISABLED_UNTIL_REAL_WRITE_STEP';

  importJobId: string;
  explicitOperatorConfirmation: boolean;
  finalReviewAccepted: boolean;

  requiresExplicitOperatorConfirmation: true;
  requiresFinalReviewAccepted: true;
  requiresFinalReviewCanCommit: true;

  finalReview: AmazonSpApiOrdersFinalCommitReviewResult;

  wouldCreateTransactionRows: number;
  wouldCreateIncomeTransactionRows: number;
  wouldLinkImportJob: true;
  wouldUseImportStagingRowsAsEvidence: true;
  wouldUseDedupeHash: true;

  writesDatabase: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;
  createsTransactionNow: false;
  createsInventoryMovementNow: false;
  createsExpenseTransactionNow: false;
  touchesInventoryNow: false;
  historicalSyncNow: false;
  settlementOrFeeImportNow: false;
  bankReconciliationNow: false;
};

export function assertAmazonSpApiOrdersTransactionCommitDisabledContract(
  value: AmazonSpApiOrdersTransactionCommitDisabledResult,
): AmazonSpApiOrdersTransactionCommitDisabledResult {
  if (value.source !== 'amazon-sp-api-orders-transaction-commit-disabled') {
    throw new Error('STEP151_S_TRANSACTION_COMMIT_DISABLED_SOURCE_MISMATCH');
  }

  if (value.route !== '/api/imports/amazon-sp-api/orders/transaction-commit') {
    throw new Error('STEP151_S_TRANSACTION_COMMIT_DISABLED_ROUTE_MISMATCH');
  }

  if (value.disabled !== true || value.accepted !== false) {
    throw new Error('STEP151_S_TRANSACTION_COMMIT_MUST_REMAIN_DISABLED_IN_STEP_S_A');
  }

  if (
    value.requiresExplicitOperatorConfirmation !== true ||
    value.requiresFinalReviewAccepted !== true ||
    value.requiresFinalReviewCanCommit !== true
  ) {
    throw new Error('STEP151_S_TRANSACTION_COMMIT_CONFIRMATION_GUARDS_REQUIRED');
  }

  if (
    value.writesDatabase !== false ||
    value.transactionWriteNow !== false ||
    value.inventoryWriteNow !== false ||
    value.createsTransactionNow !== false ||
    value.createsInventoryMovementNow !== false ||
    value.createsExpenseTransactionNow !== false ||
    value.touchesInventoryNow !== false ||
    value.historicalSyncNow !== false ||
    value.settlementOrFeeImportNow !== false ||
    value.bankReconciliationNow !== false
  ) {
    throw new Error('STEP151_S_TRANSACTION_COMMIT_DISABLED_WRITE_BOUNDARY_DRIFT');
  }

  if (value.finalReview.writesDatabase !== false) {
    throw new Error('STEP151_S_TRANSACTION_COMMIT_FINAL_REVIEW_WRITE_BOUNDARY_DRIFT');
  }

  if (
    value.finalReview.createsTransactionNow !== false ||
    value.finalReview.createsInventoryMovementNow !== false
  ) {
    throw new Error('STEP151_S_TRANSACTION_COMMIT_FINAL_REVIEW_CHILD_WRITE_BOUNDARY_DRIFT');
  }

  return value;
}
