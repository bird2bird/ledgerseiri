const fs = require("fs");
const path = require("path");

const root = "/opt/ledgerseiri";
const web = path.join(root, "apps/web");
const api = path.join(root, "apps/api");

const panelPath = path.join(web, "src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx");
const apiHelperPath = path.join(web, "src/core/imports/api.ts");
const packagePath = path.join(web, "package.json");
const backendControllerPath = path.join(api, "src/imports/imports.controller.ts");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

console.log("========== Step149-N smoke: frontend disabled plan preview UI ==========");

const panel = read(panelPath);
const apiHelper = read(apiHelperPath);
const pkg = JSON.parse(read(packagePath));
const backendController = read(backendControllerPath);

[
  "AmazonSpApiOrdersHistoricalSyncPlanPreviewRequest",
  "AmazonSpApiOrdersHistoricalSyncPlanPreviewResponse",
  "AmazonSpApiOrdersHistoricalSyncPlanPreviewSegment",
  "AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_PLAN_PREVIEW_ENDPOINT",
  "previewAmazonSpApiOrdersHistoricalSyncPlan",
  "/api/imports/amazon-sp-api/orders/historical-sync/plan-preview",
].forEach((needle) => {
  assert(apiHelper.includes(needle), `api helper missing marker: ${needle}`);
});

[
  "previewAmazonSpApiOrdersHistoricalSyncPlan",
  "AmazonSpApiOrdersHistoricalSyncPlanPreviewResponse",
  "HistoricalSyncPlanPreviewStatus",
  "historicalSyncPlanStatus",
  "historicalSyncPlanMessage",
  "historicalSyncPlanPreview",
  "previewHistoricalSyncPlan",
  "setHistoricalSyncPlanStatus(\"loading\")",
  "setHistoricalSyncPlanStatus(\"success\")",
  "setHistoricalSyncPlanStatus(\"error\")",
  "amazon-sp-api-historical-sync-plan-preview-card",
  "amazon-sp-api-historical-sync-plan-preview-button",
  "amazon-sp-api-historical-sync-plan-preview-range",
  "amazon-sp-api-historical-sync-plan-preview-status",
  "amazon-sp-api-historical-sync-plan-preview-execution",
  "amazon-sp-api-historical-sync-plan-preview-db-write",
  "amazon-sp-api-historical-sync-plan-preview-summary",
  "amazon-sp-api-historical-sync-plan-preview-segment-count",
  "amazon-sp-api-historical-sync-plan-preview-segment-list",
  "amazon-sp-api-historical-sync-plan-preview-segment-row",
  "disabled / preview-only",
  "SyncJob作成・Amazon API取得・DB書き込みは行いません",
  "amazon-sp-api-historical-sync-plan-preview-warning",
  "amazon-sp-api-historical-sync-plan-preview-job-write",
  "amazon-sp-api-historical-sync-plan-preview-amazon-call",
  "amazon-sp-api-historical-sync-plan-preview-disabled-flag",
  "amazon-sp-api-historical-sync-plan-preview-total-days",
  "amazon-sp-api-historical-sync-plan-preview-max-pages",
  "amazon-sp-api-historical-sync-plan-preview-planning-mode",
  "amazon-sp-api-historical-sync-plan-preview-empty",
  "amazon-sp-api-historical-sync-plan-preview-segment-list-caption",
  "これは同期実行ではありません",
  "SyncJob / SyncSegment は作成されず",
].forEach((needle) => {
  assert(panel.includes(needle), `panel missing marker: ${needle}`);
});

[
  "runHistoricalSync",
  "runSegment",
  "createSyncJob",
  "createSyncSegment",
  "commitAmazonSpApiOrdersHistoricalSync",
  "executeHistoricalSync",
  "startsQueue",
  "new Queue",
  "@Processor",
  "setInterval(",
].forEach((forbidden) => {
  assert(!panel.includes(forbidden), `panel must not contain runtime marker: ${forbidden}`);
});

assert(
  panel.includes("syncStartDate: orderPullWindow.startDate") &&
    panel.includes("syncEndDate: orderPullWindow.endDate"),
  "panel must use selected date range for historical sync plan preview",
);

assert(
  backendController.includes("amazonSpApiOrdersHistoricalSyncDisabledPlanPreviewControllerRoute"),
  "Step149-M backend route must exist",
);

assert(
  pkg.scripts["smoke:step149-n-amazon-orders-historical-sync-disabled-plan-preview-ui"] ===
    "node scripts/smoke-step149-n-amazon-orders-historical-sync-disabled-plan-preview-ui.js",
  "package.json must register Step149-N smoke",
);

console.log("[SMOKE_OK] Step149-N frontend disabled plan preview UI smoke passed");
