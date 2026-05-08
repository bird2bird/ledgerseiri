#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiMigrationFileCreationPlanDeploySafetyContract,
  buildAmazonSpApiMigrationFileCreationPlanDeploySafetyContract,
} = require("../dist/src/imports/dto/amazon-sp-api-migration-file-creation-plan-deploy-safety-contract.dto");

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

function assertSchemaPostGenerateReady(apiRoot) {
  const schema = read(path.resolve(apiRoot, "prisma/schema.prisma"));

  for (const marker of [
    "enum AmazonSpApiConnectionStatus",
    "model AmazonSpApiConnection",
    "model AmazonSpApiCredential",
    "model AmazonSpApiAccessTokenCache",
    "model AmazonSpApiConnectionAudit",
    "encryptedRefreshToken",
    "encryptedAccessToken",
    "@@unique([companyId, storeId, marketplaceId, region])",
    "@@unique([sellingPartnerId, marketplaceId, region])",
    "onDelete: Restrict",
  ]) {
    assert(schema.includes(marker), `schema.prisma missing post-generate migration marker: ${marker}`);
  }

  const amazonBlock = schema.slice(schema.indexOf("enum AmazonSpApiConnectionStatus"));

  for (const forbidden of [
    "refreshToken ",
    "accessToken ",
    "clientSecret",
    "authorizationCode",
    "spapiOAuthCode",
    "rawOAuthState",
    "onDelete: Cascade",
  ]) {
    assert(!amazonBlock.includes(forbidden), `Amazon schema block contains forbidden marker: ${forbidden}`);
  }
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

  assert(leaks.length === 0, `Step124-C must not create Amazon migration file: ${JSON.stringify(leaks)}`);

  return { migrationLeaks: leaks };
}

function assertNoServiceRouteFrontendImplementation(repoRoot) {
  const apiSrcRoot = path.resolve(repoRoot, "apps/api/src");
  const webSrcRoot = path.resolve(repoRoot, "apps/web/src");

  const apiFiles = listFiles(apiSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p))
    .filter((file) => !file.includes(`${path.sep}src${path.sep}imports${path.sep}dto${path.sep}`));

  const webFiles = listFiles(webSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));

  const serviceLeaks = [];
  const routeLeaks = [];
  const frontendLeaks = [];

  const apiImplementationFragments = [
    "saveAmazonSpApiToken",
    "upsertAmazonSpApiConnection",
    "upsertAmazonSpApiCredential",
    "upsertAmazonSpApiAccessTokenCache",
    "writeAmazonSpApiConnectionAudit",
    "prisma.amazonSpApiConnection.create",
    "prisma.amazonSpApiCredential.create",
    "prisma.amazonSpApiAccessTokenCache.create",
    "prisma.amazonSpApiConnectionAudit.create",
  ];

  const routePatterns = [
    /@Get\s*\([^)]*(amazon-sp-api|oauth|callback|connect|authorize|authorization|token|credential|connection-status|connection)/i,
    /@Post\s*\([^)]*(amazon-sp-api|oauth|callback|connect|authorize|authorization|token|credential|connection-status|connection)/i,
  ];

  const allowedExistingSandboxFragments = [
    "amazon-sp-api-sandbox",
    "AmazonSpApiSandbox",
    "internal/amazon-sp-api-sandbox/import-jobs/read-model",
  ];

  for (const file of apiFiles) {
    const text = read(file);
    const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");
    const sandboxOnly = allowedExistingSandboxFragments.some((fragment) => text.includes(fragment));

    if (!sandboxOnly && apiImplementationFragments.some((fragment) => text.includes(fragment))) {
      serviceLeaks.push(rel);
    }

    if (!sandboxOnly && routePatterns.some((pattern) => pattern.test(text))) {
      routeLeaks.push(rel);
    }
  }

  for (const file of webFiles) {
    const text = read(file);
    const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");
    const sandboxOnly = allowedExistingSandboxFragments.some((fragment) => text.includes(fragment));

    if (
      !sandboxOnly &&
      (
        text.includes("/api/imports/amazon-sp-api") ||
        text.includes("AmazonSpApiConnectionStatus") ||
        text.includes("amazonSpApiConnection") ||
        text.includes("Amazonと連携") ||
        text.includes("連携解除")
      )
    ) {
      frontendLeaks.push(rel);
    }
  }

  assert(serviceLeaks.length === 0, `Step124-C must not add token persistence service implementation: ${JSON.stringify(serviceLeaks)}`);
  assert(routeLeaks.length === 0, `Step124-C must not add real Amazon SP-API route implementation: ${JSON.stringify(routeLeaks)}`);
  assert(frontendLeaks.length === 0, `Step124-C must not add real Amazon SP-API frontend implementation: ${JSON.stringify(frontendLeaks)}`);

  return { serviceLeaks, routeLeaks, frontendLeaks };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-migration-file-creation-plan-deploy-safety-contract"] ===
      "node scripts/smoke-amazon-sp-api-migration-file-creation-plan-deploy-safety-contract.js",
    "Step124-C npm script missing or mismatched",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-prisma-client-generation-model-availability"],
    "Step124-B regression smoke script missing",
  );

  const contract = assertAmazonSpApiMigrationFileCreationPlanDeploySafetyContract(
    buildAmazonSpApiMigrationFileCreationPlanDeploySafetyContract(),
  );

  assert(contract.sourceStep124B.prismaGenerateNow === true, "Step124-C must depend on Step124-B Prisma generation");
  assert(contract.sourceStep124B.summary.readyForMigrationFileCreationPlan === true, "Step124-B must allow migration plan");
  assert(contract.contractOnly === true, "Step124-C must be contract-only");
  assert(contract.migrationPlanOnly === true, "Step124-C must be migration-plan-only");
  assert(contract.migrationFileCreatedNow === false, "Step124-C must not create migration file");
  assert(contract.prismaMigrateDevNow === false, "Step124-C must not run migrate dev");
  assert(contract.prismaMigrateDeployNow === false, "Step124-C must not run migrate deploy");
  assert(contract.databaseWriteNow === false, "Step124-C must not write DB");
  assert(contract.deployCommandPlan.noCommandRunsInThisStep === true, "Step124-C must not run deploy commands");
  assert(contract.summary.readyForCreateOnlyMigrationScript === true, "Step124-C should allow Step124-D create-only migration script");
  assert(contract.summary.readyForActualMigrationDeploy === false, "Step124-C must not allow deploy yet");

  assertSchemaPostGenerateReady(apiRoot);
  const migrationGuard = assertNoMigrationFileCreated(repoRoot);
  const implementationGuard = assertNoServiceRouteFrontendImplementation(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api migration file creation plan / deploy safety contract smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step124-C",
        contract: {
          version: contract.version,
          contractOnly: contract.contractOnly,
          migrationPlanOnly: contract.migrationPlanOnly,
          migrationFileCreatedNow: contract.migrationFileCreatedNow,
          prismaMigrateDevNow: contract.prismaMigrateDevNow,
          prismaMigrateDeployNow: contract.prismaMigrateDeployNow,
          prismaDbPushNow: contract.prismaDbPushNow,
          databaseWriteNow: contract.databaseWriteNow,
          backendRouteAddedNow: contract.backendRouteAddedNow,
          frontendAddedNow: contract.frontendAddedNow,
          tokenPersistenceWriteNow: contract.tokenPersistenceWriteNow,
          tokenExchangeHttpCallNow: contract.tokenExchangeHttpCallNow,
          realSpApiRequestNow: contract.realSpApiRequestNow,
          writesDatabase: contract.writesDatabase,
          migrationNamingPlan: contract.migrationNamingPlan,
          allowedSqlPlan: contract.allowedSqlPlan,
          destructiveSqlForbidden: contract.destructiveSqlForbidden,
          existingModelProtection: contract.existingModelProtection,
          preDeployGate: contract.preDeployGate,
          deployCommandPlan: contract.deployCommandPlan,
          rollbackPlan: contract.rollbackPlan,
          postMigrationValidationPlan: contract.postMigrationValidationPlan,
          forbiddenNow: contract.forbiddenNow,
          summary: contract.summary,
        },
        migrationGuard,
        implementationGuard,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
});
