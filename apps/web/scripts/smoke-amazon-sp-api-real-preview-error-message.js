#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const apiPath = path.join(root, "src/core/imports/api.ts");
const source = fs.readFileSync(apiPath, "utf8");

const required = [
  "function formatImportApiErrorBodyForMessage",
  "amazonStatus",
  "httpStatus",
  "requestSummary",
  "sanitizedResponse",
  "formatImportApiErrorBodyForMessage(parsed)",
  "throw new Error(details ? `${label} failed: ${res.status} | ${details}` : `${label} failed: ${res.status}`)",
  "return parsed as T",
  "real-preview",
];

for (const marker of required) {
  if (!source.includes(marker)) {
    throw new Error(`[FAIL] missing marker: ${marker}`);
  }
}

if (!/async function readJson<T>\(res: Response, label: string\): Promise<T>/.test(source)) {
  throw new Error("[FAIL] readJson signature changed unexpectedly");
}

console.log("[OK] Step P2-A2-FIX1 real-preview error message static smoke passed");
console.log("[OK] readJson now includes sanitized backend error body in existing Error.message");
