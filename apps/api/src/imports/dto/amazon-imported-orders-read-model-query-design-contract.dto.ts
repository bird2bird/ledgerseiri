export type AmazonImportedOrdersReadModelQueryDataSource = {
  model: 'ImportJob' | 'ImportStagingRow';
  purpose: string;
  requiredFields: string[];
  companyScopedBy: 'companyId';
  readOnly: true;
};

export type AmazonImportedOrdersReadModelQueryFilters = {
  companyId: string;
  sourceType: 'amazon-sp-api-orders';
  module: 'store-orders';
  domain: 'income';
  rangePreset?: '7D' | '30D' | '90D' | '365D' | 'CUSTOM';
  startDate?: string;
  endDate?: string;
  orderId?: string;
  status?: string;
  content?: string;
  minAmount?: number;
  maxAmount?: number;
  cursor?: string;
  limit: number;
};

export type AmazonImportedOrdersReadModelGroupingContract = {
  groupBy: 'amazonOrderId';
  sourceFieldCandidates: {
    amazonOrderId: string[];
    purchaseDate: string[];
    orderStatus: string[];
    marketplace: string[];
    currency: string[];
    amount: string[];
    sellerSku: string[];
    asin: string[];
    title: string[];
    quantity: string[];
    itemTax: string[];
    shippingTax: string[];
    promotionDiscount: string[];
    promotionDiscountTax: string[];
  };
  fallbackWhenOrderIdMissing: 'use-staging-row-id-as-shell-order-key';
  multiItemPolicy: 'group-staging-rows-under-same-amazon-order-id';
};

export type AmazonImportedOrdersReadModelListMappingContract = {
  rowSource: 'ImportStagingRow.normalizedPayloadJson';
  jobSource: 'ImportJob';
  listRowFields: {
    orderId: 'amazonOrderId';
    purchaseDate: 'purchaseDate';
    content: 'title-or-order-summary';
    amount: 'order-total-or-item-total';
    currency: 'currency';
    service: 'Amazon.co.jp';
    status: 'orderStatus-or-matchStatus';
    itemCount: 'grouped-row-count';
    marketplace: 'marketplaceId-or-marketplaceName';
    skuStatus: 'matchStatus-derived-readiness';
    importStatus: 'ImportJob.status';
    importJobId: 'ImportJob.id';
    stagingRowIds: 'ImportStagingRow.id[]';
  };
};

export type AmazonImportedOrderDetailReadModelMappingContract = {
  orderSource: 'grouped ImportStagingRow rows';
  itemRowSource: 'ImportStagingRow.normalizedPayloadJson';
  detailSections: {
    overview: string[];
    items: string[];
    taxFeeSummary: string[];
    inventoryReadiness: string[];
    importMetadata: string[];
  };
  financePermissionPolicy: {
    financePermissionRequiredForFees: true;
    showTaxFromOrderPayloadWhenAvailable: true;
    showFeesOnlyAfterFinanceReadModel: true;
  };
};

export type AmazonImportedOrdersReadModelQueryDesignContract = {
  source: 'amazon-imported-orders-read-model-query-design-contract';
  step: 'Step150-I';
  routeImplementedNow: false;
  controllerDisabledInStep150H: true;
  designOnly: true;
  readOnly: true;
  companyScoped: true;
  companyIdRequired: true;
  dataSources: AmazonImportedOrdersReadModelQueryDataSource[];
  filters: AmazonImportedOrdersReadModelQueryFilters;
  grouping: AmazonImportedOrdersReadModelGroupingContract;
  listMapping: AmazonImportedOrdersReadModelListMappingContract;
  detailMapping: AmazonImportedOrderDetailReadModelMappingContract;
  queryPlan: {
    importJobWhere: {
      companyId: 'filters.companyId';
      sourceType: 'amazon-sp-api-orders';
      module: 'store-orders';
      domain: 'income';
    };
    importStagingRowWhere: {
      companyId: 'filters.companyId';
      module: 'store-orders';
      importJobId: 'in selected ImportJob ids';
    };
    orderBy: 'ImportStagingRow.createdAt desc, rowNo asc';
    pagination: 'cursor over grouped order keys';
  };
  boundaries: {
    callsAmazon: false;
    createsImportJob: false;
    createsSyncJob: false;
    createsSyncSegment: false;
    writesDatabase: false;
    writesTransaction: false;
    writesInventoryMovement: false;
    opensControllerRuntime: false;
    queriesPrismaNow: false;
  };
};

export function buildAmazonImportedOrdersReadModelQueryDesignContract(input: {
  companyId: string;
  limit?: number;
}): AmazonImportedOrdersReadModelQueryDesignContract {
  const normalizedCompanyId = input.companyId.trim();

  if (!normalizedCompanyId) {
    throw new Error('Step150-I query design requires companyId.');
  }

  const limit = Number.isFinite(input.limit) && input.limit && input.limit > 0
    ? Math.min(Math.floor(input.limit), 100)
    : 20;

  return {
    source: 'amazon-imported-orders-read-model-query-design-contract',
    step: 'Step150-I',
    routeImplementedNow: false,
    controllerDisabledInStep150H: true,
    designOnly: true,
    readOnly: true,
    companyScoped: true,
    companyIdRequired: true,
    dataSources: [
      {
        model: 'ImportJob',
        purpose: 'Select existing Amazon order import jobs for the authenticated company.',
        requiredFields: [
          'id',
          'companyId',
          'domain',
          'module',
          'sourceType',
          'status',
          'importedAt',
          'createdAt',
        ],
        companyScopedBy: 'companyId',
        readOnly: true,
      },
      {
        model: 'ImportStagingRow',
        purpose: 'Read existing normalized Amazon order staging rows for list and detail grouping.',
        requiredFields: [
          'id',
          'companyId',
          'importJobId',
          'module',
          'rowNo',
          'businessMonth',
          'rawPayloadJson',
          'normalizedPayloadJson',
          'matchStatus',
          'matchReason',
          'targetEntityType',
          'targetEntityId',
          'createdAt',
        ],
        companyScopedBy: 'companyId',
        readOnly: true,
      },
    ],
    filters: {
      companyId: normalizedCompanyId,
      sourceType: 'amazon-sp-api-orders',
      module: 'store-orders',
      domain: 'income',
      limit,
    },
    grouping: {
      groupBy: 'amazonOrderId',
      sourceFieldCandidates: {
        amazonOrderId: ['amazonOrderId', 'AmazonOrderId', 'orderId', 'order.amazonOrderId'],
        purchaseDate: ['purchaseDate', 'PurchaseDate', 'order.purchaseDate'],
        orderStatus: ['orderStatus', 'OrderStatus', 'status'],
        marketplace: ['marketplaceId', 'MarketplaceId', 'marketplaceName'],
        currency: ['currency', 'CurrencyCode', 'itemPrice.currencyCode'],
        amount: ['orderTotal.amount', 'itemPrice.amount', 'principal.amount'],
        sellerSku: ['sellerSku', 'SellerSKU', 'sku'],
        asin: ['asin', 'ASIN'],
        title: ['title', 'Title', 'productName'],
        quantity: ['quantityOrdered', 'QuantityOrdered', 'quantity'],
        itemTax: ['itemTax.amount', 'ItemTax.Amount', 'tax.itemTax'],
        shippingTax: ['shippingTax.amount', 'ShippingTax.Amount', 'tax.shippingTax'],
        promotionDiscount: ['promotionDiscount.amount', 'PromotionDiscount.Amount'],
        promotionDiscountTax: ['promotionDiscountTax.amount', 'PromotionDiscountTax.Amount'],
      },
      fallbackWhenOrderIdMissing: 'use-staging-row-id-as-shell-order-key',
      multiItemPolicy: 'group-staging-rows-under-same-amazon-order-id',
    },
    listMapping: {
      rowSource: 'ImportStagingRow.normalizedPayloadJson',
      jobSource: 'ImportJob',
      listRowFields: {
        orderId: 'amazonOrderId',
        purchaseDate: 'purchaseDate',
        content: 'title-or-order-summary',
        amount: 'order-total-or-item-total',
        currency: 'currency',
        service: 'Amazon.co.jp',
        status: 'orderStatus-or-matchStatus',
        itemCount: 'grouped-row-count',
        marketplace: 'marketplaceId-or-marketplaceName',
        skuStatus: 'matchStatus-derived-readiness',
        importStatus: 'ImportJob.status',
        importJobId: 'ImportJob.id',
        stagingRowIds: 'ImportStagingRow.id[]',
      },
    },
    detailMapping: {
      orderSource: 'grouped ImportStagingRow rows',
      itemRowSource: 'ImportStagingRow.normalizedPayloadJson',
      detailSections: {
        overview: ['orderId', 'purchaseDate', 'status', 'amount', 'marketplace', 'itemCount'],
        items: ['sellerSku', 'asin', 'title', 'quantity', 'itemPrice', 'itemTax', 'shippingPrice', 'shippingTax'],
        taxFeeSummary: ['itemTaxTotal', 'shippingTaxTotal', 'promotionDiscountTotal', 'promotionDiscountTaxTotal', 'amazonFeeTotal', 'fbaFeeTotal', 'settlementAmount'],
        inventoryReadiness: ['linkedRows', 'aliasLinkedRows', 'unresolvedRows', 'auditHref'],
        importMetadata: ['importJobId', 'importedAt', 'stagingRowIds', 'sourceType'],
      },
      financePermissionPolicy: {
        financePermissionRequiredForFees: true,
        showTaxFromOrderPayloadWhenAvailable: true,
        showFeesOnlyAfterFinanceReadModel: true,
      },
    },
    queryPlan: {
      importJobWhere: {
        companyId: 'filters.companyId',
        sourceType: 'amazon-sp-api-orders',
        module: 'store-orders',
        domain: 'income',
      },
      importStagingRowWhere: {
        companyId: 'filters.companyId',
        module: 'store-orders',
        importJobId: 'in selected ImportJob ids',
      },
      orderBy: 'ImportStagingRow.createdAt desc, rowNo asc',
      pagination: 'cursor over grouped order keys',
    },
    boundaries: {
      callsAmazon: false,
      createsImportJob: false,
      createsSyncJob: false,
      createsSyncSegment: false,
      writesDatabase: false,
      writesTransaction: false,
      writesInventoryMovement: false,
      opensControllerRuntime: false,
      queriesPrismaNow: false,
    },
  };
}

export function assertAmazonImportedOrdersReadModelQueryDesignContract(
  contract: AmazonImportedOrdersReadModelQueryDesignContract,
): true {
  if (contract.step !== 'Step150-I') {
    throw new Error('Step150-I contract violation: unexpected step.');
  }

  if (contract.routeImplementedNow !== false || contract.controllerDisabledInStep150H !== true) {
    throw new Error('Step150-I contract violation: controller runtime must remain disabled.');
  }

  if (contract.designOnly !== true || contract.readOnly !== true) {
    throw new Error('Step150-I contract violation: designOnly/readOnly must remain true.');
  }

  if (contract.companyScoped !== true || contract.companyIdRequired !== true) {
    throw new Error('Step150-I contract violation: company scope is required.');
  }

  if (contract.dataSources.some((source) => source.companyScopedBy !== 'companyId' || source.readOnly !== true)) {
    throw new Error('Step150-I contract violation: every data source must be company-scoped and read-only.');
  }

  if (contract.grouping.groupBy !== 'amazonOrderId') {
    throw new Error('Step150-I contract violation: grouping must be by amazonOrderId.');
  }

  if (contract.boundaries.callsAmazon !== false) {
    throw new Error('Step150-I contract violation: callsAmazon must remain false.');
  }

  if (
    contract.boundaries.createsImportJob !== false ||
    contract.boundaries.createsSyncJob !== false ||
    contract.boundaries.createsSyncSegment !== false
  ) {
    throw new Error('Step150-I contract violation: job creation must remain false.');
  }

  if (
    contract.boundaries.writesDatabase !== false ||
    contract.boundaries.writesTransaction !== false ||
    contract.boundaries.writesInventoryMovement !== false
  ) {
    throw new Error('Step150-I contract violation: write boundaries must remain false.');
  }

  if (contract.boundaries.opensControllerRuntime !== false || contract.boundaries.queriesPrismaNow !== false) {
    throw new Error('Step150-I contract violation: runtime/query implementation must remain closed.');
  }

  return true as const;
}
