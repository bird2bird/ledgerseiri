#!/usr/bin/env node
"use strict";

const request = require("supertest");
const { Test } = require("@nestjs/testing");
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

function assertNoSecretLeak(payload, label) {
  const serialized = JSON.stringify(payload);
  for (const forbidden of [
    "AUTH-CODE-SHOULD-NOT-LEAK",
    "SPAPI-CODE-SHOULD-NOT-LEAK",
    "REFRESH-SHOULD-NOT-LEAK",
    "ACCESS-SHOULD-NOT-LEAK",
    "refreshToken",
    "accessToken",
  ]) {
    assert(!serialized.includes(forbidden), `${label} leaked forbidden secret-like value: ${forbidden}`);
  }
}

async function createRuntimeApp() {
  const serviceMock = {
    detectMonthConflicts: () => {
      throw new Error("ImportsService.detectMonthConflicts should not be called in Step127-C");
    },
  };

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

async function main() {
  const app = await createRuntimeApp();

  try {
    const server = app.getHttpServer();

    const callbackError = await request(server)
      .get("/api/imports/amazon-sp-api/oauth/callback")
      .query({
        error: "access_denied",
        error_description: "buyer denied auth code AUTH-CODE-SHOULD-NOT-LEAK",
      })
      .expect(200);

    assert(callbackError.body.accepted === false, "callback error should be rejected");
    assert(callbackError.body.status === "callback_error", "callback error status mismatch");
    assert(callbackError.body.messageRedacted === "Amazon OAuth callback returned an error.", "callback error redacted message mismatch");
    assert(callbackError.body.error === "access_denied", "callback error code mismatch");
    assert(callbackError.body.errorDescriptionPresent === true, "callback error description presence mismatch");
    assert(callbackError.body.tokenExchangeHttpCallNow === false, "callback error should not call token exchange");
    assert(callbackError.body.tokenPersistenceDatabaseWriteNow === false, "callback error should not write DB");
    assertNoSecretLeak(callbackError.body, "callback error response");

    const missingState = await request(server)
      .get("/api/imports/amazon-sp-api/oauth/callback")
      .query({
        code: "AUTH-CODE-SHOULD-NOT-LEAK",
        selling_partner_id: "A-STEP127C-SELLER",
      })
      .expect(200);

    assert(missingState.body.accepted === false, "missing state should be rejected");
    assert(missingState.body.status === "missing_state", "missing state status mismatch");
    assert(missingState.body.messageRedacted === "Amazon OAuth callback is missing required state.", "missing state redacted message mismatch");
    assertNoSecretLeak(missingState.body, "missing state response");

    const missingAuthorizationCode = await request(server)
      .get("/api/imports/amazon-sp-api/oauth/callback")
      .query({
        state: "signed-state-placeholder",
        selling_partner_id: "A-STEP127C-SELLER",
      })
      .expect(200);

    assert(missingAuthorizationCode.body.accepted === false, "missing authorization code should be rejected");
    assert(missingAuthorizationCode.body.status === "missing_authorization_code", "missing authorization code status mismatch");
    assert(missingAuthorizationCode.body.statePresent === true, "missing authorization code statePresent mismatch");
    assertNoSecretLeak(missingAuthorizationCode.body, "missing authorization code response");

    const missingSeller = await request(server)
      .get("/api/imports/amazon-sp-api/oauth/callback")
      .query({
        state: "signed-state-placeholder",
        code: "AUTH-CODE-SHOULD-NOT-LEAK",
      })
      .expect(200);

    assert(missingSeller.body.accepted === false, "missing selling partner should be rejected");
    assert(missingSeller.body.status === "missing_selling_partner_id", "missing selling partner status mismatch");
    assert(missingSeller.body.statePresent === true, "missing selling partner statePresent mismatch");
    assert(missingSeller.body.authorizationCodePresent === true, "missing selling partner authorizationCodePresent mismatch");
    assertNoSecretLeak(missingSeller.body, "missing selling partner response");

    const codeSuccess = await request(server)
      .get("/api/imports/amazon-sp-api/oauth/callback")
      .query({
        state: "signed-state-placeholder",
        code: "AUTH-CODE-SHOULD-NOT-LEAK",
        selling_partner_id: "A-STEP127C-SELLER",
      })
      .expect(200);

    assert(codeSuccess.body.accepted === true, "code success should be accepted");
    assert(
      codeSuccess.body.status === "accepted_for_token_exchange_later" ||
        codeSuccess.body.status === "fake_token_exchange_completed",
      "code success status mismatch",
    );
    assert(codeSuccess.body.statePresent === true, "code success statePresent mismatch");
    assert(codeSuccess.body.authorizationCodePresent === true, "code success authorizationCodePresent mismatch");
    assert(codeSuccess.body.spapiOauthCodeUsed === false, "code success should not mark spapiOauthCodeUsed");
    assert(codeSuccess.body.sellingPartnerId === "A-STEP127C-SELLER", "code success seller mismatch");
    assert(codeSuccess.body.bridgeServiceReady === true, "bridgeServiceReady should be true");
    assert(
      codeSuccess.body.sanitizedResult.tokenExchangePending === true ||
        codeSuccess.body.sanitizedResult.tokenExchangePending === false,
      "code success tokenExchangePending mismatch",
    );
    assert(codeSuccess.body.sanitizedResult.tokenPersistencePending === true, "code success tokenPersistencePending mismatch");
    assert(codeSuccess.body.tokenExchangeHttpCallNow === false, "code success should not call token exchange HTTP");
    assert(codeSuccess.body.tokenPersistenceDatabaseWriteNow === false, "code success should not write token DB");
    assert(codeSuccess.body.realSpApiRequestNow === false, "code success should not call real SP-API");
    if (codeSuccess.body.status === "fake_token_exchange_completed") {
      assert(codeSuccess.body.tokenExchangeAttempted === true, "fake token exchange should be attempted");
      assert(codeSuccess.body.tokenExchangeTransportMode === "fake", "fake token exchange transport mismatch");
      assert(codeSuccess.body.sanitizedTokenEnvelope.encryptedRefreshToken.startsWith("fake-encrypted-refresh-"), "fake refresh envelope prefix mismatch");
      assert(codeSuccess.body.sanitizedTokenEnvelope.encryptedAccessToken.startsWith("fake-encrypted-access-"), "fake access envelope prefix mismatch");
    }
    assertNoSecretLeak(codeSuccess.body, "code success response");

    const spapiCodeSuccess = await request(server)
      .get("/api/imports/amazon-sp-api/oauth/callback")
      .query({
        state: "signed-state-placeholder",
        spapi_oauth_code: "SPAPI-CODE-SHOULD-NOT-LEAK",
        selling_partner_id: "A-STEP127C-SELLER",
      })
      .expect(200);

    assert(spapiCodeSuccess.body.accepted === true, "spapi_oauth_code success should be accepted");
    assert(
      spapiCodeSuccess.body.status === "accepted_for_token_exchange_later" ||
        spapiCodeSuccess.body.status === "fake_token_exchange_completed",
      "spapi_oauth_code success status mismatch",
    );
    assert(spapiCodeSuccess.body.spapiOauthCodeUsed === true, "spapi_oauth_code success flag mismatch");
    assert(spapiCodeSuccess.body.authorizationCodePresent === true, "spapi_oauth_code success authorizationCodePresent mismatch");
    assert(spapiCodeSuccess.body.bridgeServiceReady === true, "spapi_oauth_code bridgeServiceReady should be true");
    if (spapiCodeSuccess.body.status === "fake_token_exchange_completed") {
      assert(spapiCodeSuccess.body.tokenExchangeAttempted === true, "spapi fake token exchange should be attempted");
      assert(spapiCodeSuccess.body.tokenExchangeTransportMode === "fake", "spapi fake token exchange transport mismatch");
    }
    assertNoSecretLeak(spapiCodeSuccess.body, "spapi_oauth_code success response");

    console.log("[SMOKE_OK] amazon sp-api oauth callback route runtime smoke passed");
    console.log(JSON.stringify({
      ok: true,
      step: "Step127-C",
      verified: {
        callbackErrorSanitizedFailure: true,
        missingStateSanitizedFailure: true,
        missingAuthorizationCodeSanitizedFailure: true,
        missingSellingPartnerIdSanitizedFailure: true,
        codeSuccessAcceptedForTokenExchangeLater: true,
        spapiOauthCodeSuccessAcceptedForTokenExchangeLater: true,
        noAuthorizationCodeLeak: true,
        noTokenLeak: true,
        noLwaHttp: true,
        noTokenDbWrite: true,
      },
    }, null, 2));
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
});
