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
  classifyAmazonSpApiSandboxImportJobListCandidate,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-importjob-list-query-classification-policy.dto");

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

  assert(serviceSource.includes("persistAmazonSpApiSandboxImportJobOnly"), "Step122-B requires Step121-E service method");
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
  assert(!schema.includes("AmazonSpApiSandboxImportJobListQueryClassification"), "Step122-B must not add classification table");
  assert(!schema.includes("AmazonSpApiCredential"), "Step122-B must not add credential table");
  assert(!schema.includes("AmazonSpApiToken"), "Step122-B must not add token table");
  assert(!schema.includes("CrossSourceDedupe"), "Step122-B must not add dedupe table");

  const visibilityContract = assertAmazonSpApiSandboxImportCenterVisibilityContract(
    buildAmazonSpApiSandboxImportCenterVisibilityContract(),
  );

  const policy = assertAmazonSpApiSandboxImportJobListQueryClassificationPolicy(
    buildAmazonSpApiSandboxImportJobListQueryClassificationPolicy({ visibilityContract }),
  );

  assert(policy.version === "amazon-sp-api-sandbox-importjob-list-query-classification-policy-v1", "policy version mismatch");
  assert(policy.policyOnly === true, "policyOnly mismatch");
  assert(policy.writesDatabase === false, "writesDatabase must be false");
  assert(policy.controllerExposed === false, "controller must remain disabled");
  assert(policy.frontendExposed === false, "frontend must remain disabled");

  assert(policy.listQueryPolicy.mayIncludeInImportCenterListEventually === true, "eventual list visibility mismatch");
  assert(policy.listQueryPolicy.mayExposeViaControllerNow === false, "controller exposure must be false now");
  assert(policy.listQueryPolicy.mayExposeViaFrontendNow === false, "frontend exposure must be false now");
  assert(policy.listQueryPolicy.requiredSourceType === "amazon-sp-api-sandbox", "required sourceType mismatch");
  assert(policy.listQueryPolicy.requiredModule === "store-orders", "required module mismatch");
  assert(policy.listQueryPolicy.requiredStatus === "PENDING", "required status mismatch");
  assert(policy.listQueryPolicy.requiredSuccessRows === 0, "required successRows mismatch");
  assert(policy.listQueryPolicy.requiredFailedRows === 0, "required failedRows mismatch");
  assert(policy.listQueryPolicy.requiredImportedAt === null, "required importedAt mismatch");
  assert(policy.listQueryPolicy.requiredStagingTargetEntityId === null, "required targetEntityId mismatch");

  const validPending = classifyAmazonSpApiSandboxImportJobListCandidate({
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
  });
  assert(validPending.classification === "AMAZON_SP_API_SANDBOX_PENDING_REVIEW", "valid pending classification mismatch");
  assert(validPending.visibleAsPendingReview === true, "valid pending should be visible as pending review");
  assert(validPending.allowedActions.commitSales === false, "commitSales must be false for pending");
  assert(validPending.allowedActions.executeInventory === false, "executeInventory must be false for pending");

  const validStaging = classifyAmazonSpApiSandboxImportJobListCandidate({
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
  });
  assert(validStaging.classification === "AMAZON_SP_API_SANDBOX_UNCOMMITTED_STAGING", "valid staging classification mismatch");
  assert(validStaging.visibleAsPendingReview === true, "valid staging should be visible as pending review");
  assert(validStaging.badges.includes("SP-API sandbox"), "SP-API badge missing");
  assert(validStaging.badges.includes("Not committed"), "Not committed badge missing");
  assert(validStaging.badges.includes("Inventory not executed"), "Inventory badge missing");

  const nonSpApi = classifyAmazonSpApiSandboxImportJobListCandidate({
    sourceType: "amazon-csv",
    module: "store-orders",
    status: "PENDING",
    successRows: 0,
    failedRows: 0,
    importedAt: null,
    stagingRows: 1,
    stagingTargetEntityIds: [null],
  });
  assert(nonSpApi.classification === "NON_SP_API_IMPORT_JOB", "non-SP-API classification mismatch");
  assert(nonSpApi.visibleAsPendingReview === false, "non-SP-API should not be classified as SP-API pending review");

  const invalidCommitted = classifyAmazonSpApiSandboxImportJobListCandidate({
    sourceType: "amazon-sp-api-sandbox",
    module: "store-orders",
    status: "PENDING",
    successRows: 1,
    failedRows: 0,
    importedAt: null,
    stagingRows: 1,
    stagingTargetEntityIds: [null],
  });
  assert(invalidCommitted.classification === "INVALID_SP_API_SANDBOX_IMPORT_JOB", "invalid committed classification mismatch");
  assert(invalidCommitted.visibleAsPendingReview === false, "invalid committed should not be visible as valid pending review");

  const invalidTarget = classifyAmazonSpApiSandboxImportJobListCandidate({
    sourceType: "amazon-sp-api-sandbox",
    module: "store-orders",
    status: "PENDING",
    successRows: 0,
    failedRows: 0,
    importedAt: null,
    stagingRows: 1,
    stagingTargetEntityIds: ["txn_123"],
  });
  assert(invalidTarget.classification === "INVALID_SP_API_SANDBOX_IMPORT_JOB", "invalid target classification mismatch");
  assert(invalidTarget.allowedActions.commitSales === false, "invalid target commitSales must be false");

  assert(policy.listItemPresentation.primaryAction === "view-only", "primary action mismatch");
  assert(policy.listItemPresentation.commitActionAllowed === false, "commit action must be false");
  assert(policy.listItemPresentation.inventoryActionAllowed === false, "inventory action must be false");
  assert(policy.listItemPresentation.realSpApiActionAllowed === false, "real SP-API action must be false");
  assert(policy.listItemPresentation.oauthActionAllowed === false, "OAuth action must be false");

  for (const [key, blocked] of Object.entries(policy.blockedNow)) {
    assert(blocked === true, `policy.blockedNow.${key} must remain true`);
  }

  const leakedPolicyRows = await prisma.importJob.findMany({
    where: {
      filename: {
        contains: "step122-b-importjob-list-query-classification",
      },
    },
    select: { id: true, filename: true },
    take: 10,
  });
  assert(leakedPolicyRows.length === 0, `Step122-B policy smoke must not create ImportJob rows count=${leakedPolicyRows.length}`);

  const leakedTxCount = await prisma.transaction.count({
    where: {
      sourceFileName: {
        contains: "step122-b-importjob-list-query-classification",
      },
    },
  });
  assert(leakedTxCount === 0, "Step122-B policy smoke must not create Transaction rows");

  console.log("[SMOKE_OK] amazon sp-api sandbox ImportJob list query classification policy smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        policy: {
          version: policy.version,
          policyOnly: policy.policyOnly,
          writesDatabase: policy.writesDatabase,
          listQueryPolicy: policy.listQueryPolicy,
          listItemPresentation: policy.listItemPresentation,
          summary: policy.summary,
        },
        classificationSamples: {
          validPending,
          validStaging,
          nonSpApi,
          invalidCommitted,
          invalidTarget,
        },
        leakCheck: {
          importJobRows: leakedPolicyRows.length,
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
