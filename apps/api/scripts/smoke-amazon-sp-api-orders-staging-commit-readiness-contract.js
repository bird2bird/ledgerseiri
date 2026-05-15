const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../..");
const controller = fs.readFileSync(
  path.join(root, "apps/api/src/imports/imports.controller.ts"),
  "utf8"
);
const service = fs.readFileSync(
  path.join(root, "apps/api/src/imports/amazon-sp-api-orders-staging-commit-readiness.service.ts"),
  "utf8"
);
const dto = fs.readFileSync(
  path.join(root, "apps/api/src/imports/dto/amazon-sp-api-orders-staging-commit-readiness-contract.dto.ts"),
  "utf8"
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  controller.includes("@Post('amazon-sp-api/orders/staging-commit-readiness')"),
  "readiness route is missing"
);
assert(controller.includes("@UseGuards(JwtAuthGuard)"), "JwtAuthGuard is required");
assert(controller.includes("STEP141_G1_DRY_RUN_ONLY"), "dry-run guard is missing");
assert(
  controller.includes("evaluateAmazonSpApiOrdersStagingCommitReadiness"),
  "controller must call readiness service"
);

assert(
  service.includes("writesDatabase: false") &&
    service.includes("transactionWriteNow: false") &&
    service.includes("inventoryWriteNow: false"),
  "write boundary markers missing"
);

assert(
  !service.includes(".create(") &&
    !service.includes(".createMany(") &&
    !service.includes(".update(") &&
    !service.includes(".updateMany(") &&
    !service.includes(".delete(") &&
    !service.includes(".deleteMany(") &&
    !service.includes(".upsert("),
  "readiness service must not contain Prisma write methods"
);

assert(
  service.includes("args.prisma.importJob.findFirst") &&
    service.includes("args.prisma.importStagingRow.findMany") &&
    service.includes("args.prisma.transaction.findMany") &&
    service.includes("args.prisma.inventoryMovement.findMany"),
  "expected read queries are missing"
);

assert(
  dto.includes("dryRun: true") &&
    dto.includes("writesDatabase: false") &&
    dto.includes("transactionWriteNow: false") &&
    dto.includes("inventoryWriteNow: false"),
  "DTO contract must encode dry-run write boundary"
);

assert(
  service.includes("MISSING_ORDER_IDENTITY") &&
    service.includes("MISSING_ITEM_PRICE_AMOUNT") &&
    service.includes("TRANSACTION_ALREADY_EXISTS_FOR_DEDUPE_HASH") &&
    service.includes("SKU_NOT_LINKED_TO_TARGET_ENTITY_YET") &&
    service.includes("SKU_LINKED_BY_PRODUCT_SKU_ALIAS"),
  "readiness blockers/warnings are incomplete"
);

assert(
  service.includes("args.prisma.productSkuAlias.findMany") &&
    service.includes("normalizeAmazonSellerSkuForAlias") &&
    service.includes("productSkuAliasByNormalizedAliasSku") &&
    service.includes("projectedTargetEntityId"),
  "alias-aware readiness projection is missing"
);

console.log("[OK] Step141-G1 staging commit readiness contract smoke passed");
