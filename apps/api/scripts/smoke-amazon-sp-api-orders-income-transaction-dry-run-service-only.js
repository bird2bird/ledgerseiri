#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const servicePath = path.join(
  root,
  "src/imports/amazon-sp-api-orders-transaction-commit.service.ts"
);

const source = fs.readFileSync(servicePath, "utf8");

const functionName = "previewAmazonSpApiOrdersStagingRowsIncomeTransactionsDryRun";
const start = source.indexOf(`export async function ${functionName}`);
const next = source.indexOf(
  "export async function commitAmazonSpApiOrdersStagingRowsToIncomeTransactions",
  start
);

if (start < 0) {
  throw new Error(`[FAIL] ${functionName} not found`);
}
if (next < 0) {
  throw new Error("[FAIL] next commit function anchor not found");
}

const slice = source.slice(start, next);

const required = [
  "dryRun: true",
  "transactionWriteNow: false",
  "inventoryWriteNow: false",
  "writesDatabase: false",
  "doesNotCreateTransaction: true",
  "doesNotCreateInventoryMovement: true",
  "doesNotUpdateImportJob: true",
  "doesNotUpdateImportStagingRow: true",
  "serviceOnly: true",
];

for (const marker of required) {
  if (!slice.includes(marker)) {
    throw new Error(`[FAIL] missing marker in dry-run function: ${marker}`);
  }
}

const forbidden = [
  ".transaction.create",
  ".transaction.createMany",
  ".transaction.update",
  ".transaction.upsert",
  ".inventoryMovement.create",
  ".inventoryMovement.createMany",
  ".inventoryMovement.update",
  ".inventoryMovement.upsert",
  ".importJob.update",
  ".importStagingRow.update",
  ".importStagingRow.create",
  ".$transaction",
];

for (const marker of forbidden) {
  if (slice.includes(marker)) {
    throw new Error(`[FAIL] forbidden write marker in dry-run function: ${marker}`);
  }
}

if (!slice.includes("input.prisma.transaction.findFirst")) {
  throw new Error("[FAIL] dry-run should check existing Transaction by read-only findFirst");
}

console.log("[OK] Step142-B1 service-only dry-run static smoke passed");
console.log("[OK] No write markers found inside dry-run function slice");
