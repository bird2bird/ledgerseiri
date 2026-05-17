import type { PrismaClient } from '@prisma/client';

import {
  AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_PRISMA_REPOSITORY_DISABLED_CONTRACT,
  type AmazonSpApiOrdersHistoricalSyncPrismaRepositoryDisabledContract,
} from './dto/amazon-sp-api-orders-historical-sync-prisma-repository-disabled-contract.dto';
import type {
  AmazonSpApiOrdersHistoricalSyncJobProgressSummary,
  AmazonSpApiOrdersHistoricalSyncJobRecord,
  AmazonSpApiOrdersHistoricalSyncRepository,
  AmazonSpApiOrdersHistoricalSyncSegmentRecord,
  CreateAmazonSpApiOrdersHistoricalSyncJobInput,
  CreateAmazonSpApiOrdersHistoricalSyncSegmentInput,
} from './dto/amazon-sp-api-orders-historical-sync-repository-contract.dto';

export type AmazonSpApiOrdersHistoricalSyncPrismaDelegateBoundary = Pick<
  PrismaClient,
  'amazonSpApiOrderSyncJob' | 'amazonSpApiOrderSyncSegment'
>;

export class AmazonSpApiOrdersHistoricalSyncPrismaRepositoryDisabled
  implements AmazonSpApiOrdersHistoricalSyncRepository
{
  readonly contract =
    AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_PRISMA_REPOSITORY_DISABLED_CONTRACT
      .compatibleRepositoryContract;

  readonly disabledContract: AmazonSpApiOrdersHistoricalSyncPrismaRepositoryDisabledContract =
    AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_PRISMA_REPOSITORY_DISABLED_CONTRACT;

  constructor(
    private readonly prisma: AmazonSpApiOrdersHistoricalSyncPrismaDelegateBoundary,
  ) {}

  getDelegateAvailability(): {
    readonly hasJobDelegate: boolean;
    readonly hasSegmentDelegate: boolean;
  } {
    return {
      hasJobDelegate: Boolean(this.prisma.amazonSpApiOrderSyncJob),
      hasSegmentDelegate: Boolean(this.prisma.amazonSpApiOrderSyncSegment),
    };
  }

  async createSyncJob(
    _input: CreateAmazonSpApiOrdersHistoricalSyncJobInput,
  ): Promise<AmazonSpApiOrdersHistoricalSyncJobRecord> {
    return this.rejectDisabled();
  }

  async getSyncJobById(_args: {
    readonly companyId: string;
    readonly syncJobId: string;
  }): Promise<AmazonSpApiOrdersHistoricalSyncJobRecord | null> {
    return this.rejectDisabled();
  }

  async listSyncJobsByCompany(_args: {
    readonly companyId: string;
  }): Promise<readonly AmazonSpApiOrdersHistoricalSyncJobRecord[]> {
    return this.rejectDisabled();
  }

  async createSyncSegment(
    _input: CreateAmazonSpApiOrdersHistoricalSyncSegmentInput,
  ): Promise<AmazonSpApiOrdersHistoricalSyncSegmentRecord> {
    return this.rejectDisabled();
  }

  async getSyncSegmentById(_args: {
    readonly companyId: string;
    readonly syncSegmentId: string;
  }): Promise<AmazonSpApiOrdersHistoricalSyncSegmentRecord | null> {
    return this.rejectDisabled();
  }

  async listSyncSegmentsByJobId(_args: {
    readonly companyId: string;
    readonly syncJobId: string;
  }): Promise<readonly AmazonSpApiOrdersHistoricalSyncSegmentRecord[]> {
    return this.rejectDisabled();
  }

  async getJobProgressSummary(_args: {
    readonly companyId: string;
    readonly syncJobId: string;
  }): Promise<AmazonSpApiOrdersHistoricalSyncJobProgressSummary | null> {
    return this.rejectDisabled();
  }

  private rejectDisabled(): never {
    throw new Error('STEP149_I_PRISMA_REPOSITORY_DISABLED_BY_DEFAULT');
  }
}

export function createAmazonSpApiOrdersHistoricalSyncPrismaRepositoryDisabled(
  prisma: AmazonSpApiOrdersHistoricalSyncPrismaDelegateBoundary,
): AmazonSpApiOrdersHistoricalSyncPrismaRepositoryDisabled {
  return new AmazonSpApiOrdersHistoricalSyncPrismaRepositoryDisabled(prisma);
}
