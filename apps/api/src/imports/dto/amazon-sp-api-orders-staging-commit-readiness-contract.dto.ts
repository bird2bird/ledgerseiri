export type AmazonSpApiOrdersStagingCommitReadinessRequest = {
  importJobId?: string;
  dryRun?: boolean;
};

export type AmazonSpApiOrdersStagingCommitReadinessRow = {
  stagingRowId: string;
  rowNo: number;
  businessMonth: string | null;
  matchStatus: string;
  matchReason: string | null;
  dedupeHash: string | null;
  amazonOrderId: string | null;
  orderItemId: string | null;
  sellerSku: string | null;
  asin: string | null;
  itemPriceAmount: number | null;
  quantityOrdered: number | null;
  targetEntityType: string | null;
  targetEntityId: string | null;
  readiness: 'READY' | 'BLOCKED';
  blockers: string[];
  warnings: string[];
};

export type AmazonSpApiOrdersStagingCommitReadinessResult = {
  source: 'amazon-sp-api-orders-staging-commit-readiness';
  routeImplementedNow: true;
  route: '/api/imports/amazon-sp-api/orders/staging-commit-readiness';
  guardedBy: 'JwtAuthGuard';
  companyScoped: true;
  dryRun: true;
  writesDatabase: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;
  importJobId: string;
  importJobFound: boolean;
  sourceType: string | null;
  status: string | null;
  totalRows: number;
  readyRows: number;
  blockedRows: number;
  duplicateRows: number;
  existingTransactionRows: number;
  existingInventoryMovementRows: number;
  unresolvedSkuRows: number;
  missingAmountRows: number;
  missingOrderIdentityRows: number;
  canCommit: boolean;
  commitBlockedReasons: string[];
  rows: AmazonSpApiOrdersStagingCommitReadinessRow[];
};

export function assertAmazonSpApiOrdersStagingCommitReadinessContract(
  value: AmazonSpApiOrdersStagingCommitReadinessResult,
): AmazonSpApiOrdersStagingCommitReadinessResult {
  if (value.source !== 'amazon-sp-api-orders-staging-commit-readiness') {
    throw new Error('STEP141_G1_CONTRACT_SOURCE_MISMATCH');
  }

  if (value.routeImplementedNow !== true) {
    throw new Error('STEP141_G1_CONTRACT_ROUTE_NOT_IMPLEMENTED');
  }

  if (value.dryRun !== true) {
    throw new Error('STEP141_G1_CONTRACT_MUST_REMAIN_DRY_RUN');
  }

  if (
    value.writesDatabase !== false ||
    value.transactionWriteNow !== false ||
    value.inventoryWriteNow !== false
  ) {
    throw new Error('STEP141_G1_CONTRACT_WRITE_BOUNDARY_DRIFT');
  }

  if (!Array.isArray(value.rows)) {
    throw new Error('STEP141_G1_CONTRACT_ROWS_MUST_BE_ARRAY');
  }

  return value;
}
