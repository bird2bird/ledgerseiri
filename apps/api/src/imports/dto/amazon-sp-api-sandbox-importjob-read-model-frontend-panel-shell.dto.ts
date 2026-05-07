import {
  assertAmazonSpApiSandboxImportJobReadModelFrontendClientContract,
  buildAmazonSpApiSandboxImportJobReadModelFrontendClientContract,
  type AmazonSpApiSandboxImportJobReadModelFrontendClientContract,
} from './amazon-sp-api-sandbox-importjob-read-model-frontend-client-contract.dto';

export const AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_FRONTEND_PANEL_SHELL_VERSION =
  'amazon-sp-api-sandbox-importjob-read-model-frontend-panel-shell-v1' as const;

export type AmazonSpApiSandboxImportJobReadModelFrontendPanelShellContract = {
  version: typeof AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_FRONTEND_PANEL_SHELL_VERSION;
  sourceFrontendClientContract: AmazonSpApiSandboxImportJobReadModelFrontendClientContract;

  implementedNow: true;
  appsWebModifiedNow: true;
  uiShellOnly: true;
  frontendFetchImplementedNow: false;
  backendChangedNow: false;
  schemaChangedNow: false;
  writesDatabase: false;

  component: {
    file: 'apps/web/src/components/app/imports/AmazonSpApiSandboxReadModelPanelShell.tsx';
    exportName: 'AmazonSpApiSandboxReadModelPanelShell';
    mountedInImportCenter: true;
    dataMarker: 'data-step122-w';
  };

  uiShellContract: {
    showsDisplayOnlyBanner: true;
    showsDryRunPill: true;
    showsFilterControlsDisabled: true;
    showsSortControlsDisabled: true;
    showsPageSizeControlsDisabled: true;
    showsPreviewRowsStaticOnly: true;
    shows401StateCopy: true;
    shows403StateCopy: true;
    shows400StateCopy: true;
    showsEmptyStateCopy: true;
    commitSalesActionDisabled: true;
    inventoryExecutionActionDisabled: true;
  };

  forbiddenNow: {
    endpointStringInAppsWeb: true;
    fetchCall: true;
    frontendClientHelper: true;
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
    readyForPanelUiShell: true;
    readyForFrontendFetchIntegration: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiSandboxImportJobReadModelFrontendPanelShellContract(): AmazonSpApiSandboxImportJobReadModelFrontendPanelShellContract {
  const frontendClientContract = assertAmazonSpApiSandboxImportJobReadModelFrontendClientContract(
    buildAmazonSpApiSandboxImportJobReadModelFrontendClientContract(),
  );

  return {
    version: AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_FRONTEND_PANEL_SHELL_VERSION,
    sourceFrontendClientContract: frontendClientContract,

    implementedNow: true,
    appsWebModifiedNow: true,
    uiShellOnly: true,
    frontendFetchImplementedNow: false,
    backendChangedNow: false,
    schemaChangedNow: false,
    writesDatabase: false,

    component: {
      file: 'apps/web/src/components/app/imports/AmazonSpApiSandboxReadModelPanelShell.tsx',
      exportName: 'AmazonSpApiSandboxReadModelPanelShell',
      mountedInImportCenter: true,
      dataMarker: 'data-step122-w',
    },

    uiShellContract: {
      showsDisplayOnlyBanner: true,
      showsDryRunPill: true,
      showsFilterControlsDisabled: true,
      showsSortControlsDisabled: true,
      showsPageSizeControlsDisabled: true,
      showsPreviewRowsStaticOnly: true,
      shows401StateCopy: true,
      shows403StateCopy: true,
      shows400StateCopy: true,
      showsEmptyStateCopy: true,
      commitSalesActionDisabled: true,
      inventoryExecutionActionDisabled: true,
    },

    forbiddenNow: {
      endpointStringInAppsWeb: true,
      fetchCall: true,
      frontendClientHelper: true,
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
      readyForPanelUiShell: true,
      readyForFrontendFetchIntegration: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiSandboxImportJobReadModelFrontendPanelShellContract(
  contract: AmazonSpApiSandboxImportJobReadModelFrontendPanelShellContract,
): AmazonSpApiSandboxImportJobReadModelFrontendPanelShellContract {
  if (contract.version !== AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_FRONTEND_PANEL_SHELL_VERSION) {
    throw new Error('Step122-W frontend panel shell violation: version mismatch.');
  }

  if (
    contract.implementedNow !== true ||
    contract.appsWebModifiedNow !== true ||
    contract.uiShellOnly !== true ||
    contract.frontendFetchImplementedNow !== false ||
    contract.backendChangedNow !== false ||
    contract.schemaChangedNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step122-W frontend panel shell violation: shell-only boundary mismatch.');
  }

  for (const [key, required] of Object.entries(contract.uiShellContract)) {
    if (required !== true) {
      throw new Error(`Step122-W frontend panel shell violation: uiShellContract.${key} must remain true.`);
    }
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenNow)) {
    if (forbidden !== true) {
      throw new Error(`Step122-W frontend panel shell violation: forbiddenNow.${key} must remain true.`);
    }
  }

  return contract;
}
