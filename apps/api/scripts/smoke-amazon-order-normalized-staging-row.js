#!/usr/bin/env node
"use strict";

const { PrismaClient } = require("@prisma/client");
const { ImportsService } = require("../dist/src/imports/imports.service");

const prisma = new PrismaClient();

const ROLLBACK_MESSAGE = "ROLLBACK_EXPECTED_STEP115_C2";

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

  const service = new ImportsService(prisma);

  assert(
    typeof service.buildStoreOrderNormalizedPayload === "function",
    "ImportsService.buildStoreOrderNormalizedPayload is not available in compiled JS",
  );

  const orderId = `STEP115-C2-ORDER-${runId}`;
  const sellerSku = `step115-c2-sku-${runId}`;

  const fact = {
    rowNo: 7,
    orderId,
    orderDate: "2026-05-07T10:15:00.000Z",
    sku: sellerSku,
    productName: `Step115 C2 Normalized Contract Product ${runId}`,
    quantity: 3,
    amount: 12980,

    grossAmount: 12980,
    netAmount: 11340,
    feeAmount: 1640,
    taxAmount: 1180,
    shippingAmount: 600,
    promotionAmount: 200,

    itemSalesAmount: 12980,
    itemSalesTaxAmount: 1180,
    shippingTaxAmount: 60,
    promotionDiscountAmount: 200,
    promotionDiscountTaxAmount: 20,
    commissionFeeAmount: 900,
    fbaFeeAmount: 740,

    rawTransactionType: "注文",
    signedAmount: 11340,
    description: "Step115-C2 normalized staging row rollback smoke",
    store: "Amazon JP",
    fulfillment: "FBA",
    rawLabel: "Step115 C2 order row",
  };

  const businessMonth = "2026-05";
  const dedupeHash = `step115-c2-dedupe-${runId}`;

  const normalizedPayload = service.buildStoreOrderNormalizedPayload({
    fact,
    businessMonth,
    dedupeHash,
  });

  assert(normalizedPayload.contractVersion === "amazon-order-normalized-v1", "contractVersion mismatch before DB write");
  assert(normalizedPayload.sourceType === "AMAZON_ORDER_CSV", "sourceType mismatch before DB write");
  assert(normalizedPayload.entityType === "transaction", "entityType mismatch before DB write");
  assert(normalizedPayload.module === "store-orders", "module mismatch before DB write");
  assert(normalizedPayload.orderId === orderId, "orderId mismatch before DB write");
  assert(normalizedPayload.amazonOrderId === orderId, "amazonOrderId mismatch before DB write");
  assert(normalizedPayload.sku === sellerSku, "legacy sku mismatch before DB write");
  assert(normalizedPayload.skuCode === sellerSku, "skuCode mismatch before DB write");
  assert(normalizedPayload.sellerSku === sellerSku, "sellerSku mismatch before DB write");
  assert(normalizedPayload.normalizedSellerSku === sellerSku.toUpperCase(), "normalizedSellerSku mismatch before DB write");
  assert(normalizedPayload.grossAmount === 12980, "grossAmount mismatch before DB write");
  assert(normalizedPayload.netAmount === 11340, "netAmount mismatch before DB write");
  assert(normalizedPayload.feeAmount === 1640, "feeAmount mismatch before DB write");
  assert(normalizedPayload.commissionFeeAmount === 900, "commissionFeeAmount mismatch before DB write");
  assert(normalizedPayload.fbaFeeAmount === 740, "fbaFeeAmount mismatch before DB write");
  assert(normalizedPayload.promotionDiscountTaxAmount === 20, "promotionDiscountTaxAmount mismatch before DB write");
  assert(normalizedPayload.dedupeHash === dedupeHash, "dedupeHash mismatch before DB write");

  let captured = null;

  try {
    await prisma.$transaction(async (tx) => {
      const importJob = await tx.importJob.create({
        data: {
          companyId: company.id,
          domain: "store-orders",
          module: "store-orders",
          sourceType: "amazon-csv",
          filename: `step115-c2-normalized-contract-${runId}.csv`,
          status: "SUCCEEDED",
          totalRows: 1,
          successRows: 1,
          failedRows: 0,
          fileMonthsJson: [businessMonth],
          importedAt: new Date(),
        },
      });

      const stagingRow = await tx.importStagingRow.create({
        data: {
          importJob: {
            connect: { id: importJob.id },
          },
          company: {
            connect: { id: company.id },
          },
          module: "store-orders",
          rowNo: fact.rowNo,
          businessMonth,
          matchStatus: "new",
          matchReason: "STEP115_C2_NORMALIZED_CONTRACT_ROLLBACK_SMOKE",
          dedupeHash,
          rawPayloadJson: {
            orderId,
            sku: sellerSku,
            quantity: fact.quantity,
            grossAmount: fact.grossAmount,
          },
          normalizedPayloadJson: {
            ...normalizedPayload,
            importJobId: importJob.id,
            sourceFileName: importJob.filename,
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

      const payload = asObj(reloaded.normalizedPayloadJson);

      assert(payload.contractVersion === "amazon-order-normalized-v1", "DB contractVersion mismatch");
      assert(payload.sourceType === "AMAZON_ORDER_CSV", "DB sourceType mismatch");
      assert(payload.entityType === "transaction", "DB entityType mismatch");
      assert(payload.module === "store-orders", "DB module mismatch");
      assert(payload.importJobId === importJob.id, "DB importJobId mismatch");
      assert(payload.sourceFileName === importJob.filename, "DB sourceFileName mismatch");

      assert(payload.orderId === orderId, "DB orderId mismatch");
      assert(payload.amazonOrderId === orderId, "DB amazonOrderId mismatch");
      assert(payload.sku === sellerSku, "DB legacy sku mismatch");
      assert(payload.skuCode === sellerSku, "DB skuCode mismatch");
      assert(payload.sellerSku === sellerSku, "DB sellerSku mismatch");
      assert(payload.normalizedSellerSku === sellerSku.toUpperCase(), "DB normalizedSellerSku mismatch");

      assert(payload.quantity === 3, "DB quantity mismatch");
      assert(payload.grossAmount === 12980, "DB grossAmount mismatch");
      assert(payload.netAmount === 11340, "DB netAmount mismatch");
      assert(payload.feeAmount === 1640, "DB feeAmount mismatch");
      assert(payload.commissionFeeAmount === 900, "DB commissionFeeAmount mismatch");
      assert(payload.fbaFeeAmount === 740, "DB fbaFeeAmount mismatch");
      assert(payload.shippingTaxAmount === 60, "DB shippingTaxAmount mismatch");
      assert(payload.promotionDiscountTaxAmount === 20, "DB promotionDiscountTaxAmount mismatch");
      assert(payload.dedupeHash === dedupeHash, "DB dedupeHash mismatch");

      captured = {
        importJobId: importJob.id,
        stagingRowId: stagingRow.id,
        reloaded,
        payload,
      };

      throw new Error(ROLLBACK_MESSAGE);
    });
  } catch (err) {
    if (!err || err.message !== ROLLBACK_MESSAGE) {
      throw err;
    }
    console.log("[ROLLBACK_EXPECTED] transaction intentionally rolled back");
  }

  assert(captured, "rollback smoke did not capture staging row");

  const leakedJob = await prisma.importJob.findFirst({
    where: { filename: `step115-c2-normalized-contract-${runId}.csv` },
    select: { id: true },
  });

  const leakedRow = await prisma.importStagingRow.findFirst({
    where: { dedupeHash },
    select: { id: true },
  });

  assert(!leakedJob, "rollback failed: ImportJob leaked");
  assert(!leakedRow, "rollback failed: ImportStagingRow leaked");

  console.log("[SMOKE_OK] amazon order normalized staging row rollback smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        runId,
        company,
        normalizedPayload,
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
