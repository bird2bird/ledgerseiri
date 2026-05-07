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
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-lifecycle-decision.dto");
const {
  assertAmazonSpApiSandboxImportCenterVisibilityPolicy,
  getAmazonSpApiSandboxImportCenterVisibilityPolicy,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-import-center-visibility-policy.dto");
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
      amazonOrderId: `SPAPI-STEP117-B-ORDER-1-${runId}`,
      purchaseDate: "2026-05-07T12:34:56Z",
      marketplaceId: "A1VC38T7YXB528",
      orderStatus: "Shipped",
      fulfillmentChannel: "AFN",
      salesChannel: "Amazon.co.jp",
      orderTotal: { currencyCode: "JPY", amount: "4980" },
      items: [
        {
          orderItemId: `SPAPI-STEP117-B-ITEM-1-${runId}`,
          sellerSku: `spapi-step117-b-sku-001-${runId}`,
          title: `Step117-B Import Center Visibility Product ${runId}`,
          quantityOrdered: "1",
          itemPrice: { currencyCode: "JPY", amount: "4980" },
          itemTax: { currencyCode: "JPY", amount: "498" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "390" } },
          ],
          raw: { fixture: "step117-b-item-1" },
        },
      ],
      raw: { fixture: "step117-b-order-1" },
    },
  ];
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const srcRoot = path.resolve(root, "src");
  const schemaFile = path.resolve(root, "prisma/schema.prisma");
  const importsServiceTs = path.resolve(root, "src/imports/imports.service.ts");
  const importsControllerTs = path.resolve(root, "src/imports/imports.controller.ts");

  const lifecycle = assertAmazonSpApiSandboxLifecycleDecision();
  const policy = assertAmazonSpApiSandboxImportCenterVisibilityPolicy();
  const rawPolicy = getAmazonSpApiSandboxImportCenterVisibilityPolicy();

  assert(policy.version === "amazon-sp-api-sandbox-import-center-visibility-policy-v1", "policy version mismatch");
  assert(policy.sourceType === "amazon-sp-api-sandbox", "sourceType mismatch");
  assert(policy.normalizedSourceType === "AMAZON_ORDER_SP_API", "normalizedSourceType mismatch");
  assert(policy.module === "store-orders", "module mismatch");

  assert(lifecycle.persistencePolicy.dryRunOnly === true, "lifecycle dryRunOnly mismatch");
  assert(lifecycle.importJobLifecycle.persistImportJobAllowed === false, "lifecycle persistImportJobAllowed mismatch");

  assert(policy.currentVisibility.importCenterListVisible === false, "Import Center list must remain hidden");
  assert(policy.currentVisibility.importCenterDetailVisible === false, "Import Center detail must remain hidden");
  assert(policy.currentVisibility.internalSmokeOnly === true, "policy must remain internal smoke only");
  assert(policy.currentVisibility.frontendNavigationAllowed === false, "frontend navigation must remain disabled");
  assert(policy.currentVisibility.controllerRouteAllowed === false, "controller route must remain disabled");

  assert(policy.futureVisibilityIfPersistenceIsApproved.visibilityLevel === "internal-only", "future visibility level mismatch");
  assert(policy.futureVisibilityIfPersistenceIsApproved.listLabel === "Amazon SP-API Sandbox", "future list label mismatch");
  assert(policy.futureVisibilityIfPersistenceIsApproved.sourceTypeFilterValue === "amazon-sp-api-sandbox", "future sourceType filter mismatch");
  assert(policy.futureVisibilityIfPersistenceIsApproved.moduleFilterValue === "store-orders", "future module filter mismatch");
  assert(
    policy.futureVisibilityIfPersistenceIsApproved.statusStrategy === "reuse-existing-JobStatus-with-sandbox-badges",
    "future status strategy mismatch",
  );
  assert(
    policy.futureVisibilityIfPersistenceIsApproved.badges.includes("DRY_RUN_ONLY"),
    "future badges must include DRY_RUN_ONLY",
  );
  assert(
    policy.futureVisibilityIfPersistenceIsApproved.badges.includes("NO_TRANSACTION_COMMIT"),
    "future badges must include NO_TRANSACTION_COMMIT",
  );

  assert(policy.detailDrawerPolicy.allowOpenDrawer === false, "drawer must remain disabled now");
  assert(policy.detailDrawerPolicy.futureAllowReadonlyDrawer === true, "future readonly drawer should be allowed by policy only");
  assert(policy.detailDrawerPolicy.showTransactionLink === false, "transaction link must be disabled");
  assert(policy.detailDrawerPolicy.showInventoryMovementLink === false, "inventory movement link must be disabled");

  for (const [action, allowed] of Object.entries(policy.actionPolicy)) {
    assert(allowed === false, `action must remain disabled: ${action}`);
  }

  assert(policy.routePolicy.apiRouteAllowed === false, "API route must remain disabled");
  assert(policy.routePolicy.frontendRouteAllowed === false, "frontend route must remain disabled");
  assert(policy.routePolicy.importCenterQueryParamAllowed === false, "Import Center query params must remain disabled");
  assert(policy.routePolicy.blockedQueryKeysNow.includes("spApiSandbox"), "blockedQueryKeysNow missing spApiSandbox");
  assert(policy.routePolicy.blockedQueryKeysNow.includes("amazonSpApiSandbox"), "blockedQueryKeysNow missing amazonSpApiSandbox");

  assert(
    policy.persistenceDependency.requiresLifecycleDecision === "amazon-sp-api-sandbox-lifecycle-decision-v1",
    "lifecycle dependency mismatch",
  );
  assert(policy.persistenceDependency.requiresImportJobPersistenceDecision === true, "ImportJob persistence dependency mismatch");
  assert(policy.persistenceDependency.requiresPermissionDecision === true, "permission dependency mismatch");
  assert(policy.persistenceDependency.requiresDedupeDecisionAgainstCsv === true, "dedupe dependency mismatch");
  assert(policy.persistenceDependency.requiresControllerContractDecision === true, "controller contract dependency mismatch");

  const gate = assertAmazonSpApiSandboxEnvironmentGate({ requireInternalSandbox: true });
  assert(gate.internalSandboxEnabled === true, "internal sandbox gate should be enabled");
  assert(gate.canCallRealSpApi === false, "real SP-API must stay disabled");
  assert(gate.canPersistToken === false, "token persistence must stay disabled");

  const schema = read(schemaFile);
  assert(schema.includes("model ImportJob"), "schema missing ImportJob");
  assert(schema.includes("model ImportStagingRow"), "schema missing ImportStagingRow");
  assert(schema.includes("enum JobStatus"), "schema missing JobStatus");
  assert(!schema.includes("PREVIEWED"), "Step117-B must not add PREVIEWED");
  assert(!schema.includes("STAGED"), "Step117-B must not add STAGED");
  assert(!schema.includes("COMMITTED"), "Step117-B must not add COMMITTED");

  const serviceSource = read(importsServiceTs);
  assert(serviceSource.includes("STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED"), "service must still block non-dry-run");
  assert(serviceSource.includes("Only dryRun=true is allowed"), "service must still document dryRun-only");

  const controllerSource = read(importsControllerTs);
  assert(!controllerSource.includes("amazon-sp-api-sandbox-import-center-visibility-policy"), "controller must not import visibility policy");
  assert(!controllerSource.includes("previewAmazonSpApiSandboxOrders"), "controller must not expose preview method");
  assert(!controllerSource.includes("commitAmazonSpApiSandboxOrdersToStaging"), "controller must not expose commit method");
  assert(!controllerSource.includes("spApiSandbox"), "controller must not expose spApiSandbox query");
  assert(!controllerSource.includes("amazonSpApiSandbox"), "controller must not expose amazonSpApiSandbox query");

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
  const filename = `step117-b-visibility-policy-${runId}.json`;
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
  assert(!persistedPreviewJob, "preview must not persist ImportJob or appear in Import Center");

  const nonDryRunReject = await expectReject(
    "Step117-B non-dry-run persist blocked",
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
  assert(!leakedJob, "dry-run visibility smoke leaked ImportJob");

  const leakedRows = await prisma.importStagingRow.findMany({
    where: {
      dedupeHash: {
        in: preview.rows.map((row) => row.dedupeHash),
      },
    },
    select: { id: true },
    take: 10,
  });
  assert(leakedRows.length === 0, `dry-run visibility smoke leaked ImportStagingRow count=${leakedRows.length}`);

  console.log("[SMOKE_OK] amazon sp-api sandbox import center visibility policy smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        policy: rawPolicy,
        preview: {
          rows: preview.rows.length,
          importJobPersisted: Boolean(persistedPreviewJob),
          importCenterVisible: policy.currentVisibility.importCenterListVisible,
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
