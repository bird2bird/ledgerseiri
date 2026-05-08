#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  AMAZON_SP_API_PROPOSED_PRISMA_SCHEMA_BLOCK,
  AMAZON_SP_API_PROPOSED_MIGRATION_SQL_PREVIEW,
  assertAmazonSpApiPrismaSchemaDryRunDiffSmokeContract,
  assertAmazonSpApiProposedPrismaSchemaDryRunDiff,
  buildAmazonSpApiPrismaSchemaDryRunDiffSmokeContract,
} = require("../dist/src/imports/dto/amazon-sp-api-prisma-schema-dry-run-diff-smoke.dto");

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

function assertNoStep123OSchemaWriteOrMigration(repoRoot) {
  const apiRoot = path.resolve(repoRoot, "apps/api");
  const apiSrcRoot = path.resolve(apiRoot, "src");
  const prismaSchemaFile = path.resolve(apiRoot, "prisma/schema.prisma");
  const migrationsDir = path.resolve(apiRoot, "prisma/migrations");

  const apiImplementationFiles = listFiles(apiSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p))
    .filter((file) => !isApiContractOrDto(file));

  const plannedModelFragments = [
    "model AmazonSpApiConnection",
    "model AmazonSpApiCredential",
    "model AmazonSpApiAccessTokenCache",
    "model AmazonSpApiConnectionAudit",
  ];

  const routeLeaks = [];
  const serviceLeaks = [];
  const dbWriteLeaks = [];
  const migrationLeaks = [];

  const allowedExistingAmazonSandboxRouteFragments = [
    "internal/amazon-sp-api-sandbox/import-jobs/read-model",
  ];

  const routePatterns = [
    /@Get\s*\([^)]*(lwa|oauth|callback|connect|authorize|authorization|token|credential|connection-status|connection|state)/i,
    /@Post\s*\([^)]*(lwa|oauth|callback|connect|authorize|authorization|token|credential|connection-status|connection|state)/i,
  ];

  const amazonImplementationFragments = [
    "saveAmazonSpApiToken",
    "upsertAmazonSpApiConnection",
    "upsertAmazonSpApiCredential",
    "upsertAmazonSpApiAccessTokenCache",
    "writeAmazonSpApiConnectionAudit",
    "prisma.amazonSpApiConnection",
    "prisma.amazonSpApiCredential",
    "prisma.amazonSpApiAccessTokenCache",
    "prisma.amazonSpApiConnectionAudit",
  ];

  const dbWriteFragments = [
    ".create(",
    ".createMany(",
    ".update(",
    ".upsert(",
    ".delete(",
    ".deleteMany(",
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

    const hasAmazonImplementation = amazonImplementationFragments.some((fragment) => text.includes(fragment));
    const hasDbWrite = dbWriteFragments.some((fragment) => text.includes(fragment));

    const isSandboxOnly =
      text.includes("AmazonSpApiSandbox") ||
      text.includes("amazon-sp-api-sandbox") ||
      text.includes("AMAZON_ORDER_SP_API");

    if (hasAmazonImplementation && !isSandboxOnly) {
      serviceLeaks.push(rel);
    }

    if (hasAmazonImplementation && hasDbWrite && !isSandboxOnly) {
      dbWriteLeaks.push(rel);
    }
  }

  const actualSchema = read(prismaSchemaFile);
  const schemaLeaks = plannedModelFragments.filter((fragment) => actualSchema.includes(fragment));

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

  assert(schemaLeaks.length === 0, `schema.prisma was modified with Amazon SP-API models: ${JSON.stringify(schemaLeaks)}`);
  assert(migrationLeaks.length === 0, `Prisma migration file already contains Amazon SP-API models: ${JSON.stringify(migrationLeaks)}`);
  assert(routeLeaks.length === 0, `Amazon route leak detected during dry-run step: ${JSON.stringify(routeLeaks)}`);
  assert(serviceLeaks.length === 0, `Amazon persistence service leak detected during dry-run step: ${JSON.stringify(serviceLeaks)}`);
  assert(dbWriteLeaks.length === 0, `Amazon DB write leak detected during dry-run step: ${JSON.stringify(dbWriteLeaks)}`);

  return {
    scannedApiImplementationFiles: apiImplementationFiles.length,
    schemaLeaks,
    migrationLeaks,
    routeLeaks,
    serviceLeaks,
    dbWriteLeaks,
  };
}

function assertProposedSchemaDoesNotTouchExistingAccountingModels() {
  const combined = `${AMAZON_SP_API_PROPOSED_PRISMA_SCHEMA_BLOCK}\n${AMAZON_SP_API_PROPOSED_MIGRATION_SQL_PREVIEW}`;

  const forbidden = [
    'model Transaction',
    'model ImportJob',
    'model ImportStagingRow',
    'model InventoryBalance',
    'model InventoryMovement',
    'ALTER TABLE "Transaction"',
    'ALTER TABLE "ImportJob"',
    'ALTER TABLE "ImportStagingRow"',
    'ALTER TABLE "InventoryBalance"',
    'ALTER TABLE "InventoryMovement"',
    'DROP TABLE',
    'DROP COLUMN',
    'TRUNCATE',
    'DELETE FROM',
  ];

  for (const marker of forbidden) {
    assert(!combined.includes(marker), `Proposed schema/diff touches forbidden existing model or destructive SQL: ${marker}`);
  }
}

function assertProposedSchemaSecretSafety() {
  const schema = AMAZON_SP_API_PROPOSED_PRISMA_SCHEMA_BLOCK;

  const forbiddenPlaintext = [
    "refreshToken ",
    "accessToken ",
    "clientSecret",
    "authorizationCode",
    "spapiOAuthCode",
    "rawOAuthState",
  ];

  for (const marker of forbiddenPlaintext) {
    assert(!schema.includes(marker), `Proposed schema contains plaintext secret marker: ${marker}`);
  }

  assert(schema.includes("encryptedRefreshToken"), "Proposed schema missing encryptedRefreshToken");
  assert(schema.includes("encryptedAccessToken"), "Proposed schema missing encryptedAccessToken");
  assert(schema.includes("lastErrorMessageRedacted"), "Proposed schema missing redacted error field");
  assert(schema.includes("messageRedacted"), "Proposed schema missing redacted audit message field");
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-prisma-schema-dry-run-diff"] ===
      "node scripts/smoke-amazon-sp-api-prisma-schema-dry-run-diff-smoke.js",
    "Step123-O npm script missing or mismatched",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-actual-prisma-schema-migration-plan-contract"],
    "Step123-N regression smoke script missing",
  );

  const sourceDto = read(
    path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-prisma-schema-dry-run-diff-smoke.dto.ts"),
  );

  const requiredSourceMarkers = [
    "AMAZON_SP_API_PRISMA_SCHEMA_DRY_RUN_DIFF_SMOKE_VERSION",
    "AMAZON_SP_API_PROPOSED_PRISMA_SCHEMA_BLOCK",
    "AMAZON_SP_API_PROPOSED_MIGRATION_SQL_PREVIEW",
    "assertAmazonSpApiProposedPrismaSchemaDryRunDiff",
    "buildAmazonSpApiPrismaSchemaDryRunDiffSmokeContract",
    "assertAmazonSpApiPrismaSchemaDryRunDiffSmokeContract",
    "sourceStep123N",
    "validate-proposed-amazon-sp-api-prisma-schema-without-writing-schema",
    "model AmazonSpApiConnection",
    "model AmazonSpApiCredential",
    "model AmazonSpApiAccessTokenCache",
    "model AmazonSpApiConnectionAudit",
    "encryptedRefreshToken",
    "encryptedAccessToken",
    "companyId_storeId_marketplaceId_region",
    "sellingPartnerId_marketplaceId_region",
    "DROP TABLE",
    "ALTER TABLE \"Transaction\"",
    "readyForActualPrismaSchemaEditScript",
    "readyForActualPrismaSchemaMigration",
  ];

  for (const marker of requiredSourceMarkers) {
    assert(sourceDto.includes(marker), `Step123-O DTO missing marker: ${marker}`);
  }

  assertAmazonSpApiProposedPrismaSchemaDryRunDiff();
  assertProposedSchemaDoesNotTouchExistingAccountingModels();
  assertProposedSchemaSecretSafety();

  const contract = assertAmazonSpApiPrismaSchemaDryRunDiffSmokeContract(
    buildAmazonSpApiPrismaSchemaDryRunDiffSmokeContract(),
  );

  assert(contract.sourceStep123N.contractOnly === true, "Step123-O must depend on Step123-N contract-only boundary");
  assert(
    contract.sourceStep123N.summary.readyForPrismaSchemaDryRunDiffSmoke === true,
    "Step123-N must allow Step123-O dry-run diff smoke",
  );

  assert(contract.dryRunOnly === true, "Step123-O must remain dry-run only");
  assert(contract.proposedSchemaTextGeneratedNow === true, "Step123-O must generate proposed schema text only");
  assert(contract.proposedMigrationSqlPreviewGeneratedNow === true, "Step123-O must generate proposed migration SQL preview only");
  assert(contract.schemaPrismaEditedNow === false, "Step123-O must not edit schema.prisma");
  assert(contract.migrationFileAddedNow === false, "Step123-O must not add migration file");
  assert(contract.prismaGenerateNow === false, "Step123-O must not run prisma generate");
  assert(contract.prismaMigrateNow === false, "Step123-O must not run prisma migrate");
  assert(contract.databaseWriteNow === false, "Step123-O must not write DB");
  assert(contract.summary.readyForActualPrismaSchemaEditScript === true, "Step123-O should allow Step124-A schema edit script");
  assert(contract.summary.readyForActualPrismaSchemaMigration === false, "Step123-O must not allow direct migration execution");

  const implementationGuard = assertNoStep123OSchemaWriteOrMigration(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api Prisma schema dry-run diff smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step123-O",
        contract: {
          version: contract.version,
          dryRunOnly: contract.dryRunOnly,
          proposedSchemaTextGeneratedNow: contract.proposedSchemaTextGeneratedNow,
          proposedMigrationSqlPreviewGeneratedNow: contract.proposedMigrationSqlPreviewGeneratedNow,
          schemaPrismaEditedNow: contract.schemaPrismaEditedNow,
          migrationFileAddedNow: contract.migrationFileAddedNow,
          prismaGenerateNow: contract.prismaGenerateNow,
          prismaMigrateNow: contract.prismaMigrateNow,
          databaseWriteNow: contract.databaseWriteNow,
          tokenPersistenceWriteNow: contract.tokenPersistenceWriteNow,
          realSpApiRequestNow: contract.realSpApiRequestNow,
          dryRunBoundary: contract.dryRunBoundary,
          proposedModelValidation: contract.proposedModelValidation,
          secretSafetyValidation: contract.secretSafetyValidation,
          destructiveDiffValidation: contract.destructiveDiffValidation,
          forbiddenNow: contract.forbiddenNow,
          summary: contract.summary,
        },
        proposedSchemaPreview: {
          containsConnection: AMAZON_SP_API_PROPOSED_PRISMA_SCHEMA_BLOCK.includes("model AmazonSpApiConnection"),
          containsCredential: AMAZON_SP_API_PROPOSED_PRISMA_SCHEMA_BLOCK.includes("model AmazonSpApiCredential"),
          containsAccessTokenCache: AMAZON_SP_API_PROPOSED_PRISMA_SCHEMA_BLOCK.includes("model AmazonSpApiAccessTokenCache"),
          containsAudit: AMAZON_SP_API_PROPOSED_PRISMA_SCHEMA_BLOCK.includes("model AmazonSpApiConnectionAudit"),
          proposedSchemaLength: AMAZON_SP_API_PROPOSED_PRISMA_SCHEMA_BLOCK.length,
          proposedMigrationSqlPreviewLength: AMAZON_SP_API_PROPOSED_MIGRATION_SQL_PREVIEW.length,
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
