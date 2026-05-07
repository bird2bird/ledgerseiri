import {
  type AmazonSpApiSandboxImportJobListQueryProjectionContract,
  assertAmazonSpApiSandboxImportJobListQueryProjectionContract,
  projectAmazonSpApiSandboxImportJobListRows,
  type AmazonSpApiSandboxImportJobListProjectedRow,
} from './amazon-sp-api-sandbox-importjob-list-query-projection-contract.dto';
import {
  type AmazonSpApiSandboxImportJobListFilterKey,
  type AmazonSpApiSandboxImportJobListSortKey,
  type AmazonSpApiSandboxImportJobListRowCandidate,
} from './amazon-sp-api-sandbox-importjob-list-filter-sort-contract.dto';

export const AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_DRY_RUN_SERVICE_DESIGN_VERSION =
  'amazon-sp-api-sandbox-importjob-read-model-dry-run-service-design-v1' as const;

export type AmazonSpApiSandboxImportJobReadModelDryRunServiceDesign = {
  version: typeof AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_DRY_RUN_SERVICE_DESIGN_VERSION;
  module: 'store-orders';
  domain: 'income';
  sourceType: 'amazon-sp-api-sandbox';
  normalizedSourceType: 'AMAZON_ORDER_SP_API';

  designOnly: true;
  serviceMethodName: 'listAmazonSpApiSandboxImportJobsReadModelDryRun';
  serviceMethodImplementedNow: false;
  controllerExposed: false;
  frontendExposed: false;
  writesDatabase: false;

  sourceProjectionContract: AmazonSpApiSandboxImportJobListQueryProjectionContract;

  plannedServiceArgs: {
    companyId: 'string';
    filter: readonly ['all', 'amazon-sp-api-sandbox', 'pending-review', 'uncommitted-staging', 'invalid-sp-api-sandbox'];
    sort: readonly ['createdAt_desc', 'createdAt_asc', 'filename_asc', 'filename_desc', 'totalRows_desc', 'totalRows_asc'];
    page: 'number';
    pageSize: readonly [20, 50, 100];
    dryRun: true;
  };

  plannedReadQuery: {
    importJobFindMany: true;
    importJobWhereSourceType: 'amazon-sp-api-sandbox';
    importJobWhereModule: 'store-orders';
    importJobWhereStatus: 'PENDING';
    importJobSelectSafeListFieldsOnly: true;
    stagingRowGroupByImportJobId: true;
    stagingRowTargetEntityIdAggregationOnly: true;
    transactionJoin: false;
    inventoryMovementJoin: false;
    inventoryBalanceJoin: false;
    tokenJoin: false;
    credentialJoin: false;
    rawPayloadJsonProjection: false;
    normalizedPayloadJsonProjection: false;
    dedupeHashProjection: false;
  };

  outputShape: {
    rows: 'AmazonSpApiSandboxImportJobListProjectedRow[]';
    page: 'number';
    pageSize: '20|50|100';
    totalRows: 'number';
    totalPages: 'number';
    dryRun: true;
    sourceType: 'amazon-sp-api-sandbox';
    displayOnly: true;
  };

  blockedNow: {
    implementation: true;
    controllerRoute: true;
    frontendRoute: true;
    transactionJoin: true;
    inventoryJoin: true;
    rawPayloadListExposure: true;
    normalizedPayloadListExposure: true;
    commitSales: true;
    executeInventory: true;
    realSpApi: true;
    oauth: true;
    tokenPersistence: true;
    schemaMigration: true;
  };

  summary: {
    readyForReadModelServiceDesign: true;
    readyForReadModelServiceImplementation: false;
    readyForControllerExposure: false;
    readyForFrontendExposure: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export type AmazonSpApiSandboxImportJobReadModelDryRunArgs = {
  filter: AmazonSpApiSandboxImportJobListFilterKey;
  sort: AmazonSpApiSandboxImportJobListSortKey;
  page: number;
  pageSize: 20 | 50 | 100;
  dryRun: true;
};

export type AmazonSpApiSandboxImportJobReadModelDryRunResult = {
  dryRun: true;
  sourceType: 'amazon-sp-api-sandbox';
  displayOnly: true;
  rows: AmazonSpApiSandboxImportJobListProjectedRow[];
  page: number;
  pageSize: 20 | 50 | 100;
  totalRows: number;
  totalPages: number;
};

export function buildAmazonSpApiSandboxImportJobReadModelDryRunServiceDesign(args: {
  projectionContract: AmazonSpApiSandboxImportJobListQueryProjectionContract;
}): AmazonSpApiSandboxImportJobReadModelDryRunServiceDesign {
  const projectionContract = assertAmazonSpApiSandboxImportJobListQueryProjectionContract(
    args.projectionContract,
  );

  return {
    version: AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_DRY_RUN_SERVICE_DESIGN_VERSION,
    module: 'store-orders',
    domain: 'income',
    sourceType: 'amazon-sp-api-sandbox',
    normalizedSourceType: 'AMAZON_ORDER_SP_API',

    designOnly: true,
    serviceMethodName: 'listAmazonSpApiSandboxImportJobsReadModelDryRun',
    serviceMethodImplementedNow: false,
    controllerExposed: false,
    frontendExposed: false,
    writesDatabase: false,

    sourceProjectionContract: projectionContract,

    plannedServiceArgs: {
      companyId: 'string',
      filter: ['all', 'amazon-sp-api-sandbox', 'pending-review', 'uncommitted-staging', 'invalid-sp-api-sandbox'],
      sort: ['createdAt_desc', 'createdAt_asc', 'filename_asc', 'filename_desc', 'totalRows_desc', 'totalRows_asc'],
      page: 'number',
      pageSize: [20, 50, 100],
      dryRun: true,
    },

    plannedReadQuery: {
      importJobFindMany: true,
      importJobWhereSourceType: 'amazon-sp-api-sandbox',
      importJobWhereModule: 'store-orders',
      importJobWhereStatus: 'PENDING',
      importJobSelectSafeListFieldsOnly: true,
      stagingRowGroupByImportJobId: true,
      stagingRowTargetEntityIdAggregationOnly: true,
      transactionJoin: false,
      inventoryMovementJoin: false,
      inventoryBalanceJoin: false,
      tokenJoin: false,
      credentialJoin: false,
      rawPayloadJsonProjection: false,
      normalizedPayloadJsonProjection: false,
      dedupeHashProjection: false,
    },

    outputShape: {
      rows: 'AmazonSpApiSandboxImportJobListProjectedRow[]',
      page: 'number',
      pageSize: '20|50|100',
      totalRows: 'number',
      totalPages: 'number',
      dryRun: true,
      sourceType: 'amazon-sp-api-sandbox',
      displayOnly: true,
    },

    blockedNow: {
      implementation: true,
      controllerRoute: true,
      frontendRoute: true,
      transactionJoin: true,
      inventoryJoin: true,
      rawPayloadListExposure: true,
      normalizedPayloadListExposure: true,
      commitSales: true,
      executeInventory: true,
      realSpApi: true,
      oauth: true,
      tokenPersistence: true,
      schemaMigration: true,
    },

    summary: {
      readyForReadModelServiceDesign: true,
      readyForReadModelServiceImplementation: false,
      readyForControllerExposure: false,
      readyForFrontendExposure: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function simulateAmazonSpApiSandboxImportJobReadModelDryRun(
  candidates: AmazonSpApiSandboxImportJobListRowCandidate[],
  args: AmazonSpApiSandboxImportJobReadModelDryRunArgs,
): AmazonSpApiSandboxImportJobReadModelDryRunResult {
  if (args.dryRun !== true) {
    throw new Error('Step122-E read-model dry-run violation: dryRun must be true.');
  }

  const projected = projectAmazonSpApiSandboxImportJobListRows(candidates, {
    filter: args.filter,
    sort: args.sort,
    page: args.page,
    pageSize: args.pageSize,
  });

  return {
    dryRun: true,
    sourceType: 'amazon-sp-api-sandbox',
    displayOnly: true,
    rows: projected.rows,
    page: projected.page,
    pageSize: projected.pageSize,
    totalRows: projected.totalRows,
    totalPages: projected.totalPages,
  };
}

export function assertAmazonSpApiSandboxImportJobReadModelDryRunServiceDesign(
  design: AmazonSpApiSandboxImportJobReadModelDryRunServiceDesign,
): AmazonSpApiSandboxImportJobReadModelDryRunServiceDesign {
  if (design.version !== AMAZON_SP_API_SANDBOX_IMPORTJOB_READ_MODEL_DRY_RUN_SERVICE_DESIGN_VERSION) {
    throw new Error('Step122-E read-model dry-run service design violation: version mismatch.');
  }

  if (design.designOnly !== true || design.writesDatabase !== false) {
    throw new Error('Step122-E read-model dry-run service design violation: design-only and non-writing required.');
  }

  if (design.serviceMethodImplementedNow !== false) {
    throw new Error('Step122-E read-model dry-run service design violation: service method must not be implemented now.');
  }

  if (design.controllerExposed !== false || design.frontendExposed !== false) {
    throw new Error('Step122-E read-model dry-run service design violation: controller/frontend must remain disabled.');
  }

  if (
    design.plannedReadQuery.transactionJoin !== false ||
    design.plannedReadQuery.inventoryMovementJoin !== false ||
    design.plannedReadQuery.tokenJoin !== false ||
    design.plannedReadQuery.credentialJoin !== false ||
    design.plannedReadQuery.rawPayloadJsonProjection !== false ||
    design.plannedReadQuery.normalizedPayloadJsonProjection !== false ||
    design.plannedReadQuery.dedupeHashProjection !== false
  ) {
    throw new Error('Step122-E read-model dry-run service design violation: unsafe read projections must remain false.');
  }

  for (const [key, blocked] of Object.entries(design.blockedNow)) {
    if (blocked !== true) {
      throw new Error(`Step122-E read-model dry-run service design violation: blockedNow.${key} must remain true.`);
    }
  }

  return design;
}
