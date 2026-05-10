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

  console.log("========== Step141-A Amazon SP-API Orders real preview production verification smoke ==========");

  const pkg = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    pkg.scripts["smoke:amazon-sp-api-orders-real-preview-production-verification"] ===
      "node scripts/smoke-amazon-sp-api-orders-real-preview-production-verification.js",
    "apps/api package.json registers Step141-A smoke",
  );

  const verifier = read(path.resolve(apiRoot, "src/imports/amazon-sp-api-orders-real-preview-production.verifier.ts"));
  const controller = read(path.resolve(apiRoot, "src/imports/imports.controller.ts"));

  const verifierMarkers = [
    "verifyAmazonSpApiOrdersRealPreviewProductionReadiness",
    "ready_for_importjob_persistence",
    "mocked_transport_not_production",
    "preview_not_real",
    "orders_missing_or_empty",
    "items_missing_or_empty",
    "repository_refresh_failed",
    "amazon_auth_or_permission_risk",
    "amazon_throttle_risk",
    "amazon_http_or_transport_risk",
    "malformed_preview_shape",
    "canProceedToStep141BImportJobPersistence",
    "requiresPaginationVerification",
    "requiresErrorMappingVerification",
    "requiresCredentialStabilityVerification",
    "writesImportJob: false",
    "writesImportStagingRow: false",
    "writesTransaction: false",
    "writesInventory: false",
    "returnsRawAccessToken: false",
    "returnsRawRefreshToken: false",
    "returnsAwsSecret: false",
  ];

  for (const marker of verifierMarkers) {
    assert(verifier.includes(marker), `Step141-A verifier marker exists: ${marker}`);
  }

  const controllerMarkers = [
    "verifyAmazonSpApiOrdersRealPreviewProductionReadiness",
    "productionVerification",
    "previewResult: result",
    "credentialSource: useRepositoryCredentials ? 'repository' : 'env'",
    "accessTokenRefreshResult: accessTokenRefreshResult || undefined",
  ];

  for (const marker of controllerMarkers) {
    assert(controller.includes(marker), `Step141-A controller marker exists: ${marker}`);
  }

  const forbiddenVerifierMarkers = [
    "importJob.create",
    "importStagingRow.create",
    "transaction.create",
    "inventoryMovement.create",
    "inventoryBalance.update",
    "refresh_token",
    "x-amz-access-token",
    "AWS_SECRET",
    "console.log(",
  ];

  for (const marker of forbiddenVerifierMarkers) {
    assert(!verifier.includes(marker), `Step141-A verifier does not contain forbidden marker: ${marker}`);
  }

  assert(!controller.includes("importJob.create"), "controller still does not create ImportJob");
  assert(!controller.includes("importStagingRow.create"), "controller still does not create ImportStagingRow");
  assert(!controller.includes("transaction.create"), "controller still does not create Transaction");
  assert(!controller.includes("inventoryMovement.create"), "controller still does not create InventoryMovement");
  assert(!controller.includes("inventoryBalance.update"), "controller still does not update InventoryBalance");

  console.log("[SMOKE_OK] Step141-A Amazon SP-API Orders real preview production verification smoke passed");
}

main();
