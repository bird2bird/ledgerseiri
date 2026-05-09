export type AmazonSpApiSanitizedLwaHttpResponseParserStep = 'Step137-M';

export type AmazonSpApiSanitizedLwaHttpResponseParserContract = {
  readonly source: 'amazon-sp-api-sanitized-lwa-http-response-parser-contract';
  readonly step: AmazonSpApiSanitizedLwaHttpResponseParserStep;
  readonly phase: 'parser-contract-only';

  readonly previousTransitionStep: 'Step137-L';
  readonly parserTarget: 'LWA authorization_code token response';
  readonly futureParserPath: 'AmazonSpApiTokenExchangeService.parseRealLwaHttpResponseSanitizedLater';

  readonly currentScopeNow: {
    readonly defineParserContractOnlyNow: true;
    readonly implementParserNow: false;
    readonly invokeParserNow: false;
    readonly executeHttpNow: false;
    readonly wireControllerNow: false;
    readonly wireOAuthCallbackNow: false;
    readonly persistTokensNow: false;
  };

  readonly futureSuccessInputBoundary: {
    readonly rawLwaHttpStatusMayEnterParserLater: true;
    readonly rawLwaResponseBodyMayEnterParserLater: true;
    readonly rawLwaResponseHeadersMayEnterParserLater: true;
    readonly rawLwaResponseMayExistOnlyInLocalFunctionScopeLater: true;
    readonly acceptedHttpStatusRange: '200-299';
    readonly requiredJsonFields: readonly [
      'access_token',
      'refresh_token',
      'token_type',
      'expires_in',
    ];
    readonly optionalJsonFields: readonly ['scope'];
  };

  readonly futureSanitizedSuccessOutput: {
    readonly accepted: true;
    readonly source: 'amazon-sp-api-sanitized-lwa-http-response-parser';
    readonly parserMode: 'sanitized-only';
    readonly tokenTypeMustBeBearer: true;
    readonly expiresInSecondsMustBePositive: true;
    readonly accessTokenPresent: true;
    readonly refreshTokenPresent: true;
    readonly accessTokenLengthMayBeReturned: true;
    readonly refreshTokenLengthMayBeReturned: true;
    readonly accessTokenFingerprintMayBeReturned: true;
    readonly refreshTokenFingerprintMayBeReturned: true;
    readonly rawAccessTokenMayBeReturned: false;
    readonly rawRefreshTokenMayBeReturned: false;
    readonly rawLwaResponseMayBeReturned: false;
    readonly rawResponseBodyMayBeReturned: false;
    readonly rawResponseHeadersMayBeReturned: false;
  };

  readonly futureFailureReasons: readonly [
    'http_status_not_success',
    'missing_response_body',
    'malformed_json',
    'missing_access_token',
    'missing_refresh_token',
    'missing_token_type',
    'invalid_token_type',
    'missing_expires_in',
    'invalid_expires_in',
    'response_body_too_large',
    'unexpected_parser_exception',
  ];

  readonly futureSanitizedFailureOutput: {
    readonly accepted: false;
    readonly source: 'amazon-sp-api-sanitized-lwa-http-response-parser';
    readonly parserMode: 'sanitized-only';
    readonly sanitizedReasonRequired: true;
    readonly sanitizedMessageRequired: true;
    readonly httpStatusMayBeReturned: true;
    readonly responseBodyLengthMayBeReturned: true;
    readonly responseBodyFingerprintMayBeReturned: true;
    readonly amazonErrorCodeMayBeReturned: true;
    readonly amazonErrorDescriptionMustBeRedacted: true;
    readonly rawAccessTokenMayBeReturned: false;
    readonly rawRefreshTokenMayBeReturned: false;
    readonly rawLwaResponseMayBeReturned: false;
    readonly rawResponseBodyMayBeReturned: false;
    readonly rawResponseHeadersMayBeReturned: false;
  };

  readonly redactionPolicy: {
    readonly redactAccessTokenInAllOutputs: true;
    readonly redactRefreshTokenInAllOutputs: true;
    readonly redactClientSecretInAllOutputs: true;
    readonly redactAuthorizationCodeInAllOutputs: true;
    readonly redactRawResponseBodyInErrors: true;
    readonly redactAmazonErrorDescriptionWhenSuspicious: true;
    readonly noRawTokenInLogs: true;
    readonly noRawTokenInThrownErrors: true;
    readonly noRawTokenInReturnedEnvelope: true;
    readonly noPlaintextTokenDatabaseWrite: true;
  };

  readonly parserDoesNotDoNow: {
    readonly parseRuntimeResponseNow: false;
    readonly callAmazonNow: false;
    readonly createHttpClientNow: false;
    readonly mutateTokenPersistenceNow: false;
    readonly encryptTokensNow: false;
    readonly writeDatabaseNow: false;
    readonly createImportJobNow: false;
    readonly createTransactionNow: false;
    readonly createInventoryMovementNow: false;
    readonly changeOAuthCallbackNow: false;
    readonly changeDiagnosticEndpointNow: false;
  };

  readonly requiredRegressionSmokesBeforeParserImplementation: readonly [
    'smoke:amazon-sp-api-sanitized-lwa-http-response-parser-contract',
    'smoke:amazon-sp-api-real-http-activation-transition-contract',
    'smoke:amazon-sp-api-guarded-lwa-http-activation-handoff-contract',
    'smoke:amazon-sp-api-guarded-lwa-http-transport-branch-runtime',
    'smoke:amazon-sp-api-guarded-lwa-http-transport-test-double',
    'smoke:amazon-sp-api-real-lwa-guarded-http-activation-contract',
  ];

  readonly nextSuggestedStep: 'Step137-N';
  readonly nextSuggestedStepGoal: 'implement sanitized LWA HTTP response parser test double without network or persistence';
};

export const amazonSpApiSanitizedLwaHttpResponseParserContract: AmazonSpApiSanitizedLwaHttpResponseParserContract =
  {
    source: 'amazon-sp-api-sanitized-lwa-http-response-parser-contract',
    step: 'Step137-M',
    phase: 'parser-contract-only',

    previousTransitionStep: 'Step137-L',
    parserTarget: 'LWA authorization_code token response',
    futureParserPath:
      'AmazonSpApiTokenExchangeService.parseRealLwaHttpResponseSanitizedLater',

    currentScopeNow: {
      defineParserContractOnlyNow: true,
      implementParserNow: false,
      invokeParserNow: false,
      executeHttpNow: false,
      wireControllerNow: false,
      wireOAuthCallbackNow: false,
      persistTokensNow: false,
    },

    futureSuccessInputBoundary: {
      rawLwaHttpStatusMayEnterParserLater: true,
      rawLwaResponseBodyMayEnterParserLater: true,
      rawLwaResponseHeadersMayEnterParserLater: true,
      rawLwaResponseMayExistOnlyInLocalFunctionScopeLater: true,
      acceptedHttpStatusRange: '200-299',
      requiredJsonFields: [
        'access_token',
        'refresh_token',
        'token_type',
        'expires_in',
      ],
      optionalJsonFields: ['scope'],
    },

    futureSanitizedSuccessOutput: {
      accepted: true,
      source: 'amazon-sp-api-sanitized-lwa-http-response-parser',
      parserMode: 'sanitized-only',
      tokenTypeMustBeBearer: true,
      expiresInSecondsMustBePositive: true,
      accessTokenPresent: true,
      refreshTokenPresent: true,
      accessTokenLengthMayBeReturned: true,
      refreshTokenLengthMayBeReturned: true,
      accessTokenFingerprintMayBeReturned: true,
      refreshTokenFingerprintMayBeReturned: true,
      rawAccessTokenMayBeReturned: false,
      rawRefreshTokenMayBeReturned: false,
      rawLwaResponseMayBeReturned: false,
      rawResponseBodyMayBeReturned: false,
      rawResponseHeadersMayBeReturned: false,
    },

    futureFailureReasons: [
      'http_status_not_success',
      'missing_response_body',
      'malformed_json',
      'missing_access_token',
      'missing_refresh_token',
      'missing_token_type',
      'invalid_token_type',
      'missing_expires_in',
      'invalid_expires_in',
      'response_body_too_large',
      'unexpected_parser_exception',
    ],

    futureSanitizedFailureOutput: {
      accepted: false,
      source: 'amazon-sp-api-sanitized-lwa-http-response-parser',
      parserMode: 'sanitized-only',
      sanitizedReasonRequired: true,
      sanitizedMessageRequired: true,
      httpStatusMayBeReturned: true,
      responseBodyLengthMayBeReturned: true,
      responseBodyFingerprintMayBeReturned: true,
      amazonErrorCodeMayBeReturned: true,
      amazonErrorDescriptionMustBeRedacted: true,
      rawAccessTokenMayBeReturned: false,
      rawRefreshTokenMayBeReturned: false,
      rawLwaResponseMayBeReturned: false,
      rawResponseBodyMayBeReturned: false,
      rawResponseHeadersMayBeReturned: false,
    },

    redactionPolicy: {
      redactAccessTokenInAllOutputs: true,
      redactRefreshTokenInAllOutputs: true,
      redactClientSecretInAllOutputs: true,
      redactAuthorizationCodeInAllOutputs: true,
      redactRawResponseBodyInErrors: true,
      redactAmazonErrorDescriptionWhenSuspicious: true,
      noRawTokenInLogs: true,
      noRawTokenInThrownErrors: true,
      noRawTokenInReturnedEnvelope: true,
      noPlaintextTokenDatabaseWrite: true,
    },

    parserDoesNotDoNow: {
      parseRuntimeResponseNow: false,
      callAmazonNow: false,
      createHttpClientNow: false,
      mutateTokenPersistenceNow: false,
      encryptTokensNow: false,
      writeDatabaseNow: false,
      createImportJobNow: false,
      createTransactionNow: false,
      createInventoryMovementNow: false,
      changeOAuthCallbackNow: false,
      changeDiagnosticEndpointNow: false,
    },

    requiredRegressionSmokesBeforeParserImplementation: [
      'smoke:amazon-sp-api-sanitized-lwa-http-response-parser-contract',
      'smoke:amazon-sp-api-real-http-activation-transition-contract',
      'smoke:amazon-sp-api-guarded-lwa-http-activation-handoff-contract',
      'smoke:amazon-sp-api-guarded-lwa-http-transport-branch-runtime',
      'smoke:amazon-sp-api-guarded-lwa-http-transport-test-double',
      'smoke:amazon-sp-api-real-lwa-guarded-http-activation-contract',
    ],

    nextSuggestedStep: 'Step137-N',
    nextSuggestedStepGoal:
      'implement sanitized LWA HTTP response parser test double without network or persistence',
  };
