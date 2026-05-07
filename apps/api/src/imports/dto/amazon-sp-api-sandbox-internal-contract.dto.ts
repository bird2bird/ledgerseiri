import type { AmazonSpApiSandboxOrder } from '../amazon-sp-api-sandbox-adapter';

export const AMAZON_SP_API_SANDBOX_INTERNAL_CONTRACT_VERSION =
  'amazon-sp-api-sandbox-internal-v1' as const;

export const AMAZON_SP_API_SANDBOX_CONTROLLER_ENABLED = false as const;
export const AMAZON_SP_API_SANDBOX_REAL_SP_API_ENABLED = false as const;
export const AMAZON_SP_API_SANDBOX_OAUTH_ENABLED = false as const;
export const AMAZON_SP_API_SANDBOX_TOKEN_PERSISTENCE_ENABLED = false as const;

export type AmazonSpApiSandboxInternalSourceType = 'amazon-sp-api-sandbox';
export type AmazonSpApiSandboxInternalNormalizedSourceType = 'AMAZON_ORDER_SP_API';
export type AmazonSpApiSandboxInternalModule = 'store-orders';

export type AmazonSpApiSandboxInternalMode =
  | 'preview'
  | 'commit-staging-dry-run';

export type AmazonSpApiSandboxInternalSafetyGuard = {
  contractVersion: typeof AMAZON_SP_API_SANDBOX_INTERNAL_CONTRACT_VERSION;
  controllerEnabled: typeof AMAZON_SP_API_SANDBOX_CONTROLLER_ENABLED;
  realSpApiEnabled: typeof AMAZON_SP_API_SANDBOX_REAL_SP_API_ENABLED;
  oauthEnabled: typeof AMAZON_SP_API_SANDBOX_OAUTH_ENABLED;
  tokenPersistenceEnabled: typeof AMAZON_SP_API_SANDBOX_TOKEN_PERSISTENCE_ENABLED;
};

export type AmazonSpApiSandboxPreviewRequestDto = {
  companyId?: string;
  filename?: string;
  mode: 'preview';
  sourceType: AmazonSpApiSandboxInternalSourceType;
  module: AmazonSpApiSandboxInternalModule;
  orders: AmazonSpApiSandboxOrder[];
};

export type AmazonSpApiSandboxCommitStagingDryRunRequestDto = {
  companyId?: string;
  filename?: string;
  mode: 'commit-staging-dry-run';
  sourceType: AmazonSpApiSandboxInternalSourceType;
  module: AmazonSpApiSandboxInternalModule;
  orders: AmazonSpApiSandboxOrder[];
  dryRun: true;
};

export type AmazonSpApiSandboxInternalRequestDto =
  | AmazonSpApiSandboxPreviewRequestDto
  | AmazonSpApiSandboxCommitStagingDryRunRequestDto;

export type AmazonSpApiSandboxInternalSummaryDto = {
  orders: number;
  rows: number;
  sourceType: AmazonSpApiSandboxInternalSourceType;
  normalizedSourceType: AmazonSpApiSandboxInternalNormalizedSourceType;
  businessMonths: string[];
};

export type AmazonSpApiSandboxInternalResponseDto = {
  ok: true;
  internalOnly: true;
  controllerEnabled: false;
  realSpApiEnabled: false;
  oauthEnabled: false;
  tokenPersistenceEnabled: false;
  mode: AmazonSpApiSandboxInternalMode;
  companyId: string;
  filename: string;
  summary: AmazonSpApiSandboxInternalSummaryDto;
};

export function getAmazonSpApiSandboxInternalSafetyGuard(): AmazonSpApiSandboxInternalSafetyGuard {
  return {
    contractVersion: AMAZON_SP_API_SANDBOX_INTERNAL_CONTRACT_VERSION,
    controllerEnabled: AMAZON_SP_API_SANDBOX_CONTROLLER_ENABLED,
    realSpApiEnabled: AMAZON_SP_API_SANDBOX_REAL_SP_API_ENABLED,
    oauthEnabled: AMAZON_SP_API_SANDBOX_OAUTH_ENABLED,
    tokenPersistenceEnabled: AMAZON_SP_API_SANDBOX_TOKEN_PERSISTENCE_ENABLED,
  };
}

export function assertAmazonSpApiSandboxControllerDisabled(): AmazonSpApiSandboxInternalSafetyGuard {
  const guard = getAmazonSpApiSandboxInternalSafetyGuard();

  if (guard.controllerEnabled !== false) {
    throw new Error('Amazon SP-API sandbox controller must remain disabled.');
  }

  if (guard.realSpApiEnabled !== false) {
    throw new Error('Amazon SP-API real API access must remain disabled.');
  }

  if (guard.oauthEnabled !== false) {
    throw new Error('Amazon SP-API OAuth must remain disabled.');
  }

  if (guard.tokenPersistenceEnabled !== false) {
    throw new Error('Amazon SP-API token persistence must remain disabled.');
  }

  return guard;
}

export function assertAmazonSpApiSandboxInternalRequest(
  value: AmazonSpApiSandboxInternalRequestDto,
): AmazonSpApiSandboxInternalRequestDto {
  assertAmazonSpApiSandboxControllerDisabled();

  if (!value || typeof value !== 'object') {
    throw new Error('Amazon SP-API sandbox internal request is required.');
  }

  if (value.sourceType !== 'amazon-sp-api-sandbox') {
    throw new Error('Amazon SP-API sandbox internal request sourceType mismatch.');
  }

  if (value.module !== 'store-orders') {
    throw new Error('Amazon SP-API sandbox internal request module mismatch.');
  }

  if (!Array.isArray(value.orders) || value.orders.length === 0) {
    throw new Error('Amazon SP-API sandbox internal request requires at least one order.');
  }

  if (value.mode === 'commit-staging-dry-run' && value.dryRun !== true) {
    throw new Error('Amazon SP-API sandbox commit-staging mode must remain dryRun=true.');
  }

  if (value.mode !== 'preview' && value.mode !== 'commit-staging-dry-run') {
    throw new Error('Amazon SP-API sandbox internal request mode mismatch.');
  }

  return value;
}
