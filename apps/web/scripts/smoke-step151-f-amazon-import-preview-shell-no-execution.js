#!/usr/bin/env node

/**
 * Step151-F:
 * Frontend preview shell after preflight_ready.
 *
 * This smoke is source-level and no-network.
 * It verifies the UI shell exists but no real-preview/importjob/historical-sync execution is wired.
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
  if (!source.includes(needle)) {
    throw new Error(`[FAIL] Missing ${label}: ${needle}`);
  }
  console.log(`[OK] ${label}`);
}

function assertNotIncludes(source, needle, label) {
  if (source.includes(needle)) {
    throw new Error(`[FAIL] Forbidden ${label}: ${needle}`);
  }
  console.log(`[OK] ${label}`);
}

function assertRegex(source, regex, label) {
  if (!regex.test(source)) {
    throw new Error(`[FAIL] Missing ${label}: ${regex}`);
  }
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

console.log("========== Step151-F smoke: preview shell anchors ==========");

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
assertIncludes(page, "data-import-connected-service-amazon-orders-preview-shell-no-execution-boundaries", "preview shell no-execution boundary test id");

console.log("========== Step151-F smoke: visibility and disabled button ==========");

assertIncludes(
  page,
  'preflightResult?.allowed && executionContractStatus === "preflight_ready"',
  "preview shell visible only after preflight_ready"
);

assertRegex(
  page,
  /data-testid="data-import-connected-service-amazon-orders-preview-confirm-button"[\s\S]*?disabled[\s\S]*?>[\s\S]*?プレビュー確認（次ステップ）/m,
  "preview confirm button is disabled and marked as next step"
);

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

console.log("========== Step151-F smoke: imports and handler remain preflight-only ==========");

const coreImportBlock = extractCoreImportsBlock(page);
assertIncludes(coreImportBlock, "preflightAmazonSpApiOrdersGuardedImport", "page still imports preflight helper");

for (const forbiddenImport of [
  "previewAmazonSpApiOrdersReal",
  "commitAmazonSpApiOrdersRealImportJob",
  "previewAmazonSpApiOrdersHistoricalSyncPlan",
  "AMAZON_SP_API_ORDERS_REAL_PREVIEW_ENDPOINT",
  "AMAZON_SP_API_ORDERS_REAL_IMPORTJOB_ENDPOINT",
  "AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_PLAN_PREVIEW_ENDPOINT",
]) {
  assertNotIncludes(coreImportBlock, forbiddenImport, `page core imports must not include ${forbiddenImport}`);
}

const handlerBody = extractFunction(page, "handleAmazonOrdersConnectedServiceFetchShell");

assertIncludes(handlerBody, "preflightAmazonSpApiOrdersGuardedImport", "handler still calls guarded preflight");
assertIncludes(handlerBody, 'response.allowed ? "preflight_ready" : "blocked"', "handler still only transitions to preflight_ready or blocked");

for (const forbiddenInHandler of [
  "previewAmazonSpApiOrdersReal",
  "commitAmazonSpApiOrdersRealImportJob",
  "previewAmazonSpApiOrdersHistoricalSyncPlan",
  "AMAZON_SP_API_ORDERS_REAL_PREVIEW_ENDPOINT",
  "AMAZON_SP_API_ORDERS_REAL_IMPORTJOB_ENDPOINT",
  "AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_PLAN_PREVIEW_ENDPOINT",
  "fetch(",
  "postJson(",
  "writesDatabase: true",
  "createsImportJob: true",
  "writesTransaction: true",
  "writesInventoryMovement: true",
]) {
  assertNotIncludes(handlerBody, forbiddenInHandler, `handler must not contain ${forbiddenInHandler}`);
}

console.log("========== Step151-F smoke: page-level forbidden execution symbols ==========");

for (const forbiddenPageSymbol of [
  "previewAmazonSpApiOrdersReal(",
  "commitAmazonSpApiOrdersRealImportJob(",
  "previewAmazonSpApiOrdersHistoricalSyncPlan(",
  "AMAZON_SP_API_ORDERS_REAL_PREVIEW_ENDPOINT",
  "AMAZON_SP_API_ORDERS_REAL_IMPORTJOB_ENDPOINT",
  "AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_PLAN_PREVIEW_ENDPOINT",
]) {
  assertNotIncludes(page, forbiddenPageSymbol, `page must not wire ${forbiddenPageSymbol}`);
}

console.log("========== Step151-F smoke: API boundary still supports no-execution preview shell ==========");

for (const boundary of [
  "callsRealPreview: false",
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

console.log("========== Step151-F smoke result ==========");
console.log("[OK] Step151-F passed.");
console.log("[RESULT] Preview shell appears only after preflight_ready.");
console.log("[RESULT] Preview confirm button is visible but disabled.");
console.log("[RESULT] No real-preview / importjob / historical-sync execution is wired.");
console.log("[RESULT] No DB write path is wired.");
