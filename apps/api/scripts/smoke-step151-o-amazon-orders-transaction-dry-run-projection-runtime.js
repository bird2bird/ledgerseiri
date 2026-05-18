#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "../../..");
const apiRoot = path.join(root, "apps/api");

const controller = fs.readFileSync(path.join(apiRoot, "src/imports/imports.controller.ts"), "utf8");
const service = fs.readFileSync(path.join(apiRoot, "src/imports/amazon-sp-api-orders-transaction-dry-run-projection.service.ts"), "utf8");
const dto = fs.readFileSync(path.join(apiRoot, "src/imports/dto/amazon-sp-api-orders-transaction-dry-run-projection-contract.dto.ts"), "utf8");

function ok(condition, label) {
  if (!condition) throw new Error("[FAIL] " + label);
  console.log("[OK] " + label);
}

function no(source, needle, label) {
  ok(!source.includes(needle), label);
}

console.log("========== Step151-O API smoke: source boundary ==========");

ok(controller.includes("@Post('amazon-sp-api/orders/transaction-dry-run-projection')"), "controller route exists");
ok(controller.includes("projectAmazonSpApiOrdersReadyRowsToTransactionDryRun"), "controller calls projection service");
ok(controller.includes("controllerWritesDatabase: false"), "controller marks writesDatabase=false");
ok(controller.includes("controllerWritesTransaction: false"), "controller marks writesTransaction=false");
ok(controller.includes("controllerWritesInventoryMovement: false"), "controller marks writesInventoryMovement=false");

ok(service.includes("evaluateAmazonSpApiOrdersStagingCommitReadiness"), "service reuses readiness");
ok(service.includes("row.readiness !== 'READY'"), "service excludes non-READY rows");
ok(service.includes("transactionDate"), "service projects transactionDate");
ok(service.includes("amount"), "service projects amount");
ok(service.includes("counterparty: 'Amazon.co.jp'"), "service projects counterparty");
ok(service.includes("dedupeHash"), "service projects dedupeHash");
ok(service.includes("evidenceType: 'ImportStagingRow'"), "service projects evidence source row");
ok(service.includes("createsTransactionNow: false"), "service marks createsTransactionNow=false");
ok(service.includes("createsInventoryMovementNow: false"), "service marks createsInventoryMovementNow=false");

ok(dto.includes("writesDatabase: false"), "DTO enforces writesDatabase=false");
ok(dto.includes("transactionWriteNow: false"), "DTO enforces transactionWriteNow=false");
ok(dto.includes("inventoryWriteNow: false"), "DTO enforces inventoryWriteNow=false");
ok(dto.includes("createsTransactionNow: false"), "DTO enforces createsTransactionNow=false");
ok(dto.includes("createsInventoryMovementNow: false"), "DTO enforces createsInventoryMovementNow=false");

for (const forbidden of [
  "transaction.create",
  "transaction.createMany",
  "inventoryMovement.create",
  "inventoryMovement.createMany",
  "previewAmazonSpApiOrdersHistoricalSyncPlan",
]) {
  no(service, forbidden, "projection service must not contain " + forbidden);
}

console.log("========== Step151-O API smoke: runtime no-write ==========");

const runtimePath = path.join(apiRoot, "tmp-step151-o-transaction-projection-runtime.ts");

fs.writeFileSync(runtimePath, `
import { PrismaClient } from '@prisma/client';
import { projectAmazonSpApiOrdersReadyRowsToTransactionDryRun } from './src/imports/amazon-sp-api-orders-transaction-dry-run-projection.service';

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

  assert(latestImportJob?.id, 'latest amazon ImportJob exists for projection runtime');

  const before = await countDb();
  console.log('[DB_BEFORE]', JSON.stringify(before));

  const result = await projectAmazonSpApiOrdersReadyRowsToTransactionDryRun({
    prisma: prisma as any,
    companyId: latestImportJob.companyId,
    importJobId: latestImportJob.id,
  });

  console.log('[TRANSACTION_PROJECTION_RESULT]', JSON.stringify({
    importJobId: result.importJobId,
    totalReadinessRows: result.totalReadinessRows,
    projectedTransactionRows: result.projectedTransactionRows,
    excludedRows: result.excludedRows,
    amountTotal: result.amountTotal,
    firstDraft: result.drafts[0] || null,
    firstExcluded: result.excluded[0] || null,
    blockers: result.blockers,
    warnings: result.warnings,
  }));

  assert(result.dryRun === true, 'projection dryRun=true');
  assert(result.writesDatabase === false, 'projection writesDatabase=false');
  assert(result.transactionWriteNow === false, 'projection transactionWriteNow=false');
  assert(result.inventoryWriteNow === false, 'projection inventoryWriteNow=false');
  assert(result.createsTransactionNow === false, 'projection createsTransactionNow=false');
  assert(result.createsInventoryMovementNow === false, 'projection createsInventoryMovementNow=false');
  assert(result.historicalSyncNow === false, 'projection historicalSyncNow=false');
  assert(Array.isArray(result.drafts), 'projection drafts array exists');
  assert(Array.isArray(result.excluded), 'projection excluded array exists');

  for (const draft of result.drafts) {
    assert(Boolean(draft.transactionDate), 'draft transactionDate exists');
    assert(Number.isFinite(Number(draft.amount)), 'draft amount is numeric');
    assert(Boolean(draft.currency), 'draft currency exists');
    assert(Boolean(draft.counterparty), 'draft counterparty exists');
    assert(Boolean(draft.source), 'draft source exists');
    assert(Boolean(draft.evidenceStagingRowId), 'draft evidenceStagingRowId exists');
    assert(Boolean(draft.dedupeHash), 'draft dedupeHash exists');
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

console.log("[OK] Step151-O API runtime smoke passed.");
console.log("[RESULT] Transaction dry-run projection keeps DB counts unchanged.");
console.log("[RESULT] Transaction / InventoryMovement / historical sync remain blocked.");
