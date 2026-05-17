import type {
  AmazonSpApiOrdersHistoricalSyncRepositoryBoundaries,
  AmazonSpApiOrdersHistoricalSyncRepositoryContract,
} from './amazon-sp-api-orders-historical-sync-repository-contract.dto';

export type AmazonSpApiOrdersHistoricalSyncPrismaRepositoryDisabledReason =
  | 'STEP149_I_PRISMA_REPOSITORY_DISABLED_BY_DEFAULT';

export type AmazonSpApiOrdersHistoricalSyncPrismaRepositoryDisabledContract = {
  readonly step: 'Step149-I';
  readonly source: 'amazon-sp-api-orders-historical-sync';
  readonly repositoryMode: 'prisma_disabled';
  readonly disabledByDefault: true;
  readonly allowRuntimeWrites: false;
  readonly delegateBoundaryVisible: true;
  readonly noControllerWiringNow: true;
  readonly noWorkerWiringNow: true;
  readonly noAmazonCallNow: true;
  readonly noRuntimePersistenceNow: true;
  readonly disabledReason: AmazonSpApiOrdersHistoricalSyncPrismaRepositoryDisabledReason;
  readonly expectedDelegateNames: readonly [
    'amazonSpApiOrderSyncJob',
    'amazonSpApiOrderSyncSegment',
  ];
  readonly boundaries: AmazonSpApiOrdersHistoricalSyncRepositoryBoundaries;
  readonly compatibleRepositoryContract: AmazonSpApiOrdersHistoricalSyncRepositoryContract;
};

export function buildAmazonSpApiOrdersHistoricalSyncPrismaRepositoryDisabledContract(): AmazonSpApiOrdersHistoricalSyncPrismaRepositoryDisabledContract {
  return {
    step: 'Step149-I',
    source: 'amazon-sp-api-orders-historical-sync',
    repositoryMode: 'prisma_disabled',
    disabledByDefault: true,
    allowRuntimeWrites: false,
    delegateBoundaryVisible: true,
    noControllerWiringNow: true,
    noWorkerWiringNow: true,
    noAmazonCallNow: true,
    noRuntimePersistenceNow: true,
    disabledReason: 'STEP149_I_PRISMA_REPOSITORY_DISABLED_BY_DEFAULT',
    expectedDelegateNames: [
      'amazonSpApiOrderSyncJob',
      'amazonSpApiOrderSyncSegment',
    ],
    boundaries: {
      usesTestDoubleOnly: false,
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
    compatibleRepositoryContract: {
      step: 'Step149-H',
      source: 'amazon-sp-api-orders-historical-sync',
      repositoryMode: 'prisma_disabled',
      createReadOnlyContract: true,
      noPrismaRuntimeNow: true,
      noWorkerNow: true,
      noAmazonCallNow: true,
      noControllerBehaviorChangeNow: true,
      boundaries: {
        usesTestDoubleOnly: false,
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
    },
  };
}

export function assertAmazonSpApiOrdersHistoricalSyncPrismaRepositoryDisabledContract(
  contract: AmazonSpApiOrdersHistoricalSyncPrismaRepositoryDisabledContract,
): AmazonSpApiOrdersHistoricalSyncPrismaRepositoryDisabledContract {
  if (contract.step !== 'Step149-I') {
    throw new Error('STEP149_I_INVALID_STEP');
  }

  if (contract.repositoryMode !== 'prisma_disabled') {
    throw new Error('STEP149_I_REPOSITORY_MUST_BE_PRISMA_DISABLED');
  }

  if (!contract.disabledByDefault || contract.allowRuntimeWrites) {
    throw new Error('STEP149_I_MUST_BE_DISABLED_BY_DEFAULT');
  }

  if (!contract.delegateBoundaryVisible) {
    throw new Error('STEP149_I_DELEGATE_BOUNDARY_MUST_BE_VISIBLE');
  }

  if (!contract.noControllerWiringNow || !contract.noWorkerWiringNow) {
    throw new Error('STEP149_I_CONTROLLER_WORKER_WIRING_FORBIDDEN_NOW');
  }

  if (!contract.noAmazonCallNow || !contract.noRuntimePersistenceNow) {
    throw new Error('STEP149_I_AMAZON_OR_RUNTIME_PERSISTENCE_FORBIDDEN_NOW');
  }

  if (
    contract.boundaries.callsPrismaDelegate ||
    contract.boundaries.writesDatabase ||
    contract.boundaries.callsAmazon ||
    contract.boundaries.startsWorker ||
    contract.boundaries.writesImportJob ||
    contract.boundaries.writesImportStagingRow ||
    contract.boundaries.writesTransaction ||
    contract.boundaries.writesInventoryMovement ||
    contract.boundaries.updatesInventoryBalance ||
    contract.boundaries.exposesRawTokens
  ) {
    throw new Error('STEP149_I_BOUNDARIES_MUST_REMAIN_DISABLED');
  }

  if (!contract.expectedDelegateNames.includes('amazonSpApiOrderSyncJob')) {
    throw new Error('STEP149_I_JOB_DELEGATE_NAME_REQUIRED');
  }

  if (!contract.expectedDelegateNames.includes('amazonSpApiOrderSyncSegment')) {
    throw new Error('STEP149_I_SEGMENT_DELEGATE_NAME_REQUIRED');
  }

  return contract;
}

export const AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_PRISMA_REPOSITORY_DISABLED_CONTRACT =
  assertAmazonSpApiOrdersHistoricalSyncPrismaRepositoryDisabledContract(
    buildAmazonSpApiOrdersHistoricalSyncPrismaRepositoryDisabledContract(),
  );
