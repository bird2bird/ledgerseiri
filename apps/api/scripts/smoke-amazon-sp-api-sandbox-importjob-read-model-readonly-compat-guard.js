"use strict";

const fs = require("fs");
const path = require("path");

process.env.AMAZON_SP_API_SANDBOX_INTERNAL_ENABLED = "true";
process.env.AMAZON_SP_API_REAL_ENABLED = "false";
process.env.AMAZON_SP_API_OAUTH_ENABLED = "false";
process.env.AMAZON_SP_API_TOKEN_PERSISTENCE_ENABLED = "false";
process.env.AMAZON_SP_API_SANDBOX_IMPORTJOB_PERSISTENCE_ENABLED = "false";

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

function extractReadModelRouteSource(controllerSource) {
  const oMarker =
    "Step122-O: Amazon SP-API sandbox ImportJob read-model readonly controller service-call implementation.";
  const kMarker =
    "Step122-K: Amazon SP-API sandbox ImportJob read-model env-gated blocked controller route.";

  const oStart = controllerSource.indexOf(oMarker);
  const kStart = controllerSource.indexOf(kMarker);

  let marker = null;
  let start = -1;

  if (oStart >= 0) {
    marker = "Step122-O";
    start = oStart;
  } else if (kStart >= 0) {
    marker = "Step122-K";
    start = kStart;
  }

  assert(start >= 0, "read-model route marker missing: expected Step122-O or Step122-K");

  const end = controllerSource.indexOf("@Post('detect-month-conflicts')", start);
  assert(end > start, "read-model route end anchor missing");

  return {
    phase: marker,
    source: controllerSource.slice(start, end),
  };
}

async function runCompatSmoke(stepLabel) {
  const root = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(root, "..", "..");
  const srcRoot = path.resolve(root, "src");
  const webSrcRoot = path.resolve(repoRoot, "apps/web/src");

  const packageFile = path.resolve(root, "package.json");
  const schemaFile = path.resolve(root, "prisma/schema.prisma");
  const serviceFile = path.resolve(root, "src/imports/imports.service.ts");
  const controllerFile = path.resolve(root, "src/imports/imports.controller.ts");

  const pkg = JSON.parse(read(packageFile));
  const schema = read(schemaFile);
  const serviceSource = read(serviceFile);
  const controllerSource = read(controllerFile);

  assert(
    serviceSource.includes("async ['listAmazonSpApiSandboxImportJobsReadModelDryRun']("),
    "Step122-F internal read-model service method must exist",
  );
  assert(
    !serviceSource.includes("async listAmazonSpApiSandboxImportJobsReadModelDryRun("),
    "Step122-F service method must remain computed-name guarded",
  );

  assert(
    controllerSource.includes("@Get('internal/amazon-sp-api-sandbox/import-jobs/read-model')"),
    "read-model GET route must exist",
  );

  const route = extractReadModelRouteSource(controllerSource);
  const routeSource = route.source;

  assert(
    routeSource.includes("assertAmazonSpApiSandboxEnvironmentGate({ requireInternalSandbox: true })"),
    "read-model route must be env-gated",
  );
  assert(
    routeSource.includes("normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery(query)"),
    "read-model route must normalize and validate query",
  );

  if (route.phase === "Step122-O") {
    assert(
      routeSource.includes("this.service['listAmazonSpApiSandboxImportJobsReadModelDryRun']"),
      "Step122-O readonly route must call read-model service",
    );
    assert(routeSource.includes("dryRun: true"), "Step122-O readonly route must preserve dryRun=true");
    assert(
      !routeSource.includes("STEP122_K_CONTROLLER_BLOCKED_ROUTE_NOT_OPEN"),
      "Step122-O readonly route must not still throw Step122-K blocked error",
    );
  } else {
    assert(
      routeSource.includes("STEP122_K_CONTROLLER_BLOCKED_ROUTE_NOT_OPEN"),
      "Step122-K route must remain blocked before Step122-O",
    );
    assert(
      !routeSource.includes("this.service['listAmazonSpApiSandboxImportJobsReadModelDryRun']"),
      "Step122-K blocked route must not call read-model service",
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
    "importJob.create",
    "importStagingRow.create",
    "deleteMany",
    "createMany",
    "updateMany",
  ]) {
    assert(!routeSource.includes(forbidden), `read-model route must not contain forbidden fragment: ${forbidden}`);
  }

  const routeScan = scanControllerRoutes(root, srcRoot);
  const readModelRoutes = routeScan.exposedRoutes.filter(
    (item) => String(item.route || "") === "internal/amazon-sp-api-sandbox/import-jobs/read-model",
  );
  const unexpectedRoutes = routeScan.exposedRoutes.filter(
    (item) => String(item.route || "") !== "internal/amazon-sp-api-sandbox/import-jobs/read-model",
  );

  assert(
    readModelRoutes.length === 1,
    `expected exactly one read-model route, got ${JSON.stringify(readModelRoutes)}`,
  );
  assert(readModelRoutes[0].method === "Get", "read-model route must be GET");
  assert(unexpectedRoutes.length === 0, `unexpected SP-API routes: ${JSON.stringify(unexpectedRoutes)}`);

  const webFiles = listFiles(webSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));
  const frontendLeaks = [];

  for (const file of webFiles) {
    const text = read(file);
    if (
      text.includes("/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model") ||
      text.includes("internal/amazon-sp-api-sandbox/import-jobs/read-model") ||
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

  console.log(`[SMOKE_OK] ${stepLabel} compatibility smoke passed`);
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: stepLabel,
        phase: route.phase,
        packageHasStep122O:
          Boolean(pkg.scripts["smoke:amazon-sp-api-sandbox-importjob-read-model-readonly-controller-implementation"]),
        route: {
          method: "GET",
          path: "api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model",
          envGated: true,
          queryValidated: true,
          serviceCallAllowedInStep122O: route.phase === "Step122-O",
          frontendExposed: false,
          writesDatabase: false,
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
        schemaGuard: {
          forbiddenModelsAbsent: true,
        },
      },
      null,
      2,
    ),
  );
}

module.exports = {
  runCompatSmoke,
};

if (require.main === module) {
  runCompatSmoke("Step122-O compatibility")
    .catch((err) => {
      console.error("[SMOKE_ERROR]", err);
      process.exitCode = 1;
    });
}
