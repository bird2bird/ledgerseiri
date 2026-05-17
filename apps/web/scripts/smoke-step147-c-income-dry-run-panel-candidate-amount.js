#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const apiPath = path.join(root, "src/core/imports/api.ts");
const cardPath = path.join(root, "src/components/app/jobs/ImportJobsTableCard.tsx");

const api = fs.readFileSync(apiPath, "utf8");
const card = fs.readFileSync(cardPath, "utf8");

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

[
  "candidateAmount",
  "itemPriceAmount",
  "itemTaxAmount",
  "shippingPriceAmount",
  "amountPolicy",
  "orderStatus",
  "orderTotalAmount",
].forEach((field) => {
  assertIncludes(api, field, `api.ts dry-run type must include ${field}`);
});

assertIncludes(card, "amazon-sp-api-income-transaction-dry-run-candidate-summary", "panel must show candidate summary cards");
assertIncludes(card, "amazon-sp-api-income-transaction-dry-run-row-candidate-detail", "panel must show row candidate detail");
assertIncludes(card, "収入候補額", "panel must label candidate amount");
assertIncludes(card, "商品価格", "panel must label item price");
assertIncludes(card, "配送料", "panel must label shipping price");
assertIncludes(card, "税額参考", "panel must label item tax as reference");
assertIncludes(card, "収入候補額には加算しません", "panel must clarify tax is not added to candidate amount");
assertIncludes(card, "金額ポリシー", "panel must show amount policy");
assertIncludes(card, "ITEM_PRICE_PLUS_SHIPPING_EXCLUDES_TAX", "panel must contain amount policy constant");
assertIncludes(card, "dryRun=true / writesDatabase=false / transactionWriteNow=false / inventoryWriteNow=false", "panel must show explicit no-write flags");
assertIncludes(card, "Blocked:", "panel must show blocked rows");
assertIncludes(card, "MISSING_OR_INVALID_AMOUNT", "panel/source must remain compatible with blocked zero amount rows");

assertNotIncludes(card, "取引作成を実行", "dry-run panel must not expose transaction create action");
assertNotIncludes(card, "Transaction作成を実行", "dry-run panel must not expose transaction create action");
assertNotIncludes(card, "commit income", "dry-run panel must not expose commit wording");
assertNotIncludes(card, "create transaction", "dry-run panel must not expose create transaction wording");

console.log("[OK] Step147-C-B frontend income dry-run candidate panel smoke passed.");
