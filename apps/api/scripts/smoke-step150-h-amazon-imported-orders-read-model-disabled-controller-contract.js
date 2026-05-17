import fs from "node:fs";
import path from "node:path";

const root = "/opt/ledgerseiri";
const api = path.join(root, "apps/api");
const controllerPath = path.join(api, "src/imports/imports.controller.ts");
const servicePath = path.join(api, "src/imports/amazon-imported-orders-read-model.readonly.service.ts");
const packagePath = path.join(api, "package.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

console.log("========== Step150-H/LM smoke: imported orders read-model guarded readonly controller ==========");

const controller = read(controllerPath);
const service = read(servicePath);
const pkg = JSON.parse(read(packagePath));

[
  "amazonImportedOrdersReadModelReadonlyListControllerRoute",
  "amazonImportedOrderDetailReadModelReadonlyControllerRoute",
  "@UseGuards(JwtAuthGuard)",
  "@Get('amazon-sp-api/orders/imported/read-model')",
  "@Get('amazon-sp-api/orders/imported/read-model/detail')",
  "listAmazonImportedOrdersReadonly",
  "getAmazonImportedOrderDetailReadonly",
  "prisma: this.prismaService",
  "STEP150_LM_IMPORTED_ORDERS_READ_MODEL_COMPANY_REQUIRED",
  "STEP150_LM_IMPORTED_ORDER_DETAIL_READ_MODEL_COMPANY_REQUIRED",
].forEach((needle) => {
  assert(controller.includes(needle), `controller contains marker: ${needle}`);
});

[
  "findMany",
  "importJob.findMany",
  "importStagingRow.findMany",
  "guarded-readonly-existing-importjob-stagingrow",
  "readsExistingImportJob: true",
  "readsExistingImportStagingRow: true",
  "callsAmazon: false",
  "queriesPrisma: true",
  "createsImportJob: false",
  "createsSyncJob: false",
  "createsSyncSegment: false",
  "writesDatabase: false",
  "writesTransaction: false",
  "writesInventoryMovement: false",
  "frontendWiredNow: false",
].forEach((needle) => {
  assert(service.includes(needle), `readonly service contains marker: ${needle}`);
});

const blockStart = controller.indexOf("  // Step150-LM: Amazon imported orders read-model guarded readonly controller activation.");
const blockEnd = controller.indexOf("\n\n  // Step122-O: Amazon SP-API sandbox ImportJob read-model", blockStart);
assert(blockStart >= 0 && blockEnd > blockStart, "Step150-LM controller block found");
const block = controller.slice(blockStart, blockEnd);

[
  "previewAmazonSpApiOrdersRealNoPersistence",
  "persistAmazonSpApiOrdersRealPreviewToImportJobAndStagingRows",
  "createAmazonSpApiOrdersHistoricalSyncWorkerDisabled(",
  "planHistoricalSync(",
  "runHistoricalSync",
  "runSegment",
  "transaction.create",
  "inventoryMovement.create",
  ".create(",
  ".update(",
  ".delete(",
  ".upsert(",
].forEach((forbidden) => {
  assert(!block.includes(forbidden), `controller block has no forbidden marker: ${forbidden}`);
});

[
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
].forEach((forbidden) => {
  assert(!service.includes(forbidden), `readonly service has no forbidden marker: ${forbidden}`);
});

assert(
  pkg.scripts["smoke:step150-h-amazon-imported-orders-read-model-disabled-controller-contract"] ===
    "node scripts/smoke-step150-h-amazon-imported-orders-read-model-disabled-controller-contract.js",
  "package.json keeps Step150-H compatibility smoke",
);

console.log("[SMOKE_OK] Step150-H/LM guarded readonly controller compatibility smoke passed");
