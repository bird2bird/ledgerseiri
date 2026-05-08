import {
  assertAmazonSpApiCallbackQueryValidatorImplementationPreflightContract,
  buildAmazonSpApiCallbackQueryValidatorImplementationPreflightContract,
  type AmazonSpApiCallbackQueryValidatorImplementationPreflightContract,
} from './amazon-sp-api-callback-query-validator-implementation-preflight.dto';

export const AMAZON_SP_API_TOKEN_EXCHANGE_IMPLEMENTATION_PREFLIGHT_VERSION =
  'amazon-sp-api-token-exchange-implementation-preflight-v1' as const;

export type AmazonSpApiTokenExchangeGrantType = 'authorization_code';

export type AmazonSpApiTokenExchangeRequestInput = {
  spapiOAuthCode: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export type AmazonSpApiTokenExchangeRequestPreflightResult = {
  endpoint: 'https://api.amazon.com/auth/o2/token';
  method: 'POST';
  contentType: 'application/x-www-form-urlencoded';
  body: {
    grant_type: AmazonSpApiTokenExchangeGrantType;
    code: string;
    client_id: string;
    client_secret: string;
    redirect_uri: string;
  };
  formBody: string;
  redactedPreview: {
    grant_type: AmazonSpApiTokenExchangeGrantType;
    code: '[REDACTED_AUTHORIZATION_CODE]';
    client_id: string;
    client_secret: '[REDACTED_CLIENT_SECRET]';
    redirect_uri: string;
  };
  implementationPreflightOnly: true;
  httpCallNow: false;
  tokenPersistenceNow: false;
  controllerRouteAddedNow: false;
  frontendAddedNow: false;
  writesDatabase: false;
};

export type AmazonSpApiTokenExchangeSuccessResponseInput = {
  access_token?: unknown;
  refresh_token?: unknown;
  token_type?: unknown;
  expires_in?: unknown;
  scope?: unknown;
};

export type AmazonSpApiTokenExchangeValidatedSuccessResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  scope?: string;
  redactedPreview: {
    accessToken: '[REDACTED_ACCESS_TOKEN]';
    refreshToken: '[REDACTED_REFRESH_TOKEN]';
    tokenType: string;
    expiresIn: number;
    scope?: string;
  };
  implementationPreflightOnly: true;
  tokenPersistenceNow: false;
  httpCallNow: false;
  writesDatabase: false;
};

export type AmazonSpApiTokenExchangeErrorResponseInput = {
  error?: unknown;
  error_description?: unknown;
  error_uri?: unknown;
};

export type AmazonSpApiTokenExchangeValidatedErrorResponse = {
  error: string;
  errorDescription?: string;
  errorUri?: string;
  redactedPreview: {
    error: string;
    errorDescription?: string;
    errorUri?: string;
  };
  implementationPreflightOnly: true;
  tokenPersistenceNow: false;
  httpCallNow: false;
  writesDatabase: false;
};

export type AmazonSpApiTokenExchangeImplementationPreflightContract = {
  version: typeof AMAZON_SP_API_TOKEN_EXCHANGE_IMPLEMENTATION_PREFLIGHT_VERSION;
  sourceStep123K: AmazonSpApiCallbackQueryValidatorImplementationPreflightContract;

  contractOnly: false;
  implementationPreflightOnly: true;
  pureFunctionAddedNow: true;
  backendRouteAddedNow: false;
  frontendComponentAddedNow: false;
  frontendApiClientAddedNow: false;
  buttonHandlerAddedNow: false;
  browserRedirectAddedNow: false;
  callbackRouteAddedNow: false;
  tokenExchangeHttpCallNow: false;
  tokenPersistenceNow: false;
  refreshTokenPersistenceNow: false;
  accessTokenPersistenceNow: false;
  schemaChangedNow: false;
  migrationAddedNow: false;
  realSpApiRequestNow: false;
  writesDatabase: false;

  preflightBoundary: {
    purpose: 'pure-function-token-exchange-request-response-preflight-only';
    pureFunctionOnly: true;
    requestBodyBuilderRequired: true;
    successResponseValidatorRequired: true;
    errorResponseValidatorRequired: true;
    redactedPreviewRequired: true;
    noNetworkRequired: true;
    noDatabaseRequired: true;
    noControllerRouteRequired: true;
    noFrontendRequired: true;
  };

  requestContract: {
    endpointRequired: true;
    postMethodRequired: true;
    formUrlEncodedRequired: true;
    grantTypeAuthorizationCodeRequired: true;
    authorizationCodeRequired: true;
    clientIdRequired: true;
    clientSecretRequired: true;
    redirectUriRequired: true;
    authorizationCodeRedactedInPreview: true;
    clientSecretRedactedInPreview: true;
  };

  successResponseContract: {
    accessTokenRequired: true;
    refreshTokenRequired: true;
    tokenTypeRequired: true;
    expiresInRequired: true;
    scopeOptional: true;
    accessTokenRedactedInPreview: true;
    refreshTokenRedactedInPreview: true;
    noTokenPersistenceNow: true;
  };

  errorResponseContract: {
    errorRequired: true;
    errorDescriptionOptional: true;
    errorUriOptional: true;
    invalidGrantRejected: true;
    invalidClientRejected: true;
    invalidRequestRejected: true;
    unauthorizedClientRejected: true;
    rawErrorBodyPersistenceForbidden: true;
  };

  forbiddenNow: {
    tokenExchangeHttpCall: true;
    callbackControllerRoute: true;
    authorizationControllerRoute: true;
    frontendButton: true;
    frontendApiClient: true;
    browserRedirect: true;
    oauthStatePersistence: true;
    noncePersistence: true;
    authorizationCodePersistence: true;
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
    readyForTokenPersistenceImplementationPreflight: true;
    readyForTokenExchangeHttpImplementation: false;
    readyForCallbackRouteImplementation: false;
    readyForActualPrismaSchemaMigration: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

function assertNonBlank(value: string | undefined, label: string): string {
  const trimmed = (value ?? '').trim();
  if (!trimmed) {
    throw new Error(`Step123-L token exchange implementation preflight violation: ${label} is required.`);
  }
  return trimmed;
}

function assertPositiveInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`Step123-L token exchange implementation preflight violation: ${label} must be a positive integer.`);
  }
  return value;
}

function assertStringField(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Step123-L token exchange implementation preflight violation: ${label} is required.`);
  }
  return value.trim();
}

export function buildAmazonSpApiTokenExchangeRequestImplementationPreflight(
  input: AmazonSpApiTokenExchangeRequestInput,
): AmazonSpApiTokenExchangeRequestPreflightResult {
  const spapiOAuthCode = assertNonBlank(input.spapiOAuthCode, 'spapiOAuthCode');
  const clientId = assertNonBlank(input.clientId, 'clientId');
  const clientSecret = assertNonBlank(input.clientSecret, 'clientSecret');
  const redirectUri = assertNonBlank(input.redirectUri, 'redirectUri');

  const body = {
    grant_type: 'authorization_code' as const,
    code: spapiOAuthCode,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  };

  const formBody = new URLSearchParams(body).toString();

  return {
    endpoint: 'https://api.amazon.com/auth/o2/token',
    method: 'POST',
    contentType: 'application/x-www-form-urlencoded',
    body,
    formBody,
    redactedPreview: {
      grant_type: 'authorization_code',
      code: '[REDACTED_AUTHORIZATION_CODE]',
      client_id: clientId,
      client_secret: '[REDACTED_CLIENT_SECRET]',
      redirect_uri: redirectUri,
    },
    implementationPreflightOnly: true,
    httpCallNow: false,
    tokenPersistenceNow: false,
    controllerRouteAddedNow: false,
    frontendAddedNow: false,
    writesDatabase: false,
  };
}

export function validateAmazonSpApiTokenExchangeSuccessResponseImplementationPreflight(
  input: AmazonSpApiTokenExchangeSuccessResponseInput,
): AmazonSpApiTokenExchangeValidatedSuccessResponse {
  const accessToken = assertStringField(input.access_token, 'access_token');
  const refreshToken = assertStringField(input.refresh_token, 'refresh_token');
  const tokenType = assertStringField(input.token_type, 'token_type');
  const expiresIn = assertPositiveInteger(input.expires_in, 'expires_in');

  const scope = input.scope === undefined ? undefined : assertStringField(input.scope, 'scope');

  return {
    accessToken,
    refreshToken,
    tokenType,
    expiresIn,
    scope,
    redactedPreview: {
      accessToken: '[REDACTED_ACCESS_TOKEN]',
      refreshToken: '[REDACTED_REFRESH_TOKEN]',
      tokenType,
      expiresIn,
      ...(scope ? { scope } : {}),
    },
    implementationPreflightOnly: true,
    tokenPersistenceNow: false,
    httpCallNow: false,
    writesDatabase: false,
  };
}

export function validateAmazonSpApiTokenExchangeErrorResponseImplementationPreflight(
  input: AmazonSpApiTokenExchangeErrorResponseInput,
): AmazonSpApiTokenExchangeValidatedErrorResponse {
  const error = assertStringField(input.error, 'error');
  const errorDescription = input.error_description === undefined ? undefined : assertStringField(input.error_description, 'error_description');
  const errorUri = input.error_uri === undefined ? undefined : assertStringField(input.error_uri, 'error_uri');

  return {
    error,
    errorDescription,
    errorUri,
    redactedPreview: {
      error,
      ...(errorDescription ? { errorDescription } : {}),
      ...(errorUri ? { errorUri } : {}),
    },
    implementationPreflightOnly: true,
    tokenPersistenceNow: false,
    httpCallNow: false,
    writesDatabase: false,
  };
}

export function buildAmazonSpApiTokenExchangeImplementationPreflightContract(): AmazonSpApiTokenExchangeImplementationPreflightContract {
  const step123K = assertAmazonSpApiCallbackQueryValidatorImplementationPreflightContract(
    buildAmazonSpApiCallbackQueryValidatorImplementationPreflightContract(),
  );

  return {
    version: AMAZON_SP_API_TOKEN_EXCHANGE_IMPLEMENTATION_PREFLIGHT_VERSION,
    sourceStep123K: step123K,

    contractOnly: false,
    implementationPreflightOnly: true,
    pureFunctionAddedNow: true,
    backendRouteAddedNow: false,
    frontendComponentAddedNow: false,
    frontendApiClientAddedNow: false,
    buttonHandlerAddedNow: false,
    browserRedirectAddedNow: false,
    callbackRouteAddedNow: false,
    tokenExchangeHttpCallNow: false,
    tokenPersistenceNow: false,
    refreshTokenPersistenceNow: false,
    accessTokenPersistenceNow: false,
    schemaChangedNow: false,
    migrationAddedNow: false,
    realSpApiRequestNow: false,
    writesDatabase: false,

    preflightBoundary: {
      purpose: 'pure-function-token-exchange-request-response-preflight-only',
      pureFunctionOnly: true,
      requestBodyBuilderRequired: true,
      successResponseValidatorRequired: true,
      errorResponseValidatorRequired: true,
      redactedPreviewRequired: true,
      noNetworkRequired: true,
      noDatabaseRequired: true,
      noControllerRouteRequired: true,
      noFrontendRequired: true,
    },

    requestContract: {
      endpointRequired: true,
      postMethodRequired: true,
      formUrlEncodedRequired: true,
      grantTypeAuthorizationCodeRequired: true,
      authorizationCodeRequired: true,
      clientIdRequired: true,
      clientSecretRequired: true,
      redirectUriRequired: true,
      authorizationCodeRedactedInPreview: true,
      clientSecretRedactedInPreview: true,
    },

    successResponseContract: {
      accessTokenRequired: true,
      refreshTokenRequired: true,
      tokenTypeRequired: true,
      expiresInRequired: true,
      scopeOptional: true,
      accessTokenRedactedInPreview: true,
      refreshTokenRedactedInPreview: true,
      noTokenPersistenceNow: true,
    },

    errorResponseContract: {
      errorRequired: true,
      errorDescriptionOptional: true,
      errorUriOptional: true,
      invalidGrantRejected: true,
      invalidClientRejected: true,
      invalidRequestRejected: true,
      unauthorizedClientRejected: true,
      rawErrorBodyPersistenceForbidden: true,
    },

    forbiddenNow: {
      tokenExchangeHttpCall: true,
      callbackControllerRoute: true,
      authorizationControllerRoute: true,
      frontendButton: true,
      frontendApiClient: true,
      browserRedirect: true,
      oauthStatePersistence: true,
      noncePersistence: true,
      authorizationCodePersistence: true,
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
      readyForTokenPersistenceImplementationPreflight: true,
      readyForTokenExchangeHttpImplementation: false,
      readyForCallbackRouteImplementation: false,
      readyForActualPrismaSchemaMigration: false,
      readyForRealSpApiReportRequest: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiTokenExchangeImplementationPreflightContract(
  contract: AmazonSpApiTokenExchangeImplementationPreflightContract,
): AmazonSpApiTokenExchangeImplementationPreflightContract {
  if (contract.version !== AMAZON_SP_API_TOKEN_EXCHANGE_IMPLEMENTATION_PREFLIGHT_VERSION) {
    throw new Error('Step123-L token exchange implementation preflight violation: version mismatch.');
  }

  assertAmazonSpApiCallbackQueryValidatorImplementationPreflightContract(contract.sourceStep123K);

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
    contract.tokenExchangeHttpCallNow !== false ||
    contract.tokenPersistenceNow !== false ||
    contract.refreshTokenPersistenceNow !== false ||
    contract.accessTokenPersistenceNow !== false ||
    contract.schemaChangedNow !== false ||
    contract.migrationAddedNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step123-L token exchange implementation preflight violation: implementation boundary mismatch.');
  }

  for (const [key, value] of Object.entries(contract.preflightBoundary)) {
    if (key === 'purpose') continue;
    if (value !== true) {
      throw new Error(`Step123-L token exchange implementation preflight violation: preflightBoundary.${key} must remain true.`);
    }
  }

  for (const [sectionName, section] of Object.entries({
    requestContract: contract.requestContract,
    successResponseContract: contract.successResponseContract,
    errorResponseContract: contract.errorResponseContract,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step123-L token exchange implementation preflight violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  for (const [key, value] of Object.entries(contract.forbiddenNow)) {
    if (value !== true) {
      throw new Error(`Step123-L token exchange implementation preflight violation: forbiddenNow.${key} must remain true.`);
    }
  }

  if (
    contract.summary.readyForTokenPersistenceImplementationPreflight !== true ||
    contract.summary.readyForTokenExchangeHttpImplementation !== false ||
    contract.summary.readyForCallbackRouteImplementation !== false ||
    contract.summary.readyForActualPrismaSchemaMigration !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSales !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step123-L token exchange implementation preflight violation: summary readiness mismatch.');
  }

  return contract;
}
