#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const apiPath = path.join(root, "src/core/imports/api.ts");
const source = fs.readFileSync(apiPath, "utf8");

const required = [
  "AmazonSpApiOrdersIncomeTransactionDryRunRow",
  "AmazonSpApiOrdersIncomeTransactionDryRunResponse",
  "AMAZON_SP_API_ORDERS_INCOME_TRANSACTION_DRY_RUN_ROUTE",
  '"/api/imports/amazon-sp-api/orders/income-transaction-dry-run" as const',
  "fetchAmazonSpApiOrdersIncomeTransactionDryRun",
  "const res = await fetch(url",
  'method: "GET"',
  "readJson<AmazonSpApiOrdersIncomeTransactionDryRunResponse>",
  '"amazon-sp-api-orders-income-transaction-dry-run"',
  "dryRun !== true",
  "writesDatabase !== false",
  "transactionWriteNow !== false",
  "inventoryWriteNow !== false",
];

for (const marker of required) {
  if (!source.includes(marker)) {
    throw new Error(`[FAIL] missing marker: ${marker}`);
  }
}

const start = source.indexOf("export async function fetchAmazonSpApiOrdersIncomeTransactionDryRun");
if (start < 0) {
  throw new Error("[FAIL] helper function not found");
}

const nextExport = source.slice(start + 1).search(/\nexport\s+(type|const|async function|function|class)\s+/);
const end = nextExport >= 0 ? start + 1 + nextExport : source.length;
const slice = source.slice(start, end);

const forbidden = [
  "commitAmazonSpApiOrders",
  "formalCommit",
  "createTransaction",
  "inventoryMovement",
  "deduct",
  "method: \"POST\"",
  "method: 'POST'",
];

for (const marker of forbidden) {
  if (slice.includes(marker)) {
    throw new Error(`[FAIL] forbidden marker in helper slice: ${marker}`);
  }
}

if (!slice.includes("const res = await fetch(url")) {
  throw new Error("[FAIL] helper must call fetch(url) first");
}

if (!slice.includes("readJson<AmazonSpApiOrdersIncomeTransactionDryRunResponse>(\n    res,")) {
  throw new Error("[FAIL] helper must pass Response object into readJson");
}

if (slice.includes("readJson<AmazonSpApiOrdersIncomeTransactionDryRunResponse>(\n    `${")) {
  throw new Error("[FAIL] helper must not pass URL string directly into readJson");
}

console.log("[OK] Step142-B4 frontend helper static smoke passed");
console.log("[OK] Helper uses fetch GET + readJson(Response,label) and enforces no-write response flags");
