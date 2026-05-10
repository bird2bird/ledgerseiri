#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOrdersApiHttpClientBoundaryContract,
  buildAmazonSpApiOrdersApiHttpClientBoundaryContract,
} = require("../dist/src/imports/dto/amazon-sp-api-orders-api-http-client-boundary-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`[OK] ${message}`);
}

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`);
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
        name === "coverage" ||
        name === ".git"
      ) {
        continue;
      }
      listFiles(p, predicate, acc);
      continue;
    }

    if (predicate(p)) acc.push(p);
  }

  return acc;
}

function isDtoOrContractFile(file) {
  return file.includes(`${path.sep}src${path.sep}imports${path.sep}dto${path.sep}`) || file.endsWith(".dto.ts");
}

function isAllowedExistingSandboxFile(file, text) {
  return (
    text.includes("AmazonSpApiSandbox") ||
    text.includes("amazon-sp-api-sandbox") ||
    text.includes("AMAZON_ORDER_SP_API") ||
    file.includes(`${path.sep}scripts${path.sep}smoke-amazon-sp-api-sandbox`)
  );
}

function isAllowedExistingAuthOrTokenInfrastructureFile(file, text) {
  const normalized = file.replaceAll(path.sep, "/");

  if (
    normalized.endsWith("apps/api/src/imports/amazon-sp-api-token-exchange.service.ts") ||
    normalized.endsWith("apps/api/src/imports/amazon-sp-api-token-persistence.service.ts") ||
    normalized.endsWith("apps/api/src/imports/amazon-sp-api-token-persistence.repository.ts") ||
    normalized.endsWith("apps/api/src/imports/amazon-sp-api-oauth-state.service.ts") ||
    normalized.endsWith("apps/api/src/imports/amazon-sp-api-lwa-config.service.ts") ||
    normalized.endsWith("apps/api/src/imports/amazon-sp-api-lwa-activation-gate.service.ts")
  ) {
    return true;
  }

  return (
    text.includes("Step139") ||
    text.includes("Step138") ||
    text.includes("Step137") ||
    text.includes("Step136") ||
    text.includes("Step135") ||
    text.includes("Step134") ||
    text.includes("Step133") ||
    text.includes("Step132") ||
    text.includes("Step131") ||
    text.includes("Step130") ||
    text.includes("Step129") ||
    text.includes("Step128") ||
    text.includes("Step127")
  ) && (
    text.includes("token-exchange") ||
    text.includes("token persistence") ||
    text.includes("OAuth") ||
    text.includes("LWA") ||
    text.includes("LoginWithAmazon")
  );
}

function assertNoStep140DImplementationLeak(repoRoot) {
  const apiRoot = path.resolve(repoRoot, "apps/api");
  const apiSrcRoot = path.resolve(apiRoot, "src");

  const implementationFiles = listFiles(apiSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p))
    .filter((file) => !isDtoOrContractFile(file));

  const routeLeaks = [];
  const serviceLeaks = [];
  const httpClientLeaks = [];
  const networkLeaks = [];
  const signedRequestLeaks = [];
  const cryptoLeaks = [];
  const realOrdersCallLeaks = [];
  const writeLeaks = [];
  const schemaLeaks = [];

  const routePatterns = [
    /@Get\s*\([^)]*(orders|order-items|amazon-sp-api\/orders|sp-api\/orders)/i,
    /@Post\s*\([^)]*(orders|order-items|amazon-sp-api\/orders|sp-api\/orders)/i,
  ];

  const serviceFragments = [
    "getAmazonSpApiOrders",
    "readAmazonSpApiOrders",
    "fetchAmazonSpApiOrders",
    "AmazonSpApiOrdersReadService",
    "AmazonSpApiOrdersHttpClientService",
    "ordersApiHttpClient",
  ];

  const httpClientFragments = [
    "AmazonSpApiOrdersHttpClient",
    "AmazonOrdersApiHttpClient",
    "executeAmazonOrdersRequest",
    "sendAmazonOrdersRequest",
    "performAmazonOrdersHttpRequest",
  ];

  const networkFragments = [
    "fetch(",
    "axios.",
    "got(",
    "https.request(",
    "http.request(",
    "undici.request",
  ];

  const signedRequestFragments = [
    "buildAmazonSpApiOrdersSignedRequest",
    "buildAmazonOrdersSignedRequest",
    "createAmazonOrdersSignedRequest",
    "AmazonSpApiOrdersSignedRequestBuilder",
    "AmazonOrdersSignedRequestBuilder",
  ];

  const cryptoFragments = [
    "crypto.createHmac",
    "crypto.createHash",
    "createHmac(",
    "createHash(",
    "SignatureV4",
    "AWS4-HMAC-SHA256",
    "deriveSigningKey",
  ];

  const realOrdersFragments = [
    "getOrders(",
    "getOrder(",
    "getOrderItems(",
    "/orders/v0/orders",
    "orders/v0/orders",
    "GET_ORDERS_DATA",
    "ListOrders",
  ];

  const writeFragments = [
    "importJob.create",
    "importJob.update",
    "importStagingRow.create",
    "importStagingRow.createMany",
    "transaction.create",
    "transaction.createMany",
    "inventoryMovement.create",
    "inventoryMovement.createMany",
    "inventoryBalance.update",
    "inventoryBalance.upsert",
    "deductInventory",
    "commitAmazonOrder",
    "commitSales",
    "bankReconciliation",
    "settlementReconciliation",
  ];

  for (const file of implementationFiles) {
    const text = read(file);
    const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");
    const allowedSandbox = isAllowedExistingSandboxFile(file, text);
    const allowedExistingAuthOrTokenInfrastructure = isAllowedExistingAuthOrTokenInfrastructureFile(file, text);

    // Step140-D:
    // Generic HTTP strings may exist in unrelated modules. Only block when file has Amazon Orders context.
    const hasAmazonOrdersContext =
      text.includes("amazon-sp-api") ||
      text.includes("AmazonSpApi") ||
      text.includes("sellingpartnerapi") ||
      text.includes("selling-partner-api") ||
      text.includes("orders/v0/orders") ||
      text.includes("/orders/v0/orders") ||
      text.includes("AmazonOrders") ||
      text.includes("AmazonSpApiOrders") ||
      text.includes("getOrders(") ||
      text.includes("getOrder(") ||
      text.includes("getOrderItems(");

    for (const pattern of routePatterns) {
      if (pattern.test(text) && !allowedSandbox) routeLeaks.push(rel);
    }

    if (hasAmazonOrdersContext && serviceFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox) {
      serviceLeaks.push(rel);
    }

    if (hasAmazonOrdersContext && httpClientFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox) {
      httpClientLeaks.push(rel);
    }

    if (
      hasAmazonOrdersContext &&
      networkFragments.some((fragment) => text.includes(fragment)) &&
      !allowedSandbox &&
      !allowedExistingAuthOrTokenInfrastructure
    ) {
      networkLeaks.push(rel);
    }

    if (
      hasAmazonOrdersContext &&
      signedRequestFragments.some((fragment) => text.includes(fragment)) &&
      !allowedSandbox &&
      !allowedExistingAuthOrTokenInfrastructure
    ) {
      signedRequestLeaks.push(rel);
    }

    if (
      hasAmazonOrdersContext &&
      cryptoFragments.some((fragment) => text.includes(fragment)) &&
      !allowedSandbox &&
      !allowedExistingAuthOrTokenInfrastructure
    ) {
      cryptoLeaks.push(rel);
    }

    if (
      hasAmazonOrdersContext &&
      realOrdersFragments.some((fragment) => text.includes(fragment)) &&
      !allowedSandbox &&
      !allowedExistingAuthOrTokenInfrastructure
    ) {
      realOrdersCallLeaks.push(rel);
    }

    const hasRealAmazonContext =
      text.includes("amazon-sp-api") ||
      text.includes("AmazonSpApi") ||
      text.includes("sellingpartnerapi") ||
      text.includes("selling-partner-api");

    if (hasRealAmazonContext && writeFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox) {
      writeLeaks.push(rel);
    }
  }

  const schema = read(path.resolve(apiRoot, "prisma/schema.prisma"));
  const forbiddenSchemaMarkers = [
    "model AmazonSpApiOrder",
    "model AmazonSpApiOrderItem",
    "model AmazonOrderReadCursor",
    "model AmazonOrdersApiSyncState",
    "model AmazonOrdersApiRequest",
    "model AmazonOrdersSignedRequest",
    "model AmazonOrdersHttpClientLog",
  ];

  for (const marker of forbiddenSchemaMarkers) {
    if (schema.includes(marker)) schemaLeaks.push(marker);
  }

  assert(routeLeaks.length === 0, `no Step140-D Orders API controller route leak: ${JSON.stringify(routeLeaks)}`);
  assert(serviceLeaks.length === 0, `no Step140-D Orders API service implementation leak: ${JSON.stringify(serviceLeaks)}`);
  assert(httpClientLeaks.length === 0, `no Step140-D HTTP client implementation leak: ${JSON.stringify(httpClientLeaks)}`);
  assert(networkLeaks.length === 0, `no Step140-D network execution leak: ${JSON.stringify(networkLeaks)}`);
  assert(signedRequestLeaks.length === 0, `no Step140-D signed request implementation leak: ${JSON.stringify(signedRequestLeaks)}`);
  assert(cryptoLeaks.length === 0, `no Step140-D crypto/SigV4 execution leak: ${JSON.stringify(cryptoLeaks)}`);
  assert(realOrdersCallLeaks.length === 0, `no Step140-D getOrders/getOrder/getOrderItems leak: ${JSON.stringify(realOrdersCallLeaks)}`);
  assert(writeLeaks.length === 0, `no Step140-D ImportJob/StagingRow/Transaction/Inventory write leak: ${JSON.stringify(writeLeaks)}`);
  assert(schemaLeaks.length === 0, `no Step140-D Prisma schema model leak: ${JSON.stringify(schemaLeaks)}`);

  return {
    scannedApiImplementationFiles: implementationFiles.length,
    routeLeaks,
    serviceLeaks,
    httpClientLeaks,
    networkLeaks,
    signedRequestLeaks,
    cryptoLeaks,
    realOrdersCallLeaks,
    writeLeaks,
    schemaLeaks,
  };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");

  console.log("========== Step140-D Amazon SP-API Orders API HTTP client boundary contract smoke ==========");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-api-http-client-boundary-contract"] ===
      "node scripts/smoke-amazon-sp-api-orders-api-http-client-boundary-contract.js",
    "apps/api package.json registers Step140-D smoke",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-api-signed-request-boundary-contract"],
    "Step140-C signed request boundary regression smoke remains registered",
  );

  const step140CDtoSource = read(
    path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-orders-api-signed-request-boundary-contract.dto.ts"),
  );

  assert(
    step140CDtoSource.includes("readyForOrdersApiHttpClientContract: true"),
    "Step140-C source allows Step140-D HTTP client boundary contract",
  );

  const dtoSource = read(
    path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-orders-api-http-client-boundary-contract.dto.ts"),
  );

  const smokeSource = read(
    path.resolve(apiRoot, "scripts/smoke-amazon-sp-api-orders-api-http-client-boundary-contract.js"),
  );

  const requiredSmokeMarkers = [
    "Step140-D",
    "hasAmazonOrdersContext",
    "Generic HTTP strings may exist in unrelated modules",
    "no Step140-D HTTP client implementation leak",
    "no Step140-D network execution leak",
  ];

  for (const marker of requiredSmokeMarkers) {
    assert(smokeSource.includes(marker), `Step140-D smoke scanner marker exists: ${marker}`);
  }

  const requiredDtoMarkers = [
    "AMAZON_SP_API_ORDERS_API_HTTP_CLIENT_BOUNDARY_CONTRACT_VERSION",
    "buildAmazonSpApiOrdersApiHttpClientBoundaryContract",
    "assertAmazonSpApiOrdersApiHttpClientBoundaryContract",
    "assertAmazonSpApiOrdersApiSignedRequestBoundaryContract",
    "sourceStep140C",
    "design-amazon-sp-api-orders-api-http-client-boundary-contract-only",
    "httpClientShapeDesignOnly",
    "noNetworkExecution",
    "noFetchExecution",
    "noAxiosExecution",
    "noGotExecution",
    "defaultTimeoutMs: 30000",
    "defaultMaxAttempts: 3",
    "retryOn429Required",
    "retryOn500Required",
    "retryOn503Required",
    "xAmznRateLimitLimitHeaderCapturedSanitized",
    "amazonRequestIdHeaderCaptured",
    "sanitizedErrorCodeRequired",
    "authorizationHeaderMustBeMasked",
    "xAmzAccessTokenMustBeMasked",
    "sampleEndpoint: 'https://sellingpartnerapi-fe.amazon.com'",
    "samplePath: '/orders/v0/orders'",
    "expectedNetworkExecutionNow: false",
    "readyForOrdersApiSanitizedResponseParserContract",
  ];

  for (const marker of requiredDtoMarkers) {
    assert(dtoSource.includes(marker), `Step140-D DTO marker exists: ${marker}`);
  }

  const forbiddenDtoMarkers = [
    "fetch(",
    "axios.",
    "got(",
    "https.request(",
    "http.request(",
    "undici.request",
    "crypto.createHmac",
    "crypto.createHash",
    "getOrders({",
    "getOrder({",
    "getOrderItems({",
    "prisma.importJob.create",
    "prisma.importStagingRow.create",
    "prisma.transaction.create",
    "prisma.inventoryMovement.create",
  ];

  for (const marker of forbiddenDtoMarkers) {
    assert(!dtoSource.includes(marker), `Step140-D DTO does not contain implementation marker: ${marker}`);
  }

  const contract = assertAmazonSpApiOrdersApiHttpClientBoundaryContract(
    buildAmazonSpApiOrdersApiHttpClientBoundaryContract(),
  );

  assert(contract.step === "Step140-D", "contract step is Step140-D");
  assert(contract.contractOnly === true, "contract remains contract-only");
  assert(contract.implementationNow === false, "implementationNow remains false");
  assert(contract.httpClientImplementationNow === false, "HTTP client implementation remains disabled");
  assert(contract.realNetworkExecutionNow === false, "real network execution remains disabled");
  assert(contract.realAmazonOrdersApiCallNow === false, "real Amazon Orders API call remains disabled");
  assert(contract.writesDatabase === false, "contract does not write database");
  assert(contract.transportContract.defaultTimeoutMs === 30000, "default timeout is explicit");
  assert(contract.retryContract.defaultMaxAttempts === 3, "default max attempts is explicit");
  assert(contract.sampleHttpClientContract.expectedNetworkExecutionNow === false, "sample confirms no network execution now");
  assert(contract.forbiddenNow.fetchCall === true, "fetch call is forbidden now");
  assert(contract.forbiddenNow.axiosCall === true, "axios call is forbidden now");
  assert(contract.forbiddenNow.gotCall === true, "got call is forbidden now");
  assert(contract.forbiddenNow.realAmazonOrdersHttpCall === true, "real Amazon Orders HTTP call is forbidden now");
  assert(contract.forbiddenNow.getOrdersExecution === true, "getOrders execution is forbidden now");
  assert(contract.forbiddenNow.importJobWrite === true, "ImportJob write is forbidden now");
  assert(contract.forbiddenNow.importStagingRowWrite === true, "ImportStagingRow write is forbidden now");
  assert(contract.forbiddenNow.transactionWrite === true, "Transaction write is forbidden now");
  assert(contract.forbiddenNow.inventoryDeduction === true, "Inventory deduction is forbidden now");
  assert(contract.summary.readyForOrdersApiHttpClientImplementation === false, "HTTP client implementation is not allowed yet");
  assert(contract.summary.readyForOrdersApiSanitizedResponseParserContract === true, "next sanitized response parser contract step is allowed");
  assert(contract.summary.readyForOrdersApiRuntimeSmoke === false, "runtime smoke is not allowed yet");

  const implementationGuard = assertNoStep140DImplementationLeak(repoRoot);

  console.log("[SMOKE_OK] Step140-D Amazon SP-API Orders API HTTP client boundary contract smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step140-D",
        contract: {
          version: contract.version,
          step: contract.step,
          contractOnly: contract.contractOnly,
          implementationNow: contract.implementationNow,
          controllerRouteAddedNow: contract.controllerRouteAddedNow,
          frontendRouteAddedNow: contract.frontendRouteAddedNow,
          serviceMethodAddedNow: contract.serviceMethodAddedNow,
          requestBuilderImplementationNow: contract.requestBuilderImplementationNow,
          signedRequestImplementationNow: contract.signedRequestImplementationNow,
          httpClientImplementationNow: contract.httpClientImplementationNow,
          realNetworkExecutionNow: contract.realNetworkExecutionNow,
          realAmazonOrdersApiCallNow: contract.realAmazonOrdersApiCallNow,
          realCryptoExecutionNow: contract.realCryptoExecutionNow,
          awsCredentialReadNow: contract.awsCredentialReadNow,
          accessTokenRefreshNow: contract.accessTokenRefreshNow,
          restrictedDataTokenRequestNow: contract.restrictedDataTokenRequestNow,
          importJobWriteNow: contract.importJobWriteNow,
          importStagingRowWriteNow: contract.importStagingRowWriteNow,
          transactionWriteNow: contract.transactionWriteNow,
          inventoryWriteNow: contract.inventoryWriteNow,
          schemaChangedNow: contract.schemaChangedNow,
          migrationAddedNow: contract.migrationAddedNow,
          writesDatabase: contract.writesDatabase,
          httpClientBoundary: contract.httpClientBoundary,
          transportContract: contract.transportContract,
          retryContract: contract.retryContract,
          throttlingContract: contract.throttlingContract,
          responseContract: contract.responseContract,
          errorContract: contract.errorContract,
          securityContract: contract.securityContract,
          sampleHttpClientContract: contract.sampleHttpClientContract,
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
