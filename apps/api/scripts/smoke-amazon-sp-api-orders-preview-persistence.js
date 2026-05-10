#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  buildAmazonSpApiOrdersPreviewFileHash,
  persistAmazonSpApiOrdersPreviewToImportStaging,
} = require("../dist/src/imports/amazon-sp-api-orders-preview-persistence.service");

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`[OK] ${message}`);
}

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`);
  return fs.readFileSync(file, "utf8");
}

function createMockPrisma() {
  const calls = {
    importJobCreate: [],
    importStagingRowCreate: [],
  };

  return {
    calls,
    prisma: {
      importJob: {
        create: async (args) => {
          calls.importJobCreate.push(args);
          return {
            id: "import-job-step140-q",
            ...args.data,
          };
        },
      },
      importStagingRow: {
        create: async (args) => {
          calls.importStagingRowCreate.push(args);
          return {
            id: `staging-row-${args.data.rowNo}`,
            ...args.data,
          };
        },
      },
    },
  };
}

function buildPreviewEnvelope() {
  return {
    step: "Step140-P",
    source: "amazon-sp-api-orders-real-preview",
    previewMode: "real-http-mocked-transport-no-persistence",
    dryRun: false,
    persisted: false,
    companyId: "step140-q-company",
    storeId: "step140-q-store",
    marketplaceId: "A1VC38T7YXB528",
    region: "FE",
    normalizedOrders: [
      {
        sourceType: "amazon-sp-api",
        marketplaceId: "A1VC38T7YXB528",
        region: "FE",
        amazonOrderId: "ORDER-STEP140-Q-001",
        purchaseDate: "2026-05-01T10:00:00Z",
        businessMonth: "2026-05",
        orderStatus: "Shipped",
        fulfillmentChannel: "AFN",
        salesChannel: "Amazon.co.jp",
        currencyCode: "JPY",
        orderTotalAmount: 4980,
        itemCount: 1,
        dedupeHash: "amazon-sp-api:order:ORDER-STEP140-Q-001",
        normalizedPayloadJson: {
          amazonOrderId: "ORDER-STEP140-Q-001",
          purchaseDate: "2026-05-01T10:00:00Z",
          orderStatus: "Shipped",
          marketplaceId: "A1VC38T7YXB528",
          currencyCode: "JPY",
          orderTotalAmount: 4980,
        },
      },
      {
        sourceType: "amazon-sp-api",
        marketplaceId: "A1VC38T7YXB528",
        region: "FE",
        amazonOrderId: "ORDER-STEP140-Q-002",
        purchaseDate: "2026-05-01T12:00:00Z",
        businessMonth: "2026-05",
        orderStatus: "Shipped",
        fulfillmentChannel: "MFN",
        salesChannel: "Amazon.co.jp",
        currencyCode: "JPY",
        orderTotalAmount: 7980,
        itemCount: 3,
        dedupeHash: "amazon-sp-api:order:ORDER-STEP140-Q-002",
        normalizedPayloadJson: {
          amazonOrderId: "ORDER-STEP140-Q-002",
          purchaseDate: "2026-05-01T12:00:00Z",
          orderStatus: "Shipped",
          marketplaceId: "A1VC38T7YXB528",
          currencyCode: "JPY",
          orderTotalAmount: 7980,
        },
      },
    ],
    normalizedOrderItems: [
      {
        sourceType: "amazon-sp-api",
        marketplaceId: "A1VC38T7YXB528",
        region: "FE",
        amazonOrderId: "ORDER-STEP140-Q-001",
        orderItemId: "ITEM-STEP140-Q-001-A",
        asin: "B0STEP140Q1",
        sellerSku: "SKU-STEP140-Q-RESOLVED-1",
        title: "Step140-Q resolved item 1",
        quantityOrdered: 1,
        quantityShipped: 1,
        itemPriceAmount: 4980,
        itemTaxAmount: 452,
        shippingPriceAmount: 0,
        shippingTaxAmount: 0,
        promotionDiscountAmount: 0,
        promotionDiscountTaxAmount: 0,
        itemCurrencyCode: "JPY",
        itemLevelDedupeHash: "amazon-sp-api:item:ORDER-STEP140-Q-001:ITEM-STEP140-Q-001-A",
        normalizedPayloadJson: {
          amazonOrderId: "ORDER-STEP140-Q-001",
          orderItemId: "ITEM-STEP140-Q-001-A",
          asin: "B0STEP140Q1",
          sellerSku: "SKU-STEP140-Q-RESOLVED-1",
          quantityOrdered: 1,
        },
      },
      {
        sourceType: "amazon-sp-api",
        marketplaceId: "A1VC38T7YXB528",
        region: "FE",
        amazonOrderId: "ORDER-STEP140-Q-002",
        orderItemId: "ITEM-STEP140-Q-002-A",
        asin: "B0STEP140Q2",
        sellerSku: "SKU-STEP140-Q-RESOLVED-2",
        title: "Step140-Q resolved item 2",
        quantityOrdered: 1,
        quantityShipped: 1,
        itemPriceAmount: 3980,
        itemTaxAmount: 362,
        shippingPriceAmount: 0,
        shippingTaxAmount: 0,
        promotionDiscountAmount: 0,
        promotionDiscountTaxAmount: 0,
        itemCurrencyCode: "JPY",
        itemLevelDedupeHash: "amazon-sp-api:item:ORDER-STEP140-Q-002:ITEM-STEP140-Q-002-A",
        normalizedPayloadJson: {
          amazonOrderId: "ORDER-STEP140-Q-002",
          orderItemId: "ITEM-STEP140-Q-002-A",
          asin: "B0STEP140Q2",
          sellerSku: "SKU-STEP140-Q-RESOLVED-2",
          quantityOrdered: 1,
        },
      },
      {
        sourceType: "amazon-sp-api",
        marketplaceId: "A1VC38T7YXB528",
        region: "FE",
        amazonOrderId: "ORDER-STEP140-Q-002",
        orderItemId: "ITEM-STEP140-Q-002-B",
        asin: "B0STEP140Q3",
        sellerSku: null,
        title: "Step140-Q unresolved item",
        quantityOrdered: 2,
        quantityShipped: 2,
        itemPriceAmount: 2000,
        itemTaxAmount: 182,
        shippingPriceAmount: 0,
        shippingTaxAmount: 0,
        promotionDiscountAmount: 0,
        promotionDiscountTaxAmount: 0,
        itemCurrencyCode: "JPY",
        itemLevelDedupeHash: "amazon-sp-api:item:ORDER-STEP140-Q-002:ITEM-STEP140-Q-002-B",
        normalizedPayloadJson: {
          amazonOrderId: "ORDER-STEP140-Q-002",
          orderItemId: "ITEM-STEP140-Q-002-B",
          asin: "B0STEP140Q3",
          sellerSku: null,
          quantityOrdered: 2,
        },
      },
    ],
    validationSummary: {
      totalOrders: 2,
      totalOrderItems: 3,
      validationErrorCount: 0,
      warningCount: 1,
      commitEligibleCount: 2,
    },
    dedupeSummary: {
      duplicateOrdersCount: 0,
      duplicateItemsCount: 0,
      uniqueOrderDedupeHashes: [],
      uniqueItemDedupeHashes: [],
    },
    skuResolutionSummary: {
      resolvedSkuCount: 2,
      unresolvedSkuCount: 1,
      unresolvedSellerSkus: ["(missing-seller-sku)"],
      inventoryBlockedCount: 1,
    },
    inventoryImpactPreview: {
      wouldDeductInventory: false,
      blockedBecauseNoPersistence: true,
      blockedBecauseUnresolvedSkuCount: 1,
      impacts: [],
    },
    transactionImpactPreview: {
      wouldCreateTransactions: false,
      blockedBecauseNoPersistence: true,
      transactionPreviewCount: 2,
      totalPreviewAmount: 12960,
      currencyCode: "JPY",
    },
    httpSummary: {
      listOrdersStatus: 200,
      getOrderItemsCalls: 2,
      throttled: false,
      retryable: false,
    },
    warnings: ["Unresolved seller SKU for ORDER-STEP140-Q-002/ITEM-STEP140-Q-002-B"],
    writesDatabase: false,
    importJobWriteNow: false,
    importStagingRowWriteNow: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,
    realAmazonOrdersApiCall: true,
    realNetworkDefaultDisabled: true,
    usesInjectedTransportOnly: true,
  };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");

  console.log("========== Step140-Q Amazon SP-API Orders preview persistence smoke ==========");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-preview-persistence"] ===
      "node scripts/smoke-amazon-sp-api-orders-preview-persistence.js",
    "apps/api package.json registers Step140-Q smoke",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-real-preview-no-persistence"],
    "Step140-P real preview smoke remains registered",
  );

  const serviceSource = read(path.resolve(apiRoot, "src/imports/amazon-sp-api-orders-preview-persistence.service.ts"));

  const requiredMarkers = [
    "persistAmazonSpApiOrdersPreviewToImportStaging",
    "buildAmazonSpApiOrdersPreviewFileHash",
    "prisma.importJob.create",
    "prisma.importStagingRow.create",
    "domain: 'income'",
    "module: 'store-orders'",
    "sourceType: 'amazon-sp-api'",
    "matchStatus",
    "UNRESOLVED_SKU",
    "READY_FOR_REVIEW",
    "transactionWriteNow: false",
    "inventoryWriteNow: false",
    "doesNotWriteTransaction: true",
    "doesNotWriteInventory: true",
    "doesNotCallAmazon: true",
  ];

  for (const marker of requiredMarkers) {
    assert(serviceSource.includes(marker), `Step140-Q service marker exists: ${marker}`);
  }

  const forbiddenMarkers = [
    "transaction.create",
    "inventoryMovement.create",
    "inventoryBalance.update",
    "fetch(",
    "axios.",
    "got(",
    "https.request(",
    "http.request(",
    "undici.request",
    "refreshToken:",
    "clientSecret:",
  ];

  for (const marker of forbiddenMarkers) {
    assert(!serviceSource.includes(marker), `Step140-Q service does not contain forbidden marker: ${marker}`);
  }

  const preview = buildPreviewEnvelope();
  const { prisma, calls } = createMockPrisma();
  const result = await persistAmazonSpApiOrdersPreviewToImportStaging({
    prisma,
    preview,
    filename: "step140-q-amazon-orders-preview.json",
    importedAt: new Date("2026-05-10T14:00:00Z"),
  });

  assert(result.step === "Step140-Q", "result step is Step140-Q");
  assert(result.source === "amazon-sp-api-orders-preview-persistence", "result source is stable");
  assert(result.persisted === true, "result is persisted");
  assert(result.companyId === "step140-q-company", "companyId passes through");
  assert(result.storeId === "step140-q-store", "storeId passes through");
  assert(result.marketplaceId === "A1VC38T7YXB528", "marketplaceId passes through");
  assert(result.importJobId === "import-job-step140-q", "importJobId returned from mock");
  assert(result.importJobWriteNow === true, "ImportJob write is true");
  assert(result.importStagingRowWriteNow === true, "ImportStagingRow write is true");
  assert(result.transactionWriteNow === false, "Transaction write remains false");
  assert(result.inventoryWriteNow === false, "Inventory write remains false");
  assert(result.writesDatabase === true, "writesDatabase is true for staging persistence");
  assert(result.transactionCreatedCount === 0, "transaction created count remains 0");
  assert(result.inventoryMovementCreatedCount === 0, "inventory movement created count remains 0");
  assert(result.stagingRowsCreatedCount === 3, "3 staging rows created");
  assert(result.totalRows === 3, "totalRows is 3");
  assert(result.successRows === 3, "successRows is 3");
  assert(result.failedRows === 0, "failedRows is 0");
  assert(result.fileMonths.length === 1 && result.fileMonths[0] === "2026-05", "fileMonths contains 2026-05");
  assert(result.matchStatusSummary.readyForReview === 2, "readyForReview count is 2");
  assert(result.matchStatusSummary.unresolvedSku === 1, "unresolvedSku count is 1");
  assert(result.boundaries.writesOnlyImportJobAndStagingRows === true, "boundary writes only ImportJob and staging rows");
  assert(result.boundaries.doesNotWriteTransaction === true, "boundary writes no Transaction");
  assert(result.boundaries.doesNotWriteInventory === true, "boundary writes no Inventory");
  assert(result.boundaries.doesNotDeductInventory === true, "boundary does not deduct inventory");
  assert(result.boundaries.doesNotRunSettlementReconciliation === true, "boundary defers settlement reconciliation");
  assert(result.boundaries.doesNotRunBankReconciliation === true, "boundary defers bank reconciliation");
  assert(result.boundaries.doesNotCallAmazon === true, "boundary does not call Amazon");
  assert(result.boundaries.usesExistingPreviewEnvelopeOnly === true, "boundary uses existing preview envelope only");

  assert(calls.importJobCreate.length === 1, "mock ImportJob create called once");
  assert(calls.importStagingRowCreate.length === 3, "mock ImportStagingRow create called 3 times");

  const jobData = calls.importJobCreate[0].data;
  assert(jobData.companyId === "step140-q-company", "ImportJob companyId is correct");
  assert(jobData.domain === "income", "ImportJob domain is income");
  assert(jobData.module === "store-orders", "ImportJob module is store-orders");
  assert(jobData.sourceType === "amazon-sp-api", "ImportJob sourceType is amazon-sp-api");
  assert(jobData.status === "SUCCEEDED", "ImportJob status is SUCCEEDED");
  assert(jobData.totalRows === 3, "ImportJob totalRows is 3");
  assert(jobData.successRows === 3, "ImportJob successRows is 3");
  assert(jobData.failedRows === 0, "ImportJob failedRows is 0");

  const rowStatuses = calls.importStagingRowCreate.map((call) => call.data.matchStatus);
  assert(rowStatuses.filter((value) => value === "READY_FOR_REVIEW").length === 2, "2 rows ready for review");
  assert(rowStatuses.filter((value) => value === "UNRESOLVED_SKU").length === 1, "1 row unresolved SKU");
  assert(calls.importStagingRowCreate.every((call) => call.data.module === "store-orders"), "all rows use store-orders module");
  assert(calls.importStagingRowCreate.every((call) => call.data.companyId === "step140-q-company"), "all rows use companyId");
  assert(calls.importStagingRowCreate.every((call) => call.data.importJobId === "import-job-step140-q"), "all rows link ImportJob");
  assert(calls.importStagingRowCreate.every((call) => call.data.normalizedPayloadJson.transactionCommitStatus === "not_started_preview_persistence_only"), "all rows defer transaction commit");
  assert(calls.importStagingRowCreate.every((call) => call.data.normalizedPayloadJson.inventoryDeductionStatus === "not_started_preview_persistence_only"), "all rows defer inventory deduction");

  const fileHash = buildAmazonSpApiOrdersPreviewFileHash(preview);
  assert(fileHash === result.fileHash, "fileHash helper matches persisted result");
  assert(fileHash.includes("amazon-sp-api-orders-preview"), "fileHash has stable prefix");

  const serialized = JSON.stringify({ result, calls });
  assert(!serialized.includes("AT_SECRET_"), "persistence result exposes no access token");
  assert(!serialized.includes("AWS_SECRET_"), "persistence result exposes no AWS secret");
  assert(!serialized.includes("SESSION_SECRET_"), "persistence result exposes no session token");

  console.log("[SMOKE_OK] Step140-Q Amazon SP-API Orders preview persistence smoke passed");
  console.log(JSON.stringify({ ok: true, step: "Step140-Q", result }, null, 2));
}

main().catch((err) => {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
});
