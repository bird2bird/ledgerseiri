#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  assertAmazonSpApiRealConnectionBoundaryLwaPreparationContract,
  buildAmazonSpApiRealConnectionBoundaryLwaPreparationContract,
} = require("../dist/src/imports/dto/amazon-sp-api-real-connection-boundary-lwa-preparation-contract.dto");
const {
  assertStep122ReadModelFrontendBoundary,
} = require("./lib/step122-read-model-frontend-boundary");

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

    if (stat.isDirectory()) {
      listFiles(p, predicate, acc);
    } else if (predicate(p)) {
      acc.push(p);
    }
  }

  return acc;
}

function isApiContractOrDto(file) {
  return file.includes(`${path.sep}src${path.sep}imports${path.sep}dto${path.sep}`) || file.endsWith(".dto.ts");
}

function assertNoForbiddenImplementation(repoRoot) {
  const apiRoot = path.resolve(repoRoot, "apps/api");
  const apiSrcRoot = path.resolve(apiRoot, "src");

  // Step123-A FIX1:
  // Only implementation source is scanned for real SP-API/LWA/token/write leaks.
  // DTO contract files and smoke scripts are allowed to contain forbidden keywords as boundary definitions.
  const apiImplementationFiles = listFiles(apiSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p))
    .filter((file) => !isApiContractOrDto(file));

  const realImplementationLeaks = [];
  const tokenPersistenceLeaks = [];
  const schemaLeaks = [];
  const writeLeaks = [];

  const realImplementationFragments = [
    "sellingpartnerapi",
    "selling-partner-api",
    "getOrders(",
    "getOrder(",
    "getOrderItems(",
    "createReport(",
    "getReport(",
    "getReportDocument(",
    "reports/2021-06-30",
    "lwa.amazon.com/auth/o2/token",
    "api.amazon.com/auth/o2/token",
    "LoginWithAmazon",
    "loginWithAmazon",
  ];

  // Step123-A FIX2: distinguish app auth JWT tokens from Amazon LWA tokens.
  // LedgerSeiri already has first-party auth cookies/access_token/refresh sessions.
  // Those must not be treated as Amazon SP-API/LWA token persistence.
  const amazonLwaContextFragments = [
    "AmazonSpApiCredential",
    "AmazonSpApiToken",
    "AmazonSpApiConnection",
    "AmazonSpApiOAuthState",
    "sellingpartnerapi",
    "selling-partner-api",
    "LoginWithAmazon",
    "loginWithAmazon",
    "lwa.amazon.com",
    "api.amazon.com/auth/o2/token",
    "lwaAuthorization",
  ];

  const amazonLwaTokenFragments = [
    "refresh_token",
    "access_token",
    "client_secret",
    "client_id",
    "AmazonSpApiCredential",
    "AmazonSpApiToken",
    "tokenPersistence",
  ];

  // Step123-A FIX3: only treat writes as leaks inside Amazon real/LWA/report context.
  // LedgerSeiri already has normal transaction/payment/inventory/import services;
  // those existing domain writes are not Amazon real-connection writes.
  const amazonRealConnectionWriteContextFragments = [
    "AmazonSpApiReal",
    "amazon-sp-api-real",
    "realSourceType: 'amazon-sp-api'",
    'realSourceType: "amazon-sp-api"',
    "sourceType: 'amazon-sp-api'",
    'sourceType: "amazon-sp-api"',
    "lwa-oauth",
    "LoginWithAmazon",
    "loginWithAmazon",
    "sellingpartnerapi",
    "selling-partner-api",
    "createReport(",
    "getReport(",
    "getReportDocument(",
    "reports/2021-06-30",
    "sp-api-report-readonly",
  ];

  const writeFragments = [
    "transaction.create",
    "transaction.createMany",
    "inventoryMovement.create",
    "inventoryMovement.createMany",
    "inventoryBalance.create",
    "inventoryBalance.update",
    "commitSales: true",
    "executeInventory: true",
  ];

  for (const file of apiImplementationFiles) {
    const text = read(file);
    const rel = path.relative(repoRoot, file);

    if (realImplementationFragments.some((fragment) => text.includes(fragment))) {
      realImplementationLeaks.push(rel);
    }

    const hasAmazonLwaContext = amazonLwaContextFragments.some((fragment) => text.includes(fragment));
    const hasAmazonLwaToken = amazonLwaTokenFragments.some((fragment) => text.includes(fragment));
    const isSandboxOnlyContext =
      text.includes("AmazonSpApiSandbox") ||
      text.includes("amazon-sp-api-sandbox") ||
      text.includes("tokenRows: 0");

    if (hasAmazonLwaToken && hasAmazonLwaContext && !isSandboxOnlyContext) {
      tokenPersistenceLeaks.push(rel);
    }

    const hasAmazonRealWriteContext = amazonRealConnectionWriteContextFragments.some((fragment) =>
      text.includes(fragment),
    );
    const hasDomainWrite = writeFragments.some((fragment) => text.includes(fragment));
    const isSandboxOnlyWriteContext =
      text.includes("AmazonSpApiSandbox") ||
      text.includes("amazon-sp-api-sandbox") ||
      text.includes("AMAZON_ORDER_SP_API");

    if (hasDomainWrite && hasAmazonRealWriteContext && !isSandboxOnlyWriteContext) {
      writeLeaks.push(rel);
    }
  }

  const schema = read(path.resolve(apiRoot, "prisma/schema.prisma"));
  for (const forbiddenModel of [
    "model AmazonSpApiCredential",
    "model AmazonSpApiToken",
    "model AmazonSpApiConnection",
    "model AmazonSpApiOAuthState",
  ]) {
    if (schema.includes(forbiddenModel)) {
      schemaLeaks.push(forbiddenModel);
    }
  }

  assert(realImplementationLeaks.length === 0, `real SP-API/LWA implementation leak detected: ${JSON.stringify(realImplementationLeaks)}`);
  assert(tokenPersistenceLeaks.length === 0, `token persistence leak detected: ${JSON.stringify(tokenPersistenceLeaks)}`);
  assert(schemaLeaks.length === 0, `schema leak detected: ${JSON.stringify(schemaLeaks)}`);
  assert(writeLeaks.length === 0, `transaction/inventory write leak detected: ${JSON.stringify(writeLeaks)}`);

  return {
    scannedApiImplementationFiles: apiImplementationFiles.length,
    excludedDtoContracts: true,
    excludedSmokeScripts: true,
    realImplementationLeaks,
    tokenPersistenceLeaks,
    schemaLeaks,
    writeLeaks,
  };
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(root, "..", "..");
  const packageJson = JSON.parse(read(path.resolve(root, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-real-connection-boundary-lwa-preparation-contract"],
    "Step123-A npm script missing",
  );

  const contract = assertAmazonSpApiRealConnectionBoundaryLwaPreparationContract(
    buildAmazonSpApiRealConnectionBoundaryLwaPreparationContract(),
  );

  const controllerSource = read(path.resolve(root, "src/imports/imports.controller.ts"));
  const serviceSource = read(path.resolve(root, "src/imports/imports.service.ts"));

  assert(controllerSource.includes("@UseGuards(JwtAuthGuard)"), "Step122 read-model route must remain JWT guarded");
  assert(controllerSource.includes("dryRun: true"), "Step122 read-model route must still force dryRun=true");
  assert(serviceSource.includes("listAmazonSpApiSandboxImportJobsReadModelDryRun"), "Step122 read-model service must remain");

  const frontendBoundary = assertStep122ReadModelFrontendBoundary(repoRoot, {
    allowClientHelper: true,
    allowRuntimePanelHelperUse: true,
  });

  const implementationGuard = assertNoForbiddenImplementation(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api real connection boundary / LWA preparation contract smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step123-A",
        contract: {
          version: contract.version,
          contractOnly: contract.contractOnly,
          implementationNow: contract.implementationNow,
          backendRouteAddedNow: contract.backendRouteAddedNow,
          frontendRouteAddedNow: contract.frontendRouteAddedNow,
          schemaChangedNow: contract.schemaChangedNow,
          tokenPersistenceNow: contract.tokenPersistenceNow,
          realSpApiRequestNow: contract.realSpApiRequestNow,
          writesDatabase: contract.writesDatabase,
          connectionBoundary: contract.connectionBoundary,
          lwaPreparationContract: contract.lwaPreparationContract,
          futureCredentialStoragePolicy: contract.futureCredentialStoragePolicy,
          futureReportPipelineBoundary: contract.futureReportPipelineBoundary,
          forbiddenNow: contract.forbiddenNow,
          summary: contract.summary,
        },
        frontendBoundary,
        implementationGuard,
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
  });
