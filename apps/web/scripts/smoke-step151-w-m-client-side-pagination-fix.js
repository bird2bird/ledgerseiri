const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '../../..');
const page = fs.readFileSync(path.join(repo, 'apps/web/src/app/[lang]/app/data/import/page.tsx'), 'utf8');
const service = fs.readFileSync(path.join(repo, 'apps/api/src/imports/amazon-imported-orders-read-model.service.ts'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(repo, 'apps/web/package.json'), 'utf8'));

function must(text, marker, name) {
  if (!text.includes(marker)) throw new Error(`${name} missing marker: ${marker}`);
}

must(page, 'Step151-W-M', 'page');
must(page, 'Step151-W-M-FIX1', 'page');
must(page, 'const importedReadModelAllOrders = importedReadModelList?.orders ?? [];', 'page');
must(page, 'const importedReadModelOrders = importedReadModelAllOrders.slice', 'page');
must(page, 'amazonOrdersImportedReadModelPageIndex < amazonOrdersImportedReadModelTotalPages', 'page');
must(page, 'limit: 5000', 'page');
must(page, 'local pagination over the full matched order list', 'page');
must(page, '表示件数 changes only the local visible slice', 'page');

must(service, 'Math.min(Math.max(Number(args.limit || 20), 1), 5000)', 'service');
must(service, 'purchaseDate: normalizeDateOnly(order.purchaseDate || order.importedAt)', 'service');

for (const forbidden of [
  'limit: amazonOrdersImportedReadModelPageSize',
  'limit: pageSize',
  'importedReadModelList?.pagination?.hasMore === true &&',
  'Boolean(importedReadModelList?.pagination?.nextCursor)',
  'while (latest.pagination?.hasMore',
  'latest = await listAmazonImportedOrders({',
]) {
  if (page.includes(forbidden)) {
    throw new Error(`stale server-pagination pattern remains: ${forbidden}`);
  }
}

if (!pkg.scripts['smoke:step151-w-m:client-side-pagination-fix']) {
  throw new Error('package script missing for W-M smoke');
}

console.log('[OK] Step151-W-M-FIX1 client-side pagination fix smoke passed.');
