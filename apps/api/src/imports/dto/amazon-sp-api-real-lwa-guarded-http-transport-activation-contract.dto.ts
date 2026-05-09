export type AmazonSpApiRealLwaGuardedHttpTransportActivationStep = 'Step137-H';

export type AmazonSpApiRealLwaGuardedHttpTransportActivationContract = {
  readonly source: 'amazon-sp-api-real-lwa-guarded-http-transport-activation-contract';
  readonly step: AmazonSpApiRealLwaGuardedHttpTransportActivationStep;
  readonly phase: 'contract-only';

  readonly currentHttpTransportPath: 'AmazonSpApiTokenExchangeService.executeRealLwaTokenExchangeHttpLater';
  readonly currentActivationGatePath: 'AmazonSpApiRealLwaActivationGateService.evaluateRealLwaActivationLater';
  readonly currentDiagnosticEndpoint: '/api/imports/internal/amazon-sp-api/lwa-activation-gate/status';
  readonly currentOAuthCallbackPath: 'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeDryRunnable';
  readonly plannedGuardedTransportPath: 'AmazonSpApiTokenExchangeService.executeRealLwaTokenExchangeHttpGuardedLater';

  readonly guardedHttpTransportImplementedNow: false;
  readonly existingHttpTransportChangedNow: false;
  readonly oauthCallbackRouteChangedNow: false;
  readonly diagnosticEndpointChangedNow: false;
  readonly realHttpEnabledNow: false;
  readonly tokenPersistenceChangedNow: false;

  readonly requiredPreconditionsForFutureRealHttp: {
    readonly activationGateDecisionMustAllowRealHttp: true;
    readonly configValidatorStatusMustBeReady: true;
    readonly tokenEndpointMustBeHttps: true;
    readonly requestBodyBuilderMustBeReady: true;
    readonly requestBodyFingerprintRequired: true;
    readonly requestBodyLengthMustBePositive: true;
    readonly contentTypeMustBeFormUrlEncoded: true;
    readonly methodMustBePost: true;
    readonly callbackStateMustBeTrusted: true;
    readonly companyIdMustBeResolvedFromTrustedState: true;
    readonly storeIdMustBeResolvedFromTrustedState: true;
    readonly marketplaceIdMustBeResolved: true;
    readonly regionMustBeResolved: true;
    readonly environmentMustAllowRealLwaHttp: true;
    readonly companyStoreAllowlistRequired: true;
    readonly explicitOperatorConfirmationRequired: true;
    readonly dryRunMustBeFalseOnlyInLaterActivationStep: true;
  };

  readonly forbiddenShortcuts: {
    readonly envFlagAloneEnablesHttp: false;
    readonly diagnosticEndpointCanEnableHttp: false;
    readonly frontendCanEnableHttp: false;
    readonly queryParamCanEnableHttp: false;
    readonly callbackParamCanEnableHttp: false;
    readonly missingTrustedStateCanEnableHttp: false;
    readonly missingAllowlistCanEnableHttp: false;
    readonly missingOperatorConfirmationCanEnableHttp: false;
  };

  readonly futureTransportPolicy: {
    readonly method: 'POST';
    readonly tokenEndpointDefault: 'https://api.amazon.com/auth/o2/token';
    readonly contentType: 'application/x-www-form-urlencoded';
    readonly timeoutMs: 10000;
    readonly retryInitiallyAllowed: false;
    readonly maxResponseBytes: 32768;
    readonly allowedHttpClientLater: 'undici-or-node-fetch-later';
    readonly executableHttpClientUsedNow: false;
    readonly networkCallNow: false;
  };

  readonly futureRequestPolicy: {
    readonly grantType: 'authorization_code';
    readonly rawAuthorizationCodeMayEnterRequestBodyBuilderLater: true;
    readonly rawClientSecretMayEnterRequestBodyBuilderLater: true;
    readonly rawRequestBodyMayExistOnlyInLocalFunctionScopeLater: true;
    readonly rawRequestBodyMayBeLogged: false;
    readonly rawRequestBodyMayBeReturned: false;
    readonly rawRequestBodyMayBeStored: false;
    readonly requestBodyFingerprintMayBeReturned: true;
  };

  readonly futureResponsePolicy: {
    readonly rawLwaResponseMayExistOnlyInLocalFunctionScopeLater: true;
    readonly rawLwaResponseMayBeLogged: false;
    readonly rawLwaResponseMayBeReturned: false;
    readonly rawLwaResponseMayBeStored: false;
    readonly rawAccessTokenMayBeReturned: false;
    readonly rawRefreshTokenMayBeReturned: false;
    readonly rawAccessTokenMayBeLogged: false;
    readonly rawRefreshTokenMayBeLogged: false;
    readonly sanitizedEnvelopeRequired: true;
    readonly responseParserRequiresSeparateStep: true;
  };

  readonly futureFailurePolicy: {
    readonly timeoutReturnsSanitizedError: true;
    readonly non2xxReturnsSanitizedError: true;
    readonly malformedJsonReturnsSanitizedError: true;
    readonly missingAccessTokenReturnsSanitizedError: true;
    readonly missingRefreshTokenReturnsSanitizedError: true;
    readonly amazonErrorDescriptionRedacted: true;
    readonly noRawBodyInError: true;
  };

  readonly futurePersistenceBoundary: {
    readonly tokenPersistenceImplementedNow: false;
    readonly persistenceRequiresSeparateEncryptedBoundary: true;
    readonly plaintextTokenDatabaseWriteAllowed: false;
    readonly plaintextRefreshTokenMayOnlyEnterEncryptionInputLater: true;
    readonly plaintextAccessTokenMayOnlyEnterEncryptionInputLater: true;
    readonly encryptedRefreshCredentialRequiredLater: true;
    readonly encryptedAccessTokenCacheRequiredLater: true;
  };

  readonly safetyFlagsNow: {
    readonly guardedHttpTransportImplementedNow: false;
    readonly existingHttpTransportChangedNow: false;
    readonly oauthCallbackRouteChangedNow: false;
    readonly diagnosticEndpointChangedNow: false;
    readonly realHttpEnabledNow: false;
    readonly tokenExchangeHttpCallNow: false;
    readonly lwaHttpCallNow: false;
    readonly realSpApiRequestNow: false;
    readonly tokenPersistenceDatabaseWriteNow: false;
    readonly reportsApiCallNow: false;
    readonly importJobWriteNow: false;
    readonly importStagingRowWriteNow: false;
    readonly transactionWriteNow: false;
    readonly inventoryWriteNow: false;
    readonly rawAuthorizationCodeReturnedNow: false;
    readonly rawClientIdReturnedNow: false;
    readonly rawClientSecretReturnedNow: false;
    readonly rawRequestBodyReturnedNow: false;
    readonly rawLwaResponseReturnedNow: false;
    readonly rawAccessTokenReturnedNow: false;
    readonly rawRefreshTokenReturnedNow: false;
  };

  readonly explicitNonGoals: {
    readonly implementsGuardedHttpTransportNow: false;
    readonly changesExistingHttpTransportNow: false;
    readonly enablesRealHttpNow: false;
    readonly wiresOAuthCallbackToRealLwaNow: false;
    readonly changesDiagnosticEndpointNow: false;
    readonly parsesLwaResponseNow: false;
    readonly writesTokenPersistenceNow: false;
    readonly callsReportsApiNow: false;
    readonly createsImportJobNow: false;
    readonly createsImportStagingRowNow: false;
    readonly createsTransactionNow: false;
    readonly createsInventoryMovementNow: false;
    readonly changesFrontendNow: false;
  };

  readonly validRegressionSmokesAfterStep137H: readonly [
    'smoke:amazon-sp-api-lwa-activation-gate-diagnostic-endpoint-runtime',
    'smoke:amazon-sp-api-lwa-activation-gate-diagnostic-endpoint',
    'smoke:amazon-sp-api-real-lwa-activation-gate-mock-runtime',
    'smoke:amazon-sp-api-real-lwa-activation-feature-gate-contract',
    'smoke:amazon-sp-api-real-lwa-exchange-chain-mock-runtime',
    'smoke:amazon-sp-api-real-lwa-exchange-chain-disabled',
    'smoke:amazon-sp-api-lwa-http-transport-mock-runtime',
    'smoke:amazon-sp-api-lwa-http-transport-disabled',
  ];

  readonly contractOnlySmokesToSkipAfterImplementation: readonly [
    'smoke:amazon-sp-api-lwa-request-body-builder-boundary-contract',
    'smoke:amazon-sp-api-lwa-http-execution-boundary-contract',
    'smoke:amazon-sp-api-real-lwa-exchange-chain-boundary-contract',
    'smoke:amazon-sp-api-lwa-activation-gate-diagnostic-endpoint-contract',
    'smoke:amazon-sp-api-real-lwa-activation-gate-service',
  ];

  readonly nextSuggestedStep: 'Step137-I';
};

export const amazonSpApiRealLwaGuardedHttpTransportActivationContract: AmazonSpApiRealLwaGuardedHttpTransportActivationContract =
  {
    source: 'amazon-sp-api-real-lwa-guarded-http-transport-activation-contract',
    step: 'Step137-H',
    phase: 'contract-only',

    currentHttpTransportPath:
      'AmazonSpApiTokenExchangeService.executeRealLwaTokenExchangeHttpLater',
    currentActivationGatePath:
      'AmazonSpApiRealLwaActivationGateService.evaluateRealLwaActivationLater',
    currentDiagnosticEndpoint:
      '/api/imports/internal/amazon-sp-api/lwa-activation-gate/status',
    currentOAuthCallbackPath:
      'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeDryRunnable',
    plannedGuardedTransportPath:
      'AmazonSpApiTokenExchangeService.executeRealLwaTokenExchangeHttpGuardedLater',

    guardedHttpTransportImplementedNow: false,
    existingHttpTransportChangedNow: false,
    oauthCallbackRouteChangedNow: false,
    diagnosticEndpointChangedNow: false,
    realHttpEnabledNow: false,
    tokenPersistenceChangedNow: false,

    requiredPreconditionsForFutureRealHttp: {
      activationGateDecisionMustAllowRealHttp: true,
      configValidatorStatusMustBeReady: true,
      tokenEndpointMustBeHttps: true,
      requestBodyBuilderMustBeReady: true,
      requestBodyFingerprintRequired: true,
      requestBodyLengthMustBePositive: true,
      contentTypeMustBeFormUrlEncoded: true,
      methodMustBePost: true,
      callbackStateMustBeTrusted: true,
      companyIdMustBeResolvedFromTrustedState: true,
      storeIdMustBeResolvedFromTrustedState: true,
      marketplaceIdMustBeResolved: true,
      regionMustBeResolved: true,
      environmentMustAllowRealLwaHttp: true,
      companyStoreAllowlistRequired: true,
      explicitOperatorConfirmationRequired: true,
      dryRunMustBeFalseOnlyInLaterActivationStep: true,
    },

    forbiddenShortcuts: {
      envFlagAloneEnablesHttp: false,
      diagnosticEndpointCanEnableHttp: false,
      frontendCanEnableHttp: false,
      queryParamCanEnableHttp: false,
      callbackParamCanEnableHttp: false,
      missingTrustedStateCanEnableHttp: false,
      missingAllowlistCanEnableHttp: false,
      missingOperatorConfirmationCanEnableHttp: false,
    },

    futureTransportPolicy: {
      method: 'POST',
      tokenEndpointDefault: 'https://api.amazon.com/auth/o2/token',
      contentType: 'application/x-www-form-urlencoded',
      timeoutMs: 10000,
      retryInitiallyAllowed: false,
      maxResponseBytes: 32768,
      allowedHttpClientLater: 'undici-or-node-fetch-later',
      executableHttpClientUsedNow: false,
      networkCallNow: false,
    },

    futureRequestPolicy: {
      grantType: 'authorization_code',
      rawAuthorizationCodeMayEnterRequestBodyBuilderLater: true,
      rawClientSecretMayEnterRequestBodyBuilderLater: true,
      rawRequestBodyMayExistOnlyInLocalFunctionScopeLater: true,
      rawRequestBodyMayBeLogged: false,
      rawRequestBodyMayBeReturned: false,
      rawRequestBodyMayBeStored: false,
      requestBodyFingerprintMayBeReturned: true,
    },

    futureResponsePolicy: {
      rawLwaResponseMayExistOnlyInLocalFunctionScopeLater: true,
      rawLwaResponseMayBeLogged: false,
      rawLwaResponseMayBeReturned: false,
      rawLwaResponseMayBeStored: false,
      rawAccessTokenMayBeReturned: false,
      rawRefreshTokenMayBeReturned: false,
      rawAccessTokenMayBeLogged: false,
      rawRefreshTokenMayBeLogged: false,
      sanitizedEnvelopeRequired: true,
      responseParserRequiresSeparateStep: true,
    },

    futureFailurePolicy: {
      timeoutReturnsSanitizedError: true,
      non2xxReturnsSanitizedError: true,
      malformedJsonReturnsSanitizedError: true,
      missingAccessTokenReturnsSanitizedError: true,
      missingRefreshTokenReturnsSanitizedError: true,
      amazonErrorDescriptionRedacted: true,
      noRawBodyInError: true,
    },

    futurePersistenceBoundary: {
      tokenPersistenceImplementedNow: false,
      persistenceRequiresSeparateEncryptedBoundary: true,
      plaintextTokenDatabaseWriteAllowed: false,
      plaintextRefreshTokenMayOnlyEnterEncryptionInputLater: true,
      plaintextAccessTokenMayOnlyEnterEncryptionInputLater: true,
      encryptedRefreshCredentialRequiredLater: true,
      encryptedAccessTokenCacheRequiredLater: true,
    },

    safetyFlagsNow: {
      guardedHttpTransportImplementedNow: false,
      existingHttpTransportChangedNow: false,
      oauthCallbackRouteChangedNow: false,
      diagnosticEndpointChangedNow: false,
      realHttpEnabledNow: false,
      tokenExchangeHttpCallNow: false,
      lwaHttpCallNow: false,
      realSpApiRequestNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      reportsApiCallNow: false,
      importJobWriteNow: false,
      importStagingRowWriteNow: false,
      transactionWriteNow: false,
      inventoryWriteNow: false,
      rawAuthorizationCodeReturnedNow: false,
      rawClientIdReturnedNow: false,
      rawClientSecretReturnedNow: false,
      rawRequestBodyReturnedNow: false,
      rawLwaResponseReturnedNow: false,
      rawAccessTokenReturnedNow: false,
      rawRefreshTokenReturnedNow: false,
    },

    explicitNonGoals: {
      implementsGuardedHttpTransportNow: false,
      changesExistingHttpTransportNow: false,
      enablesRealHttpNow: false,
      wiresOAuthCallbackToRealLwaNow: false,
      changesDiagnosticEndpointNow: false,
      parsesLwaResponseNow: false,
      writesTokenPersistenceNow: false,
      callsReportsApiNow: false,
      createsImportJobNow: false,
      createsImportStagingRowNow: false,
      createsTransactionNow: false,
      createsInventoryMovementNow: false,
      changesFrontendNow: false,
    },

    validRegressionSmokesAfterStep137H: [
      'smoke:amazon-sp-api-lwa-activation-gate-diagnostic-endpoint-runtime',
      'smoke:amazon-sp-api-lwa-activation-gate-diagnostic-endpoint',
      'smoke:amazon-sp-api-real-lwa-activation-gate-mock-runtime',
      'smoke:amazon-sp-api-real-lwa-activation-feature-gate-contract',
      'smoke:amazon-sp-api-real-lwa-exchange-chain-mock-runtime',
      'smoke:amazon-sp-api-real-lwa-exchange-chain-disabled',
      'smoke:amazon-sp-api-lwa-http-transport-mock-runtime',
      'smoke:amazon-sp-api-lwa-http-transport-disabled',
    ],

    contractOnlySmokesToSkipAfterImplementation: [
      'smoke:amazon-sp-api-lwa-request-body-builder-boundary-contract',
      'smoke:amazon-sp-api-lwa-http-execution-boundary-contract',
      'smoke:amazon-sp-api-real-lwa-exchange-chain-boundary-contract',
      'smoke:amazon-sp-api-lwa-activation-gate-diagnostic-endpoint-contract',
      'smoke:amazon-sp-api-real-lwa-activation-gate-service',
    ],

    nextSuggestedStep: 'Step137-I',
  };
