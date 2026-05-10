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
  const webRoot = path.resolve(__dirname, "..");

  console.log("========== Step140-V Amazon SP-API Orders frontend real preview button smoke ==========");

  const pkg = JSON.parse(read(path.resolve(webRoot, "package.json")));
  assert(
    pkg.scripts["smoke:amazon-sp-api-orders-real-preview-button"] ===
      "node scripts/smoke-amazon-sp-api-orders-real-preview-button.js",
    "apps/web package.json registers Step140-V smoke",
  );

  const api = read(path.resolve(webRoot, "src/core/imports/api.ts"));
  const panel = read(path.resolve(webRoot, "src/components/app/imports/AmazonSpApiOrdersDryRunPreviewPanel.tsx"));

  const apiMarkers = [
    "Step140-V-FRONTEND-AMAZON-SP-API-ORDERS-REAL-PREVIEW",
    "AmazonSpApiOrdersRealPreviewRequest",
    "AmazonSpApiOrdersRealPreviewResponse",
    "AMAZON_SP_API_ORDERS_REAL_PREVIEW_ENDPOINT",
    "/api/imports/amazon-sp-api/orders/real-preview",
    "previewAmazonSpApiOrdersReal",
    "realPreview: true",
  ];

  for (const marker of apiMarkers) {
    assert(api.includes(marker), `Step140-V frontend api marker exists: ${marker}`);
  }

  const panelMarkers = [
    "previewAmazonSpApiOrdersReal",
    "AmazonSpApiOrdersRealPreviewResponse",
    "runRealPreview",
    "amazon-sp-api-orders-real-preview-button",
    "Real preview",
    "Step140-W required for live network",
    "Commitは未実装",
  ];

  for (const marker of panelMarkers) {
    assert(panel.includes(marker), `Step140-V panel marker exists: ${marker}`);
  }

  const forbiddenPanelMarkers = [
    "transaction.create",
    "inventoryMovement.create",
    "inventoryBalance.update",
    "x-amz-access-token",
    "AWS4-HMAC-SHA256",
    "clientSecret",
    "refreshToken",
  ];

  for (const marker of forbiddenPanelMarkers) {
    assert(!panel.includes(marker), `Step140-V panel does not contain forbidden marker: ${marker}`);
  }

  console.log("[SMOKE_OK] Step140-V Amazon SP-API Orders frontend real preview button smoke passed");
}

main();
