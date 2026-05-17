const fs = require("fs");
const path = require("path");

const root = "/opt/ledgerseiri";
const api = path.join(root, "apps/api");
const contractPath = path.join(api, "src/imports/amazon-sp-api-orders-date-range.contract.ts");
const controllerPath = path.join(api, "src/imports/imports.controller.ts");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

console.log("========== Step148-B FIX2 smoke: backend date range real-preview wiring ==========");

const contract = read(contractPath);
const controller = read(controllerPath);

[
  "resolveAmazonSpApiOrdersDateRangeForRequest",
  "explicit-start-end",
  "explicit-created-window",
  "days-fallback",
  "requestedStartDate",
  "requestedEndDate",
  "actualCreatedAfter",
  "actualCreatedBefore",
  "daysFallback",
  "range_too_long",
  "maxDays",
  "defaultDays",
].forEach((needle) => {
  assert(contract.includes(needle), `contract missing: ${needle}`);
});

assert(
  controller.includes("import { resolveAmazonSpApiOrdersDateRangeForRequest } from './amazon-sp-api-orders-date-range.contract';"),
  "controller must import date range resolver"
);

const methodName = "amazonSpApiOrdersRealImportJobCommitControllerRoute";
const nameIndex = controller.indexOf(methodName);
assert(nameIndex >= 0, "real ImportJob route missing");

const bodyStartMarker = "): Promise<AmazonSpApiOrdersRealImportJobCommitRouteResponse> {";
const bodyStartMarkerIndex = controller.indexOf(bodyStartMarker, nameIndex);
assert(bodyStartMarkerIndex >= 0, "real ImportJob route body marker missing");

const bodyOpen = controller.indexOf("{", bodyStartMarkerIndex);
assert(bodyOpen >= 0, "route body open brace missing");

let depth = 0;
let bodyClose = -1;
for (let i = bodyOpen; i < controller.length; i++) {
  const ch = controller[i];
  if (ch === "{") depth++;
  if (ch === "}") {
    depth--;
    if (depth === 0) {
      bodyClose = i;
      break;
    }
  }
}

assert(bodyClose > bodyOpen, "route body close brace missing");

const route = controller.slice(bodyOpen + 1, bodyClose);

[
  "dateRangeRequestBody",
  "resolveAmazonSpApiOrdersDateRangeForRequest",
  "days: dateRangeRequestBody.days",
  "startDate: dateRangeRequestBody.startDate",
  "endDate: dateRangeRequestBody.endDate",
  "createdAfter: dateRangeRequestBody.createdAfter",
  "createdBefore: dateRangeRequestBody.createdBefore",
  "maxDays: 31",
  "defaultDays: 14",
  "throw new BadRequestException(resolvedDateRange.message)",
  "const realPreview = await this.amazonSpApiOrdersRealPreviewControllerRoute",
  "createdAfter: resolvedDateRange.createdAfter",
  "createdBefore: resolvedDateRange.createdBefore",
  "persistAmazonSpApiOrdersRealPreviewToImportJobAndStagingRows",
].forEach((needle) => {
  assert(route.includes(needle), `route missing: ${needle}`);
});

const resolverIndex = route.indexOf("const resolvedDateRange = resolveAmazonSpApiOrdersDateRangeForRequest");
const realPreviewIndex = route.indexOf("const realPreview = await this.amazonSpApiOrdersRealPreviewControllerRoute");
const persistIndex = route.indexOf("const persisted = await persistAmazonSpApiOrdersRealPreviewToImportJobAndStagingRows");

assert(resolverIndex >= 0, "resolver call missing");
assert(realPreviewIndex >= 0, "realPreview call missing");
assert(persistIndex >= 0, "persist call missing");
assert(resolverIndex < realPreviewIndex, "date range must be resolved before real preview");
assert(realPreviewIndex < persistIndex, "real preview must remain before persistence");

[
  "transaction.create(",
  "transaction.createMany(",
  "inventoryMovement.create(",
  "inventoryMovement.createMany(",
].forEach((forbidden) => {
  assert(!route.includes(forbidden), `route must not include ${forbidden}`);
});

console.log("[SMOKE_OK] Step148-B FIX2 backend date range real-preview wiring passed");
