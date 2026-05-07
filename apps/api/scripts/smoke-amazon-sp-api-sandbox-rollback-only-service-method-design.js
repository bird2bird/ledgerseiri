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
  buildAmazonSpApiSandboxRollbackOnlyServiceMethodDesign,
  assertAmazonSpApiSandboxRollbackOnlyServiceMethodDesign,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-rollback-only-service-method-design.dto");

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
      amazonOrderId: `SPAPI-STEP120-D-ORDER-1-${runId}`,
      purchaseDate: "2026-05-07T12:34:56Z",
      marketplaceId: "A1VC38T7YXB528",
      orderStatus: "Shipped",
      fulfillmentChannel: "AFN",
      salesChannel: "Amazon.co.jp",
      orderTotal: { currencyCode: "JPY", amount: "17980" },
      items: [
        {
          orderItemId: `SPAPI-STEP120-D-ITEM-1-${runId}`,
          sellerSku: `spapi-step120-d-sku-001-${runId}`,
          title: `Step120-D Rollback Only Service Method Design Product ${runId}`,
          quantityOrdered: "3",
          itemPrice: { currencyCode: "JPY", amount: "17980" },
          itemTax: { currencyCode: "JPY", amount: "1798" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "1580" } },
          ],
          raw: { fixture: "step120-d-item-1" },
        },
      ],
      raw: { fixture: "step120-d-order-1" },
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
  const filename = `step120-d-rollback-only-service-method-design-${runId}.json`;
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
        amount: 17900,
        grossAmount: 17900,
        netAmount: 16300,
        feeAmount: 1600,
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
  const serviceDesign = assertAmazonSpApiSandboxRollbackOnlyServiceMethodDesign(
    buildAmazonSpApiSandboxRollbackOnlyServiceMethodDesign({ executionGate }),
  );

  assert(serviceDesign.version === "amazon-sp-api-sandbox-rollback-only-service-method-design-v1", "service design version mismatch");
  assert(serviceDesign.decision === "DESIGN_ALLOWED_SERVICE_NOT_IMPLEMENTED", "service design decision mismatch");
  assert(serviceDesign.designOnly === true, "service design designOnly mismatch");
  assert(serviceDesign.serviceMethodImplemented === false, "service method must not be implemented yet");
  assert(serviceDesign.serviceMethodMayBeDesigned === true, "service method may be designed");
  assert(serviceDesign.controllerMayCallServiceMethod === false, "controller may not call service method");
  assert(serviceDesign.frontendMayCallServiceMethod === false, "frontend may not call service method");

  assert(serviceDesign.proposedServiceMethod.name === "rollbackOnlyPersistAmazonSpApiSandboxImportJob", "proposed method name mismatch");
  assert(serviceDesign.proposedServiceMethod.visibility === "internal-service-only", "visibility mismatch");
  assert(serviceDesign.proposedServiceMethod.requiresInternalSandboxEnv === true, "env gate required mismatch");
  assert(serviceDesign.proposedServiceMethod.requiresRollbackOnly === true, "rollbackOnly required mismatch");
  assert(serviceDesign.proposedServiceMethod.requiresForceRollback === true, "forceRollback required mismatch");
  assert(serviceDesign.proposedServiceMethod.allowsPermanentCommit === false, "permanent commit must be false");
  assert(serviceDesign.proposedServiceMethod.allowsDryRunFalse === false, "dryRun:false must be false");
  assert(serviceDesign.proposedServiceMethod.returnsRollbackVerification === true, "rollback verification return mismatch");

  assert(serviceDesign.plannedTransactionBehavior.createImportJobInsideTransaction === true, "ImportJob transaction design mismatch");
  assert(serviceDesign.plannedTransactionBehavior.createImportStagingRowsInsideTransaction === true, "staging row transaction design mismatch");
  assert(serviceDesign.plannedTransactionBehavior.forceRollbackBeforeReturn === true, "force rollback design mismatch");
  assert(serviceDesign.plannedTransactionBehavior.verifyNoImportJobLeak === true, "ImportJob leak verification mismatch");
  assert(serviceDesign.plannedTransactionBehavior.verifyNoImportStagingRowLeak === true, "staging leak verification mismatch");
  assert(serviceDesign.plannedTransactionBehavior.verifyNoTransactionLeak === true, "Transaction leak verification mismatch");
  assert(serviceDesign.plannedTransactionBehavior.verifyNoInventoryMovementLeak === true, "InventoryMovement leak verification mismatch");

  assert(serviceDesign.currentBlocks.currentExecutionAllowed === false, "current execution must remain false");
  assert(serviceDesign.currentBlocks.dryRunFalseAllowed === false, "dryRun false must remain false");
  assert(serviceDesign.currentBlocks.writesDatabasePermanently === false, "permanent writes must remain false");
  assert(serviceDesign.currentBlocks.readyForPermanentPersistence === false, "permanent persistence readiness must remain false");
  assert(serviceDesign.currentBlocks.readyForController === false, "controller readiness must remain false");
  assert(serviceDesign.currentBlocks.readyForFrontend === false, "frontend readiness must remain false");

  assert(serviceDesign.summary.rollbackSmokeCovered === true, "rollback smoke coverage mismatch");
  assert(serviceDesign.summary.readyForRollbackOnlyServiceMethodImplementation === true, "rollback-only service method implementation readiness mismatch");
  assert(serviceDesign.summary.readyForPermanentPersistence === false, "permanent persistence readiness must be false");
  assert(serviceDesign.summary.readyForController === false, "controller readiness must be false");
  assert(serviceDesign.summary.readyForFrontend === false, "frontend readiness must be false");

  for (const [key, blocked] of Object.entries(serviceDesign.outOfScope)) {
    assert(blocked === true, `serviceDesign.outOfScope.${key} must remain true`);
  }

  const aggregateNonDryRunReject = await expectReject(
    "Step120-D aggregate non-dry-run blocked",
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
    "Step120-D staging non-dry-run still blocked",
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
  assert(!leakedJob, "rollback-only service method design leaked ImportJob");

  const leakedRows = await prisma.importStagingRow.findMany({
    where: {
      dedupeHash: {
        in: aggregate.previewRows.map((row) => row.dedupeHash),
      },
    },
    select: { id: true },
    take: 10,
  });
  assert(leakedRows.length === 0, `rollback-only service method design leaked ImportStagingRow count=${leakedRows.length}`);

  const leakedTxCount = await prisma.transaction.count({
    where: {
      companyId: company.id,
      sourceFileName: filename,
    },
  });
  assert(leakedTxCount === 0, "rollback-only service method design leaked Transaction");

  const leakedMovementCount = await prisma.inventoryMovement.count({
    where: {
      companyId: company.id,
      sourceId: aggregate.inventoryCompensationPlan.operations[0]?.operationId || "missing-operation",
    },
  });
  assert(leakedMovementCount === 0, "rollback-only service method design leaked InventoryMovement");

  const schema = read(schemaFile);
  assert(schema.includes("model ImportJob"), "schema missing ImportJob");
  assert(schema.includes("model ImportStagingRow"), "schema missing ImportStagingRow");
  assert(schema.includes("model Transaction"), "schema missing Transaction");
  assert(schema.includes("model InventoryMovement"), "schema missing InventoryMovement");
  assert(!schema.includes("RollbackOnlyServiceMethodDesign"), "Step120-D must not add service design table");
  assert(!schema.includes("PersistedImportJobExecutionGate"), "Step120-D must not add execution gate table");
  assert(!schema.includes("PersistedImportJobRollbackSimulation"), "Step120-D must not add rollback simulation table");
  assert(!schema.includes("PersistedImportJobDesignGate"), "Step120-D must not add design gate table");
  assert(!schema.includes("PlanningAggregate"), "Step120-D must not add aggregate table");
  assert(!schema.includes("AmazonSpApiCredential"), "Step120-D must not add credential table");
  assert(!schema.includes("AmazonSpApiToken"), "Step120-D must not add token table");

  const serviceSource = read(importsServiceTs);
  assert(serviceSource.includes("planAmazonSpApiSandboxImportAggregate"), "service aggregate method missing");
  assert(serviceSource.includes("STEP119_B_SP_API_SANDBOX_AGGREGATE_NON_DRY_RUN_BLOCKED"), "aggregate non-dry-run block missing");
  assert(serviceSource.includes("STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED"), "staging non-dry-run block missing");
  assert(!serviceSource.includes("rollbackOnlyPersistAmazonSpApiSandboxImportJob"), "Step120-D must not implement rollback-only service method yet");
  assert(!serviceSource.includes("buildAmazonSpApiSandboxRollbackOnlyServiceMethodDesign"), "Step120-D must not wire service method design into service yet");

  const controllerSource = read(importsControllerTs);
  assert(!controllerSource.includes("rollbackOnlyPersistAmazonSpApiSandboxImportJob"), "controller must not expose rollback-only service method");
  assert(!controllerSource.includes("planAmazonSpApiSandboxImportAggregate"), "controller must not expose aggregate method");
  assert(!controllerSource.includes("buildAmazonSpApiSandboxRollbackOnlyServiceMethodDesign"), "controller must not import service method design");
  assert(!controllerSource.includes("previewAmazonSpApiSandboxOrders"), "controller must not expose preview method");
  assert(!controllerSource.includes("commitAmazonSpApiSandboxOrdersToStaging"), "controller must not expose commit method");

  const routeScan = scanControllerRoutes(root, srcRoot);
  assert(routeScan.exposedRoutes.length === 0, `controller route leak: ${JSON.stringify(routeScan.exposedRoutes)}`);

  console.log("[SMOKE_OK] amazon sp-api sandbox rollback-only service method design smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        serviceDesign: {
          version: serviceDesign.version,
          decision: serviceDesign.decision,
          designOnly: serviceDesign.designOnly,
          serviceMethodImplemented: serviceDesign.serviceMethodImplemented,
          proposedServiceMethod: serviceDesign.proposedServiceMethod,
          summary: serviceDesign.summary,
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
