export type AmazonSpApiOrdersHistoricalSyncExecutionMode =
  | 'contract_only'
  | 'controller_disabled'
  | 'worker_disabled'
  | 'guarded_runtime';

export type AmazonSpApiOrdersHistoricalSyncProgressStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'PAUSED'
  | 'SUCCEEDED'
  | 'PARTIAL_FAILED'
  | 'FAILED'
  | 'CANCELLED';

export type AmazonSpApiOrdersHistoricalSyncSegmentStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'RETRYABLE_FAILED'
  | 'FAILED'
  | 'SKIPPED';

export type AmazonSpApiOrdersHistoricalSyncWindowPolicy = {
  readonly recommendedSegmentDays: 7;
  readonly maxSegmentDays: 31;
  readonly maxPagesPerSegment: 50;
  readonly maxRetryAttemptsPerSegment: 3;
  readonly stopOnThrottle: true;
  readonly resumeRequiresCursorState: true;
};

export type AmazonSpApiOrdersHistoricalSyncDedupePolicy = {
  readonly orderHeaderKey: readonly [
    'companyId',
    'storeId',
    'marketplaceId',
    'amazonOrderId',
    'rowKind',
  ];
  readonly orderItemKey: readonly [
    'companyId',
    'storeId',
    'marketplaceId',
    'amazonOrderId',
    'orderItemId',
    'rowKind',
  ];
  readonly stagingWriteMustBeIdempotent: true;
  readonly duplicateRowsMustNotCreateTransactions: true;
  readonly duplicateRowsMustNotCreateInventoryMovements: true;
};

export type AmazonSpApiOrdersHistoricalSyncProgressContract = {
  readonly requiredProgressFields: readonly [
    'syncJobId',
    'companyId',
    'storeId',
    'marketplaceId',
    'requestedStartDate',
    'requestedEndDate',
    'totalSegments',
    'completedSegments',
    'failedSegments',
    'currentSegmentStartDate',
    'currentSegmentEndDate',
    'nextToken',
    'lastCompletedWindowEnd',
    'status',
    'lastErrorCode',
    'lastErrorMessage',
    'startedAt',
    'finishedAt',
  ];
  readonly statusValues: readonly AmazonSpApiOrdersHistoricalSyncProgressStatus[];
  readonly segmentStatusValues: readonly AmazonSpApiOrdersHistoricalSyncSegmentStatus[];
};

export type AmazonSpApiOrdersHistoricalSyncForbiddenNow = {
  readonly controllerRoute: true;
  readonly productionExecution: true;
  readonly prismaSchemaChange: true;
  readonly importJobCreate: true;
  readonly importStagingRowCreateMany: true;
  readonly transactionCreate: true;
  readonly transactionCreateMany: true;
  readonly inventoryMovementCreate: true;
  readonly inventoryMovementCreateMany: true;
  readonly inventoryBalanceUpdate: true;
  readonly bankReconciliation: true;
  readonly settlementFeeImport: true;
  readonly frontendButton: true;
  readonly rawTokenExposure: true;
  readonly clientSideSpApiSecretLogic: true;
  readonly unboundedLoop: true;
};

export type AmazonSpApiOrdersHistoricalSyncArchitectureContract = {
  readonly step: 'Step149-B';
  readonly source: 'amazon-sp-api-orders-historical-sync';
  readonly executionMode: AmazonSpApiOrdersHistoricalSyncExecutionMode;
  readonly disabledByDefault: true;
  readonly requiresBackgroundRunner: true;
  readonly noSingleBlockingHttpRequest: true;
  readonly noControllerRouteNow: true;
  readonly noSchemaMigrationNow: true;
  readonly noFrontendChangeNow: true;
  readonly userFacingEntryLabel: '履歴データ同期';
  readonly requestedInputFields: readonly [
    'storeId',
    'marketplaceId',
    'region',
    'syncStartDate',
    'syncEndDate',
  ];
  readonly windowPolicy: AmazonSpApiOrdersHistoricalSyncWindowPolicy;
  readonly dedupePolicy: AmazonSpApiOrdersHistoricalSyncDedupePolicy;
  readonly progressContract: AmazonSpApiOrdersHistoricalSyncProgressContract;
  readonly forbiddenNow: AmazonSpApiOrdersHistoricalSyncForbiddenNow;
  readonly nextSteps: readonly [
    'Step149-C: backend controller-disabled route shell',
    'Step149-D: sync job persistence design / schema decision',
    'Step149-E: worker/runner disabled-by-default service skeleton',
    'Step149-F: window planner and pagination cursor contract',
    'Step149-G: dedupe/idempotency contract',
  ];
};

export function buildAmazonSpApiOrdersHistoricalSyncArchitectureContract(): AmazonSpApiOrdersHistoricalSyncArchitectureContract {
  return {
    step: 'Step149-B',
    source: 'amazon-sp-api-orders-historical-sync',
    executionMode: 'contract_only',
    disabledByDefault: true,
    requiresBackgroundRunner: true,
    noSingleBlockingHttpRequest: true,
    noControllerRouteNow: true,
    noSchemaMigrationNow: true,
    noFrontendChangeNow: true,
    userFacingEntryLabel: '履歴データ同期',
    requestedInputFields: [
      'storeId',
      'marketplaceId',
      'region',
      'syncStartDate',
      'syncEndDate',
    ],
    windowPolicy: {
      recommendedSegmentDays: 7,
      maxSegmentDays: 31,
      maxPagesPerSegment: 50,
      maxRetryAttemptsPerSegment: 3,
      stopOnThrottle: true,
      resumeRequiresCursorState: true,
    },
    dedupePolicy: {
      orderHeaderKey: [
        'companyId',
        'storeId',
        'marketplaceId',
        'amazonOrderId',
        'rowKind',
      ],
      orderItemKey: [
        'companyId',
        'storeId',
        'marketplaceId',
        'amazonOrderId',
        'orderItemId',
        'rowKind',
      ],
      stagingWriteMustBeIdempotent: true,
      duplicateRowsMustNotCreateTransactions: true,
      duplicateRowsMustNotCreateInventoryMovements: true,
    },
    progressContract: {
      requiredProgressFields: [
        'syncJobId',
        'companyId',
        'storeId',
        'marketplaceId',
        'requestedStartDate',
        'requestedEndDate',
        'totalSegments',
        'completedSegments',
        'failedSegments',
        'currentSegmentStartDate',
        'currentSegmentEndDate',
        'nextToken',
        'lastCompletedWindowEnd',
        'status',
        'lastErrorCode',
        'lastErrorMessage',
        'startedAt',
        'finishedAt',
      ],
      statusValues: [
        'PENDING',
        'RUNNING',
        'PAUSED',
        'SUCCEEDED',
        'PARTIAL_FAILED',
        'FAILED',
        'CANCELLED',
      ],
      segmentStatusValues: [
        'PENDING',
        'RUNNING',
        'SUCCEEDED',
        'RETRYABLE_FAILED',
        'FAILED',
        'SKIPPED',
      ],
    },
    forbiddenNow: {
      controllerRoute: true,
      productionExecution: true,
      prismaSchemaChange: true,
      importJobCreate: true,
      importStagingRowCreateMany: true,
      transactionCreate: true,
      transactionCreateMany: true,
      inventoryMovementCreate: true,
      inventoryMovementCreateMany: true,
      inventoryBalanceUpdate: true,
      bankReconciliation: true,
      settlementFeeImport: true,
      frontendButton: true,
      rawTokenExposure: true,
      clientSideSpApiSecretLogic: true,
      unboundedLoop: true,
    },
    nextSteps: [
      'Step149-C: backend controller-disabled route shell',
      'Step149-D: sync job persistence design / schema decision',
      'Step149-E: worker/runner disabled-by-default service skeleton',
      'Step149-F: window planner and pagination cursor contract',
      'Step149-G: dedupe/idempotency contract',
    ],
  };
}

export function assertAmazonSpApiOrdersHistoricalSyncArchitectureContract(
  contract: AmazonSpApiOrdersHistoricalSyncArchitectureContract,
): AmazonSpApiOrdersHistoricalSyncArchitectureContract {
  if (contract.step !== 'Step149-B') {
    throw new Error('STEP149_B_INVALID_STEP');
  }

  if (contract.executionMode !== 'contract_only') {
    throw new Error('STEP149_B_EXECUTION_MUST_BE_CONTRACT_ONLY');
  }

  if (!contract.disabledByDefault) {
    throw new Error('STEP149_B_MUST_BE_DISABLED_BY_DEFAULT');
  }

  if (!contract.requiresBackgroundRunner) {
    throw new Error('STEP149_B_BACKGROUND_RUNNER_REQUIRED');
  }

  if (!contract.noSingleBlockingHttpRequest) {
    throw new Error('STEP149_B_SINGLE_BLOCKING_HTTP_REQUEST_FORBIDDEN');
  }

  if (!contract.noControllerRouteNow) {
    throw new Error('STEP149_B_CONTROLLER_ROUTE_FORBIDDEN_NOW');
  }

  if (!contract.noSchemaMigrationNow) {
    throw new Error('STEP149_B_SCHEMA_MIGRATION_FORBIDDEN_NOW');
  }

  if (!contract.noFrontendChangeNow) {
    throw new Error('STEP149_B_FRONTEND_CHANGE_FORBIDDEN_NOW');
  }

  if (contract.windowPolicy.recommendedSegmentDays !== 7) {
    throw new Error('STEP149_B_RECOMMENDED_SEGMENT_DAYS_MUST_BE_7');
  }

  if (contract.windowPolicy.maxSegmentDays > 31) {
    throw new Error('STEP149_B_MAX_SEGMENT_DAYS_TOO_LARGE');
  }

  if (contract.windowPolicy.maxPagesPerSegment < 1) {
    throw new Error('STEP149_B_MAX_PAGES_PER_SEGMENT_REQUIRED');
  }

  if (!contract.windowPolicy.resumeRequiresCursorState) {
    throw new Error('STEP149_B_RESUME_REQUIRES_CURSOR_STATE');
  }

  if (!contract.dedupePolicy.orderHeaderKey.includes('amazonOrderId')) {
    throw new Error('STEP149_B_HEADER_DEDUPE_REQUIRES_AMAZON_ORDER_ID');
  }

  if (!contract.dedupePolicy.orderItemKey.includes('orderItemId')) {
    throw new Error('STEP149_B_ITEM_DEDUPE_REQUIRES_ORDER_ITEM_ID');
  }

  if (!contract.forbiddenNow.transactionCreate || !contract.forbiddenNow.transactionCreateMany) {
    throw new Error('STEP149_B_TRANSACTION_WRITE_FORBIDDEN_NOW');
  }

  if (!contract.forbiddenNow.inventoryMovementCreate || !contract.forbiddenNow.inventoryMovementCreateMany) {
    throw new Error('STEP149_B_INVENTORY_WRITE_FORBIDDEN_NOW');
  }

  if (!contract.forbiddenNow.rawTokenExposure || !contract.forbiddenNow.clientSideSpApiSecretLogic) {
    throw new Error('STEP149_B_SECRET_EXPOSURE_FORBIDDEN_NOW');
  }

  if (!contract.forbiddenNow.unboundedLoop) {
    throw new Error('STEP149_B_UNBOUNDED_LOOP_FORBIDDEN_NOW');
  }

  return contract;
}

export const AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_ARCHITECTURE_CONTRACT =
  assertAmazonSpApiOrdersHistoricalSyncArchitectureContract(
    buildAmazonSpApiOrdersHistoricalSyncArchitectureContract(),
  );
