import { Injectable } from '@nestjs/common';

export type AmazonSpApiLwaEnvConfigValidationStatus = 'ready' | 'missing_required_env' | 'invalid_env';

export type AmazonSpApiLwaEnvConfigValidationResult = {
  source: 'amazon-sp-api-lwa-env-config-validation-service';
  step: 'Step135-D';
  status: AmazonSpApiLwaEnvConfigValidationStatus;
  readyForRealLwaHttpTransport: boolean;
  clientIdPresent: boolean;
  clientSecretPresent: boolean;
  redirectUriPresent: boolean;
  marketplaceId: string;
  region: string;
  tokenEndpointHost: string | null;
  environment: 'production' | 'sandbox' | 'unknown';
  realHttpEnabled: false;
  missingRequiredEnv: string[];
  invalidEnv: string[];
  tokenExchangeHttpCallNow: false;
  lwaHttpCallNow: false;
  realSpApiRequestNow: false;
  tokenPersistenceDatabaseWriteNow: false;
  rawClientSecretReturnedNow: false;
  rawClientIdReturnedNow: false;
  rawRefreshTokenReturnedNow: false;
  rawAccessTokenReturnedNow: false;
};

function normalizeEnv(value: string | undefined): string {
  return String(value || '').trim();
}

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

function endpointHost(value: string): string | null {
  try {
    const url = new URL(value);
    return url.host || null;
  } catch {
    return null;
  }
}

function normalizeEnvironment(value: string): AmazonSpApiLwaEnvConfigValidationResult['environment'] {
  const normalized = value.trim().toLowerCase();

  if (normalized === 'production') return 'production';
  if (normalized === 'sandbox') return 'sandbox';
  return 'unknown';
}

@Injectable()
export class AmazonSpApiLwaEnvConfigValidationService {
  validateFromProcessEnv(env: NodeJS.ProcessEnv = process.env): AmazonSpApiLwaEnvConfigValidationResult {
    const clientId = normalizeEnv(env.AMAZON_SP_API_LWA_CLIENT_ID);
    const clientSecret = normalizeEnv(env.AMAZON_SP_API_LWA_CLIENT_SECRET);
    const redirectUri = normalizeEnv(env.AMAZON_SP_API_OAUTH_REDIRECT_URI);
    const marketplaceId = normalizeEnv(env.AMAZON_SP_API_MARKETPLACE_ID) || 'A1VC38T7YXB528';
    const region = normalizeEnv(env.AMAZON_SP_API_REGION) || 'JP';
    const tokenEndpoint =
      normalizeEnv(env.AMAZON_SP_API_LWA_TOKEN_ENDPOINT) || 'https://api.amazon.com/auth/o2/token';
    const environment = normalizeEnvironment(
      normalizeEnv(env.AMAZON_SP_API_LWA_ENVIRONMENT) || 'production',
    );

    const missingRequiredEnv: string[] = [];

    if (!clientId) missingRequiredEnv.push('AMAZON_SP_API_LWA_CLIENT_ID');
    if (!clientSecret) missingRequiredEnv.push('AMAZON_SP_API_LWA_CLIENT_SECRET');
    if (!redirectUri) missingRequiredEnv.push('AMAZON_SP_API_OAUTH_REDIRECT_URI');
    if (!marketplaceId) missingRequiredEnv.push('AMAZON_SP_API_MARKETPLACE_ID');
    if (!region) missingRequiredEnv.push('AMAZON_SP_API_REGION');

    const invalidEnv: string[] = [];

    if (redirectUri && !isHttpsUrl(redirectUri)) {
      invalidEnv.push('AMAZON_SP_API_OAUTH_REDIRECT_URI');
    }

    if (tokenEndpoint && !isHttpsUrl(tokenEndpoint)) {
      invalidEnv.push('AMAZON_SP_API_LWA_TOKEN_ENDPOINT');
    }

    if (!/^[A-Z0-9]+$/.test(marketplaceId)) {
      invalidEnv.push('AMAZON_SP_API_MARKETPLACE_ID');
    }

    if (!/^[A-Z]{2}$/.test(region)) {
      invalidEnv.push('AMAZON_SP_API_REGION');
    }

    if (environment === 'unknown') {
      invalidEnv.push('AMAZON_SP_API_LWA_ENVIRONMENT');
    }

    const status: AmazonSpApiLwaEnvConfigValidationStatus =
      missingRequiredEnv.length > 0
        ? 'missing_required_env'
        : invalidEnv.length > 0
          ? 'invalid_env'
          : 'ready';

    return {
      source: 'amazon-sp-api-lwa-env-config-validation-service',
      step: 'Step135-D',
      status,
      readyForRealLwaHttpTransport: status === 'ready',
      clientIdPresent: clientId.length > 0,
      clientSecretPresent: clientSecret.length > 0,
      redirectUriPresent: redirectUri.length > 0,
      marketplaceId,
      region,
      tokenEndpointHost: endpointHost(tokenEndpoint),
      environment,
      realHttpEnabled: false,
      missingRequiredEnv,
      invalidEnv,
      tokenExchangeHttpCallNow: false,
      lwaHttpCallNow: false,
      realSpApiRequestNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      rawClientSecretReturnedNow: false,
      rawClientIdReturnedNow: false,
      rawRefreshTokenReturnedNow: false,
      rawAccessTokenReturnedNow: false,
    };
  }
}
