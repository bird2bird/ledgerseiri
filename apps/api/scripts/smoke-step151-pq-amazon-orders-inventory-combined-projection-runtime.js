#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "../../..");
const apiRoot = path.join(root, "apps/api");

const controller = fs.readFileSync(path.join(apiRoot, "src/imports/imports.controller.ts"), "utf8");
const invService = fs.readFileSync(path.join(apiRoot, "src/imports/amazon-sp-api-orders-inventory-dry-run-projection.service.ts"), "utf8");
const combinedService = fs.readFileSync(path.join(apiRoot, "src/imports/amazon-sp-api-orders-combined-dry-run-projection.service.ts"), "utf8");

function ok(condition, label) {
  if (!condition) throw new Error("[FAIL] " + label);
  console.log("[OK] " + label);
}

function no(source, needle, label) {
  ok(!source.includes(needle), label);
}

console.log("========== Step151-PQ API smoke: source boundary ==========");

ok(controller.includes("@Post('amazon-sp-api/orders/inventory-dry-run-projection')"), "inventory projection route exists");
ok(controller.includes("@Post('amazon-sp-api/orders/combined-dry-run-projection')"), "combined projection route exists");
ok(controller.includes("projectAmazonSpApiOrdersReadyRowsToInventoryDryRun"), "controller calls inventory projection");
ok(controller.includes("projectAmazonSpApiOrdersCombinedDryRun"), "controller calls combined projection");

for (const source of [invService, combinedService]) {
  ok(source.includes("writesDatabase: false"), "service marks writesDatabase=false");
  ok(source.includes("createsTransactionNow: false"), "service marks createsTransactionNow=false");
  ok(source.includes("createsInventoryMovementNow: false"), "service marks createsInventoryMovementNow=false");
  ok(source.includes("historicalSyncNow: false"), "service marks historicalSyncNow=false");

  for (const forbidden of [
    "transaction.create",
    "transaction.createMany",
    "inventoryMovement.create",
    "inventoryMovement.createMany",
    "previewAmazonSpApiOrdersHistoricalSyncPlan",
  ]) {
    no(source, forbidden, "service must not contain " + forbidden);
  }
}

ok(invService.includes("movementType: 'SALE'"), "inventory draft movementType SALE");
ok(invService.includes("direction: 'OUT'"), "inventory draft direction OUT");
ok(invService.includes("quantity"), "inventory draft quantity");
ok(invService.includes("dedupeKey"), "inventory draft dedupeKey");
ok(combinedService.includes("projectAmazonSpApiOrdersReadyRowsToTransactionDryRun"), "combined uses transaction projection");
ok(combinedService.includes("projectAmazonSpApiOrdersReadyRowsToInventoryDryRun"), "combined uses inventory projection");

console.log("========== Step151-PQ API smoke: runtime no-write ==========");

const runtimePath = path.join(apiRoot, "tmp-step151-pq-inventory-combined-runtime.ts");

fs.writeFileSync(runtimePath, `
import { PrismaClient } from '@prisma/client';
import { projectAmazonSpApiOrdersReadyRowsToInventoryDryRun } from './src/imports/amazon-sp-api-orders-inventory-dry-run-projection.service';
import { projectAmazonSpApiOrdersCombinedDryRun } from './src/imports/amazon-sp-api-orders-combined-dry-run-projection.service';

const prisma = new PrismaClient();

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
  console.log('[OK]', message);
}

async function countDb() {
  const anyPrisma = prisma as any;
  return {
    importJob: await anyPrisma.importJob.count(),
    importStagingRow: await anyPrisma.importStagingRow.count(),
    transaction: await anyPrisma.transaction.count(),
    inventoryMovement: await anyPrisma.inventoryMovement.count(),
  };
}

async function main() {
  const anyPrisma = prisma as any;

  const latestImportJob = await anyPrisma.importJob.findFirst({
    where: {
      sourceType: 'amazon-sp-api-orders',
      module: 'store-orders',
      domain: 'income',
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, companyId: true },
  });

  assert(latestImportJob?.id, 'latest amazon ImportJob exists for PQ runtime');

  const before = await countDb();
  console.log('[DB_BEFORE]', JSON.stringify(before));

  const inventory = await projectAmazonSpApiOrdersReadyRowsToInventoryDryRun({
    prisma: prisma as any,
    companyId: latestImportJob.companyId,
    importJobId: latestImportJob.id,
  });

  const combined = await projectAmazonSpApiOrdersCombinedDryRun({
    prisma: prisma as any,
    companyId: latestImportJob.companyId,
    importJobId: latestImportJob.id,
  });

  console.log('[INVENTORY_PROJECTION_RESULT]', JSON.stringify({
    importJobId: inventory.importJobId,
    totalReadinessRows: inventory.totalReadinessRows,
    projectedInventoryMovementRows: inventory.projectedInventoryMovementRows,
    excludedRows: inventory.excludedRows,
    quantityTotal: inventory.quantityTotal,
    firstDraft: inventory.drafts[0] || null,
    firstExcluded: inventory.excluded[0] || null,
    blockers: inventory.blockers,
    warnings: inventory.warnings,
  }));

  console.log('[COMBINED_PROJECTION_RESULT]', JSON.stringify({
    importJobId: combined.importJobId,
    combined: combined.combined,
    transactionDrafts: combined.transaction.drafts.length,
    inventoryDrafts: combined.inventory.drafts.length,
  }));

  for (const result of [inventory, combined]) {
    assert(result.dryRun === true, 'projection dryRun=true');
    assert(result.writesDatabase === false, 'projection writesDatabase=false');
    assert(result.transactionWriteNow === false, 'projection transactionWriteNow=false');
    assert(result.inventoryWriteNow === false, 'projection inventoryWriteNow=false');
    assert(result.createsTransactionNow === false, 'projection createsTransactionNow=false');
    assert(result.createsInventoryMovementNow === false, 'projection createsInventoryMovementNow=false');
    assert(result.historicalSyncNow === false, 'projection historicalSyncNow=false');
  }

  for (const draft of inventory.drafts) {
    assert(Boolean(draft.productSkuId), 'inventory draft productSkuId exists');
    assert(Number.isFinite(Number(draft.quantity)), 'inventory draft quantity is numeric');
    assert(draft.movementType === 'SALE', 'inventory draft movementType=SALE');
    assert(draft.direction === 'OUT', 'inventory draft direction=OUT');
    assert(Boolean(draft.evidenceStagingRowId), 'inventory draft evidenceStagingRowId exists');
    assert(Boolean(draft.dedupeKey), 'inventory draft dedupeKey exists');
  }

  const after = await countDb();
  console.log('[DB_AFTER]', JSON.stringify(after));

  assert(after.importJob === before.importJob, 'ImportJob count unchanged');
  assert(after.importStagingRow === before.importStagingRow, 'ImportStagingRow count unchanged');
  assert(after.transaction === before.transaction, 'Transaction count unchanged');
  assert(after.inventoryMovement === before.inventoryMovement, 'InventoryMovement count unchanged');
}

main()
  .catch((error) => {
    console.error('[FAIL]', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`);

try {
  execFileSync(process.execPath, [
    "-r",
    "ts-node/register",
    "-r",
    "tsconfig-paths/register",
    runtimePath,
  ], {
    cwd: apiRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      TS_NODE_TRANSPILE_ONLY: "1",
    },
  });
} finally {
  try { fs.unlinkSync(runtimePath); } catch {}
}

console.log("[OK] Step151-PQ API runtime smoke passed.");
console.log("[RESULT] Inventory/combined dry-run projection keeps DB counts unchanged.");
console.log("[RESULT] Transaction / InventoryMovement / historical sync remain blocked.");
