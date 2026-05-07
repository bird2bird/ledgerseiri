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
      amazonOrderId: `SPAPI-STEP117-F-ORDER-1-${runId}`,
      purchaseDate: "2026-05-07T12:34:56Z",
      marketplaceId: "A1VC38T7YXB528",
      orderStatus: "Shipped",
      fulfillmentChannel: "AFN",
      salesChannel: "Amazon.co.jp",
      orderTotal: { currencyCode: "JPY", amount: "6980" },
      items: [
        {
          orderItemId: `SPAPI-STEP117-F-ITEM-1-${runId}`,
          sellerSku: `spapi-step117-f-sku-001-${runId}`,
          title: `Step117-F Persistence Preflight Product ${runId}`,
          quantityOrdered: "1",
          itemPrice: { currencyCode: "JPY", amount: "6980" },
          itemTax: { currencyCode: "JPY", amount: "698" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "560" } },
          ],
          raw: { fixture: "step117-f-item-1" },
        },
      ],
      raw: { fixture: "step117-f-order-1" },
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
  const orderId = `SPAPI-STEP117-F-ORDER-1-${runId}`;
  const sellerSku = `spapi-step117-f-sku-001-${runId}`;

  const existingPayload = buildAmazonOrderNormalizedPayload({
    sourceType: "AMAZON_ORDER_CSV",
    importJobId: "existing-csv-import-job",
    sourceRowNo: 10,
    sourceFileName: "existing-order.csv",
    amazonOrderId: orderId,
    orderId,
    occurredAt: "2026-05-07T12:34:56Z",
    sellerSku,
    quantity: 1,
    amount: 6900,
    grossAmount: 6900,
    netAmount: 6400,
    currency: "JPY",
    feeAmount: 500,
    businessMonth: "2026-05",
    rawTransactionType: "注文",
    raw: { source: "csv-existing" },
  });

  const spApiPayload = buildAmazonOrderNormalizedPayload({
    sourceType: "AMAZON_ORDER_SP_API",
    importJobId: null,
    sourceRowNo: null,
    sourceFileName: null,
    amazonOrderId: orderId,
    orderId,
    occurredAt: "2026-05-07T12:34:56Z",
    sellerSku,
    quantity: 2,
    amount: 6980,
    grossAmount: 6980,
    netAmount: 6420,
    currency: "JPY",
    feeAmount: 560,
    businessMonth: "2026-05",
    raw: { source: "sp-api-authoritative" },
  });

  const snapshot = assertAmazonSpApiSandboxOverrideAuditSnapshot(
    buildAmazonSpApiSandboxOverrideAuditSnapshot({
      existingPayload,
      spApiPayload,
      overwrittenSource: "AMAZON_ORDER_CSV",
    }),
  );

  const emptyChecklist = assertAmazonSpApiSandboxPersistencePreflightChecklist(
    buildAmazonSpApiSandboxPersistencePreflightChecklist({ auditSnapshot: snapshot }),
  );

  assert(emptyChecklist.version === "amazon-sp-api-sandbox-persistence-preflight-checklist-v1", "checklist version mismatch");
  assert(emptyChecklist.currentPersistenceAllowed === false, "persistence must remain blocked");
  assert(emptyChecklist.currentOverwriteAllowed === false, "overwrite must remain blocked");
  assert(emptyChecklist.currentDryRunOnly === true, "dryRunOnly must remain true");
  assert(emptyChecklist.futureIntent.spApiDataPriority === true, "SP-API priority missing");
  assert(emptyChecklist.futureIntent.authoritativeSource === "AMAZON_ORDER_SP_API", "authoritative source mismatch");
  assert(emptyChecklist.futureIntent.lowerPrioritySources.includes("AMAZON_ORDER_CSV"), "CSV lower priority missing");
  assert(emptyChecklist.futureIntent.lowerPrioritySources.includes("MANUAL_DB_EXISTING"), "manual DB lower priority missing");
  assert(emptyChecklist.summary.totalRequired >= 10, "preflight item count too small");
  assert(emptyChecklist.summary.blocking > 0, "empty checklist should have blocking items");
  assert(emptyChecklist.summary.readyForPersistence === false, "readyForPersistence must remain false");
  assert(emptyChecklist.summary.readyForOverwrite === false, "readyForOverwrite must remain false");

  const requiredKeys = new Set(emptyChecklist.preflightItems.map((item) => item.key));
  for (const key of [
    "canonical-dedupe-key-confirmed",
    "before-after-audit-snapshot-generated",
    "amount-quantity-diff-manual-review-completed",
    "inventory-compensation-plan-approved",
    "importjob-persistence-strategy-approved",
    "transaction-overwrite-strategy-approved",
    "permission-boundary-approved",
    "rollback-plan-approved",
    "controller-route-contract-approved",
    "token-oauth-security-model-approved",
    "import-center-visibility-approved",
    "csv-cross-source-dedupe-approved",
    "no-silent-overwrite-confirmed",
    "real-sp-api-client-contract-approved",
    "production-feature-flag-approved",
  ]) {
    assert(requiredKeys.has(key), `missing preflight key: ${key}`);
  }

  for (const [key, blocked] of Object.entries(emptyChecklist.hardBlocksNow)) {
    assert(blocked === true, `hardBlocksNow.${key} must remain true`);
  }

  const fullApprovalKeys = {};
  for (const item of emptyChecklist.preflightItems) {
    fullApprovalKeys[item.key] = true;
  }

  const approvedChecklist = assertAmazonSpApiSandboxPersistencePreflightChecklist(
    buildAmazonSpApiSandboxPersistencePreflightChecklist({
      auditSnapshot: snapshot,
      approvals: fullApprovalKeys,
    }),
  );

  assert(approvedChecklist.summary.satisfied === approvedChecklist.summary.totalRequired, "all explicit approvals should satisfy all items");
  assert(approvedChecklist.summary.blocking === 0, "approved checklist should have zero item-level blocking");
  assert(approvedChecklist.summary.readyForPersistence === false, "even approved checklist must not enable persistence now");
  assert(approvedChecklist.summary.readyForOverwrite === false, "even approved checklist must not enable overwrite now");
  assert(approvedChecklist.currentPersistenceAllowed === false, "approved checklist must still block persistence");
  assert(approvedChecklist.currentOverwriteAllowed === false, "approved checklist must still block overwrite");

  const schema = read(schemaFile);
  assert(schema.includes("model ImportJob"), "schema missing ImportJob");
  assert(schema.includes("model ImportStagingRow"), "schema missing ImportStagingRow");
  assert(schema.includes("model Transaction"), "schema missing Transaction");
  assert(!schema.includes("PersistencePreflight"), "Step117-F must not add preflight table");
  assert(!schema.includes("AmazonSpApiOverrideAudit"), "Step117-F must not add override audit table");
  assert(!schema.includes("OverrideAuditSnapshot"), "Step117-F must not add audit snapshot table");
  assert(!schema.includes("AmazonSpApiCredential"), "Step117-F must not add credential table");
  assert(!schema.includes("AmazonSpApiToken"), "Step117-F must not add token table");
  assert(!schema.includes("CrossSourceDedupe"), "Step117-F must not add dedupe table");

  const serviceSource = read(importsServiceTs);
  assert(serviceSource.includes("STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED"), "service must still block non-dry-run");
  assert(serviceSource.includes("Only dryRun=true is allowed"), "service must still document dryRun-only");

  const controllerSource = read(importsControllerTs);
  assert(!controllerSource.includes("amazon-sp-api-sandbox-persistence-preflight-checklist"), "controller must not import preflight checklist");
  assert(!controllerSource.includes("previewAmazonSpApiSandboxOrders"), "controller must not expose preview method");
  assert(!controllerSource.includes("commitAmazonSpApiSandboxOrdersToStaging"), "controller must not expose commit method");
  assert(!controllerSource.includes("production-feature-flag-approved"), "controller must not expose production preflight approval");

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
      const isAmazonOverrideRoute = route.includes("amazon") && route.includes("override");
      const isAmazonPreflightRoute = route.includes("amazon") && route.includes("preflight");
      if (isSpApiRoute || isAmazonSandboxRoute || isAmazonOverrideRoute || isAmazonPreflightRoute) {
        exposedRoutes.push({
          file: path.relative(root, file),
          method: match[1],
          route: match[2],
        });
      }
    }
  }
  assert(exposedRoutes.length === 0, `controller route leak: ${JSON.stringify(exposedRoutes)}`);

  const company = await resolveCompanyId();
  const service = new ImportsService(prisma);
  const filename = `step117-f-persistence-preflight-${runId}.json`;
  const preview = await service.previewAmazonSpApiSandboxOrders({
    companyId: company.id,
    filename,
    orders: buildOrders(runId),
  });

  assert(preview.ok === true, "preview ok mismatch");
  assert(preview.rows.length === 1, "preview rows mismatch");

  const nonDryRunReject = await expectReject(
    "Step117-F non-dry-run persist blocked",
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
  assert(!leakedJob, "persistence preflight smoke leaked ImportJob");

  const leakedRows = await prisma.importStagingRow.findMany({
    where: {
      dedupeHash: {
        in: preview.rows.map((row) => row.dedupeHash),
      },
    },
    select: { id: true },
    take: 10,
  });
  assert(leakedRows.length === 0, `persistence preflight smoke leaked ImportStagingRow count=${leakedRows.length}`);

  console.log("[SMOKE_OK] amazon sp-api sandbox persistence preflight checklist smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        emptyChecklist,
        approvedChecklistSummary: approvedChecklist.summary,
        preview: {
          rows: preview.rows.length,
        },
        rejected: [nonDryRunReject],
        dryRun: {
          rows: dryRun.rows.length,
          rollbackVerified: dryRun.rollbackVerified,
        },
        leakCheck: {
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
