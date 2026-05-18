import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  evaluateAmazonSpApiOrdersStagingCommitReadiness,
} from './amazon-sp-api-orders-staging-commit-readiness.service';
import {
  assertAmazonSpApiOrdersInventoryDryRunProjectionContract,
  type AmazonSpApiOrdersInventoryDryRunExcludedRow,
  type AmazonSpApiOrdersInventoryDryRunProjectionResult,
  type AmazonSpApiOrdersInventoryMovementDraftProjection,
} from './dto/amazon-sp-api-orders-inventory-dry-run-projection-contract.dto';

function normalizeBusinessMonthDate(value: string | null): string {
  const normalized = String(value || '').trim();
  if (/^\d{4}-\d{2}$/.test(normalized)) return `${normalized}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
  return new Date(0).toISOString().slice(0, 10);
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)));
}

function readProductSkuCode(row: {
  sellerSku: string | null;
  targetEntityType: string | null;
  targetEntityId: string | null;
}): string | null {
  if (row.targetEntityType === 'ProductSku' && row.targetEntityId) return row.sellerSku;
  return null;
}

export async function projectAmazonSpApiOrdersReadyRowsToInventoryDryRun(args: {
  prisma: PrismaService;
  companyId: string;
  importJobId: string;
}): Promise<AmazonSpApiOrdersInventoryDryRunProjectionResult> {
  const companyId = String(args.companyId || '').trim();
  const importJobId = String(args.importJobId || '').trim();

  if (!companyId) {
    throw new ForbiddenException(
      'STEP151_P_INVENTORY_PROJECTION_COMPANY_REQUIRED: authenticated user must belong to a company.',
    );
  }

  if (!importJobId) {
    throw new BadRequestException(
      'STEP151_P_INVENTORY_PROJECTION_IMPORT_JOB_ID_REQUIRED: importJobId is required.',
    );
  }

  const readiness = await evaluateAmazonSpApiOrdersStagingCommitReadiness({
    prisma: args.prisma,
    companyId,
    importJobId,
  });

  if (readiness.writesDatabase !== false || readiness.transactionWriteNow !== false || readiness.inventoryWriteNow !== false) {
    throw new Error('STEP151_P_READINESS_WRITE_BOUNDARY_DRIFT');
  }

  const drafts: AmazonSpApiOrdersInventoryMovementDraftProjection[] = [];
  const excluded: AmazonSpApiOrdersInventoryDryRunExcludedRow[] = [];

  for (const row of readiness.rows) {
    if (row.readiness !== 'READY') {
      excluded.push({
        stagingRowId: row.stagingRowId,
        rowNo: row.rowNo,
        amazonOrderId: row.amazonOrderId,
        orderItemId: row.orderItemId,
        sellerSku: row.sellerSku,
        readiness: row.readiness,
        excludedReasons: [...row.blockers],
        warnings: row.warnings,
      });
      continue;
    }

    const excludedReasons: string[] = [];

    if (row.targetEntityType !== 'ProductSku' || !row.targetEntityId) {
      excludedReasons.push('MISSING_PRODUCT_SKU_TARGET');
    }

    if (row.quantityOrdered === null || !Number.isFinite(Number(row.quantityOrdered)) || Number(row.quantityOrdered) <= 0) {
      excludedReasons.push('MISSING_OR_INVALID_QUANTITY');
    }

    if (!row.dedupeHash) {
      excludedReasons.push('MISSING_DEDUPE_HASH');
    }

    if (excludedReasons.length) {
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

    drafts.push({
      stagingRowId: row.stagingRowId,
      rowNo: row.rowNo,
      movementDate: normalizeBusinessMonthDate(row.businessMonth),
      businessMonth: row.businessMonth,
      productSkuId: String(row.targetEntityId),
      productSkuCode: readProductSkuCode(row),
      sellerSku: row.sellerSku,
      asin: row.asin,
      quantity: Number(row.quantityOrdered),
      movementType: 'SALE',
      direction: 'OUT',
      source: 'amazon-sp-api-orders',
      sourceOrderId: row.amazonOrderId,
      sourceOrderItemId: row.orderItemId,
      evidenceType: 'ImportStagingRow',
      evidenceImportJobId: importJobId,
      evidenceStagingRowId: row.stagingRowId,
      evidenceSourceRowNo: row.rowNo,
      dedupeKey: `${row.dedupeHash}:inventory-sale`,
    });
  }

  const quantityTotal = drafts.reduce((sum, draft) => sum + draft.quantity, 0);
  const excludedReasons = excluded.flatMap((row) => row.excludedReasons || []);
  const warnings = [
    ...readiness.commitBlockedReasons,
    ...readiness.rows.flatMap((row) => row.warnings || []),
  ];

  return assertAmazonSpApiOrdersInventoryDryRunProjectionContract({
    source: 'amazon-sp-api-orders-inventory-dry-run-projection',
    routeImplementedNow: true,
    route: '/api/imports/amazon-sp-api/orders/inventory-dry-run-projection',
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
    projectedInventoryMovementRows: drafts.length,
    excludedRows: excluded.length,
    quantityTotal,
    drafts,
    excluded,
    blockers: uniqueStrings(excludedReasons),
    warnings: uniqueStrings(warnings),
  });
}
