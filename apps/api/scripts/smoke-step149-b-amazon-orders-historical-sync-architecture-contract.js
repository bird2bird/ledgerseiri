const fs = require("fs");
const path = require("path");

const root = "/opt/ledgerseiri";
const api = path.join(root, "apps/api");

const contractPath = path.join(
  api,
  "src/imports/dto/amazon-sp-api-orders-historical-sync-architecture-contract.dto.ts",
);
const controllerPath = path.join(api, "src/imports/imports.controller.ts");
const packagePath = path.join(api, "package.json");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

console.log("========== Step149-B smoke: historical sync architecture contract ==========");

const contract = read(contractPath);
const controller = read(controllerPath);
const pkg = JSON.parse(read(packagePath));

[
  "Step149-B",
  "amazon-sp-api-orders-historical-sync",
  "contract_only",
  "disabledByDefault: true",
  "requiresBackgroundRunner: true",
  "noSingleBlockingHttpRequest: true",
  "noControllerRouteNow: true",
  "noSchemaMigrationNow: true",
  "noFrontendChangeNow: true",
  "履歴データ同期",
  "recommendedSegmentDays: 7",
  "maxSegmentDays: 31",
  "maxPagesPerSegment: 50",
  "maxRetryAttemptsPerSegment: 3",
  "resumeRequiresCursorState: true",
  "amazonOrderId",
  "orderItemId",
  "duplicateRowsMustNotCreateTransactions: true",
  "duplicateRowsMustNotCreateInventoryMovements: true",
  "forbiddenNow",
  "controllerRoute: true",
  "productionExecution: true",
  "prismaSchemaChange: true",
  "importJobCreate: true",
  "importStagingRowCreateMany: true",
  "transactionCreate: true",
  "transactionCreateMany: true",
  "inventoryMovementCreate: true",
  "inventoryMovementCreateMany: true",
  "inventoryBalanceUpdate: true",
  "bankReconciliation: true",
  "settlementFeeImport: true",
  "frontendButton: true",
  "rawTokenExposure: true",
  "clientSideSpApiSecretLogic: true",
  "unboundedLoop: true",
  "assertAmazonSpApiOrdersHistoricalSyncArchitectureContract",
  "AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_ARCHITECTURE_CONTRACT",
].forEach((needle) => {
  assert(contract.includes(needle), `contract missing marker: ${needle}`);
});

[
  "while (true)",
  "for (;;)",
  "setInterval(",
  "transaction.create(",
  "transaction.createMany(",
  "inventoryMovement.create(",
  "inventoryMovement.createMany(",
  "inventoryBalance.update(",
  "x-amz-access-token",
  "rawAccessToken",
  "rawRefreshToken",
  "clientSecret",
  "refreshToken",
].forEach((forbidden) => {
  assert(!contract.includes(forbidden), `contract must not contain forbidden marker: ${forbidden}`);
});

[
  "@Post('amazon-sp-api/orders/historical-sync'",
  '@Post("amazon-sp-api/orders/historical-sync"',
  "amazonSpApiOrdersHistoricalSyncControllerRoute",
  "AmazonSpApiOrdersHistoricalSyncArchitectureContract",
].forEach((forbidden) => {
  assert(!controller.includes(forbidden), `controller must not expose Step149-B route/import yet: ${forbidden}`);
});

assert(
  pkg.scripts["smoke:step149-b-amazon-orders-historical-sync-architecture-contract"] ===
    "node scripts/smoke-step149-b-amazon-orders-historical-sync-architecture-contract.js",
  "package.json must register Step149-B smoke",
);

console.log("[SMOKE_OK] Step149-B historical sync architecture contract smoke passed");
