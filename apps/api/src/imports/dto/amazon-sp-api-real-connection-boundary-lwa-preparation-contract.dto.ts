import {
  assertAmazonSpApiSandboxImportJobReadModelVisualRuntimeQaContract,
  buildAmazonSpApiSandboxImportJobReadModelVisualRuntimeQaContract,
  type AmazonSpApiSandboxImportJobReadModelVisualRuntimeQaContract,
} from './amazon-sp-api-sandbox-importjob-read-model-visual-runtime-qa.dto';

export const AMAZON_SP_API_REAL_CONNECTION_BOUNDARY_LWA_PREPARATION_CONTRACT_VERSION =
  'amazon-sp-api-real-connection-boundary-lwa-preparation-contract-v1' as const;

export type AmazonSpApiConnectionMode =
  | 'not-connected'
  | 'lwa-oauth-preparation'
  | 'lwa-oauth-authorized'
  | 'sp-api-report-readonly';

export type AmazonSpApiRealConnectionBoundaryLwaPreparationContract = {
  version: typeof AMAZON_SP_API_REAL_CONNECTION_BOUNDARY_LWA_PREPARATION_CONTRACT_VERSION;
  sourceStep122VisualRuntimeQa: AmazonSpApiSandboxImportJobReadModelVisualRuntimeQaContract;

  contractOnly: true;
  implementationNow: false;
  backendRouteAddedNow: false;
  frontendRouteAddedNow: false;
  schemaChangedNow: false;
  tokenPersistenceNow: false;
  realSpApiRequestNow: false;
  writesDatabase: false;

  connectionBoundary: {
    currentMode: 'lwa-oauth-preparation';
    allowedFutureModes: AmazonSpApiConnectionMode[];
    sandboxSourceType: 'amazon-sp-api-sandbox';
    realSourceType: 'amazon-sp-api';
    tenantIsolationKey: 'companyId';
    storeIsolationRequired: true;
    marketplaceIsolationRequired: true;
    regionIsolationRequired: true;
  };

  lwaPreparationContract: {
    authorizationUrlDesignOnly: true;
    callbackRouteDesignOnly: true;
    stateParameterRequired: true;
    stateMustBindCompanyId: true;
    stateMustBindStoreId: true;
    stateMustUseNonce: true;
    stateMustExpire: true;
    authorizationCodeOneTimeUse: true;
    refreshTokenStorageForbiddenNow: true;
    accessTokenStorageForbiddenNow: true;
    clientSecretStorageForbiddenNow: true;
  };

  futureCredentialStoragePolicy: {
    credentialTableRequiredBeforePersistence: true;
    encryptedAtRestRequired: true;
    companyIdRequired: true;
    storeIdRequired: true;
    marketplaceIdRequired: true;
    regionRequired: true;
    tokenRotationRequired: true;
    revokeDisconnectRequired: true;
    auditLogRequired: true;
  };

  futureReportPipelineBoundary: {
    createReportRequestFutureOnly: true;
    pollingFutureOnly: true;
    documentDownloadFutureOnly: true;
    rawReportStorageFutureOnly: true;
    normalizedImportJobFutureOnly: true;
    dryRunFirstRequired: true;
    commitSalesRequiresSeparateStep: true;
    inventoryExecutionRequiresSeparateStep: true;
  };

  forbiddenNow: {
    amazonCredentialSchema: true;
    amazonTokenSchema: true;
    oauthCallbackRoute: true;
    lwaAuthorizationRoute: true;
    tokenExchangeHttpCall: true;
    refreshTokenPersistence: true;
    accessTokenPersistence: true;
    clientSecretPersistence: true;
    realSpApiHttpCall: true;
    createReportCall: true;
    getReportCall: true;
    getReportDocumentCall: true;
    transactionWrite: true;
    inventoryWrite: true;
    commitSalesAction: true;
    inventoryExecutionAction: true;
  };

  summary: {
    readyForLwaBoundaryDesign: true;
    readyForOauthRouteImplementation: false;
    readyForTokenPersistence: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiRealConnectionBoundaryLwaPreparationContract(): AmazonSpApiRealConnectionBoundaryLwaPreparationContract {
  const step122Qa = assertAmazonSpApiSandboxImportJobReadModelVisualRuntimeQaContract(
    buildAmazonSpApiSandboxImportJobReadModelVisualRuntimeQaContract(),
  );

  return {
    version: AMAZON_SP_API_REAL_CONNECTION_BOUNDARY_LWA_PREPARATION_CONTRACT_VERSION,
    sourceStep122VisualRuntimeQa: step122Qa,

    contractOnly: true,
    implementationNow: false,
    backendRouteAddedNow: false,
    frontendRouteAddedNow: false,
    schemaChangedNow: false,
    tokenPersistenceNow: false,
    realSpApiRequestNow: false,
    writesDatabase: false,

    connectionBoundary: {
      currentMode: 'lwa-oauth-preparation',
      allowedFutureModes: [
        'not-connected',
        'lwa-oauth-preparation',
        'lwa-oauth-authorized',
        'sp-api-report-readonly',
      ],
      sandboxSourceType: 'amazon-sp-api-sandbox',
      realSourceType: 'amazon-sp-api',
      tenantIsolationKey: 'companyId',
      storeIsolationRequired: true,
      marketplaceIsolationRequired: true,
      regionIsolationRequired: true,
    },

    lwaPreparationContract: {
      authorizationUrlDesignOnly: true,
      callbackRouteDesignOnly: true,
      stateParameterRequired: true,
      stateMustBindCompanyId: true,
      stateMustBindStoreId: true,
      stateMustUseNonce: true,
      stateMustExpire: true,
      authorizationCodeOneTimeUse: true,
      refreshTokenStorageForbiddenNow: true,
      accessTokenStorageForbiddenNow: true,
      clientSecretStorageForbiddenNow: true,
    },

    futureCredentialStoragePolicy: {
      credentialTableRequiredBeforePersistence: true,
      encryptedAtRestRequired: true,
      companyIdRequired: true,
      storeIdRequired: true,
      marketplaceIdRequired: true,
      regionRequired: true,
      tokenRotationRequired: true,
      revokeDisconnectRequired: true,
      auditLogRequired: true,
    },

    futureReportPipelineBoundary: {
      createReportRequestFutureOnly: true,
      pollingFutureOnly: true,
      documentDownloadFutureOnly: true,
      rawReportStorageFutureOnly: true,
      normalizedImportJobFutureOnly: true,
      dryRunFirstRequired: true,
      commitSalesRequiresSeparateStep: true,
      inventoryExecutionRequiresSeparateStep: true,
    },

    forbiddenNow: {
      amazonCredentialSchema: true,
      amazonTokenSchema: true,
      oauthCallbackRoute: true,
      lwaAuthorizationRoute: true,
      tokenExchangeHttpCall: true,
      refreshTokenPersistence: true,
      accessTokenPersistence: true,
      clientSecretPersistence: true,
      realSpApiHttpCall: true,
      createReportCall: true,
      getReportCall: true,
      getReportDocumentCall: true,
      transactionWrite: true,
      inventoryWrite: true,
      commitSalesAction: true,
      inventoryExecutionAction: true,
    },

    summary: {
      readyForLwaBoundaryDesign: true,
      readyForOauthRouteImplementation: false,
      readyForTokenPersistence: false,
      readyForRealSpApiReportRequest: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiRealConnectionBoundaryLwaPreparationContract(
  contract: AmazonSpApiRealConnectionBoundaryLwaPreparationContract,
): AmazonSpApiRealConnectionBoundaryLwaPreparationContract {
  if (contract.version !== AMAZON_SP_API_REAL_CONNECTION_BOUNDARY_LWA_PREPARATION_CONTRACT_VERSION) {
    throw new Error('Step123-A real connection boundary violation: version mismatch.');
  }

  if (
    contract.contractOnly !== true ||
    contract.implementationNow !== false ||
    contract.backendRouteAddedNow !== false ||
    contract.frontendRouteAddedNow !== false ||
    contract.schemaChangedNow !== false ||
    contract.tokenPersistenceNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step123-A real connection boundary violation: implementation boundary mismatch.');
  }

  if (
    contract.connectionBoundary.sandboxSourceType !== 'amazon-sp-api-sandbox' ||
    contract.connectionBoundary.realSourceType !== 'amazon-sp-api' ||
    contract.connectionBoundary.tenantIsolationKey !== 'companyId'
  ) {
    throw new Error('Step123-A real connection boundary violation: source/tenant boundary mismatch.');
  }

  for (const [key, required] of Object.entries(contract.lwaPreparationContract)) {
    if (required !== true) {
      throw new Error(`Step123-A real connection boundary violation: lwaPreparationContract.${key} must remain true.`);
    }
  }

  for (const [key, required] of Object.entries(contract.futureCredentialStoragePolicy)) {
    if (required !== true) {
      throw new Error(`Step123-A real connection boundary violation: futureCredentialStoragePolicy.${key} must remain true.`);
    }
  }

  for (const [key, required] of Object.entries(contract.futureReportPipelineBoundary)) {
    if (required !== true) {
      throw new Error(`Step123-A real connection boundary violation: futureReportPipelineBoundary.${key} must remain true.`);
    }
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenNow)) {
    if (forbidden !== true) {
      throw new Error(`Step123-A real connection boundary violation: forbiddenNow.${key} must remain true.`);
    }
  }

  return contract;
}
