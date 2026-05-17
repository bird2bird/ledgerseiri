const fs = require("fs");
const path = require("path");

const root = "/opt/ledgerseiri";
const api = path.join(root, "apps/api");

const contractPath = path.join(
  api,
  "src/imports/dto/amazon-sp-api-orders-historical-sync-window-planner-contract.dto.ts",
);
const plannerPath = path.join(
  api,
  "src/imports/amazon-sp-api-orders-historical-sync-window-planner.ts",
);
const workerPath = path.join(api, "src/imports/amazon-sp-api-orders-historical-sync.worker.disabled.ts");
const controllerPath = path.join(api, "src/imports/imports.controller.ts");
const packagePath = path.join(api, "package.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertThrows(fn, expected) {
  let thrown = false;
  try {
    fn();
  } catch (error) {
    thrown = String(error && error.message).includes(expected);
  }
  assert(thrown, `expected error: ${expected}`);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

console.log("========== Step149-K smoke: window planner and pagination cursor ==========");

const contract = read(contractPath);
const planner = read(plannerPath);
const worker = read(workerPath);
const controller = read(controllerPath);
const pkg = JSON.parse(read(packagePath));

[
  "Step149-K",
  "pure_contract",
  "defaultSegmentDays: 7",
  "maxSegmentDays: 31",
  "defaultMaxPagesPerSegment: 50",
  "callsAmazon: false",
  "writesDatabase: false",
  "callsRepository: false",
  "noControllerWiringNow: true",
  "noWorkerRuntimeWiringNow: true",
  "noSchedulerNow: true",
  "normalizeHistoricalSyncDateRange",
  "planAmazonOrdersHistoricalSyncWindows",
  "buildInitialPaginationCursor",
  "advancePaginationCursor",
].forEach((needle) => {
  assert(contract.includes(needle), `window planner contract missing marker: ${needle}`);
});

[
  "normalizeHistoricalSyncDateRange",
  "planAmazonOrdersHistoricalSyncWindows",
  "buildInitialPaginationCursor",
  "advancePaginationCursor",
  "STEP149_K_INVALID_SYNC_START_DATE",
  "STEP149_K_INVALID_SYNC_END_DATE",
  "STEP149_K_SYNC_END_BEFORE_START",
  "STEP149_K_INVALID_SEGMENT_DAYS",
  "STEP149_K_INVALID_MAX_PAGES_PER_SEGMENT",
  "PAGE_LIMIT_REACHED",
  "SEGMENT_COMPLETED",
].forEach((needle) => {
  assert(planner.includes(needle), `window planner missing marker: ${needle}`);
});

[
  "previewAmazonSpApiOrdersReal",
  "buildAmazonSpApiOrdersServerOnlyRawSignedTransport",
  "PrismaClient",
  "amazonSpApiOrderSyncJob.",
  "amazonSpApiOrderSyncSegment.",
  "repository.createSyncJob",
  "createSyncJob(",
  "createSyncSegment(",
  "transaction.create(",
  "inventoryMovement.create(",
  "importJob.create(",
  "importStagingRow.create",
  "setInterval(",
  "while (true)",
  "for (;;)",
  "@Cron",
  "Queue",
  "Processor",
].forEach((forbidden) => {
  assert(!planner.includes(forbidden), `planner must be pure and must not contain forbidden marker: ${forbidden}`);
});

assert(
  worker.includes("STEP149_J_WORKER_DISABLED_BY_DEFAULT"),
  "Step149-J disabled worker must remain present",
);

assert(
  !worker.includes("planAmazonOrdersHistoricalSyncWindows") &&
    !worker.includes("advancePaginationCursor"),
  "Step149-K planner must not be wired into worker runtime yet",
);

assert(
  controller.includes("amazonSpApiOrdersHistoricalSyncDisabledControllerRoute"),
  "Step149-C disabled controller route must remain present",
);

assert(
  !controller.includes("planAmazonOrdersHistoricalSyncWindows") &&
    !controller.includes("advancePaginationCursor") &&
    !controller.includes("amazon-sp-api-orders-historical-sync-window-planner"),
  "Step149-K planner must not be wired into controller",
);

assert(
  pkg.scripts["smoke:step149-k-amazon-orders-historical-sync-window-planner-pagination-cursor"] ===
    "node scripts/smoke-step149-k-amazon-orders-historical-sync-window-planner-pagination-cursor.js",
  "package.json must register Step149-K smoke",
);

require("ts-node/register/transpile-only");

const {
  normalizeHistoricalSyncDateRange,
  planAmazonOrdersHistoricalSyncWindows,
  buildInitialPaginationCursor,
  advancePaginationCursor,
} = require("../src/imports/amazon-sp-api-orders-historical-sync-window-planner");

// 1-day range
const oneDay = planAmazonOrdersHistoricalSyncWindows({
  syncStartDate: "2026-01-01",
  syncEndDate: "2026-01-01",
});
assert(oneDay.segments.length === 1, "1-day range should produce one segment");
assert(oneDay.segments[0].segmentDaysInclusive === 1, "1-day segmentDaysInclusive mismatch");
assert(oneDay.segments[0].createdAfter === "2026-01-01T00:00:00.000Z", "1-day createdAfter mismatch");
assert(oneDay.segments[0].createdBefore === "2026-01-01T23:59:59.999Z", "1-day createdBefore mismatch");

// 7-day default range
const sevenDays = planAmazonOrdersHistoricalSyncWindows({
  syncStartDate: "2026-01-01",
  syncEndDate: "2026-01-07",
});
assert(sevenDays.segments.length === 1, "7-day range should produce one segment");
assert(sevenDays.normalizedRange.segmentDays === 7, "default segmentDays should be 7");

// 31-day max segment range with explicit segmentDays=31
const thirtyOne = planAmazonOrdersHistoricalSyncWindows({
  syncStartDate: "2026-01-01",
  syncEndDate: "2026-01-31",
  segmentDays: 31,
});
assert(thirtyOne.segments.length === 1, "31-day segment should fit one segment");
assert(thirtyOne.segments[0].segmentDaysInclusive === 31, "31-day segmentDaysInclusive mismatch");

// >31-day split by default 7-day windows
const fortyDays = planAmazonOrdersHistoricalSyncWindows({
  syncStartDate: "2026-01-01",
  syncEndDate: "2026-02-09",
});
assert(fortyDays.segments.length === 6, "40-day range with default 7-day segment should produce 6 segments");
assert(fortyDays.segments[0].segmentIndex === 0, "first segment index mismatch");
assert(fortyDays.segments[5].segmentIndex === 5, "last segment index mismatch");
assert(fortyDays.segments[5].createdAfter === "2026-02-05T00:00:00.000Z", "last segment createdAfter mismatch");
assert(fortyDays.segments[5].createdBefore === "2026-02-09T23:59:59.999Z", "last segment createdBefore mismatch");

// Normalization
const normalized = normalizeHistoricalSyncDateRange({
  syncStartDate: "2026-03-01",
  syncEndDate: "2026-03-10",
  segmentDays: 5,
});
assert(normalized.totalDaysInclusive === 10, "normalized totalDaysInclusive mismatch");
assert(normalized.segmentDays === 5, "normalized segmentDays mismatch");

// Invalid ranges
assertThrows(
  () => normalizeHistoricalSyncDateRange({ syncStartDate: "2026/01/01", syncEndDate: "2026-01-02" }),
  "STEP149_K_INVALID_SYNC_START_DATE",
);
assertThrows(
  () => normalizeHistoricalSyncDateRange({ syncStartDate: "2026-01-01", syncEndDate: "2026-02-30" }),
  "STEP149_K_INVALID_SYNC_END_DATE",
);
assertThrows(
  () => normalizeHistoricalSyncDateRange({ syncStartDate: "2026-01-10", syncEndDate: "2026-01-01" }),
  "STEP149_K_SYNC_END_BEFORE_START",
);
assertThrows(
  () => normalizeHistoricalSyncDateRange({ syncStartDate: "2026-01-01", syncEndDate: "2026-01-31", segmentDays: 32 }),
  "STEP149_K_INVALID_SEGMENT_DAYS",
);
assertThrows(
  () => planAmazonOrdersHistoricalSyncWindows({ syncStartDate: "2026-01-01", syncEndDate: "2026-01-02", maxPagesPerSegment: 51 }),
  "STEP149_K_INVALID_MAX_PAGES_PER_SEGMENT",
);

// Pagination cursor
let cursor = buildInitialPaginationCursor({
  segmentIndex: 0,
  maxPagesPerSegment: 2,
});
assert(cursor.status === "NOT_STARTED", "initial cursor status mismatch");
assert(cursor.pageNumber === 0, "initial cursor pageNumber mismatch");
assert(cursor.canFetchNextPage === true, "initial cursor should fetch");

cursor = advancePaginationCursor(cursor, {
  returnedNextToken: "NEXT-1",
  fetchedAtIso: "2026-01-01T01:00:00.000Z",
});
assert(cursor.status === "IN_PROGRESS", "cursor should be in progress after nextToken");
assert(cursor.pageNumber === 1, "cursor pageNumber should be 1");
assert(cursor.nextToken === "NEXT-1", "cursor nextToken mismatch");
assert(cursor.canFetchNextPage === true, "cursor should allow next page");

cursor = advancePaginationCursor(cursor, {
  returnedNextToken: "NEXT-2",
  fetchedAtIso: "2026-01-01T02:00:00.000Z",
});
assert(cursor.status === "PAGE_LIMIT_REACHED", "cursor should hit page limit");
assert(cursor.pageNumber === 2, "cursor pageNumber should be 2");
assert(cursor.canFetchNextPage === false, "cursor should stop after page limit");

let completeCursor = buildInitialPaginationCursor({
  segmentIndex: 1,
});
completeCursor = advancePaginationCursor(completeCursor, {
  returnedNextToken: null,
  fetchedAtIso: "2026-01-01T03:00:00.000Z",
});
assert(completeCursor.status === "SEGMENT_COMPLETED", "cursor should complete segment without nextToken");
assert(completeCursor.canFetchNextPage === false, "completed cursor should not fetch next page");

assertThrows(
  () => buildInitialPaginationCursor({ segmentIndex: -1 }),
  "STEP149_K_INVALID_SEGMENT_INDEX",
);
assertThrows(
  () => advancePaginationCursor(buildInitialPaginationCursor({ segmentIndex: 0 }), { returnedNextToken: null, fetchedAtIso: "bad-date" }),
  "STEP149_K_INVALID_FETCHED_AT",
);

console.log("[SMOKE_OK] Step149-K window planner and pagination cursor smoke passed");
