export type AmazonSpApiOrdersHistoricalSyncWindowPlannerMode =
  | 'pure_contract'
  | 'worker_planning'
  | 'runtime_planning';

export type AmazonSpApiOrdersHistoricalSyncPaginationCursorStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'PAGE_LIMIT_REACHED'
  | 'SEGMENT_COMPLETED';

export type AmazonSpApiOrdersHistoricalSyncDateRangeInput = {
  readonly syncStartDate: string;
  readonly syncEndDate: string;
  readonly segmentDays?: number;
  readonly maxSegmentDays?: number;
};

export type AmazonSpApiOrdersHistoricalSyncNormalizedDateRange = {
  readonly syncStartDateIso: string;
  readonly syncEndDateIso: string;
  readonly segmentDays: number;
  readonly maxSegmentDays: number;
  readonly totalDaysInclusive: number;
};

export type AmazonSpApiOrdersHistoricalSyncWindowSegment = {
  readonly segmentIndex: number;
  readonly createdAfter: string;
  readonly createdBefore: string;
  readonly segmentDaysInclusive: number;
};

export type AmazonSpApiOrdersHistoricalSyncWindowPlan = {
  readonly step: 'Step149-K';
  readonly source: 'amazon-sp-api-orders-historical-sync';
  readonly plannerMode: AmazonSpApiOrdersHistoricalSyncWindowPlannerMode;
  readonly accepted: true;
  readonly callsAmazon: false;
  readonly writesDatabase: false;
  readonly normalizedRange: AmazonSpApiOrdersHistoricalSyncNormalizedDateRange;
  readonly segments: readonly AmazonSpApiOrdersHistoricalSyncWindowSegment[];
  readonly paginationPolicy: AmazonSpApiOrdersHistoricalSyncPaginationPolicy;
};

export type AmazonSpApiOrdersHistoricalSyncPaginationPolicy = {
  readonly maxPagesPerSegment: number;
  readonly startsWithNextToken: null;
  readonly nextTokenRequiredForFollowupPage: true;
  readonly stopWhenNextTokenMissing: true;
  readonly stopWhenPageLimitReached: true;
};

export type AmazonSpApiOrdersHistoricalSyncPaginationCursor = {
  readonly segmentIndex: number;
  readonly status: AmazonSpApiOrdersHistoricalSyncPaginationCursorStatus;
  readonly pageNumber: number;
  readonly maxPagesPerSegment: number;
  readonly nextToken: string | null;
  readonly lastFetchedAt: string | null;
  readonly canFetchNextPage: boolean;
};

export type AmazonSpApiOrdersHistoricalSyncWindowPlannerContract = {
  readonly step: 'Step149-K';
  readonly source: 'amazon-sp-api-orders-historical-sync';
  readonly plannerMode: 'pure_contract';
  readonly defaultSegmentDays: 7;
  readonly maxSegmentDays: 31;
  readonly defaultMaxPagesPerSegment: 50;
  readonly callsAmazon: false;
  readonly writesDatabase: false;
  readonly callsRepository: false;
  readonly noControllerWiringNow: true;
  readonly noWorkerRuntimeWiringNow: true;
  readonly noSchedulerNow: true;
  readonly exposedFunctions: readonly [
    'normalizeHistoricalSyncDateRange',
    'planAmazonOrdersHistoricalSyncWindows',
    'buildInitialPaginationCursor',
    'advancePaginationCursor',
  ];
};

export function buildAmazonSpApiOrdersHistoricalSyncWindowPlannerContract(): AmazonSpApiOrdersHistoricalSyncWindowPlannerContract {
  return {
    step: 'Step149-K',
    source: 'amazon-sp-api-orders-historical-sync',
    plannerMode: 'pure_contract',
    defaultSegmentDays: 7,
    maxSegmentDays: 31,
    defaultMaxPagesPerSegment: 50,
    callsAmazon: false,
    writesDatabase: false,
    callsRepository: false,
    noControllerWiringNow: true,
    noWorkerRuntimeWiringNow: true,
    noSchedulerNow: true,
    exposedFunctions: [
      'normalizeHistoricalSyncDateRange',
      'planAmazonOrdersHistoricalSyncWindows',
      'buildInitialPaginationCursor',
      'advancePaginationCursor',
    ],
  };
}

export function assertAmazonSpApiOrdersHistoricalSyncWindowPlannerContract(
  contract: AmazonSpApiOrdersHistoricalSyncWindowPlannerContract,
): AmazonSpApiOrdersHistoricalSyncWindowPlannerContract {
  if (contract.step !== 'Step149-K') {
    throw new Error('STEP149_K_INVALID_STEP');
  }

  if (contract.plannerMode !== 'pure_contract') {
    throw new Error('STEP149_K_PLANNER_MUST_BE_PURE_CONTRACT');
  }

  if (contract.defaultSegmentDays !== 7) {
    throw new Error('STEP149_K_DEFAULT_SEGMENT_DAYS_MUST_BE_7');
  }

  if (contract.maxSegmentDays !== 31) {
    throw new Error('STEP149_K_MAX_SEGMENT_DAYS_MUST_BE_31');
  }

  if (contract.defaultMaxPagesPerSegment !== 50) {
    throw new Error('STEP149_K_DEFAULT_MAX_PAGES_MUST_BE_50');
  }

  if (contract.callsAmazon || contract.writesDatabase || contract.callsRepository) {
    throw new Error('STEP149_K_PLANNER_MUST_HAVE_NO_SIDE_EFFECTS');
  }

  if (!contract.noControllerWiringNow || !contract.noWorkerRuntimeWiringNow || !contract.noSchedulerNow) {
    throw new Error('STEP149_K_RUNTIME_WIRING_FORBIDDEN_NOW');
  }

  for (const required of [
    'normalizeHistoricalSyncDateRange',
    'planAmazonOrdersHistoricalSyncWindows',
    'buildInitialPaginationCursor',
    'advancePaginationCursor',
  ] as const) {
    if (!contract.exposedFunctions.includes(required)) {
      throw new Error(`STEP149_K_REQUIRED_FUNCTION_MISSING: ${required}`);
    }
  }

  return contract;
}

export const AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_WINDOW_PLANNER_CONTRACT =
  assertAmazonSpApiOrdersHistoricalSyncWindowPlannerContract(
    buildAmazonSpApiOrdersHistoricalSyncWindowPlannerContract(),
  );
