#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOauthCallbackTokenPersistenceRuntimeRecordHandoffContract,
  buildAmazonSpApiOauthCallbackTokenPersistenceRuntimeRecordHandoffContract,
} = require("../dist/src/imports/dto/amazon-sp-api-oauth-callback-token-persistence-runtime-record-handoff-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function assertStaticBoundary(controllerText, tokenExchangeText, tokenPersistenceText, authUrlText, bridgeText) {
  assert(controllerText.includes("AmazonSpApiTokenPersistenceService"), "controller must keep token persistence service wiring");
  assert(controllerText.includes("amazonSpApiOauthStatePersistenceBridgeService.buildPersistencePlan"), "controller must keep buildPersistencePlan wiring");
  assert(controllerText.includes("amazonSpApiTokenPersistenceService.persistEncryptedRefreshCredential"), "controller must keep refresh credential persistence");
  assert(controllerText.includes("amazonSpApiTokenPersistenceService.persistEncryptedAccessTokenCache"), "controller must keep access token cache persistence");
  assert(controllerText.includes("token_persistence_completed"), "controller must keep token persistence completion status");
  assert(controllerText.includes("tokenPersistenceDatabaseWriteNow: true"), "controller must mark token persistence DB write true");
  assert(controllerText.includes("tokenPersistencePending: false"), "controller must clear token persistence pending");
  assert(controllerText.includes("refreshCredentialPersisted: true"), "controller must expose refresh persisted flag");
  assert(controllerText.includes("accessTokenCachePersisted: Boolean"), "controller must expose access token cache persisted flag");

  const allText = [controllerText, tokenExchangeText, tokenPersistenceText, authUrlText, bridgeText].join("\n");
  assert(!/api\.amazon\.com\/auth\/o2\/token|lwa\.amazon\.com\/auth\/o2\/token/i.test(allText), "Step131-D must not reference real LWA token endpoint");
  assert(!/\bfetch\s*\(/.test(allText), "Step131-D must not call fetch");
  assert(!/\baxios\s*\./.test(allText), "Step131-D must not call axios");
  assert(!/\bhttpService\s*\./.test(allText), "Step131-D must not call httpService");
  assert(!/importJob\.create|transaction\.create|inventoryMovement\.create/.test(allText), "Step131-D must not write import/ledger/inventory domain");
}

function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");
  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-oauth-callback-token-persistence-runtime-record-handoff-contract"] ===
      "node scripts/smoke-amazon-sp-api-oauth-callback-token-persistence-runtime-record-handoff-contract.js",
    "Step131-D record/handoff smoke script missing or mismatched",
  );

  const dtoFile = path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-oauth-callback-token-persistence-runtime-record-handoff-contract.dto.ts");
  const step131cDtoFile = path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-oauth-callback-token-persistence-runtime-smoke-contract.dto.ts");
  const controllerFile = path.resolve(apiRoot, "src/imports/imports.controller.ts");
  const tokenExchangeFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-token-exchange.service.ts");
  const tokenPersistenceFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-token-persistence.service.ts");
  const authUrlFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-oauth-authorization-url.service.ts");
  const bridgeFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-oauth-state-persistence-bridge.service.ts");

  const dtoText = read(dtoFile);
  const step131cDtoText = read(step131cDtoFile);
  const controllerText = read(controllerFile);
  const tokenExchangeText = read(tokenExchangeFile);
  const tokenPersistenceText = read(tokenPersistenceFile);
  const authUrlText = read(authUrlFile);
  const bridgeText = read(bridgeFile);

  for (const marker of [
    "AMAZON_SP_API_OAUTH_CALLBACK_TOKEN_PERSISTENCE_RUNTIME_RECORD_HANDOFF_CONTRACT_VERSION",
    "oauthCallbackTokenPersistencePhaseCompletedNow",
    "readyForStep132AFrontendConnectionStatusPanelContract",
    "allowCallbackTokenPersistenceWiring",
    "allowEncryptedRefreshCredentialPersistence",
    "allowEncryptedAccessTokenCachePersistence",
    "forbidRealLwaHttpBeforeExplicitLaterStep",
    "forbidRealSpApiReportsBeforeStep135",
  ]) {
    assert(dtoText.includes(marker), `Step131-D DTO missing marker: ${marker}`);
  }

  assert(
    step131cDtoText.includes("readyForStep131DTokenPersistenceRuntimeRecordHandoff"),
    "Step131-C DTO must allow Step131-D",
  );

  assertStaticBoundary(controllerText, tokenExchangeText, tokenPersistenceText, authUrlText, bridgeText);

  const contract = assertAmazonSpApiOauthCallbackTokenPersistenceRuntimeRecordHandoffContract(
    buildAmazonSpApiOauthCallbackTokenPersistenceRuntimeRecordHandoffContract(),
  );

  assert(contract.sourceStep131C.summary.readyForStep131DTokenPersistenceRuntimeRecordHandoff === true, "Step131-C must allow Step131-D");
  assert(contract.summary.step131DCompleted === true, "Step131-D completion mismatch");
  assert(contract.summary.oauthCallbackTokenPersistencePhaseCompleted === true, "OAuth callback token persistence phase should be complete");
  assert(contract.summary.readyForStep132AFrontendConnectionStatusPanelContract === true, "Step132-A readiness mismatch");
  assert(contract.summary.readyForStep132BFrontendConnectionStatusPanelImplementation === false, "Step132-B must remain blocked");
  assert(contract.summary.readyForStep135RealSpApiReports === false, "Step135 must remain blocked");
  assert(contract.summary.readyForCommittedSalesImport === false, "committed sales import must remain blocked");
  assert(contract.summary.readyForInventoryExecution === false, "inventory execution must remain blocked");

  console.log("[SMOKE_OK] amazon sp-api oauth callback token persistence runtime record/handoff contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step131-D",
    files: {
      dto: path.relative(repoRoot, dtoFile).replaceAll(path.sep, "/"),
      smoke: path.relative(repoRoot, __filename).replaceAll(path.sep, "/"),
      controller: path.relative(repoRoot, controllerFile).replaceAll(path.sep, "/"),
      tokenPersistenceService: path.relative(repoRoot, tokenPersistenceFile).replaceAll(path.sep, "/"),
    },
    plannedNext: "Step132-A: Frontend Amazon SP-API connection status panel contract",
    summary: contract.summary,
  }, null, 2));
}

try {
  main();
} catch (err) {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
}
