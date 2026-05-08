#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOAuthStateSigningImplementationPreflightContract,
  buildAmazonSpApiOAuthStateSigningImplementationPreflightContract,
  signAmazonSpApiOAuthStateImplementationPreflight,
  verifyAmazonSpApiOAuthStateImplementationPreflight,
} = require("../dist/src/imports/dto/amazon-sp-api-oauth-state-signing-implementation-preflight.dto");

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

function assertNoStep123JImplementationLeak(repoRoot) {
  const apiRoot = path.resolve(repoRoot, "apps/api");
  const apiSrcRoot = path.resolve(apiRoot, "src");
  const webSrcRoot = path.resolve(repoRoot, "apps/web/src");

  const apiImplementationFiles = listFiles(apiSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p))
    .filter((file) => !isApiContractOrDto(file));
  const webImplementationFiles = listFiles(webSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));

  const routeLeaks = [];
  const statePersistenceLeaks = [];
  const webApiClientLeaks = [];
  const webRedirectLeaks = [];
  const tokenExchangeLeaks = [];
  const realSpApiLeaks = [];
  const writeLeaks = [];

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

  const amazonRealConnectionContextFragments = [
    "AmazonSpApiConnection",
    "AmazonSpApiCredential",
    "AmazonSpApiToken",
    "AmazonSpApiAuthorization",
    "AmazonSpApiOAuthState",
    "AmazonSpApiAccessTokenCache",
    "amazon-sp-api-real",
    "authorization-url",
    "oauth-state",
    "signAmazonSpApiOAuthState",
    "verifyAmazonSpApiOAuthState",
  ];

  const statePersistenceFragments = [
    "oauthState.create",
    "oauthState.update",
    "nonce.create",
    "nonce.update",
    "amazonSpApiOAuthState.create",
    "amazonSpApiOAuthState.update",
    "prisma.amazonSpApiOAuthState",
    "prisma.nonce",
  ];

  const tokenExchangeFragments = [
    "api.amazon.com/auth/o2/token",
    "grant_type",
    "authorization_code",
    "refresh_token",
    "access_token",
    "client_secret",
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

    const isAllowedExistingAmazonSandboxRoute = allowedExistingAmazonSandboxRouteFragments.some((fragment) =>
      text.includes(fragment),
    );

    for (const pattern of routePatterns) {
      if (pattern.test(text) && !isAllowedExistingAmazonSandboxRoute) {
        routeLeaks.push(rel);
      }
    }

    const hasAmazonRealContext = amazonRealConnectionContextFragments.some((fragment) => text.includes(fragment));
    const hasStatePersistence = statePersistenceFragments.some((fragment) => text.includes(fragment));
    const hasTokenExchange = tokenExchangeFragments.some((fragment) => text.includes(fragment));
    const hasRealSpApi = realSpApiFragments.some((fragment) => text.includes(fragment));
    const hasWrite = writeFragments.some((fragment) => text.includes(fragment));

    const isSandboxOnly =
      text.includes("AmazonSpApiSandbox") ||
      text.includes("amazon-sp-api-sandbox") ||
      text.includes("AMAZON_ORDER_SP_API");

    if (hasAmazonRealContext && hasStatePersistence && !isSandboxOnly) {
      statePersistenceLeaks.push(rel);
    }

    if (hasAmazonRealContext && hasTokenExchange && !isSandboxOnly) {
      tokenExchangeLeaks.push(rel);
    }

    if (hasAmazonRealContext && hasRealSpApi && !isSandboxOnly) {
      realSpApiLeaks.push(rel);
    }

    if (hasAmazonRealContext && hasWrite && !isSandboxOnly) {
      writeLeaks.push(rel);
    }
  }

  for (const file of webImplementationFiles) {
    const text = read(file);
    const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");

    const isAllowedExistingWebFile = allowedExistingWebFragments.some((fragment) => text.includes(fragment));
    const hasAmazonRealContext = amazonRealConnectionContextFragments.some((fragment) => text.includes(fragment));
    const hasApiClient =
      text.includes("/api/imports/amazon-sp-api") ||
      text.includes("authorization-url") ||
      text.includes("oauth-state") ||
      text.includes("connection-status");
    const hasRedirect =
      text.includes("window.location") ||
      text.includes("location.href") ||
      text.includes("router.push");

    if (hasAmazonRealContext && hasApiClient && !isAllowedExistingWebFile) {
      webApiClientLeaks.push(rel);
    }

    if (hasAmazonRealContext && hasRedirect && !isAllowedExistingWebFile) {
      webRedirectLeaks.push(rel);
    }
  }

  const schema = read(path.resolve(apiRoot, "prisma/schema.prisma"));
  const forbiddenSchemaModels = [
    "model AmazonSpApiCredential",
    "model AmazonSpApiToken",
    "model AmazonSpApiConnection",
    "model AmazonSpApiOAuthState",
    "model AmazonSpApiAccessTokenCache",
  ];

  const schemaLeaks = forbiddenSchemaModels.filter((fragment) => schema.includes(fragment));

  assert(routeLeaks.length === 0, `Amazon OAuth state route leak detected: ${JSON.stringify(routeLeaks)}`);
  assert(statePersistenceLeaks.length === 0, `Amazon OAuth state persistence leak detected: ${JSON.stringify(statePersistenceLeaks)}`);
  assert(webApiClientLeaks.length === 0, `Amazon OAuth state frontend API client leak detected: ${JSON.stringify(webApiClientLeaks)}`);
  assert(webRedirectLeaks.length === 0, `Amazon OAuth state frontend redirect leak detected: ${JSON.stringify(webRedirectLeaks)}`);
  assert(tokenExchangeLeaks.length === 0, `token exchange implementation leak detected: ${JSON.stringify(tokenExchangeLeaks)}`);
  assert(realSpApiLeaks.length === 0, `real SP-API implementation leak detected: ${JSON.stringify(realSpApiLeaks)}`);
  assert(writeLeaks.length === 0, `ImportJob/transaction/inventory write leak detected: ${JSON.stringify(writeLeaks)}`);
  assert(schemaLeaks.length === 0, `Amazon credential/token/oauth schema.prisma leak detected: ${JSON.stringify(schemaLeaks)}`);

  return {
    scannedApiImplementationFiles: apiImplementationFiles.length,
    scannedWebImplementationFiles: webImplementationFiles.length,
    routeLeaks,
    statePersistenceLeaks,
    webApiClientLeaks,
    webRedirectLeaks,
    tokenExchangeLeaks,
    realSpApiLeaks,
    writeLeaks,
    schemaLeaks,
  };
}

function assertStateSigningBehavior() {
  const payload = {
    companyId: "company-step123-j",
    storeId: "store-step123-j",
    marketplaceId: "A1VC38T7YXB528",
    region: "FE",
    nonce: "nonce-step123-j-1234567890",
    issuedAt: "2026-05-08T00:00:00.000Z",
    expiresAt: "2026-05-08T00:10:00.000Z",
    redirectAfterConnect: "/app/data/import",
  };

  const hmacSigningKey = "step123-j-test-hmac-signing-key";

  const signed = signAmazonSpApiOAuthStateImplementationPreflight({
    payload,
    hmacSigningKey,
  });

  assert(typeof signed.state === "string", "signed state must be string");
  assert(signed.state.split(".").length === 2, "signed state must have payload.signature format");
  assert(signed.noncePersistenceNow === false, "Step123-J must not persist nonce");
  assert(signed.oauthStatePersistenceNow === false, "Step123-J must not persist OAuth state");
  assert(signed.controllerRouteAddedNow === false, "Step123-J must not add controller route");
  assert(signed.tokenExchangeNow === false, "Step123-J must not exchange token");

  const verified = verifyAmazonSpApiOAuthStateImplementationPreflight({
    state: signed.state,
    hmacSigningKey,
    nowIso: "2026-05-08T00:05:00.000Z",
    expectedCompanyId: payload.companyId,
    expectedStoreId: payload.storeId,
    expectedMarketplaceId: payload.marketplaceId,
    expectedRegion: payload.region,
    allowedRedirectAfterConnect: ["/app/data/import", "/app/settings/integrations"],
  });

  assert(verified.verified === true, "state should verify");
  assert(verified.payload.companyId === payload.companyId, "companyId mismatch after verify");
  assert(verified.payload.storeId === payload.storeId, "storeId mismatch after verify");
  assert(verified.payload.marketplaceId === payload.marketplaceId, "marketplaceId mismatch after verify");
  assert(verified.payload.region === payload.region, "region mismatch after verify");
  assert(verified.payload.nonce === payload.nonce, "nonce mismatch after verify");
  assert(verified.payload.redirectAfterConnect === payload.redirectAfterConnect, "redirect target mismatch after verify");

  const parts = signed.state.split(".");
  const tamperedPayload = `${parts[0].slice(0, -1)}x.${parts[1]}`;

  assertThrows(
    () =>
      verifyAmazonSpApiOAuthStateImplementationPreflight({
        state: tamperedPayload,
        hmacSigningKey,
        nowIso: "2026-05-08T00:05:00.000Z",
        expectedCompanyId: payload.companyId,
        expectedStoreId: payload.storeId,
        expectedMarketplaceId: payload.marketplaceId,
        expectedRegion: payload.region,
        allowedRedirectAfterConnect: ["/app/data/import"],
      }),
    "tampered state",
  );

  assertThrows(
    () =>
      verifyAmazonSpApiOAuthStateImplementationPreflight({
        state: signed.state,
        hmacSigningKey: "wrong-key",
        nowIso: "2026-05-08T00:05:00.000Z",
        expectedCompanyId: payload.companyId,
        expectedStoreId: payload.storeId,
        expectedMarketplaceId: payload.marketplaceId,
        expectedRegion: payload.region,
        allowedRedirectAfterConnect: ["/app/data/import"],
      }),
    "tampered state",
  );

  assertThrows(
    () =>
      verifyAmazonSpApiOAuthStateImplementationPreflight({
        state: signed.state,
        hmacSigningKey,
        nowIso: "2026-05-08T00:11:00.000Z",
        expectedCompanyId: payload.companyId,
        expectedStoreId: payload.storeId,
        expectedMarketplaceId: payload.marketplaceId,
        expectedRegion: payload.region,
        allowedRedirectAfterConnect: ["/app/data/import"],
      }),
    "expired state",
  );

  assertThrows(
    () =>
      verifyAmazonSpApiOAuthStateImplementationPreflight({
        state: signed.state,
        hmacSigningKey,
        nowIso: "2026-05-08T00:05:00.000Z",
        expectedCompanyId: "another-company",
        expectedStoreId: payload.storeId,
        expectedMarketplaceId: payload.marketplaceId,
        expectedRegion: payload.region,
        allowedRedirectAfterConnect: ["/app/data/import"],
      }),
    "company mismatch",
  );

  assertThrows(
    () =>
      verifyAmazonSpApiOAuthStateImplementationPreflight({
        state: signed.state,
        hmacSigningKey,
        nowIso: "2026-05-08T00:05:00.000Z",
        expectedCompanyId: payload.companyId,
        expectedStoreId: "another-store",
        expectedMarketplaceId: payload.marketplaceId,
        expectedRegion: payload.region,
        allowedRedirectAfterConnect: ["/app/data/import"],
      }),
    "store mismatch",
  );

  assertThrows(
    () =>
      verifyAmazonSpApiOAuthStateImplementationPreflight({
        state: signed.state,
        hmacSigningKey,
        nowIso: "2026-05-08T00:05:00.000Z",
        expectedCompanyId: payload.companyId,
        expectedStoreId: payload.storeId,
        expectedMarketplaceId: "ATVPDKIKX0DER",
        expectedRegion: payload.region,
        allowedRedirectAfterConnect: ["/app/data/import"],
      }),
    "marketplace mismatch",
  );

  assertThrows(
    () =>
      verifyAmazonSpApiOAuthStateImplementationPreflight({
        state: signed.state,
        hmacSigningKey,
        nowIso: "2026-05-08T00:05:00.000Z",
        expectedCompanyId: payload.companyId,
        expectedStoreId: payload.storeId,
        expectedMarketplaceId: payload.marketplaceId,
        expectedRegion: "NA",
        allowedRedirectAfterConnect: ["/app/data/import"],
      }),
    "region mismatch",
  );

  assertThrows(
    () =>
      verifyAmazonSpApiOAuthStateImplementationPreflight({
        state: signed.state,
        hmacSigningKey,
        nowIso: "2026-05-08T00:05:00.000Z",
        expectedCompanyId: payload.companyId,
        expectedStoreId: payload.storeId,
        expectedMarketplaceId: payload.marketplaceId,
        expectedRegion: payload.region,
        allowedRedirectAfterConnect: ["/app/settings/integrations"],
      }),
    "unsafe redirect target",
  );

  assertThrows(
    () =>
      signAmazonSpApiOAuthStateImplementationPreflight({
        payload: {
          ...payload,
          redirectAfterConnect: "https://evil.example/callback",
        },
        hmacSigningKey,
      }),
    "unsafe redirect target",
  );

  assertThrows(
    () =>
      signAmazonSpApiOAuthStateImplementationPreflight({
        payload: {
          ...payload,
          expiresAt: payload.issuedAt,
        },
        hmacSigningKey,
      }),
    "expiresAt must be after issuedAt",
  );

  assertThrows(
    () =>
      signAmazonSpApiOAuthStateImplementationPreflight({
        payload,
        hmacSigningKey: " ",
      }),
    "hmacSigningKey is required",
  );

  assertThrows(
    () =>
      verifyAmazonSpApiOAuthStateImplementationPreflight({
        state: "malformed-state",
        hmacSigningKey,
        nowIso: "2026-05-08T00:05:00.000Z",
        expectedCompanyId: payload.companyId,
        expectedStoreId: payload.storeId,
        expectedMarketplaceId: payload.marketplaceId,
        expectedRegion: payload.region,
        allowedRedirectAfterConnect: ["/app/data/import"],
      }),
    "malformed state",
  );

  assertThrows(
    () =>
      verifyAmazonSpApiOAuthStateImplementationPreflight({
        state: signed.state,
        hmacSigningKey,
        nowIso: "2026-05-08T00:05:00.000Z",
        expectedCompanyId: payload.companyId,
        expectedStoreId: payload.storeId,
        expectedMarketplaceId: payload.marketplaceId,
        expectedRegion: payload.region,
        allowedRedirectAfterConnect: [],
      }),
    "allowed redirect list is required",
  );

  return { signed, verified };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");

  assert(typeof signAmazonSpApiOAuthStateImplementationPreflight === "function", "sign helper export missing");
  assert(typeof verifyAmazonSpApiOAuthStateImplementationPreflight === "function", "verify helper export missing");
  assert(
    typeof buildAmazonSpApiOAuthStateSigningImplementationPreflightContract === "function",
    "contract builder export missing",
  );
  assert(
    typeof assertAmazonSpApiOAuthStateSigningImplementationPreflightContract === "function",
    "contract assert export missing",
  );

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-oauth-state-signing-implementation-preflight"] ===
      "node scripts/smoke-amazon-sp-api-oauth-state-signing-implementation-preflight.js",
    "Step123-J npm script missing or mismatched",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-authorization-url-builder-implementation-preflight"],
    "Step123-I regression smoke script missing",
  );

  const sourceDto = read(
    path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-oauth-state-signing-implementation-preflight.dto.ts"),
  );

  const requiredSourceMarkers = [
    "AMAZON_SP_API_OAUTH_STATE_SIGNING_IMPLEMENTATION_PREFLIGHT_VERSION",
    "signAmazonSpApiOAuthStateImplementationPreflight",
    "verifyAmazonSpApiOAuthStateImplementationPreflight",
    "buildAmazonSpApiOAuthStateSigningImplementationPreflightContract",
    "assertAmazonSpApiOAuthStateSigningImplementationPreflightContract",
    "assertAmazonSpApiAuthorizationUrlBuilderImplementationPreflightContract",
    "sourceStep123I",
    "pure-function-oauth-state-signing-verification-preflight-only",
    "hmacSignatureRequired",
    "deterministicVerificationRequired",
    "noNoncePersistenceRequired",
    "companyIdRequired",
    "storeIdRequired",
    "marketplaceIdRequired",
    "regionRequired",
    "nonceRequired",
    "issuedAtRequired",
    "expiresAtRequired",
    "redirectAfterConnectRequired",
    "hmacSha256Required",
    "base64UrlEncodingRequired",
    "constantTimeSignatureCompareRequired",
    "tamperedStateRejected",
    "malformedStateRejected",
    "blankSigningKeyRejected",
    "expiredStateRejected",
    "companyMismatchRejected",
    "storeMismatchRejected",
    "marketplaceMismatchRejected",
    "regionMismatchRejected",
    "unsafeRedirectRejected",
    "controllerRoute",
    "frontendButton",
    "oauthStatePersistence",
    "noncePersistence",
    "tokenExchangeHttpCall",
    "readyForCallbackQueryValidatorImplementationPreflight",
    "readyForAuthorizationRouteImplementation",
  ];

  for (const marker of requiredSourceMarkers) {
    assert(sourceDto.includes(marker), `Step123-J DTO missing marker: ${marker}`);
  }

  const contract = assertAmazonSpApiOAuthStateSigningImplementationPreflightContract(
    buildAmazonSpApiOAuthStateSigningImplementationPreflightContract(),
  );

  assert(contract.sourceStep123I.implementationPreflightOnly === true, "Step123-J must depend on Step123-I preflight boundary");
  assert(
    contract.sourceStep123I.summary.readyForOauthStateSigningImplementationPreflight === true,
    "Step123-I must allow Step123-J state signing preflight",
  );
  assert(contract.implementationPreflightOnly === true, "Step123-J must be implementation preflight only");
  assert(contract.pureFunctionAddedNow === true, "Step123-J must add only pure functions");
  assert(contract.backendRouteAddedNow === false, "Step123-J must not add backend route");
  assert(contract.frontendApiClientAddedNow === false, "Step123-J must not add frontend API client");
  assert(contract.browserRedirectAddedNow === false, "Step123-J must not redirect browser");
  assert(contract.noncePersistenceNow === false, "Step123-J must not persist nonce");
  assert(contract.oauthStatePersistenceNow === false, "Step123-J must not persist OAuth state");
  assert(contract.tokenPersistenceNow === false, "Step123-J must not persist token");
  assert(contract.realSpApiRequestNow === false, "Step123-J must not call real SP-API");
  assert(contract.writesDatabase === false, "Step123-J must not write database");

  const stateBehavior = assertStateSigningBehavior();
  const implementationGuard = assertNoStep123JImplementationLeak(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api OAuth state signing implementation preflight smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step123-J",
        contract: {
          version: contract.version,
          implementationPreflightOnly: contract.implementationPreflightOnly,
          pureFunctionAddedNow: contract.pureFunctionAddedNow,
          backendRouteAddedNow: contract.backendRouteAddedNow,
          frontendComponentAddedNow: contract.frontendComponentAddedNow,
          frontendApiClientAddedNow: contract.frontendApiClientAddedNow,
          buttonHandlerAddedNow: contract.buttonHandlerAddedNow,
          browserRedirectAddedNow: contract.browserRedirectAddedNow,
          noncePersistenceNow: contract.noncePersistenceNow,
          oauthStatePersistenceNow: contract.oauthStatePersistenceNow,
          tokenPersistenceNow: contract.tokenPersistenceNow,
          schemaChangedNow: contract.schemaChangedNow,
          migrationAddedNow: contract.migrationAddedNow,
          realSpApiRequestNow: contract.realSpApiRequestNow,
          writesDatabase: contract.writesDatabase,
          preflightBoundary: contract.preflightBoundary,
          payloadContract: contract.payloadContract,
          signatureContract: contract.signatureContract,
          verificationContract: contract.verificationContract,
          forbiddenNow: contract.forbiddenNow,
          summary: contract.summary,
        },
        signedStatePreview: {
          stateLength: stateBehavior.signed.state.length,
          stateParts: stateBehavior.signed.state.split(".").length,
          verified: stateBehavior.verified.verified,
          redirectAfterConnect: stateBehavior.verified.payload.redirectAfterConnect,
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
