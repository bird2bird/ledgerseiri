const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ts = require("typescript");

const root = "/opt/ledgerseiri";
const web = path.join(root, "apps/web");
const apiTsPath = path.join(web, "src/core/imports/api.ts");
const ordersPagePath = path.join(web, "src/app/[lang]/app/data/import/amazon-orders/page.tsx");
const packagePath = path.join(web, "package.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function loadApiExportsWithMockedFetch(mockFetch) {
  const source = read(apiTsPath);
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      skipLibCheck: true,
    },
    fileName: "api.ts",
  }).outputText;

  const sandbox = {
    exports: {},
    module: { exports: {} },
    require: (name) => {
      throw new Error(`Unexpected require in api helper runtime smoke: ${name}`);
    },
    fetch: mockFetch,
    console,
    URLSearchParams,
    setTimeout,
    clearTimeout,
  };

  sandbox.module.exports = sandbox.exports;
  vm.runInNewContext(output, sandbox, {
    filename: "api.ts.transpiled.js",
  });

  return sandbox.module.exports;
}

async function main() {
  console.log("========== Step150-G smoke: Amazon imported orders read-model helper contract ==========");

  const api = read(apiTsPath);
  const ordersPage = read(ordersPagePath);
  const pkg = JSON.parse(read(packagePath));

  [
    "Step150-G-FRONTEND-AMAZON-IMPORTED-ORDERS-READ-MODEL-CONTRACT",
    "AmazonImportedOrdersReadModelRangePreset",
    "AmazonImportedOrdersReadModelListRequest",
    "AmazonImportedOrdersReadModelOrderRow",
    "AmazonImportedOrdersReadModelSummary",
    "AmazonImportedOrdersReadModelPagination",
    "AmazonImportedOrdersReadModelListResponse",
    "AmazonImportedOrderDetailReadModelItemRow",
    "AmazonImportedOrderDetailReadModelResponse",
    "AMAZON_IMPORTED_ORDERS_READ_MODEL_ENDPOINT",
    "AMAZON_IMPORTED_ORDER_DETAIL_READ_MODEL_ENDPOINT",
    "listAmazonImportedOrders",
    "getAmazonImportedOrderDetail",
    "readsExistingImportJob: true",
    "readsExistingImportStagingRow: true",
    "callsAmazon: false",
    "createsImportJob: false",
    "createsSyncJob: false",
    "createsSyncSegment: false",
    "writesDatabase: false",
    "writesTransaction: false",
    "writesInventoryMovement: false",
    "financePermissionRequired: boolean",
    "itemTaxTotal",
    "shippingTaxTotal",
    "promotionDiscountTotal",
    "amazonFeeTotal",
    "fbaFeeTotal",
    "settlementAmount",
  ].forEach((needle) => {
    assert(api.includes(needle), `api.ts contains contract marker: ${needle}`);
  });

  const blockStart = api.indexOf("Step150-G-FRONTEND-AMAZON-IMPORTED-ORDERS-READ-MODEL-CONTRACT");
  const blockEnd = api.indexOf("// Step141-G2-FRONTEND-AMAZON-SP-API-STAGING-COMMIT-READINESS", blockStart);
  assert(blockStart >= 0 && blockEnd > blockStart, "Step150-G block scope found");
  const block = api.slice(blockStart, blockEnd);

  [
    "previewAmazonSpApiOrdersReal(",
    "commitAmazonSpApiOrdersRealImportJob(",
    "previewAmazonSpApiOrdersHistoricalSyncPlan(",
    "runHistoricalSync",
    "runSegment",
    "createSyncJob",
    "createSyncSegment",
    "postJson<",
    'method: "POST"',
    "real-preview",
    "real-importjob",
    "historical-sync/plan-preview",
    "transaction.create",
    "inventoryMovement.create",
  ].forEach((forbidden) => {
    assert(!block.includes(forbidden), `Step150-G block has no forbidden marker: ${forbidden}`);
  });

  const pageWiredToReadonlyReadModel =
    ordersPage.includes("Step150-NO-FRONTEND-READ-MODEL-WIRING") &&
    ordersPage.includes("listAmazonImportedOrders") &&
    ordersPage.includes("getAmazonImportedOrderDetail");

  if (pageWiredToReadonlyReadModel) {
    assert(ordersPage.includes("readonly read-model"), "orders page documents readonly read-model wiring");
    assert(!ordersPage.includes("previewAmazonSpApiOrdersReal("), "orders page does not call real preview");
    assert(!ordersPage.includes("commitAmazonSpApiOrdersRealImportJob("), "orders page does not call real importjob");
  } else {
    [
      "listAmazonImportedOrders(",
      "getAmazonImportedOrderDetail(",
    ].forEach((futureRuntime) => {
      assert(!ordersPage.includes(futureRuntime), `orders page not yet wired to helper: ${futureRuntime}`);
    });
  }

  const calls = [];
  const listResponse = {
    source: "amazon-imported-orders-read-model",
    readOnly: true,
    companyScoped: true,
    orders: [],
    summary: {
      totalOrders: 0,
      totalItems: 0,
      unresolvedSkuCount: 0,
      linkedSkuCount: 0,
      aliasLinkedSkuCount: 0,
      currency: null,
      amountTotal: null,
    },
    pagination: {
      nextCursor: null,
      hasMore: false,
      limit: 20,
    },
    boundaries: {
      readsExistingImportJob: true,
      readsExistingImportStagingRow: true,
      callsAmazon: false,
      createsImportJob: false,
      createsSyncJob: false,
      createsSyncSegment: false,
      writesDatabase: false,
      writesTransaction: false,
      writesInventoryMovement: false,
    },
  };

  const detailResponse = {
    source: "amazon-imported-order-detail-read-model",
    readOnly: true,
    companyScoped: true,
    order: {
      orderId: "SHELL-ORDER-0001",
      purchaseDate: null,
      content: "read-model pending",
      amount: null,
      currency: null,
      service: "Amazon.co.jp",
      status: "read-model-pending",
      itemCount: 0,
      marketplace: "Amazon.co.jp",
      skuStatus: "read-model-pending",
      importStatus: "read-model-pending",
      importJobId: null,
      stagingRowIds: [],
    },
    items: [],
    taxFeeSummary: {
      itemTaxTotal: null,
      shippingTaxTotal: null,
      promotionDiscountTotal: null,
      promotionDiscountTaxTotal: null,
      amazonFeeTotal: null,
      fbaFeeTotal: null,
      settlementAmount: null,
      currency: null,
      financePermissionRequired: true,
    },
    inventoryReadiness: {
      linkedRows: 0,
      aliasLinkedRows: 0,
      unresolvedRows: 0,
      auditHref: null,
    },
    importMetadata: {
      importJobId: null,
      importedAt: null,
      stagingRowIds: [],
      sourceType: "amazon-sp-api-orders",
    },
    boundaries: {
      readsExistingImportJob: true,
      readsExistingImportStagingRow: true,
      callsAmazon: false,
      createsImportJob: false,
      createsSyncJob: false,
      createsSyncSegment: false,
      writesDatabase: false,
      writesTransaction: false,
      writesInventoryMovement: false,
    },
  };

  const mockFetch = async (url, init = {}) => {
    calls.push({ url, init });
    const body = String(url).includes("/detail") ? detailResponse : listResponse;
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify(body),
    };
  };

  const apiExports = loadApiExportsWithMockedFetch(mockFetch);

  assert(typeof apiExports.listAmazonImportedOrders === "function", "runtime export listAmazonImportedOrders exists");
  assert(typeof apiExports.getAmazonImportedOrderDetail === "function", "runtime export getAmazonImportedOrderDetail exists");

  await apiExports.listAmazonImportedOrders({
    rangePreset: "30D",
    startDate: "2026-05-01",
    endDate: "2026-05-17",
    orderId: "ORDER-1",
    status: "Shipped",
    content: "keyboard",
    minAmount: 100,
    maxAmount: 5000,
    cursor: "cursor-1",
    limit: 20,
  });

  await apiExports.getAmazonImportedOrderDetail("ORDER-1");

  assert(calls.length === 2, "runtime helpers perform exactly two read-model fetches");
  assert(
    String(calls[0].url).startsWith("/api/imports/amazon-sp-api/orders/imported/read-model?"),
    "list helper calls imported orders read-model endpoint",
  );
  assert(String(calls[0].url).includes("rangePreset=30D"), "list helper includes rangePreset");
  assert(String(calls[0].url).includes("startDate=2026-05-01"), "list helper includes startDate");
  assert(String(calls[0].url).includes("endDate=2026-05-17"), "list helper includes endDate");
  assert(String(calls[0].url).includes("orderId=ORDER-1"), "list helper includes orderId");
  assert(String(calls[0].url).includes("limit=20"), "list helper includes limit");
  assert(calls[0].init.credentials === "include", "list helper includes credentials");
  assert(calls[0].init.cache === "no-store", "list helper disables cache");
  assert(!calls[0].init.method || calls[0].init.method === "GET", "list helper does not POST");

  assert(
    String(calls[1].url) === "/api/imports/amazon-sp-api/orders/imported/read-model/detail?orderId=ORDER-1",
    "detail helper calls imported order detail read-model endpoint",
  );
  assert(calls[1].init.credentials === "include", "detail helper includes credentials");
  assert(calls[1].init.cache === "no-store", "detail helper disables cache");
  assert(!calls[1].init.method || calls[1].init.method === "GET", "detail helper does not POST");

  const forbiddenEndpointFragments = [
    "real-preview",
    "real-importjob",
    "historical-sync/plan-preview",
    "historical-sync/run",
    "historical-sync/execute",
    "historical-sync/commit",
  ];

  for (const forbidden of forbiddenEndpointFragments) {
    assert(!calls.some((call) => String(call.url).includes(forbidden)), `helpers did not call forbidden endpoint: ${forbidden}`);
  }

  assert(
    pkg.scripts["smoke:step150-g-amazon-imported-orders-read-model-helper-contract"] ===
      "node scripts/smoke-step150-g-amazon-imported-orders-read-model-helper-contract.js",
    "package.json registers Step150-G smoke",
  );

  console.log("[SMOKE_OK] Step150-G Amazon imported orders read-model helper contract smoke passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
