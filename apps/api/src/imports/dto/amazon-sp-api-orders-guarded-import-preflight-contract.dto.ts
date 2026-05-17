export type AmazonSpApiOrdersGuardedImportPreflightRouteBody = {
  storeId?: string;
  marketplaceId?: string;
  region?: string;
  createdAfter?: string;
  createdBefore?: string;
  rangePreset?: '7D' | '30D' | '90D' | '365D' | 'CUSTOM' | string;
  explicitOperatorIntent?: boolean;
};

export type AmazonSpApiOrdersGuardedImportPreflightBlockReason =
  | 'COMPANY_REQUIRED'
  | 'STORE_ID_REQUIRED'
  | 'MARKETPLACE_ID_REQUIRED'
  | 'REGION_REQUIRED'
  | 'DATE_RANGE_REQUIRED'
  | 'DATE_RANGE_INVALID'
  | 'DATE_RANGE_TOO_LONG'
  | 'CONNECTION_NOT_CONNECTED'
  | 'CONNECTION_RECONNECT_REQUIRED'
  | 'CONNECTION_ACCESS_TOKEN_EXPIRED'
  | 'EXPLICIT_OPERATOR_INTENT_REQUIRED';

export type AmazonSpApiOrdersGuardedImportPreflightNextAction =
  | 'CONNECT_AMAZON'
  | 'FIX_SCOPE'
  | 'FIX_DATE_RANGE'
  | 'CONFIRM_OPERATOR_INTENT'
  | 'READY_FOR_PREVIEW';

export type AmazonSpApiOrdersGuardedImportPreflightResponse = {
  source: 'amazon-sp-api-orders-guarded-import-preflight';
  step: 'Step151-C';
  routeImplementedNow: true;
  controllerRoute: 'POST /api/imports/amazon-sp-api/orders/guarded-import/preflight';
  guardedBy: 'JwtAuthGuard';
  companyScoped: true;
  allowed: boolean;
  blocked: boolean;
  reasons: AmazonSpApiOrdersGuardedImportPreflightBlockReason[];
  nextAction: AmazonSpApiOrdersGuardedImportPreflightNextAction;
  scope: {
    companyIdPresent: true;
    storeId: string;
    marketplaceId: string;
    region: string;
  };
  dateRange: {
    createdAfter: string | null;
    createdBefore: string | null;
    rangePreset: string | null;
    locked: boolean;
    days: number | null;
    maxAllowedDays: 365;
  };
  connectionReadiness: {
    checked: true;
    connected: boolean;
    needsReconnect: boolean;
    credentialPresent: boolean;
    accessTokenCachePresent: boolean;
    accessTokenExpired: boolean;
    status: string;
    readModelStatus: string;
  };
  confirmation: {
    explicitOperatorIntent: boolean;
    requiredForPreview: true;
    requiredForImportJobCreation: true;
  };
  boundaries: {
    callsAmazon: false;
    callsRealPreview: false;
    callsRealImportJob: false;
    callsHistoricalSync: false;
    queriesConnectionStatus: true;
    createsImportJob: false;
    createsImportStagingRow: false;
    createsSyncJob: false;
    createsSyncSegment: false;
    writesDatabase: false;
    writesTransaction: false;
    writesInventoryMovement: false;
    returnsRawAccessToken: false;
    returnsRawRefreshToken: false;
    returnsRawSecret: false;
  };
};

export function normalizeAmazonSpApiOrdersGuardedImportPreflightRegion(value: unknown): string {
  const normalized = String(value || 'JP').trim().toUpperCase();

  if (normalized === 'JP' || normalized === 'FE' || normalized === 'NA' || normalized === 'EU') {
    return normalized;
  }

  return normalized;
}

export function calculateAmazonSpApiOrdersGuardedImportPreflightDays(input: {
  createdAfter: string | null;
  createdBefore: string | null;
}): number | null {
  if (!input.createdAfter || !input.createdBefore) return null;

  const after = new Date(input.createdAfter);
  const before = new Date(input.createdBefore);

  if (Number.isNaN(after.getTime()) || Number.isNaN(before.getTime())) return null;

  const diffMs = before.getTime() - after.getTime();
  if (diffMs < 0) return null;

  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

export function buildAmazonSpApiOrdersGuardedImportPreflightBoundaries(): AmazonSpApiOrdersGuardedImportPreflightResponse['boundaries'] {
  return {
    callsAmazon: false,
    callsRealPreview: false,
    callsRealImportJob: false,
    callsHistoricalSync: false,
    queriesConnectionStatus: true,
    createsImportJob: false,
    createsImportStagingRow: false,
    createsSyncJob: false,
    createsSyncSegment: false,
    writesDatabase: false,
    writesTransaction: false,
    writesInventoryMovement: false,
    returnsRawAccessToken: false,
    returnsRawRefreshToken: false,
    returnsRawSecret: false,
  };
}

export function buildAmazonSpApiOrdersGuardedImportPreflightResponse(input: {
  storeId: string;
  marketplaceId: string;
  region: string;
  createdAfter: string | null;
  createdBefore: string | null;
  rangePreset: string | null;
  explicitOperatorIntent: boolean;
  connection: {
    connected: boolean;
    needsReconnect: boolean;
    credentialPresent: boolean;
    accessTokenCachePresent: boolean;
    accessTokenExpired: boolean;
    status: string;
    readModelStatus: string;
  };
  reasons: AmazonSpApiOrdersGuardedImportPreflightBlockReason[];
}): AmazonSpApiOrdersGuardedImportPreflightResponse {
  const boundaries = buildAmazonSpApiOrdersGuardedImportPreflightBoundaries();
  const days = calculateAmazonSpApiOrdersGuardedImportPreflightDays({
    createdAfter: input.createdAfter,
    createdBefore: input.createdBefore,
  });

  const dateRangeLocked = Boolean(input.createdAfter && input.createdBefore && days !== null);
  const reasons = [...input.reasons];

  if (!input.explicitOperatorIntent) {
    reasons.push('EXPLICIT_OPERATOR_INTENT_REQUIRED');
  }

  const blocked = reasons.length > 0;
  const nextAction: AmazonSpApiOrdersGuardedImportPreflightNextAction =
    reasons.some((reason) => reason === 'CONNECTION_NOT_CONNECTED' || reason === 'CONNECTION_RECONNECT_REQUIRED' || reason === 'CONNECTION_ACCESS_TOKEN_EXPIRED')
      ? 'CONNECT_AMAZON'
      : reasons.some((reason) => reason === 'STORE_ID_REQUIRED' || reason === 'MARKETPLACE_ID_REQUIRED' || reason === 'REGION_REQUIRED')
        ? 'FIX_SCOPE'
        : reasons.some((reason) => reason === 'DATE_RANGE_REQUIRED' || reason === 'DATE_RANGE_INVALID' || reason === 'DATE_RANGE_TOO_LONG')
          ? 'FIX_DATE_RANGE'
          : reasons.includes('EXPLICIT_OPERATOR_INTENT_REQUIRED')
            ? 'CONFIRM_OPERATOR_INTENT'
            : 'READY_FOR_PREVIEW';

  return {
    source: 'amazon-sp-api-orders-guarded-import-preflight',
    step: 'Step151-C',
    routeImplementedNow: true,
    controllerRoute: 'POST /api/imports/amazon-sp-api/orders/guarded-import/preflight',
    guardedBy: 'JwtAuthGuard',
    companyScoped: true,
    allowed: !blocked,
    blocked,
    reasons,
    nextAction,
    scope: {
      companyIdPresent: true,
      storeId: input.storeId,
      marketplaceId: input.marketplaceId,
      region: input.region,
    },
    dateRange: {
      createdAfter: input.createdAfter,
      createdBefore: input.createdBefore,
      rangePreset: input.rangePreset,
      locked: dateRangeLocked,
      days,
      maxAllowedDays: 365,
    },
    connectionReadiness: {
      checked: true,
      connected: input.connection.connected,
      needsReconnect: input.connection.needsReconnect,
      credentialPresent: input.connection.credentialPresent,
      accessTokenCachePresent: input.connection.accessTokenCachePresent,
      accessTokenExpired: input.connection.accessTokenExpired,
      status: input.connection.status,
      readModelStatus: input.connection.readModelStatus,
    },
    confirmation: {
      explicitOperatorIntent: input.explicitOperatorIntent,
      requiredForPreview: true,
      requiredForImportJobCreation: true,
    },
    boundaries,
  };
}

export function assertAmazonSpApiOrdersGuardedImportPreflightNoExecutionBoundaries(
  response: AmazonSpApiOrdersGuardedImportPreflightResponse,
): true {
  const boundaries = response.boundaries;

  if (boundaries.callsAmazon !== false) throw new Error('Step151-C boundary violation: callsAmazon must remain false.');
  if (boundaries.callsRealPreview !== false) throw new Error('Step151-C boundary violation: callsRealPreview must remain false.');
  if (boundaries.callsRealImportJob !== false) throw new Error('Step151-C boundary violation: callsRealImportJob must remain false.');
  if (boundaries.callsHistoricalSync !== false) throw new Error('Step151-C boundary violation: callsHistoricalSync must remain false.');
  if (boundaries.createsImportJob !== false || boundaries.createsImportStagingRow !== false) {
    throw new Error('Step151-C boundary violation: ImportJob/StagingRow creation must remain false.');
  }
  if (boundaries.createsSyncJob !== false || boundaries.createsSyncSegment !== false) {
    throw new Error('Step151-C boundary violation: SyncJob/SyncSegment creation must remain false.');
  }
  if (boundaries.writesDatabase !== false || boundaries.writesTransaction !== false || boundaries.writesInventoryMovement !== false) {
    throw new Error('Step151-C boundary violation: write boundaries must remain false.');
  }
  if (boundaries.returnsRawAccessToken !== false || boundaries.returnsRawRefreshToken !== false || boundaries.returnsRawSecret !== false) {
    throw new Error('Step151-C boundary violation: raw token/secret return boundaries must remain false.');
  }

  return true as const;
}
