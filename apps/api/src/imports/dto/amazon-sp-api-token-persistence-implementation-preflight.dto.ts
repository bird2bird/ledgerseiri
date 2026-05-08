import {
  assertAmazonSpApiTokenExchangeImplementationPreflightContract,
  buildAmazonSpApiTokenExchangeImplementationPreflightContract,
  type AmazonSpApiTokenExchangeImplementationPreflightContract,
  type AmazonSpApiTokenExchangeValidatedSuccessResponse,
} from './amazon-sp-api-token-exchange-implementation-preflight.dto';

export const AMAZON_SP_API_TOKEN_PERSISTENCE_IMPLEMENTATION_PREFLIGHT_VERSION =
  'amazon-sp-api-token-persistence-implementation-preflight-v1' as const;

export type AmazonSpApiTokenPersistenceConnectionStatus =
  | 'AUTHORIZATION_PENDING'
  | 'CONNECTED'
  | 'REVOKED'
  | 'EXPIRED'
  | 'ERROR';

export type AmazonSpApiTokenPersistenceAuditEventType =
  | 'AMAZON_SP_API_CONNECT_PREVIEW'
  | 'AMAZON_SP_API_TOKEN_PERSISTENCE_PREVIEW'
  | 'AMAZON_SP_API_TOKEN_CACHE_PREVIEW'
  | 'AMAZON_SP_API_TOKEN_ROTATION_PREVIEW';

export type AmazonSpApiConnectionIdentityInput = {
  companyId: string;
  storeId: string;
  marketplaceId: string;
  region: 'FE' | 'NA' | 'EU';
  sellingPartnerId: string;
  appId: string;
};

export type AmazonSpApiTokenPersistenceMetadataInput = {
  tokenExchange: AmazonSpApiTokenExchangeValidatedSuccessResponse;
  encryptedRefreshToken: string;
  encryptedAccessToken: string;
  encryptionKeyId: string;
  encryptionAlgorithm: string;
  tokenVersion: number;
  issuedAt: string;
  accessTokenExpiresAt: string;
  connectedAt: string;
};

export type AmazonSpApiTokenPersistencePayloadInput = {
  connectionIdentity: AmazonSpApiConnectionIdentityInput;
  tokenMetadata: AmazonSpApiTokenPersistenceMetadataInput;
};

export type AmazonSpApiTokenPersistencePreflightPayload = {
  connection: {
    companyId: string;
    storeId: string;
    marketplaceId: string;
    region: 'FE' | 'NA' | 'EU';
    sellingPartnerId: string;
    appId: string;
    status: AmazonSpApiTokenPersistenceConnectionStatus;
    connectedAt: string;
    lastTokenRefreshAt: string;
    accessTokenExpiresAt: string;
  };
  credential: {
    encryptedRefreshToken: string;
    encryptionKeyId: string;
    encryptionAlgorithm: string;
    tokenVersion: number;
    rotatedAt: string;
  };
  accessTokenCache: {
    encryptedAccessToken: string;
    accessTokenExpiresAt: string;
    tokenType: string;
    scope?: string;
    cacheMayBeDeletedWithoutLosingConnection: true;
  };
  auditPreview: {
    eventType: AmazonSpApiTokenPersistenceAuditEventType;
    companyId: string;
    storeId: string;
    marketplaceId: string;
    region: 'FE' | 'NA' | 'EU';
    sellingPartnerIdMasked: string;
    appIdMasked: string;
    tokenVersion: number;
    occurredAt: string;
    redacted: true;
  };
  redactedPreview: {
    connection: {
      companyId: string;
      storeId: string;
      marketplaceId: string;
      region: 'FE' | 'NA' | 'EU';
      sellingPartnerIdMasked: string;
      appIdMasked: string;
      status: AmazonSpApiTokenPersistenceConnectionStatus;
    };
    credential: {
      encryptedRefreshToken: '[REDACTED_ENCRYPTED_REFRESH_TOKEN]';
      encryptionKeyId: string;
      encryptionAlgorithm: string;
      tokenVersion: number;
    };
    accessTokenCache: {
      encryptedAccessToken: '[REDACTED_ENCRYPTED_ACCESS_TOKEN]';
      accessTokenExpiresAt: string;
      tokenType: string;
      scope?: string;
    };
  };
  implementationPreflightOnly: true;
  databaseWriteNow: false;
  prismaSchemaChangeNow: false;
  migrationAddedNow: false;
  tokenExchangeHttpCallNow: false;
  controllerRouteAddedNow: false;
  frontendAddedNow: false;
};

export type AmazonSpApiTokenPersistenceImplementationPreflightContract = {
  version: typeof AMAZON_SP_API_TOKEN_PERSISTENCE_IMPLEMENTATION_PREFLIGHT_VERSION;
  sourceStep123L: AmazonSpApiTokenExchangeImplementationPreflightContract;

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
  tokenPersistenceWriteNow: false;
  databaseWriteNow: false;
  prismaSchemaChangedNow: false;
  migrationAddedNow: false;
  realSpApiRequestNow: false;
  writesDatabase: false;

  preflightBoundary: {
    purpose: 'pure-function-token-persistence-payload-preflight-only';
    pureFunctionOnly: true;
    persistencePayloadBuilderRequired: true;
    connectionIdentityValidationRequired: true;
    encryptedRefreshTokenRequired: true;
    encryptedAccessTokenCacheRequired: true;
    redactedPreviewRequired: true;
    auditPreviewRequired: true;
    noNetworkRequired: true;
    noDatabaseRequired: true;
    noControllerRouteRequired: true;
    noFrontendRequired: true;
  };

  connectionIdentityContract: {
    companyIdRequired: true;
    storeIdRequired: true;
    marketplaceIdRequired: true;
    regionRequired: true;
    sellingPartnerIdRequired: true;
    appIdRequired: true;
    japanMarketplaceRequiresFeRegion: true;
  };

  tokenMetadataContract: {
    encryptedRefreshTokenRequired: true;
    encryptedAccessTokenRequired: true;
    plaintextRefreshTokenForbiddenInPreview: true;
    plaintextAccessTokenForbiddenInPreview: true;
    encryptionKeyIdRequired: true;
    encryptionAlgorithmRequired: true;
    tokenVersionPositiveIntegerRequired: true;
    issuedAtRequired: true;
    connectedAtRequired: true;
    accessTokenExpiresAtRequired: true;
    accessTokenExpiresAfterIssuedAtRequired: true;
  };

  redactionContract: {
    refreshTokenRedacted: true;
    accessTokenRedacted: true;
    encryptedRefreshTokenRedactedInPreview: true;
    encryptedAccessTokenRedactedInPreview: true;
    sellingPartnerIdMasked: true;
    appIdMasked: true;
    auditPayloadRedacted: true;
  };

  forbiddenNow: {
    tokenPersistenceDatabaseWrite: true;
    prismaSchemaChange: true;
    migrationFile: true;
    tokenExchangeHttpCall: true;
    callbackControllerRoute: true;
    authorizationControllerRoute: true;
    frontendButton: true;
    frontendApiClient: true;
    browserRedirect: true;
    oauthStatePersistence: true;
    noncePersistence: true;
    authorizationCodePersistence: true;
    refreshTokenPlaintextPersistence: true;
    accessTokenPlaintextPersistence: true;
    clientSecretPersistence: true;
    realSpApiHttpCall: true;
    createReportCall: true;
    getReportCall: true;
    getReportDocumentCall: true;
    importJobWrite: true;
    transactionWrite: true;
    inventoryWrite: true;
  };

  summary: {
    readyForActualPrismaSchemaMigrationPlan: true;
    readyForActualPrismaSchemaMigration: false;
    readyForTokenPersistenceDatabaseImplementation: false;
    readyForTokenExchangeHttpImplementation: false;
    readyForCallbackRouteImplementation: false;
    readyForRealSpApiReportRequest: false;
    readyForCommittedSales: false;
    readyForInventoryExecution: false;
  };
};

const JAPAN_MARKETPLACE_ID = 'A1VC38T7YXB528';

function assertNonBlank(value: string | undefined, label: string): string {
  const trimmed = (value ?? '').trim();
  if (!trimmed) {
    throw new Error(`Step123-M token persistence implementation preflight violation: ${label} is required.`);
  }
  return trimmed;
}

function assertKnownRegion(region: string): asserts region is 'FE' | 'NA' | 'EU' {
  if (region !== 'FE' && region !== 'NA' && region !== 'EU') {
    throw new Error('Step123-M token persistence implementation preflight violation: invalid region.');
  }
}

function assertPositiveInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Step123-M token persistence implementation preflight violation: ${label} must be a positive integer.`);
  }
  return value;
}

function assertIsoDate(value: string | undefined, label: string): string {
  const trimmed = assertNonBlank(value, label);
  const timestamp = Date.parse(trimmed);
  if (!Number.isFinite(timestamp)) {
    throw new Error(`Step123-M token persistence implementation preflight violation: ${label} must be a valid ISO timestamp.`);
  }
  return trimmed;
}

function assertDateAfter(after: string, before: string, label: string): void {
  if (Date.parse(after) <= Date.parse(before)) {
    throw new Error(`Step123-M token persistence implementation preflight violation: ${label}.`);
  }
}

function maskTail(value: string, visibleTail = 4): string {
  const trimmed = assertNonBlank(value, 'valueToMask');
  const tail = trimmed.slice(-visibleTail);
  return `***${tail}`;
}

function validateConnectionIdentity(input: AmazonSpApiConnectionIdentityInput): AmazonSpApiConnectionIdentityInput {
  assertKnownRegion(input.region);

  const companyId = assertNonBlank(input.companyId, 'companyId');
  const storeId = assertNonBlank(input.storeId, 'storeId');
  const marketplaceId = assertNonBlank(input.marketplaceId, 'marketplaceId');
  const sellingPartnerId = assertNonBlank(input.sellingPartnerId, 'sellingPartnerId');
  const appId = assertNonBlank(input.appId, 'appId');

  if (marketplaceId === JAPAN_MARKETPLACE_ID && input.region !== 'FE') {
    throw new Error('Step123-M token persistence implementation preflight violation: Amazon.co.jp marketplace must use FE region.');
  }

  return {
    companyId,
    storeId,
    marketplaceId,
    region: input.region,
    sellingPartnerId,
    appId,
  };
}

function validateTokenMetadata(input: AmazonSpApiTokenPersistenceMetadataInput): AmazonSpApiTokenPersistenceMetadataInput {
  const encryptedRefreshToken = assertNonBlank(input.encryptedRefreshToken, 'encryptedRefreshToken');
  const encryptedAccessToken = assertNonBlank(input.encryptedAccessToken, 'encryptedAccessToken');
  const encryptionKeyId = assertNonBlank(input.encryptionKeyId, 'encryptionKeyId');
  const encryptionAlgorithm = assertNonBlank(input.encryptionAlgorithm, 'encryptionAlgorithm');
  const tokenVersion = assertPositiveInteger(input.tokenVersion, 'tokenVersion');
  const issuedAt = assertIsoDate(input.issuedAt, 'issuedAt');
  const connectedAt = assertIsoDate(input.connectedAt, 'connectedAt');
  const accessTokenExpiresAt = assertIsoDate(input.accessTokenExpiresAt, 'accessTokenExpiresAt');

  assertDateAfter(accessTokenExpiresAt, issuedAt, 'accessTokenExpiresAt must be after issuedAt');

  if (input.tokenExchange.tokenPersistenceNow !== false || input.tokenExchange.httpCallNow !== false || input.tokenExchange.writesDatabase !== false) {
    throw new Error('Step123-M token persistence implementation preflight violation: token exchange input must remain preflight-only.');
  }

  return {
    tokenExchange: input.tokenExchange,
    encryptedRefreshToken,
    encryptedAccessToken,
    encryptionKeyId,
    encryptionAlgorithm,
    tokenVersion,
    issuedAt,
    accessTokenExpiresAt,
    connectedAt,
  };
}

export function buildAmazonSpApiTokenPersistencePayloadImplementationPreflight(
  input: AmazonSpApiTokenPersistencePayloadInput,
): AmazonSpApiTokenPersistencePreflightPayload {
  const connectionIdentity = validateConnectionIdentity(input.connectionIdentity);
  const tokenMetadata = validateTokenMetadata(input.tokenMetadata);

  return {
    connection: {
      companyId: connectionIdentity.companyId,
      storeId: connectionIdentity.storeId,
      marketplaceId: connectionIdentity.marketplaceId,
      region: connectionIdentity.region,
      sellingPartnerId: connectionIdentity.sellingPartnerId,
      appId: connectionIdentity.appId,
      status: 'CONNECTED',
      connectedAt: tokenMetadata.connectedAt,
      lastTokenRefreshAt: tokenMetadata.issuedAt,
      accessTokenExpiresAt: tokenMetadata.accessTokenExpiresAt,
    },
    credential: {
      encryptedRefreshToken: tokenMetadata.encryptedRefreshToken,
      encryptionKeyId: tokenMetadata.encryptionKeyId,
      encryptionAlgorithm: tokenMetadata.encryptionAlgorithm,
      tokenVersion: tokenMetadata.tokenVersion,
      rotatedAt: tokenMetadata.issuedAt,
    },
    accessTokenCache: {
      encryptedAccessToken: tokenMetadata.encryptedAccessToken,
      accessTokenExpiresAt: tokenMetadata.accessTokenExpiresAt,
      tokenType: tokenMetadata.tokenExchange.tokenType,
      ...(tokenMetadata.tokenExchange.scope ? { scope: tokenMetadata.tokenExchange.scope } : {}),
      cacheMayBeDeletedWithoutLosingConnection: true,
    },
    auditPreview: {
      eventType: 'AMAZON_SP_API_TOKEN_PERSISTENCE_PREVIEW',
      companyId: connectionIdentity.companyId,
      storeId: connectionIdentity.storeId,
      marketplaceId: connectionIdentity.marketplaceId,
      region: connectionIdentity.region,
      sellingPartnerIdMasked: maskTail(connectionIdentity.sellingPartnerId),
      appIdMasked: maskTail(connectionIdentity.appId),
      tokenVersion: tokenMetadata.tokenVersion,
      occurredAt: tokenMetadata.issuedAt,
      redacted: true,
    },
    redactedPreview: {
      connection: {
        companyId: connectionIdentity.companyId,
        storeId: connectionIdentity.storeId,
        marketplaceId: connectionIdentity.marketplaceId,
        region: connectionIdentity.region,
        sellingPartnerIdMasked: maskTail(connectionIdentity.sellingPartnerId),
        appIdMasked: maskTail(connectionIdentity.appId),
        status: 'CONNECTED',
      },
      credential: {
        encryptedRefreshToken: '[REDACTED_ENCRYPTED_REFRESH_TOKEN]',
        encryptionKeyId: tokenMetadata.encryptionKeyId,
        encryptionAlgorithm: tokenMetadata.encryptionAlgorithm,
        tokenVersion: tokenMetadata.tokenVersion,
      },
      accessTokenCache: {
        encryptedAccessToken: '[REDACTED_ENCRYPTED_ACCESS_TOKEN]',
        accessTokenExpiresAt: tokenMetadata.accessTokenExpiresAt,
        tokenType: tokenMetadata.tokenExchange.tokenType,
        ...(tokenMetadata.tokenExchange.scope ? { scope: tokenMetadata.tokenExchange.scope } : {}),
      },
    },
    implementationPreflightOnly: true,
    databaseWriteNow: false,
    prismaSchemaChangeNow: false,
    migrationAddedNow: false,
    tokenExchangeHttpCallNow: false,
    controllerRouteAddedNow: false,
    frontendAddedNow: false,
  };
}

export function buildAmazonSpApiTokenPersistenceImplementationPreflightContract(): AmazonSpApiTokenPersistenceImplementationPreflightContract {
  const step123L = assertAmazonSpApiTokenExchangeImplementationPreflightContract(
    buildAmazonSpApiTokenExchangeImplementationPreflightContract(),
  );

  return {
    version: AMAZON_SP_API_TOKEN_PERSISTENCE_IMPLEMENTATION_PREFLIGHT_VERSION,
    sourceStep123L: step123L,

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
    tokenPersistenceWriteNow: false,
    databaseWriteNow: false,
    prismaSchemaChangedNow: false,
    migrationAddedNow: false,
    realSpApiRequestNow: false,
    writesDatabase: false,

    preflightBoundary: {
      purpose: 'pure-function-token-persistence-payload-preflight-only',
      pureFunctionOnly: true,
      persistencePayloadBuilderRequired: true,
      connectionIdentityValidationRequired: true,
      encryptedRefreshTokenRequired: true,
      encryptedAccessTokenCacheRequired: true,
      redactedPreviewRequired: true,
      auditPreviewRequired: true,
      noNetworkRequired: true,
      noDatabaseRequired: true,
      noControllerRouteRequired: true,
      noFrontendRequired: true,
    },

    connectionIdentityContract: {
      companyIdRequired: true,
      storeIdRequired: true,
      marketplaceIdRequired: true,
      regionRequired: true,
      sellingPartnerIdRequired: true,
      appIdRequired: true,
      japanMarketplaceRequiresFeRegion: true,
    },

    tokenMetadataContract: {
      encryptedRefreshTokenRequired: true,
      encryptedAccessTokenRequired: true,
      plaintextRefreshTokenForbiddenInPreview: true,
      plaintextAccessTokenForbiddenInPreview: true,
      encryptionKeyIdRequired: true,
      encryptionAlgorithmRequired: true,
      tokenVersionPositiveIntegerRequired: true,
      issuedAtRequired: true,
      connectedAtRequired: true,
      accessTokenExpiresAtRequired: true,
      accessTokenExpiresAfterIssuedAtRequired: true,
    },

    redactionContract: {
      refreshTokenRedacted: true,
      accessTokenRedacted: true,
      encryptedRefreshTokenRedactedInPreview: true,
      encryptedAccessTokenRedactedInPreview: true,
      sellingPartnerIdMasked: true,
      appIdMasked: true,
      auditPayloadRedacted: true,
    },

    forbiddenNow: {
      tokenPersistenceDatabaseWrite: true,
      prismaSchemaChange: true,
      migrationFile: true,
      tokenExchangeHttpCall: true,
      callbackControllerRoute: true,
      authorizationControllerRoute: true,
      frontendButton: true,
      frontendApiClient: true,
      browserRedirect: true,
      oauthStatePersistence: true,
      noncePersistence: true,
      authorizationCodePersistence: true,
      refreshTokenPlaintextPersistence: true,
      accessTokenPlaintextPersistence: true,
      clientSecretPersistence: true,
      realSpApiHttpCall: true,
      createReportCall: true,
      getReportCall: true,
      getReportDocumentCall: true,
      importJobWrite: true,
      transactionWrite: true,
      inventoryWrite: true,
    },

    summary: {
      readyForActualPrismaSchemaMigrationPlan: true,
      readyForActualPrismaSchemaMigration: false,
      readyForTokenPersistenceDatabaseImplementation: false,
      readyForTokenExchangeHttpImplementation: false,
      readyForCallbackRouteImplementation: false,
      readyForRealSpApiReportRequest: false,
      readyForCommittedSales: false,
      readyForInventoryExecution: false,
    },
  };
}

export function assertAmazonSpApiTokenPersistenceImplementationPreflightContract(
  contract: AmazonSpApiTokenPersistenceImplementationPreflightContract,
): AmazonSpApiTokenPersistenceImplementationPreflightContract {
  if (contract.version !== AMAZON_SP_API_TOKEN_PERSISTENCE_IMPLEMENTATION_PREFLIGHT_VERSION) {
    throw new Error('Step123-M token persistence implementation preflight violation: version mismatch.');
  }

  assertAmazonSpApiTokenExchangeImplementationPreflightContract(contract.sourceStep123L);

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
    contract.tokenPersistenceWriteNow !== false ||
    contract.databaseWriteNow !== false ||
    contract.prismaSchemaChangedNow !== false ||
    contract.migrationAddedNow !== false ||
    contract.realSpApiRequestNow !== false ||
    contract.writesDatabase !== false
  ) {
    throw new Error('Step123-M token persistence implementation preflight violation: implementation boundary mismatch.');
  }

  for (const [key, value] of Object.entries(contract.preflightBoundary)) {
    if (key === 'purpose') continue;
    if (value !== true) {
      throw new Error(`Step123-M token persistence implementation preflight violation: preflightBoundary.${key} must remain true.`);
    }
  }

  for (const [sectionName, section] of Object.entries({
    connectionIdentityContract: contract.connectionIdentityContract,
    tokenMetadataContract: contract.tokenMetadataContract,
    redactionContract: contract.redactionContract,
  })) {
    for (const [key, value] of Object.entries(section)) {
      if (value !== true) {
        throw new Error(`Step123-M token persistence implementation preflight violation: ${sectionName}.${key} must remain true.`);
      }
    }
  }

  for (const [key, value] of Object.entries(contract.forbiddenNow)) {
    if (value !== true) {
      throw new Error(`Step123-M token persistence implementation preflight violation: forbiddenNow.${key} must remain true.`);
    }
  }

  if (
    contract.summary.readyForActualPrismaSchemaMigrationPlan !== true ||
    contract.summary.readyForActualPrismaSchemaMigration !== false ||
    contract.summary.readyForTokenPersistenceDatabaseImplementation !== false ||
    contract.summary.readyForTokenExchangeHttpImplementation !== false ||
    contract.summary.readyForCallbackRouteImplementation !== false ||
    contract.summary.readyForRealSpApiReportRequest !== false ||
    contract.summary.readyForCommittedSales !== false ||
    contract.summary.readyForInventoryExecution !== false
  ) {
    throw new Error('Step123-M token persistence implementation preflight violation: summary readiness mismatch.');
  }

  return contract;
}
