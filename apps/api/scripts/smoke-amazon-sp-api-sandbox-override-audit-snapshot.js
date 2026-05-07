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
  assertAmazonSpApiSandboxOverrideAuditSnapshot,
  buildAmazonSpApiSandboxOverrideAuditSnapshot,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-override-audit-snapshot.dto");
const {
  assertAmazonSpApiSandboxPermissionBoundary,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-permission-boundary.dto");
const {
  assertAmazonSpApiSandboxEnvironmentGate,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-internal-contract.dto");

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
      amazonOrderId: `SPAPI-STEP117-E-ORDER-1-${runId}`,
      purchaseDate: "2026-05-07T12:34:56Z",
      marketplaceId: "A1VC38T7YXB528",
      orderStatus: "Shipped",
      fulfillmentChannel: "AFN",
      salesChannel: "Amazon.co.jp",
      orderTotal: { currencyCode: "JPY", amount: "5980" },
      items: [
        {
          orderItemId: `SPAPI-STEP117-E-ITEM-1-${runId}`,
          sellerSku: `spapi-step117-e-sku-001-${runId}`,
          title: `Step117-E Override Audit Snapshot Product ${runId}`,
          quantityOrdered: "1",
          itemPrice: { currencyCode: "JPY", amount: "5980" },
          itemTax: { currencyCode: "JPY", amount: "598" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "480" } },
          ],
          raw: { fixture: "step117-e-item-1" },
        },
      ],
      raw: { fixture: "step117-e-order-1" },
    },
  ];
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const srcRoot = path.resolve(root, "src");
  const schemaFile = path.resolve(root, "prisma/schema.prisma");
  const importsServiceTs = path.resolve(root, "src/imports/imports.service.ts");
  const importsControllerTs = path.resolve(root, "src/imports/imports.controller.ts");

  const permission = assertAmazonSpApiSandboxPermissionBoundary();
  const gate = assertAmazonSpApiSandboxEnvironmentGate({ requireInternalSandbox: true });

  assert(permission.apiPriorityPolicy.futureSpApiDataPriority === true, "future SP-API priority must remain true");
  assert(permission.apiPriorityPolicy.currentOverwriteAllowed === false, "current overwrite must remain disabled");
  assert(permission.apiPriorityPolicy.authoritativeSourceWhenSameCanonicalOrderItem === "AMAZON_ORDER_SP_API", "SP-API authoritative source mismatch");
  assert(gate.canCallRealSpApi === false, "real SP-API must remain disabled");

  const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const orderId = `SPAPI-STEP117-E-ORDER-1-${runId}`;
  const sellerSku = `spapi-step117-e-sku-001-${runId}`;

  const existingCsvPayload = buildAmazonOrderNormalizedPayload({
    sourceType: "AMAZON_ORDER_CSV",
    importJobId: "existing-csv-import-job",
    sourceRowNo: 10,
    sourceFileName: "existing-order.csv",
    amazonOrderId: orderId,
    orderId,
    occurredAt: "2026-05-07T12:34:56Z",
    sellerSku,
    quantity: 1,
    amount: 5900,
    grossAmount: 5900,
    netAmount: 5480,
    currency: "JPY",
    feeAmount: 420,
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
    amount: 5980,
    grossAmount: 5980,
    netAmount: 5500,
    currency: "JPY",
    feeAmount: 480,
    businessMonth: "2026-05",
    raw: { source: "sp-api-authoritative" },
  });

  const snapshot = assertAmazonSpApiSandboxOverrideAuditSnapshot(
    buildAmazonSpApiSandboxOverrideAuditSnapshot({
      existingPayload: existingCsvPayload,
      spApiPayload,
      overwrittenSource: "AMAZON_ORDER_CSV",
    }),
  );

  assert(snapshot.version === "amazon-sp-api-sandbox-override-audit-snapshot-v1", "snapshot version mismatch");
  assert(snapshot.currentExecutionAllowed === false, "current execution must be blocked");
  assert(snapshot.futureExecutionRequiresApproval === true, "future execution must require approval");
  assert(snapshot.authoritativeSource === "AMAZON_ORDER_SP_API", "authoritative source mismatch");
  assert(snapshot.overwrittenSource === "AMAZON_ORDER_CSV", "overwritten source mismatch");
  assert(snapshot.overrideStatus === "BLOCKED_NOW", "override status must be BLOCKED_NOW");
  assert(snapshot.canonicalKey && snapshot.canonicalKey.includes(orderId), "canonical key missing orderId");
  assert(snapshot.beforeSnapshot.grossAmount === 5900, "before gross amount mismatch");
  assert(snapshot.afterSnapshot.grossAmount === 5980, "after gross amount mismatch");
  assert(snapshot.beforeSnapshot.quantity === 1, "before quantity mismatch");
  assert(snapshot.afterSnapshot.quantity === 2, "after quantity mismatch");
  assert(snapshot.changedFields.some((x) => x.field === "quantity" && x.severity === "critical"), "quantity critical change missing");
  assert(snapshot.changedFields.some((x) => x.field === "grossAmount" && x.severity === "critical"), "gross amount critical change missing");
  assert(snapshot.warningCodes.includes("QUANTITY_MISMATCH_REQUIRES_MANUAL_REVIEW"), "quantity warning missing");
  assert(snapshot.warningCodes.includes("AMOUNT_MISMATCH_REQUIRES_MANUAL_REVIEW"), "amount warning missing");
  assert(snapshot.warningCodes.includes("INVENTORY_COMPENSATION_PLAN_REQUIRED"), "inventory compensation warning missing");
  assert(snapshot.auditRequirements.requiresBeforeAfterSnapshot === true, "before/after snapshot requirement missing");
  assert(snapshot.auditRequirements.requiresAuditLog === true, "audit log requirement missing");
  assert(snapshot.auditRequirements.requiresNoSilentOverwrite === true, "no silent overwrite requirement missing");
  assert(snapshot.auditRequirements.requiresInventoryCompensationPlanBeforeInventoryOverwrite === true, "inventory compensation requirement missing");

  for (const [key, blocked] of Object.entries(snapshot.blockedNow)) {
    assert(blocked === true, `snapshot.blockedNow.${key} must remain true`);
  }

  const existingManualPayload = {
    ...existingCsvPayload,
    sourceType: "MANUAL_DB_EXISTING",
    grossAmount: 5980,
    amount: 5980,
    quantity: 2,
    raw: { source: "manual-existing-db" },
  };

  const manualSnapshot = assertAmazonSpApiSandboxOverrideAuditSnapshot(
    buildAmazonSpApiSandboxOverrideAuditSnapshot({
      existingPayload: existingManualPayload,
      spApiPayload,
      overwrittenSource: "MANUAL_DB_EXISTING",
    }),
  );

  assert(manualSnapshot.overwrittenSource === "MANUAL_DB_EXISTING", "manual overwritten source mismatch");
  assert(manualSnapshot.authoritativeSource === "AMAZON_ORDER_SP_API", "manual snapshot authoritative source mismatch");
  assert(manualSnapshot.currentExecutionAllowed === false, "manual snapshot execution must be blocked");

  const schema = read(schemaFile);
  assert(schema.includes("model ImportJob"), "schema missing ImportJob");
  assert(schema.includes("model ImportStagingRow"), "schema missing ImportStagingRow");
  assert(schema.includes("model Transaction"), "schema missing Transaction");
  assert(!schema.includes("AmazonSpApiOverrideAudit"), "Step117-E must not add override audit table");
  assert(!schema.includes("OverrideAuditSnapshot"), "Step117-E must not add audit snapshot table");
  assert(!schema.includes("AmazonSpApiCredential"), "Step117-E must not add credential table");
  assert(!schema.includes("AmazonSpApiToken"), "Step117-E must not add token table");
  assert(!schema.includes("CrossSourceDedupe"), "Step117-E must not add dedupe table");

  const serviceSource = read(importsServiceTs);
  assert(serviceSource.includes("STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED"), "service must still block non-dry-run");
  assert(serviceSource.includes("Only dryRun=true is allowed"), "service must still document dryRun-only");

  const controllerSource = read(importsControllerTs);
  assert(!controllerSource.includes("amazon-sp-api-sandbox-override-audit-snapshot"), "controller must not import override audit snapshot");
  assert(!controllerSource.includes("previewAmazonSpApiSandboxOrders"), "controller must not expose preview method");
  assert(!controllerSource.includes("commitAmazonSpApiSandboxOrdersToStaging"), "controller must not expose commit method");
  assert(!controllerSource.includes("override-existing-order"), "controller must not expose override permission");

  const controllerFiles = listFiles(srcRoot, (p) => p.endsWith(".controller.ts"));
  const exposedRoutes = [];
  for (const file of controllerFiles) {
    const text = read(file);
    const routeRegex = /@(Get|Post|Put|Patch|Delete)\(\s*['"`]([^'"`]*)['"`]\s*\)/gi;
    let match;
    while ((match = routeRegex.exec(text))) {
      const route = String(match[2] || "").toLowerCase();

      // Step117-E Fix1:
      // Generic platform override routes are valid existing routes.
      // Only Amazon/SP-API/sandbox-related override routes are forbidden here.
      const isSpApiRoute = route.includes("sp-api") || route.includes("spapi");
      const isAmazonSandboxRoute =
        route.includes("amazon") && route.includes("sandbox");
      const isAmazonOverrideRoute =
        route.includes("amazon") && route.includes("override");
      const isSpApiOverrideRoute =
        (route.includes("sp-api") || route.includes("spapi")) && route.includes("override");

      if (isSpApiRoute || isAmazonSandboxRoute || isAmazonOverrideRoute || isSpApiOverrideRoute) {
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
  const filename = `step117-e-override-audit-snapshot-${runId}.json`;
  const preview = await service.previewAmazonSpApiSandboxOrders({
    companyId: company.id,
    filename,
    orders: buildOrders(runId),
  });

  assert(preview.ok === true, "preview ok mismatch");
  assert(preview.rows.length === 1, "preview rows mismatch");

  const nonDryRunReject = await expectReject(
    "Step117-E non-dry-run persist blocked",
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
  assert(!leakedJob, "override audit snapshot smoke leaked ImportJob");

  const leakedRows = await prisma.importStagingRow.findMany({
    where: {
      dedupeHash: {
        in: preview.rows.map((row) => row.dedupeHash),
      },
    },
    select: { id: true },
    take: 10,
  });
  assert(leakedRows.length === 0, `override audit snapshot smoke leaked ImportStagingRow count=${leakedRows.length}`);

  console.log("[SMOKE_OK] amazon sp-api sandbox override audit snapshot smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        snapshot,
        manualSnapshot: {
          overrideStatus: manualSnapshot.overrideStatus,
          authoritativeSource: manualSnapshot.authoritativeSource,
          overwrittenSource: manualSnapshot.overwrittenSource,
          currentExecutionAllowed: manualSnapshot.currentExecutionAllowed,
        },
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
