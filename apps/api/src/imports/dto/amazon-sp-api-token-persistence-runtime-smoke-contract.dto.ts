import {
  assertAmazonSpApiTokenPersistenceRepositoryServiceImplementationContract,
  buildAmazonSpApiTokenPersistenceRepositoryServiceImplementationContract,
  type AmazonSpApiTokenPersistenceRepositoryServiceImplementationContract,
} from './amazon-sp-api-token-persistence-repository-service-implementation-contract.dto';

export const AMAZON_SP_API_TOKEN_PERSISTENCE_RUNTIME_SMOKE_CONTRACT_VERSION =
  'amazon-sp-api-token-persistence-runtime-smoke-contract-v2' as const;

export type AmazonSpApiTokenPersistenceRuntimeSmokeContract = {
  version: typeof AMAZON_SP_API_TOKEN_PERSISTENCE_RUNTIME_SMOKE_CONTRACT_VERSION;
  sourceStep125B: AmazonSpApiTokenPersistenceRepositoryServiceImplementationContract;

  runtimeSmokeImplementedNow: true;
  fixtureDatabaseWriteNow: true;
  fixtureCleanupRequired: true;

  oauthCallbackRouteAddedNow: false;
  authorizationRouteAddedNow: false;
  tokenExchangeHttpCallNow: false;
  lwaHttpCallNow: false;
  frontendAddedNow: false;
  realSpApiRequestNow: false;
  importJobWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;

  fixtureForeignKeyPlan: {
    companyStoreFixtureCreatedBeforeAmazonConnectionWrite: true;
    amazonConnectionUsesRealCompanyStoreForeignKeys: true;
    cleanupDeletesAmazonRowsBeforeStoreCompanyRows: true;
  };

  runtimeAssertions: {
    connectionUpsertCreatesConnectedConnection: true;
    credentialUpsertStoresEncryptedRefreshToken: true;
    credentialRotatedAtVerified: true;
    accessTokenCacheUpsertStoresEncryptedAccessToken: true;
    accessTokenCacheScopeVerified: true;
    lastTokenRefreshAtUpdated: true;
    readModelDoesNotReturnTokenPayload: true;
    auditMessageRedactionVerified: true;
    revokeSetsConnectionRevoked: true;
    revokeSetsCredentialRevokedAt: true;
    revokeDeletesAccessTokenCache: true;
    fixtureCleanupRunsInFinally: true;
  };

  stillForbidden: {
    oauthCallbackRouteImplementation: true;
    authorizationRouteImplementation: true;
    lwaTokenExchangeHttpCall: true;
    realAmazonSpApiHttpCall: true;
    frontendConnectionPanel: true;
    committedSalesImport: true;
    inventoryExecution: true;
  };

  nextAllowedWork: {
    tokenPersistenceRuntimeSmokeRecord: true;
    oauthStatePersistenceBridgePreimplementationContract: true;
    oauthCallbackRouteImplementation: false;
    tokenExchangeHttpImplementation: false;
    frontendConnectionPanelImplementation: false;
    realSpApiReportRequestImplementation: false;
  };

  summary: {
    readyForStep125DTokenPersistenceRuntimeSmokeRecord: true;
    readyForOauthCallbackRouteImplementation: false;
    readyForTokenExchangeHttpImplementation: false;
    readyForFrontendConnectionPanelImplementation: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiTokenPersistenceRuntimeSmokeContract(): AmazonSpApiTokenPersistenceRuntimeSmokeContract {
  const step125B = assertAmazonSpApiTokenPersistenceRepositoryServiceImplementationContract(
    buildAmazonSpApiTokenPersistenceRepositoryServiceImplementationContract(),
  );

  return {
    version: AMAZON_SP_API_TOKEN_PERSISTENCE_RUNTIME_SMOKE_CONTRACT_VERSION,
    sourceStep125B: step125B,

    runtimeSmokeImplementedNow: true,
    fixtureDatabaseWriteNow: true,
    fixtureCleanupRequired: true,

    oauthCallbackRouteAddedNow: false,
    authorizationRouteAddedNow: false,
    tokenExchangeHttpCallNow: false,
    lwaHttpCallNow: false,
    frontendAddedNow: false,
    realSpApiRequestNow: false,
    importJobWriteNow: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,

    fixtureForeignKeyPlan: {
      companyStoreFixtureCreatedBeforeAmazonConnectionWrite: true,
      amazonConnectionUsesRealCompanyStoreForeignKeys: true,
      cleanupDeletesAmazonRowsBeforeStoreCompanyRows: true,
    },

    runtimeAssertions: {
      connectionUpsertCreatesConnectedConnection: true,
      credentialUpsertStoresEncryptedRefreshToken: true,
      credentialRotatedAtVerified: true,
      accessTokenCacheUpsertStoresEncryptedAccessToken: true,
      accessTokenCacheScopeVerified: true,
      lastTokenRefreshAtUpdated: true,
      readModelDoesNotReturnTokenPayload: true,
      auditMessageRedactionVerified: true,
      revokeSetsConnectionRevoked: true,
      revokeSetsCredentialRevokedAt: true,
      revokeDeletesAccessTokenCache: true,
      fixtureCleanupRunsInFinally: true,
    },

    stillForbidden: {
      oauthCallbackRouteImplementation: true,
      authorizationRouteImplementation: true,
      lwaTokenExchangeHttpCall: true,
      realAmazonSpApiHttpCall: true,
      frontendConnectionPanel: true,
      committedSalesImport: true,
      inventoryExecution: true,
    },

    nextAllowedWork: {
      tokenPersistenceRuntimeSmokeRecord: true,
      oauthStatePersistenceBridgePreimplementationContract: true,
      oauthCallbackRouteImplementation: false,
      tokenExchangeHttpImplementation: false,
      frontendConnectionPanelImplementation: false,
      realSpApiReportRequestImplementation: false,
    },

    summary: {
      readyForStep125DTokenPersistenceRuntimeSmokeRecord: true,
      readyForOauthCallbackRouteImplementation: false,
      readyForTokenExchangeHttpImplementation: false,
      readyForFrontendConnectionPanelImplementation: false,
      readyForRealSpApiReportRequest: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiTokenPersistenceRuntimeSmokeContract(
  contract: AmazonSpApiTokenPersistenceRuntimeSmokeContract,
): AmazonSpApiTokenPersistenceRuntimeSmokeContract {
  if (contract.version !== AMAZON_SP_API_TOKEN_PERSISTENCE_RUNTIME_SMOKE_CONTRACT_VERSION) {
    throw new Error('Step125-C token persistence runtime smoke contract violation: version mismatch.');
  }

  assertAmazonSpApiTokenPersistenceRepositoryServiceImplementationContract(contract.sourceStep125B);

  if (
    contract.runtimeSmokeImplementedNow !== true ||
    contract.fixtureDatabaseWriteNow !== true ||
    contract.fixtureCleanupRequired !== true ||
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
    throw new Error('Step125-C token persistence runtime smoke contract violation: boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    fixtureForeignKeyPlan: contract.fixtureForeignKeyPlan,
    runtimeAssertions: contract.runtimeAssertions,
    stillForbidden: contract.stillForbidden,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step125-C token persistence runtime smoke contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.nextAllowedWork.tokenPersistenceRuntimeSmokeRecord !== true ||
    contract.nextAllowedWork.oauthStatePersistenceBridgePreimplementationContract !== true ||
    contract.nextAllowedWork.oauthCallbackRouteImplementation !== false ||
    contract.nextAllowedWork.tokenExchangeHttpImplementation !== false ||
    contract.nextAllowedWork.frontendConnectionPanelImplementation !== false ||
    contract.nextAllowedWork.realSpApiReportRequestImplementation !== false ||
    contract.summary.readyForStep125DTokenPersistenceRuntimeSmokeRecord !== true ||
    contract.summary.readyForOauthCallbackRouteImplementation !== false ||
    contract.summary.readyForTokenExchangeHttpImplementation !== false ||
    contract.summary.readyForFrontendConnectionPanelImplementation !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step125-C token persistence runtime smoke contract violation: summary mismatch.');
  }

  return contract;
}
