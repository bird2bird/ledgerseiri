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
      amazonOrderId: `SPAPI-STEP121-E-ORDER-1-${runId}`,
      purchaseDate: "2026-05-07T12:34:56Z",
      marketplaceId: "A1VC38T7YXB528",
      orderStatus: "Shipped",
      fulfillmentChannel: "AFN",
      salesChannel: "Amazon.co.jp",
      orderTotal: { currencyCode: "JPY", amount: "24980" },
      items: [
        {
          orderItemId: `SPAPI-STEP121-E-ITEM-1-${runId}`,
          sellerSku: `spapi-step121-e-sku-001-${runId}`,
          title: `Step121-E Env Gated Service Product ${runId}`,
          quantityOrdered: "3",
          itemPrice: { currencyCode: "JPY", amount: "24980" },
          itemTax: { currencyCode: "JPY", amount: "2498" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "2280" } },
          ],
          raw: { fixture: "step121-e-item-1" },
        },
      ],
      raw: { fixture: "step121-e-order-1" },
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
        amount: 24900,
        grossAmount: 24900,
        netAmount: 22600,
        feeAmount: 2300,
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

async function cleanup({ filename, importJobId, companyId, operationIds }) {
  if (importJobId) {
    await prisma.importStagingRow.deleteMany({ where: { importJobId } });
    await prisma.importJob.deleteMany({ where: { id: importJobId } });
  }

  await prisma.importStagingRow.deleteMany({
    where: {
      normalizedPayloadJson: {
        path: ["step121EPermanentImportJobServiceMethod"],
        equals: true,
      },
    },
  }).catch(() => undefined);

  await prisma.importJob.deleteMany({ where: { filename } });

  await prisma.transaction.deleteMany({
    where: {
      companyId,
      sourceFileName: filename,
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
  assert(!schema.includes("PermanentImportJobServiceMethodEnvGated"), "Step121-E must not add service env table");
  assert(!schema.includes("AmazonSpApiCredential"), "Step121-E must not add credential table");
  assert(!schema.includes("AmazonSpApiToken"), "Step121-E must not add token table");

  const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const company = await resolveCompanyId();
  const service = new ImportsService(prisma);
  const filename = `step121-e-env-gated-service-${runId}.json`;
  const orders = buildOrders(runId);

  let createdImportJobId = null;
  let operationIds = [];

  try {
    const { aggregateResult, aggregate, serviceMethodDesign } = await buildDesignChain({
      service,
      company,
      filename,
      orders,
      serviceSource,
      controllerSource,
    });

    operationIds = aggregate.inventoryCompensationPlan.operations.map((operation) => operation.operationId);

    process.env.AMAZON_SP_API_SANDBOX_IMPORTJOB_PERSISTENCE_ENABLED = "false";
    const envDisabledReject = await expectReject(
      "Step121-E env gate disabled",
      () =>
        service.persistAmazonSpApiSandboxImportJobOnly({
          companyId: company.id,
          filename,
          aggregate,
          serviceMethodDesign,
          persistenceMode: "importjob-and-staging-only",
        }),
      "STEP121_E_IMPORTJOB_PERSISTENCE_ENV_DISABLED",
    );

    process.env.AMAZON_SP_API_SANDBOX_IMPORTJOB_PERSISTENCE_ENABLED = "true";

    const modeReject = await expectReject(
      "Step121-E wrong persistence mode",
      () =>
        service.persistAmazonSpApiSandboxImportJobOnly({
          companyId: company.id,
          filename,
          aggregate,
          serviceMethodDesign,
          persistenceMode: "wrong-mode",
        }),
      "STEP121_E_IMPORTJOB_PERSISTENCE_MODE_REQUIRED",
    );

    const result = await service.persistAmazonSpApiSandboxImportJobOnly({
      companyId: company.id,
      filename,
      aggregate,
      serviceMethodDesign,
      persistenceMode: "importjob-and-staging-only",
    });

    createdImportJobId = result.importJobId;

    assert(result.ok === true, "result ok mismatch");
    assert(result.persistenceMode === "importjob-and-staging-only", "persistence mode mismatch");
    assert(result.envGateEnabled === true, "env gate enabled mismatch");
    assert(result.writesDatabasePermanently === true, "permanent write result mismatch");
    assert(result.controllerDisabled === true, "controller disabled mismatch");
    assert(result.frontendDisabled === true, "frontend disabled mismatch");
    assert(result.summary.importJobRows === 1, "importJobRows mismatch");
    assert(result.summary.stagingRows === aggregate.importJobPlan.plannedStagingRows.length, "stagingRows mismatch");
    assert(result.summary.transactionRows === 0, "transactionRows must be 0");
    assert(result.summary.inventoryMovementRows === 0, "inventoryMovementRows must be 0");
    assert(result.summary.inventoryBalanceRows === 0, "inventoryBalanceRows must be 0");
    assert(result.summary.tokenRows === 0, "tokenRows must be 0");

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
    assert(committedJob, "committed ImportJob not found");
    assert(committedJob.filename === filename, "committed filename mismatch");
    assert(committedJob.status === "PENDING", "committed status mismatch");
    assert(committedJob.successRows === 0, "committed successRows must be 0");
    assert(committedJob.failedRows === 0, "committed failedRows must be 0");

    const committedRows = await prisma.importStagingRow.findMany({
      where: { importJobId: createdImportJobId },
      select: {
        id: true,
        importJobId: true,
        rowNo: true,
        targetEntityId: true,
        normalizedPayloadJson: true,
      },
      orderBy: { rowNo: "asc" },
    });
    assert(committedRows.length === result.rows.length, "committed staging row count mismatch");
    for (const row of committedRows) {
      assert(row.targetEntityId === null, "targetEntityId must remain null");
    }

    const duplicateFilenameReject = await expectReject(
      "Step121-E duplicate filename",
      () =>
        service.persistAmazonSpApiSandboxImportJobOnly({
          companyId: company.id,
          filename,
          aggregate,
          serviceMethodDesign,
          persistenceMode: "importjob-and-staging-only",
        }),
      "STEP121_E_DUPLICATE_IMPORTJOB_FILENAME",
    );

    const aggregateNonDryRunReject = await expectReject(
      "Step121-E aggregate non-dry-run blocked",
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
      "Step121-E staging non-dry-run still blocked",
      () =>
        service.commitAmazonSpApiSandboxOrdersToStaging({
          companyId: company.id,
          filename,
          preview: aggregateResult.preview,
          dryRun: false,
        }),
      "STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED",
    );

    await cleanup({ filename, importJobId: createdImportJobId, companyId: company.id, operationIds });

    const leakedJob = await prisma.importJob.findFirst({
      where: { filename },
      select: { id: true },
    });
    assert(!leakedJob, "env-gated permanent service leaked ImportJob after cleanup");

    const leakedRows = await prisma.importStagingRow.findMany({
      where: { importJobId: createdImportJobId },
      select: { id: true },
      take: 10,
    });
    assert(leakedRows.length === 0, `env-gated permanent service leaked ImportStagingRow count=${leakedRows.length}`);

    const leakedTxCount = await prisma.transaction.count({
      where: {
        companyId: company.id,
        sourceFileName: filename,
      },
    });
    assert(leakedTxCount === 0, "env-gated permanent service leaked Transaction");

    const leakedMovementCount = await prisma.inventoryMovement.count({
      where: {
        companyId: company.id,
        sourceId: {
          in: operationIds,
        },
      },
    });
    assert(leakedMovementCount === 0, "env-gated permanent service leaked InventoryMovement");

    console.log("[SMOKE_OK] amazon sp-api sandbox permanent ImportJob env-gated service smoke passed");
    console.log(
      JSON.stringify(
        {
          ok: true,
          result: {
            persistenceMode: result.persistenceMode,
            envGateEnabled: result.envGateEnabled,
            writesDatabasePermanently: result.writesDatabasePermanently,
            summary: result.summary,
          },
          rejected: [
            envDisabledReject,
            modeReject,
            duplicateFilenameReject,
            aggregateNonDryRunReject,
            stagingNonDryRunReject,
          ],
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
  } finally {
    process.env.AMAZON_SP_API_SANDBOX_IMPORTJOB_PERSISTENCE_ENABLED = "false";
    await cleanup({
      filename,
      importJobId: createdImportJobId,
      companyId: company.id,
      operationIds,
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
