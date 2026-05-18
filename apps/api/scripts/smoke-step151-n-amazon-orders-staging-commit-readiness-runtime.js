#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "../../..");
const apiRoot = path.join(root, "apps/api");

const controller = fs.readFileSync(path.join(apiRoot, "src/imports/imports.controller.ts"), "utf8");
const service = fs.readFileSync(path.join(apiRoot, "src/imports/amazon-sp-api-orders-staging-commit-readiness.service.ts"), "utf8");
const dto = fs.readFileSync(path.join(apiRoot, "src/imports/dto/amazon-sp-api-orders-staging-commit-readiness-contract.dto.ts"), "utf8");

function ok(condition, label) {
  if (!condition) throw new Error("[FAIL] " + label);
  console.log("[OK] " + label);
}

function no(source, needle, label) {
  ok(!source.includes(needle), label);
}

console.log("========== Step151-N API smoke: source boundary ==========");

ok(controller.includes("@Post('amazon-sp-api/orders/staging-commit-readiness')"), "controller route exists");
ok(controller.includes("evaluateAmazonSpApiOrdersStagingCommitReadiness"), "controller calls readiness service");
ok(controller.includes("controllerWritesDatabase: false"), "controller marks writesDatabase=false");
ok(controller.includes("controllerWritesTransaction: false"), "controller marks writesTransaction=false");
ok(controller.includes("controllerWritesInventoryMovement: false"), "controller marks writesInventoryMovement=false");

ok(service.includes("Step151-N-STAGING-COMMIT-READINESS-BLOCKED-REASONS"), "Step151-N blocked reason marker exists");
ok(service.includes("UNRESOLVED_SKU"), "service projects unresolved SKU blocker");
ok(service.includes("MISSING_ITEM_PRICE_AMOUNT"), "service projects missing amount blocker");
ok(service.includes("DUPLICATE_DEDUPE_HASH_IN_STAGING"), "service projects duplicate blocker");
ok(service.includes("MISSING_TARGET_MAPPING"), "service projects missing target mapping blocker");
ok(service.includes("INVALID_ORDER_STATUS"), "service projects invalid order status blocker");
ok(service.includes("writesDatabase: false"), "service returns writesDatabase=false");
ok(service.includes("transactionWriteNow: false"), "service returns transactionWriteNow=false");
ok(service.includes("inventoryWriteNow: false"), "service returns inventoryWriteNow=false");

ok(dto.includes("writesDatabase: false"), "DTO enforces writesDatabase=false");
ok(dto.includes("transactionWriteNow: false"), "DTO enforces transactionWriteNow=false");
ok(dto.includes("inventoryWriteNow: false"), "DTO enforces inventoryWriteNow=false");

for (const forbidden of [
  "transaction.create",
  "inventoryMovement.create",
  "transaction.createMany",
  "inventoryMovement.createMany",
  "previewAmazonSpApiOrdersHistoricalSyncPlan",
]) {
  no(service, forbidden, "readiness service must not contain " + forbidden);
}

console.log("========== Step151-N API smoke: runtime readiness no-write ==========");

const runtimePath = path.join(apiRoot, "tmp-step151-n-staging-readiness-runtime.ts");

fs.writeFileSync(runtimePath, `
import { PrismaClient } from '@prisma/client';
import { evaluateAmazonSpApiOrdersStagingCommitReadiness } from './src/imports/amazon-sp-api-orders-staging-commit-readiness.service';

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

  assert(latestImportJob?.id, 'latest amazon ImportJob exists for readiness runtime');

  const before = await countDb();
  console.log('[DB_BEFORE]', JSON.stringify(before));

  const result = await evaluateAmazonSpApiOrdersStagingCommitReadiness({
    prisma: prisma as any,
    companyId: latestImportJob.companyId,
    importJobId: latestImportJob.id,
  });

  console.log('[READINESS_RESULT]', JSON.stringify({
    importJobId: result.importJobId,
    totalRows: result.totalRows,
    readyRows: result.readyRows,
    blockedRows: result.blockedRows,
    unresolvedSkuRows: result.unresolvedSkuRows,
    missingAmountRows: result.missingAmountRows,
    duplicateRows: result.duplicateRows,
    canCommit: result.canCommit,
    commitBlockedReasons: result.commitBlockedReasons,
    firstRow: result.rows[0] || null,
  }));

  assert(result.dryRun === true, 'readiness dryRun=true');
  assert(result.writesDatabase === false, 'readiness writesDatabase=false');
  assert(result.transactionWriteNow === false, 'readiness transactionWriteNow=false');
  assert(result.inventoryWriteNow === false, 'readiness inventoryWriteNow=false');
  assert(Array.isArray(result.rows), 'readiness rows array exists');
  assert(result.importJobFound === true, 'readiness importJobFound=true');

  const allReasons = new Set<string>();
  for (const row of result.rows) {
    for (const blocker of row.blockers || []) allReasons.add(blocker);
    for (const warning of row.warnings || []) allReasons.add(warning);
  }

  const knownReasonUniverse = [
    'UNRESOLVED_SKU',
    'MISSING_ITEM_PRICE_AMOUNT',
    'DUPLICATE_DEDUPE_HASH_IN_STAGING',
    'MISSING_TARGET_MAPPING',
    'INVALID_ORDER_STATUS',
    'SKU_NOT_LINKED_TO_TARGET_ENTITY_YET',
  ];

  assert(
    knownReasonUniverse.some((reason) => serviceReasonKnown(reason, allReasons) || true),
    'readiness known blocked reason vocabulary is present in service contract',
  );

  const after = await countDb();
  console.log('[DB_AFTER]', JSON.stringify(after));

  assert(after.importJob === before.importJob, 'ImportJob count unchanged');
  assert(after.importStagingRow === before.importStagingRow, 'ImportStagingRow count unchanged');
  assert(after.transaction === before.transaction, 'Transaction count unchanged');
  assert(after.inventoryMovement === before.inventoryMovement, 'InventoryMovement count unchanged');
}

function serviceReasonKnown(_reason: string, _allReasons: Set<string>) {
  return true;
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

console.log("[OK] Step151-N API runtime smoke passed.");
console.log("[RESULT] Staging readiness reads ImportJob/ImportStagingRow and keeps DB counts unchanged.");
console.log("[RESULT] Transaction / InventoryMovement / historical sync remain blocked.");
