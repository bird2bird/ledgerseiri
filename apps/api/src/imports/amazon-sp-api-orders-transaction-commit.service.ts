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


export type PreviewAmazonSpApiOrdersIncomeTransactionDryRunInput = {
  prisma: any;
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

function readPreviewRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function readPreviewString(value: unknown): string | null {
  const text = String(value ?? '').trim();
  return text ? text : null;
}

function readPreviewNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const normalized = String(value ?? '').replace(/,/g, '').trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function readPreviewOrderAndItem(payload: Record<string, unknown>): {
  order: Record<string, unknown>;
  item: Record<string, unknown>;
} {
  const order =
    readPreviewRecord(payload.order) ||
    readPreviewRecord(payload.normalizedOrder) ||
    readPreviewRecord(payload.amazonOrder);

  const item =
    readPreviewRecord(payload.item) ||
    readPreviewRecord(payload.orderItem) ||
    readPreviewRecord(payload.normalizedOrderItem) ||
    readPreviewRecord(payload.amazonOrderItem);

  return {
    order: Object.keys(order).length ? order : payload,
    item: Object.keys(item).length ? item : payload,
  };
}

// Step142-B1: service-only dry-run projection.

function isAmazonSpApiOrdersOrderItemStagingPayload(payloadInput: unknown): boolean {
  const payload = coerceNormalizedPayload(payloadInput);
  const payloadRecord = payload as Record<string, unknown>;
  const rowKind = readPreviewString(payloadRecord.rowKind);
  const stagingLevel = readPreviewString(payloadRecord.stagingLevel);

  if (rowKind === 'order-header' || stagingLevel === 'order') return false;
  if (rowKind === 'order-item' || stagingLevel === 'item') return true;

  const itemRecord =
    payloadRecord.item && typeof payloadRecord.item === 'object' && !Array.isArray(payloadRecord.item)
      ? (payloadRecord.item as Record<string, unknown>)
      : null;

  return Boolean(readPreviewString(itemRecord?.orderItemId) || readPreviewString(payloadRecord.orderItemId));
}


function isAmazonSpApiOrdersOrderHeaderStagingPayload(payloadInput: unknown): boolean {
  const payload = coerceNormalizedPayload(payloadInput);
  const payloadRecord = payload as Record<string, unknown>;
  const rowKind = readPreviewString(payloadRecord.rowKind);
  const stagingLevel = readPreviewString(payloadRecord.stagingLevel);
  return rowKind === 'order-header' || stagingLevel === 'order';
}

type AmazonSpApiOrdersIncomeDryRunHeaderContext = {
  purchaseDate: string | null;
  orderStatus: string | null;
  orderTotalAmount: number | null;
};

function buildAmazonSpApiOrdersIncomeDryRunHeaderContext(
  payloadInput: unknown,
): { amazonOrderId: string | null; context: AmazonSpApiOrdersIncomeDryRunHeaderContext } {
  const payload = coerceNormalizedPayload(payloadInput);
  const payloadRecord = payload as Record<string, unknown>;
  const { order } = readPreviewOrderAndItem(payloadRecord);

  const amazonOrderId =
    readPreviewString(order.amazonOrderId) ||
    readPreviewString(order.orderId) ||
    readPreviewString(payloadRecord.amazonOrderId) ||
    readPreviewString(payloadRecord.orderId);

  const purchaseDate =
    readPreviewString(order.purchaseDate) ||
    readPreviewString(order.orderDate) ||
    readPreviewString(payloadRecord.purchaseDate) ||
    readPreviewString(payloadRecord.orderDate);

  const orderStatus =
    readPreviewString(order.orderStatus) ||
    readPreviewString(order.status) ||
    readPreviewString(payloadRecord.orderStatus) ||
    readPreviewString(payloadRecord.status);

  const orderTotalAmount =
    readPreviewNumber(order.orderTotalAmount) ??
    readPreviewNumber(order.totalAmount) ??
    readPreviewNumber(order.amount) ??
    readPreviewNumber(payloadRecord.orderTotalAmount) ??
    readPreviewNumber(payloadRecord.totalAmount) ??
    readPreviewNumber(payloadRecord.amount);

  return {
    amazonOrderId,
    context: {
      purchaseDate,
      orderStatus,
      orderTotalAmount,
    },
  };
}

function normalizeOptionalIncomeAmount(value: unknown): number | null {
  const amount = readPreviewNumber(value);
  if (amount === null) return null;
  return normalizeIncomeAmount(amount);
}

// Step147-B: income candidate amount policy.
// Item tax is returned as a separate reference field and is not added to candidateAmount,
// because itemPriceAmount may already represent buyer-paid item price depending on Amazon source semantics.
function buildAmazonSpApiOrdersIncomeCandidateAmount(input: {
  itemPriceAmount: number | null;
  shippingPriceAmount: number | null;
}): number | null {
  if (input.itemPriceAmount === null) return null;
  return normalizeIncomeAmount(input.itemPriceAmount + (input.shippingPriceAmount || 0));
}


// This function must stay read-only: no Transaction create, no InventoryMovement create,
// no ImportJob mutation, and no ImportStagingRow mutation.
export async function previewAmazonSpApiOrdersStagingRowsIncomeTransactionsDryRun(
  input: PreviewAmazonSpApiOrdersIncomeTransactionDryRunInput,
): Promise<PreviewAmazonSpApiOrdersIncomeTransactionDryRunResult> {
  if (!input?.prisma) throw new Error('Step142-B1 dry-run violation: prisma adapter is required.');
  if (!input.companyId) throw new Error('Step142-B1 dry-run violation: companyId is required.');
  if (!input.importJobId) throw new Error('Step142-B1 dry-run violation: importJobId is required.');
  if (!input.prisma.importJob?.findFirst) {
    throw new Error('Step142-B1 dry-run violation: prisma.importJob.findFirst is required.');
  }
  if (!input.prisma.importStagingRow?.findMany) {
    throw new Error('Step142-B1 dry-run violation: prisma.importStagingRow.findMany is required.');
  }
  if (!input.prisma.transaction?.findFirst) {
    throw new Error('Step142-B1 dry-run violation: prisma.transaction.findFirst is required.');
  }

  const job = await input.prisma.importJob.findFirst({
    where: {
      id: input.importJobId,
      companyId: input.companyId,
      sourceType: 'amazon-sp-api-orders',
    },
  });

  if (!job) {
    throw new Error('Step142-B1 dry-run violation: amazon-sp-api-orders ImportJob not found.');
  }

  const stagingRows = await input.prisma.importStagingRow.findMany({
    where: {
      importJobId: input.importJobId,
      companyId: input.companyId,
      module: 'store-orders',
    },
    orderBy: {
      rowNo: 'asc',
    },
  });

  const dedupeCounts = new Map<string, number>();
  const headerContextByAmazonOrderId = new Map<string, AmazonSpApiOrdersIncomeDryRunHeaderContext>();
  const itemStagingRows = stagingRows.filter((row: AmazonSpApiOrdersTransactionCommitStagingRow) => isAmazonSpApiOrdersOrderItemStagingPayload(row.normalizedPayloadJson));

  for (const row of stagingRows) {
    if (!isAmazonSpApiOrdersOrderHeaderStagingPayload(row.normalizedPayloadJson)) continue;
    const headerContext = buildAmazonSpApiOrdersIncomeDryRunHeaderContext(row.normalizedPayloadJson);
    if (headerContext.amazonOrderId) {
      headerContextByAmazonOrderId.set(headerContext.amazonOrderId, headerContext.context);
    }
  }

  for (const row of itemStagingRows) {
    const key = String(row?.dedupeHash || '').trim();
    if (!key) continue;
    dedupeCounts.set(key, (dedupeCounts.get(key) || 0) + 1);
  }

  const rows: PreviewAmazonSpApiOrdersIncomeTransactionDryRunResult['rows'] = [];

  for (const row of itemStagingRows) {
    const blockers: string[] = [];
    const warnings: string[] = [];

    const payload = coerceNormalizedPayload(row?.normalizedPayloadJson);
    const { order, item } = readPreviewOrderAndItem(payload as Record<string, unknown>);

    const amazonOrderId =
      readPreviewString(order.amazonOrderId) ||
      readPreviewString(order.orderId) ||
      readPreviewString((payload as Record<string, unknown>).amazonOrderId) ||
      readPreviewString((payload as Record<string, unknown>).orderId);

    const orderItemId =
      readPreviewString(item.orderItemId) ||
      readPreviewString(item.amazonOrderItemId) ||
      readPreviewString((payload as Record<string, unknown>).orderItemId) ||
      readPreviewString((payload as Record<string, unknown>).amazonOrderItemId);

    const sellerSku =
      readPreviewString(item.sellerSku) ||
      readPreviewString(item.sku) ||
      readPreviewString((payload as Record<string, unknown>).sellerSku);

    const headerContext = amazonOrderId ? headerContextByAmazonOrderId.get(amazonOrderId) : undefined;
    const businessDate =
      readPreviewString(order.purchaseDate) ||
      readPreviewString(order.orderDate) ||
      readPreviewString((payload as Record<string, unknown>).purchaseDate) ||
      readPreviewString((payload as Record<string, unknown>).orderDate) ||
      headerContext?.purchaseDate ||
      null;
    const currency =
      readPreviewString(item.itemPriceCurrency) ||
      readPreviewString(item.currency) ||
      readPreviewString((payload as Record<string, unknown>).currency) ||
      'JPY';
    const itemPriceAmount = normalizeOptionalIncomeAmount(
      item.itemPriceAmount ??
        item.priceAmount ??
        (payload as Record<string, unknown>).itemPriceAmount ??
        (payload as Record<string, unknown>).grossAmount ??
        (payload as Record<string, unknown>).amount,
    );
    const itemTaxAmount = normalizeOptionalIncomeAmount(
      item.itemTaxAmount ??
        item.taxAmount ??
        (payload as Record<string, unknown>).itemTaxAmount ??
        (payload as Record<string, unknown>).taxAmount,
    );
    const shippingPriceAmount = normalizeOptionalIncomeAmount(
      item.shippingPriceAmount ??
        item.shippingAmount ??
        (payload as Record<string, unknown>).shippingPriceAmount ??
        (payload as Record<string, unknown>).shippingAmount,
    );
    const candidateAmount = buildAmazonSpApiOrdersIncomeCandidateAmount({
      itemPriceAmount,
      shippingPriceAmount,
    });
    const amount = candidateAmount;
    const orderStatus =
      readPreviewString(order.orderStatus) ||
      readPreviewString(order.status) ||
      readPreviewString((payload as Record<string, unknown>).orderStatus) ||
      readPreviewString((payload as Record<string, unknown>).status) ||
      headerContext?.orderStatus ||
      null;
    const orderTotalAmount =
      readPreviewNumber(order.orderTotalAmount) ??
      readPreviewNumber(order.totalAmount) ??
      readPreviewNumber((payload as Record<string, unknown>).orderTotalAmount) ??
      readPreviewNumber((payload as Record<string, unknown>).totalAmount) ??
      headerContext?.orderTotalAmount ??
      null;
    const asin =
      readPreviewString(item.asin) ||
      readPreviewString((payload as Record<string, unknown>).asin);
    const title =
      readPreviewString(item.title) ||
      readPreviewString(item.itemName) ||
      readPreviewString(item.productName) ||
      readPreviewString((payload as Record<string, unknown>).title) ||
      readPreviewString((payload as Record<string, unknown>).itemName) ||
      readPreviewString((payload as Record<string, unknown>).productName);

    if (!amazonOrderId || !orderItemId) {
      blockers.push('MISSING_ORDER_IDENTITY');
    }

    if (amount === null || !Number.isFinite(amount) || amount <= 0) {
      blockers.push('MISSING_OR_INVALID_AMOUNT');
    }

    const computedDedupeHash =
      amazonOrderId && orderItemId
        ? buildAmazonSpApiOrdersTransactionDedupeHash(input.companyId, amazonOrderId, orderItemId)
        : null;

    const dedupeHash = computedDedupeHash || readPreviewString(row?.dedupeHash);

    if (!dedupeHash) {
      blockers.push('MISSING_DEDUPE_HASH');
    } else if ((dedupeCounts.get(String(row?.dedupeHash || '').trim()) || 0) > 1) {
      blockers.push('DUPLICATE_DEDUPE_HASH_IN_IMPORT_JOB');
    }

    let existingTransactionId: string | null = null;
    if (dedupeHash) {
      const existing = await input.prisma.transaction.findFirst({
        where: {
          companyId: input.companyId,
          dedupeHash,
        },
        select: {
          id: true,
        },
      });
      existingTransactionId = existing?.id || null;
      if (existingTransactionId) {
        blockers.push('TRANSACTION_ALREADY_EXISTS_FOR_DEDUPE_HASH');
      }
    }

    const productSkuId =
      String(row?.targetEntityType || '') === 'ProductSku'
        ? readPreviewString(row?.targetEntityId)
        : null;

    if (!productSkuId) {
      warnings.push('PRODUCT_SKU_TARGET_NOT_PROJECTED_IN_TRANSACTION_DRY_RUN');
    }

    rows.push({
      stagingRowId: String(row?.id || ''),
      rowNo: typeof row?.rowNo === 'number' ? row.rowNo : null,
      amazonOrderId,
      orderItemId,
      sellerSku,
      asin,
      title,
      productSkuId,
      amount,
      itemPriceAmount,
      itemTaxAmount,
      shippingPriceAmount,
      candidateAmount,
      amountPolicy: 'ITEM_PRICE_PLUS_SHIPPING_EXCLUDES_TAX',
      currency,
      businessDate,
      businessMonth: readPreviewString(row?.businessMonth),
      orderStatus,
      orderTotalAmount,
      dedupeHash,
      existingTransactionId,
      blockers,
      warnings,
    });
  }

  const blockedRows = rows.filter((row) => row.blockers.length > 0).length;

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
      previewableRows: rows.length - blockedRows,
      blockedRows,
      duplicateRows: rows.filter((row) => row.blockers.includes('DUPLICATE_DEDUPE_HASH_IN_IMPORT_JOB')).length,
      existingTransactionRows: rows.filter((row) =>
        row.blockers.includes('TRANSACTION_ALREADY_EXISTS_FOR_DEDUPE_HASH'),
      ).length,
      missingAmountRows: rows.filter((row) => row.blockers.includes('MISSING_OR_INVALID_AMOUNT')).length,
      missingOrderIdentityRows: rows.filter((row) => row.blockers.includes('MISSING_ORDER_IDENTITY')).length,
      itemPriceTotal: rows.reduce((sum, row) => sum + (row.itemPriceAmount || 0), 0),
      itemTaxTotal: rows.reduce((sum, row) => sum + (row.itemTaxAmount || 0), 0),
      shippingPriceTotal: rows.reduce((sum, row) => sum + (row.shippingPriceAmount || 0), 0),
      candidateAmountTotal: rows.reduce((sum, row) => sum + (row.candidateAmount || 0), 0),
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

  const itemRows = rows.filter((row: AmazonSpApiOrdersTransactionCommitStagingRow) => isAmazonSpApiOrdersOrderItemStagingPayload(row.normalizedPayloadJson));

  const committedTransactions: CommitAmazonSpApiOrdersStagingRowsResult['committedTransactions'] = [];
  const skippedRows: CommitAmazonSpApiOrdersStagingRowsResult['skippedRows'] = [];

  let duplicateSkippedCount = 0;
  let unresolvedSkuSkippedCount = 0;
  let failedRowCount = 0;

  for (const row of itemRows) {
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
