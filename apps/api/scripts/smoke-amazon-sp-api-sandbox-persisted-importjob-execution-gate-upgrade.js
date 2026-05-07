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
      amazonOrderId: `SPAPI-STEP120-C-ORDER-1-${runId}`,
      purchaseDate: "2026-05-07T12:34:56Z",
      marketplaceId: "A1VC38T7YXB528",
      orderStatus: "Shipped",
      fulfillmentChannel: "AFN",
      salesChannel: "Amazon.co.jp",
      orderTotal: { currencyCode: "JPY", amount: "16980" },
      items: [
        {
          orderItemId: `SPAPI-STEP120-C-ITEM-1-${runId}`,
          sellerSku: `spapi-step120-c-sku-001-${runId}`,
          title: `Step120-C Execution Gate Upgrade Product ${runId}`,
          quantityOrdered: "3",
          itemPrice: { currencyCode: "JPY", amount: "16980" },
          itemTax: { currencyCode: "JPY", amount: "1698" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "1480" } },
          ],
          raw: { fixture: "step120-c-item-1" },
        },
      ],
      raw: { fixture: "step120-c-order-1" },
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
      const isAmazonExecutionRoute = route.includes("amazon") && route.includes("execution");
      const isAmazonGateRoute = route.includes("amazon") && route.includes("gate");

      if (
        isSpApiRoute ||
        isAmazonSandboxRoute ||
        isAmazonPersistRoute ||
        isAmazonImportJobRoute ||
        isAmazonExecutionRoute ||
        isAmazonGateRoute
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
  const filename = `step120-c-execution-gate-upgrade-${runId}.json`;
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
        amount: 16900,
        grossAmount: 16900,
        netAmount: 15400,
        feeAmount: 1500,
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

  assert(designGate.decision === "BLOCKED_NOW", "Step120-A design gate should remain BLOCKED_NOW");
  const rollbackRequiredCheck = designGate.checks.find((item) => item.key === "rollback-smoke-required");
  assert(rollbackRequiredCheck, "rollback-smoke-required check missing");
  assert(rollbackRequiredCheck.passed === false, "Step120-A design gate rollback check should remain false");
  assert(rollbackRequiredCheck.blocking === true, "Step120-A design gate rollback check should remain blocking");

  const rollbackSimulation = assertAmazonSpApiSandboxPersistedImportJobRollbackSimulation(
    buildAmazonSpApiSandboxPersistedImportJobRollbackSimulation({ designGate }),
  );

  assert(rollbackSimulation.mode === "ROLLBACK_ONLY", "rollback simulation mode mismatch");
  assert(rollbackSimulation.rollbackRequired === true, "rollbackRequired mismatch");
  assert(rollbackSimulation.currentCommitAllowed === false, "rollback currentCommitAllowed must be false");
  assert(rollbackSimulation.writesDatabasePermanently === false, "rollback permanent write must be false");
  assert(rollbackSimulation.summary.rollbackSmokeCoversImportJob === true, "rollback ImportJob coverage mismatch");
  assert(rollbackSimulation.summary.rollbackSmokeCoversImportStagingRows === true, "rollback staging coverage mismatch");
  assert(rollbackSimulation.summary.readyForPermanentPersistence === false, "rollback permanent persistence readiness must be false");

  const executionGate = assertAmazonSpApiSandboxPersistedImportJobExecutionGateUpgrade(
    buildAmazonSpApiSandboxPersistedImportJobExecutionGateUpgrade({ rollbackSimulation }),
  );

  assert(executionGate.version === "amazon-sp-api-sandbox-persisted-importjob-execution-gate-upgrade-v1", "execution gate version mismatch");
  assert(executionGate.decision === "ROLLBACK_SMOKE_COVERED_BUT_EXECUTION_BLOCKED", "execution gate decision mismatch");
  assert(executionGate.upgradeOnly === true, "execution gate upgradeOnly mismatch");
  assert(executionGate.rollbackSmokeCovered === true, "execution gate rollbackSmokeCovered mismatch");
  assert(executionGate.designGateRollbackRequirementSatisfied === true, "designGate rollback requirement should be satisfied in upgraded gate");
  assert(executionGate.currentExecutionAllowed === false, "execution gate currentExecutionAllowed must be false");
  assert(executionGate.dryRunFalseAllowed === false, "execution gate dryRunFalseAllowed must be false");
  assert(executionGate.writesDatabase === false, "execution gate writesDatabase must be false");
  assert(executionGate.readyForExecution === false, "execution gate readyForExecution must be false");
  assert(executionGate.readyForPermanentPersistence === false, "execution gate readyForPermanentPersistence must be false");
  assert(executionGate.summary.rollbackCovered === true, "execution gate summary rollbackCovered mismatch");
  assert(executionGate.summary.permanentWritesCovered === false, "execution gate permanentWritesCovered must be false");
  assert(executionGate.summary.readyForServiceRollbackOnlyDesign === true, "readyForServiceRollbackOnlyDesign mismatch");
  assert(executionGate.summary.readyForPermanentExecution === false, "readyForPermanentExecution must be false");

  assert(executionGate.futurePhaseScope.mayDesignServicePersistenceMethod === true, "mayDesignServicePersistenceMethod should be true");
  assert(executionGate.futurePhaseScope.mayDesignRollbackOnlyServiceMethod === true, "mayDesignRollbackOnlyServiceMethod should be true");
  assert(executionGate.futurePhaseScope.mayExecutePermanentImportJobPersistenceNow === false, "permanent ImportJob execution must remain false");
  assert(executionGate.futurePhaseScope.mayExecutePermanentImportStagingRowPersistenceNow === false, "permanent staging execution must remain false");
  assert(executionGate.futurePhaseScope.mayAllowDryRunFalseNow === false, "dryRun:false must remain false");
  assert(executionGate.futurePhaseScope.mayCommitTransactions === false, "transactions must remain false");
  assert(executionGate.futurePhaseScope.mayCreateInventoryMovement === false, "inventory movement must remain false");
  assert(executionGate.futurePhaseScope.mayOpenController === false, "controller must remain false");
  assert(executionGate.futurePhaseScope.mayOpenFrontend === false, "frontend must remain false");
  assert(executionGate.futurePhaseScope.mayCallRealSpApi === false, "real SP-API must remain false");
  assert(executionGate.futurePhaseScope.mayUseOAuth === false, "OAuth must remain false");
  assert(executionGate.futurePhaseScope.mayPersistToken === false, "token persistence must remain false");

  for (const [key, blocked] of Object.entries(executionGate.blockedNow)) {
    assert(blocked === true, `executionGate.blockedNow.${key} must remain true`);
  }

  const aggregateNonDryRunReject = await expectReject(
    "Step120-C aggregate non-dry-run blocked",
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
    "Step120-C staging non-dry-run still blocked",
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
  assert(!leakedJob, "execution gate upgrade leaked ImportJob");

  const leakedRows = await prisma.importStagingRow.findMany({
    where: {
      dedupeHash: {
        in: aggregate.previewRows.map((row) => row.dedupeHash),
      },
    },
    select: { id: true },
    take: 10,
  });
  assert(leakedRows.length === 0, `execution gate upgrade leaked ImportStagingRow count=${leakedRows.length}`);

  const leakedTxCount = await prisma.transaction.count({
    where: {
      companyId: company.id,
      sourceFileName: filename,
    },
  });
  assert(leakedTxCount === 0, "execution gate upgrade leaked Transaction");

  const leakedMovementCount = await prisma.inventoryMovement.count({
    where: {
      companyId: company.id,
      sourceId: aggregate.inventoryCompensationPlan.operations[0]?.operationId || "missing-operation",
    },
  });
  assert(leakedMovementCount === 0, "execution gate upgrade leaked InventoryMovement");

  const schema = read(schemaFile);
  assert(schema.includes("model ImportJob"), "schema missing ImportJob");
  assert(schema.includes("model ImportStagingRow"), "schema missing ImportStagingRow");
  assert(schema.includes("model Transaction"), "schema missing Transaction");
  assert(schema.includes("model InventoryMovement"), "schema missing InventoryMovement");
  assert(!schema.includes("PersistedImportJobExecutionGate"), "Step120-C must not add execution gate table");
  assert(!schema.includes("PersistedImportJobRollbackSimulation"), "Step120-C must not add rollback simulation table");
  assert(!schema.includes("PersistedImportJobDesignGate"), "Step120-C must not add design gate table");
  assert(!schema.includes("PlanningAggregate"), "Step120-C must not add aggregate table");
  assert(!schema.includes("AmazonSpApiCredential"), "Step120-C must not add credential table");
  assert(!schema.includes("AmazonSpApiToken"), "Step120-C must not add token table");

  const serviceSource = read(importsServiceTs);
  assert(serviceSource.includes("planAmazonSpApiSandboxImportAggregate"), "service aggregate method missing");
  assert(serviceSource.includes("STEP119_B_SP_API_SANDBOX_AGGREGATE_NON_DRY_RUN_BLOCKED"), "aggregate non-dry-run block missing");
  assert(serviceSource.includes("STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED"), "staging non-dry-run block missing");
  assert(!serviceSource.includes("buildAmazonSpApiSandboxPersistedImportJobExecutionGateUpgrade"), "Step120-C must not wire execution gate into service yet");

  const controllerSource = read(importsControllerTs);
  assert(!controllerSource.includes("planAmazonSpApiSandboxImportAggregate"), "controller must not expose aggregate method");
  assert(!controllerSource.includes("buildAmazonSpApiSandboxPersistedImportJobExecutionGateUpgrade"), "controller must not import execution gate");
  assert(!controllerSource.includes("previewAmazonSpApiSandboxOrders"), "controller must not expose preview method");
  assert(!controllerSource.includes("commitAmazonSpApiSandboxOrdersToStaging"), "controller must not expose commit method");

  const routeScan = scanControllerRoutes(root, srcRoot);
  assert(routeScan.exposedRoutes.length === 0, `controller route leak: ${JSON.stringify(routeScan.exposedRoutes)}`);

  console.log("[SMOKE_OK] amazon sp-api sandbox persisted ImportJob execution gate upgrade smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        executionGate: {
          version: executionGate.version,
          decision: executionGate.decision,
          rollbackSmokeCovered: executionGate.rollbackSmokeCovered,
          designGateRollbackRequirementSatisfied: executionGate.designGateRollbackRequirementSatisfied,
          currentExecutionAllowed: executionGate.currentExecutionAllowed,
          dryRunFalseAllowed: executionGate.dryRunFalseAllowed,
          writesDatabase: executionGate.writesDatabase,
          readyForExecution: executionGate.readyForExecution,
          summary: executionGate.summary,
          futurePhaseScope: executionGate.futurePhaseScope,
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
