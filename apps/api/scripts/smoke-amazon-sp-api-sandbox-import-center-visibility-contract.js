#!/usr/bin/env node
"use strict";

process.env.AMAZON_SP_API_SANDBOX_INTERNAL_ENABLED = "true";
process.env.AMAZON_SP_API_REAL_ENABLED = "false";
process.env.AMAZON_SP_API_OAUTH_ENABLED = "false";
process.env.AMAZON_SP_API_TOKEN_PERSISTENCE_ENABLED = "false";
process.env.AMAZON_SP_API_SANDBOX_IMPORTJOB_PERSISTENCE_ENABLED = "false";

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const {
  buildAmazonSpApiSandboxImportCenterVisibilityContract,
  assertAmazonSpApiSandboxImportCenterVisibilityContract,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-import-center-visibility-contract.dto");

const prisma = new PrismaClient();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function listFiles(dir, predicate, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) listFiles(p, predicate, acc);
    else if (predicate(p)) acc.push(p);
  }
  return acc;
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
      const suspicious =
        route.includes("sp-api") ||
        route.includes("spapi") ||
        (route.includes("amazon") &&
          (route.includes("sandbox") ||
            route.includes("permanent") ||
            route.includes("persist") ||
            route.includes("importjob")));
      if (suspicious) {
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

  const serviceSource = read(importsServiceTs);
  const controllerSource = read(importsControllerTs);
  const schema = read(schemaFile);

  assert(serviceSource.includes("persistAmazonSpApiSandboxImportJobOnly"), "Step122-A requires Step121-E service method");
  assert(serviceSource.includes("STEP121_E_IMPORTJOB_PERSISTENCE_ENV_DISABLED"), "env-disabled guard missing");
  assert(serviceSource.includes("STEP121_E_DUPLICATE_IMPORTJOB_FILENAME"), "duplicate filename guard missing");
  assert(serviceSource.includes("STEP121_E_DUPLICATE_STAGING_DEDUPE_HASH"), "duplicate dedupe guard missing");

  assert(!controllerSource.includes("persistAmazonSpApiSandboxImportJobOnly"), "controller must not expose permanent service method");
  assert(!controllerSource.includes("rollbackOnlyPersistAmazonSpApiSandboxImportJob"), "controller must not expose rollback service method");
  assert(!controllerSource.includes("planAmazonSpApiSandboxImportAggregate"), "controller must not expose aggregate method");

  const routeScan = scanControllerRoutes(root, srcRoot);
  assert(routeScan.exposedRoutes.length === 0, `controller route leak: ${JSON.stringify(routeScan.exposedRoutes)}`);

  assert(schema.includes("model ImportJob"), "schema missing ImportJob");
  assert(schema.includes("model ImportStagingRow"), "schema missing ImportStagingRow");
  assert(schema.includes("model Transaction"), "schema missing Transaction");
  assert(schema.includes("model InventoryMovement"), "schema missing InventoryMovement");
  assert(!schema.includes("AmazonSpApiSandboxImportCenterVisibility"), "Step122-A must not add visibility table");
  assert(!schema.includes("AmazonSpApiCredential"), "Step122-A must not add credential table");
  assert(!schema.includes("AmazonSpApiToken"), "Step122-A must not add token table");
  assert(!schema.includes("CrossSourceDedupe"), "Step122-A must not add dedupe table");

  const contract = assertAmazonSpApiSandboxImportCenterVisibilityContract(
    buildAmazonSpApiSandboxImportCenterVisibilityContract(),
  );

  assert(contract.decision === "VISIBLE_AS_PENDING_REVIEW_ONLY", "visibility decision mismatch");
  assert(contract.contractOnly === true, "contractOnly mismatch");
  assert(contract.writesDatabase === false, "writesDatabase must be false");
  assert(contract.controllerExposed === false, "controller must remain disabled");
  assert(contract.frontendExposed === false, "frontend must remain disabled");

  assert(contract.importJobVisibility.visibleInImportCenterEventually === true, "eventual visibility should be true");
  assert(contract.importJobVisibility.visibleNowThroughController === false, "controller visibility must be false now");
  assert(contract.importJobVisibility.displayLifecycle === "pending-review", "display lifecycle mismatch");
  assert(contract.importJobVisibility.displayStatus === "PENDING", "display status mismatch");
  assert(contract.importJobVisibility.mustNotDisplayAsCommittedSales === true, "must not display as committed sales");
  assert(contract.importJobVisibility.mustNotDisplayAsInventoryExecuted === true, "must not display as inventory executed");

  assert(contract.importJobRequirements.sourceType === "amazon-sp-api-sandbox", "sourceType mismatch");
  assert(contract.importJobRequirements.module === "store-orders", "module mismatch");
  assert(contract.importJobRequirements.status === "PENDING", "status mismatch");
  assert(contract.importJobRequirements.successRows === 0, "successRows must be 0");
  assert(contract.importJobRequirements.failedRows === 0, "failedRows must be 0");
  assert(contract.importJobRequirements.importedAt === null, "importedAt must be null");

  assert(contract.stagingRowRequirements.targetEntityId === null, "targetEntityId must be null");
  assert(contract.stagingRowRequirements.mustRemainUncommitted === true, "staging row must remain uncommitted");
  assert(contract.stagingRowRequirements.mustNotCreateTransaction === true, "must not create transaction");
  assert(contract.stagingRowRequirements.mustNotCreateInventoryMovement === true, "must not create inventory movement");

  assert(contract.allowedImportCenterActionsEventually.viewImportJob === true, "eventual view ImportJob should be true");
  assert(contract.allowedImportCenterActionsEventually.viewStagingRows === true, "eventual view staging rows should be true");
  assert(contract.allowedImportCenterActionsEventually.commitSales === false, "commit sales must remain false");
  assert(contract.allowedImportCenterActionsEventually.executeInventory === false, "execute inventory must remain false");
  assert(contract.allowedImportCenterActionsEventually.overwriteTransactions === false, "overwrite transactions must remain false");
  assert(contract.allowedImportCenterActionsEventually.connectRealSpApi === false, "connect real SP-API must remain false");
  assert(contract.allowedImportCenterActionsEventually.startOAuth === false, "OAuth must remain false");

  for (const badge of ["SP-API sandbox", "Pending review", "Not committed", "Inventory not executed"]) {
    assert(contract.requiredBadges.includes(badge), `required badge missing: ${badge}`);
  }

  for (const [key, blocked] of Object.entries(contract.blockedNow)) {
    assert(blocked === true, `contract.blockedNow.${key} must remain true`);
  }

  const leakedVisibilityRows = await prisma.importJob.findMany({
    where: {
      filename: {
        contains: "step122-a-import-center-visibility",
      },
    },
    select: { id: true, filename: true },
    take: 10,
  });
  assert(leakedVisibilityRows.length === 0, `Step122-A contract smoke must not create ImportJob rows count=${leakedVisibilityRows.length}`);

  const leakedTxCount = await prisma.transaction.count({
    where: {
      sourceFileName: {
        contains: "step122-a-import-center-visibility",
      },
    },
  });
  assert(leakedTxCount === 0, "Step122-A contract smoke must not create Transaction rows");

  console.log("[SMOKE_OK] amazon sp-api sandbox import center visibility contract smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        contract: {
          version: contract.version,
          decision: contract.decision,
          contractOnly: contract.contractOnly,
          writesDatabase: contract.writesDatabase,
          importJobVisibility: contract.importJobVisibility,
          importJobRequirements: contract.importJobRequirements,
          stagingRowRequirements: contract.stagingRowRequirements,
          allowedImportCenterActionsEventually: contract.allowedImportCenterActionsEventually,
          requiredBadges: contract.requiredBadges,
          summary: contract.summary,
        },
        leakCheck: {
          importJobRows: leakedVisibilityRows.length,
          transactionRows: leakedTxCount,
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
