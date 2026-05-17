const fs = require("fs");
const path = require("path");

const root = "/opt/ledgerseiri";
const web = path.join(root, "apps/web");
const ordersPagePath = path.join(web, "src/app/[lang]/app/data/import/amazon-orders/page.tsx");
const packagePath = path.join(web, "package.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const page = fs.readFileSync(ordersPagePath, "utf8");
const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));

console.log("========== Step150-F smoke: order detail drawer interaction / layout polish ==========");

[
  "AmazonOrderDetailDrawerShell",
  "selectedOrder",
  "setSelectedOrder(row)",
  "onClose={() => setSelectedOrder(null)}",
  "amazon-orders-detail-list-row-detail-button",
  "amazon-orders-detail-drawer-shell",
  "amazon-orders-detail-drawer-overlay",
  "amazon-orders-detail-drawer-close-button",
  "amazon-orders-detail-drawer-order-id",
  "amazon-orders-detail-drawer-status-pill",
  "amazon-orders-detail-drawer-overview-grid",
  "amazon-orders-detail-drawer-marketplace",
  "amazon-orders-detail-drawer-items-placeholder-grid",
  "amazon-orders-detail-drawer-items-placeholder-row",
  "amazon-orders-detail-drawer-tax-fee-placeholder-grid",
  "amazon-orders-detail-drawer-inventory-readiness-grid",
  "amazon-orders-detail-drawer-import-status-card",
  'aria-modal="true"',
  'role="dialog"',
  "marketplace: string;",
  "skuStatus: string;",
  "importStatus: string;",
  "read-model接続後に表示",
  "商品税：—",
  "配送料税：—",
  "プロモーション：—",
  "Amazon手数料：—",
].forEach((needle) => {
  assert(page.includes(needle), `orders page contains drawer marker: ${needle}`);
});

const drawerStart = page.indexOf("function AmazonOrderDetailDrawerShell");
assert(drawerStart >= 0, "drawer component exists");
const drawerEnd = page.indexOf("\n\nexport default function AmazonOrdersImportListPage", drawerStart);
assert(drawerEnd > drawerStart, "drawer component scope end found");
const drawerScope = page.slice(drawerStart, drawerEnd);

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
  assert(!drawerScope.includes(forbidden), `drawer scope has no runtime marker: ${forbidden}`);
  assert(!page.includes(forbidden), `orders page has no runtime marker: ${forbidden}`);
});

assert(
  pkg.scripts["smoke:step150-f-amazon-order-detail-drawer-interaction-polish"] ===
    "node scripts/smoke-step150-f-amazon-order-detail-drawer-interaction-polish.js",
  "package.json registers Step150-F smoke",
);

console.log("[SMOKE_OK] Step150-F order detail drawer interaction/layout polish smoke passed");
