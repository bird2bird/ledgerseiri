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
  const repoRoot = path.resolve(webRoot, "../..");

  console.log("========== Step140-U Amazon SP-API Orders Import Center production UX closeout smoke ==========");

  const packageJson = JSON.parse(read(path.resolve(webRoot, "package.json")));
  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-import-center-production-closeout"] ===
      "node scripts/smoke-amazon-sp-api-orders-import-center-production-closeout.js",
    "apps/web package.json registers Step140-U smoke",
  );

  const panelPath = path.resolve(webRoot, "src/components/app/imports/AmazonSpApiOrdersProductionCloseoutPanel.tsx");
  const pagePath = path.resolve(webRoot, "src/app/[lang]/app/data/import/page.tsx");
  const dryRunPanelPath = path.resolve(webRoot, "src/components/app/imports/AmazonSpApiOrdersDryRunPreviewPanel.tsx");

  const panel = read(panelPath);
  const page = read(pagePath);
  const dryRunPanel = read(dryRunPanelPath);

  const requiredPanelMarkers = [
    "AmazonSpApiOrdersProductionCloseoutPanel",
    "amazon-sp-api-orders-production-closeout-panel",
    "backend closed loop ready",
    "read-only UX",
    "Step140-P",
    "Step140-Q",
    "Step140-R",
    "Step140-S",
    "Step140-T",
    "Step140-U",
    "no frontend write action",
    "no Amazon call from this panel",
    "no transaction commit button",
    "no inventory deduction button",
    "Real Amazon UI read requires a future controller + frontend wiring step",
    "amazon-sp-api-orders-production-closeout-boundary",
  ];

  for (const marker of requiredPanelMarkers) {
    assert(panel.includes(marker), `Step140-U panel marker exists: ${marker}`);
  }

  const forbiddenPanelMarkers = [
    "fetch(",
    "previewAmazonSpApiOrdersDryRun(",
    "previewAmazonSpApiOrdersReal",
    "commitAmazonSpApiOrders",
    "deductAmazonSpApiOrders",
    "transaction.create",
    "inventoryMovement.create",
    "inventoryBalance.update",
    "x-amz-access-token",
    "AWS4-HMAC-SHA256",
    "clientSecret",
    "refreshToken",
  ];

  for (const marker of forbiddenPanelMarkers) {
    assert(!panel.includes(marker), `Step140-U panel does not contain forbidden marker: ${marker}`);
  }

  assert(
    page.includes('import { AmazonSpApiOrdersProductionCloseoutPanel } from "@/components/app/imports/AmazonSpApiOrdersProductionCloseoutPanel";'),
    "Import Center page imports production closeout panel",
  );

  assert(
    page.includes("<AmazonSpApiOrdersProductionCloseoutPanel />"),
    "Import Center page renders production closeout panel",
  );

  assert(
    page.includes("<AmazonSpApiOrdersDryRunPreviewPanel />"),
    "Import Center page keeps dry-run preview panel",
  );

  assert(
    dryRunPanel.includes("amazon-sp-api-orders-dry-run-preview-button") &&
      dryRunPanel.includes("previewAmazonSpApiOrdersDryRun") &&
      dryRunPanel.includes("Commitは未実装"),
    "Step140-L dry-run panel remains intact",
  );

  const apiStep140H = read(path.resolve(repoRoot, "apps/api/scripts/smoke-amazon-sp-api-orders-dry-run-fixture-controller-route-contract.js"));
  assert(apiStep140H.includes("isAllowedStep140TInventoryDeduction"), "Step140-T backend regression allowlist remains present");

  console.log("[SMOKE_OK] Step140-U Amazon SP-API Orders Import Center production UX closeout smoke passed");
}

main();
