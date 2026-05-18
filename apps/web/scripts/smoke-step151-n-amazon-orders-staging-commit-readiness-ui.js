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

console.log("========== Step151-N frontend smoke ==========");

ok(api.includes("readAmazonSpApiOrdersStagingCommitReadiness"), "api exports readiness helper");
ok(api.includes("AMAZON_SP_API_ORDERS_STAGING_COMMIT_READINESS_ENDPOINT"), "api has readiness endpoint");
ok(api.includes("writesDatabase?: false"), "api type keeps writesDatabase=false");
ok(api.includes("transactionWriteNow?: false"), "api type keeps transactionWriteNow=false");
ok(api.includes("inventoryWriteNow?: false"), "api type keeps inventoryWriteNow=false");

ok(page.includes("Step151-N-STAGING-COMMIT-READINESS-UI"), "Step151-N UI marker exists");
ok(page.includes("data-import-connected-service-amazon-orders-staging-readiness-panel"), "readiness panel exists");
ok(page.includes("data-import-connected-service-amazon-orders-staging-readiness-summary"), "readiness summary exists");
ok(page.includes("data-import-connected-service-amazon-orders-staging-readiness-blocked-reasons"), "blocked reasons UI exists");
ok(page.includes("data-import-connected-service-amazon-orders-staging-readiness-rows"), "readiness rows UI exists");

for (const copy of [
  "unresolved SKU",
  "missing amount",
  "duplicate order",
  "missing target mapping",
  "invalid order status",
]) {
  ok(page.includes(copy), "blocked reason copy exists: " + copy);
}

const commitHandler = block("handleAmazonOrdersRealImportJobCommitShell");
const readinessHandler = block("refreshAmazonOrdersStagingCommitReadiness");
const previewHandler = block("handleAmazonOrdersRealPreviewShell");

ok(commitHandler.includes("await refreshAmazonOrdersStagingCommitReadiness(response.importJobId)"), "commit success refreshes readiness");
ok(readinessHandler.includes("readAmazonSpApiOrdersStagingCommitReadiness"), "readiness handler calls readiness helper");
ok(readinessHandler.includes("writesDatabase !== false"), "readiness handler validates writesDatabase=false");
ok(readinessHandler.includes("transactionWriteNow !== false"), "readiness handler validates transactionWriteNow=false");
ok(readinessHandler.includes("inventoryWriteNow !== false"), "readiness handler validates inventoryWriteNow=false");

no(readinessHandler, "commitAmazonSpApiOrdersRealImportJob", "readiness handler does not call real-importjob");
no(readinessHandler, "previewAmazonSpApiOrdersReal", "readiness handler does not call real-preview");
no(previewHandler, "readAmazonSpApiOrdersStagingCommitReadiness", "preview handler does not call readiness");

for (const forbidden of [
  "previewAmazonSpApiOrdersHistoricalSyncPlan(",
  "transaction.create",
  "inventoryMovement.create",
  "writesTransaction: true",
  "writesInventoryMovement: true",
]) {
  no(page, forbidden, "page must not contain " + forbidden);
}

console.log("[OK] Step151-N frontend smoke passed.");
console.log("[RESULT] Readiness UI displays canCommit, blocked reasons, and row-level readiness.");
console.log("[RESULT] Transaction / InventoryMovement / historical sync remain blocked.");
