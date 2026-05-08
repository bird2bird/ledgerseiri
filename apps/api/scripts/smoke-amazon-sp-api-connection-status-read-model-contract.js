#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  assertAmazonSpApiConnectionStatusReadModelContract,
  buildAmazonSpApiConnectionStatusReadModelContract,
} = require("../dist/src/imports/dto/amazon-sp-api-connection-status-read-model-contract.dto");

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

function assertNoStep123GImplementationLeak(repoRoot) {
  const apiRoot = path.resolve(repoRoot, "apps/api");
  const apiSrcRoot = path.resolve(apiRoot, "src");

  const apiImplementationFiles = listFiles(apiSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p))
    .filter((file) => !isApiContractOrDto(file));

  const routeLeaks = [];
  const serviceLeaks = [];
  const dbReadLeaks = [];
  const tokenExposureLeaks = [];
  const realSpApiLeaks = [];
  const writeLeaks = [];

  const allowedExistingAmazonSandboxRouteFragments = [
    "internal/amazon-sp-api-sandbox/import-jobs/read-model",
  ];

  const routePatterns = [
    /@Get\s*\([^)]*(lwa|oauth|callback|connect|authorize|authorization|token|credential|connection-status|connection)/i,
    /@Post\s*\([^)]*(lwa|oauth|callback|connect|authorize|authorization|token|credential|connection-status|connection)/i,
  ];

  const amazonStatusContextFragments = [
    "AmazonSpApiConnection",
    "AmazonSpApiCredential",
    "AmazonSpApiToken",
    "AmazonSpApiAccessTokenCache",
    "AmazonSpApiConnectionStatus",
    "amazon-sp-api-real",
    "selling_partner_id",
    "sellingPartnerId",
  ];

  const serviceImplementationFragments = [
    "getAmazonSpApiConnectionStatus",
    "listAmazonSpApiConnectionStatus",
    "connectionStatusReadModel",
    "amazonSpApiConnectionStatus",
  ];

  const dbReadFragments = [
    "amazonSpApiConnection.find",
    "amazonSpApiCredential.find",
    "amazonSpApiAccessTokenCache.find",
    "amazonSpApiToken.find",
    "prisma.amazonSpApiConnection",
    "prisma.amazonSpApiCredential",
    "prisma.amazonSpApiAccessTokenCache",
  ];

  const tokenExposureFragments = [
    "refreshToken",
    "accessToken",
    "clientSecret",
    "authorizationCode",
    "rawOAuthState",
    "encryptedRefreshToken",
    "encryptedAccessToken",
    "refreshTokenCiphertext",
    "accessTokenCiphertext",
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

    const hasAmazonStatusContext = amazonStatusContextFragments.some((fragment) => text.includes(fragment));
    const hasServiceImplementation = serviceImplementationFragments.some((fragment) => text.includes(fragment));
    const hasDbRead = dbReadFragments.some((fragment) => text.includes(fragment));
    const hasTokenExposure = tokenExposureFragments.some((fragment) => text.includes(fragment));
    const hasRealSpApi = realSpApiFragments.some((fragment) => text.includes(fragment));

    const isSandboxOnly =
      text.includes("AmazonSpApiSandbox") ||
      text.includes("amazon-sp-api-sandbox") ||
      text.includes("AMAZON_ORDER_SP_API");

    if (hasAmazonStatusContext && hasServiceImplementation && !isSandboxOnly) {
      serviceLeaks.push(rel);
    }

    if (hasAmazonStatusContext && hasDbRead && !isSandboxOnly) {
      dbReadLeaks.push(rel);
    }

    if (hasAmazonStatusContext && hasTokenExposure && !isSandboxOnly) {
      tokenExposureLeaks.push(rel);
    }

    if (hasAmazonStatusContext && hasRealSpApi && !isSandboxOnly) {
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

  assert(routeLeaks.length === 0, `Amazon connection status route leak detected: ${JSON.stringify(routeLeaks)}`);
  assert(serviceLeaks.length === 0, `Amazon connection status service implementation leak detected: ${JSON.stringify(serviceLeaks)}`);
  assert(dbReadLeaks.length === 0, `Amazon connection status DB read leak detected: ${JSON.stringify(dbReadLeaks)}`);
  assert(tokenExposureLeaks.length === 0, `Amazon token exposure/read-model leak detected: ${JSON.stringify(tokenExposureLeaks)}`);
  assert(realSpApiLeaks.length === 0, `real SP-API implementation leak detected: ${JSON.stringify(realSpApiLeaks)}`);
  assert(writeLeaks.length === 0, `ImportJob/transaction/inventory write leak detected: ${JSON.stringify(writeLeaks)}`);
  assert(schemaLeaks.length === 0, `Amazon credential/token schema.prisma leak detected: ${JSON.stringify(schemaLeaks)}`);

  return {
    scannedApiImplementationFiles: apiImplementationFiles.length,
    routeLeaks,
    serviceLeaks,
    dbReadLeaks,
    tokenExposureLeaks,
    realSpApiLeaks,
    writeLeaks,
    schemaLeaks,
  };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-connection-status-read-model-contract"] ===
      "node scripts/smoke-amazon-sp-api-connection-status-read-model-contract.js",
    "Step123-G npm script missing or mismatched",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-token-persistence-schema-contract"],
    "Step123-F regression smoke script missing",
  );

  const sourceDto = read(
    path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-connection-status-read-model-contract.dto.ts"),
  );

  const requiredSourceMarkers = [
    "AMAZON_SP_API_CONNECTION_STATUS_READ_MODEL_CONTRACT_VERSION",
    "buildAmazonSpApiConnectionStatusReadModelContract",
    "assertAmazonSpApiConnectionStatusReadModelContract",
    "assertAmazonSpApiTokenPersistenceSchemaContract",
    "sourceStep123F",
    "design-amazon-sp-api-connection-status-read-model-contract-only",
    "responseShapeDesignOnly",
    "controllerRouteForbiddenNow",
    "serviceImplementationForbiddenNow",
    "databaseReadForbiddenNow",
    "frontendConsumptionForbiddenNow",
    "NOT_CONNECTED",
    "AUTHORIZATION_PENDING",
    "CONNECTED",
    "REVOKED",
    "EXPIRED",
    "ERROR",
    "unknownStatusRejectedInFuture",
    "companyIdRequired",
    "storeIdRequired",
    "marketplaceIdRequired",
    "regionRequired",
    "statusRequired",
    "isConnectedRequired",
    "canConnectRequired",
    "canReconnectRequired",
    "canDisconnectRequired",
    "sellingPartnerIdMaskedRequired",
    "appIdMaskedRequired",
    "lastTokenRefreshAtNullable",
    "lastHealthCheckAtNullable",
    "lastSyncAtNullable",
    "lastErrorCodeNullable",
    "lastErrorMessageRedactedNullable",
    "refreshTokenForbidden",
    "accessTokenForbidden",
    "clientSecretForbidden",
    "authorizationCodeForbidden",
    "rawOAuthStateForbidden",
    "maskedSellingPartnerIdOnly",
    "companyIdFilterRequired",
    "storeIdFilterRequired",
    "crossCompanyReadForbidden",
    "crossStoreReadForbidden",
    "tokenHealthStatusRequiredInFuture",
    "connectionHealthStatusRequiredInFuture",
    "japaneseStatusLabelRequiredInFrontendFuture",
    "notConnectedShowsConnectActionInFuture",
    "connectedShowsDisconnectAndReconnectActionsInFuture",
    "controllerRoute",
    "serviceMethodImplementation",
    "databaseRead",
    "frontendPanel",
    "frontendConnectionButton",
    "refreshTokenExposure",
    "accessTokenExposure",
    "clientSecretExposure",
    "rawOAuthStateExposure",
    "readyForConnectionStatusReadModelImplementation",
    "readyForFrontendConnectionStatusContract",
    "readyForAuthorizationUrlImplementationPreflight",
  ];

  for (const marker of requiredSourceMarkers) {
    assert(sourceDto.includes(marker), `Step123-G DTO missing marker: ${marker}`);
  }

  const contract = assertAmazonSpApiConnectionStatusReadModelContract(
    buildAmazonSpApiConnectionStatusReadModelContract(),
  );

  assert(contract.sourceStep123F.contractOnly === true, "Step123-G must depend on Step123-F contract-only boundary");
  assert(
    contract.sourceStep123F.summary.readyForConnectionStatusReadModelContract === true,
    "Step123-F must allow Step123-G connection status read-model contract",
  );

  assert(
    contract.summary.readyForConnectionStatusReadModelImplementation === false,
    "Step123-G must not allow connection status read-model implementation",
  );
  assert(
    contract.summary.readyForFrontendConnectionStatusContract === true,
    "Step123-G should allow Step123-H frontend connection status contract",
  );
  assert(
    contract.summary.readyForFrontendConnectionStatusImplementation === false,
    "Step123-G must not allow frontend implementation",
  );
  assert(
    contract.summary.readyForAuthorizationUrlImplementationPreflight === true,
    "Step123-G should allow later authorization URL implementation preflight",
  );
  assert(
    contract.summary.readyForRealSpApiReportRequest === false,
    "Step123-G must not allow real SP-API report request",
  );

  const implementationGuard = assertNoStep123GImplementationLeak(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api connection status read-model contract smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step123-G",
        contract: {
          version: contract.version,
          contractOnly: contract.contractOnly,
          implementationNow: contract.implementationNow,
          backendRouteAddedNow: contract.backendRouteAddedNow,
          frontendRouteAddedNow: contract.frontendRouteAddedNow,
          serviceMethodAddedNow: contract.serviceMethodAddedNow,
          databaseReadNow: contract.databaseReadNow,
          schemaChangedNow: contract.schemaChangedNow,
          migrationAddedNow: contract.migrationAddedNow,
          tokenPersistenceNow: contract.tokenPersistenceNow,
          realSpApiRequestNow: contract.realSpApiRequestNow,
          writesDatabase: contract.writesDatabase,
          readModelBoundary: contract.readModelBoundary,
          statusEnumContract: contract.statusEnumContract,
          responseShapeContract: contract.responseShapeContract,
          redactionContract: contract.redactionContract,
          isolationContract: contract.isolationContract,
          healthMetadataContract: contract.healthMetadataContract,
          uiReadinessContract: contract.uiReadinessContract,
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
