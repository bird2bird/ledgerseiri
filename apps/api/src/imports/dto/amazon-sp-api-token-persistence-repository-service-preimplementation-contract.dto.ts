import {
  assertAmazonSpApiMigrationDeployExecutionRecordContract,
  buildAmazonSpApiMigrationDeployExecutionRecordContract,
  type AmazonSpApiMigrationDeployExecutionRecordContract,
} from './amazon-sp-api-migration-deploy-execution-record-contract.dto';

export const AMAZON_SP_API_TOKEN_PERSISTENCE_REPOSITORY_SERVICE_PREIMPLEMENTATION_CONTRACT_VERSION =
  'amazon-sp-api-token-persistence-repository-service-preimplementation-contract-v2' as const;

export type AmazonSpApiTokenPersistenceRepositoryServicePreimplementationContract = {
  version: typeof AMAZON_SP_API_TOKEN_PERSISTENCE_REPOSITORY_SERVICE_PREIMPLEMENTATION_CONTRACT_VERSION;
  sourceStep124G: AmazonSpApiMigrationDeployExecutionRecordContract;

  contractOnly: true;
  preImplementationOnly: true;

  tokenPersistenceServiceImplementationNow: false;
  repositoryImplementationNow: false;
  databaseWriteNow: false;
  oauthCallbackRouteAddedNow: false;
  authorizationRouteAddedNow: false;
  tokenExchangeHttpCallNow: false;
  lwaHttpCallNow: false;
  frontendAddedNow: false;
  realSpApiRequestNow: false;
  importJobWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;

  targetPrismaModels: {
    AmazonSpApiConnection: true;
    AmazonSpApiCredential: true;
    AmazonSpApiAccessTokenCache: true;
    AmazonSpApiConnectionAudit: true;
  };

  repositoryBoundaryPlan: {
    upsertConnectionByCompanyStoreMarketplaceRegion: true;
    upsertCredentialByConnectionId: true;
    upsertAccessTokenCacheByConnectionId: true;
    appendConnectionAudit: true;
    readConnectionStatusByCompanyStore: true;
    revokeConnectionByCompanyStore: true;
    deleteOrRotateCachedAccessTokenOnlyThroughRepository: true;
  };

  tenantIsolationPlan: {
    everyConnectionWriteRequiresCompanyId: true;
    everyConnectionWriteRequiresStoreId: true;
    everyReadScopedByCompanyId: true;
    everyReadScopedByStoreIdWhenStoreBound: true;
    noCrossCompanyLookup: true;
    noUnscopedPrismaFindFirst: true;
    noUnscopedPrismaUpdateMany: true;
    noUnscopedPrismaDeleteMany: true;
  };

  tokenSecurityPlan: {
    refreshTokenStoredOnlyAsEncryptedRefreshToken: true;
    accessTokenStoredOnlyAsEncryptedAccessToken: true;
    encryptionKeyIdRequired: true;
    encryptionAlgorithmRequired: true;
    tokenVersionRequired: true;
    plaintextTokenNeverPersisted: true;
    plaintextTokenNeverLogged: true;
    auditMessageMustBeRedacted: true;
    secretFieldsExcludedFromReadModels: true;
  };

  scannerScopePlan: {
    scannerMustIgnoreGenericPlatformAuthTokens: true;
    scannerMustOnlyFlagAmazonSpApiScopedTokenLeaks: true;
    authModuleJwtAccessTokenIsNotAmazonSpApiToken: true;
    refreshControllerRefreshTokenIsNotAmazonSpApiCredential: true;
  };

  statusLifecyclePlan: {
    authorizationPending: true;
    connected: true;
    revoked: true;
    expired: true;
    error: true;
    lastAuthorizedAtUpdatedOnSuccessfulTokenPersistence: true;
    disconnectedAtUpdatedOnRevoke: true;
    lastSyncAtNotUpdatedByTokenPersistence: true;
  };

  accessTokenCachePlan: {
    cacheByConnectionIdUnique: true;
    expiresAtRequired: true;
    tokenTypeRequired: true;
    scopeJsonOptional: true;
    refreshAccessTokenCacheSeparatelyFromRefreshTokenCredential: true;
    expiredAccessTokenMustNotBeReturnedAsUsable: true;
  };

  auditEventPlan: {
    connectionCreated: true;
    credentialStored: true;
    accessTokenCached: true;
    connectionRevoked: true;
    tokenRefreshFailed: true;
    tokenRefreshSucceeded: true;
    messageRedactedRequired: true;
    metadataJsonAllowedOnlyForNonSecretMetadata: true;
  };

  serviceInputContractPlan: {
    companyId: true;
    storeId: true;
    marketplaceId: true;
    region: true;
    sellingPartnerId: true;
    encryptedRefreshToken: true;
    encryptionKeyId: true;
    encryptionAlgorithm: true;
    tokenVersion: true;
  };

  serviceOutputContractPlan: {
    connectionId: true;
    status: true;
    marketplaceId: true;
    region: true;
    storeId: true;
    lastAuthorizedAt: true;
    disconnectedAt: true;
    noTokenPayloadReturned: true;
    noEncryptedTokenReturnedToFrontend: true;
  };

  forbiddenImplementationPatternsNow: {
    prismaAmazonSpApiConnectionCreate: true;
    prismaAmazonSpApiCredentialCreate: true;
    prismaAmazonSpApiAccessTokenCacheCreate: true;
    prismaAmazonSpApiConnectionAuditCreate: true;
    tokenExchangeFetch: true;
    amazonLwaTokenEndpoint: true;
    oauthCallbackController: true;
    authorizationController: true;
    frontendConnectionButton: true;
    plaintextRefreshTokenField: true;
    plaintextAccessTokenField: true;
    consoleLogToken: true;
  };

  nextAllowedWork: {
    tokenPersistenceRepositoryServiceImplementation: true;
    oauthCallbackRouteImplementation: false;
    tokenExchangeHttpImplementation: false;
    frontendConnectionPanelImplementation: false;
    realSpApiReportRequestImplementation: false;
  };

  summary: {
    readyForStep125BTokenPersistenceRepositoryServiceImplementation: true;
    readyForOauthCallbackRouteImplementation: false;
    readyForTokenExchangeHttpImplementation: false;
    readyForFrontendConnectionPanelImplementation: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiTokenPersistenceRepositoryServicePreimplementationContract(): AmazonSpApiTokenPersistenceRepositoryServicePreimplementationContract {
  const step124G = assertAmazonSpApiMigrationDeployExecutionRecordContract(
    buildAmazonSpApiMigrationDeployExecutionRecordContract(),
  );

  return {
    version: AMAZON_SP_API_TOKEN_PERSISTENCE_REPOSITORY_SERVICE_PREIMPLEMENTATION_CONTRACT_VERSION,
    sourceStep124G: step124G,

    contractOnly: true,
    preImplementationOnly: true,

    tokenPersistenceServiceImplementationNow: false,
    repositoryImplementationNow: false,
    databaseWriteNow: false,
    oauthCallbackRouteAddedNow: false,
    authorizationRouteAddedNow: false,
    tokenExchangeHttpCallNow: false,
    lwaHttpCallNow: false,
    frontendAddedNow: false,
    realSpApiRequestNow: false,
    importJobWriteNow: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,

    targetPrismaModels: {
      AmazonSpApiConnection: true,
      AmazonSpApiCredential: true,
      AmazonSpApiAccessTokenCache: true,
      AmazonSpApiConnectionAudit: true,
    },

    repositoryBoundaryPlan: {
      upsertConnectionByCompanyStoreMarketplaceRegion: true,
      upsertCredentialByConnectionId: true,
      upsertAccessTokenCacheByConnectionId: true,
      appendConnectionAudit: true,
      readConnectionStatusByCompanyStore: true,
      revokeConnectionByCompanyStore: true,
      deleteOrRotateCachedAccessTokenOnlyThroughRepository: true,
    },

    tenantIsolationPlan: {
      everyConnectionWriteRequiresCompanyId: true,
      everyConnectionWriteRequiresStoreId: true,
      everyReadScopedByCompanyId: true,
      everyReadScopedByStoreIdWhenStoreBound: true,
      noCrossCompanyLookup: true,
      noUnscopedPrismaFindFirst: true,
      noUnscopedPrismaUpdateMany: true,
      noUnscopedPrismaDeleteMany: true,
    },

    tokenSecurityPlan: {
      refreshTokenStoredOnlyAsEncryptedRefreshToken: true,
      accessTokenStoredOnlyAsEncryptedAccessToken: true,
      encryptionKeyIdRequired: true,
      encryptionAlgorithmRequired: true,
      tokenVersionRequired: true,
      plaintextTokenNeverPersisted: true,
      plaintextTokenNeverLogged: true,
      auditMessageMustBeRedacted: true,
      secretFieldsExcludedFromReadModels: true,
    },

    scannerScopePlan: {
      scannerMustIgnoreGenericPlatformAuthTokens: true,
      scannerMustOnlyFlagAmazonSpApiScopedTokenLeaks: true,
      authModuleJwtAccessTokenIsNotAmazonSpApiToken: true,
      refreshControllerRefreshTokenIsNotAmazonSpApiCredential: true,
    },

    statusLifecyclePlan: {
      authorizationPending: true,
      connected: true,
      revoked: true,
      expired: true,
      error: true,
      lastAuthorizedAtUpdatedOnSuccessfulTokenPersistence: true,
      disconnectedAtUpdatedOnRevoke: true,
      lastSyncAtNotUpdatedByTokenPersistence: true,
    },

    accessTokenCachePlan: {
      cacheByConnectionIdUnique: true,
      expiresAtRequired: true,
      tokenTypeRequired: true,
      scopeJsonOptional: true,
      refreshAccessTokenCacheSeparatelyFromRefreshTokenCredential: true,
      expiredAccessTokenMustNotBeReturnedAsUsable: true,
    },

    auditEventPlan: {
      connectionCreated: true,
      credentialStored: true,
      accessTokenCached: true,
      connectionRevoked: true,
      tokenRefreshFailed: true,
      tokenRefreshSucceeded: true,
      messageRedactedRequired: true,
      metadataJsonAllowedOnlyForNonSecretMetadata: true,
    },

    serviceInputContractPlan: {
      companyId: true,
      storeId: true,
      marketplaceId: true,
      region: true,
      sellingPartnerId: true,
      encryptedRefreshToken: true,
      encryptionKeyId: true,
      encryptionAlgorithm: true,
      tokenVersion: true,
    },

    serviceOutputContractPlan: {
      connectionId: true,
      status: true,
      marketplaceId: true,
      region: true,
      storeId: true,
      lastAuthorizedAt: true,
      disconnectedAt: true,
      noTokenPayloadReturned: true,
      noEncryptedTokenReturnedToFrontend: true,
    },

    forbiddenImplementationPatternsNow: {
      prismaAmazonSpApiConnectionCreate: true,
      prismaAmazonSpApiCredentialCreate: true,
      prismaAmazonSpApiAccessTokenCacheCreate: true,
      prismaAmazonSpApiConnectionAuditCreate: true,
      tokenExchangeFetch: true,
      amazonLwaTokenEndpoint: true,
      oauthCallbackController: true,
      authorizationController: true,
      frontendConnectionButton: true,
      plaintextRefreshTokenField: true,
      plaintextAccessTokenField: true,
      consoleLogToken: true,
    },

    nextAllowedWork: {
      tokenPersistenceRepositoryServiceImplementation: true,
      oauthCallbackRouteImplementation: false,
      tokenExchangeHttpImplementation: false,
      frontendConnectionPanelImplementation: false,
      realSpApiReportRequestImplementation: false,
    },

    summary: {
      readyForStep125BTokenPersistenceRepositoryServiceImplementation: true,
      readyForOauthCallbackRouteImplementation: false,
      readyForTokenExchangeHttpImplementation: false,
      readyForFrontendConnectionPanelImplementation: false,
      readyForRealSpApiReportRequest: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiTokenPersistenceRepositoryServicePreimplementationContract(
  contract: AmazonSpApiTokenPersistenceRepositoryServicePreimplementationContract,
): AmazonSpApiTokenPersistenceRepositoryServicePreimplementationContract {
  if (contract.version !== AMAZON_SP_API_TOKEN_PERSISTENCE_REPOSITORY_SERVICE_PREIMPLEMENTATION_CONTRACT_VERSION) {
    throw new Error('Step125-A token persistence repository/service preimplementation contract violation: version mismatch.');
  }

  assertAmazonSpApiMigrationDeployExecutionRecordContract(contract.sourceStep124G);

  if (
    contract.contractOnly !== true ||
    contract.preImplementationOnly !== true ||
    contract.tokenPersistenceServiceImplementationNow !== false ||
    contract.repositoryImplementationNow !== false ||
    contract.databaseWriteNow !== false ||
    contract.oauthCallbackRouteAddedNow !== false ||
    contract.authorizationRouteAddedNow !== false ||
    contract.tokenExchangeHttpCallNow !== false ||
    contract.lwaHttpCallNow !== false ||
    contract.frontendAddedNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.importJobWriteNow !== false ||
    contract.transactionWriteNow !== false ||
    contract.inventoryWriteNow !== false
  ) {
    throw new Error('Step125-A token persistence repository/service preimplementation contract violation: boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    targetPrismaModels: contract.targetPrismaModels,
    repositoryBoundaryPlan: contract.repositoryBoundaryPlan,
    tenantIsolationPlan: contract.tenantIsolationPlan,
    tokenSecurityPlan: contract.tokenSecurityPlan,
    scannerScopePlan: contract.scannerScopePlan,
    statusLifecyclePlan: contract.statusLifecyclePlan,
    accessTokenCachePlan: contract.accessTokenCachePlan,
    auditEventPlan: contract.auditEventPlan,
    serviceInputContractPlan: contract.serviceInputContractPlan,
    serviceOutputContractPlan: contract.serviceOutputContractPlan,
    forbiddenImplementationPatternsNow: contract.forbiddenImplementationPatternsNow,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step125-A token persistence repository/service preimplementation contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.nextAllowedWork.tokenPersistenceRepositoryServiceImplementation !== true ||
    contract.nextAllowedWork.oauthCallbackRouteImplementation !== false ||
    contract.nextAllowedWork.tokenExchangeHttpImplementation !== false ||
    contract.nextAllowedWork.frontendConnectionPanelImplementation !== false ||
    contract.nextAllowedWork.realSpApiReportRequestImplementation !== false ||
    contract.summary.readyForStep125BTokenPersistenceRepositoryServiceImplementation !== true ||
    contract.summary.readyForOauthCallbackRouteImplementation !== false ||
    contract.summary.readyForTokenExchangeHttpImplementation !== false ||
    contract.summary.readyForFrontendConnectionPanelImplementation !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step125-A token persistence repository/service preimplementation contract violation: summary mismatch.');
  }

  return contract;
}
