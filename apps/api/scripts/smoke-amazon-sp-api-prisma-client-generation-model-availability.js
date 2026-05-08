#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const { PrismaClient, AmazonSpApiConnectionStatus } = require("@prisma/client");

const {
  assertAmazonSpApiPrismaClientGenerationModelAvailabilityContract,
  buildAmazonSpApiPrismaClientGenerationModelAvailabilityContract,
} = require("../dist/src/imports/dto/amazon-sp-api-prisma-client-generation-model-availability.dto");

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
      if (
        name === "node_modules" ||
        name === "dist" ||
        name === ".next" ||
        name === "coverage"
      ) {
        continue;
      }
      listFiles(p, predicate, acc);
    } else if (predicate(p)) {
      acc.push(p);
    }
  }

  return acc;
}

function assertNoMigrationFileCreated(repoRoot) {
  const migrationsDir = path.resolve(repoRoot, "apps/api/prisma/migrations");
  const leaks = [];

  if (fs.existsSync(migrationsDir)) {
    for (const file of listFiles(migrationsDir, (p) => p.endsWith(".sql"))) {
      const text = read(file);
      const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");
      if (
        text.includes("AmazonSpApiConnection") ||
        text.includes("AmazonSpApiCredential") ||
        text.includes("AmazonSpApiAccessTokenCache") ||
        text.includes("AmazonSpApiConnectionAudit")
      ) {
        leaks.push(rel);
      }
    }
  }

  assert(leaks.length === 0, `Step124-B must not create Amazon migration file: ${JSON.stringify(leaks)}`);

  return { migrationLeaks: leaks };
}

function assertPrismaClientDelegatesAvailable() {
  const prisma = new PrismaClient();

  const delegates = [
    "amazonSpApiConnection",
    "amazonSpApiCredential",
    "amazonSpApiAccessTokenCache",
    "amazonSpApiConnectionAudit",
  ];

  const availability = {};

  for (const delegate of delegates) {
    const value = prisma[delegate];
    availability[delegate] = {
      exists: Boolean(value),
      hasFindMany: Boolean(value && typeof value.findMany === "function"),
      hasFindUnique: Boolean(value && typeof value.findUnique === "function"),
      hasCreate: Boolean(value && typeof value.create === "function"),
      hasUpdate: Boolean(value && typeof value.update === "function"),
      hasUpsert: Boolean(value && typeof value.upsert === "function"),
    };

    assert(value, `PrismaClient missing delegate: ${delegate}`);
    assert(typeof value.findMany === "function", `PrismaClient delegate missing findMany: ${delegate}`);
    assert(typeof value.findUnique === "function", `PrismaClient delegate missing findUnique: ${delegate}`);
    assert(typeof value.create === "function", `PrismaClient delegate missing create: ${delegate}`);
    assert(typeof value.update === "function", `PrismaClient delegate missing update: ${delegate}`);
    assert(typeof value.upsert === "function", `PrismaClient delegate missing upsert: ${delegate}`);
  }

  assert(AmazonSpApiConnectionStatus, "Prisma Client missing AmazonSpApiConnectionStatus enum");

  for (const status of ["AUTHORIZATION_PENDING", "CONNECTED", "REVOKED", "EXPIRED", "ERROR"]) {
    assert(
      AmazonSpApiConnectionStatus[status] === status,
      `Prisma enum AmazonSpApiConnectionStatus missing ${status}`,
    );
  }

  return {
    delegates: availability,
    enumValues: {
      AUTHORIZATION_PENDING: AmazonSpApiConnectionStatus.AUTHORIZATION_PENDING,
      CONNECTED: AmazonSpApiConnectionStatus.CONNECTED,
      REVOKED: AmazonSpApiConnectionStatus.REVOKED,
      EXPIRED: AmazonSpApiConnectionStatus.EXPIRED,
      ERROR: AmazonSpApiConnectionStatus.ERROR,
    },
  };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-prisma-client-generation-model-availability"] ===
      "node scripts/smoke-amazon-sp-api-prisma-client-generation-model-availability.js",
    "Step124-B npm script missing or mismatched",
  );

  const schema = read(path.resolve(apiRoot, "prisma/schema.prisma"));
  for (const marker of [
    "enum AmazonSpApiConnectionStatus",
    "model AmazonSpApiConnection",
    "model AmazonSpApiCredential",
    "model AmazonSpApiAccessTokenCache",
    "model AmazonSpApiConnectionAudit",
    "encryptedRefreshToken",
    "encryptedAccessToken",
    "onDelete: Restrict",
  ]) {
    assert(schema.includes(marker), `schema.prisma missing marker: ${marker}`);
  }

  const contract = assertAmazonSpApiPrismaClientGenerationModelAvailabilityContract(
    buildAmazonSpApiPrismaClientGenerationModelAvailabilityContract(),
  );

  assert(contract.sourceStep124A.schemaPrismaEditedNow === true, "Step124-B must depend on Step124-A schema edit");
  assert(contract.sourceStep124A.summary.readyForPrismaGenerateStep === true, "Step124-A must allow Prisma generate step");
  assert(contract.prismaGenerateNow === true, "Step124-B must run Prisma generate");
  assert(contract.prismaClientAvailabilitySmokeNow === true, "Step124-B must check Prisma Client availability");
  assert(contract.migrationFileAddedNow === false, "Step124-B must not add migration file");
  assert(contract.prismaMigrateNow === false, "Step124-B must not run migrate");
  assert(contract.databaseWriteNow === false, "Step124-B must not write DB");

  const prismaAvailability = assertPrismaClientDelegatesAvailable();
  const migrationGuard = assertNoMigrationFileCreated(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api Prisma client generation model availability smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step124-B",
        contract: {
          version: contract.version,
          prismaGenerateNow: contract.prismaGenerateNow,
          prismaClientAvailabilitySmokeNow: contract.prismaClientAvailabilitySmokeNow,
          apiBuildNow: contract.apiBuildNow,
          migrationFileAddedNow: contract.migrationFileAddedNow,
          prismaMigrateNow: contract.prismaMigrateNow,
          databaseWriteNow: contract.databaseWriteNow,
          backendRouteAddedNow: contract.backendRouteAddedNow,
          frontendAddedNow: contract.frontendAddedNow,
          tokenPersistenceWriteNow: contract.tokenPersistenceWriteNow,
          tokenExchangeHttpCallNow: contract.tokenExchangeHttpCallNow,
          realSpApiRequestNow: contract.realSpApiRequestNow,
          writesDatabase: contract.writesDatabase,
          expectedPrismaDelegates: contract.expectedPrismaDelegates,
          expectedGeneratedEnum: contract.expectedGeneratedEnum,
          clientAvailabilityBoundary: contract.clientAvailabilityBoundary,
          forbiddenNow: contract.forbiddenNow,
          summary: contract.summary,
        },
        prismaAvailability,
        migrationGuard,
      },
      null,
      2,
    ),
  );

  await new PrismaClient().$disconnect().catch(() => undefined);
}

main().catch((err) => {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
});
