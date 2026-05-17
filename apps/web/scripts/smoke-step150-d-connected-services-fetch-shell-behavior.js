const fs = require("fs");
const path = require("path");

const root = "/opt/ledgerseiri";
const web = path.join(root, "apps/web");
const pagePath = path.join(web, "src/app/[lang]/app/data/import/page.tsx");
const packagePath = path.join(web, "package.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const page = fs.readFileSync(pagePath, "utf8");
const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));

console.log("========== Step150-D smoke: single fetch button shell behavior ==========");

[
  "onFetchShell",
  "fetchShellMessage",
  "handleAmazonOrdersConnectedServiceFetchShell",
  "amazonOrdersFetchShellMessage",
  "setAmazonOrdersFetchShellMessage",
  "data-import-connected-service-amazon-orders-fetch-shell-message",
  "data-import-connected-service-amazon-orders-fetch-button",
  "onClick={onFetchShell}",
  "取得入口を選択しました",
  "Step150-D は UI shell のみ",
  "Amazon取得・ImportJob作成・SyncJob作成・DB書き込みは行いません",
  "document.querySelector",
  "amazon-sp-api-simple-order-pull-card",
  "target?.scrollIntoView",
  "取得準備",
].forEach((needle) => {
  assert(page.includes(needle), `page contains ${needle}`);
});

const buttonIndex = page.indexOf('data-testid="data-import-connected-service-amazon-orders-fetch-button"');
assert(buttonIndex >= 0, "fetch button found");
const buttonScope = page.slice(buttonIndex, buttonIndex + 600);
assert(!buttonScope.includes("disabled"), "fetch button is clickable shell");
assert(buttonScope.includes("type=\"button\""), "fetch button is type button");
assert(buttonScope.includes("onClick={onFetchShell}"), "fetch button uses shell handler");

const handlerStart = page.indexOf("function handleAmazonOrdersConnectedServiceFetchShell");
assert(handlerStart >= 0, "handler found");
const handlerEnd = page.indexOf("\n  const latestUpdatedAt", handlerStart);
assert(handlerEnd > handlerStart, "handler end found");
const handlerScope = page.slice(handlerStart, handlerEnd);

[
  "previewAmazonSpApiOrdersReal(",
  "commitAmazonSpApiOrdersRealImportJob(",
  "previewAmazonSpApiOrdersHistoricalSyncPlan(",
  "runHistoricalSync",
  "runSegment",
  "createSyncJob",
  "createSyncSegment",
  "fetch(",
  "postJson",
  "loadImportJobsPageSnapshot(",
].forEach((forbidden) => {
  assert(!handlerScope.includes(forbidden), `handler does not call runtime marker: ${forbidden}`);
});

const shellStart = page.indexOf("function AmazonOrdersConnectedServicesShell");
const shellEnd = page.indexOf("\n\nexport default function DataImportPage", shellStart);
const shellScope = page.slice(shellStart, shellEnd);

[
  "previewAmazonSpApiOrdersReal(",
  "commitAmazonSpApiOrdersRealImportJob(",
  "previewAmazonSpApiOrdersHistoricalSyncPlan(",
  "runHistoricalSync",
  "runSegment",
  "createSyncJob",
  "createSyncSegment",
  "fetch(",
  "postJson",
].forEach((forbidden) => {
  assert(!shellScope.includes(forbidden), `shell does not call runtime marker: ${forbidden}`);
});

assert(
  pkg.scripts["smoke:step150-d-connected-services-fetch-shell-behavior"] ===
    "node scripts/smoke-step150-d-connected-services-fetch-shell-behavior.js",
  "package.json registers Step150-D smoke",
);

console.log("[SMOKE_OK] Step150-D connected services fetch shell behavior smoke passed");
