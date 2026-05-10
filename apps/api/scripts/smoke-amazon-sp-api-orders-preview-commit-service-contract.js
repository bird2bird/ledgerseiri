#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOrdersPreviewCommitServiceContract,
  buildAmazonSpApiOrdersPreviewCommitServiceContract,
} = require("../dist/src/imports/dto/amazon-sp-api-orders-preview-commit-service-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`[OK] ${message}`);
}

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`);
  return fs.readFileSync(file, "utf8");
}

function listFiles(dir, predicate, acc = []) {
  if (!fs.existsSync(dir)) return acc;

  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);

    if (stat.isDirectory()) {
      if (
        name === "node_modules" ||
        name === "dist" ||
        name === ".next" ||
        name === "coverage" ||
        name === ".git"
      ) {
        continue;
      }
      listFiles(p, predicate, acc);
      continue;
    }

    if (predicate(p)) acc.push(p);
  }

  return acc;
}

function isDtoOrContractFile(file) {
  return file.includes(`${path.sep}src${path.sep}imports${path.sep}dto${path.sep}`) || file.endsWith(".dto.ts");
}

function isAllowedExistingSandboxFile(file, text) {
  return (
    text.includes("AmazonSpApiSandbox") ||
    text.includes("amazon-sp-api-sandbox") ||
    text.includes("AMAZON_ORDER_SP_API") ||
    file.includes(`${path.sep}scripts${path.sep}smoke-amazon-sp-api-sandbox`)
  );
}

function assertNoStep140GImplementationLeak(repoRoot) {
  const apiRoot = path.resolve(repoRoot, "apps/api");
  const apiSrcRoot = path.resolve(apiRoot, "src");

  const implementationFiles = listFiles(apiSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p))
    .filter((file) => !isDtoOrContractFile(file));

  const routeLeaks = [];
  const previewLeaks = [];
  const commitLeaks = [];
  const rollbackLeaks = [];
  const writeLeaks = [];
  const inventoryLeaks = [];
  const reconciliationLeaks = [];
  const networkLeaks = [];
  const schemaLeaks = [];

  const routePatterns = [
    /@Get\s*\([^)]*(orders|order-items|amazon-sp-api\/orders|sp-api\/orders)/i,
    /@Post\s*\([^)]*(orders|order-items|amazon-sp-api\/orders|sp-api\/orders)/i,
  ];

  const previewFragments = [
    "AmazonSpApiOrdersPreviewService",
    "previewAmazonSpApiOrders",
    "buildAmazonSpApiOrdersPreview",
    "returnsInventoryImpactPreview",
    "returnsTransactionImpactPreview",
  ];

  const commitFragments = [
    "AmazonSpApiOrdersCommitService",
    "commitAmazonSpApiOrders",
    "commitAmazonOrders",
    "requiresExplicitUserConfirm",
    "previewToken",
  ];

  const rollbackFragments = [
    "rollbackAmazonSpApiOrders",
    "compensateAmazonSpApiOrders",
    "rollbackPlan",
    "compensationLog",
  ];

  const writeFragments = [
    "importJob.create",
    "importJob.update",
    "importStagingRow.create",
    "importStagingRow.createMany",
    "transaction.create",
    "transaction.createMany",
  ];

  const inventoryFragments = [
    "inventoryMovement.create",
    "inventoryMovement.createMany",
    "inventoryBalance.update",
    "inventoryBalance.upsert",
    "deductInventory",
    "inventoryDeduction",
  ];

  const reconciliationFragments = [
    "settlementReconciliation",
    "bankReconciliation",
    "payoutMatching",
    "bankTransactionLink",
  ];

  const networkFragments = [
    "fetch(",
    "axios.",
    "got(",
    "https.request(",
    "http.request(",
    "undici.request",
    "getOrders(",
    "getOrder(",
    "getOrderItems(",
    "/orders/v0/orders",
    "orders/v0/orders",
  ];

  for (const file of implementationFiles) {
    const text = read(file);
    const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");
    const allowedSandbox = isAllowedExistingSandboxFile(file, text);

    const hasAmazonOrdersContext =
      text.includes("amazon-sp-api") ||
      text.includes("AmazonSpApi") ||
      text.includes("AmazonOrders") ||
      text.includes("AmazonSpApiOrders") ||
      text.includes("sellingpartnerapi") ||
      text.includes("selling-partner-api") ||
      text.includes("orders/v0/orders") ||
      text.includes("/orders/v0/orders") ||
      text.includes("STEP140-G") ||
      text.includes("step140-g");

    for (const pattern of routePatterns) {
      if (pattern.test(text) && !allowedSandbox) routeLeaks.push(rel);
    }

    if (hasAmazonOrdersContext && previewFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox) {
      previewLeaks.push(rel);
    }

    if (hasAmazonOrdersContext && commitFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox) {
      commitLeaks.push(rel);
    }

    if (hasAmazonOrdersContext && rollbackFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox) {
      rollbackLeaks.push(rel);
    }

    if (hasAmazonOrdersContext && writeFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox) {
      writeLeaks.push(rel);
    }

    if (hasAmazonOrdersContext && inventoryFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox) {
      inventoryLeaks.push(rel);
    }

    if (hasAmazonOrdersContext && reconciliationFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox) {
      reconciliationLeaks.push(rel);
    }

    if (hasAmazonOrdersContext && networkFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox) {
      networkLeaks.push(rel);
    }
  }

  const schema = read(path.resolve(apiRoot, "prisma/schema.prisma"));
  const forbiddenSchemaMarkers = [
    "model AmazonSpApiOrder",
    "model AmazonSpApiOrderItem",
    "model AmazonOrdersPreview",
    "model AmazonOrdersCommit",
    "model AmazonOrdersRollback",
    "model AmazonOrdersCompensation",
  ];

  for (const marker of forbiddenSchemaMarkers) {
    if (schema.includes(marker)) schemaLeaks.push(marker);
  }

  assert(routeLeaks.length === 0, `no Step140-G Orders API controller route leak: ${JSON.stringify(routeLeaks)}`);
  assert(previewLeaks.length === 0, `no Step140-G preview service implementation leak: ${JSON.stringify(previewLeaks)}`);
  assert(commitLeaks.length === 0, `no Step140-G commit service implementation leak: ${JSON.stringify(commitLeaks)}`);
  assert(rollbackLeaks.length === 0, `no Step140-G rollback/compensation implementation leak: ${JSON.stringify(rollbackLeaks)}`);
  assert(writeLeaks.length === 0, `no Step140-G ImportJob/StagingRow/Transaction write leak: ${JSON.stringify(writeLeaks)}`);
  assert(inventoryLeaks.length === 0, `no Step140-G inventory write leak: ${JSON.stringify(inventoryLeaks)}`);
  assert(reconciliationLeaks.length === 0, `no Step140-G reconciliation write leak: ${JSON.stringify(reconciliationLeaks)}`);
  assert(networkLeaks.length === 0, `no Step140-G Amazon Orders network leak: ${JSON.stringify(networkLeaks)}`);
  assert(schemaLeaks.length === 0, `no Step140-G Prisma schema model leak: ${JSON.stringify(schemaLeaks)}`);

  return {
    scannedApiImplementationFiles: implementationFiles.length,
    routeLeaks,
    previewLeaks,
    commitLeaks,
    rollbackLeaks,
    writeLeaks,
    inventoryLeaks,
    reconciliationLeaks,
    networkLeaks,
    schemaLeaks,
  };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");

  console.log("========== Step140-G Amazon SP-API Orders preview + commit service contract aggregate smoke ==========");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-preview-commit-service-contract"] ===
      "node scripts/smoke-amazon-sp-api-orders-preview-commit-service-contract.js",
    "apps/api package.json registers Step140-G smoke",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-normalized-fixture-persistence-readiness-contract"],
    "Step140-F persistence readiness regression smoke remains registered",
  );

  const step140FDtoSource = read(
    path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-orders-normalized-fixture-persistence-readiness-contract.dto.ts"),
  );

  assert(step140FDtoSource.includes("readyForOrdersApiPreviewServiceContract: true"), "Step140-F allows preview service contract");
  assert(step140FDtoSource.includes("readyForOrdersApiCommitServiceContract: true"), "Step140-F allows commit service contract");

  const dtoSource = read(
    path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-orders-preview-commit-service-contract.dto.ts"),
  );

  const requiredDtoMarkers = [
    "AMAZON_SP_API_ORDERS_PREVIEW_COMMIT_SERVICE_CONTRACT_VERSION",
    "buildAmazonSpApiOrdersPreviewCommitServiceContract",
    "assertAmazonSpApiOrdersPreviewCommitServiceContract",
    "assertAmazonSpApiOrdersNormalizedFixturePersistenceReadinessContract",
    "design-amazon-sp-api-orders-preview-commit-service-contract-aggregate-only",
    "previewServiceDesignOnly",
    "commitServiceDesignOnly",
    "rollbackBoundaryDesignOnly",
    "compensationBoundaryDesignOnly",
    "returnsInventoryImpactPreview",
    "returnsTransactionImpactPreview",
    "requiresExplicitUserConfirm",
    "requiresIdempotencyKey",
    "requiresSkuResolutionDecision",
    "sequencePersistOnlyAfterExplicitCommitNinth",
    "sequenceNoPartialCommitWithoutRollbackPlan",
    "importJobWriteForbiddenNow",
    "stagingRowWriteForbiddenNow",
    "transactionWriteForbiddenNow",
    "inventoryWriteForbiddenNow",
    "rollbackImplementationForbiddenNow",
    "unresolvedSkuCannotDeductInventory",
    "reconciliationWriteForbiddenNow",
    "commitEligibleCountRequired",
    "readyForPreviewServiceImplementationPlan",
    "readyForDryRunRuntimeFixtureSmoke",
    "readyForControllerRouteContract",
  ];

  for (const marker of requiredDtoMarkers) {
    assert(dtoSource.includes(marker), `Step140-G DTO marker exists: ${marker}`);
  }

  const forbiddenDtoMarkers = [
    "prisma.importJob.create",
    "prisma.importJob.update",
    "prisma.importStagingRow.create",
    "prisma.importStagingRow.createMany",
    "prisma.transaction.create",
    "prisma.transaction.createMany",
    "prisma.inventoryMovement.create",
    "prisma.inventoryMovement.createMany",
    "prisma.inventoryBalance.update",
    "prisma.inventoryBalance.upsert",
    "fetch(",
    "axios.",
    "got(",
    "getOrders({",
    "getOrder({",
    "getOrderItems({",
  ];

  for (const marker of forbiddenDtoMarkers) {
    assert(!dtoSource.includes(marker), `Step140-G DTO does not contain implementation marker: ${marker}`);
  }

  const contract = assertAmazonSpApiOrdersPreviewCommitServiceContract(
    buildAmazonSpApiOrdersPreviewCommitServiceContract(),
  );

  assert(contract.step === "Step140-G", "contract step is Step140-G");
  assert(contract.contractOnly === true, "contract remains contract-only");
  assert(contract.previewServiceImplementationNow === false, "preview implementation remains disabled");
  assert(contract.commitServiceImplementationNow === false, "commit implementation remains disabled");
  assert(contract.rollbackImplementationNow === false, "rollback implementation remains disabled");
  assert(contract.writesDatabase === false, "contract writes no database");
  assert(contract.realAmazonOrdersApiCallNow === false, "real Amazon call remains disabled");
  assert(contract.sampleServiceContract.expectedPreviewWritesDatabase === false, "sample preview writes nothing");
  assert(contract.sampleServiceContract.expectedCommitWritesDatabaseNow === false, "sample commit writes nothing now");
  assert(contract.forbiddenNow.importJobCreate === true, "ImportJob create forbidden now");
  assert(contract.forbiddenNow.importStagingRowCreateMany === true, "ImportStagingRow createMany forbidden now");
  assert(contract.forbiddenNow.transactionCreate === true, "Transaction create forbidden now");
  assert(contract.forbiddenNow.inventoryMovementCreate === true, "InventoryMovement create forbidden now");
  assert(contract.summary.readyForPreviewServiceImplementation === false, "preview service implementation not allowed yet");
  assert(contract.summary.readyForCommitServiceImplementation === false, "commit service implementation not allowed yet");
  assert(contract.summary.readyForPreviewServiceImplementationPlan === true, "preview implementation plan allowed next");
  assert(contract.summary.readyForDryRunRuntimeFixtureSmoke === true, "dry-run fixture smoke allowed next");
  assert(contract.summary.readyForControllerRouteContract === true, "controller route contract allowed next");

  const implementationGuard = assertNoStep140GImplementationLeak(repoRoot);

  console.log("[SMOKE_OK] Step140-G Amazon SP-API Orders preview + commit service contract aggregate smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step140-G",
        contract: {
          version: contract.version,
          step: contract.step,
          contractOnly: contract.contractOnly,
          implementationNow: contract.implementationNow,
          previewServiceImplementationNow: contract.previewServiceImplementationNow,
          commitServiceImplementationNow: contract.commitServiceImplementationNow,
          rollbackImplementationNow: contract.rollbackImplementationNow,
          importJobWriteNow: contract.importJobWriteNow,
          importStagingRowWriteNow: contract.importStagingRowWriteNow,
          transactionWriteNow: contract.transactionWriteNow,
          inventoryWriteNow: contract.inventoryWriteNow,
          reconciliationWriteNow: contract.reconciliationWriteNow,
          writesDatabase: contract.writesDatabase,
          realAmazonOrdersApiCallNow: contract.realAmazonOrdersApiCallNow,
          aggregateBoundary: contract.aggregateBoundary,
          previewServiceContract: contract.previewServiceContract,
          commitServiceContract: contract.commitServiceContract,
          executionSequenceContract: contract.executionSequenceContract,
          importJobWriteGateContract: contract.importJobWriteGateContract,
          stagingRowWriteGateContract: contract.stagingRowWriteGateContract,
          transactionCommitGateContract: contract.transactionCommitGateContract,
          inventoryDeductionGateContract: contract.inventoryDeductionGateContract,
          rollbackCompensationContract: contract.rollbackCompensationContract,
          unresolvedSkuAuditContract: contract.unresolvedSkuAuditContract,
          reconciliationDeferredContract: contract.reconciliationDeferredContract,
          validationSummaryContract: contract.validationSummaryContract,
          sampleServiceContract: contract.sampleServiceContract,
          forbiddenNow: contract.forbiddenNow,
          summary: contract.summary,
        },
        implementationGuard,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
});
