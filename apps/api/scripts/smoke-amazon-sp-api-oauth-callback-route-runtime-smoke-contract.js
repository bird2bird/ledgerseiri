#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOauthCallbackRouteRuntimeSmokeContract,
  buildAmazonSpApiOauthCallbackRouteRuntimeSmokeContract,
} = require("../dist/src/imports/dto/amazon-sp-api-oauth-callback-route-runtime-smoke-contract.dto");

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
    packageJson.scripts["smoke:amazon-sp-api-oauth-callback-route-runtime"] ===
      "node scripts/smoke-amazon-sp-api-oauth-callback-route-runtime.js",
    "Step127-C runtime smoke script missing or mismatched",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-oauth-callback-route-runtime-smoke-contract"] ===
      "node scripts/smoke-amazon-sp-api-oauth-callback-route-runtime-smoke-contract.js",
    "Step127-C contract smoke script missing or mismatched",
  );

  const runtimeSmokeFile = path.resolve(apiRoot, "scripts/smoke-amazon-sp-api-oauth-callback-route-runtime.js");
  const runtimeText = read(runtimeSmokeFile);

  for (const marker of [
    "supertest",
    "ImportsController",
    "AmazonSpApiOauthStatePersistenceBridgeService",
    "/api/imports/amazon-sp-api/oauth/callback",
    "callbackErrorSanitizedFailure",
    "missingStateSanitizedFailure",
    "missingAuthorizationCodeSanitizedFailure",
    "missingSellingPartnerIdSanitizedFailure",
    "codeSuccessAcceptedForTokenExchangeLater",
    "spapiOauthCodeSuccessAcceptedForTokenExchangeLater",
    "assertNoSecretLeak",
  ]) {
    assert(runtimeText.includes(marker), `runtime smoke missing marker: ${marker}`);
  }

  assert(!/amazon\.com\/auth\/o2\/token|api\.amazon\.com\/auth\/o2\/token/i.test(runtimeText), "Step127-C runtime smoke must not use LWA endpoint");
  assert(!/PrismaClient/.test(runtimeText), "Step127-C runtime smoke must not access DB");
  assert(!/persistEncryptedRefreshCredential\s*\(/.test(runtimeText), "Step127-C runtime smoke must not write refresh credential");
  assert(!/persistEncryptedAccessTokenCache\s*\(/.test(runtimeText), "Step127-C runtime smoke must not write access token cache");

  const contract = assertAmazonSpApiOauthCallbackRouteRuntimeSmokeContract(
    buildAmazonSpApiOauthCallbackRouteRuntimeSmokeContract(),
  );

  assert(contract.sourceStep127B.summary.readyForStep127COauthCallbackRouteRuntimeSmoke === true, "Step127-B must allow Step127-C");
  assert(contract.runtimeSmokeImplementedNow === true, "Step127-C must implement runtime smoke");
  assert(contract.realNestHttpRouteSmokeNow === true, "Step127-C must use Nest HTTP runtime smoke");
  assert(contract.tokenExchangeHttpCallNow === false, "Step127-C must not do token exchange");
  assert(contract.tokenPersistenceDatabaseWriteNow === false, "Step127-C must not write DB");
  assert(contract.summary.readyForStep127DOauthCallbackRouteRuntimeSmokeRecord === true, "Step127-C should allow Step127-D");

  console.log("[SMOKE_OK] amazon sp-api oauth callback route runtime smoke contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step127-C",
    files: {
      runtimeSmoke: path.relative(repoRoot, runtimeSmokeFile).replaceAll(path.sep, "/"),
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
