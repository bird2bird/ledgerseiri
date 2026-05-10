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

  console.log("========== Step140-Z Amazon SP-API Orders LWA refresh + access token cache update smoke ==========");

  const pkg = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    pkg.scripts["smoke:amazon-sp-api-orders-lwa-refresh-access-token-cache-update"] ===
      "node scripts/smoke-amazon-sp-api-orders-lwa-refresh-access-token-cache-update.js",
    "apps/api package.json registers Step140-Z smoke",
  );

  const service = read(path.resolve(apiRoot, "src/imports/amazon-sp-api-orders-lwa-refresh.service.ts"));
  const controller = read(path.resolve(apiRoot, "src/imports/imports.controller.ts"));

  const serviceMarkers = [
    "refreshAmazonSpApiOrdersAccessTokenCache",
    "executeAmazonSpApiOrdersLwaRefreshHttp",
    "AMAZON_SP_API_ORDERS_LWA_REFRESH_ENABLED",
    "AMAZON_SP_API_LWA_CLIENT_ID",
    "AMAZON_SP_API_LWA_CLIENT_SECRET",
    "AMAZON_SP_API_LWA_TOKEN_ENDPOINT",
    "AMAZON_SP_API_ORDERS_REFRESH_TOKEN_DECRYPTOR_MODE",
    "AMAZON_SP_API_ORDERS_REFRESH_TOKEN_DECRYPTOR_ALLOW_PLAIN_PREFIX",
    "AMAZON_SP_API_ORDERS_ACCESS_TOKEN_CACHE_ENCRYPTOR_MODE",
    "AMAZON_SP_API_ORDERS_ACCESS_TOKEN_CACHE_ENCRYPTOR_ALLOW_PLAIN_PREFIX",
    "grant_type: 'refresh_token'",
    "amazonSpApiAccessTokenCache",
    "upsert",
    "writesAmazonSpApiAccessTokenCache: true",
    "writesImportJob: false",
    "writesTransaction: false",
    "writesInventory: false",
    "rawAccessTokenReturnedNow: false",
    "rawRefreshTokenReturnedNow: false",
    "encryptedRefreshTokenReturnedNow: false",
    "encryptedAccessTokenReturnedNow: false",
  ];

  for (const marker of serviceMarkers) {
    assert(service.includes(marker), `Step140-Z service marker exists: ${marker}`);
  }

  const controllerMarkers = [
    "refreshAmazonSpApiOrdersAccessTokenCache",
    "accessTokenRefreshResult",
    "ACCESS_TOKEN_CACHE_EXPIRED",
    "ACCESS_TOKEN_CACHE_MISSING",
    "STEP140_Z_ORDERS_CREDENTIAL_REPOSITORY_BLOCKED",
    "accessTokenRefresh",
  ];

  for (const marker of controllerMarkers) {
    assert(controller.includes(marker), `Step140-Z controller marker exists: ${marker}`);
  }

  const forbiddenServiceMarkers = [
    "transaction.create",
    "inventoryMovement.create",
    "inventoryBalance.update",
    "importJob.create",
    "importStagingRow.create",
    "console.log(",
    "rawAccessTokenReturnedNow: true",
    "rawRefreshTokenReturnedNow: true",
    "encryptedRefreshTokenReturnedNow: true",
    "encryptedAccessTokenReturnedNow: true",
  ];

  for (const marker of forbiddenServiceMarkers) {
    assert(!service.includes(marker), `Step140-Z service does not contain forbidden marker: ${marker}`);
  }

  assert(!controller.includes("transaction.create"), "controller still does not create Transaction");
  assert(!controller.includes("inventoryMovement.create"), "controller still does not create InventoryMovement");
  assert(!controller.includes("inventoryBalance.update"), "controller still does not update InventoryBalance");
  assert(!controller.includes("importJob.create"), "controller still does not create ImportJob");

  console.log("[SMOKE_OK] Step140-Z Amazon SP-API Orders LWA refresh + access token cache update smoke passed");
}

main();
