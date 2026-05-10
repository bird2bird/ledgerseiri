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
  const root = path.resolve(__dirname, "..");
  console.log("========== Step141-C Amazon SP-API Orders frontend real ImportJob commit smoke ==========");

  const pkg = JSON.parse(read(path.join(root, "package.json")));
  assert(
    pkg.scripts["smoke:amazon-sp-api-orders-real-importjob-commit-button"] ===
      "node scripts/smoke-amazon-sp-api-orders-real-importjob-commit-button.js",
    "apps/web package.json registers Step141-C smoke",
  );

  const api = read(path.join(root, "src/core/imports/api.ts"));
  const panel = read(path.join(root, "src/components/app/imports/AmazonSpApiOrdersDryRunPreviewPanel.tsx"));

  const apiMarkers = [
    "AmazonSpApiOrdersRealPreviewProductionVerification",
    "productionVerification?: AmazonSpApiOrdersRealPreviewProductionVerification",
    "canProceedToStep141BImportJobPersistence",
    "AmazonSpApiOrdersRealImportJobCommitRequest",
    "AmazonSpApiOrdersRealImportJobCommitResponse",
    "AMAZON_SP_API_ORDERS_REAL_IMPORTJOB_ENDPOINT",
    "/api/imports/amazon-sp-api/orders/real-importjob",
    "commitAmazonSpApiOrdersRealImportJob",
    "controllerWritesTransaction?: false",
    "controllerWritesInventory?: false",
    "returnsRawAccessToken?: false",
    "returnsRawRefreshToken?: false",
    "returnsAwsSecret?: false",
  ];

  for (const marker of apiMarkers) {
    assert(api.includes(marker), `api.ts marker exists: ${marker}`);
  }

  const panelMarkers = [
    "commitAmazonSpApiOrdersRealImportJob",
    "AmazonSpApiOrdersRealImportJobCommitResponse",
    "commitLoading",
    "commitResult",
    "runRealImportJobCommit",
    "productionVerification",
    "canCommitRealImportJob",
    "canProceedToStep141BImportJobPersistence",
    "amazon-sp-api-orders-real-importjob-commit-button",
    "amazon-sp-api-orders-real-importjob-result",
    "amazon-sp-api-orders-production-verification-card",
    "ImportJob作成",
    "Transaction作成なし / Inventory扣減なし / StagingRow保存済み",
  ];

  for (const marker of panelMarkers) {
    assert(panel.includes(marker), `panel marker exists: ${marker}`);
  }

  const forbiddenApiMarkers = [
    "x-amz-access-token",
    "client_secret",
    "AMAZON_SP_API_LWA_CLIENT_SECRET",
    "LWA_CLIENT_SECRET",
    "AWS_SECRET_STEP",
    "plaintextAccessToken:",
    "plaintextRefreshToken:",
    "rawAccessToken:",
    "rawRefreshToken:",
    "access_token:",
    "refresh_token:",
    "refresh_token=",
    "localStorage",
    "sessionStorage",
  ];

  for (const marker of forbiddenApiMarkers) {
    assert(!api.includes(marker), `api.ts does not contain forbidden marker: ${marker}`);
  }

  assert(!panel.includes("Commitは未実装"), "old disabled commit copy removed");
  assert(!panel.includes("amazon-sp-api-orders-commit-disabled-button"), "old disabled commit button removed");
  assert(panel.includes("disabled={!canCommitRealImportJob || commitLoading || realLoading || loading}"), "commit button guarded by production verification");

  console.log("[SMOKE_OK] Step141-C Amazon SP-API Orders frontend real ImportJob commit smoke passed");
}

main();
