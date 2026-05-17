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

console.log("========== Step150-F smoke: order detail drawer interaction / layout polish ==========");

[
  "AmazonOrderDetailDrawerShell",
  "selectedOrder",
  "handleSelectOrder",
  "amazon-orders-detail-list-row-detail-button",
  "amazon-orders-detail-drawer-shell",
  "amazon-orders-detail-drawer-overlay",
  "amazon-orders-detail-drawer-close-button",
  "amazon-orders-detail-drawer-order-id",
  "amazon-orders-detail-drawer-status-pill",
  "amazon-orders-detail-drawer-overview-grid",
  "amazon-orders-detail-drawer-marketplace",
  "amazon-orders-detail-drawer-items-placeholder-grid",
  "amazon-orders-detail-drawer-tax-fee-placeholder-grid",
  "amazon-orders-detail-drawer-inventory-readiness-grid",
  "amazon-orders-detail-drawer-import-status-card",
  'aria-modal="true"',
  'role="dialog"',
].forEach((needle) => {
  assert(page.includes(needle), `orders page contains drawer marker: ${needle}`);
});

const isStep150NO =
  page.includes("Step150-NO-FRONTEND-READ-MODEL-WIRING") &&
  page.includes("getAmazonImportedOrderDetail");

if (isStep150NO) {
  [
    "amazon-orders-detail-drawer-loading",
    "amazon-orders-detail-drawer-error",
    "amazon-orders-detail-drawer-items-read-model-row",
    "readonly read-model",
    "setSelectedOrder(null)",
    "setSelectedDetail(null)",
    'setDetailError("")',
  ].forEach((needle) => {
    assert(page.includes(needle), `orders page contains Step150-NO drawer marker: ${needle}`);
  });
} else {
  [
    "setSelectedOrder(row)",
    "onClose={() => setSelectedOrder(null)}",
    "amazon-orders-detail-drawer-items-placeholder-row",
    "read-model接続後に表示",
    "商品税：—",
    "配送料税：—",
    "プロモーション：—",
    "Amazon手数料：—",
  ].forEach((needle) => {
    assert(page.includes(needle), `orders page contains Step150-F drawer marker: ${needle}`);
  });
}

const drawerStart = page.indexOf("function AmazonOrderDetailDrawerShell");
assert(drawerStart >= 0, "drawer component exists");
const drawerEnd = page.indexOf("\n\nexport default function AmazonOrdersImportListPage", drawerStart);
assert(drawerEnd > drawerStart, "drawer component scope end found");
const drawerScope = page.slice(drawerStart, drawerEnd);

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
  assert(!drawerScope.includes(forbidden), `drawer scope has no forbidden marker: ${forbidden}`);
  assert(!page.includes(forbidden), `orders page has no forbidden marker: ${forbidden}`);
});

assert(
  pkg.scripts["smoke:step150-f-amazon-order-detail-drawer-interaction-polish"] ===
    "node scripts/smoke-step150-f-amazon-order-detail-drawer-interaction-polish.js",
  "package.json registers Step150-F smoke",
);

console.log("[SMOKE_OK] Step150-F order detail drawer interaction/layout polish smoke passed");
