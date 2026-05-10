export type AmazonSpApiCredentialRepositorySchemaAlignmentStep =
  'Step139-V2';

export type AmazonSpApiCredentialRepositorySchemaAlignmentContract = {
  readonly source: 'amazon-sp-api-credential-repository-schema-alignment-contract';
  readonly step: AmazonSpApiCredentialRepositorySchemaAlignmentStep;
  readonly phase: 'repository-schema-alignment-contract-only';

  readonly previousRealDbGuardedRuntimeSmokeStep: 'Step139-V';
  readonly previousControllerRealWriteBranchRuntimeStep: 'Step139-U';
  readonly previousControllerRealWriteImplementationStep: 'Step139-T';

  readonly currentScopeNow: {
    readonly defineSchemaAlignmentContractOnlyNow: true;
    readonly modifyRepositoryRuntimeNow: false;
    readonly modifyOrchestratorRuntimeNow: false;
    readonly modifyControllerRuntimeNow: false;
    readonly modifyPrismaSchemaNow: false;
    readonly runAmazonNetworkCallNow: false;
    readonly writeDatabaseNow: false;
    readonly migrateDatabaseNow: false;
  };

  readonly realSchemaSourceOfTruthNow: {
    readonly connectionModel: 'AmazonSpApiConnection';
    readonly credentialModel: 'AmazonSpApiCredential';
    readonly accessTokenCacheModel: 'AmazonSpApiAccessTokenCache';
    readonly scopeOwnerModel: 'AmazonSpApiConnection';
    readonly scopeUniqueKey: readonly [
      'companyId',
      'storeId',
      'marketplaceId',
      'region'
    ];
    readonly credentialUniqueKey: readonly ['connectionId'];
    readonly accessTokenCacheUniqueKey: readonly ['connectionId'];
    readonly connectionOwnsSellingPartnerId: true;
    readonly connectionOwnsStatus: true;
    readonly connectionOwnsConnectedAt: true;
    readonly credentialOwnsEncryptedRefreshTokenOnly: true;
    readonly accessTokenCacheOwnsEncryptedAccessTokenOnly: true;
  };

  readonly currentRepositoryMismatchNow: {
    readonly repositoryStillUsesLegacySingleDelegateShape: true;
    readonly legacyDelegateMethod: 'prismaDelegate.upsert';
    readonly legacyWhereKey: 'companyId_storeId_marketplaceId_region';
    readonly legacyAssumesCredentialOwnsScopeFields: true;
    readonly legacyAssumesCredentialOwnsStoreId: true;
    readonly legacyAssumesCredentialOwnsMarketplaceId: true;
    readonly legacyAssumesCredentialOwnsRegion: true;
    readonly legacyAssumesCredentialOwnsSellingPartnerId: true;
    readonly legacyAssumesCredentialOwnsEncryptedAccessTokenCache: true;
    readonly realCredentialModelDoesNotOwnThoseFields: true;
    readonly step139VUsedSchemaAwareAdapterToBridgeMismatch: true;
  };

  readonly requiredSchemaAwareRepositoryPlanLater: {
    readonly proposedNewRepositoryMethod: 'upsertEncryptedCredentialSchemaAwareRealWrite';
    readonly shouldPreserveExistingLegacyMethodTemporarily: true;
    readonly shouldUsePrismaServiceOrSchemaAwareDelegate: true;
    readonly shouldUpsertConnectionFirst: true;
    readonly shouldUpsertCredentialByConnectionIdSecond: true;
    readonly shouldUpsertAccessTokenCacheByConnectionIdThird: true;
    readonly shouldReturnConnectionCredentialAccessTokenShape: true;
    readonly shouldRemainNoPlaintextToken: true;
    readonly shouldRemainNoRawLwaResponse: true;
    readonly shouldRemainNoRawAuthorizationCode: true;
    readonly shouldRemainNoAmazonNetworkCall: true;
  };

  readonly requiredSchemaAwareWriteOrderLater: readonly [
    'resolve company/store/marketplace/region scope from trusted caller input',
    'upsert AmazonSpApiConnection by companyId_storeId_marketplaceId_region',
    'store sellingPartnerId and CONNECTED status on AmazonSpApiConnection',
    'upsert AmazonSpApiCredential by connectionId',
    'store encrypted refresh token and encryption metadata only on AmazonSpApiCredential',
    'upsert AmazonSpApiAccessTokenCache by connectionId when encrypted access token cache exists',
    'store encrypted access token, tokenType, scope, expiresAt only on AmazonSpApiAccessTokenCache',
    'return sanitized persisted shape without plaintext or raw token values'
  ];

  readonly futureSchemaAwareResultShapeLater: {
    readonly accepted: 'boolean';
    readonly source: 'amazon-sp-api-credential-repository-schema-aware-real-write';
    readonly repositoryMode: 'schema-aware-prisma-real-write';
    readonly operation: 'upsertEncryptedCredentialSchemaAwareRealWrite';
    readonly connectionWriteNow: true;
    readonly credentialWriteNow: true;
    readonly accessTokenCacheWriteNow: 'only-when-encrypted-access-token-cache-present';
    readonly tokenPersistenceDatabaseWriteNow: true;
    readonly databaseWriteNow: true;
    readonly prismaClientWriteNow: true;
    readonly amazonNetworkCallNow: false;
    readonly plaintextTokenDatabaseWriteNow: false;
    readonly rawTokenReturnedNow: false;
    readonly rawLwaResponseReturnedNow: false;
    readonly rawAuthorizationCodeReturnedNow: false;
    readonly persistedConnectionShape: {
      readonly id: 'string';
      readonly companyId: 'string';
      readonly storeId: 'string';
      readonly marketplaceId: 'string';
      readonly region: 'string';
      readonly sellingPartnerIdRedacted: 'string';
      readonly status: 'CONNECTED';
      readonly connectedAt: 'iso-date-string-or-null';
    };
    readonly persistedCredentialShape: {
      readonly id: 'string';
      readonly connectionId: 'string';
      readonly encryptionKeyId: 'string';
      readonly encryptionAlgorithm: 'string';
      readonly tokenVersion: 'number';
      readonly rotatedAt: 'iso-date-string';
      readonly revokedAt: 'iso-date-string-or-null';
    };
    readonly persistedAccessTokenCacheShape: {
      readonly id: 'string-or-null';
      readonly connectionId: 'string-or-null';
      readonly expiresAt: 'iso-date-string-or-null';
    };
  };

  readonly forbiddenRuntimeNowAndLater: {
    readonly repositoryWritesPlaintextAccessToken: false;
    readonly repositoryWritesPlaintextRefreshToken: false;
    readonly repositoryWritesRawLwaResponse: false;
    readonly repositoryReturnsRawAccessToken: false;
    readonly repositoryReturnsRawRefreshToken: false;
    readonly repositoryReturnsRawAuthorizationCode: false;
    readonly repositoryCallsAmazonNetwork: false;
    readonly controllerCallsRepositoryDirectly: false;
  };

  readonly requiredRegressionSmokesBeforeSchemaAwareRepositoryImplementation: readonly [
    'smoke:amazon-sp-api-credential-repository-schema-alignment-contract',
    'smoke:amazon-sp-api-oauth-callback-real-db-guarded-runtime',
    'smoke:amazon-sp-api-oauth-callback-controller-real-write-branch-runtime',
    'smoke:amazon-sp-api-oauth-callback-controller-real-write-guarded-impl',
    'smoke:amazon-sp-api-token-persistence-orchestrator-real-write-branch-runtime'
  ];

  readonly allowedNextStepBoundary: {
    readonly proposedNextStep: 'Step139-V3';
    readonly proposedNextStepGoal: 'implement schema-aware Amazon SP-API credential repository real-write method';
    readonly repositoryRuntimeChangeAllowedNext: true;
    readonly orchestratorRuntimeChangeAllowedNext: false;
    readonly controllerRuntimeChangeAllowedNext: false;
    readonly prismaSchemaChangeAllowedNext: false;
    readonly rawTokenMustNeverBeReturnedNext: true;
  };

  readonly nextSuggestedStep: 'Step139-V3';
  readonly nextSuggestedStepGoal: 'Schema-aware Amazon SP-API credential repository real-write implementation';
};

export const amazonSpApiCredentialRepositorySchemaAlignmentContract: AmazonSpApiCredentialRepositorySchemaAlignmentContract =
  {
    source: 'amazon-sp-api-credential-repository-schema-alignment-contract',
    step: 'Step139-V2',
    phase: 'repository-schema-alignment-contract-only',

    previousRealDbGuardedRuntimeSmokeStep: 'Step139-V',
    previousControllerRealWriteBranchRuntimeStep: 'Step139-U',
    previousControllerRealWriteImplementationStep: 'Step139-T',

    currentScopeNow: {
      defineSchemaAlignmentContractOnlyNow: true,
      modifyRepositoryRuntimeNow: false,
      modifyOrchestratorRuntimeNow: false,
      modifyControllerRuntimeNow: false,
      modifyPrismaSchemaNow: false,
      runAmazonNetworkCallNow: false,
      writeDatabaseNow: false,
      migrateDatabaseNow: false,
    },

    realSchemaSourceOfTruthNow: {
      connectionModel: 'AmazonSpApiConnection',
      credentialModel: 'AmazonSpApiCredential',
      accessTokenCacheModel: 'AmazonSpApiAccessTokenCache',
      scopeOwnerModel: 'AmazonSpApiConnection',
      scopeUniqueKey: ['companyId', 'storeId', 'marketplaceId', 'region'],
      credentialUniqueKey: ['connectionId'],
      accessTokenCacheUniqueKey: ['connectionId'],
      connectionOwnsSellingPartnerId: true,
      connectionOwnsStatus: true,
      connectionOwnsConnectedAt: true,
      credentialOwnsEncryptedRefreshTokenOnly: true,
      accessTokenCacheOwnsEncryptedAccessTokenOnly: true,
    },

    currentRepositoryMismatchNow: {
      repositoryStillUsesLegacySingleDelegateShape: true,
      legacyDelegateMethod: 'prismaDelegate.upsert',
      legacyWhereKey: 'companyId_storeId_marketplaceId_region',
      legacyAssumesCredentialOwnsScopeFields: true,
      legacyAssumesCredentialOwnsStoreId: true,
      legacyAssumesCredentialOwnsMarketplaceId: true,
      legacyAssumesCredentialOwnsRegion: true,
      legacyAssumesCredentialOwnsSellingPartnerId: true,
      legacyAssumesCredentialOwnsEncryptedAccessTokenCache: true,
      realCredentialModelDoesNotOwnThoseFields: true,
      step139VUsedSchemaAwareAdapterToBridgeMismatch: true,
    },

    requiredSchemaAwareRepositoryPlanLater: {
      proposedNewRepositoryMethod: 'upsertEncryptedCredentialSchemaAwareRealWrite',
      shouldPreserveExistingLegacyMethodTemporarily: true,
      shouldUsePrismaServiceOrSchemaAwareDelegate: true,
      shouldUpsertConnectionFirst: true,
      shouldUpsertCredentialByConnectionIdSecond: true,
      shouldUpsertAccessTokenCacheByConnectionIdThird: true,
      shouldReturnConnectionCredentialAccessTokenShape: true,
      shouldRemainNoPlaintextToken: true,
      shouldRemainNoRawLwaResponse: true,
      shouldRemainNoRawAuthorizationCode: true,
      shouldRemainNoAmazonNetworkCall: true,
    },

    requiredSchemaAwareWriteOrderLater: [
      'resolve company/store/marketplace/region scope from trusted caller input',
      'upsert AmazonSpApiConnection by companyId_storeId_marketplaceId_region',
      'store sellingPartnerId and CONNECTED status on AmazonSpApiConnection',
      'upsert AmazonSpApiCredential by connectionId',
      'store encrypted refresh token and encryption metadata only on AmazonSpApiCredential',
      'upsert AmazonSpApiAccessTokenCache by connectionId when encrypted access token cache exists',
      'store encrypted access token, tokenType, scope, expiresAt only on AmazonSpApiAccessTokenCache',
      'return sanitized persisted shape without plaintext or raw token values',
    ],

    futureSchemaAwareResultShapeLater: {
      accepted: 'boolean',
      source: 'amazon-sp-api-credential-repository-schema-aware-real-write',
      repositoryMode: 'schema-aware-prisma-real-write',
      operation: 'upsertEncryptedCredentialSchemaAwareRealWrite',
      connectionWriteNow: true,
      credentialWriteNow: true,
      accessTokenCacheWriteNow:
        'only-when-encrypted-access-token-cache-present',
      tokenPersistenceDatabaseWriteNow: true,
      databaseWriteNow: true,
      prismaClientWriteNow: true,
      amazonNetworkCallNow: false,
      plaintextTokenDatabaseWriteNow: false,
      rawTokenReturnedNow: false,
      rawLwaResponseReturnedNow: false,
      rawAuthorizationCodeReturnedNow: false,
      persistedConnectionShape: {
        id: 'string',
        companyId: 'string',
        storeId: 'string',
        marketplaceId: 'string',
        region: 'string',
        sellingPartnerIdRedacted: 'string',
        status: 'CONNECTED',
        connectedAt: 'iso-date-string-or-null',
      },
      persistedCredentialShape: {
        id: 'string',
        connectionId: 'string',
        encryptionKeyId: 'string',
        encryptionAlgorithm: 'string',
        tokenVersion: 'number',
        rotatedAt: 'iso-date-string',
        revokedAt: 'iso-date-string-or-null',
      },
      persistedAccessTokenCacheShape: {
        id: 'string-or-null',
        connectionId: 'string-or-null',
        expiresAt: 'iso-date-string-or-null',
      },
    },

    forbiddenRuntimeNowAndLater: {
      repositoryWritesPlaintextAccessToken: false,
      repositoryWritesPlaintextRefreshToken: false,
      repositoryWritesRawLwaResponse: false,
      repositoryReturnsRawAccessToken: false,
      repositoryReturnsRawRefreshToken: false,
      repositoryReturnsRawAuthorizationCode: false,
      repositoryCallsAmazonNetwork: false,
      controllerCallsRepositoryDirectly: false,
    },

    requiredRegressionSmokesBeforeSchemaAwareRepositoryImplementation: [
      'smoke:amazon-sp-api-credential-repository-schema-alignment-contract',
      'smoke:amazon-sp-api-oauth-callback-real-db-guarded-runtime',
      'smoke:amazon-sp-api-oauth-callback-controller-real-write-branch-runtime',
      'smoke:amazon-sp-api-oauth-callback-controller-real-write-guarded-impl',
      'smoke:amazon-sp-api-token-persistence-orchestrator-real-write-branch-runtime',
    ],

    allowedNextStepBoundary: {
      proposedNextStep: 'Step139-V3',
      proposedNextStepGoal:
        'implement schema-aware Amazon SP-API credential repository real-write method',
      repositoryRuntimeChangeAllowedNext: true,
      orchestratorRuntimeChangeAllowedNext: false,
      controllerRuntimeChangeAllowedNext: false,
      prismaSchemaChangeAllowedNext: false,
      rawTokenMustNeverBeReturnedNext: true,
    },

    nextSuggestedStep: 'Step139-V3',
    nextSuggestedStepGoal:
      'Schema-aware Amazon SP-API credential repository real-write implementation',
  };
