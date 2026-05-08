export type AmazonSpApiOAuthTokenExchangeBoundaryStep = 'Step135-A';

export type AmazonSpApiOAuthTokenExchangeBoundaryCredentialSource =
  | 'server_environment'
  | 'secret_manager_later';

export type AmazonSpApiOAuthTokenExchangeBoundaryInput = {
  readonly state: 'required';
  readonly spapi_oauth_code: 'required-preferred';
  readonly code: 'optional-fallback';
  readonly selling_partner_id: 'required';
  readonly marketplaceId: 'default-A1VC38T7YXB528';
  readonly region: 'default-JP';
  readonly storeId: 'required-from-state-or-request-scope';
  readonly companyId: 'required-from-authenticated-state';
  readonly redirectUri: 'must-match-authorization-url-redirect-uri';
};

export type AmazonSpApiOAuthTokenExchangeBoundarySecurity = {
  readonly validateOAuthStateBeforeExchange: true;
  readonly rejectMissingState: true;
  readonly rejectMissingAuthorizationCode: true;
  readonly rejectMissingSellingPartnerId: true;
  readonly rejectMismatchedCompanyId: true;
  readonly rejectMismatchedStoreId: true;
  readonly rejectMismatchedMarketplaceId: true;
  readonly rejectMismatchedRegion: true;
  readonly redactAuthorizationCodeInLogs: true;
  readonly redactRefreshTokenInLogs: true;
  readonly redactAccessTokenInLogs: true;
  readonly redactClientSecretInLogs: true;
  readonly neverReturnRawRefreshTokenToFrontend: true;
  readonly neverReturnRawAccessTokenToFrontend: true;
  readonly neverReturnClientSecretToFrontend: true;
};

export type AmazonSpApiOAuthTokenExchangeBoundaryTransport = {
  readonly currentTransport: 'fake-dry-run';
  readonly nextTransport: 'real-lwa-http-client-later';
  readonly credentialSource: AmazonSpApiOAuthTokenExchangeBoundaryCredentialSource;
  readonly lwaTokenEndpointHost: 'api.amazon.com';
  readonly lwaTokenEndpointPath: '/auth/o2/token';
  readonly grantType: 'authorization_code';
  readonly tokenExchangeHttpCallNow: false;
  readonly lwaHttpCallNow: false;
  readonly realSpApiRequestNow: false;
};

export type AmazonSpApiOAuthTokenExchangeBoundaryPersistence = {
  readonly existingCallbackMayPersistFakeEncryptedCredential: true;
  readonly step135AAddsNewPersistenceWrite: false;
  readonly step135AChangesPersistenceSchema: false;
  readonly step135AChangesCallbackRuntimeBehavior: false;
  readonly futureRealExchangePersistenceRequiresEncryptedRefreshToken: true;
  readonly futureRealExchangePersistenceRequiresEncryptedAccessTokenCache: true;
  readonly futureRealExchangeMustNotStorePlaintextToken: true;
};

export type AmazonSpApiOAuthTokenExchangeBoundaryNonGoals = {
  readonly implementsRealLwaHttpClientNow: false;
  readonly callsLwaTokenEndpointNow: false;
  readonly changesOAuthCallbackRouteNow: false;
  readonly changesTokenPersistenceNow: false;
  readonly changesConnectionStatusEndpointNow: false;
  readonly callsAmazonReportsApiNow: false;
  readonly createsImportJobNow: false;
  readonly createsImportStagingRowNow: false;
  readonly createsTransactionNow: false;
  readonly createsInventoryMovementNow: false;
  readonly changesFrontendNow: false;
};

export type AmazonSpApiOAuthTokenExchangeBoundaryContract = {
  readonly source: 'amazon-sp-api-oauth-token-exchange-boundary-contract';
  readonly step: AmazonSpApiOAuthTokenExchangeBoundaryStep;
  readonly phase: 'contract-only';
  readonly callbackRoute: '/api/imports/amazon-sp-api/oauth/callback';
  readonly currentExchangeService: 'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeDryRunnable';
  readonly futureExchangeService: 'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeWithLwaLater';
  readonly input: AmazonSpApiOAuthTokenExchangeBoundaryInput;
  readonly security: AmazonSpApiOAuthTokenExchangeBoundarySecurity;
  readonly transport: AmazonSpApiOAuthTokenExchangeBoundaryTransport;
  readonly persistence: AmazonSpApiOAuthTokenExchangeBoundaryPersistence;
  readonly explicitNonGoals: AmazonSpApiOAuthTokenExchangeBoundaryNonGoals;
  readonly statusAfterSuccessfulFutureExchange: 'token_persistence_completed';
  readonly frontendReturnTo: '/ja/app/data/import';
  readonly connectionStatusRouteAfterExchange: '/api/imports/amazon-sp-api/connection/status';
};

export const amazonSpApiOAuthTokenExchangeBoundaryContract: AmazonSpApiOAuthTokenExchangeBoundaryContract =
  {
    source: 'amazon-sp-api-oauth-token-exchange-boundary-contract',
    step: 'Step135-A',
    phase: 'contract-only',
    callbackRoute: '/api/imports/amazon-sp-api/oauth/callback',
    currentExchangeService:
      'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeDryRunnable',
    futureExchangeService:
      'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeWithLwaLater',
    input: {
      state: 'required',
      spapi_oauth_code: 'required-preferred',
      code: 'optional-fallback',
      selling_partner_id: 'required',
      marketplaceId: 'default-A1VC38T7YXB528',
      region: 'default-JP',
      storeId: 'required-from-state-or-request-scope',
      companyId: 'required-from-authenticated-state',
      redirectUri: 'must-match-authorization-url-redirect-uri',
    },
    security: {
      validateOAuthStateBeforeExchange: true,
      rejectMissingState: true,
      rejectMissingAuthorizationCode: true,
      rejectMissingSellingPartnerId: true,
      rejectMismatchedCompanyId: true,
      rejectMismatchedStoreId: true,
      rejectMismatchedMarketplaceId: true,
      rejectMismatchedRegion: true,
      redactAuthorizationCodeInLogs: true,
      redactRefreshTokenInLogs: true,
      redactAccessTokenInLogs: true,
      redactClientSecretInLogs: true,
      neverReturnRawRefreshTokenToFrontend: true,
      neverReturnRawAccessTokenToFrontend: true,
      neverReturnClientSecretToFrontend: true,
    },
    transport: {
      currentTransport: 'fake-dry-run',
      nextTransport: 'real-lwa-http-client-later',
      credentialSource: 'server_environment',
      lwaTokenEndpointHost: 'api.amazon.com',
      lwaTokenEndpointPath: '/auth/o2/token',
      grantType: 'authorization_code',
      tokenExchangeHttpCallNow: false,
      lwaHttpCallNow: false,
      realSpApiRequestNow: false,
    },
    persistence: {
      existingCallbackMayPersistFakeEncryptedCredential: true,
      step135AAddsNewPersistenceWrite: false,
      step135AChangesPersistenceSchema: false,
      step135AChangesCallbackRuntimeBehavior: false,
      futureRealExchangePersistenceRequiresEncryptedRefreshToken: true,
      futureRealExchangePersistenceRequiresEncryptedAccessTokenCache: true,
      futureRealExchangeMustNotStorePlaintextToken: true,
    },
    explicitNonGoals: {
      implementsRealLwaHttpClientNow: false,
      callsLwaTokenEndpointNow: false,
      changesOAuthCallbackRouteNow: false,
      changesTokenPersistenceNow: false,
      changesConnectionStatusEndpointNow: false,
      callsAmazonReportsApiNow: false,
      createsImportJobNow: false,
      createsImportStagingRowNow: false,
      createsTransactionNow: false,
      createsInventoryMovementNow: false,
      changesFrontendNow: false,
    },
    statusAfterSuccessfulFutureExchange: 'token_persistence_completed',
    frontendReturnTo: '/ja/app/data/import',
    connectionStatusRouteAfterExchange:
      '/api/imports/amazon-sp-api/connection/status',
  };
