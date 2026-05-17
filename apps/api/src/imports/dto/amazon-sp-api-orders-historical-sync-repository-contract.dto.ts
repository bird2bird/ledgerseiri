export type AmazonSpApiOrdersHistoricalSyncRepositoryMode =
  | 'test_double_only'
  | 'prisma_disabled'
  | 'prisma_guarded_runtime';

export type AmazonSpApiOrdersHistoricalSyncJobStatus =
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

export type AmazonSpApiOrdersHistoricalSyncJobRecord = {
  readonly id: string;
  readonly companyId: string;
  readonly storeId: string;
  readonly marketplaceId: string;
  readonly region: string;
  readonly requestedStartDate: string;
  readonly requestedEndDate: string;
  readonly status: AmazonSpApiOrdersHistoricalSyncJobStatus;
  readonly totalSegments: number;
  readonly completedSegments: number;
  readonly failedSegments: number;
  readonly lastCompletedWindowEnd: string | null;
  readonly lastErrorCode: string | null;
  readonly lastErrorMessage: string | null;
  readonly createdByUserId: string | null;
  readonly createdAt: string;
  readonly startedAt: string | null;
  readonly finishedAt: string | null;
  readonly updatedAt: string;
};

export type AmazonSpApiOrdersHistoricalSyncSegmentRecord = {
  readonly id: string;
  readonly syncJobId: string;
  readonly companyId: string;
  readonly storeId: string;
  readonly marketplaceId: string;
  readonly segmentIndex: number;
  readonly createdAfter: string;
  readonly createdBefore: string;
  readonly status: AmazonSpApiOrdersHistoricalSyncSegmentStatus;
  readonly nextToken: string | null;
  readonly pagesFetched: number;
  readonly ordersFetched: number;
  readonly itemsFetched: number;
  readonly retryAttempts: number;
  readonly lastErrorCode: string | null;
  readonly lastErrorMessage: string | null;
  readonly createdImportJobId: string | null;
  readonly startedAt: string | null;
  readonly finishedAt: string | null;
  readonly updatedAt: string;
};

export type CreateAmazonSpApiOrdersHistoricalSyncJobInput = {
  readonly companyId: string;
  readonly storeId: string;
  readonly marketplaceId: string;
  readonly region?: string;
  readonly requestedStartDate: string;
  readonly requestedEndDate: string;
  readonly totalSegments: number;
  readonly createdByUserId?: string | null;
  readonly nowIso?: string;
};

export type CreateAmazonSpApiOrdersHistoricalSyncSegmentInput = {
  readonly syncJobId: string;
  readonly companyId: string;
  readonly storeId: string;
  readonly marketplaceId: string;
  readonly segmentIndex: number;
  readonly createdAfter: string;
  readonly createdBefore: string;
  readonly nowIso?: string;
};

export type AmazonSpApiOrdersHistoricalSyncJobProgressSummary = {
  readonly syncJobId: string;
  readonly status: AmazonSpApiOrdersHistoricalSyncJobStatus;
  readonly totalSegments: number;
  readonly completedSegments: number;
  readonly failedSegments: number;
  readonly pendingSegments: number;
  readonly runningSegments: number;
  readonly retryableFailedSegments: number;
  readonly hasNextToken: boolean;
  readonly lastCompletedWindowEnd: string | null;
  readonly lastErrorCode: string | null;
  readonly lastErrorMessage: string | null;
};

export type AmazonSpApiOrdersHistoricalSyncRepositoryBoundaries = {
  readonly usesTestDoubleOnly: boolean;
  readonly callsPrismaDelegate: boolean;
  readonly writesDatabase: boolean;
  readonly callsAmazon: boolean;
  readonly startsWorker: boolean;
  readonly writesImportJob: boolean;
  readonly writesImportStagingRow: boolean;
  readonly writesTransaction: boolean;
  readonly writesInventoryMovement: boolean;
  readonly updatesInventoryBalance: boolean;
  readonly exposesRawTokens: boolean;
};

export type AmazonSpApiOrdersHistoricalSyncRepositoryContract = {
  readonly step: 'Step149-H';
  readonly source: 'amazon-sp-api-orders-historical-sync';
  readonly repositoryMode: AmazonSpApiOrdersHistoricalSyncRepositoryMode;
  readonly createReadOnlyContract: true;
  readonly noPrismaRuntimeNow: true;
  readonly noWorkerNow: true;
  readonly noAmazonCallNow: true;
  readonly noControllerBehaviorChangeNow: true;
  readonly boundaries: AmazonSpApiOrdersHistoricalSyncRepositoryBoundaries;
  readonly requiredMethods: readonly [
    'createSyncJob',
    'getSyncJobById',
    'listSyncJobsByCompany',
    'createSyncSegment',
    'getSyncSegmentById',
    'listSyncSegmentsByJobId',
    'getJobProgressSummary',
  ];
};

export interface AmazonSpApiOrdersHistoricalSyncRepository {
  readonly contract: AmazonSpApiOrdersHistoricalSyncRepositoryContract;

  createSyncJob(
    input: CreateAmazonSpApiOrdersHistoricalSyncJobInput,
  ): Promise<AmazonSpApiOrdersHistoricalSyncJobRecord>;

  getSyncJobById(args: {
    readonly companyId: string;
    readonly syncJobId: string;
  }): Promise<AmazonSpApiOrdersHistoricalSyncJobRecord | null>;

  listSyncJobsByCompany(args: {
    readonly companyId: string;
  }): Promise<readonly AmazonSpApiOrdersHistoricalSyncJobRecord[]>;

  createSyncSegment(
    input: CreateAmazonSpApiOrdersHistoricalSyncSegmentInput,
  ): Promise<AmazonSpApiOrdersHistoricalSyncSegmentRecord>;

  getSyncSegmentById(args: {
    readonly companyId: string;
    readonly syncSegmentId: string;
  }): Promise<AmazonSpApiOrdersHistoricalSyncSegmentRecord | null>;

  listSyncSegmentsByJobId(args: {
    readonly companyId: string;
    readonly syncJobId: string;
  }): Promise<readonly AmazonSpApiOrdersHistoricalSyncSegmentRecord[]>;

  getJobProgressSummary(args: {
    readonly companyId: string;
    readonly syncJobId: string;
  }): Promise<AmazonSpApiOrdersHistoricalSyncJobProgressSummary | null>;
}

export function buildAmazonSpApiOrdersHistoricalSyncRepositoryContract(): AmazonSpApiOrdersHistoricalSyncRepositoryContract {
  return {
    step: 'Step149-H',
    source: 'amazon-sp-api-orders-historical-sync',
    repositoryMode: 'test_double_only',
    createReadOnlyContract: true,
    noPrismaRuntimeNow: true,
    noWorkerNow: true,
    noAmazonCallNow: true,
    noControllerBehaviorChangeNow: true,
    boundaries: {
      usesTestDoubleOnly: true,
      callsPrismaDelegate: false,
      writesDatabase: false,
      callsAmazon: false,
      startsWorker: false,
      writesImportJob: false,
      writesImportStagingRow: false,
      writesTransaction: false,
      writesInventoryMovement: false,
      updatesInventoryBalance: false,
      exposesRawTokens: false,
    },
    requiredMethods: [
      'createSyncJob',
      'getSyncJobById',
      'listSyncJobsByCompany',
      'createSyncSegment',
      'getSyncSegmentById',
      'listSyncSegmentsByJobId',
      'getJobProgressSummary',
    ],
  };
}

export function assertAmazonSpApiOrdersHistoricalSyncRepositoryContract(
  contract: AmazonSpApiOrdersHistoricalSyncRepositoryContract,
): AmazonSpApiOrdersHistoricalSyncRepositoryContract {
  if (contract.step !== 'Step149-H') {
    throw new Error('STEP149_H_INVALID_STEP');
  }

  if (contract.repositoryMode !== 'test_double_only') {
    throw new Error('STEP149_H_REPOSITORY_MUST_BE_TEST_DOUBLE_ONLY');
  }

  if (!contract.noPrismaRuntimeNow || contract.boundaries.callsPrismaDelegate) {
    throw new Error('STEP149_H_PRISMA_RUNTIME_FORBIDDEN_NOW');
  }

  if (contract.boundaries.writesDatabase) {
    throw new Error('STEP149_H_DATABASE_WRITE_FORBIDDEN_NOW');
  }

  if (contract.boundaries.callsAmazon || contract.boundaries.startsWorker) {
    throw new Error('STEP149_H_AMAZON_OR_WORKER_FORBIDDEN_NOW');
  }

  if (
    contract.boundaries.writesImportJob ||
    contract.boundaries.writesImportStagingRow ||
    contract.boundaries.writesTransaction ||
    contract.boundaries.writesInventoryMovement ||
    contract.boundaries.updatesInventoryBalance
  ) {
    throw new Error('STEP149_H_BUSINESS_WRITES_FORBIDDEN_NOW');
  }

  if (!contract.requiredMethods.includes('createSyncJob')) {
    throw new Error('STEP149_H_CREATE_SYNC_JOB_REQUIRED');
  }

  if (!contract.requiredMethods.includes('createSyncSegment')) {
    throw new Error('STEP149_H_CREATE_SYNC_SEGMENT_REQUIRED');
  }

  if (!contract.requiredMethods.includes('getJobProgressSummary')) {
    throw new Error('STEP149_H_PROGRESS_SUMMARY_REQUIRED');
  }

  return contract;
}

export const AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_REPOSITORY_CONTRACT =
  assertAmazonSpApiOrdersHistoricalSyncRepositoryContract(
    buildAmazonSpApiOrdersHistoricalSyncRepositoryContract(),
  );
