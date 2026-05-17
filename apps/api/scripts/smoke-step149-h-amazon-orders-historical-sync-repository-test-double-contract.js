const fs = require("fs");
const path = require("path");

const root = "/opt/ledgerseiri";
const api = path.join(root, "apps/api");

const contractPath = path.join(
  api,
  "src/imports/dto/amazon-sp-api-orders-historical-sync-repository-contract.dto.ts",
);
const repositoryPath = path.join(
  api,
  "src/imports/amazon-sp-api-orders-historical-sync.repository.test-double.ts",
);
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

console.log("========== Step149-H smoke: repository test-double contract ==========");

const contract = read(contractPath);
const repository = read(repositoryPath);
const controller = read(controllerPath);
const pkg = JSON.parse(read(packagePath));

[
  "Step149-H",
  "test_double_only",
  "createSyncJob",
  "getSyncJobById",
  "listSyncJobsByCompany",
  "createSyncSegment",
  "getSyncSegmentById",
  "listSyncSegmentsByJobId",
  "getJobProgressSummary",
  "callsPrismaDelegate: false",
  "writesDatabase: false",
  "callsAmazon: false",
  "startsWorker: false",
  "writesImportJob: false",
  "writesImportStagingRow: false",
  "writesTransaction: false",
  "writesInventoryMovement: false",
  "updatesInventoryBalance: false",
  "AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_REPOSITORY_CONTRACT",
].forEach((needle) => {
  assert(contract.includes(needle), `repository contract missing marker: ${needle}`);
});

[
  "AmazonSpApiOrdersHistoricalSyncRepositoryTestDouble",
  "createAmazonSpApiOrdersHistoricalSyncRepositoryTestDouble",
  "new Map<string, AmazonSpApiOrdersHistoricalSyncJobRecord>()",
  "new Map<string, AmazonSpApiOrdersHistoricalSyncSegmentRecord>()",
  "STEP149_H_DUPLICATE_SEGMENT_INDEX",
  "getJobProgressSummary",
].forEach((needle) => {
  assert(repository.includes(needle), `test-double repository missing marker: ${needle}`);
});

[
  "PrismaClient",
  "this.prisma",
  "prisma.",
  "amazonSpApiOrderSyncJob.create",
  "amazonSpApiOrderSyncSegment.create",
  "amazonSpApiOrderSyncJob.update",
  "amazonSpApiOrderSyncSegment.update",
  "previewAmazonSpApiOrdersReal",
  "buildAmazonSpApiOrdersServerOnlyRawSignedTransport",
  "transaction.create(",
  "inventoryMovement.create(",
  "importJob.create(",
  "importStagingRow.create",
].forEach((forbidden) => {
  assert(!repository.includes(forbidden), `test-double repository must not contain forbidden marker: ${forbidden}`);
});

assert(
  controller.includes("amazonSpApiOrdersHistoricalSyncDisabledControllerRoute"),
  "Step149-C disabled route must remain present",
);

const step149MPreviewRouteScope = extractStep149MPreviewRouteScope(controller);

if (step149MPreviewRouteScope) {
  assert(
    step149MPreviewRouteScope.includes("createAmazonSpApiOrdersHistoricalSyncRepositoryTestDouble"),
    "Step149-M preview route may use test-double repository factory",
  );
  assert(
    step149MPreviewRouteScope.includes("createAmazonSpApiOrdersHistoricalSyncWorkerDisabled"),
    "Step149-M preview route may create disabled worker",
  );
  assert(
    step149MPreviewRouteScope.includes("worker.planHistoricalSync"),
    "Step149-M preview route must call worker.planHistoricalSync",
  );

  [
    "new PrismaClient",
    "createAmazonSpApiOrdersHistoricalSyncPrismaRepositoryDisabled",
    "amazon-sp-api-orders-historical-sync.repository.prisma-disabled",
    "runHistoricalSync(",
    "runSegment(",
    "repository.createSyncJob",
    "repository.createSyncSegment",
    "this.repository.createSyncJob",
    "this.repository.createSyncSegment",
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
    !controller.includes("AmazonSpApiOrdersHistoricalSyncRepositoryTestDouble") &&
      !controller.includes("createAmazonSpApiOrdersHistoricalSyncRepositoryTestDouble") &&
      !controller.includes("AmazonSpApiOrdersHistoricalSyncRepository"),
    "pre-Step149-M controller must not wire repository",
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
  pkg.scripts["smoke:step149-h-amazon-orders-historical-sync-repository-test-double-contract"] ===
    "node scripts/smoke-step149-h-amazon-orders-historical-sync-repository-test-double-contract.js",
  "package.json must register Step149-H smoke",
);

require("ts-node/register/transpile-only");

const {
  createAmazonSpApiOrdersHistoricalSyncRepositoryTestDouble,
} = require("../src/imports/amazon-sp-api-orders-historical-sync.repository.test-double");

(async () => {
  const repo = createAmazonSpApiOrdersHistoricalSyncRepositoryTestDouble();

  assert(repo.contract.repositoryMode === "test_double_only", "repository must be test-double only");
  assert(repo.contract.boundaries.callsPrismaDelegate === false, "repository must not call Prisma");
  assert(repo.contract.boundaries.writesDatabase === false, "repository must not write database");

  const job = await repo.createSyncJob({
    companyId: "company_001",
    storeId: "store_001",
    marketplaceId: "A1VC38T7YXB528",
    region: "JP",
    requestedStartDate: "2026-01-01T00:00:00.000Z",
    requestedEndDate: "2026-01-31T23:59:59.999Z",
    totalSegments: 2,
    createdByUserId: "user_001",
    nowIso: "2026-02-01T00:00:00.000Z",
  });

  assert(job.id === "sync_job_0001", "unexpected sync job id");
  assert(job.status === "PENDING", "new sync job should be PENDING");
  assert(job.totalSegments === 2, "sync job totalSegments mismatch");

  const readJob = await repo.getSyncJobById({
    companyId: "company_001",
    syncJobId: job.id,
  });

  assert(readJob && readJob.id === job.id, "created job should be readable");

  const segment0 = await repo.createSyncSegment({
    syncJobId: job.id,
    companyId: "company_001",
    storeId: "store_001",
    marketplaceId: "A1VC38T7YXB528",
    segmentIndex: 0,
    createdAfter: "2026-01-01T00:00:00.000Z",
    createdBefore: "2026-01-07T23:59:59.999Z",
    nowIso: "2026-02-01T00:00:00.000Z",
  });

  const segment1 = await repo.createSyncSegment({
    syncJobId: job.id,
    companyId: "company_001",
    storeId: "store_001",
    marketplaceId: "A1VC38T7YXB528",
    segmentIndex: 1,
    createdAfter: "2026-01-08T00:00:00.000Z",
    createdBefore: "2026-01-14T23:59:59.999Z",
    nowIso: "2026-02-01T00:00:00.000Z",
  });

  assert(segment0.id === "sync_segment_0001", "unexpected segment0 id");
  assert(segment1.id === "sync_segment_0002", "unexpected segment1 id");

  const segments = await repo.listSyncSegmentsByJobId({
    companyId: "company_001",
    syncJobId: job.id,
  });

  assert(segments.length === 2, "expected two segments");
  assert(segments[0].segmentIndex === 0, "segments should sort by segmentIndex");
  assert(segments[1].segmentIndex === 1, "segments should sort by segmentIndex");

  const readSegment = await repo.getSyncSegmentById({
    companyId: "company_001",
    syncSegmentId: segment0.id,
  });

  assert(readSegment && readSegment.id === segment0.id, "created segment should be readable");

  const summary = await repo.getJobProgressSummary({
    companyId: "company_001",
    syncJobId: job.id,
  });

  assert(summary, "summary should exist");
  assert(summary.totalSegments === 2, "summary totalSegments mismatch");
  assert(summary.pendingSegments === 2, "summary pendingSegments mismatch");
  assert(summary.completedSegments === 0, "summary completedSegments mismatch");
  assert(summary.failedSegments === 0, "summary failedSegments mismatch");
  assert(summary.hasNextToken === false, "summary should not have nextToken initially");

  let duplicateFailed = false;
  try {
    await repo.createSyncSegment({
      syncJobId: job.id,
      companyId: "company_001",
      storeId: "store_001",
      marketplaceId: "A1VC38T7YXB528",
      segmentIndex: 1,
      createdAfter: "2026-01-15T00:00:00.000Z",
      createdBefore: "2026-01-21T23:59:59.999Z",
      nowIso: "2026-02-01T00:00:00.000Z",
    });
  } catch (error) {
    duplicateFailed = String(error && error.message).includes("STEP149_H_DUPLICATE_SEGMENT_INDEX");
  }

  assert(duplicateFailed, "duplicate segment index should be rejected");

  console.log("[SMOKE_OK] Step149-H repository test-double contract smoke passed");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
