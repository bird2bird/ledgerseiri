import {
  assertAmazonSpApiSandboxImportJobReadModelFrontendPanelShellContract,
  buildAmazonSpApiSandboxImportJobReadModelFrontendPanelShellContract,
  type AmazonSpApiSandboxImportJobReadModelFrontendPanelShellContract,
} from './amazon-sp-api-sandbox-importjob-read-model-frontend-panel-shell.dto';

export const AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_FRONTEND_CLIENT_IMPLEMENTATION_VERSION =
  'amazon-sp-api-sandbox-importjob-read-model-frontend-client-implementation-v1' as const;

export type AmazonSpApiSandboxImportJobReadModelFrontendClientImplementationContract = {
  version: typeof AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_FRONTEND_CLIENT_IMPLEMENTATION_VERSION;
  sourceFrontendPanelShell: AmazonSpApiSandboxImportJobReadModelFrontendPanelShellContract;

  implementedNow: true;
  frontendClientImplementedNow: true;
  appsWebModifiedNow: true;
  pageIntegrationNow: false;
  backendChangedNow: false;
  schemaChangedNow: false;
  writesDatabase: false;

  clientModule: {
    file: 'apps/web/src/lib/api/amazonSpApiSandboxImportJobReadModelClient.ts';
    exportName: 'fetchAmazonSpApiSandboxImportJobReadModel';
    urlBuilderExportName: 'buildAmazonSpApiSandboxImportJobReadModelUrl';
    credentials: 'include';
    dryRunForced: true;
  };

  parserPolicy: {
    accepts200: true;
    maps400ToInvalidQuery: true;
    maps401ToUnauthenticated: true;
    maps403ToForbidden: true;
    hardFailsUnexpectedStatus: true;
    requiresDryRunTrue: true;
    requiresDisplayOnlyTrue: true;
    requiresSandboxSourceType: true;
    forbiddenFieldsHardFail: true;
  };

  forbiddenNow: {
    pageFetchIntegration: true;
    shellFetchIntegration: true;
    useEffectDataLoading: true;
    realSpApi: true;
    oauth: true;
    tokenPersistence: true;
    transactionWrite: true;
    inventoryMovementWrite: true;
    inventoryBalanceWrite: true;
    commitSalesAction: true;
    inventoryExecutionAction: true;
  };

  summary: {
    readyForFrontendClientImplementation: true;
    readyForPanelRuntimeIntegration: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiSandboxImportJobReadModelFrontendClientImplementationContract(): AmazonSpApiSandboxImportJobReadModelFrontendClientImplementationContract {
  const panelShell = assertAmazonSpApiSandboxImportJobReadModelFrontendPanelShellContract(
    buildAmazonSpApiSandboxImportJobReadModelFrontendPanelShellContract(),
  );

  return {
    version: AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_FRONTEND_CLIENT_IMPLEMENTATION_VERSION,
    sourceFrontendPanelShell: panelShell,

    implementedNow: true,
    frontendClientImplementedNow: true,
    appsWebModifiedNow: true,
    pageIntegrationNow: false,
    backendChangedNow: false,
    schemaChangedNow: false,
    writesDatabase: false,

    clientModule: {
      file: 'apps/web/src/lib/api/amazonSpApiSandboxImportJobReadModelClient.ts',
      exportName: 'fetchAmazonSpApiSandboxImportJobReadModel',
      urlBuilderExportName: 'buildAmazonSpApiSandboxImportJobReadModelUrl',
      credentials: 'include',
      dryRunForced: true,
    },

    parserPolicy: {
      accepts200: true,
      maps400ToInvalidQuery: true,
      maps401ToUnauthenticated: true,
      maps403ToForbidden: true,
      hardFailsUnexpectedStatus: true,
      requiresDryRunTrue: true,
      requiresDisplayOnlyTrue: true,
      requiresSandboxSourceType: true,
      forbiddenFieldsHardFail: true,
    },

    forbiddenNow: {
      pageFetchIntegration: true,
      shellFetchIntegration: true,
      useEffectDataLoading: true,
      realSpApi: true,
      oauth: true,
      tokenPersistence: true,
      transactionWrite: true,
      inventoryMovementWrite: true,
      inventoryBalanceWrite: true,
      commitSalesAction: true,
      inventoryExecutionAction: true,
    },

    summary: {
      readyForFrontendClientImplementation: true,
      readyForPanelRuntimeIntegration: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiSandboxImportJobReadModelFrontendClientImplementationContract(
  contract: AmazonSpApiSandboxImportJobReadModelFrontendClientImplementationContract,
): AmazonSpApiSandboxImportJobReadModelFrontendClientImplementationContract {
  if (contract.version !== AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_FRONTEND_CLIENT_IMPLEMENTATION_VERSION) {
    throw new Error('Step122-X frontend client implementation violation: version mismatch.');
  }

  if (
    contract.implementedNow !== true ||
    contract.frontendClientImplementedNow !== true ||
    contract.appsWebModifiedNow !== true ||
    contract.pageIntegrationNow !== false ||
    contract.backendChangedNow !== false ||
    contract.schemaChangedNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step122-X frontend client implementation violation: implementation boundary mismatch.');
  }

  if (
    contract.clientModule.credentials !== 'include' ||
    contract.clientModule.dryRunForced !== true
  ) {
    throw new Error('Step122-X frontend client implementation violation: client module policy mismatch.');
  }

  for (const [key, required] of Object.entries(contract.parserPolicy)) {
    if (required !== true) {
      throw new Error(`Step122-X frontend client implementation violation: parserPolicy.${key} must remain true.`);
    }
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenNow)) {
    if (forbidden !== true) {
      throw new Error(`Step122-X frontend client implementation violation: forbiddenNow.${key} must remain true.`);
    }
  }

  return contract;
}
