import { request as httpsRequest } from 'node:https';
import { URL } from 'node:url';
import type {
  AmazonSpApiOrdersHttpTransportRequest,
  AmazonSpApiOrdersHttpTransportResponse,
  AmazonSpApiOrdersHttpTransport,
} from './amazon-sp-api-orders-http.client';

export type AmazonSpApiOrdersServerOnlyRawSignedTransportEnv = {
  AMAZON_SP_API_ORDERS_REAL_ACCESS_TOKEN?: string;
  AMAZON_SP_API_ORDERS_AWS_ACCESS_KEY_ID?: string;
  AMAZON_SP_API_ORDERS_AWS_SECRET_ACCESS_KEY?: string;
  AMAZON_SP_API_ORDERS_AWS_SESSION_TOKEN?: string;
  AMAZON_SP_API_ORDERS_RAW_SIGNED_HTTP_TIMEOUT_MS?: string;
};

export type AmazonSpApiOrdersServerOnlyRawSignedTransportOptions = {
  env?: AmazonSpApiOrdersServerOnlyRawSignedTransportEnv;
  timeoutMs?: number;
};

export type AmazonSpApiOrdersServerOnlyRawSignedTransportReadiness = {
  step: 'Step140-W';
  serverOnlyRawSignedHttpTransportImplementedNow: true;
  canExecuteRealAmazonNetwork: boolean;
  missingEnvKeys: string[];
  exposesRawAuthorization: false;
  exposesRawAccessToken: false;
  exposesAwsSecretAccessKey: false;
  exposesAwsSessionToken: false;
};

export function getAmazonSpApiOrdersServerOnlyRawSignedTransportReadiness(
  env: AmazonSpApiOrdersServerOnlyRawSignedTransportEnv = process.env as AmazonSpApiOrdersServerOnlyRawSignedTransportEnv,
): AmazonSpApiOrdersServerOnlyRawSignedTransportReadiness {
  const required = [
    'AMAZON_SP_API_ORDERS_REAL_ACCESS_TOKEN',
    'AMAZON_SP_API_ORDERS_AWS_ACCESS_KEY_ID',
    'AMAZON_SP_API_ORDERS_AWS_SECRET_ACCESS_KEY',
    'AMAZON_SP_API_ORDERS_AWS_SESSION_TOKEN',
  ] as const;

  const missingEnvKeys = required.filter((key) => !String(env[key] || '').trim());

  return {
    step: 'Step140-W',
    serverOnlyRawSignedHttpTransportImplementedNow: true,
    canExecuteRealAmazonNetwork: missingEnvKeys.length === 0,
    missingEnvKeys,
    exposesRawAuthorization: false,
    exposesRawAccessToken: false,
    exposesAwsSecretAccessKey: false,
    exposesAwsSessionToken: false,
  };
}

export function buildAmazonSpApiOrdersServerOnlyRawSignedTransport(
  options: AmazonSpApiOrdersServerOnlyRawSignedTransportOptions = {},
): AmazonSpApiOrdersHttpTransport {
  const env = (options.env || process.env) as AmazonSpApiOrdersServerOnlyRawSignedTransportEnv;
  const readiness = getAmazonSpApiOrdersServerOnlyRawSignedTransportReadiness(env);
  const timeoutMs = options.timeoutMs || Number(env.AMAZON_SP_API_ORDERS_RAW_SIGNED_HTTP_TIMEOUT_MS || 15000);

  return async (envelope: AmazonSpApiOrdersHttpTransportRequest): Promise<AmazonSpApiOrdersHttpTransportResponse> => {
    if (!readiness.canExecuteRealAmazonNetwork) {
      return {
        status: 503,
        headers: {
          'x-ledgerseiri-step': 'Step140-W',
          'x-ledgerseiri-real-network': 'blocked-missing-env',
        },
        bodyText: JSON.stringify({
          error: 'STEP140_W_REAL_NETWORK_ENV_MISSING',
          message: 'Amazon SP-API Orders real network transport is blocked because required server-only env keys are missing.',
          missingEnvKeys: readiness.missingEnvKeys,
        }),
      };
    }

    return executeAmazonSpApiOrdersServerOnlyRawSignedHttpRequest(envelope, {
      accessToken: String(env.AMAZON_SP_API_ORDERS_REAL_ACCESS_TOKEN || ''),
      timeoutMs,
    });
  };
}

export async function executeAmazonSpApiOrdersServerOnlyRawSignedHttpRequest(
  envelope: AmazonSpApiOrdersHttpTransportRequest,
  options: {
    accessToken: string;
    timeoutMs: number;
  },
): Promise<AmazonSpApiOrdersHttpTransportResponse> {
  const url = new URL(envelope.signedUrl);

  const headers = buildSanitizedOutboundHeadersForAmazon(envelope, options.accessToken);

  return new Promise((resolve) => {
    const req = httpsRequest(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 443,
        method: envelope.method,
        path: `${url.pathname}${url.search}`,
        headers,
        timeout: options.timeoutMs,
      },
      (res) => {
        const chunks: Buffer[] = [];

        res.on('data', (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
        });

        res.on('end', () => {
          resolve({
            status: res.statusCode || 0,
            headers: sanitizeAmazonResponseHeaders(res.headers),
            bodyText: Buffer.concat(chunks).toString('utf8'),
          });
        });
      },
    );

    req.on('timeout', () => {
      req.destroy(new Error('STEP140_W_AMAZON_HTTP_TIMEOUT'));
    });

    req.on('error', (err) => {
      resolve({
        status: 599,
        headers: {
          'x-ledgerseiri-step': 'Step140-W',
          'x-ledgerseiri-real-network': 'error',
        },
        bodyText: JSON.stringify({
          error: 'STEP140_W_AMAZON_HTTP_ERROR',
          message: sanitizeTransportErrorMessage(err),
        }),
      });
    });

    req.end();
  });
}

function buildSanitizedOutboundHeadersForAmazon(
  envelope: AmazonSpApiOrdersHttpTransportRequest,
  accessToken: string,
): Record<string, string> {
  const signedUrl = new URL(envelope.signedUrl);

  const headers: Record<string, string> = {
    host: signedUrl.host,
    'user-agent': 'LedgerSeiri-Step140-W-Amazon-SP-API-Orders-Transport',
    accept: 'application/json',
    'x-amz-access-token': accessToken,
  };

  const signedHeaders = envelope.headers || {};

  for (const [key, value] of Object.entries(signedHeaders)) {
    const lower = key.toLowerCase();
    const headerValue = String(value || '');

    if (lower === 'authorization') {
      headers.authorization = headerValue;
      continue;
    }

    if (lower === 'x-amz-security-token') {
      headers['x-amz-security-token'] = headerValue;
      continue;
    }

    if (lower === 'x-amz-date') {
      headers['x-amz-date'] = headerValue;
      continue;
    }

    if (lower === 'host') {
      headers.host = headerValue;
      continue;
    }
  }

  return headers;
}

function sanitizeAmazonResponseHeaders(headers: Record<string, string | string[] | number | undefined>): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    const lower = key.toLowerCase();

    if (
      lower.includes('authorization') ||
      lower.includes('token') ||
      lower.includes('secret') ||
      lower.includes('credential')
    ) {
      sanitized[lower] = '[redacted]';
      continue;
    }

    if (Array.isArray(value)) {
      sanitized[lower] = value.join(',');
    } else if (typeof value === 'number') {
      sanitized[lower] = String(value);
    } else if (typeof value === 'string') {
      sanitized[lower] = value;
    }
  }

  return sanitized;
}

function sanitizeTransportErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  return message
    .replace(/AWS_SECRET_[A-Za-z0-9_\\-]+/g, '[redacted-aws-secret]')
    .replace(/AT_[A-Za-z0-9_\\-]+/g, '[redacted-access-token]')
    .replace(/SESSION_[A-Za-z0-9_\\-]+/g, '[redacted-session-token]')
    .slice(0, 500);
}
