export type AmazonSpApiExecutableRealLwaHttpTransportReplacementStep = 'Step137-T';

export type AmazonSpApiExecutableRealLwaHttpTransportReplacementContract = {
  readonly source: 'amazon-sp-api-executable-real-lwa-http-transport-replacement-contract';
  readonly step: AmazonSpApiExecutableRealLwaHttpTransportReplacementStep;
  readonly phase: 'replacement-contract-only';

  readonly previousPreActivationHandoffStep: 'Step137-S';
  readonly currentGuardedTransportMethod: 'AmazonSpApiTokenExchangeService.executeRealLwaTokenExchangeHttpGuardedLater';
  readonly currentTransportMode: 'test-double-no-network';
  readonly futureExecutableTransportMode: 'server-gated-real-lwa-http';

  readonly currentScopeNow: {
    readonly defineReplacementContractOnlyNow: true;
    readonly implementExecutableHttpNow: false;
    readonly replaceTestDoubleNow: false;
    readonly wireControllerNow: false;
    readonly wireOAuthCallbackNow: false;
    readonly writeDatabaseNow: false;
    readonly addPrismaModelNow: false;
    readonly addMigrationNow: false;
  };

  readonly futureExecutableTransportHardRequirements: {
    readonly serverSideActivationGateRequired: true;
    readonly activationGateDecisionMustBeEligibleLater: true;
    readonly realHttpAllowedNowMustBeTrueInsideServerBoundary: true;
    readonly configValidatorStatusMustBeReady: true;
    readonly tokenEndpointMustBeHttps: true;
    readonly methodMustBePost: true;
    readonly contentTypeMustBeFormUrlEncoded: true;
    readonly requestBodyBuilderMustBeReady: true;
    readonly requestBodyFingerprintMustBePresent: true;
    readonly requestBodyLengthMustBePositive: true;
    readonly callbackStateMustBeTrusted: true;
    readonly companyIdMustBeResolvedFromTrustedState: true;
    readonly storeIdMustBeResolvedFromTrustedState: true;
    readonly marketplaceIdMustBePresent: true;
    readonly regionMustBePresent: true;
    readonly environmentMustAllowRealLwaHttp: true;
    readonly companyStoreMustBeAllowlisted: true;
    readonly explicitOperatorConfirmationMustBePresent: true;
  };

  readonly futureTransportRuntimePolicy: {
    readonly tokenEndpointDefault: 'https://api.amazon.com/auth/o2/token';
    readonly timeoutMs: 10000;
    readonly maxAttemptsInitially: 1;
    readonly retryInitiallyAllowed: false;
    readonly maxResponseBytes: 32768;
    readonly allowedHttpMethod: 'POST';
    readonly allowedContentType: 'application/x-www-form-urlencoded';
    readonly allowedHttpClientLater: 'undici-or-node-fetch-later';
    readonly redirectsAllowed: false;
    readonly proxyAllowedByDefault: false;
  };

  readonly futureTransportSanitizedResultPolicy: {
    readonly successMustGoThroughSanitizedParser: true;
    readonly non2xxMustReturnSanitizedFailureEnvelope: true;
    readonly timeoutMustReturnSanitizedFailureEnvelope: true;
    readonly networkErrorMustReturnSanitizedFailureEnvelope: true;
    readonly malformedResponseMustReturnSanitizedFailureEnvelope: true;
    readonly rawRequestBodyMayBeReturned: false;
    readonly rawLwaResponseMayBeReturned: false;
    readonly rawAccessTokenMayBeReturned: false;
    readonly rawRefreshTokenMayBeReturned: false;
    readonly rawClientSecretMayBeReturned: false;
    readonly rawAuthorizationCodeMayBeReturned: false;
    readonly tokenPersistenceMayHappenInsideTransport: false;
  };

  readonly stillForbiddenNow: {
    readonly executableHttpClientUsedNow: false;
    readonly networkCallNow: false;
    readonly lwaHttpCallNow: false;
    readonly realSpApiRequestNow: false;
    readonly tokenPersistenceDatabaseWriteNow: false;
    readonly plaintextTokenDatabaseWriteNow: false;
    readonly controllerMayCallTransportNow: false;
    readonly oauthCallbackMayCallTransportNow: false;
    readonly diagnosticEndpointMayEnableTransportNow: false;
    readonly envFlagAloneMayEnableTransportNow: false;
    readonly queryParamMayEnableTransportNow: false;
    readonly frontendMayEnableTransportNow: false;
  };

  readonly replacementImplementationOrder: readonly [
    'add executable transport helper behind existing guarded method',
    'keep all activation gate checks before creating HTTP client',
    'build request body only inside local function scope',
    'execute one POST request with timeout and response size cap',
    'pass raw local response only into sanitized parser',
    'return sanitized parser envelope or sanitized transport failure',
    'do not persist tokens inside transport',
    'do not wire controller or OAuth callback in the same step',
  ];

  readonly requiredRegressionSmokesBeforeReplacementImplementation: readonly [
    'smoke:amazon-sp-api-executable-real-lwa-http-transport-replacement-contract',
    'smoke:amazon-sp-api-real-lwa-integration-pre-activation-handoff-contract',
    'smoke:amazon-sp-api-token-persistence-builder-branch-runtime',
    'smoke:amazon-sp-api-token-persistence-input-builder-test-double',
    'smoke:amazon-sp-api-token-persistence-encrypted-boundary-contract',
    'smoke:amazon-sp-api-sanitized-lwa-parser-branch-runtime',
    'smoke:amazon-sp-api-sanitized-lwa-http-response-parser-test-double',
    'smoke:amazon-sp-api-sanitized-lwa-http-response-parser-contract',
    'smoke:amazon-sp-api-real-http-activation-transition-contract',
    'smoke:amazon-sp-api-guarded-lwa-http-activation-handoff-contract',
    'smoke:amazon-sp-api-guarded-lwa-http-transport-branch-runtime',
    'smoke:amazon-sp-api-guarded-lwa-http-transport-test-double',
  ];

  readonly nextSuggestedStep: 'Step137-U';
  readonly nextSuggestedStepGoal: 'implement executable real LWA HTTP transport behind server-side activation gate without controller wiring or token persistence';
};

export const amazonSpApiExecutableRealLwaHttpTransportReplacementContract: AmazonSpApiExecutableRealLwaHttpTransportReplacementContract =
  {
    source: 'amazon-sp-api-executable-real-lwa-http-transport-replacement-contract',
    step: 'Step137-T',
    phase: 'replacement-contract-only',

    previousPreActivationHandoffStep: 'Step137-S',
    currentGuardedTransportMethod:
      'AmazonSpApiTokenExchangeService.executeRealLwaTokenExchangeHttpGuardedLater',
    currentTransportMode: 'test-double-no-network',
    futureExecutableTransportMode: 'server-gated-real-lwa-http',

    currentScopeNow: {
      defineReplacementContractOnlyNow: true,
      implementExecutableHttpNow: false,
      replaceTestDoubleNow: false,
      wireControllerNow: false,
      wireOAuthCallbackNow: false,
      writeDatabaseNow: false,
      addPrismaModelNow: false,
      addMigrationNow: false,
    },

    futureExecutableTransportHardRequirements: {
      serverSideActivationGateRequired: true,
      activationGateDecisionMustBeEligibleLater: true,
      realHttpAllowedNowMustBeTrueInsideServerBoundary: true,
      configValidatorStatusMustBeReady: true,
      tokenEndpointMustBeHttps: true,
      methodMustBePost: true,
      contentTypeMustBeFormUrlEncoded: true,
      requestBodyBuilderMustBeReady: true,
      requestBodyFingerprintMustBePresent: true,
      requestBodyLengthMustBePositive: true,
      callbackStateMustBeTrusted: true,
      companyIdMustBeResolvedFromTrustedState: true,
      storeIdMustBeResolvedFromTrustedState: true,
      marketplaceIdMustBePresent: true,
      regionMustBePresent: true,
      environmentMustAllowRealLwaHttp: true,
      companyStoreMustBeAllowlisted: true,
      explicitOperatorConfirmationMustBePresent: true,
    },

    futureTransportRuntimePolicy: {
      tokenEndpointDefault: 'https://api.amazon.com/auth/o2/token',
      timeoutMs: 10000,
      maxAttemptsInitially: 1,
      retryInitiallyAllowed: false,
      maxResponseBytes: 32768,
      allowedHttpMethod: 'POST',
      allowedContentType: 'application/x-www-form-urlencoded',
      allowedHttpClientLater: 'undici-or-node-fetch-later',
      redirectsAllowed: false,
      proxyAllowedByDefault: false,
    },

    futureTransportSanitizedResultPolicy: {
      successMustGoThroughSanitizedParser: true,
      non2xxMustReturnSanitizedFailureEnvelope: true,
      timeoutMustReturnSanitizedFailureEnvelope: true,
      networkErrorMustReturnSanitizedFailureEnvelope: true,
      malformedResponseMustReturnSanitizedFailureEnvelope: true,
      rawRequestBodyMayBeReturned: false,
      rawLwaResponseMayBeReturned: false,
      rawAccessTokenMayBeReturned: false,
      rawRefreshTokenMayBeReturned: false,
      rawClientSecretMayBeReturned: false,
      rawAuthorizationCodeMayBeReturned: false,
      tokenPersistenceMayHappenInsideTransport: false,
    },

    stillForbiddenNow: {
      executableHttpClientUsedNow: false,
      networkCallNow: false,
      lwaHttpCallNow: false,
      realSpApiRequestNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      plaintextTokenDatabaseWriteNow: false,
      controllerMayCallTransportNow: false,
      oauthCallbackMayCallTransportNow: false,
      diagnosticEndpointMayEnableTransportNow: false,
      envFlagAloneMayEnableTransportNow: false,
      queryParamMayEnableTransportNow: false,
      frontendMayEnableTransportNow: false,
    },

    replacementImplementationOrder: [
      'add executable transport helper behind existing guarded method',
      'keep all activation gate checks before creating HTTP client',
      'build request body only inside local function scope',
      'execute one POST request with timeout and response size cap',
      'pass raw local response only into sanitized parser',
      'return sanitized parser envelope or sanitized transport failure',
      'do not persist tokens inside transport',
      'do not wire controller or OAuth callback in the same step',
    ],

    requiredRegressionSmokesBeforeReplacementImplementation: [
      'smoke:amazon-sp-api-executable-real-lwa-http-transport-replacement-contract',
      'smoke:amazon-sp-api-real-lwa-integration-pre-activation-handoff-contract',
      'smoke:amazon-sp-api-token-persistence-builder-branch-runtime',
      'smoke:amazon-sp-api-token-persistence-input-builder-test-double',
      'smoke:amazon-sp-api-token-persistence-encrypted-boundary-contract',
      'smoke:amazon-sp-api-sanitized-lwa-parser-branch-runtime',
      'smoke:amazon-sp-api-sanitized-lwa-http-response-parser-test-double',
      'smoke:amazon-sp-api-sanitized-lwa-http-response-parser-contract',
      'smoke:amazon-sp-api-real-http-activation-transition-contract',
      'smoke:amazon-sp-api-guarded-lwa-http-activation-handoff-contract',
      'smoke:amazon-sp-api-guarded-lwa-http-transport-branch-runtime',
      'smoke:amazon-sp-api-guarded-lwa-http-transport-test-double',
    ],

    nextSuggestedStep: 'Step137-U',
    nextSuggestedStepGoal:
      'implement executable real LWA HTTP transport behind server-side activation gate without controller wiring or token persistence',
  };
