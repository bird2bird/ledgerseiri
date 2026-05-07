#!/usr/bin/env node
"use strict";

process.env.AMAZON_SP_API_SANDBOX_INTERNAL_ENABLED = "true";
process.env.AMAZON_SP_API_REAL_ENABLED = "false";
process.env.AMAZON_SP_API_OAUTH_ENABLED = "false";
process.env.AMAZON_SP_API_TOKEN_PERSISTENCE_ENABLED = "false";

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { ImportsService } = require("../dist/src/imports/imports.service");
const {
  buildAmazonOrderNormalizedPayload,
} = require("../dist/src/imports/amazon-order-normalized-contract");
const {
  buildAmazonSpApiSandboxOverrideAuditSnapshot,
  assertAmazonSpApiSandboxOverrideAuditSnapshot,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-override-audit-snapshot.dto");
const {
  buildAmazonSpApiSandboxPersistencePreflightChecklist,
  assertAmazonSpApiSandboxPersistencePreflightChecklist,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-persistence-preflight-checklist.dto");
const {
  buildAmazonSpApiSandboxStagedImportJobPersistencePlan,
  assertAmazonSpApiSandboxStagedImportJobPersistencePlan,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-staged-importjob-persistence-plan.dto");
const {
  buildAmazonSpApiSandboxStagedTransactionOverwritePlan,
  assertAmazonSpApiSandboxStagedTransactionOverwritePlan,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-staged-transaction-overwrite-plan.dto");
const {
  buildAmazonSpApiSandboxStagedInventoryCompensationPlan,
  assertAmazonSpApiSandboxStagedInventoryCompensationPlan,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-staged-inventory-compensation-plan.dto");

const prisma = new PrismaClient();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function expectReject(label, fn, expectedFragment) {
  try {
    await fn();
  } catch (err) {
    const message = String((err && err.message) || err);
    if (!message.includes(expectedFragment)) {
      throw new Error(`${label} rejected with unexpected message: ${message}`);
    }
    return { label, ok: true, message };
  }

  throw new Error(`${label} should have been rejected`);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function listFiles(dir, predicate, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      listFiles(p, predicate, acc);
    } else if (predicate(p)) {
      acc.push(p);
    }
  }
  return acc;
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
      amazonOrderId: `SPAPI-STEP118-C-ORDER-1-${runId}`,
      purchaseDate: "2026-05-07T12:34:56Z",
      marketplaceId: "A1VC38T7YXB528",
      orderStatus: "Shipped",
      fulfillmentChannel: "AFN",
      salesChannel: "Amazon.co.jp",
      orderTotal: { currencyCode: "JPY", amount: "9980" },
      items: [
        {
          orderItemId: `SPAPI-STEP118-C-ITEM-1-${runId}`,
          sellerSku: `spapi-step118-c-sku-001-${runId}`,
          title: `Step118-C Inventory Compensation Plan Product ${runId}`,
          quantityOrdered: "3",
          itemPrice: { currencyCode: "JPY", amount: "9980" },
          itemTax: { currencyCode: "JPY", amount: "998" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "820" } },
          ],
          raw: { fixture: "step118-c-item-1" },
        },
      ],
      raw: { fixture: "step118-c-order-1" },
    },
  ];
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const srcRoot = path.resolve(root, "src");
  const schemaFile = path.resolve(root, "prisma/schema.prisma");
  const importsServiceTs = path.resolve(root, "src/imports/imports.service.ts");
  const importsControllerTs = path.resolve(root, "src/imports/imports.controller.ts");

  const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const company = await resolveCompanyId();
  const service = new ImportsService(prisma);
  const filename = `step118-c-inventory-compensation-plan-${runId}.json`;

  const preview = await service.previewAmazonSpApiSandboxOrders({
    companyId: company.id,
    filename,
    orders: buildOrders(runId),
  });

  assert(preview.ok === true, "preview ok mismatch");
  assert(preview.rows.length === 1, "preview rows mismatch");

  const orderId = preview.rows[0].payload.orderId;
  const sellerSku = preview.rows[0].payload.sellerSku;

  const existingPayload = buildAmazonOrderNormalizedPayload({
    sourceType: "AMAZON_ORDER_CSV",
    importJobId: "existing-csv-import-job",
    sourceRowNo: 10,
    sourceFileName: "existing-order.csv",
    amazonOrderId: orderId,
    orderId,
    occurredAt: preview.rows[0].payload.occurredAt,
    sellerSku,
    quantity: 1,
    amount: 9900,
    grossAmount: 9900,
    netAmount: 9100,
    currency: "JPY",
    feeAmount: 800,
    businessMonth: preview.rows[0].payload.businessMonth,
    rawTransactionType: "注文",
    raw: { source: "csv-existing" },
  });

  const snapshot = assertAmazonSpApiSandboxOverrideAuditSnapshot(
    buildAmazonSpApiSandboxOverrideAuditSnapshot({
      existingPayload,
      spApiPayload: preview.rows[0].payload,
      overwrittenSource: "AMAZON_ORDER_CSV",
    }),
  );

  const preflightChecklist = assertAmazonSpApiSandboxPersistencePreflightChecklist(
    buildAmazonSpApiSandboxPersistencePreflightChecklist({ auditSnapshot: snapshot }),
  );

  const importJobPlan = assertAmazonSpApiSandboxStagedImportJobPersistencePlan(
    buildAmazonSpApiSandboxStagedImportJobPersistencePlan({
      companyId: company.id,
      filename,
      previewRows: preview.rows,
      preflightChecklist,
      overrideAuditSnapshots: [snapshot],
    }),
  );

  const txPlan = assertAmazonSpApiSandboxStagedTransactionOverwritePlan(
    buildAmazonSpApiSandboxStagedTransactionOverwritePlan({
      importJobPlan,
      overrideAuditSnapshots: [snapshot],
    }),
  );

  const invPlan = assertAmazonSpApiSandboxStagedInventoryCompensationPlan(
    buildAmazonSpApiSandboxStagedInventoryCompensationPlan({
      transactionOverwritePlan: txPlan,
    }),
  );

  assert(invPlan.version === "amazon-sp-api-sandbox-staged-inventory-compensation-plan-v1", "inventory plan version mismatch");
  assert(invPlan.planOnly === true, "inventory plan planOnly mismatch");
  assert(invPlan.writesDatabase === false, "inventory plan writesDatabase must be false");
  assert(invPlan.currentExecutionAllowed === false, "inventory plan execution must be false");
  assert(invPlan.futureExecutionRequiresPreflight === true, "inventory plan future preflight mismatch");
  assert(invPlan.normalizedSourceType === "AMAZON_ORDER_SP_API", "inventory plan normalized source mismatch");
  assert(invPlan.operations.length === 1, "inventory plan operation count mismatch");

  const op = invPlan.operations[0];
  assert(op.status === "BLOCKED_NOW", "inventory operation must be blocked now");
  assert(op.planOnly === true, "inventory operation planOnly mismatch");
  assert(op.writesDatabase === false, "inventory operation writesDatabase must be false");
  assert(op.currentExecutionAllowed === false, "inventory operation execution must be false");
  assert(op.amazonOrderId === orderId, "inventory operation amazonOrderId mismatch");
  assert(op.normalizedSellerSku, "inventory operation normalizedSellerSku missing");
  assert(op.quantityBefore === 1, "inventory quantityBefore mismatch");
  assert(op.quantityAfter === preview.rows[0].payload.quantity, "inventory quantityAfter mismatch");
  assert(op.quantityDelta === preview.rows[0].payload.quantity - 1, "inventory quantityDelta mismatch");
  assert(op.requiresManualReview === true, "inventory operation should require manual review");
  assert(op.requiresInventoryCompensationPlanApproval === true, "inventory operation should require compensation approval");
  assert(op.plannedMovement, "planned inventory movement should exist when quantity changes");
  assert(op.plannedMovement.type === "ADJUST", "planned movement type mismatch");
  assert(op.plannedMovement.sourceType === "AMAZON_ORDER_SP_API_OVERRIDE_COMPENSATION", "planned movement sourceType mismatch");
  assert(op.plannedMovement.quantityDelta === op.quantityDelta, "planned movement quantityDelta mismatch");
  assert(op.plannedMovement.transactionId === null, "planned movement transactionId must be null");
  assert(op.plannedMovement.importJobId === null, "planned movement importJobId must be null");
  assert(op.plannedMovement.memoMarkers.includes("[inventory-compensation:planned-only]"), "planned movement memo marker missing");
  assert(invPlan.warnings.includes("INVENTORY_COMPENSATION_QUANTITY_DELTA_DETECTED"), "inventory plan delta warning missing");
  assert(invPlan.warnings.includes("MANUAL_REVIEW_REQUIRED_BEFORE_INVENTORY_COMPENSATION"), "inventory plan manual review warning missing");

  for (const [key, blocked] of Object.entries(invPlan.blockedNow)) {
    assert(blocked === true, `invPlan.blockedNow.${key} must remain true`);
  }

  const beforeMovementCount = await prisma.inventoryMovement.count({
    where: {
      companyId: company.id,
      sourceId: op.operationId,
    },
  });

  assert(beforeMovementCount === 0, "inventory compensation plan must not create InventoryMovement");

  const nonDryRunReject = await expectReject(
    "Step118-C non-dry-run persist blocked",
    () =>
      service.commitAmazonSpApiSandboxOrdersToStaging({
        companyId: company.id,
        filename,
        preview,
        dryRun: false,
      }),
    "STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED",
  );

  const dryRun = await service.commitAmazonSpApiSandboxOrdersToStaging({
    companyId: company.id,
    filename,
    preview,
    dryRun: true,
  });

  assert(dryRun.ok === true, "dryRun ok mismatch");
  assert(dryRun.rollbackVerified === true, "dryRun rollbackVerified mismatch");

  const leakedJob = await prisma.importJob.findFirst({
    where: { filename },
    select: { id: true },
  });
  assert(!leakedJob, "inventory compensation plan smoke leaked ImportJob");

  const leakedRows = await prisma.importStagingRow.findMany({
    where: {
      dedupeHash: {
        in: [
          ...preview.rows.map((row) => row.dedupeHash),
          ...importJobPlan.plannedStagingRows.map((row) => row.dedupeHash),
        ],
      },
    },
    select: { id: true },
    take: 10,
  });
  assert(leakedRows.length === 0, `inventory compensation plan smoke leaked ImportStagingRow count=${leakedRows.length}`);

  const afterMovementCount = await prisma.inventoryMovement.count({
    where: {
      companyId: company.id,
      sourceId: op.operationId,
    },
  });
  assert(afterMovementCount === 0, "inventory compensation plan must not create InventoryMovement after dry-run");

  const schema = read(schemaFile);
  assert(schema.includes("model InventoryBalance"), "schema missing InventoryBalance");
  assert(schema.includes("model InventoryMovement"), "schema missing InventoryMovement");
  assert(schema.includes("enum InventoryMovementType"), "schema missing InventoryMovementType");
  assert(!schema.includes("InventoryCompensationPlan"), "Step118-C must not add inventory compensation plan table");
  assert(!schema.includes("TransactionOverwritePlan"), "Step118-C must not add transaction overwrite plan table");
  assert(!schema.includes("PersistencePlan"), "Step118-C must not add persistence plan table");
  assert(!schema.includes("AmazonSpApiCredential"), "Step118-C must not add credential table");
  assert(!schema.includes("AmazonSpApiToken"), "Step118-C must not add token table");
  assert(!schema.includes("CrossSourceDedupe"), "Step118-C must not add dedupe table");

  const serviceSource = read(importsServiceTs);
  assert(serviceSource.includes("STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED"), "service must still block non-dry-run");
  assert(serviceSource.includes("Only dryRun=true is allowed"), "service must still document dryRun-only");

  const controllerSource = read(importsControllerTs);
  assert(!controllerSource.includes("amazon-sp-api-sandbox-staged-inventory-compensation-plan"), "controller must not import inventory compensation plan");
  assert(!controllerSource.includes("previewAmazonSpApiSandboxOrders"), "controller must not expose preview method");
  assert(!controllerSource.includes("commitAmazonSpApiSandboxOrdersToStaging"), "controller must not expose commit method");

  const controllerFiles = listFiles(srcRoot, (p) => p.endsWith(".controller.ts"));
  const exposedRoutes = [];
  for (const file of controllerFiles) {
    const text = read(file);
    const routeRegex = /@(Get|Post|Put|Patch|Delete)\(\s*['"`]([^'"`]*)['"`]\s*\)/gi;
    let match;
    while ((match = routeRegex.exec(text))) {
      const route = String(match[2] || "").toLowerCase();
      const isSpApiRoute = route.includes("sp-api") || route.includes("spapi");
      const isAmazonSandboxRoute = route.includes("amazon") && route.includes("sandbox");
      const isAmazonInventoryRoute = route.includes("amazon") && route.includes("inventory");
      const isAmazonCompensationRoute = route.includes("amazon") && route.includes("compensation");
      if (isSpApiRoute || isAmazonSandboxRoute || isAmazonInventoryRoute || isAmazonCompensationRoute) {
        exposedRoutes.push({
          file: path.relative(root, file),
          method: match[1],
          route: match[2],
        });
      }
    }
  }
  assert(exposedRoutes.length === 0, `controller route leak: ${JSON.stringify(exposedRoutes)}`);

  console.log("[SMOKE_OK] amazon sp-api sandbox staged Inventory compensation plan smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        invPlan,
        rejected: [nonDryRunReject],
        dryRun: {
          rows: dryRun.rows.length,
          rollbackVerified: dryRun.rollbackVerified,
        },
        leakCheck: {
          beforeMovementCount,
          afterMovementCount,
          importJobLeaked: Boolean(leakedJob),
          stagingRowsLeaked: leakedRows.length,
        },
        controllerGuard: {
          scannedControllerFiles: controllerFiles.map((file) => path.relative(root, file)),
          exposedRoutes,
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
