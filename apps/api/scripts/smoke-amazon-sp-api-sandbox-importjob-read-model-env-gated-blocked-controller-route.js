#!/usr/bin/env node
"use strict";

process.env.AMAZON_SP_API_SANDBOX_INTERNAL_ENABLED = "true";
process.env.AMAZON_SP_API_REAL_ENABLED = "false";
process.env.AMAZON_SP_API_OAUTH_ENABLED = "false";
process.env.AMAZON_SP_API_TOKEN_PERSISTENCE_ENABLED = "false";
process.env.AMAZON_SP_API_SANDBOX_IMPORTJOB_PERSISTENCE_ENABLED = "false";

const fs = require("fs");
const path = require("path");
const { ImportsController } = require("../dist/src/imports/imports.controller");
const {
  buildAmazonSpApiSandboxImportJobReadModelControllerBlockedRouteContract,
  assertAmazonSpApiSandboxImportJobReadModelControllerBlockedRouteContract,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-importjob-read-model-controller-blocked-route-contract.dto");

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

async function expectReject(label, fn, expectedFragment) {
  try {
    await fn();
  } catch (err) {
    const message = String((err && err.message) || err);
    if (!message.includes(expectedFragment)) {
      throw new Error(`${label} rejected with unexpected message: ${message}`);
    }
    return { label, ok: true, message };
  }

  throw new Error(`${label} should have been rejected`);
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
  const blockedDtoFile = path.resolve(root, "src/imports/dto/amazon-sp-api-sandbox-importjob-read-model-controller-blocked-route-contract.dto.ts");

  const pkg = JSON.parse(read(packageFile));
  const schema = read(schemaFile);
  const serviceSource = read(serviceFile);
  const controllerSource = read(controllerFile);
  const blockedDtoSource = read(blockedDtoFile);

  assert(
    pkg.scripts["smoke:amazon-sp-api-sandbox-importjob-read-model-env-gated-blocked-controller-route"],
    "Step122-K smoke script missing",
  );

  const contract = assertAmazonSpApiSandboxImportJobReadModelControllerBlockedRouteContract(
    buildAmazonSpApiSandboxImportJobReadModelControllerBlockedRouteContract(),
  );

  assert(contract.routeImplementedNow === false, "contract must still keep routeImplementedNow=false");
  assert(contract.routeCallableNow === false, "contract must still keep routeCallableNow=false");
  assert(contract.serviceCallAllowedNow === false, "contract must still keep serviceCallAllowedNow=false");
  assert(contract.frontendExposedNow === false, "contract must still keep frontendExposedNow=false");
  assert(contract.writesDatabase === false, "contract must still keep writesDatabase=false");

  assert(
    controllerSource.includes("@Get('internal/amazon-sp-api-sandbox/import-jobs/read-model')"),
    "Step122-K must add exactly the env-gated blocked GET route",
  );
  assert(
    controllerSource.includes("STEP122_K_CONTROLLER_BLOCKED_ROUTE_NOT_OPEN"),
    "Step122-K blocked route error missing",
  );

  const routeSource = extractStep122KRouteSource(controllerSource);

  assert(
    routeSource.includes("assertAmazonSpApiSandboxEnvironmentGate({ requireInternalSandbox: true })"),
    "Step122-K route must require internal sandbox env gate",
  );
  assert(
    routeSource.includes("normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery(query)"),
    "Step122-K route must validate query before blocked error",
  );
  assert(
    routeSource.includes("STEP122_K_CONTROLLER_BLOCKED_ROUTE_NOT_OPEN"),
    "Step122-K route must throw blocked error",
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
  const readModelRoutes = routeScan.exposedRoutes.filter((route) =>
    String(route.route || "").includes("internal/amazon-sp-api-sandbox/import-jobs/read-model"),
  );

  assert(readModelRoutes.length === 1, `expected exactly one blocked read-model route, got ${JSON.stringify(readModelRoutes)}`);
  assert(readModelRoutes[0].method === "Get", "blocked read-model route must be GET");
  assert(
    readModelRoutes[0].route === "internal/amazon-sp-api-sandbox/import-jobs/read-model",
    "blocked read-model route path mismatch",
  );

  const unexpectedSpApiRoutes = routeScan.exposedRoutes.filter(
    (route) => route.route !== "internal/amazon-sp-api-sandbox/import-jobs/read-model",
  );
  assert(unexpectedSpApiRoutes.length === 0, `unexpected SP-API routes: ${JSON.stringify(unexpectedSpApiRoutes)}`);

  assert(
    serviceSource.includes("async ['listAmazonSpApiSandboxImportJobsReadModelDryRun']("),
    "Step122-F internal service method must still exist",
  );
  assert(
    !routeSource.includes("listAmazonSpApiSandboxImportJobsReadModelDryRun"),
    "Step122-K route must not call Step122-F service",
  );

  const controller = new ImportsController({});
  assert(
    typeof controller.amazonSpApiSandboxImportJobReadModelEnvGatedBlockedRoute === "function",
    "Step122-K blocked route method must be callable internally for smoke",
  );

  const blocked = await expectReject(
    "Step122-K blocked route",
    () =>
      controller.amazonSpApiSandboxImportJobReadModelEnvGatedBlockedRoute({
        filter: "all",
        sort: "createdAt_desc",
        page: 1,
        pageSize: 20,
        dryRun: true,
      }),
    "STEP122_K_CONTROLLER_BLOCKED_ROUTE_NOT_OPEN",
  );

  const invalidQueryStillRejected = await expectReject(
    "Step122-K invalid query rejected before blocked",
    () =>
      controller.amazonSpApiSandboxImportJobReadModelEnvGatedBlockedRoute({
        filter: "committed-sales",
        sort: "createdAt_desc",
        page: 1,
        pageSize: 20,
        dryRun: true,
      }),
    "invalid filter",
  );

  const dryRunMissingRejected = await expectReject(
    "Step122-K dryRun missing rejected before blocked",
    () =>
      controller.amazonSpApiSandboxImportJobReadModelEnvGatedBlockedRoute({
        filter: "all",
        sort: "createdAt_desc",
        page: 1,
        pageSize: 20,
      }),
    "dryRun=true is required",
  );

  const webFiles = listFiles(webSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));
  const frontendLeaks = [];
  for (const file of webFiles) {
    const text = read(file);
    if (
      text.includes("/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model") ||
      text.includes("internal/amazon-sp-api-sandbox/import-jobs/read-model") ||
      text.includes("STEP122_K_CONTROLLER_BLOCKED_ROUTE_NOT_OPEN")
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

  assert(blockedDtoSource.includes("routeImplementedNow: false"), "blocked DTO must keep routeImplementedNow=false");
  assert(blockedDtoSource.includes("routeCallableNow: false"), "blocked DTO must keep routeCallableNow=false");
  assert(blockedDtoSource.includes("serviceCallAllowedNow: false"), "blocked DTO must keep serviceCallAllowedNow=false");
  assert(blockedDtoSource.includes("mustReturnBlockedBeforeServiceCall: true"), "blocked DTO must require blocked before service call");

  console.log("[SMOKE_OK] amazon sp-api sandbox ImportJob read-model env-gated blocked controller route smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step122-K",
        route: {
          method: "GET",
          path: "api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model",
          envGated: true,
          queryValidated: true,
          blockedBeforeServiceCall: true,
          serviceCalled: false,
          rowsReturned: false,
          blocked,
          invalidQueryStillRejected,
          dryRunMissingRejected,
        },
        contract: {
          version: contract.version,
          routeImplementedNow: contract.routeImplementedNow,
          routeCallableNow: contract.routeCallableNow,
          serviceCallAllowedNow: contract.serviceCallAllowedNow,
          frontendExposedNow: contract.frontendExposedNow,
          writesDatabase: contract.writesDatabase,
        },
        controllerGuard: {
          exposedRoutes: routeScan.exposedRoutes,
          readModelRoutes,
          unexpectedSpApiRoutes,
        },
        frontendGuard: {
          scannedFiles: webFiles.length,
          frontendLeaks,
        },
        schemaGuard: {
          forbiddenModelsAbsent: true,
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
