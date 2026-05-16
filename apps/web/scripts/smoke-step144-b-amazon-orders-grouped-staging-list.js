#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const componentPath = path.join(root, "src/components/app/jobs/AmazonSpApiOrdersGroupedStagingList.tsx");
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
  'data-testid="amazon-sp-api-orders-grouped-staging-list"',
  "Grouped list must keep its test id.",
);

assertIncludes(
  "resolveRowKind",
  "Grouped list must classify row kinds.",
);

assertIncludes(
  'rowKind === "order-header" || stagingLevel === "order"',
  "Grouped list must identify order-header rows.",
);

assertIncludes(
  'rowKind === "order-item" || stagingLevel === "item"',
  "Grouped list must identify order-item rows.",
);

assertIncludes(
  "buildGroupedHeader",
  "Grouped list must build header summaries.",
);

assertIncludes(
  "buildGroupedItem",
  "Grouped list must build item rows.",
);

assertIncludes(
  "保存済みの order-header / order-item staging rows を amazonOrderId で統合表示しています。",
  "Grouped list must explain mixed header/item grouping.",
);

assertIncludes(
  "mixed header/item grouped by amazonOrderId",
  "Grouped list badge must show mixed header/item mode.",
);

assertIncludes(
  "商品明細なし",
  "Grouped list must render no-item order message.",
);

assertIncludes(
  'data-testid="amazon-sp-api-orders-no-items-message"',
  "Grouped list must expose no-item test id.",
);

assertIncludes(
  "Step146-B は表示専用です。Transaction作成・InventoryMovement作成・在庫扣減は行いません。",
  "Grouped list must remain frontend-only / no-write.",
);

assertNotIncludes(
  "現在保存済みの item-level staging rows を amazonOrderId でグループ表示しています。",
  "Grouped list must not keep old item-level-only explanation.",
);

console.log("[OK] Step144-B compatibility smoke passed for mixed header/item grouped list.");
