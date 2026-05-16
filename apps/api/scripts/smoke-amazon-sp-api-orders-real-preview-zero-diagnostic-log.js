#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const previewPath = path.join(root, "src/imports/amazon-sp-api-orders-real-preview.service.ts");
const source = fs.readFileSync(previewPath, "utf8");

const required = [
  "function summarizeAmazonSpApiListOrdersPayloadForDiagnostics",
  "function logAmazonSpApiListOrdersZeroDiagnostic",
  "P3_Z_LIST_ORDERS_DIAG",
  "requestSummary",
  "responseSummary",
  "rawOrdersCount",
  "parsedOrdersCount",
  "ordersArrayPath",
  "nextTokenPresent",
  "firstOrders",
  "writesImportJob: false",
  "writesImportStagingRow: false",
  "writesTransaction: false",
  "writesInventoryMovement: false",
  "createdBefore: createdBeforeSafetyWindow.createdBefore",
  "responsePayload: listOrdersHttp.sanitizedResponse.json",
];

for (const marker of required) {
  if (!source.includes(marker)) {
    throw new Error(`[FAIL] missing marker: ${marker}`);
  }
}

if (source.includes("accessToken: input.accessToken") && source.includes("P3_Z_LIST_ORDERS_DIAG")) {
  const logIndex = source.indexOf("logAmazonSpApiListOrdersZeroDiagnostic({");
  const logSlice = source.slice(logIndex, logIndex + 900);
  if (logSlice.includes("accessToken") || logSlice.includes("credentials") || logSlice.includes("Authorization")) {
    throw new Error("[FAIL] diagnostic log must not include token/credential/Authorization");
  }
}

console.log("[OK] Step P3-Z ListOrders zero diagnostic static smoke passed");
console.log("[OK] Diagnostic log is sanitized and no-write");
