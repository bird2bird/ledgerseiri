#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOauthCallbackRouteFakeTokenExchangeIntegrationContract,
  buildAmazonSpApiOauthCallbackRouteFakeTokenExchangeIntegrationContract,
} = require("../dist/src/imports/dto/amazon-sp-api-oauth-callback-route-fake-token-exchange-integration-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function assertNoPrematureCallbackIntegration(controllerText) {
  assert(controllerText.includes("@Get('amazon-sp-api/oauth/callback')"), "callback route must exist before Step130");
  assert(controllerText.includes("spapi_oauth_code"), "callback route must still read spapi_oauth_code");
  assert(controllerText.includes("selling_partner_id"), "callback route must still read selling_partner_id");
  assert(!/amazonSpApiTokenExchangeService\.exchangeAuthorizationCodeDryRunnable/.test(controllerText), "Step130-A must not wire callback route to token exchange service yet");
  assert(!/persistEncryptedRefreshCredential\s*\(/.test(controllerText), "Step130-A must not persist refresh credential");
  assert(!/persistEncryptedAccessTokenCache\s*\(/.test(controllerText), "Step130-A must not persist access token cache");
  assert(!/api\.amazon\.com\/auth\/o2\/token|lwa\.amazon\.com\/auth\/o2\/token/i.test(controllerText), "Step130-A controller must not reference LWA token endpoint");
}

function assertServiceBoundary(tokenExchangeServiceText) {
  assert(tokenExchangeServiceText.includes("AmazonSpApiTokenExchangeService"), "token exchange service must exist");
  assert(tokenExchangeServiceText.includes("exchangeAuthorizationCodeDryRunnable"), "fake token exchange dry-run method must exist");
  assert(tokenExchangeServiceText.includes("transportMode: 'fake'"), "token exchange service must still be fake transport");
  assert(!/api\.amazon\.com\/auth\/o2\/token|lwa\.amazon\.com\/auth\/o2\/token/i.test(tokenExchangeServiceText), "token exchange service must not reference LWA token endpoint");
  assert(!/\bfetch\s*\(/.test(tokenExchangeServiceText), "token exchange service must not call fetch");
  assert(!/\baxios\s*\./.test(tokenExchangeServiceText), "token exchange service must not call axios");
  assert(!/\bhttpService\s*\./.test(tokenExchangeServiceText), "token exchange service must not call httpService");
  assert(!/PrismaClient/.test(tokenExchangeServiceText), "token exchange service must not use PrismaClient");
  assert(!/persistEncryptedRefreshCredential\s*\(/.test(tokenExchangeServiceText), "token exchange service must not persist refresh credential");
  assert(!/persistEncryptedAccessTokenCache\s*\(/.test(tokenExchangeServiceText), "token exchange service must not persist access token cache");
}

function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");
  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-oauth-callback-route-fake-token-exchange-integration-contract"] ===
      "node scripts/smoke-amazon-sp-api-oauth-callback-route-fake-token-exchange-integration-contract.js",
    "Step130-A smoke script missing or mismatched",
  );

  const dtoFile = path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-oauth-callback-route-fake-token-exchange-integration-contract.dto.ts");
  const controllerFile = path.resolve(apiRoot, "src/imports/imports.controller.ts");
  const moduleFile = path.resolve(apiRoot, "src/imports/imports.module.ts");
  const tokenExchangeServiceFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-token-exchange.service.ts");

  const dtoText = read(dtoFile);
  const controllerText = read(controllerFile);
  const moduleText = read(moduleFile);
  const tokenExchangeServiceText = read(tokenExchangeServiceFile);

  for (const marker of [
    "AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_FAKE_TOKEN_EXCHANGE_INTEGRATION_CONTRACT_VERSION",
    "readyForStep130BCallbackRouteFakeTokenExchangeIntegration",
    "plannedServiceName: 'AmazonSpApiTokenExchangeService'",
    "plannedServiceMethod: 'exchangeAuthorizationCodeDryRunnable'",
    "noRealLwaHttpBeforeExplicitLaterStep",
    "noTokenPersistenceBeforeExplicitLaterStep",
  ]) {
    assert(dtoText.includes(marker), `Step130-A DTO missing marker: ${marker}`);
  }

  assert(moduleText.includes("AmazonSpApiTokenExchangeService"), "ImportsModule must already register token exchange service");
  assertNoPrematureCallbackIntegration(controllerText);
  assertServiceBoundary(tokenExchangeServiceText);

  const contract = assertAmazonSpApiOauthCallbackRouteFakeTokenExchangeIntegrationContract(
    buildAmazonSpApiOauthCallbackRouteFakeTokenExchangeIntegrationContract(),
  );

  assert(contract.sourceStep129D.summary.readyForStep130ACallbackRouteFakeTokenExchangeIntegrationContract === true, "Step129-D must allow Step130-A");
  assert(contract.contractOnly === true, "Step130-A must remain contract-only");
  assert(contract.callbackRouteIntegrationImplementedNow === false, "Step130-A must not integrate callback route");
  assert(contract.controllerMutationNow === false, "Step130-A must not mutate controller");
  assert(contract.tokenExchangeHttpCallNow === false, "Step130-A must not call token exchange HTTP");
  assert(contract.tokenPersistenceDatabaseWriteNow === false, "Step130-A must not write token DB");
  assert(contract.summary.readyForStep130BCallbackRouteFakeTokenExchangeIntegration === true, "Step130-B readiness mismatch");
  assert(contract.summary.readyForStep130CCallbackRouteFakeTokenExchangeRuntimeSmoke === false, "Step130-C must remain blocked");
  assert(contract.summary.readyForStep132FrontendConnectionStatusPanel === false, "Step132 must remain blocked");

  console.log("[SMOKE_OK] amazon sp-api oauth callback route fake token exchange integration contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step130-A",
    files: {
      dto: path.relative(repoRoot, dtoFile).replaceAll(path.sep, "/"),
      smoke: path.relative(repoRoot, __filename).replaceAll(path.sep, "/"),
      controller: path.relative(repoRoot, controllerFile).replaceAll(path.sep, "/"),
      tokenExchangeService: path.relative(repoRoot, tokenExchangeServiceFile).replaceAll(path.sep, "/"),
    },
    plannedNext: "Step130-B: OAuth callback route fake token exchange integration",
    summary: contract.summary,
  }, null, 2));
}

try {
  main();
} catch (err) {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
}
