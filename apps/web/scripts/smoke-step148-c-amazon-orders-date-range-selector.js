const fs = require("fs");
const path = require("path");

const root = "/opt/ledgerseiri";
const web = path.join(root, "apps/web");
const panelPath = path.join(web, "src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx");
const apiPath = path.join(web, "src/core/imports/api.ts");
const pkgPath = path.join(web, "package.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const panel = fs.readFileSync(panelPath, "utf8");
const api = fs.readFileSync(apiPath, "utf8");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

console.log("========== Step148-C-FIX1 smoke ==========");

[
  "type AmazonOrdersPullRangePreset",
  "AMAZON_ORDER_PULL_RANGE_PRESETS",
  "最近7日",
  "最近14日",
  "最近30日",
  "今月",
  "先月",
  "カスタム期間",
  "buildAmazonOrderPullWindowFromPreset",
  "data-testid=\"amazon-sp-api-orders-date-range-selector\"",
  "data-testid=\"amazon-sp-api-orders-date-range-display\"",
  "data-testid=\"amazon-sp-api-orders-custom-start-date\"",
  "data-testid=\"amazon-sp-api-orders-custom-end-date\"",
  "orderPullRangePreset",
  "customOrderPullStartDate",
  "customOrderPullEndDate",
  "startDate: orderPullWindow.startDate",
  "endDate: orderPullWindow.endDate",
  "days: orderPullWindow.days",
  "amazon-sp-api-fetch-orders-button",
  "amazon-sp-api-create-importjob-button",
].forEach((needle) => {
  assert(panel.includes(needle), `panel missing ${needle}`);
});

assert((panel.match(/startDate: orderPullWindow\.startDate/g) || []).length >= 2, "both preview and importjob payloads need startDate");
assert((panel.match(/endDate: orderPullWindow\.endDate/g) || []).length >= 2, "both preview and importjob payloads need endDate");

[
  "export type AmazonSpApiOrdersRealPreviewRequest",
  "createdAfter: string;",
  "createdBefore?: string;",
  "startDate?: string;",
  "endDate?: string;",
  "days?: number;",
  "export type AmazonSpApiOrdersRealImportJobCommitRequest = AmazonSpApiOrdersRealPreviewRequest",
].forEach((needle) => {
  assert(api.includes(needle), `api helper missing ${needle}`);
});

assert(
  pkg.scripts["smoke:step148-c-amazon-orders-date-range-selector"] ===
    "node scripts/smoke-step148-c-amazon-orders-date-range-selector.js",
  "package script missing"
);

[
  "transaction.create(",
  "inventoryMovement.create(",
  "bank reconciliation",
].forEach((forbidden) => {
  assert(!panel.includes(forbidden), `forbidden text found in panel: ${forbidden}`);
});

console.log("[SMOKE_OK] Step148-C-FIX1 frontend date range selector smoke passed");
