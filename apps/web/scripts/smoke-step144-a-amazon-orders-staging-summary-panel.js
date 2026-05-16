#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const cardPath = path.join(root, "src/components/app/jobs/ImportJobsTableCard.tsx");
const panelPath = path.join(root, "src/components/app/jobs/AmazonSpApiOrdersStagingSummaryPanel.tsx");

const card = fs.readFileSync(cardPath, "utf8");
const panel = fs.readFileSync(panelPath, "utf8");

const cardRequired = [
  '"use client";',
  'import { AmazonSpApiOrdersStagingSummaryPanel } from "./AmazonSpApiOrdersStagingSummaryPanel";',
  "<AmazonSpApiOrdersStagingSummaryPanel",
  "rows={detailRowsState.stagingRows}",
  "loading={detailRowsState.loading}",
  "error={detailRowsState.error ? String(detailRowsState.error) : null}",
  "isAmazonSpApiOrdersImportJob(job)",
];

for (const marker of cardRequired) {
  if (!card.includes(marker)) {
    throw new Error(`[FAIL] ImportJobsTableCard missing marker: ${marker}`);
  }
}

const useClientIndex = card.indexOf('"use client";');
const importIndex = card.indexOf('import { AmazonSpApiOrdersStagingSummaryPanel }');
if (importIndex < useClientIndex) {
  throw new Error("[FAIL] summary panel import must appear after use client directive");
}

const panelRequired = [
  'data-testid="amazon-sp-api-orders-staging-summary-panel"',
  "buildAmazonSpApiOrdersStagingSummary",
  'stagingMode: "item-level"',
  "amazonOrderId",
  "orderItemId",
  "sellerSku",
  "quantityOrdered",
  "itemPriceAmount",
  "Transaction作成・InventoryMovement作成・在庫扣減は行いません",
];

for (const marker of panelRequired) {
  if (!panel.includes(marker)) {
    throw new Error(`[FAIL] Summary panel missing marker: ${marker}`);
  }
}

const forbidden = [
  "createTransaction(",
  "inventoryMovement.create",
  "commitAmazonSpApiOrders",
  'fetch("/api/imports/amazon-sp-api/orders/real-importjob',
];

for (const marker of forbidden) {
  if (panel.includes(marker)) {
    throw new Error(`[FAIL] Summary panel must be display-only; forbidden marker found: ${marker}`);
  }
}

console.log("[OK] Step144-A Amazon orders staging summary panel static smoke passed");
console.log("[OK] Panel is frontend-only, item-level, and no-write");
