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
const { ImportsService } = require("../dist/src/imports/imports.service");

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

function extractStep122FMethodSource(serviceSource) {
  const start = serviceSource.indexOf(
    "Step122-F: Amazon SP-API sandbox ImportJob read-model dry-run service implementation",
  );
  const end = serviceSource.indexOf(
    "// Step120-E: rollback-only ImportJob / ImportStagingRow persistence simulation at service level.",
    start,
  );

  assert(start >= 0, "Step122-F method start marker missing");
  assert(end > start, "Step122-F method end marker missing");

  return serviceSource.slice(start, end);
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
            route.includes("importjob") ||
            route.includes("read-model")));

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
  const repoRoot = path.resolve(root, "..", "..");
  const srcRoot = path.resolve(root, "src");
  const webSrcRoot = path.resolve(repoRoot, "apps/web/src");

  const schemaFile = path.resolve(root, "prisma/schema.prisma");
  const packageFile = path.resolve(root, "package.json");
  const importsServiceTs = path.resolve(root, "src/imports/imports.service.ts");
  const importsControllerTs = path.resolve(root, "src/imports/imports.controller.ts");

  const serviceSource = read(importsServiceTs);
  const controllerSource = read(importsControllerTs);
  const schema = read(schemaFile);
  const pkg = JSON.parse(read(packageFile));

  assert(
    pkg.scripts["smoke:amazon-sp-api-sandbox-importjob-read-model-dry-run-service-implementation"],
    "Step122-F smoke script missing",
  );
  assert(
    pkg.scripts["smoke:amazon-sp-api-sandbox-importjob-read-model-controller-disabled-guard"],
    "Step122-G smoke script missing",
  );

  assert(
    serviceSource.includes("async ['listAmazonSpApiSandboxImportJobsReadModelDryRun']("),
    "Step122-F service implementation must remain internal/computed-name guarded",
  );
  assert(
    !serviceSource.includes("async listAmazonSpApiSandboxImportJobsReadModelDryRun("),
    "Step122-G guard requires method not to be declared as normal public method before controller policy is finalized",
  );

  const methodSource = extractStep122FMethodSource(serviceSource);

  assert(
    methodSource.includes("assertAmazonSpApiSandboxEnvironmentGate({ requireInternalSandbox: true })"),
    "Step122-F method must keep internal sandbox env gate",
  );
  assert(
    methodSource.includes("STEP122_F_READ_MODEL_DRY_RUN_REQUIRED"),
    "Step122-F method must keep dryRun=true guard",
  );
  assert(
    methodSource.includes("STEP122_F_INVALID_READ_MODEL_FILTER"),
    "Step122-F method must keep filter allowlist guard",
  );
  assert(
    methodSource.includes("STEP122_F_INVALID_READ_MODEL_SORT"),
    "Step122-F method must keep sort allowlist guard",
  );
  assert(
    methodSource.includes("STEP122_F_INVALID_READ_MODEL_PAGE_SIZE"),
    "Step122-F method must keep pageSize allowlist guard",
  );

  for (const forbidden of [
    "rawPayloadJson: true",
    "normalizedPayloadJson: true",
    "dedupeHash: true",
    "transaction.find",
    "inventoryMovement.find",
    "inventoryBalance.find",
    "transaction.create",
    "inventoryMovement.create",
    "inventoryBalance.create",
    "importJob.create",
    "importStagingRow.create",
    "importJob.update",
    "importStagingRow.update",
    "deleteMany",
    "createMany",
    "updateMany",
  ]) {
    assert(
      !methodSource.includes(forbidden),
      `Step122-F read-model method must not contain forbidden source fragment: ${forbidden}`,
    );
  }

  assert(
    methodSource.includes("sourceType: 'amazon-sp-api-sandbox'"),
    "Step122-F read-model must filter sourceType amazon-sp-api-sandbox",
  );
  assert(
    methodSource.includes("module: 'store-orders'"),
    "Step122-F read-model must filter module store-orders",
  );
  assert(
    methodSource.includes("status: 'PENDING'"),
    "Step122-F read-model must filter status PENDING",
  );

  assert(
    !controllerSource.includes("listAmazonSpApiSandboxImportJobsReadModelDryRun"),
    "imports.controller.ts must not reference Step122-F read-model service method",
  );

  const routeScan = scanControllerRoutes(root, srcRoot);
  assert(
    routeScan.exposedRoutes.length === 0,
    `controller route leak: ${JSON.stringify(routeScan.exposedRoutes)}`,
  );

  const webFiles = listFiles(webSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));
  const frontendLeaks = [];
  for (const file of webFiles) {
    const text = read(file);
    if (
      text.includes("listAmazonSpApiSandboxImportJobsReadModelDryRun") ||
      text.includes("amazon-sp-api-sandbox/importjob") ||
      text.includes("amazon-sp-api-sandbox/read-model") ||
      text.includes("sp-api-sandbox/read-model")
    ) {
      frontendLeaks.push(path.relative(repoRoot, file));
    }
  }
  assert(frontendLeaks.length === 0, `frontend leak detected: ${JSON.stringify(frontendLeaks)}`);

  for (const forbiddenModel of [
    "AmazonSpApiSandboxImportJobReadModel",
    "AmazonSpApiCredential",
    "AmazonSpApiToken",
    "CrossSourceDedupe",
  ]) {
    assert(!schema.includes(forbiddenModel), `schema must not contain ${forbiddenModel}`);
  }

  const service = new ImportsService(prisma);
  assert(
    typeof service.listAmazonSpApiSandboxImportJobsReadModelDryRun === "function",
    "Step122-F service method must remain callable internally",
  );

  const dryRunFalseRejected = await (async () => {
    try {
      await service.listAmazonSpApiSandboxImportJobsReadModelDryRun({
        filter: "all",
        sort: "createdAt_desc",
        page: 1,
        pageSize: 20,
        dryRun: false,
      });
    } catch (err) {
      const message = String((err && err.message) || err);
      assert(
        message.includes("STEP122_F_READ_MODEL_DRY_RUN_REQUIRED"),
        `dryRun=false rejected with unexpected message: ${message}`,
      );
      return true;
    }
    return false;
  })();

  assert(dryRunFalseRejected === true, "dryRun=false must be rejected before any useful read-model execution");

  console.log("[SMOKE_OK] amazon sp-api sandbox ImportJob read-model controller-disabled guard smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step122-G",
        guards: {
          serviceMethodImplemented: true,
          computedMethodName: true,
          controllerDisabled: true,
          frontendDisabled: true,
          schemaMigrationBlocked: true,
          dryRunFalseRejected,
          payloadProjectionBlocked: true,
          transactionInventoryJoinBlocked: true,
          writeOperationsBlockedInsideReadModel: true,
        },
        controllerGuard: routeScan,
        frontendGuard: {
          scannedFiles: webFiles.length,
          frontendLeaks,
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
