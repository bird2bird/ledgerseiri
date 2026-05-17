import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const root = "/opt/ledgerseiri";
const api = path.join(root, "apps/api");
const dtoPath = path.join(api, "src/imports/dto/amazon-imported-orders-read-model-query-design-contract.dto.ts");
const designPath = path.join(api, "src/imports/amazon-imported-orders-read-model-query-design.contract.ts");
const schemaPath = path.join(api, "prisma/schema.prisma");
const controllerPath = path.join(api, "src/imports/imports.controller.ts");
const packagePath = path.join(api, "package.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function loadDtoExports() {
  const source = read(dtoPath);
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      skipLibCheck: true,
    },
    fileName: "amazon-imported-orders-read-model-query-design-contract.dto.ts",
  }).outputText;

  const sandbox = {
    exports: {},
    module: { exports: {} },
    require: (name) => {
      throw new Error(`Unexpected require in Step150-I DTO smoke: ${name}`);
    },
    console,
  };

  sandbox.module.exports = sandbox.exports;
  vm.runInNewContext(output, sandbox, { filename: "step150-i-dto.cjs" });
  return sandbox.module.exports;
}

console.log("========== Step150-I smoke: backend imported orders read-model query design contract ==========");

const dto = read(dtoPath);
const design = read(designPath);
const schema = read(schemaPath);
const controller = read(controllerPath);
const pkg = JSON.parse(read(packagePath));

[
  "model ImportJob",
  "model ImportStagingRow",
  "sourceType String?",
  "rawPayloadJson        Json",
  "normalizedPayloadJson Json",
  "matchStatus           String",
  "targetEntityType      String?",
  "targetEntityId        String?",
].forEach((needle) => {
  assert(schema.includes(needle), `schema has source marker: ${needle}`);
});

[
  "AmazonImportedOrdersReadModelQueryDataSource",
  "AmazonImportedOrdersReadModelQueryFilters",
  "AmazonImportedOrdersReadModelGroupingContract",
  "AmazonImportedOrdersReadModelListMappingContract",
  "AmazonImportedOrderDetailReadModelMappingContract",
  "AmazonImportedOrdersReadModelQueryDesignContract",
  "buildAmazonImportedOrdersReadModelQueryDesignContract",
  "assertAmazonImportedOrdersReadModelQueryDesignContract",
  "sourceType: 'amazon-sp-api-orders'",
  "module: 'store-orders'",
  "domain: 'income'",
  "groupBy: 'amazonOrderId'",
  "fallbackWhenOrderIdMissing: 'use-staging-row-id-as-shell-order-key'",
  "multiItemPolicy: 'group-staging-rows-under-same-amazon-order-id'",
  "rowSource: 'ImportStagingRow.normalizedPayloadJson'",
  "jobSource: 'ImportJob'",
  "companyScopedBy: 'companyId'",
  "callsAmazon: false",
  "createsImportJob: false",
  "createsSyncJob: false",
  "createsSyncSegment: false",
  "writesDatabase: false",
  "writesTransaction: false",
  "writesInventoryMovement: false",
  "opensControllerRuntime: false",
  "queriesPrismaNow: false",
  "financePermissionRequiredForFees: true",
  "showTaxFromOrderPayloadWhenAvailable: true",
  "showFeesOnlyAfterFinanceReadModel: true",
].forEach((needle) => {
  assert(dto.includes(needle), `DTO has query design marker: ${needle}`);
});

[
  "defineAmazonImportedOrdersReadModelQueryDesign",
  "AMAZON_IMPORTED_ORDERS_READ_MODEL_QUERY_DESIGN_STATUS",
  "runtimeImplementedNow: false",
  "controllerDisabledInStep150H: true",
  "queriesPrismaNow: false",
  "callsAmazon: false",
  "writesDatabase: false",
].forEach((needle) => {
  assert(design.includes(needle), `design module has marker: ${needle}`);
});

[
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
].forEach((forbidden) => {
  assert(!dto.includes(forbidden), `DTO has no runtime marker: ${forbidden}`);
  assert(!design.includes(forbidden), `design module has no runtime marker: ${forbidden}`);
});

const exportsFromDto = loadDtoExports();
assert(typeof exportsFromDto.buildAmazonImportedOrdersReadModelQueryDesignContract === "function", "builder exported");
assert(typeof exportsFromDto.assertAmazonImportedOrdersReadModelQueryDesignContract === "function", "assert exported");

const contract = exportsFromDto.buildAmazonImportedOrdersReadModelQueryDesignContract({
  companyId: "cmp-step150-i",
  limit: 250,
});

assert(exportsFromDto.assertAmazonImportedOrdersReadModelQueryDesignContract(contract) === true, "contract assertion passes");
assert(contract.step === "Step150-I", "step is Step150-I");
assert(contract.routeImplementedNow === false, "route runtime remains false");
assert(contract.controllerDisabledInStep150H === true, "controller remains disabled from Step150-H");
assert(contract.designOnly === true, "designOnly true");
assert(contract.readOnly === true, "readOnly true");
assert(contract.companyScoped === true, "companyScoped true");
assert(contract.filters.companyId === "cmp-step150-i", "companyId normalized");
assert(contract.filters.limit === 100, "limit capped at 100");
assert(contract.dataSources.length === 2, "two data sources");
assert(contract.dataSources.some((source) => source.model === "ImportJob"), "ImportJob data source present");
assert(contract.dataSources.some((source) => source.model === "ImportStagingRow"), "ImportStagingRow data source present");
assert(contract.grouping.groupBy === "amazonOrderId", "grouping by amazonOrderId");
assert(contract.listMapping.rowSource === "ImportStagingRow.normalizedPayloadJson", "list row source is normalizedPayloadJson");
assert(contract.detailMapping.financePermissionPolicy.financePermissionRequiredForFees === true, "finance permission policy present");
assert(contract.boundaries.callsAmazon === false, "callsAmazon false");
assert(contract.boundaries.createsImportJob === false, "createsImportJob false");
assert(contract.boundaries.createsSyncJob === false, "createsSyncJob false");
assert(contract.boundaries.createsSyncSegment === false, "createsSyncSegment false");
assert(contract.boundaries.writesDatabase === false, "writesDatabase false");
assert(contract.boundaries.queriesPrismaNow === false, "queriesPrismaNow false");

const hasStep150HDisabledRoutes =
  controller.includes("amazonImportedOrdersReadModelDisabledListControllerRoute") &&
  controller.includes("amazonImportedOrderDetailReadModelDisabledControllerRoute");

const hasStep150LMReadonlyRoutes =
  controller.includes("amazonImportedOrdersReadModelReadonlyListControllerRoute") &&
  controller.includes("amazonImportedOrderDetailReadModelReadonlyControllerRoute") &&
  controller.includes("listAmazonImportedOrdersReadonly") &&
  controller.includes("getAmazonImportedOrderDetailReadonly");

assert(
  hasStep150HDisabledRoutes || hasStep150LMReadonlyRoutes,
  "Step150 imported orders read-model controller route remains either H-disabled or LM-readonly",
);

if (hasStep150LMReadonlyRoutes) {
  assert(controller.includes("prisma: this.prismaService"), "Step150-LM readonly controller passes Prisma service explicitly");
  assert(controller.includes("STEP150_LM_IMPORTED_ORDER_DETAIL_READ_MODEL_ORDER_ID_REQUIRED"), "Step150-LM detail route validates orderId");
}

assert(
  pkg.scripts["smoke:step150-i-amazon-imported-orders-read-model-query-design-contract"] ===
    "node scripts/smoke-step150-i-amazon-imported-orders-read-model-query-design-contract.js",
  "package.json registers Step150-I smoke",
);

console.log("[SMOKE_OK] Step150-I backend imported orders read-model query design contract smoke passed");
