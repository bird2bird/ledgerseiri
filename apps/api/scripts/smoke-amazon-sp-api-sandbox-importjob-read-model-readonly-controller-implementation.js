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
const { ImportsController } = require("../dist/src/imports/imports.controller");
const { ImportsService } = require("../dist/src/imports/imports.service");
const {
  buildAmazonSpApiSandboxImportJobReadModelReadonlyControllerImplementationContract,
  assertAmazonSpApiSandboxImportJobReadModelReadonlyControllerImplementationContract,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-importjob-read-model-readonly-controller-implementation.dto");

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

async function resolveCompany() {
  const company = await prisma.company.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });
  if (!company) throw new Error("No company found for Step122-O smoke");
  return company;
}

async function cleanupByFilename(filename) {
  const jobs = await prisma.importJob.findMany({
    where: { filename },
    select: { id: true },
  });
  const ids = jobs.map((job) => job.id);
  if (ids.length) {
    await prisma.importStagingRow.deleteMany({
      where: {
        importJobId: {
          in: ids,
        },
      },
    });
  }
  await prisma.importJob.deleteMany({
    where: { filename },
  });
}

function extractStep122ORouteSource(controllerSource) {
  const start = controllerSource.indexOf(
    "Step122-O: Amazon SP-API sandbox ImportJob read-model readonly controller service-call implementation.",
  );
  const end = controllerSource.indexOf("@Post('detect-month-conflicts')", start);
  assert(start >= 0, "Step122-O route marker missing");
  assert(end > start, "Step122-O route end anchor missing");
  return controllerSource.slice(start, end);
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(root, "..", "..");
  const srcRoot = path.resolve(root, "src");
  const webSrcRoot = path.resolve(repoRoot, "apps/web/src");

  const packageFile = path.resolve(root, "package.json");
  const schemaFile = path.resolve(root, "prisma/schema.prisma");
  const serviceFile = path.resolve(root, "src/imports/imports.service.ts");
  const controllerFile = path.resolve(root, "src/imports/imports.controller.ts");

  const pkg = JSON.parse(read(packageFile));
  const schema = read(schemaFile);
  const serviceSource = read(serviceFile);
  const controllerSource = read(controllerFile);

  assert(
    pkg.scripts["smoke:amazon-sp-api-sandbox-importjob-read-model-readonly-controller-implementation"],
    "Step122-O smoke script missing",
  );

  const contract = assertAmazonSpApiSandboxImportJobReadModelReadonlyControllerImplementationContract(
    buildAmazonSpApiSandboxImportJobReadModelReadonlyControllerImplementationContract(),
  );

  assert(contract.implementedNow === true, "Step122-O contract must mark implementation active");
  assert(contract.readonlyOnly === true, "Step122-O must remain readonly");
  assert(contract.frontendExposedNow === false, "frontend must remain disabled");
  assert(contract.writesDatabase === false, "writes must remain disabled");

  const routeSource = extractStep122ORouteSource(controllerSource);

  assert(routeSource.includes("@Get('internal/amazon-sp-api-sandbox/import-jobs/read-model')"), "readonly GET route missing");
  assert(routeSource.includes("assertAmazonSpApiSandboxEnvironmentGate({ requireInternalSandbox: true })"), "env gate missing");
  assert(routeSource.includes("normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery(query)"), "query normalization missing");
  assert(routeSource.includes("this.service['listAmazonSpApiSandboxImportJobsReadModelDryRun']"), "service call missing");
  assert(routeSource.includes("dryRun: true"), "controller must preserve dryRun=true");
  assert(!routeSource.includes("STEP122_K_CONTROLLER_BLOCKED_ROUTE_NOT_OPEN"), "blocked error must be removed in Step122-O");

  for (const forbidden of [
    "rawPayloadJson",
    "normalizedPayloadJson",
    "dedupeHash",
    "transaction.find",
    "inventoryMovement.find",
    "inventoryBalance.find",
    "transaction.create",
    "inventoryMovement.create",
    "inventoryBalance.create",
    "importJob.create",
    "importStagingRow.create",
    "deleteMany",
    "createMany",
    "updateMany",
  ]) {
    assert(!routeSource.includes(forbidden), `Step122-O route must not contain forbidden fragment: ${forbidden}`);
  }

  assert(serviceSource.includes("async ['listAmazonSpApiSandboxImportJobsReadModelDryRun']("), "service method missing");
  assert(!serviceSource.includes("async listAmazonSpApiSandboxImportJobsReadModelDryRun("), "service method must remain computed-name guarded");

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

  const readModelRoutes = exposedRoutes.filter(
    (route) => String(route.route || "") === "internal/amazon-sp-api-sandbox/import-jobs/read-model",
  );
  const unexpectedRoutes = exposedRoutes.filter(
    (route) => String(route.route || "") !== "internal/amazon-sp-api-sandbox/import-jobs/read-model",
  );

  assert(readModelRoutes.length === 1, `expected exactly one readonly read-model route, got ${JSON.stringify(readModelRoutes)}`);
  assert(readModelRoutes[0].method === "Get", "readonly read-model route must be GET");
  assert(unexpectedRoutes.length === 0, `unexpected SP-API routes: ${JSON.stringify(unexpectedRoutes)}`);

  const webFiles = listFiles(webSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));
  const frontendLeaks = [];
  for (const file of webFiles) {
    const text = read(file);
    if (
      text.includes("/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model") ||
      text.includes("STEP122_K_CONTROLLER_BLOCKED_ROUTE_NOT_OPEN")
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

  const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const filename = `step122-o-readonly-controller-${runId}.json`;
  const company = await resolveCompany();

  await cleanupByFilename(filename);

  const txBefore = await prisma.transaction.count({
    where: {
      companyId: company.id,
      sourceFileName: filename,
    },
  });
  const movementBefore = await prisma.inventoryMovement.count({
    where: {
      companyId: company.id,
      sourceId: {
        contains: `STEP122-O-${runId}`,
      },
    },
  });

  let importJob = null;

  try {
    importJob = await prisma.importJob.create({
      data: {
        companyId: company.id,
        domain: "store-orders",
        module: "store-orders",
        sourceType: "amazon-sp-api-sandbox",
        filename,
        status: "PENDING",
        totalRows: 1,
        successRows: 0,
        failedRows: 0,
        importedAt: null,
      },
      select: {
        id: true,
        filename: true,
      },
    });

    await prisma.importStagingRow.create({
      data: {
        importJob: { connect: { id: importJob.id } },
        company: { connect: { id: company.id } },
        module: "store-orders",
        rowNo: 1,
        businessMonth: "2026-05",
        matchStatus: "new",
        matchReason: "STEP122_O_READONLY_CONTROLLER_FIXTURE",
        dedupeHash: `STEP122-O-${runId}-1`,
        rawPayloadJson: { mustNotBeProjected: true },
        normalizedPayloadJson: {
          mustNotBeProjected: true,
          contractVersion: "amazon-order-normalized-v1",
          sourceType: "AMAZON_ORDER_SP_API",
          module: "store-orders",
        },
      },
    });

    const controller = new ImportsController(new ImportsService(prisma));
    const result = await controller.amazonSpApiSandboxImportJobReadModelEnvGatedBlockedRoute({
      filter: "amazon-sp-api-sandbox",
      sort: "createdAt_desc",
      page: 1,
      pageSize: 20,
      dryRun: true,
    });

    assert(result.dryRun === true, "controller result dryRun mismatch");
    assert(result.displayOnly === true, "controller result displayOnly mismatch");
    assert(result.sourceType === "amazon-sp-api-sandbox", "controller result sourceType mismatch");

    const row = result.rows.find((item) => item.id === importJob.id);
    assert(row, "controller readonly result did not include fixture ImportJob");
    assert(row.filename === filename, "fixture filename mismatch");
    assert(row.stagingRows === 1, "fixture stagingRows mismatch");
    assert(row.allowedActions.viewOnly === true, "viewOnly must be true");
    assert(row.allowedActions.commitSales === false, "commitSales must remain false");
    assert(row.allowedActions.executeInventory === false, "executeInventory must remain false");
    assert(row.allowedActions.realSpApi === false, "realSpApi must remain false");
    assert(row.allowedActions.oauth === false, "oauth must remain false");

    for (const forbidden of [
      "rawPayloadJson",
      "normalizedPayloadJson",
      "dedupeHash",
      "companyId",
      "conflictMonthsJson",
      "fileMonthsJson",
    ]) {
      assert(!Object.prototype.hasOwnProperty.call(row, forbidden), `projected row must not include ${forbidden}`);
    }

    const txAfter = await prisma.transaction.count({
      where: {
        companyId: company.id,
        sourceFileName: filename,
      },
    });
    const movementAfter = await prisma.inventoryMovement.count({
      where: {
        companyId: company.id,
        sourceId: {
          contains: `STEP122-O-${runId}`,
        },
      },
    });

    assert(txBefore === txAfter, "readonly controller must not write Transaction rows");
    assert(movementBefore === movementAfter, "readonly controller must not write InventoryMovement rows");

    console.log("[SMOKE_OK] amazon sp-api sandbox ImportJob read-model readonly controller implementation smoke passed");
    console.log(
      JSON.stringify(
        {
          ok: true,
          step: "Step122-O",
          route: {
            method: "GET",
            path: "api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model",
            serviceCalled: true,
            dryRun: result.dryRun,
            displayOnly: result.displayOnly,
            frontendExposed: false,
            writesDatabase: false,
          },
          fixture: {
            importJobId: importJob.id,
            filename,
            stagingRows: row.stagingRows,
            classification: row.classification,
            displayStatus: row.displayStatus,
          },
          leakCheck: {
            transactionBefore: txBefore,
            transactionAfter: txAfter,
            inventoryMovementBefore: movementBefore,
            inventoryMovementAfter: movementAfter,
          },
          projectionGuard: {
            rawPayloadJsonProjected: Object.prototype.hasOwnProperty.call(row, "rawPayloadJson"),
            normalizedPayloadJsonProjected: Object.prototype.hasOwnProperty.call(row, "normalizedPayloadJson"),
            dedupeHashProjected: Object.prototype.hasOwnProperty.call(row, "dedupeHash"),
            companyIdProjected: Object.prototype.hasOwnProperty.call(row, "companyId"),
          },
          controllerGuard: {
            exposedRoutes,
            readModelRoutes,
            unexpectedRoutes,
          },
        },
        null,
        2,
      ),
    );
  } finally {
    await cleanupByFilename(filename);
  }
}

main()
  .catch((err) => {
    console.error("[SMOKE_ERROR]", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
