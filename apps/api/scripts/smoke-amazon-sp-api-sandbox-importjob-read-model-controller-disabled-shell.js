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
  buildAmazonSpApiSandboxImportJobReadModelControllerContract,
  assertAmazonSpApiSandboxImportJobReadModelControllerContract,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-importjob-read-model-controller-contract.dto");

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

function extractStep122IShellSource(controllerSource) {
  const start = controllerSource.indexOf(
    "Step122-I: Amazon SP-API sandbox ImportJob read-model controller-disabled implementation shell",
  );
  const end = controllerSource.indexOf("@Post('detect-month-conflicts')", start);

  assert(start >= 0, "Step122-I controller-disabled shell marker missing");
  assert(end > start, "Step122-I shell end anchor missing");

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
  const dtoFile = path.resolve(root, "src/imports/dto/amazon-sp-api-sandbox-importjob-read-model-controller-contract.dto.ts");

  const pkg = JSON.parse(read(packageFile));
  const schema = read(schemaFile);
  const serviceSource = read(serviceFile);
  const controllerSource = read(controllerFile);
  const dtoSource = read(dtoFile);

  assert(
    pkg.scripts["smoke:amazon-sp-api-sandbox-importjob-read-model-controller-disabled-shell"],
    "Step122-I smoke script missing",
  );

  const contract = assertAmazonSpApiSandboxImportJobReadModelControllerContract(
    buildAmazonSpApiSandboxImportJobReadModelControllerContract(),
  );

  assert(contract.controllerImplementedNow === false, "contract must still say controllerImplementedNow=false");
  assert(contract.controllerRouteExposedNow === false, "contract must still say controllerRouteExposedNow=false");
  assert(contract.frontendExposedNow === false, "contract must still say frontendExposedNow=false");
  assert(contract.writesDatabase === false, "contract must still say writesDatabase=false");

  assert(
    controllerSource.includes("amazonSpApiSandboxImportJobReadModelControllerDisabledShell"),
    "controller-disabled shell method missing",
  );
  assert(
    controllerSource.includes("STEP122_I_CONTROLLER_DISABLED_SHELL_BLOCKED"),
    "controller-disabled shell blocked error missing",
  );

  const shellSource = extractStep122IShellSource(controllerSource);

  for (const forbidden of [
    "@Get(",
    "@Post(",
    "@Patch(",
    "@Put(",
    "@Delete(",
    "listAmazonSpApiSandboxImportJobsReadModelDryRun",
    "this.service.",
    "/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model",
    "rawPayloadJson",
    "normalizedPayloadJson",
    "dedupeHash",
    "transaction",
    "inventoryMovement",
    "inventoryBalance",
  ]) {
    assert(
      !shellSource.includes(forbidden),
      `Step122-I shell must not contain forbidden fragment: ${forbidden}`,
    );
  }

  assert(
    !controllerSource.includes("@Get('amazon-sp-api-sandbox"),
    "controller must not expose amazon-sp-api-sandbox GET route",
  );
  assert(
    !controllerSource.includes("@Post('amazon-sp-api-sandbox"),
    "controller must not expose amazon-sp-api-sandbox POST route",
  );
  assert(
    !controllerSource.includes("/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model"),
    "controller must not contain future endpoint path",
  );

  assert(
    serviceSource.includes("async ['listAmazonSpApiSandboxImportJobsReadModelDryRun']("),
    "Step122-F service method must remain implemented internally",
  );
  assert(
    !serviceSource.includes("async listAmazonSpApiSandboxImportJobsReadModelDryRun("),
    "service method must remain computed-name guarded",
  );

  const routeScan = scanControllerRoutes(root, srcRoot);
  assert(routeScan.exposedRoutes.length === 0, `controller route leak: ${JSON.stringify(routeScan.exposedRoutes)}`);

  const webFiles = listFiles(webSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));
  const frontendLeaks = [];
  for (const file of webFiles) {
    const text = read(file);
    if (
      text.includes("amazonSpApiSandboxImportJobReadModelControllerDisabledShell") ||
      text.includes("/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model") ||
      text.includes("amazon-sp-api-sandbox/import-jobs/read-model") ||
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

  assert(dtoSource.includes("controllerImplementedNow: false"), "DTO must still keep controllerImplementedNow=false");
  assert(dtoSource.includes("controllerRouteExposedNow: false"), "DTO must still keep controllerRouteExposedNow=false");
  assert(dtoSource.includes("frontendExposedNow: false"), "DTO must still keep frontendExposedNow=false");

  const controller = new ImportsController({});
  assert(
    typeof controller.amazonSpApiSandboxImportJobReadModelControllerDisabledShell === "function",
    "controller-disabled shell must be callable internally for smoke",
  );

  const blocked = await expectReject(
    "Step122-I shell blocked",
    () =>
      controller.amazonSpApiSandboxImportJobReadModelControllerDisabledShell({
        filter: "all",
        sort: "createdAt_desc",
        page: 1,
        pageSize: 20,
        dryRun: true,
      }),
    "STEP122_I_CONTROLLER_DISABLED_SHELL_BLOCKED",
  );

  const invalidQueryStillRejected = await expectReject(
    "Step122-I shell invalid query rejected before blocked",
    () =>
      controller.amazonSpApiSandboxImportJobReadModelControllerDisabledShell({
        filter: "committed-sales",
        sort: "createdAt_desc",
        page: 1,
        pageSize: 20,
        dryRun: true,
      }),
    "invalid filter",
  );

  console.log("[SMOKE_OK] amazon sp-api sandbox ImportJob read-model controller-disabled shell smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step122-I",
        shell: {
          methodName: "amazonSpApiSandboxImportJobReadModelControllerDisabledShell",
          routeDecorated: false,
          serviceCalled: false,
          blocked,
          invalidQueryStillRejected,
        },
        contract: {
          version: contract.version,
          controllerImplementedNow: contract.controllerImplementedNow,
          controllerRouteExposedNow: contract.controllerRouteExposedNow,
          frontendExposedNow: contract.frontendExposedNow,
          writesDatabase: contract.writesDatabase,
        },
        guards: {
          controllerRouteStillDisabled: true,
          frontendStillDisabled: true,
          schemaStillDisabled: true,
          serviceStillInternalComputedName: true,
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
