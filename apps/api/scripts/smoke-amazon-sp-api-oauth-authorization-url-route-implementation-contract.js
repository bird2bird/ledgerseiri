#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOauthAuthorizationUrlRouteImplementationContract,
  buildAmazonSpApiOauthAuthorizationUrlRouteImplementationContract,
} = require("../dist/src/imports/dto/amazon-sp-api-oauth-authorization-url-route-implementation-contract.dto");
const {
  AmazonSpApiOauthAuthorizationUrlService,
} = require("../dist/src/imports/amazon-sp-api-oauth-authorization-url.service");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function assertNoForbiddenValue(payload, label) {
  const serialized = JSON.stringify(payload);
  for (const forbidden of [
    "CLIENT-SECRET-SHOULD-NOT-LEAK",
    "AUTH-CODE-SHOULD-NOT-LEAK",
    "RAW-STATE-JSON-SHOULD-NOT-LEAK",
  ]) {
    assert(!serialized.includes(forbidden), `${label} leaked forbidden value: ${forbidden}`);
  }
}

function assertStaticBoundary(serviceText, controllerText) {
  assert(!/api\.amazon\.com\/auth\/o2\/token|lwa\.amazon\.com\/auth\/o2\/token/i.test(serviceText), "Step129-B service must not reference LWA token endpoint");
  assert(!/\bfetch\s*\(/.test(serviceText), "Step129-B service must not call fetch");
  assert(!/\baxios\s*\./.test(serviceText), "Step129-B service must not call axios");
  assert(!/\bhttpService\s*\./.test(serviceText), "Step129-B service must not call httpService");
  assert(!/PrismaClient/.test(serviceText), "Step129-B service must not use PrismaClient");
  assert(!/persistEncryptedRefreshCredential\s*\(/.test(controllerText), "Step129-B controller must not write refresh credential");
  assert(!/persistEncryptedAccessTokenCache\s*\(/.test(controllerText), "Step129-B controller must not write access token cache");
  assert(!/exchangeAuthorizationCodeDryRunnable/.test(controllerText), "Step129-B must not wire controller to token exchange service");
  assert(!/Redirect\(|res\.redirect|response\.redirect/.test(controllerText), "Step129-B must not real-redirect to Amazon");
}

function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");
  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-oauth-authorization-url-route-implementation-contract"] ===
      "node scripts/smoke-amazon-sp-api-oauth-authorization-url-route-implementation-contract.js",
    "Step129-B smoke script missing or mismatched",
  );

  const serviceFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-oauth-authorization-url.service.ts");
  const controllerFile = path.resolve(apiRoot, "src/imports/imports.controller.ts");
  const moduleFile = path.resolve(apiRoot, "src/imports/imports.module.ts");
  const dtoFile = path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-oauth-authorization-url-route-implementation-contract.dto.ts");

  const serviceText = read(serviceFile);
  const controllerText = read(controllerFile);
  const moduleText = read(moduleFile);
  const dtoText = read(dtoFile);

  for (const marker of [
    "AMAZON_SP_API_OAUTH_AUTHORIZATION_URL_ROUTE_IMPLEMENTATION_CONTRACT_VERSION",
    "readyForStep129CAuthorizationUrlRouteRuntimeSmoke",
    "noOAuthStateDbWrite",
    "noTokenExchangeHttpCall",
    "noRealAmazonRedirect",
  ]) {
    assert(dtoText.includes(marker), `Step129-B DTO missing marker: ${marker}`);
  }

  assert(controllerText.includes("@Get('amazon-sp-api/oauth/authorization-url')"), "Controller must expose authorization-url GET route");
  assert(controllerText.includes("JwtAuthGuard"), "Controller route must use JwtAuthGuard");
  assert(controllerText.includes("amazonSpApiOauthAuthorizationUrlService.buildAuthorizationUrl"), "Controller must call authorization URL service");
  assert(moduleText.includes("AmazonSpApiOauthAuthorizationUrlService"), "ImportsModule must register authorization URL service");

  assertStaticBoundary(serviceText, controllerText);

  const contract = assertAmazonSpApiOauthAuthorizationUrlRouteImplementationContract(
    buildAmazonSpApiOauthAuthorizationUrlRouteImplementationContract(),
  );

  assert(contract.summary.readyForStep129CAuthorizationUrlRouteRuntimeSmoke === true, "Step129-C readiness mismatch");
  assert(contract.oauthStateDatabaseWriteNow === false, "Step129-B must not write OAuth state DB");
  assert(contract.tokenExchangeHttpCallNow === false, "Step129-B must not call token exchange HTTP");
  assert(contract.tokenPersistenceDatabaseWriteNow === false, "Step129-B must not write token DB");
  assert(contract.realAmazonRedirectNow === false, "Step129-B must not redirect to Amazon");

  const service = new AmazonSpApiOauthAuthorizationUrlService();
  const accepted = service.buildAuthorizationUrl({
    companyId: "company-step129b",
    storeId: "store-step129b",
    marketplaceId: "A1VC38T7YXB528",
    region: "JP",
    returnTo: "/ja/app/data/import",
    sandbox: true,
    forceReauthorize: true,
    locale: "ja-JP",
  });

  assert(accepted.ok === true, "valid authorization URL input should be accepted");
  assert(accepted.authorizationUrl.includes("https://sellercentral.amazon.co.jp/apps/authorize/consent"), "authorization URL base mismatch");
  assert(accepted.authorizationUrl.includes("application_id="), "authorization URL missing application_id");
  assert(accepted.authorizationUrl.includes("state="), "authorization URL missing state");
  assert(accepted.authorizationUrl.includes("marketplace_id=A1VC38T7YXB528"), "authorization URL missing marketplace_id");
  assert(accepted.authorizationUrl.includes("region=JP"), "authorization URL missing region");
  assert(accepted.oauthStateDatabaseWriteNow === false, "service must not write OAuth state DB");
  assert(accepted.tokenExchangeHttpCallNow === false, "service must not call token exchange HTTP");
  assert(accepted.tokenPersistenceDatabaseWriteNow === false, "service must not write token DB");
  assert(accepted.realAmazonRedirectNow === false, "service must not redirect");
  assertNoForbiddenValue(accepted, "accepted authorization URL result");

  const missingCompany = service.buildAuthorizationUrl({
    companyId: "",
    storeId: "store-step129b",
    marketplaceId: "A1VC38T7YXB528",
    region: "JP",
  });

  assert(missingCompany.ok === false, "missing company id should be rejected");
  assert(missingCompany.status === "missing_company_id", "missing company id reason mismatch");

  const missingStore = service.buildAuthorizationUrl({
    companyId: "company-step129b",
    storeId: "",
    marketplaceId: "A1VC38T7YXB528",
    region: "JP",
  });

  assert(missingStore.ok === false, "missing store id should be rejected");
  assert(missingStore.status === "missing_store_id", "missing store id reason mismatch");

  console.log("[SMOKE_OK] amazon sp-api oauth authorization URL route implementation contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step129-B",
    files: {
      service: path.relative(repoRoot, serviceFile).replaceAll(path.sep, "/"),
      dto: path.relative(repoRoot, dtoFile).replaceAll(path.sep, "/"),
      smoke: path.relative(repoRoot, __filename).replaceAll(path.sep, "/"),
    },
    acceptedRoute: {
      authorizationUrlPrefix: accepted.authorizationUrl.slice(0, "https://sellercentral.amazon.co.jp/apps/authorize/consent".length),
      stateIssued: accepted.stateIssued,
      stateExpiresAt: accepted.stateExpiresAt,
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
