#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiConnectionStatusBackendEndpointRuntimeRecordHandoffContract,
  buildAmazonSpApiConnectionStatusBackendEndpointRuntimeRecordHandoffContract,
} = require("../dist/src/imports/dto/amazon-sp-api-connection-status-backend-endpoint-runtime-record-handoff-contract.dto");

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
    apiPackageJson.scripts["smoke:amazon-sp-api-connection-status-backend-endpoint-runtime-record-handoff-contract"] ===
      "node scripts/smoke-amazon-sp-api-connection-status-backend-endpoint-runtime-record-handoff-contract.js",
    "Step133-D record/handoff smoke script missing or mismatched",
  );

  const dtoFile = path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-connection-status-backend-endpoint-runtime-record-handoff-contract.dto.ts");
  const step133cDtoFile = path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-connection-status-backend-endpoint-runtime-smoke-contract.dto.ts");
  const controllerFile = path.resolve(apiRoot, "src/imports/imports.controller.ts");
  const tokenPersistenceServiceFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-token-persistence.service.ts");
  const tokenPersistenceRepoFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-token-persistence.repository.ts");
  const panelFile = path.resolve(webRoot, "src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx");
  const webImportApiFile = path.resolve(webRoot, "src/core/imports/api.ts");

  const dtoText = read(dtoFile);
  const step133cDtoText = read(step133cDtoFile);
  const controllerText = read(controllerFile);
  const tokenPersistenceServiceText = read(tokenPersistenceServiceFile);
  const tokenPersistenceRepoText = read(tokenPersistenceRepoFile);
  const panelText = read(panelFile);
  const webImportApiText = read(webImportApiFile);

  for (const marker of [
    "AMAZON_SP_API_CONNECTION_STATUS_BACKEND_ENDPOINT_RUNTIME_RECORD_HANDOFF_CONTRACT_VERSION",
    "connectionStatusBackendEndpointPhaseCompletedNow",
    "readyForStep134AFrontendPanelReadsBackendStatusContract",
    "frontend panel still does not read backend connection status endpoint",
    "Step134-A: Frontend panel reads Amazon SP-API connection status backend endpoint contract",
  ]) {
    assert(dtoText.includes(marker), `Step133-D DTO missing marker: ${marker}`);
  }

  assert(
    step133cDtoText.includes("readyForStep133DConnectionStatusBackendEndpointRuntimeRecordHandoff"),
    "Step133-C DTO must allow Step133-D",
  );

  for (const marker of [
    "@Get('amazon-sp-api/connection/status')",
    "amazonSpApiConnectionStatusBackendEndpoint",
    "amazonSpApiTokenPersistenceService.readConnectionStatus",
    "mapAmazonSpApiConnectionStatusForEndpoint",
    "redactSellingPartnerIdForConnectionStatus",
    "source: 'amazon-sp-api-connection-status'",
    "tokenExchangeHttpCallNow: false",
    "tokenPersistenceDatabaseWriteNow: false",
    "realSpApiRequestNow: false",
    "importJobWriteNow: false",
    "transactionWriteNow: false",
    "inventoryWriteNow: false",
  ]) {
    assert(controllerText.includes(marker), `controller missing marker: ${marker}`);
  }

  assert(tokenPersistenceServiceText.includes("readConnectionStatus"), "service must expose readConnectionStatus");
  assert(tokenPersistenceRepoText.includes("readConnectionStatus"), "repository must expose readConnectionStatus");
  assert(panelText.includes("AmazonSpApiConnectionStatusPanel"), "frontend panel must remain available");
  assert(webImportApiText.includes("requestAmazonSpApiAuthorizationUrl"), "frontend authorization helper must remain available");
  assert(!webImportApiText.includes("readAmazonSpApiConnectionStatus"), "Step133-D must not add frontend status helper yet");

  const backendText = [controllerText, tokenPersistenceServiceText, tokenPersistenceRepoText].join("\n");

  for (const pattern of [
    /api\.amazon\.com\/auth\/o2\/token|lwa\.amazon\.com\/auth\/o2\/token/i,
    /\bfetch\s*\(/,
    /\baxios\s*\./,
    /\bhttpService\s*\./,
    /reports\/2021-06-30|createReport|getReportDocument/i,
    /ImportJob\.create|transaction\.create|inventoryMovement\.create/,
  ]) {
    assert(!pattern.test(backendText), `backend boundary leak detected: ${pattern}`);
  }

  for (const pattern of [
    /"refreshToken"\s*:/i,
    /"accessToken"\s*:/i,
    /"refresh_token"\s*:/i,
    /"access_token"\s*:/i,
    /"encryptedRefreshToken"\s*:/i,
    /"encryptedAccessToken"\s*:/i,
    /"clientSecret"\s*:/i,
    /"client_secret"\s*:/i,
  ]) {
    assert(!pattern.test(controllerText), `controller response must not expose token/client secret: ${pattern}`);
  }

  const contract = assertAmazonSpApiConnectionStatusBackendEndpointRuntimeRecordHandoffContract(
    buildAmazonSpApiConnectionStatusBackendEndpointRuntimeRecordHandoffContract(),
  );

  assert(contract.sourceStep133C.summary.readyForStep133DConnectionStatusBackendEndpointRuntimeRecordHandoff === true, "Step133-C must allow Step133-D");
  assert(contract.summary.step133DCompleted === true, "Step133-D completion mismatch");
  assert(contract.summary.connectionStatusBackendEndpointPhaseCompleted === true, "backend endpoint phase should be completed");
  assert(contract.summary.readyForStep134AFrontendPanelReadsBackendStatusContract === true, "Step134-A readiness mismatch");
  assert(contract.summary.readyForStep134BFrontendPanelReadsBackendStatusImplementation === false, "Step134-B must remain blocked");
  assert(contract.summary.readyForStep135RealSpApiReports === false, "Step135 must remain blocked");
  assert(contract.summary.readyForCommittedSalesImport === false, "committed sales import must remain blocked");
  assert(contract.summary.readyForInventoryExecution === false, "inventory execution must remain blocked");

  console.log("[SMOKE_OK] amazon sp-api connection status backend endpoint runtime record/handoff contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step133-D",
    files: {
      dto: path.relative(repoRoot, dtoFile).replaceAll(path.sep, "/"),
      smoke: path.relative(repoRoot, __filename).replaceAll(path.sep, "/"),
      controller: path.relative(repoRoot, controllerFile).replaceAll(path.sep, "/"),
      tokenPersistenceService: path.relative(repoRoot, tokenPersistenceServiceFile).replaceAll(path.sep, "/"),
      tokenPersistenceRepository: path.relative(repoRoot, tokenPersistenceRepoFile).replaceAll(path.sep, "/"),
      panel: path.relative(repoRoot, panelFile).replaceAll(path.sep, "/"),
      webImportApi: path.relative(repoRoot, webImportApiFile).replaceAll(path.sep, "/"),
    },
    plannedNext: "Step134-A: Frontend panel reads Amazon SP-API connection status backend endpoint contract",
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
