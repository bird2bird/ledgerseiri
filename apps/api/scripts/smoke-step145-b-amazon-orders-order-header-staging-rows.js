#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const file = path.join(root, "src/imports/amazon-sp-api-orders-real-importjob-persistence.service.ts");
const source = fs.readFileSync(file, "utf8");

function assertIncludes(needle, message) {
  if (!source.includes(needle)) {
    throw new Error(message + ` Missing: ${needle}`);
  }
}

function assertNotIncludes(needle, message) {
  if (source.includes(needle)) {
    throw new Error(message + ` Forbidden: ${needle}`);
  }
}

assertIncludes(
  "const normalizedOrders = arrayFrom(preview.normalizedOrders || preview.orders);",
  "Step145-B must continue reading order headers from real preview.",
);

assertIncludes(
  "const normalizedItems = arrayFrom(",
  "Step145-B must preserve existing item-level source collection.",
);

assertIncludes(
  "const stagingRows = normalizedItems.map((item, index) => {",
  "Step145-B must preserve item-level staging rows.",
);

assertIncludes(
  "rowKind: 'order-item'",
  "Step145-B must mark existing item-level rows as order-item.",
);

assertIncludes(
  "stagingLevel: 'item'",
  "Step145-B must mark existing item-level rows as item staging.",
);

assertIncludes(
  "const orderHeaderStagingRows = normalizedOrders.map((order, index) => {",
  "Step145-B must append one order-header row per normalized order.",
);

assertIncludes(
  "rowKind: 'order-header'",
  "Step145-B must mark header rows with rowKind order-header.",
);

assertIncludes(
  "item: null",
  "Step145-B FIX1 must keep order-header rawPayloadJson structurally compatible with item rows.",
);

assertIncludes(
  "stagingLevel: 'order'",
  "Step145-B must mark header rows with stagingLevel order.",
);

assertIncludes(
  "orderItemId: null",
  "Step145-B FIX2 must keep order-header normalizedPayloadJson compatible with item rows.",
);

assertIncludes(
  "storeId: input.storeId",
  "Step145-B FIX2 must carry storeId on order-header normalizedPayloadJson.",
);

assertIncludes(
  "marketplaceId: input.marketplaceId",
  "Step145-B FIX2 must carry marketplaceId on order-header normalizedPayloadJson.",
);

assertIncludes(
  "region: input.region",
  "Step145-B FIX2 must carry region on order-header normalizedPayloadJson.",
);

assertIncludes(
  "stagingRows.push(...orderHeaderStagingRows);",
  "Step145-B must append header rows into the same ImportStagingRow createMany pipeline.",
);

assertIncludes(
  "matchReason: ''",
  "Step145-B FIX3 must keep order-header matchReason string-compatible with item rows.",
);

assertIncludes(
  "await prisma.importStagingRow.createMany({",
  "Step145-B must continue using ImportStagingRow createMany.",
);

assertIncludes(
  "writesTransaction: false",
  "Step145-B must keep transaction writes disabled.",
);

assertIncludes(
  "writesInventoryMovement: false",
  "Step145-B must keep inventory movement writes disabled.",
);

assertNotIncludes(
  "prisma.transaction.create",
  "Step145-B must not introduce Transaction creation.",
);

assertNotIncludes(
  "prisma.inventoryMovement.create",
  "Step145-B must not introduce InventoryMovement creation.",
);

assertNotIncludes(
  "prisma.inventoryMovement.createMany",
  "Step145-B must not introduce InventoryMovement createMany.",
);

const headerIndex = source.indexOf("const orderHeaderStagingRows = normalizedOrders.map");
const createManyIndex = source.indexOf("await prisma.importStagingRow.createMany");
if (headerIndex < 0 || createManyIndex < 0 || headerIndex > createManyIndex) {
  throw new Error("Step145-B violation: order-header rows must be built before ImportStagingRow.createMany.");
}

console.log("[OK] Step145-B source smoke passed: order-header rows appended, item rows preserved, no transaction/inventory writes.");
