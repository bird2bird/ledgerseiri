export type AmazonSpApiOrdersInventoryDryRunProjectionRequest = {
  importJobId?: string;
  dryRun?: boolean;
};

export type AmazonSpApiOrdersInventoryMovementDraftProjection = {
  stagingRowId: string;
  rowNo: number;
  movementDate: string;
  businessMonth: string | null;
  productSkuId: string;
  productSkuCode: string | null;
  sellerSku: string | null;
  asin: string | null;
  quantity: number;
  movementType: 'SALE';
  direction: 'OUT';
  source: 'amazon-sp-api-orders';
  sourceOrderId: string | null;
  sourceOrderItemId: string | null;
  evidenceType: 'ImportStagingRow';
  evidenceImportJobId: string;
  evidenceStagingRowId: string;
  evidenceSourceRowNo: number;
  dedupeKey: string;
};

export type AmazonSpApiOrdersInventoryDryRunExcludedRow = {
  stagingRowId: string;
  rowNo: number;
  amazonOrderId: string | null;
  orderItemId: string | null;
  sellerSku: string | null;
  readiness: 'READY' | 'BLOCKED';
  excludedReasons: string[];
  warnings: string[];
};

export type AmazonSpApiOrdersInventoryDryRunProjectionResult = {
  source: 'amazon-sp-api-orders-inventory-dry-run-projection';
  routeImplementedNow: true;
  route: '/api/imports/amazon-sp-api/orders/inventory-dry-run-projection';
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
  projectedInventoryMovementRows: number;
  excludedRows: number;
  quantityTotal: number;
  drafts: AmazonSpApiOrdersInventoryMovementDraftProjection[];
  excluded: AmazonSpApiOrdersInventoryDryRunExcludedRow[];
  blockers: string[];
  warnings: string[];
};

export function assertAmazonSpApiOrdersInventoryDryRunProjectionContract(
  value: AmazonSpApiOrdersInventoryDryRunProjectionResult,
): AmazonSpApiOrdersInventoryDryRunProjectionResult {
  if (value.source !== 'amazon-sp-api-orders-inventory-dry-run-projection') {
    throw new Error('STEP151_P_INVENTORY_PROJECTION_SOURCE_MISMATCH');
  }

  if (value.routeImplementedNow !== true) {
    throw new Error('STEP151_P_INVENTORY_PROJECTION_ROUTE_NOT_IMPLEMENTED');
  }

  if (value.dryRun !== true) {
    throw new Error('STEP151_P_INVENTORY_PROJECTION_MUST_REMAIN_DRY_RUN');
  }

  if (
    value.writesDatabase !== false ||
    value.transactionWriteNow !== false ||
    value.inventoryWriteNow !== false ||
    value.createsTransactionNow !== false ||
    value.createsInventoryMovementNow !== false ||
    value.historicalSyncNow !== false
  ) {
    throw new Error('STEP151_P_INVENTORY_PROJECTION_WRITE_BOUNDARY_DRIFT');
  }

  if (!Array.isArray(value.drafts)) {
    throw new Error('STEP151_P_INVENTORY_PROJECTION_DRAFTS_MUST_BE_ARRAY');
  }

  if (!Array.isArray(value.excluded)) {
    throw new Error('STEP151_P_INVENTORY_PROJECTION_EXCLUDED_MUST_BE_ARRAY');
  }

  return value;
}
