export type AmazonSpApiTokenPersistenceEncryptedBoundaryStep = 'Step137-P';

export type AmazonSpApiTokenPersistenceEncryptedBoundaryContract = {
  readonly source: 'amazon-sp-api-token-persistence-encrypted-boundary-contract';
  readonly step: AmazonSpApiTokenPersistenceEncryptedBoundaryStep;
  readonly phase: 'persistence-boundary-contract-only';

  readonly previousParserRuntimeStep: 'Step137-O';
  readonly previousParserMethod: 'AmazonSpApiTokenExchangeService.parseRealLwaHttpResponseSanitizedLater';
  readonly futurePersistenceBoundaryPath: 'AmazonSpApiTokenExchangeService.prepareEncryptedTokenPersistenceInputLater';

  readonly currentScopeNow: {
    readonly definePersistenceBoundaryOnlyNow: true;
    readonly implementEncryptionNow: false;
    readonly implementPersistenceInputBuilderNow: false;
    readonly writeDatabaseNow: false;
    readonly addPrismaModelNow: false;
    readonly addMigrationNow: false;
    readonly wireOAuthCallbackNow: false;
    readonly wireControllerNow: false;
    readonly callAmazonNow: false;
  };

  readonly onlyAllowedFuturePersistencePath: {
    readonly startsAfterSanitizedParserSuccess: true;
    readonly requiresTrustedCompanyId: true;
    readonly requiresTrustedStoreId: true;
    readonly requiresMarketplaceId: true;
    readonly requiresRegion: true;
    readonly requiresSellingPartnerId: true;
    readonly requiresAccessTokenPresent: true;
    readonly requiresRefreshTokenPresent: true;
    readonly requiresTokenTypeBearer: true;
    readonly requiresPositiveExpiresInSeconds: true;
    readonly requiresEncryptionKeyId: true;
    readonly requiresEncryptionAlgorithm: true;
    readonly requiresTokenVersion: true;
    readonly requiresOperatorApprovedPersistenceBoundary: true;
  };

  readonly plaintextTokenRules: {
    readonly plaintextAccessTokenMayEnterOnlyEncryptionInputLater: true;
    readonly plaintextRefreshTokenMayEnterOnlyEncryptionInputLater: true;
    readonly plaintextAccessTokenMayBeLogged: false;
    readonly plaintextRefreshTokenMayBeLogged: false;
    readonly plaintextAccessTokenMayBeReturned: false;
    readonly plaintextRefreshTokenMayBeReturned: false;
    readonly plaintextAccessTokenMayBeStoredInDatabase: false;
    readonly plaintextRefreshTokenMayBeStoredInDatabase: false;
    readonly plaintextTokenMayAppearInImportJob: false;
    readonly plaintextTokenMayAppearInImportStagingRow: false;
    readonly plaintextTokenMayAppearInTransaction: false;
    readonly plaintextTokenMayAppearInInventory: false;
  };

  readonly encryptedPersistenceShapeLater: {
    readonly companyId: 'trusted-state-company-id';
    readonly storeId: 'trusted-state-store-id';
    readonly marketplaceId: 'resolved-marketplace-id';
    readonly region: 'resolved-region';
    readonly sellingPartnerId: 'resolved-selling-partner-id';
    readonly encryptedRefreshTokenRequired: true;
    readonly encryptedAccessTokenCacheAllowed: true;
    readonly accessTokenExpiresAtRequired: true;
    readonly refreshTokenFingerprintRequired: true;
    readonly accessTokenFingerprintRequired: true;
    readonly tokenType: 'bearer';
    readonly scopeMayBeStored: true;
    readonly encryptionKeyIdRequired: true;
    readonly encryptionAlgorithmRequired: true;
    readonly tokenVersionRequired: true;
  };

  readonly forbiddenPersistenceShortcuts: {
    readonly controllerMayPersistTokensDirectly: false;
    readonly oauthCallbackMayPersistTokensBeforeBoundary: false;
    readonly parserMayWriteDatabase: false;
    readonly httpTransportMayWriteDatabase: false;
    readonly diagnosticEndpointMayPersistTokens: false;
    readonly frontendMaySendPlaintextTokens: false;
    readonly importJobMayStorePlaintextTokens: false;
    readonly transactionMayStorePlaintextTokens: false;
    readonly inventoryMayStorePlaintextTokens: false;
    readonly envFlagAloneMayEnablePersistence: false;
  };

  readonly currentRuntimeSafetyNow: {
    readonly tokenPersistenceImplementedNow: false;
    readonly tokenPersistenceDatabaseWriteNow: false;
    readonly plaintextTokenDatabaseWriteNow: false;
    readonly encryptedCredentialDatabaseWriteNow: false;
    readonly oauthCallbackRuntimeChangedNow: false;
    readonly controllerWiringChangedNow: false;
    readonly prismaSchemaChangedNow: false;
    readonly migrationAddedNow: false;
    readonly rawAccessTokenReturnedNow: false;
    readonly rawRefreshTokenReturnedNow: false;
    readonly realSpApiRequestNow: false;
  };

  readonly requiredRegressionSmokesBeforeFuturePersistenceImplementation: readonly [
    'smoke:amazon-sp-api-token-persistence-encrypted-boundary-contract',
    'smoke:amazon-sp-api-sanitized-lwa-parser-branch-runtime',
    'smoke:amazon-sp-api-sanitized-lwa-http-response-parser-test-double',
    'smoke:amazon-sp-api-sanitized-lwa-http-response-parser-contract',
    'smoke:amazon-sp-api-real-http-activation-transition-contract',
    'smoke:amazon-sp-api-guarded-lwa-http-activation-handoff-contract',
    'smoke:amazon-sp-api-guarded-lwa-http-transport-branch-runtime',
    'smoke:amazon-sp-api-guarded-lwa-http-transport-test-double',
  ];

  readonly nextSuggestedStep: 'Step137-Q';
  readonly nextSuggestedStepGoal: 'implement token persistence encrypted input builder test double without database writes';
};

export const amazonSpApiTokenPersistenceEncryptedBoundaryContract: AmazonSpApiTokenPersistenceEncryptedBoundaryContract =
  {
    source: 'amazon-sp-api-token-persistence-encrypted-boundary-contract',
    step: 'Step137-P',
    phase: 'persistence-boundary-contract-only',

    previousParserRuntimeStep: 'Step137-O',
    previousParserMethod:
      'AmazonSpApiTokenExchangeService.parseRealLwaHttpResponseSanitizedLater',
    futurePersistenceBoundaryPath:
      'AmazonSpApiTokenExchangeService.prepareEncryptedTokenPersistenceInputLater',

    currentScopeNow: {
      definePersistenceBoundaryOnlyNow: true,
      implementEncryptionNow: false,
      implementPersistenceInputBuilderNow: false,
      writeDatabaseNow: false,
      addPrismaModelNow: false,
      addMigrationNow: false,
      wireOAuthCallbackNow: false,
      wireControllerNow: false,
      callAmazonNow: false,
    },

    onlyAllowedFuturePersistencePath: {
      startsAfterSanitizedParserSuccess: true,
      requiresTrustedCompanyId: true,
      requiresTrustedStoreId: true,
      requiresMarketplaceId: true,
      requiresRegion: true,
      requiresSellingPartnerId: true,
      requiresAccessTokenPresent: true,
      requiresRefreshTokenPresent: true,
      requiresTokenTypeBearer: true,
      requiresPositiveExpiresInSeconds: true,
      requiresEncryptionKeyId: true,
      requiresEncryptionAlgorithm: true,
      requiresTokenVersion: true,
      requiresOperatorApprovedPersistenceBoundary: true,
    },

    plaintextTokenRules: {
      plaintextAccessTokenMayEnterOnlyEncryptionInputLater: true,
      plaintextRefreshTokenMayEnterOnlyEncryptionInputLater: true,
      plaintextAccessTokenMayBeLogged: false,
      plaintextRefreshTokenMayBeLogged: false,
      plaintextAccessTokenMayBeReturned: false,
      plaintextRefreshTokenMayBeReturned: false,
      plaintextAccessTokenMayBeStoredInDatabase: false,
      plaintextRefreshTokenMayBeStoredInDatabase: false,
      plaintextTokenMayAppearInImportJob: false,
      plaintextTokenMayAppearInImportStagingRow: false,
      plaintextTokenMayAppearInTransaction: false,
      plaintextTokenMayAppearInInventory: false,
    },

    encryptedPersistenceShapeLater: {
      companyId: 'trusted-state-company-id',
      storeId: 'trusted-state-store-id',
      marketplaceId: 'resolved-marketplace-id',
      region: 'resolved-region',
      sellingPartnerId: 'resolved-selling-partner-id',
      encryptedRefreshTokenRequired: true,
      encryptedAccessTokenCacheAllowed: true,
      accessTokenExpiresAtRequired: true,
      refreshTokenFingerprintRequired: true,
      accessTokenFingerprintRequired: true,
      tokenType: 'bearer',
      scopeMayBeStored: true,
      encryptionKeyIdRequired: true,
      encryptionAlgorithmRequired: true,
      tokenVersionRequired: true,
    },

    forbiddenPersistenceShortcuts: {
      controllerMayPersistTokensDirectly: false,
      oauthCallbackMayPersistTokensBeforeBoundary: false,
      parserMayWriteDatabase: false,
      httpTransportMayWriteDatabase: false,
      diagnosticEndpointMayPersistTokens: false,
      frontendMaySendPlaintextTokens: false,
      importJobMayStorePlaintextTokens: false,
      transactionMayStorePlaintextTokens: false,
      inventoryMayStorePlaintextTokens: false,
      envFlagAloneMayEnablePersistence: false,
    },

    currentRuntimeSafetyNow: {
      tokenPersistenceImplementedNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      plaintextTokenDatabaseWriteNow: false,
      encryptedCredentialDatabaseWriteNow: false,
      oauthCallbackRuntimeChangedNow: false,
      controllerWiringChangedNow: false,
      prismaSchemaChangedNow: false,
      migrationAddedNow: false,
      rawAccessTokenReturnedNow: false,
      rawRefreshTokenReturnedNow: false,
      realSpApiRequestNow: false,
    },

    requiredRegressionSmokesBeforeFuturePersistenceImplementation: [
      'smoke:amazon-sp-api-token-persistence-encrypted-boundary-contract',
      'smoke:amazon-sp-api-sanitized-lwa-parser-branch-runtime',
      'smoke:amazon-sp-api-sanitized-lwa-http-response-parser-test-double',
      'smoke:amazon-sp-api-sanitized-lwa-http-response-parser-contract',
      'smoke:amazon-sp-api-real-http-activation-transition-contract',
      'smoke:amazon-sp-api-guarded-lwa-http-activation-handoff-contract',
      'smoke:amazon-sp-api-guarded-lwa-http-transport-branch-runtime',
      'smoke:amazon-sp-api-guarded-lwa-http-transport-test-double',
    ],

    nextSuggestedStep: 'Step137-Q',
    nextSuggestedStepGoal:
      'implement token persistence encrypted input builder test double without database writes',
  };
