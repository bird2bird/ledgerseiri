#!/usr/bin/env node

/**
 * Step151-G:
 * Wire explicit preview button to real-preview endpoint, but no DB write.
 *
 * Source-level no-network smoke.
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

function extractBalancedBlockFrom(source, start, label) {
  const braceStart = source.indexOf("{", start);
  if (braceStart < 0) throw new Error(`[FAIL] Body opening brace not found: ${label}`);

  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = braceStart; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];

    if (lineComment) {
      if (ch === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (ch === "*" && next === "/") {
        blockComment = false;
        i += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "/" && next === "/") {
      lineComment = true;
      i += 1;
      continue;
    }
    if (ch === "/" && next === "*") {
      blockComment = true;
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }

    if (ch === "{") depth += 1;
    if (ch === "}") depth -= 1;

    if (depth === 0) return source.slice(start, i + 1);
  }

  throw new Error(`[FAIL] Body did not close: ${label}`);
}

function extractFunction(source, functionName) {
  const regex = new RegExp(`(?:async\\s+)?function\\s+${functionName}\\s*\\(`, "m");
  const match = regex.exec(source);
  if (!match || typeof match.index !== "number") {
    throw new Error(`[FAIL] Function not found: ${functionName}`);
  }
  return extractBalancedBlockFrom(source, match.index, functionName);
}

function extractCoreImportsBlock(source) {
  const regex = /import\s*\{([\s\S]*?)\}\s*from\s+"@\/core\/imports\/api";/m;
  const match = regex.exec(source);
  if (!match) throw new Error('[FAIL] Could not find import block from "@/core/imports/api".');
  return match[0];
}

const page = read(pagePath);
const api = read(apiPath);

console.log("========== Step151-G smoke: import boundary ==========");

const coreImportBlock = extractCoreImportsBlock(page);

assertIncludes(coreImportBlock, "preflightAmazonSpApiOrdersGuardedImport", "page imports guarded preflight helper");
assertIncludes(coreImportBlock, "previewAmazonSpApiOrdersReal", "page imports real-preview helper");
assertIncludes(coreImportBlock, "type AmazonSpApiOrdersRealPreviewResponse", "page imports real-preview response type");

for (const forbiddenImport of [
  "commitAmazonSpApiOrdersRealImportJob",
  "previewAmazonSpApiOrdersHistoricalSyncPlan",
  "AMAZON_SP_API_ORDERS_REAL_IMPORTJOB_ENDPOINT",
  "AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_PLAN_PREVIEW_ENDPOINT",
]) {
  assertNotIncludes(coreImportBlock, forbiddenImport, `page core imports must not include ${forbiddenImport}`);
}

console.log("========== Step151-G smoke: preview button enabled and wired ==========");

assertIncludes(page, "Step151-G-REAL-PREVIEW-NO-DB", "Step151-G marker");
assertRegex(
  page,
  /data-testid="data-import-connected-service-amazon-orders-preview-confirm-button"[\s\S]*?onClick=\{onPreviewShell\}[\s\S]*?disabled=\{realPreviewLoading\}/m,
  "preview confirm button is enabled and wired to onPreviewShell"
);
assertIncludes(page, "プレビュー確認", "preview confirm button text");

console.log("========== Step151-G smoke: real-preview handler boundary ==========");

const realPreviewHandler = extractFunction(page, "handleAmazonOrdersRealPreviewShell");

assertIncludes(realPreviewHandler, "previewAmazonSpApiOrdersReal", "real-preview handler calls previewAmazonSpApiOrdersReal");
assertIncludes(realPreviewHandler, "amazonOrdersPreflightResult.scope.storeId", "handler uses preflight storeId");
assertIncludes(realPreviewHandler, "amazonOrdersPreflightResult.scope.marketplaceId", "handler uses preflight marketplaceId");
assertIncludes(realPreviewHandler, "amazonOrdersPreflightResult.scope.region", "handler uses preflight region");
assertIncludes(realPreviewHandler, "createdAfter", "handler uses createdAfter");
assertIncludes(realPreviewHandler, "createdBefore", "handler uses createdBefore");
assertIncludes(realPreviewHandler, "realPreview: true", "handler sends realPreview=true");

for (const requiredBoundaryCheck of [
  "response.writesDatabase !== false",
  "response.importJobWriteNow !== false",
  "response.transactionWriteNow !== false",
  "response.inventoryWriteNow !== false",
]) {
  assertIncludes(realPreviewHandler, requiredBoundaryCheck, `handler validates ${requiredBoundaryCheck}`);
}

for (const forbiddenInPreviewHandler of [
  "commitAmazonSpApiOrdersRealImportJob",
  "previewAmazonSpApiOrdersHistoricalSyncPlan",
  "AMAZON_SP_API_ORDERS_REAL_IMPORTJOB_ENDPOINT",
  "AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_PLAN_PREVIEW_ENDPOINT",
  "createsImportJob: true",
  "writesDatabase: true",
  "writesTransaction: true",
  "writesInventoryMovement: true",
]) {
  assertNotIncludes(realPreviewHandler, forbiddenInPreviewHandler, `real-preview handler must not contain ${forbiddenInPreviewHandler}`);
}

const preflightHandler = extractFunction(page, "handleAmazonOrdersConnectedServiceFetchShell");
assertIncludes(preflightHandler, "setAmazonOrdersRealPreviewResult(null)", "preflight resets real preview result");
assertIncludes(preflightHandler, "setAmazonOrdersRealPreviewError(\"\")", "preflight resets real preview error");
assertIncludes(preflightHandler, "setAmazonOrdersRealPreviewLoading(false)", "preflight resets real preview loading");

console.log("========== Step151-G smoke: result UI summary ==========");

for (const testid of [
  "data-import-connected-service-amazon-orders-real-preview-result",
  "data-import-connected-service-amazon-orders-real-preview-status",
  "data-import-connected-service-amazon-orders-real-preview-summary",
  "data-import-connected-service-amazon-orders-real-preview-total-orders",
  "data-import-connected-service-amazon-orders-real-preview-total-items",
  "data-import-connected-service-amazon-orders-real-preview-unresolved-sku",
  "data-import-connected-service-amazon-orders-real-preview-amount",
  "data-import-connected-service-amazon-orders-real-preview-writes-db",
  "data-import-connected-service-amazon-orders-real-preview-importjob-write",
]) {
  assertIncludes(page, testid, `result UI test id ${testid}`);
}

for (const displayedField of [
  "realPreviewResult.validationSummary?.totalOrders",
  "realPreviewResult.validationSummary?.totalOrderItems",
  "realPreviewResult.skuResolutionSummary?.unresolvedSkuCount",
  "realPreviewResult.transactionImpactPreview?.totalPreviewAmount",
  "realPreviewResult.writesDatabase",
  "realPreviewResult.importJobWriteNow",
]) {
  assertIncludes(page, displayedField, `result UI displays ${displayedField}`);
}

console.log("========== Step151-G smoke: page-level forbidden persistence symbols ==========");

for (const forbiddenPageSymbol of [
  "commitAmazonSpApiOrdersRealImportJob(",
  "previewAmazonSpApiOrdersHistoricalSyncPlan(",
  "AMAZON_SP_API_ORDERS_REAL_IMPORTJOB_ENDPOINT",
  "AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_PLAN_PREVIEW_ENDPOINT",
]) {
  assertNotIncludes(page, forbiddenPageSymbol, `page must not wire ${forbiddenPageSymbol}`);
}

console.log("========== Step151-G smoke: API helper availability ==========");

assertIncludes(api, "export async function previewAmazonSpApiOrdersReal", "api exports real-preview helper");
assertIncludes(api, "writesDatabase?: false", "real-preview response type keeps writesDatabase false");
assertIncludes(api, "importJobWriteNow?: false", "real-preview response type keeps importJobWriteNow false");
assertIncludes(api, "transactionWriteNow?: false", "real-preview response type keeps transactionWriteNow false");
assertIncludes(api, "inventoryWriteNow?: false", "real-preview response type keeps inventoryWriteNow false");
assertIncludes(api, "export async function commitAmazonSpApiOrdersRealImportJob", "api has real-importjob helper for later steps only");

console.log("========== Step151-G smoke result ==========");
console.log("[OK] Step151-G passed.");
console.log("[RESULT] Preview button calls real-preview explicitly.");
console.log("[RESULT] Real-preview uses preflight date range and scope.");
console.log("[RESULT] Real-preview result summary is displayed.");
console.log("[RESULT] No real-importjob / historical-sync / DB write path is wired.");
