#!/usr/bin/env node

/**
 * Step151-F evolved through Step151-J:
 * Preview shell regression smoke.
 *
 * Step151-F's responsibility after Step151-J:
 * - Preview shell still appears only after preflight_ready.
 * - Preview confirm button still calls onPreviewShell.
 * - Preview handler still calls real-preview only.
 * - Preview handler must not call real-importjob.
 * - Page may import/call commitAmazonSpApiOrdersRealImportJob, but only inside explicit confirmation handler.
 * - Historical sync / Transaction / InventoryMovement remain forbidden.
 */

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "../../..");
const pagePath = path.join(repoRoot, "apps/web/src/app/[lang]/app/data/import/page.tsx");
const apiPath = path.join(repoRoot, "apps/web/src/core/imports/api.ts");

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`);
  return fs.readFileSync(file, "utf8");
}

function assertIncludes(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`[FAIL] Missing ${label}: ${needle}`);
  console.log(`[OK] ${label}`);
}

function assertNotIncludes(source, needle, label) {
  if (source.includes(needle)) throw new Error(`[FAIL] Forbidden ${label}: ${needle}`);
  console.log(`[OK] ${label}`);
}

function assertRegex(source, regex, label) {
  if (!regex.test(source)) throw new Error(`[FAIL] Missing ${label}: ${regex}`);
  console.log(`[OK] ${label}`);
}

function extractFunctionBlock(source, functionName) {
  const marker = `function ${functionName}`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`[FAIL] Function not found: ${functionName}`);

  const braceStart = source.indexOf("{", start);
  if (braceStart < 0) throw new Error(`[FAIL] Function body not found: ${functionName}`);

  let depth = 0;
  for (let i = braceStart; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }

  throw new Error(`[FAIL] Function body did not close: ${functionName}`);
}

function extractCoreImportsBlock(source) {
  const regex = /import\s*\{([\s\S]*?)\}\s*from\s+"@\/core\/imports\/api";/m;
  const match = regex.exec(source);
  if (!match) throw new Error('[FAIL] Could not find import block from "@/core/imports/api".');
  return match[0];
}

const page = read(pagePath);
const api = read(apiPath);

console.log("========== Step151-F smoke: preview shell anchors ==========");

for (const anchor of [
  "Step151-F-PREVIEW-SHELL-NO-EXECUTION",
  "data-import-connected-service-amazon-orders-preview-shell",
  "data-import-connected-service-amazon-orders-preview-confirm-button",
  "data-import-connected-service-amazon-orders-preview-shell-summary",
  "data-import-connected-service-amazon-orders-preview-shell-range",
  "data-import-connected-service-amazon-orders-preview-shell-created-after",
  "data-import-connected-service-amazon-orders-preview-shell-created-before",
  "data-import-connected-service-amazon-orders-preview-shell-store",
  "data-import-connected-service-amazon-orders-preview-shell-marketplace",
  "data-import-connected-service-amazon-orders-preview-shell-region",
  "data-import-connected-service-amazon-orders-preview-shell-next-action",
  "data-import-connected-service-amazon-orders-preview-shell-guard-status",
  "data-import-connected-service-amazon-orders-preview-shell-boundary",
  "data-import-connected-service-amazon-orders-preview-shell-no-execution-boundaries",
]) {
  assertIncludes(page, anchor, `preview shell anchor ${anchor}`);
}

console.log("========== Step151-F smoke: visibility and preview button behavior ==========");

assertIncludes(
  page,
  'preflightResult?.allowed && executionContractStatus === "preflight_ready"',
  "preview shell visible only after preflight_ready"
);

assertRegex(
  page,
  /data-testid="data-import-connected-service-amazon-orders-preview-confirm-button"[\s\S]*?onClick=\{onPreviewShell\}[\s\S]*?disabled=\{realPreviewLoading\}/m,
  "preview confirm button is wired to onPreviewShell"
);

assertIncludes(page, "プレビュー確認", "preview button text remains clear");

console.log("========== Step151-F smoke: displayed preflight fields ==========");

for (const field of [
  "preflightResult.dateRange.rangePreset",
  "preflightResult.dateRange.days",
  "preflightResult.dateRange.createdAfter",
  "preflightResult.dateRange.createdBefore",
  "preflightResult.scope.storeId",
  "preflightResult.scope.marketplaceId",
  "preflightResult.scope.region",
  "preflightResult.nextAction",
  "preflightResult.connectionReadiness.connected",
  "preflightResult.dateRange.locked",
  "preflightResult.boundaries.callsRealPreview",
  "preflightResult.boundaries.writesDatabase",
]) {
  assertIncludes(page, field, `preview shell displays ${field}`);
}

console.log("========== Step151-F smoke: imports boundary after Step151-J ==========");

const coreImportBlock = extractCoreImportsBlock(page);
assertIncludes(coreImportBlock, "preflightAmazonSpApiOrdersGuardedImport", "page imports preflight helper");
assertIncludes(coreImportBlock, "previewAmazonSpApiOrdersReal", "page imports real-preview helper");

// After Step151-J, real-importjob helper is allowed at page import level.
// It must be used only by the confirmation handler, not by fetch/preview handler.
assertIncludes(
  coreImportBlock,
  "commitAmazonSpApiOrdersRealImportJob",
  "page imports real-importjob helper after Step151-J"
);

for (const forbiddenImport of [
  "previewAmazonSpApiOrdersHistoricalSyncPlan",
  "AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_PLAN_PREVIEW_ENDPOINT",
]) {
  assertNotIncludes(coreImportBlock, forbiddenImport, `page core imports must not include ${forbiddenImport}`);
}

console.log("========== Step151-F smoke: handler layering boundary ==========");

const fetchHandler = extractFunctionBlock(page, "handleAmazonOrdersConnectedServiceFetchShell");
const previewHandler = extractFunctionBlock(page, "handleAmazonOrdersRealPreviewShell");
const commitHandler = extractFunctionBlock(page, "handleAmazonOrdersRealImportJobCommitShell");

assertIncludes(fetchHandler, "preflightAmazonSpApiOrdersGuardedImport", "fetch handler still calls preflight");
assertNotIncludes(fetchHandler, "previewAmazonSpApiOrdersReal", "fetch handler does not call real-preview");
assertNotIncludes(fetchHandler, "commitAmazonSpApiOrdersRealImportJob", "fetch handler does not call real-importjob");

assertIncludes(previewHandler, "previewAmazonSpApiOrdersReal", "preview handler calls real-preview");
assertNotIncludes(previewHandler, "commitAmazonSpApiOrdersRealImportJob", "preview handler does not call real-importjob");
assertNotIncludes(previewHandler, "previewAmazonSpApiOrdersHistoricalSyncPlan", "preview handler does not call historical sync");

assertIncludes(commitHandler, "commitAmazonSpApiOrdersRealImportJob", "confirmation handler calls real-importjob");
assertNotIncludes(commitHandler, "previewAmazonSpApiOrdersHistoricalSyncPlan", "confirmation handler does not call historical sync");
assertIncludes(commitHandler, "controllerWritesTransaction !== false", "confirmation handler validates no Transaction write");
assertIncludes(commitHandler, "controllerWritesInventory !== false", "confirmation handler validates no Inventory write");

console.log("========== Step151-F smoke: page-wide still-forbidden execution paths ==========");

for (const forbiddenPageSymbol of [
  "previewAmazonSpApiOrdersHistoricalSyncPlan(",
  "AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_PLAN_PREVIEW_ENDPOINT",
  "writesTransaction: true",
  "writesInventoryMovement: true",
]) {
  assertNotIncludes(page, forbiddenPageSymbol, `page must not wire ${forbiddenPageSymbol}`);
}

console.log("========== Step151-F smoke: API preflight boundary still present ==========");

for (const boundary of [
  "callsHistoricalSync: false",
  "createsSyncJob: false",
  "createsSyncSegment: false",
  "writesTransaction: false",
  "writesInventoryMovement: false",
  "returnsRawAccessToken: false",
  "returnsRawRefreshToken: false",
  "returnsRawSecret: false",
]) {
  assertIncludes(api, boundary, `preflight boundary remains ${boundary}`);
}

console.log("========== Step151-F smoke result ==========");
console.log("[OK] Step151-F passed.");
console.log("[RESULT] Preview shell remains valid after Step151-J.");
console.log("[RESULT] real-importjob is allowed only in explicit confirmation handler.");
console.log("[RESULT] Transaction / InventoryMovement / historical sync remain blocked.");
