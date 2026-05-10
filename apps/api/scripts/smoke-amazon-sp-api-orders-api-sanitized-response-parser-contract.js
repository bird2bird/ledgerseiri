#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOrdersApiSanitizedResponseParserContract,
  buildAmazonSpApiOrdersApiSanitizedResponseParserContract,
} = require("../dist/src/imports/dto/amazon-sp-api-orders-api-sanitized-response-parser-contract.dto");

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

function assertNoStep140EImplementationLeak(repoRoot) {
  const apiRoot = path.resolve(repoRoot, "apps/api");
  const apiSrcRoot = path.resolve(apiRoot, "src");

  const implementationFiles = listFiles(apiSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p))
    .filter((file) => !isDtoOrContractFile(file));

  const routeLeaks = [];
  const serviceLeaks = [];
  const parserLeaks = [];
  const projectionLeaks = [];
  const httpClientLeaks = [];
  const networkLeaks = [];
  const realOrdersCallLeaks = [];
  const writeLeaks = [];
  const schemaLeaks = [];

  const routePatterns = [
    /@Get\s*\([^)]*(orders|order-items|amazon-sp-api\/orders|sp-api\/orders)/i,
    /@Post\s*\([^)]*(orders|order-items|amazon-sp-api\/orders|sp-api\/orders)/i,
  ];

  const serviceFragments = [
    "AmazonSpApiOrdersResponseParserService",
    "AmazonOrdersResponseParserService",
    "parseAmazonSpApiOrdersResponse",
    "parseAmazonOrdersResponse",
    "mapAmazonOrdersError",
    "projectAmazonSpApiNormalizedOrder",
    "projectAmazonSpApiNormalizedOrderItem",
  ];

  const parserFragments = [
    "parseListOrdersResponse",
    "parseOrderItemsResponse",
    "parseGetOrderResponse",
    "sanitizeAmazonOrdersPayload",
    "sanitizeAmazonOrderItemsPayload",
    "AmazonSpApiOrdersSanitizedResponseParser",
    "AmazonOrdersSanitizedResponseParser",
  ];

  const projectionFragments = [
    "normalizedAmazonOrderId",
    "normalizedOrderItemId",
    "normalizedSellerSku",
    "dedupeKeyFromAmazonOrderId",
    "sourceTypeAmazonSpApi",
  ];

  const httpClientFragments = [
    "AmazonSpApiOrdersHttpClient",
    "AmazonOrdersApiHttpClient",
    "executeAmazonOrdersRequest",
    "sendAmazonOrdersRequest",
  ];

  const networkFragments = [
    "fetch(",
    "axios.",
    "got(",
    "https.request(",
    "http.request(",
    "undici.request",
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

    if (hasAmazonOrdersContext && parserFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox) {
      parserLeaks.push(rel);
    }

    if (hasAmazonOrdersContext && projectionFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox) {
      projectionLeaks.push(rel);
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
    "model AmazonOrdersResponseParserLog",
  ];

  for (const marker of forbiddenSchemaMarkers) {
    if (schema.includes(marker)) schemaLeaks.push(marker);
  }

  assert(routeLeaks.length === 0, `no Step140-E Orders API controller route leak: ${JSON.stringify(routeLeaks)}`);
  assert(serviceLeaks.length === 0, `no Step140-E parser service implementation leak: ${JSON.stringify(serviceLeaks)}`);
  assert(parserLeaks.length === 0, `no Step140-E parser implementation leak: ${JSON.stringify(parserLeaks)}`);
  assert(projectionLeaks.length === 0, `no Step140-E normalized projection implementation leak: ${JSON.stringify(projectionLeaks)}`);
  assert(httpClientLeaks.length === 0, `no Step140-E HTTP client implementation leak: ${JSON.stringify(httpClientLeaks)}`);
  assert(networkLeaks.length === 0, `no Step140-E network execution leak: ${JSON.stringify(networkLeaks)}`);
  assert(realOrdersCallLeaks.length === 0, `no Step140-E getOrders/getOrder/getOrderItems leak: ${JSON.stringify(realOrdersCallLeaks)}`);
  assert(writeLeaks.length === 0, `no Step140-E ImportJob/StagingRow/Transaction/Inventory write leak: ${JSON.stringify(writeLeaks)}`);
  assert(schemaLeaks.length === 0, `no Step140-E Prisma schema model leak: ${JSON.stringify(schemaLeaks)}`);

  return {
    scannedApiImplementationFiles: implementationFiles.length,
    routeLeaks,
    serviceLeaks,
    parserLeaks,
    projectionLeaks,
    httpClientLeaks,
    networkLeaks,
    realOrdersCallLeaks,
    writeLeaks,
    schemaLeaks,
  };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");

  console.log("========== Step140-E Amazon SP-API Orders API sanitized response parser contract smoke ==========");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-api-sanitized-response-parser-contract"] ===
      "node scripts/smoke-amazon-sp-api-orders-api-sanitized-response-parser-contract.js",
    "apps/api package.json registers Step140-E smoke",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-api-http-client-boundary-contract"],
    "Step140-D HTTP client boundary regression smoke remains registered",
  );

  const step140DDtoSource = read(
    path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-orders-api-http-client-boundary-contract.dto.ts"),
  );

  assert(
    step140DDtoSource.includes("readyForOrdersApiSanitizedResponseParserContract: true"),
    "Step140-D source allows Step140-E sanitized response parser contract",
  );

  const dtoSource = read(
    path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-orders-api-sanitized-response-parser-contract.dto.ts"),
  );

  const smokeSource = read(
    path.resolve(apiRoot, "scripts/smoke-amazon-sp-api-orders-api-sanitized-response-parser-contract.js"),
  );

  const requiredSmokeMarkers = [
    "Step140-E",
    "assertNoStep140EImplementationLeak",
    "no Step140-E parser implementation leak",
    "no Step140-E normalized projection implementation leak",
    "no Step140-E ImportJob/StagingRow/Transaction/Inventory write leak",
  ];

  for (const marker of requiredSmokeMarkers) {
    assert(smokeSource.includes(marker), `Step140-E smoke scanner marker exists: ${marker}`);
  }

  const requiredDtoMarkers = [
    "AMAZON_SP_API_ORDERS_API_SANITIZED_RESPONSE_PARSER_CONTRACT_VERSION",
    "buildAmazonSpApiOrdersApiSanitizedResponseParserContract",
    "assertAmazonSpApiOrdersApiSanitizedResponseParserContract",
    "assertAmazonSpApiOrdersApiHttpClientBoundaryContract",
    "sourceStep140D",
    "design-amazon-sp-api-orders-api-sanitized-response-parser-contract-only",
    "parserShapeDesignOnly",
    "errorMapperDesignOnly",
    "normalizedProjectionDesignOnly",
    "paginationDesignOnly",
    "ordersArrayRequired",
    "nextTokenMaskedInLogs",
    "amazonOrderIdRequired",
    "purchaseDateRequired",
    "orderItemsArrayRequired",
    "sellerSkuRequired",
    "promotionDiscountTaxAmountNullable",
    "normalizedAmazonOrderIdRequired",
    "normalizedOrderItemIdRequired",
    "dedupeKeyFromAmazonOrderIdRequired",
    "skuAliasResolutionDeferred",
    "inventoryDeductionDeferred",
    "amazonErrorCodeCapturedSanitized",
    "unauthorizedMappedToReconnectRequired",
    "forbiddenMappedToPermissionRequired",
    "rawAmazonErrorPayloadForbidden",
    "rawBuyerEmailForbidden",
    "requiresExplicitPersistenceContractNext",
    "requiresNormalizedFixtureBeforePersistence",
    "requiresIdempotencyContractBeforeCommit",
    "requiresSkuAliasContractBeforeInventory",
    "readyForOrdersApiNormalizedFixtureContract",
    "readyForOrdersApiPersistenceReadinessContract",
  ];

  for (const marker of requiredDtoMarkers) {
    assert(dtoSource.includes(marker), `Step140-E DTO marker exists: ${marker}`);
  }

  const forbiddenDtoMarkers = [
    "JSON.parse(",
    "fetch(",
    "axios.",
    "got(",
    "https.request(",
    "http.request(",
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
    assert(!dtoSource.includes(marker), `Step140-E DTO does not contain implementation marker: ${marker}`);
  }

  const contract = assertAmazonSpApiOrdersApiSanitizedResponseParserContract(
    buildAmazonSpApiOrdersApiSanitizedResponseParserContract(),
  );

  assert(contract.step === "Step140-E", "contract step is Step140-E");
  assert(contract.contractOnly === true, "contract remains contract-only");
  assert(contract.implementationNow === false, "implementationNow remains false");
  assert(contract.responseParserImplementationNow === false, "response parser implementation remains disabled");
  assert(contract.normalizedProjectionImplementationNow === false, "normalized projection implementation remains disabled");
  assert(contract.errorMapperImplementationNow === false, "error mapper implementation remains disabled");
  assert(contract.realAmazonOrdersApiCallNow === false, "real Amazon Orders API call remains disabled");
  assert(contract.writesDatabase === false, "contract does not write database");
  assert(contract.sampleParserContract.expectedRawPayloadForbidden === true, "sample confirms raw payload forbidden");
  assert(contract.importReadinessGateContract.readyForImportJobPersistence === false, "ImportJob persistence remains disabled");
  assert(contract.importReadinessGateContract.requiresExplicitPersistenceContractNext === true, "explicit persistence contract is required next");
  assert(contract.forbiddenNow.responseParserImplementation === true, "response parser implementation is forbidden now");
  assert(contract.forbiddenNow.normalizedProjectionImplementation === true, "normalized projection implementation is forbidden now");
  assert(contract.forbiddenNow.importJobWrite === true, "ImportJob write is forbidden now");
  assert(contract.forbiddenNow.importStagingRowWrite === true, "ImportStagingRow write is forbidden now");
  assert(contract.forbiddenNow.transactionWrite === true, "Transaction write is forbidden now");
  assert(contract.forbiddenNow.inventoryDeduction === true, "Inventory deduction is forbidden now");
  assert(contract.summary.readyForOrdersApiSanitizedResponseParserImplementation === false, "parser implementation is not allowed yet");
  assert(contract.summary.readyForOrdersApiNormalizedFixtureContract === true, "normalized fixture contract is allowed next");
  assert(contract.summary.readyForOrdersApiPersistenceReadinessContract === true, "persistence readiness contract is allowed next");
  assert(contract.summary.readyForOrdersApiRuntimeSmoke === false, "runtime smoke is not allowed yet");

  const implementationGuard = assertNoStep140EImplementationLeak(repoRoot);

  console.log("[SMOKE_OK] Step140-E Amazon SP-API Orders API sanitized response parser contract smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step140-E",
        contract: {
          version: contract.version,
          step: contract.step,
          contractOnly: contract.contractOnly,
          implementationNow: contract.implementationNow,
          responseParserImplementationNow: contract.responseParserImplementationNow,
          normalizedProjectionImplementationNow: contract.normalizedProjectionImplementationNow,
          errorMapperImplementationNow: contract.errorMapperImplementationNow,
          httpClientImplementationNow: contract.httpClientImplementationNow,
          realNetworkExecutionNow: contract.realNetworkExecutionNow,
          realAmazonOrdersApiCallNow: contract.realAmazonOrdersApiCallNow,
          importJobWriteNow: contract.importJobWriteNow,
          importStagingRowWriteNow: contract.importStagingRowWriteNow,
          transactionWriteNow: contract.transactionWriteNow,
          inventoryWriteNow: contract.inventoryWriteNow,
          writesDatabase: contract.writesDatabase,
          parserBoundary: contract.parserBoundary,
          listOrdersResponseContract: contract.listOrdersResponseContract,
          orderItemsResponseContract: contract.orderItemsResponseContract,
          singleOrderResponseContract: contract.singleOrderResponseContract,
          normalizedOrderProjectionContract: contract.normalizedOrderProjectionContract,
          normalizedOrderItemProjectionContract: contract.normalizedOrderItemProjectionContract,
          errorMappingContract: contract.errorMappingContract,
          redactionContract: contract.redactionContract,
          importReadinessGateContract: contract.importReadinessGateContract,
          sampleParserContract: contract.sampleParserContract,
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
