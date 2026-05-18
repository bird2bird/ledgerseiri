const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const files = {
  controller: path.join(root, 'src/imports/imports.controller.ts'),
  dto: path.join(root, 'src/imports/dto/amazon-sp-api-orders-transaction-commit-contract.dto.ts'),
  service: path.join(root, 'src/imports/amazon-sp-api-orders-transaction-commit.service.ts'),
  disabledService: path.join(root, 'src/imports/amazon-sp-api-orders-transaction-commit.disabled.service.ts'),
  schema: path.join(root, 'prisma/schema.prisma'),
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
const dto = read('dto');
const service = read('service');
const disabledService = read('disabledService');
const schema = read('schema');

mustContain('schema', schema, 'model Transaction');
mustContain('schema', schema, 'dedupeHash');
mustContain('schema', schema, 'importJobId');
mustContain('schema', schema, 'sourceRowNo');

mustContain('controller', controller, "@Post('amazon-sp-api/orders/transaction-commit')");
mustContain('controller', controller, 'amazonSpApiOrdersTransactionCommitControllerRoute');
mustContain('controller', controller, 'commitAmazonSpApiOrdersIncomeTransactions');
mustContain('controller', controller, 'controllerWritesDatabase: true');
mustContain('controller', controller, 'controllerWritesTransaction: true');
mustContain('controller', controller, 'controllerCreatesTransactionNow: true');
mustContain('controller', controller, 'controllerWritesInventoryMovement: false');
mustContain('controller', controller, 'controllerCreatesInventoryMovementNow: false');
mustContain('controller', controller, 'controllerCreatesExpenseTransactionNow: false');
mustContain('controller', controller, 'controllerTouchesInventoryNow: false');
mustContain('controller', controller, 'controllerSettlementOrFeeImportNow: false');
mustContain('controller', controller, 'controllerBankReconciliationNow: false');

mustContain('dto', dto, 'AmazonSpApiOrdersTransactionCommitResult');
mustContain('dto', dto, 'writesDatabase: true');
mustContain('dto', dto, 'transactionWriteNow: true');
mustContain('dto', dto, 'createsTransactionNow: true');
mustContain('dto', dto, 'inventoryWriteNow: false');
mustContain('dto', dto, 'createsInventoryMovementNow: false');
mustContain('dto', dto, 'createsExpenseTransactionNow: false');
mustContain('dto', dto, 'touchesInventoryNow: false');
mustContain('dto', dto, 'settlementOrFeeImportNow: false');
mustContain('dto', dto, 'bankReconciliationNow: false');
mustContain('dto', dto, 'createdTransactionRows');
mustContain('dto', dto, 'duplicateSkippedRows');

mustContain('service', service, 'reviewAmazonSpApiOrdersFinalCommit');
mustContain('service', service, 'previewAmazonSpApiOrdersStagingRowsIncomeTransactionsDryRun');
mustContain('service', service, 'projectAmazonSpApiOrdersReadyRowsToTransactionDryRun');
mustContain('service', service, 'finalReview.finalCanCommit !== true');
mustContain('service', service, 'args.prisma.transaction.findMany');
mustContain('service', service, 'args.prisma.$transaction');
mustContain('service', service, 'tx.transaction.create');
mustContain('service', service, "type: 'SALE'");
mustContain('service', service, "direction: 'INCOME'");
mustContain('service', service, "sourceType: 'STORE_ORDER'");
mustContain('service', service, 'dedupeHash');
mustContain('service', service, 'importJobId');
mustContain('service', service, 'sourceRowNo');
mustContain('service', service, 'productSku.findMany');
mustContain('service', service, 'storeId');
mustContain('service', service, 'createsInventoryMovementNow: false');
mustContain('service', service, 'createsExpenseTransactionNow: false');
mustContain('service', service, 'settlementOrFeeImportNow: false');
mustContain('service', service, 'bankReconciliationNow: false');

mustContain('disabledService', disabledService, 'writesDatabase: false');

const forbiddenServiceRegexes = [
  /inventoryMovement\.(create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/,
  /createsInventoryMovementNow:\s*true/,
  /inventoryWriteNow:\s*true/,
  /createsExpenseTransactionNow:\s*true/,
  /touchesInventoryNow:\s*true/,
  /settlementOrFeeImportNow:\s*true/,
  /bankReconciliationNow:\s*true/,
  /runHistoricalSync\s*\(/,
  /runSegment\s*\(/,
  /type:\s*'FBA_FEE'/,
  /type:\s*'AD'/,
  /type:\s*'REFUND'/,
  /direction:\s*'EXPENSE'/,
];

for (const pattern of forbiddenServiceRegexes) {
  if (pattern.test(service)) {
    throw new Error(`service violates Step151-S-B scope: ${pattern}`);
  }
}

const routeStart = controller.indexOf('amazonSpApiOrdersTransactionCommitControllerRoute');
const routeEnd = controller.indexOf('@UseGuards', routeStart + 1);
const routeBlock = routeStart >= 0 ? controller.slice(routeStart, routeEnd > routeStart ? routeEnd : undefined) : '';

for (const pattern of [
  /inventoryMovement\.(create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/,
  /createsInventoryMovementNow:\s*true/,
  /controllerWritesInventoryMovement:\s*true/,
  /controllerCreatesInventoryMovementNow:\s*true/,
  /controllerCreatesExpenseTransactionNow:\s*true/,
  /controllerTouchesInventoryNow:\s*true/,
  /controllerSettlementOrFeeImportNow:\s*true/,
  /controllerBankReconciliationNow:\s*true/,
]) {
  if (pattern.test(routeBlock)) {
    throw new Error(`controller route violates Step151-S-B scope: ${pattern}`);
  }
}

console.log('[OK] Step151-S-B transaction real-write contract smoke passed.');
