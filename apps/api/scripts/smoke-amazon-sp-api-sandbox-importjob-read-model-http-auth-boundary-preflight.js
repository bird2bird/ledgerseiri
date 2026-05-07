#!/usr/bin/env node
"use strict";

process.env.AMAZON_SP_API_REAL_ENABLED = "false";
process.env.AMAZON_SP_API_OAUTH_ENABLED = "false";
process.env.AMAZON_SP_API_TOKEN_PERSISTENCE_ENABLED = "false";
process.env.AMAZON_SP_API_SANDBOX_IMPORTJOB_PERSISTENCE_ENABLED = "false";

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const {
  buildAmazonSpApiSandboxImportJobReadModelHttpAuthBoundaryPreflight,
  assertAmazonSpApiSandboxImportJobReadModelHttpAuthBoundaryPreflight,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-importjob-read-model-http-auth-boundary-preflight.dto");

const prisma = new PrismaClient();

const API_BASE = process.env.LEDGERSEIRI_API_BASE || "http://localhost:3001";
const ENDPOINT = "/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model";

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

function assertOrdered(routeSource, first, second) {
  const a = routeSource.indexOf(first);
  const b = routeSource.indexOf(second);
  assert(a >= 0, `missing ordered fragment: ${first}`);
  assert(b >= 0, `missing ordered fragment: ${second}`);
  assert(a < b, `expected ${first} before ${second}`);
}

async function requestJson(url) {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Step122-Smoke": "Step122-Q",
    },
  });

  const text = await res.text();
  let json = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return {
    ok: res.ok,
    status: res.status,
    text,
    json,
  };
}

function buildUrl(params) {
  const url = new URL(ENDPOINT, API_BASE);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }
  return url;
}

async function resolveCompany() {
  const company = await prisma.company.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });
  if (!company) throw new Error("No company found for Step122-Q smoke");
  return company;
}

async function cleanupByFilename(filename) {
  const jobs = await prisma.importJob.findMany({
    where: { filename },
    select: { id: true },
  });
  const ids = jobs.map((job) => job.id);

  if (ids.length) {
    await prisma.importStagingRow.deleteMany({
      where: {
        importJobId: { in: ids },
      },
    });
  }

  await prisma.importJob.deleteMany({
    where: { filename },
  });
}

function assertNoSensitiveProjection(row) {
  for (const forbidden of [
    "rawPayloadJson",
    "normalizedPayloadJson",
    "dedupeHash",
    "companyId",
    "conflictMonthsJson",
    "fileMonthsJson",
  ]) {
    assert(!Object.prototype.hasOwnProperty.call(row, forbidden), `projected row must not include ${forbidden}`);
  }
}

function staticBoundaryPreflight() {
  const root = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(root, "..", "..");
  const controllerSource = read(path.resolve(root, "src/imports/imports.controller.ts"));
  const serviceSource = read(path.resolve(root, "src/imports/imports.service.ts"));
  const schema = read(path.resolve(root, "prisma/schema.prisma"));
  const packageJson = JSON.parse(read(path.resolve(root, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-sandbox-importjob-read-model-http-auth-boundary-preflight"],
    "Step122-Q npm smoke script missing",
  );

  assert(
    serviceSource.includes("async ['listAmazonSpApiSandboxImportJobsReadModelDryRun']("),
    "read-model service method missing",
  );

  const routeSource = routeSourceFrom(controllerSource);

  assert(routeSource.includes("@Get('internal/amazon-sp-api-sandbox/import-jobs/read-model')"), "GET route missing");
  assert(routeSource.includes("assertAmazonSpApiSandboxEnvironmentGate({ requireInternalSandbox: true })"), "env gate missing");
  assert(routeSource.includes("normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery(query)"), "query normalizer missing");
  assert(routeSource.includes("STEP122_P_HTTP_QUERY_VALIDATION_BAD_REQUEST"), "query validation 400 boundary missing");
  assert(routeSource.includes("this.service['listAmazonSpApiSandboxImportJobsReadModelDryRun']"), "readonly service call missing");
  assert(routeSource.includes("dryRun: true"), "dryRun=true enforcement missing");

  assertOrdered(routeSource, "assertAmazonSpApiSandboxEnvironmentGate", "normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery");
  assertOrdered(routeSource, "normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery", "this.service['listAmazonSpApiSandboxImportJobsReadModelDryRun']");
  assertOrdered(routeSource, "this.service['listAmazonSpApiSandboxImportJobsReadModelDryRun']", "dryRun: true");

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

  const webSrcRoot = path.resolve(repoRoot, "apps/web/src");
  const webFiles = listFiles(webSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));
  const frontendLeaks = [];

  for (const file of webFiles) {
    const text = read(file);
    if (
      text.includes("/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model") ||
      text.includes("internal/amazon-sp-api-sandbox/import-jobs/read-model") ||
      text.includes("listAmazonSpApiSandboxImportJobsReadModelDryRun")
    ) {
      frontendLeaks.push(path.relative(repoRoot, file));
    }
  }

  assert(frontendLeaks.length === 0, `frontend leak detected: ${JSON.stringify(frontendLeaks)}`);

  return {
    webFiles: webFiles.length,
    frontendLeaks,
  };
}

async function main() {
  const contract = assertAmazonSpApiSandboxImportJobReadModelHttpAuthBoundaryPreflight(
    buildAmazonSpApiSandboxImportJobReadModelHttpAuthBoundaryPreflight(),
  );

  assert(contract.preflightOnly === true, "contract must remain preflight-only");
  assert(contract.introducesAuthGuardNow === false, "Step122-Q must not introduce auth guard");
  assert(contract.frontendExposedNow === false, "frontend must remain disabled");
  assert(contract.writesDatabase === false, "writes must remain disabled");

  const staticGuard = staticBoundaryPreflight();

  const health = await requestJson(new URL("/health", API_BASE));
  assert(health.status === 200, `health should return 200. status=${health.status}, body=${health.text}`);

  const company = await resolveCompany();
  const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const filename = `step122-q-auth-boundary-${runId}.json`;

  await cleanupByFilename(filename);

  const txBefore = await prisma.transaction.count({
    where: {
      companyId: company.id,
      sourceFileName: filename,
    },
  });

  const movementBefore = await prisma.inventoryMovement.count({
    where: {
      companyId: company.id,
      sourceId: {
        contains: `STEP122-Q-${runId}`,
      },
    },
  });

  let importJob = null;

  try {
    importJob = await prisma.importJob.create({
      data: {
        companyId: company.id,
        domain: "store-orders",
        module: "store-orders",
        sourceType: "amazon-sp-api-sandbox",
        filename,
        status: "PENDING",
        totalRows: 1,
        successRows: 0,
        failedRows: 0,
        importedAt: null,
      },
      select: { id: true, filename: true },
    });

    await prisma.importStagingRow.create({
      data: {
        importJob: { connect: { id: importJob.id } },
        company: { connect: { id: company.id } },
        module: "store-orders",
        rowNo: 1,
        businessMonth: "2026-05",
        matchStatus: "new",
        matchReason: "STEP122_Q_AUTH_BOUNDARY_PREFLIGHT",
        dedupeHash: `STEP122-Q-${runId}-1`,
        rawPayloadJson: { mustNotBeProjected: true },
        normalizedPayloadJson: {
          mustNotBeProjected: true,
          contractVersion: "amazon-order-normalized-v1",
          sourceType: "AMAZON_ORDER_SP_API",
          module: "store-orders",
        },
      },
    });

    const valid = await requestJson(
      buildUrl({
        filter: "amazon-sp-api-sandbox",
        sort: "createdAt_desc",
        page: 1,
        pageSize: 20,
        dryRun: true,
      }),
    );

    assert(valid.status === 200, `valid readonly request should return 200. status=${valid.status}, body=${valid.text}`);
    assert(valid.json && Array.isArray(valid.json.rows), "valid readonly response must be JSON with rows");

    const row = valid.json.rows.find((item) => item.id === importJob.id);
    assert(row, `fixture ImportJob not found in readonly response: ${importJob.id}`);
    assertNoSensitiveProjection(row);

    const invalidPageSize = await requestJson(
      buildUrl({
        filter: "amazon-sp-api-sandbox",
        sort: "createdAt_desc",
        page: 1,
        pageSize: 10,
        dryRun: true,
      }),
    );

    assert(
      invalidPageSize.status === 400,
      `invalid pageSize must return 400. status=${invalidPageSize.status}, body=${invalidPageSize.text}`,
    );
    assert(!String(invalidPageSize.text || "").includes("Internal server error"), "invalid pageSize must not return 500 body");

    const missingDryRun = await requestJson(
      buildUrl({
        filter: "amazon-sp-api-sandbox",
        sort: "createdAt_desc",
        page: 1,
        pageSize: 20,
      }),
    );

    assert(
      missingDryRun.status === 400,
      `missing dryRun must return 400. status=${missingDryRun.status}, body=${missingDryRun.text}`,
    );
    assert(!String(missingDryRun.text || "").includes("Internal server error"), "missing dryRun must not return 500 body");

    const txAfter = await prisma.transaction.count({
      where: {
        companyId: company.id,
        sourceFileName: filename,
      },
    });

    const movementAfter = await prisma.inventoryMovement.count({
      where: {
        companyId: company.id,
        sourceId: {
          contains: `STEP122-Q-${runId}`,
        },
      },
    });

    assert(txBefore === txAfter, "auth-boundary preflight must not write Transaction rows");
    assert(movementBefore === movementAfter, "auth-boundary preflight must not write InventoryMovement rows");

    console.log("[SMOKE_OK] amazon sp-api sandbox ImportJob read-model HTTP auth-boundary preflight smoke passed");
    console.log(
      JSON.stringify(
        {
          ok: true,
          step: "Step122-Q",
          apiBase: API_BASE,
          endpoint: ENDPOINT,
          contract: {
            version: contract.version,
            preflightOnly: contract.preflightOnly,
            introducesAuthGuardNow: contract.introducesAuthGuardNow,
            frontendExposedNow: contract.frontendExposedNow,
            writesDatabase: contract.writesDatabase,
          },
          http: {
            healthStatus: health.status,
            validStatus: valid.status,
            invalidPageSizeStatus: invalidPageSize.status,
            missingDryRunStatus: missingDryRun.status,
          },
          fixture: {
            importJobId: importJob.id,
            filename,
            stagingRows: row.stagingRows,
            classification: row.classification,
            displayStatus: row.displayStatus,
          },
          projectionGuard: {
            rawPayloadJsonProjected: Object.prototype.hasOwnProperty.call(row, "rawPayloadJson"),
            normalizedPayloadJsonProjected: Object.prototype.hasOwnProperty.call(row, "normalizedPayloadJson"),
            dedupeHashProjected: Object.prototype.hasOwnProperty.call(row, "dedupeHash"),
            companyIdProjected: Object.prototype.hasOwnProperty.call(row, "companyId"),
          },
          leakCheck: {
            transactionBefore: txBefore,
            transactionAfter: txAfter,
            inventoryMovementBefore: movementBefore,
            inventoryMovementAfter: movementAfter,
          },
          frontendGuard: staticGuard,
        },
        null,
        2,
      ),
    );
  } finally {
    await cleanupByFilename(filename);
  }
}

main()
  .catch((err) => {
    console.error("[SMOKE_ERROR]", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
