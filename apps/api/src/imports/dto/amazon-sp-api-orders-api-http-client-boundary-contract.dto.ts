import {
  assertAmazonSpApiOrdersApiSignedRequestBoundaryContract,
  buildAmazonSpApiOrdersApiSignedRequestBoundaryContract,
  type AmazonSpApiOrdersApiSignedRequestBoundaryContract,
} from './amazon-sp-api-orders-api-signed-request-boundary-contract.dto';

export const AMAZON_SP_API_ORDERS_API_HTTP_CLIENT_BOUNDARY_CONTRACT_VERSION =
  'amazon-sp-api-orders-api-http-client-boundary-contract-v1' as const;

export type AmazonSpApiOrdersApiHttpClientBoundaryContract = {
  version: typeof AMAZON_SP_API_ORDERS_API_HTTP_CLIENT_BOUNDARY_CONTRACT_VERSION;
  sourceStep140C: AmazonSpApiOrdersApiSignedRequestBoundaryContract;

  step: 'Step140-D';
  contractOnly: true;
  implementationNow: false;
  controllerRouteAddedNow: false;
  frontendRouteAddedNow: false;
  serviceMethodAddedNow: false;
  requestBuilderImplementationNow: false;
  signedRequestImplementationNow: false;
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

  httpClientBoundary: {
    purpose: 'design-amazon-sp-api-orders-api-http-client-boundary-contract-only';
    httpClientShapeDesignOnly: true;
    noNetworkExecution: true;
    noFetchExecution: true;
    noAxiosExecution: true;
    noGotExecution: true;
    noSigV4Execution: true;
    noAwsCredentialRead: true;
    noTokenRefreshExecution: true;
    noRestrictedDataTokenExecution: true;
    noDatabaseReadOrWrite: true;
    noImportExecution: true;
  };

  transportContract: {
    methodGetOnlyForOrdersRead: true;
    httpsOnlyRequired: true;
    sellingPartnerApiHostOnly: true;
    timeoutMsRequired: true;
    defaultTimeoutMs: 30000;
    connectTimeoutMsRequiredInFuture: true;
    responseBodySizeLimitRequiredInFuture: true;
    redirectsForbidden: true;
    proxySupportDeferred: true;
    keepAliveDeferred: true;
  };

  retryContract: {
    retryPolicyDesignOnly: true;
    maxAttemptsRequired: true;
    defaultMaxAttempts: 3;
    retryOn429Required: true;
    retryOn500Required: true;
    retryOn502Required: true;
    retryOn503Required: true;
    retryOn504Required: true;
    doNotRetry400: true;
    doNotRetry401: true;
    doNotRetry403: true;
    exponentialBackoffRequired: true;
    jitterRequired: true;
    retryAfterHeaderRespectedInFuture: true;
  };

  throttlingContract: {
    rateLimitHandlingRequired: true;
    xAmznRateLimitLimitHeaderCapturedSanitized: true;
    retryAfterHeaderCapturedSanitized: true;
    throttledStatusMappedToRetryableError: true;
    quotaExceededDoesNotWriteDatabase: true;
    throttlingMetricsDeferred: true;
  };

  responseContract: {
    requestIdRequired: true;
    statusCodeRequired: true;
    okBooleanRequired: true;
    sanitizedHeadersRequired: true;
    sanitizedBodyRequired: true;
    parsedJsonDesignOnly: true;
    amazonRequestIdHeaderCaptured: true;
    rateLimitHeaderCapturedSanitized: true;
    nextTokenMaskedInLogs: true;
    rawBodyForbiddenInLogs: true;
    rawHeadersForbiddenInLogs: true;
  };

  errorContract: {
    sanitizedErrorCodeRequired: true;
    sanitizedErrorMessageRequired: true;
    retryableBooleanRequired: true;
    timeoutErrorClassRequired: true;
    networkErrorClassRequired: true;
    throttlingErrorClassRequired: true;
    authErrorClassRequired: true;
    permissionErrorClassRequired: true;
    amazonErrorPayloadRedacted: true;
    rawStackTraceForbiddenInResponse: true;
  };

  securityContract: {
    authorizationHeaderMustBeMasked: true;
    xAmzAccessTokenMustBeMasked: true;
    awsAccessKeyIdMustBeMasked: true;
    awsSecretAccessKeyForbiddenAlways: true;
    refreshTokenForbiddenAlways: true;
    clientSecretForbiddenAlways: true;
    restrictedDataTokenForbiddenNow: true;
    buyerPiiForbiddenInLogs: true;
    shippingAddressForbiddenInLogs: true;
  };

  sampleHttpClientContract: {
    sampleMethod: 'GET';
    sampleEndpoint: 'https://sellingpartnerapi-fe.amazon.com';
    samplePath: '/orders/v0/orders';
    sampleMarketplaceId: 'A1VC38T7YXB528';
    sampleTimeoutMs: 30000;
    sampleMaxAttempts: 3;
    expectedNetworkExecutionNow: false;
    expectedSanitizedResponseOnly: true;
    expectedRawAmazonPayloadForbidden: true;
  };

  forbiddenNow: {
    controllerRoute: true;
    frontendPanel: true;
    serviceMethodImplementation: true;
    requestBuilderImplementation: true;
    signedRequestImplementation: true;
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
    readyForOrdersApiHttpClientImplementation: false;
    readyForOrdersApiSanitizedResponseParserContract: true;
    readyForOrdersApiRuntimeSmoke: false;
    readyForImportJobPersistence: false;
    readyForStagingRowPersistence: false;
    readyForTransactionCommit: false;
    readyForInventoryDeduction: false;
    readyForSettlementReconciliation: false;
    readyForBankReconciliation: false;
  };
};

export function buildAmazonSpApiOrdersApiHttpClientBoundaryContract(): AmazonSpApiOrdersApiHttpClientBoundaryContract {
  const sourceStep140C = assertAmazonSpApiOrdersApiSignedRequestBoundaryContract(
    buildAmazonSpApiOrdersApiSignedRequestBoundaryContract(),
  );

  return {
    version: AMAZON_SP_API_ORDERS_API_HTTP_CLIENT_BOUNDARY_CONTRACT_VERSION,
    sourceStep140C,

    step: 'Step140-D',
    contractOnly: true,
    implementationNow: false,
    controllerRouteAddedNow: false,
    frontendRouteAddedNow: false,
    serviceMethodAddedNow: false,
    requestBuilderImplementationNow: false,
    signedRequestImplementationNow: false,
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

    httpClientBoundary: {
      purpose: 'design-amazon-sp-api-orders-api-http-client-boundary-contract-only',
      httpClientShapeDesignOnly: true,
      noNetworkExecution: true,
      noFetchExecution: true,
      noAxiosExecution: true,
      noGotExecution: true,
      noSigV4Execution: true,
      noAwsCredentialRead: true,
      noTokenRefreshExecution: true,
      noRestrictedDataTokenExecution: true,
      noDatabaseReadOrWrite: true,
      noImportExecution: true,
    },

    transportContract: {
      methodGetOnlyForOrdersRead: true,
      httpsOnlyRequired: true,
      sellingPartnerApiHostOnly: true,
      timeoutMsRequired: true,
      defaultTimeoutMs: 30000,
      connectTimeoutMsRequiredInFuture: true,
      responseBodySizeLimitRequiredInFuture: true,
      redirectsForbidden: true,
      proxySupportDeferred: true,
      keepAliveDeferred: true,
    },

    retryContract: {
      retryPolicyDesignOnly: true,
      maxAttemptsRequired: true,
      defaultMaxAttempts: 3,
      retryOn429Required: true,
      retryOn500Required: true,
      retryOn502Required: true,
      retryOn503Required: true,
      retryOn504Required: true,
      doNotRetry400: true,
      doNotRetry401: true,
      doNotRetry403: true,
      exponentialBackoffRequired: true,
      jitterRequired: true,
      retryAfterHeaderRespectedInFuture: true,
    },

    throttlingContract: {
      rateLimitHandlingRequired: true,
      xAmznRateLimitLimitHeaderCapturedSanitized: true,
      retryAfterHeaderCapturedSanitized: true,
      throttledStatusMappedToRetryableError: true,
      quotaExceededDoesNotWriteDatabase: true,
      throttlingMetricsDeferred: true,
    },

    responseContract: {
      requestIdRequired: true,
      statusCodeRequired: true,
      okBooleanRequired: true,
      sanitizedHeadersRequired: true,
      sanitizedBodyRequired: true,
      parsedJsonDesignOnly: true,
      amazonRequestIdHeaderCaptured: true,
      rateLimitHeaderCapturedSanitized: true,
      nextTokenMaskedInLogs: true,
      rawBodyForbiddenInLogs: true,
      rawHeadersForbiddenInLogs: true,
    },

    errorContract: {
      sanitizedErrorCodeRequired: true,
      sanitizedErrorMessageRequired: true,
      retryableBooleanRequired: true,
      timeoutErrorClassRequired: true,
      networkErrorClassRequired: true,
      throttlingErrorClassRequired: true,
      authErrorClassRequired: true,
      permissionErrorClassRequired: true,
      amazonErrorPayloadRedacted: true,
      rawStackTraceForbiddenInResponse: true,
    },

    securityContract: {
      authorizationHeaderMustBeMasked: true,
      xAmzAccessTokenMustBeMasked: true,
      awsAccessKeyIdMustBeMasked: true,
      awsSecretAccessKeyForbiddenAlways: true,
      refreshTokenForbiddenAlways: true,
      clientSecretForbiddenAlways: true,
      restrictedDataTokenForbiddenNow: true,
      buyerPiiForbiddenInLogs: true,
      shippingAddressForbiddenInLogs: true,
    },

    sampleHttpClientContract: {
      sampleMethod: 'GET',
      sampleEndpoint: 'https://sellingpartnerapi-fe.amazon.com',
      samplePath: '/orders/v0/orders',
      sampleMarketplaceId: 'A1VC38T7YXB528',
      sampleTimeoutMs: 30000,
      sampleMaxAttempts: 3,
      expectedNetworkExecutionNow: false,
      expectedSanitizedResponseOnly: true,
      expectedRawAmazonPayloadForbidden: true,
    },

    forbiddenNow: {
      controllerRoute: true,
      frontendPanel: true,
      serviceMethodImplementation: true,
      requestBuilderImplementation: true,
      signedRequestImplementation: true,
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
      readyForOrdersApiHttpClientImplementation: false,
      readyForOrdersApiSanitizedResponseParserContract: true,
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

export function assertAmazonSpApiOrdersApiHttpClientBoundaryContract(
  contract: AmazonSpApiOrdersApiHttpClientBoundaryContract,
): AmazonSpApiOrdersApiHttpClientBoundaryContract {
  if (contract.version !== AMAZON_SP_API_ORDERS_API_HTTP_CLIENT_BOUNDARY_CONTRACT_VERSION) {
    throw new Error('Step140-D orders api http client boundary contract violation: version mismatch.');
  }

  assertAmazonSpApiOrdersApiSignedRequestBoundaryContract(contract.sourceStep140C);

  if (
    contract.step !== 'Step140-D' ||
    contract.contractOnly !== true ||
    contract.implementationNow !== false ||
    contract.controllerRouteAddedNow !== false ||
    contract.frontendRouteAddedNow !== false ||
    contract.serviceMethodAddedNow !== false ||
    contract.requestBuilderImplementationNow !== false ||
    contract.signedRequestImplementationNow !== false ||
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
    throw new Error('Step140-D orders api http client boundary contract violation: implementation boundary mismatch.');
  }

  if (contract.httpClientBoundary.purpose !== 'design-amazon-sp-api-orders-api-http-client-boundary-contract-only') {
    throw new Error('Step140-D orders api http client boundary contract violation: purpose mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    httpClientBoundary: contract.httpClientBoundary,
    throttlingContract: contract.throttlingContract,
    responseContract: contract.responseContract,
    errorContract: contract.errorContract,
    securityContract: contract.securityContract,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (key === 'purpose') continue;
      if (value !== true) {
        throw new Error(`Step140-D orders api http client boundary contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.transportContract.methodGetOnlyForOrdersRead !== true ||
    contract.transportContract.httpsOnlyRequired !== true ||
    contract.transportContract.sellingPartnerApiHostOnly !== true ||
    contract.transportContract.timeoutMsRequired !== true ||
    contract.transportContract.defaultTimeoutMs !== 30000 ||
    contract.transportContract.redirectsForbidden !== true
  ) {
    throw new Error('Step140-D orders api http client boundary contract violation: transport mismatch.');
  }

  if (
    contract.retryContract.retryPolicyDesignOnly !== true ||
    contract.retryContract.maxAttemptsRequired !== true ||
    contract.retryContract.defaultMaxAttempts !== 3 ||
    contract.retryContract.retryOn429Required !== true ||
    contract.retryContract.retryOn500Required !== true ||
    contract.retryContract.retryOn502Required !== true ||
    contract.retryContract.retryOn503Required !== true ||
    contract.retryContract.retryOn504Required !== true ||
    contract.retryContract.doNotRetry400 !== true ||
    contract.retryContract.doNotRetry401 !== true ||
    contract.retryContract.doNotRetry403 !== true ||
    contract.retryContract.exponentialBackoffRequired !== true ||
    contract.retryContract.jitterRequired !== true
  ) {
    throw new Error('Step140-D orders api http client boundary contract violation: retry mismatch.');
  }

  if (
    contract.sampleHttpClientContract.sampleMethod !== 'GET' ||
    contract.sampleHttpClientContract.sampleEndpoint !== 'https://sellingpartnerapi-fe.amazon.com' ||
    contract.sampleHttpClientContract.samplePath !== '/orders/v0/orders' ||
    contract.sampleHttpClientContract.sampleMarketplaceId !== 'A1VC38T7YXB528' ||
    contract.sampleHttpClientContract.sampleTimeoutMs !== 30000 ||
    contract.sampleHttpClientContract.sampleMaxAttempts !== 3 ||
    contract.sampleHttpClientContract.expectedNetworkExecutionNow !== false ||
    contract.sampleHttpClientContract.expectedSanitizedResponseOnly !== true ||
    contract.sampleHttpClientContract.expectedRawAmazonPayloadForbidden !== true
  ) {
    throw new Error('Step140-D orders api http client boundary contract violation: sample mismatch.');
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenNow)) {
    if (forbidden !== true) {
      throw new Error(`Step140-D orders api http client boundary contract violation: forbiddenNow.${key} must remain true.`);
    }
  }

  if (
    contract.summary.readyForOrdersApiHttpClientImplementation !== false ||
    contract.summary.readyForOrdersApiSanitizedResponseParserContract !== true ||
    contract.summary.readyForOrdersApiRuntimeSmoke !== false ||
    contract.summary.readyForImportJobPersistence !== false ||
    contract.summary.readyForStagingRowPersistence !== false ||
    contract.summary.readyForTransactionCommit !== false ||
    contract.summary.readyForInventoryDeduction !== false ||
    contract.summary.readyForSettlementReconciliation !== false ||
    contract.summary.readyForBankReconciliation !== false
  ) {
    throw new Error('Step140-D orders api http client boundary contract violation: summary readiness mismatch.');
  }

  if (contract.sourceStep140C.summary.readyForOrdersApiHttpClientContract !== true) {
    throw new Error('Step140-D orders api http client boundary contract violation: Step140-C does not allow this contract.');
  }

  return contract;
}
