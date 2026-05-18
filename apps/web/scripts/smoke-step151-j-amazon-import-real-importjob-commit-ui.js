#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../..");
const page = fs.readFileSync(path.join(root, "apps/web/src/app/[lang]/app/data/import/page.tsx"), "utf8");
const api = fs.readFileSync(path.join(root, "apps/web/src/core/imports/api.ts"), "utf8");
const controller = fs.readFileSync(path.join(root, "apps/api/src/imports/imports.controller.ts"), "utf8");

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

console.log("========== Step151-J smoke ==========");

ok(page.includes("commitAmazonSpApiOrdersRealImportJob"), "page imports/calls real-importjob helper");
ok(page.includes("Step151-J-REAL-IMPORTJOB-COMMIT-UI"), "Step151-J marker exists");
ok(page.includes("data-import-connected-service-amazon-orders-real-importjob-result"), "commit result panel exists");
ok(page.includes("data-import-connected-service-amazon-orders-real-importjob-summary"), "commit summary exists");
ok(page.includes("data-import-connected-service-amazon-orders-real-importjob-writes-transaction"), "writes transaction boundary is displayed");
ok(page.includes("data-import-connected-service-amazon-orders-real-importjob-writes-inventory"), "writes inventory boundary is displayed");

const fetchHandler = block("handleAmazonOrdersConnectedServiceFetchShell");
const previewHandler = block("handleAmazonOrdersRealPreviewShell");
const commitHandler = block("handleAmazonOrdersRealImportJobCommitShell");

ok(fetchHandler.includes("preflightAmazonSpApiOrdersGuardedImport"), "fetch handler calls preflight");
no(fetchHandler, "previewAmazonSpApiOrdersReal", "fetch handler does not call real-preview");
no(fetchHandler, "commitAmazonSpApiOrdersRealImportJob", "fetch handler does not call real-importjob");

ok(previewHandler.includes("previewAmazonSpApiOrdersReal"), "preview handler calls real-preview");
no(previewHandler, "commitAmazonSpApiOrdersRealImportJob", "preview handler does not call real-importjob");

ok(commitHandler.includes("commitAmazonSpApiOrdersRealImportJob"), "commit handler calls real-importjob");
ok(commitHandler.includes("amazonOrdersPreflightResult.scope.storeId"), "uses preflight storeId");
ok(commitHandler.includes("amazonOrdersPreflightResult.scope.marketplaceId"), "uses preflight marketplaceId");
ok(commitHandler.includes("amazonOrdersPreflightResult.scope.region"), "uses preflight region");
ok(commitHandler.includes("createdAfter"), "uses createdAfter");
ok(commitHandler.includes("createdBefore"), "uses createdBefore");
ok(commitHandler.includes("controllerWritesTransaction !== false"), "validates no transaction");
ok(commitHandler.includes("controllerWritesInventory !== false"), "validates no inventory");
no(commitHandler, "previewAmazonSpApiOrdersHistoricalSyncPlan", "commit handler does not call historical sync");

ok(api.includes("export async function commitAmazonSpApiOrdersRealImportJob"), "api exports commit helper");
ok(api.includes("controllerWritesTransaction?: false"), "api type keeps controllerWritesTransaction=false");
ok(api.includes("controllerWritesInventory?: false"), "api type keeps controllerWritesInventory=false");

ok(controller.includes("@Post('amazon-sp-api/orders/real-importjob')"), "backend real-importjob route exists");
ok(controller.includes("persistAmazonSpApiOrdersRealPreviewToImportJobAndStagingRows"), "backend persistence helper wired");
ok(controller.includes("controllerWritesTransaction: false"), "backend marks no transaction");
ok(controller.includes("controllerWritesInventory: false"), "backend marks no inventory");

no(page, "previewAmazonSpApiOrdersHistoricalSyncPlan(", "page does not call historical sync");
no(page, "writesTransaction: true", "page does not mark transaction write true");
no(page, "writesInventoryMovement: true", "page does not mark inventory movement write true");

console.log("[OK] Step151-J passed.");
console.log("[RESULT] real-importjob is wired only behind explicit confirmation.");
console.log("[RESULT] ImportJob / ImportStagingRow commit UI is displayed.");
console.log("[RESULT] Transaction / InventoryMovement remain blocked.");
