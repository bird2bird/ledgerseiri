const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '../../..');
const page = fs.readFileSync(path.join(repo, 'apps/web/src/app/[lang]/app/data/import/page.tsx'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(repo, 'apps/web/package.json'), 'utf8'));

function must(text, marker, name) {
  if (!text.includes(marker)) {
    throw new Error(`${name} missing marker: ${marker}`);
  }
}

must(page, 'Step151-W-N', 'page');
must(page, 'async function refreshAmazonOrdersImportedReadModelWithFilterOverride', 'page');
must(page, 'Range changes must reload the full matched order list', 'page');
must(page, 'void refreshAmazonOrdersImportedReadModelWithFilterOverride({', 'page');
must(page, 'rangePreset: value', 'page');
must(page, 'limit: 5000', 'page');
must(page, 'setAmazonOrdersImportedReadModelList(list)', 'page');
must(page, 'setAmazonOrdersImportedReadModelPageIndex(args.pageIndex || 1)', 'page');

const handlerStart = page.indexOf('function handleAmazonOrdersPullRangePresetChange');
const handlerEnd = page.indexOf('function handleAmazonOrdersImportedReadModelPageSizeChange', handlerStart);
const handlerBlock = handlerStart >= 0 && handlerEnd > handlerStart ? page.slice(handlerStart, handlerEnd) : '';

if (!handlerBlock) {
  throw new Error('range preset handler block not found');
}

for (const marker of [
  'setAmazonOrdersPullRangePreset(value)',
  'setAmazonOrdersImportedReadModelPageIndex(1)',
  'setAmazonOrdersImportedReadModelCursorStack([null])',
  'refreshAmazonOrdersImportedReadModelWithFilterOverride',
]) {
  if (!handlerBlock.includes(marker)) {
    throw new Error(`range handler missing required marker: ${marker}`);
  }
}

for (const forbidden of [
  'limit: amazonOrdersImportedReadModelPageSize',
  'limit: pageSize',
]) {
  if (page.includes(forbidden)) {
    throw new Error(`page still has server page-size fetch pattern: ${forbidden}`);
  }
}

if (!pkg.scripts['smoke:step151-w-n:range-change-refetch-fix']) {
  throw new Error('package script missing for W-N smoke');
}

console.log('[OK] Step151-W-N range-change refetch smoke passed.');
