#!/usr/bin/env node
"use strict";

process.env.AMAZON_SP_API_SANDBOX_INTERNAL_ENABLED = "true";
process.env.AMAZON_SP_API_REAL_ENABLED = "false";
process.env.AMAZON_SP_API_OAUTH_ENABLED = "false";
process.env.AMAZON_SP_API_TOKEN_PERSISTENCE_ENABLED = "false";
process.env.AMAZON_SP_API_SANDBOX_IMPORTJOB_PERSISTENCE_ENABLED = "false";

const fs = require("fs");
const path = require("path");
const { assertStep122ReadModelFrontendBoundary } = require("./lib/step122-read-model-frontend-boundary");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const API_BASE = process.env.LEDGERSEIRI_API_BASE || "http://localhost:3001";
const ENDPOINT = "/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Step122-S auth-aware helper: HTTP read-model endpoint now requires JwtAuthGuard.
function base64url(input) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function signStep122SmokeJwt(payload) {
  const secret = process.env.JWT_SECRET || "dev_secret_change_me";
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const body = { iat: now, exp: now + 60 * 60, ...payload };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedBody = base64url(JSON.stringify(body));
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${encodedHeader}.${encodedBody}.${signature}`;
}

async function resolveStep122SmokeUserWithCompany() {
  const user = await prisma.user.findFirst({
    where: { companyId: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { id: true, companyId: true, email: true },
  });
  if (!user || !user.companyId) {
    throw new Error("No user with companyId found for Step122 HTTP smoke");
  }
  return user;
}


function read(file) {
  return fs.readFileSync(file, "utf8");
}

async function resolveCompany() {
  const company = await prisma.company.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });
  if (!company) throw new Error("No company found for Step122-P smoke");
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

function buildUrl(params) {
  const url = new URL(ENDPOINT, API_BASE);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }
  return url;
}

async function requestJson(url, token) {
  const headers = {
    Accept: "application/json",
    "X-Step122-Smoke": "Step122-P",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method: "GET",
    headers,
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

function assertNoProjectedSensitiveFields(row) {
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

function inspectStaticSource() {
  const root = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(root, "..", "..");

  const controllerSource = read(path.resolve(root, "src/imports/imports.controller.ts"));
  const serviceSource = read(path.resolve(root, "src/imports/imports.service.ts"));
  const schema = read(path.resolve(root, "prisma/schema.prisma"));

  assert(
    controllerSource.includes("Step122-O: Amazon SP-API sandbox ImportJob read-model readonly controller service-call implementation."),
    "Step122-O controller marker missing",
  );
  assert(
    controllerSource.includes("@Get('internal/amazon-sp-api-sandbox/import-jobs/read-model')"),
    "HTTP GET route missing",
  );
  assert(
    controllerSource.includes("assertAmazonSpApiSandboxEnvironmentGate({ requireInternalSandbox: true })"),
    "internal sandbox env gate missing",
  );
  assert(
    controllerSource.includes("normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery(query)"),
    "query normalization missing",
  );
  assert(
    controllerSource.includes("this.service['listAmazonSpApiSandboxImportJobsReadModelDryRun']"),
    "readonly controller service call missing",
  );
  assert(controllerSource.includes("dryRun: true"), "controller must force dryRun=true");

  assert(
    serviceSource.includes("async ['listAmazonSpApiSandboxImportJobsReadModelDryRun']("),
    "Step122-F internal read-model service method missing",
  );

  const routeStart = controllerSource.indexOf(
    "Step122-O: Amazon SP-API sandbox ImportJob read-model readonly controller service-call implementation.",
  );
  const routeEnd = controllerSource.indexOf("@Post('detect-month-conflicts')", routeStart);
  assert(routeStart >= 0 && routeEnd > routeStart, "Step122-O route source range missing");
  const routeSource = controllerSource.slice(routeStart, routeEnd);

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
    assert(!routeSource.includes(forbidden), `Step122-O HTTP route must not contain forbidden fragment: ${forbidden}`);
  }

  for (const forbiddenModel of [
    "AmazonSpApiSandboxImportJobReadModel",
    "AmazonSpApiCredential",
    "AmazonSpApiToken",
    "CrossSourceDedupe",
  ]) {
    assert(!schema.includes(forbiddenModel), `schema must not contain ${forbiddenModel}`);
  }

  const frontendBoundary = assertStep122ReadModelFrontendBoundary(repoRoot, {
    allowClientHelper: true,
    allowRuntimePanelHelperUse: true,
  });

  return {
    frontendLeaks: [],
    frontendBoundary,
  };
}

async function main() {
  const staticGuard = inspectStaticSource();

  const healthUrl = new URL("/health", API_BASE);
  const health = await fetch(healthUrl, { method: "GET" }).catch((err) => {
    throw new Error(
      `API server is not reachable at ${API_BASE}. Start the API container/server first. Original error: ${err.message}`,
    );
  });

  assert(
    health.status < 500,
    `API server health check returned ${health.status}; check docker compose logs api`,
  );

  const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const filename = `step122-p-http-runtime-${runId}.json`;
  const smokeUser = await resolveStep122SmokeUserWithCompany();
  const smokeToken = signStep122SmokeJwt({ sub: smokeUser.id });
  const company = { id: smokeUser.companyId, name: 'Step122 smoke company from JWT user' };

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
        contains: `STEP122-P-${runId}`,
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
      select: {
        id: true,
        filename: true,
      },
    });

    await prisma.importStagingRow.create({
      data: {
        importJob: { connect: { id: importJob.id } },
        company: { connect: { id: company.id } },
        module: "store-orders",
        rowNo: 1,
        businessMonth: "2026-05",
        matchStatus: "new",
        matchReason: "STEP122_P_HTTP_RUNTIME_FIXTURE",
        dedupeHash: `STEP122-P-${runId}-1`,
        rawPayloadJson: { mustNotBeProjected: true },
        normalizedPayloadJson: {
          mustNotBeProjected: true,
          contractVersion: "amazon-order-normalized-v1",
          sourceType: "AMAZON_ORDER_SP_API",
          module: "store-orders",
        },
      },
    });

    const okUrl = buildUrl({
      filter: "amazon-sp-api-sandbox",
      sort: "createdAt_desc",
      page: 1,
      pageSize: 20,
      dryRun: true,
    });

    const okResponse = await requestJson(okUrl, smokeToken);
    assert(
      okResponse.ok,
      `HTTP readonly endpoint should return 2xx. status=${okResponse.status}, body=${okResponse.text}`,
    );
    assert(okResponse.json, "HTTP readonly endpoint returned non-JSON response");

    const result = okResponse.json;
    assert(result.dryRun === true, "HTTP result dryRun mismatch");
    assert(result.displayOnly === true, "HTTP result displayOnly mismatch");
    assert(result.sourceType === "amazon-sp-api-sandbox", "HTTP result sourceType mismatch");
    assert(Array.isArray(result.rows), "HTTP result rows must be an array");
    assert(result.page === 1, "HTTP result page mismatch");
    assert(result.pageSize === 20, "HTTP result pageSize mismatch");

    const row = result.rows.find((item) => item.id === importJob.id);
    assert(row, `HTTP readonly response did not include fixture ImportJob ${importJob.id}`);
    assert(row.filename === filename, "fixture filename mismatch");
    assert(row.stagingRows === 1, "fixture stagingRows mismatch");
    assert(row.allowedActions.viewOnly === true, "viewOnly must be true");
    assert(row.allowedActions.commitSales === false, "commitSales must remain false");
    assert(row.allowedActions.executeInventory === false, "executeInventory must remain false");
    assert(row.allowedActions.realSpApi === false, "realSpApi must remain false");
    assert(row.allowedActions.oauth === false, "oauth must remain false");
    assertNoProjectedSensitiveFields(row);

    const invalidPageSizeUrl = buildUrl({
      filter: "amazon-sp-api-sandbox",
      sort: "createdAt_desc",
      page: 1,
      pageSize: 10,
      dryRun: true,
    });
    const invalidPageSize = await requestJson(invalidPageSizeUrl, smokeToken);
    assert(
      invalidPageSize.status === 400,
      `invalid pageSize should return 400. status=${invalidPageSize.status}, body=${invalidPageSize.text}`,
    );

    const missingDryRunUrl = buildUrl({
      filter: "amazon-sp-api-sandbox",
      sort: "createdAt_desc",
      page: 1,
      pageSize: 20,
    });
    const missingDryRun = await requestJson(missingDryRunUrl, smokeToken);
    assert(
      missingDryRun.status === 400,
      `missing dryRun should return 400. status=${missingDryRun.status}, body=${missingDryRun.text}`,
    );

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
          contains: `STEP122-P-${runId}`,
        },
      },
    });

    assert(txBefore === txAfter, "HTTP readonly endpoint must not write Transaction rows");
    assert(movementBefore === movementAfter, "HTTP readonly endpoint must not write InventoryMovement rows");

    console.log("[SMOKE_OK] amazon sp-api sandbox ImportJob read-model HTTP GET runtime smoke passed");
    console.log(
      JSON.stringify(
        {
          ok: true,
          step: "Step122-P",
          apiBase: API_BASE,
          endpoint: ENDPOINT,
          fixture: {
            importJobId: importJob.id,
            filename,
            stagingRows: row.stagingRows,
            classification: row.classification,
            displayStatus: row.displayStatus,
          },
          http: {
            okStatus: okResponse.status,
            invalidPageSizeStatus: invalidPageSize.status,
            missingDryRunStatus: missingDryRun.status,
          },
          result: {
            dryRun: result.dryRun,
            displayOnly: result.displayOnly,
            sourceType: result.sourceType,
            page: result.page,
            pageSize: result.pageSize,
            totalRows: result.totalRows,
            totalPages: result.totalPages,
          },
          leakCheck: {
            transactionBefore: txBefore,
            transactionAfter: txAfter,
            inventoryMovementBefore: movementBefore,
            inventoryMovementAfter: movementAfter,
          },
          projectionGuard: {
            rawPayloadJsonProjected: Object.prototype.hasOwnProperty.call(row, "rawPayloadJson"),
            normalizedPayloadJsonProjected: Object.prototype.hasOwnProperty.call(row, "normalizedPayloadJson"),
            dedupeHashProjected: Object.prototype.hasOwnProperty.call(row, "dedupeHash"),
            companyIdProjected: Object.prototype.hasOwnProperty.call(row, "companyId"),
          },
          frontendGuard: {
            frontendLeaks: staticGuard.frontendLeaks,
          },
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
