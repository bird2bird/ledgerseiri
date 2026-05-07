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

async function main() {
  const root = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(root, "..", "..");
  const srcRoot = path.resolve(root, "src");
  const webSrcRoot = path.resolve(repoRoot, "apps/web/src");

  const packageFile = path.resolve(root, "package.json");
  const schemaFile = path.resolve(root, "prisma/schema.prisma");
  const serviceFile = path.resolve(root, "src/imports/imports.service.ts");
  const controllerFile = path.resolve(root, "src/imports/imports.controller.ts");
  const dtoFile = path.resolve(root, "src/imports/dto/amazon-sp-api-sandbox-importjob-read-model-controller-blocked-route-contract.dto.ts");

  const pkg = JSON.parse(read(packageFile));
  const schema = read(schemaFile);
  const serviceSource = read(serviceFile);
  const controllerSource = read(controllerFile);
  const dtoSource = read(dtoFile);

  assert(
    pkg.scripts["smoke:amazon-sp-api-sandbox-importjob-read-model-controller-blocked-route-contract"],
    "Step122-J smoke script missing",
  );

  const contract = assertAmazonSpApiSandboxImportJobReadModelControllerBlockedRouteContract(
    buildAmazonSpApiSandboxImportJobReadModelControllerBlockedRouteContract(),
  );

  assert(contract.version === "amazon-sp-api-sandbox-importjob-read-model-controller-blocked-route-contract-v1", "version mismatch");
  assert(contract.designOnly === true, "designOnly must be true");
  assert(contract.routeImplementedNow === false, "routeImplementedNow must be false");
  assert(contract.routeCallableNow === false, "routeCallableNow must be false");
  assert(contract.serviceCallAllowedNow === false, "serviceCallAllowedNow must be false");
  assert(contract.frontendExposedNow === false, "frontendExposedNow must be false");
  assert(contract.writesDatabase === false, "writesDatabase must be false");

  assert(contract.futureBlockedRoute.method === "GET", "future blocked route must be GET");
  assert(contract.futureBlockedRoute.mustRequireAuth === true, "future route must require auth");
  assert(contract.futureBlockedRoute.mustResolveCompanyIdFromAuthContext === true, "future route must resolve company from auth context");
  assert(contract.futureBlockedRoute.mustRequireInternalSandboxEnvGate === true, "future route must require internal sandbox env gate");
  assert(contract.futureBlockedRoute.mustRequireDryRunTrue === true, "future route must require dryRun=true");
  assert(contract.futureBlockedRoute.mustReturnBlockedBeforeServiceCall === true, "future blocked route must block before service call");

  assert(contract.allowedTransitionChecks.mayParseQuery === true, "mayParseQuery mismatch");
  assert(contract.allowedTransitionChecks.mayValidateDryRun === true, "mayValidateDryRun mismatch");
  assert(contract.allowedTransitionChecks.mayValidateFilterSortPagination === true, "mayValidateFilterSortPagination mismatch");
  assert(contract.allowedTransitionChecks.mayCheckEnvGate === true, "mayCheckEnvGate mismatch");
  assert(contract.allowedTransitionChecks.mayCallReadModelService === false, "mayCallReadModelService must be false");
  assert(contract.allowedTransitionChecks.mayReturnRows === false, "mayReturnRows must be false");

  assert(
    controllerSource.includes("amazonSpApiSandboxImportJobReadModelControllerDisabledShell"),
    "Step122-I controller disabled shell must still exist",
  );
  // Step122-K transition-aware regression:
  // Step122-J originally required no route. After Step122-K, exactly one GET route may exist,
  // but it must remain env-gated, blocked before service call, and must not return rows.
  const step122KRouteExists = controllerSource.includes(
    "@Get('internal/amazon-sp-api-sandbox/import-jobs/read-model')",
  );

  assert(
    !controllerSource.includes("@Post('internal/amazon-sp-api-sandbox/import-jobs/read-model')"),
    "Step122-J/K regression must not add POST route",
  );

  if (step122KRouteExists) {
    const kStart = controllerSource.indexOf(
      "Step122-K: Amazon SP-API sandbox ImportJob read-model env-gated blocked controller route.",
    );
    const kEnd = controllerSource.indexOf("@Post('detect-month-conflicts')", kStart);

    assert(kStart >= 0, "Step122-K route marker missing while route exists");
    assert(kEnd > kStart, "Step122-K route end anchor missing");

    const kRouteSource = controllerSource.slice(kStart, kEnd);

    assert(
      kRouteSource.includes("assertAmazonSpApiSandboxEnvironmentGate({ requireInternalSandbox: true })"),
      "Step122-K route must remain env-gated",
    );
    assert(
      kRouteSource.includes("normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery(query)"),
      "Step122-K route must validate query",
    );
    assert(
      kRouteSource.includes("STEP122_K_CONTROLLER_BLOCKED_ROUTE_NOT_OPEN"),
      "Step122-K route must remain blocked",
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
      assert(
        !kRouteSource.includes(forbidden),
        `Step122-K transition route must not contain forbidden fragment: ${forbidden}`,
      );
    }
  } else {
    assert(
      !controllerSource.includes("STEP122_J_CONTROLLER_BLOCKED_ROUTE_NOT_OPEN"),
      "Step122-J pre-route state must not add controller blocked route implementation",
    );
  }

  assert(
    serviceSource.includes("async ['listAmazonSpApiSandboxImportJobsReadModelDryRun']("),
    "Step122-F internal service method must still exist",
  );
  assert(
    !controllerSource.includes("listAmazonSpApiSandboxImportJobsReadModelDryRun"),
    "controller must still not call Step122-F service method",
  );

  const routeScan = scanControllerRoutes(root, srcRoot);

  // Step122-K transition-aware route scan:
  // after Step122-K, exactly one env-gated blocked GET route is allowed.
  const allowedBlockedRoute = "internal/amazon-sp-api-sandbox/import-jobs/read-model";
  const readModelRoutes = routeScan.exposedRoutes.filter(
    (route) => String(route.route || "") === allowedBlockedRoute,
  );
  const unexpectedRoutes = routeScan.exposedRoutes.filter(
    (route) => String(route.route || "") !== allowedBlockedRoute,
  );

  if (step122KRouteExists) {
    assert(
      readModelRoutes.length === 1,
      `Step122-K transition expected exactly one blocked read-model route, got ${JSON.stringify(readModelRoutes)}`,
    );
    assert(
      readModelRoutes[0].method === "Get",
      `Step122-K transition blocked read-model route must be GET, got ${readModelRoutes[0].method}`,
    );
    assert(
      unexpectedRoutes.length === 0,
      `unexpected controller route leak: ${JSON.stringify(unexpectedRoutes)}`,
    );
  } else {
    assert(
      routeScan.exposedRoutes.length === 0,
      `controller route leak before Step122-K: ${JSON.stringify(routeScan.exposedRoutes)}`,
    );
  }

  const webFiles = listFiles(webSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));
  const frontendLeaks = [];
  for (const file of webFiles) {
    const text = read(file);
    if (
      text.includes("/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model") ||
      text.includes("internal/amazon-sp-api-sandbox/import-jobs/read-model") ||
      text.includes("STEP122_J_CONTROLLER_BLOCKED_ROUTE_NOT_OPEN")
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

  assert(dtoSource.includes("designOnly: true"), "DTO must remain design-only");
  assert(dtoSource.includes("routeImplementedNow: false"), "DTO must keep routeImplementedNow=false");
  assert(dtoSource.includes("routeCallableNow: false"), "DTO must keep routeCallableNow=false");
  assert(dtoSource.includes("serviceCallAllowedNow: false"), "DTO must keep serviceCallAllowedNow=false");
  assert(dtoSource.includes("frontendExposedNow: false"), "DTO must keep frontendExposedNow=false");
  assert(dtoSource.includes("writesDatabase: false"), "DTO must keep writesDatabase=false");

  console.log("[SMOKE_OK] amazon sp-api sandbox ImportJob read-model controller blocked route contract smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step122-J",
        contract: {
          version: contract.version,
          designOnly: contract.designOnly,
          routeImplementedNow: contract.routeImplementedNow,
          routeCallableNow: contract.routeCallableNow,
          serviceCallAllowedNow: contract.serviceCallAllowedNow,
          frontendExposedNow: contract.frontendExposedNow,
          writesDatabase: contract.writesDatabase,
          futureBlockedRoute: contract.futureBlockedRoute,
          requiredBlockedError: contract.requiredBlockedError,
          allowedTransitionChecks: contract.allowedTransitionChecks,
          summary: contract.summary,
        },
        guards: {
          controllerStillHasDisabledShell: true,
          controllerRouteStillAbsent: true,
          controllerStillDoesNotCallService: true,
          frontendStillDisabled: true,
          schemaStillDisabled: true,
        },
        controllerGuard: routeScan,
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
