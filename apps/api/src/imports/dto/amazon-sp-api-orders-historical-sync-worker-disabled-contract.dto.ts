import type {
  AmazonSpApiOrdersHistoricalSyncRepositoryContract,
} from './amazon-sp-api-orders-historical-sync-repository-contract.dto';

export type AmazonSpApiOrdersHistoricalSyncWorkerExecutionMode =
  | 'worker_disabled'
  | 'planning_only'
  | 'guarded_runtime';

export type AmazonSpApiOrdersHistoricalSyncWorkerDisabledReason =
  | 'STEP149_J_WORKER_DISABLED_BY_DEFAULT';

export type AmazonSpApiOrdersHistoricalSyncPlanInput = {
  readonly companyId: string;
  readonly storeId: string;
  readonly marketplaceId: string;
  readonly region?: string;
  readonly syncStartDate: string;
  readonly syncEndDate: string;
  readonly requestedByUserId?: string | null;
  readonly segmentDays?: number;
};

export type AmazonSpApiOrdersHistoricalSyncPlannedSegment = {
  readonly segmentIndex: number;
  readonly createdAfter: string;
  readonly createdBefore: string;
};

export type AmazonSpApiOrdersHistoricalSyncPlanResult = {
  readonly accepted: false;
  readonly disabled: true;
  readonly reason: AmazonSpApiOrdersHistoricalSyncWorkerDisabledReason;
  readonly executionMode: 'worker_disabled';
  readonly wouldCreateSyncJob: false;
  readonly wouldCreateSegments: false;
  readonly wouldCallAmazon: false;
  readonly wouldWriteDatabase: false;
  readonly plannedSegments: readonly AmazonSpApiOrdersHistoricalSyncPlannedSegment[];
};

export type AmazonSpApiOrdersHistoricalSyncWorkerRunResult = {
  readonly accepted: false;
  readonly disabled: true;
  readonly reason: AmazonSpApiOrdersHistoricalSyncWorkerDisabledReason;
  readonly executionMode: 'worker_disabled';
  readonly callsRepository: false;
  readonly callsAmazon: false;
  readonly writesDatabase: false;
  readonly writesImportJob: false;
  readonly writesImportStagingRow: false;
  readonly writesTransaction: false;
  readonly writesInventoryMovement: false;
  readonly startsBackgroundLoop: false;
};

export type AmazonSpApiOrdersHistoricalSyncWorkerBoundaries = {
  readonly disabledByDefault: true;
  readonly noSchedulerRegistrationNow: true;
  readonly noControllerWiringNow: true;
  readonly noRepositoryRuntimeCallNow: true;
  readonly noPrismaDelegateCallNow: true;
  readonly noAmazonCallNow: true;
  readonly noDatabaseWriteNow: true;
  readonly noImportJobWriteNow: true;
  readonly noImportStagingRowWriteNow: true;
  readonly noTransactionWriteNow: true;
  readonly noInventoryMovementWriteNow: true;
  readonly noInfiniteLoopNow: true;
  readonly noSetIntervalNow: true;
  readonly noQueueConsumerNow: true;
};

export type AmazonSpApiOrdersHistoricalSyncWorkerDisabledContract = {
  readonly step: 'Step149-J';
  readonly source: 'amazon-sp-api-orders-historical-sync';
  readonly executionMode: AmazonSpApiOrdersHistoricalSyncWorkerExecutionMode;
  readonly disabledReason: AmazonSpApiOrdersHistoricalSyncWorkerDisabledReason;
  readonly usesRepositoryBoundaryType: true;
  readonly compatibleRepositoryContractStep: 'Step149-H';
  readonly expectedRepositoryContract: AmazonSpApiOrdersHistoricalSyncRepositoryContract;
  readonly exposedMethods: readonly [
    'planHistoricalSync',
    'runHistoricalSync',
    'runSegment',
  ];
  readonly boundaries: AmazonSpApiOrdersHistoricalSyncWorkerBoundaries;
};

export function buildAmazonSpApiOrdersHistoricalSyncWorkerDisabledContract(
  repositoryContract: AmazonSpApiOrdersHistoricalSyncRepositoryContract,
): AmazonSpApiOrdersHistoricalSyncWorkerDisabledContract {
  return {
    step: 'Step149-J',
    source: 'amazon-sp-api-orders-historical-sync',
    executionMode: 'worker_disabled',
    disabledReason: 'STEP149_J_WORKER_DISABLED_BY_DEFAULT',
    usesRepositoryBoundaryType: true,
    compatibleRepositoryContractStep: 'Step149-H',
    expectedRepositoryContract: repositoryContract,
    exposedMethods: [
      'planHistoricalSync',
      'runHistoricalSync',
      'runSegment',
    ],
    boundaries: {
      disabledByDefault: true,
      noSchedulerRegistrationNow: true,
      noControllerWiringNow: true,
      noRepositoryRuntimeCallNow: true,
      noPrismaDelegateCallNow: true,
      noAmazonCallNow: true,
      noDatabaseWriteNow: true,
      noImportJobWriteNow: true,
      noImportStagingRowWriteNow: true,
      noTransactionWriteNow: true,
      noInventoryMovementWriteNow: true,
      noInfiniteLoopNow: true,
      noSetIntervalNow: true,
      noQueueConsumerNow: true,
    },
  };
}

export function assertAmazonSpApiOrdersHistoricalSyncWorkerDisabledContract(
  contract: AmazonSpApiOrdersHistoricalSyncWorkerDisabledContract,
): AmazonSpApiOrdersHistoricalSyncWorkerDisabledContract {
  if (contract.step !== 'Step149-J') {
    throw new Error('STEP149_J_INVALID_STEP');
  }

  if (contract.executionMode !== 'worker_disabled') {
    throw new Error('STEP149_J_WORKER_MUST_BE_DISABLED');
  }

  if (contract.disabledReason !== 'STEP149_J_WORKER_DISABLED_BY_DEFAULT') {
    throw new Error('STEP149_J_DISABLED_REASON_REQUIRED');
  }

  if (!contract.usesRepositoryBoundaryType) {
    throw new Error('STEP149_J_REPOSITORY_BOUNDARY_REQUIRED');
  }

  if (contract.compatibleRepositoryContractStep !== 'Step149-H') {
    throw new Error('STEP149_J_REPOSITORY_CONTRACT_STEP_MISMATCH');
  }

  if (!contract.exposedMethods.includes('planHistoricalSync')) {
    throw new Error('STEP149_J_PLAN_METHOD_REQUIRED');
  }

  if (!contract.exposedMethods.includes('runHistoricalSync')) {
    throw new Error('STEP149_J_RUN_METHOD_REQUIRED');
  }

  if (!contract.exposedMethods.includes('runSegment')) {
    throw new Error('STEP149_J_RUN_SEGMENT_METHOD_REQUIRED');
  }

  const boundaries = contract.boundaries;

  if (
    !boundaries.disabledByDefault ||
    !boundaries.noSchedulerRegistrationNow ||
    !boundaries.noControllerWiringNow ||
    !boundaries.noRepositoryRuntimeCallNow ||
    !boundaries.noPrismaDelegateCallNow ||
    !boundaries.noAmazonCallNow ||
    !boundaries.noDatabaseWriteNow ||
    !boundaries.noImportJobWriteNow ||
    !boundaries.noImportStagingRowWriteNow ||
    !boundaries.noTransactionWriteNow ||
    !boundaries.noInventoryMovementWriteNow ||
    !boundaries.noInfiniteLoopNow ||
    !boundaries.noSetIntervalNow ||
    !boundaries.noQueueConsumerNow
  ) {
    throw new Error('STEP149_J_BOUNDARIES_MUST_ALL_REMAIN_DISABLED');
  }

  return contract;
}
