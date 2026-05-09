export type AmazonSpApiRealLwaActivationFeatureGateStep = 'Step137-A';

export type AmazonSpApiRealLwaActivationFeatureGateContract = {
  readonly source: 'amazon-sp-api-real-lwa-activation-feature-gate-contract';
  readonly step: AmazonSpApiRealLwaActivationFeatureGateStep;
  readonly phase: 'contract-only';

  readonly currentDisabledChainPath: 'AmazonSpApiTokenExchangeService.orchestrateRealLwaExchangeChainDisabledLater';
  readonly currentDisabledHttpTransportPath: 'AmazonSpApiTokenExchangeService.executeRealLwaTokenExchangeHttpLater';
  readonly currentRequestBodyBuilderPath: 'AmazonSpApiTokenExchangeService.buildRealLwaTokenExchangeRequestBodyLater';
  readonly currentCallbackPath: 'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeDryRunnable';
  readonly plannedActivationGatePath: 'AmazonSpApiRealLwaActivationGateService.evaluateRealLwaActivationLater';

  readonly activationGateImplementedNow: false;
  readonly callbackRuntimeChangedNow: false;
  readonly controllerRouteChangedNow: false;
  readonly realHttpEnabledNow: false;
  readonly tokenPersistenceChangedNow: false;

  readonly requiredActivationConditions: {
    readonly configValidatorStatusMustBeReady: true;
    readonly clientIdPresent: true;
    readonly clientSecretPresent: true;
    readonly redirectUriPresent: true;
    readonly marketplaceIdPresent: true;
    readonly regionPresent: true;
    readonly tokenEndpointMustBeHttps: true;
    readonly callbackStateMustBeTrusted: true;
    readonly companyIdMustBeResolvedFromTrustedState: true;
    readonly storeIdMustBeResolvedFromTrustedState: true;
    readonly sellingPartnerIdMustBePresent: true;
    readonly authorizationCodeMustBePresent: true;
    readonly redirectUriMustMatchAuthorizationRequest: true;
    readonly serverSideRuntimeGateMustBeEnabled: true;
    readonly environmentMustAllowRealLwaHttp: true;
    readonly companyStoreAllowlistRequiredInitially: true;
    readonly explicitOperatorConfirmationRequiredInitially: true;
  };

  readonly forbiddenActivationShortcuts: {
    readonly envFlagAloneEnablesRealHttp: false;
    readonly frontendCanEnableRealHttp: false;
    readonly queryParamCanEnableRealHttp: false;
    readonly callbackParamCanEnableRealHttp: false;
    readonly unauthenticatedUserCanEnableRealHttp: false;
    readonly missingCompanyScopeCanEnableRealHttp: false;
    readonly missingStoreScopeCanEnableRealHttp: false;
  };

  readonly plannedGateDecisionShape: {
    readonly source: 'amazon-sp-api-real-lwa-activation-gate';
    readonly gateDecision: 'blocked' | 'eligible-later';
    readonly realHttpAllowedNow: false;
    readonly reasonRedacted: true;
    readonly configReady: boolean;
    readonly callbackStateTrusted: boolean;
    readonly companyStoreAllowed: boolean;
    readonly operatorConfirmed: boolean;
    readonly environmentAllowed: boolean;
    readonly nextImplementationStep: 'Step137-B';
  };

  readonly plannedHttpExecutionPolicy: {
    readonly method: 'POST';
    readonly endpoint: 'https://api.amazon.com/auth/o2/token';
    readonly contentType: 'application/x-www-form-urlencoded';
    readonly timeoutMs: 10000;
    readonly retryInitiallyAllowed: false;
    readonly allowedClientLater: 'undici-or-node-fetch-later';
    readonly executableClientUsedNow: false;
  };

  readonly plannedRequestBodyPolicy: {
    readonly grantType: 'authorization_code';
    readonly includesCode: true;
    readonly includesRedirectUri: true;
    readonly includesClientId: true;
    readonly includesClientSecret: true;
    readonly rawBodyMayBeBuiltOnlyInsideServiceLater: true;
    readonly rawBodyMayBeLogged: false;
    readonly rawBodyMayBeReturnedToController: false;
    readonly rawBodyMayBeReturnedToFrontend: false;
  };

  readonly plannedResponsePolicy: {
    readonly rawLwaResponseMayBeParsedInsideServiceLater: true;
    readonly rawLwaResponseMayBeLogged: false;
    readonly rawLwaResponseMayBeReturnedToController: false;
    readonly rawLwaResponseMayBeReturnedToFrontend: false;
    readonly rawAccessTokenMayBeLogged: false;
    readonly rawRefreshTokenMayBeLogged: false;
    readonly rawAccessTokenMayBeReturned: false;
    readonly rawRefreshTokenMayBeReturned: false;
    readonly sanitizedEnvelopeOnly: true;
  };

  readonly plannedPersistenceBoundary: {
    readonly persistenceImplementedNow: false;
    readonly plaintextRefreshTokenMayOnlyEnterEncryptionInputLater: true;
    readonly plaintextAccessTokenMayOnlyEnterEncryptionInputLater: true;
    readonly encryptedRefreshCredentialRequired: true;
    readonly encryptedAccessTokenCacheRequired: true;
    readonly plaintextTokenDatabaseWriteAllowed: false;
    readonly persistenceRequiresSeparateStep: true;
  };

  readonly safetyFlagsNow: {
    readonly activationGateImplementedNow: false;
    readonly realHttpEnabledNow: false;
    readonly callbackRuntimeChangedNow: false;
    readonly controllerRouteChangedNow: false;
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
    readonly implementsActivationGateNow: false;
    readonly enablesRealHttpNow: false;
    readonly wiresCallbackToRealLwaNow: false;
    readonly changesOAuthCallbackRouteNow: false;
    readonly writesTokenPersistenceNow: false;
    readonly enablesReportsApiNow: false;
    readonly createsImportJobNow: false;
    readonly createsImportStagingRowNow: false;
    readonly createsTransactionNow: false;
    readonly createsInventoryMovementNow: false;
    readonly changesFrontendNow: false;
  };

  readonly compatibleRegressionSmokesAfterStep137A: readonly [
    'smoke:amazon-sp-api-real-lwa-exchange-chain-mock-runtime',
    'smoke:amazon-sp-api-real-lwa-exchange-chain-disabled',
    'smoke:amazon-sp-api-lwa-http-transport-mock-runtime',
    'smoke:amazon-sp-api-lwa-http-transport-disabled',
    'smoke:amazon-sp-api-lwa-request-body-builder-mock-runtime',
    'smoke:amazon-sp-api-lwa-request-body-builder-disabled',
    'smoke:amazon-sp-api-real-lwa-http-client-mock-runtime',
    'smoke:amazon-sp-api-real-lwa-http-client-disabled-by-default',
    'smoke:amazon-sp-api-real-lwa-token-exchange-enablement-boundary-contract',
  ];

  readonly contractOnlySmokesToSkipAfterImplementation: readonly [
    'smoke:amazon-sp-api-lwa-request-body-builder-boundary-contract',
    'smoke:amazon-sp-api-lwa-http-execution-boundary-contract',
    'smoke:amazon-sp-api-real-lwa-exchange-chain-boundary-contract',
  ];

  readonly nextSuggestedStep: 'Step137-B';
};

export const amazonSpApiRealLwaActivationFeatureGateContract: AmazonSpApiRealLwaActivationFeatureGateContract =
  {
    source: 'amazon-sp-api-real-lwa-activation-feature-gate-contract',
    step: 'Step137-A',
    phase: 'contract-only',

    currentDisabledChainPath:
      'AmazonSpApiTokenExchangeService.orchestrateRealLwaExchangeChainDisabledLater',
    currentDisabledHttpTransportPath:
      'AmazonSpApiTokenExchangeService.executeRealLwaTokenExchangeHttpLater',
    currentRequestBodyBuilderPath:
      'AmazonSpApiTokenExchangeService.buildRealLwaTokenExchangeRequestBodyLater',
    currentCallbackPath:
      'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeDryRunnable',
    plannedActivationGatePath:
      'AmazonSpApiRealLwaActivationGateService.evaluateRealLwaActivationLater',

    activationGateImplementedNow: false,
    callbackRuntimeChangedNow: false,
    controllerRouteChangedNow: false,
    realHttpEnabledNow: false,
    tokenPersistenceChangedNow: false,

    requiredActivationConditions: {
      configValidatorStatusMustBeReady: true,
      clientIdPresent: true,
      clientSecretPresent: true,
      redirectUriPresent: true,
      marketplaceIdPresent: true,
      regionPresent: true,
      tokenEndpointMustBeHttps: true,
      callbackStateMustBeTrusted: true,
      companyIdMustBeResolvedFromTrustedState: true,
      storeIdMustBeResolvedFromTrustedState: true,
      sellingPartnerIdMustBePresent: true,
      authorizationCodeMustBePresent: true,
      redirectUriMustMatchAuthorizationRequest: true,
      serverSideRuntimeGateMustBeEnabled: true,
      environmentMustAllowRealLwaHttp: true,
      companyStoreAllowlistRequiredInitially: true,
      explicitOperatorConfirmationRequiredInitially: true,
    },

    forbiddenActivationShortcuts: {
      envFlagAloneEnablesRealHttp: false,
      frontendCanEnableRealHttp: false,
      queryParamCanEnableRealHttp: false,
      callbackParamCanEnableRealHttp: false,
      unauthenticatedUserCanEnableRealHttp: false,
      missingCompanyScopeCanEnableRealHttp: false,
      missingStoreScopeCanEnableRealHttp: false,
    },

    plannedGateDecisionShape: {
      source: 'amazon-sp-api-real-lwa-activation-gate',
      gateDecision: 'blocked',
      realHttpAllowedNow: false,
      reasonRedacted: true,
      configReady: false,
      callbackStateTrusted: false,
      companyStoreAllowed: false,
      operatorConfirmed: false,
      environmentAllowed: false,
      nextImplementationStep: 'Step137-B',
    },

    plannedHttpExecutionPolicy: {
      method: 'POST',
      endpoint: 'https://api.amazon.com/auth/o2/token',
      contentType: 'application/x-www-form-urlencoded',
      timeoutMs: 10000,
      retryInitiallyAllowed: false,
      allowedClientLater: 'undici-or-node-fetch-later',
      executableClientUsedNow: false,
    },

    plannedRequestBodyPolicy: {
      grantType: 'authorization_code',
      includesCode: true,
      includesRedirectUri: true,
      includesClientId: true,
      includesClientSecret: true,
      rawBodyMayBeBuiltOnlyInsideServiceLater: true,
      rawBodyMayBeLogged: false,
      rawBodyMayBeReturnedToController: false,
      rawBodyMayBeReturnedToFrontend: false,
    },

    plannedResponsePolicy: {
      rawLwaResponseMayBeParsedInsideServiceLater: true,
      rawLwaResponseMayBeLogged: false,
      rawLwaResponseMayBeReturnedToController: false,
      rawLwaResponseMayBeReturnedToFrontend: false,
      rawAccessTokenMayBeLogged: false,
      rawRefreshTokenMayBeLogged: false,
      rawAccessTokenMayBeReturned: false,
      rawRefreshTokenMayBeReturned: false,
      sanitizedEnvelopeOnly: true,
    },

    plannedPersistenceBoundary: {
      persistenceImplementedNow: false,
      plaintextRefreshTokenMayOnlyEnterEncryptionInputLater: true,
      plaintextAccessTokenMayOnlyEnterEncryptionInputLater: true,
      encryptedRefreshCredentialRequired: true,
      encryptedAccessTokenCacheRequired: true,
      plaintextTokenDatabaseWriteAllowed: false,
      persistenceRequiresSeparateStep: true,
    },

    safetyFlagsNow: {
      activationGateImplementedNow: false,
      realHttpEnabledNow: false,
      callbackRuntimeChangedNow: false,
      controllerRouteChangedNow: false,
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
      implementsActivationGateNow: false,
      enablesRealHttpNow: false,
      wiresCallbackToRealLwaNow: false,
      changesOAuthCallbackRouteNow: false,
      writesTokenPersistenceNow: false,
      enablesReportsApiNow: false,
      createsImportJobNow: false,
      createsImportStagingRowNow: false,
      createsTransactionNow: false,
      createsInventoryMovementNow: false,
      changesFrontendNow: false,
    },

    compatibleRegressionSmokesAfterStep137A: [
      'smoke:amazon-sp-api-real-lwa-exchange-chain-mock-runtime',
      'smoke:amazon-sp-api-real-lwa-exchange-chain-disabled',
      'smoke:amazon-sp-api-lwa-http-transport-mock-runtime',
      'smoke:amazon-sp-api-lwa-http-transport-disabled',
      'smoke:amazon-sp-api-lwa-request-body-builder-mock-runtime',
      'smoke:amazon-sp-api-lwa-request-body-builder-disabled',
      'smoke:amazon-sp-api-real-lwa-http-client-mock-runtime',
      'smoke:amazon-sp-api-real-lwa-http-client-disabled-by-default',
      'smoke:amazon-sp-api-real-lwa-token-exchange-enablement-boundary-contract',
    ],

    contractOnlySmokesToSkipAfterImplementation: [
      'smoke:amazon-sp-api-lwa-request-body-builder-boundary-contract',
      'smoke:amazon-sp-api-lwa-http-execution-boundary-contract',
      'smoke:amazon-sp-api-real-lwa-exchange-chain-boundary-contract',
    ],

    nextSuggestedStep: 'Step137-B',
  };
