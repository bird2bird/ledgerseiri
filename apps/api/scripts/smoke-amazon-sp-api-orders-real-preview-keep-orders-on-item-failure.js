#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const previewPath = path.join(root, "src/imports/amazon-sp-api-orders-real-preview.service.ts");
const preview = fs.readFileSync(previewPath, "utf8");

const required = [
  "const normalizedItemsForOrder: AmazonSpApiOrdersNormalizedOrderItem[] = [];",
  "if (!orderItemsHttp.ok)",
  "getOrderItemsFailedCount += 1;",
  "normalizedOrders.push(normalizeRealOrder(order, normalizedItemsForOrder, input));",
  "continue;",
  "normalizedOrderItems.push(...normalizedItemsForOrder);",
  "listOrdersParsedCount: orders.length",
  "normalizedOrdersCount: normalizedOrders.length",
  "normalizedOrderItemsCount: normalizedOrderItems.length",
  "P3_Z6_PREVIEW_COUNT_PIPELINE_DIAG",
  "writesImportJob: false",
  "writesImportStagingRow: false",
  "writesTransaction: false",
  "writesInventoryMovement: false",
];

for (const marker of required) {
  if (!preview.includes(marker)) {
    throw new Error(`[FAIL] preview missing marker: ${marker}`);
  }
}

const failureBranchIndex = preview.indexOf("if (!orderItemsHttp.ok)");
const failureBranchSlice = preview.slice(failureBranchIndex, failureBranchIndex + 500);

if (!failureBranchSlice.includes("normalizedOrders.push(normalizeRealOrder(order, normalizedItemsForOrder, input));")) {
  throw new Error("[FAIL] GetOrderItems failure branch must keep order header");
}

console.log("[OK] Step P3-Z7 keep-orders-on-item-failure static smoke passed");
console.log("[OK] GetOrderItems failure no longer drops the order header");
