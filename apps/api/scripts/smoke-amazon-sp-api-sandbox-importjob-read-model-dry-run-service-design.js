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
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-importjob-list-query-projection-contract.dto");
const {
  buildAmazonSpApiSandboxImportJobReadModelDryRunServiceDesign,
  assertAmazonSpApiSandboxImportJobReadModelDryRunServiceDesign,
  simulateAmazonSpApiSandboxImportJobReadModelDryRun,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-importjob-read-model-dry-run-service-design.dto");

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

  assert(serviceSource.includes("persistAmazonSpApiSandboxImportJobOnly"), "Step122-E requires Step121-E service method");
  assert(!serviceSource.includes("listAmazonSpApiSandboxImportJobsReadModelDryRun("), "Step122-E must not implement read-model service method yet");
  assert(serviceSource.includes("STEP121_E_IMPORTJOB_PERSISTENCE_ENV_DISABLED"), "env-disabled guard missing");
  assert(serviceSource.includes("STEP121_E_DUPLICATE_IMPORTJOB_FILENAME"), "duplicate filename guard missing");
  assert(serviceSource.includes("STEP121_E_DUPLICATE_STAGING_DEDUPE_HASH"), "duplicate dedupe guard missing");

  assert(!controllerSource.includes("persistAmazonSpApiSandboxImportJobOnly"), "controller must not expose permanent service method");
  assert(!controllerSource.includes("rollbackOnlyPersistAmazonSpApiSandboxImportJob"), "controller must not expose rollback service method");
  assert(!controllerSource.includes("planAmazonSpApiSandboxImportAggregate"), "controller must not expose aggregate method");
  assert(!controllerSource.includes("listAmazonSpApiSandboxImportJobsReadModelDryRun"), "controller must not expose read-model method");

  const routeScan = scanControllerRoutes(root, srcRoot);
  assert(routeScan.exposedRoutes.length === 0, `controller route leak: ${JSON.stringify(routeScan.exposedRoutes)}`);

  assert(schema.includes("model ImportJob"), "schema missing ImportJob");
  assert(schema.includes("model ImportStagingRow"), "schema missing ImportStagingRow");
  assert(schema.includes("model Transaction"), "schema missing Transaction");
  assert(schema.includes("model InventoryMovement"), "schema missing InventoryMovement");
  assert(!schema.includes("AmazonSpApiSandboxImportJobReadModel"), "Step122-E must not add read-model table");
  assert(!schema.includes("AmazonSpApiCredential"), "Step122-E must not add credential table");
  assert(!schema.includes("AmazonSpApiToken"), "Step122-E must not add token table");
  assert(!schema.includes("CrossSourceDedupe"), "Step122-E must not add dedupe table");

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

  const design = assertAmazonSpApiSandboxImportJobReadModelDryRunServiceDesign(
    buildAmazonSpApiSandboxImportJobReadModelDryRunServiceDesign({ projectionContract }),
  );

  assert(design.version === "amazon-sp-api-sandbox-importjob-read-model-dry-run-service-design-v1", "design version mismatch");
  assert(design.designOnly === true, "designOnly mismatch");
  assert(design.writesDatabase === false, "writesDatabase must be false");
  assert(design.serviceMethodName === "listAmazonSpApiSandboxImportJobsReadModelDryRun", "service method name mismatch");
  assert(design.serviceMethodImplementedNow === false, "service method must not be implemented");
  assert(design.controllerExposed === false, "controller must remain disabled");
  assert(design.frontendExposed === false, "frontend must remain disabled");

  assert(design.plannedServiceArgs.dryRun === true, "planned dryRun must be true");
  assert(design.plannedServiceArgs.pageSize.includes(20), "pageSize 20 missing");
  assert(design.plannedServiceArgs.pageSize.includes(50), "pageSize 50 missing");
  assert(design.plannedServiceArgs.pageSize.includes(100), "pageSize 100 missing");

  assert(design.plannedReadQuery.importJobFindMany === true, "ImportJob findMany missing");
  assert(design.plannedReadQuery.importJobWhereSourceType === "amazon-sp-api-sandbox", "sourceType where mismatch");
  assert(design.plannedReadQuery.importJobWhereModule === "store-orders", "module where mismatch");
  assert(design.plannedReadQuery.importJobWhereStatus === "PENDING", "status where mismatch");
  assert(design.plannedReadQuery.importJobSelectSafeListFieldsOnly === true, "safe ImportJob select missing");
  assert(design.plannedReadQuery.stagingRowGroupByImportJobId === true, "staging group-by missing");
  assert(design.plannedReadQuery.stagingRowTargetEntityIdAggregationOnly === true, "targetEntityId aggregation missing");
  assert(design.plannedReadQuery.transactionJoin === false, "transactionJoin must be false");
  assert(design.plannedReadQuery.inventoryMovementJoin === false, "inventoryMovementJoin must be false");
  assert(design.plannedReadQuery.tokenJoin === false, "tokenJoin must be false");
  assert(design.plannedReadQuery.credentialJoin === false, "credentialJoin must be false");
  assert(design.plannedReadQuery.rawPayloadJsonProjection === false, "rawPayloadJsonProjection must be false");
  assert(design.plannedReadQuery.normalizedPayloadJsonProjection === false, "normalizedPayloadJsonProjection must be false");
  assert(design.plannedReadQuery.dedupeHashProjection === false, "dedupeHashProjection must be false");

  const rows = Array.from({ length: 12 }).map((_, index) => {
    const n = index + 1;
    return {
      id: `job-${String(n).padStart(2, "0")}`,
      filename: `step122-e-sp-api-${String(n).padStart(2, "0")}.json`,
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

  const dryRunResult = simulateAmazonSpApiSandboxImportJobReadModelDryRun(rows, {
    filter: "amazon-sp-api-sandbox",
    sort: "createdAt_desc",
    page: 1,
    pageSize: 20,
    dryRun: true,
  });

  assert(dryRunResult.dryRun === true, "dryRun result flag mismatch");
  assert(dryRunResult.displayOnly === true, "displayOnly mismatch");
  assert(dryRunResult.sourceType === "amazon-sp-api-sandbox", "sourceType mismatch");
  assert(dryRunResult.rows.length === 12, "dryRun row count mismatch");
  assert(dryRunResult.page === 1, "page mismatch");
  assert(dryRunResult.pageSize === 20, "pageSize mismatch");
  assert(dryRunResult.totalRows === 12, "totalRows mismatch");
  assert(dryRunResult.totalPages === 1, "totalPages mismatch");

  for (const row of dryRunResult.rows) {
    assert(row.allowedActions.commitSales === false, "commitSales must remain false");
    assert(row.allowedActions.executeInventory === false, "executeInventory must remain false");
    assert(row.allowedActions.overwriteTransactions === false, "overwriteTransactions must remain false");
    assert(row.allowedActions.realSpApi === false, "realSpApi must remain false");
    assert(row.allowedActions.oauth === false, "oauth must remain false");
    assert(!Object.prototype.hasOwnProperty.call(row, "rawPayloadJson"), "rawPayloadJson must not be present");
    assert(!Object.prototype.hasOwnProperty.call(row, "normalizedPayloadJson"), "normalizedPayloadJson must not be present");
    assert(!Object.prototype.hasOwnProperty.call(row, "dedupeHash"), "dedupeHash must not be present");
  }

  let dryRunFalseRejected = false;
  try {
    simulateAmazonSpApiSandboxImportJobReadModelDryRun(rows, {
      filter: "all",
      sort: "createdAt_desc",
      page: 1,
      pageSize: 20,
      dryRun: false,
    });
  } catch (err) {
    dryRunFalseRejected = String(err.message || err).includes("dryRun must be true");
  }
  assert(dryRunFalseRejected === true, "dryRun:false should be rejected");

  for (const [key, blocked] of Object.entries(design.blockedNow)) {
    assert(blocked === true, `design.blockedNow.${key} must remain true`);
  }

  const leakedRows = await prisma.importJob.findMany({
    where: {
      filename: {
        contains: "step122-e-read-model-dry-run-service",
      },
    },
    select: { id: true, filename: true },
    take: 10,
  });
  assert(leakedRows.length === 0, `Step122-E design smoke must not create ImportJob rows count=${leakedRows.length}`);

  const leakedTxCount = await prisma.transaction.count({
    where: {
      sourceFileName: {
        contains: "step122-e-read-model-dry-run-service",
      },
    },
  });
  assert(leakedTxCount === 0, "Step122-E design smoke must not create Transaction rows");

  console.log("[SMOKE_OK] amazon sp-api sandbox ImportJob read-model dry-run service design smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        design: {
          version: design.version,
          designOnly: design.designOnly,
          writesDatabase: design.writesDatabase,
          serviceMethodName: design.serviceMethodName,
          serviceMethodImplementedNow: design.serviceMethodImplementedNow,
          plannedServiceArgs: design.plannedServiceArgs,
          plannedReadQuery: design.plannedReadQuery,
          outputShape: design.outputShape,
          summary: design.summary,
        },
        dryRunSample: {
          rows: dryRunResult.rows.length,
          page: dryRunResult.page,
          pageSize: dryRunResult.pageSize,
          totalRows: dryRunResult.totalRows,
          totalPages: dryRunResult.totalPages,
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
