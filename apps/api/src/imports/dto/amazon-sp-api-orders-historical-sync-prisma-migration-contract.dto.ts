export type AmazonSpApiOrdersHistoricalSyncPrismaMigrationContractStatus =
  | 'migration_contract_only'
  | 'migration_file_planned'
  | 'migration_file_created'
  | 'migration_applied';

export type AmazonSpApiOrdersHistoricalSyncPrismaMigrationContract = {
  readonly step: 'Step149-E';
  readonly source: 'amazon-sp-api-orders-historical-sync';
  readonly status: AmazonSpApiOrdersHistoricalSyncPrismaMigrationContractStatus;
  readonly noSchemaPrismaChangeNow: true;
  readonly noMigrationDirectoryNow: true;
  readonly noPrismaClientGenerationNow: true;
  readonly noRuntimePersistenceNow: true;
  readonly noControllerBehaviorChangeNow: true;
  readonly noFrontendChangeNow: true;
  readonly futureMigrationName: 'add_amazon_sp_api_order_sync_jobs';
  readonly futureEnums: {
    readonly AmazonSpApiOrderSyncJobStatus: readonly [
      'PENDING',
      'RUNNING',
      'PAUSED',
      'SUCCEEDED',
      'PARTIAL_FAILED',
      'FAILED',
      'CANCELLED',
    ];
    readonly AmazonSpApiOrderSyncSegmentStatus: readonly [
      'PENDING',
      'RUNNING',
      'SUCCEEDED',
      'RETRYABLE_FAILED',
      'FAILED',
      'SKIPPED',
    ];
  };
  readonly futureModels: {
    readonly AmazonSpApiOrderSyncJob: {
      readonly purpose: 'primary historical sync job state';
      readonly fields: readonly [
        'id String @id @default(cuid())',
        'companyId String',
        'storeId String',
        'marketplaceId String',
        'region String @default("JP")',
        'requestedStartDate DateTime',
        'requestedEndDate DateTime',
        'status AmazonSpApiOrderSyncJobStatus @default(PENDING)',
        'totalSegments Int @default(0)',
        'completedSegments Int @default(0)',
        'failedSegments Int @default(0)',
        'lastCompletedWindowEnd DateTime?',
        'lastErrorCode String?',
        'lastErrorMessage String?',
        'createdByUserId String?',
        'createdAt DateTime @default(now())',
        'startedAt DateTime?',
        'finishedAt DateTime?',
        'updatedAt DateTime @updatedAt',
      ];
      readonly relations: readonly [
        'company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)',
        'segments AmazonSpApiOrderSyncSegment[]',
        'importJobs ImportJob[]',
      ];
      readonly indexes: readonly [
        '@@index([companyId, storeId, marketplaceId, status])',
        '@@index([companyId, createdAt])',
        '@@index([companyId, requestedStartDate, requestedEndDate])',
      ];
    };
    readonly AmazonSpApiOrderSyncSegment: {
      readonly purpose: 'bounded date-window segment with pagination cursor and retry state';
      readonly fields: readonly [
        'id String @id @default(cuid())',
        'syncJobId String',
        'companyId String',
        'storeId String',
        'marketplaceId String',
        'segmentIndex Int',
        'createdAfter DateTime',
        'createdBefore DateTime',
        'status AmazonSpApiOrderSyncSegmentStatus @default(PENDING)',
        'nextToken String?',
        'pagesFetched Int @default(0)',
        'ordersFetched Int @default(0)',
        'itemsFetched Int @default(0)',
        'retryAttempts Int @default(0)',
        'lastErrorCode String?',
        'lastErrorMessage String?',
        'createdImportJobId String?',
        'startedAt DateTime?',
        'finishedAt DateTime?',
        'updatedAt DateTime @updatedAt',
      ];
      readonly relations: readonly [
        'syncJob AmazonSpApiOrderSyncJob @relation(fields: [syncJobId], references: [id], onDelete: Cascade)',
        'company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)',
        'createdImportJob ImportJob? @relation(fields: [createdImportJobId], references: [id], onDelete: SetNull)',
      ];
      readonly uniqueConstraints: readonly [
        '@@unique([syncJobId, segmentIndex])',
      ];
      readonly indexes: readonly [
        '@@index([syncJobId, status])',
        '@@index([companyId, storeId, marketplaceId, createdAfter, createdBefore])',
        '@@index([createdImportJobId])',
      ];
    };
    readonly ImportJobFutureExtension: {
      readonly purpose: 'link result ImportJob artifact back to historical sync job and segment';
      readonly fields: readonly [
        'amazonSpApiOrderSyncJobId String?',
        'amazonSpApiOrderSyncSegmentId String?',
      ];
      readonly relations: readonly [
        'amazonSpApiOrderSyncJob AmazonSpApiOrderSyncJob? @relation(fields: [amazonSpApiOrderSyncJobId], references: [id], onDelete: SetNull)',
        'amazonSpApiOrderSyncSegment AmazonSpApiOrderSyncSegment? @relation(fields: [amazonSpApiOrderSyncSegmentId], references: [id], onDelete: SetNull)',
      ];
      readonly indexes: readonly [
        '@@index([amazonSpApiOrderSyncJobId])',
        '@@index([amazonSpApiOrderSyncSegmentId])',
      ];
    };
  };
  readonly futureDedupeConstraints: {
    readonly note: 'ImportStagingRow dedupe may require additional normalized fields or generated dedupe key in a later step.';
    readonly headerDedupeCandidate: 'companyId + storeId + marketplaceId + amazonOrderId + rowKind';
    readonly itemDedupeCandidate: 'companyId + storeId + marketplaceId + amazonOrderId + orderItemId + rowKind';
    readonly notCreatedInThisStep: true;
  };
  readonly migrationExecutionPlan: readonly [
    'Step149-F: create migration file only after reviewing schema contract',
    'Step149-G: generate Prisma client and model availability smoke',
    'Step149-H: repository test-double and create/read contract',
    'Step149-I: disabled worker skeleton using repository boundary',
  ];
  readonly guardrails: {
    readonly schemaPrismaMustRemainUnchangedInStep149E: true;
    readonly migrationDirectoryMustRemainUnchangedInStep149E: true;
    readonly noPrismaMigrateCommandInStep149E: true;
    readonly noPrismaGenerateCommandInStep149E: true;
    readonly noImportJobWriteNow: true;
    readonly noImportStagingRowWriteNow: true;
    readonly noAmazonCallNow: true;
    readonly noWorkerNow: true;
    readonly noTransactionWriteNow: true;
    readonly noInventoryWriteNow: true;
    readonly noSettlementOrBankReconciliationNow: true;
  };
};

export function buildAmazonSpApiOrdersHistoricalSyncPrismaMigrationContract(): AmazonSpApiOrdersHistoricalSyncPrismaMigrationContract {
  return {
    step: 'Step149-E',
    source: 'amazon-sp-api-orders-historical-sync',
    status: 'migration_contract_only',
    noSchemaPrismaChangeNow: true,
    noMigrationDirectoryNow: true,
    noPrismaClientGenerationNow: true,
    noRuntimePersistenceNow: true,
    noControllerBehaviorChangeNow: true,
    noFrontendChangeNow: true,
    futureMigrationName: 'add_amazon_sp_api_order_sync_jobs',
    futureEnums: {
      AmazonSpApiOrderSyncJobStatus: [
        'PENDING',
        'RUNNING',
        'PAUSED',
        'SUCCEEDED',
        'PARTIAL_FAILED',
        'FAILED',
        'CANCELLED',
      ],
      AmazonSpApiOrderSyncSegmentStatus: [
        'PENDING',
        'RUNNING',
        'SUCCEEDED',
        'RETRYABLE_FAILED',
        'FAILED',
        'SKIPPED',
      ],
    },
    futureModels: {
      AmazonSpApiOrderSyncJob: {
        purpose: 'primary historical sync job state',
        fields: [
          'id String @id @default(cuid())',
          'companyId String',
          'storeId String',
          'marketplaceId String',
          'region String @default("JP")',
          'requestedStartDate DateTime',
          'requestedEndDate DateTime',
          'status AmazonSpApiOrderSyncJobStatus @default(PENDING)',
          'totalSegments Int @default(0)',
          'completedSegments Int @default(0)',
          'failedSegments Int @default(0)',
          'lastCompletedWindowEnd DateTime?',
          'lastErrorCode String?',
          'lastErrorMessage String?',
          'createdByUserId String?',
          'createdAt DateTime @default(now())',
          'startedAt DateTime?',
          'finishedAt DateTime?',
          'updatedAt DateTime @updatedAt',
        ],
        relations: [
          'company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)',
          'segments AmazonSpApiOrderSyncSegment[]',
          'importJobs ImportJob[]',
        ],
        indexes: [
          '@@index([companyId, storeId, marketplaceId, status])',
          '@@index([companyId, createdAt])',
          '@@index([companyId, requestedStartDate, requestedEndDate])',
        ],
      },
      AmazonSpApiOrderSyncSegment: {
        purpose: 'bounded date-window segment with pagination cursor and retry state',
        fields: [
          'id String @id @default(cuid())',
          'syncJobId String',
          'companyId String',
          'storeId String',
          'marketplaceId String',
          'segmentIndex Int',
          'createdAfter DateTime',
          'createdBefore DateTime',
          'status AmazonSpApiOrderSyncSegmentStatus @default(PENDING)',
          'nextToken String?',
          'pagesFetched Int @default(0)',
          'ordersFetched Int @default(0)',
          'itemsFetched Int @default(0)',
          'retryAttempts Int @default(0)',
          'lastErrorCode String?',
          'lastErrorMessage String?',
          'createdImportJobId String?',
          'startedAt DateTime?',
          'finishedAt DateTime?',
          'updatedAt DateTime @updatedAt',
        ],
        relations: [
          'syncJob AmazonSpApiOrderSyncJob @relation(fields: [syncJobId], references: [id], onDelete: Cascade)',
          'company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)',
          'createdImportJob ImportJob? @relation(fields: [createdImportJobId], references: [id], onDelete: SetNull)',
        ],
        uniqueConstraints: [
          '@@unique([syncJobId, segmentIndex])',
        ],
        indexes: [
          '@@index([syncJobId, status])',
          '@@index([companyId, storeId, marketplaceId, createdAfter, createdBefore])',
          '@@index([createdImportJobId])',
        ],
      },
      ImportJobFutureExtension: {
        purpose: 'link result ImportJob artifact back to historical sync job and segment',
        fields: [
          'amazonSpApiOrderSyncJobId String?',
          'amazonSpApiOrderSyncSegmentId String?',
        ],
        relations: [
          'amazonSpApiOrderSyncJob AmazonSpApiOrderSyncJob? @relation(fields: [amazonSpApiOrderSyncJobId], references: [id], onDelete: SetNull)',
          'amazonSpApiOrderSyncSegment AmazonSpApiOrderSyncSegment? @relation(fields: [amazonSpApiOrderSyncSegmentId], references: [id], onDelete: SetNull)',
        ],
        indexes: [
          '@@index([amazonSpApiOrderSyncJobId])',
          '@@index([amazonSpApiOrderSyncSegmentId])',
        ],
      },
    },
    futureDedupeConstraints: {
      note: 'ImportStagingRow dedupe may require additional normalized fields or generated dedupe key in a later step.',
      headerDedupeCandidate: 'companyId + storeId + marketplaceId + amazonOrderId + rowKind',
      itemDedupeCandidate: 'companyId + storeId + marketplaceId + amazonOrderId + orderItemId + rowKind',
      notCreatedInThisStep: true,
    },
    migrationExecutionPlan: [
      'Step149-F: create migration file only after reviewing schema contract',
      'Step149-G: generate Prisma client and model availability smoke',
      'Step149-H: repository test-double and create/read contract',
      'Step149-I: disabled worker skeleton using repository boundary',
    ],
    guardrails: {
      schemaPrismaMustRemainUnchangedInStep149E: true,
      migrationDirectoryMustRemainUnchangedInStep149E: true,
      noPrismaMigrateCommandInStep149E: true,
      noPrismaGenerateCommandInStep149E: true,
      noImportJobWriteNow: true,
      noImportStagingRowWriteNow: true,
      noAmazonCallNow: true,
      noWorkerNow: true,
      noTransactionWriteNow: true,
      noInventoryWriteNow: true,
      noSettlementOrBankReconciliationNow: true,
    },
  };
}

export function assertAmazonSpApiOrdersHistoricalSyncPrismaMigrationContract(
  contract: AmazonSpApiOrdersHistoricalSyncPrismaMigrationContract,
): AmazonSpApiOrdersHistoricalSyncPrismaMigrationContract {
  if (contract.step !== 'Step149-E') {
    throw new Error('STEP149_E_INVALID_STEP');
  }

  if (contract.status !== 'migration_contract_only') {
    throw new Error('STEP149_E_STATUS_MUST_BE_MIGRATION_CONTRACT_ONLY');
  }

  if (!contract.noSchemaPrismaChangeNow || !contract.noMigrationDirectoryNow) {
    throw new Error('STEP149_E_SCHEMA_OR_MIGRATION_CHANGE_FORBIDDEN_NOW');
  }

  if (!contract.noPrismaClientGenerationNow) {
    throw new Error('STEP149_E_PRISMA_CLIENT_GENERATION_FORBIDDEN_NOW');
  }

  if (!contract.noRuntimePersistenceNow || !contract.noControllerBehaviorChangeNow) {
    throw new Error('STEP149_E_RUNTIME_CHANGE_FORBIDDEN_NOW');
  }

  if (!contract.futureEnums.AmazonSpApiOrderSyncJobStatus.includes('PARTIAL_FAILED')) {
    throw new Error('STEP149_E_JOB_STATUS_REQUIRES_PARTIAL_FAILED');
  }

  if (!contract.futureEnums.AmazonSpApiOrderSyncSegmentStatus.includes('RETRYABLE_FAILED')) {
    throw new Error('STEP149_E_SEGMENT_STATUS_REQUIRES_RETRYABLE_FAILED');
  }

  if (!contract.futureModels.AmazonSpApiOrderSyncJob.fields.includes('lastCompletedWindowEnd DateTime?')) {
    throw new Error('STEP149_E_JOB_REQUIRES_LAST_COMPLETED_WINDOW_END');
  }

  if (!contract.futureModels.AmazonSpApiOrderSyncSegment.fields.includes('nextToken String?')) {
    throw new Error('STEP149_E_SEGMENT_REQUIRES_NEXT_TOKEN');
  }

  if (!contract.futureModels.AmazonSpApiOrderSyncSegment.fields.includes('retryAttempts Int @default(0)')) {
    throw new Error('STEP149_E_SEGMENT_REQUIRES_RETRY_ATTEMPTS');
  }

  if (!contract.futureModels.AmazonSpApiOrderSyncSegment.uniqueConstraints.includes('@@unique([syncJobId, segmentIndex])')) {
    throw new Error('STEP149_E_SEGMENT_REQUIRES_UNIQUE_SYNCJOB_SEGMENT_INDEX');
  }

  if (!contract.futureModels.ImportJobFutureExtension.fields.includes('amazonSpApiOrderSyncJobId String?')) {
    throw new Error('STEP149_E_IMPORTJOB_REQUIRES_FUTURE_SYNC_JOB_LINK');
  }

  if (!contract.guardrails.schemaPrismaMustRemainUnchangedInStep149E) {
    throw new Error('STEP149_E_SCHEMA_PRISMA_MUST_REMAIN_UNCHANGED');
  }

  if (!contract.guardrails.noPrismaMigrateCommandInStep149E || !contract.guardrails.noPrismaGenerateCommandInStep149E) {
    throw new Error('STEP149_E_PRISMA_COMMANDS_FORBIDDEN_NOW');
  }

  return contract;
}

export const AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_PRISMA_MIGRATION_CONTRACT =
  assertAmazonSpApiOrdersHistoricalSyncPrismaMigrationContract(
    buildAmazonSpApiOrdersHistoricalSyncPrismaMigrationContract(),
  );
