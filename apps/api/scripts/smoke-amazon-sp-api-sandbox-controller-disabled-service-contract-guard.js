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
      amazonOrderId: `SPAPI-STEP119-C-ORDER-1-${runId}`,
      purchaseDate: "2026-05-07T12:34:56Z",
      marketplaceId: "A1VC38T7YXB528",
      orderStatus: "Shipped",
      fulfillmentChannel: "AFN",
      salesChannel: "Amazon.co.jp",
      orderTotal: { currencyCode: "JPY", amount: "13980" },
      items: [
        {
          orderItemId: `SPAPI-STEP119-C-ITEM-1-${runId}`,
          sellerSku: `spapi-step119-c-sku-001-${runId}`,
          title: `Step119-C Controller Disabled Guard Product ${runId}`,
          quantityOrdered: "3",
          itemPrice: { currencyCode: "JPY", amount: "13980" },
          itemTax: { currencyCode: "JPY", amount: "1398" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "1180" } },
          ],
          raw: { fixture: "step119-c-item-1" },
        },
      ],
      raw: { fixture: "step119-c-order-1" },
    },
  ];
}

function scanControllerRoutes(root, srcRoot) {
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
      const isAmazonServiceAggregateRoute =
        route.includes("amazon") && route.includes("service") && route.includes("aggregate");

      if (
        isSpApiRoute ||
        isAmazonSandboxRoute ||
        isAmazonPlanningRoute ||
        isAmazonAggregateRoute ||
        isAmazonServiceAggregateRoute
      ) {
        exposedRoutes.push({
          file: path.relative(root, file),
          method: match[1],
          route: match[2],
        });
      }
    }
  }

  return {
    controllerFiles: controllerFiles.map((file) => path.relative(root, file)),
    exposedRoutes,
  };
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const srcRoot = path.resolve(root, "src");
  const schemaFile = path.resolve(root, "prisma/schema.prisma");
  const importsServiceTs = path.resolve(root, "src/imports/imports.service.ts");
  const importsControllerTs = path.resolve(root, "src/imports/imports.controller.ts");

  const serviceSource = read(importsServiceTs);
  assert(
    serviceSource.includes("planAmazonSpApiSandboxImportAggregate"),
    "service aggregate method missing",
  );
  assert(
    serviceSource.includes("STEP119_B_SP_API_SANDBOX_AGGREGATE_NON_DRY_RUN_BLOCKED"),
    "service aggregate non-dry-run block missing",
  );
  assert(
    serviceSource.includes("STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED"),
    "staging non-dry-run block missing",
  );
  assert(
    serviceSource.includes("assertAmazonSpApiSandboxEnvironmentGate({ requireInternalSandbox: true })"),
    "service aggregate must require internal sandbox env gate",
  );
  assert(
    serviceSource.includes("buildAmazonSpApiSandboxPlanningAggregate"),
    "service aggregate must build planning aggregate",
  );

  const controllerSource = read(importsControllerTs);
  assert(
    !controllerSource.includes("planAmazonSpApiSandboxImportAggregate"),
    "controller must not expose planAmazonSpApiSandboxImportAggregate",
  );
  assert(
    !controllerSource.includes("previewAmazonSpApiSandboxOrders"),
    "controller must not expose previewAmazonSpApiSandboxOrders",
  );
  assert(
    !controllerSource.includes("commitAmazonSpApiSandboxOrdersToStaging"),
    "controller must not expose commitAmazonSpApiSandboxOrdersToStaging",
  );
  assert(
    !controllerSource.includes("amazon-sp-api-sandbox-planning-aggregate"),
    "controller must not import planning aggregate",
  );

  const routeScan = scanControllerRoutes(root, srcRoot);
  assert(
    routeScan.exposedRoutes.length === 0,
    `controller route leak: ${JSON.stringify(routeScan.exposedRoutes)}`,
  );

  const schema = read(schemaFile);
  assert(schema.includes("model ImportJob"), "schema missing ImportJob");
  assert(schema.includes("model ImportStagingRow"), "schema missing ImportStagingRow");
  assert(schema.includes("model Transaction"), "schema missing Transaction");
  assert(schema.includes("model InventoryMovement"), "schema missing InventoryMovement");
  assert(!schema.includes("PlanningAggregate"), "Step119-C must not add aggregate table");
  assert(!schema.includes("ExecutionReadiness"), "Step119-C must not add readiness table");
  assert(!schema.includes("InventoryCompensationPlan"), "Step119-C must not add inventory compensation plan table");
  assert(!schema.includes("TransactionOverwritePlan"), "Step119-C must not add transaction overwrite plan table");
  assert(!schema.includes("AmazonSpApiCredential"), "Step119-C must not add credential table");
  assert(!schema.includes("AmazonSpApiToken"), "Step119-C must not add token table");
  assert(!schema.includes("CrossSourceDedupe"), "Step119-C must not add dedupe table");

  const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const company = await resolveCompanyId();
  const service = new ImportsService(prisma);
  const filename = `step119-c-controller-disabled-guard-${runId}.json`;
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
        amount: 13900,
        grossAmount: 13900,
        netAmount: 12700,
        feeAmount: 1200,
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

  assert(aggregateResult.ok === true, "aggregate result ok mismatch");
  assert(aggregateResult.dryRun === true, "aggregate result dryRun mismatch");
  assert(aggregateResult.rollbackVerified === true, "aggregate result rollbackVerified mismatch");
  assert(aggregateResult.planOnly === true, "aggregate result planOnly mismatch");
  assert(aggregateResult.writesDatabase === false, "aggregate result writesDatabase mismatch");

  const aggregate = aggregateResult.aggregate;
  assert(aggregate.planOnly === true, "aggregate planOnly mismatch");
  assert(aggregate.writesDatabase === false, "aggregate writesDatabase must be false");
  assert(aggregate.currentExecutionAllowed === false, "aggregate currentExecutionAllowed must be false");
  assert(aggregate.dryRunFalseAllowed === false, "aggregate dryRunFalseAllowed must be false");
  assert(aggregate.summary.mayContinuePlanOnly === true, "aggregate mayContinuePlanOnly mismatch");
  assert(aggregate.summary.mayPersistImportJob === false, "aggregate mayPersistImportJob must be false");
  assert(aggregate.summary.mayPersistStagingRows === false, "aggregate mayPersistStagingRows must be false");
  assert(aggregate.summary.mayOverwriteTransaction === false, "aggregate mayOverwriteTransaction must be false");
  assert(
    aggregate.summary.mayCreateInventoryCompensation === false,
    "aggregate mayCreateInventoryCompensation must be false",
  );
  assert(aggregate.summary.mayOpenController === false, "aggregate mayOpenController must be false");
  assert(aggregate.summary.mayOpenFrontend === false, "aggregate mayOpenFrontend must be false");
  assert(aggregate.summary.mayCallRealSpApi === false, "aggregate mayCallRealSpApi must be false");
  assert(aggregate.summary.mayPersistToken === false, "aggregate mayPersistToken must be false");

  const aggregateNonDryRunReject = await expectReject(
    "Step119-C aggregate non-dry-run blocked",
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
    "Step119-C staging non-dry-run still blocked",
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
  assert(!leakedJob, "controller-disabled service guard leaked ImportJob");

  const leakedRows = await prisma.importStagingRow.findMany({
    where: {
      dedupeHash: {
        in: aggregateResult.preview.rows.map((row) => row.dedupeHash),
      },
    },
    select: { id: true },
    take: 10,
  });
  assert(
    leakedRows.length === 0,
    `controller-disabled service guard leaked ImportStagingRow count=${leakedRows.length}`,
  );

  const leakedTxCount = await prisma.transaction.count({
    where: {
      companyId: company.id,
      sourceFileName: filename,
    },
  });
  assert(leakedTxCount === 0, "controller-disabled service guard leaked Transaction");

  const leakedMovementCount = await prisma.inventoryMovement.count({
    where: {
      companyId: company.id,
      sourceId:
        aggregate.inventoryCompensationPlan.operations[0]?.operationId ||
        "missing-operation",
    },
  });
  assert(leakedMovementCount === 0, "controller-disabled service guard leaked InventoryMovement");

  console.log("[SMOKE_OK] amazon sp-api sandbox controller-disabled service contract guard smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        aggregateSummary: aggregate.summary,
        rejected: [aggregateNonDryRunReject, stagingNonDryRunReject],
        leakCheck: {
          importJobLeaked: Boolean(leakedJob),
          stagingRowsLeaked: leakedRows.length,
          transactionLeaked: leakedTxCount,
          inventoryMovementLeaked: leakedMovementCount,
        },
        controllerGuard: routeScan,
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
