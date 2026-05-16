#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const builderPath = path.join(root, "src/imports/amazon-sp-api-orders-signed-request.builder.ts");
const httpPath = path.join(root, "src/imports/amazon-sp-api-orders-http.client.ts");
const previewPath = path.join(root, "src/imports/amazon-sp-api-orders-real-preview.service.ts");

const builder = fs.readFileSync(builderPath, "utf8");
const http = fs.readFileSync(httpPath, "utf8");
const preview = fs.readFileSync(previewPath, "utf8");

const builderRequired = [
  "httpSignedUrl: string;",
  "httpSignedUrl: signedUrl,",
  "signedUrl: redactNextTokenInUrl(signedUrl),",
  "canonicalQueryString: redactNextTokenInUrl(canonicalQueryString)",
  "redactNextTokenInUrl",
  "NextToken: input.nextToken",
];

for (const marker of builderRequired) {
  if (!builder.includes(marker)) {
    throw new Error(`[FAIL] builder missing marker: ${marker}`);
  }
}

if (!http.includes("signedUrl: envelope.httpSignedUrl") && !http.includes(".httpSignedUrl")) {
  throw new Error("[FAIL] HTTP client must pass raw envelope.httpSignedUrl into transport request");
}

if (http.includes("request.httpSignedUrl")) {
  throw new Error("[FAIL] HTTP transport request must not use request.httpSignedUrl; keep request.signedUrl type stable");
}

if (http.includes("redactSensitiveUrlParts(request.httpSignedUrl)")) {
  throw new Error("[FAIL] logging must redact request.signedUrl, not request.httpSignedUrl");
}

if (http.includes("signedUrl: envelope.signedUrl")) {
  throw new Error("[FAIL] transport request must not receive redacted envelope.signedUrl");
}

if (!http.includes("redactSensitiveUrlParts(request.signedUrl)")) {
  throw new Error("[FAIL] HTTP logs must redact request.signedUrl");
}

const previewRequired = [
  "nextToken: listOrdersNextToken",
  "while (listOrdersNextToken && listOrdersPageCount < AMAZON_SP_API_ORDERS_LIST_ORDERS_MAX_PAGES)",
  "writesImportJob: false",
  "writesImportStagingRow: false",
  "writesTransaction: false",
  "writesInventoryMovement: false",
];

for (const marker of previewRequired) {
  if (!preview.includes(marker)) {
    throw new Error(`[FAIL] preview missing pagination/no-write marker: ${marker}`);
  }
}

console.log("[OK] Step P3-Z5-FIX4 transport URL boundary smoke passed");
console.log("[OK] envelope.httpSignedUrl is used for network transport while request.signedUrl remains the transport field and is redacted in logs");
