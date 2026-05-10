#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOrdersHttpResultSafe,
  createAmazonSpApiOrdersMockTransport,
  executeAmazonSpApiOrdersGetOrderItemsHttp,
  executeAmazonSpApiOrdersListOrdersHttp,
} = require("../dist/src/imports/amazon-sp-api-orders-http.client");

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`[OK] ${message}`);
}

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`);
  return fs.readFileSync(file, "utf8");
}

async function assertRejects(fn, expectedText, message) {
  let rejected = false;
  try {
    await fn();
  } catch (err) {
    rejected = String(err && err.message ? err.message : err).includes(expectedText);
  }
  assert(rejected, message);
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");

  console.log("========== Step140-O Amazon SP-API Orders guarded HTTP client no DB write smoke ==========");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-guarded-http-client-no-db-write"] ===
      "node scripts/smoke-amazon-sp-api-orders-guarded-http-client-no-db-write.js",
    "apps/api package.json registers Step140-O smoke",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-signed-request-builder-no-network"],
    "Step140-N signed request builder smoke remains registered",
  );

  const clientSource = read(path.resolve(apiRoot, "src/imports/amazon-sp-api-orders-http.client.ts"));

  const requiredMarkers = [
    "executeAmazonSpApiOrdersListOrdersHttp",
    "executeAmazonSpApiOrdersGetOrderItemsHttp",
    "executeAmazonSpApiOrdersSignedHttpEnvelope",
    "createAmazonSpApiOrdersMockTransport",
    "assertAmazonSpApiOrdersHttpResultSafe",
    "STEP140_O_TRANSPORT_REQUIRED",
    "usesInjectedTransportOnly: true",
    "defaultRealNetworkDisabled: true",
    "doesNotWriteImportJob: true",
    "doesNotWriteImportStagingRow: true",
    "doesNotWriteTransaction: true",
    "doesNotWriteInventory: true",
    "AMAZON_SP_API_ORDERS_THROTTLED",
  ];

  for (const marker of requiredMarkers) {
    assert(clientSource.includes(marker), `Step140-O client marker exists: ${marker}`);
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
    "refreshToken:",
    "clientSecret:",
  ];

  for (const marker of forbiddenMarkers) {
    assert(!clientSource.includes(marker), `Step140-O client does not contain forbidden marker: ${marker}`);
  }

  const base = {
    companyId: "step140-o-company",
    storeId: "step140-o-store",
    marketplaceId: "A1VC38T7YXB528",
    region: "JP",
    accessToken: "AT_SECRET_STEP140_O",
    credentials: {
      accessKeyId: "AKIASTEP140O",
      secretAccessKey: "AWS_SECRET_STEP140_O",
      sessionToken: "SESSION_SECRET_STEP140_O",
    },
    now: new Date("2026-05-10T12:30:00Z"),
    env: {
      AMAZON_SP_API_ORDERS_REAL_HTTP_ENABLED: "true",
    },
  };

  await assertRejects(
    () => executeAmazonSpApiOrdersListOrdersHttp({
      ...base,
      createdAfter: "2026-05-01T00:00:00Z",
      createdBefore: "2026-05-02T00:00:00Z",
    }),
    "STEP140_O_TRANSPORT_REQUIRED",
    "missing injected transport is rejected",
  );

  const successTransport = createAmazonSpApiOrdersMockTransport({
    status: 200,
    headers: {
      "x-amzn-requestid": "STEP140-O-REQ-1",
      "x-amzn-ratelimit-limit": "0.0167",
      "x-amz-access-token": "SHOULD_REDACT",
    },
    bodyText: JSON.stringify({
      payload: {
        Orders: [
          {
            AmazonOrderId: "ORDER-STEP140-O-001",
            PurchaseDate: "2026-05-01T00:00:00Z",
            OrderStatus: "Shipped",
          },
        ],
      },
    }),
  });

  const listOrdersResult = await executeAmazonSpApiOrdersListOrdersHttp(
    {
      ...base,
      createdAfter: "2026-05-01T00:00:00Z",
      createdBefore: "2026-05-02T00:00:00Z",
      orderStatuses: ["Shipped"],
      maxResultsPerPage: 50,
    },
    {
      transport: successTransport,
      timeoutMs: 5_000,
    },
  );

  assert(listOrdersResult.step === "Step140-O", "ListOrders HTTP result step is Step140-O");
  assert(listOrdersResult.operation === "ListOrders", "ListOrders HTTP result operation is stable");
  assert(listOrdersResult.ok === true, "ListOrders HTTP result is ok");
  assert(listOrdersResult.status === 200, "ListOrders HTTP result status is 200");
  assert(listOrdersResult.throttled === false, "ListOrders HTTP result is not throttled");
  assert(listOrdersResult.retryable === false, "ListOrders HTTP result is not retryable");
  assert(listOrdersResult.sanitizedRequest.headers["x-amz-access-token"] === "[REDACTED]", "request access token remains redacted");
  assert(listOrdersResult.sanitizedRequest.headers.authorization === "[REDACTED]", "request authorization remains redacted");
  assert(listOrdersResult.sanitizedResponse.headers["x-amz-access-token"] === "[REDACTED]", "response token-like header is redacted");
  assert(listOrdersResult.boundaries.guardedByStep140M === true, "result is marked guarded by Step140-M");
  assert(listOrdersResult.boundaries.signedByStep140N === true, "result is marked signed by Step140-N");
  assert(listOrdersResult.boundaries.usesInjectedTransportOnly === true, "result uses injected transport only");
  assert(listOrdersResult.boundaries.defaultRealNetworkDisabled === true, "default real network is disabled");
  assert(listOrdersResult.boundaries.doesNotWriteDatabase === true, "result writes no database");
  assert(listOrdersResult.boundaries.doesNotWriteTransaction === true, "result writes no transaction");
  assert(listOrdersResult.boundaries.doesNotWriteInventory === true, "result writes no inventory");
  assert(!JSON.stringify(listOrdersResult).includes("AT_SECRET_STEP140_O"), "ListOrders result does not expose access token");
  assert(!JSON.stringify(listOrdersResult).includes("AWS_SECRET_STEP140_O"), "ListOrders result does not expose AWS secret");
  assert(!JSON.stringify(listOrdersResult).includes("SESSION_SECRET_STEP140_O"), "ListOrders result does not expose session token");

  assertAmazonSpApiOrdersHttpResultSafe(listOrdersResult);

  const throttledTransport = createAmazonSpApiOrdersMockTransport({
    status: 429,
    headers: {
      "x-amzn-requestid": "STEP140-O-REQ-429",
    },
    bodyText: JSON.stringify({
      errors: [
        {
          code: "QuotaExceeded",
          message: "Rate exceeded",
        },
      ],
    }),
  });

  const throttledResult = await executeAmazonSpApiOrdersGetOrderItemsHttp(
    {
      ...base,
      amazonOrderId: "ORDER-STEP140-O-001",
    },
    {
      transport: throttledTransport,
    },
  );

  assert(throttledResult.operation === "GetOrderItems", "GetOrderItems HTTP result operation is stable");
  assert(throttledResult.ok === false, "429 result is not ok");
  assert(throttledResult.status === 429, "429 result status is stable");
  assert(throttledResult.throttled === true, "429 result is marked throttled");
  assert(throttledResult.retryable === true, "429 result is retryable");
  assert(throttledResult.error && throttledResult.error.code === "AMAZON_SP_API_ORDERS_THROTTLED", "429 result has throttled error code");
  assertAmazonSpApiOrdersHttpResultSafe(throttledResult);

  const serverErrorTransport = createAmazonSpApiOrdersMockTransport({
    status: 503,
    bodyText: "service unavailable",
  });

  const serverErrorResult = await executeAmazonSpApiOrdersListOrdersHttp(
    {
      ...base,
      createdAfter: "2026-05-01T00:00:00Z",
    },
    {
      transport: serverErrorTransport,
    },
  );

  assert(serverErrorResult.ok === false, "503 result is not ok");
  assert(serverErrorResult.retryable === true, "503 result is retryable");
  assert(serverErrorResult.sanitizedResponse.json === null, "non-json body parses to null json");
  assert(serverErrorResult.sanitizedResponse.bodyTextPreview === "service unavailable", "body preview preserves sanitized text");
  assertAmazonSpApiOrdersHttpResultSafe(serverErrorResult);

  console.log("[SMOKE_OK] Step140-O Amazon SP-API Orders guarded HTTP client no DB write smoke passed");
  console.log(JSON.stringify({ ok: true, step: "Step140-O", listOrdersResult, throttledResult, serverErrorResult }, null, 2));
}

main().catch((err) => {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
});
