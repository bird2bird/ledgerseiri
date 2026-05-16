#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const previewPath = path.join(root, "src/imports/amazon-sp-api-orders-real-preview.service.ts");
const builderPath = path.join(root, "src/imports/amazon-sp-api-orders-signed-request.builder.ts");

const preview = fs.readFileSync(previewPath, "utf8");
const builder = fs.readFileSync(builderPath, "utf8");

const previewRequired = [
  "AMAZON_SP_API_ORDERS_LIST_ORDERS_MAX_PAGES = 50",
  "function extractAmazonSpApiListOrdersNextToken",
  "let listOrdersPageCount = 1",
  "let listOrdersNextToken = extractAmazonSpApiListOrdersNextToken",
  "while (listOrdersNextToken && listOrdersPageCount < AMAZON_SP_API_ORDERS_LIST_ORDERS_MAX_PAGES)",
  "nextToken: listOrdersNextToken",
  "orders.push(...parseOrdersFromListOrdersPayload",
  "pageCount: listOrdersPageCount",
  "nextTokenRemaining: Boolean(listOrdersNextToken)",
  "nextTokenRemaining: args.nextTokenRemaining ?? null",
  "pageCount: args.pageCount ?? null",
  "nextTokenRemaining?: boolean;",
  "pageCount?: number;",
  "writesImportJob: false",
  "writesImportStagingRow: false",
  "writesTransaction: false",
  "writesInventoryMovement: false",
];

for (const marker of previewRequired) {
  if (!preview.includes(marker)) {
    throw new Error(`[FAIL] preview missing pagination marker: ${marker}`);
  }
}

const builderRequired = [
  "nextToken?: string",
  "input.nextToken",
  "NextToken: input.nextToken",
];

for (const marker of builderRequired) {
  if (!builder.includes(marker)) {
    throw new Error(`[FAIL] builder missing existing NextToken marker: ${marker}`);
  }
}

if (builder.includes("OrderStatuses: input.orderStatuses,")) {
  throw new Error("[FAIL] builder still has unconditional OrderStatuses property");
}

console.log("[OK] Step P3-Z5-FIX1 ListOrders pagination static smoke passed");
console.log("[OK] service follows NextToken pages and remains no-write");
