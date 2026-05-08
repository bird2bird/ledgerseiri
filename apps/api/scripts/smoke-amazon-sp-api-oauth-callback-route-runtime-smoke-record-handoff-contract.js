#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOauthCallbackRouteRuntimeSmokeRecordHandoffContract,
  buildAmazonSpApiOauthCallbackRouteRuntimeSmokeRecordHandoffContract,
} = require("../dist/src/imports/dto/amazon-sp-api-oauth-callback-route-runtime-smoke-record-handoff-contract.dto");

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
    packageJson.scripts["smoke:amazon-sp-api-oauth-callback-route-runtime-smoke-record-handoff-contract"] ===
      "node scripts/smoke-amazon-sp-api-oauth-callback-route-runtime-smoke-record-handoff-contract.js",
    "Step127-D record/handoff smoke script missing or mismatched",
  );

  const dtoFile = path.resolve(
    apiRoot,
    "src/imports/dto/amazon-sp-api-oauth-callback-route-runtime-smoke-record-handoff-contract.dto.ts",
  );
  const dtoText = read(dtoFile);

  for (const marker of [
    "AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_RUNTIME_SMOKE_RECORD_HANDOFF_CONTRACT_VERSION",
    "sourceStep127C",
    "oauthCallbackRouteBoundaryPhaseCompletedNow",
    "observedRuntimeSmokePassed",
    "readyForStep128ATokenExchangeServicePreimplementationContract",
    "forbidOldNoRoutePreimplementationRegressionAsPrimary",
    "forbidLwaTokenExchangeBeforeStep128",
    "forbidTokenPersistenceFromCallbackBeforeStep130",
  ]) {
    assert(dtoText.includes(marker), `Step127-D DTO missing marker: ${marker}`);
  }

  assert(!/amazon\.com\/auth\/o2\/token|api\.amazon\.com\/auth\/o2\/token/i.test(dtoText), "Step127-D DTO must not include LWA endpoint");
  assert(!/PrismaClient/.test(dtoText), "Step127-D DTO must not access PrismaClient");
  assert(!/fetch\s*\(/.test(dtoText), "Step127-D DTO must not call fetch");
  assert(!/persistEncryptedRefreshCredential\s*\(/.test(dtoText), "Step127-D DTO must not write refresh credential");
  assert(!/persistEncryptedAccessTokenCache\s*\(/.test(dtoText), "Step127-D DTO must not write access token cache");

  const contract = assertAmazonSpApiOauthCallbackRouteRuntimeSmokeRecordHandoffContract(
    buildAmazonSpApiOauthCallbackRouteRuntimeSmokeRecordHandoffContract(),
  );

  assert(contract.sourceStep127C.summary.readyForStep127DOauthCallbackRouteRuntimeSmokeRecord === true, "Step127-C must allow Step127-D");
  assert(contract.summary.step127DCompleted === true, "Step127-D completion summary mismatch");
  assert(contract.summary.oauthCallbackRouteBoundaryPhaseCompleted === true, "callback route boundary phase should be completed");
  assert(contract.summary.readyForStep128ATokenExchangeServicePreimplementationContract === true, "Step128-A readiness mismatch");
  assert(contract.summary.readyForStep128BTokenExchangeServiceFakeTransportImplementation === false, "Step128-B fake transport implementation must remain blocked");
  assert(contract.summary.readyForStep130CallbackRoutePersistenceIntegration === false, "Step130 must remain blocked");
  assert(contract.tokenExchangeHttpCallNow === false, "Step127-D must not call token exchange");
  assert(contract.tokenPersistenceDatabaseWriteNow === false, "Step127-D must not write DB");
  assert(contract.realSpApiRequestNow === false, "Step127-D must not call real SP-API");

  console.log("[SMOKE_OK] amazon sp-api oauth callback route runtime smoke record/handoff contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step127-D",
    files: {
      dto: path.relative(repoRoot, dtoFile).replaceAll(path.sep, "/"),
      smoke: path.relative(repoRoot, __filename).replaceAll(path.sep, "/"),
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
