export type AmazonImportedOrdersReadModelControllerQuery = {
  rangePreset?: string;
  startDate?: string;
  endDate?: string;
  orderId?: string;
  status?: string;
  content?: string;
  minAmount?: string;
  maxAmount?: string;
  cursor?: string;
  limit?: string;
};

export type AmazonImportedOrderDetailReadModelControllerQuery = {
  orderId?: string;
};

export type AmazonImportedOrdersReadModelDisabledBoundary = {
  readsExistingImportJob: false;
  readsExistingImportStagingRow: false;
  callsAmazon: false;
  createsImportJob: false;
  createsSyncJob: false;
  createsSyncSegment: false;
  writesDatabase: false;
  writesTransaction: false;
  writesInventoryMovement: false;
  startsScheduler: false;
  startsQueue: false;
  returnsRawAccessToken: false;
  returnsRawRefreshToken: false;
  returnsAwsSecret: false;
};

export type AmazonImportedOrdersReadModelDisabledListRouteResponse = {
  source: 'amazon-imported-orders-read-model-disabled-controller-contract';
  routeImplementedNow: true;
  controllerRoute: 'GET /api/imports/amazon-sp-api/orders/imported/read-model';
  guardedBy: 'JwtAuthGuard';
  companyScoped: true;
  companyIdPresent: true;
  readOnly: true;
  disabled: true;
  reason: 'STEP150_H_IMPORTED_ORDERS_READ_MODEL_DISABLED_BY_DEFAULT';
  messageRedacted: string;
  query: {
    rangePreset: string | null;
    startDate: string | null;
    endDate: string | null;
    orderId: string | null;
    status: string | null;
    content: string | null;
    minAmount: string | null;
    maxAmount: string | null;
    cursor: string | null;
    limit: string | null;
  };
  orders: [];
  summary: {
    totalOrders: 0;
    totalItems: 0;
    unresolvedSkuCount: 0;
    linkedSkuCount: 0;
    aliasLinkedSkuCount: 0;
    currency: null;
    amountTotal: null;
  };
  pagination: {
    nextCursor: null;
    hasMore: false;
    limit: number;
  };
  boundaries: AmazonImportedOrdersReadModelDisabledBoundary;
};

export type AmazonImportedOrderDetailReadModelDisabledRouteResponse = {
  source: 'amazon-imported-order-detail-read-model-disabled-controller-contract';
  routeImplementedNow: true;
  controllerRoute: 'GET /api/imports/amazon-sp-api/orders/imported/read-model/detail';
  guardedBy: 'JwtAuthGuard';
  companyScoped: true;
  companyIdPresent: true;
  readOnly: true;
  disabled: true;
  reason: 'STEP150_H_IMPORTED_ORDER_DETAIL_READ_MODEL_DISABLED_BY_DEFAULT';
  messageRedacted: string;
  orderId: string | null;
  order: null;
  items: [];
  taxFeeSummary: {
    itemTaxTotal: null;
    shippingTaxTotal: null;
    promotionDiscountTotal: null;
    promotionDiscountTaxTotal: null;
    amazonFeeTotal: null;
    fbaFeeTotal: null;
    settlementAmount: null;
    currency: null;
    financePermissionRequired: true;
  };
  inventoryReadiness: {
    linkedRows: 0;
    aliasLinkedRows: 0;
    unresolvedRows: 0;
    auditHref: null;
  };
  importMetadata: {
    importJobId: null;
    importedAt: null;
    stagingRowIds: [];
    sourceType: 'amazon-sp-api-orders';
  };
  boundaries: AmazonImportedOrdersReadModelDisabledBoundary;
};

function normalizeNullableQueryValue(value: unknown): string | null {
  const normalized = String(value ?? '').trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeLimit(value: unknown): number {
  const normalized = Number(String(value ?? '').trim());
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return 20;
  }

  return Math.min(Math.floor(normalized), 100);
}

export function buildAmazonImportedOrdersReadModelDisabledBoundary(): AmazonImportedOrdersReadModelDisabledBoundary {
  return {
    readsExistingImportJob: false,
    readsExistingImportStagingRow: false,
    callsAmazon: false,
    createsImportJob: false,
    createsSyncJob: false,
    createsSyncSegment: false,
    writesDatabase: false,
    writesTransaction: false,
    writesInventoryMovement: false,
    startsScheduler: false,
    startsQueue: false,
    returnsRawAccessToken: false,
    returnsRawRefreshToken: false,
    returnsAwsSecret: false,
  };
}

export function buildAmazonImportedOrdersReadModelDisabledListRouteResponse(input: {
  companyId: string;
  query: AmazonImportedOrdersReadModelControllerQuery;
}): AmazonImportedOrdersReadModelDisabledListRouteResponse {
  return {
    source: 'amazon-imported-orders-read-model-disabled-controller-contract',
    routeImplementedNow: true,
    controllerRoute: 'GET /api/imports/amazon-sp-api/orders/imported/read-model',
    guardedBy: 'JwtAuthGuard',
    companyScoped: true,
    companyIdPresent: true as const,
    readOnly: true,
    disabled: true,
    reason: 'STEP150_H_IMPORTED_ORDERS_READ_MODEL_DISABLED_BY_DEFAULT',
    messageRedacted:
      'Step150-H defines the imported Amazon orders read-model route contract only. Real ImportJob/StagingRow querying remains disabled until a later explicit read-model implementation step.',
    query: {
      rangePreset: normalizeNullableQueryValue(input.query.rangePreset),
      startDate: normalizeNullableQueryValue(input.query.startDate),
      endDate: normalizeNullableQueryValue(input.query.endDate),
      orderId: normalizeNullableQueryValue(input.query.orderId),
      status: normalizeNullableQueryValue(input.query.status),
      content: normalizeNullableQueryValue(input.query.content),
      minAmount: normalizeNullableQueryValue(input.query.minAmount),
      maxAmount: normalizeNullableQueryValue(input.query.maxAmount),
      cursor: normalizeNullableQueryValue(input.query.cursor),
      limit: normalizeNullableQueryValue(input.query.limit),
    },
    orders: [],
    summary: {
      totalOrders: 0,
      totalItems: 0,
      unresolvedSkuCount: 0,
      linkedSkuCount: 0,
      aliasLinkedSkuCount: 0,
      currency: null,
      amountTotal: null,
    },
    pagination: {
      nextCursor: null,
      hasMore: false,
      limit: normalizeLimit(input.query.limit),
    },
    boundaries: buildAmazonImportedOrdersReadModelDisabledBoundary(),
  };
}

export function buildAmazonImportedOrderDetailReadModelDisabledRouteResponse(input: {
  companyId: string;
  query: AmazonImportedOrderDetailReadModelControllerQuery;
}): AmazonImportedOrderDetailReadModelDisabledRouteResponse {
  return {
    source: 'amazon-imported-order-detail-read-model-disabled-controller-contract',
    routeImplementedNow: true,
    controllerRoute: 'GET /api/imports/amazon-sp-api/orders/imported/read-model/detail',
    guardedBy: 'JwtAuthGuard',
    companyScoped: true,
    companyIdPresent: true as const,
    readOnly: true,
    disabled: true,
    reason: 'STEP150_H_IMPORTED_ORDER_DETAIL_READ_MODEL_DISABLED_BY_DEFAULT',
    messageRedacted:
      'Step150-H defines the imported Amazon order detail read-model route contract only. Real detail querying remains disabled until a later explicit read-model implementation step.',
    orderId: normalizeNullableQueryValue(input.query.orderId),
    order: null,
    items: [],
    taxFeeSummary: {
      itemTaxTotal: null,
      shippingTaxTotal: null,
      promotionDiscountTotal: null,
      promotionDiscountTaxTotal: null,
      amazonFeeTotal: null,
      fbaFeeTotal: null,
      settlementAmount: null,
      currency: null,
      financePermissionRequired: true,
    },
    inventoryReadiness: {
      linkedRows: 0,
      aliasLinkedRows: 0,
      unresolvedRows: 0,
      auditHref: null,
    },
    importMetadata: {
      importJobId: null,
      importedAt: null,
      stagingRowIds: [],
      sourceType: 'amazon-sp-api-orders',
    },
    boundaries: buildAmazonImportedOrdersReadModelDisabledBoundary(),
  };
}

export function assertAmazonImportedOrdersReadModelDisabledControllerContract(input: {
  list: AmazonImportedOrdersReadModelDisabledListRouteResponse;
  detail: AmazonImportedOrderDetailReadModelDisabledRouteResponse;
}) {
  const responses = [input.list, input.detail];

  for (const response of responses) {
    if (response.readOnly !== true) {
      throw new Error('Step150-H contract violation: readOnly must remain true.');
    }

    if (response.disabled !== true) {
      throw new Error('Step150-H contract violation: disabled must remain true.');
    }

    if (response.companyScoped !== true || response.companyIdPresent !== true) {
      throw new Error('Step150-H contract violation: company scope must be enforced.');
    }

    if (response.boundaries.callsAmazon !== false) {
      throw new Error('Step150-H contract violation: callsAmazon must remain false.');
    }

    if (response.boundaries.createsImportJob !== false) {
      throw new Error('Step150-H contract violation: createsImportJob must remain false.');
    }

    if (response.boundaries.createsSyncJob !== false || response.boundaries.createsSyncSegment !== false) {
      throw new Error('Step150-H contract violation: SyncJob/SyncSegment creation must remain false.');
    }

    if (response.boundaries.writesDatabase !== false) {
      throw new Error('Step150-H contract violation: writesDatabase must remain false.');
    }

    if (response.boundaries.writesTransaction !== false || response.boundaries.writesInventoryMovement !== false) {
      throw new Error('Step150-H contract violation: ledger/inventory writes must remain false.');
    }
  }

  return true as const;
}
