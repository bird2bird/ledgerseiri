#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  AMAZON_SP_API_ORDERS_REAL_HTTP_ENABLED_ENV,
  assertAmazonSpApiOrdersRealHttpActivationAllowed,
  evaluateAmazonSpApiOrdersRealHttpActivationGuard,
  isAmazonSpApiOrdersRealHttpFeatureEnabled,
  normalizeAmazonSpApiOrdersRealHttpRegion,
} = require("../dist/src/imports/amazon-sp-api-orders-real-http-activation.guard");

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`[OK] ${message}`);
}

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`);
  return fs.readFileSync(file, "utf8");
}

function assertRejects(fn, expectedText, message) {
  let rejected = false;
  try {
    fn();
  } catch (err) {
    rejected = String(err && err.message ? err.message : err).includes(expectedText);
  }
  assert(rejected, message);
}

function main() {
  const apiRoot = path.resolve(__dirname, "..");

  console.log("========== Step140-M Amazon SP-API Orders real HTTP activation guard smoke ==========");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-real-http-activation-guard"] ===
      "node scripts/smoke-amazon-sp-api-orders-real-http-activation-guard.js",
    "apps/api package.json registers Step140-M smoke",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-preview-controller-dry-run-route"],
    "Step140-K dry-run preview controller smoke remains registered",
  );

  const guardSource = read(path.resolve(apiRoot, "src/imports/amazon-sp-api-orders-real-http-activation.guard.ts"));

  const requiredMarkers = [
    "AMAZON_SP_API_ORDERS_REAL_HTTP_ENABLED",
    "evaluateAmazonSpApiOrdersRealHttpActivationGuard",
    "assertAmazonSpApiOrdersRealHttpActivationAllowed",
    "REAL_HTTP_DISABLED",
    "DRY_RUN_REQUEST",
    "MISSING_LWA_ACCESS_TOKEN",
    "LWA_ACCESS_TOKEN_EXPIRED",
    "MISSING_AWS_CREDENTIALS",
    "READY_FOR_REAL_HTTP_NEXT_STEP",
    "doesNotCallAmazon: true",
    "doesNotUseHttpClient: true",
    "doesNotUseSigV4: true",
    "doesNotWriteImportJob: true",
    "doesNotWriteTransaction: true",
    "doesNotWriteInventory: true",
  ];

  for (const marker of requiredMarkers) {
    assert(guardSource.includes(marker), `Step140-M guard marker exists: ${marker}`);
  }

  const forbiddenMarkers = [
    "fetch(",
    "axios.",
    "got(",
    "https.request(",
    "http.request(",
    "getOrders(",
    "getOrder(",
    "getOrderItems(",
    "AWS4-HMAC-SHA256",
    "createHmac",
    "createHash",
    "prisma.",
    "importJob.create",
    "importStagingRow.create",
    "transaction.create",
    "inventoryMovement.create",
    "inventoryBalance.update",
    "refreshToken",
    "clientSecret",
    "x-amz-access-token",
  ];

  for (const marker of forbiddenMarkers) {
    assert(!guardSource.includes(marker), `Step140-M guard does not contain forbidden marker: ${marker}`);
  }

  assert(AMAZON_SP_API_ORDERS_REAL_HTTP_ENABLED_ENV === "AMAZON_SP_API_ORDERS_REAL_HTTP_ENABLED", "feature flag name is stable");
  assert(isAmazonSpApiOrdersRealHttpFeatureEnabled({}) === false, "feature flag defaults to disabled");
  assert(isAmazonSpApiOrdersRealHttpFeatureEnabled({ AMAZON_SP_API_ORDERS_REAL_HTTP_ENABLED: "false" }) === false, "feature flag false disables");
  assert(isAmazonSpApiOrdersRealHttpFeatureEnabled({ AMAZON_SP_API_ORDERS_REAL_HTTP_ENABLED: "true" }) === true, "feature flag true enables");
  assert(isAmazonSpApiOrdersRealHttpFeatureEnabled({ AMAZON_SP_API_ORDERS_REAL_HTTP_ENABLED: "1" }) === true, "feature flag 1 enables");

  assert(normalizeAmazonSpApiOrdersRealHttpRegion("JP") === "FE", "JP region maps to FE");
  assert(normalizeAmazonSpApiOrdersRealHttpRegion("FE") === "FE", "FE region remains FE");
  assert(normalizeAmazonSpApiOrdersRealHttpRegion("NA") === "NA", "NA region remains NA");
  assert(normalizeAmazonSpApiOrdersRealHttpRegion("EU") === "EU", "EU region remains EU");
  assert(normalizeAmazonSpApiOrdersRealHttpRegion("XX") === null, "invalid region returns null");

  const baseReadyInput = {
    companyId: "step140-m-company",
    storeId: "step140-m-store",
    marketplaceId: "A1VC38T7YXB528",
    region: "JP",
    lwaAccessTokenPresent: true,
    lwaAccessTokenExpired: false,
    awsAccessKeyIdPresent: true,
    awsSecretAccessKeyPresent: true,
    roleArnPresent: false,
    dryRun: false,
  };

  const disabled = evaluateAmazonSpApiOrdersRealHttpActivationGuard({
    ...baseReadyInput,
    env: {},
  });
  assert(disabled.allowed === false, "disabled feature flag blocks real HTTP");
  assert(disabled.failClosed === true, "disabled feature flag fails closed");
  assert(disabled.reasonCode === "REAL_HTTP_DISABLED", "disabled feature flag reason is REAL_HTTP_DISABLED");
  assert(disabled.guardBoundaries.doesNotCallAmazon === true, "disabled guard does not call Amazon");
  assert(disabled.guardBoundaries.doesNotWriteTransaction === true, "disabled guard does not write Transaction");

  const dryRun = evaluateAmazonSpApiOrdersRealHttpActivationGuard({
    ...baseReadyInput,
    dryRun: true,
    env: { AMAZON_SP_API_ORDERS_REAL_HTTP_ENABLED: "true" },
  });
  assert(dryRun.allowed === false, "dry-run request blocks real HTTP even when feature flag enabled");
  assert(dryRun.reasonCode === "DRY_RUN_REQUEST", "dry-run reason is DRY_RUN_REQUEST");

  const missingToken = evaluateAmazonSpApiOrdersRealHttpActivationGuard({
    ...baseReadyInput,
    lwaAccessTokenPresent: false,
    env: { AMAZON_SP_API_ORDERS_REAL_HTTP_ENABLED: "true" },
  });
  assert(missingToken.allowed === false, "missing LWA token blocks real HTTP");
  assert(missingToken.reasonCode === "MISSING_LWA_ACCESS_TOKEN", "missing token reason is stable");

  const expiredToken = evaluateAmazonSpApiOrdersRealHttpActivationGuard({
    ...baseReadyInput,
    lwaAccessTokenExpired: true,
    env: { AMAZON_SP_API_ORDERS_REAL_HTTP_ENABLED: "true" },
  });
  assert(expiredToken.allowed === false, "expired LWA token blocks real HTTP");
  assert(expiredToken.reasonCode === "LWA_ACCESS_TOKEN_EXPIRED", "expired token reason is stable");

  const missingAws = evaluateAmazonSpApiOrdersRealHttpActivationGuard({
    ...baseReadyInput,
    awsAccessKeyIdPresent: false,
    awsSecretAccessKeyPresent: false,
    roleArnPresent: false,
    env: { AMAZON_SP_API_ORDERS_REAL_HTTP_ENABLED: "true" },
  });
  assert(missingAws.allowed === false, "missing AWS credential blocks real HTTP");
  assert(missingAws.reasonCode === "MISSING_AWS_CREDENTIALS", "missing AWS credential reason is stable");

  const ready = evaluateAmazonSpApiOrdersRealHttpActivationGuard({
    ...baseReadyInput,
    env: { AMAZON_SP_API_ORDERS_REAL_HTTP_ENABLED: "true" },
  });
  assert(ready.allowed === true, "ready guard allows next-step real HTTP activation");
  assert(ready.failClosed === false, "ready guard does not fail closed");
  assert(ready.reasonCode === "READY_FOR_REAL_HTTP_NEXT_STEP", "ready guard reason is stable");
  assert(ready.normalized.region === "FE", "ready guard normalizes JP to FE");
  assert(ready.guardBoundaries.doesNotCallAmazon === true, "ready guard still does not call Amazon in Step140-M");
  assert(ready.guardBoundaries.doesNotUseHttpClient === true, "ready guard still does not use HTTP client");
  assert(ready.guardBoundaries.doesNotUseSigV4 === true, "ready guard still does not use SigV4");
  assert(ready.guardBoundaries.doesNotWriteImportJob === true, "ready guard writes no ImportJob");
  assert(ready.guardBoundaries.doesNotWriteInventory === true, "ready guard writes no Inventory");

  const allowedByAssert = assertAmazonSpApiOrdersRealHttpActivationAllowed({
    ...baseReadyInput,
    env: { AMAZON_SP_API_ORDERS_REAL_HTTP_ENABLED: "true" },
  });
  assert(allowedByAssert.allowed === true, "assert helper returns allowed decision when ready");

  assertRejects(
    () => assertAmazonSpApiOrdersRealHttpActivationAllowed({ ...baseReadyInput, env: {} }),
    "STEP140_M_ORDERS_REAL_HTTP_BLOCKED",
    "assert helper rejects blocked decision",
  );

  console.log("[SMOKE_OK] Step140-M Amazon SP-API Orders real HTTP activation guard smoke passed");
  console.log(JSON.stringify({ ok: true, step: "Step140-M", ready }, null, 2));
}

main();
