import {
  executeAmazonSpApiOrdersGetOrderItemsHttp,
  executeAmazonSpApiOrdersListOrdersHttp,
  type AmazonSpApiOrdersGuardedHttpClientOptions,
  type AmazonSpApiOrdersHttpTransport,
} from './amazon-sp-api-orders-http.client';
import type {
  AmazonSpApiOrdersListOrdersSignedRequestInput,
  AmazonSpApiOrdersSignedRequestCredentials,
} from './amazon-sp-api-orders-signed-request.builder';
import {
  buildAmazonSpApiOrderDedupeHash,
  buildAmazonSpApiOrderItemDedupeHash,
  type AmazonSpApiOrdersDryRunRegion,
  type AmazonSpApiOrdersNormalizedOrder,
  type AmazonSpApiOrdersNormalizedOrderItem,
} from './amazon-sp-api-orders-dry-run-fixture';

export type AmazonSpApiOrdersRealPreviewInput = {
  companyId: string;
  storeId: string;
  marketplaceId: string;
  region: AmazonSpApiOrdersDryRunRegion | 'JP';
  accessToken: string;
  credentials: AmazonSpApiOrdersSignedRequestCredentials;
  createdAfter: string;
  createdBefore?: string;
  orderStatuses?: readonly string[];
  maxResultsPerPage?: number;
  now?: Date;
  env?: Record<string, string | undefined>;
  transport: AmazonSpApiOrdersHttpTransport;
};

export class AmazonSpApiOrdersRealPreviewHttpError extends Error {
  readonly code = 'AMAZON_SP_API_ORDERS_REAL_PREVIEW_HTTP_FAILED' as const;
  readonly httpStatus: number | null;
  readonly amazonStatus: string;
  readonly sanitizedResponse: unknown;
  readonly requestSummary: {
    region: AmazonSpApiOrdersRealPreviewInput['region'];
    marketplaceId: string;
    createdAfter: string;
    createdBefore?: string;
  };

  constructor(args: {
    amazonStatus: string;
    httpStatus: number | null;
    sanitizedResponse: unknown;
    requestSummary: {
      region: AmazonSpApiOrdersRealPreviewInput['region'];
      marketplaceId: string;
      createdAfter: string;
      createdBefore?: string;
    };
  }) {
    super(`STEP_P2A_REAL_PREVIEW_HTTP_FAILED: ${args.amazonStatus}`);
    this.name = 'AmazonSpApiOrdersRealPreviewHttpError';
    this.amazonStatus = args.amazonStatus;
    this.httpStatus = args.httpStatus;
    this.sanitizedResponse = args.sanitizedResponse;
    this.requestSummary = args.requestSummary;
  }

  toResponseBody() {
    return {
      message: this.message,
      code: this.code,
      amazonStatus: this.amazonStatus,
      httpStatus: this.httpStatus,
      requestSummary: this.requestSummary,
      sanitizedResponse: this.sanitizedResponse,
      writesImportJob: false,
      writesImportStagingRow: false,
      writesTransaction: false,
      writesInventoryMovement: false,
    };
  }
}


export type AmazonSpApiOrdersRealPreviewEnvelope = {
  step: 'Step140-P';
  source: 'amazon-sp-api-orders-real-preview';
  previewMode: 'real-http-mocked-transport-no-persistence';
  dryRun: false;
  persisted: false;
  companyId: string;
  storeId: string;
  marketplaceId: string;
  region: AmazonSpApiOrdersDryRunRegion;
  normalizedOrders: AmazonSpApiOrdersNormalizedOrder[];
  normalizedOrderItems: AmazonSpApiOrdersNormalizedOrderItem[];
  validationSummary: {
    totalOrders: number;
    totalOrderItems: number;
    validationErrorCount: number;
    warningCount: number;
    commitEligibleCount: number;
  };
  dedupeSummary: {
    duplicateOrdersCount: number;
    duplicateItemsCount: number;
    uniqueOrderDedupeHashes: string[];
    uniqueItemDedupeHashes: string[];
  };
  skuResolutionSummary: {
    resolvedSkuCount: number;
    unresolvedSkuCount: number;
    unresolvedSellerSkus: string[];
    inventoryBlockedCount: number;
  };
  inventoryImpactPreview: {
    wouldDeductInventory: false;
    blockedBecauseNoPersistence: true;
    blockedBecauseUnresolvedSkuCount: number;
    impacts: Array<{
      sellerSku: string | null;
      quantityOrdered: number;
      resolutionStatus: 'resolved' | 'unresolved';
      wouldDeductQuantity: number;
    }>;
  };
  transactionImpactPreview: {
    wouldCreateTransactions: false;
    blockedBecauseNoPersistence: true;
    transactionPreviewCount: number;
    totalPreviewAmount: number;
    currencyCode: 'JPY';
  };
  httpSummary: {
    listOrdersStatus: number;
    getOrderItemsCalls: number;
    throttled: boolean;
    retryable: boolean;
  };
  warnings: string[];
  writesDatabase: false;
  importJobWriteNow: false;
  importStagingRowWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;
  realAmazonOrdersApiCall: true;
  realNetworkDefaultDisabled: true;
  usesInjectedTransportOnly: true;
};

type AmazonOrdersApiOrder = {
  AmazonOrderId?: string;
  PurchaseDate?: string;
  LastUpdateDate?: string;
  OrderStatus?: string;
  FulfillmentChannel?: string;
  SalesChannel?: string;
  MarketplaceId?: string;
  OrderTotal?: {
    CurrencyCode?: string;
    Amount?: string;
  };
  IsBusinessOrder?: boolean;
  IsPrime?: boolean;
};

type AmazonOrdersApiOrderItem = {
  OrderItemId?: string;
  ASIN?: string;
  SellerSKU?: string;
  Title?: string;
  QuantityOrdered?: number;
  QuantityShipped?: number;
  ItemPrice?: {
    CurrencyCode?: string;
    Amount?: string;
  };
  ItemTax?: {
    CurrencyCode?: string;
    Amount?: string;
  };
  ShippingPrice?: {
    CurrencyCode?: string;
    Amount?: string;
  };
  ShippingTax?: {
    CurrencyCode?: string;
    Amount?: string;
  };
  PromotionDiscount?: {
    CurrencyCode?: string;
    Amount?: string;
  };
  PromotionDiscountTax?: {
    CurrencyCode?: string;
    Amount?: string;
  };
};

export async function previewAmazonSpApiOrdersRealNoPersistence(
  input: AmazonSpApiOrdersRealPreviewInput,
): Promise<AmazonSpApiOrdersRealPreviewEnvelope> {
  assertRealPreviewInput(input);

  const listOrdersInput: AmazonSpApiOrdersListOrdersSignedRequestInput = {
    companyId: input.companyId,
    storeId: input.storeId,
    marketplaceId: input.marketplaceId,
    region: input.region,
    accessToken: input.accessToken,
    credentials: input.credentials,
    createdAfter: input.createdAfter,
    createdBefore: input.createdBefore,
    orderStatuses: input.orderStatuses,
    maxResultsPerPage: input.maxResultsPerPage,
    now: input.now,
    env: input.env,
  };

  const httpOptions: AmazonSpApiOrdersGuardedHttpClientOptions = {
    transport: input.transport,
    timeoutMs: 10_000,
  };

  const listOrdersHttp = await executeAmazonSpApiOrdersListOrdersHttp(listOrdersInput, httpOptions);

  if (!listOrdersHttp.ok) {
    throw new AmazonSpApiOrdersRealPreviewHttpError({
      amazonStatus: String(listOrdersHttp.error?.code || listOrdersHttp.status),
      httpStatus: typeof listOrdersHttp.status === 'number' ? listOrdersHttp.status : null,
      sanitizedResponse: listOrdersHttp.sanitizedResponse,
      requestSummary: {
        region: input.region,
        marketplaceId: input.marketplaceId,
        createdAfter: input.createdAfter,
        createdBefore: input.createdBefore,
      },
    });
  }

  const orders = parseOrdersFromListOrdersPayload(listOrdersHttp.sanitizedResponse.json);
  const normalizedOrders: AmazonSpApiOrdersNormalizedOrder[] = [];
  const normalizedOrderItems: AmazonSpApiOrdersNormalizedOrderItem[] = [];
  const warnings: string[] = [];

  for (const order of orders) {
    const amazonOrderId = String(order.AmazonOrderId || '').trim();

    if (!amazonOrderId) {
      warnings.push('Skipped order without AmazonOrderId.');
      continue;
    }

    const orderItemsHttp = await executeAmazonSpApiOrdersGetOrderItemsHttp(
      {
        companyId: input.companyId,
        storeId: input.storeId,
        marketplaceId: input.marketplaceId,
        region: input.region,
        accessToken: input.accessToken,
        credentials: input.credentials,
        amazonOrderId,
        now: input.now,
        env: input.env,
      },
      httpOptions,
    );

    if (!orderItemsHttp.ok) {
      warnings.push(`Failed to preview order items for ${amazonOrderId}: ${orderItemsHttp.error?.code || orderItemsHttp.status}`);
      continue;
    }

    const orderItems = parseOrderItemsPayload(orderItemsHttp.sanitizedResponse.json);
    const normalizedItemsForOrder = normalizeRealOrderItems(input, order, orderItems);
    normalizedOrderItems.push(...normalizedItemsForOrder);
    normalizedOrders.push(normalizeRealOrder(order, normalizedItemsForOrder, input));
  }

  const unresolvedItems = normalizedOrderItems.filter((item) => !item.sellerSku);
  const resolvedItems = normalizedOrderItems.filter((item) => Boolean(item.sellerSku));
  const totalPreviewAmount = normalizedOrders.reduce((sum, order) => sum + order.orderTotalAmount, 0);

  return {
    step: 'Step140-P',
    source: 'amazon-sp-api-orders-real-preview',
    previewMode: 'real-http-mocked-transport-no-persistence',
    dryRun: false,
    persisted: false,
    companyId: input.companyId,
    storeId: input.storeId,
    marketplaceId: input.marketplaceId,
    region: normalizePreviewRegion(input.region),
    normalizedOrders,
    normalizedOrderItems,
    validationSummary: {
      totalOrders: normalizedOrders.length,
      totalOrderItems: normalizedOrderItems.length,
      validationErrorCount: 0,
      warningCount: warnings.length + unresolvedItems.length,
      commitEligibleCount: resolvedItems.length,
    },
    dedupeSummary: {
      duplicateOrdersCount: countDuplicates(normalizedOrders.map((order) => order.dedupeHash)),
      duplicateItemsCount: countDuplicates(normalizedOrderItems.map((item) => item.itemLevelDedupeHash)),
      uniqueOrderDedupeHashes: unique(normalizedOrders.map((order) => order.dedupeHash)),
      uniqueItemDedupeHashes: unique(normalizedOrderItems.map((item) => item.itemLevelDedupeHash)),
    },
    skuResolutionSummary: {
      resolvedSkuCount: resolvedItems.length,
      unresolvedSkuCount: unresolvedItems.length,
      unresolvedSellerSkus: unresolvedItems.map((item) => item.sellerSku ?? '(missing-seller-sku)'),
      inventoryBlockedCount: unresolvedItems.length,
    },
    inventoryImpactPreview: {
      wouldDeductInventory: false,
      blockedBecauseNoPersistence: true,
      blockedBecauseUnresolvedSkuCount: unresolvedItems.length,
      impacts: normalizedOrderItems.map((item) => ({
        sellerSku: item.sellerSku,
        quantityOrdered: item.quantityOrdered,
        resolutionStatus: item.sellerSku ? 'resolved' : 'unresolved',
        wouldDeductQuantity: 0,
      })),
    },
    transactionImpactPreview: {
      wouldCreateTransactions: false,
      blockedBecauseNoPersistence: true,
      transactionPreviewCount: normalizedOrders.length,
      totalPreviewAmount,
      currencyCode: 'JPY',
    },
    httpSummary: {
      listOrdersStatus: listOrdersHttp.status,
      getOrderItemsCalls: normalizedOrders.length,
      throttled: listOrdersHttp.throttled,
      retryable: listOrdersHttp.retryable,
    },
    warnings: [
      ...warnings,
      ...unresolvedItems.map((item) => `Unresolved seller SKU for ${item.amazonOrderId}/${item.orderItemId}`),
    ],
    writesDatabase: false,
    importJobWriteNow: false,
    importStagingRowWriteNow: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,
    realAmazonOrdersApiCall: true,
    realNetworkDefaultDisabled: true,
    usesInjectedTransportOnly: true,
  };
}

function normalizeRealOrder(
  order: AmazonOrdersApiOrder,
  items: AmazonSpApiOrdersNormalizedOrderItem[],
  input: AmazonSpApiOrdersRealPreviewInput,
): AmazonSpApiOrdersNormalizedOrder {
  const amazonOrderId = String(order.AmazonOrderId || '').trim();
  const purchaseDate = String(order.PurchaseDate || order.LastUpdateDate || input.createdAfter);
  const orderTotalAmount = parseAmount(order.OrderTotal?.Amount);

  return {
    sourceType: 'amazon-sp-api',
    marketplaceId: input.marketplaceId,
    region: normalizePreviewRegion(input.region),
    amazonOrderId,
    purchaseDate,
    businessMonth: purchaseDate.slice(0, 7),
    orderStatus: String(order.OrderStatus || 'Unknown'),
    fulfillmentChannel: String(order.FulfillmentChannel || 'Unknown'),
    salesChannel: String(order.SalesChannel || 'Amazon'),
    currencyCode: 'JPY',
    orderTotalAmount,
    itemCount: items.reduce((sum, item) => sum + item.quantityOrdered, 0),
    dedupeHash: buildAmazonSpApiOrderDedupeHash(amazonOrderId),
    normalizedPayloadJson: {
      amazonOrderId,
      purchaseDate,
      orderStatus: String(order.OrderStatus || 'Unknown'),
      marketplaceId: input.marketplaceId,
      currencyCode: 'JPY',
      orderTotalAmount,
    },
  };
}

function normalizeRealOrderItems(
  input: AmazonSpApiOrdersRealPreviewInput,
  order: AmazonOrdersApiOrder,
  orderItems: AmazonOrdersApiOrderItem[],
): AmazonSpApiOrdersNormalizedOrderItem[] {
  const amazonOrderId = String(order.AmazonOrderId || '').trim();

  return orderItems.map((item) => {
    const orderItemId = String(item.OrderItemId || '').trim();
    const sellerSku = item.SellerSKU ? String(item.SellerSKU).trim() : null;

    return {
      sourceType: 'amazon-sp-api',
      marketplaceId: input.marketplaceId,
      region: normalizePreviewRegion(input.region),
      amazonOrderId,
      orderItemId,
      asin: String(item.ASIN || ''),
      sellerSku: sellerSku || null,
      title: String(item.Title || ''),
      quantityOrdered: Number(item.QuantityOrdered || 0),
      quantityShipped: Number(item.QuantityShipped || 0),
      itemPriceAmount: parseAmount(item.ItemPrice?.Amount),
      itemTaxAmount: parseAmount(item.ItemTax?.Amount),
      shippingPriceAmount: parseAmount(item.ShippingPrice?.Amount),
      shippingTaxAmount: parseAmount(item.ShippingTax?.Amount),
      promotionDiscountAmount: parseAmount(item.PromotionDiscount?.Amount),
      promotionDiscountTaxAmount: parseAmount(item.PromotionDiscountTax?.Amount),
      itemCurrencyCode: 'JPY',
      itemLevelDedupeHash: buildAmazonSpApiOrderItemDedupeHash(amazonOrderId, orderItemId),
      normalizedPayloadJson: {
        amazonOrderId,
        orderItemId,
        asin: String(item.ASIN || ''),
        sellerSku: sellerSku || null,
        quantityOrdered: Number(item.QuantityOrdered || 0),
      },
    };
  });
}

function parseOrdersFromListOrdersPayload(value: unknown): AmazonOrdersApiOrder[] {
  const payload = getPayloadObject(value);
  const orders = Array.isArray(payload.Orders) ? payload.Orders : [];
  return orders as AmazonOrdersApiOrder[];
}

function parseOrderItemsPayload(value: unknown): AmazonOrdersApiOrderItem[] {
  const payload = getPayloadObject(value);
  const orderItems = Array.isArray(payload.OrderItems) ? payload.OrderItems : [];
  return orderItems as AmazonOrdersApiOrderItem[];
}

function getPayloadObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {};
  const root = value as Record<string, unknown>;
  const payload = root.payload;

  if (!payload || typeof payload !== 'object') return {};
  return payload as Record<string, unknown>;
}

function assertRealPreviewInput(input: AmazonSpApiOrdersRealPreviewInput): void {
  if (!input.companyId) throw new Error('Step140-P real preview violation: companyId is required.');
  if (!input.storeId) throw new Error('Step140-P real preview violation: storeId is required.');
  if (!input.marketplaceId) throw new Error('Step140-P real preview violation: marketplaceId is required.');
  if (!input.region) throw new Error('Step140-P real preview violation: region is required.');
  if (!input.createdAfter) throw new Error('Step140-P real preview violation: createdAfter is required.');
  if (!input.accessToken) throw new Error('Step140-P real preview violation: accessToken is required.');
  if (!input.credentials?.accessKeyId) throw new Error('Step140-P real preview violation: accessKeyId is required.');
  if (!input.credentials?.secretAccessKey) throw new Error('Step140-P real preview violation: secretAccessKey is required.');
  if (!input.transport) throw new Error('Step140-P real preview violation: injected transport is required.');
}

function normalizePreviewRegion(region: AmazonSpApiOrdersRealPreviewInput['region']): AmazonSpApiOrdersDryRunRegion {
  return region === 'JP' ? 'FE' : region;
}

function parseAmount(value?: string): number {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values));
}

function countDuplicates(values: readonly string[]): number {
  const seen = new Set<string>();
  let duplicates = 0;

  for (const value of values) {
    if (seen.has(value)) duplicates += 1;
    seen.add(value);
  }

  return duplicates;
}
