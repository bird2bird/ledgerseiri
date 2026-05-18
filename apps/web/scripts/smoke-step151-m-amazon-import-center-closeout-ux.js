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

console.log("========== Step151-M smoke: closeout UI anchors ==========");

for (const marker of [
  "Step151-M-IMPORT-CENTER-CLOSEOUT-UX",
  "data-import-connected-service-amazon-orders-closeout-status",
  "data-import-connected-service-amazon-orders-closeout-status-label",
  "data-import-connected-service-amazon-orders-closeout-status-copy",
]) {
  ok(page.includes(marker), "closeout anchor exists: " + marker);
}

for (const copy of [
  "取込完了",
  "明細確認済み",
  "Transaction/Inventory はまだ未反映",
  "事前確認 → プレビュー → 取込作成 → 明細確認",
]) {
  ok(page.includes(copy), "user-facing closeout copy exists: " + copy);
}

ok(page.includes("amazonOrdersFlowStatusLabel"), "flow status label is derived");
ok(page.includes("amazonOrdersFlowStatusTone"), "flow status tone is derived");

console.log("========== Step151-M smoke: stale visible copy removed ==========");

for (const stale of [
  "Step151-Bでは実行しません",
  "Step151-Dでは preview は呼び出しません",
  "将来段階です",
  "Step150-D は UI shell のみです",
  "Step151-I ではまだ DB 書き込みを実行しません",
  "Step151-F では real-preview API",
  "このステップでは実行契約だけを表示します",
]) {
  no(page, stale, "stale copy removed: " + stale);
}

console.log("========== Step151-M smoke: handler boundaries ==========");

const fetchHandler = block("handleAmazonOrdersConnectedServiceFetchShell");
const previewHandler = block("handleAmazonOrdersRealPreviewShell");
const commitHandler = block("handleAmazonOrdersRealImportJobCommitShell");
const refreshHandler = block("refreshAmazonOrdersImportedReadModel");
const detailHandler = block("openAmazonOrdersImportedReadModelDetail");

ok(fetchHandler.includes("preflightAmazonSpApiOrdersGuardedImport"), "fetch handler still calls preflight");
no(fetchHandler, "previewAmazonSpApiOrdersReal", "fetch handler does not call preview");
no(fetchHandler, "commitAmazonSpApiOrdersRealImportJob", "fetch handler does not call importjob");

ok(previewHandler.includes("previewAmazonSpApiOrdersReal"), "preview handler calls real-preview");
no(previewHandler, "commitAmazonSpApiOrdersRealImportJob", "preview handler does not call importjob");

ok(commitHandler.includes("commitAmazonSpApiOrdersRealImportJob"), "commit handler calls real-importjob");
ok(commitHandler.includes("await load()"), "commit handler refreshes Import Jobs snapshot");
ok(commitHandler.includes("await refreshAmazonOrdersImportedReadModel"), "commit handler refreshes read-model");
ok(commitHandler.includes("controllerWritesTransaction !== false"), "commit handler validates no Transaction write");
ok(commitHandler.includes("controllerWritesInventory !== false"), "commit handler validates no Inventory write");

ok(refreshHandler.includes("listAmazonImportedOrders"), "refresh handler reads imported orders");
ok(detailHandler.includes("getAmazonImportedOrderDetail"), "detail handler reads imported order detail");
no(refreshHandler, "commitAmazonSpApiOrdersRealImportJob", "read-model refresh does not write importjob");
no(detailHandler, "commitAmazonSpApiOrdersRealImportJob", "detail read does not write importjob");

console.log("========== Step151-M smoke: API read-model boundaries remain no-write ==========");

ok(api.includes("readsExistingImportJob: true"), "api reads existing ImportJob");
ok(api.includes("readsExistingImportStagingRow: true"), "api reads existing ImportStagingRow");
ok(api.includes("writesDatabase: false"), "api keeps writesDatabase=false");
ok(api.includes("writesTransaction: false"), "api keeps writesTransaction=false");
ok(api.includes("writesInventoryMovement: false"), "api keeps writesInventoryMovement=false");

console.log("========== Step151-M smoke: global forbidden paths ==========");

for (const forbidden of [
  "previewAmazonSpApiOrdersHistoricalSyncPlan(",
  "transaction.create",
  "inventoryMovement.create",
  "writesTransaction: true",
  "writesInventoryMovement: true",
]) {
  no(page, forbidden, "page must not contain " + forbidden);
}

console.log("[OK] Step151-M passed.");
console.log("[RESULT] Import Center single-pull Amazon Orders UX is closed out.");
console.log("[RESULT] Success states are user-readable.");
console.log("[RESULT] Transaction / InventoryMovement / historical sync remain blocked.");
