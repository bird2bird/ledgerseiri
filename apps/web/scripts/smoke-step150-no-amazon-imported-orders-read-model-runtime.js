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
      throw new Error(`Unexpected require in api helper runtime smoke: ${name}`);
    },
    fetch: mockFetch,
    console,
    URLSearchParams,
    setTimeout,
    clearTimeout,
  };

  sandbox.module.exports = sandbox.exports;
  vm.runInNewContext(output, sandbox, { filename: "api.ts.transpiled.js" });
  return sandbox.module.exports;
}

async function main() {
  console.log("========== Step150-NO runtime smoke: frontend helpers call readonly endpoints ==========");

  const pkg = JSON.parse(read(packagePath));
  const calls = [];

  const listResponse = {
    source: "amazon-imported-orders-read-model",
    routeImplementedNow: true,
    readOnly: true,
    companyScoped: true,
    orders: [
      {
        orderId: "ORDER-150-NO",
        purchaseDate: "2026-05-17T00:00:00.000Z",
        content: "KIMOCA readonly order",
        amount: "12000",
        currency: "JPY",
        service: "Amazon.co.jp",
        status: "Shipped",
        itemCount: 2,
        marketplace: "A1VC38T7YXB528",
        skuStatus: "alias-linked",
        importStatus: "SUCCEEDED",
        importJobId: "job-150-no",
        stagingRowIds: ["row-1", "row-2"],
      },
    ],
    summary: {
      totalOrders: 1,
      totalItems: 2,
      unresolvedSkuCount: 0,
      linkedSkuCount: 1,
      aliasLinkedSkuCount: 1,
      currency: "JPY",
      amountTotal: "12000",
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
          orderItemId: "item-1",
          sellerSku: "SKU-150-NO",
          asin: "B0NO150",
          title: "KIMOCA readonly item",
          quantity: 1,
          itemPrice: "10000",
          itemTax: "1000",
          shippingPrice: "500",
          shippingTax: "50",
          promotionDiscount: "300",
          promotionDiscountTax: "30",
          currency: "JPY",
          skuReadiness: "linked",
        },
      ],
      taxFeeSummary: {
        itemTaxTotal: "1000",
        shippingTaxTotal: "50",
        promotionDiscountTotal: "300",
        promotionDiscountTaxTotal: "30",
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
        importJobId: "job-150-no",
        importedAt: "2026-05-17T00:00:00.000Z",
        stagingRowIds: ["row-1"],
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
  assert(typeof apiExports.listAmazonImportedOrders === "function", "list helper exported");
  assert(typeof apiExports.getAmazonImportedOrderDetail === "function", "detail helper exported");

  const list = await apiExports.listAmazonImportedOrders({
    rangePreset: "7D",
    orderId: "ORDER-150-NO",
    status: "Shipped",
    content: "KIMOCA",
    limit: 50,
  });

  const detail = await apiExports.getAmazonImportedOrderDetail("ORDER-150-NO");

  assert(list.orders.length === 1, "list returned one order");
  assert(list.summary.totalOrders === 1, "summary totalOrders");
  assert(detail.detail.items.length === 1, "detail wrapper returned item row");
  assert(detail.detail.taxFeeSummary.itemTaxTotal === "1000", "detail tax total");

  assert(calls.length === 2, "exactly two readonly fetch calls");
  assert(calls[0].url.startsWith("/api/imports/amazon-sp-api/orders/imported/read-model?"), "list readonly endpoint called");
  assert(calls[1].url === "/api/imports/amazon-sp-api/orders/imported/read-model/detail?orderId=ORDER-150-NO", "detail readonly endpoint called");

  for (const call of calls) {
    assert(call.init.credentials === "include", "credentials included");
    assert(call.init.cache === "no-store", "cache disabled");
    assert(!call.init.method || call.init.method === "GET", "GET only");
    for (const forbidden of [
      "real-preview",
      "real-importjob",
      "historical-sync/plan-preview",
      "historical-sync/run",
      "commit",
    ]) {
      assert(!call.url.includes(forbidden), `no forbidden endpoint fragment: ${forbidden}`);
    }
  }

  assert(
    pkg.scripts["smoke:step150-no-amazon-imported-orders-read-model-runtime"] ===
      "node scripts/smoke-step150-no-amazon-imported-orders-read-model-runtime.js",
    "package.json registers Step150-NO runtime smoke",
  );

  console.log("[SMOKE_OK] Step150-NO frontend runtime smoke passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
