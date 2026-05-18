import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { reviewAmazonSpApiOrdersFinalCommit } from './amazon-sp-api-orders-final-commit-review.service';
import { projectAmazonSpApiOrdersReadyRowsToTransactionDryRun } from './amazon-sp-api-orders-transaction-dry-run-projection.service';
import {
  assertAmazonSpApiOrdersTransactionCommitContract,
  type AmazonSpApiOrdersTransactionCommitCreatedRow,
  type AmazonSpApiOrdersTransactionCommitResult,
  type AmazonSpApiOrdersTransactionCommitSkippedRow,
} from './dto/amazon-sp-api-orders-transaction-commit-contract.dto';

function compactUnique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)));
}

function normalizeAmountToInt(value: number): number {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount);
}

function buildExternalRef(draft: {
  sourceOrderId: string | null;
  sourceOrderItemId: string | null;
  evidenceStagingRowId: string;
}): string {
  const orderId = String(draft.sourceOrderId || '').trim();
  const orderItemId = String(draft.sourceOrderItemId || '').trim();
  if (orderId && orderItemId) return `amazon-order:${orderId}:item:${orderItemId}`;
  if (orderId) return `amazon-order:${orderId}`;
  return `amazon-staging-row:${draft.evidenceStagingRowId}`;
}

function normalizeOccurredAt(value: string): Date {
  const date = new Date(`${String(value || '').slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return new Date(0);
  }
  return date;
}

export async function commitAmazonSpApiOrdersIncomeTransactions(args: {
  prisma: PrismaService;
  companyId: string;
  importJobId: string;
  explicitOperatorConfirmation?: boolean;
  finalReviewAccepted?: boolean;
}): Promise<AmazonSpApiOrdersTransactionCommitResult> {
  const companyId = String(args.companyId || '').trim();
  const importJobId = String(args.importJobId || '').trim();
  const explicitOperatorConfirmation = args.explicitOperatorConfirmation === true;
  const finalReviewAccepted = args.finalReviewAccepted === true;

  if (!companyId) {
    throw new ForbiddenException(
      'STEP151_S_TRANSACTION_COMMIT_COMPANY_REQUIRED: authenticated user must belong to a company.',
    );
  }

  if (!importJobId) {
    throw new BadRequestException(
      'STEP151_S_TRANSACTION_COMMIT_IMPORT_JOB_ID_REQUIRED: importJobId is required.',
    );
  }

  if (!explicitOperatorConfirmation || !finalReviewAccepted) {
    throw new BadRequestException(
      'STEP151_S_TRANSACTION_COMMIT_EXPLICIT_CONFIRMATION_REQUIRED: explicitOperatorConfirmation and finalReviewAccepted must both be true.',
    );
  }

  const finalReview = await reviewAmazonSpApiOrdersFinalCommit({
    prisma: args.prisma,
    companyId,
    importJobId,
  });

  if (finalReview.finalCanCommit !== true) {
    throw new BadRequestException(
      `STEP151_S_TRANSACTION_COMMIT_FINAL_REVIEW_BLOCKED: ${finalReview.blockers.join(',') || 'finalCanCommit=false'}`,
    );
  }

  if (finalReview.writesDatabase !== false || finalReview.createsTransactionNow !== false) {
    throw new Error('STEP151_S_TRANSACTION_COMMIT_FINAL_REVIEW_BOUNDARY_DRIFT');
  }

  const drafts = finalReview.combined.transaction.drafts;
  if (!drafts.length) {
    throw new BadRequestException('STEP151_S_TRANSACTION_COMMIT_NO_TRANSACTION_DRAFTS');
  }

  const missingDedupeDraft = drafts.find((draft) => !String(draft.dedupeHash || '').trim());
  if (missingDedupeDraft) {
    throw new BadRequestException('STEP151_S_TRANSACTION_COMMIT_MISSING_DEDUPE_HASH');
  }

  const productSkuIds = compactUnique(
    drafts
      .filter((draft) => draft.targetEntityType === 'ProductSku')
      .map((draft) => String(draft.targetEntityId || '').trim()),
  );

  if (productSkuIds.length !== drafts.length) {
    throw new BadRequestException('STEP151_S_TRANSACTION_COMMIT_REQUIRES_PRODUCT_SKU_TARGET_FOR_STORE_ID');
  }

  const productSkus = await args.prisma.productSku.findMany({
    where: {
      companyId,
      id: { in: productSkuIds },
    },
    select: {
      id: true,
      storeId: true,
      skuCode: true,
    },
  });

  const productSkuById = new Map(productSkus.map((sku) => [sku.id, sku]));

  const missingStoreDraft = drafts.find((draft) => {
    const sku = productSkuById.get(String(draft.targetEntityId || '').trim());
    return !sku?.storeId;
  });

  if (missingStoreDraft) {
    throw new BadRequestException(
      `STEP151_S_TRANSACTION_COMMIT_STORE_ID_REQUIRED_FOR_SKU: stagingRowId=${missingStoreDraft.stagingRowId}`,
    );
  }

  const dedupeHashes = drafts.map((draft) => String(draft.dedupeHash || '').trim());

  const existingTransactions = await args.prisma.transaction.findMany({
    where: {
      companyId,
      dedupeHash: { in: dedupeHashes },
    },
    select: {
      dedupeHash: true,
    },
  });

  const existingDedupeHashes = new Set(
    existingTransactions.map((tx) => String(tx.dedupeHash || '').trim()).filter(Boolean),
  );

  const created: AmazonSpApiOrdersTransactionCommitCreatedRow[] = [];
  const skipped: AmazonSpApiOrdersTransactionCommitSkippedRow[] = [];

  await args.prisma.$transaction(async (tx) => {
    for (const draft of drafts) {
      const dedupeHash = String(draft.dedupeHash || '').trim();
      const sourceRowNo = Number(draft.evidenceSourceRowNo);

      if (existingDedupeHashes.has(dedupeHash)) {
        skipped.push({
          stagingRowId: draft.stagingRowId,
          sourceRowNo,
          dedupeHash,
          reason: 'TRANSACTION_ALREADY_EXISTS_FOR_DEDUPE_HASH',
        });
        continue;
      }

      const productSku = productSkuById.get(String(draft.targetEntityId || '').trim());
      const storeId = String(productSku?.storeId || '').trim();

      if (!storeId) {
        skipped.push({
          stagingRowId: draft.stagingRowId,
          sourceRowNo,
          dedupeHash,
          reason: 'STORE_ID_NOT_FOUND_FOR_PRODUCT_SKU',
        });
        continue;
      }

      const amount = normalizeAmountToInt(draft.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        skipped.push({
          stagingRowId: draft.stagingRowId,
          sourceRowNo,
          dedupeHash,
          reason: 'INVALID_TRANSACTION_AMOUNT',
        });
        continue;
      }

      const externalRef = buildExternalRef(draft);

      const transaction = await tx.transaction.create({
        data: {
          companyId,
          storeId,
          accountId: null,
          categoryId: null,
          type: 'SALE',
          direction: 'INCOME',
          sourceType: 'STORE_ORDER',
          amount,
          currency: draft.currency || 'JPY',
          occurredAt: normalizeOccurredAt(draft.transactionDate),
          externalRef,
          memo: `Amazon order income / order=${draft.sourceOrderId || '-'} / item=${draft.sourceOrderItemId || '-'} / sku=${draft.sellerSku || '-'}`,
          businessMonth: draft.businessMonth,
          dedupeHash,
          importJobId,
          sourceFileName: 'amazon-sp-api-orders',
          sourceRowNo,
        },
        select: {
          id: true,
        },
      });

      existingDedupeHashes.add(dedupeHash);

      created.push({
        stagingRowId: draft.stagingRowId,
        sourceRowNo,
        transactionId: transaction.id,
        dedupeHash,
        externalRef,
        amount,
        currency: draft.currency || 'JPY',
        storeId,
      });
    }
  });

  const duplicateSkippedRows = skipped.filter(
    (row) => row.reason === 'TRANSACTION_ALREADY_EXISTS_FOR_DEDUPE_HASH',
  ).length;
  const amountTotal = created.reduce((sum, row) => sum + row.amount, 0);

  const blockers = skipped.length
    ? compactUnique(skipped.map((row) => row.reason))
    : [];

  return assertAmazonSpApiOrdersTransactionCommitContract({
    source: 'amazon-sp-api-orders-transaction-commit',
    routeImplementedNow: true,
    route: '/api/imports/amazon-sp-api/orders/transaction-commit',
    guardedBy: 'JwtAuthGuard',
    companyScoped: true,

    importJobId,
    explicitOperatorConfirmation: true,
    finalReviewAccepted: true,

    finalReview,

    writesDatabase: true,
    transactionWriteNow: true,
    inventoryWriteNow: false,
    createsTransactionNow: true,
    createsInventoryMovementNow: false,
    createsExpenseTransactionNow: false,
    touchesInventoryNow: false,
    historicalSyncNow: false,
    settlementOrFeeImportNow: false,
    bankReconciliationNow: false,

    createdTransactionRows: created.length,
    skippedRows: skipped.length,
    duplicateSkippedRows,
    amountTotal,
    currency: 'JPY',
    created,
    skipped,
    blockers,
    warnings: finalReview.warnings,
  });
}

// Step151-S-B-FIX1:
// Keep the legacy service-only dry-run export used by ImportsService.
// This compatibility function delegates to the newer Step151-O transaction dry-run projection.
// It must remain read-only and must not create Transaction or InventoryMovement.
export type PreviewAmazonSpApiOrdersIncomeTransactionDryRunInput = {
  prisma: PrismaService;
  companyId: string;
  importJobId: string;
};

export type PreviewAmazonSpApiOrdersIncomeTransactionDryRunResult = {
  source: 'amazon-sp-api-orders-income-transaction-dry-run';
  dryRun: true;
  route: 'service-only';
  companyId: string;
  importJobId: string;
  sourceType: 'amazon-sp-api-orders';
  transactionWriteNow: false;
  inventoryWriteNow: false;
  writesDatabase: false;
  summary: {
    totalRows: number;
    previewableRows: number;
    blockedRows: number;
    duplicateRows: number;
    existingTransactionRows: number;
    missingAmountRows: number;
    missingOrderIdentityRows: number;
    itemPriceTotal: number;
    itemTaxTotal: number;
    shippingPriceTotal: number;
    candidateAmountTotal: number;
    amountPolicy: 'ITEM_PRICE_PLUS_SHIPPING_EXCLUDES_TAX';
  };
  rows: Array<{
    stagingRowId: string;
    rowNo: number | null;
    amazonOrderId: string | null;
    orderItemId: string | null;
    sellerSku: string | null;
    asin: string | null;
    title: string | null;
    productSkuId: string | null;
    amount: number | null;
    itemPriceAmount: number | null;
    itemTaxAmount: number | null;
    shippingPriceAmount: number | null;
    candidateAmount: number | null;
    amountPolicy: 'ITEM_PRICE_PLUS_SHIPPING_EXCLUDES_TAX';
    currency: string;
    businessDate: string | null;
    businessMonth: string | null;
    orderStatus: string | null;
    orderTotalAmount: number | null;
    dedupeHash: string | null;
    existingTransactionId: string | null;
    blockers: string[];
    warnings: string[];
  }>;
  guardrails: {
    doesNotCreateTransaction: true;
    doesNotCreateInventoryMovement: true;
    doesNotUpdateImportJob: true;
    doesNotUpdateImportStagingRow: true;
    serviceOnly: true;
  };
};

export async function previewAmazonSpApiOrdersStagingRowsIncomeTransactionsDryRun(
  input: PreviewAmazonSpApiOrdersIncomeTransactionDryRunInput,
): Promise<PreviewAmazonSpApiOrdersIncomeTransactionDryRunResult> {
  if (!input?.prisma) {
    throw new Error('STEP151_S_B_FIX1_DRY_RUN_PRISMA_REQUIRED');
  }

  const projection = await projectAmazonSpApiOrdersReadyRowsToTransactionDryRun({
    prisma: input.prisma,
    companyId: input.companyId,
    importJobId: input.importJobId,
  });

  if (
    projection.writesDatabase !== false ||
    projection.transactionWriteNow !== false ||
    projection.inventoryWriteNow !== false ||
    projection.createsTransactionNow !== false ||
    projection.createsInventoryMovementNow !== false
  ) {
    throw new Error('STEP151_S_B_FIX1_DRY_RUN_BOUNDARY_DRIFT');
  }

  const rows = [
    ...projection.drafts.map((draft) => ({
      stagingRowId: draft.stagingRowId,
      rowNo: Number.isFinite(Number(draft.rowNo)) ? Number(draft.rowNo) : null,
      amazonOrderId: draft.sourceOrderId || null,
      orderItemId: draft.sourceOrderItemId || null,
      sellerSku: draft.sellerSku || null,
      asin: draft.asin || null,
      title: null,
      productSkuId:
        draft.targetEntityType === 'ProductSku' && draft.targetEntityId
          ? String(draft.targetEntityId)
          : null,
      amount: Number.isFinite(Number(draft.amount)) ? Number(draft.amount) : null,
      itemPriceAmount: Number.isFinite(Number(draft.amount)) ? Number(draft.amount) : null,
      itemTaxAmount: null,
      shippingPriceAmount: null,
      candidateAmount: Number.isFinite(Number(draft.amount)) ? Number(draft.amount) : null,
      amountPolicy: 'ITEM_PRICE_PLUS_SHIPPING_EXCLUDES_TAX' as const,
      currency: draft.currency || 'JPY',
      businessDate: draft.transactionDate || null,
      businessMonth: draft.businessMonth || null,
      orderStatus: null,
      orderTotalAmount: null,
      dedupeHash: draft.dedupeHash || null,
      existingTransactionId: null,
      blockers: [],
      warnings: [],
    })),
    ...projection.excluded.map((row) => ({
      stagingRowId: row.stagingRowId,
      rowNo: Number.isFinite(Number(row.rowNo)) ? Number(row.rowNo) : null,
      amazonOrderId: row.amazonOrderId || null,
      orderItemId: row.orderItemId || null,
      sellerSku: row.sellerSku || null,
      asin: null,
      title: null,
      productSkuId: null,
      amount: null,
      itemPriceAmount: null,
      itemTaxAmount: null,
      shippingPriceAmount: null,
      candidateAmount: null,
      amountPolicy: 'ITEM_PRICE_PLUS_SHIPPING_EXCLUDES_TAX' as const,
      currency: 'JPY',
      businessDate: null,
      businessMonth: null,
      orderStatus: null,
      orderTotalAmount: null,
      dedupeHash: null,
      existingTransactionId: null,
      blockers: row.excludedReasons || [],
      warnings: row.warnings || [],
    })),
  ];

  const missingAmountRows = projection.excluded.filter((row) =>
    (row.excludedReasons || []).includes('MISSING_ITEM_PRICE_AMOUNT'),
  ).length;
  const missingOrderIdentityRows = projection.excluded.filter((row) =>
    (row.excludedReasons || []).includes('MISSING_ORDER_IDENTITY'),
  ).length;
  const duplicateRows = projection.excluded.filter((row) =>
    (row.excludedReasons || []).includes('DUPLICATE_DEDUPE_HASH_IN_STAGING'),
  ).length;
  const existingTransactionRows = projection.excluded.filter((row) =>
    (row.excludedReasons || []).includes('TRANSACTION_ALREADY_EXISTS_FOR_DEDUPE_HASH'),
  ).length;

  return {
    source: 'amazon-sp-api-orders-income-transaction-dry-run',
    dryRun: true,
    route: 'service-only',
    companyId: input.companyId,
    importJobId: input.importJobId,
    sourceType: 'amazon-sp-api-orders',
    transactionWriteNow: false,
    inventoryWriteNow: false,
    writesDatabase: false,
    summary: {
      totalRows: rows.length,
      previewableRows: projection.projectedTransactionRows,
      blockedRows: projection.excludedRows,
      duplicateRows,
      existingTransactionRows,
      missingAmountRows,
      missingOrderIdentityRows,
      itemPriceTotal: projection.amountTotal,
      itemTaxTotal: 0,
      shippingPriceTotal: 0,
      candidateAmountTotal: projection.amountTotal,
      amountPolicy: 'ITEM_PRICE_PLUS_SHIPPING_EXCLUDES_TAX',
    },
    rows,
    guardrails: {
      doesNotCreateTransaction: true,
      doesNotCreateInventoryMovement: true,
      doesNotUpdateImportJob: true,
      doesNotUpdateImportStagingRow: true,
      serviceOnly: true,
    },
  };
}

