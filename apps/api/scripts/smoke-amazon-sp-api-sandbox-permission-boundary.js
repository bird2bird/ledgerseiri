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
  assertAmazonSpApiSandboxPermissionBoundary,
  canAmazonSpApiSandboxRole,
  getAmazonSpApiSandboxPermissionBoundary,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-permission-boundary.dto");
const {
  assertAmazonSpApiSandboxCsvDedupeBoundary,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-csv-dedupe-boundary.dto");
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
      amazonOrderId: `SPAPI-STEP117-D-ORDER-1-${runId}`,
      purchaseDate: "2026-05-07T12:34:56Z",
      marketplaceId: "A1VC38T7YXB528",
      orderStatus: "Shipped",
      fulfillmentChannel: "AFN",
      salesChannel: "Amazon.co.jp",
      orderTotal: { currencyCode: "JPY", amount: "5980" },
      items: [
        {
          orderItemId: `SPAPI-STEP117-D-ITEM-1-${runId}`,
          sellerSku: `spapi-step117-d-sku-001-${runId}`,
          title: `Step117-D Permission Boundary Product ${runId}`,
          quantityOrdered: "1",
          itemPrice: { currencyCode: "JPY", amount: "5980" },
          itemTax: { currencyCode: "JPY", amount: "598" },
          feeBreakdown: [
            { type: "Commission", amount: { currencyCode: "JPY", amount: "480" } },
          ],
          raw: { fixture: "step117-d-item-1" },
        },
      ],
      raw: { fixture: "step117-d-order-1" },
    },
  ];
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const srcRoot = path.resolve(root, "src");
  const schemaFile = path.resolve(root, "prisma/schema.prisma");
  const importsServiceTs = path.resolve(root, "src/imports/imports.service.ts");
  const importsControllerTs = path.resolve(root, "src/imports/imports.controller.ts");

  const boundary = assertAmazonSpApiSandboxPermissionBoundary();
  const rawBoundary = getAmazonSpApiSandboxPermissionBoundary();
  const dedupe = assertAmazonSpApiSandboxCsvDedupeBoundary();
  const gate = assertAmazonSpApiSandboxEnvironmentGate({ requireInternalSandbox: true });

  assert(boundary.version === "amazon-sp-api-sandbox-permission-boundary-v1", "permission boundary version mismatch");
  assert(boundary.currentAccessPolicy.internalOnly === true, "sandbox must remain internal-only");
  assert(boundary.currentAccessPolicy.publicAccessAllowed === false, "public access must remain disabled");
  assert(boundary.currentAccessPolicy.controllerRouteAllowed === false, "controller route must remain disabled");
  assert(boundary.currentAccessPolicy.frontendRouteAllowed === false, "frontend route must remain disabled");
  assert(boundary.currentAccessPolicy.realSpApiAllowed === false, "real SP-API must remain disabled");
  assert(boundary.currentAccessPolicy.oauthAllowed === false, "OAuth must remain disabled");
  assert(boundary.currentAccessPolicy.tokenPersistenceAllowed === false, "token persistence must remain disabled");
  assert(boundary.currentAccessPolicy.nonDryRunAllowed === false, "non-dry-run must remain disabled");

  assert(dedupe.currentPolicy.crossSourcePersistAllowed === false, "dedupe persist must remain blocked");
  assert(gate.canCallRealSpApi === false, "real SP-API must remain disabled by env gate");

  assert(canAmazonSpApiSandboxRole("platform-admin", "amazon-sp-api:sandbox:read-contract") === true, "platform-admin read contract mismatch");
  assert(canAmazonSpApiSandboxRole("platform-admin", "amazon-sp-api:sandbox:preview") === true, "platform-admin preview mismatch");
  assert(
    canAmazonSpApiSandboxRole("platform-admin", "amazon-sp-api:sandbox:commit-staging-dry-run") === true,
    "platform-admin dry-run staging mismatch",
  );
  assert(
    canAmazonSpApiSandboxRole("platform-admin", "amazon-sp-api:sandbox:override-existing-order") === false,
    "platform-admin must not override existing order now",
  );

  for (const role of ["workspace-owner", "workspace-admin", "accountant", "viewer", "public-user"]) {
    assert(
      canAmazonSpApiSandboxRole(role, "amazon-sp-api:sandbox:preview") === false,
      `${role} must not preview sandbox now`,
    );
    assert(
      canAmazonSpApiSandboxRole(role, "amazon-sp-api:sandbox:commit-staging-dry-run") === false,
      `${role} must not commit staging dry-run now`,
    );
    assert(
      canAmazonSpApiSandboxRole(role, "amazon-sp-api:sandbox:override-existing-order") === false,
      `${role} must not override existing orders`,
    );
    assert(
      canAmazonSpApiSandboxRole(role, "amazon-sp-api:token:persist") === false,
      `${role} must not persist token`,
    );
  }

  assert(boundary.apiPriorityPolicy.futureSpApiDataPriority === true, "future SP-API priority must be explicit");
  assert(boundary.apiPriorityPolicy.currentOverwriteAllowed === false, "current overwrite must remain disabled");
  assert(
    boundary.apiPriorityPolicy.futureOverwriteExistingOrderAllowedAfterApproval === true,
    "future overwrite-after-approval policy missing",
  );
  assert(
    boundary.apiPriorityPolicy.authoritativeSourceWhenSameCanonicalOrderItem === "AMAZON_ORDER_SP_API",
    "SP-API must be authoritative future source",
  );
  assert(
    boundary.apiPriorityPolicy.lowerPrioritySources.includes("AMAZON_ORDER_CSV"),
    "CSV must be lower priority than SP-API",
  );
  assert(
    boundary.apiPriorityPolicy.lowerPrioritySources.includes("MANUAL_DB_EXISTING"),
    "existing DB order must be lower priority than SP-API",
  );
  assert(
    boundary.apiPriorityPolicy.conflictResolution === "SP_API_OVERWRITES_EXISTING_ORDER_AFTER_EXPLICIT_PERMISSION_AND_AUDIT",
    "conflict resolution policy mismatch",
  );
  assert(boundary.apiPriorityPolicy.requiresCanonicalDedupeKey === true, "overwrite must require canonical key");
  assert(boundary.apiPriorityPolicy.requiresBeforeAfterSnapshot === true, "overwrite must require before/after snapshot");
  assert(boundary.apiPriorityPolicy.requiresAuditLog === true, "overwrite must require audit log");
  assert(boundary.apiPriorityPolicy.requiresNoSilentOverwrite === true, "overwrite must never be silent");
  assert(
    boundary.apiPriorityPolicy.requiresInventoryCompensationPlanBeforeInventoryOverwrite === true,
    "inventory compensation plan must be required before inventory overwrite",
  );

  for (const [key, blocked] of Object.entries(boundary.blockedNow)) {
    assert(blocked === true, `blockedNow.${key} must remain true`);
  }

  const schema = read(schemaFile);
  assert(schema.includes("model ImportJob"), "schema missing ImportJob");
  assert(schema.includes("model ImportStagingRow"), "schema missing ImportStagingRow");
  assert(schema.includes("model Transaction"), "schema missing Transaction");
  assert(!schema.includes("AmazonSpApiCredential"), "Step117-D must not add credential table");
  assert(!schema.includes("AmazonSpApiToken"), "Step117-D must not add token table");
  assert(!schema.includes("CrossSourceDedupe"), "Step117-D must not add dedupe table");
  assert(!schema.includes("PREVIEWED"), "Step117-D must not add PREVIEWED");
  assert(!schema.includes("STAGED"), "Step117-D must not add STAGED");
  assert(!schema.includes("COMMITTED"), "Step117-D must not add COMMITTED");

  const serviceSource = read(importsServiceTs);
  assert(serviceSource.includes("STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED"), "service must still block non-dry-run");
  assert(serviceSource.includes("Only dryRun=true is allowed"), "service must still document dryRun-only");

  const controllerSource = read(importsControllerTs);
  assert(!controllerSource.includes("amazon-sp-api-sandbox-permission-boundary"), "controller must not import permission boundary");
  assert(!controllerSource.includes("previewAmazonSpApiSandboxOrders"), "controller must not expose preview method");
  assert(!controllerSource.includes("commitAmazonSpApiSandboxOrdersToStaging"), "controller must not expose commit method");
  assert(!controllerSource.includes("amazon-sp-api:sandbox"), "controller must not expose sandbox permissions");

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
  const filename = `step117-d-permission-boundary-${runId}.json`;
  const preview = await service.previewAmazonSpApiSandboxOrders({
    companyId: company.id,
    filename,
    orders: buildOrders(runId),
  });

  assert(preview.ok === true, "preview ok mismatch");
  assert(preview.rows.length === 1, "preview rows mismatch");

  const nonDryRunReject = await expectReject(
    "Step117-D non-dry-run persist blocked",
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
  assert(!leakedJob, "permission boundary smoke leaked ImportJob");

  const leakedRows = await prisma.importStagingRow.findMany({
    where: {
      dedupeHash: {
        in: preview.rows.map((row) => row.dedupeHash),
      },
    },
    select: { id: true },
    take: 10,
  });
  assert(leakedRows.length === 0, `permission boundary smoke leaked ImportStagingRow count=${leakedRows.length}`);

  console.log("[SMOKE_OK] amazon sp-api sandbox permission boundary smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        boundary: rawBoundary,
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
