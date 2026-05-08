import {
  assertAmazonSpApiOAuthStateSigningImplementationPreflightContract,
  buildAmazonSpApiOAuthStateSigningImplementationPreflightContract,
  type AmazonSpApiOAuthStateRedirectAfterConnect,
  type AmazonSpApiOAuthStateSigningImplementationPreflightContract,
  type AmazonSpApiOAuthStateSigningPayload,
  verifyAmazonSpApiOAuthStateImplementationPreflight,
} from './amazon-sp-api-oauth-state-signing-implementation-preflight.dto';
import type { AmazonSpApiAuthorizationUrlPreflightRegion } from './amazon-sp-api-authorization-url-builder-implementation-preflight.dto';

export const AMAZON_SP_API_CALLBACK_QUERY_VALIDATOR_IMPLEMENTATION_PREFLIGHT_VERSION =
  'amazon-sp-api-callback-query-validator-implementation-preflight-v1' as const;

export type AmazonSpApiCallbackQueryOutcome = 'success' | 'error' | 'cancelled';

export type AmazonSpApiCallbackQuery = {
  state?: string;
  spapi_oauth_code?: string;
  selling_partner_id?: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
  mws_auth_token?: string;
};

export type AmazonSpApiCallbackQueryValidatorInput = {
  query: AmazonSpApiCallbackQuery;
  hmacSigningKey: string;
  nowIso: string;
  expectedCompanyId: string;
  expectedStoreId: string;
  expectedMarketplaceId: string;
  expectedRegion: AmazonSpApiAuthorizationUrlPreflightRegion;
  allowedRedirectAfterConnect: readonly AmazonSpApiOAuthStateRedirectAfterConnect[];
};

export type AmazonSpApiCallbackQueryValidatorResult = {
  outcome: AmazonSpApiCallbackQueryOutcome;
  verifiedStatePayload: AmazonSpApiOAuthStateSigningPayload;
  spapiOAuthCode?: string;
  sellingPartnerId?: string;
  error?: string;
  errorDescription?: string;
  errorUri?: string;
  mwsAuthTokenIgnored: boolean;
  implementationPreflightOnly: true;
  callbackRouteAddedNow: false;
  tokenExchangeNow: false;
  authorizationCodePersistenceNow: false;
  oauthStatePersistenceNow: false;
  noncePersistenceNow: false;
  tokenPersistenceNow: false;
  realAmazonCallNow: false;
};

export type AmazonSpApiCallbackQueryValidatorImplementationPreflightContract = {
  version: typeof AMAZON_SP_API_CALLBACK_QUERY_VALIDATOR_IMPLEMENTATION_PREFLIGHT_VERSION;
  sourceStep123J: AmazonSpApiOAuthStateSigningImplementationPreflightContract;

  contractOnly: false;
  implementationPreflightOnly: true;
  pureFunctionAddedNow: true;
  backendRouteAddedNow: false;
  frontendComponentAddedNow: false;
  frontendApiClientAddedNow: false;
  buttonHandlerAddedNow: false;
  browserRedirectAddedNow: false;
  callbackRouteAddedNow: false;
  authorizationCodePersistenceNow: false;
  noncePersistenceNow: false;
  oauthStatePersistenceNow: false;
  tokenExchangeNow: false;
  tokenPersistenceNow: false;
  schemaChangedNow: false;
  migrationAddedNow: false;
  realSpApiRequestNow: false;
  writesDatabase: false;

  preflightBoundary: {
    purpose: 'pure-function-callback-query-validator-preflight-only';
    pureFunctionOnly: true;
    stateVerificationRequired: true;
    successQueryValidationRequired: true;
    errorQueryValidationRequired: true;
    cancelQueryValidationRequired: true;
    noNetworkRequired: true;
    noDatabaseRequired: true;
    noControllerRouteRequired: true;
    noFrontendRequired: true;
  };

  successQueryContract: {
    stateRequired: true;
    spapiOAuthCodeRequired: true;
    sellingPartnerIdRequired: true;
    mwsAuthTokenIgnored: true;
    noTokenExchangeNow: true;
    noAuthorizationCodePersistenceNow: true;
  };

  errorQueryContract: {
    stateRequiredEvenOnError: true;
    errorAllowed: true;
    errorDescriptionAllowed: true;
    errorUriAllowed: true;
    accessDeniedTreatedAsCancelled: true;
    errorCallbackMustNotExchangeToken: true;
    errorCallbackMustNotPersistCode: true;
  };

  verificationContract: {
    signedStateVerificationRequired: true;
    tamperedStateRejected: true;
    expiredStateRejected: true;
    companyMismatchRejected: true;
    storeMismatchRejected: true;
    marketplaceMismatchRejected: true;
    regionMismatchRejected: true;
    unsafeRedirectRejected: true;
  };

  forbiddenNow: {
    callbackControllerRoute: true;
    authorizationControllerRoute: true;
    frontendButton: true;
    frontendApiClient: true;
    browserRedirect: true;
    oauthStatePersistence: true;
    noncePersistence: true;
    authorizationCodePersistence: true;
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
    readyForTokenExchangeImplementationPreflight: true;
    readyForAuthorizationRouteImplementation: false;
    readyForCallbackRouteImplementation: false;
    readyForActualPrismaSchemaMigration: false;
    readyForTokenPersistenceImplementation: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

function assertNonBlank(value: string | undefined, label: string): string {
  const trimmed = (value ?? '').trim();
  if (!trimmed) {
    throw new Error(`Step123-K callback query validator preflight violation: ${label} is required.`);
  }
  return trimmed;
}

function normalizeOptional(value: string | undefined): string | undefined {
  const trimmed = (value ?? '').trim();
  return trimmed ? trimmed : undefined;
}

function isCancelledError(error: string | undefined): boolean {
  const normalized = (error ?? '').trim().toLowerCase();
  return normalized === 'access_denied' || normalized === 'cancelled' || normalized === 'canceled' || normalized === 'user_cancelled';
}

export function validateAmazonSpApiCallbackQueryImplementationPreflight(
  input: AmazonSpApiCallbackQueryValidatorInput,
): AmazonSpApiCallbackQueryValidatorResult {
  const query = input.query ?? {};
  const state = assertNonBlank(query.state, 'state');

  const verifiedState = verifyAmazonSpApiOAuthStateImplementationPreflight({
    state,
    hmacSigningKey: input.hmacSigningKey,
    nowIso: input.nowIso,
    expectedCompanyId: input.expectedCompanyId,
    expectedStoreId: input.expectedStoreId,
    expectedMarketplaceId: input.expectedMarketplaceId,
    expectedRegion: input.expectedRegion,
    allowedRedirectAfterConnect: input.allowedRedirectAfterConnect,
  });

  const error = normalizeOptional(query.error);
  const errorDescription = normalizeOptional(query.error_description);
  const errorUri = normalizeOptional(query.error_uri);
  const mwsAuthTokenIgnored = normalizeOptional(query.mws_auth_token) !== undefined;

  if (error) {
    return {
      outcome: isCancelledError(error) ? 'cancelled' : 'error',
      verifiedStatePayload: verifiedState.payload,
      error,
      errorDescription,
      errorUri,
      mwsAuthTokenIgnored,
      implementationPreflightOnly: true,
      callbackRouteAddedNow: false,
      tokenExchangeNow: false,
      authorizationCodePersistenceNow: false,
      oauthStatePersistenceNow: false,
      noncePersistenceNow: false,
      tokenPersistenceNow: false,
      realAmazonCallNow: false,
    };
  }

  const spapiOAuthCode = assertNonBlank(query.spapi_oauth_code, 'spapi_oauth_code');
  const sellingPartnerId = assertNonBlank(query.selling_partner_id, 'selling_partner_id');

  return {
    outcome: 'success',
    verifiedStatePayload: verifiedState.payload,
    spapiOAuthCode,
    sellingPartnerId,
    mwsAuthTokenIgnored,
    implementationPreflightOnly: true,
    callbackRouteAddedNow: false,
    tokenExchangeNow: false,
    authorizationCodePersistenceNow: false,
    oauthStatePersistenceNow: false,
    noncePersistenceNow: false,
    tokenPersistenceNow: false,
    realAmazonCallNow: false,
  };
}

export function buildAmazonSpApiCallbackQueryValidatorImplementationPreflightContract(): AmazonSpApiCallbackQueryValidatorImplementationPreflightContract {
  const step123J = assertAmazonSpApiOAuthStateSigningImplementationPreflightContract(
    buildAmazonSpApiOAuthStateSigningImplementationPreflightContract(),
  );

  return {
    version: AMAZON_SP_API_CALLBACK_QUERY_VALIDATOR_IMPLEMENTATION_PREFLIGHT_VERSION,
    sourceStep123J: step123J,

    contractOnly: false,
    implementationPreflightOnly: true,
    pureFunctionAddedNow: true,
    backendRouteAddedNow: false,
    frontendComponentAddedNow: false,
    frontendApiClientAddedNow: false,
    buttonHandlerAddedNow: false,
    browserRedirectAddedNow: false,
    callbackRouteAddedNow: false,
    authorizationCodePersistenceNow: false,
    noncePersistenceNow: false,
    oauthStatePersistenceNow: false,
    tokenExchangeNow: false,
    tokenPersistenceNow: false,
    schemaChangedNow: false,
    migrationAddedNow: false,
    realSpApiRequestNow: false,
    writesDatabase: false,

    preflightBoundary: {
      purpose: 'pure-function-callback-query-validator-preflight-only',
      pureFunctionOnly: true,
      stateVerificationRequired: true,
      successQueryValidationRequired: true,
      errorQueryValidationRequired: true,
      cancelQueryValidationRequired: true,
      noNetworkRequired: true,
      noDatabaseRequired: true,
      noControllerRouteRequired: true,
      noFrontendRequired: true,
    },

    successQueryContract: {
      stateRequired: true,
      spapiOAuthCodeRequired: true,
      sellingPartnerIdRequired: true,
      mwsAuthTokenIgnored: true,
      noTokenExchangeNow: true,
      noAuthorizationCodePersistenceNow: true,
    },

    errorQueryContract: {
      stateRequiredEvenOnError: true,
      errorAllowed: true,
      errorDescriptionAllowed: true,
      errorUriAllowed: true,
      accessDeniedTreatedAsCancelled: true,
      errorCallbackMustNotExchangeToken: true,
      errorCallbackMustNotPersistCode: true,
    },

    verificationContract: {
      signedStateVerificationRequired: true,
      tamperedStateRejected: true,
      expiredStateRejected: true,
      companyMismatchRejected: true,
      storeMismatchRejected: true,
      marketplaceMismatchRejected: true,
      regionMismatchRejected: true,
      unsafeRedirectRejected: true,
    },

    forbiddenNow: {
      callbackControllerRoute: true,
      authorizationControllerRoute: true,
      frontendButton: true,
      frontendApiClient: true,
      browserRedirect: true,
      oauthStatePersistence: true,
      noncePersistence: true,
      authorizationCodePersistence: true,
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
      readyForTokenExchangeImplementationPreflight: true,
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

export function assertAmazonSpApiCallbackQueryValidatorImplementationPreflightContract(
  contract: AmazonSpApiCallbackQueryValidatorImplementationPreflightContract,
): AmazonSpApiCallbackQueryValidatorImplementationPreflightContract {
  if (contract.version !== AMAZON_SP_API_CALLBACK_QUERY_VALIDATOR_IMPLEMENTATION_PREFLIGHT_VERSION) {
    throw new Error('Step123-K callback query validator implementation preflight violation: version mismatch.');
  }

  assertAmazonSpApiOAuthStateSigningImplementationPreflightContract(contract.sourceStep123J);

  if (
    contract.contractOnly !== false ||
    contract.implementationPreflightOnly !== true ||
    contract.pureFunctionAddedNow !== true ||
    contract.backendRouteAddedNow !== false ||
    contract.frontendComponentAddedNow !== false ||
    contract.frontendApiClientAddedNow !== false ||
    contract.buttonHandlerAddedNow !== false ||
    contract.browserRedirectAddedNow !== false ||
    contract.callbackRouteAddedNow !== false ||
    contract.authorizationCodePersistenceNow !== false ||
    contract.noncePersistenceNow !== false ||
    contract.oauthStatePersistenceNow !== false ||
    contract.tokenExchangeNow !== false ||
    contract.tokenPersistenceNow !== false ||
    contract.schemaChangedNow !== false ||
    contract.migrationAddedNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step123-K callback query validator implementation preflight violation: implementation boundary mismatch.');
  }

  for (const [key, value] of Object.entries(contract.preflightBoundary)) {
    if (key === 'purpose') continue;
    if (value !== true) {
      throw new Error(`Step123-K callback query validator implementation preflight violation: preflightBoundary.${key} must remain true.`);
    }
  }

  for (const [sectionName, section] of Object.entries({
    successQueryContract: contract.successQueryContract,
    errorQueryContract: contract.errorQueryContract,
    verificationContract: contract.verificationContract,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step123-K callback query validator implementation preflight violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  for (const [key, value] of Object.entries(contract.forbiddenNow)) {
    if (value !== true) {
      throw new Error(`Step123-K callback query validator implementation preflight violation: forbiddenNow.${key} must remain true.`);
    }
  }

  if (
    contract.summary.readyForTokenExchangeImplementationPreflight !== true ||
    contract.summary.readyForAuthorizationRouteImplementation !== false ||
    contract.summary.readyForCallbackRouteImplementation !== false ||
    contract.summary.readyForActualPrismaSchemaMigration !== false ||
    contract.summary.readyForTokenPersistenceImplementation !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSales !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step123-K callback query validator implementation preflight violation: summary readiness mismatch.');
  }

  return contract;
}
