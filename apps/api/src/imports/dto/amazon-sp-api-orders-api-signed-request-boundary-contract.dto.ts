import {
  assertAmazonSpApiOrdersApiRequestBuilderContract,
  buildAmazonSpApiOrdersApiRequestBuilderContract,
  type AmazonSpApiOrdersApiRequestBuilderContract,
} from './amazon-sp-api-orders-api-request-builder-contract.dto';

export const AMAZON_SP_API_ORDERS_API_SIGNED_REQUEST_BOUNDARY_CONTRACT_VERSION =
  'amazon-sp-api-orders-api-signed-request-boundary-contract-v1' as const;

export type AmazonSpApiOrdersApiSignedRequestBoundaryContract = {
  version: typeof AMAZON_SP_API_ORDERS_API_SIGNED_REQUEST_BOUNDARY_CONTRACT_VERSION;
  sourceStep140B: AmazonSpApiOrdersApiRequestBuilderContract;

  step: 'Step140-C';
  contractOnly: true;
  implementationNow: false;
  controllerRouteAddedNow: false;
  frontendRouteAddedNow: false;
  serviceMethodAddedNow: false;
  requestBuilderImplementationNow: false;
  signedRequestImplementationNow: false;
  httpClientAddedNow: false;
  realCryptoExecutionNow: false;
  awsCredentialReadNow: false;
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

  signedRequestBoundary: {
    purpose: 'design-amazon-sp-api-orders-api-signed-request-boundary-contract-only';
    canonicalRequestDesignOnly: true;
    stringToSignDesignOnly: true;
    signingKeyDerivationDesignOnly: true;
    authorizationHeaderDesignOnly: true;
    xAmzDateHeaderDesignOnly: true;
    xAmzAccessTokenHeaderDesignOnly: true;
    noCryptoExecution: true;
    noAwsCredentialRead: true;
    noNetworkExecution: true;
    noDatabaseReadOrWrite: true;
    noTokenRefreshExecution: true;
    noRestrictedDataTokenExecution: true;
  };

  sigV4ScopeContract: {
    algorithm: 'AWS4-HMAC-SHA256';
    service: 'execute-api';
    requestTerminator: 'aws4_request';
    regionFromEndpointRequired: true;
    dateStampRequired: true;
    credentialScopeRequired: true;
    unknownRegionRejectedInFuture: true;
    feEndpointUsesUsWest2RegionInFuture: true;
    naEndpointUsesUsEast1RegionInFuture: true;
    euEndpointUsesEuWest1RegionInFuture: true;
  };

  canonicalRequestShapeContract: {
    methodGetRequired: true;
    canonicalUriRequired: true;
    canonicalQueryStringRequired: true;
    canonicalHeadersRequired: true;
    signedHeadersRequired: true;
    payloadHashRequired: true;
    emptyPayloadHashRequiredForGet: true;
    queryStringMustBeSortedByKey: true;
    queryStringMustBePercentEncoded: true;
    headerNamesMustBeLowercase: true;
    headerValuesMustBeTrimmed: true;
    canonicalRequestMustNotBeLoggedRaw: true;
  };

  requiredHeadersContract: {
    hostHeaderRequired: true;
    userAgentHeaderRequired: true;
    xAmzAccessTokenHeaderRequired: true;
    xAmzDateHeaderRequired: true;
    authorizationHeaderRequiredAfterSigningFuture: true;
    contentTypeHeaderNotRequiredForGet: true;
    rawAccessTokenForbiddenInLogs: true;
    rawAuthorizationHeaderForbiddenInLogs: true;
    rawAwsAccessKeyForbiddenInLogs: true;
    rawAwsSecretKeyForbiddenAlways: true;
  };

  signingInputContract: {
    methodRequired: true;
    endpointRequired: true;
    pathRequired: true;
    queryRequired: true;
    headersRequired: true;
    amzDateRequired: true;
    dateStampRequired: true;
    regionRequired: true;
    serviceRequired: true;
    accessTokenRequiredInFutureButRedacted: true;
    awsAccessKeyIdRequiredInFutureButRedacted: true;
    awsSecretAccessKeyRequiredInFutureButNeverLogged: true;
    sessionTokenOptionalInFutureButRedacted: true;
  };

  signedOutputContract: {
    methodRequired: true;
    urlRequired: true;
    endpointRequired: true;
    pathRequired: true;
    canonicalQueryStringRequired: true;
    sanitizedHeadersRequired: true;
    signedHeadersListRequired: true;
    authorizationHeaderMaskedRequired: true;
    accessTokenMaskedRequired: true;
    requestIdRequired: true;
    debugCanonicalRequestHashOnly: true;
    debugStringToSignHashOnly: true;
    rawCanonicalRequestForbidden: true;
    rawStringToSignForbidden: true;
    rawAuthorizationHeaderForbidden: true;
  };

  sampleSignedRequestContract: {
    sampleRegion: 'FE';
    sampleSigV4Region: 'us-west-2';
    sampleEndpoint: 'https://sellingpartnerapi-fe.amazon.com';
    samplePath: '/orders/v0/orders';
    sampleMethod: 'GET';
    sampleMarketplaceId: 'A1VC38T7YXB528';
    sampleService: 'execute-api';
    sampleAlgorithm: 'AWS4-HMAC-SHA256';
    expectedSignedHeadersContainHost: true;
    expectedSignedHeadersContainUserAgent: true;
    expectedSignedHeadersContainXAmzAccessToken: true;
    expectedSignedHeadersContainXAmzDate: true;
    expectedAuthorizationHeaderMasked: true;
  };

  redactionContract: {
    rawAccessTokenForbidden: true;
    rawRefreshTokenForbidden: true;
    rawClientSecretForbidden: true;
    rawAwsAccessKeyIdForbiddenInLogs: true;
    rawAwsSecretAccessKeyForbiddenAlways: true;
    rawAwsSessionTokenForbiddenInLogs: true;
    rawAuthorizationHeaderForbidden: true;
    rawCanonicalRequestForbiddenInLogs: true;
    rawStringToSignForbiddenInLogs: true;
    rawSigningKeyForbiddenAlways: true;
    rawNextTokenForbiddenInLogs: true;
    rawAmazonResponseForbidden: true;
  };

  isolationContract: {
    companyIdRequired: true;
    storeIdRequired: true;
    marketplaceIdRequired: true;
    regionRequired: true;
    endpointRegionMustMatchStoreMarketplace: true;
    tokenMustBelongToSameCompanyStoreMarketplaceRegionInFuture: true;
    crossCompanySigningForbidden: true;
    crossStoreSigningForbidden: true;
    crossMarketplaceSigningForbidden: true;
    crossRegionSigningForbidden: true;
  };

  forbiddenNow: {
    controllerRoute: true;
    frontendPanel: true;
    serviceMethodImplementation: true;
    requestBuilderImplementation: true;
    signedRequestImplementation: true;
    httpClientImplementation: true;
    cryptoCreateHmac: true;
    cryptoCreateHash: true;
    awsSignatureV4LibraryCall: true;
    awsCredentialRead: true;
    accessTokenRefresh: true;
    restrictedDataTokenRequest: true;
    fetchCall: true;
    axiosCall: true;
    gotCall: true;
    realAmazonOrdersHttpCall: true;
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
    readyForOrdersApiSignedRequestImplementation: false;
    readyForOrdersApiHttpClientContract: true;
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

export function buildAmazonSpApiOrdersApiSignedRequestBoundaryContract(): AmazonSpApiOrdersApiSignedRequestBoundaryContract {
  const sourceStep140B = assertAmazonSpApiOrdersApiRequestBuilderContract(
    buildAmazonSpApiOrdersApiRequestBuilderContract(),
  );

  return {
    version: AMAZON_SP_API_ORDERS_API_SIGNED_REQUEST_BOUNDARY_CONTRACT_VERSION,
    sourceStep140B,

    step: 'Step140-C',
    contractOnly: true,
    implementationNow: false,
    controllerRouteAddedNow: false,
    frontendRouteAddedNow: false,
    serviceMethodAddedNow: false,
    requestBuilderImplementationNow: false,
    signedRequestImplementationNow: false,
    httpClientAddedNow: false,
    realCryptoExecutionNow: false,
    awsCredentialReadNow: false,
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

    signedRequestBoundary: {
      purpose: 'design-amazon-sp-api-orders-api-signed-request-boundary-contract-only',
      canonicalRequestDesignOnly: true,
      stringToSignDesignOnly: true,
      signingKeyDerivationDesignOnly: true,
      authorizationHeaderDesignOnly: true,
      xAmzDateHeaderDesignOnly: true,
      xAmzAccessTokenHeaderDesignOnly: true,
      noCryptoExecution: true,
      noAwsCredentialRead: true,
      noNetworkExecution: true,
      noDatabaseReadOrWrite: true,
      noTokenRefreshExecution: true,
      noRestrictedDataTokenExecution: true,
    },

    sigV4ScopeContract: {
      algorithm: 'AWS4-HMAC-SHA256',
      service: 'execute-api',
      requestTerminator: 'aws4_request',
      regionFromEndpointRequired: true,
      dateStampRequired: true,
      credentialScopeRequired: true,
      unknownRegionRejectedInFuture: true,
      feEndpointUsesUsWest2RegionInFuture: true,
      naEndpointUsesUsEast1RegionInFuture: true,
      euEndpointUsesEuWest1RegionInFuture: true,
    },

    canonicalRequestShapeContract: {
      methodGetRequired: true,
      canonicalUriRequired: true,
      canonicalQueryStringRequired: true,
      canonicalHeadersRequired: true,
      signedHeadersRequired: true,
      payloadHashRequired: true,
      emptyPayloadHashRequiredForGet: true,
      queryStringMustBeSortedByKey: true,
      queryStringMustBePercentEncoded: true,
      headerNamesMustBeLowercase: true,
      headerValuesMustBeTrimmed: true,
      canonicalRequestMustNotBeLoggedRaw: true,
    },

    requiredHeadersContract: {
      hostHeaderRequired: true,
      userAgentHeaderRequired: true,
      xAmzAccessTokenHeaderRequired: true,
      xAmzDateHeaderRequired: true,
      authorizationHeaderRequiredAfterSigningFuture: true,
      contentTypeHeaderNotRequiredForGet: true,
      rawAccessTokenForbiddenInLogs: true,
      rawAuthorizationHeaderForbiddenInLogs: true,
      rawAwsAccessKeyForbiddenInLogs: true,
      rawAwsSecretKeyForbiddenAlways: true,
    },

    signingInputContract: {
      methodRequired: true,
      endpointRequired: true,
      pathRequired: true,
      queryRequired: true,
      headersRequired: true,
      amzDateRequired: true,
      dateStampRequired: true,
      regionRequired: true,
      serviceRequired: true,
      accessTokenRequiredInFutureButRedacted: true,
      awsAccessKeyIdRequiredInFutureButRedacted: true,
      awsSecretAccessKeyRequiredInFutureButNeverLogged: true,
      sessionTokenOptionalInFutureButRedacted: true,
    },

    signedOutputContract: {
      methodRequired: true,
      urlRequired: true,
      endpointRequired: true,
      pathRequired: true,
      canonicalQueryStringRequired: true,
      sanitizedHeadersRequired: true,
      signedHeadersListRequired: true,
      authorizationHeaderMaskedRequired: true,
      accessTokenMaskedRequired: true,
      requestIdRequired: true,
      debugCanonicalRequestHashOnly: true,
      debugStringToSignHashOnly: true,
      rawCanonicalRequestForbidden: true,
      rawStringToSignForbidden: true,
      rawAuthorizationHeaderForbidden: true,
    },

    sampleSignedRequestContract: {
      sampleRegion: 'FE',
      sampleSigV4Region: 'us-west-2',
      sampleEndpoint: 'https://sellingpartnerapi-fe.amazon.com',
      samplePath: '/orders/v0/orders',
      sampleMethod: 'GET',
      sampleMarketplaceId: 'A1VC38T7YXB528',
      sampleService: 'execute-api',
      sampleAlgorithm: 'AWS4-HMAC-SHA256',
      expectedSignedHeadersContainHost: true,
      expectedSignedHeadersContainUserAgent: true,
      expectedSignedHeadersContainXAmzAccessToken: true,
      expectedSignedHeadersContainXAmzDate: true,
      expectedAuthorizationHeaderMasked: true,
    },

    redactionContract: {
      rawAccessTokenForbidden: true,
      rawRefreshTokenForbidden: true,
      rawClientSecretForbidden: true,
      rawAwsAccessKeyIdForbiddenInLogs: true,
      rawAwsSecretAccessKeyForbiddenAlways: true,
      rawAwsSessionTokenForbiddenInLogs: true,
      rawAuthorizationHeaderForbidden: true,
      rawCanonicalRequestForbiddenInLogs: true,
      rawStringToSignForbiddenInLogs: true,
      rawSigningKeyForbiddenAlways: true,
      rawNextTokenForbiddenInLogs: true,
      rawAmazonResponseForbidden: true,
    },

    isolationContract: {
      companyIdRequired: true,
      storeIdRequired: true,
      marketplaceIdRequired: true,
      regionRequired: true,
      endpointRegionMustMatchStoreMarketplace: true,
      tokenMustBelongToSameCompanyStoreMarketplaceRegionInFuture: true,
      crossCompanySigningForbidden: true,
      crossStoreSigningForbidden: true,
      crossMarketplaceSigningForbidden: true,
      crossRegionSigningForbidden: true,
    },

    forbiddenNow: {
      controllerRoute: true,
      frontendPanel: true,
      serviceMethodImplementation: true,
      requestBuilderImplementation: true,
      signedRequestImplementation: true,
      httpClientImplementation: true,
      cryptoCreateHmac: true,
      cryptoCreateHash: true,
      awsSignatureV4LibraryCall: true,
      awsCredentialRead: true,
      accessTokenRefresh: true,
      restrictedDataTokenRequest: true,
      fetchCall: true,
      axiosCall: true,
      gotCall: true,
      realAmazonOrdersHttpCall: true,
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
      readyForOrdersApiSignedRequestImplementation: false,
      readyForOrdersApiHttpClientContract: true,
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

export function assertAmazonSpApiOrdersApiSignedRequestBoundaryContract(
  contract: AmazonSpApiOrdersApiSignedRequestBoundaryContract,
): AmazonSpApiOrdersApiSignedRequestBoundaryContract {
  if (contract.version !== AMAZON_SP_API_ORDERS_API_SIGNED_REQUEST_BOUNDARY_CONTRACT_VERSION) {
    throw new Error('Step140-C orders api signed request boundary contract violation: version mismatch.');
  }

  assertAmazonSpApiOrdersApiRequestBuilderContract(contract.sourceStep140B);

  if (
    contract.step !== 'Step140-C' ||
    contract.contractOnly !== true ||
    contract.implementationNow !== false ||
    contract.controllerRouteAddedNow !== false ||
    contract.frontendRouteAddedNow !== false ||
    contract.serviceMethodAddedNow !== false ||
    contract.requestBuilderImplementationNow !== false ||
    contract.signedRequestImplementationNow !== false ||
    contract.httpClientAddedNow !== false ||
    contract.realCryptoExecutionNow !== false ||
    contract.awsCredentialReadNow !== false ||
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
    throw new Error('Step140-C orders api signed request boundary contract violation: implementation boundary mismatch.');
  }

  if (contract.signedRequestBoundary.purpose !== 'design-amazon-sp-api-orders-api-signed-request-boundary-contract-only') {
    throw new Error('Step140-C orders api signed request boundary contract violation: purpose mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    signedRequestBoundary: contract.signedRequestBoundary,
    canonicalRequestShapeContract: contract.canonicalRequestShapeContract,
    requiredHeadersContract: contract.requiredHeadersContract,
    signingInputContract: contract.signingInputContract,
    signedOutputContract: contract.signedOutputContract,
    redactionContract: contract.redactionContract,
    isolationContract: contract.isolationContract,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (key === 'purpose') continue;
      if (value !== true) {
        throw new Error(`Step140-C orders api signed request boundary contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.sigV4ScopeContract.algorithm !== 'AWS4-HMAC-SHA256' ||
    contract.sigV4ScopeContract.service !== 'execute-api' ||
    contract.sigV4ScopeContract.requestTerminator !== 'aws4_request' ||
    contract.sigV4ScopeContract.regionFromEndpointRequired !== true ||
    contract.sigV4ScopeContract.feEndpointUsesUsWest2RegionInFuture !== true
  ) {
    throw new Error('Step140-C orders api signed request boundary contract violation: SigV4 scope mismatch.');
  }

  if (
    contract.sampleSignedRequestContract.sampleRegion !== 'FE' ||
    contract.sampleSignedRequestContract.sampleSigV4Region !== 'us-west-2' ||
    contract.sampleSignedRequestContract.sampleEndpoint !== 'https://sellingpartnerapi-fe.amazon.com' ||
    contract.sampleSignedRequestContract.samplePath !== '/orders/v0/orders' ||
    contract.sampleSignedRequestContract.sampleMethod !== 'GET' ||
    contract.sampleSignedRequestContract.sampleMarketplaceId !== 'A1VC38T7YXB528' ||
    contract.sampleSignedRequestContract.sampleService !== 'execute-api' ||
    contract.sampleSignedRequestContract.sampleAlgorithm !== 'AWS4-HMAC-SHA256' ||
    contract.sampleSignedRequestContract.expectedSignedHeadersContainHost !== true ||
    contract.sampleSignedRequestContract.expectedSignedHeadersContainUserAgent !== true ||
    contract.sampleSignedRequestContract.expectedSignedHeadersContainXAmzAccessToken !== true ||
    contract.sampleSignedRequestContract.expectedSignedHeadersContainXAmzDate !== true ||
    contract.sampleSignedRequestContract.expectedAuthorizationHeaderMasked !== true
  ) {
    throw new Error('Step140-C orders api signed request boundary contract violation: sample signed request mismatch.');
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenNow)) {
    if (forbidden !== true) {
      throw new Error(`Step140-C orders api signed request boundary contract violation: forbiddenNow.${key} must remain true.`);
    }
  }

  if (
    contract.summary.readyForOrdersApiSignedRequestImplementation !== false ||
    contract.summary.readyForOrdersApiHttpClientContract !== true ||
    contract.summary.readyForOrdersApiHttpClientImplementation !== false ||
    contract.summary.readyForOrdersApiRuntimeSmoke !== false ||
    contract.summary.readyForImportJobPersistence !== false ||
    contract.summary.readyForStagingRowPersistence !== false ||
    contract.summary.readyForTransactionCommit !== false ||
    contract.summary.readyForInventoryDeduction !== false ||
    contract.summary.readyForSettlementReconciliation !== false ||
    contract.summary.readyForBankReconciliation !== false
  ) {
    throw new Error('Step140-C orders api signed request boundary contract violation: summary readiness mismatch.');
  }

  if (contract.sourceStep140B.summary.readyForOrdersApiSignedRequestContract !== true) {
    throw new Error('Step140-C orders api signed request boundary contract violation: Step140-B does not allow this contract.');
  }

  return contract;
}
