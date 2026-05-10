#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`[OK] ${message}`);
}

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`);
  return fs.readFileSync(file, "utf8");
}

function main() {
  const apiRoot = path.resolve(__dirname, "..");

  console.log("========== Step140-Y Amazon SP-API Orders credential decryptor + access token cache smoke ==========");

  const pkg = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    pkg.scripts["smoke:amazon-sp-api-orders-credential-decryptor-access-token-cache"] ===
      "node scripts/smoke-amazon-sp-api-orders-credential-decryptor-access-token-cache.js",
    "apps/api package.json registers Step140-Y smoke",
  );

  const decryptor = read(path.resolve(apiRoot, "src/imports/amazon-sp-api-orders-access-token.decryptor.ts"));
  const controller = read(path.resolve(apiRoot, "src/imports/imports.controller.ts"));
  const repo = read(path.resolve(apiRoot, "src/imports/amazon-sp-api-orders-credential.repository.ts"));

  const decryptorMarkers = [
    "AmazonSpApiOrdersAccessTokenDecryptor",
    "decryptAccessToken",
    "decryptAccessTokenCacheForControllerOnly",
    "AMAZON_SP_API_ORDERS_ACCESS_TOKEN_DECRYPTOR_MODE",
    "AMAZON_SP_API_ORDERS_ACCESS_TOKEN_DECRYPTOR_ALLOW_PLAIN_PREFIX",
    "AMAZON_SP_API_ORDERS_ACCESS_TOKEN_DECRYPTOR_TEST_MAPPING_JSON",
    "plain-prefix-dev-only",
    "test-mapping",
    "plaintextAccessTokenForControllerOnly",
    "decryptsAccessTokenCache: true",
    "decryptsRefreshToken: false",
    "refreshesLwaTokenNow: false",
    "returnsRawAccessTokenToFrontend: false",
    "returnsEncryptedToken: false",
  ];

  for (const marker of decryptorMarkers) {
    assert(decryptor.includes(marker), `Step140-Y decryptor marker exists: ${marker}`);
  }

  const controllerMarkers = [
    "AmazonSpApiOrdersAccessTokenDecryptor",
    "amazonSpApiOrdersAccessTokenDecryptor",
    "decryptor: this.amazonSpApiOrdersAccessTokenDecryptor",
    "transportMode === 'repository'",
    "repository-access-token-server-only-real-network",
    "refreshAmazonSpApiOrdersAccessTokenCache",
    "accessTokenRefresh",
  ];

  for (const marker of controllerMarkers) {
    assert(controller.includes(marker), `Step140-Y controller marker exists: ${marker}`);
  }

  const repoMarkers = [
    "decryptor?: AmazonSpApiOrdersCredentialDecryptor",
    "decryptAccessToken",
    "TOKEN_DECRYPTOR_NOT_CONFIGURED",
    "returnsRawAccessTokenToControllerOnly: true",
    "assertAmazonSpApiOrdersCredentialRepositoryResultSafeForResponse",
  ];

  for (const marker of repoMarkers) {
    assert(repo.includes(marker), `Step140-X/Y repository marker remains: ${marker}`);
  }

  const forbiddenDecryptorMarkers = [
    "encryptedRefreshToken",
    "refresh_token",
    "transaction.create",
    "inventoryMovement.create",
    "inventoryBalance.update",
    "importJob.create",
    "fetch(",
    "httpsRequest",
    "console.log(",
  ];

  for (const marker of forbiddenDecryptorMarkers) {
    assert(!decryptor.includes(marker), `Step140-Y decryptor does not contain forbidden marker: ${marker}`);
  }

  assert(!controller.includes("transaction.create"), "controller still does not create Transaction");
  assert(!controller.includes("inventoryMovement.create"), "controller still does not create InventoryMovement");
  assert(!controller.includes("inventoryBalance.update"), "controller still does not update InventoryBalance");
  assert(!controller.includes("importJob.create"), "controller still does not create ImportJob");

  console.log("[SMOKE_OK] Step140-Y Amazon SP-API Orders credential decryptor + access token cache smoke passed");
}

main();
