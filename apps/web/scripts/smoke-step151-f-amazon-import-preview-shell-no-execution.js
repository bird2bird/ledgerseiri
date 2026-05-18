#!/usr/bin/env node

/**
 * Step151-F evolved after Step151-G:
 * Preview shell regression smoke.
 *
 * After Step151-G, the preview shell still exists, but the preview button is enabled
 * and wired to real-preview. Therefore this smoke no longer requires disabled button
 * or forbids previewAmazonSpApiOrdersReal.
 *
 * It still forbids persistence/background-sync wiring.
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

function extractCoreImportsBlock(source) {
  const regex = /import\s*\{([\s\S]*?)\}\s*from\s+"@\/core\/imports\/api";/m;
  const match = regex.exec(source);
  if (!match) throw new Error('[FAIL] Could not find import block from "@/core/imports/api".');
  return match[0];
}

const page = read(pagePath);
const api = read(apiPath);

console.log("========== Step151-F evolved smoke: preview shell anchors ==========");

assertIncludes(page, "Step151-F-PREVIEW-SHELL-NO-EXECUTION", "Step151-F preview shell anchor");
assertIncludes(page, "data-import-connected-service-amazon-orders-preview-shell", "preview shell test id");
assertIncludes(page, "data-import-connected-service-amazon-orders-preview-confirm-button", "preview confirm button test id");
assertIncludes(page, "data-import-connected-service-amazon-orders-preview-shell-summary", "preview shell summary test id");
assertIncludes(page, "data-import-connected-service-amazon-orders-preview-shell-range", "preview shell range test id");
assertIncludes(page, "data-import-connected-service-amazon-orders-preview-shell-created-after", "preview shell createdAfter test id");
assertIncludes(page, "data-import-connected-service-amazon-orders-preview-shell-created-before", "preview shell createdBefore test id");
assertIncludes(page, "data-import-connected-service-amazon-orders-preview-shell-store", "preview shell store test id");
assertIncludes(page, "data-import-connected-service-amazon-orders-preview-shell-marketplace", "preview shell marketplace test id");
assertIncludes(page, "data-import-connected-service-amazon-orders-preview-shell-region", "preview shell region test id");
assertIncludes(page, "data-import-connected-service-amazon-orders-preview-shell-next-action", "preview shell nextAction test id");
assertIncludes(page, "data-import-connected-service-amazon-orders-preview-shell-guard-status", "preview shell guard status test id");
assertIncludes(page, "data-import-connected-service-amazon-orders-preview-shell-boundary", "preview shell boundary test id");
assertIncludes(page, "data-import-connected-service-amazon-orders-preview-shell-no-execution-boundaries", "preview shell boundary badges test id");

console.log("========== Step151-F evolved smoke: visibility and progressive button behavior ==========");

assertIncludes(
  page,
  'preflightResult?.allowed && executionContractStatus === "preflight_ready"',
  "preview shell visible only after preflight_ready"
);

// Step151-G is allowed to enable the Step151-F shell button.
if (page.includes("Step151-G-REAL-PREVIEW-NO-DB")) {
  assertRegex(
    page,
    /data-testid="data-import-connected-service-amazon-orders-preview-confirm-button"[\s\S]*?onClick=\{onPreviewShell\}[\s\S]*?disabled=\{realPreviewLoading\}/m,
    "preview confirm button is enabled and wired after Step151-G"
  );
  assertIncludes(page, "プレビュー確認", "preview button text remains clear");
} else {
  assertRegex(
    page,
    /data-testid="data-import-connected-service-amazon-orders-preview-confirm-button"[\s\S]*?disabled[\s\S]*?>[\s\S]*?プレビュー確認（次ステップ）/m,
    "preview confirm button is disabled before Step151-G"
  );
}

console.log("========== Step151-F evolved smoke: displayed preflight fields ==========");

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

console.log("========== Step151-F evolved smoke: imports boundary ==========");

const coreImportBlock = extractCoreImportsBlock(page);
assertIncludes(coreImportBlock, "preflightAmazonSpApiOrdersGuardedImport", "page imports preflight helper");

for (const forbiddenImport of [
  "commitAmazonSpApiOrdersRealImportJob",
  "previewAmazonSpApiOrdersHistoricalSyncPlan",
  "AMAZON_SP_API_ORDERS_REAL_IMPORTJOB_ENDPOINT",
  "AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_PLAN_PREVIEW_ENDPOINT",
]) {
  assertNotIncludes(coreImportBlock, forbiddenImport, `page core imports must not include ${forbiddenImport}`);
}

console.log("========== Step151-F evolved smoke: persistence remains forbidden page-wide ==========");

for (const forbiddenPageSymbol of [
  "commitAmazonSpApiOrdersRealImportJob(",
  "previewAmazonSpApiOrdersHistoricalSyncPlan(",
  "AMAZON_SP_API_ORDERS_REAL_IMPORTJOB_ENDPOINT",
  "AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_PLAN_PREVIEW_ENDPOINT",
  "writesDatabase: true",
  "createsImportJob: true",
  "writesTransaction: true",
  "writesInventoryMovement: true",
]) {
  assertNotIncludes(page, forbiddenPageSymbol, `page must not wire ${forbiddenPageSymbol}`);
}

console.log("========== Step151-F evolved smoke: API boundary still present ==========");

for (const boundary of [
  "callsRealImportJob: false",
  "callsHistoricalSync: false",
  "createsImportJob: false",
  "createsImportStagingRow: false",
  "createsSyncJob: false",
  "createsSyncSegment: false",
  "writesDatabase: false",
  "writesTransaction: false",
  "writesInventoryMovement: false",
  "returnsRawAccessToken: false",
  "returnsRawRefreshToken: false",
  "returnsRawSecret: false",
]) {
  assertIncludes(api, boundary, `preflight boundary remains ${boundary}`);
}

console.log("========== Step151-F evolved smoke result ==========");
console.log("[OK] Step151-F passed.");
console.log("[RESULT] Preview shell remains visible after preflight_ready.");
console.log("[RESULT] Preview button behavior is valid for the current phase.");
console.log("[RESULT] No real-importjob / historical-sync / DB write path is wired.");
