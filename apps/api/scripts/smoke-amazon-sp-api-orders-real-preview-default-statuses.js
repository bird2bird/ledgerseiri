#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const previewPath = path.join(root, "src/imports/amazon-sp-api-orders-real-preview.service.ts");
const preview = fs.readFileSync(previewPath, "utf8");

const required = [
  "AMAZON_SP_API_ORDERS_REAL_PREVIEW_DEFAULT_STATUSES",
  "'Pending'",
  "'Unshipped'",
  "'PartiallyShipped'",
  "'Shipped'",
  "'Canceled'",
  "'Unfulfillable'",
  "'InvoiceUnconfirmed'",
  "'PendingAvailability'",
  "orderStatuses: input.orderStatuses?.length ? input.orderStatuses : [...AMAZON_SP_API_ORDERS_REAL_PREVIEW_DEFAULT_STATUSES]",
  "orderStatuses: listOrdersInput.orderStatuses ?? null",
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

const forbidden = [
  "P3_Z2_STATUS_FILTER_DIAG",
  "diagnosticListOrdersInput",
  "logAmazonSpApiStatusFilterDiagnostic",
  "AMAZON_SP_API_ORDERS_STATUS_FILTER_DIAGNOSTIC_STATUSES",
];

for (const marker of forbidden) {
  if (preview.includes(marker)) {
    throw new Error(`[FAIL] temporary status diagnostic marker still present: ${marker}`);
  }
}

console.log("[OK] Step P3-Z3 default status smoke passed");
console.log("[OK] real-preview default statuses include Canceled without adding persistence writes");
