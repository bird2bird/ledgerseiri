#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const cardPath = path.join(root, "src/components/app/jobs/ImportJobsTableCard.tsx");
const source = fs.readFileSync(cardPath, "utf8");

const firstNonEmptyLine = source.split(/\r?\n/).find((line) => line.trim().length > 0)?.trim();
if (firstNonEmptyLine !== '"use client";') {
  throw new Error(`[FAIL] "use client" must be the first statement, got: ${firstNonEmptyLine}`);
}


function assertIncludes(marker) {
  if (!source.includes(marker)) {
    throw new Error(`[FAIL] missing marker: ${marker}`);
  }
}

function assertRegex(regex, label) {
  if (!regex.test(source)) {
    throw new Error(`[FAIL] missing regex marker: ${label}`);
  }
}

const required = [
  "fetchAmazonSpApiOrdersIncomeTransactionDryRun",
  "AmazonSpApiOrdersIncomeTransactionDryRunResponse",
  "function AmazonSpApiIncomeTransactionDryRunPanel",
  "amazon-sp-api-income-transaction-dry-run-panel",
  "amazon-sp-api-income-transaction-dry-run-no-write-badge",
  "amazon-sp-api-income-transaction-dry-run-loaded",
  "amazon-sp-api-income-transaction-dry-run-row",
  "Income Transaction Dry-run Preview",
  "Read-only preview only",
  "does not create Transaction",
  "<AmazonSpApiIncomeTransactionDryRunPanel job={job} />",
];

for (const marker of required) {
  assertIncludes(marker);
}

// JSX may contain line breaks between words, so use whitespace-tolerant checks.
assertRegex(/does\s+not\s+create\s+InventoryMovement/, "does not create InventoryMovement");
assertRegex(/does\s+not\s+update\s+ImportJob/, "does not update ImportJob");
assertRegex(/does\s+not\s+update\s+ImportStagingRow/, "does not update ImportStagingRow");

const start = source.indexOf("function AmazonSpApiIncomeTransactionDryRunPanel");
if (start < 0) throw new Error("[FAIL] panel component not found");

const nextFn = source.slice(start + 1).search(/\n(function|export function|const)\s+[A-ZA-Za-z0-9_]+/);
const end = nextFn >= 0 ? start + 1 + nextFn : source.length;
const slice = source.slice(start, end);

const forbidden = [
  "commitAmazonSpApiOrders",
  "formalCommit",
  "createTransaction",
  "deductAmazon",
  "inventoryMovement.create",
  "method: \"POST\"",
  "method: 'POST'",
];

for (const marker of forbidden) {
  if (slice.includes(marker)) {
    throw new Error(`[FAIL] forbidden marker in panel slice: ${marker}`);
  }
}

if (!slice.includes("fetchAmazonSpApiOrdersIncomeTransactionDryRun({")) {
  throw new Error("[FAIL] panel must call read-only dry-run helper");
}

if (!slice.includes("isAmazonSpApiOrdersImportJob(job)")) {
  throw new Error("[FAIL] panel must be gated to amazon-sp-api-orders ImportJob");
}

console.log("[OK] Step142-B5 Import Center income dry-run panel static smoke passed");
console.log("[OK] Panel is read-only and contains no formal commit / write markers");

if (/<DetailDataStateCard\s*\n\s*\{isAmazonSpApiOrdersImportJob\(job\)/.test(source)) {
  throw new Error("[FAIL] panel render must not be inserted inside DetailDataStateCard opening tag");
}

console.log("[OK] Whitespace-tolerant no-write UI markers verified");
