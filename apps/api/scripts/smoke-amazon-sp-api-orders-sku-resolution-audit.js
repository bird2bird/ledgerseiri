#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  normalizeAmazonSpApiSellerSku,
  resolveAmazonSpApiOrdersSkuAliasesForStagingRows,
} = require("../dist/src/imports/amazon-sp-api-orders-sku-resolution-audit.service");

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
    productSkuFindFirst: [],
    productSkuAliasFindFirst: [],
  };

  const productSkus = [
    {
      id: "sku-direct",
      companyId: "step140-s-company",
      storeId: "step140-s-store",
      skuCode: "SELLER-SKU-DIRECT",
      externalSku: "EXT-DIRECT",
      asin: "B0DIRECTSKU",
      isActive: true,
    },
    {
      id: "sku-external",
      companyId: "step140-s-company",
      storeId: "step140-s-store",
      skuCode: "INTERNAL-EXTERNAL",
      externalSku: "SELLER-SKU-EXTERNAL",
      asin: "B0EXTERNALSKU",
      isActive: true,
    },
    {
      id: "sku-asin",
      companyId: "step140-s-company",
      storeId: "step140-s-store",
      skuCode: "INTERNAL-ASIN",
      externalSku: null,
      asin: "B0ASINONLY",
      isActive: true,
    },
    {
      id: "sku-alias-target",
      companyId: "step140-s-company",
      storeId: "step140-s-store",
      skuCode: "INTERNAL-ALIAS",
      externalSku: null,
      asin: "B0ALIASSKU",
      isActive: true,
    },
  ];

  const aliases = [
    {
      id: "alias-1",
      companyId: "step140-s-company",
      skuId: "sku-alias-target",
      storeId: "step140-s-store",
      sourceType: "AMAZON_ORDER_IMPORT",
      aliasSku: "seller sku alias",
      normalizedAliasSku: "SELLER-SKU-ALIAS",
      isActive: true,
      sku: productSkus.find((sku) => sku.id === "sku-alias-target"),
    },
  ];

  return {
    calls,
    prisma: {
      productSku: {
        findFirst: async (args) => {
          calls.productSkuFindFirst.push(args);
          const or = args.where.OR || [];

          for (const condition of or) {
            if (condition.skuCode) {
              const hit = productSkus.find((sku) => sku.skuCode === condition.skuCode);
              if (hit) return hit;
            }

            if (condition.externalSku) {
              const hit = productSkus.find((sku) => sku.externalSku === condition.externalSku);
              if (hit) return hit;
            }

            if (condition.asin) {
              const hit = productSkus.find((sku) => sku.asin === condition.asin);
              if (hit) return hit;
            }
          }

          return null;
        },
      },
      productSkuAlias: {
        findFirst: async (args) => {
          calls.productSkuAliasFindFirst.push(args);
          return aliases.find((alias) => (
            alias.companyId === args.where.companyId &&
            alias.normalizedAliasSku === args.where.normalizedAliasSku &&
            alias.storeId === args.where.storeId
          )) || null;
        },
      },
    },
  };
}

function buildRows() {
  return [
    row(1, "ORDER-1", "ITEM-1", "SELLER-SKU-DIRECT", "B0DIRECTSKU"),
    row(2, "ORDER-2", "ITEM-2", "SELLER-SKU-EXTERNAL", "B0EXTERNALSKU"),
    row(3, "ORDER-3", "ITEM-3", "seller-sku-alias", "B0ALIASSKU"),
    row(4, "ORDER-4", "ITEM-4", "", "B0ASINONLY"),
    row(5, "ORDER-5", "ITEM-5", "SELLER-SKU-MISSING", "B0MISSINGSKU"),
    row(6, "ORDER-6", "ITEM-6", null, null),
    {
      id: "row-invalid",
      importJobId: "import-job-step140-s",
      companyId: "step140-s-company",
      module: "store-orders",
      rowNo: 7,
      businessMonth: "2026-05",
      normalizedPayloadJson: {
        amazonOrderItem: {
          sellerSku: "INVALID-PAYLOAD",
        },
      },
      matchStatus: "READY_FOR_REVIEW",
      targetEntityType: "AmazonOrderItem",
      targetEntityId: null,
    },
  ];
}

function row(rowNo, amazonOrderId, orderItemId, sellerSku, asin) {
  return {
    id: `row-${rowNo}`,
    importJobId: "import-job-step140-s",
    companyId: "step140-s-company",
    module: "store-orders",
    rowNo,
    businessMonth: "2026-05",
    normalizedPayloadJson: {
      sourceType: "amazon-sp-api",
      domain: "income",
      module: "store-orders",
      storeId: "step140-s-store",
      marketplaceId: "A1VC38T7YXB528",
      region: "FE",
      amazonOrder: {
        amazonOrderId,
      },
      amazonOrderItem: {
        amazonOrderId,
        orderItemId,
        sellerSku,
        asin,
        quantityOrdered: 1,
        itemLevelDedupeHash: `amazon-sp-api:item:${amazonOrderId}:${orderItemId}`,
      },
    },
    matchStatus: sellerSku || asin ? "READY_FOR_REVIEW" : "UNRESOLVED_SKU",
    targetEntityType: "AmazonOrderItem",
    targetEntityId: orderItemId,
  };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");

  console.log("========== Step140-S Amazon SP-API Orders SKU resolution audit smoke ==========");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-sku-resolution-audit"] ===
      "node scripts/smoke-amazon-sp-api-orders-sku-resolution-audit.js",
    "apps/api package.json registers Step140-S smoke",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-transaction-commit"],
    "Step140-R transaction commit smoke remains registered",
  );

  const serviceSource = read(path.resolve(apiRoot, "src/imports/amazon-sp-api-orders-sku-resolution-audit.service.ts"));

  const requiredMarkers = [
    "resolveAmazonSpApiOrdersSkuAliasesForStagingRows",
    "normalizeAmazonSpApiSellerSku",
    "prisma.productSku.findFirst",
    "prisma.productSkuAlias.findFirst",
    "RESOLVED_BY_SKU_CODE",
    "RESOLVED_BY_EXTERNAL_SKU",
    "RESOLVED_BY_ALIAS",
    "RESOLVED_BY_ASIN",
    "UNRESOLVED_SKU",
    "INVALID_PAYLOAD",
    "writesInventoryMovement: false",
    "writesInventoryBalance: false",
    "deductsInventory: false",
    "writesTransaction: false",
    "callsAmazon: false",
  ];

  for (const marker of requiredMarkers) {
    assert(serviceSource.includes(marker), `Step140-S service marker exists: ${marker}`);
  }

  const forbiddenMarkers = [
    "inventoryMovement.create",
    "inventoryBalance.update",
    "transaction.create",
    "importStagingRow.update",
    "importStagingRow.create",
    "importJob.update",
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
    assert(!serviceSource.includes(marker), `Step140-S service does not contain forbidden marker: ${marker}`);
  }

  assert(normalizeAmazonSpApiSellerSku(" seller-sku-alias ") === "SELLER-SKU-ALIAS", "seller SKU normalization trims and uppercases");

  const { prisma, calls } = createMockPrisma();
  const result = await resolveAmazonSpApiOrdersSkuAliasesForStagingRows({
    prisma,
    companyId: "step140-s-company",
    storeId: "step140-s-store",
    rows: buildRows(),
  });

  assert(result.step === "Step140-S", "result step is Step140-S");
  assert(result.source === "amazon-sp-api-orders-sku-resolution-audit", "result source is stable");
  assert(result.companyId === "step140-s-company", "companyId passes through");
  assert(result.storeId === "step140-s-store", "storeId passes through");
  assert(result.resolvedCount === 4, "resolvedCount is 4");
  assert(result.unresolvedCount === 2, "unresolvedCount is 2");
  assert(result.invalidPayloadCount === 1, "invalidPayloadCount is 1");
  assert(result.directSkuResolvedCount === 1, "directSkuResolvedCount is 1");
  assert(result.externalSkuResolvedCount === 1, "externalSkuResolvedCount is 1");
  assert(result.aliasResolvedCount === 1, "aliasResolvedCount is 1");
  assert(result.asinResolvedCount === 1, "asinResolvedCount is 1");
  assert(result.inventoryDeductionReadyCount === 4, "inventoryDeductionReadyCount is 4");
  assert(result.inventoryDeductionBlockedCount === 3, "inventoryDeductionBlockedCount is 3");
  assert(result.unresolvedAudit.length === 3, "unresolved audit has 3 rows");

  const statuses = result.rowResults.map((row) => row.resolutionStatus);
  assert(statuses.includes("RESOLVED_BY_SKU_CODE"), "row result includes direct SKU resolution");
  assert(statuses.includes("RESOLVED_BY_EXTERNAL_SKU"), "row result includes external SKU resolution");
  assert(statuses.includes("RESOLVED_BY_ALIAS"), "row result includes alias resolution");
  assert(statuses.includes("RESOLVED_BY_ASIN"), "row result includes ASIN resolution");
  assert(statuses.filter((status) => status === "UNRESOLVED_SKU").length === 2, "row result includes 2 unresolved SKU rows");
  assert(statuses.includes("INVALID_PAYLOAD"), "row result includes invalid payload row");

  const aliasRow = result.rowResults.find((row) => row.resolutionStatus === "RESOLVED_BY_ALIAS");
  assert(aliasRow && aliasRow.skuId === "sku-alias-target", "alias row resolves target skuId");
  assert(aliasRow && aliasRow.aliasId === "alias-1", "alias row includes aliasId");

  assert(result.boundaries.readsProductSku === true, "boundary reads ProductSku");
  assert(result.boundaries.readsProductSkuAlias === true, "boundary reads ProductSkuAlias");
  assert(result.boundaries.writesImportStagingRow === false, "boundary writes no ImportStagingRow");
  assert(result.boundaries.writesTransaction === false, "boundary writes no Transaction");
  assert(result.boundaries.writesInventoryMovement === false, "boundary writes no InventoryMovement");
  assert(result.boundaries.writesInventoryBalance === false, "boundary writes no InventoryBalance");
  assert(result.boundaries.deductsInventory === false, "boundary does not deduct inventory");
  assert(result.boundaries.callsAmazon === false, "boundary does not call Amazon");
  assert(result.boundaries.changesPrismaSchema === false, "boundary does not change schema");

  assert(calls.productSkuFindFirst.length >= 4, "productSku.findFirst called for direct/external/asin attempts");
  assert(calls.productSkuAliasFindFirst.length >= 2, "productSkuAlias.findFirst called for alias attempts");

  const serialized = JSON.stringify({ result, calls });
  assert(!serialized.includes("inventoryMovement.create"), "result does not include inventory movement create");
  assert(!serialized.includes("inventoryBalance.update"), "result does not include inventory balance update");
  assert(!serialized.includes("transaction.create"), "result does not include transaction create");
  assert(!serialized.includes("AT_SECRET_"), "result exposes no access token");
  assert(!serialized.includes("AWS_SECRET_"), "result exposes no AWS secret");

  console.log("[SMOKE_OK] Step140-S Amazon SP-API Orders SKU resolution audit smoke passed");
  console.log(JSON.stringify({ ok: true, step: "Step140-S", result }, null, 2));
}

main().catch((err) => {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
});
