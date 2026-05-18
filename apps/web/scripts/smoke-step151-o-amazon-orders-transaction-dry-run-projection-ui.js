#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../..");
const page = fs.readFileSync(path.join(root, "apps/web/src/app/[lang]/app/data/import/page.tsx"), "utf8");
const api = fs.readFileSync(path.join(root, "apps/web/src/core/imports/api.ts"), "utf8");

function ok(condition, label) {
  if (!condition) throw new Error("[FAIL] " + label);
  console.log("[OK] " + label);
}

function no(source, needle, label) {
  ok(!source.includes(needle), label);
}

function block(functionName) {
  const marker = "function " + functionName;
  const i = page.indexOf(marker);
  ok(i >= 0, functionName + " exists");
  const b = page.indexOf("{", i);
  let d = 0;
  for (let p = b; p < page.length; p += 1) {
    if (page[p] === "{") d += 1;
    if (page[p] === "}") d -= 1;
    if (d === 0) return page.slice(i, p + 1);
  }
  throw new Error("unclosed " + functionName);
}

console.log("========== Step151-O frontend smoke ==========");

ok(api.includes("readAmazonSpApiOrdersTransactionDryRunProjection"), "api exports projection helper");
ok(api.includes("AMAZON_SP_API_ORDERS_TRANSACTION_DRY_RUN_PROJECTION_ENDPOINT"), "api has projection endpoint");
ok(api.includes("writesDatabase: false"), "api type keeps writesDatabase=false");
ok(api.includes("transactionWriteNow: false"), "api type keeps transactionWriteNow=false");
ok(api.includes("createsTransactionNow: false"), "api type keeps createsTransactionNow=false");
ok(api.includes("createsInventoryMovementNow: false"), "api type keeps createsInventoryMovementNow=false");

ok(page.includes("Step151-O-TRANSACTION-DRY-RUN-PROJECTION-UI"), "Step151-O UI marker exists");
ok(page.includes("data-import-connected-service-amazon-orders-transaction-projection-panel"), "projection panel exists");
ok(page.includes("data-import-connected-service-amazon-orders-transaction-projection-summary"), "projection summary exists");
ok(page.includes("data-import-connected-service-amazon-orders-transaction-projection-drafts"), "projection drafts UI exists");
ok(page.includes("data-import-connected-service-amazon-orders-transaction-projection-excluded-rows"), "projection excluded rows UI exists");

for (const copy of [
  "transactionDate",
  "amount",
  "counterparty",
  "source",
  "dedupeHash",
  "ImportStagingRow",
]) {
  ok(page.includes(copy), "projection copy/field exists: " + copy);
}

const commitHandler = block("handleAmazonOrdersRealImportJobCommitShell");
const projectionHandler = block("refreshAmazonOrdersTransactionDryRunProjection");
const readinessHandler = block("refreshAmazonOrdersStagingCommitReadiness");

ok(commitHandler.includes("await refreshAmazonOrdersTransactionDryRunProjection(response.importJobId)"), "commit success refreshes transaction projection");
ok(projectionHandler.includes("readAmazonSpApiOrdersTransactionDryRunProjection"), "projection handler calls projection helper");
ok(projectionHandler.includes("writesDatabase !== false"), "projection handler validates writesDatabase=false");
ok(projectionHandler.includes("transactionWriteNow !== false"), "projection handler validates transactionWriteNow=false");
ok(projectionHandler.includes("createsTransactionNow !== false"), "projection handler validates createsTransactionNow=false");
ok(projectionHandler.includes("createsInventoryMovementNow !== false"), "projection handler validates createsInventoryMovementNow=false");
ok(projectionHandler.includes("historicalSyncNow !== false"), "projection handler validates historicalSyncNow=false");

no(projectionHandler, "commitAmazonSpApiOrdersRealImportJob", "projection handler does not call real-importjob");
no(projectionHandler, "previewAmazonSpApiOrdersReal", "projection handler does not call real-preview");
no(readinessHandler, "readAmazonSpApiOrdersTransactionDryRunProjection", "readiness handler does not call projection");

for (const forbidden of [
  "previewAmazonSpApiOrdersHistoricalSyncPlan(",
  "transaction.create",
  "transaction.createMany",
  "inventoryMovement.create",
  "inventoryMovement.createMany",
  "writesTransaction: true",
  "writesInventoryMovement: true",
]) {
  no(page, forbidden, "page must not contain " + forbidden);
}

console.log("[OK] Step151-O frontend smoke passed.");
console.log("[RESULT] Transaction draft projection UI displays projected and excluded rows.");
console.log("[RESULT] Transaction / InventoryMovement / historical sync remain blocked.");
