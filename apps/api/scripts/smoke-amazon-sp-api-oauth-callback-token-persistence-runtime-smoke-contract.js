#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const request = require("supertest");
const { Test } = require("@nestjs/testing");

const {
  assertAmazonSpApiOauthCallbackTokenPersistenceRuntimeSmokeContract,
  buildAmazonSpApiOauthCallbackTokenPersistenceRuntimeSmokeContract,
} = require("../dist/src/imports/dto/amazon-sp-api-oauth-callback-token-persistence-runtime-smoke-contract.dto");
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

function read(file) {
  return fs.readFileSync(file, "utf8");
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
    "AUTH-CODE-STEP131C-SECRET",
    "SPAPI-CODE-STEP131C-SECRET",
    "REFRESH-STEP131C-SECRET",
    "ACCESS-STEP131C-SECRET",
    "CLIENT-SECRET-STEP131C-SECRET",
    "rawRefreshToken",
    "rawAccessToken",
    "refresh_token",
    "access_token",
    "client_secret",
  ]) {
    assert(!serialized.includes(forbidden), `${label} leaked forbidden secret-like value: ${forbidden}`);
  }
}

function assertTokenPersistenceCompleted(payload, label, expectedSpapiOauthCodeUsed) {
  assert(payload.accepted === true, `${label} should be accepted`);
  assert(payload.status === "token_persistence_completed", `${label} status mismatch`);
  assert(payload.statePresent === true, `${label} statePresent mismatch`);
  assert(payload.authorizationCodePresent === true, `${label} authorizationCodePresent mismatch`);
  assert(payload.spapiOauthCodeUsed === expectedSpapiOauthCodeUsed, `${label} spapiOauthCodeUsed mismatch`);
  assert(payload.sellingPartnerId === "A-STEP131C-SELLER", `${label} seller mismatch`);
  assert(payload.bridgeServiceReady === true, `${label} bridgeServiceReady mismatch`);

  assert(payload.tokenExchangeAttempted === true, `${label} token exchange should be attempted`);
  assert(payload.tokenExchangeTransportMode === "fake", `${label} token exchange transport mismatch`);
  assert(payload.tokenExchangeHttpCallNow === false, `${label} must not call token exchange HTTP`);
  assert(payload.realSpApiRequestNow === false, `${label} must not call real SP-API`);

  assert(payload.tokenPersistenceDatabaseWriteNow === true, `${label} should mark token persistence DB write true`);
  assert(payload.refreshCredentialPersisted === true, `${label} should mark refresh credential persisted`);
  assert(payload.accessTokenCachePersisted === true, `${label} should mark access token cache persisted`);

  assert(payload.sanitizedTokenEnvelope.encryptedRefreshToken.startsWith("fake-encrypted-refresh-"), `${label} encrypted refresh token prefix mismatch`);
  assert(payload.sanitizedTokenEnvelope.encryptedAccessToken.startsWith("fake-encrypted-access-"), `${label} encrypted access token prefix mismatch`);

  assert(payload.sanitizedResult.tokenExchangePending === false, `${label} tokenExchangePending mismatch`);
  assert(payload.sanitizedResult.tokenPersistencePending === false, `${label} tokenPersistencePending mismatch`);
  assert(payload.sanitizedResult.sellingPartnerId === "A-STEP131C-SELLER", `${label} sanitized seller mismatch`);

  assert(payload.persistedConnection.id === "conn-step131c-runtime", `${label} persisted connection id mismatch`);
  assert(payload.persistedConnection.status === "CONNECTED", `${label} persisted connection status mismatch`);
  assert(typeof payload.persistedConnection.connectedAt === "string", `${label} persisted connectedAt missing`);
  assert(typeof payload.persistedConnection.lastTokenRefreshAt === "string", `${label} persisted lastTokenRefreshAt missing`);

  assertNoSecretLeak(payload, `${label} response`);
}

function assertSemanticReject(payload, label, expectedStatus) {
  assert(payload.accepted === false, `${label} should be rejected`);
  assert(payload.status === expectedStatus, `${label} status mismatch`);
  assert(payload.tokenExchangeHttpCallNow === false, `${label} must not call token exchange HTTP`);
  assert(payload.tokenPersistenceDatabaseWriteNow === false, `${label} must not write token DB`);
  assert(payload.realSpApiRequestNow === false, `${label} must not call real SP-API`);
  assertNoSecretLeak(payload, `${label} response`);
}

async function createRuntimeApp(callLog) {
  const serviceMock = {
    detectMonthConflicts: () => {
      throw new Error("ImportsService.detectMonthConflicts should not be called in Step131-C");
    },
  };

  const tokenPersistenceServiceMock = {
    persistEncryptedRefreshCredential: async (input) => {
      callLog.refresh.push(input);
      return {
        id: "conn-step131c-runtime",
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
      };
    },
    persistEncryptedAccessTokenCache: async (input) => {
      callLog.access.push(input);
      return {
        id: "conn-step131c-runtime",
        companyId: input.companyId,
        storeId: input.storeId,
        marketplaceId: input.marketplaceId,
        region: input.region,
        sellingPartnerId: "A-STEP131C-SELLER",
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
      };
    },
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

function assertPersistenceInputs(callLog) {
  assert(callLog.refresh.length === 2, `expected 2 refresh persistence calls, got ${callLog.refresh.length}`);
  assert(callLog.access.length === 2, `expected 2 access persistence calls, got ${callLog.access.length}`);

  for (const input of callLog.refresh) {
    assert(input.companyId === "company-step130b-boundary", "refresh input companyId mismatch");
    assert(input.storeId === "store-step130b-boundary", "refresh input storeId mismatch");
    assert(input.marketplaceId === "A1VC38T7YXB528", "refresh input marketplace mismatch");
    assert(input.region === "JP", "refresh input region mismatch");
    assert(input.sellingPartnerId === "A-STEP131C-SELLER", "refresh input seller mismatch");
    assert(input.appId === "amzn1.application-oa2-client.step130b", "refresh input appId mismatch");
    assert(String(input.encryptedRefreshToken || "").startsWith("fake-encrypted-refresh-"), "refresh input encrypted token prefix mismatch");
    assert(!JSON.stringify(input).includes("AUTH-CODE-STEP131C-SECRET"), "refresh input leaked auth code");
    assert(!JSON.stringify(input).includes("SPAPI-CODE-STEP131C-SECRET"), "refresh input leaked spapi code");
  }

  for (const input of callLog.access) {
    assert(input.companyId === "company-step130b-boundary", "access input companyId mismatch");
    assert(input.storeId === "store-step130b-boundary", "access input storeId mismatch");
    assert(input.marketplaceId === "A1VC38T7YXB528", "access input marketplace mismatch");
    assert(input.region === "JP", "access input region mismatch");
    assert(String(input.encryptedAccessToken || "").startsWith("fake-encrypted-access-"), "access input encrypted token prefix mismatch");
    assert(!JSON.stringify(input).includes("AUTH-CODE-STEP131C-SECRET"), "access input leaked auth code");
    assert(!JSON.stringify(input).includes("SPAPI-CODE-STEP131C-SECRET"), "access input leaked spapi code");
  }
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");
  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-oauth-callback-token-persistence-runtime-smoke-contract"] ===
      "node scripts/smoke-amazon-sp-api-oauth-callback-token-persistence-runtime-smoke-contract.js",
    "Step131-C runtime smoke script missing or mismatched",
  );

  const dtoFile = path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-oauth-callback-token-persistence-runtime-smoke-contract.dto.ts");
  const controllerFile = path.resolve(apiRoot, "src/imports/imports.controller.ts");
  const controllerText = read(controllerFile);

  for (const marker of [
    "AmazonSpApiTokenPersistenceService",
    "amazonSpApiOauthStatePersistenceBridgeService.buildPersistencePlan",
    "amazonSpApiTokenPersistenceService.persistEncryptedRefreshCredential",
    "amazonSpApiTokenPersistenceService.persistEncryptedAccessTokenCache",
    "token_persistence_completed",
    "tokenPersistenceDatabaseWriteNow: true",
    "tokenPersistencePending: false",
  ]) {
    assert(controllerText.includes(marker), `controller missing marker: ${marker}`);
  }

  const contract = assertAmazonSpApiOauthCallbackTokenPersistenceRuntimeSmokeContract(
    buildAmazonSpApiOauthCallbackTokenPersistenceRuntimeSmokeContract(),
  );

  const callLog = { refresh: [], access: [] };
  const app = await createRuntimeApp(callLog);

  try {
    const server = app.getHttpServer();

    const callbackError = await request(server)
      .get("/api/imports/amazon-sp-api/oauth/callback")
      .query({
        error: "access_denied",
        error_description: "buyer denied auth code AUTH-CODE-STEP131C-SECRET",
        state: "state-step131c",
      })
      .expect(200);

    assertSemanticReject(callbackError.body, "callback error", "callback_error");

    const missingState = await request(server)
      .get("/api/imports/amazon-sp-api/oauth/callback")
      .query({
        code: "AUTH-CODE-STEP131C-SECRET",
        selling_partner_id: "A-STEP131C-SELLER",
      })
      .expect(200);

    assertSemanticReject(missingState.body, "missing state", "missing_state");

    const missingAuthorizationCode = await request(server)
      .get("/api/imports/amazon-sp-api/oauth/callback")
      .query({
        state: "state-step131c",
        selling_partner_id: "A-STEP131C-SELLER",
      })
      .expect(200);

    assertSemanticReject(missingAuthorizationCode.body, "missing authorization code", "missing_authorization_code");

    const missingSellingPartnerId = await request(server)
      .get("/api/imports/amazon-sp-api/oauth/callback")
      .query({
        state: "state-step131c",
        code: "AUTH-CODE-STEP131C-SECRET",
      })
      .expect(200);

    assertSemanticReject(missingSellingPartnerId.body, "missing selling partner id", "missing_selling_partner_id");

    assert(callLog.refresh.length === 0, "reject paths must not persist refresh credential");
    assert(callLog.access.length === 0, "reject paths must not persist access token cache");

    const codeSuccess = await request(server)
      .get("/api/imports/amazon-sp-api/oauth/callback")
      .query({
        state: "state-step131c-code",
        code: "AUTH-CODE-STEP131C-SECRET",
        selling_partner_id: "A-STEP131C-SELLER",
      })
      .expect(200);

    assertTokenPersistenceCompleted(codeSuccess.body, "code path", false);

    const spapiSuccess = await request(server)
      .get("/api/imports/amazon-sp-api/oauth/callback")
      .query({
        state: "state-step131c-spapi",
        spapi_oauth_code: "SPAPI-CODE-STEP131C-SECRET",
        selling_partner_id: "A-STEP131C-SELLER",
      })
      .expect(200);

    assertTokenPersistenceCompleted(spapiSuccess.body, "spapi_oauth_code path", true);

    assertPersistenceInputs(callLog);

    console.log("[SMOKE_OK] amazon sp-api oauth callback token persistence runtime smoke contract passed");
    console.log(JSON.stringify({
      ok: true,
      step: "Step131-C",
      files: {
        dto: path.relative(repoRoot, dtoFile).replaceAll(path.sep, "/"),
        smoke: path.relative(repoRoot, __filename).replaceAll(path.sep, "/"),
        controller: path.relative(repoRoot, controllerFile).replaceAll(path.sep, "/"),
      },
      runtime: {
        codePathStatus: codeSuccess.body.status,
        spapiOauthCodePathStatus: spapiSuccess.body.status,
        refreshPersistenceCalls: callLog.refresh.length,
        accessPersistenceCalls: callLog.access.length,
        tokenPersistenceDatabaseWriteNow: codeSuccess.body.tokenPersistenceDatabaseWriteNow,
        tokenPersistencePending: codeSuccess.body.sanitizedResult.tokenPersistencePending,
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
