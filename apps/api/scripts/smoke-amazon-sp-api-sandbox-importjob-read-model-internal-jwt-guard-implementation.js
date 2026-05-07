#!/usr/bin/env node
"use strict";

process.env.AMAZON_SP_API_REAL_ENABLED = "false";
process.env.AMAZON_SP_API_OAUTH_ENABLED = "false";
process.env.AMAZON_SP_API_TOKEN_PERSISTENCE_ENABLED = "false";
process.env.AMAZON_SP_API_SANDBOX_IMPORTJOB_PERSISTENCE_ENABLED = "false";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const {
  buildAmazonSpApiSandboxImportJobReadModelInternalJwtGuardImplementation,
  assertAmazonSpApiSandboxImportJobReadModelInternalJwtGuardImplementation,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-importjob-read-model-internal-jwt-guard-implementation.dto");

const prisma = new PrismaClient();

const API_BASE = process.env.LEDGERSEIRI_API_BASE || "http://localhost:3001";
const ENDPOINT = "/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function base64url(input) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function signJwt(payload) {
  const secret = process.env.JWT_SECRET || "dev_secret_change_me";
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    iat: now,
    exp: now + 60 * 60,
    ...payload,
  };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(fullPayload));
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${encodedHeader}.${encodedPayload}.${signature}`;
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
    "X-Step122-Smoke": "Step122-S",
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

  return { ok: res.ok, status: res.status, text, json };
}

async function resolveUserWithCompany() {
  const user = await prisma.user.findFirst({
    where: {
      companyId: {
        not: null,
      },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, companyId: true, email: true },
  });
  if (!user || !user.companyId) {
    throw new Error("No user with companyId found for Step122-S smoke");
  }
  return user;
}

async function resolveUserWithoutCompany() {
  const user = await prisma.user.findFirst({
    where: { companyId: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, companyId: true, email: true },
  });
  return user;
}

async function cleanupByFilename(filename) {
  const jobs = await prisma.importJob.findMany({
    where: { filename },
    select: { id: true },
  });
  const ids = jobs.map((job) => job.id);
  if (ids.length) {
    await prisma.importStagingRow.deleteMany({ where: { importJobId: { in: ids } } });
  }
  await prisma.importJob.deleteMany({ where: { filename } });
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

function staticGuard() {
  const root = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(root, "..", "..");

  const packageJson = JSON.parse(read(path.resolve(root, "package.json")));
  const controllerSource = read(path.resolve(root, "src/imports/imports.controller.ts"));
  const serviceSource = read(path.resolve(root, "src/imports/imports.service.ts"));
  const schema = read(path.resolve(root, "prisma/schema.prisma"));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-sandbox-importjob-read-model-internal-jwt-guard-implementation"],
    "Step122-S npm script missing",
  );

  const routeSource = routeSourceFrom(controllerSource);

  assert(controllerSource.includes("import { JwtAuthGuard } from '../auth/jwt.guard';"), "JwtAuthGuard import missing");
  assert(routeSource.includes("@UseGuards(JwtAuthGuard)"), "route must use JwtAuthGuard");
  assert(routeSource.indexOf("@UseGuards(JwtAuthGuard)") < routeSource.indexOf("@Get('internal/amazon-sp-api-sandbox/import-jobs/read-model')"), "guard decorator must be before GET decorator");
  assert(routeSource.includes("@Req() req: Step122SAuthenticatedRequest"), "route must accept authenticated request");
  assert(routeSource.includes("req.user?.companyId"), "route must derive companyId from req.user.companyId");
  assert(routeSource.includes("STEP122_S_AUTH_COMPANY_REQUIRED"), "route must reject missing companyId");
  assert(routeSource.includes("companyId,"), "service call must pass companyId");
  assert(routeSource.includes("dryRun: true"), "dryRun must remain true");
  assert(routeSource.includes("STEP122_P_HTTP_QUERY_VALIDATION_BAD_REQUEST"), "query validation 400 boundary must remain");
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

  const webFiles = listFiles(path.resolve(repoRoot, "apps/web/src"), (p) => /\.(ts|tsx|js|jsx)$/.test(p));
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

  return { scannedFrontendFiles: webFiles.length, frontendLeaks };
}

async function main() {
  const contract = assertAmazonSpApiSandboxImportJobReadModelInternalJwtGuardImplementation(
    buildAmazonSpApiSandboxImportJobReadModelInternalJwtGuardImplementation(),
  );
  assert(contract.implementedNow === true, "Step122-S contract must be implemented");
  assert(contract.endpointRequiresJwtNow === true, "endpoint must require JWT now");
  assert(contract.endpointRequiresCompanyIdNow === true, "endpoint must require companyId now");
  assert(contract.frontendExposedNow === false, "frontend must remain disabled");
  assert(contract.writesDatabase === false, "writes must remain disabled");

  const sourceGuard = staticGuard();

  const health = await requestJson(new URL("/health", API_BASE));
  assert(health.status === 200, `health should be 200. status=${health.status}, body=${health.text}`);

  const user = await resolveUserWithCompany();
  const token = signJwt({ sub: user.id });

  const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const filename = `step122-s-jwt-guard-${runId}.json`;

  await cleanupByFilename(filename);

  const txBefore = await prisma.transaction.count({
    where: { companyId: user.companyId, sourceFileName: filename },
  });
  const movementBefore = await prisma.inventoryMovement.count({
    where: { companyId: user.companyId, sourceId: { contains: `STEP122-S-${runId}` } },
  });

  let importJob = null;

  try {
    importJob = await prisma.importJob.create({
      data: {
        companyId: user.companyId,
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
        company: { connect: { id: user.companyId } },
        module: "store-orders",
        rowNo: 1,
        businessMonth: "2026-05",
        matchStatus: "new",
        matchReason: "STEP122_S_JWT_GUARD_FIXTURE",
        dedupeHash: `STEP122-S-${runId}-1`,
        rawPayloadJson: { mustNotBeProjected: true },
        normalizedPayloadJson: {
          mustNotBeProjected: true,
          contractVersion: "amazon-order-normalized-v1",
          sourceType: "AMAZON_ORDER_SP_API",
          module: "store-orders",
        },
      },
    });

    const validUrl = buildUrl({
      filter: "amazon-sp-api-sandbox",
      sort: "createdAt_desc",
      page: 1,
      pageSize: 20,
      dryRun: true,
    });

    const unauthenticated = await requestJson(validUrl);
    assert(
      unauthenticated.status === 401,
      `unauthenticated request must return 401. status=${unauthenticated.status}, body=${unauthenticated.text}`,
    );

    const authenticated = await requestJson(validUrl, token);
    assert(
      authenticated.status === 200,
      `authenticated request must return 200. status=${authenticated.status}, body=${authenticated.text}`,
    );
    assert(authenticated.json && Array.isArray(authenticated.json.rows), "authenticated response must include rows");

    const row = authenticated.json.rows.find((item) => item.id === importJob.id);
    assert(row, `fixture ImportJob missing from authenticated response: ${importJob.id}`);
    assert(row.filename === filename, "fixture filename mismatch");
    assertNoSensitiveProjection(row);

    const invalidPageSize = await requestJson(
      buildUrl({
        filter: "amazon-sp-api-sandbox",
        sort: "createdAt_desc",
        page: 1,
        pageSize: 10,
        dryRun: true,
      }),
      token,
    );
    assert(
      invalidPageSize.status === 400,
      `authenticated invalid pageSize must return 400. status=${invalidPageSize.status}, body=${invalidPageSize.text}`,
    );

    const missingDryRun = await requestJson(
      buildUrl({
        filter: "amazon-sp-api-sandbox",
        sort: "createdAt_desc",
        page: 1,
        pageSize: 20,
      }),
      token,
    );
    assert(
      missingDryRun.status === 400,
      `authenticated missing dryRun must return 400. status=${missingDryRun.status}, body=${missingDryRun.text}`,
    );

    const userWithoutCompany = await resolveUserWithoutCompany();
    let missingCompanyStatus = "SKIPPED_NO_USER_WITHOUT_COMPANY";
    if (userWithoutCompany) {
      const noCompanyToken = signJwt({ sub: userWithoutCompany.id });
      const noCompany = await requestJson(validUrl, noCompanyToken);
      assert(
        noCompany.status === 403,
        `authenticated user without companyId must return 403. status=${noCompany.status}, body=${noCompany.text}`,
      );
      missingCompanyStatus = "403";
    }

    const txAfter = await prisma.transaction.count({
      where: { companyId: user.companyId, sourceFileName: filename },
    });
    const movementAfter = await prisma.inventoryMovement.count({
      where: { companyId: user.companyId, sourceId: { contains: `STEP122-S-${runId}` } },
    });

    assert(txBefore === txAfter, "JWT guarded read-model endpoint must not write Transaction rows");
    assert(movementBefore === movementAfter, "JWT guarded read-model endpoint must not write InventoryMovement rows");

    console.log("[SMOKE_OK] amazon sp-api sandbox ImportJob read-model internal JWT guard implementation smoke passed");
    console.log(
      JSON.stringify(
        {
          ok: true,
          step: "Step122-S",
          apiBase: API_BASE,
          endpoint: ENDPOINT,
          contract: {
            version: contract.version,
            implementedNow: contract.implementedNow,
            authGuardImplementedNow: contract.authGuardImplementedNow,
            endpointRequiresJwtNow: contract.endpointRequiresJwtNow,
            endpointRequiresCompanyIdNow: contract.endpointRequiresCompanyIdNow,
            frontendExposedNow: contract.frontendExposedNow,
            writesDatabase: contract.writesDatabase,
          },
          http: {
            unauthenticatedStatus: unauthenticated.status,
            authenticatedStatus: authenticated.status,
            invalidPageSizeStatus: invalidPageSize.status,
            missingDryRunStatus: missingDryRun.status,
            missingCompanyStatus,
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
          sourceGuard,
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
