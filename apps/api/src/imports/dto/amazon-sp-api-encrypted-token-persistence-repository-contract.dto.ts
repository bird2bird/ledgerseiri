export type AmazonSpApiEncryptedTokenPersistenceRepositoryStep = 'Step137-X';

export type AmazonSpApiEncryptedTokenPersistenceRepositoryContract = {
  readonly source: 'amazon-sp-api-encrypted-token-persistence-repository-contract';
  readonly step: AmazonSpApiEncryptedTokenPersistenceRepositoryStep;
  readonly phase: 'repository-contract-only';

  readonly previousSchemaContractStep: 'Step137-W';
  readonly prismaModelName: 'AmazonSpApiCredential';
  readonly existingPrismaModelUsed: true;
  readonly repositoryImplementationNow: false;
  readonly databaseWriteNow: false;
  readonly controllerWiringNow: false;
  readonly oauthCallbackWiringNow: false;
  readonly serviceRuntimePersistenceNow: false;

  readonly futureRepositoryName: 'AmazonSpApiCredentialRepository';
  readonly futureRepositoryLocation: 'apps/api/src/imports/amazon-sp-api-credential.repository.ts';

  readonly acceptedInputBoundary: {
    readonly sourceMethod: 'AmazonSpApiTokenExchangeService.prepareEncryptedTokenPersistenceInputLater';
    readonly acceptsOnlySanitizedPersistenceInput: true;
    readonly acceptsOnlyEncryptedRefreshToken: true;
    readonly acceptsOnlyOptionalEncryptedAccessTokenCache: true;
    readonly rejectsPlaintextAccessToken: true;
    readonly rejectsPlaintextRefreshToken: true;
    readonly rejectsRawLwaResponse: true;
    readonly rejectsRawAuthorizationCode: true;
    readonly requiresCompanyId: true;
    readonly requiresStoreId: true;
    readonly requiresMarketplaceId: true;
    readonly requiresRegion: true;
    readonly requiresSellingPartnerId: true;
    readonly requiresEncryptionKeyId: true;
    readonly requiresEncryptionAlgorithm: true;
    readonly requiresTokenVersion: true;
    readonly requiresRefreshTokenFingerprint: true;
  };

  readonly futureRepositoryOperations: {
    readonly upsertEncryptedCredential: 'upsert encrypted credential by scoped identity';
    readonly findActiveCredentialForStore: 'read active credential by company/store/marketplace/region';
    readonly markCredentialNeedsReauth: 'mark credential status without exposing token';
    readonly revokeCredential: 'mark revokedAt/status without exposing token';
    readonly updateAccessTokenCache: 'update encrypted access token cache and expiry only';
  };

  readonly scopedUpsertRules: {
    readonly uniqueScopeMustIncludeCompanyId: true;
    readonly uniqueScopeMustIncludeStoreId: true;
    readonly uniqueScopeMustIncludeMarketplaceId: true;
    readonly uniqueScopeMustIncludeRegion: true;
    readonly sellingPartnerIdMustBeStoredOrVerified: true;
    readonly upsertMayNotCrossCompany: true;
    readonly upsertMayNotCrossStore: true;
    readonly allReadsMustFilterCompanyId: true;
    readonly storeReadsMustFilterStoreId: true;
    readonly existingModelShapeMayBeLegacyOrRelationBased: true;
  };

  readonly futureWriteShape: {
    readonly encryptedRefreshToken: 'required';
    readonly encryptedAccessTokenCache: 'optional';
    readonly accessTokenExpiresAt: 'optional';
    readonly refreshTokenFingerprint: 'required';
    readonly accessTokenFingerprint: 'optional-when-access-token-cache-present';
    readonly encryptionKeyId: 'required';
    readonly encryptionAlgorithm: 'required';
    readonly tokenVersion: 'required-positive-int';
    readonly status: 'active-or-needs_reauth-or-revoked-or-error';
    readonly lastValidatedAt: 'optional';
    readonly revokedAt: 'optional-required-when-revoked';
  };

  readonly forbiddenRepositoryBehaviors: {
    readonly repositoryMayCallAmazon: false;
    readonly repositoryMayParseLwaResponse: false;
    readonly repositoryMayOwnEncryption: false;
    readonly repositoryMayAcceptPlaintextTokenFields: false;
    readonly repositoryMayLogTokenMaterial: false;
    readonly repositoryMayReturnEncryptedTokenByDefault: false;
    readonly repositoryMayReturnPlaintextTokenEver: false;
    readonly repositoryMayWriteImportJob: false;
    readonly repositoryMayWriteTransaction: false;
    readonly repositoryMayWriteInventory: false;
    readonly controllerMayBypassRepository: false;
    readonly oauthCallbackMayWritePrismaDirectly: false;
  };

  readonly currentRuntimeForbiddenNow: {
    readonly repositoryFileCreatedNow: false;
    readonly prismaClientWriteNow: false;
    readonly tokenPersistenceDatabaseWriteNow: false;
    readonly plaintextTokenDatabaseWriteNow: false;
    readonly encryptedRefreshTokenPreparedNow: false;
    readonly encryptedAccessTokenCachePreparedNow: false;
    readonly controllerMayPersistTokensNow: false;
    readonly oauthCallbackMayPersistTokensNow: false;
  };

  readonly requiredRegressionSmokesBeforeRepositoryImplementation: readonly [
    'smoke:amazon-sp-api-encrypted-token-persistence-repository-contract',
    'smoke:amazon-sp-api-encrypted-token-persistence-schema-contract',
    'smoke:amazon-sp-api-executable-lwa-http-transport-branch-runtime',
    'smoke:amazon-sp-api-executable-real-lwa-http-transport-guarded-impl',
    'smoke:amazon-sp-api-token-persistence-builder-branch-runtime',
    'smoke:amazon-sp-api-token-persistence-input-builder-test-double',
    'smoke:amazon-sp-api-token-persistence-encrypted-boundary-contract'
  ];

  readonly nextSuggestedStep: 'Step137-Y';
  readonly nextSuggestedStepGoal: 'implement encrypted token persistence repository test double without controller or OAuth callback wiring';
};

export const amazonSpApiEncryptedTokenPersistenceRepositoryContract: AmazonSpApiEncryptedTokenPersistenceRepositoryContract =
  {
    source: 'amazon-sp-api-encrypted-token-persistence-repository-contract',
    step: 'Step137-X',
    phase: 'repository-contract-only',

    previousSchemaContractStep: 'Step137-W',
    prismaModelName: 'AmazonSpApiCredential',
    existingPrismaModelUsed: true,
    repositoryImplementationNow: false,
    databaseWriteNow: false,
    controllerWiringNow: false,
    oauthCallbackWiringNow: false,
    serviceRuntimePersistenceNow: false,

    futureRepositoryName: 'AmazonSpApiCredentialRepository',
    futureRepositoryLocation:
      'apps/api/src/imports/amazon-sp-api-credential.repository.ts',

    acceptedInputBoundary: {
      sourceMethod:
        'AmazonSpApiTokenExchangeService.prepareEncryptedTokenPersistenceInputLater',
      acceptsOnlySanitizedPersistenceInput: true,
      acceptsOnlyEncryptedRefreshToken: true,
      acceptsOnlyOptionalEncryptedAccessTokenCache: true,
      rejectsPlaintextAccessToken: true,
      rejectsPlaintextRefreshToken: true,
      rejectsRawLwaResponse: true,
      rejectsRawAuthorizationCode: true,
      requiresCompanyId: true,
      requiresStoreId: true,
      requiresMarketplaceId: true,
      requiresRegion: true,
      requiresSellingPartnerId: true,
      requiresEncryptionKeyId: true,
      requiresEncryptionAlgorithm: true,
      requiresTokenVersion: true,
      requiresRefreshTokenFingerprint: true,
    },

    futureRepositoryOperations: {
      upsertEncryptedCredential: 'upsert encrypted credential by scoped identity',
      findActiveCredentialForStore:
        'read active credential by company/store/marketplace/region',
      markCredentialNeedsReauth: 'mark credential status without exposing token',
      revokeCredential: 'mark revokedAt/status without exposing token',
      updateAccessTokenCache: 'update encrypted access token cache and expiry only',
    },

    scopedUpsertRules: {
      uniqueScopeMustIncludeCompanyId: true,
      uniqueScopeMustIncludeStoreId: true,
      uniqueScopeMustIncludeMarketplaceId: true,
      uniqueScopeMustIncludeRegion: true,
      sellingPartnerIdMustBeStoredOrVerified: true,
      upsertMayNotCrossCompany: true,
      upsertMayNotCrossStore: true,
      allReadsMustFilterCompanyId: true,
      storeReadsMustFilterStoreId: true,
      existingModelShapeMayBeLegacyOrRelationBased: true,
    },

    futureWriteShape: {
      encryptedRefreshToken: 'required',
      encryptedAccessTokenCache: 'optional',
      accessTokenExpiresAt: 'optional',
      refreshTokenFingerprint: 'required',
      accessTokenFingerprint: 'optional-when-access-token-cache-present',
      encryptionKeyId: 'required',
      encryptionAlgorithm: 'required',
      tokenVersion: 'required-positive-int',
      status: 'active-or-needs_reauth-or-revoked-or-error',
      lastValidatedAt: 'optional',
      revokedAt: 'optional-required-when-revoked',
    },

    forbiddenRepositoryBehaviors: {
      repositoryMayCallAmazon: false,
      repositoryMayParseLwaResponse: false,
      repositoryMayOwnEncryption: false,
      repositoryMayAcceptPlaintextTokenFields: false,
      repositoryMayLogTokenMaterial: false,
      repositoryMayReturnEncryptedTokenByDefault: false,
      repositoryMayReturnPlaintextTokenEver: false,
      repositoryMayWriteImportJob: false,
      repositoryMayWriteTransaction: false,
      repositoryMayWriteInventory: false,
      controllerMayBypassRepository: false,
      oauthCallbackMayWritePrismaDirectly: false,
    },

    currentRuntimeForbiddenNow: {
      repositoryFileCreatedNow: false,
      prismaClientWriteNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      plaintextTokenDatabaseWriteNow: false,
      encryptedRefreshTokenPreparedNow: false,
      encryptedAccessTokenCachePreparedNow: false,
      controllerMayPersistTokensNow: false,
      oauthCallbackMayPersistTokensNow: false,
    },

    requiredRegressionSmokesBeforeRepositoryImplementation: [
      'smoke:amazon-sp-api-encrypted-token-persistence-repository-contract',
      'smoke:amazon-sp-api-encrypted-token-persistence-schema-contract',
      'smoke:amazon-sp-api-executable-lwa-http-transport-branch-runtime',
      'smoke:amazon-sp-api-executable-real-lwa-http-transport-guarded-impl',
      'smoke:amazon-sp-api-token-persistence-builder-branch-runtime',
      'smoke:amazon-sp-api-token-persistence-input-builder-test-double',
      'smoke:amazon-sp-api-token-persistence-encrypted-boundary-contract',
    ],

    nextSuggestedStep: 'Step137-Y',
    nextSuggestedStepGoal:
      'implement encrypted token persistence repository test double without controller or OAuth callback wiring',
  };
