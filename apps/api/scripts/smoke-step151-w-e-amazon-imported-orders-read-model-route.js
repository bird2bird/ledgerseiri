const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const files = {
  controller: path.join(root, 'src/imports/imports.controller.ts'),
  service: path.join(root, 'src/imports/amazon-imported-orders-read-model.service.ts'),
  packageJson: path.join(root, 'package.json'),
};

function read(name) {
  const file = files[name];
  if (!fs.existsSync(file)) {
    throw new Error(`missing ${name}: ${file}`);
  }
  return fs.readFileSync(file, 'utf8');
}

function mustContain(name, text, marker) {
  if (!text.includes(marker)) {
    throw new Error(`${name} missing marker: ${marker}`);
  }
}

const controller = read('controller');
const service = read('service');

mustContain('controller', controller, "@Get('amazon-sp-api/orders/imported/read-model')");
mustContain('controller', controller, "@Get('amazon-sp-api/orders/imported/read-model/detail')");
mustContain('controller', controller, 'amazonImportedOrdersReadModelControllerRoute');
mustContain('controller', controller, 'amazonImportedOrderDetailReadModelControllerRoute');
mustContain('controller', controller, 'listAmazonImportedOrdersReadModel');
mustContain('controller', controller, 'getAmazonImportedOrderDetailReadModel');

mustContain('service', service, 'listAmazonImportedOrdersReadModel');
mustContain('service', service, 'getAmazonImportedOrderDetailReadModel');
mustContain('service', service, "source: 'amazon-imported-orders-read-model'");
mustContain('service', service, "source: 'amazon-imported-order-detail-read-model'");
mustContain('service', service, 'readsExistingImportJob: true');
mustContain('service', service, 'readsExistingImportStagingRow: true');
mustContain('service', service, 'callsAmazon: false');
mustContain('service', service, 'writesDatabase: false');
mustContain('service', service, 'writesTransaction: false');
mustContain('service', service, 'writesInventoryMovement: false');
mustContain('service', service, 'rangePreset');
mustContain('service', service, 'startDate');
mustContain('service', service, 'endDate');
mustContain('service', service, 'limit');

const routeStart = controller.indexOf('amazonImportedOrdersReadModelControllerRoute');
const routeEnd = controller.indexOf('@UseGuards', routeStart + 1);
const routeBlock =
  routeStart >= 0
    ? controller.slice(routeStart, routeEnd > routeStart ? routeEnd : undefined)
    : '';

const detailRouteStart = controller.indexOf('amazonImportedOrderDetailReadModelControllerRoute');
const detailRouteEnd = controller.indexOf('@UseGuards', detailRouteStart + 1);
const detailRouteBlock =
  detailRouteStart >= 0
    ? controller.slice(detailRouteStart, detailRouteEnd > detailRouteStart ? detailRouteEnd : undefined)
    : '';

if (!routeBlock || !detailRouteBlock) {
  throw new Error('Step151-W-E route blocks not found for scoped smoke check');
}

for (const [name, block] of Object.entries({ routeBlock, detailRouteBlock, service })) {
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
      throw new Error(`${name} violates Step151-W-E read-only display scope: ${pattern}`);
    }
  }
}

const pkg = JSON.parse(read('packageJson'));
if (!pkg.scripts['smoke:step151-w-e:amazon-imported-orders-read-model-route']) {
  throw new Error('package script missing for Step151-W-E smoke');
}

console.log('[OK] Step151-W-E imported orders read-model route smoke passed.');
