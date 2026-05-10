import { createHash, createHmac } from 'crypto';
import {
  assertAmazonSpApiOrdersRealHttpActivationAllowed,
  normalizeAmazonSpApiOrdersRealHttpRegion,
  type AmazonSpApiOrdersRealHttpActivationGuardInput,
  type AmazonSpApiOrdersRealHttpActivationRegion,
} from './amazon-sp-api-orders-real-http-activation.guard';

export type AmazonSpApiOrdersSignedRequestOperation = 'ListOrders' | 'GetOrderItems';

export type AmazonSpApiOrdersSignedRequestCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string | null;
};

export type AmazonSpApiOrdersSignedRequestInputBase = {
  companyId: string;
  storeId: string;
  marketplaceId: string;
  region: string;
  accessToken: string;
  credentials: AmazonSpApiOrdersSignedRequestCredentials;
  now?: Date;
  env?: Record<string, string | undefined>;
};

export type AmazonSpApiOrdersListOrdersSignedRequestInput =
  AmazonSpApiOrdersSignedRequestInputBase & {
    createdAfter: string;
    createdBefore?: string;
    orderStatuses?: readonly string[];
    nextToken?: string;
    maxResultsPerPage?: number;
  };

export type AmazonSpApiOrdersGetOrderItemsSignedRequestInput =
  AmazonSpApiOrdersSignedRequestInputBase & {
    amazonOrderId: string;
    nextToken?: string;
  };

export type AmazonSpApiOrdersSignedRequestEnvelope = {
  step: 'Step140-N';
  operation: AmazonSpApiOrdersSignedRequestOperation;
  method: 'GET';
  endpoint: string;
  host: string;
  path: string;
  canonicalQueryString: string;
  signedUrl: string;
  headers: Record<string, string>;
  sanitized: {
    accessTokenRedacted: true;
    authorizationHeaderRedacted: true;
    secretAccessKeyRedacted: true;
    sessionTokenRedacted: true;
    nextTokenRedacted: boolean;
  };
  debug: {
    algorithm: 'AWS4-HMAC-SHA256';
    credentialScope: string;
    signedHeaders: string;
    canonicalRequestHash: string;
    stringToSignHash: string;
  };
  boundaries: {
    doesNotExecuteNetwork: true;
    doesNotUseHttpClient: true;
    doesNotRefreshToken: true;
    doesNotRequestRestrictedDataToken: true;
    doesNotWriteDatabase: true;
    doesNotWriteImportJob: true;
    doesNotWriteTransaction: true;
    doesNotWriteInventory: true;
  };
};

type InternalSignedRequestParts = {
  operation: AmazonSpApiOrdersSignedRequestOperation;
  method: 'GET';
  endpoint: string;
  host: string;
  path: string;
  queryParams: Record<string, string | readonly string[] | undefined>;
  accessToken: string;
  credentials: AmazonSpApiOrdersSignedRequestCredentials;
  region: AmazonSpApiOrdersRealHttpActivationRegion;
  now: Date;
};

export function buildAmazonSpApiOrdersListOrdersSignedRequest(
  input: AmazonSpApiOrdersListOrdersSignedRequestInput,
): AmazonSpApiOrdersSignedRequestEnvelope {
  const normalizedRegion = assertReadyForSignedRequest(input);
  const endpoint = resolveAmazonSpApiOrdersEndpoint(normalizedRegion);
  const now = input.now || new Date();

  const queryParams: Record<string, string | readonly string[] | undefined> = input.nextToken
    ? {
        NextToken: input.nextToken,
      }
    : {
        MarketplaceIds: input.marketplaceId,
        CreatedAfter: input.createdAfter,
        CreatedBefore: input.createdBefore,
        OrderStatuses: input.orderStatuses,
        MaxResultsPerPage: input.maxResultsPerPage ? String(input.maxResultsPerPage) : '50',
      };

  return buildSignedGetRequestEnvelope({
    operation: 'ListOrders',
    method: 'GET',
    endpoint,
    host: new URL(endpoint).host,
    path: '/orders/v0/orders',
    queryParams,
    accessToken: input.accessToken,
    credentials: input.credentials,
    region: normalizedRegion,
    now,
  });
}

export function buildAmazonSpApiOrdersGetOrderItemsSignedRequest(
  input: AmazonSpApiOrdersGetOrderItemsSignedRequestInput,
): AmazonSpApiOrdersSignedRequestEnvelope {
  const normalizedRegion = assertReadyForSignedRequest(input);

  if (!String(input.amazonOrderId || '').trim()) {
    throw new Error('Step140-N signed request builder violation: amazonOrderId is required.');
  }

  const endpoint = resolveAmazonSpApiOrdersEndpoint(normalizedRegion);
  const now = input.now || new Date();
  const encodedOrderId = encodeURIComponent(input.amazonOrderId.trim());

  return buildSignedGetRequestEnvelope({
    operation: 'GetOrderItems',
    method: 'GET',
    endpoint,
    host: new URL(endpoint).host,
    path: `/orders/v0/orders/${encodedOrderId}/orderItems`,
    queryParams: input.nextToken ? { NextToken: input.nextToken } : {},
    accessToken: input.accessToken,
    credentials: input.credentials,
    region: normalizedRegion,
    now,
  });
}

export function resolveAmazonSpApiOrdersEndpoint(
  region: AmazonSpApiOrdersRealHttpActivationRegion,
): string {
  if (region === 'FE') return 'https://sellingpartnerapi-fe.amazon.com';
  if (region === 'NA') return 'https://sellingpartnerapi-na.amazon.com';
  if (region === 'EU') return 'https://sellingpartnerapi-eu.amazon.com';

  throw new Error('Step140-N signed request builder violation: unsupported SP-API region.');
}

export function buildAmazonSpApiCanonicalQueryString(
  queryParams: Record<string, string | readonly string[] | undefined>,
): string {
  const pairs: Array<[string, string]> = [];

  for (const [key, value] of Object.entries(queryParams)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null || String(item).length === 0) continue;
        pairs.push([key, String(item)]);
      }
    } else if (String(value).length > 0) {
      pairs.push([key, String(value)]);
    }
  }

  return pairs
    .map(([key, value]) => [awsPercentEncode(key), awsPercentEncode(value)] as const)
    .sort(([aKey, aValue], [bKey, bValue]) => {
      if (aKey === bKey) return aValue.localeCompare(bValue);
      return aKey.localeCompare(bKey);
    })
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

function assertReadyForSignedRequest(
  input: AmazonSpApiOrdersSignedRequestInputBase,
): AmazonSpApiOrdersRealHttpActivationRegion {
  const normalizedRegion = normalizeAmazonSpApiOrdersRealHttpRegion(input.region);

  const guardInput: AmazonSpApiOrdersRealHttpActivationGuardInput = {
    companyId: input.companyId,
    storeId: input.storeId,
    marketplaceId: input.marketplaceId,
    region: input.region,
    lwaAccessTokenPresent: Boolean(input.accessToken),
    lwaAccessTokenExpired: false,
    awsAccessKeyIdPresent: Boolean(input.credentials?.accessKeyId),
    awsSecretAccessKeyPresent: Boolean(input.credentials?.secretAccessKey),
    roleArnPresent: false,
    dryRun: false,
    env: input.env,
  };

  assertAmazonSpApiOrdersRealHttpActivationAllowed(guardInput);

  if (!normalizedRegion) {
    throw new Error('Step140-N signed request builder violation: region must be FE, NA, EU, or JP.');
  }

  if (!String(input.accessToken || '').trim()) {
    throw new Error('Step140-N signed request builder violation: accessToken is required.');
  }

  if (!String(input.credentials?.accessKeyId || '').trim()) {
    throw new Error('Step140-N signed request builder violation: accessKeyId is required.');
  }

  if (!String(input.credentials?.secretAccessKey || '').trim()) {
    throw new Error('Step140-N signed request builder violation: secretAccessKey is required.');
  }

  return normalizedRegion;
}

function buildSignedGetRequestEnvelope(parts: InternalSignedRequestParts): AmazonSpApiOrdersSignedRequestEnvelope {
  const amzDate = toAmzDate(parts.now);
  const dateStamp = amzDate.slice(0, 8);
  const service = 'execute-api';
  const credentialScope = `${dateStamp}/${parts.region}/${service}/aws4_request`;

  const canonicalQueryString = buildAmazonSpApiCanonicalQueryString(parts.queryParams);
  const canonicalHeadersMap: Record<string, string> = {
    host: parts.host,
    'x-amz-access-token': parts.accessToken,
    'x-amz-date': amzDate,
  };

  if (parts.credentials.sessionToken) {
    canonicalHeadersMap['x-amz-security-token'] = parts.credentials.sessionToken;
  }

  const signedHeaderNames = Object.keys(canonicalHeadersMap).sort();
  const signedHeaders = signedHeaderNames.join(';');
  const canonicalHeaders = signedHeaderNames
    .map((key) => `${key}:${normalizeHeaderValue(canonicalHeadersMap[key])}\n`)
    .join('');

  const payloadHash = sha256Hex('');
  const canonicalRequest = [
    parts.method,
    parts.path,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const canonicalRequestHash = sha256Hex(canonicalRequest);
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    canonicalRequestHash,
  ].join('\n');

  const signingKey = deriveAwsV4SigningKey(
    parts.credentials.secretAccessKey,
    dateStamp,
    parts.region,
    service,
  );

  const signature = hmacHex(signingKey, stringToSign);
  const authorizationHeader =
    `AWS4-HMAC-SHA256 Credential=${parts.credentials.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const signedUrl = `${parts.endpoint}${parts.path}${canonicalQueryString ? `?${canonicalQueryString}` : ''}`;

  const headers: Record<string, string> = {
    host: parts.host,
    'x-amz-access-token': '[REDACTED]',
    'x-amz-date': amzDate,
    authorization: redactAuthorizationHeader(authorizationHeader),
  };

  if (parts.credentials.sessionToken) {
    headers['x-amz-security-token'] = '[REDACTED]';
  }

  return {
    step: 'Step140-N',
    operation: parts.operation,
    method: parts.method,
    endpoint: parts.endpoint,
    host: parts.host,
    path: parts.path,
    // Step140-N-FIX1:
    // The raw canonical query string is used internally for SigV4 signing only.
    // The returned envelope is sanitized because NextToken can be sensitive and must not be logged.
    canonicalQueryString: redactNextTokenInUrl(canonicalQueryString),
    signedUrl: redactNextTokenInUrl(signedUrl),
    headers,
    sanitized: {
      accessTokenRedacted: true,
      authorizationHeaderRedacted: true,
      secretAccessKeyRedacted: true,
      sessionTokenRedacted: true,
      nextTokenRedacted: hasNextToken(parts.queryParams),
    },
    debug: {
      algorithm: 'AWS4-HMAC-SHA256',
      credentialScope,
      signedHeaders,
      canonicalRequestHash,
      stringToSignHash: sha256Hex(stringToSign),
    },
    boundaries: {
      doesNotExecuteNetwork: true,
      doesNotUseHttpClient: true,
      doesNotRefreshToken: true,
      doesNotRequestRestrictedDataToken: true,
      doesNotWriteDatabase: true,
      doesNotWriteImportJob: true,
      doesNotWriteTransaction: true,
      doesNotWriteInventory: true,
    },
  };
}

function hasNextToken(queryParams: Record<string, string | readonly string[] | undefined>): boolean {
  return Object.keys(queryParams).some((key) => key.toLowerCase() === 'nexttoken');
}

function redactNextTokenInUrl(value: string): string {
  return value.replace(/(NextToken=)[^&]+/g, '$1[REDACTED]');
}

function redactAuthorizationHeader(value: string): string {
  return value.replace(/Signature=[a-f0-9]+/i, 'Signature=[REDACTED]');
}

function toAmzDate(date: Date): string {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

function normalizeHeaderValue(value: string): string {
  return String(value).trim().replace(/\s+/g, ' ');
}

function awsPercentEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac('sha256', key).update(value, 'utf8').digest();
}

function hmacHex(key: Buffer | string, value: string): string {
  return createHmac('sha256', key).update(value, 'utf8').digest('hex');
}

function deriveAwsV4SigningKey(
  secretAccessKey: string,
  dateStamp: string,
  region: string,
  service: string,
): Buffer {
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}
