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
  buildAmazonSpApiSandboxImportJobReadModelReadonlyControllerPreflight,
  assertAmazonSpApiSandboxImportJobReadModelReadonlyControllerPreflight,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-importjob-read-model-readonly-controller-preflight.dto");

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
  const dtoFile = path.resolve(root, "src/imports/dto/amazon-sp-api-sandbox-importjob-read-model-readonly-controller-preflight.dto.ts");

  const pkg = JSON.parse(read(packageFile));
  const schema = read(schemaFile);
  const serviceSource = read(serviceFile);
  const controllerSource = read(controllerFile);
  const dtoSource = read(dtoFile);

  assert(
    pkg.scripts["smoke:amazon-sp-api-sandbox-importjob-read-model-readonly-controller-preflight"],
    "Step122-N smoke script missing",
  );

  const preflight = assertAmazonSpApiSandboxImportJobReadModelReadonlyControllerPreflight(
    buildAmazonSpApiSandboxImportJobReadModelReadonlyControllerPreflight(),
  );

  assert(preflight.version === "amazon-sp-api-sandbox-importjob-read-model-readonly-controller-preflight-v1", "version mismatch");
  assert(preflight.preflightOnly === true, "preflightOnly must be true");
  assert(preflight.controllerImplementationAllowedNow === false, "controllerImplementationAllowedNow must be false");
  assert(preflight.controllerServiceCallAllowedNow === false, "controllerServiceCallAllowedNow must be false");
  assert(preflight.controllerRowsReturnAllowedNow === false, "controllerRowsReturnAllowedNow must be false");
  assert(preflight.routeStillBlockedNow === true, "routeStillBlockedNow must be true");
  assert(preflight.frontendExposedNow === false, "frontendExposedNow must be false");
  assert(preflight.writesDatabase === false, "writesDatabase must be false");

  assert(
    preflight.requiredImplementationInputs.authContextCompanyIdResolver === "required-before-service-call",
    "auth context companyId resolver must be required before service call",
  );
  assert(
    preflight.requiredImplementationInputs.queryNormalizer === "normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery",
    "query normalizer mismatch",
  );
  assert(
    preflight.requiredImplementationInputs.envGate === "assertAmazonSpApiSandboxEnvironmentGate",
    "env gate mismatch",
  );

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
    "Step122-K route must still be blocked before service call",
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
      text.includes("listAmazonSpApiSandboxImportJobsReadModelDryRun")
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

  assert(dtoSource.includes("controllerImplementationAllowedNow: false"), "DTO must keep controllerImplementationAllowedNow=false");
  assert(dtoSource.includes("controllerServiceCallAllowedNow: false"), "DTO must keep controllerServiceCallAllowedNow=false");
  assert(dtoSource.includes("controllerRowsReturnAllowedNow: false"), "DTO must keep controllerRowsReturnAllowedNow=false");
  assert(dtoSource.includes("routeStillBlockedNow: true"), "DTO must keep routeStillBlockedNow=true");
  assert(dtoSource.includes("authContextCompanyIdResolver: 'required-before-service-call'"), "DTO must require auth context companyId resolver");
  assert(dtoSource.includes("queryCompanyIdMustNotBeTrusted: true"), "DTO must reject query companyId authority");

  console.log("[SMOKE_OK] amazon sp-api sandbox ImportJob read-model readonly controller preflight smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step122-N",
        preflight: {
          version: preflight.version,
          preflightOnly: preflight.preflightOnly,
          controllerImplementationAllowedNow: preflight.controllerImplementationAllowedNow,
          controllerServiceCallAllowedNow: preflight.controllerServiceCallAllowedNow,
          controllerRowsReturnAllowedNow: preflight.controllerRowsReturnAllowedNow,
          routeStillBlockedNow: preflight.routeStillBlockedNow,
          frontendExposedNow: preflight.frontendExposedNow,
          writesDatabase: preflight.writesDatabase,
          requiredImplementationInputs: preflight.requiredImplementationInputs,
          futureImplementationPlan: preflight.futureImplementationPlan,
          summary: preflight.summary,
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
