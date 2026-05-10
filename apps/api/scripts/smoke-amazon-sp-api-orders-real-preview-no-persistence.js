#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  previewAmazonSpApiOrdersRealNoPersistence,
} = require("../dist/src/imports/amazon-sp-api-orders-real-preview.service");

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`[OK] ${message}`);
}

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`);
  return fs.readFileSync(file, "utf8");
}

function createRoutingMockTransport() {
  const calls = [];

  const transport = async (request) => {
    calls.push({
      operation: request.operation,
      signedUrl: request.signedUrl,
      headers: request.headers,
    });

    if (request.operation === "ListOrders") {
      return {
        status: 200,
        headers: {
          "x-amzn-requestid": "STEP140-P-LIST",
        },
        bodyText: JSON.stringify({
          payload: {
            Orders: [
              {
                AmazonOrderId: "ORDER-STEP140-P-001",
                PurchaseDate: "2026-05-01T10:00:00Z",
                LastUpdateDate: "2026-05-01T11:00:00Z",
                OrderStatus: "Shipped",
                FulfillmentChannel: "AFN",
                SalesChannel: "Amazon.co.jp",
                MarketplaceId: "A1VC38T7YXB528",
                OrderTotal: {
                  CurrencyCode: "JPY",
                  Amount: "4980",
                },
              },
              {
                AmazonOrderId: "ORDER-STEP140-P-002",
                PurchaseDate: "2026-05-01T12:00:00Z",
                LastUpdateDate: "2026-05-01T12:30:00Z",
                OrderStatus: "Shipped",
                FulfillmentChannel: "MFN",
                SalesChannel: "Amazon.co.jp",
                MarketplaceId: "A1VC38T7YXB528",
                OrderTotal: {
                  CurrencyCode: "JPY",
                  Amount: "7980",
                },
              },
            ],
          },
        }),
      };
    }

    if (request.signedUrl.includes("ORDER-STEP140-P-001")) {
      return {
        status: 200,
        headers: {
          "x-amzn-requestid": "STEP140-P-ITEMS-1",
        },
        bodyText: JSON.stringify({
          payload: {
            OrderItems: [
              {
                OrderItemId: "ITEM-STEP140-P-001-A",
                ASIN: "B0STEP140P1",
                SellerSKU: "SKU-STEP140-P-RESOLVED-1",
                Title: "Real preview mocked item 1",
                QuantityOrdered: 1,
                QuantityShipped: 1,
                ItemPrice: {
                  CurrencyCode: "JPY",
                  Amount: "4980",
                },
                ItemTax: {
                  CurrencyCode: "JPY",
                  Amount: "452",
                },
              },
            ],
          },
        }),
      };
    }

    if (request.signedUrl.includes("ORDER-STEP140-P-002")) {
      return {
        status: 200,
        headers: {
          "x-amzn-requestid": "STEP140-P-ITEMS-2",
        },
        bodyText: JSON.stringify({
          payload: {
            OrderItems: [
              {
                OrderItemId: "ITEM-STEP140-P-002-A",
                ASIN: "B0STEP140P2",
                SellerSKU: "SKU-STEP140-P-RESOLVED-2",
                Title: "Real preview mocked item 2",
                QuantityOrdered: 1,
                QuantityShipped: 1,
                ItemPrice: {
                  CurrencyCode: "JPY",
                  Amount: "3980",
                },
                ItemTax: {
                  CurrencyCode: "JPY",
                  Amount: "362",
                },
              },
              {
                OrderItemId: "ITEM-STEP140-P-002-B",
                ASIN: "B0STEP140P3",
                SellerSKU: "",
                Title: "Real preview mocked unresolved SKU item",
                QuantityOrdered: 2,
                QuantityShipped: 2,
                ItemPrice: {
                  CurrencyCode: "JPY",
                  Amount: "2000",
                },
                ItemTax: {
                  CurrencyCode: "JPY",
                  Amount: "182",
                },
              },
            ],
          },
        }),
      };
    }

    return {
      status: 404,
      headers: {},
      bodyText: "{}",
    };
  };

  return { transport, calls };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");

  console.log("========== Step140-P Amazon SP-API Orders real preview no persistence smoke ==========");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-real-preview-no-persistence"] ===
      "node scripts/smoke-amazon-sp-api-orders-real-preview-no-persistence.js",
    "apps/api package.json registers Step140-P smoke",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-guarded-http-client-no-db-write"],
    "Step140-O guarded HTTP client smoke remains registered",
  );

  const serviceSource = read(path.resolve(apiRoot, "src/imports/amazon-sp-api-orders-real-preview.service.ts"));

  const requiredMarkers = [
    "previewAmazonSpApiOrdersRealNoPersistence",
    "executeAmazonSpApiOrdersListOrdersHttp",
    "executeAmazonSpApiOrdersGetOrderItemsHttp",
    "real-http-mocked-transport-no-persistence",
    "parseOrdersFromListOrdersPayload",
    "parseOrderItemsPayload",
    "blockedBecauseNoPersistence: true",
    "writesDatabase: false",
    "importJobWriteNow: false",
    "transactionWriteNow: false",
    "inventoryWriteNow: false",
    "realAmazonOrdersApiCall: true",
    "usesInjectedTransportOnly: true",
  ];

  for (const marker of requiredMarkers) {
    assert(serviceSource.includes(marker), `Step140-P service marker exists: ${marker}`);
  }

  const forbiddenMarkers = [
    "prisma.",
    "importJob.create",
    "importStagingRow.create",
    "transaction.create",
    "inventoryMovement.create",
    "inventoryBalance.update",
    "fetch(",
    "axios.",
    "got(",
    "https.request(",
    "http.request(",
    "undici.request",
    "refreshToken:",
    "clientSecret:",
  ];

  for (const marker of forbiddenMarkers) {
    assert(!serviceSource.includes(marker), `Step140-P service does not contain forbidden marker: ${marker}`);
  }

  const { transport, calls } = createRoutingMockTransport();

  const preview = await previewAmazonSpApiOrdersRealNoPersistence({
    companyId: "step140-p-company",
    storeId: "step140-p-store",
    marketplaceId: "A1VC38T7YXB528",
    region: "JP",
    accessToken: "AT_SECRET_STEP140_P",
    credentials: {
      accessKeyId: "AKIASTEP140P",
      secretAccessKey: "AWS_SECRET_STEP140_P",
      sessionToken: "SESSION_SECRET_STEP140_P",
    },
    createdAfter: "2026-05-01T00:00:00Z",
    createdBefore: "2026-05-02T00:00:00Z",
    orderStatuses: ["Shipped"],
    maxResultsPerPage: 50,
    now: new Date("2026-05-10T13:00:00Z"),
    env: {
      AMAZON_SP_API_ORDERS_REAL_HTTP_ENABLED: "true",
    },
    transport,
  });

  assert(preview.step === "Step140-P", "preview step is Step140-P");
  assert(preview.source === "amazon-sp-api-orders-real-preview", "preview source is real preview");
  assert(preview.previewMode === "real-http-mocked-transport-no-persistence", "preview mode is mocked transport no persistence");
  assert(preview.dryRun === false, "real preview dryRun is false");
  assert(preview.persisted === false, "real preview is not persisted");
  assert(preview.companyId === "step140-p-company", "companyId passes through");
  assert(preview.storeId === "step140-p-store", "storeId passes through");
  assert(preview.marketplaceId === "A1VC38T7YXB528", "marketplaceId passes through");
  assert(preview.region === "FE", "JP region maps to FE");
  assert(preview.normalizedOrders.length === 2, "preview has 2 normalized orders");
  assert(preview.normalizedOrderItems.length === 3, "preview has 3 normalized order items");
  assert(preview.validationSummary.totalOrders === 2, "validation total orders is 2");
  assert(preview.validationSummary.totalOrderItems === 3, "validation total items is 3");
  assert(preview.dedupeSummary.duplicateOrdersCount === 0, "dedupe duplicate orders is 0");
  assert(preview.dedupeSummary.duplicateItemsCount === 0, "dedupe duplicate items is 0");
  assert(preview.skuResolutionSummary.resolvedSkuCount === 2, "resolved SKU count is 2");
  assert(preview.skuResolutionSummary.unresolvedSkuCount === 1, "unresolved SKU count is 1");
  assert(preview.inventoryImpactPreview.wouldDeductInventory === false, "inventory deduction remains false");
  assert(preview.inventoryImpactPreview.blockedBecauseNoPersistence === true, "inventory blocked by no persistence");
  assert(preview.inventoryImpactPreview.blockedBecauseUnresolvedSkuCount === 1, "inventory tracks unresolved SKU block");
  assert(preview.transactionImpactPreview.wouldCreateTransactions === false, "transaction creation remains false");
  assert(preview.transactionImpactPreview.blockedBecauseNoPersistence === true, "transaction blocked by no persistence");
  assert(preview.transactionImpactPreview.transactionPreviewCount === 2, "transaction preview count is 2");
  assert(preview.transactionImpactPreview.totalPreviewAmount === 12960, "transaction preview total amount is 12960");
  assert(preview.httpSummary.listOrdersStatus === 200, "http summary listOrders status is 200");
  assert(preview.httpSummary.getOrderItemsCalls === 2, "http summary getOrderItems calls is 2");
  assert(preview.writesDatabase === false, "preview writes no database");
  assert(preview.importJobWriteNow === false, "preview writes no ImportJob");
  assert(preview.importStagingRowWriteNow === false, "preview writes no ImportStagingRow");
  assert(preview.transactionWriteNow === false, "preview writes no Transaction");
  assert(preview.inventoryWriteNow === false, "preview writes no Inventory");
  assert(preview.realAmazonOrdersApiCall === true, "preview represents real Amazon Orders API branch");
  assert(preview.realNetworkDefaultDisabled === true, "real network default disabled");
  assert(preview.usesInjectedTransportOnly === true, "preview uses injected transport only");
  assert(calls.length === 3, "mock transport received 1 ListOrders + 2 GetOrderItems calls");

  const serialized = JSON.stringify(preview);
  assert(!serialized.includes("AT_SECRET_STEP140_P"), "preview does not expose access token");
  assert(!serialized.includes("AWS_SECRET_STEP140_P"), "preview does not expose AWS secret");
  assert(!serialized.includes("SESSION_SECRET_STEP140_P"), "preview does not expose session token");

  console.log("[SMOKE_OK] Step140-P Amazon SP-API Orders real preview no persistence smoke passed");
  console.log(JSON.stringify({ ok: true, step: "Step140-P", preview }, null, 2));
}

main().catch((err) => {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
});
