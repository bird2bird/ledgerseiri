#!/usr/bin/env node
"use strict";

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

function expectReject(label, fn, expectedFragment) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      throw new Error(`${label} should have been rejected`);
    })
    .catch((err) => {
      const message = String((err && err.message) || err);
      if (!message.includes(expectedFragment)) {
        throw new Error(`${label} rejected with unexpected message: ${message}`);
      }
      return { label, ok: true, message };
    });
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
      amazonOrderId: `SPAPI-STEP116-G-ORDER-1-${runId}`,
      purchaseDate: "2026-05-07T12:34:56Z",
      lastUpdateDate: "2026-05-07T12:55:00Z",
      marketplaceId: "A1VC38T7YXB528",
      orderStatus: "Shipped",
      fulfillmentChannel: "AFN",
      salesChannel: "Amazon.co.jp",
      orderTotal: { currencyCode: "JPY", amount: "12980" },
      items: [
        {
          orderItemId: `SPAPI-STEP116-G-ITEM-1-${runId}`,
          sellerSku: ` spapi-step116-g-sku-001-${runId} `,
          title: `Step116-G SP-API Service Env Gate Product 1 ${runId}`,
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
          raw: { fixture: "step116-g-order-1-item-1" },
        },
        {
          orderItemId: `SPAPI-STEP116-G-ITEM-2-${runId}`,
          sellerSku: `spapi-step116-g-sku-002-${runId}`,
          title: `Step116-G SP-API Service Env Gate Product 2 ${runId}`,
          quantityOrdered: 1,
          itemPrice: { currencyCode: "JPY", amount: "5000" },
          itemTax: { currencyCode: "JPY", amount: "500" },
          shippingPrice: { currencyCode: "JPY", amount: "0" },
          shippingTax: { currencyCode: "JPY", amount: "0" },
          promotionDiscount: { currencyCode: "JPY", amount: "80" },
          promotionDiscountTax: { currencyCode: "JPY", amount: "8" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "360" } },
            { type: "FBA", amount: { currencyCode: "JPY", amount: "220" } },
          ],
          raw: { fixture: "step116-g-order-1-item-2" },
        },
      ],
      raw: { fixture: "step116-g-order-1" },
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
  const orders = buildOrders(runId);
  const filename = `step116-g-sp-api-service-env-gate-${runId}.json`;

  delete process.env.AMAZON_SP_API_SANDBOX_INTERNAL_ENABLED;
  delete process.env.AMAZON_SP_API_REAL_ENABLED;
  delete process.env.AMAZON_SP_API_OAUTH_ENABLED;
  delete process.env.AMAZON_SP_API_TOKEN_PERSISTENCE_ENABLED;

  const defaultGateReject = await expectReject(
    "preview without explicit internal env",
    () =>
      service.previewAmazonSpApiSandboxOrders({
        companyId: company.id,
        filename,
        orders,
      }),
    "AMAZON_SP_API_SANDBOX_INTERNAL_ENABLED",
  );

  const defaultCommitReject = await expectReject(
    "commit without explicit internal env",
    () =>
      service.commitAmazonSpApiSandboxOrdersToStaging({
        companyId: company.id,
        filename,
        orders,
        dryRun: true,
      }),
    "AMAZON_SP_API_SANDBOX_INTERNAL_ENABLED",
  );

  const defaultWrapperReject = await expectReject(
    "dry-run wrapper without explicit internal env",
    () =>
      service.dryRunAmazonSpApiSandboxImportBoundary({
        companyId: company.id,
        filename,
        orders,
      }),
    "AMAZON_SP_API_SANDBOX_INTERNAL_ENABLED",
  );

  process.env.AMAZON_SP_API_SANDBOX_INTERNAL_ENABLED = "true";
  process.env.AMAZON_SP_API_REAL_ENABLED = "false";
  process.env.AMAZON_SP_API_OAUTH_ENABLED = "false";
  process.env.AMAZON_SP_API_TOKEN_PERSISTENCE_ENABLED = "false";

  const gate = assertAmazonSpApiSandboxEnvironmentGate({ requireInternalSandbox: true });
  assert(gate.internalSandboxEnabled === true, "internal sandbox gate should be enabled");
  assert(gate.canPreviewSandbox === true, "canPreviewSandbox should be true");
  assert(gate.canCommitSandboxStagingDryRun === true, "canCommitSandboxStagingDryRun should be true");
  assert(gate.canCallRealSpApi === false, "canCallRealSpApi must stay false");
  assert(gate.canPersistToken === false, "canPersistToken must stay false");

  const preview = await service.previewAmazonSpApiSandboxOrders({
    companyId: company.id,
    filename,
    orders,
  });

  assert(preview.ok === true, "preview ok mismatch");
  assert(preview.rows.length === 2, `expected 2 preview rows, got ${preview.rows.length}`);
  assert(preview.summary.rows === 2, "preview summary rows mismatch");
  assert(preview.summary.normalizedSourceType === "AMAZON_ORDER_SP_API", "preview normalizedSourceType mismatch");
  assert(preview.rows[0].payload.importJobId === null, "preview payload importJobId should be null");

  const commit = await service.commitAmazonSpApiSandboxOrdersToStaging({
    companyId: company.id,
    filename,
    preview,
    dryRun: true,
  });

  assert(commit.ok === true, "commit ok mismatch");
  assert(commit.dryRun === true, "commit dryRun mismatch");
  assert(commit.rollbackVerified === true, "commit rollbackVerified mismatch");
  assert(commit.rows.length === 2, `expected 2 commit rows, got ${commit.rows.length}`);
  assert(commit.rows[0].payload.importJobId === commit.importJobId, "commit payload importJobId mismatch");

  process.env.AMAZON_SP_API_REAL_ENABLED = "true";
  const realReject = await expectReject(
    "preview with real SP-API env enabled",
    () =>
      service.previewAmazonSpApiSandboxOrders({
        companyId: company.id,
        filename: `step116-g-real-reject-${runId}.json`,
        orders,
      }),
    "AMAZON_SP_API_REAL_ENABLED",
  );
  process.env.AMAZON_SP_API_REAL_ENABLED = "false";

  process.env.AMAZON_SP_API_OAUTH_ENABLED = "true";
  const oauthReject = await expectReject(
    "preview with OAuth env enabled",
    () =>
      service.previewAmazonSpApiSandboxOrders({
        companyId: company.id,
        filename: `step116-g-oauth-reject-${runId}.json`,
        orders,
      }),
    "AMAZON_SP_API_OAUTH_ENABLED",
  );
  process.env.AMAZON_SP_API_OAUTH_ENABLED = "false";

  process.env.AMAZON_SP_API_TOKEN_PERSISTENCE_ENABLED = "true";
  const tokenReject = await expectReject(
    "preview with token persistence env enabled",
    () =>
      service.previewAmazonSpApiSandboxOrders({
        companyId: company.id,
        filename: `step116-g-token-reject-${runId}.json`,
        orders,
      }),
    "AMAZON_SP_API_TOKEN_PERSISTENCE_ENABLED",
  );
  process.env.AMAZON_SP_API_TOKEN_PERSISTENCE_ENABLED = "false";

  const leakedJob = await prisma.importJob.findFirst({
    where: { filename },
    select: { id: true },
  });
  assert(!leakedJob, "dry-run commit leaked ImportJob");

  const leakedRows = await prisma.importStagingRow.findMany({
    where: {
      dedupeHash: {
        in: preview.rows.map((row) => row.dedupeHash),
      },
    },
    select: { id: true },
    take: 10,
  });
  assert(leakedRows.length === 0, `dry-run commit leaked ImportStagingRow count=${leakedRows.length}`);

  const serviceSource = read(importsServiceTs);
  assert(
    serviceSource.includes("assertAmazonSpApiSandboxEnvironmentGate({ requireInternalSandbox: true });"),
    "ImportsService must call assertAmazonSpApiSandboxEnvironmentGate with requireInternalSandbox",
  );

  const controllerSource = read(importsControllerTs);
  assert(!controllerSource.includes("previewAmazonSpApiSandboxOrders"), "controller must not expose preview method");
  assert(!controllerSource.includes("commitAmazonSpApiSandboxOrdersToStaging"), "controller must not expose commit method");
  assert(!controllerSource.includes("dryRunAmazonSpApiSandboxImportBoundary"), "controller must not expose dry-run wrapper");

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

  console.log("[SMOKE_OK] amazon sp-api sandbox service env gate smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        runId,
        company,
        gate,
        rejected: [defaultGateReject, defaultCommitReject, defaultWrapperReject, realReject, oauthReject, tokenReject],
        preview: {
          rows: preview.rows.length,
          businessMonths: preview.summary.businessMonths,
        },
        commit: {
          rows: commit.rows.length,
          rollbackVerified: commit.rollbackVerified,
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
