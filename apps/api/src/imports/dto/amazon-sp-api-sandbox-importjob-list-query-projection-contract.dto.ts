import {
  type AmazonSpApiSandboxImportJobListFilterSortContract,
  assertAmazonSpApiSandboxImportJobListFilterSortContract,
  applyAmazonSpApiSandboxImportJobListFilterSort,
  type AmazonSpApiSandboxImportJobListRowCandidate,
  type AmazonSpApiSandboxImportJobListFilterKey,
  type AmazonSpApiSandboxImportJobListSortKey,
} from './amazon-sp-api-sandbox-importjob-list-filter-sort-contract.dto';

export const AMAZON_SP_API_SANDBOX_IMPORTJOB_LIST_QUERY_PROJECTION_CONTRACT_VERSION =
  'amazon-sp-api-sandbox-importjob-list-query-projection-contract-v1' as const;

export type AmazonSpApiSandboxImportJobListProjectedRow = {
  id: string;
  filename: string;
  sourceType: string | null;
  module: string | null;
  status: string | null;
  totalRows: number;
  successRows: number | null;
  failedRows: number | null;
  importedAt: Date | string | null;
  createdAt: Date | string;
  stagingRows: number;
  stagingTargetEntityIds: Array<string | null>;
  displayLifecycle: 'pending-review' | 'non-sp-api' | 'invalid';
  displayStatus: 'PENDING' | 'NON_SP_API' | 'INVALID';
  classification: string;
  badges: string[];
  allowedActions: {
    viewOnly: boolean;
    commitSales: false;
    executeInventory: false;
    overwriteTransactions: false;
    realSpApi: false;
    oauth: false;
  };
};

export type AmazonSpApiSandboxImportJobListQueryProjectionContract = {
  version: typeof AMAZON_SP_API_SANDBOX_IMPORTJOB_LIST_QUERY_PROJECTION_CONTRACT_VERSION;
  module: 'store-orders';
  domain: 'income';
  sourceType: 'amazon-sp-api-sandbox';
  normalizedSourceType: 'AMAZON_ORDER_SP_API';

  contractOnly: true;
  controllerExposed: false;
  frontendExposed: false;
  writesDatabase: false;

  sourceFilterSortContract: AmazonSpApiSandboxImportJobListFilterSortContract;

  allowedImportJobSelect: {
    id: true;
    filename: true;
    sourceType: true;
    module: true;
    status: true;
    totalRows: true;
    successRows: true;
    failedRows: true;
    importedAt: true;
    createdAt: true;
    companyId: false;
    conflictMonthsJson: false;
    fileMonthsJson: false;
  };

  allowedStagingAggregation: {
    countRowsByImportJobId: true;
    collectTargetEntityIds: true;
    collectMatchStatus: false;
    collectRawPayloadJson: false;
    collectNormalizedPayloadJson: false;
    collectDedupeHash: false;
  };

  forbiddenProjection: {
    transactionJoin: true;
    inventoryMovementJoin: true;
    inventoryBalanceJoin: true;
    tokenJoin: true;
    credentialJoin: true;
    rawPayloadJsonInList: true;
    normalizedPayloadJsonInList: true;
    bankMatchStatus: true;
    committedSalesAmount: true;
    inventoryExecutionStatus: true;
  };

  outputRules: {
    includeClassification: true;
    includeBadges: true;
    includeAllowedActions: true;
    forceViewOnlyAction: true;
    forceCommitSalesFalse: true;
    forceExecuteInventoryFalse: true;
    forceOverwriteTransactionsFalse: true;
    forceRealSpApiFalse: true;
    forceOauthFalse: true;
  };

  paginationPolicy: {
    defaultPageSize: 20;
    allowedPageSizes: readonly [20, 50, 100];
    maxPageSize: 100;
    requireStableSort: true;
    defaultSort: 'createdAt_desc';
  };

  blockedNow: {
    controllerRoute: true;
    frontendRoute: true;
    queryImplementation: true;
    transactionJoin: true;
    inventoryJoin: true;
    rawPayloadListExposure: true;
    normalizedPayloadListExposure: true;
    realSpApi: true;
    oauth: true;
    tokenPersistence: true;
    schemaMigration: true;
  };

  summary: {
    readyForProjectionContract: true;
    readyForQueryImplementation: false;
    readyForControllerExposure: false;
    readyForFrontendExposure: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiSandboxImportJobListQueryProjectionContract(args: {
  filterSortContract: AmazonSpApiSandboxImportJobListFilterSortContract;
}): AmazonSpApiSandboxImportJobListQueryProjectionContract {
  const filterSortContract = assertAmazonSpApiSandboxImportJobListFilterSortContract(
    args.filterSortContract,
  );

  return {
    version: AMAZON_SP_API_SANDBOX_IMPORTJOB_LIST_QUERY_PROJECTION_CONTRACT_VERSION,
    module: 'store-orders',
    domain: 'income',
    sourceType: 'amazon-sp-api-sandbox',
    normalizedSourceType: 'AMAZON_ORDER_SP_API',

    contractOnly: true,
    controllerExposed: false,
    frontendExposed: false,
    writesDatabase: false,

    sourceFilterSortContract: filterSortContract,

    allowedImportJobSelect: {
      id: true,
      filename: true,
      sourceType: true,
      module: true,
      status: true,
      totalRows: true,
      successRows: true,
      failedRows: true,
      importedAt: true,
      createdAt: true,
      companyId: false,
      conflictMonthsJson: false,
      fileMonthsJson: false,
    },

    allowedStagingAggregation: {
      countRowsByImportJobId: true,
      collectTargetEntityIds: true,
      collectMatchStatus: false,
      collectRawPayloadJson: false,
      collectNormalizedPayloadJson: false,
      collectDedupeHash: false,
    },

    forbiddenProjection: {
      transactionJoin: true,
      inventoryMovementJoin: true,
      inventoryBalanceJoin: true,
      tokenJoin: true,
      credentialJoin: true,
      rawPayloadJsonInList: true,
      normalizedPayloadJsonInList: true,
      bankMatchStatus: true,
      committedSalesAmount: true,
      inventoryExecutionStatus: true,
    },

    outputRules: {
      includeClassification: true,
      includeBadges: true,
      includeAllowedActions: true,
      forceViewOnlyAction: true,
      forceCommitSalesFalse: true,
      forceExecuteInventoryFalse: true,
      forceOverwriteTransactionsFalse: true,
      forceRealSpApiFalse: true,
      forceOauthFalse: true,
    },

    paginationPolicy: {
      defaultPageSize: 20,
      allowedPageSizes: [20, 50, 100],
      maxPageSize: 100,
      requireStableSort: true,
      defaultSort: 'createdAt_desc',
    },

    blockedNow: {
      controllerRoute: true,
      frontendRoute: true,
      queryImplementation: true,
      transactionJoin: true,
      inventoryJoin: true,
      rawPayloadListExposure: true,
      normalizedPayloadListExposure: true,
      realSpApi: true,
      oauth: true,
      tokenPersistence: true,
      schemaMigration: true,
    },

    summary: {
      readyForProjectionContract: true,
      readyForQueryImplementation: false,
      readyForControllerExposure: false,
      readyForFrontendExposure: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function projectAmazonSpApiSandboxImportJobListRows(
  rows: AmazonSpApiSandboxImportJobListRowCandidate[],
  args: {
    filter: AmazonSpApiSandboxImportJobListFilterKey;
    sort: AmazonSpApiSandboxImportJobListSortKey;
    page: number;
    pageSize: 20 | 50 | 100;
  },
): {
  rows: AmazonSpApiSandboxImportJobListProjectedRow[];
  page: number;
  pageSize: 20 | 50 | 100;
  totalRows: number;
  totalPages: number;
} {
  const page = Math.max(1, Math.floor(args.page || 1));
  const pageSize = args.pageSize;
  const allowedPageSizes = [20, 50, 100] as const;

  if (!allowedPageSizes.includes(pageSize)) {
    throw new Error('Step122-D projection violation: pageSize must be 20, 50, or 100.');
  }

  const sortedRows = applyAmazonSpApiSandboxImportJobListFilterSort(rows, {
    filter: args.filter,
    sort: args.sort,
  });

  const start = (page - 1) * pageSize;
  const pagedRows = sortedRows.slice(start, start + pageSize);

  return {
    rows: pagedRows.map((row) => ({
      id: row.id,
      filename: row.filename,
      sourceType: row.sourceType,
      module: row.module,
      status: row.status,
      totalRows: row.totalRows,
      successRows: rows.find((candidate) => candidate.id === row.id)?.successRows ?? null,
      failedRows: rows.find((candidate) => candidate.id === row.id)?.failedRows ?? null,
      importedAt: rows.find((candidate) => candidate.id === row.id)?.importedAt ?? null,
      createdAt: row.createdAt,
      stagingRows: rows.find((candidate) => candidate.id === row.id)?.stagingRows ?? 0,
      stagingTargetEntityIds:
        rows.find((candidate) => candidate.id === row.id)?.stagingTargetEntityIds ?? [],
      displayLifecycle: row.classification.displayLifecycle,
      displayStatus: row.classification.displayStatus,
      classification: row.classification.classification,
      badges: row.classification.badges,
      allowedActions: row.classification.allowedActions,
    })),
    page,
    pageSize,
    totalRows: sortedRows.length,
    totalPages: Math.max(1, Math.ceil(sortedRows.length / pageSize)),
  };
}

export function assertAmazonSpApiSandboxImportJobListQueryProjectionContract(
  contract: AmazonSpApiSandboxImportJobListQueryProjectionContract,
): AmazonSpApiSandboxImportJobListQueryProjectionContract {
  if (contract.version !== AMAZON_SP_API_SANDBOX_IMPORTJOB_LIST_QUERY_PROJECTION_CONTRACT_VERSION) {
    throw new Error('Step122-D projection contract violation: version mismatch.');
  }

  if (contract.contractOnly !== true || contract.writesDatabase !== false) {
    throw new Error('Step122-D projection contract violation: contract-only and non-writing required.');
  }

  if (contract.controllerExposed !== false || contract.frontendExposed !== false) {
    throw new Error('Step122-D projection contract violation: controller/frontend must remain disabled.');
  }

  if (
    contract.allowedImportJobSelect.companyId !== false ||
    contract.allowedImportJobSelect.conflictMonthsJson !== false ||
    contract.allowedImportJobSelect.fileMonthsJson !== false
  ) {
    throw new Error('Step122-D projection contract violation: internal ImportJob fields must remain hidden from list projection.');
  }

  if (
    contract.allowedStagingAggregation.collectRawPayloadJson !== false ||
    contract.allowedStagingAggregation.collectNormalizedPayloadJson !== false ||
    contract.allowedStagingAggregation.collectDedupeHash !== false
  ) {
    throw new Error('Step122-D projection contract violation: payload/dedupe fields must remain hidden from list projection.');
  }

  for (const [key, forbidden] of Object.entries(contract.forbiddenProjection)) {
    if (forbidden !== true) {
      throw new Error(`Step122-D projection contract violation: forbiddenProjection.${key} must remain true.`);
    }
  }

  for (const [key, blocked] of Object.entries(contract.blockedNow)) {
    if (blocked !== true) {
      throw new Error(`Step122-D projection contract violation: blockedNow.${key} must remain true.`);
    }
  }

  return contract;
}
