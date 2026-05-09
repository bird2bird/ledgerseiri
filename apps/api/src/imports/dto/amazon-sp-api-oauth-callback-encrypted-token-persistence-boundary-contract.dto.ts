export type AmazonSpApiOauthCallbackEncryptedTokenPersistenceBoundaryStep =
  'Step139-C';

export type AmazonSpApiOauthCallbackEncryptedTokenPersistenceBoundaryContract = {
  readonly source: 'amazon-sp-api-oauth-callback-encrypted-token-persistence-boundary-contract';
  readonly step: AmazonSpApiOauthCallbackEncryptedTokenPersistenceBoundaryStep;
  readonly phase: 'oauth-callback-persistence-boundary-contract-only';

  readonly previousServiceOnlyWiringStep: 'Step139-A';
  readonly previousServiceOnlyBranchCoverageStep: 'Step139-B';

  readonly currentScopeNow: {
    readonly defineOAuthCallbackPersistenceBoundaryOnlyNow: true;
    readonly modifyControllerRuntimeNow: false;
    readonly wireOAuthCallbackNow: false;
    readonly callServicePersistenceMethodFromControllerNow: false;
    readonly modifyRepositoryNow: false;
    readonly writePrismaNow: false;
    readonly callAmazonNow: false;
    readonly persistTokenNow: false;
  };

  readonly requiredCallbackInputs: {
    readonly authorizationCodeRequired: true;
    readonly stateRequired: true;
    readonly sellingPartnerIdRequired: true;
    readonly marketplaceIdRequired: true;
    readonly regionRequired: true;
    readonly companyIdMustResolveFromTrustedState: true;
    readonly storeIdMustResolveFromTrustedState: true;
    readonly operatorConfirmationRequiredForPersistence: true;
  };

  readonly requiredTrustGatesBeforePersistence: {
    readonly stateSignatureTrusted: true;
    readonly stateNotExpired: true;
    readonly companyIdResolved: true;
    readonly storeIdResolved: true;
    readonly marketplaceIdAllowed: true;
    readonly regionAllowed: true;
    readonly companyStoreAllowlisted: true;
    readonly environmentAllowsPersistence: true;
    readonly dryRunMustBeFalseForPersistence: true;
    readonly operatorConfirmationPresent: true;
  };

  readonly requiredEncryptedPersistenceChain: readonly [
    'OAuth callback receives authorization code and trusted state',
    'AmazonSpApiTokenExchangeService executes guarded LWA exchange',
    'AmazonSpApiTokenExchangeService parses sanitized LWA response',
    'AmazonSpApiTokenExchangeService prepares encrypted token persistence input',
    'AmazonSpApiTokenExchangeService.runTokenPersistenceE2eServiceOnlyTestDouble',
    'AmazonSpApiTokenPersistenceE2eRunner.runTokenPersistenceE2eTestDouble',
    'AmazonSpApiTokenPersistenceOrchestrator.persistTokenExchangeResultTestDouble',
    'AmazonSpApiCredentialRepository.upsertEncryptedCredentialTestDouble'
  ];

  readonly callbackBoundaryResultShape: {
    readonly accepted: 'boolean';
    readonly source: 'amazon-sp-api-oauth-callback-encrypted-token-persistence-boundary';
    readonly boundaryMode: 'contract-only-no-controller-wiring-no-prisma-write';
    readonly stateTrusted: 'boolean';
    readonly companyIdResolved: 'boolean';
    readonly storeIdResolved: 'boolean';
    readonly marketplaceAllowed: 'boolean';
    readonly regionAllowed: 'boolean';
    readonly servicePersistenceAccepted: 'boolean';
    readonly controllerWiringNow: false;
    readonly oauthCallbackPersistenceWiringNow: false;
    readonly amazonNetworkCallNow: false;
    readonly prismaClientWriteNow: false;
    readonly databaseWriteNow: false;
    readonly tokenPersistenceDatabaseWriteNow: false;
    readonly plaintextTokenDatabaseWriteNow: false;
    readonly rawAuthorizationCodeReturnedNow: false;
    readonly rawLwaResponseReturnedNow: false;
    readonly rawAccessTokenReturnedNow: false;
    readonly rawRefreshTokenReturnedNow: false;
  };

  readonly forbiddenRuntimeNow: {
    readonly controllerCallsServicePersistenceNow: false;
    readonly controllerImportsE2eRunnerNow: false;
    readonly controllerImportsRepositoryNow: false;
    readonly oauthCallbackPersistsTokenNow: false;
    readonly prismaClientWriteNow: false;
    readonly databaseWriteNow: false;
    readonly tokenPersistenceDatabaseWriteNow: false;
    readonly plaintextTokenDatabaseWriteNow: false;
    readonly rawAuthorizationCodeReturnedNow: false;
    readonly rawLwaResponseReturnedNow: false;
    readonly rawAccessTokenReturnedNow: false;
    readonly rawRefreshTokenReturnedNow: false;
  };

  readonly allowedNextStepBoundary: {
    readonly proposedNextStep: 'Step139-D';
    readonly proposedNextStepGoal: 'define OAuth callback dry-run-only controller wiring contract';
    readonly controllerMayEnterDryRunBoundaryOnly: true;
    readonly controllerMustNotPersistTokenYet: true;
    readonly repositoryRealWriteStillForbidden: true;
    readonly rawTokenMustNeverBeReturned: true;
  };

  readonly requiredRegressionSmokesBeforeControllerDryRunWiring: readonly [
    'smoke:amazon-sp-api-oauth-callback-encrypted-token-persistence-boundary-contract',
    'smoke:amazon-sp-api-token-persistence-service-only-e2e-runner-branch-runtime',
    'smoke:amazon-sp-api-token-persistence-service-only-e2e-runner-wiring',
    'smoke:amazon-sp-api-token-persistence-pre-wiring-final-handoff-contract',
    'smoke:amazon-sp-api-executable-real-lwa-http-transport-guarded-impl',
    'smoke:amazon-sp-api-executable-lwa-http-transport-branch-runtime'
  ];

  readonly nextSuggestedStep: 'Step139-D';
  readonly nextSuggestedStepGoal: 'OAuth callback dry-run-only controller wiring contract';
};

export const amazonSpApiOauthCallbackEncryptedTokenPersistenceBoundaryContract: AmazonSpApiOauthCallbackEncryptedTokenPersistenceBoundaryContract =
  {
    source:
      'amazon-sp-api-oauth-callback-encrypted-token-persistence-boundary-contract',
    step: 'Step139-C',
    phase: 'oauth-callback-persistence-boundary-contract-only',

    previousServiceOnlyWiringStep: 'Step139-A',
    previousServiceOnlyBranchCoverageStep: 'Step139-B',

    currentScopeNow: {
      defineOAuthCallbackPersistenceBoundaryOnlyNow: true,
      modifyControllerRuntimeNow: false,
      wireOAuthCallbackNow: false,
      callServicePersistenceMethodFromControllerNow: false,
      modifyRepositoryNow: false,
      writePrismaNow: false,
      callAmazonNow: false,
      persistTokenNow: false,
    },

    requiredCallbackInputs: {
      authorizationCodeRequired: true,
      stateRequired: true,
      sellingPartnerIdRequired: true,
      marketplaceIdRequired: true,
      regionRequired: true,
      companyIdMustResolveFromTrustedState: true,
      storeIdMustResolveFromTrustedState: true,
      operatorConfirmationRequiredForPersistence: true,
    },

    requiredTrustGatesBeforePersistence: {
      stateSignatureTrusted: true,
      stateNotExpired: true,
      companyIdResolved: true,
      storeIdResolved: true,
      marketplaceIdAllowed: true,
      regionAllowed: true,
      companyStoreAllowlisted: true,
      environmentAllowsPersistence: true,
      dryRunMustBeFalseForPersistence: true,
      operatorConfirmationPresent: true,
    },

    requiredEncryptedPersistenceChain: [
      'OAuth callback receives authorization code and trusted state',
      'AmazonSpApiTokenExchangeService executes guarded LWA exchange',
      'AmazonSpApiTokenExchangeService parses sanitized LWA response',
      'AmazonSpApiTokenExchangeService prepares encrypted token persistence input',
      'AmazonSpApiTokenExchangeService.runTokenPersistenceE2eServiceOnlyTestDouble',
      'AmazonSpApiTokenPersistenceE2eRunner.runTokenPersistenceE2eTestDouble',
      'AmazonSpApiTokenPersistenceOrchestrator.persistTokenExchangeResultTestDouble',
      'AmazonSpApiCredentialRepository.upsertEncryptedCredentialTestDouble',
    ],

    callbackBoundaryResultShape: {
      accepted: 'boolean',
      source: 'amazon-sp-api-oauth-callback-encrypted-token-persistence-boundary',
      boundaryMode: 'contract-only-no-controller-wiring-no-prisma-write',
      stateTrusted: 'boolean',
      companyIdResolved: 'boolean',
      storeIdResolved: 'boolean',
      marketplaceAllowed: 'boolean',
      regionAllowed: 'boolean',
      servicePersistenceAccepted: 'boolean',
      controllerWiringNow: false,
      oauthCallbackPersistenceWiringNow: false,
      amazonNetworkCallNow: false,
      prismaClientWriteNow: false,
      databaseWriteNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      plaintextTokenDatabaseWriteNow: false,
      rawAuthorizationCodeReturnedNow: false,
      rawLwaResponseReturnedNow: false,
      rawAccessTokenReturnedNow: false,
      rawRefreshTokenReturnedNow: false,
    },

    forbiddenRuntimeNow: {
      controllerCallsServicePersistenceNow: false,
      controllerImportsE2eRunnerNow: false,
      controllerImportsRepositoryNow: false,
      oauthCallbackPersistsTokenNow: false,
      prismaClientWriteNow: false,
      databaseWriteNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      plaintextTokenDatabaseWriteNow: false,
      rawAuthorizationCodeReturnedNow: false,
      rawLwaResponseReturnedNow: false,
      rawAccessTokenReturnedNow: false,
      rawRefreshTokenReturnedNow: false,
    },

    allowedNextStepBoundary: {
      proposedNextStep: 'Step139-D',
      proposedNextStepGoal:
        'define OAuth callback dry-run-only controller wiring contract',
      controllerMayEnterDryRunBoundaryOnly: true,
      controllerMustNotPersistTokenYet: true,
      repositoryRealWriteStillForbidden: true,
      rawTokenMustNeverBeReturned: true,
    },

    requiredRegressionSmokesBeforeControllerDryRunWiring: [
      'smoke:amazon-sp-api-oauth-callback-encrypted-token-persistence-boundary-contract',
      'smoke:amazon-sp-api-token-persistence-service-only-e2e-runner-branch-runtime',
      'smoke:amazon-sp-api-token-persistence-service-only-e2e-runner-wiring',
      'smoke:amazon-sp-api-token-persistence-pre-wiring-final-handoff-contract',
      'smoke:amazon-sp-api-executable-real-lwa-http-transport-guarded-impl',
      'smoke:amazon-sp-api-executable-lwa-http-transport-branch-runtime',
    ],

    nextSuggestedStep: 'Step139-D',
    nextSuggestedStepGoal:
      'OAuth callback dry-run-only controller wiring contract',
  };
