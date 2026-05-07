#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  buildAmazonSpApiSandboxImportJobReadModelFrontendRuntimeIntegrationContract,
  assertAmazonSpApiSandboxImportJobReadModelFrontendRuntimeIntegrationContract,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-importjob-read-model-frontend-runtime-integration.dto");

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

function assertRuntimeIntegrationBoundary(repoRoot, shellFile, clientFile) {
  const webRoot = path.resolve(repoRoot, "apps/web/src");
  const files = listFiles(webRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));
  const endpointLeaks = [];
  const unexpectedClientImports = [];
  const realSpApiLeaks = [];
  const forbiddenActionLeaks = [];

  for (const file of files) {
    const text = read(file);
    const rel = path.relative(repoRoot, file);

    if (file !== clientFile && text.includes("/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model")) {
      endpointLeaks.push(rel);
    }

    if (
      file !== clientFile &&
      file !== shellFile &&
      text.includes("fetchAmazonSpApiSandboxImportJobReadModel")
    ) {
      unexpectedClientImports.push(rel);
    }

    // Step122-Y FIX2: sandbox read-model client is allowed to contain "amazon-sp-api-sandbox".
    // Real Amazon SP-API / OAuth code remains forbidden.
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

    if (realSpApiOrOauthFragments.some((fragment) => text.includes(fragment))) {
      realSpApiLeaks.push(rel);
    }

    if (text.includes("commitSales: true") || text.includes("executeInventory: true")) {
      forbiddenActionLeaks.push(rel);
    }
  }

  assert(endpointLeaks.length === 0, `endpoint string must stay isolated in client helper: ${JSON.stringify(endpointLeaks)}`);
  assert(unexpectedClientImports.length === 0, `only runtime panel may import client helper in Step122-Y: ${JSON.stringify(unexpectedClientImports)}`);
  assert(realSpApiLeaks.length === 0, `Step122-Y must not introduce real SP-API/OAuth frontend code: ${JSON.stringify(realSpApiLeaks)}`);
  assert(forbiddenActionLeaks.length === 0, `Step122-Y must not enable commit/inventory actions: ${JSON.stringify(forbiddenActionLeaks)}`);

  return {
    scannedFiles: files.length,
    endpointLeaks,
    unexpectedClientImports,
    realSpApiLeaks,
    forbiddenActionLeaks,
  };
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(root, "..", "..");

  const packageJson = JSON.parse(read(path.resolve(root, "package.json")));
  const contract = assertAmazonSpApiSandboxImportJobReadModelFrontendRuntimeIntegrationContract(
    buildAmazonSpApiSandboxImportJobReadModelFrontendRuntimeIntegrationContract(),
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-sandbox-importjob-read-model-frontend-runtime-integration"],
    "Step122-Y npm script missing",
  );

  const shellFile = path.resolve(repoRoot, contract.runtimePanel.componentFile);
  const clientFile = path.resolve(repoRoot, "apps/web/src/lib/api/amazonSpApiSandboxImportJobReadModelClient.ts");
  const shellSource = read(shellFile);
  const clientSource = read(clientFile);
  const schema = read(path.resolve(root, "prisma/schema.prisma"));
  const controllerSource = read(path.resolve(root, "src/imports/imports.controller.ts"));
  const serviceSource = read(path.resolve(root, "src/imports/imports.service.ts"));

  assert(shellSource.includes('"use client";'), "runtime panel must be client component");
  assert(shellSource.includes("data-step122-y"), "runtime panel marker missing");
  assert(shellSource.includes("fetchAmazonSpApiSandboxImportJobReadModel"), "runtime panel must import/use client helper");
  assert(shellSource.includes("useEffect("), "runtime panel must load via useEffect");
  assert(shellSource.includes("setLoading(true)"), "loading state missing");
  assert(shellSource.includes("対象データはありません"), "empty state copy missing");
  assert(shellSource.includes("ログインが必要です"), "401 copy missing");
  assert(shellSource.includes("このデータを表示する権限がありません"), "403 copy missing");
  assert(shellSource.includes("検索条件が正しくありません"), "400 copy missing");
  assert(shellSource.includes("安全でないレスポンス"), "unsafe response copy missing");
  assert(shellSource.includes("売上計上は無効"), "commit disabled copy missing");
  assert(shellSource.includes("在庫反映は無効"), "inventory disabled copy missing");

  assert(clientSource.includes('credentials: "include"'), "client must use credentials include");
  assert(clientSource.includes('params.set("dryRun", "true")'), "client must force dryRun true");
  assert(clientSource.includes("FORBIDDEN_RESPONSE_FIELDS"), "client must keep forbidden field guard");

  assert(controllerSource.includes("@UseGuards(JwtAuthGuard)"), "backend route must remain JWT guarded");
  assert(controllerSource.includes("dryRun: true"), "backend route must force dryRun true");
  assert(serviceSource.includes("async ['listAmazonSpApiSandboxImportJobsReadModelDryRun']("), "read-model service missing");

  for (const forbiddenModel of [
    "AmazonSpApiCredential",
    "AmazonSpApiToken",
    "AmazonSpApiSandboxImportJobReadModel",
    "CrossSourceDedupe",
  ]) {
    assert(!schema.includes(forbiddenModel), `schema must not add ${forbiddenModel}`);
  }

  const boundary = assertRuntimeIntegrationBoundary(repoRoot, shellFile, clientFile);

  console.log("[SMOKE_OK] amazon sp-api sandbox ImportJob read-model frontend runtime integration smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step122-Y",
        contract: {
          version: contract.version,
          implementedNow: contract.implementedNow,
          panelRuntimeIntegrationNow: contract.panelRuntimeIntegrationNow,
          frontendClientImplementedNow: contract.frontendClientImplementedNow,
          appsWebModifiedNow: contract.appsWebModifiedNow,
          backendChangedNow: contract.backendChangedNow,
          schemaChangedNow: contract.schemaChangedNow,
          writesDatabase: contract.writesDatabase,
          runtimePanel: contract.runtimePanel,
          uiBehavior: contract.uiBehavior,
          summary: contract.summary,
        },
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
