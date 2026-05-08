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
const {
  AmazonSpApiTokenPersistenceService,
} = require("../dist/src/imports/amazon-sp-api-token-persistence.service");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertNoRawTokenFieldLeak(payload, label) {
  const serialized = JSON.stringify(payload);

  for (const forbiddenPattern of [
    /"refreshToken"\s*:/i,
    /"accessToken"\s*:/i,
    /"refresh_token"\s*:/i,
    /"access_token"\s*:/i,
    /"clientSecret"\s*:/i,
    /"client_secret"\s*:/i,
    /"authorizationCode"\s*:/i,
    /"authorization_code"\s*:/i,
    /"rawRefreshToken"\s*:/i,
    /"rawAccessToken"\s*:/i,
  ]) {
    assert(!forbiddenPattern.test(serialized), `${label} leaked forbidden raw token/code field: ${forbiddenPattern}`);
  }
}

function assertNoSecretLeak(payload, label) {
  assertNoRawTokenFieldLeak(payload, label);

  const serialized = JSON.stringify(payload);
  for (const forbidden of [
    "AUTH-CODE-SHOULD-NOT-LEAK",
    "SPAPI-CODE-SHOULD-NOT-LEAK",
    "REFRESH-SHOULD-NOT-LEAK",
    "ACCESS-SHOULD-NOT-LEAK",
    "CLIENT-SECRET-SHOULD-NOT-LEAK",
    "rawRefreshToken",
    "rawAccessToken",
    "refresh_token",
    "access_token",
    "client_secret",
  ]) {
    assert(!serialized.includes(forbidden), `${label} leaked forbidden secret-like value: ${forbidden}`);
  }
}

function assertAcceptedCallbackSuccess(payload, label, expectedSpapiOauthCodeUsed) {
  assert(payload.accepted === true, `${label} should be accepted`);
  assert(
    payload.status === "accepted_for_token_exchange_later" ||
      payload.status === "fake_token_exchange_completed" ||
      payload.status === "token_persistence_completed",
    `${label} status mismatch`,
  );

  assert(payload.statePresent === true, `${label} statePresent mismatch`);
  assert(payload.authorizationCodePresent === true, `${label} authorizationCodePresent mismatch`);
  assert(payload.spapiOauthCodeUsed === expectedSpapiOauthCodeUsed, `${label} spapiOauthCodeUsed mismatch`);
  assert(payload.sellingPartnerId === "A-STEP127C-SELLER", `${label} seller mismatch`);
  assert(payload.bridgeServiceReady === true, `${label} bridgeServiceReady mismatch`);
  assert(payload.tokenExchangeHttpCallNow === false, `${label} must not call token exchange HTTP`);
  assert(payload.realSpApiRequestNow === false, `${label} must not call real SP-API`);

  if (payload.status === "accepted_for_token_exchange_later") {
    assert(payload.sanitizedResult.tokenExchangePending === true, `${label} tokenExchangePending mismatch`);
    assert(payload.sanitizedResult.tokenPersistencePending === true, `${label} tokenPersistencePending mismatch`);
    assert(payload.tokenPersistenceDatabaseWriteNow === false, `${label} token persistence DB flag mismatch`);
  }

  if (payload.status === "fake_token_exchange_completed") {
    assert(payload.tokenExchangeAttempted === true, `${label} fake token exchange should be attempted`);
    assert(payload.tokenExchangeTransportMode === "fake", `${label} fake token exchange transport mismatch`);
    assert(payload.sanitizedTokenEnvelope.encryptedRefreshToken.startsWith("fake-encrypted-refresh-"), `${label} fake refresh envelope prefix mismatch`);
    assert(payload.sanitizedTokenEnvelope.encryptedAccessToken.startsWith("fake-encrypted-access-"), `${label} fake access envelope prefix mismatch`);
    assert(payload.sanitizedResult.tokenExchangePending === false, `${label} tokenExchangePending mismatch`);
    assert(payload.sanitizedResult.tokenPersistencePending === true, `${label} tokenPersistencePending mismatch`);
    assert(payload.tokenPersistenceDatabaseWriteNow === false, `${label} token persistence DB flag mismatch`);
  }

  if (payload.status === "token_persistence_completed") {
    assert(payload.tokenExchangeAttempted === true, `${label} token exchange should be attempted`);
    assert(payload.tokenExchangeTransportMode === "fake", `${label} token exchange transport mismatch`);
    assert(payload.sanitizedTokenEnvelope.encryptedRefreshToken.startsWith("fake-encrypted-refresh-"), `${label} persisted refresh envelope prefix mismatch`);
    assert(payload.sanitizedTokenEnvelope.encryptedAccessToken.startsWith("fake-encrypted-access-"), `${label} persisted access envelope prefix mismatch`);
    assert(payload.tokenPersistenceDatabaseWriteNow === true, `${label} should mark token persistence DB write true`);
    assert(payload.refreshCredentialPersisted === true, `${label} should mark refresh credential persisted`);
    assert(payload.accessTokenCachePersisted === true, `${label} should mark access token cache persisted`);
    assert(payload.sanitizedResult.tokenExchangePending === false, `${label} tokenExchangePending mismatch`);
    assert(payload.sanitizedResult.tokenPersistencePending === false, `${label} should clear token persistence pending`);
    assert(payload.persistedConnection.id, `${label} persisted connection id missing`);
    assert(payload.persistedConnection.status === "CONNECTED", `${label} persisted connection status mismatch`);
  }

  assertNoSecretLeak(payload, `${label} response`);
}

async function createRuntimeApp() {
  const serviceMock = {
    detectMonthConflicts: () => {
      throw new Error("ImportsService.detectMonthConflicts should not be called in Step127-C");
    },
  };

  const tokenPersistenceServiceMock = {
    persistEncryptedRefreshCredential: async (input) => ({
      id: "conn-step127c-runtime",
      companyId: input.companyId,
      storeId: input.storeId,
      marketplaceId: input.marketplaceId,
      region: input.region,
      sellingPartnerId: input.sellingPartnerId,
      appId: input.appId,
      status: "CONNECTED",
      connectedAt: input.connectedAt ?? new Date(),
      revokedAt: null,
      lastTokenRefreshAt: null,
      lastHealthCheckAt: null,
      lastSyncAt: null,
      lastErrorCode: null,
      lastErrorMessageRedacted: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    persistEncryptedAccessTokenCache: async (input) => ({
      id: "conn-step127c-runtime",
      companyId: input.companyId,
      storeId: input.storeId,
      marketplaceId: input.marketplaceId,
      region: input.region,
      sellingPartnerId: "A-STEP127C-SELLER",
      appId: "amzn1.application-oa2-client.step130b",
      status: "CONNECTED",
      connectedAt: new Date(),
      revokedAt: null,
      lastTokenRefreshAt: new Date(),
      lastHealthCheckAt: null,
      lastSyncAt: null,
      lastErrorCode: null,
      lastErrorMessageRedacted: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  };

  const moduleRef = await Test.createTestingModule({
    controllers: [ImportsController],
    providers: [
      { provide: ImportsService, useValue: serviceMock },
      AmazonSpApiOauthStatePersistenceBridgeService,
      AmazonSpApiOauthAuthorizationUrlService,
      AmazonSpApiTokenExchangeService,
      { provide: AmazonSpApiTokenPersistenceService, useValue: tokenPersistenceServiceMock },
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

    assertAcceptedCallbackSuccess(codeSuccess.body, "code success", false);

    const spapiCodeSuccess = await request(server)
      .get("/api/imports/amazon-sp-api/oauth/callback")
      .query({
        state: "signed-state-placeholder",
        spapi_oauth_code: "SPAPI-CODE-SHOULD-NOT-LEAK",
        selling_partner_id: "A-STEP127C-SELLER",
      })
      .expect(200);

    assertAcceptedCallbackSuccess(spapiCodeSuccess.body, "spapi_oauth_code success", true);

    console.log("[SMOKE_OK] amazon sp-api oauth callback route runtime smoke passed");
    console.log(JSON.stringify({
      ok: true,
      step: "Step127-C",
      verified: {
        callbackErrorSanitizedFailure: true,
        missingStateSanitizedFailure: true,
        missingAuthorizationCodeSanitizedFailure: true,
        missingSellingPartnerIdSanitizedFailure: true,
        codeSuccessPhaseAware: true,
        spapiOauthCodeSuccessPhaseAware: true,
        tokenPersistenceCompletedAccepted: true,
        noAuthorizationCodeLeak: true,
        noRawTokenLeak: true,
        noLwaHttp: true,
        noRealSpApi: true,
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
