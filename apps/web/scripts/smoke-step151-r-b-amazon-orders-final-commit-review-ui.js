const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const page = path.join(root, 'src/app/[lang]/app/data/import/page.tsx');
const pkg = path.join(root, 'package.json');

if (!fs.existsSync(page)) {
  throw new Error(`missing page: ${page}`);
}

const text = fs.readFileSync(page, 'utf8');

function mustContain(needle) {
  if (!text.includes(needle)) {
    throw new Error(`missing marker: ${needle}`);
  }
}

mustContain('readAmazonSpApiOrdersFinalCommitReview');
mustContain('AmazonSpApiOrdersFinalCommitReviewResponse');
mustContain('data-import-connected-service-amazon-orders-final-commit-review-panel');
mustContain('data-import-connected-service-amazon-orders-final-commit-review-refresh-button');
mustContain('data-import-connected-service-amazon-orders-final-commit-review-boundaries');
mustContain('data-import-connected-service-amazon-orders-final-commit-review-summary');
mustContain('data-import-connected-service-amazon-orders-final-commit-review-can-commit');
mustContain('data-import-connected-service-amazon-orders-final-commit-review-transaction-rows');
mustContain('data-import-connected-service-amazon-orders-final-commit-review-inventory-rows');
mustContain('data-import-connected-service-amazon-orders-final-commit-review-blockers');
mustContain('data-import-connected-service-amazon-orders-final-commit-review-no-write-notice');
mustContain('refreshAmazonOrdersFinalCommitReview');
mustContain('reviewOnly=true');
mustContain('writesDatabase=false');
mustContain('createsTransactionNow=false');
mustContain('createsInventoryMovementNow=false');
mustContain('requiresExplicitConfirmation=true');

const panelStart = text.indexOf('data-import-connected-service-amazon-orders-final-commit-review-panel');
const panelEnd = text.indexOf('Step151-O-TRANSACTION-DRY-RUN-PROJECTION-UI', panelStart);
const panel = panelStart >= 0 ? text.slice(panelStart, panelEnd > panelStart ? panelEnd : undefined) : '';

for (const forbidden of [
  'commitAmazonSpApiOrders',
  'real-importjob',
  'historical-sync',
  'transaction-commit',
  'inventory-commit',
  'createsTransactionNow=true',
  'createsInventoryMovementNow=true',
  'writesDatabase=true',
]) {
  if (panel.includes(forbidden)) {
    throw new Error(`final commit review UI panel contains forbidden execution marker: ${forbidden}`);
  }
}

const handlerStart = text.indexOf('async function refreshAmazonOrdersFinalCommitReview');
const handlerEnd = text.indexOf('async function handleAmazonOrdersRealImportJobCommitShell', handlerStart);
const handler = handlerStart >= 0 ? text.slice(handlerStart, handlerEnd > handlerStart ? handlerEnd : undefined) : '';

for (const forbidden of [
  'commitAmazonSpApiOrders',
  'commitAmazon',
  'real-importjob',
  'historical-sync',
]) {
  if (handler.includes(forbidden)) {
    throw new Error(`final commit review handler must not call execution endpoint: ${forbidden}`);
  }
}

const packageJson = JSON.parse(fs.readFileSync(pkg, 'utf8'));
if (!packageJson.scripts['smoke:step151-r-b:amazon-orders-final-commit-review-ui']) {
  throw new Error('package script missing for Step151-R-B UI smoke');
}

console.log('[OK] Step151-R-B final commit review UI smoke passed.');
