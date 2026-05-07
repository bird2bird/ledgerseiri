export type AmazonOrderNormalizedSourceType = "AMAZON_ORDER_CSV" | "AMAZON_ORDER_SP_API";

export type AmazonOrderInventoryDeductionStatus =
  | "DEDUCTED"
  | "SKIPPED"
  | "UNRESOLVED"
  | string;

export type AmazonOrderInventoryDeductionMatchStrategy =
  | "DIRECT_PRODUCT_SKU"
  | "PRODUCT_SKU_ALIAS";

export type AmazonOrderInventoryDeductionPayload = {
  status: AmazonOrderInventoryDeductionStatus;
  sourceType: "AMAZON_ORDER_IMPORT";
  matchStrategy?: AmazonOrderInventoryDeductionMatchStrategy;
  skuId?: string | null;
  skuCode?: string | null;
  aliasId?: string | null;
  aliasSku?: string | null;
  normalizedAliasSku?: string | null;
  movementId?: string | null;
  balanceId?: string | null;
  quantityDelta?: number | null;
  reason?: string | null;
  createdAt?: string | null;
};

export type AmazonOrderInventoryAuditPayload = {
  scope: "inventory";
  status: "OPEN" | "CLOSED" | string;
  severity: "warning" | "critical" | string;
  code: string;
  reason: string;
  sku?: string | null;
  sourceType: "AMAZON_ORDER_IMPORT";
  sourceId?: string | null;
  quantity?: number | null;
  message?: string | null;
  createdAt?: string | null;
  previousStatus?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  resolutionAction?: string | null;
  resolutionNote?: string | null;
  linkedSkuId?: string | null;
  linkedSkuCode?: string | null;
  linkedProductName?: string | null;
  resolutionMovementId?: string | null;
  closedReason?: string | null;
};

export type AmazonOrderNormalizedPayload = {
  contractVersion: "amazon-order-normalized-v1";
  entityType: "transaction";
  module: "store-orders";
  sourceType: AmazonOrderNormalizedSourceType;

  importJobId?: string | null;
  sourceRowNo?: number | null;
  sourceFileName?: string | null;

  orderId: string;
  amazonOrderId: string;
  orderDate?: string | null;
  occurredAt: string;
  businessMonth: string | null;

  sku: string;
  skuCode: string;
  sellerSku: string;
  normalizedSellerSku: string;
  productName?: string | null;
  quantity: number;

  amount: number;
  grossAmount: number;
  netAmount: number;
  signedAmount?: number | null;
  currency: "JPY" | string;

  itemSalesAmount: number;
  itemSalesTaxAmount: number;
  shippingAmount: number;
  shippingTaxAmount: number;
  promotionAmount: number;
  promotionDiscountAmount: number;
  promotionDiscountTaxAmount: number;
  commissionFeeAmount: number;
  fbaFeeAmount: number;
  feeAmount: number;
  taxAmount: number;

  store?: string | null;
  fulfillment?: string | null;
  rawLabel?: string | null;
  rawTransactionType?: string | null;
  description?: string | null;

  dedupeHash?: string | null;
  transactionId?: string | null;

  inventoryDeduction?: AmazonOrderInventoryDeductionPayload | null;
  inventoryAudit?: AmazonOrderInventoryAuditPayload | null;

  raw?: Record<string, unknown> | null;
};

export type AmazonOrderNormalizedPayloadInput = {
  sourceType: AmazonOrderNormalizedSourceType;
  importJobId?: string | null;
  sourceRowNo?: number | null;
  sourceFileName?: string | null;

  orderId?: string | null;
  amazonOrderId?: string | null;
  orderDate?: string | null;
  occurredAt?: string | null;
  businessMonth?: string | null;

  sku?: string | null;
  skuCode?: string | null;
  sellerSku?: string | null;
  productName?: string | null;
  quantity?: number | string | null;

  amount?: number | string | null;
  grossAmount?: number | string | null;
  netAmount?: number | string | null;
  signedAmount?: number | string | null;
  currency?: string | null;

  itemSalesAmount?: number | string | null;
  itemSalesTaxAmount?: number | string | null;
  shippingAmount?: number | string | null;
  shippingTaxAmount?: number | string | null;
  promotionAmount?: number | string | null;
  promotionDiscountAmount?: number | string | null;
  promotionDiscountTaxAmount?: number | string | null;
  commissionFeeAmount?: number | string | null;
  fbaFeeAmount?: number | string | null;
  feeAmount?: number | string | null;
  taxAmount?: number | string | null;

  store?: string | null;
  fulfillment?: string | null;
  rawLabel?: string | null;
  rawTransactionType?: string | null;
  description?: string | null;

  dedupeHash?: string | null;
  transactionId?: string | null;

  inventoryDeduction?: AmazonOrderInventoryDeductionPayload | null;
  inventoryAudit?: AmazonOrderInventoryAuditPayload | null;

  raw?: Record<string, unknown> | null;
};

export function normalizeAmazonOrderText(value: unknown): string {
  return String(value ?? "").normalize("NFKC").trim();
}

export function normalizeAmazonSellerSku(value: unknown): string {
  return normalizeAmazonOrderText(value).replace(/\s+/g, "").toUpperCase();
}

export function normalizeAmazonOrderNumber(value: unknown): number {
  if (value === undefined || value === null || value === "") return 0;

  const normalized =
    typeof value === "string"
      ? value
          .normalize("NFKC")
          .replace(/[,\s￥¥円]/g, "")
          .replace(/[−–—]/g, "-")
      : value;

  const n = Number(normalized);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}

export function normalizeAmazonOrderQuantity(value: unknown): number {
  const n = normalizeAmazonOrderNumber(value);
  return Math.trunc(n);
}

export function normalizeAmazonOrderBusinessMonth(value: unknown): string | null {
  const raw = normalizeAmazonOrderText(value);
  if (!raw) return null;

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) {
    return `${direct.getFullYear()}-${String(direct.getMonth() + 1).padStart(2, "0")}`;
  }

  const match = raw.match(/(20\d{2})[\/\-.年]?\s*(0?[1-9]|1[0-2])/);
  if (!match) return null;

  return `${match[1]}-${String(Number(match[2])).padStart(2, "0")}`;
}

export function buildAmazonOrderNormalizedPayload(
  input: AmazonOrderNormalizedPayloadInput,
): AmazonOrderNormalizedPayload {
  const orderId = normalizeAmazonOrderText(input.orderId || input.amazonOrderId);
  const sellerSku = normalizeAmazonOrderText(input.sellerSku || input.sku || input.skuCode);
  const occurredAt = normalizeAmazonOrderText(input.occurredAt || input.orderDate);
  const grossAmount =
    input.grossAmount !== undefined && input.grossAmount !== null
      ? normalizeAmazonOrderNumber(input.grossAmount)
      : normalizeAmazonOrderNumber(input.amount);
  const netAmount =
    input.netAmount !== undefined && input.netAmount !== null
      ? normalizeAmazonOrderNumber(input.netAmount)
      : normalizeAmazonOrderNumber(input.signedAmount ?? grossAmount);
  const promotionDiscountAmount = normalizeAmazonOrderNumber(input.promotionDiscountAmount);
  const promotionAmount =
    input.promotionAmount !== undefined && input.promotionAmount !== null
      ? normalizeAmazonOrderNumber(input.promotionAmount)
      : promotionDiscountAmount;

  return {
    contractVersion: "amazon-order-normalized-v1",
    entityType: "transaction",
    module: "store-orders",
    sourceType: input.sourceType,

    importJobId: input.importJobId || null,
    sourceRowNo:
      input.sourceRowNo === undefined || input.sourceRowNo === null
        ? null
        : normalizeAmazonOrderQuantity(input.sourceRowNo),
    sourceFileName: input.sourceFileName || null,

    orderId,
    amazonOrderId: normalizeAmazonOrderText(input.amazonOrderId || orderId),
    orderDate: input.orderDate || null,
    occurredAt,
    businessMonth: input.businessMonth || normalizeAmazonOrderBusinessMonth(occurredAt),

    sku: sellerSku,
    skuCode: normalizeAmazonOrderText(input.skuCode || sellerSku),
    sellerSku,
    normalizedSellerSku: normalizeAmazonSellerSku(sellerSku),
    productName: input.productName || null,
    quantity: normalizeAmazonOrderQuantity(input.quantity),

    amount: normalizeAmazonOrderNumber(input.amount ?? grossAmount),
    grossAmount,
    netAmount,
    signedAmount:
      input.signedAmount === undefined || input.signedAmount === null
        ? null
        : normalizeAmazonOrderNumber(input.signedAmount),
    currency: normalizeAmazonOrderText(input.currency || "JPY") || "JPY",

    itemSalesAmount: normalizeAmazonOrderNumber(input.itemSalesAmount),
    itemSalesTaxAmount: normalizeAmazonOrderNumber(input.itemSalesTaxAmount),
    shippingAmount: normalizeAmazonOrderNumber(input.shippingAmount),
    shippingTaxAmount: normalizeAmazonOrderNumber(input.shippingTaxAmount),
    promotionAmount,
    promotionDiscountAmount,
    promotionDiscountTaxAmount: normalizeAmazonOrderNumber(input.promotionDiscountTaxAmount),
    commissionFeeAmount: normalizeAmazonOrderNumber(input.commissionFeeAmount),
    fbaFeeAmount: normalizeAmazonOrderNumber(input.fbaFeeAmount),
    feeAmount: normalizeAmazonOrderNumber(input.feeAmount),
    taxAmount: normalizeAmazonOrderNumber(input.taxAmount),

    store: input.store || null,
    fulfillment: input.fulfillment || null,
    rawLabel: input.rawLabel || null,
    rawTransactionType: input.rawTransactionType || null,
    description: input.description || null,

    dedupeHash: input.dedupeHash || null,
    transactionId: input.transactionId || null,

    inventoryDeduction: input.inventoryDeduction || null,
    inventoryAudit: input.inventoryAudit || null,

    raw: input.raw || null,
  };
}

export function assertAmazonOrderNormalizedPayload(
  payload: AmazonOrderNormalizedPayload,
): AmazonOrderNormalizedPayload {
  if (payload.contractVersion !== "amazon-order-normalized-v1") {
    throw new Error(`Unsupported Amazon order contractVersion: ${payload.contractVersion}`);
  }

  if (payload.entityType !== "transaction") {
    throw new Error(`Unsupported Amazon order entityType: ${payload.entityType}`);
  }

  if (payload.module !== "store-orders") {
    throw new Error(`Unsupported Amazon order module: ${payload.module}`);
  }

  if (!payload.orderId) {
    throw new Error("Amazon order normalized payload requires orderId");
  }

  if (!payload.sellerSku) {
    throw new Error("Amazon order normalized payload requires sellerSku");
  }

  if (!payload.normalizedSellerSku) {
    throw new Error("Amazon order normalized payload requires normalizedSellerSku");
  }

  if (!payload.occurredAt) {
    throw new Error("Amazon order normalized payload requires occurredAt");
  }

  if (!Number.isFinite(payload.quantity)) {
    throw new Error("Amazon order normalized payload quantity must be finite");
  }

  if (!Number.isFinite(payload.grossAmount)) {
    throw new Error("Amazon order normalized payload grossAmount must be finite");
  }

  return payload;
}
