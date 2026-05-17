#!/usr/bin/env node

/**
 * Step151-E FIX3:
 * Amazon Data Import real-preview gate no-execution smoke.
 *
 * This smoke is based on the current GitHub main page structure:
 *
 * - parent handler:
 *   async function handleAmazonOrdersConnectedServiceFetchShell()
 *
 * - JSX wiring:
 *   onFetchShell={() => void handleAmazonOrdersConnectedServiceFetchShell()}
 *
 * - child button wiring:
 *   onClick={onFetchShell}
 *
 * It intentionally does not support inline fallback extraction.
 *
 * Goal:
 * - Lock the current Data Import 「取得」 button path as preflight-only.
 * - Confirm no real-preview / real-importjob / historical-sync execution is wired.
 * - Confirm no DB write path is wired from the fetch button.
 *
 * No network, no backend runtime, no Amazon call, no DB call.
 */

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "../../..");

const pagePath = path.join(
  repoRoot,
  "apps/web/src/app/[lang]/app/data/import/page.tsx"
);

const apiPath = path.join(repoRoot, "apps/web/src/core/imports/api.ts");

const EXPECTED_HANDLER = "handleAmazonOrdersConnectedServiceFetchShell";

function read(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing file: ${file}`);
  }
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

  if (braceStart < 0) {
    throw new Error(`[FAIL] Body opening brace not found: ${label}`);
  }

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
      if (ch === quote) {
        quote = null;
      }
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

    if (depth === 0) {
      return source.slice(start, i + 1);
    }
  }

  throw new Error(`[FAIL] Body did not close: ${label}`);
}

function extractAsyncFunctionDeclaration(source, functionName) {
  const regex = new RegExp(
    `(?:async\\s+)?function\\s+${functionName}\\s*\\(`,
    "m"
  );

  const match = regex.exec(source);

  if (!match || typeof match.index !== "number") {
    throw new Error(`[FAIL] Expected function declaration not found: ${functionName}`);
  }

  return extractBalancedBlockFrom(source, match.index, functionName);
}

function extractCoreImportsBlock(source) {
  const regex = /import\s*\{([\s\S]*?)\}\s*from\s+"@\/core\/imports\/api";/m;
  const match = regex.exec(source);

  if (!match) {
    throw new Error('[FAIL] Could not find import block from "@/core/imports/api".');
  }

  return match[0];
}

const page = read(pagePath);
const api = read(apiPath);

console.log("========== Step151-E FIX3 smoke: current source anchors ==========");

assertIncludes(
  page,
  "Step151-B-FETCH-BUTTON-EXECUTION-CONTRACT",
  "fetch button execution contract anchor"
);

assertIncludes(
  page,
  "data-import-connected-service-amazon-orders-fetch-button",
  "Amazon orders fetch button test id"
);

assertIncludes(
  page,
  "data-import-connected-service-amazon-orders-execution-contract",
  "execution contract panel test id"
);

assertIncludes(
  page,
  "data-import-connected-service-amazon-orders-preflight-result",
  "preflight result panel test id"
);

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

console.log("========== Step151-E FIX3 smoke: imports boundary ==========");

const coreImportBlock = extractCoreImportsBlock(page);

assertIncludes(
  coreImportBlock,
  "preflightAmazonSpApiOrdersGuardedImport",
  "page imports guarded preflight helper"
);

for (const forbiddenImport of [
  "previewAmazonSpApiOrdersReal",
  "commitAmazonSpApiOrdersRealImportJob",
  "previewAmazonSpApiOrdersHistoricalSyncPlan",
  "AMAZON_SP_API_ORDERS_REAL_PREVIEW_ENDPOINT",
  "AMAZON_SP_API_ORDERS_REAL_IMPORTJOB_ENDPOINT",
  "AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_PLAN_PREVIEW_ENDPOINT",
]) {
  assertNotIncludes(
    coreImportBlock,
    forbiddenImport,
    `page core imports must not include ${forbiddenImport}`
  );
}

console.log("========== Step151-E FIX3 smoke: precise handler boundary ==========");

const handlerBody = extractAsyncFunctionDeclaration(page, EXPECTED_HANDLER);

console.log(`[OK] Extracted handler: ${EXPECTED_HANDLER}`);

assertIncludes(
  handlerBody,
  "preflightAmazonSpApiOrdersGuardedImport",
  "handler calls guarded preflight helper"
);

assertIncludes(
  handlerBody,
  'setAmazonOrdersFetchExecutionContractStatus("preflight_checking")',
  "handler sets preflight_checking before request"
);

assertIncludes(
  handlerBody,
  'response.allowed ? "preflight_ready" : "blocked"',
  "handler transitions only to preflight_ready or blocked after preflight"
);

assertIncludes(
  handlerBody,
  'explicitOperatorIntent: true',
  "handler sends explicitOperatorIntent=true"
);

assertIncludes(
  handlerBody,
  'rangePreset: "7D"',
  "handler currently locks default 7D range"
);

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
  assertNotIncludes(
    handlerBody,
    forbiddenInHandler,
    `handler must not contain ${forbiddenInHandler}`
  );
}

console.log("========== Step151-E FIX3 smoke: JSX wiring boundary ==========");

assertRegex(
  page,
  /onClick=\{\s*onFetchShell\s*\}/m,
  "child button uses onClick={onFetchShell}"
);

assertRegex(
  page,
  /onFetchShell=\{\s*\(\)\s*=>\s*void\s+handleAmazonOrdersConnectedServiceFetchShell\s*\(\s*\)\s*\}/m,
  "parent wires onFetchShell to handleAmazonOrdersConnectedServiceFetchShell"
);

console.log("========== Step151-E FIX3 smoke: page-level forbidden execution symbols ==========");

// This page-level check is intentionally limited to exact execution symbols/constants.
// It avoids broad text like "preview" because page copy may describe future steps.
for (const forbiddenPageSymbol of [
  "previewAmazonSpApiOrdersReal(",
  "commitAmazonSpApiOrdersRealImportJob(",
  "previewAmazonSpApiOrdersHistoricalSyncPlan(",
  "AMAZON_SP_API_ORDERS_REAL_PREVIEW_ENDPOINT",
  "AMAZON_SP_API_ORDERS_REAL_IMPORTJOB_ENDPOINT",
  "AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_PLAN_PREVIEW_ENDPOINT",
]) {
  assertNotIncludes(
    page,
    forbiddenPageSymbol,
    `page must not wire ${forbiddenPageSymbol}`
  );
}

console.log("========== Step151-E FIX3 smoke: API helper boundary ==========");

assertIncludes(
  api,
  "export async function preflightAmazonSpApiOrdersGuardedImport",
  "API exports guarded preflight helper"
);

assertIncludes(
  api,
  "export async function previewAmazonSpApiOrdersReal",
  "API real-preview helper exists for later step"
);

assertIncludes(
  api,
  "export async function commitAmazonSpApiOrdersRealImportJob",
  "API real-importjob helper exists for later step"
);

assertIncludes(
  api,
  "callsRealPreview: false",
  "preflight response boundary callsRealPreview=false"
);

assertIncludes(
  api,
  "callsRealImportJob: false",
  "preflight response boundary callsRealImportJob=false"
);

assertIncludes(
  api,
  "callsHistoricalSync: false",
  "preflight response boundary callsHistoricalSync=false"
);

assertIncludes(
  api,
  "createsImportJob: false",
  "preflight response boundary createsImportJob=false"
);

assertIncludes(
  api,
  "createsImportStagingRow: false",
  "preflight response boundary createsImportStagingRow=false"
);

assertIncludes(
  api,
  "createsSyncJob: false",
  "preflight response boundary createsSyncJob=false"
);

assertIncludes(
  api,
  "createsSyncSegment: false",
  "preflight response boundary createsSyncSegment=false"
);

assertIncludes(
  api,
  "writesDatabase: false",
  "preflight response boundary writesDatabase=false"
);

assertIncludes(
  api,
  "writesTransaction: false",
  "preflight response boundary writesTransaction=false"
);

assertIncludes(
  api,
  "writesInventoryMovement: false",
  "preflight response boundary writesInventoryMovement=false"
);

assertIncludes(
  api,
  "returnsRawAccessToken: false",
  "preflight response boundary returnsRawAccessToken=false"
);

assertIncludes(
  api,
  "returnsRawRefreshToken: false",
  "preflight response boundary returnsRawRefreshToken=false"
);

assertIncludes(
  api,
  "returnsRawSecret: false",
  "preflight response boundary returnsRawSecret=false"
);

console.log("========== Step151-E FIX3 smoke result ==========");
console.log("[OK] Step151-E passed.");
console.log("[RESULT] Data Import fetch button remains preflight-only.");
console.log("[RESULT] No frontend real-preview / real-importjob / historical-sync execution wiring detected.");
console.log("[RESULT] No DB write path is wired from the fetch button.");
