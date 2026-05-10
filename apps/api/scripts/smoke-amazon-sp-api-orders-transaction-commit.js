#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  buildAmazonSpApiOrdersTransactionDedupeHash,
  commitAmazonSpApiOrdersStagingRowsToIncomeTransactions,
} = require("../dist/src/imports/amazon-sp-api-orders-transaction-commit.service");

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
    importJobFindFirst: [],
    importJobUpdate: [],
    importStagingRowFindMany: [],
    transactionFindFirst: [],
    transactionCreate: [],
  };

  const existingDedupe = new Set([
    buildAmazonSpApiOrdersTransactionDedupeHash(
      "step140-r-company",
      "ORDER-STEP140-R-003",
      "ITEM-STEP140-R-003-A",
    ),
  ]);

  return {
    calls,
    prisma: {
      importJob: {
        findFirst: async (args) => {
          calls.importJobFindFirst.push(args);
          return {
            id: "import-job-step140-r",
            companyId: "step140-r-company",
            module: "store-orders",
            sourceType: "amazon-sp-api",
            filename: "step140-r-preview.json",
            status: "SUCCEEDED",
          };
        },
        update: async (args) => {
          calls.importJobUpdate.push(args);
          return { id: args.where.id, ...args.data };
        },
      },
      importStagingRow: {
        findMany: async (args) => {
          calls.importStagingRowFindMany.push(args);
          return buildRows();
        },
      },
      transaction: {
        findFirst: async (args) => {
          calls.transactionFindFirst.push(args);
          if (existingDedupe.has(args.where.dedupeHash)) {
            return { id: "existing-transaction-step140-r" };
          }
          return null;
        },
        create: async (args) => {
          calls.transactionCreate.push(args);
          return {
            id: `transaction-step140-r-${calls.transactionCreate.length}`,
            ...args.data,
          };
        },
      },
    },
  };
}

function buildRows() {
  return [
    {
      id: "row-1",
      importJobId: "import-job-step140-r",
      companyId: "step140-r-company",
      module: "store-orders",
      rowNo: 1,
      businessMonth: "2026-05",
      rawPayloadJson: {},
      normalizedPayloadJson: buildPayload({
        amazonOrderId: "ORDER-STEP140-R-001",
        orderItemId: "ITEM-STEP140-R-001-A",
        sellerSku: "SKU-STEP140-R-1",
        title: "Step140-R item 1",
        amount: 4980,
        purchaseDate: "2026-05-01T10:00:00Z",
      }),
      dedupeHash: "staging-dedupe-1",
      matchStatus: "READY_FOR_REVIEW",
      targetEntityType: "AmazonOrderItem",
      targetEntityId: "ITEM-STEP140-R-001-A",
    },
    {
      id: "row-2",
      importJobId: "import-job-step140-r",
      companyId: "step140-r-company",
      module: "store-orders",
      rowNo: 2,
      businessMonth: "2026-05",
      rawPayloadJson: {},
      normalizedPayloadJson: buildPayload({
        amazonOrderId: "ORDER-STEP140-R-002",
        orderItemId: "ITEM-STEP140-R-002-A",
        sellerSku: "SKU-STEP140-R-2",
        title: "Step140-R item 2",
        amount: 3980,
        purchaseDate: "2026-05-01T11:00:00Z",
      }),
      dedupeHash: "staging-dedupe-2",
      matchStatus: "READY_FOR_REVIEW",
      targetEntityType: "AmazonOrderItem",
      targetEntityId: "ITEM-STEP140-R-002-A",
    },
    {
      id: "row-3",
      importJobId: "import-job-step140-r",
      companyId: "step140-r-company",
      module: "store-orders",
      rowNo: 3,
      businessMonth: "2026-05",
      rawPayloadJson: {},
      normalizedPayloadJson: buildPayload({
        amazonOrderId: "ORDER-STEP140-R-003",
        orderItemId: "ITEM-STEP140-R-003-A",
        sellerSku: "SKU-STEP140-R-DUP",
        title: "Step140-R duplicate item",
        amount: 2000,
        purchaseDate: "2026-05-01T12:00:00Z",
      }),
      dedupeHash: "staging-dedupe-3",
      matchStatus: "READY_FOR_REVIEW",
      targetEntityType: "AmazonOrderItem",
      targetEntityId: "ITEM-STEP140-R-003-A",
    },
    {
      id: "row-4",
      importJobId: "import-job-step140-r",
      companyId: "step140-r-company",
      module: "store-orders",
      rowNo: 4,
      businessMonth: "2026-05",
      rawPayloadJson: {},
      normalizedPayloadJson: buildPayload({
        amazonOrderId: "ORDER-STEP140-R-004",
        orderItemId: "ITEM-STEP140-R-004-A",
        sellerSku: null,
        title: "Step140-R unresolved item",
        amount: 1500,
        purchaseDate: "2026-05-01T13:00:00Z",
      }),
      dedupeHash: "staging-dedupe-4",
      matchStatus: "UNRESOLVED_SKU",
      targetEntityType: "AmazonOrderItem",
      targetEntityId: "ITEM-STEP140-R-004-A",
    },
  ];
}

function buildPayload({ amazonOrderId, orderItemId, sellerSku, title, amount, purchaseDate }) {
  return {
    sourceType: "amazon-sp-api",
    domain: "income",
    module: "store-orders",
    storeId: "step140-r-store",
    marketplaceId: "A1VC38T7YXB528",
    region: "FE",
    amazonOrder: {
      amazonOrderId,
      purchaseDate,
      businessMonth: purchaseDate.slice(0, 7),
      orderStatus: "Shipped",
      currencyCode: "JPY",
      orderTotalAmount: amount,
    },
    amazonOrderItem: {
      amazonOrderId,
      orderItemId,
      sellerSku,
      title,
      quantityOrdered: 1,
      itemPriceAmount: amount,
      itemTaxAmount: Math.round(amount * 0.1),
      itemCurrencyCode: "JPY",
      itemLevelDedupeHash: `amazon-sp-api:item:${amazonOrderId}:${orderItemId}`,
    },
    skuResolutionStatus: sellerSku ? "resolved" : "unresolved",
    inventoryResolutionStatus: sellerSku ? "ready_for_review" : "blocked_unresolved_sku",
    inventoryDeductionStatus: "not_started_preview_persistence_only",
    transactionCommitStatus: "not_started_preview_persistence_only",
    settlementReconciliationStatus: "deferred",
    bankReconciliationStatus: "deferred",
  };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");

  console.log("========== Step140-R Amazon SP-API Orders transaction commit smoke ==========");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-transaction-commit"] ===
      "node scripts/smoke-amazon-sp-api-orders-transaction-commit.js",
    "apps/api package.json registers Step140-R smoke",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-preview-persistence"],
    "Step140-Q preview persistence smoke remains registered",
  );

  const serviceSource = read(path.resolve(apiRoot, "src/imports/amazon-sp-api-orders-transaction-commit.service.ts"));

  const requiredMarkers = [
    "commitAmazonSpApiOrdersStagingRowsToIncomeTransactions",
    "buildAmazonSpApiOrdersTransactionDedupeHash",
    "prisma.transaction.findFirst",
    "prisma.transaction.create",
    "type: 'SALE'",
    "direction: 'INCOME'",
    "sourceType: 'IMPORT'",
    "doesNotWriteInventory: true",
    "doesNotDeductInventory: true",
    "doesNotCallAmazon: true",
    "doesNotRunSettlementReconciliation: true",
    "doesNotRunBankReconciliation: true",
  ];

  for (const marker of requiredMarkers) {
    assert(serviceSource.includes(marker), `Step140-R service marker exists: ${marker}`);
  }

  const forbiddenMarkers = [
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
    assert(!serviceSource.includes(marker), `Step140-R service does not contain forbidden marker: ${marker}`);
  }

  const { prisma, calls } = createMockPrisma();

  const result = await commitAmazonSpApiOrdersStagingRowsToIncomeTransactions({
    prisma,
    companyId: "step140-r-company",
    importJobId: "import-job-step140-r",
    committedAt: new Date("2026-05-10T15:00:00Z"),
  });

  assert(result.step === "Step140-R", "result step is Step140-R");
  assert(result.source === "amazon-sp-api-orders-transaction-commit", "result source is stable");
  assert(result.companyId === "step140-r-company", "companyId passes through");
  assert(result.importJobId === "import-job-step140-r", "importJobId passes through");
  assert(result.transactionWriteNow === true, "Transaction write is true");
  assert(result.inventoryWriteNow === false, "Inventory write remains false");
  assert(result.importJobWriteNow === true, "ImportJob status update is true");
  assert(result.importStagingRowWriteNow === false, "ImportStagingRow write remains false");
  assert(result.writesDatabase === true, "writesDatabase is true");
  assert(result.committedTransactionCount === 2, "2 transactions committed");
  assert(result.skippedRowCount === 2, "2 rows skipped");
  assert(result.duplicateSkippedCount === 1, "1 duplicate skipped");
  assert(result.unresolvedSkuSkippedCount === 1, "1 unresolved SKU skipped");
  assert(result.failedRowCount === 0, "failedRowCount remains 0");
  assert(result.committedTransactions.length === 2, "committedTransactions length is 2");
  assert(result.skippedRows.length === 2, "skippedRows length is 2");
  assert(result.boundaries.writesOnlyIncomeTransactionsAndImportJobStatus === true, "boundary writes only income transactions and ImportJob status");
  assert(result.boundaries.doesNotWriteInventory === true, "boundary writes no inventory");
  assert(result.boundaries.doesNotDeductInventory === true, "boundary does not deduct inventory");
  assert(result.boundaries.doesNotWriteImportStagingRow === true, "boundary does not write staging rows");
  assert(result.boundaries.doesNotCallAmazon === true, "boundary does not call Amazon");
  assert(result.boundaries.doesNotRunSettlementReconciliation === true, "boundary does not run settlement reconciliation");
  assert(result.boundaries.doesNotRunBankReconciliation === true, "boundary does not run bank reconciliation");

  assert(calls.importJobFindFirst.length === 1, "ImportJob findFirst called once");
  assert(calls.importStagingRowFindMany.length === 1, "ImportStagingRow findMany called once");
  assert(calls.transactionFindFirst.length === 3, "transaction dedupe check called for 3 ready rows");
  assert(calls.transactionCreate.length === 2, "transaction.create called for 2 rows");
  assert(calls.importJobUpdate.length === 1, "ImportJob update called once");

  const firstTx = calls.transactionCreate[0].data;
  assert(firstTx.companyId === "step140-r-company", "Transaction companyId is correct");
  assert(firstTx.storeId === "step140-r-store", "Transaction storeId is correct");
  assert(firstTx.type === "SALE", "Transaction type is SALE");
  assert(firstTx.direction === "INCOME", "Transaction direction is INCOME");
  assert(firstTx.sourceType === "IMPORT", "Transaction sourceType is IMPORT");
  assert(firstTx.amount === 4980, "Transaction amount is item price amount");
  assert(firstTx.currency === "JPY", "Transaction currency is JPY");
  assert(firstTx.businessMonth === "2026-05", "Transaction businessMonth is 2026-05");
  assert(firstTx.externalRef === "ORDER-STEP140-R-001/ITEM-STEP140-R-001-A", "Transaction externalRef is order/item");
  assert(firstTx.importJobId === "import-job-step140-r", "Transaction importJobId is set");
  assert(firstTx.sourceRowNo === 1, "Transaction sourceRowNo is set");

  const update = calls.importJobUpdate[0].data;
  assert(update.status === "SUCCEEDED", "ImportJob status remains SUCCEEDED");
  assert(update.successRows === 2, "ImportJob successRows is committed count");
  assert(update.failedRows === 2, "ImportJob failedRows is skipped count");
  assert(update.errorMessage === null, "ImportJob errorMessage is null");

  const serialized = JSON.stringify({ result, calls });
  assert(!serialized.includes("inventoryMovement.create"), "result does not include inventory movement create");
  assert(!serialized.includes("inventoryBalance.update"), "result does not include inventory balance update");
  assert(!serialized.includes("AT_SECRET_"), "result exposes no access token");
  assert(!serialized.includes("AWS_SECRET_"), "result exposes no AWS secret");

  console.log("[SMOKE_OK] Step140-R Amazon SP-API Orders transaction commit smoke passed");
  console.log(JSON.stringify({ ok: true, step: "Step140-R", result }, null, 2));
}

main().catch((err) => {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
});
