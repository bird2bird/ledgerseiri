#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertFrontendAmazonSpApiConnectionStatusPanelRuntimeRecordHandoffContract,
  buildFrontendAmazonSpApiConnectionStatusPanelRuntimeRecordHandoffContract,
} = require("../dist/src/imports/dto/frontend-amazon-sp-api-connection-status-panel-runtime-record-handoff-contract.dto");

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
    apiPackageJson.scripts["smoke:frontend-amazon-sp-api-connection-status-panel-runtime-record-handoff-contract"] ===
      "node scripts/smoke-frontend-amazon-sp-api-connection-status-panel-runtime-record-handoff-contract.js",
    "Step132-D record/handoff smoke script missing or mismatched",
  );

  const dtoFile = path.resolve(apiRoot, "src/imports/dto/frontend-amazon-sp-api-connection-status-panel-runtime-record-handoff-contract.dto.ts");
  const step132cDtoFile = path.resolve(apiRoot, "src/imports/dto/frontend-amazon-sp-api-connection-status-panel-runtime-smoke-contract.dto.ts");
  const panelFile = path.resolve(webRoot, "src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx");
  const apiFile = path.resolve(webRoot, "src/core/imports/api.ts");
  const pageFile = path.resolve(webRoot, "src/app/[lang]/app/data/import/page.tsx");
  const controllerFile = path.resolve(apiRoot, "src/imports/imports.controller.ts");

  const dtoText = read(dtoFile);
  const step132cDtoText = read(step132cDtoFile);
  const panelText = read(panelFile);
  const apiText = read(apiFile);
  const pageText = read(pageFile);
  const controllerText = read(controllerFile);

  for (const marker of [
    "FRONTEND_AMAZON_SP_API_CONNECTION_STATUS_PANEL_RUNTIME_RECORD_HANDOFF_CONTRACT_VERSION",
    "frontendConnectionPanelPhaseCompletedNow",
    "readyForStep133AConnectionStatusBackendEndpointContract",
    "connection status endpoint is not exposed to frontend yet",
    "Step133-A: Amazon SP-API connection status backend endpoint contract",
  ]) {
    assert(dtoText.includes(marker), `Step132-D DTO missing marker: ${marker}`);
  }

  assert(
    step132cDtoText.includes("readyForStep132DFrontendConnectionStatusPanelRecordHandoff"),
    "Step132-C DTO must allow Step132-D",
  );

  for (const marker of [
    'data-testid="amazon-sp-api-connection-status-panel"',
    'data-testid="amazon-sp-api-connect-button"',
    'data-testid="amazon-sp-api-refresh-status-button"',
    'data-testid="amazon-sp-api-reconnect-button"',
    'data-testid="amazon-sp-api-revoke-button"',
    "Amazonと接続",
    "接続状態を更新",
    "再接続",
    "接続を解除",
    "window.location.assign",
    "requestAmazonSpApiAuthorizationUrl",
    "token_persistence_completed",
  ]) {
    assert(panelText.includes(marker), `panel missing marker: ${marker}`);
  }

  for (const marker of [
    "export async function requestAmazonSpApiAuthorizationUrl",
    "/api/imports/amazon-sp-api/oauth/authorization-url",
    'credentials: "include"',
    'cache: "no-store"',
    'params.set("storeId"',
    'params.set("marketplaceId"',
    'params.set("region"',
    'params.set("sandbox"',
    'params.set("forceReauthorize"',
    'params.set("locale"',
  ]) {
    assert(apiText.includes(marker), `imports API missing marker: ${marker}`);
  }

  assert(pageText.includes("AmazonSpApiConnectionStatusPanel"), "data import page must keep panel wiring");
  assert(pageText.includes("<AmazonSpApiConnectionStatusPanel"), "data import page must render panel");
  assert(controllerText.includes("amazon-sp-api/oauth/authorization-url"), "authorization-url route must remain available");
  assert(controllerText.includes("amazon-sp-api/oauth/callback"), "callback route must remain available");
  assert(controllerText.includes("token_persistence_completed"), "callback token persistence must remain completed");

  const forbiddenUiPatterns = [
    /refresh_token/i,
    /access_token/i,
    /client_secret/i,
    /clientSecret\s*[:=]/,
    /refreshToken\s*[:=]/,
    /accessToken\s*[:=]/,
    /localStorage\s*\./,
    /sessionStorage\s*\./,
  ];
  for (const pattern of forbiddenUiPatterns) {
    assert(!pattern.test(panelText), `panel exposed forbidden secret/storage pattern: ${pattern}`);
  }

  const forbiddenExecution = [
    /reports\/2021-06-30/i,
    /createReport/i,
    /getReportDocument/i,
    /ImportJob\.create/,
    /transaction\.create/,
    /inventoryMovement\.create/,
  ];
  for (const pattern of forbiddenExecution) {
    assert(!pattern.test(panelText + "\n" + apiText), `frontend must not trigger reports/import/ledger/inventory execution: ${pattern}`);
  }

  const contract = assertFrontendAmazonSpApiConnectionStatusPanelRuntimeRecordHandoffContract(
    buildFrontendAmazonSpApiConnectionStatusPanelRuntimeRecordHandoffContract(),
  );

  assert(contract.sourceStep132C.summary.readyForStep132DFrontendConnectionStatusPanelRecordHandoff === true, "Step132-C must allow Step132-D");
  assert(contract.summary.step132DCompleted === true, "Step132-D completion mismatch");
  assert(contract.summary.frontendConnectionStatusPanelPhaseCompleted === true, "frontend connection panel phase should be complete");
  assert(contract.summary.readyForStep133AConnectionStatusBackendEndpointContract === true, "Step133-A readiness mismatch");
  assert(contract.summary.readyForStep133BConnectionStatusBackendEndpointImplementation === false, "Step133-B must remain blocked");
  assert(contract.summary.readyForStep135RealSpApiReports === false, "Step135 must remain blocked");
  assert(contract.summary.readyForCommittedSalesImport === false, "committed sales import must remain blocked");
  assert(contract.summary.readyForInventoryExecution === false, "inventory execution must remain blocked");

  console.log("[SMOKE_OK] frontend amazon sp-api connection status panel runtime record/handoff contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step132-D",
    files: {
      dto: path.relative(repoRoot, dtoFile).replaceAll(path.sep, "/"),
      smoke: path.relative(repoRoot, __filename).replaceAll(path.sep, "/"),
      panel: path.relative(repoRoot, panelFile).replaceAll(path.sep, "/"),
      api: path.relative(repoRoot, apiFile).replaceAll(path.sep, "/"),
      page: path.relative(repoRoot, pageFile).replaceAll(path.sep, "/"),
    },
    plannedNext: "Step133-A: Amazon SP-API connection status backend endpoint contract",
    handoffNotes: contract.handoffNotes,
    summary: contract.summary,
  }, null, 2));
}

try {
  main();
} catch (err) {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
}
