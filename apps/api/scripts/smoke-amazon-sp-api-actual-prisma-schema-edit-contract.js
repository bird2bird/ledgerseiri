#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiActualPrismaSchemaEditContract,
  buildAmazonSpApiActualPrismaSchemaEditContract,
} = require("../dist/src/imports/dto/amazon-sp-api-actual-prisma-schema-edit-contract.dto");

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

function extractModel(schema, modelName) {
  const start = schema.indexOf(`model ${modelName} {`);
  assert(start >= 0, `model not found: ${modelName}`);

  const braceStart = schema.indexOf("{", start);
  let depth = 0;

  for (let i = braceStart; i < schema.length; i += 1) {
    if (schema[i] === "{") depth += 1;
    if (schema[i] === "}") depth -= 1;
    if (depth === 0) {
      return schema.slice(start, i + 1);
    }
  }

  throw new Error(`model not closed: ${modelName}`);
}

function assertSchemaEditedSafely(repoRoot) {
  const apiRoot = path.resolve(repoRoot, "apps/api");
  const schemaFile = path.resolve(apiRoot, "prisma/schema.prisma");
  const migrationsDir = path.resolve(apiRoot, "prisma/migrations");
  const schema = read(schemaFile);

  const requiredMarkers = [
    "enum AmazonSpApiConnectionStatus",
    "AUTHORIZATION_PENDING",
    "CONNECTED",
    "REVOKED",
    "EXPIRED",
    "ERROR",
    "model AmazonSpApiConnection",
    "model AmazonSpApiCredential",
    "model AmazonSpApiAccessTokenCache",
    "model AmazonSpApiConnectionAudit",
    "amazonSpApiConnections      AmazonSpApiConnection[]",
    "amazonSpApiConnectionAudits AmazonSpApiConnectionAudit[]",
    "encryptedRefreshToken String",
    "encryptedAccessToken String",
    "lastErrorMessageRedacted String?",
    "messageRedacted String?",
    "@@unique([companyId, storeId, marketplaceId, region])",
    "@@unique([sellingPartnerId, marketplaceId, region])",
    "@@index([expiresAt])",
    "onDelete: Restrict",
  ];

  for (const marker of requiredMarkers) {
    assert(schema.includes(marker), `schema.prisma missing required marker: ${marker}`);
  }

  const company = extractModel(schema, "Company");
  const store = extractModel(schema, "Store");
  const amazonConnection = extractModel(schema, "AmazonSpApiConnection");
  const amazonCredential = extractModel(schema, "AmazonSpApiCredential");
  const amazonAccessCache = extractModel(schema, "AmazonSpApiAccessTokenCache");
  const amazonAudit = extractModel(schema, "AmazonSpApiConnectionAudit");

  assert(company.includes("amazonSpApiConnections      AmazonSpApiConnection[]"), "Company missing amazonSpApiConnections back relation");
  assert(company.includes("amazonSpApiConnectionAudits AmazonSpApiConnectionAudit[]"), "Company missing amazonSpApiConnectionAudits back relation");
  assert(store.includes("amazonSpApiConnections      AmazonSpApiConnection[]"), "Store missing amazonSpApiConnections back relation");
  assert(store.includes("amazonSpApiConnectionAudits AmazonSpApiConnectionAudit[]"), "Store missing amazonSpApiConnectionAudits back relation");

  const amazonBlock = [
    amazonConnection,
    amazonCredential,
    amazonAccessCache,
    amazonAudit,
  ].join("\n");

  const forbiddenPlaintext = [
    "refreshToken ",
    "accessToken ",
    "clientSecret",
    "authorizationCode",
    "spapiOAuthCode",
    "rawOAuthState",
  ];

  for (const marker of forbiddenPlaintext) {
    assert(!amazonBlock.includes(marker), `Amazon schema block contains forbidden plaintext marker: ${marker}`);
  }

  assert(!amazonBlock.includes("onDelete: Cascade"), "Amazon schema block must not use Cascade delete");

  const existingModelMarkers = [
    "model Transaction {",
    "model ImportJob {",
    "model ImportStagingRow {",
    "model InventoryBalance {",
    "model InventoryMovement {",
    "model ProductSku {",
  ];

  for (const marker of existingModelMarkers) {
    assert(schema.includes(marker), `existing model missing after schema edit: ${marker}`);
  }

  const migrationLeaks = [];
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

  assert(migrationLeaks.length === 0, `Step124-A must not create migration files: ${JSON.stringify(migrationLeaks)}`);

  return {
    enumPresent: schema.includes("enum AmazonSpApiConnectionStatus"),
    connectionModelPresent: schema.includes("model AmazonSpApiConnection"),
    credentialModelPresent: schema.includes("model AmazonSpApiCredential"),
    accessTokenCacheModelPresent: schema.includes("model AmazonSpApiAccessTokenCache"),
    auditModelPresent: schema.includes("model AmazonSpApiConnectionAudit"),
    companyBackRelationsPresent: company.includes("amazonSpApiConnections") && company.includes("amazonSpApiConnectionAudits"),
    storeBackRelationsPresent: store.includes("amazonSpApiConnections") && store.includes("amazonSpApiConnectionAudits"),
    migrationLeaks,
  };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-actual-prisma-schema-edit-contract"] ===
      "node scripts/smoke-amazon-sp-api-actual-prisma-schema-edit-contract.js",
    "Step124-A npm script missing or mismatched",
  );

  const contract = assertAmazonSpApiActualPrismaSchemaEditContract(
    buildAmazonSpApiActualPrismaSchemaEditContract(),
  );

  assert(contract.schemaPrismaEditedNow === true, "Step124-A must represent actual schema edit");
  assert(contract.migrationFileAddedNow === false, "Step124-A must not create migration file");
  assert(contract.prismaGenerateNow === false, "Step124-A must not run prisma generate");
  assert(contract.prismaMigrateNow === false, "Step124-A must not run prisma migrate");
  assert(contract.databaseWriteNow === false, "Step124-A must not write DB");
  assert(contract.summary.readyForPrismaGenerateStep === true, "Step124-A should allow Step124-B prisma generate step");

  const schemaGuard = assertSchemaEditedSafely(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api actual Prisma schema edit contract smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step124-A",
        contract: {
          version: contract.version,
          schemaPrismaEditedNow: contract.schemaPrismaEditedNow,
          enumAddedNow: contract.enumAddedNow,
          modelsAddedNow: contract.modelsAddedNow,
          companyBackRelationsAddedNow: contract.companyBackRelationsAddedNow,
          storeBackRelationsAddedNow: contract.storeBackRelationsAddedNow,
          migrationFileAddedNow: contract.migrationFileAddedNow,
          prismaGenerateNow: contract.prismaGenerateNow,
          prismaMigrateNow: contract.prismaMigrateNow,
          databaseWriteNow: contract.databaseWriteNow,
          backendRouteAddedNow: contract.backendRouteAddedNow,
          frontendAddedNow: contract.frontendAddedNow,
          tokenPersistenceWriteNow: contract.tokenPersistenceWriteNow,
          tokenExchangeHttpCallNow: contract.tokenExchangeHttpCallNow,
          realSpApiRequestNow: contract.realSpApiRequestNow,
          writesDatabase: contract.writesDatabase,
          addedEnum: contract.addedEnum,
          addedModels: contract.addedModels,
          schemaSafety: contract.schemaSafety,
          validationPlan: contract.validationPlan,
          forbiddenNow: contract.forbiddenNow,
          summary: contract.summary,
        },
        schemaGuard,
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
