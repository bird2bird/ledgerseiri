import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const root = "/opt/ledgerseiri";
const api = path.join(root, "apps/api");
const controllerPath = path.join(api, "src/imports/imports.controller.ts");
const dtoPath = path.join(api, "src/imports/dto/amazon-sp-api-orders-guarded-import-preflight-contract.dto.ts");
const packagePath = path.join(api, "package.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function loadDtoExports() {
  const source = read(dtoPath);
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      skipLibCheck: true,
    },
    fileName: "amazon-sp-api-orders-guarded-import-preflight-contract.dto.ts",
  }).outputText;

  const sandbox = {
    exports: {},
    module: { exports: {} },
    require: (name) => {
      throw new Error(`Unexpected require in Step151-C DTO smoke: ${name}`);
    },
    console,
  };
  sandbox.module.exports = sandbox.exports;
  vm.runInNewContext(output, sandbox, { filename: "step151-c-dto.cjs" });
  return sandbox.module.exports;
}

console.log("========== Step151-C smoke: backend guarded import preflight contract ==========");

const controller = read(controllerPath);
const dto = read(dtoPath);
const pkg = JSON.parse(read(packagePath));

[
  "AmazonSpApiOrdersGuardedImportPreflightRouteBody",
  "AmazonSpApiOrdersGuardedImportPreflightResponse",
  "AmazonSpApiOrdersGuardedImportPreflightBlockReason",
  "buildAmazonSpApiOrdersGuardedImportPreflightResponse",
  "assertAmazonSpApiOrdersGuardedImportPreflightNoExecutionBoundaries",
  "callsAmazon: false",
  "callsRealPreview: false",
  "callsRealImportJob: false",
  "callsHistoricalSync: false",
  "createsImportJob: false",
  "createsImportStagingRow: false",
  "createsSyncJob: false",
  "createsSyncSegment: false",
  "writesDatabase: false",
  "writesTransaction: false",
  "writesInventoryMovement: false",
  "returnsRawAccessToken: false",
  "returnsRawRefreshToken: false",
  "returnsRawSecret: false",
  "EXPLICIT_OPERATOR_INTENT_REQUIRED",
].forEach((needle) => {
  assert(dto.includes(needle), `DTO contains marker: ${needle}`);
});

[
  "amazonSpApiOrdersGuardedImportPreflightControllerRoute",
  "@Post('amazon-sp-api/orders/guarded-import/preflight')",
  "@UseGuards(JwtAuthGuard)",
  "readConnectionStatus",
  "mapAmazonSpApiConnectionStatusForEndpoint",
  "buildAmazonSpApiOrdersGuardedImportPreflightResponse",
  "assertAmazonSpApiOrdersGuardedImportPreflightNoExecutionBoundaries",
  "STEP151_C_GUARDED_IMPORT_PREFLIGHT_COMPANY_REQUIRED",
].forEach((needle) => {
  assert(controller.includes(needle), `controller contains marker: ${needle}`);
});

const blockStart = controller.indexOf("  // Step151-C: Amazon Orders guarded import execution preflight contract.");
const blockEnd = controller.indexOf("\n\n  // Step149-C: Amazon Orders historical/background sync controller-disabled route shell.", blockStart);
assert(blockStart >= 0 && blockEnd > blockStart, "Step151-C controller block found");
const block = controller.slice(blockStart, blockEnd);

[
  "previewAmazonSpApiOrdersRealNoPersistence",
  "persistAmazonSpApiOrdersRealPreviewToImportJobAndStagingRows",
  "previewAmazonSpApiOrdersHistoricalSyncPlan",
  "createAmazonSpApiOrdersHistoricalSyncWorkerDisabled(",
  "planHistoricalSync(",
  "runHistoricalSync",
  "buildAmazonSpApiOrdersServerOnlyRawSignedTransport",
  "refreshAmazonSpApiOrdersAccessTokenCache",
  ".create(",
  ".update(",
  ".delete(",
  ".upsert(",
  "transaction.create",
  "inventoryMovement.create",
].forEach((forbidden) => {
  assert(!block.includes(forbidden), `Step151-C controller block has no forbidden marker: ${forbidden}`);
});

const dtoExports = loadDtoExports();
const response = dtoExports.buildAmazonSpApiOrdersGuardedImportPreflightResponse({
  storeId: "store-1",
  marketplaceId: "A1VC38T7YXB528",
  region: "JP",
  createdAfter: "2026-05-01T00:00:00.000Z",
  createdBefore: "2026-05-07T00:00:00.000Z",
  rangePreset: "7D",
  explicitOperatorIntent: true,
  connection: {
    connected: true,
    needsReconnect: false,
    credentialPresent: true,
    accessTokenCachePresent: true,
    accessTokenExpired: false,
    status: "CONNECTED",
    readModelStatus: "connected",
  },
  reasons: [],
});

assert(response.allowed === true, "preflight allows ready input");
assert(response.blocked === false, "ready input not blocked");
assert(response.nextAction === "READY_FOR_PREVIEW", "ready input nextAction");
assert(response.boundaries.callsAmazon === false, "callsAmazon false");
assert(response.boundaries.callsRealPreview === false, "callsRealPreview false");
assert(response.boundaries.callsRealImportJob === false, "callsRealImportJob false");
assert(response.boundaries.createsImportJob === false, "createsImportJob false");
assert(response.boundaries.writesDatabase === false, "writesDatabase false");
assert(response.confirmation.requiredForImportJobCreation === true, "confirmation required");
assert(response.dateRange.days === 6, "date range day calculation");

dtoExports.assertAmazonSpApiOrdersGuardedImportPreflightNoExecutionBoundaries(response);

const blocked = dtoExports.buildAmazonSpApiOrdersGuardedImportPreflightResponse({
  storeId: "",
  marketplaceId: "",
  region: "",
  createdAfter: null,
  createdBefore: null,
  rangePreset: null,
  explicitOperatorIntent: false,
  connection: {
    connected: false,
    needsReconnect: true,
    credentialPresent: false,
    accessTokenCachePresent: false,
    accessTokenExpired: false,
    status: "NOT_CONNECTED",
    readModelStatus: "disconnected",
  },
  reasons: ["STORE_ID_REQUIRED", "MARKETPLACE_ID_REQUIRED", "REGION_REQUIRED", "DATE_RANGE_REQUIRED", "CONNECTION_NOT_CONNECTED"],
});

assert(blocked.allowed === false, "blocked input not allowed");
assert(blocked.blocked === true, "blocked input blocked");
assert(blocked.reasons.includes("EXPLICIT_OPERATOR_INTENT_REQUIRED"), "explicit operator intent required");
assert(blocked.nextAction === "CONNECT_AMAZON", "connection block prioritized");

assert(
  pkg.scripts["smoke:step151-c-amazon-orders-guarded-import-preflight-contract"] ===
    "node scripts/smoke-step151-c-amazon-orders-guarded-import-preflight-contract.js",
  "package.json registers Step151-C smoke",
);

console.log("[SMOKE_OK] Step151-C guarded import preflight contract smoke passed");
