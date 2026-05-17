const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ts = require("typescript");

const root = "/opt/ledgerseiri";
const web = path.join(root, "apps/web");
const apiPath = path.join(web, "src/core/imports/api.ts");
const packagePath = path.join(web, "package.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function loadApiExportsWithMockedFetch(mockFetch) {
  const source = read(apiPath);
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
      throw new Error(`Unexpected require in Step150-P runtime smoke: ${name}`);
    },
    fetch: mockFetch,
    console,
    URLSearchParams,
    setTimeout,
    clearTimeout,
  };

  sandbox.module.exports = sandbox.exports;
  vm.runInNewContext(output, sandbox, { filename: "api.ts.step150-p.transpiled.js" });
  return sandbox.module.exports;
}

async function main() {
  console.log("========== Step150-P runtime smoke: readonly helper endpoint closeout ==========");

  const pkg = JSON.parse(read(packagePath));
  const calls = [];

  const listResponse = {
    source: "amazon-imported-orders-read-model",
    routeImplementedNow: true,
    readOnly: true,
    companyScoped: true,
    orders: [
      {
        orderId: "ORDER-150-P",
        purchaseDate: "2026-05-17T00:00:00.000Z",
        content: "Step150-P readonly order",
        amount: "12345",
        currency: "JPY",
        service: "Amazon.co.jp",
        status: "Shipped",
        itemCount: 1,
        marketplace: "A1VC38T7YXB528",
        skuStatus: "linked",
        importStatus: "SUCCEEDED",
        importJobId: "job-150-p",
        stagingRowIds: ["row-150-p"],
      },
    ],
    summary: {
      totalOrders: 1,
      totalItems: 1,
      unresolvedSkuCount: 0,
      linkedSkuCount: 1,
      aliasLinkedSkuCount: 0,
      currency: "JPY",
      amountTotal: "12345",
    },
    pagination: {
      nextCursor: null,
      hasMore: false,
      limit: 50,
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
    routeImplementedNow: true,
    readOnly: true,
    companyScoped: true,
    detail: {
      order: listResponse.orders[0],
      items: [
        {
          orderItemId: "item-150-p",
          sellerSku: "SKU-150-P",
          asin: "B0STEP150P",
          title: "Step150-P item",
          quantity: 1,
          itemPrice: "12345",
          itemTax: "1122",
          shippingPrice: "0",
          shippingTax: "0",
          promotionDiscount: "0",
          promotionDiscountTax: "0",
          currency: "JPY",
          skuReadiness: "linked",
        },
      ],
      taxFeeSummary: {
        itemTaxTotal: "1122",
        shippingTaxTotal: "0",
        promotionDiscountTotal: "0",
        promotionDiscountTaxTotal: "0",
        amazonFeeTotal: null,
        fbaFeeTotal: null,
        settlementAmount: null,
        currency: "JPY",
        financePermissionRequired: true,
      },
      inventoryReadiness: {
        linkedRows: 1,
        aliasLinkedRows: 0,
        unresolvedRows: 0,
        auditHref: null,
      },
      importMetadata: {
        importJobId: "job-150-p",
        importedAt: "2026-05-17T00:00:00.000Z",
        stagingRowIds: ["row-150-p"],
        sourceType: "amazon-sp-api-orders",
      },
    },
    boundaries: listResponse.boundaries,
  };

  const mockFetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    const body = String(url).includes("/detail") ? detailResponse : listResponse;
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify(body),
    };
  };

  const apiExports = loadApiExportsWithMockedFetch(mockFetch);
  const list = await apiExports.listAmazonImportedOrders({
    rangePreset: "7D",
    orderId: "ORDER-150-P",
    status: "Shipped",
    content: "Step150-P",
    limit: 50,
  });
  const detail = await apiExports.getAmazonImportedOrderDetail("ORDER-150-P");

  assert(list.readOnly === true, "list is readOnly");
  assert(list.boundaries.callsAmazon === false, "list callsAmazon false");
  assert(list.boundaries.createsImportJob === false, "list createsImportJob false");
  assert(list.boundaries.createsSyncJob === false, "list createsSyncJob false");
  assert(list.boundaries.writesDatabase === false, "list writesDatabase false");
  assert(list.orders[0].orderId === "ORDER-150-P", "list returns expected order");

  assert(detail.readOnly === true, "detail is readOnly");
  assert(detail.detail.items[0].sellerSku === "SKU-150-P", "detail returns expected item");
  assert(detail.detail.taxFeeSummary.itemTaxTotal === "1122", "detail returns tax summary");

  assert(calls.length === 2, "two readonly endpoint calls");
  assert(calls[0].url.startsWith("/api/imports/amazon-sp-api/orders/imported/read-model?"), "list endpoint called");
  assert(calls[1].url === "/api/imports/amazon-sp-api/orders/imported/read-model/detail?orderId=ORDER-150-P", "detail endpoint called");

  for (const call of calls) {
    assert(call.init.credentials === "include", "credentials include");
    assert(call.init.cache === "no-store", "cache no-store");
    assert(!call.init.method || call.init.method === "GET", "GET only");
    [
      "real-preview",
      "real-importjob",
      "historical-sync",
      "run",
      "commit",
    ].forEach((forbidden) => {
      assert(!call.url.includes(forbidden), `no forbidden endpoint fragment: ${forbidden}`);
    });
  }

  assert(
    pkg.scripts["smoke:step150-p-amazon-orders-read-model-browser-runtime-closeout"] ===
      "node scripts/smoke-step150-p-amazon-orders-read-model-browser-runtime-closeout.js",
    "package.json registers Step150-P runtime closeout smoke",
  );

  console.log("[SMOKE_OK] Step150-P readonly browser/runtime closeout smoke passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
