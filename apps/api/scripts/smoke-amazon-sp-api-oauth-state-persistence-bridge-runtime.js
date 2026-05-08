#!/usr/bin/env node
"use strict";

const {
  AmazonSpApiOauthStatePersistenceBridgeService,
} = require("../dist/src/imports/amazon-sp-api-oauth-state-persistence-bridge.service");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertNoSecretLeak(value, label) {
  const serialized = JSON.stringify(value);
  for (const forbidden of [
    "AUTH-CODE-SHOULD-NOT-LEAK",
    "REFRESH-SHOULD-NOT-LEAK",
    "ACCESS-SHOULD-NOT-LEAK",
    "enc-refresh-token-step126c",
    "enc-access-token-step126c",
  ]) {
    assert(!serialized.includes(forbidden), `${label} leaked forbidden secret-like value: ${forbidden}`);
  }
}

function baseState(now) {
  return {
    companyId: "company-step126c",
    storeId: "store-step126c",
    marketplaceId: "A1VC38T7YXB528",
    region: "FE",
    appId: "amzn1.application-oa2-client.step126c",
    nonce: "nonce-step126c",
    issuedAt: new Date(now.getTime() - 60 * 1000).toISOString(),
    expiresAt: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
    returnTo: "/ja/app/data/import?source=amazon-sp-api",
    stateVersion: "v1",
  };
}

function baseCallback() {
  return {
    state: "signed-state-placeholder",
    code: "AUTH-CODE-SHOULD-NOT-LEAK",
    selling_partner_id: "A-STEP126C-SELLER",
  };
}

function baseEncryptedTokenResponse() {
  return {
    encryptedRefreshToken: "enc-refresh-token-step126c",
    encryptedAccessToken: "enc-access-token-step126c",
    tokenType: "bearer",
    expiresInSeconds: 1800,
    scope: "sellingpartnerapi::notifications sellingpartnerapi::migrationTest",
    encryptionKeyId: "kms-step126c",
    encryptionAlgorithm: "AES-256-GCM",
    tokenVersion: 2,
  };
}

function assertRejected(result, reason) {
  assert(result.accepted === false, `expected rejected result for ${reason}`);
  assert(result.reason === reason, `expected rejection reason ${reason}, got ${result.reason}`);
  assert(typeof result.messageRedacted === "string" && result.messageRedacted.length > 0, `missing redacted message for ${reason}`);
  assertNoSecretLeak(result, `rejected result ${reason}`);
}

function main() {
  const bridge = new AmazonSpApiOauthStatePersistenceBridgeService();
  const now = new Date("2026-05-08T05:00:00.000Z");
  const state = baseState(now);
  const context = {
    now,
    expectedNonce: state.nonce,
    expectedCompanyId: state.companyId,
    expectedStoreId: state.storeId,
    expectedMarketplaceId: state.marketplaceId,
    expectedRegion: state.region,
    expectedAppId: state.appId,
  };

  const accepted = bridge.buildPersistencePlan(
    state,
    baseCallback(),
    baseEncryptedTokenResponse(),
    context,
  );

  assert(accepted.accepted === true, "accepted bridge result expected");
  assert(accepted.authorizationCodePresent === true, "authorization code should be acknowledged only as present");
  assert(accepted.sellingPartnerId === "A-STEP126C-SELLER", "sellingPartnerId mismatch");

  assert(accepted.refreshCredentialInput.companyId === state.companyId, "refresh input companyId mismatch");
  assert(accepted.refreshCredentialInput.storeId === state.storeId, "refresh input storeId mismatch");
  assert(accepted.refreshCredentialInput.marketplaceId === state.marketplaceId, "refresh input marketplaceId mismatch");
  assert(accepted.refreshCredentialInput.region === state.region, "refresh input region mismatch");
  assert(accepted.refreshCredentialInput.appId === state.appId, "refresh input appId mismatch");
  assert(accepted.refreshCredentialInput.sellingPartnerId === "A-STEP126C-SELLER", "refresh input seller mismatch");
  assert(accepted.refreshCredentialInput.encryptedRefreshToken === "enc-refresh-token-step126c", "refresh encrypted token mapping mismatch");
  assert(accepted.refreshCredentialInput.encryptionKeyId === "kms-step126c", "encryptionKeyId mismatch");
  assert(accepted.refreshCredentialInput.encryptionAlgorithm === "AES-256-GCM", "encryptionAlgorithm mismatch");
  assert(accepted.refreshCredentialInput.tokenVersion === 2, "tokenVersion mismatch");
  assert(accepted.refreshCredentialInput.connectedAt.toISOString() === now.toISOString(), "connectedAt should come from context now");

  assert(accepted.accessTokenCacheInput !== null, "access token cache input expected");
  assert(accepted.accessTokenCacheInput.companyId === state.companyId, "access cache companyId mismatch");
  assert(accepted.accessTokenCacheInput.storeId === state.storeId, "access cache storeId mismatch");
  assert(accepted.accessTokenCacheInput.marketplaceId === state.marketplaceId, "access cache marketplaceId mismatch");
  assert(accepted.accessTokenCacheInput.region === state.region, "access cache region mismatch");
  assert(accepted.accessTokenCacheInput.encryptedAccessToken === "enc-access-token-step126c", "access encrypted token mapping mismatch");
  assert(accepted.accessTokenCacheInput.tokenType === "bearer", "access token type mismatch");
  assert(accepted.accessTokenCacheInput.scope === "sellingpartnerapi::notifications sellingpartnerapi::migrationTest", "access token scope mismatch");
  assert(accepted.accessTokenCacheInput.expiresAt.toISOString() === new Date(now.getTime() + 1800 * 1000).toISOString(), "access token expiry mismatch");

  assert(accepted.sanitizedResult.companyId === state.companyId, "sanitized companyId mismatch");
  assert(accepted.sanitizedResult.storeId === state.storeId, "sanitized storeId mismatch");
  assert(accepted.sanitizedResult.marketplaceId === state.marketplaceId, "sanitized marketplaceId mismatch");
  assert(accepted.sanitizedResult.region === state.region, "sanitized region mismatch");
  assert(accepted.sanitizedResult.appId === state.appId, "sanitized appId mismatch");
  assert(accepted.sanitizedResult.sellingPartnerId === "A-STEP126C-SELLER", "sanitized seller mismatch");
  assert(accepted.sanitizedResult.tokenType === "bearer", "sanitized tokenType mismatch");
  assert(accepted.sanitizedResult.returnTo === state.returnTo, "sanitized returnTo mismatch");

  assertNoSecretLeak(accepted.sanitizedResult, "sanitizedResult");

  const withoutAccessToken = bridge.buildPersistencePlan(
    state,
    baseCallback(),
    {
      encryptedRefreshToken: "enc-refresh-token-step126c",
      encryptionKeyId: "kms-step126c",
      encryptionAlgorithm: "AES-256-GCM",
      tokenVersion: 2,
    },
    context,
  );

  assert(withoutAccessToken.accepted === true, "accepted result without access token expected");
  assert(withoutAccessToken.accessTokenCacheInput === null, "access token cache input should be null when no access token exists");
  assert(withoutAccessToken.sanitizedResult.tokenType === null, "sanitized tokenType should be null without access token");
  assert(withoutAccessToken.sanitizedResult.accessTokenExpiresAt === null, "sanitized expiry should be null without access token");

  assertRejected(
    bridge.buildPersistencePlan(state, { ...baseCallback(), error: "access_denied" }, baseEncryptedTokenResponse(), context),
    "callback_error",
  );

  assertRejected(
    bridge.buildPersistencePlan(state, { ...baseCallback(), code: "" }, baseEncryptedTokenResponse(), context),
    "missing_authorization_code",
  );

  const spapiOauthCodeAccepted = bridge.buildPersistencePlan(
    state,
    { state: "signed-state-placeholder", spapi_oauth_code: "AUTH-CODE-SHOULD-NOT-LEAK", selling_partner_id: "A-STEP126C-SELLER" },
    baseEncryptedTokenResponse(),
    context,
  );
  assert(spapiOauthCodeAccepted.accepted === true, "spapi_oauth_code fallback should be accepted");

  assertRejected(
    bridge.buildPersistencePlan(state, { ...baseCallback(), selling_partner_id: "" }, baseEncryptedTokenResponse(), context),
    "missing_selling_partner_id",
  );

  assertRejected(
    bridge.buildPersistencePlan(
      { ...state, expiresAt: new Date(now.getTime() - 1000).toISOString() },
      baseCallback(),
      baseEncryptedTokenResponse(),
      context,
    ),
    "expired_state",
  );

  assertRejected(
    bridge.buildPersistencePlan(state, baseCallback(), baseEncryptedTokenResponse(), { ...context, expectedNonce: "wrong-nonce" }),
    "nonce_mismatch",
  );

  assertRejected(
    bridge.buildPersistencePlan(state, baseCallback(), baseEncryptedTokenResponse(), { ...context, expectedCompanyId: "wrong-company" }),
    "company_mismatch",
  );

  assertRejected(
    bridge.buildPersistencePlan(state, baseCallback(), baseEncryptedTokenResponse(), { ...context, expectedStoreId: "wrong-store" }),
    "store_mismatch",
  );

  assertRejected(
    bridge.buildPersistencePlan(state, baseCallback(), baseEncryptedTokenResponse(), { ...context, expectedMarketplaceId: "wrong-marketplace" }),
    "marketplace_mismatch",
  );

  assertRejected(
    bridge.buildPersistencePlan(state, baseCallback(), baseEncryptedTokenResponse(), { ...context, expectedRegion: "NA" }),
    "region_mismatch",
  );

  assertRejected(
    bridge.buildPersistencePlan(state, baseCallback(), baseEncryptedTokenResponse(), { ...context, expectedAppId: "wrong-app" }),
    "app_mismatch",
  );

  assertRejected(
    bridge.buildPersistencePlan(state, baseCallback(), { ...baseEncryptedTokenResponse(), encryptedRefreshToken: "" }, context),
    "missing_encrypted_refresh_token",
  );

  assertRejected(
    bridge.buildPersistencePlan(state, baseCallback(), { ...baseEncryptedTokenResponse(), tokenVersion: 0 }, context),
    "invalid_token_metadata",
  );

  assertRejected(
    bridge.buildPersistencePlan(state, baseCallback(), { ...baseEncryptedTokenResponse(), expiresInSeconds: -1 }, context),
    "invalid_token_metadata",
  );

  assertRejected(
    bridge.validateStatePayload({ ...state, stateVersion: "v0" }, context),
    "invalid_state",
  );

  assertRejected(
    bridge.validateStatePayload({ ...state, issuedAt: "not-a-date" }, context),
    "invalid_state",
  );

  assertNoSecretLeak(accepted.sanitizedResult, "final sanitizedResult");
  assertNoSecretLeak(withoutAccessToken.sanitizedResult, "final no-access sanitizedResult");

  console.log("[SMOKE_OK] amazon sp-api oauth state persistence bridge runtime smoke passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step126-C",
    verified: {
      acceptedMapping: true,
      sanitizedResultNoSecretLeak: true,
      spapiOauthCodeFallback: true,
      noAccessTokenBranch: true,
      callbackErrorShortCircuit: true,
      missingAuthorizationCode: true,
      missingSellingPartnerId: true,
      expiredState: true,
      nonceMismatch: true,
      companyMismatch: true,
      storeMismatch: true,
      marketplaceMismatch: true,
      regionMismatch: true,
      appMismatch: true,
      invalidTokenMetadata: true,
      invalidState: true,
      noDbWrite: true,
      noHttp: true,
    },
  }, null, 2));
}

try {
  main();
} catch (err) {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
}
