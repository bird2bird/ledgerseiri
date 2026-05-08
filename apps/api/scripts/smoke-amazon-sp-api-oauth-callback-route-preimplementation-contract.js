#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOauthCallbackRoutePreimplementationContract,
  buildAmazonSpApiOauthCallbackRoutePreimplementationContract,
} = require("../dist/src/imports/dto/amazon-sp-api-oauth-callback-route-preimplementation-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function assertNoActualCallbackRoute(repoRoot) {
  const importsController = path.resolve(repoRoot, "apps/api/src/imports/imports.controller.ts");
  const controllerText = fs.existsSync(importsController) ? read(importsController) : "";

  assert(
    !/@(Get|Post|Patch|Delete)\s*\([^)]*(oauth|lwa|callback|authorization|authorize|token|credential|connection)/i.test(controllerText),
    "Step127-A must not add real OAuth/token controller routes",
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

  assert(leaks.length === 0, `Step127-A must not add LWA endpoint usage: ${JSON.stringify(leaks)}`);

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
    packageJson.scripts["smoke:amazon-sp-api-oauth-callback-route-preimplementation-contract"] ===
      "node scripts/smoke-amazon-sp-api-oauth-callback-route-preimplementation-contract.js",
    "Step127-A npm script missing or mismatched",
  );

  const contract = assertAmazonSpApiOauthCallbackRoutePreimplementationContract(
    buildAmazonSpApiOauthCallbackRoutePreimplementationContract(),
  );

  assert(contract.sourceStep126D.summary.readyForStep127AOauthCallbackRoutePreimplementationContract === true, "Step126-D must allow Step127-A");
  assert(contract.contractOnly === true, "Step127-A must be contract-only");
  assert(contract.preImplementationOnly === true, "Step127-A must be preimplementation-only");
  assert(contract.routeDesignOnlyNow === true, "Step127-A must only define route design");
  assert(contract.oauthCallbackRouteAddedNow === false, "Step127-A must not add actual callback route");
  assert(contract.tokenExchangeHttpCallNow === false, "Step127-A must not perform token exchange HTTP");
  assert(contract.tokenPersistenceDatabaseWriteNow === false, "Step127-A must not write token DB");
  assert(contract.callbackRoutePlan.routePathPlanned === "/api/imports/amazon-sp-api/oauth/callback", "callback route path plan mismatch");
  assert(contract.callbackProcessingSequencePlan.verifySignedStateBeforeTokenExchange === true, "signed state must be verified before token exchange");
  assert(contract.callbackProcessingSequencePlan.persistTokensOnlyAfterBridgeAcceptsLater === true, "persistence must wait for bridge acceptance");
  assert(contract.securityPlan.noPlaintextAuthorizationCodeInLogs === true, "authorization code log safety missing");
  assert(contract.routeResponsePlan.noRefreshTokenReturned === true, "refresh token response safety missing");
  assert(contract.summary.readyForStep127BOauthCallbackRouteImplementation === true, "Step127-A should allow Step127-B");

  const leakGuard = assertNoActualCallbackRoute(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api oauth callback route preimplementation contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step127-A",
    leakGuard,
    plannedRoute: contract.callbackRoutePlan.routePathPlanned,
    summary: contract.summary,
  }, null, 2));
}

try {
  main();
} catch (err) {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
}
