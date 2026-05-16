#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const componentPath = path.join(root, "src/components/app/jobs/AmazonSpApiOrdersStagingSummaryPanel.tsx");
const source = fs.readFileSync(componentPath, "utf8");

function assertIncludes(needle, message) {
  if (!source.includes(needle)) {
    throw new Error(`${message}\nMissing: ${needle}`);
  }
}

function assertNotIncludes(needle, message) {
  if (source.includes(needle)) {
    throw new Error(`${message}\nForbidden: ${needle}`);
  }
}

assertIncludes(
  'data-testid="amazon-sp-api-orders-staging-summary-panel"',
  "Summary panel must keep its test id.",
);

assertIncludes(
  'stagingMode: "mixed-header-item" | "item-level"',
  "Summary panel must support mixed-header-item mode while preserving item-level compatibility.",
);

assertIncludes(
  'stagingMode: headerRowCount > 0 ? "mixed-header-item" : "item-level"',
  "Summary panel must switch mode based on order-header rows.",
);

assertIncludes(
  "ImportStagingRow の order-header / order-item を分離して集計しています。",
  "Summary panel must explain mixed header/item aggregation.",
);

assertIncludes(
  "注文ヘッダー",
  "Summary panel must show order-header metric.",
);

assertIncludes(
  "保存商品明細",
  "Summary panel must show saved item-row metric.",
);

assertIncludes(
  "商品明細なし注文",
  "Summary panel must show header-without-items metric.",
);

assertIncludes(
  "旧item rows",
  "Summary panel must preserve legacy item-row visibility.",
);

assertIncludes(
  "不明rows",
  "Summary panel must surface unknown row count.",
);

assertIncludes(
  "Transaction作成・InventoryMovement作成・在庫扣減は行いません。",
  "Summary panel must remain frontend-only / no-write.",
);

assertNotIncludes(
  "現在の ImportStagingRow は item-level staging です。1 row = 1 Amazon order item として集計しています。",
  "Summary panel must not keep old item-level-only explanation.",
);

console.log("[OK] Step144-A compatibility smoke passed for mixed header/item summary panel.");
