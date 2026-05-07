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
const {
  buildAmazonSpApiSandboxPermanentImportJobServiceMethodDesign,
  assertAmazonSpApiSandboxPermanentImportJobServiceMethodDesign,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-permanent-importjob-service-method-design.dto");

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
      amazonOrderId: `SPAPI-STEP121-F-ORDER-1-${runId}`,
      purchaseDate: "2026-05-07T12:34:56Z",
      marketplaceId: "A1VC38T7YXB528",
      orderStatus: "Shipped",
      fulfillmentChannel: "AFN",
      salesChannel: "Amazon.co.jp",
      orderTotal: { currencyCode: "JPY", amount: "25980" },
      items: [
        {
          orderItemId: `SPAPI-STEP121-F-ITEM-1-${runId}`,
          sellerSku: `spapi-step121-f-sku-001-${runId}`,
          title: `Step121-F Persistence Hardening Product ${runId}`,
          quantityOrdered: "3",
          itemPrice: { currencyCode: "JPY", amount: "25980" },
          itemTax: { currencyCode: "JPY", amount: "2598" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "2380" } },
          ],
          raw: { fixture: "step121-f-item-1" },
        },
      ],
      raw: { fixture: "step121-f-order-1" },
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

async function cleanupAll({ companyId, filenames, importJobIds, operationIds, dedupeHashes }) {
  const ids = [...new Set(importJobIds.filter(Boolean))];

  if (ids.length) {
    await prisma.importStagingRow.deleteMany({
      where: { importJobId: { in: ids } },
    });
    await prisma.importJob.deleteMany({
      where: { id: { in: ids } },
    });
  }

  if (filenames.length) {
    const jobs = await prisma.importJob.findMany({
      where: { filename: { in: filenames } },
      select: { id: true },
    });
    const jobIds = jobs.map((item) => item.id);

    if (jobIds.length) {
      await prisma.importStagingRow.deleteMany({
        where: { importJobId: { in: jobIds } },
      });
      await prisma.importJob.deleteMany({
        where: { id: { in: jobIds } },
      });
    }
  }

  if (dedupeHashes.length) {
    await prisma.importStagingRow.deleteMany({
      where: { dedupeHash: { in: dedupeHashes } },
    });
  }

  await prisma.transaction.deleteMany({
    where: {
      companyId,
      sourceFileName: { in: filenames },
    },
  });

  if (operationIds.length) {
    await prisma.inventoryMovement.deleteMany({
      where: {
        companyId,
        sourceId: { in: operationIds },
      },
    });
  }
}

async function assertLeakZero({ companyId, filenames, importJobIds, operationIds, dedupeHashes, label }) {
  const leakedJobsByFilename = await prisma.importJob.findMany({
    where: { filename: { in: filenames } },
    select: { id: true, filename: true },
  });
  assert(leakedJobsByFilename.length === 0, `${label}: leaked ImportJob by filename count=${leakedJobsByFilename.length}`);

  const ids = [...new Set(importJobIds.filter(Boolean))];
  if (ids.length) {
    const leakedJobsById = await prisma.importJob.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    assert(leakedJobsById.length === 0, `${label}: leaked ImportJob by id count=${leakedJobsById.length}`);
  }

  if (dedupeHashes.length) {
    const leakedRowsByDedupe = await prisma.importStagingRow.findMany({
      where: { dedupeHash: { in: dedupeHashes } },
      select: { id: true, dedupeHash: true },
      take: 20,
    });
    assert(leakedRowsByDedupe.length === 0, `${label}: leaked ImportStagingRow by dedupe count=${leakedRowsByDedupe.length}`);
  }

  if (ids.length) {
    const leakedRowsByJob = await prisma.importStagingRow.findMany({
      where: { importJobId: { in: ids } },
      select: { id: true },
      take: 20,
    });
    assert(leakedRowsByJob.length === 0, `${label}: leaked ImportStagingRow by job count=${leakedRowsByJob.length}`);
  }

  const leakedTxCount = await prisma.transaction.count({
    where: {
      companyId,
      sourceFileName: { in: filenames },
    },
  });
  assert(leakedTxCount === 0, `${label}: leaked Transaction count=${leakedTxCount}`);

  const leakedMovementCount = operationIds.length
    ? await prisma.inventoryMovement.count({
        where: {
          companyId,
          sourceId: { in: operationIds },
        },
      })
    : 0;
  assert(leakedMovementCount === 0, `${label}: leaked InventoryMovement count=${leakedMovementCount}`);

  return {
    importJobLeaked: false,
    stagingRowsLeaked: 0,
    transactionLeaked: leakedTxCount,
    inventoryMovementLeaked: leakedMovementCount,
  };
}

async function buildDesignChain({ service, company, filename, orders, serviceSource, controllerSource }) {
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
        amount: 25900,
        grossAmount: 25900,
        netAmount: 23500,
        feeAmount: 2400,
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
  const serviceMethodDesign = assertAmazonSpApiSandboxPermanentImportJobServiceMethodDesign(
    buildAmazonSpApiSandboxPermanentImportJobServiceMethodDesign({ simulation }),
  );

  return { aggregateResult, aggregate, serviceMethodDesign };
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const srcRoot = path.resolve(root, "src");
  const schemaFile = path.resolve(root, "prisma/schema.prisma");
  const importsServiceTs = path.resolve(root, "src/imports/imports.service.ts");
  const importsControllerTs = path.resolve(root, "src/imports/imports.controller.ts");

  const serviceSource = read(importsServiceTs);
  const controllerSource = read(importsControllerTs);

  assert(serviceSource.includes("persistAmazonSpApiSandboxImportJobOnly"), "Step121-E service method missing");
  assert(serviceSource.includes("STEP121_E_IMPORTJOB_PERSISTENCE_ENV_DISABLED"), "env-disabled guard missing");
  assert(serviceSource.includes("STEP121_E_IMPORTJOB_PERSISTENCE_MODE_REQUIRED"), "persistence mode guard missing");
  assert(serviceSource.includes("STEP121_E_DUPLICATE_IMPORTJOB_FILENAME"), "duplicate filename guard missing");
  assert(serviceSource.includes("STEP121_E_DUPLICATE_STAGING_DEDUPE_HASH"), "duplicate staging dedupe guard missing");
  assert(serviceSource.includes("transactionRows: 0"), "transactionRows zero marker missing");
  assert(serviceSource.includes("inventoryMovementRows: 0"), "inventoryMovementRows zero marker missing");
  assert(serviceSource.includes("tokenRows: 0"), "tokenRows zero marker missing");

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
  assert(!schema.includes("PermanentImportJobPersistenceHardening"), "Step121-F must not add hardening table");
  assert(!schema.includes("AmazonSpApiCredential"), "Step121-F must not add credential table");
  assert(!schema.includes("AmazonSpApiToken"), "Step121-F must not add token table");
  assert(!schema.includes("CrossSourceDedupe"), "Step121-F must not add dedupe table");

  const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const company = await resolveCompanyId();
  const service = new ImportsService(prisma);

  const filenameA = `step121-f-hardening-a-${runId}.json`;
  const filenameB = `step121-f-hardening-b-${runId}.json`;
  const filenames = [filenameA, filenameB];
  const orders = buildOrders(runId);
  const importJobIds = [];
  let operationIds = [];
  let dedupeHashes = [];

  try {
    const { aggregateResult, aggregate, serviceMethodDesign } = await buildDesignChain({
      service,
      company,
      filename: filenameA,
      orders,
      serviceSource,
      controllerSource,
    });

    operationIds = aggregate.inventoryCompensationPlan.operations.map((operation) => operation.operationId);
    dedupeHashes = aggregate.previewRows.map((row) => row.dedupeHash).filter(Boolean);

    await cleanupAll({
      companyId: company.id,
      filenames,
      importJobIds,
      operationIds,
      dedupeHashes,
    });

    await assertLeakZero({
      companyId: company.id,
      filenames,
      importJobIds,
      operationIds,
      dedupeHashes,
      label: "precheck cleanup",
    });

    process.env.AMAZON_SP_API_SANDBOX_IMPORTJOB_PERSISTENCE_ENABLED = "false";

    const envDisabledReject = await expectReject(
      "Step121-F env disabled path",
      () =>
        service.persistAmazonSpApiSandboxImportJobOnly({
          companyId: company.id,
          filename: filenameA,
          aggregate,
          serviceMethodDesign,
          persistenceMode: "importjob-and-staging-only",
        }),
      "STEP121_E_IMPORTJOB_PERSISTENCE_ENV_DISABLED",
    );

    process.env.AMAZON_SP_API_SANDBOX_IMPORTJOB_PERSISTENCE_ENABLED = "true";

    const modeReject = await expectReject(
      "Step121-F wrong mode path",
      () =>
        service.persistAmazonSpApiSandboxImportJobOnly({
          companyId: company.id,
          filename: filenameA,
          aggregate,
          serviceMethodDesign,
          persistenceMode: "wrong-mode",
        }),
      "STEP121_E_IMPORTJOB_PERSISTENCE_MODE_REQUIRED",
    );

    const resultA = await service.persistAmazonSpApiSandboxImportJobOnly({
      companyId: company.id,
      filename: filenameA,
      aggregate,
      serviceMethodDesign,
      persistenceMode: "importjob-and-staging-only",
    });

    importJobIds.push(resultA.importJobId);

    assert(resultA.ok === true, "resultA ok mismatch");
    assert(resultA.persistenceMode === "importjob-and-staging-only", "resultA persistence mode mismatch");
    assert(resultA.envGateEnabled === true, "resultA env gate mismatch");
    assert(resultA.writesDatabasePermanently === true, "resultA permanent write mismatch");
    assert(resultA.summary.importJobRows === 1, "resultA importJobRows mismatch");
    assert(resultA.summary.stagingRows === aggregate.importJobPlan.plannedStagingRows.length, "resultA stagingRows mismatch");
    assert(resultA.summary.transactionRows === 0, "resultA transactionRows must be 0");
    assert(resultA.summary.inventoryMovementRows === 0, "resultA inventoryMovementRows must be 0");
    assert(resultA.summary.inventoryBalanceRows === 0, "resultA inventoryBalanceRows must be 0");
    assert(resultA.summary.tokenRows === 0, "resultA tokenRows must be 0");

    const duplicateFilenameReject = await expectReject(
      "Step121-F duplicate filename path",
      () =>
        service.persistAmazonSpApiSandboxImportJobOnly({
          companyId: company.id,
          filename: filenameA,
          aggregate,
          serviceMethodDesign,
          persistenceMode: "importjob-and-staging-only",
        }),
      "STEP121_E_DUPLICATE_IMPORTJOB_FILENAME",
    );

    const duplicateDedupeReject = await expectReject(
      "Step121-F duplicate dedupe path",
      () =>
        service.persistAmazonSpApiSandboxImportJobOnly({
          companyId: company.id,
          filename: filenameB,
          aggregate,
          serviceMethodDesign,
          persistenceMode: "importjob-and-staging-only",
        }),
      "STEP121_E_DUPLICATE_STAGING_DEDUPE_HASH",
    );

    const aggregateNonDryRunReject = await expectReject(
      "Step121-F aggregate non-dry-run blocked",
      () =>
        service.planAmazonSpApiSandboxImportAggregate({
          companyId: company.id,
          filename: filenameA,
          orders,
          dryRun: false,
        }),
      "STEP119_B_SP_API_SANDBOX_AGGREGATE_NON_DRY_RUN_BLOCKED",
    );

    const stagingNonDryRunReject = await expectReject(
      "Step121-F staging non-dry-run still blocked",
      () =>
        service.commitAmazonSpApiSandboxOrdersToStaging({
          companyId: company.id,
          filename: filenameA,
          preview: aggregateResult.preview,
          dryRun: false,
        }),
      "STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED",
    );

    await cleanupAll({
      companyId: company.id,
      filenames,
      importJobIds,
      operationIds,
      dedupeHashes,
    });

    const firstCleanupLeakCheck = await assertLeakZero({
      companyId: company.id,
      filenames,
      importJobIds,
      operationIds,
      dedupeHashes,
      label: "first cleanup",
    });

    await cleanupAll({
      companyId: company.id,
      filenames,
      importJobIds,
      operationIds,
      dedupeHashes,
    });

    const secondCleanupLeakCheck = await assertLeakZero({
      companyId: company.id,
      filenames,
      importJobIds,
      operationIds,
      dedupeHashes,
      label: "second cleanup idempotence",
    });

    process.env.AMAZON_SP_API_SANDBOX_IMPORTJOB_PERSISTENCE_ENABLED = "false";
    assert(process.env.AMAZON_SP_API_SANDBOX_IMPORTJOB_PERSISTENCE_ENABLED === "false", "env gate must reset to false");

    console.log("[SMOKE_OK] amazon sp-api sandbox permanent ImportJob persistence hardening smoke passed");
    console.log(
      JSON.stringify(
        {
          ok: true,
          result: {
            importJobId: resultA.importJobId,
            persistenceMode: resultA.persistenceMode,
            envGateEnabled: resultA.envGateEnabled,
            writesDatabasePermanently: resultA.writesDatabasePermanently,
            summary: resultA.summary,
          },
          rejected: [
            envDisabledReject,
            modeReject,
            duplicateFilenameReject,
            duplicateDedupeReject,
            aggregateNonDryRunReject,
            stagingNonDryRunReject,
          ],
          cleanup: {
            firstCleanupLeakCheck,
            secondCleanupLeakCheck,
            envGateReset: process.env.AMAZON_SP_API_SANDBOX_IMPORTJOB_PERSISTENCE_ENABLED,
          },
          controllerGuard: routeScan,
        },
        null,
        2,
      ),
    );
  } finally {
    process.env.AMAZON_SP_API_SANDBOX_IMPORTJOB_PERSISTENCE_ENABLED = "false";
    await cleanupAll({
      companyId: company.id,
      filenames,
      importJobIds,
      operationIds,
      dedupeHashes,
    }).catch(() => undefined);
  }
}

main()
  .catch((err) => {
    console.error("[SMOKE_ERROR]", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
