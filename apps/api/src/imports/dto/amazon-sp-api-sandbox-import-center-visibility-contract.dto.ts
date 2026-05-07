export const AMAZON_SP_API_SANDBOX_IMPORT_CENTER_VISIBILITY_CONTRACT_VERSION =
  'amazon-sp-api-sandbox-import-center-visibility-contract-v1' as const;

export type AmazonSpApiSandboxImportCenterVisibilityDecision =
  | 'VISIBLE_AS_PENDING_REVIEW_ONLY'
  | 'HIDDEN_FROM_COMMITTED_SALES'
  | 'BLOCKED_NOW';

export type AmazonSpApiSandboxImportCenterVisibilityContract = {
  version: typeof AMAZON_SP_API_SANDBOX_IMPORT_CENTER_VISIBILITY_CONTRACT_VERSION;
  module: 'store-orders';
  domain: 'income';
  sourceType: 'amazon-sp-api-sandbox';
  normalizedSourceType: 'AMAZON_ORDER_SP_API';

  decision: AmazonSpApiSandboxImportCenterVisibilityDecision;
  contractOnly: true;
  controllerExposed: false;
  frontendExposed: false;
  writesDatabase: false;

  importJobVisibility: {
    visibleInImportCenterEventually: true;
    visibleNowThroughController: false;
    displayGroup: 'amazon-sp-api-sandbox';
    displaySourceLabel: 'Amazon SP-API sandbox';
    displayLifecycle: 'pending-review';
    displayStatus: 'PENDING';
    mustNotDisplayAsCommittedSales: true;
    mustNotDisplayAsInventoryExecuted: true;
    mustNotDisplayAsBankMatched: true;
  };

  importJobRequirements: {
    sourceType: 'amazon-sp-api-sandbox';
    module: 'store-orders';
    status: 'PENDING';
    successRows: 0;
    failedRows: 0;
    importedAt: null;
    totalRowsEqualsStagingRows: true;
  };

  stagingRowRequirements: {
    targetEntityId: null;
    matchStatusAllowed: readonly ['new', 'conflict_review_required'];
    normalizedPayloadSourceType: 'AMAZON_ORDER_SP_API';
    mustRemainUncommitted: true;
    mustNotCreateTransaction: true;
    mustNotCreateInventoryMovement: true;
  };

  allowedImportCenterActionsEventually: {
    viewImportJob: true;
    viewStagingRows: true;
    filterBySourceType: true;
    inspectRawPayload: true;
    inspectNormalizedPayload: true;
    commitSales: false;
    executeInventory: false;
    overwriteTransactions: false;
    connectRealSpApi: false;
    startOAuth: false;
  };

  requiredBadges: readonly [
    'SP-API sandbox',
    'Pending review',
    'Not committed',
    'Inventory not executed'
  ];

  blockedNow: {
    controllerRoute: true;
    frontendRoute: true;
    transactionCommit: true;
    transactionOverwrite: true;
    inventoryMovementCreate: true;
    inventoryBalanceUpdate: true;
    realSpApi: true;
    oauth: true;
    tokenPersistence: true;
    schemaMigration: true;
  };

  summary: {
    readyForImportCenterVisibilityDesign: true;
    readyForControllerExposure: false;
    readyForFrontendExposure: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

export function buildAmazonSpApiSandboxImportCenterVisibilityContract(): AmazonSpApiSandboxImportCenterVisibilityContract {
  return {
    version: AMAZON_SP_API_SANDBOX_IMPORT_CENTER_VISIBILITY_CONTRACT_VERSION,
    module: 'store-orders',
    domain: 'income',
    sourceType: 'amazon-sp-api-sandbox',
    normalizedSourceType: 'AMAZON_ORDER_SP_API',

    decision: 'VISIBLE_AS_PENDING_REVIEW_ONLY',
    contractOnly: true,
    controllerExposed: false,
    frontendExposed: false,
    writesDatabase: false,

    importJobVisibility: {
      visibleInImportCenterEventually: true,
      visibleNowThroughController: false,
      displayGroup: 'amazon-sp-api-sandbox',
      displaySourceLabel: 'Amazon SP-API sandbox',
      displayLifecycle: 'pending-review',
      displayStatus: 'PENDING',
      mustNotDisplayAsCommittedSales: true,
      mustNotDisplayAsInventoryExecuted: true,
      mustNotDisplayAsBankMatched: true,
    },

    importJobRequirements: {
      sourceType: 'amazon-sp-api-sandbox',
      module: 'store-orders',
      status: 'PENDING',
      successRows: 0,
      failedRows: 0,
      importedAt: null,
      totalRowsEqualsStagingRows: true,
    },

    stagingRowRequirements: {
      targetEntityId: null,
      matchStatusAllowed: ['new', 'conflict_review_required'],
      normalizedPayloadSourceType: 'AMAZON_ORDER_SP_API',
      mustRemainUncommitted: true,
      mustNotCreateTransaction: true,
      mustNotCreateInventoryMovement: true,
    },

    allowedImportCenterActionsEventually: {
      viewImportJob: true,
      viewStagingRows: true,
      filterBySourceType: true,
      inspectRawPayload: true,
      inspectNormalizedPayload: true,
      commitSales: false,
      executeInventory: false,
      overwriteTransactions: false,
      connectRealSpApi: false,
      startOAuth: false,
    },

    requiredBadges: [
      'SP-API sandbox',
      'Pending review',
      'Not committed',
      'Inventory not executed',
    ],

    blockedNow: {
      controllerRoute: true,
      frontendRoute: true,
      transactionCommit: true,
      transactionOverwrite: true,
      inventoryMovementCreate: true,
      inventoryBalanceUpdate: true,
      realSpApi: true,
      oauth: true,
      tokenPersistence: true,
      schemaMigration: true,
    },

    summary: {
      readyForImportCenterVisibilityDesign: true,
      readyForControllerExposure: false,
      readyForFrontendExposure: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiSandboxImportCenterVisibilityContract(
  contract: AmazonSpApiSandboxImportCenterVisibilityContract,
): AmazonSpApiSandboxImportCenterVisibilityContract {
  if (contract.version !== AMAZON_SP_API_SANDBOX_IMPORT_CENTER_VISIBILITY_CONTRACT_VERSION) {
    throw new Error('Step122-A import center visibility contract violation: version mismatch.');
  }

  if (contract.contractOnly !== true || contract.writesDatabase !== false) {
    throw new Error('Step122-A import center visibility contract violation: contract-only and non-writing required.');
  }

  if (contract.controllerExposed !== false || contract.frontendExposed !== false) {
    throw new Error('Step122-A import center visibility contract violation: controller/frontend must remain disabled.');
  }

  if (contract.importJobVisibility.mustNotDisplayAsCommittedSales !== true) {
    throw new Error('Step122-A import center visibility contract violation: must not display as committed sales.');
  }

  if (contract.importJobVisibility.mustNotDisplayAsInventoryExecuted !== true) {
    throw new Error('Step122-A import center visibility contract violation: must not display as inventory executed.');
  }

  if (
    contract.importJobRequirements.status !== 'PENDING' ||
    contract.importJobRequirements.successRows !== 0 ||
    contract.importJobRequirements.failedRows !== 0 ||
    contract.importJobRequirements.importedAt !== null
  ) {
    throw new Error('Step122-A import center visibility contract violation: ImportJob must remain pending/uncommitted.');
  }

  if (
    contract.stagingRowRequirements.targetEntityId !== null ||
    contract.stagingRowRequirements.mustNotCreateTransaction !== true ||
    contract.stagingRowRequirements.mustNotCreateInventoryMovement !== true
  ) {
    throw new Error('Step122-A import center visibility contract violation: staging rows must remain uncommitted.');
  }

  for (const [key, blocked] of Object.entries(contract.blockedNow)) {
    if (blocked !== true) {
      throw new Error(`Step122-A import center visibility contract violation: blockedNow.${key} must remain true.`);
    }
  }

  return contract;
}
