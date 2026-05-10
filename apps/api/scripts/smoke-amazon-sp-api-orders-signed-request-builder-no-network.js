#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  buildAmazonSpApiCanonicalQueryString,
  buildAmazonSpApiOrdersGetOrderItemsSignedRequest,
  buildAmazonSpApiOrdersListOrdersSignedRequest,
  resolveAmazonSpApiOrdersEndpoint,
} = require("../dist/src/imports/amazon-sp-api-orders-signed-request.builder");

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`[OK] ${message}`);
}

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`);
  return fs.readFileSync(file, "utf8");
}

function assertRejects(fn, expectedText, message) {
  let rejected = false;
  try {
    fn();
  } catch (err) {
    rejected = String(err && err.message ? err.message : err).includes(expectedText);
  }
  assert(rejected, message);
}

function main() {
  const apiRoot = path.resolve(__dirname, "..");

  console.log("========== Step140-N Amazon SP-API Orders signed request builder no-network smoke ==========");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-signed-request-builder-no-network"] ===
      "node scripts/smoke-amazon-sp-api-orders-signed-request-builder-no-network.js",
    "apps/api package.json registers Step140-N smoke",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-real-http-activation-guard"],
    "Step140-M real HTTP activation guard smoke remains registered",
  );

  const builderSource = read(path.resolve(apiRoot, "src/imports/amazon-sp-api-orders-signed-request.builder.ts"));

  const requiredMarkers = [
    "buildAmazonSpApiOrdersListOrdersSignedRequest",
    "buildAmazonSpApiOrdersGetOrderItemsSignedRequest",
    "resolveAmazonSpApiOrdersEndpoint",
    "buildAmazonSpApiCanonicalQueryString",
    "AWS4-HMAC-SHA256",
    "createHash",
    "createHmac",
    "authorizationHeaderRedacted: true",
    "secretAccessKeyRedacted: true",
    "sessionTokenRedacted: true",
    "doesNotExecuteNetwork: true",
    "doesNotUseHttpClient: true",
    "doesNotWriteImportJob: true",
    "doesNotWriteTransaction: true",
    "doesNotWriteInventory: true",
  ];

  for (const marker of requiredMarkers) {
    assert(builderSource.includes(marker), `Step140-N builder marker exists: ${marker}`);
  }

  const forbiddenMarkers = [
    "fetch(",
    "axios.",
    "got(",
    "https.request(",
    "http.request(",
    "undici.request",
    "prisma.",
    "importJob.create",
    "importStagingRow.create",
    "transaction.create",
    "inventoryMovement.create",
    "inventoryBalance.update",
    "refreshToken",
    "clientSecret",
  ];

  for (const marker of forbiddenMarkers) {
    assert(!builderSource.includes(marker), `Step140-N builder does not contain forbidden marker: ${marker}`);
  }

  assert(resolveAmazonSpApiOrdersEndpoint("FE") === "https://sellingpartnerapi-fe.amazon.com", "FE endpoint is stable");
  assert(resolveAmazonSpApiOrdersEndpoint("NA") === "https://sellingpartnerapi-na.amazon.com", "NA endpoint is stable");
  assert(resolveAmazonSpApiOrdersEndpoint("EU") === "https://sellingpartnerapi-eu.amazon.com", "EU endpoint is stable");

  const query = buildAmazonSpApiCanonicalQueryString({
    MarketplaceIds: "A1VC38T7YXB528",
    CreatedAfter: "2026-05-01T00:00:00Z",
    OrderStatuses: ["Shipped", "Unshipped"],
    MaxResultsPerPage: "50",
  });

  assert(query.includes("CreatedAfter=2026-05-01T00%3A00%3A00Z"), "canonical query encodes CreatedAfter");
  assert(query.includes("MarketplaceIds=A1VC38T7YXB528"), "canonical query includes MarketplaceIds");
  assert(query.includes("OrderStatuses=Shipped"), "canonical query supports repeated OrderStatuses");
  assert(query.includes("OrderStatuses=Unshipped"), "canonical query supports second OrderStatuses");

  const base = {
    companyId: "step140-n-company",
    storeId: "step140-n-store",
    marketplaceId: "A1VC38T7YXB528",
    region: "JP",
    accessToken: "AT_SECRET_STEP140_N",
    credentials: {
      accessKeyId: "AKIASTEP140N",
      secretAccessKey: "AWS_SECRET_STEP140_N",
      sessionToken: "SESSION_SECRET_STEP140_N",
    },
    now: new Date("2026-05-10T12:00:00Z"),
    env: {
      AMAZON_SP_API_ORDERS_REAL_HTTP_ENABLED: "true",
    },
  };

  const listOrders = buildAmazonSpApiOrdersListOrdersSignedRequest({
    ...base,
    createdAfter: "2026-05-01T00:00:00Z",
    createdBefore: "2026-05-02T00:00:00Z",
    orderStatuses: ["Shipped"],
    maxResultsPerPage: 50,
  });

  assert(listOrders.step === "Step140-N", "ListOrders envelope step is Step140-N");
  assert(listOrders.operation === "ListOrders", "ListOrders operation marker is stable");
  assert(listOrders.method === "GET", "ListOrders method is GET");
  assert(listOrders.endpoint === "https://sellingpartnerapi-fe.amazon.com", "ListOrders maps JP to FE endpoint");
  assert(listOrders.host === "sellingpartnerapi-fe.amazon.com", "ListOrders host is FE host");
  assert(listOrders.path === "/orders/v0/orders", "ListOrders path is stable");
  assert(listOrders.canonicalQueryString.includes("MarketplaceIds=A1VC38T7YXB528"), "ListOrders query includes marketplace");
  assert(listOrders.canonicalQueryString.includes("CreatedAfter=2026-05-01T00%3A00%3A00Z"), "ListOrders query includes CreatedAfter");
  assert(listOrders.headers["x-amz-access-token"] === "[REDACTED]", "ListOrders access token is redacted");
  assert(listOrders.headers.authorization.includes("Signature=[REDACTED]"), "ListOrders authorization signature is redacted");
  assert(!JSON.stringify(listOrders).includes("AT_SECRET_STEP140_N"), "ListOrders envelope does not expose access token");
  assert(!JSON.stringify(listOrders).includes("AWS_SECRET_STEP140_N"), "ListOrders envelope does not expose AWS secret");
  assert(!JSON.stringify(listOrders).includes("SESSION_SECRET_STEP140_N"), "ListOrders envelope does not expose session token");
  assert(listOrders.sanitized.accessTokenRedacted === true, "ListOrders sanitized access token flag is true");
  assert(listOrders.sanitized.authorizationHeaderRedacted === true, "ListOrders sanitized authorization flag is true");
  assert(listOrders.debug.algorithm === "AWS4-HMAC-SHA256", "ListOrders debug algorithm is SigV4");
  assert(listOrders.debug.signedHeaders.includes("host"), "ListOrders signed headers include host");
  assert(listOrders.debug.signedHeaders.includes("x-amz-access-token"), "ListOrders signed headers include access token header");
  assert(listOrders.boundaries.doesNotExecuteNetwork === true, "ListOrders does not execute network");
  assert(listOrders.boundaries.doesNotWriteDatabase === true, "ListOrders writes no database");

  const listOrdersNext = buildAmazonSpApiOrdersListOrdersSignedRequest({
    ...base,
    createdAfter: "2026-05-01T00:00:00Z",
    nextToken: "NEXT_TOKEN_SECRET_STEP140_N",
  });

  assert(listOrdersNext.canonicalQueryString.includes("NextToken=[REDACTED]"), "returned canonical query redacts NextToken");
  assert(listOrdersNext.signedUrl.includes("NextToken=[REDACTED]"), "signedUrl redacts NextToken");
  assert(listOrdersNext.sanitized.nextTokenRedacted === true, "nextToken redaction flag is true");
  assert(!JSON.stringify(listOrdersNext).includes("NEXT_TOKEN_SECRET_STEP140_N"), "ListOrders next-token envelope does not expose raw NextToken");

  const orderItems = buildAmazonSpApiOrdersGetOrderItemsSignedRequest({
    ...base,
    amazonOrderId: "ORDER-STEP140-N-001",
  });

  assert(orderItems.operation === "GetOrderItems", "GetOrderItems operation marker is stable");
  assert(orderItems.path === "/orders/v0/orders/ORDER-STEP140-N-001/orderItems", "GetOrderItems path is stable");
  assert(orderItems.method === "GET", "GetOrderItems method is GET");
  assert(orderItems.headers.authorization.includes("Signature=[REDACTED]"), "GetOrderItems authorization signature is redacted");
  assert(orderItems.boundaries.doesNotExecuteNetwork === true, "GetOrderItems does not execute network");
  assert(orderItems.boundaries.doesNotWriteInventory === true, "GetOrderItems writes no inventory");

  assertRejects(
    () => buildAmazonSpApiOrdersListOrdersSignedRequest({
      ...base,
      env: {},
      createdAfter: "2026-05-01T00:00:00Z",
    }),
    "STEP140_M_ORDERS_REAL_HTTP_BLOCKED",
    "feature flag disabled blocks signed request builder",
  );

  assertRejects(
    () => buildAmazonSpApiOrdersGetOrderItemsSignedRequest({
      ...base,
      amazonOrderId: "",
    }),
    "amazonOrderId is required",
    "missing amazonOrderId is rejected",
  );

  console.log("[SMOKE_OK] Step140-N Amazon SP-API Orders signed request builder no-network smoke passed");
  console.log(JSON.stringify({ ok: true, step: "Step140-N", listOrders, orderItems }, null, 2));
}

main();
