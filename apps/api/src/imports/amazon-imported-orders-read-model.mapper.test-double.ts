import {
  assertAmazonImportedOrdersReadModelTestDoubleBoundaries,
  buildAmazonImportedOrdersReadModelTestDoubleBoundaries,
  type AmazonImportedOrdersReadModelTestDoubleDetail,
  type AmazonImportedOrdersReadModelTestDoubleDetailResult,
  type AmazonImportedOrdersReadModelTestDoubleFilters,
  type AmazonImportedOrdersReadModelTestDoubleImportJob,
  type AmazonImportedOrdersReadModelTestDoubleItemRow,
  type AmazonImportedOrdersReadModelTestDoubleListResult,
  type AmazonImportedOrdersReadModelTestDoubleOrderRow,
  type AmazonImportedOrdersTestDoubleStagingRow,
} from './dto/amazon-imported-orders-read-model-test-double-contract.dto';

type JsonLike = Record<string, unknown>;

function readPath(payload: JsonLike, candidates: string[]): unknown {
  for (const candidate of candidates) {
    const parts = candidate.split('.');
    let current: unknown = payload;

    for (const part of parts) {
      if (!current || typeof current !== 'object' || !(part in current)) {
        current = undefined;
        break;
      }
      current = (current as Record<string, unknown>)[part];
    }

    if (current !== undefined && current !== null && String(current).trim() !== '') {
      return current;
    }
  }

  return null;
}

function toNullableString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function toNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sumDecimalStrings(values: Array<string | null>): string | null {
  let total = 0;
  let found = false;

  for (const value of values) {
    if (value === null) continue;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) continue;
    total += parsed;
    found = true;
  }

  return found ? String(total) : null;
}

function deriveSkuReadiness(row: AmazonImportedOrdersTestDoubleStagingRow): string {
  if (row.matchStatus === 'SKU_LINKED_BY_PRODUCT_SKU_ALIAS') return 'alias-linked';
  if (row.matchStatus === 'SKU_LINKED' || row.targetEntityType === 'ProductSku') return 'linked';
  if (row.matchStatus === 'UNRESOLVED' || !row.targetEntityId) return 'unresolved';
  return row.matchStatus || 'read-model-pending';
}

function deriveOrderId(row: AmazonImportedOrdersTestDoubleStagingRow): string {
  const payload = row.normalizedPayloadJson;
  return (
    toNullableString(readPath(payload, ['amazonOrderId', 'AmazonOrderId', 'orderId', 'order.amazonOrderId'])) ||
    `staging-row:${row.id}`
  );
}

function mapItem(row: AmazonImportedOrdersTestDoubleStagingRow): AmazonImportedOrdersReadModelTestDoubleItemRow {
  const payload = row.normalizedPayloadJson;
  return {
    orderItemId: toNullableString(readPath(payload, ['orderItemId', 'OrderItemId', 'item.orderItemId'])),
    sellerSku: toNullableString(readPath(payload, ['sellerSku', 'SellerSKU', 'sku'])),
    asin: toNullableString(readPath(payload, ['asin', 'ASIN'])),
    title: toNullableString(readPath(payload, ['title', 'Title', 'productName'])),
    quantity: toNumberOrNull(readPath(payload, ['quantityOrdered', 'QuantityOrdered', 'quantity'])),
    itemPrice: toNullableString(readPath(payload, ['itemPrice.amount', 'ItemPrice.Amount', 'principal.amount', 'amount'])),
    itemTax: toNullableString(readPath(payload, ['itemTax.amount', 'ItemTax.Amount', 'tax.itemTax'])),
    shippingPrice: toNullableString(readPath(payload, ['shippingPrice.amount', 'ShippingPrice.Amount'])),
    shippingTax: toNullableString(readPath(payload, ['shippingTax.amount', 'ShippingTax.Amount', 'tax.shippingTax'])),
    promotionDiscount: toNullableString(readPath(payload, ['promotionDiscount.amount', 'PromotionDiscount.Amount'])),
    promotionDiscountTax: toNullableString(readPath(payload, ['promotionDiscountTax.amount', 'PromotionDiscountTax.Amount'])),
    currency: toNullableString(readPath(payload, ['currency', 'CurrencyCode', 'itemPrice.currencyCode', 'ItemPrice.CurrencyCode'])),
    skuReadiness: deriveSkuReadiness(row),
  };
}

function deriveOrderRow(input: {
  orderId: string;
  rows: AmazonImportedOrdersTestDoubleStagingRow[];
  importJob: AmazonImportedOrdersReadModelTestDoubleImportJob | null;
}): AmazonImportedOrdersReadModelTestDoubleOrderRow {
  const first = input.rows[0];
  const payload = first?.normalizedPayloadJson || {};
  const items = input.rows.map(mapItem);
  const linkedRows = items.filter((item) => item.skuReadiness === 'linked').length;
  const aliasLinkedRows = items.filter((item) => item.skuReadiness === 'alias-linked').length;
  const unresolvedRows = items.filter((item) => item.skuReadiness === 'unresolved').length;

  const firstTitle = items.find((item) => item.title)?.title;
  const content = input.rows.length > 1 && firstTitle
    ? `${firstTitle} 他${input.rows.length - 1}件`
    : firstTitle || 'Amazon注文';

  const amount =
    toNullableString(readPath(payload, ['orderTotal.amount', 'OrderTotal.Amount'])) ||
    sumDecimalStrings(items.map((item) => item.itemPrice));

  const currency =
    toNullableString(readPath(payload, ['currency', 'CurrencyCode', 'orderTotal.currencyCode', 'OrderTotal.CurrencyCode'])) ||
    items.find((item) => item.currency)?.currency ||
    null;

  const skuStatus =
    unresolvedRows > 0 ? 'unresolved' :
    aliasLinkedRows > 0 ? 'alias-linked' :
    linkedRows > 0 ? 'linked' :
    'read-model-pending';

  return {
    orderId: input.orderId,
    purchaseDate: toNullableString(readPath(payload, ['purchaseDate', 'PurchaseDate', 'order.purchaseDate'])),
    content,
    amount,
    currency,
    service: 'Amazon.co.jp',
    status: toNullableString(readPath(payload, ['orderStatus', 'OrderStatus', 'status'])) || first?.matchStatus || 'read-model-pending',
    itemCount: input.rows.length,
    marketplace: toNullableString(readPath(payload, ['marketplaceId', 'MarketplaceId', 'marketplaceName'])),
    skuStatus,
    importStatus: input.importJob?.status || 'read-model-pending',
    importJobId: input.importJob?.id || null,
    stagingRowIds: input.rows.map((row) => row.id),
  };
}

function groupRowsByOrderId(rows: AmazonImportedOrdersTestDoubleStagingRow[]): Map<string, AmazonImportedOrdersTestDoubleStagingRow[]> {
  const grouped = new Map<string, AmazonImportedOrdersTestDoubleStagingRow[]>();

  for (const row of rows) {
    const orderId = deriveOrderId(row);
    const existing = grouped.get(orderId) || [];
    existing.push(row);
    grouped.set(orderId, existing);
  }

  return grouped;
}

function filterRowsByCompanyAndJobs(input: {
  companyId: string;
  importJobs: AmazonImportedOrdersReadModelTestDoubleImportJob[];
  stagingRows: AmazonImportedOrdersTestDoubleStagingRow[];
}) {
  const jobById = new Map(
    input.importJobs
      .filter((job) =>
        job.companyId === input.companyId &&
        job.sourceType === 'amazon-sp-api-orders' &&
        job.module === 'store-orders' &&
        job.domain === 'income'
      )
      .map((job) => [job.id, job]),
  );

  const rows = input.stagingRows.filter((row) =>
    row.companyId === input.companyId &&
    row.module === 'store-orders' &&
    jobById.has(row.importJobId)
  );

  return { jobById, rows };
}

export function mapAmazonImportedOrdersTestDoubleList(input: {
  companyId: string;
  importJobs: AmazonImportedOrdersReadModelTestDoubleImportJob[];
  stagingRows: AmazonImportedOrdersTestDoubleStagingRow[];
  filters?: AmazonImportedOrdersReadModelTestDoubleFilters;
}): AmazonImportedOrdersReadModelTestDoubleListResult {
  const boundaries = buildAmazonImportedOrdersReadModelTestDoubleBoundaries();
  assertAmazonImportedOrdersReadModelTestDoubleBoundaries(boundaries);

  const { jobById, rows } = filterRowsByCompanyAndJobs(input);
  const grouped = groupRowsByOrderId(rows);
  let orders = Array.from(grouped.entries()).map(([orderId, orderRows]) =>
    deriveOrderRow({
      orderId,
      rows: orderRows.sort((a, b) => a.rowNo - b.rowNo),
      importJob: jobById.get(orderRows[0]?.importJobId || '') || null,
    }),
  );

  const filters = input.filters;
  if (filters?.orderId) {
    orders = orders.filter((order) => order.orderId.includes(filters.orderId || ''));
  }
  if (filters?.status) {
    orders = orders.filter((order) => order.status.includes(filters.status || ''));
  }
  if (filters?.content) {
    orders = orders.filter((order) => order.content.includes(filters.content || ''));
  }

  const limit = filters?.limit && filters.limit > 0 ? Math.min(Math.floor(filters.limit), 100) : 20;
  orders = orders.slice(0, limit);

  const totalItems = orders.reduce((sum, order) => sum + order.itemCount, 0);
  const unresolvedSkuCount = orders.filter((order) => order.skuStatus === 'unresolved').length;
  const linkedSkuCount = orders.filter((order) => order.skuStatus === 'linked').length;
  const aliasLinkedSkuCount = orders.filter((order) => order.skuStatus === 'alias-linked').length;
  const currency = orders.find((order) => order.currency)?.currency || null;
  const amountTotal = sumDecimalStrings(orders.map((order) => order.amount));

  return {
    source: 'amazon-imported-orders-read-model-test-double',
    step: 'Step150-JK',
    readOnly: true,
    testDoubleOnly: true,
    orders,
    summary: {
      totalOrders: orders.length,
      totalItems,
      unresolvedSkuCount,
      linkedSkuCount,
      aliasLinkedSkuCount,
      currency,
      amountTotal,
    },
    boundaries,
  };
}

export function mapAmazonImportedOrderDetailTestDouble(input: {
  companyId: string;
  orderId: string;
  importJobs: AmazonImportedOrdersReadModelTestDoubleImportJob[];
  stagingRows: AmazonImportedOrdersTestDoubleStagingRow[];
}): AmazonImportedOrdersReadModelTestDoubleDetailResult {
  const boundaries = buildAmazonImportedOrdersReadModelTestDoubleBoundaries();
  assertAmazonImportedOrdersReadModelTestDoubleBoundaries(boundaries);

  const { jobById, rows } = filterRowsByCompanyAndJobs(input);
  const grouped = groupRowsByOrderId(rows);
  const orderRows = grouped.get(input.orderId) || [];

  if (orderRows.length === 0) {
    return {
      source: 'amazon-imported-order-detail-read-model-test-double',
      step: 'Step150-JK',
      readOnly: true,
      testDoubleOnly: true,
      detail: null,
      boundaries,
    };
  }

  const sortedRows = orderRows.sort((a, b) => a.rowNo - b.rowNo);
  const importJob = jobById.get(sortedRows[0]?.importJobId || '') || null;
  const order = deriveOrderRow({ orderId: input.orderId, rows: sortedRows, importJob });
  const items = sortedRows.map(mapItem);

  const linkedRows = items.filter((item) => item.skuReadiness === 'linked').length;
  const aliasLinkedRows = items.filter((item) => item.skuReadiness === 'alias-linked').length;
  const unresolvedRows = items.filter((item) => item.skuReadiness === 'unresolved').length;
  const currency = order.currency || items.find((item) => item.currency)?.currency || null;

  const detail: AmazonImportedOrdersReadModelTestDoubleDetail = {
    order,
    items,
    taxFeeSummary: {
      itemTaxTotal: sumDecimalStrings(items.map((item) => item.itemTax)),
      shippingTaxTotal: sumDecimalStrings(items.map((item) => item.shippingTax)),
      promotionDiscountTotal: sumDecimalStrings(items.map((item) => item.promotionDiscount)),
      promotionDiscountTaxTotal: sumDecimalStrings(items.map((item) => item.promotionDiscountTax)),
      amazonFeeTotal: null,
      fbaFeeTotal: null,
      settlementAmount: null,
      currency,
      financePermissionRequired: true,
    },
    inventoryReadiness: {
      linkedRows,
      aliasLinkedRows,
      unresolvedRows,
      auditHref: unresolvedRows > 0 ? `/ja/app/inventory/audit?importJobId=${encodeURIComponent(importJob?.id || '')}` : null,
    },
    importMetadata: {
      importJobId: importJob?.id || null,
      importedAt: importJob?.importedAt || null,
      stagingRowIds: sortedRows.map((row) => row.id),
      sourceType: 'amazon-sp-api-orders',
    },
  };

  return {
    source: 'amazon-imported-order-detail-read-model-test-double',
    step: 'Step150-JK',
    readOnly: true,
    testDoubleOnly: true,
    detail,
    boundaries,
  };
}
