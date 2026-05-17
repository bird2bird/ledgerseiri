const fs = require("fs");
const path = require("path");

const root = "/opt/ledgerseiri";
const web = path.join(root, "apps/web");
const pagePathFile = "/root/.ledgerseiri_step150_b_data_import_page_path.tmp";
const packagePath = path.join(web, "package.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

console.log("========== Step150-B smoke: Data Import connected services shell ==========");

const pagePath = read(pagePathFile).trim();
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
  "shell-only",
  "href=\"/ja/app/data/import/amazon-orders\"",
  "disabled",
].forEach((needle) => {
  assert(page.includes(needle), `page contains marker: ${needle}`);
});

const shellStart = page.indexOf("function AmazonOrdersConnectedServicesShell()");
assert(shellStart >= 0, "shell component found");
const shellEnd = page.indexOf("\n\n", shellStart + 1000) > shellStart
  ? page.indexOf("\n\n", shellStart + 1000)
  : Math.min(page.length, shellStart + 9000);
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

assert(
  pkg.scripts["smoke:step150-b-data-import-connected-services-shell"] ===
    "node scripts/smoke-step150-b-data-import-connected-services-shell.js",
  "package.json registers Step150-B smoke",
);

console.log("[SMOKE_OK] Step150-B Data Import connected services shell smoke passed");
