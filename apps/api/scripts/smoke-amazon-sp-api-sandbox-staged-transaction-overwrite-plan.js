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
  buildAmazonOrderNormalizedPayload,
} = require("../dist/src/imports/amazon-order-normalized-contract");
const {
  buildAmazonSpApiSandboxOverrideAuditSnapshot,
  assertAmazonSpApiSandboxOverrideAuditSnapshot,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-override-audit-snapshot.dto");
const {
  buildAmazonSpApiSandboxPersistencePreflightChecklist,
  assertAmazonSpApiSandboxPersistencePreflightChecklist,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-persistence-preflight-checklist.dto");
const {
  buildAmazonSpApiSandboxStagedImportJobPersistencePlan,
  assertAmazonSpApiSandboxStagedImportJobPersistencePlan,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-staged-importjob-persistence-plan.dto");
const {
  buildAmazonSpApiSandboxStagedTransactionOverwritePlan,
  assertAmazonSpApiSandboxStagedTransactionOverwritePlan,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-staged-transaction-overwrite-plan.dto");

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
      amazonOrderId: `SPAPI-STEP118-B-ORDER-1-${runId}`,
      purchaseDate: "2026-05-07T12:34:56Z",
      marketplaceId: "A1VC38T7YXB528",
      orderStatus: "Shipped",
      fulfillmentChannel: "AFN",
      salesChannel: "Amazon.co.jp",
      orderTotal: { currencyCode: "JPY", amount: "8980" },
      items: [
        {
          orderItemId: `SPAPI-STEP118-B-ITEM-1-${runId}`,
          sellerSku: `spapi-step118-b-sku-001-${runId}`,
          title: `Step118-B Transaction Overwrite Plan Product ${runId}`,
          quantityOrdered: "2",
          itemPrice: { currencyCode: "JPY", amount: "8980" },
          itemTax: { currencyCode: "JPY", amount: "898" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "720" } },
          ],
          raw: { fixture: "step118-b-item-1" },
        },
      ],
      raw: { fixture: "step118-b-order-1" },
    },
  ];
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
  const filename = `step118-b-transaction-overwrite-plan-${runId}.json`;

  const preview = await service.previewAmazonSpApiSandboxOrders({
    companyId: company.id,
    filename,
    orders: buildOrders(runId),
  });

  assert(preview.ok === true, "preview ok mismatch");
  assert(preview.rows.length === 1, "preview rows mismatch");

  const orderId = preview.rows[0].payload.orderId;
  const sellerSku = preview.rows[0].payload.sellerSku;

  const existingPayload = buildAmazonOrderNormalizedPayload({
    sourceType: "AMAZON_ORDER_CSV",
    importJobId: "existing-csv-import-job",
    sourceRowNo: 10,
    sourceFileName: "existing-order.csv",
    amazonOrderId: orderId,
    orderId,
    occurredAt: preview.rows[0].payload.occurredAt,
    sellerSku,
    quantity: 1,
    amount: 8900,
    grossAmount: 8900,
    netAmount: 8200,
    currency: "JPY",
    feeAmount: 700,
    businessMonth: preview.rows[0].payload.businessMonth,
    rawTransactionType: "注文",
    raw: { source: "csv-existing" },
  });

  const snapshot = assertAmazonSpApiSandboxOverrideAuditSnapshot(
    buildAmazonSpApiSandboxOverrideAuditSnapshot({
      existingPayload,
      spApiPayload: preview.rows[0].payload,
      overwrittenSource: "AMAZON_ORDER_CSV",
    }),
  );

  const preflightChecklist = assertAmazonSpApiSandboxPersistencePreflightChecklist(
    buildAmazonSpApiSandboxPersistencePreflightChecklist({ auditSnapshot: snapshot }),
  );

  const importJobPlan = assertAmazonSpApiSandboxStagedImportJobPersistencePlan(
    buildAmazonSpApiSandboxStagedImportJobPersistencePlan({
      companyId: company.id,
      filename,
      previewRows: preview.rows,
      preflightChecklist,
      overrideAuditSnapshots: [snapshot],
    }),
  );

  const txPlan = assertAmazonSpApiSandboxStagedTransactionOverwritePlan(
    buildAmazonSpApiSandboxStagedTransactionOverwritePlan({
      importJobPlan,
      overrideAuditSnapshots: [snapshot],
    }),
  );

  assert(txPlan.version === "amazon-sp-api-sandbox-staged-transaction-overwrite-plan-v1", "tx plan version mismatch");
  assert(txPlan.planOnly === true, "tx plan planOnly mismatch");
  assert(txPlan.writesDatabase === false, "tx plan writesDatabase must be false");
  assert(txPlan.currentExecutionAllowed === false, "tx plan execution must be false");
  assert(txPlan.futureExecutionRequiresPreflight === true, "tx plan future preflight mismatch");
  assert(txPlan.normalizedSourceType === "AMAZON_ORDER_SP_API", "tx plan normalized source mismatch");
  assert(txPlan.operations.length === 1, "tx plan operation count mismatch");

  const op = txPlan.operations[0];
  assert(op.status === "BLOCKED_NOW", "operation must be blocked now");
  assert(op.planOnly === true, "operation planOnly mismatch");
  assert(op.writesDatabase === false, "operation writesDatabase must be false");
  assert(op.currentExecutionAllowed === false, "operation execution must be false");
  assert(op.authoritativeSource === "AMAZON_ORDER_SP_API", "operation authoritative source mismatch");
  assert(op.overwrittenSource === "AMAZON_ORDER_CSV", "operation overwritten source mismatch");
  assert(op.canonicalDedupeKey, "operation canonical key missing");
  assert(op.plannedPatch.sourceType === "AMAZON_ORDER_SP_API", "planned patch sourceType mismatch");
  assert(op.plannedPatch.amount === preview.rows[0].payload.grossAmount, "planned patch amount mismatch");
  assert(op.plannedPatch.quantity === preview.rows[0].payload.quantity, "planned patch quantity mismatch");
  assert(op.plannedPatch.memoMarkers.includes("[override:planned-only]"), "planned patch memo marker missing");
  assert(op.requiresManualReview === true, "operation should require manual review");
  assert(op.requiresInventoryCompensationPlan === true, "operation should require inventory compensation plan");
  assert(op.requiresRollbackPlan === true, "operation should require rollback plan");
  assert(txPlan.warnings.includes("MANUAL_REVIEW_REQUIRED_BEFORE_ANY_FUTURE_OVERWRITE"), "tx plan manual review warning missing");
  assert(txPlan.warnings.includes("INVENTORY_COMPENSATION_PLAN_REQUIRED_BEFORE_ANY_FUTURE_OVERWRITE"), "tx plan inventory warning missing");

  for (const [key, blocked] of Object.entries(txPlan.blockedNow)) {
    assert(blocked === true, `txPlan.blockedNow.${key} must remain true`);
  }

  const beforeTxCount = await prisma.transaction.count({
    where: {
      companyId: company.id,
      sourceFileName: filename,
    },
  });

  assert(beforeTxCount === 0, "transaction overwrite plan must not create Transaction");

  const nonDryRunReject = await expectReject(
    "Step118-B non-dry-run persist blocked",
    () =>
      service.commitAmazonSpApiSandboxOrdersToStaging({
        companyId: company.id,
        filename,
        preview,
        dryRun: false,
      }),
    "STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED",
  );

  const dryRun = await service.commitAmazonSpApiSandboxOrdersToStaging({
    companyId: company.id,
    filename,
    preview,
    dryRun: true,
  });

  assert(dryRun.ok === true, "dryRun ok mismatch");
  assert(dryRun.rollbackVerified === true, "dryRun rollbackVerified mismatch");

  const leakedJob = await prisma.importJob.findFirst({
    where: { filename },
    select: { id: true },
  });
  assert(!leakedJob, "transaction overwrite plan smoke leaked ImportJob");

  const leakedRows = await prisma.importStagingRow.findMany({
    where: {
      dedupeHash: {
        in: [
          ...preview.rows.map((row) => row.dedupeHash),
          ...importJobPlan.plannedStagingRows.map((row) => row.dedupeHash),
        ],
      },
    },
    select: { id: true },
    take: 10,
  });
  assert(leakedRows.length === 0, `transaction overwrite plan smoke leaked ImportStagingRow count=${leakedRows.length}`);

  const afterTxCount = await prisma.transaction.count({
    where: {
      companyId: company.id,
      sourceFileName: filename,
    },
  });
  assert(afterTxCount === 0, "transaction overwrite plan must not create Transaction after dry-run");

  const schema = read(schemaFile);
  assert(schema.includes("model Transaction"), "schema missing Transaction");
  assert(!schema.includes("TransactionOverwritePlan"), "Step118-B must not add transaction overwrite plan table");
  assert(!schema.includes("PersistencePlan"), "Step118-B must not add persistence plan table");
  assert(!schema.includes("AmazonSpApiCredential"), "Step118-B must not add credential table");
  assert(!schema.includes("AmazonSpApiToken"), "Step118-B must not add token table");
  assert(!schema.includes("CrossSourceDedupe"), "Step118-B must not add dedupe table");

  const serviceSource = read(importsServiceTs);
  assert(serviceSource.includes("STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED"), "service must still block non-dry-run");
  assert(serviceSource.includes("Only dryRun=true is allowed"), "service must still document dryRun-only");

  const controllerSource = read(importsControllerTs);
  assert(!controllerSource.includes("amazon-sp-api-sandbox-staged-transaction-overwrite-plan"), "controller must not import transaction overwrite plan");
  assert(!controllerSource.includes("previewAmazonSpApiSandboxOrders"), "controller must not expose preview method");
  assert(!controllerSource.includes("commitAmazonSpApiSandboxOrdersToStaging"), "controller must not expose commit method");

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
      const isAmazonTransactionRoute = route.includes("amazon") && route.includes("transaction");
      const isAmazonOverwriteRoute = route.includes("amazon") && route.includes("overwrite");
      if (isSpApiRoute || isAmazonSandboxRoute || isAmazonTransactionRoute || isAmazonOverwriteRoute) {
        exposedRoutes.push({
          file: path.relative(root, file),
          method: match[1],
          route: match[2],
        });
      }
    }
  }
  assert(exposedRoutes.length === 0, `controller route leak: ${JSON.stringify(exposedRoutes)}`);

  console.log("[SMOKE_OK] amazon sp-api sandbox staged Transaction overwrite plan smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        txPlan,
        rejected: [nonDryRunReject],
        dryRun: {
          rows: dryRun.rows.length,
          rollbackVerified: dryRun.rollbackVerified,
        },
        leakCheck: {
          beforeTxCount,
          afterTxCount,
          importJobLeaked: Boolean(leakedJob),
          stagingRowsLeaked: leakedRows.length,
        },
        controllerGuard: {
          scannedControllerFiles: controllerFiles.map((file) => path.relative(root, file)),
          exposedRoutes,
        },
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
