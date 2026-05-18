import type {
  AmazonSpApiOrdersCombinedDryRunProjectionResult,
} from './amazon-sp-api-orders-combined-dry-run-projection-contract.dto';
import type {
  AmazonSpApiOrdersTransactionDraftProjection,
} from './amazon-sp-api-orders-transaction-dry-run-projection-contract.dto';
import type {
  AmazonSpApiOrdersInventoryMovementDraftProjection,
} from './amazon-sp-api-orders-inventory-dry-run-projection-contract.dto';

export type AmazonSpApiOrdersFinalCommitReviewRequest = {
  importJobId?: string;
  dryRun?: boolean;
  reviewOnly?: boolean;
};

export type AmazonSpApiOrdersFinalCommitReviewResult = {
  source: 'amazon-sp-api-orders-final-commit-review';
  routeImplementedNow: true;
  route: '/api/imports/amazon-sp-api/orders/final-commit-review';
  guardedBy: 'JwtAuthGuard';
  companyScoped: true;
  dryRun: true;
  reviewOnly: true;
  importJobId: string;

  writesDatabase: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;
  createsTransactionNow: false;
  createsInventoryMovementNow: false;
  historicalSyncNow: false;

  requiresExplicitConfirmation: true;
  finalCanCommit: boolean;

  willCreateTransactionRows: number;
  willCreateInventoryMovementRows: number;
  blockedRows: number;
  transactionExcludedRows: number;
  inventoryExcludedRows: number;
  amountTotal: number;
  quantityTotal: number;

  blockers: string[];
  warnings: string[];

  transactionDraftsPreview: AmazonSpApiOrdersTransactionDraftProjection[];
  inventoryDraftsPreview: AmazonSpApiOrdersInventoryMovementDraftProjection[];

  combined: AmazonSpApiOrdersCombinedDryRunProjectionResult;
};

export function assertAmazonSpApiOrdersFinalCommitReviewContract(
  value: AmazonSpApiOrdersFinalCommitReviewResult,
): AmazonSpApiOrdersFinalCommitReviewResult {
  if (value.source !== 'amazon-sp-api-orders-final-commit-review') {
    throw new Error('STEP151_R_FINAL_COMMIT_REVIEW_SOURCE_MISMATCH');
  }

  if (value.routeImplementedNow !== true) {
    throw new Error('STEP151_R_FINAL_COMMIT_REVIEW_ROUTE_NOT_IMPLEMENTED');
  }

  if (value.dryRun !== true || value.reviewOnly !== true) {
    throw new Error('STEP151_R_FINAL_COMMIT_REVIEW_MUST_REMAIN_REVIEW_ONLY_DRY_RUN');
  }

  if (
    value.writesDatabase !== false ||
    value.transactionWriteNow !== false ||
    value.inventoryWriteNow !== false ||
    value.createsTransactionNow !== false ||
    value.createsInventoryMovementNow !== false ||
    value.historicalSyncNow !== false
  ) {
    throw new Error('STEP151_R_FINAL_COMMIT_REVIEW_WRITE_BOUNDARY_DRIFT');
  }

  if (value.requiresExplicitConfirmation !== true) {
    throw new Error('STEP151_R_FINAL_COMMIT_REVIEW_EXPLICIT_CONFIRMATION_REQUIRED');
  }

  if (!Array.isArray(value.transactionDraftsPreview)) {
    throw new Error('STEP151_R_FINAL_COMMIT_REVIEW_TRANSACTION_PREVIEW_MUST_BE_ARRAY');
  }

  if (!Array.isArray(value.inventoryDraftsPreview)) {
    throw new Error('STEP151_R_FINAL_COMMIT_REVIEW_INVENTORY_PREVIEW_MUST_BE_ARRAY');
  }

  if (value.combined.writesDatabase !== false) {
    throw new Error('STEP151_R_FINAL_COMMIT_REVIEW_COMBINED_WRITE_BOUNDARY_DRIFT');
  }

  if (
    value.combined.createsTransactionNow !== false ||
    value.combined.createsInventoryMovementNow !== false ||
    value.combined.historicalSyncNow !== false
  ) {
    throw new Error('STEP151_R_FINAL_COMMIT_REVIEW_CHILD_WRITE_BOUNDARY_DRIFT');
  }

  return value;
}
