#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOrdersNormalizedFixturePersistenceReadinessContract,
  buildAmazonSpApiOrdersNormalizedFixturePersistenceReadinessContract,
} = require("../dist/src/imports/dto/amazon-sp-api-orders-normalized-fixture-persistence-readiness-contract.dto");

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

function assertNoStep140FImplementationLeak(repoRoot) {
  const apiRoot = path.resolve(repoRoot, "apps/api");
  const apiSrcRoot = path.resolve(apiRoot, "src");

  const implementationFiles = listFiles(apiSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p))
    .filter((file) => !isDtoOrContractFile(file));

  const routeLeaks = [];
  const serviceLeaks = [];
  const fixtureLeaks = [];
  const persistenceLeaks = [];
  const transactionLeaks = [];
  const inventoryLeaks = [];
  const reconciliationLeaks = [];
  const networkLeaks = [];
  const schemaLeaks = [];

  const routePatterns = [
    /@Get\s*\([^)]*(orders|order-items|amazon-sp-api\/orders|sp-api\/orders)/i,
    /@Post\s*\([^)]*(orders|order-items|amazon-sp-api\/orders|sp-api\/orders)/i,
  ];

  const serviceFragments = [
    "AmazonSpApiOrdersNormalizedFixtureService",
    "AmazonOrdersNormalizedFixtureService",
    "AmazonSpApiOrdersPersistenceReadinessService",
    "buildAmazonSpApiOrdersNormalizedFixture",
    "buildAmazonOrdersPersistenceReadiness",
    "prepareAmazonSpApiOrdersImportJob",
    "prepareAmazonSpApiOrdersStagingRows",
    "commitAmazonSpApiOrdersTransactions",
    "deductAmazonSpApiOrdersInventory",
  ];

  const fixtureFragments = [
    "normalizedAmazonOrderId",
    "normalizedOrderItemId",
    "normalizedSellerSku",
    "normalizedQuantityOrdered",
    "dedupeKeyFromAmazonOrderId",
    "sourceTypeAmazonSpApi",
  ];

  const persistenceFragments = [
    "importJob.create",
    "importJob.update",
    "importStagingRow.create",
    "importStagingRow.createMany",
    "normalizedPayloadJson",
    "matchStatus",
    "skuResolutionStatus",
    "inventoryResolutionStatus",
  ];

  const transactionFragments = [
    "transaction.create",
    "transaction.createMany",
    "TransactionType.INCOME",
    "direction: 'credit'",
    "commitAmazonOrder",
    "commitSales",
  ];

  const inventoryFragments = [
    "inventoryMovement.create",
    "inventoryMovement.createMany",
    "inventoryBalance.update",
    "inventoryBalance.upsert",
    "deductInventory",
    "inventoryDeduction",
    "unresolvedSkuAudit",
  ];

  const reconciliationFragments = [
    "settlementReconciliation",
    "bankReconciliation",
    "amazonSettlementId",
    "bankTransactionLink",
    "payoutMatching",
  ];

  const networkFragments = [
    "fetch(",
    "axios.",
    "got(",
    "https.request(",
    "http.request(",
    "undici.request",
    "getOrders(",
    "getOrder(",
    "getOrderItems(",
    "/orders/v0/orders",
    "orders/v0/orders",
  ];

  for (const file of implementationFiles) {
    const text = read(file);
    const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");
    const allowedSandbox = isAllowedExistingSandboxFile(file, text);

    const hasAmazonOrdersContext =
      text.includes("amazon-sp-api") ||
      text.includes("AmazonSpApi") ||
      text.includes("AmazonOrders") ||
      text.includes("AmazonSpApiOrders") ||
      text.includes("sellingpartnerapi") ||
      text.includes("selling-partner-api") ||
      text.includes("orders/v0/orders") ||
      text.includes("/orders/v0/orders") ||
      text.includes("ORDER-STEP140") ||
      text.includes("SKU-STEP140");

    for (const pattern of routePatterns) {
      if (pattern.test(text) && !allowedSandbox) routeLeaks.push(rel);
    }

    if (hasAmazonOrdersContext && serviceFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox) {
      serviceLeaks.push(rel);
    }

    if (hasAmazonOrdersContext && fixtureFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox) {
      fixtureLeaks.push(rel);
    }

    if (hasAmazonOrdersContext && persistenceFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox) {
      persistenceLeaks.push(rel);
    }

    if (hasAmazonOrdersContext && transactionFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox) {
      transactionLeaks.push(rel);
    }

    if (hasAmazonOrdersContext && inventoryFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox) {
      inventoryLeaks.push(rel);
    }

    if (hasAmazonOrdersContext && reconciliationFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox) {
      reconciliationLeaks.push(rel);
    }

    if (hasAmazonOrdersContext && networkFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox) {
      networkLeaks.push(rel);
    }
  }

  const schema = read(path.resolve(apiRoot, "prisma/schema.prisma"));
  const forbiddenSchemaMarkers = [
    "model AmazonSpApiOrder",
    "model AmazonSpApiOrderItem",
    "model AmazonOrderReadCursor",
    "model AmazonOrdersApiSyncState",
    "model AmazonOrdersNormalizedFixture",
    "model AmazonOrdersPersistenceReadiness",
  ];

  for (const marker of forbiddenSchemaMarkers) {
    if (schema.includes(marker)) schemaLeaks.push(marker);
  }

  assert(routeLeaks.length === 0, `no Step140-F Orders API controller route leak: ${JSON.stringify(routeLeaks)}`);
  assert(serviceLeaks.length === 0, `no Step140-F aggregate service implementation leak: ${JSON.stringify(serviceLeaks)}`);
  assert(fixtureLeaks.length === 0, `no Step140-F normalized fixture implementation leak: ${JSON.stringify(fixtureLeaks)}`);
  assert(persistenceLeaks.length === 0, `no Step140-F ImportJob/StagingRow persistence leak: ${JSON.stringify(persistenceLeaks)}`);
  assert(transactionLeaks.length === 0, `no Step140-F transaction commit leak: ${JSON.stringify(transactionLeaks)}`);
  assert(inventoryLeaks.length === 0, `no Step140-F inventory deduction leak: ${JSON.stringify(inventoryLeaks)}`);
  assert(reconciliationLeaks.length === 0, `no Step140-F reconciliation leak: ${JSON.stringify(reconciliationLeaks)}`);
  assert(networkLeaks.length === 0, `no Step140-F Amazon Orders network leak: ${JSON.stringify(networkLeaks)}`);
  assert(schemaLeaks.length === 0, `no Step140-F Prisma schema model leak: ${JSON.stringify(schemaLeaks)}`);

  return {
    scannedApiImplementationFiles: implementationFiles.length,
    routeLeaks,
    serviceLeaks,
    fixtureLeaks,
    persistenceLeaks,
    transactionLeaks,
    inventoryLeaks,
    reconciliationLeaks,
    networkLeaks,
    schemaLeaks,
  };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");

  console.log("========== Step140-F Amazon SP-API Orders normalized fixture + persistence readiness aggregate contract smoke ==========");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-normalized-fixture-persistence-readiness-contract"] ===
      "node scripts/smoke-amazon-sp-api-orders-normalized-fixture-persistence-readiness-contract.js",
    "apps/api package.json registers Step140-F smoke",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-api-sanitized-response-parser-contract"],
    "Step140-E sanitized response parser regression smoke remains registered",
  );

  const step140EDtoSource = read(
    path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-orders-api-sanitized-response-parser-contract.dto.ts"),
  );

  assert(
    step140EDtoSource.includes("readyForOrdersApiNormalizedFixtureContract: true"),
    "Step140-E source allows normalized fixture contract",
  );

  assert(
    step140EDtoSource.includes("readyForOrdersApiPersistenceReadinessContract: true"),
    "Step140-E source allows persistence readiness contract",
  );

  const dtoSource = read(
    path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-orders-normalized-fixture-persistence-readiness-contract.dto.ts"),
  );

  const smokeSource = read(
    path.resolve(apiRoot, "scripts/smoke-amazon-sp-api-orders-normalized-fixture-persistence-readiness-contract.js"),
  );

  const requiredSmokeMarkers = [
    "Step140-F",
    "assertNoStep140FImplementationLeak",
    "no Step140-F normalized fixture implementation leak",
    "no Step140-F ImportJob/StagingRow persistence leak",
    "no Step140-F inventory deduction leak",
  ];

  for (const marker of requiredSmokeMarkers) {
    assert(smokeSource.includes(marker), `Step140-F smoke scanner marker exists: ${marker}`);
  }

  const requiredDtoMarkers = [
    "AMAZON_SP_API_ORDERS_NORMALIZED_FIXTURE_PERSISTENCE_READINESS_CONTRACT_VERSION",
    "buildAmazonSpApiOrdersNormalizedFixturePersistenceReadinessContract",
    "assertAmazonSpApiOrdersNormalizedFixturePersistenceReadinessContract",
    "assertAmazonSpApiOrdersApiSanitizedResponseParserContract",
    "sourceStep140E",
    "design-amazon-sp-api-orders-normalized-fixture-persistence-readiness-aggregate-contract-only",
    "normalizedFixtureDesignOnly",
    "idempotencyDesignOnly",
    "persistenceReadinessDesignOnly",
    "skuAliasReadinessDesignOnly",
    "inventoryReadinessDesignOnly",
    "transactionReadinessDesignOnly",
    "amazonOrderIdRequired",
    "businessMonthRequired",
    "dedupeHashRequired",
    "orderItemIdRequired",
    "quantityOrderedPositiveIntegerRequired",
    "importJobDedupeKeyIncludesCompanyId",
    "orderDedupeHashFromAmazonOrderIdRequired",
    "orderItemDedupeHashFromAmazonOrderIdAndOrderItemIdRequired",
    "domainWouldBeIncomeInFuture",
    "moduleWouldBeStoreOrdersInFuture",
    "sourceTypeWouldBeAmazonSpApiInFuture",
    "importStagingRowModuleStoreOrdersRequiredInFuture",
    "skuResolutionStatusRequired",
    "inventoryResolutionStatusRequired",
    "transactionTypeIncomeRequiredInFuture",
    "occurredAtFromPurchaseDateRequired",
    "sellerSkuRequiredForInventoryMatching",
    "unresolvedSkuMustNotDeductInventory",
    "inventoryDeductionRequiresTransactionCommitLink",
    "settlementReconciliationDeferred",
    "bankReconciliationDeferred",
    "shippingTaxFieldPreserved",
    "promotionDiscountTaxFieldPreserved",
    "requiresSkuAliasContractBeforeInventory",
    "readyForOrdersApiPreviewServiceContract",
    "readyForOrdersApiCommitServiceContract",
  ];

  for (const marker of requiredDtoMarkers) {
    assert(dtoSource.includes(marker), `Step140-F DTO marker exists: ${marker}`);
  }

  const forbiddenDtoMarkers = [
    "prisma.importJob.create",
    "prisma.importJob.update",
    "prisma.importStagingRow.create",
    "prisma.importStagingRow.createMany",
    "prisma.transaction.create",
    "prisma.transaction.createMany",
    "prisma.inventoryMovement.create",
    "prisma.inventoryMovement.createMany",
    "prisma.inventoryBalance.update",
    "prisma.inventoryBalance.upsert",
    "fetch(",
    "axios.",
    "got(",
    "getOrders({",
    "getOrder({",
    "getOrderItems({",
  ];

  for (const marker of forbiddenDtoMarkers) {
    assert(!dtoSource.includes(marker), `Step140-F DTO does not contain implementation marker: ${marker}`);
  }

  const contract = assertAmazonSpApiOrdersNormalizedFixturePersistenceReadinessContract(
    buildAmazonSpApiOrdersNormalizedFixturePersistenceReadinessContract(),
  );

  assert(contract.step === "Step140-F", "contract step is Step140-F");
  assert(contract.contractOnly === true, "contract remains contract-only");
  assert(contract.implementationNow === false, "implementationNow remains false");
  assert(contract.normalizedFixtureImplementationNow === false, "normalized fixture implementation remains disabled");
  assert(contract.persistenceImplementationNow === false, "persistence implementation remains disabled");
  assert(contract.transactionCommitImplementationNow === false, "transaction commit implementation remains disabled");
  assert(contract.inventoryDeductionImplementationNow === false, "inventory deduction implementation remains disabled");
  assert(contract.realAmazonOrdersApiCallNow === false, "real Amazon Orders API call remains disabled");
  assert(contract.writesDatabase === false, "contract does not write database");
  assert(contract.sampleAggregateFixtureContract.expectedPersistenceNow === false, "sample confirms persistence is disabled now");
  assert(contract.sampleAggregateFixtureContract.expectedInventoryDeductionNow === false, "sample confirms inventory deduction is disabled now");
  assert(contract.sampleAggregateFixtureContract.expectedTransactionCommitNow === false, "sample confirms transaction commit is disabled now");
  assert(contract.forbiddenNow.importJobCreate === true, "ImportJob create is forbidden now");
  assert(contract.forbiddenNow.importStagingRowCreateMany === true, "ImportStagingRow createMany is forbidden now");
  assert(contract.forbiddenNow.transactionCreate === true, "Transaction create is forbidden now");
  assert(contract.forbiddenNow.inventoryMovementCreate === true, "InventoryMovement create is forbidden now");
  assert(contract.summary.readyForNormalizedFixtureImplementation === false, "normalized fixture implementation is not allowed yet");
  assert(contract.summary.readyForPersistenceImplementation === false, "persistence implementation is not allowed yet");
  assert(contract.summary.readyForOrdersApiPersistenceDesignImplementationPlan === true, "persistence design implementation plan is allowed next");
  assert(contract.summary.readyForOrdersApiPreviewServiceContract === true, "preview service contract is allowed next");
  assert(contract.summary.readyForOrdersApiCommitServiceContract === true, "commit service contract is allowed next");

  const implementationGuard = assertNoStep140FImplementationLeak(repoRoot);

  console.log("[SMOKE_OK] Step140-F Amazon SP-API Orders normalized fixture + persistence readiness aggregate contract smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step140-F",
        contract: {
          version: contract.version,
          step: contract.step,
          contractOnly: contract.contractOnly,
          implementationNow: contract.implementationNow,
          normalizedFixtureImplementationNow: contract.normalizedFixtureImplementationNow,
          idempotencyImplementationNow: contract.idempotencyImplementationNow,
          persistenceImplementationNow: contract.persistenceImplementationNow,
          skuAliasImplementationNow: contract.skuAliasImplementationNow,
          inventoryDeductionImplementationNow: contract.inventoryDeductionImplementationNow,
          transactionCommitImplementationNow: contract.transactionCommitImplementationNow,
          reconciliationImplementationNow: contract.reconciliationImplementationNow,
          realNetworkExecutionNow: contract.realNetworkExecutionNow,
          realAmazonOrdersApiCallNow: contract.realAmazonOrdersApiCallNow,
          importJobWriteNow: contract.importJobWriteNow,
          importStagingRowWriteNow: contract.importStagingRowWriteNow,
          transactionWriteNow: contract.transactionWriteNow,
          inventoryWriteNow: contract.inventoryWriteNow,
          writesDatabase: contract.writesDatabase,
          aggregateBoundary: contract.aggregateBoundary,
          normalizedOrderFixtureContract: contract.normalizedOrderFixtureContract,
          normalizedOrderItemFixtureContract: contract.normalizedOrderItemFixtureContract,
          idempotencyContract: contract.idempotencyContract,
          importJobPersistenceReadinessContract: contract.importJobPersistenceReadinessContract,
          stagingRowPersistenceReadinessContract: contract.stagingRowPersistenceReadinessContract,
          transactionCommitReadinessContract: contract.transactionCommitReadinessContract,
          skuAliasInventoryReadinessContract: contract.skuAliasInventoryReadinessContract,
          reconciliationReadinessContract: contract.reconciliationReadinessContract,
          validationGateContract: contract.validationGateContract,
          sampleAggregateFixtureContract: contract.sampleAggregateFixtureContract,
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
