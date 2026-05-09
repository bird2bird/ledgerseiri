export type AmazonSpApiLwaHttpExecutionBoundaryStep = 'Step136-G';

export type AmazonSpApiLwaHttpExecutionBoundaryContract = {
  readonly source: 'amazon-sp-api-lwa-http-execution-boundary-contract';
  readonly step: AmazonSpApiLwaHttpExecutionBoundaryStep;
  readonly phase: 'contract-only';

  readonly currentRequestBodyBuilderPath: 'AmazonSpApiTokenExchangeService.buildRealLwaTokenExchangeRequestBodyLater';
  readonly currentHttpPreparationPath: 'AmazonSpApiTokenExchangeService.prepareRealLwaHttpExchangeRequestDisabled';
  readonly plannedHttpTransportPath: 'AmazonSpApiTokenExchangeService.executeRealLwaTokenExchangeHttpLater';
  readonly currentCallbackExchangePath: 'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeDryRunnable';

  readonly httpTransportImplementedNow: false;
  readonly httpExecutedNow: false;
  readonly callbackRuntimeChangedNow: false;
  readonly controllerRouteChangedNow: false;
  readonly tokenPersistenceChangedNow: false;

  readonly executionPreconditions: {
    readonly configValidatorStatusMustBeReady: true;
    readonly requestBodyBuilderMustBeReady: true;
    readonly rawBodyMayOnlyFlowFromBuilderToTransport: true;
    readonly serverSideFeatureGateMustBeEnabled: true;
    readonly envFlagAloneIsNotEnough: true;
    readonly tokenEndpointMustBeHttps: true;
    readonly redirectUriMustMatchAuthorizationUrl: true;
    readonly callbackStateMustBeValidatedBeforeHttp: true;
    readonly companyIdMustBeResolvedFromTrustedState: true;
    readonly storeIdMustBeResolvedFromTrustedState: true;
  };

  readonly plannedTransportShape: {
    readonly method: 'POST';
    readonly endpoint: 'https://api.amazon.com/auth/o2/token';
    readonly contentType: 'application/x-www-form-urlencoded';
    readonly timeoutMs: 10000;
    readonly retryPolicy: {
      readonly maxAttempts: 1;
      readonly retryNetworkErrorsNow: false;
      readonly retryLwa4xxNow: false;
      readonly retryLwa5xxNow: false;
      readonly idempotencyKeyUsedNow: false;
    };
    readonly allowedExecutableClientLater: 'node-fetch-or-undici-later';
    readonly executableClientUsedNow: false;
  };

  readonly requestRedactionPolicy: {
    readonly rawRequestBodyMayBeBuiltInsideTransport: true;
    readonly rawRequestBodyMayBeLogged: false;
    readonly rawRequestBodyMayBeReturnedToController: false;
    readonly rawRequestBodyMayBeReturnedToFrontend: false;
    readonly rawAuthorizationCodeMayBeLogged: false;
    readonly rawClientIdMayBeLogged: false;
    readonly rawClientSecretMayBeLogged: false;
    readonly sanitizedRequestShapeMayBeLogged: true;
  };

  readonly responseRedactionPolicy: {
    readonly rawLwaResponseMayBeParsedInsideTransport: true;
    readonly rawLwaResponseMayBeLogged: false;
    readonly rawAccessTokenMayBeLogged: false;
    readonly rawRefreshTokenMayBeLogged: false;
    readonly rawAccessTokenMayBeReturnedToController: false;
    readonly rawRefreshTokenMayBeReturnedToController: false;
    readonly rawAccessTokenMayBeReturnedToFrontend: false;
    readonly rawRefreshTokenMayBeReturnedToFrontend: false;
    readonly sanitizedResponseShapeMayBeReturned: true;
  };

  readonly expectedLwaSuccessFields: readonly [
    'access_token',
    'refresh_token',
    'token_type',
    'expires_in',
  ];

  readonly plannedSanitizedSuccessOutput: {
    readonly accepted: true;
    readonly source: 'amazon-sp-api-lwa-http-execution';
    readonly transportMode: 'real-lwa-http';
    readonly tokenExchangeHttpCallNow: true;
    readonly lwaHttpCallNow: true;
    readonly realSpApiRequestNow: false;
    readonly sanitizedTokenEnvelopeOnly: true;
    readonly refreshTokenPersistenceInputEncryptedLater: true;
    readonly accessTokenCacheInputEncryptedLater: true;
    readonly rawTokensReturnedNow: false;
  };

  readonly plannedSanitizedErrorOutput: {
    readonly accepted: false;
    readonly source: 'amazon-sp-api-lwa-http-execution';
    readonly errorCodeRedacted: true;
    readonly errorDescriptionRedacted: true;
    readonly rawErrorBodyLogged: false;
    readonly rawErrorBodyReturned: false;
    readonly rawRequestBodyReturned: false;
    readonly noTokenPersistenceOnFailure: true;
  };

  readonly persistenceBoundary: {
    readonly tokenPersistenceDatabaseWriteNow: false;
    readonly plaintextRefreshTokenMayOnlyEnterEncryptionInputLater: true;
    readonly plaintextAccessTokenMayOnlyEnterEncryptionInputLater: true;
    readonly encryptedRefreshCredentialRequiredLater: true;
    readonly encryptedAccessTokenCacheRequiredLater: true;
    readonly plaintextTokenDatabaseWriteAllowed: false;
  };

  readonly safetyFlagsNow: {
    readonly httpTransportImplementedNow: false;
    readonly requestBodyConstructedNow: false;
    readonly requestBodyLoggedNow: false;
    readonly tokenExchangeHttpCallNow: false;
    readonly lwaHttpCallNow: false;
    readonly realSpApiRequestNow: false;
    readonly tokenPersistenceDatabaseWriteNow: false;
    readonly reportsApiCallNow: false;
    readonly importJobWriteNow: false;
    readonly transactionWriteNow: false;
    readonly inventoryWriteNow: false;
    readonly rawAuthorizationCodeReturnedNow: false;
    readonly rawClientIdReturnedNow: false;
    readonly rawClientSecretReturnedNow: false;
    readonly rawRequestBodyReturnedNow: false;
    readonly rawAccessTokenReturnedNow: false;
    readonly rawRefreshTokenReturnedNow: false;
  };

  readonly explicitNonGoals: {
    readonly implementsHttpTransportNow: false;
    readonly usesFetchNow: false;
    readonly usesAxiosNow: false;
    readonly usesHttpRequestNow: false;
    readonly sendsLwaHttpNow: false;
    readonly wiresCallbackToRealLwaNow: false;
    readonly changesOAuthCallbackRouteNow: false;
    readonly changesTokenPersistenceNow: false;
    readonly enablesReportsApiNow: false;
    readonly createsImportJobNow: false;
    readonly createsImportStagingRowNow: false;
    readonly createsTransactionNow: false;
    readonly createsInventoryMovementNow: false;
    readonly changesFrontendNow: false;
  };

  readonly nextSuggestedStep: 'Step136-H';
};

export const amazonSpApiLwaHttpExecutionBoundaryContract: AmazonSpApiLwaHttpExecutionBoundaryContract =
  {
    source: 'amazon-sp-api-lwa-http-execution-boundary-contract',
    step: 'Step136-G',
    phase: 'contract-only',

    currentRequestBodyBuilderPath:
      'AmazonSpApiTokenExchangeService.buildRealLwaTokenExchangeRequestBodyLater',
    currentHttpPreparationPath:
      'AmazonSpApiTokenExchangeService.prepareRealLwaHttpExchangeRequestDisabled',
    plannedHttpTransportPath:
      'AmazonSpApiTokenExchangeService.executeRealLwaTokenExchangeHttpLater',
    currentCallbackExchangePath:
      'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeDryRunnable',

    httpTransportImplementedNow: false,
    httpExecutedNow: false,
    callbackRuntimeChangedNow: false,
    controllerRouteChangedNow: false,
    tokenPersistenceChangedNow: false,

    executionPreconditions: {
      configValidatorStatusMustBeReady: true,
      requestBodyBuilderMustBeReady: true,
      rawBodyMayOnlyFlowFromBuilderToTransport: true,
      serverSideFeatureGateMustBeEnabled: true,
      envFlagAloneIsNotEnough: true,
      tokenEndpointMustBeHttps: true,
      redirectUriMustMatchAuthorizationUrl: true,
      callbackStateMustBeValidatedBeforeHttp: true,
      companyIdMustBeResolvedFromTrustedState: true,
      storeIdMustBeResolvedFromTrustedState: true,
    },

    plannedTransportShape: {
      method: 'POST',
      endpoint: 'https://api.amazon.com/auth/o2/token',
      contentType: 'application/x-www-form-urlencoded',
      timeoutMs: 10000,
      retryPolicy: {
        maxAttempts: 1,
        retryNetworkErrorsNow: false,
        retryLwa4xxNow: false,
        retryLwa5xxNow: false,
        idempotencyKeyUsedNow: false,
      },
      allowedExecutableClientLater: 'node-fetch-or-undici-later',
      executableClientUsedNow: false,
    },

    requestRedactionPolicy: {
      rawRequestBodyMayBeBuiltInsideTransport: true,
      rawRequestBodyMayBeLogged: false,
      rawRequestBodyMayBeReturnedToController: false,
      rawRequestBodyMayBeReturnedToFrontend: false,
      rawAuthorizationCodeMayBeLogged: false,
      rawClientIdMayBeLogged: false,
      rawClientSecretMayBeLogged: false,
      sanitizedRequestShapeMayBeLogged: true,
    },

    responseRedactionPolicy: {
      rawLwaResponseMayBeParsedInsideTransport: true,
      rawLwaResponseMayBeLogged: false,
      rawAccessTokenMayBeLogged: false,
      rawRefreshTokenMayBeLogged: false,
      rawAccessTokenMayBeReturnedToController: false,
      rawRefreshTokenMayBeReturnedToController: false,
      rawAccessTokenMayBeReturnedToFrontend: false,
      rawRefreshTokenMayBeReturnedToFrontend: false,
      sanitizedResponseShapeMayBeReturned: true,
    },

    expectedLwaSuccessFields: [
      'access_token',
      'refresh_token',
      'token_type',
      'expires_in',
    ],

    plannedSanitizedSuccessOutput: {
      accepted: true,
      source: 'amazon-sp-api-lwa-http-execution',
      transportMode: 'real-lwa-http',
      tokenExchangeHttpCallNow: true,
      lwaHttpCallNow: true,
      realSpApiRequestNow: false,
      sanitizedTokenEnvelopeOnly: true,
      refreshTokenPersistenceInputEncryptedLater: true,
      accessTokenCacheInputEncryptedLater: true,
      rawTokensReturnedNow: false,
    },

    plannedSanitizedErrorOutput: {
      accepted: false,
      source: 'amazon-sp-api-lwa-http-execution',
      errorCodeRedacted: true,
      errorDescriptionRedacted: true,
      rawErrorBodyLogged: false,
      rawErrorBodyReturned: false,
      rawRequestBodyReturned: false,
      noTokenPersistenceOnFailure: true,
    },

    persistenceBoundary: {
      tokenPersistenceDatabaseWriteNow: false,
      plaintextRefreshTokenMayOnlyEnterEncryptionInputLater: true,
      plaintextAccessTokenMayOnlyEnterEncryptionInputLater: true,
      encryptedRefreshCredentialRequiredLater: true,
      encryptedAccessTokenCacheRequiredLater: true,
      plaintextTokenDatabaseWriteAllowed: false,
    },

    safetyFlagsNow: {
      httpTransportImplementedNow: false,
      requestBodyConstructedNow: false,
      requestBodyLoggedNow: false,
      tokenExchangeHttpCallNow: false,
      lwaHttpCallNow: false,
      realSpApiRequestNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      reportsApiCallNow: false,
      importJobWriteNow: false,
      transactionWriteNow: false,
      inventoryWriteNow: false,
      rawAuthorizationCodeReturnedNow: false,
      rawClientIdReturnedNow: false,
      rawClientSecretReturnedNow: false,
      rawRequestBodyReturnedNow: false,
      rawAccessTokenReturnedNow: false,
      rawRefreshTokenReturnedNow: false,
    },

    explicitNonGoals: {
      implementsHttpTransportNow: false,
      usesFetchNow: false,
      usesAxiosNow: false,
      usesHttpRequestNow: false,
      sendsLwaHttpNow: false,
      wiresCallbackToRealLwaNow: false,
      changesOAuthCallbackRouteNow: false,
      changesTokenPersistenceNow: false,
      enablesReportsApiNow: false,
      createsImportJobNow: false,
      createsImportStagingRowNow: false,
      createsTransactionNow: false,
      createsInventoryMovementNow: false,
      changesFrontendNow: false,
    },

    nextSuggestedStep: 'Step136-H',
  };
