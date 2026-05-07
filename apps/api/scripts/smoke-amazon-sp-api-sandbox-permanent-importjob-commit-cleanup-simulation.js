#!/usr/bin/env node
"use strict";

process.env.AMAZON_SP_API_SANDBOX_INTERNAL_ENABLED = "true";
process.env.AMAZON_SP_API_REAL_ENABLED = "false";
process.env.AMAZON_SP_API_OAUTH_ENABLED = "false";
process.env.AMAZON_SP_API_TOKEN_PERSISTENCE_ENABLED = "false";
process.env.AMAZON_SP_API_SANDBOX_IMPORTJOB_PERSISTENCE_ENABLED = "false";

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
const {
  buildAmazonSpApiSandboxPermanentImportJobReadinessGate,
  assertAmazonSpApiSandboxPermanentImportJobReadinessGate,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-permanent-importjob-readiness-gate.dto");
const {
  buildAmazonSpApiSandboxPermanentImportJobPersistencePlan,
  assertAmazonSpApiSandboxPermanentImportJobPersistencePlan,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-permanent-importjob-persistence-plan.dto");
const {
  buildAmazonSpApiSandboxPermanentImportJobCommitCleanupSimulation,
  assertAmazonSpApiSandboxPermanentImportJobCommitCleanupSimulation,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-permanent-importjob-commit-cleanup-simulation.dto");

const prisma = new PrismaClient();

function assert(condition, message) {
  if (!condition) throw new Error(message);
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
    if (stat.isDirectory()) listFiles(p, predicate, acc);
    else if (predicate(p)) acc.push(p);
  }
  return acc;
}

async function resolveCompanyId() {
  const company = await prisma.company.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });
  if (!company) throw new Error("No company found for smoke");
  return company;
}

function buildOrders(runId) {
  return [
    {
      amazonOrderId: `SPAPI-STEP121-C-ORDER-1-${runId}`,
      purchaseDate: "2026-05-07T12:34:56Z",
      marketplaceId: "A1VC38T7YXB528",
      orderStatus: "Shipped",
      fulfillmentChannel: "AFN",
      salesChannel: "Amazon.co.jp",
      orderTotal: { currencyCode: "JPY", amount: "22980" },
      items: [
        {
          orderItemId: `SPAPI-STEP121-C-ITEM-1-${runId}`,
          sellerSku: `spapi-step121-c-sku-001-${runId}`,
          title: `Step121-C Commit Cleanup Simulation Product ${runId}`,
          quantityOrdered: "3",
          itemPrice: { currencyCode: "JPY", amount: "22980" },
          itemTax: { currencyCode: "JPY", amount: "2298" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "2080" } },
          ],
          raw: { fixture: "step121-c-item-1" },
        },
      ],
      raw: { fixture: "step121-c-order-1" },
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
      const suspicious =
        route.includes("sp-api") ||
        route.includes("spapi") ||
        (route.includes("amazon") &&
          (route.includes("sandbox") ||
            route.includes("permanent") ||
            route.includes("persist") ||
            route.includes("importjob")));
      if (suspicious) {
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

function buildImportJobCreateData({ companyId, filename, aggregate }) {
  const planned = aggregate.importJobPlan.plannedImportJob;
  return {
    companyId,
    domain: planned.domain,
    module: planned.module,
    sourceType: planned.sourceType,
    filename,
    status: "PENDING",
    totalRows: planned.totalRows,
    successRows: 0,
    failedRows: 0,
    fileMonthsJson: planned.fileMonthsJson,
    conflictMonthsJson: {
      step121CCommitCleanupSimulation: true,
      planningAggregateVersion: aggregate.version,
      sourceType: aggregate.sourceType,
      normalizedSourceType: aggregate.normalizedSourceType,
      permanentServiceImplementation: false,
      controllerDisabled: true,
      transactionCommitDisabled: true,
      inventoryCommitDisabled: true,
    },
    importedAt: null,
  };
}

function buildStagingRowCreateData({ companyId, importJobId, row, index }) {
  return {
    importJobId,
    companyId,
    module: row.module,
    rowNo: row.rowNo || index + 1,
    businessMonth: row.businessMonth,
    matchStatus: row.matchStatus,
    matchReason: row.matchReason || "STEP121_C_COMMIT_CLEANUP_SIMULATION",
    dedupeHash: row.dedupeHash,
    rawPayloadJson: {
      ...row.rawPayloadJson,
      step121CCommitCleanupSimulation: true,
    },
    normalizedPayloadJson: {
      ...row.normalizedPayloadJson,
      importJobId,
      sourceFileName: null,
      step121CCommitCleanupSimulation: true,
    },
  };
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const srcRoot = path.resolve(root, "src");
  const schemaFile = path.resolve(root, "prisma/schema.prisma");
  const importsServiceTs = path.resolve(root, "src/imports/imports.service.ts");
  const importsControllerTs = path.resolve(root, "src/imports/imports.controller.ts");

  const serviceSource = read(importsServiceTs);
  const controllerSource = read(importsControllerTs);

  assert(serviceSource.includes("rollbackOnlyPersistAmazonSpApiSandboxImportJob"), "rollback-only service method missing");
  if (serviceSource.includes("persistAmazonSpApiSandboxImportJobOnly(")) {
    assert(serviceSource.includes("STEP121_E_IMPORTJOB_PERSISTENCE_ENV_DISABLED"), "Step121-E permanent service method must remain env-gated");
    assert(serviceSource.includes("STEP121_E_IMPORTJOB_PERSISTENCE_MODE_REQUIRED"), "Step121-E permanent service method must require importjob-and-staging-only mode");
    assert(serviceSource.includes("STEP121_E_DUPLICATE_IMPORTJOB_FILENAME"), "Step121-E permanent service method must keep duplicate filename guard");
  }
  assert(serviceSource.includes("STEP119_B_SP_API_SANDBOX_AGGREGATE_NON_DRY_RUN_BLOCKED"), "aggregate non-dry-run guard missing");
  assert(serviceSource.includes("STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED"), "staging non-dry-run guard missing");

  assert(!controllerSource.includes("persistAmazonSpApiSandboxImportJobOnly"), "controller must not expose permanent service method");
  assert(!controllerSource.includes("rollbackOnlyPersistAmazonSpApiSandboxImportJob"), "controller must not expose rollback-only service method");
  assert(!controllerSource.includes("planAmazonSpApiSandboxImportAggregate"), "controller must not expose aggregate method");

  const routeScan = scanControllerRoutes(root, srcRoot);
  assert(routeScan.exposedRoutes.length === 0, `controller route leak: ${JSON.stringify(routeScan.exposedRoutes)}`);

  const schema = read(schemaFile);
  assert(schema.includes("model ImportJob"), "schema missing ImportJob");
  assert(schema.includes("model ImportStagingRow"), "schema missing ImportStagingRow");
  assert(schema.includes("model Transaction"), "schema missing Transaction");
  assert(schema.includes("model InventoryMovement"), "schema missing InventoryMovement");
  assert(!schema.includes("PermanentImportJobCommitCleanupSimulation"), "Step121-C must not add simulation table");
  assert(!schema.includes("AmazonSpApiCredential"), "Step121-C must not add credential table");
  assert(!schema.includes("AmazonSpApiToken"), "Step121-C must not add token table");
  assert(!schema.includes("CrossSourceDedupe"), "Step121-C must not add dedupe table");

  const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const company = await resolveCompanyId();
  const service = new ImportsService(prisma);
  const filename = `step121-c-commit-cleanup-${runId}.json`;
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
        amount: 22900,
        grossAmount: 22900,
        netAmount: 20800,
        feeAmount: 2100,
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

  const readinessGate = assertAmazonSpApiSandboxPermanentImportJobReadinessGate(
    buildAmazonSpApiSandboxPermanentImportJobReadinessGate({
      executionGate,
      serviceMethodImplemented: serviceSource.includes("rollbackOnlyPersistAmazonSpApiSandboxImportJob"),
      controllerDisabled: !controllerSource.includes("rollbackOnlyPersistAmazonSpApiSandboxImportJob"),
      rollbackOnlyGuarded: serviceSource.includes("STEP120_E_ROLLBACK_ONLY_REQUIRED"),
      forceRollbackGuarded: serviceSource.includes("STEP120_E_FORCE_ROLLBACK_REQUIRED"),
      permanentWriteFalseGuarded: serviceSource.includes("writesDatabasePermanently: false"),
    }),
  );

  const plan = assertAmazonSpApiSandboxPermanentImportJobPersistencePlan(
    buildAmazonSpApiSandboxPermanentImportJobPersistencePlan({ readinessGate }),
  );

  const simulation = assertAmazonSpApiSandboxPermanentImportJobCommitCleanupSimulation(
    buildAmazonSpApiSandboxPermanentImportJobCommitCleanupSimulation({ plan }),
  );

  assert(simulation.decision === "COMMIT_CLEANUP_SIMULATION_ALLOWED_SERVICE_NOT_IMPLEMENTED", "simulation decision mismatch");
  assert(simulation.simulationOnly === true, "simulationOnly mismatch");
  assert(simulation.commitAllowedInsideSmokeOnly === true, "commit must be smoke-only");
  assert(simulation.cleanupRequired === true, "cleanup required mismatch");
  assert(simulation.cleanupVerifiedRequired === true, "cleanup verification required mismatch");
  assert(simulation.permanentServiceImplementationAllowedNow === false, "permanent service implementation must remain false");
  assert(simulation.permanentExecutionAllowedNow === false, "permanent execution must remain false");
  assert(simulation.writesDatabaseAfterCleanup === false, "writesDatabaseAfterCleanup must remain false");

  let createdImportJobId = null;
  let createdStagingRowIds = [];

  try {
    const preExistingJob = await prisma.importJob.findFirst({
      where: { filename },
      select: { id: true },
    });
    assert(!preExistingJob, "precheck found existing ImportJob");

    await prisma.$transaction(async (tx) => {
      const importJob = await tx.importJob.create({
        data: buildImportJobCreateData({
          companyId: company.id,
          filename,
          aggregate,
        }),
        select: {
          id: true,
          filename: true,
          status: true,
          totalRows: true,
          successRows: true,
          failedRows: true,
        },
      });

      createdImportJobId = importJob.id;

      for (const [index, row] of aggregate.importJobPlan.plannedStagingRows.entries()) {
        const stagingRow = await tx.importStagingRow.create({
          data: buildStagingRowCreateData({
            companyId: company.id,
            importJobId: importJob.id,
            row,
            index,
          }),
          select: {
            id: true,
            importJobId: true,
            rowNo: true,
            dedupeHash: true,
          },
        });
        createdStagingRowIds.push(stagingRow.id);
      }
    });

    assert(createdImportJobId, "ImportJob was not created");
    assert(createdStagingRowIds.length === aggregate.importJobPlan.plannedStagingRows.length, "staging row create count mismatch");

    const committedJob = await prisma.importJob.findFirst({
      where: { id: createdImportJobId },
      select: {
        id: true,
        filename: true,
        status: true,
        totalRows: true,
        successRows: true,
        failedRows: true,
      },
    });
    assert(committedJob, "committed ImportJob not visible after transaction");
    assert(committedJob.status === "PENDING", "committed ImportJob status should be PENDING");
    assert(committedJob.successRows === 0, "committed ImportJob successRows should be 0");
    assert(committedJob.failedRows === 0, "committed ImportJob failedRows should be 0");

    const committedRows = await prisma.importStagingRow.findMany({
      where: { importJobId: createdImportJobId },
      select: {
        id: true,
        importJobId: true,
        rowNo: true,
        matchStatus: true,
        targetEntityId: true,
      },
      orderBy: { rowNo: "asc" },
    });
    assert(committedRows.length === createdStagingRowIds.length, "committed staging row count mismatch");
    for (const row of committedRows) {
      assert(row.targetEntityId === null, "staging row targetEntityId must remain null");
    }
  } finally {
    if (createdImportJobId) {
      await prisma.importStagingRow.deleteMany({
        where: { importJobId: createdImportJobId },
      });
      await prisma.importJob.deleteMany({
        where: { id: createdImportJobId },
      });
    }
  }

  const leakedJob = await prisma.importJob.findFirst({
    where: { filename },
    select: { id: true },
  });
  assert(!leakedJob, "commit cleanup simulation leaked ImportJob");

  const leakedRows = createdStagingRowIds.length
    ? await prisma.importStagingRow.findMany({
        where: { id: { in: createdStagingRowIds } },
        select: { id: true },
      })
    : [];
  assert(leakedRows.length === 0, `commit cleanup simulation leaked ImportStagingRow count=${leakedRows.length}`);

  const leakedTxCount = await prisma.transaction.count({
    where: {
      companyId: company.id,
      sourceFileName: filename,
    },
  });
  assert(leakedTxCount === 0, "commit cleanup simulation leaked Transaction");

  const leakedMovementCount = await prisma.inventoryMovement.count({
    where: {
      companyId: company.id,
      sourceId: {
        in: aggregate.inventoryCompensationPlan.operations.map((operation) => operation.operationId),
      },
    },
  });
  assert(leakedMovementCount === 0, "commit cleanup simulation leaked InventoryMovement");

  const aggregateNonDryRunReject = await expectReject(
    "Step121-C aggregate non-dry-run blocked",
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
    "Step121-C staging non-dry-run still blocked",
    () =>
      service.commitAmazonSpApiSandboxOrdersToStaging({
        companyId: company.id,
        filename,
        preview: aggregateResult.preview,
        dryRun: false,
      }),
    "STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED",
  );

  console.log("[SMOKE_OK] amazon sp-api sandbox permanent ImportJob commit cleanup simulation smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        simulation: {
          version: simulation.version,
          decision: simulation.decision,
          simulationOnly: simulation.simulationOnly,
          commitAllowedInsideSmokeOnly: simulation.commitAllowedInsideSmokeOnly,
          cleanupRequired: simulation.cleanupRequired,
          cleanupVerifiedRequired: simulation.cleanupVerifiedRequired,
          writesDatabaseAfterCleanup: simulation.writesDatabaseAfterCleanup,
          summary: simulation.summary,
        },
        committedThenCleaned: {
          importJobId: createdImportJobId,
          stagingRows: createdStagingRowIds.length,
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
