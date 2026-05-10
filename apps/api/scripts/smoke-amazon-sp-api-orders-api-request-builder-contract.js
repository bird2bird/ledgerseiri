#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOrdersApiRequestBuilderContract,
  buildAmazonSpApiOrdersApiRequestBuilderContract,
} = require("../dist/src/imports/dto/amazon-sp-api-orders-api-request-builder-contract.dto");

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

function assertNoStep140BImplementationLeak(repoRoot) {
  const apiRoot = path.resolve(repoRoot, "apps/api");
  const apiSrcRoot = path.resolve(apiRoot, "src");

  const implementationFiles = listFiles(apiSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p))
    .filter((file) => !isDtoOrContractFile(file));

  const routeLeaks = [];
  const serviceLeaks = [];
  const requestBuilderLeaks = [];
  const httpLeaks = [];
  const sigV4Leaks = [];
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
    "AmazonSpApiOrdersRequestBuilderService",
    "ordersApiRequestBuilder",
  ];

  const requestBuilderFragments = [
    "buildAmazonSpApiOrdersApiRequest",
    "buildAmazonOrdersApiRequest",
    "buildListOrdersRequest",
    "buildGetOrderRequest",
    "buildGetOrderItemsRequest",
    "AmazonSpApiOrdersApiRequestBuilder",
    "AmazonOrdersApiRequestBuilder",
  ];

  const httpFragments = [
    "executeAmazonOrdersRequest",
    "AmazonOrdersApiHttpClient",
    "AmazonSpApiOrdersHttpClient",
    "fetch(",
    "axios.",
    "got(",
  ];

  const sigV4Fragments = [
    "AWS4-HMAC-SHA256",
    "Signature=",
    "Credential=",
    "SignedHeaders=",
    "x-amz-date",
    "x-amz-access-token",
    "buildAmazonOrdersApiSignedRequest",
    "createAmazonOrdersSignedRequest",
  ];

  const realOrdersFragments = [
    "getOrders(",
    "getOrder(",
    "getOrderItems(",
    "/orders/v0/orders",
    "orders/v0/orders",
    "GET_ORDERS_DATA",
    "ListOrders",
    "AmazonOrdersApiReadService",
    "readAmazonSpApiOrders",
    "fetchAmazonSpApiOrders",
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

    // Step140-B-FIX1:
    // Generic HTTP markers such as fetch( may exist in unrelated modules, for example auth/password reset.
    // This scanner must only block HTTP execution when the file is actually in Amazon SP-API / Orders context.
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

    if (serviceFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox) {
      serviceLeaks.push(rel);
    }

    if (requestBuilderFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox) {
      requestBuilderLeaks.push(rel);
    }

    if (
      hasAmazonOrdersContext &&
      httpFragments.some((fragment) => text.includes(fragment)) &&
      !allowedSandbox &&
      !allowedExistingAuthOrTokenInfrastructure
    ) {
      httpLeaks.push(rel);
    }

    if (
      hasAmazonOrdersContext &&
      sigV4Fragments.some((fragment) => text.includes(fragment)) &&
      !allowedSandbox &&
      !allowedExistingAuthOrTokenInfrastructure
    ) {
      sigV4Leaks.push(rel);
    }

    if (
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
  ];

  for (const marker of forbiddenSchemaMarkers) {
    if (schema.includes(marker)) schemaLeaks.push(marker);
  }

  assert(routeLeaks.length === 0, `no Step140-B Orders API controller route leak: ${JSON.stringify(routeLeaks)}`);
  assert(serviceLeaks.length === 0, `no Step140-B Orders API service implementation leak: ${JSON.stringify(serviceLeaks)}`);
  assert(requestBuilderLeaks.length === 0, `no Step140-B request builder implementation leak: ${JSON.stringify(requestBuilderLeaks)}`);
  assert(httpLeaks.length === 0, `no Step140-B HTTP implementation leak: ${JSON.stringify(httpLeaks)}`);
  assert(sigV4Leaks.length === 0, `no Step140-B SigV4 signing implementation leak: ${JSON.stringify(sigV4Leaks)}`);
  assert(realOrdersCallLeaks.length === 0, `no Step140-B getOrders/getOrder/getOrderItems leak: ${JSON.stringify(realOrdersCallLeaks)}`);
  assert(writeLeaks.length === 0, `no Step140-B ImportJob/StagingRow/Transaction/Inventory write leak: ${JSON.stringify(writeLeaks)}`);
  assert(schemaLeaks.length === 0, `no Step140-B Prisma schema model leak: ${JSON.stringify(schemaLeaks)}`);

  return {
    scannedApiImplementationFiles: implementationFiles.length,
    routeLeaks,
    serviceLeaks,
    requestBuilderLeaks,
    httpLeaks,
    sigV4Leaks,
    realOrdersCallLeaks,
    writeLeaks,
    schemaLeaks,
  };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");

  console.log("========== Step140-B Amazon SP-API Orders API request builder contract smoke ==========");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-api-request-builder-contract"] ===
      "node scripts/smoke-amazon-sp-api-orders-api-request-builder-contract.js",
    "apps/api package.json registers Step140-B smoke",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-api-read-boundary-contract"],
    "Step140-A read boundary regression smoke remains registered",
  );

  const dtoSource = read(
    path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-orders-api-request-builder-contract.dto.ts"),
  );

  const step140ADtoSource = read(
    path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-orders-api-read-boundary-contract.dto.ts"),
  );

  assert(
    step140ADtoSource.includes("readyForOrdersApiRequestBuilderContract: true"),
    "Step140-A source allows Step140-B request builder contract",
  );

  const smokeSource = read(path.resolve(apiRoot, "scripts/smoke-amazon-sp-api-orders-api-request-builder-contract.js"));
  const requiredSmokeMarkers = [
    "Step140-B-FIX1",
    "hasAmazonOrdersContext",
    "Generic HTTP markers such as fetch(",
  ];

  for (const marker of requiredSmokeMarkers) {
    assert(smokeSource.includes(marker), `Step140-B smoke scanner marker exists: ${marker}`);
  }

  const requiredDtoMarkers = [
    "AMAZON_SP_API_ORDERS_API_REQUEST_BUILDER_CONTRACT_VERSION",
    "buildAmazonSpApiOrdersApiRequestBuilderContract",
    "assertAmazonSpApiOrdersApiRequestBuilderContract",
    "assertAmazonSpApiOrdersApiReadBoundaryContract",
    "sourceStep140A",
    "design-amazon-sp-api-orders-api-request-builder-contract-only",
    "pureRequestShapeOnly",
    "noNetworkExecution",
    "noSigV4SigningExecution",
    "noTokenRefreshExecution",
    "noRestrictedDataTokenExecution",
    "ordersApiVersion: 'orders/v0'",
    "listOrdersPathTemplate: '/orders/v0/orders'",
    "getOrderPathTemplate: '/orders/v0/orders/{orderId}'",
    "getOrderItemsPathTemplate: '/orders/v0/orders/{orderId}/orderItems'",
    "japanMarketplaceIdSupported: 'A1VC38T7YXB528'",
    "farEastEndpointSupported: 'https://sellingpartnerapi-fe.amazon.com'",
    "marketplaceIdsRequired",
    "createdAfterRequired",
    "createdBeforeRequired",
    "queryStringMustBeDeterministic",
    "queryStringMustBeSortedByKey",
    "queryStringMustPercentEncodeValues",
    "authorizationHeaderForbiddenNow",
    "accessTokenValueForbiddenNow",
    "sigV4ExecutionDeferred",
    "awsCredentialsDeferred",
    "rawSigV4CanonicalRequestForbiddenInLogs",
    "readyForOrdersApiRequestBuilderImplementation",
    "readyForOrdersApiSignedRequestContract",
  ];

  for (const marker of requiredDtoMarkers) {
    assert(dtoSource.includes(marker), `Step140-B DTO marker exists: ${marker}`);
  }

  const forbiddenDtoMarkers = [
    "fetch(",
    "axios.",
    "got(",
    "getOrders({",
    "getOrder({",
    "getOrderItems({",
    "crypto.createHmac",
    "AWS.Signers",
    "SignatureV4",
    "prisma.importJob.create",
    "prisma.importStagingRow.create",
    "prisma.transaction.create",
    "prisma.inventoryMovement.create",
  ];

  for (const marker of forbiddenDtoMarkers) {
    assert(!dtoSource.includes(marker), `Step140-B DTO does not contain implementation marker: ${marker}`);
  }

  const contract = assertAmazonSpApiOrdersApiRequestBuilderContract(
    buildAmazonSpApiOrdersApiRequestBuilderContract(),
  );

  assert(contract.step === "Step140-B", "contract step is Step140-B");
  assert(contract.contractOnly === true, "contract remains contract-only");
  assert(contract.implementationNow === false, "implementationNow remains false");
  assert(contract.realOrdersApiHttpCallNow === false, "real Orders API HTTP call remains disabled");
  assert(contract.writesDatabase === false, "contract does not write database");
  assert(contract.endpointContract.japanMarketplaceIdSupported === "A1VC38T7YXB528", "Japan marketplace id is explicit");
  assert(contract.endpointContract.farEastEndpointSupported === "https://sellingpartnerapi-fe.amazon.com", "FE endpoint is explicit");
  assert(contract.forbiddenNow.fetchCall === true, "fetch call is forbidden now");
  assert(contract.forbiddenNow.sigV4SigningExecution === true, "SigV4 signing execution is forbidden now");
  assert(contract.forbiddenNow.getOrdersExecution === true, "getOrders execution is forbidden now");
  assert(contract.forbiddenNow.importJobWrite === true, "ImportJob write is forbidden now");
  assert(contract.forbiddenNow.importStagingRowWrite === true, "ImportStagingRow write is forbidden now");
  assert(contract.forbiddenNow.transactionWrite === true, "Transaction write is forbidden now");
  assert(contract.forbiddenNow.inventoryDeduction === true, "Inventory deduction is forbidden now");
  assert(contract.summary.readyForOrdersApiRequestBuilderImplementation === false, "request builder implementation is not allowed yet");
  assert(contract.summary.readyForOrdersApiSignedRequestContract === true, "next signed request contract step is allowed");
  assert(contract.summary.readyForOrdersApiHttpClientImplementation === false, "real HTTP implementation is not allowed yet");

  const implementationGuard = assertNoStep140BImplementationLeak(repoRoot);

  console.log("[SMOKE_OK] Step140-B Amazon SP-API Orders API request builder contract smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step140-B",
        contract: {
          version: contract.version,
          step: contract.step,
          contractOnly: contract.contractOnly,
          implementationNow: contract.implementationNow,
          controllerRouteAddedNow: contract.controllerRouteAddedNow,
          frontendRouteAddedNow: contract.frontendRouteAddedNow,
          serviceMethodAddedNow: contract.serviceMethodAddedNow,
          httpClientAddedNow: contract.httpClientAddedNow,
          sigV4SigningAddedNow: contract.sigV4SigningAddedNow,
          accessTokenRefreshNow: contract.accessTokenRefreshNow,
          restrictedDataTokenRequestNow: contract.restrictedDataTokenRequestNow,
          realOrdersApiHttpCallNow: contract.realOrdersApiHttpCallNow,
          importJobWriteNow: contract.importJobWriteNow,
          importStagingRowWriteNow: contract.importStagingRowWriteNow,
          transactionWriteNow: contract.transactionWriteNow,
          inventoryWriteNow: contract.inventoryWriteNow,
          schemaChangedNow: contract.schemaChangedNow,
          migrationAddedNow: contract.migrationAddedNow,
          writesDatabase: contract.writesDatabase,
          requestBuilderBoundary: contract.requestBuilderBoundary,
          endpointContract: contract.endpointContract,
          listOrdersQueryContract: contract.listOrdersQueryContract,
          getOrderRequestContract: contract.getOrderRequestContract,
          getOrderItemsRequestContract: contract.getOrderItemsRequestContract,
          headerContract: contract.headerContract,
          canonicalRequestContract: contract.canonicalRequestContract,
          sampleRequestContract: contract.sampleRequestContract,
          redactionContract: contract.redactionContract,
          isolationContract: contract.isolationContract,
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
