#!/usr/bin/env node
"use strict";

process.env.AMAZON_SP_API_SANDBOX_INTERNAL_ENABLED = "true";
process.env.AMAZON_SP_API_REAL_ENABLED = "false";
process.env.AMAZON_SP_API_OAUTH_ENABLED = "false";
process.env.AMAZON_SP_API_TOKEN_PERSISTENCE_ENABLED = "false";

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { ImportsService } = require("../dist/src/imports/imports.service");
const {
  buildAmazonOrderNormalizedPayload,
} = require("../dist/src/imports/amazon-order-normalized-contract");
const {
  assertAmazonSpApiSandboxCsvDedupeBoundary,
  buildAmazonOrderCrossSourceDedupeKey,
  compareAmazonOrderCsvAndSpApiDedupeKeys,
  getAmazonSpApiSandboxCsvDedupeBoundary,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-csv-dedupe-boundary.dto");
const {
  assertAmazonSpApiSandboxImportCenterVisibilityPolicy,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-import-center-visibility-policy.dto");
const {
  assertAmazonSpApiSandboxEnvironmentGate,
} = require("../dist/src/imports/dto/amazon-sp-api-sandbox-internal-contract.dto");

const prisma = new PrismaClient();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function expectReject(label, fn, expectedFragment) {
  try {
    await fn();
  } catch (err) {
    const message = String((err && err.message) || err);
    if (!message.includes(expectedFragment)) {
      throw new Error(`${label} rejected with unexpected message: ${message}`);
    }
    return { label, ok: true, message };
  }

  throw new Error(`${label} should have been rejected`);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function listFiles(dir, predicate, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      listFiles(p, predicate, acc);
    } else if (predicate(p)) {
      acc.push(p);
    }
  }
  return acc;
}

async function resolveCompanyId() {
  const company = await prisma.company.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  if (!company) {
    throw new Error("No company found for smoke");
  }

  return company;
}

function buildSandboxOrder(runId) {
  return {
    amazonOrderId: `SPAPI-CSV-DEDUPE-ORDER-${runId}`,
    purchaseDate: "2026-05-07T12:34:56Z",
    marketplaceId: "A1VC38T7YXB528",
    orderStatus: "Shipped",
    fulfillmentChannel: "AFN",
    salesChannel: "Amazon.co.jp",
    orderTotal: { currencyCode: "JPY", amount: "4980" },
    items: [
      {
        orderItemId: `SPAPI-CSV-DEDUPE-ITEM-${runId}`,
        sellerSku: ` spapi csv dedupe sku ${runId} `,
        title: `Step117-C CSV Dedupe Product ${runId}`,
        quantityOrdered: "2",
        itemPrice: { currencyCode: "JPY", amount: "4980" },
        itemTax: { currencyCode: "JPY", amount: "498" },
        feeBreakdown: [
          { type: "Commission", amount: { currencyCode: "JPY", amount: "390" } },
        ],
        raw: { fixture: "step117-c-spapi-item" },
      },
    ],
    raw: { fixture: "step117-c-spapi-order" },
  };
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const srcRoot = path.resolve(root, "src");
  const schemaFile = path.resolve(root, "prisma/schema.prisma");
  const importsServiceTs = path.resolve(root, "src/imports/imports.service.ts");
  const importsControllerTs = path.resolve(root, "src/imports/imports.controller.ts");
  const normalizedContractTs = path.resolve(root, "src/imports/amazon-order-normalized-contract.ts");

  const boundary = assertAmazonSpApiSandboxCsvDedupeBoundary();
  const rawBoundary = getAmazonSpApiSandboxCsvDedupeBoundary();
  const visibility = assertAmazonSpApiSandboxImportCenterVisibilityPolicy();
  const gate = assertAmazonSpApiSandboxEnvironmentGate({ requireInternalSandbox: true });

  assert(boundary.version === "amazon-sp-api-sandbox-csv-dedupe-boundary-v1", "boundary version mismatch");
  assert(boundary.module === "store-orders", "boundary module mismatch");
  assert(boundary.comparedSourceTypes.includes("AMAZON_ORDER_CSV"), "boundary missing CSV source");
  assert(boundary.comparedSourceTypes.includes("AMAZON_ORDER_SP_API"), "boundary missing SP-API source");
  assert(boundary.currentPolicy.crossSourcePersistAllowed === false, "cross-source persist must remain blocked");
  assert(boundary.currentPolicy.crossSourceTransactionCommitAllowed === false, "cross-source transaction commit must remain blocked");
  assert(boundary.currentPolicy.crossSourceInventoryDeductionAllowed === false, "cross-source inventory deduction must remain blocked");
  assert(boundary.currentPolicy.sandboxDedupeCanOnlyPreview === true, "sandbox dedupe should only preview");
  assert(boundary.csvVsSpApiPolicy.sameCandidateMustNotAutoCommitTwice === true, "same candidate must not auto-commit twice");
  assert(boundary.csvVsSpApiPolicy.csvCommittedTransactionWinsOverSandboxPreview === true, "CSV committed transaction should win over sandbox preview");
  assert(boundary.futurePersistenceRequirement.requiresExistingTransactionLookupByCanonicalKey === true, "future Transaction lookup requirement missing");
  assert(boundary.futurePersistenceRequirement.requiresManualConflictReviewForAmountMismatch === true, "future manual review requirement missing");

  assert(visibility.persistenceDependency.requiresDedupeDecisionAgainstCsv === true, "visibility must require CSV dedupe decision");
  assert(gate.canCallRealSpApi === false, "real SP-API must remain disabled");

  const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const orderId = `SPAPI-CSV-DEDUPE-ORDER-${runId}`;
  const rawSku = ` spapi csv dedupe sku ${runId} `;

  const csvPayload = buildAmazonOrderNormalizedPayload({
    sourceType: "AMAZON_ORDER_CSV",
    importJobId: "csv-import-job",
    sourceRowNo: 7,
    sourceFileName: "step117-c.csv",
    amazonOrderId: orderId,
    orderId,
    occurredAt: "2026-05-07T12:34:56Z",
    sellerSku: rawSku,
    quantity: 2,
    amount: 4980,
    grossAmount: 4980,
    netAmount: 4590,
    currency: "JPY",
    feeAmount: 390,
    businessMonth: "2026-05",
    rawTransactionType: "注文",
    raw: { source: "csv" },
  });

  const spApiPayload = buildAmazonOrderNormalizedPayload({
    sourceType: "AMAZON_ORDER_SP_API",
    importJobId: null,
    sourceRowNo: null,
    sourceFileName: null,
    amazonOrderId: orderId,
    orderId,
    occurredAt: "2026-05-07T12:34:56Z",
    sellerSku: rawSku,
    quantity: 2,
    amount: 4980,
    grossAmount: 4980,
    netAmount: 4590,
    currency: "JPY",
    feeAmount: 390,
    businessMonth: "2026-05",
    raw: { source: "sp-api" },
  });

  const csvKey = buildAmazonOrderCrossSourceDedupeKey({ payload: csvPayload });
  const spApiKey = buildAmazonOrderCrossSourceDedupeKey({ payload: spApiPayload });

  assert(csvKey.sourceType === "AMAZON_ORDER_CSV", "csvKey sourceType mismatch");
  assert(spApiKey.sourceType === "AMAZON_ORDER_SP_API", "spApiKey sourceType mismatch");
  assert(csvKey.canonicalKey === spApiKey.canonicalKey, "canonical keys should match across CSV/SP-API");
  assert(csvKey.canonicalKey.includes(orderId), "canonical key should contain orderId");
  assert(csvKey.canonicalKey.includes("SPAPICSVDEDUPESKU"), "canonical key should contain normalized SKU prefix");
  assert(!csvKey.canonicalKey.includes("AMAZON_ORDER_CSV"), "canonical key must exclude CSV sourceType");
  assert(!spApiKey.canonicalKey.includes("AMAZON_ORDER_SP_API"), "canonical key must exclude SP-API sourceType");

  const sameComparison = compareAmazonOrderCsvAndSpApiDedupeKeys({
    csvPayload,
    spApiPayload,
  });

  assert(sameComparison.decision === "SAME_ORDER_ITEM_CANDIDATE", "same comparison decision mismatch");
  assert(sameComparison.sameCanonicalKey === true, "same comparison canonical key mismatch");
  assert(sameComparison.sameQuantity === true, "same comparison quantity mismatch");
  assert(sameComparison.sameGrossAmount === true, "same comparison gross amount mismatch");
  assert(sameComparison.sameOccurredAtDate === true, "same comparison occurredAt date mismatch");

  const amountMismatchSpApiPayload = {
    ...spApiPayload,
    grossAmount: 4990,
    amount: 4990,
  };

  const amountMismatchComparison = compareAmazonOrderCsvAndSpApiDedupeKeys({
    csvPayload,
    spApiPayload: amountMismatchSpApiPayload,
  });

  assert(amountMismatchComparison.decision === "SAME_ORDER_ITEM_CANDIDATE", "amount mismatch should still be same candidate");
  assert(amountMismatchComparison.sameCanonicalKey === true, "amount mismatch canonical key mismatch");
  assert(amountMismatchComparison.sameGrossAmount === false, "amount mismatch should detect gross mismatch");
  assert(
    amountMismatchComparison.warnings.includes("SAME_CANONICAL_KEY_WITH_AMOUNT_OR_DATE_DIFFERENCE"),
    "amount mismatch warning missing",
  );

  const differentSpApiPayload = {
    ...spApiPayload,
    amazonOrderId: `${orderId}-DIFFERENT`,
    orderId: `${orderId}-DIFFERENT`,
  };

  const differentComparison = compareAmazonOrderCsvAndSpApiDedupeKeys({
    csvPayload,
    spApiPayload: differentSpApiPayload,
  });

  assert(differentComparison.decision === "DIFFERENT_ORDER_ITEM", "different order should be different item");
  assert(differentComparison.sameCanonicalKey === false, "different order canonical key should differ");

  const insufficientPayload = {
    ...spApiPayload,
    amazonOrderId: "",
    orderId: "",
  };

  const insufficientComparison = compareAmazonOrderCsvAndSpApiDedupeKeys({
    csvPayload,
    spApiPayload: insufficientPayload,
  });

  assert(insufficientComparison.decision === "INSUFFICIENT_KEYS", "missing order id should be insufficient");
  assert(
    insufficientComparison.spApiKey.insufficientReasons.includes("MISSING_AMAZON_ORDER_ID"),
    "missing order id reason not detected",
  );

  const schema = read(schemaFile);
  assert(schema.includes("model ImportJob"), "schema missing ImportJob");
  assert(schema.includes("model ImportStagingRow"), "schema missing ImportStagingRow");
  assert(schema.includes("model Transaction"), "schema missing Transaction");
  assert(!schema.includes("CrossSourceDedupe"), "Step117-C must not add a dedupe table");
  assert(!schema.includes("PREVIEWED"), "Step117-C must not add PREVIEWED");
  assert(!schema.includes("STAGED"), "Step117-C must not add STAGED");
  assert(!schema.includes("COMMITTED"), "Step117-C must not add COMMITTED");

  const normalizedSource = read(normalizedContractTs);
  assert(
    normalizedSource.includes('"AMAZON_ORDER_CSV" | "AMAZON_ORDER_SP_API"'),
    "normalized contract must support both CSV and SP-API source types",
  );

  const serviceSource = read(importsServiceTs);
  assert(serviceSource.includes("STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED"), "service must still block non-dry-run");
  assert(serviceSource.includes("Only dryRun=true is allowed"), "service must still document dryRun-only");

  const controllerSource = read(importsControllerTs);
  assert(!controllerSource.includes("amazon-sp-api-sandbox-csv-dedupe-boundary"), "controller must not import dedupe boundary");
  assert(!controllerSource.includes("previewAmazonSpApiSandboxOrders"), "controller must not expose preview method");
  assert(!controllerSource.includes("commitAmazonSpApiSandboxOrdersToStaging"), "controller must not expose commit method");

  const controllerFiles = listFiles(srcRoot, (p) => p.endsWith(".controller.ts"));
  const exposedRoutes = [];
  for (const file of controllerFiles) {
    const text = read(file);
    const routeRegex = /@(Get|Post|Put|Patch|Delete)\(\s*['"`]([^'"`]*(sp-api|sandbox)[^'"`]*)['"`]\s*\)/gi;
    let match;
    while ((match = routeRegex.exec(text))) {
      const route = String(match[2] || "").toLowerCase();
      if (route.includes("sp-api") || (route.includes("sandbox") && route.includes("amazon"))) {
        exposedRoutes.push({
          file: path.relative(root, file),
          method: match[1],
          route: match[2],
        });
      }
    }
  }
  assert(exposedRoutes.length === 0, `controller route leak: ${JSON.stringify(exposedRoutes)}`);

  const company = await resolveCompanyId();
  const service = new ImportsService(prisma);
  const filename = `step117-c-csv-dedupe-boundary-${runId}.json`;
  const preview = await service.previewAmazonSpApiSandboxOrders({
    companyId: company.id,
    filename,
    orders: [buildSandboxOrder(runId)],
  });

  assert(preview.ok === true, "preview ok mismatch");
  assert(preview.rows.length === 1, "preview rows mismatch");
  assert(preview.rows[0].payload.sourceType === "AMAZON_ORDER_SP_API", "preview payload sourceType mismatch");

  const previewKey = buildAmazonOrderCrossSourceDedupeKey({
    payload: preview.rows[0].payload,
  });
  assert(previewKey.sourceType === "AMAZON_ORDER_SP_API", "preview key sourceType mismatch");
  assert(previewKey.canonicalKey, "preview key should have canonicalKey");

  const nonDryRunReject = await expectReject(
    "Step117-C non-dry-run persist blocked",
    () =>
      service.commitAmazonSpApiSandboxOrdersToStaging({
        companyId: company.id,
        filename,
        preview,
        dryRun: false,
      }),
    "STEP116_H_SP_API_SANDBOX_NON_DRY_RUN_BLOCKED",
  );

  const dryRun = await service.commitAmazonSpApiSandboxOrdersToStaging({
    companyId: company.id,
    filename,
    preview,
    dryRun: true,
  });

  assert(dryRun.ok === true, "dryRun ok mismatch");
  assert(dryRun.rollbackVerified === true, "dryRun rollbackVerified mismatch");

  const leakedJob = await prisma.importJob.findFirst({
    where: { filename },
    select: { id: true },
  });
  assert(!leakedJob, "dry-run dedupe boundary smoke leaked ImportJob");

  const leakedRows = await prisma.importStagingRow.findMany({
    where: {
      dedupeHash: {
        in: preview.rows.map((row) => row.dedupeHash),
      },
    },
    select: { id: true },
    take: 10,
  });
  assert(leakedRows.length === 0, `dry-run dedupe boundary smoke leaked ImportStagingRow count=${leakedRows.length}`);

  console.log("[SMOKE_OK] amazon sp-api sandbox CSV dedupe boundary smoke passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        boundary: rawBoundary,
        comparisons: {
          same: sameComparison,
          amountMismatch: amountMismatchComparison,
          different: differentComparison,
          insufficient: insufficientComparison,
        },
        preview: {
          rows: preview.rows.length,
          previewKey,
        },
        rejected: [nonDryRunReject],
        dryRun: {
          rows: dryRun.rows.length,
          rollbackVerified: dryRun.rollbackVerified,
        },
        leakCheck: {
          importJobLeaked: Boolean(leakedJob),
          stagingRowsLeaked: leakedRows.length,
        },
        controllerGuard: {
          scannedControllerFiles: controllerFiles.map((file) => path.relative(root, file)),
          exposedRoutes,
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error("[SMOKE_ERROR]", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
