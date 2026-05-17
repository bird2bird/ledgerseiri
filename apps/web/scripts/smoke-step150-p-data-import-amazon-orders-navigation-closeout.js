const fs = require("fs");
const path = require("path");

const root = "/opt/ledgerseiri";
const web = path.join(root, "apps/web");
const dataImportPagePath = path.join(web, "src/app/[lang]/app/data/import/page.tsx");
const amazonOrdersPagePath = path.join(web, "src/app/[lang]/app/data/import/amazon-orders/page.tsx");
const apiPath = path.join(web, "src/core/imports/api.ts");
const packagePath = path.join(web, "package.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

console.log("========== Step150-P smoke: Data Import → Amazon orders navigation closeout ==========");

const dataImportPage = read(dataImportPagePath);
const amazonOrdersPage = read(amazonOrdersPagePath);
const api = read(apiPath);
const pkg = JSON.parse(read(packagePath));

[
  "data-import-connected-services-shell",
  "data-import-connected-service-amazon-orders-row",
  "data-import-connected-service-amazon-orders-view-link",
  'href="/ja/app/data/import/amazon-orders"',
  "data-import-connected-service-amazon-orders-fetch-button",
  "data-import-connected-service-amazon-orders-range-rule",
  "data-import-connected-service-amazon-orders-fetch-shell-message",
].forEach((needle) => {
  assert(dataImportPage.includes(needle), `Data Import page contains navigation marker: ${needle}`);
});

[
  "Step150-NO-FRONTEND-READ-MODEL-WIRING",
  "amazon-orders-detail-list-page-shell",
  "amazon-orders-detail-list-back-link",
  "amazon-orders-detail-list-read-model-status",
  "amazon-orders-detail-list-summary-read-model",
  "amazon-orders-detail-list-refresh-button",
  "amazon-orders-detail-list-table-shell",
  "amazon-orders-detail-list-row-detail-button",
  "amazon-orders-detail-drawer-shell",
  "readonly read-model",
].forEach((needle) => {
  assert(amazonOrdersPage.includes(needle), `Amazon orders page contains closeout marker: ${needle}`);
});

[
  "AMAZON_IMPORTED_ORDERS_READ_MODEL_ENDPOINT",
  "AMAZON_IMPORTED_ORDER_DETAIL_READ_MODEL_ENDPOINT",
  '"/api/imports/amazon-sp-api/orders/imported/read-model"',
  '"/api/imports/amazon-sp-api/orders/imported/read-model/detail"',
  "listAmazonImportedOrders",
  "getAmazonImportedOrderDetail",
  'credentials: "include"',
  'cache: "no-store"',
].forEach((needle) => {
  assert(api.includes(needle), `frontend API contains readonly helper marker: ${needle}`);
});

[
  "previewAmazonSpApiOrdersReal(",
  "commitAmazonSpApiOrdersRealImportJob(",
  "previewAmazonSpApiOrdersHistoricalSyncPlan(",
  "runHistoricalSync",
  "createSyncJob",
  "createSyncSegment",
  "postJson<",
  "real-preview",
  "real-importjob",
  "historical-sync/plan-preview",
].forEach((forbidden) => {
  assert(!amazonOrdersPage.includes(forbidden), `Amazon orders page has no forbidden marker: ${forbidden}`);
});

[
  "commitAmazonSpApiOrdersRealImportJob(",
  "runHistoricalSync",
  "createSyncJob",
  "createSyncSegment",
].forEach((forbidden) => {
  assert(!dataImportPage.includes(forbidden), `Data Import connected-services shell has no forbidden marker: ${forbidden}`);
});

assert(
  pkg.scripts["smoke:step150-p-data-import-amazon-orders-navigation-closeout"] ===
    "node scripts/smoke-step150-p-data-import-amazon-orders-navigation-closeout.js",
  "package.json registers Step150-P navigation closeout smoke",
);

console.log("[SMOKE_OK] Step150-P Data Import navigation closeout smoke passed");
