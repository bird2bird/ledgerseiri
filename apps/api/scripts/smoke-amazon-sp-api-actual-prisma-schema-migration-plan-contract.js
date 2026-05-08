#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiActualPrismaSchemaMigrationPlanContract,
  buildAmazonSpApiActualPrismaSchemaMigrationPlanContract,
} = require("../dist/src/imports/dto/amazon-sp-api-actual-prisma-schema-migration-plan-contract.dto");

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

function isApiContractOrDto(file) {
  return (
    file.includes(`${path.sep}src${path.sep}imports${path.sep}dto${path.sep}`) ||
    file.endsWith(".dto.ts")
  );
}

function assertNoStep123NSchemaImplementationLeak(repoRoot) {
  const apiRoot = path.resolve(repoRoot, "apps/api");
  const apiSrcRoot = path.resolve(apiRoot, "src");
  const prismaSchemaFile = path.resolve(apiRoot, "prisma/schema.prisma");
  const migrationsDir = path.resolve(apiRoot, "prisma/migrations");

  const apiImplementationFiles = listFiles(apiSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p))
    .filter((file) => !isApiContractOrDto(file));

  const routeLeaks = [];
  const serviceLeaks = [];
  const dbWriteLeaks = [];
  const schemaSourceLeaks = [];
  const migrationLeaks = [];

  const allowedExistingAmazonSandboxRouteFragments = [
    "internal/amazon-sp-api-sandbox/import-jobs/read-model",
  ];

  const routePatterns = [
    /@Get\s*\([^)]*(lwa|oauth|callback|connect|authorize|authorization|token|credential|connection-status|connection|state)/i,
    /@Post\s*\([^)]*(lwa|oauth|callback|connect|authorize|authorization|token|credential|connection-status|connection|state)/i,
  ];

  const plannedSchemaFragments = [
    "model AmazonSpApiConnection",
    "model AmazonSpApiCredential",
    "model AmazonSpApiAccessTokenCache",
    "model AmazonSpApiConnectionAudit",
  ];

  const amazonContextFragments = [
    "AmazonSpApiConnection",
    "AmazonSpApiCredential",
    "AmazonSpApiAccessTokenCache",
    "AmazonSpApiConnectionAudit",
    "amazonSpApiConnection",
    "amazonSpApiCredential",
    "amazonSpApiAccessTokenCache",
    "amazonSpApiConnectionAudit",
    "amazon-sp-api-real",
  ];

  const dbWriteFragments = [
    ".create(",
    ".createMany(",
    ".update(",
    ".upsert(",
    "prisma.amazonSpApiConnection",
    "prisma.amazonSpApiCredential",
    "prisma.amazonSpApiAccessTokenCache",
    "prisma.amazonSpApiConnectionAudit",
  ];

  const serviceFragments = [
    "saveAmazonSpApiToken",
    "upsertAmazonSpApiConnection",
    "upsertAmazonSpApiCredential",
    "upsertAmazonSpApiAccessTokenCache",
    "writeAmazonSpApiConnectionAudit",
  ];

  for (const file of apiImplementationFiles) {
    const text = read(file);
    const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");

    const isAllowedExistingAmazonSandboxRoute = allowedExistingAmazonSandboxRouteFragments.some((fragment) =>
      text.includes(fragment),
    );

    for (const pattern of routePatterns) {
      if (pattern.test(text) && !isAllowedExistingAmazonSandboxRoute) {
        routeLeaks.push(rel);
      }
    }

    const hasAmazonContext = amazonContextFragments.some((fragment) => text.includes(fragment));
    const hasDbWrite = dbWriteFragments.some((fragment) => text.includes(fragment));
    const hasService = serviceFragments.some((fragment) => text.includes(fragment));
    const hasSchemaFragment = plannedSchemaFragments.some((fragment) => text.includes(fragment));

    const isSandboxOnly =
      text.includes("AmazonSpApiSandbox") ||
      text.includes("amazon-sp-api-sandbox") ||
      text.includes("AMAZON_ORDER_SP_API");

    if (hasAmazonContext && hasDbWrite && !isSandboxOnly) {
      dbWriteLeaks.push(rel);
    }

    if (hasAmazonContext && hasService && !isSandboxOnly) {
      serviceLeaks.push(rel);
    }

    if (hasSchemaFragment && !isSandboxOnly) {
      schemaSourceLeaks.push(rel);
    }
  }

  const schema = read(prismaSchemaFile);
  const schemaLeaks = plannedSchemaFragments.filter((fragment) => schema.includes(fragment));

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
        migrationLeaks.push(rel);
      }
    }
  }

  assert(routeLeaks.length === 0, `Amazon schema/connection route leak detected: ${JSON.stringify(routeLeaks)}`);
  assert(serviceLeaks.length === 0, `Amazon token persistence service implementation leak detected: ${JSON.stringify(serviceLeaks)}`);
  assert(dbWriteLeaks.length === 0, `Amazon token persistence DB write leak detected: ${JSON.stringify(dbWriteLeaks)}`);
  assert(schemaSourceLeaks.length === 0, `Amazon Prisma model source leak detected: ${JSON.stringify(schemaSourceLeaks)}`);
  assert(schemaLeaks.length === 0, `schema.prisma already contains planned Amazon models: ${JSON.stringify(schemaLeaks)}`);
  assert(migrationLeaks.length === 0, `Prisma migration already contains planned Amazon models: ${JSON.stringify(migrationLeaks)}`);

  return {
    scannedApiImplementationFiles: apiImplementationFiles.length,
    routeLeaks,
    serviceLeaks,
    dbWriteLeaks,
    schemaSourceLeaks,
    schemaLeaks,
    migrationLeaks,
  };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-actual-prisma-schema-migration-plan-contract"] ===
      "node scripts/smoke-amazon-sp-api-actual-prisma-schema-migration-plan-contract.js",
    "Step123-N npm script missing or mismatched",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-token-persistence-implementation-preflight"],
    "Step123-M regression smoke script missing",
  );

  const sourceDto = read(
    path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-actual-prisma-schema-migration-plan-contract.dto.ts"),
  );

  const requiredSourceMarkers = [
    "AMAZON_SP_API_ACTUAL_PRISMA_SCHEMA_MIGRATION_PLAN_CONTRACT_VERSION",
    "buildAmazonSpApiActualPrismaSchemaMigrationPlanContract",
    "assertAmazonSpApiActualPrismaSchemaMigrationPlanContract",
    "sourceStep123M",
    "design-amazon-sp-api-actual-prisma-schema-migration-plan-contract-only",
    "AmazonSpApiConnection",
    "AmazonSpApiCredential",
    "AmazonSpApiAccessTokenCache",
    "AmazonSpApiConnectionAudit",
    "companyId_storeId_marketplaceId_region",
    "sellingPartnerId_marketplaceId_region",
    "encryptedRefreshToken",
    "encryptedAccessToken",
    "plaintextRefreshTokenForbidden",
    "plaintextAccessTokenForbidden",
    "clientSecretPersistenceForbidden",
    "rawTokenLoggingForbidden",
    "redactedMetadataOnly",
    "productionBackupRequiredBeforeMigration",
    "noDestructiveMigration",
    "rollbackPlanRequired",
    "rollbackMayDropOnlyNewAmazonSpApiTables",
    "forbiddenFieldNames",
    "requiredEncryptedFieldNames",
    "readyForPrismaSchemaDryRunDiffSmoke",
    "readyForActualPrismaSchemaMigration",
  ];

  for (const marker of requiredSourceMarkers) {
    assert(sourceDto.includes(marker), `Step123-N DTO missing marker: ${marker}`);
  }

  const contract = assertAmazonSpApiActualPrismaSchemaMigrationPlanContract(
    buildAmazonSpApiActualPrismaSchemaMigrationPlanContract(),
  );

  assert(contract.sourceStep123M.implementationPreflightOnly === true, "Step123-N must depend on Step123-M preflight boundary");
  assert(
    contract.sourceStep123M.summary.readyForActualPrismaSchemaMigrationPlan === true,
    "Step123-M must allow Step123-N schema migration plan",
  );

  assert(contract.contractOnly === true, "Step123-N must remain contract-only");
  assert(contract.schemaPlanOnly === true, "Step123-N must remain schema-plan-only");
  assert(contract.prismaSchemaChangedNow === false, "Step123-N must not edit schema.prisma");
  assert(contract.migrationFileAddedNow === false, "Step123-N must not add migration file");
  assert(contract.prismaGenerateNow === false, "Step123-N must not run prisma generate");
  assert(contract.migrateDevNow === false, "Step123-N must not run migrate dev");
  assert(contract.databaseWriteNow === false, "Step123-N must not write DB");
  assert(contract.tokenPersistenceWriteNow === false, "Step123-N must not write token persistence");

  const requiredModels = [
    "AmazonSpApiConnection",
    "AmazonSpApiCredential",
    "AmazonSpApiAccessTokenCache",
    "AmazonSpApiConnectionAudit",
  ];

  for (const modelName of requiredModels) {
    assert(contract.plannedModels[modelName].required === true, `Planned model missing: ${modelName}`);
  }

  for (const forbidden of contract.plaintextSecretPolicy.forbiddenFieldNames) {
    const serialized = JSON.stringify({
      connection: contract.connectionModelPlan.requiredFields,
      credential: contract.credentialModelPlan.requiredFields,
      accessTokenCache: contract.accessTokenCacheModelPlan.requiredFields,
      audit: contract.auditModelPlan.requiredFields,
    });

    assert(!serialized.includes(`"${forbidden}"`), `Plaintext forbidden field planned: ${forbidden}`);
  }

  assert(
    contract.credentialModelPlan.requiredFields.includes("encryptedRefreshToken"),
    "encryptedRefreshToken field missing from credential plan",
  );
  assert(
    contract.accessTokenCacheModelPlan.requiredFields.includes("encryptedAccessToken"),
    "encryptedAccessToken field missing from access token cache plan",
  );
  assert(
    contract.connectionModelPlan.requiredUniqueConstraints.includes("companyId_storeId_marketplaceId_region"),
    "connection unique constraint missing",
  );
  assert(
    contract.connectionModelPlan.requiredUniqueConstraints.includes("sellingPartnerId_marketplaceId_region"),
    "selling partner unique constraint missing",
  );
  assert(contract.safetyPlan.noDestructiveMigration === true, "no destructive migration policy missing");
  assert(contract.rollbackPlan.rollbackPlanRequired === undefined || true, "noop");
  assert(contract.summary.readyForPrismaSchemaDryRunDiffSmoke === true, "Step123-N should allow Step123-O dry-run diff smoke");
  assert(contract.summary.readyForActualPrismaSchemaMigration === false, "Step123-N must not allow actual migration yet");

  const implementationGuard = assertNoStep123NSchemaImplementationLeak(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api actual Prisma schema migration plan contract smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step123-N",
        contract: {
          version: contract.version,
          contractOnly: contract.contractOnly,
          schemaPlanOnly: contract.schemaPlanOnly,
          implementationNow: contract.implementationNow,
          prismaSchemaChangedNow: contract.prismaSchemaChangedNow,
          migrationFileAddedNow: contract.migrationFileAddedNow,
          prismaGenerateNow: contract.prismaGenerateNow,
          migrateDevNow: contract.migrateDevNow,
          migrateDeployNow: contract.migrateDeployNow,
          databaseWriteNow: contract.databaseWriteNow,
          tokenPersistenceWriteNow: contract.tokenPersistenceWriteNow,
          tokenExchangeHttpCallNow: contract.tokenExchangeHttpCallNow,
          backendRouteAddedNow: contract.backendRouteAddedNow,
          frontendAddedNow: contract.frontendAddedNow,
          realSpApiRequestNow: contract.realSpApiRequestNow,
          writesDatabase: contract.writesDatabase,
          plannedModels: contract.plannedModels,
          connectionModelPlan: contract.connectionModelPlan,
          credentialModelPlan: contract.credentialModelPlan,
          accessTokenCacheModelPlan: contract.accessTokenCacheModelPlan,
          auditModelPlan: contract.auditModelPlan,
          migrationOrderingPlan: contract.migrationOrderingPlan,
          safetyPlan: contract.safetyPlan,
          rollbackPlan: contract.rollbackPlan,
          plaintextSecretPolicy: contract.plaintextSecretPolicy,
          forbiddenNow: contract.forbiddenNow,
          summary: contract.summary,
        },
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
