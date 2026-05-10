export type AmazonSpApiConnectionStatusRealReadModelContractStep =
  'Step139-Y1';

export type AmazonSpApiConnectionStatusRealReadModelStatus =
  | 'disconnected'
  | 'connected'
  | 'needs_reauth'
  | 'error';

export type AmazonSpApiConnectionStatusRealReadModelContract = {
  readonly source: 'amazon-sp-api-connection-status-real-read-model-contract';
  readonly step: AmazonSpApiConnectionStatusRealReadModelContractStep;
  readonly phase: 'connection-status-real-read-model-contract-only';

  readonly previousControllerRealDbE2eStep: 'Step139-X';
  readonly previousControllerBranchCoverageStep: 'Step139-W';
  readonly previousControllerSchemaAwareSwitchStep: 'Step139-V9';

  readonly currentRuntimeStateNow: {
    readonly endpointAlreadyImplementedNow: true;
    readonly endpointRoute: '/api/imports/amazon-sp-api/connection/status';
    readonly endpointGuardedByJwtNow: true;
    readonly controllerMethodName: 'amazonSpApiConnectionStatusBackendEndpoint';
    readonly serviceMethodName: 'readConnectionStatus';
    readonly repositoryMethodName: 'readConnectionStatus';
    readonly repositoryCurrentlyReadsConnectionOnlyNow: true;
    readonly repositoryDoesNotIncludeCredentialYetNow: true;
    readonly repositoryDoesNotIncludeAccessTokenCacheYetNow: true;
    readonly responseDoesNotExposeCredentialPresenceYetNow: true;
    readonly responseDoesNotExposeAccessTokenCachePresenceYetNow: true;
  };

  readonly currentScopeNow: {
    readonly defineReadModelContractOnlyNow: true;
    readonly modifyControllerRuntimeNow: false;
    readonly modifyServiceRuntimeNow: false;
    readonly modifyRepositoryRuntimeNow: false;
    readonly modifyPrismaSchemaNow: false;
    readonly modifyFrontendNow: false;
    readonly writeDatabaseNow: false;
    readonly callAmazonNetworkNow: false;
  };

  readonly proposedRealReadModelPlanLater: {
    readonly proposedNextStep: 'Step139-Y2';
    readonly includeAmazonSpApiConnection: true;
    readonly includeAmazonSpApiCredential: true;
    readonly includeAmazonSpApiAccessTokenCache: true;
    readonly exposeCredentialPresentBoolean: true;
    readonly exposeAccessTokenCachePresentBoolean: true;
    readonly exposeAccessTokenExpiresAt: true;
    readonly exposeAccessTokenExpiredBoolean: true;
    readonly neverExposeEncryptedRefreshToken: true;
    readonly neverExposeEncryptedAccessToken: true;
    readonly neverExposeRawTokenOrAuthorizationCode: true;
    readonly neverCallAmazonNetworkFromStatusEndpoint: true;
  };

  readonly futureRepositoryReadShapeLater: {
    readonly connection: {
      readonly id: 'string';
      readonly companyId: 'string';
      readonly storeId: 'string';
      readonly marketplaceId: 'string';
      readonly region: 'string';
      readonly sellingPartnerId: 'string';
      readonly appId: 'string';
      readonly status: 'CONNECTED-or-REVOKED-or-ERROR-or-string';
      readonly connectedAt: 'Date-or-null';
      readonly revokedAt: 'Date-or-null';
      readonly lastTokenRefreshAt: 'Date-or-null';
      readonly lastHealthCheckAt: 'Date-or-null';
      readonly lastSyncAt: 'Date-or-null';
      readonly lastErrorCode: 'string-or-null';
      readonly lastErrorMessageRedacted: 'string-or-null';
    } | null;
    readonly credential: {
      readonly id: 'string';
      readonly connectionId: 'string';
      readonly encryptionKeyId: 'string';
      readonly encryptionAlgorithm: 'string';
      readonly tokenVersion: 'number';
      readonly rotatedAt: 'Date-or-null';
      readonly revokedAt: 'Date-or-null';
    } | null;
    readonly accessTokenCache: {
      readonly id: 'string';
      readonly connectionId: 'string';
      readonly tokenType: 'string';
      readonly scope: 'string-or-null';
      readonly expiresAt: 'Date';
    } | null;
  };

  readonly futureEndpointResponseShapeLater: {
    readonly source: 'amazon-sp-api-connection-status';
    readonly routeImplementedNow: true;
    readonly readModelMode: 'real-db-connection-credential-cache';
    readonly status: AmazonSpApiConnectionStatusRealReadModelStatus;
    readonly connected: 'boolean';
    readonly needsReconnect: 'boolean';
    readonly credentialPresent: 'boolean';
    readonly accessTokenCachePresent: 'boolean';
    readonly accessTokenExpired: 'boolean';
    readonly marketplaceId: 'string';
    readonly region: 'string';
    readonly storeId: 'string';
    readonly sellingPartnerIdRedacted: 'string-or-null';
    readonly connectedAt: 'iso-string-or-null';
    readonly revokedAt: 'iso-string-or-null';
    readonly lastTokenRefreshAt: 'iso-string-or-null';
    readonly lastHealthCheckAt: 'iso-string-or-null';
    readonly lastSyncAt: 'iso-string-or-null';
    readonly lastErrorCode: 'string-or-null';
    readonly lastErrorMessageRedacted: 'string-or-null';
    readonly accessTokenExpiresAt: 'iso-string-or-null';
    readonly credentialRotatedAt: 'iso-string-or-null';
    readonly credentialRevokedAt: 'iso-string-or-null';
    readonly tokenExchangeHttpCallNow: false;
    readonly tokenPersistenceDatabaseWriteNow: false;
    readonly realSpApiRequestNow: false;
    readonly importJobWriteNow: false;
    readonly transactionWriteNow: false;
    readonly inventoryWriteNow: false;
    readonly rawAuthorizationCodeReturnedNow: false;
    readonly rawLwaResponseReturnedNow: false;
    readonly rawAccessTokenReturnedNow: false;
    readonly rawRefreshTokenReturnedNow: false;
    readonly encryptedRefreshTokenReturnedNow: false;
    readonly encryptedAccessTokenReturnedNow: false;
  };

  readonly futureStatusMappingRulesLater: {
    readonly noConnection: 'disconnected';
    readonly connectionConnectedAndCredentialPresent: 'connected';
    readonly connectionConnectedButCredentialMissing: 'needs_reauth';
    readonly connectionConnectedButCredentialRevoked: 'needs_reauth';
    readonly connectionRevokedOrRevokedAtPresent: 'needs_reauth';
    readonly connectionHasLastError: 'error';
    readonly connectionStatusError: 'error';
    readonly accessTokenCacheMissingDoesNotForceReconnect: true;
    readonly accessTokenCacheExpiredDoesNotForceReconnect: true;
    readonly accessTokenCacheMissingOrExpiredOnlySetsPresenceAndExpiredFlags: true;
  };

  readonly requiredRegressionSmokesBeforeImplementation: readonly [
    'smoke:amazon-sp-api-connection-status-real-read-model-contract',
    'smoke:amazon-sp-api-oauth-callback-controller-real-db-e2e',
    'smoke:amazon-sp-api-oauth-callback-schema-aware-controller-branch-runtime',
    'smoke:amazon-sp-api-token-persistence-orchestrator-schema-aware-real-db'
  ];

  readonly forbiddenNowAndLater: {
    readonly statusEndpointCallsAmazonNetwork: false;
    readonly statusEndpointWritesDatabase: false;
    readonly statusEndpointCreatesImportJob: false;
    readonly statusEndpointCreatesTransaction: false;
    readonly statusEndpointCreatesInventoryMovement: false;
    readonly statusEndpointReturnsEncryptedRefreshToken: false;
    readonly statusEndpointReturnsEncryptedAccessToken: false;
    readonly statusEndpointReturnsRawAuthorizationCode: false;
    readonly statusEndpointReturnsRawLwaResponse: false;
    readonly statusEndpointReturnsRawAccessToken: false;
    readonly statusEndpointReturnsRawRefreshToken: false;
  };

  readonly allowedNextStepBoundary: {
    readonly proposedNextStep: 'Step139-Y2';
    readonly proposedNextStepGoal: 'implement real DB connection status read-model with credential and access token cache presence';
    readonly controllerRuntimeChangeAllowedNext: true;
    readonly serviceRuntimeChangeAllowedNext: true;
    readonly repositoryRuntimeChangeAllowedNext: true;
    readonly prismaSchemaChangeAllowedNext: false;
    readonly frontendChangeAllowedNext: false;
    readonly amazonNetworkChangeAllowedNext: false;
  };

  readonly nextSuggestedStep: 'Step139-Y2';
  readonly nextSuggestedStepGoal: 'Implement Amazon SP-API connection status real DB read-model';
};

export const amazonSpApiConnectionStatusRealReadModelContract: AmazonSpApiConnectionStatusRealReadModelContract =
  {
    source: 'amazon-sp-api-connection-status-real-read-model-contract',
    step: 'Step139-Y1',
    phase: 'connection-status-real-read-model-contract-only',

    previousControllerRealDbE2eStep: 'Step139-X',
    previousControllerBranchCoverageStep: 'Step139-W',
    previousControllerSchemaAwareSwitchStep: 'Step139-V9',

    currentRuntimeStateNow: {
      endpointAlreadyImplementedNow: true,
      endpointRoute: '/api/imports/amazon-sp-api/connection/status',
      endpointGuardedByJwtNow: true,
      controllerMethodName: 'amazonSpApiConnectionStatusBackendEndpoint',
      serviceMethodName: 'readConnectionStatus',
      repositoryMethodName: 'readConnectionStatus',
      repositoryCurrentlyReadsConnectionOnlyNow: true,
      repositoryDoesNotIncludeCredentialYetNow: true,
      repositoryDoesNotIncludeAccessTokenCacheYetNow: true,
      responseDoesNotExposeCredentialPresenceYetNow: true,
      responseDoesNotExposeAccessTokenCachePresenceYetNow: true,
    },

    currentScopeNow: {
      defineReadModelContractOnlyNow: true,
      modifyControllerRuntimeNow: false,
      modifyServiceRuntimeNow: false,
      modifyRepositoryRuntimeNow: false,
      modifyPrismaSchemaNow: false,
      modifyFrontendNow: false,
      writeDatabaseNow: false,
      callAmazonNetworkNow: false,
    },

    proposedRealReadModelPlanLater: {
      proposedNextStep: 'Step139-Y2',
      includeAmazonSpApiConnection: true,
      includeAmazonSpApiCredential: true,
      includeAmazonSpApiAccessTokenCache: true,
      exposeCredentialPresentBoolean: true,
      exposeAccessTokenCachePresentBoolean: true,
      exposeAccessTokenExpiresAt: true,
      exposeAccessTokenExpiredBoolean: true,
      neverExposeEncryptedRefreshToken: true,
      neverExposeEncryptedAccessToken: true,
      neverExposeRawTokenOrAuthorizationCode: true,
      neverCallAmazonNetworkFromStatusEndpoint: true,
    },

    futureRepositoryReadShapeLater: {
      connection: {
        id: 'string',
        companyId: 'string',
        storeId: 'string',
        marketplaceId: 'string',
        region: 'string',
        sellingPartnerId: 'string',
        appId: 'string',
        status: 'CONNECTED-or-REVOKED-or-ERROR-or-string',
        connectedAt: 'Date-or-null',
        revokedAt: 'Date-or-null',
        lastTokenRefreshAt: 'Date-or-null',
        lastHealthCheckAt: 'Date-or-null',
        lastSyncAt: 'Date-or-null',
        lastErrorCode: 'string-or-null',
        lastErrorMessageRedacted: 'string-or-null',
      },
      credential: {
        id: 'string',
        connectionId: 'string',
        encryptionKeyId: 'string',
        encryptionAlgorithm: 'string',
        tokenVersion: 'number',
        rotatedAt: 'Date-or-null',
        revokedAt: 'Date-or-null',
      },
      accessTokenCache: {
        id: 'string',
        connectionId: 'string',
        tokenType: 'string',
        scope: 'string-or-null',
        expiresAt: 'Date',
      },
    },

    futureEndpointResponseShapeLater: {
      source: 'amazon-sp-api-connection-status',
      routeImplementedNow: true,
      readModelMode: 'real-db-connection-credential-cache',
      status: 'connected',
      connected: 'boolean',
      needsReconnect: 'boolean',
      credentialPresent: 'boolean',
      accessTokenCachePresent: 'boolean',
      accessTokenExpired: 'boolean',
      marketplaceId: 'string',
      region: 'string',
      storeId: 'string',
      sellingPartnerIdRedacted: 'string-or-null',
      connectedAt: 'iso-string-or-null',
      revokedAt: 'iso-string-or-null',
      lastTokenRefreshAt: 'iso-string-or-null',
      lastHealthCheckAt: 'iso-string-or-null',
      lastSyncAt: 'iso-string-or-null',
      lastErrorCode: 'string-or-null',
      lastErrorMessageRedacted: 'string-or-null',
      accessTokenExpiresAt: 'iso-string-or-null',
      credentialRotatedAt: 'iso-string-or-null',
      credentialRevokedAt: 'iso-string-or-null',
      tokenExchangeHttpCallNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      realSpApiRequestNow: false,
      importJobWriteNow: false,
      transactionWriteNow: false,
      inventoryWriteNow: false,
      rawAuthorizationCodeReturnedNow: false,
      rawLwaResponseReturnedNow: false,
      rawAccessTokenReturnedNow: false,
      rawRefreshTokenReturnedNow: false,
      encryptedRefreshTokenReturnedNow: false,
      encryptedAccessTokenReturnedNow: false,
    },

    futureStatusMappingRulesLater: {
      noConnection: 'disconnected',
      connectionConnectedAndCredentialPresent: 'connected',
      connectionConnectedButCredentialMissing: 'needs_reauth',
      connectionConnectedButCredentialRevoked: 'needs_reauth',
      connectionRevokedOrRevokedAtPresent: 'needs_reauth',
      connectionHasLastError: 'error',
      connectionStatusError: 'error',
      accessTokenCacheMissingDoesNotForceReconnect: true,
      accessTokenCacheExpiredDoesNotForceReconnect: true,
      accessTokenCacheMissingOrExpiredOnlySetsPresenceAndExpiredFlags: true,
    },

    requiredRegressionSmokesBeforeImplementation: [
      'smoke:amazon-sp-api-connection-status-real-read-model-contract',
      'smoke:amazon-sp-api-oauth-callback-controller-real-db-e2e',
      'smoke:amazon-sp-api-oauth-callback-schema-aware-controller-branch-runtime',
      'smoke:amazon-sp-api-token-persistence-orchestrator-schema-aware-real-db',
    ],

    forbiddenNowAndLater: {
      statusEndpointCallsAmazonNetwork: false,
      statusEndpointWritesDatabase: false,
      statusEndpointCreatesImportJob: false,
      statusEndpointCreatesTransaction: false,
      statusEndpointCreatesInventoryMovement: false,
      statusEndpointReturnsEncryptedRefreshToken: false,
      statusEndpointReturnsEncryptedAccessToken: false,
      statusEndpointReturnsRawAuthorizationCode: false,
      statusEndpointReturnsRawLwaResponse: false,
      statusEndpointReturnsRawAccessToken: false,
      statusEndpointReturnsRawRefreshToken: false,
    },

    allowedNextStepBoundary: {
      proposedNextStep: 'Step139-Y2',
      proposedNextStepGoal:
        'implement real DB connection status read-model with credential and access token cache presence',
      controllerRuntimeChangeAllowedNext: true,
      serviceRuntimeChangeAllowedNext: true,
      repositoryRuntimeChangeAllowedNext: true,
      prismaSchemaChangeAllowedNext: false,
      frontendChangeAllowedNext: false,
      amazonNetworkChangeAllowedNext: false,
    },

    nextSuggestedStep: 'Step139-Y2',
    nextSuggestedStepGoal:
      'Implement Amazon SP-API connection status real DB read-model',
  };
