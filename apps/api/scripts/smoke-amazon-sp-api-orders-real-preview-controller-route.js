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
  const repoRoot = path.resolve(apiRoot, "../..");

  console.log("========== Step140-V Amazon SP-API Orders real preview controller route smoke ==========");

  const pkg = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    pkg.scripts["smoke:amazon-sp-api-orders-real-preview-controller-route"] ===
      "node scripts/smoke-amazon-sp-api-orders-real-preview-controller-route.js",
    "apps/api package.json registers Step140-V smoke",
  );

  const controller = read(path.resolve(apiRoot, "src/imports/imports.controller.ts"));
  const hSmoke = read(path.resolve(apiRoot, "scripts/smoke-amazon-sp-api-orders-dry-run-fixture-controller-route-contract.js"));
  const realPreviewService = read(path.resolve(apiRoot, "src/imports/amazon-sp-api-orders-real-preview.service.ts"));

  const requiredMarkers = [
    "amazonSpApiOrdersRealPreviewControllerRoute",
    "@Post('amazon-sp-api/orders/real-preview')",
    "previewAmazonSpApiOrdersRealNoPersistence",
    "assertAmazonSpApiOrdersRealPreviewRouteEnabled",
    "AMAZON_SP_API_ORDERS_REAL_PREVIEW_ROUTE_ENABLED",
    "AMAZON_SP_API_ORDERS_REAL_PREVIEW_TRANSPORT",
    "server-only-raw-signed-real-network",
    "buildStep140VMockedOrdersTransport",
    "real-preview-guarded-server-only-transport",
    "controllerWritesDatabase: false",
    "controllerUsesHttpClient: true",
    "controllerUsesSigV4: true",
    "importJobWriteNow: false",
    "importStagingRowWriteNow: false",
    "transactionWriteNow: false",
    "inventoryWriteNow: false",
    "realNetworkTransportImplementedNow",
    "step140WRequiredForLiveAmazonNetwork",
  ];

  for (const marker of requiredMarkers) {
    assert(controller.includes(marker), `Step140-V controller marker exists: ${marker}`);
  }

  const forbiddenMarkers = [
    "transaction.create",
    "inventoryMovement.create",
    "inventoryBalance.update",
    "importJob.create",
    "importStagingRow.create",
    "refreshToken:",
    "clientSecret:",
  ];

  for (const marker of forbiddenMarkers) {
    assert(!controller.includes(marker), `Step140-V controller does not contain forbidden marker: ${marker}`);
  }

  assert(realPreviewService.includes("previewAmazonSpApiOrdersRealNoPersistence"), "Step140-P real preview service remains present");
  assert(hSmoke.includes("isAllowedStep140TInventoryDeduction"), "Step140-T allowlist remains present");
  assert(!controller.includes("fetch("), "Step140-V controller does not contain direct fetch");
  assert(!controller.includes("axios."), "Step140-V controller does not contain axios");

  console.log("[SMOKE_OK] Step140-V Amazon SP-API Orders real preview controller route smoke passed");
}

main();
