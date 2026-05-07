"use strict";

const fs = require("fs");
const path = require("path");

const READ_MODEL_ENDPOINT =
  "/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model";

const READ_MODEL_INTERNAL_ROUTE =
  "internal/amazon-sp-api-sandbox/import-jobs/read-model";

const CLIENT_REL =
  "apps/web/src/lib/api/amazonSpApiSandboxImportJobReadModelClient.ts";

const RUNTIME_PANEL_REL =
  "apps/web/src/components/app/imports/AmazonSpApiSandboxReadModelPanelShell.tsx";

const REAL_SP_API_OR_OAUTH_FRAGMENTS = [
  "sellingpartnerapi",
  "selling-partner-api",
  "getOrders(",
  "getOrder(",
  "getOrderItems(",
  "LoginWithAmazon",
  "loginWithAmazon",
  "lwaAuthorization",
  "refresh_token",
  "client_secret",
  "client_id",
  "tokenPersistence",
  "AmazonSpApiCredential",
  "AmazonSpApiToken",
];

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function listFiles(dir, predicate, acc = []) {
  if (!fs.existsSync(dir)) return acc;

  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);

    if (stat.isDirectory()) {
      listFiles(p, predicate, acc);
    } else if (predicate(p)) {
      acc.push(p);
    }
  }

  return acc;
}

function assertStep122ReadModelFrontendBoundary(repoRoot, options = {}) {
  const allowClientHelper = options.allowClientHelper !== false;
  const allowRuntimePanelHelperUse = options.allowRuntimePanelHelperUse !== false;

  const webRoot = path.resolve(repoRoot, "apps/web/src");
  const clientFile = path.resolve(repoRoot, CLIENT_REL);
  const runtimePanelFile = path.resolve(repoRoot, RUNTIME_PANEL_REL);

  const webFiles = listFiles(webRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));

  const endpointLeaks = [];
  const serviceMethodLeaks = [];
  const unexpectedClientImports = [];
  const runtimePanelRawFetchLeaks = [];
  const realSpApiLeaks = [];
  const forbiddenActionLeaks = [];

  for (const file of webFiles) {
    const text = read(file);
    const rel = path.relative(repoRoot, file);
    const isClientFile = file === clientFile;
    const isRuntimePanelFile = file === runtimePanelFile;

    const hasEndpoint =
      text.includes(READ_MODEL_ENDPOINT) ||
      text.includes(READ_MODEL_INTERNAL_ROUTE);

    if (hasEndpoint && !(allowClientHelper && isClientFile)) {
      endpointLeaks.push(`${rel}: read-model endpoint outside dedicated client helper`);
    }

    if (text.includes("listAmazonSpApiSandboxImportJobsReadModelDryRun")) {
      serviceMethodLeaks.push(`${rel}: backend service method leaked into frontend`);
    }

    const hasClientHelperSymbol =
      text.includes("fetchAmazonSpApiSandboxImportJobReadModel") ||
      text.includes("amazonSpApiSandboxImportJobReadModelClient");

    if (hasClientHelperSymbol) {
      const allowed =
        (allowClientHelper && isClientFile) ||
        (allowRuntimePanelHelperUse && isRuntimePanelFile);

      if (!allowed) {
        unexpectedClientImports.push(`${rel}: client helper referenced outside runtime panel/client helper`);
      }
    }

    if (
      isRuntimePanelFile &&
      (text.includes("fetch(") || text.includes("axios") || text.includes("XMLHttpRequest"))
    ) {
      runtimePanelRawFetchLeaks.push(`${rel}: runtime panel must use typed helper, not raw fetch`);
    }

    if (REAL_SP_API_OR_OAUTH_FRAGMENTS.some((fragment) => text.includes(fragment))) {
      realSpApiLeaks.push(`${rel}: real SP-API/OAuth/token fragment detected`);
    }

    if (text.includes("commitSales: true") || text.includes("executeInventory: true")) {
      forbiddenActionLeaks.push(`${rel}: commit/inventory action enabled`);
    }
  }

  const violations = [
    ...endpointLeaks,
    ...serviceMethodLeaks,
    ...unexpectedClientImports,
    ...runtimePanelRawFetchLeaks,
    ...realSpApiLeaks,
    ...forbiddenActionLeaks,
  ];

  if (violations.length > 0) {
    throw new Error(`Step122 read-model frontend boundary violation: ${JSON.stringify(violations)}`);
  }

  return {
    scannedFiles: webFiles.length,
    clientFile: CLIENT_REL,
    runtimePanelFile: RUNTIME_PANEL_REL,
    endpointLeaks,
    serviceMethodLeaks,
    unexpectedClientImports,
    runtimePanelRawFetchLeaks,
    realSpApiLeaks,
    forbiddenActionLeaks,
  };
}

module.exports = {
  READ_MODEL_ENDPOINT,
  READ_MODEL_INTERNAL_ROUTE,
  CLIENT_REL,
  RUNTIME_PANEL_REL,
  assertStep122ReadModelFrontendBoundary,
};
