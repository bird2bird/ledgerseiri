#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const servicePath = path.join(root, "src/imports/amazon-sp-api-orders-transaction-commit.service.ts");
const source = fs.readFileSync(servicePath, "utf8");

function assertIncludes(needle, message) {
  if (!source.includes(needle)) {
    throw new Error(`${message}\nMissing: ${needle}`);
  }
}

function assertNotIncludesInSlice(slice, needle, message) {
  if (slice.includes(needle)) {
    throw new Error(`${message}\nForbidden: ${needle}`);
  }
}

assertIncludes("function isAmazonSpApiOrdersOrderHeaderStagingPayload", "Must classify header rows.");
assertIncludes("headerContextByAmazonOrderId", "Must use order-header rows as context fallback.");
assertIncludes("const itemStagingRows = stagingRows.filter", "Must keep item-only filtering.");
assertIncludes("buildAmazonSpApiOrdersIncomeCandidateAmount", "Must centralize amount policy.");
assertIncludes("ITEM_PRICE_PLUS_SHIPPING_EXCLUDES_TAX", "Must expose explicit amount policy.");
assertIncludes("itemPriceAmount", "Rows must expose itemPriceAmount.");
assertIncludes("itemTaxAmount", "Rows must expose itemTaxAmount.");
assertIncludes("shippingPriceAmount", "Rows must expose shippingPriceAmount.");
assertIncludes("candidateAmount", "Rows must expose candidateAmount.");
assertIncludes("orderStatus", "Rows must expose orderStatus context.");
assertIncludes("orderTotalAmount", "Rows must expose orderTotalAmount context.");
assertIncludes("candidateAmountTotal", "Summary must expose candidateAmountTotal.");
assertIncludes("itemTaxTotal", "Summary must expose itemTaxTotal separately.");

const dryRunStart = source.indexOf("export async function previewAmazonSpApiOrdersStagingRowsIncomeTransactionsDryRun");
const commitStart = source.indexOf("export async function commitAmazonSpApiOrdersStagingRowsToIncomeTransactions");

if (dryRunStart < 0 || commitStart < 0 || commitStart <= dryRunStart) {
  throw new Error("[FAIL] Could not locate dry-run and commit function boundaries.");
}

const dryRunSlice = source.slice(dryRunStart, commitStart);

assertIncludes("writesDatabase: false", "Dry-run response must stay writesDatabase=false.");
assertIncludes("transactionWriteNow: false", "Dry-run response must stay transactionWriteNow=false.");
assertIncludes("inventoryWriteNow: false", "Dry-run response must stay inventoryWriteNow=false.");
assertIncludes("doesNotCreateTransaction: true", "Dry-run guardrails must block Transaction creation.");
assertIncludes("doesNotUpdateImportJob: true", "Dry-run guardrails must block ImportJob update.");

assertNotIncludesInSlice(dryRunSlice, ".transaction.create", "Dry-run must not create Transaction.");
assertNotIncludesInSlice(dryRunSlice, ".transaction.createMany", "Dry-run must not createMany Transaction.");
assertNotIncludesInSlice(dryRunSlice, ".inventoryMovement.create", "Dry-run must not create InventoryMovement.");
assertNotIncludesInSlice(dryRunSlice, ".importJob.update", "Dry-run must not update ImportJob.");
assertNotIncludesInSlice(dryRunSlice, ".importStagingRow.update", "Dry-run must not update ImportStagingRow.");

console.log("[OK] Step147-B backend income candidate dry-run read-model smoke passed.");
