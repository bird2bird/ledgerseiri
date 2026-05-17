const fs = require("fs");
const path = require("path");

const root = "/opt/ledgerseiri";
const api = path.join(root, "apps/api");
const web = path.join(root, "apps/web");

const controllerPath = path.join(api, "src/imports/imports.controller.ts");
const dtoPath = path.join(api, "src/imports/dto/amazon-imported-orders-read-model-disabled-controller-contract.dto.ts");
const packagePath = path.join(api, "package.json");
const webApiPath = path.join(web, "src/core/imports/api.ts");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

console.log("========== Step150-H smoke: backend imported orders read-model disabled controller contract ==========");

const controller = read(controllerPath);
const dto = read(dtoPath);
const pkg = JSON.parse(read(packagePath));
const webApi = read(webApiPath);

[
  "AMAZON_IMPORTED_ORDERS_READ_MODEL_ENDPOINT",
  "/api/imports/amazon-sp-api/orders/imported/read-model",
  "AMAZON_IMPORTED_ORDER_DETAIL_READ_MODEL_ENDPOINT",
  "/api/imports/amazon-sp-api/orders/imported/read-model/detail",
  "listAmazonImportedOrders",
  "getAmazonImportedOrderDetail",
].forEach((needle) => {
  assert(webApi.includes(needle), `frontend Step150-G contract exists: ${needle}`);
});

[
  "AmazonImportedOrdersReadModelControllerQuery",
  "AmazonImportedOrderDetailReadModelControllerQuery",
  "AmazonImportedOrdersReadModelDisabledBoundary",
  "AmazonImportedOrdersReadModelDisabledListRouteResponse",
  "AmazonImportedOrderDetailReadModelDisabledRouteResponse",
  "buildAmazonImportedOrdersReadModelDisabledBoundary",
  "buildAmazonImportedOrdersReadModelDisabledListRouteResponse",
  "buildAmazonImportedOrderDetailReadModelDisabledRouteResponse",
  "assertAmazonImportedOrdersReadModelDisabledControllerContract",
  "STEP150_H_IMPORTED_ORDERS_READ_MODEL_DISABLED_BY_DEFAULT",
  "STEP150_H_IMPORTED_ORDER_DETAIL_READ_MODEL_DISABLED_BY_DEFAULT",
  "readOnly: true",
  "disabled: true",
  "callsAmazon: false",
  "createsImportJob: false",
  "createsSyncJob: false",
  "createsSyncSegment: false",
  "writesDatabase: false",
  "writesTransaction: false",
  "writesInventoryMovement: false",
  "financePermissionRequired: true",
].forEach((needle) => {
  assert(dto.includes(needle), `DTO contains marker: ${needle}`);
});

[
  "amazonImportedOrdersReadModelDisabledListControllerRoute",
  "amazonImportedOrderDetailReadModelDisabledControllerRoute",
  "@UseGuards(JwtAuthGuard)",
  "@Get('amazon-sp-api/orders/imported/read-model')",
  "@Get('amazon-sp-api/orders/imported/read-model/detail')",
  "STEP150_H_IMPORTED_ORDERS_READ_MODEL_COMPANY_REQUIRED",
  "STEP150_H_IMPORTED_ORDER_DETAIL_READ_MODEL_COMPANY_REQUIRED",
  "assertAmazonImportedOrdersReadModelDisabledControllerContract",
  "buildAmazonImportedOrdersReadModelDisabledListRouteResponse",
  "buildAmazonImportedOrderDetailReadModelDisabledRouteResponse",
].forEach((needle) => {
  assert(controller.includes(needle), `controller contains marker: ${needle}`);
});

const blockStart = controller.indexOf("// Step150-H: Amazon imported orders read-model disabled controller contract.");
const blockEnd = controller.indexOf("// Step122-O: Amazon SP-API sandbox ImportJob read-model", blockStart);
assert(blockStart >= 0 && blockEnd > blockStart, "Step150-H controller block found");
const block = controller.slice(blockStart, blockEnd);

[
  "this.prismaService.",
  "this.service.",
  "previewAmazonSpApiOrdersRealNoPersistence",
  "persistAmazonSpApiOrdersRealPreviewToImportJobAndStagingRows",
  "createAmazonSpApiOrdersHistoricalSyncWorkerDisabled(",
  "planHistoricalSync(",
  "runHistoricalSync",
  "runSegment",
  "transaction.create",
  "inventoryMovement.create",
  "amazonSpApiOrdersRealPreviewControllerRoute",
  "amazonSpApiOrdersRealImportJobCommitControllerRoute",
].forEach((forbidden) => {
  assert(!block.includes(forbidden), `Step150-H controller block has no forbidden marker: ${forbidden}`);
});


assert(!dto.includes("companyIdPresent: input.companyId.trim().length > 0"), "DTO does not return boolean expression for literal companyIdPresent");
assert((dto.match(/companyIdPresent: true as const/g) || []).length === 2, "DTO returns literal true companyIdPresent in both builders");

[
  "callsAmazon: true",
  "createsImportJob: true",
  "createsSyncJob: true",
  "createsSyncSegment: true",
  "writesDatabase: true",
  "writesTransaction: true",
  "writesInventoryMovement: true",
].forEach((forbidden) => {
  assert(!dto.includes(forbidden), `DTO does not contain unsafe true boundary: ${forbidden}`);
});

assert(
  pkg.scripts["smoke:step150-h-amazon-imported-orders-read-model-disabled-controller-contract"] ===
    "node scripts/smoke-step150-h-amazon-imported-orders-read-model-disabled-controller-contract.js",
  "package.json registers Step150-H smoke",
);

console.log("[SMOKE_OK] Step150-H backend imported orders read-model disabled controller contract smoke passed");
