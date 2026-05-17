const fs = require("fs");
const path = require("path");

const root = "/opt/ledgerseiri";
const web = path.join(root, "apps/web");
const pagePath = path.join(web, "src/app/[lang]/app/data/import/page.tsx");
const packagePath = path.join(web, "package.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

console.log("========== Step150-B/D smoke: Data Import connected services shell ==========");

const page = read(pagePath);
const pkg = JSON.parse(read(packagePath));

[
  "AmazonOrdersConnectedServicesShell",
  "data-import-connected-services-shell",
  "data-import-connected-services-default-range",
  "data-import-connected-service-amazon-orders-row",
  "data-import-connected-service-amazon-orders-last-fetched",
  "data-import-connected-service-amazon-orders-status",
  "data-import-connected-service-amazon-orders-view-link",
  "data-import-connected-service-amazon-orders-fetch-button",
  "Step151-B-FETCH-BUTTON-EXECUTION-CONTRACT",
  "data-import-connected-service-amazon-orders-execution-contract",
  "data-import-connected-service-amazon-orders-execution-contract-status",
  "data-import-connected-service-amazon-orders-fetch-shell-message",
  "data-import-connected-service-amazon-orders-range-rule",
  "連携サービス一覧",
  "Amazon.co.jp（出品者アカウント）",
  "最終取得日時",
  "取得状態",
  "明細一覧",
  "閲覧",
  "取得",
  "既定の取得期間：最近7日",
  "期間：7日 / 30日 / 90日 / 365日 / カスタム",
  "取得準備",
  'href="/ja/app/data/import/amazon-orders"',
  "handleAmazonOrdersConnectedServiceFetchShell",
  "取得入口を選択しました",
  "target?.scrollIntoView",
  "data-import-connected-service-amazon-orders-execution-contract",
].forEach((needle) => {
  assert(page.includes(needle), `page contains marker: ${needle}`);
});

const shellStart = page.indexOf("function AmazonOrdersConnectedServicesShell");
assert(shellStart >= 0, "shell component found");
const shellEnd = page.indexOf("\n\nexport default function DataImportPage", shellStart);
assert(shellEnd > shellStart, "shell component scope end found");
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
  "setInterval(",
  "new Queue",
  "@Processor",
].forEach((forbidden) => {
  assert(!shellScope.includes(forbidden), `shell scope does not contain runtime marker: ${forbidden}`);
});

const buttonIndex = page.indexOf('data-testid="data-import-connected-service-amazon-orders-fetch-button"');
assert(buttonIndex >= 0, "fetch button exists");
const buttonScope = page.slice(buttonIndex, buttonIndex + 500);
assert(!buttonScope.includes("disabled"), "fetch button is no longer disabled");
assert(buttonScope.includes("onClick={onFetchShell}"), "fetch button calls shell handler prop");

const handlerStart = page.indexOf("function handleAmazonOrdersConnectedServiceFetchShell");
assert(handlerStart >= 0, "fetch shell handler exists");
const handlerEnd = page.indexOf("\n  const latestUpdatedAt", handlerStart);
assert(handlerEnd > handlerStart, "fetch shell handler scope end found");
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
].forEach((forbidden) => {
  assert(!handlerScope.includes(forbidden), `handler scope does not contain runtime marker: ${forbidden}`);
});

assert(
  pkg.scripts["smoke:step150-b-data-import-connected-services-shell"] ===
    "node scripts/smoke-step150-b-data-import-connected-services-shell.js",
  "package.json registers Step150-B smoke",
);

console.log("[SMOKE_OK] Step150-B/D Data Import connected services shell smoke passed");
