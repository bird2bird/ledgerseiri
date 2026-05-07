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
      amazonOrderId: `SPAPI-STEP120-A-ORDER-1-${runId}`,
      purchaseDate: "2026-05-07T12:34:56Z",
      marketplaceId: "A1VC38T7YXB528",
      orderStatus: "Shipped",
      fulfillmentChannel: "AFN",
      salesChannel: "Amazon.co.jp",
      orderTotal: { currencyCode: "JPY", amount: "14980" },
      items: [
        {
          orderItemId: `SPAPI-STEP120-A-ITEM-1-${runId}`,
          sellerSku: `spapi-step120-a-sku-001-${runId}`,
          title: `Step120-A Persisted ImportJob Design Gate Product ${runId}`,
          quantityOrdered: "3",
          itemPrice: { currencyCode: "JPY", amount: "14980" },
          itemTax: { currencyCode: "JPY", amount: "1498" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "1280" } },
          ],
          raw: { fixture: "step120-a-item-1" },
        },
      ],
      raw: { fixture: "step120-a-order-1" },
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
      const isAmazonDesignGateRoute = route.includes("amazon") && route.includes("design");

      if (
        isSpApiRoute ||
        isAmazonSandboxRoute ||
        isAmazonPersistRoute ||
        isAmazonImportJobRoute ||
        isAmazonDesignGateRoute
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
  const filename = `step120-a-persisted-importjob-design-gate-${runId}.json`;
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
        amount: 14900,
        grossAmount: 14900,
        netAmount: 13600,
        feeAmount: 1300,
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

  assert(aggregateResult.ok === true, "aggregate result ok mismatch");
  assert(aggregateResult.planOnly === true, "aggregate must be plan-only");
  assert(aggregateResult.writesDatabase === false, "aggregate must not write DB");

  const gate = assertAmazonSpApiSandboxPersistedImportJobDesignGate(
    buildAmazonSpApiSandboxPersistedImportJobDesignGate({
      aggregate: aggregateResult.aggregate,
    }),
  );

  assert(gate.version === "amazon-sp-api-sandbox-persisted-importjob-design-gate-v1", "gate version mismatch");
  assert(gate.designOnly === true, "gate designOnly mismatch");
  assert(gate.currentExecutionAllowed === false, "gate execution must be false");
  assert(gate.dryRunFalseAllowed === false, "gate dryRunFalseAllowed must be false");
  assert(gate.writesDatabase === false, "gate writesDatabase must be false");
  assert(gate.decision === "BLOCKED_NOW", "gate should remain BLOCKED_NOW because rollback smoke is not implemented");
  assert(gate.summary.readyForImplementationReview === true, "gate should be ready for implementation review");
  assert(gate.summary.readyForExecution === false, "gate must not be ready for execution");
  assert(gate.plannedPersistenceShape.importJob.totalRowsFromPlan === 1, "gate ImportJob row count mismatch");
  assert(gate.plannedPersistenceShape.importStagingRow.rowCountFromPlan === 1, "gate staging row count mismatch");
  assert(gate.plannedPersistenceShape.importJob.dataJsonRequired === true, "gate dataJsonRequired mismatch");
  assert(gate.plannedPersistenceShape.importStagingRow.normalizedPayloadJsonRequired === true, "gate normalizedPayloadJsonRequired mismatch");
  assert(gate.plannedPersistenceShape.importStagingRow.rawPayloadJsonRequired === true, "gate rawPayloadJsonRequired mismatch");

  assert(gate.futurePhaseScope.mayDesignImportJobPersistence === true, "design ImportJob persistence should be allowed");
  assert(gate.futurePhaseScope.mayDesignImportStagingRowPersistence === true, "design staging persistence should be allowed");
  assert(gate.futurePhaseScope.mayExecuteImportJobPersistenceNow === false, "execute ImportJob persistence must be false");
  assert(gate.futurePhaseScope.mayExecuteImportStagingRowPersistenceNow === false, "execute staging persistence must be false");
  assert(gate.futurePhaseScope.mayCommitTransactions === false, "commit Transactions must be false");
  assert(gate.futurePhaseScope.mayOverwriteTransactions === false, "overwrite Transactions must be false");
  assert(gate.futurePhaseScope.mayCreateInventoryMovement === false, "create InventoryMovement must be false");
  assert(gate.futurePhaseScope.mayUpdateInventoryBalance === false, "update InventoryBalance must be false");
  assert(gate.futurePhaseScope.mayOpenController === false, "open controller must be false");
  assert(gate.futurePhaseScope.mayOpenFrontend === false, "open frontend must be false");
  assert(gate.futurePhaseScope.mayCallRealSpApi === false, "real SP-API must be false");
  assert(gate.futurePhaseScope.mayUseOAuth === false, "OAuth must be false");
  assert(gate.futurePhaseScope.mayPersistToken === false, "token persistence must be false");

  const rollbackCheck = gate.checks.find((item) => item.key === "rollback-smoke-required");
  assert(rollbackCheck, "rollback-smoke-required check missing");
  assert(rollbackCheck.passed === false, "rollback-smoke-required must be false in Step120-A");
  assert(rollbackCheck.blocking === true, "rollback-smoke-required must block execution");

  for (const [key, blocked] of Object.entries(gate.blockedNow)) {
    assert(blocked === true, `gate.blockedNow.${key} must remain true`);
  }

  const aggregateNonDryRunReject = await expectReject(
    "Step120-A aggregate non-dry-run blocked",
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
    "Step120-A staging non-dry-run still blocked",
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
  assert(!leakedJob, "persisted ImportJob design gate leaked ImportJob");

  const leakedRows = await prisma.importStagingRow.findMany({
    where: {
      dedupeHash: {
        in: aggregateResult.preview.rows.map((row) => row.dedupeHash),
      },
    },
    select: { id: true },
    take: 10,
  });
  assert(leakedRows.length === 0, `persisted ImportJob design gate leaked ImportStagingRow count=${leakedRows.length}`);

  const leakedTxCount = await prisma.transaction.count({
    where: {
      companyId: company.id,
      sourceFileName: filename,
    },
  });
  assert(leakedTxCount === 0, "persisted ImportJob design gate leaked Transaction");

  const leakedMovementCount = await prisma.inventoryMovement.count({
    where: {
      companyId: company.id,
      sourceId: aggregateResult.aggregate.inventoryCompensationPlan.operations[0]?.operationId || "missing-operation",
    },
  });
  assert(leakedMovementCount === 0, "persisted ImportJob design gate leaked InventoryMovement");

  const schema = read(schemaFile);
  assert(schema.includes("model ImportJob"), "schema missing ImportJob");
  assert(schema.includes("model ImportStagingRow"), "schema missing ImportStagingRow");
  assert(schema.includes("model Transaction"), "schema missing Transaction");
  assert(schema.includes("model InventoryMovement"), "schema missing InventoryMovement");
  assert(!schema.includes("PersistedImportJobDesignGate"), "Step120-A must not add design gate table");
  assert(!schema.includes("PersistedImportJob"), "Step120-A must not add persisted ImportJob table");
  assert(!schema.includes("PlanningAggregate"), "Step120-A must not add aggregate table");
  assert(!schema.includes("AmazonSpApiCredential"), "Step120-A must not add credential table");
  assert(!schema.includes("AmazonSpApiToken"), "Step120-A must not add token table");
  assert(!schema.includes("CrossSourceDedupe"), "Step120-A must not add dedupe table");

  const serviceSource = read(importsServiceTs);
  assert(serviceSource.includes("planAmazonSpApiSandboxImportAggregate"), "service aggregate method missing");
  assert(serviceSource.includes("STEP119_B_SP_API_SANDBOX_AGGREGATE_NON_DRY_RUN_BLOCKED"), "aggregate non-dry-run block missing");
  assert(serviceSource.includes("STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED"), "staging non-dry-run block missing");
  assert(!serviceSource.includes("buildAmazonSpApiSandboxPersistedImportJobDesignGate"), "Step120-A must not wire design gate into service yet");

  const controllerSource = read(importsControllerTs);
  assert(!controllerSource.includes("planAmazonSpApiSandboxImportAggregate"), "controller must not expose aggregate method");
  assert(!controllerSource.includes("buildAmazonSpApiSandboxPersistedImportJobDesignGate"), "controller must not import design gate");
  assert(!controllerSource.includes("previewAmazonSpApiSandboxOrders"), "controller must not expose preview method");
  assert(!controllerSource.includes("commitAmazonSpApiSandboxOrdersToStaging"), "controller must not expose commit method");

  const routeScan = scanControllerRoutes(root, srcRoot);
  assert(routeScan.exposedRoutes.length === 0, `controller route leak: ${JSON.stringify(routeScan.exposedRoutes)}`);

  console.log("[SMOKE_OK] amazon sp-api sandbox persisted ImportJob design gate smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        gate: {
          version: gate.version,
          decision: gate.decision,
          designOnly: gate.designOnly,
          currentExecutionAllowed: gate.currentExecutionAllowed,
          dryRunFalseAllowed: gate.dryRunFalseAllowed,
          writesDatabase: gate.writesDatabase,
          summary: gate.summary,
          futurePhaseScope: gate.futurePhaseScope,
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
