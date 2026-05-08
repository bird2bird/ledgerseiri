#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiCreateOnlyPrismaMigrationContract,
  buildAmazonSpApiCreateOnlyPrismaMigrationContract,
} = require("../dist/src/imports/dto/amazon-sp-api-create-only-prisma-migration-contract.dto");

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

function assertPattern(sql, pattern, label) {
  assert(pattern.test(sql), `Migration SQL missing ${label}: ${pattern}`);
}

function assertMigrationSqlSafe(repoRoot) {
  const matches = findAmazonMigration(repoRoot);
  assert(matches.length === 1, `Expected exactly one Amazon SP-API migration file, found ${matches.length}: ${JSON.stringify(matches.map((m) => m.rel))}`);

  const migration = matches[0];
  const sql = migration.text;

  for (const marker of [
    'CREATE TYPE "AmazonSpApiConnectionStatus"',
    'CREATE TABLE "AmazonSpApiConnection"',
    'CREATE TABLE "AmazonSpApiCredential"',
    'CREATE TABLE "AmazonSpApiAccessTokenCache"',
    'CREATE TABLE "AmazonSpApiConnectionAudit"',
    'FOREIGN KEY',
  ]) {
    assert(sql.includes(marker), `Migration SQL missing required marker: ${marker}`);
  }

  assertPattern(sql, /CREATE\s+UNIQUE\s+INDEX\s+"[^"]*"\s+ON\s+"AmazonSpApiConnection"\s*\(\s*"companyId"\s*,\s*"storeId"\s*,\s*"marketplaceId"\s*,\s*"region"\s*\)/i, "connection identity unique index by columns");
  assertPattern(sql, /CREATE\s+UNIQUE\s+INDEX\s+"[^"]*"\s+ON\s+"AmazonSpApiConnection"\s*\(\s*"sellingPartnerId"\s*,\s*"marketplaceId"\s*,\s*"region"\s*\)/i, "seller marketplace region unique index by columns");
  assertPattern(sql, /CREATE\s+UNIQUE\s+INDEX\s+"[^"]*"\s+ON\s+"AmazonSpApiCredential"\s*\(\s*"connectionId"\s*\)/i, "credential connection unique index");
  assertPattern(sql, /CREATE\s+UNIQUE\s+INDEX\s+"[^"]*"\s+ON\s+"AmazonSpApiAccessTokenCache"\s*\(\s*"connectionId"\s*\)/i, "access cache connection unique index");

  for (const pattern of [
    /CREATE\s+INDEX\s+"[^"]*"\s+ON\s+"AmazonSpApiConnection"\s*\(\s*"companyId"\s*\)/i,
    /CREATE\s+INDEX\s+"[^"]*"\s+ON\s+"AmazonSpApiConnection"\s*\(\s*"storeId"\s*\)/i,
    /CREATE\s+INDEX\s+"[^"]*"\s+ON\s+"AmazonSpApiConnection"\s*\(\s*"marketplaceId"\s*\)/i,
    /CREATE\s+INDEX\s+"[^"]*"\s+ON\s+"AmazonSpApiConnection"\s*\(\s*"region"\s*\)/i,
    /CREATE\s+INDEX\s+"[^"]*"\s+ON\s+"AmazonSpApiConnection"\s*\(\s*"status"\s*\)/i,
    /CREATE\s+INDEX\s+"[^"]*"\s+ON\s+"AmazonSpApiConnection"\s*\(\s*"lastSyncAt"\s*\)/i,
    /CREATE\s+INDEX\s+"[^"]*"\s+ON\s+"AmazonSpApiAccessTokenCache"\s*\(\s*"expiresAt"\s*\)/i,
    /CREATE\s+INDEX\s+"[^"]*"\s+ON\s+"AmazonSpApiConnectionAudit"\s*\(\s*"companyId"\s*\)/i,
    /CREATE\s+INDEX\s+"[^"]*"\s+ON\s+"AmazonSpApiConnectionAudit"\s*\(\s*"storeId"\s*\)/i,
    /CREATE\s+INDEX\s+"[^"]*"\s+ON\s+"AmazonSpApiConnectionAudit"\s*\(\s*"connectionId"\s*\)/i,
    /CREATE\s+INDEX\s+"[^"]*"\s+ON\s+"AmazonSpApiConnectionAudit"\s*\(\s*"eventType"\s*\)/i,
    /CREATE\s+INDEX\s+"[^"]*"\s+ON\s+"AmazonSpApiConnectionAudit"\s*\(\s*"createdAt"\s*\)/i,
  ]) {
    assertPattern(sql, pattern, "non-unique index by columns");
  }

  for (const pattern of [
    /ALTER\s+TABLE\s+"AmazonSpApiConnection"\s+ADD\s+CONSTRAINT\s+"[^"]*"\s+FOREIGN\s+KEY\s*\(\s*"companyId"\s*\)\s+REFERENCES\s+"Company"\s*\(\s*"id"\s*\)/i,
    /ALTER\s+TABLE\s+"AmazonSpApiConnection"\s+ADD\s+CONSTRAINT\s+"[^"]*"\s+FOREIGN\s+KEY\s*\(\s*"storeId"\s*\)\s+REFERENCES\s+"Store"\s*\(\s*"id"\s*\)/i,
    /ALTER\s+TABLE\s+"AmazonSpApiCredential"\s+ADD\s+CONSTRAINT\s+"[^"]*"\s+FOREIGN\s+KEY\s*\(\s*"connectionId"\s*\)\s+REFERENCES\s+"AmazonSpApiConnection"\s*\(\s*"id"\s*\)/i,
    /ALTER\s+TABLE\s+"AmazonSpApiAccessTokenCache"\s+ADD\s+CONSTRAINT\s+"[^"]*"\s+FOREIGN\s+KEY\s*\(\s*"connectionId"\s*\)\s+REFERENCES\s+"AmazonSpApiConnection"\s*\(\s*"id"\s*\)/i,
    /ALTER\s+TABLE\s+"AmazonSpApiConnectionAudit"\s+ADD\s+CONSTRAINT\s+"[^"]*"\s+FOREIGN\s+KEY\s*\(\s*"connectionId"\s*\)\s+REFERENCES\s+"AmazonSpApiConnection"\s*\(\s*"id"\s*\)/i,
    /ALTER\s+TABLE\s+"AmazonSpApiConnectionAudit"\s+ADD\s+CONSTRAINT\s+"[^"]*"\s+FOREIGN\s+KEY\s*\(\s*"companyId"\s*\)\s+REFERENCES\s+"Company"\s*\(\s*"id"\s*\)/i,
    /ALTER\s+TABLE\s+"AmazonSpApiConnectionAudit"\s+ADD\s+CONSTRAINT\s+"[^"]*"\s+FOREIGN\s+KEY\s*\(\s*"storeId"\s*\)\s+REFERENCES\s+"Store"\s*\(\s*"id"\s*\)/i,
  ]) {
    assertPattern(sql, pattern, "foreign key by table/columns");
  }

  assert(/ON\s+DELETE\s+(RESTRICT|NO\s+ACTION)/i.test(sql), "Migration SQL missing RESTRICT/NO ACTION delete behavior");

  const forbidden = [
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
  ];

  for (const pattern of forbidden) {
    assert(!pattern.test(sql), `Migration SQL contains forbidden pattern: ${pattern}`);
  }

  for (const forbiddenPlaintext of ["refreshToken", "accessToken", "clientSecret", "authorizationCode", "spapiOAuthCode", "rawOAuthState"]) {
    assert(!sql.includes(forbiddenPlaintext), `Migration SQL contains forbidden plaintext token field: ${forbiddenPlaintext}`);
  }

  return { migrationFile: migration.rel, migrationSqlLength: sql.length };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");
  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-create-only-prisma-migration-contract"] ===
      "node scripts/smoke-amazon-sp-api-create-only-prisma-migration-contract.js",
    "Step124-D npm script missing or mismatched",
  );

  const contract = assertAmazonSpApiCreateOnlyPrismaMigrationContract(
    buildAmazonSpApiCreateOnlyPrismaMigrationContract(),
  );

  assert(contract.migrationFileCreatedNow === true, "Step124-D must create migration file");
  assert(contract.createOnlyMigrationNow === true, "Step124-D must be create-only");
  assert(contract.prismaMigrateDeployNow === false, "Step124-D must not deploy migration");
  assert(contract.prismaDbPushNow === false, "Step124-D must not use db push");
  assert(contract.databaseWriteNow === false, "Step124-D must not write application data");
  assert(contract.updateStatementScannerIgnoresForeignKeyOnUpdateClause === true, "Step124-D scanner must ignore FK ON UPDATE clause");

  const migrationGuard = assertMigrationSqlSafe(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api create-only Prisma migration contract smoke passed");
  console.log(JSON.stringify({ ok: true, step: "Step124-D", migrationGuard, summary: contract.summary }, null, 2));
}

main().catch((err) => {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
});
