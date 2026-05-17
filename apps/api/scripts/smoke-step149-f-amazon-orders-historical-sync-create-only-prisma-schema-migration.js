const fs = require("fs");
const path = require("path");

const root = "/opt/ledgerseiri";
const api = path.join(root, "apps/api");

const schemaPathCandidates = [
  path.join(api, "prisma/schema.prisma"),
  path.join(root, "prisma/schema.prisma"),
];

const schemaPath = schemaPathCandidates.find((candidate) => fs.existsSync(candidate));
if (!schemaPath) {
  throw new Error("schema.prisma not found");
}

const schemaDir = path.dirname(schemaPath);
const migrationsDir = path.join(schemaDir, "migrations");
const packagePath = path.join(api, "package.json");
const controllerPath = path.join(api, "src/imports/imports.controller.ts");
const smokeDPath = path.join(api, "scripts/smoke-step149-d-amazon-orders-historical-sync-schema-decision-contract.js");
const smokeEPath = path.join(api, "scripts/smoke-step149-e-amazon-orders-historical-sync-prisma-migration-contract.js");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

console.log("========== Step149-F smoke: create-only Prisma schema/migration patch ==========");

const schema = read(schemaPath);
const pkg = JSON.parse(read(packagePath));
const controller = read(controllerPath);
const smokeD = read(smokeDPath);
const smokeE = read(smokeEPath);

[
  "enum AmazonSpApiOrderSyncJobStatus",
  "enum AmazonSpApiOrderSyncSegmentStatus",
  "PARTIAL_FAILED",
  "RETRYABLE_FAILED",
  "model AmazonSpApiOrderSyncJob",
  "model AmazonSpApiOrderSyncSegment",
  "requestedStartDate     DateTime",
  "requestedEndDate       DateTime",
  "lastCompletedWindowEnd DateTime?",
  "nextToken          String?",
  "retryAttempts      Int",
  "createdImportJobId String?",
  "amazonSpApiOrderSyncJobId",
  "amazonSpApiOrderSyncSegmentId",
  "amazonSpApiOrderSyncJobs",
  "amazonSpApiOrderSyncSegments",
  "createdForAmazonSpApiSegments",
  "@@unique([syncJobId, segmentIndex])",
  "@@index([companyId, storeId, marketplaceId, status])",
  "@@index([syncJobId, status])",
].forEach((needle) => {
  assert(schema.includes(needle), `schema missing marker: ${needle}`);
});

assert(fs.existsSync(migrationsDir), "migrations directory must exist");
const matchingMigrationDirs = fs
  .readdirSync(migrationsDir)
  .filter((name) => name.includes("add_amazon_sp_api_order_sync_jobs"));

assert(matchingMigrationDirs.length >= 1, "create-only migration directory missing");

const migrationSqlPaths = matchingMigrationDirs
  .map((name) => path.join(migrationsDir, name, "migration.sql"))
  .filter((file) => fs.existsSync(file));

assert(migrationSqlPaths.length >= 1, "migration.sql missing for Step149-F");

const migrationSql = read(migrationSqlPaths[migrationSqlPaths.length - 1]);

[
  'CREATE TYPE "AmazonSpApiOrderSyncJobStatus"',
  'CREATE TYPE "AmazonSpApiOrderSyncSegmentStatus"',
  'CREATE TABLE "AmazonSpApiOrderSyncJob"',
  'CREATE TABLE "AmazonSpApiOrderSyncSegment"',
  'ALTER TABLE "ImportJob"',
  'ADD COLUMN "amazonSpApiOrderSyncJobId"',
  'ADD COLUMN "amazonSpApiOrderSyncSegmentId"',
  'CREATE UNIQUE INDEX "AmazonSpApiOrderSyncSegment_syncJobId_segmentIndex_key"',
  'FOREIGN KEY ("companyId") REFERENCES "Company"("id")',
  'FOREIGN KEY ("syncJobId") REFERENCES "AmazonSpApiOrderSyncJob"("id")',
].forEach((needle) => {
  assert(migrationSql.includes(needle), `migration.sql missing marker: ${needle}`);
});

[
  "DROP TABLE",
  "DROP COLUMN",
  "DROP TYPE",
  "TRUNCATE",
  "DELETE FROM",
].forEach((forbidden) => {
  assert(!migrationSql.includes(forbidden), `migration.sql must not contain destructive marker: ${forbidden}`);
});

assert(
  controller.includes("amazonSpApiOrdersHistoricalSyncDisabledControllerRoute"),
  "Step149-C disabled route must remain present",
);

assert(
  !controller.includes("AmazonSpApiOrderSyncJob") && !controller.includes("AmazonSpApiOrderSyncSegment"),
  "controller must not wire new Prisma models in Step149-F",
);

assert(
  smokeD.includes("step149FCreateOnlyPatchPresent"),
  "Step149-D smoke must be compatible with Step149-F create-only patch",
);

assert(
  smokeE.includes("step149FCreateOnlyPatchPresent"),
  "Step149-E smoke must be compatible with Step149-F create-only patch",
);

assert(
  pkg.scripts["smoke:step149-f-amazon-orders-historical-sync-create-only-prisma-schema-migration"] ===
    "node scripts/smoke-step149-f-amazon-orders-historical-sync-create-only-prisma-schema-migration.js",
  "package.json must register Step149-F smoke",
);

console.log("[SMOKE_OK] Step149-F create-only Prisma schema/migration patch smoke passed");
