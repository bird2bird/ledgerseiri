#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const previewPath = path.join(root, "src/imports/amazon-sp-api-orders-real-preview.service.ts");
const controllerPath = path.join(root, "src/imports/imports.controller.ts");

const preview = fs.readFileSync(previewPath, "utf8");
const controller = fs.readFileSync(controllerPath, "utf8");

const previewMarkers = [
  "export class AmazonSpApiOrdersRealPreviewHttpError extends Error",
  "AMAZON_SP_API_ORDERS_REAL_PREVIEW_HTTP_FAILED",
  "toResponseBody()",
  "writesImportJob: false",
  "writesImportStagingRow: false",
  "writesTransaction: false",
  "writesInventoryMovement: false",
  "if (!listOrdersHttp.ok)",
  "throw new AmazonSpApiOrdersRealPreviewHttpError",
  "amazonStatus: String(listOrdersHttp.error?.code || listOrdersHttp.status)",
  "httpStatus: typeof listOrdersHttp.status === 'number' ? listOrdersHttp.status : null",
  "sanitizedResponse: listOrdersHttp.sanitizedResponse",
  "createdAfter: input.createdAfter",
  "createdBefore: createdBeforeSafetyWindow.createdBefore",
];

for (const marker of previewMarkers) {
  if (!preview.includes(marker)) {
    throw new Error(`[FAIL] preview service missing marker: ${marker}`);
  }
}

const controllerMarkers = [
  "AmazonSpApiOrdersRealPreviewHttpError",
  "BadRequestException",
  "error instanceof AmazonSpApiOrdersRealPreviewHttpError",
  "throw new BadRequestException(error.toResponseBody())",
];

for (const marker of controllerMarkers) {
  if (!controller.includes(marker)) {
    throw new Error(`[FAIL] controller missing marker: ${marker}`);
  }
}

if (/amazonStatus:\s*listOrdersHttp\.error\?\.code\s*\|\|\s*listOrdersHttp\.status/.test(preview)) {
  throw new Error("[FAIL] amazonStatus must be string-normalized");
}

if (/sanitizedResponse\?\.httpStatus/.test(preview)) {
  throw new Error("[FAIL] sanitizedResponse.httpStatus does not exist in current type shape");
}

if (/STEP140_P_LIST_ORDERS_HTTP_FAILED:\s*\$\{listOrdersHttp\.error\?\.code\s*\|\|\s*listOrdersHttp\.status\}/.test(preview)) {
  throw new Error("[FAIL] generic !listOrdersHttp.ok throw still exists");
}

console.log("[OK] Step P2-A/P2-B real-preview Amazon error detail static smoke passed");
console.log("[OK] Sanitized error reports clamped CreatedBefore");
