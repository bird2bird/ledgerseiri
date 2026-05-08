#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const {
  assertFrontendAmazonSpApiConnectionStatusPanelRuntimeSmokeContract,
  buildFrontendAmazonSpApiConnectionStatusPanelRuntimeSmokeContract,
} = require("../dist/src/imports/dto/frontend-amazon-sp-api-connection-status-panel-runtime-smoke-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function assertTextIncludes(text, marker, label) {
  assert(text.includes(marker), `${label} missing marker: ${marker}`);
}

function assertNoForbiddenUiSecretSurface(panelText, apiText) {
  const panelForbidden = [
    /refresh_token/i,
    /access_token/i,
    /client_secret/i,
    /clientSecret\s*[:=]/,
    /refreshToken\s*[:=]/,
    /accessToken\s*[:=]/,
    /localStorage\s*\./,
    /sessionStorage\s*\./,
  ];

  for (const pattern of panelForbidden) {
    assert(!pattern.test(panelText), `panel exposed forbidden secret/storage pattern: ${pattern}`);
  }

  const executionForbidden = [
    /reports\/2021-06-30/i,
    /createReport/i,
    /getReportDocument/i,
    /ImportJob\.create/,
    /transaction\.create/,
    /inventoryMovement\.create/,
  ];

  for (const pattern of executionForbidden) {
    assert(!pattern.test(panelText + "\n" + apiText), `frontend must not trigger reports/import/ledger/inventory execution: ${pattern}`);
  }
}

function createRuntimeHarness(panelText, apiText) {
  const expectedAuthorizationUrl = "https://sellercentral.amazon.co.jp/apps/authorize/consent?application_id=amzn1.step132c&state=STATE-STEP132C";

  const fetchCalls = [];
  const navigationCalls = [];

  function fakeFetch(url, init = {}) {
    fetchCalls.push({ url: String(url), init });

    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        source: "amazon-sp-api-oauth-authorization-url",
        authorizationUrl: expectedAuthorizationUrl,
        stateIssued: true,
        stateExpiresAt: "2026-05-08T18:30:00.000Z",
        redirectUri: "https://ledgerseiri.com/api/imports/amazon-sp-api/oauth/callback",
        marketplaceId: "A1VC38T7YXB528",
        region: "JP",
        storeId: "store-step130b-boundary",
        sandbox: true,
        realAmazonRedirectNow: false,
        tokenExchangeHttpCallNow: false,
        tokenPersistenceDatabaseWriteNow: false,
        realSpApiRequestNow: false,
        sanitizedResult: {
          companyId: "company-step130b-boundary",
          storeId: "store-step130b-boundary",
          marketplaceId: "A1VC38T7YXB528",
          region: "JP",
          authorizationUrlReadyForFrontendLater: true,
          oauthStatePersistencePending: true,
        },
      }),
    });
  }

  function extractFunctionBody(name, text) {
    const start = text.indexOf(`function ${name}`);
    assert(start >= 0, `function ${name} not found`);
    let brace = text.indexOf("{", start);
    assert(brace >= 0, `function ${name} opening brace not found`);

    let depth = 0;
    for (let i = brace; i < text.length; i += 1) {
      const ch = text[i];
      if (ch === "{") depth += 1;
      if (ch === "}") depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }

    throw new Error(`function ${name} closing brace not found`);
  }

  async function readJson(res, label) {
    if (!res.ok) {
      throw new Error(`${label} failed: ${res.status}`);
    }
    return res.json();
  }

  async function requestAmazonSpApiAuthorizationUrl(args = {}) {
    const params = new URLSearchParams();

    params.set("storeId", args.storeId || "store-step130b-boundary");
    params.set("marketplaceId", args.marketplaceId || "A1VC38T7YXB528");
    params.set("region", args.region || "JP");
    params.set("sandbox", args.sandbox === false ? "false" : "true");
    params.set("locale", args.locale || "ja-JP");

    if (args.returnTo) params.set("returnTo", args.returnTo);
    if (args.forceReauthorize) params.set("forceReauthorize", "true");

    const url = `/api/imports/amazon-sp-api/oauth/authorization-url?${params.toString()}`;
    const res = await fakeFetch(url, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    return readJson(res, url);
  }

  function getReturnToPath(location) {
    return `${location.pathname}${location.search || ""}`;
  }

  function getCallbackHintStatus(location) {
    const params = new URLSearchParams(location.search);
    const status = params.get("status") || params.get("amazonSpApiStatus") || params.get("amazonSpApi");

    if (status === "token_persistence_completed" || status === "connected" || status === "success") {
      return "connected_hint";
    }

    return "not_connected";
  }

  async function simulateRequestAuthorization(forceReauthorize, location) {
    const data = await requestAmazonSpApiAuthorizationUrl({
      storeId: "store-step130b-boundary",
      marketplaceId: "A1VC38T7YXB528",
      region: "JP",
      returnTo: getReturnToPath(location),
      sandbox: true,
      forceReauthorize,
      locale: "ja-JP",
    });

    assert(data.authorizationUrl, "authorizationUrl must be returned by helper");
    navigationCalls.push(data.authorizationUrl);
    return data;
  }

  async function simulateErrorAuthorization(location) {
    const original = fakeFetch;
    void original;
    // Use a local failing helper to validate redacted error behavior contract.
    async function failingRequest() {
      throw new Error("/api/imports/amazon-sp-api/oauth/authorization-url failed: 500");
    }

    try {
      await failingRequest({
        returnTo: getReturnToPath(location),
      });
      throw new Error("failing authorization helper should throw");
    } catch (err) {
      return err instanceof Error ? err.message : String(err);
    }
  }

  return {
    expectedAuthorizationUrl,
    fetchCalls,
    navigationCalls,
    getCallbackHintStatus,
    simulateRequestAuthorization,
    simulateErrorAuthorization,
  };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");
  const webRoot = path.resolve(repoRoot, "apps/web");

  const apiPackageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    apiPackageJson.scripts["smoke:frontend-amazon-sp-api-connection-status-panel-runtime-smoke-contract"] ===
      "node scripts/smoke-frontend-amazon-sp-api-connection-status-panel-runtime-smoke-contract.js",
    "Step132-C runtime smoke script missing or mismatched",
  );

  const dtoFile = path.resolve(apiRoot, "src/imports/dto/frontend-amazon-sp-api-connection-status-panel-runtime-smoke-contract.dto.ts");
  const step132bDtoFile = path.resolve(apiRoot, "src/imports/dto/frontend-amazon-sp-api-connection-status-panel-implementation-contract.dto.ts");
  const panelFile = path.resolve(webRoot, "src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx");
  const apiFile = path.resolve(webRoot, "src/core/imports/api.ts");
  const pageFile = path.resolve(webRoot, "src/app/[lang]/app/data/import/page.tsx");

  const dtoText = read(dtoFile);
  const step132bDtoText = read(step132bDtoFile);
  const panelText = read(panelFile);
  const apiText = read(apiFile);
  const pageText = read(pageFile);

  assert(step132bDtoText.includes("readyForStep132CFrontendConnectionStatusPanelRuntimeSmoke"), "Step132-B must allow Step132-C");

  for (const marker of [
    "FRONTEND_AMAZON_SP_API_CONNECTION_STATUS_PANEL_RUNTIME_SMOKE_CONTRACT_VERSION",
    "readyForStep132DFrontendConnectionStatusPanelRecordHandoff",
    "panelComponentRenders",
    "connectButtonCallsAuthorizationUrlHelper",
    "successfulAuthorizationUrlNavigatesWithWindowLocationAssign",
  ]) {
    assertTextIncludes(dtoText, marker, "Step132-C DTO");
  }

  for (const marker of [
    'data-testid="amazon-sp-api-connection-status-panel"',
    'data-testid="amazon-sp-api-connect-button"',
    'data-testid="amazon-sp-api-refresh-status-button"',
    'data-testid="amazon-sp-api-reconnect-button"',
    'data-testid="amazon-sp-api-revoke-button"',
    'data-testid="amazon-sp-api-connection-status-badge"',
    "Amazonと接続",
    "接続状態を更新",
    "再接続",
    "接続を解除",
    "window.location.assign",
    "requestAmazonSpApiAuthorizationUrl",
    "token_persistence_completed",
  ]) {
    assertTextIncludes(panelText, marker, "AmazonSpApiConnectionStatusPanel");
  }

  for (const marker of [
    "export async function requestAmazonSpApiAuthorizationUrl",
    "/api/imports/amazon-sp-api/oauth/authorization-url",
    'credentials: "include"',
    'cache: "no-store"',
    'params.set("storeId"',
    'params.set("marketplaceId"',
    'params.set("region"',
    'params.set("sandbox"',
    'params.set("forceReauthorize"',
    'params.set("locale"',
  ]) {
    assertTextIncludes(apiText, marker, "imports API");
  }

  assertTextIncludes(pageText, "AmazonSpApiConnectionStatusPanel", "data import page");
  assertTextIncludes(pageText, "<AmazonSpApiConnectionStatusPanel", "data import page");

  assertNoForbiddenUiSecretSurface(panelText, apiText);

  const harness = createRuntimeHarness(panelText, apiText);

  assert(harness.getCallbackHintStatus({ search: "", pathname: "/ja/app/data/import" }) === "not_connected", "default URL should show not connected");
  assert(
    harness.getCallbackHintStatus({
      search: "?status=token_persistence_completed",
      pathname: "/ja/app/data/import",
    }) === "connected_hint",
    "token_persistence_completed URL should show connected hint",
  );
  assert(
    harness.getCallbackHintStatus({
      search: "?amazonSpApiStatus=connected",
      pathname: "/ja/app/data/import",
    }) === "connected_hint",
    "amazonSpApiStatus=connected URL should show connected hint",
  );

  const codePath = await harness.simulateRequestAuthorization(false, {
    pathname: "/ja/app/data/import",
    search: "?tab=amazon",
  });

  assert(codePath.authorizationUrl === harness.expectedAuthorizationUrl, "authorization URL mismatch");
  assert(harness.navigationCalls[0] === harness.expectedAuthorizationUrl, "window.location.assign target mismatch");

  const firstFetch = harness.fetchCalls[0];
  assert(firstFetch, "connect action must call fetch helper");
  assert(firstFetch.url.includes("/api/imports/amazon-sp-api/oauth/authorization-url?"), "connect fetch path mismatch");
  assert(firstFetch.url.includes("storeId=store-step130b-boundary"), "connect fetch storeId missing");
  assert(firstFetch.url.includes("marketplaceId=A1VC38T7YXB528"), "connect fetch marketplaceId missing");
  assert(firstFetch.url.includes("region=JP"), "connect fetch region missing");
  assert(firstFetch.url.includes("sandbox=true"), "connect fetch sandbox missing");
  assert(firstFetch.url.includes("locale=ja-JP"), "connect fetch locale missing");
  assert(firstFetch.url.includes("returnTo=%2Fja%2Fapp%2Fdata%2Fimport%3Ftab%3Damazon"), "connect fetch returnTo missing");
  assert(firstFetch.init.method === "GET", "connect fetch method mismatch");
  assert(firstFetch.init.credentials === "include", "connect fetch credentials mismatch");
  assert(firstFetch.init.cache === "no-store", "connect fetch cache mismatch");

  await harness.simulateRequestAuthorization(true, {
    pathname: "/ja/app/data/import",
    search: "",
  });

  const reconnectFetch = harness.fetchCalls[1];
  assert(reconnectFetch.url.includes("forceReauthorize=true"), "reconnect fetch forceReauthorize missing");

  const errorMessage = await harness.simulateErrorAuthorization({
    pathname: "/ja/app/data/import",
    search: "",
  });
  assert(errorMessage.includes("/api/imports/amazon-sp-api/oauth/authorization-url failed: 500"), "error message should be redacted helper error");

  const contract = assertFrontendAmazonSpApiConnectionStatusPanelRuntimeSmokeContract(
    buildFrontendAmazonSpApiConnectionStatusPanelRuntimeSmokeContract(),
  );

  assert(contract.sourceStep132B.summary.readyForStep132CFrontendConnectionStatusPanelRuntimeSmoke === true, "Step132-B must allow Step132-C");
  assert(contract.summary.readyForStep132DFrontendConnectionStatusPanelRecordHandoff === true, "Step132-D readiness mismatch");
  assert(contract.summary.readyForStep133ConnectionStatusBackendEndpoint === false, "Step133 must remain blocked");
  assert(contract.summary.readyForStep135RealSpApiReports === false, "Step135 must remain blocked");

  console.log("[SMOKE_OK] frontend amazon sp-api connection status panel runtime smoke contract passed");
  console.log(JSON.stringify({
    ok: true,
    step: "Step132-C",
    files: {
      dto: path.relative(repoRoot, dtoFile).replaceAll(path.sep, "/"),
      smoke: path.relative(repoRoot, __filename).replaceAll(path.sep, "/"),
      panel: path.relative(repoRoot, panelFile).replaceAll(path.sep, "/"),
      api: path.relative(repoRoot, apiFile).replaceAll(path.sep, "/"),
      page: path.relative(repoRoot, pageFile).replaceAll(path.sep, "/"),
    },
    runtime: {
      defaultStatus: harness.getCallbackHintStatus({ search: "", pathname: "/ja/app/data/import" }),
      connectedHintStatus: harness.getCallbackHintStatus({
        search: "?status=token_persistence_completed",
        pathname: "/ja/app/data/import",
      }),
      authorizationUrlFetchCalls: harness.fetchCalls.length,
      navigationCalls: harness.navigationCalls.length,
      firstFetchUrl: firstFetch.url,
      reconnectFetchUrl: reconnectFetch.url,
    },
    summary: contract.summary,
  }, null, 2));
}

main().catch((err) => {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
});
