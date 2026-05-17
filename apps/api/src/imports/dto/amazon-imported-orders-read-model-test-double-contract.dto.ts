export type AmazonImportedOrdersTestDoubleImportJob = {
  id: string;
  companyId: string;
  domain: 'income' | string;
  module: 'store-orders' | string | null;
  sourceType: 'amazon-sp-api-orders' | string | null;
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | string;
  importedAt: string | null;
  createdAt: string;
};

export type AmazonImportedOrdersTestDoubleStagingRow = {
  id: string;
  companyId: string;
  importJobId: string;
  module: 'store-orders' | string;
  rowNo: number;
  businessMonth: string | null;
  rawPayloadJson: Record<string, unknown>;
  normalizedPayloadJson: Record<string, unknown>;
  matchStatus: string;
  matchReason: string | null;
  targetEntityType: string | null;
  targetEntityId: string | null;
  createdAt: string;
};

export type AmazonImportedOrdersReadModelTestDoubleImportJob = AmazonImportedOrdersTestDoubleImportJob;
export type AmazonImportedOrdersReadModelTestDoubleStagingRow = AmazonImportedOrdersTestDoubleStagingRow;

export type AmazonImportedOrdersReadModelTestDoubleFilters = {
  companyId: string;
  orderId?: string;
  status?: string;
  content?: string;
  limit?: number;
};

export type AmazonImportedOrdersReadModelTestDoubleOrderRow = {
  orderId: string;
  purchaseDate: string | null;
  content: string;
  amount: string | null;
  currency: string | null;
  service: 'Amazon.co.jp';
  status: string;
  itemCount: number;
  marketplace: string | null;
  skuStatus: string;
  importStatus: string;
  importJobId: string | null;
  stagingRowIds: string[];
};

export type AmazonImportedOrdersReadModelTestDoubleItemRow = {
  orderItemId: string | null;
  sellerSku: string | null;
  asin: string | null;
  title: string | null;
  quantity: number | null;
  itemPrice: string | null;
  itemTax: string | null;
  shippingPrice: string | null;
  shippingTax: string | null;
  promotionDiscount: string | null;
  promotionDiscountTax: string | null;
  currency: string | null;
  skuReadiness: string;
};

export type AmazonImportedOrdersReadModelTestDoubleDetail = {
  order: AmazonImportedOrdersReadModelTestDoubleOrderRow;
  items: AmazonImportedOrdersReadModelTestDoubleItemRow[];
  taxFeeSummary: {
    itemTaxTotal: string | null;
    shippingTaxTotal: string | null;
    promotionDiscountTotal: string | null;
    promotionDiscountTaxTotal: string | null;
    amazonFeeTotal: string | null;
    fbaFeeTotal: string | null;
    settlementAmount: string | null;
    currency: string | null;
    financePermissionRequired: true;
  };
  inventoryReadiness: {
    linkedRows: number;
    aliasLinkedRows: number;
    unresolvedRows: number;
    auditHref: string | null;
  };
  importMetadata: {
    importJobId: string | null;
    importedAt: string | null;
    stagingRowIds: string[];
    sourceType: 'amazon-sp-api-orders';
  };
};

export type AmazonImportedOrdersReadModelTestDoubleListResult = {
  source: 'amazon-imported-orders-read-model-test-double';
  step: 'Step150-JK';
  readOnly: true;
  testDoubleOnly: true;
  orders: AmazonImportedOrdersReadModelTestDoubleOrderRow[];
  summary: {
    totalOrders: number;
    totalItems: number;
    unresolvedSkuCount: number;
    linkedSkuCount: number;
    aliasLinkedSkuCount: number;
    currency: string | null;
    amountTotal: string | null;
  };
  boundaries: {
    callsAmazon: false;
    queriesPrisma: false;
    createsImportJob: false;
    createsSyncJob: false;
    createsSyncSegment: false;
    writesDatabase: false;
    writesTransaction: false;
    writesInventoryMovement: false;
    opensControllerRuntime: false;
  };
};

export type AmazonImportedOrdersReadModelTestDoubleDetailResult = {
  source: 'amazon-imported-order-detail-read-model-test-double';
  step: 'Step150-JK';
  readOnly: true;
  testDoubleOnly: true;
  detail: AmazonImportedOrdersReadModelTestDoubleDetail | null;
  boundaries: AmazonImportedOrdersReadModelTestDoubleListResult['boundaries'];
};

export function buildAmazonImportedOrdersReadModelTestDoubleBoundaries(): AmazonImportedOrdersReadModelTestDoubleListResult['boundaries'] {
  return {
    callsAmazon: false,
    queriesPrisma: false,
    createsImportJob: false,
    createsSyncJob: false,
    createsSyncSegment: false,
    writesDatabase: false,
    writesTransaction: false,
    writesInventoryMovement: false,
    opensControllerRuntime: false,
  };
}

export function assertAmazonImportedOrdersReadModelTestDoubleBoundaries(boundaries: AmazonImportedOrdersReadModelTestDoubleListResult['boundaries']): true {
  if (boundaries.callsAmazon !== false) throw new Error('Step150-JK boundary violation: callsAmazon must remain false.');
  if (boundaries.queriesPrisma !== false) throw new Error('Step150-JK boundary violation: queriesPrisma must remain false.');
  if (boundaries.createsImportJob !== false) throw new Error('Step150-JK boundary violation: createsImportJob must remain false.');
  if (boundaries.createsSyncJob !== false || boundaries.createsSyncSegment !== false) {
    throw new Error('Step150-JK boundary violation: SyncJob/SyncSegment creation must remain false.');
  }
  if (boundaries.writesDatabase !== false || boundaries.writesTransaction !== false || boundaries.writesInventoryMovement !== false) {
    throw new Error('Step150-JK boundary violation: write boundaries must remain false.');
  }
  if (boundaries.opensControllerRuntime !== false) throw new Error('Step150-JK boundary violation: controller runtime must remain closed.');
  return true as const;
}
