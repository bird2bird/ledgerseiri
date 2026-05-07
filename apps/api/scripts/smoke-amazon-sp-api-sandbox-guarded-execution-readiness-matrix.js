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
      amazonOrderId: `SPAPI-STEP118-D-ORDER-1-${runId}`,
      purchaseDate: "2026-05-07T12:34:56Z",
      marketplaceId: "A1VC38T7YXB528",
      orderStatus: "Shipped",
      fulfillmentChannel: "AFN",
      salesChannel: "Amazon.co.jp",
      orderTotal: { currencyCode: "JPY", amount: "10980" },
      items: [
        {
          orderItemId: `SPAPI-STEP118-D-ITEM-1-${runId}`,
          sellerSku: `spapi-step118-d-sku-001-${runId}`,
          title: `Step118-D Readiness Matrix Product ${runId}`,
          quantityOrdered: "3",
          itemPrice: { currencyCode: "JPY", amount: "10980" },
          itemTax: { currencyCode: "JPY", amount: "1098" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "900" } },
          ],
          raw: { fixture: "step118-d-item-1" },
        },
      ],
      raw: { fixture: "step118-d-order-1" },
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
  const filename = `step118-d-readiness-matrix-${runId}.json`;

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
    amount: 10900,
    grossAmount: 10900,
    netAmount: 10000,
    currency: "JPY",
    feeAmount: 900,
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

  const matrix = assertAmazonSpApiSandboxGuardedExecutionReadinessMatrix(
    buildAmazonSpApiSandboxGuardedExecutionReadinessMatrix({
      inventoryCompensationPlan: invPlan,
    }),
  );

  assert(matrix.version === "amazon-sp-api-sandbox-guarded-execution-readiness-matrix-v1", "matrix version mismatch");
  assert(matrix.currentExecutionMode === "INTERNAL_PLAN_ONLY", "matrix execution mode mismatch");
  assert(matrix.globalExecutionAllowed === false, "global execution must be false");
  assert(matrix.writesDatabase === false, "matrix writesDatabase must be false");
  assert(matrix.dryRunFalseAllowed === false, "dryRunFalseAllowed must be false");
  assert(matrix.summary.totalGates >= 10, "matrix should contain sufficient gates");
  assert(matrix.summary.blockingGates > 0, "matrix should have blocking gates");
  assert(matrix.summary.allowedCapabilities === 4, "only plan/preview capabilities should be allowed");
  assert(matrix.summary.readyForAnyPersistence === false, "readyForAnyPersistence must be false");
  assert(matrix.summary.readyForController === false, "readyForController must be false");
  assert(matrix.summary.readyForFrontend === false, "readyForFrontend must be false");
  assert(matrix.summary.readyForRealSpApi === false, "readyForRealSpApi must be false");

  const allowedCapabilities = matrix.capabilities.filter((item) => item.allowedNow).map((item) => item.capability).sort();
  assert(JSON.stringify(allowedCapabilities) === JSON.stringify([
    "preview",
    "staged-importjob-plan",
    "staged-inventory-compensation-plan",
    "staged-transaction-overwrite-plan",
  ].sort()), `unexpected allowed capabilities: ${JSON.stringify(allowedCapabilities)}`);

  for (const capability of [
    "persist-importjob",
    "persist-staging-rows",
    "overwrite-transaction",
    "create-inventory-compensation",
    "real-sp-api-sync",
    "oauth-connect",
    "token-persistence",
    "controller-api",
    "frontend-ui",
  ]) {
    const item = matrix.capabilities.find((entry) => entry.capability === capability);
    assert(item, `missing capability: ${capability}`);
    assert(item.allowedNow === false, `${capability} must remain blocked`);
    assert(item.blockedBy.length > 0, `${capability} must have blocking gates`);
  }

  assert(matrix.finalDecision.mayContinuePlanOnly === true, "plan-only continuation should be allowed");
  assert(matrix.finalDecision.mayPersistImportJob === false, "ImportJob persistence must remain blocked");
  assert(matrix.finalDecision.mayPersistStagingRows === false, "staging row persistence must remain blocked");
  assert(matrix.finalDecision.mayOverwriteTransaction === false, "Transaction overwrite must remain blocked");
  assert(matrix.finalDecision.mayCreateInventoryCompensation === false, "inventory compensation must remain blocked");
  assert(matrix.finalDecision.mayOpenController === false, "controller must remain blocked");
  assert(matrix.finalDecision.mayOpenFrontend === false, "frontend must remain blocked");
  assert(matrix.finalDecision.mayCallRealSpApi === false, "real SP-API must remain blocked");
  assert(matrix.finalDecision.mayPersistToken === false, "token persistence must remain blocked");

  const beforeJobCount = await prisma.importJob.count({ where: { filename } });
  const beforeTxCount = await prisma.transaction.count({ where: { companyId: company.id, sourceFileName: filename } });
  const beforeMovementCount = await prisma.inventoryMovement.count({
    where: {
      companyId: company.id,
      sourceId: invPlan.operations[0]?.operationId || "missing-operation",
    },
  });

  assert(beforeJobCount === 0, "readiness matrix must not create ImportJob");
  assert(beforeTxCount === 0, "readiness matrix must not create Transaction");
  assert(beforeMovementCount === 0, "readiness matrix must not create InventoryMovement");

  const nonDryRunReject = await expectReject(
    "Step118-D non-dry-run persist blocked",
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
  assert(!leakedJob, "readiness matrix smoke leaked ImportJob");

  const afterTxCount = await prisma.transaction.count({ where: { companyId: company.id, sourceFileName: filename } });
  assert(afterTxCount === 0, "readiness matrix must not create Transaction after dry-run");

  const afterMovementCount = await prisma.inventoryMovement.count({
    where: {
      companyId: company.id,
      sourceId: invPlan.operations[0]?.operationId || "missing-operation",
    },
  });
  assert(afterMovementCount === 0, "readiness matrix must not create InventoryMovement after dry-run");

  const schema = read(schemaFile);
  assert(schema.includes("model ImportJob"), "schema missing ImportJob");
  assert(schema.includes("model Transaction"), "schema missing Transaction");
  assert(schema.includes("model InventoryMovement"), "schema missing InventoryMovement");
  assert(!schema.includes("ExecutionReadiness"), "Step118-D must not add readiness table");
  assert(!schema.includes("ReadinessMatrix"), "Step118-D must not add matrix table");
  assert(!schema.includes("InventoryCompensationPlan"), "Step118-D must not add inventory compensation plan table");
  assert(!schema.includes("TransactionOverwritePlan"), "Step118-D must not add transaction overwrite plan table");
  assert(!schema.includes("AmazonSpApiCredential"), "Step118-D must not add credential table");
  assert(!schema.includes("AmazonSpApiToken"), "Step118-D must not add token table");

  const serviceSource = read(importsServiceTs);
  assert(serviceSource.includes("STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED"), "service must still block non-dry-run");
  assert(serviceSource.includes("Only dryRun=true is allowed"), "service must still document dryRun-only");

  const controllerSource = read(importsControllerTs);
  assert(!controllerSource.includes("amazon-sp-api-sandbox-guarded-execution-readiness-matrix"), "controller must not import readiness matrix");
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
      const isAmazonReadinessRoute = route.includes("amazon") && route.includes("readiness");
      const isAmazonExecutionRoute = route.includes("amazon") && route.includes("execution");
      if (isSpApiRoute || isAmazonSandboxRoute || isAmazonReadinessRoute || isAmazonExecutionRoute) {
        exposedRoutes.push({
          file: path.relative(root, file),
          method: match[1],
          route: match[2],
        });
      }
    }
  }
  assert(exposedRoutes.length === 0, `controller route leak: ${JSON.stringify(exposedRoutes)}`);

  console.log("[SMOKE_OK] amazon sp-api sandbox guarded execution readiness matrix smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        matrix,
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
