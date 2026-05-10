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

  console.log("========== Step141-B real Orders ImportJob + ImportStagingRow persistence smoke ==========");

  const pkg = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    pkg.scripts["smoke:amazon-sp-api-orders-real-importjob-staging-persistence"] ===
      "node scripts/smoke-amazon-sp-api-orders-real-importjob-staging-persistence.js",
    "apps/api package.json registers Step141-B smoke",
  );

  const service = read(path.resolve(apiRoot, "src/imports/amazon-sp-api-orders-real-importjob-persistence.service.ts"));
  const controller = read(path.resolve(apiRoot, "src/imports/imports.controller.ts"));
  const schema = read(path.resolve(apiRoot, "prisma/schema.prisma"));

  const schemaMarkers = [
    "model ImportJob",
    "model ImportStagingRow",
    "rawPayloadJson        Json",
    "normalizedPayloadJson Json",
    "dedupeHash",
    "matchStatus",
  ];

  for (const marker of schemaMarkers) {
    assert(schema.includes(marker), `schema marker exists: ${marker}`);
  }

  const serviceMarkers = [
    "persistAmazonSpApiOrdersRealPreviewToImportJobAndStagingRows",
    "productionVerification",
    "canProceedToStep141BImportJobPersistence",
    "importJob.create",
    "importStagingRow.createMany",
    "domain: 'income'",
    "module: 'store-orders'",
    "sourceType: 'amazon-sp-api-orders'",
    "status: 'SUCCEEDED'",
    "rawPayloadJson",
    "normalizedPayloadJson",
    "dedupeHash",
    "businessMonth",
    "writesImportJob: true",
    "writesImportStagingRow: true",
    "writesTransaction: false",
    "writesInventory: false",
    "writesInventoryMovement: false",
    "callsAmazon: false",
    "returnsRawAccessToken: false",
    "returnsRawRefreshToken: false",
    "returnsAwsSecret: false",
  ];

  for (const marker of serviceMarkers) {
    assert(service.includes(marker), `Step141-B service marker exists: ${marker}`);
  }

  const controllerMarkers = [
    "persistAmazonSpApiOrdersRealPreviewToImportJobAndStagingRows",
    "amazonSpApiOrdersRealImportJobCommitControllerRoute",
    "amazon-sp-api/orders/real-importjob",
    "amazonSpApiOrdersRealPreviewControllerRoute",
    "controllerWritesImportJob",
    "controllerWritesImportStagingRows",
    "controllerWritesTransaction: false",
    "controllerWritesInventory: false",
  ];

  for (const marker of controllerMarkers) {
    assert(controller.includes(marker), `Step141-B controller marker exists: ${marker}`);
  }

  const forbiddenServiceMarkers = [
    "transaction.create",
    "inventoryMovement.create",
    "inventoryBalance.update",
    "x-amz-access-token",
    "AWS_SECRET",
    "refresh_token",
    "console.log(",
  ];

  for (const marker of forbiddenServiceMarkers) {
    assert(!service.includes(marker), `Step141-B service does not contain forbidden marker: ${marker}`);
  }

  assert(!controller.includes("transaction.create"), "controller still does not create Transaction");
  assert(!controller.includes("inventoryMovement.create"), "controller still does not create InventoryMovement");
  assert(!controller.includes("inventoryBalance.update"), "controller still does not update InventoryBalance");

  console.log("[SMOKE_OK] Step141-B real Orders ImportJob + ImportStagingRow persistence smoke passed");
}

main();
