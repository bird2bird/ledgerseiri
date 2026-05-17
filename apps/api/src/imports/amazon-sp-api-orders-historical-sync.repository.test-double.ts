import {
  AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_REPOSITORY_CONTRACT,
  type AmazonSpApiOrdersHistoricalSyncJobProgressSummary,
  type AmazonSpApiOrdersHistoricalSyncJobRecord,
  type AmazonSpApiOrdersHistoricalSyncRepository,
  type AmazonSpApiOrdersHistoricalSyncSegmentRecord,
  type CreateAmazonSpApiOrdersHistoricalSyncJobInput,
  type CreateAmazonSpApiOrdersHistoricalSyncSegmentInput,
} from './dto/amazon-sp-api-orders-historical-sync-repository-contract.dto';

type TestDoubleState = {
  readonly jobs: Map<string, AmazonSpApiOrdersHistoricalSyncJobRecord>;
  readonly segments: Map<string, AmazonSpApiOrdersHistoricalSyncSegmentRecord>;
};

function assertNonEmpty(value: string | undefined | null, code: string): string {
  const normalized = String(value || '').trim();
  if (!normalized) {
    throw new Error(code);
  }
  return normalized;
}

function nowIso(input?: string): string {
  return input || new Date('2026-01-01T00:00:00.000Z').toISOString();
}

function makeId(prefix: string, count: number): string {
  return `${prefix}_${String(count + 1).padStart(4, '0')}`;
}

export class AmazonSpApiOrdersHistoricalSyncRepositoryTestDouble
  implements AmazonSpApiOrdersHistoricalSyncRepository
{
  readonly contract = AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_REPOSITORY_CONTRACT;

  private readonly state: TestDoubleState = {
    jobs: new Map<string, AmazonSpApiOrdersHistoricalSyncJobRecord>(),
    segments: new Map<string, AmazonSpApiOrdersHistoricalSyncSegmentRecord>(),
  };

  async createSyncJob(
    input: CreateAmazonSpApiOrdersHistoricalSyncJobInput,
  ): Promise<AmazonSpApiOrdersHistoricalSyncJobRecord> {
    const companyId = assertNonEmpty(input.companyId, 'STEP149_H_COMPANY_ID_REQUIRED');
    const storeId = assertNonEmpty(input.storeId, 'STEP149_H_STORE_ID_REQUIRED');
    const marketplaceId = assertNonEmpty(input.marketplaceId, 'STEP149_H_MARKETPLACE_ID_REQUIRED');
    const requestedStartDate = assertNonEmpty(
      input.requestedStartDate,
      'STEP149_H_REQUESTED_START_DATE_REQUIRED',
    );
    const requestedEndDate = assertNonEmpty(
      input.requestedEndDate,
      'STEP149_H_REQUESTED_END_DATE_REQUIRED',
    );

    if (!Number.isInteger(input.totalSegments) || input.totalSegments < 1) {
      throw new Error('STEP149_H_TOTAL_SEGMENTS_REQUIRED');
    }

    const timestamp = nowIso(input.nowIso);
    const id = makeId('sync_job', this.state.jobs.size);

    const job: AmazonSpApiOrdersHistoricalSyncJobRecord = {
      id,
      companyId,
      storeId,
      marketplaceId,
      region: input.region || 'JP',
      requestedStartDate,
      requestedEndDate,
      status: 'PENDING',
      totalSegments: input.totalSegments,
      completedSegments: 0,
      failedSegments: 0,
      lastCompletedWindowEnd: null,
      lastErrorCode: null,
      lastErrorMessage: null,
      createdByUserId: input.createdByUserId || null,
      createdAt: timestamp,
      startedAt: null,
      finishedAt: null,
      updatedAt: timestamp,
    };

    this.state.jobs.set(id, job);
    return job;
  }

  async getSyncJobById(args: {
    readonly companyId: string;
    readonly syncJobId: string;
  }): Promise<AmazonSpApiOrdersHistoricalSyncJobRecord | null> {
    const job = this.state.jobs.get(args.syncJobId) || null;
    if (!job || job.companyId !== args.companyId) return null;
    return job;
  }

  async listSyncJobsByCompany(args: {
    readonly companyId: string;
  }): Promise<readonly AmazonSpApiOrdersHistoricalSyncJobRecord[]> {
    return [...this.state.jobs.values()].filter((job) => job.companyId === args.companyId);
  }

  async createSyncSegment(
    input: CreateAmazonSpApiOrdersHistoricalSyncSegmentInput,
  ): Promise<AmazonSpApiOrdersHistoricalSyncSegmentRecord> {
    const syncJobId = assertNonEmpty(input.syncJobId, 'STEP149_H_SYNC_JOB_ID_REQUIRED');
    const job = this.state.jobs.get(syncJobId);

    if (!job || job.companyId !== input.companyId) {
      throw new Error('STEP149_H_SYNC_JOB_NOT_FOUND');
    }

    if (!Number.isInteger(input.segmentIndex) || input.segmentIndex < 0) {
      throw new Error('STEP149_H_SEGMENT_INDEX_REQUIRED');
    }

    const duplicate = [...this.state.segments.values()].find(
      (segment) => segment.syncJobId === syncJobId && segment.segmentIndex === input.segmentIndex,
    );

    if (duplicate) {
      throw new Error('STEP149_H_DUPLICATE_SEGMENT_INDEX');
    }

    const timestamp = nowIso(input.nowIso);
    const id = makeId('sync_segment', this.state.segments.size);

    const segment: AmazonSpApiOrdersHistoricalSyncSegmentRecord = {
      id,
      syncJobId,
      companyId: job.companyId,
      storeId: job.storeId,
      marketplaceId: job.marketplaceId,
      segmentIndex: input.segmentIndex,
      createdAfter: assertNonEmpty(input.createdAfter, 'STEP149_H_CREATED_AFTER_REQUIRED'),
      createdBefore: assertNonEmpty(input.createdBefore, 'STEP149_H_CREATED_BEFORE_REQUIRED'),
      status: 'PENDING',
      nextToken: null,
      pagesFetched: 0,
      ordersFetched: 0,
      itemsFetched: 0,
      retryAttempts: 0,
      lastErrorCode: null,
      lastErrorMessage: null,
      createdImportJobId: null,
      startedAt: null,
      finishedAt: null,
      updatedAt: timestamp,
    };

    this.state.segments.set(id, segment);
    return segment;
  }

  async getSyncSegmentById(args: {
    readonly companyId: string;
    readonly syncSegmentId: string;
  }): Promise<AmazonSpApiOrdersHistoricalSyncSegmentRecord | null> {
    const segment = this.state.segments.get(args.syncSegmentId) || null;
    if (!segment || segment.companyId !== args.companyId) return null;
    return segment;
  }

  async listSyncSegmentsByJobId(args: {
    readonly companyId: string;
    readonly syncJobId: string;
  }): Promise<readonly AmazonSpApiOrdersHistoricalSyncSegmentRecord[]> {
    return [...this.state.segments.values()]
      .filter((segment) => segment.companyId === args.companyId && segment.syncJobId === args.syncJobId)
      .sort((a, b) => a.segmentIndex - b.segmentIndex);
  }

  async getJobProgressSummary(args: {
    readonly companyId: string;
    readonly syncJobId: string;
  }): Promise<AmazonSpApiOrdersHistoricalSyncJobProgressSummary | null> {
    const job = await this.getSyncJobById(args);
    if (!job) return null;

    const segments = await this.listSyncSegmentsByJobId(args);

    return {
      syncJobId: job.id,
      status: job.status,
      totalSegments: job.totalSegments,
      completedSegments: segments.filter((segment) => segment.status === 'SUCCEEDED').length,
      failedSegments: segments.filter((segment) => segment.status === 'FAILED').length,
      pendingSegments: segments.filter((segment) => segment.status === 'PENDING').length,
      runningSegments: segments.filter((segment) => segment.status === 'RUNNING').length,
      retryableFailedSegments: segments.filter((segment) => segment.status === 'RETRYABLE_FAILED').length,
      hasNextToken: segments.some((segment) => Boolean(segment.nextToken)),
      lastCompletedWindowEnd: job.lastCompletedWindowEnd,
      lastErrorCode: job.lastErrorCode,
      lastErrorMessage: job.lastErrorMessage,
    };
  }
}

export function createAmazonSpApiOrdersHistoricalSyncRepositoryTestDouble(): AmazonSpApiOrdersHistoricalSyncRepositoryTestDouble {
  return new AmazonSpApiOrdersHistoricalSyncRepositoryTestDouble();
}
