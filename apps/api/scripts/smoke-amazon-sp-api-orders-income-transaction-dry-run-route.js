#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const controllerPath = path.join(root, "src/imports/imports.controller.ts");
const servicePath = path.join(root, "src/imports/imports.service.ts");
const commitServicePath = path.join(root, "src/imports/amazon-sp-api-orders-transaction-commit.service.ts");

const controller = fs.readFileSync(controllerPath, "utf8");
const service = fs.readFileSync(servicePath, "utf8");
const commitService = fs.readFileSync(commitServicePath, "utf8");

function assertIncludes(source, marker, label) {
  if (!source.includes(marker)) {
    throw new Error(`[FAIL] missing ${label}: ${marker}`);
  }
}

assertIncludes(
  controller,
  "@Get('amazon-sp-api/orders/income-transaction-dry-run')",
  "GET route"
);
assertIncludes(
  controller,
  "previewAmazonSpApiOrdersIncomeTransactionDryRun",
  "controller method"
);
assertIncludes(controller, "@Query('importJobId')", "importJobId query");
assertIncludes(service, "previewAmazonSpApiOrdersIncomeTransactionDryRun", "service wrapper");
assertIncludes(
  service,
  "previewAmazonSpApiOrdersStagingRowsIncomeTransactionsDryRun",
  "Step142-B1 delegate"
);
assertIncludes(commitService, "writesDatabase: false", "B1 no-write marker");
assertIncludes(commitService, "transactionWriteNow: false", "B1 transaction no-write marker");
assertIncludes(commitService, "inventoryWriteNow: false", "B1 inventory no-write marker");

const routeStart = controller.indexOf("@Get('amazon-sp-api/orders/income-transaction-dry-run')");
const routeEndCandidates = [
  controller.indexOf("\n  @", routeStart + 1),
  controller.indexOf("\n}", routeStart + 1),
].filter((x) => x > routeStart);
const routeEnd = Math.min(...routeEndCandidates);
const routeSlice = controller.slice(routeStart, routeEnd);

const serviceStart = service.indexOf("async previewAmazonSpApiOrdersIncomeTransactionDryRun");
const serviceEndCandidates = [
  service.indexOf("\n  async ", serviceStart + 1),
  service.indexOf("\n  private ", serviceStart + 1),
  service.indexOf("\n}", serviceStart + 1),
].filter((x) => x > serviceStart);
const serviceEnd = Math.min(...serviceEndCandidates);
const serviceSlice = service.slice(serviceStart, serviceEnd);

for (const [label, slice] of [
  ["controller route", routeSlice],
  ["service wrapper", serviceSlice],
]) {
  const forbidden = [
    ".transaction.create",
    ".transaction.createMany",
    ".transaction.update",
    ".transaction.upsert",
    ".inventoryMovement.create",
    ".inventoryMovement.createMany",
    ".inventoryMovement.update",
    ".inventoryMovement.upsert",
    ".importJob.update",
    ".importStagingRow.update",
    ".importStagingRow.create",
    ".$transaction",
    "commitAmazonSpApiOrdersStagingRowsToIncomeTransactions(",
    "deductAmazonSpApiOrdersInventoryFromCommittedTransactions(",
  ];

  for (const marker of forbidden) {
    if (slice.includes(marker)) {
      throw new Error(`[FAIL] forbidden write/commit marker in ${label}: ${marker}`);
    }
  }
}

if (!routeSlice.includes("this.service.previewAmazonSpApiOrdersIncomeTransactionDryRun")) {
  throw new Error("[FAIL] controller route must delegate to dry-run service wrapper");
}

if (!serviceSlice.includes("previewAmazonSpApiOrdersStagingRowsIncomeTransactionsDryRun")) {
  throw new Error("[FAIL] service wrapper must delegate to Step142-B1 dry-run function");
}

console.log("[OK] Step142-B2 route static smoke passed");
console.log("[OK] GET route delegates only to dry-run preview path");
console.log("[OK] No write/commit markers found in controller route or service wrapper slices");
