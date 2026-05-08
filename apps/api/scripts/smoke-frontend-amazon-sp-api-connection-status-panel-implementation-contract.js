#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertFrontendAmazonSpApiConnectionStatusPanelImplementationContract,
  buildFrontendAmazonSpApiConnectionStatusPanelImplementationContract,
} = require("../dist/src/imports/dto/frontend-amazon-sp-api-connection-status-panel-implementation-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function collectFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!["node_modules", ".next", "dist"].includes(entry.name)) collectFiles(p, out);
    } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      out.push(p);
    }
  }
  return out;
}

function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");
  const webRoot = path.resolve(repoRoot, "apps/web");

  const apiPackageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    apiPackageJson.scripts["smoke:frontend-amazon-sp-api-connection-status-panel-implementation-contract"] ===
      "node scripts/smoke-frontend-amazon-sp-api-connection-status-panel-implementation-contract.js",
    "Step132-B smoke script missing or mismatched",
  );

  const dtoFile = path.resolve(apiRoot, "src/imports/dto/frontend-amazon-sp-api-connection-status-panel-implementation-contract.dto.ts");
  const step132aDtoFile = path.resolve(apiRoot, "src/imports/dto/frontend-amazon-sp-api-connection-status-panel-contract.dto.ts");
  const controllerFile = path.resolve(apiRoot, "src/imports/imports.controller.ts");

  const panelFile = path.resolve(webRoot, "src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx");
  const apiFile = path.resolve(webRoot, "src/core/imports/api.ts");

  const dtoText = read(dtoFile);
  const step132aDtoText = read(step132aDtoFile);
  const controllerText = read(controllerFile);
  const panelText = read(panelFile);
  const apiText = read(apiFile);

  assert(step132aDtoText.includes("readyForStep132BFrontendConnectionStatusPanelImplementation"), "Step132-A must allow Step132-B");

  for (const marker of [
    "FRONTEND_AMAZON_SP_API_CONNECTION_STATUS_PANEL_IMPLEMENTATION_CONTRACT_VERSION",
    "readyForStep132CFrontendConnectionStatusPanelRuntimeSmoke",
    "AmazonSpApiConnectionStatusPanel",
    "requestAmazonSpApiAuthorizationUrl",
    "amazon-sp-api-connect-button",
  ]) {
    assert(dtoText.includes(marker), `Step132-B DTO missing marker: ${marker}`);
  }

  for (const marker of [
    '"use client"',
    "export function AmazonSpApiConnectionStatusPanel",
    "data-testid=\"amazon-sp-api-connection-status-panel\"",
    "data-testid=\"amazon-sp-api-connect-button\"",
    "data-testid=\"amazon-sp-api-connection-status-badge\"",
    "Amazonと接続",
    "接続状態を更新",
    "再接続",
    "接続を解除",
    "requestAmazonSpApiAuthorizationUrl",
    "window.location.assign",
    "token_persistence_completed",
  ]) {
    assert(panelText.includes(marker), `panel missing marker: ${marker}`);
  }

  for (const marker of [
    "export type AmazonSpApiAuthorizationUrlRequest",
    "export type AmazonSpApiAuthorizationUrlResponse",
    "export async function requestAmazonSpApiAuthorizationUrl",
    "/api/imports/amazon-sp-api/oauth/authorization-url",
    'credentials: "include"',
    'cache: "no-store"',
    'params.set("storeId"',
    'params.set("marketplaceId"',
    'params.set("region"',
    'params.set("sandbox"',
    'params.set("forceReauthorize"',
  ]) {
    assert(apiText.includes(marker), `web imports API missing marker: ${marker}`);
  }

  assert(controllerText.includes("amazon-sp-api/oauth/authorization-url"), "backend authorization-url route must remain available");
  assert(controllerText.includes("amazon-sp-api/oauth/callback"), "backend callback route must remain available");
  assert(controllerText.includes("token_persistence_completed"), "callback token persistence must remain completed");

  const webSourceFiles = collectFiles(path.resolve(webRoot, "src"));
  const wiredTargets = webSourceFiles.filter((file) => {
    const text = read(file);
    return (
      file !== panelFile &&
      text.includes("AmazonSpApiConnectionStatusPanel") &&
      text.includes("<AmazonSpApiConnectionStatusPanel")
    );
  });

  assert(wiredTargets.length >= 1, "AmazonSpApiConnectionStatusPanel must be wired into an existing frontend target");

  const forbiddenUiPatterns = [
    /refreshToken\s*[:=]/,
    /accessToken\s*[:=]/,
    /clientSecret\s*[:=]/,
    /client_secret/,
    /refresh_token/,
    /access_token/,
  ];
  for (const pattern of forbiddenUiPatterns) {
    assert(!pattern.test(panelText), `panel must not expose raw secret pattern: ${pattern}`);
  }

  assert(!/reports\/2021-06-30|createReport|ImportJob\.create|transaction\.create|inventoryMovement\.create/.test(panelText + apiText), "Step132-B must not trigger reports/import/ledger/inventory execution");

  const contract = assertFrontendAmazonSpApiConnectionStatusPanelImplementationContract(
    buildFrontendAmazonSpApiConnectionStatusPanelImplementationContract(),
  );

  assert(contract.sourceStep132A.summary.readyForStep132BFrontendConnectionStatusPanelImplementation === true, "Step132-A must allow Step132-B");
  assert(contract.frontendImplementationNow === true, "Step132-B must implement frontend");
  assert(contract.backendImplementationNow === false, "Step132-B must not implement backend");
  assert(contract.summary.readyForStep132CFrontendConnectionStatusPanelRuntimeSmoke === true, "Step132-C readiness mismatch");
  assert(contract.summary.readyForStep135RealSpApiReports === false, "Step135 must remain blocked");

  console.log("[SMOKE_OK] frontend amazon sp-api connection status panel implementation contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step132-B",
    files: {
      dto: path.relative(repoRoot, dtoFile).replaceAll(path.sep, "/"),
      smoke: path.relative(repoRoot, __filename).replaceAll(path.sep, "/"),
      panel: path.relative(repoRoot, panelFile).replaceAll(path.sep, "/"),
      api: path.relative(repoRoot, apiFile).replaceAll(path.sep, "/"),
      wiredTargets: wiredTargets.map((file) => path.relative(repoRoot, file).replaceAll(path.sep, "/")),
    },
    summary: contract.summary,
  }, null, 2));
}

try {
  main();
} catch (err) {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
}
