#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOauthCallbackTokenPersistenceContract,
  buildAmazonSpApiOauthCallbackTokenPersistenceContract,
} = require("../dist/src/imports/dto/amazon-sp-api-oauth-callback-token-persistence-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function assertNoPrematurePersistence(controllerText) {
  const apiRoot = path.resolve(__dirname, "..");
  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  const step131BPhaseActive =
    packageJson.scripts["smoke:amazon-sp-api-oauth-callback-token-persistence-implementation-contract"] ===
      "node scripts/smoke-amazon-sp-api-oauth-callback-token-persistence-implementation-contract.js" &&
    fs.existsSync(path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-oauth-callback-token-persistence-implementation-contract.dto.ts"));

  assert(controllerText.includes("amazonSpApiTokenExchangeService.exchangeAuthorizationCodeDryRunnable"), "callback must already call fake token exchange");
  assert(controllerText.includes("sanitizedTokenEnvelope"), "callback must already return sanitized token envelope");

  if (!step131BPhaseActive) {
    assert(controllerText.includes("tokenPersistencePending: true"), "Step131-A must keep token persistence pending before Step131-B");
    assert(!/buildPersistencePlan\s*\(/.test(controllerText), "Step131-A must not call buildPersistencePlan from controller before Step131-B");
    assert(!/refreshCredentialInput/.test(controllerText), "Step131-A controller must not consume refreshCredentialInput before Step131-B");
    assert(!/accessTokenCacheInput/.test(controllerText), "Step131-A controller must not consume accessTokenCacheInput before Step131-B");
    assert(!/tokenPersistenceDatabaseWriteNow:\s*true/.test(controllerText), "Step131-A must not mark token persistence DB write true before Step131-B");
  } else {
    assert(/buildPersistencePlan\s*\(/.test(controllerText), "Step131-B phase must call buildPersistencePlan from controller");
    assert(/persistEncryptedRefreshCredential\s*\(/.test(controllerText), "Step131-B phase must persist refresh credential");
    assert(/persistEncryptedAccessTokenCache\s*\(/.test(controllerText), "Step131-B phase must persist access token cache");
    assert(/tokenPersistenceDatabaseWriteNow:\s*true/.test(controllerText), "Step131-B phase must mark token persistence DB write true");
    assert(/tokenPersistencePending:\s*false/.test(controllerText), "Step131-B phase must clear token persistence pending");
  }
}

function assertPersistenceBridgeBoundary(bridgeText) {
  assert(bridgeText.includes("AmazonSpApiOauthStatePersistenceBridgeService"), "persistence bridge service must exist");
  assert(bridgeText.includes("buildPersistencePlan"), "persistence bridge buildPersistencePlan method must exist");
  assert(bridgeText.includes("refreshCredentialInput"), "persistence bridge must build refreshCredentialInput");
  assert(bridgeText.includes("accessTokenCacheInput"), "persistence bridge must build accessTokenCacheInput");
  assert(bridgeText.includes("validateStatePayload"), "persistence bridge must validate state payload");
  assert(!/api\.amazon\.com\/auth\/o2\/token|lwa\.amazon\.com\/auth\/o2\/token/i.test(bridgeText), "persistence bridge must not reference LWA token endpoint");
  assert(!/\bfetch\s*\(/.test(bridgeText), "persistence bridge must not call fetch");
  assert(!/\baxios\s*\./.test(bridgeText), "persistence bridge must not call axios");
  assert(!/\bhttpService\s*\./.test(bridgeText), "persistence bridge must not call httpService");
}

function assertStaticBoundary(controllerText, tokenExchangeText, authUrlText, bridgeText) {
  const allText = [controllerText, tokenExchangeText, authUrlText, bridgeText].join("\n");

  assert(!/api\.amazon\.com\/auth\/o2\/token|lwa\.amazon\.com\/auth\/o2\/token/i.test(allText), "Step131-A must not reference real LWA token endpoint");
  assert(!/\bfetch\s*\(/.test(allText), "Step131-A must not call fetch");
  assert(!/\baxios\s*\./.test(allText), "Step131-A must not call axios");
  assert(!/\bhttpService\s*\./.test(allText), "Step131-A must not call httpService");
  assert(!/importJob\.create|transaction\.create|inventoryMovement\.create/.test(allText), "Step131-A must not write import/ledger/inventory domain");
}

function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");
  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-oauth-callback-token-persistence-contract"] ===
      "node scripts/smoke-amazon-sp-api-oauth-callback-token-persistence-contract.js",
    "Step131-A smoke script missing or mismatched",
  );

  const dtoFile = path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-oauth-callback-token-persistence-contract.dto.ts");
  const step130dDtoFile = path.resolve(
    apiRoot,
    "src/imports/dto/amazon-sp-api-oauth-callback-route-fake-token-exchange-runtime-record-handoff-contract.dto.ts",
  );
  const controllerFile = path.resolve(apiRoot, "src/imports/imports.controller.ts");
  const tokenExchangeFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-token-exchange.service.ts");
  const authUrlFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-oauth-authorization-url.service.ts");
  const bridgeFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-oauth-state-persistence-bridge.service.ts");

  const dtoText = read(dtoFile);
  const step130dDtoText = read(step130dDtoFile);
  const controllerText = read(controllerFile);
  const tokenExchangeText = read(tokenExchangeFile);
  const authUrlText = read(authUrlFile);
  const bridgeText = read(bridgeFile);

  for (const marker of [
    "AMAZON_SP_API_OAUTH_CALLBACK_TOKEN_PERSISTENCE_CONTRACT_VERSION",
    "readyForStep131BTokenPersistenceImplementation",
    "buildPersistencePlan",
    "refreshCredentialInput",
    "accessTokenCacheInput",
    "rawRefreshTokenNotPersisted",
    "rawAccessTokenNotPersisted",
  ]) {
    assert(dtoText.includes(marker), `Step131-A DTO missing marker: ${marker}`);
  }

  assert(
    step130dDtoText.includes("readyForStep131ATokenPersistenceContract"),
    "Step130-D DTO must allow Step131-A",
  );

  assertNoPrematurePersistence(controllerText);
  assertPersistenceBridgeBoundary(bridgeText);
  assertStaticBoundary(controllerText, tokenExchangeText, authUrlText, bridgeText);

  const contract = assertAmazonSpApiOauthCallbackTokenPersistenceContract(
    buildAmazonSpApiOauthCallbackTokenPersistenceContract(),
  );

  assert(contract.sourceStep130D.summary.readyForStep131ATokenPersistenceContract === true, "Step130-D must allow Step131-A");
  assert(contract.contractOnly === true, "Step131-A must remain contract-only");
  assert(contract.tokenPersistenceImplementationNow === false, "Step131-A must not implement token persistence");
  assert(contract.controllerMutationNow === false, "Step131-A must not mutate controller");
  assert(contract.tokenPersistenceDatabaseWriteNow === false, "Step131-A must not write token DB");
  assert(contract.plannedPersistenceIntegration.persistenceBridgeMethod === "buildPersistencePlan", "Step131-A must plan buildPersistencePlan");
  assert(contract.plannedPersistenceIntegration.plannedRefreshPlanField === "refreshCredentialInput", "Step131-A refresh plan field mismatch");
  assert(contract.plannedPersistenceIntegration.plannedAccessPlanField === "accessTokenCacheInput", "Step131-A access plan field mismatch");
  assert(contract.summary.readyForStep131BTokenPersistenceImplementation === true, "Step131-B readiness mismatch");
  assert(contract.summary.readyForStep131CTokenPersistenceRuntimeSmoke === false, "Step131-C must remain blocked");
  assert(contract.summary.readyForStep132FrontendConnectionStatusPanel === false, "Step132 must remain blocked");
  assert(contract.summary.readyForStep135RealSpApiReports === false, "Step135 must remain blocked");

  console.log("[SMOKE_OK] amazon sp-api oauth callback token persistence contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step131-A",
    files: {
      dto: path.relative(repoRoot, dtoFile).replaceAll(path.sep, "/"),
      smoke: path.relative(repoRoot, __filename).replaceAll(path.sep, "/"),
      controller: path.relative(repoRoot, controllerFile).replaceAll(path.sep, "/"),
      persistenceBridge: path.relative(repoRoot, bridgeFile).replaceAll(path.sep, "/"),
    },
    plannedNext: "Step131-B: OAuth callback token persistence implementation",
    summary: contract.summary,
  }, null, 2));
}

try {
  main();
} catch (err) {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
}
