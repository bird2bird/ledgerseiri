const fs = require("fs");
const path = require("path");

const root = "/opt/ledgerseiri";
const api = path.join(root, "apps/api");

const disabledContractPath = path.join(
  api,
  "src/imports/dto/amazon-sp-api-orders-historical-sync-prisma-repository-disabled-contract.dto.ts",
);
const disabledRepositoryPath = path.join(
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

console.log("========== Step149-I smoke: Prisma repository disabled shell ==========");

const disabledContract = read(disabledContractPath);
const disabledRepository = read(disabledRepositoryPath);
const controller = read(controllerPath);
const pkg = JSON.parse(read(packagePath));

[
  "Step149-I",
  "prisma_disabled",
  "disabledByDefault: true",
  "allowRuntimeWrites: false",
  "delegateBoundaryVisible: true",
  "noControllerWiringNow: true",
  "noWorkerWiringNow: true",
  "noAmazonCallNow: true",
  "noRuntimePersistenceNow: true",
  "STEP149_I_PRISMA_REPOSITORY_DISABLED_BY_DEFAULT",
  "amazonSpApiOrderSyncJob",
  "amazonSpApiOrderSyncSegment",
  "callsPrismaDelegate: false",
  "writesDatabase: false",
  "callsAmazon: false",
  "startsWorker: false",
  "writesImportJob: false",
  "writesImportStagingRow: false",
  "writesTransaction: false",
  "writesInventoryMovement: false",
  "updatesInventoryBalance: false",
  "AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_PRISMA_REPOSITORY_DISABLED_CONTRACT",
].forEach((needle) => {
  assert(disabledContract.includes(needle), `disabled contract missing marker: ${needle}`);
});

[
  "AmazonSpApiOrdersHistoricalSyncPrismaRepositoryDisabled",
  "AmazonSpApiOrdersHistoricalSyncPrismaDelegateBoundary",
  "Pick<",
  "'amazonSpApiOrderSyncJob' | 'amazonSpApiOrderSyncSegment'",
  "getDelegateAvailability",
  "createSyncJob",
  "getSyncJobById",
  "listSyncJobsByCompany",
  "createSyncSegment",
  "getSyncSegmentById",
  "listSyncSegmentsByJobId",
  "getJobProgressSummary",
  "rejectDisabled",
  "STEP149_I_PRISMA_REPOSITORY_DISABLED_BY_DEFAULT",
  "createAmazonSpApiOrdersHistoricalSyncPrismaRepositoryDisabled",
].forEach((needle) => {
  assert(disabledRepository.includes(needle), `disabled repository missing marker: ${needle}`);
});

[
  ".create(",
  ".createMany(",
  ".update(",
  ".upsert(",
  ".delete(",
  ".deleteMany(",
  ".findFirst(",
  ".findMany(",
  ".findUnique(",
  "previewAmazonSpApiOrdersReal",
  "buildAmazonSpApiOrdersServerOnlyRawSignedTransport",
  "transaction.create(",
  "inventoryMovement.create(",
  "importJob.create(",
  "importStagingRow.create",
].forEach((forbidden) => {
  assert(!disabledRepository.includes(forbidden), `disabled repository must not contain executable Prisma/Amazon marker: ${forbidden}`);
});

assert(
  controller.includes("amazonSpApiOrdersHistoricalSyncDisabledControllerRoute"),
  "Step149-C disabled route must remain present",
);

assert(
  !controller.includes("AmazonSpApiOrdersHistoricalSyncPrismaRepositoryDisabled") &&
    !controller.includes("createAmazonSpApiOrdersHistoricalSyncPrismaRepositoryDisabled") &&
    !controller.includes("AmazonSpApiOrdersHistoricalSyncPrismaDelegateBoundary"),
  "controller must not wire Prisma repository in Step149-I",
);

assert(
  pkg.scripts["smoke:step149-i-amazon-orders-historical-sync-prisma-repository-disabled-shell"] ===
    "node scripts/smoke-step149-i-amazon-orders-historical-sync-prisma-repository-disabled-shell.js",
  "package.json must register Step149-I smoke",
);

require("ts-node/register/transpile-only");

const { PrismaClient } = require("@prisma/client");
const {
  createAmazonSpApiOrdersHistoricalSyncPrismaRepositoryDisabled,
} = require("../src/imports/amazon-sp-api-orders-historical-sync.repository.prisma-disabled");

(async () => {
  const prisma = new PrismaClient();
  const repo = createAmazonSpApiOrdersHistoricalSyncPrismaRepositoryDisabled(prisma);

  const availability = repo.getDelegateAvailability();

  assert(availability.hasJobDelegate === true, "job delegate should be visible");
  assert(availability.hasSegmentDelegate === true, "segment delegate should be visible");
  assert(repo.disabledContract.repositoryMode === "prisma_disabled", "repository should be prisma_disabled");
  assert(repo.disabledContract.disabledByDefault === true, "repository should be disabled by default");
  assert(repo.contract.boundaries.callsPrismaDelegate === false, "repository contract must not call Prisma");
  assert(repo.contract.boundaries.writesDatabase === false, "repository contract must not write database");

  const disabledMethods = [
    () =>
      repo.createSyncJob({
        companyId: "company_001",
        storeId: "store_001",
        marketplaceId: "A1VC38T7YXB528",
        requestedStartDate: "2026-01-01T00:00:00.000Z",
        requestedEndDate: "2026-01-31T23:59:59.999Z",
        totalSegments: 1,
      }),
    () => repo.getSyncJobById({ companyId: "company_001", syncJobId: "sync_job_001" }),
    () => repo.listSyncJobsByCompany({ companyId: "company_001" }),
    () =>
      repo.createSyncSegment({
        syncJobId: "sync_job_001",
        companyId: "company_001",
        storeId: "store_001",
        marketplaceId: "A1VC38T7YXB528",
        segmentIndex: 0,
        createdAfter: "2026-01-01T00:00:00.000Z",
        createdBefore: "2026-01-07T23:59:59.999Z",
      }),
    () => repo.getSyncSegmentById({ companyId: "company_001", syncSegmentId: "sync_segment_001" }),
    () => repo.listSyncSegmentsByJobId({ companyId: "company_001", syncJobId: "sync_job_001" }),
    () => repo.getJobProgressSummary({ companyId: "company_001", syncJobId: "sync_job_001" }),
  ];

  for (const call of disabledMethods) {
    let blocked = false;
    try {
      await call();
    } catch (error) {
      blocked = String(error && error.message).includes("STEP149_I_PRISMA_REPOSITORY_DISABLED_BY_DEFAULT");
    }
    assert(blocked, "all Prisma repository methods must be disabled by default");
  }

  await prisma.$disconnect();

  console.log("[SMOKE_OK] Step149-I Prisma repository disabled shell smoke passed");
})().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
