import type { AmazonSpApiOrdersRealPreviewEnvelope } from './amazon-sp-api-orders-real-preview.service';

export type AmazonSpApiOrdersPreviewPersistencePrisma = {
  importJob: {
    create(args: {
      data: {
        companyId: string;
        domain: string;
        module?: string | null;
        sourceType?: string | null;
        filename: string;
        fileHash?: string | null;
        status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
        monthConflictPolicy?: string | null;
        totalRows?: number | null;
        successRows?: number | null;
        failedRows?: number | null;
        deletedRowCount?: number | null;
        fileMonthsJson?: unknown;
        conflictMonthsJson?: unknown;
        errorMessage?: string | null;
        importedAt?: Date | null;
      };
    }): Promise<{ id: string } & Record<string, unknown>>;
  };
  importStagingRow: {
    create(args: {
      data: {
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
    }): Promise<{ id: string } & Record<string, unknown>>;
  };
};

export type PersistAmazonSpApiOrdersPreviewInput = {
  prisma: AmazonSpApiOrdersPreviewPersistencePrisma;
  preview: AmazonSpApiOrdersRealPreviewEnvelope;
  filename?: string;
  importedAt?: Date;
};

export type PersistAmazonSpApiOrdersPreviewResult = {
  step: 'Step140-Q';
  source: 'amazon-sp-api-orders-preview-persistence';
  persisted: true;
  companyId: string;
  storeId: string;
  marketplaceId: string;
  importJobId: string;
  importJobWriteNow: true;
  importStagingRowWriteNow: true;
  transactionWriteNow: false;
  inventoryWriteNow: false;
  writesDatabase: true;
  transactionCreatedCount: 0;
  inventoryMovementCreatedCount: 0;
  stagingRowsCreatedCount: number;
  totalRows: number;
  successRows: number;
  failedRows: number;
  fileHash: string;
  fileMonths: string[];
  matchStatusSummary: {
    readyForReview: number;
    unresolvedSku: number;
  };
  boundaries: {
    writesOnlyImportJobAndStagingRows: true;
    doesNotWriteTransaction: true;
    doesNotWriteInventory: true;
    doesNotDeductInventory: true;
    doesNotRunSettlementReconciliation: true;
    doesNotRunBankReconciliation: true;
    doesNotCallAmazon: true;
    usesExistingPreviewEnvelopeOnly: true;
  };
};

export async function persistAmazonSpApiOrdersPreviewToImportStaging(
  input: PersistAmazonSpApiOrdersPreviewInput,
): Promise<PersistAmazonSpApiOrdersPreviewResult> {
  assertPersistInput(input);

  const preview = input.preview;
  const items = preview.normalizedOrderItems;
  const fileMonths = unique(
    preview.normalizedOrders
      .map((order) => order.businessMonth)
      .filter((value): value is string => Boolean(value)),
  );

  const fileHash = buildAmazonSpApiOrdersPreviewFileHash(preview);
  const importedAt = input.importedAt || new Date();

  const importJob = await input.prisma.importJob.create({
    data: {
      companyId: preview.companyId,
      domain: 'income',
      module: 'store-orders',
      sourceType: 'amazon-sp-api',
      filename: input.filename || buildDefaultAmazonSpApiOrdersPreviewFilename(preview),
      fileHash,
      status: 'SUCCEEDED',
      monthConflictPolicy: 'preview-persistence-only',
      totalRows: items.length,
      successRows: items.length,
      failedRows: 0,
      deletedRowCount: 0,
      fileMonthsJson: fileMonths,
      conflictMonthsJson: [],
      errorMessage: null,
      importedAt,
    },
  });

  let readyForReview = 0;
  let unresolvedSku = 0;
  let rowNo = 1;

  for (const item of items) {
    const order = preview.normalizedOrders.find((candidate) => candidate.amazonOrderId === item.amazonOrderId);
    const matchStatus = item.sellerSku ? 'READY_FOR_REVIEW' : 'UNRESOLVED_SKU';

    if (matchStatus === 'READY_FOR_REVIEW') readyForReview += 1;
    if (matchStatus === 'UNRESOLVED_SKU') unresolvedSku += 1;

    await input.prisma.importStagingRow.create({
      data: {
        importJobId: importJob.id,
        companyId: preview.companyId,
        module: 'store-orders',
        rowNo,
        businessMonth: order?.businessMonth || null,
        rawPayloadJson: {
          source: 'amazon-sp-api-orders-real-preview',
          previewStep: preview.step,
          amazonOrderId: item.amazonOrderId,
          orderItemId: item.orderItemId,
          rawUnavailableBecause: 'Step140-Q persists normalized preview envelope only',
        },
        normalizedPayloadJson: {
          sourceType: 'amazon-sp-api',
          domain: 'income',
          module: 'store-orders',
          storeId: preview.storeId,
          marketplaceId: preview.marketplaceId,
          region: preview.region,
          amazonOrder: order || null,
          amazonOrderItem: item,
          skuResolutionStatus: item.sellerSku ? 'resolved' : 'unresolved',
          inventoryResolutionStatus: item.sellerSku ? 'ready_for_review' : 'blocked_unresolved_sku',
          inventoryDeductionStatus: 'not_started_preview_persistence_only',
          transactionCommitStatus: 'not_started_preview_persistence_only',
          settlementReconciliationStatus: 'deferred',
          bankReconciliationStatus: 'deferred',
        },
        dedupeHash: item.itemLevelDedupeHash,
        matchStatus,
        matchReason: item.sellerSku
          ? 'SellerSKU present. Transaction and inventory commit are deferred.'
          : 'SellerSKU missing. Inventory deduction is blocked until SKU alias resolution.',
        targetEntityType: 'AmazonOrderItem',
        targetEntityId: item.orderItemId || null,
      },
    });

    rowNo += 1;
  }

  return {
    step: 'Step140-Q',
    source: 'amazon-sp-api-orders-preview-persistence',
    persisted: true,
    companyId: preview.companyId,
    storeId: preview.storeId,
    marketplaceId: preview.marketplaceId,
    importJobId: importJob.id,
    importJobWriteNow: true,
    importStagingRowWriteNow: true,
    transactionWriteNow: false,
    inventoryWriteNow: false,
    writesDatabase: true,
    transactionCreatedCount: 0,
    inventoryMovementCreatedCount: 0,
    stagingRowsCreatedCount: items.length,
    totalRows: items.length,
    successRows: items.length,
    failedRows: 0,
    fileHash,
    fileMonths,
    matchStatusSummary: {
      readyForReview,
      unresolvedSku,
    },
    boundaries: {
      writesOnlyImportJobAndStagingRows: true,
      doesNotWriteTransaction: true,
      doesNotWriteInventory: true,
      doesNotDeductInventory: true,
      doesNotRunSettlementReconciliation: true,
      doesNotRunBankReconciliation: true,
      doesNotCallAmazon: true,
      usesExistingPreviewEnvelopeOnly: true,
    },
  };
}

export function buildAmazonSpApiOrdersPreviewFileHash(
  preview: AmazonSpApiOrdersRealPreviewEnvelope,
): string {
  const orderPart = preview.normalizedOrders.map((order) => order.dedupeHash).sort().join('|');
  const itemPart = preview.normalizedOrderItems.map((item) => item.itemLevelDedupeHash).sort().join('|');

  return [
    'amazon-sp-api-orders-preview',
    preview.companyId,
    preview.storeId,
    preview.marketplaceId,
    preview.region,
    orderPart,
    itemPart,
  ].join(':');
}

export function buildDefaultAmazonSpApiOrdersPreviewFilename(
  preview: AmazonSpApiOrdersRealPreviewEnvelope,
): string {
  const month = preview.normalizedOrders[0]?.businessMonth || 'unknown-month';
  return `amazon-sp-api-orders-preview-${preview.storeId}-${preview.marketplaceId}-${month}.json`;
}

function assertPersistInput(input: PersistAmazonSpApiOrdersPreviewInput): void {
  if (!input.prisma) throw new Error('Step140-Q persistence violation: prisma adapter is required.');
  if (!input.prisma.importJob?.create) {
    throw new Error('Step140-Q persistence violation: prisma.importJob.create is required.');
  }
  if (!input.prisma.importStagingRow?.create) {
    throw new Error('Step140-Q persistence violation: prisma.importStagingRow.create is required.');
  }
  if (!input.preview) throw new Error('Step140-Q persistence violation: preview envelope is required.');
  if (input.preview.step !== 'Step140-P') {
    throw new Error('Step140-Q persistence violation: preview must come from Step140-P.');
  }
  if (input.preview.writesDatabase !== false) {
    throw new Error('Step140-Q persistence violation: source preview must not already write database.');
  }
  if (input.preview.transactionWriteNow !== false || input.preview.inventoryWriteNow !== false) {
    throw new Error('Step140-Q persistence violation: source preview must not write transaction or inventory.');
  }
  if (!Array.isArray(input.preview.normalizedOrderItems)) {
    throw new Error('Step140-Q persistence violation: normalizedOrderItems must be an array.');
  }
  if (!input.preview.companyId) throw new Error('Step140-Q persistence violation: companyId is required.');
  if (!input.preview.storeId) throw new Error('Step140-Q persistence violation: storeId is required.');
  if (!input.preview.marketplaceId) throw new Error('Step140-Q persistence violation: marketplaceId is required.');
}

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values));
}
