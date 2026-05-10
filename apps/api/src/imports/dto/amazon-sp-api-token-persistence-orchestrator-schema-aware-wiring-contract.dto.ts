export type AmazonSpApiTokenPersistenceOrchestratorSchemaAwareWiringStep =
  'Step139-V4';

export type AmazonSpApiTokenPersistenceOrchestratorSchemaAwareWiringContract = {
  readonly source: 'amazon-sp-api-token-persistence-orchestrator-schema-aware-wiring-contract';
  readonly step: AmazonSpApiTokenPersistenceOrchestratorSchemaAwareWiringStep;
  readonly phase: 'orchestrator-schema-aware-wiring-contract-only';

  readonly previousRepositorySchemaAwareImplementationStep: 'Step139-V3';
  readonly previousRepositorySchemaAlignmentContractStep: 'Step139-V2';
  readonly previousSchemaAwareRealDbAdapterSmokeStep: 'Step139-V';
  readonly previousControllerRealWriteBranchRuntimeStep: 'Step139-U';
  readonly previousControllerRealWriteImplementationStep: 'Step139-T';

  readonly currentScopeNow: {
    readonly defineOrchestratorSchemaAwareWiringContractOnlyNow: true;
    readonly modifyOrchestratorRuntimeNow: false;
    readonly modifyRepositoryRuntimeNow: false;
    readonly modifyControllerRuntimeNow: false;
    readonly modifyPrismaSchemaNow: false;
    readonly writeDatabaseNow: false;
    readonly runAmazonNetworkCallNow: false;
  };

  readonly currentRuntimeStateNow: {
    readonly repositorySchemaAwareMethodExistsNow: true;
    readonly repositorySchemaAwareMethodName: 'upsertEncryptedCredentialSchemaAwareRealWrite';
    readonly orchestratorStillCallsLegacyRepositoryMethodNow: true;
    readonly legacyRepositoryMethodName: 'upsertEncryptedCredentialRealWrite';
    readonly controllerStillCallsExistingOrchestratorMethodNow: true;
    readonly existingOrchestratorMethodName: 'persistEncryptedTokensRealWrite';
  };

  readonly proposedOrchestratorRuntimePlanLater: {
    readonly proposedNewOrchestratorMethod: 'persistEncryptedTokensSchemaAwareRealWrite';
    readonly shouldPreserveExistingLegacyMethodTemporarily: true;
    readonly shouldCallRepositorySchemaAwareMethod: true;
    readonly shouldNotCallLegacyRepositoryMethodInNewPath: true;
    readonly shouldAcceptSchemaAwarePrismaClient: true;
    readonly shouldReturnSchemaAwareRepositoryShapes: true;
    readonly shouldKeepNoAmazonNetworkCall: true;
    readonly shouldKeepNoPlaintextToken: true;
    readonly shouldKeepNoRawTokenReturn: true;
  };

  readonly futureOrchestratorInputShapeLater: {
    readonly companyId: 'string';
    readonly storeId: 'string';
    readonly marketplaceId: 'string';
    readonly region: 'string';
    readonly sellingPartnerId: 'string';
    readonly transportAccepted: 'boolean';
    readonly parserAccepted: 'boolean';
    readonly persistenceInputAccepted: 'boolean';
    readonly encryptedRefreshToken: 'string';
    readonly encryptedAccessTokenCache: 'string-or-null';
    readonly accessTokenExpiresAt: 'Date-or-iso-string-or-null';
    readonly refreshTokenFingerprint: 'string';
    readonly accessTokenFingerprint: 'string-or-null';
    readonly encryptionKeyId: 'string';
    readonly encryptionAlgorithm: 'string';
    readonly tokenVersion: 'number';
    readonly status: 'active-or-revoked';
    readonly lastValidatedAt: 'Date-or-iso-string-or-null';
    readonly revokedAt: 'Date-or-iso-string-or-null';
  };

  readonly futureOrchestratorResultShapeLater: {
    readonly accepted: 'boolean';
    readonly source: 'amazon-sp-api-token-persistence-orchestrator-schema-aware-real-write';
    readonly orchestratorMode: 'repository-schema-aware-real-write-wiring';
    readonly repositoryMethodCalled: 'upsertEncryptedCredentialSchemaAwareRealWrite';
    readonly repositoryAccepted: 'boolean';
    readonly repositoryReason: 'string';
    readonly connectionWriteNow: 'boolean';
    readonly credentialWriteNow: 'boolean';
    readonly accessTokenCacheWriteNow: 'boolean';
    readonly tokenPersistenceDatabaseWriteNow: 'boolean';
    readonly databaseWriteNow: 'boolean';
    readonly prismaClientWriteNow: 'boolean';
    readonly plaintextTokenDatabaseWriteNow: false;
    readonly amazonNetworkCallNow: false;
    readonly rawAccessTokenReturnedNow: false;
    readonly rawRefreshTokenReturnedNow: false;
    readonly rawAuthorizationCodeReturnedNow: false;
    readonly rawLwaResponseReturnedNow: false;
    readonly persistedConnectionShape: {
      readonly id: 'string-or-null';
      readonly companyId: 'string';
      readonly storeId: 'string';
      readonly marketplaceId: 'string';
      readonly region: 'string';
      readonly sellingPartnerIdRedacted: 'string';
      readonly status: 'CONNECTED-or-string';
      readonly connectedAt: 'iso-date-string-or-null';
    } | null;
    readonly persistedCredentialShape: {
      readonly id: 'string-or-null';
      readonly connectionId: 'string-or-null';
      readonly encryptionKeyId: 'string';
      readonly encryptionAlgorithm: 'string';
      readonly tokenVersion: 'number';
      readonly rotatedAt: 'iso-date-string-or-null';
      readonly revokedAt: 'iso-date-string-or-null';
    } | null;
    readonly persistedAccessTokenCacheShape: {
      readonly id: 'string-or-null';
      readonly connectionId: 'string-or-null';
      readonly expiresAt: 'iso-date-string-or-null';
    } | null;
  };

  readonly requiredSchemaAwareWiringBehaviorLater: {
    readonly validateTransportParserPersistenceGatesBeforeRepositoryCall: true;
    readonly rejectWhenSchemaAwarePrismaClientMissing: true;
    readonly callRepositorySchemaAwareMethodOnlyWhenReady: true;
    readonly mapRepositoryConnectionShapeToOrchestratorResult: true;
    readonly mapRepositoryCredentialShapeToOrchestratorResult: true;
    readonly mapRepositoryAccessTokenCacheShapeToOrchestratorResult: true;
    readonly preserveLegacyMethodForCompatibility: true;
  };

  readonly forbiddenRuntimeNowAndLater: {
    readonly orchestratorCallsAmazonNetwork: false;
    readonly orchestratorDecryptsToken: false;
    readonly orchestratorWritesPlaintextToken: false;
    readonly orchestratorReturnsRawAccessToken: false;
    readonly orchestratorReturnsRawRefreshToken: false;
    readonly orchestratorReturnsRawAuthorizationCode: false;
    readonly orchestratorReturnsRawLwaResponse: false;
    readonly controllerCallsRepositoryDirectly: false;
  };

  readonly requiredRegressionSmokesBeforeOrchestratorImplementation: readonly [
    'smoke:amazon-sp-api-token-persistence-orchestrator-schema-aware-wiring-contract',
    'smoke:amazon-sp-api-credential-repository-schema-aware-real-write-implementation',
    'smoke:amazon-sp-api-credential-repository-schema-alignment-contract',
    'smoke:amazon-sp-api-oauth-callback-real-db-guarded-runtime',
    'smoke:amazon-sp-api-token-persistence-orchestrator-real-write-branch-runtime'
  ];

  readonly allowedNextStepBoundary: {
    readonly proposedNextStep: 'Step139-V5';
    readonly proposedNextStepGoal: 'implement schema-aware token persistence orchestrator method';
    readonly orchestratorRuntimeChangeAllowedNext: true;
    readonly repositoryRuntimeChangeAllowedNext: false;
    readonly controllerRuntimeChangeAllowedNext: false;
    readonly prismaSchemaChangeAllowedNext: false;
    readonly rawTokenMustNeverBeReturnedNext: true;
  };

  readonly nextSuggestedStep: 'Step139-V5';
  readonly nextSuggestedStepGoal: 'Schema-aware token persistence orchestrator method implementation';
};

export const amazonSpApiTokenPersistenceOrchestratorSchemaAwareWiringContract: AmazonSpApiTokenPersistenceOrchestratorSchemaAwareWiringContract =
  {
    source:
      'amazon-sp-api-token-persistence-orchestrator-schema-aware-wiring-contract',
    step: 'Step139-V4',
    phase: 'orchestrator-schema-aware-wiring-contract-only',

    previousRepositorySchemaAwareImplementationStep: 'Step139-V3',
    previousRepositorySchemaAlignmentContractStep: 'Step139-V2',
    previousSchemaAwareRealDbAdapterSmokeStep: 'Step139-V',
    previousControllerRealWriteBranchRuntimeStep: 'Step139-U',
    previousControllerRealWriteImplementationStep: 'Step139-T',

    currentScopeNow: {
      defineOrchestratorSchemaAwareWiringContractOnlyNow: true,
      modifyOrchestratorRuntimeNow: false,
      modifyRepositoryRuntimeNow: false,
      modifyControllerRuntimeNow: false,
      modifyPrismaSchemaNow: false,
      writeDatabaseNow: false,
      runAmazonNetworkCallNow: false,
    },

    currentRuntimeStateNow: {
      repositorySchemaAwareMethodExistsNow: true,
      repositorySchemaAwareMethodName:
        'upsertEncryptedCredentialSchemaAwareRealWrite',
      orchestratorStillCallsLegacyRepositoryMethodNow: true,
      legacyRepositoryMethodName: 'upsertEncryptedCredentialRealWrite',
      controllerStillCallsExistingOrchestratorMethodNow: true,
      existingOrchestratorMethodName: 'persistEncryptedTokensRealWrite',
    },

    proposedOrchestratorRuntimePlanLater: {
      proposedNewOrchestratorMethod: 'persistEncryptedTokensSchemaAwareRealWrite',
      shouldPreserveExistingLegacyMethodTemporarily: true,
      shouldCallRepositorySchemaAwareMethod: true,
      shouldNotCallLegacyRepositoryMethodInNewPath: true,
      shouldAcceptSchemaAwarePrismaClient: true,
      shouldReturnSchemaAwareRepositoryShapes: true,
      shouldKeepNoAmazonNetworkCall: true,
      shouldKeepNoPlaintextToken: true,
      shouldKeepNoRawTokenReturn: true,
    },

    futureOrchestratorInputShapeLater: {
      companyId: 'string',
      storeId: 'string',
      marketplaceId: 'string',
      region: 'string',
      sellingPartnerId: 'string',
      transportAccepted: 'boolean',
      parserAccepted: 'boolean',
      persistenceInputAccepted: 'boolean',
      encryptedRefreshToken: 'string',
      encryptedAccessTokenCache: 'string-or-null',
      accessTokenExpiresAt: 'Date-or-iso-string-or-null',
      refreshTokenFingerprint: 'string',
      accessTokenFingerprint: 'string-or-null',
      encryptionKeyId: 'string',
      encryptionAlgorithm: 'string',
      tokenVersion: 'number',
      status: 'active-or-revoked',
      lastValidatedAt: 'Date-or-iso-string-or-null',
      revokedAt: 'Date-or-iso-string-or-null',
    },

    futureOrchestratorResultShapeLater: {
      accepted: 'boolean',
      source:
        'amazon-sp-api-token-persistence-orchestrator-schema-aware-real-write',
      orchestratorMode: 'repository-schema-aware-real-write-wiring',
      repositoryMethodCalled: 'upsertEncryptedCredentialSchemaAwareRealWrite',
      repositoryAccepted: 'boolean',
      repositoryReason: 'string',
      connectionWriteNow: 'boolean',
      credentialWriteNow: 'boolean',
      accessTokenCacheWriteNow: 'boolean',
      tokenPersistenceDatabaseWriteNow: 'boolean',
      databaseWriteNow: 'boolean',
      prismaClientWriteNow: 'boolean',
      plaintextTokenDatabaseWriteNow: false,
      amazonNetworkCallNow: false,
      rawAccessTokenReturnedNow: false,
      rawRefreshTokenReturnedNow: false,
      rawAuthorizationCodeReturnedNow: false,
      rawLwaResponseReturnedNow: false,
      persistedConnectionShape: {
        id: 'string-or-null',
        companyId: 'string',
        storeId: 'string',
        marketplaceId: 'string',
        region: 'string',
        sellingPartnerIdRedacted: 'string',
        status: 'CONNECTED-or-string',
        connectedAt: 'iso-date-string-or-null',
      },
      persistedCredentialShape: {
        id: 'string-or-null',
        connectionId: 'string-or-null',
        encryptionKeyId: 'string',
        encryptionAlgorithm: 'string',
        tokenVersion: 'number',
        rotatedAt: 'iso-date-string-or-null',
        revokedAt: 'iso-date-string-or-null',
      },
      persistedAccessTokenCacheShape: {
        id: 'string-or-null',
        connectionId: 'string-or-null',
        expiresAt: 'iso-date-string-or-null',
      },
    },

    requiredSchemaAwareWiringBehaviorLater: {
      validateTransportParserPersistenceGatesBeforeRepositoryCall: true,
      rejectWhenSchemaAwarePrismaClientMissing: true,
      callRepositorySchemaAwareMethodOnlyWhenReady: true,
      mapRepositoryConnectionShapeToOrchestratorResult: true,
      mapRepositoryCredentialShapeToOrchestratorResult: true,
      mapRepositoryAccessTokenCacheShapeToOrchestratorResult: true,
      preserveLegacyMethodForCompatibility: true,
    },

    forbiddenRuntimeNowAndLater: {
      orchestratorCallsAmazonNetwork: false,
      orchestratorDecryptsToken: false,
      orchestratorWritesPlaintextToken: false,
      orchestratorReturnsRawAccessToken: false,
      orchestratorReturnsRawRefreshToken: false,
      orchestratorReturnsRawAuthorizationCode: false,
      orchestratorReturnsRawLwaResponse: false,
      controllerCallsRepositoryDirectly: false,
    },

    requiredRegressionSmokesBeforeOrchestratorImplementation: [
      'smoke:amazon-sp-api-token-persistence-orchestrator-schema-aware-wiring-contract',
      'smoke:amazon-sp-api-credential-repository-schema-aware-real-write-implementation',
      'smoke:amazon-sp-api-credential-repository-schema-alignment-contract',
      'smoke:amazon-sp-api-oauth-callback-real-db-guarded-runtime',
      'smoke:amazon-sp-api-token-persistence-orchestrator-real-write-branch-runtime',
    ],

    allowedNextStepBoundary: {
      proposedNextStep: 'Step139-V5',
      proposedNextStepGoal:
        'implement schema-aware token persistence orchestrator method',
      orchestratorRuntimeChangeAllowedNext: true,
      repositoryRuntimeChangeAllowedNext: false,
      controllerRuntimeChangeAllowedNext: false,
      prismaSchemaChangeAllowedNext: false,
      rawTokenMustNeverBeReturnedNext: true,
    },

    nextSuggestedStep: 'Step139-V5',
    nextSuggestedStepGoal:
      'Schema-aware token persistence orchestrator method implementation',
  };
