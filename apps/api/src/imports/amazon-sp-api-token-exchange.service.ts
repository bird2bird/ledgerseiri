import { Injectable } from '@nestjs/common';

export type AmazonSpApiTokenExchangeDryRunInput = {
  state: string;
  authorizationCode: string;
  sellingPartnerId: string;
  redirectUri: string;
  clientId: string;
  clientSecretConfigured: boolean;
  marketplaceId: string;
  region: string;
  companyId: string;
  storeId: string;
  dryRun: true;
};

export type AmazonSpApiTokenExchangeRejectedResult = {
  accepted: false;
  reason:
    | 'missing_state'
    | 'missing_authorization_code'
    | 'missing_selling_partner_id'
    | 'missing_redirect_uri'
    | 'missing_client_id'
    | 'client_secret_not_configured'
    | 'missing_marketplace_id'
    | 'missing_region'
    | 'missing_company_id'
    | 'missing_store_id'
    | 'dry_run_required';
  messageRedacted: string;
};

export type AmazonSpApiTokenExchangeDryRunAcceptedResult = {
  accepted: true;
  source: 'amazon-sp-api-token-exchange-fake-transport';
  transportMode: 'fake';
  tokenExchangeHttpCallNow: false;
  lwaHttpCallNow: false;
  tokenPersistenceDatabaseWriteNow: false;
  realSpApiRequestNow: false;
  authorizationCodePresent: true;
  sellingPartnerId: string;
  marketplaceId: string;
  region: string;
  companyId: string;
  storeId: string;
  sanitizedTokenEnvelope: {
    encryptedRefreshToken: string;
    encryptedAccessToken: string;
    tokenType: 'bearer';
    expiresInSeconds: 3600;
    scope: 'sellingpartnerapi::migration';
    encryptionKeyId: 'fake-key-step128-b';
    encryptionAlgorithm: 'fake-none';
    tokenVersion: 1;
  };
  sanitizedResult: {
    sellingPartnerId: string;
    marketplaceId: string;
    region: string;
    companyId: string;
    storeId: string;
    tokenExchangePendingRealTransport: true;
    tokenPersistencePendingCallbackIntegration: true;
  };
};

export type AmazonSpApiTokenExchangeDryRunResult =
  | AmazonSpApiTokenExchangeDryRunAcceptedResult
  | AmazonSpApiTokenExchangeRejectedResult;

export type AmazonSpApiRealLwaExchangeChainDisabledInput = {
  state: string;
  authorizationCode: string;
  sellingPartnerId: string;
  redirectUri: string;
  expectedRedirectUri: string;
  clientId: string;
  clientSecretConfigured: boolean;
  clientSecretFingerprint: string;
  tokenEndpoint: string;
  marketplaceId: string;
  region: string;
  companyId: string;
  storeId: string;
  configValidatorStatus: 'ready' | 'missing_required_env' | 'invalid_env';
  serverSideFeatureGateEnabled: false;
  enableRealLwaHttpTransport: false;
};

export type AmazonSpApiRealLwaExchangeChainDisabledResult = {
  accepted: false;
  source: 'amazon-sp-api-real-lwa-exchange-chain-disabled';
  reason:
    | 'exchange_chain_disabled'
    | 'server_side_feature_gate_disabled'
    | 'config_validator_not_ready'
    | 'missing_state'
    | 'missing_authorization_code'
    | 'missing_selling_partner_id'
    | 'missing_redirect_uri'
    | 'mismatched_redirect_uri'
    | 'missing_client_id'
    | 'client_secret_not_configured'
    | 'missing_client_secret_fingerprint'
    | 'missing_token_endpoint'
    | 'invalid_token_endpoint'
    | 'missing_marketplace_id'
    | 'missing_region'
    | 'missing_company_id'
    | 'missing_store_id'
    | 'request_body_builder_not_ready'
    | 'http_transport_not_ready';
  messageRedacted: string;
  orchestratorPreparedNow: true;
  orchestratorImplementedNow: true;
  callbackRuntimeChangedNow: false;
  controllerRouteChangedNow: false;
  realHttpEnabledNow: false;
  tokenExchangeHttpCallNow: false;
  lwaHttpCallNow: false;
  realSpApiRequestNow: false;
  tokenPersistenceDatabaseWriteNow: false;
  requestBodyConstructedNow: false;
  requestBodyLoggedNow: false;
  rawAuthorizationCodeReturnedNow: false;
  rawClientIdReturnedNow: false;
  rawClientSecretReturnedNow: false;
  rawRequestBodyReturnedNow: false;
  rawLwaResponseReturnedNow: false;
  rawAccessTokenReturnedNow: false;
  rawRefreshTokenReturnedNow: false;
  sanitizedChain: {
    stageOrder: readonly [
      'validate-config',
      'validate-callback-state',
      'build-request-body',
      'execute-http-transport',
      'prepare-token-persistence-input',
    ];
    completedStages: readonly string[];
    blockedAtStage:
      | 'validate-config'
      | 'validate-callback-state'
      | 'build-request-body'
      | 'execute-http-transport'
      | 'feature-gate';
    configValidatorReady: boolean;
    callbackStateTrustedNow: true;
    requestBodyBuilderPrepared: boolean;
    httpTransportPrepared: boolean;
    tokenPersistencePreparedNow: false;
    nextImplementationStep: 'Step136-L';
  };
  sanitizedInputs: {
    statePresent: boolean;
    authorizationCodePresent: boolean;
    sellingPartnerIdPresent: boolean;
    redirectUriPresent: boolean;
    expectedRedirectUriPresent: boolean;
    redirectUriMatchesExpected: boolean;
    clientIdPresent: boolean;
    clientSecretConfigured: boolean;
    clientSecretFingerprintPresent: boolean;
    tokenEndpointHost: string | null;
    tokenEndpointPath: string | null;
    tokenEndpointHttps: boolean;
    marketplaceIdPresent: boolean;
    regionPresent: boolean;
    companyIdPresent: boolean;
    storeIdPresent: boolean;
  };
  sanitizedDownstreamResults: {
    requestBodyBuilderSource: 'amazon-sp-api-lwa-request-body-builder-disabled' | null;
    httpTransportSource: 'amazon-sp-api-lwa-http-transport-disabled' | null;
    requestBodyBuilderReason: string | null;
    httpTransportReason: string | null;
  };
};

export type AmazonSpApiRealLwaTokenExchangeDisabledInput = {
  state: string;
  authorizationCode: string;
  sellingPartnerId: string;
  redirectUri: string;
  clientId: string;
  clientSecretConfigured: boolean;
  marketplaceId: string;
  region: string;
  companyId: string;
  storeId: string;
  enableRealLwaHttpTransport: false;
};

export type AmazonSpApiLwaHttpTransportDisabledInput = {
  tokenEndpoint: string;
  requestBodyPrepared: boolean;
  requestBodyFingerprint: string;
  requestBodyLength: number;
  contentType: 'application/x-www-form-urlencoded';
  method: 'POST';
  configValidatorStatus: 'ready' | 'missing_required_env' | 'invalid_env';
  requestBodyBuilderStatus: 'ready' | 'disabled' | 'invalid';
  serverSideFeatureGateEnabled: false;
  enableRealLwaHttpTransport: false;
};

export type AmazonSpApiLwaHttpTransportDisabledResult = {
  accepted: false;
  source: 'amazon-sp-api-lwa-http-transport-disabled';
  reason:
    | 'http_transport_disabled'
    | 'server_side_feature_gate_disabled'
    | 'config_validator_not_ready'
    | 'request_body_builder_not_ready'
    | 'missing_token_endpoint'
    | 'invalid_token_endpoint'
    | 'missing_request_body_fingerprint'
    | 'invalid_request_body_length'
    | 'invalid_content_type'
    | 'invalid_method';
  messageRedacted: string;
  httpTransportPreparedNow: true;
  httpTransportImplementedNow: true;
  httpExecutedNow: false;
  requestBodyConstructedNow: false;
  requestBodyLoggedNow: false;
  rawRequestBodyReturnedNow: false;
  rawLwaResponseParsedNow: false;
  rawLwaResponseLoggedNow: false;
  rawLwaResponseReturnedNow: false;
  tokenExchangeHttpCallNow: false;
  lwaHttpCallNow: false;
  realSpApiRequestNow: false;
  tokenPersistenceDatabaseWriteNow: false;
  rawAuthorizationCodeReturnedNow: false;
  rawClientIdReturnedNow: false;
  rawClientSecretReturnedNow: false;
  rawAccessTokenReturnedNow: false;
  rawRefreshTokenReturnedNow: false;
  sanitizedHttpTransportShape: {
    method: 'POST';
    tokenEndpointHost: string | null;
    tokenEndpointPath: string | null;
    contentType: 'application/x-www-form-urlencoded';
    timeoutMs: 10000;
    maxAttempts: 1;
    executableClientUsedNow: false;
    requestBodyPrepared: boolean;
    requestBodyFingerprintPresent: boolean;
    requestBodyLength: number;
    responseBodyParsedNow: false;
    nextImplementationStep: 'Step136-L';
  };
  sanitizedEnablementGate: {
    configValidatorReady: boolean;
    requestBodyBuilderReady: boolean;
    serverSideFeatureGateEnabled: false;
    envFlagAloneAccepted: false;
    realLwaHttpTransportEnabled: false;
  };
};

export type AmazonSpApiLwaRequestBodyBuilderDisabledInput = {
  authorizationCode: string;
  redirectUri: string;
  clientId: string;
  clientSecretConfigured: boolean;
  clientSecretFingerprint: string;
  tokenEndpoint: string;
  expectedRedirectUri: string;
  configValidatorStatus: 'ready' | 'missing_required_env' | 'invalid_env';
  serverSideFeatureGateEnabled: false;
  enableRealLwaHttpTransport: false;
};

export type AmazonSpApiLwaRequestBodyBuilderDisabledResult = {
  accepted: false;
  source: 'amazon-sp-api-lwa-request-body-builder-disabled';
  reason:
    | 'request_body_builder_disabled'
    | 'server_side_feature_gate_disabled'
    | 'config_validator_not_ready'
    | 'missing_authorization_code'
    | 'missing_redirect_uri'
    | 'mismatched_redirect_uri'
    | 'missing_client_id'
    | 'client_secret_not_configured'
    | 'missing_client_secret_fingerprint'
    | 'missing_token_endpoint'
    | 'invalid_token_endpoint';
  messageRedacted: string;
  requestBodyBuilderPreparedNow: true;
  requestBodyConstructedNow: false;
  requestBodyLoggedNow: false;
  requestBodyReturnedToControllerNow: false;
  requestBodyReturnedToFrontendNow: false;
  tokenExchangeHttpCallNow: false;
  lwaHttpCallNow: false;
  realSpApiRequestNow: false;
  tokenPersistenceDatabaseWriteNow: false;
  rawAuthorizationCodeReturnedNow: false;
  rawClientIdReturnedNow: false;
  rawClientSecretReturnedNow: false;
  rawRequestBodyReturnedNow: false;
  sanitizedRequestBodyShape: {
    contentType: 'application/x-www-form-urlencoded';
    encodingApi: 'URLSearchParams';
    method: 'POST';
    tokenEndpointHost: string | null;
    tokenEndpointPath: string | null;
    sortedFieldOrder: readonly [
      'grant_type',
      'code',
      'redirect_uri',
      'client_id',
      'client_secret',
    ];
    grantType: 'authorization_code';
    fieldPresence: {
      grantType: true;
      code: boolean;
      redirectUri: boolean;
      clientId: boolean;
      clientSecret: boolean;
    };
    encodedBodyLength: number;
    encodedBodySha256: string | null;
    rawBodyAvailableOnlyInsideBuilder: false;
    nextImplementationStep: 'Step136-L';
  };
  sanitizedEnablementGate: {
    configValidatorReady: boolean;
    serverSideFeatureGateEnabled: false;
    envFlagAloneAccepted: false;
    realLwaHttpTransportEnabled: false;
  };
};

export type AmazonSpApiRealLwaHttpClientDisabledInput = {
  state: string;
  authorizationCode: string;
  sellingPartnerId: string;
  redirectUri: string;
  clientId: string;
  clientSecretConfigured: boolean;
  tokenEndpoint: string;
  marketplaceId: string;
  region: string;
  companyId: string;
  storeId: string;
  configValidatorStatus: 'ready' | 'missing_required_env' | 'invalid_env';
  serverSideFeatureGateEnabled: false;
  enableRealLwaHttpTransport: false;
};

export type AmazonSpApiRealLwaHttpClientDisabledResult = {
  accepted: false;
  source: 'amazon-sp-api-real-lwa-http-client-disabled-by-default';
  reason:
    | 'real_lwa_http_disabled'
    | 'server_side_feature_gate_disabled'
    | 'config_validator_not_ready'
    | 'missing_state'
    | 'missing_authorization_code'
    | 'missing_selling_partner_id'
    | 'missing_redirect_uri'
    | 'missing_client_id'
    | 'client_secret_not_configured'
    | 'missing_token_endpoint'
    | 'invalid_token_endpoint'
    | 'missing_marketplace_id'
    | 'missing_region'
    | 'missing_company_id'
    | 'missing_store_id';
  messageRedacted: string;
  transportMode: 'real-lwa-http-disabled';
  httpClientPreparedNow: true;
  tokenExchangeHttpCallNow: false;
  lwaHttpCallNow: false;
  tokenPersistenceDatabaseWriteNow: false;
  realSpApiRequestNow: false;
  rawAuthorizationCodeReturnedNow: false;
  rawClientIdReturnedNow: false;
  rawClientSecretReturnedNow: false;
  rawRefreshTokenReturnedNow: false;
  rawAccessTokenReturnedNow: false;
  sanitizedHttpRequestShape: {
    method: 'POST';
    tokenEndpointHost: string | null;
    tokenEndpointPath: string | null;
    contentType: 'application/x-www-form-urlencoded';
    grantType: 'authorization_code';
    formFieldPresence: {
      grantType: true;
      authorizationCode: boolean;
      redirectUri: boolean;
      clientId: boolean;
      clientSecret: boolean;
    };
    requestBodyConstructedNow: false;
    requestBodyLoggedNow: false;
    responseBodyParsedNow: false;
    nextImplementationStep: 'Step136-L';
  };
  sanitizedEnablementGate: {
    configValidatorReady: boolean;
    serverSideFeatureGateEnabled: false;
    envFlagAloneAccepted: false;
    realLwaHttpTransportEnabled: false;
  };
};

export type AmazonSpApiRealLwaTokenExchangeDisabledResult = {
  accepted: false;
  source: 'amazon-sp-api-token-exchange-real-lwa-disabled-skeleton';
  reason:
    | 'real_lwa_transport_disabled'
    | 'missing_state'
    | 'missing_authorization_code'
    | 'missing_selling_partner_id'
    | 'missing_redirect_uri'
    | 'missing_client_id'
    | 'client_secret_not_configured'
    | 'missing_marketplace_id'
    | 'missing_region'
    | 'missing_company_id'
    | 'missing_store_id';
  messageRedacted: string;
  transportMode: 'real-lwa-disabled';
  tokenExchangeHttpCallNow: false;
  lwaHttpCallNow: false;
  tokenPersistenceDatabaseWriteNow: false;
  realSpApiRequestNow: false;
  rawRefreshTokenReturnedNow: false;
  rawAccessTokenReturnedNow: false;
  clientSecretReturnedNow: false;
  sanitizedResult: {
    statePresent: boolean;
    authorizationCodePresent: boolean;
    sellingPartnerIdPresent: boolean;
    redirectUriPresent: boolean;
    clientIdPresent: boolean;
    clientSecretConfigured: boolean;
    marketplaceIdPresent: boolean;
    regionPresent: boolean;
    companyIdPresent: boolean;
    storeIdPresent: boolean;
    realLwaHttpTransportEnabled: false;
    nextImplementationStep: 'Step136-L';
  };
};

function normalize(value: string | undefined): string {
  return String(value || '').trim();
}

function reject(
  reason: AmazonSpApiTokenExchangeRejectedResult['reason'],
  messageRedacted: string,
): AmazonSpApiTokenExchangeRejectedResult {
  return {
    accepted: false,
    reason,
    messageRedacted,
  };
}

function fakeTokenFragment(value: string): string {
  let hash = 0;

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash.toString(16).padStart(8, '0');
}

function parseHttpsEndpointShape(value: string): { host: string | null; path: string | null; valid: boolean } {
  try {
    const url = new URL(value);

    return {
      host: url.host || null,
      path: `${url.pathname || ''}${url.search || ''}` || null,
      valid: url.protocol === 'https:',
    };
  } catch {
    return {
      host: null,
      path: null,
      valid: false,
    };
  }
}

function sanitizedBodyFingerprint(value: string): string {
  let hash = 2166136261;

  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}

@Injectable()
export class AmazonSpApiTokenExchangeService {
  orchestrateRealLwaExchangeChainDisabledLater(
    input: AmazonSpApiRealLwaExchangeChainDisabledInput,
  ): AmazonSpApiRealLwaExchangeChainDisabledResult {
    const state = normalize(input.state);
    const authorizationCode = normalize(input.authorizationCode);
    const sellingPartnerId = normalize(input.sellingPartnerId);
    const redirectUri = normalize(input.redirectUri);
    const expectedRedirectUri = normalize(input.expectedRedirectUri);
    const clientId = normalize(input.clientId);
    const clientSecretFingerprint = normalize(input.clientSecretFingerprint);
    const tokenEndpoint = normalize(input.tokenEndpoint);
    const marketplaceId = normalize(input.marketplaceId);
    const region = normalize(input.region);
    const companyId = normalize(input.companyId);
    const storeId = normalize(input.storeId);
    const endpointShape = parseHttpsEndpointShape(tokenEndpoint);

    const stageOrder = [
      'validate-config',
      'validate-callback-state',
      'build-request-body',
      'execute-http-transport',
      'prepare-token-persistence-input',
    ] as const;

    const makeResult = (
      reason: AmazonSpApiRealLwaExchangeChainDisabledResult['reason'],
      messageRedacted: string,
      blockedAtStage: AmazonSpApiRealLwaExchangeChainDisabledResult['sanitizedChain']['blockedAtStage'],
      completedStages: readonly string[],
      requestBodyBuilderResult: AmazonSpApiLwaRequestBodyBuilderDisabledResult | null = null,
      httpTransportResult: AmazonSpApiLwaHttpTransportDisabledResult | null = null,
    ): AmazonSpApiRealLwaExchangeChainDisabledResult => ({
      accepted: false,
      source: 'amazon-sp-api-real-lwa-exchange-chain-disabled',
      reason,
      messageRedacted,
      orchestratorPreparedNow: true,
      orchestratorImplementedNow: true,
      callbackRuntimeChangedNow: false,
      controllerRouteChangedNow: false,
      realHttpEnabledNow: false,
      tokenExchangeHttpCallNow: false,
      lwaHttpCallNow: false,
      realSpApiRequestNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      requestBodyConstructedNow: false,
      requestBodyLoggedNow: false,
      rawAuthorizationCodeReturnedNow: false,
      rawClientIdReturnedNow: false,
      rawClientSecretReturnedNow: false,
      rawRequestBodyReturnedNow: false,
      rawLwaResponseReturnedNow: false,
      rawAccessTokenReturnedNow: false,
      rawRefreshTokenReturnedNow: false,
      sanitizedChain: {
        stageOrder,
        completedStages,
        blockedAtStage,
        configValidatorReady: input.configValidatorStatus === 'ready',
        callbackStateTrustedNow: true,
        requestBodyBuilderPrepared:
          requestBodyBuilderResult?.requestBodyBuilderPreparedNow === true,
        httpTransportPrepared: httpTransportResult?.httpTransportPreparedNow === true,
        tokenPersistencePreparedNow: false,
        nextImplementationStep: 'Step136-L',
      },
      sanitizedInputs: {
        statePresent: state.length > 0,
        authorizationCodePresent: authorizationCode.length > 0,
        sellingPartnerIdPresent: sellingPartnerId.length > 0,
        redirectUriPresent: redirectUri.length > 0,
        expectedRedirectUriPresent: expectedRedirectUri.length > 0,
        redirectUriMatchesExpected: expectedRedirectUri.length > 0 && redirectUri === expectedRedirectUri,
        clientIdPresent: clientId.length > 0,
        clientSecretConfigured: input.clientSecretConfigured === true,
        clientSecretFingerprintPresent: clientSecretFingerprint.length > 0,
        tokenEndpointHost: endpointShape.host,
        tokenEndpointPath: endpointShape.path,
        tokenEndpointHttps: endpointShape.valid,
        marketplaceIdPresent: marketplaceId.length > 0,
        regionPresent: region.length > 0,
        companyIdPresent: companyId.length > 0,
        storeIdPresent: storeId.length > 0,
      },
      sanitizedDownstreamResults: {
        requestBodyBuilderSource: requestBodyBuilderResult?.source || null,
        httpTransportSource: httpTransportResult?.source || null,
        requestBodyBuilderReason: requestBodyBuilderResult?.reason || null,
        httpTransportReason: httpTransportResult?.reason || null,
      },
    });

    if (input.configValidatorStatus !== 'ready') {
      return makeResult(
        'config_validator_not_ready',
        'LWA config validator must report ready before exchange chain orchestration.',
        'validate-config',
        [],
      );
    }

    if (!state) {
      return makeResult('missing_state', 'OAuth state is required before exchange chain orchestration.', 'validate-callback-state', ['validate-config']);
    }

    if (!authorizationCode) {
      return makeResult(
        'missing_authorization_code',
        'Authorization code is required before exchange chain orchestration.',
        'validate-callback-state',
        ['validate-config'],
      );
    }

    if (!sellingPartnerId) {
      return makeResult(
        'missing_selling_partner_id',
        'Selling partner id is required before exchange chain orchestration.',
        'validate-callback-state',
        ['validate-config'],
      );
    }

    if (!redirectUri) {
      return makeResult(
        'missing_redirect_uri',
        'Redirect URI is required before exchange chain orchestration.',
        'validate-callback-state',
        ['validate-config'],
      );
    }

    if (expectedRedirectUri && redirectUri !== expectedRedirectUri) {
      return makeResult(
        'mismatched_redirect_uri',
        'Redirect URI must match the authorization URL redirect URI before exchange chain orchestration.',
        'validate-callback-state',
        ['validate-config'],
      );
    }

    if (!clientId) {
      return makeResult(
        'missing_client_id',
        'Client id is required before exchange chain orchestration.',
        'validate-callback-state',
        ['validate-config'],
      );
    }

    if (input.clientSecretConfigured !== true) {
      return makeResult(
        'client_secret_not_configured',
        'Client secret must be configured before exchange chain orchestration.',
        'validate-callback-state',
        ['validate-config'],
      );
    }

    if (!clientSecretFingerprint) {
      return makeResult(
        'missing_client_secret_fingerprint',
        'Client secret fingerprint is required for sanitized exchange chain orchestration.',
        'validate-callback-state',
        ['validate-config'],
      );
    }

    if (!tokenEndpoint) {
      return makeResult(
        'missing_token_endpoint',
        'LWA token endpoint is required before exchange chain orchestration.',
        'validate-callback-state',
        ['validate-config'],
      );
    }

    if (!endpointShape.valid) {
      return makeResult(
        'invalid_token_endpoint',
        'LWA token endpoint must be HTTPS before exchange chain orchestration.',
        'validate-callback-state',
        ['validate-config'],
      );
    }

    if (!marketplaceId) {
      return makeResult(
        'missing_marketplace_id',
        'Marketplace id is required before exchange chain orchestration.',
        'validate-callback-state',
        ['validate-config'],
      );
    }

    if (!region) {
      return makeResult(
        'missing_region',
        'Region is required before exchange chain orchestration.',
        'validate-callback-state',
        ['validate-config'],
      );
    }

    if (!companyId) {
      return makeResult(
        'missing_company_id',
        'Company id is required before exchange chain orchestration.',
        'validate-callback-state',
        ['validate-config'],
      );
    }

    if (!storeId) {
      return makeResult(
        'missing_store_id',
        'Store id is required before exchange chain orchestration.',
        'validate-callback-state',
        ['validate-config'],
      );
    }

    const requestBodyBuilderResult = this.buildRealLwaTokenExchangeRequestBodyLater({
      authorizationCode,
      redirectUri,
      expectedRedirectUri,
      clientId,
      clientSecretConfigured: input.clientSecretConfigured,
      clientSecretFingerprint,
      tokenEndpoint,
      configValidatorStatus: input.configValidatorStatus,
      serverSideFeatureGateEnabled: false,
      enableRealLwaHttpTransport: false,
    });

    if (requestBodyBuilderResult.source !== 'amazon-sp-api-lwa-request-body-builder-disabled') {
      return makeResult(
        'request_body_builder_not_ready',
        'LWA request body builder did not return the expected sanitized disabled result.',
        'build-request-body',
        ['validate-config', 'validate-callback-state'],
        requestBodyBuilderResult,
      );
    }

    const httpTransportResult = this.executeRealLwaTokenExchangeHttpLater({
      tokenEndpoint,
      requestBodyPrepared: requestBodyBuilderResult.requestBodyBuilderPreparedNow,
      requestBodyFingerprint:
        requestBodyBuilderResult.sanitizedRequestBodyShape.encodedBodySha256 || '',
      requestBodyLength: requestBodyBuilderResult.sanitizedRequestBodyShape.encodedBodyLength,
      contentType: requestBodyBuilderResult.sanitizedRequestBodyShape.contentType,
      method: requestBodyBuilderResult.sanitizedRequestBodyShape.method,
      configValidatorStatus: input.configValidatorStatus,
      requestBodyBuilderStatus: 'ready',
      serverSideFeatureGateEnabled: false,
      enableRealLwaHttpTransport: false,
    });

    if (httpTransportResult.source !== 'amazon-sp-api-lwa-http-transport-disabled') {
      return makeResult(
        'http_transport_not_ready',
        'LWA HTTP transport did not return the expected sanitized disabled result.',
        'execute-http-transport',
        ['validate-config', 'validate-callback-state', 'build-request-body'],
        requestBodyBuilderResult,
        httpTransportResult,
      );
    }

    if (input.serverSideFeatureGateEnabled !== false || input.enableRealLwaHttpTransport !== false) {
      return makeResult(
        'exchange_chain_disabled',
        'Real LWA exchange chain remains disabled by default in Step136-K.',
        'feature-gate',
        ['validate-config', 'validate-callback-state', 'build-request-body', 'execute-http-transport'],
        requestBodyBuilderResult,
        httpTransportResult,
      );
    }

    return makeResult(
      'server_side_feature_gate_disabled',
      'Server-side real LWA exchange chain feature gate is disabled in Step136-K.',
      'feature-gate',
      ['validate-config', 'validate-callback-state', 'build-request-body', 'execute-http-transport'],
      requestBodyBuilderResult,
      httpTransportResult,
    );
  }

  executeRealLwaTokenExchangeHttpLater(
    input: AmazonSpApiLwaHttpTransportDisabledInput,
  ): AmazonSpApiLwaHttpTransportDisabledResult {
    const tokenEndpoint = normalize(input.tokenEndpoint);
    const requestBodyFingerprint = normalize(input.requestBodyFingerprint);
    const endpointShape = parseHttpsEndpointShape(tokenEndpoint);

    const sanitizedHttpTransportShape: AmazonSpApiLwaHttpTransportDisabledResult['sanitizedHttpTransportShape'] =
      {
        method: 'POST',
        tokenEndpointHost: endpointShape.host,
        tokenEndpointPath: endpointShape.path,
        contentType: 'application/x-www-form-urlencoded',
        timeoutMs: 10000,
        maxAttempts: 1,
        executableClientUsedNow: false,
        requestBodyPrepared: input.requestBodyPrepared === true,
        requestBodyFingerprintPresent: requestBodyFingerprint.length > 0,
        requestBodyLength: Number.isFinite(input.requestBodyLength)
          ? Math.max(0, Math.floor(input.requestBodyLength))
          : 0,
        responseBodyParsedNow: false,
        nextImplementationStep: 'Step136-L',
      };

    const sanitizedEnablementGate: AmazonSpApiLwaHttpTransportDisabledResult['sanitizedEnablementGate'] =
      {
        configValidatorReady: input.configValidatorStatus === 'ready',
        requestBodyBuilderReady: input.requestBodyBuilderStatus === 'ready',
        serverSideFeatureGateEnabled: false,
        envFlagAloneAccepted: false,
        realLwaHttpTransportEnabled: false,
      };

    const disabled = (
      reason: AmazonSpApiLwaHttpTransportDisabledResult['reason'],
      messageRedacted: string,
    ): AmazonSpApiLwaHttpTransportDisabledResult => ({
      accepted: false,
      source: 'amazon-sp-api-lwa-http-transport-disabled',
      reason,
      messageRedacted,
      httpTransportPreparedNow: true,
      httpTransportImplementedNow: true,
      httpExecutedNow: false,
      requestBodyConstructedNow: false,
      requestBodyLoggedNow: false,
      rawRequestBodyReturnedNow: false,
      rawLwaResponseParsedNow: false,
      rawLwaResponseLoggedNow: false,
      rawLwaResponseReturnedNow: false,
      tokenExchangeHttpCallNow: false,
      lwaHttpCallNow: false,
      realSpApiRequestNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      rawAuthorizationCodeReturnedNow: false,
      rawClientIdReturnedNow: false,
      rawClientSecretReturnedNow: false,
      rawAccessTokenReturnedNow: false,
      rawRefreshTokenReturnedNow: false,
      sanitizedHttpTransportShape,
      sanitizedEnablementGate,
    });

    if (input.configValidatorStatus !== 'ready') {
      return disabled(
        'config_validator_not_ready',
        'LWA config validator must report ready before HTTP transport can be enabled.',
      );
    }

    if (input.requestBodyBuilderStatus !== 'ready' || input.requestBodyPrepared !== true) {
      return disabled(
        'request_body_builder_not_ready',
        'LWA request body builder must be ready before HTTP transport can be enabled.',
      );
    }

    if (input.serverSideFeatureGateEnabled !== false || input.enableRealLwaHttpTransport !== false) {
      return disabled(
        'http_transport_disabled',
        'Real LWA HTTP transport remains disabled by default in Step136-H.',
      );
    }

    if (!tokenEndpoint) {
      return disabled('missing_token_endpoint', 'LWA token endpoint is required before HTTP transport.');
    }

    if (!endpointShape.valid) {
      return disabled(
        'invalid_token_endpoint',
        'LWA token endpoint must be HTTPS before HTTP transport.',
      );
    }

    if (!requestBodyFingerprint) {
      return disabled(
        'missing_request_body_fingerprint',
        'Sanitized request body fingerprint is required before HTTP transport.',
      );
    }

    if (!Number.isFinite(input.requestBodyLength) || input.requestBodyLength <= 0) {
      return disabled(
        'invalid_request_body_length',
        'Sanitized request body length must be positive before HTTP transport.',
      );
    }

    if (input.contentType !== 'application/x-www-form-urlencoded') {
      return disabled(
        'invalid_content_type',
        'LWA HTTP transport requires application/x-www-form-urlencoded content type.',
      );
    }

    if (input.method !== 'POST') {
      return disabled('invalid_method', 'LWA HTTP transport requires POST method.');
    }

    return disabled(
      'server_side_feature_gate_disabled',
      'Server-side real LWA HTTP transport feature gate is disabled in Step136-H.',
    );
  }

  buildRealLwaTokenExchangeRequestBodyLater(
    input: AmazonSpApiLwaRequestBodyBuilderDisabledInput,
  ): AmazonSpApiLwaRequestBodyBuilderDisabledResult {
    const authorizationCode = normalize(input.authorizationCode);
    const redirectUri = normalize(input.redirectUri);
    const expectedRedirectUri = normalize(input.expectedRedirectUri);
    const clientId = normalize(input.clientId);
    const clientSecretFingerprint = normalize(input.clientSecretFingerprint);
    const tokenEndpoint = normalize(input.tokenEndpoint);
    const endpointShape = parseHttpsEndpointShape(tokenEndpoint);

    const sortedFieldOrder = [
      'grant_type',
      'code',
      'redirect_uri',
      'client_id',
      'client_secret',
    ] as const;

    const bodyShapeSeed = [
      'grant_type=authorization_code',
      `code_present=${authorizationCode.length > 0}`,
      `redirect_uri_present=${redirectUri.length > 0}`,
      `client_id_present=${clientId.length > 0}`,
      `client_secret_present=${input.clientSecretConfigured === true}`,
      `client_secret_fingerprint_present=${clientSecretFingerprint.length > 0}`,
    ].join('&');

    const sanitizedRequestBodyShape: AmazonSpApiLwaRequestBodyBuilderDisabledResult['sanitizedRequestBodyShape'] =
      {
        contentType: 'application/x-www-form-urlencoded',
        encodingApi: 'URLSearchParams',
        method: 'POST',
        tokenEndpointHost: endpointShape.host,
        tokenEndpointPath: endpointShape.path,
        sortedFieldOrder,
        grantType: 'authorization_code',
        fieldPresence: {
          grantType: true,
          code: authorizationCode.length > 0,
          redirectUri: redirectUri.length > 0,
          clientId: clientId.length > 0,
          clientSecret: input.clientSecretConfigured === true,
        },
        encodedBodyLength: bodyShapeSeed.length,
        encodedBodySha256: sanitizedBodyFingerprint(bodyShapeSeed),
        rawBodyAvailableOnlyInsideBuilder: false,
        nextImplementationStep: 'Step136-L',
      };

    const sanitizedEnablementGate: AmazonSpApiLwaRequestBodyBuilderDisabledResult['sanitizedEnablementGate'] =
      {
        configValidatorReady: input.configValidatorStatus === 'ready',
        serverSideFeatureGateEnabled: false,
        envFlagAloneAccepted: false,
        realLwaHttpTransportEnabled: false,
      };

    const disabled = (
      reason: AmazonSpApiLwaRequestBodyBuilderDisabledResult['reason'],
      messageRedacted: string,
    ): AmazonSpApiLwaRequestBodyBuilderDisabledResult => ({
      accepted: false,
      source: 'amazon-sp-api-lwa-request-body-builder-disabled',
      reason,
      messageRedacted,
      requestBodyBuilderPreparedNow: true,
      requestBodyConstructedNow: false,
      requestBodyLoggedNow: false,
      requestBodyReturnedToControllerNow: false,
      requestBodyReturnedToFrontendNow: false,
      tokenExchangeHttpCallNow: false,
      lwaHttpCallNow: false,
      realSpApiRequestNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      rawAuthorizationCodeReturnedNow: false,
      rawClientIdReturnedNow: false,
      rawClientSecretReturnedNow: false,
      rawRequestBodyReturnedNow: false,
      sanitizedRequestBodyShape,
      sanitizedEnablementGate,
    });

    if (input.configValidatorStatus !== 'ready') {
      return disabled(
        'config_validator_not_ready',
        'LWA config validator must report ready before request body builder can be enabled.',
      );
    }

    if (input.serverSideFeatureGateEnabled !== false || input.enableRealLwaHttpTransport !== false) {
      return disabled(
        'request_body_builder_disabled',
        'LWA request body builder remains disabled by default in Step136-E.',
      );
    }

    if (!authorizationCode) {
      return disabled(
        'missing_authorization_code',
        'Authorization code presence is required before LWA request body building.',
      );
    }

    if (!redirectUri) {
      return disabled(
        'missing_redirect_uri',
        'Redirect URI is required before LWA request body building.',
      );
    }

    if (expectedRedirectUri && redirectUri !== expectedRedirectUri) {
      return disabled(
        'mismatched_redirect_uri',
        'Redirect URI must match the authorization URL redirect URI before LWA request body building.',
      );
    }

    if (!clientId) {
      return disabled(
        'missing_client_id',
        'Client id presence is required before LWA request body building.',
      );
    }

    if (input.clientSecretConfigured !== true) {
      return disabled(
        'client_secret_not_configured',
        'Client secret presence is required before LWA request body building.',
      );
    }

    if (!clientSecretFingerprint) {
      return disabled(
        'missing_client_secret_fingerprint',
        'Client secret fingerprint is required for sanitized request body builder diagnostics.',
      );
    }

    if (!tokenEndpoint) {
      return disabled(
        'missing_token_endpoint',
        'LWA token endpoint is required before LWA request body building.',
      );
    }

    if (!endpointShape.valid) {
      return disabled(
        'invalid_token_endpoint',
        'LWA token endpoint must be HTTPS before LWA request body building.',
      );
    }

    return disabled(
      'server_side_feature_gate_disabled',
      'Server-side real LWA request body builder feature gate is disabled in Step136-E.',
    );
  }

  prepareRealLwaHttpExchangeRequestDisabled(
    input: AmazonSpApiRealLwaHttpClientDisabledInput,
  ): AmazonSpApiRealLwaHttpClientDisabledResult {
    const state = normalize(input.state);
    const authorizationCode = normalize(input.authorizationCode);
    const sellingPartnerId = normalize(input.sellingPartnerId);
    const redirectUri = normalize(input.redirectUri);
    const clientId = normalize(input.clientId);
    const tokenEndpoint = normalize(input.tokenEndpoint);
    const marketplaceId = normalize(input.marketplaceId);
    const region = normalize(input.region);
    const companyId = normalize(input.companyId);
    const storeId = normalize(input.storeId);
    const endpointShape = parseHttpsEndpointShape(tokenEndpoint);

    const sanitizedHttpRequestShape: AmazonSpApiRealLwaHttpClientDisabledResult['sanitizedHttpRequestShape'] =
      {
        method: 'POST',
        tokenEndpointHost: endpointShape.host,
        tokenEndpointPath: endpointShape.path,
        contentType: 'application/x-www-form-urlencoded',
        grantType: 'authorization_code',
        formFieldPresence: {
          grantType: true,
          authorizationCode: authorizationCode.length > 0,
          redirectUri: redirectUri.length > 0,
          clientId: clientId.length > 0,
          clientSecret: input.clientSecretConfigured === true,
        },
        requestBodyConstructedNow: false,
        requestBodyLoggedNow: false,
        responseBodyParsedNow: false,
        nextImplementationStep: 'Step136-L',
      };

    const sanitizedEnablementGate: AmazonSpApiRealLwaHttpClientDisabledResult['sanitizedEnablementGate'] =
      {
        configValidatorReady: input.configValidatorStatus === 'ready',
        serverSideFeatureGateEnabled: false,
        envFlagAloneAccepted: false,
        realLwaHttpTransportEnabled: false,
      };

    const disabled = (
      reason: AmazonSpApiRealLwaHttpClientDisabledResult['reason'],
      messageRedacted: string,
    ): AmazonSpApiRealLwaHttpClientDisabledResult => ({
      accepted: false,
      source: 'amazon-sp-api-real-lwa-http-client-disabled-by-default',
      reason,
      messageRedacted,
      transportMode: 'real-lwa-http-disabled',
      httpClientPreparedNow: true,
      tokenExchangeHttpCallNow: false,
      lwaHttpCallNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      realSpApiRequestNow: false,
      rawAuthorizationCodeReturnedNow: false,
      rawClientIdReturnedNow: false,
      rawClientSecretReturnedNow: false,
      rawRefreshTokenReturnedNow: false,
      rawAccessTokenReturnedNow: false,
      sanitizedHttpRequestShape,
      sanitizedEnablementGate,
    });

    if (input.configValidatorStatus !== 'ready') {
      return disabled(
        'config_validator_not_ready',
        'LWA config validator must report ready before real LWA HTTP exchange can be enabled.',
      );
    }

    if (input.serverSideFeatureGateEnabled !== false || input.enableRealLwaHttpTransport !== false) {
      return disabled(
        'real_lwa_http_disabled',
        'Real LWA HTTP transport remains disabled by default in Step136-B.',
      );
    }

    if (!state) {
      return disabled('missing_state', 'OAuth state is required before LWA HTTP request preparation.');
    }

    if (!authorizationCode) {
      return disabled(
        'missing_authorization_code',
        'Authorization code presence is required before LWA HTTP request preparation.',
      );
    }

    if (!sellingPartnerId) {
      return disabled(
        'missing_selling_partner_id',
        'Selling partner id is required before LWA HTTP request preparation.',
      );
    }

    if (!redirectUri) {
      return disabled(
        'missing_redirect_uri',
        'Redirect URI is required before LWA HTTP request preparation.',
      );
    }

    if (!clientId) {
      return disabled('missing_client_id', 'Client id presence is required before LWA HTTP request preparation.');
    }

    if (input.clientSecretConfigured !== true) {
      return disabled(
        'client_secret_not_configured',
        'Client secret presence is required before LWA HTTP request preparation.',
      );
    }

    if (!tokenEndpoint) {
      return disabled(
        'missing_token_endpoint',
        'LWA token endpoint is required before LWA HTTP request preparation.',
      );
    }

    if (!endpointShape.valid) {
      return disabled(
        'invalid_token_endpoint',
        'LWA token endpoint must be HTTPS before LWA HTTP request preparation.',
      );
    }

    if (!marketplaceId) {
      return disabled(
        'missing_marketplace_id',
        'Marketplace id is required before LWA HTTP request preparation.',
      );
    }

    if (!region) {
      return disabled('missing_region', 'Region is required before LWA HTTP request preparation.');
    }

    if (!companyId) {
      return disabled('missing_company_id', 'Company id is required before LWA HTTP request preparation.');
    }

    if (!storeId) {
      return disabled('missing_store_id', 'Store id is required before LWA HTTP request preparation.');
    }

    return disabled(
      'server_side_feature_gate_disabled',
      'Server-side real LWA HTTP feature gate is disabled in Step136-B.',
    );
  }

  exchangeAuthorizationCodeWithLwaLater(
    input: AmazonSpApiRealLwaTokenExchangeDisabledInput,
  ): AmazonSpApiRealLwaTokenExchangeDisabledResult {
    const state = normalize(input.state);
    const authorizationCode = normalize(input.authorizationCode);
    const sellingPartnerId = normalize(input.sellingPartnerId);
    const redirectUri = normalize(input.redirectUri);
    const clientId = normalize(input.clientId);
    const marketplaceId = normalize(input.marketplaceId);
    const region = normalize(input.region);
    const companyId = normalize(input.companyId);
    const storeId = normalize(input.storeId);

    const sanitizedResult = {
      statePresent: state.length > 0,
      authorizationCodePresent: authorizationCode.length > 0,
      sellingPartnerIdPresent: sellingPartnerId.length > 0,
      redirectUriPresent: redirectUri.length > 0,
      clientIdPresent: clientId.length > 0,
      clientSecretConfigured: input.clientSecretConfigured === true,
      marketplaceIdPresent: marketplaceId.length > 0,
      regionPresent: region.length > 0,
      companyIdPresent: companyId.length > 0,
      storeIdPresent: storeId.length > 0,
      realLwaHttpTransportEnabled: false as const,
      nextImplementationStep: 'Step136-L' as const,
    };

    const disabled = (
      reason: AmazonSpApiRealLwaTokenExchangeDisabledResult['reason'],
      messageRedacted: string,
    ): AmazonSpApiRealLwaTokenExchangeDisabledResult => ({
      accepted: false,
      source: 'amazon-sp-api-token-exchange-real-lwa-disabled-skeleton',
      reason,
      messageRedacted,
      transportMode: 'real-lwa-disabled',
      tokenExchangeHttpCallNow: false,
      lwaHttpCallNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      realSpApiRequestNow: false,
      rawRefreshTokenReturnedNow: false,
      rawAccessTokenReturnedNow: false,
      clientSecretReturnedNow: false,
      sanitizedResult,
    });

    if (!state) {
      return disabled('missing_state', 'OAuth state is required before real LWA token exchange.');
    }

    if (!authorizationCode) {
      return disabled(
        'missing_authorization_code',
        'Authorization code is required before real LWA token exchange.',
      );
    }

    if (!sellingPartnerId) {
      return disabled(
        'missing_selling_partner_id',
        'Selling partner id is required before real LWA token exchange.',
      );
    }

    if (!redirectUri) {
      return disabled('missing_redirect_uri', 'Redirect URI is required before real LWA token exchange.');
    }

    if (!clientId) {
      return disabled('missing_client_id', 'Client id is required before real LWA token exchange.');
    }

    if (input.clientSecretConfigured !== true) {
      return disabled(
        'client_secret_not_configured',
        'Client secret must be configured on the server before real LWA token exchange.',
      );
    }

    if (!marketplaceId) {
      return disabled(
        'missing_marketplace_id',
        'Marketplace id is required before real LWA token exchange.',
      );
    }

    if (!region) {
      return disabled('missing_region', 'Region is required before real LWA token exchange.');
    }

    if (!companyId) {
      return disabled('missing_company_id', 'Company id is required before real LWA token exchange.');
    }

    if (!storeId) {
      return disabled('missing_store_id', 'Store id is required before real LWA token exchange.');
    }

    return disabled(
      'real_lwa_transport_disabled',
      'Real Amazon LWA token exchange transport is intentionally disabled until Step136-L.',
    );
  }

  exchangeAuthorizationCodeDryRunnable(
    input: AmazonSpApiTokenExchangeDryRunInput,
  ): AmazonSpApiTokenExchangeDryRunResult {
    const state = normalize(input.state);
    const authorizationCode = normalize(input.authorizationCode);
    const sellingPartnerId = normalize(input.sellingPartnerId);
    const redirectUri = normalize(input.redirectUri);
    const clientId = normalize(input.clientId);
    const marketplaceId = normalize(input.marketplaceId);
    const region = normalize(input.region);
    const companyId = normalize(input.companyId);
    const storeId = normalize(input.storeId);

    if (input.dryRun !== true) {
      return reject('dry_run_required', 'Token exchange fake transport requires dryRun=true.');
    }

    if (!state) {
      return reject('missing_state', 'OAuth state is required.');
    }

    if (!authorizationCode) {
      return reject('missing_authorization_code', 'Authorization code is required.');
    }

    if (!sellingPartnerId) {
      return reject('missing_selling_partner_id', 'Selling partner id is required.');
    }

    if (!redirectUri) {
      return reject('missing_redirect_uri', 'Redirect URI is required.');
    }

    if (!clientId) {
      return reject('missing_client_id', 'Client id is required.');
    }

    if (input.clientSecretConfigured !== true) {
      return reject('client_secret_not_configured', 'Client secret must be configured on the server.');
    }

    if (!marketplaceId) {
      return reject('missing_marketplace_id', 'Marketplace id is required.');
    }

    if (!region) {
      return reject('missing_region', 'Region is required.');
    }

    if (!companyId) {
      return reject('missing_company_id', 'Company id is required.');
    }

    if (!storeId) {
      return reject('missing_store_id', 'Store id is required.');
    }

    const seed = [
      state,
      authorizationCode,
      sellingPartnerId,
      redirectUri,
      clientId,
      marketplaceId,
      region,
      companyId,
      storeId,
    ].join('|');

    return {
      accepted: true,
      source: 'amazon-sp-api-token-exchange-fake-transport',
      transportMode: 'fake',
      tokenExchangeHttpCallNow: false,
      lwaHttpCallNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      realSpApiRequestNow: false,
      authorizationCodePresent: true,
      sellingPartnerId,
      marketplaceId,
      region,
      companyId,
      storeId,
      sanitizedTokenEnvelope: {
        encryptedRefreshToken: `fake-encrypted-refresh-${fakeTokenFragment(`refresh|${seed}`)}`,
        encryptedAccessToken: `fake-encrypted-access-${fakeTokenFragment(`access|${seed}`)}`,
        tokenType: 'bearer',
        expiresInSeconds: 3600,
        scope: 'sellingpartnerapi::migration',
        encryptionKeyId: 'fake-key-step128-b',
        encryptionAlgorithm: 'fake-none',
        tokenVersion: 1,
      },
      sanitizedResult: {
        sellingPartnerId,
        marketplaceId,
        region,
        companyId,
        storeId,
        tokenExchangePendingRealTransport: true,
        tokenPersistencePendingCallbackIntegration: true,
      },
    };
  }
}
