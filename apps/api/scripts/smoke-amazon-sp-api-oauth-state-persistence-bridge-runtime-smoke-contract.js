#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOauthStatePersistenceBridgeRuntimeSmokeContract,
  buildAmazonSpApiOauthStatePersistenceBridgeRuntimeSmokeContract,
} = require("../dist/src/imports/dto/amazon-sp-api-oauth-state-persistence-bridge-runtime-smoke-contract.dto");

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
    packageJson.scripts["smoke:amazon-sp-api-oauth-state-persistence-bridge-runtime"] ===
      "node scripts/smoke-amazon-sp-api-oauth-state-persistence-bridge-runtime.js",
    "Step126-C runtime smoke script missing or mismatched",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-oauth-state-persistence-bridge-runtime-smoke-contract"] ===
      "node scripts/smoke-amazon-sp-api-oauth-state-persistence-bridge-runtime-smoke-contract.js",
    "Step126-C contract smoke script missing or mismatched",
  );

  const runtimeSmokeFile = path.resolve(apiRoot, "scripts/smoke-amazon-sp-api-oauth-state-persistence-bridge-runtime.js");
  const runtimeText = read(runtimeSmokeFile);

  for (const marker of [
    "AmazonSpApiOauthStatePersistenceBridgeService",
    "buildPersistencePlan",
    "validateStatePayload",
    "assertNoSecretLeak",
    "acceptedMapping",
    "callbackErrorShortCircuit",
    "missingAuthorizationCode",
    "missingSellingPartnerId",
    "expiredState",
    "nonceMismatch",
    "companyMismatch",
    "storeMismatch",
    "marketplaceMismatch",
    "regionMismatch",
    "appMismatch",
    "invalidTokenMetadata",
    "invalidState",
  ]) {
    assert(runtimeText.includes(marker), `runtime smoke missing marker: ${marker}`);
  }

  assert(!/fetch\s*\(/.test(runtimeText), "Step126-C runtime smoke must not perform HTTP fetch");
  assert(!/amazon\.com\/auth\/o2\/token|api\.amazon\.com\/auth\/o2\/token/i.test(runtimeText), "Step126-C runtime smoke must not use LWA endpoint");
  assert(!/PrismaClient/.test(runtimeText), "Step126-C runtime smoke must not write/read DB");
  assert(!/persistEncryptedRefreshCredential\s*\(/.test(runtimeText), "Step126-C runtime smoke must not call token persistence write service");
  assert(!/persistEncryptedAccessTokenCache\s*\(/.test(runtimeText), "Step126-C runtime smoke must not call access token persistence write service");

  const contract = assertAmazonSpApiOauthStatePersistenceBridgeRuntimeSmokeContract(
    buildAmazonSpApiOauthStatePersistenceBridgeRuntimeSmokeContract(),
  );

  assert(contract.sourceStep126B.summary.readyForStep126COauthStatePersistenceBridgeRuntimeSmoke === true, "Step126-B must allow Step126-C");
  assert(contract.runtimeSmokeImplementedNow === true, "Step126-C must implement runtime smoke");
  assert(contract.pureRuntimeOnly === true, "Step126-C must be pure runtime only");
  assert(contract.databaseWriteNow === false, "Step126-C must not write DB");
  assert(contract.httpCallNow === false, "Step126-C must not perform HTTP");
  assert(contract.summary.readyForStep126DOauthStatePersistenceBridgeRuntimeSmokeRecord === true, "Step126-C should allow Step126-D");
  assert(contract.runtimeSmokeFixes.spapiOauthCodeFallbackPositivePathOnly === true, "Step126-C spapi_oauth_code fallback fix marker missing");

  console.log("[SMOKE_OK] amazon sp-api oauth state persistence bridge runtime smoke contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step126-C",
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
