export type AmazonSpApiOrdersHistoricalSyncPersistenceStrategy =
  | 'dedicated_sync_job_and_segments'
  | 'reuse_import_job_metadata'
  | 'reuse_platform_operation'
  | 'undecided';

export type AmazonSpApiOrdersHistoricalSyncSchemaDecisionStatus =
  | 'decision_contract_only'
  | 'migration_planned_not_created'
  | 'migration_created'
  | 'runtime_enabled';

export type AmazonSpApiOrdersHistoricalSyncSchemaDecision = {
  readonly step: 'Step149-D';
  readonly source: 'amazon-sp-api-orders-historical-sync';
  readonly status: AmazonSpApiOrdersHistoricalSyncSchemaDecisionStatus;
  readonly recommendedStrategy: AmazonSpApiOrdersHistoricalSyncPersistenceStrategy;
  readonly rejectedStrategies: readonly [
    'reuse_import_job_metadata',
    'reuse_platform_operation',
  ];
  readonly noSchemaMigrationNow: true;
  readonly noPrismaSchemaChangeNow: true;
  readonly noRuntimePersistenceNow: true;
  readonly noControllerBehaviorChangeNow: true;
  readonly noFrontendChangeNow: true;
  readonly decisionSummary: {
    readonly useDedicatedSyncJobModel: true;
    readonly useDedicatedSyncSegmentModel: true;
    readonly useImportJobAsPrimarySyncState: false;
    readonly useImportJobAsResultArtifact: true;
    readonly usePlatformOperationAsPrimarySyncState: false;
    readonly importJobShouldReferenceSyncJobLater: true;
    readonly syncJobShouldTrackProgress: true;
    readonly segmentShouldTrackCursorAndRetry: true;
  };
  readonly proposedModels: {
    readonly syncJobModelName: 'AmazonSpApiOrderSyncJob';
    readonly syncSegmentModelName: 'AmazonSpApiOrderSyncSegment';
  };
  readonly proposedSyncJobFields: readonly [
    'id',
    'companyId',
    'storeId',
    'marketplaceId',
    'region',
    'requestedStartDate',
    'requestedEndDate',
    'status',
    'totalSegments',
    'completedSegments',
    'failedSegments',
    'lastCompletedWindowEnd',
    'lastErrorCode',
    'lastErrorMessage',
    'createdByUserId',
    'createdAt',
    'startedAt',
    'finishedAt',
    'updatedAt',
  ];
  readonly proposedSyncSegmentFields: readonly [
    'id',
    'syncJobId',
    'companyId',
    'storeId',
    'marketplaceId',
    'segmentIndex',
    'createdAfter',
    'createdBefore',
    'status',
    'nextToken',
    'pagesFetched',
    'ordersFetched',
    'itemsFetched',
    'retryAttempts',
    'lastErrorCode',
    'lastErrorMessage',
    'createdImportJobId',
    'startedAt',
    'finishedAt',
    'updatedAt',
  ];
  readonly proposedEnums: {
    readonly syncJobStatus: readonly [
      'PENDING',
      'RUNNING',
      'PAUSED',
      'SUCCEEDED',
      'PARTIAL_FAILED',
      'FAILED',
      'CANCELLED',
    ];
    readonly syncSegmentStatus: readonly [
      'PENDING',
      'RUNNING',
      'SUCCEEDED',
      'RETRYABLE_FAILED',
      'FAILED',
      'SKIPPED',
    ];
  };
  readonly proposedUniqueConstraints: readonly [
    'AmazonSpApiOrderSyncSegment(syncJobId, segmentIndex)',
    'ImportStagingRow future dedupe: companyId + storeId + marketplaceId + amazonOrderId + rowKind for header',
    'ImportStagingRow future dedupe: companyId + storeId + marketplaceId + amazonOrderId + orderItemId + rowKind for item',
  ];
  readonly proposedIndexes: readonly [
    'AmazonSpApiOrderSyncJob(companyId, storeId, marketplaceId, status)',
    'AmazonSpApiOrderSyncJob(companyId, createdAt)',
    'AmazonSpApiOrderSyncSegment(syncJobId, status)',
    'AmazonSpApiOrderSyncSegment(companyId, storeId, marketplaceId, createdAfter, createdBefore)',
    'ImportJob future link: amazonSpApiOrderSyncJobId',
  ];
  readonly migrationPlanForFutureStep: readonly [
    'Step149-E: Prisma migration contract only',
    'Step149-F: create-only migration file with no deploy',
    'Step149-G: Prisma client generation and model availability smoke',
    'Step149-H: repository test-double implementation',
  ];
  readonly guardrails: {
    readonly schemaPrismaMustRemainUnchangedInStep149D: true;
    readonly noMigrationDirectoryCreatedInStep149D: true;
    readonly noImportJobWriteNow: true;
    readonly noImportStagingRowWriteNow: true;
    readonly noAmazonCallNow: true;
    readonly noWorkerNow: true;
    readonly noTransactionWriteNow: true;
    readonly noInventoryWriteNow: true;
    readonly noRawTokenExposureNow: true;
  };
};

export function buildAmazonSpApiOrdersHistoricalSyncSchemaDecision(): AmazonSpApiOrdersHistoricalSyncSchemaDecision {
  return {
    step: 'Step149-D',
    source: 'amazon-sp-api-orders-historical-sync',
    status: 'decision_contract_only',
    recommendedStrategy: 'dedicated_sync_job_and_segments',
    rejectedStrategies: [
      'reuse_import_job_metadata',
      'reuse_platform_operation',
    ],
    noSchemaMigrationNow: true,
    noPrismaSchemaChangeNow: true,
    noRuntimePersistenceNow: true,
    noControllerBehaviorChangeNow: true,
    noFrontendChangeNow: true,
    decisionSummary: {
      useDedicatedSyncJobModel: true,
      useDedicatedSyncSegmentModel: true,
      useImportJobAsPrimarySyncState: false,
      useImportJobAsResultArtifact: true,
      usePlatformOperationAsPrimarySyncState: false,
      importJobShouldReferenceSyncJobLater: true,
      syncJobShouldTrackProgress: true,
      segmentShouldTrackCursorAndRetry: true,
    },
    proposedModels: {
      syncJobModelName: 'AmazonSpApiOrderSyncJob',
      syncSegmentModelName: 'AmazonSpApiOrderSyncSegment',
    },
    proposedSyncJobFields: [
      'id',
      'companyId',
      'storeId',
      'marketplaceId',
      'region',
      'requestedStartDate',
      'requestedEndDate',
      'status',
      'totalSegments',
      'completedSegments',
      'failedSegments',
      'lastCompletedWindowEnd',
      'lastErrorCode',
      'lastErrorMessage',
      'createdByUserId',
      'createdAt',
      'startedAt',
      'finishedAt',
      'updatedAt',
    ],
    proposedSyncSegmentFields: [
      'id',
      'syncJobId',
      'companyId',
      'storeId',
      'marketplaceId',
      'segmentIndex',
      'createdAfter',
      'createdBefore',
      'status',
      'nextToken',
      'pagesFetched',
      'ordersFetched',
      'itemsFetched',
      'retryAttempts',
      'lastErrorCode',
      'lastErrorMessage',
      'createdImportJobId',
      'startedAt',
      'finishedAt',
      'updatedAt',
    ],
    proposedEnums: {
      syncJobStatus: [
        'PENDING',
        'RUNNING',
        'PAUSED',
        'SUCCEEDED',
        'PARTIAL_FAILED',
        'FAILED',
        'CANCELLED',
      ],
      syncSegmentStatus: [
        'PENDING',
        'RUNNING',
        'SUCCEEDED',
        'RETRYABLE_FAILED',
        'FAILED',
        'SKIPPED',
      ],
    },
    proposedUniqueConstraints: [
      'AmazonSpApiOrderSyncSegment(syncJobId, segmentIndex)',
      'ImportStagingRow future dedupe: companyId + storeId + marketplaceId + amazonOrderId + rowKind for header',
      'ImportStagingRow future dedupe: companyId + storeId + marketplaceId + amazonOrderId + orderItemId + rowKind for item',
    ],
    proposedIndexes: [
      'AmazonSpApiOrderSyncJob(companyId, storeId, marketplaceId, status)',
      'AmazonSpApiOrderSyncJob(companyId, createdAt)',
      'AmazonSpApiOrderSyncSegment(syncJobId, status)',
      'AmazonSpApiOrderSyncSegment(companyId, storeId, marketplaceId, createdAfter, createdBefore)',
      'ImportJob future link: amazonSpApiOrderSyncJobId',
    ],
    migrationPlanForFutureStep: [
      'Step149-E: Prisma migration contract only',
      'Step149-F: create-only migration file with no deploy',
      'Step149-G: Prisma client generation and model availability smoke',
      'Step149-H: repository test-double implementation',
    ],
    guardrails: {
      schemaPrismaMustRemainUnchangedInStep149D: true,
      noMigrationDirectoryCreatedInStep149D: true,
      noImportJobWriteNow: true,
      noImportStagingRowWriteNow: true,
      noAmazonCallNow: true,
      noWorkerNow: true,
      noTransactionWriteNow: true,
      noInventoryWriteNow: true,
      noRawTokenExposureNow: true,
    },
  };
}

export function assertAmazonSpApiOrdersHistoricalSyncSchemaDecision(
  decision: AmazonSpApiOrdersHistoricalSyncSchemaDecision,
): AmazonSpApiOrdersHistoricalSyncSchemaDecision {
  if (decision.step !== 'Step149-D') {
    throw new Error('STEP149_D_INVALID_STEP');
  }

  if (decision.status !== 'decision_contract_only') {
    throw new Error('STEP149_D_STATUS_MUST_BE_DECISION_CONTRACT_ONLY');
  }

  if (decision.recommendedStrategy !== 'dedicated_sync_job_and_segments') {
    throw new Error('STEP149_D_REQUIRES_DEDICATED_SYNC_JOB_AND_SEGMENTS');
  }

  if (!decision.noSchemaMigrationNow || !decision.noPrismaSchemaChangeNow) {
    throw new Error('STEP149_D_SCHEMA_CHANGE_FORBIDDEN_NOW');
  }

  if (!decision.noRuntimePersistenceNow || !decision.noControllerBehaviorChangeNow) {
    throw new Error('STEP149_D_RUNTIME_CHANGE_FORBIDDEN_NOW');
  }

  if (!decision.decisionSummary.useDedicatedSyncJobModel) {
    throw new Error('STEP149_D_SYNC_JOB_MODEL_REQUIRED');
  }

  if (!decision.decisionSummary.useDedicatedSyncSegmentModel) {
    throw new Error('STEP149_D_SYNC_SEGMENT_MODEL_REQUIRED');
  }

  if (decision.decisionSummary.useImportJobAsPrimarySyncState) {
    throw new Error('STEP149_D_IMPORT_JOB_MUST_NOT_BE_PRIMARY_SYNC_STATE');
  }

  if (!decision.decisionSummary.useImportJobAsResultArtifact) {
    throw new Error('STEP149_D_IMPORT_JOB_SHOULD_REMAIN_RESULT_ARTIFACT');
  }

  if (decision.decisionSummary.usePlatformOperationAsPrimarySyncState) {
    throw new Error('STEP149_D_PLATFORM_OPERATION_MUST_NOT_BE_PRIMARY_SYNC_STATE');
  }

  if (!decision.proposedSyncSegmentFields.includes('nextToken')) {
    throw new Error('STEP149_D_SEGMENT_REQUIRES_NEXT_TOKEN');
  }

  if (!decision.proposedSyncSegmentFields.includes('retryAttempts')) {
    throw new Error('STEP149_D_SEGMENT_REQUIRES_RETRY_ATTEMPTS');
  }

  if (!decision.guardrails.schemaPrismaMustRemainUnchangedInStep149D) {
    throw new Error('STEP149_D_SCHEMA_PRISMA_MUST_REMAIN_UNCHANGED');
  }

  if (!decision.guardrails.noMigrationDirectoryCreatedInStep149D) {
    throw new Error('STEP149_D_MIGRATION_DIRECTORY_FORBIDDEN_NOW');
  }

  if (!decision.guardrails.noTransactionWriteNow || !decision.guardrails.noInventoryWriteNow) {
    throw new Error('STEP149_D_LEDGER_INVENTORY_WRITES_FORBIDDEN_NOW');
  }

  return decision;
}

export const AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_SCHEMA_DECISION =
  assertAmazonSpApiOrdersHistoricalSyncSchemaDecision(
    buildAmazonSpApiOrdersHistoricalSyncSchemaDecision(),
  );
