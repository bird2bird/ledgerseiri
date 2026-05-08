#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOauthStatePersistenceBridgeImplementationContract,
  buildAmazonSpApiOauthStatePersistenceBridgeImplementationContract,
} = require("../dist/src/imports/dto/amazon-sp-api-oauth-state-persistence-bridge-implementation-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function extractModuleArrayBlock(moduleText, key) {
  const afterKey = moduleText.split(`${key}:`, 2)[1] || "";
  const start = afterKey.indexOf("[");
  if (start < 0) return "";

  let depth = 0;
  for (let i = start; i < afterKey.length; i += 1) {
    const ch = afterKey[i];
    if (ch === "[") depth += 1;
    if (ch === "]") {
      depth -= 1;
      if (depth === 0) return afterKey.slice(start, i + 1);
    }
  }

  return "";
}

function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");
  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-oauth-state-persistence-bridge-implementation-contract"] ===
      "node scripts/smoke-amazon-sp-api-oauth-state-persistence-bridge-implementation-contract.js",
    "Step126-B npm script missing or mismatched",
  );

  const bridgeFile = path.resolve(apiRoot, "src/imports/amazon-sp-api-oauth-state-persistence-bridge.service.ts");
  const moduleFile = path.resolve(apiRoot, "src/imports/imports.module.ts");
  const controllerFile = path.resolve(apiRoot, "src/imports/imports.controller.ts");

  const bridgeText = read(bridgeFile);
  const moduleText = read(moduleFile);
  const controllerText = fs.existsSync(controllerFile) ? read(controllerFile) : "";

  for (const marker of [
    "export class AmazonSpApiOauthStatePersistenceBridgeService",
    "buildPersistencePlan",
    "validateStatePayload",
    "AmazonSpApiOauthBridgeStatePayload",
    "AmazonSpApiOauthBridgeCallbackQuery",
    "AmazonSpApiOauthBridgeEncryptedTokenResponse",
    "refreshCredentialInput",
    "accessTokenCacheInput",
    "sanitizedResult",
    "missing_authorization_code",
    "missing_selling_partner_id",
    "expired_state",
    "nonce_mismatch",
    "company_mismatch",
    "store_mismatch",
    "marketplace_mismatch",
    "region_mismatch",
    "app_mismatch",
    "encryptedRefreshToken",
    "encryptedAccessToken",
    "redactMessage",
  ]) {
    assert(bridgeText.includes(marker), `bridge service missing marker: ${marker}`);
  }

  for (const marker of [
    "AmazonSpApiOauthStatePersistenceBridgeService",
    "providers: [",
    "exports:",
  ]) {
    assert(moduleText.includes(marker), `ImportsModule missing marker: ${marker}`);
  }

  const moduleProvidersBlock = extractModuleArrayBlock(moduleText, "providers");
  const moduleExportsBlock = extractModuleArrayBlock(moduleText, "exports");

  assert(
    moduleProvidersBlock.includes("AmazonSpApiOauthStatePersistenceBridgeService"),
    "ImportsModule providers must include AmazonSpApiOauthStatePersistenceBridgeService",
  );
  assert(
    moduleExportsBlock.includes("AmazonSpApiTokenPersistenceService"),
    "ImportsModule must continue exporting AmazonSpApiTokenPersistenceService",
  );
  assert(
    moduleExportsBlock.includes("AmazonSpApiOauthStatePersistenceBridgeService"),
    "ImportsModule must export AmazonSpApiOauthStatePersistenceBridgeService",
  );

  assert(!/fetch\s*\(/.test(bridgeText), "Step126-B bridge must not perform HTTP fetch");
  assert(!/amazon\.com\/auth\/o2\/token|api\.amazon\.com\/auth\/o2\/token/i.test(bridgeText), "Step126-B bridge must not include LWA token endpoint");
  assert(!/persistEncryptedRefreshCredential\s*\(/.test(bridgeText), "Step126-B bridge must not write token persistence DB");
  assert(!/persistEncryptedAccessTokenCache\s*\(/.test(bridgeText), "Step126-B bridge must not write access token cache DB");
  assert(!/@(Get|Post|Patch|Delete)\s*\([^)]*(oauth|lwa|callback|authorization|authorize|token|credential|connection)/i.test(controllerText), "Step126-B must not add OAuth/token routes");

  const contract = assertAmazonSpApiOauthStatePersistenceBridgeImplementationContract(
    buildAmazonSpApiOauthStatePersistenceBridgeImplementationContract(),
  );

  assert(contract.sourceStep126A.summary.readyForStep126BOauthStatePersistenceBridgeImplementation === true, "Step126-A must allow Step126-B");
  assert(contract.bridgeServiceImplementedNow === true, "Step126-B must implement bridge service");
  assert(contract.tokenExchangeHttpCallNow === false, "Step126-B must not add token exchange HTTP");
  assert(contract.tokenPersistenceDatabaseWriteNow === false, "Step126-B must not write token persistence DB");
  assert(contract.summary.readyForStep126COauthStatePersistenceBridgeRuntimeSmoke === true, "Step126-B should allow Step126-C");
  assert(contract.regressionCompatibility.step125BRegressionSmokeAcceptsMultilineModuleExports === true, "Step126-B regression compatibility marker missing");

  console.log("[SMOKE_OK] amazon sp-api oauth state persistence bridge implementation contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step126-B",
    files: {
      bridgeService: path.relative(repoRoot, bridgeFile).replaceAll(path.sep, "/"),
      module: path.relative(repoRoot, moduleFile).replaceAll(path.sep, "/"),
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
