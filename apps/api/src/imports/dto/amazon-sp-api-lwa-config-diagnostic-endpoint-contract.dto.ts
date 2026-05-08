export type AmazonSpApiLwaConfigDiagnosticEndpointStep = 'Step135-F';

export type AmazonSpApiLwaConfigDiagnosticEndpointContract = {
  readonly source: 'amazon-sp-api-lwa-config-diagnostic-endpoint-contract';
  readonly step: AmazonSpApiLwaConfigDiagnosticEndpointStep;
  readonly phase: 'contract-only';
  readonly plannedRoute: '/api/imports/internal/amazon-sp-api/lwa-config/status';
  readonly plannedMethod: 'GET';
  readonly plannedController: 'ImportsController';
  readonly plannedService: 'AmazonSpApiLwaEnvConfigValidationService.validateFromProcessEnv';
  readonly requiredGuard: 'JwtAuthGuard';
  readonly requiredCompanyScope: true;
  readonly internalOnly: true;
  readonly frontendExposedNow: false;
  readonly controllerImplementedNow: false;
  readonly routeMappedNow: false;
  readonly expectedUnauthenticatedStatusAfterImplementation: 401;
  readonly expectedAuthenticatedShape: {
    readonly source: 'amazon-sp-api-lwa-env-config-validation-service';
    readonly status: 'ready | missing_required_env | invalid_env';
    readonly readyForRealLwaHttpTransport: boolean;
    readonly clientIdPresent: boolean;
    readonly clientSecretPresent: boolean;
    readonly redirectUriPresent: boolean;
    readonly marketplaceId: string;
    readonly region: string;
    readonly tokenEndpointHost: string | null;
    readonly environment: 'production | sandbox | unknown';
    readonly realHttpEnabled: false;
    readonly missingRequiredEnv: readonly string[];
    readonly invalidEnv: readonly string[];
  };
  readonly forbiddenResponseFields: readonly [
    'clientId',
    'clientSecret',
    'accessToken',
    'refreshToken',
    'lwa_client_secret',
    'amazon_refresh_token',
    'authorizationCode',
  ];
  readonly safetyFlags: {
    readonly tokenExchangeHttpCallNow: false;
    readonly lwaHttpCallNow: false;
    readonly realSpApiRequestNow: false;
    readonly tokenPersistenceDatabaseWriteNow: false;
    readonly importJobWriteNow: false;
    readonly transactionWriteNow: false;
    readonly inventoryWriteNow: false;
    readonly rawClientSecretReturnedNow: false;
    readonly rawClientIdReturnedNow: false;
    readonly rawRefreshTokenReturnedNow: false;
    readonly rawAccessTokenReturnedNow: false;
  };
  readonly explicitNonGoals: {
    readonly implementsControllerRouteNow: false;
    readonly changesOAuthCallbackRouteNow: false;
    readonly injectsValidatorIntoControllerNow: false;
    readonly changesFrontendNow: false;
    readonly enablesRealLwaHttpNow: false;
    readonly callsLwaTokenEndpointNow: false;
    readonly callsAmazonReportsApiNow: false;
    readonly createsImportJobNow: false;
    readonly createsTransactionNow: false;
    readonly createsInventoryMovementNow: false;
    readonly returnsRawSecretNow: false;
  };
};

export const amazonSpApiLwaConfigDiagnosticEndpointContract: AmazonSpApiLwaConfigDiagnosticEndpointContract =
  {
    source: 'amazon-sp-api-lwa-config-diagnostic-endpoint-contract',
    step: 'Step135-F',
    phase: 'contract-only',
    plannedRoute: '/api/imports/internal/amazon-sp-api/lwa-config/status',
    plannedMethod: 'GET',
    plannedController: 'ImportsController',
    plannedService:
      'AmazonSpApiLwaEnvConfigValidationService.validateFromProcessEnv',
    requiredGuard: 'JwtAuthGuard',
    requiredCompanyScope: true,
    internalOnly: true,
    frontendExposedNow: false,
    controllerImplementedNow: false,
    routeMappedNow: false,
    expectedUnauthenticatedStatusAfterImplementation: 401,
    expectedAuthenticatedShape: {
      source: 'amazon-sp-api-lwa-env-config-validation-service',
      status: 'ready | missing_required_env | invalid_env',
      readyForRealLwaHttpTransport: false,
      clientIdPresent: false,
      clientSecretPresent: false,
      redirectUriPresent: false,
      marketplaceId: 'A1VC38T7YXB528',
      region: 'JP',
      tokenEndpointHost: null,
      environment: 'production | sandbox | unknown',
      realHttpEnabled: false,
      missingRequiredEnv: [],
      invalidEnv: [],
    },
    forbiddenResponseFields: [
      'clientId',
      'clientSecret',
      'accessToken',
      'refreshToken',
      'lwa_client_secret',
      'amazon_refresh_token',
      'authorizationCode',
    ],
    safetyFlags: {
      tokenExchangeHttpCallNow: false,
      lwaHttpCallNow: false,
      realSpApiRequestNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      importJobWriteNow: false,
      transactionWriteNow: false,
      inventoryWriteNow: false,
      rawClientSecretReturnedNow: false,
      rawClientIdReturnedNow: false,
      rawRefreshTokenReturnedNow: false,
      rawAccessTokenReturnedNow: false,
    },
    explicitNonGoals: {
      implementsControllerRouteNow: false,
      changesOAuthCallbackRouteNow: false,
      injectsValidatorIntoControllerNow: false,
      changesFrontendNow: false,
      enablesRealLwaHttpNow: false,
      callsLwaTokenEndpointNow: false,
      callsAmazonReportsApiNow: false,
      createsImportJobNow: false,
      createsTransactionNow: false,
      createsInventoryMovementNow: false,
      returnsRawSecretNow: false,
    },
  };
