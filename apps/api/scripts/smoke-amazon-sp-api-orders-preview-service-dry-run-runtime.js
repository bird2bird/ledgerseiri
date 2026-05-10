#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  AmazonSpApiOrdersPreviewService,
  buildAmazonSpApiOrdersPreviewService,
  previewAmazonSpApiOrdersDryRun,
} = require("../dist/src/imports/amazon-sp-api-orders-preview.service");

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`[OK] ${message}`);
}

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`);
  return fs.readFileSync(file, "utf8");
}

function listFiles(dir, predicate, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      if (["node_modules", "dist", ".next", "coverage", ".git"].includes(name)) continue;
      listFiles(p, predicate, acc);
      continue;
    }
    if (predicate(p)) acc.push(p);
  }
  return acc;
}

function assertNoStep140JImplementationLeak(repoRoot) {
  const apiRoot = path.resolve(repoRoot, "apps/api");
  const serviceSource = read(path.resolve(apiRoot, "src/imports/amazon-sp-api-orders-preview.service.ts"));

  const forbiddenServiceMarkers = [
    "@Controller",
    "@Post(",
    "@Get(",
    "fetch(",
    "axios.",
    "got(",
    "https.request(",
    "http.request(",
    "getOrders(",
    "getOrder(",
    "getOrderItems(",
    "prisma.",
    "importJob.create",
    "importStagingRow.create",
    "transaction.create",
    "inventoryMovement.create",
    "inventoryBalance.update",
    "createHmac",
    "createHash",
    "AWS4-HMAC-SHA256",
    "x-amz-access-token",
    "refreshToken",
    "clientSecret",
  ];

  for (const marker of forbiddenServiceMarkers) {
    assert(!serviceSource.includes(marker), `Step140-J service does not contain forbidden marker: ${marker}`);
  }

  const apiSrcRoot = path.resolve(apiRoot, "src");
  const files = listFiles(apiSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));
  const leaks = [];

  for (const file of files) {
    const text = read(file);
    const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");
    const isDto = rel.includes("/dto/") || rel.endsWith(".dto.ts");
    const isExpectedService = rel.endsWith("apps/api/src/imports/amazon-sp-api-orders-preview.service.ts");
    const isExpectedFixture = rel.endsWith("apps/api/src/imports/amazon-sp-api-orders-dry-run-fixture.ts");

    const hasStep140JContext =
      text.includes("Step140-J") ||
      text.includes("AmazonSpApiOrdersPreviewService") ||
      text.includes("previewAmazonSpApiOrdersDryRun");

    if (
      hasStep140JContext &&
      !isDto &&
      !isExpectedService &&
      !isExpectedFixture
    ) {
      leaks.push(rel);
    }
  }

  assert(leaks.length === 0, `no unexpected Step140-J implementation file leak: ${JSON.stringify(leaks)}`);
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
  const repoRoot = path.resolve(apiRoot, "..", "..");

  console.log("========== Step140-J Amazon SP-API Orders dry-run preview service runtime smoke ==========");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-preview-service-dry-run-runtime"] ===
      "node scripts/smoke-amazon-sp-api-orders-preview-service-dry-run-runtime.js",
    "apps/api package.json registers Step140-J smoke",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-dry-run-fixture-runtime"],
    "Step140-I dry-run fixture runtime smoke remains registered",
  );

  const serviceSource = read(path.resolve(apiRoot, "src/imports/amazon-sp-api-orders-preview.service.ts"));
  const requiredServiceMarkers = [
    "AmazonSpApiOrdersPreviewService",
    "previewDryRun",
    "buildAmazonSpApiOrdersDryRunPreview",
    "serviceWritesDatabase: false",
    "serviceCallsAmazon: false",
    "controllerRouteUsed: false",
    "dryRun must be true",
    "createdAfter must be before createdBefore",
  ];

  for (const marker of requiredServiceMarkers) {
    assert(serviceSource.includes(marker), `Step140-J service marker exists: ${marker}`);
  }

  const request = {
    companyId: "step140-j-company",
    storeId: "step140-j-store",
    marketplaceId: "A1VC38T7YXB528",
    region: "FE",
    createdAfter: "2026-05-01T00:00:00Z",
    createdBefore: "2026-05-02T00:00:00Z",
    orderStatuses: ["Shipped"],
    dryRun: true,
  };

  const service = new AmazonSpApiOrdersPreviewService();
  const builtService = buildAmazonSpApiOrdersPreviewService();

  assert(service instanceof AmazonSpApiOrdersPreviewService, "AmazonSpApiOrdersPreviewService can be instantiated");
  assert(builtService instanceof AmazonSpApiOrdersPreviewService, "buildAmazonSpApiOrdersPreviewService returns service instance");

  const preview = service.previewDryRun(request);
  const builtPreview = builtService.previewDryRun(request);
  const helperPreview = previewAmazonSpApiOrdersDryRun(request);

  for (const result of [preview, builtPreview, helperPreview]) {
    assert(result.service === "AmazonSpApiOrdersPreviewService", "result service marker is present");
    assert(result.previewMode === "dry-run-fixture", "result previewMode is dry-run-fixture");
    assert(result.dryRun === true, "result is dry-run");
    assert(result.serviceWritesDatabase === false, "service writes no database");
    assert(result.serviceCallsAmazon === false, "service calls no Amazon");
    assert(result.controllerRouteUsed === false, "controller route is not used");
    assert(result.writesDatabase === false, "underlying preview writes no database");
    assert(result.realAmazonOrdersApiCall === false, "underlying preview calls no Amazon");
    assert(result.companyId === "step140-j-company", "companyId passes through");
    assert(result.storeId === "step140-j-store", "storeId passes through");
    assert(result.marketplaceId === "A1VC38T7YXB528", "marketplaceId passes through");
    assert(result.region === "FE", "region passes through");
    assert(result.normalizedOrders.length === 2, "preview has 2 normalized orders");
    assert(result.normalizedOrderItems.length === 3, "preview has 3 normalized items");
    assert(result.validationSummary.totalOrders === 2, "validation total orders is 2");
    assert(result.validationSummary.totalOrderItems === 3, "validation total order items is 3");
    assert(result.skuResolutionSummary.resolvedSkuCount === 2, "resolved sku count is 2");
    assert(result.skuResolutionSummary.unresolvedSkuCount === 1, "unresolved sku count is 1");
    assert(result.inventoryImpactPreview.wouldDeductInventory === false, "inventory deduction remains false");
    assert(result.transactionImpactPreview.wouldCreateTransactions === false, "transaction creation remains false");
    assert(result.transactionImpactPreview.totalPreviewAmount === 12960, "total preview amount remains 12960");
  }

  assertRejects(
    () => service.previewDryRun({ ...request, dryRun: false }),
    "dryRun must be true",
    "dryRun=false is rejected at service layer",
  );

  assertRejects(
    () => service.previewDryRun({ ...request, createdAfter: "2026-05-02T00:00:00Z", createdBefore: "2026-05-01T00:00:00Z" }),
    "createdAfter must be before createdBefore",
    "invalid date range is rejected at service layer",
  );

  assertRejects(
    () => service.previewDryRun({ ...request, region: "JP" }),
    "region must be FE, NA, or EU",
    "invalid region is rejected at service layer",
  );

  assertRejects(
    () => service.previewDryRun({ ...request, companyId: "" }),
    "companyId is required",
    "missing companyId is rejected at service layer",
  );

  assertNoStep140JImplementationLeak(repoRoot);

  console.log("[SMOKE_OK] Step140-J Amazon SP-API Orders dry-run preview service runtime smoke passed");
  console.log(JSON.stringify({ ok: true, step: "Step140-J", preview }, null, 2));
}

main();
