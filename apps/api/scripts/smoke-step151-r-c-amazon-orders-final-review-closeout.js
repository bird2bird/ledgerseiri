const fs = require("fs");
const path = require("path");

const repo = path.resolve(__dirname, "../../..");
const api = path.join(repo, "apps/api");
const web = path.join(repo, "apps/web");

const files = {
  controller: path.join(api, "src/imports/imports.controller.ts"),
  finalReviewService: path.join(api, "src/imports/amazon-sp-api-orders-final-commit-review.service.ts"),
  finalReviewDto: path.join(api, "src/imports/dto/amazon-sp-api-orders-final-commit-review-contract.dto.ts"),
  combinedService: path.join(api, "src/imports/amazon-sp-api-orders-combined-dry-run-projection.service.ts"),
  webApi: path.join(web, "src/core/imports/api.ts"),
  importPage: path.join(web, "src/app/[lang]/app/data/import/page.tsx"),
  apiPackage: path.join(api, "package.json"),
  webPackage: path.join(web, "package.json"),
};

function read(name) {
  const file = files[name];
  if (!fs.existsSync(file)) {
    throw new Error(`missing ${name}: ${file}`);
  }
  return fs.readFileSync(file, "utf8");
}

function mustContain(name, text, marker) {
  if (!text.includes(marker)) {
    throw new Error(`${name} missing marker: ${marker}`);
  }
}

function mustNotContain(name, text, marker) {
  if (text.includes(marker)) {
    throw new Error(`${name} contains forbidden marker: ${marker}`);
  }
}

const controller = read("controller");
const finalReviewService = read("finalReviewService");
const finalReviewDto = read("finalReviewDto");
const combinedService = read("combinedService");
const webApi = read("webApi");
const importPage = read("importPage");
const apiPackage = JSON.parse(read("apiPackage"));
const webPackage = JSON.parse(read("webPackage"));

/**
 * Backend route / service / DTO existence.
 */
mustContain("controller", controller, "@Post('amazon-sp-api/orders/final-commit-review')");
mustContain("controller", controller, "amazonSpApiOrdersFinalCommitReviewControllerRoute");
mustContain("controller", controller, "reviewAmazonSpApiOrdersFinalCommit");
mustContain("controller", controller, "controllerWritesDatabase: false");
mustContain("controller", controller, "controllerWritesTransaction: false");
mustContain("controller", controller, "controllerWritesInventoryMovement: false");
mustContain("controller", controller, "controllerCreatesTransactionNow: false");
mustContain("controller", controller, "controllerCreatesInventoryMovementNow: false");

mustContain("finalReviewService", finalReviewService, "projectAmazonSpApiOrdersCombinedDryRun");
mustContain("finalReviewService", finalReviewService, "finalCanCommit");
mustContain("finalReviewService", finalReviewService, "requiresExplicitConfirmation: true");
mustContain("finalReviewService", finalReviewService, "writesDatabase: false");
mustContain("finalReviewService", finalReviewService, "transactionWriteNow: false");
mustContain("finalReviewService", finalReviewService, "inventoryWriteNow: false");
mustContain("finalReviewService", finalReviewService, "createsTransactionNow: false");
mustContain("finalReviewService", finalReviewService, "createsInventoryMovementNow: false");
mustContain("finalReviewService", finalReviewService, "historicalSyncNow: false");

mustContain("finalReviewDto", finalReviewDto, "AmazonSpApiOrdersFinalCommitReviewResult");
mustContain("finalReviewDto", finalReviewDto, "dryRun: true");
mustContain("finalReviewDto", finalReviewDto, "reviewOnly: true");
mustContain("finalReviewDto", finalReviewDto, "requiresExplicitConfirmation: true");
mustContain("finalReviewDto", finalReviewDto, "willCreateTransactionRows");
mustContain("finalReviewDto", finalReviewDto, "willCreateInventoryMovementRows");
mustContain("finalReviewDto", finalReviewDto, "transactionDraftsPreview");
mustContain("finalReviewDto", finalReviewDto, "inventoryDraftsPreview");
mustContain("finalReviewDto", finalReviewDto, "STEP151_R_FINAL_COMMIT_REVIEW_WRITE_BOUNDARY_DRIFT");

/**
 * Combined projection must remain the child source for final review.
 */
mustContain("combinedService", combinedService, "amazon-sp-api-orders-combined-dry-run-projection");
mustContain("combinedService", combinedService, "transactionDraftRows");
mustContain("combinedService", combinedService, "inventoryMovementDraftRows");
mustContain("combinedService", combinedService, "writesDatabase: false");
mustContain("combinedService", combinedService, "createsTransactionNow: false");
mustContain("combinedService", combinedService, "createsInventoryMovementNow: false");

/**
 * Frontend helper / UI existence.
 */
mustContain("webApi", webApi, "AmazonSpApiOrdersFinalCommitReviewResponse");
mustContain("webApi", webApi, "AMAZON_SP_API_ORDERS_FINAL_COMMIT_REVIEW_ENDPOINT");
mustContain("webApi", webApi, "/api/imports/amazon-sp-api/orders/final-commit-review");
mustContain("webApi", webApi, "readAmazonSpApiOrdersFinalCommitReview");
mustContain("webApi", webApi, "reviewOnly: true");
mustContain("webApi", webApi, "dryRun: true");

mustContain("importPage", importPage, "data-import-connected-service-amazon-orders-final-commit-review-panel");
mustContain("importPage", importPage, "data-import-connected-service-amazon-orders-final-commit-review-refresh-button");
mustContain("importPage", importPage, "data-import-connected-service-amazon-orders-final-commit-review-summary");
mustContain("importPage", importPage, "data-import-connected-service-amazon-orders-final-commit-review-blockers");
mustContain("importPage", importPage, "data-import-connected-service-amazon-orders-final-commit-review-no-write-notice");
mustContain("importPage", importPage, "refreshAmazonOrdersFinalCommitReview");
mustContain("importPage", importPage, "await refreshAmazonOrdersFinalCommitReview(response.importJobId)");

/**
 * Package scripts.
 */
if (!apiPackage.scripts["smoke:step151-r:amazon-orders-final-commit-review-runtime"]) {
  throw new Error("api package missing Step151-R runtime smoke script");
}
if (!webPackage.scripts["smoke:step151-r:amazon-orders-final-commit-review-helper"]) {
  throw new Error("web package missing Step151-R helper smoke script");
}
if (!webPackage.scripts["smoke:step151-r-b:amazon-orders-final-commit-review-ui"]) {
  throw new Error("web package missing Step151-R-B UI smoke script");
}

/**
 * Forbidden write/execution boundaries.
 */
const finalReviewRouteStart = controller.indexOf("amazonSpApiOrdersFinalCommitReviewControllerRoute");
const finalReviewRouteEnd = controller.indexOf("@UseGuards", finalReviewRouteStart + 1);
const finalReviewRouteBlock =
  finalReviewRouteStart >= 0
    ? controller.slice(finalReviewRouteStart, finalReviewRouteEnd > finalReviewRouteStart ? finalReviewRouteEnd : undefined)
    : "";

const finalReviewUiStart = importPage.indexOf("data-import-connected-service-amazon-orders-final-commit-review-panel");
const finalReviewUiEnd = importPage.indexOf("Step151-O-TRANSACTION-DRY-RUN-PROJECTION-UI", finalReviewUiStart);
const finalReviewUiBlock =
  finalReviewUiStart >= 0
    ? importPage.slice(finalReviewUiStart, finalReviewUiEnd > finalReviewUiStart ? finalReviewUiEnd : undefined)
    : "";

const scannedBlocks = {
  finalReviewService,
  finalReviewRouteBlock,
  finalReviewUiBlock,
};

const forbiddenRegexes = [
  /prisma\.(transaction|inventoryMovement)\.(create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/,
  /runHistoricalSync\s*\(/,
  /runSegment\s*\(/,
  /commitAmazonSpApiOrders/i,
  /transaction-commit/i,
  /inventory-commit/i,
  /createsTransactionNow:\s*true/,
  /createsInventoryMovementNow:\s*true/,
  /transactionWriteNow:\s*true/,
  /inventoryWriteNow:\s*true/,
  /writesDatabase:\s*true/,
];

for (const [name, block] of Object.entries(scannedBlocks)) {
  for (const pattern of forbiddenRegexes) {
    if (pattern.test(block)) {
      throw new Error(`${name} violates Step151-R-C no-write closeout boundary: ${pattern}`);
    }
  }
}

/**
 * Make sure final review UI does not expose a real commit button yet.
 */
mustNotContain("finalReviewUiBlock", finalReviewUiBlock, "実反映");
mustNotContain("finalReviewUiBlock", finalReviewUiBlock, "Transaction作成");
mustNotContain("finalReviewUiBlock", finalReviewUiBlock, "InventoryMovement作成");

console.log("[OK] Step151-R-C final review closeout guard passed.");
