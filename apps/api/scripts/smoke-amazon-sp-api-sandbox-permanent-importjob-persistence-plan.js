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
      amazonOrderId: `SPAPI-STEP121-B-ORDER-1-${runId}`,
      purchaseDate: "2026-05-07T12:34:56Z",
      marketplaceId: "A1VC38T7YXB528",
      orderStatus: "Shipped",
      fulfillmentChannel: "AFN",
      salesChannel: "Amazon.co.jp",
      orderTotal: { currencyCode: "JPY", amount: "21980" },
      items: [
        {
          orderItemId: `SPAPI-STEP121-B-ITEM-1-${runId}`,
          sellerSku: `spapi-step121-b-sku-001-${runId}`,
          title: `Step121-B Permanent Persistence Plan Product ${runId}`,
          quantityOrdered: "3",
          itemPrice: { currencyCode: "JPY", amount: "21980" },
          itemTax: { currencyCode: "JPY", amount: "2198" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "1980" } },
          ],
          raw: { fixture: "step121-b-item-1" },
        },
      ],
      raw: { fixture: "step121-b-order-1" },
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

  assert(!controllerSource.includes("rollbackOnlyPersistAmazonSpApiSandboxImportJob"), "controller must not expose rollback-only service method");
  assert(!controllerSource.includes("persistAmazonSpApiSandboxImportJobOnly"), "controller must not expose permanent service method");
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
  assert(!schema.includes("PermanentImportJobPersistencePlan"), "Step121-B must not add plan table");
  assert(!schema.includes("AmazonSpApiCredential"), "Step121-B must not add credential table");
  assert(!schema.includes("AmazonSpApiToken"), "Step121-B must not add token table");
  assert(!schema.includes("CrossSourceDedupe"), "Step121-B must not add dedupe table");

  const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const company = await resolveCompanyId();
  const service = new ImportsService(prisma);
  const filename = `step121-b-permanent-importjob-plan-${runId}.json`;
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
        amount: 21900,
        grossAmount: 21900,
        netAmount: 19900,
        feeAmount: 2000,
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

  assert(plan.version === "amazon-sp-api-sandbox-permanent-importjob-persistence-plan-v1", "plan version mismatch");
  assert(plan.decision === "PLAN_READY_IMPLEMENTATION_NOT_ALLOWED", "plan decision mismatch");
  assert(plan.planOnly === true, "planOnly mismatch");
  assert(plan.implementationAllowedNow === false, "implementation must not be allowed now");
  assert(plan.executionAllowedNow === false, "execution must not be allowed now");
  assert(plan.dryRunFalseAllowed === false, "dryRun:false must remain blocked");
  assert(plan.writesDatabase === false, "plan must not write DB");

  assert(plan.plannedServiceMethod.name === "persistAmazonSpApiSandboxImportJobOnly", "planned method name mismatch");
  assert(plan.plannedServiceMethod.visibility === "internal-service-only", "planned method visibility mismatch");
  assert(plan.plannedServiceMethod.requiresFutureEnvGate === "AMAZON_SP_API_SANDBOX_IMPORTJOB_PERSISTENCE_ENABLED", "future env gate mismatch");
  assert(plan.plannedServiceMethod.requiresFutureEnvGateValue === "true", "future env gate value mismatch");
  assert(plan.plannedServiceMethod.controllerCallable === false, "controllerCallable must be false");
  assert(plan.plannedServiceMethod.frontendCallable === false, "frontendCallable must be false");

  assert(plan.plannedWriteScope.importJob.create === true, "ImportJob create should be planned");
  assert(plan.plannedWriteScope.importJob.update === false, "ImportJob update must not be planned");
  assert(plan.plannedWriteScope.importJob.delete === false, "ImportJob delete must not be planned");
  assert(plan.plannedWriteScope.importJob.allowedMetadataColumn === "conflictMonthsJson", "metadata column mismatch");
  assert(plan.plannedWriteScope.importStagingRow.create === true, "ImportStagingRow create should be planned");
  assert(plan.plannedWriteScope.importStagingRow.requireCompanyId === true, "staging companyId required mismatch");
  assert(plan.plannedWriteScope.importStagingRow.requireImportJobId === true, "staging importJobId required mismatch");

  for (const [key, blocked] of Object.entries(plan.explicitlyOutOfScope)) {
    assert(blocked === true, `plan.explicitlyOutOfScope.${key} must remain true`);
  }

  for (const [key, blocked] of Object.entries(plan.blockedNow)) {
    assert(blocked === true, `plan.blockedNow.${key} must remain true`);
  }

  assert(plan.futureExecutionPreconditions.envGateEnabled === false, "env gate must remain disabled");
  assert(plan.futureExecutionPreconditions.cleanupSmokeRequiredBeforeServiceImplementation === true, "cleanup smoke must be required");
  assert(plan.summary.readyForCommitCleanupSimulationDesign === true, "commit cleanup simulation design readiness mismatch");
  assert(plan.summary.readyForPermanentServiceImplementation === false, "permanent service implementation readiness must be false");
  assert(plan.summary.readyForPermanentExecution === false, "permanent execution readiness must be false");
  assert(plan.summary.readyForController === false, "controller readiness must be false");
  assert(plan.summary.readyForFrontend === false, "frontend readiness must be false");

  const aggregateNonDryRunReject = await expectReject(
    "Step121-B aggregate non-dry-run blocked",
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
    "Step121-B staging non-dry-run still blocked",
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
  assert(!leakedJob, "permanent ImportJob persistence plan leaked ImportJob");

  const leakedRows = await prisma.importStagingRow.findMany({
    where: {
      dedupeHash: {
        in: aggregate.previewRows.map((row) => row.dedupeHash),
      },
    },
    select: { id: true },
    take: 10,
  });
  assert(leakedRows.length === 0, `permanent ImportJob persistence plan leaked ImportStagingRow count=${leakedRows.length}`);

  const leakedTxCount = await prisma.transaction.count({
    where: {
      companyId: company.id,
      sourceFileName: filename,
    },
  });
  assert(leakedTxCount === 0, "permanent ImportJob persistence plan leaked Transaction");

  const leakedMovementCount = await prisma.inventoryMovement.count({
    where: {
      companyId: company.id,
      sourceId: {
        in: aggregate.inventoryCompensationPlan.operations.map((operation) => operation.operationId),
      },
    },
  });
  assert(leakedMovementCount === 0, "permanent ImportJob persistence plan leaked InventoryMovement");

  console.log("[SMOKE_OK] amazon sp-api sandbox permanent ImportJob persistence plan smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        plan: {
          version: plan.version,
          decision: plan.decision,
          planOnly: plan.planOnly,
          implementationAllowedNow: plan.implementationAllowedNow,
          executionAllowedNow: plan.executionAllowedNow,
          plannedServiceMethod: plan.plannedServiceMethod,
          plannedWriteScope: plan.plannedWriteScope,
          summary: plan.summary,
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
