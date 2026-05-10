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

  console.log("========== Step140-X Amazon SP-API Orders credential repository integration smoke ==========");

  const pkg = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    pkg.scripts["smoke:amazon-sp-api-orders-credential-repository-integration"] ===
      "node scripts/smoke-amazon-sp-api-orders-credential-repository-integration.js",
    "apps/api package.json registers Step140-X smoke",
  );

  const repo = read(path.resolve(apiRoot, "src/imports/amazon-sp-api-orders-credential.repository.ts"));
  const controller = read(path.resolve(apiRoot, "src/imports/imports.controller.ts"));
  const schema = read(path.resolve(apiRoot, "prisma/schema.prisma"));

  const schemaMarkers = [
    "model AmazonSpApiConnection",
    "model AmazonSpApiCredential",
    "model AmazonSpApiAccessTokenCache",
    "encryptedRefreshToken",
    "encryptedAccessToken",
    "expiresAt",
  ];

  for (const marker of schemaMarkers) {
    assert(schema.includes(marker), `schema marker exists: ${marker}`);
  }

  const repoMarkers = [
    "resolveAmazonSpApiOrdersCredentialFromRepository",
    "assertAmazonSpApiOrdersCredentialRepositoryResultSafeForResponse",
    "amazonSpApiConnection.findFirst",
    "credential: true",
    "accessTokenCache: true",
    "TOKEN_DECRYPTOR_NOT_CONFIGURED",
    "ACCESS_TOKEN_CACHE_EXPIRED",
    "returnsRawAccessTokenToControllerOnly",
    "returnsEncryptedToken: false",
    "refreshesLwaTokenNow: false",
    "writesDatabase: false",
    "callsAmazon: false",
  ];

  for (const marker of repoMarkers) {
    assert(repo.includes(marker), `Step140-X repository marker exists: ${marker}`);
  }

  const controllerMarkers = [
    "resolveAmazonSpApiOrdersCredentialFromRepository",
    "assertAmazonSpApiOrdersCredentialRepositoryResultSafeForResponse",
    "transportMode === 'repository'",
    "repository-access-token-server-only-real-network",
    "verifyAmazonSpApiOrdersRealPreviewProductionReadiness",
    "productionVerification",
    "STEP140_Z_ORDERS_CREDENTIAL_REPOSITORY_BLOCKED",
    "credentialSource",
    "credentialRepository",
    "accessTokenRefresh",
    "this.prismaService",
    "AmazonSpApiOrdersAccessTokenDecryptor",
    "decryptor: this.amazonSpApiOrdersAccessTokenDecryptor",
  ];

  for (const marker of controllerMarkers) {
    assert(controller.includes(marker), `Step140-X controller marker exists: ${marker}`);
  }

  const forbiddenRepoMarkers = [
    "transaction.create",
    "inventoryMovement.create",
    "inventoryBalance.update",
    "importJob.create",
    "importStagingRow.create",
    "fetch(",
    "httpsRequest",
    "console.log(",
  ];

  for (const marker of forbiddenRepoMarkers) {
    assert(!repo.includes(marker), `Step140-X repository does not contain forbidden marker: ${marker}`);
  }

  assert(!repo.includes("encryptedAccessTokenReturnedNow: true"), "repository does not mark encrypted token returned");
  assert(!repo.includes("encryptedRefreshTokenReturnedNow: true"), "repository does not mark encrypted refresh token returned");
  assert(!controller.includes("transaction.create"), "controller still does not create Transaction");
  assert(!controller.includes("inventoryMovement.create"), "controller still does not create InventoryMovement");
  assert(!controller.includes("inventoryBalance.update"), "controller still does not update InventoryBalance");

  console.log("[SMOKE_OK] Step140-X Amazon SP-API Orders credential repository integration smoke passed");
}

main();
