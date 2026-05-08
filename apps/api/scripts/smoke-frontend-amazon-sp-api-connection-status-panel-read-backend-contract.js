#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertFrontendAmazonSpApiConnectionStatusPanelReadBackendContract,
  buildFrontendAmazonSpApiConnectionStatusPanelReadBackendContract,
} = require("../dist/src/imports/dto/frontend-amazon-sp-api-connection-status-panel-read-backend-contract.dto");

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
  assert(
    apiPackageJson.scripts["smoke:frontend-amazon-sp-api-connection-status-panel-read-backend-contract"] ===
      "node scripts/smoke-frontend-amazon-sp-api-connection-status-panel-read-backend-contract.js",
    "Step134-A smoke script missing or mismatched",
  );

  const dtoFile = path.resolve(apiRoot, "src/imports/dto/frontend-amazon-sp-api-connection-status-panel-read-backend-contract.dto.ts");
  const step133dDtoFile = path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-connection-status-backend-endpoint-runtime-record-handoff-contract.dto.ts");
  const controllerFile = path.resolve(apiRoot, "src/imports/imports.controller.ts");
  const panelFile = path.resolve(webRoot, "src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx");
  const apiFile = path.resolve(webRoot, "src/core/imports/api.ts");
  const pageFile = path.resolve(webRoot, "src/app/[lang]/app/data/import/page.tsx");

  const dtoText = read(dtoFile);
  const step133dDtoText = read(step133dDtoFile);
  const controllerText = read(controllerFile);
  const panelText = read(panelFile);
  const apiText = read(apiFile);
  const pageText = read(pageFile);

  for (const marker of [
    "FRONTEND_AMAZON_SP_API_CONNECTION_STATUS_PANEL_READ_BACKEND_CONTRACT_VERSION",
    "readAmazonSpApiConnectionStatus",
    "/api/imports/amazon-sp-api/connection/status",
    "readyForStep134BFrontendPanelReadsBackendStatusImplementation",
    "AmazonSpApiConnectionStatusPanel",
    "initialLoadReadsBackendStatus",
    "refreshButtonReadsBackendStatus",
  ]) {
    assert(dtoText.includes(marker), `Step134-A DTO missing marker: ${marker}`);
  }

  assert(
    step133dDtoText.includes("readyForStep134AFrontendPanelReadsBackendStatusContract"),
    "Step133-D DTO must allow Step134-A",
  );

  assert(controllerText.includes("@Get('amazon-sp-api/connection/status')"), "backend connection status route must exist");
  assert(controllerText.includes("amazonSpApiConnectionStatusBackendEndpoint"), "backend connection status controller method must exist");
  assert(controllerText.includes("amazonSpApiTokenPersistenceService.readConnectionStatus"), "backend route must read token persistence status");

  assert(panelText.includes("AmazonSpApiConnectionStatusPanel"), "frontend panel must remain available");
  assert(panelText.includes("requestAmazonSpApiAuthorizationUrl"), "panel must keep authorization URL flow");
  assert(panelText.includes("接続状態を更新"), "panel must have refresh status button");
  assert(pageText.includes("<AmazonSpApiConnectionStatusPanel"), "data import page must render panel");

  assert(apiText.includes("requestAmazonSpApiAuthorizationUrl"), "authorization helper must remain available");
  assert(!apiText.includes("readAmazonSpApiConnectionStatus"), "Step134-A must not implement frontend backend-status helper yet");
  assert(!panelText.includes("readAmazonSpApiConnectionStatus"), "Step134-A must not wire panel to backend-status helper yet");

  const frontendText = panelText + "\n" + apiText;
  for (const pattern of [
    /refresh_token/i,
    /access_token/i,
    /client_secret/i,
    /clientSecret\s*[:=]/,
    /refreshToken\s*[:=]/,
    /accessToken\s*[:=]/,
    /localStorage\s*\./,
    /sessionStorage\s*\./,
    /reports\/2021-06-30/i,
    /createReport/i,
    /getReportDocument/i,
    /ImportJob\.create/,
    /transaction\.create/,
    /inventoryMovement\.create/,
  ]) {
    assert(!pattern.test(frontendText), `Step134-A frontend boundary leak detected: ${pattern}`);
  }

  const contract = assertFrontendAmazonSpApiConnectionStatusPanelReadBackendContract(
    buildFrontendAmazonSpApiConnectionStatusPanelReadBackendContract(),
  );

  assert(contract.sourceStep133D.summary.readyForStep134AFrontendPanelReadsBackendStatusContract === true, "Step133-D must allow Step134-A");
  assert(contract.contractOnly === true, "Step134-A must remain contract-only");
  assert(contract.frontendImplementationNow === false, "Step134-A must not implement frontend");
  assert(contract.backendImplementationNow === false, "Step134-A must not implement backend");
  assert(contract.summary.readyForStep134BFrontendPanelReadsBackendStatusImplementation === true, "Step134-B readiness mismatch");
  assert(contract.summary.readyForStep134CFrontendPanelReadsBackendStatusRuntimeSmoke === false, "Step134-C must remain blocked");
  assert(contract.summary.readyForStep135RealSpApiReports === false, "Step135 must remain blocked");

  console.log("[SMOKE_OK] frontend amazon sp-api connection status panel read-backend contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step134-A",
    files: {
      dto: path.relative(repoRoot, dtoFile).replaceAll(path.sep, "/"),
      smoke: path.relative(repoRoot, __filename).replaceAll(path.sep, "/"),
      controller: path.relative(repoRoot, controllerFile).replaceAll(path.sep, "/"),
      panel: path.relative(repoRoot, panelFile).replaceAll(path.sep, "/"),
      webImportApi: path.relative(repoRoot, apiFile).replaceAll(path.sep, "/"),
      page: path.relative(repoRoot, pageFile).replaceAll(path.sep, "/"),
    },
    plannedFrontendApiHelper: contract.plannedFrontendApiHelper,
    plannedPanelIntegration: contract.plannedPanelIntegration,
    plannedNext: "Step134-B: Frontend panel reads Amazon SP-API connection status backend endpoint implementation",
    summary: contract.summary,
  }, null, 2));
}

try {
  main();
} catch (err) {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
}
