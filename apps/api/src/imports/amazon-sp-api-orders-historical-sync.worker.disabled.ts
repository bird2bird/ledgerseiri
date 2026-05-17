import {
  assertAmazonSpApiOrdersHistoricalSyncWorkerDisabledContract,
  buildAmazonSpApiOrdersHistoricalSyncWorkerDisabledContract,
  type AmazonSpApiOrdersHistoricalSyncPlanInput,
  type AmazonSpApiOrdersHistoricalSyncPlanResult,
  type AmazonSpApiOrdersHistoricalSyncWorkerDisabledContract,
  type AmazonSpApiOrdersHistoricalSyncWorkerRunResult,
} from './dto/amazon-sp-api-orders-historical-sync-worker-disabled-contract.dto';
import type {
  AmazonSpApiOrdersHistoricalSyncRepository,
} from './dto/amazon-sp-api-orders-historical-sync-repository-contract.dto';

const STEP149_J_DISABLED_REASON = 'STEP149_J_WORKER_DISABLED_BY_DEFAULT' as const;

export class AmazonSpApiOrdersHistoricalSyncWorkerDisabled {
  readonly contract: AmazonSpApiOrdersHistoricalSyncWorkerDisabledContract;

  constructor(
    private readonly repository: AmazonSpApiOrdersHistoricalSyncRepository,
  ) {
    this.contract = assertAmazonSpApiOrdersHistoricalSyncWorkerDisabledContract(
      buildAmazonSpApiOrdersHistoricalSyncWorkerDisabledContract(repository.contract),
    );
  }

  planHistoricalSync(_input: AmazonSpApiOrdersHistoricalSyncPlanInput): AmazonSpApiOrdersHistoricalSyncPlanResult {
    return {
      accepted: false,
      disabled: true,
      reason: STEP149_J_DISABLED_REASON,
      executionMode: 'worker_disabled',
      wouldCreateSyncJob: false,
      wouldCreateSegments: false,
      wouldCallAmazon: false,
      wouldWriteDatabase: false,
      plannedSegments: [],
    };
  }

  async runHistoricalSync(_input: AmazonSpApiOrdersHistoricalSyncPlanInput): Promise<AmazonSpApiOrdersHistoricalSyncWorkerRunResult> {
    return this.disabledRunResult();
  }

  async runSegment(_args: {
    readonly companyId: string;
    readonly syncJobId: string;
    readonly syncSegmentId: string;
  }): Promise<AmazonSpApiOrdersHistoricalSyncWorkerRunResult> {
    return this.disabledRunResult();
  }

  private disabledRunResult(): AmazonSpApiOrdersHistoricalSyncWorkerRunResult {
    return {
      accepted: false,
      disabled: true,
      reason: STEP149_J_DISABLED_REASON,
      executionMode: 'worker_disabled',
      callsRepository: false,
      callsAmazon: false,
      writesDatabase: false,
      writesImportJob: false,
      writesImportStagingRow: false,
      writesTransaction: false,
      writesInventoryMovement: false,
      startsBackgroundLoop: false,
    };
  }
}

export function createAmazonSpApiOrdersHistoricalSyncWorkerDisabled(
  repository: AmazonSpApiOrdersHistoricalSyncRepository,
): AmazonSpApiOrdersHistoricalSyncWorkerDisabled {
  return new AmazonSpApiOrdersHistoricalSyncWorkerDisabled(repository);
}
