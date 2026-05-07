#!/usr/bin/env node
"use strict";

const { PrismaClient } = require("@prisma/client");
const { ImportsService } = require("../dist/src/imports/imports.service");

const prisma = new PrismaClient();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function asObj(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function csvEscape(value) {
  const raw = String(value ?? "");
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function buildCsv(rows) {
  const headers = [
    "日付",
    "トランザクション種別",
    "注文番号",
    "SKU",
    "商品名",
    "数量",
    "商品売上",
    "商品売上の税",
    "配送料",
    "配送料の税金",
    "プロモーション割引額",
    "プロモーション割引の税金",
    "販売手数料",
    "FBA手数料",
    "合計",
    "説明",
    "販売チャネル",
    "フルフィルメント",
  ];

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(",")),
  ].join("\n");
}

async function resolveCompany() {
  const company = await prisma.company.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  if (!company) {
    throw new Error("No company found for Step115-E smoke");
  }

  return company;
}

async function cleanup(runId, markers) {
  const {
    filename,
    orderIdDirect,
    orderIdMissing,
    skuDirect,
    skuMissing,
    dedupeToken,
  } = markers;

  const importJobs = await prisma.importJob.findMany({
    where: {
      OR: [
        { filename },
        { filename: { contains: runId } },
      ],
    },
    select: { id: true },
  });

  const importJobIds = importJobs.map((job) => job.id);

  const stagingRows = await prisma.importStagingRow.findMany({
    where: {
      OR: [
        ...(importJobIds.length ? [{ importJobId: { in: importJobIds } }] : []),
        { dedupeHash: { contains: dedupeToken } },
        { matchReason: { contains: runId } },
      ],
    },
    select: { id: true },
  });

  const stagingRowIds = stagingRows.map((row) => row.id);

  const transactions = await prisma.transaction.findMany({
    where: {
      OR: [
        ...(importJobIds.length ? [{ importJobId: { in: importJobIds } }] : []),
        { dedupeHash: { contains: dedupeToken } },
        { memo: { contains: runId } },
        { memo: { contains: orderIdDirect } },
        { memo: { contains: orderIdMissing } },
      ],
    },
    select: { id: true },
  });

  const transactionIds = transactions.map((tx) => tx.id);

  const auditRows = await prisma.importStagingRow.findMany({
    where: {
      OR: [
        ...(importJobIds.length ? [{ importJobId: { in: importJobIds } }] : []),
        { matchReason: { contains: "PRODUCT_SKU_NOT_FOUND" } },
        { matchReason: { contains: runId } },
      ],
      module: "store-orders",
    },
    select: { id: true },
  });

  const auditRowIds = auditRows.map((row) => row.id);

  const movements = await prisma.inventoryMovement.findMany({
    where: {
      OR: [
        ...(importJobIds.length ? [{ importJobId: { in: importJobIds } }] : []),
        ...(transactionIds.length ? [{ transactionId: { in: transactionIds } }] : []),
        { sourceId: orderIdDirect },
        { sourceId: orderIdMissing },
        { memo: { contains: runId } },
        { memo: { contains: skuDirect } },
        { memo: { contains: skuMissing } },
      ],
    },
    select: { id: true },
  });

  const movementIds = movements.map((m) => m.id);

  // Delete dependent-ish records first. The schema has evolved over many steps, so use best-effort cleanup.
  await prisma.inventoryMovement.deleteMany({
    where: {
      OR: [
        ...(movementIds.length ? [{ id: { in: movementIds } }] : []),
        ...(importJobIds.length ? [{ importJobId: { in: importJobIds } }] : []),
        ...(transactionIds.length ? [{ transactionId: { in: transactionIds } }] : []),
        { sourceId: orderIdDirect },
        { sourceId: orderIdMissing },
        { memo: { contains: runId } },
      ],
    },
  }).catch(() => undefined);

  await prisma.transaction.deleteMany({
    where: {
      OR: [
        ...(transactionIds.length ? [{ id: { in: transactionIds } }] : []),
        ...(importJobIds.length ? [{ importJobId: { in: importJobIds } }] : []),
        { dedupeHash: { contains: dedupeToken } },
        { memo: { contains: runId } },
        { memo: { contains: orderIdDirect } },
        { memo: { contains: orderIdMissing } },
      ],
    },
  }).catch(() => undefined);

  await prisma.importStagingRow.deleteMany({
    where: {
      OR: [
        ...(stagingRowIds.length ? [{ id: { in: stagingRowIds } }] : []),
        ...(auditRowIds.length ? [{ id: { in: auditRowIds } }] : []),
        ...(importJobIds.length ? [{ importJobId: { in: importJobIds } }] : []),
        { dedupeHash: { contains: dedupeToken } },
        { matchReason: { contains: runId } },
      ],
    },
  }).catch(() => undefined);

  await prisma.importJob.deleteMany({
    where: {
      OR: [
        ...(importJobIds.length ? [{ id: { in: importJobIds } }] : []),
        { filename },
        { filename: { contains: runId } },
      ],
    },
  }).catch(() => undefined);
}

async function leakCheck(runId, markers) {
  const {
    filename,
    orderIdDirect,
    orderIdMissing,
    dedupeToken,
  } = markers;

  const leakedJobs = await prisma.importJob.count({
    where: {
      OR: [
        { filename },
        { filename: { contains: runId } },
      ],
    },
  });

  const leakedRows = await prisma.importStagingRow.count({
    where: {
      OR: [
        { dedupeHash: { contains: dedupeToken } },
        { matchReason: { contains: runId } },
      ],
    },
  });

  const leakedTransactions = await prisma.transaction.count({
    where: {
      OR: [
        { dedupeHash: { contains: dedupeToken } },
        { memo: { contains: runId } },
        { memo: { contains: orderIdDirect } },
        { memo: { contains: orderIdMissing } },
      ],
    },
  });

  const leakedMovements = await prisma.inventoryMovement.count({
    where: {
      OR: [
        { sourceId: orderIdDirect },
        { sourceId: orderIdMissing },
        { memo: { contains: runId } },
      ],
    },
  });

  return {
    leakedJobs,
    leakedRows,
    leakedTransactions,
    leakedMovements,
  };
}

async function ensureDirectSku(companyId, runId, skuCode) {
  const store = await prisma.store.create({
    data: {
      companyId,
      name: `Step115-E Smoke Store ${runId}`,
      platform: "AMAZON",
      region: "JP",
    },
  });

  const product = await prisma.product.create({
    data: {
      companyId,
      name: `Step115-E Smoke Product ${runId}`,
      brand: "Step115",
      category: "Smoke",
      isActive: true,
    },
  });

  const sku = await prisma.productSku.create({
    data: {
      companyId,
      productId: product.id,
      storeId: store.id,
      skuCode,
      name: `Step115-E Smoke SKU ${runId}`,
      externalSku: skuCode,
      asin: "B0STEP115E",
      fulfillmentChannel: "FBA",
      isActive: true,
    },
  });

  return { store, product, sku };
}

async function cleanupSeed(seed) {
  if (!seed) return;

  await prisma.inventoryBalance.deleteMany({
    where: { skuId: seed.sku.id },
  }).catch(() => undefined);

  await prisma.inventoryMovement.deleteMany({
    where: { skuId: seed.sku.id },
  }).catch(() => undefined);

  await prisma.productSkuAlias.deleteMany({
    where: { skuId: seed.sku.id },
  }).catch(() => undefined);

  await prisma.productSku.deleteMany({
    where: { id: seed.sku.id },
  }).catch(() => undefined);

  await prisma.product.deleteMany({
    where: { id: seed.product.id },
  }).catch(() => undefined);

  await prisma.store.deleteMany({
    where: { id: seed.store.id },
  }).catch(() => undefined);
}

async function main() {
  const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const company = await resolveCompany();
  const service = new ImportsService(prisma);

  const filename = `step115-e-real-import-${runId}.csv`;
  const skuDirect = `STEP115-E-DIRECT-${runId}`;
  const skuMissing = `STEP115-E-MISSING-${runId}`;
  const orderIdDirect = `STEP115-E-DIRECT-ORDER-${runId}`;
  const orderIdMissing = `STEP115-E-MISSING-ORDER-${runId}`;
  const dedupeToken = `step115-e-${runId}`;

  const markers = {
    filename,
    skuDirect,
    skuMissing,
    orderIdDirect,
    orderIdMissing,
    dedupeToken,
  };

  let seed = null;
  let previewResult = null;
  let commitResult = null;
  let importJobId = null;
  let stagingRows = [];
  let directRow = null;
  let missingRow = null;
  let directPayload = null;
  let missingPayload = null;
  let movements = [];

  try {
    await cleanup(runId, markers);

    seed = await ensureDirectSku(company.id, runId, skuDirect);

    const csvText = buildCsv([
      {
        "日付": "2026-05-07T11:00:00.000Z",
        "トランザクション種別": "注文",
        "注文番号": orderIdDirect,
        "SKU": skuDirect,
        "商品名": `Step115 E Direct Product ${runId}`,
        "数量": "2",
        "商品売上": "7980",
        "商品売上の税": "798",
        "配送料": "300",
        "配送料の税金": "30",
        "プロモーション割引額": "120",
        "プロモーション割引の税金": "12",
        "販売手数料": "600",
        "FBA手数料": "450",
        "合計": "7926",
        "説明": `Step115-E real import direct ${runId}`,
        "販売チャネル": "Amazon JP",
        "フルフィルメント": "FBA",
      },
      {
        "日付": "2026-05-07T11:05:00.000Z",
        "トランザクション種別": "注文",
        "注文番号": orderIdMissing,
        "SKU": skuMissing,
        "商品名": `Step115 E Missing Product ${runId}`,
        "数量": "1",
        "商品売上": "3980",
        "商品売上の税": "398",
        "配送料": "0",
        "配送料の税金": "0",
        "プロモーション割引額": "80",
        "プロモーション割引の税金": "8",
        "販売手数料": "360",
        "FBA手数料": "220",
        "合計": "3710",
        "説明": `Step115-E real import missing ${runId}`,
        "販売チャネル": "Amazon JP",
        "フルフィルメント": "FBA",
      },
    ]);

    previewResult = await service.previewImport({
      companyId: company.id,
      filename,
      csvText,
      module: "store-orders",
      sourceType: "amazon-csv",
      monthConflictPolicy: "replace_existing_months",
    });

    assert(previewResult && previewResult.ok !== false, "previewImport returned false-ish result");

    importJobId =
      previewResult.importJobId ||
      previewResult.importJob?.id ||
      previewResult.job?.id ||
      previewResult.id ||
      null;

    if (!importJobId) {
      const job = await prisma.importJob.findFirst({
        where: { filename },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      importJobId = job && job.id;
    }

    assert(importJobId, "previewImport did not create or return importJobId");

    stagingRows = await prisma.importStagingRow.findMany({
      where: { importJobId },
      orderBy: { rowNo: "asc" },
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
        rawPayloadJson: true,
        createdAt: true,
      },
    });

    assert(stagingRows.length >= 2, `expected at least 2 staging rows after preview, got ${stagingRows.length}`);

    directRow = stagingRows.find((row) => {
      const p = asObj(row.normalizedPayloadJson);
      return p.orderId === orderIdDirect || p.sku === skuDirect || p.sellerSku === skuDirect;
    });

    missingRow = stagingRows.find((row) => {
      const p = asObj(row.normalizedPayloadJson);
      return p.orderId === orderIdMissing || p.sku === skuMissing || p.sellerSku === skuMissing;
    });

    assert(directRow, "direct SKU staging row not found after preview");
    assert(missingRow, "missing SKU staging row not found after preview");

    directPayload = asObj(directRow.normalizedPayloadJson);
    missingPayload = asObj(missingRow.normalizedPayloadJson);

    for (const [label, payload, expectedOrderId, expectedSku] of [
      ["direct", directPayload, orderIdDirect, skuDirect],
      ["missing", missingPayload, orderIdMissing, skuMissing],
    ]) {
      assert(payload.contractVersion === "amazon-order-normalized-v1", `${label} contractVersion mismatch`);
      assert(payload.sourceType === "AMAZON_ORDER_CSV", `${label} sourceType mismatch`);
      assert(payload.entityType === "transaction", `${label} entityType mismatch`);
      assert(payload.module === "store-orders", `${label} module mismatch`);
      assert(payload.orderId === expectedOrderId, `${label} orderId mismatch`);
      assert(payload.amazonOrderId === expectedOrderId, `${label} amazonOrderId mismatch`);
      assert(payload.sku === expectedSku, `${label} legacy sku mismatch`);
      assert(payload.skuCode === expectedSku, `${label} skuCode mismatch`);
      assert(payload.sellerSku === expectedSku, `${label} sellerSku mismatch`);
      assert(payload.normalizedSellerSku === expectedSku.toUpperCase(), `${label} normalizedSellerSku mismatch`);
      assert(Number(payload.quantity) > 0, `${label} quantity missing`);
      assert(Number(payload.grossAmount) > 0, `${label} grossAmount missing`);
      assert(Number(payload.netAmount) > 0, `${label} netAmount missing`);
      assert(Number(payload.feeAmount) > 0, `${label} feeAmount missing`);
      assert(Number(payload.commissionFeeAmount) > 0, `${label} commissionFeeAmount missing`);
      assert(Number(payload.fbaFeeAmount) > 0, `${label} fbaFeeAmount missing`);
      assert(payload.shippingTaxAmount !== undefined, `${label} shippingTaxAmount missing`);
      assert(payload.promotionDiscountTaxAmount !== undefined, `${label} promotionDiscountTaxAmount missing`);
    }

    commitResult = await service.commitImport(importJobId, {
      companyId: company.id,
      monthConflictPolicy: "replace_existing_months",
    });

    assert(commitResult && commitResult.ok !== false, "commitImport returned false-ish result");

    const rowsAfterCommit = await prisma.importStagingRow.findMany({
      where: { importJobId },
      orderBy: { rowNo: "asc" },
      select: {
        id: true,
        rowNo: true,
        businessMonth: true,
        matchStatus: true,
        matchReason: true,
        targetEntityType: true,
        targetEntityId: true,
        normalizedPayloadJson: true,
      },
    });

    const directAfter = rowsAfterCommit.find((row) => {
      const p = asObj(row.normalizedPayloadJson);
      return p.orderId === orderIdDirect || p.sku === skuDirect || p.sellerSku === skuDirect;
    });

    const missingAfter = rowsAfterCommit.find((row) => {
      const p = asObj(row.normalizedPayloadJson);
      return p.orderId === orderIdMissing || p.sku === skuMissing || p.sellerSku === skuMissing;
    });

    assert(directAfter, "direct row missing after commit");
    assert(missingAfter, "missing row missing after commit");

    const directAfterPayload = asObj(directAfter.normalizedPayloadJson);
    const missingAfterPayload = asObj(missingAfter.normalizedPayloadJson);

    assert(
      directAfterPayload.contractVersion === "amazon-order-normalized-v1",
      "direct contractVersion lost after commit",
    );
    assert(
      missingAfterPayload.contractVersion === "amazon-order-normalized-v1",
      "missing contractVersion lost after commit",
    );

    // Direct SKU should create a transaction and inventory movement when current inventory logic matches.
    const transactions = await prisma.transaction.findMany({
      where: { importJobId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        importJobId: true,
        sourceRowNo: true,
        amount: true,
        memo: true,
        dedupeHash: true,
      },
    });

    assert(transactions.length >= 1, "commit did not create any transactions for fixture");

    movements = await prisma.inventoryMovement.findMany({
      where: { importJobId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        skuId: true,
        type: true,
        quantity: true,
        sourceType: true,
        sourceId: true,
        importJobId: true,
        sourceRowNo: true,
        transactionId: true,
        businessMonth: true,
        memo: true,
      },
    });

    // Existing behavior may create unresolved audit for missing SKU.
    const rowsWithAudit = rowsAfterCommit.filter((row) => {
      const payload = asObj(row.normalizedPayloadJson);
      const audit = asObj(payload.inventoryAudit);
      return Object.keys(audit).length > 0 || String(row.matchReason || "").includes("PRODUCT_SKU");
    });

    assert(rowsWithAudit.length >= 1, "expected missing SKU audit/unresolved row after commit");

    console.log("[SMOKE_OK] amazon order normalized real import fixture smoke passed");
    console.log(JSON.stringify({
      ok: true,
      runId,
      company,
      importJobId,
      previewSummary: previewResult.summary || previewResult,
      commitSummary: commitResult.summary || commitResult,
      stagingRowsBeforeCommit: stagingRows.map((row) => ({
        id: row.id,
        rowNo: row.rowNo,
        matchStatus: row.matchStatus,
        matchReason: row.matchReason,
        payload: asObj(row.normalizedPayloadJson),
      })),
      rowsAfterCommit: rowsAfterCommit.map((row) => ({
        id: row.id,
        rowNo: row.rowNo,
        matchStatus: row.matchStatus,
        matchReason: row.matchReason,
        targetEntityType: row.targetEntityType,
        targetEntityId: row.targetEntityId,
        payload: asObj(row.normalizedPayloadJson),
      })),
      movements,
      rollbackCleanup: "cleanup will run in finally",
    }, null, 2));
  } finally {
    await cleanup(runId, markers);
    await cleanupSeed(seed);
    const leak = await leakCheck(runId, markers);
    console.log("[CLEANUP_CHECK]", JSON.stringify(leak, null, 2));

    if (
      leak.leakedJobs !== 0 ||
      leak.leakedRows !== 0 ||
      leak.leakedTransactions !== 0 ||
      leak.leakedMovements !== 0
    ) {
      throw new Error(
        `Cleanup leak detected: jobs=${leak.leakedJobs}, rows=${leak.leakedRows}, transactions=${leak.leakedTransactions}, movements=${leak.leakedMovements}`,
      );
    }
  }
}

main()
  .catch((err) => {
    console.error("[SMOKE_ERROR]", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
