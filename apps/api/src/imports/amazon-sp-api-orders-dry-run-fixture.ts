export type AmazonSpApiOrdersDryRunRegion = 'FE' | 'NA' | 'EU';

export type AmazonSpApiOrdersDryRunInput = {
  companyId: string;
  storeId: string;
  marketplaceId: string;
  region: AmazonSpApiOrdersDryRunRegion;
  createdAfter: string;
  createdBefore: string;
  orderStatuses?: readonly string[];
  dryRun?: true;
};

export type AmazonSpApiOrdersSyntheticOrderFixture = {
  amazonOrderId: string;
  purchaseDate: string;
  lastUpdateDate: string;
  orderStatus: string;
  fulfillmentChannel: 'AFN' | 'MFN';
  salesChannel: string;
  marketplaceId: string;
  currencyCode: 'JPY';
  orderTotalAmount: number;
  isBusinessOrder: boolean;
  isPrime: boolean;
};

export type AmazonSpApiOrdersSyntheticOrderItemFixture = {
  amazonOrderId: string;
  orderItemId: string;
  asin: string;
  sellerSku: string | null;
  title: string;
  quantityOrdered: number;
  quantityShipped: number;
  itemPriceAmount: number;
  itemTaxAmount: number;
  shippingPriceAmount: number;
  shippingTaxAmount: number;
  promotionDiscountAmount: number;
  promotionDiscountTaxAmount: number;
  itemCurrencyCode: 'JPY';
};

export type AmazonSpApiOrdersNormalizedOrder = {
  sourceType: 'amazon-sp-api';
  marketplaceId: string;
  region: AmazonSpApiOrdersDryRunRegion;
  amazonOrderId: string;
  purchaseDate: string;
  businessMonth: string;
  orderStatus: string;
  fulfillmentChannel: string;
  salesChannel: string;
  currencyCode: 'JPY';
  orderTotalAmount: number;
  itemCount: number;
  dedupeHash: string;
  normalizedPayloadJson: {
    amazonOrderId: string;
    purchaseDate: string;
    orderStatus: string;
    marketplaceId: string;
    currencyCode: 'JPY';
    orderTotalAmount: number;
  };
};

export type AmazonSpApiOrdersNormalizedOrderItem = {
  sourceType: 'amazon-sp-api';
  marketplaceId: string;
  region: AmazonSpApiOrdersDryRunRegion;
  amazonOrderId: string;
  orderItemId: string;
  asin: string;
  sellerSku: string | null;
  title: string;
  quantityOrdered: number;
  quantityShipped: number;
  itemPriceAmount: number;
  itemTaxAmount: number;
  shippingPriceAmount: number;
  shippingTaxAmount: number;
  promotionDiscountAmount: number;
  promotionDiscountTaxAmount: number;
  itemCurrencyCode: 'JPY';
  itemLevelDedupeHash: string;
  normalizedPayloadJson: {
    amazonOrderId: string;
    orderItemId: string;
    asin: string;
    sellerSku: string | null;
    quantityOrdered: number;
  };
};

export type AmazonSpApiOrdersDryRunPreviewEnvelope = {
  requestId: string;
  source: 'amazon-sp-api-orders-dry-run-fixture';
  dryRun: true;
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
    blockedBecauseDryRun: true;
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
    blockedBecauseDryRun: true;
    transactionPreviewCount: number;
    totalPreviewAmount: number;
    currencyCode: 'JPY';
  };
  warnings: string[];
  writesDatabase: false;
  realAmazonOrdersApiCall: false;
};

export function buildAmazonSpApiOrdersSyntheticFixture(
  input: AmazonSpApiOrdersDryRunInput,
): {
  orders: AmazonSpApiOrdersSyntheticOrderFixture[];
  orderItems: AmazonSpApiOrdersSyntheticOrderItemFixture[];
} {
  assertDryRunInput(input);

  const orders: AmazonSpApiOrdersSyntheticOrderFixture[] = [
    {
      amazonOrderId: 'ORDER-STEP140-I-001',
      purchaseDate: '2026-05-01T10:15:00Z',
      lastUpdateDate: '2026-05-01T11:20:00Z',
      orderStatus: 'Shipped',
      fulfillmentChannel: 'AFN',
      salesChannel: 'Amazon.co.jp',
      marketplaceId: input.marketplaceId,
      currencyCode: 'JPY',
      orderTotalAmount: 4980,
      isBusinessOrder: false,
      isPrime: true,
    },
    {
      amazonOrderId: 'ORDER-STEP140-I-002',
      purchaseDate: '2026-05-01T12:30:00Z',
      lastUpdateDate: '2026-05-01T13:00:00Z',
      orderStatus: 'Shipped',
      fulfillmentChannel: 'MFN',
      salesChannel: 'Amazon.co.jp',
      marketplaceId: input.marketplaceId,
      currencyCode: 'JPY',
      orderTotalAmount: 7980,
      isBusinessOrder: false,
      isPrime: false,
    },
  ];

  const orderItems: AmazonSpApiOrdersSyntheticOrderItemFixture[] = [
    {
      amazonOrderId: 'ORDER-STEP140-I-001',
      orderItemId: 'ITEM-STEP140-I-001-A',
      asin: 'B0STEP140I1',
      sellerSku: 'SKU-STEP140-I-RESOLVED-1',
      title: 'Synthetic 7 inch display fixture item',
      quantityOrdered: 1,
      quantityShipped: 1,
      itemPriceAmount: 4980,
      itemTaxAmount: 452,
      shippingPriceAmount: 0,
      shippingTaxAmount: 0,
      promotionDiscountAmount: 0,
      promotionDiscountTaxAmount: 0,
      itemCurrencyCode: 'JPY',
    },
    {
      amazonOrderId: 'ORDER-STEP140-I-002',
      orderItemId: 'ITEM-STEP140-I-002-A',
      asin: 'B0STEP140I2',
      sellerSku: 'SKU-STEP140-I-RESOLVED-2',
      title: 'Synthetic keyboard fixture item',
      quantityOrdered: 1,
      quantityShipped: 1,
      itemPriceAmount: 3980,
      itemTaxAmount: 362,
      shippingPriceAmount: 0,
      shippingTaxAmount: 0,
      promotionDiscountAmount: 0,
      promotionDiscountTaxAmount: 0,
      itemCurrencyCode: 'JPY',
    },
    {
      amazonOrderId: 'ORDER-STEP140-I-002',
      orderItemId: 'ITEM-STEP140-I-002-B',
      asin: 'B0STEP140I3',
      sellerSku: null,
      title: 'Synthetic unresolved SKU fixture item',
      quantityOrdered: 2,
      quantityShipped: 2,
      itemPriceAmount: 2000,
      itemTaxAmount: 182,
      shippingPriceAmount: 0,
      shippingTaxAmount: 0,
      promotionDiscountAmount: 0,
      promotionDiscountTaxAmount: 0,
      itemCurrencyCode: 'JPY',
    },
  ];

  return { orders, orderItems };
}

export function buildAmazonSpApiOrdersDryRunPreview(
  input: AmazonSpApiOrdersDryRunInput,
): AmazonSpApiOrdersDryRunPreviewEnvelope {
  assertDryRunInput(input);

  const fixture = buildAmazonSpApiOrdersSyntheticFixture(input);
  const normalizedOrders = normalizeAmazonSpApiOrdersDryRunOrders(input, fixture.orders, fixture.orderItems);
  const normalizedOrderItems = normalizeAmazonSpApiOrdersDryRunOrderItems(input, fixture.orderItems);

  const unresolvedItems = normalizedOrderItems.filter((item) => !item.sellerSku);
  const resolvedItems = normalizedOrderItems.filter((item) => Boolean(item.sellerSku));
  const totalPreviewAmount = normalizedOrders.reduce((sum, order) => sum + order.orderTotalAmount, 0);

  return {
    requestId: `step140-i-dry-run-${input.companyId}-${input.storeId}`,
    source: 'amazon-sp-api-orders-dry-run-fixture',
    dryRun: true,
    companyId: input.companyId,
    storeId: input.storeId,
    marketplaceId: input.marketplaceId,
    region: input.region,
    normalizedOrders,
    normalizedOrderItems,
    validationSummary: {
      totalOrders: normalizedOrders.length,
      totalOrderItems: normalizedOrderItems.length,
      validationErrorCount: 0,
      warningCount: unresolvedItems.length,
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
      blockedBecauseDryRun: true,
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
      blockedBecauseDryRun: true,
      transactionPreviewCount: normalizedOrders.length,
      totalPreviewAmount,
      currencyCode: 'JPY',
    },
    warnings: unresolvedItems.map((item) => `Unresolved seller SKU for ${item.amazonOrderId}/${item.orderItemId}`),
    writesDatabase: false,
    realAmazonOrdersApiCall: false,
  };
}

export function normalizeAmazonSpApiOrdersDryRunOrders(
  input: AmazonSpApiOrdersDryRunInput,
  orders: readonly AmazonSpApiOrdersSyntheticOrderFixture[],
  orderItems: readonly AmazonSpApiOrdersSyntheticOrderItemFixture[],
): AmazonSpApiOrdersNormalizedOrder[] {
  return orders.map((order) => {
    const itemCount = orderItems
      .filter((item) => item.amazonOrderId === order.amazonOrderId)
      .reduce((sum, item) => sum + item.quantityOrdered, 0);

    return {
      sourceType: 'amazon-sp-api',
      marketplaceId: input.marketplaceId,
      region: input.region,
      amazonOrderId: order.amazonOrderId,
      purchaseDate: order.purchaseDate,
      businessMonth: toBusinessMonth(order.purchaseDate),
      orderStatus: order.orderStatus,
      fulfillmentChannel: order.fulfillmentChannel,
      salesChannel: order.salesChannel,
      currencyCode: order.currencyCode,
      orderTotalAmount: order.orderTotalAmount,
      itemCount,
      dedupeHash: buildAmazonSpApiOrderDedupeHash(order.amazonOrderId),
      normalizedPayloadJson: {
        amazonOrderId: order.amazonOrderId,
        purchaseDate: order.purchaseDate,
        orderStatus: order.orderStatus,
        marketplaceId: input.marketplaceId,
        currencyCode: order.currencyCode,
        orderTotalAmount: order.orderTotalAmount,
      },
    };
  });
}

export function normalizeAmazonSpApiOrdersDryRunOrderItems(
  input: AmazonSpApiOrdersDryRunInput,
  orderItems: readonly AmazonSpApiOrdersSyntheticOrderItemFixture[],
): AmazonSpApiOrdersNormalizedOrderItem[] {
  return orderItems.map((item) => ({
    sourceType: 'amazon-sp-api',
    marketplaceId: input.marketplaceId,
    region: input.region,
    amazonOrderId: item.amazonOrderId,
    orderItemId: item.orderItemId,
    asin: item.asin,
    sellerSku: item.sellerSku,
    title: item.title,
    quantityOrdered: item.quantityOrdered,
    quantityShipped: item.quantityShipped,
    itemPriceAmount: item.itemPriceAmount,
    itemTaxAmount: item.itemTaxAmount,
    shippingPriceAmount: item.shippingPriceAmount,
    shippingTaxAmount: item.shippingTaxAmount,
    promotionDiscountAmount: item.promotionDiscountAmount,
    promotionDiscountTaxAmount: item.promotionDiscountTaxAmount,
    itemCurrencyCode: item.itemCurrencyCode,
    itemLevelDedupeHash: buildAmazonSpApiOrderItemDedupeHash(item.amazonOrderId, item.orderItemId),
    normalizedPayloadJson: {
      amazonOrderId: item.amazonOrderId,
      orderItemId: item.orderItemId,
      asin: item.asin,
      sellerSku: item.sellerSku,
      quantityOrdered: item.quantityOrdered,
    },
  }));
}

export function buildAmazonSpApiOrderDedupeHash(amazonOrderId: string): string {
  return `amazon-sp-api:order:${amazonOrderId}`;
}

export function buildAmazonSpApiOrderItemDedupeHash(amazonOrderId: string, orderItemId: string): string {
  return `amazon-sp-api:item:${amazonOrderId}:${orderItemId}`;
}

function assertDryRunInput(input: AmazonSpApiOrdersDryRunInput): void {
  if (!input.companyId) throw new Error('Step140-I dry-run fixture violation: companyId is required.');
  if (!input.storeId) throw new Error('Step140-I dry-run fixture violation: storeId is required.');
  if (!input.marketplaceId) throw new Error('Step140-I dry-run fixture violation: marketplaceId is required.');
  if (!input.region) throw new Error('Step140-I dry-run fixture violation: region is required.');
  if (!input.createdAfter) throw new Error('Step140-I dry-run fixture violation: createdAfter is required.');
  if (!input.createdBefore) throw new Error('Step140-I dry-run fixture violation: createdBefore is required.');
  if (input.dryRun !== true) throw new Error('Step140-I dry-run fixture violation: dryRun must be true.');

  const createdAfter = Date.parse(input.createdAfter);
  const createdBefore = Date.parse(input.createdBefore);

  if (!Number.isFinite(createdAfter)) throw new Error('Step140-I dry-run fixture violation: createdAfter must be ISO date.');
  if (!Number.isFinite(createdBefore)) throw new Error('Step140-I dry-run fixture violation: createdBefore must be ISO date.');
  if (createdAfter >= createdBefore) {
    throw new Error('Step140-I dry-run fixture violation: createdAfter must be before createdBefore.');
  }
}

function toBusinessMonth(isoDate: string): string {
  return isoDate.slice(0, 7);
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
