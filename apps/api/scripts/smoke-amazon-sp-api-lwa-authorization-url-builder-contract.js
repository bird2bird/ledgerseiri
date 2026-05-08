#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  assertAmazonSpApiLwaAuthorizationUrlBuilderContract,
  buildAmazonSpApiLwaAuthorizationUrlBuilderContract,
} = require("../dist/src/imports/dto/amazon-sp-api-lwa-authorization-url-builder-contract.dto");

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

function assertNoStep123CImplementationLeak(repoRoot) {
  const apiRoot = path.resolve(repoRoot, "apps/api");
  const apiSrcRoot = path.resolve(apiRoot, "src");

  const apiImplementationFiles = listFiles(apiSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p))
    .filter((file) => !isApiContractOrDto(file));

  const routeLeaks = [];
  const authorizationBuilderLeaks = [];
  const tokenExchangeLeaks = [];
  const persistenceLeaks = [];
  const realSpApiLeaks = [];
  const writeLeaks = [];

  const allowedExistingAmazonSandboxRouteFragments = [
    "internal/amazon-sp-api-sandbox/import-jobs/read-model",
  ];

  const routePatterns = [
    /@Get\s*\([^)]*(lwa|oauth|callback|connect|authorize|authorization)/i,
    /@Post\s*\([^)]*(lwa|oauth|callback|connect|authorize|authorization)/i,
  ];

  const authorizationBuilderFragments = [
    "new URL(",
    "URLSearchParams",
    "sellercentral.amazon.co.jp/apps/authorize/consent",
    "sellercentral.amazon.com/apps/authorize/consent",
    "sellercentral-europe.amazon.com/apps/authorize/consent",
    "application_id",
    "version=beta",
  ];

  const amazonLwaContextFragments = [
    "AmazonSpApiCredential",
    "AmazonSpApiToken",
    "AmazonSpApiConnection",
    "AmazonSpApiOAuthState",
    "AmazonSpApiLwaAuthorization",
    "amazon-sp-api-real",
    "sellingpartnerapi",
    "selling-partner-api",
    "LoginWithAmazon",
    "loginWithAmazon",
    "lwa.amazon.com",
    "api.amazon.com/auth/o2/token",
    "spapi_oauth_code",
  ];

  const tokenExchangeFragments = [
    "lwa.amazon.com/auth/o2/token",
    "api.amazon.com/auth/o2/token",
    "authorization_code",
    "grant_type",
    "refresh_token",
    "client_secret",
    "spapi_oauth_code",
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
    const hasAuthorizationBuilder = authorizationBuilderFragments.some((fragment) => text.includes(fragment));
    const hasTokenExchange = tokenExchangeFragments.some((fragment) => text.includes(fragment));
    const hasPersistence = persistenceFragments.some((fragment) => text.includes(fragment));
    const hasRealSpApi = realSpApiFragments.some((fragment) => text.includes(fragment));

    const isSandboxOnly =
      text.includes("AmazonSpApiSandbox") ||
      text.includes("amazon-sp-api-sandbox") ||
      text.includes("AMAZON_ORDER_SP_API");

    if (hasAmazonLwaContext && hasAuthorizationBuilder && !isSandboxOnly) {
      authorizationBuilderLeaks.push(rel);
    }

    if (hasAmazonLwaContext && hasTokenExchange && !isSandboxOnly) {
      tokenExchangeLeaks.push(rel);
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

  assert(routeLeaks.length === 0, `OAuth/LWA authorization route leak detected: ${JSON.stringify(routeLeaks)}`);
  assert(authorizationBuilderLeaks.length === 0, `authorization URL builder implementation leak detected: ${JSON.stringify(authorizationBuilderLeaks)}`);
  assert(tokenExchangeLeaks.length === 0, `token exchange leak detected: ${JSON.stringify(tokenExchangeLeaks)}`);
  assert(persistenceLeaks.length === 0, `OAuth state/token persistence leak detected: ${JSON.stringify(persistenceLeaks)}`);
  assert(realSpApiLeaks.length === 0, `real SP-API implementation leak detected: ${JSON.stringify(realSpApiLeaks)}`);
  assert(writeLeaks.length === 0, `transaction/inventory write leak detected: ${JSON.stringify(writeLeaks)}`);
  assert(schemaLeaks.length === 0, `Amazon OAuth/credential/token schema leak detected: ${JSON.stringify(schemaLeaks)}`);

  return {
    scannedApiImplementationFiles: apiImplementationFiles.length,
    routeLeaks,
    authorizationBuilderLeaks,
    tokenExchangeLeaks,
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
    packageJson.scripts["smoke:amazon-sp-api-lwa-authorization-url-builder-contract"] ===
      "node scripts/smoke-amazon-sp-api-lwa-authorization-url-builder-contract.js",
    "Step123-C npm script missing or mismatched",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-lwa-oauth-state-contract"],
    "Step123-B regression smoke script missing",
  );

  const sourceDto = read(
    path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-lwa-authorization-url-builder-contract.dto.ts"),
  );

  const requiredSourceMarkers = [
    "AMAZON_SP_API_LWA_AUTHORIZATION_URL_BUILDER_CONTRACT_VERSION",
    "buildAmazonSpApiLwaAuthorizationUrlBuilderContract",
    "assertAmazonSpApiLwaAuthorizationUrlBuilderContract",
    "assertAmazonSpApiLwaOAuthStateContract",
    "sourceStep123B",
    "construct-lwa-authorization-consent-url-contract",
    "inputValidationOnly",
    "urlConstructionDesignOnly",
    "browserRedirectExecutionForbiddenNow",
    "serverRouteExposureForbiddenNow",
    "regionRequired",
    "marketplaceIdRequired",
    "marketplaceMustMatchRegion",
    "allowedConsentEndpoints",
    "https://sellercentral.amazon.co.jp/apps/authorize/consent",
    "https://sellercentral.amazon.com/apps/authorize/consent",
    "https://sellercentral-europe.amazon.com/apps/authorize/consent",
    "defaultJapanRegion",
    "defaultJapanMarketplaceId",
    "A1VC38T7YXB528",
    "applicationIdRequired",
    "stateRequired",
    "stateMustComeFromStep123B",
    "redirectUriAllowedOnlyIfRegistered",
    "redirectUriAllowlistRequired",
    "versionBetaAllowedForDraftApps",
    "versionBetaForbiddenForPublishedApps",
    "unknownQueryParametersRejectedInFuture",
    "companyIdBoundByState",
    "storeIdBoundByState",
    "marketplaceIdBoundByState",
    "regionBoundByState",
    "nonceBoundByState",
    "expiresAtBoundByState",
    "signedStateRequired",
    "csrfProtectionInheritedFromStep123B",
    "externalRedirectForbidden",
    "registeredRedirectUriRequiredInFuture",
    "httpsRequiredOutsideLocalDevelopment",
    "localhostAllowedOnlyForDevelopment",
    "pathMustBeCallbackSpecificInFuture",
    "draftUsesVersionBeta",
    "publishedOmitsVersionBeta",
    "privateAppSelfAuthorizationNotImplementedNow",
    "publicWebsiteAuthorizationDesignOnly",
    "appstoreAuthorizationDesignOnly",
    "controllerRoute",
    "frontendAuthorizeButton",
    "browserRedirect",
    "oauthCallbackRoute",
    "tokenExchangeHttpCall",
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
    "transactionWrite",
    "inventoryWrite",
    "readyForAuthorizationUrlBuilderImplementation",
    "readyForAuthorizeRouteImplementation",
    "readyForFrontendAuthorizeButton",
    "readyForCallbackPreflightContract",
  ];

  for (const marker of requiredSourceMarkers) {
    assert(sourceDto.includes(marker), `Step123-C DTO missing marker: ${marker}`);
  }

  const contract = assertAmazonSpApiLwaAuthorizationUrlBuilderContract(
    buildAmazonSpApiLwaAuthorizationUrlBuilderContract(),
  );

  assert(contract.sourceStep123B.contractOnly === true, "Step123-C must depend on Step123-B contract-only boundary");
  assert(
    contract.sourceStep123B.summary.readyForAuthorizationUrlBuilderContract === true,
    "Step123-B must allow Step123-C authorization URL builder contract",
  );

  assert(
    contract.summary.readyForAuthorizationUrlBuilderImplementation === false,
    "Step123-C must not allow authorization URL builder implementation yet",
  );
  assert(
    contract.summary.readyForAuthorizeRouteImplementation === false,
    "Step123-C must not allow authorize route implementation",
  );
  assert(
    contract.summary.readyForFrontendAuthorizeButton === false,
    "Step123-C must not allow frontend authorize button",
  );
  assert(
    contract.summary.readyForCallbackPreflightContract === true,
    "Step123-C should allow Step123-D callback preflight contract",
  );
  assert(
    contract.summary.readyForCallbackImplementation === false,
    "Step123-C must not allow callback implementation",
  );
  assert(
    contract.summary.readyForTokenPersistence === false,
    "Step123-C must not allow token persistence",
  );

  const implementationGuard = assertNoStep123CImplementationLeak(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api LWA authorization URL builder contract smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step123-C",
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
          builderBoundary: contract.builderBoundary,
          regionalEndpointContract: contract.regionalEndpointContract,
          queryParameterContract: contract.queryParameterContract,
          stateBindingContract: contract.stateBindingContract,
          redirectUriPolicy: contract.redirectUriPolicy,
          appModePolicy: contract.appModePolicy,
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
