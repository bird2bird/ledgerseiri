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
]) {
  if (panelBlock.includes(forbidden)) {
    throw new Error(`Step151-W-A table panel drifted into forbidden scope: ${forbidden}`);
  }
}

const packageJson = JSON.parse(fs.readFileSync(pkg, 'utf8'));
if (!packageJson.scripts['smoke:step151-w-a:data-import-amazon-orders-table-ui']) {
  throw new Error('package script missing for Step151-W-A UI smoke');
}

console.log('[OK] Step151-W-A Data Import Amazon orders table UI smoke passed.');
