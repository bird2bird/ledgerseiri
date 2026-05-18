#!/usr/bin/env node

/**
 * Step151-E evolved after Step151-G:
 * Fetch-button preflight guard.
 *
 * This smoke remains valid after the page imports previewAmazonSpApiOrdersReal.
 *
 * It verifies:
 * - 「取得」 button path still goes only to guarded preflight.
 * - real-preview may exist elsewhere on the page after Step151-G.
 * - real-importjob / historical-sync / DB write paths are still not wired.
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

console.log("========== Step151-E evolved smoke: fetch button anchors ==========");

assertIncludes(page, "Step151-B-FETCH-BUTTON-EXECUTION-CONTRACT", "fetch button execution contract anchor");
assertIncludes(page, "data-import-connected-service-amazon-orders-fetch-button", "Amazon orders fetch button test id");
assertIncludes(page, "data-import-connected-service-amazon-orders-execution-contract", "execution contract panel test id");
assertIncludes(page, "data-import-connected-service-amazon-orders-preflight-result", "preflight result panel test id");

for (const state of [
  "preflight_required",
  "preflight_checking",
  "preflight_ready",
  "preview_required",
  "confirmation_required",
  "blocked",
]) {
  assertIncludes(page, state, `execution state exists: ${state}`);
}

console.log("========== Step151-E evolved smoke: import boundary ==========");

const coreImportBlock = extractCoreImportsBlock(page);
assertIncludes(coreImportBlock, "preflightAmazonSpApiOrdersGuardedImport", "page imports guarded preflight helper");

// After Step151-G, previewAmazonSpApiOrdersReal is allowed.
// Persistence and background sync remain forbidden.
for (const forbiddenImport of [
  "commitAmazonSpApiOrdersRealImportJob",
  "previewAmazonSpApiOrdersHistoricalSyncPlan",
  "AMAZON_SP_API_ORDERS_REAL_IMPORTJOB_ENDPOINT",
  "AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_PLAN_PREVIEW_ENDPOINT",
]) {
  assertNotIncludes(coreImportBlock, forbiddenImport, `page core imports must not include ${forbiddenImport}`);
}

console.log("========== Step151-E evolved smoke: fetch handler remains preflight-only ==========");

const fetchHandler = extractFunction(page, "handleAmazonOrdersConnectedServiceFetchShell");

assertIncludes(fetchHandler, "preflightAmazonSpApiOrdersGuardedImport", "fetch handler calls guarded preflight helper");
assertIncludes(fetchHandler, 'setAmazonOrdersFetchExecutionContractStatus("preflight_checking")', "fetch handler sets preflight_checking");
assertIncludes(fetchHandler, 'response.allowed ? "preflight_ready" : "blocked"', "fetch handler transitions to preflight_ready or blocked");

for (const forbiddenInFetchHandler of [
  "previewAmazonSpApiOrdersReal",
  "commitAmazonSpApiOrdersRealImportJob",
  "previewAmazonSpApiOrdersHistoricalSyncPlan",
  "AMAZON_SP_API_ORDERS_REAL_IMPORTJOB_ENDPOINT",
  "AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_PLAN_PREVIEW_ENDPOINT",
  "fetch(",
  "postJson(",
  "writesDatabase: true",
  "createsImportJob: true",
  "writesTransaction: true",
  "writesInventoryMovement: true",
]) {
  assertNotIncludes(fetchHandler, forbiddenInFetchHandler, `fetch handler must not contain ${forbiddenInFetchHandler}`);
}

console.log("========== Step151-E evolved smoke: JSX fetch wiring ==========");

assertRegex(page, /onClick=\{\s*onFetchShell\s*\}/m, "child fetch button uses onClick={onFetchShell}");
assertRegex(
  page,
  /onFetchShell=\{\s*\(\)\s*=>\s*void\s+handleAmazonOrdersConnectedServiceFetchShell\s*\(\s*\)\s*\}/m,
  "parent wires onFetchShell to handleAmazonOrdersConnectedServiceFetchShell"
);

console.log("========== Step151-E evolved smoke: persistence remains forbidden page-wide ==========");

for (const forbiddenPageSymbol of [
  "commitAmazonSpApiOrdersRealImportJob(",
  "previewAmazonSpApiOrdersHistoricalSyncPlan(",
  "AMAZON_SP_API_ORDERS_REAL_IMPORTJOB_ENDPOINT",
  "AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_PLAN_PREVIEW_ENDPOINT",
]) {
  assertNotIncludes(page, forbiddenPageSymbol, `page must not wire ${forbiddenPageSymbol}`);
}

console.log("========== Step151-E evolved smoke: API preflight boundary ==========");

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

console.log("========== Step151-E evolved smoke result ==========");
console.log("[OK] Step151-E passed.");
console.log("[RESULT] Fetch button remains guarded-preflight-only.");
console.log("[RESULT] Real-preview may exist behind the explicit preview button.");
console.log("[RESULT] No real-importjob / historical-sync / DB write path is wired.");
