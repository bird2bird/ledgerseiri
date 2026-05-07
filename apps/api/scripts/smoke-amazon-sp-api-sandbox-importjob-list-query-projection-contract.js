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
const {
  buildAmazonSpApiSandboxImportJobListQueryClassificationPolicy,
  assertAmazonSpApiSandboxImportJobListQueryClassificationPolicy,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-importjob-list-query-classification-policy.dto");
const {
  buildAmazonSpApiSandboxImportJobListFilterSortContract,
  assertAmazonSpApiSandboxImportJobListFilterSortContract,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-importjob-list-filter-sort-contract.dto");
const {
  buildAmazonSpApiSandboxImportJobListQueryProjectionContract,
  assertAmazonSpApiSandboxImportJobListQueryProjectionContract,
  projectAmazonSpApiSandboxImportJobListRows,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-importjob-list-query-projection-contract.dto");

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

  assert(serviceSource.includes("persistAmazonSpApiSandboxImportJobOnly"), "Step122-D requires Step121-E service method");
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
  assert(!schema.includes("AmazonSpApiSandboxImportJobListQueryProjection"), "Step122-D must not add projection table");
  assert(!schema.includes("AmazonSpApiCredential"), "Step122-D must not add credential table");
  assert(!schema.includes("AmazonSpApiToken"), "Step122-D must not add token table");
  assert(!schema.includes("CrossSourceDedupe"), "Step122-D must not add dedupe table");

  const visibilityContract = assertAmazonSpApiSandboxImportCenterVisibilityContract(
    buildAmazonSpApiSandboxImportCenterVisibilityContract(),
  );

  const classificationPolicy = assertAmazonSpApiSandboxImportJobListQueryClassificationPolicy(
    buildAmazonSpApiSandboxImportJobListQueryClassificationPolicy({ visibilityContract }),
  );

  const filterSortContract = assertAmazonSpApiSandboxImportJobListFilterSortContract(
    buildAmazonSpApiSandboxImportJobListFilterSortContract({ classificationPolicy }),
  );

  const projectionContract = assertAmazonSpApiSandboxImportJobListQueryProjectionContract(
    buildAmazonSpApiSandboxImportJobListQueryProjectionContract({ filterSortContract }),
  );

  assert(projectionContract.version === "amazon-sp-api-sandbox-importjob-list-query-projection-contract-v1", "projection version mismatch");
  assert(projectionContract.contractOnly === true, "contractOnly mismatch");
  assert(projectionContract.writesDatabase === false, "writesDatabase must be false");
  assert(projectionContract.controllerExposed === false, "controller must remain disabled");
  assert(projectionContract.frontendExposed === false, "frontend must remain disabled");

  assert(projectionContract.allowedImportJobSelect.id === true, "id projection missing");
  assert(projectionContract.allowedImportJobSelect.filename === true, "filename projection missing");
  assert(projectionContract.allowedImportJobSelect.sourceType === true, "sourceType projection missing");
  assert(projectionContract.allowedImportJobSelect.module === true, "module projection missing");
  assert(projectionContract.allowedImportJobSelect.status === true, "status projection missing");
  assert(projectionContract.allowedImportJobSelect.companyId === false, "companyId must not be projected");
  assert(projectionContract.allowedImportJobSelect.conflictMonthsJson === false, "conflictMonthsJson must not be projected");
  assert(projectionContract.allowedImportJobSelect.fileMonthsJson === false, "fileMonthsJson must not be projected");

  assert(projectionContract.allowedStagingAggregation.countRowsByImportJobId === true, "staging count aggregation missing");
  assert(projectionContract.allowedStagingAggregation.collectTargetEntityIds === true, "targetEntityIds aggregation missing");
  assert(projectionContract.allowedStagingAggregation.collectRawPayloadJson === false, "rawPayloadJson must not be projected");
  assert(projectionContract.allowedStagingAggregation.collectNormalizedPayloadJson === false, "normalizedPayloadJson must not be projected");
  assert(projectionContract.allowedStagingAggregation.collectDedupeHash === false, "dedupeHash must not be projected");

  assert(projectionContract.forbiddenProjection.transactionJoin === true, "transactionJoin must be forbidden");
  assert(projectionContract.forbiddenProjection.inventoryMovementJoin === true, "inventoryMovementJoin must be forbidden");
  assert(projectionContract.forbiddenProjection.tokenJoin === true, "tokenJoin must be forbidden");
  assert(projectionContract.forbiddenProjection.rawPayloadJsonInList === true, "rawPayloadJsonInList must be forbidden");
  assert(projectionContract.forbiddenProjection.normalizedPayloadJsonInList === true, "normalizedPayloadJsonInList must be forbidden");

  assert(projectionContract.paginationPolicy.defaultPageSize === 20, "default page size mismatch");
  assert(projectionContract.paginationPolicy.allowedPageSizes.includes(20), "20 page size missing");
  assert(projectionContract.paginationPolicy.allowedPageSizes.includes(50), "50 page size missing");
  assert(projectionContract.paginationPolicy.allowedPageSizes.includes(100), "100 page size missing");
  assert(projectionContract.paginationPolicy.maxPageSize === 100, "max page size mismatch");

  const rows = Array.from({ length: 24 }).map((_, index) => {
    const n = index + 1;
    return {
      id: `job-${String(n).padStart(2, "0")}`,
      filename: `step122-d-sp-api-${String(n).padStart(2, "0")}.json`,
      createdAt: `2026-05-07T${String(8 + (index % 12)).padStart(2, "0")}:00:00.000Z`,
      totalRows: n,
      sourceType: "amazon-sp-api-sandbox",
      module: "store-orders",
      status: "PENDING",
      successRows: 0,
      failedRows: 0,
      importedAt: null,
      stagingRows: index % 2 === 0 ? 0 : 2,
      stagingTargetEntityIds: index % 2 === 0 ? [] : [null, null],
      transactionRows: 0,
      inventoryMovementRows: 0,
    };
  });

  const page1 = projectAmazonSpApiSandboxImportJobListRows(rows, {
    filter: "amazon-sp-api-sandbox",
    sort: "createdAt_desc",
    page: 1,
    pageSize: 20,
  });

  assert(page1.rows.length === 20, "page1 row count mismatch");
  assert(page1.page === 1, "page1 page mismatch");
  assert(page1.pageSize === 20, "page1 pageSize mismatch");
  assert(page1.totalRows === 24, "page1 totalRows mismatch");
  assert(page1.totalPages === 2, "page1 totalPages mismatch");

  const page2 = projectAmazonSpApiSandboxImportJobListRows(rows, {
    filter: "amazon-sp-api-sandbox",
    sort: "createdAt_desc",
    page: 2,
    pageSize: 20,
  });
  assert(page2.rows.length === 4, "page2 row count mismatch");
  assert(page2.totalPages === 2, "page2 totalPages mismatch");

  const stagingOnly = projectAmazonSpApiSandboxImportJobListRows(rows, {
    filter: "uncommitted-staging",
    sort: "totalRows_desc",
    page: 1,
    pageSize: 20,
  });
  assert(stagingOnly.rows.length === 12, "stagingOnly count mismatch");
  assert(stagingOnly.rows[0].totalRows === 24, "stagingOnly totalRows_desc mismatch");

  for (const projected of page1.rows) {
    assert(projected.allowedActions.commitSales === false, "projected commitSales must be false");
    assert(projected.allowedActions.executeInventory === false, "projected executeInventory must be false");
    assert(projected.allowedActions.overwriteTransactions === false, "projected overwriteTransactions must be false");
    assert(projected.allowedActions.realSpApi === false, "projected realSpApi must be false");
    assert(projected.allowedActions.oauth === false, "projected oauth must be false");
    assert(projected.displayStatus === "PENDING", "projected displayStatus must be PENDING");
  }

  let invalidPageSizeRejected = false;
  try {
    projectAmazonSpApiSandboxImportJobListRows(rows, {
      filter: "all",
      sort: "createdAt_desc",
      page: 1,
      pageSize: 10,
    });
  } catch (err) {
    invalidPageSizeRejected = String(err.message || err).includes("pageSize must be 20, 50, or 100");
  }
  assert(invalidPageSizeRejected === true, "invalid pageSize should be rejected");

  for (const [key, blocked] of Object.entries(projectionContract.blockedNow)) {
    assert(blocked === true, `projectionContract.blockedNow.${key} must remain true`);
  }

  const leakedRows = await prisma.importJob.findMany({
    where: {
      filename: {
        contains: "step122-d-importjob-list-query-projection",
      },
    },
    select: { id: true, filename: true },
    take: 10,
  });
  assert(leakedRows.length === 0, `Step122-D contract smoke must not create ImportJob rows count=${leakedRows.length}`);

  const leakedTxCount = await prisma.transaction.count({
    where: {
      sourceFileName: {
        contains: "step122-d-importjob-list-query-projection",
      },
    },
  });
  assert(leakedTxCount === 0, "Step122-D contract smoke must not create Transaction rows");

  console.log("[SMOKE_OK] amazon sp-api sandbox ImportJob list query projection contract smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        projectionContract: {
          version: projectionContract.version,
          contractOnly: projectionContract.contractOnly,
          writesDatabase: projectionContract.writesDatabase,
          allowedImportJobSelect: projectionContract.allowedImportJobSelect,
          allowedStagingAggregation: projectionContract.allowedStagingAggregation,
          forbiddenProjection: projectionContract.forbiddenProjection,
          outputRules: projectionContract.outputRules,
          paginationPolicy: projectionContract.paginationPolicy,
          summary: projectionContract.summary,
        },
        samples: {
          page1: {
            rows: page1.rows.length,
            page: page1.page,
            pageSize: page1.pageSize,
            totalRows: page1.totalRows,
            totalPages: page1.totalPages,
          },
          page2: {
            rows: page2.rows.length,
            page: page2.page,
            pageSize: page2.pageSize,
            totalRows: page2.totalRows,
            totalPages: page2.totalPages,
          },
          stagingOnly: {
            rows: stagingOnly.rows.length,
            firstTotalRows: stagingOnly.rows[0]?.totalRows,
          },
        },
        leakCheck: {
          importJobRows: leakedRows.length,
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
