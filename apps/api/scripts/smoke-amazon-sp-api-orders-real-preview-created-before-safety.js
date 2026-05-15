#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const previewPath = path.join(root, "src/imports/amazon-sp-api-orders-real-preview.service.ts");
const source = fs.readFileSync(previewPath, "utf8");

const required = [
  "AMAZON_SP_API_ORDERS_CREATED_BEFORE_SAFETY_MINUTES = 3",
  "function resolveAmazonOrdersCreatedBeforeSafetyWindow",
  "const createdBeforeSafetyWindow = resolveAmazonOrdersCreatedBeforeSafetyWindow",
  "const effectiveNow = input.now ?? new Date();",
  "createdBefore: input.createdBefore",
  "createdBefore: createdBeforeSafetyWindow.createdBefore",
  "safetyCutoff",
  "adjusted: true",
];

for (const marker of required) {
  if (!source.includes(marker)) {
    throw new Error(`[FAIL] missing marker: ${marker}`);
  }
}

function extractObjectAssignedToConst(src, constName) {
  const constIndex = src.indexOf(`const ${constName}`);
  if (constIndex < 0) throw new Error(`[FAIL] const ${constName} not found`);

  const eqIndex = src.indexOf("=", constIndex);
  if (eqIndex < 0) throw new Error(`[FAIL] assignment for ${constName} not found`);

  const braceStart = src.indexOf("{", eqIndex);
  if (braceStart < 0) throw new Error(`[FAIL] opening brace for ${constName} not found`);

  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;

  for (let i = braceStart; i < src.length; i += 1) {
    const ch = src[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === quote) {
        inString = false;
        quote = "";
      }
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      inString = true;
      quote = ch;
      continue;
    }

    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return src.slice(constIndex, i + 1);
    }
  }

  throw new Error(`[FAIL] closing brace for ${constName} not found`);
}

const listOrdersInputSlice = extractObjectAssignedToConst(source, "listOrdersInput");

if (listOrdersInputSlice.includes("createdBefore: input.createdBefore")) {
  throw new Error("[FAIL] listOrdersInput must not send raw input.createdBefore");
}

if (!listOrdersInputSlice.includes("createdBefore: createdBeforeSafetyWindow.createdBefore")) {
  throw new Error("[FAIL] listOrdersInput must send createdBeforeSafetyWindow.createdBefore");
}

if (listOrdersInputSlice.includes("const createdBeforeSafetyWindow")) {
  throw new Error("[FAIL] createdBeforeSafetyWindow declaration must not be inside listOrdersInput");
}

const safetyCallIndex = source.indexOf("const createdBeforeSafetyWindow = resolveAmazonOrdersCreatedBeforeSafetyWindow");
const listInputIndex = source.indexOf("const listOrdersInput");

if (safetyCallIndex < 0 || listInputIndex < 0 || safetyCallIndex > listInputIndex) {
  throw new Error("[FAIL] createdBeforeSafetyWindow must be resolved before listOrdersInput");
}

const safetyCallSlice = source.slice(safetyCallIndex, listInputIndex);
if (!safetyCallSlice.includes("createdBefore: input.createdBefore")) {
  throw new Error("[FAIL] safety helper input must use raw input.createdBefore");
}
if (safetyCallSlice.includes("createdBefore: createdBeforeSafetyWindow.createdBefore")) {
  throw new Error("[FAIL] safety helper input must not self-reference createdBeforeSafetyWindow");
}

if (!safetyCallSlice.includes("now: effectiveNow")) {
  throw new Error("[FAIL] safety helper must receive effectiveNow, not optional input.now");
}
if (safetyCallSlice.includes("now: input.now")) {
  throw new Error("[FAIL] safety helper must not receive optional input.now directly");
}

const errorThrowIndex = source.indexOf("throw new AmazonSpApiOrdersRealPreviewHttpError");
if (errorThrowIndex < 0) {
  throw new Error("[FAIL] AmazonSpApiOrdersRealPreviewHttpError throw not found");
}

const errorThrowSlice = source.slice(errorThrowIndex, errorThrowIndex + 1400);
if (!errorThrowSlice.includes("createdBefore: createdBeforeSafetyWindow.createdBefore")) {
  throw new Error("[FAIL] error requestSummary must use clamped createdBefore");
}

console.log("[OK] Step P2-B CreatedBefore safety window static smoke passed");
console.log("[OK] safety helper receives raw input.createdBefore");
console.log("[OK] ListOrders sends clamped CreatedBefore");
console.log("[OK] requestSummary reports the clamped CreatedBefore");
