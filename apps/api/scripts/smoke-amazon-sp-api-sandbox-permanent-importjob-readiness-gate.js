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
      amazonOrderId: `SPAPI-STEP121-A-ORDER-1-${runId}`,
      purchaseDate: "2026-05-07T12:34:56Z",
      marketplaceId: "A1VC38T7YXB528",
      orderStatus: "Shipped",
      fulfillmentChannel: "AFN",
      salesChannel: "Amazon.co.jp",
      orderTotal: { currencyCode: "JPY", amount: "20980" },
      items: [
        {
          orderItemId: `SPAPI-STEP121-A-ITEM-1-${runId}`,
          sellerSku: `spapi-step121-a-sku-001-${runId}`,
          title: `Step121-A Permanent ImportJob Readiness Product ${runId}`,
          quantityOrdered: "3",
          itemPrice: { currencyCode: "JPY", amount: "20980" },
          itemTax: { currencyCode: "JPY", amount: "2098" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "1880" } },
          ],
          raw: { fixture: "step121-a-item-1" },
        },
      ],
      raw: { fixture: "step121-a-order-1" },
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
      const isAmazonPermanentRoute = route.includes("amazon") && route.includes("permanent");
      const isAmazonPersistRoute = route.includes("amazon") && route.includes("persist");
      const isAmazonImportJobRoute = route.includes("amazon") && route.includes("importjob");
      const isAmazonRollbackRoute = route.includes("amazon") && route.includes("rollback");
      const isAmazonServiceRoute = route.includes("amazon") && route.includes("service");

      if (
        isSpApiRoute ||
        isAmazonSandboxRoute ||
        isAmazonPermanentRoute ||
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

  const serviceSource = read(importsServiceTs);
  const controllerSource = read(importsControllerTs);

  assert(serviceSource.includes("rollbackOnlyPersistAmazonSpApiSandboxImportJob"), "rollback-only service method missing");
  assert(serviceSource.includes("STEP120_E_ROLLBACK_ONLY_REQUIRED"), "rollbackOnly required guard missing");
  assert(serviceSource.includes("STEP120_E_FORCE_ROLLBACK_REQUIRED"), "forceRollback required guard missing");
  assert(serviceSource.includes("STEP120_E_ROLLBACK_ONLY_SERVICE_METHOD_FORCED_ROLLBACK"), "forced rollback marker missing");
  assert(serviceSource.includes("writesDatabasePermanently: false"), "permanent write false marker missing");
  assert(serviceSource.includes("STEP119_B_SP_API_SANDBOX_AGGREGATE_NON_DRY_RUN_BLOCKED"), "aggregate non-dry-run guard missing");
  assert(serviceSource.includes("STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED"), "staging non-dry-run guard missing");

  assert(!controllerSource.includes("rollbackOnlyPersistAmazonSpApiSandboxImportJob"), "controller must not expose rollback-only service method");
  assert(!controllerSource.includes("planAmazonSpApiSandboxImportAggregate"), "controller must not expose aggregate method");
  assert(!controllerSource.includes("previewAmazonSpApiSandboxOrders"), "controller must not expose preview method");
  assert(!controllerSource.includes("commitAmazonSpApiSandboxOrdersToStaging"), "controller must not expose commit method");

  const routeScan = scanControllerRoutes(root, srcRoot);
  assert(routeScan.exposedRoutes.length === 0, `controller route leak: ${JSON.stringify(routeScan.exposedRoutes)}`);

  const schema = read(schemaFile);
  assert(schema.includes("model ImportJob"), "schema missing ImportJob");
  assert(schema.includes("model ImportStagingRow"), "schema missing ImportStagingRow");
  assert(schema.includes("model Transaction"), "schema missing Transaction");
  assert(schema.includes("model InventoryMovement"), "schema missing InventoryMovement");
  assert(!schema.includes("PermanentImportJobReadinessGate"), "Step121-A must not add readiness gate table");
  assert(!schema.includes("AmazonSpApiCredential"), "Step121-A must not add credential table");
  assert(!schema.includes("AmazonSpApiToken"), "Step121-A must not add token table");
  assert(!schema.includes("CrossSourceDedupe"), "Step121-A must not add dedupe table");

  const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const company = await resolveCompanyId();
  const service = new ImportsService(prisma);
  const filename = `step121-a-permanent-importjob-readiness-${runId}.json`;
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
        amount: 20900,
        grossAmount: 20900,
        netAmount: 19000,
        feeAmount: 1900,
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

  const rollbackResult = await service.rollbackOnlyPersistAmazonSpApiSandboxImportJob({
    companyId: company.id,
    filename,
    aggregate,
    executionGate,
    rollbackOnly: true,
    forceRollback: true,
  });

  assert(rollbackResult.ok === true, "rollback result ok mismatch");
  assert(rollbackResult.rollbackVerified === true, "rollback verification mismatch");
  assert(rollbackResult.writesDatabasePermanently === false, "rollback result permanent write must be false");

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

  assert(readinessGate.version === "amazon-sp-api-sandbox-permanent-importjob-readiness-gate-v1", "readiness version mismatch");
  assert(readinessGate.decision === "READY_FOR_PERMANENT_IMPORTJOB_DESIGN_REVIEW_ONLY", "readiness decision mismatch");
  assert(readinessGate.readinessOnly === true, "readinessOnly mismatch");
  assert(readinessGate.currentExecutionAllowed === false, "current execution must remain false");
  assert(readinessGate.dryRunFalseAllowed === false, "dryRun false must remain false");
  assert(readinessGate.writesDatabase === false, "writesDatabase must remain false");
  assert(readinessGate.readyForPermanentPersistenceReview === true, "permanent persistence review readiness mismatch");
  assert(readinessGate.readyForPermanentExecution === false, "permanent execution must remain false");
  assert(readinessGate.summary.rollbackOnlyCoverageConfirmed === true, "rollback-only coverage should be confirmed");
  assert(readinessGate.summary.readyForPermanentImportJobPersistenceDesign === true, "design readiness mismatch");
  assert(readinessGate.summary.readyForPermanentImportJobPersistenceExecution === false, "execution readiness must be false");
  assert(readinessGate.summary.readyForController === false, "controller readiness must be false");
  assert(readinessGate.summary.readyForFrontend === false, "frontend readiness must be false");
  assert(readinessGate.summary.blockingChecks === 0, "readiness gate should have no blocking checks for design review");

  assert(readinessGate.requiredFutureEnvGate.name === "AMAZON_SP_API_SANDBOX_IMPORTJOB_PERSISTENCE_ENABLED", "future env gate name mismatch");
  assert(readinessGate.requiredFutureEnvGate.currentDefault === "false", "future env gate current default mismatch");
  assert(readinessGate.requiredFutureEnvGate.requiredBeforeAnyPermanentWrite === true, "future env gate must be required before writes");

  assert(readinessGate.allowedFuturePermanentWriteScope.importJobCreate === true, "future ImportJob create design should be allowed");
  assert(readinessGate.allowedFuturePermanentWriteScope.importStagingRowCreate === true, "future staging row create design should be allowed");
  assert(readinessGate.allowedFuturePermanentWriteScope.transactionCreate === false, "future transaction create must be false");
  assert(readinessGate.allowedFuturePermanentWriteScope.inventoryMovementCreate === false, "future inventory movement create must be false");
  assert(readinessGate.allowedFuturePermanentWriteScope.tokenCreate === false, "future token create must be false");
  assert(readinessGate.allowedFuturePermanentWriteScope.credentialCreate === false, "future credential create must be false");

  for (const [key, blocked] of Object.entries(readinessGate.blockedNow)) {
    assert(blocked === true, `readinessGate.blockedNow.${key} must remain true`);
  }

  const aggregateNonDryRunReject = await expectReject(
    "Step121-A aggregate non-dry-run blocked",
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
    "Step121-A staging non-dry-run still blocked",
    () =>
      service.commitAmazonSpApiSandboxOrdersToStaging({
        companyId: company.id,
        filename,
        preview: aggregateResult.preview,
        dryRun: false,
      }),
    "STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED",
  );

  const rollbackOnlyReject = await expectReject(
    "Step121-A rollbackOnly=false blocked",
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

  const forceRollbackReject = await expectReject(
    "Step121-A forceRollback=false blocked",
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

  const leakedJob = await prisma.importJob.findFirst({
    where: { filename },
    select: { id: true },
  });
  assert(!leakedJob, "permanent ImportJob readiness gate leaked ImportJob");

  const leakedRows = await prisma.importStagingRow.findMany({
    where: {
      dedupeHash: {
        in: aggregate.previewRows.map((row) => row.dedupeHash),
      },
    },
    select: { id: true },
    take: 10,
  });
  assert(leakedRows.length === 0, `permanent ImportJob readiness gate leaked ImportStagingRow count=${leakedRows.length}`);

  const leakedTxCount = await prisma.transaction.count({
    where: {
      companyId: company.id,
      sourceFileName: filename,
    },
  });
  assert(leakedTxCount === 0, "permanent ImportJob readiness gate leaked Transaction");

  const leakedMovementCount = await prisma.inventoryMovement.count({
    where: {
      companyId: company.id,
      sourceId: {
        in: aggregate.inventoryCompensationPlan.operations.map((operation) => operation.operationId),
      },
    },
  });
  assert(leakedMovementCount === 0, "permanent ImportJob readiness gate leaked InventoryMovement");

  console.log("[SMOKE_OK] amazon sp-api sandbox permanent ImportJob readiness gate smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        readinessGate: {
          version: readinessGate.version,
          decision: readinessGate.decision,
          readinessOnly: readinessGate.readinessOnly,
          readyForPermanentPersistenceReview: readinessGate.readyForPermanentPersistenceReview,
          readyForPermanentExecution: readinessGate.readyForPermanentExecution,
          requiredFutureEnvGate: readinessGate.requiredFutureEnvGate,
          allowedFuturePermanentWriteScope: readinessGate.allowedFuturePermanentWriteScope,
          summary: readinessGate.summary,
        },
        rejected: [
          aggregateNonDryRunReject,
          stagingNonDryRunReject,
          rollbackOnlyReject,
          forceRollbackReject,
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
}

main()
  .catch((err) => {
    console.error("[SMOKE_ERROR]", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
