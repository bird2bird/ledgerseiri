import {
  assertAmazonSpApiTokenPersistenceRepositoryServicePreimplementationContract,
  buildAmazonSpApiTokenPersistenceRepositoryServicePreimplementationContract,
  type AmazonSpApiTokenPersistenceRepositoryServicePreimplementationContract,
} from './amazon-sp-api-token-persistence-repository-service-preimplementation-contract.dto';

export const AMAZON_SP_API_TOKEN_PERSISTENCE_REPOSITORY_SERVICE_IMPLEMENTATION_CONTRACT_VERSION =
  'amazon-sp-api-token-persistence-repository-service-implementation-contract-v4' as const;

export type AmazonSpApiTokenPersistenceRepositoryServiceImplementationContract = {
  version: typeof AMAZON_SP_API_TOKEN_PERSISTENCE_REPOSITORY_SERVICE_IMPLEMENTATION_CONTRACT_VERSION;
  sourceStep125A: AmazonSpApiTokenPersistenceRepositoryServicePreimplementationContract;

  repositoryImplementationNow: true;
  tokenPersistenceServiceImplementationNow: true;
  databaseWriteCapabilityImplementedNow: true;

  oauthCallbackRouteAddedNow: false;
  authorizationRouteAddedNow: false;
  tokenExchangeHttpCallNow: false;
  lwaHttpCallNow: false;
  frontendAddedNow: false;
  realSpApiRequestNow: false;
  importJobWriteNow: false;
  transactionWriteNow: false;
  inventoryWriteNow: false;

  smokeScannerRefinements: {
    messageScannerIgnoresFunctionParameters: true;
    messageScannerRejectsOnlyMessageObjectFields: true;
  };

  schemaAlignedFields: {
    appIdRequired: true;
    connectedAtUsedInsteadOfLastAuthorizedAt: true;
    revokedAtUsedInsteadOfDisconnectedAt: true;
    rotatedAtRequiredForCredential: true;
    scopeUsedInsteadOfScopeJson: true;
    messageRedactedUsedInsteadOfMessage: true;
  };

  implementedFiles: {
    repository: 'apps/api/src/imports/amazon-sp-api-token-persistence.repository.ts';
    service: 'apps/api/src/imports/amazon-sp-api-token-persistence.service.ts';
    module: 'apps/api/src/imports/imports.module.ts';
  };

  implementedRepositoryMethods: {
    upsertConnectionWithEncryptedRefreshCredential: true;
    upsertAccessTokenCache: true;
    readConnectionStatus: true;
    revokeConnection: true;
    appendAudit: true;
  };

  phaseCorrectRegressionPlan: {
    preImplementationSmokeSkippedAfterImplementation: true;
    step125BImplementationSmokeRequired: true;
    step124GMigrationExecutionSmokeRequired: true;
    step125APreImplementationSmokeWouldFailByDesignAfterRepositoryWriteImplementation: true;
  };

  implementedSecurityGuards: {
    encryptedRefreshTokenOnly: true;
    encryptedAccessTokenOnly: true;
    noPlaintextTokenReturn: true;
    auditMessageRedaction: true;
    companyIdStoreIdScopeRequired: true;
    noOAuthHttpCall: true;
    noAmazonSpApiHttpCall: true;
  };

  summary: {
    readyForStep125CTokenPersistenceRuntimeSmoke: true;
    readyForOauthCallbackRouteImplementation: false;
    readyForTokenExchangeHttpImplementation: false;
    readyForFrontendConnectionPanelImplementation: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSalesImport: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiTokenPersistenceRepositoryServiceImplementationContract(): AmazonSpApiTokenPersistenceRepositoryServiceImplementationContract {
  const step125A = assertAmazonSpApiTokenPersistenceRepositoryServicePreimplementationContract(
    buildAmazonSpApiTokenPersistenceRepositoryServicePreimplementationContract(),
  );

  return {
    version: AMAZON_SP_API_TOKEN_PERSISTENCE_REPOSITORY_SERVICE_IMPLEMENTATION_CONTRACT_VERSION,
    sourceStep125A: step125A,

    repositoryImplementationNow: true,
    tokenPersistenceServiceImplementationNow: true,
    databaseWriteCapabilityImplementedNow: true,

    oauthCallbackRouteAddedNow: false,
    authorizationRouteAddedNow: false,
    tokenExchangeHttpCallNow: false,
    lwaHttpCallNow: false,
    frontendAddedNow: false,
    realSpApiRequestNow: false,
    importJobWriteNow: false,
    transactionWriteNow: false,
    inventoryWriteNow: false,

    smokeScannerRefinements: {
      messageScannerIgnoresFunctionParameters: true,
      messageScannerRejectsOnlyMessageObjectFields: true,
    },

    schemaAlignedFields: {
      appIdRequired: true,
      connectedAtUsedInsteadOfLastAuthorizedAt: true,
      revokedAtUsedInsteadOfDisconnectedAt: true,
      rotatedAtRequiredForCredential: true,
      scopeUsedInsteadOfScopeJson: true,
      messageRedactedUsedInsteadOfMessage: true,
    },

    implementedFiles: {
      repository: 'apps/api/src/imports/amazon-sp-api-token-persistence.repository.ts',
      service: 'apps/api/src/imports/amazon-sp-api-token-persistence.service.ts',
      module: 'apps/api/src/imports/imports.module.ts',
    },

    implementedRepositoryMethods: {
      upsertConnectionWithEncryptedRefreshCredential: true,
      upsertAccessTokenCache: true,
      readConnectionStatus: true,
      revokeConnection: true,
      appendAudit: true,
    },

    phaseCorrectRegressionPlan: {
      preImplementationSmokeSkippedAfterImplementation: true,
      step125BImplementationSmokeRequired: true,
      step124GMigrationExecutionSmokeRequired: true,
      step125APreImplementationSmokeWouldFailByDesignAfterRepositoryWriteImplementation: true,
    },

    implementedSecurityGuards: {
      encryptedRefreshTokenOnly: true,
      encryptedAccessTokenOnly: true,
      noPlaintextTokenReturn: true,
      auditMessageRedaction: true,
      companyIdStoreIdScopeRequired: true,
      noOAuthHttpCall: true,
      noAmazonSpApiHttpCall: true,
    },

    summary: {
      readyForStep125CTokenPersistenceRuntimeSmoke: true,
      readyForOauthCallbackRouteImplementation: false,
      readyForTokenExchangeHttpImplementation: false,
      readyForFrontendConnectionPanelImplementation: false,
      readyForRealSpApiReportRequest: false,
      readyForCommittedSalesImport: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiTokenPersistenceRepositoryServiceImplementationContract(
  contract: AmazonSpApiTokenPersistenceRepositoryServiceImplementationContract,
): AmazonSpApiTokenPersistenceRepositoryServiceImplementationContract {
  if (contract.version !== AMAZON_SP_API_TOKEN_PERSISTENCE_REPOSITORY_SERVICE_IMPLEMENTATION_CONTRACT_VERSION) {
    throw new Error('Step125-B token persistence repository/service implementation contract violation: version mismatch.');
  }

  assertAmazonSpApiTokenPersistenceRepositoryServicePreimplementationContract(contract.sourceStep125A);

  if (
    contract.repositoryImplementationNow !== true ||
    contract.tokenPersistenceServiceImplementationNow !== true ||
    contract.databaseWriteCapabilityImplementedNow !== true ||
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
    throw new Error('Step125-B token persistence repository/service implementation contract violation: boundary mismatch.');
  }

  for (const [sectionName, section] of Object.entries({
    smokeScannerRefinements: contract.smokeScannerRefinements,
    schemaAlignedFields: contract.schemaAlignedFields,
    phaseCorrectRegressionPlan: contract.phaseCorrectRegressionPlan,
    implementedRepositoryMethods: contract.implementedRepositoryMethods,
    implementedSecurityGuards: contract.implementedSecurityGuards,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step125-B token persistence repository/service implementation contract violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  if (
    contract.summary.readyForStep125CTokenPersistenceRuntimeSmoke !== true ||
    contract.summary.readyForOauthCallbackRouteImplementation !== false ||
    contract.summary.readyForTokenExchangeHttpImplementation !== false ||
    contract.summary.readyForFrontendConnectionPanelImplementation !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSalesImport !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step125-B token persistence repository/service implementation contract violation: summary mismatch.');
  }

  return contract;
}
