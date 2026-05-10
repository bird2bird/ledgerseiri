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

function listFiles(dir, predicate, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      if (["node_modules", ".next", "dist", "coverage", ".git"].includes(name)) continue;
      listFiles(p, predicate, acc);
      continue;
    }
    if (predicate(p)) acc.push(p);
  }
  return acc;
}

function isAllowedStep141CRealImportJobFrontend(rel, text) {
  if (rel === "apps/web/src/core/imports/api.ts") {
    return (
      text.includes("commitAmazonSpApiOrdersRealImportJob") &&
      text.includes("AMAZON_SP_API_ORDERS_REAL_IMPORTJOB_ENDPOINT") &&
      text.includes("/api/imports/amazon-sp-api/orders/real-importjob") &&
      text.includes("controllerWritesTransaction?: false") &&
      text.includes("controllerWritesInventory?: false") &&
      text.includes("returnsRawAccessToken?: false") &&
      text.includes("returnsRawRefreshToken?: false") &&
      text.includes("returnsAwsSecret?: false") &&
      !text.includes("x-amz-access-token") &&
      !text.includes("AWS_SECRET_STEP") &&
      !text.includes("refresh_token=")
    );
  }

  if (rel === "apps/web/src/components/app/imports/AmazonSpApiOrdersDryRunPreviewPanel.tsx") {
    return (
      text.includes("commitAmazonSpApiOrdersRealImportJob") &&
      text.includes("canCommitRealImportJob") &&
      text.includes("productionVerification") &&
      text.includes("canProceedToStep141BImportJobPersistence") &&
      text.includes("amazon-sp-api-orders-real-importjob-commit-button") &&
      text.includes("Transaction作成なし / Inventory扣減なし / StagingRow保存済み") &&
      !text.includes("transaction.create") &&
      !text.includes("inventoryMovement.create") &&
      !text.includes("inventoryBalance.update") &&
      !text.includes("x-amz-access-token")
    );
  }

  return false;
}

function main() {
  const webRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(webRoot, "..", "..");

  console.log("========== Step140-L Amazon SP-API Orders Import Center dry-run preview panel smoke ==========");

  const packageJson = JSON.parse(read(path.resolve(webRoot, "package.json")));
  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-import-center-dry-run-preview-panel"] ===
      "node scripts/smoke-amazon-sp-api-orders-import-center-dry-run-preview-panel.js",
    "apps/web package.json registers Step140-L smoke",
  );

  const apiSource = read(path.resolve(webRoot, "src/core/imports/api.ts"));
  const panelSource = read(path.resolve(webRoot, "src/components/app/imports/AmazonSpApiOrdersDryRunPreviewPanel.tsx"));
  const pageSource = read(path.resolve(webRoot, "src/app/[lang]/app/data/import/page.tsx"));

  const requiredApiMarkers = [
    "AmazonSpApiOrdersDryRunPreviewRequest",
    "AmazonSpApiOrdersDryRunPreviewResponse",
    "AMAZON_SP_API_ORDERS_DRY_RUN_PREVIEW_ENDPOINT",
    "/api/imports/amazon-sp-api/orders/preview",
    "previewAmazonSpApiOrdersDryRun",
    "dryRun: true",
  ];

  for (const marker of requiredApiMarkers) {
    assert(apiSource.includes(marker), `Step140-L API marker exists: ${marker}`);
  }

  const requiredPanelMarkers = [
    "AmazonSpApiOrdersDryRunPreviewPanel",
    "amazon-sp-api-orders-dry-run-preview-panel",
    "amazon-sp-api-orders-dry-run-preview-button",
    "amazon-sp-api-orders-real-importjob-commit-button",
    "commitAmazonSpApiOrdersRealImportJob",
    "canCommitRealImportJob",
    "productionVerification",
    "canProceedToStep141BImportJobPersistence",
    "amazon-sp-api-orders-dry-run-result",
    "amazon-sp-api-orders-unresolved-sku-warning",
    "previewAmazonSpApiOrdersDryRun",
    "dryRun: true",
    "ImportJob作成",
    "DB書込",
    "Amazon通信",
    "Transaction",
    "Inventory",
  ];

  for (const marker of requiredPanelMarkers) {
    assert(panelSource.includes(marker), `Step140-L panel marker exists: ${marker}`);
  }

  const requiredPageMarkers = [
    "AmazonSpApiOrdersDryRunPreviewPanel",
    "<AmazonSpApiConnectionStatusPanel />",
    "<AmazonSpApiOrdersDryRunPreviewPanel />",
    "<ImportWorkspaceShell moduleHint={moduleHint} />",
  ];

  for (const marker of requiredPageMarkers) {
    assert(pageSource.includes(marker), `Step140-L page marker exists: ${marker}`);
  }

  const forbiddenPanelMarkers = [
    "importJob.create",
    "transaction.create",
    "commitAmazonSpApiOrders(",
    "commitAmazonSpApiOrdersPreview(",
    "commitAmazonSpApiOrdersDryRun(",
    "orders/commit",
    "inventoryMovement.create",
    "inventoryBalance.update",
    "getOrders(",
    "getOrderItems(",
    "AWS4-HMAC-SHA256",
    "x-amz-access-token",
    "refreshToken",
    "clientSecret",
  ];

  for (const marker of forbiddenPanelMarkers) {
    assert(!panelSource.includes(marker), `Step140-L panel does not contain forbidden marker: ${marker}`);
  }

  assert(!panelSource.includes("amazon-sp-api-orders-commit-disabled-button"), "old Step140-L disabled commit button removed after Step141-C");
  assert(!panelSource.includes("Commitは未実装"), "old Step140-L disabled commit copy removed after Step141-C");

  const webFiles = listFiles(path.resolve(webRoot, "src"), (p) => /\.(ts|tsx)$/.test(p));
  const leaks = [];

  for (const file of webFiles) {
    const text = read(file);
    const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");

    const hasStep140LContext =
      text.includes("Step140-L") ||
      text.includes("AmazonSpApiOrdersDryRunPreviewPanel") ||
      text.includes("previewAmazonSpApiOrdersDryRun") ||
      text.includes("amazon-sp-api/orders/preview");

    const hasUnsafeLeak =
      text.includes("orders/commit") ||
      text.includes("getOrders(") ||
      text.includes("getOrderItems(") ||
      text.includes("importJob.create") ||
      text.includes("transaction.create") ||
      text.includes("inventoryMovement.create") ||
      text.includes("inventoryBalance.update") ||
      text.includes("AWS4-HMAC-SHA256") ||
      text.includes("x-amz-access-token");

    const hasStep141CCommit =
      text.includes("commitAmazonSpApiOrdersRealImportJob") ||
      text.includes("/api/imports/amazon-sp-api/orders/real-importjob");

    const allowedStep141C = isAllowedStep141CRealImportJobFrontend(rel, text);

    if (hasStep140LContext && (hasUnsafeLeak || hasStep141CCommit) && !allowedStep141C) {
      leaks.push(rel);
    }
  }

  assert(
    leaks.length === 0,
    `no Step140-L frontend commit/network/write leak after Step141-C allowlist: ${JSON.stringify(leaks)}`,
  );

  console.log("[SMOKE_OK] Step140-L Amazon SP-API Orders Import Center dry-run preview panel smoke passed");
}

main();
