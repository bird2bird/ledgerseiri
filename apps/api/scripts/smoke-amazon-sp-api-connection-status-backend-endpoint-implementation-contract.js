#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiConnectionStatusBackendEndpointImplementationContract,
  buildAmazonSpApiConnectionStatusBackendEndpointImplementationContract,
} = require("../dist/src/imports/dto/amazon-sp-api-connection-status-backend-endpoint-implementation-contract.dto");

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
    apiPackageJson.scripts["smoke:amazon-sp-api-connection-status-backend-endpoint-implementation-contract"] ===
      "node scripts/smoke-amazon-sp-api-connection-status-backend-endpoint-implementation-contract.js",
    "Step133-B smoke script missing or mismatched",
  );

  const dtoFile = path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-connection-status-backend-endpoint-implementation-contract.dto.ts");
  const step133aDtoFile = path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-connection-status-backend-endpoint-contract.dto.ts");
  const controllerFile = path.resolve(apiRoot, "src/imports/imports.controller.ts");
  const tokenPersistenceServiceFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-token-persistence.service.ts");
  const tokenPersistenceRepoFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-token-persistence.repository.ts");
  const panelFile = path.resolve(webRoot, "src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx");
  const apiFile = path.resolve(webRoot, "src/core/imports/api.ts");

  const dtoText = read(dtoFile);
  const step133aDtoText = read(step133aDtoFile);
  const controllerText = read(controllerFile);
  const tokenPersistenceServiceText = read(tokenPersistenceServiceFile);
  const tokenPersistenceRepoText = read(tokenPersistenceRepoFile);
  const panelText = read(panelFile);
  const apiText = read(apiFile);

  assert(step133aDtoText.includes("readyForStep133BConnectionStatusBackendEndpointImplementation"), "Step133-A must allow Step133-B");

  for (const marker of [
    "AMAZON_SP_API_CONNECTION_STATUS_BACKEND_ENDPOINT_IMPLEMENTATION_CONTRACT_VERSION",
    "readyForStep133CConnectionStatusBackendEndpointRuntimeSmoke",
    "/api/imports/amazon-sp-api/connection/status",
    "AmazonSpApiTokenPersistenceService",
    "readConnectionStatus",
  ]) {
    assert(dtoText.includes(marker), `Step133-B DTO missing marker: ${marker}`);
  }

  for (const marker of [
    "@UseGuards(JwtAuthGuard)",
    "@Get('amazon-sp-api/connection/status')",
    "amazonSpApiConnectionStatusBackendEndpoint",
    "amazonSpApiTokenPersistenceService.readConnectionStatus",
    "mapAmazonSpApiConnectionStatusForEndpoint",
    "redactSellingPartnerIdForConnectionStatus",
    "source: 'amazon-sp-api-connection-status'",
    "status: 'NOT_CONNECTED'",
    "status: mappedStatus",
    "'CONNECTED'",
    "'RECONNECT_REQUIRED'",
    "'ERROR'",
    "tokenExchangeHttpCallNow: false",
    "tokenPersistenceDatabaseWriteNow: false",
    "realSpApiRequestNow: false",
    "importJobWriteNow: false",
    "transactionWriteNow: false",
    "inventoryWriteNow: false",
  ]) {
    assert(controllerText.includes(marker), `controller missing marker: ${marker}`);
  }

  assert(tokenPersistenceServiceText.includes("readConnectionStatus"), "service must still expose readConnectionStatus");
  assert(tokenPersistenceRepoText.includes("readConnectionStatus"), "repository must still expose readConnectionStatus");

  assert(panelText.includes("AmazonSpApiConnectionStatusPanel"), "frontend panel must remain available");
  assert(apiText.includes("requestAmazonSpApiAuthorizationUrl"), "frontend authorization helper must remain available");
  assert(!apiText.includes("readAmazonSpApiConnectionStatus"), "Step133-B must not add frontend connection status helper yet");

  const implementationScopeText = [
    controllerText,
    tokenPersistenceServiceText,
    tokenPersistenceRepoText,
  ].join("\n");

  assert(!/api\.amazon\.com\/auth\/o2\/token|lwa\.amazon\.com\/auth\/o2\/token/i.test(implementationScopeText), "Step133-B must not reference real LWA token endpoint");
  assert(!/\bfetch\s*\(/.test(implementationScopeText), "Step133-B must not call fetch");
  assert(!/\baxios\s*\./.test(implementationScopeText), "Step133-B must not call axios");
  assert(!/\bhttpService\s*\./.test(implementationScopeText), "Step133-B must not call httpService");
  assert(!/reports\/2021-06-30|createReport|getReportDocument/i.test(implementationScopeText), "Step133-B must not call SP-API reports");
  assert(!/ImportJob\.create|transaction\.create|inventoryMovement\.create/.test(implementationScopeText), "Step133-B must not write import/ledger/inventory domain");

  assert(!/encryptedRefreshToken[^A-Za-z]/.test(controllerText), "controller must not return encryptedRefreshToken");
  assert(!/encryptedAccessToken[^A-Za-z]/.test(controllerText), "controller must not return encryptedAccessToken");
  assert(!/clientSecret[^A-Za-z]/.test(controllerText), "controller must not return clientSecret");

  const contract = assertAmazonSpApiConnectionStatusBackendEndpointImplementationContract(
    buildAmazonSpApiConnectionStatusBackendEndpointImplementationContract(),
  );

  assert(contract.sourceStep133A.summary.readyForStep133BConnectionStatusBackendEndpointImplementation === true, "Step133-A must allow Step133-B");
  assert(contract.backendImplementationNow === true, "Step133-B must implement backend");
  assert(contract.controllerMutationNow === true, "Step133-B must mutate controller");
  assert(contract.frontendMutationNow === false, "Step133-B must not mutate frontend");
  assert(contract.summary.readyForStep133CConnectionStatusBackendEndpointRuntimeSmoke === true, "Step133-C readiness mismatch");
  assert(contract.summary.readyForStep134FrontendPanelReadsBackendStatus === false, "Step134 must remain blocked");
  assert(contract.summary.readyForStep135RealSpApiReports === false, "Step135 must remain blocked");

  console.log("[SMOKE_OK] amazon sp-api connection status backend endpoint implementation contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step133-B",
    files: {
      dto: path.relative(repoRoot, dtoFile).replaceAll(path.sep, "/"),
      smoke: path.relative(repoRoot, __filename).replaceAll(path.sep, "/"),
      controller: path.relative(repoRoot, controllerFile).replaceAll(path.sep, "/"),
      tokenPersistenceService: path.relative(repoRoot, tokenPersistenceServiceFile).replaceAll(path.sep, "/"),
      tokenPersistenceRepository: path.relative(repoRoot, tokenPersistenceRepoFile).replaceAll(path.sep, "/"),
    },
    implementedEndpoint: contract.implementedEndpoint,
    plannedNext: "Step133-C: Amazon SP-API connection status backend endpoint runtime smoke",
    summary: contract.summary,
  }, null, 2));
}

try {
  main();
} catch (err) {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
}
