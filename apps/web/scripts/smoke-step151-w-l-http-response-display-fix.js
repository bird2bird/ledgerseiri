const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '../../..');
const page = fs.readFileSync(path.join(repo, 'apps/web/src/app/[lang]/app/data/import/page.tsx'), 'utf8');
const api = fs.readFileSync(path.join(repo, 'apps/web/src/core/imports/api.ts'), 'utf8');
const service = fs.readFileSync(path.join(repo, 'apps/api/src/imports/amazon-imported-orders-read-model.service.ts'), 'utf8');

function must(text, marker, name) {
  if (!text.includes(marker)) throw new Error(`${name} missing marker: ${marker}`);
}

must(service, 'Step151-W-L', 'service');
must(service, 'runtimeDebug', 'service');
must(service, 'groupedOrders: totalOrders', 'service');
must(service, 'visibleOrders: orders.length', 'service');
must(service, 'totalOrdersStableByDesign: true', 'service');
must(service, 'totalPages', 'service');
must(service, 'currentPage', 'service');
must(service, 'missingDateOrders', 'service');

must(api, 'runtimeDebug?', 'api types');
must(api, 'totalPages?', 'api types');
must(api, 'currentPage?', 'api types');

must(page, 'data-import-amazon-orders-mf-style-runtime-debug', 'page');
must(page, 'async function refreshAmazonOrdersImportedReadModelWithPageSize', 'page');
must(page, 'void refreshAmazonOrdersImportedReadModelWithPageSize(value, null, 1);', 'page');
must(page, 'importedReadModelList?.pagination?.totalPages', 'page');

for (const forbidden of [
  'totalOrders: orders.length',
  'totalOrders: summaryOrders.length',
  'const totalOrders = orders.length',
]) {
  if (service.includes(forbidden)) {
    throw new Error(`forbidden stale total pattern remains: ${forbidden}`);
  }
}

console.log('[OK] Step151-W-L HTTP/display source guard passed.');
