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
  buildAmazonSpApiSandboxImportJobReadModelControllerContract,
  assertAmazonSpApiSandboxImportJobReadModelControllerContract,
  normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery,
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

function expectReject(label, fn, expectedFragment) {
  try {
    fn();
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
    pkg.scripts["smoke:amazon-sp-api-sandbox-importjob-read-model-controller-contract-design"],
    "Step122-H smoke script missing",
  );

  const contract = assertAmazonSpApiSandboxImportJobReadModelControllerContract(
    buildAmazonSpApiSandboxImportJobReadModelControllerContract(),
  );

  assert(contract.version === "amazon-sp-api-sandbox-importjob-read-model-controller-contract-v1", "version mismatch");
  assert(contract.contractOnly === true, "contractOnly must be true");
  assert(contract.controllerImplementedNow === false, "controllerImplementedNow must be false");
  assert(contract.controllerRouteExposedNow === false, "controllerRouteExposedNow must be false");
  assert(contract.frontendExposedNow === false, "frontendExposedNow must be false");
  assert(contract.writesDatabase === false, "writesDatabase must be false");

  assert(contract.futureEndpoint.method === "GET", "future endpoint must be GET");
  assert(contract.futureEndpoint.authRequired === true, "auth must be required");
  assert(contract.futureEndpoint.companyIsolationRequired === true, "company isolation must be required");
  assert(contract.futureEndpoint.internalSandboxGateRequired === true, "internal sandbox gate must be required");
  assert(contract.futureEndpoint.dryRunRequired === true, "dryRun must be required");

  const normalized = normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery({
    filter: "uncommitted-staging",
    sort: "filename_asc",
    page: "2",
    pageSize: "50",
    dryRun: "true",
  });

  assert(normalized.filter === "uncommitted-staging", "normalized filter mismatch");
  assert(normalized.sort === "filename_asc", "normalized sort mismatch");
  assert(normalized.page === 2, "normalized page mismatch");
  assert(normalized.pageSize === 50, "normalized pageSize mismatch");
  assert(normalized.dryRun === true, "normalized dryRun mismatch");

  const rejected = [
    expectReject(
      "invalid filter",
      () =>
        normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery({
          filter: "committed-sales",
          sort: "createdAt_desc",
          page: 1,
          pageSize: 20,
          dryRun: true,
        }),
      "invalid filter",
    ),
    expectReject(
      "invalid sort",
      () =>
        normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery({
          filter: "all",
          sort: "committedSales_desc",
          page: 1,
          pageSize: 20,
          dryRun: true,
        }),
      "invalid sort",
    ),
    expectReject(
      "invalid pageSize",
      () =>
        normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery({
          filter: "all",
          sort: "createdAt_desc",
          page: 1,
          pageSize: 10,
          dryRun: true,
        }),
      "invalid pageSize",
    ),
    expectReject(
      "dryRun missing",
      () =>
        normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery({
          filter: "all",
          sort: "createdAt_desc",
          page: 1,
          pageSize: 20,
        }),
      "dryRun=true is required",
    ),
  ];

  assert(
    serviceSource.includes("async ['listAmazonSpApiSandboxImportJobsReadModelDryRun']("),
    "Step122-F service implementation must remain computed-name/internal",
  );

  assert(
    !serviceSource.includes("async listAmazonSpApiSandboxImportJobsReadModelDryRun("),
    "service method must not be converted to normal public method in Step122-H",
  );

  assert(
    !controllerSource.includes("listAmazonSpApiSandboxImportJobsReadModelDryRun"),
    "controller must not reference read-model service method in Step122-H",
  );

  assert(
    !controllerSource.includes("/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model"),
    "controller must not expose future endpoint path in Step122-H",
  );

  const routeScan = scanControllerRoutes(root, srcRoot);
  assert(routeScan.exposedRoutes.length === 0, `controller route leak: ${JSON.stringify(routeScan.exposedRoutes)}`);

  const webFiles = listFiles(webSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));
  const frontendLeaks = [];
  for (const file of webFiles) {
    const text = read(file);
    if (
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

  assert(dtoSource.includes("contractOnly: true"), "DTO must remain contract-only");
  assert(dtoSource.includes("controllerImplementedNow: false"), "DTO must keep controller disabled");
  assert(dtoSource.includes("controllerRouteExposedNow: false"), "DTO must keep route disabled");
  assert(dtoSource.includes("frontendExposedNow: false"), "DTO must keep frontend disabled");
  assert(dtoSource.includes("writesDatabase: false"), "DTO must keep writes disabled");

  console.log("[SMOKE_OK] amazon sp-api sandbox ImportJob read-model controller contract design smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step122-H",
        contract: {
          version: contract.version,
          contractOnly: contract.contractOnly,
          controllerImplementedNow: contract.controllerImplementedNow,
          controllerRouteExposedNow: contract.controllerRouteExposedNow,
          frontendExposedNow: contract.frontendExposedNow,
          writesDatabase: contract.writesDatabase,
          futureEndpoint: contract.futureEndpoint,
          queryPolicy: contract.queryPolicy,
          responseShape: contract.responseShape,
          summary: contract.summary,
        },
        normalized,
        rejected,
        guards: {
          controllerStillDisabled: true,
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
