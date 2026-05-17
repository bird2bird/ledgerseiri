const fs = require("fs");
const path = require("path");

const root = "/opt/ledgerseiri";
const web = path.join(root, "apps/web");
const pagePath = path.join(web, "src/app/[lang]/app/data/import/page.tsx");
const packagePath = path.join(web, "package.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

console.log("========== Step151-B smoke: Data Import fetch button execution contract, no execution ==========");

const page = read(pagePath);
const pkg = JSON.parse(read(packagePath));

[
  "Step151-B-FETCH-BUTTON-EXECUTION-CONTRACT",
  "AmazonOrdersFetchExecutionContractStatus",
  "AMAZON_ORDERS_FETCH_EXECUTION_CONTRACT_STEPS",
  "preflight_required",
  "preview_required",
  "confirmation_required",
  "blocked",
  "data-import-connected-service-amazon-orders-fetch-button",
  "data-import-connected-service-amazon-orders-execution-contract",
  "data-import-connected-service-amazon-orders-execution-contract-copy",
  "data-import-connected-service-amazon-orders-execution-contract-status",
  "data-import-connected-service-amazon-orders-execution-contract-steps",
  "data-import-connected-service-amazon-orders-execution-contract-step-${step.key}",
  "data-import-connected-service-amazon-orders-execution-contract-boundaries",
  "callsAmazon=false",
  "createsImportJob=false",
  "writesDatabase=false",
  "writesTransaction=false",
  "writesInventoryMovement=false",
  "requiresExplicitConfirmation=true",
  "setAmazonOrdersFetchExecutionContractStatus",
].forEach((needle) => {
  assert(page.includes(needle), `Data Import page contains Step151-B marker: ${needle}`);
});

const isStep151D =
  page.includes("preflightAmazonSpApiOrdersGuardedImport") &&
  page.includes("setAmazonOrdersFetchExecutionContractStatus(\"preflight_checking\")") &&
  page.includes("setAmazonOrdersFetchExecutionContractStatus(response.allowed ? \"preflight_ready\" : \"blocked\")");

if (isStep151D) {
  [
    "preflight_checking",
    "preflight_ready",
    "preflightAmazonSpApiOrdersGuardedImport",
    "data-import-connected-service-amazon-orders-preflight-result",
    "data-import-connected-service-amazon-orders-preflight-allowed",
    "data-import-connected-service-amazon-orders-preflight-next-action",
    "data-import-connected-service-amazon-orders-preflight-boundaries",
  ].forEach((needle) => {
    assert(page.includes(needle), `Data Import page contains Step151-D compatibility marker: ${needle}`);
  });
} else {
  assert(
    page.includes("setAmazonOrdersFetchExecutionContractStatus(\"preflight_required\")"),
    "Data Import page contains Step151-B preflight_required marker before Step151-D"
  );
}

[
  "previewAmazonSpApiOrdersReal(",
  "commitAmazonSpApiOrdersRealImportJob(",
  "previewAmazonSpApiOrdersHistoricalSyncPlan(",
  "previewAmazonSpApiOrdersDryRun(",
  "real-preview",
  "real-importjob",
  "historical-sync/plan-preview",
  "runHistoricalSync",
  "createSyncJob",
  "createSyncSegment",
  "transaction.create",
  "inventoryMovement.create",
].forEach((forbidden) => {
  assert(!page.includes(forbidden), `Data Import page has no forbidden execution marker: ${forbidden}`);
});

assert(
  pkg.scripts["smoke:step151-b-data-import-fetch-button-execution-contract-no-execution"] ===
    "node scripts/smoke-step151-b-data-import-fetch-button-execution-contract-no-execution.js",
  "package.json registers Step151-B smoke",
);

console.log("[SMOKE_OK] Step151-B Data Import fetch button execution contract smoke passed");
