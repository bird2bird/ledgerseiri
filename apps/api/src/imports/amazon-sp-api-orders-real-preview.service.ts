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


const AMAZON_SP_API_ORDERS_CREATED_BEFORE_SAFETY_MINUTES = 3;
const AMAZON_SP_API_ORDERS_LIST_ORDERS_MAX_PAGES = 50;



function resolveAmazonOrdersCreatedBeforeSafetyWindow(args: {
  createdBefore?: string;
  now: Date;
}): {
  createdBefore?: string;
  adjusted: boolean;
  originalCreatedBefore?: string;
  safetyCutoff: string;
} {
  const safetyCutoffDate = new Date(
    args.now.getTime() - AMAZON_SP_API_ORDERS_CREATED_BEFORE_SAFETY_MINUTES * 60 * 1000,
  );
  const safetyCutoff = safetyCutoffDate.toISOString();

  if (!args.createdBefore) {
    return {
      createdBefore: safetyCutoff,
      adjusted: true,
      originalCreatedBefore: undefined,
      safetyCutoff,
    };
  }

  const requested = new Date(args.createdBefore);
  if (Number.isNaN(requested.getTime()) || requested.getTime() > safetyCutoffDate.getTime()) {
    return {
      createdBefore: safetyCutoff,
      adjusted: true,
      originalCreatedBefore: args.createdBefore,
      safetyCutoff,
    };
  }

  return {
    createdBefore: args.createdBefore,
    adjusted: false,
    originalCreatedBefore: args.createdBefore,
    safetyCutoff,
  };
}

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


function toDiagnosticsRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function extractAmazonSpApiListOrdersNextToken(value: unknown): string | undefined {
  const root = toDiagnosticsRecord(value);
  const payload = toDiagnosticsRecord(root?.payload) ?? root;
  const nextToken = payload?.NextToken ?? root?.NextToken;
  return typeof nextToken === 'string' && nextToken.length > 0 ? nextToken : undefined;
}

function summarizeAmazonSpApiListOrdersPayloadForDiagnostics(value: unknown): {
  topLevelKeys: string[];
  payloadKeys: string[];
  ordersArrayPath: string | null;
  rawOrdersCount: number;
  nextTokenPresent: boolean;
  firstOrders: Array<{
    amazonOrderId: string | null;
    orderStatus: string | null;
    purchaseDate: string | null;
    lastUpdateDate: string | null;
  }>;
} {
  const root = toDiagnosticsRecord(value);
  const payload = toDiagnosticsRecord(root?.payload) ?? root;

  const rootOrders = Array.isArray(root?.Orders) ? root.Orders : null;
  const payloadOrders = Array.isArray(payload?.Orders) ? payload.Orders : null;
  const orders = payloadOrders ?? rootOrders ?? [];

  const firstOrders = orders.slice(0, 5).map((order) => {
    const row = toDiagnosticsRecord(order);
  return {
      amazonOrderId: typeof row?.AmazonOrderId === 'string' ? row.AmazonOrderId : null,
      orderStatus: typeof row?.OrderStatus === 'string' ? row.OrderStatus : null,
      purchaseDate: typeof row?.PurchaseDate === 'string' ? row.PurchaseDate : null,
      lastUpdateDate: typeof row?.LastUpdateDate === 'string' ? row.LastUpdateDate : null,
    };
  });

  return {
    topLevelKeys: root ? Object.keys(root).sort() : [],
    payloadKeys: payload ? Object.keys(payload).sort() : [],
    ordersArrayPath: payloadOrders ? 'payload.Orders' : rootOrders ? 'Orders' : null,
    rawOrdersCount: orders.length,
    nextTokenPresent: Boolean(payload?.NextToken ?? root?.NextToken),
    firstOrders,
  };
}

function logAmazonSpApiPreviewCountPipelineDiagnostic(args: {
  listOrdersParsedCount: number;
  normalizedOrdersCount: number;
  normalizedOrderItemsCount: number;
  getOrderItemsAttemptCount: number;
  getOrderItemsSuccessCount: number;
  getOrderItemsFailedCount: number;
  responseOrdersCount?: number;
  responseOrderItemsCount?: number;
}): void {
  const diagnostic = {
    source: 'P3_Z6_PREVIEW_COUNT_PIPELINE_DIAG',
    listOrdersParsedCount: args.listOrdersParsedCount,
    normalizedOrdersCount: args.normalizedOrdersCount,
    normalizedOrderItemsCount: args.normalizedOrderItemsCount,
    getOrderItemsAttemptCount: args.getOrderItemsAttemptCount,
    getOrderItemsSuccessCount: args.getOrderItemsSuccessCount,
    getOrderItemsFailedCount: args.getOrderItemsFailedCount,
    responseOrdersCount: args.responseOrdersCount ?? null,
    responseOrderItemsCount: args.responseOrderItemsCount ?? null,
    writesImportJob: false,
    writesImportStagingRow: false,
    writesTransaction: false,
    writesInventoryMovement: false,
  };

  console.log(`P3_Z6_PREVIEW_COUNT_PIPELINE_DIAG ${JSON.stringify(diagnostic)}`);
}

function logAmazonSpApiListOrdersZeroDiagnostic(args: {
  requestSummary: Record<string, unknown>;
  responsePayload: unknown;
  parsedOrdersCount: number;
  pageCount?: number;
  nextTokenRemaining?: boolean;
}): void {
  const diagnostic = {
    source: 'P3_Z_LIST_ORDERS_DIAG',
    requestSummary: args.requestSummary,
    responseSummary: summarizeAmazonSpApiListOrdersPayloadForDiagnostics(args.responsePayload),
    parsedOrdersCount: args.parsedOrdersCount,
    pageCount: args.pageCount ?? null,
    nextTokenRemaining: args.nextTokenRemaining ?? null,
    writesImportJob: false,
    writesImportStagingRow: false,
    writesTransaction: false,
    writesInventoryMovement: false,
  };

  // Sanitized: no tokens, no secrets, no Authorization header.
  console.log(`P3_Z_LIST_ORDERS_DIAG ${JSON.stringify(diagnostic)}`);
}


export async function previewAmazonSpApiOrdersRealNoPersistence(
  input: AmazonSpApiOrdersRealPreviewInput,
): Promise<AmazonSpApiOrdersRealPreviewEnvelope> {
  assertRealPreviewInput(input);

    const effectiveNow = input.now ?? new Date();
    const createdBeforeSafetyWindow = resolveAmazonOrdersCreatedBeforeSafetyWindow({
    createdBefore: input.createdBefore,
    now: effectiveNow,
  });

const listOrdersInput: AmazonSpApiOrdersListOrdersSignedRequestInput = {
    companyId: input.companyId,
    storeId: input.storeId,
    marketplaceId: input.marketplaceId,
    region: input.region,
    accessToken: input.accessToken,
    credentials: input.credentials,
    createdAfter: input.createdAfter,
    createdBefore: createdBeforeSafetyWindow.createdBefore,
    orderStatuses: undefined,
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
        createdBefore: createdBeforeSafetyWindow.createdBefore,
      },
    });
  }

  const orders = parseOrdersFromListOrdersPayload(listOrdersHttp.sanitizedResponse.json);
  let listOrdersPageCount = 1;
  let listOrdersNextToken = extractAmazonSpApiListOrdersNextToken(
    listOrdersHttp.sanitizedResponse.json,
  );

  while (listOrdersNextToken && listOrdersPageCount < AMAZON_SP_API_ORDERS_LIST_ORDERS_MAX_PAGES) {
    const nextPageListOrdersInput: AmazonSpApiOrdersListOrdersSignedRequestInput = {
      ...listOrdersInput,
      nextToken: listOrdersNextToken,
    };

    const nextPageListOrdersHttp = await executeAmazonSpApiOrdersListOrdersHttp(
      nextPageListOrdersInput,
      httpOptions,
    );

    if (!nextPageListOrdersHttp.ok) {
      throw new AmazonSpApiOrdersRealPreviewHttpError({
        amazonStatus: String(nextPageListOrdersHttp.error?.code || nextPageListOrdersHttp.status),
        httpStatus:
          typeof nextPageListOrdersHttp.status === 'number' ? nextPageListOrdersHttp.status : null,
        sanitizedResponse: nextPageListOrdersHttp.sanitizedResponse,
        requestSummary: {
          region: input.region,
          marketplaceId: input.marketplaceId,
          createdAfter: input.createdAfter,
          createdBefore: createdBeforeSafetyWindow.createdBefore,
        },
      });
    }

    orders.push(...parseOrdersFromListOrdersPayload(nextPageListOrdersHttp.sanitizedResponse.json));
    listOrdersPageCount += 1;
    listOrdersNextToken = extractAmazonSpApiListOrdersNextToken(
      nextPageListOrdersHttp.sanitizedResponse.json,
    );
  }


  logAmazonSpApiListOrdersZeroDiagnostic({
    requestSummary: {
      region: input.region,
      marketplaceId: input.marketplaceId,
      createdAfter: input.createdAfter,
      createdBefore: createdBeforeSafetyWindow.createdBefore,
      orderStatuses: null,
      maxResultsPerPage: input.maxResultsPerPage ?? null,
    },
    responsePayload: listOrdersHttp.sanitizedResponse.json,
    parsedOrdersCount: orders.length,
    pageCount: listOrdersPageCount,
    nextTokenRemaining: Boolean(listOrdersNextToken),
  });
  const normalizedOrders: AmazonSpApiOrdersNormalizedOrder[] = [];
  let getOrderItemsAttemptCount = 0;
  let getOrderItemsSuccessCount = 0;
  let getOrderItemsFailedCount = 0;

  const normalizedOrderItems: AmazonSpApiOrdersNormalizedOrderItem[] = [];
  const warnings: string[] = [];

  for (const order of orders) {
    const amazonOrderId = String(order.AmazonOrderId || '').trim();

    if (!amazonOrderId) {
      warnings.push('Skipped order without AmazonOrderId.');
      continue;
    }

    const normalizedItemsForOrder: AmazonSpApiOrdersNormalizedOrderItem[] = [];
    getOrderItemsAttemptCount += 1;
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
      getOrderItemsFailedCount += 1;
      warnings.push(`Failed to preview order items for ${amazonOrderId}: ${orderItemsHttp.error?.code || orderItemsHttp.status}`);
      normalizedOrders.push(normalizeRealOrder(order, normalizedItemsForOrder, input));
      continue;
    }

      getOrderItemsSuccessCount += 1;
    const orderItems = parseOrderItemsPayload(orderItemsHttp.sanitizedResponse.json);
    normalizedItemsForOrder.push(...normalizeRealOrderItems(input, order, orderItems));
normalizedOrderItems.push(...normalizedItemsForOrder);
    normalizedOrders.push(normalizeRealOrder(order, normalizedItemsForOrder, input));
  }

  const unresolvedItems = normalizedOrderItems.filter((item) => !item.sellerSku);
  const resolvedItems = normalizedOrderItems.filter((item) => Boolean(item.sellerSku));
  const totalPreviewAmount = normalizedOrders.reduce((sum, order) => sum + order.orderTotalAmount, 0);

  logAmazonSpApiPreviewCountPipelineDiagnostic({
    listOrdersParsedCount: orders.length,
    normalizedOrdersCount: normalizedOrders.length,
    normalizedOrderItemsCount: normalizedOrderItems.length,
    getOrderItemsAttemptCount,
    getOrderItemsSuccessCount,
    getOrderItemsFailedCount,
    responseOrdersCount: normalizedOrders.length,
    responseOrderItemsCount: normalizedOrderItems.length,
  });

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
