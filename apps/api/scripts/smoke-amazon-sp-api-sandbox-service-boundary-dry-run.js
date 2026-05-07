#!/usr/bin/env node
"use strict";

process.env.AMAZON_SP_API_SANDBOX_INTERNAL_ENABLED = "true";
process.env.AMAZON_SP_API_REAL_ENABLED = "false";
process.env.AMAZON_SP_API_OAUTH_ENABLED = "false";
process.env.AMAZON_SP_API_TOKEN_PERSISTENCE_ENABLED = "false";

const { PrismaClient } = require("@prisma/client");
const { ImportsService } = require("../dist/src/imports/imports.service");

const prisma = new PrismaClient();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
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
    typeof service.dryRunAmazonSpApiSandboxImportBoundary === "function",
    "ImportsService.dryRunAmazonSpApiSandboxImportBoundary is not available in compiled JS",
  );

  const filename = `step116-c-sp-api-service-boundary-${runId}.json`;

  const orders = [
    {
      amazonOrderId: `SPAPI-STEP116-C-ORDER-1-${runId}`,
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
          orderItemId: `SPAPI-STEP116-C-ITEM-1-${runId}`,
          sellerSku: ` spapi-step116-c-sku-001-${runId} `,
          title: `Step116-C SP-API Service Boundary Product 1 ${runId}`,
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
            fixture: "step116-c-order-1-item-1",
          },
        },
        {
          orderItemId: `SPAPI-STEP116-C-ITEM-2-${runId}`,
          sellerSku: `spapi-step116-c-sku-002-${runId}`,
          title: `Step116-C SP-API Service Boundary Product 2 ${runId}`,
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
            fixture: "step116-c-order-1-item-2",
          },
        },
      ],
      raw: {
        fixture: "step116-c-order-1",
      },
    },
    {
      amazonOrderId: `SPAPI-STEP116-C-ORDER-2-${runId}`,
      purchaseDate: "2026-06-08T01:02:03Z",
      marketplaceId: "A1VC38T7YXB528",
      orderStatus: "Shipped",
      fulfillmentChannel: "MFN",
      salesChannel: "Amazon.co.jp",
      orderTotal: {
        currencyCode: "JPY",
        amount: "3980",
      },
      items: [
        {
          orderItemId: `SPAPI-STEP116-C-ITEM-3-${runId}`,
          sellerSku: `spapi-step116-c-sku-003-${runId}`,
          title: `Step116-C SP-API Service Boundary Product 3 ${runId}`,
          quantityOrdered: "1",
          itemPrice: {
            currencyCode: "JPY",
            amount: "3980",
          },
          itemTax: {
            currencyCode: "JPY",
            amount: "398",
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
            amount: "0",
          },
          promotionDiscountTax: {
            currencyCode: "JPY",
            amount: "0",
          },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "300" } },
          ],
          raw: {
            fixture: "step116-c-order-2-item-1",
          },
        },
      ],
      raw: {
        fixture: "step116-c-order-2",
      },
    },
  ];

  const result = await service.dryRunAmazonSpApiSandboxImportBoundary({
    companyId: company.id,
    filename,
    orders,
  });

  assert(result.ok === true, "result.ok mismatch");
  assert(result.rollbackVerified === true, "rollbackVerified mismatch");
  assert(result.companyId === company.id, "companyId mismatch");
  assert(result.filename === filename, "filename mismatch");
  assert(result.summary.orders === 2, "summary.orders mismatch");
  assert(result.summary.rows === 3, "summary.rows mismatch");
  assert(result.summary.sourceType === "amazon-sp-api-sandbox", "summary.sourceType mismatch");
  assert(result.summary.normalizedSourceType === "AMAZON_ORDER_SP_API", "summary.normalizedSourceType mismatch");
  assert(Array.isArray(result.summary.businessMonths), "businessMonths must be array");
  assert(result.summary.businessMonths.includes("2026-05"), "businessMonths missing 2026-05");
  assert(result.summary.businessMonths.includes("2026-06"), "businessMonths missing 2026-06");

  assert(Array.isArray(result.rows), "rows must be array");
  assert(result.rows.length === 3, `expected 3 rows, got ${result.rows.length}`);

  const first = result.rows[0].payload;
  const second = result.rows[1].payload;
  const third = result.rows[2].payload;

  for (const [index, row] of result.rows.entries()) {
    const payload = row.payload;

    assert(row.stagingRowId, `row ${index} stagingRowId missing`);
    assert(row.importJobId === result.importJobId, `row ${index} importJobId mismatch`);
    assert(row.dedupeHash, `row ${index} dedupeHash missing`);

    assert(payload.contractVersion === "amazon-order-normalized-v1", `payload ${index} contractVersion mismatch`);
    assert(payload.sourceType === "AMAZON_ORDER_SP_API", `payload ${index} sourceType mismatch`);
    assert(payload.entityType === "transaction", `payload ${index} entityType mismatch`);
    assert(payload.module === "store-orders", `payload ${index} module mismatch`);
    assert(payload.importJobId === result.importJobId, `payload ${index} importJobId mismatch`);
    assert(payload.sourceFileName === filename, `payload ${index} sourceFileName mismatch`);
    assert(payload.orderId && payload.amazonOrderId, `payload ${index} order id missing`);
    assert(payload.sellerSku && payload.normalizedSellerSku, `payload ${index} sellerSku missing`);
    assert(payload.normalizedSellerSku === String(payload.sellerSku).replace(/\s+/g, "").toUpperCase(), `payload ${index} normalizedSellerSku mismatch`);
    assert(payload.currency === "JPY", `payload ${index} currency mismatch`);
    assert(payload.inventoryDeduction === null, `payload ${index} inventoryDeduction should stay null`);
    assert(payload.inventoryAudit === null, `payload ${index} inventoryAudit should stay null`);
    assert(payload.raw && payload.raw.order && payload.raw.item, `payload ${index} raw order/item missing`);
  }

  assert(first.sourceRowNo === 1, "first sourceRowNo mismatch");
  assert(first.businessMonth === "2026-05", "first businessMonth mismatch");
  assert(first.quantity === 2, "first quantity mismatch");
  assert(first.grossAmount === 8280, "first grossAmount mismatch");
  assert(first.netAmount === 7110, "first netAmount mismatch");
  assert(first.feeAmount === 1050, "first feeAmount mismatch");
  assert(first.commissionFeeAmount === 600, "first commissionFeeAmount mismatch");
  assert(first.fbaFeeAmount === 450, "first fbaFeeAmount mismatch");
  assert(first.shippingTaxAmount === 30, "first shippingTaxAmount mismatch");
  assert(first.promotionDiscountTaxAmount === 12, "first promotionDiscountTaxAmount mismatch");

  assert(second.sourceRowNo === 2, "second sourceRowNo mismatch");
  assert(second.businessMonth === "2026-05", "second businessMonth mismatch");
  assert(second.quantity === 1, "second quantity mismatch");
  assert(second.grossAmount === 5000, "second grossAmount mismatch");
  assert(second.netAmount === 4340, "second netAmount mismatch");
  assert(second.feeAmount === 580, "second feeAmount mismatch");
  assert(second.commissionFeeAmount === 360, "second commissionFeeAmount mismatch");
  assert(second.fbaFeeAmount === 220, "second fbaFeeAmount mismatch");
  assert(second.promotionDiscountTaxAmount === 8, "second promotionDiscountTaxAmount mismatch");

  assert(third.sourceRowNo === 3, "third sourceRowNo mismatch");
  assert(third.businessMonth === "2026-06", "third businessMonth mismatch");
  assert(third.quantity === 1, "third quantity mismatch");
  assert(third.grossAmount === 3980, "third grossAmount mismatch");
  assert(third.netAmount === 3680, "third netAmount mismatch");
  assert(third.feeAmount === 300, "third feeAmount mismatch");
  assert(third.commissionFeeAmount === 300, "third commissionFeeAmount mismatch");
  assert(third.fbaFeeAmount === 0, "third fbaFeeAmount mismatch");

  const leakedJob = await prisma.importJob.findFirst({
    where: { filename },
    select: { id: true },
  });

  assert(!leakedJob, "service boundary dry-run leaked ImportJob outside method");

  const leakedRows = await prisma.importStagingRow.findMany({
    where: {
      dedupeHash: {
        in: result.rows.map((row) => row.dedupeHash),
      },
    },
    select: { id: true, dedupeHash: true },
    take: 10,
  });

  assert(leakedRows.length === 0, `service boundary dry-run leaked ImportStagingRow count=${leakedRows.length}`);

  console.log("[SMOKE_OK] amazon sp-api sandbox service boundary dry-run smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        runId,
        company,
        result,
        rollbackLeakCheck: {
          importJobLeaked: Boolean(leakedJob),
          stagingRowsLeaked: leakedRows.length,
        },
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
