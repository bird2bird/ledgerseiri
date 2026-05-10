#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const { ImportsController } = require("../dist/src/imports/imports.controller");

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

function assertNoForbiddenControllerMarkers(apiRoot) {
  const controller = read(path.resolve(apiRoot, "src/imports/imports.controller.ts"));
  const methodStart = controller.indexOf("amazonSpApiOrdersDryRunPreviewControllerRoute");
  assert(methodStart > 0, "Step140-K controller method exists in source");

  const methodEnd = controller.indexOf("// Step139-E:", methodStart);
  const methodSource = controller.slice(methodStart, methodEnd > methodStart ? methodEnd : methodStart + 6000);

  const forbiddenMarkers = [
    "importJob.create",
    "importStagingRow.create",
    "transaction.create",
    "inventoryMovement.create",
    "inventoryBalance.update",
    "fetch(",
    "axios.",
    "got(",
    "getOrders(",
    "getOrder(",
    "getOrderItems(",
    "createHmac",
    "createHash",
    "AWS4-HMAC-SHA256",
    "x-amz-access-token",
    "refreshToken",
    "clientSecret",
  ];

  for (const marker of forbiddenMarkers) {
    assert(!methodSource.includes(marker), `Step140-K controller method does not contain forbidden marker: ${marker}`);
  }
}

function buildControllerForUnitSmoke() {
  return new ImportsController(
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    {},
  );
}

function main() {
  const apiRoot = path.resolve(__dirname, "..");

  console.log("========== Step140-K Amazon SP-API Orders dry-run preview controller route smoke ==========");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-preview-controller-dry-run-route"] ===
      "node scripts/smoke-amazon-sp-api-orders-preview-controller-dry-run-route.js",
    "apps/api package.json registers Step140-K smoke",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-preview-service-dry-run-runtime"],
    "Step140-J preview service smoke remains registered",
  );

  const controllerSource = read(path.resolve(apiRoot, "src/imports/imports.controller.ts"));
  const requiredControllerMarkers = [
    "buildAmazonSpApiOrdersPreviewService",
    "type AmazonSpApiOrdersDryRunPreviewRouteBody",
    "type AmazonSpApiOrdersDryRunPreviewRouteResponse",
    "normalizeAmazonSpApiOrdersPreviewRegionForController",
    "private readonly amazonSpApiOrdersPreviewService = buildAmazonSpApiOrdersPreviewService()",
    "@Post('amazon-sp-api/orders/preview')",
    "amazonSpApiOrdersDryRunPreviewControllerRoute",
    "STEP140_K_ORDERS_PREVIEW_COMPANY_REQUIRED",
    "dryRun must be true",
    "controllerMode: 'dry-run-preview-only'",
    "controllerWritesDatabase: false",
    "controllerCallsAmazon: false",
    "controllerUsesHttpClient: false",
    "controllerUsesSigV4: false",
    "importJobWriteNow: false",
    "transactionWriteNow: false",
    "inventoryWriteNow: false",
  ];

  for (const marker of requiredControllerMarkers) {
    assert(controllerSource.includes(marker), `Step140-K controller marker exists: ${marker}`);
  }

  const controller = buildControllerForUnitSmoke();

  const req = {
    user: {
      companyId: "step140-k-company",
      id: "step140-k-user",
    },
  };

  const body = {
    storeId: "step140-k-store",
    marketplaceId: "A1VC38T7YXB528",
    region: "JP",
    createdAfter: "2026-05-01T00:00:00Z",
    createdBefore: "2026-05-02T00:00:00Z",
    orderStatuses: ["Shipped"],
    dryRun: true,
  };

  const result = controller.amazonSpApiOrdersDryRunPreviewControllerRoute(req, body);

  assert(result.routeImplementedNow === true, "routeImplementedNow is true");
  assert(result.route === "/api/imports/amazon-sp-api/orders/preview", "route value is stable");
  assert(result.guardedBy === "JwtAuthGuard", "route is marked as JwtAuthGuard guarded");
  assert(result.controllerMode === "dry-run-preview-only", "controller mode is dry-run-preview-only");
  assert(result.controllerWritesDatabase === false, "controller writes no database");
  assert(result.controllerCallsAmazon === false, "controller calls no Amazon");
  assert(result.controllerUsesHttpClient === false, "controller uses no HTTP client");
  assert(result.controllerUsesSigV4 === false, "controller uses no SigV4");
  assert(result.importJobWriteNow === false, "ImportJob write remains false");
  assert(result.importStagingRowWriteNow === false, "ImportStagingRow write remains false");
  assert(result.transactionWriteNow === false, "Transaction write remains false");
  assert(result.inventoryWriteNow === false, "Inventory write remains false");

  assert(result.companyId === "step140-k-company", "companyId comes from authenticated request");
  assert(result.storeId === "step140-k-store", "storeId comes from body");
  assert(result.marketplaceId === "A1VC38T7YXB528", "marketplaceId comes from body");
  assert(result.region === "FE", "JP region is mapped to FE for SP-API endpoint region");
  assert(result.dryRun === true, "result remains dry-run");
  assert(result.service === "AmazonSpApiOrdersPreviewService", "service marker is preserved");
  assert(result.previewMode === "dry-run-fixture", "preview mode is dry-run-fixture");
  assert(result.normalizedOrders.length === 2, "controller returns 2 normalized orders");
  assert(result.normalizedOrderItems.length === 3, "controller returns 3 normalized order items");
  assert(result.skuResolutionSummary.unresolvedSkuCount === 1, "controller returns unresolved SKU summary");
  assert(result.inventoryImpactPreview.wouldDeductInventory === false, "controller does not deduct inventory");
  assert(result.transactionImpactPreview.wouldCreateTransactions === false, "controller does not create transactions");
  assert(result.realAmazonOrdersApiCall === false, "controller result has no Amazon real call");

  assertRejects(
    () => controller.amazonSpApiOrdersDryRunPreviewControllerRoute({ user: {} }, body),
    "STEP140_K_ORDERS_PREVIEW_COMPANY_REQUIRED",
    "missing companyId is rejected",
  );

  assertRejects(
    () => controller.amazonSpApiOrdersDryRunPreviewControllerRoute(req, { ...body, dryRun: false }),
    "dryRun must be true",
    "dryRun=false is rejected",
  );

  assertRejects(
    () => controller.amazonSpApiOrdersDryRunPreviewControllerRoute(req, { ...body, storeId: "" }),
    "storeId is required",
    "missing storeId is rejected",
  );

  assertRejects(
    () => controller.amazonSpApiOrdersDryRunPreviewControllerRoute(req, { ...body, region: "XX" }),
    "region must be FE, NA, EU, or JP",
    "invalid region is rejected",
  );

  assertRejects(
    () => controller.amazonSpApiOrdersDryRunPreviewControllerRoute(req, {
      ...body,
      createdAfter: "2026-05-02T00:00:00Z",
      createdBefore: "2026-05-01T00:00:00Z",
    }),
    "createdAfter must be before createdBefore",
    "invalid date range is rejected by service through controller",
  );

  assertNoForbiddenControllerMarkers(apiRoot);

  console.log("[SMOKE_OK] Step140-K Amazon SP-API Orders dry-run preview controller route smoke passed");
  console.log(JSON.stringify({ ok: true, step: "Step140-K", result }, null, 2));
}

main();
