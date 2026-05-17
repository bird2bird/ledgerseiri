const fs = require("fs");
const path = require("path");

const root = "/opt/ledgerseiri";
const api = path.join(root, "apps/api");

const workerContractPath = path.join(
  api,
  "src/imports/dto/amazon-sp-api-orders-historical-sync-worker-disabled-contract.dto.ts",
);
const workerPath = path.join(api, "src/imports/amazon-sp-api-orders-historical-sync.worker.disabled.ts");
const plannerPath = path.join(api, "src/imports/amazon-sp-api-orders-historical-sync-window-planner.ts");
const controllerPath = path.join(api, "src/imports/imports.controller.ts");
const packagePath = path.join(api, "package.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function extractStep149MPreviewRouteScope(controller) {
  const start = controller.indexOf("amazonSpApiOrdersHistoricalSyncDisabledPlanPreviewControllerRoute");
  if (start < 0) return "";
  const marker = "\n\n  // Step122-O:";
  const end = controller.indexOf(marker, start);
  return controller.slice(start, end > start ? end : start + 7000);
}

console.log("========== Step149-L smoke: planner integrated into disabled worker planning path ==========");

const workerContract = read(workerContractPath);
const worker = read(workerPath);
const planner = read(plannerPath);
const controller = read(controllerPath);
const pkg = JSON.parse(read(packagePath));

[
  "plannerIntegratedIntoDisabledPlan: true",
  "planningMode: 'planner_integrated_but_runtime_disabled'",
  "AmazonSpApiOrdersHistoricalSyncNormalizedDateRange",
  "AmazonSpApiOrdersHistoricalSyncPaginationPolicy",
  "AmazonSpApiOrdersHistoricalSyncWindowSegment",
].forEach((needle) => {
  assert(workerContract.includes(needle), `worker contract missing Step149-L marker: ${needle}`);
});

[
  "planAmazonOrdersHistoricalSyncWindows",
  "planningMode: 'planner_integrated_but_runtime_disabled'",
  "normalizedRange: windowPlan.normalizedRange",
  "paginationPolicy: windowPlan.paginationPolicy",
  "plannedSegments: windowPlan.segments",
  "accepted: false",
  "disabled: true",
  "wouldCreateSyncJob: false",
  "wouldCreateSegments: false",
  "wouldCallAmazon: false",
  "wouldWriteDatabase: false",
].forEach((needle) => {
  assert(worker.includes(needle), `worker missing Step149-L marker: ${needle}`);
});

[
  "normalizeHistoricalSyncDateRange",
  "planAmazonOrdersHistoricalSyncWindows",
  "buildInitialPaginationCursor",
  "advancePaginationCursor",
].forEach((needle) => {
  assert(planner.includes(needle), `planner missing marker: ${needle}`);
});

[
  "repository.createSyncJob",
  "repository.createSyncSegment",
  "this.repository.createSyncJob",
  "this.repository.createSyncSegment",
  "this.repository.getSyncJobById",
  "this.repository.listSyncSegmentsByJobId",
  "previewAmazonSpApiOrdersReal",
  "buildAmazonSpApiOrdersServerOnlyRawSignedTransport",
  "PrismaClient",
  "amazonSpApiOrderSyncJob.",
  "amazonSpApiOrderSyncSegment.",
  "transaction.create(",
  "inventoryMovement.create(",
  "importJob.create(",
  "importStagingRow.create",
  "setInterval(",
  "while (true)",
  "for (;;)",
  "@Cron",
  "CronExpression",
  "ScheduleModule",
  "BullModule",
  "new Queue",
  "@Processor",
].forEach((forbidden) => {
  assert(!worker.includes(forbidden), `worker must not contain runtime marker: ${forbidden}`);
});

assert(
  controller.includes("amazonSpApiOrdersHistoricalSyncDisabledControllerRoute"),
  "Step149-C disabled controller route must remain present",
);

const step149MPreviewRouteScope = extractStep149MPreviewRouteScope(controller);

if (step149MPreviewRouteScope) {
  assert(
    step149MPreviewRouteScope.includes("worker.planHistoricalSync"),
    "Step149-M route must call worker.planHistoricalSync",
  );

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
    assert(!step149MPreviewRouteScope.includes(forbidden), `Step149-M preview route must remain no-runtime: ${forbidden}`);
  });
} else {
  assert(
    !controller.includes("planAmazonOrdersHistoricalSyncWindows") &&
      !controller.includes("AmazonSpApiOrdersHistoricalSyncWorkerDisabled") &&
      !controller.includes("createAmazonSpApiOrdersHistoricalSyncWorkerDisabled") &&
      !controller.includes("amazon-sp-api-orders-historical-sync-window-planner"),
    "pre-Step149-M controller must not wire planner/worker",
  );
}

[
  "@Cron",
  "CronExpression",
  "ScheduleModule",
  "setInterval(",
  "BullModule",
  "new Queue",
  "@Processor",
].forEach((forbidden) => {
  assert(!controller.includes(forbidden), `controller must not contain scheduler runtime marker: ${forbidden}`);
});

assert(
  pkg.scripts["smoke:step149-l-amazon-orders-historical-sync-disabled-worker-planner-integration"] ===
    "node scripts/smoke-step149-l-amazon-orders-historical-sync-disabled-worker-planner-integration.js",
  "package.json must register Step149-L smoke",
);

require("ts-node/register/transpile-only");

const {
  createAmazonSpApiOrdersHistoricalSyncRepositoryTestDouble,
} = require("../src/imports/amazon-sp-api-orders-historical-sync.repository.test-double");
const {
  createAmazonSpApiOrdersHistoricalSyncWorkerDisabled,
} = require("../src/imports/amazon-sp-api-orders-historical-sync.worker.disabled");

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

  assert(plan.accepted === false, "plan remains rejected while disabled");
  assert(plan.disabled === true, "plan remains disabled");
  assert(plan.reason === "STEP149_J_WORKER_DISABLED_BY_DEFAULT", "disabled reason mismatch");
  assert(plan.executionMode === "worker_disabled", "execution mode mismatch");
  assert(plan.planningMode === "planner_integrated_but_runtime_disabled", "planning mode mismatch");
  assert(plan.wouldCreateSyncJob === false, "plan must not create sync job");
  assert(plan.wouldCreateSegments === false, "plan must not create segments");
  assert(plan.wouldCallAmazon === false, "plan must not call Amazon");
  assert(plan.wouldWriteDatabase === false, "plan must not write DB");

  assert(plan.normalizedRange.segmentDays === 7, "normalized segmentDays mismatch");
  assert(plan.normalizedRange.totalDaysInclusive === 31, "normalized totalDaysInclusive mismatch");
  assert(plan.paginationPolicy.maxPagesPerSegment === 50, "pagination policy maxPages mismatch");

  assert(plan.plannedSegments.length === 5, "January 2026 with 7-day segments should produce 5 planning-only segments");
  assert(plan.plannedSegments[0].segmentIndex === 0, "first segment index mismatch");
  assert(plan.plannedSegments[0].createdAfter === "2026-01-01T00:00:00.000Z", "first segment start mismatch");
  assert(plan.plannedSegments[0].createdBefore === "2026-01-07T23:59:59.999Z", "first segment end mismatch");
  assert(plan.plannedSegments[4].segmentIndex === 4, "last segment index mismatch");
  assert(plan.plannedSegments[4].createdAfter === "2026-01-29T00:00:00.000Z", "last segment start mismatch");
  assert(plan.plannedSegments[4].createdBefore === "2026-01-31T23:59:59.999Z", "last segment end mismatch");

  const oneSegmentPlan = worker.planHistoricalSync({
    companyId: "company_001",
    storeId: "store_001",
    marketplaceId: "A1VC38T7YXB528",
    region: "JP",
    syncStartDate: "2026-02-01",
    syncEndDate: "2026-02-28",
    requestedByUserId: "user_001",
    segmentDays: 31,
  });

  assert(oneSegmentPlan.plannedSegments.length === 1, "28-day range with segmentDays=31 should produce one segment");

  let invalidRejected = false;
  try {
    worker.planHistoricalSync({
      companyId: "company_001",
      storeId: "store_001",
      marketplaceId: "A1VC38T7YXB528",
      region: "JP",
      syncStartDate: "2026-01-31",
      syncEndDate: "2026-01-01",
      requestedByUserId: "user_001",
      segmentDays: 7,
    });
  } catch (error) {
    invalidRejected = String(error && error.message).includes("STEP149_K_SYNC_END_BEFORE_START");
  }

  assert(invalidRejected, "invalid date range should still be rejected by planner");

  const run = await worker.runHistoricalSync({
    companyId: "company_001",
    storeId: "store_001",
    marketplaceId: "A1VC38T7YXB528",
    region: "JP",
    syncStartDate: "2026-01-01",
    syncEndDate: "2026-01-31",
    requestedByUserId: "user_001",
  });

  assert(run.accepted === false, "run must remain disabled");
  assert(run.callsRepository === false, "run must not call repository");
  assert(run.callsAmazon === false, "run must not call Amazon");
  assert(run.writesDatabase === false, "run must not write DB");
  assert(run.writesImportJob === false, "run must not write ImportJob");
  assert(run.writesImportStagingRow === false, "run must not write ImportStagingRow");

  const segmentRun = await worker.runSegment({
    companyId: "company_001",
    syncJobId: "sync_job_001",
    syncSegmentId: "sync_segment_001",
  });

  assert(segmentRun.accepted === false, "segment run must remain disabled");
  assert(segmentRun.callsRepository === false, "segment run must not call repository");
  assert(segmentRun.callsAmazon === false, "segment run must not call Amazon");
  assert(segmentRun.writesDatabase === false, "segment run must not write DB");

  const jobs = await repository.listSyncJobsByCompany({ companyId: "company_001" });
  assert(jobs.length === 0, "planning path must not create repository jobs");

  console.log("[SMOKE_OK] Step149-L disabled worker planner integration smoke passed");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
