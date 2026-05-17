const fs = require("fs");
const path = require("path");

const root = "/opt/ledgerseiri";
const web = path.join(root, "apps/web");
const panelPath = path.join(web, "src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx");
const pkgPath = path.join(web, "package.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const panel = fs.readFileSync(panelPath, "utf8");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

console.log("========== Step150-C smoke: standardized 7/30/90/365/custom range selector ==========");

const presetBlockMatch = panel.match(/const AMAZON_ORDER_PULL_RANGE_PRESETS:[\s\S]*?\];/);
assert(presetBlockMatch, "preset block exists");
const presetBlock = presetBlockMatch[0];

[
  '{ value: "7D", label: "最近7日" }',
  '{ value: "30D", label: "最近30日" }',
  '{ value: "90D", label: "最近90日" }',
  '{ value: "365D", label: "最近365日" }',
  '{ value: "CUSTOM", label: "カスタム期間" }',
].forEach((needle) => {
  assert(presetBlock.includes(needle), `preset block contains ${needle}`);
});

[
  '"14D"',
  '"THIS_MONTH"',
  '"LAST_MONTH"',
  "最近14日",
  "今月",
  "先月",
].forEach((forbidden) => {
  assert(!presetBlock.includes(forbidden), `preset block removed ${forbidden}`);
  assert(!panel.includes(forbidden), `panel removed old range marker ${forbidden}`);
});

[
  'if (preset === "7D") return 7;',
  'if (preset === "30D") return 30;',
  'if (preset === "90D") return 90;',
  'if (preset === "365D") return 365;',
  'React.useState<AmazonOrdersPullRangePreset>("7D")',
  "buildDefaultAmazonOrderPullWindow(now = new Date())",
  'buildAmazonOrderPullWindowFromPreset("7D", "", "", now)',
  'return buildAmazonOrderPullWindowFromPreset("7D", customStartDate, customEndDate, now);',
  'data-testid="amazon-sp-api-orders-custom-start-date"',
  'data-testid="amazon-sp-api-orders-custom-end-date"',
].forEach((needle) => {
  assert(panel.includes(needle), `panel contains ${needle}`);
});

[
  "runHistoricalSync",
  "runSegment",
  "createSyncJob",
  "createSyncSegment",
  "new Queue",
  "@Processor",
  "transaction.create(",
  "inventoryMovement.create(",
].forEach((forbidden) => {
  assert(!panel.includes(forbidden), `panel has no runtime forbidden marker ${forbidden}`);
});

assert(
  pkg.scripts["smoke:step150-c-amazon-orders-range-selector-standardization"] ===
    "node scripts/smoke-step150-c-amazon-orders-range-selector-standardization.js",
  "package.json registers Step150-C smoke",
);

console.log("[SMOKE_OK] Step150-C standardized Amazon orders range selector smoke passed");
