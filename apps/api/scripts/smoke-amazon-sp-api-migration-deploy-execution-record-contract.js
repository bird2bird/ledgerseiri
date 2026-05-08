#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const {
  assertAmazonSpApiMigrationDeployExecutionRecordContract,
  buildAmazonSpApiMigrationDeployExecutionRecordContract,
} = require("../dist/src/imports/dto/amazon-sp-api-migration-deploy-execution-record-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

async function assertDatabaseMigrationApplied() {
  const prisma = new PrismaClient();

  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'AmazonSpApiConnection',
          'AmazonSpApiCredential',
          'AmazonSpApiAccessTokenCache',
          'AmazonSpApiConnectionAudit'
        )
      ORDER BY table_name
    `;

    const tableNames = tables.map((row) => row.table_name);

    for (const table of [
      "AmazonSpApiConnection",
      "AmazonSpApiCredential",
      "AmazonSpApiAccessTokenCache",
      "AmazonSpApiConnectionAudit",
    ]) {
      assert(tableNames.includes(table), `Missing deployed table: ${table}`);
    }

    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at
      FROM _prisma_migrations
      WHERE migration_name LIKE '%add_amazon_sp_api_connection_models%'
      ORDER BY finished_at DESC
    `;

    assert(migrations.length > 0, "Missing _prisma_migrations record for Amazon SP-API migration");

    return { tables: tableNames, migrations };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-migration-deploy-execution-record-contract"] ===
      "node scripts/smoke-amazon-sp-api-migration-deploy-execution-record-contract.js",
    "Step124-G npm script missing or mismatched",
  );

  const contract = assertAmazonSpApiMigrationDeployExecutionRecordContract(
    buildAmazonSpApiMigrationDeployExecutionRecordContract(),
  );

  assert(contract.migrationDeployExecutedNow === true, "Step124-G must record deploy execution");
  assert(contract.applicationDataWriteNow === false, "Step124-G must not claim application data writes");
  assert(contract.summary.readyForStep125TokenPersistencePreImplementationContract === true, "Step125-A should be enabled next");

  const dbGuard = await assertDatabaseMigrationApplied();

  console.log("[SMOKE_OK] amazon sp-api migration deploy execution record contract smoke passed");
  console.log(JSON.stringify({ ok: true, step: "Step124-G", dbGuard, summary: contract.summary }, null, 2));
}

main().catch((err) => {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
});
