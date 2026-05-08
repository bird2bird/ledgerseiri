import {
  assertAmazonSpApiTokenPersistenceRuntimeSmokeContract,
  buildAmazonSpApiTokenPersistenceRuntimeSmokeContract,
  type AmazonSpApiTokenPersistenceRuntimeSmokeContract,
} from './amazon-sp-api-token-persistence-runtime-smoke-contract.dto';

export const AMAZON_SP_API_TOKEN_PERSISTENCE_RUNTIME_SMOKE_RECORD_HANDOFF_CONTRACT_VERSION =
  'amazon-sp-api-token-persistence-runtime-smoke-record-handoff-contract-v1' as const;

export type AmazonSpApiTokenPersistenceRuntimeSmokeRecordHandoffContract = {
  version: typeof AMAZON_SP_API_TOKEN_PERSISTENCE_RUNTIME_SMOKE_RECORD_HANDOFF_CONTRACT_VERSION;
  sourceStep125C: AmazonSpApiTokenPersistenceRuntimeSmokeContract;

  recordOnly: true;
  handoffOnly: true;
  runtimeSmokeRecordedNow: true;
  tokenPersistenceLayerClosedNow: true;

  databaseSchemaAlreadyDeployed: true;
  repositoryServiceImplemented: true;
  runtimeFixtureWriteVerified: true;
  runtimeFixtureCleanupVerified: true;

  oauthCallbackRouteAddedNow: false;
  authorizationRouteAddedNow: false;
  tokenExchangeHttpCallNow: false;
  lwaHttpCallNow: false;
  frontendAddedNow: false;
  realSpApiRequestNow: false;
  importJobWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;

  completedTokenPersistenceCapabilities: {
    upsertConnectionWithEncryptedRefreshCredential: true;
    upsertCredentialWithRotatedAt: true;
    upsertAccessTokenCacheWithScopeAndExpiresAt: true;
    readConnectionStatusWithoutTokenPayload: true;
    revokeConnectionAndCredential: true;
    deleteAccessTokenCacheOnRevoke: true;
    appendMessageRedactedAudit: true;
    companyStoreForeignKeySafeFixtureVerified: true;
    cleanupDeletesAmazonRowsBeforeStoreCompanyRows: true;
  };

  persistentSafetyBoundaries: {
    noPlaintextRefreshTokenPersistence: true;
    noPlaintextAccessTokenPersistence: true;
    noTokenPayloadInReadModel: true;
    noTokenLogging: true;
    noUnscopedCompanyStoreLookup: true;
    noOAuthRouteYet: true;
    noLwaTokenExchangeYet: true;
    noFrontendConnectionPanelYet: true;
    noRealAmazonSpApiRequestYet: true;
  };

  nextStagePlan: {
    nextRecommendedStep: 'Step126-A';
    step126AName: 'Amazon SP-API OAuth state persistence bridge pre-implementation contract';
    purpose: 'Bridge signed OAuth state / callback preflight with token persistence readiness without adding routes or calling LWA yet.';
    allowedNow: {
      oauthStatePersistenceBridgePreimplementationContract: true;
      oauthCallbackRouteImplementation: false;
      tokenExchangeHttpImplementation: false;
      frontendConnectionPanelImplementation: false;
      realSpApiReportRequestImplementation: false;
    };
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

  summary: {
    tokenPersistencePhaseCompleted: true;
    readyForStep126AOauthStatePersistenceBridgePreimplementationContract: true;
    readyForOauthCallbackRouteImplementation: false;
    readyForTokenExchangeHttpImplementation: false;
    readyForFrontendConnectionPanelImplementation: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiTokenPersistenceRuntimeSmokeRecordHandoffContract(): AmazonSpApiTokenPersistenceRuntimeSmokeRecordHandoffContract {
  const step125C = assertAmazonSpApiTokenPersistenceRuntimeSmokeContract(
    buildAmazonSpApiTokenPersistenceRuntimeSmokeContract(),
  );

  return {
    version: AMAZON_SP_API_TOKEN_PERSISTENCE_RUNTIME_SMOKE_RECORD_HANDOFF_CONTRACT_VERSION,
    sourceStep125C: step125C,

    recordOnly: true,
    handoffOnly: true,
    runtimeSmokeRecordedNow: true,
    tokenPersistenceLayerClosedNow: true,

    databaseSchemaAlreadyDeployed: true,
    repositoryServiceImplemented: true,
    runtimeFixtureWriteVerified: true,
    runtimeFixtureCleanupVerified: true,

    oauthCallbackRouteAddedNow: false,
    authorizationRouteAddedNow: false,
    tokenExchangeHttpCallNow: false,
    lwaHttpCallNow: false,
    frontendAddedNow: false,
    realSpApiRequestNow: false,
    importJobWriteNow: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,

    completedTokenPersistenceCapabilities: {
      upsertConnectionWithEncryptedRefreshCredential: true,
      upsertCredentialWithRotatedAt: true,
      upsertAccessTokenCacheWithScopeAndExpiresAt: true,
      readConnectionStatusWithoutTokenPayload: true,
      revokeConnectionAndCredential: true,
      deleteAccessTokenCacheOnRevoke: true,
      appendMessageRedactedAudit: true,
      companyStoreForeignKeySafeFixtureVerified: true,
      cleanupDeletesAmazonRowsBeforeStoreCompanyRows: true,
    },

    persistentSafetyBoundaries: {
      noPlaintextRefreshTokenPersistence: true,
      noPlaintextAccessTokenPersistence: true,
      noTokenPayloadInReadModel: true,
      noTokenLogging: true,
      noUnscopedCompanyStoreLookup: true,
      noOAuthRouteYet: true,
      noLwaTokenExchangeYet: true,
      noFrontendConnectionPanelYet: true,
      noRealAmazonSpApiRequestYet: true,
    },

    nextStagePlan: {
      nextRecommendedStep: 'Step126-A',
      step126AName: 'Amazon SP-API OAuth state persistence bridge pre-implementation contract',
      purpose: 'Bridge signed OAuth state / callback preflight with token persistence readiness without adding routes or calling LWA yet.',
      allowedNow: {
        oauthStatePersistenceBridgePreimplementationContract: true,
        oauthCallbackRouteImplementation: false,
        tokenExchangeHttpImplementation: false,
        frontendConnectionPanelImplementation: false,
        realSpApiReportRequestImplementation: false,
      },
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

    summary: {
      tokenPersistencePhaseCompleted: true,
      readyForStep126AOauthStatePersistenceBridgePreimplementationContract: true,
      readyForOauthCallbackRouteImplementation: false,
      readyForTokenExchangeHttpImplementation: false,
      readyForFrontendConnectionPanelImplementation: false,
      readyForRealSpApiReportRequest: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiTokenPersistenceRuntimeSmokeRecordHandoffContract(
  contract: AmazonSpApiTokenPersistenceRuntimeSmokeRecordHandoffContract,
): AmazonSpApiTokenPersistenceRuntimeSmokeRecordHandoffContract {
  if (contract.version !== AMAZON_SP_API_TOKEN_PERSISTENCE_RUNTIME_SMOKE_RECORD_HANDOFF_CONTRACT_VERSION) {
    throw new Error('Step125-D token persistence runtime smoke record/handoff contract violation: version mismatch.');
  }

  assertAmazonSpApiTokenPersistenceRuntimeSmokeContract(contract.sourceStep125C);

  if (
    contract.recordOnly !== true ||
    contract.handoffOnly !== true ||
    contract.runtimeSmokeRecordedNow !== true ||
    contract.tokenPersistenceLayerClosedNow !== true ||
    contract.databaseSchemaAlreadyDeployed !== true ||
    contract.repositoryServiceImplemented !== true ||
    contract.runtimeFixtureWriteVerified !== true ||
    contract.runtimeFixtureCleanupVerified !== true ||
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
    throw new Error('Step125-D token persistence runtime smoke record/handoff contract violation: boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    completedTokenPersistenceCapabilities: contract.completedTokenPersistenceCapabilities,
    persistentSafetyBoundaries: contract.persistentSafetyBoundaries,
    stillForbidden: contract.stillForbidden,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step125-D token persistence runtime smoke record/handoff contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.nextStagePlan.nextRecommendedStep !== 'Step126-A' ||
    contract.nextStagePlan.allowedNow.oauthStatePersistenceBridgePreimplementationContract !== true ||
    contract.nextStagePlan.allowedNow.oauthCallbackRouteImplementation !== false ||
    contract.nextStagePlan.allowedNow.tokenExchangeHttpImplementation !== false ||
    contract.nextStagePlan.allowedNow.frontendConnectionPanelImplementation !== false ||
    contract.nextStagePlan.allowedNow.realSpApiReportRequestImplementation !== false ||
    contract.summary.tokenPersistencePhaseCompleted !== true ||
    contract.summary.readyForStep126AOauthStatePersistenceBridgePreimplementationContract !== true ||
    contract.summary.readyForOauthCallbackRouteImplementation !== false ||
    contract.summary.readyForTokenExchangeHttpImplementation !== false ||
    contract.summary.readyForFrontendConnectionPanelImplementation !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step125-D token persistence runtime smoke record/handoff contract violation: summary mismatch.');
  }

  return contract;
}
