#!/usr/bin/env node
"use strict";

// Step122-Y FIX8 clean rewrite:
// Runtime panel may use the typed frontend client helper.
// Endpoint string must stay isolated in the client helper.
// Raw fetch, real SP-API/OAuth/token, commit, and inventory execution remain forbidden.

const fs = require("fs");
const path = require("path");
const {
  buildAmazonSpApiSandboxImportJobReadModelFrontendContract,
  assertAmazonSpApiSandboxImportJobReadModelFrontendContract,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-importjob-read-model-frontend-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function listFiles(dir, predicate, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) listFiles(p, predicate, acc);
    else if (predicate(p)) acc.push(p);
  }
  return acc;
}

function assertStep122YFrontendBoundary(repoRoot) {
  const webRoot = path.resolve(repoRoot, "apps/web/src");
  const clientFile = path.resolve(repoRoot, "apps/web/src/lib/api/amazonSpApiSandboxImportJobReadModelClient.ts");
  const runtimePanelFile = path.resolve(repoRoot, "apps/web/src/components/app/imports/AmazonSpApiSandboxReadModelPanelShell.tsx");
  const webFiles = listFiles(webRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));

  const endpointLeaks = [];
  const unexpectedClientImports = [];
  const runtimePanelRawFetchLeaks = [];
  const realSpApiLeaks = [];
  const forbiddenActionLeaks = [];

  const realSpApiOrOauthFragments = [
    "sellingpartnerapi",
    "selling-partner-api",
    "getOrders(",
    "getOrder(",
    "getOrderItems(",
    "LoginWithAmazon",
    "loginWithAmazon",
    "lwaAuthorization",
    "refresh_token",
    "client_secret",
    "client_id",
    "tokenPersistence",
    "AmazonSpApiCredential",
    "AmazonSpApiToken",
  ];

  for (const file of webFiles) {
    const text = read(file);
    const rel = path.relative(repoRoot, file);
    const isClientFile = file === clientFile;
    const isRuntimePanelFile = file === runtimePanelFile;

    if (!isClientFile && text.includes("/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model")) {
      endpointLeaks.push(`${rel}: endpoint string outside client helper`);
    }

    if (
      !isClientFile &&
      !isRuntimePanelFile &&
      text.includes("fetchAmazonSpApiSandboxImportJobReadModel")
    ) {
      unexpectedClientImports.push(`${rel}: client helper referenced outside runtime panel`);
    }

    if (
      !isClientFile &&
      !isRuntimePanelFile &&
      text.includes("amazonSpApiSandboxImportJobReadModelClient")
    ) {
      unexpectedClientImports.push(`${rel}: client helper module referenced outside runtime panel`);
    }

    if (isRuntimePanelFile && (text.includes("fetch(") || text.includes("axios") || text.includes("XMLHttpRequest"))) {
      runtimePanelRawFetchLeaks.push(`${rel}: runtime panel must use typed helper, not raw fetch`);
    }

    if (realSpApiOrOauthFragments.some((fragment) => text.includes(fragment))) {
      realSpApiLeaks.push(`${rel}: real SP-API/OAuth/token fragment detected`);
    }

    if (text.includes("commitSales: true") || text.includes("executeInventory: true")) {
      forbiddenActionLeaks.push(`${rel}: commit/inventory action enabled`);
    }
  }

  assert(endpointLeaks.length === 0, `endpoint string must stay isolated in client helper: ${JSON.stringify(endpointLeaks)}`);
  assert(unexpectedClientImports.length === 0, `only Step122-Y runtime panel may import/use client helper: ${JSON.stringify(unexpectedClientImports)}`);
  assert(runtimePanelRawFetchLeaks.length === 0, `runtime panel must not use raw fetch: ${JSON.stringify(runtimePanelRawFetchLeaks)}`);
  assert(realSpApiLeaks.length === 0, `real SP-API/OAuth/token code remains forbidden: ${JSON.stringify(realSpApiLeaks)}`);
  assert(forbiddenActionLeaks.length === 0, `commit/inventory execution remains forbidden: ${JSON.stringify(forbiddenActionLeaks)}`);

  return {
    scannedFiles: webFiles.length,
    endpointLeaks,
    unexpectedClientImports,
    runtimePanelRawFetchLeaks,
    realSpApiLeaks,
    forbiddenActionLeaks,
  };
}

function assertRuntimePanelSource(repoRoot) {
  const shellFile = path.resolve(repoRoot, "apps/web/src/components/app/imports/AmazonSpApiSandboxReadModelPanelShell.tsx");
  const clientFile = path.resolve(repoRoot, "apps/web/src/lib/api/amazonSpApiSandboxImportJobReadModelClient.ts");

  assert(fs.existsSync(shellFile), "runtime panel file missing");
  assert(fs.existsSync(clientFile), "frontend client helper file missing");

  const shellSource = read(shellFile);
  const clientSource = read(clientFile);

  assert(shellSource.includes("data-step122-w"), "panel must keep Step122-W marker");
  assert(shellSource.includes("data-step122-y"), "panel must expose Step122-Y marker");
  assert(shellSource.includes("fetchAmazonSpApiSandboxImportJobReadModel"), "panel must use typed client helper");
  assert(shellSource.includes("useEffect("), "panel must load via useEffect");
  assert(!shellSource.includes("fetch("), "panel must not call raw fetch");
  assert(shellSource.includes("dryRun=true"), "panel must show dryRun=true");
  assert(shellSource.includes("displayOnly"), "panel must show displayOnly");
  assert(shellSource.includes("売上計上は無効"), "panel must keep commit disabled copy");
  assert(shellSource.includes("在庫反映は無効"), "panel must keep inventory disabled copy");
  assert(shellSource.includes("ログインが必要です"), "panel must show 401 copy");
  assert(shellSource.includes("このデータを表示する権限がありません"), "panel must show 403 copy");
  assert(shellSource.includes("検索条件が正しくありません"), "panel must show 400 copy");
  assert(shellSource.includes("対象データはありません"), "panel must show empty copy");
  assert(shellSource.includes("安全でないレスポンス"), "panel must show unsafe-response copy");

  assert(clientSource.includes("AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_ENDPOINT"), "client endpoint const missing");
  assert(clientSource.includes('credentials: "include"'), "client must use credentials include");
  assert(clientSource.includes('params.set("dryRun", "true")'), "client must force dryRun=true");
  assert(clientSource.includes("FORBIDDEN_RESPONSE_FIELDS"), "client forbidden field guard missing");

  return {
    shellFile: path.relative(repoRoot, shellFile),
    clientFile: path.relative(repoRoot, clientFile),
    runtimePanelDetected: true,
  };
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(root, "..", "..");
  const packageJson = JSON.parse(read(path.resolve(root, "package.json")));
  const schema = read(path.resolve(root, "prisma/schema.prisma"));
  const controllerSource = read(path.resolve(root, "src/imports/imports.controller.ts"));
  const serviceSource = read(path.resolve(root, "src/imports/imports.service.ts"));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-sandbox-importjob-read-model-frontend-contract-design"],
    "Step122-U npm script missing",
  );

  const contract = assertAmazonSpApiSandboxImportJobReadModelFrontendContract(
    buildAmazonSpApiSandboxImportJobReadModelFrontendContract(),
  );

  assert(contract.designOnly === true, "Step122-U contract must remain design-only");
  assert(contract.frontendImplementedNow === false, "Step122-U historical contract must remain not implemented");
  assert(contract.endpointContract.query.dryRun === true, "Step122-U must require dryRun=true");
  assert(contract.actionPolicy.commitSalesDisabled === true, "commit must remain disabled");
  assert(contract.actionPolicy.executeInventoryDisabled === true, "inventory must remain disabled");

  assert(controllerSource.includes("@UseGuards(JwtAuthGuard)"), "backend route must remain JWT guarded");
  assert(controllerSource.includes("dryRun: true"), "backend route must force dryRun=true");
  assert(serviceSource.includes("async ['listAmazonSpApiSandboxImportJobsReadModelDryRun']("), "read-model service method missing");

  for (const forbiddenModel of [
    "AmazonSpApiCredential",
    "AmazonSpApiToken",
    "AmazonSpApiSandboxImportJobReadModel",
    "CrossSourceDedupe",
  ]) {
    assert(!schema.includes(forbiddenModel), `schema must not add ${forbiddenModel}`);
  }

  const runtimePanel = assertRuntimePanelSource(repoRoot);
  const boundary = assertStep122YFrontendBoundary(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api sandbox ImportJob read-model frontend contract design smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step122-U",
        step122YAware: true,
        contract: {
          version: contract.version,
          designOnly: contract.designOnly,
          frontendImplementedNow: contract.frontendImplementedNow,
          endpointContract: contract.endpointContract,
          actionPolicy: contract.actionPolicy,
          summary: contract.summary,
        },
        runtimePanel,
        boundary,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error("[SMOKE_ERROR]", err);
    process.exitCode = 1;
  });
