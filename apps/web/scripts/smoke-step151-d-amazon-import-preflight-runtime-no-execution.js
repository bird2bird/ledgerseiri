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
      throw new Error(`Unexpected require in Step151-D runtime smoke: ${name}`);
    },
    fetch: mockFetch,
    console,
    URLSearchParams,
    setTimeout,
    clearTimeout,
  };

  sandbox.module.exports = sandbox.exports;
  vm.runInNewContext(output, sandbox, { filename: "api.ts.step151-d.transpiled.js" });
  return sandbox.module.exports;
}

async function main() {
  console.log("========== Step151-D runtime smoke: preflight helper calls only preflight endpoint ==========");

  const pkg = JSON.parse(read(packagePath));
  const calls = [];

  const responseBody = {
    source: "amazon-sp-api-orders-guarded-import-preflight",
    step: "Step151-C",
    routeImplementedNow: true,
    controllerRoute: "POST /api/imports/amazon-sp-api/orders/guarded-import/preflight",
    guardedBy: "JwtAuthGuard",
    companyScoped: true,
    allowed: true,
    blocked: false,
    reasons: [],
    nextAction: "READY_FOR_PREVIEW",
    scope: {
      companyIdPresent: true,
      storeId: "store-step151-d",
      marketplaceId: "A1VC38T7YXB528",
      region: "JP",
    },
    dateRange: {
      createdAfter: "2026-05-01T00:00:00.000Z",
      createdBefore: "2026-05-07T00:00:00.000Z",
      rangePreset: "7D",
      locked: true,
      days: 6,
      maxAllowedDays: 365,
    },
    connectionReadiness: {
      checked: true,
      connected: true,
      needsReconnect: false,
      credentialPresent: true,
      accessTokenCachePresent: true,
      accessTokenExpired: false,
      status: "CONNECTED",
      readModelStatus: "connected",
    },
    confirmation: {
      explicitOperatorIntent: true,
      requiredForPreview: true,
      requiredForImportJobCreation: true,
    },
    boundaries: {
      callsAmazon: false,
      callsRealPreview: false,
      callsRealImportJob: false,
      callsHistoricalSync: false,
      queriesConnectionStatus: true,
      createsImportJob: false,
      createsImportStagingRow: false,
      createsSyncJob: false,
      createsSyncSegment: false,
      writesDatabase: false,
      writesTransaction: false,
      writesInventoryMovement: false,
      returnsRawAccessToken: false,
      returnsRawRefreshToken: false,
      returnsRawSecret: false,
    },
  };

  const mockFetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify(responseBody),
    };
  };

  const apiExports = loadApiExportsWithMockedFetch(mockFetch);
  assert(typeof apiExports.preflightAmazonSpApiOrdersGuardedImport === "function", "preflight helper exported");

  const result = await apiExports.preflightAmazonSpApiOrdersGuardedImport({
    storeId: "store-step151-d",
    marketplaceId: "A1VC38T7YXB528",
    region: "JP",
    createdAfter: "2026-05-01T00:00:00.000Z",
    createdBefore: "2026-05-07T00:00:00.000Z",
    rangePreset: "7D",
    explicitOperatorIntent: true,
  });

  assert(result.allowed === true, "preflight allowed");
  assert(result.nextAction === "READY_FOR_PREVIEW", "preflight next action");
  assert(result.boundaries.callsAmazon === false, "callsAmazon false");
  assert(result.boundaries.callsRealPreview === false, "callsRealPreview false");
  assert(result.boundaries.callsRealImportJob === false, "callsRealImportJob false");
  assert(result.boundaries.writesDatabase === false, "writesDatabase false");

  assert(calls.length === 1, "exactly one preflight call");
  assert(calls[0].url === "/api/imports/amazon-sp-api/orders/guarded-import/preflight", "preflight endpoint only");
  assert(calls[0].init.method === "POST", "preflight uses POST");
  assert(calls[0].init.credentials === "include", "credentials include");
  assert(calls[0].init.cache === "no-store", "cache no-store");

  const body = JSON.parse(calls[0].init.body);
  assert(body.explicitOperatorIntent === true, "explicit operator intent sent");
  assert(body.rangePreset === "7D", "range preset sent");

  [
    "real-preview",
    "real-importjob",
    "historical-sync",
    "commit",
    "run",
  ].forEach((forbidden) => {
    assert(!calls[0].url.includes(forbidden), `preflight URL has no forbidden fragment: ${forbidden}`);
  });

  assert(
    pkg.scripts["smoke:step151-d-amazon-import-preflight-runtime-no-execution"] ===
      "node scripts/smoke-step151-d-amazon-import-preflight-runtime-no-execution.js",
    "package.json registers Step151-D runtime smoke",
  );

  console.log("[SMOKE_OK] Step151-D preflight runtime no-execution smoke passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
