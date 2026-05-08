#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOauthCallbackTokenPersistenceImplementationContract,
  buildAmazonSpApiOauthCallbackTokenPersistenceImplementationContract,
} = require("../dist/src/imports/dto/amazon-sp-api-oauth-callback-token-persistence-implementation-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");
  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-oauth-callback-token-persistence-implementation-contract"] ===
      "node scripts/smoke-amazon-sp-api-oauth-callback-token-persistence-implementation-contract.js",
    "Step131-B smoke script missing or mismatched",
  );

  const dtoFile = path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-oauth-callback-token-persistence-implementation-contract.dto.ts");
  const controllerFile = path.resolve(apiRoot, "src/imports/imports.controller.ts");
  const persistenceServiceFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-token-persistence.service.ts");
  const bridgeFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-oauth-state-persistence-bridge.service.ts");

  const dtoText = read(dtoFile);
  const controllerText = read(controllerFile);
  const persistenceServiceText = read(persistenceServiceFile);
  const bridgeText = read(bridgeFile);

  for (const marker of [
    "AMAZON_SP_API_OAUTH_CALLBACK_TOKEN_PERSISTENCE_IMPLEMENTATION_CONTRACT_VERSION",
    "readyForStep131CTokenPersistenceRuntimeSmoke",
    "buildPersistencePlan",
    "persistEncryptedRefreshCredential",
    "persistEncryptedAccessTokenCache",
    "token_persistence_completed",
  ]) {
    assert(dtoText.includes(marker), `Step131-B DTO missing marker: ${marker}`);
  }

  assert(controllerText.includes("AmazonSpApiTokenPersistenceService"), "controller must import/inject token persistence service");
  assert(controllerText.includes("amazonSpApiOauthStatePersistenceBridgeService.buildPersistencePlan"), "controller must call buildPersistencePlan");
  assert(controllerText.includes("amazonSpApiTokenPersistenceService.persistEncryptedRefreshCredential"), "controller must persist refresh credential");
  assert(controllerText.includes("amazonSpApiTokenPersistenceService.persistEncryptedAccessTokenCache"), "controller must persist access token cache");
  assert(controllerText.includes("token_persistence_completed"), "controller must return token persistence completion status");
  assert(controllerText.includes("tokenPersistenceDatabaseWriteNow: true"), "controller must mark token persistence database write true after success");
  assert(controllerText.includes("tokenPersistencePending: false"), "controller must clear token persistence pending after success");

  assert(bridgeText.includes("buildPersistencePlan"), "bridge must expose buildPersistencePlan");
  assert(persistenceServiceText.includes("persistEncryptedRefreshCredential"), "persistence service must persist refresh credential");
  assert(persistenceServiceText.includes("persistEncryptedAccessTokenCache"), "persistence service must persist access token cache");

  const allText = controllerText + "\n" + persistenceServiceText + "\n" + bridgeText;
  assert(!/api\.amazon\.com\/auth\/o2\/token|lwa\.amazon\.com\/auth\/o2\/token/i.test(allText), "Step131-B must not reference real LWA token endpoint");
  assert(!/\bfetch\s*\(/.test(allText), "Step131-B must not call fetch");
  assert(!/\baxios\s*\./.test(allText), "Step131-B must not call axios");
  assert(!/\bhttpService\s*\./.test(allText), "Step131-B must not call httpService");
  assert(!/importJob\.create|transaction\.create|inventoryMovement\.create/.test(allText), "Step131-B must not write import/ledger/inventory domain");

  const contract = assertAmazonSpApiOauthCallbackTokenPersistenceImplementationContract(
    buildAmazonSpApiOauthCallbackTokenPersistenceImplementationContract(),
  );

  assert(contract.sourceStep131A.summary.readyForStep131BTokenPersistenceImplementation === true, "Step131-A must allow Step131-B");
  assert(contract.tokenPersistenceImplementationNow === true, "Step131-B must implement token persistence");
  assert(contract.summary.readyForStep131CTokenPersistenceRuntimeSmoke === true, "Step131-C readiness mismatch");

  console.log("[SMOKE_OK] amazon sp-api oauth callback token persistence implementation contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step131-B",
    files: {
      dto: path.relative(repoRoot, dtoFile).replaceAll(path.sep, "/"),
      smoke: path.relative(repoRoot, __filename).replaceAll(path.sep, "/"),
      controller: path.relative(repoRoot, controllerFile).replaceAll(path.sep, "/"),
      persistenceService: path.relative(repoRoot, persistenceServiceFile).replaceAll(path.sep, "/"),
      persistenceBridge: path.relative(repoRoot, bridgeFile).replaceAll(path.sep, "/"),
    },
    summary: contract.summary,
  }, null, 2));
}

try {
  main();
} catch (err) {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
}
