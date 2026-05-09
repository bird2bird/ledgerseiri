export type AmazonSpApiRealLwaTokenExchangeEnablementStep = 'Step136-A';

export type AmazonSpApiRealLwaTokenExchangeEnablementContract = {
  readonly source: 'amazon-sp-api-real-lwa-token-exchange-enablement-boundary-contract';
  readonly step: AmazonSpApiRealLwaTokenExchangeEnablementStep;
  readonly phase: 'contract-only';

  readonly currentCallbackExchangePath: 'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeDryRunnable';
  readonly futureRealExchangePath: 'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeWithLwaLater';
  readonly currentConfigValidator: 'AmazonSpApiLwaEnvConfigValidationService.validateFromProcessEnv';
  readonly currentDiagnosticEndpoint: '/api/imports/internal/amazon-sp-api/lwa-config/status';

  readonly realLwaExchangeEnabledNow: false;
  readonly callbackRuntimeChangedNow: false;
  readonly controllerRouteChangedNow: false;
  readonly tokenExchangeServiceRuntimeChangedNow: false;

  readonly enablementRequirements: {
    readonly configValidatorStatusMustBeReady: true;
    readonly clientIdMustBePresent: true;
    readonly clientSecretMustBePresent: true;
    readonly redirectUriMustBePresent: true;
    readonly marketplaceIdMustBeValid: true;
    readonly regionMustBeValid: true;
    readonly tokenEndpointMustBeHttps: true;
    readonly callbackStateMustBeValidatedBeforeExchange: true;
    readonly authorizationCodeMustBePresent: true;
    readonly sellingPartnerIdMustBePresent: true;
    readonly companyIdMustBeResolvedFromTrustedState: true;
    readonly storeIdMustBeResolvedFromTrustedState: true;
    readonly redirectUriMustMatchAuthorizationUrl: true;
  };

  readonly dualGatePolicy: {
    readonly requiresServerSideFeatureGate: true;
    readonly requiresReadyConfigValidator: true;
    readonly envFlagAloneIsNotEnough: true;
    readonly diagnosticEndpointIsReadOnly: true;
    readonly realHttpMustRemainDisabledInStep136A: true;
  };

  readonly plannedLwaHttpRequestShape: {
    readonly method: 'POST';
    readonly tokenEndpoint: 'https://api.amazon.com/auth/o2/token';
    readonly contentType: 'application/x-www-form-urlencoded';
    readonly grantType: 'authorization_code';
    readonly requiredFormFields: readonly [
      'grant_type',
      'code',
      'redirect_uri',
      'client_id',
      'client_secret',
    ];
    readonly authorizationHeaderUsed: false;
    readonly requestLoggedWithSecretRedaction: true;
    readonly responseLoggedWithTokenRedaction: true;
  };

  readonly plannedLwaHttpResponseShape: {
    readonly expectedRawFieldsFromLwa: readonly [
      'access_token',
      'refresh_token',
      'token_type',
      'expires_in',
    ];
    readonly allowedReturnedToController: readonly [
      'accepted',
      'status',
      'transportMode',
      'tokenExchangeHttpCallNow',
      'lwaHttpCallNow',
      'realSpApiRequestNow',
      'sanitizedTokenEnvelope',
      'refreshCredentialInput',
      'accessTokenCacheInput',
    ];
    readonly forbiddenReturnedToFrontend: readonly [
      'access_token',
      'refresh_token',
      'client_secret',
      'clientId',
      'clientSecret',
      'authorizationCode',
      'lwa_client_secret',
      'amazon_refresh_token',
    ];
  };

  readonly persistenceBoundary: {
    readonly plaintextRefreshTokenMayOnlyEnterEncryptionInput: true;
    readonly plaintextAccessTokenMayOnlyEnterEncryptionInput: true;
    readonly encryptedRefreshCredentialRequired: true;
    readonly encryptedAccessTokenCacheRequired: true;
    readonly plaintextTokenDatabaseWriteAllowed: false;
    readonly rawTokenLogAllowed: false;
    readonly rawTokenFrontendReturnAllowed: false;
  };

  readonly safetyFlagsNow: {
    readonly tokenExchangeHttpCallNow: false;
    readonly lwaHttpCallNow: false;
    readonly realSpApiRequestNow: false;
    readonly tokenPersistenceDatabaseWriteNow: false;
    readonly importJobWriteNow: false;
    readonly transactionWriteNow: false;
    readonly inventoryWriteNow: false;
    readonly reportsApiCallNow: false;
    readonly rawRefreshTokenReturnedNow: false;
    readonly rawAccessTokenReturnedNow: false;
    readonly rawClientSecretReturnedNow: false;
    readonly rawAuthorizationCodeReturnedNow: false;
  };

  readonly explicitNonGoals: {
    readonly implementsRealLwaHttpNow: false;
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

  readonly nextSuggestedStep: 'Step136-B';
};

export const amazonSpApiRealLwaTokenExchangeEnablementBoundaryContract: AmazonSpApiRealLwaTokenExchangeEnablementContract =
  {
    source: 'amazon-sp-api-real-lwa-token-exchange-enablement-boundary-contract',
    step: 'Step136-A',
    phase: 'contract-only',

    currentCallbackExchangePath:
      'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeDryRunnable',
    futureRealExchangePath:
      'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeWithLwaLater',
    currentConfigValidator:
      'AmazonSpApiLwaEnvConfigValidationService.validateFromProcessEnv',
    currentDiagnosticEndpoint:
      '/api/imports/internal/amazon-sp-api/lwa-config/status',

    realLwaExchangeEnabledNow: false,
    callbackRuntimeChangedNow: false,
    controllerRouteChangedNow: false,
    tokenExchangeServiceRuntimeChangedNow: false,

    enablementRequirements: {
      configValidatorStatusMustBeReady: true,
      clientIdMustBePresent: true,
      clientSecretMustBePresent: true,
      redirectUriMustBePresent: true,
      marketplaceIdMustBeValid: true,
      regionMustBeValid: true,
      tokenEndpointMustBeHttps: true,
      callbackStateMustBeValidatedBeforeExchange: true,
      authorizationCodeMustBePresent: true,
      sellingPartnerIdMustBePresent: true,
      companyIdMustBeResolvedFromTrustedState: true,
      storeIdMustBeResolvedFromTrustedState: true,
      redirectUriMustMatchAuthorizationUrl: true,
    },

    dualGatePolicy: {
      requiresServerSideFeatureGate: true,
      requiresReadyConfigValidator: true,
      envFlagAloneIsNotEnough: true,
      diagnosticEndpointIsReadOnly: true,
      realHttpMustRemainDisabledInStep136A: true,
    },

    plannedLwaHttpRequestShape: {
      method: 'POST',
      tokenEndpoint: 'https://api.amazon.com/auth/o2/token',
      contentType: 'application/x-www-form-urlencoded',
      grantType: 'authorization_code',
      requiredFormFields: [
        'grant_type',
        'code',
        'redirect_uri',
        'client_id',
        'client_secret',
      ],
      authorizationHeaderUsed: false,
      requestLoggedWithSecretRedaction: true,
      responseLoggedWithTokenRedaction: true,
    },

    plannedLwaHttpResponseShape: {
      expectedRawFieldsFromLwa: [
        'access_token',
        'refresh_token',
        'token_type',
        'expires_in',
      ],
      allowedReturnedToController: [
        'accepted',
        'status',
        'transportMode',
        'tokenExchangeHttpCallNow',
        'lwaHttpCallNow',
        'realSpApiRequestNow',
        'sanitizedTokenEnvelope',
        'refreshCredentialInput',
        'accessTokenCacheInput',
      ],
      forbiddenReturnedToFrontend: [
        'access_token',
        'refresh_token',
        'client_secret',
        'clientId',
        'clientSecret',
        'authorizationCode',
        'lwa_client_secret',
        'amazon_refresh_token',
      ],
    },

    persistenceBoundary: {
      plaintextRefreshTokenMayOnlyEnterEncryptionInput: true,
      plaintextAccessTokenMayOnlyEnterEncryptionInput: true,
      encryptedRefreshCredentialRequired: true,
      encryptedAccessTokenCacheRequired: true,
      plaintextTokenDatabaseWriteAllowed: false,
      rawTokenLogAllowed: false,
      rawTokenFrontendReturnAllowed: false,
    },

    safetyFlagsNow: {
      tokenExchangeHttpCallNow: false,
      lwaHttpCallNow: false,
      realSpApiRequestNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      importJobWriteNow: false,
      transactionWriteNow: false,
      inventoryWriteNow: false,
      reportsApiCallNow: false,
      rawRefreshTokenReturnedNow: false,
      rawAccessTokenReturnedNow: false,
      rawClientSecretReturnedNow: false,
      rawAuthorizationCodeReturnedNow: false,
    },

    explicitNonGoals: {
      implementsRealLwaHttpNow: false,
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

    nextSuggestedStep: 'Step136-B',
  };
