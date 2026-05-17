#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ts = require("typescript");

const root = "/opt/ledgerseiri";
const web = path.join(root, "apps/web");
const api = path.join(root, "apps/api");

const panelPath = path.join(web, "src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx");
const apiHelperPath = path.join(web, "src/core/imports/api.ts");
const packagePath = path.join(web, "package.json");
const backendControllerPath = path.join(api, "src/imports/imports.controller.ts");

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`[OK] ${message}`);
}

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`);
  return fs.readFileSync(file, "utf8");
}

function loadApiExportsWithMockedFetch(mockFetch) {
  const source = read(apiHelperPath);
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
      throw new Error(`Unexpected require in api helper runtime smoke: ${name}`);
    },
    fetch: mockFetch,
    console,
    URLSearchParams,
    setTimeout,
    clearTimeout,
  };

  sandbox.module.exports = sandbox.exports;
  vm.runInNewContext(output, sandbox, {
    filename: "api.ts.transpiled.js",
  });

  return sandbox.module.exports;
}

async function main() {
  console.log("========== Step149-O smoke: frontend disabled plan preview runtime ==========");

  const pkg = JSON.parse(read(packagePath));
  const panel = read(panelPath);
  const apiHelper = read(apiHelperPath);
  const backendController = read(backendControllerPath);

  assert(
    pkg.scripts["smoke:step149-o-amazon-orders-historical-sync-disabled-plan-preview-runtime"] ===
      "node scripts/smoke-step149-o-amazon-orders-historical-sync-disabled-plan-preview-runtime.js",
    "package.json registers Step149-O runtime smoke",
  );

  [
    "AmazonSpApiOrdersHistoricalSyncPlanPreviewRequest",
    "AmazonSpApiOrdersHistoricalSyncPlanPreviewResponse",
    "AmazonSpApiOrdersHistoricalSyncPlanPreviewSegment",
    "AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_PLAN_PREVIEW_ENDPOINT",
    "previewAmazonSpApiOrdersHistoricalSyncPlan",
    "/api/imports/amazon-sp-api/orders/historical-sync/plan-preview",
  ].forEach((needle) => {
    assert(apiHelper.includes(needle), `api helper marker exists: ${needle}`);
  });

  [
    "previewHistoricalSyncPlan",
    "previewAmazonSpApiOrdersHistoricalSyncPlan",
    "amazon-sp-api-historical-sync-plan-preview-card",
    "amazon-sp-api-historical-sync-plan-preview-button",
    "amazon-sp-api-historical-sync-plan-preview-range",
    "amazon-sp-api-historical-sync-plan-preview-status",
    "amazon-sp-api-historical-sync-plan-preview-execution",
    "amazon-sp-api-historical-sync-plan-preview-db-write",
    "amazon-sp-api-historical-sync-plan-preview-message",
    "amazon-sp-api-historical-sync-plan-preview-summary",
    "amazon-sp-api-historical-sync-plan-preview-segment-count",
    "amazon-sp-api-historical-sync-plan-preview-segment-list",
    "amazon-sp-api-historical-sync-plan-preview-segment-row",
    "disabled / preview-only",
    "同期実行・SyncJob作成・Amazon API取得・DB書き込みは行いません",
    "syncStartDate: orderPullWindow.startDate",
    "syncEndDate: orderPullWindow.endDate",
  ].forEach((needle) => {
    assert(panel.includes(needle), `panel marker exists: ${needle}`);
  });

  [
    "runHistoricalSync",
    "runSegment",
    "createSyncJob",
    "createSyncSegment",
    "commitAmazonSpApiOrdersHistoricalSync",
    "executeHistoricalSync",
    "new Queue",
    "@Processor",
    "setInterval(",
  ].forEach((forbidden) => {
    assert(!panel.includes(forbidden), `panel does not contain runtime marker: ${forbidden}`);
  });

  assert(
    backendController.includes("amazonSpApiOrdersHistoricalSyncDisabledPlanPreviewControllerRoute"),
    "Step149-M backend route exists",
  );

  const fetchCalls = [];
  const mockResponse = {
    source: "amazon-sp-api-orders-historical-sync-disabled-plan-preview",
    routeImplementedNow: true,
    controllerRoute: "POST /api/imports/amazon-sp-api/orders/historical-sync/plan-preview",
    guardedBy: "JwtAuthGuard",
    companyScoped: true,
    companyIdPresent: true,
    storeId: "cmn4jghll0005o901075vk5w4",
    marketplaceId: "A1VC38T7YXB528",
    region: "JP",
    syncStartDate: "2026-01-01",
    syncEndDate: "2026-01-31",
    segmentDays: 7,
    accepted: false,
    disabled: true,
    plan: {
      accepted: false,
      disabled: true,
      reason: "STEP149_J_WORKER_DISABLED_BY_DEFAULT",
      executionMode: "worker_disabled",
      planningMode: "planner_integrated_but_runtime_disabled",
      wouldCreateSyncJob: false,
      wouldCreateSegments: false,
      wouldCallAmazon: false,
      wouldWriteDatabase: false,
      normalizedRange: {
        syncStartDateIso: "2026-01-01T00:00:00.000Z",
        syncEndDateIso: "2026-01-31T23:59:59.999Z",
        segmentDays: 7,
        maxSegmentDays: 31,
        totalDaysInclusive: 31,
      },
      paginationPolicy: {
        maxPagesPerSegment: 50,
        startsWithNextToken: null,
        nextTokenRequiredForFollowupPage: true,
        stopWhenNextTokenMissing: true,
        stopWhenPageLimitReached: true,
      },
      plannedSegments: [
        {
          segmentIndex: 0,
          createdAfter: "2026-01-01T00:00:00.000Z",
          createdBefore: "2026-01-07T23:59:59.999Z",
          segmentDaysInclusive: 7,
        },
        {
          segmentIndex: 1,
          createdAfter: "2026-01-08T00:00:00.000Z",
          createdBefore: "2026-01-14T23:59:59.999Z",
          segmentDaysInclusive: 7,
        },
      ],
    },
    boundaries: {
      callsDisabledWorkerPlan: true,
      callsRunHistoricalSync: false,
      callsRunSegment: false,
      callsAmazon: false,
      writesDatabase: false,
      writesSyncJob: false,
      writesSyncSegment: false,
      writesImportJob: false,
      writesImportStagingRow: false,
      writesTransaction: false,
      writesInventoryMovement: false,
      startsScheduler: false,
      startsQueue: false,
      frontendWiredNow: false,
    },
  };

  const mockFetch = async (url, init = {}) => {
    fetchCalls.push({ url, init });
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockResponse),
    };
  };

  const apiExports = loadApiExportsWithMockedFetch(mockFetch);

  assert(
    typeof apiExports.previewAmazonSpApiOrdersHistoricalSyncPlan === "function",
    "runtime export previewAmazonSpApiOrdersHistoricalSyncPlan exists",
  );

  const result = await apiExports.previewAmazonSpApiOrdersHistoricalSyncPlan({
    storeId: "cmn4jghll0005o901075vk5w4",
    marketplaceId: "A1VC38T7YXB528",
    region: "JP",
    syncStartDate: "2026-01-01",
    syncEndDate: "2026-01-31",
    segmentDays: 7,
  });

  assert(fetchCalls.length === 1, "runtime helper makes exactly one fetch call");
  assert(
    fetchCalls[0].url === "/api/imports/amazon-sp-api/orders/historical-sync/plan-preview",
    "runtime helper calls Step149-M plan-preview endpoint",
  );

  const init = fetchCalls[0].init;
  assert(init.method === "POST", "runtime helper uses POST");
  assert(init.credentials === "include", "runtime helper includes credentials");
  assert(init.cache === "no-store", "runtime helper disables cache");
  assert(init.headers && init.headers["Content-Type"] === "application/json", "runtime helper sends JSON content type");

  const body = JSON.parse(init.body);
  assert(body.storeId === "cmn4jghll0005o901075vk5w4", "runtime request body includes storeId");
  assert(body.marketplaceId === "A1VC38T7YXB528", "runtime request body includes marketplaceId");
  assert(body.region === "JP", "runtime request body includes region");
  assert(body.syncStartDate === "2026-01-01", "runtime request body includes syncStartDate");
  assert(body.syncEndDate === "2026-01-31", "runtime request body includes syncEndDate");
  assert(body.segmentDays === 7, "runtime request body includes segmentDays");

  assert(result.accepted === false, "runtime response remains accepted=false");
  assert(result.disabled === true, "runtime response remains disabled=true");
  assert(result.plan.planningMode === "planner_integrated_but_runtime_disabled", "runtime response planningMode is disabled planner");
  assert(result.plan.wouldCreateSyncJob === false, "runtime response wouldCreateSyncJob=false");
  assert(result.plan.wouldCreateSegments === false, "runtime response wouldCreateSegments=false");
  assert(result.plan.wouldCallAmazon === false, "runtime response wouldCallAmazon=false");
  assert(result.plan.wouldWriteDatabase === false, "runtime response wouldWriteDatabase=false");
  assert(result.plan.plannedSegments.length === 2, "runtime response includes planned segments");
  assert(result.boundaries.callsRunHistoricalSync === false, "runtime boundary callsRunHistoricalSync=false");
  assert(result.boundaries.callsRunSegment === false, "runtime boundary callsRunSegment=false");
  assert(result.boundaries.callsAmazon === false, "runtime boundary callsAmazon=false");
  assert(result.boundaries.writesDatabase === false, "runtime boundary writesDatabase=false");
  assert(result.boundaries.writesSyncJob === false, "runtime boundary writesSyncJob=false");
  assert(result.boundaries.writesSyncSegment === false, "runtime boundary writesSyncSegment=false");

  const forbiddenEndpointCalls = [
    "/api/imports/amazon-sp-api/orders/real-preview",
    "/api/imports/amazon-sp-api/orders/real-importjob",
    "/api/imports/amazon-sp-api/orders/historical-sync/run",
    "/api/imports/amazon-sp-api/orders/historical-sync/execute",
    "/api/imports/amazon-sp-api/orders/historical-sync/commit",
  ];

  for (const forbidden of forbiddenEndpointCalls) {
    assert(
      !fetchCalls.some((call) => String(call.url).includes(forbidden)),
      `runtime smoke did not call forbidden endpoint: ${forbidden}`,
    );
  }

  console.log("[SMOKE_OK] Step149-O frontend disabled plan preview runtime smoke passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
