const fs = require("fs");
const path = require("path");

const root = "/opt/ledgerseiri";
const web = path.join(root, "apps/web");
const ordersPagePath = path.join(web, "src/app/[lang]/app/data/import/amazon-orders/page.tsx");
const dataImportPagePath = path.join(web, "src/app/[lang]/app/data/import/page.tsx");
const packagePath = path.join(web, "package.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

console.log("========== Step150-E smoke: Amazon order detail list page shell ==========");

const page = read(ordersPagePath);
const dataImportPage = read(dataImportPagePath);
const pkg = JSON.parse(read(packagePath));

[
  "amazon-orders-detail-list-page-shell",
  "Amazon注文 明細一覧",
  "amazon-orders-detail-list-back-link",
  "amazon-orders-detail-list-filter-shell",
  "amazon-orders-detail-list-range-summary",
  "amazon-orders-detail-list-order-id-filter",
  "amazon-orders-detail-list-status-filter",
  "amazon-orders-detail-list-content-filter",
  "amazon-orders-detail-list-amount-filter",
  "amazon-orders-detail-list-table-shell",
  "amazon-orders-detail-list-row-shell",
  "amazon-orders-detail-list-row-detail-button",
  "amazon-orders-detail-list-empty-state",
  "amazon-orders-detail-drawer-shell",
  "amazon-orders-detail-drawer-close-button",
  "amazon-orders-detail-drawer-overview-section",
  "amazon-orders-detail-drawer-items-section",
  "amazon-orders-detail-drawer-tax-fee-section",
  "amazon-orders-detail-drawer-inventory-readiness-section",
  "amazon-orders-detail-drawer-import-section",
  "日付",
  "内容",
  "金額",
  "連携サービス",
  "ステータス",
  "Order ID",
  "詳細",
  "商品明細",
  "税金・手数料",
  "在庫連携 readiness",
  "インポート情報",
  "shell-only",
].forEach((needle) => {
  assert(page.includes(needle), `orders page contains marker: ${needle}`);
});

assert(
  dataImportPage.includes('href="/ja/app/data/import/amazon-orders"'),
  "Data Import connected services row links to amazon-orders page",
);

[
  "previewAmazonSpApiOrdersReal(",
  "commitAmazonSpApiOrdersRealImportJob(",
  "previewAmazonSpApiOrdersHistoricalSyncPlan(",
  "readAmazon",
  "fetch(",
  "postJson",
  "loadImportJobsPageSnapshot(",
  "runHistoricalSync",
  "runSegment",
  "createSyncJob",
  "createSyncSegment",
  "transaction.create(",
  "inventoryMovement.create(",
  "new Queue",
  "@Processor",
].forEach((forbidden) => {
  assert(!page.includes(forbidden), `orders page has no runtime marker: ${forbidden}`);
});

assert(
  pkg.scripts["smoke:step150-e-amazon-order-detail-list-page-shell"] ===
    "node scripts/smoke-step150-e-amazon-order-detail-list-page-shell.js",
  "package.json registers Step150-E smoke",
);

console.log("[SMOKE_OK] Step150-E Amazon order detail list page shell smoke passed");
