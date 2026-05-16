#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const previewPath = path.join(root, "src/imports/amazon-sp-api-orders-real-preview.service.ts");
const controllerPath = path.join(root, "src/imports/imports.controller.ts");
const builderPath = path.join(root, "src/imports/amazon-sp-api-orders-signed-request.builder.ts");

const preview = fs.readFileSync(previewPath, "utf8");
const controller = fs.readFileSync(controllerPath, "utf8");
const builder = fs.readFileSync(builderPath, "utf8");

const requiredPreview = [
  "createdBefore: createdBeforeSafetyWindow.createdBefore",
  "orderStatuses: undefined",
  "orderStatuses: null",
  "P3_Z_LIST_ORDERS_DIAG",
  "writesImportJob: false",
  "writesImportStagingRow: false",
  "writesTransaction: false",
  "writesInventoryMovement: false",
];

for (const marker of requiredPreview) {
  if (!preview.includes(marker)) {
    throw new Error(`[FAIL] preview missing marker: ${marker}`);
  }
}

const forbiddenPreview = [
  "AMAZON_SP_API_ORDERS_REAL_PREVIEW_DEFAULT_STATUSES",
  "AMAZON_SP_API_ORDERS_STATUS_FILTER_DIAGNOSTIC_STATUSES",
  "P3_Z2_STATUS_FILTER_DIAG",
  "diagnosticListOrdersInput",
  "logAmazonSpApiStatusFilterDiagnostic",
  "orderStatuses: input.orderStatuses?.length ? input.orderStatuses",
  "orderStatuses: input.orderStatuses,",
];

for (const marker of forbiddenPreview) {
  if (preview.includes(marker)) {
    throw new Error(`[FAIL] preview still contains status filter/default marker: ${marker}`);
  }
}

if (/orderStatuses:\s*\[[^\]]+\]/.test(controller)) {
  throw new Error("[FAIL] controller still passes hardcoded orderStatuses array");
}

if (/OrderStatuses:\s*input\.orderStatuses/.test(builder)) {
  throw new Error("[FAIL] builder still has unconditional OrderStatuses property");
}

console.log("[OK] Step P3-Z4 no status filter smoke passed");
console.log("[OK] real-preview sends orderStatuses undefined and builder has no unconditional OrderStatuses");
