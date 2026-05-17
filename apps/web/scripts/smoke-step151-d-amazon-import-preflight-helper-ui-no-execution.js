const fs = require("fs");
const path = require("path");

const root = "/opt/ledgerseiri";
const web = path.join(root, "apps/web");
const apiPath = path.join(web, "src/core/imports/api.ts");
const pagePath = path.join(web, "src/app/[lang]/app/data/import/page.tsx");
const packagePath = path.join(web, "package.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function getNamedImportBlockBySource(source, modulePath) {
  const fromNeedle = `} from "${modulePath}";`;
  const fromIndex = source.indexOf(fromNeedle);
  assert(fromIndex >= 0, `import block found for ${modulePath}`);

  const importIndex = source.lastIndexOf("import {", fromIndex);
  assert(importIndex >= 0, `import start found for ${modulePath}`);

  return source.slice(importIndex, fromIndex + fromNeedle.length);
}

console.log("========== Step151-D smoke: frontend preflight helper + UI, no preview/import execution ==========");

const api = read(apiPath);
const page = read(pagePath);
const pkg = JSON.parse(read(packagePath));

[
  "Step151-D-FRONTEND-AMAZON-IMPORT-GUARDED-PREFLIGHT-HELPER",
  "AmazonSpApiOrdersGuardedImportPreflightRequest",
  "AmazonSpApiOrdersGuardedImportPreflightResponse",
  "AMAZON_SP_API_ORDERS_GUARDED_IMPORT_PREFLIGHT_ENDPOINT",
  '"/api/imports/amazon-sp-api/orders/guarded-import/preflight"',
  "preflightAmazonSpApiOrdersGuardedImport",
].forEach((needle) => {
  assert(api.includes(needle), `api.ts contains Step151-D marker: ${needle}`);
});

[
  "preflightAmazonSpApiOrdersGuardedImport",
  "AmazonSpApiOrdersGuardedImportPreflightResponse",
  "preflight_checking",
  "preflight_ready",
  "data-import-connected-service-amazon-orders-preflight-result",
  "data-import-connected-service-amazon-orders-preflight-allowed",
  "data-import-connected-service-amazon-orders-preflight-next-action",
  "data-import-connected-service-amazon-orders-preflight-reasons",
  "data-import-connected-service-amazon-orders-preflight-connection",
  "data-import-connected-service-amazon-orders-preflight-date-range",
  "data-import-connected-service-amazon-orders-preflight-boundaries",
  "data-import-connected-service-amazon-orders-preflight-error",
  "setAmazonOrdersFetchExecutionContractStatus(\"preflight_checking\")",
  "setAmazonOrdersFetchExecutionContractStatus(response.allowed ? \"preflight_ready\" : \"blocked\")",
].forEach((needle) => {
  assert(page.includes(needle), `Data Import page contains Step151-D marker: ${needle}`);
});

const jobsImportBlock = getNamedImportBlockBySource(page, "@/core/jobs");
const importsApiBlock = getNamedImportBlockBySource(page, "@/core/imports/api");

assert(
  !jobsImportBlock.includes("preflightAmazonSpApiOrdersGuardedImport"),
  "preflight helper must not be imported from @/core/jobs"
);
assert(
  !jobsImportBlock.includes("AmazonSpApiOrdersGuardedImportPreflightResponse"),
  "preflight response type must not be imported from @/core/jobs"
);
assert(
  importsApiBlock.includes("preflightAmazonSpApiOrdersGuardedImport"),
  "preflight helper is imported from @/core/imports/api"
);
assert(
  importsApiBlock.includes("AmazonSpApiOrdersGuardedImportPreflightResponse"),
  "preflight response type is imported from @/core/imports/api"
);
assert(
  (page.match(/from "@\/core\/imports\/api";/g) || []).length === 1,
  "Data Import page has exactly one @/core/imports/api import"
);
assert(
  (page.match(/from "@\/core\/jobs";/g) || []).length === 1,
  "Data Import page has exactly one @/core/jobs import"
);

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

[
  "preflightAmazonSpApiOrdersGuardedImport",
  "AMAZON_SP_API_ORDERS_GUARDED_IMPORT_PREFLIGHT_ENDPOINT",
].forEach((allowed) => {
  assert(api.includes(allowed), `preflight helper allowed marker exists: ${allowed}`);
});

assert(
  pkg.scripts["smoke:step151-d-amazon-import-preflight-helper-ui-no-execution"] ===
    "node scripts/smoke-step151-d-amazon-import-preflight-helper-ui-no-execution.js",
  "package.json registers Step151-D static smoke",
);

console.log("[SMOKE_OK] Step151-D frontend preflight helper/UI smoke passed");
