#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOauthAuthorizationUrlRouteContract,
  buildAmazonSpApiOauthAuthorizationUrlRouteContract,
} = require("../dist/src/imports/dto/amazon-sp-api-oauth-authorization-url-route-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function assertNoPrematureRouteOrIntegration(controllerText, moduleText) {
  assert(!/amazon-sp-api\/oauth\/authorization-url/.test(controllerText), "Step129-A must not implement authorization-url controller route");
  assert(!/AuthorizationUrl/.test(controllerText), "Step129-A must not add authorization URL controller handler");
  assert(!/buildAmazonSpApiOauthAuthorizationUrl/.test(controllerText), "Step129-A must not call authorization URL builder from controller");
  assert(!/oauthState.*create|amazonSpApiConnection.*create|amazonSpApiCredential.*create/i.test(controllerText), "Step129-A must not write OAuth/token DB from controller");
  assert(!/exchangeAuthorizationCodeDryRunnable/.test(controllerText), "Step129-A must not wire callback/controller to token exchange service");
  assert(!/AmazonSpApiOauthAuthorizationUrlService/.test(moduleText), "Step129-A must not register authorization URL service/provider");
}

function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");
  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-oauth-authorization-url-route-contract"] ===
      "node scripts/smoke-amazon-sp-api-oauth-authorization-url-route-contract.js",
    "Step129-A smoke script missing or mismatched",
  );

  const dtoFile = path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-oauth-authorization-url-route-contract.dto.ts");
  const controllerFile = path.resolve(apiRoot, "src/imports/imports.controller.ts");
  const moduleFile = path.resolve(apiRoot, "src/imports/imports.module.ts");

  const dtoText = read(dtoFile);
  const controllerText = read(controllerFile);
  const moduleText = read(moduleFile);

  for (const marker of [
    "AMAZON_SP_API_OAUTH_AUTHORIZATION_URL_ROUTE_CONTRACT_VERSION",
    "/api/imports/amazon-sp-api/oauth/authorization-url",
    "https://sellercentral.amazon.co.jp/apps/authorize/consent",
    "readyForStep129BAuthorizationUrlRouteImplementation",
    "noTokenExchangeNow",
    "noTokenPersistenceNow",
    "noRealAmazonRedirectNow",
  ]) {
    assert(dtoText.includes(marker), `Step129-A DTO missing marker: ${marker}`);
  }

  assertNoPrematureRouteOrIntegration(controllerText, moduleText);

  const contract = assertAmazonSpApiOauthAuthorizationUrlRouteContract(
    buildAmazonSpApiOauthAuthorizationUrlRouteContract(),
  );

  assert(contract.sourceStep128D.summary.readyForStep129AAuthorizationUrlRouteContract === true, "Step128-D must allow Step129-A");
  assert(contract.contractOnly === true, "Step129-A must remain contract-only");
  assert(contract.routeImplementedNow === false, "Step129-A must not implement route");
  assert(contract.controllerMutationNow === false, "Step129-A must not mutate controller");
  assert(contract.authorizationUrlBuilderImplementedNow === false, "Step129-A must not implement builder");
  assert(contract.oauthStateDatabaseWriteNow === false, "Step129-A must not write OAuth state DB");
  assert(contract.tokenExchangeHttpCallNow === false, "Step129-A must not call token exchange HTTP");
  assert(contract.tokenPersistenceDatabaseWriteNow === false, "Step129-A must not write token DB");
  assert(contract.summary.readyForStep129BAuthorizationUrlRouteImplementation === true, "Step129-B readiness mismatch");
  assert(contract.summary.readyForStep130CallbackRoutePersistenceIntegration === false, "Step130 must remain blocked");

  console.log("[SMOKE_OK] amazon sp-api oauth authorization URL route contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step129-A",
    files: {
      dto: path.relative(repoRoot, dtoFile).replaceAll(path.sep, "/"),
      smoke: path.relative(repoRoot, __filename).replaceAll(path.sep, "/"),
    },
    plannedNext: "Step129-B: Amazon SP-API OAuth authorization URL route implementation",
    summary: contract.summary,
  }, null, 2));
}

try {
  main();
} catch (err) {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
}
