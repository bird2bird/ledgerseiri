#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  assertAmazonSpApiTokenExchangePreflightContract,
  buildAmazonSpApiTokenExchangePreflightContract,
} = require("../dist/src/imports/dto/amazon-sp-api-token-exchange-preflight-contract.dto");

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

function assertNoStep123EImplementationLeak(repoRoot) {
  const apiRoot = path.resolve(repoRoot, "apps/api");
  const apiSrcRoot = path.resolve(apiRoot, "src");

  const apiImplementationFiles = listFiles(apiSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p))
    .filter((file) => !isApiContractOrDto(file));

  const routeLeaks = [];
  const tokenExchangeImplementationLeaks = [];
  const persistenceLeaks = [];
  const realSpApiLeaks = [];
  const writeLeaks = [];

  const allowedExistingAmazonSandboxRouteFragments = [
    "internal/amazon-sp-api-sandbox/import-jobs/read-model",
  ];

  const routePatterns = [
    /@Get\s*\([^)]*(lwa|oauth|callback|connect|authorize|authorization|token)/i,
    /@Post\s*\([^)]*(lwa|oauth|callback|connect|authorize|authorization|token)/i,
  ];

  const amazonLwaContextFragments = [
    "AmazonSpApiCredential",
    "AmazonSpApiToken",
    "AmazonSpApiConnection",
    "AmazonSpApiOAuthState",
    "AmazonSpApiLwaAuthorization",
    "AmazonSpApiOAuthCallback",
    "AmazonSpApiTokenExchange",
    "amazon-sp-api-real",
    "sellingpartnerapi",
    "selling-partner-api",
    "LoginWithAmazon",
    "loginWithAmazon",
    "lwa.amazon.com",
    "api.amazon.com/auth/o2/token",
    "spapi_oauth_code",
    "selling_partner_id",
  ];

  const tokenExchangeImplementationFragments = [
    "fetch(",
    "axios.",
    "httpService.",
    "request(",
    "api.amazon.com/auth/o2/token",
    "lwa.amazon.com/auth/o2/token",
    "application/x-www-form-urlencoded",
    "grant_type",
    "authorization_code",
    "client_secret",
    "client_id",
    "refresh_token",
    "access_token",
  ];

  const persistenceFragments = [
    "AmazonSpApiOAuthState",
    "AmazonSpApiCredential",
    "AmazonSpApiToken",
    "oauthState.create",
    "oauthState.update",
    "credential.create",
    "credential.update",
    "token.create",
    "token.update",
    "refreshToken",
    "accessToken",
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
    const hasTokenExchangeImplementation = tokenExchangeImplementationFragments.some((fragment) => text.includes(fragment));
    const hasPersistence = persistenceFragments.some((fragment) => text.includes(fragment));
    const hasRealSpApi = realSpApiFragments.some((fragment) => text.includes(fragment));

    const isSandboxOnly =
      text.includes("AmazonSpApiSandbox") ||
      text.includes("amazon-sp-api-sandbox") ||
      text.includes("AMAZON_ORDER_SP_API");

    if (hasAmazonLwaContext && hasTokenExchangeImplementation && !isSandboxOnly) {
      tokenExchangeImplementationLeaks.push(rel);
    }

    if (hasAmazonLwaContext && hasPersistence && !isSandboxOnly) {
      persistenceLeaks.push(rel);
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
    "model AmazonOAuthState",
    "model AmazonCredential",
    "model AmazonToken",
  ];

  const schemaLeaks = forbiddenSchemaModels.filter((fragment) => schema.includes(fragment));

  assert(routeLeaks.length === 0, `OAuth/LWA/token route leak detected: ${JSON.stringify(routeLeaks)}`);
  assert(tokenExchangeImplementationLeaks.length === 0, `token exchange implementation leak detected: ${JSON.stringify(tokenExchangeImplementationLeaks)}`);
  assert(persistenceLeaks.length === 0, `OAuth/token persistence leak detected: ${JSON.stringify(persistenceLeaks)}`);
  assert(realSpApiLeaks.length === 0, `real SP-API implementation leak detected: ${JSON.stringify(realSpApiLeaks)}`);
  assert(writeLeaks.length === 0, `ImportJob/transaction/inventory write leak detected: ${JSON.stringify(writeLeaks)}`);
  assert(schemaLeaks.length === 0, `Amazon OAuth/credential/token schema leak detected: ${JSON.stringify(schemaLeaks)}`);

  return {
    scannedApiImplementationFiles: apiImplementationFiles.length,
    routeLeaks,
    tokenExchangeImplementationLeaks,
    persistenceLeaks,
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
    packageJson.scripts["smoke:amazon-sp-api-token-exchange-preflight-contract"] ===
      "node scripts/smoke-amazon-sp-api-token-exchange-preflight-contract.js",
    "Step123-E npm script missing or mismatched",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-oauth-callback-preflight-contract"],
    "Step123-D regression smoke script missing",
  );

  const sourceDto = read(
    path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-token-exchange-preflight-contract.dto.ts"),
  );

  const requiredSourceMarkers = [
    "AMAZON_SP_API_TOKEN_EXCHANGE_PREFLIGHT_CONTRACT_VERSION",
    "buildAmazonSpApiTokenExchangePreflightContract",
    "assertAmazonSpApiTokenExchangePreflightContract",
    "assertAmazonSpApiOAuthCallbackPreflightContract",
    "sourceStep123D",
    "validate-token-exchange-request-response-contract-only",
    "requestShapeDesignOnly",
    "responseShapeDesignOnly",
    "httpCallForbiddenNow",
    "tokenPersistenceForbiddenNow",
    "credentialSchemaForbiddenNow",
    "tokenSchemaForbiddenNow",
    "https://api.amazon.com/auth/o2/token",
    "application/x-www-form-urlencoded",
    "authorization_code",
    "authorizationCodeMustComeFromStep123DSpapiOAuthCode",
    "authorizationCodeSingleUseRequired",
    "redirectUriMustMatchAuthorizationUrlBuilder",
    "clientIdRequired",
    "clientSecretRequired",
    "clientSecretMustComeFromSecureServerConfigInFuture",
    "browserSideExchangeForbidden",
    "accessTokenExpected",
    "refreshTokenExpected",
    "tokenTypeExpected",
    "expiresInExpected",
    "rawResponseLoggingForbidden",
    "responseValidationRequiredBeforePersistence",
    "clientSecretMustNeverBeExposedToFrontend",
    "clientSecretMustNeverBeLogged",
    "authorizationCodeMustBeRedactedInLogs",
    "accessTokenMustBeRedactedInLogs",
    "refreshTokenMustBeRedactedInLogs",
    "encryptedAtRestRequiredBeforePersistence",
    "keyRotationPolicyRequiredBeforePersistence",
    "amazonCredentialSchemaRequiresSeparateStep",
    "amazonTokenSchemaRequiresSeparateStep",
    "tokenPersistenceRequiresSeparateStep",
    "companyIdRequiredBeforePersistence",
    "storeIdRequiredBeforePersistence",
    "marketplaceIdRequiredBeforePersistence",
    "regionRequiredBeforePersistence",
    "sellingPartnerIdRequiredBeforePersistence",
    "refreshTokenEncryptedAtRestRequired",
    "accessTokenCacheEncryptedAtRestRequired",
    "revokeDisconnectRequired",
    "auditLogRequired",
    "invalidGrantRejected",
    "invalidClientRejected",
    "invalidRequestRejected",
    "unauthorizedClientRejected",
    "serverErrorRetriableInFuture",
    "throttlingRetriableInFuture",
    "rawErrorBodyLoggingForbidden",
    "callbackStateMustBeValidatedBeforeExchange",
    "sellingPartnerIdMustBeValidatedBeforeExchange",
    "companyStoreMarketplaceRegionMustBeResolvedBeforeExchange",
    "tokenExchangeMustNotCreateImportJobNow",
    "tokenExchangeMustNotCreateTransactionNow",
    "tokenExchangeMustNotCreateInventoryMovementNow",
    "tokenExchangeHttpCall",
    "callbackControllerRoute",
    "authorizationControllerRoute",
    "frontendConnectionButton",
    "refreshTokenPersistence",
    "accessTokenPersistence",
    "clientSecretPersistence",
    "oauthStatePersistence",
    "amazonCredentialSchema",
    "amazonTokenSchema",
    "realSpApiHttpCall",
    "createReportCall",
    "getReportCall",
    "getReportDocumentCall",
    "importJobWrite",
    "transactionWrite",
    "inventoryWrite",
    "readyForTokenExchangeImplementation",
    "readyForTokenPersistenceSchemaContract",
    "readyForTokenPersistenceImplementation",
  ];

  for (const marker of requiredSourceMarkers) {
    assert(sourceDto.includes(marker), `Step123-E DTO missing marker: ${marker}`);
  }

  const contract = assertAmazonSpApiTokenExchangePreflightContract(
    buildAmazonSpApiTokenExchangePreflightContract(),
  );

  assert(contract.sourceStep123D.contractOnly === true, "Step123-E must depend on Step123-D contract-only boundary");
  assert(
    contract.sourceStep123D.summary.readyForTokenExchangePreflightContract === true,
    "Step123-D must allow Step123-E token exchange preflight contract",
  );

  assert(
    contract.summary.readyForTokenExchangeImplementation === false,
    "Step123-E must not allow token exchange implementation",
  );
  assert(
    contract.summary.readyForTokenPersistenceSchemaContract === true,
    "Step123-E should allow token persistence schema contract as a future contract-only step",
  );
  assert(
    contract.summary.readyForTokenPersistenceImplementation === false,
    "Step123-E must not allow token persistence implementation",
  );
  assert(
    contract.summary.readyForRealSpApiReportRequest === false,
    "Step123-E must not allow real SP-API report request",
  );

  const implementationGuard = assertNoStep123EImplementationLeak(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api token exchange preflight contract smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step123-E",
        contract: {
          version: contract.version,
          contractOnly: contract.contractOnly,
          implementationNow: contract.implementationNow,
          backendRouteAddedNow: contract.backendRouteAddedNow,
          frontendRouteAddedNow: contract.frontendRouteAddedNow,
          schemaChangedNow: contract.schemaChangedNow,
          tokenPersistenceNow: contract.tokenPersistenceNow,
          realSpApiRequestNow: contract.realSpApiRequestNow,
          writesDatabase: contract.writesDatabase,
          tokenExchangeBoundary: contract.tokenExchangeBoundary,
          tokenEndpointRequestContract: contract.tokenEndpointRequestContract,
          tokenEndpointResponseContract: contract.tokenEndpointResponseContract,
          secretHandlingPolicy: contract.secretHandlingPolicy,
          futurePersistencePolicy: contract.futurePersistencePolicy,
          errorResponseContract: contract.errorResponseContract,
          linkageContract: contract.linkageContract,
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
