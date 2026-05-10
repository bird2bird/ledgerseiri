export type AmazonSpApiEncryptedTokenPersistenceRealWriteRepositoryStep =
  'Step139-H';

export type AmazonSpApiEncryptedTokenPersistenceRealWriteRepositoryContract = {
  readonly source: 'amazon-sp-api-encrypted-token-persistence-real-write-repository-contract';
  readonly step: AmazonSpApiEncryptedTokenPersistenceRealWriteRepositoryStep;
  readonly phase: 'repository-real-write-contract-only';

  readonly previousOauthBoundaryStep: 'Step139-G';
  readonly previousRepositoryBoundaryStep: 'Step137-X';
  readonly currentRepositoryImplementationMode: 'test-double-only';

  readonly currentScopeNow: {
    readonly defineRepositoryRealWriteContractOnlyNow: true;
    readonly modifyRepositoryRuntimeNow: false;
    readonly implementPrismaWriteNow: false;
    readonly modifyControllerRuntimeNow: false;
    readonly enableOAuthCallbackPersistenceNow: false;
    readonly databaseWriteNow: false;
    readonly prismaClientWriteNow: false;
    readonly callAmazonNow: false;
    readonly persistTokenNow: false;
  };

  readonly proposedRepositoryMethodLater: {
    readonly methodName: 'upsertEncryptedCredentialRealWrite';
    readonly className: 'AmazonSpApiCredentialRepository';
    readonly prismaModel: 'AmazonSpApiCredential';
    readonly writeType: 'upsert';
    readonly uniqueScope: readonly [
      'companyId',
      'storeId',
      'marketplaceId',
      'region'
    ];
    readonly encryptedRefreshTokenWriteRequired: true;
    readonly encryptedAccessTokenCacheWriteAllowed: true;
    readonly plaintextTokenWriteForbidden: true;
  };

  readonly requiredRealWriteInput: {
    readonly companyIdRequired: true;
    readonly storeIdRequired: true;
    readonly marketplaceIdRequired: true;
    readonly regionRequired: true;
    readonly sellingPartnerIdRequired: true;
    readonly encryptedRefreshTokenRequired: true;
    readonly encryptedAccessTokenCacheAllowed: true;
    readonly refreshTokenFingerprintRequired: true;
    readonly accessTokenFingerprintAllowed: true;
    readonly encryptionKeyIdRequired: true;
    readonly encryptionAlgorithmRequired: true;
    readonly tokenVersionRequired: true;
    readonly statusRequired: 'active';
    readonly connectedAtRequired: true;
    readonly lastValidatedAtAllowed: true;
    readonly idempotencyKeyRequired: true;
    readonly auditMetadataRequired: true;
  };

  readonly requiredRepositoryValidationLater: {
    readonly rejectMissingCompanyId: true;
    readonly rejectMissingStoreId: true;
    readonly rejectMissingMarketplaceId: true;
    readonly rejectMissingRegion: true;
    readonly rejectMissingSellingPartnerId: true;
    readonly rejectMissingEncryptedRefreshToken: true;
    readonly rejectMissingRefreshTokenFingerprint: true;
    readonly rejectMissingEncryptionKeyId: true;
    readonly rejectMissingEncryptionAlgorithm: true;
    readonly rejectInvalidTokenVersion: true;
    readonly rejectPlaintextAccessToken: true;
    readonly rejectPlaintextRefreshToken: true;
    readonly rejectRawLwaResponse: true;
    readonly rejectRawAuthorizationCode: true;
    readonly rejectRawClientSecret: true;
  };

  readonly proposedRepositoryResultShapeLater: {
    readonly accepted: 'boolean';
    readonly source: 'amazon-sp-api-credential-repository-real-write';
    readonly repositoryMode: 'real-prisma-upsert-encrypted-token-only';
    readonly prismaModel: 'AmazonSpApiCredential';
    readonly prismaClientWriteNow: true;
    readonly databaseWriteNow: true;
    readonly tokenPersistenceDatabaseWriteNow: true;
    readonly plaintextTokenDatabaseWriteNow: false;
    readonly rawAccessTokenReturnedNow: false;
    readonly rawRefreshTokenReturnedNow: false;
    readonly rawLwaResponseReturnedNow: false;
    readonly persistedCredentialShape: {
      readonly id: 'string';
      readonly companyId: 'string';
      readonly storeId: 'string';
      readonly marketplaceId: 'string';
      readonly region: 'string';
      readonly status: 'active';
      readonly sellingPartnerIdRedacted: 'string';
      readonly connectedAt: 'iso-date-string';
      readonly tokenVersion: 'number';
    };
  };

  readonly currentRuntimeMustRemainTestDoubleOnly: {
    readonly repositoryStillUsesTestDoubleNow: true;
    readonly realPrismaWriteStillForbiddenNow: true;
    readonly controllerPersistenceStillForbiddenNow: true;
    readonly oauthCallbackStillDryRunOnlyNow: true;
    readonly noDatabaseWriteNow: true;
    readonly noPlaintextTokenWriteNow: true;
  };

  readonly forbiddenRuntimeNow: {
    readonly upsertEncryptedCredentialRealWriteNow: false;
    readonly prismaClientWriteNow: false;
    readonly databaseWriteNow: false;
    readonly tokenPersistenceDatabaseWriteNow: false;
    readonly plaintextTokenDatabaseWriteNow: false;
    readonly rawAccessTokenReturnedNow: false;
    readonly rawRefreshTokenReturnedNow: false;
    readonly rawLwaResponseReturnedNow: false;
    readonly rawAuthorizationCodeReturnedNow: false;
    readonly rawClientSecretReturnedNow: false;
  };

  readonly requiredRegressionSmokesBeforeRepositoryImplementation: readonly [
    'smoke:amazon-sp-api-encrypted-token-persistence-real-write-repository-contract',
    'smoke:amazon-sp-api-oauth-callback-encrypted-token-persistence-real-write-boundary-contract',
    'smoke:amazon-sp-api-oauth-callback-dry-run-controller-branch-runtime',
    'smoke:amazon-sp-api-oauth-callback-dry-run-controller-wiring-impl',
    'smoke:amazon-sp-api-encrypted-token-repository-branch-runtime',
    'smoke:amazon-sp-api-encrypted-token-repository-test-double'
  ];

  readonly allowedNextStepBoundary: {
    readonly proposedNextStep: 'Step139-I';
    readonly proposedNextStepGoal: 'implement encrypted token persistence repository real-write with mocked Prisma delegate';
    readonly repositoryRuntimeChangeAllowedNext: true;
    readonly mockedPrismaOnlyNext: true;
    readonly controllerPersistenceStillForbiddenNext: true;
    readonly rawTokenMustNeverBeReturnedNext: true;
  };

  readonly nextSuggestedStep: 'Step139-I';
  readonly nextSuggestedStepGoal: 'Encrypted token persistence repository real-write mocked Prisma implementation';
};

export const amazonSpApiEncryptedTokenPersistenceRealWriteRepositoryContract: AmazonSpApiEncryptedTokenPersistenceRealWriteRepositoryContract =
  {
    source:
      'amazon-sp-api-encrypted-token-persistence-real-write-repository-contract',
    step: 'Step139-H',
    phase: 'repository-real-write-contract-only',

    previousOauthBoundaryStep: 'Step139-G',
    previousRepositoryBoundaryStep: 'Step137-X',
    currentRepositoryImplementationMode: 'test-double-only',

    currentScopeNow: {
      defineRepositoryRealWriteContractOnlyNow: true,
      modifyRepositoryRuntimeNow: false,
      implementPrismaWriteNow: false,
      modifyControllerRuntimeNow: false,
      enableOAuthCallbackPersistenceNow: false,
      databaseWriteNow: false,
      prismaClientWriteNow: false,
      callAmazonNow: false,
      persistTokenNow: false,
    },

    proposedRepositoryMethodLater: {
      methodName: 'upsertEncryptedCredentialRealWrite',
      className: 'AmazonSpApiCredentialRepository',
      prismaModel: 'AmazonSpApiCredential',
      writeType: 'upsert',
      uniqueScope: ['companyId', 'storeId', 'marketplaceId', 'region'],
      encryptedRefreshTokenWriteRequired: true,
      encryptedAccessTokenCacheWriteAllowed: true,
      plaintextTokenWriteForbidden: true,
    },

    requiredRealWriteInput: {
      companyIdRequired: true,
      storeIdRequired: true,
      marketplaceIdRequired: true,
      regionRequired: true,
      sellingPartnerIdRequired: true,
      encryptedRefreshTokenRequired: true,
      encryptedAccessTokenCacheAllowed: true,
      refreshTokenFingerprintRequired: true,
      accessTokenFingerprintAllowed: true,
      encryptionKeyIdRequired: true,
      encryptionAlgorithmRequired: true,
      tokenVersionRequired: true,
      statusRequired: 'active',
      connectedAtRequired: true,
      lastValidatedAtAllowed: true,
      idempotencyKeyRequired: true,
      auditMetadataRequired: true,
    },

    requiredRepositoryValidationLater: {
      rejectMissingCompanyId: true,
      rejectMissingStoreId: true,
      rejectMissingMarketplaceId: true,
      rejectMissingRegion: true,
      rejectMissingSellingPartnerId: true,
      rejectMissingEncryptedRefreshToken: true,
      rejectMissingRefreshTokenFingerprint: true,
      rejectMissingEncryptionKeyId: true,
      rejectMissingEncryptionAlgorithm: true,
      rejectInvalidTokenVersion: true,
      rejectPlaintextAccessToken: true,
      rejectPlaintextRefreshToken: true,
      rejectRawLwaResponse: true,
      rejectRawAuthorizationCode: true,
      rejectRawClientSecret: true,
    },

    proposedRepositoryResultShapeLater: {
      accepted: 'boolean',
      source: 'amazon-sp-api-credential-repository-real-write',
      repositoryMode: 'real-prisma-upsert-encrypted-token-only',
      prismaModel: 'AmazonSpApiCredential',
      prismaClientWriteNow: true,
      databaseWriteNow: true,
      tokenPersistenceDatabaseWriteNow: true,
      plaintextTokenDatabaseWriteNow: false,
      rawAccessTokenReturnedNow: false,
      rawRefreshTokenReturnedNow: false,
      rawLwaResponseReturnedNow: false,
      persistedCredentialShape: {
        id: 'string',
        companyId: 'string',
        storeId: 'string',
        marketplaceId: 'string',
        region: 'string',
        status: 'active',
        sellingPartnerIdRedacted: 'string',
        connectedAt: 'iso-date-string',
        tokenVersion: 'number',
      },
    },

    currentRuntimeMustRemainTestDoubleOnly: {
      repositoryStillUsesTestDoubleNow: true,
      realPrismaWriteStillForbiddenNow: true,
      controllerPersistenceStillForbiddenNow: true,
      oauthCallbackStillDryRunOnlyNow: true,
      noDatabaseWriteNow: true,
      noPlaintextTokenWriteNow: true,
    },

    forbiddenRuntimeNow: {
      upsertEncryptedCredentialRealWriteNow: false,
      prismaClientWriteNow: false,
      databaseWriteNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      plaintextTokenDatabaseWriteNow: false,
      rawAccessTokenReturnedNow: false,
      rawRefreshTokenReturnedNow: false,
      rawLwaResponseReturnedNow: false,
      rawAuthorizationCodeReturnedNow: false,
      rawClientSecretReturnedNow: false,
    },

    requiredRegressionSmokesBeforeRepositoryImplementation: [
      'smoke:amazon-sp-api-encrypted-token-persistence-real-write-repository-contract',
      'smoke:amazon-sp-api-oauth-callback-encrypted-token-persistence-real-write-boundary-contract',
      'smoke:amazon-sp-api-oauth-callback-dry-run-controller-branch-runtime',
      'smoke:amazon-sp-api-oauth-callback-dry-run-controller-wiring-impl',
      'smoke:amazon-sp-api-encrypted-token-repository-branch-runtime',
      'smoke:amazon-sp-api-encrypted-token-repository-test-double',
    ],

    allowedNextStepBoundary: {
      proposedNextStep: 'Step139-I',
      proposedNextStepGoal:
        'implement encrypted token persistence repository real-write with mocked Prisma delegate',
      repositoryRuntimeChangeAllowedNext: true,
      mockedPrismaOnlyNext: true,
      controllerPersistenceStillForbiddenNext: true,
      rawTokenMustNeverBeReturnedNext: true,
    },

    nextSuggestedStep: 'Step139-I',
    nextSuggestedStepGoal:
      'Encrypted token persistence repository real-write mocked Prisma implementation',
  };
