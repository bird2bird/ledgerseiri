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
  assertAmazonSpApiSandboxLifecycleDecision,
  getAmazonSpApiSandboxLifecycleDecision,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-lifecycle-decision.dto");
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
      amazonOrderId: `SPAPI-STEP117-A-ORDER-1-${runId}`,
      purchaseDate: "2026-05-07T12:34:56Z",
      marketplaceId: "A1VC38T7YXB528",
      orderStatus: "Shipped",
      fulfillmentChannel: "AFN",
      salesChannel: "Amazon.co.jp",
      orderTotal: { currencyCode: "JPY", amount: "3980" },
      items: [
        {
          orderItemId: `SPAPI-STEP117-A-ITEM-1-${runId}`,
          sellerSku: `spapi-step117-a-sku-001-${runId}`,
          title: `Step117-A Lifecycle Decision Product ${runId}`,
          quantityOrdered: "1",
          itemPrice: { currencyCode: "JPY", amount: "3980" },
          itemTax: { currencyCode: "JPY", amount: "398" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "300" } },
          ],
          raw: { fixture: "step117-a-item-1" },
        },
      ],
      raw: { fixture: "step117-a-order-1" },
    },
  ];
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const srcRoot = path.resolve(root, "src");
  const schemaFile = path.resolve(root, "prisma/schema.prisma");
  const importsServiceTs = path.resolve(root, "src/imports/imports.service.ts");
  const importsControllerTs = path.resolve(root, "src/imports/imports.controller.ts");

  const decision = assertAmazonSpApiSandboxLifecycleDecision();
  const rawDecision = getAmazonSpApiSandboxLifecycleDecision();

  assert(decision.version === "amazon-sp-api-sandbox-lifecycle-decision-v1", "decision version mismatch");
  assert(rawDecision.sourceType === "amazon-sp-api-sandbox", "sourceType mismatch");
  assert(rawDecision.normalizedSourceType === "AMAZON_ORDER_SP_API", "normalizedSourceType mismatch");
  assert(rawDecision.module === "store-orders", "module mismatch");

  assert(decision.importJobLifecycle.previewCreatesImportJob === false, "preview must not create ImportJob");
  assert(decision.importJobLifecycle.dryRunCreatesImportJobInsideRollback === true, "dry-run rollback ImportJob policy mismatch");
  assert(decision.importJobLifecycle.persistImportJobAllowed === false, "ImportJob persistence must be blocked");
  assert(decision.importJobLifecycle.persistImportStagingRowsAllowed === false, "ImportStagingRow persistence must be blocked");
  assert(decision.importJobLifecycle.commitTransactionAllowed === false, "Transaction commit must be blocked");
  assert(decision.importJobLifecycle.inventoryDeductionAllowed === false, "inventory deduction must be blocked");
  assert(decision.persistencePolicy.dryRunOnly === true, "dryRunOnly mismatch");
  assert(
    decision.persistencePolicy.nonDryRunBlockedCode === "STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED",
    "non-dry-run blocked code mismatch",
  );

  const gate = assertAmazonSpApiSandboxEnvironmentGate({ requireInternalSandbox: true });
  assert(gate.internalSandboxEnabled === true, "internal sandbox gate should be enabled");
  assert(gate.canCallRealSpApi === false, "real SP-API must stay disabled");
  assert(gate.canPersistToken === false, "token persistence must stay disabled");

  const schema = read(schemaFile);
  assert(schema.includes("enum JobStatus"), "schema must contain JobStatus");
  assert(schema.includes("PENDING"), "schema JobStatus missing PENDING");
  assert(schema.includes("PROCESSING"), "schema JobStatus missing PROCESSING");
  assert(schema.includes("SUCCEEDED"), "schema JobStatus missing SUCCEEDED");
  assert(schema.includes("FAILED"), "schema JobStatus missing FAILED");
  assert(!schema.includes("PREVIEWED"), "schema must not add PREVIEWED in Step117-A");
  assert(!schema.includes("STAGED"), "schema must not add STAGED in Step117-A");
  assert(!schema.includes("COMMITTED"), "schema must not add COMMITTED in Step117-A");

  const serviceSource = read(importsServiceTs);
  assert(
    serviceSource.includes("STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED"),
    "service must still block non-dry-run staging commit",
  );
  assert(
    serviceSource.includes("Only dryRun=true is allowed"),
    "service must document dryRun-only policy",
  );

  const controllerSource = read(importsControllerTs);
  assert(!controllerSource.includes("previewAmazonSpApiSandboxOrders"), "controller must not expose preview method");
  assert(!controllerSource.includes("commitAmazonSpApiSandboxOrdersToStaging"), "controller must not expose commit method");
  assert(!controllerSource.includes("amazon-sp-api-sandbox-lifecycle-decision"), "controller must not import lifecycle decision");

  const controllerFiles = listFiles(srcRoot, (p) => p.endsWith(".controller.ts"));
  const exposedRoutes = [];
  for (const file of controllerFiles) {
    const text = read(file);
    const routeRegex = /@(Get|Post|Put|Patch|Delete)\(\s*['"`]([^'"`]*(sp-api|sandbox)[^'"`]*)['"`]\s*\)/gi;
    let match;
    while ((match = routeRegex.exec(text))) {
      const route = String(match[2] || "").toLowerCase();
      if (route.includes("sp-api") || (route.includes("sandbox") && route.includes("amazon"))) {
        exposedRoutes.push({
          file: path.relative(root, file),
          method: match[1],
          route: match[2],
        });
      }
    }
  }
  assert(exposedRoutes.length === 0, `controller route leak: ${JSON.stringify(exposedRoutes)}`);

  const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const company = await resolveCompanyId();
  const service = new ImportsService(prisma);
  const filename = `step117-a-lifecycle-decision-${runId}.json`;
  const orders = buildOrders(runId);

  const preview = await service.previewAmazonSpApiSandboxOrders({
    companyId: company.id,
    filename,
    orders,
  });

  assert(preview.ok === true, "preview ok mismatch");
  assert(preview.rows.length === 1, "preview rows mismatch");

  const persistedPreviewJob = await prisma.importJob.findFirst({
    where: { filename },
    select: { id: true },
  });
  assert(!persistedPreviewJob, "preview must not persist ImportJob");

  const nonDryRunReject = await expectReject(
    "Step117-A non-dry-run persist blocked",
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
  assert(!leakedJob, "dry-run lifecycle smoke leaked ImportJob");

  const leakedRows = await prisma.importStagingRow.findMany({
    where: {
      dedupeHash: {
        in: preview.rows.map((row) => row.dedupeHash),
      },
    },
    select: { id: true },
    take: 10,
  });
  assert(leakedRows.length === 0, `dry-run lifecycle smoke leaked ImportStagingRow count=${leakedRows.length}`);

  console.log("[SMOKE_OK] amazon sp-api sandbox lifecycle decision smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        decision,
        company,
        preview: {
          rows: preview.rows.length,
          importJobPersisted: Boolean(persistedPreviewJob),
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
