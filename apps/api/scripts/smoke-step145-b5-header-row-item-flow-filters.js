#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function assertIncludes(source, needle, message) {
  if (!source.includes(needle)) {
    throw new Error(`${message}\nMissing: ${needle}`);
  }
}

function assertNotIncludes(source, needle, message) {
  if (source.includes(needle)) {
    throw new Error(`${message}\nForbidden: ${needle}`);
  }
}

const readiness = read("src/imports/amazon-sp-api-orders-staging-commit-readiness.service.ts");
const tx = read("src/imports/amazon-sp-api-orders-transaction-commit.service.ts");
const inv = read("src/imports/amazon-sp-api-orders-inventory-deduction.service.ts");

assertIncludes(
  readiness,
  "function isAmazonSpApiOrdersOrderItemStagingRow",
  "Readiness must define item-row filter helper.",
);
assertIncludes(
  readiness,
  "stagingLevel === 'order'",
  "Readiness must explicitly exclude order-header rows.",
);
assertIncludes(
  readiness,
  "const itemStagingRows = stagingRows.filter(isAmazonSpApiOrdersOrderItemStagingRow);",
  "Readiness must filter stagingRows before item readiness calculation.",
);
assertIncludes(
  readiness,
  "itemStagingRows.map((row) => {",
  "Readiness must build readinessRows from itemStagingRows.",
);

assertIncludes(
  tx,
  "function isAmazonSpApiOrdersOrderItemStagingPayload",
  "Transaction service must define item-row filter helper.",
);
assertIncludes(
  tx,
  "const itemStagingRows = stagingRows.filter((row: AmazonSpApiOrdersTransactionCommitStagingRow) => isAmazonSpApiOrdersOrderItemStagingPayload(row.normalizedPayloadJson));",
  "Transaction dry-run must filter stagingRows before item processing.",
);
assertIncludes(
  tx,
  "for (const row of itemStagingRows)",
  "Transaction dry-run must iterate itemStagingRows.",
);
assertIncludes(
  tx,
  "const itemRows = rows.filter((row: AmazonSpApiOrdersTransactionCommitStagingRow) => isAmazonSpApiOrdersOrderItemStagingPayload(row.normalizedPayloadJson));",
  "Transaction commit must filter rows before item processing.",
);
assertIncludes(
  tx,
  "for (const row of itemRows)",
  "Transaction commit must iterate itemRows.",
);
assertNotIncludes(
  tx,
  "prisma.inventoryMovement.create",
  "Transaction service must not create inventory movements.",
);

assertIncludes(
  inv,
  "function isAmazonSpApiOrdersOrderItemStagingPayload",
  "Inventory deduction service must define item-row filter helper.",
);
assertIncludes(
  inv,
  "const itemStagingRows = stagingRows.filter((row) => isAmazonSpApiOrdersOrderItemStagingPayload(row.normalizedPayloadJson));",
  "Inventory deduction must filter stagingRows before item processing.",
);
assertIncludes(
  inv,
  "for (const row of itemStagingRows)",
  "Inventory deduction must iterate itemStagingRows.",
);
assertNotIncludes(
  inv,
  "prisma.transaction.create",
  "Inventory deduction service must not create transactions.",
);

console.log("[OK] Step145-B5 smoke passed: header rows are filtered out of item-only flows.");
