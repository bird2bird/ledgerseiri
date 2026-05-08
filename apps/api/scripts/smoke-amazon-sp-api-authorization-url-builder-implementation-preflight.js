#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiAuthorizationUrlBuilderImplementationPreflightContract,
  buildAmazonSpApiAuthorizationUrlImplementationPreflight,
  buildAmazonSpApiAuthorizationUrlBuilderImplementationPreflightContract,
} = require("../dist/src/imports/dto/amazon-sp-api-authorization-url-builder-implementation-preflight.dto");

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

function assertNoStep123IImplementationLeak(repoRoot) {
  const apiRoot = path.resolve(repoRoot, "apps/api");
  const apiSrcRoot = path.resolve(apiRoot, "src");
  const webSrcRoot = path.resolve(repoRoot, "apps/web/src");

  const apiImplementationFiles = listFiles(apiSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p))
    .filter((file) => !isApiContractOrDto(file));
  const webImplementationFiles = listFiles(webSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));

  const routeLeaks = [];
  const apiServiceLeaks = [];
  const webApiClientLeaks = [];
  const webRedirectLeaks = [];
  const persistenceLeaks = [];
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
    /@Get\s*\([^)]*(lwa|oauth|callback|connect|authorize|authorization|token|credential|connection-status|connection)/i,
    /@Post\s*\([^)]*(lwa|oauth|callback|connect|authorize|authorization|token|credential|connection-status|connection)/i,
  ];

  const amazonRealConnectionContextFragments = [
    "AmazonSpApiConnection",
    "AmazonSpApiCredential",
    "AmazonSpApiToken",
    "AmazonSpApiAuthorization",
    "AmazonSpApiAccessTokenCache",
    "amazon-sp-api-real",
    "authorization-url",
    "sellercentral.amazon.co.jp/apps/authorize/consent",
    "sellercentral.amazon.com/apps/authorize/consent",
    "sellercentral-europe.amazon.com/apps/authorize/consent",
  ];

  const backendServiceFragments = [
    "buildAmazonSpApiAuthorizationUrl",
    "getAmazonSpApiAuthorizationUrl",
    "createAmazonSpApiAuthorizationUrl",
    "amazonSpApiAuthorizationUrl",
  ];

  const persistenceFragments = [
    "oauthState.create",
    "oauthState.update",
    "nonce.create",
    "nonce.update",
    "amazonSpApiConnection.create",
    "amazonSpApiCredential.create",
    "refreshToken",
    "accessToken",
    "clientSecret",
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
    const hasBackendService = backendServiceFragments.some((fragment) => text.includes(fragment));
    const hasPersistence = persistenceFragments.some((fragment) => text.includes(fragment));
    const hasRealSpApi = realSpApiFragments.some((fragment) => text.includes(fragment));
    const hasWrite = writeFragments.some((fragment) => text.includes(fragment));

    const isSandboxOnly =
      text.includes("AmazonSpApiSandbox") ||
      text.includes("amazon-sp-api-sandbox") ||
      text.includes("AMAZON_ORDER_SP_API");

    if (hasAmazonRealContext && hasBackendService && !isSandboxOnly) {
      apiServiceLeaks.push(rel);
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
      text.includes("authorization-url") ||
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

  assert(routeLeaks.length === 0, `Amazon authorization route leak detected: ${JSON.stringify(routeLeaks)}`);
  assert(apiServiceLeaks.length === 0, `Amazon authorization service implementation leak detected: ${JSON.stringify(apiServiceLeaks)}`);
  assert(webApiClientLeaks.length === 0, `Amazon authorization frontend API client leak detected: ${JSON.stringify(webApiClientLeaks)}`);
  assert(webRedirectLeaks.length === 0, `Amazon authorization frontend redirect leak detected: ${JSON.stringify(webRedirectLeaks)}`);
  assert(persistenceLeaks.length === 0, `Amazon authorization persistence leak detected: ${JSON.stringify(persistenceLeaks)}`);
  assert(realSpApiLeaks.length === 0, `real SP-API implementation leak detected: ${JSON.stringify(realSpApiLeaks)}`);
  assert(writeLeaks.length === 0, `ImportJob/transaction/inventory write leak detected: ${JSON.stringify(writeLeaks)}`);
  assert(schemaLeaks.length === 0, `Amazon credential/token schema.prisma leak detected: ${JSON.stringify(schemaLeaks)}`);

  return {
    scannedApiImplementationFiles: apiImplementationFiles.length,
    scannedWebImplementationFiles: webImplementationFiles.length,
    routeLeaks,
    apiServiceLeaks,
    webApiClientLeaks,
    webRedirectLeaks,
    persistenceLeaks,
    realSpApiLeaks,
    writeLeaks,
    schemaLeaks,
  };
}

function assertUrlBuilderBehavior() {
  const baseInput = {
    region: "FE",
    marketplaceId: "A1VC38T7YXB528",
    applicationId: "amzn1.sp.solution.TESTAPP",
    redirectUri: "https://ledgerseiri.com/api/imports/amazon-sp-api/oauth/callback",
    allowedRedirectUris: ["https://ledgerseiri.com/api/imports/amazon-sp-api/oauth/callback"],
    state: "signed-state-placeholder",
  };

  const draft = buildAmazonSpApiAuthorizationUrlImplementationPreflight({
    ...baseInput,
    appMode: "draft",
  });

  const draftUrl = new URL(draft.authorizationUrl);
  assert(draft.endpoint === "https://sellercentral.amazon.co.jp/apps/authorize/consent", "FE endpoint mismatch");
  assert(draftUrl.origin + draftUrl.pathname === draft.endpoint, "draft URL endpoint mismatch");
  assert(draftUrl.searchParams.get("application_id") === baseInput.applicationId, "application_id mismatch");
  assert(draftUrl.searchParams.get("state") === baseInput.state, "state mismatch");
  assert(draftUrl.searchParams.get("redirect_uri") === baseInput.redirectUri, "redirect_uri mismatch");
  assert(draftUrl.searchParams.get("version") === "beta", "draft app must include version=beta");
  assert(draft.query.version === "beta", "draft query.version mismatch");
  assert(draft.browserRedirectNow === false, "Step123-I must not redirect browser");
  assert(draft.statePersistenceNow === false, "Step123-I must not persist state");
  assert(draft.tokenPersistenceNow === false, "Step123-I must not persist token");
  assert(draft.realAmazonCallNow === false, "Step123-I must not call Amazon");

  const published = buildAmazonSpApiAuthorizationUrlImplementationPreflight({
    ...baseInput,
    appMode: "published",
  });

  const publishedUrl = new URL(published.authorizationUrl);
  assert(publishedUrl.searchParams.get("version") === null, "published app must omit version=beta");
  assert(!("version" in published.query), "published query must omit version");

  const na = buildAmazonSpApiAuthorizationUrlImplementationPreflight({
    ...baseInput,
    region: "NA",
    marketplaceId: "ATVPDKIKX0DER",
    appMode: "draft",
  });
  assert(
    new URL(na.authorizationUrl).origin + new URL(na.authorizationUrl).pathname ===
      "https://sellercentral.amazon.com/apps/authorize/consent",
    "NA endpoint mismatch",
  );

  const eu = buildAmazonSpApiAuthorizationUrlImplementationPreflight({
    ...baseInput,
    region: "EU",
    marketplaceId: "A1F83G8C2ARO7P",
    appMode: "draft",
  });
  assert(
    new URL(eu.authorizationUrl).origin + new URL(eu.authorizationUrl).pathname ===
      "https://sellercentral-europe.amazon.com/apps/authorize/consent",
    "EU endpoint mismatch",
  );

  assertThrows(
    () =>
      buildAmazonSpApiAuthorizationUrlImplementationPreflight({
        ...baseInput,
        region: "NA",
        appMode: "draft",
      }),
    "Amazon.co.jp marketplace must use FE region",
  );

  assertThrows(
    () =>
      buildAmazonSpApiAuthorizationUrlImplementationPreflight({
        ...baseInput,
        redirectUri: "https://evil.example/callback",
        appMode: "draft",
      }),
    "redirect URI is not allowlisted",
  );

  assertThrows(
    () =>
      buildAmazonSpApiAuthorizationUrlImplementationPreflight({
        ...baseInput,
        allowedRedirectUris: [],
        appMode: "draft",
      }),
    "redirect URI allowlist is required",
  );

  assertThrows(
    () =>
      buildAmazonSpApiAuthorizationUrlImplementationPreflight({
        ...baseInput,
        applicationId: " ",
        appMode: "draft",
      }),
    "applicationId is required",
  );

  assertThrows(
    () =>
      buildAmazonSpApiAuthorizationUrlImplementationPreflight({
        ...baseInput,
        state: " ",
        appMode: "draft",
      }),
    "state is required",
  );

  assertThrows(
    () =>
      buildAmazonSpApiAuthorizationUrlImplementationPreflight({
        ...baseInput,
        redirectUri: " ",
        allowedRedirectUris: [" "],
        appMode: "draft",
      }),
    "redirectUri is required",
  );

  assertThrows(
    () =>
      buildAmazonSpApiAuthorizationUrlImplementationPreflight({
        ...baseInput,
        region: "INVALID",
        appMode: "draft",
      }),
    "invalid region",
  );

  assertThrows(
    () =>
      buildAmazonSpApiAuthorizationUrlImplementationPreflight({
        ...baseInput,
        appMode: "invalid",
      }),
    "invalid app mode",
  );

  return { draft, published, na, eu };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");

  assert(typeof buildAmazonSpApiAuthorizationUrlImplementationPreflight === "function", "pure URL builder export missing");
  assert(
    typeof buildAmazonSpApiAuthorizationUrlBuilderImplementationPreflightContract === "function",
    "contract builder export missing",
  );
  assert(
    typeof assertAmazonSpApiAuthorizationUrlBuilderImplementationPreflightContract === "function",
    "contract assert export missing",
  );

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-authorization-url-builder-implementation-preflight"] ===
      "node scripts/smoke-amazon-sp-api-authorization-url-builder-implementation-preflight.js",
    "Step123-I npm script missing or mismatched",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-frontend-connection-status-panel-contract"],
    "Step123-H regression smoke script missing",
  );

  const sourceDto = read(
    path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-authorization-url-builder-implementation-preflight.dto.ts"),
  );

  const requiredSourceMarkers = [
    "AMAZON_SP_API_AUTHORIZATION_URL_BUILDER_IMPLEMENTATION_PREFLIGHT_VERSION",
    "buildAmazonSpApiAuthorizationUrlImplementationPreflight",
    "buildAmazonSpApiAuthorizationUrlBuilderImplementationPreflightContract",
    "assertAmazonSpApiAuthorizationUrlBuilderImplementationPreflightContract",
    "assertAmazonSpApiFrontendConnectionStatusPanelContract",
    "sourceStep123H",
    "pure-function-authorization-url-builder-preflight-only",
    "pureFunctionOnly",
    "deterministicOutputRequired",
    "inputValidationRequired",
    "noNetworkRequired",
    "noDatabaseRequired",
    "noControllerRouteRequired",
    "noFrontendRequired",
    "https://sellercentral.amazon.co.jp/apps/authorize/consent",
    "https://sellercentral.amazon.com/apps/authorize/consent",
    "https://sellercentral-europe.amazon.com/apps/authorize/consent",
    "A1VC38T7YXB528",
    "draftModeAddsVersionBeta",
    "publishedModeOmitsVersionBeta",
    "redirectUriAllowlistRequired",
    "marketplaceRegionMismatchRejected",
    "controllerRoute",
    "frontendButton",
    "browserRedirect",
    "oauthStatePersistence",
    "tokenExchangeHttpCall",
    "readyForOauthStateSigningImplementationPreflight",
    "readyForAuthorizationRouteImplementation",
  ];

  for (const marker of requiredSourceMarkers) {
    assert(sourceDto.includes(marker), `Step123-I DTO missing marker: ${marker}`);
  }

  const wrongMergedContractBuilderName = [
    "buildAmazonSpApiAuthorizationUrl",
    "ImplementationPreflightContract",
  ].join("");

  assert(
    !sourceDto.includes(wrongMergedContractBuilderName),
    "DTO contains wrong merged contract builder name",
  );

  const contract = assertAmazonSpApiAuthorizationUrlBuilderImplementationPreflightContract(
    buildAmazonSpApiAuthorizationUrlBuilderImplementationPreflightContract(),
  );

  assert(contract.sourceStep123H.contractOnly === true, "Step123-I must depend on Step123-H contract-only boundary");
  assert(
    contract.sourceStep123H.summary.readyForAuthorizationUrlImplementationPreflight === true,
    "Step123-H must allow Step123-I authorization URL implementation preflight",
  );
  assert(contract.implementationPreflightOnly === true, "Step123-I must be implementation preflight only");
  assert(contract.pureFunctionAddedNow === true, "Step123-I must add only pure function implementation");
  assert(contract.backendRouteAddedNow === false, "Step123-I must not add backend route");
  assert(contract.frontendApiClientAddedNow === false, "Step123-I must not add frontend API client");
  assert(contract.browserRedirectAddedNow === false, "Step123-I must not redirect browser");
  assert(contract.statePersistenceNow === false, "Step123-I must not persist state");
  assert(contract.tokenPersistenceNow === false, "Step123-I must not persist token");
  assert(contract.realSpApiRequestNow === false, "Step123-I must not call real SP-API");
  assert(contract.writesDatabase === false, "Step123-I must not write database");
  assert(
    contract.summary.readyForOauthStateSigningImplementationPreflight === true,
    "Step123-I should allow Step123-J state signing preflight",
  );
  assert(
    contract.summary.readyForAuthorizationRouteImplementation === false,
    "Step123-I must not allow authorization route implementation",
  );

  const urls = assertUrlBuilderBehavior();
  const implementationGuard = assertNoStep123IImplementationLeak(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api authorization URL builder implementation preflight smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step123-I",
        contract: {
          version: contract.version,
          implementationPreflightOnly: contract.implementationPreflightOnly,
          pureFunctionAddedNow: contract.pureFunctionAddedNow,
          backendRouteAddedNow: contract.backendRouteAddedNow,
          frontendComponentAddedNow: contract.frontendComponentAddedNow,
          frontendApiClientAddedNow: contract.frontendApiClientAddedNow,
          buttonHandlerAddedNow: contract.buttonHandlerAddedNow,
          browserRedirectAddedNow: contract.browserRedirectAddedNow,
          statePersistenceNow: contract.statePersistenceNow,
          tokenPersistenceNow: contract.tokenPersistenceNow,
          schemaChangedNow: contract.schemaChangedNow,
          migrationAddedNow: contract.migrationAddedNow,
          realSpApiRequestNow: contract.realSpApiRequestNow,
          writesDatabase: contract.writesDatabase,
          preflightBoundary: contract.preflightBoundary,
          endpointContract: contract.endpointContract,
          queryParameterContract: contract.queryParameterContract,
          validationContract: contract.validationContract,
          forbiddenNow: contract.forbiddenNow,
          summary: contract.summary,
        },
        sampleUrls: {
          draftAuthorizationUrl: urls.draft.authorizationUrl,
          publishedAuthorizationUrl: urls.published.authorizationUrl,
          naAuthorizationUrl: urls.na.authorizationUrl,
          euAuthorizationUrl: urls.eu.authorizationUrl,
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
