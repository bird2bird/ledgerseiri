import {
  assertAmazonSpApiSandboxImportJobReadModelFrontendRuntimeIntegrationContract,
  buildAmazonSpApiSandboxImportJobReadModelFrontendRuntimeIntegrationContract,
  type AmazonSpApiSandboxImportJobReadModelFrontendRuntimeIntegrationContract,
} from './amazon-sp-api-sandbox-importjob-read-model-frontend-runtime-integration.dto';

export const AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_VISUAL_RUNTIME_QA_VERSION =
  'amazon-sp-api-sandbox-importjob-read-model-visual-runtime-qa-v1' as const;

export type AmazonSpApiSandboxImportJobReadModelVisualRuntimeQaContract = {
  version: typeof AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_VISUAL_RUNTIME_QA_VERSION;
  sourceRuntimeIntegration: AmazonSpApiSandboxImportJobReadModelFrontendRuntimeIntegrationContract;

  qaOnly: true;
  appsWebChangedNow: false;
  backendChangedNow: false;
  schemaChangedNow: false;
  writesDatabase: false;

  qaCoverage: {
    importCenterMount: true;
    runtimePanelMarker: true;
    typedClientHelper: true;
    loadingState: true;
    emptyState: true;
    error400State: true;
    error401State: true;
    error403State: true;
    unsafeResponseState: true;
    filterControl: true;
    sortControl: true;
    pageSizeControl: true;
    paginationControl: true;
    disabledCommitAction: true;
    disabledInventoryAction: true;
    sharedFrontendBoundary: true;
  };

  forbiddenNow: {
    realSpApi: true;
    oauth: true;
    tokenPersistence: true;
    rawFetchInPanel: true;
    endpointOutsideClient: true;
    transactionWrite: true;
    inventoryWrite: true;
    commitSalesAction: true;
    inventoryExecutionAction: true;
  };

  summary: {
    readyForVisualRuntimeQa: true;
    readyForRealSpApi: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiSandboxImportJobReadModelVisualRuntimeQaContract(): AmazonSpApiSandboxImportJobReadModelVisualRuntimeQaContract {
  const runtimeIntegration = assertAmazonSpApiSandboxImportJobReadModelFrontendRuntimeIntegrationContract(
    buildAmazonSpApiSandboxImportJobReadModelFrontendRuntimeIntegrationContract(),
  );

  return {
    version: AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_VISUAL_RUNTIME_QA_VERSION,
    sourceRuntimeIntegration: runtimeIntegration,

    qaOnly: true,
    appsWebChangedNow: false,
    backendChangedNow: false,
    schemaChangedNow: false,
    writesDatabase: false,

    qaCoverage: {
      importCenterMount: true,
      runtimePanelMarker: true,
      typedClientHelper: true,
      loadingState: true,
      emptyState: true,
      error400State: true,
      error401State: true,
      error403State: true,
      unsafeResponseState: true,
      filterControl: true,
      sortControl: true,
      pageSizeControl: true,
      paginationControl: true,
      disabledCommitAction: true,
      disabledInventoryAction: true,
      sharedFrontendBoundary: true,
    },

    forbiddenNow: {
      realSpApi: true,
      oauth: true,
      tokenPersistence: true,
      rawFetchInPanel: true,
      endpointOutsideClient: true,
      transactionWrite: true,
      inventoryWrite: true,
      commitSalesAction: true,
      inventoryExecutionAction: true,
    },

    summary: {
      readyForVisualRuntimeQa: true,
      readyForRealSpApi: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiSandboxImportJobReadModelVisualRuntimeQaContract(
  contract: AmazonSpApiSandboxImportJobReadModelVisualRuntimeQaContract,
): AmazonSpApiSandboxImportJobReadModelVisualRuntimeQaContract {
  if (contract.version !== AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_VISUAL_RUNTIME_QA_VERSION) {
    throw new Error('Step122-Z visual/runtime QA violation: version mismatch.');
  }

  if (
    contract.qaOnly !== true ||
    contract.appsWebChangedNow !== false ||
    contract.backendChangedNow !== false ||
    contract.schemaChangedNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step122-Z visual/runtime QA violation: QA boundary mismatch.');
  }

  for (const [key, covered] of Object.entries(contract.qaCoverage)) {
    if (covered !== true) {
      throw new Error(`Step122-Z visual/runtime QA violation: qaCoverage.${key} must remain true.`);
    }
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenNow)) {
    if (forbidden !== true) {
      throw new Error(`Step122-Z visual/runtime QA violation: forbiddenNow.${key} must remain true.`);
    }
  }

  return contract;
}
