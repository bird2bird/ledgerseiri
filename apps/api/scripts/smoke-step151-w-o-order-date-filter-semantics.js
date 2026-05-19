const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '../../..');
const servicePath = path.join(repo, 'apps/api/src/imports/amazon-imported-orders-read-model.service.ts');
const service = fs.readFileSync(servicePath, 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(repo, 'apps/api/package.json'), 'utf8'));

function must(marker) {
  if (!service.includes(marker)) {
    throw new Error(`missing marker: ${marker}`);
  }
}

must('Step151-W-O');
must('function extractAmazonOrderFilterDate');
must('ImportJob.importedAt is only an import timestamp');
must('const amazonOrderFilterDate');
must('const displayDate = amazonOrderFilterDate || importedAtDate');
must('if (!amazonOrderFilterDate) continue;');
must('if (amazonOrderFilterDate < dateRange.startDate || amazonOrderFilterDate > dateRange.endDate) continue;');
must('filterDate: amazonOrderFilterDate');

const badPattern = /if\s*\(\s*fallbackDate\s*&&\s*\(fallbackDate\s*</;
if (badPattern.test(service)) {
  throw new Error('stale fallbackDate filter remains');
}

if (!pkg.scripts['smoke:step151-w-o:order-date-filter-semantics']) {
  throw new Error('package script missing');
}

console.log('[OK] Step151-W-O order date filter semantics smoke passed.');
