import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const root = "/opt/ledgerseiri";
const api = path.join(root, "apps/api");
const dtoPath = path.join(api, "src/imports/dto/amazon-imported-orders-read-model-test-double-contract.dto.ts");
const mapperPath = path.join(api, "src/imports/amazon-imported-orders-read-model.mapper.test-double.ts");
const servicePath = path.join(api, "src/imports/amazon-imported-orders-read-model.service.test-double.ts");
const packagePath = path.join(api, "package.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function transpileForVm(filePath, extra = {}) {
  const source = read(filePath);
  let output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      skipLibCheck: true,
    },
    fileName: path.basename(filePath),
  }).outputText;

  for (const [needle, replacement] of Object.entries(extra)) {
    output = output.replaceAll(needle, replacement);
  }
  return output;
}

function loadMapperExports() {
  const dtoOutput = transpileForVm(dtoPath);
  const mapperOutput = transpileForVm(mapperPath, {
    "require(\"./dto/amazon-imported-orders-read-model-test-double-contract.dto\")": "dtoModule",
  });

  const dtoSandbox = {
    exports: {},
    module: { exports: {} },
    require: (name) => {
      throw new Error(`Unexpected DTO require: ${name}`);
    },
    console,
  };
  dtoSandbox.module.exports = dtoSandbox.exports;
  vm.runInNewContext(dtoOutput, dtoSandbox, { filename: "step150-jk-dto.cjs" });

  const mapperSandbox = {
    exports: {},
    module: { exports: {} },
    require: (name) => {
      throw new Error(`Unexpected mapper require: ${name}`);
    },
    dtoModule: dtoSandbox.module.exports,
    console,
    encodeURIComponent,
  };
  mapperSandbox.module.exports = mapperSandbox.exports;
  vm.runInNewContext(mapperOutput, mapperSandbox, { filename: "step150-jk-mapper.cjs" });

  return mapperSandbox.module.exports;
}

console.log("========== Step150-JK smoke: imported orders read-model test-double mapper/service ==========");

const dto = read(dtoPath);
const mapper = read(mapperPath);
const service = read(servicePath);
const pkg = JSON.parse(read(packagePath));

[
  "AmazonImportedOrdersTestDoubleImportJob",
  "AmazonImportedOrdersTestDoubleStagingRow",
  "AmazonImportedOrdersReadModelTestDoubleImportJob",
  "AmazonImportedOrdersReadModelTestDoubleStagingRow",
  "AmazonImportedOrdersReadModelTestDoubleOrderRow",
  "AmazonImportedOrdersReadModelTestDoubleItemRow",
  "AmazonImportedOrdersReadModelTestDoubleDetail",
  "AmazonImportedOrdersReadModelTestDoubleListResult",
  "AmazonImportedOrdersReadModelTestDoubleDetailResult",
  "buildAmazonImportedOrdersReadModelTestDoubleBoundaries",
  "assertAmazonImportedOrdersReadModelTestDoubleBoundaries",
  "callsAmazon: false",
  "queriesPrisma: false",
  "createsImportJob: false",
  "createsSyncJob: false",
  "createsSyncSegment: false",
  "writesDatabase: false",
  "writesTransaction: false",
  "writesInventoryMovement: false",
  "opensControllerRuntime: false",
].forEach((needle) => assert(dto.includes(needle), `DTO marker exists: ${needle}`));

[
  "mapAmazonImportedOrdersTestDoubleList",
  "mapAmazonImportedOrderDetailTestDouble",
  "groupRowsByOrderId",
  "deriveOrderId",
  "mapItem",
  "amazonOrderId",
  "SKU_LINKED_BY_PRODUCT_SKU_ALIAS",
  "promotionDiscountTax",
  "financePermissionRequired: true",
  "auditHref",
].forEach((needle) => assert(mapper.includes(needle), `mapper marker exists: ${needle}`));

[
  "AmazonImportedOrdersReadModelTestDoubleService",
  "listImportedOrders",
  "getImportedOrderDetail",
  "AMAZON_IMPORTED_ORDERS_READ_MODEL_TEST_DOUBLE_SERVICE_STATUS",
  "runtimeControllerWiredNow: false",
  "queriesPrisma: false",
  "callsAmazon: false",
  "writesDatabase: false",
].forEach((needle) => assert(service.includes(needle), `service marker exists: ${needle}`));

for (const forbidden of [
  "PrismaClient",
  "this.prismaService",
  "this.service",
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
  assert(!dto.includes(forbidden), `DTO has no runtime marker: ${forbidden}`);
  assert(!mapper.includes(forbidden), `mapper has no runtime marker: ${forbidden}`);
  assert(!service.includes(forbidden), `service has no runtime marker: ${forbidden}`);
}

const mapperExports = loadMapperExports();

const importJobs = [
  {
    id: "job-amz-1",
    companyId: "cmp-1",
    domain: "income",
    module: "store-orders",
    sourceType: "amazon-sp-api-orders",
    status: "SUCCEEDED",
    importedAt: "2026-05-17T00:00:00.000Z",
    createdAt: "2026-05-17T00:00:00.000Z",
  },
  {
    id: "job-other-company",
    companyId: "cmp-other",
    domain: "income",
    module: "store-orders",
    sourceType: "amazon-sp-api-orders",
    status: "SUCCEEDED",
    importedAt: "2026-05-17T00:00:00.000Z",
    createdAt: "2026-05-17T00:00:00.000Z",
  },
];

const stagingRows = [
  {
    id: "row-1",
    companyId: "cmp-1",
    importJobId: "job-amz-1",
    module: "store-orders",
    rowNo: 1,
    businessMonth: "2026-05",
    rawPayloadJson: {},
    normalizedPayloadJson: {
      amazonOrderId: "ORDER-001",
      purchaseDate: "2026-05-16T10:00:00.000Z",
      orderStatus: "Shipped",
      marketplaceId: "A1VC38T7YXB528",
      currency: "JPY",
      title: "KIMOCA Monitor",
      sellerSku: "SKU-MONITOR",
      asin: "B0TEST111",
      quantityOrdered: 1,
      itemPrice: { amount: "10000" },
      itemTax: { amount: "1000" },
      shippingPrice: { amount: "500" },
      shippingTax: { amount: "50" },
      promotionDiscount: { amount: "300" },
      promotionDiscountTax: { amount: "30" },
    },
    matchStatus: "SKU_LINKED",
    matchReason: null,
    targetEntityType: "ProductSku",
    targetEntityId: "sku-1",
    createdAt: "2026-05-17T00:00:00.000Z",
  },
  {
    id: "row-2",
    companyId: "cmp-1",
    importJobId: "job-amz-1",
    module: "store-orders",
    rowNo: 2,
    businessMonth: "2026-05",
    rawPayloadJson: {},
    normalizedPayloadJson: {
      amazonOrderId: "ORDER-001",
      purchaseDate: "2026-05-16T10:00:00.000Z",
      orderStatus: "Shipped",
      marketplaceId: "A1VC38T7YXB528",
      currency: "JPY",
      title: "KIMOCA Cable",
      sellerSku: "SKU-CABLE",
      asin: "B0TEST222",
      quantityOrdered: 2,
      itemPrice: { amount: "2000" },
      itemTax: { amount: "200" },
      shippingTax: { amount: "0" },
      promotionDiscount: { amount: "0" },
      promotionDiscountTax: { amount: "0" },
    },
    matchStatus: "SKU_LINKED_BY_PRODUCT_SKU_ALIAS",
    matchReason: null,
    targetEntityType: "ProductSku",
    targetEntityId: "sku-2",
    createdAt: "2026-05-17T00:00:01.000Z",
  },
  {
    id: "row-3",
    companyId: "cmp-1",
    importJobId: "job-amz-1",
    module: "store-orders",
    rowNo: 3,
    businessMonth: "2026-05",
    rawPayloadJson: {},
    normalizedPayloadJson: {
      amazonOrderId: "ORDER-002",
      purchaseDate: "2026-05-15T10:00:00.000Z",
      orderStatus: "Pending",
      marketplaceId: "A1VC38T7YXB528",
      currency: "JPY",
      title: "Unknown SKU",
      sellerSku: "SKU-UNKNOWN",
      asin: "B0TEST333",
      quantityOrdered: 1,
      itemPrice: { amount: "3000" },
      itemTax: { amount: "300" },
    },
    matchStatus: "UNRESOLVED",
    matchReason: "sku_not_found",
    targetEntityType: null,
    targetEntityId: null,
    createdAt: "2026-05-17T00:00:02.000Z",
  },
  {
    id: "row-other-company",
    companyId: "cmp-other",
    importJobId: "job-other-company",
    module: "store-orders",
    rowNo: 1,
    businessMonth: "2026-05",
    rawPayloadJson: {},
    normalizedPayloadJson: { amazonOrderId: "ORDER-OTHER", title: "Other company" },
    matchStatus: "SKU_LINKED",
    matchReason: null,
    targetEntityType: "ProductSku",
    targetEntityId: "sku-other",
    createdAt: "2026-05-17T00:00:03.000Z",
  },
];

const list = mapperExports.mapAmazonImportedOrdersTestDoubleList({
  companyId: "cmp-1",
  importJobs,
  stagingRows,
  filters: { companyId: "cmp-1", limit: 20 },
});

assert(list.source === "amazon-imported-orders-read-model-test-double", "list source");
assert(list.step === "Step150-JK", "list step");
assert(list.readOnly === true, "list readOnly");
assert(list.testDoubleOnly === true, "list testDoubleOnly");
assert(list.boundaries.callsAmazon === false, "list callsAmazon false");
assert(list.boundaries.queriesPrisma === false, "list queriesPrisma false");
assert(list.boundaries.writesDatabase === false, "list writesDatabase false");
assert(list.orders.length === 2, "company-scoped grouping returns 2 orders");
assert(list.orders.some((order) => order.orderId === "ORDER-001" && order.itemCount === 2), "ORDER-001 grouped two item rows");
assert(list.orders.some((order) => order.orderId === "ORDER-002" && order.skuStatus === "unresolved"), "ORDER-002 unresolved");
assert(!list.orders.some((order) => order.orderId === "ORDER-OTHER"), "other company row excluded");
assert(list.summary.totalOrders === 2, "summary totalOrders");
assert(list.summary.totalItems === 3, "summary totalItems");
assert(list.summary.unresolvedSkuCount === 1, "summary unresolved count");
assert(list.summary.aliasLinkedSkuCount === 1, "summary alias-linked count");

const detail = mapperExports.mapAmazonImportedOrderDetailTestDouble({
  companyId: "cmp-1",
  orderId: "ORDER-001",
  importJobs,
  stagingRows,
});

assert(detail.source === "amazon-imported-order-detail-read-model-test-double", "detail source");
assert(detail.step === "Step150-JK", "detail step");
assert(detail.detail !== null, "detail found");
assert(detail.detail.order.orderId === "ORDER-001", "detail orderId");
assert(detail.detail.order.itemCount === 2, "detail itemCount");
assert(detail.detail.items.length === 2, "detail has 2 item rows");
assert(detail.detail.items[0].sellerSku === "SKU-MONITOR", "first item sellerSku");
assert(detail.detail.items[1].skuReadiness === "alias-linked", "second item alias readiness");
assert(detail.detail.taxFeeSummary.itemTaxTotal === "1200", "item tax total");
assert(detail.detail.taxFeeSummary.shippingTaxTotal === "50", "shipping tax total");
assert(detail.detail.taxFeeSummary.promotionDiscountTotal === "300", "promotion discount total");
assert(detail.detail.taxFeeSummary.promotionDiscountTaxTotal === "30", "promotion discount tax total");
assert(detail.detail.taxFeeSummary.financePermissionRequired === true, "finance permission required");
assert(detail.detail.inventoryReadiness.linkedRows === 1, "linked row count");
assert(detail.detail.inventoryReadiness.aliasLinkedRows === 1, "alias-linked row count");
assert(detail.detail.inventoryReadiness.unresolvedRows === 0, "unresolved row count");
assert(detail.detail.importMetadata.importJobId === "job-amz-1", "import job id");
assert(detail.detail.importMetadata.stagingRowIds.length === 2, "staging row ids count");

const missing = mapperExports.mapAmazonImportedOrderDetailTestDouble({
  companyId: "cmp-1",
  orderId: "ORDER-MISSING",
  importJobs,
  stagingRows,
});
assert(missing.detail === null, "missing detail returns null");

assert(
  pkg.scripts["smoke:step150-jk-amazon-imported-orders-read-model-test-double-mapper"] ===
    "node scripts/smoke-step150-jk-amazon-imported-orders-read-model-test-double-mapper.js",
  "package.json registers Step150-JK smoke",
);

console.log("[SMOKE_OK] Step150-JK imported orders read-model test-double mapper/service smoke passed");
