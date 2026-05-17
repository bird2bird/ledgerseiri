const fs = require("fs");
const path = require("path");

const root = "/opt/ledgerseiri";
const web = path.join(root, "apps/web");
const pagePath = path.join(web, "src/app/[lang]/app/data/import/amazon-orders/page.tsx");
const apiPath = path.join(web, "src/core/imports/api.ts");
const packagePath = path.join(web, "package.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

console.log("========== Step150-NO smoke: frontend imported orders read-model page wiring ==========");

const page = read(pagePath);
const api = read(apiPath);
const pkg = JSON.parse(read(packagePath));

[
  "Step150-NO-FRONTEND-READ-MODEL-WIRING",
  "listAmazonImportedOrders",
  "getAmazonImportedOrderDetail",
  "AmazonImportedOrdersReadModelOrderRow",
  "AmazonImportedOrderDetailCompat",
  "loadOrders",
  "handleSelectOrder",
  "normalizeDetailResponse",
  "amazon-orders-detail-list-read-model-status",
  "amazon-orders-detail-list-summary-read-model",
  "amazon-orders-detail-list-refresh-button",
  "amazon-orders-detail-list-loading",
  "amazon-orders-detail-list-error",
  "amazon-orders-detail-drawer-loading",
  "amazon-orders-detail-drawer-error",
  "amazon-orders-detail-drawer-items-read-model-row",
  "readonly read-model",
].forEach((needle) => {
  assert(page.includes(needle), `page contains wiring marker: ${needle}`);
});

[
  "detail?: {",
  "order?: AmazonImportedOrdersReadModelOrderRow",
  "items?: AmazonImportedOrderDetailReadModelItemRow",
  "AMAZON_IMPORTED_ORDERS_READ_MODEL_ENDPOINT",
  "AMAZON_IMPORTED_ORDER_DETAIL_READ_MODEL_ENDPOINT",
].forEach((needle) => {
  assert(api.includes(needle), `api contains NO compatibility marker: ${needle}`);
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
  assert(!page.includes(forbidden), `page has no forbidden runtime marker: ${forbidden}`);
});

assert(
  pkg.scripts["smoke:step150-no-amazon-imported-orders-read-model-page-wiring"] ===
    "node scripts/smoke-step150-no-amazon-imported-orders-read-model-page-wiring.js",
  "package.json registers Step150-NO wiring smoke",
);

console.log("[SMOKE_OK] Step150-NO frontend read-model page wiring smoke passed");
