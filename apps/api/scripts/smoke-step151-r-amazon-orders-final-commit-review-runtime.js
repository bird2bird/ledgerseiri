const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = {
  controller: path.join(root, 'src/imports/imports.controller.ts'),
  dto: path.join(root, 'src/imports/dto/amazon-sp-api-orders-final-commit-review-contract.dto.ts'),
  service: path.join(root, 'src/imports/amazon-sp-api-orders-final-commit-review.service.ts'),
};

function read(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`missing file: ${file}`);
  }
  return fs.readFileSync(file, 'utf8');
}

const controller = read(files.controller);
const dto = read(files.dto);
const service = read(files.service);

function mustContain(name, text, needle) {
  if (!text.includes(needle)) {
    throw new Error(`${name} missing marker: ${needle}`);
  }
}

mustContain('controller', controller, "amazon-sp-api/orders/final-commit-review");
mustContain('controller', controller, "reviewAmazonSpApiOrdersFinalCommit");
mustContain('controller', controller, "controllerWritesDatabase: false");
mustContain('controller', controller, "controllerWritesTransaction: false");
mustContain('controller', controller, "controllerWritesInventoryMovement: false");

mustContain('dto', dto, "requiresExplicitConfirmation: true");
mustContain('dto', dto, "finalCanCommit: boolean");
mustContain('dto', dto, "willCreateTransactionRows");
mustContain('dto', dto, "willCreateInventoryMovementRows");
mustContain('dto', dto, "writesDatabase !== false");
mustContain('dto', dto, "createsTransactionNow !== false");
mustContain('dto', dto, "createsInventoryMovementNow !== false");

mustContain('service', service, "projectAmazonSpApiOrdersCombinedDryRun");
mustContain('service', service, "writesDatabase: false");
mustContain('service', service, "transactionWriteNow: false");
mustContain('service', service, "inventoryWriteNow: false");
mustContain('service', service, "createsTransactionNow: false");
mustContain('service', service, "createsInventoryMovementNow: false");
mustContain('service', service, "historicalSyncNow: false");
mustContain('service', service, "transactionDraftsPreview");
mustContain('service', service, "inventoryDraftsPreview");

const writePatterns = [
  /prisma\.(transaction|inventoryMovement)\.(create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/,
  /runHistoricalSync\s*\(/,
  /runSegment\s*\(/,
  /createTransactionNow:\s*true/,
  /createsTransactionNow:\s*true/,
  /createsInventoryMovementNow:\s*true/,
  /writesDatabase:\s*true/,
];

for (const pattern of writePatterns) {
  if (pattern.test(service)) {
    throw new Error(`service violates Step151-R no-write boundary: ${pattern}`);
  }
  const routeStart = controller.indexOf("amazonSpApiOrdersFinalCommitReviewControllerRoute");
  const routeEnd = controller.indexOf("@UseGuards", routeStart + 1);
  const routeBlock = routeStart >= 0 ? controller.slice(routeStart, routeEnd > routeStart ? routeEnd : undefined) : "";
  if (pattern.test(routeBlock)) {
    throw new Error(`controller route violates Step151-R no-write boundary: ${pattern}`);
  }
}

console.log("[OK] Step151-R backend final commit review runtime contract smoke passed.");
