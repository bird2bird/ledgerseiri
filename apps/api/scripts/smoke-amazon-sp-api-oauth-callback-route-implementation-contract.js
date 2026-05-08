#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOauthCallbackRouteImplementationContract,
  buildAmazonSpApiOauthCallbackRouteImplementationContract,
} = require("../dist/src/imports/dto/amazon-sp-api-oauth-callback-route-implementation-contract.dto");

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
    packageJson.scripts["smoke:amazon-sp-api-oauth-callback-route-implementation-contract"] ===
      "node scripts/smoke-amazon-sp-api-oauth-callback-route-implementation-contract.js",
    "Step127-B npm script missing or mismatched",
  );

  const controllerFile = path.resolve(repoRoot, "apps/api/src/imports/imports.controller.ts");
  const controllerText = read(controllerFile);

  for (const marker of [
    "AmazonSpApiOauthStatePersistenceBridgeService",
    "@Get('amazon-sp-api/oauth/callback')",
    "amazonSpApiOAuthCallbackBoundary",
    "@Query('state')",
    "@Query('code')",
    "@Query('spapi_oauth_code')",
    "@Query('selling_partner_id')",
    "@Query('error')",
    "@Query('error_description')",
    "accepted_for_token_exchange_later",
    "missing_state",
    "missing_authorization_code",
    "missing_selling_partner_id",
    "callback_error",
    "tokenExchangeHttpCallNow: false",
    "tokenPersistenceDatabaseWriteNow: false",
    "realSpApiRequestNow: false",
    "bridgeServiceReady",
  ]) {
    assert(controllerText.includes(marker), `callback controller missing marker: ${marker}`);
  }

  assert(!/fetch\s*\(/.test(controllerText), "Step127-B callback route must not perform HTTP fetch");
  assert(!/amazon\.com\/auth\/o2\/token|api\.amazon\.com\/auth\/o2\/token/i.test(controllerText), "Step127-B callback route must not include LWA endpoint");
  assert(!/persistEncryptedRefreshCredential\s*\(/.test(controllerText), "Step127-B callback route must not write refresh credential");
  assert(!/persistEncryptedAccessTokenCache\s*\(/.test(controllerText), "Step127-B callback route must not write access token cache");
  assert(!/encryptedRefreshToken|encryptedAccessToken|refreshToken|accessToken/.test(controllerText), "Step127-B callback route must not handle token payloads");

  const contract = assertAmazonSpApiOauthCallbackRouteImplementationContract(
    buildAmazonSpApiOauthCallbackRouteImplementationContract(),
  );

  assert(contract.sourceStep127A.summary.readyForStep127BOauthCallbackRouteImplementation === true, "Step127-A must allow Step127-B");
  assert(contract.routeImplementedNow === true, "Step127-B must implement route");
  assert(contract.oauthCallbackRouteAddedNow === true, "Step127-B must add callback route");
  assert(contract.tokenExchangeHttpCallNow === false, "Step127-B must not call LWA");
  assert(contract.tokenPersistenceDatabaseWriteNow === false, "Step127-B must not write token DB");
  assert(contract.summary.readyForStep127COauthCallbackRouteRuntimeSmoke === true, "Step127-B should allow Step127-C");

  console.log("[SMOKE_OK] amazon sp-api oauth callback route implementation contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step127-B",
    route: contract.implementedRoute,
    summary: contract.summary,
  }, null, 2));
}

try {
  main();
} catch (err) {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
}
