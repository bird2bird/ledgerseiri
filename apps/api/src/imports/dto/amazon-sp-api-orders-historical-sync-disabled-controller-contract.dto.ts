export type AmazonSpApiOrdersHistoricalSyncDisabledControllerRequestSummary = {
  readonly storeId: string | null;
  readonly marketplaceId: string | null;
  readonly region: string | null;
  readonly syncStartDate: string | null;
  readonly syncEndDate: string | null;
  readonly requestContainsRawTokenLikeField: false;
};

export type AmazonSpApiOrdersHistoricalSyncDisabledControllerResponse = {
  readonly step: 'Step149-C';
  readonly source: 'amazon-sp-api-orders-historical-sync';
  readonly controllerRoute: 'POST /api/imports/amazon-sp-api/orders/historical-sync';
  readonly accepted: false;
  readonly disabled: true;
  readonly executionMode: 'controller_disabled';
  readonly reason: 'STEP149_C_HISTORICAL_SYNC_CONTROLLER_DISABLED';
  readonly message: 'Amazon Orders historical sync controller route is intentionally disabled in Step149-C.';
  readonly companyIdPresent: boolean;
  readonly requestedByPresent: boolean;
  readonly requestSummary: AmazonSpApiOrdersHistoricalSyncDisabledControllerRequestSummary;
  readonly boundaries: {
    readonly callsAmazon: false;
    readonly writesImportJob: false;
    readonly writesImportStagingRows: false;
    readonly writesTransaction: false;
    readonly writesInventoryMovement: false;
    readonly updatesInventoryBalance: false;
    readonly startsBackgroundWorker: false;
    readonly exposesRawTokens: false;
  };
  readonly nextStepRequired: 'Step149-D: sync job persistence design / schema decision';
};

function readOptionalString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 160) : null;
}

function hasRawTokenLikeField(record: Record<string, unknown>): false {
  const raw = JSON.stringify(record).toLowerCase();
  const forbiddenMarkers = [
    'rawaccesstoken',
    'rawrefreshtoken',
    'access_token',
    'refresh_token',
    'x-amz-access-token',
    'clientsecret',
    'client_secret',
  ];

  if (forbiddenMarkers.some((marker) => raw.includes(marker))) {
    // Step149-C must not echo or accept token-like material.
    // Keep response shape stable and non-revealing.
    return false;
  }

  return false;
}

export function buildAmazonSpApiOrdersHistoricalSyncDisabledControllerResponse(args: {
  companyId?: string | null;
  requestedBy?: string | null;
  body?: Record<string, unknown> | null;
}): AmazonSpApiOrdersHistoricalSyncDisabledControllerResponse {
  const body = args.body || {};

  return {
    step: 'Step149-C',
    source: 'amazon-sp-api-orders-historical-sync',
    controllerRoute: 'POST /api/imports/amazon-sp-api/orders/historical-sync',
    accepted: false,
    disabled: true,
    executionMode: 'controller_disabled',
    reason: 'STEP149_C_HISTORICAL_SYNC_CONTROLLER_DISABLED',
    message: 'Amazon Orders historical sync controller route is intentionally disabled in Step149-C.',
    companyIdPresent: Boolean(args.companyId),
    requestedByPresent: Boolean(args.requestedBy),
    requestSummary: {
      storeId: readOptionalString(body, 'storeId'),
      marketplaceId: readOptionalString(body, 'marketplaceId'),
      region: readOptionalString(body, 'region'),
      syncStartDate: readOptionalString(body, 'syncStartDate'),
      syncEndDate: readOptionalString(body, 'syncEndDate'),
      requestContainsRawTokenLikeField: hasRawTokenLikeField(body),
    },
    boundaries: {
      callsAmazon: false,
      writesImportJob: false,
      writesImportStagingRows: false,
      writesTransaction: false,
      writesInventoryMovement: false,
      updatesInventoryBalance: false,
      startsBackgroundWorker: false,
      exposesRawTokens: false,
    },
    nextStepRequired: 'Step149-D: sync job persistence design / schema decision',
  };
}

export function assertAmazonSpApiOrdersHistoricalSyncDisabledControllerResponse(
  response: AmazonSpApiOrdersHistoricalSyncDisabledControllerResponse,
): AmazonSpApiOrdersHistoricalSyncDisabledControllerResponse {
  if (response.step !== 'Step149-C') {
    throw new Error('STEP149_C_INVALID_STEP');
  }

  if (response.accepted !== false || response.disabled !== true) {
    throw new Error('STEP149_C_ROUTE_MUST_BE_DISABLED');
  }

  if (response.executionMode !== 'controller_disabled') {
    throw new Error('STEP149_C_EXECUTION_MODE_MUST_BE_CONTROLLER_DISABLED');
  }

  if (response.boundaries.callsAmazon) {
    throw new Error('STEP149_C_MUST_NOT_CALL_AMAZON');
  }

  if (response.boundaries.writesImportJob || response.boundaries.writesImportStagingRows) {
    throw new Error('STEP149_C_MUST_NOT_WRITE_IMPORT_DATA');
  }

  if (response.boundaries.writesTransaction) {
    throw new Error('STEP149_C_MUST_NOT_WRITE_TRANSACTION');
  }

  if (response.boundaries.writesInventoryMovement || response.boundaries.updatesInventoryBalance) {
    throw new Error('STEP149_C_MUST_NOT_WRITE_INVENTORY');
  }

  if (response.boundaries.startsBackgroundWorker) {
    throw new Error('STEP149_C_MUST_NOT_START_WORKER');
  }

  if (response.boundaries.exposesRawTokens) {
    throw new Error('STEP149_C_MUST_NOT_EXPOSE_RAW_TOKENS');
  }

  return response;
}
