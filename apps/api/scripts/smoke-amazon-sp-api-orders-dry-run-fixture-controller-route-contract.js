#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOrdersDryRunFixtureControllerRouteContract,
  buildAmazonSpApiOrdersDryRunFixtureControllerRouteContract,
} = require("../dist/src/imports/dto/amazon-sp-api-orders-dry-run-fixture-controller-route-contract.dto");

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
      if (["node_modules", "dist", ".next", "coverage", ".git"].includes(name)) continue;
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

function isAllowedStep140IPureDryRunFixtureFile(file, text) {
  const normalized = file.replaceAll(path.sep, "/");
  return (
    normalized.endsWith("apps/api/src/imports/amazon-sp-api-orders-dry-run-fixture.ts") &&
    text.includes("buildAmazonSpApiOrdersDryRunPreview") &&
    text.includes("writesDatabase: false") &&
    text.includes("realAmazonOrdersApiCall: false")
  );
}

function assertNoStep140HImplementationLeak(repoRoot) {
  const apiRoot = path.resolve(repoRoot, "apps/api");
  const apiSrcRoot = path.resolve(apiRoot, "src");
  const webSrcRoot = path.resolve(repoRoot, "apps/web/src");

  const apiFiles = listFiles(apiSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p)).filter((file) => !isDtoOrContractFile(file));
  const webFiles = listFiles(webSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));

  const routeLeaks = [];
  const dryRunLeaks = [];
  const controllerLeaks = [];
  const frontendLeaks = [];
  const writeLeaks = [];
  const networkLeaks = [];
  const schemaLeaks = [];

  const routePatterns = [
    /@Post\s*\([^)]*(amazon-sp-api.*orders.*preview|orders.*preview|amazon-sp-api.*orders.*commit|orders.*commit)/i,
    /@Get\s*\([^)]*(amazon-sp-api.*orders.*preview|orders.*preview|amazon-sp-api.*orders.*commit|orders.*commit)/i,
  ];

  const dryRunFragments = [
    "AmazonSpApiOrdersDryRunFixture",
    "runAmazonSpApiOrdersDryRun",
    "buildAmazonSpApiOrdersDryRunFixture",
    "sampleOrderCount: 2",
    "sampleOrderItemCount: 3",
  ];

  const controllerFragments = [
    "amazon-sp-api/orders/preview",
    "amazon-sp-api/orders/commit",
    "previewAmazonSpApiOrders",
    "commitAmazonSpApiOrders",
    "AmazonSpApiOrdersController",
  ];

  const frontendFragments = [
    "Amazon SP-API Orders",
    "amazon-sp-api-orders",
    "previewButtonWouldUseDryRunRoute",
    "commitButtonWouldRequireExplicitConfirm",
    "Import Center",
  ];

  const writeFragments = [
    "importJob.create",
    "importJob.update",
    "importStagingRow.create",
    "importStagingRow.createMany",
    "transaction.create",
    "transaction.createMany",
    "inventoryMovement.create",
    "inventoryBalance.update",
    "inventoryBalance.upsert",
  ];

  const networkFragments = [
    "fetch(",
    "axios.",
    "got(",
    "https.request(",
    "http.request(",
    "getOrders(",
    "getOrder(",
    "getOrderItems(",
    "/orders/v0/orders",
    "orders/v0/orders",
  ];

  for (const file of apiFiles) {
    const text = read(file);
    const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");
    const allowedSandbox = isAllowedExistingSandboxFile(file, text);
    const allowedStep140IPureDryRunFixture = isAllowedStep140IPureDryRunFixtureFile(file, text);
    const hasAmazonOrdersContext =
      text.includes("amazon-sp-api") ||
      text.includes("AmazonSpApi") ||
      text.includes("AmazonOrders") ||
      text.includes("AmazonSpApiOrders") ||
      text.includes("orders/v0/orders") ||
      text.includes("STEP140-H") ||
      text.includes("step140-h");

    for (const pattern of routePatterns) {
      if (pattern.test(text) && !allowedSandbox && !allowedStep140IPureDryRunFixture) routeLeaks.push(rel);
    }

    if (hasAmazonOrdersContext && dryRunFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox && !allowedStep140IPureDryRunFixture) {
      dryRunLeaks.push(rel);
    }

    if (hasAmazonOrdersContext && controllerFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox && !allowedStep140IPureDryRunFixture) {
      controllerLeaks.push(rel);
    }

    if (hasAmazonOrdersContext && writeFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox && !allowedStep140IPureDryRunFixture) {
      writeLeaks.push(rel);
    }

    if (hasAmazonOrdersContext && networkFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox && !allowedStep140IPureDryRunFixture) {
      networkLeaks.push(rel);
    }
  }

  for (const file of webFiles) {
    const text = read(file);
    const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");
    const hasAmazonOrdersFrontendContext =
      text.includes("amazon-sp-api-orders") ||
      text.includes("Amazon SP-API Orders") ||
      text.includes("orders/preview") ||
      text.includes("orders/commit") ||
      text.includes("STEP140-H") ||
      text.includes("step140-h");

    if (hasAmazonOrdersFrontendContext && frontendFragments.some((fragment) => text.includes(fragment))) {
      frontendLeaks.push(rel);
    }
  }

  const schema = read(path.resolve(apiRoot, "prisma/schema.prisma"));
  const forbiddenSchemaMarkers = [
    "model AmazonOrdersDryRun",
    "model AmazonOrdersPreviewRoute",
    "model AmazonOrdersCommitRoute",
    "model AmazonSpApiOrdersPreview",
    "model AmazonSpApiOrdersCommit",
  ];

  for (const marker of forbiddenSchemaMarkers) {
    if (schema.includes(marker)) schemaLeaks.push(marker);
  }

  assert(routeLeaks.length === 0, `no Step140-H controller route implementation leak: ${JSON.stringify(routeLeaks)}`);
  assert(dryRunLeaks.length === 0, `no Step140-H dry-run fixture implementation leak: ${JSON.stringify(dryRunLeaks)}`);
  assert(controllerLeaks.length === 0, `no Step140-H preview/commit controller implementation leak: ${JSON.stringify(controllerLeaks)}`);
  assert(frontendLeaks.length === 0, `no Step140-H frontend trigger implementation leak: ${JSON.stringify(frontendLeaks)}`);
  assert(writeLeaks.length === 0, `no Step140-H database write leak: ${JSON.stringify(writeLeaks)}`);
  assert(networkLeaks.length === 0, `no Step140-H Amazon Orders network leak: ${JSON.stringify(networkLeaks)}`);
  assert(schemaLeaks.length === 0, `no Step140-H Prisma schema model leak: ${JSON.stringify(schemaLeaks)}`);

  return {
    scannedApiImplementationFiles: apiFiles.length,
    scannedWebFiles: webFiles.length,
    routeLeaks,
    dryRunLeaks,
    controllerLeaks,
    frontendLeaks,
    writeLeaks,
    networkLeaks,
    schemaLeaks,
  };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");

  console.log("========== Step140-H Amazon SP-API Orders dry-run fixture smoke + controller route contract smoke ==========");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-dry-run-fixture-controller-route-contract"] ===
      "node scripts/smoke-amazon-sp-api-orders-dry-run-fixture-controller-route-contract.js",
    "apps/api package.json registers Step140-H smoke",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-preview-commit-service-contract"],
    "Step140-G preview commit regression smoke remains registered",
  );

  const step140GDtoSource = read(path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-orders-preview-commit-service-contract.dto.ts"));
  assert(step140GDtoSource.includes("readyForDryRunRuntimeFixtureSmoke: true"), "Step140-G allows dry-run fixture smoke contract");
  assert(step140GDtoSource.includes("readyForControllerRouteContract: true"), "Step140-G allows controller route contract");

  const dtoSource = read(path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-orders-dry-run-fixture-controller-route-contract.dto.ts"));

  const requiredDtoMarkers = [
    "AMAZON_SP_API_ORDERS_DRY_RUN_FIXTURE_CONTROLLER_ROUTE_CONTRACT_VERSION",
    "buildAmazonSpApiOrdersDryRunFixtureControllerRouteContract",
    "assertAmazonSpApiOrdersDryRunFixtureControllerRouteContract",
    "assertAmazonSpApiOrdersPreviewCommitServiceContract",
    "design-amazon-sp-api-orders-dry-run-fixture-controller-route-contract-aggregate-only",
    "dryRunFixtureSmokeDesignOnly",
    "previewControllerRouteDesignOnly",
    "commitControllerRouteDesignOnly",
    "tenantStoreMarketplaceGuardDesignOnly",
    "importCenterVisibilityDesignOnly",
    "frontendTriggerReadinessDesignOnly",
    "usesSyntheticOrdersFixtureOnly",
    "validatesInventoryImpactPreviewShape",
    "pathWouldBeApiImportsAmazonSpApiOrdersPreview",
    "pathWouldBeApiImportsAmazonSpApiOrdersCommit",
    "requiresPreviewTokenOrSnapshot",
    "connectionStatusPanelWouldGateAction",
    "previewButtonWouldUseDryRunRoute",
    "commitButtonWouldRequireExplicitConfirm",
    "sourceRequired: 'amazon-sp-api-orders-dry-run-fixture-design-only'",
    "sampleOrderCount: 2",
    "sampleOrderItemCount: 3",
    "expectedControllerRouteNow: false",
    "readyForDryRunFixtureImplementationPlan",
    "readyForPreviewControllerImplementationPlan",
    "readyForImportCenterUiContract",
  ];

  for (const marker of requiredDtoMarkers) {
    assert(dtoSource.includes(marker), `Step140-H DTO marker exists: ${marker}`);
  }

  const forbiddenDtoMarkers = [
    "@Post(",
    "@Get(",
    "prisma.importJob.create",
    "prisma.importStagingRow.create",
    "prisma.transaction.create",
    "prisma.inventoryMovement.create",
    "fetch(",
    "axios.",
    "got(",
    "getOrders({",
    "getOrder({",
    "getOrderItems({",
  ];

  for (const marker of forbiddenDtoMarkers) {
    assert(!dtoSource.includes(marker), `Step140-H DTO does not contain implementation marker: ${marker}`);
  }

  const contract = assertAmazonSpApiOrdersDryRunFixtureControllerRouteContract(
    buildAmazonSpApiOrdersDryRunFixtureControllerRouteContract(),
  );

  assert(contract.step === "Step140-H", "contract step is Step140-H");
  assert(contract.contractOnly === true, "contract remains contract-only");
  assert(contract.dryRunRuntimeFixtureImplementationNow === false, "dry-run runtime implementation remains disabled");
  assert(contract.previewRouteImplementationNow === false, "preview route implementation remains disabled");
  assert(contract.commitRouteImplementationNow === false, "commit route implementation remains disabled");
  assert(contract.importCenterImplementationNow === false, "Import Center implementation remains disabled");
  assert(contract.frontendTriggerImplementationNow === false, "frontend trigger implementation remains disabled");
  assert(contract.writesDatabase === false, "contract writes no database");
  assert(contract.realAmazonOrdersApiCallNow === false, "real Amazon call remains disabled");
  assert(contract.sampleDryRunFixtureContract.expectedDryRun === true, "sample is dry-run");
  assert(contract.sampleDryRunFixtureContract.expectedWritesDatabase === false, "sample writes nothing");
  assert(contract.sampleDryRunFixtureContract.expectedAmazonNetworkCall === false, "sample does not call Amazon");
  assert(contract.forbiddenNow.controllerRoute === true, "controller route forbidden now");
  assert(contract.forbiddenNow.frontendPanel === true, "frontend panel forbidden now");
  assert(contract.forbiddenNow.importJobCreate === true, "ImportJob create forbidden now");
  assert(contract.forbiddenNow.transactionCreate === true, "Transaction create forbidden now");
  assert(contract.forbiddenNow.inventoryMovementCreate === true, "InventoryMovement create forbidden now");
  assert(contract.summary.readyForDryRunRuntimeFixtureImplementation === false, "dry-run implementation not allowed yet");
  assert(contract.summary.readyForControllerRouteImplementation === false, "controller route implementation not allowed yet");
  assert(contract.summary.readyForDryRunFixtureImplementationPlan === true, "dry-run implementation plan allowed next");
  assert(contract.summary.readyForPreviewControllerImplementationPlan === true, "preview controller implementation plan allowed next");
  assert(contract.summary.readyForImportCenterUiContract === true, "Import Center UI contract allowed next");

  const implementationGuard = assertNoStep140HImplementationLeak(repoRoot);

  console.log("[SMOKE_OK] Step140-H Amazon SP-API Orders dry-run fixture smoke + controller route contract smoke passed");
  console.log(JSON.stringify({ ok: true, step: "Step140-H", contract, implementationGuard }, null, 2));
}

main().catch((err) => {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
});
