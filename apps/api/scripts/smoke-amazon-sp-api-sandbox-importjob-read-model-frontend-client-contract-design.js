#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  buildAmazonSpApiSandboxImportJobReadModelFrontendClientContract,
  assertAmazonSpApiSandboxImportJobReadModelFrontendClientContract,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-importjob-read-model-frontend-client-contract.dto");

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

// Step122-X FIX5: UI shell and the dedicated client helper file are allowed.
// Runtime page/shell integration remains forbidden until Step122-Y.
function assertNoFrontendClientImplementation(repoRoot) {
  const webRoot = path.resolve(repoRoot, "apps/web/src");
  const step122XClientFile = path.resolve(repoRoot, "apps/web/src/lib/api/amazonSpApiSandboxImportJobReadModelClient.ts");
  const step122WShellFile = path.resolve(repoRoot, "apps/web/src/components/app/imports/AmazonSpApiSandboxReadModelPanelShell.tsx");
  const webFiles = listFiles(webRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));
  const leaks = [];

  for (const file of webFiles) {
    const text = read(file);
    const rel = path.relative(repoRoot, file);
    const isClientFile = file === step122XClientFile;
    const isShellFile = file === step122WShellFile;

    if (!isClientFile && text.includes("/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model")) {
      leaks.push(`${rel}: endpoint string outside client helper`);
    }

    if (!isClientFile && text.includes("fetchAmazonSpApiSandboxImportJobReadModel")) {
      leaks.push(`${rel}: client helper referenced before Step122-Y`);
    }

    if (!isClientFile && text.includes("amazonSpApiSandboxImportJobReadModelClient")) {
      leaks.push(`${rel}: client helper module referenced before Step122-Y`);
    }

    if (isShellFile && (text.includes("fetch(") || text.includes("useEffect(") || text.includes("axios") || text.includes("XMLHttpRequest"))) {
      leaks.push(`${rel}: shell must remain static in Step122-X`);
    }
  }

  assert(
    leaks.length === 0,
    "Step122-V/Step122-X-aware guard: apps/web may contain shell and client helper, but page/shell must not import/fetch yet. " + JSON.stringify(leaks),
  );

  return {
    scannedFiles: webFiles.length,
    frontendClientLeaks: leaks,
  };
}


async function main() {
  const root = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(root, "..", "..");

  const packageJson = JSON.parse(read(path.resolve(root, "package.json")));
  const controllerSource = read(path.resolve(root, "src/imports/imports.controller.ts"));
  const serviceSource = read(path.resolve(root, "src/imports/imports.service.ts"));
  const schema = read(path.resolve(root, "prisma/schema.prisma"));
  const frontendContractSource = read(path.resolve(root, "src/imports/dto/amazon-sp-api-sandbox-importjob-read-model-frontend-contract.dto.ts"));
  const jwtNegativeSource = read(path.resolve(root, "src/imports/dto/amazon-sp-api-sandbox-importjob-read-model-jwt-negative-hardening.dto.ts"));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-sandbox-importjob-read-model-frontend-client-contract-design"],
    "Step122-V npm script missing",
  );

  const contract = assertAmazonSpApiSandboxImportJobReadModelFrontendClientContract(
    buildAmazonSpApiSandboxImportJobReadModelFrontendClientContract(),
  );

  assert(contract.designOnly === true, "Step122-V must remain design-only");
  assert(contract.frontendClientImplementedNow === false, "frontend client must not be implemented now");
  assert(contract.appsWebModifiedNow === false, "apps/web must not be modified now");
  assert(contract.backendChangedNow === false, "backend must not be changed by Step122-V");
  assert(contract.schemaChangedNow === false, "schema must not be changed by Step122-V");
  assert(contract.writesDatabase === false, "Step122-V must not write database");

  assert(frontendContractSource.includes("AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_FRONTEND_CONTRACT_VERSION"), "Step122-U frontend contract source missing");
  assert(frontendContractSource.includes("error401Unauthenticated"), "Step122-U 401 UI state missing");
  assert(frontendContractSource.includes("commitSalesDisabled"), "Step122-U commit disabled contract missing");
  assert(jwtNegativeSource.includes("wrongSignatureReturns401"), "Step122-T wrong signature contract missing");
  assert(jwtNegativeSource.includes("suspendedTenantReturns403"), "Step122-T suspended tenant contract missing");

  const routeSource = routeSourceFrom(controllerSource);

  assert(routeSource.includes("@UseGuards(JwtAuthGuard)"), "backend route must remain JWT guarded");
  assert(routeSource.includes("@Get('internal/amazon-sp-api-sandbox/import-jobs/read-model')"), "backend read-model route missing");
  assert(routeSource.includes("req.user?.companyId"), "backend route must derive companyId from authenticated user");
  assert(routeSource.includes("dryRun: true"), "backend route must force dryRun=true");
  assert(routeSource.includes("companyId,"), "backend route must pass companyId to service");

  assert(serviceSource.includes("async ['listAmazonSpApiSandboxImportJobsReadModelDryRun']("), "read-model service method missing");

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

  for (const forbiddenQuery of contract.requestBuilderContract.forbiddenQuery) {
    assert(
      !contract.requestBuilderContract.allowedQuery.filter.includes(forbiddenQuery) &&
        !contract.requestBuilderContract.allowedQuery.sort.includes(forbiddenQuery),
      `forbidden query must not be accepted as filter/sort: ${forbiddenQuery}`,
    );
  }

  for (const forbiddenField of contract.projectedRowParserContract.forbiddenFieldsHardFail) {
    assert(
      !contract.projectedRowParserContract.allowedFields.includes(forbiddenField),
      `forbidden projected field must not be allowed: ${forbiddenField}`,
    );
  }

  const expectedStatuses = [200, 400, 401, 403];
  assert(
    JSON.stringify(contract.responseParserContract.acceptedStatus) === JSON.stringify(expectedStatuses),
    "frontend client accepted statuses mismatch",
  );

  const frontendGuard = assertNoFrontendClientImplementation(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api sandbox ImportJob read-model frontend client contract design smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step122-V",
        contract: {
          version: contract.version,
          designOnly: contract.designOnly,
          frontendClientImplementedNow: contract.frontendClientImplementedNow,
          appsWebModifiedNow: contract.appsWebModifiedNow,
          backendChangedNow: contract.backendChangedNow,
          schemaChangedNow: contract.schemaChangedNow,
          writesDatabase: contract.writesDatabase,
          futureClientModule: contract.futureClientModule,
          requestBuilderContract: contract.requestBuilderContract,
          responseParserContract: contract.responseParserContract,
          projectedRowParserContract: contract.projectedRowParserContract,
          uiStateMappingContract: contract.uiStateMappingContract,
          safetyPolicy: contract.safetyPolicy,
          summary: contract.summary,
        },
        guards: {
          frontendClientStillUnimplemented: true,
          appsWebStillUnmodified: true,
          backendStillJwtGuarded: true,
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
