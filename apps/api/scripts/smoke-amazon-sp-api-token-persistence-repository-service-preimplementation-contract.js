#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const {
  assertAmazonSpApiTokenPersistenceRepositoryServicePreimplementationContract,
  buildAmazonSpApiTokenPersistenceRepositoryServicePreimplementationContract,
} = require("../dist/src/imports/dto/amazon-sp-api-token-persistence-repository-service-preimplementation-contract.dto");

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

    if (stat.isDirectory()) {
      if (name === "node_modules" || name === "dist" || name === ".next" || name === "coverage") continue;
      listFiles(p, predicate, acc);
    } else if (predicate(p)) {
      acc.push(p);
    }
  }

  return acc;
}

async function assertDeployedTablesExist() {
  const prisma = new PrismaClient();

  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'AmazonSpApiConnection',
          'AmazonSpApiCredential',
          'AmazonSpApiAccessTokenCache',
          'AmazonSpApiConnectionAudit'
        )
      ORDER BY table_name
    `;

    const tableNames = tables.map((row) => row.table_name);

    for (const table of [
      "AmazonSpApiConnection",
      "AmazonSpApiCredential",
      "AmazonSpApiAccessTokenCache",
      "AmazonSpApiConnectionAudit",
    ]) {
      assert(tableNames.includes(table), `Missing deployed table: ${table}`);
    }

    return { tableNames };
  } finally {
    await prisma.$disconnect();
  }
}

function isDtoOrSmoke(rel) {
  return rel.includes("/src/imports/dto/") || rel.includes("/scripts/smoke-amazon-sp-api");
}

function isGenericPlatformAuth(rel, text) {
  if (
    rel === "apps/api/src/auth/auth.controller.ts" ||
    rel === "apps/api/src/auth/auth.service.ts" ||
    rel === "apps/api/src/auth/refresh.controller.ts" ||
    rel === "apps/api/src/auth/refresh.service.ts" ||
    rel === "apps/api/src/platform-auth/platform-auth.service.ts"
  ) {
    return true;
  }

  return (
    rel.includes("/src/auth/") ||
    rel.includes("/src/platform-auth/")
  ) && !/(amazon|sp-api|spapi|seller|sellingPartner|marketplace|lwa|AmazonSpApi|amazonSpApi)/i.test(text);
}

function hasAmazonScope(text) {
  return /(amazon|sp-api|spapi|seller|sellingPartner|marketplace|lwa|AmazonSpApi|amazonSpApi)/i.test(text);
}

function assertNoImplementationLeak(repoRoot) {
  const apiSrc = path.resolve(repoRoot, "apps/api/src");
  const webSrc = path.resolve(repoRoot, "apps/web/src");

  const apiFiles = listFiles(apiSrc, (p) => /\.(ts|tsx|js|jsx)$/.test(p));
  const webFiles = listFiles(webSrc, (p) => /\.(ts|tsx|js|jsx)$/.test(p));

  const serviceWriteLeaks = [];
  const routeLeaks = [];
  const frontendLeaks = [];
  const amazonScopedPlaintextTokenLeaks = [];

  const allowedSandboxFragments = [
    "AmazonSpApiSandbox",
    "amazon-sp-api-sandbox",
    "amazonSpApiSandbox",
  ];

  for (const file of apiFiles) {
    const text = read(file);
    const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");
    const sandboxOnly = allowedSandboxFragments.some((fragment) => text.includes(fragment));

    if (isDtoOrSmoke(rel) || sandboxOnly) continue;

    if (
      /prisma\.amazonSpApi(Connection|Credential|AccessTokenCache|ConnectionAudit)\.(create|update|upsert|delete|deleteMany|updateMany)/.test(text)
    ) {
      serviceWriteLeaks.push(rel);
    }

    if (
      /@(Get|Post|Patch|Delete)\s*\([^)]*(amazon-sp-api|sp-api|oauth|lwa|callback|authorization|authorize|token|credential|connection)/i.test(text) &&
      hasAmazonScope(text)
    ) {
      routeLeaks.push(rel);
    }

    if (
      hasAmazonScope(text) &&
      !isGenericPlatformAuth(rel, text) &&
      /(refreshToken|accessToken|clientSecret|authorizationCode)\s*[:=]/.test(text) &&
      !/encryptedRefreshToken|encryptedAccessToken/.test(text)
    ) {
      amazonScopedPlaintextTokenLeaks.push(rel);
    }

    if (
      hasAmazonScope(text) &&
      !isGenericPlatformAuth(rel, text) &&
      /console\.(log|warn|error)\([^)]*(refreshToken|accessToken|clientSecret|authorizationCode|token)/i.test(text)
    ) {
      amazonScopedPlaintextTokenLeaks.push(rel);
    }
  }

  for (const file of webFiles) {
    const text = read(file);
    const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");
    const sandboxOnly = allowedSandboxFragments.some((fragment) => text.includes(fragment));

    if (
      !sandboxOnly &&
      (
        text.includes("/api/imports/amazon-sp-api") ||
        text.includes("AmazonSpApiConnectionStatus") ||
        text.includes("amazonSpApiConnection") ||
        text.includes("Amazonと連携") ||
        text.includes("連携解除")
      )
    ) {
      frontendLeaks.push(rel);
    }
  }

  assert(serviceWriteLeaks.length === 0, `Unexpected token persistence service write implementation leak: ${JSON.stringify(serviceWriteLeaks)}`);
  assert(routeLeaks.length === 0, `Unexpected Amazon SP-API route implementation leak: ${JSON.stringify(routeLeaks)}`);
  assert(frontendLeaks.length === 0, `Unexpected Amazon SP-API frontend implementation leak: ${JSON.stringify(frontendLeaks)}`);
  assert(amazonScopedPlaintextTokenLeaks.length === 0, `Unexpected Amazon-scoped plaintext token leak: ${JSON.stringify(amazonScopedPlaintextTokenLeaks)}`);

  return {
    serviceWriteLeaks,
    routeLeaks,
    frontendLeaks,
    amazonScopedPlaintextTokenLeaks,
    scannerScope: {
      ignoresGenericPlatformAuth: true,
      onlyFlagsAmazonScopedPlaintextTokens: true,
    },
  };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");
  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-token-persistence-repository-service-preimplementation-contract"] ===
      "node scripts/smoke-amazon-sp-api-token-persistence-repository-service-preimplementation-contract.js",
    "Step125-A npm script missing or mismatched",
  );

  const contract = assertAmazonSpApiTokenPersistenceRepositoryServicePreimplementationContract(
    buildAmazonSpApiTokenPersistenceRepositoryServicePreimplementationContract(),
  );

  assert(contract.sourceStep124G.summary.readyForStep125TokenPersistencePreImplementationContract === true, "Step124-G must allow Step125-A");
  assert(contract.contractOnly === true, "Step125-A must be contract-only");
  assert(contract.preImplementationOnly === true, "Step125-A must be pre-implementation only");
  assert(contract.tokenPersistenceServiceImplementationNow === false, "Step125-A must not implement token persistence service");
  assert(contract.databaseWriteNow === false, "Step125-A must not write DB");
  assert(contract.scannerScopePlan.scannerMustIgnoreGenericPlatformAuthTokens === true, "Step125-A scanner must ignore generic platform auth tokens");
  assert(contract.nextAllowedWork.tokenPersistenceRepositoryServiceImplementation === true, "Step125-A should allow Step125-B");
  assert(contract.summary.readyForStep125BTokenPersistenceRepositoryServiceImplementation === true, "Step125-A should allow Step125-B next");

  const dbGuard = await assertDeployedTablesExist();
  const implementationGuard = assertNoImplementationLeak(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api token persistence repository/service preimplementation contract smoke passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step125-A",
    dbGuard,
    implementationGuard,
    summary: contract.summary,
  }, null, 2));
}

main().catch((err) => {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
});
