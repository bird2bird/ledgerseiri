import {
  type AmazonImportedOrdersReadModelTestDoubleDetailResult,
  type AmazonImportedOrdersReadModelTestDoubleImportJob,
  type AmazonImportedOrdersReadModelTestDoubleListResult,
  type AmazonImportedOrdersTestDoubleStagingRow,
} from './dto/amazon-imported-orders-read-model-test-double-contract.dto';
import {
  mapAmazonImportedOrderDetailTestDouble,
  mapAmazonImportedOrdersTestDoubleList,
} from './amazon-imported-orders-read-model.mapper.test-double';

type ReadonlyImportJobDelegate = {
  findMany(args: {
    where: Record<string, unknown>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    take?: number;
    select: Record<string, boolean>;
  }): Promise<Array<Record<string, unknown>>>;
};

type ReadonlyImportStagingRowDelegate = {
  findMany(args: {
    where: Record<string, unknown>;
    orderBy?: Array<Record<string, 'asc' | 'desc'>>;
    take?: number;
    select: Record<string, boolean>;
  }): Promise<Array<Record<string, unknown>>>;
};

export type AmazonImportedOrdersReadonlyPrisma = {
  importJob: ReadonlyImportJobDelegate;
  importStagingRow: ReadonlyImportStagingRowDelegate;
};

export type AmazonImportedOrdersReadonlyQuery = {
  rangePreset?: string;
  startDate?: string;
  endDate?: string;
  orderId?: string;
  status?: string;
  content?: string;
  minAmount?: string;
  maxAmount?: string;
  cursor?: string;
  limit?: string;
};

export type AmazonImportedOrdersReadonlyListResponse = Omit<
  AmazonImportedOrdersReadModelTestDoubleListResult,
  'source' | 'testDoubleOnly' | 'boundaries'
> & {
  source: 'amazon-imported-orders-read-model';
  routeImplementedNow: true;
  readModelMode: 'guarded-readonly-existing-importjob-stagingrow';
  companyScoped: true;
  pagination: {
    nextCursor: null;
    hasMore: false;
    limit: number;
  };
  boundaries: {
    readsExistingImportJob: true;
    readsExistingImportStagingRow: true;
    callsAmazon: false;
    queriesPrisma: true;
    createsImportJob: false;
    createsSyncJob: false;
    createsSyncSegment: false;
    writesDatabase: false;
    writesTransaction: false;
    writesInventoryMovement: false;
    opensControllerRuntime: true;
  };
};

export type AmazonImportedOrderReadonlyDetailResponse = Omit<
  AmazonImportedOrdersReadModelTestDoubleDetailResult,
  'source' | 'testDoubleOnly' | 'boundaries'
> & {
  source: 'amazon-imported-order-detail-read-model';
  routeImplementedNow: true;
  readModelMode: 'guarded-readonly-existing-importjob-stagingrow';
  companyScoped: true;
  boundaries: AmazonImportedOrdersReadonlyListResponse['boundaries'];
};

function normalizeLimit(value: unknown): number {
  const parsed = Number(String(value ?? '').trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return 20;
  return Math.min(Math.floor(parsed), 100);
}

function normalizeString(value: unknown): string | undefined {
  const normalized = String(value ?? '').trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeJsonObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function toIsoString(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return new Date(0).toISOString();
}

function toNullableIsoString(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return null;
}

function mapImportJobRecord(record: Record<string, unknown>): AmazonImportedOrdersReadModelTestDoubleImportJob {
  return {
    id: String(record.id ?? ''),
    companyId: String(record.companyId ?? ''),
    domain: String(record.domain ?? 'income'),
    module: record.module === null || record.module === undefined ? null : String(record.module),
    sourceType: record.sourceType === null || record.sourceType === undefined ? null : String(record.sourceType),
    status: String(record.status ?? 'read-model-pending'),
    importedAt: toNullableIsoString(record.importedAt),
    createdAt: toIsoString(record.createdAt),
  };
}

function mapStagingRowRecord(record: Record<string, unknown>): AmazonImportedOrdersTestDoubleStagingRow {
  return {
    id: String(record.id ?? ''),
    companyId: String(record.companyId ?? ''),
    importJobId: String(record.importJobId ?? ''),
    module: String(record.module ?? 'store-orders'),
    rowNo: Number(record.rowNo ?? 0),
    businessMonth: record.businessMonth === null || record.businessMonth === undefined ? null : String(record.businessMonth),
    rawPayloadJson: normalizeJsonObject(record.rawPayloadJson),
    normalizedPayloadJson: normalizeJsonObject(record.normalizedPayloadJson),
    matchStatus: String(record.matchStatus ?? 'read-model-pending'),
    matchReason: record.matchReason === null || record.matchReason === undefined ? null : String(record.matchReason),
    targetEntityType: record.targetEntityType === null || record.targetEntityType === undefined ? null : String(record.targetEntityType),
    targetEntityId: record.targetEntityId === null || record.targetEntityId === undefined ? null : String(record.targetEntityId),
    createdAt: toIsoString(record.createdAt),
  };
}

function buildReadonlyBoundaries(): AmazonImportedOrdersReadonlyListResponse['boundaries'] {
  return {
    readsExistingImportJob: true,
    readsExistingImportStagingRow: true,
    callsAmazon: false,
    queriesPrisma: true,
    createsImportJob: false,
    createsSyncJob: false,
    createsSyncSegment: false,
    writesDatabase: false,
    writesTransaction: false,
    writesInventoryMovement: false,
    opensControllerRuntime: true,
  };
}

export async function listAmazonImportedOrdersReadonly(input: {
  prisma: AmazonImportedOrdersReadonlyPrisma;
  companyId: string;
  query: AmazonImportedOrdersReadonlyQuery;
}): Promise<AmazonImportedOrdersReadonlyListResponse> {
  const companyId = input.companyId.trim();
  if (!companyId) {
    throw new Error('Step150-LM readonly read-model requires companyId.');
  }

  const limit = normalizeLimit(input.query.limit);
  const importJobRecords = await input.prisma.importJob.findMany({
    where: {
      companyId,
      domain: 'income',
      module: 'store-orders',
      sourceType: 'amazon-sp-api-orders',
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
    select: {
      id: true,
      companyId: true,
      domain: true,
      module: true,
      sourceType: true,
      status: true,
      importedAt: true,
      createdAt: true,
    },
  });

  const importJobs = importJobRecords.map(mapImportJobRecord);
  const importJobIds = importJobs.map((job) => job.id).filter(Boolean);

  const stagingRowRecords = importJobIds.length > 0
    ? await input.prisma.importStagingRow.findMany({
        where: {
          companyId,
          module: 'store-orders',
          importJobId: {
            in: importJobIds,
          },
        },
        orderBy: [
          { createdAt: 'desc' },
          { rowNo: 'asc' },
        ],
        take: Math.max(limit * 20, 200),
        select: {
          id: true,
          companyId: true,
          importJobId: true,
          module: true,
          rowNo: true,
          businessMonth: true,
          rawPayloadJson: true,
          normalizedPayloadJson: true,
          matchStatus: true,
          matchReason: true,
          targetEntityType: true,
          targetEntityId: true,
          createdAt: true,
        },
      })
    : [];

  const mapped = mapAmazonImportedOrdersTestDoubleList({
    companyId,
    importJobs,
    stagingRows: stagingRowRecords.map(mapStagingRowRecord),
    filters: {
      companyId,
      orderId: normalizeString(input.query.orderId),
      status: normalizeString(input.query.status),
      content: normalizeString(input.query.content),
      limit,
    },
  });

  return {
    ...mapped,
    source: 'amazon-imported-orders-read-model',
    routeImplementedNow: true,
    readModelMode: 'guarded-readonly-existing-importjob-stagingrow',
    companyScoped: true,
    pagination: {
      nextCursor: null,
      hasMore: false,
      limit,
    },
    boundaries: buildReadonlyBoundaries(),
  };
}

export async function getAmazonImportedOrderDetailReadonly(input: {
  prisma: AmazonImportedOrdersReadonlyPrisma;
  companyId: string;
  orderId: string;
}): Promise<AmazonImportedOrderReadonlyDetailResponse> {
  const companyId = input.companyId.trim();
  if (!companyId) {
    throw new Error('Step150-LM readonly detail read-model requires companyId.');
  }

  const importJobRecords = await input.prisma.importJob.findMany({
    where: {
      companyId,
      domain: 'income',
      module: 'store-orders',
      sourceType: 'amazon-sp-api-orders',
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
    select: {
      id: true,
      companyId: true,
      domain: true,
      module: true,
      sourceType: true,
      status: true,
      importedAt: true,
      createdAt: true,
    },
  });

  const importJobs = importJobRecords.map(mapImportJobRecord);
  const importJobIds = importJobs.map((job) => job.id).filter(Boolean);

  const stagingRowRecords = importJobIds.length > 0
    ? await input.prisma.importStagingRow.findMany({
        where: {
          companyId,
          module: 'store-orders',
          importJobId: {
            in: importJobIds,
          },
        },
        orderBy: [
          { createdAt: 'desc' },
          { rowNo: 'asc' },
        ],
        take: 1000,
        select: {
          id: true,
          companyId: true,
          importJobId: true,
          module: true,
          rowNo: true,
          businessMonth: true,
          rawPayloadJson: true,
          normalizedPayloadJson: true,
          matchStatus: true,
          matchReason: true,
          targetEntityType: true,
          targetEntityId: true,
          createdAt: true,
        },
      })
    : [];

  const mapped = mapAmazonImportedOrderDetailTestDouble({
    companyId,
    orderId: input.orderId,
    importJobs,
    stagingRows: stagingRowRecords.map(mapStagingRowRecord),
  });

  return {
    ...mapped,
    source: 'amazon-imported-order-detail-read-model',
    routeImplementedNow: true,
    readModelMode: 'guarded-readonly-existing-importjob-stagingrow',
    companyScoped: true,
    boundaries: buildReadonlyBoundaries(),
  };
}

export const AMAZON_IMPORTED_ORDERS_READ_MODEL_READONLY_SERVICE_STATUS = {
  step: 'Step150-LM',
  guardedReadonlyActivation: true,
  queriesPrisma: true,
  callsAmazon: false,
  createsImportJob: false,
  createsSyncJob: false,
  createsSyncSegment: false,
  writesDatabase: false,
  writesTransaction: false,
  writesInventoryMovement: false,
  frontendWiredNow: false,
} as const;
