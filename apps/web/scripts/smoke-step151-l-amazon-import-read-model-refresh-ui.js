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

console.log("========== Step151-L smoke: imports and UI anchors ==========");

ok(page.includes("Step151-L-IMPORTED-ORDERS-READ-MODEL-REFRESH-UI"), "Step151-L marker exists");
ok(page.includes("listAmazonImportedOrders"), "page imports/calls listAmazonImportedOrders");
ok(page.includes("getAmazonImportedOrderDetail"), "page imports/calls getAmazonImportedOrderDetail");
ok(page.includes("type AmazonImportedOrdersReadModelListResponse"), "page imports list response type");
ok(page.includes("type AmazonImportedOrderDetailReadModelResponse"), "page imports detail response type");

for (const testid of [
  "data-import-connected-service-amazon-orders-imported-read-model-panel",
  "data-import-connected-service-amazon-orders-imported-read-model-refresh-button",
  "data-import-connected-service-amazon-orders-imported-read-model-boundaries",
  "data-import-connected-service-amazon-orders-imported-read-model-summary",
  "data-import-connected-service-amazon-orders-imported-read-model-total-orders",
  "data-import-connected-service-amazon-orders-imported-read-model-total-items",
  "data-import-connected-service-amazon-orders-imported-read-model-first-order",
  "data-import-connected-service-amazon-orders-imported-read-model-detail-button",
  "data-import-connected-service-amazon-orders-imported-read-model-detail",
  "data-import-connected-service-amazon-orders-imported-read-model-detail-order-id",
  "data-import-connected-service-amazon-orders-imported-read-model-detail-boundary",
]) {
  ok(page.includes(testid), "UI test id exists: " + testid);
}

console.log("========== Step151-L smoke: read-model helper contract ==========");

ok(api.includes("export async function listAmazonImportedOrders"), "api exports listAmazonImportedOrders");
ok(api.includes("export async function getAmazonImportedOrderDetail"), "api exports getAmazonImportedOrderDetail");
ok(api.includes("AMAZON_IMPORTED_ORDERS_READ_MODEL_ENDPOINT"), "api has list endpoint");
ok(api.includes("AMAZON_IMPORTED_ORDER_DETAIL_READ_MODEL_ENDPOINT"), "api has detail endpoint");
ok(api.includes("readsExistingImportJob: true"), "api contract reads ImportJob");
ok(api.includes("readsExistingImportStagingRow: true"), "api contract reads ImportStagingRow");
ok(api.includes("writesDatabase: false"), "api contract keeps writesDatabase=false");
ok(api.includes("writesTransaction: false"), "api contract keeps writesTransaction=false");
ok(api.includes("writesInventoryMovement: false"), "api contract keeps writesInventoryMovement=false");

console.log("========== Step151-L smoke: handler boundaries ==========");

const commitHandler = block("handleAmazonOrdersRealImportJobCommitShell");
const refreshHandler = block("refreshAmazonOrdersImportedReadModel");
const detailHandler = block("openAmazonOrdersImportedReadModelDetail");
const previewHandler = block("handleAmazonOrdersRealPreviewShell");

ok(commitHandler.includes("commitAmazonSpApiOrdersRealImportJob"), "commit handler still calls real-importjob");
ok(commitHandler.includes("await load()"), "commit handler refreshes Import Center jobs snapshot");
ok(commitHandler.includes("await refreshAmazonOrdersImportedReadModel"), "commit handler refreshes imported orders read-model after success");

ok(refreshHandler.includes("listAmazonImportedOrders"), "refresh handler calls listAmazonImportedOrders");
ok(refreshHandler.includes("openAmazonOrdersImportedReadModelDetail"), "refresh handler opens detail for selected order");
ok(refreshHandler.includes("writesDatabase !== false"), "refresh handler validates writesDatabase=false");
ok(refreshHandler.includes("writesTransaction !== false"), "refresh handler validates writesTransaction=false");
ok(refreshHandler.includes("writesInventoryMovement !== false"), "refresh handler validates writesInventoryMovement=false");

ok(detailHandler.includes("getAmazonImportedOrderDetail"), "detail handler calls getAmazonImportedOrderDetail");
ok(detailHandler.includes("writesDatabase !== false"), "detail handler validates writesDatabase=false");
ok(detailHandler.includes("writesTransaction !== false"), "detail handler validates writesTransaction=false");
ok(detailHandler.includes("writesInventoryMovement !== false"), "detail handler validates writesInventoryMovement=false");

no(refreshHandler, "commitAmazonSpApiOrdersRealImportJob", "read-model refresh handler does not call real-importjob");
no(detailHandler, "commitAmazonSpApiOrdersRealImportJob", "detail handler does not call real-importjob");
no(previewHandler, "listAmazonImportedOrders", "preview handler does not read imported read-model");
no(previewHandler, "getAmazonImportedOrderDetail", "preview handler does not read detail read-model");

console.log("========== Step151-L smoke: global forbidden paths ==========");

for (const forbidden of [
  "previewAmazonSpApiOrdersHistoricalSyncPlan(",
  "writesTransaction: true",
  "writesInventoryMovement: true",
  "transaction.create",
  "inventoryMovement.create",
]) {
  no(page, forbidden, "page must not contain " + forbidden);
}

console.log("[OK] Step151-L passed.");
console.log("[RESULT] Commit success refreshes Import Center and imported orders read-model.");
console.log("[RESULT] Imported order detail is readable from the UI path.");
console.log("[RESULT] Transaction / InventoryMovement / historical sync remain blocked.");
