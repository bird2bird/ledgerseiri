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

const prisma = new PrismaClient();

class Step120BRollbackSignal extends Error {
  constructor(message) {
    super(message);
    this.name = "Step120BRollbackSignal";
  }
}

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
      amazonOrderId: `SPAPI-STEP120-B-ORDER-1-${runId}`,
      purchaseDate: "2026-05-07T12:34:56Z",
      marketplaceId: "A1VC38T7YXB528",
      orderStatus: "Shipped",
      fulfillmentChannel: "AFN",
      salesChannel: "Amazon.co.jp",
      orderTotal: { currencyCode: "JPY", amount: "15980" },
      items: [
        {
          orderItemId: `SPAPI-STEP120-B-ITEM-1-${runId}`,
          sellerSku: `spapi-step120-b-sku-001-${runId}`,
          title: `Step120-B Rollback Simulation Product ${runId}`,
          quantityOrdered: "3",
          itemPrice: { currencyCode: "JPY", amount: "15980" },
          itemTax: { currencyCode: "JPY", amount: "1598" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "1380" } },
          ],
          raw: { fixture: "step120-b-item-1" },
        },
      ],
      raw: { fixture: "step120-b-order-1" },
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

      if (
        isSpApiRoute ||
        isAmazonSandboxRoute ||
        isAmazonPersistRoute ||
        isAmazonImportJobRoute ||
        isAmazonRollbackRoute
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

function buildImportJobDataForRollback({ companyId, filename, aggregate }) {
  const plan = aggregate.importJobPlan.plannedImportJob;
  return {
    companyId,
    domain: plan.domain,
    module: plan.module,
    sourceType: plan.sourceType,
    filename,
    status: plan.status,
    totalRows: plan.totalRows,
    successRows: plan.successRows,
    failedRows: plan.failedRows,
    importedAt: plan.importedAt,
    fileMonthsJson: plan.fileMonthsJson,
    // Step120-B Fix2:
    // ImportJob has no dataJson column in the real Prisma schema.
    // Store rollback-only metadata in existing conflictMonthsJson for simulation only.
    conflictMonthsJson: {
      planningAggregateVersion: aggregate.version,
      sourceType: aggregate.sourceType,
      normalizedSourceType: aggregate.normalizedSourceType,
      dryRunOnly: true,
      planOnly: true,
      controllerDisabled: true,
      transactionCommitDisabled: true,
      inventoryCommitDisabled: true,
      step120BRollbackOnly: true,
    },
  };
}

function buildStagingRowDataForRollback({ importJobId, companyId, row, index }) {
  return {
    importJobId,
    companyId,
    module: row.module,
    rowNo: row.rowNo || index + 1,
    businessMonth: row.businessMonth,
    matchStatus: row.matchStatus,
    matchReason: row.matchReason,
    dedupeHash: row.dedupeHash,
    normalizedPayloadJson: {
      ...row.normalizedPayloadJson,
      step120BRollbackOnly: true,
    },
    rawPayloadJson: {
      ...row.rawPayloadJson,
      step120BRollbackOnly: true,
    },
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
  const filename = `step120-b-rollback-simulation-${runId}.json`;
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
        amount: 15900,
        grossAmount: 15900,
        netAmount: 14500,
        feeAmount: 1400,
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
  assert(aggregateResult.ok === true, "aggregate result ok mismatch");
  assert(aggregate.planOnly === true, "aggregate must remain plan-only");
  assert(aggregate.writesDatabase === false, "aggregate must not write DB");
  assert(aggregate.summary.mayPersistImportJob === false, "aggregate mayPersistImportJob must remain false");
  assert(aggregate.summary.mayPersistStagingRows === false, "aggregate mayPersistStagingRows must remain false");

  const designGate = assertAmazonSpApiSandboxPersistedImportJobDesignGate(
    buildAmazonSpApiSandboxPersistedImportJobDesignGate({ aggregate }),
  );

  const simulation = assertAmazonSpApiSandboxPersistedImportJobRollbackSimulation(
    buildAmazonSpApiSandboxPersistedImportJobRollbackSimulation({ designGate }),
  );

  assert(simulation.version === "amazon-sp-api-sandbox-persisted-importjob-rollback-simulation-v1", "simulation version mismatch");
  assert(simulation.mode === "ROLLBACK_ONLY", "simulation mode mismatch");
  assert(simulation.simulationOnly === true, "simulationOnly mismatch");
  assert(simulation.rollbackRequired === true, "rollbackRequired mismatch");
  assert(simulation.rollbackVerifiedRequired === true, "rollbackVerifiedRequired mismatch");
  assert(simulation.currentCommitAllowed === false, "currentCommitAllowed must remain false");
  assert(simulation.writesDatabasePermanently === false, "writesDatabasePermanently must be false");
  assert(simulation.summary.plannedImportJobRows === 1, "planned ImportJob rows mismatch");
  assert(simulation.summary.plannedStagingRows === 1, "planned staging rows mismatch");
  assert(simulation.summary.readyForPermanentPersistence === false, "readyForPermanentPersistence must be false");

  const beforeJob = await prisma.importJob.findFirst({ where: { filename }, select: { id: true } });
  assert(!beforeJob, "rollback simulation precheck found existing ImportJob");

  const previewDedupeHashes = aggregate.previewRows.map((row) => row.dedupeHash);
  const beforeRows = await prisma.importStagingRow.findMany({
    where: {
      dedupeHash: { in: previewDedupeHashes },
    },
    select: { id: true },
    take: 10,
  });
  assert(beforeRows.length === 0, "rollback simulation precheck found existing ImportStagingRow");

  let transactionCreatedJobId = null;
  let transactionCreatedRows = 0;
  let rollbackObserved = false;

  try {
    await prisma.$transaction(async (tx) => {
      const importJobData = buildImportJobDataForRollback({
        companyId: company.id,
        filename,
        aggregate,
      });

      const createdJob = await tx.importJob.create({
        data: importJobData,
        select: { id: true, filename: true },
      });

      transactionCreatedJobId = createdJob.id;

      for (const [index, row] of aggregate.importJobPlan.plannedStagingRows.entries()) {
        await tx.importStagingRow.create({
          data: buildStagingRowDataForRollback({
            importJobId: createdJob.id,
            companyId: company.id,
            row,
            index,
          }),
        });
        transactionCreatedRows += 1;
      }

      const insideJob = await tx.importJob.findFirst({
        where: { id: createdJob.id },
        select: { id: true },
      });
      assert(Boolean(insideJob), "created ImportJob not visible inside rollback transaction");

      const insideRows = await tx.importStagingRow.findMany({
        where: { importJobId: createdJob.id },
        select: { id: true },
      });
      assert(insideRows.length === aggregate.importJobPlan.plannedStagingRows.length, "created staging rows not visible inside rollback transaction");

      throw new Step120BRollbackSignal("STEP120_B_ROLLBACK_ONLY_SIMULATION_FORCED_ROLLBACK");
    });
  } catch (err) {
    if (String((err && err.message) || err).includes("STEP120_B_ROLLBACK_ONLY_SIMULATION_FORCED_ROLLBACK")) {
      rollbackObserved = true;
    } else {
      throw err;
    }
  }

  assert(rollbackObserved === true, "rollback signal was not observed");
  assert(transactionCreatedJobId, "transaction did not create ImportJob before rollback");
  assert(transactionCreatedRows === aggregate.importJobPlan.plannedStagingRows.length, "transaction staging row count mismatch");

  const leakedJob = await prisma.importJob.findFirst({
    where: { filename },
    select: { id: true },
  });
  assert(!leakedJob, "rollback simulation leaked ImportJob after forced rollback");

  const leakedRows = await prisma.importStagingRow.findMany({
    where: {
      dedupeHash: { in: previewDedupeHashes },
    },
    select: { id: true },
    take: 10,
  });
  assert(leakedRows.length === 0, `rollback simulation leaked ImportStagingRow count=${leakedRows.length}`);

  const leakedTxCount = await prisma.transaction.count({
    where: {
      companyId: company.id,
      sourceFileName: filename,
    },
  });
  assert(leakedTxCount === 0, "rollback simulation leaked Transaction");

  const leakedMovementCount = await prisma.inventoryMovement.count({
    where: {
      companyId: company.id,
      sourceId: aggregate.inventoryCompensationPlan.operations[0]?.operationId || "missing-operation",
    },
  });
  assert(leakedMovementCount === 0, "rollback simulation leaked InventoryMovement");

  const aggregateNonDryRunReject = await expectReject(
    "Step120-B aggregate non-dry-run blocked",
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
    "Step120-B staging non-dry-run still blocked",
    () =>
      service.commitAmazonSpApiSandboxOrdersToStaging({
        companyId: company.id,
        filename,
        preview: aggregateResult.preview,
        dryRun: false,
      }),
    "STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED",
  );

  const schema = read(schemaFile);
  assert(schema.includes("model ImportJob"), "schema missing ImportJob");
  assert(schema.includes("model ImportStagingRow"), "schema missing ImportStagingRow");
  assert(schema.includes("model Transaction"), "schema missing Transaction");
  assert(schema.includes("model InventoryMovement"), "schema missing InventoryMovement");
  assert(!schema.includes("PersistedImportJobRollbackSimulation"), "Step120-B must not add rollback simulation table");
  assert(!schema.includes("PersistedImportJobDesignGate"), "Step120-B must not add design gate table");
  assert(!schema.includes("PlanningAggregate"), "Step120-B must not add aggregate table");
  assert(!schema.includes("AmazonSpApiCredential"), "Step120-B must not add credential table");
  assert(!schema.includes("AmazonSpApiToken"), "Step120-B must not add token table");
  assert(!schema.includes("CrossSourceDedupe"), "Step120-B must not add dedupe table");

  const serviceSource = read(importsServiceTs);
  assert(serviceSource.includes("planAmazonSpApiSandboxImportAggregate"), "service aggregate method missing");
  assert(serviceSource.includes("STEP119_B_SP_API_SANDBOX_AGGREGATE_NON_DRY_RUN_BLOCKED"), "aggregate non-dry-run block missing");
  assert(serviceSource.includes("STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED"), "staging non-dry-run block missing");
  assert(!serviceSource.includes("buildAmazonSpApiSandboxPersistedImportJobRollbackSimulation"), "Step120-B must not wire rollback simulation into service yet");

  const controllerSource = read(importsControllerTs);
  assert(!controllerSource.includes("planAmazonSpApiSandboxImportAggregate"), "controller must not expose aggregate method");
  assert(!controllerSource.includes("buildAmazonSpApiSandboxPersistedImportJobRollbackSimulation"), "controller must not import rollback simulation");
  assert(!controllerSource.includes("previewAmazonSpApiSandboxOrders"), "controller must not expose preview method");
  assert(!controllerSource.includes("commitAmazonSpApiSandboxOrdersToStaging"), "controller must not expose commit method");

  const routeScan = scanControllerRoutes(root, srcRoot);
  assert(routeScan.exposedRoutes.length === 0, `controller route leak: ${JSON.stringify(routeScan.exposedRoutes)}`);

  console.log("[SMOKE_OK] amazon sp-api sandbox persisted ImportJob rollback simulation smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        simulation: {
          version: simulation.version,
          mode: simulation.mode,
          simulationOnly: simulation.simulationOnly,
          rollbackRequired: simulation.rollbackRequired,
          currentCommitAllowed: simulation.currentCommitAllowed,
          writesDatabasePermanently: simulation.writesDatabasePermanently,
          summary: simulation.summary,
        },
        transactionCreatedBeforeRollback: {
          importJobId: transactionCreatedJobId,
          stagingRows: transactionCreatedRows,
          rollbackObserved,
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
