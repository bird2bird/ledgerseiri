export type AmazonSpApiOrdersTransactionCommitPrisma = {
  importJob: {
    findFirst(args: {
      where: {
        id: string;
        companyId: string;
        module?: string;
        sourceType?: string;
      };
    }): Promise<{
      id: string;
      companyId: string;
      module?: string | null;
      sourceType?: string | null;
      filename?: string | null;
      status?: string | null;
    } | null>;
    update(args: {
      where: { id: string };
      data: {
        status?: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
        successRows?: number;
        failedRows?: number;
        errorMessage?: string | null;
        importedAt?: Date;
      };
    }): Promise<Record<string, unknown>>;
  };
  importStagingRow: {
    findMany(args: {
      where: {
        importJobId: string;
        companyId: string;
        module: string;
      };
      orderBy?: { rowNo: 'asc' | 'desc' };
    }): Promise<AmazonSpApiOrdersTransactionCommitStagingRow[]>;
  };
  transaction: {
    findFirst(args: {
      where: {
        companyId: string;
        dedupeHash: string;
      };
    }): Promise<{ id: string } | null>;
    create(args: {
      data: {
        companyId: string;
        storeId: string;
        type: 'SALE';
        direction: 'INCOME';
        sourceType: 'IMPORT';
        amount: number;
        currency: string;
        occurredAt: Date;
        externalRef?: string | null;
        memo?: string | null;
        businessMonth?: string | null;
        dedupeHash?: string | null;
        importJobId?: string | null;
        sourceFileName?: string | null;
        sourceRowNo?: number | null;
      };
    }): Promise<{ id: string } & Record<string, unknown>>;
  };
};

export type AmazonSpApiOrdersTransactionCommitStagingRow = {
  id: string;
  importJobId: string;
  companyId: string;
  module: string;
  rowNo: number;
  businessMonth?: string | null;
  rawPayloadJson: unknown;
  normalizedPayloadJson: unknown;
  dedupeHash?: string | null;
  matchStatus: string;
  matchReason?: string | null;
  targetEntityType?: string | null;
  targetEntityId?: string | null;
};

export type CommitAmazonSpApiOrdersStagingRowsInput = {
  prisma: AmazonSpApiOrdersTransactionCommitPrisma;
  companyId: string;
  importJobId: string;
  committedAt?: Date;
};

export type CommitAmazonSpApiOrdersStagingRowsResult = {
  step: 'Step140-R';
  source: 'amazon-sp-api-orders-transaction-commit';
  companyId: string;
  importJobId: string;
  transactionWriteNow: true;
  inventoryWriteNow: false;
  importJobWriteNow: true;
  importStagingRowWriteNow: false;
  writesDatabase: true;
  committedTransactionCount: number;
  skippedRowCount: number;
  duplicateSkippedCount: number;
  unresolvedSkuSkippedCount: number;
  failedRowCount: number;
  committedTransactions: Array<{
    transactionId: string;
    rowNo: number;
    amazonOrderId: string;
    orderItemId: string;
    amount: number;
    businessMonth: string | null;
    dedupeHash: string;
  }>;
  skippedRows: Array<{
    rowNo: number;
    reasonCode: 'UNRESOLVED_SKU' | 'DUPLICATE_TRANSACTION' | 'INVALID_PAYLOAD' | 'NOT_READY_FOR_REVIEW';
    message: string;
  }>;
  boundaries: {
    writesOnlyIncomeTransactionsAndImportJobStatus: true;
    doesNotWriteInventory: true;
    doesNotDeductInventory: true;
    doesNotWriteImportStagingRow: true;
    doesNotCallAmazon: true;
    doesNotRunSettlementReconciliation: true;
    doesNotRunBankReconciliation: true;
  };
};

type NormalizedPayload = {
  sourceType?: string;
  domain?: string;
  module?: string;
  storeId?: string;
  marketplaceId?: string;
  region?: string;
  amazonOrder?: {
    amazonOrderId?: string;
    purchaseDate?: string;
    businessMonth?: string;
    orderStatus?: string;
    currencyCode?: string;
    orderTotalAmount?: number;
  } | null;
  amazonOrderItem?: {
    amazonOrderId?: string;
    orderItemId?: string;
    sellerSku?: string | null;
    title?: string;
    quantityOrdered?: number;
    itemPriceAmount?: number;
    itemTaxAmount?: number;
    itemCurrencyCode?: string;
    itemLevelDedupeHash?: string;
  } | null;
  skuResolutionStatus?: string;
  inventoryResolutionStatus?: string;
  transactionCommitStatus?: string;
};

export async function commitAmazonSpApiOrdersStagingRowsToIncomeTransactions(
  input: CommitAmazonSpApiOrdersStagingRowsInput,
): Promise<CommitAmazonSpApiOrdersStagingRowsResult> {
  assertCommitInput(input);

  const importJob = await input.prisma.importJob.findFirst({
    where: {
      id: input.importJobId,
      companyId: input.companyId,
      module: 'store-orders',
      sourceType: 'amazon-sp-api',
    },
  });

  if (!importJob) {
    throw new Error('Step140-R commit violation: ImportJob not found for company/module/sourceType.');
  }

  const rows = await input.prisma.importStagingRow.findMany({
    where: {
      importJobId: input.importJobId,
      companyId: input.companyId,
      module: 'store-orders',
    },
    orderBy: {
      rowNo: 'asc',
    },
  });

  const committedTransactions: CommitAmazonSpApiOrdersStagingRowsResult['committedTransactions'] = [];
  const skippedRows: CommitAmazonSpApiOrdersStagingRowsResult['skippedRows'] = [];

  let duplicateSkippedCount = 0;
  let unresolvedSkuSkippedCount = 0;
  let failedRowCount = 0;

  for (const row of rows) {
    if (row.matchStatus !== 'READY_FOR_REVIEW') {
      const reasonCode = row.matchStatus === 'UNRESOLVED_SKU' ? 'UNRESOLVED_SKU' : 'NOT_READY_FOR_REVIEW';
      if (reasonCode === 'UNRESOLVED_SKU') unresolvedSkuSkippedCount += 1;

      skippedRows.push({
        rowNo: row.rowNo,
        reasonCode,
        message: `Skipped row because matchStatus is ${row.matchStatus}.`,
      });
      continue;
    }

    const payload = coerceNormalizedPayload(row.normalizedPayloadJson);
    const order = payload.amazonOrder;
    const item = payload.amazonOrderItem;

    if (!payload.storeId || !order?.amazonOrderId || !order?.purchaseDate || !item?.orderItemId) {
      failedRowCount += 1;
      skippedRows.push({
        rowNo: row.rowNo,
        reasonCode: 'INVALID_PAYLOAD',
        message: 'Skipped row because normalizedPayloadJson is missing storeId/order/orderItem fields.',
      });
      continue;
    }

    const dedupeHash = buildAmazonSpApiOrdersTransactionDedupeHash(
      input.companyId,
      order.amazonOrderId,
      item.orderItemId,
    );

    const existing = await input.prisma.transaction.findFirst({
      where: {
        companyId: input.companyId,
        dedupeHash,
      },
    });

    if (existing) {
      duplicateSkippedCount += 1;
      skippedRows.push({
        rowNo: row.rowNo,
        reasonCode: 'DUPLICATE_TRANSACTION',
        message: `Skipped row because Transaction already exists for dedupeHash ${dedupeHash}.`,
      });
      continue;
    }

    const amount = normalizeIncomeAmount(item.itemPriceAmount);
    const occurredAt = new Date(order.purchaseDate);
    const businessMonth = order.businessMonth || order.purchaseDate.slice(0, 7);

    const transaction = await input.prisma.transaction.create({
      data: {
        companyId: input.companyId,
        storeId: payload.storeId,
        type: 'SALE',
        direction: 'INCOME',
        sourceType: 'IMPORT',
        amount,
        currency: item.itemCurrencyCode || order.currencyCode || 'JPY',
        occurredAt,
        externalRef: `${order.amazonOrderId}/${item.orderItemId}`,
        memo: buildTransactionMemo(order.amazonOrderId, item.orderItemId, item.sellerSku, item.title),
        businessMonth,
        dedupeHash,
        importJobId: input.importJobId,
        sourceFileName: importJob.filename || 'amazon-sp-api-orders',
        sourceRowNo: row.rowNo,
      },
    });

    committedTransactions.push({
      transactionId: transaction.id,
      rowNo: row.rowNo,
      amazonOrderId: order.amazonOrderId,
      orderItemId: item.orderItemId,
      amount,
      businessMonth,
      dedupeHash,
    });
  }

  const successRows = committedTransactions.length;
  const skippedRowCount = skippedRows.length;

  await input.prisma.importJob.update({
    where: {
      id: input.importJobId,
    },
    data: {
      status: failedRowCount > 0 ? 'FAILED' : 'SUCCEEDED',
      successRows,
      failedRows: skippedRowCount,
      errorMessage: failedRowCount > 0 ? 'Some Amazon SP-API Orders staging rows failed transaction commit.' : null,
      importedAt: input.committedAt || new Date(),
    },
  });

  return {
    step: 'Step140-R',
    source: 'amazon-sp-api-orders-transaction-commit',
    companyId: input.companyId,
    importJobId: input.importJobId,
    transactionWriteNow: true,
    inventoryWriteNow: false,
    importJobWriteNow: true,
    importStagingRowWriteNow: false,
    writesDatabase: true,
    committedTransactionCount: committedTransactions.length,
    skippedRowCount,
    duplicateSkippedCount,
    unresolvedSkuSkippedCount,
    failedRowCount,
    committedTransactions,
    skippedRows,
    boundaries: {
      writesOnlyIncomeTransactionsAndImportJobStatus: true,
      doesNotWriteInventory: true,
      doesNotDeductInventory: true,
      doesNotWriteImportStagingRow: true,
      doesNotCallAmazon: true,
      doesNotRunSettlementReconciliation: true,
      doesNotRunBankReconciliation: true,
    },
  };
}

export function buildAmazonSpApiOrdersTransactionDedupeHash(
  companyId: string,
  amazonOrderId: string,
  orderItemId: string,
): string {
  return ['amazon-sp-api-orders-transaction', companyId, amazonOrderId, orderItemId].join(':');
}

function assertCommitInput(input: CommitAmazonSpApiOrdersStagingRowsInput): void {
  if (!input.prisma) throw new Error('Step140-R commit violation: prisma adapter is required.');
  if (!input.prisma.importJob?.findFirst) throw new Error('Step140-R commit violation: prisma.importJob.findFirst is required.');
  if (!input.prisma.importJob?.update) throw new Error('Step140-R commit violation: prisma.importJob.update is required.');
  if (!input.prisma.importStagingRow?.findMany) {
    throw new Error('Step140-R commit violation: prisma.importStagingRow.findMany is required.');
  }
  if (!input.prisma.transaction?.findFirst) throw new Error('Step140-R commit violation: prisma.transaction.findFirst is required.');
  if (!input.prisma.transaction?.create) throw new Error('Step140-R commit violation: prisma.transaction.create is required.');
  if (!input.companyId) throw new Error('Step140-R commit violation: companyId is required.');
  if (!input.importJobId) throw new Error('Step140-R commit violation: importJobId is required.');
}

function coerceNormalizedPayload(value: unknown): NormalizedPayload {
  if (!value || typeof value !== 'object') {
    return {};
  }

  return value as NormalizedPayload;
}

function normalizeIncomeAmount(value: unknown): number {
  const n = Number(value || 0);

  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.trunc(n));
}

function buildTransactionMemo(
  amazonOrderId: string,
  orderItemId: string,
  sellerSku?: string | null,
  title?: string,
): string {
  const parts = [
    'Amazon SP-API order item income',
    `order=${amazonOrderId}`,
    `item=${orderItemId}`,
  ];

  if (sellerSku) parts.push(`sku=${sellerSku}`);
  if (title) parts.push(`title=${title}`);

  return parts.join(' / ').slice(0, 500);
}
