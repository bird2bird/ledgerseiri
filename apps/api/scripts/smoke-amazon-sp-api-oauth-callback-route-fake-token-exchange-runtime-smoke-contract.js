#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const request = require("supertest");
const { Test } = require("@nestjs/testing");

const {
  assertAmazonSpApiOauthCallbackRouteFakeTokenExchangeRuntimeSmokeContract,
  buildAmazonSpApiOauthCallbackRouteFakeTokenExchangeRuntimeSmokeContract,
} = require("../dist/src/imports/dto/amazon-sp-api-oauth-callback-route-fake-token-exchange-runtime-smoke-contract.dto");
const { ImportsController } = require("../dist/src/imports/imports.controller");
const { ImportsService } = require("../dist/src/imports/imports.service");
const {
  AmazonSpApiOauthStatePersistenceBridgeService,
} = require("../dist/src/imports/amazon-sp-api-oauth-state-persistence-bridge.service");
const {
  AmazonSpApiOauthAuthorizationUrlService,
} = require("../dist/src/imports/amazon-sp-api-oauth-authorization-url.service");
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
    "SPAPI-CODE-RUNTIME-SECRET",
    "CLIENT-SECRET-RUNTIME-SECRET",
    "RAW-REFRESH-RUNTIME-SECRET",
    "RAW-ACCESS-RUNTIME-SECRET",
    "refreshToken",
    "accessToken",
  ]) {
    assert(!serialized.includes(forbidden), `${label} leaked forbidden value: ${forbidden}`);
  }
}

async function createRuntimeApp() {
  const serviceMock = {};

  const moduleRef = await Test.createTestingModule({
    controllers: [ImportsController],
    providers: [
      { provide: ImportsService, useValue: serviceMock },
      AmazonSpApiOauthStatePersistenceBridgeService,
      AmazonSpApiOauthAuthorizationUrlService,
      AmazonSpApiTokenExchangeService,
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  return app;
}

function assertStaticBoundary(controllerText, tokenExchangeServiceText, authUrlServiceText) {
  assert(controllerText.includes("@Get('amazon-sp-api/oauth/callback')"), "callback route must exist");
  assert(controllerText.includes("amazonSpApiTokenExchangeService.exchangeAuthorizationCodeDryRunnable"), "callback route must call fake token exchange service");
  assert(controllerText.includes("fake_token_exchange_completed"), "callback route must return fake token exchange completion status");
  assert(controllerText.includes("sanitizedTokenEnvelope"), "callback route must return sanitized token envelope");
  assert(controllerText.includes("tokenPersistencePending: true"), "callback route must keep token persistence pending");

  const allText = controllerText + "\n" + tokenExchangeServiceText + "\n" + authUrlServiceText;
  assert(!/api\.amazon\.com\/auth\/o2\/token|lwa\.amazon\.com\/auth\/o2\/token/i.test(allText), "Step130-C must not reference real LWA token endpoint");
  assert(!/\bfetch\s*\(/.test(allText), "Step130-C must not call fetch");
  assert(!/\baxios\s*\./.test(allText), "Step130-C must not call axios");
  assert(!/\bhttpService\s*\./.test(allText), "Step130-C must not call httpService");
  assert(!/persistEncryptedRefreshCredential\s*\(/.test(allText), "Step130-C must not write refresh credential");
  assert(!/persistEncryptedAccessTokenCache\s*\(/.test(allText), "Step130-C must not write access token cache");
  assert(!/importJob\.create|transaction\.create|inventoryMovement\.create/.test(allText), "Step130-C must not write import/ledger/inventory domain");
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");
  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-oauth-callback-route-fake-token-exchange-runtime-smoke-contract"] ===
      "node scripts/smoke-amazon-sp-api-oauth-callback-route-fake-token-exchange-runtime-smoke-contract.js",
    "Step130-C runtime smoke script missing or mismatched",
  );

  const controllerFile = path.resolve(apiRoot, "src/imports/imports.controller.ts");
  const tokenExchangeServiceFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-token-exchange.service.ts");
  const authUrlServiceFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-oauth-authorization-url.service.ts");
  const dtoFile = path.resolve(
    apiRoot,
    "src/imports/dto/amazon-sp-api-oauth-callback-route-fake-token-exchange-runtime-smoke-contract.dto.ts",
  );

  const controllerText = read(controllerFile);
  const tokenExchangeServiceText = read(tokenExchangeServiceFile);
  const authUrlServiceText = read(authUrlServiceFile);
  const dtoText = read(dtoFile);

  for (const marker of [
    "AMAZON_SP_API_OAUTH_CALLBACK_ROUTE_FAKE_TOKEN_EXCHANGE_RUNTIME_SMOKE_CONTRACT_VERSION",
    "callbackCodePathReturnsFakeTokenExchangeCompleted",
    "callbackSpapiOauthCodePathReturnsFakeTokenExchangeCompleted",
    "readyForStep130DCallbackRouteFakeTokenExchangeRuntimeRecordHandoff",
  ]) {
    assert(dtoText.includes(marker), `Step130-C DTO missing marker: ${marker}`);
  }

  assertStaticBoundary(controllerText, tokenExchangeServiceText, authUrlServiceText);

  const contract = assertAmazonSpApiOauthCallbackRouteFakeTokenExchangeRuntimeSmokeContract(
    buildAmazonSpApiOauthCallbackRouteFakeTokenExchangeRuntimeSmokeContract(),
  );

  const app = await createRuntimeApp();
  const server = app.getHttpServer();

  try {
    const codeSuccess = await request(server)
      .get("/api/imports/amazon-sp-api/oauth/callback")
      .query({
        state: "state-runtime-step130c",
        code: "AUTH-CODE-RUNTIME-SECRET",
        selling_partner_id: "A-STEP130C-SELLER",
      })
      .expect(200);

    assert(codeSuccess.body.accepted === true, "code path should be accepted");
    assert(codeSuccess.body.status === "fake_token_exchange_completed", "code path status mismatch");
    assert(codeSuccess.body.spapiOauthCodeUsed === false, "code path spapiOauthCodeUsed mismatch");
    assert(codeSuccess.body.tokenExchangeAttempted === true, "code path tokenExchangeAttempted mismatch");
    assert(codeSuccess.body.tokenExchangeTransportMode === "fake", "code path transport mismatch");
    assert(codeSuccess.body.tokenExchangeHttpCallNow === false, "code path must not call token exchange HTTP");
    assert(codeSuccess.body.tokenPersistenceDatabaseWriteNow === false, "code path must not write token DB");
    assert(codeSuccess.body.realSpApiRequestNow === false, "code path must not call real SP-API");
    assert(codeSuccess.body.sanitizedTokenEnvelope.encryptedRefreshToken.startsWith("fake-encrypted-refresh-"), "code path refresh envelope mismatch");
    assert(codeSuccess.body.sanitizedTokenEnvelope.encryptedAccessToken.startsWith("fake-encrypted-access-"), "code path access envelope mismatch");
    assert(codeSuccess.body.sanitizedResult.tokenExchangePending === false, "code path tokenExchangePending mismatch");
    assert(codeSuccess.body.sanitizedResult.tokenPersistencePending === true, "code path tokenPersistencePending mismatch");
    assertNoSecretLeak(codeSuccess.body, "code path response");

    const spapiSuccess = await request(server)
      .get("/api/imports/amazon-sp-api/oauth/callback")
      .query({
        state: "state-runtime-step130c-spapi",
        spapi_oauth_code: "SPAPI-CODE-RUNTIME-SECRET",
        selling_partner_id: "A-STEP130C-SELLER",
      })
      .expect(200);

    assert(spapiSuccess.body.accepted === true, "spapi path should be accepted");
    assert(spapiSuccess.body.status === "fake_token_exchange_completed", "spapi path status mismatch");
    assert(spapiSuccess.body.spapiOauthCodeUsed === true, "spapi path spapiOauthCodeUsed mismatch");
    assert(spapiSuccess.body.tokenExchangeAttempted === true, "spapi path tokenExchangeAttempted mismatch");
    assert(spapiSuccess.body.tokenExchangeTransportMode === "fake", "spapi path transport mismatch");
    assert(spapiSuccess.body.tokenExchangeHttpCallNow === false, "spapi path must not call token exchange HTTP");
    assert(spapiSuccess.body.tokenPersistenceDatabaseWriteNow === false, "spapi path must not write token DB");
    assert(spapiSuccess.body.realSpApiRequestNow === false, "spapi path must not call real SP-API");
    assert(spapiSuccess.body.sanitizedTokenEnvelope.encryptedRefreshToken.startsWith("fake-encrypted-refresh-"), "spapi path refresh envelope mismatch");
    assert(spapiSuccess.body.sanitizedTokenEnvelope.encryptedAccessToken.startsWith("fake-encrypted-access-"), "spapi path access envelope mismatch");
    assertNoSecretLeak(spapiSuccess.body, "spapi path response");

    const callbackError = await request(server)
      .get("/api/imports/amazon-sp-api/oauth/callback")
      .query({
        error: "access_denied",
        error_description: "user denied",
        state: "state-runtime-step130c",
      })
      .expect(200);

    assert(callbackError.body.accepted === false, "callback error should be semantically rejected");
    assert(callbackError.body.status === "callback_error", "callback error status mismatch");
    assert(callbackError.body.tokenExchangeHttpCallNow === false, "callback error must not call token exchange HTTP");
    assert(callbackError.body.tokenPersistenceDatabaseWriteNow === false, "callback error must not write token DB");
    assert(callbackError.body.realSpApiRequestNow === false, "callback error must not call real SP-API");
    assertNoSecretLeak(callbackError.body, "callback error response");

    const missingState = await request(server)
      .get("/api/imports/amazon-sp-api/oauth/callback")
      .query({
        code: "AUTH-CODE-RUNTIME-SECRET",
        selling_partner_id: "A-STEP130C-SELLER",
      })
      .expect(200);

    assert(missingState.body.accepted === false, "missing state should be semantically rejected");
    assert(missingState.body.status === "missing_state", "missing state status mismatch");
    assert(missingState.body.tokenExchangeHttpCallNow === false, "missing state must not call token exchange HTTP");
    assert(missingState.body.tokenPersistenceDatabaseWriteNow === false, "missing state must not write token DB");
    assert(missingState.body.realSpApiRequestNow === false, "missing state must not call real SP-API");
    assertNoSecretLeak(missingState.body, "missing state response");

    const missingAuthorizationCode = await request(server)
      .get("/api/imports/amazon-sp-api/oauth/callback")
      .query({
        state: "state-runtime-step130c",
        selling_partner_id: "A-STEP130C-SELLER",
      })
      .expect(200);

    assert(missingAuthorizationCode.body.accepted === false, "missing authorization code should be semantically rejected");
    assert(missingAuthorizationCode.body.status === "missing_authorization_code", "missing authorization code status mismatch");
    assert(missingAuthorizationCode.body.statePresent === true, "missing authorization code statePresent mismatch");
    assert(missingAuthorizationCode.body.tokenExchangeHttpCallNow === false, "missing authorization code must not call token exchange HTTP");
    assert(missingAuthorizationCode.body.tokenPersistenceDatabaseWriteNow === false, "missing authorization code must not write token DB");
    assert(missingAuthorizationCode.body.realSpApiRequestNow === false, "missing authorization code must not call real SP-API");
    assertNoSecretLeak(missingAuthorizationCode.body, "missing authorization code response");

    const missingSellingPartnerId = await request(server)
      .get("/api/imports/amazon-sp-api/oauth/callback")
      .query({
        state: "state-runtime-step130c",
        code: "AUTH-CODE-RUNTIME-SECRET",
      })
      .expect(200);

    assert(missingSellingPartnerId.body.accepted === false, "missing selling partner id should be semantically rejected");
    assert(missingSellingPartnerId.body.status === "missing_selling_partner_id", "missing selling partner id status mismatch");
    assert(missingSellingPartnerId.body.statePresent === true, "missing selling partner id statePresent mismatch");
    assert(missingSellingPartnerId.body.authorizationCodePresent === true, "missing selling partner id authorizationCodePresent mismatch");
    assert(missingSellingPartnerId.body.tokenExchangeHttpCallNow === false, "missing selling partner id must not call token exchange HTTP");
    assert(missingSellingPartnerId.body.tokenPersistenceDatabaseWriteNow === false, "missing selling partner id must not write token DB");
    assert(missingSellingPartnerId.body.realSpApiRequestNow === false, "missing selling partner id must not call real SP-API");
    assertNoSecretLeak(missingSellingPartnerId.body, "missing selling partner id response");

    assert(contract.summary.readyForStep130DCallbackRouteFakeTokenExchangeRuntimeRecordHandoff === true, "Step130-D readiness mismatch");
    assert(contract.tokenExchangeHttpCallNow === false, "Step130-C must not call token exchange HTTP");
    assert(contract.tokenPersistenceDatabaseWriteNow === false, "Step130-C must not write token DB");
    assert(contract.realSpApiRequestNow === false, "Step130-C must not call real SP-API");

    console.log("[SMOKE_OK] amazon sp-api oauth callback route fake token exchange runtime smoke contract passed");
    console.log(JSON.stringify({
      ok: true,
      step: "Step130-C",
      files: {
        dto: path.relative(repoRoot, dtoFile).replaceAll(path.sep, "/"),
        smoke: path.relative(repoRoot, __filename).replaceAll(path.sep, "/"),
        controller: path.relative(repoRoot, controllerFile).replaceAll(path.sep, "/"),
        tokenExchangeService: path.relative(repoRoot, tokenExchangeServiceFile).replaceAll(path.sep, "/"),
      },
      acceptedRuntime: {
        codePathStatus: codeSuccess.body.status,
        spapiPathStatus: spapiSuccess.body.status,
        tokenExchangeTransportMode: codeSuccess.body.tokenExchangeTransportMode,
        tokenExchangeHttpCallNow: codeSuccess.body.tokenExchangeHttpCallNow,
        tokenPersistenceDatabaseWriteNow: codeSuccess.body.tokenPersistenceDatabaseWriteNow,
        realSpApiRequestNow: codeSuccess.body.realSpApiRequestNow,
      },
      summary: contract.summary,
    }, null, 2));
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
});
