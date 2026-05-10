export type AmazonSpApiOrdersCredentialRepositoryPrisma = {
  amazonSpApiConnection: {
    findFirst(args: {
      where: {
        companyId: string;
        storeId: string;
        marketplaceId: string;
        region: string;
      };
      include: {
        credential: boolean;
        accessTokenCache: boolean;
      };
    }): Promise<AmazonSpApiOrdersCredentialRepositoryConnection | null>;
  };
};

export type AmazonSpApiOrdersCredentialRepositoryConnection = {
  id: string;
  companyId: string;
  storeId: string;
  marketplaceId: string;
  region: string;
  sellingPartnerId: string;
  appId: string;
  status: string;
  revokedAt?: Date | null;
  credential?: {
    id: string;
    encryptedRefreshToken: string;
    encryptionKeyId: string;
    encryptionAlgorithm: string;
    tokenVersion: number;
    rotatedAt: Date;
    revokedAt?: Date | null;
  } | null;
  accessTokenCache?: {
    id: string;
    encryptedAccessToken: string;
    tokenType: string;
    scope?: string | null;
    expiresAt: Date;
  } | null;
};

export type AmazonSpApiOrdersCredentialDecryptor = {
  decryptAccessToken(input: {
    encryptedAccessToken: string;
    encryptionKeyId?: string | null;
    encryptionAlgorithm?: string | null;
    context: {
      companyId: string;
      storeId: string;
      connectionId: string;
    };
  }): Promise<string>;
};

export type ResolveAmazonSpApiOrdersCredentialRepositoryInput = {
  prisma: AmazonSpApiOrdersCredentialRepositoryPrisma;
  companyId: string;
  storeId: string;
  marketplaceId: string;
  region: string;
  decryptor?: AmazonSpApiOrdersCredentialDecryptor;
  now?: Date;
};

export type ResolveAmazonSpApiOrdersCredentialRepositoryResult = {
  step: 'Step140-X';
  source: 'amazon-sp-api-orders-credential-repository';
  mode: 'repository';
  companyId: string;
  storeId: string;
  marketplaceId: string;
  region: string;
  connectionId: string | null;
  connected: boolean;
  credentialPresent: boolean;
  accessTokenCachePresent: boolean;
  accessTokenCacheExpired: boolean;
  repositoryCredentialUsable: boolean;
  requiresTokenRefresh: boolean;
  blockedReason:
    | null
    | 'CONNECTION_NOT_FOUND'
    | 'CONNECTION_NOT_CONNECTED'
    | 'CONNECTION_REVOKED'
    | 'CREDENTIAL_MISSING'
    | 'CREDENTIAL_REVOKED'
    | 'ACCESS_TOKEN_CACHE_MISSING'
    | 'ACCESS_TOKEN_CACHE_EXPIRED'
    | 'TOKEN_DECRYPTOR_NOT_CONFIGURED'
    | 'TOKEN_DECRYPT_FAILED';
  decryptedAccessToken: string | null;
  awsCredentialsSource: 'env-for-step140-x';
  sanitizedConnection: {
    sellingPartnerIdRedacted: string | null;
    appIdRedacted: string | null;
    tokenType: string | null;
    scope: string | null;
    accessTokenExpiresAt: string | null;
    credentialRotatedAt: string | null;
  };
  boundaries: {
    readsAmazonSpApiConnection: true;
    readsAmazonSpApiCredential: true;
    readsAmazonSpApiAccessTokenCache: true;
    writesDatabase: false;
    refreshesLwaTokenNow: false;
    returnsRawAccessTokenToControllerOnly: boolean;
    returnsRawRefreshToken: false;
    returnsEncryptedToken: false;
    writesImportJob: false;
    writesTransaction: false;
    writesInventory: false;
    callsAmazon: false;
  };
};

export async function resolveAmazonSpApiOrdersCredentialFromRepository(
  input: ResolveAmazonSpApiOrdersCredentialRepositoryInput,
): Promise<ResolveAmazonSpApiOrdersCredentialRepositoryResult> {
  assertRepositoryInput(input);

  const now = input.now || new Date();
  const region = normalizeRegion(input.region);

  const connection = await input.prisma.amazonSpApiConnection.findFirst({
    where: {
      companyId: input.companyId,
      storeId: input.storeId,
      marketplaceId: input.marketplaceId,
      region,
    },
    include: {
      credential: true,
      accessTokenCache: true,
    },
  });

  if (!connection) {
    return buildBlockedResult(input, region, null, 'CONNECTION_NOT_FOUND', now);
  }

  const status = String(connection.status || '').trim().toUpperCase();
  const connected = status === 'CONNECTED';

  if (!connected) {
    return buildBlockedResult(input, region, connection, 'CONNECTION_NOT_CONNECTED', now);
  }

  if (connection.revokedAt) {
    return buildBlockedResult(input, region, connection, 'CONNECTION_REVOKED', now);
  }

  if (!connection.credential) {
    return buildBlockedResult(input, region, connection, 'CREDENTIAL_MISSING', now);
  }

  if (connection.credential.revokedAt) {
    return buildBlockedResult(input, region, connection, 'CREDENTIAL_REVOKED', now);
  }

  if (!connection.accessTokenCache) {
    return buildBlockedResult(input, region, connection, 'ACCESS_TOKEN_CACHE_MISSING', now);
  }

  const expiresAt = connection.accessTokenCache.expiresAt;
  const expired = expiresAt.getTime() <= now.getTime() + 60_000;

  if (expired) {
    return buildBlockedResult(input, region, connection, 'ACCESS_TOKEN_CACHE_EXPIRED', now);
  }

  if (!input.decryptor) {
    return buildBlockedResult(input, region, connection, 'TOKEN_DECRYPTOR_NOT_CONFIGURED', now);
  }

  try {
    const decryptedAccessToken = await input.decryptor.decryptAccessToken({
      encryptedAccessToken: connection.accessTokenCache.encryptedAccessToken,
      encryptionKeyId: connection.credential.encryptionKeyId,
      encryptionAlgorithm: connection.credential.encryptionAlgorithm,
      context: {
        companyId: input.companyId,
        storeId: input.storeId,
        connectionId: connection.id,
      },
    });

    if (!String(decryptedAccessToken || '').trim()) {
      return buildBlockedResult(input, region, connection, 'TOKEN_DECRYPT_FAILED', now);
    }

    return {
      ...buildBaseResult(input, region, connection, now),
      connected: true,
      credentialPresent: true,
      accessTokenCachePresent: true,
      accessTokenCacheExpired: false,
      repositoryCredentialUsable: true,
      requiresTokenRefresh: false,
      blockedReason: null,
      decryptedAccessToken,
      boundaries: {
        ...buildBaseBoundaries(),
        returnsRawAccessTokenToControllerOnly: true,
      },
    };
  } catch {
    return buildBlockedResult(input, region, connection, 'TOKEN_DECRYPT_FAILED', now);
  }
}

export function assertAmazonSpApiOrdersCredentialRepositoryResultSafeForResponse(
  result: ResolveAmazonSpApiOrdersCredentialRepositoryResult,
): Omit<ResolveAmazonSpApiOrdersCredentialRepositoryResult, 'decryptedAccessToken'> & {
  decryptedAccessToken: null;
} {
  return {
    ...result,
    decryptedAccessToken: null,
    boundaries: {
      ...result.boundaries,
      returnsRawAccessTokenToControllerOnly: false,
    },
  };
}

function buildBlockedResult(
  input: ResolveAmazonSpApiOrdersCredentialRepositoryInput,
  region: string,
  connection: AmazonSpApiOrdersCredentialRepositoryConnection | null,
  reason: NonNullable<ResolveAmazonSpApiOrdersCredentialRepositoryResult['blockedReason']>,
  now: Date,
): ResolveAmazonSpApiOrdersCredentialRepositoryResult {
  return {
    ...buildBaseResult(input, region, connection, now),
    connected: String(connection?.status || '').toUpperCase() === 'CONNECTED',
    credentialPresent: Boolean(connection?.credential),
    accessTokenCachePresent: Boolean(connection?.accessTokenCache),
    accessTokenCacheExpired: Boolean(
      connection?.accessTokenCache?.expiresAt &&
        connection.accessTokenCache.expiresAt.getTime() <= now.getTime() + 60_000,
    ),
    repositoryCredentialUsable: false,
    requiresTokenRefresh: reason === 'ACCESS_TOKEN_CACHE_EXPIRED' || reason === 'ACCESS_TOKEN_CACHE_MISSING',
    blockedReason: reason,
    decryptedAccessToken: null,
    boundaries: {
      ...buildBaseBoundaries(),
      returnsRawAccessTokenToControllerOnly: false,
    },
  };
}

function buildBaseResult(
  input: ResolveAmazonSpApiOrdersCredentialRepositoryInput,
  region: string,
  connection: AmazonSpApiOrdersCredentialRepositoryConnection | null,
  _now: Date,
): Omit<
  ResolveAmazonSpApiOrdersCredentialRepositoryResult,
  | 'connected'
  | 'credentialPresent'
  | 'accessTokenCachePresent'
  | 'accessTokenCacheExpired'
  | 'repositoryCredentialUsable'
  | 'requiresTokenRefresh'
  | 'blockedReason'
  | 'decryptedAccessToken'
  | 'boundaries'
> {
  return {
    step: 'Step140-X',
    source: 'amazon-sp-api-orders-credential-repository',
    mode: 'repository',
    companyId: input.companyId,
    storeId: input.storeId,
    marketplaceId: input.marketplaceId,
    region,
    connectionId: connection?.id || null,
    awsCredentialsSource: 'env-for-step140-x',
    sanitizedConnection: {
      sellingPartnerIdRedacted: redact(connection?.sellingPartnerId),
      appIdRedacted: redact(connection?.appId),
      tokenType: connection?.accessTokenCache?.tokenType || null,
      scope: connection?.accessTokenCache?.scope || null,
      accessTokenExpiresAt: connection?.accessTokenCache?.expiresAt?.toISOString?.() || null,
      credentialRotatedAt: connection?.credential?.rotatedAt?.toISOString?.() || null,
    },
  };
}

function buildBaseBoundaries(): ResolveAmazonSpApiOrdersCredentialRepositoryResult['boundaries'] {
  return {
    readsAmazonSpApiConnection: true,
    readsAmazonSpApiCredential: true,
    readsAmazonSpApiAccessTokenCache: true,
    writesDatabase: false,
    refreshesLwaTokenNow: false,
    returnsRawAccessTokenToControllerOnly: false,
    returnsRawRefreshToken: false,
    returnsEncryptedToken: false,
    writesImportJob: false,
    writesTransaction: false,
    writesInventory: false,
    callsAmazon: false,
  };
}

function assertRepositoryInput(input: ResolveAmazonSpApiOrdersCredentialRepositoryInput): void {
  if (!input.prisma?.amazonSpApiConnection?.findFirst) {
    throw new Error('Step140-X repository violation: prisma.amazonSpApiConnection.findFirst is required.');
  }
  if (!String(input.companyId || '').trim()) throw new Error('Step140-X repository violation: companyId is required.');
  if (!String(input.storeId || '').trim()) throw new Error('Step140-X repository violation: storeId is required.');
  if (!String(input.marketplaceId || '').trim()) throw new Error('Step140-X repository violation: marketplaceId is required.');
  if (!String(input.region || '').trim()) throw new Error('Step140-X repository violation: region is required.');
}

function normalizeRegion(value: string): string {
  const normalized = String(value || '').trim().toUpperCase();
  return normalized === 'JP' ? 'JP' : normalized;
}

function redact(value?: string | null): string | null {
  const normalized = String(value || '').trim();
  if (!normalized) return null;
  if (normalized.length <= 6) return `${normalized.slice(0, 1)}***${normalized.slice(-1)}`;
  return `${normalized.slice(0, 3)}***${normalized.slice(-3)}`;
}
