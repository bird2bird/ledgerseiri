#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiTokenExchangeImplementationPreflightContract,
  buildAmazonSpApiTokenExchangeImplementationPreflightContract,
  buildAmazonSpApiTokenExchangeRequestImplementationPreflight,
  validateAmazonSpApiTokenExchangeSuccessResponseImplementationPreflight,
  validateAmazonSpApiTokenExchangeErrorResponseImplementationPreflight,
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

function assertNoStep123LImplementationLeak(repoRoot) {
  const apiRoot = path.resolve(repoRoot, "apps/api");
  const apiSrcRoot = path.resolve(apiRoot, "src");
  const webSrcRoot = path.resolve(repoRoot, "apps/web/src");

  const apiImplementationFiles = listFiles(apiSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p))
    .filter((file) => !isApiContractOrDto(file));
  const webImplementationFiles = listFiles(webSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));

  const routeLeaks = [];
  const httpCallLeaks = [];
  const persistenceLeaks = [];
  const webApiClientLeaks = [];
  const tokenExposureLeaks = [];
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

  // Step123-L FIX1:
  // Generic auth files legitimately contain application accessToken/refreshToken
  // and access_token cookies. Those are not Amazon SP-API credentials.
  //
  // Therefore Amazon token leaks must require Amazon-specific context, not
  // generic OAuth/JWT words such as access_token, refresh_token, or client_secret.
  const amazonRealConnectionContextFragments = [
    "AmazonSpApiConnection",
    "AmazonSpApiCredential",
    "AmazonSpApiToken",
    "AmazonSpApiAuthorization",
    "AmazonSpApiOAuthState",
    "AmazonSpApiAccessTokenCache",
    "amazon-sp-api-real",
    "amazon-sp-api-token-exchange",
    "api.amazon.com/auth/o2/token",
    "buildAmazonSpApiTokenExchange",
    "validateAmazonSpApiTokenExchange",
  ];

  const httpCallFragments = [
    "fetch(",
    "axios.",
    "httpService.",
    ".post(",
    "request(",
    "api.amazon.com/auth/o2/token",
  ];

  const persistenceFragments = [
    "amazonSpApiConnection.create",
    "amazonSpApiConnection.update",
    "amazonSpApiCredential.create",
    "amazonSpApiCredential.update",
    "amazonSpApiToken.create",
    "amazonSpApiToken.update",
    "amazonSpApiAccessTokenCache.create",
    "amazonSpApiAccessTokenCache.update",
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
    const hasHttpCall = httpCallFragments.some((fragment) => text.includes(fragment));
    const hasPersistence = persistenceFragments.some((fragment) => text.includes(fragment));
    const hasRealSpApi = realSpApiFragments.some((fragment) => text.includes(fragment));
    const hasWrite = writeFragments.some((fragment) => text.includes(fragment));

    const isSandboxOnly =
      text.includes("AmazonSpApiSandbox") ||
      text.includes("amazon-sp-api-sandbox") ||
      text.includes("AMAZON_ORDER_SP_API");

    if (hasAmazonRealContext && hasHttpCall && !isSandboxOnly) {
      httpCallLeaks.push(rel);
    }

    if (hasAmazonRealContext && hasPersistence && !isSandboxOnly) {
      persistenceLeaks.push(rel);
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
      text.includes("token-exchange") ||
      text.includes("refresh_token") ||
      text.includes("access_token") ||
      text.includes("client_secret");

    if (hasAmazonRealContext && hasApiClient && !isAllowedExistingWebFile) {
      webApiClientLeaks.push(rel);
    }

    if (hasAmazonRealContext && hasApiClient && !isAllowedExistingWebFile) {
      tokenExposureLeaks.push(rel);
    }
  }

  // Guard against repeating the Step123-L false positive:
  // application auth controllers may use accessToken/refreshToken, but without
  // Amazon-specific markers they must not be classified as Amazon token leaks.
  const genericAuthFiles = [
    "apps/api/src/auth/auth.controller.ts",
    "apps/api/src/auth/refresh.controller.ts",
  ];
  for (const rel of genericAuthFiles) {
    const abs = path.resolve(repoRoot, rel);
    if (!fs.existsSync(abs)) continue;
    const authText = read(abs);
    const hasGenericTokenWords =
      authText.includes("accessToken") ||
      authText.includes("refreshToken") ||
      authText.includes("access_token");
    const hasAmazonSpecificContext = amazonRealConnectionContextFragments.some((fragment) =>
      authText.includes(fragment),
    );
    assert(hasGenericTokenWords, `Expected generic auth token words in ${rel}`);
    assert(!hasAmazonSpecificContext, `Generic auth file unexpectedly contains Amazon token context: ${rel}`);
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

  assert(routeLeaks.length === 0, `Amazon token route leak detected: ${JSON.stringify(routeLeaks)}`);
  assert(httpCallLeaks.length === 0, `Amazon token exchange HTTP call leak detected: ${JSON.stringify(httpCallLeaks)}`);
  assert(persistenceLeaks.length === 0, `Amazon token persistence leak detected: ${JSON.stringify(persistenceLeaks)}`);
  assert(webApiClientLeaks.length === 0, `Amazon token frontend API client leak detected: ${JSON.stringify(webApiClientLeaks)}`);
  assert(tokenExposureLeaks.length === 0, `Amazon token frontend exposure leak detected: ${JSON.stringify(tokenExposureLeaks)}`);
  assert(realSpApiLeaks.length === 0, `real SP-API implementation leak detected: ${JSON.stringify(realSpApiLeaks)}`);
  assert(writeLeaks.length === 0, `ImportJob/transaction/inventory write leak detected: ${JSON.stringify(writeLeaks)}`);
  assert(schemaLeaks.length === 0, `Amazon credential/token/oauth schema.prisma leak detected: ${JSON.stringify(schemaLeaks)}`);

  return {
    scannedApiImplementationFiles: apiImplementationFiles.length,
    scannedWebImplementationFiles: webImplementationFiles.length,
    routeLeaks,
    httpCallLeaks,
    persistenceLeaks,
    webApiClientLeaks,
    tokenExposureLeaks,
    realSpApiLeaks,
    writeLeaks,
    schemaLeaks,
  };
}

function assertTokenExchangePreflightBehavior() {
  const request = buildAmazonSpApiTokenExchangeRequestImplementationPreflight({
    spapiOAuthCode: "spapi-code-step123-l",
    clientId: "amzn1.application-oa2-client.step123-l",
    clientSecret: "super-secret-step123-l",
    redirectUri: "https://ledgerseiri.com/api/imports/amazon-sp-api/oauth/callback",
  });

  assert(request.endpoint === "https://api.amazon.com/auth/o2/token", "token endpoint mismatch");
  assert(request.method === "POST", "HTTP method mismatch");
  assert(request.contentType === "application/x-www-form-urlencoded", "content type mismatch");
  assert(request.body.grant_type === "authorization_code", "grant_type mismatch");
  assert(request.body.code === "spapi-code-step123-l", "authorization code mismatch");
  assert(request.formBody.includes("grant_type=authorization_code"), "formBody missing grant_type");
  assert(request.formBody.includes("code=spapi-code-step123-l"), "formBody missing code");
  assert(request.redactedPreview.code === "[REDACTED_AUTHORIZATION_CODE]", "authorization code must be redacted");
  assert(request.redactedPreview.client_secret === "[REDACTED_CLIENT_SECRET]", "client secret must be redacted");
  assert(request.httpCallNow === false, "Step123-L must not call HTTP");
  assert(request.tokenPersistenceNow === false, "Step123-L must not persist token");
  assert(request.writesDatabase === false, "Step123-L must not write DB");

  assertThrows(
    () =>
      buildAmazonSpApiTokenExchangeRequestImplementationPreflight({
        spapiOAuthCode: "",
        clientId: "client",
        clientSecret: "secret",
        redirectUri: "https://ledgerseiri.com/callback",
      }),
    "spapiOAuthCode is required",
  );

  assertThrows(
    () =>
      buildAmazonSpApiTokenExchangeRequestImplementationPreflight({
        spapiOAuthCode: "code",
        clientId: "client",
        clientSecret: " ",
        redirectUri: "https://ledgerseiri.com/callback",
      }),
    "clientSecret is required",
  );

  const success = validateAmazonSpApiTokenExchangeSuccessResponseImplementationPreflight({
    access_token: "Atza|access-token-step123-l",
    refresh_token: "Atzr|refresh-token-step123-l",
    token_type: "bearer",
    expires_in: 3600,
    scope: "sellingpartnerapi::notifications",
  });

  assert(success.accessToken === "Atza|access-token-step123-l", "access token mismatch");
  assert(success.refreshToken === "Atzr|refresh-token-step123-l", "refresh token mismatch");
  assert(success.tokenType === "bearer", "token type mismatch");
  assert(success.expiresIn === 3600, "expires_in mismatch");
  assert(success.redactedPreview.accessToken === "[REDACTED_ACCESS_TOKEN]", "access token must be redacted");
  assert(success.redactedPreview.refreshToken === "[REDACTED_REFRESH_TOKEN]", "refresh token must be redacted");
  assert(success.tokenPersistenceNow === false, "success validation must not persist token");
  assert(success.httpCallNow === false, "success validation must not call HTTP");

  assertThrows(
    () =>
      validateAmazonSpApiTokenExchangeSuccessResponseImplementationPreflight({
        refresh_token: "refresh",
        token_type: "bearer",
        expires_in: 3600,
      }),
    "access_token is required",
  );

  assertThrows(
    () =>
      validateAmazonSpApiTokenExchangeSuccessResponseImplementationPreflight({
        access_token: "access",
        refresh_token: "refresh",
        token_type: "bearer",
        expires_in: 0,
      }),
    "expires_in must be a positive integer",
  );

  const error = validateAmazonSpApiTokenExchangeErrorResponseImplementationPreflight({
    error: "invalid_grant",
    error_description: "Authorization code expired",
    error_uri: "https://developer.amazonservices.com",
  });

  assert(error.error === "invalid_grant", "error mismatch");
  assert(error.errorDescription === "Authorization code expired", "error_description mismatch");
  assert(error.tokenPersistenceNow === false, "error validation must not persist token");
  assert(error.httpCallNow === false, "error validation must not call HTTP");

  assertThrows(
    () =>
      validateAmazonSpApiTokenExchangeErrorResponseImplementationPreflight({
        error_description: "Missing error field",
      }),
    "error is required",
  );

  return { request, success, error };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");

  assert(typeof buildAmazonSpApiTokenExchangeRequestImplementationPreflight === "function", "request builder export missing");
  assert(typeof validateAmazonSpApiTokenExchangeSuccessResponseImplementationPreflight === "function", "success validator export missing");
  assert(typeof validateAmazonSpApiTokenExchangeErrorResponseImplementationPreflight === "function", "error validator export missing");
  assert(typeof buildAmazonSpApiTokenExchangeImplementationPreflightContract === "function", "contract builder export missing");
  assert(typeof assertAmazonSpApiTokenExchangeImplementationPreflightContract === "function", "contract assert export missing");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-token-exchange-implementation-preflight"] ===
      "node scripts/smoke-amazon-sp-api-token-exchange-implementation-preflight.js",
    "Step123-L npm script missing or mismatched",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-callback-query-validator-implementation-preflight"],
    "Step123-K regression smoke script missing",
  );

  const sourceDto = read(
    path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-token-exchange-implementation-preflight.dto.ts"),
  );

  const requiredSourceMarkers = [
    "AMAZON_SP_API_TOKEN_EXCHANGE_IMPLEMENTATION_PREFLIGHT_VERSION",
    "buildAmazonSpApiTokenExchangeRequestImplementationPreflight",
    "validateAmazonSpApiTokenExchangeSuccessResponseImplementationPreflight",
    "validateAmazonSpApiTokenExchangeErrorResponseImplementationPreflight",
    "buildAmazonSpApiTokenExchangeImplementationPreflightContract",
    "assertAmazonSpApiTokenExchangeImplementationPreflightContract",
    "sourceStep123K",
    "pure-function-token-exchange-request-response-preflight-only",
    "requestBodyBuilderRequired",
    "successResponseValidatorRequired",
    "errorResponseValidatorRequired",
    "redactedPreviewRequired",
    "https://api.amazon.com/auth/o2/token",
    "application/x-www-form-urlencoded",
    "authorization_code",
    "authorizationCodeRedactedInPreview",
    "clientSecretRedactedInPreview",
    "accessTokenRedactedInPreview",
    "refreshTokenRedactedInPreview",
    "tokenExchangeHttpCall",
    "readyForTokenPersistenceImplementationPreflight",
    "readyForTokenExchangeHttpImplementation",
  ];

  for (const marker of requiredSourceMarkers) {
    assert(sourceDto.includes(marker), `Step123-L DTO missing marker: ${marker}`);
  }

  const contract = assertAmazonSpApiTokenExchangeImplementationPreflightContract(
    buildAmazonSpApiTokenExchangeImplementationPreflightContract(),
  );

  assert(contract.sourceStep123K.implementationPreflightOnly === true, "Step123-L must depend on Step123-K preflight boundary");
  assert(
    contract.sourceStep123K.summary.readyForTokenExchangeImplementationPreflight === true,
    "Step123-K must allow Step123-L token exchange preflight",
  );
  assert(contract.implementationPreflightOnly === true, "Step123-L must be implementation preflight only");
  assert(contract.pureFunctionAddedNow === true, "Step123-L must add only pure functions");
  assert(contract.backendRouteAddedNow === false, "Step123-L must not add backend route");
  assert(contract.tokenExchangeHttpCallNow === false, "Step123-L must not call token endpoint");
  assert(contract.tokenPersistenceNow === false, "Step123-L must not persist token");
  assert(contract.refreshTokenPersistenceNow === false, "Step123-L must not persist refresh token");
  assert(contract.accessTokenPersistenceNow === false, "Step123-L must not persist access token");
  assert(contract.realSpApiRequestNow === false, "Step123-L must not call real SP-API");
  assert(contract.writesDatabase === false, "Step123-L must not write database");

  const behavior = assertTokenExchangePreflightBehavior();
  const implementationGuard = assertNoStep123LImplementationLeak(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api token exchange implementation preflight smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step123-L",
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
          tokenPersistenceNow: contract.tokenPersistenceNow,
          refreshTokenPersistenceNow: contract.refreshTokenPersistenceNow,
          accessTokenPersistenceNow: contract.accessTokenPersistenceNow,
          schemaChangedNow: contract.schemaChangedNow,
          migrationAddedNow: contract.migrationAddedNow,
          realSpApiRequestNow: contract.realSpApiRequestNow,
          writesDatabase: contract.writesDatabase,
          preflightBoundary: contract.preflightBoundary,
          requestContract: contract.requestContract,
          successResponseContract: contract.successResponseContract,
          errorResponseContract: contract.errorResponseContract,
          forbiddenNow: contract.forbiddenNow,
          summary: contract.summary,
        },
        tokenExchangePreview: {
          endpoint: behavior.request.endpoint,
          method: behavior.request.method,
          contentType: behavior.request.contentType,
          requestPreview: behavior.request.redactedPreview,
          successPreview: behavior.success.redactedPreview,
          errorPreview: behavior.error.redactedPreview,
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
