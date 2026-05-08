#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  assertAmazonSpApiOAuthCallbackPreflightContract,
  buildAmazonSpApiOAuthCallbackPreflightContract,
} = require("../dist/src/imports/dto/amazon-sp-api-oauth-callback-preflight-contract.dto");

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

function assertNoStep123DImplementationLeak(repoRoot) {
  const apiRoot = path.resolve(repoRoot, "apps/api");
  const apiSrcRoot = path.resolve(apiRoot, "src");

  const apiImplementationFiles = listFiles(apiSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p))
    .filter((file) => !isApiContractOrDto(file));

  const routeLeaks = [];
  const callbackValidationLeaks = [];
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

  const callbackValidationFragments = [
    "spapi_oauth_code",
    "selling_partner_id",
    "error_description",
    "mws_auth_token",
    "callbackPreflight",
    "oauthCallback",
    "OAuthCallback",
  ];

  const amazonLwaContextFragments = [
    "AmazonSpApiCredential",
    "AmazonSpApiToken",
    "AmazonSpApiConnection",
    "AmazonSpApiOAuthState",
    "AmazonSpApiLwaAuthorization",
    "AmazonSpApiOAuthCallback",
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
    const hasCallbackValidation = callbackValidationFragments.some((fragment) => text.includes(fragment));
    const hasTokenExchange = tokenExchangeFragments.some((fragment) => text.includes(fragment));
    const hasPersistence = persistenceFragments.some((fragment) => text.includes(fragment));
    const hasRealSpApi = realSpApiFragments.some((fragment) => text.includes(fragment));

    const isSandboxOnly =
      text.includes("AmazonSpApiSandbox") ||
      text.includes("amazon-sp-api-sandbox") ||
      text.includes("AMAZON_ORDER_SP_API");

    if (hasAmazonLwaContext && hasCallbackValidation && !isSandboxOnly) {
      callbackValidationLeaks.push(rel);
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

  assert(routeLeaks.length === 0, `OAuth/LWA callback route leak detected: ${JSON.stringify(routeLeaks)}`);
  assert(callbackValidationLeaks.length === 0, `callback validation implementation leak detected: ${JSON.stringify(callbackValidationLeaks)}`);
  assert(tokenExchangeLeaks.length === 0, `token exchange leak detected: ${JSON.stringify(tokenExchangeLeaks)}`);
  assert(persistenceLeaks.length === 0, `OAuth state/token persistence leak detected: ${JSON.stringify(persistenceLeaks)}`);
  assert(realSpApiLeaks.length === 0, `real SP-API implementation leak detected: ${JSON.stringify(realSpApiLeaks)}`);
  assert(writeLeaks.length === 0, `transaction/inventory write leak detected: ${JSON.stringify(writeLeaks)}`);
  assert(schemaLeaks.length === 0, `Amazon OAuth/credential/token schema leak detected: ${JSON.stringify(schemaLeaks)}`);

  return {
    scannedApiImplementationFiles: apiImplementationFiles.length,
    routeLeaks,
    callbackValidationLeaks,
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
    packageJson.scripts["smoke:amazon-sp-api-oauth-callback-preflight-contract"] ===
      "node scripts/smoke-amazon-sp-api-oauth-callback-preflight-contract.js",
    "Step123-D npm script missing or mismatched",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-lwa-authorization-url-builder-contract"],
    "Step123-C regression smoke script missing",
  );

  const sourceDto = read(
    path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-oauth-callback-preflight-contract.dto.ts"),
  );

  const requiredSourceMarkers = [
    "AMAZON_SP_API_OAUTH_CALLBACK_PREFLIGHT_CONTRACT_VERSION",
    "buildAmazonSpApiOAuthCallbackPreflightContract",
    "assertAmazonSpApiOAuthCallbackPreflightContract",
    "assertAmazonSpApiLwaAuthorizationUrlBuilderContract",
    "sourceStep123C",
    "validate-oauth-callback-query-contract-only",
    "queryValidationOnly",
    "stateVerificationDesignOnly",
    "tokenExchangeForbiddenNow",
    "callbackRouteExposureForbiddenNow",
    "browserRedirectHandlingForbiddenNow",
    "stateRequired",
    "spapiOAuthCodeRequired",
    "sellingPartnerIdRequired",
    "mwsAuthTokenIgnored",
    "unknownQueryParametersRejectedInFuture",
    "errorAllowed",
    "errorDescriptionAllowed",
    "errorUriAllowed",
    "stateStillRequiredWhenErrorPresent",
    "errorCallbackMustNotExchangeToken",
    "userDeniedAuthorizationTreatedAsCancelled",
    "signedStateRequired",
    "stateMustComeFromStep123B",
    "stateMustHaveBeenUsedToBuildStep123CAuthorizationUrl",
    "companyIdBindingRequired",
    "storeIdBindingRequired",
    "marketplaceIdBindingRequired",
    "regionBindingRequired",
    "nonceBindingRequired",
    "expiresAtBindingRequired",
    "expiredStateRejected",
    "tamperedStateRejected",
    "openRedirectRejected",
    "spapiOAuthCodeSingleUseRequiredInFuture",
    "spapiOAuthCodeMustNotBeLoggedRawInFuture",
    "spapiOAuthCodeMustNotBePersistedNow",
    "spapiOAuthCodeExchangeRequiresSeparateStep",
    "authorizationCodeOneTimeUseInheritedFromStep123A",
    "sellingPartnerIdMustBindToCompanyStoreInFuture",
    "sellingPartnerMarketplaceCompatibilityRequiredInFuture",
    "sellingPartnerMismatchRejectedInFuture",
    "auditLogRequiredInFuture",
    "rawQueryLoggingForbiddenInFuture",
    "redactedCodeLoggingOnlyInFuture",
    "callbackOutcomeTrackedInFuture",
    "missingSpapiOAuthCodeOnSuccess",
    "missingSellingPartnerIdOnSuccess",
    "callbackControllerRoute",
    "frontendCallbackPage",
    "tokenExchangeHttpCall",
    "refreshTokenPersistence",
    "accessTokenPersistence",
    "clientSecretPersistence",
    "oauthStatePersistence",
    "oauthStateSchema",
    "amazonCredentialSchema",
    "amazonTokenSchema",
    "realSpApiHttpCall",
    "createReportCall",
    "getReportCall",
    "getReportDocumentCall",
    "transactionWrite",
    "inventoryWrite",
    "readyForCallbackPreflightImplementation",
    "readyForCallbackRouteImplementation",
    "readyForTokenExchangePreflightContract",
    "readyForTokenExchangeImplementation",
  ];

  for (const marker of requiredSourceMarkers) {
    assert(sourceDto.includes(marker), `Step123-D DTO missing marker: ${marker}`);
  }

  const contract = assertAmazonSpApiOAuthCallbackPreflightContract(
    buildAmazonSpApiOAuthCallbackPreflightContract(),
  );

  assert(contract.sourceStep123C.contractOnly === true, "Step123-D must depend on Step123-C contract-only boundary");
  assert(
    contract.sourceStep123C.summary.readyForCallbackPreflightContract === true,
    "Step123-C must allow Step123-D callback preflight contract",
  );

  assert(
    contract.summary.readyForCallbackPreflightImplementation === false,
    "Step123-D must not allow callback preflight implementation yet",
  );
  assert(
    contract.summary.readyForCallbackRouteImplementation === false,
    "Step123-D must not allow callback route implementation",
  );
  assert(
    contract.summary.readyForTokenExchangePreflightContract === true,
    "Step123-D should allow Step123-E token exchange preflight contract",
  );
  assert(
    contract.summary.readyForTokenExchangeImplementation === false,
    "Step123-D must not allow token exchange implementation",
  );
  assert(
    contract.summary.readyForTokenPersistence === false,
    "Step123-D must not allow token persistence",
  );
  assert(
    contract.summary.readyForRealSpApiReportRequest === false,
    "Step123-D must not allow real SP-API report request",
  );

  const implementationGuard = assertNoStep123DImplementationLeak(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api OAuth callback preflight contract smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step123-D",
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
          callbackBoundary: contract.callbackBoundary,
          successQueryContract: contract.successQueryContract,
          errorQueryContract: contract.errorQueryContract,
          statePreflightContract: contract.statePreflightContract,
          authorizationCodePolicy: contract.authorizationCodePolicy,
          sellingPartnerBindingPolicy: contract.sellingPartnerBindingPolicy,
          callbackAuditPolicy: contract.callbackAuditPolicy,
          failurePolicy: contract.failurePolicy,
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
