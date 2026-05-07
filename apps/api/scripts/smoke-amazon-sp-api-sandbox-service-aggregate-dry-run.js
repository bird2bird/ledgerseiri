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
      amazonOrderId: `SPAPI-STEP119-B-ORDER-1-${runId}`,
      purchaseDate: "2026-05-07T12:34:56Z",
      marketplaceId: "A1VC38T7YXB528",
      orderStatus: "Shipped",
      fulfillmentChannel: "AFN",
      salesChannel: "Amazon.co.jp",
      orderTotal: { currencyCode: "JPY", amount: "12980" },
      items: [
        {
          orderItemId: `SPAPI-STEP119-B-ITEM-1-${runId}`,
          sellerSku: `spapi-step119-b-sku-001-${runId}`,
          title: `Step119-B Service Aggregate Product ${runId}`,
          quantityOrdered: "3",
          itemPrice: { currencyCode: "JPY", amount: "12980" },
          itemTax: { currencyCode: "JPY", amount: "1298" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "1080" } },
          ],
          raw: { fixture: "step119-b-item-1" },
        },
      ],
      raw: { fixture: "step119-b-order-1" },
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
  const filename = `step119-b-service-aggregate-${runId}.json`;
  const orders = buildOrders(runId);

  const aggregateResult = await service.planAmazonSpApiSandboxImportAggregate({
    companyId: company.id,
    filename,
    orders,
    existingOrders: [
      {
        amazonOrderId: orders[0].amazonOrderId,
        orderId: orders[0].amazonOrderId,
        occurredAt: orders[0].purchaseDate,
        sellerSku: orders[0].items[0].sellerSku,
        quantity: 1,
        amount: 12900,
        grossAmount: 12900,
        netAmount: 11800,
        feeAmount: 1100,
        currency: "JPY",
        businessMonth: "2026-05",
        sourceType: "AMAZON_ORDER_CSV",
        importJobId: "existing-csv-import-job",
        sourceFileName: "existing-order.csv",
        sourceRowNo: 10,
        raw: { source: "csv-existing" },
      },
    ],
    dryRun: true,
  });

  assert(aggregateResult.ok === true, "aggregateResult ok mismatch");
  assert(aggregateResult.dryRun === true, "aggregateResult dryRun mismatch");
  assert(aggregateResult.rollbackVerified === true, "aggregateResult rollbackVerified mismatch");
  assert(aggregateResult.planOnly === true, "aggregateResult planOnly mismatch");
  assert(aggregateResult.writesDatabase === false, "aggregateResult writesDatabase mismatch");
  assert(aggregateResult.companyId === company.id, "aggregateResult companyId mismatch");
  assert(aggregateResult.filename === filename, "aggregateResult filename mismatch");
  assert(aggregateResult.preview.ok === true, "preview ok mismatch");
  assert(aggregateResult.preview.rows.length === 1, "preview row count mismatch");

  const aggregate = aggregateResult.aggregate;
  assert(aggregate.version === "amazon-sp-api-sandbox-planning-aggregate-v1", "aggregate version mismatch");
  assert(aggregate.planOnly === true, "aggregate planOnly mismatch");
  assert(aggregate.writesDatabase === false, "aggregate writesDatabase must be false");
  assert(aggregate.currentExecutionAllowed === false, "aggregate currentExecutionAllowed must be false");
  assert(aggregate.dryRunFalseAllowed === false, "aggregate dryRunFalseAllowed must be false");
  assert(aggregate.previewRows.length === 1, "aggregate previewRows mismatch");
  assert(aggregate.overrideAuditSnapshots.length === 1, "aggregate audit snapshot count mismatch");
  assert(aggregate.importJobPlan.plannedStagingRows.length === 1, "aggregate importJob planned rows mismatch");
  assert(aggregate.transactionOverwritePlan.operations.length === 1, "aggregate tx operations mismatch");
  assert(aggregate.inventoryCompensationPlan.operations.length === 1, "aggregate inventory operations mismatch");

  assert(aggregate.summary.mayContinuePlanOnly === true, "plan-only continuation should be true");
  assert(aggregate.summary.mayPersistImportJob === false, "ImportJob persistence must remain false");
  assert(aggregate.summary.mayPersistStagingRows === false, "staging persistence must remain false");
  assert(aggregate.summary.mayOverwriteTransaction === false, "Transaction overwrite must remain false");
  assert(aggregate.summary.mayCreateInventoryCompensation === false, "Inventory compensation must remain false");
  assert(aggregate.summary.mayOpenController === false, "controller must remain false");
  assert(aggregate.summary.mayOpenFrontend === false, "frontend must remain false");
  assert(aggregate.summary.mayCallRealSpApi === false, "real SP-API must remain false");
  assert(aggregate.summary.mayPersistToken === false, "token persistence must remain false");

  assert(aggregate.readinessMatrix.finalDecision.mayContinuePlanOnly === true, "readiness plan-only mismatch");
  assert(aggregate.readinessMatrix.finalDecision.mayPersistImportJob === false, "readiness ImportJob persistence mismatch");
  assert(aggregate.readinessMatrix.finalDecision.mayOverwriteTransaction === false, "readiness tx overwrite mismatch");
  assert(aggregate.readinessMatrix.finalDecision.mayCreateInventoryCompensation === false, "readiness inventory compensation mismatch");

  const nonDryRunReject = await expectReject(
    "Step119-B aggregate non-dry-run blocked",
    () =>
      service.planAmazonSpApiSandboxImportAggregate({
        companyId: company.id,
        filename,
        orders,
        dryRun: false,
      }),
    "STEP119_B_SP_API_SANDBOX_AGGREGATE_NON_DRY_RUN_BLOCKED",
  );

  const stagingNonDryRunReject = await expectReject(
    "Step119-B staging non-dry-run still blocked",
    () =>
      service.commitAmazonSpApiSandboxOrdersToStaging({
        companyId: company.id,
        filename,
        preview: aggregateResult.preview,
        dryRun: false,
      }),
    "STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED",
  );

  const leakedJob = await prisma.importJob.findFirst({
    where: { filename },
    select: { id: true },
  });
  assert(!leakedJob, "service aggregate dry-run leaked ImportJob");

  const leakedRows = await prisma.importStagingRow.findMany({
    where: {
      dedupeHash: {
        in: aggregateResult.preview.rows.map((row) => row.dedupeHash),
      },
    },
    select: { id: true },
    take: 10,
  });
  assert(leakedRows.length === 0, `service aggregate dry-run leaked ImportStagingRow count=${leakedRows.length}`);

  const leakedTxCount = await prisma.transaction.count({
    where: {
      companyId: company.id,
      sourceFileName: filename,
    },
  });
  assert(leakedTxCount === 0, "service aggregate dry-run leaked Transaction");

  const leakedMovementCount = await prisma.inventoryMovement.count({
    where: {
      companyId: company.id,
      sourceId: aggregate.inventoryCompensationPlan.operations[0]?.operationId || "missing-operation",
    },
  });
  assert(leakedMovementCount === 0, "service aggregate dry-run leaked InventoryMovement");

  const schema = read(schemaFile);
  assert(!schema.includes("PlanningAggregate"), "Step119-B must not add aggregate table");
  assert(!schema.includes("ExecutionReadiness"), "Step119-B must not add readiness table");
  assert(!schema.includes("InventoryCompensationPlan"), "Step119-B must not add inventory compensation plan table");
  assert(!schema.includes("TransactionOverwritePlan"), "Step119-B must not add transaction overwrite plan table");
  assert(!schema.includes("AmazonSpApiCredential"), "Step119-B must not add credential table");
  assert(!schema.includes("AmazonSpApiToken"), "Step119-B must not add token table");

  const serviceSource = read(importsServiceTs);
  assert(serviceSource.includes("planAmazonSpApiSandboxImportAggregate"), "service method missing");
  assert(serviceSource.includes("STEP119_B_SP_API_SANDBOX_AGGREGATE_NON_DRY_RUN_BLOCKED"), "aggregate non-dry-run block missing");
  assert(serviceSource.includes("STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED"), "staging non-dry-run block missing");

  const controllerSource = read(importsControllerTs);
  assert(!controllerSource.includes("planAmazonSpApiSandboxImportAggregate"), "controller must not expose aggregate method");
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

  console.log("[SMOKE_OK] amazon sp-api sandbox service aggregate dry-run smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        aggregateSummary: aggregate.summary,
        rejected: [nonDryRunReject, stagingNonDryRunReject],
        leakCheck: {
          importJobLeaked: Boolean(leakedJob),
          stagingRowsLeaked: leakedRows.length,
          transactionLeaked: leakedTxCount,
          inventoryMovementLeaked: leakedMovementCount,
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
