#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiTokenExchangeServiceFakeTransportRuntimeSmokeContract,
  buildAmazonSpApiTokenExchangeServiceFakeTransportRuntimeSmokeContract,
} = require("../dist/src/imports/dto/amazon-sp-api-token-exchange-service-fake-transport-runtime-smoke-contract.dto");
const {
  AmazonSpApiTokenExchangeService,
} = require("../dist/src/imports/amazon-sp-api-token-exchange.service");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function assertNoSecretLeak(payload, label) {
  const serialized = JSON.stringify(payload);

  for (const forbidden of [
    "AUTH-CODE-RUNTIME-SECRET",
    "CLIENT-SECRET-RUNTIME-SECRET",
    "RAW-REFRESH-RUNTIME-SECRET",
    "RAW-ACCESS-RUNTIME-SECRET",
  ]) {
    assert(!serialized.includes(forbidden), `${label} leaked forbidden value: ${forbidden}`);
  }
}

function validInput(overrides = {}) {
  return {
    state: "state-runtime-step128c",
    authorizationCode: "AUTH-CODE-RUNTIME-SECRET",
    sellingPartnerId: "A-STEP128C-SELLER",
    redirectUri: "https://ledgerseiri.example/api/imports/amazon-sp-api/oauth/callback",
    clientId: "amzn1.application-oa2-client.step128c",
    clientSecretConfigured: true,
    marketplaceId: "A1VC38T7YXB528",
    region: "JP",
    companyId: "company-step128c",
    storeId: "store-step128c",
    dryRun: true,
    ...overrides,
  };
}

function assertRejected(service, overrides, reason) {
  const result = service.exchangeAuthorizationCodeDryRunnable(validInput(overrides));
  assert(result.accepted === false, `${reason} should be rejected`);
  assert(result.reason === reason, `${reason} rejection reason mismatch: ${result.reason}`);
  assertNoSecretLeak(result, `${reason} rejection`);
  return result;
}

function assertServiceStaticBoundary(serviceText, controllerText, packageJson, apiRoot) {
  assert(!/api\.amazon\.com\/auth\/o2\/token|lwa\.amazon\.com\/auth\/o2\/token/i.test(serviceText), "Step128-C service must not reference LWA token endpoint");
  assert(!/\bfetch\s*\(/.test(serviceText), "Step128-C service must not call fetch");
  assert(!/\baxios\s*\./.test(serviceText), "Step128-C service must not call axios");
  assert(!/\bhttpService\s*\./.test(serviceText), "Step128-C service must not call httpService");
  assert(!/PrismaClient/.test(serviceText), "Step128-C service must not access PrismaClient");
  assert(!/persistEncryptedRefreshCredential\s*\(/.test(serviceText), "Step128-C service must not write refresh credential");
  assert(!/persistEncryptedAccessTokenCache\s*\(/.test(serviceText), "Step128-C service must not write access token cache");
  assert(!/importJob\.create|transaction\.create|inventoryMovement\.create/.test(serviceText), "Step128-C service must not write ledger/import/inventory domain");
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
    assert(!/exchangeAuthorizationCodeDryRunnable/.test(controllerText), "Step128-C must not wire controller/callback to token exchange service before Step130-B");
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
    packageJson.scripts["smoke:amazon-sp-api-token-exchange-service-fake-transport-runtime-smoke-contract"] ===
      "node scripts/smoke-amazon-sp-api-token-exchange-service-fake-transport-runtime-smoke-contract.js",
    "Step128-C runtime smoke script missing or mismatched",
  );

  const serviceFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-token-exchange.service.ts");
  const controllerFile = path.resolve(apiRoot, "src/imports/imports.controller.ts");
  const dtoFile = path.resolve(
    apiRoot,
    "src/imports/dto/amazon-sp-api-token-exchange-service-fake-transport-runtime-smoke-contract.dto.ts",
  );

  const serviceText = read(serviceFile);
  const controllerText = read(controllerFile);
  const dtoText = read(dtoFile);

  for (const marker of [
    "AMAZON_SP_API_TOKEN_EXCHANGE_SERVICE_FAKE_TRANSPORT_RUNTIME_SMOKE_CONTRACT_VERSION",
    "validDryRunAccepted",
    "deterministicFakeEnvelopeStable",
    "readyForStep128DTokenExchangeServiceRuntimeSmokeRecordHandoff",
  ]) {
    assert(dtoText.includes(marker), `Step128-C DTO missing marker: ${marker}`);
  }

  assertServiceStaticBoundary(serviceText, controllerText, packageJson, apiRoot);

  const contract = assertAmazonSpApiTokenExchangeServiceFakeTransportRuntimeSmokeContract(
    buildAmazonSpApiTokenExchangeServiceFakeTransportRuntimeSmokeContract(),
  );

  const service = new AmazonSpApiTokenExchangeService();

  const accepted1 = service.exchangeAuthorizationCodeDryRunnable(validInput());
  const accepted2 = service.exchangeAuthorizationCodeDryRunnable(validInput());

  assert(accepted1.accepted === true, "valid dry-run input should be accepted");
  assert(accepted2.accepted === true, "valid dry-run input should be accepted consistently");
  assert(accepted1.transportMode === "fake", "transport mode should be fake");
  assert(accepted1.tokenExchangeHttpCallNow === false, "runtime must not call token exchange HTTP");
  assert(accepted1.lwaHttpCallNow === false, "runtime must not call LWA HTTP");
  assert(accepted1.tokenPersistenceDatabaseWriteNow === false, "runtime must not write token DB");
  assert(accepted1.realSpApiRequestNow === false, "runtime must not call real SP-API");
  assert(accepted1.sanitizedTokenEnvelope.encryptedRefreshToken === accepted2.sanitizedTokenEnvelope.encryptedRefreshToken, "fake refresh token envelope must be deterministic");
  assert(accepted1.sanitizedTokenEnvelope.encryptedAccessToken === accepted2.sanitizedTokenEnvelope.encryptedAccessToken, "fake access token envelope must be deterministic");
  assert(accepted1.sanitizedTokenEnvelope.encryptedRefreshToken.startsWith("fake-encrypted-refresh-"), "fake refresh envelope prefix mismatch");
  assert(accepted1.sanitizedTokenEnvelope.encryptedAccessToken.startsWith("fake-encrypted-access-"), "fake access envelope prefix mismatch");
  assertNoSecretLeak(accepted1, "accepted runtime result");

  assertRejected(service, { state: "" }, "missing_state");
  assertRejected(service, { authorizationCode: "" }, "missing_authorization_code");
  assertRejected(service, { sellingPartnerId: "" }, "missing_selling_partner_id");
  assertRejected(service, { redirectUri: "" }, "missing_redirect_uri");
  assertRejected(service, { clientId: "" }, "missing_client_id");
  assertRejected(service, { clientSecretConfigured: false }, "client_secret_not_configured");
  assertRejected(service, { marketplaceId: "" }, "missing_marketplace_id");
  assertRejected(service, { region: "" }, "missing_region");
  assertRejected(service, { companyId: "" }, "missing_company_id");
  assertRejected(service, { storeId: "" }, "missing_store_id");

  const nonDryRun = service.exchangeAuthorizationCodeDryRunnable(validInput({ dryRun: false }));
  assert(nonDryRun.accepted === false, "non-dry-run input should be rejected");
  assert(nonDryRun.reason === "dry_run_required", "non-dry-run reason mismatch");
  assertNoSecretLeak(nonDryRun, "non-dry-run rejection");

  assert(contract.summary.readyForStep128DTokenExchangeServiceRuntimeSmokeRecordHandoff === true, "Step128-D readiness mismatch");
  assert(contract.tokenExchangeHttpCallNow === false, "Step128-C must not call token exchange HTTP");
  assert(contract.tokenPersistenceDatabaseWriteNow === false, "Step128-C must not write token DB");
  assert(contract.realSpApiRequestNow === false, "Step128-C must not call real SP-API");

  console.log("[SMOKE_OK] amazon sp-api token exchange service fake-transport runtime smoke contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step128-C",
    files: {
      dto: path.relative(repoRoot, dtoFile).replaceAll(path.sep, "/"),
      smoke: path.relative(repoRoot, __filename).replaceAll(path.sep, "/"),
      service: path.relative(repoRoot, serviceFile).replaceAll(path.sep, "/"),
    },
    acceptedRuntime: {
      transportMode: accepted1.transportMode,
      tokenExchangeHttpCallNow: accepted1.tokenExchangeHttpCallNow,
      tokenPersistenceDatabaseWriteNow: accepted1.tokenPersistenceDatabaseWriteNow,
      realSpApiRequestNow: accepted1.realSpApiRequestNow,
      encryptedRefreshTokenPrefix: accepted1.sanitizedTokenEnvelope.encryptedRefreshToken.slice(0, "fake-encrypted-refresh-".length),
      encryptedAccessTokenPrefix: accepted1.sanitizedTokenEnvelope.encryptedAccessToken.slice(0, "fake-encrypted-access-".length),
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
