import {
  assertAmazonSpApiConnectionStatusReadModelContract,
  buildAmazonSpApiConnectionStatusReadModelContract,
  type AmazonSpApiConnectionStatusReadModelContract,
} from './amazon-sp-api-connection-status-read-model-contract.dto';

export const AMAZON_SP_API_ORDERS_API_READ_BOUNDARY_CONTRACT_VERSION =
  'amazon-sp-api-orders-api-read-boundary-contract-v1' as const;

export type AmazonSpApiOrdersApiReadBoundaryContract = {
  version: typeof AMAZON_SP_API_ORDERS_API_READ_BOUNDARY_CONTRACT_VERSION;
  sourceConnectionStatusReadModel: AmazonSpApiConnectionStatusReadModelContract;

  step: 'Step140-A';
  contractOnly: true;
  implementationNow: false;
  controllerRouteAddedNow: false;
  frontendRouteAddedNow: false;
  serviceMethodAddedNow: false;
  httpClientAddedNow: false;
  signedRequestAddedNow: false;
  realOrdersApiHttpCallNow: false;
  accessTokenRefreshNow: false;
  tokenPersistenceWriteNow: false;
  importJobWriteNow: false;
  importStagingRowWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;
  schemaChangedNow: false;
  migrationAddedNow: false;
  writesDatabase: false;

  ordersApiReadBoundary: {
    purpose: 'design-amazon-sp-api-orders-api-read-boundary-contract-only';
    operationDesignOnly: true;
    connectionStatusMustBeConnectedInFuture: true;
    companyStoreMarketplaceRegionIsolationRequired: true;
    endpointSelectionDesignOnly: true;
    lwaAccessTokenRequiredInFuture: true;
    sigV4SigningRequiredInFuture: true;
    restrictedDataTokenNotIntroducedNow: true;
    getOrdersForbiddenNow: true;
    getOrderForbiddenNow: true;
    getOrderItemsForbiddenNow: true;
    realAmazonHttpForbiddenNow: true;
    paginationExecutionForbiddenNow: true;
  };

  requestShapeContract: {
    companyIdRequired: true;
    storeIdRequired: true;
    marketplaceIdRequired: true;
    regionRequired: true;
    createdAfterRequired: true;
    createdBeforeRequired: true;
    orderStatusesOptional: true;
    fulfillmentChannelsOptional: true;
    maxResultsPerPageOptional: true;
    nextTokenOptional: true;
    nextTokenMustBeOpaque: true;
    dateRangeValidationRequiredInFuture: true;
    marketplaceMismatchRejectedInFuture: true;
    regionMismatchRejectedInFuture: true;
  };

  responseShapeContract: {
    requestIdRequired: true;
    readModeRequired: true;
    sourceRequired: 'amazon-sp-api-orders-v0-design-only';
    marketplaceIdRequired: true;
    regionRequired: true;
    ordersArrayRequired: true;
    hasMoreRequired: true;
    nextTokenMaskedNullable: true;
    fetchedAtRequired: true;
    rawPayloadForbidden: true;
  };

  orderSummaryShapeContract: {
    amazonOrderIdRequired: true;
    purchaseDateRequired: true;
    lastUpdateDateNullable: true;
    orderStatusRequired: true;
    fulfillmentChannelNullable: true;
    salesChannelNullable: true;
    marketplaceIdRequired: true;
    currencyCodeNullable: true;
    orderTotalAmountNullable: true;
    itemCountNullable: true;
    isBusinessOrderNullable: true;
    isPrimeNullable: true;
    buyerInfoRedactedOnly: true;
    shippingAddressRedactedOnly: true;
    rawBuyerNameForbidden: true;
    rawBuyerEmailForbidden: true;
    rawShippingAddressForbidden: true;
  };

  orderItemsShapeContract: {
    amazonOrderIdRequired: true;
    orderItemsArrayRequiredInFuture: true;
    asinRequiredInFuture: true;
    sellerSkuRequiredInFuture: true;
    titleNullable: true;
    quantityOrderedRequiredInFuture: true;
    itemPriceAmountNullable: true;
    itemTaxAmountNullable: true;
    shippingPriceAmountNullable: true;
    shippingTaxAmountNullable: true;
    promotionDiscountAmountNullable: true;
    promotionDiscountTaxAmountNullable: true;
    rawItemPayloadForbidden: true;
  };

  normalizationPreviewContract: {
    normalizedOrderContractOnly: true;
    normalizedOrderItemContractOnly: true;
    amazonOrderIdDedupeKeyRequiredInFuture: true;
    skuAliasResolutionRequiredInFuture: true;
    unresolvedSkuAuditRequiredInFuture: true;
    importJobPersistenceDeferred: true;
    importStagingRowPersistenceDeferred: true;
    transactionCommitDeferred: true;
    inventoryDeductionDeferred: true;
    settlementReconciliationDeferred: true;
    bankReconciliationDeferred: true;
  };

  redactionContract: {
    accessTokenForbidden: true;
    refreshTokenForbidden: true;
    clientSecretForbidden: true;
    authorizationCodeForbidden: true;
    lwaRawResponseForbidden: true;
    sigV4AuthorizationHeaderForbidden: true;
    rawNextTokenForbiddenInLogs: true;
    buyerNameForbidden: true;
    buyerEmailForbidden: true;
    buyerPhoneForbidden: true;
    shippingNameForbidden: true;
    shippingAddressForbidden: true;
    rawAmazonPayloadForbidden: true;
    redactedErrorMessageOnly: true;
  };

  isolationContract: {
    companyIdFilterRequired: true;
    storeIdFilterRequired: true;
    marketplaceIdFilterRequired: true;
    regionFilterRequired: true;
    crossCompanyReadForbidden: true;
    crossStoreReadForbidden: true;
    crossMarketplaceReadForbidden: true;
    crossRegionReadForbidden: true;
    tokenMustBelongToSameCompanyStoreMarketplaceRegionInFuture: true;
  };

  forbiddenNow: {
    controllerRoute: true;
    frontendPanel: true;
    serviceMethodImplementation: true;
    httpClientImplementation: true;
    realAmazonOrdersHttpCall: true;
    lwaTokenRefresh: true;
    sigV4Signing: true;
    restrictedDataTokenRequest: true;
    getOrdersCall: true;
    getOrderCall: true;
    getOrderItemsCall: true;
    importJobWrite: true;
    importStagingRowWrite: true;
    transactionWrite: true;
    inventoryDeduction: true;
    settlementReconciliation: true;
    bankReconciliation: true;
    dashboardRevenueUpdate: true;
    prismaSchemaChange: true;
    migrationFile: true;
  };

  summary: {
    readyForOrdersApiRequestBuilderContract: true;
    readyForOrdersApiHttpClientImplementation: false;
    readyForOrdersApiRuntimeSmoke: false;
    readyForImportJobPersistence: false;
    readyForStagingRowPersistence: false;
    readyForTransactionCommit: false;
    readyForInventoryDeduction: false;
    readyForSettlementReconciliation: false;
    readyForBankReconciliation: false;
  };
};

export function buildAmazonSpApiOrdersApiReadBoundaryContract(): AmazonSpApiOrdersApiReadBoundaryContract {
  const sourceConnectionStatusReadModel = assertAmazonSpApiConnectionStatusReadModelContract(
    buildAmazonSpApiConnectionStatusReadModelContract(),
  );

  return {
    version: AMAZON_SP_API_ORDERS_API_READ_BOUNDARY_CONTRACT_VERSION,
    sourceConnectionStatusReadModel,

    step: 'Step140-A',
    contractOnly: true,
    implementationNow: false,
    controllerRouteAddedNow: false,
    frontendRouteAddedNow: false,
    serviceMethodAddedNow: false,
    httpClientAddedNow: false,
    signedRequestAddedNow: false,
    realOrdersApiHttpCallNow: false,
    accessTokenRefreshNow: false,
    tokenPersistenceWriteNow: false,
    importJobWriteNow: false,
    importStagingRowWriteNow: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,
    schemaChangedNow: false,
    migrationAddedNow: false,
    writesDatabase: false,

    ordersApiReadBoundary: {
      purpose: 'design-amazon-sp-api-orders-api-read-boundary-contract-only',
      operationDesignOnly: true,
      connectionStatusMustBeConnectedInFuture: true,
      companyStoreMarketplaceRegionIsolationRequired: true,
      endpointSelectionDesignOnly: true,
      lwaAccessTokenRequiredInFuture: true,
      sigV4SigningRequiredInFuture: true,
      restrictedDataTokenNotIntroducedNow: true,
      getOrdersForbiddenNow: true,
      getOrderForbiddenNow: true,
      getOrderItemsForbiddenNow: true,
      realAmazonHttpForbiddenNow: true,
      paginationExecutionForbiddenNow: true,
    },

    requestShapeContract: {
      companyIdRequired: true,
      storeIdRequired: true,
      marketplaceIdRequired: true,
      regionRequired: true,
      createdAfterRequired: true,
      createdBeforeRequired: true,
      orderStatusesOptional: true,
      fulfillmentChannelsOptional: true,
      maxResultsPerPageOptional: true,
      nextTokenOptional: true,
      nextTokenMustBeOpaque: true,
      dateRangeValidationRequiredInFuture: true,
      marketplaceMismatchRejectedInFuture: true,
      regionMismatchRejectedInFuture: true,
    },

    responseShapeContract: {
      requestIdRequired: true,
      readModeRequired: true,
      sourceRequired: 'amazon-sp-api-orders-v0-design-only',
      marketplaceIdRequired: true,
      regionRequired: true,
      ordersArrayRequired: true,
      hasMoreRequired: true,
      nextTokenMaskedNullable: true,
      fetchedAtRequired: true,
      rawPayloadForbidden: true,
    },

    orderSummaryShapeContract: {
      amazonOrderIdRequired: true,
      purchaseDateRequired: true,
      lastUpdateDateNullable: true,
      orderStatusRequired: true,
      fulfillmentChannelNullable: true,
      salesChannelNullable: true,
      marketplaceIdRequired: true,
      currencyCodeNullable: true,
      orderTotalAmountNullable: true,
      itemCountNullable: true,
      isBusinessOrderNullable: true,
      isPrimeNullable: true,
      buyerInfoRedactedOnly: true,
      shippingAddressRedactedOnly: true,
      rawBuyerNameForbidden: true,
      rawBuyerEmailForbidden: true,
      rawShippingAddressForbidden: true,
    },

    orderItemsShapeContract: {
      amazonOrderIdRequired: true,
      orderItemsArrayRequiredInFuture: true,
      asinRequiredInFuture: true,
      sellerSkuRequiredInFuture: true,
      titleNullable: true,
      quantityOrderedRequiredInFuture: true,
      itemPriceAmountNullable: true,
      itemTaxAmountNullable: true,
      shippingPriceAmountNullable: true,
      shippingTaxAmountNullable: true,
      promotionDiscountAmountNullable: true,
      promotionDiscountTaxAmountNullable: true,
      rawItemPayloadForbidden: true,
    },

    normalizationPreviewContract: {
      normalizedOrderContractOnly: true,
      normalizedOrderItemContractOnly: true,
      amazonOrderIdDedupeKeyRequiredInFuture: true,
      skuAliasResolutionRequiredInFuture: true,
      unresolvedSkuAuditRequiredInFuture: true,
      importJobPersistenceDeferred: true,
      importStagingRowPersistenceDeferred: true,
      transactionCommitDeferred: true,
      inventoryDeductionDeferred: true,
      settlementReconciliationDeferred: true,
      bankReconciliationDeferred: true,
    },

    redactionContract: {
      accessTokenForbidden: true,
      refreshTokenForbidden: true,
      clientSecretForbidden: true,
      authorizationCodeForbidden: true,
      lwaRawResponseForbidden: true,
      sigV4AuthorizationHeaderForbidden: true,
      rawNextTokenForbiddenInLogs: true,
      buyerNameForbidden: true,
      buyerEmailForbidden: true,
      buyerPhoneForbidden: true,
      shippingNameForbidden: true,
      shippingAddressForbidden: true,
      rawAmazonPayloadForbidden: true,
      redactedErrorMessageOnly: true,
    },

    isolationContract: {
      companyIdFilterRequired: true,
      storeIdFilterRequired: true,
      marketplaceIdFilterRequired: true,
      regionFilterRequired: true,
      crossCompanyReadForbidden: true,
      crossStoreReadForbidden: true,
      crossMarketplaceReadForbidden: true,
      crossRegionReadForbidden: true,
      tokenMustBelongToSameCompanyStoreMarketplaceRegionInFuture: true,
    },

    forbiddenNow: {
      controllerRoute: true,
      frontendPanel: true,
      serviceMethodImplementation: true,
      httpClientImplementation: true,
      realAmazonOrdersHttpCall: true,
      lwaTokenRefresh: true,
      sigV4Signing: true,
      restrictedDataTokenRequest: true,
      getOrdersCall: true,
      getOrderCall: true,
      getOrderItemsCall: true,
      importJobWrite: true,
      importStagingRowWrite: true,
      transactionWrite: true,
      inventoryDeduction: true,
      settlementReconciliation: true,
      bankReconciliation: true,
      dashboardRevenueUpdate: true,
      prismaSchemaChange: true,
      migrationFile: true,
    },

    summary: {
      readyForOrdersApiRequestBuilderContract: true,
      readyForOrdersApiHttpClientImplementation: false,
      readyForOrdersApiRuntimeSmoke: false,
      readyForImportJobPersistence: false,
      readyForStagingRowPersistence: false,
      readyForTransactionCommit: false,
      readyForInventoryDeduction: false,
      readyForSettlementReconciliation: false,
      readyForBankReconciliation: false,
    },
  };
}

export function assertAmazonSpApiOrdersApiReadBoundaryContract(
  contract: AmazonSpApiOrdersApiReadBoundaryContract,
): AmazonSpApiOrdersApiReadBoundaryContract {
  if (contract.version !== AMAZON_SP_API_ORDERS_API_READ_BOUNDARY_CONTRACT_VERSION) {
    throw new Error('Step140-A orders api read boundary contract violation: version mismatch.');
  }

  assertAmazonSpApiConnectionStatusReadModelContract(contract.sourceConnectionStatusReadModel);

  if (
    contract.step !== 'Step140-A' ||
    contract.contractOnly !== true ||
    contract.implementationNow !== false ||
    contract.controllerRouteAddedNow !== false ||
    contract.frontendRouteAddedNow !== false ||
    contract.serviceMethodAddedNow !== false ||
    contract.httpClientAddedNow !== false ||
    contract.signedRequestAddedNow !== false ||
    contract.realOrdersApiHttpCallNow !== false ||
    contract.accessTokenRefreshNow !== false ||
    contract.tokenPersistenceWriteNow !== false ||
    contract.importJobWriteNow !== false ||
    contract.importStagingRowWriteNow !== false ||
    contract.transactionWriteNow !== false ||
    contract.inventoryWriteNow !== false ||
    contract.schemaChangedNow !== false ||
    contract.migrationAddedNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step140-A orders api read boundary contract violation: implementation boundary mismatch.');
  }

  if (contract.ordersApiReadBoundary.purpose !== 'design-amazon-sp-api-orders-api-read-boundary-contract-only') {
    throw new Error('Step140-A orders api read boundary contract violation: purpose mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    ordersApiReadBoundary: contract.ordersApiReadBoundary,
    requestShapeContract: contract.requestShapeContract,
    responseShapeContract: contract.responseShapeContract,
    orderSummaryShapeContract: contract.orderSummaryShapeContract,
    orderItemsShapeContract: contract.orderItemsShapeContract,
    normalizationPreviewContract: contract.normalizationPreviewContract,
    redactionContract: contract.redactionContract,
    isolationContract: contract.isolationContract,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (key === 'purpose' || key === 'sourceRequired') continue;
      if (value !== true) {
        throw new Error(`Step140-A orders api read boundary contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (contract.responseShapeContract.sourceRequired !== 'amazon-sp-api-orders-v0-design-only') {
    throw new Error('Step140-A orders api read boundary contract violation: response source mismatch.');
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenNow)) {
    if (forbidden !== true) {
      throw new Error(`Step140-A orders api read boundary contract violation: forbiddenNow.${key} must remain true.`);
    }
  }

  if (
    contract.summary.readyForOrdersApiRequestBuilderContract !== true ||
    contract.summary.readyForOrdersApiHttpClientImplementation !== false ||
    contract.summary.readyForOrdersApiRuntimeSmoke !== false ||
    contract.summary.readyForImportJobPersistence !== false ||
    contract.summary.readyForStagingRowPersistence !== false ||
    contract.summary.readyForTransactionCommit !== false ||
    contract.summary.readyForInventoryDeduction !== false ||
    contract.summary.readyForSettlementReconciliation !== false ||
    contract.summary.readyForBankReconciliation !== false
  ) {
    throw new Error('Step140-A orders api read boundary contract violation: summary readiness mismatch.');
  }

  return contract;
}
