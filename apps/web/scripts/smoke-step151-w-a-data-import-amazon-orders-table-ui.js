const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const page = path.join(root, 'src/app/[lang]/app/data/import/page.tsx');
const pkg = path.join(root, 'package.json');

if (!fs.existsSync(page)) {
  throw new Error(`missing page: ${page}`);
}

const text = fs.readFileSync(page, 'utf8');

function mustContain(marker) {
  if (!text.includes(marker)) {
    throw new Error(`missing marker: ${marker}`);
  }
}

mustContain('data-import-amazon-orders-mf-style-table-panel');
mustContain('Step151-W-A-DATA-IMPORT-AMAZON-ORDERS-TABLE');
mustContain('displayOnly=true');
mustContain('writesDatabase=false');
mustContain('7D');
mustContain('30D');
mustContain('90D');
mustContain('365D');
mustContain('CUSTOM');
mustContain('data-import-amazon-orders-mf-style-filter-bar');
mustContain('data-import-amazon-orders-mf-style-range-preset');
mustContain('data-import-amazon-orders-mf-style-start-date');
mustContain('data-import-amazon-orders-mf-style-end-date');
mustContain('data-import-amazon-orders-mf-style-page-size');
mustContain('data-import-amazon-orders-mf-style-search-button');
mustContain('data-import-amazon-orders-mf-style-table');
mustContain('data-import-amazon-orders-mf-style-table-row');
mustContain('data-import-amazon-orders-mf-style-pagination');
mustContain('data-import-amazon-orders-mf-style-first-page');
mustContain('data-import-amazon-orders-mf-style-prev-page');
mustContain('data-import-amazon-orders-mf-style-next-page');
mustContain('data-import-amazon-orders-mf-style-last-page');
mustContain('AmazonOrdersPullRangePreset');
mustContain('"7D" | "30D" | "90D" | "365D" | "CUSTOM"');
mustContain('deriveAmazonOrdersPullDateRange');
mustContain('amazonOrdersImportedReadModelPageSize');
mustContain('handleAmazonOrdersImportedReadModelLastPage');
mustContain('amazonOrdersImportedReadModelContentSearch');
mustContain('handleAmazonOrdersImportedReadModelContentSearchChange');
mustContain('void refreshAmazonOrdersImportedReadModel(undefined, null, 1);');
mustContain('content: content || undefined');
mustContain('注文番号・SKU・商品名');

const panelStart = text.indexOf('data-import-amazon-orders-mf-style-table-panel');
const panelEnd = text.indexOf('data-import-connected-service-amazon-orders-execution-contract', panelStart);
const panelBlock = panelStart >= 0 ? text.slice(panelStart, panelEnd > panelStart ? panelEnd : undefined) : '';

for (const forbidden of [
  'commitAmazonSpApiOrdersIncomeTransactions',
  'transaction.create',
  'inventoryMovement.create',
  'inventoryBalance.create',
  'Expense Transaction',
  'settlementOrFeeImportNow: true',
  'bankReconciliationNow: true',
  'createsInventoryMovementNow: true',
  'createsExpenseTransactionNow: true',
  'bank reconciliation',
  'expense page linkage',
  'income page linkage',
]) {
  if (panelBlock.includes(forbidden)) {
    throw new Error(`Step151-W-A table panel drifted into forbidden scope: ${forbidden}`);
  }
}

const packageJson = JSON.parse(fs.readFileSync(pkg, 'utf8'));
if (!packageJson.scripts['smoke:step151-w-a:data-import-amazon-orders-table-ui']) {
  throw new Error('package script missing for Step151-W-A UI smoke');
}


function countOccurrences(haystack, needle) {
  return haystack.split(needle).length - 1;
}

const functionStart = text.indexOf('function AmazonOrdersConnectedServicesShell({');
const typeStart = text.indexOf('}: {', functionStart);
const functionParamBlock =
  functionStart >= 0 && typeStart > functionStart ? text.slice(functionStart, typeStart) : '';

for (const propName of [
  'onAmazonOrdersImportedReadModelPageSizeChange',
  'onAmazonOrdersImportedReadModelFirstPage',
  'onAmazonOrdersImportedReadModelPrevPage',
  'onAmazonOrdersImportedReadModelNextPage',
  'onAmazonOrdersImportedReadModelLastPage',
  'onAmazonOrdersImportedReadModelContentSearchChange',
]) {
  const occurrences = countOccurrences(functionParamBlock, propName);
  if (occurrences !== 1) {
    throw new Error(`AmazonOrdersConnectedServicesShell parameter ${propName} must appear exactly once, got ${occurrences}`);
  }
}

console.log('[OK] Step151-W-A Data Import Amazon orders table UI smoke passed.');
