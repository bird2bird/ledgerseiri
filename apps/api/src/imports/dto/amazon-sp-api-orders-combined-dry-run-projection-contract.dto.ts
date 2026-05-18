import type {
  AmazonSpApiOrdersTransactionDryRunProjectionResult,
} from './amazon-sp-api-orders-transaction-dry-run-projection-contract.dto';
import type {
  AmazonSpApiOrdersInventoryDryRunProjectionResult,
} from './amazon-sp-api-orders-inventory-dry-run-projection-contract.dto';

export type AmazonSpApiOrdersCombinedDryRunProjectionRequest = {
  importJobId?: string;
  dryRun?: boolean;
};

export type AmazonSpApiOrdersCombinedDryRunProjectionResult = {
  source: 'amazon-sp-api-orders-combined-dry-run-projection';
  routeImplementedNow: true;
  route: '/api/imports/amazon-sp-api/orders/combined-dry-run-projection';
  guardedBy: 'JwtAuthGuard';
  companyScoped: true;
  dryRun: true;
  importJobId: string;
  writesDatabase: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;
  createsTransactionNow: false;
  createsInventoryMovementNow: false;
  historicalSyncNow: false;
  transaction: AmazonSpApiOrdersTransactionDryRunProjectionResult;
  inventory: AmazonSpApiOrdersInventoryDryRunProjectionResult;
  combined: {
    transactionDraftRows: number;
    inventoryMovementDraftRows: number;
    transactionExcludedRows: number;
    inventoryExcludedRows: number;
    amountTotal: number;
    quantityTotal: number;
    blockers: string[];
    warnings: string[];
  };
};

export function assertAmazonSpApiOrdersCombinedDryRunProjectionContract(
  value: AmazonSpApiOrdersCombinedDryRunProjectionResult,
): AmazonSpApiOrdersCombinedDryRunProjectionResult {
  if (value.source !== 'amazon-sp-api-orders-combined-dry-run-projection') {
    throw new Error('STEP151_Q_COMBINED_PROJECTION_SOURCE_MISMATCH');
  }

  if (value.dryRun !== true) {
    throw new Error('STEP151_Q_COMBINED_PROJECTION_MUST_REMAIN_DRY_RUN');
  }

  if (
    value.writesDatabase !== false ||
    value.transactionWriteNow !== false ||
    value.inventoryWriteNow !== false ||
    value.createsTransactionNow !== false ||
    value.createsInventoryMovementNow !== false ||
    value.historicalSyncNow !== false
  ) {
    throw new Error('STEP151_Q_COMBINED_PROJECTION_WRITE_BOUNDARY_DRIFT');
  }

  if (value.transaction.createsTransactionNow !== false || value.inventory.createsInventoryMovementNow !== false) {
    throw new Error('STEP151_Q_CHILD_PROJECTION_WRITE_BOUNDARY_DRIFT');
  }

  return value;
}
