#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const target = path.join(root, "src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx");
const source = fs.readFileSync(target, "utf8");

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
  "取得注文明細",
  "Step145-D must rename the preview item count label to avoid confusing it with persisted item rows.",
);

assertIncludes(
  "保存行数",
  "Step145-D must show persisted staging row count as 保存行数, not 保存明細.",
);

assertIncludes(
  "注文ヘッダー",
  "Step145-D must show the persisted order-header row count.",
);

assertIncludes(
  "保存商品明細",
  "Step145-D must show persisted item row count separately from fetched item count.",
);

assertIncludes(
  "Number(orderImportJob.totalRows ?? 0) - Number(orderPreview?.normalizedOrders?.length ?? 0)",
  "Step145-D must derive persisted item rows from saved rows minus order-header rows.",
);

assertIncludes(
  "Number(data.totalRows ?? 0) - Number(orderPreview?.normalizedOrders?.length ?? 0)",
  "Step145-D success message must use the same persisted item-row derivation.",
);

assertNotIncludes(
  "保存明細:",
  "Step145-D must remove the misleading 保存明細 label.",
);

assertNotIncludes(
  "ImportJobを作成しました。明細 ${data.totalRows ?? 0} 件を保存しました。",
  "Step145-D must remove the old ambiguous success message.",
);

console.log("[OK] Step145-D frontend count display smoke passed.");
