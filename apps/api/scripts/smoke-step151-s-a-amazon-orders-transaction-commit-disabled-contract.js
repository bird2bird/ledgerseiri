const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const files = {
  controller: path.join(root, 'src/imports/imports.controller.ts'),
  dto: path.join(root, 'src/imports/dto/amazon-sp-api-orders-transaction-commit-disabled-contract.dto.ts'),
  service: path.join(root, 'src/imports/amazon-sp-api-orders-transaction-commit.disabled.service.ts'),
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
const schema = read('schema');

mustContain('schema', schema, 'model Transaction');
mustContain('schema', schema, 'sourceType  TransactionSourceType');
mustContain('schema', schema, 'dedupeHash');
mustContain('schema', schema, 'importJobId');
mustContain('schema', schema, 'sourceRowNo');

mustContain('controller', controller, "@Post('amazon-sp-api/orders/transaction-commit')");
mustContain('controller', controller, 'amazonSpApiOrdersTransactionCommitDisabledControllerRoute');
mustContain('controller', controller, 'buildAmazonSpApiOrdersTransactionCommitDisabledResult');
mustContain('controller', controller, 'controllerWritesDatabase: false');
mustContain('controller', controller, 'controllerWritesTransaction: false');
mustContain('controller', controller, 'controllerWritesInventoryMovement: false');
mustContain('controller', controller, 'controllerCreatesTransactionNow: false');
mustContain('controller', controller, 'controllerCreatesInventoryMovementNow: false');
mustContain('controller', controller, 'controllerCreatesExpenseTransactionNow: false');

mustContain('dto', dto, 'AmazonSpApiOrdersTransactionCommitDisabledResult');
mustContain('dto', dto, "route: '/api/imports/amazon-sp-api/orders/transaction-commit'");
mustContain('dto', dto, 'disabled: true');
mustContain('dto', dto, 'accepted: false');
mustContain('dto', dto, 'requiresExplicitOperatorConfirmation: true');
mustContain('dto', dto, 'requiresFinalReviewAccepted: true');
mustContain('dto', dto, 'requiresFinalReviewCanCommit: true');
mustContain('dto', dto, 'wouldCreateIncomeTransactionRows');
mustContain('dto', dto, 'wouldLinkImportJob: true');
mustContain('dto', dto, 'wouldUseImportStagingRowsAsEvidence: true');
mustContain('dto', dto, 'wouldUseDedupeHash: true');
mustContain('dto', dto, 'createsExpenseTransactionNow: false');
mustContain('dto', dto, 'touchesInventoryNow: false');
mustContain('dto', dto, 'settlementOrFeeImportNow: false');
mustContain('dto', dto, 'bankReconciliationNow: false');

mustContain('service', service, 'reviewAmazonSpApiOrdersFinalCommit');
mustContain('service', service, 'wouldCreateTransactionRows: finalReview.willCreateTransactionRows');
mustContain('service', service, 'wouldCreateIncomeTransactionRows: finalReview.willCreateTransactionRows');
mustContain('service', service, 'writesDatabase: false');
mustContain('service', service, 'transactionWriteNow: false');
mustContain('service', service, 'inventoryWriteNow: false');
mustContain('service', service, 'createsTransactionNow: false');
mustContain('service', service, 'createsInventoryMovementNow: false');
mustContain('service', service, 'createsExpenseTransactionNow: false');
mustContain('service', service, 'historicalSyncNow: false');
mustContain('service', service, 'settlementOrFeeImportNow: false');
mustContain('service', service, 'bankReconciliationNow: false');

const controllerRouteStart = controller.indexOf('amazonSpApiOrdersTransactionCommitDisabledControllerRoute');
const controllerRouteEnd = controller.indexOf('@UseGuards', controllerRouteStart + 1);
const controllerRouteBlock =
  controllerRouteStart >= 0
    ? controller.slice(controllerRouteStart, controllerRouteEnd > controllerRouteStart ? controllerRouteEnd : undefined)
    : '';

const scannedBlocks = {
  controllerRouteBlock,
  service,
};

const forbiddenRegexes = [
  /prisma\.(transaction|inventoryMovement)\.(create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/,
  /prisma\.\$transaction\s*\(/,
  /createsTransactionNow:\s*true/,
  /transactionWriteNow:\s*true/,
  /inventoryWriteNow:\s*true/,
  /createsInventoryMovementNow:\s*true/,
  /createsExpenseTransactionNow:\s*true/,
  /touchesInventoryNow:\s*true/,
  /settlementOrFeeImportNow:\s*true/,
  /bankReconciliationNow:\s*true/,
  /runHistoricalSync\s*\(/,
  /runSegment\s*\(/,
];

for (const [name, block] of Object.entries(scannedBlocks)) {
  for (const pattern of forbiddenRegexes) {
    if (pattern.test(block)) {
      throw new Error(`${name} violates Step151-S-A disabled no-write boundary: ${pattern}`);
    }
  }
}

console.log('[OK] Step151-S-A transaction commit disabled contract smoke passed.');
