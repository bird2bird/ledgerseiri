#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiTokenPersistenceRuntimeSmokeContract,
  buildAmazonSpApiTokenPersistenceRuntimeSmokeContract,
} = require("../dist/src/imports/dto/amazon-sp-api-token-persistence-runtime-smoke-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-token-persistence-runtime"] ===
      "node scripts/smoke-amazon-sp-api-token-persistence-runtime.js",
    "Step125-C runtime smoke npm script missing or mismatched",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-token-persistence-runtime-smoke-contract"] ===
      "node scripts/smoke-amazon-sp-api-token-persistence-runtime-smoke-contract.js",
    "Step125-C contract smoke npm script missing or mismatched",
  );

  const runtimeSmokePath = path.resolve(apiRoot, "scripts/smoke-amazon-sp-api-token-persistence-runtime.js");
  const runtimeSmokeText = read(runtimeSmokePath);

  for (const marker of [
    "AmazonSpApiTokenPersistenceRepository",
    "AmazonSpApiTokenPersistenceService",
    "persistEncryptedRefreshCredential",
    "persistEncryptedAccessTokenCache",
    "readConnectionStatus",
    "revokeConnection",
    "cleanupFixture",
    "createCompanyStoreFixture",
    "finally",
    "credential.rotatedAt",
    "accessCache.scope",
    "messageRedacted",
    "deletedCache === null",
    "assertNoTokenFields",
  ]) {
    assert(runtimeSmokeText.includes(marker), `runtime smoke missing marker: ${marker}`);
  }

  assert(!/fetch\s*\(/.test(runtimeSmokeText), "Step125-C runtime smoke must not perform HTTP calls");
  assert(!/amazon\.com\/auth\/o2\/token|api\.amazon\.com\/auth\/o2\/token/i.test(runtimeSmokeText), "Step125-C runtime smoke must not use LWA endpoint");
  assert(!/createReport|getReport|getReportDocument/i.test(runtimeSmokeText), "Step125-C runtime smoke must not call SP-API reports");

  const contract = assertAmazonSpApiTokenPersistenceRuntimeSmokeContract(
    buildAmazonSpApiTokenPersistenceRuntimeSmokeContract(),
  );

  assert(contract.sourceStep125B.summary.readyForStep125CTokenPersistenceRuntimeSmoke === true, "Step125-B must allow Step125-C");
  assert(contract.runtimeSmokeImplementedNow === true, "Step125-C must implement runtime smoke");
  assert(contract.fixtureDatabaseWriteNow === true, "Step125-C must explicitly allow fixture DB writes");
  assert(contract.fixtureCleanupRequired === true, "Step125-C must require cleanup");
  assert(contract.fixtureForeignKeyPlan.companyStoreFixtureCreatedBeforeAmazonConnectionWrite === true, "Step125-C must create Company/Store fixture before Amazon connection write");
  assert(contract.oauthCallbackRouteAddedNow === false, "Step125-C must not add OAuth callback route");
  assert(contract.tokenExchangeHttpCallNow === false, "Step125-C must not do LWA token exchange");
  assert(contract.summary.readyForStep125DTokenPersistenceRuntimeSmokeRecord === true, "Step125-C should allow Step125-D");

  console.log("[SMOKE_OK] amazon sp-api token persistence runtime smoke contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step125-C",
    files: {
      runtimeSmoke: path.relative(repoRoot, runtimeSmokePath).replaceAll(path.sep, "/"),
    },
    summary: contract.summary,
  }, null, 2));
}

try {
  main();
} catch (err) {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
}
