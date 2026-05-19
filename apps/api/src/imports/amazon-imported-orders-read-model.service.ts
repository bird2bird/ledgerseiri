import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export type AmazonImportedOrdersReadModelRangePreset = '7D' | '30D' | '90D' | '365D' | 'CUSTOM' | string;

export type AmazonImportedOrdersReadModelListArgs = {
  prisma: PrismaService;
  companyId: string;
  rangePreset?: AmazonImportedOrdersReadModelRangePreset;
  startDate?: string;
  endDate?: string;
  orderId?: string;
  status?: string;
  content?: string;
  minAmount?: number;
  maxAmount?: number;
  cursor?: string;
  limit?: number;
};

export type AmazonImportedOrdersReadModelOrderRow = {
  orderId: string;
  purchaseDate: string | null;
  content: string;
  amount: string | null;
  currency: string | null;
  service: 'Amazon.co.jp' | string;
  status: string;
  itemCount: number;
  marketplace: string | null;
  skuStatus: 'linked' | 'alias-linked' | 'unresolved' | 'read-model-pending' | string;
  importStatus: 'imported' | 'partial' | 'failed' | 'read-model-pending' | string;
  importJobId: string | null;
  stagingRowIds: string[];
};

export type AmazonImportedOrdersReadModelListResult = {
  source: 'amazon-imported-orders-read-model';
  routeImplementedNow: true;
  readOnly: true;
  companyScoped: true;
  orders: AmazonImportedOrdersReadModelOrderRow[];
  summary: {
    totalOrders: number;
    totalItems: number;
    unresolvedSkuCount: number;
    linkedSkuCount: number;
    aliasLinkedSkuCount: number;
    currency: string | null;
    amountTotal: string | null;
  };
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    limit: number;
  };
  boundaries: {
    readsExistingImportJob: true;
    readsExistingImportStagingRow: true;
    callsAmazon: false;
    createsImportJob: false;
    createsSyncJob: false;
    createsSyncSegment: false;
    writesDatabase: false;
    writesTransaction: false;
    writesInventoryMovement: false;
  };
};

export type AmazonImportedOrderDetailReadModelResult = {
  source: 'amazon-imported-order-detail-read-model';
  routeImplementedNow: true;
  readOnly: true;
  companyScoped: true;
  order: AmazonImportedOrdersReadModelOrderRow | null;
  items: Array<{
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
  }>;
  detail: {
    order: AmazonImportedOrdersReadModelOrderRow;
    items: AmazonImportedOrderDetailReadModelResult['items'];
    taxFeeSummary: AmazonImportedOrderDetailReadModelResult['taxFeeSummary'];
    inventoryReadiness: AmazonImportedOrderDetailReadModelResult['inventoryReadiness'];
    importMetadata: AmazonImportedOrderDetailReadModelResult['importMetadata'];
  } | null;
  taxFeeSummary: {
    itemTaxTotal: string | null;
    shippingTaxTotal: string | null;
    promotionDiscountTotal: string | null;
    promotionDiscountTaxTotal: string | null;
    amazonFeeTotal: string | null;
    fbaFeeTotal: string | null;
    settlementAmount: string | null;
    currency: string | null;
    financePermissionRequired: boolean;
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
    sourceType: 'amazon-sp-api-orders' | string;
  };
  boundaries: AmazonImportedOrdersReadModelListResult['boundaries'];
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function readString(payload: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return null;
}

function readNumber(payload: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return null;
}

function normalizeDateOnly(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  const match = value.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : null;
}

function deriveDateRange(args: {
  rangePreset?: string;
  startDate?: string;
  endDate?: string;
}): { startDate: string; endDate: string } {
  const now = new Date();
  const end = new Date(now);
  let start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  if (args.rangePreset === '30D') start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (args.rangePreset === '90D') start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  if (args.rangePreset === '365D') start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  if (args.rangePreset === 'CUSTOM') {
    if (args.startDate) {
      const customStart = new Date(`${args.startDate}T00:00:00.000+09:00`);
      if (!Number.isNaN(customStart.getTime())) start = customStart;
    }
    if (args.endDate) {
      const customEnd = new Date(`${args.endDate}T23:59:59.999+09:00`);
      if (!Number.isNaN(customEnd.getTime())) end.setTime(customEnd.getTime());
    }
  }

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function extractOrderIdentity(payload: Record<string, unknown>): {
  orderId: string | null;
  orderItemId: string | null;
  purchaseDate: string | null;
  sellerSku: string | null;
  asin: string | null;
  title: string | null;
  status: string | null;
  amount: number | null;
  currency: string | null;
  quantity: number | null;
  skuReadiness: string;
} {
  const orderId = readString(payload, ['amazonOrderId', 'AmazonOrderId', 'orderId', 'sourceOrderId']);
  const orderItemId = readString(payload, ['orderItemId', 'OrderItemId', 'sourceOrderItemId']);
  const sellerSku = readString(payload, ['sellerSku', 'SellerSKU', 'sku', 'SKU']);
  const asin = readString(payload, ['asin', 'ASIN']);
  const title = readString(payload, ['title', 'Title', 'itemTitle', 'productName']);
  const purchaseDate = normalizeDateOnly(
    readString(payload, [
      'purchaseDate',
      'PurchaseDate',
      'amazonPurchaseDate',
      'AmazonPurchaseDate',
      'purchase_date',
      'orderDate',
      'OrderDate',
      'order_date',
      'postedDate',
      'posted_date',
      'createdAt',
      'CreatedAt',
      'businessDate',
      'importedAt',
      'ImportedAt',
    ]),
  );
  const status = readString(payload, ['orderStatus', 'OrderStatus', 'status']) || 'imported';
  const currency = readString(payload, ['currency', 'currencyCode', 'itemCurrencyCode']) || 'JPY';
  const quantity = readNumber(payload, ['quantityOrdered', 'QuantityOrdered', 'quantity']);
  const amount =
    readNumber(payload, ['itemPriceAmount', 'ItemPriceAmount', 'amount', 'orderTotalAmount', 'candidateAmount']) ??
    null;

  const targetEntityType = readString(payload, ['targetEntityType']);
  const targetEntityId = readString(payload, ['targetEntityId', 'productSkuId']);
  const skuReadiness = targetEntityType === 'ProductSku' && targetEntityId ? 'linked' : sellerSku ? 'unresolved' : 'read-model-pending';

  return {
    orderId,
    orderItemId,
    purchaseDate,
    sellerSku,
    asin,
    title,
    status,
    amount,
    currency,
    quantity,
    skuReadiness,
  };
}

function makeBoundaries(): AmazonImportedOrdersReadModelListResult['boundaries'] {
  return {
    readsExistingImportJob: true,
    readsExistingImportStagingRow: true,
    callsAmazon: false,
    createsImportJob: false,
    createsSyncJob: false,
    createsSyncSegment: false,
    writesDatabase: false,
    writesTransaction: false,
    writesInventoryMovement: false,
  };
}

export async function listAmazonImportedOrdersReadModel(
  args: AmazonImportedOrdersReadModelListArgs,
): Promise<AmazonImportedOrdersReadModelListResult> {
  const companyId = String(args.companyId || '').trim();
  if (!companyId) {
    throw new ForbiddenException('AMAZON_IMPORTED_ORDERS_READ_MODEL_COMPANY_REQUIRED');
  }

  // Step151-W-J:
  // Total count and current page must be computed separately.
  // `limit` controls visible rows only. It must never change summary.totalOrders.
  const limit = Math.min(Math.max(Number(args.limit || 20), 1), 100);
  const cursorOffsetRaw = args.cursor ? Number(args.cursor) : 0;
  const cursorOffset = Number.isFinite(cursorOffsetRaw) && cursorOffsetRaw > 0 ? cursorOffsetRaw : 0;
  const dateRange = deriveDateRange(args);
  const content = String(args.content || '').trim().toLowerCase();
  const orderIdFilter = String(args.orderId || '').trim();
  const statusFilter = String(args.status || '').trim().toLowerCase();

  const rows = await args.prisma.importStagingRow.findMany({
    where: {
      companyId,
      module: 'store-orders',
      importJob: {
        sourceType: 'amazon-sp-api-orders',
      },
    },
    orderBy: [{ rowNo: 'asc' }, { id: 'asc' }],
    take: 20000,
    select: {
      id: true,
      importJobId: true,
      rowNo: true,
      businessMonth: true,
      normalizedPayloadJson: true,
      rawPayloadJson: true,
      targetEntityType: true,
      targetEntityId: true,
      matchStatus: true,
      importJob: {
        select: {
          id: true,
          importedAt: true,
        },
      },
    },
  });

  const orderMap = new Map<string, {
    orderId: string;
    purchaseDate: string | null;
    contentParts: string[];
    amountTotal: number;
    currency: string | null;
    status: string;
    itemCount: number;
    marketplace: string | null;
    skuStatuses: string[];
    importStatuses: string[];
    importJobId: string | null;
    stagingRowIds: string[];
    rowNo: number | null;
    importedAt: string | null;
  }>();

  for (const row of rows) {
    const normalized = asRecord(row.normalizedPayloadJson);
    const raw = asRecord(row.rawPayloadJson);
    const payload = { ...raw, ...normalized };

    const identity = extractOrderIdentity({
      ...payload,
      targetEntityType: row.targetEntityType,
      targetEntityId: row.targetEntityId,
    });

    if (!identity.orderId) continue;

    const importedAtDate = row.importJob?.importedAt ? row.importJob.importedAt.toISOString().slice(0, 10) : null;
    const fallbackDate =
      identity.purchaseDate ||
      normalizeDateOnly(readString(payload, [
        'amazonPurchaseDate',
        'AmazonPurchaseDate',
        'purchase_date',
        'order_date',
        'OrderDate',
        'postedDate',
        'posted_date',
        'createdAt',
        'CreatedAt',
        'importedAt',
        'ImportedAt',
      ])) ||
      normalizeDateOnly(String(row.businessMonth || '')) ||
      importedAtDate;

    if (orderIdFilter && identity.orderId !== orderIdFilter) continue;
    if (fallbackDate && (fallbackDate < dateRange.startDate || fallbackDate > dateRange.endDate)) continue;
    if (statusFilter && !String(identity.status || '').toLowerCase().includes(statusFilter)) continue;

    const contentText = [
      identity.orderId,
      identity.orderItemId,
      identity.sellerSku,
      identity.asin,
      identity.title,
      identity.status,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (content && !contentText.includes(content)) continue;

    const key = identity.orderId;
    const existing =
      orderMap.get(key) ??
      {
        orderId: key,
        purchaseDate: fallbackDate,
        contentParts: [],
        amountTotal: 0,
        currency: identity.currency,
        status: identity.status || 'imported',
        itemCount: 0,
        marketplace: 'JP',
        skuStatuses: [],
        importStatuses: [],
        importJobId: row.importJobId,
        stagingRowIds: [],
        rowNo: row.rowNo,
        importedAt: importedAtDate,
      };

    existing.itemCount += 1;
    existing.amountTotal += identity.amount || 0;
    existing.currency = existing.currency || identity.currency;
    existing.purchaseDate = existing.purchaseDate || fallbackDate;
    existing.importJobId = existing.importJobId || row.importJobId;
    existing.rowNo = existing.rowNo ?? row.rowNo;
    existing.importedAt = existing.importedAt || importedAtDate;
    existing.stagingRowIds.push(row.id);
    existing.skuStatuses.push(identity.skuReadiness);
    existing.importStatuses.push(String(row.matchStatus || 'imported'));
    existing.contentParts.push(
      [identity.sellerSku, identity.title, identity.asin].filter(Boolean).join(' / ') || identity.orderItemId || identity.orderId,
    );

    orderMap.set(key, existing);
  }

  const allOrders = Array.from(orderMap.values()).sort((a, b) => {
    const ad = a.purchaseDate || a.importedAt || '';
    const bd = b.purchaseDate || b.importedAt || '';
    if (ad !== bd) return bd.localeCompare(ad);
    return Number(b.rowNo || 0) - Number(a.rowNo || 0);
  });

  function toOrderRow(order: typeof allOrders[number]): AmazonImportedOrdersReadModelOrderRow {
    const unresolved = order.skuStatuses.includes('unresolved');
    const aliasLinked = order.skuStatuses.includes('alias-linked');
    const linked = order.skuStatuses.includes('linked');

    return {
      orderId: order.orderId,
      purchaseDate: order.purchaseDate || order.importedAt,
      content: order.contentParts.slice(0, 3).join(' / '),
      amount: order.amountTotal ? String(order.amountTotal) : null,
      currency: order.currency,
      service: 'Amazon.co.jp',
      status: order.status,
      itemCount: order.itemCount,
      marketplace: order.marketplace,
      skuStatus: unresolved ? 'unresolved' : aliasLinked ? 'alias-linked' : linked ? 'linked' : 'read-model-pending',
      importStatus: 'imported',
      importJobId: order.importJobId,
      stagingRowIds: order.stagingRowIds,
    };
  }

  // Step151-W-K:
  // Single source of truth:
  // - allOrders = all grouped orders matching the current filter
  // - totalOrders = allOrders.length, independent from limit/pageSize
  // - orders = the visible page only
  // - hasMore/nextCursor derive only from totalOrders and cursorOffset
  const totalOrders = allOrders.length;
  const pageOrders = allOrders.slice(cursorOffset, cursorOffset + limit);
  const orders = pageOrders.map(toOrderRow);
  const summaryOrders = allOrders.map(toOrderRow);

  const hasMore = cursorOffset + limit < totalOrders;
  const nextCursor = hasMore ? String(cursorOffset + limit) : null;
  const amountTotal = summaryOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0);

  return {
    source: 'amazon-imported-orders-read-model',
    routeImplementedNow: true,
    readOnly: true,
    companyScoped: true,
    orders,
    summary: {
      totalOrders,
      totalItems: summaryOrders.reduce((sum, order) => sum + order.itemCount, 0),
      unresolvedSkuCount: summaryOrders.filter((order) => order.skuStatus === 'unresolved').length,
      linkedSkuCount: summaryOrders.filter((order) => order.skuStatus === 'linked').length,
      aliasLinkedSkuCount: summaryOrders.filter((order) => order.skuStatus === 'alias-linked').length,
      currency: summaryOrders[0]?.currency || 'JPY',
      amountTotal: amountTotal ? String(amountTotal) : null,
    },
    pagination: {
      nextCursor,
      hasMore,
      limit,
    },
    boundaries: makeBoundaries(),
  };
}

export async function getAmazonImportedOrderDetailReadModel(args: {
  prisma: PrismaService;
  companyId: string;
  orderId: string;
}): Promise<AmazonImportedOrderDetailReadModelResult> {
  const companyId = String(args.companyId || '').trim();
  const orderId = String(args.orderId || '').trim();

  if (!companyId) {
    throw new ForbiddenException('AMAZON_IMPORTED_ORDER_DETAIL_READ_MODEL_COMPANY_REQUIRED');
  }
  if (!orderId) {
    throw new BadRequestException('AMAZON_IMPORTED_ORDER_DETAIL_READ_MODEL_ORDER_ID_REQUIRED');
  }

  const rows = await args.prisma.importStagingRow.findMany({
    where: {
      companyId,
      module: 'store-orders',
      importJob: {
        sourceType: 'amazon-sp-api-orders',
      },
    },
    orderBy: [{ rowNo: 'asc' }, { id: 'asc' }],
    take: 500,
    select: {
      id: true,
      importJobId: true,
      rowNo: true,
      normalizedPayloadJson: true,
      rawPayloadJson: true,
      targetEntityType: true,
      targetEntityId: true,
      importJob: {
        select: {
          id: true,
          importedAt: true,
        },
      },
    },
  });

  const matched = rows.filter((row) => {
    const payload = { ...asRecord(row.rawPayloadJson), ...asRecord(row.normalizedPayloadJson) };
    const identity = extractOrderIdentity(payload);
    return identity.orderId === orderId;
  });

  const items = matched.map((row) => {
    const payload = {
      ...asRecord(row.rawPayloadJson),
      ...asRecord(row.normalizedPayloadJson),
      targetEntityType: row.targetEntityType,
      targetEntityId: row.targetEntityId,
    };
    const identity = extractOrderIdentity(payload);

    return {
      orderItemId: identity.orderItemId,
      sellerSku: identity.sellerSku,
      asin: identity.asin,
      title: identity.title,
      quantity: identity.quantity,
      itemPrice: identity.amount == null ? null : String(identity.amount),
      itemTax: null,
      shippingPrice: null,
      shippingTax: null,
      promotionDiscount: null,
      promotionDiscountTax: null,
      currency: identity.currency,
      skuReadiness: identity.skuReadiness,
    };
  });

  const first = matched[0];
  const firstPayload = first ? { ...asRecord(first.rawPayloadJson), ...asRecord(first.normalizedPayloadJson) } : {};
  const firstIdentity = extractOrderIdentity(firstPayload);
  const amountTotal = items.reduce((sum, item) => sum + Number(item.itemPrice || 0), 0);

  const order: AmazonImportedOrdersReadModelOrderRow | null = first
    ? {
        orderId,
        purchaseDate: firstIdentity.purchaseDate,
        content: items.map((item) => [item.sellerSku, item.title, item.asin].filter(Boolean).join(' / ')).filter(Boolean).slice(0, 3).join(' / '),
        amount: amountTotal ? String(amountTotal) : null,
        currency: items[0]?.currency || 'JPY',
        service: 'Amazon.co.jp',
        status: firstIdentity.status || 'imported',
        itemCount: items.length,
        marketplace: 'JP',
        skuStatus: items.some((item) => item.skuReadiness === 'unresolved') ? 'unresolved' : 'linked',
        importStatus: 'imported',
        importJobId: first.importJobId,
        stagingRowIds: matched.map((row) => row.id),
      }
    : null;

  const taxFeeSummary = {
    itemTaxTotal: null,
    shippingTaxTotal: null,
    promotionDiscountTotal: null,
    promotionDiscountTaxTotal: null,
    amazonFeeTotal: null,
    fbaFeeTotal: null,
    settlementAmount: null,
    currency: items[0]?.currency || 'JPY',
    financePermissionRequired: true,
  };

  const inventoryReadiness = {
    linkedRows: items.filter((item) => item.skuReadiness === 'linked').length,
    aliasLinkedRows: items.filter((item) => item.skuReadiness === 'alias-linked').length,
    unresolvedRows: items.filter((item) => item.skuReadiness === 'unresolved').length,
    auditHref: null,
  };

  const importMetadata = {
    importJobId: first?.importJobId || null,
    importedAt: first?.importJob?.importedAt ? first.importJob.importedAt.toISOString() : null,
    stagingRowIds: matched.map((row) => row.id),
    sourceType: 'amazon-sp-api-orders',
  };

  return {
    source: 'amazon-imported-order-detail-read-model',
    routeImplementedNow: true,
    readOnly: true,
    companyScoped: true,
    order,
    items,
    detail: order
      ? {
          order,
          items,
          taxFeeSummary,
          inventoryReadiness,
          importMetadata,
        }
      : null,
    taxFeeSummary,
    inventoryReadiness,
    importMetadata,
    boundaries: makeBoundaries(),
  };
}
