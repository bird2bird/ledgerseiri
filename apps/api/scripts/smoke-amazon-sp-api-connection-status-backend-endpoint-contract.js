#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiConnectionStatusBackendEndpointContract,
  buildAmazonSpApiConnectionStatusBackendEndpointContract,
} = require("../dist/src/imports/dto/amazon-sp-api-connection-status-backend-endpoint-contract.dto");

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
    apiPackageJson.scripts["smoke:amazon-sp-api-connection-status-backend-endpoint-contract"] ===
      "node scripts/smoke-amazon-sp-api-connection-status-backend-endpoint-contract.js",
    "Step133-A smoke script missing or mismatched",
  );

  const dtoFile = path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-connection-status-backend-endpoint-contract.dto.ts");
  const step132dDtoFile = path.resolve(apiRoot, "src/imports/dto/frontend-amazon-sp-api-connection-status-panel-runtime-record-handoff-contract.dto.ts");
  const controllerFile = path.resolve(apiRoot, "src/imports/imports.controller.ts");
  const tokenPersistenceServiceFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-token-persistence.service.ts");
  const tokenPersistenceRepoFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-token-persistence.repository.ts");
  const tokenExchangeFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-token-exchange.service.ts");
  const authUrlFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-oauth-authorization-url.service.ts");
  const bridgeFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-oauth-state-persistence-bridge.service.ts");
  const panelFile = path.resolve(webRoot, "src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx");
  const apiFile = path.resolve(webRoot, "src/core/imports/api.ts");

  const dtoText = read(dtoFile);
  const step132dDtoText = read(step132dDtoFile);
  const controllerText = read(controllerFile);
  const tokenPersistenceServiceText = read(tokenPersistenceServiceFile);
  const tokenPersistenceRepoText = read(tokenPersistenceRepoFile);
  const tokenExchangeText = read(tokenExchangeFile);
  const authUrlText = read(authUrlFile);
  const bridgeText = read(bridgeFile);
  const panelText = read(panelFile);
  const apiText = read(apiFile);

  for (const marker of [
    "AMAZON_SP_API_CONNECTION_STATUS_BACKEND_ENDPOINT_CONTRACT_VERSION",
    "/api/imports/amazon-sp-api/connection/status",
    "AmazonSpApiTokenPersistenceService",
    "readConnectionStatus",
    "readAmazonSpApiConnectionStatus",
    "readyForStep133BConnectionStatusBackendEndpointImplementation",
  ]) {
    assert(dtoText.includes(marker), `Step133-A DTO missing marker: ${marker}`);
  }

  assert(
    step132dDtoText.includes("readyForStep133AConnectionStatusBackendEndpointContract"),
    "Step132-D DTO must allow Step133-A",
  );

  assert(controllerText.includes("amazon-sp-api/oauth/authorization-url"), "authorization-url route must remain available");
  assert(controllerText.includes("amazon-sp-api/oauth/callback"), "callback route must remain available");
  assert(controllerText.includes("token_persistence_completed"), "callback token persistence must remain completed");

  assert(!controllerText.includes("amazon-sp-api/connection/status"), "Step133-A must not implement connection status controller route yet");
  assert(tokenPersistenceServiceText.includes("readConnectionStatus"), "token persistence service must expose readConnectionStatus");
  assert(tokenPersistenceServiceText.includes("revokeConnection"), "token persistence service must still expose revokeConnection");
  assert(tokenPersistenceRepoText.includes("readConnectionStatus"), "token persistence repository should expose readConnectionStatus");
  assert(tokenPersistenceRepoText.includes("findConnectionForScope"), "token persistence repository should support scoped connection lookup");

  const implementationScopeText = [
    controllerText,
    tokenPersistenceServiceText,
    tokenPersistenceRepoText,
    tokenExchangeText,
    authUrlText,
    bridgeText,
  ].join("\n");

  assert(!/api\.amazon\.com\/auth\/o2\/token|lwa\.amazon\.com\/auth\/o2\/token/i.test(implementationScopeText), "Step133-A must not reference real LWA token endpoint");
  assert(!/\bfetch\s*\(/.test(implementationScopeText), "Step133-A must not call fetch");
  assert(!/\baxios\s*\./.test(implementationScopeText), "Step133-A must not call axios");
  assert(!/\bhttpService\s*\./.test(implementationScopeText), "Step133-A must not call httpService");
  assert(!/reports\/2021-06-30|createReport|getReportDocument/i.test(implementationScopeText), "Step133-A must not call SP-API reports");
  assert(!/ImportJob\.create|transaction\.create|inventoryMovement\.create/.test(implementationScopeText), "Step133-A must not write import/ledger/inventory domain");

  assert(panelText.includes("AmazonSpApiConnectionStatusPanel"), "frontend panel must remain available");
  assert(panelText.includes("requestAmazonSpApiAuthorizationUrl"), "frontend panel must still use authorization helper");
  assert(apiText.includes("requestAmazonSpApiAuthorizationUrl"), "frontend authorization helper must remain available");
  assert(!apiText.includes("readAmazonSpApiConnectionStatus"), "Step133-A must not add frontend connection status helper yet");

  const contract = assertAmazonSpApiConnectionStatusBackendEndpointContract(
    buildAmazonSpApiConnectionStatusBackendEndpointContract(),
  );

  assert(contract.sourceStep132D.summary.readyForStep133AConnectionStatusBackendEndpointContract === true, "Step132-D must allow Step133-A");
  assert(contract.contractOnly === true, "Step133-A must remain contract-only");
  assert(contract.backendImplementationNow === false, "Step133-A must not implement backend");
  assert(contract.controllerMutationNow === false, "Step133-A must not mutate controller");
  assert(contract.frontendMutationNow === false, "Step133-A must not mutate frontend");
  assert(contract.summary.readyForStep133BConnectionStatusBackendEndpointImplementation === true, "Step133-B readiness mismatch");
  assert(contract.summary.readyForStep135RealSpApiReports === false, "Step135 must remain blocked");

  console.log("[SMOKE_OK] amazon sp-api connection status backend endpoint contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step133-A",
    files: {
      dto: path.relative(repoRoot, dtoFile).replaceAll(path.sep, "/"),
      smoke: path.relative(repoRoot, __filename).replaceAll(path.sep, "/"),
      controller: path.relative(repoRoot, controllerFile).replaceAll(path.sep, "/"),
      tokenPersistenceService: path.relative(repoRoot, tokenPersistenceServiceFile).replaceAll(path.sep, "/"),
      tokenPersistenceRepository: path.relative(repoRoot, tokenPersistenceRepoFile).replaceAll(path.sep, "/"),
    },
    plannedEndpoint: contract.plannedEndpoint,
    plannedNext: "Step133-B: Amazon SP-API connection status backend endpoint implementation",
    summary: contract.summary,
  }, null, 2));
}

try {
  main();
} catch (err) {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
}
