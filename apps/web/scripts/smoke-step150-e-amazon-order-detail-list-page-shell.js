const fs = require("fs");
const path = require("path");

const root = "/opt/ledgerseiri";
const web = path.join(root, "apps/web");
const pagePath = path.join(web, "src/app/[lang]/app/data/import/amazon-orders/page.tsx");
const packagePath = path.join(web, "package.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const page = fs.readFileSync(pagePath, "utf8");
const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));

console.log("========== Step150-E smoke: Amazon order detail list page shell ==========");

[
  "amazon-orders-detail-list-page-shell",
  "Amazon注文 明細一覧",
  "amazon-orders-detail-list-back-link",
  "amazon-orders-detail-list-filter-shell",
  "amazon-orders-detail-list-table-shell",
  "amazon-orders-detail-list-row-shell",
  "amazon-orders-detail-list-row-detail-button",
  "AmazonOrderDetailDrawerShell",
  "amazon-orders-detail-drawer-shell",
  "amazon-orders-detail-drawer-close-button",
  "amazon-orders-detail-drawer-order-id",
  "amazon-orders-detail-drawer-overview-section",
  "amazon-orders-detail-drawer-items-section",
  "amazon-orders-detail-drawer-tax-fee-section",
  "amazon-orders-detail-drawer-inventory-readiness-section",
  "amazon-orders-detail-drawer-import-section",
].forEach((needle) => {
  assert(page.includes(needle), `orders page contains marker: ${needle}`);
});

const isStep150NO =
  page.includes("Step150-NO-FRONTEND-READ-MODEL-WIRING") &&
  page.includes("listAmazonImportedOrders") &&
  page.includes("getAmazonImportedOrderDetail");

if (isStep150NO) {
  [
    "Step150-NO-FRONTEND-READ-MODEL-WIRING",
    "amazon-orders-detail-list-read-model-status",
    "amazon-orders-detail-list-summary-read-model",
    "amazon-orders-detail-list-refresh-button",
    "amazon-orders-detail-list-loading",
    "amazon-orders-detail-list-error",
    "readonly read-model",
    "setSelectedOrder(null)",
    "setSelectedDetail(null)",
    'setDetailError("")',
  ].forEach((needle) => {
    assert(page.includes(needle), `orders page contains Step150-NO compatibility marker: ${needle}`);
  });

  assert(!page.includes("amazon-orders-detail-list-amount-filter"), "Step150-NO no longer requires old amount filter marker");
} else {
  [
    "AMAZON_ORDER_LIST_SHELL_ROWS",
    "amazon-orders-detail-list-range-summary",
    "amazon-orders-detail-list-amount-filter",
    "onClose={() => setSelectedOrder(null)}",
  ].forEach((needle) => {
    assert(page.includes(needle), `orders page contains Step150-E shell marker: ${needle}`);
  });
}

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
  assert(!page.includes(forbidden), `orders page has no forbidden runtime marker: ${forbidden}`);
});

assert(
  pkg.scripts["smoke:step150-e-amazon-order-detail-list-page-shell"] ===
    "node scripts/smoke-step150-e-amazon-order-detail-list-page-shell.js",
  "package.json registers Step150-E smoke",
);

console.log("[SMOKE_OK] Step150-E Amazon order detail list page shell smoke passed");
