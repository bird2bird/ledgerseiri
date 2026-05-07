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
  applyAmazonSpApiSandboxImportJobListFilterSort,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-importjob-list-filter-sort-contract.dto");

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

  assert(serviceSource.includes("persistAmazonSpApiSandboxImportJobOnly"), "Step122-C requires Step121-E service method");
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
  assert(!schema.includes("AmazonSpApiSandboxImportJobListFilterSort"), "Step122-C must not add filter/sort table");
  assert(!schema.includes("AmazonSpApiCredential"), "Step122-C must not add credential table");
  assert(!schema.includes("AmazonSpApiToken"), "Step122-C must not add token table");
  assert(!schema.includes("CrossSourceDedupe"), "Step122-C must not add dedupe table");

  const visibilityContract = assertAmazonSpApiSandboxImportCenterVisibilityContract(
    buildAmazonSpApiSandboxImportCenterVisibilityContract(),
  );

  const classificationPolicy = assertAmazonSpApiSandboxImportJobListQueryClassificationPolicy(
    buildAmazonSpApiSandboxImportJobListQueryClassificationPolicy({ visibilityContract }),
  );

  const contract = assertAmazonSpApiSandboxImportJobListFilterSortContract(
    buildAmazonSpApiSandboxImportJobListFilterSortContract({ classificationPolicy }),
  );

  assert(contract.version === "amazon-sp-api-sandbox-importjob-list-filter-sort-contract-v1", "contract version mismatch");
  assert(contract.contractOnly === true, "contractOnly mismatch");
  assert(contract.writesDatabase === false, "writesDatabase must be false");
  assert(contract.controllerExposed === false, "controller must remain disabled");
  assert(contract.frontendExposed === false, "frontend must remain disabled");

  assert(contract.allowedFilters.defaultFilter === "all", "default filter mismatch");
  assert(contract.allowedFilters.sourceTypeFilter === "amazon-sp-api-sandbox", "source filter mismatch");
  assert(contract.allowedFilters.lifecycleFilter === "pending-review", "lifecycle filter mismatch");
  assert(contract.allowedFilters.stagingFilter === "uncommitted-staging", "staging filter mismatch");
  assert(contract.allowedFilters.invalidFilter === "invalid-sp-api-sandbox", "invalid filter mismatch");
  assert(contract.allowedFilters.committedSalesFilterAllowed === false, "committed sales filter must be false");
  assert(contract.allowedFilters.inventoryExecutedFilterAllowed === false, "inventory filter must be false");

  assert(contract.allowedSorts.defaultSort === "createdAt_desc", "default sort mismatch");
  assert(contract.allowedSorts.supported.includes("createdAt_desc"), "createdAt_desc sort missing");
  assert(contract.allowedSorts.supported.includes("filename_asc"), "filename_asc sort missing");
  assert(contract.allowedSorts.supported.includes("totalRows_desc"), "totalRows_desc sort missing");
  assert(contract.allowedSorts.sortByCommittedSalesAllowed === false, "committed sales sort must be false");
  assert(contract.allowedSorts.sortByInventoryExecutionAllowed === false, "inventory execution sort must be false");
  assert(contract.allowedSorts.sortByTransactionAmountAllowed === false, "transaction amount sort must be false");

  assert(contract.queryProjectionPolicy.transactionFieldsAllowed === false, "transaction projection must be false");
  assert(contract.queryProjectionPolicy.inventoryMovementFieldsAllowed === false, "inventory projection must be false");
  assert(contract.queryProjectionPolicy.tokenFieldsAllowed === false, "token projection must be false");
  assert(contract.queryProjectionPolicy.credentialFieldsAllowed === false, "credential projection must be false");

  const rows = [
    {
      id: "job-1",
      filename: "b-sp-api-pending.json",
      createdAt: "2026-05-07T10:00:00.000Z",
      totalRows: 1,
      sourceType: "amazon-sp-api-sandbox",
      module: "store-orders",
      status: "PENDING",
      successRows: 0,
      failedRows: 0,
      importedAt: null,
      stagingRows: 0,
      stagingTargetEntityIds: [],
      transactionRows: 0,
      inventoryMovementRows: 0,
    },
    {
      id: "job-2",
      filename: "a-sp-api-staging.json",
      createdAt: "2026-05-07T11:00:00.000Z",
      totalRows: 3,
      sourceType: "amazon-sp-api-sandbox",
      module: "store-orders",
      status: "PENDING",
      successRows: 0,
      failedRows: 0,
      importedAt: null,
      stagingRows: 2,
      stagingTargetEntityIds: [null, null],
      transactionRows: 0,
      inventoryMovementRows: 0,
    },
    {
      id: "job-3",
      filename: "c-sp-api-invalid.json",
      createdAt: "2026-05-07T09:00:00.000Z",
      totalRows: 5,
      sourceType: "amazon-sp-api-sandbox",
      module: "store-orders",
      status: "PENDING",
      successRows: 1,
      failedRows: 0,
      importedAt: null,
      stagingRows: 1,
      stagingTargetEntityIds: [null],
      transactionRows: 1,
      inventoryMovementRows: 0,
    },
    {
      id: "job-4",
      filename: "d-csv.json",
      createdAt: "2026-05-07T12:00:00.000Z",
      totalRows: 9,
      sourceType: "amazon-csv",
      module: "store-orders",
      status: "PENDING",
      successRows: 0,
      failedRows: 0,
      importedAt: null,
      stagingRows: 1,
      stagingTargetEntityIds: [null],
    },
  ];

  const allDesc = applyAmazonSpApiSandboxImportJobListFilterSort(rows, {
    filter: "all",
    sort: "createdAt_desc",
  });
  assert(allDesc.map((row) => row.id).join(",") === "job-4,job-2,job-1,job-3", "createdAt_desc sort mismatch");

  const sourceOnly = applyAmazonSpApiSandboxImportJobListFilterSort(rows, {
    filter: "amazon-sp-api-sandbox",
    sort: "filename_asc",
  });
  assert(sourceOnly.map((row) => row.id).join(",") === "job-2,job-1,job-3", "source filter + filename sort mismatch");

  const pendingOnly = applyAmazonSpApiSandboxImportJobListFilterSort(rows, {
    filter: "pending-review",
    sort: "createdAt_asc",
  });
  assert(pendingOnly.length === 1 && pendingOnly[0].id === "job-1", "pending filter mismatch");

  const stagingOnly = applyAmazonSpApiSandboxImportJobListFilterSort(rows, {
    filter: "uncommitted-staging",
    sort: "totalRows_desc",
  });
  assert(stagingOnly.length === 1 && stagingOnly[0].id === "job-2", "staging filter mismatch");

  const invalidOnly = applyAmazonSpApiSandboxImportJobListFilterSort(rows, {
    filter: "invalid-sp-api-sandbox",
    sort: "totalRows_asc",
  });
  assert(invalidOnly.length === 1 && invalidOnly[0].id === "job-3", "invalid filter mismatch");

  for (const row of sourceOnly) {
    assert(row.classification.allowedActions.commitSales === false, "commitSales must remain false");
    assert(row.classification.allowedActions.executeInventory === false, "executeInventory must remain false");
    assert(row.classification.allowedActions.overwriteTransactions === false, "overwriteTransactions must remain false");
    assert(row.classification.allowedActions.realSpApi === false, "realSpApi must remain false");
    assert(row.classification.allowedActions.oauth === false, "oauth must remain false");
  }

  for (const [key, blocked] of Object.entries(contract.blockedNow)) {
    assert(blocked === true, `contract.blockedNow.${key} must remain true`);
  }

  const leakedRows = await prisma.importJob.findMany({
    where: {
      filename: {
        contains: "step122-c-importjob-list-filter-sort",
      },
    },
    select: { id: true, filename: true },
    take: 10,
  });
  assert(leakedRows.length === 0, `Step122-C contract smoke must not create ImportJob rows count=${leakedRows.length}`);

  const leakedTxCount = await prisma.transaction.count({
    where: {
      sourceFileName: {
        contains: "step122-c-importjob-list-filter-sort",
      },
    },
  });
  assert(leakedTxCount === 0, "Step122-C contract smoke must not create Transaction rows");

  console.log("[SMOKE_OK] amazon sp-api sandbox ImportJob list filter/sort contract smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        contract: {
          version: contract.version,
          contractOnly: contract.contractOnly,
          writesDatabase: contract.writesDatabase,
          allowedFilters: contract.allowedFilters,
          allowedSorts: contract.allowedSorts,
          queryProjectionPolicy: contract.queryProjectionPolicy,
          listItemRules: contract.listItemRules,
          summary: contract.summary,
        },
        samples: {
          allDesc: allDesc.map((row) => [row.id, row.classification.classification]),
          sourceOnly: sourceOnly.map((row) => [row.id, row.classification.classification]),
          pendingOnly: pendingOnly.map((row) => [row.id, row.classification.classification]),
          stagingOnly: stagingOnly.map((row) => [row.id, row.classification.classification]),
          invalidOnly: invalidOnly.map((row) => [row.id, row.classification.classification]),
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
