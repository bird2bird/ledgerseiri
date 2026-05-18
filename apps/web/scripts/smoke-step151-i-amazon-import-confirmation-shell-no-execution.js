#!/usr/bin/env node

/**
 * Step151-I evolved through Step151-M:
 *
 * The confirmation shell still exists and still shows preview-derived write planning.
 * After Step151-J/M, it is allowed to call real-importjob only from the explicit
 * confirmation handler. This smoke must not lock stale UX copy such as
 * "Step151-J explicit execution".
 */

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../..");
const page = fs.readFileSync(path.join(root, "apps/web/src/app/[lang]/app/data/import/page.tsx"), "utf8");

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

console.log("========== Step151-I smoke: confirmation shell still exists ==========");

ok(page.includes("Step151-I-IMPORT-CONFIRMATION-SHELL-NO-EXECUTION"), "Step151-I marker exists");
ok(page.includes("data-import-connected-service-amazon-orders-import-confirmation-shell"), "confirmation shell exists");
ok(page.includes("data-import-connected-service-amazon-orders-import-confirm-button"), "confirmation button exists");
ok(page.includes("data-import-connected-service-amazon-orders-import-confirmation-orders"), "orders count shown");
ok(page.includes("data-import-connected-service-amazon-orders-import-confirmation-items"), "items count shown");
ok(page.includes("data-import-connected-service-amazon-orders-import-confirmation-unresolved-sku"), "unresolved SKU shown");
ok(page.includes("data-import-connected-service-amazon-orders-import-confirmation-amount"), "amount shown");
ok(page.includes("data-import-connected-service-amazon-orders-import-confirmation-boundaries"), "confirmation boundaries shown");

console.log("========== Step151-I smoke: confirmation shell closeout copy ==========");

ok(page.includes("取込作成の確認"), "confirmation title remains user-readable");
ok(page.includes("取込作成"), "confirmation button text remains user-readable");
ok(page.includes("ImportJob / ImportStagingRow"), "confirmation copy mentions ImportJob / ImportStagingRow");
ok(page.includes("Transaction / Inventory はまだ未反映"), "confirmation copy says Transaction/Inventory not reflected");

no(page, "Step151-J explicit execution", "stale Step151-J explicit execution copy removed from page");

console.log("========== Step151-I smoke: handler layering after Step151-M ==========");

const fetchHandler = block("handleAmazonOrdersConnectedServiceFetchShell");
const previewHandler = block("handleAmazonOrdersRealPreviewShell");
const commitHandler = block("handleAmazonOrdersRealImportJobCommitShell");

ok(fetchHandler.includes("preflightAmazonSpApiOrdersGuardedImport"), "fetch handler still calls preflight");
no(fetchHandler, "previewAmazonSpApiOrdersReal", "fetch handler does not call real-preview");
no(fetchHandler, "commitAmazonSpApiOrdersRealImportJob", "fetch handler does not call real-importjob");

ok(previewHandler.includes("previewAmazonSpApiOrdersReal"), "preview handler calls real-preview");
no(previewHandler, "commitAmazonSpApiOrdersRealImportJob", "preview handler does not call real-importjob");

ok(commitHandler.includes("commitAmazonSpApiOrdersRealImportJob"), "confirmation handler calls real-importjob");
ok(commitHandler.includes("controllerWritesTransaction !== false"), "confirmation handler validates no Transaction write");
ok(commitHandler.includes("controllerWritesInventory !== false"), "confirmation handler validates no Inventory write");
no(commitHandler, "previewAmazonSpApiOrdersHistoricalSyncPlan", "confirmation handler does not call historical sync");

console.log("========== Step151-I smoke: global forbidden paths ==========");

for (const forbidden of [
  "previewAmazonSpApiOrdersHistoricalSyncPlan(",
  "transaction.create",
  "inventoryMovement.create",
  "writesTransaction: true",
  "writesInventoryMovement: true",
]) {
  no(page, forbidden, "page must not contain " + forbidden);
}

console.log("[OK] Step151-I passed.");
console.log("[RESULT] Confirmation shell remains valid after Step151-M closeout.");
console.log("[RESULT] real-importjob remains limited to explicit confirmation.");
console.log("[RESULT] Transaction / InventoryMovement / historical sync remain blocked.");
