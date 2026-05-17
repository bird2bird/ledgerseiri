const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const root = "/opt/ledgerseiri";
const api = path.join(root, "apps/api");

const contractPath = path.join(
  api,
  "src/imports/dto/amazon-sp-api-orders-historical-sync-schema-decision-contract.dto.ts",
);
const packagePath = path.join(api, "package.json");
const controllerPath = path.join(api, "src/imports/imports.controller.ts");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function gitDiffNameOnly(args) {
  return childProcess
    .execSync(`git -C ${root} diff --name-only -- ${args}`, { encoding: "utf8" })
    .trim();
}

console.log("========== Step149-D smoke: historical sync schema decision contract ==========");

const contract = read(contractPath);
const pkg = JSON.parse(read(packagePath));
const controller = read(controllerPath);

[
  "Step149-D",
  "amazon-sp-api-orders-historical-sync",
  "decision_contract_only",
  "dedicated_sync_job_and_segments",
  "reuse_import_job_metadata",
  "reuse_platform_operation",
  "noSchemaMigrationNow: true",
  "noPrismaSchemaChangeNow: true",
  "noRuntimePersistenceNow: true",
  "noControllerBehaviorChangeNow: true",
  "noFrontendChangeNow: true",
  "useDedicatedSyncJobModel: true",
  "useDedicatedSyncSegmentModel: true",
  "useImportJobAsPrimarySyncState: false",
  "useImportJobAsResultArtifact: true",
  "usePlatformOperationAsPrimarySyncState: false",
  "AmazonSpApiOrderSyncJob",
  "AmazonSpApiOrderSyncSegment",
  "requestedStartDate",
  "requestedEndDate",
  "lastCompletedWindowEnd",
  "nextToken",
  "retryAttempts",
  "createdImportJobId",
  "AmazonSpApiOrderSyncSegment(syncJobId, segmentIndex)",
  "schemaPrismaMustRemainUnchangedInStep149D: true",
  "noMigrationDirectoryCreatedInStep149D: true",
  "noImportJobWriteNow: true",
  "noImportStagingRowWriteNow: true",
  "noAmazonCallNow: true",
  "noWorkerNow: true",
  "noTransactionWriteNow: true",
  "noInventoryWriteNow: true",
  "assertAmazonSpApiOrdersHistoricalSyncSchemaDecision",
  "AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_SCHEMA_DECISION",
].forEach((needle) => {
  assert(contract.includes(needle), `schema decision contract missing marker: ${needle}`);
});

[
  "transaction.create(",
  "transaction.createMany(",
  "inventoryMovement.create(",
  "inventoryMovement.createMany(",
  "inventoryBalance.update(",
  "prisma.importJob.create",
  "prisma.importStagingRow.createMany",
  "previewAmazonSpApiOrdersReal(",
  "buildAmazonSpApiOrdersServerOnlyRawSignedTransport",
  "while (true)",
  "for (;;)",
  "setInterval(",
  "x-amz-access-token",
  "rawAccessToken",
  "rawRefreshToken",
  "clientSecret",
  "refreshToken",
].forEach((forbidden) => {
  assert(!contract.includes(forbidden), `contract must not contain forbidden marker: ${forbidden}`);
});

const schemaDiff = gitDiffNameOnly("apps/api/prisma/schema.prisma prisma/schema.prisma");
assert(schemaDiff === "", `Step149-D must not modify schema.prisma. Diff found: ${schemaDiff}`);

const migrationDiff = gitDiffNameOnly("apps/api/prisma/migrations prisma/migrations");
assert(migrationDiff === "", `Step149-D must not create migration files. Diff found: ${migrationDiff}`);

assert(
  controller.includes("amazonSpApiOrdersHistoricalSyncDisabledControllerRoute"),
  "Step149-C disabled route should remain present",
);

assert(
  !controller.includes("AmazonSpApiOrderSyncJob") && !controller.includes("AmazonSpApiOrderSyncSegment"),
  "controller must not wire future Step149-D models yet",
);

assert(
  pkg.scripts["smoke:step149-d-amazon-orders-historical-sync-schema-decision-contract"] ===
    "node scripts/smoke-step149-d-amazon-orders-historical-sync-schema-decision-contract.js",
  "package.json must register Step149-D smoke",
);

console.log("[SMOKE_OK] Step149-D historical sync schema decision contract smoke passed");
