#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiMigrationDeployReadinessProductionGateContract,
  buildAmazonSpApiMigrationDeployReadinessProductionGateContract,
} = require("../dist/src/imports/dto/amazon-sp-api-migration-deploy-readiness-production-gate-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function listFiles(dir, predicate, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      if (name === "node_modules" || name === "dist" || name === ".next" || name === "coverage") continue;
      listFiles(p, predicate, acc);
    } else if (predicate(p)) {
      acc.push(p);
    }
  }
  return acc;
}

function findAmazonMigration(repoRoot) {
  const migrationsDir = path.resolve(repoRoot, "apps/api/prisma/migrations");
  const matches = [];
  for (const file of listFiles(migrationsDir, (p) => p.endsWith("migration.sql"))) {
    const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");
    const text = read(file);
    if (
      rel.includes("add_amazon_sp_api_connection_models") ||
      text.includes("AmazonSpApiConnection") ||
      text.includes("AmazonSpApiCredential") ||
      text.includes("AmazonSpApiAccessTokenCache") ||
      text.includes("AmazonSpApiConnectionAudit")
    ) {
      matches.push({ rel, text });
    }
  }
  return matches;
}

function assertMigrationStillDeployReady(repoRoot) {
  const matches = findAmazonMigration(repoRoot);
  assert(matches.length === 1, `Expected exactly one Amazon migration, found ${matches.length}`);

  const migration = matches[0];
  const sql = migration.text;

  for (const marker of [
    'CREATE TYPE "AmazonSpApiConnectionStatus"',
    'CREATE TABLE "AmazonSpApiConnection"',
    'CREATE TABLE "AmazonSpApiCredential"',
    'CREATE TABLE "AmazonSpApiAccessTokenCache"',
    'CREATE TABLE "AmazonSpApiConnectionAudit"',
    'ON DELETE RESTRICT',
    'ON UPDATE CASCADE',
    'encryptedRefreshToken',
    'encryptedAccessToken',
  ]) {
    assert(sql.includes(marker), `Migration SQL missing readiness marker: ${marker}`);
  }

  for (const pattern of [
    /\bDROP\s+TABLE\b/i,
    /\bDROP\s+COLUMN\b/i,
    /\bDROP\s+INDEX\b/i,
    /\bTRUNCATE\b/i,
    /^\s*DELETE\s+FROM\b/im,
    /^\s*UPDATE\s+/im,
    /ALTER\s+TABLE\s+"?Transaction"?/i,
    /ALTER\s+TABLE\s+"?ImportJob"?/i,
    /ALTER\s+TABLE\s+"?ImportStagingRow"?/i,
    /ALTER\s+TABLE\s+"?(InventoryBalance|InventoryMovement)"?/i,
    /ALTER\s+TABLE\s+"?(Product|ProductSku|ProductSkuAlias)"?/i,
    /ALTER\s+TABLE\s+"?Account"?/i,
    /ALTER\s+TABLE\s+"?(Invoice|PaymentReceipt)"?/i,
    /ON\s+DELETE\s+CASCADE/i,
    /\bRENAME\b/i,
  ]) {
    assert(!pattern.test(sql), `Migration SQL contains forbidden readiness pattern: ${pattern}`);
  }

  return {
    migrationFile: migration.rel,
    migrationSqlLength: sql.length,
  };
}

function assertNoDeployImplementation(repoRoot) {
  const files = [
    ...listFiles(path.resolve(repoRoot, "apps/api/src"), (p) => /\.(ts|tsx|js|jsx)$/.test(p)),
    ...listFiles(path.resolve(repoRoot, "apps/web/src"), (p) => /\.(ts|tsx|js|jsx)$/.test(p)),
  ];

  const routeLeaks = [];
  const frontendLeaks = [];
  const serviceLeaks = [];

  for (const file of files) {
    const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");
    const text = read(file);
    const isDtoOrSmokeRelated =
      rel.includes("src/imports/dto/") ||
      rel.includes("scripts/smoke-amazon-sp-api") ||
      rel.includes("amazon-sp-api-sandbox") ||
      text.includes("AmazonSpApiSandbox");

    if (isDtoOrSmokeRelated) continue;

    if (/prisma\.amazonSpApi(Connection|Credential|AccessTokenCache|ConnectionAudit)\.(create|update|upsert|delete|deleteMany)/.test(text)) {
      serviceLeaks.push(rel);
    }

    if (/@(Get|Post|Patch|Delete)\s*\([^)]*(amazon-sp-api|oauth|callback|connect|authorization|token|credential|connection)/i.test(text)) {
      routeLeaks.push(rel);
    }

    if (
      text.includes("/api/imports/amazon-sp-api") ||
      text.includes("AmazonSpApiConnectionStatus") ||
      text.includes("amazonSpApiConnection") ||
      text.includes("Amazonと連携") ||
      text.includes("連携解除")
    ) {
      frontendLeaks.push(rel);
    }
  }

  assert(serviceLeaks.length === 0, `Unexpected Amazon SP-API persistence service implementation: ${JSON.stringify(serviceLeaks)}`);
  assert(routeLeaks.length === 0, `Unexpected Amazon SP-API route implementation: ${JSON.stringify(routeLeaks)}`);
  assert(frontendLeaks.length === 0, `Unexpected Amazon SP-API frontend implementation: ${JSON.stringify(frontendLeaks)}`);

  return { serviceLeaks, routeLeaks, frontendLeaks };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");
  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-migration-deploy-readiness-production-gate-contract"] ===
      "node scripts/smoke-amazon-sp-api-migration-deploy-readiness-production-gate-contract.js",
    "Step124-E npm script missing or mismatched",
  );

  assert(packageJson.scripts["smoke:amazon-sp-api-create-only-prisma-migration-contract"], "Step124-D smoke script missing");

  const contract = assertAmazonSpApiMigrationDeployReadinessProductionGateContract(
    buildAmazonSpApiMigrationDeployReadinessProductionGateContract(),
  );

  assert(contract.sourceStep124D.summary.readyForMigrationDeployPlan === true, "Step124-D must allow Step124-E");
  assert(contract.deployReadinessContractOnly === true, "Step124-E must be deploy readiness only");
  assert(contract.productionGateOnly === true, "Step124-E must be production gate only");
  assert(contract.prismaMigrateDeployNow === false, "Step124-E must not run migrate deploy");
  assert(contract.prismaDbPushNow === false, "Step124-E must not run db push");
  assert(contract.databaseWriteNow === false, "Step124-E must not write DB");
  assert(contract.allowedFutureDeployCommand.notRunInThisStep === true, "Step124-E future deploy command must not run");
  assert(contract.summary.readyForManualMigrationDeployScript === true, "Step124-E should allow manual deploy script next");
  assert(contract.summary.readyForActualMigrationDeploy === false, "Step124-E must not allow un-gated deploy yet");

  const migrationGuard = assertMigrationStillDeployReady(repoRoot);
  const implementationGuard = assertNoDeployImplementation(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api migration deploy readiness production gate contract smoke passed");
  console.log(JSON.stringify({ ok: true, step: "Step124-E", migrationGuard, implementationGuard, summary: contract.summary }, null, 2));
}

main().catch((err) => {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
});
