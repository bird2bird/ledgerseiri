#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const groupedPath = path.join(root, "src/components/app/jobs/AmazonSpApiOrdersGroupedStagingList.tsx");
const summaryPath = path.join(root, "src/components/app/jobs/AmazonSpApiOrdersStagingSummaryPanel.tsx");

const grouped = fs.readFileSync(groupedPath, "utf8");
const summary = fs.readFileSync(summaryPath, "utf8");

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

assertIncludes(
  grouped,
  'resolveRowKind(row: ImportJobStagingRowItem): "order-header" | "order-item" | "legacy-order-item" | "unknown"',
  "Grouped list must classify mixed row kinds.",
);

assertIncludes(
  grouped,
  'rowKind === "order-header" || stagingLevel === "order"',
  "Grouped list must identify order-header rows.",
);

assertIncludes(
  grouped,
  'rowKind === "order-item" || stagingLevel === "item"',
  "Grouped list must identify order-item rows.",
);

assertIncludes(
  grouped,
  "buildGroupedHeader",
  "Grouped list must build order header summaries.",
);

assertIncludes(
  grouped,
  "buildGroupedItem",
  "Grouped list must keep item rows under orders.",
);

assertIncludes(
  grouped,
  "商品明細なし",
  "Grouped list must render no-item order message.",
);

assertIncludes(
  grouped,
  'data-testid="amazon-sp-api-orders-no-items-message"',
  "Grouped list must expose no-item message test id.",
);

assertIncludes(
  grouped,
  "mixed header/item grouped by amazonOrderId",
  "Grouped list badge must describe mixed grouping.",
);

assertNotIncludes(
  grouped,
  "現在保存済みの item-level staging rows を amazonOrderId でグループ表示しています。",
  "Grouped list must remove old item-level-only explanation.",
);

assertIncludes(
  summary,
  'stagingMode: "mixed-header-item" | "item-level"',
  "Summary panel must expose mixed-header-item staging mode.",
);

assertIncludes(
  summary,
  "headerRowCount",
  "Summary panel must count header rows.",
);

assertIncludes(
  summary,
  "itemRowCount",
  "Summary panel must count item rows.",
);

assertIncludes(
  summary,
  "headerRowsWithoutItems",
  "Summary panel must count header-only orders.",
);

assertIncludes(
  summary,
  'stagingMode: headerRowCount > 0 ? "mixed-header-item" : "item-level"',
  "Summary panel must switch mode based on header rows.",
);

assertIncludes(
  summary,
  "注文ヘッダー",
  "Summary panel must show order-header metric.",
);

assertIncludes(
  summary,
  "保存商品明細",
  "Summary panel must show saved item rows metric.",
);

assertIncludes(
  summary,
  "商品明細なし注文",
  "Summary panel must show header-without-items metric.",
);

assertNotIncludes(
  summary,
  "現在の ImportStagingRow は item-level staging です。1 row = 1 Amazon order item として集計しています。",
  "Summary panel must remove old item-level-only explanation.",
);

console.log("[OK] Step146-B mixed header/item display smoke passed.");
