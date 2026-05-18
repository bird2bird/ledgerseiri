import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  evaluateAmazonSpApiOrdersStagingCommitReadiness,
} from './amazon-sp-api-orders-staging-commit-readiness.service';
import {
  assertAmazonSpApiOrdersTransactionDryRunProjectionContract,
  type AmazonSpApiOrdersTransactionDryRunExcludedRow,
  type AmazonSpApiOrdersTransactionDryRunProjectionResult,
  type AmazonSpApiOrdersTransactionDraftProjection,
} from './dto/amazon-sp-api-orders-transaction-dry-run-projection-contract.dto';

function normalizeBusinessMonthDate(value: string | null): string {
  const normalized = String(value || '').trim();
  if (/^\d{4}-\d{2}$/.test(normalized)) {
    return `${normalized}-01`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }
  return new Date(0).toISOString().slice(0, 10);
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)));
}

export async function projectAmazonSpApiOrdersReadyRowsToTransactionDryRun(args: {
  prisma: PrismaService;
  companyId: string;
  importJobId: string;
}): Promise<AmazonSpApiOrdersTransactionDryRunProjectionResult> {
  const companyId = String(args.companyId || '').trim();
  const importJobId = String(args.importJobId || '').trim();

  if (!companyId) {
    throw new ForbiddenException(
      'STEP151_O_TRANSACTION_PROJECTION_COMPANY_REQUIRED: authenticated user must belong to a company.',
    );
  }

  if (!importJobId) {
    throw new BadRequestException(
      'STEP151_O_TRANSACTION_PROJECTION_IMPORT_JOB_ID_REQUIRED: importJobId is required.',
    );
  }

  const readiness = await evaluateAmazonSpApiOrdersStagingCommitReadiness({
    prisma: args.prisma,
    companyId,
    importJobId,
  });

  if (readiness.writesDatabase !== false || readiness.transactionWriteNow !== false || readiness.inventoryWriteNow !== false) {
    throw new Error('STEP151_O_READINESS_WRITE_BOUNDARY_DRIFT');
  }

  const drafts: AmazonSpApiOrdersTransactionDraftProjection[] = [];
  const excluded: AmazonSpApiOrdersTransactionDryRunExcludedRow[] = [];

  for (const row of readiness.rows) {
    const excludedReasons = row.readiness === 'READY' ? [] : [...row.blockers];

    if (row.readiness !== 'READY') {
      excluded.push({
        stagingRowId: row.stagingRowId,
        rowNo: row.rowNo,
        amazonOrderId: row.amazonOrderId,
        orderItemId: row.orderItemId,
        sellerSku: row.sellerSku,
        readiness: row.readiness,
        excludedReasons,
        warnings: row.warnings,
      });
      continue;
    }

    if (row.itemPriceAmount === null || !Number.isFinite(Number(row.itemPriceAmount))) {
      excluded.push({
        stagingRowId: row.stagingRowId,
        rowNo: row.rowNo,
        amazonOrderId: row.amazonOrderId,
        orderItemId: row.orderItemId,
        sellerSku: row.sellerSku,
        readiness: row.readiness,
        excludedReasons: ['MISSING_ITEM_PRICE_AMOUNT'],
        warnings: row.warnings,
      });
      continue;
    }

    if (!row.dedupeHash) {
      excluded.push({
        stagingRowId: row.stagingRowId,
        rowNo: row.rowNo,
        amazonOrderId: row.amazonOrderId,
        orderItemId: row.orderItemId,
        sellerSku: row.sellerSku,
        readiness: row.readiness,
        excludedReasons: ['MISSING_DEDUPE_HASH'],
        warnings: row.warnings,
      });
      continue;
    }

    drafts.push({
      stagingRowId: row.stagingRowId,
      rowNo: row.rowNo,
      transactionDate: normalizeBusinessMonthDate(row.businessMonth),
      businessMonth: row.businessMonth,
      amount: Number(row.itemPriceAmount),
      currency: 'JPY',
      direction: 'income',
      transactionType: 'amazon-order-item-sale',
      counterparty: 'Amazon.co.jp',
      source: 'amazon-sp-api-orders',
      sourceOrderId: row.amazonOrderId,
      sourceOrderItemId: row.orderItemId,
      sellerSku: row.sellerSku,
      asin: row.asin,
      targetEntityType: row.targetEntityType,
      targetEntityId: row.targetEntityId,
      evidenceType: 'ImportStagingRow',
      evidenceImportJobId: importJobId,
      evidenceStagingRowId: row.stagingRowId,
      evidenceSourceRowNo: row.rowNo,
      dedupeHash: row.dedupeHash,
    });
  }

  const amountTotal = drafts.reduce((sum, draft) => sum + draft.amount, 0);
  const excludedReasons = excluded.flatMap((row) => row.excludedReasons || []);
  const warnings = [
    ...readiness.commitBlockedReasons,
    ...readiness.rows.flatMap((row) => row.warnings || []),
  ];

  return assertAmazonSpApiOrdersTransactionDryRunProjectionContract({
    source: 'amazon-sp-api-orders-transaction-dry-run-projection',
    routeImplementedNow: true,
    route: '/api/imports/amazon-sp-api/orders/transaction-dry-run-projection',
    guardedBy: 'JwtAuthGuard',
    companyScoped: true,
    dryRun: true,
    importJobId,
    readinessSource: 'amazon-sp-api-orders-staging-commit-readiness',
    writesDatabase: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,
    createsTransactionNow: false,
    createsInventoryMovementNow: false,
    historicalSyncNow: false,
    totalReadinessRows: readiness.rows.length,
    projectedTransactionRows: drafts.length,
    excludedRows: excluded.length,
    amountTotal,
    currency: 'JPY',
    drafts,
    excluded,
    blockers: uniqueStrings(excludedReasons),
    warnings: uniqueStrings(warnings),
  });
}
