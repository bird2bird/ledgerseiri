import fs from "node:fs";
import path from "node:path";

const root = "/opt/ledgerseiri";
const api = path.join(root, "apps/api");
const controllerPath = path.join(api, "src/imports/imports.controller.ts");
const servicePath = path.join(api, "src/imports/amazon-imported-orders-read-model.readonly.service.ts");
const mapperPath = path.join(api, "src/imports/amazon-imported-orders-read-model.mapper.test-double.ts");
const packagePath = path.join(api, "package.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

console.log("========== Step150-LM smoke: readonly service shell + guarded controller activation ==========");

const controller = read(controllerPath);
const service = read(servicePath);
const mapper = read(mapperPath);
const pkg = JSON.parse(read(packagePath));

[
  "AmazonImportedOrdersReadonlyPrisma",
  "AmazonImportedOrdersReadonlyQuery",
  "AmazonImportedOrdersReadonlyListResponse",
  "AmazonImportedOrderReadonlyDetailResponse",
  "listAmazonImportedOrdersReadonly",
  "getAmazonImportedOrderDetailReadonly",
  "importJob.findMany",
  "importStagingRow.findMany",
  "mapAmazonImportedOrdersTestDoubleList",
  "mapAmazonImportedOrderDetailTestDouble",
  "orderId: input.orderId",
  "readModelMode: 'guarded-readonly-existing-importjob-stagingrow'",
  "readsExistingImportJob: true",
  "readsExistingImportStagingRow: true",
  "queriesPrisma: true",
  "writesDatabase: false",
  "frontendWiredNow: false",
].forEach((needle) => {
  assert(service.includes(needle), `readonly service marker exists: ${needle}`);
});

[
  "amazonImportedOrdersReadModelReadonlyListControllerRoute",
  "amazonImportedOrderDetailReadModelReadonlyControllerRoute",
  "Promise<AmazonImportedOrdersReadonlyListResponse>",
  "Promise<AmazonImportedOrderReadonlyDetailResponse>",
  "prisma: this.prismaService",
  "BadRequestException",
  "STEP150_LM_IMPORTED_ORDER_DETAIL_READ_MODEL_ORDER_ID_REQUIRED",
].forEach((needle) => {
  assert(controller.includes(needle), `controller marker exists: ${needle}`);
});

assert(mapper.includes("mapAmazonImportedOrdersTestDoubleList"), "mapper remains available");
assert(mapper.includes("mapAmazonImportedOrderDetailTestDouble"), "detail mapper remains available");

for (const forbidden of [
  ".create(",
  ".update(",
  ".delete(",
  ".upsert(",
  "fetch(",
  "postJson",
  "previewAmazonSpApiOrdersReal",
  "commitAmazonSpApiOrdersRealImportJob",
  "previewAmazonSpApiOrdersHistoricalSyncPlan",
  "runHistoricalSync",
  "runSegment",
  "createSyncJob",
  "createSyncSegment",
  "transaction.create",
  "inventoryMovement.create",
]) {
  assert(!service.includes(forbidden), `readonly service has no forbidden runtime/write marker: ${forbidden}`);
}

const blockStart = controller.indexOf("  // Step150-LM: Amazon imported orders read-model guarded readonly controller activation.");
const blockEnd = controller.indexOf("\n\n  // Step122-O: Amazon SP-API sandbox ImportJob read-model", blockStart);
assert(blockStart >= 0 && blockEnd > blockStart, "Step150-LM controller block found");
const controllerBlock = controller.slice(blockStart, blockEnd);

for (const forbidden of [
  ".create(",
  ".update(",
  ".delete(",
  ".upsert(",
  "previewAmazonSpApiOrdersRealNoPersistence",
  "persistAmazonSpApiOrdersRealPreviewToImportJobAndStagingRows",
  "runHistoricalSync",
  "runSegment",
  "transaction.create",
  "inventoryMovement.create",
]) {
  assert(!controllerBlock.includes(forbidden), `controller block has no forbidden marker: ${forbidden}`);
}

assert(
  pkg.scripts["smoke:step150-lm-amazon-imported-orders-read-model-readonly-controller"] ===
    "node scripts/smoke-step150-lm-amazon-imported-orders-read-model-readonly-controller.js",
  "package.json registers Step150-LM smoke",
);

console.log("[SMOKE_OK] Step150-LM readonly service/controller activation smoke passed");
