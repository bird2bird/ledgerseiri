#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiTokenExchangeServiceFakeTransportImplementationContract,
  buildAmazonSpApiTokenExchangeServiceFakeTransportImplementationContract,
} = require("../dist/src/imports/dto/amazon-sp-api-token-exchange-service-fake-transport-implementation-contract.dto");
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
    "AUTH-CODE-SHOULD-NOT-LEAK",
    "CLIENT-SECRET-SHOULD-NOT-LEAK",
    "RAW-ACCESS-SHOULD-NOT-LEAK",
    "RAW-REFRESH-SHOULD-NOT-LEAK",
  ]) {
    assert(!serialized.includes(forbidden), `${label} leaked forbidden value: ${forbidden}`);
  }
}

function assertServiceStaticBoundary(serviceText) {
  assert(!/api\.amazon\.com\/auth\/o2\/token|lwa\.amazon\.com\/auth\/o2\/token/i.test(serviceText), "Step128-B service must not reference LWA token endpoint");
  assert(!/\bfetch\s*\(/.test(serviceText), "Step128-B service must not call fetch");
  assert(!/\baxios\s*\./.test(serviceText), "Step128-B service must not call axios");
  assert(!/\bhttpService\s*\./.test(serviceText), "Step128-B service must not call httpService");
  assert(!/PrismaClient/.test(serviceText), "Step128-B service must not access PrismaClient");
  assert(!/persistEncryptedRefreshCredential\s*\(/.test(serviceText), "Step128-B service must not write refresh credential");
  assert(!/persistEncryptedAccessTokenCache\s*\(/.test(serviceText), "Step128-B service must not write access token cache");
  assert(!/importJob\.create|transaction\.create|inventoryMovement\.create/.test(serviceText), "Step128-B service must not write ledger/import/inventory domain");
}

function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");
  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-token-exchange-service-fake-transport-implementation-contract"] ===
      "node scripts/smoke-amazon-sp-api-token-exchange-service-fake-transport-implementation-contract.js",
    "Step128-B smoke script missing or mismatched",
  );

  const serviceFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-token-exchange.service.ts");
  const moduleFile = path.resolve(apiRoot, "src/imports/imports.module.ts");
  const dtoFile = path.resolve(
    apiRoot,
    "src/imports/dto/amazon-sp-api-token-exchange-service-fake-transport-implementation-contract.dto.ts",
  );

  const serviceText = read(serviceFile);
  const moduleText = read(moduleFile);
  const dtoText = read(dtoFile);

  for (const marker of [
    "AmazonSpApiTokenExchangeService",
    "exchangeAuthorizationCodeDryRunnable",
    "transportMode: 'fake'",
    "tokenExchangeHttpCallNow: false",
    "tokenPersistenceDatabaseWriteNow: false",
    "fake-encrypted-refresh",
    "fake-encrypted-access",
  ]) {
    assert(serviceText.includes(marker), `Step128-B service missing marker: ${marker}`);
  }

  assert(moduleText.includes("AmazonSpApiTokenExchangeService"), "ImportsModule must register AmazonSpApiTokenExchangeService");
  assert(dtoText.includes("AMAZON_SP_API_TOKEN_EXCHANGE_SERVICE_FAKE_TRANSPORT_IMPLEMENTATION_CONTRACT_VERSION"), "Step128-B DTO version missing");

  assertServiceStaticBoundary(serviceText);

  const contract = assertAmazonSpApiTokenExchangeServiceFakeTransportImplementationContract(
    buildAmazonSpApiTokenExchangeServiceFakeTransportImplementationContract(),
  );

  assert(contract.summary.readyForStep128CTokenExchangeServiceRuntimeSmoke === true, "Step128-C readiness mismatch");
  assert(contract.tokenExchangeHttpCallNow === false, "Step128-B must not call token exchange HTTP");
  assert(contract.tokenPersistenceDatabaseWriteNow === false, "Step128-B must not write token DB");
  assert(contract.realSpApiRequestNow === false, "Step128-B must not call real SP-API");

  const service = new AmazonSpApiTokenExchangeService();

  const accepted = service.exchangeAuthorizationCodeDryRunnable({
    state: "signed-state-placeholder",
    authorizationCode: "AUTH-CODE-SHOULD-NOT-LEAK",
    sellingPartnerId: "A-STEP128B-SELLER",
    redirectUri: "https://ledgerseiri.example/api/imports/amazon-sp-api/oauth/callback",
    clientId: "amzn1.application-oa2-client.step128b",
    clientSecretConfigured: true,
    marketplaceId: "A1VC38T7YXB528",
    region: "JP",
    companyId: "company-step128b",
    storeId: "store-step128b",
    dryRun: true,
  });

  assert(accepted.accepted === true, "fake token exchange should accept valid dry-run input");
  assert(accepted.transportMode === "fake", "accepted result transportMode mismatch");
  assert(accepted.tokenExchangeHttpCallNow === false, "accepted result must not call token exchange HTTP");
  assert(accepted.lwaHttpCallNow === false, "accepted result must not call LWA HTTP");
  assert(accepted.tokenPersistenceDatabaseWriteNow === false, "accepted result must not write DB");
  assert(accepted.sanitizedTokenEnvelope.encryptedRefreshToken.startsWith("fake-encrypted-refresh-"), "fake refresh envelope mismatch");
  assert(accepted.sanitizedTokenEnvelope.encryptedAccessToken.startsWith("fake-encrypted-access-"), "fake access envelope mismatch");
  assertNoSecretLeak(accepted, "accepted fake exchange result");

  const missingCode = service.exchangeAuthorizationCodeDryRunnable({
    state: "signed-state-placeholder",
    authorizationCode: "",
    sellingPartnerId: "A-STEP128B-SELLER",
    redirectUri: "https://ledgerseiri.example/api/imports/amazon-sp-api/oauth/callback",
    clientId: "amzn1.application-oa2-client.step128b",
    clientSecretConfigured: true,
    marketplaceId: "A1VC38T7YXB528",
    region: "JP",
    companyId: "company-step128b",
    storeId: "store-step128b",
    dryRun: true,
  });

  assert(missingCode.accepted === false, "missing authorization code should be rejected");
  assert(missingCode.reason === "missing_authorization_code", "missing authorization code reason mismatch");

  const nonDryRun = service.exchangeAuthorizationCodeDryRunnable({
    state: "signed-state-placeholder",
    authorizationCode: "AUTH-CODE-SHOULD-NOT-LEAK",
    sellingPartnerId: "A-STEP128B-SELLER",
    redirectUri: "https://ledgerseiri.example/api/imports/amazon-sp-api/oauth/callback",
    clientId: "amzn1.application-oa2-client.step128b",
    clientSecretConfigured: true,
    marketplaceId: "A1VC38T7YXB528",
    region: "JP",
    companyId: "company-step128b",
    storeId: "store-step128b",
    dryRun: false,
  });

  assert(nonDryRun.accepted === false, "non-dry-run input should be rejected");
  assert(nonDryRun.reason === "dry_run_required", "non-dry-run reason mismatch");
  assertNoSecretLeak(nonDryRun, "non-dry-run rejection result");

  console.log("[SMOKE_OK] amazon sp-api token exchange service fake-transport implementation contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step128-B",
    files: {
      service: path.relative(repoRoot, serviceFile).replaceAll(path.sep, "/"),
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
