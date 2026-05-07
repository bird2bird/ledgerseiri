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
  buildAmazonSpApiSandboxPersistedImportJobDesignGate,
  assertAmazonSpApiSandboxPersistedImportJobDesignGate,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-persisted-importjob-design-gate.dto");
const {
  buildAmazonSpApiSandboxPersistedImportJobRollbackSimulation,
  assertAmazonSpApiSandboxPersistedImportJobRollbackSimulation,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-persisted-importjob-rollback-simulation.dto");
const {
  buildAmazonSpApiSandboxPersistedImportJobExecutionGateUpgrade,
  assertAmazonSpApiSandboxPersistedImportJobExecutionGateUpgrade,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-persisted-importjob-execution-gate-upgrade.dto");

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
      amazonOrderId: `SPAPI-STEP120-E-ORDER-1-${runId}`,
      purchaseDate: "2026-05-07T12:34:56Z",
      marketplaceId: "A1VC38T7YXB528",
      orderStatus: "Shipped",
      fulfillmentChannel: "AFN",
      salesChannel: "Amazon.co.jp",
      orderTotal: { currencyCode: "JPY", amount: "18980" },
      items: [
        {
          orderItemId: `SPAPI-STEP120-E-ITEM-1-${runId}`,
          sellerSku: `spapi-step120-e-sku-001-${runId}`,
          title: `Step120-E Rollback Only Service Method Product ${runId}`,
          quantityOrdered: "3",
          itemPrice: { currencyCode: "JPY", amount: "18980" },
          itemTax: { currencyCode: "JPY", amount: "1898" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "1680" } },
          ],
          raw: { fixture: "step120-e-item-1" },
        },
      ],
      raw: { fixture: "step120-e-order-1" },
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
      const isAmazonPersistRoute = route.includes("amazon") && route.includes("persist");
      const isAmazonImportJobRoute = route.includes("amazon") && route.includes("importjob");
      const isAmazonRollbackRoute = route.includes("amazon") && route.includes("rollback");
      const isAmazonServiceRoute = route.includes("amazon") && route.includes("service");

      if (
        isSpApiRoute ||
        isAmazonSandboxRoute ||
        isAmazonPersistRoute ||
        isAmazonImportJobRoute ||
        isAmazonRollbackRoute ||
        isAmazonServiceRoute
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

  const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const company = await resolveCompanyId();
  const service = new ImportsService(prisma);
  const filename = `step120-e-rollback-only-service-method-${runId}.json`;
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
        amount: 18900,
        grossAmount: 18900,
        netAmount: 17200,
        feeAmount: 1700,
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

  const aggregate = aggregateResult.aggregate;
  const designGate = assertAmazonSpApiSandboxPersistedImportJobDesignGate(
    buildAmazonSpApiSandboxPersistedImportJobDesignGate({ aggregate }),
  );
  const rollbackSimulation = assertAmazonSpApiSandboxPersistedImportJobRollbackSimulation(
    buildAmazonSpApiSandboxPersistedImportJobRollbackSimulation({ designGate }),
  );
  const executionGate = assertAmazonSpApiSandboxPersistedImportJobExecutionGateUpgrade(
    buildAmazonSpApiSandboxPersistedImportJobExecutionGateUpgrade({ rollbackSimulation }),
  );

  const result = await service.rollbackOnlyPersistAmazonSpApiSandboxImportJob({
    companyId: company.id,
    filename,
    aggregate,
    executionGate,
    rollbackOnly: true,
    forceRollback: true,
  });

  assert(result.ok === true, "rollback-only result ok mismatch");
  assert(result.rollbackOnly === true, "rollbackOnly mismatch");
  assert(result.forceRollback === true, "forceRollback mismatch");
  assert(result.rollbackVerified === true, "rollbackVerified mismatch");
  assert(result.writesDatabasePermanently === false, "writesDatabasePermanently must be false");
  assert(result.companyId === company.id, "companyId mismatch");
  assert(result.filename === filename, "filename mismatch");
  assert(result.importJobId, "importJobId should be captured from rolled-back transaction");
  assert(result.summary.importJobRows === 1, "importJobRows mismatch");
  assert(result.summary.stagingRows === aggregate.importJobPlan.plannedStagingRows.length, "stagingRows mismatch");
  assert(result.summary.transactionRows === 0, "transactionRows must be 0");
  assert(result.summary.inventoryMovementRows === 0, "inventoryMovementRows must be 0");
  assert(result.rows.length === aggregate.importJobPlan.plannedStagingRows.length, "rows length mismatch");

  await expectReject(
    "Step120-E rollbackOnly=false blocked",
    () =>
      service.rollbackOnlyPersistAmazonSpApiSandboxImportJob({
        companyId: company.id,
        filename,
        aggregate,
        executionGate,
        rollbackOnly: false,
        forceRollback: true,
      }),
    "STEP120_E_ROLLBACK_ONLY_REQUIRED",
  );

  await expectReject(
    "Step120-E forceRollback=false blocked",
    () =>
      service.rollbackOnlyPersistAmazonSpApiSandboxImportJob({
        companyId: company.id,
        filename,
        aggregate,
        executionGate,
        rollbackOnly: true,
        forceRollback: false,
      }),
    "STEP120_E_FORCE_ROLLBACK_REQUIRED",
  );

  const aggregateNonDryRunReject = await expectReject(
    "Step120-E aggregate non-dry-run blocked",
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
    "Step120-E staging non-dry-run still blocked",
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
  assert(!leakedJob, "rollback-only service method leaked ImportJob");

  const leakedRows = await prisma.importStagingRow.findMany({
    where: {
      dedupeHash: {
        in: aggregate.previewRows.map((row) => row.dedupeHash),
      },
    },
    select: { id: true },
    take: 10,
  });
  assert(leakedRows.length === 0, `rollback-only service method leaked ImportStagingRow count=${leakedRows.length}`);

  const leakedTxCount = await prisma.transaction.count({
    where: {
      companyId: company.id,
      sourceFileName: filename,
    },
  });
  assert(leakedTxCount === 0, "rollback-only service method leaked Transaction");

  const leakedMovementCount = await prisma.inventoryMovement.count({
    where: {
      companyId: company.id,
      sourceId: {
        in: aggregate.inventoryCompensationPlan.operations.map((operation) => operation.operationId),
      },
    },
  });
  assert(leakedMovementCount === 0, "rollback-only service method leaked InventoryMovement");

  const schema = read(schemaFile);
  assert(schema.includes("model ImportJob"), "schema missing ImportJob");
  assert(schema.includes("model ImportStagingRow"), "schema missing ImportStagingRow");
  assert(schema.includes("model Transaction"), "schema missing Transaction");
  assert(schema.includes("model InventoryMovement"), "schema missing InventoryMovement");
  assert(!schema.includes("RollbackOnlyServiceMethodImplementation"), "Step120-E must not add service implementation table");
  assert(!schema.includes("AmazonSpApiCredential"), "Step120-E must not add credential table");
  assert(!schema.includes("AmazonSpApiToken"), "Step120-E must not add token table");
  assert(!schema.includes("CrossSourceDedupe"), "Step120-E must not add dedupe table");

  const serviceSource = read(importsServiceTs);
  assert(serviceSource.includes("rollbackOnlyPersistAmazonSpApiSandboxImportJob"), "rollback-only service method missing");
  assert(serviceSource.includes("STEP120_E_ROLLBACK_ONLY_REQUIRED"), "rollbackOnly required guard missing");
  assert(serviceSource.includes("STEP120_E_FORCE_ROLLBACK_REQUIRED"), "forceRollback required guard missing");
  assert(serviceSource.includes("STEP120_E_ROLLBACK_ONLY_SERVICE_METHOD_FORCED_ROLLBACK"), "forced rollback marker missing");
  assert(serviceSource.includes("writesDatabasePermanently: false"), "permanent write false marker missing");

  const controllerSource = read(importsControllerTs);
  assert(!controllerSource.includes("rollbackOnlyPersistAmazonSpApiSandboxImportJob"), "controller must not expose rollback-only service method");
  assert(!controllerSource.includes("planAmazonSpApiSandboxImportAggregate"), "controller must not expose aggregate method");
  assert(!controllerSource.includes("previewAmazonSpApiSandboxOrders"), "controller must not expose preview method");
  assert(!controllerSource.includes("commitAmazonSpApiSandboxOrdersToStaging"), "controller must not expose commit method");

  const routeScan = scanControllerRoutes(root, srcRoot);
  assert(routeScan.exposedRoutes.length === 0, `controller route leak: ${JSON.stringify(routeScan.exposedRoutes)}`);

  console.log("[SMOKE_OK] amazon sp-api sandbox rollback-only service method implementation smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        result: {
          rollbackOnly: result.rollbackOnly,
          forceRollback: result.forceRollback,
          rollbackVerified: result.rollbackVerified,
          writesDatabasePermanently: result.writesDatabasePermanently,
          summary: result.summary,
        },
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
