import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  assertAmazonSpApiOrdersStagingCommitReadinessContract,
  type AmazonSpApiOrdersStagingCommitReadinessResult,
  type AmazonSpApiOrdersStagingCommitReadinessRow,
} from './dto/amazon-sp-api-orders-staging-commit-readiness-contract.dto';

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {};
  return value as Record<string, unknown>;
}

function readString(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  if (value === null || value === undefined || value === '') return null;
  return String(value);
}

function readNumber(payload: Record<string, unknown>, key: string): number | null {
  const value = payload[key];
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// Step141-G6-AMAZON-SPAPI-ALIAS-AWARE-READINESS:
// Normalize Amazon sellerSku the same way ProductSkuAlias.normalizedAliasSku is created.
// This readiness projection is read-only and must not update ImportStagingRow.
function normalizeAmazonSellerSkuForAlias(value: string | null): string {
  return String(value || '').trim().replace(/\s+/g, '').toUpperCase();
}

function countDuplicateDedupeHashes(rows: { dedupeHash?: string | null }[]) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const key = String(row.dedupeHash || '').trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return counts;
}

export async function evaluateAmazonSpApiOrdersStagingCommitReadiness(args: {
  prisma: PrismaService;
  companyId: string;
  importJobId: string;
}): Promise<AmazonSpApiOrdersStagingCommitReadinessResult> {
  const companyId = String(args.companyId || '').trim();
  const importJobId = String(args.importJobId || '').trim();

  if (!companyId) {
    throw new ForbiddenException(
      'STEP141_G1_COMPANY_REQUIRED: authenticated user must belong to a company.',
    );
  }

  if (!importJobId) {
    throw new BadRequestException('STEP141_G1_IMPORT_JOB_ID_REQUIRED: importJobId is required.');
  }

  const importJob = await args.prisma.importJob.findFirst({
    where: {
      id: importJobId,
      companyId,
    },
    select: {
      id: true,
      companyId: true,
      sourceType: true,
      status: true,
      totalRows: true,
      successRows: true,
      failedRows: true,
    },
  });

  if (!importJob) {
    return assertAmazonSpApiOrdersStagingCommitReadinessContract({
      source: 'amazon-sp-api-orders-staging-commit-readiness',
      routeImplementedNow: true,
      route: '/api/imports/amazon-sp-api/orders/staging-commit-readiness',
      guardedBy: 'JwtAuthGuard',
      companyScoped: true,
      dryRun: true,
      writesDatabase: false,
      transactionWriteNow: false,
      inventoryWriteNow: false,
      importJobId,
      importJobFound: false,
      sourceType: null,
      status: null,
      totalRows: 0,
      readyRows: 0,
      blockedRows: 0,
      duplicateRows: 0,
      existingTransactionRows: 0,
      existingInventoryMovementRows: 0,
      unresolvedSkuRows: 0,
      missingAmountRows: 0,
      missingOrderIdentityRows: 0,
      canCommit: false,
      commitBlockedReasons: ['IMPORT_JOB_NOT_FOUND'],
      rows: [],
    });
  }

  if (importJob.sourceType !== 'amazon-sp-api-orders') {
    throw new BadRequestException(
      'STEP141_G1_UNSUPPORTED_SOURCE_TYPE: readiness is only for amazon-sp-api-orders ImportJobs.',
    );
  }

  const stagingRows = await args.prisma.importStagingRow.findMany({
    where: {
      importJobId,
      companyId,
    },
    orderBy: {
      rowNo: 'asc',
    },
    select: {
      id: true,
      rowNo: true,
      businessMonth: true,
      normalizedPayloadJson: true,
      dedupeHash: true,
      matchStatus: true,
      matchReason: true,
      targetEntityType: true,
      targetEntityId: true,
    },
  });

  const duplicateDedupeCounts = countDuplicateDedupeHashes(stagingRows);
  const dedupeHashes = stagingRows
    .map((row) => String(row.dedupeHash || '').trim())
    .filter(Boolean);

  const existingTransactions = dedupeHashes.length
    ? await args.prisma.transaction.findMany({
        where: {
          companyId,
          dedupeHash: { in: dedupeHashes },
        },
        select: {
          dedupeHash: true,
        },
      })
    : [];

  const existingTransactionDedupeHashes = new Set(
    existingTransactions.map((tx) => String(tx.dedupeHash || '').trim()).filter(Boolean),
  );

  const existingInventoryMovements = dedupeHashes.length
    ? await args.prisma.inventoryMovement.findMany({
        where: {
          companyId,
          importJobId,
        },
        select: {
          sourceRowNo: true,
        },
      })
    : [];

  const existingInventoryMovementRowNos = new Set(
    existingInventoryMovements
      .map((movement) => Number(movement.sourceRowNo))
      .filter((value) => Number.isFinite(value)),
  );

  const amazonAliasKeys = Array.from(
    new Set(
      stagingRows
        .map((row) => normalizeAmazonSellerSkuForAlias(readString(asRecord(row.normalizedPayloadJson), 'sellerSku')))
        .filter(Boolean),
    ),
  );

  const productSkuAliases = amazonAliasKeys.length
    ? await args.prisma.productSkuAlias.findMany({
        where: {
          companyId,
          isActive: true,
          normalizedAliasSku: { in: amazonAliasKeys },
        },
        select: {
          skuId: true,
          aliasSku: true,
          normalizedAliasSku: true,
          sourceType: true,
          storeId: true,
          sku: {
            select: {
              id: true,
              skuCode: true,
              name: true,
              productId: true,
              storeId: true,
              asin: true,
              externalSku: true,
            },
          },
        },
      })
    : [];

  const productSkuAliasByNormalizedAliasSku = new Map(
    productSkuAliases.map((alias) => [alias.normalizedAliasSku, alias]),
  );

  const readinessRows: AmazonSpApiOrdersStagingCommitReadinessRow[] = stagingRows.map((row) => {
    const payload = asRecord(row.normalizedPayloadJson);
    const amazonOrderId = readString(payload, 'amazonOrderId');
    const orderItemId = readString(payload, 'orderItemId');
    const sellerSku = readString(payload, 'sellerSku');
    const asin = readString(payload, 'asin');
    const itemPriceAmount = readNumber(payload, 'itemPriceAmount');
    const quantityOrdered = readNumber(payload, 'quantityOrdered');

    const blockers: string[] = [];
    const warnings: string[] = [];

    if (!amazonOrderId || !orderItemId) {
      blockers.push('MISSING_ORDER_IDENTITY');
    }

    if (!sellerSku && !asin) {
      blockers.push('MISSING_SKU_AND_ASIN');
    }

    if (itemPriceAmount === null) {
      blockers.push('MISSING_ITEM_PRICE_AMOUNT');
    }

    if (!row.businessMonth) {
      blockers.push('MISSING_BUSINESS_MONTH');
    }

    if (row.matchStatus !== 'PENDING_REVIEW') {
      warnings.push(`UNEXPECTED_MATCH_STATUS:${row.matchStatus}`);
    }

    const normalizedSellerSku = normalizeAmazonSellerSkuForAlias(sellerSku);
    const matchedAlias = normalizedSellerSku
      ? productSkuAliasByNormalizedAliasSku.get(normalizedSellerSku) || null
      : null;

    const projectedTargetEntityType =
      row.targetEntityType || (matchedAlias ? 'ProductSku' : null);
    const projectedTargetEntityId = row.targetEntityId || matchedAlias?.skuId || null;

    if (!projectedTargetEntityId) {
      warnings.push('SKU_NOT_LINKED_TO_TARGET_ENTITY_YET');
    }

    if (matchedAlias && !row.targetEntityId) {
      warnings.push('SKU_LINKED_BY_PRODUCT_SKU_ALIAS');
    }

    const dedupeHash = String(row.dedupeHash || '').trim();
    if (!dedupeHash) {
      blockers.push('MISSING_DEDUPE_HASH');
    } else {
      if ((duplicateDedupeCounts.get(dedupeHash) || 0) > 1) {
        blockers.push('DUPLICATE_DEDUPE_HASH_IN_STAGING');
      }

      if (existingTransactionDedupeHashes.has(dedupeHash)) {
        blockers.push('TRANSACTION_ALREADY_EXISTS_FOR_DEDUPE_HASH');
      }
    }

    if (existingInventoryMovementRowNos.has(row.rowNo)) {
      blockers.push('INVENTORY_MOVEMENT_ALREADY_EXISTS_FOR_ROW');
    }

    return {
      stagingRowId: row.id,
      rowNo: row.rowNo,
      businessMonth: row.businessMonth,
      matchStatus: row.matchStatus,
      matchReason: row.matchReason,
      dedupeHash: row.dedupeHash,
      amazonOrderId,
      orderItemId,
      sellerSku,
      asin,
      itemPriceAmount,
      quantityOrdered,
      targetEntityType: projectedTargetEntityType,
      targetEntityId: projectedTargetEntityId,
      readiness: blockers.length > 0 ? 'BLOCKED' : 'READY',
      blockers,
      warnings,
    };
  });

  const duplicateRows = readinessRows.filter((row) =>
    row.blockers.includes('DUPLICATE_DEDUPE_HASH_IN_STAGING'),
  ).length;
  const existingTransactionRows = readinessRows.filter((row) =>
    row.blockers.includes('TRANSACTION_ALREADY_EXISTS_FOR_DEDUPE_HASH'),
  ).length;
  const existingInventoryMovementRows = readinessRows.filter((row) =>
    row.blockers.includes('INVENTORY_MOVEMENT_ALREADY_EXISTS_FOR_ROW'),
  ).length;
  const unresolvedSkuRows = readinessRows.filter((row) =>
    row.warnings.includes('SKU_NOT_LINKED_TO_TARGET_ENTITY_YET'),
  ).length;
  const missingAmountRows = readinessRows.filter((row) =>
    row.blockers.includes('MISSING_ITEM_PRICE_AMOUNT'),
  ).length;
  const missingOrderIdentityRows = readinessRows.filter((row) =>
    row.blockers.includes('MISSING_ORDER_IDENTITY'),
  ).length;

  const readyRows = readinessRows.filter((row) => row.readiness === 'READY').length;
  const blockedRows = readinessRows.length - readyRows;

  const commitBlockedReasons: string[] = [];
  if (importJob.status !== 'SUCCEEDED') commitBlockedReasons.push('IMPORT_JOB_NOT_SUCCEEDED');
  if (stagingRows.length === 0) commitBlockedReasons.push('NO_STAGING_ROWS');
  if (blockedRows > 0) commitBlockedReasons.push('BLOCKED_ROWS_PRESENT');
  if (unresolvedSkuRows > 0) commitBlockedReasons.push('UNRESOLVED_SKU_ROWS_PRESENT');

  return assertAmazonSpApiOrdersStagingCommitReadinessContract({
    source: 'amazon-sp-api-orders-staging-commit-readiness',
    routeImplementedNow: true,
    route: '/api/imports/amazon-sp-api/orders/staging-commit-readiness',
    guardedBy: 'JwtAuthGuard',
    companyScoped: true,
    dryRun: true,
    writesDatabase: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,
    importJobId,
    importJobFound: true,
    sourceType: importJob.sourceType,
    status: importJob.status,
    totalRows: stagingRows.length,
    readyRows,
    blockedRows,
    duplicateRows,
    existingTransactionRows,
    existingInventoryMovementRows,
    unresolvedSkuRows,
    missingAmountRows,
    missingOrderIdentityRows,
    canCommit: commitBlockedReasons.length === 0,
    commitBlockedReasons,
    rows: readinessRows,
  });
}
