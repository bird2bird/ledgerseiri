#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const {
  assertAmazonSpApiTokenPersistenceRuntimeSmokeRecordHandoffContract,
  buildAmazonSpApiTokenPersistenceRuntimeSmokeRecordHandoffContract,
} = require("../dist/src/imports/dto/amazon-sp-api-token-persistence-runtime-smoke-record-handoff-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

async function assertNoStep125CLeftoverFixtures() {
  const prisma = new PrismaClient();

  try {
    const companies = await prisma.company.findMany({
      where: { id: { startsWith: "step125c-company-" } },
      select: { id: true },
    });

    const stores = await prisma.store.findMany({
      where: { id: { startsWith: "step125c-store-" } },
      select: { id: true },
    });

    const connections = await prisma.amazonSpApiConnection.findMany({
      where: {
        OR: [
          { companyId: { startsWith: "step125c-company-" } },
          { storeId: { startsWith: "step125c-store-" } },
          { sellingPartnerId: { startsWith: "A-STEP125C-SELLER-" } },
          { appId: { startsWith: "amzn1.application-oa2-client.step125c-" } },
        ],
      },
      select: { id: true },
    });

    assert(companies.length === 0, `Step125-C leftover Company fixtures found: ${JSON.stringify(companies)}`);
    assert(stores.length === 0, `Step125-C leftover Store fixtures found: ${JSON.stringify(stores)}`);
    assert(connections.length === 0, `Step125-C leftover AmazonSpApiConnection fixtures found: ${JSON.stringify(connections)}`);

    return {
      leftoverCompanies: companies.length,
      leftoverStores: stores.length,
      leftoverConnections: connections.length,
    };
  } finally {
    await prisma.$disconnect();
  }
}

function assertNoNewRuntimeImplementation(repoRoot) {
  const importsController = path.resolve(repoRoot, "apps/api/src/imports/imports.controller.ts");
  const controllerText = fs.existsSync(importsController) ? read(importsController) : "";

  assert(
    !/@(Get|Post|Patch|Delete)\s*\([^)]*(oauth|lwa|callback|authorization|authorize|token|credential|connection)/i.test(controllerText),
    "Step125-D must not add OAuth/token controller routes",
  );

  return { importsControllerRouteLeak: false };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");
  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-token-persistence-runtime-smoke-record-handoff-contract"] ===
      "node scripts/smoke-amazon-sp-api-token-persistence-runtime-smoke-record-handoff-contract.js",
    "Step125-D npm script missing or mismatched",
  );

  const contract = assertAmazonSpApiTokenPersistenceRuntimeSmokeRecordHandoffContract(
    buildAmazonSpApiTokenPersistenceRuntimeSmokeRecordHandoffContract(),
  );

  assert(contract.sourceStep125C.summary.readyForStep125DTokenPersistenceRuntimeSmokeRecord === true, "Step125-C must allow Step125-D");
  assert(contract.recordOnly === true, "Step125-D must be record-only");
  assert(contract.handoffOnly === true, "Step125-D must be handoff-only");
  assert(contract.runtimeSmokeRecordedNow === true, "Step125-D must record runtime smoke");
  assert(contract.tokenPersistenceLayerClosedNow === true, "Step125-D must close token persistence layer");
  assert(contract.oauthCallbackRouteAddedNow === false, "Step125-D must not add OAuth callback route");
  assert(contract.tokenExchangeHttpCallNow === false, "Step125-D must not call LWA token exchange");
  assert(contract.summary.readyForStep126AOauthStatePersistenceBridgePreimplementationContract === true, "Step125-D should allow Step126-A");

  const cleanupGuard = await assertNoStep125CLeftoverFixtures();
  const routeGuard = assertNoNewRuntimeImplementation(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api token persistence runtime smoke record/handoff contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step125-D",
    cleanupGuard,
    routeGuard,
    summary: contract.summary,
  }, null, 2));
}

main().catch((err) => {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
});
