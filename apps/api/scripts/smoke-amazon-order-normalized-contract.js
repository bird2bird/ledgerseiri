#!/usr/bin/env node
"use strict";

const path = require("path");

const helperPath = path.resolve(
  __dirname,
  "../dist/src/imports/amazon-order-normalized-contract.js",
);

let helper;
try {
  helper = require(helperPath);
} catch (err) {
  console.error("[SMOKE_ERROR] compiled helper not found. Run npm run build before this smoke.");
  console.error(String(err && err.message ? err.message : err));
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const payload = helper.buildAmazonOrderNormalizedPayload({
    sourceType: "AMAZON_ORDER_CSV",
    importJobId: "step115-b-import-job",
    sourceRowNo: "12",
    sourceFileName: "2026FebMonthlyTransaction.csv",
    orderId: "250-9234782-3543816",
    orderDate: "2026/02/13 3:21:05 JST",
    sku: " 4q-if43-nlv4 ",
    productName: "Step115 Contract Product",
    quantity: "2",
    amount: "￥6,436",
    grossAmount: "6436",
    netAmount: "5,873",
    signedAmount: "5873",
    itemSalesAmount: "6436",
    itemSalesTaxAmount: "643",
    shippingAmount: "0",
    shippingTaxAmount: "0",
    promotionDiscountAmount: "100",
    promotionDiscountTaxAmount: "10",
    commissionFeeAmount: "590",
    fbaFeeAmount: "520",
    feeAmount: "1110",
    taxAmount: "643",
    store: "Amazon JP",
    fulfillment: "FBA",
    rawTransactionType: "注文",
    description: "Amazon order normalized contract smoke",
    inventoryDeduction: {
      status: "DEDUCTED",
      sourceType: "AMAZON_ORDER_IMPORT",
      matchStrategy: "PRODUCT_SKU_ALIAS",
      skuId: "sku-1",
      skuCode: "TARGET-SKU",
      aliasId: "alias-1",
      aliasSku: "4q-if43-nlv4",
      normalizedAliasSku: "4Q-IF43-NLV4",
      movementId: "movement-1",
      balanceId: "balance-1",
      quantityDelta: -2,
      createdAt: "2026-05-07T00:00:00.000Z",
    },
    raw: {
      "amazon-order-id": "250-9234782-3543816",
      sku: "4q-if43-nlv4",
    },
  });

  helper.assertAmazonOrderNormalizedPayload(payload);

  assert(payload.contractVersion === "amazon-order-normalized-v1", "contractVersion mismatch");
  assert(payload.entityType === "transaction", "entityType mismatch");
  assert(payload.module === "store-orders", "module mismatch");
  assert(payload.sourceType === "AMAZON_ORDER_CSV", "sourceType mismatch");
  assert(payload.orderId === "250-9234782-3543816", "orderId mismatch");
  assert(payload.amazonOrderId === "250-9234782-3543816", "amazonOrderId mismatch");
  assert(payload.sellerSku === "4q-if43-nlv4", "sellerSku should preserve readable SKU");
  assert(payload.normalizedSellerSku === "4Q-IF43-NLV4", "normalizedSellerSku mismatch");
  assert(payload.businessMonth === "2026-02", "businessMonth mismatch");
  assert(payload.quantity === 2, "quantity mismatch");
  assert(payload.grossAmount === 6436, "grossAmount mismatch");
  assert(payload.netAmount === 5873, "netAmount mismatch");
  assert(payload.promotionAmount === 100, "promotionAmount fallback mismatch");
  assert(payload.inventoryDeduction.matchStrategy === "PRODUCT_SKU_ALIAS", "matchStrategy mismatch");
  assert(payload.inventoryDeduction.quantityDelta === -2, "quantityDelta mismatch");

  const spApiPayload = helper.buildAmazonOrderNormalizedPayload({
    sourceType: "AMAZON_ORDER_SP_API",
    orderId: "SPAPI-ORDER-1",
    occurredAt: "2026-05-07T10:00:00.000Z",
    sellerSku: "SPAPI-SKU-1",
    quantity: 1,
    amount: 3980,
    grossAmount: 3980,
    netAmount: 3980,
  });

  helper.assertAmazonOrderNormalizedPayload(spApiPayload);
  assert(spApiPayload.sourceType === "AMAZON_ORDER_SP_API", "SP-API sourceType mismatch");
  assert(spApiPayload.businessMonth === "2026-05", "SP-API businessMonth mismatch");

  console.log("[SMOKE_OK] amazon order normalized contract helper smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        payload,
        spApiPayload,
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
  process.exit(1);
}
