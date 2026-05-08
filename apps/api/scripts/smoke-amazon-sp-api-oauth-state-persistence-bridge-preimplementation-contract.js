#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOauthStatePersistenceBridgePreimplementationContract,
  buildAmazonSpApiOauthStatePersistenceBridgePreimplementationContract,
} = require("../dist/src/imports/dto/amazon-sp-api-oauth-state-persistence-bridge-preimplementation-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function assertRequiredExistingInputs(apiRoot) {
  const requiredFiles = [
    "src/imports/dto/amazon-sp-api-token-persistence-runtime-smoke-record-handoff-contract.dto.ts",
    "src/imports/dto/amazon-sp-api-oauth-state-signing-implementation-preflight.dto.ts",
    "src/imports/dto/amazon-sp-api-callback-query-validator-implementation-preflight.dto.ts",
    "src/imports/dto/amazon-sp-api-authorization-url-builder-implementation-preflight.dto.ts",
    "src/imports/amazon-sp-api-token-persistence.service.ts",
    "src/imports/amazon-sp-api-token-persistence.repository.ts",
  ];

  for (const rel of requiredFiles) {
    const file = path.resolve(apiRoot, rel);
    assert(fs.existsSync(file), `missing required bridge input: ${rel}`);
  }

  const handoff = read(path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-token-persistence-runtime-smoke-record-handoff-contract.dto.ts"));
  assert(handoff.includes("tokenPersistencePhaseCompleted: true"), "Step125-D token persistence completion missing");
  assert(handoff.includes("readyForStep126AOauthStatePersistenceBridgePreimplementationContract: true"), "Step125-D Step126-A readiness missing");
}

function assertNoRouteOrHttpLeak(repoRoot) {
  const importsController = path.resolve(repoRoot, "apps/api/src/imports/imports.controller.ts");
  const controllerText = fs.existsSync(importsController) ? read(importsController) : "";

  assert(
    !/@(Get|Post|Patch|Delete)\s*\([^)]*(oauth|lwa|callback|authorization|authorize|token|credential|connection)/i.test(controllerText),
    "Step126-A must not add OAuth/token controller routes",
  );

  const apiSrc = path.resolve(repoRoot, "apps/api/src");
  const leaks = [];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        if (name === "node_modules" || name === "dist" || name === ".next" || name === "coverage") continue;
        walk(p);
      } else if (/\.(ts|tsx|js|jsx)$/.test(p)) {
        const rel = path.relative(repoRoot, p).replaceAll(path.sep, "/");
        if (rel.includes("/src/imports/dto/")) continue;

        const text = read(p);
        if (/amazon\.com\/auth\/o2\/token|api\.amazon\.com\/auth\/o2\/token/i.test(text)) {
          leaks.push(rel);
        }
      }
    }
  }

  walk(apiSrc);

  assert(leaks.length === 0, `Step126-A must not add LWA token endpoint usage: ${JSON.stringify(leaks)}`);

  return {
    routeLeak: false,
    lwaEndpointLeaks: leaks,
  };
}

function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");
  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-oauth-state-persistence-bridge-preimplementation-contract"] ===
      "node scripts/smoke-amazon-sp-api-oauth-state-persistence-bridge-preimplementation-contract.js",
    "Step126-A npm script missing or mismatched",
  );

  assertRequiredExistingInputs(apiRoot);

  const contract = assertAmazonSpApiOauthStatePersistenceBridgePreimplementationContract(
    buildAmazonSpApiOauthStatePersistenceBridgePreimplementationContract(),
  );

  assert(contract.sourceStep125D.summary.tokenPersistencePhaseCompleted === true, "Step125-D must close token persistence phase");
  assert(contract.contractOnly === true, "Step126-A must be contract-only");
  assert(contract.preImplementationOnly === true, "Step126-A must be pre-implementation only");
  assert(contract.bridgeDesignOnlyNow === true, "Step126-A must only define bridge design");
  assert(contract.oauthCallbackRouteAddedNow === false, "Step126-A must not add OAuth callback route");
  assert(contract.tokenExchangeHttpCallNow === false, "Step126-A must not add token exchange HTTP");
  assert(contract.tokenPersistenceDatabaseWriteNow === false, "Step126-A must not write token persistence DB");
  assert(contract.oauthStatePayloadPlan.companyId === true, "OAuth state plan must include companyId");
  assert(contract.oauthStatePayloadPlan.storeId === true, "OAuth state plan must include storeId");
  assert(contract.oauthStatePayloadPlan.marketplaceId === true, "OAuth state plan must include marketplaceId");
  assert(contract.oauthStatePayloadPlan.region === true, "OAuth state plan must include region");
  assert(contract.oauthStatePayloadPlan.appId === true, "OAuth state plan must include appId");
  assert(contract.callbackToPersistenceMappingPlan.refreshTokenFromTokenExchangeMustBeEncryptedBeforePersistence === true, "refresh token encryption bridge plan missing");
  assert(contract.summary.readyForStep126BOauthStatePersistenceBridgeImplementation === true, "Step126-A should allow Step126-B");

  const leakGuard = assertNoRouteOrHttpLeak(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api oauth state persistence bridge preimplementation contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step126-A",
    leakGuard,
    summary: contract.summary,
  }, null, 2));
}

try {
  main();
} catch (err) {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
}
