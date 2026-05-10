export type AmazonSpApiOrdersSkuResolutionPrisma = {
  productSku: {
    findFirst(args: {
      where: {
        companyId: string;
        isActive?: boolean;
        OR?: Array<Record<string, unknown>>;
      };
    }): Promise<AmazonSpApiOrdersResolvedSkuRecord | null>;
  };
  productSkuAlias: {
    findFirst(args: {
      where: {
        companyId: string;
        isActive?: boolean;
        normalizedAliasSku?: string;
        storeId?: string | null;
      };
      include?: {
        sku?: boolean;
      };
    }): Promise<AmazonSpApiOrdersResolvedSkuAliasRecord | null>;
  };
};

export type AmazonSpApiOrdersResolvedSkuRecord = {
  id: string;
  companyId: string;
  storeId?: string | null;
  skuCode: string;
  name?: string | null;
  asin?: string | null;
  externalSku?: string | null;
  isActive?: boolean;
};

export type AmazonSpApiOrdersResolvedSkuAliasRecord = {
  id: string;
  companyId: string;
  skuId: string;
  storeId?: string | null;
  sourceType?: string | null;
  aliasSku: string;
  normalizedAliasSku: string;
  isActive?: boolean;
  sku?: AmazonSpApiOrdersResolvedSkuRecord | null;
};

export type AmazonSpApiOrdersSkuResolutionStagingRow = {
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

export type ResolveAmazonSpApiOrdersSkuInput = {
  prisma: AmazonSpApiOrdersSkuResolutionPrisma;
  companyId: string;
  storeId?: string | null;
  rows: AmazonSpApiOrdersSkuResolutionStagingRow[];
};

export type AmazonSpApiOrdersSkuResolutionRowResult = {
  rowNo: number;
  stagingRowId: string;
  amazonOrderId: string | null;
  orderItemId: string | null;
  sellerSku: string | null;
  asin: string | null;
  normalizedSellerSku: string | null;
  resolutionStatus: 'RESOLVED_BY_SKU_CODE' | 'RESOLVED_BY_EXTERNAL_SKU' | 'RESOLVED_BY_ASIN' | 'RESOLVED_BY_ALIAS' | 'UNRESOLVED_SKU' | 'INVALID_PAYLOAD';
  skuId: string | null;
  skuCode: string | null;
  aliasId: string | null;
  auditReason: string;
  inventoryDeductionEligible: boolean;
};

export type ResolveAmazonSpApiOrdersSkuResult = {
  step: 'Step140-S';
  source: 'amazon-sp-api-orders-sku-resolution-audit';
  companyId: string;
  storeId: string | null;
  resolvedCount: number;
  unresolvedCount: number;
  invalidPayloadCount: number;
  aliasResolvedCount: number;
  directSkuResolvedCount: number;
  asinResolvedCount: number;
  externalSkuResolvedCount: number;
  inventoryDeductionReadyCount: number;
  inventoryDeductionBlockedCount: number;
  unresolvedAudit: Array<{
    rowNo: number;
    amazonOrderId: string | null;
    orderItemId: string | null;
    sellerSku: string | null;
    asin: string | null;
    reasonCode: 'MISSING_SELLER_SKU' | 'NO_PRODUCT_SKU_MATCH' | 'INVALID_PAYLOAD';
    message: string;
  }>;
  rowResults: AmazonSpApiOrdersSkuResolutionRowResult[];
  boundaries: {
    readsProductSku: true;
    readsProductSkuAlias: true;
    writesImportStagingRow: false;
    writesTransaction: false;
    writesInventoryMovement: false;
    writesInventoryBalance: false;
    deductsInventory: false;
    callsAmazon: false;
    changesPrismaSchema: false;
  };
};

type NormalizedPayload = {
  storeId?: string;
  amazonOrder?: {
    amazonOrderId?: string;
  } | null;
  amazonOrderItem?: {
    amazonOrderId?: string;
    orderItemId?: string;
    sellerSku?: string | null;
    asin?: string | null;
    title?: string | null;
    quantityOrdered?: number;
    itemLevelDedupeHash?: string;
  } | null;
};

export async function resolveAmazonSpApiOrdersSkuAliasesForStagingRows(
  input: ResolveAmazonSpApiOrdersSkuInput,
): Promise<ResolveAmazonSpApiOrdersSkuResult> {
  assertResolveInput(input);

  const rowResults: AmazonSpApiOrdersSkuResolutionRowResult[] = [];

  for (const row of input.rows) {
    rowResults.push(await resolveSingleRow(input, row));
  }

  const unresolvedAudit = rowResults
    .filter((row) => row.resolutionStatus === 'UNRESOLVED_SKU' || row.resolutionStatus === 'INVALID_PAYLOAD')
    .map((row) => ({
      rowNo: row.rowNo,
      amazonOrderId: row.amazonOrderId,
      orderItemId: row.orderItemId,
      sellerSku: row.sellerSku,
      asin: row.asin,
      reasonCode:
        row.resolutionStatus === 'INVALID_PAYLOAD'
          ? 'INVALID_PAYLOAD' as const
          : row.sellerSku
            ? 'NO_PRODUCT_SKU_MATCH' as const
            : 'MISSING_SELLER_SKU' as const,
      message: row.auditReason,
    }));

  const resolvedCount = rowResults.filter((row) => row.skuId).length;
  const unresolvedCount = rowResults.filter((row) => row.resolutionStatus === 'UNRESOLVED_SKU').length;
  const invalidPayloadCount = rowResults.filter((row) => row.resolutionStatus === 'INVALID_PAYLOAD').length;

  return {
    step: 'Step140-S',
    source: 'amazon-sp-api-orders-sku-resolution-audit',
    companyId: input.companyId,
    storeId: input.storeId || null,
    resolvedCount,
    unresolvedCount,
    invalidPayloadCount,
    aliasResolvedCount: rowResults.filter((row) => row.resolutionStatus === 'RESOLVED_BY_ALIAS').length,
    directSkuResolvedCount: rowResults.filter((row) => row.resolutionStatus === 'RESOLVED_BY_SKU_CODE').length,
    asinResolvedCount: rowResults.filter((row) => row.resolutionStatus === 'RESOLVED_BY_ASIN').length,
    externalSkuResolvedCount: rowResults.filter((row) => row.resolutionStatus === 'RESOLVED_BY_EXTERNAL_SKU').length,
    inventoryDeductionReadyCount: rowResults.filter((row) => row.inventoryDeductionEligible).length,
    inventoryDeductionBlockedCount: rowResults.filter((row) => !row.inventoryDeductionEligible).length,
    unresolvedAudit,
    rowResults,
    boundaries: {
      readsProductSku: true,
      readsProductSkuAlias: true,
      writesImportStagingRow: false,
      writesTransaction: false,
      writesInventoryMovement: false,
      writesInventoryBalance: false,
      deductsInventory: false,
      callsAmazon: false,
      changesPrismaSchema: false,
    },
  };
}

export function normalizeAmazonSpApiSellerSku(value?: string | null): string {
  return String(value || '').trim().toUpperCase();
}

async function resolveSingleRow(
  input: ResolveAmazonSpApiOrdersSkuInput,
  row: AmazonSpApiOrdersSkuResolutionStagingRow,
): Promise<AmazonSpApiOrdersSkuResolutionRowResult> {
  const payload = coercePayload(row.normalizedPayloadJson);
  const item = payload.amazonOrderItem;
  const order = payload.amazonOrder;

  const amazonOrderId = item?.amazonOrderId || order?.amazonOrderId || null;
  const orderItemId = item?.orderItemId || row.targetEntityId || null;
  const sellerSku = item?.sellerSku ? String(item.sellerSku).trim() : null;
  const asin = item?.asin ? String(item.asin).trim() : null;
  const normalizedSellerSku = normalizeAmazonSpApiSellerSku(sellerSku);

  if (!amazonOrderId || !orderItemId) {
    return buildResolutionRow(row, {
      amazonOrderId,
      orderItemId,
      sellerSku,
      asin,
      normalizedSellerSku,
      resolutionStatus: 'INVALID_PAYLOAD',
      sku: null,
      aliasId: null,
      auditReason: 'Missing amazonOrderId or orderItemId in normalizedPayloadJson.',
    });
  }

  if (!sellerSku && !asin) {
    return buildResolutionRow(row, {
      amazonOrderId,
      orderItemId,
      sellerSku,
      asin,
      normalizedSellerSku,
      resolutionStatus: 'UNRESOLVED_SKU',
      sku: null,
      aliasId: null,
      auditReason: 'Missing SellerSKU and ASIN. Inventory deduction remains blocked.',
    });
  }

  if (normalizedSellerSku) {
    const directSku = await input.prisma.productSku.findFirst({
      where: {
        companyId: input.companyId,
        isActive: true,
        OR: [
          { skuCode: sellerSku },
          { skuCode: normalizedSellerSku },
        ],
      },
    });

    if (directSku) {
      return buildResolutionRow(row, {
        amazonOrderId,
        orderItemId,
        sellerSku,
        asin,
        normalizedSellerSku,
        resolutionStatus: 'RESOLVED_BY_SKU_CODE',
        sku: directSku,
        aliasId: null,
        auditReason: `Resolved by ProductSku.skuCode=${directSku.skuCode}.`,
      });
    }

    const externalSku = await input.prisma.productSku.findFirst({
      where: {
        companyId: input.companyId,
        isActive: true,
        OR: [
          { externalSku: sellerSku },
          { externalSku: normalizedSellerSku },
        ],
      },
    });

    if (externalSku) {
      return buildResolutionRow(row, {
        amazonOrderId,
        orderItemId,
        sellerSku,
        asin,
        normalizedSellerSku,
        resolutionStatus: 'RESOLVED_BY_EXTERNAL_SKU',
        sku: externalSku,
        aliasId: null,
        auditReason: `Resolved by ProductSku.externalSku=${externalSku.externalSku || externalSku.skuCode}.`,
      });
    }

    const alias = await input.prisma.productSkuAlias.findFirst({
      where: {
        companyId: input.companyId,
        isActive: true,
        normalizedAliasSku: normalizedSellerSku,
        storeId: input.storeId || null,
      },
      include: {
        sku: true,
      },
    });

    if (alias?.sku) {
      return buildResolutionRow(row, {
        amazonOrderId,
        orderItemId,
        sellerSku,
        asin,
        normalizedSellerSku,
        resolutionStatus: 'RESOLVED_BY_ALIAS',
        sku: alias.sku,
        aliasId: alias.id,
        auditReason: `Resolved by ProductSkuAlias.normalizedAliasSku=${alias.normalizedAliasSku}.`,
      });
    }
  }

  if (asin) {
    const asinSku = await input.prisma.productSku.findFirst({
      where: {
        companyId: input.companyId,
        isActive: true,
        OR: [
          { asin },
        ],
      },
    });

    if (asinSku) {
      return buildResolutionRow(row, {
        amazonOrderId,
        orderItemId,
        sellerSku,
        asin,
        normalizedSellerSku,
        resolutionStatus: 'RESOLVED_BY_ASIN',
        sku: asinSku,
        aliasId: null,
        auditReason: `Resolved by ProductSku.asin=${asinSku.asin || asin}.`,
      });
    }
  }

  return buildResolutionRow(row, {
    amazonOrderId,
    orderItemId,
    sellerSku,
    asin,
    normalizedSellerSku,
    resolutionStatus: 'UNRESOLVED_SKU',
    sku: null,
    aliasId: null,
    auditReason: 'No ProductSku or ProductSkuAlias match found. Inventory deduction remains blocked.',
  });
}

function buildResolutionRow(
  row: AmazonSpApiOrdersSkuResolutionStagingRow,
  resolved: {
    amazonOrderId: string | null;
    orderItemId: string | null;
    sellerSku: string | null;
    asin: string | null;
    normalizedSellerSku: string | null;
    resolutionStatus: AmazonSpApiOrdersSkuResolutionRowResult['resolutionStatus'];
    sku: AmazonSpApiOrdersResolvedSkuRecord | null;
    aliasId: string | null;
    auditReason: string;
  },
): AmazonSpApiOrdersSkuResolutionRowResult {
  return {
    rowNo: row.rowNo,
    stagingRowId: row.id,
    amazonOrderId: resolved.amazonOrderId,
    orderItemId: resolved.orderItemId,
    sellerSku: resolved.sellerSku,
    asin: resolved.asin,
    normalizedSellerSku: resolved.normalizedSellerSku,
    resolutionStatus: resolved.resolutionStatus,
    skuId: resolved.sku?.id || null,
    skuCode: resolved.sku?.skuCode || null,
    aliasId: resolved.aliasId,
    auditReason: resolved.auditReason,
    inventoryDeductionEligible: Boolean(resolved.sku?.id),
  };
}

function assertResolveInput(input: ResolveAmazonSpApiOrdersSkuInput): void {
  if (!input.prisma) throw new Error('Step140-S SKU resolution violation: prisma adapter is required.');
  if (!input.prisma.productSku?.findFirst) {
    throw new Error('Step140-S SKU resolution violation: prisma.productSku.findFirst is required.');
  }
  if (!input.prisma.productSkuAlias?.findFirst) {
    throw new Error('Step140-S SKU resolution violation: prisma.productSkuAlias.findFirst is required.');
  }
  if (!input.companyId) throw new Error('Step140-S SKU resolution violation: companyId is required.');
  if (!Array.isArray(input.rows)) throw new Error('Step140-S SKU resolution violation: rows must be an array.');
}

function coercePayload(value: unknown): NormalizedPayload {
  if (!value || typeof value !== 'object') return {};
  return value as NormalizedPayload;
}
