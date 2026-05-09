export type AmazonSpApiOauthCallbackDryRunControllerWiringStep =
  'Step139-D';

export type AmazonSpApiOauthCallbackDryRunControllerWiringContract = {
  readonly source: 'amazon-sp-api-oauth-callback-dry-run-controller-wiring-contract';
  readonly step: AmazonSpApiOauthCallbackDryRunControllerWiringStep;
  readonly phase: 'oauth-callback-dry-run-controller-wiring-contract-only';

  readonly previousBoundaryStep: 'Step139-C';

  readonly currentScopeNow: {
    readonly defineControllerDryRunWiringContractOnlyNow: true;
    readonly modifyControllerRuntimeNow: false;
    readonly controllerCallsServicePersistenceNow: false;
    readonly oauthCallbackPersistsTokenNow: false;
    readonly repositoryRealWriteNow: false;
    readonly prismaClientWriteNow: false;
    readonly callAmazonNow: false;
  };

  readonly futureControllerDryRunRouteContract: {
    readonly route: 'GET /imports/amazon-sp-api/oauth/callback';
    readonly controllerMayValidateStateNow: true;
    readonly controllerMayResolveCompanyStoreNow: true;
    readonly controllerMayReturnRedactedDryRunDiagnosticNow: true;
    readonly controllerMustForceDryRunNow: true;
    readonly controllerMustNotPersistTokenNow: true;
    readonly controllerMustNotReturnRawAuthorizationCodeNow: true;
    readonly controllerMustNotReturnRawLwaResponseNow: true;
    readonly controllerMustNotReturnRawAccessTokenNow: true;
    readonly controllerMustNotReturnRawRefreshTokenNow: true;
  };

  readonly requiredDryRunDiagnosticShape: {
    readonly accepted: 'boolean';
    readonly source: 'amazon-sp-api-oauth-callback-dry-run-controller-wiring';
    readonly wiringMode: 'contract-only-controller-dry-run-no-persistence';
    readonly stateTrusted: 'boolean';
    readonly companyIdResolved: 'boolean';
    readonly storeIdResolved: 'boolean';
    readonly marketplaceIdResolved: 'boolean';
    readonly regionResolved: 'boolean';
    readonly servicePersistenceDryRunAccepted: 'boolean';
    readonly controllerWiringNow: false;
    readonly oauthCallbackDryRunWiringNow: false;
    readonly oauthCallbackPersistenceWiringNow: false;
    readonly tokenPersistenceDatabaseWriteNow: false;
    readonly plaintextTokenDatabaseWriteNow: false;
    readonly databaseWriteNow: false;
    readonly prismaClientWriteNow: false;
    readonly amazonNetworkCallNow: false;
    readonly rawAuthorizationCodeReturnedNow: false;
    readonly rawLwaResponseReturnedNow: false;
    readonly rawAccessTokenReturnedNow: false;
    readonly rawRefreshTokenReturnedNow: false;
  };

  readonly allowedControllerDryRunOnlyChainLater: readonly [
    'ImportsController.oauthCallback validates state',
    'ImportsController resolves companyId/storeId from trusted state',
    'ImportsController calls service dry-run boundary only',
    'AmazonSpApiTokenExchangeService.runTokenPersistenceE2eServiceOnlyTestDouble with dryRun=true',
    'Controller returns redacted diagnostic only'
  ];

  readonly forbiddenRuntimeNow: {
    readonly importsControllerModifiedNow: false;
    readonly controllerImportsE2eRunnerNow: false;
    readonly controllerImportsRepositoryNow: false;
    readonly controllerCallsServicePersistenceNow: false;
    readonly oauthCallbackPersistsTokenNow: false;
    readonly tokenPersistenceDatabaseWriteNow: false;
    readonly plaintextTokenDatabaseWriteNow: false;
    readonly databaseWriteNow: false;
    readonly prismaClientWriteNow: false;
    readonly amazonNetworkCallNow: false;
    readonly rawAuthorizationCodeReturnedNow: false;
    readonly rawLwaResponseReturnedNow: false;
    readonly rawAccessTokenReturnedNow: false;
    readonly rawRefreshTokenReturnedNow: false;
  };

  readonly requiredRegressionSmokesBeforeControllerImplementation: readonly [
    'smoke:amazon-sp-api-oauth-callback-dry-run-controller-wiring-contract',
    'smoke:amazon-sp-api-oauth-callback-encrypted-token-persistence-boundary-contract',
    'smoke:amazon-sp-api-token-persistence-service-only-e2e-runner-branch-runtime',
    'smoke:amazon-sp-api-token-persistence-service-only-e2e-runner-wiring'
  ];

  readonly allowedNextStepBoundary: {
    readonly proposedNextStep: 'Step139-E';
    readonly proposedNextStepGoal: 'implement OAuth callback dry-run-only controller wiring without persistence';
    readonly controllerRuntimeChangeAllowedNext: true;
    readonly persistenceStillForbiddenNext: true;
    readonly repositoryRealWriteStillForbiddenNext: true;
    readonly rawTokenMustNeverBeReturnedNext: true;
  };

  readonly nextSuggestedStep: 'Step139-E';
  readonly nextSuggestedStepGoal: 'OAuth callback dry-run-only controller wiring implementation';
};

export const amazonSpApiOauthCallbackDryRunControllerWiringContract: AmazonSpApiOauthCallbackDryRunControllerWiringContract =
  {
    source: 'amazon-sp-api-oauth-callback-dry-run-controller-wiring-contract',
    step: 'Step139-D',
    phase: 'oauth-callback-dry-run-controller-wiring-contract-only',

    previousBoundaryStep: 'Step139-C',

    currentScopeNow: {
      defineControllerDryRunWiringContractOnlyNow: true,
      modifyControllerRuntimeNow: false,
      controllerCallsServicePersistenceNow: false,
      oauthCallbackPersistsTokenNow: false,
      repositoryRealWriteNow: false,
      prismaClientWriteNow: false,
      callAmazonNow: false,
    },

    futureControllerDryRunRouteContract: {
      route: 'GET /imports/amazon-sp-api/oauth/callback',
      controllerMayValidateStateNow: true,
      controllerMayResolveCompanyStoreNow: true,
      controllerMayReturnRedactedDryRunDiagnosticNow: true,
      controllerMustForceDryRunNow: true,
      controllerMustNotPersistTokenNow: true,
      controllerMustNotReturnRawAuthorizationCodeNow: true,
      controllerMustNotReturnRawLwaResponseNow: true,
      controllerMustNotReturnRawAccessTokenNow: true,
      controllerMustNotReturnRawRefreshTokenNow: true,
    },

    requiredDryRunDiagnosticShape: {
      accepted: 'boolean',
      source: 'amazon-sp-api-oauth-callback-dry-run-controller-wiring',
      wiringMode: 'contract-only-controller-dry-run-no-persistence',
      stateTrusted: 'boolean',
      companyIdResolved: 'boolean',
      storeIdResolved: 'boolean',
      marketplaceIdResolved: 'boolean',
      regionResolved: 'boolean',
      servicePersistenceDryRunAccepted: 'boolean',
      controllerWiringNow: false,
      oauthCallbackDryRunWiringNow: false,
      oauthCallbackPersistenceWiringNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      plaintextTokenDatabaseWriteNow: false,
      databaseWriteNow: false,
      prismaClientWriteNow: false,
      amazonNetworkCallNow: false,
      rawAuthorizationCodeReturnedNow: false,
      rawLwaResponseReturnedNow: false,
      rawAccessTokenReturnedNow: false,
      rawRefreshTokenReturnedNow: false,
    },

    allowedControllerDryRunOnlyChainLater: [
      'ImportsController.oauthCallback validates state',
      'ImportsController resolves companyId/storeId from trusted state',
      'ImportsController calls service dry-run boundary only',
      'AmazonSpApiTokenExchangeService.runTokenPersistenceE2eServiceOnlyTestDouble with dryRun=true',
      'Controller returns redacted diagnostic only',
    ],

    forbiddenRuntimeNow: {
      importsControllerModifiedNow: false,
      controllerImportsE2eRunnerNow: false,
      controllerImportsRepositoryNow: false,
      controllerCallsServicePersistenceNow: false,
      oauthCallbackPersistsTokenNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      plaintextTokenDatabaseWriteNow: false,
      databaseWriteNow: false,
      prismaClientWriteNow: false,
      amazonNetworkCallNow: false,
      rawAuthorizationCodeReturnedNow: false,
      rawLwaResponseReturnedNow: false,
      rawAccessTokenReturnedNow: false,
      rawRefreshTokenReturnedNow: false,
    },

    requiredRegressionSmokesBeforeControllerImplementation: [
      'smoke:amazon-sp-api-oauth-callback-dry-run-controller-wiring-contract',
      'smoke:amazon-sp-api-oauth-callback-encrypted-token-persistence-boundary-contract',
      'smoke:amazon-sp-api-token-persistence-service-only-e2e-runner-branch-runtime',
      'smoke:amazon-sp-api-token-persistence-service-only-e2e-runner-wiring',
    ],

    allowedNextStepBoundary: {
      proposedNextStep: 'Step139-E',
      proposedNextStepGoal:
        'implement OAuth callback dry-run-only controller wiring without persistence',
      controllerRuntimeChangeAllowedNext: true,
      persistenceStillForbiddenNext: true,
      repositoryRealWriteStillForbiddenNext: true,
      rawTokenMustNeverBeReturnedNext: true,
    },

    nextSuggestedStep: 'Step139-E',
    nextSuggestedStepGoal:
      'OAuth callback dry-run-only controller wiring implementation',
  };
