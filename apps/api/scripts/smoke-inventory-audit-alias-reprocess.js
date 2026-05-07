#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const { InventoryService } = require("../dist/src/inventory/inventory.service.js");
const { ImportsService } = require("../dist/src/imports/imports.service.js");

const prisma = new PrismaClient();

function stamp() {
  return new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, "")
    .slice(0, 14);
}

const runId = process.env.SMOKE_RUN_ID || stamp();

const env = {
  aliasSku: process.env.ALIAS_SKU || `STEP113-D-SMOKE-ALIAS-${runId}`,
  targetSkuCode: process.env.TARGET_SKU_CODE || `STEP113-D-SMOKE-TARGET-${runId}`,
  orderIdAudit: process.env.ORDER_ID_AUDIT || `STEP113-D-SMOKE-AUDIT-ORDER-${runId}`,
  orderIdReprocess: process.env.ORDER_ID_REPROCESS || `STEP113-D-SMOKE-REPROCESS-ORDER-${runId}`,
};

env.normalizedAliasSku =
  process.env.NORMALIZED_ALIAS_SKU ||
  String(env.aliasSku || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();

class RollbackSignal extends Error {
  constructor(report) {
    super("INVENTORY_AUDIT_ALIAS_REPROCESS_ROLLBACK");
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

async function runSmoke() {
  let report = null;

  try {
    await prisma.$transaction(
      async (tx) => {
        const txPrisma = makeTxPrisma(tx);
        const inventoryService = new InventoryService(txPrisma);
        const importsService = new ImportsService(txPrisma);

        const company = await tx.company.findFirst({
          orderBy: { createdAt: "asc" },
          select: { id: true, name: true },
        });

        assert(company?.id, "Expected an existing first company", { company });
        const companyId = company.id;

        const store = await tx.store.create({
          data: {
            companyId,
            name: `Inventory Alias Smoke Store ${runId}`,
            platform: "AMAZON",
            region: "JP",
          },
          select: { id: true, name: true },
        });

        const product = await tx.product.create({
          data: {
            companyId,
            name: `Inventory Alias Smoke Product ${runId}`,
            brand: "LedgerSeiri Smoke",
            category: "Smoke",
          },
          select: { id: true, name: true },
        });

        const sku = await tx.productSku.create({
          data: {
            companyId,
            productId: product.id,
            storeId: store.id,
            skuCode: env.targetSkuCode,
            externalSku: env.targetSkuCode,
            name: `Inventory Alias Smoke Target SKU ${runId}`,
            asin: "B0SMOKE113D",
            fulfillmentChannel: "FBA",
          },
          select: { id: true, skuCode: true, storeId: true },
        });

        const auditJob = await tx.importJob.create({
          data: {
            companyId,
            domain: "income",
            module: "store-orders",
            sourceType: "AMAZON_ORDER_IMPORT",
            filename: `smoke-inventory-audit-alias-unresolved-${runId}.csv`,
            status: "PROCESSING",
            totalRows: 1,
            successRows: 0,
            failedRows: 0,
          },
          select: { id: true, filename: true },
        });

        const auditPayload = {
          orderId: env.orderIdAudit,
          sku: env.aliasSku,
          quantity: 3,
          orderDate: "2026-05-07T00:00:00.000Z",
          productName: `Inventory Alias Smoke unresolved item ${runId}`,
          amount: 3980,
          inventoryAudit: {
            scope: "inventory",
            status: "OPEN",
            severity: "warning",
            code: "PRODUCT_SKU_NOT_FOUND",
            reason: "PRODUCT_SKU_NOT_FOUND",
            sku: env.aliasSku,
            sourceType: "AMAZON_ORDER_IMPORT",
            sourceId: env.orderIdAudit,
            quantity: 3,
            createdAt: new Date().toISOString(),
            message:
              "ProductSku mapping was not found. Inventory deduction was skipped and requires manual review.",
          },
        };

        const auditRow = await tx.importStagingRow.create({
          data: {
            importJobId: auditJob.id,
            companyId,
            module: "store-orders",
            rowNo: 1,
            businessMonth: "2026-05",
            rawPayloadJson: auditPayload,
            normalizedPayloadJson: auditPayload,
            matchStatus: "unresolved",
            matchReason: "PRODUCT_SKU_NOT_FOUND",
            dedupeHash: `smoke-inventory-alias-audit-${runId}`,
          },
          select: { id: true, normalizedPayloadJson: true },
        });

        const openBefore = await inventoryService.listAuditIssues({
          status: "OPEN",
          reason: "PRODUCT_SKU_NOT_FOUND",
          sku: env.aliasSku,
          importJobId: auditJob.id,
          limit: "10",
          offset: "0",
        });

        assert(openBefore.ok === true, "listAuditIssues before resolve should be ok", { openBefore });
        assert(openBefore.items.length === 1, "Expected one OPEN audit issue before resolve", {
          openBefore,
          auditRow,
          companyId,
        });
        assert(openBefore.items[0].id === auditRow.id, "Expected OPEN issue id to match fixture row", {
          openBefore,
          auditRow,
        });

        const aliasResult = await inventoryService.createProductSkuAlias({
          aliasSku: env.aliasSku,
          skuId: sku.id,
          skuCode: sku.skuCode,
          sourceType: "AMAZON_ORDER_IMPORT",
          storeId: store.id,
          note: `Reusable inventory audit alias smoke ${runId}`,
          isActive: true,
        });

        assert(aliasResult.ok === true, "createProductSkuAlias should be ok", { aliasResult });
        assert(aliasResult.item.skuId === sku.id, "Alias should link to target SKU", { aliasResult, sku });
        assert(aliasResult.item.aliasSku === env.aliasSku, "Alias SKU mismatch", { aliasResult, env });
        assert(
          aliasResult.item.normalizedAliasSku === env.normalizedAliasSku,
          "Normalized alias mismatch",
          { aliasResult, env },
        );

        const resolveResult = await inventoryService.resolveAuditIssue(auditRow.id, {
          skuId: sku.id,
          note: `Reusable smoke resolve ${runId}`,
        });

        assert(resolveResult.ok === true, "resolveAuditIssue should be ok", { resolveResult });
        assert(resolveResult.item.audit.status === "CLOSED", "Resolved audit should be CLOSED", { resolveResult });
        assert(resolveResult.item.audit.linkedSkuId === sku.id, "Resolved audit linkedSkuId mismatch", {
          resolveResult,
          sku,
        });
        assert(resolveResult.item.audit.linkedSkuCode === sku.skuCode, "Resolved audit linkedSkuCode mismatch", {
          resolveResult,
          sku,
        });
        assert(resolveResult.item.movement.type === "OUT", "Resolve movement should be OUT", { resolveResult });
        assert(resolveResult.item.movement.quantity === -3, "Resolve movement quantity should be -3", {
          resolveResult,
        });

        const closedAfter = await inventoryService.listAuditIssues({
          status: "CLOSED",
          sku: env.aliasSku,
          importJobId: auditJob.id,
          limit: "10",
          offset: "0",
        });

        assert(closedAfter.items.length === 1, "Expected one CLOSED audit issue after resolve", { closedAfter });

        const reprocessJob = await tx.importJob.create({
          data: {
            companyId,
            domain: "income",
            module: "store-orders",
            sourceType: "AMAZON_ORDER_IMPORT",
            filename: `smoke-inventory-audit-alias-reprocess-${runId}.csv`,
            status: "PROCESSING",
            totalRows: 1,
            successRows: 0,
            failedRows: 0,
          },
          select: { id: true, filename: true },
        });

        const reprocessPayload = {
          orderId: env.orderIdReprocess,
          sku: env.aliasSku,
          quantity: 2,
          orderDate: "2026-05-07T00:00:00.000Z",
          productName: `Inventory Alias Smoke reprocess item ${runId}`,
          amount: 2980,
        };

        await tx.importStagingRow.create({
          data: {
            importJobId: reprocessJob.id,
            companyId,
            module: "store-orders",
            rowNo: 1,
            businessMonth: "2026-05",
            rawPayloadJson: reprocessPayload,
            normalizedPayloadJson: reprocessPayload,
            matchStatus: "new",
            matchReason: null,
            dedupeHash: `smoke-inventory-alias-reprocess-${runId}`,
          },
        });

        const deduction = await importsService.applyStoreOrderInventoryDeduction({
          tx,
          companyId,
          transactionId: null,
          importJobId: reprocessJob.id,
          rowNo: 1,
          businessMonth: "2026-05",
          payload: reprocessPayload,
        });

        assert(deduction.deducted === true, "Reprocess deduction should be deducted", { deduction });
        assert(deduction.unresolved === false, "Reprocess deduction should not be unresolved", { deduction });
        assert(deduction.reason === "DEDUCTED", "Reprocess reason should be DEDUCTED", { deduction });
        assert(deduction.matchStrategy === "PRODUCT_SKU_ALIAS", "Reprocess should use PRODUCT_SKU_ALIAS", {
          deduction,
        });
        assert(deduction.aliasId === aliasResult.item.id, "Reprocess aliasId should match created alias", {
          deduction,
          aliasResult,
        });
        assert(deduction.aliasSku === env.aliasSku, "Reprocess aliasSku mismatch", { deduction, env });
        assert(deduction.normalizedAliasSku === env.normalizedAliasSku, "Reprocess normalizedAliasSku mismatch", {
          deduction,
          env,
        });
        assert(deduction.skuId === sku.id, "Reprocess skuId mismatch", { deduction, sku });
        assert(deduction.skuCode === sku.skuCode, "Reprocess skuCode mismatch", { deduction, sku });
        assert(deduction.quantityDelta === -2, "Reprocess quantityDelta should be -2", { deduction });

        const movementCount = await tx.inventoryMovement.count({
          where: { companyId, skuId: sku.id },
        });
        assert(movementCount === 2, "Expected two movements: resolve + reprocess", { movementCount });

        const balance = await tx.inventoryBalance.findUnique({
          where: { companyId_skuId: { companyId, skuId: sku.id } },
          select: { id: true, quantity: true, reservedQty: true, alertLevel: true },
        });

        assert(balance, "Expected inventory balance", {});
        assert(balance.quantity === -5, "Expected balance quantity -5 after -3 and -2", { balance });

        const reprocessRow = await tx.importStagingRow.findFirst({
          where: { importJobId: reprocessJob.id, companyId, rowNo: 1 },
          select: { normalizedPayloadJson: true },
        });

        const inventoryDeduction = reprocessRow?.normalizedPayloadJson?.inventoryDeduction;

        assert(inventoryDeduction, "Expected inventoryDeduction on reprocess row", { reprocessRow });
        assert(inventoryDeduction.status === "DEDUCTED", "inventoryDeduction status mismatch", {
          inventoryDeduction,
        });
        assert(inventoryDeduction.matchStrategy === "PRODUCT_SKU_ALIAS", "inventoryDeduction strategy mismatch", {
          inventoryDeduction,
        });
        assert(inventoryDeduction.aliasId === aliasResult.item.id, "inventoryDeduction aliasId mismatch", {
          inventoryDeduction,
          aliasResult,
        });
        assert(inventoryDeduction.aliasSku === env.aliasSku, "inventoryDeduction aliasSku mismatch", {
          inventoryDeduction,
          env,
        });
        assert(
          inventoryDeduction.normalizedAliasSku === env.normalizedAliasSku,
          "inventoryDeduction normalizedAliasSku mismatch",
          { inventoryDeduction, env },
        );
        assert(inventoryDeduction.quantityDelta === -2, "inventoryDeduction quantityDelta mismatch", {
          inventoryDeduction,
        });
        assert(Boolean(inventoryDeduction.movementId), "inventoryDeduction movementId missing", {
          inventoryDeduction,
        });
        assert(Boolean(inventoryDeduction.balanceId), "inventoryDeduction balanceId missing", {
          inventoryDeduction,
        });

        report = {
          ok: true,
          runId,
          companyId,
          serviceCompany: company,
          storeId: store.id,
          productId: product.id,
          sku,
          auditImportJobId: auditJob.id,
          auditRowId: auditRow.id,
          alias: aliasResult.item,
          resolve: resolveResult.item,
          reprocessImportJobId: reprocessJob.id,
          deduction,
          balance,
          inventoryDeduction,
        };

        throw new RollbackSignal(report);
      },
      { timeout: 30000, maxWait: 10000 },
    );
  } catch (err) {
    if (err instanceof RollbackSignal || err?.message === "INVENTORY_AUDIT_ALIAS_REPROCESS_ROLLBACK") {
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

  const leakedAliases = await prisma.productSkuAlias.findMany({
    where: { normalizedAliasSku: env.normalizedAliasSku },
    select: { id: true, aliasSku: true, normalizedAliasSku: true },
  });

  const leakedMovements = await prisma.inventoryMovement.findMany({
    where: {
      OR: [{ sourceId: env.orderIdAudit }, { sourceId: env.orderIdReprocess }],
    },
    select: { id: true, sourceId: true, quantity: true },
  });

  assert(leakedAliases.length === 0, "Rollback leak detected: alias persisted", { leakedAliases });
  assert(leakedMovements.length === 0, "Rollback leak detected: movement persisted", { leakedMovements });

  console.log("[SMOKE_OK] inventory audit alias reprocess rollback smoke passed");
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
