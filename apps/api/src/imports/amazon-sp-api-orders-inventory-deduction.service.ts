import {
  normalizeAmazonSpApiSellerSku,
  type AmazonSpApiOrdersSkuResolutionRowResult,
} from './amazon-sp-api-orders-sku-resolution-audit.service';

export type AmazonSpApiOrdersInventoryDeductionPrisma = {
  transaction: {
    findMany(args: {
      where: {
        companyId: string;
        importJobId: string;
        direction: 'INCOME';
        sourceType: 'IMPORT';
      };
      orderBy?: { sourceRowNo: 'asc' | 'desc' };
    }): Promise<AmazonSpApiOrdersCommittedIncomeTransaction[]>;
  };
  importStagingRow: {
    findMany(args: {
      where: {
        importJobId: string;
        companyId: string;
        module: string;
      };
      orderBy?: { rowNo: 'asc' | 'desc' };
    }): Promise<AmazonSpApiOrdersInventoryStagingRow[]>;
  };
  inventoryMovement: {
    findFirst(args: {
      where: {
        companyId: string;
        sourceType: string;
        sourceId: string;
      };
    }): Promise<{ id: string } | null>;
    create(args: {
      data: {
        companyId: string;
        skuId: string;
        type: 'OUT';
        quantity: number;
        occurredAt: Date;
        sourceType: string;
        sourceId: string;
        importJobId?: string | null;
        sourceRowNo?: number | null;
        transactionId?: string | null;
        businessMonth?: string | null;
        memo?: string | null;
      };
    }): Promise<{ id: string } & Record<string, unknown>>;
  };
  inventoryBalance: {
    upsert(args: {
      where: {
        companyId_skuId: {
          companyId: string;
          skuId: string;
        };
      };
      create: {
        companyId: string;
        skuId: string;
        quantity: number;
        reservedQty?: number;
        alertLevel?: number;
      };
      update: {
        quantity: {
          decrement: number;
        };
      };
    }): Promise<Record<string, unknown>>;
  };
};

export type AmazonSpApiOrdersCommittedIncomeTransaction = {
  id: string;
  companyId: string;
  storeId: string;
  importJobId?: string | null;
  sourceRowNo?: number | null;
  externalRef?: string | null;
  occurredAt: Date | string;
  businessMonth?: string | null;
  dedupeHash?: string | null;
};

export type AmazonSpApiOrdersInventoryStagingRow = {
  id: string;
  importJobId: string;
  companyId: string;
  module: string;
  rowNo: number;
  businessMonth?: string | null;
  normalizedPayloadJson: unknown;
  matchStatus: string;
  targetEntityType?: string | null;
  targetEntityId?: string | null;
};

export type DeductAmazonSpApiOrdersInventoryInput = {
  prisma: AmazonSpApiOrdersInventoryDeductionPrisma;
  companyId: string;
  importJobId: string;
  skuResolutionRows: AmazonSpApiOrdersSkuResolutionRowResult[];
  occurredAtFallback?: Date;
};

export type DeductAmazonSpApiOrdersInventoryResult = {
  step: 'Step140-T';
  source: 'amazon-sp-api-orders-inventory-deduction';
  companyId: string;
  importJobId: string;
  inventoryWriteNow: true;
  transactionWriteNow: false;
  inventoryMovementCreatedCount: number;
  inventoryBalanceUpdatedCount: number;
  skippedCount: number;
  duplicateSkippedCount: number;
  unresolvedSkuSkippedCount: number;
  transactionMissingSkippedCount: number;
  invalidPayloadSkippedCount: number;
  deductions: Array<{
    rowNo: number;
    transactionId: string;
    inventoryMovementId: string;
    skuId: string;
    sellerSku: string | null;
    sourceId: string;
    quantityDeducted: number;
    businessMonth: string | null;
  }>;
  skippedRows: Array<{
    rowNo: number;
    reasonCode:
      | 'UNRESOLVED_SKU'
      | 'DUPLICATE_INVENTORY_MOVEMENT'
      | 'MISSING_COMMITTED_TRANSACTION'
      | 'INVALID_PAYLOAD'
      | 'ZERO_OR_NEGATIVE_QUANTITY';
    message: string;
  }>;
  boundaries: {
    writesInventoryMovement: true;
    writesInventoryBalance: true;
    writesTransaction: false;
    createsTransaction: false;
    writesImportStagingRow: false;
    callsAmazon: false;
    runsSettlementReconciliation: false;
    runsBankReconciliation: false;
    requiresResolvedSku: true;
    requiresCommittedIncomeTransaction: true;
  };
};

type NormalizedPayload = {
  storeId?: string;
  amazonOrder?: {
    amazonOrderId?: string;
    purchaseDate?: string;
    businessMonth?: string;
  } | null;
  amazonOrderItem?: {
    amazonOrderId?: string;
    orderItemId?: string;
    sellerSku?: string | null;
    asin?: string | null;
    quantityOrdered?: number;
    itemLevelDedupeHash?: string;
  } | null;
};


function isAmazonSpApiOrdersOrderItemStagingPayload(payloadInput: unknown): boolean {
  const payload = coercePayload(payloadInput);
  const payloadRecord = payload as Record<string, unknown>;
  const rowKind = typeof payloadRecord.rowKind === 'string' ? payloadRecord.rowKind : '';
  const stagingLevel = typeof payloadRecord.stagingLevel === 'string' ? payloadRecord.stagingLevel : '';

  if (rowKind === 'order-header' || stagingLevel === 'order') return false;
  if (rowKind === 'order-item' || stagingLevel === 'item') return true;

  const itemRecord =
    payloadRecord.item && typeof payloadRecord.item === 'object' && !Array.isArray(payloadRecord.item)
      ? (payloadRecord.item as Record<string, unknown>)
      : null;
  const orderItemId =
    itemRecord && typeof itemRecord.orderItemId === 'string'
      ? itemRecord.orderItemId
      : typeof payloadRecord.orderItemId === 'string'
        ? payloadRecord.orderItemId
        : '';

  return Boolean(orderItemId);
}


export async function deductAmazonSpApiOrdersInventoryFromCommittedTransactions(
  input: DeductAmazonSpApiOrdersInventoryInput,
): Promise<DeductAmazonSpApiOrdersInventoryResult> {
  assertDeductionInput(input);

  const [transactions, stagingRows] = await Promise.all([
    input.prisma.transaction.findMany({
      where: {
        companyId: input.companyId,
        importJobId: input.importJobId,
        direction: 'INCOME',
        sourceType: 'IMPORT',
      },
      orderBy: { sourceRowNo: 'asc' },
    }),
    input.prisma.importStagingRow.findMany({
      where: {
        importJobId: input.importJobId,
        companyId: input.companyId,
        module: 'store-orders',
      },
      orderBy: { rowNo: 'asc' },
    }),
  ]);

  const itemStagingRows = stagingRows.filter((row) => isAmazonSpApiOrdersOrderItemStagingPayload(row.normalizedPayloadJson));

  const transactionByRowNo = new Map<number, AmazonSpApiOrdersCommittedIncomeTransaction>();
  for (const tx of transactions) {
    if (typeof tx.sourceRowNo === 'number') {
      transactionByRowNo.set(tx.sourceRowNo, tx);
    }
  }

  const resolutionByRowNo = new Map<number, AmazonSpApiOrdersSkuResolutionRowResult>();
  for (const row of input.skuResolutionRows) {
    resolutionByRowNo.set(row.rowNo, row);
  }

  const deductions: DeductAmazonSpApiOrdersInventoryResult['deductions'] = [];
  const skippedRows: DeductAmazonSpApiOrdersInventoryResult['skippedRows'] = [];

  let duplicateSkippedCount = 0;
  let unresolvedSkuSkippedCount = 0;
  let transactionMissingSkippedCount = 0;
  let invalidPayloadSkippedCount = 0;

  for (const row of itemStagingRows) {
    const payload = coercePayload(row.normalizedPayloadJson);
    const item = payload.amazonOrderItem;
    const order = payload.amazonOrder;
    const amazonOrderId = item?.amazonOrderId || order?.amazonOrderId || null;
    const orderItemId = item?.orderItemId || row.targetEntityId || null;
    const quantityOrdered = normalizeQuantity(item?.quantityOrdered);
    const sourceId = amazonOrderId && orderItemId ? `${amazonOrderId}/${orderItemId}` : null;

    if (!amazonOrderId || !orderItemId || !sourceId) {
      invalidPayloadSkippedCount += 1;
      skippedRows.push({
        rowNo: row.rowNo,
        reasonCode: 'INVALID_PAYLOAD',
        message: 'Skipped inventory deduction because amazonOrderId/orderItemId is missing.',
      });
      continue;
    }

    if (quantityOrdered <= 0) {
      invalidPayloadSkippedCount += 1;
      skippedRows.push({
        rowNo: row.rowNo,
        reasonCode: 'ZERO_OR_NEGATIVE_QUANTITY',
        message: `Skipped inventory deduction because quantityOrdered is ${quantityOrdered}.`,
      });
      continue;
    }

    const resolution = resolutionByRowNo.get(row.rowNo);
    if (!resolution?.skuId || !resolution.inventoryDeductionEligible) {
      unresolvedSkuSkippedCount += 1;
      skippedRows.push({
        rowNo: row.rowNo,
        reasonCode: 'UNRESOLVED_SKU',
        message: 'Skipped inventory deduction because SKU is unresolved or not deduction eligible.',
      });
      continue;
    }

    const transaction = transactionByRowNo.get(row.rowNo);
    if (!transaction) {
      transactionMissingSkippedCount += 1;
      skippedRows.push({
        rowNo: row.rowNo,
        reasonCode: 'MISSING_COMMITTED_TRANSACTION',
        message: 'Skipped inventory deduction because committed income Transaction was not found.',
      });
      continue;
    }

    const existingMovement = await input.prisma.inventoryMovement.findFirst({
      where: {
        companyId: input.companyId,
        sourceType: 'AMAZON_SP_API_ORDER',
        sourceId,
      },
    });

    if (existingMovement) {
      duplicateSkippedCount += 1;
      skippedRows.push({
        rowNo: row.rowNo,
        reasonCode: 'DUPLICATE_INVENTORY_MOVEMENT',
        message: `Skipped inventory deduction because InventoryMovement already exists for ${sourceId}.`,
      });
      continue;
    }

    const occurredAt = normalizeOccurredAt(order?.purchaseDate, transaction.occurredAt, input.occurredAtFallback);
    const businessMonth = order?.businessMonth || row.businessMonth || transaction.businessMonth || null;

    const movement = await input.prisma.inventoryMovement.create({
      data: {
        companyId: input.companyId,
        skuId: resolution.skuId,
        type: 'OUT',
        quantity: quantityOrdered,
        occurredAt,
        sourceType: 'AMAZON_SP_API_ORDER',
        sourceId,
        importJobId: input.importJobId,
        sourceRowNo: row.rowNo,
        transactionId: transaction.id,
        businessMonth,
        memo: buildInventoryDeductionMemo(sourceId, resolution.sellerSku, quantityOrdered),
      },
    });

    await input.prisma.inventoryBalance.upsert({
      where: {
        companyId_skuId: {
          companyId: input.companyId,
          skuId: resolution.skuId,
        },
      },
      create: {
        companyId: input.companyId,
        skuId: resolution.skuId,
        quantity: -quantityOrdered,
        reservedQty: 0,
        alertLevel: 0,
      },
      update: {
        quantity: {
          decrement: quantityOrdered,
        },
      },
    });

    deductions.push({
      rowNo: row.rowNo,
      transactionId: transaction.id,
      inventoryMovementId: movement.id,
      skuId: resolution.skuId,
      sellerSku: resolution.sellerSku,
      sourceId,
      quantityDeducted: quantityOrdered,
      businessMonth,
    });
  }

  return {
    step: 'Step140-T',
    source: 'amazon-sp-api-orders-inventory-deduction',
    companyId: input.companyId,
    importJobId: input.importJobId,
    inventoryWriteNow: true,
    transactionWriteNow: false,
    inventoryMovementCreatedCount: deductions.length,
    inventoryBalanceUpdatedCount: deductions.length,
    skippedCount: skippedRows.length,
    duplicateSkippedCount,
    unresolvedSkuSkippedCount,
    transactionMissingSkippedCount,
    invalidPayloadSkippedCount,
    deductions,
    skippedRows,
    boundaries: {
      writesInventoryMovement: true,
      writesInventoryBalance: true,
      writesTransaction: false,
      createsTransaction: false,
      writesImportStagingRow: false,
      callsAmazon: false,
      runsSettlementReconciliation: false,
      runsBankReconciliation: false,
      requiresResolvedSku: true,
      requiresCommittedIncomeTransaction: true,
    },
  };
}

function assertDeductionInput(input: DeductAmazonSpApiOrdersInventoryInput): void {
  if (!input.prisma) throw new Error('Step140-T inventory deduction violation: prisma adapter is required.');
  if (!input.prisma.transaction?.findMany) {
    throw new Error('Step140-T inventory deduction violation: prisma.transaction.findMany is required.');
  }
  if (!input.prisma.importStagingRow?.findMany) {
    throw new Error('Step140-T inventory deduction violation: prisma.importStagingRow.findMany is required.');
  }
  if (!input.prisma.inventoryMovement?.findFirst) {
    throw new Error('Step140-T inventory deduction violation: prisma.inventoryMovement.findFirst is required.');
  }
  if (!input.prisma.inventoryMovement?.create) {
    throw new Error('Step140-T inventory deduction violation: prisma.inventoryMovement.create is required.');
  }
  if (!input.prisma.inventoryBalance?.upsert) {
    throw new Error('Step140-T inventory deduction violation: prisma.inventoryBalance.upsert is required.');
  }
  if (!input.companyId) throw new Error('Step140-T inventory deduction violation: companyId is required.');
  if (!input.importJobId) throw new Error('Step140-T inventory deduction violation: importJobId is required.');
  if (!Array.isArray(input.skuResolutionRows)) {
    throw new Error('Step140-T inventory deduction violation: skuResolutionRows must be an array.');
  }
}

function coercePayload(value: unknown): NormalizedPayload {
  if (!value || typeof value !== 'object') return {};
  return value as NormalizedPayload;
}

function normalizeQuantity(value: unknown): number {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.trunc(n);
}

function normalizeOccurredAt(
  orderPurchaseDate?: string,
  transactionOccurredAt?: string | Date,
  fallback?: Date,
): Date {
  const candidates = [orderPurchaseDate, transactionOccurredAt, fallback, new Date()];

  for (const candidate of candidates) {
    const date = candidate instanceof Date ? candidate : new Date(String(candidate));
    if (!Number.isNaN(date.getTime())) return date;
  }

  return new Date();
}

function buildInventoryDeductionMemo(
  sourceId: string,
  sellerSku: string | null,
  quantityOrdered: number,
): string {
  const normalizedSku = normalizeAmazonSpApiSellerSku(sellerSku);

  return [
    'Amazon SP-API order inventory deduction',
    `source=${sourceId}`,
    `qty=${quantityOrdered}`,
    normalizedSku ? `sellerSku=${normalizedSku}` : null,
  ].filter(Boolean).join(' / ').slice(0, 500);
}
