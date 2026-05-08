#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOauthAuthorizationUrlRouteRuntimeRecordHandoffContract,
  buildAmazonSpApiOauthAuthorizationUrlRouteRuntimeRecordHandoffContract,
} = require("../dist/src/imports/dto/amazon-sp-api-oauth-authorization-url-route-runtime-record-handoff-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function assertStaticBoundary(serviceText, controllerText, moduleText) {
  assert(controllerText.includes("@UseGuards(JwtAuthGuard)"), "authorization-url route must remain guarded");
  assert(controllerText.includes("@Get('amazon-sp-api/oauth/authorization-url')"), "authorization-url GET route missing");
  assert(controllerText.includes("amazonSpApiOauthAuthorizationUrlService.buildAuthorizationUrl"), "controller must call authorization URL service");
  assert(moduleText.includes("AmazonSpApiOauthAuthorizationUrlService"), "module must register authorization URL service");

  assert(!/api\.amazon\.com\/auth\/o2\/token|lwa\.amazon\.com\/auth\/o2\/token/i.test(serviceText + controllerText), "Step129-D must not reference LWA token endpoint");
  assert(!/\bfetch\s*\(/.test(serviceText + controllerText), "Step129-D must not call fetch");
  assert(!/\baxios\s*\./.test(serviceText + controllerText), "Step129-D must not call axios");
  assert(!/\bhttpService\s*\./.test(serviceText + controllerText), "Step129-D must not call httpService");
  assert(!/PrismaClient/.test(serviceText), "Step129-D service must not use PrismaClient");
  assert(!/persistEncryptedRefreshCredential\s*\(/.test(controllerText + serviceText), "Step129-D must not write refresh credential");
  assert(!/persistEncryptedAccessTokenCache\s*\(/.test(controllerText + serviceText), "Step129-D must not write access token cache");
  assert(
    !/exchangeAuthorizationCodeDryRunnable/.test(controllerText) ||
      /fake_token_exchange_completed/.test(controllerText),
    "Authorization URL phase regression allows Step130-B fake callback token exchange wiring only when fake completion status is present",
  );
  assert(!/Redirect\(|res\.redirect|response\.redirect/.test(controllerText), "Step129-D must not redirect to Amazon");
}

function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");
  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-oauth-authorization-url-route-runtime-record-handoff-contract"] ===
      "node scripts/smoke-amazon-sp-api-oauth-authorization-url-route-runtime-record-handoff-contract.js",
    "Step129-D record/handoff smoke script missing or mismatched",
  );

  const serviceFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-oauth-authorization-url.service.ts");
  const controllerFile = path.resolve(apiRoot, "src/imports/imports.controller.ts");
  const moduleFile = path.resolve(apiRoot, "src/imports/imports.module.ts");
  const dtoFile = path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-oauth-authorization-url-route-runtime-record-handoff-contract.dto.ts");
  const step129cDtoFile = path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-oauth-authorization-url-route-runtime-smoke-contract.dto.ts");

  const serviceText = read(serviceFile);
  const controllerText = read(controllerFile);
  const moduleText = read(moduleFile);
  const dtoText = read(dtoFile);
  const step129cDtoText = read(step129cDtoFile);

  for (const marker of [
    "AMAZON_SP_API_OAUTH_AUTHORIZATION_URL_ROUTE_RUNTIME_RECORD_HANDOFF_CONTRACT_VERSION",
    "authorizationUrlRoutePhaseCompletedNow",
    "readyForStep130ACallbackRouteFakeTokenExchangeIntegrationContract",
    "forbidTokenExchangeCallbackIntegrationBeforeStep130",
    "forbidFrontendConnectionPanelBeforeStep132",
    "forbidRealSpApiReportsBeforeStep135",
  ]) {
    assert(dtoText.includes(marker), `Step129-D DTO missing marker: ${marker}`);
  }

  assert(
    step129cDtoText.includes("readyForStep129DAuthorizationUrlRouteRuntimeRecordHandoff"),
    "Step129-C DTO must allow Step129-D",
  );

  assertStaticBoundary(serviceText, controllerText, moduleText);

  const contract = assertAmazonSpApiOauthAuthorizationUrlRouteRuntimeRecordHandoffContract(
    buildAmazonSpApiOauthAuthorizationUrlRouteRuntimeRecordHandoffContract(),
  );

  assert(contract.sourceStep129C.summary.readyForStep129DAuthorizationUrlRouteRuntimeRecordHandoff === true, "Step129-C must allow Step129-D");
  assert(contract.summary.step129DCompleted === true, "Step129-D completion summary mismatch");
  assert(contract.summary.authorizationUrlRoutePhaseCompleted === true, "authorization URL route phase should be completed");
  assert(contract.summary.readyForStep130ACallbackRouteFakeTokenExchangeIntegrationContract === true, "Step130-A readiness mismatch");
  assert(contract.summary.readyForStep130BCallbackRouteFakeTokenExchangeIntegration === false, "Step130-B must remain blocked");
  assert(contract.summary.readyForStep130CTokenPersistenceFromCallback === false, "Step130-C must remain blocked");
  assert(contract.oauthStateDatabaseWriteNow === false, "Step129-D must not write OAuth state DB");
  assert(contract.tokenExchangeHttpCallNow === false, "Step129-D must not call token exchange HTTP");
  assert(contract.tokenPersistenceDatabaseWriteNow === false, "Step129-D must not write token DB");
  assert(contract.realAmazonRedirectNow === false, "Step129-D must not redirect to Amazon");
  assert(contract.realSpApiRequestNow === false, "Step129-D must not call real SP-API");

  console.log("[SMOKE_OK] amazon sp-api oauth authorization URL route runtime record/handoff contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step129-D",
    files: {
      dto: path.relative(repoRoot, dtoFile).replaceAll(path.sep, "/"),
      smoke: path.relative(repoRoot, __filename).replaceAll(path.sep, "/"),
      service: path.relative(repoRoot, serviceFile).replaceAll(path.sep, "/"),
    },
    plannedNext: "Step130-A: OAuth callback route fake token exchange integration contract",
    summary: contract.summary,
  }, null, 2));
}

try {
  main();
} catch (err) {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
}
