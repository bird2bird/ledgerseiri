#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiTokenExchangeServiceFakeTransportRuntimeRecordHandoffContract,
  buildAmazonSpApiTokenExchangeServiceFakeTransportRuntimeRecordHandoffContract,
} = require("../dist/src/imports/dto/amazon-sp-api-token-exchange-service-fake-transport-runtime-record-handoff-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function assertServiceStaticBoundary(serviceText, controllerText, packageJson, apiRoot) {
  assert(!/api\.amazon\.com\/auth\/o2\/token|lwa\.amazon\.com\/auth\/o2\/token/i.test(serviceText), "Step128-D service must not reference real LWA token endpoint");
  assert(!/\bfetch\s*\(/.test(serviceText), "Step128-D service must not call fetch");
  assert(!/\baxios\s*\./.test(serviceText), "Step128-D service must not call axios");
  assert(!/\bhttpService\s*\./.test(serviceText), "Step128-D service must not call httpService");
  assert(!/PrismaClient/.test(serviceText), "Step128-D service must not access PrismaClient");
  assert(!/persistEncryptedRefreshCredential\s*\(/.test(serviceText), "Step128-D service must not write refresh credential");
  assert(!/persistEncryptedAccessTokenCache\s*\(/.test(serviceText), "Step128-D service must not write access token cache");
  assert(!/importJob\.create|transaction\.create|inventoryMovement\.create/.test(serviceText), "Step128-D service must not write ledger/import/inventory domain");
  const step130BPhaseActive =
    packageJson.scripts["smoke:amazon-sp-api-oauth-callback-route-fake-token-exchange-implementation-contract"] ===
      "node scripts/smoke-amazon-sp-api-oauth-callback-route-fake-token-exchange-implementation-contract.js" &&
    fs.existsSync(
      path.resolve(
        apiRoot,
        "src/imports/dto/amazon-sp-api-oauth-callback-route-fake-token-exchange-implementation-contract.dto.ts",
      ),
    );

  if (!step130BPhaseActive) {
    assert(!/exchangeAuthorizationCodeDryRunnable/.test(controllerText), "Step128-D must not wire controller/callback to token exchange service before Step130-B");
  } else {
    assert(
      /amazonSpApiTokenExchangeService\.exchangeAuthorizationCodeDryRunnable/.test(controllerText),
      "Step130-B phase must wire callback route to fake token exchange service",
    );
    assert(
      /fake_token_exchange_completed/.test(controllerText),
      "Step130-B phase must expose fake token exchange completion status",
    );
    assert(
      /tokenPersistencePending: true/.test(controllerText),
      "Step130-B phase must keep token persistence pending",
    );
  }
}

function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");
  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-token-exchange-service-fake-transport-runtime-record-handoff-contract"] ===
      "node scripts/smoke-amazon-sp-api-token-exchange-service-fake-transport-runtime-record-handoff-contract.js",
    "Step128-D record/handoff smoke script missing or mismatched",
  );

  const serviceFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-token-exchange.service.ts");
  const controllerFile = path.resolve(apiRoot, "src/imports/imports.controller.ts");
  const dtoFile = path.resolve(
    apiRoot,
    "src/imports/dto/amazon-sp-api-token-exchange-service-fake-transport-runtime-record-handoff-contract.dto.ts",
  );
  const step128cDtoFile = path.resolve(
    apiRoot,
    "src/imports/dto/amazon-sp-api-token-exchange-service-fake-transport-runtime-smoke-contract.dto.ts",
  );

  const serviceText = read(serviceFile);
  const controllerText = read(controllerFile);
  const dtoText = read(dtoFile);
  const step128cDtoText = read(step128cDtoFile);

  for (const marker of [
    "AMAZON_SP_API_TOKEN_EXCHANGE_SERVICE_FAKE_TRANSPORT_RUNTIME_RECORD_HANDOFF_CONTRACT_VERSION",
    "tokenExchangeFakeTransportPhaseCompletedNow",
    "readyForStep129AAuthorizationUrlRouteContract",
    "forbidRealLwaHttpTransportBeforeExplicitLaterStep",
    "forbidCallbackRouteServiceIntegrationBeforeStep130",
    "forbidFrontendConnectionPanelBeforeStep132",
  ]) {
    assert(dtoText.includes(marker), `Step128-D DTO missing marker: ${marker}`);
  }

  assert(
    step128cDtoText.includes("readyForStep128DTokenExchangeServiceRuntimeSmokeRecordHandoff"),
    "Step128-C DTO must allow Step128-D",
  );

  assertServiceStaticBoundary(serviceText, controllerText, packageJson, apiRoot);

  const contract = assertAmazonSpApiTokenExchangeServiceFakeTransportRuntimeRecordHandoffContract(
    buildAmazonSpApiTokenExchangeServiceFakeTransportRuntimeRecordHandoffContract(),
  );

  assert(contract.sourceStep128C.summary.readyForStep128DTokenExchangeServiceRuntimeSmokeRecordHandoff === true, "Step128-C must allow Step128-D");
  assert(contract.summary.step128DCompleted === true, "Step128-D completion summary mismatch");
  assert(contract.summary.tokenExchangeFakeTransportPhaseCompleted === true, "Step128 fake-transport phase should be completed");
  assert(contract.summary.readyForStep129AAuthorizationUrlRouteContract === true, "Step129-A readiness mismatch");
  assert(contract.summary.readyForStep129BAuthorizationUrlRouteImplementation === false, "Step129-B must remain blocked");
  assert(contract.summary.readyForStep130CallbackRoutePersistenceIntegration === false, "Step130 must remain blocked");
  assert(contract.tokenExchangeHttpCallNow === false, "Step128-D must not call token exchange HTTP");
  assert(contract.tokenPersistenceDatabaseWriteNow === false, "Step128-D must not write token DB");
  assert(contract.realSpApiRequestNow === false, "Step128-D must not call real SP-API");

  console.log("[SMOKE_OK] amazon sp-api token exchange service fake-transport runtime record/handoff contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step128-D",
    files: {
      dto: path.relative(repoRoot, dtoFile).replaceAll(path.sep, "/"),
      smoke: path.relative(repoRoot, __filename).replaceAll(path.sep, "/"),
      service: path.relative(repoRoot, serviceFile).replaceAll(path.sep, "/"),
    },
    plannedNext: "Step129-A: Amazon SP-API OAuth authorization URL route contract",
    summary: contract.summary,
  }, null, 2));
}

try {
  main();
} catch (err) {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
}
