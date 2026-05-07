#!/usr/bin/env node
"use strict";

const {
  buildAmazonSpApiSandboxNormalizedPayloads,
} = require("../dist/src/imports/amazon-sp-api-sandbox-adapter");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const order = {
    amazonOrderId: "SPAPI-SANDBOX-ORDER-STEP116-A",
    purchaseDate: "2026-05-07T12:34:56Z",
    lastUpdateDate: "2026-05-07T12:55:00Z",
    marketplaceId: "A1VC38T7YXB528",
    orderStatus: "Shipped",
    fulfillmentChannel: "AFN",
    salesChannel: "Amazon.co.jp",
    orderTotal: {
      currencyCode: "JPY",
      amount: "12980",
    },
    items: [
      {
        orderItemId: "SPAPI-SANDBOX-ITEM-1",
        sellerSku: " spapi-sandbox-sku-001 ",
        title: "Step116 SP-API Sandbox Product 1",
        quantityOrdered: "2",
        itemPrice: {
          currencyCode: "JPY",
          amount: "7980",
        },
        itemTax: {
          currencyCode: "JPY",
          amount: "798",
        },
        shippingPrice: {
          currencyCode: "JPY",
          amount: "300",
        },
        shippingTax: {
          currencyCode: "JPY",
          amount: "30",
        },
        promotionDiscount: {
          currencyCode: "JPY",
          amount: "120",
        },
        promotionDiscountTax: {
          currencyCode: "JPY",
          amount: "12",
        },
        feeBreakdown: [
          { type: "Commission", amount: { currencyCode: "JPY", amount: "600" } },
          { type: "FBA", amount: { currencyCode: "JPY", amount: "450" } },
        ],
        raw: {
          fixture: "step116-a-item-1",
        },
      },
      {
        orderItemId: "SPAPI-SANDBOX-ITEM-2",
        sellerSku: "spapi-sandbox-sku-002",
        title: "Step116 SP-API Sandbox Product 2",
        quantityOrdered: 1,
        itemPrice: {
          currencyCode: "JPY",
          amount: "5000",
        },
        itemTax: {
          currencyCode: "JPY",
          amount: "500",
        },
        shippingPrice: {
          currencyCode: "JPY",
          amount: "0",
        },
        shippingTax: {
          currencyCode: "JPY",
          amount: "0",
        },
        promotionDiscount: {
          currencyCode: "JPY",
          amount: "80",
        },
        promotionDiscountTax: {
          currencyCode: "JPY",
          amount: "8",
        },
        feeBreakdown: [
          { type: "Commission", amount: { currencyCode: "JPY", amount: "360" } },
          { type: "FBA", amount: { currencyCode: "JPY", amount: "220" } },
        ],
      },
    ],
    raw: {
      fixture: "step116-a-order",
    },
  };

  const payloads = buildAmazonSpApiSandboxNormalizedPayloads({
    importJobId: "step116-a-import-job",
    sourceFileName: "step116-a-sp-api-sandbox.json",
    startRowNo: 10,
    order,
  });

  assert(Array.isArray(payloads), "payloads must be an array");
  assert(payloads.length === 2, `expected 2 payloads, got ${payloads.length}`);

  const first = payloads[0];
  const second = payloads[1];

  for (const [index, payload] of payloads.entries()) {
    assert(payload.contractVersion === "amazon-order-normalized-v1", `payload ${index} contractVersion mismatch`);
    assert(payload.sourceType === "AMAZON_ORDER_SP_API", `payload ${index} sourceType mismatch`);
    assert(payload.entityType === "transaction", `payload ${index} entityType mismatch`);
    assert(payload.module === "store-orders", `payload ${index} module mismatch`);
    assert(payload.orderId === "SPAPI-SANDBOX-ORDER-STEP116-A", `payload ${index} orderId mismatch`);
    assert(payload.amazonOrderId === "SPAPI-SANDBOX-ORDER-STEP116-A", `payload ${index} amazonOrderId mismatch`);
    assert(payload.occurredAt === "2026-05-07T12:34:56Z", `payload ${index} occurredAt mismatch`);
    assert(payload.businessMonth === "2026-05", `payload ${index} businessMonth mismatch`);
    assert(payload.currency === "JPY", `payload ${index} currency mismatch`);
    assert(payload.inventoryDeduction === null, `payload ${index} inventoryDeduction should be null`);
    assert(payload.inventoryAudit === null, `payload ${index} inventoryAudit should be null`);
    assert(payload.raw && payload.raw.order && payload.raw.item, `payload ${index} raw fixture missing`);
  }

  assert(first.sourceRowNo === 10, "first sourceRowNo mismatch");
  assert(first.sellerSku === "spapi-sandbox-sku-001", "first sellerSku should preserve trimmed case");
  assert(first.normalizedSellerSku === "SPAPI-SANDBOX-SKU-001", "first normalizedSellerSku mismatch");
  assert(first.quantity === 2, "first quantity mismatch");
  assert(first.grossAmount === 8280, "first grossAmount mismatch");
  assert(first.netAmount === 7110, "first netAmount mismatch");
  assert(first.feeAmount === 1050, "first feeAmount mismatch");
  assert(first.commissionFeeAmount === 600, "first commissionFeeAmount mismatch");
  assert(first.fbaFeeAmount === 450, "first fbaFeeAmount mismatch");
  assert(first.shippingTaxAmount === 30, "first shippingTaxAmount mismatch");
  assert(first.promotionDiscountTaxAmount === 12, "first promotionDiscountTaxAmount mismatch");

  assert(second.sourceRowNo === 11, "second sourceRowNo mismatch");
  assert(second.sellerSku === "spapi-sandbox-sku-002", "second sellerSku mismatch");
  assert(second.normalizedSellerSku === "SPAPI-SANDBOX-SKU-002", "second normalizedSellerSku mismatch");
  assert(second.quantity === 1, "second quantity mismatch");
  assert(second.grossAmount === 5000, "second grossAmount mismatch");
  assert(second.netAmount === 4340, "second netAmount mismatch");
  assert(second.feeAmount === 580, "second feeAmount mismatch");
  assert(second.commissionFeeAmount === 360, "second commissionFeeAmount mismatch");
  assert(second.fbaFeeAmount === 220, "second fbaFeeAmount mismatch");
  assert(second.promotionDiscountTaxAmount === 8, "second promotionDiscountTaxAmount mismatch");

  console.log("[SMOKE_OK] amazon sp-api sandbox normalized contract smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        payloads,
      },
      null,
      2,
    ),
  );
}

try {
  main();
} catch (err) {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
}
