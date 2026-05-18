#!/usr/bin/env node

/**
 * Step151-I:
 * Import confirmation shell after real-preview result.
 *
 * Source-level no-network smoke.
 * Verifies confirmation UI exists but real-importjob / DB write path is not wired.
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

console.log("========== Step151-I smoke: confirmation shell anchors ==========");

assertIncludes(page, "Step151-I-IMPORT-CONFIRMATION-SHELL-NO-EXECUTION", "Step151-I marker");
assertIncludes(page, "data-import-connected-service-amazon-orders-import-confirmation-shell", "confirmation shell test id");
assertIncludes(page, "data-import-connected-service-amazon-orders-import-confirm-button", "confirmation button test id");
assertIncludes(page, "data-import-connected-service-amazon-orders-import-confirmation-summary", "confirmation summary test id");
assertIncludes(page, "data-import-connected-service-amazon-orders-import-confirmation-orders", "confirmation orders test id");
assertIncludes(page, "data-import-connected-service-amazon-orders-import-confirmation-items", "confirmation items test id");
assertIncludes(page, "data-import-connected-service-amazon-orders-import-confirmation-unresolved-sku", "confirmation unresolved sku test id");
assertIncludes(page, "data-import-connected-service-amazon-orders-import-confirmation-amount", "confirmation amount test id");
assertIncludes(page, "data-import-connected-service-amazon-orders-import-confirmation-boundaries", "confirmation boundaries test id");
assertIncludes(page, "data-import-connected-service-amazon-orders-import-confirmation-no-execution", "confirmation no-execution test id");

console.log("========== Step151-I smoke: appears after real-preview result ==========");

const previewSummaryIndex = page.indexOf('data-testid="data-import-connected-service-amazon-orders-real-preview-summary"');
const confirmationIndex = page.indexOf('data-testid="data-import-connected-service-amazon-orders-import-confirmation-shell"');

if (previewSummaryIndex < 0 || confirmationIndex < 0 || confirmationIndex <= previewSummaryIndex) {
  throw new Error("[FAIL] confirmation shell must appear after real-preview summary.");
}
console.log("[OK] confirmation shell appears after real-preview summary");

assertRegex(
  page,
  /\{realPreviewResult \? \(\s*<>[\s\S]*?data-testid="data-import-connected-service-amazon-orders-real-preview-summary"[\s\S]*?data-testid="data-import-connected-service-amazon-orders-import-confirmation-shell"[\s\S]*?<\/>(\s*)\) : \(/m,
  "realPreviewResult true branch is wrapped in a fragment"
);

assertRegex(
  page,
  /data-testid="data-import-connected-service-amazon-orders-import-confirm-button"[\s\S]*?disabled[\s\S]*?>[\s\S]*?取込作成（次ステップ）/m,
  "confirmation button is disabled and marked as next step"
);

console.log("========== Step151-I smoke: displayed preview summary fields ==========");

for (const field of [
  "realPreviewResult.validationSummary?.totalOrders",
  "realPreviewResult.normalizedOrders?.length",
  "realPreviewResult.validationSummary?.totalOrderItems",
  "realPreviewResult.normalizedOrderItems?.length",
  "realPreviewResult.skuResolutionSummary?.unresolvedSkuCount",
  "realPreviewResult.transactionImpactPreview?.totalPreviewAmount",
]) {
  assertIncludes(page, field, `confirmation shell displays ${field}`);
}

for (const boundaryText of [
  "nextCreatesImportJob=true",
  "nextCreatesImportStagingRow=true",
  "stillCreatesTransaction=false",
  "stillWritesInventoryMovement=false",
  "commitAmazonSpApiOrdersRealImportJob is not called in this step",
]) {
  assertIncludes(page, boundaryText, `confirmation boundary text ${boundaryText}`);
}

console.log("========== Step151-I smoke: imports remain no real-importjob ==========");

const coreImportBlock = extractCoreImportsBlock(page);

assertIncludes(coreImportBlock, "preflightAmazonSpApiOrdersGuardedImport", "page imports preflight helper");
assertIncludes(coreImportBlock, "previewAmazonSpApiOrdersReal", "page imports real-preview helper");

for (const forbiddenImport of [
  "commitAmazonSpApiOrdersRealImportJob",
  "previewAmazonSpApiOrdersHistoricalSyncPlan",
  "AMAZON_SP_API_ORDERS_REAL_IMPORTJOB_ENDPOINT",
  "AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_PLAN_PREVIEW_ENDPOINT",
]) {
  assertNotIncludes(coreImportBlock, forbiddenImport, `page core imports must not include ${forbiddenImport}`);
}

console.log("========== Step151-I smoke: page-level forbidden execution symbols ==========");

for (const forbiddenPageSymbol of [
  "commitAmazonSpApiOrdersRealImportJob(",
  "previewAmazonSpApiOrdersHistoricalSyncPlan(",
  "AMAZON_SP_API_ORDERS_REAL_IMPORTJOB_ENDPOINT",
  "AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_PLAN_PREVIEW_ENDPOINT",
  "createsImportJob: true",
  "createsImportStagingRow: true",
  "writesDatabase: true",
  "writesTransaction: true",
  "writesInventoryMovement: true",
]) {
  assertNotIncludes(page, forbiddenPageSymbol, `page must not wire ${forbiddenPageSymbol}`);
}

console.log("========== Step151-I smoke: API helper has real-importjob only for later ==========");

assertIncludes(api, "export async function previewAmazonSpApiOrdersReal", "api exports real-preview helper");
assertIncludes(api, "export async function commitAmazonSpApiOrdersRealImportJob", "api has real-importjob helper for later step only");

console.log("========== Step151-I smoke result ==========");
console.log("[OK] Step151-I passed.");
console.log("[RESULT] Import confirmation shell appears after real-preview result.");
console.log("[RESULT] Confirmation button is visible but disabled.");
console.log("[RESULT] No real-importjob / historical-sync / DB write path is wired.");
