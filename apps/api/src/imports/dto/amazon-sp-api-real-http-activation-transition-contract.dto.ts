export type AmazonSpApiRealHttpActivationTransitionStep = 'Step137-L';

export type AmazonSpApiRealHttpActivationTransitionContract = {
  readonly source: 'amazon-sp-api-real-http-activation-transition-contract';
  readonly step: AmazonSpApiRealHttpActivationTransitionStep;
  readonly phase: 'transition-contract-only';

  readonly previousHandoffStep: 'Step137-K';
  readonly previousRuntimeStep: 'Step137-J';
  readonly currentGuardedTransportMethod: 'AmazonSpApiTokenExchangeService.executeRealLwaTokenExchangeHttpGuardedLater';
  readonly currentGuardedTransportSource: 'amazon-sp-api-real-lwa-guarded-http-transport-test-double';
  readonly currentGuardedTransportMode: 'test-double-no-network';

  readonly transitionPurpose: {
    readonly defineOnlyNow: true;
    readonly replaceTestDoubleNow: false;
    readonly connectControllerNow: false;
    readonly connectOAuthCallbackNow: false;
    readonly enableNetworkNow: false;
    readonly persistTokensNow: false;
  };

  readonly onlyAllowedFutureTransitionPath: {
    readonly startsFromTrustedOAuthCallbackState: true;
    readonly evaluatesServerSideActivationGate: true;
    readonly requiresConfigValidatorReady: true;
    readonly requiresHttpsLwaTokenEndpoint: true;
    readonly requiresRequestBodyBuilderReady: true;
    readonly requiresSanitizedRequestBodyFingerprint: true;
    readonly requiresPositiveRequestBodyLength: true;
    readonly requiresCompanyIdFromTrustedState: true;
    readonly requiresStoreIdFromTrustedState: true;
    readonly requiresMarketplaceId: true;
    readonly requiresRegion: true;
    readonly requiresEnvironmentAllowRealLwaHttp: true;
    readonly requiresCompanyStoreAllowlist: true;
    readonly requiresExplicitOperatorConfirmation: true;
    readonly requiresDryRunExitInDedicatedStep: true;
    readonly producesSanitizedHttpResultOnly: true;
  };

  readonly forbiddenTransitionShortcuts: {
    readonly envFlagAloneCanEnableRealHttp: false;
    readonly frontendCanEnableRealHttp: false;
    readonly queryParamCanEnableRealHttp: false;
    readonly callbackParamCanEnableRealHttp: false;
    readonly diagnosticEndpointCanEnableRealHttp: false;
    readonly missingTrustedStateCanEnableRealHttp: false;
    readonly missingAllowlistCanEnableRealHttp: false;
    readonly missingOperatorConfirmationCanEnableRealHttp: false;
    readonly dryRunFalseWithoutDedicatedActivationStep: false;
    readonly controllerDirectlyCallsRealTransportNow: false;
    readonly oauthCallbackDirectlyCallsRealTransportNow: false;
  };

  readonly futureRealHttpTransportPolicy: {
    readonly method: 'POST';
    readonly tokenEndpointDefault: 'https://api.amazon.com/auth/o2/token';
    readonly contentType: 'application/x-www-form-urlencoded';
    readonly timeoutMs: 10000;
    readonly maxAttemptsInitially: 1;
    readonly retryInitiallyAllowed: false;
    readonly maxResponseBytes: 32768;
    readonly allowedHttpClientLater: 'undici-or-node-fetch-later';
    readonly executableHttpClientUsedNow: false;
    readonly networkCallNow: false;
  };

  readonly futureSanitizationPolicy: {
    readonly rawAuthorizationCodeMayExistOnlyInLocalFunctionScopeLater: true;
    readonly rawClientSecretMayExistOnlyInLocalFunctionScopeLater: true;
    readonly rawRequestBodyMayExistOnlyInLocalFunctionScopeLater: true;
    readonly rawLwaResponseMayExistOnlyInLocalFunctionScopeLater: true;
    readonly rawAccessTokenMayExistOnlyInLocalFunctionScopeLater: true;
    readonly rawRefreshTokenMayExistOnlyInLocalFunctionScopeLater: true;
    readonly rawAuthorizationCodeMayBeLogged: false;
    readonly rawClientSecretMayBeLogged: false;
    readonly rawRequestBodyMayBeLogged: false;
    readonly rawLwaResponseMayBeLogged: false;
    readonly rawAccessTokenMayBeLogged: false;
    readonly rawRefreshTokenMayBeLogged: false;
    readonly rawRequestBodyMayBeReturned: false;
    readonly rawLwaResponseMayBeReturned: false;
    readonly rawAccessTokenMayBeReturned: false;
    readonly rawRefreshTokenMayBeReturned: false;
  };

  readonly futureFailureEnvelopePolicy: {
    readonly timeoutReturnsSanitizedError: true;
    readonly networkErrorReturnsSanitizedError: true;
    readonly non2xxReturnsSanitizedError: true;
    readonly malformedJsonReturnsSanitizedError: true;
    readonly missingAccessTokenReturnsSanitizedError: true;
    readonly missingRefreshTokenReturnsSanitizedError: true;
    readonly amazonErrorDescriptionRedacted: true;
    readonly noRawBodyInError: true;
    readonly noRawTokenInError: true;
  };

  readonly futurePersistenceBoundary: {
    readonly tokenPersistenceImplementedNow: false;
    readonly tokenPersistenceRequiresDedicatedEncryptedBoundary: true;
    readonly plaintextTokenDatabaseWriteAllowed: false;
    readonly plaintextRefreshTokenMayOnlyEnterEncryptionInputLater: true;
    readonly plaintextAccessTokenMayOnlyEnterEncryptionInputLater: true;
    readonly encryptedRefreshCredentialRequiredLater: true;
    readonly encryptedAccessTokenCacheRequiredLater: true;
    readonly persistenceSmokeRequiredBeforeOAuthCallbackWiring: true;
  };

  readonly currentSafetyAssertionsNow: {
    readonly guardedTransportStillTestDouble: true;
    readonly allPreconditionsTrueStillNoNetwork: true;
    readonly controllerWiringChangedNow: false;
    readonly oauthCallbackRuntimeChangedNow: false;
    readonly diagnosticEndpointChangedNow: false;
    readonly realHttpEnabledNow: false;
    readonly tokenPersistenceChangedNow: false;
    readonly executableHttpClientUsedNow: false;
    readonly networkCallNow: false;
    readonly rawRequestBodyReturnedNow: false;
    readonly rawLwaResponseReturnedNow: false;
    readonly rawAccessTokenReturnedNow: false;
    readonly rawRefreshTokenReturnedNow: false;
  };

  readonly requiredRegressionSmokesBeforeFutureRealActivation: readonly [
    'smoke:amazon-sp-api-real-http-activation-transition-contract',
    'smoke:amazon-sp-api-guarded-lwa-http-activation-handoff-contract',
    'smoke:amazon-sp-api-guarded-lwa-http-transport-branch-runtime',
    'smoke:amazon-sp-api-guarded-lwa-http-transport-test-double',
    'smoke:amazon-sp-api-real-lwa-guarded-http-activation-contract',
    'smoke:amazon-sp-api-lwa-activation-gate-diagnostic-endpoint',
    'smoke:amazon-sp-api-real-lwa-activation-gate-mock-runtime',
    'smoke:amazon-sp-api-real-lwa-exchange-chain-mock-runtime',
  ];

  readonly nextSuggestedStep: 'Step137-M';
  readonly nextSuggestedStepGoal: 'define sanitized real LWA HTTP response parser contract before executable network transport';
};

export const amazonSpApiRealHttpActivationTransitionContract: AmazonSpApiRealHttpActivationTransitionContract =
  {
    source: 'amazon-sp-api-real-http-activation-transition-contract',
    step: 'Step137-L',
    phase: 'transition-contract-only',

    previousHandoffStep: 'Step137-K',
    previousRuntimeStep: 'Step137-J',
    currentGuardedTransportMethod:
      'AmazonSpApiTokenExchangeService.executeRealLwaTokenExchangeHttpGuardedLater',
    currentGuardedTransportSource:
      'amazon-sp-api-real-lwa-guarded-http-transport-test-double',
    currentGuardedTransportMode: 'test-double-no-network',

    transitionPurpose: {
      defineOnlyNow: true,
      replaceTestDoubleNow: false,
      connectControllerNow: false,
      connectOAuthCallbackNow: false,
      enableNetworkNow: false,
      persistTokensNow: false,
    },

    onlyAllowedFutureTransitionPath: {
      startsFromTrustedOAuthCallbackState: true,
      evaluatesServerSideActivationGate: true,
      requiresConfigValidatorReady: true,
      requiresHttpsLwaTokenEndpoint: true,
      requiresRequestBodyBuilderReady: true,
      requiresSanitizedRequestBodyFingerprint: true,
      requiresPositiveRequestBodyLength: true,
      requiresCompanyIdFromTrustedState: true,
      requiresStoreIdFromTrustedState: true,
      requiresMarketplaceId: true,
      requiresRegion: true,
      requiresEnvironmentAllowRealLwaHttp: true,
      requiresCompanyStoreAllowlist: true,
      requiresExplicitOperatorConfirmation: true,
      requiresDryRunExitInDedicatedStep: true,
      producesSanitizedHttpResultOnly: true,
    },

    forbiddenTransitionShortcuts: {
      envFlagAloneCanEnableRealHttp: false,
      frontendCanEnableRealHttp: false,
      queryParamCanEnableRealHttp: false,
      callbackParamCanEnableRealHttp: false,
      diagnosticEndpointCanEnableRealHttp: false,
      missingTrustedStateCanEnableRealHttp: false,
      missingAllowlistCanEnableRealHttp: false,
      missingOperatorConfirmationCanEnableRealHttp: false,
      dryRunFalseWithoutDedicatedActivationStep: false,
      controllerDirectlyCallsRealTransportNow: false,
      oauthCallbackDirectlyCallsRealTransportNow: false,
    },

    futureRealHttpTransportPolicy: {
      method: 'POST',
      tokenEndpointDefault: 'https://api.amazon.com/auth/o2/token',
      contentType: 'application/x-www-form-urlencoded',
      timeoutMs: 10000,
      maxAttemptsInitially: 1,
      retryInitiallyAllowed: false,
      maxResponseBytes: 32768,
      allowedHttpClientLater: 'undici-or-node-fetch-later',
      executableHttpClientUsedNow: false,
      networkCallNow: false,
    },

    futureSanitizationPolicy: {
      rawAuthorizationCodeMayExistOnlyInLocalFunctionScopeLater: true,
      rawClientSecretMayExistOnlyInLocalFunctionScopeLater: true,
      rawRequestBodyMayExistOnlyInLocalFunctionScopeLater: true,
      rawLwaResponseMayExistOnlyInLocalFunctionScopeLater: true,
      rawAccessTokenMayExistOnlyInLocalFunctionScopeLater: true,
      rawRefreshTokenMayExistOnlyInLocalFunctionScopeLater: true,
      rawAuthorizationCodeMayBeLogged: false,
      rawClientSecretMayBeLogged: false,
      rawRequestBodyMayBeLogged: false,
      rawLwaResponseMayBeLogged: false,
      rawAccessTokenMayBeLogged: false,
      rawRefreshTokenMayBeLogged: false,
      rawRequestBodyMayBeReturned: false,
      rawLwaResponseMayBeReturned: false,
      rawAccessTokenMayBeReturned: false,
      rawRefreshTokenMayBeReturned: false,
    },

    futureFailureEnvelopePolicy: {
      timeoutReturnsSanitizedError: true,
      networkErrorReturnsSanitizedError: true,
      non2xxReturnsSanitizedError: true,
      malformedJsonReturnsSanitizedError: true,
      missingAccessTokenReturnsSanitizedError: true,
      missingRefreshTokenReturnsSanitizedError: true,
      amazonErrorDescriptionRedacted: true,
      noRawBodyInError: true,
      noRawTokenInError: true,
    },

    futurePersistenceBoundary: {
      tokenPersistenceImplementedNow: false,
      tokenPersistenceRequiresDedicatedEncryptedBoundary: true,
      plaintextTokenDatabaseWriteAllowed: false,
      plaintextRefreshTokenMayOnlyEnterEncryptionInputLater: true,
      plaintextAccessTokenMayOnlyEnterEncryptionInputLater: true,
      encryptedRefreshCredentialRequiredLater: true,
      encryptedAccessTokenCacheRequiredLater: true,
      persistenceSmokeRequiredBeforeOAuthCallbackWiring: true,
    },

    currentSafetyAssertionsNow: {
      guardedTransportStillTestDouble: true,
      allPreconditionsTrueStillNoNetwork: true,
      controllerWiringChangedNow: false,
      oauthCallbackRuntimeChangedNow: false,
      diagnosticEndpointChangedNow: false,
      realHttpEnabledNow: false,
      tokenPersistenceChangedNow: false,
      executableHttpClientUsedNow: false,
      networkCallNow: false,
      rawRequestBodyReturnedNow: false,
      rawLwaResponseReturnedNow: false,
      rawAccessTokenReturnedNow: false,
      rawRefreshTokenReturnedNow: false,
    },

    requiredRegressionSmokesBeforeFutureRealActivation: [
      'smoke:amazon-sp-api-real-http-activation-transition-contract',
      'smoke:amazon-sp-api-guarded-lwa-http-activation-handoff-contract',
      'smoke:amazon-sp-api-guarded-lwa-http-transport-branch-runtime',
      'smoke:amazon-sp-api-guarded-lwa-http-transport-test-double',
      'smoke:amazon-sp-api-real-lwa-guarded-http-activation-contract',
      'smoke:amazon-sp-api-lwa-activation-gate-diagnostic-endpoint',
      'smoke:amazon-sp-api-real-lwa-activation-gate-mock-runtime',
      'smoke:amazon-sp-api-real-lwa-exchange-chain-mock-runtime',
    ],

    nextSuggestedStep: 'Step137-M',
    nextSuggestedStepGoal:
      'define sanitized real LWA HTTP response parser contract before executable network transport',
  };
