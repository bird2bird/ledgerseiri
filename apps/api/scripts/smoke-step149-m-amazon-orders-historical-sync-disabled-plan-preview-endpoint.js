const fs = require("fs");
const path = require("path");

const root = "/opt/ledgerseiri";
const api = path.join(root, "apps/api");

const controllerPath = path.join(api, "src/imports/imports.controller.ts");
const dtoPath = path.join(
  api,
  "src/imports/dto/amazon-sp-api-orders-historical-sync-disabled-plan-preview-controller-contract.dto.ts",
);
const workerPath = path.join(api, "src/imports/amazon-sp-api-orders-historical-sync.worker.disabled.ts");
const testDoubleRepositoryPath = path.join(
  api,
  "src/imports/amazon-sp-api-orders-historical-sync.repository.test-double.ts",
);
const packagePath = path.join(api, "package.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function extractStep149MPreviewRouteScope(controller) {
  const methodName = "amazonSpApiOrdersHistoricalSyncDisabledPlanPreviewControllerRoute";
  const start = controller.indexOf(methodName);
  if (start < 0) return "";
  const nextMarker = "\n\n  // Step122-O:";
  const end = controller.indexOf(nextMarker, start);
  return controller.slice(start, end > start ? end : start + 7000);
}

console.log("========== Step149-M smoke: disabled backend plan preview endpoint ==========");

const controller = read(controllerPath);
const dto = read(dtoPath);
const worker = read(workerPath);
const testDoubleRepository = read(testDoubleRepositoryPath);
const pkg = JSON.parse(read(packagePath));

[
  "Step149-M",
  "disabled-planning-preview-only",
  "callsDisabledWorkerPlan: true",
  "callsRunHistoricalSync: false",
  "callsRunSegment: false",
  "callsAmazon: false",
  "writesDatabase: false",
  "writesSyncJob: false",
  "writesSyncSegment: false",
  "writesImportJob: false",
  "writesImportStagingRow: false",
  "writesTransaction: false",
  "writesInventoryMovement: false",
  "startsScheduler: false",
  "startsQueue: false",
  "frontendWiredNow: false",
  "AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_DISABLED_PLAN_PREVIEW_CONTROLLER_CONTRACT",
].forEach((needle) => {
  assert(dto.includes(needle), `DTO missing marker: ${needle}`);
});

[
  "amazonSpApiOrdersHistoricalSyncDisabledPlanPreviewControllerRoute",
  "@UseGuards(JwtAuthGuard)",
  "@Post('amazon-sp-api/orders/historical-sync/plan-preview')",
  "AmazonSpApiOrdersHistoricalSyncDisabledPlanPreviewRouteBody",
  "AmazonSpApiOrdersHistoricalSyncDisabledPlanPreviewRouteResponse",
  "createAmazonSpApiOrdersHistoricalSyncRepositoryTestDouble",
  "createAmazonSpApiOrdersHistoricalSyncWorkerDisabled",
  "worker.planHistoricalSync",
  "accepted: false",
  "disabled: true",
  "callsRunHistoricalSync: contract.callsRunHistoricalSync",
  "callsRunSegment: contract.callsRunSegment",
  "callsAmazon: contract.callsAmazon",
  "writesDatabase: contract.writesDatabase",
  "writesImportJob: contract.writesImportJob",
  "writesImportStagingRow: contract.writesImportStagingRow",
  "writesTransaction: contract.writesTransaction",
  "writesInventoryMovement: contract.writesInventoryMovement",
].forEach((needle) => {
  assert(controller.includes(needle), `controller missing marker: ${needle}`);
});

const routeScope = extractStep149MPreviewRouteScope(controller);
assert(routeScope, "route scope not found");

[
  "runHistoricalSync(",
  "runSegment(",
  "previewAmazonSpApiOrdersReal",
  "buildAmazonSpApiOrdersServerOnlyRawSignedTransport",
  "persistAmazonSpApiOrdersRealPreviewToImportJobAndStagingRows",
  "prismaService.",
  "amazonSpApiOrderSyncJob.",
  "amazonSpApiOrderSyncSegment.",
  "transaction.create(",
  "inventoryMovement.create(",
  "importJob.create(",
  "importStagingRow.create",
  "@Cron",
  "CronExpression",
  "ScheduleModule",
  "setInterval(",
  "BullModule",
  "new Queue",
  "@Processor",
].forEach((forbidden) => {
  assert(!routeScope.includes(forbidden), `plan preview route must not contain forbidden marker: ${forbidden}`);
});

[
  "planAmazonOrdersHistoricalSyncWindows",
  "planningMode: 'planner_integrated_but_runtime_disabled'",
  "wouldCreateSyncJob: false",
  "wouldCreateSegments: false",
  "wouldCallAmazon: false",
  "wouldWriteDatabase: false",
].forEach((needle) => {
  assert(worker.includes(needle), `Step149-L worker missing marker: ${needle}`);
});

assert(
  testDoubleRepository.includes("createAmazonSpApiOrdersHistoricalSyncRepositoryTestDouble"),
  "test-double repository factory must exist",
);

assert(
  pkg.scripts["smoke:step149-m-amazon-orders-historical-sync-disabled-plan-preview-endpoint"] ===
    "node scripts/smoke-step149-m-amazon-orders-historical-sync-disabled-plan-preview-endpoint.js",
  "package.json must register Step149-M smoke",
);

require("ts-node/register/transpile-only");

const {
  buildAmazonSpApiOrdersHistoricalSyncDisabledPlanPreviewControllerContract,
  assertAmazonSpApiOrdersHistoricalSyncDisabledPlanPreviewControllerContract,
} = require("../src/imports/dto/amazon-sp-api-orders-historical-sync-disabled-plan-preview-controller-contract.dto");
const {
  createAmazonSpApiOrdersHistoricalSyncRepositoryTestDouble,
} = require("../src/imports/amazon-sp-api-orders-historical-sync.repository.test-double");
const {
  createAmazonSpApiOrdersHistoricalSyncWorkerDisabled,
} = require("../src/imports/amazon-sp-api-orders-historical-sync.worker.disabled");

const contract = assertAmazonSpApiOrdersHistoricalSyncDisabledPlanPreviewControllerContract(
  buildAmazonSpApiOrdersHistoricalSyncDisabledPlanPreviewControllerContract(),
);

assert(contract.callsDisabledWorkerPlan === true, "contract must call disabled worker plan");
assert(contract.callsRunHistoricalSync === false, "contract must not run sync");
assert(contract.callsRunSegment === false, "contract must not run segment");
assert(contract.callsAmazon === false, "contract must not call Amazon");
assert(contract.writesDatabase === false, "contract must not write DB");
assert(contract.writesSyncJob === false, "contract must not write sync job");
assert(contract.writesSyncSegment === false, "contract must not write sync segment");

(async () => {
  const repository = createAmazonSpApiOrdersHistoricalSyncRepositoryTestDouble();
  const worker = createAmazonSpApiOrdersHistoricalSyncWorkerDisabled(repository);

  const plan = worker.planHistoricalSync({
    companyId: "company_001",
    storeId: "store_001",
    marketplaceId: "A1VC38T7YXB528",
    region: "JP",
    syncStartDate: "2026-01-01",
    syncEndDate: "2026-01-31",
    requestedByUserId: "user_001",
    segmentDays: 7,
  });

  assert(plan.accepted === false, "preview plan must remain accepted=false");
  assert(plan.disabled === true, "preview plan must remain disabled=true");
  assert(plan.planningMode === "planner_integrated_but_runtime_disabled", "planning mode mismatch");
  assert(plan.plannedSegments.length === 5, "January 2026 should produce 5 planning-only segments");
  assert(plan.wouldCreateSyncJob === false, "preview must not create sync job");
  assert(plan.wouldCreateSegments === false, "preview must not create segments");
  assert(plan.wouldCallAmazon === false, "preview must not call Amazon");
  assert(plan.wouldWriteDatabase === false, "preview must not write DB");

  const jobs = await repository.listSyncJobsByCompany({ companyId: "company_001" });
  assert(jobs.length === 0, "preview endpoint path must not create repository jobs");

  console.log("[SMOKE_OK] Step149-M disabled backend plan preview endpoint smoke passed");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
