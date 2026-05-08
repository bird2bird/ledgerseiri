import { createHmac, timingSafeEqual } from 'crypto';
import {
  assertAmazonSpApiAuthorizationUrlBuilderImplementationPreflightContract,
  buildAmazonSpApiAuthorizationUrlBuilderImplementationPreflightContract,
  type AmazonSpApiAuthorizationUrlBuilderImplementationPreflightContract,
  type AmazonSpApiAuthorizationUrlPreflightRegion,
} from './amazon-sp-api-authorization-url-builder-implementation-preflight.dto';

export const AMAZON_SP_API_OAUTH_STATE_SIGNING_IMPLEMENTATION_PREFLIGHT_VERSION =
  'amazon-sp-api-oauth-state-signing-implementation-preflight-v1' as const;

export type AmazonSpApiOAuthStateRedirectAfterConnect =
  | '/app/data/import'
  | '/app/settings/integrations'
  | '/app/income/store-orders';

export type AmazonSpApiOAuthStateSigningPayload = {
  companyId: string;
  storeId: string;
  marketplaceId: string;
  region: AmazonSpApiAuthorizationUrlPreflightRegion;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
  redirectAfterConnect: AmazonSpApiOAuthStateRedirectAfterConnect;
};

export type AmazonSpApiOAuthStateSigningInput = {
  payload: AmazonSpApiOAuthStateSigningPayload;
  hmacSigningKey: string;
};

export type AmazonSpApiOAuthStateVerificationInput = {
  state: string;
  hmacSigningKey: string;
  nowIso: string;
  expectedCompanyId: string;
  expectedStoreId: string;
  expectedMarketplaceId: string;
  expectedRegion: AmazonSpApiAuthorizationUrlPreflightRegion;
  allowedRedirectAfterConnect: readonly AmazonSpApiOAuthStateRedirectAfterConnect[];
};

export type AmazonSpApiOAuthStateSigningResult = {
  state: string;
  payload: AmazonSpApiOAuthStateSigningPayload;
  implementationPreflightOnly: true;
  noncePersistenceNow: false;
  oauthStatePersistenceNow: false;
  controllerRouteAddedNow: false;
  frontendAddedNow: false;
  tokenExchangeNow: false;
};

export type AmazonSpApiOAuthStateVerificationResult = {
  verified: true;
  payload: AmazonSpApiOAuthStateSigningPayload;
  implementationPreflightOnly: true;
  noncePersistenceNow: false;
  oauthStatePersistenceNow: false;
  controllerRouteAddedNow: false;
  frontendAddedNow: false;
  tokenExchangeNow: false;
};

export type AmazonSpApiOAuthStateSigningImplementationPreflightContract = {
  version: typeof AMAZON_SP_API_OAUTH_STATE_SIGNING_IMPLEMENTATION_PREFLIGHT_VERSION;
  sourceStep123I: AmazonSpApiAuthorizationUrlBuilderImplementationPreflightContract;

  contractOnly: false;
  implementationPreflightOnly: true;
  pureFunctionAddedNow: true;
  backendRouteAddedNow: false;
  frontendComponentAddedNow: false;
  frontendApiClientAddedNow: false;
  buttonHandlerAddedNow: false;
  browserRedirectAddedNow: false;
  noncePersistenceNow: false;
  oauthStatePersistenceNow: false;
  tokenPersistenceNow: false;
  schemaChangedNow: false;
  migrationAddedNow: false;
  realSpApiRequestNow: false;
  writesDatabase: false;

  preflightBoundary: {
    purpose: 'pure-function-oauth-state-signing-verification-preflight-only';
    pureFunctionOnly: true;
    hmacSignatureRequired: true;
    deterministicVerificationRequired: true;
    inputValidationRequired: true;
    noNetworkRequired: true;
    noDatabaseRequired: true;
    noNoncePersistenceRequired: true;
    noControllerRouteRequired: true;
    noFrontendRequired: true;
  };

  payloadContract: {
    companyIdRequired: true;
    storeIdRequired: true;
    marketplaceIdRequired: true;
    regionRequired: true;
    nonceRequired: true;
    issuedAtRequired: true;
    expiresAtRequired: true;
    redirectAfterConnectRequired: true;
    allowedRedirectTargetsRequired: true;
  };

  signatureContract: {
    hmacSha256Required: true;
    base64UrlEncodingRequired: true;
    constantTimeSignatureCompareRequired: true;
    tamperedStateRejected: true;
    malformedStateRejected: true;
    blankSigningKeyRejected: true;
  };

  verificationContract: {
    expiredStateRejected: true;
    companyMismatchRejected: true;
    storeMismatchRejected: true;
    marketplaceMismatchRejected: true;
    regionMismatchRejected: true;
    unsafeRedirectRejected: true;
    missingAllowedRedirectListRejected: true;
  };

  forbiddenNow: {
    controllerRoute: true;
    frontendButton: true;
    frontendApiClient: true;
    browserRedirect: true;
    oauthStatePersistence: true;
    noncePersistence: true;
    tokenExchangeHttpCall: true;
    refreshTokenPersistence: true;
    accessTokenPersistence: true;
    clientSecretPersistence: true;
    prismaSchemaChange: true;
    migrationFile: true;
    realSpApiHttpCall: true;
    createReportCall: true;
    getReportCall: true;
    getReportDocumentCall: true;
    importJobWrite: true;
    transactionWrite: true;
    inventoryWrite: true;
  };

  summary: {
    readyForCallbackQueryValidatorImplementationPreflight: true;
    readyForAuthorizationRouteImplementation: false;
    readyForCallbackRouteImplementation: false;
    readyForActualPrismaSchemaMigration: false;
    readyForTokenPersistenceImplementation: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

const ALLOWED_REDIRECT_AFTER_CONNECT: readonly AmazonSpApiOAuthStateRedirectAfterConnect[] = [
  '/app/data/import',
  '/app/settings/integrations',
  '/app/income/store-orders',
];

function base64UrlEncode(value: string | Buffer): string {
  const buffer = typeof value === 'string' ? Buffer.from(value, 'utf8') : value;
  return buffer
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function base64UrlDecode(value: string): Buffer {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padLength = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(normalized + '='.repeat(padLength), 'base64');
}

function assertNonBlank(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`Step123-J OAuth state signing preflight violation: ${label} is required.`);
  }
  return trimmed;
}

function assertIsoDate(value: string, label: string): string {
  const trimmed = assertNonBlank(value, label);
  const timestamp = Date.parse(trimmed);
  if (!Number.isFinite(timestamp)) {
    throw new Error(`Step123-J OAuth state signing preflight violation: ${label} must be a valid ISO timestamp.`);
  }
  return trimmed;
}

function assertKnownRegion(region: string): asserts region is AmazonSpApiAuthorizationUrlPreflightRegion {
  if (region !== 'FE' && region !== 'NA' && region !== 'EU') {
    throw new Error('Step123-J OAuth state signing preflight violation: invalid region.');
  }
}

function assertAllowedRedirectTarget(
  redirectAfterConnect: string,
  allowedRedirectAfterConnect: readonly AmazonSpApiOAuthStateRedirectAfterConnect[] = ALLOWED_REDIRECT_AFTER_CONNECT,
): asserts redirectAfterConnect is AmazonSpApiOAuthStateRedirectAfterConnect {
  if (allowedRedirectAfterConnect.length === 0) {
    throw new Error('Step123-J OAuth state signing preflight violation: allowed redirect list is required.');
  }

  if (!allowedRedirectAfterConnect.includes(redirectAfterConnect as AmazonSpApiOAuthStateRedirectAfterConnect)) {
    throw new Error('Step123-J OAuth state signing preflight violation: unsafe redirect target.');
  }
}

function canonicalizePayload(payload: AmazonSpApiOAuthStateSigningPayload): string {
  return JSON.stringify({
    companyId: payload.companyId,
    storeId: payload.storeId,
    marketplaceId: payload.marketplaceId,
    region: payload.region,
    nonce: payload.nonce,
    issuedAt: payload.issuedAt,
    expiresAt: payload.expiresAt,
    redirectAfterConnect: payload.redirectAfterConnect,
  });
}

function signPayload(payloadBase64: string, hmacSigningKey: string): string {
  const key = assertNonBlank(hmacSigningKey, 'hmacSigningKey');
  return base64UrlEncode(createHmac('sha256', key).update(payloadBase64).digest());
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function validatePayload(payload: AmazonSpApiOAuthStateSigningPayload): AmazonSpApiOAuthStateSigningPayload {
  const companyId = assertNonBlank(payload.companyId, 'companyId');
  const storeId = assertNonBlank(payload.storeId, 'storeId');
  const marketplaceId = assertNonBlank(payload.marketplaceId, 'marketplaceId');
  const nonce = assertNonBlank(payload.nonce, 'nonce');
  const issuedAt = assertIsoDate(payload.issuedAt, 'issuedAt');
  const expiresAt = assertIsoDate(payload.expiresAt, 'expiresAt');

  assertKnownRegion(payload.region);
  assertAllowedRedirectTarget(payload.redirectAfterConnect);

  if (Date.parse(expiresAt) <= Date.parse(issuedAt)) {
    throw new Error('Step123-J OAuth state signing preflight violation: expiresAt must be after issuedAt.');
  }

  return {
    companyId,
    storeId,
    marketplaceId,
    region: payload.region,
    nonce,
    issuedAt,
    expiresAt,
    redirectAfterConnect: payload.redirectAfterConnect,
  };
}

function decodeStatePayload(state: string): AmazonSpApiOAuthStateSigningPayload {
  const stateValue = assertNonBlank(state, 'state');
  const parts = stateValue.split('.');

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error('Step123-J OAuth state signing preflight violation: malformed state.');
  }

  try {
    const decoded = JSON.parse(base64UrlDecode(parts[0]).toString('utf8')) as AmazonSpApiOAuthStateSigningPayload;
    return validatePayload(decoded);
  } catch (err) {
    if (err instanceof Error && err.message.includes('Step123-J OAuth state signing preflight violation')) {
      throw err;
    }

    throw new Error('Step123-J OAuth state signing preflight violation: malformed state.');
  }
}

export function signAmazonSpApiOAuthStateImplementationPreflight(
  input: AmazonSpApiOAuthStateSigningInput,
): AmazonSpApiOAuthStateSigningResult {
  const payload = validatePayload(input.payload);
  const payloadBase64 = base64UrlEncode(canonicalizePayload(payload));
  const signatureBase64 = signPayload(payloadBase64, input.hmacSigningKey);

  return {
    state: `${payloadBase64}.${signatureBase64}`,
    payload,
    implementationPreflightOnly: true,
    noncePersistenceNow: false,
    oauthStatePersistenceNow: false,
    controllerRouteAddedNow: false,
    frontendAddedNow: false,
    tokenExchangeNow: false,
  };
}

export function verifyAmazonSpApiOAuthStateImplementationPreflight(
  input: AmazonSpApiOAuthStateVerificationInput,
): AmazonSpApiOAuthStateVerificationResult {
  const state = assertNonBlank(input.state, 'state');
  const parts = state.split('.');

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error('Step123-J OAuth state signing preflight violation: malformed state.');
  }

  const expectedSignature = signPayload(parts[0], input.hmacSigningKey);

  if (!constantTimeEqual(expectedSignature, parts[1])) {
    throw new Error('Step123-J OAuth state signing preflight violation: tampered state.');
  }

  const payload = decodeStatePayload(state);
  const now = Date.parse(assertIsoDate(input.nowIso, 'nowIso'));

  if (Date.parse(payload.expiresAt) <= now) {
    throw new Error('Step123-J OAuth state signing preflight violation: expired state.');
  }

  if (payload.companyId !== assertNonBlank(input.expectedCompanyId, 'expectedCompanyId')) {
    throw new Error('Step123-J OAuth state signing preflight violation: company mismatch.');
  }

  if (payload.storeId !== assertNonBlank(input.expectedStoreId, 'expectedStoreId')) {
    throw new Error('Step123-J OAuth state signing preflight violation: store mismatch.');
  }

  if (payload.marketplaceId !== assertNonBlank(input.expectedMarketplaceId, 'expectedMarketplaceId')) {
    throw new Error('Step123-J OAuth state signing preflight violation: marketplace mismatch.');
  }

  assertKnownRegion(input.expectedRegion);
  if (payload.region !== input.expectedRegion) {
    throw new Error('Step123-J OAuth state signing preflight violation: region mismatch.');
  }

  assertAllowedRedirectTarget(payload.redirectAfterConnect, input.allowedRedirectAfterConnect);

  return {
    verified: true,
    payload,
    implementationPreflightOnly: true,
    noncePersistenceNow: false,
    oauthStatePersistenceNow: false,
    controllerRouteAddedNow: false,
    frontendAddedNow: false,
    tokenExchangeNow: false,
  };
}

export function buildAmazonSpApiOAuthStateSigningImplementationPreflightContract(): AmazonSpApiOAuthStateSigningImplementationPreflightContract {
  const step123I = assertAmazonSpApiAuthorizationUrlBuilderImplementationPreflightContract(
    buildAmazonSpApiAuthorizationUrlBuilderImplementationPreflightContract(),
  );

  return {
    version: AMAZON_SP_API_OAUTH_STATE_SIGNING_IMPLEMENTATION_PREFLIGHT_VERSION,
    sourceStep123I: step123I,

    contractOnly: false,
    implementationPreflightOnly: true,
    pureFunctionAddedNow: true,
    backendRouteAddedNow: false,
    frontendComponentAddedNow: false,
    frontendApiClientAddedNow: false,
    buttonHandlerAddedNow: false,
    browserRedirectAddedNow: false,
    noncePersistenceNow: false,
    oauthStatePersistenceNow: false,
    tokenPersistenceNow: false,
    schemaChangedNow: false,
    migrationAddedNow: false,
    realSpApiRequestNow: false,
    writesDatabase: false,

    preflightBoundary: {
      purpose: 'pure-function-oauth-state-signing-verification-preflight-only',
      pureFunctionOnly: true,
      hmacSignatureRequired: true,
      deterministicVerificationRequired: true,
      inputValidationRequired: true,
      noNetworkRequired: true,
      noDatabaseRequired: true,
      noNoncePersistenceRequired: true,
      noControllerRouteRequired: true,
      noFrontendRequired: true,
    },

    payloadContract: {
      companyIdRequired: true,
      storeIdRequired: true,
      marketplaceIdRequired: true,
      regionRequired: true,
      nonceRequired: true,
      issuedAtRequired: true,
      expiresAtRequired: true,
      redirectAfterConnectRequired: true,
      allowedRedirectTargetsRequired: true,
    },

    signatureContract: {
      hmacSha256Required: true,
      base64UrlEncodingRequired: true,
      constantTimeSignatureCompareRequired: true,
      tamperedStateRejected: true,
      malformedStateRejected: true,
      blankSigningKeyRejected: true,
    },

    verificationContract: {
      expiredStateRejected: true,
      companyMismatchRejected: true,
      storeMismatchRejected: true,
      marketplaceMismatchRejected: true,
      regionMismatchRejected: true,
      unsafeRedirectRejected: true,
      missingAllowedRedirectListRejected: true,
    },

    forbiddenNow: {
      controllerRoute: true,
      frontendButton: true,
      frontendApiClient: true,
      browserRedirect: true,
      oauthStatePersistence: true,
      noncePersistence: true,
      tokenExchangeHttpCall: true,
      refreshTokenPersistence: true,
      accessTokenPersistence: true,
      clientSecretPersistence: true,
      prismaSchemaChange: true,
      migrationFile: true,
      realSpApiHttpCall: true,
      createReportCall: true,
      getReportCall: true,
      getReportDocumentCall: true,
      importJobWrite: true,
      transactionWrite: true,
      inventoryWrite: true,
    },

    summary: {
      readyForCallbackQueryValidatorImplementationPreflight: true,
      readyForAuthorizationRouteImplementation: false,
      readyForCallbackRouteImplementation: false,
      readyForActualPrismaSchemaMigration: false,
      readyForTokenPersistenceImplementation: false,
      readyForRealSpApiReportRequest: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiOAuthStateSigningImplementationPreflightContract(
  contract: AmazonSpApiOAuthStateSigningImplementationPreflightContract,
): AmazonSpApiOAuthStateSigningImplementationPreflightContract {
  if (contract.version !== AMAZON_SP_API_OAUTH_STATE_SIGNING_IMPLEMENTATION_PREFLIGHT_VERSION) {
    throw new Error('Step123-J OAuth state signing implementation preflight violation: version mismatch.');
  }

  assertAmazonSpApiAuthorizationUrlBuilderImplementationPreflightContract(contract.sourceStep123I);

  if (
    contract.contractOnly !== false ||
    contract.implementationPreflightOnly !== true ||
    contract.pureFunctionAddedNow !== true ||
    contract.backendRouteAddedNow !== false ||
    contract.frontendComponentAddedNow !== false ||
    contract.frontendApiClientAddedNow !== false ||
    contract.buttonHandlerAddedNow !== false ||
    contract.browserRedirectAddedNow !== false ||
    contract.noncePersistenceNow !== false ||
    contract.oauthStatePersistenceNow !== false ||
    contract.tokenPersistenceNow !== false ||
    contract.schemaChangedNow !== false ||
    contract.migrationAddedNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step123-J OAuth state signing implementation preflight violation: implementation boundary mismatch.');
  }

  for (const [key, value] of Object.entries(contract.preflightBoundary)) {
    if (key === 'purpose') continue;
    if (value !== true) {
      throw new Error(`Step123-J OAuth state signing implementation preflight violation: preflightBoundary.${key} must remain true.`);
    }
  }

  for (const [sectionName, section] of Object.entries({
    payloadContract: contract.payloadContract,
    signatureContract: contract.signatureContract,
    verificationContract: contract.verificationContract,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step123-J OAuth state signing implementation preflight violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  for (const [key, value] of Object.entries(contract.forbiddenNow)) {
    if (value !== true) {
      throw new Error(`Step123-J OAuth state signing implementation preflight violation: forbiddenNow.${key} must remain true.`);
    }
  }

  if (
    contract.summary.readyForCallbackQueryValidatorImplementationPreflight !== true ||
    contract.summary.readyForAuthorizationRouteImplementation !== false ||
    contract.summary.readyForCallbackRouteImplementation !== false ||
    contract.summary.readyForActualPrismaSchemaMigration !== false ||
    contract.summary.readyForTokenPersistenceImplementation !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSales !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step123-J OAuth state signing implementation preflight violation: summary readiness mismatch.');
  }

  return contract;
}
