export const AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_READONLY_CONTROLLER_IMPLEMENTATION_VERSION =
  'amazon-sp-api-sandbox-importjob-read-model-readonly-controller-implementation-v1' as const;

export type AmazonSpApiSandboxImportJobReadModelReadonlyControllerImplementationContract = {
  version: typeof AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_READONLY_CONTROLLER_IMPLEMENTATION_VERSION;

  implementedNow: true;
  routeMethod: 'GET';
  routePath: '/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model';
  controllerMethod: 'amazonSpApiSandboxImportJobReadModelEnvGatedBlockedRoute';
  serviceMethod: 'listAmazonSpApiSandboxImportJobsReadModelDryRun';

  readonlyOnly: true;
  dryRunRequired: true;
  envGateRequired: true;
  queryNormalizationRequired: true;
  frontendExposedNow: false;
  writesDatabase: false;

  controllerPolicy: {
    mayCallReadModelService: true;
    mayReturnProjectedRows: true;
    mustNotTrustQueryCompanyId: true;
    mustNotReturnRawPayloadJson: true;
    mustNotReturnNormalizedPayloadJson: true;
    mustNotReturnDedupeHash: true;
  };

  forbiddenBehavior: {
    rawPayloadProjection: true;
    normalizedPayloadProjection: true;
    dedupeHashProjection: true;
    transactionJoin: true;
    inventoryMovementJoin: true;
    inventoryBalanceJoin: true;
    transactionWrite: true;
    inventoryMovementWrite: true;
    inventoryBalanceWrite: true;
    importJobWrite: true;
    importStagingRowWrite: true;
    schemaMigration: true;
    realSpApi: true;
    oauth: true;
    tokenPersistence: true;
    commitSalesAction: true;
    inventoryExecutionAction: true;
    frontendExposure: true;
  };

  responseContract: {
    type: 'AmazonSpApiSandboxImportJobReadModelDryRunResult';
    dryRun: true;
    displayOnly: true;
    sourceType: 'amazon-sp-api-sandbox';
    rows: 'AmazonSpApiSandboxImportJobListProjectedRow[]';
    page: 'number';
    pageSize: '20|50|100';
    totalRows: 'number';
    totalPages: 'number';
  };

  summary: {
    readyForInternalReadonlyControllerUsage: true;
    readyForFrontendExposure: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiSandboxImportJobReadModelReadonlyControllerImplementationContract(): AmazonSpApiSandboxImportJobReadModelReadonlyControllerImplementationContract {
  return {
    version: AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_READONLY_CONTROLLER_IMPLEMENTATION_VERSION,

    implementedNow: true,
    routeMethod: 'GET',
    routePath: '/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model',
    controllerMethod: 'amazonSpApiSandboxImportJobReadModelEnvGatedBlockedRoute',
    serviceMethod: 'listAmazonSpApiSandboxImportJobsReadModelDryRun',

    readonlyOnly: true,
    dryRunRequired: true,
    envGateRequired: true,
    queryNormalizationRequired: true,
    frontendExposedNow: false,
    writesDatabase: false,

    controllerPolicy: {
      mayCallReadModelService: true,
      mayReturnProjectedRows: true,
      mustNotTrustQueryCompanyId: true,
      mustNotReturnRawPayloadJson: true,
      mustNotReturnNormalizedPayloadJson: true,
      mustNotReturnDedupeHash: true,
    },

    forbiddenBehavior: {
      rawPayloadProjection: true,
      normalizedPayloadProjection: true,
      dedupeHashProjection: true,
      transactionJoin: true,
      inventoryMovementJoin: true,
      inventoryBalanceJoin: true,
      transactionWrite: true,
      inventoryMovementWrite: true,
      inventoryBalanceWrite: true,
      importJobWrite: true,
      importStagingRowWrite: true,
      schemaMigration: true,
      realSpApi: true,
      oauth: true,
      tokenPersistence: true,
      commitSalesAction: true,
      inventoryExecutionAction: true,
      frontendExposure: true,
    },

    responseContract: {
      type: 'AmazonSpApiSandboxImportJobReadModelDryRunResult',
      dryRun: true,
      displayOnly: true,
      sourceType: 'amazon-sp-api-sandbox',
      rows: 'AmazonSpApiSandboxImportJobListProjectedRow[]',
      page: 'number',
      pageSize: '20|50|100',
      totalRows: 'number',
      totalPages: 'number',
    },

    summary: {
      readyForInternalReadonlyControllerUsage: true,
      readyForFrontendExposure: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiSandboxImportJobReadModelReadonlyControllerImplementationContract(
  contract: AmazonSpApiSandboxImportJobReadModelReadonlyControllerImplementationContract,
): AmazonSpApiSandboxImportJobReadModelReadonlyControllerImplementationContract {
  if (contract.version !== AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_READONLY_CONTROLLER_IMPLEMENTATION_VERSION) {
    throw new Error('Step122-O readonly controller implementation contract violation: version mismatch.');
  }

  if (
    contract.implementedNow !== true ||
    contract.readonlyOnly !== true ||
    contract.dryRunRequired !== true ||
    contract.envGateRequired !== true ||
    contract.queryNormalizationRequired !== true ||
    contract.frontendExposedNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step122-O readonly controller implementation contract violation: readonly implementation policy mismatch.');
  }

  if (
    contract.controllerPolicy.mayCallReadModelService !== true ||
    contract.controllerPolicy.mayReturnProjectedRows !== true ||
    contract.controllerPolicy.mustNotTrustQueryCompanyId !== true ||
    contract.controllerPolicy.mustNotReturnRawPayloadJson !== true ||
    contract.controllerPolicy.mustNotReturnNormalizedPayloadJson !== true ||
    contract.controllerPolicy.mustNotReturnDedupeHash !== true
  ) {
    throw new Error('Step122-O readonly controller implementation contract violation: controller policy mismatch.');
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenBehavior)) {
    if (forbidden !== true) {
      throw new Error(`Step122-O readonly controller implementation contract violation: forbiddenBehavior.${key} must remain true.`);
    }
  }

  return contract;
}
