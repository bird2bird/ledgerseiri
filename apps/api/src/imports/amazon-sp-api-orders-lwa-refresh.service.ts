import { request as httpsRequest } from 'node:https';
import { URL } from 'node:url';

export type AmazonSpApiOrdersLwaRefreshPrisma = {
  amazonSpApiConnection: {
    findFirst(args: {
      where: {
        companyId: string;
        storeId: string;
        marketplaceId: string;
        region: string;
      };
      include: {
        credential: boolean;
        accessTokenCache: boolean;
      };
    }): Promise<AmazonSpApiOrdersLwaRefreshConnection | null>;
  };
  amazonSpApiAccessTokenCache: {
    upsert(args: {
      where: {
        connectionId: string;
      };
      create: {
        connectionId: string;
        encryptedAccessToken: string;
        tokenType: string;
        scope?: string | null;
        expiresAt: Date;
      };
      update: {
        encryptedAccessToken: string;
        tokenType: string;
        scope?: string | null;
        expiresAt: Date;
      };
    }): Promise<unknown>;
  };
};

export type AmazonSpApiOrdersLwaRefreshConnection = {
  id: string;
  companyId: string;
  storeId: string;
  marketplaceId: string;
  region: string;
  status: string;
  revokedAt?: Date | null;
  credential?: {
    id: string;
    encryptedRefreshToken: string;
    encryptionKeyId: string;
    encryptionAlgorithm: string;
    tokenVersion: number;
    rotatedAt: Date;
    revokedAt?: Date | null;
  } | null;
  accessTokenCache?: {
    id: string;
    encryptedAccessToken: string;
    tokenType: string;
    scope?: string | null;
    expiresAt: Date;
  } | null;
};

export type AmazonSpApiOrdersLwaRefreshEnv = {
  AMAZON_SP_API_ORDERS_LWA_REFRESH_ENABLED?: string;
  AMAZON_SP_API_LWA_CLIENT_ID?: string;
  AMAZON_SP_API_LWA_CLIENT_SECRET?: string;
  AMAZON_SP_API_LWA_TOKEN_ENDPOINT?: string;

  AMAZON_SP_API_ORDERS_REFRESH_TOKEN_DECRYPTOR_MODE?: string;
  AMAZON_SP_API_ORDERS_REFRESH_TOKEN_DECRYPTOR_ALLOW_PLAIN_PREFIX?: string;
  AMAZON_SP_API_ORDERS_REFRESH_TOKEN_DECRYPTOR_TEST_MAPPING_JSON?: string;

  AMAZON_SP_API_ORDERS_ACCESS_TOKEN_CACHE_ENCRYPTOR_MODE?: string;
  AMAZON_SP_API_ORDERS_ACCESS_TOKEN_CACHE_ENCRYPTOR_ALLOW_PLAIN_PREFIX?: string;

  AMAZON_SP_API_ORDERS_LWA_REFRESH_TIMEOUT_MS?: string;
  AMAZON_SP_API_ORDERS_LWA_REFRESH_MAX_RESPONSE_BYTES?: string;
};

export type AmazonSpApiOrdersLwaRefreshInput = {
  prisma: AmazonSpApiOrdersLwaRefreshPrisma;
  companyId: string;
  storeId: string;
  marketplaceId: string;
  region: string;
  now?: Date;
  env?: AmazonSpApiOrdersLwaRefreshEnv;
  executor?: AmazonSpApiOrdersLwaRefreshExecutor;
};

export type AmazonSpApiOrdersLwaRefreshExecutorInput = {
  tokenEndpoint: string;
  requestBody: string;
  timeoutMs: number;
  maxResponseBytes: number;
};

export type AmazonSpApiOrdersLwaRefreshExecutorResult = {
  httpStatus: number;
  responseBody: string;
  responseHeaders?: Record<string, string | undefined>;
};

export type AmazonSpApiOrdersLwaRefreshExecutor = (
  input: AmazonSpApiOrdersLwaRefreshExecutorInput,
) => Promise<AmazonSpApiOrdersLwaRefreshExecutorResult>;

export type AmazonSpApiOrdersLwaRefreshResult = {
  step: 'Step140-Z';
  source: 'amazon-sp-api-orders-lwa-refresh-access-token-cache';
  accepted: boolean;
  reason:
    | 'ready'
    | 'refresh_disabled'
    | 'connection_not_found'
    | 'connection_not_connected'
    | 'connection_revoked'
    | 'credential_missing'
    | 'credential_revoked'
    | 'client_id_missing'
    | 'client_secret_missing'
    | 'token_endpoint_invalid'
    | 'refresh_token_decrypt_failed'
    | 'access_token_cache_encrypt_failed'
    | 'lwa_http_failed'
    | 'lwa_response_malformed'
    | 'lwa_response_missing_access_token'
    | 'lwa_response_invalid_token_type'
    | 'lwa_response_invalid_expires_in'
    | 'prisma_cache_update_failed';
  messageRedacted: string;
  companyId: string;
  storeId: string;
  marketplaceId: string;
  region: string;
  connectionId: string | null;
  tokenEndpointHost: string | null;
  httpStatus: number | null;
  accessTokenExpiresAt: string | null;
  accessTokenCacheWriteNow: boolean;
  databaseWriteNow: boolean;
  tokenPersistenceDatabaseWriteNow: boolean;
  boundaries: {
    readsAmazonSpApiConnection: true;
    readsAmazonSpApiCredential: true;
    decryptsRefreshToken: boolean;
    lwaHttpCallNow: boolean;
    refreshesLwaTokenNow: boolean;
    encryptsAccessTokenCache: boolean;
    writesAmazonSpApiAccessTokenCache: boolean;
    writesImportJob: false;
    writesTransaction: false;
    writesInventory: false;
    rawAccessTokenReturnedNow: false;
    rawRefreshTokenReturnedNow: false;
    encryptedRefreshTokenReturnedNow: false;
    encryptedAccessTokenReturnedNow: false;
  };
};

export async function refreshAmazonSpApiOrdersAccessTokenCache(
  input: AmazonSpApiOrdersLwaRefreshInput,
): Promise<AmazonSpApiOrdersLwaRefreshResult> {
  const env = (input.env || process.env) as AmazonSpApiOrdersLwaRefreshEnv;
  const now = input.now || new Date();
  const region = normalizeRegion(input.region);
  const enabled = String(env.AMAZON_SP_API_ORDERS_LWA_REFRESH_ENABLED || '').trim().toLowerCase() === 'true';

  if (!enabled) {
    return blocked(input, region, null, 'refresh_disabled', 'LWA refresh is disabled by AMAZON_SP_API_ORDERS_LWA_REFRESH_ENABLED.', null, null);
  }

  const tokenEndpoint = String(env.AMAZON_SP_API_LWA_TOKEN_ENDPOINT || 'https://api.amazon.com/auth/o2/token').trim();
  const endpointShape = parseTokenEndpoint(tokenEndpoint);

  if (!endpointShape.valid) {
    return blocked(input, region, null, 'token_endpoint_invalid', 'LWA token endpoint must be a valid https URL.', endpointShape.host, null);
  }

  const clientId = String(env.AMAZON_SP_API_LWA_CLIENT_ID || '').trim();
  const clientSecret = String(env.AMAZON_SP_API_LWA_CLIENT_SECRET || '').trim();

  if (!clientId) {
    return blocked(input, region, null, 'client_id_missing', 'LWA client id is required.', endpointShape.host, null);
  }

  if (!clientSecret) {
    return blocked(input, region, null, 'client_secret_missing', 'LWA client secret is required.', endpointShape.host, null);
  }

  const connection = await input.prisma.amazonSpApiConnection.findFirst({
    where: {
      companyId: input.companyId,
      storeId: input.storeId,
      marketplaceId: input.marketplaceId,
      region,
    },
    include: {
      credential: true,
      accessTokenCache: true,
    },
  });

  if (!connection) {
    return blocked(input, region, null, 'connection_not_found', 'Amazon SP-API connection was not found.', endpointShape.host, null);
  }

  if (String(connection.status || '').trim().toUpperCase() !== 'CONNECTED') {
    return blocked(input, region, connection, 'connection_not_connected', 'Amazon SP-API connection is not connected.', endpointShape.host, null);
  }

  if (connection.revokedAt) {
    return blocked(input, region, connection, 'connection_revoked', 'Amazon SP-API connection is revoked.', endpointShape.host, null);
  }

  if (!connection.credential) {
    return blocked(input, region, connection, 'credential_missing', 'Amazon SP-API credential is missing.', endpointShape.host, null);
  }

  if (connection.credential.revokedAt) {
    return blocked(input, region, connection, 'credential_revoked', 'Amazon SP-API credential is revoked.', endpointShape.host, null);
  }

  const refreshToken = decryptRefreshTokenForControllerOnly({
    encryptedRefreshToken: connection.credential.encryptedRefreshToken,
    encryptionAlgorithm: connection.credential.encryptionAlgorithm,
    connectionId: connection.id,
    companyId: input.companyId,
    storeId: input.storeId,
    env,
  });

  if (!refreshToken) {
    return blocked(input, region, connection, 'refresh_token_decrypt_failed', 'Refresh token decryptor rejected the cached refresh token.', endpointShape.host, null);
  }

  const requestBody = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  }).toString();

  const timeoutMs = positiveInt(env.AMAZON_SP_API_ORDERS_LWA_REFRESH_TIMEOUT_MS, 15000);
  const maxResponseBytes = positiveInt(env.AMAZON_SP_API_ORDERS_LWA_REFRESH_MAX_RESPONSE_BYTES, 1024 * 512);

  const executor = input.executor || executeAmazonSpApiOrdersLwaRefreshHttp;

  let httpResult: AmazonSpApiOrdersLwaRefreshExecutorResult;

  try {
    httpResult = await executor({
      tokenEndpoint,
      requestBody,
      timeoutMs,
      maxResponseBytes,
    });
  } catch {
    return blocked(input, region, connection, 'lwa_http_failed', 'LWA refresh HTTP executor failed.', endpointShape.host, null);
  }

  if (httpResult.httpStatus < 200 || httpResult.httpStatus >= 300) {
    return blocked(input, region, connection, 'lwa_http_failed', `LWA refresh HTTP failed with status ${httpResult.httpStatus}.`, endpointShape.host, httpResult.httpStatus);
  }

  const parsed = parseLwaRefreshResponse(httpResult.responseBody);

  if (!parsed.ok) {
    return blocked(input, region, connection, parsed.reason, parsed.messageRedacted, endpointShape.host, httpResult.httpStatus);
  }

  const encryptedAccessToken = encryptAccessTokenCacheForStorage(parsed.accessToken, env);

  if (!encryptedAccessToken) {
    return blocked(input, region, connection, 'access_token_cache_encrypt_failed', 'Access token cache encryptor rejected refreshed access token.', endpointShape.host, httpResult.httpStatus);
  }

  const expiresAt = new Date(now.getTime() + parsed.expiresInSeconds * 1000);

  try {
    await input.prisma.amazonSpApiAccessTokenCache.upsert({
      where: {
        connectionId: connection.id,
      },
      create: {
        connectionId: connection.id,
        encryptedAccessToken,
        tokenType: parsed.tokenType,
        scope: parsed.scope,
        expiresAt,
      },
      update: {
        encryptedAccessToken,
        tokenType: parsed.tokenType,
        scope: parsed.scope,
        expiresAt,
      },
    });
  } catch {
    return blocked(input, region, connection, 'prisma_cache_update_failed', 'Failed to update Amazon SP-API access token cache.', endpointShape.host, httpResult.httpStatus);
  }

  return {
    step: 'Step140-Z',
    source: 'amazon-sp-api-orders-lwa-refresh-access-token-cache',
    accepted: true,
    reason: 'ready',
    messageRedacted: 'LWA refresh succeeded and Amazon SP-API access token cache was updated.',
    companyId: input.companyId,
    storeId: input.storeId,
    marketplaceId: input.marketplaceId,
    region,
    connectionId: connection.id,
    tokenEndpointHost: endpointShape.host,
    httpStatus: httpResult.httpStatus,
    accessTokenExpiresAt: expiresAt.toISOString(),
    accessTokenCacheWriteNow: true,
    databaseWriteNow: true,
    tokenPersistenceDatabaseWriteNow: true,
    boundaries: {
      readsAmazonSpApiConnection: true,
      readsAmazonSpApiCredential: true,
      decryptsRefreshToken: true,
      lwaHttpCallNow: true,
      refreshesLwaTokenNow: true,
      encryptsAccessTokenCache: true,
      writesAmazonSpApiAccessTokenCache: true,
      writesImportJob: false,
      writesTransaction: false,
      writesInventory: false,
      rawAccessTokenReturnedNow: false,
      rawRefreshTokenReturnedNow: false,
      encryptedRefreshTokenReturnedNow: false,
      encryptedAccessTokenReturnedNow: false,
    },
  };
}

export async function executeAmazonSpApiOrdersLwaRefreshHttp(
  input: AmazonSpApiOrdersLwaRefreshExecutorInput,
): Promise<AmazonSpApiOrdersLwaRefreshExecutorResult> {
  const url = new URL(input.tokenEndpoint);

  return new Promise((resolve) => {
    const req = httpsRequest(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method: 'POST',
        timeout: input.timeoutMs,
        headers: {
          'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'content-length': Buffer.byteLength(input.requestBody),
          accept: 'application/json',
          'user-agent': 'LedgerSeiri-Step140-Z-Amazon-SP-API-Orders-LWA-Refresh',
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        let bytes = 0;
        let truncated = false;

        res.on('data', (chunk) => {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
          bytes += buffer.length;

          if (bytes <= input.maxResponseBytes) {
            chunks.push(buffer);
          } else {
            truncated = true;
          }
        });

        res.on('end', () => {
          resolve({
            httpStatus: res.statusCode || 0,
            responseBody: truncated
              ? JSON.stringify({ error: 'STEP140_Z_LWA_RESPONSE_TOO_LARGE' })
              : Buffer.concat(chunks).toString('utf8'),
            responseHeaders: sanitizeHeaders(res.headers),
          });
        });
      },
    );

    req.on('timeout', () => {
      req.destroy(new Error('STEP140_Z_LWA_REFRESH_TIMEOUT'));
    });

    req.on('error', () => {
      resolve({
        httpStatus: 599,
        responseBody: JSON.stringify({ error: 'STEP140_Z_LWA_REFRESH_HTTP_ERROR' }),
      });
    });

    req.write(input.requestBody);
    req.end();
  });
}

function decryptRefreshTokenForControllerOnly(input: {
  encryptedRefreshToken: string;
  encryptionAlgorithm?: string | null;
  connectionId: string;
  companyId: string;
  storeId: string;
  env: AmazonSpApiOrdersLwaRefreshEnv;
}): string | null {
  const encrypted = String(input.encryptedRefreshToken || '').trim();
  const algorithm = String(input.encryptionAlgorithm || '').trim();
  const mode = String(input.env.AMAZON_SP_API_ORDERS_REFRESH_TOKEN_DECRYPTOR_MODE || 'disabled').trim().toLowerCase();

  if (!encrypted) return null;

  if (mode === 'plain-prefix-dev-only') {
    const allowed = String(input.env.AMAZON_SP_API_ORDERS_REFRESH_TOKEN_DECRYPTOR_ALLOW_PLAIN_PREFIX || '').trim().toLowerCase() === 'true';

    if (!allowed) return null;
    if (algorithm && algorithm !== 'plain-prefix-dev-only') return null;
    if (!encrypted.startsWith('plain:')) return null;

    return encrypted.slice('plain:'.length).trim() || null;
  }

  if (mode === 'test-mapping') {
    const raw = String(input.env.AMAZON_SP_API_ORDERS_REFRESH_TOKEN_DECRYPTOR_TEST_MAPPING_JSON || '').trim();

    if (!raw) return null;

    try {
      const mapping = JSON.parse(raw) as Record<string, string>;

      return (
        String(mapping[encrypted] || '').trim() ||
        String(mapping[`connection:${input.connectionId}`] || '').trim() ||
        String(mapping[`company-store:${input.companyId}:${input.storeId}`] || '').trim() ||
        null
      );
    } catch {
      return null;
    }
  }

  return null;
}

function encryptAccessTokenCacheForStorage(
  accessToken: string,
  env: AmazonSpApiOrdersLwaRefreshEnv,
): string | null {
  const token = String(accessToken || '').trim();
  const mode = String(env.AMAZON_SP_API_ORDERS_ACCESS_TOKEN_CACHE_ENCRYPTOR_MODE || 'disabled').trim().toLowerCase();

  if (!token) return null;

  if (mode === 'plain-prefix-dev-only') {
    const allowed = String(env.AMAZON_SP_API_ORDERS_ACCESS_TOKEN_CACHE_ENCRYPTOR_ALLOW_PLAIN_PREFIX || '').trim().toLowerCase() === 'true';

    if (!allowed) return null;

    return `plain:${token}`;
  }

  return null;
}

function parseLwaRefreshResponse(body: string):
  | {
      ok: true;
      accessToken: string;
      tokenType: 'bearer';
      expiresInSeconds: number;
      scope: string | null;
    }
  | {
      ok: false;
      reason:
        | 'lwa_response_malformed'
        | 'lwa_response_missing_access_token'
        | 'lwa_response_invalid_token_type'
        | 'lwa_response_invalid_expires_in';
      messageRedacted: string;
    } {
  let parsed: unknown;

  try {
    parsed = JSON.parse(body);
  } catch {
    return {
      ok: false,
      reason: 'lwa_response_malformed',
      messageRedacted: 'LWA refresh response was not valid JSON.',
    };
  }

  const obj = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  const accessToken = String(obj.access_token || '').trim();
  const tokenType = String(obj.token_type || '').trim().toLowerCase();
  const expiresIn = Number(obj.expires_in);
  const scope = typeof obj.scope === 'string' && obj.scope.trim() ? obj.scope.trim() : null;

  if (!accessToken) {
    return {
      ok: false,
      reason: 'lwa_response_missing_access_token',
      messageRedacted: 'LWA refresh response did not include access_token.',
    };
  }

  if (tokenType !== 'bearer') {
    return {
      ok: false,
      reason: 'lwa_response_invalid_token_type',
      messageRedacted: 'LWA refresh response token_type was not bearer.',
    };
  }

  if (!Number.isInteger(expiresIn) || expiresIn <= 0) {
    return {
      ok: false,
      reason: 'lwa_response_invalid_expires_in',
      messageRedacted: 'LWA refresh response expires_in was invalid.',
    };
  }

  return {
    ok: true,
    accessToken,
    tokenType: 'bearer',
    expiresInSeconds: expiresIn,
    scope,
  };
}

function blocked(
  input: AmazonSpApiOrdersLwaRefreshInput,
  region: string,
  connection: AmazonSpApiOrdersLwaRefreshConnection | null,
  reason: Exclude<AmazonSpApiOrdersLwaRefreshResult['reason'], 'ready'>,
  messageRedacted: string,
  tokenEndpointHost: string | null,
  httpStatus: number | null,
): AmazonSpApiOrdersLwaRefreshResult {
  return {
    step: 'Step140-Z',
    source: 'amazon-sp-api-orders-lwa-refresh-access-token-cache',
    accepted: false,
    reason,
    messageRedacted,
    companyId: input.companyId,
    storeId: input.storeId,
    marketplaceId: input.marketplaceId,
    region,
    connectionId: connection?.id || null,
    tokenEndpointHost,
    httpStatus,
    accessTokenExpiresAt: null,
    accessTokenCacheWriteNow: false,
    databaseWriteNow: false,
    tokenPersistenceDatabaseWriteNow: false,
    boundaries: {
      readsAmazonSpApiConnection: true,
      readsAmazonSpApiCredential: true,
      decryptsRefreshToken: reason !== 'refresh_token_decrypt_failed' && Boolean(connection?.credential),
      lwaHttpCallNow: reason === 'lwa_http_failed',
      refreshesLwaTokenNow: false,
      encryptsAccessTokenCache: false,
      writesAmazonSpApiAccessTokenCache: false,
      writesImportJob: false,
      writesTransaction: false,
      writesInventory: false,
      rawAccessTokenReturnedNow: false,
      rawRefreshTokenReturnedNow: false,
      encryptedRefreshTokenReturnedNow: false,
      encryptedAccessTokenReturnedNow: false,
    },
  };
}

function parseTokenEndpoint(value: string): { valid: boolean; host: string | null } {
  try {
    const url = new URL(value);

    return {
      valid: url.protocol === 'https:' && Boolean(url.host),
      host: url.host || null,
    };
  } catch {
    return {
      valid: false,
      host: null,
    };
  }
}

function sanitizeHeaders(headers: Record<string, string | string[] | number | undefined>): Record<string, string> {
  const out: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    const lower = key.toLowerCase();

    if (lower.includes('authorization') || lower.includes('token') || lower.includes('secret')) {
      out[lower] = '[redacted]';
      continue;
    }

    if (Array.isArray(value)) out[lower] = value.join(',');
    else if (typeof value === 'number') out[lower] = String(value);
    else if (typeof value === 'string') out[lower] = value;
  }

  return out;
}

function normalizeRegion(value: string): string {
  const normalized = String(value || '').trim().toUpperCase();
  return normalized === 'FE' ? 'JP' : normalized;
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
