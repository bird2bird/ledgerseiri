#!/usr/bin/env node

/**
 * Step151-H FIX2:
 * Runtime verify real-preview response and no DB write.
 *
 * Important:
 * - Controller route checks use route-section extraction, not function-name + first-brace extraction.
 * - This avoids TypeScript inline parameter type braces such as:
 *   @Req() req: { user?: { id?: string; companyId?: string } }
 *
 * This smoke does not call real Amazon network and does not call real-importjob.
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "../../..");
const apiRoot = path.join(repoRoot, "apps/api");

const controllerPath = path.join(apiRoot, "src/imports/imports.controller.ts");
const servicePath = path.join(apiRoot, "src/imports/amazon-sp-api-orders-real-preview.service.ts");
const schemaPath = path.join(apiRoot, "prisma/schema.prisma");
const pagePath = path.join(repoRoot, "apps/web/src/app/[lang]/app/data/import/page.tsx");
const apiHelperPath = path.join(repoRoot, "apps/web/src/core/imports/api.ts");

function read(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing file: ${file}`);
  }
  return fs.readFileSync(file, "utf8");
}

function assertIncludes(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`[FAIL] Missing ${label}: ${needle}`);
  }
  console.log(`[OK] ${label}`);
}

function assertNotIncludes(source, needle, label) {
  if (source.includes(needle)) {
    throw new Error(`[FAIL] Forbidden ${label}: ${needle}`);
  }
  console.log(`[OK] ${label}`);
}

function assertRegex(source, regex, label) {
  if (!regex.test(source)) {
    throw new Error(`[FAIL] Missing ${label}: ${regex}`);
  }
  console.log(`[OK] ${label}`);
}

function extractRouteSectionByPostPath(source, postPath) {
  const marker = `@Post('${postPath}')`;
  const markerIndex = source.indexOf(marker);

  if (markerIndex < 0) {
    throw new Error(`[FAIL] Route marker not found: ${marker}`);
  }

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
    "AT_SECRET_STEP140_V_SERVER_ONLY_MOCKED_TRANSPORT",
    "AWS_SECRET_STEP140_V_SERVER_ONLY_MOCKED_TRANSPORT",
    "SESSION_SECRET_STEP140_V_SERVER_ONLY_MOCKED_TRANSPORT",
    "AT_SECRET_STEP151_H_SERVER_ONLY",
    "AWS_SECRET_STEP151_H_SERVER_ONLY",
    "SESSION_SECRET_STEP151_H_SERVER_ONLY",
    "PLAINTEXT_ACCESS_TOKEN",
    "PLAINTEXT_REFRESH_TOKEN",
    "RAW_ACCESS_TOKEN",
    "RAW_REFRESH_TOKEN",
    "AUTHORIZATION_CODE_SECRET",
    "RAW_LWA_RESPONSE_SECRET",
    "AKIASTEP140VSERVERONLY",
    "AKIASTEP151HSERVERONLY"
  ];

  for (const marker of forbidden) {
    if (text.includes(marker)) {
      throw new Error(`[FAIL] ${label} exposed forbidden secret marker: ${marker}`);
    }
  }

  console.log(`[OK] ${label} contains no forbidden secret markers`);
}

const controller = read(controllerPath);
const service = read(servicePath);
const schema = read(schemaPath);
const page = read(pagePath);
const apiHelper = read(apiHelperPath);

console.log("========== Step151-H FIX2 source verification: backend real-preview route ==========");

const realPreviewRouteSection = extractRouteSectionByPostPath(
  controller,
  "amazon-sp-api/orders/real-preview"
);

assertIncludes(realPreviewRouteSection, "@UseGuards(JwtAuthGuard)", "real-preview route is guarded by JwtAuthGuard");
assertIncludes(realPreviewRouteSection, "@Post('amazon-sp-api/orders/real-preview')", "real-preview POST route exists");
assertIncludes(realPreviewRouteSection, "async amazonSpApiOrdersRealPreviewControllerRoute", "real-preview controller method exists");
assertIncludes(realPreviewRouteSection, "assertAmazonSpApiOrdersRealPreviewRouteEnabled()", "real-preview route requires route env gate");
assertIncludes(realPreviewRouteSection, "previewAmazonSpApiOrdersRealNoPersistence", "real-preview route calls no-persistence preview service");
assertIncludes(realPreviewRouteSection, "controllerWritesDatabase: false", "real-preview route returns controllerWritesDatabase=false");
assertIncludes(realPreviewRouteSection, "importJobWriteNow: false", "real-preview route returns importJobWriteNow=false");
assertIncludes(realPreviewRouteSection, "importStagingRowWriteNow: false", "real-preview route returns importStagingRowWriteNow=false");
assertIncludes(realPreviewRouteSection, "transactionWriteNow: false", "real-preview route returns transactionWriteNow=false");
assertIncludes(realPreviewRouteSection, "inventoryWriteNow: false", "real-preview route returns inventoryWriteNow=false");

for (const forbidden of [
  "persistAmazonSpApiOrdersRealPreviewToImportJobAndStagingRows",
  "commitAmazonSpApiOrdersRealImportJob",
  "createMany",
  ".create(",
  ".update(",
  ".upsert(",
  ".delete(",
  "transaction.create",
  "inventoryMovement.create",
  "importJob.create",
  "importStagingRow.create",
]) {
  assertNotIncludes(
    realPreviewRouteSection,
    forbidden,
    `real-preview route must not contain ${forbidden}`
  );
}

console.log("========== Step151-H FIX2 source verification: real-importjob route is separate ==========");

const realImportJobRouteSection = extractRouteSectionByPostPath(
  controller,
  "amazon-sp-api/orders/real-importjob"
);

assertIncludes(realImportJobRouteSection, "@UseGuards(JwtAuthGuard)", "real-importjob route is guarded by JwtAuthGuard");
assertIncludes(realImportJobRouteSection, "@Post('amazon-sp-api/orders/real-importjob')", "real-importjob POST route exists");
assertIncludes(realImportJobRouteSection, "async amazonSpApiOrdersRealImportJobCommitControllerRoute", "real-importjob controller method exists");
assertIncludes(
  realImportJobRouteSection,
  "persistAmazonSpApiOrdersRealPreviewToImportJobAndStagingRows",
  "real-importjob route owns persistence path"
);
assertNotIncludes(
  realPreviewRouteSection,
  "persistAmazonSpApiOrdersRealPreviewToImportJobAndStagingRows",
  "real-preview route does not own persistence path"
);

console.log("========== Step151-H FIX2 source verification: no-persistence service ==========");

assertIncludes(service, "export async function previewAmazonSpApiOrdersRealNoPersistence", "no-persistence service export exists");
assertIncludes(service, "writesDatabase: false", "service returns writesDatabase=false");
assertIncludes(service, "importJobWriteNow: false", "service returns importJobWriteNow=false");
assertIncludes(service, "importStagingRowWriteNow: false", "service returns importStagingRowWriteNow=false");
assertIncludes(service, "transactionWriteNow: false", "service returns transactionWriteNow=false");
assertIncludes(service, "inventoryWriteNow: false", "service returns inventoryWriteNow=false");
assertIncludes(service, "realAmazonOrdersApiCall: true", "service marks realAmazonOrdersApiCall=true");
assertIncludes(service, "usesInjectedTransportOnly: true", "service uses injected transport only");
assertIncludes(service, "realNetworkDefaultDisabled: true", "service keeps real network default disabled");

console.log("========== Step151-H FIX2 source verification: Prisma delegates ==========");

for (const modelName of [
  "model ImportJob",
  "model ImportStagingRow",
  "model Transaction",
  "model InventoryMovement",
]) {
  assertIncludes(schema, modelName, `Prisma schema contains ${modelName}`);
}

console.log("========== Step151-H FIX2 source verification: frontend UI path ==========");

assertIncludes(page, "Step151-G-REAL-PREVIEW-NO-DB", "frontend Step151-G marker exists");
assertIncludes(page, "handleAmazonOrdersRealPreviewShell", "frontend real-preview click handler exists");
assertIncludes(page, "previewAmazonSpApiOrdersReal", "frontend calls real-preview helper");
assertIncludes(page, "response.writesDatabase !== false", "frontend validates writesDatabase=false");
assertIncludes(page, "response.importJobWriteNow !== false", "frontend validates importJobWriteNow=false");
assertIncludes(page, "response.transactionWriteNow !== false", "frontend validates transactionWriteNow=false");
assertIncludes(page, "response.inventoryWriteNow !== false", "frontend validates inventoryWriteNow=false");
assertNotIncludes(page, "previewAmazonSpApiOrdersHistoricalSyncPlan(", "frontend does not call historical sync");

console.log("========== Step151-H frontend boundary after Step151-J ==========");

function extractPageFunction(source, functionName) {
  const marker = `function ${functionName}`;
  const start = source.indexOf(marker);
  if (start < 0) {
    throw new Error(`[FAIL] Page function not found: ${functionName}`);
  }

  const braceStart = source.indexOf("{", start);
  if (braceStart < 0) {
    throw new Error(`[FAIL] Page function body not found: ${functionName}`);
  }

  let depth = 0;
  for (let i = braceStart; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }

  throw new Error(`[FAIL] Page function body did not close: ${functionName}`);
}

const fetchShellHandler = extractPageFunction(page, "handleAmazonOrdersConnectedServiceFetchShell");
const realPreviewHandler = extractPageFunction(page, "handleAmazonOrdersRealPreviewShell");
const realImportJobCommitHandler = page.includes("function handleAmazonOrdersRealImportJobCommitShell")
  ? extractPageFunction(page, "handleAmazonOrdersRealImportJobCommitShell")
  : "";

assertIncludes(fetchShellHandler, "preflightAmazonSpApiOrdersGuardedImport", "fetch handler still calls guarded preflight");
assertNotIncludes(fetchShellHandler, "previewAmazonSpApiOrdersReal", "fetch handler does not call real-preview");
assertNotIncludes(fetchShellHandler, "commitAmazonSpApiOrdersRealImportJob", "fetch handler does not call real-importjob");

assertIncludes(realPreviewHandler, "previewAmazonSpApiOrdersReal", "real-preview handler calls real-preview");
assertNotIncludes(realPreviewHandler, "commitAmazonSpApiOrdersRealImportJob", "real-preview handler does not call real-importjob");
assertNotIncludes(realPreviewHandler, "previewAmazonSpApiOrdersHistoricalSyncPlan", "real-preview handler does not call historical sync");

// Step151-J and later allow real-importjob only in the explicit confirmation handler.
// Step151-H remains a real-preview no-DB runtime smoke, so it checks layering instead of globally banning the symbol.
if (realImportJobCommitHandler) {
  assertIncludes(realImportJobCommitHandler, "commitAmazonSpApiOrdersRealImportJob", "confirmation handler may call real-importjob after Step151-J");
  assertNotIncludes(realImportJobCommitHandler, "previewAmazonSpApiOrdersHistoricalSyncPlan", "confirmation handler does not call historical sync");
  assertIncludes(realImportJobCommitHandler, "controllerWritesTransaction !== false", "confirmation handler validates no Transaction write");
  assertIncludes(realImportJobCommitHandler, "controllerWritesInventory !== false", "confirmation handler validates no Inventory write");
}

console.log("========== Step151-H FIX2 source verification: web API helper ==========");

assertIncludes(apiHelper, "export async function previewAmazonSpApiOrdersReal", "web api exports real-preview helper");
assertIncludes(apiHelper, "writesDatabase?: false", "real-preview type keeps writesDatabase=false");
assertIncludes(apiHelper, "importJobWriteNow?: false", "real-preview type keeps importJobWriteNow=false");
assertIncludes(apiHelper, "transactionWriteNow?: false", "real-preview type keeps transactionWriteNow=false");
assertIncludes(apiHelper, "inventoryWriteNow?: false", "real-preview type keeps inventoryWriteNow=false");

console.log("========== Step151-H FIX2 runtime verification: no-persistence service + DB counts ==========");

const runtimeTsPath = path.join(apiRoot, "tmp-step151-h-real-preview-runtime.ts");

fs.writeFileSync(runtimeTsPath, `
import { PrismaClient } from '@prisma/client';
import { previewAmazonSpApiOrdersRealNoPersistence } from './src/imports/amazon-sp-api-orders-real-preview.service';
import type { AmazonSpApiOrdersHttpTransport } from './src/imports/amazon-sp-api-orders-http.client';

const prisma = new PrismaClient();

function assertFalse(value: unknown, label: string) {
  if (value !== false) {
    throw new Error(label + ' must be false; received=' + String(value));
  }
  console.log('[OK]', label, 'is false');
}

function assertTrue(value: unknown, label: string) {
  if (value !== true) {
    throw new Error(label + ' must be true; received=' + String(value));
  }
  console.log('[OK]', label, 'is true');
}

function assertNoForbiddenSecretMarkers(value: unknown, label: string) {
  const text = JSON.stringify(value);
  const forbidden = [
    'AT_SECRET_STEP151_H_SERVER_ONLY',
    'AWS_SECRET_STEP151_H_SERVER_ONLY',
    'SESSION_SECRET_STEP151_H_SERVER_ONLY',
    'PLAINTEXT_ACCESS_TOKEN',
    'PLAINTEXT_REFRESH_TOKEN',
    'RAW_ACCESS_TOKEN',
    'RAW_REFRESH_TOKEN',
    'AUTHORIZATION_CODE_SECRET',
    'RAW_LWA_RESPONSE_SECRET',
    'AKIASTEP151HSERVERONLY',
  ];

  for (const marker of forbidden) {
    if (text.includes(marker)) {
      throw new Error(label + ' exposed forbidden secret marker: ' + marker);
    }
  }

  console.log('[OK]', label, 'contains no forbidden secret markers');
}

async function countDb() {
  const anyPrisma = prisma as any;
  const result: Record<string, number | 'delegate_missing'> = {};

  for (const [label, delegateName] of [
    ['importJob', 'importJob'],
    ['importStagingRow', 'importStagingRow'],
    ['transaction', 'transaction'],
    ['inventoryMovement', 'inventoryMovement'],
  ] as const) {
    const delegate = anyPrisma[delegateName];
    if (!delegate || typeof delegate.count !== 'function') {
      result[label] = 'delegate_missing';
    } else {
      result[label] = await delegate.count();
    }
  }

  return result;
}

function assertCountsUnchanged(
  before: Record<string, number | 'delegate_missing'>,
  after: Record<string, number | 'delegate_missing'>,
) {
  for (const key of Object.keys(before)) {
    if (before[key] === 'delegate_missing' || after[key] === 'delegate_missing') {
      throw new Error('Prisma delegate missing for count verification: ' + key);
    }
    if (before[key] !== after[key]) {
      throw new Error(key + ' count changed: before=' + before[key] + ' after=' + after[key]);
    }
    console.log('[OK]', key, 'count unchanged:', before[key]);
  }
}

const transport: AmazonSpApiOrdersHttpTransport = async (request) => {
  if (request.operation === 'ListOrders') {
    return {
      status: 200,
      headers: {
        'x-amzn-requestid': 'STEP151-H-LIST-MOCKED',
      },
      bodyText: JSON.stringify({
        payload: {
          Orders: [
            {
              AmazonOrderId: 'ORDER-STEP151-H-001',
              PurchaseDate: '2026-05-18T01:00:00Z',
              LastUpdateDate: '2026-05-18T01:10:00Z',
              OrderStatus: 'Shipped',
              FulfillmentChannel: 'AFN',
              SalesChannel: 'Amazon.co.jp',
              MarketplaceId: 'A1VC38T7YXB528',
              OrderTotal: { CurrencyCode: 'JPY', Amount: '2980' },
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
        'x-amzn-requestid': 'STEP151-H-ITEMS-MOCKED',
      },
      bodyText: JSON.stringify({
        payload: {
          OrderItems: [
            {
              OrderItemId: 'ITEM-STEP151-H-001-A',
              ASIN: 'B0STEP151H1',
              SellerSKU: 'SKU-STEP151-H-RUNTIME-NO-DB',
              Title: 'Step151-H runtime no DB item',
              QuantityOrdered: 1,
              QuantityShipped: 1,
              ItemPrice: { CurrencyCode: 'JPY', Amount: '2980' },
              ItemTax: { CurrencyCode: 'JPY', Amount: '271' },
            },
          ],
        },
      }),
    };
  }

  throw new Error('Unexpected mocked transport operation: ' + request.operation);
};

async function main() {
  const before = await countDb();
  console.log('[DB_BEFORE]', JSON.stringify(before));

  const result = await previewAmazonSpApiOrdersRealNoPersistence({
    companyId: 'cmp-step151-h-runtime',
    storeId: 'store-step151-h-runtime',
    marketplaceId: 'A1VC38T7YXB528',
    region: 'FE',
    accessToken: 'AT_SECRET_STEP151_H_SERVER_ONLY',
    credentials: {
      accessKeyId: 'AKIASTEP151HSERVERONLY',
      secretAccessKey: 'AWS_SECRET_STEP151_H_SERVER_ONLY',
      sessionToken: 'SESSION_SECRET_STEP151_H_SERVER_ONLY',
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

  assertNoForbiddenSecretMarkers(result, 'runtime real-preview result');

  if (!Array.isArray(result.normalizedOrders) || result.normalizedOrders.length !== 1) {
    throw new Error('expected exactly 1 normalized order');
  }
  console.log('[OK] normalizedOrders length is 1');

  if (!Array.isArray(result.normalizedOrderItems) || result.normalizedOrderItems.length !== 1) {
    throw new Error('expected exactly 1 normalized order item');
  }
  console.log('[OK] normalizedOrderItems length is 1');

  if (result.validationSummary?.totalOrders !== 1) {
    throw new Error('validationSummary.totalOrders must be 1');
  }
  console.log('[OK] validationSummary.totalOrders is 1');

  if (result.validationSummary?.totalOrderItems !== 1) {
    throw new Error('validationSummary.totalOrderItems must be 1');
  }
  console.log('[OK] validationSummary.totalOrderItems is 1');

  assertFalse(result.writesDatabase, 'writesDatabase');
  assertFalse(result.importJobWriteNow, 'importJobWriteNow');
  assertFalse(result.importStagingRowWriteNow, 'importStagingRowWriteNow');
  assertFalse(result.transactionWriteNow, 'transactionWriteNow');
  assertFalse(result.inventoryWriteNow, 'inventoryWriteNow');

  assertTrue(result.realAmazonOrdersApiCall, 'realAmazonOrdersApiCall');
  assertTrue(result.usesInjectedTransportOnly, 'usesInjectedTransportOnly');
  assertTrue(result.realNetworkDefaultDisabled, 'realNetworkDefaultDisabled');

  const after = await countDb();
  console.log('[DB_AFTER]', JSON.stringify(after));

  assertCountsUnchanged(before, after);

  console.log('[OK] Step151-H runtime no DB verification passed.');
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

console.log("========== Step151-H FIX2 smoke result ==========");
console.log("[OK] Step151-H passed.");
console.log("[RESULT] Backend real-preview route/source boundary is no-persistence.");
console.log("[RESULT] Real-importjob persistence route is separate.");
console.log("[RESULT] Frontend UI path calls real-preview only.");
console.log("[RESULT] Runtime real-preview response is sanitized.");
console.log("[RESULT] ImportJob / ImportStagingRow / Transaction / InventoryMovement counts are unchanged.");
