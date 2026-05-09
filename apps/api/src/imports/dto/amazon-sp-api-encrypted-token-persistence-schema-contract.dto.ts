export type AmazonSpApiEncryptedTokenPersistenceSchemaStep = 'Step137-W';

export type AmazonSpApiEncryptedTokenPersistenceSchemaContract = {
  readonly source: 'amazon-sp-api-encrypted-token-persistence-schema-contract';
  readonly step: AmazonSpApiEncryptedTokenPersistenceSchemaStep;
  readonly phase: 'schema-contract-and-existing-model-verification';

  readonly previousRuntimeCoverageStep: 'Step137-V';
  readonly previousPersistenceBoundaryStep: 'Step137-P';
  readonly prismaModelName: 'AmazonSpApiCredential';
  readonly existingModelAllowedNow: true;
  readonly schemaMutationNow: false;
  readonly migrationCreationNow: false;
  readonly databaseWriteNow: false;

  readonly requiredModelFields: {
    readonly companyId: 'String';
    readonly storeId: 'String';
    readonly marketplaceId: 'String';
    readonly region: 'String';
    readonly sellingPartnerId: 'String';
    readonly encryptedRefreshToken: 'String';
    readonly encryptedAccessTokenCache: 'String?';
    readonly accessTokenExpiresAt: 'DateTime?';
    readonly refreshTokenFingerprint: 'String';
    readonly accessTokenFingerprint: 'String?';
    readonly encryptionKeyId: 'String';
    readonly encryptionAlgorithm: 'String';
    readonly tokenVersion: 'Int';
    readonly status: 'String';
    readonly lastValidatedAt: 'DateTime?';
    readonly revokedAt: 'DateTime?';
    readonly createdAt: 'DateTime';
    readonly updatedAt: 'DateTime';
  };

  readonly requiredIsolationAndUniqueness: {
    readonly companyIdRequired: true;
    readonly storeIdRequired: true;
    readonly marketplaceRegionRequired: true;
    readonly uniqueCredentialScopeRequired: true;
    readonly noGlobalCredentialLookupWithoutCompanyId: true;
    readonly noCrossCompanyCredentialReuse: true;
    readonly noCrossStoreCredentialReuseWithoutExplicitDesign: true;
  };

  readonly requiredEncryptionBoundary: {
    readonly plaintextRefreshTokenMayBeStored: false;
    readonly plaintextAccessTokenMayBeStored: false;
    readonly encryptedRefreshTokenRequired: true;
    readonly encryptedAccessTokenCacheAllowed: true;
    readonly encryptionKeyIdRequired: true;
    readonly encryptionAlgorithmRequired: true;
    readonly tokenVersionRequired: true;
    readonly refreshTokenFingerprintRequired: true;
    readonly accessTokenFingerprintRequiredWhenAccessTokenCached: true;
  };

  readonly requiredLifecycleFields: {
    readonly activeStatus: 'active';
    readonly needsReauthStatus: 'needs_reauth';
    readonly revokedStatus: 'revoked';
    readonly errorStatus: 'error';
    readonly revokedAtRequiredWhenRevoked: true;
    readonly lastValidatedAtUpdatedAfterSuccessfulCredentialCheck: true;
    readonly tokenVersionIncrementsOnRefreshTokenRotation: true;
    readonly accessTokenCacheMayBeNull: true;
  };

  readonly forbiddenRuntimeNow: {
    readonly serviceMayWriteCredentialRowsNow: false;
    readonly controllerMayPersistTokensNow: false;
    readonly oauthCallbackMayPersistTokensNow: false;
    readonly plaintextTokenDatabaseWriteNow: false;
    readonly tokenPersistenceDatabaseWriteNow: false;
    readonly encryptedRefreshTokenPreparedNow: false;
    readonly encryptedAccessTokenCachePreparedNow: false;
    readonly realAmazonNetworkCallFromPersistenceNow: false;
  };

  readonly requiredRegressionSmokesBeforeRepositoryImplementation: readonly [
    'smoke:amazon-sp-api-encrypted-token-persistence-schema-contract',
    'smoke:amazon-sp-api-executable-lwa-http-transport-branch-runtime',
    'smoke:amazon-sp-api-executable-real-lwa-http-transport-guarded-impl',
    'smoke:amazon-sp-api-token-persistence-builder-branch-runtime',
    'smoke:amazon-sp-api-token-persistence-input-builder-test-double',
    'smoke:amazon-sp-api-token-persistence-encrypted-boundary-contract',
  ];

  readonly nextSuggestedStep: 'Step137-X';
  readonly nextSuggestedStepGoal: 'define encrypted token persistence repository contract using existing AmazonSpApiCredential model without controller or OAuth callback wiring';
};

export const amazonSpApiEncryptedTokenPersistenceSchemaContract: AmazonSpApiEncryptedTokenPersistenceSchemaContract =
  {
    source: 'amazon-sp-api-encrypted-token-persistence-schema-contract',
    step: 'Step137-W',
    phase: 'schema-contract-and-existing-model-verification',

    previousRuntimeCoverageStep: 'Step137-V',
    previousPersistenceBoundaryStep: 'Step137-P',
    prismaModelName: 'AmazonSpApiCredential',
    existingModelAllowedNow: true,
    schemaMutationNow: false,
    migrationCreationNow: false,
    databaseWriteNow: false,

    requiredModelFields: {
      companyId: 'String',
      storeId: 'String',
      marketplaceId: 'String',
      region: 'String',
      sellingPartnerId: 'String',
      encryptedRefreshToken: 'String',
      encryptedAccessTokenCache: 'String?',
      accessTokenExpiresAt: 'DateTime?',
      refreshTokenFingerprint: 'String',
      accessTokenFingerprint: 'String?',
      encryptionKeyId: 'String',
      encryptionAlgorithm: 'String',
      tokenVersion: 'Int',
      status: 'String',
      lastValidatedAt: 'DateTime?',
      revokedAt: 'DateTime?',
      createdAt: 'DateTime',
      updatedAt: 'DateTime',
    },

    requiredIsolationAndUniqueness: {
      companyIdRequired: true,
      storeIdRequired: true,
      marketplaceRegionRequired: true,
      uniqueCredentialScopeRequired: true,
      noGlobalCredentialLookupWithoutCompanyId: true,
      noCrossCompanyCredentialReuse: true,
      noCrossStoreCredentialReuseWithoutExplicitDesign: true,
    },

    requiredEncryptionBoundary: {
      plaintextRefreshTokenMayBeStored: false,
      plaintextAccessTokenMayBeStored: false,
      encryptedRefreshTokenRequired: true,
      encryptedAccessTokenCacheAllowed: true,
      encryptionKeyIdRequired: true,
      encryptionAlgorithmRequired: true,
      tokenVersionRequired: true,
      refreshTokenFingerprintRequired: true,
      accessTokenFingerprintRequiredWhenAccessTokenCached: true,
    },

    requiredLifecycleFields: {
      activeStatus: 'active',
      needsReauthStatus: 'needs_reauth',
      revokedStatus: 'revoked',
      errorStatus: 'error',
      revokedAtRequiredWhenRevoked: true,
      lastValidatedAtUpdatedAfterSuccessfulCredentialCheck: true,
      tokenVersionIncrementsOnRefreshTokenRotation: true,
      accessTokenCacheMayBeNull: true,
    },

    forbiddenRuntimeNow: {
      serviceMayWriteCredentialRowsNow: false,
      controllerMayPersistTokensNow: false,
      oauthCallbackMayPersistTokensNow: false,
      plaintextTokenDatabaseWriteNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      encryptedRefreshTokenPreparedNow: false,
      encryptedAccessTokenCachePreparedNow: false,
      realAmazonNetworkCallFromPersistenceNow: false,
    },

    requiredRegressionSmokesBeforeRepositoryImplementation: [
      'smoke:amazon-sp-api-encrypted-token-persistence-schema-contract',
      'smoke:amazon-sp-api-executable-lwa-http-transport-branch-runtime',
      'smoke:amazon-sp-api-executable-real-lwa-http-transport-guarded-impl',
      'smoke:amazon-sp-api-token-persistence-builder-branch-runtime',
      'smoke:amazon-sp-api-token-persistence-input-builder-test-double',
      'smoke:amazon-sp-api-token-persistence-encrypted-boundary-contract',
    ],

    nextSuggestedStep: 'Step137-X',
    nextSuggestedStepGoal:
      'define encrypted token persistence repository contract using existing AmazonSpApiCredential model without controller or OAuth callback wiring',
  };
