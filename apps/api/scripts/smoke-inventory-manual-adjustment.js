#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const { BadRequestException } = require("@nestjs/common");
const { InventoryService } = require("../dist/src/inventory/inventory.service.js");

const prisma = new PrismaClient();

function stamp() {
  return new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
}

const runId = process.env.SMOKE_RUN_ID || stamp();

class RollbackSignal extends Error {
  constructor(report) {
    super("INVENTORY_MANUAL_ADJUSTMENT_ROLLBACK");
    this.name = "RollbackSignal";
    this.report = report;
  }
}

function assert(condition, message, extra = {}) {
  if (!condition) {
    const err = new Error(message);
    err.extra = extra;
    throw err;
  }
}

function pretty(value) {
  return JSON.stringify(value, null, 2);
}

function makeTxPrisma(tx) {
  return new Proxy(tx, {
    get(target, prop) {
      if (prop === "$transaction") {
        return async (fn) => fn(target);
      }
      return target[prop];
    },
  });
}

async function expectBadRequest(label, fn, pattern) {
  try {
    await fn();
  } catch (err) {
    const message = String(err?.message || "");
    const status = err?.status || err?.response?.statusCode;
    const isBadRequest =
      err instanceof BadRequestException ||
      status === 400 ||
      err?.name === "BadRequestException";

    assert(isBadRequest, `${label} should throw BadRequestException`, {
      name: err?.name,
      message,
      status,
      response: err?.response,
    });

    if (pattern) {
      assert(pattern.test(message), `${label} message mismatch`, { message, pattern: String(pattern) });
    }

    return {
      ok: true,
      label,
      message,
      status: status || 400,
    };
  }

  throw new Error(`${label} should have failed`);
}

function assertManualMovementResult(result, expected) {
  assert(result?.ok === true, `${expected.label}: result ok`, { result });
  assert(result?.action === "manual-adjustment", `${expected.label}: action`, { result });

  const item = result.item;
  assert(item, `${expected.label}: item missing`, { result });
  assert(item.skuCode === expected.skuCode, `${expected.label}: skuCode`, { item, expected });
  assert(item.type === expected.type, `${expected.label}: type`, { item, expected });
  assert(item.quantityDelta === expected.quantityDelta, `${expected.label}: quantityDelta`, {
    item,
    expected,
  });
  assert(item.quantity === expected.balanceQuantity, `${expected.label}: balance quantity`, {
    item,
    expected,
  });
  assert(item.availableQty === expected.balanceQuantity, `${expected.label}: availableQty`, {
    item,
    expected,
  });
  assert(item.stockStatus === expected.stockStatus, `${expected.label}: stockStatus`, {
    item,
    expected,
  });
  assert(item.stockStatusLabel === expected.stockStatusLabel, `${expected.label}: stockStatusLabel`, {
    item,
    expected,
  });

  assert(item.movement, `${expected.label}: movement missing`, { item });
  assert(item.movement.id === item.movementId, `${expected.label}: movement id`, { item });
  assert(item.movement.type === expected.type, `${expected.label}: movement type`, { item, expected });
  assert(item.movement.quantity === expected.quantityDelta, `${expected.label}: movement quantity`, {
    item,
    expected,
  });
  assert(item.movement.sourceType === "MANUAL_STOCK_ADJUSTMENT", `${expected.label}: sourceType`, {
    item,
  });
  assert(
    String(item.movement.sourceId || "").startsWith(`manual-stock-adjustment:${expected.skuCode}:`),
    `${expected.label}: sourceId prefix`,
    { sourceId: item.movement.sourceId, expected },
  );
  assert(item.movement.businessMonth === expected.businessMonth, `${expected.label}: businessMonth`, {
    item,
    expected,
  });
  assert(item.movement.memo === expected.memo, `${expected.label}: memo`, { item, expected });
}

async function runSmoke() {
  let report = null;

  try {
    await prisma.$transaction(
      async (tx) => {
        const txPrisma = makeTxPrisma(tx);
        const service = new InventoryService(txPrisma);

        const company = await tx.company.findFirst({
          orderBy: { createdAt: "asc" },
          select: { id: true, name: true },
        });

        assert(company?.id, "Expected existing company");
        const companyId = company.id;

        const store = await tx.store.create({
          data: {
            companyId,
            name: `Manual Adjustment Smoke Store ${runId}`,
            platform: "AMAZON",
            region: "JP",
          },
          select: { id: true, name: true },
        });

        const product = await tx.product.create({
          data: {
            companyId,
            name: `Manual Adjustment Smoke Product ${runId}`,
            brand: "LedgerSeiri Smoke",
            category: "Inventory",
          },
          select: { id: true, name: true },
        });

        const skuCode = `STEP114-C-MANUAL-${runId}`;
        const sku = await tx.productSku.create({
          data: {
            companyId,
            productId: product.id,
            storeId: store.id,
            skuCode,
            externalSku: skuCode,
            name: `Manual Adjustment Smoke SKU ${runId}`,
            asin: "B0SMOKE114C",
            fulfillmentChannel: "FBA",
          },
          select: { id: true, skuCode: true },
        });

        const initialBalance = await tx.inventoryBalance.create({
          data: {
            companyId,
            skuId: sku.id,
            quantity: 10,
            reservedQty: 0,
            alertLevel: 0,
          },
          select: { id: true, quantity: true },
        });

        const failures = [];

        failures.push(
          await expectBadRequest(
            "missing memo",
            () =>
              service.createManualAdjustment({
                skuCode,
                type: "IN",
                quantity: "1",
                occurredAt: "2026-05-07",
              }),
            /memo is required/i,
          ),
        );

        const inResult = await service.createManualAdjustment({
          skuCode,
          type: "IN",
          quantity: "5",
          occurredAt: "2026-05-07",
          memo: `Step114-C smoke IN ${runId}`,
        });

        assertManualMovementResult(inResult, {
          label: "IN",
          skuCode,
          type: "IN",
          quantityDelta: 5,
          balanceQuantity: 15,
          stockStatus: "healthy",
          stockStatusLabel: "正常",
          businessMonth: "2026-05",
          memo: `Step114-C smoke IN ${runId}`,
        });

        const outResult = await service.createManualAdjustment({
          skuCode,
          type: "OUT",
          quantity: "4",
          occurredAt: "2026-06-09",
          memo: `Step114-C smoke OUT ${runId}`,
        });

        assertManualMovementResult(outResult, {
          label: "OUT",
          skuCode,
          type: "OUT",
          quantityDelta: -4,
          balanceQuantity: 11,
          stockStatus: "healthy",
          stockStatusLabel: "正常",
          businessMonth: "2026-06",
          memo: `Step114-C smoke OUT ${runId}`,
        });

        failures.push(
          await expectBadRequest(
            "OUT negative quantity",
            () =>
              service.createManualAdjustment({
                skuCode,
                type: "OUT",
                quantity: "-1",
                occurredAt: "2026-06-10",
                memo: `Step114-C smoke bad OUT ${runId}`,
              }),
            /positive/i,
          ),
        );

        const adjustNegativeResult = await service.createManualAdjustment({
          skuCode,
          type: "ADJUST",
          quantityDelta: "-3",
          occurredAt: "2026-07-11",
          memo: `Step114-C smoke ADJUST negative ${runId}`,
        });

        assertManualMovementResult(adjustNegativeResult, {
          label: "ADJUST negative",
          skuCode,
          type: "ADJUST",
          quantityDelta: -3,
          balanceQuantity: 8,
          stockStatus: "healthy",
          stockStatusLabel: "正常",
          businessMonth: "2026-07",
          memo: `Step114-C smoke ADJUST negative ${runId}`,
        });

        const adjustPositiveResult = await service.createManualAdjustment({
          skuCode,
          type: "ADJUST",
          quantity: "2",
          occurredAt: "2026-08-12",
          memo: `Step114-C smoke ADJUST positive ${runId}`,
        });

        assertManualMovementResult(adjustPositiveResult, {
          label: "ADJUST positive",
          skuCode,
          type: "ADJUST",
          quantityDelta: 2,
          balanceQuantity: 10,
          stockStatus: "healthy",
          stockStatusLabel: "正常",
          businessMonth: "2026-08",
          memo: `Step114-C smoke ADJUST positive ${runId}`,
        });

        failures.push(
          await expectBadRequest(
            "ADJUST zero",
            () =>
              service.createManualAdjustment({
                skuCode,
                type: "ADJUST",
                quantity: "0",
                occurredAt: "2026-08-13",
                memo: `Step114-C smoke zero ${runId}`,
              }),
            /zero/i,
          ),
        );

        const movements = await tx.inventoryMovement.findMany({
          where: { companyId, skuId: sku.id },
          orderBy: [{ occurredAt: "asc" }, { createdAt: "asc" }],
          select: {
            id: true,
            type: true,
            quantity: true,
            occurredAt: true,
            sourceType: true,
            sourceId: true,
            businessMonth: true,
            memo: true,
          },
        });

        assert(movements.length === 4, "Expected exactly four successful movements", { movements });

        const finalBalance = await tx.inventoryBalance.findUnique({
          where: { companyId_skuId: { companyId, skuId: sku.id } },
          select: { id: true, quantity: true, reservedQty: true, alertLevel: true },
        });

        assert(finalBalance?.quantity === 10, "Final balance should return to 10", { finalBalance });

        report = {
          ok: true,
          runId,
          company,
          store,
          product,
          sku,
          initialBalance,
          failures,
          results: {
            inResult: inResult.item,
            outResult: outResult.item,
            adjustNegativeResult: adjustNegativeResult.item,
            adjustPositiveResult: adjustPositiveResult.item,
          },
          movements,
          finalBalance,
        };

        throw new RollbackSignal(report);
      },
      { timeout: 30000, maxWait: 10000 },
    );
  } catch (err) {
    if (err instanceof RollbackSignal || err?.message === "INVENTORY_MANUAL_ADJUSTMENT_ROLLBACK") {
      report = err.report || report;
      console.log("[ROLLBACK_EXPECTED] transaction intentionally rolled back");
    } else {
      console.error("[SMOKE_FAILED]", err);
      if (err?.extra) console.error("[SMOKE_FAILED_EXTRA]", pretty(err.extra));
      process.exitCode = 1;
      return;
    }
  }

  assert(report?.ok === true, "Missing rollback report");

  const leakedSku = await prisma.productSku.findFirst({
    where: { skuCode: report.sku.skuCode },
    select: { id: true, skuCode: true },
  });

  const leakedMovements = await prisma.inventoryMovement.findMany({
    where: {
      OR: [
        { sourceType: "MANUAL_STOCK_ADJUSTMENT", sourceId: { contains: report.sku.skuCode } },
        { memo: { contains: runId } },
      ],
    },
    select: { id: true, sourceType: true, sourceId: true, memo: true },
  });

  assert(!leakedSku, "Rollback leak detected: SKU persisted", { leakedSku });
  assert(leakedMovements.length === 0, "Rollback leak detected: movements persisted", {
    leakedMovements,
  });

  console.log("[SMOKE_OK] inventory manual adjustment rollback smoke passed");
  console.log(pretty(report));
}

runSmoke()
  .catch((err) => {
    console.error("[UNHANDLED_SMOKE_ERROR]", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
