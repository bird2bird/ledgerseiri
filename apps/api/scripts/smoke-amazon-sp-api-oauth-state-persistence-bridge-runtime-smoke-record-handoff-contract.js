#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOauthStatePersistenceBridgeRuntimeSmokeRecordHandoffContract,
  buildAmazonSpApiOauthStatePersistenceBridgeRuntimeSmokeRecordHandoffContract,
} = require("../dist/src/imports/dto/amazon-sp-api-oauth-state-persistence-bridge-runtime-smoke-record-handoff-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function assertNoRouteOrHttpLeak(repoRoot) {
  const importsController = path.resolve(repoRoot, "apps/api/src/imports/imports.controller.ts");
  const controllerText = fs.existsSync(importsController) ? read(importsController) : "";

  assert(
    !/@(Get|Post|Patch|Delete)\s*\([^)]*(oauth|lwa|callback|authorization|authorize|token|credential|connection)/i.test(controllerText),
    "Step126-D must not add OAuth/token controller routes",
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

  assert(leaks.length === 0, `Step126-D must not add LWA endpoint usage: ${JSON.stringify(leaks)}`);

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
    packageJson.scripts["smoke:amazon-sp-api-oauth-state-persistence-bridge-runtime-smoke-record-handoff-contract"] ===
      "node scripts/smoke-amazon-sp-api-oauth-state-persistence-bridge-runtime-smoke-record-handoff-contract.js",
    "Step126-D npm script missing or mismatched",
  );

  const contract = assertAmazonSpApiOauthStatePersistenceBridgeRuntimeSmokeRecordHandoffContract(
    buildAmazonSpApiOauthStatePersistenceBridgeRuntimeSmokeRecordHandoffContract(),
  );

  assert(contract.sourceStep126C.summary.readyForStep126DOauthStatePersistenceBridgeRuntimeSmokeRecord === true, "Step126-C must allow Step126-D");
  assert(contract.recordOnly === true, "Step126-D must be record-only");
  assert(contract.handoffOnly === true, "Step126-D must be handoff-only");
  assert(contract.bridgeRuntimeSmokeRecordedNow === true, "Step126-D must record runtime smoke");
  assert(contract.oauthStatePersistenceBridgePhaseCompleted === true, "Step126-D must complete bridge phase");
  assert(contract.oauthCallbackRouteAddedNow === false, "Step126-D must not add callback route");
  assert(contract.tokenExchangeHttpCallNow === false, "Step126-D must not add token exchange");
  assert(contract.tokenPersistenceDatabaseWriteNow === false, "Step126-D must not write token persistence DB");
  assert(contract.summary.readyForStep127AOauthCallbackRoutePreimplementationContract === true, "Step126-D should allow Step127-A");

  const leakGuard = assertNoRouteOrHttpLeak(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api oauth state bridge runtime smoke record/handoff contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step126-D",
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
