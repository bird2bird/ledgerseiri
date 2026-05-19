const fs = require('fs');
const path = require('path');

const webRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(webRoot, '../..');
const apiReadModelPath = path.join(repoRoot, 'apps/api/src/imports/amazon-imported-orders-read-model.service.ts');
const webPackagePath = path.join(webRoot, 'package.json');

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`missing file: ${file}`);
  return fs.readFileSync(file, 'utf8');
}

function mustContain(name, text, marker) {
  if (!text.includes(marker)) throw new Error(`${name} missing marker: ${marker}`);
}

const apiReadModel = read(apiReadModelPath);
const webPackage = JSON.parse(read(webPackagePath));

mustContain('apiReadModel', apiReadModel, 'Step151-W-J');
mustContain('apiReadModel', apiReadModel, 'Total count and current page must be computed separately.');
mustContain('apiReadModel', apiReadModel, 'const totalOrders = allOrders.length;');
mustContain('apiReadModel', apiReadModel, 'const pageOrders = allOrders.slice(cursorOffset, cursorOffset + limit);');
mustContain('apiReadModel', apiReadModel, 'const summaryOrders = allOrders.map(toOrderRow);');
mustContain('apiReadModel', apiReadModel, 'totalOrders,');
mustContain('apiReadModel', apiReadModel, 'hasMore = cursorOffset + limit < totalOrders');
mustContain('apiReadModel', apiReadModel, 'nextCursor = hasMore ? String(cursorOffset + limit) : null');
mustContain('apiReadModel', apiReadModel, 'amazonPurchaseDate');
mustContain('apiReadModel', apiReadModel, 'purchase_date');
mustContain('apiReadModel', apiReadModel, 'order_date');
mustContain('apiReadModel', apiReadModel, 'importedAtDate');

for (const forbidden of [
  'totalOrders: orders.length',
  'totalOrders: summaryOrders.length',
  'const pageOrders = allOrders.slice(0, limit)',
  'const hasMore = allOrders.length > limit',
  'rowNo: { gt: cursorRowNo }',
  'take: Math.min(limit + 1, 101)',
]) {
  if (apiReadModel.includes(forbidden)) {
    throw new Error(`Step151-W-J forbidden stale pagination/total pattern remains: ${forbidden}`);
  }
}

if (!webPackage.scripts['smoke:step151-w-j:total-pagination-dates']) {
  throw new Error('package script missing for Step151-W-J smoke');
}

console.log('[OK] Step151-W-J total/pagination/date smoke passed.');
