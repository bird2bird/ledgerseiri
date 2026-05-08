#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOauthAuthorizationUrlRouteRuntimeSmokeContract,
  buildAmazonSpApiOauthAuthorizationUrlRouteRuntimeSmokeContract,
} = require("../dist/src/imports/dto/amazon-sp-api-oauth-authorization-url-route-runtime-smoke-contract.dto");
const {
  AmazonSpApiOauthAuthorizationUrlService,
} = require("../dist/src/imports/amazon-sp-api-oauth-authorization-url.service");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function assertNoSecretLeak(payload, label) {
  const serialized = JSON.stringify(payload);
  for (const forbidden of [
    "CLIENT-SECRET-RUNTIME-SHOULD-NOT-LEAK",
    "AUTH-CODE-RUNTIME-SHOULD-NOT-LEAK",
    "RAW-STATE-JSON-RUNTIME-SHOULD-NOT-LEAK",
    "refresh_token",
    "access_token",
  ]) {
    assert(!serialized.includes(forbidden), `${label} leaked forbidden value: ${forbidden}`);
  }
}

function assertRejected(service, input, status) {
  const result = service.buildAuthorizationUrl(input);
  assert(result.ok === false, `${status} should be rejected`);
  assert(result.status === status, `${status} rejection status mismatch: ${result.status}`);
  assertNoSecretLeak(result, `${status} rejection`);
  return result;
}

function assertStaticBoundary(serviceText, controllerText, moduleText) {
  assert(controllerText.includes("@UseGuards(JwtAuthGuard)"), "authorization-url route must remain guarded");
  assert(controllerText.includes("@Get('amazon-sp-api/oauth/authorization-url')"), "authorization-url GET route missing");
  assert(controllerText.includes("amazonSpApiOauthAuthorizationUrlService.buildAuthorizationUrl"), "controller must call authorization URL service");
  assert(moduleText.includes("AmazonSpApiOauthAuthorizationUrlService"), "module must register authorization URL service");

  assert(!/api\.amazon\.com\/auth\/o2\/token|lwa\.amazon\.com\/auth\/o2\/token/i.test(serviceText + controllerText), "Step129-C must not reference LWA token endpoint");
  assert(!/\bfetch\s*\(/.test(serviceText + controllerText), "Step129-C must not call fetch");
  assert(!/\baxios\s*\./.test(serviceText + controllerText), "Step129-C must not call axios");
  assert(!/\bhttpService\s*\./.test(serviceText + controllerText), "Step129-C must not call httpService");
  assert(!/PrismaClient/.test(serviceText), "Step129-C service must not use PrismaClient");
  assert(!/persistEncryptedRefreshCredential\s*\(/.test(controllerText + serviceText), "Step129-C must not write refresh credential");
  assert(!/persistEncryptedAccessTokenCache\s*\(/.test(controllerText + serviceText), "Step129-C must not write access token cache");
  assert(
    !/exchangeAuthorizationCodeDryRunnable/.test(controllerText) ||
      /fake_token_exchange_completed/.test(controllerText),
    "Authorization URL phase regression allows Step130-B fake callback token exchange wiring only when fake completion status is present",
  );
  assert(!/Redirect\(|res\.redirect|response\.redirect/.test(controllerText), "Step129-C must not redirect to Amazon");
}

function decodeBase64Url(value) {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");
  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-oauth-authorization-url-route-runtime-smoke-contract"] ===
      "node scripts/smoke-amazon-sp-api-oauth-authorization-url-route-runtime-smoke-contract.js",
    "Step129-C runtime smoke script missing or mismatched",
  );

  const serviceFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-oauth-authorization-url.service.ts");
  const controllerFile = path.resolve(apiRoot, "src/imports/imports.controller.ts");
  const moduleFile = path.resolve(apiRoot, "src/imports/imports.module.ts");
  const dtoFile = path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-oauth-authorization-url-route-runtime-smoke-contract.dto.ts");

  const serviceText = read(serviceFile);
  const controllerText = read(controllerFile);
  const moduleText = read(moduleFile);
  const dtoText = read(dtoFile);

  for (const marker of [
    "AMAZON_SP_API_OAUTH_AUTHORIZATION_URL_ROUTE_RUNTIME_SMOKE_CONTRACT_VERSION",
    "validServiceInputAccepted",
    "authorizationUrlContainsSellerCentralConsentBase",
    "readyForStep129DAuthorizationUrlRouteRuntimeRecordHandoff",
  ]) {
    assert(dtoText.includes(marker), `Step129-C DTO missing marker: ${marker}`);
  }

  assertStaticBoundary(serviceText, controllerText, moduleText);

  const contract = assertAmazonSpApiOauthAuthorizationUrlRouteRuntimeSmokeContract(
    buildAmazonSpApiOauthAuthorizationUrlRouteRuntimeSmokeContract(),
  );

  const service = new AmazonSpApiOauthAuthorizationUrlService();
  const accepted = service.buildAuthorizationUrl({
    companyId: "company-step129c",
    storeId: "store-step129c",
    marketplaceId: "A1VC38T7YXB528",
    region: "JP",
    returnTo: "/ja/app/data/import",
    sandbox: true,
    forceReauthorize: true,
    locale: "ja-JP",
  });

  assert(accepted.ok === true, "valid service input should be accepted");
  assert(accepted.authorizationUrl.startsWith("https://sellercentral.amazon.co.jp/apps/authorize/consent"), "authorization URL base mismatch");
  assert(accepted.authorizationUrl.includes("application_id="), "authorization URL missing application_id");
  assert(accepted.authorizationUrl.includes("state="), "authorization URL missing state");
  assert(accepted.authorizationUrl.includes("version=beta"), "authorization URL missing version");
  assert(accepted.authorizationUrl.includes("marketplace_id=A1VC38T7YXB528"), "authorization URL missing marketplace_id");
  assert(accepted.authorizationUrl.includes("region=JP"), "authorization URL missing region");
  assert(accepted.authorizationUrl.includes("redirect_uri="), "authorization URL missing redirect_uri");
  assert(accepted.oauthStateDatabaseWriteNow === false, "runtime must not write OAuth state DB");
  assert(accepted.tokenExchangeHttpCallNow === false, "runtime must not call token exchange HTTP");
  assert(accepted.tokenPersistenceDatabaseWriteNow === false, "runtime must not write token DB");
  assert(accepted.realAmazonRedirectNow === false, "runtime must not redirect to Amazon");
  assert(accepted.realSpApiRequestNow === false, "runtime must not call real SP-API");
  assertNoSecretLeak(accepted, "accepted authorization URL result");

  const parsed = new URL(accepted.authorizationUrl);
  const state = parsed.searchParams.get("state");
  assert(state, "state query parameter missing");
  assert(/^[A-Za-z0-9_-]+$/.test(state), "state must look base64url encoded");
  const decodedState = JSON.parse(decodeBase64Url(state));

  assert(decodedState.version === "step129b-fake-state-v1", "decoded state version mismatch");
  assert(decodedState.companyId === "company-step129c", "decoded state company mismatch");
  assert(decodedState.storeId === "store-step129c", "decoded state store mismatch");
  assert(decodedState.marketplaceId === "A1VC38T7YXB528", "decoded state marketplace mismatch");
  assert(decodedState.region === "JP", "decoded state region mismatch");
  assert(decodedState.redirectUri === accepted.redirectUri, "decoded state redirectUri mismatch");
  assert(typeof decodedState.nonce === "string" && decodedState.nonce.length >= 8, "decoded state nonce missing");
  assert(typeof decodedState.expiresAt === "string", "decoded state expiresAt missing");

  assertRejected(service, {
    companyId: "",
    storeId: "store-step129c",
    marketplaceId: "A1VC38T7YXB528",
    region: "JP",
  }, "missing_company_id");

  assertRejected(service, {
    companyId: "company-step129c",
    storeId: "",
    marketplaceId: "A1VC38T7YXB528",
    region: "JP",
  }, "missing_store_id");

  assertRejected(service, {
    companyId: "company-step129c",
    storeId: "store-step129c",
    marketplaceId: "",
    region: "JP",
  }, "missing_marketplace_id");

  assertRejected(service, {
    companyId: "company-step129c",
    storeId: "store-step129c",
    marketplaceId: "A1VC38T7YXB528",
    region: "",
  }, "missing_region");

  assert(contract.summary.readyForStep129DAuthorizationUrlRouteRuntimeRecordHandoff === true, "Step129-D readiness mismatch");
  assert(contract.oauthStateDatabaseWriteNow === false, "Step129-C must not write OAuth state DB");
  assert(contract.tokenExchangeHttpCallNow === false, "Step129-C must not call token exchange HTTP");
  assert(contract.tokenPersistenceDatabaseWriteNow === false, "Step129-C must not write token DB");
  assert(contract.realAmazonRedirectNow === false, "Step129-C must not redirect to Amazon");
  assert(contract.realSpApiRequestNow === false, "Step129-C must not call real SP-API");

  console.log("[SMOKE_OK] amazon sp-api oauth authorization URL route runtime smoke contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step129-C",
    files: {
      dto: path.relative(repoRoot, dtoFile).replaceAll(path.sep, "/"),
      smoke: path.relative(repoRoot, __filename).replaceAll(path.sep, "/"),
      service: path.relative(repoRoot, serviceFile).replaceAll(path.sep, "/"),
    },
    acceptedRuntime: {
      authorizationUrlPrefix: accepted.authorizationUrl.slice(0, "https://sellercentral.amazon.co.jp/apps/authorize/consent".length),
      stateIssued: accepted.stateIssued,
      stateExpiresAt: accepted.stateExpiresAt,
      marketplaceId: accepted.marketplaceId,
      region: accepted.region,
      tokenExchangeHttpCallNow: accepted.tokenExchangeHttpCallNow,
      tokenPersistenceDatabaseWriteNow: accepted.tokenPersistenceDatabaseWriteNow,
      realAmazonRedirectNow: accepted.realAmazonRedirectNow,
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
