#!/usr/bin/env node

/**
 * Step151-K:
 * Runtime verify real-importjob DB persistence.
 *
 * This smoke verifies:
 * - real-importjob route/source boundary exists
 * - persistence helper creates ImportJob + ImportStagingRow
 * - Transaction and InventoryMovement counts remain unchanged
 * - response contains no raw access token / refresh token / AWS secret
 * - written ImportJob / ImportStagingRow are readable by the imported-orders read-model source/service contract
 *
 * It does not call real Amazon network.
 * It uses mocked transport for real-preview input.
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "../../..");
const apiRoot = path.join(repoRoot, "apps/api");

const controllerPath = path.join(apiRoot, "src/imports/imports.controller.ts");
const previewServicePath = path.join(apiRoot, "src/imports/amazon-sp-api-orders-real-preview.service.ts");
const persistenceServicePath = path.join(apiRoot, "src/imports/amazon-sp-api-orders-real-importjob-persistence.service.ts");
const readModelServicePath = path.join(apiRoot, "src/imports/amazon-imported-orders-read-model.readonly.service.ts");
const schemaPath = path.join(apiRoot, "prisma/schema.prisma");
const webApiPath = path.join(repoRoot, "apps/web/src/core/imports/api.ts");
const pagePath = path.join(repoRoot, "apps/web/src/app/[lang]/app/data/import/page.tsx");

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`);
  return fs.readFileSync(file, "utf8");
}

function assertIncludes(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`[FAIL] Missing ${label}: ${needle}`);
  console.log(`[OK] ${label}`);
}

function assertNotIncludes(source, needle, label) {
  if (source.includes(needle)) throw new Error(`[FAIL] Forbidden ${label}: ${needle}`);
  console.log(`[OK] ${label}`);
}

function extractRouteSectionByPostPath(source, postPath) {
  const marker = `@Post('${postPath}')`;
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`[FAIL] Route marker not found: ${marker}`);

  const decoratorStart = source.lastIndexOf("\n  @UseGuards", markerIndex);
  const sectionStart = decoratorStart >= 0 ? decoratorStart + 1 : markerIndex;
  const nextDecoratorRegex = /\n  @(Get|Post|Patch|Put|Delete)\('/g;
  nextDecoratorRegex.lastIndex = markerIndex + marker.length;
  const next = nextDecoratorRegex.exec(source);
  const sectionEnd = next && typeof next.index === "number" ? next.index : source.length;

  return source.slice(sectionStart, sectionEnd);
}

function assertNoForbiddenSecretMarkers(value, label) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  const forbidden = [
    "AT_SECRET_STEP151_K_SERVER_ONLY",
    "AWS_SECRET_STEP151_K_SERVER_ONLY",
    "SESSION_SECRET_STEP151_K_SERVER_ONLY",
    "PLAINTEXT_ACCESS_TOKEN",
    "PLAINTEXT_REFRESH_TOKEN",
    "RAW_ACCESS_TOKEN",
    "RAW_REFRESH_TOKEN",
    "AUTHORIZATION_CODE_SECRET",
    "RAW_LWA_RESPONSE_SECRET",
    "AKIASTEP151KSERVERONLY"
  ];

  for (const marker of forbidden) {
    if (text.includes(marker)) {
      throw new Error(`[FAIL] ${label} exposed forbidden secret marker: ${marker}`);
    }
  }

  console.log(`[OK] ${label} contains no forbidden secret markers`);
}

const controller = read(controllerPath);
const previewService = read(previewServicePath);
const persistenceService = read(persistenceServicePath);
const readModelService = read(readModelServicePath);
const schema = read(schemaPath);
const webApi = read(webApiPath);
const page = read(pagePath);

console.log("========== Step151-K source verification: real-importjob route ==========");

const realImportJobRouteSection = extractRouteSectionByPostPath(
  controller,
  "amazon-sp-api/orders/real-importjob"
);

assertIncludes(realImportJobRouteSection, "@UseGuards(JwtAuthGuard)", "real-importjob route is guarded");
assertIncludes(realImportJobRouteSection, "@Post('amazon-sp-api/orders/real-importjob')", "real-importjob POST route exists");
assertIncludes(realImportJobRouteSection, "amazonSpApiOrdersRealImportJobCommitControllerRoute", "real-importjob controller method exists");
assertIncludes(realImportJobRouteSection, "amazonSpApiOrdersRealPreviewControllerRoute", "route obtains real-preview first");
assertIncludes(realImportJobRouteSection, "persistAmazonSpApiOrdersRealPreviewToImportJobAndStagingRows", "route calls persistence helper");
assertIncludes(realImportJobRouteSection, "controllerWritesTransaction: false", "route marks no transaction write");
assertIncludes(realImportJobRouteSection, "controllerWritesInventory: false", "route marks no inventory write");

for (const forbidden of [
  "previewAmazonSpApiOrdersHistoricalSyncPlan",
  "runHistoricalSync",
  "inventoryMovement.create",
  "transaction.create",
]) {
  assertNotIncludes(realImportJobRouteSection, forbidden, `real-importjob route must not contain ${forbidden}`);
}

console.log("========== Step151-K source verification: persistence helper ==========");

assertIncludes(
  persistenceService,
  "export async function persistAmazonSpApiOrdersRealPreviewToImportJobAndStagingRows",
  "persistence helper export exists"
);
assertIncludes(persistenceService, "writesImportJob", "persistence helper reports writesImportJob");
assertIncludes(persistenceService, "writesImportStagingRow", "persistence helper reports writesImportStagingRow");
assertIncludes(persistenceService, "writesTransaction", "persistence helper reports writesTransaction boundary");
assertIncludes(persistenceService, "writesInventory", "persistence helper reports writesInventory boundary");

for (const forbidden of [
  "transaction.create",
  "inventoryMovement.create",
  "inventoryMovement.createMany",
  "transaction.createMany",
]) {
  assertNotIncludes(persistenceService, forbidden, `persistence helper must not contain ${forbidden}`);
}

console.log("========== Step151-K source verification: read-model route/service ==========");

assertIncludes(
  readModelService,
  "listAmazonImportedOrdersReadonly",
  "read-model list service exists"
);
assertIncludes(
  readModelService,
  "getAmazonImportedOrderDetailReadonly",
  "read-model detail service exists"
);
assertIncludes(
  webApi,
  "AMAZON_IMPORTED_ORDERS_READ_MODEL_ENDPOINT",
  "frontend imported orders read-model endpoint exists"
);
assertIncludes(
  webApi,
  "readsExistingImportJob: true",
  "read-model contract reads ImportJob"
);
assertIncludes(
  webApi,
  "readsExistingImportStagingRow: true",
  "read-model contract reads ImportStagingRow"
);
assertIncludes(
  webApi,
  "writesDatabase: false",
  "read-model contract is no-write"
);

console.log("========== Step151-K source verification: UI helper boundary ==========");

assertIncludes(page, "commitAmazonSpApiOrdersRealImportJob", "page calls real-importjob helper");
assertIncludes(page, "controllerWritesTransaction !== false", "page validates no Transaction write");
assertIncludes(page, "controllerWritesInventory !== false", "page validates no Inventory write");
assertNotIncludes(page, "previewAmazonSpApiOrdersHistoricalSyncPlan(", "page does not call historical sync");

console.log("========== Step151-K source verification: Prisma schema ==========");

for (const modelName of [
  "model ImportJob",
  "model ImportStagingRow",
  "model Transaction",
  "model InventoryMovement",
]) {
  assertIncludes(schema, modelName, `Prisma schema contains ${modelName}`);
}

console.log("========== Step151-K runtime verification ==========");

const runtimeTsPath = path.join(apiRoot, "tmp-step151-k-real-importjob-runtime.ts");

fs.writeFileSync(runtimeTsPath, `
import { PrismaClient } from '@prisma/client';
import { previewAmazonSpApiOrdersRealNoPersistence } from './src/imports/amazon-sp-api-orders-real-preview.service';
import { persistAmazonSpApiOrdersRealPreviewToImportJobAndStagingRows } from './src/imports/amazon-sp-api-orders-real-importjob-persistence.service';
import { listAmazonImportedOrdersReadonly, getAmazonImportedOrderDetailReadonly } from './src/imports/amazon-imported-orders-read-model.readonly.service';
import { verifyAmazonSpApiOrdersRealPreviewProductionReadiness } from './src/imports/amazon-sp-api-orders-real-preview-production.verifier';
import type { AmazonSpApiOrdersHttpTransport } from './src/imports/amazon-sp-api-orders-http.client';

const prisma = new PrismaClient();

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
  console.log('[OK]', message);
}

function assertFalse(value: unknown, label: string) {
  if (value !== false) {
    throw new Error(label + ' must be false; received=' + String(value));
  }
  console.log('[OK]', label, 'is false');
}

function assertNoForbiddenSecretMarkers(value: unknown, label: string) {
  const text = JSON.stringify(value);
  const forbidden = [
    'AT_SECRET_STEP151_K_SERVER_ONLY',
    'AWS_SECRET_STEP151_K_SERVER_ONLY',
    'SESSION_SECRET_STEP151_K_SERVER_ONLY',
    'PLAINTEXT_ACCESS_TOKEN',
    'PLAINTEXT_REFRESH_TOKEN',
    'RAW_ACCESS_TOKEN',
    'RAW_REFRESH_TOKEN',
    'AUTHORIZATION_CODE_SECRET',
    'RAW_LWA_RESPONSE_SECRET',
    'AKIASTEP151KSERVERONLY',
  ];

  for (const marker of forbidden) {
    if (text.includes(marker)) {
      throw new Error(label + ' exposed forbidden secret marker: ' + marker);
    }
  }

  console.log('[OK]', label, 'contains no forbidden secret markers');
}

function serializePrismaError(error: unknown) {
  const err = error as any;
  return {
    name: err?.name,
    code: err?.code,
    message: err?.message,
    meta: err?.meta,
    clientVersion: err?.clientVersion,
    stack: typeof err?.stack === 'string' ? String(err.stack).split(String.fromCharCode(10)).slice(0, 6).join(String.fromCharCode(10)) : null,
  };
}

async function rollbackImportJobCreateDiagnostic(prisma: PrismaClient, data: Record<string, unknown>) {
  try {
    await prisma.$transaction(async (tx) => {
      await (tx as any).importJob.create({ data });
      throw new Error('__ROLLBACK_STEP151_K_IMPORTJOB_CREATE_DIAG__');
    });
  } catch (error) {
    if (error instanceof Error && error.message === '__ROLLBACK_STEP151_K_IMPORTJOB_CREATE_DIAG__') {
      console.log('[ROLLBACK_IMPORTJOB_CREATE_DIAG]', JSON.stringify({
        ok: true,
        message: 'ImportJob.create succeeded inside rollback transaction.',
      }));
      return;
    }

    console.log('[ROLLBACK_IMPORTJOB_CREATE_DIAG]', JSON.stringify({
      ok: false,
      error: serializePrismaError(error),
      data,
    }));

    throw error;
  }
}

function createDiagnosticPrisma(prisma: PrismaClient) {
  const anyPrisma = prisma as any;

  return {
    importJob: {
      create: async (args: any) => {
        try {
          console.log('[IMPORTJOB_CREATE_ARGS]', JSON.stringify(args));
          const result = await anyPrisma.importJob.create(args);
          console.log('[IMPORTJOB_CREATE_OK]', JSON.stringify(result));
          return result;
        } catch (error) {
          console.log('[IMPORTJOB_CREATE_ERROR]', JSON.stringify({
            error: serializePrismaError(error),
            args,
          }));
          throw error;
        }
      },
    },
    importStagingRow: {
      createMany: async (args: any) => {
        try {
          console.log('[IMPORTSTAGINGROW_CREATEMANY_ARGS]', JSON.stringify({
            count: Array.isArray(args?.data) ? args.data.length : null,
            sample: Array.isArray(args?.data) ? args.data.slice(0, 2) : null,
          }));
          const result = await anyPrisma.importStagingRow.createMany(args);
          console.log('[IMPORTSTAGINGROW_CREATEMANY_OK]', JSON.stringify(result));
          return result;
        } catch (error) {
          console.log('[IMPORTSTAGINGROW_CREATEMANY_ERROR]', JSON.stringify({
            error: serializePrismaError(error),
            count: Array.isArray(args?.data) ? args.data.length : null,
            sample: Array.isArray(args?.data) ? args.data.slice(0, 2) : null,
          }));
          throw error;
        }
      },
    },
  };
}

async function countDb() {
  const anyPrisma = prisma as any;
  return {
    importJob: await anyPrisma.importJob.count(),
    importStagingRow: await anyPrisma.importStagingRow.count(),
    transaction: await anyPrisma.transaction.count(),
    inventoryMovement: await anyPrisma.inventoryMovement.count(),
  };
}

const runId = 'STEP151-K-' + Date.now();
let companyId = '';
let storeId = '';
const marketplaceId = 'A1VC38T7YXB528';
const region = 'FE';
const amazonOrderId = 'ORDER-' + runId;
const orderItemId = 'ITEM-' + runId + '-A';
const sellerSku = 'SKU-' + runId;

const transport: AmazonSpApiOrdersHttpTransport = async (request) => {
  if (request.operation === 'ListOrders') {
    return {
      status: 200,
      headers: {
        'x-amzn-requestid': 'STEP151-K-LIST-MOCKED',
      },
      bodyText: JSON.stringify({
        payload: {
          Orders: [
            {
              AmazonOrderId: amazonOrderId,
              PurchaseDate: '2026-05-18T01:00:00Z',
              LastUpdateDate: '2026-05-18T01:10:00Z',
              OrderStatus: 'Shipped',
              FulfillmentChannel: 'AFN',
              SalesChannel: 'Amazon.co.jp',
              MarketplaceId: marketplaceId,
              OrderTotal: { CurrencyCode: 'JPY', Amount: '3980' },
            },
          ],
        },
      }),
    };
  }

  if (request.operation === 'GetOrderItems') {
    return {
      status: 200,
      headers: {
        'x-amzn-requestid': 'STEP151-K-ITEMS-MOCKED',
      },
      bodyText: JSON.stringify({
        payload: {
          OrderItems: [
            {
              OrderItemId: orderItemId,
              ASIN: 'B0STEP151K1',
              SellerSKU: sellerSku,
              Title: 'Step151-K runtime persistence item',
              QuantityOrdered: 1,
              QuantityShipped: 1,
              ItemPrice: { CurrencyCode: 'JPY', Amount: '3980' },
              ItemTax: { CurrencyCode: 'JPY', Amount: '362' },
            },
          ],
        },
      }),
    };
  }

  throw new Error('Unexpected mocked transport operation: ' + request.operation);
};

async function main() {
  const anyPrisma = prisma as any;

  const existingCompany = await anyPrisma.company.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  if (!existingCompany?.id) {
    throw new Error('Step151-K requires at least one existing Company because ImportJob.companyId has a foreign-key constraint.');
  }

  companyId = existingCompany.id;

  const existingStore = await anyPrisma.store.findFirst({
    where: { companyId },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  storeId = existingStore?.id || ('store-step151-k-runtime-' + runId);

  console.log('[RUNTIME_SCOPE]', JSON.stringify({
    companyId,
    storeId,
    storeSource: existingStore?.id ? 'existing_store' : 'synthetic_payload_store_id',
  }));

  const before = await countDb();
  console.log('[DB_BEFORE]', JSON.stringify(before));

  const previewResult = await previewAmazonSpApiOrdersRealNoPersistence({
    companyId,
    storeId,
    marketplaceId,
    region,
    accessToken: 'AT_SECRET_STEP151_K_SERVER_ONLY',
    credentials: {
      accessKeyId: 'AKIASTEP151KSERVERONLY',
      secretAccessKey: 'AWS_SECRET_STEP151_K_SERVER_ONLY',
      sessionToken: 'SESSION_SECRET_STEP151_K_SERVER_ONLY',
    },
    createdAfter: '2026-05-18T00:00:00.000Z',
    createdBefore: '2026-05-18T23:59:59.999Z',
    maxResultsPerPage: 10,
    now: new Date('2026-05-18T12:00:00.000Z'),
    env: {
      AMAZON_SP_API_ORDERS_REAL_HTTP_ENABLED: 'true',
    },
    transport,
  });

  assertNoForbiddenSecretMarkers(previewResult, 'preview result');

  const productionVerification = verifyAmazonSpApiOrdersRealPreviewProductionReadiness({
    previewResult,
    transportMode: 'server-only-raw-signed',
    credentialSource: 'env',
    now: new Date('2026-05-18T12:00:00.000Z'),
  });

  console.log('[PRODUCTION_VERIFICATION]', JSON.stringify({
    accepted: productionVerification.accepted,
    reason: productionVerification.reason,
    canProceedToStep141BImportJobPersistence:
      productionVerification.productionReadiness?.canProceedToStep141BImportJobPersistence,
    transportMode: productionVerification.transportMode,
  }));

  assert(productionVerification.accepted === true, 'productionVerification.accepted=true');
  assert(
    productionVerification.productionReadiness?.canProceedToStep141BImportJobPersistence === true,
    'productionVerification canProceedToStep141BImportJobPersistence=true',
  );

  const diagnosticImportJobData = {
    companyId,
    domain: 'income',
    module: 'store-orders',
    sourceType: 'amazon-sp-api-orders',
    filename: 'step151-k-rollback-diagnostic-' + runId + '.json',
    fileHash: 'step151-k-rollback-diagnostic-' + runId,
    status: 'SUCCEEDED',
    totalRows: 1,
    successRows: 1,
    failedRows: 0,
    fileMonthsJson: ['2026-05'],
    conflictMonthsJson: [],
    importedAt: new Date('2026-05-18T12:00:00.000Z'),
  };

  await rollbackImportJobCreateDiagnostic(prisma, diagnosticImportJobData);

  const persisted = await persistAmazonSpApiOrdersRealPreviewToImportJobAndStagingRows({
    prisma: createDiagnosticPrisma(prisma),
    companyId,
    storeId,
    marketplaceId,
    region,
    previewResult,
    productionVerification,
    requestedBy: 'step151-k-runtime',
    now: new Date('2026-05-18T12:00:00.000Z'),
  });

  assertNoForbiddenSecretMarkers(persisted, 'persistence response');

  console.log('[PERSISTED]', JSON.stringify({
    accepted: persisted.accepted,
    reason: persisted.reason,
    importJobId: persisted.importJobId,
    totalRows: persisted.totalRows,
    successRows: persisted.successRows,
    failedRows: persisted.failedRows,
    boundaries: persisted.boundaries,
  }));

  assert(persisted.accepted === true, 'persistence accepted=true');
  assert(typeof persisted.importJobId === 'string' && persisted.importJobId.length > 0, 'importJobId returned');
  assert(persisted.boundaries?.writesImportJob === true, 'writesImportJob=true');
  assert(persisted.boundaries?.writesImportStagingRow === true, 'writesImportStagingRow=true');
  assertFalse(persisted.boundaries?.writesTransaction, 'boundaries.writesTransaction');
  assertFalse(persisted.boundaries?.writesInventoryMovement ?? persisted.boundaries?.writesInventory, 'boundaries.writesInventoryMovement');

  const after = await countDb();
  console.log('[DB_AFTER]', JSON.stringify(after));

  if (after.importJob !== before.importJob + 1) {
    throw new Error('ImportJob count must increase by 1; before=' + before.importJob + ' after=' + after.importJob);
  }
  console.log('[OK] ImportJob count increased by 1');

  if (after.importStagingRow <= before.importStagingRow) {
    throw new Error('ImportStagingRow count must increase; before=' + before.importStagingRow + ' after=' + after.importStagingRow);
  }
  console.log('[OK] ImportStagingRow count increased by', after.importStagingRow - before.importStagingRow);

  if (after.transaction !== before.transaction) {
    throw new Error('Transaction count must remain unchanged; before=' + before.transaction + ' after=' + after.transaction);
  }
  console.log('[OK] Transaction count unchanged');

  if (after.inventoryMovement !== before.inventoryMovement) {
    throw new Error('InventoryMovement count must remain unchanged; before=' + before.inventoryMovement + ' after=' + after.inventoryMovement);
  }
  console.log('[OK] InventoryMovement count unchanged');

  const importJob = await anyPrisma.importJob.findUnique({
    where: { id: persisted.importJobId },
  });

  assert(importJob, 'created ImportJob can be read by Prisma');
  assert(importJob.companyId === companyId, 'created ImportJob is company scoped');
  assert(importJob.sourceType === 'amazon-sp-api-orders', 'created ImportJob sourceType=amazon-sp-api-orders');

  const stagingRows = await anyPrisma.importStagingRow.findMany({
    where: {
      importJobId: persisted.importJobId,
    },
    orderBy: { rowNo: 'asc' },
  });

  assert(stagingRows.length > 0, 'created ImportStagingRows can be read by Prisma');
  assert(
    stagingRows.some((row: any) => JSON.stringify(row).includes(amazonOrderId)),
    'created staging rows contain Amazon order id',
  );

  const listReadModel = await listAmazonImportedOrdersReadonly({
    prisma,
    companyId,
    query: {
      orderId: amazonOrderId,
      limit: 10,
    },
  } as any);

  assertNoForbiddenSecretMarkers(listReadModel, 'list read-model response');

  assert(listReadModel.readOnly === true, 'list read-model is readOnly=true');
  assert(listReadModel.boundaries?.readsExistingImportJob === true, 'list read-model reads ImportJob');
  assert(listReadModel.boundaries?.readsExistingImportStagingRow === true, 'list read-model reads ImportStagingRow');
  assertFalse(listReadModel.boundaries?.writesDatabase, 'list read-model writesDatabase');

  const matchingOrder = Array.isArray(listReadModel.orders)
    ? listReadModel.orders.find((order: any) => order.orderId === amazonOrderId)
    : null;

  assert(matchingOrder, 'created Amazon order appears in imported orders read-model');
  assert(matchingOrder.importJobId === persisted.importJobId, 'read-model row links created ImportJob');

  const detailReadModel = await getAmazonImportedOrderDetailReadonly({
    prisma,
    companyId,
    orderId: amazonOrderId,
  } as any);

  assertNoForbiddenSecretMarkers(detailReadModel, 'detail read-model response');

  console.log('[DETAIL_READ_MODEL]', JSON.stringify({
    readOnly: detailReadModel.readOnly,
    orderId: detailReadModel.order?.orderId || detailReadModel.detail?.order?.orderId || null,
    detailIsNull: detailReadModel.detail === null,
    itemCount: Array.isArray(detailReadModel.items)
      ? detailReadModel.items.length
      : Array.isArray(detailReadModel.detail?.items)
        ? detailReadModel.detail.items.length
        : null,
    importJobId:
      detailReadModel.importMetadata?.importJobId ||
      detailReadModel.detail?.importMetadata?.importJobId ||
      null,
    keys: Object.keys(detailReadModel || {}),
  }));

  assert(detailReadModel.readOnly === true, 'detail read-model is readOnly=true');
  assert(detailReadModel.boundaries?.readsExistingImportJob === true, 'detail read-model reads ImportJob');
  assert(detailReadModel.boundaries?.readsExistingImportStagingRow === true, 'detail read-model reads ImportStagingRow');
  assertFalse(detailReadModel.boundaries?.writesDatabase, 'detail read-model writesDatabase');

  const detailOrderId = detailReadModel.order?.orderId || detailReadModel.detail?.order?.orderId;
  assert(detailOrderId === amazonOrderId, 'detail read-model returns created Amazon order');

  const detailItems = detailReadModel.items || detailReadModel.detail?.items || [];
  assert(Array.isArray(detailItems) && detailItems.length > 0, 'detail read-model returns created item rows');

  console.log('[OK] Step151-K runtime DB persistence verification passed.');
}

main()
  .catch((error) => {
    console.error('[FAIL]', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`);

if (fs.existsSync(runtimeTsPath)) {
  const generatedRuntime = fs.readFileSync(runtimeTsPath, "utf8");
  if (generatedRuntime.includes("split('\\n')") || generatedRuntime.includes("join('\\n')")) {
    throw new Error("Generated runtime TS contains fragile string newline escaping.");
  }
}

try {
  execFileSync(
    process.execPath,
    [
      "-r",
      "ts-node/register",
      "-r",
      "tsconfig-paths/register",
      runtimeTsPath,
    ],
    {
      cwd: apiRoot,
      stdio: "inherit",
      env: {
        ...process.env,
        TS_NODE_TRANSPILE_ONLY: "1",
        AMAZON_SP_API_ORDERS_REAL_PREVIEW_ROUTE_ENABLED: "true",
        AMAZON_SP_API_ORDERS_REAL_PREVIEW_TRANSPORT: "mocked",
      },
    }
  );
} finally {
  try {
    fs.unlinkSync(runtimeTsPath);
  } catch {}
}

console.log("========== Step151-K smoke result ==========");
console.log("[OK] Step151-K passed.");
console.log("[RESULT] ImportJob count increased.");
console.log("[RESULT] ImportStagingRow count increased.");
console.log("[RESULT] Transaction / InventoryMovement counts are unchanged.");
console.log("[RESULT] Persistence response is sanitized.");
console.log("[RESULT] Created ImportJob / ImportStagingRow are visible through imported orders read-model.");
