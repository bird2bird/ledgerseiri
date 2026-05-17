const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const root = "/opt/ledgerseiri";
const api = path.join(root, "apps/api");

const contractPath = path.join(
  api,
  "src/imports/dto/amazon-sp-api-orders-historical-sync-prisma-migration-contract.dto.ts",
);
const schemaDecisionPath = path.join(
  api,
  "src/imports/dto/amazon-sp-api-orders-historical-sync-schema-decision-contract.dto.ts",
);
const packagePath = path.join(api, "package.json");

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

console.log("========== Step149-E smoke: Prisma migration contract only ==========");

const contract = read(contractPath);
const schemaDecision = read(schemaDecisionPath);
const pkg = JSON.parse(read(packagePath));

[
  "Step149-E",
  "amazon-sp-api-orders-historical-sync",
  "migration_contract_only",
  "noSchemaPrismaChangeNow: true",
  "noMigrationDirectoryNow: true",
  "noPrismaClientGenerationNow: true",
  "noRuntimePersistenceNow: true",
  "noControllerBehaviorChangeNow: true",
  "noFrontendChangeNow: true",
  "add_amazon_sp_api_order_sync_jobs",
  "AmazonSpApiOrderSyncJobStatus",
  "AmazonSpApiOrderSyncSegmentStatus",
  "PARTIAL_FAILED",
  "RETRYABLE_FAILED",
  "AmazonSpApiOrderSyncJob",
  "AmazonSpApiOrderSyncSegment",
  "ImportJobFutureExtension",
  "requestedStartDate DateTime",
  "requestedEndDate DateTime",
  "lastCompletedWindowEnd DateTime?",
  "nextToken String?",
  "retryAttempts Int @default(0)",
  "createdImportJobId String?",
  "@@unique([syncJobId, segmentIndex])",
  "@@index([companyId, storeId, marketplaceId, status])",
  "@@index([syncJobId, status])",
  "amazonSpApiOrderSyncJobId String?",
  "amazonSpApiOrderSyncSegmentId String?",
  "schemaPrismaMustRemainUnchangedInStep149E: true",
  "migrationDirectoryMustRemainUnchangedInStep149E: true",
  "noPrismaMigrateCommandInStep149E: true",
  "noPrismaGenerateCommandInStep149E: true",
  "noImportJobWriteNow: true",
  "noImportStagingRowWriteNow: true",
  "noAmazonCallNow: true",
  "noWorkerNow: true",
  "noTransactionWriteNow: true",
  "noInventoryWriteNow: true",
  "assertAmazonSpApiOrdersHistoricalSyncPrismaMigrationContract",
  "AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_PRISMA_MIGRATION_CONTRACT",
].forEach((needle) => {
  assert(contract.includes(needle), `migration contract missing marker: ${needle}`);
});

assert(
  schemaDecision.includes("recommendedStrategy: 'dedicated_sync_job_and_segments'"),
  "Step149-E depends on Step149-D dedicated sync job decision",
);

assert(
  schemaDecision.includes("AmazonSpApiOrderSyncJob") && schemaDecision.includes("AmazonSpApiOrderSyncSegment"),
  "Step149-D decision must include future sync job and segment model names",
);

[
  "prisma migrate",
  "prisma db push",
  "prisma generate",
  "npx prisma",
  "transaction.create(",
  "inventoryMovement.create(",
  "previewAmazonSpApiOrdersReal(",
  "while (true)",
  "for (;;)",
  "x-amz-access-token",
  "rawAccessToken",
  "rawRefreshToken",
  "clientSecret",
  "refreshToken",
].forEach((forbidden) => {
  assert(!contract.includes(forbidden), `contract must not contain forbidden marker: ${forbidden}`);
});

const schemaDiff = gitDiffNameOnly("apps/api/prisma/schema.prisma prisma/schema.prisma");
const migrationDiff = gitDiffNameOnly("apps/api/prisma/migrations prisma/migrations");
const step149FMigrationFilePresent =
  fs.existsSync(path.join(api, "prisma/migrations")) &&
  fs
    .readdirSync(path.join(api, "prisma/migrations"))
    .some((name) =>
      name.includes("add_amazon_sp_api_order_sync_jobs") &&
      fs.existsSync(path.join(api, "prisma/migrations", name, "migration.sql")),
    );
const step149FCreateOnlyPatchPresent =
  fs.existsSync(path.join(api, "scripts/smoke-step149-f-amazon-orders-historical-sync-create-only-prisma-schema-migration.js")) &&
  schemaDiff.includes("apps/api/prisma/schema.prisma") &&
  step149FMigrationFilePresent;

if (!step149FCreateOnlyPatchPresent) {
  assert(schemaDiff === "", `This step must not modify schema.prisma before Step149-F. Diff found: ${schemaDiff}`);
  assert(migrationDiff === "", `This step must not create migration files before Step149-F. Diff found: ${migrationDiff}`);
} else {
  console.log("[INFO] Step149-F create-only schema/migration patch detected; earlier Step149 contract smoke remains compatible.");
}

assert(
  pkg.scripts["smoke:step149-e-amazon-orders-historical-sync-prisma-migration-contract"] ===
    "node scripts/smoke-step149-e-amazon-orders-historical-sync-prisma-migration-contract.js",
  "package.json must register Step149-E smoke",
);

console.log("[SMOKE_OK] Step149-E Prisma migration contract-only smoke passed");
