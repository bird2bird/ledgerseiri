#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  buildAmazonSpApiOrderDedupeHash,
  buildAmazonSpApiOrderItemDedupeHash,
  buildAmazonSpApiOrdersDryRunPreview,
  buildAmazonSpApiOrdersSyntheticFixture,
  normalizeAmazonSpApiOrdersDryRunOrderItems,
  normalizeAmazonSpApiOrdersDryRunOrders,
} = require("../dist/src/imports/amazon-sp-api-orders-dry-run-fixture");

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

function assertNoForbiddenImplementationLeak(repoRoot) {
  const apiRoot = path.resolve(repoRoot, "apps/api");
  const implementation = read(path.resolve(apiRoot, "src/imports/amazon-sp-api-orders-dry-run-fixture.ts"));

  const forbiddenMarkers = [
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
    "authorization:",
    "refreshToken",
    "clientSecret",
  ];

  for (const marker of forbiddenMarkers) {
    assert(!implementation.includes(marker), `Step140-I implementation does not contain forbidden marker: ${marker}`);
  }

  const apiSrcRoot = path.resolve(apiRoot, "src");
  const files = listFiles(apiSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));
  const step140IWriteLeaks = [];

  for (const file of files) {
    const text = read(file);
    const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");
    const hasStep140IContext =
      text.includes("Step140-I") ||
      text.includes("amazon-sp-api-orders-dry-run-fixture") ||
      text.includes("buildAmazonSpApiOrdersDryRunPreview");

    if (
      hasStep140IContext &&
      (
        text.includes("importJob.create") ||
        text.includes("importStagingRow.create") ||
        text.includes("transaction.create") ||
        text.includes("inventoryMovement.create") ||
        text.includes("inventoryBalance.update") ||
        text.includes("fetch(") ||
        text.includes("axios.") ||
        text.includes("got(")
      )
    ) {
      step140IWriteLeaks.push(rel);
    }
  }

  assert(step140IWriteLeaks.length === 0, `no Step140-I DB/network implementation leak: ${JSON.stringify(step140IWriteLeaks)}`);
}

function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");

  console.log("========== Step140-I Amazon SP-API Orders dry-run fixture runtime smoke ==========");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-dry-run-fixture-runtime"] ===
      "node scripts/smoke-amazon-sp-api-orders-dry-run-fixture-runtime.js",
    "apps/api package.json registers Step140-I smoke",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-dry-run-fixture-controller-route-contract"],
    "Step140-H contract smoke remains registered",
  );

  const implSource = read(path.resolve(apiRoot, "src/imports/amazon-sp-api-orders-dry-run-fixture.ts"));
  const requiredImplementationMarkers = [
    "buildAmazonSpApiOrdersSyntheticFixture",
    "buildAmazonSpApiOrdersDryRunPreview",
    "normalizeAmazonSpApiOrdersDryRunOrders",
    "normalizeAmazonSpApiOrdersDryRunOrderItems",
    "buildAmazonSpApiOrderDedupeHash",
    "buildAmazonSpApiOrderItemDedupeHash",
    "writesDatabase: false",
    "realAmazonOrdersApiCall: false",
    "blockedBecauseDryRun: true",
    "ORDER-STEP140-I-001",
    "ORDER-STEP140-I-002",
    "SKU-STEP140-I-RESOLVED-1",
  ];

  for (const marker of requiredImplementationMarkers) {
    assert(implSource.includes(marker), `Step140-I implementation marker exists: ${marker}`);
  }

  const input = {
    companyId: "step140-i-company",
    storeId: "step140-i-store",
    marketplaceId: "A1VC38T7YXB528",
    region: "FE",
    createdAfter: "2026-05-01T00:00:00Z",
    createdBefore: "2026-05-02T00:00:00Z",
    orderStatuses: ["Shipped"],
    dryRun: true,
  };

  const fixture = buildAmazonSpApiOrdersSyntheticFixture(input);
  assert(fixture.orders.length === 2, "synthetic fixture has 2 orders");
  assert(fixture.orderItems.length === 3, "synthetic fixture has 3 order items");

  const normalizedOrders = normalizeAmazonSpApiOrdersDryRunOrders(input, fixture.orders, fixture.orderItems);
  const normalizedOrderItems = normalizeAmazonSpApiOrdersDryRunOrderItems(input, fixture.orderItems);

  assert(normalizedOrders.length === 2, "normalized orders length is 2");
  assert(normalizedOrderItems.length === 3, "normalized order items length is 3");
  assert(normalizedOrders.every((order) => order.sourceType === "amazon-sp-api"), "all normalized orders keep sourceType amazon-sp-api");
  assert(normalizedOrderItems.every((item) => item.sourceType === "amazon-sp-api"), "all normalized items keep sourceType amazon-sp-api");
  assert(normalizedOrders.every((order) => order.marketplaceId === "A1VC38T7YXB528"), "all orders keep marketplace id");
  assert(normalizedOrders.every((order) => order.region === "FE"), "all orders keep region");
  assert(normalizedOrders.every((order) => order.businessMonth === "2026-05"), "businessMonth is derived from purchaseDate");
  assert(normalizedOrders[0].dedupeHash === "amazon-sp-api:order:ORDER-STEP140-I-001", "order dedupe hash is stable");
  assert(
    normalizedOrderItems[0].itemLevelDedupeHash === "amazon-sp-api:item:ORDER-STEP140-I-001:ITEM-STEP140-I-001-A",
    "order item dedupe hash is stable",
  );

  assert(
    buildAmazonSpApiOrderDedupeHash("ORDER-X") === "amazon-sp-api:order:ORDER-X",
    "buildAmazonSpApiOrderDedupeHash is deterministic",
  );
  assert(
    buildAmazonSpApiOrderItemDedupeHash("ORDER-X", "ITEM-Y") === "amazon-sp-api:item:ORDER-X:ITEM-Y",
    "buildAmazonSpApiOrderItemDedupeHash is deterministic",
  );

  const preview = buildAmazonSpApiOrdersDryRunPreview(input);

  assert(preview.source === "amazon-sp-api-orders-dry-run-fixture", "preview source is dry-run fixture");
  assert(preview.dryRun === true, "preview is dry-run");
  assert(preview.writesDatabase === false, "preview writes no database");
  assert(preview.realAmazonOrdersApiCall === false, "preview does not call Amazon");
  assert(preview.normalizedOrders.length === 2, "preview includes 2 normalized orders");
  assert(preview.normalizedOrderItems.length === 3, "preview includes 3 normalized items");
  assert(preview.validationSummary.totalOrders === 2, "validation summary total orders is 2");
  assert(preview.validationSummary.totalOrderItems === 3, "validation summary total order items is 3");
  assert(preview.validationSummary.validationErrorCount === 0, "validation summary has no validation errors");
  assert(preview.validationSummary.warningCount === 1, "validation summary warning count is 1");
  assert(preview.dedupeSummary.duplicateOrdersCount === 0, "dedupe summary has no duplicate orders");
  assert(preview.dedupeSummary.duplicateItemsCount === 0, "dedupe summary has no duplicate items");
  assert(preview.skuResolutionSummary.resolvedSkuCount === 2, "sku resolution summary has 2 resolved items");
  assert(preview.skuResolutionSummary.unresolvedSkuCount === 1, "sku resolution summary has 1 unresolved item");
  assert(preview.skuResolutionSummary.inventoryBlockedCount === 1, "inventory blocked count is 1");
  assert(preview.inventoryImpactPreview.wouldDeductInventory === false, "inventory preview does not deduct inventory");
  assert(preview.inventoryImpactPreview.blockedBecauseDryRun === true, "inventory preview is blocked by dry-run");
  assert(preview.inventoryImpactPreview.blockedBecauseUnresolvedSkuCount === 1, "inventory preview tracks unresolved SKU block");
  assert(preview.inventoryImpactPreview.impacts.length === 3, "inventory preview has 3 impact rows");
  assert(preview.inventoryImpactPreview.impacts.every((impact) => impact.wouldDeductQuantity === 0), "all dry-run impacts deduct zero");
  assert(preview.transactionImpactPreview.wouldCreateTransactions === false, "transaction preview does not create transactions");
  assert(preview.transactionImpactPreview.transactionPreviewCount === 2, "transaction preview count is 2");
  assert(preview.transactionImpactPreview.totalPreviewAmount === 12960, "transaction preview total amount is 12960 JPY");
  assert(preview.warnings.length === 1, "preview includes one unresolved SKU warning");
  assert(!JSON.stringify(preview).includes("buyer"), "preview contains no buyer PII");
  assert(!JSON.stringify(preview).includes("shippingAddress"), "preview contains no shipping address");

  let invalidInputRejected = false;
  try {
    buildAmazonSpApiOrdersDryRunPreview({
      ...input,
      dryRun: false,
    });
  } catch (err) {
    invalidInputRejected = String(err.message || err).includes("dryRun must be true");
  }
  assert(invalidInputRejected, "dryRun=false is rejected");

  assertNoForbiddenImplementationLeak(repoRoot);

  console.log("[SMOKE_OK] Step140-I Amazon SP-API Orders dry-run fixture runtime smoke passed");
  console.log(JSON.stringify({ ok: true, step: "Step140-I", preview }, null, 2));
}

main();
