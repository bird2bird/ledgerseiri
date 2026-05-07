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
const {
  buildAmazonSpApiSandboxGuardedExecutionReadinessMatrix,
  assertAmazonSpApiSandboxGuardedExecutionReadinessMatrix,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-guarded-execution-readiness-matrix.dto");
const {
  buildAmazonSpApiSandboxPlanningAggregate,
  assertAmazonSpApiSandboxPlanningAggregate,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-planning-aggregate.dto");

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
      amazonOrderId: `SPAPI-STEP119-A-ORDER-1-${runId}`,
      purchaseDate: "2026-05-07T12:34:56Z",
      marketplaceId: "A1VC38T7YXB528",
      orderStatus: "Shipped",
      fulfillmentChannel: "AFN",
      salesChannel: "Amazon.co.jp",
      orderTotal: { currencyCode: "JPY", amount: "11980" },
      items: [
        {
          orderItemId: `SPAPI-STEP119-A-ITEM-1-${runId}`,
          sellerSku: `spapi-step119-a-sku-001-${runId}`,
          title: `Step119-A Planning Aggregate Product ${runId}`,
          quantityOrdered: "3",
          itemPrice: { currencyCode: "JPY", amount: "11980" },
          itemTax: { currencyCode: "JPY", amount: "1198" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "980" } },
          ],
          raw: { fixture: "step119-a-item-1" },
        },
      ],
      raw: { fixture: "step119-a-order-1" },
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
  const filename = `step119-a-planning-aggregate-${runId}.json`;

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
    amount: 11900,
    grossAmount: 11900,
    netAmount: 10900,
    currency: "JPY",
    feeAmount: 1000,
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

  const readinessMatrix = assertAmazonSpApiSandboxGuardedExecutionReadinessMatrix(
    buildAmazonSpApiSandboxGuardedExecutionReadinessMatrix({
      inventoryCompensationPlan: invPlan,
    }),
  );

  const aggregate = assertAmazonSpApiSandboxPlanningAggregate(
    buildAmazonSpApiSandboxPlanningAggregate({
      companyId: company.id,
      filename,
      previewRows: preview.rows,
      overrideAuditSnapshots: [snapshot],
      preflightChecklist,
      importJobPlan,
      transactionOverwritePlan: txPlan,
      inventoryCompensationPlan: invPlan,
      readinessMatrix,
    }),
  );

  assert(aggregate.version === "amazon-sp-api-sandbox-planning-aggregate-v1", "aggregate version mismatch");
  assert(aggregate.planOnly === true, "aggregate planOnly mismatch");
  assert(aggregate.writesDatabase === false, "aggregate writesDatabase must be false");
  assert(aggregate.currentExecutionAllowed === false, "aggregate currentExecutionAllowed must be false");
  assert(aggregate.dryRunFalseAllowed === false, "aggregate dryRunFalseAllowed must be false");
  assert(aggregate.companyId === company.id, "aggregate companyId mismatch");
  assert(aggregate.filename === filename, "aggregate filename mismatch");

  assert(aggregate.previewRows.length === 1, "aggregate preview row count mismatch");
  assert(aggregate.overrideAuditSnapshots.length === 1, "aggregate audit snapshot count mismatch");
  assert(aggregate.importJobPlan.plannedStagingRows.length === 1, "aggregate importJobPlan row count mismatch");
  assert(aggregate.transactionOverwritePlan.operations.length === 1, "aggregate tx operation count mismatch");
  assert(aggregate.inventoryCompensationPlan.operations.length === 1, "aggregate inventory operation count mismatch");

  assert(aggregate.chain[0] === "preview", "aggregate chain should start from preview");
  assert(aggregate.chain.includes("guarded-execution-readiness-matrix"), "aggregate chain missing readiness matrix");

  assert(aggregate.summary.previewRows === 1, "summary previewRows mismatch");
  assert(aggregate.summary.auditSnapshots === 1, "summary auditSnapshots mismatch");
  assert(aggregate.summary.plannedImportJobRows === 1, "summary plannedImportJobRows mismatch");
  assert(aggregate.summary.transactionOverwriteOperations === 1, "summary transactionOverwriteOperations mismatch");
  assert(aggregate.summary.inventoryCompensationOperations === 1, "summary inventoryCompensationOperations mismatch");
  assert(aggregate.summary.allowedCapabilities === readinessMatrix.summary.allowedCapabilities, "summary allowedCapabilities mismatch");
  assert(aggregate.summary.blockedCapabilities === readinessMatrix.summary.blockedCapabilities, "summary blockedCapabilities mismatch");

  assert(aggregate.summary.mayContinuePlanOnly === true, "aggregate mayContinuePlanOnly should be true");
  assert(aggregate.summary.mayPersistImportJob === false, "aggregate mayPersistImportJob must be false");
  assert(aggregate.summary.mayPersistStagingRows === false, "aggregate mayPersistStagingRows must be false");
  assert(aggregate.summary.mayOverwriteTransaction === false, "aggregate mayOverwriteTransaction must be false");
  assert(aggregate.summary.mayCreateInventoryCompensation === false, "aggregate mayCreateInventoryCompensation must be false");
  assert(aggregate.summary.mayOpenController === false, "aggregate mayOpenController must be false");
  assert(aggregate.summary.mayOpenFrontend === false, "aggregate mayOpenFrontend must be false");
  assert(aggregate.summary.mayCallRealSpApi === false, "aggregate mayCallRealSpApi must be false");
  assert(aggregate.summary.mayPersistToken === false, "aggregate mayPersistToken must be false");

  for (const [key, blocked] of Object.entries(aggregate.blockedNow)) {
    assert(blocked === true, `aggregate.blockedNow.${key} must remain true`);
  }

  const beforeJobCount = await prisma.importJob.count({ where: { filename } });
  const beforeTxCount = await prisma.transaction.count({ where: { companyId: company.id, sourceFileName: filename } });
  const beforeMovementCount = await prisma.inventoryMovement.count({
    where: {
      companyId: company.id,
      sourceId: invPlan.operations[0]?.operationId || "missing-operation",
    },
  });

  assert(beforeJobCount === 0, "planning aggregate must not create ImportJob");
  assert(beforeTxCount === 0, "planning aggregate must not create Transaction");
  assert(beforeMovementCount === 0, "planning aggregate must not create InventoryMovement");

  const nonDryRunReject = await expectReject(
    "Step119-A non-dry-run persist blocked",
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
  assert(!leakedJob, "planning aggregate smoke leaked ImportJob");

  const afterTxCount = await prisma.transaction.count({ where: { companyId: company.id, sourceFileName: filename } });
  assert(afterTxCount === 0, "planning aggregate must not create Transaction after dry-run");

  const afterMovementCount = await prisma.inventoryMovement.count({
    where: {
      companyId: company.id,
      sourceId: invPlan.operations[0]?.operationId || "missing-operation",
    },
  });
  assert(afterMovementCount === 0, "planning aggregate must not create InventoryMovement after dry-run");

  const schema = read(schemaFile);
  assert(schema.includes("model ImportJob"), "schema missing ImportJob");
  assert(schema.includes("model Transaction"), "schema missing Transaction");
  assert(schema.includes("model InventoryMovement"), "schema missing InventoryMovement");
  assert(!schema.includes("PlanningAggregate"), "Step119-A must not add aggregate table");
  assert(!schema.includes("ExecutionReadiness"), "Step119-A must not add readiness table");
  assert(!schema.includes("InventoryCompensationPlan"), "Step119-A must not add inventory compensation plan table");
  assert(!schema.includes("TransactionOverwritePlan"), "Step119-A must not add transaction overwrite plan table");
  assert(!schema.includes("AmazonSpApiCredential"), "Step119-A must not add credential table");
  assert(!schema.includes("AmazonSpApiToken"), "Step119-A must not add token table");

  const serviceSource = read(importsServiceTs);
  assert(serviceSource.includes("STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED"), "service must still block non-dry-run");
  assert(serviceSource.includes("Only dryRun=true is allowed"), "service must still document dryRun-only");

  const controllerSource = read(importsControllerTs);
  assert(!controllerSource.includes("amazon-sp-api-sandbox-planning-aggregate"), "controller must not import planning aggregate");
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
      const isAmazonPlanningRoute = route.includes("amazon") && route.includes("planning");
      const isAmazonAggregateRoute = route.includes("amazon") && route.includes("aggregate");
      if (isSpApiRoute || isAmazonSandboxRoute || isAmazonPlanningRoute || isAmazonAggregateRoute) {
        exposedRoutes.push({
          file: path.relative(root, file),
          method: match[1],
          route: match[2],
        });
      }
    }
  }
  assert(exposedRoutes.length === 0, `controller route leak: ${JSON.stringify(exposedRoutes)}`);

  console.log("[SMOKE_OK] amazon sp-api sandbox planning aggregate smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        aggregate,
        rejected: [nonDryRunReject],
        dryRun: {
          rows: dryRun.rows.length,
          rollbackVerified: dryRun.rollbackVerified,
        },
        leakCheck: {
          beforeJobCount,
          beforeTxCount,
          beforeMovementCount,
          importJobLeaked: Boolean(leakedJob),
          afterTxCount,
          afterMovementCount,
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
