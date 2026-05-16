#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const cardPath = path.join(root, "src/components/app/jobs/ImportJobsTableCard.tsx");
const groupPath = path.join(root, "src/components/app/jobs/AmazonSpApiOrdersGroupedStagingList.tsx");

const card = fs.readFileSync(cardPath, "utf8");
const group = fs.readFileSync(groupPath, "utf8");

const cardRequired = [
  'import { AmazonSpApiOrdersGroupedStagingList } from "./AmazonSpApiOrdersGroupedStagingList";',
  "<AmazonSpApiOrdersGroupedStagingList rows={detailRowsState.stagingRows} />",
  "isAmazonSpApiOrdersImportJob(job)",
];

for (const marker of cardRequired) {
  if (!card.includes(marker)) {
    throw new Error(`[FAIL] ImportJobsTableCard missing marker: ${marker}`);
  }
}

const groupRequired = [
  'data-testid="amazon-sp-api-orders-grouped-staging-list"',
  'data-testid="amazon-sp-api-orders-group-card"',
  "buildAmazonSpApiGroupedOrders",
  "amazonOrderId",
  "orderItemId",
  "sellerSku",
  "quantityOrdered",
  "itemPriceAmount",
  "grouped by amazonOrderId",
  "Transaction作成・InventoryMovement作成・在庫扣減は行いません",
];

for (const marker of groupRequired) {
  if (!group.includes(marker)) {
    throw new Error(`[FAIL] grouped list missing marker: ${marker}`);
  }
}

const forbidden = [
  "row.status",
  "createTransaction(",
  "inventoryMovement.create",
  "commitAmazonSpApiOrders",
  'fetch("/api/imports/amazon-sp-api/orders/real-importjob',
  "method: \"POST\"",
];

for (const marker of forbidden) {
  if (group.includes(marker)) {
    throw new Error(`[FAIL] grouped list must be display-only; forbidden marker found: ${marker}`);
  }
}

console.log("[OK] Step144-B Amazon orders grouped staging list static smoke passed");
console.log("[OK] Grouped list is frontend-only, grouped by amazonOrderId, and no-write");
