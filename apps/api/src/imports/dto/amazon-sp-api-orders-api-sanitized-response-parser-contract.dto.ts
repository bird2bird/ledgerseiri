import {
  assertAmazonSpApiOrdersApiHttpClientBoundaryContract,
  buildAmazonSpApiOrdersApiHttpClientBoundaryContract,
  type AmazonSpApiOrdersApiHttpClientBoundaryContract,
} from './amazon-sp-api-orders-api-http-client-boundary-contract.dto';

export const AMAZON_SP_API_ORDERS_API_SANITIZED_RESPONSE_PARSER_CONTRACT_VERSION =
  'amazon-sp-api-orders-api-sanitized-response-parser-contract-v1' as const;

export type AmazonSpApiOrdersApiSanitizedResponseParserContract = {
  version: typeof AMAZON_SP_API_ORDERS_API_SANITIZED_RESPONSE_PARSER_CONTRACT_VERSION;
  sourceStep140D: AmazonSpApiOrdersApiHttpClientBoundaryContract;

  step: 'Step140-E';
  contractOnly: true;
  implementationNow: false;
  controllerRouteAddedNow: false;
  frontendRouteAddedNow: false;
  serviceMethodAddedNow: false;
  responseParserImplementationNow: false;
  normalizedProjectionImplementationNow: false;
  errorMapperImplementationNow: false;
  httpClientImplementationNow: false;
  realNetworkExecutionNow: false;
  realAmazonOrdersApiCallNow: false;
  realCryptoExecutionNow: false;
  awsCredentialReadNow: false;
  accessTokenRefreshNow: false;
  restrictedDataTokenRequestNow: false;
  importJobWriteNow: false;
  importStagingRowWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;
  schemaChangedNow: false;
  migrationAddedNow: false;
  writesDatabase: false;

  parserBoundary: {
    purpose: 'design-amazon-sp-api-orders-api-sanitized-response-parser-contract-only';
    parserShapeDesignOnly: true;
    errorMapperDesignOnly: true;
    normalizedProjectionDesignOnly: true;
    paginationDesignOnly: true;
    noNetworkExecution: true;
    noHttpClientExecution: true;
    noSigV4Execution: true;
    noAwsCredentialRead: true;
    noTokenRefreshExecution: true;
    noRestrictedDataTokenExecution: true;
    noDatabaseReadOrWrite: true;
    noImportExecution: true;
  };

  listOrdersResponseContract: {
    payloadObjectRequired: true;
    ordersArrayRequired: true;
    nextTokenNullable: true;
    nextTokenMaskedInLogs: true;
    amazonOrderIdRequired: true;
    purchaseDateRequired: true;
    lastUpdateDateNullable: true;
    orderStatusRequired: true;
    fulfillmentChannelNullable: true;
    salesChannelNullable: true;
    marketplaceIdRequired: true;
    orderTotalNullable: true;
    currencyCodeNullable: true;
    numberOfItemsShippedNullable: true;
    numberOfItemsUnshippedNullable: true;
    isBusinessOrderNullable: true;
    isPrimeNullable: true;
  };

  orderItemsResponseContract: {
    payloadObjectRequired: true;
    orderItemsArrayRequired: true;
    nextTokenNullable: true;
    nextTokenMaskedInLogs: true;
    amazonOrderIdRequiredFromContext: true;
    orderItemIdRequired: true;
    asinRequired: true;
    sellerSkuRequired: true;
    titleNullable: true;
    quantityOrderedRequired: true;
    quantityShippedNullable: true;
    itemPriceAmountNullable: true;
    itemPriceCurrencyNullable: true;
    itemTaxAmountNullable: true;
    shippingPriceAmountNullable: true;
    shippingTaxAmountNullable: true;
    promotionDiscountAmountNullable: true;
    promotionDiscountTaxAmountNullable: true;
  };

  singleOrderResponseContract: {
    payloadObjectRequired: true;
    amazonOrderIdRequired: true;
    purchaseDateRequired: true;
    orderStatusRequired: true;
    buyerInfoRedactedOnly: true;
    shippingAddressRedactedOnly: true;
    rawBuyerInfoForbidden: true;
    rawShippingAddressForbidden: true;
  };

  normalizedOrderProjectionContract: {
    normalizedAmazonOrderIdRequired: true;
    normalizedPurchaseDateRequired: true;
    normalizedBusinessMonthRequiredInFuture: true;
    normalizedMarketplaceIdRequired: true;
    normalizedOrderStatusRequired: true;
    normalizedFulfillmentChannelNullable: true;
    normalizedSalesChannelNullable: true;
    normalizedCurrencyCodeNullable: true;
    normalizedOrderTotalAmountNullable: true;
    normalizedItemCountNullable: true;
    dedupeKeyFromAmazonOrderIdRequired: true;
    sourceTypeAmazonSpApiRequiredInFuture: true;
    rawPayloadForbidden: true;
  };

  normalizedOrderItemProjectionContract: {
    normalizedAmazonOrderIdRequired: true;
    normalizedOrderItemIdRequired: true;
    normalizedAsinRequired: true;
    normalizedSellerSkuRequired: true;
    normalizedTitleNullable: true;
    normalizedQuantityOrderedRequired: true;
    normalizedItemPriceAmountNullable: true;
    normalizedItemTaxAmountNullable: true;
    normalizedShippingPriceAmountNullable: true;
    normalizedShippingTaxAmountNullable: true;
    normalizedPromotionDiscountAmountNullable: true;
    normalizedPromotionDiscountTaxAmountNullable: true;
    skuAliasResolutionDeferred: true;
    inventoryDeductionDeferred: true;
    rawPayloadForbidden: true;
  };

  errorMappingContract: {
    amazonErrorCodeCapturedSanitized: true;
    amazonErrorMessageCapturedRedacted: true;
    httpStatusCaptured: true;
    requestIdCaptured: true;
    throttlingMappedToRetryable: true;
    quotaExceededMappedToRetryable: true;
    unauthorizedMappedToReconnectRequired: true;
    forbiddenMappedToPermissionRequired: true;
    notFoundMappedToNonRetryable: true;
    validationErrorMappedToNonRetryable: true;
    timeoutMappedToRetryable: true;
    networkMappedToRetryable: true;
    rawAmazonErrorPayloadForbidden: true;
  };

  redactionContract: {
    rawAmazonPayloadForbidden: true;
    rawAmazonHeadersForbidden: true;
    rawNextTokenForbiddenInLogs: true;
    rawBuyerNameForbidden: true;
    rawBuyerEmailForbidden: true;
    rawBuyerPhoneForbidden: true;
    rawShippingNameForbidden: true;
    rawShippingAddressForbidden: true;
    rawAccessTokenForbidden: true;
    rawAuthorizationHeaderForbidden: true;
    rawAwsCredentialForbidden: true;
    rawStackTraceForbiddenInResponse: true;
  };

  importReadinessGateContract: {
    readyForImportJobPersistence: false;
    readyForImportStagingRowPersistence: false;
    readyForTransactionCommit: false;
    readyForInventoryDeduction: false;
    requiresExplicitPersistenceContractNext: true;
    requiresNormalizedFixtureBeforePersistence: true;
    requiresIdempotencyContractBeforeCommit: true;
    requiresSkuAliasContractBeforeInventory: true;
  };

  sampleParserContract: {
    sampleSource: 'amazon-sp-api-orders-v0-sanitized-design-only';
    sampleMarketplaceId: 'A1VC38T7YXB528';
    sampleAmazonOrderId: 'ORDER-STEP140-E-SAMPLE';
    sampleOrderItemId: 'ITEM-STEP140-E-SAMPLE';
    sampleSellerSku: 'SKU-STEP140-E-SAMPLE';
    sampleCurrencyCode: 'JPY';
    expectedNextTokenMasked: true;
    expectedRawPayloadForbidden: true;
    expectedBuyerPiiRemoved: true;
    expectedShippingAddressRemoved: true;
    expectedNormalizedOrderProjection: true;
    expectedNormalizedOrderItemProjection: true;
  };

  forbiddenNow: {
    controllerRoute: true;
    frontendPanel: true;
    serviceMethodImplementation: true;
    responseParserImplementation: true;
    errorMapperImplementation: true;
    normalizedProjectionImplementation: true;
    httpClientImplementation: true;
    realNetworkExecution: true;
    fetchCall: true;
    axiosCall: true;
    gotCall: true;
    nodeHttpsRequestCall: true;
    realAmazonOrdersHttpCall: true;
    cryptoCreateHmac: true;
    cryptoCreateHash: true;
    awsSignatureV4LibraryCall: true;
    awsCredentialRead: true;
    accessTokenRefresh: true;
    restrictedDataTokenRequest: true;
    getOrdersExecution: true;
    getOrderExecution: true;
    getOrderItemsExecution: true;
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
    readyForOrdersApiSanitizedResponseParserImplementation: false;
    readyForOrdersApiNormalizedFixtureContract: true;
    readyForOrdersApiPersistenceReadinessContract: true;
    readyForOrdersApiRuntimeSmoke: false;
    readyForImportJobPersistence: false;
    readyForStagingRowPersistence: false;
    readyForTransactionCommit: false;
    readyForInventoryDeduction: false;
    readyForSettlementReconciliation: false;
    readyForBankReconciliation: false;
  };
};

export function buildAmazonSpApiOrdersApiSanitizedResponseParserContract(): AmazonSpApiOrdersApiSanitizedResponseParserContract {
  const sourceStep140D = assertAmazonSpApiOrdersApiHttpClientBoundaryContract(
    buildAmazonSpApiOrdersApiHttpClientBoundaryContract(),
  );

  return {
    version: AMAZON_SP_API_ORDERS_API_SANITIZED_RESPONSE_PARSER_CONTRACT_VERSION,
    sourceStep140D,

    step: 'Step140-E',
    contractOnly: true,
    implementationNow: false,
    controllerRouteAddedNow: false,
    frontendRouteAddedNow: false,
    serviceMethodAddedNow: false,
    responseParserImplementationNow: false,
    normalizedProjectionImplementationNow: false,
    errorMapperImplementationNow: false,
    httpClientImplementationNow: false,
    realNetworkExecutionNow: false,
    realAmazonOrdersApiCallNow: false,
    realCryptoExecutionNow: false,
    awsCredentialReadNow: false,
    accessTokenRefreshNow: false,
    restrictedDataTokenRequestNow: false,
    importJobWriteNow: false,
    importStagingRowWriteNow: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,
    schemaChangedNow: false,
    migrationAddedNow: false,
    writesDatabase: false,

    parserBoundary: {
      purpose: 'design-amazon-sp-api-orders-api-sanitized-response-parser-contract-only',
      parserShapeDesignOnly: true,
      errorMapperDesignOnly: true,
      normalizedProjectionDesignOnly: true,
      paginationDesignOnly: true,
      noNetworkExecution: true,
      noHttpClientExecution: true,
      noSigV4Execution: true,
      noAwsCredentialRead: true,
      noTokenRefreshExecution: true,
      noRestrictedDataTokenExecution: true,
      noDatabaseReadOrWrite: true,
      noImportExecution: true,
    },

    listOrdersResponseContract: {
      payloadObjectRequired: true,
      ordersArrayRequired: true,
      nextTokenNullable: true,
      nextTokenMaskedInLogs: true,
      amazonOrderIdRequired: true,
      purchaseDateRequired: true,
      lastUpdateDateNullable: true,
      orderStatusRequired: true,
      fulfillmentChannelNullable: true,
      salesChannelNullable: true,
      marketplaceIdRequired: true,
      orderTotalNullable: true,
      currencyCodeNullable: true,
      numberOfItemsShippedNullable: true,
      numberOfItemsUnshippedNullable: true,
      isBusinessOrderNullable: true,
      isPrimeNullable: true,
    },

    orderItemsResponseContract: {
      payloadObjectRequired: true,
      orderItemsArrayRequired: true,
      nextTokenNullable: true,
      nextTokenMaskedInLogs: true,
      amazonOrderIdRequiredFromContext: true,
      orderItemIdRequired: true,
      asinRequired: true,
      sellerSkuRequired: true,
      titleNullable: true,
      quantityOrderedRequired: true,
      quantityShippedNullable: true,
      itemPriceAmountNullable: true,
      itemPriceCurrencyNullable: true,
      itemTaxAmountNullable: true,
      shippingPriceAmountNullable: true,
      shippingTaxAmountNullable: true,
      promotionDiscountAmountNullable: true,
      promotionDiscountTaxAmountNullable: true,
    },

    singleOrderResponseContract: {
      payloadObjectRequired: true,
      amazonOrderIdRequired: true,
      purchaseDateRequired: true,
      orderStatusRequired: true,
      buyerInfoRedactedOnly: true,
      shippingAddressRedactedOnly: true,
      rawBuyerInfoForbidden: true,
      rawShippingAddressForbidden: true,
    },

    normalizedOrderProjectionContract: {
      normalizedAmazonOrderIdRequired: true,
      normalizedPurchaseDateRequired: true,
      normalizedBusinessMonthRequiredInFuture: true,
      normalizedMarketplaceIdRequired: true,
      normalizedOrderStatusRequired: true,
      normalizedFulfillmentChannelNullable: true,
      normalizedSalesChannelNullable: true,
      normalizedCurrencyCodeNullable: true,
      normalizedOrderTotalAmountNullable: true,
      normalizedItemCountNullable: true,
      dedupeKeyFromAmazonOrderIdRequired: true,
      sourceTypeAmazonSpApiRequiredInFuture: true,
      rawPayloadForbidden: true,
    },

    normalizedOrderItemProjectionContract: {
      normalizedAmazonOrderIdRequired: true,
      normalizedOrderItemIdRequired: true,
      normalizedAsinRequired: true,
      normalizedSellerSkuRequired: true,
      normalizedTitleNullable: true,
      normalizedQuantityOrderedRequired: true,
      normalizedItemPriceAmountNullable: true,
      normalizedItemTaxAmountNullable: true,
      normalizedShippingPriceAmountNullable: true,
      normalizedShippingTaxAmountNullable: true,
      normalizedPromotionDiscountAmountNullable: true,
      normalizedPromotionDiscountTaxAmountNullable: true,
      skuAliasResolutionDeferred: true,
      inventoryDeductionDeferred: true,
      rawPayloadForbidden: true,
    },

    errorMappingContract: {
      amazonErrorCodeCapturedSanitized: true,
      amazonErrorMessageCapturedRedacted: true,
      httpStatusCaptured: true,
      requestIdCaptured: true,
      throttlingMappedToRetryable: true,
      quotaExceededMappedToRetryable: true,
      unauthorizedMappedToReconnectRequired: true,
      forbiddenMappedToPermissionRequired: true,
      notFoundMappedToNonRetryable: true,
      validationErrorMappedToNonRetryable: true,
      timeoutMappedToRetryable: true,
      networkMappedToRetryable: true,
      rawAmazonErrorPayloadForbidden: true,
    },

    redactionContract: {
      rawAmazonPayloadForbidden: true,
      rawAmazonHeadersForbidden: true,
      rawNextTokenForbiddenInLogs: true,
      rawBuyerNameForbidden: true,
      rawBuyerEmailForbidden: true,
      rawBuyerPhoneForbidden: true,
      rawShippingNameForbidden: true,
      rawShippingAddressForbidden: true,
      rawAccessTokenForbidden: true,
      rawAuthorizationHeaderForbidden: true,
      rawAwsCredentialForbidden: true,
      rawStackTraceForbiddenInResponse: true,
    },

    importReadinessGateContract: {
      readyForImportJobPersistence: false,
      readyForImportStagingRowPersistence: false,
      readyForTransactionCommit: false,
      readyForInventoryDeduction: false,
      requiresExplicitPersistenceContractNext: true,
      requiresNormalizedFixtureBeforePersistence: true,
      requiresIdempotencyContractBeforeCommit: true,
      requiresSkuAliasContractBeforeInventory: true,
    },

    sampleParserContract: {
      sampleSource: 'amazon-sp-api-orders-v0-sanitized-design-only',
      sampleMarketplaceId: 'A1VC38T7YXB528',
      sampleAmazonOrderId: 'ORDER-STEP140-E-SAMPLE',
      sampleOrderItemId: 'ITEM-STEP140-E-SAMPLE',
      sampleSellerSku: 'SKU-STEP140-E-SAMPLE',
      sampleCurrencyCode: 'JPY',
      expectedNextTokenMasked: true,
      expectedRawPayloadForbidden: true,
      expectedBuyerPiiRemoved: true,
      expectedShippingAddressRemoved: true,
      expectedNormalizedOrderProjection: true,
      expectedNormalizedOrderItemProjection: true,
    },

    forbiddenNow: {
      controllerRoute: true,
      frontendPanel: true,
      serviceMethodImplementation: true,
      responseParserImplementation: true,
      errorMapperImplementation: true,
      normalizedProjectionImplementation: true,
      httpClientImplementation: true,
      realNetworkExecution: true,
      fetchCall: true,
      axiosCall: true,
      gotCall: true,
      nodeHttpsRequestCall: true,
      realAmazonOrdersHttpCall: true,
      cryptoCreateHmac: true,
      cryptoCreateHash: true,
      awsSignatureV4LibraryCall: true,
      awsCredentialRead: true,
      accessTokenRefresh: true,
      restrictedDataTokenRequest: true,
      getOrdersExecution: true,
      getOrderExecution: true,
      getOrderItemsExecution: true,
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
      readyForOrdersApiSanitizedResponseParserImplementation: false,
      readyForOrdersApiNormalizedFixtureContract: true,
      readyForOrdersApiPersistenceReadinessContract: true,
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

export function assertAmazonSpApiOrdersApiSanitizedResponseParserContract(
  contract: AmazonSpApiOrdersApiSanitizedResponseParserContract,
): AmazonSpApiOrdersApiSanitizedResponseParserContract {
  if (contract.version !== AMAZON_SP_API_ORDERS_API_SANITIZED_RESPONSE_PARSER_CONTRACT_VERSION) {
    throw new Error('Step140-E orders api sanitized response parser contract violation: version mismatch.');
  }

  assertAmazonSpApiOrdersApiHttpClientBoundaryContract(contract.sourceStep140D);

  if (
    contract.step !== 'Step140-E' ||
    contract.contractOnly !== true ||
    contract.implementationNow !== false ||
    contract.controllerRouteAddedNow !== false ||
    contract.frontendRouteAddedNow !== false ||
    contract.serviceMethodAddedNow !== false ||
    contract.responseParserImplementationNow !== false ||
    contract.normalizedProjectionImplementationNow !== false ||
    contract.errorMapperImplementationNow !== false ||
    contract.httpClientImplementationNow !== false ||
    contract.realNetworkExecutionNow !== false ||
    contract.realAmazonOrdersApiCallNow !== false ||
    contract.realCryptoExecutionNow !== false ||
    contract.awsCredentialReadNow !== false ||
    contract.accessTokenRefreshNow !== false ||
    contract.restrictedDataTokenRequestNow !== false ||
    contract.importJobWriteNow !== false ||
    contract.importStagingRowWriteNow !== false ||
    contract.transactionWriteNow !== false ||
    contract.inventoryWriteNow !== false ||
    contract.schemaChangedNow !== false ||
    contract.migrationAddedNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step140-E orders api sanitized response parser contract violation: implementation boundary mismatch.');
  }

  if (contract.parserBoundary.purpose !== 'design-amazon-sp-api-orders-api-sanitized-response-parser-contract-only') {
    throw new Error('Step140-E orders api sanitized response parser contract violation: purpose mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    parserBoundary: contract.parserBoundary,
    listOrdersResponseContract: contract.listOrdersResponseContract,
    orderItemsResponseContract: contract.orderItemsResponseContract,
    singleOrderResponseContract: contract.singleOrderResponseContract,
    normalizedOrderProjectionContract: contract.normalizedOrderProjectionContract,
    normalizedOrderItemProjectionContract: contract.normalizedOrderItemProjectionContract,
    errorMappingContract: contract.errorMappingContract,
    redactionContract: contract.redactionContract,
    importReadinessGateContract: contract.importReadinessGateContract,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (key === 'purpose') continue;
      if (key.startsWith('readyFor')) {
        if (value !== false) {
          throw new Error(`Step140-E orders api sanitized response parser contract violation: ${sectionName}.${key} must remain false.`);
        }
        continue;
      }
      if (value !== true) {
        throw new Error(`Step140-E orders api sanitized response parser contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.sampleParserContract.sampleSource !== 'amazon-sp-api-orders-v0-sanitized-design-only' ||
    contract.sampleParserContract.sampleMarketplaceId !== 'A1VC38T7YXB528' ||
    contract.sampleParserContract.sampleCurrencyCode !== 'JPY' ||
    contract.sampleParserContract.expectedNextTokenMasked !== true ||
    contract.sampleParserContract.expectedRawPayloadForbidden !== true ||
    contract.sampleParserContract.expectedBuyerPiiRemoved !== true ||
    contract.sampleParserContract.expectedShippingAddressRemoved !== true ||
    contract.sampleParserContract.expectedNormalizedOrderProjection !== true ||
    contract.sampleParserContract.expectedNormalizedOrderItemProjection !== true
  ) {
    throw new Error('Step140-E orders api sanitized response parser contract violation: sample mismatch.');
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenNow)) {
    if (forbidden !== true) {
      throw new Error(`Step140-E orders api sanitized response parser contract violation: forbiddenNow.${key} must remain true.`);
    }
  }

  if (
    contract.summary.readyForOrdersApiSanitizedResponseParserImplementation !== false ||
    contract.summary.readyForOrdersApiNormalizedFixtureContract !== true ||
    contract.summary.readyForOrdersApiPersistenceReadinessContract !== true ||
    contract.summary.readyForOrdersApiRuntimeSmoke !== false ||
    contract.summary.readyForImportJobPersistence !== false ||
    contract.summary.readyForStagingRowPersistence !== false ||
    contract.summary.readyForTransactionCommit !== false ||
    contract.summary.readyForInventoryDeduction !== false ||
    contract.summary.readyForSettlementReconciliation !== false ||
    contract.summary.readyForBankReconciliation !== false
  ) {
    throw new Error('Step140-E orders api sanitized response parser contract violation: summary readiness mismatch.');
  }

  if (contract.sourceStep140D.summary.readyForOrdersApiSanitizedResponseParserContract !== true) {
    throw new Error('Step140-E orders api sanitized response parser contract violation: Step140-D does not allow this contract.');
  }

  return contract;
}
