import {
  type AmazonSpApiSandboxImportJobListQueryClassificationPolicy,
  assertAmazonSpApiSandboxImportJobListQueryClassificationPolicy,
  classifyAmazonSpApiSandboxImportJobListCandidate,
  type AmazonSpApiSandboxImportJobListCandidate,
  type AmazonSpApiSandboxImportJobListClassificationResult,
} from './amazon-sp-api-sandbox-importjob-list-query-classification-policy.dto';

export const AMAZON_SP_API_SANDBOX_IMPORTJOB_LIST_FILTER_SORT_CONTRACT_VERSION =
  'amazon-sp-api-sandbox-importjob-list-filter-sort-contract-v1' as const;

export type AmazonSpApiSandboxImportJobListFilterKey =
  | 'all'
  | 'amazon-sp-api-sandbox'
  | 'pending-review'
  | 'uncommitted-staging'
  | 'invalid-sp-api-sandbox';

export type AmazonSpApiSandboxImportJobListSortKey =
  | 'createdAt_desc'
  | 'createdAt_asc'
  | 'filename_asc'
  | 'filename_desc'
  | 'totalRows_desc'
  | 'totalRows_asc';

export type AmazonSpApiSandboxImportJobListFilterSortContract = {
  version: typeof AMAZON_SP_API_SANDBOX_IMPORTJOB_LIST_FILTER_SORT_CONTRACT_VERSION;
  module: 'store-orders';
  domain: 'income';
  sourceType: 'amazon-sp-api-sandbox';
  normalizedSourceType: 'AMAZON_ORDER_SP_API';

  contractOnly: true;
  controllerExposed: false;
  frontendExposed: false;
  writesDatabase: false;

  sourceClassificationPolicy: AmazonSpApiSandboxImportJobListQueryClassificationPolicy;

  allowedFilters: {
    defaultFilter: 'all';
    sourceTypeFilter: 'amazon-sp-api-sandbox';
    lifecycleFilter: 'pending-review';
    stagingFilter: 'uncommitted-staging';
    invalidFilter: 'invalid-sp-api-sandbox';
    committedSalesFilterAllowed: false;
    inventoryExecutedFilterAllowed: false;
    realSpApiFilterAllowed: false;
    oauthFilterAllowed: false;
  };

  allowedSorts: {
    defaultSort: 'createdAt_desc';
    supported: readonly [
      'createdAt_desc',
      'createdAt_asc',
      'filename_asc',
      'filename_desc',
      'totalRows_desc',
      'totalRows_asc'
    ];
    sortByCommittedSalesAllowed: false;
    sortByInventoryExecutionAllowed: false;
    sortByTransactionAmountAllowed: false;
  };

  queryProjectionPolicy: {
    importJobFields: readonly [
      'id',
      'filename',
      'sourceType',
      'module',
      'status',
      'totalRows',
      'successRows',
      'failedRows',
      'importedAt',
      'createdAt'
    ];
    stagingAggregationFields: readonly [
      'stagingRows',
      'stagingTargetEntityIds'
    ];
    transactionFieldsAllowed: false;
    inventoryMovementFieldsAllowed: false;
    tokenFieldsAllowed: false;
    credentialFieldsAllowed: false;
  };

  listItemRules: {
    showOnlyAsPendingReview: true;
    showBadgesFromClassification: true;
    viewOnlyPrimaryAction: true;
    commitActionAllowed: false;
    inventoryActionAllowed: false;
    overwriteActionAllowed: false;
    realSpApiActionAllowed: false;
    oauthActionAllowed: false;
  };

  blockedNow: {
    controllerRoute: true;
    frontendRoute: true;
    queryImplementation: true;
    transactionJoin: true;
    inventoryJoin: true;
    realSpApi: true;
    oauth: true;
    tokenPersistence: true;
    schemaMigration: true;
  };

  summary: {
    readyForFilterSortContract: true;
    readyForQueryImplementation: false;
    readyForControllerExposure: false;
    readyForFrontendExposure: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export type AmazonSpApiSandboxImportJobListRowCandidate =
  AmazonSpApiSandboxImportJobListCandidate & {
    id: string;
    filename: string;
    createdAt: Date | string;
    totalRows: number;
  };

export type AmazonSpApiSandboxImportJobListRowView = {
  id: string;
  filename: string;
  sourceType: string | null;
  module: string | null;
  status: string | null;
  createdAt: Date | string;
  totalRows: number;
  classification: AmazonSpApiSandboxImportJobListClassificationResult;
};

export function buildAmazonSpApiSandboxImportJobListFilterSortContract(args: {
  classificationPolicy: AmazonSpApiSandboxImportJobListQueryClassificationPolicy;
}): AmazonSpApiSandboxImportJobListFilterSortContract {
  const classificationPolicy = assertAmazonSpApiSandboxImportJobListQueryClassificationPolicy(
    args.classificationPolicy,
  );

  return {
    version: AMAZON_SP_API_SANDBOX_IMPORTJOB_LIST_FILTER_SORT_CONTRACT_VERSION,
    module: 'store-orders',
    domain: 'income',
    sourceType: 'amazon-sp-api-sandbox',
    normalizedSourceType: 'AMAZON_ORDER_SP_API',

    contractOnly: true,
    controllerExposed: false,
    frontendExposed: false,
    writesDatabase: false,

    sourceClassificationPolicy: classificationPolicy,

    allowedFilters: {
      defaultFilter: 'all',
      sourceTypeFilter: 'amazon-sp-api-sandbox',
      lifecycleFilter: 'pending-review',
      stagingFilter: 'uncommitted-staging',
      invalidFilter: 'invalid-sp-api-sandbox',
      committedSalesFilterAllowed: false,
      inventoryExecutedFilterAllowed: false,
      realSpApiFilterAllowed: false,
      oauthFilterAllowed: false,
    },

    allowedSorts: {
      defaultSort: 'createdAt_desc',
      supported: [
        'createdAt_desc',
        'createdAt_asc',
        'filename_asc',
        'filename_desc',
        'totalRows_desc',
        'totalRows_asc',
      ],
      sortByCommittedSalesAllowed: false,
      sortByInventoryExecutionAllowed: false,
      sortByTransactionAmountAllowed: false,
    },

    queryProjectionPolicy: {
      importJobFields: [
        'id',
        'filename',
        'sourceType',
        'module',
        'status',
        'totalRows',
        'successRows',
        'failedRows',
        'importedAt',
        'createdAt',
      ],
      stagingAggregationFields: [
        'stagingRows',
        'stagingTargetEntityIds',
      ],
      transactionFieldsAllowed: false,
      inventoryMovementFieldsAllowed: false,
      tokenFieldsAllowed: false,
      credentialFieldsAllowed: false,
    },

    listItemRules: {
      showOnlyAsPendingReview: true,
      showBadgesFromClassification: true,
      viewOnlyPrimaryAction: true,
      commitActionAllowed: false,
      inventoryActionAllowed: false,
      overwriteActionAllowed: false,
      realSpApiActionAllowed: false,
      oauthActionAllowed: false,
    },

    blockedNow: {
      controllerRoute: true,
      frontendRoute: true,
      queryImplementation: true,
      transactionJoin: true,
      inventoryJoin: true,
      realSpApi: true,
      oauth: true,
      tokenPersistence: true,
      schemaMigration: true,
    },

    summary: {
      readyForFilterSortContract: true,
      readyForQueryImplementation: false,
      readyForControllerExposure: false,
      readyForFrontendExposure: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function applyAmazonSpApiSandboxImportJobListFilterSort(
  rows: AmazonSpApiSandboxImportJobListRowCandidate[],
  args: {
    filter: AmazonSpApiSandboxImportJobListFilterKey;
    sort: AmazonSpApiSandboxImportJobListSortKey;
  },
): AmazonSpApiSandboxImportJobListRowView[] {
  const views = rows.map((row) => ({
    id: row.id,
    filename: row.filename,
    sourceType: row.sourceType,
    module: row.module,
    status: row.status,
    createdAt: row.createdAt,
    totalRows: row.totalRows,
    classification: classifyAmazonSpApiSandboxImportJobListCandidate(row),
  }));

  const filtered = views.filter((row) => {
    switch (args.filter) {
      case 'all':
        return true;
      case 'amazon-sp-api-sandbox':
        return row.sourceType === 'amazon-sp-api-sandbox';
      case 'pending-review':
        return row.classification.classification === 'AMAZON_SP_API_SANDBOX_PENDING_REVIEW';
      case 'uncommitted-staging':
        return row.classification.classification === 'AMAZON_SP_API_SANDBOX_UNCOMMITTED_STAGING';
      case 'invalid-sp-api-sandbox':
        return row.classification.classification === 'INVALID_SP_API_SANDBOX_IMPORT_JOB';
      default:
        return false;
    }
  });

  const toTime = (value: Date | string) => new Date(value).getTime();

  return [...filtered].sort((a, b) => {
    switch (args.sort) {
      case 'createdAt_asc':
        return toTime(a.createdAt) - toTime(b.createdAt);
      case 'createdAt_desc':
        return toTime(b.createdAt) - toTime(a.createdAt);
      case 'filename_asc':
        return a.filename.localeCompare(b.filename);
      case 'filename_desc':
        return b.filename.localeCompare(a.filename);
      case 'totalRows_asc':
        return a.totalRows - b.totalRows;
      case 'totalRows_desc':
        return b.totalRows - a.totalRows;
      default:
        return 0;
    }
  });
}

export function assertAmazonSpApiSandboxImportJobListFilterSortContract(
  contract: AmazonSpApiSandboxImportJobListFilterSortContract,
): AmazonSpApiSandboxImportJobListFilterSortContract {
  if (contract.version !== AMAZON_SP_API_SANDBOX_IMPORTJOB_LIST_FILTER_SORT_CONTRACT_VERSION) {
    throw new Error('Step122-C filter/sort contract violation: version mismatch.');
  }

  if (contract.contractOnly !== true || contract.writesDatabase !== false) {
    throw new Error('Step122-C filter/sort contract violation: contract-only and non-writing required.');
  }

  if (contract.controllerExposed !== false || contract.frontendExposed !== false) {
    throw new Error('Step122-C filter/sort contract violation: controller/frontend must remain disabled.');
  }

  if (
    contract.allowedFilters.committedSalesFilterAllowed !== false ||
    contract.allowedFilters.inventoryExecutedFilterAllowed !== false ||
    contract.allowedFilters.realSpApiFilterAllowed !== false ||
    contract.allowedFilters.oauthFilterAllowed !== false
  ) {
    throw new Error('Step122-C filter/sort contract violation: dangerous filters must remain disabled.');
  }

  if (
    contract.allowedSorts.sortByCommittedSalesAllowed !== false ||
    contract.allowedSorts.sortByInventoryExecutionAllowed !== false ||
    contract.allowedSorts.sortByTransactionAmountAllowed !== false
  ) {
    throw new Error('Step122-C filter/sort contract violation: dangerous sorts must remain disabled.');
  }

  if (
    contract.queryProjectionPolicy.transactionFieldsAllowed !== false ||
    contract.queryProjectionPolicy.inventoryMovementFieldsAllowed !== false ||
    contract.queryProjectionPolicy.tokenFieldsAllowed !== false ||
    contract.queryProjectionPolicy.credentialFieldsAllowed !== false
  ) {
    throw new Error('Step122-C filter/sort contract violation: dangerous projection fields must remain disabled.');
  }

  for (const [key, blocked] of Object.entries(contract.blockedNow)) {
    if (blocked !== true) {
      throw new Error(`Step122-C filter/sort contract violation: blockedNow.${key} must remain true.`);
    }
  }

  return contract;
}
