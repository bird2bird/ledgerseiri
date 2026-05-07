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
      amazonOrderId: `SPAPI-STEP118-A-ORDER-1-${runId}`,
      purchaseDate: "2026-05-07T12:34:56Z",
      marketplaceId: "A1VC38T7YXB528",
      orderStatus: "Shipped",
      fulfillmentChannel: "AFN",
      salesChannel: "Amazon.co.jp",
      orderTotal: { currencyCode: "JPY", amount: "7980" },
      items: [
        {
          orderItemId: `SPAPI-STEP118-A-ITEM-1-${runId}`,
          sellerSku: `spapi-step118-a-sku-001-${runId}`,
          title: `Step118-A Staged Persistence Plan Product ${runId}`,
          quantityOrdered: "2",
          itemPrice: { currencyCode: "JPY", amount: "7980" },
          itemTax: { currencyCode: "JPY", amount: "798" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "640" } },
          ],
          raw: { fixture: "step118-a-item-1" },
        },
      ],
      raw: { fixture: "step118-a-order-1" },
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
  const filename = `step118-a-staged-importjob-plan-${runId}.json`;

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
    amount: 7900,
    grossAmount: 7900,
    netAmount: 7300,
    currency: "JPY",
    feeAmount: 600,
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

  const plan = assertAmazonSpApiSandboxStagedImportJobPersistencePlan(
    buildAmazonSpApiSandboxStagedImportJobPersistencePlan({
      companyId: company.id,
      filename,
      previewRows: preview.rows,
      preflightChecklist,
      overrideAuditSnapshots: [snapshot],
    }),
  );

  assert(plan.version === "amazon-sp-api-sandbox-staged-importjob-persistence-plan-v1", "plan version mismatch");
  assert(plan.planOnly === true, "planOnly mismatch");
  assert(plan.writesDatabase === false, "writesDatabase must be false");
  assert(plan.currentExecutionAllowed === false, "currentExecutionAllowed must be false");
  assert(plan.futureExecutionRequiresPreflight === true, "future preflight requirement mismatch");
  assert(plan.companyId === company.id, "plan companyId mismatch");
  assert(plan.filename === filename, "plan filename mismatch");

  assert(plan.plannedImportJob.companyId === company.id, "planned ImportJob companyId mismatch");
  assert(plan.plannedImportJob.domain === "store-orders", "planned ImportJob domain mismatch");
  assert(plan.plannedImportJob.module === "store-orders", "planned ImportJob module mismatch");
  assert(plan.plannedImportJob.sourceType === "amazon-sp-api-sandbox", "planned ImportJob sourceType mismatch");
  assert(plan.plannedImportJob.status === "PENDING", "planned ImportJob status mismatch");
  assert(plan.plannedImportJob.totalRows === 1, "planned ImportJob totalRows mismatch");
  assert(plan.plannedImportJob.successRows === 0, "planned ImportJob successRows mismatch");
  assert(plan.plannedImportJob.failedRows === 0, "planned ImportJob failedRows mismatch");
  assert(plan.plannedImportJob.importedAt === null, "planned ImportJob importedAt must be null");
  assert(plan.plannedImportJob.dryRunOnly === true, "planned ImportJob dryRunOnly mismatch");
  assert(plan.plannedImportJob.persistenceExecutionAllowed === false, "planned ImportJob persistenceExecutionAllowed mismatch");
  assert(plan.plannedImportJob.fileMonthsJson.includes("2026-05"), "planned ImportJob fileMonthsJson missing month");

  assert(plan.plannedStagingRows.length === 1, "planned staging rows length mismatch");
  const plannedRow = plan.plannedStagingRows[0];
  assert(plannedRow.module === "store-orders", "planned row module mismatch");
  assert(plannedRow.matchStatus === "conflict_review_required", "planned row matchStatus mismatch");
  assert(plannedRow.matchReason === "STEP118_A_SP_API_SANDBOX_STAGED_PLAN_CONFLICT_REVIEW", "planned row matchReason mismatch");
  assert(plannedRow.canonicalDedupeKey, "planned row canonical key missing");
  assert(plannedRow.normalizedPayloadJson.step118PlanOnly === true, "planned normalized payload should be plan-only");
  assert(plannedRow.rawPayloadJson.step118PlanOnly === true, "planned raw payload should be plan-only");
  assert(plannedRow.overrideAuditSnapshot, "planned row should attach audit snapshot for review only");
  assert(plan.warnings.includes("OVERRIDE_AUDIT_SNAPSHOT_ATTACHED_FOR_REVIEW_ONLY"), "plan warning missing audit snapshot review marker");

  for (const [key, blocked] of Object.entries(plan.blockedNow)) {
    assert(blocked === true, `plan.blockedNow.${key} must remain true`);
  }

  const beforeJobCount = await prisma.importJob.count({
    where: { filename },
  });
  const beforeRowsCount = await prisma.importStagingRow.count({
    where: {
      dedupeHash: {
        in: plan.plannedStagingRows.map((row) => row.dedupeHash),
      },
    },
  });

  assert(beforeJobCount === 0, "planned ImportJob should not exist before dry-run");
  assert(beforeRowsCount === 0, "planned staging rows should not exist before dry-run");

  const nonDryRunReject = await expectReject(
    "Step118-A non-dry-run persist blocked",
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
  assert(!leakedJob, "staged persistence plan smoke leaked ImportJob");

  const leakedRows = await prisma.importStagingRow.findMany({
    where: {
      dedupeHash: {
        in: [
          ...preview.rows.map((row) => row.dedupeHash),
          ...plan.plannedStagingRows.map((row) => row.dedupeHash),
        ],
      },
    },
    select: { id: true },
    take: 10,
  });
  assert(leakedRows.length === 0, `staged persistence plan smoke leaked ImportStagingRow count=${leakedRows.length}`);

  const schema = read(schemaFile);
  assert(schema.includes("model ImportJob"), "schema missing ImportJob");
  assert(schema.includes("model ImportStagingRow"), "schema missing ImportStagingRow");
  assert(schema.includes("model Transaction"), "schema missing Transaction");
  assert(!schema.includes("PersistencePlan"), "Step118-A must not add persistence plan table");
  assert(!schema.includes("PersistencePreflight"), "Step118-A must not add preflight table");
  assert(!schema.includes("AmazonSpApiCredential"), "Step118-A must not add credential table");
  assert(!schema.includes("AmazonSpApiToken"), "Step118-A must not add token table");
  assert(!schema.includes("CrossSourceDedupe"), "Step118-A must not add dedupe table");

  const serviceSource = read(importsServiceTs);
  assert(serviceSource.includes("STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED"), "service must still block non-dry-run");
  assert(serviceSource.includes("Only dryRun=true is allowed"), "service must still document dryRun-only");

  const controllerSource = read(importsControllerTs);
  assert(!controllerSource.includes("amazon-sp-api-sandbox-staged-importjob-persistence-plan"), "controller must not import staged persistence plan");
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
      const isAmazonPersistenceRoute = route.includes("amazon") && route.includes("persistence");
      const isAmazonStagedRoute = route.includes("amazon") && route.includes("staged");
      if (isSpApiRoute || isAmazonSandboxRoute || isAmazonPersistenceRoute || isAmazonStagedRoute) {
        exposedRoutes.push({
          file: path.relative(root, file),
          method: match[1],
          route: match[2],
        });
      }
    }
  }
  assert(exposedRoutes.length === 0, `controller route leak: ${JSON.stringify(exposedRoutes)}`);

  console.log("[SMOKE_OK] amazon sp-api sandbox staged ImportJob persistence plan smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        plan,
        rejected: [nonDryRunReject],
        dryRun: {
          rows: dryRun.rows.length,
          rollbackVerified: dryRun.rollbackVerified,
        },
        leakCheck: {
          beforeJobCount,
          beforeRowsCount,
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
