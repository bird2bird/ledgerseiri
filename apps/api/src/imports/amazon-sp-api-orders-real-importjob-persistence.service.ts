import { createHash } from 'node:crypto';

export type AmazonSpApiOrdersRealImportJobPersistencePrisma = unknown;

type AmazonSpApiOrdersRealImportJobPersistenceDelegate = {
  importJob: {
    create(args: {
      data: Record<string, unknown>;
    }): Promise<{ id: string }>;
  };
  importStagingRow: {
    createMany(args: {
      data: Array<Record<string, unknown>>;
    }): Promise<{ count: number }>;
  };
};

export type AmazonSpApiOrdersRealImportJobPersistenceInput = {
  prisma: AmazonSpApiOrdersRealImportJobPersistencePrisma;
  companyId: string;
  storeId: string;
  marketplaceId: string;
  region: string;
  previewResult: unknown;
  productionVerification: {
    accepted: boolean;
    reason?: string | null;
    productionReadiness?: {
      canProceedToStep141BImportJobPersistence?: boolean;
    };
  };
  requestedBy?: string | null;
  now?: Date;
};

export type AmazonSpApiOrdersRealImportJobPersistenceResult = {
  step: 'Step141-B';
  source: 'amazon-sp-api-orders-real-importjob-staging-persistence';
  accepted: boolean;
  reason:
    | 'ready'
    | 'production_verification_not_accepted'
    | 'missing_company_id'
    | 'missing_store_id'
    | 'missing_marketplace_id'
    | 'missing_region'
    | 'preview_result_missing'
    | 'normalized_orders_missing'
    | 'normalized_items_missing'
    | 'importjob_create_failed'
    | 'staging_rows_create_failed';
  messageRedacted: string;
  companyId: string;
  storeId: string;
  marketplaceId: string;
  region: string;
  importJobId: string | null;
  totalRows: number;
  successRows: number;
  failedRows: number;
  businessMonths: string[];
  fileHash: string | null;
  filename: string | null;
  domain: 'income';
  module: 'store-orders';
  sourceType: 'amazon-sp-api-orders';
  boundaries: {
    writesImportJob: boolean;
    writesImportStagingRow: boolean;
    writesTransaction: false;
    writesInventory: false;
    writesInventoryMovement: false;
    callsAmazon: false;
    returnsRawAccessToken: false;
    returnsRawRefreshToken: false;
    returnsAwsSecret: false;
  };
};

export async function persistAmazonSpApiOrdersRealPreviewToImportJobAndStagingRows(
  input: AmazonSpApiOrdersRealImportJobPersistenceInput,
): Promise<AmazonSpApiOrdersRealImportJobPersistenceResult> {
  const prisma = input.prisma as AmazonSpApiOrdersRealImportJobPersistenceDelegate;

  const now = input.now || new Date();
  const companyId = normalize(input.companyId);
  const storeId = normalize(input.storeId);
  const marketplaceId = normalize(input.marketplaceId);
  const region = normalize(input.region);
  const preview = asRecord(input.previewResult);

  const base = (
    accepted: boolean,
    reason: AmazonSpApiOrdersRealImportJobPersistenceResult['reason'],
    messageRedacted: string,
    extra?: Partial<AmazonSpApiOrdersRealImportJobPersistenceResult>,
  ): AmazonSpApiOrdersRealImportJobPersistenceResult => ({
    step: 'Step141-B',
    source: 'amazon-sp-api-orders-real-importjob-staging-persistence',
    accepted,
    reason,
    messageRedacted,
    companyId,
    storeId,
    marketplaceId,
    region,
    importJobId: extra?.importJobId ?? null,
    totalRows: extra?.totalRows ?? 0,
    successRows: extra?.successRows ?? 0,
    failedRows: extra?.failedRows ?? 0,
    businessMonths: extra?.businessMonths ?? [],
    fileHash: extra?.fileHash ?? null,
    filename: extra?.filename ?? null,
    domain: 'income',
    module: 'store-orders',
    sourceType: 'amazon-sp-api-orders',
    boundaries: {
      writesImportJob: extra?.boundaries?.writesImportJob ?? false,
      writesImportStagingRow: extra?.boundaries?.writesImportStagingRow ?? false,
      writesTransaction: false,
      writesInventory: false,
      writesInventoryMovement: false,
      callsAmazon: false,
      returnsRawAccessToken: false,
      returnsRawRefreshToken: false,
      returnsAwsSecret: false,
    },
  });

  if (!companyId) return base(false, 'missing_company_id', 'companyId is required.');
  if (!storeId) return base(false, 'missing_store_id', 'storeId is required.');
  if (!marketplaceId) return base(false, 'missing_marketplace_id', 'marketplaceId is required.');
  if (!region) return base(false, 'missing_region', 'region is required.');

  if (
    input.productionVerification?.accepted !== true ||
    input.productionVerification?.productionReadiness?.canProceedToStep141BImportJobPersistence !== true
  ) {
    return base(
      false,
      'production_verification_not_accepted',
      `Production verification is not accepted: ${String(input.productionVerification?.reason || 'unknown')}.`,
    );
  }

  if (!preview) return base(false, 'preview_result_missing', 'Real preview result is missing.');

  const normalizedOrders = arrayFrom(preview.normalizedOrders || preview.orders);
  const normalizedItems = arrayFrom(
    preview.normalizedItems || preview.normalizedOrderItems || preview.orderItems || preview.items,
  );

  if (normalizedOrders.length <= 0) {
    return base(false, 'normalized_orders_missing', 'Real preview has no normalized orders.');
  }

  if (normalizedItems.length <= 0) {
    return base(false, 'normalized_items_missing', 'Real preview has no normalized order items.');
  }

  const stagingRows = normalizedItems.map((item, index) => {
    const itemObj = asRecord(item) || {};
    const orderId = stringFrom(
      itemObj.amazonOrderId ||
        itemObj.orderId ||
        itemObj.AmazonOrderId ||
        itemObj.amazon_order_id,
    );
    const orderItemId = stringFrom(
      itemObj.orderItemId ||
        itemObj.OrderItemId ||
        itemObj.amazonOrderItemId ||
        itemObj.amazon_order_item_id ||
        `row-${index + 1}`,
    );
    const purchaseDate = stringFrom(
      itemObj.purchaseDate ||
        itemObj.PurchaseDate ||
        itemObj.occurredAt ||
        itemObj.orderDate,
    );
    const businessMonth = deriveBusinessMonth(purchaseDate, now);
    const dedupeHash = sha256([
      companyId,
      storeId,
      marketplaceId,
      region,
      orderId,
      orderItemId,
    ].join('|'));

    const matched = stringFrom(itemObj.skuResolutionStatus || itemObj.matchStatus).toUpperCase() === 'RESOLVED';

    return {
      importJobId: '__PENDING__',
      companyId,
      module: 'store-orders',
      rowNo: index + 1,
      businessMonth,
      rawPayloadJson: {
        source: 'amazon-sp-api-orders-real-preview',
        item,
      },
      normalizedPayloadJson: {
        ...itemObj,
        amazonOrderId: orderId || null,
        orderItemId: orderItemId || null,
        businessMonth,
        sourceType: 'amazon-sp-api-orders',
        storeId,
        marketplaceId,
        region,
      },
      dedupeHash,
      matchStatus: matched ? 'MATCHED' : 'PENDING_REVIEW',
      matchReason: matched ? 'sku_resolved_in_preview' : 'pending_review_before_transaction_commit',
      targetEntityType: null,
      targetEntityId: null,
    };
  });

  const businessMonths = Array.from(
    new Set(stagingRows.map((row) => row.businessMonth).filter((v): v is string => Boolean(v))),
  ).sort();

  const fileHash = sha256(
    JSON.stringify({
      companyId,
      storeId,
      marketplaceId,
      region,
      normalizedOrders,
      normalizedItems,
      businessMonths,
    }),
  );

  const filename = `amazon-sp-api-orders-${marketplaceId}-${region}-${now.toISOString().slice(0, 10)}.json`;

  let importJob: { id: string };

  try {
    importJob = await prisma.importJob.create({
      data: {
        companyId,
        domain: 'income',
        module: 'store-orders',
        sourceType: 'amazon-sp-api-orders',
        filename,
        fileHash,
        status: 'SUCCEEDED',
        totalRows: stagingRows.length,
        successRows: stagingRows.length,
        failedRows: 0,
        fileMonthsJson: businessMonths,
        conflictMonthsJson: [],
        importedAt: now,
      },
    });
  } catch {
    return base(false, 'importjob_create_failed', 'Failed to create ImportJob for real Amazon Orders preview.');
  }

  try {
    await prisma.importStagingRow.createMany({
      data: stagingRows.map((row) => ({
        ...row,
        importJobId: importJob.id,
      })),
    });
  } catch {
    return base(false, 'staging_rows_create_failed', 'Failed to create ImportStagingRows for real Amazon Orders preview.', {
      importJobId: importJob.id,
      fileHash,
      filename,
      totalRows: stagingRows.length,
      successRows: 0,
      failedRows: stagingRows.length,
      businessMonths,
      boundaries: {
        writesImportJob: true,
        writesImportStagingRow: false,
        writesTransaction: false,
        writesInventory: false,
        writesInventoryMovement: false,
        callsAmazon: false,
        returnsRawAccessToken: false,
        returnsRawRefreshToken: false,
        returnsAwsSecret: false,
      },
    });
  }

  return base(true, 'ready', 'Real Amazon Orders preview was persisted to ImportJob and ImportStagingRow.', {
    importJobId: importJob.id,
    fileHash,
    filename,
    totalRows: stagingRows.length,
    successRows: stagingRows.length,
    failedRows: 0,
    businessMonths,
    boundaries: {
      writesImportJob: true,
      writesImportStagingRow: true,
      writesTransaction: false,
      writesInventory: false,
      writesInventoryMovement: false,
      callsAmazon: false,
      returnsRawAccessToken: false,
      returnsRawRefreshToken: false,
      returnsAwsSecret: false,
    },
  });
}

function normalize(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function arrayFrom(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringFrom(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}

function deriveBusinessMonth(value: string, fallback: Date): string {
  const date = value ? new Date(value) : fallback;

  if (Number.isNaN(date.getTime())) {
    return fallback.toISOString().slice(0, 7);
  }

  return date.toISOString().slice(0, 7);
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
