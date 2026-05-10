#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  deductAmazonSpApiOrdersInventoryFromCommittedTransactions,
} = require("../dist/src/imports/amazon-sp-api-orders-inventory-deduction.service");

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
    transactionFindMany: [],
    importStagingRowFindMany: [],
    inventoryMovementFindFirst: [],
    inventoryMovementCreate: [],
    inventoryBalanceUpsert: [],
  };

  const duplicateSourceId = "ORDER-STEP140-T-003/ITEM-STEP140-T-003-A";

  return {
    calls,
    prisma: {
      transaction: {
        findMany: async (args) => {
          calls.transactionFindMany.push(args);
          return [
            tx(1, "tx-1", "ORDER-STEP140-T-001/ITEM-STEP140-T-001-A"),
            tx(2, "tx-2", "ORDER-STEP140-T-002/ITEM-STEP140-T-002-A"),
            tx(3, "tx-3", "ORDER-STEP140-T-003/ITEM-STEP140-T-003-A"),
          ];
        },
      },
      importStagingRow: {
        findMany: async (args) => {
          calls.importStagingRowFindMany.push(args);
          return [
            row(1, "ORDER-STEP140-T-001", "ITEM-STEP140-T-001-A", "SKU-STEP140-T-1", 1),
            row(2, "ORDER-STEP140-T-002", "ITEM-STEP140-T-002-A", "SKU-STEP140-T-2", 2),
            row(3, "ORDER-STEP140-T-003", "ITEM-STEP140-T-003-A", "SKU-STEP140-T-DUP", 1),
            row(4, "ORDER-STEP140-T-004", "ITEM-STEP140-T-004-A", null, 1),
            row(5, "ORDER-STEP140-T-005", "ITEM-STEP140-T-005-A", "SKU-STEP140-T-NO-TX", 1),
            row(6, "ORDER-STEP140-T-006", "ITEM-STEP140-T-006-A", "SKU-STEP140-T-ZERO", 0),
          ];
        },
      },
      inventoryMovement: {
        findFirst: async (args) => {
          calls.inventoryMovementFindFirst.push(args);
          if (args.where.sourceId === duplicateSourceId) {
            return { id: "existing-movement-step140-t" };
          }
          return null;
        },
        create: async (args) => {
          calls.inventoryMovementCreate.push(args);
          return {
            id: `movement-step140-t-${calls.inventoryMovementCreate.length}`,
            ...args.data,
          };
        },
      },
      inventoryBalance: {
        upsert: async (args) => {
          calls.inventoryBalanceUpsert.push(args);
          return { id: `balance-${calls.inventoryBalanceUpsert.length}`, ...args };
        },
      },
    },
  };
}

function tx(sourceRowNo, id, externalRef) {
  return {
    id,
    companyId: "step140-t-company",
    storeId: "step140-t-store",
    importJobId: "import-job-step140-t",
    sourceRowNo,
    externalRef,
    occurredAt: "2026-05-01T10:00:00Z",
    businessMonth: "2026-05",
    dedupeHash: `tx-dedupe-${sourceRowNo}`,
  };
}

function row(rowNo, amazonOrderId, orderItemId, sellerSku, quantityOrdered) {
  return {
    id: `row-${rowNo}`,
    importJobId: "import-job-step140-t",
    companyId: "step140-t-company",
    module: "store-orders",
    rowNo,
    businessMonth: "2026-05",
    normalizedPayloadJson: {
      sourceType: "amazon-sp-api",
      domain: "income",
      module: "store-orders",
      storeId: "step140-t-store",
      marketplaceId: "A1VC38T7YXB528",
      region: "FE",
      amazonOrder: {
        amazonOrderId,
        purchaseDate: "2026-05-01T10:00:00Z",
        businessMonth: "2026-05",
      },
      amazonOrderItem: {
        amazonOrderId,
        orderItemId,
        sellerSku,
        quantityOrdered,
        itemLevelDedupeHash: `amazon-sp-api:item:${amazonOrderId}:${orderItemId}`,
      },
    },
    matchStatus: sellerSku ? "READY_FOR_REVIEW" : "UNRESOLVED_SKU",
    targetEntityType: "AmazonOrderItem",
    targetEntityId: orderItemId,
  };
}

function buildResolutionRows() {
  return [
    resolved(1, "sku-1", "SKU-STEP140-T-1"),
    resolved(2, "sku-2", "SKU-STEP140-T-2"),
    resolved(3, "sku-3", "SKU-STEP140-T-DUP"),
    unresolved(4, "SKU-STEP140-T-MISSING"),
    resolved(5, "sku-5", "SKU-STEP140-T-NO-TX"),
    resolved(6, "sku-6", "SKU-STEP140-T-ZERO"),
  ];
}

function resolved(rowNo, skuId, sellerSku) {
  return {
    rowNo,
    stagingRowId: `row-${rowNo}`,
    amazonOrderId: `ORDER-STEP140-T-00${rowNo}`,
    orderItemId: `ITEM-STEP140-T-00${rowNo}-A`,
    sellerSku,
    asin: null,
    normalizedSellerSku: sellerSku,
    resolutionStatus: "RESOLVED_BY_SKU_CODE",
    skuId,
    skuCode: sellerSku,
    aliasId: null,
    auditReason: "resolved for inventory deduction smoke",
    inventoryDeductionEligible: true,
  };
}

function unresolved(rowNo, sellerSku) {
  return {
    rowNo,
    stagingRowId: `row-${rowNo}`,
    amazonOrderId: `ORDER-STEP140-T-00${rowNo}`,
    orderItemId: `ITEM-STEP140-T-00${rowNo}-A`,
    sellerSku,
    asin: null,
    normalizedSellerSku: sellerSku,
    resolutionStatus: "UNRESOLVED_SKU",
    skuId: null,
    skuCode: null,
    aliasId: null,
    auditReason: "unresolved for inventory deduction smoke",
    inventoryDeductionEligible: false,
  };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");

  console.log("========== Step140-T Amazon SP-API Orders inventory deduction smoke ==========");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-inventory-deduction"] ===
      "node scripts/smoke-amazon-sp-api-orders-inventory-deduction.js",
    "apps/api package.json registers Step140-T smoke",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-sku-resolution-audit"],
    "Step140-S SKU resolution smoke remains registered",
  );

  const serviceSource = read(path.resolve(apiRoot, "src/imports/amazon-sp-api-orders-inventory-deduction.service.ts"));

  const requiredMarkers = [
    "deductAmazonSpApiOrdersInventoryFromCommittedTransactions",
    "prisma.transaction.findMany",
    "prisma.importStagingRow.findMany",
    "prisma.inventoryMovement.findFirst",
    "prisma.inventoryMovement.create",
    "prisma.inventoryBalance.upsert",
    "sourceType: 'AMAZON_SP_API_ORDER'",
    "type: 'OUT'",
    "quantity: {",
    "decrement: quantityOrdered",
    "writesInventoryMovement: true",
    "writesInventoryBalance: true",
    "writesTransaction: false",
    "createsTransaction: false",
    "requiresResolvedSku: true",
    "requiresCommittedIncomeTransaction: true",
  ];

  for (const marker of requiredMarkers) {
    assert(serviceSource.includes(marker), `Step140-T service marker exists: ${marker}`);
  }

  const forbiddenMarkers = [
    "transaction.create",
    "fetch(",
    "axios.",
    "got(",
    "https.request(",
    "http.request(",
    "undici.request",
    "refreshToken:",
    "clientSecret:",
    "settlementReconciliation",
    "bankReconciliation",
  ];

  for (const marker of forbiddenMarkers) {
    assert(!serviceSource.includes(marker), `Step140-T service does not contain forbidden marker: ${marker}`);
  }

  const { prisma, calls } = createMockPrisma();
  const result = await deductAmazonSpApiOrdersInventoryFromCommittedTransactions({
    prisma,
    companyId: "step140-t-company",
    importJobId: "import-job-step140-t",
    skuResolutionRows: buildResolutionRows(),
    occurredAtFallback: new Date("2026-05-10T16:00:00Z"),
  });

  assert(result.step === "Step140-T", "result step is Step140-T");
  assert(result.source === "amazon-sp-api-orders-inventory-deduction", "result source is stable");
  assert(result.companyId === "step140-t-company", "companyId passes through");
  assert(result.importJobId === "import-job-step140-t", "importJobId passes through");
  assert(result.inventoryWriteNow === true, "inventoryWriteNow is true");
  assert(result.transactionWriteNow === false, "transactionWriteNow remains false");
  assert(result.inventoryMovementCreatedCount === 2, "2 inventory movements created");
  assert(result.inventoryBalanceUpdatedCount === 2, "2 inventory balances updated");
  assert(result.skippedCount === 4, "4 rows skipped");
  assert(result.duplicateSkippedCount === 1, "1 duplicate movement skipped");
  assert(result.unresolvedSkuSkippedCount === 1, "1 unresolved SKU skipped");
  assert(result.transactionMissingSkippedCount === 1, "1 missing transaction skipped");
  assert(result.invalidPayloadSkippedCount === 1, "1 invalid/zero quantity skipped");
  assert(result.deductions.length === 2, "deductions length is 2");

  assert(result.boundaries.writesInventoryMovement === true, "boundary writes InventoryMovement");
  assert(result.boundaries.writesInventoryBalance === true, "boundary writes InventoryBalance");
  assert(result.boundaries.writesTransaction === false, "boundary writes no Transaction");
  assert(result.boundaries.createsTransaction === false, "boundary creates no Transaction");
  assert(result.boundaries.writesImportStagingRow === false, "boundary writes no ImportStagingRow");
  assert(result.boundaries.callsAmazon === false, "boundary calls no Amazon");
  assert(result.boundaries.runsSettlementReconciliation === false, "boundary does not run settlement reconciliation");
  assert(result.boundaries.runsBankReconciliation === false, "boundary does not run bank reconciliation");
  assert(result.boundaries.requiresResolvedSku === true, "boundary requires resolved SKU");
  assert(result.boundaries.requiresCommittedIncomeTransaction === true, "boundary requires committed income transaction");

  assert(calls.transactionFindMany.length === 1, "transaction.findMany called once");
  assert(calls.importStagingRowFindMany.length === 1, "importStagingRow.findMany called once");
  assert(calls.inventoryMovementFindFirst.length === 3, "inventoryMovement.findFirst called for resolved rows with transactions");
  assert(calls.inventoryMovementCreate.length === 2, "inventoryMovement.create called twice");
  assert(calls.inventoryBalanceUpsert.length === 2, "inventoryBalance.upsert called twice");

  const firstMovement = calls.inventoryMovementCreate[0].data;
  assert(firstMovement.companyId === "step140-t-company", "movement companyId is correct");
  assert(firstMovement.skuId === "sku-1", "movement skuId is sku-1");
  assert(firstMovement.type === "OUT", "movement type is OUT");
  assert(firstMovement.quantity === 1, "movement quantity is 1");
  assert(firstMovement.sourceType === "AMAZON_SP_API_ORDER", "movement sourceType is AMAZON_SP_API_ORDER");
  assert(firstMovement.sourceId === "ORDER-STEP140-T-001/ITEM-STEP140-T-001-A", "movement sourceId is order/item");
  assert(firstMovement.importJobId === "import-job-step140-t", "movement importJobId is linked");
  assert(firstMovement.sourceRowNo === 1, "movement sourceRowNo is linked");
  assert(firstMovement.transactionId === "tx-1", "movement transactionId is linked");
  assert(firstMovement.businessMonth === "2026-05", "movement businessMonth is linked");

  const firstBalance = calls.inventoryBalanceUpsert[0];
  assert(firstBalance.where.companyId_skuId.companyId === "step140-t-company", "balance companyId is correct");
  assert(firstBalance.where.companyId_skuId.skuId === "sku-1", "balance skuId is sku-1");
  assert(firstBalance.create.quantity === -1, "balance create quantity starts negative deduction");
  assert(firstBalance.update.quantity.decrement === 1, "balance update decrements by 1");

  const skipCodes = result.skippedRows.map((row) => row.reasonCode);
  assert(skipCodes.includes("DUPLICATE_INVENTORY_MOVEMENT"), "skip includes duplicate movement");
  assert(skipCodes.includes("UNRESOLVED_SKU"), "skip includes unresolved SKU");
  assert(skipCodes.includes("MISSING_COMMITTED_TRANSACTION"), "skip includes missing transaction");
  assert(skipCodes.includes("ZERO_OR_NEGATIVE_QUANTITY"), "skip includes zero quantity");

  const serialized = JSON.stringify({ result, calls });
  assert(!serialized.includes("transaction.create"), "result does not include transaction create");
  assert(!serialized.includes("AT_SECRET_"), "result exposes no access token");
  assert(!serialized.includes("AWS_SECRET_"), "result exposes no AWS secret");

  console.log("[SMOKE_OK] Step140-T Amazon SP-API Orders inventory deduction smoke passed");
  console.log(JSON.stringify({ ok: true, step: "Step140-T", result }, null, 2));
}

main().catch((err) => {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
});
