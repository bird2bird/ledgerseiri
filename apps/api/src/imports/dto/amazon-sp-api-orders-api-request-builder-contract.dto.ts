import {
  assertAmazonSpApiOrdersApiReadBoundaryContract,
  buildAmazonSpApiOrdersApiReadBoundaryContract,
  type AmazonSpApiOrdersApiReadBoundaryContract,
} from './amazon-sp-api-orders-api-read-boundary-contract.dto';

export const AMAZON_SP_API_ORDERS_API_REQUEST_BUILDER_CONTRACT_VERSION =
  'amazon-sp-api-orders-api-request-builder-contract-v1' as const;

export type AmazonSpApiOrdersApiRegionEndpointContract = {
  region: 'FE' | 'NA' | 'EU';
  endpoint: 'https://sellingpartnerapi-fe.amazon.com' | 'https://sellingpartnerapi-na.amazon.com' | 'https://sellingpartnerapi-eu.amazon.com';
  marketplaceIds: readonly string[];
};

export type AmazonSpApiOrdersApiRequestBuilderContract = {
  version: typeof AMAZON_SP_API_ORDERS_API_REQUEST_BUILDER_CONTRACT_VERSION;
  sourceStep140A: AmazonSpApiOrdersApiReadBoundaryContract;

  step: 'Step140-B';
  contractOnly: true;
  implementationNow: false;
  controllerRouteAddedNow: false;
  frontendRouteAddedNow: false;
  serviceMethodAddedNow: false;
  httpClientAddedNow: false;
  sigV4SigningAddedNow: false;
  accessTokenRefreshNow: false;
  restrictedDataTokenRequestNow: false;
  realOrdersApiHttpCallNow: false;
  importJobWriteNow: false;
  importStagingRowWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;
  schemaChangedNow: false;
  migrationAddedNow: false;
  writesDatabase: false;

  requestBuilderBoundary: {
    purpose: 'design-amazon-sp-api-orders-api-request-builder-contract-only';
    pureRequestShapeOnly: true;
    noNetworkExecution: true;
    noSigV4SigningExecution: true;
    noTokenRefreshExecution: true;
    noRestrictedDataTokenExecution: true;
    noDatabaseReadOrWrite: true;
    noControllerRoute: true;
    noFrontendConsumption: true;
    noImportExecution: true;
  };

  endpointContract: {
    ordersApiVersion: 'orders/v0';
    listOrdersPathTemplate: '/orders/v0/orders';
    getOrderPathTemplate: '/orders/v0/orders/{orderId}';
    getOrderItemsPathTemplate: '/orders/v0/orders/{orderId}/orderItems';
    regionEndpointMappingRequired: true;
    japanMarketplaceIdSupported: 'A1VC38T7YXB528';
    farEastEndpointSupported: 'https://sellingpartnerapi-fe.amazon.com';
    northAmericaEndpointReserved: 'https://sellingpartnerapi-na.amazon.com';
    europeEndpointReserved: 'https://sellingpartnerapi-eu.amazon.com';
    unknownRegionRejectedInFuture: true;
    marketplaceRegionMismatchRejectedInFuture: true;
  };

  listOrdersQueryContract: {
    marketplaceIdsRequired: true;
    createdAfterRequired: true;
    createdBeforeRequired: true;
    createdAfterIso8601Required: true;
    createdBeforeIso8601Required: true;
    createdAfterMustBeBeforeCreatedBefore: true;
    maxDateRangeDaysRequiredInFuture: true;
    nextTokenOpaqueOptional: true;
    nextTokenMutuallyExclusiveWithDateFiltersInFuture: true;
    orderStatusesCsvOptional: true;
    fulfillmentChannelsCsvOptional: true;
    maxResultsPerPageOptional: true;
    maxResultsPerPageRangeValidatedInFuture: true;
    queryStringMustBeDeterministic: true;
    queryStringMustBeSortedByKey: true;
    queryStringMustPercentEncodeValues: true;
  };

  getOrderRequestContract: {
    amazonOrderIdRequired: true;
    amazonOrderIdPathEncoded: true;
    noBuyerInfoPathNow: true;
    noAddressPathNow: true;
    rawOrderPayloadForbidden: true;
  };

  getOrderItemsRequestContract: {
    amazonOrderIdRequired: true;
    amazonOrderIdPathEncoded: true;
    nextTokenOpaqueOptional: true;
    rawOrderItemsPayloadForbidden: true;
  };

  headerContract: {
    hostHeaderRequiredInFuture: true;
    userAgentRequiredInFuture: true;
    xAmzAccessTokenRequiredInFuture: true;
    xAmzDateRequiredInFuture: true;
    authorizationHeaderRequiredOnlyAfterSigV4Step: true;
    authorizationHeaderForbiddenNow: true;
    accessTokenValueForbiddenNow: true;
    refreshTokenValueForbiddenNow: true;
    clientSecretValueForbiddenNow: true;
  };

  canonicalRequestContract: {
    methodGetRequired: true;
    canonicalUriRequired: true;
    canonicalQueryStringRequired: true;
    canonicalHeadersDesignOnly: true;
    signedHeadersDesignOnly: true;
    hashedPayloadDesignOnly: true;
    sigV4ExecutionDeferred: true;
    awsCredentialsDeferred: true;
    secretAccessKeyForbiddenNow: true;
  };

  sampleRequestContract: {
    sampleCompanyId: 'step140-b-company';
    sampleStoreId: 'step140-b-store';
    sampleRegion: 'FE';
    sampleMarketplaceId: 'A1VC38T7YXB528';
    sampleCreatedAfter: '2026-05-01T00:00:00Z';
    sampleCreatedBefore: '2026-05-02T00:00:00Z';
    sampleOrderStatus: 'Shipped';
    sampleFulfillmentChannel: 'AFN';
    expectedListOrdersMethod: 'GET';
    expectedListOrdersPath: '/orders/v0/orders';
    expectedListOrdersEndpoint: 'https://sellingpartnerapi-fe.amazon.com';
    expectedQueryContainsMarketplaceIds: true;
    expectedQueryContainsCreatedAfter: true;
    expectedQueryContainsCreatedBefore: true;
    expectedQueryContainsOrderStatuses: true;
    expectedQueryContainsFulfillmentChannels: true;
  };

  redactionContract: {
    rawAccessTokenForbidden: true;
    rawRefreshTokenForbidden: true;
    rawClientSecretForbidden: true;
    rawAuthorizationHeaderForbidden: true;
    rawSigV4CanonicalRequestForbiddenInLogs: true;
    rawNextTokenForbiddenInLogs: true;
    buyerNameForbidden: true;
    buyerEmailForbidden: true;
    buyerPhoneForbidden: true;
    buyerAddressForbidden: true;
    rawAmazonResponseForbidden: true;
  };

  isolationContract: {
    companyIdRequired: true;
    storeIdRequired: true;
    marketplaceIdRequired: true;
    regionRequired: true;
    companyStoreMarketplaceRegionTupleRequired: true;
    crossCompanyRequestForbidden: true;
    crossStoreRequestForbidden: true;
    crossMarketplaceRequestForbidden: true;
    crossRegionRequestForbidden: true;
  };

  forbiddenNow: {
    controllerRoute: true;
    frontendPanel: true;
    serviceMethodImplementation: true;
    httpClientImplementation: true;
    fetchCall: true;
    axiosCall: true;
    gotCall: true;
    realAmazonOrdersHttpCall: true;
    sigV4SigningExecution: true;
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
    readyForOrdersApiRequestBuilderImplementation: false;
    readyForOrdersApiSignedRequestContract: true;
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

export function buildAmazonSpApiOrdersApiRequestBuilderContract(): AmazonSpApiOrdersApiRequestBuilderContract {
  const sourceStep140A = assertAmazonSpApiOrdersApiReadBoundaryContract(
    buildAmazonSpApiOrdersApiReadBoundaryContract(),
  );

  return {
    version: AMAZON_SP_API_ORDERS_API_REQUEST_BUILDER_CONTRACT_VERSION,
    sourceStep140A,

    step: 'Step140-B',
    contractOnly: true,
    implementationNow: false,
    controllerRouteAddedNow: false,
    frontendRouteAddedNow: false,
    serviceMethodAddedNow: false,
    httpClientAddedNow: false,
    sigV4SigningAddedNow: false,
    accessTokenRefreshNow: false,
    restrictedDataTokenRequestNow: false,
    realOrdersApiHttpCallNow: false,
    importJobWriteNow: false,
    importStagingRowWriteNow: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,
    schemaChangedNow: false,
    migrationAddedNow: false,
    writesDatabase: false,

    requestBuilderBoundary: {
      purpose: 'design-amazon-sp-api-orders-api-request-builder-contract-only',
      pureRequestShapeOnly: true,
      noNetworkExecution: true,
      noSigV4SigningExecution: true,
      noTokenRefreshExecution: true,
      noRestrictedDataTokenExecution: true,
      noDatabaseReadOrWrite: true,
      noControllerRoute: true,
      noFrontendConsumption: true,
      noImportExecution: true,
    },

    endpointContract: {
      ordersApiVersion: 'orders/v0',
      listOrdersPathTemplate: '/orders/v0/orders',
      getOrderPathTemplate: '/orders/v0/orders/{orderId}',
      getOrderItemsPathTemplate: '/orders/v0/orders/{orderId}/orderItems',
      regionEndpointMappingRequired: true,
      japanMarketplaceIdSupported: 'A1VC38T7YXB528',
      farEastEndpointSupported: 'https://sellingpartnerapi-fe.amazon.com',
      northAmericaEndpointReserved: 'https://sellingpartnerapi-na.amazon.com',
      europeEndpointReserved: 'https://sellingpartnerapi-eu.amazon.com',
      unknownRegionRejectedInFuture: true,
      marketplaceRegionMismatchRejectedInFuture: true,
    },

    listOrdersQueryContract: {
      marketplaceIdsRequired: true,
      createdAfterRequired: true,
      createdBeforeRequired: true,
      createdAfterIso8601Required: true,
      createdBeforeIso8601Required: true,
      createdAfterMustBeBeforeCreatedBefore: true,
      maxDateRangeDaysRequiredInFuture: true,
      nextTokenOpaqueOptional: true,
      nextTokenMutuallyExclusiveWithDateFiltersInFuture: true,
      orderStatusesCsvOptional: true,
      fulfillmentChannelsCsvOptional: true,
      maxResultsPerPageOptional: true,
      maxResultsPerPageRangeValidatedInFuture: true,
      queryStringMustBeDeterministic: true,
      queryStringMustBeSortedByKey: true,
      queryStringMustPercentEncodeValues: true,
    },

    getOrderRequestContract: {
      amazonOrderIdRequired: true,
      amazonOrderIdPathEncoded: true,
      noBuyerInfoPathNow: true,
      noAddressPathNow: true,
      rawOrderPayloadForbidden: true,
    },

    getOrderItemsRequestContract: {
      amazonOrderIdRequired: true,
      amazonOrderIdPathEncoded: true,
      nextTokenOpaqueOptional: true,
      rawOrderItemsPayloadForbidden: true,
    },

    headerContract: {
      hostHeaderRequiredInFuture: true,
      userAgentRequiredInFuture: true,
      xAmzAccessTokenRequiredInFuture: true,
      xAmzDateRequiredInFuture: true,
      authorizationHeaderRequiredOnlyAfterSigV4Step: true,
      authorizationHeaderForbiddenNow: true,
      accessTokenValueForbiddenNow: true,
      refreshTokenValueForbiddenNow: true,
      clientSecretValueForbiddenNow: true,
    },

    canonicalRequestContract: {
      methodGetRequired: true,
      canonicalUriRequired: true,
      canonicalQueryStringRequired: true,
      canonicalHeadersDesignOnly: true,
      signedHeadersDesignOnly: true,
      hashedPayloadDesignOnly: true,
      sigV4ExecutionDeferred: true,
      awsCredentialsDeferred: true,
      secretAccessKeyForbiddenNow: true,
    },

    sampleRequestContract: {
      sampleCompanyId: 'step140-b-company',
      sampleStoreId: 'step140-b-store',
      sampleRegion: 'FE',
      sampleMarketplaceId: 'A1VC38T7YXB528',
      sampleCreatedAfter: '2026-05-01T00:00:00Z',
      sampleCreatedBefore: '2026-05-02T00:00:00Z',
      sampleOrderStatus: 'Shipped',
      sampleFulfillmentChannel: 'AFN',
      expectedListOrdersMethod: 'GET',
      expectedListOrdersPath: '/orders/v0/orders',
      expectedListOrdersEndpoint: 'https://sellingpartnerapi-fe.amazon.com',
      expectedQueryContainsMarketplaceIds: true,
      expectedQueryContainsCreatedAfter: true,
      expectedQueryContainsCreatedBefore: true,
      expectedQueryContainsOrderStatuses: true,
      expectedQueryContainsFulfillmentChannels: true,
    },

    redactionContract: {
      rawAccessTokenForbidden: true,
      rawRefreshTokenForbidden: true,
      rawClientSecretForbidden: true,
      rawAuthorizationHeaderForbidden: true,
      rawSigV4CanonicalRequestForbiddenInLogs: true,
      rawNextTokenForbiddenInLogs: true,
      buyerNameForbidden: true,
      buyerEmailForbidden: true,
      buyerPhoneForbidden: true,
      buyerAddressForbidden: true,
      rawAmazonResponseForbidden: true,
    },

    isolationContract: {
      companyIdRequired: true,
      storeIdRequired: true,
      marketplaceIdRequired: true,
      regionRequired: true,
      companyStoreMarketplaceRegionTupleRequired: true,
      crossCompanyRequestForbidden: true,
      crossStoreRequestForbidden: true,
      crossMarketplaceRequestForbidden: true,
      crossRegionRequestForbidden: true,
    },

    forbiddenNow: {
      controllerRoute: true,
      frontendPanel: true,
      serviceMethodImplementation: true,
      httpClientImplementation: true,
      fetchCall: true,
      axiosCall: true,
      gotCall: true,
      realAmazonOrdersHttpCall: true,
      sigV4SigningExecution: true,
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
      readyForOrdersApiRequestBuilderImplementation: false,
      readyForOrdersApiSignedRequestContract: true,
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

export function assertAmazonSpApiOrdersApiRequestBuilderContract(
  contract: AmazonSpApiOrdersApiRequestBuilderContract,
): AmazonSpApiOrdersApiRequestBuilderContract {
  if (contract.version !== AMAZON_SP_API_ORDERS_API_REQUEST_BUILDER_CONTRACT_VERSION) {
    throw new Error('Step140-B orders api request builder contract violation: version mismatch.');
  }

  assertAmazonSpApiOrdersApiReadBoundaryContract(contract.sourceStep140A);

  if (
    contract.step !== 'Step140-B' ||
    contract.contractOnly !== true ||
    contract.implementationNow !== false ||
    contract.controllerRouteAddedNow !== false ||
    contract.frontendRouteAddedNow !== false ||
    contract.serviceMethodAddedNow !== false ||
    contract.httpClientAddedNow !== false ||
    contract.sigV4SigningAddedNow !== false ||
    contract.accessTokenRefreshNow !== false ||
    contract.restrictedDataTokenRequestNow !== false ||
    contract.realOrdersApiHttpCallNow !== false ||
    contract.importJobWriteNow !== false ||
    contract.importStagingRowWriteNow !== false ||
    contract.transactionWriteNow !== false ||
    contract.inventoryWriteNow !== false ||
    contract.schemaChangedNow !== false ||
    contract.migrationAddedNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step140-B orders api request builder contract violation: implementation boundary mismatch.');
  }

  if (contract.requestBuilderBoundary.purpose !== 'design-amazon-sp-api-orders-api-request-builder-contract-only') {
    throw new Error('Step140-B orders api request builder contract violation: purpose mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    requestBuilderBoundary: contract.requestBuilderBoundary,
    listOrdersQueryContract: contract.listOrdersQueryContract,
    getOrderRequestContract: contract.getOrderRequestContract,
    getOrderItemsRequestContract: contract.getOrderItemsRequestContract,
    headerContract: contract.headerContract,
    canonicalRequestContract: contract.canonicalRequestContract,
    redactionContract: contract.redactionContract,
    isolationContract: contract.isolationContract,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (key === 'purpose') continue;
      if (value !== true) {
        throw new Error(`Step140-B orders api request builder contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.endpointContract.ordersApiVersion !== 'orders/v0' ||
    contract.endpointContract.listOrdersPathTemplate !== '/orders/v0/orders' ||
    contract.endpointContract.getOrderPathTemplate !== '/orders/v0/orders/{orderId}' ||
    contract.endpointContract.getOrderItemsPathTemplate !== '/orders/v0/orders/{orderId}/orderItems' ||
    contract.endpointContract.japanMarketplaceIdSupported !== 'A1VC38T7YXB528' ||
    contract.endpointContract.farEastEndpointSupported !== 'https://sellingpartnerapi-fe.amazon.com'
  ) {
    throw new Error('Step140-B orders api request builder contract violation: endpoint contract mismatch.');
  }

  if (
    contract.sampleRequestContract.expectedListOrdersMethod !== 'GET' ||
    contract.sampleRequestContract.expectedListOrdersPath !== '/orders/v0/orders' ||
    contract.sampleRequestContract.expectedListOrdersEndpoint !== 'https://sellingpartnerapi-fe.amazon.com' ||
    contract.sampleRequestContract.expectedQueryContainsMarketplaceIds !== true ||
    contract.sampleRequestContract.expectedQueryContainsCreatedAfter !== true ||
    contract.sampleRequestContract.expectedQueryContainsCreatedBefore !== true ||
    contract.sampleRequestContract.expectedQueryContainsOrderStatuses !== true ||
    contract.sampleRequestContract.expectedQueryContainsFulfillmentChannels !== true
  ) {
    throw new Error('Step140-B orders api request builder contract violation: sample request contract mismatch.');
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenNow)) {
    if (forbidden !== true) {
      throw new Error(`Step140-B orders api request builder contract violation: forbiddenNow.${key} must remain true.`);
    }
  }

  if (
    contract.summary.readyForOrdersApiRequestBuilderImplementation !== false ||
    contract.summary.readyForOrdersApiSignedRequestContract !== true ||
    contract.summary.readyForOrdersApiHttpClientImplementation !== false ||
    contract.summary.readyForOrdersApiRuntimeSmoke !== false ||
    contract.summary.readyForImportJobPersistence !== false ||
    contract.summary.readyForStagingRowPersistence !== false ||
    contract.summary.readyForTransactionCommit !== false ||
    contract.summary.readyForInventoryDeduction !== false ||
    contract.summary.readyForSettlementReconciliation !== false ||
    contract.summary.readyForBankReconciliation !== false
  ) {
    throw new Error('Step140-B orders api request builder contract violation: summary readiness mismatch.');
  }

  if (contract.sourceStep140A.summary.readyForOrdersApiRequestBuilderContract !== true) {
    throw new Error('Step140-B orders api request builder contract violation: Step140-A does not allow this contract.');
  }

  return contract;
}
