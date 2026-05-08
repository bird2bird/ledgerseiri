export type AmazonSpApiLwaEnvConfigValidationStep = 'Step135-C';

export type AmazonSpApiLwaRequiredEnvName =
  | 'AMAZON_SP_API_LWA_CLIENT_ID'
  | 'AMAZON_SP_API_LWA_CLIENT_SECRET'
  | 'AMAZON_SP_API_OAUTH_REDIRECT_URI'
  | 'AMAZON_SP_API_MARKETPLACE_ID'
  | 'AMAZON_SP_API_REGION';

export type AmazonSpApiLwaOptionalEnvName =
  | 'AMAZON_SP_API_LWA_TOKEN_ENDPOINT'
  | 'AMAZON_SP_API_LWA_ENVIRONMENT'
  | 'AMAZON_SP_API_LWA_ENABLE_REAL_HTTP';

export type AmazonSpApiLwaEnvConfigValidationRule = {
  readonly name: AmazonSpApiLwaRequiredEnvName | AmazonSpApiLwaOptionalEnvName;
  readonly required: boolean;
  readonly secret: boolean;
  readonly defaultValueRedacted?: string;
  readonly validation:
    | 'non-empty-string'
    | 'https-url'
    | 'marketplace-id'
    | 'region-code'
    | 'enum'
    | 'boolean-string';
  readonly exposeRawValueToLogs: false;
  readonly exposeRawValueToFrontend: false;
};

export type AmazonSpApiLwaEnvConfigValidationContract = {
  readonly source: 'amazon-sp-api-lwa-env-config-validation-contract';
  readonly step: AmazonSpApiLwaEnvConfigValidationStep;
  readonly phase: 'contract-only';
  readonly configOwner: 'api-server';
  readonly currentExchangeService: 'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeWithLwaLater';
  readonly requiredEnv: readonly AmazonSpApiLwaRequiredEnvName[];
  readonly optionalEnv: readonly AmazonSpApiLwaOptionalEnvName[];
  readonly defaultTokenEndpoint: 'https://api.amazon.com/auth/o2/token';
  readonly defaultMarketplaceId: 'A1VC38T7YXB528';
  readonly defaultRegion: 'JP';
  readonly defaultRealHttpEnabled: false;
  readonly validationRules: readonly AmazonSpApiLwaEnvConfigValidationRule[];
  readonly sanitizedConfigShape: {
    readonly clientIdPresent: boolean;
    readonly clientSecretPresent: boolean;
    readonly redirectUriPresent: boolean;
    readonly tokenEndpointHost: string | null;
    readonly marketplaceId: string;
    readonly region: string;
    readonly realHttpEnabled: false;
    readonly missingRequiredEnv: readonly AmazonSpApiLwaRequiredEnvName[];
  };
  readonly explicitNonGoals: {
    readonly readsProcessEnvNow: false;
    readonly implementsRuntimeConfigServiceNow: false;
    readonly injectsConfigIntoTokenExchangeServiceNow: false;
    readonly callsLwaTokenEndpointNow: false;
    readonly enablesRealHttpNow: false;
    readonly logsClientSecretNow: false;
    readonly returnsClientSecretToFrontendNow: false;
    readonly changesOAuthCallbackRouteNow: false;
    readonly changesTokenPersistenceNow: false;
    readonly callsAmazonReportsApiNow: false;
    readonly createsImportJobNow: false;
    readonly createsTransactionNow: false;
    readonly createsInventoryMovementNow: false;
  };
};

export const amazonSpApiLwaEnvConfigValidationContract: AmazonSpApiLwaEnvConfigValidationContract =
  {
    source: 'amazon-sp-api-lwa-env-config-validation-contract',
    step: 'Step135-C',
    phase: 'contract-only',
    configOwner: 'api-server',
    currentExchangeService:
      'AmazonSpApiTokenExchangeService.exchangeAuthorizationCodeWithLwaLater',
    requiredEnv: [
      'AMAZON_SP_API_LWA_CLIENT_ID',
      'AMAZON_SP_API_LWA_CLIENT_SECRET',
      'AMAZON_SP_API_OAUTH_REDIRECT_URI',
      'AMAZON_SP_API_MARKETPLACE_ID',
      'AMAZON_SP_API_REGION',
    ],
    optionalEnv: [
      'AMAZON_SP_API_LWA_TOKEN_ENDPOINT',
      'AMAZON_SP_API_LWA_ENVIRONMENT',
      'AMAZON_SP_API_LWA_ENABLE_REAL_HTTP',
    ],
    defaultTokenEndpoint: 'https://api.amazon.com/auth/o2/token',
    defaultMarketplaceId: 'A1VC38T7YXB528',
    defaultRegion: 'JP',
    defaultRealHttpEnabled: false,
    validationRules: [
      {
        name: 'AMAZON_SP_API_LWA_CLIENT_ID',
        required: true,
        secret: false,
        validation: 'non-empty-string',
        exposeRawValueToLogs: false,
        exposeRawValueToFrontend: false,
      },
      {
        name: 'AMAZON_SP_API_LWA_CLIENT_SECRET',
        required: true,
        secret: true,
        validation: 'non-empty-string',
        exposeRawValueToLogs: false,
        exposeRawValueToFrontend: false,
      },
      {
        name: 'AMAZON_SP_API_OAUTH_REDIRECT_URI',
        required: true,
        secret: false,
        validation: 'https-url',
        exposeRawValueToLogs: false,
        exposeRawValueToFrontend: false,
      },
      {
        name: 'AMAZON_SP_API_MARKETPLACE_ID',
        required: true,
        secret: false,
        defaultValueRedacted: 'A1VC38T7YXB528',
        validation: 'marketplace-id',
        exposeRawValueToLogs: false,
        exposeRawValueToFrontend: false,
      },
      {
        name: 'AMAZON_SP_API_REGION',
        required: true,
        secret: false,
        defaultValueRedacted: 'JP',
        validation: 'region-code',
        exposeRawValueToLogs: false,
        exposeRawValueToFrontend: false,
      },
      {
        name: 'AMAZON_SP_API_LWA_TOKEN_ENDPOINT',
        required: false,
        secret: false,
        defaultValueRedacted: 'https://api.amazon.com/auth/o2/token',
        validation: 'https-url',
        exposeRawValueToLogs: false,
        exposeRawValueToFrontend: false,
      },
      {
        name: 'AMAZON_SP_API_LWA_ENVIRONMENT',
        required: false,
        secret: false,
        defaultValueRedacted: 'production',
        validation: 'enum',
        exposeRawValueToLogs: false,
        exposeRawValueToFrontend: false,
      },
      {
        name: 'AMAZON_SP_API_LWA_ENABLE_REAL_HTTP',
        required: false,
        secret: false,
        defaultValueRedacted: 'false',
        validation: 'boolean-string',
        exposeRawValueToLogs: false,
        exposeRawValueToFrontend: false,
      },
    ],
    sanitizedConfigShape: {
      clientIdPresent: false,
      clientSecretPresent: false,
      redirectUriPresent: false,
      tokenEndpointHost: null,
      marketplaceId: 'A1VC38T7YXB528',
      region: 'JP',
      realHttpEnabled: false,
      missingRequiredEnv: [
        'AMAZON_SP_API_LWA_CLIENT_ID',
        'AMAZON_SP_API_LWA_CLIENT_SECRET',
        'AMAZON_SP_API_OAUTH_REDIRECT_URI',
        'AMAZON_SP_API_MARKETPLACE_ID',
        'AMAZON_SP_API_REGION',
      ],
    },
    explicitNonGoals: {
      readsProcessEnvNow: false,
      implementsRuntimeConfigServiceNow: false,
      injectsConfigIntoTokenExchangeServiceNow: false,
      callsLwaTokenEndpointNow: false,
      enablesRealHttpNow: false,
      logsClientSecretNow: false,
      returnsClientSecretToFrontendNow: false,
      changesOAuthCallbackRouteNow: false,
      changesTokenPersistenceNow: false,
      callsAmazonReportsApiNow: false,
      createsImportJobNow: false,
      createsTransactionNow: false,
      createsInventoryMovementNow: false,
    },
  };
