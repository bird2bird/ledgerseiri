import {
  assertAmazonSpApiSandboxImportJobReadModelFrontendClientImplementationContract,
  buildAmazonSpApiSandboxImportJobReadModelFrontendClientImplementationContract,
  type AmazonSpApiSandboxImportJobReadModelFrontendClientImplementationContract,
} from './amazon-sp-api-sandbox-importjob-read-model-frontend-client-implementation.dto';

export const AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_FRONTEND_RUNTIME_INTEGRATION_VERSION =
  'amazon-sp-api-sandbox-importjob-read-model-frontend-runtime-integration-v1' as const;

export type AmazonSpApiSandboxImportJobReadModelFrontendRuntimeIntegrationContract = {
  version: typeof AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_FRONTEND_RUNTIME_INTEGRATION_VERSION;
  sourceFrontendClientImplementation: AmazonSpApiSandboxImportJobReadModelFrontendClientImplementationContract;

  implementedNow: true;
  panelRuntimeIntegrationNow: true;
  frontendClientImplementedNow: true;
  appsWebModifiedNow: true;
  backendChangedNow: false;
  schemaChangedNow: false;
  writesDatabase: false;

  runtimePanel: {
    componentFile: 'apps/web/src/components/app/imports/AmazonSpApiSandboxReadModelPanelShell.tsx';
    dataMarker: 'data-step122-y';
    usesClientHelper: true;
    usesUseEffectRuntimeLoad: true;
    credentialsIncludeViaClient: true;
    dryRunForcedViaClient: true;
  };

  uiBehavior: {
    loadingState: true;
    emptyState: true;
    error400State: true;
    error401State: true;
    error403State: true;
    unsafeResponseState: true;
    filterControlEnabled: true;
    sortControlEnabled: true;
    pageSizeControlEnabled: true;
    paginationEnabled: true;
    commitSalesDisabled: true;
    inventoryExecutionDisabled: true;
  };

  forbiddenNow: {
    realSpApi: true;
    oauth: true;
    tokenPersistence: true;
    backendControllerChange: true;
    backendServiceChange: true;
    schemaMigration: true;
    transactionWrite: true;
    inventoryMovementWrite: true;
    inventoryBalanceWrite: true;
    commitSalesAction: true;
    inventoryExecutionAction: true;
  };

  summary: {
    readyForPanelRuntimeIntegration: true;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
    readyForRealSpApi: false;
  };
};

export function buildAmazonSpApiSandboxImportJobReadModelFrontendRuntimeIntegrationContract(): AmazonSpApiSandboxImportJobReadModelFrontendRuntimeIntegrationContract {
  const clientImplementation = assertAmazonSpApiSandboxImportJobReadModelFrontendClientImplementationContract(
    buildAmazonSpApiSandboxImportJobReadModelFrontendClientImplementationContract(),
  );

  return {
    version: AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_FRONTEND_RUNTIME_INTEGRATION_VERSION,
    sourceFrontendClientImplementation: clientImplementation,

    implementedNow: true,
    panelRuntimeIntegrationNow: true,
    frontendClientImplementedNow: true,
    appsWebModifiedNow: true,
    backendChangedNow: false,
    schemaChangedNow: false,
    writesDatabase: false,

    runtimePanel: {
      componentFile: 'apps/web/src/components/app/imports/AmazonSpApiSandboxReadModelPanelShell.tsx',
      dataMarker: 'data-step122-y',
      usesClientHelper: true,
      usesUseEffectRuntimeLoad: true,
      credentialsIncludeViaClient: true,
      dryRunForcedViaClient: true,
    },

    uiBehavior: {
      loadingState: true,
      emptyState: true,
      error400State: true,
      error401State: true,
      error403State: true,
      unsafeResponseState: true,
      filterControlEnabled: true,
      sortControlEnabled: true,
      pageSizeControlEnabled: true,
      paginationEnabled: true,
      commitSalesDisabled: true,
      inventoryExecutionDisabled: true,
    },

    forbiddenNow: {
      realSpApi: true,
      oauth: true,
      tokenPersistence: true,
      backendControllerChange: true,
      backendServiceChange: true,
      schemaMigration: true,
      transactionWrite: true,
      inventoryMovementWrite: true,
      inventoryBalanceWrite: true,
      commitSalesAction: true,
      inventoryExecutionAction: true,
    },

    summary: {
      readyForPanelRuntimeIntegration: true,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
      readyForRealSpApi: false,
    },
  };
}

export function assertAmazonSpApiSandboxImportJobReadModelFrontendRuntimeIntegrationContract(
  contract: AmazonSpApiSandboxImportJobReadModelFrontendRuntimeIntegrationContract,
): AmazonSpApiSandboxImportJobReadModelFrontendRuntimeIntegrationContract {
  if (contract.version !== AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_FRONTEND_RUNTIME_INTEGRATION_VERSION) {
    throw new Error('Step122-Y frontend runtime integration violation: version mismatch.');
  }

  if (
    contract.implementedNow !== true ||
    contract.panelRuntimeIntegrationNow !== true ||
    contract.frontendClientImplementedNow !== true ||
    contract.appsWebModifiedNow !== true ||
    contract.backendChangedNow !== false ||
    contract.schemaChangedNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step122-Y frontend runtime integration violation: implementation boundary mismatch.');
  }

  for (const [key, required] of Object.entries(contract.uiBehavior)) {
    if (required !== true) {
      throw new Error(`Step122-Y frontend runtime integration violation: uiBehavior.${key} must remain true.`);
    }
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenNow)) {
    if (forbidden !== true) {
      throw new Error(`Step122-Y frontend runtime integration violation: forbiddenNow.${key} must remain true.`);
    }
  }

  return contract;
}
