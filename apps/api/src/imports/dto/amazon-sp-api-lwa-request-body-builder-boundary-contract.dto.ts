export type AmazonSpApiLwaRequestBodyBuilderBoundaryStep = 'Step136-D';

export type AmazonSpApiLwaRequestBodyBuilderBoundaryContract = {
  readonly source: 'amazon-sp-api-lwa-request-body-builder-boundary-contract';
  readonly step: AmazonSpApiLwaRequestBodyBuilderBoundaryStep;
  readonly phase: 'contract-only';

  readonly currentHttpPreparationPath: 'AmazonSpApiTokenExchangeService.prepareRealLwaHttpExchangeRequestDisabled';
  readonly plannedRequestBodyBuilderPath: 'AmazonSpApiTokenExchangeService.buildRealLwaTokenExchangeRequestBodyLater';
  readonly currentCallbackExchangePath: 'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeDryRunnable';

  readonly requestBodyBuilderImplementedNow: false;
  readonly requestBodyConstructedNow: false;
  readonly requestBodyLoggedNow: false;
  readonly requestBodyReturnedToControllerNow: false;
  readonly requestBodyReturnedToFrontendNow: false;
  readonly httpExecutedNow: false;
  readonly callbackRuntimeChangedNow: false;

  readonly plannedEncoding: {
    readonly contentType: 'application/x-www-form-urlencoded';
    readonly encodingApi: 'URLSearchParams';
    readonly method: 'POST';
    readonly endpoint: 'https://api.amazon.com/auth/o2/token';
    readonly sortedFieldOrderRequired: true;
  };

  readonly requiredFormFields: readonly [
    'grant_type',
    'code',
    'redirect_uri',
    'client_id',
    'client_secret',
  ];

  readonly requiredFormFieldValues: {
    readonly grant_type: 'authorization_code';
    readonly code: 'callback authorization code';
    readonly redirect_uri: 'must match authorization-url redirect_uri';
    readonly client_id: 'server-side LWA client id';
    readonly client_secret: 'server-side LWA client secret';
  };

  readonly sensitiveInputBoundary: {
    readonly authorizationCodeMayEnterBuilderInput: true;
    readonly clientSecretMayEnterBuilderInput: true;
    readonly clientIdMayEnterBuilderInput: true;
    readonly rawAuthorizationCodeMayBeEncodedIntoRequestBody: true;
    readonly rawClientSecretMayBeEncodedIntoRequestBody: true;
    readonly rawClientIdMayBeEncodedIntoRequestBody: true;
    readonly rawAuthorizationCodeMayBeLogged: false;
    readonly rawClientSecretMayBeLogged: false;
    readonly rawClientIdMayBeLogged: false;
    readonly rawRequestBodyMayBeLogged: false;
    readonly rawRequestBodyMayBeReturned: false;
  };

  readonly plannedBuilderOutput: {
    readonly returnsRawBodyOnlyToHttpTransportLayer: true;
    readonly returnsSanitizedShapeToCaller: true;
    readonly sanitizedShapeFields: readonly [
      'method',
      'tokenEndpointHost',
      'tokenEndpointPath',
      'contentType',
      'grantType',
      'formFieldPresence',
      'requestBodyConstructedNow',
      'requestBodyLoggedNow',
      'responseBodyParsedNow',
    ];
    readonly forbiddenSanitizedShapeFields: readonly [
      'code',
      'client_id',
      'client_secret',
      'authorizationCode',
      'clientId',
      'clientSecret',
      'requestBody',
      'rawBody',
    ];
  };

  readonly validationRules: {
    readonly rejectMissingAuthorizationCode: true;
    readonly rejectMissingRedirectUri: true;
    readonly rejectMissingClientId: true;
    readonly rejectMissingClientSecret: true;
    readonly rejectNonHttpsTokenEndpoint: true;
    readonly rejectMismatchedRedirectUri: true;
    readonly rejectNonReadyConfigValidator: true;
    readonly rejectDisabledServerFeatureGate: true;
  };

  readonly safetyFlagsNow: {
    readonly buildRequestBodyNow: false;
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
    readonly rawRefreshTokenReturnedNow: false;
    readonly rawAccessTokenReturnedNow: false;
  };

  readonly explicitNonGoals: {
    readonly implementsRequestBodyBuilderNow: false;
    readonly constructsUrlSearchParamsNow: false;
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

  readonly nextSuggestedStep: 'Step136-E';
};

export const amazonSpApiLwaRequestBodyBuilderBoundaryContract: AmazonSpApiLwaRequestBodyBuilderBoundaryContract =
  {
    source: 'amazon-sp-api-lwa-request-body-builder-boundary-contract',
    step: 'Step136-D',
    phase: 'contract-only',

    currentHttpPreparationPath:
      'AmazonSpApiTokenExchangeService.prepareRealLwaHttpExchangeRequestDisabled',
    plannedRequestBodyBuilderPath:
      'AmazonSpApiTokenExchangeService.buildRealLwaTokenExchangeRequestBodyLater',
    currentCallbackExchangePath:
      'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeDryRunnable',

    requestBodyBuilderImplementedNow: false,
    requestBodyConstructedNow: false,
    requestBodyLoggedNow: false,
    requestBodyReturnedToControllerNow: false,
    requestBodyReturnedToFrontendNow: false,
    httpExecutedNow: false,
    callbackRuntimeChangedNow: false,

    plannedEncoding: {
      contentType: 'application/x-www-form-urlencoded',
      encodingApi: 'URLSearchParams',
      method: 'POST',
      endpoint: 'https://api.amazon.com/auth/o2/token',
      sortedFieldOrderRequired: true,
    },

    requiredFormFields: [
      'grant_type',
      'code',
      'redirect_uri',
      'client_id',
      'client_secret',
    ],

    requiredFormFieldValues: {
      grant_type: 'authorization_code',
      code: 'callback authorization code',
      redirect_uri: 'must match authorization-url redirect_uri',
      client_id: 'server-side LWA client id',
      client_secret: 'server-side LWA client secret',
    },

    sensitiveInputBoundary: {
      authorizationCodeMayEnterBuilderInput: true,
      clientSecretMayEnterBuilderInput: true,
      clientIdMayEnterBuilderInput: true,
      rawAuthorizationCodeMayBeEncodedIntoRequestBody: true,
      rawClientSecretMayBeEncodedIntoRequestBody: true,
      rawClientIdMayBeEncodedIntoRequestBody: true,
      rawAuthorizationCodeMayBeLogged: false,
      rawClientSecretMayBeLogged: false,
      rawClientIdMayBeLogged: false,
      rawRequestBodyMayBeLogged: false,
      rawRequestBodyMayBeReturned: false,
    },

    plannedBuilderOutput: {
      returnsRawBodyOnlyToHttpTransportLayer: true,
      returnsSanitizedShapeToCaller: true,
      sanitizedShapeFields: [
        'method',
        'tokenEndpointHost',
        'tokenEndpointPath',
        'contentType',
        'grantType',
        'formFieldPresence',
        'requestBodyConstructedNow',
        'requestBodyLoggedNow',
        'responseBodyParsedNow',
      ],
      forbiddenSanitizedShapeFields: [
        'code',
        'client_id',
        'client_secret',
        'authorizationCode',
        'clientId',
        'clientSecret',
        'requestBody',
        'rawBody',
      ],
    },

    validationRules: {
      rejectMissingAuthorizationCode: true,
      rejectMissingRedirectUri: true,
      rejectMissingClientId: true,
      rejectMissingClientSecret: true,
      rejectNonHttpsTokenEndpoint: true,
      rejectMismatchedRedirectUri: true,
      rejectNonReadyConfigValidator: true,
      rejectDisabledServerFeatureGate: true,
    },

    safetyFlagsNow: {
      buildRequestBodyNow: false,
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
      rawRefreshTokenReturnedNow: false,
      rawAccessTokenReturnedNow: false,
    },

    explicitNonGoals: {
      implementsRequestBodyBuilderNow: false,
      constructsUrlSearchParamsNow: false,
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

    nextSuggestedStep: 'Step136-E',
  };
