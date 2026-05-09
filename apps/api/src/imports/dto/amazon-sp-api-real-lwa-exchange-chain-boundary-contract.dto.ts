export type AmazonSpApiRealLwaExchangeChainBoundaryStep = 'Step136-J';

export type AmazonSpApiRealLwaExchangeChainBoundaryContract = {
  readonly source: 'amazon-sp-api-real-lwa-exchange-chain-boundary-contract';
  readonly step: AmazonSpApiRealLwaExchangeChainBoundaryStep;
  readonly phase: 'contract-only';

  readonly currentConfigValidatorPath: 'AmazonSpApiLwaEnvConfigValidationService.validateFromProcessEnv';
  readonly currentRequestBodyBuilderPath: 'AmazonSpApiTokenExchangeService.buildRealLwaTokenExchangeRequestBodyLater';
  readonly currentHttpTransportPath: 'AmazonSpApiTokenExchangeService.executeRealLwaTokenExchangeHttpLater';
  readonly currentDisabledExchangePath: 'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeWithLwaLater';
  readonly currentCallbackExchangePath: 'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeDryRunnable';
  readonly plannedOrchestratorPath: 'AmazonSpApiTokenExchangeService.orchestrateRealLwaExchangeChainDisabledLater';

  readonly orchestratorImplementedNow: false;
  readonly callbackRuntimeChangedNow: false;
  readonly controllerRouteChangedNow: false;
  readonly realHttpEnabledNow: false;
  readonly tokenPersistenceChangedNow: false;

  readonly plannedChainOrder: readonly [
    'validate-config',
    'validate-callback-state',
    'build-request-body',
    'execute-http-transport',
    'sanitize-lwa-response',
    'prepare-encrypted-token-persistence-input',
  ];

  readonly chainPreconditions: {
    readonly configValidatorMustBeReady: true;
    readonly callbackStateMustBeTrusted: true;
    readonly companyIdMustBeResolvedFromTrustedState: true;
    readonly storeIdMustBeResolvedFromTrustedState: true;
    readonly authorizationCodeMustBePresent: true;
    readonly sellingPartnerIdMustBePresent: true;
    readonly redirectUriMustMatchAuthorizationUrl: true;
    readonly serverSideFeatureGateMustBeEnabledLater: true;
    readonly envFlagAloneIsNotEnough: true;
  };

  readonly chainStageContracts: {
    readonly configValidator: {
      readonly mayReadServerEnv: true;
      readonly mayReturnRawSecret: false;
      readonly outputMustBeSanitized: true;
    };
    readonly requestBodyBuilder: {
      readonly mayUseAuthorizationCodeInsideBuilderLater: true;
      readonly mayUseClientSecretInsideBuilderLater: true;
      readonly mayReturnRawRequestBodyToController: false;
      readonly mayLogRawRequestBody: false;
    };
    readonly httpTransport: {
      readonly mayReceiveRawBodyFromBuilderInsideServiceLater: true;
      readonly mayExecuteHttpNow: false;
      readonly mayUseFetchNow: false;
      readonly mayUseAxiosNow: false;
      readonly mayUseHttpRequestNow: false;
      readonly mayReturnRawLwaResponse: false;
      readonly mayLogRawLwaResponse: false;
    };
    readonly tokenEnvelope: {
      readonly mayParseAccessTokenInsideTransportLater: true;
      readonly mayParseRefreshTokenInsideTransportLater: true;
      readonly mayReturnRawAccessToken: false;
      readonly mayReturnRawRefreshToken: false;
      readonly mustReturnSanitizedEnvelopeOnly: true;
    };
    readonly persistenceInput: {
      readonly mayPrepareEncryptedPersistenceInputLater: true;
      readonly tokenPersistenceDatabaseWriteNow: false;
      readonly plaintextTokenDatabaseWriteAllowed: false;
    };
  };

  readonly plannedSanitizedSuccessEnvelope: {
    readonly accepted: true;
    readonly source: 'amazon-sp-api-real-lwa-exchange-chain';
    readonly transportMode: 'real-lwa-http';
    readonly tokenExchangeHttpCallNow: true;
    readonly lwaHttpCallNow: true;
    readonly realSpApiRequestNow: false;
    readonly rawAccessTokenReturnedNow: false;
    readonly rawRefreshTokenReturnedNow: false;
    readonly rawRequestBodyReturnedNow: false;
    readonly rawLwaResponseReturnedNow: false;
    readonly encryptedRefreshCredentialInputPreparedLater: true;
    readonly encryptedAccessTokenCacheInputPreparedLater: true;
  };

  readonly plannedSanitizedFailureEnvelope: {
    readonly accepted: false;
    readonly source: 'amazon-sp-api-real-lwa-exchange-chain';
    readonly errorStageIncluded: true;
    readonly errorReasonRedacted: true;
    readonly rawRequestBodyReturnedNow: false;
    readonly rawLwaResponseReturnedNow: false;
    readonly rawAccessTokenReturnedNow: false;
    readonly rawRefreshTokenReturnedNow: false;
    readonly tokenPersistenceDatabaseWriteNow: false;
  };

  readonly safetyFlagsNow: {
    readonly orchestratorImplementedNow: false;
    readonly buildRequestBodyNow: false;
    readonly httpTransportImplementedNow: false;
    readonly httpExecutedNow: false;
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
    readonly rawLwaResponseReturnedNow: false;
    readonly rawAccessTokenReturnedNow: false;
    readonly rawRefreshTokenReturnedNow: false;
  };

  readonly explicitNonGoals: {
    readonly implementsOrchestratorNow: false;
    readonly wiresCallbackToRealLwaNow: false;
    readonly changesOAuthCallbackRouteNow: false;
    readonly enablesRealHttpNow: false;
    readonly writesTokenPersistenceNow: false;
    readonly enablesReportsApiNow: false;
    readonly createsImportJobNow: false;
    readonly createsImportStagingRowNow: false;
    readonly createsTransactionNow: false;
    readonly createsInventoryMovementNow: false;
    readonly changesFrontendNow: false;
  };

  readonly compatibleRegressionSmokesAfterImplementation: readonly [
    'smoke:amazon-sp-api-lwa-http-transport-mock-runtime',
    'smoke:amazon-sp-api-lwa-http-transport-disabled',
    'smoke:amazon-sp-api-lwa-request-body-builder-mock-runtime',
    'smoke:amazon-sp-api-lwa-request-body-builder-disabled',
    'smoke:amazon-sp-api-real-lwa-http-client-mock-runtime',
    'smoke:amazon-sp-api-real-lwa-http-client-disabled-by-default',
    'smoke:amazon-sp-api-real-lwa-token-exchange-enablement-boundary-contract',
  ];

  readonly contractOnlySmokesToSkipAfterImplementation: readonly [
    'smoke:amazon-sp-api-lwa-http-execution-boundary-contract',
    'smoke:amazon-sp-api-lwa-request-body-builder-boundary-contract',
  ];

  readonly nextSuggestedStep: 'Step136-K';
};

export const amazonSpApiRealLwaExchangeChainBoundaryContract: AmazonSpApiRealLwaExchangeChainBoundaryContract =
  {
    source: 'amazon-sp-api-real-lwa-exchange-chain-boundary-contract',
    step: 'Step136-J',
    phase: 'contract-only',

    currentConfigValidatorPath:
      'AmazonSpApiLwaEnvConfigValidationService.validateFromProcessEnv',
    currentRequestBodyBuilderPath:
      'AmazonSpApiTokenExchangeService.buildRealLwaTokenExchangeRequestBodyLater',
    currentHttpTransportPath:
      'AmazonSpApiTokenExchangeService.executeRealLwaTokenExchangeHttpLater',
    currentDisabledExchangePath:
      'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeWithLwaLater',
    currentCallbackExchangePath:
      'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeDryRunnable',
    plannedOrchestratorPath:
      'AmazonSpApiTokenExchangeService.orchestrateRealLwaExchangeChainDisabledLater',

    orchestratorImplementedNow: false,
    callbackRuntimeChangedNow: false,
    controllerRouteChangedNow: false,
    realHttpEnabledNow: false,
    tokenPersistenceChangedNow: false,

    plannedChainOrder: [
      'validate-config',
      'validate-callback-state',
      'build-request-body',
      'execute-http-transport',
      'sanitize-lwa-response',
      'prepare-encrypted-token-persistence-input',
    ],

    chainPreconditions: {
      configValidatorMustBeReady: true,
      callbackStateMustBeTrusted: true,
      companyIdMustBeResolvedFromTrustedState: true,
      storeIdMustBeResolvedFromTrustedState: true,
      authorizationCodeMustBePresent: true,
      sellingPartnerIdMustBePresent: true,
      redirectUriMustMatchAuthorizationUrl: true,
      serverSideFeatureGateMustBeEnabledLater: true,
      envFlagAloneIsNotEnough: true,
    },

    chainStageContracts: {
      configValidator: {
        mayReadServerEnv: true,
        mayReturnRawSecret: false,
        outputMustBeSanitized: true,
      },
      requestBodyBuilder: {
        mayUseAuthorizationCodeInsideBuilderLater: true,
        mayUseClientSecretInsideBuilderLater: true,
        mayReturnRawRequestBodyToController: false,
        mayLogRawRequestBody: false,
      },
      httpTransport: {
        mayReceiveRawBodyFromBuilderInsideServiceLater: true,
        mayExecuteHttpNow: false,
        mayUseFetchNow: false,
        mayUseAxiosNow: false,
        mayUseHttpRequestNow: false,
        mayReturnRawLwaResponse: false,
        mayLogRawLwaResponse: false,
      },
      tokenEnvelope: {
        mayParseAccessTokenInsideTransportLater: true,
        mayParseRefreshTokenInsideTransportLater: true,
        mayReturnRawAccessToken: false,
        mayReturnRawRefreshToken: false,
        mustReturnSanitizedEnvelopeOnly: true,
      },
      persistenceInput: {
        mayPrepareEncryptedPersistenceInputLater: true,
        tokenPersistenceDatabaseWriteNow: false,
        plaintextTokenDatabaseWriteAllowed: false,
      },
    },

    plannedSanitizedSuccessEnvelope: {
      accepted: true,
      source: 'amazon-sp-api-real-lwa-exchange-chain',
      transportMode: 'real-lwa-http',
      tokenExchangeHttpCallNow: true,
      lwaHttpCallNow: true,
      realSpApiRequestNow: false,
      rawAccessTokenReturnedNow: false,
      rawRefreshTokenReturnedNow: false,
      rawRequestBodyReturnedNow: false,
      rawLwaResponseReturnedNow: false,
      encryptedRefreshCredentialInputPreparedLater: true,
      encryptedAccessTokenCacheInputPreparedLater: true,
    },

    plannedSanitizedFailureEnvelope: {
      accepted: false,
      source: 'amazon-sp-api-real-lwa-exchange-chain',
      errorStageIncluded: true,
      errorReasonRedacted: true,
      rawRequestBodyReturnedNow: false,
      rawLwaResponseReturnedNow: false,
      rawAccessTokenReturnedNow: false,
      rawRefreshTokenReturnedNow: false,
      tokenPersistenceDatabaseWriteNow: false,
    },

    safetyFlagsNow: {
      orchestratorImplementedNow: false,
      buildRequestBodyNow: false,
      httpTransportImplementedNow: false,
      httpExecutedNow: false,
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
      rawLwaResponseReturnedNow: false,
      rawAccessTokenReturnedNow: false,
      rawRefreshTokenReturnedNow: false,
    },

    explicitNonGoals: {
      implementsOrchestratorNow: false,
      wiresCallbackToRealLwaNow: false,
      changesOAuthCallbackRouteNow: false,
      enablesRealHttpNow: false,
      writesTokenPersistenceNow: false,
      enablesReportsApiNow: false,
      createsImportJobNow: false,
      createsImportStagingRowNow: false,
      createsTransactionNow: false,
      createsInventoryMovementNow: false,
      changesFrontendNow: false,
    },

    compatibleRegressionSmokesAfterImplementation: [
      'smoke:amazon-sp-api-lwa-http-transport-mock-runtime',
      'smoke:amazon-sp-api-lwa-http-transport-disabled',
      'smoke:amazon-sp-api-lwa-request-body-builder-mock-runtime',
      'smoke:amazon-sp-api-lwa-request-body-builder-disabled',
      'smoke:amazon-sp-api-real-lwa-http-client-mock-runtime',
      'smoke:amazon-sp-api-real-lwa-http-client-disabled-by-default',
      'smoke:amazon-sp-api-real-lwa-token-exchange-enablement-boundary-contract',
    ],

    contractOnlySmokesToSkipAfterImplementation: [
      'smoke:amazon-sp-api-lwa-http-execution-boundary-contract',
      'smoke:amazon-sp-api-lwa-request-body-builder-boundary-contract',
    ],

    nextSuggestedStep: 'Step136-K',
  };
