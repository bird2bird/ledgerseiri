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

  console.log("========== Step140-W Amazon SP-API Orders server-only raw signed transport smoke ==========");

  const pkg = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    pkg.scripts["smoke:amazon-sp-api-orders-server-only-raw-signed-transport"] ===
      "node scripts/smoke-amazon-sp-api-orders-server-only-raw-signed-transport.js",
    "apps/api package.json registers Step140-W smoke",
  );

  const transport = read(path.resolve(apiRoot, "src/imports/amazon-sp-api-orders-server-only-raw-signed.transport.ts"));
  const controller = read(path.resolve(apiRoot, "src/imports/imports.controller.ts"));

  const transportMarkers = [
    "buildAmazonSpApiOrdersServerOnlyRawSignedTransport",
    "executeAmazonSpApiOrdersServerOnlyRawSignedHttpRequest",
    "getAmazonSpApiOrdersServerOnlyRawSignedTransportReadiness",
    "httpsRequest",
    "AMAZON_SP_API_ORDERS_REAL_ACCESS_TOKEN",
    "AMAZON_SP_API_ORDERS_AWS_ACCESS_KEY_ID",
    "AMAZON_SP_API_ORDERS_AWS_SECRET_ACCESS_KEY",
    "AMAZON_SP_API_ORDERS_AWS_SESSION_TOKEN",
    "STEP140_W_REAL_NETWORK_ENV_MISSING",
    "x-amz-access-token",
    "authorization",
    "x-amz-security-token",
    "sanitizeAmazonResponseHeaders",
    "sanitizeTransportErrorMessage",
    "exposesRawAuthorization: false",
    "exposesRawAccessToken: false",
    "exposesAwsSecretAccessKey: false",
    "exposesAwsSessionToken: false",
  ];

  for (const marker of transportMarkers) {
    assert(transport.includes(marker), `Step140-W transport marker exists: ${marker}`);
  }

  const controllerMarkers = [
    "buildAmazonSpApiOrdersServerOnlyRawSignedTransport",
    "transportMode === 'real'",
    "server-only-raw-signed-real-network",
    "real-preview-guarded-server-only-transport",
    "AMAZON_SP_API_ORDERS_REAL_ACCESS_TOKEN",
    "AMAZON_SP_API_ORDERS_AWS_ACCESS_KEY_ID",
    "AMAZON_SP_API_ORDERS_AWS_SECRET_ACCESS_KEY",
    "AMAZON_SP_API_ORDERS_AWS_SESSION_TOKEN",
    "controllerWritesDatabase: false",
    "importJobWriteNow: false",
    "importStagingRowWriteNow: false",
    "transactionWriteNow: false",
    "inventoryWriteNow: false",
  ];

  for (const marker of controllerMarkers) {
    assert(controller.includes(marker), `Step140-W controller marker exists: ${marker}`);
  }

  const forbiddenTransportMarkers = [
    "localStorage",
    "window.",
    "document.",
    "transaction.create",
    "inventoryMovement.create",
    "inventoryBalance.update",
    "importJob.create",
    "importStagingRow.create",
    "console.log(envelope",
    "console.log(headers",
  ];

  for (const marker of forbiddenTransportMarkers) {
    assert(!transport.includes(marker), `Step140-W transport does not contain forbidden marker: ${marker}`);
  }

  assert(!controller.includes("STEP140_V_REAL_NETWORK_PENDING_STEP140_W"), "Step140-V real network pending blocker removed");
  assert(!controller.includes("transaction.create"), "controller still does not create Transaction");
  assert(!controller.includes("inventoryMovement.create"), "controller still does not create InventoryMovement");
  assert(!controller.includes("inventoryBalance.update"), "controller still does not update InventoryBalance");

  console.log("[SMOKE_OK] Step140-W Amazon SP-API Orders server-only raw signed transport smoke passed");
}

main();
