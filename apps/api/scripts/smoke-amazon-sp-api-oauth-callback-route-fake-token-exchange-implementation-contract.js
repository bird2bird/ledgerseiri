#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOauthCallbackRouteFakeTokenExchangeImplementationContract,
  buildAmazonSpApiOauthCallbackRouteFakeTokenExchangeImplementationContract,
} = require("../dist/src/imports/dto/amazon-sp-api-oauth-callback-route-fake-token-exchange-implementation-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function assertStaticBoundary(controllerText, tokenExchangeServiceText) {
  assert(controllerText.includes("AmazonSpApiTokenExchangeService"), "controller must inject token exchange service");
  assert(controllerText.includes("amazonSpApiTokenExchangeService.exchangeAuthorizationCodeDryRunnable"), "callback route must call fake token exchange service");
  assert(controllerText.includes("fake_token_exchange_completed"), "callback route must return fake token exchange completion status");
  assert(controllerText.includes("sanitizedTokenEnvelope"), "callback route must return sanitized fake token envelope");
  assert(controllerText.includes("tokenPersistencePending: true"), "callback route must keep token persistence pending");

  assert(!/api\.amazon\.com\/auth\/o2\/token|lwa\.amazon\.com\/auth\/o2\/token/i.test(controllerText + tokenExchangeServiceText), "Step130-B must not reference real LWA token endpoint");
  assert(!/\bfetch\s*\(/.test(controllerText + tokenExchangeServiceText), "Step130-B must not call fetch");
  assert(!/\baxios\s*\./.test(controllerText + tokenExchangeServiceText), "Step130-B must not call axios");
  assert(!/\bhttpService\s*\./.test(controllerText + tokenExchangeServiceText), "Step130-B must not call httpService");
  assert(!/persistEncryptedRefreshCredential\s*\(/.test(controllerText + tokenExchangeServiceText), "Step130-B must not persist refresh credential");
  assert(!/persistEncryptedAccessTokenCache\s*\(/.test(controllerText + tokenExchangeServiceText), "Step130-B must not persist access token cache");
  assert(!/importJob\.create|transaction\.create|inventoryMovement\.create/.test(controllerText + tokenExchangeServiceText), "Step130-B must not write import/ledger/inventory domain");
}

function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");
  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-oauth-callback-route-fake-token-exchange-implementation-contract"] ===
      "node scripts/smoke-amazon-sp-api-oauth-callback-route-fake-token-exchange-implementation-contract.js",
    "Step130-B smoke script missing or mismatched",
  );

  const dtoFile = path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-oauth-callback-route-fake-token-exchange-implementation-contract.dto.ts");
  const controllerFile = path.resolve(apiRoot, "src/imports/imports.controller.ts");
  const tokenExchangeServiceFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-token-exchange.service.ts");

  const dtoText = read(dtoFile);
  const controllerText = read(controllerFile);
  const tokenExchangeServiceText = read(tokenExchangeServiceFile);

  for (const marker of [
    "AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_FAKE_TOKEN_EXCHANGE_IMPLEMENTATION_CONTRACT_VERSION",
    "readyForStep130CCallbackRouteFakeTokenExchangeRuntimeSmoke",
    "fakeTokenExchangeCalledFromCallbackNow",
    "successStatusFakeTokenExchangeCompleted",
    "sanitizedTokenEnvelopeReturned",
    "noTokenPersistence",
  ]) {
    assert(dtoText.includes(marker), `Step130-B DTO missing marker: ${marker}`);
  }

  assertStaticBoundary(controllerText, tokenExchangeServiceText);

  const contract = assertAmazonSpApiOauthCallbackRouteFakeTokenExchangeImplementationContract(
    buildAmazonSpApiOauthCallbackRouteFakeTokenExchangeImplementationContract(),
  );

  assert(contract.sourceStep130A.summary.readyForStep130BCallbackRouteFakeTokenExchangeIntegration === true, "Step130-A must allow Step130-B");
  assert(contract.callbackRouteIntegrationImplementedNow === true, "callback route integration must be implemented");
  assert(contract.fakeTokenExchangeCalledFromCallbackNow === true, "callback route must call fake token exchange");
  assert(contract.tokenExchangeHttpCallNow === false, "Step130-B must not call token exchange HTTP");
  assert(contract.tokenPersistenceDatabaseWriteNow === false, "Step130-B must not write token DB");
  assert(contract.realSpApiRequestNow === false, "Step130-B must not call real SP-API");
  assert(contract.summary.readyForStep130CCallbackRouteFakeTokenExchangeRuntimeSmoke === true, "Step130-C readiness mismatch");
  assert(contract.summary.readyForStep130DCallbackRouteTokenPersistenceContract === false, "Step130-D must remain blocked");

  console.log("[SMOKE_OK] amazon sp-api oauth callback route fake token exchange implementation contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step130-B",
    files: {
      dto: path.relative(repoRoot, dtoFile).replaceAll(path.sep, "/"),
      smoke: path.relative(repoRoot, __filename).replaceAll(path.sep, "/"),
      controller: path.relative(repoRoot, controllerFile).replaceAll(path.sep, "/"),
      tokenExchangeService: path.relative(repoRoot, tokenExchangeServiceFile).replaceAll(path.sep, "/"),
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
