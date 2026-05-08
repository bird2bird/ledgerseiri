#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiTokenPersistenceImplementationPreflightContract,
  buildAmazonSpApiTokenPersistenceImplementationPreflightContract,
  buildAmazonSpApiTokenPersistencePayloadImplementationPreflight,
} = require("../dist/src/imports/dto/amazon-sp-api-token-persistence-implementation-preflight.dto");

const {
  validateAmazonSpApiTokenExchangeSuccessResponseImplementationPreflight,
} = require("../dist/src/imports/dto/amazon-sp-api-token-exchange-implementation-preflight.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function assertThrows(fn, expectedFragment) {
  try {
    fn();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    assert(
      message.includes(expectedFragment),
      `Expected error containing "${expectedFragment}", got "${message}"`,
    );
    return;
  }

  throw new Error(`Expected function to throw: ${expectedFragment}`);
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

function assertNoStep123MImplementationLeak(repoRoot) {
  const apiRoot = path.resolve(repoRoot, "apps/api");
  const apiSrcRoot = path.resolve(apiRoot, "src");
  const webSrcRoot = path.resolve(repoRoot, "apps/web/src");

  const apiImplementationFiles = listFiles(apiSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p))
    .filter((file) => !isApiContractOrDto(file));
  const webImplementationFiles = listFiles(webSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));

  const routeLeaks = [];
  const dbWriteLeaks = [];
  const schemaLeaksInSource = [];
  const webApiClientLeaks = [];
  const tokenExposureLeaks = [];
  const realSpApiLeaks = [];
  const importWriteLeaks = [];

  const allowedExistingAmazonSandboxRouteFragments = [
    "internal/amazon-sp-api-sandbox/import-jobs/read-model",
  ];

  const allowedExistingWebFragments = [
    "AmazonSpApiSandboxReadModelPanelShell",
    "amazon-sp-api-sandbox",
    "Amazon SP-API サンドボックス",
    "fetchAmazonSpApiSandboxImportJobReadModel",
  ];

  const routePatterns = [
    /@Get\s*\([^)]*(lwa|oauth|callback|connect|authorize|authorization|token|credential|connection-status|connection|state)/i,
    /@Post\s*\([^)]*(lwa|oauth|callback|connect|authorize|authorization|token|credential|connection-status|connection|state)/i,
  ];

  const amazonSpecificContextFragments = [
    "AmazonSpApiConnection",
    "AmazonSpApiCredential",
    "AmazonSpApiToken",
    "AmazonSpApiAuthorization",
    "AmazonSpApiOAuthState",
    "AmazonSpApiAccessTokenCache",
    "amazon-sp-api-real",
    "amazon-sp-api-token-persistence",
    "buildAmazonSpApiTokenPersistence",
    "validateAmazonSpApiTokenPersistence",
    "encryptedRefreshToken",
    "encryptedAccessToken",
  ];

  const dbWriteFragments = [
    "amazonSpApiConnection.create",
    "amazonSpApiConnection.update",
    "amazonSpApiCredential.create",
    "amazonSpApiCredential.update",
    "amazonSpApiToken.create",
    "amazonSpApiToken.update",
    "amazonSpApiAccessTokenCache.create",
    "amazonSpApiAccessTokenCache.update",
    "prisma.amazonSpApiConnection",
    "prisma.amazonSpApiCredential",
    "prisma.amazonSpApiToken",
    "prisma.amazonSpApiAccessTokenCache",
  ];

  const schemaFragments = [
    "model AmazonSpApiCredential",
    "model AmazonSpApiToken",
    "model AmazonSpApiConnection",
    "model AmazonSpApiOAuthState",
    "model AmazonSpApiAccessTokenCache",
  ];

  const tokenExposureFragments = [
    "refresh_token",
    "access_token",
    "client_secret",
    "refreshToken",
    "accessToken",
    "clientSecret",
    "encryptedRefreshToken",
    "encryptedAccessToken",
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

  const importWriteFragments = [
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

    const hasAmazonContext = amazonSpecificContextFragments.some((fragment) => text.includes(fragment));
    const hasDbWrite = dbWriteFragments.some((fragment) => text.includes(fragment));
    const hasSchemaFragment = schemaFragments.some((fragment) => text.includes(fragment));
    const hasTokenExposure = tokenExposureFragments.some((fragment) => text.includes(fragment));
    const hasRealSpApi = realSpApiFragments.some((fragment) => text.includes(fragment));
    const hasImportWrite = importWriteFragments.some((fragment) => text.includes(fragment));

    const isSandboxOnly =
      text.includes("AmazonSpApiSandbox") ||
      text.includes("amazon-sp-api-sandbox") ||
      text.includes("AMAZON_ORDER_SP_API");

    if (hasAmazonContext && hasDbWrite && !isSandboxOnly) {
      dbWriteLeaks.push(rel);
    }

    if (hasAmazonContext && hasSchemaFragment && !isSandboxOnly) {
      schemaLeaksInSource.push(rel);
    }

    if (hasAmazonContext && hasTokenExposure && !isSandboxOnly) {
      tokenExposureLeaks.push(rel);
    }

    if (hasAmazonContext && hasRealSpApi && !isSandboxOnly) {
      realSpApiLeaks.push(rel);
    }

    if (hasAmazonContext && hasImportWrite && !isSandboxOnly) {
      importWriteLeaks.push(rel);
    }
  }

  for (const file of webImplementationFiles) {
    const text = read(file);
    const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");

    const isAllowedExistingWebFile = allowedExistingWebFragments.some((fragment) => text.includes(fragment));
    const hasAmazonContext = amazonSpecificContextFragments.some((fragment) => text.includes(fragment));
    const hasApiClient =
      text.includes("/api/imports/amazon-sp-api") ||
      text.includes("token-persistence") ||
      text.includes("encryptedRefreshToken") ||
      text.includes("encryptedAccessToken");

    if (hasAmazonContext && hasApiClient && !isAllowedExistingWebFile) {
      webApiClientLeaks.push(rel);
    }

    if (hasAmazonContext && tokenExposureFragments.some((fragment) => text.includes(fragment)) && !isAllowedExistingWebFile) {
      tokenExposureLeaks.push(rel);
    }
  }

  const schema = read(path.resolve(apiRoot, "prisma/schema.prisma"));
  const schemaLeaks = schemaFragments.filter((fragment) => schema.includes(fragment));

  assert(routeLeaks.length === 0, `Amazon token persistence route leak detected: ${JSON.stringify(routeLeaks)}`);
  assert(dbWriteLeaks.length === 0, `Amazon token persistence DB write leak detected: ${JSON.stringify(dbWriteLeaks)}`);
  assert(schemaLeaksInSource.length === 0, `Amazon token schema source leak detected: ${JSON.stringify(schemaLeaksInSource)}`);
  assert(webApiClientLeaks.length === 0, `Amazon token persistence frontend API client leak detected: ${JSON.stringify(webApiClientLeaks)}`);
  assert(tokenExposureLeaks.length === 0, `Amazon token exposure leak detected: ${JSON.stringify(tokenExposureLeaks)}`);
  assert(realSpApiLeaks.length === 0, `real SP-API implementation leak detected: ${JSON.stringify(realSpApiLeaks)}`);
  assert(importWriteLeaks.length === 0, `ImportJob/transaction/inventory write leak detected: ${JSON.stringify(importWriteLeaks)}`);
  assert(schemaLeaks.length === 0, `Amazon credential/token/oauth schema.prisma leak detected: ${JSON.stringify(schemaLeaks)}`);

  return {
    scannedApiImplementationFiles: apiImplementationFiles.length,
    scannedWebImplementationFiles: webImplementationFiles.length,
    routeLeaks,
    dbWriteLeaks,
    schemaLeaksInSource,
    webApiClientLeaks,
    tokenExposureLeaks,
    realSpApiLeaks,
    importWriteLeaks,
    schemaLeaks,
  };
}

function tokenExchangeFixture() {
  return validateAmazonSpApiTokenExchangeSuccessResponseImplementationPreflight({
    access_token: "Atza|access-token-step123-m",
    refresh_token: "Atzr|refresh-token-step123-m",
    token_type: "bearer",
    expires_in: 3600,
    scope: "sellingpartnerapi::notifications",
  });
}

function payloadInputFixture(overrides = {}) {
  const base = {
    connectionIdentity: {
      companyId: "company-step123-m",
      storeId: "store-step123-m",
      marketplaceId: "A1VC38T7YXB528",
      region: "FE",
      sellingPartnerId: "A1SELLERSTEP123M",
      appId: "amzn1.sp.solution.step123m",
    },
    tokenMetadata: {
      tokenExchange: tokenExchangeFixture(),
      encryptedRefreshToken: "enc:v1:refresh-token-ciphertext-step123-m",
      encryptedAccessToken: "enc:v1:access-token-ciphertext-step123-m",
      encryptionKeyId: "kms-key-step123-m",
      encryptionAlgorithm: "AES-256-GCM",
      tokenVersion: 1,
      issuedAt: "2026-05-08T00:00:00.000Z",
      accessTokenExpiresAt: "2026-05-08T01:00:00.000Z",
      connectedAt: "2026-05-08T00:00:00.000Z",
    },
  };

  return {
    connectionIdentity: {
      ...base.connectionIdentity,
      ...(overrides.connectionIdentity || {}),
    },
    tokenMetadata: {
      ...base.tokenMetadata,
      ...(overrides.tokenMetadata || {}),
    },
  };
}

function assertTokenPersistencePreflightBehavior() {
  const payload = buildAmazonSpApiTokenPersistencePayloadImplementationPreflight(payloadInputFixture());

  assert(payload.connection.companyId === "company-step123-m", "companyId mismatch");
  assert(payload.connection.storeId === "store-step123-m", "storeId mismatch");
  assert(payload.connection.marketplaceId === "A1VC38T7YXB528", "marketplace mismatch");
  assert(payload.connection.region === "FE", "region mismatch");
  assert(payload.connection.status === "CONNECTED", "connection status mismatch");
  assert(payload.credential.encryptedRefreshToken === "enc:v1:refresh-token-ciphertext-step123-m", "encrypted refresh token mismatch");
  assert(payload.accessTokenCache.encryptedAccessToken === "enc:v1:access-token-ciphertext-step123-m", "encrypted access token mismatch");
  assert(payload.accessTokenCache.cacheMayBeDeletedWithoutLosingConnection === true, "cache policy mismatch");
  assert(payload.auditPreview.redacted === true, "audit preview must be redacted");
  assert(payload.redactedPreview.credential.encryptedRefreshToken === "[REDACTED_ENCRYPTED_REFRESH_TOKEN]", "encrypted refresh token must be redacted");
  assert(payload.redactedPreview.accessTokenCache.encryptedAccessToken === "[REDACTED_ENCRYPTED_ACCESS_TOKEN]", "encrypted access token must be redacted");
  assert(!JSON.stringify(payload.redactedPreview).includes("ciphertext-step123-m"), "redacted preview leaked ciphertext");
  assert(payload.implementationPreflightOnly === true, "payload must be preflight only");
  assert(payload.databaseWriteNow === false, "Step123-M must not write DB");
  assert(payload.prismaSchemaChangeNow === false, "Step123-M must not change schema");
  assert(payload.tokenExchangeHttpCallNow === false, "Step123-M must not call token exchange HTTP");

  assertThrows(
    () =>
      buildAmazonSpApiTokenPersistencePayloadImplementationPreflight(
        payloadInputFixture({
          connectionIdentity: {
            companyId: " ",
          },
        }),
      ),
    "companyId is required",
  );

  assertThrows(
    () =>
      buildAmazonSpApiTokenPersistencePayloadImplementationPreflight(
        payloadInputFixture({
          connectionIdentity: {
            marketplaceId: "A1VC38T7YXB528",
            region: "NA",
          },
        }),
      ),
    "Amazon.co.jp marketplace must use FE region",
  );

  assertThrows(
    () =>
      buildAmazonSpApiTokenPersistencePayloadImplementationPreflight(
        payloadInputFixture({
          tokenMetadata: {
            encryptedRefreshToken: " ",
          },
        }),
      ),
    "encryptedRefreshToken is required",
  );

  assertThrows(
    () =>
      buildAmazonSpApiTokenPersistencePayloadImplementationPreflight(
        payloadInputFixture({
          tokenMetadata: {
            encryptedAccessToken: " ",
          },
        }),
      ),
    "encryptedAccessToken is required",
  );

  assertThrows(
    () =>
      buildAmazonSpApiTokenPersistencePayloadImplementationPreflight(
        payloadInputFixture({
          tokenMetadata: {
            tokenVersion: 0,
          },
        }),
      ),
    "tokenVersion must be a positive integer",
  );

  assertThrows(
    () =>
      buildAmazonSpApiTokenPersistencePayloadImplementationPreflight(
        payloadInputFixture({
          tokenMetadata: {
            accessTokenExpiresAt: "2026-05-07T23:59:00.000Z",
          },
        }),
      ),
    "accessTokenExpiresAt must be after issuedAt",
  );

  assertThrows(
    () =>
      buildAmazonSpApiTokenPersistencePayloadImplementationPreflight(
        payloadInputFixture({
          tokenMetadata: {
            tokenExchange: {
              ...tokenExchangeFixture(),
              tokenPersistenceNow: true,
            },
          },
        }),
      ),
    "token exchange input must remain preflight-only",
  );

  return payload;
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");

  assert(typeof buildAmazonSpApiTokenPersistencePayloadImplementationPreflight === "function", "payload builder export missing");
  assert(typeof buildAmazonSpApiTokenPersistenceImplementationPreflightContract === "function", "contract builder export missing");
  assert(typeof assertAmazonSpApiTokenPersistenceImplementationPreflightContract === "function", "contract assert export missing");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-token-persistence-implementation-preflight"] ===
      "node scripts/smoke-amazon-sp-api-token-persistence-implementation-preflight.js",
    "Step123-M npm script missing or mismatched",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-token-exchange-implementation-preflight"],
    "Step123-L regression smoke script missing",
  );

  const sourceDto = read(
    path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-token-persistence-implementation-preflight.dto.ts"),
  );

  const requiredSourceMarkers = [
    "AMAZON_SP_API_TOKEN_PERSISTENCE_IMPLEMENTATION_PREFLIGHT_VERSION",
    "buildAmazonSpApiTokenPersistencePayloadImplementationPreflight",
    "buildAmazonSpApiTokenPersistenceImplementationPreflightContract",
    "assertAmazonSpApiTokenPersistenceImplementationPreflightContract",
    "sourceStep123L",
    "pure-function-token-persistence-payload-preflight-only",
    "persistencePayloadBuilderRequired",
    "connectionIdentityValidationRequired",
    "encryptedRefreshTokenRequired",
    "encryptedAccessTokenCacheRequired",
    "redactedPreviewRequired",
    "auditPreviewRequired",
    "japanMarketplaceRequiresFeRegion",
    "plaintextRefreshTokenForbiddenInPreview",
    "plaintextAccessTokenForbiddenInPreview",
    "encryptedRefreshTokenRedactedInPreview",
    "encryptedAccessTokenRedactedInPreview",
    "tokenPersistenceDatabaseWrite",
    "readyForActualPrismaSchemaMigrationPlan",
    "readyForTokenPersistenceDatabaseImplementation",
  ];

  for (const marker of requiredSourceMarkers) {
    assert(sourceDto.includes(marker), `Step123-M DTO missing marker: ${marker}`);
  }

  const contract = assertAmazonSpApiTokenPersistenceImplementationPreflightContract(
    buildAmazonSpApiTokenPersistenceImplementationPreflightContract(),
  );

  assert(contract.sourceStep123L.implementationPreflightOnly === true, "Step123-M must depend on Step123-L preflight boundary");
  assert(
    contract.sourceStep123L.summary.readyForTokenPersistenceImplementationPreflight === true,
    "Step123-L must allow Step123-M token persistence preflight",
  );
  assert(contract.implementationPreflightOnly === true, "Step123-M must be implementation preflight only");
  assert(contract.pureFunctionAddedNow === true, "Step123-M must add only pure function");
  assert(contract.backendRouteAddedNow === false, "Step123-M must not add backend route");
  assert(contract.tokenPersistenceWriteNow === false, "Step123-M must not write token persistence");
  assert(contract.databaseWriteNow === false, "Step123-M must not write DB");
  assert(contract.prismaSchemaChangedNow === false, "Step123-M must not change Prisma schema");
  assert(contract.tokenExchangeHttpCallNow === false, "Step123-M must not call token exchange HTTP");
  assert(contract.realSpApiRequestNow === false, "Step123-M must not call real SP-API");
  assert(contract.writesDatabase === false, "Step123-M must not write database");

  const payload = assertTokenPersistencePreflightBehavior();
  const implementationGuard = assertNoStep123MImplementationLeak(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api token persistence implementation preflight smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step123-M",
        contract: {
          version: contract.version,
          implementationPreflightOnly: contract.implementationPreflightOnly,
          pureFunctionAddedNow: contract.pureFunctionAddedNow,
          backendRouteAddedNow: contract.backendRouteAddedNow,
          frontendComponentAddedNow: contract.frontendComponentAddedNow,
          frontendApiClientAddedNow: contract.frontendApiClientAddedNow,
          buttonHandlerAddedNow: contract.buttonHandlerAddedNow,
          browserRedirectAddedNow: contract.browserRedirectAddedNow,
          callbackRouteAddedNow: contract.callbackRouteAddedNow,
          tokenExchangeHttpCallNow: contract.tokenExchangeHttpCallNow,
          tokenPersistenceWriteNow: contract.tokenPersistenceWriteNow,
          databaseWriteNow: contract.databaseWriteNow,
          prismaSchemaChangedNow: contract.prismaSchemaChangedNow,
          migrationAddedNow: contract.migrationAddedNow,
          realSpApiRequestNow: contract.realSpApiRequestNow,
          writesDatabase: contract.writesDatabase,
          preflightBoundary: contract.preflightBoundary,
          connectionIdentityContract: contract.connectionIdentityContract,
          tokenMetadataContract: contract.tokenMetadataContract,
          redactionContract: contract.redactionContract,
          forbiddenNow: contract.forbiddenNow,
          summary: contract.summary,
        },
        persistencePreview: {
          connection: payload.redactedPreview.connection,
          credential: payload.redactedPreview.credential,
          accessTokenCache: payload.redactedPreview.accessTokenCache,
          auditPreview: payload.auditPreview,
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
