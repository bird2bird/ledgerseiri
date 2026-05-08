#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiCallbackQueryValidatorImplementationPreflightContract,
  buildAmazonSpApiCallbackQueryValidatorImplementationPreflightContract,
  validateAmazonSpApiCallbackQueryImplementationPreflight,
} = require("../dist/src/imports/dto/amazon-sp-api-callback-query-validator-implementation-preflight.dto");

const {
  signAmazonSpApiOAuthStateImplementationPreflight,
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

function assertNoStep123KImplementationLeak(repoRoot) {
  const apiRoot = path.resolve(repoRoot, "apps/api");
  const apiSrcRoot = path.resolve(apiRoot, "src");
  const webSrcRoot = path.resolve(repoRoot, "apps/web/src");

  const apiImplementationFiles = listFiles(apiSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p))
    .filter((file) => !isApiContractOrDto(file));
  const webImplementationFiles = listFiles(webSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));

  const routeLeaks = [];
  const persistenceLeaks = [];
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
    "callback-query",
    "oauth/callback",
    "spapi_oauth_code",
    "selling_partner_id",
    "validateAmazonSpApiCallbackQuery",
  ];

  const persistenceFragments = [
    "oauthState.create",
    "oauthState.update",
    "nonce.create",
    "nonce.update",
    "authorizationCode.create",
    "authorizationCode.update",
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
    const hasPersistence = persistenceFragments.some((fragment) => text.includes(fragment));
    const hasTokenExchange = tokenExchangeFragments.some((fragment) => text.includes(fragment));
    const hasRealSpApi = realSpApiFragments.some((fragment) => text.includes(fragment));
    const hasWrite = writeFragments.some((fragment) => text.includes(fragment));

    const isSandboxOnly =
      text.includes("AmazonSpApiSandbox") ||
      text.includes("amazon-sp-api-sandbox") ||
      text.includes("AMAZON_ORDER_SP_API");

    if (hasAmazonRealContext && hasPersistence && !isSandboxOnly) {
      persistenceLeaks.push(rel);
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
      text.includes("oauth/callback") ||
      text.includes("spapi_oauth_code") ||
      text.includes("selling_partner_id");
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

  assert(routeLeaks.length === 0, `Amazon callback route leak detected: ${JSON.stringify(routeLeaks)}`);
  assert(persistenceLeaks.length === 0, `Amazon callback persistence leak detected: ${JSON.stringify(persistenceLeaks)}`);
  assert(webApiClientLeaks.length === 0, `Amazon callback frontend API client leak detected: ${JSON.stringify(webApiClientLeaks)}`);
  assert(webRedirectLeaks.length === 0, `Amazon callback frontend redirect leak detected: ${JSON.stringify(webRedirectLeaks)}`);
  assert(tokenExchangeLeaks.length === 0, `token exchange implementation leak detected: ${JSON.stringify(tokenExchangeLeaks)}`);
  assert(realSpApiLeaks.length === 0, `real SP-API implementation leak detected: ${JSON.stringify(realSpApiLeaks)}`);
  assert(writeLeaks.length === 0, `ImportJob/transaction/inventory write leak detected: ${JSON.stringify(writeLeaks)}`);
  assert(schemaLeaks.length === 0, `Amazon credential/token/oauth schema.prisma leak detected: ${JSON.stringify(schemaLeaks)}`);

  return {
    scannedApiImplementationFiles: apiImplementationFiles.length,
    scannedWebImplementationFiles: webImplementationFiles.length,
    routeLeaks,
    persistenceLeaks,
    webApiClientLeaks,
    webRedirectLeaks,
    tokenExchangeLeaks,
    realSpApiLeaks,
    writeLeaks,
    schemaLeaks,
  };
}

function signedStateFixture() {
  const payload = {
    companyId: "company-step123-k",
    storeId: "store-step123-k",
    marketplaceId: "A1VC38T7YXB528",
    region: "FE",
    nonce: "nonce-step123-k-1234567890",
    issuedAt: "2026-05-08T00:00:00.000Z",
    expiresAt: "2026-05-08T00:10:00.000Z",
    redirectAfterConnect: "/app/data/import",
  };

  const hmacSigningKey = "step123-k-test-hmac-signing-key";

  const signed = signAmazonSpApiOAuthStateImplementationPreflight({
    payload,
    hmacSigningKey,
  });

  return { payload, hmacSigningKey, state: signed.state };
}

function baseValidatorInput(overrides = {}) {
  const fixture = signedStateFixture();

  return {
    query: {
      state: fixture.state,
      spapi_oauth_code: "spapi-code-step123-k",
      selling_partner_id: "A1SELLERSTEP123K",
    },
    hmacSigningKey: fixture.hmacSigningKey,
    nowIso: "2026-05-08T00:05:00.000Z",
    expectedCompanyId: fixture.payload.companyId,
    expectedStoreId: fixture.payload.storeId,
    expectedMarketplaceId: fixture.payload.marketplaceId,
    expectedRegion: fixture.payload.region,
    allowedRedirectAfterConnect: ["/app/data/import", "/app/settings/integrations"],
    ...overrides,
  };
}

function assertCallbackQueryBehavior() {
  const success = validateAmazonSpApiCallbackQueryImplementationPreflight(baseValidatorInput());

  assert(success.outcome === "success", "success callback outcome mismatch");
  assert(success.spapiOAuthCode === "spapi-code-step123-k", "spapi_oauth_code mismatch");
  assert(success.sellingPartnerId === "A1SELLERSTEP123K", "selling_partner_id mismatch");
  assert(success.verifiedStatePayload.companyId === "company-step123-k", "verified company mismatch");
  assert(success.callbackRouteAddedNow === false, "Step123-K must not add callback route");
  assert(success.tokenExchangeNow === false, "Step123-K must not exchange token");
  assert(success.authorizationCodePersistenceNow === false, "Step123-K must not persist authorization code");
  assert(success.oauthStatePersistenceNow === false, "Step123-K must not persist OAuth state");
  assert(success.noncePersistenceNow === false, "Step123-K must not persist nonce");

  const withMws = validateAmazonSpApiCallbackQueryImplementationPreflight(
    baseValidatorInput({
      query: {
        ...baseValidatorInput().query,
        mws_auth_token: "legacy-mws-token-ignored",
      },
    }),
  );
  assert(withMws.outcome === "success", "mws token should not change success outcome");
  assert(withMws.mwsAuthTokenIgnored === true, "mws_auth_token should be ignored");

  const error = validateAmazonSpApiCallbackQueryImplementationPreflight(
    baseValidatorInput({
      query: {
        state: baseValidatorInput().query.state,
        error: "invalid_request",
        error_description: "Something went wrong",
        error_uri: "https://sellercentral.amazon.co.jp/help",
      },
    }),
  );
  assert(error.outcome === "error", "error callback outcome mismatch");
  assert(error.error === "invalid_request", "error code mismatch");
  assert(error.tokenExchangeNow === false, "error callback must not exchange token");

  const cancelled = validateAmazonSpApiCallbackQueryImplementationPreflight(
    baseValidatorInput({
      query: {
        state: baseValidatorInput().query.state,
        error: "access_denied",
        error_description: "Seller denied authorization",
      },
    }),
  );
  assert(cancelled.outcome === "cancelled", "access_denied should be cancelled");
  assert(cancelled.tokenExchangeNow === false, "cancelled callback must not exchange token");

  assertThrows(
    () =>
      validateAmazonSpApiCallbackQueryImplementationPreflight(
        baseValidatorInput({
          query: {
            spapi_oauth_code: "spapi-code-step123-k",
            selling_partner_id: "A1SELLERSTEP123K",
          },
        }),
      ),
    "state is required",
  );

  assertThrows(
    () =>
      validateAmazonSpApiCallbackQueryImplementationPreflight(
        baseValidatorInput({
          query: {
            state: baseValidatorInput().query.state,
            selling_partner_id: "A1SELLERSTEP123K",
          },
        }),
      ),
    "spapi_oauth_code is required",
  );

  assertThrows(
    () =>
      validateAmazonSpApiCallbackQueryImplementationPreflight(
        baseValidatorInput({
          query: {
            state: baseValidatorInput().query.state,
            spapi_oauth_code: "spapi-code-step123-k",
          },
        }),
      ),
    "selling_partner_id is required",
  );

  assertThrows(
    () =>
      validateAmazonSpApiCallbackQueryImplementationPreflight(
        baseValidatorInput({
          nowIso: "2026-05-08T00:11:00.000Z",
        }),
      ),
    "expired state",
  );

  assertThrows(
    () =>
      validateAmazonSpApiCallbackQueryImplementationPreflight(
        baseValidatorInput({
          expectedCompanyId: "another-company",
        }),
      ),
    "company mismatch",
  );

  assertThrows(
    () =>
      validateAmazonSpApiCallbackQueryImplementationPreflight(
        baseValidatorInput({
          expectedStoreId: "another-store",
        }),
      ),
    "store mismatch",
  );

  assertThrows(
    () =>
      validateAmazonSpApiCallbackQueryImplementationPreflight(
        baseValidatorInput({
          expectedMarketplaceId: "ATVPDKIKX0DER",
        }),
      ),
    "marketplace mismatch",
  );

  assertThrows(
    () =>
      validateAmazonSpApiCallbackQueryImplementationPreflight(
        baseValidatorInput({
          expectedRegion: "NA",
        }),
      ),
    "region mismatch",
  );

  const fixture = signedStateFixture();
  const parts = fixture.state.split(".");
  const tamperedState = `${parts[0].slice(0, -1)}x.${parts[1]}`;

  assertThrows(
    () =>
      validateAmazonSpApiCallbackQueryImplementationPreflight(
        baseValidatorInput({
          query: {
            state: tamperedState,
            spapi_oauth_code: "spapi-code-step123-k",
            selling_partner_id: "A1SELLERSTEP123K",
          },
        }),
      ),
    "tampered state",
  );

  assertThrows(
    () =>
      validateAmazonSpApiCallbackQueryImplementationPreflight(
        baseValidatorInput({
          allowedRedirectAfterConnect: ["/app/settings/integrations"],
        }),
      ),
    "unsafe redirect target",
  );

  return { success, error, cancelled };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");

  assert(typeof validateAmazonSpApiCallbackQueryImplementationPreflight === "function", "callback validator export missing");
  assert(
    typeof buildAmazonSpApiCallbackQueryValidatorImplementationPreflightContract === "function",
    "contract builder export missing",
  );
  assert(
    typeof assertAmazonSpApiCallbackQueryValidatorImplementationPreflightContract === "function",
    "contract assert export missing",
  );

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-callback-query-validator-implementation-preflight"] ===
      "node scripts/smoke-amazon-sp-api-callback-query-validator-implementation-preflight.js",
    "Step123-K npm script missing or mismatched",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-oauth-state-signing-implementation-preflight"],
    "Step123-J regression smoke script missing",
  );

  const sourceDto = read(
    path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-callback-query-validator-implementation-preflight.dto.ts"),
  );

  const requiredSourceMarkers = [
    "AMAZON_SP_API_CALLBACK_QUERY_VALIDATOR_IMPLEMENTATION_PREFLIGHT_VERSION",
    "validateAmazonSpApiCallbackQueryImplementationPreflight",
    "buildAmazonSpApiCallbackQueryValidatorImplementationPreflightContract",
    "assertAmazonSpApiCallbackQueryValidatorImplementationPreflightContract",
    "verifyAmazonSpApiOAuthStateImplementationPreflight",
    "sourceStep123J",
    "pure-function-callback-query-validator-preflight-only",
    "stateVerificationRequired",
    "successQueryValidationRequired",
    "errorQueryValidationRequired",
    "cancelQueryValidationRequired",
    "spapiOAuthCodeRequired",
    "sellingPartnerIdRequired",
    "mwsAuthTokenIgnored",
    "accessDeniedTreatedAsCancelled",
    "errorCallbackMustNotExchangeToken",
    "authorizationCodePersistence",
    "tokenExchangeHttpCall",
    "readyForTokenExchangeImplementationPreflight",
    "readyForCallbackRouteImplementation",
  ];

  for (const marker of requiredSourceMarkers) {
    assert(sourceDto.includes(marker), `Step123-K DTO missing marker: ${marker}`);
  }

  const contract = assertAmazonSpApiCallbackQueryValidatorImplementationPreflightContract(
    buildAmazonSpApiCallbackQueryValidatorImplementationPreflightContract(),
  );

  assert(contract.sourceStep123J.implementationPreflightOnly === true, "Step123-K must depend on Step123-J preflight boundary");
  assert(
    contract.sourceStep123J.summary.readyForCallbackQueryValidatorImplementationPreflight === true,
    "Step123-J must allow Step123-K callback query validator preflight",
  );
  assert(contract.implementationPreflightOnly === true, "Step123-K must be implementation preflight only");
  assert(contract.pureFunctionAddedNow === true, "Step123-K must add only pure function");
  assert(contract.backendRouteAddedNow === false, "Step123-K must not add backend route");
  assert(contract.callbackRouteAddedNow === false, "Step123-K must not add callback route");
  assert(contract.frontendApiClientAddedNow === false, "Step123-K must not add frontend API client");
  assert(contract.authorizationCodePersistenceNow === false, "Step123-K must not persist authorization code");
  assert(contract.oauthStatePersistenceNow === false, "Step123-K must not persist OAuth state");
  assert(contract.noncePersistenceNow === false, "Step123-K must not persist nonce");
  assert(contract.tokenExchangeNow === false, "Step123-K must not exchange token");
  assert(contract.tokenPersistenceNow === false, "Step123-K must not persist token");
  assert(contract.realSpApiRequestNow === false, "Step123-K must not call real SP-API");
  assert(contract.writesDatabase === false, "Step123-K must not write database");

  const callbackBehavior = assertCallbackQueryBehavior();
  const implementationGuard = assertNoStep123KImplementationLeak(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api callback query validator implementation preflight smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step123-K",
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
          authorizationCodePersistenceNow: contract.authorizationCodePersistenceNow,
          noncePersistenceNow: contract.noncePersistenceNow,
          oauthStatePersistenceNow: contract.oauthStatePersistenceNow,
          tokenExchangeNow: contract.tokenExchangeNow,
          tokenPersistenceNow: contract.tokenPersistenceNow,
          schemaChangedNow: contract.schemaChangedNow,
          migrationAddedNow: contract.migrationAddedNow,
          realSpApiRequestNow: contract.realSpApiRequestNow,
          writesDatabase: contract.writesDatabase,
          preflightBoundary: contract.preflightBoundary,
          successQueryContract: contract.successQueryContract,
          errorQueryContract: contract.errorQueryContract,
          verificationContract: contract.verificationContract,
          forbiddenNow: contract.forbiddenNow,
          summary: contract.summary,
        },
        callbackPreview: {
          successOutcome: callbackBehavior.success.outcome,
          errorOutcome: callbackBehavior.error.outcome,
          cancelledOutcome: callbackBehavior.cancelled.outcome,
          verifiedCompanyId: callbackBehavior.success.verifiedStatePayload.companyId,
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
