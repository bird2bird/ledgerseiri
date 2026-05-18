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

console.log("========== Step151-PQ frontend smoke ==========");

ok(api.includes("readAmazonSpApiOrdersInventoryDryRunProjection"), "api exports inventory projection helper");
ok(api.includes("readAmazonSpApiOrdersCombinedDryRunProjection"), "api exports combined projection helper");
ok(api.includes("AMAZON_SP_API_ORDERS_INVENTORY_DRY_RUN_PROJECTION_ENDPOINT"), "api has inventory endpoint");
ok(api.includes("AMAZON_SP_API_ORDERS_COMBINED_DRY_RUN_PROJECTION_ENDPOINT"), "api has combined endpoint");
ok(api.includes("createsTransactionNow: false"), "api type keeps createsTransactionNow=false");
ok(api.includes("createsInventoryMovementNow: false"), "api type keeps createsInventoryMovementNow=false");

ok(page.includes("Step151-PQ-INVENTORY-COMBINED-DRY-RUN-PROJECTION-UI"), "Step151-PQ UI marker exists");
ok(page.includes("data-import-connected-service-amazon-orders-combined-projection-panel"), "combined panel exists");
ok(page.includes("data-import-connected-service-amazon-orders-combined-projection-summary"), "combined summary exists");
ok(page.includes("data-import-connected-service-amazon-orders-inventory-projection-drafts"), "inventory drafts UI exists");
ok(page.includes("data-import-connected-service-amazon-orders-combined-projection-excluded-rows"), "combined excluded rows UI exists");

for (const copy of [
  "InventoryMovement",
  "movementType",
  "quantity",
  "dedupeKey",
  "Transaction / InventoryMovement combined dry-run",
]) {
  ok(page.includes(copy), "combined projection copy/field exists: " + copy);
}

const commitHandler = block("handleAmazonOrdersRealImportJobCommitShell");
const combinedHandler = block("refreshAmazonOrdersCombinedDryRunProjection");
const txHandler = block("refreshAmazonOrdersTransactionDryRunProjection");

ok(commitHandler.includes("await refreshAmazonOrdersCombinedDryRunProjection(response.importJobId)"), "commit success refreshes combined projection");
ok(combinedHandler.includes("readAmazonSpApiOrdersInventoryDryRunProjection"), "combined handler calls inventory helper");
ok(combinedHandler.includes("readAmazonSpApiOrdersCombinedDryRunProjection"), "combined handler calls combined helper");
ok(combinedHandler.includes("createsTransactionNow !== false"), "combined handler validates createsTransactionNow=false");
ok(combinedHandler.includes("createsInventoryMovementNow !== false"), "combined handler validates createsInventoryMovementNow=false");
ok(combinedHandler.includes("historicalSyncNow !== false"), "combined handler validates historicalSyncNow=false");

no(combinedHandler, "commitAmazonSpApiOrdersRealImportJob", "combined handler does not call real-importjob");
no(combinedHandler, "previewAmazonSpApiOrdersReal", "combined handler does not call real-preview");
no(txHandler, "readAmazonSpApiOrdersCombinedDryRunProjection", "transaction projection handler does not call combined projection");

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

console.log("[OK] Step151-PQ frontend smoke passed.");
console.log("[RESULT] Combined Transaction/Inventory preview displays inventory drafts and excluded rows.");
console.log("[RESULT] Transaction / InventoryMovement / historical sync remain blocked.");
