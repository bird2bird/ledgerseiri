#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  assertAmazonSpApiLwaOAuthStateContract,
  buildAmazonSpApiLwaOAuthStateContract,
} = require("../dist/src/imports/dto/amazon-sp-api-lwa-oauth-state-contract.dto");

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

function assertNoStep123BImplementationLeak(repoRoot) {
  const apiRoot = path.resolve(repoRoot, "apps/api");
  const apiSrcRoot = path.resolve(apiRoot, "src");

  const apiImplementationFiles = listFiles(apiSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p))
    .filter((file) => !isApiContractOrDto(file));

  const routeLeaks = [];
  const tokenExchangeLeaks = [];
  const persistenceLeaks = [];
  const realSpApiLeaks = [];
  const writeLeaks = [];

  // Step123-B FIX1:
  // Existing Step122 sandbox read-model routes are legitimate and must not be
  // treated as OAuth/LWA implementation. Only explicit OAuth/LWA/callback/connect
  // route shapes are forbidden here.
  const routePatterns = [
    /@Get\s*\([^)]*(lwa|oauth|callback|connect)/i,
    /@Post\s*\([^)]*(lwa|oauth|callback|connect)/i,
  ];

  const allowedExistingAmazonSandboxRouteFragments = [
    "internal/amazon-sp-api-sandbox/import-jobs/read-model",
  ];

  const tokenExchangeFragments = [
    "lwa.amazon.com/auth/o2/token",
    "api.amazon.com/auth/o2/token",
    "authorization_code",
    "grant_type",
    "refresh_token",
    "client_secret",
  ];

  const amazonLwaContextFragments = [
    "AmazonSpApiCredential",
    "AmazonSpApiToken",
    "AmazonSpApiConnection",
    "AmazonSpApiOAuthState",
    "amazon-sp-api-real",
    "sellingpartnerapi",
    "selling-partner-api",
    "LoginWithAmazon",
    "loginWithAmazon",
    "lwa.amazon.com",
    "api.amazon.com/auth/o2/token",
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
    const hasTokenExchange = tokenExchangeFragments.some((fragment) => text.includes(fragment));
    const hasPersistence = persistenceFragments.some((fragment) => text.includes(fragment));
    const hasRealSpApi = realSpApiFragments.some((fragment) => text.includes(fragment));

    const isSandboxOnly =
      text.includes("AmazonSpApiSandbox") ||
      text.includes("amazon-sp-api-sandbox") ||
      text.includes("AMAZON_ORDER_SP_API");

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

  assert(routeLeaks.length === 0, `OAuth/LWA route leak detected: ${JSON.stringify(routeLeaks)}`);
  assert(tokenExchangeLeaks.length === 0, `token exchange leak detected: ${JSON.stringify(tokenExchangeLeaks)}`);
  assert(persistenceLeaks.length === 0, `OAuth state/token persistence leak detected: ${JSON.stringify(persistenceLeaks)}`);
  assert(realSpApiLeaks.length === 0, `real SP-API implementation leak detected: ${JSON.stringify(realSpApiLeaks)}`);
  assert(writeLeaks.length === 0, `transaction/inventory write leak detected: ${JSON.stringify(writeLeaks)}`);
  assert(schemaLeaks.length === 0, `Amazon OAuth/credential/token schema leak detected: ${JSON.stringify(schemaLeaks)}`);

  return {
    scannedApiImplementationFiles: apiImplementationFiles.length,
    routeLeaks,
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
    packageJson.scripts["smoke:amazon-sp-api-lwa-oauth-state-contract"] ===
      "node scripts/smoke-amazon-sp-api-lwa-oauth-state-contract.js",
    "Step123-B npm script missing or mismatched",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-real-connection-boundary-lwa-preparation-contract"],
    "Step123-A regression smoke script missing",
  );

  const sourceDto = read(
    path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-lwa-oauth-state-contract.dto.ts"),
  );

  const requiredSourceMarkers = [
    "AMAZON_SP_API_LWA_OAUTH_STATE_CONTRACT_VERSION",
    "buildAmazonSpApiLwaOAuthStateContract",
    "assertAmazonSpApiLwaOAuthStateContract",
    "assertAmazonSpApiRealConnectionBoundaryLwaPreparationContract",
    "sourceStep123A",
    "companyIdRequired",
    "storeIdRequired",
    "marketplaceIdRequired",
    "regionRequired",
    "nonceRequired",
    "issuedAtRequired",
    "expiresAtRequired",
    "redirectAfterConnectRequired",
    "generatedServerSide",
    "highEntropyRequired",
    "singleUseRequiredInFuture",
    "replayDetectionRequiredInFuture",
    "persistenceForbiddenNow",
    "signedStateRequired",
    "tamperDetectionRequired",
    "csrfProtectionRequired",
    "openRedirectProtectionRequired",
    "oauthStatePersistenceRequiresSeparateStep",
    "oauthStateTableRequiresSeparateStep",
    "nonceHashStorageRequiredInFuture",
    "rawNonceStorageForbiddenInFuture",
    "consumedAtRequiredInFuture",
    "callbackAuditLogRequiredInFuture",
    "missingState",
    "malformedPayload",
    "invalidSignature",
    "expiredState",
    "nonceReplay",
    "companyMismatch",
    "storeMismatch",
    "marketplaceMismatch",
    "regionMismatch",
    "externalRedirect",
    "oauthAuthorizationRoute",
    "oauthCallbackRoute",
    "oauthStateSchema",
    "tokenExchangeHttpCall",
    "refreshTokenPersistence",
    "accessTokenPersistence",
    "clientSecretPersistence",
    "realSpApiHttpCall",
    "createReportCall",
    "getReportCall",
    "getReportDocumentCall",
    "transactionWrite",
    "inventoryWrite",
    "readyForAuthorizationUrlBuilderContract",
  ];

  for (const marker of requiredSourceMarkers) {
    assert(sourceDto.includes(marker), `Step123-B DTO missing marker: ${marker}`);
  }

  const contract = assertAmazonSpApiLwaOAuthStateContract(
    buildAmazonSpApiLwaOAuthStateContract(),
  );

  assert(contract.sourceStep123A.contractOnly === true, "Step123-B must depend on Step123-A contract-only boundary");
  assert(contract.summary.readyForAuthorizationUrlBuilderContract === true, "Step123-B should allow Step123-C contract");
  assert(contract.summary.readyForOauthRouteImplementation === false, "Step123-B must not allow OAuth route implementation");
  assert(contract.summary.readyForCallbackImplementation === false, "Step123-B must not allow callback implementation");
  assert(contract.summary.readyForOAuthStatePersistence === false, "Step123-B must not allow OAuth state persistence");
  assert(contract.summary.readyForTokenPersistence === false, "Step123-B must not allow token persistence");

  const implementationGuard = assertNoStep123BImplementationLeak(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api LWA OAuth state / nonce lifecycle contract smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step123-B",
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
          statePayloadContract: contract.statePayloadContract,
          nonceLifecycleContract: contract.nonceLifecycleContract,
          signingAndCsrfContract: contract.signingAndCsrfContract,
          futurePersistencePolicy: contract.futurePersistencePolicy,
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
