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

async function resolveCompany() {
  const company = await prisma.company.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });
  if (!company) throw new Error("No company found for Step122-F smoke");
  return company;
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

async function main() {
  const root = path.resolve(__dirname, "..");
  const srcRoot = path.resolve(root, "src");
  const schemaFile = path.resolve(root, "prisma/schema.prisma");
  const importsServiceTs = path.resolve(root, "src/imports/imports.service.ts");
  const importsControllerTs = path.resolve(root, "src/imports/imports.controller.ts");

  const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const filename = `step122-f-read-model-dry-run-${runId}.json`;
  const company = await resolveCompany();
  const service = new ImportsService(prisma);

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
        contains: `STEP122-F-${runId}`,
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
        totalRows: 2,
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
        importJob: {
          connect: { id: importJob.id },
        },
        company: {
          connect: { id: company.id },
        },
        module: "store-orders",
        rowNo: 1,
        businessMonth: "2026-05",
        matchStatus: "new",
        matchReason: "STEP122_F_READ_MODEL_FIXTURE_UNCOMMITTED",
        dedupeHash: `STEP122-F-${runId}-1`,
        rawPayloadJson: {
          mustNotBeProjected: true,
          fixture: "step122-f-raw",
        },
        normalizedPayloadJson: {
          mustNotBeProjected: true,
          contractVersion: "amazon-order-normalized-v1",
          sourceType: "AMAZON_ORDER_SP_API",
          module: "store-orders",
          fixture: "step122-f-normalized",
        },
      },
    });

    await prisma.importStagingRow.create({
      data: {
        importJob: {
          connect: { id: importJob.id },
        },
        company: {
          connect: { id: company.id },
        },
        module: "store-orders",
        rowNo: 2,
        businessMonth: "2026-05",
        matchStatus: "new",
        matchReason: "STEP122_F_READ_MODEL_FIXTURE_UNCOMMITTED",
        dedupeHash: `STEP122-F-${runId}-2`,
        rawPayloadJson: {
          mustNotBeProjected: true,
          fixture: "step122-f-raw-2",
        },
        normalizedPayloadJson: {
          mustNotBeProjected: true,
          contractVersion: "amazon-order-normalized-v1",
          sourceType: "AMAZON_ORDER_SP_API",
          module: "store-orders",
          fixture: "step122-f-normalized-2",
        },
      },
    });

    assert(
      typeof service.listAmazonSpApiSandboxImportJobsReadModelDryRun === "function",
      "Step122-F service method is not callable",
    );

    const result = await service.listAmazonSpApiSandboxImportJobsReadModelDryRun({
      companyId: company.id,
      filter: "amazon-sp-api-sandbox",
      sort: "createdAt_desc",
      page: 1,
      pageSize: 20,
      dryRun: true,
    });

    assert(result.dryRun === true, "result dryRun mismatch");
    assert(result.sourceType === "amazon-sp-api-sandbox", "result sourceType mismatch");
    assert(result.displayOnly === true, "result displayOnly mismatch");
    assert(result.page === 1, "result page mismatch");
    assert(result.pageSize === 20, "result pageSize mismatch");
    assert(result.totalRows >= 1, "result totalRows should include fixture");

    const fixtureRow = result.rows.find((row) => row.id === importJob.id);
    assert(fixtureRow, "fixture ImportJob was not returned");
    assert(fixtureRow.filename === filename, "fixture filename mismatch");
    assert(fixtureRow.sourceType === "amazon-sp-api-sandbox", "fixture sourceType mismatch");
    assert(fixtureRow.module === "store-orders", "fixture module mismatch");
    assert(fixtureRow.status === "PENDING", "fixture status mismatch");
    assert(fixtureRow.totalRows === 2, "fixture totalRows mismatch");
    assert(fixtureRow.stagingRows === 2, "fixture stagingRows mismatch");
    assert(
      fixtureRow.classification === "AMAZON_SP_API_SANDBOX_UNCOMMITTED_STAGING",
      `fixture classification mismatch: ${fixtureRow.classification}`,
    );
    assert(fixtureRow.displayLifecycle === "pending-review", "fixture displayLifecycle mismatch");
    assert(fixtureRow.displayStatus === "PENDING", "fixture displayStatus mismatch");

    assert(fixtureRow.allowedActions.viewOnly === true, "viewOnly must be true");
    assert(fixtureRow.allowedActions.commitSales === false, "commitSales must remain false");
    assert(fixtureRow.allowedActions.executeInventory === false, "executeInventory must remain false");
    assert(fixtureRow.allowedActions.overwriteTransactions === false, "overwriteTransactions must remain false");
    assert(fixtureRow.allowedActions.realSpApi === false, "realSpApi must remain false");
    assert(fixtureRow.allowedActions.oauth === false, "oauth must remain false");

    assert(!Object.prototype.hasOwnProperty.call(fixtureRow, "rawPayloadJson"), "rawPayloadJson must not be projected");
    assert(!Object.prototype.hasOwnProperty.call(fixtureRow, "normalizedPayloadJson"), "normalizedPayloadJson must not be projected");
    assert(!Object.prototype.hasOwnProperty.call(fixtureRow, "dedupeHash"), "dedupeHash must not be projected");
    assert(!Object.prototype.hasOwnProperty.call(fixtureRow, "companyId"), "companyId must not be projected");
    assert(!Object.prototype.hasOwnProperty.call(fixtureRow, "conflictMonthsJson"), "conflictMonthsJson must not be projected");
    assert(!Object.prototype.hasOwnProperty.call(fixtureRow, "fileMonthsJson"), "fileMonthsJson must not be projected");

    const stagingOnly = await service.listAmazonSpApiSandboxImportJobsReadModelDryRun({
      companyId: company.id,
      filter: "uncommitted-staging",
      sort: "filename_asc",
      page: 1,
      pageSize: 20,
      dryRun: true,
    });
    assert(
      stagingOnly.rows.some((row) => row.id === importJob.id),
      "fixture should appear in uncommitted-staging filter",
    );

    const invalidPageSizeReject = await expectReject(
      "Step122-F invalid pageSize",
      () =>
        service.listAmazonSpApiSandboxImportJobsReadModelDryRun({
          companyId: company.id,
          filter: "all",
          sort: "createdAt_desc",
          page: 1,
          pageSize: 10,
          dryRun: true,
        }),
      "STEP122_F_INVALID_READ_MODEL_PAGE_SIZE",
    );

    const dryRunFalseReject = await expectReject(
      "Step122-F dryRun false",
      () =>
        service.listAmazonSpApiSandboxImportJobsReadModelDryRun({
          companyId: company.id,
          filter: "all",
          sort: "createdAt_desc",
          page: 1,
          pageSize: 20,
          dryRun: false,
        }),
      "STEP122_F_READ_MODEL_DRY_RUN_REQUIRED",
    );

    const invalidFilterReject = await expectReject(
      "Step122-F invalid filter",
      () =>
        service.listAmazonSpApiSandboxImportJobsReadModelDryRun({
          companyId: company.id,
          filter: "committed-sales",
          sort: "createdAt_desc",
          page: 1,
          pageSize: 20,
          dryRun: true,
        }),
      "STEP122_F_INVALID_READ_MODEL_FILTER",
    );

    const invalidSortReject = await expectReject(
      "Step122-F invalid sort",
      () =>
        service.listAmazonSpApiSandboxImportJobsReadModelDryRun({
          companyId: company.id,
          filter: "all",
          sort: "committedSales_desc",
          page: 1,
          pageSize: 20,
          dryRun: true,
        }),
      "STEP122_F_INVALID_READ_MODEL_SORT",
    );

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
          contains: `STEP122-F-${runId}`,
        },
      },
    });

    assert(txBefore === txAfter, "Step122-F read-model must not write Transaction rows");
    assert(movementBefore === movementAfter, "Step122-F read-model must not write InventoryMovement rows");

    const reloadedStagingRows = await prisma.importStagingRow.findMany({
      where: {
        importJobId: importJob.id,
      },
      select: {
        id: true,
        dedupeHash: true,
        rawPayloadJson: true,
        normalizedPayloadJson: true,
      },
    });
    assert(reloadedStagingRows.length === 2, "fixture staging rows should remain unchanged before cleanup");

    const serviceSource = read(importsServiceTs);
    assert(serviceSource.includes("Step122-F: Amazon SP-API sandbox ImportJob read-model dry-run service implementation"), "Step122-F marker missing");
    assert(serviceSource.includes("STEP122_F_READ_MODEL_DRY_RUN_REQUIRED"), "dryRun guard missing");
    assert(serviceSource.includes("STEP122_F_INVALID_READ_MODEL_PAGE_SIZE"), "pageSize guard missing");

    const step122FStart = serviceSource.indexOf("Step122-F: Amazon SP-API sandbox ImportJob read-model dry-run service implementation");
    const step122FEnd = serviceSource.indexOf("// Step120-E: rollback-only ImportJob / ImportStagingRow persistence simulation at service level.", step122FStart);
    assert(step122FStart >= 0, "Step122-F method start marker missing");
    assert(step122FEnd > step122FStart, "Step122-F method end marker missing");

    const step122FMethodSource = serviceSource.slice(step122FStart, step122FEnd);
    assert(!step122FMethodSource.includes("rawPayloadJson: true"), "Step122-F read model must not select rawPayloadJson");
    assert(!step122FMethodSource.includes("normalizedPayloadJson: true"), "Step122-F read model must not select normalizedPayloadJson");
    assert(!step122FMethodSource.includes("dedupeHash: true"), "Step122-F read model must not select dedupeHash");
    assert(!step122FMethodSource.includes("transaction.find"), "Step122-F read model must not query Transaction");
    assert(!step122FMethodSource.includes("inventoryMovement.find"), "Step122-F read model must not query InventoryMovement");
    assert(!step122FMethodSource.includes("inventoryBalance.find"), "Step122-F read model must not query InventoryBalance");

    const controllerSource = read(importsControllerTs);
    assert(!controllerSource.includes("listAmazonSpApiSandboxImportJobsReadModelDryRun"), "controller must not expose read-model service method");

    const schema = read(schemaFile);
    assert(!schema.includes("AmazonSpApiSandboxImportJobReadModel"), "Step122-F must not add read-model table");
    assert(!schema.includes("AmazonSpApiCredential"), "Step122-F must not add credential table");
    assert(!schema.includes("AmazonSpApiToken"), "Step122-F must not add token table");
    assert(!schema.includes("CrossSourceDedupe"), "Step122-F must not add dedupe table");

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
    assert(exposedRoutes.length === 0, `controller route leak: ${JSON.stringify(exposedRoutes)}`);

    console.log("[SMOKE_OK] amazon sp-api sandbox ImportJob read-model dry-run service implementation smoke passed");
    console.log(
      JSON.stringify(
        {
          ok: true,
          serviceMethod: "listAmazonSpApiSandboxImportJobsReadModelDryRun",
          dryRun: true,
          displayOnly: true,
          fixture: {
            importJobId: importJob.id,
            filename,
            stagingRows: fixtureRow.stagingRows,
            classification: fixtureRow.classification,
            displayStatus: fixtureRow.displayStatus,
          },
          pagination: {
            page: result.page,
            pageSize: result.pageSize,
            totalRows: result.totalRows,
            totalPages: result.totalPages,
          },
          rejected: [
            invalidPageSizeReject,
            dryRunFalseReject,
            invalidFilterReject,
            invalidSortReject,
          ],
          leakCheck: {
            transactionBefore: txBefore,
            transactionAfter: txAfter,
            inventoryMovementBefore: movementBefore,
            inventoryMovementAfter: movementAfter,
          },
          projectionGuard: {
            rawPayloadJsonProjected: Object.prototype.hasOwnProperty.call(fixtureRow, "rawPayloadJson"),
            normalizedPayloadJsonProjected: Object.prototype.hasOwnProperty.call(fixtureRow, "normalizedPayloadJson"),
            dedupeHashProjected: Object.prototype.hasOwnProperty.call(fixtureRow, "dedupeHash"),
            companyIdProjected: Object.prototype.hasOwnProperty.call(fixtureRow, "companyId"),
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
