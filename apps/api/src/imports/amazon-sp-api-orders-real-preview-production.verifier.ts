export type AmazonSpApiOrdersRealPreviewProductionVerificationInput = {
  previewResult: unknown;
  transportMode: string;
  credentialSource: 'env' | 'repository';
  accessTokenRefreshResult?: unknown;
  now?: Date;
};

export type AmazonSpApiOrdersRealPreviewProductionVerificationResult = {
  step: 'Step141-A';
  source: 'amazon-sp-api-orders-real-preview-production-verification';
  accepted: boolean;
  reason:
    | 'ready_for_importjob_persistence'
    | 'mocked_transport_not_production'
    | 'preview_result_missing'
    | 'preview_not_real'
    | 'orders_missing_or_empty'
    | 'items_missing_or_empty'
    | 'repository_refresh_failed'
    | 'amazon_auth_or_permission_risk'
    | 'amazon_throttle_risk'
    | 'amazon_http_or_transport_risk'
    | 'malformed_preview_shape';
  messageRedacted: string;
  transportMode: string;
  credentialSource: 'env' | 'repository';
  previewMode: string | null;
  dryRun: boolean | null;
  orderCount: number;
  orderItemCount: number;
  unresolvedSkuCount: number;
  incomePreviewAmount: number | null;
  accessTokenRefresh: {
    attempted: boolean;
    accepted: boolean | null;
    reason: string | null;
    cacheWriteNow: boolean;
  };
  productionReadiness: {
    canProceedToStep141BImportJobPersistence: boolean;
    requiresRealAmazonData: boolean;
    requiresPaginationVerification: boolean;
    requiresErrorMappingVerification: boolean;
    requiresCredentialStabilityVerification: boolean;
  };
  boundaries: {
    writesImportJob: false;
    writesImportStagingRow: false;
    writesTransaction: false;
    writesInventory: false;
    returnsRawAccessToken: false;
    returnsRawRefreshToken: false;
    returnsAwsSecret: false;
  };
};

export function verifyAmazonSpApiOrdersRealPreviewProductionReadiness(
  input: AmazonSpApiOrdersRealPreviewProductionVerificationInput,
): AmazonSpApiOrdersRealPreviewProductionVerificationResult {
  const preview = asRecord(input.previewResult);
  const transportMode = String(input.transportMode || '').trim() || 'unknown';
  const credentialSource = input.credentialSource;
  const refresh = asRecord(input.accessTokenRefreshResult);

  const previewMode = stringOrNull(preview?.previewMode);
  const dryRun = booleanOrNull(preview?.dryRun);

  const orderCount = firstNumber(preview, [
    'orderCount',
    'ordersCount',
    'normalizedOrderCount',
    'normalizedOrdersCount',
    'totalOrders',
  ]);

  const orderItemCount = firstNumber(preview, [
    'orderItemCount',
    'orderItemsCount',
    'normalizedOrderItemCount',
    'normalizedOrderItemsCount',
    'totalOrderItems',
  ]);

  const unresolvedSkuCount = firstNumber(preview, [
    'unresolvedSkuCount',
    'unresolvedSkusCount',
    'skuUnresolvedCount',
    'skuUnresolvedItemsCount',
  ]);

  const incomePreviewAmount = firstNullableNumber(preview, [
    'incomePreviewAmount',
    'totalIncomePreviewAmount',
    'previewIncomeAmount',
    'grossSalesAmount',
    'totalAmount',
  ]);

  const accessTokenRefresh = {
    attempted: Boolean(refresh),
    accepted: typeof refresh?.accepted === 'boolean' ? refresh.accepted : null,
    reason: stringOrNull(refresh?.reason),
    cacheWriteNow: refresh?.accessTokenCacheWriteNow === true,
  };

  const base = (
    accepted: boolean,
    reason: AmazonSpApiOrdersRealPreviewProductionVerificationResult['reason'],
    messageRedacted: string,
  ): AmazonSpApiOrdersRealPreviewProductionVerificationResult => ({
    step: 'Step141-A',
    source: 'amazon-sp-api-orders-real-preview-production-verification',
    accepted,
    reason,
    messageRedacted,
    transportMode,
    credentialSource,
    previewMode,
    dryRun,
    orderCount,
    orderItemCount,
    unresolvedSkuCount,
    incomePreviewAmount,
    accessTokenRefresh,
    productionReadiness: {
      canProceedToStep141BImportJobPersistence: accepted,
      requiresRealAmazonData: transportMode === 'mocked',
      requiresPaginationVerification: accepted,
      requiresErrorMappingVerification: accepted,
      requiresCredentialStabilityVerification: credentialSource === 'repository',
    },
    boundaries: {
      writesImportJob: false,
      writesImportStagingRow: false,
      writesTransaction: false,
      writesInventory: false,
      returnsRawAccessToken: false,
      returnsRawRefreshToken: false,
      returnsAwsSecret: false,
    },
  });

  if (!preview) {
    return base(false, 'preview_result_missing', 'Real preview result was missing.');
  }

  if (transportMode === 'mocked') {
    return base(false, 'mocked_transport_not_production', 'Mocked transport cannot be accepted as production verification.');
  }

  if (dryRun === true) {
    return base(false, 'preview_not_real', 'Production verification requires dryRun=false real preview.');
  }

  if (credentialSource === 'repository' && accessTokenRefresh.attempted && accessTokenRefresh.accepted === false) {
    return base(false, 'repository_refresh_failed', `Repository access token refresh failed: ${accessTokenRefresh.reason || 'unknown'}.`);
  }

  const rawReason = String(preview.reason || preview.error || preview.amazonErrorCode || '').toLowerCase();
  const rawMessage = String(preview.messageRedacted || preview.message || preview.errorMessage || '').toLowerCase();
  const status = firstNumber(preview, ['httpStatus', 'status', 'statusCode']);

  if (status === 401 || status === 403 || rawReason.includes('unauthorized') || rawReason.includes('forbidden')) {
    return base(false, 'amazon_auth_or_permission_risk', 'Amazon authentication or permission risk was detected.');
  }

  if (status === 429 || rawReason.includes('throttle') || rawMessage.includes('throttle') || rawMessage.includes('rate')) {
    return base(false, 'amazon_throttle_risk', 'Amazon throttling risk was detected.');
  }

  if ((status >= 400 && status <= 599) || rawReason.includes('http') || rawReason.includes('transport')) {
    return base(false, 'amazon_http_or_transport_risk', 'Amazon HTTP or transport risk was detected.');
  }

  if (orderCount <= 0) {
    return base(false, 'orders_missing_or_empty', 'Real preview did not contain normalized orders.');
  }

  if (orderItemCount <= 0) {
    return base(false, 'items_missing_or_empty', 'Real preview did not contain normalized order items.');
  }

  if (Number.isNaN(orderCount) || Number.isNaN(orderItemCount) || orderCount < 0 || orderItemCount < 0) {
    return base(false, 'malformed_preview_shape', 'Real preview result contained malformed count fields.');
  }

  return base(true, 'ready_for_importjob_persistence', 'Real Orders preview is ready for Step141-B ImportJob/StagingRow persistence.');
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function stringOrNull(value: unknown): string | null {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized || null;
}

function booleanOrNull(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function firstNumber(obj: Record<string, unknown> | null, keys: string[]): number {
  if (!obj) return 0;

  for (const key of keys) {
    const value = obj[key];

    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }

  const normalizedOrders = obj.normalizedOrders;
  if (Array.isArray(normalizedOrders) && keys.some((key) => key.toLowerCase().includes('order'))) {
    return normalizedOrders.length;
  }

  const normalizedItems = obj.normalizedItems || obj.normalizedOrderItems || obj.orderItems;
  if (Array.isArray(normalizedItems) && keys.some((key) => key.toLowerCase().includes('item'))) {
    return normalizedItems.length;
  }

  return 0;
}

function firstNullableNumber(obj: Record<string, unknown> | null, keys: string[]): number | null {
  if (!obj) return null;

  for (const key of keys) {
    const value = obj[key];

    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }

  return null;
}
