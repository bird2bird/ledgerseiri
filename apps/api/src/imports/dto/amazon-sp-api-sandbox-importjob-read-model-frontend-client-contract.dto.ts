import {
  assertAmazonSpApiSandboxImportJobReadModelFrontendContract,
  buildAmazonSpApiSandboxImportJobReadModelFrontendContract,
  type AmazonSpApiSandboxImportJobReadModelFrontendContract,
} from './amazon-sp-api-sandbox-importjob-read-model-frontend-contract.dto';

export const AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_FRONTEND_CLIENT_CONTRACT_VERSION =
  'amazon-sp-api-sandbox-importjob-read-model-frontend-client-contract-v1' as const;

export type AmazonSpApiSandboxImportJobReadModelFrontendClientContract = {
  version: typeof AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_FRONTEND_CLIENT_CONTRACT_VERSION;
  sourceFrontendContract: AmazonSpApiSandboxImportJobReadModelFrontendContract;

  designOnly: true;
  frontendClientImplementedNow: false;
  appsWebModifiedNow: false;
  backendChangedNow: false;
  schemaChangedNow: false;
  writesDatabase: false;

  futureClientModule: {
    targetFile: 'apps/web/src/lib/api/amazonSpApiSandboxImportJobReadModelClient.ts';
    exportName: 'fetchAmazonSpApiSandboxImportJobReadModel';
    implementationStep: 'Step122-X-or-later';
    usedBy: 'Import Center Amazon SP-API sandbox read-model panel';
  };

  requestBuilderContract: {
    method: 'GET';
    endpointPath: '/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model';
    credentials: 'include';
    authSource: 'browser-managed cookie session / access_token cookie';
    allowedQuery: {
      filter: readonly ['all', 'amazon-sp-api-sandbox', 'pending-review', 'uncommitted-staging', 'invalid-sp-api-sandbox'];
      sort: readonly ['createdAt_desc', 'createdAt_asc', 'filename_asc', 'filename_desc', 'totalRows_desc', 'totalRows_asc'];
      page: 'positive integer';
      pageSize: readonly [20, 50, 100];
      dryRun: true;
    };
    forbiddenQuery: readonly ['companyId', 'dryRun=false', 'realSpApi=true', 'oauth=true', 'commit=true', 'executeInventory=true'];
  };

  responseParserContract: {
    acceptedStatus: readonly [200, 400, 401, 403];
    hardFailStatus: 'any other HTTP status';
    success200: {
      mustHaveDryRunTrue: true;
      mustHaveDisplayOnlyTrue: true;
      mustHaveSourceType: 'amazon-sp-api-sandbox';
      rowsMustBeArray: true;
      pageMustBeNumber: true;
      pageSizeMustBeAllowed: true;
      totalRowsMustBeNumber: true;
      totalPagesMustBeNumber: true;
    };
    error400: 'invalid-query';
    error401: 'unauthenticated';
    error403: 'forbidden-or-tenant-suspended';
  };

  projectedRowParserContract: {
    allowedFields: readonly [
      'id',
      'filename',
      'sourceType',
      'module',
      'status',
      'displayStatus',
      'classification',
      'totalRows',
      'successRows',
      'failedRows',
      'stagingRows',
      'createdAt',
      'updatedAt',
      'importedAt',
      'allowedActions'
    ];
    forbiddenFieldsHardFail: readonly [
      'companyId',
      'rawPayloadJson',
      'normalizedPayloadJson',
      'dedupeHash',
      'fileMonthsJson',
      'conflictMonthsJson',
      'raw',
      'payload',
      'normalizedPayload'
    ];
    allowedActionsContract: {
      viewOnly: true;
      commitSales: false;
      executeInventory: false;
      realSpApi: false;
      oauth: false;
    };
  };

  uiStateMappingContract: {
    loading: 'loading';
    success200: 'ready';
    emptyRows: 'empty';
    invalidQuery400: 'invalid-query-error';
    unauthenticated401: 'login-required-error';
    forbidden403: 'permission-error';
    unexpectedStatus: 'unexpected-error';
    parserHardFail: 'unsafe-response-error';
  };

  safetyPolicy: {
    dryRunAlwaysTrue: true;
    displayOnlyAlwaysTrue: true;
    neverTrustCompanyIdFromClient: true;
    neverExposeForbiddenFields: true;
    neverEnableCommitSales: true;
    neverEnableInventoryExecution: true;
    neverEnableRealSpApi: true;
    neverEnableOauth: true;
    neverPersistToken: true;
  };

  forbiddenNow: {
    createAppsWebClientFile: true;
    modifyAppsWeb: true;
    frontendFetchImplementation: true;
    pageIntegration: true;
    routeIntegration: true;
    sidebarNavigation: true;
    schemaMigration: true;
    backendControllerChange: true;
    backendServiceChange: true;
    realSpApi: true;
    oauth: true;
    tokenPersistence: true;
    commitSalesAction: true;
    inventoryExecutionAction: true;
  };

  summary: {
    readyForFrontendClientContractDesign: true;
    readyForFrontendClientImplementation: false;
    readyForPanelUiShell: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiSandboxImportJobReadModelFrontendClientContract(): AmazonSpApiSandboxImportJobReadModelFrontendClientContract {
  const frontendContract = assertAmazonSpApiSandboxImportJobReadModelFrontendContract(
    buildAmazonSpApiSandboxImportJobReadModelFrontendContract(),
  );

  return {
    version: AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_FRONTEND_CLIENT_CONTRACT_VERSION,
    sourceFrontendContract: frontendContract,

    designOnly: true,
    frontendClientImplementedNow: false,
    appsWebModifiedNow: false,
    backendChangedNow: false,
    schemaChangedNow: false,
    writesDatabase: false,

    futureClientModule: {
      targetFile: 'apps/web/src/lib/api/amazonSpApiSandboxImportJobReadModelClient.ts',
      exportName: 'fetchAmazonSpApiSandboxImportJobReadModel',
      implementationStep: 'Step122-X-or-later',
      usedBy: 'Import Center Amazon SP-API sandbox read-model panel',
    },

    requestBuilderContract: {
      method: 'GET',
      endpointPath: '/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model',
      credentials: 'include',
      authSource: 'browser-managed cookie session / access_token cookie',
      allowedQuery: {
        filter: ['all', 'amazon-sp-api-sandbox', 'pending-review', 'uncommitted-staging', 'invalid-sp-api-sandbox'],
        sort: ['createdAt_desc', 'createdAt_asc', 'filename_asc', 'filename_desc', 'totalRows_desc', 'totalRows_asc'],
        page: 'positive integer',
        pageSize: [20, 50, 100],
        dryRun: true,
      },
      forbiddenQuery: ['companyId', 'dryRun=false', 'realSpApi=true', 'oauth=true', 'commit=true', 'executeInventory=true'],
    },

    responseParserContract: {
      acceptedStatus: [200, 400, 401, 403],
      hardFailStatus: 'any other HTTP status',
      success200: {
        mustHaveDryRunTrue: true,
        mustHaveDisplayOnlyTrue: true,
        mustHaveSourceType: 'amazon-sp-api-sandbox',
        rowsMustBeArray: true,
        pageMustBeNumber: true,
        pageSizeMustBeAllowed: true,
        totalRowsMustBeNumber: true,
        totalPagesMustBeNumber: true,
      },
      error400: 'invalid-query',
      error401: 'unauthenticated',
      error403: 'forbidden-or-tenant-suspended',
    },

    projectedRowParserContract: {
      allowedFields: [
        'id',
        'filename',
        'sourceType',
        'module',
        'status',
        'displayStatus',
        'classification',
        'totalRows',
        'successRows',
        'failedRows',
        'stagingRows',
        'createdAt',
        'updatedAt',
        'importedAt',
        'allowedActions',
      ],
      forbiddenFieldsHardFail: [
        'companyId',
        'rawPayloadJson',
        'normalizedPayloadJson',
        'dedupeHash',
        'fileMonthsJson',
        'conflictMonthsJson',
        'raw',
        'payload',
        'normalizedPayload',
      ],
      allowedActionsContract: {
        viewOnly: true,
        commitSales: false,
        executeInventory: false,
        realSpApi: false,
        oauth: false,
      },
    },

    uiStateMappingContract: {
      loading: 'loading',
      success200: 'ready',
      emptyRows: 'empty',
      invalidQuery400: 'invalid-query-error',
      unauthenticated401: 'login-required-error',
      forbidden403: 'permission-error',
      unexpectedStatus: 'unexpected-error',
      parserHardFail: 'unsafe-response-error',
    },

    safetyPolicy: {
      dryRunAlwaysTrue: true,
      displayOnlyAlwaysTrue: true,
      neverTrustCompanyIdFromClient: true,
      neverExposeForbiddenFields: true,
      neverEnableCommitSales: true,
      neverEnableInventoryExecution: true,
      neverEnableRealSpApi: true,
      neverEnableOauth: true,
      neverPersistToken: true,
    },

    forbiddenNow: {
      createAppsWebClientFile: true,
      modifyAppsWeb: true,
      frontendFetchImplementation: true,
      pageIntegration: true,
      routeIntegration: true,
      sidebarNavigation: true,
      schemaMigration: true,
      backendControllerChange: true,
      backendServiceChange: true,
      realSpApi: true,
      oauth: true,
      tokenPersistence: true,
      commitSalesAction: true,
      inventoryExecutionAction: true,
    },

    summary: {
      readyForFrontendClientContractDesign: true,
      readyForFrontendClientImplementation: false,
      readyForPanelUiShell: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiSandboxImportJobReadModelFrontendClientContract(
  contract: AmazonSpApiSandboxImportJobReadModelFrontendClientContract,
): AmazonSpApiSandboxImportJobReadModelFrontendClientContract {
  if (contract.version !== AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_FRONTEND_CLIENT_CONTRACT_VERSION) {
    throw new Error('Step122-V frontend client contract violation: version mismatch.');
  }

  if (
    contract.designOnly !== true ||
    contract.frontendClientImplementedNow !== false ||
    contract.appsWebModifiedNow !== false ||
    contract.backendChangedNow !== false ||
    contract.schemaChangedNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step122-V frontend client contract violation: design-only boundary mismatch.');
  }

  if (
    contract.requestBuilderContract.method !== 'GET' ||
    contract.requestBuilderContract.endpointPath !== '/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model' ||
    contract.requestBuilderContract.credentials !== 'include' ||
    contract.requestBuilderContract.allowedQuery.dryRun !== true
  ) {
    throw new Error('Step122-V frontend client contract violation: request builder mismatch.');
  }

  if (
    contract.responseParserContract.success200.mustHaveDryRunTrue !== true ||
    contract.responseParserContract.success200.mustHaveDisplayOnlyTrue !== true ||
    contract.responseParserContract.success200.mustHaveSourceType !== 'amazon-sp-api-sandbox'
  ) {
    throw new Error('Step122-V frontend client contract violation: response parser safety mismatch.');
  }

  for (const [key, expected] of Object.entries(contract.projectedRowParserContract.allowedActionsContract)) {
    if (key === 'viewOnly' && expected !== true) {
      throw new Error('Step122-V frontend client contract violation: viewOnly must remain true.');
    }
    if (key !== 'viewOnly' && expected !== false) {
      throw new Error(`Step122-V frontend client contract violation: ${key} must remain false.`);
    }
  }

  for (const [key, required] of Object.entries(contract.safetyPolicy)) {
    if (required !== true) {
      throw new Error(`Step122-V frontend client contract violation: safetyPolicy.${key} must remain true.`);
    }
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenNow)) {
    if (forbidden !== true) {
      throw new Error(`Step122-V frontend client contract violation: forbiddenNow.${key} must remain true.`);
    }
  }

  return contract;
}
