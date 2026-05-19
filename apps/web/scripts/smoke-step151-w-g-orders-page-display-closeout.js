const fs = require('fs');
const path = require('path');

const webRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(webRoot, '../..');
const pagePath = path.join(webRoot, 'src/app/[lang]/app/data/import/page.tsx');
const webPackagePath = path.join(webRoot, 'package.json');
const apiControllerPath = path.join(repoRoot, 'apps/api/src/imports/imports.controller.ts');
const apiReadModelPath = path.join(repoRoot, 'apps/api/src/imports/amazon-imported-orders-read-model.service.ts');

function read(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`missing file: ${file}`);
  }
  return fs.readFileSync(file, 'utf8');
}

function mustContain(name, text, marker) {
  if (!text.includes(marker)) {
    throw new Error(`${name} missing marker: ${marker}`);
  }
}

function mustNotContain(name, text, marker) {
  if (text.includes(marker)) {
    throw new Error(`${name} contains forbidden marker: ${marker}`);
  }
}

const page = read(pagePath);
const webPackage = JSON.parse(read(webPackagePath));
const apiController = read(apiControllerPath);
const apiReadModel = read(apiReadModelPath);

// ---------- Page display closeout anchors ----------
mustContain('page', page, 'data-import-amazon-orders-mf-style-table-panel');
mustContain('page', page, 'Amazon注文 明細一覧');
mustContain('page', page, 'data-import-amazon-orders-mf-style-filter-bar');
mustContain('page', page, 'data-import-amazon-orders-mf-style-service-select');
mustContain('page', page, 'data-import-amazon-orders-mf-style-range-preset');
mustContain('page', page, 'data-import-amazon-orders-mf-style-start-date');
mustContain('page', page, 'data-import-amazon-orders-mf-style-end-date');
mustContain('page', page, 'data-import-amazon-orders-mf-style-apply-range-button');
mustContain('page', page, 'data-import-amazon-orders-mf-style-page-size');
mustContain('page', page, 'data-import-amazon-orders-mf-style-content-search');
mustContain('page', page, 'data-import-amazon-orders-mf-style-search-button');
mustContain('page', page, 'data-import-amazon-orders-mf-style-selected-range');

// ---------- Required date range options ----------
for (const marker of ['7D', '30D', '90D', '365D', 'CUSTOM']) {
  mustContain('page', page, marker);
}

// ---------- Required page size options ----------
mustContain('page', page, 'value={20}');
mustContain('page', page, 'value={50}');
mustContain('page', page, 'value={100}');

// ---------- Table columns ----------
for (const marker of ['日付', '内容', '金額', '連携サービス', 'ステータス', '注文番号', '詳細']) {
  mustContain('page', page, marker);
}

// ---------- Pagination anchors ----------
mustContain('page', page, 'data-import-amazon-orders-mf-style-pagination');
mustContain('page', page, 'data-import-amazon-orders-mf-style-first-page');
mustContain('page', page, 'data-import-amazon-orders-mf-style-prev-page');
mustContain('page', page, 'data-import-amazon-orders-mf-style-next-page');
mustContain('page', page, 'data-import-amazon-orders-mf-style-last-page');
mustContain('page', page, 'handleAmazonOrdersImportedReadModelFirstPage');
mustContain('page', page, 'handleAmazonOrdersImportedReadModelPrevPage');
mustContain('page', page, 'handleAmazonOrdersImportedReadModelNextPage');
mustContain('page', page, 'handleAmazonOrdersImportedReadModelLastPage');

// ---------- Detail, empty, error states ----------
mustContain('page', page, 'data-import-amazon-orders-mf-style-detail-button');
mustContain('page', page, 'data-import-amazon-orders-mf-style-detail-panel');
mustContain('page', page, 'data-import-amazon-orders-mf-style-empty');
mustContain('page', page, 'data-import-amazon-orders-mf-style-error');
mustContain('page', page, 'まだ注文明細がありません');

// ---------- Fetch / display / search semantics ----------
mustContain('page', page, 'onFetchShell');
mustContain('page', page, 'handleAmazonOrdersConnectedServiceFetchShell');
mustContain('page', page, 'handleAmazonOrdersRealImportJobCommitShell');
mustContain('page', page, 'onImportedReadModelRefresh');
mustContain('page', page, 'onAmazonOrdersImportedReadModelContentSearchChange');
mustContain('page', page, 'deriveAmazonOrdersPullDateRange');
mustContain('page', page, 'await refreshAmazonOrdersImportedReadModel(undefined, null, 1);');
mustContain('page', page, 'Step151-W-H');
mustContain('page', page, 'Keep the currently displayed ImportJob / ImportStagingRow order table visible');

// ---------- Read model route anchors ----------
mustContain('apiController', apiController, "@Get('amazon-sp-api/orders/imported/read-model')");
mustContain('apiController', apiController, "@Get('amazon-sp-api/orders/imported/read-model/detail')");
mustContain('apiController', apiController, 'amazonImportedOrdersReadModelControllerRoute');
mustContain('apiController', apiController, 'amazonImportedOrderDetailReadModelControllerRoute');
mustContain('apiReadModel', apiReadModel, 'listAmazonImportedOrdersReadModel');
mustContain('apiReadModel', apiReadModel, 'getAmazonImportedOrderDetailReadModel');
mustContain('apiReadModel', apiReadModel, 'readsExistingImportJob: true');
mustContain('apiReadModel', apiReadModel, 'readsExistingImportStagingRow: true');
mustContain('apiReadModel', apiReadModel, 'callsAmazon: false');
mustContain('apiReadModel', apiReadModel, 'writesDatabase: false');
mustContain('apiReadModel', apiReadModel, 'writesTransaction: false');
mustContain('apiReadModel', apiReadModel, 'writesInventoryMovement: false');

// ---------- Narrow forbidden-scope checks ----------
const tablePanelStart = page.indexOf('data-import-amazon-orders-mf-style-table-panel');
const tablePanelEnd = page.indexOf('data-import-connected-service-amazon-orders-execution-contract', tablePanelStart);
const tablePanelBlock =
  tablePanelStart >= 0
    ? page.slice(tablePanelStart, tablePanelEnd > tablePanelStart ? tablePanelEnd : undefined)
    : '';

for (const forbidden of [
  'commitAmazonSpApiOrdersIncomeTransactions',
  'transaction.create',
  'inventoryMovement.create',
  'inventoryBalance.create',
  'Expense Transaction',
  'bankReconciliationNow: true',
  'createsInventoryMovementNow: true',
  'createsExpenseTransactionNow: true',
]) {
  if (tablePanelBlock.includes(forbidden)) {
    throw new Error(`table panel drifted into forbidden scope: ${forbidden}`);
  }
}

for (const [name, block] of Object.entries({ apiReadModel })) {
  for (const pattern of [
    /transaction\.(create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/,
    /inventoryMovement\.(create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/,
    /inventoryBalance\.(create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/,
    /bankReconciliation/i,
    /commitAmazonSpApiOrdersIncomeTransactions/,
    /writesDatabase:\s*true/,
    /writesTransaction:\s*true/,
    /writesInventoryMovement:\s*true/,
  ]) {
    if (pattern.test(block)) {
      throw new Error(`${name} violates Step151-W-G read-only display closeout: ${pattern}`);
    }
  }
}

if (!webPackage.scripts['smoke:step151-w-g:orders-page-display-closeout']) {
  throw new Error('package script missing for Step151-W-G closeout smoke');
}


// Step151-W-H refresh catch must not clear table.
// The read-model refresh catch block must preserve existing list/detail/selection.
const refreshStart = page.indexOf('async function refreshAmazonOrdersImportedReadModel');
const refreshEnd = page.indexOf('function handleAmazonOrdersPullRangePresetChange', refreshStart);
const refreshBlock =
  refreshStart >= 0 && refreshEnd > refreshStart ? page.slice(refreshStart, refreshEnd) : '';

if (!refreshBlock.includes('Step151-W-H')) {
  throw new Error('Step151-W-H preservation marker missing in refreshAmazonOrdersImportedReadModel');
}

const refreshCatchStart = refreshBlock.indexOf('} catch (err) {');
const refreshCatchEnd = refreshBlock.indexOf('} finally {', refreshCatchStart);
const refreshCatchBlock =
  refreshCatchStart >= 0 && refreshCatchEnd > refreshCatchStart
    ? refreshBlock.slice(refreshCatchStart, refreshCatchEnd)
    : '';

for (const forbiddenClear of [
  'setAmazonOrdersImportedReadModelList(null)',
  'setAmazonOrdersImportedReadModelDetail(null)',
  'setAmazonOrdersImportedReadModelSelectedOrderId("")',
]) {
  if (refreshCatchBlock.includes(forbiddenClear)) {
    throw new Error(`Step151-W-H drift: refresh catch must not clear table via ${forbiddenClear}`);
  }
}

console.log('[OK] Step151-W-G orders page display closeout smoke passed.');
