#!/usr/bin/env node
"use strict";

process.env.AMAZON_SP_API_SANDBOX_INTERNAL_ENABLED = "true";
process.env.AMAZON_SP_API_REAL_ENABLED = "false";
process.env.AMAZON_SP_API_OAUTH_ENABLED = "false";
process.env.AMAZON_SP_API_TOKEN_PERSISTENCE_ENABLED = "false";
process.env.AMAZON_SP_API_SANDBOX_IMPORTJOB_PERSISTENCE_ENABLED = "false";

const fs = require("fs");
const path = require("path");
const {
  buildAmazonSpApiSandboxImportJobReadModelReadonlyEndpointContract,
  assertAmazonSpApiSandboxImportJobReadModelReadonlyEndpointContract,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-importjob-read-model-readonly-endpoint-contract.dto");

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

  return {
    controllerFiles: controllerFiles.map((file) => path.relative(root, file)),
    exposedRoutes,
  };
}

function extractStep122KRouteSource(controllerSource) {
  const start = controllerSource.indexOf(
    "Step122-K: Amazon SP-API sandbox ImportJob read-model env-gated blocked controller route.",
  );
  const end = controllerSource.indexOf("@Post('detect-month-conflicts')", start);

  assert(start >= 0, "Step122-K blocked route marker missing");
  assert(end > start, "Step122-K route end anchor missing");

  return controllerSource.slice(start, end);
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(root, "..", "..");
  const srcRoot = path.resolve(root, "src");
  const webSrcRoot = path.resolve(repoRoot, "apps/web/src");

  const packageFile = path.resolve(root, "package.json");
  const schemaFile = path.resolve(root, "prisma/schema.prisma");
  const serviceFile = path.resolve(root, "src/imports/imports.service.ts");
  const controllerFile = path.resolve(root, "src/imports/imports.controller.ts");
  const dtoFile = path.resolve(root, "src/imports/dto/amazon-sp-api-sandbox-importjob-read-model-readonly-endpoint-contract.dto.ts");

  const pkg = JSON.parse(read(packageFile));
  const schema = read(schemaFile);
  const serviceSource = read(serviceFile);
  const controllerSource = read(controllerFile);
  const dtoSource = read(dtoFile);

  assert(
    pkg.scripts["smoke:amazon-sp-api-sandbox-importjob-read-model-readonly-endpoint-contract"],
    "Step122-L smoke script missing",
  );

  const contract = assertAmazonSpApiSandboxImportJobReadModelReadonlyEndpointContract(
    buildAmazonSpApiSandboxImportJobReadModelReadonlyEndpointContract(),
  );

  assert(contract.version === "amazon-sp-api-sandbox-importjob-read-model-readonly-endpoint-contract-v1", "version mismatch");
  assert(contract.contractOnly === true, "contractOnly must remain true");
  assert(contract.readonlyEndpointImplementedNow === false, "readonlyEndpointImplementedNow must remain false");
  assert(contract.routeCurrentlyBlocked === true, "routeCurrentlyBlocked must remain true");
  assert(contract.controllerMayCallServiceNow === false, "controllerMayCallServiceNow must remain false");
  assert(contract.controllerMayReturnRowsNow === false, "controllerMayReturnRowsNow must remain false");
  assert(contract.frontendExposedNow === false, "frontendExposedNow must remain false");
  assert(contract.writesDatabase === false, "writesDatabase must remain false");

  assert(
    contract.futureServiceCallPolicy.serviceMethod === "listAmazonSpApiSandboxImportJobsReadModelDryRun",
    "future service method mismatch",
  );
  assert(
    contract.futureServiceCallPolicy.allowedWhen.frontendExposedNow === false,
    "future service call policy must keep frontend disabled",
  );
  assert(
    contract.futureServiceCallPolicy.allowedWhen.writesDatabase === false,
    "future service call policy must keep writes disabled",
  );
  assert(contract.futureServiceCallPolicy.allowedWhen.dryRun === true, "future service call must require dryRun=true");

  assert(
    serviceSource.includes("async ['listAmazonSpApiSandboxImportJobsReadModelDryRun']("),
    "Step122-F internal service method must still exist",
  );
  assert(
    !serviceSource.includes("async listAmazonSpApiSandboxImportJobsReadModelDryRun("),
    "Step122-F service method must remain computed-name guarded",
  );

  assert(
    controllerSource.includes("@Get('internal/amazon-sp-api-sandbox/import-jobs/read-model')"),
    "Step122-K blocked GET route must still exist",
  );
  assert(
    controllerSource.includes("STEP122_K_CONTROLLER_BLOCKED_ROUTE_NOT_OPEN"),
    "Step122-K blocked route must still block",
  );

  const routeSource = extractStep122KRouteSource(controllerSource);

  assert(
    routeSource.includes("assertAmazonSpApiSandboxEnvironmentGate({ requireInternalSandbox: true })"),
    "Step122-K route must remain env-gated",
  );
  assert(
    routeSource.includes("normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery(query)"),
    "Step122-K route must continue query validation",
  );

  for (const forbidden of [
    "listAmazonSpApiSandboxImportJobsReadModelDryRun",
    "this.service.",
    "rawPayloadJson",
    "normalizedPayloadJson",
    "dedupeHash",
    "transaction.find",
    "inventoryMovement.find",
    "inventoryBalance.find",
    "return this.service",
    "return {",
    "rows:",
  ]) {
    assert(!routeSource.includes(forbidden), `Step122-K route must not contain forbidden fragment: ${forbidden}`);
  }

  const routeScan = scanControllerRoutes(root, srcRoot);
  const readModelRoutes = routeScan.exposedRoutes.filter(
    (route) => String(route.route || "") === "internal/amazon-sp-api-sandbox/import-jobs/read-model",
  );
  const unexpectedRoutes = routeScan.exposedRoutes.filter(
    (route) => String(route.route || "") !== "internal/amazon-sp-api-sandbox/import-jobs/read-model",
  );

  assert(readModelRoutes.length === 1, `expected exactly one blocked read-model route, got ${JSON.stringify(readModelRoutes)}`);
  assert(readModelRoutes[0].method === "Get", "blocked read-model route must be GET");
  assert(unexpectedRoutes.length === 0, `unexpected SP-API routes: ${JSON.stringify(unexpectedRoutes)}`);

  const webFiles = listFiles(webSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));
  const frontendLeaks = [];
  for (const file of webFiles) {
    const text = read(file);
    if (
      text.includes("/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model") ||
      text.includes("STEP122_K_CONTROLLER_BLOCKED_ROUTE_NOT_OPEN") ||
      text.includes("amazon-sp-api-sandbox/import-jobs/read-model")
    ) {
      frontendLeaks.push(path.relative(repoRoot, file));
    }
  }
  assert(frontendLeaks.length === 0, `frontend leak detected: ${JSON.stringify(frontendLeaks)}`);

  for (const forbiddenModel of [
    "AmazonSpApiSandboxImportJobReadModel",
    "AmazonSpApiCredential",
    "AmazonSpApiToken",
    "CrossSourceDedupe",
  ]) {
    assert(!schema.includes(forbiddenModel), `schema must not contain ${forbiddenModel}`);
  }

  assert(dtoSource.includes("readonlyEndpointImplementedNow: false"), "DTO must keep readonlyEndpointImplementedNow=false");
  assert(dtoSource.includes("controllerMayCallServiceNow: false"), "DTO must keep controllerMayCallServiceNow=false");
  assert(dtoSource.includes("controllerMayReturnRowsNow: false"), "DTO must keep controllerMayReturnRowsNow=false");
  assert(dtoSource.includes("frontendExposedNow: false"), "DTO must keep frontendExposedNow=false");
  assert(dtoSource.includes("writesDatabase: false"), "DTO must keep writesDatabase=false");
  assert(dtoSource.includes("rawPayloadProjection: true"), "DTO must forbid rawPayloadProjection");
  assert(dtoSource.includes("normalizedPayloadProjection: true"), "DTO must forbid normalizedPayloadProjection");
  assert(dtoSource.includes("dedupeHashProjection: true"), "DTO must forbid dedupeHashProjection");

  console.log("[SMOKE_OK] amazon sp-api sandbox ImportJob read-model readonly endpoint contract smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step122-L",
        contract: {
          version: contract.version,
          contractOnly: contract.contractOnly,
          readonlyEndpointImplementedNow: contract.readonlyEndpointImplementedNow,
          routeCurrentlyBlocked: contract.routeCurrentlyBlocked,
          controllerMayCallServiceNow: contract.controllerMayCallServiceNow,
          controllerMayReturnRowsNow: contract.controllerMayReturnRowsNow,
          frontendExposedNow: contract.frontendExposedNow,
          writesDatabase: contract.writesDatabase,
          futureReadonlyEndpoint: contract.futureReadonlyEndpoint,
          futureServiceCallPolicy: contract.futureServiceCallPolicy,
          allowedReadonlyProjection: contract.allowedReadonlyProjection,
          summary: contract.summary,
        },
        guards: {
          blockedRouteStillPresent: true,
          blockedRouteStillDoesNotCallService: true,
          blockedRouteStillDoesNotReturnRows: true,
          frontendStillDisabled: true,
          schemaStillDisabled: true,
        },
        controllerGuard: {
          exposedRoutes: routeScan.exposedRoutes,
          readModelRoutes,
          unexpectedRoutes,
        },
        frontendGuard: {
          scannedFiles: webFiles.length,
          frontendLeaks,
        },
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
