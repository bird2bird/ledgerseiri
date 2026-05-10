#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const {
  assertAmazonSpApiOrdersDryRunFixtureControllerRouteContract,
  buildAmazonSpApiOrdersDryRunFixtureControllerRouteContract,
} = require("../dist/src/imports/dto/amazon-sp-api-orders-dry-run-fixture-controller-route-contract.dto");

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`[OK] ${message}`);
}

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`);
  return fs.readFileSync(file, "utf8");
}

function listFiles(dir, predicate, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      if (["node_modules", "dist", ".next", "coverage", ".git"].includes(name)) continue;
      listFiles(p, predicate, acc);
      continue;
    }
    if (predicate(p)) acc.push(p);
  }
  return acc;
}

function isDtoOrContractFile(file) {
  return file.includes(`${path.sep}src${path.sep}imports${path.sep}dto${path.sep}`) || file.endsWith(".dto.ts");
}

function isAllowedExistingSandboxFile(file, text) {
  return (
    text.includes("AmazonSpApiSandbox") ||
    text.includes("amazon-sp-api-sandbox") ||
    text.includes("AMAZON_ORDER_SP_API") ||
    file.includes(`${path.sep}scripts${path.sep}smoke-amazon-sp-api-sandbox`)
  );
}

function isAllowedStep140IPureDryRunFixtureFile(file, text) {
  const normalized = file.replaceAll(path.sep, "/");
  return (
    normalized.endsWith("apps/api/src/imports/amazon-sp-api-orders-dry-run-fixture.ts") &&
    text.includes("buildAmazonSpApiOrdersDryRunPreview") &&
    text.includes("writesDatabase: false") &&
    text.includes("realAmazonOrdersApiCall: false")
  );
}

function isAllowedStep140JPreviewServiceFile(file, text) {
  const normalized = file.replaceAll(path.sep, "/");
  return (
    normalized.endsWith("apps/api/src/imports/amazon-sp-api-orders-preview.service.ts") &&
    text.includes("AmazonSpApiOrdersPreviewService") &&
    text.includes("serviceWritesDatabase: false") &&
    text.includes("serviceCallsAmazon: false") &&
    text.includes("controllerRouteUsed: false")
  );
}

function isAllowedStep140KPreviewControllerRoute(file, text) {
  const normalized = file.replaceAll(path.sep, "/");
  return (
    normalized.endsWith("apps/api/src/imports/imports.controller.ts") &&
    text.includes("amazonSpApiOrdersDryRunPreviewControllerRoute") &&
    text.includes("@Post('amazon-sp-api/orders/preview')") &&
    text.includes("controllerMode: 'dry-run-preview-only'") &&
    text.includes("controllerWritesDatabase: false") &&
    text.includes("controllerCallsAmazon: false")
  );
}

function isAllowedStep140NSignedRequestBuilder(file, text) {
  const normalized = file.replaceAll(path.sep, "/");
  return (
    normalized.endsWith("apps/api/src/imports/amazon-sp-api-orders-signed-request.builder.ts") &&
    text.includes("buildAmazonSpApiOrdersListOrdersSignedRequest") &&
    text.includes("buildAmazonSpApiOrdersGetOrderItemsSignedRequest") &&
    text.includes("doesNotExecuteNetwork: true") &&
    text.includes("doesNotWriteDatabase: true") &&
    text.includes("authorizationHeaderRedacted: true")
  );
}

function isAllowedStep140OGuardedHttpClient(file, text) {
  const normalized = file.replaceAll(path.sep, "/");
  return (
    normalized.endsWith("apps/api/src/imports/amazon-sp-api-orders-http.client.ts") &&
    text.includes("executeAmazonSpApiOrdersListOrdersHttp") &&
    text.includes("executeAmazonSpApiOrdersGetOrderItemsHttp") &&
    text.includes("usesInjectedTransportOnly: true") &&
    text.includes("defaultRealNetworkDisabled: true") &&
    text.includes("doesNotWriteDatabase: true") &&
    text.includes("doesNotWriteImportJob: true") &&
    text.includes("doesNotWriteTransaction: true") &&
    text.includes("doesNotWriteInventory: true") &&
    !text.includes("fetch(") &&
    !text.includes("axios.") &&
    !text.includes("got(") &&
    !text.includes("https.request(") &&
    !text.includes("http.request(") &&
    !text.includes("prisma.")
  );
}

function isAllowedStep140PRealPreviewNoPersistence(file, text) {
  const normalized = file.replaceAll(path.sep, "/");
  return (
    normalized.endsWith("apps/api/src/imports/amazon-sp-api-orders-real-preview.service.ts") &&
    text.includes("previewAmazonSpApiOrdersRealNoPersistence") &&
    text.includes("real-http-mocked-transport-no-persistence") &&
    text.includes("blockedBecauseNoPersistence: true") &&
    text.includes("writesDatabase: false") &&
    text.includes("importJobWriteNow: false") &&
    text.includes("importStagingRowWriteNow: false") &&
    text.includes("transactionWriteNow: false") &&
    text.includes("inventoryWriteNow: false") &&
    text.includes("usesInjectedTransportOnly: true") &&
    !text.includes("prisma.") &&
    !text.includes("importJob.create") &&
    !text.includes("importStagingRow.create") &&
    !text.includes("transaction.create") &&
    !text.includes("inventoryMovement.create") &&
    !text.includes("inventoryBalance.update") &&
    !text.includes("fetch(") &&
    !text.includes("axios.") &&
    !text.includes("got(") &&
    !text.includes("https.request(") &&
    !text.includes("http.request(")
  );
}

function isAllowedStep140QPreviewPersistence(file, text) {
  const normalized = file.replaceAll(path.sep, "/");
  return (
    normalized.endsWith("apps/api/src/imports/amazon-sp-api-orders-preview-persistence.service.ts") &&
    text.includes("persistAmazonSpApiOrdersPreviewToImportStaging") &&
    text.includes("prisma.importJob.create") &&
    text.includes("prisma.importStagingRow.create") &&
    text.includes("writesOnlyImportJobAndStagingRows: true") &&
    text.includes("transactionWriteNow: false") &&
    text.includes("inventoryWriteNow: false") &&
    text.includes("doesNotWriteTransaction: true") &&
    text.includes("doesNotWriteInventory: true") &&
    text.includes("doesNotDeductInventory: true") &&
    text.includes("doesNotCallAmazon: true") &&
    !text.includes("transaction.create") &&
    !text.includes("inventoryMovement.create") &&
    !text.includes("inventoryBalance.update") &&
    !text.includes("fetch(") &&
    !text.includes("axios.") &&
    !text.includes("got(") &&
    !text.includes("https.request(") &&
    !text.includes("http.request(")
  );
}

function isAllowedStep140RTransactionCommit(file, text) {
  const normalized = file.replaceAll(path.sep, "/");
  return (
    normalized.endsWith("apps/api/src/imports/amazon-sp-api-orders-transaction-commit.service.ts") &&
    text.includes("commitAmazonSpApiOrdersStagingRowsToIncomeTransactions") &&
    text.includes("prisma.transaction.findFirst") &&
    text.includes("prisma.transaction.create") &&
    text.includes("direction: 'INCOME'") &&
    text.includes("sourceType: 'IMPORT'") &&
    text.includes("inventoryWriteNow: false") &&
    text.includes("doesNotWriteInventory: true") &&
    text.includes("doesNotDeductInventory: true") &&
    text.includes("doesNotCallAmazon: true") &&
    !text.includes("inventoryMovement.create") &&
    !text.includes("inventoryBalance.update") &&
    !text.includes("fetch(") &&
    !text.includes("axios.") &&
    !text.includes("got(") &&
    !text.includes("https.request(") &&
    !text.includes("http.request(")
  );
}

function isAllowedStep140SSkuResolutionAudit(file, text) {
  const normalized = file.replaceAll(path.sep, "/");
  return (
    normalized.endsWith("apps/api/src/imports/amazon-sp-api-orders-sku-resolution-audit.service.ts") &&
    text.includes("resolveAmazonSpApiOrdersSkuAliasesForStagingRows") &&
    text.includes("prisma.productSku.findFirst") &&
    text.includes("prisma.productSkuAlias.findFirst") &&
    text.includes("RESOLVED_BY_ALIAS") &&
    text.includes("UNRESOLVED_SKU") &&
    text.includes("writesInventoryMovement: false") &&
    text.includes("writesInventoryBalance: false") &&
    text.includes("deductsInventory: false") &&
    text.includes("writesTransaction: false") &&
    text.includes("callsAmazon: false") &&
    !text.includes("inventoryMovement.create") &&
    !text.includes("inventoryBalance.update") &&
    !text.includes("transaction.create") &&
    !text.includes("importStagingRow.update") &&
    !text.includes("importStagingRow.create") &&
    !text.includes("fetch(") &&
    !text.includes("axios.") &&
    !text.includes("got(") &&
    !text.includes("https.request(") &&
    !text.includes("http.request(")
  );
}

function isAllowedStep140TInventoryDeduction(file, text) {
  const normalized = file.replaceAll(path.sep, "/");
  return (
    normalized.endsWith("apps/api/src/imports/amazon-sp-api-orders-inventory-deduction.service.ts") &&
    text.includes("deductAmazonSpApiOrdersInventoryFromCommittedTransactions") &&
    text.includes("prisma.transaction.findMany") &&
    text.includes("prisma.importStagingRow.findMany") &&
    text.includes("prisma.inventoryMovement.findFirst") &&
    text.includes("prisma.inventoryMovement.create") &&
    text.includes("prisma.inventoryBalance.upsert") &&
    text.includes("sourceType: 'AMAZON_SP_API_ORDER'") &&
    text.includes("type: 'OUT'") &&
    text.includes("writesInventoryMovement: true") &&
    text.includes("writesInventoryBalance: true") &&
    text.includes("writesTransaction: false") &&
    text.includes("createsTransaction: false") &&
    text.includes("requiresResolvedSku: true") &&
    text.includes("requiresCommittedIncomeTransaction: true") &&
    !text.includes("transaction.create") &&
    !text.includes("fetch(") &&
    !text.includes("axios.") &&
    !text.includes("got(") &&
    !text.includes("https.request(") &&
    !text.includes("http.request(")
  );
}

function isAllowedStep140LFrontendDryRunOrdersPreview(file, text) {
  const normalized = file.replaceAll(path.sep, "/");

  const isPanel =
    normalized.endsWith("apps/web/src/components/app/imports/AmazonSpApiOrdersDryRunPreviewPanel.tsx") &&
    text.includes("AmazonSpApiOrdersDryRunPreviewPanel") &&
    text.includes("amazon-sp-api-orders-dry-run-preview-panel") &&
    text.includes("amazon-sp-api-orders-dry-run-preview-button") &&
    text.includes("amazon-sp-api-orders-commit-disabled-button") &&
    text.includes("previewAmazonSpApiOrdersDryRun") &&
    text.includes("dryRun: true") &&
    text.includes("Commitは未実装");

  const isApiHelper =
    normalized.endsWith("apps/web/src/core/imports/api.ts") &&
    text.includes("AmazonSpApiOrdersDryRunPreviewRequest") &&
    text.includes("AmazonSpApiOrdersDryRunPreviewResponse") &&
    text.includes("previewAmazonSpApiOrdersDryRun") &&
    text.includes("dryRun: true") &&
    (
      text.includes("AMAZON_SP_API_ORDERS_DRY_RUN_PREVIEW_ENDPOINT") ||
      text.includes("/api/imports/amazon-sp-api/orders/preview")
    );

  const forbidden =
    text.includes("commitAmazonSpApiOrders") ||
    text.includes("orders/commit") ||
    text.includes("getOrders(") ||
    text.includes("getOrderItems(") ||
    text.includes("importJob.create") ||
    text.includes("transaction.create") ||
    text.includes("inventoryMovement.create") ||
    text.includes("inventoryBalance.update") ||
    text.includes("AWS4-HMAC-SHA256") ||
    text.includes("x-amz-access-token") ||
    text.includes("refreshToken") ||
    text.includes("clientSecret");

  return (isPanel || isApiHelper) && !forbidden;
}

function isAllowedStep140UProductionCloseoutPanel(file, text) {
  const normalized = file.replaceAll(path.sep, "/");

  const isReadonlyCloseoutPanel =
    normalized.endsWith("apps/web/src/components/app/imports/AmazonSpApiOrdersProductionCloseoutPanel.tsx") &&
    text.includes("AmazonSpApiOrdersProductionCloseoutPanel") &&
    text.includes("amazon-sp-api-orders-production-closeout-panel") &&
    text.includes("backend closed loop ready") &&
    text.includes("read-only UX") &&
    text.includes("Step140-P") &&
    text.includes("Step140-Q") &&
    text.includes("Step140-R") &&
    text.includes("Step140-S") &&
    text.includes("Step140-T") &&
    text.includes("Step140-U") &&
    text.includes("no frontend write action") &&
    text.includes("no Amazon call from this panel") &&
    text.includes("no transaction commit button") &&
    text.includes("no inventory deduction button") &&
    text.includes("amazon-sp-api-orders-production-closeout-boundary");

  const forbidden =
    text.includes("fetch(") ||
    text.includes("previewAmazonSpApiOrdersDryRun(") ||
    text.includes("previewAmazonSpApiOrdersReal") ||
    text.includes("commitAmazonSpApiOrders") ||
    text.includes("deductAmazonSpApiOrders") ||
    text.includes("transaction.create") ||
    text.includes("inventoryMovement.create") ||
    text.includes("inventoryBalance.update") ||
    text.includes("x-amz-access-token") ||
    text.includes("AWS4-HMAC-SHA256") ||
    text.includes("clientSecret") ||
    text.includes("refreshToken");

  return isReadonlyCloseoutPanel && !forbidden;
}

function assertNoStep140HImplementationLeak(repoRoot) {
  const apiRoot = path.resolve(repoRoot, "apps/api");
  const apiSrcRoot = path.resolve(apiRoot, "src");
  const webSrcRoot = path.resolve(repoRoot, "apps/web/src");

  const apiFiles = listFiles(apiSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p)).filter((file) => !isDtoOrContractFile(file));
  const webFiles = listFiles(webSrcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));

  const routeLeaks = [];
  const dryRunLeaks = [];
  const controllerLeaks = [];
  const frontendLeaks = [];
  const writeLeaks = [];
  const networkLeaks = [];
  const schemaLeaks = [];

  const routePatterns = [
    /@Post\s*\([^)]*(amazon-sp-api.*orders.*preview|orders.*preview|amazon-sp-api.*orders.*commit|orders.*commit)/i,
    /@Get\s*\([^)]*(amazon-sp-api.*orders.*preview|orders.*preview|amazon-sp-api.*orders.*commit|orders.*commit)/i,
  ];

  const dryRunFragments = [
    "AmazonSpApiOrdersDryRunFixture",
    "runAmazonSpApiOrdersDryRun",
    "buildAmazonSpApiOrdersDryRunFixture",
    "sampleOrderCount: 2",
    "sampleOrderItemCount: 3",
  ];

  const controllerFragments = [
    "amazon-sp-api/orders/preview",
    "amazon-sp-api/orders/commit",
    "previewAmazonSpApiOrders",
    "commitAmazonSpApiOrders",
    "AmazonSpApiOrdersController",
  ];

  const frontendFragments = [
    "Amazon SP-API Orders",
    "amazon-sp-api-orders",
    "previewButtonWouldUseDryRunRoute",
    "commitButtonWouldRequireExplicitConfirm",
    "Import Center",
  ];

  const writeFragments = [
    "importJob.create",
    "importJob.update",
    "importStagingRow.create",
    "importStagingRow.createMany",
    "transaction.create",
    "transaction.createMany",
    "inventoryMovement.create",
    "inventoryBalance.update",
    "inventoryBalance.upsert",
  ];

  const networkFragments = [
    "fetch(",
    "axios.",
    "got(",
    "https.request(",
    "http.request(",
    "getOrders(",
    "getOrder(",
    "getOrderItems(",
    "/orders/v0/orders",
    "orders/v0/orders",
  ];

  for (const file of apiFiles) {
    const text = read(file);
    const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");
    const allowedSandbox = isAllowedExistingSandboxFile(file, text);
    const allowedStep140IPureDryRunFixture = isAllowedStep140IPureDryRunFixtureFile(file, text);
    const allowedStep140JPreviewService = isAllowedStep140JPreviewServiceFile(file, text);
    const allowedStep140KPreviewControllerRoute = isAllowedStep140KPreviewControllerRoute(file, text);
    const allowedStep140NSignedRequestBuilder = isAllowedStep140NSignedRequestBuilder(file, text);
    const allowedStep140OGuardedHttpClient = isAllowedStep140OGuardedHttpClient(file, text);
    const allowedStep140PRealPreviewNoPersistence = isAllowedStep140PRealPreviewNoPersistence(file, text);
    const allowedStep140QPreviewPersistence = isAllowedStep140QPreviewPersistence(file, text);
    const allowedStep140RTransactionCommit = isAllowedStep140RTransactionCommit(file, text);
    const allowedStep140SSkuResolutionAudit = isAllowedStep140SSkuResolutionAudit(file, text);
    const allowedStep140TInventoryDeduction = isAllowedStep140TInventoryDeduction(file, text);
    const hasAmazonOrdersContext =
      text.includes("amazon-sp-api") ||
      text.includes("AmazonSpApi") ||
      text.includes("AmazonOrders") ||
      text.includes("AmazonSpApiOrders") ||
      text.includes("orders/v0/orders") ||
      text.includes("STEP140-H") ||
      text.includes("step140-h");

    for (const pattern of routePatterns) {
      if (pattern.test(text) && !allowedSandbox && !allowedStep140IPureDryRunFixture && !allowedStep140JPreviewService && !allowedStep140KPreviewControllerRoute && !allowedStep140NSignedRequestBuilder && !allowedStep140OGuardedHttpClient && !allowedStep140PRealPreviewNoPersistence && !allowedStep140QPreviewPersistence && !allowedStep140RTransactionCommit && !allowedStep140SSkuResolutionAudit && !allowedStep140TInventoryDeduction) routeLeaks.push(rel);
    }

    if (hasAmazonOrdersContext && dryRunFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox && !allowedStep140IPureDryRunFixture && !allowedStep140JPreviewService && !allowedStep140KPreviewControllerRoute && !allowedStep140NSignedRequestBuilder && !allowedStep140OGuardedHttpClient && !allowedStep140PRealPreviewNoPersistence && !allowedStep140QPreviewPersistence && !allowedStep140RTransactionCommit && !allowedStep140SSkuResolutionAudit && !allowedStep140TInventoryDeduction) {
      dryRunLeaks.push(rel);
    }

    if (hasAmazonOrdersContext && controllerFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox && !allowedStep140IPureDryRunFixture && !allowedStep140JPreviewService && !allowedStep140KPreviewControllerRoute && !allowedStep140NSignedRequestBuilder && !allowedStep140OGuardedHttpClient && !allowedStep140PRealPreviewNoPersistence && !allowedStep140QPreviewPersistence && !allowedStep140RTransactionCommit && !allowedStep140SSkuResolutionAudit && !allowedStep140TInventoryDeduction) {
      controllerLeaks.push(rel);
    }

    if (hasAmazonOrdersContext && writeFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox && !allowedStep140IPureDryRunFixture && !allowedStep140JPreviewService && !allowedStep140KPreviewControllerRoute && !allowedStep140NSignedRequestBuilder && !allowedStep140OGuardedHttpClient && !allowedStep140PRealPreviewNoPersistence && !allowedStep140QPreviewPersistence && !allowedStep140RTransactionCommit && !allowedStep140SSkuResolutionAudit && !allowedStep140TInventoryDeduction) {
      writeLeaks.push(rel);
    }

    if (hasAmazonOrdersContext && networkFragments.some((fragment) => text.includes(fragment)) && !allowedSandbox && !allowedStep140IPureDryRunFixture && !allowedStep140JPreviewService && !allowedStep140KPreviewControllerRoute && !allowedStep140NSignedRequestBuilder && !allowedStep140OGuardedHttpClient && !allowedStep140PRealPreviewNoPersistence && !allowedStep140QPreviewPersistence && !allowedStep140RTransactionCommit && !allowedStep140SSkuResolutionAudit && !allowedStep140TInventoryDeduction) {
      networkLeaks.push(rel);
    }
  }

  for (const file of webFiles) {
    const text = read(file);
    const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");

    // Step140-N-FIX5-DIRECT-CONTINUE-STEP140L-API-HELPER:
    // Step140-L legally added the frontend API helper for the dry-run preview route.
    // It is allowed only when it remains dry-run-only and contains no commit/network/write/secrets markers.
    if (
      rel === "apps/web/src/core/imports/api.ts" &&
      text.includes("AmazonSpApiOrdersDryRunPreviewRequest") &&
      text.includes("AmazonSpApiOrdersDryRunPreviewResponse") &&
      text.includes("previewAmazonSpApiOrdersDryRun") &&
      text.includes("dryRun: true") &&
      text.includes("/api/imports/amazon-sp-api/orders/preview") &&
      !text.includes("commitAmazonSpApiOrders") &&
      !text.includes("orders/commit") &&
      !text.includes("getOrders(") &&
      !text.includes("getOrderItems(") &&
      !text.includes("importJob.create") &&
      !text.includes("transaction.create") &&
      !text.includes("inventoryMovement.create") &&
      !text.includes("inventoryBalance.update") &&
      !text.includes("AWS4-HMAC-SHA256") &&
      !text.includes("x-amz-access-token") &&
      !text.includes("refreshToken") &&
      !text.includes("clientSecret")
    ) {
      continue;
    }
    const hasAmazonOrdersFrontendContext =
      text.includes("amazon-sp-api-orders") ||
      text.includes("Amazon SP-API Orders") ||
      text.includes("orders/preview") ||
      text.includes("orders/commit") ||
      text.includes("STEP140-H") ||
      text.includes("step140-h");

    const allowedStep140LFrontendDryRunOrdersPreview =
      isAllowedStep140LFrontendDryRunOrdersPreview(file, text);

    const allowedStep140UProductionCloseoutPanel =
      isAllowedStep140UProductionCloseoutPanel(file, text);

    const allowedStep140LApiHelperDirect =
      rel === "apps/web/src/core/imports/api.ts" &&
      text.includes("AmazonSpApiOrdersDryRunPreviewRequest") &&
      text.includes("AmazonSpApiOrdersDryRunPreviewResponse") &&
      text.includes("previewAmazonSpApiOrdersDryRun") &&
      text.includes("dryRun: true") &&
      text.includes("/api/imports/amazon-sp-api/orders/preview") &&
      !text.includes("commitAmazonSpApiOrders") &&
      !text.includes("orders/commit") &&
      !text.includes("getOrders(") &&
      !text.includes("getOrderItems(") &&
      !text.includes("importJob.create") &&
      !text.includes("transaction.create") &&
      !text.includes("inventoryMovement.create") &&
      !text.includes("inventoryBalance.update") &&
      !text.includes("AWS4-HMAC-SHA256") &&
      !text.includes("x-amz-access-token") &&
      !text.includes("refreshToken") &&
      !text.includes("clientSecret");

    if (
      hasAmazonOrdersFrontendContext &&
      frontendFragments.some((fragment) => text.includes(fragment)) &&
      !allowedStep140LFrontendDryRunOrdersPreview &&
      !allowedStep140LApiHelperDirect &&
      !allowedStep140UProductionCloseoutPanel
    ) {
      frontendLeaks.push(rel);
    }
  }

  const schema = read(path.resolve(apiRoot, "prisma/schema.prisma"));
  const forbiddenSchemaMarkers = [
    "model AmazonOrdersDryRun",
    "model AmazonOrdersPreviewRoute",
    "model AmazonOrdersCommitRoute",
    "model AmazonSpApiOrdersPreview",
    "model AmazonSpApiOrdersCommit",
  ];

  for (const marker of forbiddenSchemaMarkers) {
    if (schema.includes(marker)) schemaLeaks.push(marker);
  }

  assert(routeLeaks.length === 0, `no Step140-H controller route implementation leak: ${JSON.stringify(routeLeaks)}`);
  assert(dryRunLeaks.length === 0, `no Step140-H dry-run fixture implementation leak: ${JSON.stringify(dryRunLeaks)}`);
  assert(controllerLeaks.length === 0, `no Step140-H preview/commit controller implementation leak: ${JSON.stringify(controllerLeaks)}`);
  // Step140-N-FIX9-SCOPE-STEP140L-API-HELPER-BLOCK:
  // apps/web/src/core/imports/api.ts is a shared frontend API file. It may contain unrelated helpers.
  // For Step140-H regression, only inspect the Step140-L dry-run Orders helper block, not the whole file.
  const safeStep140LFrontendLeaks = frontendLeaks.filter((rel) => {
    if (rel !== "apps/web/src/core/imports/api.ts") return true;

    const apiHelperSource = read(path.resolve(repoRoot, rel));
    const blockStart = apiHelperSource.indexOf("Step140-L-FRONTEND-AMAZON-SP-API-ORDERS-DRY-RUN-PREVIEW");
    const blockEnd = apiHelperSource.indexOf("export async function previewAmazonSpApiOrdersDryRun", blockStart);

    if (blockStart < 0 || blockEnd < 0) {
      return true;
    }

    const functionEnd = apiHelperSource.indexOf("\n}", blockEnd);
    const step140LBlock = apiHelperSource.slice(
      blockStart,
      functionEnd > blockEnd ? functionEnd + 2 : blockEnd + 1500,
    );

    const hasRequiredDryRunHelper =
      step140LBlock.includes("AmazonSpApiOrdersDryRunPreviewRequest") &&
      step140LBlock.includes("AmazonSpApiOrdersDryRunPreviewResponse") &&
      step140LBlock.includes("AMAZON_SP_API_ORDERS_DRY_RUN_PREVIEW_ENDPOINT") &&
      step140LBlock.includes("previewAmazonSpApiOrdersDryRun") &&
      step140LBlock.includes("/api/imports/amazon-sp-api/orders/preview") &&
      step140LBlock.includes("dryRun: true");

    const hasForbiddenDirectAmazonOrSecretMarker =
      step140LBlock.includes("commitAmazonSpApiOrders") ||
      step140LBlock.includes("orders/commit") ||
      step140LBlock.includes("getOrders(") ||
      step140LBlock.includes("getOrderItems(") ||
      step140LBlock.includes("AWS4-HMAC-SHA256") ||
      step140LBlock.includes("x-amz-access-token") ||
      step140LBlock.includes("refreshToken") ||
      step140LBlock.includes("clientSecret") ||
      step140LBlock.includes("importJob.create") ||
      step140LBlock.includes("transaction.create") ||
      step140LBlock.includes("inventoryMovement.create") ||
      step140LBlock.includes("inventoryBalance.update");

    return !(hasRequiredDryRunHelper && !hasForbiddenDirectAmazonOrSecretMarker);
  });

  assert(safeStep140LFrontendLeaks.length === 0, `no Step140-H frontend trigger implementation leak: ${JSON.stringify(safeStep140LFrontendLeaks)}`);
  assert(writeLeaks.length === 0, `no Step140-H database write leak: ${JSON.stringify(writeLeaks)}`);
  assert(networkLeaks.length === 0, `no Step140-H Amazon Orders network leak: ${JSON.stringify(networkLeaks)}`);
  assert(schemaLeaks.length === 0, `no Step140-H Prisma schema model leak: ${JSON.stringify(schemaLeaks)}`);

  return {
    scannedApiImplementationFiles: apiFiles.length,
    scannedWebFiles: webFiles.length,
    routeLeaks,
    dryRunLeaks,
    controllerLeaks,
    frontendLeaks,
    writeLeaks,
    networkLeaks,
    schemaLeaks,
  };
}

async function main() {
  const apiRoot = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(apiRoot, "..", "..");

  console.log("========== Step140-H Amazon SP-API Orders dry-run fixture smoke + controller route contract smoke ==========");

  const packageJson = JSON.parse(read(path.resolve(apiRoot, "package.json")));
  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-dry-run-fixture-controller-route-contract"] ===
      "node scripts/smoke-amazon-sp-api-orders-dry-run-fixture-controller-route-contract.js",
    "apps/api package.json registers Step140-H smoke",
  );

  assert(
    packageJson.scripts["smoke:amazon-sp-api-orders-preview-commit-service-contract"],
    "Step140-G preview commit regression smoke remains registered",
  );

  const step140GDtoSource = read(path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-orders-preview-commit-service-contract.dto.ts"));
  assert(step140GDtoSource.includes("readyForDryRunRuntimeFixtureSmoke: true"), "Step140-G allows dry-run fixture smoke contract");
  assert(step140GDtoSource.includes("readyForControllerRouteContract: true"), "Step140-G allows controller route contract");

  const dtoSource = read(path.resolve(apiRoot, "src/imports/dto/amazon-sp-api-orders-dry-run-fixture-controller-route-contract.dto.ts"));

  const requiredDtoMarkers = [
    "AMAZON_SP_API_ORDERS_DRY_RUN_FIXTURE_CONTROLLER_ROUTE_CONTRACT_VERSION",
    "buildAmazonSpApiOrdersDryRunFixtureControllerRouteContract",
    "assertAmazonSpApiOrdersDryRunFixtureControllerRouteContract",
    "assertAmazonSpApiOrdersPreviewCommitServiceContract",
    "design-amazon-sp-api-orders-dry-run-fixture-controller-route-contract-aggregate-only",
    "dryRunFixtureSmokeDesignOnly",
    "previewControllerRouteDesignOnly",
    "commitControllerRouteDesignOnly",
    "tenantStoreMarketplaceGuardDesignOnly",
    "importCenterVisibilityDesignOnly",
    "frontendTriggerReadinessDesignOnly",
    "usesSyntheticOrdersFixtureOnly",
    "validatesInventoryImpactPreviewShape",
    "pathWouldBeApiImportsAmazonSpApiOrdersPreview",
    "pathWouldBeApiImportsAmazonSpApiOrdersCommit",
    "requiresPreviewTokenOrSnapshot",
    "connectionStatusPanelWouldGateAction",
    "previewButtonWouldUseDryRunRoute",
    "commitButtonWouldRequireExplicitConfirm",
    "sourceRequired: 'amazon-sp-api-orders-dry-run-fixture-design-only'",
    "sampleOrderCount: 2",
    "sampleOrderItemCount: 3",
    "expectedControllerRouteNow: false",
    "readyForDryRunFixtureImplementationPlan",
    "readyForPreviewControllerImplementationPlan",
    "readyForImportCenterUiContract",
  ];

  for (const marker of requiredDtoMarkers) {
    assert(dtoSource.includes(marker), `Step140-H DTO marker exists: ${marker}`);
  }

  const forbiddenDtoMarkers = [
    "@Post(",
    "@Get(",
    "prisma.importJob.create",
    "prisma.importStagingRow.create",
    "prisma.transaction.create",
    "prisma.inventoryMovement.create",
    "fetch(",
    "axios.",
    "got(",
    "getOrders({",
    "getOrder({",
    "getOrderItems({",
  ];

  for (const marker of forbiddenDtoMarkers) {
    assert(!dtoSource.includes(marker), `Step140-H DTO does not contain implementation marker: ${marker}`);
  }

  const contract = assertAmazonSpApiOrdersDryRunFixtureControllerRouteContract(
    buildAmazonSpApiOrdersDryRunFixtureControllerRouteContract(),
  );

  assert(contract.step === "Step140-H", "contract step is Step140-H");
  assert(contract.contractOnly === true, "contract remains contract-only");
  assert(contract.dryRunRuntimeFixtureImplementationNow === false, "dry-run runtime implementation remains disabled");
  assert(contract.previewRouteImplementationNow === false, "preview route implementation remains disabled");
  assert(contract.commitRouteImplementationNow === false, "commit route implementation remains disabled");
  assert(contract.importCenterImplementationNow === false, "Import Center implementation remains disabled");
  assert(contract.frontendTriggerImplementationNow === false, "frontend trigger implementation remains disabled");
  assert(contract.writesDatabase === false, "contract writes no database");
  assert(contract.realAmazonOrdersApiCallNow === false, "real Amazon call remains disabled");
  assert(contract.sampleDryRunFixtureContract.expectedDryRun === true, "sample is dry-run");
  assert(contract.sampleDryRunFixtureContract.expectedWritesDatabase === false, "sample writes nothing");
  assert(contract.sampleDryRunFixtureContract.expectedAmazonNetworkCall === false, "sample does not call Amazon");
  assert(contract.forbiddenNow.controllerRoute === true, "controller route forbidden now");
  assert(contract.forbiddenNow.frontendPanel === true, "frontend panel forbidden now");
  assert(contract.forbiddenNow.importJobCreate === true, "ImportJob create forbidden now");
  assert(contract.forbiddenNow.transactionCreate === true, "Transaction create forbidden now");
  assert(contract.forbiddenNow.inventoryMovementCreate === true, "InventoryMovement create forbidden now");
  assert(contract.summary.readyForDryRunRuntimeFixtureImplementation === false, "dry-run implementation not allowed yet");
  assert(contract.summary.readyForControllerRouteImplementation === false, "controller route implementation not allowed yet");
  assert(contract.summary.readyForDryRunFixtureImplementationPlan === true, "dry-run implementation plan allowed next");
  assert(contract.summary.readyForPreviewControllerImplementationPlan === true, "preview controller implementation plan allowed next");
  assert(contract.summary.readyForImportCenterUiContract === true, "Import Center UI contract allowed next");

  const implementationGuard = assertNoStep140HImplementationLeak(repoRoot);

  console.log("[SMOKE_OK] Step140-H Amazon SP-API Orders dry-run fixture smoke + controller route contract smoke passed");
  console.log(JSON.stringify({ ok: true, step: "Step140-H", contract, implementationGuard }, null, 2));
}

main().catch((err) => {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
});
