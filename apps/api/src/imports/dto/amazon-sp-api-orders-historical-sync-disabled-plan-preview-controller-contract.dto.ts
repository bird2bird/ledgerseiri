import type {
  AmazonSpApiOrdersHistoricalSyncPlanResult,
} from './amazon-sp-api-orders-historical-sync-worker-disabled-contract.dto';

export type AmazonSpApiOrdersHistoricalSyncDisabledPlanPreviewRouteBody = {
  readonly storeId?: string;
  readonly marketplaceId?: string;
  readonly region?: string;
  readonly syncStartDate?: string;
  readonly syncEndDate?: string;
  readonly segmentDays?: number;
};

export type AmazonSpApiOrdersHistoricalSyncDisabledPlanPreviewControllerContract = {
  readonly step: 'Step149-M';
  readonly source: 'amazon-sp-api-orders-historical-sync';
  readonly route: 'POST /api/imports/amazon-sp-api/orders/historical-sync/plan-preview';
  readonly guardedBy: 'JwtAuthGuard';
  readonly controllerMode: 'disabled-planning-preview-only';
  readonly callsDisabledWorkerPlan: true;
  readonly callsRunHistoricalSync: false;
  readonly callsRunSegment: false;
  readonly callsAmazon: false;
  readonly writesDatabase: false;
  readonly writesSyncJob: false;
  readonly writesSyncSegment: false;
  readonly writesImportJob: false;
  readonly writesImportStagingRow: false;
  readonly writesTransaction: false;
  readonly writesInventoryMovement: false;
  readonly startsScheduler: false;
  readonly startsQueue: false;
  readonly frontendWiredNow: false;
};

export type AmazonSpApiOrdersHistoricalSyncDisabledPlanPreviewRouteResponse = {
  readonly source: 'amazon-sp-api-orders-historical-sync-disabled-plan-preview';
  readonly routeImplementedNow: true;
  readonly controllerRoute: 'POST /api/imports/amazon-sp-api/orders/historical-sync/plan-preview';
  readonly guardedBy: 'JwtAuthGuard';
  readonly companyScoped: true;
  readonly companyIdPresent: true;
  readonly storeId: string;
  readonly marketplaceId: string;
  readonly region: string;
  readonly syncStartDate: string;
  readonly syncEndDate: string;
  readonly segmentDays: number | null;
  readonly accepted: false;
  readonly disabled: true;
  readonly plan: AmazonSpApiOrdersHistoricalSyncPlanResult;
  readonly boundaries: {
    readonly callsDisabledWorkerPlan: true;
    readonly callsRunHistoricalSync: false;
    readonly callsRunSegment: false;
    readonly callsAmazon: false;
    readonly writesDatabase: false;
    readonly writesSyncJob: false;
    readonly writesSyncSegment: false;
    readonly writesImportJob: false;
    readonly writesImportStagingRow: false;
    readonly writesTransaction: false;
    readonly writesInventoryMovement: false;
    readonly startsScheduler: false;
    readonly startsQueue: false;
    readonly frontendWiredNow: false;
  };
};

export function buildAmazonSpApiOrdersHistoricalSyncDisabledPlanPreviewControllerContract(): AmazonSpApiOrdersHistoricalSyncDisabledPlanPreviewControllerContract {
  return {
    step: 'Step149-M',
    source: 'amazon-sp-api-orders-historical-sync',
    route: 'POST /api/imports/amazon-sp-api/orders/historical-sync/plan-preview',
    guardedBy: 'JwtAuthGuard',
    controllerMode: 'disabled-planning-preview-only',
    callsDisabledWorkerPlan: true,
    callsRunHistoricalSync: false,
    callsRunSegment: false,
    callsAmazon: false,
    writesDatabase: false,
    writesSyncJob: false,
    writesSyncSegment: false,
    writesImportJob: false,
    writesImportStagingRow: false,
    writesTransaction: false,
    writesInventoryMovement: false,
    startsScheduler: false,
    startsQueue: false,
    frontendWiredNow: false,
  };
}

export function assertAmazonSpApiOrdersHistoricalSyncDisabledPlanPreviewControllerContract(
  contract: AmazonSpApiOrdersHistoricalSyncDisabledPlanPreviewControllerContract,
): AmazonSpApiOrdersHistoricalSyncDisabledPlanPreviewControllerContract {
  if (contract.step !== 'Step149-M') {
    throw new Error('STEP149_M_INVALID_STEP');
  }

  if (contract.controllerMode !== 'disabled-planning-preview-only') {
    throw new Error('STEP149_M_CONTROLLER_MODE_MUST_BE_DISABLED_PREVIEW_ONLY');
  }

  if (!contract.callsDisabledWorkerPlan) {
    throw new Error('STEP149_M_MUST_CALL_DISABLED_WORKER_PLAN');
  }

  if (
    contract.callsRunHistoricalSync ||
    contract.callsRunSegment ||
    contract.callsAmazon ||
    contract.writesDatabase ||
    contract.writesSyncJob ||
    contract.writesSyncSegment ||
    contract.writesImportJob ||
    contract.writesImportStagingRow ||
    contract.writesTransaction ||
    contract.writesInventoryMovement ||
    contract.startsScheduler ||
    contract.startsQueue ||
    contract.frontendWiredNow
  ) {
    throw new Error('STEP149_M_BOUNDARIES_MUST_REMAIN_DISABLED');
  }

  return contract;
}

export const AMAZON_SP_API_ORDERS_HISTORICAL_SYNC_DISABLED_PLAN_PREVIEW_CONTROLLER_CONTRACT =
  assertAmazonSpApiOrdersHistoricalSyncDisabledPlanPreviewControllerContract(
    buildAmazonSpApiOrdersHistoricalSyncDisabledPlanPreviewControllerContract(),
  );
