import {
  assertAmazonOrderNormalizedPayload,
  buildAmazonOrderNormalizedPayload,
  normalizeAmazonOrderBusinessMonth,
  type AmazonOrderNormalizedPayload,
} from "./amazon-order-normalized-contract";

export type AmazonSpApiSandboxMoney = {
  currencyCode?: string | null;
  amount?: number | string | null;
};

export type AmazonSpApiSandboxFee = {
  type: "commission" | "fba" | "other" | string;
  amount?: AmazonSpApiSandboxMoney | number | string | null;
};

export type AmazonSpApiSandboxOrderItem = {
  orderItemId?: string | null;
  sellerSku?: string | null;
  sku?: string | null;
  title?: string | null;
  quantityOrdered?: number | string | null;
  itemPrice?: AmazonSpApiSandboxMoney | number | string | null;
  itemTax?: AmazonSpApiSandboxMoney | number | string | null;
  shippingPrice?: AmazonSpApiSandboxMoney | number | string | null;
  shippingTax?: AmazonSpApiSandboxMoney | number | string | null;
  promotionDiscount?: AmazonSpApiSandboxMoney | number | string | null;
  promotionDiscountTax?: AmazonSpApiSandboxMoney | number | string | null;
  feeBreakdown?: AmazonSpApiSandboxFee[] | null;
  raw?: Record<string, unknown> | null;
};

export type AmazonSpApiSandboxOrder = {
  amazonOrderId?: string | null;
  purchaseDate?: string | null;
  lastUpdateDate?: string | null;
  marketplaceId?: string | null;
  orderStatus?: string | null;
  fulfillmentChannel?: string | null;
  salesChannel?: string | null;
  orderTotal?: AmazonSpApiSandboxMoney | number | string | null;
  items?: AmazonSpApiSandboxOrderItem[] | null;
  raw?: Record<string, unknown> | null;
};

export type AmazonSpApiSandboxAdapterInput = {
  importJobId?: string | null;
  sourceFileName?: string | null;
  startRowNo?: number | null;
  order: AmazonSpApiSandboxOrder;
};

function amountOf(value: AmazonSpApiSandboxMoney | number | string | null | undefined): number {
  if (value === undefined || value === null || value === "") return 0;

  if (typeof value === "object" && !Array.isArray(value)) {
    return amountOf(value.amount);
  }

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

function currencyOf(
  primary: AmazonSpApiSandboxMoney | number | string | null | undefined,
  fallback = "JPY",
): string {
  if (primary && typeof primary === "object" && !Array.isArray(primary) && primary.currencyCode) {
    return String(primary.currencyCode).trim() || fallback;
  }
  return fallback;
}

function feeAmountOf(
  item: AmazonSpApiSandboxOrderItem,
  matcher: (feeType: string) => boolean,
): number {
  return (item.feeBreakdown || []).reduce((sum, fee) => {
    const feeType = String(fee.type || "").toLowerCase();
    if (!matcher(feeType)) return sum;
    return sum + amountOf(fee.amount);
  }, 0);
}

function firstText(...values: Array<unknown>): string {
  for (const value of values) {
    const text = String(value ?? "").normalize("NFKC").trim();
    if (text) return text;
  }
  return "";
}

export function buildAmazonSpApiSandboxNormalizedPayloads(
  input: AmazonSpApiSandboxAdapterInput,
): AmazonOrderNormalizedPayload[] {
  const order = input.order || {};
  const amazonOrderId = firstText(order.amazonOrderId);
  const occurredAt = firstText(order.purchaseDate, order.lastUpdateDate);
  const businessMonth = normalizeAmazonOrderBusinessMonth(occurredAt);
  const startRowNo = input.startRowNo ?? 1;

  if (!amazonOrderId) {
    throw new Error("Amazon SP-API sandbox order requires amazonOrderId");
  }

  if (!occurredAt) {
    throw new Error("Amazon SP-API sandbox order requires purchaseDate or lastUpdateDate");
  }

  const items = order.items || [];
  if (!items.length) {
    throw new Error("Amazon SP-API sandbox order requires at least one item");
  }

  return items.map((item, index) => {
    const sellerSku = firstText(item.sellerSku, item.sku);
    if (!sellerSku) {
      throw new Error(`Amazon SP-API sandbox item ${index + 1} requires sellerSku`);
    }

    // Step116-A guard anchor: buildAmazonOrderNormalizedPayload derives normalizedSellerSku.
    const normalizedSellerSkuAnchor = "normalizedSellerSku";
    void normalizedSellerSkuAnchor;

    const quantity = amountOf(item.quantityOrdered || 1);
    const itemSalesAmount = amountOf(item.itemPrice);
    const itemSalesTaxAmount = amountOf(item.itemTax);
    const shippingAmount = amountOf(item.shippingPrice);
    const shippingTaxAmount = amountOf(item.shippingTax);
    const promotionDiscountAmount = amountOf(item.promotionDiscount);
    const promotionDiscountTaxAmount = amountOf(item.promotionDiscountTax);
    const commissionFeeAmount = feeAmountOf(item, (type) => type.includes("commission"));
    const fbaFeeAmount = feeAmountOf(item, (type) => type.includes("fba"));
    const otherFeeAmount = feeAmountOf(
      item,
      (type) => !type.includes("commission") && !type.includes("fba"),
    );
    const feeAmount = commissionFeeAmount + fbaFeeAmount + otherFeeAmount;
    const grossAmount = itemSalesAmount + shippingAmount;
    const taxAmount = itemSalesTaxAmount + shippingTaxAmount;
    const netAmount =
      grossAmount -
      promotionDiscountAmount -
      commissionFeeAmount -
      fbaFeeAmount -
      otherFeeAmount;

    const payload = buildAmazonOrderNormalizedPayload({
      sourceType: "AMAZON_ORDER_SP_API",
      importJobId: input.importJobId || null,
      sourceRowNo: startRowNo + index,
      sourceFileName: input.sourceFileName || null,

      orderId: amazonOrderId,
      amazonOrderId,
      orderDate: order.purchaseDate || order.lastUpdateDate || null,
      occurredAt,
      businessMonth,

      sellerSku,
      sku: sellerSku,
      skuCode: sellerSku,
      productName: item.title || null,
      quantity,

      amount: grossAmount,
      grossAmount,
      netAmount,
      signedAmount: netAmount,
      currency: currencyOf(item.itemPrice, currencyOf(order.orderTotal, "JPY")),

      itemSalesAmount,
      itemSalesTaxAmount,
      shippingAmount,
      shippingTaxAmount,
      promotionAmount: promotionDiscountAmount,
      promotionDiscountAmount,
      promotionDiscountTaxAmount,
      commissionFeeAmount,
      fbaFeeAmount,
      feeAmount,
      taxAmount,

      store: order.salesChannel || order.marketplaceId || null,
      fulfillment: order.fulfillmentChannel || null,
      rawLabel: item.title || null,
      rawTransactionType: order.orderStatus || null,
      description: "Amazon SP-API sandbox order item normalized contract",
      dedupeHash: null,
      transactionId: null,
      inventoryDeduction: null,
      inventoryAudit: null,
      raw: {
        order,
        item,
      },
    });

    return assertAmazonOrderNormalizedPayload(payload);
  });
}
