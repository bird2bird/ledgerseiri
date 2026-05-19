const fs = require('fs');
const path = require('path');

const webRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(webRoot, '../..');

const pagePath = path.join(webRoot, 'src/app/[lang]/app/data/import/page.tsx');
const apiReadModelPath = path.join(repoRoot, 'apps/api/src/imports/amazon-imported-orders-read-model.service.ts');
const webPackagePath = path.join(webRoot, 'package.json');

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`missing file: ${file}`);
  return fs.readFileSync(file, 'utf8');
}

function mustContain(name, text, marker) {
  if (!text.includes(marker)) throw new Error(`${name} missing marker: ${marker}`);
}

const page = read(pagePath);
const apiReadModel = read(apiReadModelPath);
const webPackage = JSON.parse(read(webPackagePath));

// Web table stability: clicking 取得 must not jump or clear the order table.
mustContain('page', page, 'Step151-W-I-PRESERVE-ORDERS-TABLE-ON-FETCH');
mustContain('page', page, 'Clicking 取得 must not clear');
mustContain('page', page, 'data-import-amazon-orders-mf-style-table-panel');

const fetchStart = page.indexOf('async function handleAmazonOrdersConnectedServiceFetchShell');
const fetchEnd = page.indexOf('async function handleAmazonOrdersRealPreviewShell', fetchStart);
const fetchBlock = fetchStart >= 0 && fetchEnd > fetchStart ? page.slice(fetchStart, fetchEnd) : '';

if (!fetchBlock) throw new Error('fetch handler block not found');

for (const forbidden of [
  'scrollIntoView',
  'setAmazonOrdersImportedReadModelList(null)',
  'setAmazonOrdersImportedReadModelDetail(null)',
  'setAmazonOrdersImportedReadModelSelectedOrderId("")',
]) {
  if (fetchBlock.includes(forbidden)) {
    throw new Error(`fetch handler must not clear/jump table: ${forbidden}`);
  }
}

// Refresh failure must preserve existing table.
const refreshStart = page.indexOf('async function refreshAmazonOrdersImportedReadModel');
const refreshEnd = page.indexOf('function handleAmazonOrdersPullRangePresetChange', refreshStart);
const refreshBlock = refreshStart >= 0 && refreshEnd > refreshStart ? page.slice(refreshStart, refreshEnd) : '';

if (!refreshBlock.includes('Step151-W-H') && !refreshBlock.includes('Step151-W-I')) {
  throw new Error('refresh handler missing preservation marker');
}

const catchStart = refreshBlock.indexOf('} catch (err) {');
const catchEnd = refreshBlock.indexOf('} finally {', catchStart);
const catchBlock = catchStart >= 0 && catchEnd > catchStart ? refreshBlock.slice(catchStart, catchEnd) : '';

for (const forbidden of [
  'setAmazonOrdersImportedReadModelList(null)',
  'setAmazonOrdersImportedReadModelDetail(null)',
  'setAmazonOrdersImportedReadModelSelectedOrderId("")',
]) {
  if (catchBlock.includes(forbidden)) {
    throw new Error(`refresh catch must preserve existing table: ${forbidden}`);
  }
}

// Backend stability after W-J:
// total count and page slice must be separate.
// pageSize must not define totalOrders.
mustContain('apiReadModel', apiReadModel, 'Step151-W-J');
mustContain('apiReadModel', apiReadModel, 'Total count and current page must be computed separately.');
mustContain('apiReadModel', apiReadModel, 'const totalOrders = allOrders.length;');
mustContain('apiReadModel', apiReadModel, 'const pageOrders = allOrders.slice(cursorOffset, cursorOffset + limit);');
mustContain('apiReadModel', apiReadModel, 'const summaryOrders = allOrders.map(toOrderRow);');
mustContain('apiReadModel', apiReadModel, 'hasMore = cursorOffset + limit < totalOrders');
mustContain('apiReadModel', apiReadModel, 'nextCursor = hasMore ? String(cursorOffset + limit) : null');

// Date fallback guards.
mustContain('apiReadModel', apiReadModel, 'amazonPurchaseDate');
mustContain('apiReadModel', apiReadModel, 'purchase_date');
mustContain('apiReadModel', apiReadModel, 'order_date');
mustContain('apiReadModel', apiReadModel, 'importedAtDate');

for (const forbidden of [
  'totalOrders: orders.length',
  'totalOrders: summaryOrders.length',
  'totalItems: orders.reduce',
  'const pageOrders = allOrders.slice(0, limit)',
  'const hasMore = allOrders.length > limit',
  'rowNo: { gt: cursorRowNo }',
  'take: Math.min(limit + 1, 101)',
]) {
  if (apiReadModel.includes(forbidden)) {
    throw new Error(`stale total/pagination/date pattern remains: ${forbidden}`);
  }
}

if (!webPackage.scripts['smoke:step151-w-i:orders-table-stability']) {
  throw new Error('package script missing for Step151-W-I smoke');
}

console.log('[OK] Step151-W-I/W-J orders table stability smoke passed.');
