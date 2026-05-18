const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const api = path.join(root, 'src/core/imports/api.ts');

if (!fs.existsSync(api)) {
  throw new Error(`missing file: ${api}`);
}

const text = fs.readFileSync(api, 'utf8');

function mustContain(needle) {
  if (!text.includes(needle)) {
    throw new Error(`frontend api missing marker: ${needle}`);
  }
}

mustContain("AmazonSpApiOrdersFinalCommitReviewResponse");
mustContain("AMAZON_SP_API_ORDERS_FINAL_COMMIT_REVIEW_ENDPOINT");
mustContain("/api/imports/amazon-sp-api/orders/final-commit-review");
mustContain("readAmazonSpApiOrdersFinalCommitReview");
mustContain("dryRun: true");
mustContain("reviewOnly: true");
mustContain("writesDatabase: false");
mustContain("createsTransactionNow: false");
mustContain("createsInventoryMovementNow: false");
mustContain("requiresExplicitConfirmation: true");

const helperBlockStart = text.indexOf("readAmazonSpApiOrdersFinalCommitReview");
const helperBlock = helperBlockStart >= 0 ? text.slice(helperBlockStart, helperBlockStart + 800) : "";

for (const forbidden of [
  "real-importjob",
  "historical-sync",
  "transaction-commit",
  "inventory-commit",
]) {
  if (helperBlock.includes(forbidden)) {
    throw new Error(`final review frontend helper must not call execution endpoint: ${forbidden}`);
  }
}

console.log("[OK] Step151-R frontend final commit review helper smoke passed.");
