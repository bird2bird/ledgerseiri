export const AMAZON_SP_API_ORDERS_REAL_HTTP_ENABLED_ENV =
  'AMAZON_SP_API_ORDERS_REAL_HTTP_ENABLED' as const;

export type AmazonSpApiOrdersRealHttpActivationRegion = 'FE' | 'NA' | 'EU';

export type AmazonSpApiOrdersRealHttpActivationGuardInput = {
  companyId?: string | null;
  storeId?: string | null;
  marketplaceId?: string | null;
  region?: string | null;
  lwaAccessTokenPresent?: boolean | null;
  lwaAccessTokenExpired?: boolean | null;
  awsAccessKeyIdPresent?: boolean | null;
  awsSecretAccessKeyPresent?: boolean | null;
  roleArnPresent?: boolean | null;
  dryRun?: boolean | null;
  env?: Record<string, string | undefined>;
};

export type AmazonSpApiOrdersRealHttpActivationGuardDecision = {
  step: 'Step140-M';
  featureFlagName: typeof AMAZON_SP_API_ORDERS_REAL_HTTP_ENABLED_ENV;
  featureFlagEnabled: boolean;
  allowed: boolean;
  failClosed: boolean;
  reasonCode:
    | 'REAL_HTTP_DISABLED'
    | 'DRY_RUN_REQUEST'
    | 'MISSING_COMPANY'
    | 'MISSING_STORE'
    | 'MISSING_MARKETPLACE'
    | 'INVALID_REGION'
    | 'MISSING_LWA_ACCESS_TOKEN'
    | 'LWA_ACCESS_TOKEN_EXPIRED'
    | 'MISSING_AWS_CREDENTIALS'
    | 'READY_FOR_REAL_HTTP_NEXT_STEP';
  sanitizedMessage: string;
  normalized: {
    companyId: string | null;
    storeId: string | null;
    marketplaceId: string | null;
    region: AmazonSpApiOrdersRealHttpActivationRegion | null;
  };
  guardBoundaries: {
    doesNotCallAmazon: true;
    doesNotUseHttpClient: true;
    doesNotUseSigV4: true;
    doesNotRefreshToken: true;
    doesNotWriteImportJob: true;
    doesNotWriteImportStagingRow: true;
    doesNotWriteTransaction: true;
    doesNotWriteInventory: true;
    doesNotExposeSecrets: true;
  };
};

export function isAmazonSpApiOrdersRealHttpFeatureEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const raw = String(env[AMAZON_SP_API_ORDERS_REAL_HTTP_ENABLED_ENV] || '').trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'yes' || raw === 'enabled';
}

export function normalizeAmazonSpApiOrdersRealHttpRegion(
  value?: string | null,
): AmazonSpApiOrdersRealHttpActivationRegion | null {
  const normalized = String(value || '').trim().toUpperCase();

  if (!normalized) return null;
  if (normalized === 'JP') return 'FE';
  if (normalized === 'FE' || normalized === 'NA' || normalized === 'EU') return normalized;

  return null;
}

export function evaluateAmazonSpApiOrdersRealHttpActivationGuard(
  input: AmazonSpApiOrdersRealHttpActivationGuardInput,
): AmazonSpApiOrdersRealHttpActivationGuardDecision {
  const env = input.env || process.env;
  const featureFlagEnabled = isAmazonSpApiOrdersRealHttpFeatureEnabled(env);

  const companyId = trimOrNull(input.companyId);
  const storeId = trimOrNull(input.storeId);
  const marketplaceId = trimOrNull(input.marketplaceId);
  const region = normalizeAmazonSpApiOrdersRealHttpRegion(input.region);

  const base = {
    step: 'Step140-M' as const,
    featureFlagName: AMAZON_SP_API_ORDERS_REAL_HTTP_ENABLED_ENV,
    featureFlagEnabled,
    normalized: {
      companyId,
      storeId,
      marketplaceId,
      region,
    },
    guardBoundaries: {
      doesNotCallAmazon: true as const,
      doesNotUseHttpClient: true as const,
      doesNotUseSigV4: true as const,
      doesNotRefreshToken: true as const,
      doesNotWriteImportJob: true as const,
      doesNotWriteImportStagingRow: true as const,
      doesNotWriteTransaction: true as const,
      doesNotWriteInventory: true as const,
      doesNotExposeSecrets: true as const,
    },
  };

  if (!featureFlagEnabled) {
    return deny(base, 'REAL_HTTP_DISABLED', 'Amazon SP-API Orders real HTTP is disabled by feature flag.');
  }

  if (input.dryRun === true) {
    return deny(base, 'DRY_RUN_REQUEST', 'Dry-run request must not activate real Amazon Orders HTTP.');
  }

  if (!companyId) {
    return deny(base, 'MISSING_COMPANY', 'Authenticated company context is required before real Amazon Orders HTTP.');
  }

  if (!storeId) {
    return deny(base, 'MISSING_STORE', 'Store context is required before real Amazon Orders HTTP.');
  }

  if (!marketplaceId) {
    return deny(base, 'MISSING_MARKETPLACE', 'Marketplace is required before real Amazon Orders HTTP.');
  }

  if (!region) {
    return deny(base, 'INVALID_REGION', 'Region must be FE, NA, EU, or JP before real Amazon Orders HTTP.');
  }

  if (input.lwaAccessTokenPresent !== true) {
    return deny(base, 'MISSING_LWA_ACCESS_TOKEN', 'LWA access token must be present before real Amazon Orders HTTP.');
  }

  if (input.lwaAccessTokenExpired === true) {
    return deny(base, 'LWA_ACCESS_TOKEN_EXPIRED', 'LWA access token must be valid before real Amazon Orders HTTP.');
  }

  const hasStaticAwsPair =
    input.awsAccessKeyIdPresent === true && input.awsSecretAccessKeyPresent === true;
  const hasRoleArn = input.roleArnPresent === true;

  if (!hasStaticAwsPair && !hasRoleArn) {
    return deny(base, 'MISSING_AWS_CREDENTIALS', 'AWS SigV4 credential readiness is required before real Amazon Orders HTTP.');
  }

  return {
    ...base,
    allowed: true,
    failClosed: false,
    reasonCode: 'READY_FOR_REAL_HTTP_NEXT_STEP',
    sanitizedMessage: 'Real Amazon Orders HTTP activation guard passed. HTTP execution is still implemented in a later step.',
  };
}

export function assertAmazonSpApiOrdersRealHttpActivationAllowed(
  input: AmazonSpApiOrdersRealHttpActivationGuardInput,
): AmazonSpApiOrdersRealHttpActivationGuardDecision {
  const decision = evaluateAmazonSpApiOrdersRealHttpActivationGuard(input);

  if (!decision.allowed) {
    throw new Error(`STEP140_M_ORDERS_REAL_HTTP_BLOCKED: ${decision.reasonCode}: ${decision.sanitizedMessage}`);
  }

  return decision;
}

function trimOrNull(value?: string | null): string | null {
  const normalized = String(value || '').trim();
  return normalized ? normalized : null;
}

function deny(
  base: Omit<AmazonSpApiOrdersRealHttpActivationGuardDecision, 'allowed' | 'failClosed' | 'reasonCode' | 'sanitizedMessage'>,
  reasonCode: AmazonSpApiOrdersRealHttpActivationGuardDecision['reasonCode'],
  sanitizedMessage: string,
): AmazonSpApiOrdersRealHttpActivationGuardDecision {
  return {
    ...base,
    allowed: false,
    failClosed: true,
    reasonCode,
    sanitizedMessage,
  };
}
