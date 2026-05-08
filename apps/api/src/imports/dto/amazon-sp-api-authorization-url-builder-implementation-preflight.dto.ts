import {
  assertAmazonSpApiFrontendConnectionStatusPanelContract,
  buildAmazonSpApiFrontendConnectionStatusPanelContract,
  type AmazonSpApiFrontendConnectionStatusPanelContract,
} from './amazon-sp-api-frontend-connection-status-panel-contract.dto';

export const AMAZON_SP_API_AUTHORIZATION_URL_BUILDER_IMPLEMENTATION_PREFLIGHT_VERSION =
  'amazon-sp-api-authorization-url-builder-implementation-preflight-v1' as const;

export type AmazonSpApiAuthorizationUrlPreflightRegion = 'FE' | 'NA' | 'EU';
export type AmazonSpApiAuthorizationUrlPreflightAppMode = 'draft' | 'published';

export type AmazonSpApiAuthorizationUrlPreflightInput = {
  region: AmazonSpApiAuthorizationUrlPreflightRegion;
  marketplaceId: string;
  applicationId: string;
  redirectUri: string;
  allowedRedirectUris: readonly string[];
  state: string;
  appMode: AmazonSpApiAuthorizationUrlPreflightAppMode;
};

export type AmazonSpApiAuthorizationUrlPreflightResult = {
  authorizationUrl: string;
  endpoint: string;
  region: AmazonSpApiAuthorizationUrlPreflightRegion;
  marketplaceId: string;
  applicationId: string;
  redirectUri: string;
  state: string;
  appMode: AmazonSpApiAuthorizationUrlPreflightAppMode;
  query: {
    application_id: string;
    state: string;
    redirect_uri: string;
    version?: 'beta';
  };
  implementationPreflightOnly: true;
  controllerRouteAddedNow: false;
  frontendButtonAddedNow: false;
  browserRedirectNow: false;
  statePersistenceNow: false;
  tokenPersistenceNow: false;
  realAmazonCallNow: false;
};

export type AmazonSpApiAuthorizationUrlBuilderImplementationPreflightContract = {
  version: typeof AMAZON_SP_API_AUTHORIZATION_URL_BUILDER_IMPLEMENTATION_PREFLIGHT_VERSION;
  sourceStep123H: AmazonSpApiFrontendConnectionStatusPanelContract;

  contractOnly: false;
  implementationPreflightOnly: true;
  pureFunctionAddedNow: true;
  backendRouteAddedNow: false;
  frontendComponentAddedNow: false;
  frontendApiClientAddedNow: false;
  buttonHandlerAddedNow: false;
  browserRedirectAddedNow: false;
  statePersistenceNow: false;
  tokenPersistenceNow: false;
  schemaChangedNow: false;
  migrationAddedNow: false;
  realSpApiRequestNow: false;
  writesDatabase: false;

  preflightBoundary: {
    purpose: 'pure-function-authorization-url-builder-preflight-only';
    pureFunctionOnly: true;
    deterministicOutputRequired: true;
    inputValidationRequired: true;
    noNetworkRequired: true;
    noDatabaseRequired: true;
    noControllerRouteRequired: true;
    noFrontendRequired: true;
  };

  endpointContract: {
    feEndpoint: 'https://sellercentral.amazon.co.jp/apps/authorize/consent';
    naEndpoint: 'https://sellercentral.amazon.com/apps/authorize/consent';
    euEndpoint: 'https://sellercentral-europe.amazon.com/apps/authorize/consent';
    japanMarketplaceId: 'A1VC38T7YXB528';
    japanMarketplaceMustUseFeRegion: true;
    regionMarketplaceMismatchRejected: true;
  };

  queryParameterContract: {
    applicationIdRequired: true;
    stateRequired: true;
    redirectUriRequired: true;
    redirectUriAllowlistRequired: true;
    draftModeAddsVersionBeta: true;
    publishedModeOmitsVersionBeta: true;
    unknownInputRejected: true;
  };

  validationContract: {
    blankApplicationIdRejected: true;
    blankStateRejected: true;
    blankRedirectUriRejected: true;
    emptyRedirectAllowlistRejected: true;
    redirectUriNotInAllowlistRejected: true;
    externalRedirectNotInAllowlistRejected: true;
    invalidRegionRejected: true;
    invalidAppModeRejected: true;
    marketplaceRegionMismatchRejected: true;
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
    readyForOauthStateSigningImplementationPreflight: true;
    readyForAuthorizationRouteImplementation: false;
    readyForFrontendConnectButtonImplementation: false;
    readyForActualPrismaSchemaMigration: false;
    readyForTokenPersistenceImplementation: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

const ENDPOINT_BY_REGION: Record<AmazonSpApiAuthorizationUrlPreflightRegion, string> = {
  FE: 'https://sellercentral.amazon.co.jp/apps/authorize/consent',
  NA: 'https://sellercentral.amazon.com/apps/authorize/consent',
  EU: 'https://sellercentral-europe.amazon.com/apps/authorize/consent',
};

const JAPAN_MARKETPLACE_ID = 'A1VC38T7YXB528';

function assertNonBlank(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`Step123-I authorization URL preflight violation: ${label} is required.`);
  }
  return trimmed;
}

function assertKnownRegion(region: string): asserts region is AmazonSpApiAuthorizationUrlPreflightRegion {
  if (region !== 'FE' && region !== 'NA' && region !== 'EU') {
    throw new Error('Step123-I authorization URL preflight violation: invalid region.');
  }
}

function assertKnownAppMode(appMode: string): asserts appMode is AmazonSpApiAuthorizationUrlPreflightAppMode {
  if (appMode !== 'draft' && appMode !== 'published') {
    throw new Error('Step123-I authorization URL preflight violation: invalid app mode.');
  }
}

function assertRedirectUriAllowed(redirectUri: string, allowedRedirectUris: readonly string[]): void {
  if (allowedRedirectUris.length === 0) {
    throw new Error('Step123-I authorization URL preflight violation: redirect URI allowlist is required.');
  }

  if (!allowedRedirectUris.includes(redirectUri)) {
    throw new Error('Step123-I authorization URL preflight violation: redirect URI is not allowlisted.');
  }
}

function assertMarketplaceRegionMatch(region: AmazonSpApiAuthorizationUrlPreflightRegion, marketplaceId: string): void {
  if (marketplaceId === JAPAN_MARKETPLACE_ID && region !== 'FE') {
    throw new Error('Step123-I authorization URL preflight violation: Amazon.co.jp marketplace must use FE region.');
  }
}

export function buildAmazonSpApiAuthorizationUrlImplementationPreflight(
  input: AmazonSpApiAuthorizationUrlPreflightInput,
): AmazonSpApiAuthorizationUrlPreflightResult {
  assertKnownRegion(input.region);
  assertKnownAppMode(input.appMode);

  const applicationId = assertNonBlank(input.applicationId, 'applicationId');
  const marketplaceId = assertNonBlank(input.marketplaceId, 'marketplaceId');
  const redirectUri = assertNonBlank(input.redirectUri, 'redirectUri');
  const state = assertNonBlank(input.state, 'state');

  assertRedirectUriAllowed(redirectUri, input.allowedRedirectUris);
  assertMarketplaceRegionMatch(input.region, marketplaceId);

  const endpoint = ENDPOINT_BY_REGION[input.region];
  const url = new URL(endpoint);

  url.searchParams.set('application_id', applicationId);
  url.searchParams.set('state', state);
  url.searchParams.set('redirect_uri', redirectUri);

  if (input.appMode === 'draft') {
    url.searchParams.set('version', 'beta');
  }

  return {
    authorizationUrl: url.toString(),
    endpoint,
    region: input.region,
    marketplaceId,
    applicationId,
    redirectUri,
    state,
    appMode: input.appMode,
    query: {
      application_id: applicationId,
      state,
      redirect_uri: redirectUri,
      ...(input.appMode === 'draft' ? { version: 'beta' as const } : {}),
    },
    implementationPreflightOnly: true,
    controllerRouteAddedNow: false,
    frontendButtonAddedNow: false,
    browserRedirectNow: false,
    statePersistenceNow: false,
    tokenPersistenceNow: false,
    realAmazonCallNow: false,
  };
}

export function buildAmazonSpApiAuthorizationUrlBuilderImplementationPreflightContract(): AmazonSpApiAuthorizationUrlBuilderImplementationPreflightContract {
  const step123H = assertAmazonSpApiFrontendConnectionStatusPanelContract(
    buildAmazonSpApiFrontendConnectionStatusPanelContract(),
  );

  return {
    version: AMAZON_SP_API_AUTHORIZATION_URL_BUILDER_IMPLEMENTATION_PREFLIGHT_VERSION,
    sourceStep123H: step123H,

    contractOnly: false,
    implementationPreflightOnly: true,
    pureFunctionAddedNow: true,
    backendRouteAddedNow: false,
    frontendComponentAddedNow: false,
    frontendApiClientAddedNow: false,
    buttonHandlerAddedNow: false,
    browserRedirectAddedNow: false,
    statePersistenceNow: false,
    tokenPersistenceNow: false,
    schemaChangedNow: false,
    migrationAddedNow: false,
    realSpApiRequestNow: false,
    writesDatabase: false,

    preflightBoundary: {
      purpose: 'pure-function-authorization-url-builder-preflight-only',
      pureFunctionOnly: true,
      deterministicOutputRequired: true,
      inputValidationRequired: true,
      noNetworkRequired: true,
      noDatabaseRequired: true,
      noControllerRouteRequired: true,
      noFrontendRequired: true,
    },

    endpointContract: {
      feEndpoint: 'https://sellercentral.amazon.co.jp/apps/authorize/consent',
      naEndpoint: 'https://sellercentral.amazon.com/apps/authorize/consent',
      euEndpoint: 'https://sellercentral-europe.amazon.com/apps/authorize/consent',
      japanMarketplaceId: 'A1VC38T7YXB528',
      japanMarketplaceMustUseFeRegion: true,
      regionMarketplaceMismatchRejected: true,
    },

    queryParameterContract: {
      applicationIdRequired: true,
      stateRequired: true,
      redirectUriRequired: true,
      redirectUriAllowlistRequired: true,
      draftModeAddsVersionBeta: true,
      publishedModeOmitsVersionBeta: true,
      unknownInputRejected: true,
    },

    validationContract: {
      blankApplicationIdRejected: true,
      blankStateRejected: true,
      blankRedirectUriRejected: true,
      emptyRedirectAllowlistRejected: true,
      redirectUriNotInAllowlistRejected: true,
      externalRedirectNotInAllowlistRejected: true,
      invalidRegionRejected: true,
      invalidAppModeRejected: true,
      marketplaceRegionMismatchRejected: true,
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
      readyForOauthStateSigningImplementationPreflight: true,
      readyForAuthorizationRouteImplementation: false,
      readyForFrontendConnectButtonImplementation: false,
      readyForActualPrismaSchemaMigration: false,
      readyForTokenPersistenceImplementation: false,
      readyForRealSpApiReportRequest: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiAuthorizationUrlBuilderImplementationPreflightContract(
  contract: AmazonSpApiAuthorizationUrlBuilderImplementationPreflightContract,
): AmazonSpApiAuthorizationUrlBuilderImplementationPreflightContract {
  if (contract.version !== AMAZON_SP_API_AUTHORIZATION_URL_BUILDER_IMPLEMENTATION_PREFLIGHT_VERSION) {
    throw new Error('Step123-I authorization URL builder implementation preflight violation: version mismatch.');
  }

  assertAmazonSpApiFrontendConnectionStatusPanelContract(contract.sourceStep123H);

  if (
    contract.contractOnly !== false ||
    contract.implementationPreflightOnly !== true ||
    contract.pureFunctionAddedNow !== true ||
    contract.backendRouteAddedNow !== false ||
    contract.frontendComponentAddedNow !== false ||
    contract.frontendApiClientAddedNow !== false ||
    contract.buttonHandlerAddedNow !== false ||
    contract.browserRedirectAddedNow !== false ||
    contract.statePersistenceNow !== false ||
    contract.tokenPersistenceNow !== false ||
    contract.schemaChangedNow !== false ||
    contract.migrationAddedNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step123-I authorization URL builder implementation preflight violation: implementation boundary mismatch.');
  }

  for (const [key, value] of Object.entries(contract.preflightBoundary)) {
    if (key === 'purpose') continue;
    if (value !== true) {
      throw new Error(`Step123-I authorization URL builder implementation preflight violation: preflightBoundary.${key} must remain true.`);
    }
  }

  if (
    contract.endpointContract.feEndpoint !== 'https://sellercentral.amazon.co.jp/apps/authorize/consent' ||
    contract.endpointContract.naEndpoint !== 'https://sellercentral.amazon.com/apps/authorize/consent' ||
    contract.endpointContract.euEndpoint !== 'https://sellercentral-europe.amazon.com/apps/authorize/consent' ||
    contract.endpointContract.japanMarketplaceId !== 'A1VC38T7YXB528'
  ) {
    throw new Error('Step123-I authorization URL builder implementation preflight violation: endpoint contract mismatch.');
  }

  for (const [key, value] of Object.entries(contract.queryParameterContract)) {
    if (value !== true) {
      throw new Error(`Step123-I authorization URL builder implementation preflight violation: queryParameterContract.${key} must remain true.`);
    }
  }

  for (const [key, value] of Object.entries(contract.validationContract)) {
    if (value !== true) {
      throw new Error(`Step123-I authorization URL builder implementation preflight violation: validationContract.${key} must remain true.`);
    }
  }

  for (const [key, value] of Object.entries(contract.forbiddenNow)) {
    if (value !== true) {
      throw new Error(`Step123-I authorization URL builder implementation preflight violation: forbiddenNow.${key} must remain true.`);
    }
  }

  if (
    contract.summary.readyForOauthStateSigningImplementationPreflight !== true ||
    contract.summary.readyForAuthorizationRouteImplementation !== false ||
    contract.summary.readyForFrontendConnectButtonImplementation !== false ||
    contract.summary.readyForActualPrismaSchemaMigration !== false ||
    contract.summary.readyForTokenPersistenceImplementation !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSales !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step123-I authorization URL builder implementation preflight violation: summary readiness mismatch.');
  }

  return contract;
}
