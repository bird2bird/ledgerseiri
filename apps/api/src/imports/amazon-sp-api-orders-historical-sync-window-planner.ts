import {
  AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_WINDOW_PLANNER_CONTRACT,
  type AmazonSpApiOrdersHistoricalSyncDateRangeInput,
  type AmazonSpApiOrdersHistoricalSyncNormalizedDateRange,
  type AmazonSpApiOrdersHistoricalSyncPaginationCursor,
  type AmazonSpApiOrdersHistoricalSyncPaginationPolicy,
  type AmazonSpApiOrdersHistoricalSyncWindowPlan,
  type AmazonSpApiOrdersHistoricalSyncWindowSegment,
} from './dto/amazon-sp-api-orders-historical-sync-window-planner-contract.dto';

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDateOnlyToUtcStart(value: string, errorCode: string): Date {
  const normalized = String(value || '').trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error(errorCode);
  }

  const date = new Date(`${normalized}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(errorCode);
  }

  if (date.toISOString().slice(0, 10) !== normalized) {
    throw new Error(errorCode);
  }

  return date;
}

function toIsoStart(date: Date): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0)).toISOString();
}

function toIsoEnd(date: Date): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999)).toISOString();
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function inclusiveDayCount(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
}

export function normalizeHistoricalSyncDateRange(
  input: AmazonSpApiOrdersHistoricalSyncDateRangeInput,
): AmazonSpApiOrdersHistoricalSyncNormalizedDateRange {
  const contract = AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_WINDOW_PLANNER_CONTRACT;

  const start = parseDateOnlyToUtcStart(
    input.syncStartDate,
    'STEP149_K_INVALID_SYNC_START_DATE',
  );
  const end = parseDateOnlyToUtcStart(
    input.syncEndDate,
    'STEP149_K_INVALID_SYNC_END_DATE',
  );

  if (end.getTime() < start.getTime()) {
    throw new Error('STEP149_K_SYNC_END_BEFORE_START');
  }

  const maxSegmentDays = input.maxSegmentDays ?? contract.maxSegmentDays;

  if (!Number.isInteger(maxSegmentDays) || maxSegmentDays < 1 || maxSegmentDays > contract.maxSegmentDays) {
    throw new Error('STEP149_K_INVALID_MAX_SEGMENT_DAYS');
  }

  const segmentDays = input.segmentDays ?? contract.defaultSegmentDays;

  if (!Number.isInteger(segmentDays) || segmentDays < 1 || segmentDays > maxSegmentDays) {
    throw new Error('STEP149_K_INVALID_SEGMENT_DAYS');
  }

  return {
    syncStartDateIso: toIsoStart(start),
    syncEndDateIso: toIsoEnd(end),
    segmentDays,
    maxSegmentDays,
    totalDaysInclusive: inclusiveDayCount(start, end),
  };
}

export function planAmazonOrdersHistoricalSyncWindows(
  input: AmazonSpApiOrdersHistoricalSyncDateRangeInput & {
    readonly maxPagesPerSegment?: number;
  },
): AmazonSpApiOrdersHistoricalSyncWindowPlan {
  const contract = AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_WINDOW_PLANNER_CONTRACT;
  const normalizedRange = normalizeHistoricalSyncDateRange(input);

  const maxPagesPerSegment = input.maxPagesPerSegment ?? contract.defaultMaxPagesPerSegment;

  if (!Number.isInteger(maxPagesPerSegment) || maxPagesPerSegment < 1 || maxPagesPerSegment > contract.defaultMaxPagesPerSegment) {
    throw new Error('STEP149_K_INVALID_MAX_PAGES_PER_SEGMENT');
  }

  const start = new Date(normalizedRange.syncStartDateIso);
  const end = new Date(normalizedRange.syncEndDateIso.slice(0, 10) + 'T00:00:00.000Z');

  const segments: AmazonSpApiOrdersHistoricalSyncWindowSegment[] = [];
  let cursor = start;
  let segmentIndex = 0;

  while (cursor.getTime() <= end.getTime()) {
    const segmentEndCandidate = addUtcDays(cursor, normalizedRange.segmentDays - 1);
    const segmentEnd = segmentEndCandidate.getTime() > end.getTime() ? end : segmentEndCandidate;

    segments.push({
      segmentIndex,
      createdAfter: toIsoStart(cursor),
      createdBefore: toIsoEnd(segmentEnd),
      segmentDaysInclusive: inclusiveDayCount(cursor, segmentEnd),
    });

    cursor = addUtcDays(segmentEnd, 1);
    segmentIndex += 1;
  }

  const paginationPolicy: AmazonSpApiOrdersHistoricalSyncPaginationPolicy = {
    maxPagesPerSegment,
    startsWithNextToken: null,
    nextTokenRequiredForFollowupPage: true,
    stopWhenNextTokenMissing: true,
    stopWhenPageLimitReached: true,
  };

  return {
    step: 'Step149-K',
    source: 'amazon-sp-api-orders-historical-sync',
    plannerMode: 'pure_contract',
    accepted: true,
    callsAmazon: false,
    writesDatabase: false,
    normalizedRange,
    segments,
    paginationPolicy,
  };
}

export function buildInitialPaginationCursor(args: {
  readonly segmentIndex: number;
  readonly maxPagesPerSegment?: number;
}): AmazonSpApiOrdersHistoricalSyncPaginationCursor {
  const contract = AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_WINDOW_PLANNER_CONTRACT;
  const maxPagesPerSegment = args.maxPagesPerSegment ?? contract.defaultMaxPagesPerSegment;

  if (!Number.isInteger(args.segmentIndex) || args.segmentIndex < 0) {
    throw new Error('STEP149_K_INVALID_SEGMENT_INDEX');
  }

  if (!Number.isInteger(maxPagesPerSegment) || maxPagesPerSegment < 1 || maxPagesPerSegment > contract.defaultMaxPagesPerSegment) {
    throw new Error('STEP149_K_INVALID_MAX_PAGES_PER_SEGMENT');
  }

  return {
    segmentIndex: args.segmentIndex,
    status: 'NOT_STARTED',
    pageNumber: 0,
    maxPagesPerSegment,
    nextToken: null,
    lastFetchedAt: null,
    canFetchNextPage: true,
  };
}

export function advancePaginationCursor(
  cursor: AmazonSpApiOrdersHistoricalSyncPaginationCursor,
  args: {
    readonly returnedNextToken?: string | null;
    readonly fetchedAtIso: string;
  },
): AmazonSpApiOrdersHistoricalSyncPaginationCursor {
  if (!Number.isInteger(cursor.pageNumber) || cursor.pageNumber < 0) {
    throw new Error('STEP149_K_INVALID_CURSOR_PAGE_NUMBER');
  }

  if (!Number.isInteger(cursor.maxPagesPerSegment) || cursor.maxPagesPerSegment < 1) {
    throw new Error('STEP149_K_INVALID_CURSOR_MAX_PAGES');
  }

  if (!args.fetchedAtIso || Number.isNaN(new Date(args.fetchedAtIso).getTime())) {
    throw new Error('STEP149_K_INVALID_FETCHED_AT');
  }

  if (cursor.status === 'PAGE_LIMIT_REACHED' || cursor.status === 'SEGMENT_COMPLETED') {
    return {
      ...cursor,
      canFetchNextPage: false,
    };
  }

  const nextPageNumber = cursor.pageNumber + 1;
  const normalizedNextToken = args.returnedNextToken ? String(args.returnedNextToken).trim() : null;

  if (nextPageNumber >= cursor.maxPagesPerSegment && normalizedNextToken) {
    return {
      ...cursor,
      status: 'PAGE_LIMIT_REACHED',
      pageNumber: nextPageNumber,
      nextToken: normalizedNextToken,
      lastFetchedAt: args.fetchedAtIso,
      canFetchNextPage: false,
    };
  }

  if (!normalizedNextToken) {
    return {
      ...cursor,
      status: 'SEGMENT_COMPLETED',
      pageNumber: nextPageNumber,
      nextToken: null,
      lastFetchedAt: args.fetchedAtIso,
      canFetchNextPage: false,
    };
  }

  return {
    ...cursor,
    status: 'IN_PROGRESS',
    pageNumber: nextPageNumber,
    nextToken: normalizedNextToken,
    lastFetchedAt: args.fetchedAtIso,
    canFetchNextPage: true,
  };
}
