const fs = require("fs");
const path = require("path");

const root = "/opt/ledgerseiri";
const api = path.join(root, "apps/api");

const contractPath = path.join(
  api,
  "src/imports/dto/amazon-sp-api-orders-historical-sync-disabled-controller-contract.dto.ts",
);
const controllerPath = path.join(api, "src/imports/imports.controller.ts");
const packagePath = path.join(api, "package.json");
const smokeBPath = path.join(api, "scripts/smoke-step149-b-amazon-orders-historical-sync-architecture-contract.js");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

console.log("========== Step149-C smoke: historical sync controller-disabled route ==========");

const contract = read(contractPath);
const controller = read(controllerPath);
const pkg = JSON.parse(read(packagePath));
const smokeB = read(smokeBPath);

[
  "Step149-C",
  "amazon-sp-api-orders-historical-sync",
  "POST /api/imports/amazon-sp-api/orders/historical-sync",
  "accepted: false",
  "disabled: true",
  "executionMode: 'controller_disabled'",
  "STEP149_C_HISTORICAL_SYNC_CONTROLLER_DISABLED",
  "callsAmazon: false",
  "writesImportJob: false",
  "writesImportStagingRows: false",
  "writesTransaction: false",
  "writesInventoryMovement: false",
  "updatesInventoryBalance: false",
  "startsBackgroundWorker: false",
  "exposesRawTokens: false",
  "requestContainsRawTokenLikeField: false",
  "buildAmazonSpApiOrdersHistoricalSyncDisabledControllerResponse",
  "assertAmazonSpApiOrdersHistoricalSyncDisabledControllerResponse",
].forEach((needle) => {
  assert(contract.includes(needle), `disabled contract missing marker: ${needle}`);
});

[
  "import { buildAmazonSpApiOrdersHistoricalSyncDisabledControllerResponse, type AmazonSpApiOrdersHistoricalSyncDisabledControllerResponse }",
  "@UseGuards(JwtAuthGuard)",
  "@Post('amazon-sp-api/orders/historical-sync')",
  "amazonSpApiOrdersHistoricalSyncDisabledControllerRoute",
  "@Body() body: Record<string, unknown>",
  "Promise<AmazonSpApiOrdersHistoricalSyncDisabledControllerResponse>",
  "return buildAmazonSpApiOrdersHistoricalSyncDisabledControllerResponse",
  "companyId",
  "requestedBy",
  "body",
].forEach((needle) => {
  assert(controller.includes(needle), `controller missing marker: ${needle}`);
});

const routeStart = controller.indexOf("amazonSpApiOrdersHistoricalSyncDisabledControllerRoute");
assert(routeStart >= 0, "disabled route method not found");
const nextRoute = controller.indexOf("\n  // Step141-G1:", routeStart);
const route = controller.slice(routeStart, nextRoute > routeStart ? nextRoute : routeStart + 2500);

[
  "previewAmazonSpApiOrdersReal",
  "persistAmazonSpApiOrdersRealPreviewToImportJobAndStagingRows",
  "this.prismaService",
  "prisma.",
  "transaction.create(",
  "transaction.createMany(",
  "inventoryMovement.create(",
  "inventoryMovement.createMany(",
  "inventoryBalance.update(",
  "buildAmazonSpApiOrdersServerOnlyRawSignedTransport",
  "refreshAmazonSpApiOrdersAccessTokenCache",
  "getOrders(",
  "getOrderItems(",
  "x-amz-access-token",
  "rawAccessToken",
  "rawRefreshToken",
  "clientSecret",
  "refreshToken",
].forEach((forbidden) => {
  assert(!route.includes(forbidden), `disabled route must not contain forbidden marker: ${forbidden}`);
});

assert(
  pkg.scripts["smoke:step149-c-amazon-orders-historical-sync-controller-disabled-route"] ===
    "node scripts/smoke-step149-c-amazon-orders-historical-sync-controller-disabled-route.js",
  "package.json must register Step149-C smoke",
);

assert(
  smokeB.includes("historical sync route, when present, must be the disabled Step149-C shell"),
  "Step149-B smoke must be updated to allow only Step149-C disabled shell",
);

console.log("[SMOKE_OK] Step149-C historical sync controller-disabled route smoke passed");
