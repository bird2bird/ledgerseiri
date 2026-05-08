#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  assertAmazonSpApiFrontendConnectionStatusPanelContract,
  buildAmazonSpApiFrontendConnectionStatusPanelContract,
} = require("../dist/src/imports/dto/amazon-sp-api-frontend-connection-status-panel-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function listFiles(dir, predicate, acc = []) {
  if (!fs.existsSync(dir)) return acc;

  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);

    if (stat.isDirectory()) {
      if (
        name === "node_modules" ||
        name === "dist" ||
        name === ".next" ||
        name === "coverage"
      ) {
        continue;
      }
      listFiles(p, predicate, acc);
    } else if (predicate(p)) {
      acc.push(p);
    }
  }

  return acc;
}

function isApiContractOrDto(file) {
  return file.includes(`${path.sep}src${path.sep}imports${path.sep}dto${path.sep}`) || file.endsWith(".dto.ts");
}

function assertNoStep123HImplementationLeak(repoRoot) {
  const apiRoot = path.resolve(repoRoot, "apps/api");
  const apiSrcRoot = path.resolve(apiRoot, "src");
  const webSrcRoot = path.resolve(repoRoot, "apps/web/src");

  const apiImplementationFiles = listFiles(apiSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p))
    .filter((file) => !isApiContractOrDto(file));

  const webImplementationFiles = listFiles(webSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));

  const routeLeaks = [];
  const apiServiceLeaks = [];
  const webComponentLeaks = [];
  const webApiClientLeaks = [];
  const secretExposureLeaks = [];
  const realSpApiLeaks = [];
  const writeLeaks = [];

  const allowedExistingAmazonSandboxRouteFragments = [
    "internal/amazon-sp-api-sandbox/import-jobs/read-model",
  ];

  const apiRoutePatterns = [
    /@Get\s*\([^)]*(lwa|oauth|callback|connect|authorize|authorization|token|credential|connection-status|connection)/i,
    /@Post\s*\([^)]*(lwa|oauth|callback|connect|authorize|authorization|token|credential|connection-status|connection)/i,
  ];

  const apiAmazonContextFragments = [
    "AmazonSpApiConnection",
    "AmazonSpApiCredential",
    "AmazonSpApiToken",
    "AmazonSpApiAccessTokenCache",
    "AmazonSpApiConnectionStatus",
    "amazon-sp-api-real",
    "selling_partner_id",
    "sellingPartnerId",
  ];

  const apiServiceFragments = [
    "getAmazonSpApiConnectionStatus",
    "listAmazonSpApiConnectionStatus",
    "connectionStatusReadModel",
    "amazonSpApiConnectionStatus",
  ];

  // Step123-H FIX1:
  // Existing web files already contain generic Japanese status copy and the
  // Step122 Amazon SP-API sandbox read-model panel. Those are legitimate and
  // must not be treated as a real Amazon connection-status panel.
  //
  // Only flag frontend code when it combines Amazon real-connection context
  // with connection-status panel semantics or real connection actions.
  const webAmazonRealConnectionContextFragments = [
    "AmazonSpApiConnection",
    "AmazonSpApiConnectionStatus",
    "amazon-sp-api-real",
    "connection-status",
    "authorization-url",
    "sellingPartnerIdMasked",
    "Amazonと連携",
  ];

  const webConnectionPanelSemanticFragments = [
    "frontend-connection-status",
    "connection status",
    "接続済み",
    "未接続",
    "接続準備中",
    "連携解除済み",
    "認証期限切れ",
    "再接続",
    "連携解除",
  ];

  const allowedExistingWebFragments = [
    "AmazonSpApiSandboxReadModelPanelShell",
    "amazon-sp-api-sandbox",
    "Amazon SP-API サンドボックス",
    "実SP-API接続は無効",
    "保存・売上計上・在庫反映は実行されません",
    "fetchAmazonSpApiSandboxImportJobReadModel",
  ];

  const webApiClientFragments = [
    "fetch(",
    "apiFetch(",
    "useSWR(",
    "axios.",
    "/api/imports/amazon-sp-api",
    "connection-status",
    "authorization-url",
  ];

  const secretFragments = [
    "refreshToken",
    "accessToken",
    "clientSecret",
    "authorizationCode",
    "rawOAuthState",
    "encryptedRefreshToken",
    "encryptedAccessToken",
    "refresh_token",
    "access_token",
    "client_secret",
  ];

  const realSpApiFragments = [
    "sellingpartnerapi",
    "selling-partner-api",
    "getOrders(",
    "getOrder(",
    "getOrderItems(",
    "createReport(",
    "getReport(",
    "getReportDocument(",
    "reports/2021-06-30",
  ];

  const writeFragments = [
    "importJob.create",
    "transaction.create",
    "transaction.createMany",
    "inventoryMovement.create",
    "inventoryMovement.createMany",
    "inventoryBalance.create",
    "inventoryBalance.update",
    "commitSales: true",
    "executeInventory: true",
  ];

  const amazonRealWriteContextFragments = [
    "AmazonSpApiReal",
    "amazon-sp-api-real",
    "sourceType: 'amazon-sp-api'",
    'sourceType: "amazon-sp-api"',
    "realSourceType: 'amazon-sp-api'",
    'realSourceType: "amazon-sp-api"',
    "lwa-oauth",
    "LoginWithAmazon",
    "loginWithAmazon",
    "sellingpartnerapi",
    "selling-partner-api",
    "sp-api-report-readonly",
  ];

  for (const file of apiImplementationFiles) {
    const text = read(file);
    const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");

    const isAllowedExistingAmazonSandboxRoute = allowedExistingAmazonSandboxRouteFragments.some((fragment) =>
      text.includes(fragment),
    );

    for (const pattern of apiRoutePatterns) {
      if (pattern.test(text) && !isAllowedExistingAmazonSandboxRoute) {
        routeLeaks.push(rel);
      }
    }

    const hasApiAmazonContext = apiAmazonContextFragments.some((fragment) => text.includes(fragment));
    const hasApiService = apiServiceFragments.some((fragment) => text.includes(fragment));
    const hasSecret = secretFragments.some((fragment) => text.includes(fragment));
    const hasRealSpApi = realSpApiFragments.some((fragment) => text.includes(fragment));

    const isSandboxOnly =
      text.includes("AmazonSpApiSandbox") ||
      text.includes("amazon-sp-api-sandbox") ||
      text.includes("AMAZON_ORDER_SP_API");

    if (hasApiAmazonContext && hasApiService && !isSandboxOnly) {
      apiServiceLeaks.push(rel);
    }

    if (hasApiAmazonContext && hasSecret && !isSandboxOnly) {
      secretExposureLeaks.push(rel);
    }

    if (hasApiAmazonContext && hasRealSpApi && !isSandboxOnly) {
      realSpApiLeaks.push(rel);
    }

    const hasAmazonRealWriteContext = amazonRealWriteContextFragments.some((fragment) => text.includes(fragment));
    const hasDomainWrite = writeFragments.some((fragment) => text.includes(fragment));

    if (hasAmazonRealWriteContext && hasDomainWrite && !isSandboxOnly) {
      writeLeaks.push(rel);
    }
  }

  for (const file of webImplementationFiles) {
    const text = read(file);
    const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");

    const isAllowedExistingWebFile = allowedExistingWebFragments.some((fragment) => text.includes(fragment));
    const hasAmazonRealConnectionContext = webAmazonRealConnectionContextFragments.some((fragment) => text.includes(fragment));
    const hasConnectionPanelSemantics = webConnectionPanelSemanticFragments.some((fragment) => text.includes(fragment));
    const hasAmazonConnectionUi = hasAmazonRealConnectionContext && hasConnectionPanelSemantics && !isAllowedExistingWebFile;
    const hasApiClient = webApiClientFragments.some((fragment) => text.includes(fragment));
    const hasSecret = secretFragments.some((fragment) => text.includes(fragment));

    if (hasAmazonConnectionUi) {
      webComponentLeaks.push(rel);
    }

    if (hasAmazonRealConnectionContext && hasApiClient && !isAllowedExistingWebFile) {
      webApiClientLeaks.push(rel);
    }

    if (hasAmazonRealConnectionContext && hasSecret && !isAllowedExistingWebFile) {
      secretExposureLeaks.push(rel);
    }
  }

  const schema = read(path.resolve(apiRoot, "prisma/schema.prisma"));
  const forbiddenSchemaModels = [
    "model AmazonSpApiCredential",
    "model AmazonSpApiToken",
    "model AmazonSpApiConnection",
    "model AmazonSpApiOAuthState",
    "model AmazonSpApiAccessTokenCache",
    "model AmazonOAuthState",
    "model AmazonCredential",
    "model AmazonToken",
  ];

  const schemaLeaks = forbiddenSchemaModels.filter((fragment) => schema.includes(fragment));

  assert(routeLeaks.length === 0, `Amazon connection route leak detected: ${JSON.stringify(routeLeaks)}`);
  assert(apiServiceLeaks.length === 0, `Amazon connection backend service leak detected: ${JSON.stringify(apiServiceLeaks)}`);
  assert(webComponentLeaks.length === 0, `Amazon frontend connection component leak detected: ${JSON.stringify(webComponentLeaks)}`);
  assert(webApiClientLeaks.length === 0, `Amazon frontend API client leak detected: ${JSON.stringify(webApiClientLeaks)}`);
  assert(secretExposureLeaks.length === 0, `Amazon secret exposure leak detected: ${JSON.stringify(secretExposureLeaks)}`);
  assert(realSpApiLeaks.length === 0, `real SP-API implementation leak detected: ${JSON.stringify(realSpApiLeaks)}`);
  assert(writeLeaks.length === 0, `ImportJob/transaction/inventory write leak detected: ${JSON.stringify(writeLeaks)}`);
  assert(schemaLeaks.length === 0, `Amazon credential/token schema.prisma leak detected: ${JSON.stringify(schemaLeaks)}`);

  return {
    scannedApiImplementationFiles: apiImplementationFiles.length,
    scannedWebImplementationFiles: webImplementationFiles.length,
    routeLeaks,
    apiServiceLeaks,
    webComponentLeaks,
    webApiClientLeaks,
    secretExposureLeaks,
    realSpApiLeaks,
    writeLeaks,
    schemaLeaks,
  };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));

  assert(
    packageJson.scripts["smoke:amazon-sp-api-frontend-connection-status-panel-contract"] ===
      "node scripts/smoke-amazon-sp-api-frontend-connection-status-panel-contract.js",
    "Step123-H npm script missing or mismatched",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-connection-status-read-model-contract"],
    "Step123-G regression smoke script missing",
  );

  const sourceDto = read(
    path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-frontend-connection-status-panel-contract.dto.ts"),
  );

  const requiredSourceMarkers = [
    "AMAZON_SP_API_FRONTEND_CONNECTION_STATUS_PANEL_CONTRACT_VERSION",
    "buildAmazonSpApiFrontendConnectionStatusPanelContract",
    "assertAmazonSpApiFrontendConnectionStatusPanelContract",
    "assertAmazonSpApiConnectionStatusReadModelContract",
    "sourceStep123G",
    "design-amazon-sp-api-frontend-connection-status-panel-contract-only",
    "uiShapeDesignOnly",
    "reactComponentForbiddenNow",
    "apiClientForbiddenNow",
    "buttonHandlerForbiddenNow",
    "browserRedirectForbiddenNow",
    "backendRouteForbiddenNow",
    "ImportCenter",
    "SettingsIntegrations",
    "storeScopedRenderingRequired",
    "marketplaceScopedRenderingRequired",
    "未接続",
    "接続準備中",
    "接続済み",
    "連携解除済み",
    "認証期限切れ",
    "エラー",
    "notConnectedBadgeRequired",
    "authorizationPendingBadgeRequired",
    "connectedBadgeRequired",
    "notConnectedShowsConnect",
    "connectedShowsReconnect",
    "connectedShowsDisconnect",
    "destructiveDisconnectRequiresConfirmationInFuture",
    "marketplaceDisplayRequired",
    "storeDisplayRequired",
    "sellingPartnerIdMaskedDisplayRequired",
    "redactedErrorMessageDisplayNullable",
    "loadingSkeletonRequiredInFuture",
    "notConfiguredEmptyStateRequired",
    "permissionErrorStateRequired",
    "networkErrorStateRequired",
    "refreshTokenNeverRendered",
    "accessTokenNeverRendered",
    "clientSecretNeverRendered",
    "authorizationCodeNeverRendered",
    "rawOAuthStateNeverRendered",
    "reactComponentFile",
    "frontendApiClient",
    "connectionButtonHandler",
    "browserRedirectToAmazon",
    "readyForFrontendConnectionStatusImplementation",
    "readyForAuthorizationUrlImplementationPreflight",
    "readyForOauthStateSigningImplementationPreflight",
  ];

  for (const marker of requiredSourceMarkers) {
    assert(sourceDto.includes(marker), `Step123-H DTO missing marker: ${marker}`);
  }

  const contract = assertAmazonSpApiFrontendConnectionStatusPanelContract(
    buildAmazonSpApiFrontendConnectionStatusPanelContract(),
  );

  assert(contract.sourceStep123G.contractOnly === true, "Step123-H must depend on Step123-G contract-only boundary");
  assert(
    contract.sourceStep123G.summary.readyForFrontendConnectionStatusContract === true,
    "Step123-G must allow Step123-H frontend connection status contract",
  );

  assert(
    contract.summary.readyForFrontendConnectionStatusImplementation === false,
    "Step123-H must not allow frontend connection status implementation",
  );
  assert(
    contract.summary.readyForAuthorizationUrlImplementationPreflight === true,
    "Step123-H should allow authorization URL implementation preflight",
  );
  assert(
    contract.summary.readyForOauthStateSigningImplementationPreflight === true,
    "Step123-H should allow OAuth state signing implementation preflight",
  );
  assert(
    contract.summary.readyForRealSpApiReportRequest === false,
    "Step123-H must not allow real SP-API report request",
  );

  const implementationGuard = assertNoStep123HImplementationLeak(repoRoot);

  console.log("[SMOKE_OK] amazon sp-api frontend connection status panel contract smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        step: "Step123-H",
        contract: {
          version: contract.version,
          contractOnly: contract.contractOnly,
          implementationNow: contract.implementationNow,
          backendRouteAddedNow: contract.backendRouteAddedNow,
          frontendComponentAddedNow: contract.frontendComponentAddedNow,
          frontendApiClientAddedNow: contract.frontendApiClientAddedNow,
          buttonHandlerAddedNow: contract.buttonHandlerAddedNow,
          browserRedirectAddedNow: contract.browserRedirectAddedNow,
          schemaChangedNow: contract.schemaChangedNow,
          migrationAddedNow: contract.migrationAddedNow,
          tokenPersistenceNow: contract.tokenPersistenceNow,
          realSpApiRequestNow: contract.realSpApiRequestNow,
          writesDatabase: contract.writesDatabase,
          panelBoundary: contract.panelBoundary,
          placementContract: contract.placementContract,
          japaneseLabelContract: contract.japaneseLabelContract,
          badgeStateContract: contract.badgeStateContract,
          actionVisibilityContract: contract.actionVisibilityContract,
          metadataDisplayContract: contract.metadataDisplayContract,
          loadingAndEmptyStateContract: contract.loadingAndEmptyStateContract,
          noSecretExposureContract: contract.noSecretExposureContract,
          forbiddenNow: contract.forbiddenNow,
          summary: contract.summary,
        },
        implementationGuard,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
});
