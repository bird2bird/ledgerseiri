import type {
  AmazonSpApiSandboxImportJobReadModelDryRunArgs,
  AmazonSpApiSandboxImportJobReadModelDryRunResult,
} from './amazon-sp-api-sandbox-importjob-read-model-dry-run-service-design.dto';

export const AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_CONTROLLER_CONTRACT_VERSION =
  'amazon-sp-api-sandbox-importjob-read-model-controller-contract-v1' as const;

export type AmazonSpApiSandboxImportJobReadModelControllerQuery = {
  filter?: AmazonSpApiSandboxImportJobReadModelDryRunArgs['filter'];
  sort?: AmazonSpApiSandboxImportJobReadModelDryRunArgs['sort'];
  page?: number | string;
  pageSize?: 20 | 50 | 100 | '20' | '50' | '100';
  dryRun?: true | 'true';
};

export type AmazonSpApiSandboxImportJobReadModelControllerContract = {
  version: typeof AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_CONTROLLER_CONTRACT_VERSION;
  module: 'store-orders';
  domain: 'income';
  sourceType: 'amazon-sp-api-sandbox';

  contractOnly: true;
  controllerImplementedNow: false;
  controllerRouteExposedNow: false;
  frontendExposedNow: false;
  writesDatabase: false;

  futureEndpoint: {
    method: 'GET';
    path: '/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model';
    authRequired: true;
    companyIsolationRequired: true;
    internalSandboxGateRequired: true;
    dryRunRequired: true;
  };

  queryPolicy: {
    defaultFilter: 'all';
    allowedFilters: readonly [
      'all',
      'amazon-sp-api-sandbox',
      'pending-review',
      'uncommitted-staging',
      'invalid-sp-api-sandbox'
    ];
    defaultSort: 'createdAt_desc';
    allowedSorts: readonly [
      'createdAt_desc',
      'createdAt_asc',
      'filename_asc',
      'filename_desc',
      'totalRows_desc',
      'totalRows_asc'
    ];
    defaultPage: 1;
    defaultPageSize: 20;
    allowedPageSizes: readonly [20, 50, 100];
  };

  responseShape: {
    result: 'AmazonSpApiSandboxImportJobReadModelDryRunResult';
    dryRun: true;
    displayOnly: true;
    sourceType: 'amazon-sp-api-sandbox';
    rows: 'AmazonSpApiSandboxImportJobListProjectedRow[]';
    page: 'number';
    pageSize: '20|50|100';
    totalRows: 'number';
    totalPages: 'number';
  };

  forbiddenControllerBehavior: {
    postOrPatchOrDeleteRoute: true;
    dryRunFalse: true;
    rawPayloadProjection: true;
    normalizedPayloadProjection: true;
    dedupeHashProjection: true;
    transactionJoin: true;
    inventoryJoin: true;
    schemaMigration: true;
    realSpApi: true;
    oauth: true;
    tokenPersistence: true;
    commitSalesAction: true;
    inventoryExecutionAction: true;
  };

  blockedNow: {
    controllerRoute: true;
    frontendRoute: true;
    commitSales: true;
    executeInventory: true;
    realSpApi: true;
    oauth: true;
    tokenPersistence: true;
    schemaMigration: true;
  };

  summary: {
    readyForControllerContractDesign: true;
    readyForControllerImplementation: false;
    readyForFrontendExposure: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiSandboxImportJobReadModelControllerContract(): AmazonSpApiSandboxImportJobReadModelControllerContract {
  return {
    version: AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_CONTROLLER_CONTRACT_VERSION,
    module: 'store-orders',
    domain: 'income',
    sourceType: 'amazon-sp-api-sandbox',

    contractOnly: true,
    controllerImplementedNow: false,
    controllerRouteExposedNow: false,
    frontendExposedNow: false,
    writesDatabase: false,

    futureEndpoint: {
      method: 'GET',
      path: '/imports/internal/amazon-sp-api-sandbox/import-jobs/read-model',
      authRequired: true,
      companyIsolationRequired: true,
      internalSandboxGateRequired: true,
      dryRunRequired: true,
    },

    queryPolicy: {
      defaultFilter: 'all',
      allowedFilters: [
        'all',
        'amazon-sp-api-sandbox',
        'pending-review',
        'uncommitted-staging',
        'invalid-sp-api-sandbox',
      ],
      defaultSort: 'createdAt_desc',
      allowedSorts: [
        'createdAt_desc',
        'createdAt_asc',
        'filename_asc',
        'filename_desc',
        'totalRows_desc',
        'totalRows_asc',
      ],
      defaultPage: 1,
      defaultPageSize: 20,
      allowedPageSizes: [20, 50, 100],
    },

    responseShape: {
      result: 'AmazonSpApiSandboxImportJobReadModelDryRunResult',
      dryRun: true,
      displayOnly: true,
      sourceType: 'amazon-sp-api-sandbox',
      rows: 'AmazonSpApiSandboxImportJobListProjectedRow[]',
      page: 'number',
      pageSize: '20|50|100',
      totalRows: 'number',
      totalPages: 'number',
    },

    forbiddenControllerBehavior: {
      postOrPatchOrDeleteRoute: true,
      dryRunFalse: true,
      rawPayloadProjection: true,
      normalizedPayloadProjection: true,
      dedupeHashProjection: true,
      transactionJoin: true,
      inventoryJoin: true,
      schemaMigration: true,
      realSpApi: true,
      oauth: true,
      tokenPersistence: true,
      commitSalesAction: true,
      inventoryExecutionAction: true,
    },

    blockedNow: {
      controllerRoute: true,
      frontendRoute: true,
      commitSales: true,
      executeInventory: true,
      realSpApi: true,
      oauth: true,
      tokenPersistence: true,
      schemaMigration: true,
    },

    summary: {
      readyForControllerContractDesign: true,
      readyForControllerImplementation: false,
      readyForFrontendExposure: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function normalizeAmazonSpApiSandboxImportJobReadModelControllerQuery(
  query: AmazonSpApiSandboxImportJobReadModelControllerQuery,
): AmazonSpApiSandboxImportJobReadModelDryRunArgs {
  const contract = buildAmazonSpApiSandboxImportJobReadModelControllerContract();

  const filter = query.filter || contract.queryPolicy.defaultFilter;
  const sort = query.sort || contract.queryPolicy.defaultSort;
  const page = Math.max(1, Math.floor(Number(query.page || contract.queryPolicy.defaultPage)));
  const pageSize = Number(query.pageSize || contract.queryPolicy.defaultPageSize);

  if (!contract.queryPolicy.allowedFilters.includes(filter)) {
    throw new Error('Step122-H controller contract violation: invalid filter.');
  }

  if (!contract.queryPolicy.allowedSorts.includes(sort)) {
    throw new Error('Step122-H controller contract violation: invalid sort.');
  }

  if (!contract.queryPolicy.allowedPageSizes.includes(pageSize as 20 | 50 | 100)) {
    throw new Error('Step122-H controller contract violation: invalid pageSize.');
  }

  if (query.dryRun !== true && query.dryRun !== 'true') {
    throw new Error('Step122-H controller contract violation: dryRun=true is required.');
  }

  return {
    filter,
    sort,
    page,
    pageSize: pageSize as 20 | 50 | 100,
    dryRun: true,
  };
}

export function assertAmazonSpApiSandboxImportJobReadModelControllerContract(
  contract: AmazonSpApiSandboxImportJobReadModelControllerContract,
): AmazonSpApiSandboxImportJobReadModelControllerContract {
  if (contract.version !== AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_CONTROLLER_CONTRACT_VERSION) {
    throw new Error('Step122-H controller contract violation: version mismatch.');
  }

  if (
    contract.contractOnly !== true ||
    contract.controllerImplementedNow !== false ||
    contract.controllerRouteExposedNow !== false ||
    contract.frontendExposedNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step122-H controller contract violation: contract-only disabled controller required.');
  }

  if (
    contract.futureEndpoint.method !== 'GET' ||
    contract.futureEndpoint.authRequired !== true ||
    contract.futureEndpoint.companyIsolationRequired !== true ||
    contract.futureEndpoint.internalSandboxGateRequired !== true ||
    contract.futureEndpoint.dryRunRequired !== true
  ) {
    throw new Error('Step122-H controller contract violation: future endpoint safety policy mismatch.');
  }

  for (const [key, blocked] of Object.entries(contract.forbiddenControllerBehavior)) {
    if (blocked !== true) {
      throw new Error(`Step122-H controller contract violation: forbiddenControllerBehavior.${key} must remain true.`);
    }
  }

  for (const [key, blocked] of Object.entries(contract.blockedNow)) {
    if (blocked !== true) {
      throw new Error(`Step122-H controller contract violation: blockedNow.${key} must remain true.`);
    }
  }

  return contract;
}
