import { Injectable } from '@nestjs/common';
import { AmazonSpApiPersistAccessTokenCacheInput, AmazonSpApiPersistRefreshCredentialInput } from './amazon-sp-api-token-persistence.repository';

export type AmazonSpApiOauthBridgeStatePayload = {
  companyId: string;
  storeId: string;
  marketplaceId: string;
  region: string;
  appId: string;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
  returnTo?: string;
  stateVersion: 'v1';
};

export type AmazonSpApiOauthBridgeCallbackQuery = {
  state: string;
  code?: string;
  selling_partner_id?: string;
  spapi_oauth_code?: string;
  mws_auth_token?: string;
  error?: string;
  error_description?: string;
};

export type AmazonSpApiOauthBridgeEncryptedTokenResponse = {
  encryptedRefreshToken: string;
  encryptedAccessToken?: string;
  tokenType?: string;
  expiresInSeconds?: number;
  scope?: string;
  encryptionKeyId: string;
  encryptionAlgorithm: string;
  tokenVersion: number;
};

export type AmazonSpApiOauthBridgeValidationContext = {
  now?: Date;
  expectedNonce?: string;
  expectedCompanyId?: string;
  expectedStoreId?: string;
  expectedMarketplaceId?: string;
  expectedRegion?: string;
  expectedAppId?: string;
};

export type AmazonSpApiOauthBridgePersistencePlan = {
  accepted: true;
  authorizationCodePresent: true;
  sellingPartnerId: string;
  refreshCredentialInput: AmazonSpApiPersistRefreshCredentialInput;
  accessTokenCacheInput: AmazonSpApiPersistAccessTokenCacheInput | null;
  sanitizedResult: {
    companyId: string;
    storeId: string;
    marketplaceId: string;
    region: string;
    appId: string;
    sellingPartnerId: string;
    tokenType: string | null;
    accessTokenExpiresAt: string | null;
    returnTo: string | null;
  };
};

export type AmazonSpApiOauthBridgeRejectedResult = {
  accepted: false;
  reason:
    | 'callback_error'
    | 'missing_authorization_code'
    | 'missing_selling_partner_id'
    | 'invalid_state'
    | 'expired_state'
    | 'nonce_mismatch'
    | 'company_mismatch'
    | 'store_mismatch'
    | 'marketplace_mismatch'
    | 'region_mismatch'
    | 'app_mismatch'
    | 'missing_encrypted_refresh_token'
    | 'invalid_token_metadata';
  messageRedacted: string;
};

export type AmazonSpApiOauthBridgeResult =
  | AmazonSpApiOauthBridgePersistencePlan
  | AmazonSpApiOauthBridgeRejectedResult;

function requireNonEmpty(value: string | undefined, fieldName: string): string {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(`Amazon SP-API OAuth bridge validation failed: ${fieldName} is required.`);
  }

  return normalized;
}

function parseDate(value: string, fieldName: string): Date {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Amazon SP-API OAuth bridge validation failed: ${fieldName} must be a valid ISO date string.`);
  }

  return parsed;
}

function redactMessage(message: string): string {
  return message
    .replace(/code\s*[:=]\s*[^,\s}]+/gi, 'code:[REDACTED]')
    .replace(/authorizationCode\s*[:=]\s*[^,\s}]+/gi, 'authorizationCode:[REDACTED]')
    .replace(/refreshToken\s*[:=]\s*[^,\s}]+/gi, 'refreshToken:[REDACTED]')
    .replace(/accessToken\s*[:=]\s*[^,\s}]+/gi, 'accessToken:[REDACTED]')
    .replace(/encryptedRefreshToken\s*[:=]\s*[^,\s}]+/gi, 'encryptedRefreshToken:[REDACTED]')
    .replace(/encryptedAccessToken\s*[:=]\s*[^,\s}]+/gi, 'encryptedAccessToken:[REDACTED]');
}

function reject(reason: AmazonSpApiOauthBridgeRejectedResult['reason'], message: string): AmazonSpApiOauthBridgeRejectedResult {
  return {
    accepted: false,
    reason,
    messageRedacted: redactMessage(message),
  };
}

@Injectable()
export class AmazonSpApiOauthStatePersistenceBridgeService {
  buildPersistencePlan(
    statePayload: AmazonSpApiOauthBridgeStatePayload,
    callbackQuery: AmazonSpApiOauthBridgeCallbackQuery,
    encryptedTokenResponse: AmazonSpApiOauthBridgeEncryptedTokenResponse,
    context: AmazonSpApiOauthBridgeValidationContext = {},
  ): AmazonSpApiOauthBridgeResult {
    if (callbackQuery.error) {
      return reject('callback_error', `Amazon callback returned error=${callbackQuery.error}`);
    }

    const authorizationCode = callbackQuery.code ?? callbackQuery.spapi_oauth_code;

    if (!authorizationCode?.trim()) {
      return reject('missing_authorization_code', 'Amazon callback missing authorizationCode');
    }

    const sellingPartnerId = callbackQuery.selling_partner_id?.trim();

    if (!sellingPartnerId) {
      return reject('missing_selling_partner_id', 'Amazon callback missing sellingPartnerId');
    }

    const stateValidation = this.validateStatePayload(statePayload, context);

    if (stateValidation.accepted === false) {
      return stateValidation;
    }

    const encryptedRefreshToken = encryptedTokenResponse.encryptedRefreshToken?.trim();

    if (!encryptedRefreshToken) {
      return reject('missing_encrypted_refresh_token', 'Token exchange result missing encryptedRefreshToken');
    }

    const encryptionKeyId = encryptedTokenResponse.encryptionKeyId?.trim();
    const encryptionAlgorithm = encryptedTokenResponse.encryptionAlgorithm?.trim();

    if (!encryptionKeyId || !encryptionAlgorithm || !Number.isInteger(encryptedTokenResponse.tokenVersion) || encryptedTokenResponse.tokenVersion <= 0) {
      return reject('invalid_token_metadata', 'Token encryption metadata is invalid');
    }

    const now = context.now ?? new Date();

    const refreshCredentialInput: AmazonSpApiPersistRefreshCredentialInput = {
      companyId: statePayload.companyId.trim(),
      storeId: statePayload.storeId.trim(),
      marketplaceId: statePayload.marketplaceId.trim(),
      region: statePayload.region.trim(),
      appId: statePayload.appId.trim(),
      sellingPartnerId,
      encryptedRefreshToken,
      encryptionKeyId,
      encryptionAlgorithm,
      tokenVersion: encryptedTokenResponse.tokenVersion,
      connectedAt: now,
      auditMessage: 'OAuth callback accepted for encrypted refresh credential persistence',
      auditMetadataJson: {
        source: 'amazon-sp-api-oauth-state-persistence-bridge',
        hasAuthorizationCode: true,
        stateVersion: statePayload.stateVersion,
      },
    };

    let accessTokenCacheInput: AmazonSpApiPersistAccessTokenCacheInput | null = null;
    let accessTokenExpiresAt: Date | null = null;

    if (encryptedTokenResponse.encryptedAccessToken?.trim()) {
      const expiresInSeconds = encryptedTokenResponse.expiresInSeconds;

      if (expiresInSeconds !== undefined && (!Number.isInteger(expiresInSeconds) || expiresInSeconds <= 0)) {
        return reject('invalid_token_metadata', 'Token exchange result has invalid expiresInSeconds');
      }

      accessTokenExpiresAt = new Date(now.getTime() + (expiresInSeconds ?? 3600) * 1000);

      accessTokenCacheInput = {
        companyId: statePayload.companyId.trim(),
        storeId: statePayload.storeId.trim(),
        marketplaceId: statePayload.marketplaceId.trim(),
        region: statePayload.region.trim(),
        encryptedAccessToken: encryptedTokenResponse.encryptedAccessToken.trim(),
        tokenType: encryptedTokenResponse.tokenType?.trim() || 'bearer',
        expiresAt: accessTokenExpiresAt,
        scope: encryptedTokenResponse.scope?.trim() || undefined,
        auditMessage: 'OAuth callback accepted for encrypted access token cache persistence',
        auditMetadataJson: {
          source: 'amazon-sp-api-oauth-state-persistence-bridge',
          stateVersion: statePayload.stateVersion,
        },
      };
    }

    return {
      accepted: true,
      authorizationCodePresent: true,
      sellingPartnerId,
      refreshCredentialInput,
      accessTokenCacheInput,
      sanitizedResult: {
        companyId: refreshCredentialInput.companyId,
        storeId: refreshCredentialInput.storeId,
        marketplaceId: refreshCredentialInput.marketplaceId,
        region: refreshCredentialInput.region,
        appId: refreshCredentialInput.appId,
        sellingPartnerId,
        tokenType: accessTokenCacheInput?.tokenType ?? null,
        accessTokenExpiresAt: accessTokenExpiresAt?.toISOString() ?? null,
        returnTo: statePayload.returnTo?.trim() || null,
      },
    };
  }

  validateStatePayload(
    statePayload: AmazonSpApiOauthBridgeStatePayload,
    context: AmazonSpApiOauthBridgeValidationContext = {},
  ): AmazonSpApiOauthBridgeRejectedResult | { accepted: true } {
    try {
      requireNonEmpty(statePayload.companyId, 'companyId');
      requireNonEmpty(statePayload.storeId, 'storeId');
      requireNonEmpty(statePayload.marketplaceId, 'marketplaceId');
      requireNonEmpty(statePayload.region, 'region');
      requireNonEmpty(statePayload.appId, 'appId');
      requireNonEmpty(statePayload.nonce, 'nonce');

      if (statePayload.stateVersion !== 'v1') {
        return reject('invalid_state', 'OAuth state version is invalid');
      }

      parseDate(statePayload.issuedAt, 'issuedAt');
      const expiresAt = parseDate(statePayload.expiresAt, 'expiresAt');
      const now = context.now ?? new Date();

      if (expiresAt.getTime() <= now.getTime()) {
        return reject('expired_state', 'OAuth state has expired');
      }

      if (context.expectedNonce && context.expectedNonce !== statePayload.nonce) {
        return reject('nonce_mismatch', 'OAuth state nonce mismatch');
      }

      if (context.expectedCompanyId && context.expectedCompanyId !== statePayload.companyId) {
        return reject('company_mismatch', 'OAuth state companyId mismatch');
      }

      if (context.expectedStoreId && context.expectedStoreId !== statePayload.storeId) {
        return reject('store_mismatch', 'OAuth state storeId mismatch');
      }

      if (context.expectedMarketplaceId && context.expectedMarketplaceId !== statePayload.marketplaceId) {
        return reject('marketplace_mismatch', 'OAuth state marketplaceId mismatch');
      }

      if (context.expectedRegion && context.expectedRegion !== statePayload.region) {
        return reject('region_mismatch', 'OAuth state region mismatch');
      }

      if (context.expectedAppId && context.expectedAppId !== statePayload.appId) {
        return reject('app_mismatch', 'OAuth state appId mismatch');
      }

      return { accepted: true };
    } catch (err) {
      return reject('invalid_state', err instanceof Error ? err.message : 'OAuth state is invalid');
    }
  }
}
