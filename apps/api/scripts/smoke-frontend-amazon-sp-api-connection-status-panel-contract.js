#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertFrontendAmazonSpApiConnectionStatusPanelContract,
  buildFrontendAmazonSpApiConnectionStatusPanelContract,
} = require("../dist/src/imports/dto/frontend-amazon-sp-api-connection-status-panel-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");
  const webRoot = path.resolve(repoRoot, "apps/web");

  const apiPackageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  const webPackageJson = JSON.parse(read(path.resolve(webRoot, "package.json")));

  assert(
    apiPackageJson.scripts["smoke:frontend-amazon-sp-api-connection-status-panel-contract"] ===
      "node scripts/smoke-frontend-amazon-sp-api-connection-status-panel-contract.js",
    "Step132-A smoke script missing or mismatched",
  );

  const dtoFile = path.resolve(apiRoot, "src/imports/dto/frontend-amazon-sp-api-connection-status-panel-contract.dto.ts");
  const step131dDtoFile = path.resolve(
    apiRoot,
    "src/imports/dto/amazon-sp-api-oauth-callback-token-persistence-runtime-record-handoff-contract.dto.ts",
  );
  const controllerFile = path.resolve(apiRoot, "src/imports/imports.controller.ts");
  const tokenPersistenceServiceFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-token-persistence.service.ts");

  const dtoText = read(dtoFile);
  const step131dDtoText = read(step131dDtoFile);
  const controllerText = read(controllerFile);
  const tokenPersistenceServiceText = read(tokenPersistenceServiceFile);

  for (const marker of [
    "FRONTEND_AMAZON_SP_API_CONNECTION_STATUS_PANEL_CONTRACT_VERSION",
    "AmazonSpApiConnectionStatusPanel",
    "/[lang]/app/data/import",
    "/api/imports/amazon-sp-api/oauth/authorization-url",
    "/api/imports/amazon-sp-api/oauth/callback",
    "readConnectionStatus",
    "revokeConnection",
    "Amazonと接続",
    "接続状態を更新",
    "再接続",
    "接続を解除",
    "readyForStep132BFrontendConnectionStatusPanelImplementation",
  ]) {
    assert(dtoText.includes(marker), `Step132-A DTO missing marker: ${marker}`);
  }

  assert(
    step131dDtoText.includes("readyForStep132AFrontendConnectionStatusPanelContract"),
    "Step131-D DTO must allow Step132-A",
  );

  assert(controllerText.includes("amazon-sp-api/oauth/authorization-url"), "authorization-url route must exist before frontend panel");
  assert(controllerText.includes("amazon-sp-api/oauth/callback"), "callback route must exist before frontend panel");
  assert(controllerText.includes("token_persistence_completed"), "callback token persistence must be completed before frontend panel");

  assert(tokenPersistenceServiceText.includes("readConnectionStatus"), "connection status read service must exist before frontend panel");
  assert(tokenPersistenceServiceText.includes("revokeConnection"), "revoke connection service must exist before frontend panel");

  const srcRoot = path.resolve(webRoot, "src");
  assert(fs.existsSync(srcRoot), "apps/web/src must exist");
  assert(webPackageJson.scripts && webPackageJson.scripts.build, "web package must have build script");

  const webSourceFiles = [];
  function collectFiles(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!["node_modules", ".next", "dist"].includes(entry.name)) collectFiles(p);
      } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
        webSourceFiles.push(p);
      }
    }
  }
  collectFiles(srcRoot);

  const importCenterCandidates = webSourceFiles.filter((file) => {
    const rel = path.relative(webRoot, file).replaceAll(path.sep, "/");
    const text = read(file);
    return (
      /import/i.test(rel) ||
      /data\/import/i.test(rel) ||
      /Import Center|取込|インポート|ImportJob|ImportHistory/.test(text)
    );
  });

  assert(importCenterCandidates.length > 0, "must discover existing frontend import/data surface before Step132-B");

  const contract = assertFrontendAmazonSpApiConnectionStatusPanelContract(
    buildFrontendAmazonSpApiConnectionStatusPanelContract(),
  );

  assert(contract.sourceStep131D.summary.readyForStep132AFrontendConnectionStatusPanelContract === true, "Step131-D must allow Step132-A");
  assert(contract.contractOnly === true, "Step132-A must remain contract-only");
  assert(contract.frontendImplementationNow === false, "Step132-A must not implement frontend");
  assert(contract.backendImplementationNow === false, "Step132-A must not implement backend");
  assert(contract.summary.readyForStep132BFrontendConnectionStatusPanelImplementation === true, "Step132-B readiness mismatch");
  assert(contract.summary.readyForStep135RealSpApiReports === false, "Step135 must remain blocked");

  console.log("[SMOKE_OK] frontend amazon sp-api connection status panel contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step132-A",
    files: {
      dto: path.relative(repoRoot, dtoFile).replaceAll(path.sep, "/"),
      smoke: path.relative(repoRoot, __filename).replaceAll(path.sep, "/"),
      controller: path.relative(repoRoot, controllerFile).replaceAll(path.sep, "/"),
      tokenPersistenceService: path.relative(repoRoot, tokenPersistenceServiceFile).replaceAll(path.sep, "/"),
    },
    discoveredFrontendCandidates: importCenterCandidates
      .slice(0, 20)
      .map((file) => path.relative(repoRoot, file).replaceAll(path.sep, "/")),
    plannedNext: "Step132-B: Frontend Amazon SP-API connection status panel implementation",
    summary: contract.summary,
  }, null, 2));
}

try {
  main();
} catch (err) {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
}
