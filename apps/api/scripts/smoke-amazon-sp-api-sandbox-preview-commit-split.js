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

function buildOrders(runId) {
  return [
    {
      amazonOrderId: `SPAPI-STEP116-D-ORDER-1-${runId}`,
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
          orderItemId: `SPAPI-STEP116-D-ITEM-1-${runId}`,
          sellerSku: ` spapi-step116-d-sku-001-${runId} `,
          title: `Step116-D SP-API Preview Commit Product 1 ${runId}`,
          quantityOrdered: "2",
          itemPrice: { currencyCode: "JPY", amount: "7980" },
          itemTax: { currencyCode: "JPY", amount: "798" },
          shippingPrice: { currencyCode: "JPY", amount: "300" },
          shippingTax: { currencyCode: "JPY", amount: "30" },
          promotionDiscount: { currencyCode: "JPY", amount: "120" },
          promotionDiscountTax: { currencyCode: "JPY", amount: "12" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "600" } },
            { type: "FBA", amount: { currencyCode: "JPY", amount: "450" } },
          ],
          raw: { fixture: "step116-d-order-1-item-1" },
        },
        {
          orderItemId: `SPAPI-STEP116-D-ITEM-2-${runId}`,
          sellerSku: `spapi-step116-d-sku-002-${runId}`,
          title: `Step116-D SP-API Preview Commit Product 2 ${runId}`,
          quantityOrdered: 1,
          itemPrice: { currencyCode: "JPY", amount: "5000" },
          itemTax: { currencyCode: "JPY", amount: "500" },
          shippingPrice: { currencyCode: "JPY", amount: "0" },
          shippingTax: { currencyCode: "JPY", amount: "0" },
          promotionDiscount: { currencyCode: "JPY", amount: "80" },
          promotionDiscountTax: { currencyCode: "JPY", amount: "8" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "360" } },
            { type: "FBA", amount: { currencyCode: "JPY", amount: "220" } },
          ],
          raw: { fixture: "step116-d-order-1-item-2" },
        },
      ],
      raw: { fixture: "step116-d-order-1" },
    },
    {
      amazonOrderId: `SPAPI-STEP116-D-ORDER-2-${runId}`,
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
          orderItemId: `SPAPI-STEP116-D-ITEM-3-${runId}`,
          sellerSku: `spapi-step116-d-sku-003-${runId}`,
          title: `Step116-D SP-API Preview Commit Product 3 ${runId}`,
          quantityOrdered: "1",
          itemPrice: { currencyCode: "JPY", amount: "3980" },
          itemTax: { currencyCode: "JPY", amount: "398" },
          shippingPrice: { currencyCode: "JPY", amount: "0" },
          shippingTax: { currencyCode: "JPY", amount: "0" },
          promotionDiscount: { currencyCode: "JPY", amount: "0" },
          promotionDiscountTax: { currencyCode: "JPY", amount: "0" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "300" } },
          ],
          raw: { fixture: "step116-d-order-2-item-1" },
        },
      ],
      raw: { fixture: "step116-d-order-2" },
    },
  ];
}

function assertPayload(payload, filename, index) {
  assert(payload.contractVersion === "amazon-order-normalized-v1", `payload ${index} contractVersion mismatch`);
  assert(payload.sourceType === "AMAZON_ORDER_SP_API", `payload ${index} sourceType mismatch`);
  assert(payload.entityType === "transaction", `payload ${index} entityType mismatch`);
  assert(payload.module === "store-orders", `payload ${index} module mismatch`);
  assert(payload.sourceFileName === filename, `payload ${index} sourceFileName mismatch`);
  assert(payload.orderId && payload.amazonOrderId, `payload ${index} order id missing`);
  assert(payload.sellerSku && payload.normalizedSellerSku, `payload ${index} sellerSku missing`);
  assert(
    payload.normalizedSellerSku === String(payload.sellerSku).replace(/\s+/g, "").toUpperCase(),
    `payload ${index} normalizedSellerSku mismatch`,
  );
  assert(payload.currency === "JPY", `payload ${index} currency mismatch`);
  assert(payload.inventoryDeduction === null, `payload ${index} inventoryDeduction should stay null`);
  assert(payload.inventoryAudit === null, `payload ${index} inventoryAudit should stay null`);
  assert(payload.raw && payload.raw.order && payload.raw.item, `payload ${index} raw order/item missing`);
}

async function main() {
  const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const company = await resolveCompanyId();
  const service = new ImportsService(prisma);

  assert(
    typeof service.previewAmazonSpApiSandboxOrders === "function",
    "ImportsService.previewAmazonSpApiSandboxOrders is not available in compiled JS",
  );
  assert(
    typeof service.commitAmazonSpApiSandboxOrdersToStaging === "function",
    "ImportsService.commitAmazonSpApiSandboxOrdersToStaging is not available in compiled JS",
  );
  assert(
    typeof service.dryRunAmazonSpApiSandboxImportBoundary === "function",
    "ImportsService.dryRunAmazonSpApiSandboxImportBoundary compatibility wrapper is missing",
  );

  const filename = `step116-d-sp-api-preview-commit-${runId}.json`;
  const orders = buildOrders(runId);

  const preview = await service.previewAmazonSpApiSandboxOrders({
    companyId: company.id,
    filename,
    orders,
  });

  assert(preview.ok === true, "preview.ok mismatch");
  assert(preview.companyId === company.id, "preview companyId mismatch");
  assert(preview.filename === filename, "preview filename mismatch");
  assert(preview.summary.orders === 2, "preview summary.orders mismatch");
  assert(preview.summary.rows === 3, "preview summary.rows mismatch");
  assert(preview.summary.sourceType === "amazon-sp-api-sandbox", "preview summary.sourceType mismatch");
  assert(preview.summary.normalizedSourceType === "AMAZON_ORDER_SP_API", "preview normalizedSourceType mismatch");
  assert(preview.summary.businessMonths.includes("2026-05"), "preview businessMonths missing 2026-05");
  assert(preview.summary.businessMonths.includes("2026-06"), "preview businessMonths missing 2026-06");
  assert(preview.rows.length === 3, `expected 3 preview rows, got ${preview.rows.length}`);

  for (const [index, row] of preview.rows.entries()) {
    assert(row.rowNo === index + 1, `preview row ${index} rowNo mismatch`);
    assert(row.dedupeHash, `preview row ${index} dedupeHash missing`);
    assert(row.payload.importJobId === null, `preview row ${index} importJobId should be null`);
    assertPayload(row.payload, filename, index);
  }

  const first = preview.rows[0].payload;
  const second = preview.rows[1].payload;
  const third = preview.rows[2].payload;

  assert(first.businessMonth === "2026-05", "first preview businessMonth mismatch");
  assert(first.quantity === 2, "first preview quantity mismatch");
  assert(first.grossAmount === 8280, "first preview grossAmount mismatch");
  assert(first.netAmount === 7110, "first preview netAmount mismatch");
  assert(first.feeAmount === 1050, "first preview feeAmount mismatch");
  assert(first.commissionFeeAmount === 600, "first preview commissionFeeAmount mismatch");
  assert(first.fbaFeeAmount === 450, "first preview fbaFeeAmount mismatch");
  assert(first.shippingTaxAmount === 30, "first preview shippingTaxAmount mismatch");
  assert(first.promotionDiscountTaxAmount === 12, "first preview promotionDiscountTaxAmount mismatch");

  assert(second.businessMonth === "2026-05", "second preview businessMonth mismatch");
  assert(second.quantity === 1, "second preview quantity mismatch");
  assert(second.grossAmount === 5000, "second preview grossAmount mismatch");
  assert(second.netAmount === 4340, "second preview netAmount mismatch");
  assert(second.feeAmount === 580, "second preview feeAmount mismatch");

  assert(third.businessMonth === "2026-06", "third preview businessMonth mismatch");
  assert(third.quantity === 1, "third preview quantity mismatch");
  assert(third.grossAmount === 3980, "third preview grossAmount mismatch");
  assert(third.netAmount === 3680, "third preview netAmount mismatch");
  assert(third.feeAmount === 300, "third preview feeAmount mismatch");

  const leakedPreviewJob = await prisma.importJob.findFirst({
    where: { filename },
    select: { id: true },
  });
  assert(!leakedPreviewJob, "preview leaked ImportJob");

  const commitResult = await service.commitAmazonSpApiSandboxOrdersToStaging({
    companyId: company.id,
    filename,
    preview,
    dryRun: true,
  });

  assert(commitResult.ok === true, "commitResult.ok mismatch");
  assert(commitResult.dryRun === true, "commitResult.dryRun mismatch");
  assert(commitResult.rollbackVerified === true, "commitResult.rollbackVerified mismatch");
  assert(commitResult.companyId === company.id, "commitResult companyId mismatch");
  assert(commitResult.filename === filename, "commitResult filename mismatch");
  assert(commitResult.summary.rows === 3, "commitResult rows mismatch");
  assert(commitResult.rows.length === 3, "commitResult row length mismatch");

  for (const [index, row] of commitResult.rows.entries()) {
    assert(row.stagingRowId, `commit row ${index} stagingRowId missing`);
    assert(row.importJobId === commitResult.importJobId, `commit row ${index} importJobId mismatch`);
    assert(row.dedupeHash === preview.rows[index].dedupeHash, `commit row ${index} dedupeHash mismatch`);
    assert(row.payload.importJobId === commitResult.importJobId, `commit row ${index} payload importJobId mismatch`);
    assertPayload(row.payload, filename, index);
  }

  const wrapperResult = await service.dryRunAmazonSpApiSandboxImportBoundary({
    companyId: company.id,
    filename: `step116-d-wrapper-${runId}.json`,
    orders,
  });

  assert(wrapperResult.ok === true, "wrapperResult.ok mismatch");
  assert(wrapperResult.rollbackVerified === true, "wrapperResult.rollbackVerified mismatch");
  assert(wrapperResult.summary.rows === 3, "wrapperResult rows mismatch");
  assert(wrapperResult.rows.length === 3, "wrapperResult row length mismatch");

  const leakedJob = await prisma.importJob.findFirst({
    where: { filename },
    select: { id: true },
  });
  assert(!leakedJob, "dry-run commit leaked ImportJob");

  const leakedRows = await prisma.importStagingRow.findMany({
    where: {
      dedupeHash: {
        in: preview.rows.map((row) => row.dedupeHash),
      },
    },
    select: { id: true, dedupeHash: true },
    take: 10,
  });
  assert(leakedRows.length === 0, `dry-run commit leaked ImportStagingRow count=${leakedRows.length}`);

  console.log("[SMOKE_OK] amazon sp-api sandbox preview/commit split smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        runId,
        company,
        preview,
        commitResult,
        wrapperResult: {
          ok: wrapperResult.ok,
          rollbackVerified: wrapperResult.rollbackVerified,
          summary: wrapperResult.summary,
          rows: wrapperResult.rows.length,
        },
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
