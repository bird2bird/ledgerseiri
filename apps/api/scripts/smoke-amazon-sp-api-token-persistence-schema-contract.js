#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  assertAmazonSpApiTokenPersistenceSchemaContract,
  buildAmazonSpApiTokenPersistenceSchemaContract,
} = require("../dist/src/imports/dto/amazon-sp-api-token-persistence-schema-contract.dto");

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
  return file.includes(`${path.sep}src${path.sep}imports${path.sep}dto${path.sep}`) || file.endsWith(".dto.ts");
}

function assertNoStep123FImplementationLeak(repoRoot) {
  const apiRoot = path.resolve(repoRoot, "apps/api");
  const apiSrcRoot = path.resolve(apiRoot, "src");

  const apiImplementationFiles = listFiles(apiSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p))
    .filter((file) => !isApiContractOrDto(file));

  const routeLeaks = [];
  const schemaImplementationLeaks = [];
  const persistenceLeaks = [];
  const tokenExchangeLeaks = [];
  const realSpApiLeaks = [];
  const writeLeaks = [];

  const allowedExistingAmazonSandboxRouteFragments = [
    "internal/amazon-sp-api-sandbox/import-jobs/read-model",
  ];

  const routePatterns = [
    /@Get\s*\([^)]*(lwa|oauth|callback|connect|authorize|authorization|token|credential)/i,
    /@Post\s*\([^)]*(lwa|oauth|callback|connect|authorize|authorization|token|credential)/i,
  ];

  const amazonLwaContextFragments = [
    "AmazonSpApiCredential",
    "AmazonSpApiToken",
    "AmazonSpApiConnection",
    "AmazonSpApiOAuthState",
    "AmazonSpApiAccessTokenCache",
    "AmazonSpApiTokenPersistence",
    "amazon-sp-api-real",
    "sellingpartnerapi",
    "selling-partner-api",
    "LoginWithAmazon",
    "loginWithAmazon",
    "api.amazon.com/auth/o2/token",
    "spapi_oauth_code",
    "selling_partner_id",
  ];

  const schemaImplementationFragments = [
    "model AmazonSpApiCredential",
    "model AmazonSpApiToken",
    "model AmazonSpApiConnection",
    "model AmazonSpApiOAuthState",
    "model AmazonSpApiAccessTokenCache",
  ];

  const persistenceFragments = [
    "amazonSpApiCredential.create",
    "amazonSpApiCredential.update",
    "amazonSpApiToken.create",
    "amazonSpApiToken.update",
    "amazonSpApiConnection.create",
    "amazonSpApiConnection.update",
    "amazonSpApiAccessTokenCache.create",
    "amazonSpApiAccessTokenCache.update",
    "encryptedRefreshToken",
    "encryptedAccessToken",
    "refreshTokenCiphertext",
    "accessTokenCiphertext",
  ];

  const tokenExchangeFragments = [
    "fetch(",
    "axios.",
    "httpService.",
    "api.amazon.com/auth/o2/token",
    "application/x-www-form-urlencoded",
    "grant_type",
    "authorization_code",
    "client_secret",
    "client_id",
    "refresh_token",
    "access_token",
  ];

  const realSpApiFragments = [
    "sellingpartnerapi",
    "selling-partner-api",
    "getOrders(",
    "getOrder(",
    "getOrderItems(",
    "createReport(",
    "getReport(",
    "getReportDocument(",
    "reports/2021-06-30",
  ];

  const writeFragments = [
    "importJob.create",
    "transaction.create",
    "transaction.createMany",
    "inventoryMovement.create",
    "inventoryMovement.createMany",
    "inventoryBalance.create",
    "inventoryBalance.update",
    "commitSales: true",
    "executeInventory: true",
  ];

  const amazonRealWriteContextFragments = [
    "AmazonSpApiReal",
    "amazon-sp-api-real",
    "sourceType: 'amazon-sp-api'",
    'sourceType: "amazon-sp-api"',
    "realSourceType: 'amazon-sp-api'",
    'realSourceType: "amazon-sp-api"',
    "lwa-oauth",
    "LoginWithAmazon",
    "loginWithAmazon",
    "sellingpartnerapi",
    "selling-partner-api",
    "sp-api-report-readonly",
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

    const hasAmazonLwaContext = amazonLwaContextFragments.some((fragment) => text.includes(fragment));
    const hasSchemaImplementation = schemaImplementationFragments.some((fragment) => text.includes(fragment));
    const hasPersistence = persistenceFragments.some((fragment) => text.includes(fragment));
    const hasTokenExchange = tokenExchangeFragments.some((fragment) => text.includes(fragment));
    const hasRealSpApi = realSpApiFragments.some((fragment) => text.includes(fragment));

    const isSandboxOnly =
      text.includes("AmazonSpApiSandbox") ||
      text.includes("amazon-sp-api-sandbox") ||
      text.includes("AMAZON_ORDER_SP_API");

    if (hasAmazonLwaContext && hasSchemaImplementation && !isSandboxOnly) {
      schemaImplementationLeaks.push(rel);
    }

    if (hasAmazonLwaContext && hasPersistence && !isSandboxOnly) {
      persistenceLeaks.push(rel);
    }

    if (hasAmazonLwaContext && hasTokenExchange && !isSandboxOnly) {
      tokenExchangeLeaks.push(rel);
    }

    if (hasAmazonLwaContext && hasRealSpApi && !isSandboxOnly) {
      realSpApiLeaks.push(rel);
    }

    const hasAmazonRealWriteContext = amazonRealWriteContextFragments.some((fragment) => text.includes(fragment));
    const hasDomainWrite = writeFragments.some((fragment) => text.includes(fragment));

    if (hasAmazonRealWriteContext && hasDomainWrite && !isSandboxOnly) {
      writeLeaks.push(rel);
    }
  }

  const schema = read(path.resolve(apiRoot, "prisma/schema.prisma"));
  const forbiddenSchemaModels = [
    "model AmazonSpApiCredential",
    "model AmazonSpApiToken",
    "model AmazonSpApiConnection",
    "model AmazonSpApiOAuthState",
    "model AmazonSpApiAccessTokenCache",
    "model AmazonOAuthState",
    "model AmazonCredential",
    "model AmazonToken",
  ];

  const schemaLeaks = forbiddenSchemaModels.filter((fragment) => schema.includes(fragment));

  const migrationsDir = path.resolve(apiRoot, "prisma/migrations");
  const migrationLeaks = [];
  if (fs.existsSync(migrationsDir)) {
    for (const file of listFiles(migrationsDir, (p) => p.endsWith(".sql"))) {
      const text = read(file);
      const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");
      if (forbiddenSchemaModels.some((fragment) => text.includes(fragment.replace("model ", "")))) {
        migrationLeaks.push(rel);
      }
    }
  }

  assert(routeLeaks.length === 0, `OAuth/LWA/token/credential route leak detected: ${JSON.stringify(routeLeaks)}`);
  assert(schemaImplementationLeaks.length === 0, `Amazon token schema implementation leak detected: ${JSON.stringify(schemaImplementationLeaks)}`);
  assert(persistenceLeaks.length === 0, `Amazon token persistence implementation leak detected: ${JSON.stringify(persistenceLeaks)}`);
  assert(tokenExchangeLeaks.length === 0, `token exchange implementation leak detected: ${JSON.stringify(tokenExchangeLeaks)}`);
  assert(realSpApiLeaks.length === 0, `real SP-API implementation leak detected: ${JSON.stringify(realSpApiLeaks)}`);
  assert(writeLeaks.length === 0, `ImportJob/transaction/inventory write leak detected: ${JSON.stringify(writeLeaks)}`);
  assert(schemaLeaks.length === 0, `Amazon credential/token schema.prisma leak detected: ${JSON.stringify(schemaLeaks)}`);
  assert(migrationLeaks.length === 0, `Amazon credential/token migration leak detected: ${JSON.stringify(migrationLeaks)}`);

  return {
    scannedApiImplementationFiles: apiImplementationFiles.length,
    routeLeaks,
    schemaImplementationLeaks,
    persistenceLeaks,
    tokenExchangeLeaks,
    realSpApiLeaks,
    writeLeaks,
    schemaLeaks,
    migrationLeaks,
  };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-token-persistence-schema-contract"] ===
      "node scripts/smoke-amazon-sp-api-token-persistence-schema-contract.js",
    "Step123-F npm script missing or mismatched",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-token-exchange-preflight-contract"],
    "Step123-E regression smoke script missing",
  );

  const sourceDto = read(
    path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-token-persistence-schema-contract.dto.ts"),
  );

  const requiredSourceMarkers = [
    "AMAZON_SP_API_TOKEN_PERSISTENCE_SCHEMA_CONTRACT_VERSION",
    "buildAmazonSpApiTokenPersistenceSchemaContract",
    "assertAmazonSpApiTokenPersistenceSchemaContract",
    "assertAmazonSpApiTokenExchangePreflightContract",
    "sourceStep123E",
    "design-amazon-sp-api-token-persistence-schema-contract-only",
    "prismaSchemaChangeForbiddenNow",
    "migrationForbiddenNow",
    "databaseWriteForbiddenNow",
    "tokenPersistenceForbiddenNow",
    "encryptionDesignOnlyNow",
    "AmazonSpApiConnection",
    "AmazonSpApiCredential",
    "AmazonSpApiAccessTokenCache",
    "companyIdRequired",
    "storeIdRequired",
    "marketplaceIdRequired",
    "regionRequired",
    "sellingPartnerIdRequired",
    "encryptedRefreshTokenRequired",
    "refreshTokenCiphertextOnly",
    "refreshTokenPlaintextForbidden",
    "encryptedAccessTokenRequired",
    "accessTokenPlaintextForbidden",
    "uniqueCompanyStoreMarketplaceRegionRequired",
    "uniqueSellingPartnerMarketplaceRegionRequired",
    "connectAuditRequired",
    "tokenExchangeAuditRequired",
    "tokenRefreshAuditRequired",
    "revokeAuditRequired",
    "disconnectAuditRequired",
    "encryptedAtRestRequired",
    "applicationLevelEncryptionRequired",
    "databaseOnlyEncryptionInsufficient",
    "keyRotationRequired",
    "migrationRequiresSeparateStep",
    "noDestructiveMigration",
    "zeroTokenDataLossRequired",
    "connectionStatusReadModelRequiresSeparateStep",
    "noTokenValueInReadModel",
    "onlyRedactedConnectionMetadataExposed",
    "prismaSchemaChange",
    "migrationFile",
    "tokenPersistenceWrite",
    "credentialPersistenceWrite",
    "accessTokenCacheWrite",
    "readyForActualPrismaSchemaMigration",
    "readyForTokenPersistenceImplementation",
    "readyForConnectionStatusReadModelContract",
  ];

  for (const marker of requiredSourceMarkers) {
    assert(sourceDto.includes(marker), `Step123-F DTO missing marker: ${marker}`);
  }

  const contract = assertAmazonSpApiTokenPersistenceSchemaContract(
    buildAmazonSpApiTokenPersistenceSchemaContract(),
  );

  assert(contract.sourceStep123E.contractOnly === true, "Step123-F must depend on Step123-E contract-only boundary");
  assert(
    contract.sourceStep123E.summary.readyForTokenPersistenceSchemaContract === true,
    "Step123-E must allow Step123-F token persistence schema contract",
  );

  assert(
    contract.summary.readyForActualPrismaSchemaMigration === false,
    "Step123-F must not allow actual Prisma schema migration",
  );
  assert(
    contract.summary.readyForTokenPersistenceImplementation === false,
    "Step123-F must not allow token persistence implementation",
  );
  assert(
    contract.summary.readyForConnectionStatusReadModelContract === true,
    "Step123-F should allow Step123-G connection status read-model contract",
  );
  assert(
    contract.summary.readyForRealSpApiReportRequest === false,
    "Step123-F must not allow real SP-API report request",
  );

  const implementationGuard = assertNoStep123FImplementationLeak(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api token persistence schema contract smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step123-F",
        contract: {
          version: contract.version,
          contractOnly: contract.contractOnly,
          implementationNow: contract.implementationNow,
          backendRouteAddedNow: contract.backendRouteAddedNow,
          frontendRouteAddedNow: contract.frontendRouteAddedNow,
          schemaChangedNow: contract.schemaChangedNow,
          migrationAddedNow: contract.migrationAddedNow,
          tokenPersistenceNow: contract.tokenPersistenceNow,
          realSpApiRequestNow: contract.realSpApiRequestNow,
          writesDatabase: contract.writesDatabase,
          schemaBoundary: contract.schemaBoundary,
          connectionModelContract: contract.connectionModelContract,
          credentialModelContract: contract.credentialModelContract,
          accessTokenCacheContract: contract.accessTokenCacheContract,
          uniquenessAndIsolationPolicy: contract.uniquenessAndIsolationPolicy,
          auditAndLifecyclePolicy: contract.auditAndLifecyclePolicy,
          securityPolicy: contract.securityPolicy,
          migrationPolicy: contract.migrationPolicy,
          futureReadModelPolicy: contract.futureReadModelPolicy,
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
