#!/usr/bin/env node
"use strict";

const { PrismaClient } = require("@prisma/client");
const {
  buildAmazonSpApiSandboxNormalizedPayloads,
} = require("../dist/src/imports/amazon-sp-api-sandbox-adapter");

const prisma = new PrismaClient();

const ROLLBACK_MESSAGE = "ROLLBACK_EXPECTED_STEP116_B";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function asObj(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

async function resolveCompanyId() {
  const company = await prisma.company.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  if (!company) {
    throw new Error("No company found for smoke");
  }

  return company;
}

async function main() {
  const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const company = await resolveCompanyId();

  const orderId = `SPAPI-SANDBOX-ORDER-STEP116-B-${runId}`;
  const sourceFileName = `step116-b-sp-api-sandbox-${runId}.json`;

  const order = {
    amazonOrderId: orderId,
    purchaseDate: "2026-05-07T12:34:56Z",
    lastUpdateDate: "2026-05-07T12:55:00Z",
    marketplaceId: "A1VC38T7YXB528",
    orderStatus: "Shipped",
    fulfillmentChannel: "AFN",
    salesChannel: "Amazon.co.jp",
    orderTotal: {
      currencyCode: "JPY",
      amount: "12980",
    },
    items: [
      {
        orderItemId: `SPAPI-SANDBOX-ITEM-1-${runId}`,
        sellerSku: ` spapi-step116-b-sku-001-${runId} `,
        title: `Step116-B SP-API Sandbox Product 1 ${runId}`,
        quantityOrdered: "2",
        itemPrice: {
          currencyCode: "JPY",
          amount: "7980",
        },
        itemTax: {
          currencyCode: "JPY",
          amount: "798",
        },
        shippingPrice: {
          currencyCode: "JPY",
          amount: "300",
        },
        shippingTax: {
          currencyCode: "JPY",
          amount: "30",
        },
        promotionDiscount: {
          currencyCode: "JPY",
          amount: "120",
        },
        promotionDiscountTax: {
          currencyCode: "JPY",
          amount: "12",
        },
        feeBreakdown: [
          { type: "Commission", amount: { currencyCode: "JPY", amount: "600" } },
          { type: "FBA", amount: { currencyCode: "JPY", amount: "450" } },
        ],
        raw: {
          fixture: "step116-b-item-1",
        },
      },
      {
        orderItemId: `SPAPI-SANDBOX-ITEM-2-${runId}`,
        sellerSku: `spapi-step116-b-sku-002-${runId}`,
        title: `Step116-B SP-API Sandbox Product 2 ${runId}`,
        quantityOrdered: 1,
        itemPrice: {
          currencyCode: "JPY",
          amount: "5000",
        },
        itemTax: {
          currencyCode: "JPY",
          amount: "500",
        },
        shippingPrice: {
          currencyCode: "JPY",
          amount: "0",
        },
        shippingTax: {
          currencyCode: "JPY",
          amount: "0",
        },
        promotionDiscount: {
          currencyCode: "JPY",
          amount: "80",
        },
        promotionDiscountTax: {
          currencyCode: "JPY",
          amount: "8",
        },
        feeBreakdown: [
          { type: "Commission", amount: { currencyCode: "JPY", amount: "360" } },
          { type: "FBA", amount: { currencyCode: "JPY", amount: "220" } },
        ],
        raw: {
          fixture: "step116-b-item-2",
        },
      },
    ],
    raw: {
      fixture: "step116-b-order",
    },
  };

  const prePayloads = buildAmazonSpApiSandboxNormalizedPayloads({
    importJobId: "step116-b-pre-import-job",
    sourceFileName,
    startRowNo: 20,
    order,
  });

  assert(Array.isArray(prePayloads), "prePayloads must be array");
  assert(prePayloads.length === 2, `expected 2 prePayloads, got ${prePayloads.length}`);

  for (const [index, payload] of prePayloads.entries()) {
    assert(payload.contractVersion === "amazon-order-normalized-v1", `pre payload ${index} contractVersion mismatch`);
    assert(payload.sourceType === "AMAZON_ORDER_SP_API", `pre payload ${index} sourceType mismatch`);
    assert(payload.entityType === "transaction", `pre payload ${index} entityType mismatch`);
    assert(payload.module === "store-orders", `pre payload ${index} module mismatch`);
    assert(payload.orderId === orderId, `pre payload ${index} orderId mismatch`);
    assert(payload.amazonOrderId === orderId, `pre payload ${index} amazonOrderId mismatch`);
    assert(payload.occurredAt === "2026-05-07T12:34:56Z", `pre payload ${index} occurredAt mismatch`);
    assert(payload.businessMonth === "2026-05", `pre payload ${index} businessMonth mismatch`);
    assert(payload.currency === "JPY", `pre payload ${index} currency mismatch`);
    assert(payload.inventoryDeduction === null, `pre payload ${index} inventoryDeduction should stay null`);
    assert(payload.inventoryAudit === null, `pre payload ${index} inventoryAudit should stay null`);
    assert(payload.raw && payload.raw.order && payload.raw.item, `pre payload ${index} raw order/item missing`);
  }

  assert(prePayloads[0].sourceRowNo === 20, "first sourceRowNo mismatch before DB");
  assert(prePayloads[1].sourceRowNo === 21, "second sourceRowNo mismatch before DB");

  assert(prePayloads[0].quantity === 2, "first quantity mismatch before DB");
  assert(prePayloads[0].grossAmount === 8280, "first grossAmount mismatch before DB");
  assert(prePayloads[0].netAmount === 7110, "first netAmount mismatch before DB");
  assert(prePayloads[0].feeAmount === 1050, "first feeAmount mismatch before DB");
  assert(prePayloads[0].commissionFeeAmount === 600, "first commissionFeeAmount mismatch before DB");
  assert(prePayloads[0].fbaFeeAmount === 450, "first fbaFeeAmount mismatch before DB");
  assert(prePayloads[0].shippingTaxAmount === 30, "first shippingTaxAmount mismatch before DB");
  assert(prePayloads[0].promotionDiscountTaxAmount === 12, "first promotionDiscountTaxAmount mismatch before DB");

  assert(prePayloads[1].quantity === 1, "second quantity mismatch before DB");
  assert(prePayloads[1].grossAmount === 5000, "second grossAmount mismatch before DB");
  assert(prePayloads[1].netAmount === 4340, "second netAmount mismatch before DB");
  assert(prePayloads[1].feeAmount === 580, "second feeAmount mismatch before DB");
  assert(prePayloads[1].commissionFeeAmount === 360, "second commissionFeeAmount mismatch before DB");
  assert(prePayloads[1].fbaFeeAmount === 220, "second fbaFeeAmount mismatch before DB");
  assert(prePayloads[1].promotionDiscountTaxAmount === 8, "second promotionDiscountTaxAmount mismatch before DB");

  let captured = null;

  try {
    await prisma.$transaction(async (tx) => {
      const importJob = await tx.importJob.create({
        data: {
          companyId: company.id,
          domain: "store-orders",
          module: "store-orders",
          sourceType: "amazon-sp-api-sandbox",
          filename: sourceFileName,
          status: "SUCCEEDED",
          totalRows: prePayloads.length,
          successRows: prePayloads.length,
          failedRows: 0,
          fileMonthsJson: ["2026-05"],
          importedAt: new Date(),
        },
      });

      const payloads = buildAmazonSpApiSandboxNormalizedPayloads({
        importJobId: importJob.id,
        sourceFileName: importJob.filename,
        startRowNo: 20,
        order,
      });

      const createdRows = [];

      for (const payload of payloads) {
        const dedupeHash = `step116-b-spapi-${runId}-${payload.sourceRowNo}-${payload.normalizedSellerSku}`;

        const stagingRow = await tx.importStagingRow.create({
          data: {
            importJob: {
              connect: { id: importJob.id },
            },
            company: {
              connect: { id: company.id },
            },
            module: "store-orders",
            rowNo: payload.sourceRowNo,
            businessMonth: payload.businessMonth,
            matchStatus: "new",
            matchReason: "STEP116_B_SP_API_SANDBOX_ROLLBACK_SMOKE",
            dedupeHash,
            rawPayloadJson: {
              orderId: payload.orderId,
              amazonOrderId: payload.amazonOrderId,
              sellerSku: payload.sellerSku,
              normalizedSellerSku: payload.normalizedSellerSku,
              quantity: payload.quantity,
              grossAmount: payload.grossAmount,
              sourceType: payload.sourceType,
            },
            normalizedPayloadJson: {
              ...payload,
              dedupeHash,
            },
          },
        });

        const reloaded = await tx.importStagingRow.findUniqueOrThrow({
          where: { id: stagingRow.id },
          select: {
            id: true,
            importJobId: true,
            module: true,
            rowNo: true,
            businessMonth: true,
            matchStatus: true,
            matchReason: true,
            dedupeHash: true,
            normalizedPayloadJson: true,
          },
        });

        const dbPayload = asObj(reloaded.normalizedPayloadJson);

        assert(reloaded.importJobId === importJob.id, "DB importJobId relation mismatch");
        assert(reloaded.module === "store-orders", "DB staging module mismatch");
        assert(reloaded.businessMonth === "2026-05", "DB staging businessMonth mismatch");
        assert(reloaded.matchStatus === "new", "DB staging matchStatus mismatch");
        assert(reloaded.matchReason === "STEP116_B_SP_API_SANDBOX_ROLLBACK_SMOKE", "DB staging matchReason mismatch");

        assert(dbPayload.contractVersion === "amazon-order-normalized-v1", "DB contractVersion mismatch");
        assert(dbPayload.sourceType === "AMAZON_ORDER_SP_API", "DB sourceType mismatch");
        assert(dbPayload.entityType === "transaction", "DB entityType mismatch");
        assert(dbPayload.module === "store-orders", "DB module mismatch");
        assert(dbPayload.importJobId === importJob.id, "DB normalizedPayload importJobId mismatch");
        assert(dbPayload.sourceFileName === importJob.filename, "DB normalizedPayload sourceFileName mismatch");

        assert(dbPayload.orderId === orderId, "DB orderId mismatch");
        assert(dbPayload.amazonOrderId === orderId, "DB amazonOrderId mismatch");
        assert(dbPayload.sellerSku, "DB sellerSku missing");
        assert(dbPayload.sku === dbPayload.sellerSku, "DB legacy sku should equal sellerSku");
        assert(dbPayload.skuCode === dbPayload.sellerSku, "DB skuCode should equal sellerSku");
        assert(dbPayload.normalizedSellerSku === String(dbPayload.sellerSku).replace(/\s+/g, "").toUpperCase(), "DB normalizedSellerSku mismatch");

        assert(dbPayload.occurredAt === "2026-05-07T12:34:56Z", "DB occurredAt mismatch");
        assert(dbPayload.businessMonth === "2026-05", "DB businessMonth mismatch");
        assert(dbPayload.currency === "JPY", "DB currency mismatch");

        assert(Number.isFinite(dbPayload.quantity), "DB quantity must be finite");
        assert(Number.isFinite(dbPayload.grossAmount), "DB grossAmount must be finite");
        assert(Number.isFinite(dbPayload.netAmount), "DB netAmount must be finite");
        assert(Number.isFinite(dbPayload.feeAmount), "DB feeAmount must be finite");
        assert(Number.isFinite(dbPayload.commissionFeeAmount), "DB commissionFeeAmount must be finite");
        assert(Number.isFinite(dbPayload.fbaFeeAmount), "DB fbaFeeAmount must be finite");
        assert(Number.isFinite(dbPayload.shippingTaxAmount), "DB shippingTaxAmount must be finite");
        assert(Number.isFinite(dbPayload.promotionDiscountTaxAmount), "DB promotionDiscountTaxAmount must be finite");

        assert(dbPayload.inventoryDeduction === null, "DB inventoryDeduction should stay null");
        assert(dbPayload.inventoryAudit === null, "DB inventoryAudit should stay null");
        assert(dbPayload.raw && dbPayload.raw.order && dbPayload.raw.item, "DB raw order/item missing");

        createdRows.push({
          stagingRowId: stagingRow.id,
          reloaded,
          payload: dbPayload,
        });
      }

      assert(createdRows.length === 2, `expected 2 created rows, got ${createdRows.length}`);

      captured = {
        importJobId: importJob.id,
        filename: importJob.filename,
        rows: createdRows,
      };

      throw new Error(ROLLBACK_MESSAGE);
    });
  } catch (err) {
    if (!err || err.message !== ROLLBACK_MESSAGE) {
      throw err;
    }
    console.log("[ROLLBACK_EXPECTED] transaction intentionally rolled back");
  }

  assert(captured, "rollback smoke did not capture staging rows");

  const leakedJob = await prisma.importJob.findFirst({
    where: { filename: sourceFileName },
    select: { id: true },
  });

  const leakedRows = await prisma.importStagingRow.findMany({
    where: {
      matchReason: "STEP116_B_SP_API_SANDBOX_ROLLBACK_SMOKE",
    },
    select: { id: true, importJobId: true },
    take: 10,
  });

  assert(!leakedJob, "rollback failed: ImportJob leaked");
  assert(leakedRows.length === 0, `rollback failed: ImportStagingRow leaked count=${leakedRows.length}`);

  console.log("[SMOKE_OK] amazon sp-api sandbox staging row rollback smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        runId,
        company,
        orderId,
        sourceFileName,
        prePayloads,
        captured,
        rollbackVerified: true,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error("[SMOKE_ERROR]", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
