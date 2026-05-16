#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const previewPath = path.join(root, "src/imports/amazon-sp-api-orders-real-preview.service.ts");
const preview = fs.readFileSync(previewPath, "utf8");

const required = [
  "function logAmazonSpApiPreviewCountPipelineDiagnostic",
  "P3_Z6_PREVIEW_COUNT_PIPELINE_DIAG",
  "listOrdersParsedCount: orders.length",
  "normalizedOrdersCount: normalizedOrders.length",
  "normalizedOrderItemsCount: normalizedOrderItems.length",
  "getOrderItemsAttemptCount",
  "getOrderItemsSuccessCount",
  "getOrderItemsFailedCount",
  "responseOrdersCount: normalizedOrders.length",
  "responseOrderItemsCount: normalizedOrderItems.length",
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

const callMarker = "logAmazonSpApiPreviewCountPipelineDiagnostic({";
const callCount = preview.split(callMarker).length - 1;
if (callCount !== 1) {
  throw new Error(`[FAIL] expected exactly one diagnostic call, found ${callCount}`);
}

const callIndex = preview.indexOf(callMarker);
const normalizedOrdersIndex = preview.indexOf("const normalizedOrders");
const normalizedOrderItemsIndex = preview.indexOf("const normalizedOrderItems");
const attemptCounterIndex = preview.indexOf("let getOrderItemsAttemptCount = 0;");
const successCounterIndex = preview.indexOf("let getOrderItemsSuccessCount = 0;");
const failedCounterIndex = preview.indexOf("let getOrderItemsFailedCount = 0;");

for (const [label, index] of [
  ["normalizedOrders", normalizedOrdersIndex],
  ["normalizedOrderItems", normalizedOrderItemsIndex],
  ["attemptCounter", attemptCounterIndex],
  ["successCounter", successCounterIndex],
  ["failedCounter", failedCounterIndex],
]) {
  if (index < 0) {
    throw new Error(`[FAIL] missing placement marker: ${label}`);
  }
  if (index > callIndex) {
    throw new Error(`[FAIL] ${label} appears after diagnostic call`);
  }
}

const returnAfterCall = preview.indexOf("  return {", callIndex);
if (returnAfterCall < 0) {
  throw new Error("[FAIL] main return should appear after diagnostic call");
}

console.log("[OK] Step P3-Z6-FIX1 preview count pipeline diagnostic static smoke passed");
console.log("[OK] Diagnostic call is placed after normalization counters and before main response return");
