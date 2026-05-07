import {
  assertAmazonSpApiSandboxImportJobReadModelJwtNegativeHardening,
  buildAmazonSpApiSandboxImportJobReadModelJwtNegativeHardening,
  type AmazonSpApiSandboxImportJobReadModelJwtNegativeHardening,
} from './amazon-sp-api-sandbox-importjob-read-model-jwt-negative-hardening.dto';

export const AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_FRONTEND_CONTRACT_VERSION =
  'amazon-sp-api-sandbox-importjob-read-model-frontend-contract-v1' as const;

export type AmazonSpApiSandboxImportJobReadModelFrontendContract = {
  version: typeof AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_FRONTEND_CONTRACT_VERSION;
  sourceJwtNegativeHardening: AmazonSpApiSandboxImportJobReadModelJwtNegativeHardening;

  designOnly: true;
  frontendImplementedNow: false;
  frontendFetchImplementedNow: false;
  backendChangedNow: false;
  schemaChangedNow: false;
  writesDatabase: false;

  targetFrontendSurface: {
    page: 'Import Center';
    futureRoute: '/[lang]/app/data/import';
    futurePanel: 'Amazon SP-API Sandbox ImportJob ReadModel Panel';
    mountedByDefault: false;
    requiresAuthenticatedSession: true;
  };

  endpointContract: {
    method: 'GET';
    path: '/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model';
    auth: 'existing session cookie / access_token cookie / Bearer JWT';
    query: {
      filter: readonly ['all', 'amazon-sp-api-sandbox', 'pending-review', 'uncommitted-staging', 'invalid-sp-api-sandbox'];
      sort: readonly ['createdAt_desc', 'createdAt_asc', 'filename_asc', 'filename_desc', 'totalRows_desc', 'totalRows_asc'];
      page: 'number>=1';
      pageSize: readonly [20, 50, 100];
      dryRun: true;
    };
    response: {
      dryRun: true;
      displayOnly: true;
      sourceType: 'amazon-sp-api-sandbox';
      rows: 'AmazonSpApiSandboxImportJobListProjectedRow[]';
      page: 'number';
      pageSize: '20|50|100';
      totalRows: 'number';
      totalPages: 'number';
    };
  };

  rowDisplayContract: {
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
    forbiddenFields: readonly [
      'companyId',
      'rawPayloadJson',
      'normalizedPayloadJson',
      'dedupeHash',
      'fileMonthsJson',
      'conflictMonthsJson'
    ];
    badgeSemantics: {
      pending: 'review required / uncommitted staging';
      invalid: 'invalid sandbox read-model row';
      displayOnly: 'readonly / dry-run only';
    };
  };

  frontendStateContract: {
    loading: true;
    empty: true;
    error400InvalidQuery: true;
    error401Unauthenticated: true;
    error403ForbiddenOrTenantSuspended: true;
    success200: true;
    pagination: true;
    sorting: true;
    filtering: true;
  };

  actionPolicy: {
    viewOnly: true;
    commitSalesDisabled: true;
    executeInventoryDisabled: true;
    realSpApiDisabled: true;
    oauthDisabled: true;
    tokenPersistenceDisabled: true;
  };

  futureUiCopy: {
    unauthenticated401: 'ログインが必要です。再度ログインしてください。';
    forbidden403: 'このデータを表示する権限がありません。';
    invalidQuery400: '検索条件が正しくありません。フィルターまたはページサイズを確認してください。';
    displayOnlyBanner: 'Amazon SP-API サンドボックスの読取専用プレビューです。売上計上・在庫反映は実行されません。';
    commitDisabledTooltip: 'このステップでは売上計上は無効です。';
    inventoryDisabledTooltip: 'このステップでは在庫反映は無効です。';
  };

  forbiddenNow: {
    appsWebModification: true;
    frontendFetch: true;
    sidebarNavigation: true;
    realSpApi: true;
    oauth: true;
    tokenPersistence: true;
    schemaMigration: true;
    transactionWrite: true;
    inventoryMovementWrite: true;
    inventoryBalanceWrite: true;
    commitSalesAction: true;
    inventoryExecutionAction: true;
  };

  summary: {
    readyForFrontendContractDesign: true;
    readyForFrontendImplementation: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiSandboxImportJobReadModelFrontendContract(): AmazonSpApiSandboxImportJobReadModelFrontendContract {
  const jwtNegativeHardening = assertAmazonSpApiSandboxImportJobReadModelJwtNegativeHardening(
    buildAmazonSpApiSandboxImportJobReadModelJwtNegativeHardening(),
  );

  return {
    version: AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_FRONTEND_CONTRACT_VERSION,
    sourceJwtNegativeHardening: jwtNegativeHardening,

    designOnly: true,
    frontendImplementedNow: false,
    frontendFetchImplementedNow: false,
    backendChangedNow: false,
    schemaChangedNow: false,
    writesDatabase: false,

    targetFrontendSurface: {
      page: 'Import Center',
      futureRoute: '/[lang]/app/data/import',
      futurePanel: 'Amazon SP-API Sandbox ImportJob ReadModel Panel',
      mountedByDefault: false,
      requiresAuthenticatedSession: true,
    },

    endpointContract: {
      method: 'GET',
      path: '/api/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model',
      auth: 'existing session cookie / access_token cookie / Bearer JWT',
      query: {
        filter: ['all', 'amazon-sp-api-sandbox', 'pending-review', 'uncommitted-staging', 'invalid-sp-api-sandbox'],
        sort: ['createdAt_desc', 'createdAt_asc', 'filename_asc', 'filename_desc', 'totalRows_desc', 'totalRows_asc'],
        page: 'number>=1',
        pageSize: [20, 50, 100],
        dryRun: true,
      },
      response: {
        dryRun: true,
        displayOnly: true,
        sourceType: 'amazon-sp-api-sandbox',
        rows: 'AmazonSpApiSandboxImportJobListProjectedRow[]',
        page: 'number',
        pageSize: '20|50|100',
        totalRows: 'number',
        totalPages: 'number',
      },
    },

    rowDisplayContract: {
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
      forbiddenFields: [
        'companyId',
        'rawPayloadJson',
        'normalizedPayloadJson',
        'dedupeHash',
        'fileMonthsJson',
        'conflictMonthsJson',
      ],
      badgeSemantics: {
        pending: 'review required / uncommitted staging',
        invalid: 'invalid sandbox read-model row',
        displayOnly: 'readonly / dry-run only',
      },
    },

    frontendStateContract: {
      loading: true,
      empty: true,
      error400InvalidQuery: true,
      error401Unauthenticated: true,
      error403ForbiddenOrTenantSuspended: true,
      success200: true,
      pagination: true,
      sorting: true,
      filtering: true,
    },

    actionPolicy: {
      viewOnly: true,
      commitSalesDisabled: true,
      executeInventoryDisabled: true,
      realSpApiDisabled: true,
      oauthDisabled: true,
      tokenPersistenceDisabled: true,
    },

    futureUiCopy: {
      unauthenticated401: 'ログインが必要です。再度ログインしてください。',
      forbidden403: 'このデータを表示する権限がありません。',
      invalidQuery400: '検索条件が正しくありません。フィルターまたはページサイズを確認してください。',
      displayOnlyBanner: 'Amazon SP-API サンドボックスの読取専用プレビューです。売上計上・在庫反映は実行されません。',
      commitDisabledTooltip: 'このステップでは売上計上は無効です。',
      inventoryDisabledTooltip: 'このステップでは在庫反映は無効です。',
    },

    forbiddenNow: {
      appsWebModification: true,
      frontendFetch: true,
      sidebarNavigation: true,
      realSpApi: true,
      oauth: true,
      tokenPersistence: true,
      schemaMigration: true,
      transactionWrite: true,
      inventoryMovementWrite: true,
      inventoryBalanceWrite: true,
      commitSalesAction: true,
      inventoryExecutionAction: true,
    },

    summary: {
      readyForFrontendContractDesign: true,
      readyForFrontendImplementation: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiSandboxImportJobReadModelFrontendContract(
  contract: AmazonSpApiSandboxImportJobReadModelFrontendContract,
): AmazonSpApiSandboxImportJobReadModelFrontendContract {
  if (contract.version !== AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_FRONTEND_CONTRACT_VERSION) {
    throw new Error('Step122-U frontend contract violation: version mismatch.');
  }

  if (
    contract.designOnly !== true ||
    contract.frontendImplementedNow !== false ||
    contract.frontendFetchImplementedNow !== false ||
    contract.backendChangedNow !== false ||
    contract.schemaChangedNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step122-U frontend contract violation: design-only boundary mismatch.');
  }

  if (
    contract.endpointContract.method !== 'GET' ||
    contract.endpointContract.query.dryRun !== true ||
    contract.endpointContract.response.dryRun !== true ||
    contract.endpointContract.response.displayOnly !== true ||
    contract.endpointContract.response.sourceType !== 'amazon-sp-api-sandbox'
  ) {
    throw new Error('Step122-U frontend contract violation: endpoint contract mismatch.');
  }

  for (const [key, disabled] of Object.entries(contract.actionPolicy)) {
    if (disabled !== true) {
      throw new Error(`Step122-U frontend contract violation: actionPolicy.${key} must remain true.`);
    }
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenNow)) {
    if (forbidden !== true) {
      throw new Error(`Step122-U frontend contract violation: forbiddenNow.${key} must remain true.`);
    }
  }

  return contract;
}
