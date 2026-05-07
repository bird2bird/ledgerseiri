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
      amazonOrderId: `SPAPI-STEP121-D-ORDER-1-${runId}`,
      purchaseDate: "2026-05-07T12:34:56Z",
      marketplaceId: "A1VC38T7YXB528",
      orderStatus: "Shipped",
      fulfillmentChannel: "AFN",
      salesChannel: "Amazon.co.jp",
      orderTotal: { currencyCode: "JPY", amount: "23980" },
      items: [
        {
          orderItemId: `SPAPI-STEP121-D-ITEM-1-${runId}`,
          sellerSku: `spapi-step121-d-sku-001-${runId}`,
          title: `Step121-D Permanent Service Method Design Product ${runId}`,
          quantityOrdered: "3",
          itemPrice: { currencyCode: "JPY", amount: "23980" },
          itemTax: { currencyCode: "JPY", amount: "2398" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "2180" } },
          ],
          raw: { fixture: "step121-d-item-1" },
        },
      ],
      raw: { fixture: "step121-d-order-1" },
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
  assert(!serviceSource.includes("persistAmazonSpApiSandboxImportJobOnly("), "Step121-D must not implement permanent service method yet");
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
  assert(!schema.includes("PermanentImportJobServiceMethodDesign"), "Step121-D must not add service design table");
  assert(!schema.includes("AmazonSpApiCredential"), "Step121-D must not add credential table");
  assert(!schema.includes("AmazonSpApiToken"), "Step121-D must not add token table");
  assert(!schema.includes("CrossSourceDedupe"), "Step121-D must not add dedupe table");

  const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const company = await resolveCompanyId();
  const service = new ImportsService(prisma);
  const filename = `step121-d-service-method-design-${runId}.json`;
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
        amount: 23900,
        grossAmount: 23900,
        netAmount: 21700,
        feeAmount: 2200,
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

  const design = assertAmazonSpApiSandboxPermanentImportJobServiceMethodDesign(
    buildAmazonSpApiSandboxPermanentImportJobServiceMethodDesign({ simulation }),
  );

  assert(design.version === "amazon-sp-api-sandbox-permanent-importjob-service-method-design-v1", "design version mismatch");
  assert(design.decision === "DESIGN_READY_IMPLEMENTATION_BLOCKED_BY_ENV_GATE", "design decision mismatch");
  assert(design.designOnly === true, "designOnly mismatch");
  assert(design.serviceMethodName === "persistAmazonSpApiSandboxImportJobOnly", "service method name mismatch");
  assert(design.serviceMethodImplementedNow === false, "service method must not be implemented now");
  assert(design.implementationAllowedNow === false, "implementation must remain blocked now");
  assert(design.executionAllowedNow === false, "execution must remain blocked now");
  assert(design.controllerCallable === false, "controllerCallable must be false");
  assert(design.frontendCallable === false, "frontendCallable must be false");

  assert(design.requiredMethodArgs.requireEnvGate === "AMAZON_SP_API_SANDBOX_IMPORTJOB_PERSISTENCE_ENABLED=true", "env gate mismatch");
  assert(design.requiredMethodArgs.persistenceMode === "importjob-and-staging-only", "persistence mode mismatch");
  assert(design.requiredMethodArgs.allowTransactions === false, "transactions must not be allowed");
  assert(design.requiredMethodArgs.allowInventory === false, "inventory must not be allowed");
  assert(design.requiredMethodArgs.allowRealSpApi === false, "real SP-API must not be allowed");
  assert(design.requiredMethodArgs.allowTokenPersistence === false, "token persistence must not be allowed");

  assert(design.requiredGuards.internalSandboxEnv === true, "internal env guard missing");
  assert(design.requiredGuards.futurePersistenceEnvGate === true, "future persistence env gate missing");
  assert(design.requiredGuards.duplicateFilenamePrecheck === true, "duplicate filename precheck missing");
  assert(design.requiredGuards.controllerDisabled === true, "controller disabled guard missing");
  assert(design.requiredGuards.frontendDisabled === true, "frontend disabled guard missing");

  assert(design.plannedBehavior.createImportJob === true, "ImportJob create should be planned");
  assert(design.plannedBehavior.createImportStagingRows === true, "ImportStagingRows create should be planned");
  assert(design.plannedBehavior.statusInitial === "PENDING", "initial status mismatch");
  assert(design.plannedBehavior.targetEntityIdMustRemainNull === true, "targetEntityId must remain null");
  assert(design.plannedBehavior.transactionCommit === false, "transaction commit must be false");
  assert(design.plannedBehavior.transactionOverwrite === false, "transaction overwrite must be false");
  assert(design.plannedBehavior.inventoryMovementCreate === false, "inventory movement must be false");
  assert(design.plannedBehavior.inventoryBalanceUpdate === false, "inventory balance must be false");
  assert(design.plannedBehavior.realSpApiCall === false, "real SP-API must be false");
  assert(design.plannedBehavior.tokenPersistence === false, "token persistence must be false");

  for (const [key, blocked] of Object.entries(design.blockedNow)) {
    assert(blocked === true, `design.blockedNow.${key} must remain true`);
  }

  assert(design.summary.readyForServiceImplementationBehindEnvGate === true, "implementation behind env gate readiness mismatch");
  assert(design.summary.readyForExecution === false, "execution readiness must be false");
  assert(design.summary.readyForController === false, "controller readiness must be false");
  assert(design.summary.readyForFrontend === false, "frontend readiness must be false");

  const aggregateNonDryRunReject = await expectReject(
    "Step121-D aggregate non-dry-run blocked",
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
    "Step121-D staging non-dry-run still blocked",
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
  assert(!leakedJob, "permanent service method design leaked ImportJob");

  const leakedRows = await prisma.importStagingRow.findMany({
    where: {
      dedupeHash: {
        in: aggregate.previewRows.map((row) => row.dedupeHash),
      },
    },
    select: { id: true },
    take: 10,
  });
  assert(leakedRows.length === 0, `permanent service method design leaked ImportStagingRow count=${leakedRows.length}`);

  const leakedTxCount = await prisma.transaction.count({
    where: {
      companyId: company.id,
      sourceFileName: filename,
    },
  });
  assert(leakedTxCount === 0, "permanent service method design leaked Transaction");

  const leakedMovementCount = await prisma.inventoryMovement.count({
    where: {
      companyId: company.id,
      sourceId: {
        in: aggregate.inventoryCompensationPlan.operations.map((operation) => operation.operationId),
      },
    },
  });
  assert(leakedMovementCount === 0, "permanent service method design leaked InventoryMovement");

  console.log("[SMOKE_OK] amazon sp-api sandbox permanent ImportJob service method design smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        design: {
          version: design.version,
          decision: design.decision,
          designOnly: design.designOnly,
          serviceMethodName: design.serviceMethodName,
          serviceMethodImplementedNow: design.serviceMethodImplementedNow,
          implementationAllowedNow: design.implementationAllowedNow,
          executionAllowedNow: design.executionAllowedNow,
          requiredMethodArgs: design.requiredMethodArgs,
          plannedBehavior: design.plannedBehavior,
          summary: design.summary,
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
