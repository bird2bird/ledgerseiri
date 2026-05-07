#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  buildAmazonSpApiSandboxImportJobReadModelFrontendContract,
  assertAmazonSpApiSandboxImportJobReadModelFrontendContract,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-importjob-read-model-frontend-contract.dto");

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

function routeSourceFrom(controllerSource) {
  const marker = "Step122-O: Amazon SP-API sandbox ImportJob read-model readonly controller service-call implementation.";
  const start = controllerSource.indexOf(marker);
  const end = controllerSource.indexOf("@Post('detect-month-conflicts')", start);
  assert(start >= 0, "Step122-O route marker missing");
  assert(end > start, "Step122-O route end anchor missing");
  return controllerSource.slice(start, end);
}

function assertNoFrontendImplementation(repoRoot) {
  const webRoot = path.resolve(repoRoot, "apps/web/src");
  const webFiles = listFiles(webRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));
  const leaks = [];

  for (const file of webFiles) {
    const text = read(file);
    if (
      text.includes("/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model") ||
      text.includes("internal/amazon-sp-api-sandbox/import-jobs/read-model") ||
      text.includes("listAmazonSpApiSandboxImportJobsReadModelDryRun") ||
      text.includes("Amazon SP-API Sandbox ImportJob ReadModel Panel") ||
      text.includes("amazon-sp-api-sandbox-importjob-read-model")
    ) {
      leaks.push(path.relative(repoRoot, file));
    }
  }

  assert(leaks.length === 0, `Step122-U must not modify apps/web or add frontend fetch yet: ${JSON.stringify(leaks)}`);

  return {
    scannedFiles: webFiles.length,
    frontendLeaks: leaks,
  };
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(root, "..", "..");

  const packageJson = JSON.parse(read(path.resolve(root, "package.json")));
  const controllerSource = read(path.resolve(root, "src/imports/imports.controller.ts"));
  const serviceSource = read(path.resolve(root, "src/imports/imports.service.ts"));
  const schema = read(path.resolve(root, "prisma/schema.prisma"));
  const projectionContractSource = read(path.resolve(root, "src/imports/dto/amazon-sp-api-sandbox-importjob-list-query-projection-contract.dto.ts"));
  const jwtNegativeSource = read(path.resolve(root, "src/imports/dto/amazon-sp-api-sandbox-importjob-read-model-jwt-negative-hardening.dto.ts"));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-sandbox-importjob-read-model-frontend-contract-design"],
    "Step122-U npm script missing",
  );

  const contract = assertAmazonSpApiSandboxImportJobReadModelFrontendContract(
    buildAmazonSpApiSandboxImportJobReadModelFrontendContract(),
  );

  assert(contract.designOnly === true, "Step122-U must remain design-only");
  assert(contract.frontendImplementedNow === false, "frontend must not be implemented now");
  assert(contract.frontendFetchImplementedNow === false, "frontend fetch must not be implemented now");
  assert(contract.backendChangedNow === false, "backend must not be changed by Step122-U");
  assert(contract.schemaChangedNow === false, "schema must not be changed by Step122-U");
  assert(contract.writesDatabase === false, "Step122-U must not write database");

  assert(jwtNegativeSource.includes("missingTokenReturns401: true"), "Step122-T negative hardening source missing 401 contract");
  assert(jwtNegativeSource.includes("suspendedTenantReturns403: true"), "Step122-T negative hardening source missing 403 contract");

  const routeSource = routeSourceFrom(controllerSource);

  assert(routeSource.includes("@UseGuards(JwtAuthGuard)"), "backend route must remain JWT guarded");
  assert(routeSource.includes("@Get('internal/amazon-sp-api-sandbox/import-jobs/read-model')"), "backend read-model route missing");
  assert(routeSource.includes("req.user?.companyId"), "backend route must derive companyId from authenticated user");
  assert(routeSource.includes("dryRun: true"), "backend route must force dryRun=true");
  assert(routeSource.includes("STEP122_P_HTTP_QUERY_VALIDATION_BAD_REQUEST"), "backend route must preserve 400 query boundary");
  assert(routeSource.includes("STEP122_S_AUTH_COMPANY_REQUIRED"), "backend route must preserve 403 missing company boundary");

  assert(serviceSource.includes("async ['listAmazonSpApiSandboxImportJobsReadModelDryRun']("), "read-model service method missing");

  for (const expectedField of [
    "allowedActions",
    "classification",
    "displayStatus",
    "stagingRows",
    "sourceType",
    "filename",
  ]) {
    assert(
      projectionContractSource.includes(expectedField),
      `projection contract must include frontend allowed field ${expectedField}`,
    );
  }

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
    "deleteMany",
    "createMany",
    "updateMany",
  ]) {
    assert(!routeSource.includes(forbidden), `route must not contain forbidden fragment: ${forbidden}`);
  }

  for (const forbiddenModel of [
    "AmazonSpApiSandboxImportJobReadModel",
    "AmazonSpApiCredential",
    "AmazonSpApiToken",
    "CrossSourceDedupe",
  ]) {
    assert(!schema.includes(forbiddenModel), `schema must not contain ${forbiddenModel}`);
  }

  for (const forbiddenField of contract.rowDisplayContract.forbiddenFields) {
    assert(
      !contract.rowDisplayContract.allowedFields.includes(forbiddenField),
      `forbidden frontend row field must not be allowed: ${forbiddenField}`,
    );
  }

  const frontendGuard = assertNoFrontendImplementation(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api sandbox ImportJob read-model frontend contract design smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step122-U",
        contract: {
          version: contract.version,
          designOnly: contract.designOnly,
          frontendImplementedNow: contract.frontendImplementedNow,
          frontendFetchImplementedNow: contract.frontendFetchImplementedNow,
          backendChangedNow: contract.backendChangedNow,
          schemaChangedNow: contract.schemaChangedNow,
          writesDatabase: contract.writesDatabase,
          targetFrontendSurface: contract.targetFrontendSurface,
          endpointContract: contract.endpointContract,
          rowDisplayContract: contract.rowDisplayContract,
          frontendStateContract: contract.frontendStateContract,
          actionPolicy: contract.actionPolicy,
          futureUiCopy: contract.futureUiCopy,
          summary: contract.summary,
        },
        guards: {
          jwtGuardedBackendRoute: true,
          frontendStillUnwired: true,
          schemaStillDisabled: true,
          realSpApiStillDisabled: true,
          oauthStillDisabled: true,
          tokenPersistenceStillDisabled: true,
          commitSalesStillDisabled: true,
          inventoryExecutionStillDisabled: true,
        },
        frontendGuard,
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
