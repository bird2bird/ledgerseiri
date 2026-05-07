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
  buildAmazonSpApiSandboxImportJobReadModelJwtNegativeHardening,
  assertAmazonSpApiSandboxImportJobReadModelJwtNegativeHardening,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-importjob-read-model-jwt-negative-hardening.dto");

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

function signJwt(payload, options = {}) {
  const secret = options.secret || process.env.JWT_SECRET || "dev_secret_change_me";
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    iat: options.iat ?? now,
    exp: options.exp ?? now + 60 * 60,
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
    "X-Step122-Smoke": "Step122-T",
  };
  if (token) headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;

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

function staticGuard() {
  const root = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(root, "..", "..");

  const packageJson = JSON.parse(read(path.resolve(root, "package.json")));
  const controllerSource = read(path.resolve(root, "src/imports/imports.controller.ts"));
  const serviceSource = read(path.resolve(root, "src/imports/imports.service.ts"));
  const jwtStrategy = read(path.resolve(root, "src/auth/jwt.strategy.ts"));
  const schema = read(path.resolve(root, "prisma/schema.prisma"));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-sandbox-importjob-read-model-jwt-negative-hardening"],
    "Step122-T npm script missing",
  );

  const routeSource = routeSourceFrom(controllerSource);

  assert(controllerSource.includes("import { JwtAuthGuard } from '../auth/jwt.guard';"), "JwtAuthGuard import missing");
  assert(routeSource.includes("@UseGuards(JwtAuthGuard)"), "route must use JwtAuthGuard");
  assert(routeSource.includes("@Req() req: Step122SAuthenticatedRequest"), "route must accept authenticated request");
  assert(routeSource.includes("req.user?.companyId"), "route must derive companyId from req.user.companyId");
  assert(routeSource.includes("STEP122_S_AUTH_COMPANY_REQUIRED"), "route must reject missing companyId");
  assert(routeSource.includes("companyId,"), "service call must pass companyId");
  assert(routeSource.includes("dryRun: true"), "dryRun must remain true");
  assert(jwtStrategy.includes("if (company?.status === 'SUSPENDED')"), "JwtStrategy must check suspended company");
  assert(jwtStrategy.includes("throw new ForbiddenException('TENANT_SUSPENDED')"), "JwtStrategy must throw TENANT_SUSPENDED");

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

  return {
    scannedFrontendFiles: webFiles.length,
    frontendLeaks,
  };
}

async function resolveUserWithCompany() {
  const user = await prisma.user.findFirst({
    where: { companyId: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { id: true, companyId: true, email: true },
  });

  if (!user || !user.companyId) {
    throw new Error("No active user with companyId found for Step122-T smoke");
  }

  return user;
}

async function cleanupFixture(runId) {
  const filename = `step122-t-jwt-negative-${runId}.json`;

  const jobs = await prisma.importJob.findMany({
    where: { filename },
    select: { id: true },
  });
  const ids = jobs.map((job) => job.id);

  if (ids.length) {
    await prisma.importStagingRow.deleteMany({ where: { importJobId: { in: ids } } });
  }

  await prisma.importJob.deleteMany({ where: { filename } });
  await prisma.user.deleteMany({ where: { email: { contains: `step122-t-${runId}` } } });
  await prisma.company.deleteMany({ where: { name: { contains: `Step122-T Suspended ${runId}` } } });
}

async function createSuspendedUser(runId) {
  const company = await prisma.company.create({
    data: {
      name: `Step122-T Suspended ${runId}`,
      status: "SUSPENDED",
      fiscalMonthStart: 1,
      timezone: "Asia/Tokyo",
      currency: "JPY",
    },
    select: { id: true, name: true, status: true },
  });

  const user = await prisma.user.create({
    data: {
      email: `step122-t-${runId}@suspended.example.test`,
      password: "step122-t-smoke-password-not-used",
      companyId: company.id,
    },
    select: { id: true, email: true, companyId: true },
  });

  return { company, user };
}

async function createReadModelFixture(args) {
  const { companyId, runId } = args;
  const filename = `step122-t-jwt-negative-${runId}.json`;

  const importJob = await prisma.importJob.create({
    data: {
      companyId,
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
      company: { connect: { id: companyId } },
      module: "store-orders",
      rowNo: 1,
      businessMonth: "2026-05",
      matchStatus: "new",
      matchReason: "STEP122_T_JWT_NEGATIVE_HARDENING_FIXTURE",
      dedupeHash: `STEP122-T-${runId}-1`,
      rawPayloadJson: { mustNotBeProjected: true },
      normalizedPayloadJson: {
        mustNotBeProjected: true,
        contractVersion: "amazon-order-normalized-v1",
        sourceType: "AMAZON_ORDER_SP_API",
        module: "store-orders",
      },
    },
  });

  return importJob;
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

async function main() {
  const contract = assertAmazonSpApiSandboxImportJobReadModelJwtNegativeHardening(
    buildAmazonSpApiSandboxImportJobReadModelJwtNegativeHardening(),
  );

  assert(contract.smokeOnly === true, "Step122-T must remain smoke-only");
  assert(contract.controllerChangedNow === false, "Step122-T must not change controller");
  assert(contract.serviceChangedNow === false, "Step122-T must not change service");
  assert(contract.frontendExposedNow === false, "frontend must remain disabled");
  assert(contract.writesDatabase === false, "writes must remain disabled");

  const sourceGuard = staticGuard();

  const health = await requestJson(new URL("/health", API_BASE));
  assert(health.status === 200, `health should be 200. status=${health.status}, body=${health.text}`);

  const activeUser = await resolveUserWithCompany();
  const activeToken = signJwt({ sub: activeUser.id });

  const now = Math.floor(Date.now() / 1000);
  const malformedToken = "not-a-valid-jwt";
  const wrongSignatureToken = signJwt({ sub: activeUser.id }, { secret: "wrong-secret-for-step122-t" });
  const expiredToken = signJwt({ sub: activeUser.id }, { iat: now - 7200, exp: now - 3600 });
  const userNotFoundToken = signJwt({ sub: `missing-step122-t-user-${Date.now()}` });

  const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);

  await cleanupFixture(runId);

  const txBefore = await prisma.transaction.count({
    where: { companyId: activeUser.companyId, sourceFileName: `step122-t-jwt-negative-${runId}.json` },
  });

  const movementBefore = await prisma.inventoryMovement.count({
    where: { companyId: activeUser.companyId, sourceId: { contains: `STEP122-T-${runId}` } },
  });

  let importJob = null;
  let suspended = null;

  try {
    importJob = await createReadModelFixture({
      companyId: activeUser.companyId,
      runId,
    });

    suspended = await createSuspendedUser(runId);
    const suspendedToken = signJwt({ sub: suspended.user.id });

    const validUrl = buildUrl({
      filter: "amazon-sp-api-sandbox",
      sort: "createdAt_desc",
      page: 1,
      pageSize: 20,
      dryRun: true,
    });

    const invalidPageSizeUrl = buildUrl({
      filter: "amazon-sp-api-sandbox",
      sort: "createdAt_desc",
      page: 1,
      pageSize: 10,
      dryRun: true,
    });

    const missingToken = await requestJson(validUrl);
    assert(missingToken.status === 401, `missing token must return 401. status=${missingToken.status}, body=${missingToken.text}`);

    const malformed = await requestJson(validUrl, malformedToken);
    assert(malformed.status === 401, `malformed token must return 401. status=${malformed.status}, body=${malformed.text}`);

    const wrongSignature = await requestJson(validUrl, wrongSignatureToken);
    assert(wrongSignature.status === 401, `wrong signature token must return 401. status=${wrongSignature.status}, body=${wrongSignature.text}`);

    const expired = await requestJson(validUrl, expiredToken);
    assert(expired.status === 401, `expired token must return 401. status=${expired.status}, body=${expired.text}`);

    const userNotFound = await requestJson(validUrl, userNotFoundToken);
    assert(userNotFound.status === 401, `user-not-found token must return 401. status=${userNotFound.status}, body=${userNotFound.text}`);

    const suspendedTenant = await requestJson(validUrl, suspendedToken);
    assert(
      suspendedTenant.status === 403,
      `suspended tenant token must return 403. status=${suspendedTenant.status}, body=${suspendedTenant.text}`,
    );
    assert(
      String(suspendedTenant.text || "").includes("TENANT_SUSPENDED") || String(suspendedTenant.text || "").includes("Forbidden"),
      `suspended tenant response should expose forbidden/TENANT_SUSPENDED boundary. body=${suspendedTenant.text}`,
    );

    const valid = await requestJson(validUrl, activeToken);
    assert(valid.status === 200, `valid token must return 200. status=${valid.status}, body=${valid.text}`);
    assert(valid.json && Array.isArray(valid.json.rows), "valid response must include rows");

    const row = valid.json.rows.find((item) => item.id === importJob.id);
    assert(row, `fixture ImportJob missing from valid response: ${importJob.id}`);
    assert(row.filename === importJob.filename, "fixture filename mismatch");
    assertNoSensitiveProjection(row);

    const validInvalidQuery = await requestJson(invalidPageSizeUrl, activeToken);
    assert(
      validInvalidQuery.status === 400,
      `valid token + invalid query must return 400. status=${validInvalidQuery.status}, body=${validInvalidQuery.text}`,
    );

    const txAfter = await prisma.transaction.count({
      where: { companyId: activeUser.companyId, sourceFileName: `step122-t-jwt-negative-${runId}.json` },
    });

    const movementAfter = await prisma.inventoryMovement.count({
      where: { companyId: activeUser.companyId, sourceId: { contains: `STEP122-T-${runId}` } },
    });

    assert(txBefore === txAfter, "JWT negative hardening smoke must not write Transaction rows");
    assert(movementBefore === movementAfter, "JWT negative hardening smoke must not write InventoryMovement rows");

    console.log("[SMOKE_OK] amazon sp-api sandbox ImportJob read-model JWT negative hardening smoke passed");
    console.log(
      JSON.stringify(
        {
          ok: true,
          step: "Step122-T",
          apiBase: API_BASE,
          endpoint: ENDPOINT,
          contract: {
            version: contract.version,
            smokeOnly: contract.smokeOnly,
            controllerChangedNow: contract.controllerChangedNow,
            serviceChangedNow: contract.serviceChangedNow,
            frontendExposedNow: contract.frontendExposedNow,
            writesDatabase: contract.writesDatabase,
          },
          http: {
            missingTokenStatus: missingToken.status,
            malformedTokenStatus: malformed.status,
            wrongSignatureStatus: wrongSignature.status,
            expiredTokenStatus: expired.status,
            userNotFoundStatus: userNotFound.status,
            suspendedTenantStatus: suspendedTenant.status,
            validStatus: valid.status,
            validInvalidQueryStatus: validInvalidQuery.status,
          },
          fixture: {
            importJobId: importJob.id,
            filename: importJob.filename,
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
          suspendedFixture: {
            companyId: suspended.company.id,
            userId: suspended.user.id,
            status: suspended.company.status,
          },
          sourceGuard,
        },
        null,
        2,
      ),
    );
  } finally {
    await cleanupFixture(runId);
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
