import {
  buildAmazonSpApiOrdersGetOrderItemsSignedRequest,
  buildAmazonSpApiOrdersListOrdersSignedRequest,
  type AmazonSpApiOrdersGetOrderItemsSignedRequestInput,
  type AmazonSpApiOrdersListOrdersSignedRequestInput,
  type AmazonSpApiOrdersSignedRequestEnvelope,
} from './amazon-sp-api-orders-signed-request.builder';

export type AmazonSpApiOrdersHttpTransportRequest = {
  method: 'GET';
  signedUrl: string;
  headers: Record<string, string>;
  operation: 'ListOrders' | 'GetOrderItems';
  timeoutMs: number;
};

export type AmazonSpApiOrdersHttpTransportResponse = {
  status: number;
  headers?: Record<string, string | string[] | undefined>;
  bodyText: string;
};

export type AmazonSpApiOrdersHttpTransport = (
  request: AmazonSpApiOrdersHttpTransportRequest,
) => Promise<AmazonSpApiOrdersHttpTransportResponse>;

export type AmazonSpApiOrdersGuardedHttpClientOptions = {
  transport?: AmazonSpApiOrdersHttpTransport;
  timeoutMs?: number;
};

export type AmazonSpApiOrdersGuardedHttpResult = {
  step: 'Step140-O';
  operation: 'ListOrders' | 'GetOrderItems';
  ok: boolean;
  status: number;
  throttled: boolean;
  retryable: boolean;
  sanitizedRequest: {
    method: 'GET';
    signedUrl: string;
    headers: Record<string, string>;
    operation: 'ListOrders' | 'GetOrderItems';
  };
  sanitizedResponse: {
    json: unknown | null;
    bodyTextPreview: string;
    headers: Record<string, string>;
  };
  error: {
    code: string;
    message: string;
  } | null;
  boundaries: {
    guardedByStep140M: true;
    signedByStep140N: true;
    usesInjectedTransportOnly: true;
    defaultRealNetworkDisabled: true;
    doesNotWriteDatabase: true;
    doesNotWriteImportJob: true;
    doesNotWriteImportStagingRow: true;
    doesNotWriteTransaction: true;
    doesNotWriteInventory: true;
    doesNotRefreshToken: true;
    doesNotRequestRestrictedDataToken: true;
    doesNotExposeSecrets: true;
  };
};

export async function executeAmazonSpApiOrdersListOrdersHttp(
  input: AmazonSpApiOrdersListOrdersSignedRequestInput,
  options: AmazonSpApiOrdersGuardedHttpClientOptions = {},
): Promise<AmazonSpApiOrdersGuardedHttpResult> {
  const envelope = buildAmazonSpApiOrdersListOrdersSignedRequest(input);
  return executeAmazonSpApiOrdersSignedHttpEnvelope(envelope, options);
}

export async function executeAmazonSpApiOrdersGetOrderItemsHttp(
  input: AmazonSpApiOrdersGetOrderItemsSignedRequestInput,
  options: AmazonSpApiOrdersGuardedHttpClientOptions = {},
): Promise<AmazonSpApiOrdersGuardedHttpResult> {
  const envelope = buildAmazonSpApiOrdersGetOrderItemsSignedRequest(input);
  return executeAmazonSpApiOrdersSignedHttpEnvelope(envelope, options);
}

export async function executeAmazonSpApiOrdersSignedHttpEnvelope(
  envelope: AmazonSpApiOrdersSignedRequestEnvelope,
  options: AmazonSpApiOrdersGuardedHttpClientOptions = {},
): Promise<AmazonSpApiOrdersGuardedHttpResult> {
  assertSafeSignedEnvelope(envelope);

  const timeoutMs = normalizeTimeoutMs(options.timeoutMs);
  const transport = options.transport;

  if (!transport) {
    throw new Error(
      'STEP140_O_TRANSPORT_REQUIRED: Amazon SP-API Orders HTTP client requires an injected transport in Step140-O. Real network transport is implemented in a later guarded step.',
    );
  }

  const transportRequest: AmazonSpApiOrdersHttpTransportRequest = {
    method: envelope.method,
    signedUrl: envelope.httpSignedUrl,
    headers: envelope.headers,
    operation: envelope.operation,
    timeoutMs,
  };

  const response = await transport(transportRequest);
  return buildGuardedHttpResult(envelope, transportRequest, response);
}

export function createAmazonSpApiOrdersMockTransport(
  response: AmazonSpApiOrdersHttpTransportResponse,
): AmazonSpApiOrdersHttpTransport {
  return async () => response;
}

export function assertAmazonSpApiOrdersHttpResultSafe(
  result: AmazonSpApiOrdersGuardedHttpResult,
): AmazonSpApiOrdersGuardedHttpResult {
  const serialized = JSON.stringify(result);

  const forbiddenFragments = [
    'AT_SECRET_',
    'AWS_SECRET_',
    'SESSION_SECRET_',
    'NEXT_TOKEN_SECRET_',
    'x-amz-access-token":"AT_',
    'Signature=',
  ];

  for (const fragment of forbiddenFragments) {
    if (serialized.includes(fragment)) {
      throw new Error(`Step140-O guarded HTTP result leaked forbidden fragment: ${fragment}`);
    }
  }

  if (result.boundaries.doesNotWriteDatabase !== true) {
    throw new Error('Step140-O guarded HTTP result boundary violation: database write flag mismatch.');
  }

  if (result.boundaries.defaultRealNetworkDisabled !== true) {
    throw new Error('Step140-O guarded HTTP result boundary violation: default real network flag mismatch.');
  }

  return result;
}

function assertSafeSignedEnvelope(envelope: AmazonSpApiOrdersSignedRequestEnvelope): void {
  if (envelope.step !== 'Step140-N') {
    throw new Error('Step140-O guarded HTTP client violation: signed envelope must come from Step140-N.');
  }

  if (envelope.boundaries.doesNotWriteDatabase !== true) {
    throw new Error('Step140-O guarded HTTP client violation: signed envelope must write no database.');
  }

  if (envelope.boundaries.doesNotExecuteNetwork !== true) {
    throw new Error('Step140-O guarded HTTP client violation: signed envelope must be no-network at build stage.');
  }

  if (envelope.sanitized.accessTokenRedacted !== true || envelope.sanitized.authorizationHeaderRedacted !== true) {
    throw new Error('Step140-O guarded HTTP client violation: signed envelope must be sanitized.');
  }

  const serialized = JSON.stringify(envelope);
  const forbiddenFragments = [
    'AT_SECRET_',
    'AWS_SECRET_',
    'SESSION_SECRET_',
    'NEXT_TOKEN_SECRET_',
  ];

  for (const fragment of forbiddenFragments) {
    if (serialized.includes(fragment)) {
      throw new Error(`Step140-O guarded HTTP client violation: signed envelope leaked ${fragment}.`);
    }
  }
}

function buildGuardedHttpResult(
  envelope: AmazonSpApiOrdersSignedRequestEnvelope,
  request: AmazonSpApiOrdersHttpTransportRequest,
  response: AmazonSpApiOrdersHttpTransportResponse,
): AmazonSpApiOrdersGuardedHttpResult {
  const status = Number(response.status || 0);
  const ok = status >= 200 && status < 300;
  const throttled = status === 429;
  const retryable = throttled || status === 408 || status >= 500;

  const bodyText = String(response.bodyText || '');
  const json = parseJsonOrNull(bodyText);

  const result: AmazonSpApiOrdersGuardedHttpResult = {
    step: 'Step140-O',
    operation: envelope.operation,
    ok,
    status,
    throttled,
    retryable,
    sanitizedRequest: {
      method: request.method,
      signedUrl: redactSensitiveUrlParts(request.signedUrl),
      headers: sanitizeHeaders(request.headers),
      operation: request.operation,
    },
    sanitizedResponse: {
      json,
      bodyTextPreview: bodyText.slice(0, 2000),
      headers: sanitizeHeaders(flattenHeaders(response.headers || {})),
    },
    error: ok
      ? null
      : {
          code: throttled ? 'AMAZON_SP_API_ORDERS_THROTTLED' : `AMAZON_SP_API_ORDERS_HTTP_${status || 'ERROR'}`,
          message: throttled
            ? 'Amazon SP-API Orders request was throttled. Retry later with backoff.'
            : 'Amazon SP-API Orders request failed. Response is sanitized.',
        },
    boundaries: {
      guardedByStep140M: true,
      signedByStep140N: true,
      usesInjectedTransportOnly: true,
      defaultRealNetworkDisabled: true,
      doesNotWriteDatabase: true,
      doesNotWriteImportJob: true,
      doesNotWriteImportStagingRow: true,
      doesNotWriteTransaction: true,
      doesNotWriteInventory: true,
      doesNotRefreshToken: true,
      doesNotRequestRestrictedDataToken: true,
      doesNotExposeSecrets: true,
    },
  };

  return assertAmazonSpApiOrdersHttpResultSafe(result);
}

function normalizeTimeoutMs(value?: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 10_000;
  return Math.min(Math.max(Math.trunc(value), 1_000), 30_000);
}

function parseJsonOrNull(bodyText: string): unknown | null {
  if (!bodyText.trim()) return null;

  try {
    return JSON.parse(bodyText);
  } catch {
    return null;
  }
}

function flattenHeaders(headers: Record<string, string | string[] | undefined>): Record<string, string> {
  const flattened: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      flattened[key] = value.join(', ');
    } else if (typeof value === 'string') {
      flattened[key] = value;
    }
  }

  return flattened;
}

function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    const lower = key.toLowerCase();

    if (
      lower === 'authorization' ||
      lower === 'x-amz-access-token' ||
      lower === 'x-amz-security-token' ||
      lower === 'proxy-authorization' ||
      lower.includes('secret') ||
      lower.includes('token')
    ) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = String(value);
    }
  }

  return sanitized;
}

function redactSensitiveUrlParts(value: string): string {
  return String(value)
    .replace(/(NextToken=)[^&]+/g, '$1[REDACTED]')
    .replace(/(access_token=)[^&]+/gi, '$1[REDACTED]')
    .replace(/(refresh_token=)[^&]+/gi, '$1[REDACTED]');
}
