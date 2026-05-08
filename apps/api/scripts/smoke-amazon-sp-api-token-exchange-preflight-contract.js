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

function isAllowedPostStep123EOauthBoundaryFile(rel) {
  return [
    "apps/api/src/imports/amazon-sp-api-token-persistence.repository.ts",
    "apps/api/src/imports/amazon-sp-api-oauth-state-persistence-bridge.service.ts",
    "apps/api/src/imports/amazon-sp-api-token-exchange.service.ts",
    "apps/api/src/imports/amazon-sp-api-oauth-authorization-url.service.ts",
    "apps/api/src/imports/imports.controller.ts",
  ].includes(rel);
}

function assertNoDangerousStep123ERegression(repoRoot) {
  const apiRoot = path.resolve(repoRoot, "apps/api");
  const apiSrcRoot = path.resolve(apiRoot, "src");

  const apiImplementationFiles = listFiles(apiSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p))
    .filter((file) => !isApiContractOrDto(file));

  const dangerousLwaHttpLeaks = [];
  const realSpApiLeaks = [];
  const writeLeaks = [];
  const unauthorizedOauthRouteLeaks = [];

  const allowedRouteFragments = [
    "internal/amazon-sp-api-sandbox/import-jobs/read-model",
    "amazon-sp-api/oauth/callback",
    "amazon-sp-api/oauth/authorization-url",
  ];

  const routePatterns = [
    /@Get\s*\([^)]*(lwa|oauth|callback|connect|authorize|authorization|token)/i,
    /@Post\s*\([^)]*(lwa|oauth|callback|connect|authorize|authorization|token)/i,
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

  for (const file of apiImplementationFiles) {
    const text = read(file);
    const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");

    const allowedPostStep123E = isAllowedPostStep123EOauthBoundaryFile(rel);

    for (const pattern of routePatterns) {
      if (pattern.test(text)) {
        const isAllowedRoute = allowedRouteFragments.some((fragment) => text.includes(fragment));
        if (!isAllowedRoute) {
          unauthorizedOauthRouteLeaks.push(rel);
        }
      }
    }

    const callsFetchOrAxiosOrHttpService =
      /\bfetch\s*\(/.test(text) ||
      /\baxios\s*\./.test(text) ||
      /\bhttpService\s*\./.test(text) ||
      /\brequest\s*\(/.test(text);

    const referencesLwaTokenEndpoint =
      text.includes("api.amazon.com/auth/o2/token") ||
      text.includes("lwa.amazon.com/auth/o2/token");

    const postsFormEncodedTokenExchange =
      text.includes("application/x-www-form-urlencoded") &&
      text.includes("grant_type") &&
      text.includes("authorization_code") &&
      (text.includes("client_secret") || text.includes("clientId") || text.includes("client_id"));

    if ((referencesLwaTokenEndpoint && callsFetchOrAxiosOrHttpService) || (postsFormEncodedTokenExchange && callsFetchOrAxiosOrHttpService)) {
      dangerousLwaHttpLeaks.push(rel);
    }

    const hasRealSpApi = realSpApiFragments.some((fragment) => text.includes(fragment));
    if (
      hasRealSpApi &&
      !allowedPostStep123E &&
      !text.includes("AmazonSpApiSandbox") &&
      !text.includes("amazon-sp-api-sandbox")
    ) {
      realSpApiLeaks.push(rel);
    }

    const hasDomainWrite = writeFragments.some((fragment) => text.includes(fragment));
    const hasAmazonRealContext =
      text.includes("amazon-sp-api-real") ||
      text.includes("sourceType: 'amazon-sp-api'") ||
      text.includes('sourceType: "amazon-sp-api"') ||
      text.includes("realSourceType: 'amazon-sp-api'") ||
      text.includes('realSourceType: "amazon-sp-api"') ||
      text.includes("sp-api-report-readonly");

    if (hasDomainWrite && hasAmazonRealContext && !allowedPostStep123E) {
      writeLeaks.push(rel);
    }
  }

  const schema = read(path.resolve(apiRoot, "prisma/schema.prisma"));
  // Phase-aware schema guard:
  // Step124+ legitimately introduced AmazonSpApiConnection,
  // AmazonSpApiCredential, AmazonSpApiAccessTokenCache and
  // AmazonSpApiConnectionAudit. Keep guarding only legacy/incorrect
  // schema names that should not appear in the current architecture.
  const forbiddenSchemaModels = [
    "model AmazonSpApiOAuthState",
    "model AmazonSpApiToken",
    "model AmazonOAuthState",
    "model AmazonCredential",
    "model AmazonToken",
  ];

  const schemaLeaks = forbiddenSchemaModels.filter((fragment) => schema.includes(fragment));

  assert(unauthorizedOauthRouteLeaks.length === 0, `unauthorized OAuth/LWA/token route leak detected: ${JSON.stringify(unauthorizedOauthRouteLeaks)}`);
  assert(dangerousLwaHttpLeaks.length === 0, `dangerous LWA HTTP token exchange leak detected: ${JSON.stringify(dangerousLwaHttpLeaks)}`);
  assert(realSpApiLeaks.length === 0, `real SP-API implementation leak detected: ${JSON.stringify(realSpApiLeaks)}`);
  assert(writeLeaks.length === 0, `ImportJob/transaction/inventory write leak detected: ${JSON.stringify(writeLeaks)}`);
  assert(schemaLeaks.length === 0, `unexpected Amazon OAuth/credential/token schema leak detected: ${JSON.stringify(schemaLeaks)}`);

  return {
    scannedApiImplementationFiles: apiImplementationFiles.length,
    allowedPostStep123EOauthBoundaryFiles: [
      "apps/api/src/imports/amazon-sp-api-token-persistence.repository.ts",
      "apps/api/src/imports/amazon-sp-api-oauth-state-persistence-bridge.service.ts",
      "apps/api/src/imports/amazon-sp-api-token-exchange.service.ts",
      "apps/api/src/imports/imports.controller.ts",
    ],
    unauthorizedOauthRouteLeaks,
    dangerousLwaHttpLeaks,
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
    "Step123-E original contract must still not directly allow token exchange implementation",
  );
  assert(
    contract.summary.readyForTokenPersistenceSchemaContract === true,
    "Step123-E should allow token persistence schema contract as a future contract-only step",
  );
  assert(
    contract.summary.readyForTokenPersistenceImplementation === false,
    "Step123-E original contract must still not directly allow token persistence implementation",
  );
  assert(
    contract.summary.readyForRealSpApiReportRequest === false,
    "Step123-E must not allow real SP-API report request",
  );

  const implementationGuard = assertNoDangerousStep123ERegression(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api token exchange preflight contract smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step123-E",
        phaseAwareRegression: true,
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
