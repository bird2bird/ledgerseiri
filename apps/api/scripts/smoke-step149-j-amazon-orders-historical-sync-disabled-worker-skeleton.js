const fs = require("fs");
const path = require("path");

const root = "/opt/ledgerseiri";
const api = path.join(root, "apps/api");

const workerContractPath = path.join(
  api,
  "src/imports/dto/amazon-sp-api-orders-historical-sync-worker-disabled-contract.dto.ts",
);
const workerPath = path.join(
  api,
  "src/imports/amazon-sp-api-orders-historical-sync.worker.disabled.ts",
);
const repositoryContractPath = path.join(
  api,
  "src/imports/dto/amazon-sp-api-orders-historical-sync-repository-contract.dto.ts",
);
const testDoubleRepositoryPath = path.join(
  api,
  "src/imports/amazon-sp-api-orders-historical-sync.repository.test-double.ts",
);
const prismaDisabledRepositoryPath = path.join(
  api,
  "src/imports/amazon-sp-api-orders-historical-sync.repository.prisma-disabled.ts",
);
const controllerPath = path.join(api, "src/imports/imports.controller.ts");
const packagePath = path.join(api, "package.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

console.log("========== Step149-J smoke: disabled worker skeleton ==========");

const workerContract = read(workerContractPath);
const worker = read(workerPath);
const repositoryContract = read(repositoryContractPath);
const testDoubleRepository = read(testDoubleRepositoryPath);
const prismaDisabledRepository = read(prismaDisabledRepositoryPath);
const controller = read(controllerPath);
const pkg = JSON.parse(read(packagePath));

[
  "Step149-J",
  "worker_disabled",
  "STEP149_J_WORKER_DISABLED_BY_DEFAULT",
  "usesRepositoryBoundaryType: true",
  "compatibleRepositoryContractStep: 'Step149-H'",
  "planHistoricalSync",
  "runHistoricalSync",
  "runSegment",
  "noSchedulerRegistrationNow: true",
  "noControllerWiringNow: true",
  "noRepositoryRuntimeCallNow: true",
  "noPrismaDelegateCallNow: true",
  "noAmazonCallNow: true",
  "noDatabaseWriteNow: true",
  "noImportJobWriteNow: true",
  "noImportStagingRowWriteNow: true",
  "noTransactionWriteNow: true",
  "noInventoryMovementWriteNow: true",
  "noInfiniteLoopNow: true",
  "noSetIntervalNow: true",
  "noQueueConsumerNow: true",
].forEach((needle) => {
  assert(workerContract.includes(needle), `worker contract missing marker: ${needle}`);
});

[
  "AmazonSpApiOrdersHistoricalSyncWorkerDisabled",
  "createAmazonSpApiOrdersHistoricalSyncWorkerDisabled",
  "AmazonSpApiOrdersHistoricalSyncRepository",
  "planHistoricalSync",
  "runHistoricalSync",
  "runSegment",
  "disabledRunResult",
  "accepted: false",
  "disabled: true",
  "callsRepository: false",
  "callsAmazon: false",
  "writesDatabase: false",
  "writesImportJob: false",
  "writesImportStagingRow: false",
  "writesTransaction: false",
  "writesInventoryMovement: false",
  "startsBackgroundLoop: false",
].forEach((needle) => {
  assert(worker.includes(needle), `worker skeleton missing marker: ${needle}`);
});

[
  "createSyncJob(",
  "createSyncSegment(",
  "getSyncJobById(",
  "listSyncSegmentsByJobId(",
  "getJobProgressSummary(",
  "amazonSpApiOrderSyncJob.",
  "amazonSpApiOrderSyncSegment.",
  "PrismaClient",
  "previewAmazonSpApiOrdersReal",
  "buildAmazonSpApiOrdersServerOnlyRawSignedTransport",
  "setInterval(",
  "while (true)",
  "for (;;)",
  "@Cron",
  "CronExpression",
  "Queue",
  "Processor",
  "transaction.create(",
  "inventoryMovement.create(",
  "importJob.create(",
  "importStagingRow.create",
].forEach((forbidden) => {
  assert(!worker.includes(forbidden), `worker skeleton must not contain forbidden marker: ${forbidden}`);
});

assert(
  repositoryContract.includes("AmazonSpApiOrdersHistoricalSyncRepository"),
  "Step149-H repository boundary must exist",
);

assert(
  testDoubleRepository.includes("createAmazonSpApiOrdersHistoricalSyncRepositoryTestDouble"),
  "Step149-H test-double repository must exist",
);

assert(
  prismaDisabledRepository.includes("createAmazonSpApiOrdersHistoricalSyncPrismaRepositoryDisabled"),
  "Step149-I disabled Prisma repository shell must exist",
);

assert(
  controller.includes("amazonSpApiOrdersHistoricalSyncDisabledControllerRoute"),
  "Step149-C disabled controller route must remain present",
);

assert(
  !controller.includes("AmazonSpApiOrdersHistoricalSyncWorkerDisabled") &&
    !controller.includes("createAmazonSpApiOrdersHistoricalSyncWorkerDisabled") &&
    !controller.includes("amazon-sp-api-orders-historical-sync.worker.disabled"),
  "controller must not wire worker in Step149-J",
);

[
  "@Cron",
  "CronExpression",
  "ScheduleModule",
  "setInterval(",
  "BullModule",
  "Queue",
  "Processor",
  "createAmazonSpApiOrdersHistoricalSyncWorkerDisabled(",
].forEach((forbidden) => {
  assert(!controller.includes(forbidden), `controller must not contain scheduler/worker marker: ${forbidden}`);
});

assert(
  pkg.scripts["smoke:step149-j-amazon-orders-historical-sync-disabled-worker-skeleton"] ===
    "node scripts/smoke-step149-j-amazon-orders-historical-sync-disabled-worker-skeleton.js",
  "package.json must register Step149-J smoke",
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

  assert(worker.contract.executionMode === "worker_disabled", "worker must be disabled");
  assert(worker.contract.boundaries.noRepositoryRuntimeCallNow === true, "worker must not call repository now");
  assert(worker.contract.boundaries.noAmazonCallNow === true, "worker must not call Amazon now");
  assert(worker.contract.boundaries.noDatabaseWriteNow === true, "worker must not write DB now");

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

  assert(plan.accepted === false, "plan should be rejected while disabled");
  assert(plan.disabled === true, "plan should be disabled");
  assert(plan.wouldCreateSyncJob === false, "plan must not create sync job");
  assert(plan.wouldCreateSegments === false, "plan must not create segments");
  assert(plan.wouldCallAmazon === false, "plan must not call Amazon");
  assert(plan.wouldWriteDatabase === false, "plan must not write DB");
  assert(Array.isArray(plan.plannedSegments) && plan.plannedSegments.length === 0, "disabled plan should not produce segments");

  const run = await worker.runHistoricalSync({
    companyId: "company_001",
    storeId: "store_001",
    marketplaceId: "A1VC38T7YXB528",
    region: "JP",
    syncStartDate: "2026-01-01",
    syncEndDate: "2026-01-31",
    requestedByUserId: "user_001",
  });

  assert(run.accepted === false, "run should be rejected while disabled");
  assert(run.callsRepository === false, "run must not call repository");
  assert(run.callsAmazon === false, "run must not call Amazon");
  assert(run.writesDatabase === false, "run must not write DB");
  assert(run.writesImportJob === false, "run must not write ImportJob");
  assert(run.writesImportStagingRow === false, "run must not write ImportStagingRow");
  assert(run.writesTransaction === false, "run must not write Transaction");
  assert(run.writesInventoryMovement === false, "run must not write InventoryMovement");
  assert(run.startsBackgroundLoop === false, "run must not start background loop");

  const segmentRun = await worker.runSegment({
    companyId: "company_001",
    syncJobId: "sync_job_001",
    syncSegmentId: "sync_segment_001",
  });

  assert(segmentRun.accepted === false, "segment run should be rejected while disabled");
  assert(segmentRun.callsRepository === false, "segment run must not call repository");
  assert(segmentRun.callsAmazon === false, "segment run must not call Amazon");
  assert(segmentRun.writesDatabase === false, "segment run must not write DB");

  console.log("[SMOKE_OK] Step149-J disabled worker skeleton smoke passed");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
