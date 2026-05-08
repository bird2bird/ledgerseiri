#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOauthCallbackRouteFakeTokenExchangeRuntimeRecordHandoffContract,
  buildAmazonSpApiOauthCallbackRouteFakeTokenExchangeRuntimeRecordHandoffContract,
} = require("../dist/src/imports/dto/amazon-sp-api-oauth-callback-route-fake-token-exchange-runtime-record-handoff-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function isStep131BPhaseActive(apiRoot) {
  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  return (
    packageJson.scripts["smoke:amazon-sp-api-oauth-callback-token-persistence-implementation-contract"] ===
      "node scripts/smoke-amazon-sp-api-oauth-callback-token-persistence-implementation-contract.js" &&
    fs.existsSync(path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-oauth-callback-token-persistence-implementation-contract.dto.ts"))
  );
}

function assertStaticBoundary(controllerText, tokenExchangeServiceText, authUrlServiceText) {
  assert(controllerText.includes("@Get('amazon-sp-api/oauth/callback')"), "callback route must still exist");
  assert(controllerText.includes("amazonSpApiTokenExchangeService.exchangeAuthorizationCodeDryRunnable"), "callback route must still call fake token exchange service");
  if (!isStep131BPhaseActive(path.resolve(__dirname, ".."))) {
    assert(controllerText.includes("fake_token_exchange_completed"), "callback route must still return fake completion status before Step131-B");
  } else {
    assert(controllerText.includes("token_persistence_completed"), "Step131-B phase must return token persistence completion status");
  }
  assert(controllerText.includes("sanitizedTokenEnvelope"), "callback route must still return sanitized token envelope");
  if (!isStep131BPhaseActive(path.resolve(__dirname, ".."))) {
    assert(controllerText.includes("tokenPersistencePending: true"), "callback route must keep token persistence pending before Step131-B");
  } else {
    assert(controllerText.includes("tokenPersistencePending: false"), "Step131-B phase must clear token persistence pending");
  }

  const allText = controllerText + "\n" + tokenExchangeServiceText + "\n" + authUrlServiceText;
  assert(!/api\.amazon\.com\/auth\/o2\/token|lwa\.amazon\.com\/auth\/o2\/token/i.test(allText), "Step130-D must not reference real LWA token endpoint");
  assert(!/\bfetch\s*\(/.test(allText), "Step130-D must not call fetch");
  assert(!/\baxios\s*\./.test(allText), "Step130-D must not call axios");
  assert(!/\bhttpService\s*\./.test(allText), "Step130-D must not call httpService");
  if (!isStep131BPhaseActive(path.resolve(__dirname, ".."))) {
    assert(!/persistEncryptedRefreshCredential\s*\(/.test(allText), "Step130-D must not write refresh credential before Step131-B");
  } else {
    assert(/persistEncryptedRefreshCredential\s*\(/.test(allText), "Step131-B phase must persist refresh credential");
  }
  if (!isStep131BPhaseActive(path.resolve(__dirname, ".."))) {
    assert(!/persistEncryptedAccessTokenCache\s*\(/.test(allText), "Step130-D must not write access token cache before Step131-B");
  } else {
    assert(/persistEncryptedAccessTokenCache\s*\(/.test(allText), "Step131-B phase must persist access token cache");
  }
  assert(!/importJob\.create|transaction\.create|inventoryMovement\.create/.test(allText), "Step130-D must not write import/ledger/inventory domain");
}

function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");
  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-oauth-callback-route-fake-token-exchange-runtime-record-handoff-contract"] ===
      "node scripts/smoke-amazon-sp-api-oauth-callback-route-fake-token-exchange-runtime-record-handoff-contract.js",
    "Step130-D record/handoff smoke script missing or mismatched",
  );

  const dtoFile = path.resolve(
    apiRoot,
    "src/imports/dto/amazon-sp-api-oauth-callback-route-fake-token-exchange-runtime-record-handoff-contract.dto.ts",
  );
  const step130cDtoFile = path.resolve(
    apiRoot,
    "src/imports/dto/amazon-sp-api-oauth-callback-route-fake-token-exchange-runtime-smoke-contract.dto.ts",
  );
  const controllerFile = path.resolve(apiRoot, "src/imports/imports.controller.ts");
  const tokenExchangeServiceFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-token-exchange.service.ts");
  const authUrlServiceFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-oauth-authorization-url.service.ts");

  const dtoText = read(dtoFile);
  const step130cDtoText = read(step130cDtoFile);
  const controllerText = read(controllerFile);
  const tokenExchangeServiceText = read(tokenExchangeServiceFile);
  const authUrlServiceText = read(authUrlServiceFile);

  for (const marker of [
    "AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_FAKE_TOKEN_EXCHANGE_RUNTIME_RECORD_HANDOFF_CONTRACT_VERSION",
    "callbackFakeTokenExchangePhaseCompletedNow",
    "readyForStep131ATokenPersistenceContract",
    "forbidTokenPersistenceBeforeStep131",
    "allowCallbackFakeTokenExchangeWiring",
    "forbidFrontendConnectionPanelBeforeStep132",
    "forbidRealSpApiReportsBeforeStep135",
  ]) {
    assert(dtoText.includes(marker), `Step130-D DTO missing marker: ${marker}`);
  }

  assert(
    step130cDtoText.includes("readyForStep130DCallbackRouteFakeTokenExchangeRuntimeRecordHandoff"),
    "Step130-C DTO must allow Step130-D",
  );

  assertStaticBoundary(controllerText, tokenExchangeServiceText, authUrlServiceText);

  const contract = assertAmazonSpApiOauthCallbackRouteFakeTokenExchangeRuntimeRecordHandoffContract(
    buildAmazonSpApiOauthCallbackRouteFakeTokenExchangeRuntimeRecordHandoffContract(),
  );

  assert(contract.sourceStep130C.summary.readyForStep130DCallbackRouteFakeTokenExchangeRuntimeRecordHandoff === true, "Step130-C must allow Step130-D");
  assert(contract.summary.step130DCompleted === true, "Step130-D completion summary mismatch");
  assert(contract.summary.callbackFakeTokenExchangePhaseCompleted === true, "callback fake token exchange phase should be completed");
  assert(contract.summary.readyForStep131ATokenPersistenceContract === true, "Step131-A readiness mismatch");
  assert(contract.summary.readyForStep131BTokenPersistenceImplementation === false, "Step131-B must remain blocked");
  assert(contract.summary.readyForStep132FrontendConnectionStatusPanel === false, "Step132 must remain blocked");
  assert(contract.summary.readyForStep135RealSpApiReports === false, "Step135 must remain blocked");

  assert(contract.tokenExchangeHttpCallNow === false, "Step130-D must not call token exchange HTTP");
  assert(contract.tokenPersistenceDatabaseWriteNow === false, "Step130-D must not write token DB");
  assert(contract.realSpApiRequestNow === false, "Step130-D must not call real SP-API");
  assert(contract.importJobWriteNow === false, "Step130-D must not write ImportJob");
  assert(contract.transactionWriteNow === false, "Step130-D must not write Transaction");
  assert(contract.inventoryWriteNow === false, "Step130-D must not write Inventory");

  console.log("[SMOKE_OK] amazon sp-api oauth callback fake token exchange runtime record/handoff contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step130-D",
    files: {
      dto: path.relative(repoRoot, dtoFile).replaceAll(path.sep, "/"),
      smoke: path.relative(repoRoot, __filename).replaceAll(path.sep, "/"),
      controller: path.relative(repoRoot, controllerFile).replaceAll(path.sep, "/"),
      tokenExchangeService: path.relative(repoRoot, tokenExchangeServiceFile).replaceAll(path.sep, "/"),
    },
    plannedNext: "Step131-A: OAuth callback token persistence contract",
    summary: contract.summary,
  }, null, 2));
}

try {
  main();
} catch (err) {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
}
