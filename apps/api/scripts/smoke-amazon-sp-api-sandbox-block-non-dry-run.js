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
      amazonOrderId: `SPAPI-STEP116-H-ORDER-1-${runId}`,
      purchaseDate: "2026-05-07T12:34:56Z",
      marketplaceId: "A1VC38T7YXB528",
      orderStatus: "Shipped",
      fulfillmentChannel: "AFN",
      salesChannel: "Amazon.co.jp",
      orderTotal: { currencyCode: "JPY", amount: "7980" },
      items: [
        {
          orderItemId: `SPAPI-STEP116-H-ITEM-1-${runId}`,
          sellerSku: `spapi-step116-h-sku-001-${runId}`,
          title: `Step116-H SP-API Non Dry Run Block Product ${runId}`,
          quantityOrdered: "2",
          itemPrice: { currencyCode: "JPY", amount: "7980" },
          itemTax: { currencyCode: "JPY", amount: "798" },
          shippingPrice: { currencyCode: "JPY", amount: "300" },
          shippingTax: { currencyCode: "JPY", amount: "30" },
          promotionDiscount: { currencyCode: "JPY", amount: "120" },
          promotionDiscountTax: { currencyCode: "JPY", amount: "12" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "600" } },
            { type: "FBA", amount: { currencyCode: "JPY", amount: "450" } },
          ],
          raw: { fixture: "step116-h-item-1" },
        },
      ],
      raw: { fixture: "step116-h-order-1" },
    },
  ];
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const srcRoot = path.resolve(root, "src");
  const importsServiceTs = path.resolve(root, "src/imports/imports.service.ts");
  const importsControllerTs = path.resolve(root, "src/imports/imports.controller.ts");

  const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const company = await resolveCompanyId();
  const service = new ImportsService(prisma);
  const filename = `step116-h-non-dry-run-block-${runId}.json`;
  const orders = buildOrders(runId);

  const gate = assertAmazonSpApiSandboxEnvironmentGate({ requireInternalSandbox: true });
  assert(gate.internalSandboxEnabled === true, "internal sandbox gate should be enabled");
  assert(gate.canCallRealSpApi === false, "real SP-API must stay disabled");
  assert(gate.canPersistToken === false, "token persistence must stay disabled");

  const preview = await service.previewAmazonSpApiSandboxOrders({
    companyId: company.id,
    filename,
    orders,
  });

  assert(preview.ok === true, "preview ok mismatch");
  assert(preview.rows.length === 1, `expected 1 preview row, got ${preview.rows.length}`);
  assert(preview.rows[0].payload.importJobId === null, "preview importJobId should be null");

  const rejectedWithPreview = await expectReject(
    "commit dryRun=false with preview",
    () =>
      service.commitAmazonSpApiSandboxOrdersToStaging({
        companyId: company.id,
        filename,
        preview,
        dryRun: false,
      }),
    "STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED",
  );

  const rejectedWithOrders = await expectReject(
    "commit dryRun=false with orders",
    () =>
      service.commitAmazonSpApiSandboxOrdersToStaging({
        companyId: company.id,
        filename: `step116-h-non-dry-run-orders-${runId}.json`,
        orders,
        dryRun: false,
      }),
    "STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED",
  );

  const dryRunResult = await service.commitAmazonSpApiSandboxOrdersToStaging({
    companyId: company.id,
    filename,
    preview,
    dryRun: true,
  });

  assert(dryRunResult.ok === true, "dryRunResult ok mismatch");
  assert(dryRunResult.dryRun === true, "dryRunResult dryRun mismatch");
  assert(dryRunResult.rollbackVerified === true, "dryRunResult rollbackVerified mismatch");
  assert(dryRunResult.rows.length === 1, "dryRunResult rows mismatch");

  const leakedJob = await prisma.importJob.findFirst({
    where: { filename },
    select: { id: true },
  });
  assert(!leakedJob, "blocked/dry-run smoke leaked ImportJob");

  const leakedRows = await prisma.importStagingRow.findMany({
    where: {
      dedupeHash: {
        in: preview.rows.map((row) => row.dedupeHash),
      },
    },
    select: { id: true, dedupeHash: true },
    take: 10,
  });
  assert(leakedRows.length === 0, `blocked/dry-run smoke leaked ImportStagingRow count=${leakedRows.length}`);

  const serviceSource = read(importsServiceTs);
  assert(
    serviceSource.includes("STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED"),
    "ImportsService must contain Step116-H non-dry-run block",
  );
  assert(
    serviceSource.includes("Only dryRun=true is allowed"),
    "ImportsService must document dryRun-only policy",
  );

  const controllerSource = read(importsControllerTs);
  assert(!controllerSource.includes("previewAmazonSpApiSandboxOrders"), "controller must not expose preview method");
  assert(!controllerSource.includes("commitAmazonSpApiSandboxOrdersToStaging"), "controller must not expose commit method");

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

  console.log("[SMOKE_OK] amazon sp-api sandbox non-dry-run staging commit block smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        runId,
        company,
        gate,
        rejected: [rejectedWithPreview, rejectedWithOrders],
        dryRunResult: {
          rows: dryRunResult.rows.length,
          rollbackVerified: dryRunResult.rollbackVerified,
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
