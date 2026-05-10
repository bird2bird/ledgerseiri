export type AmazonSpApiCredentialStatus =
  | 'active'
  | 'needs_reauth'
  | 'revoked'
  | 'error';

export type AmazonSpApiEncryptedCredentialRepositoryInput = {
  companyId: string;
  storeId: string;
  marketplaceId: string;
  region: string;
  sellingPartnerId: string;
  encryptedRefreshToken: string;
  encryptedAccessTokenCache?: string | null;
  accessTokenExpiresAt?: string | Date | null;
  refreshTokenFingerprint: string;
  accessTokenFingerprint?: string | null;
  encryptionKeyId: string;
  encryptionAlgorithm: string;
  tokenVersion: number;
  status: AmazonSpApiCredentialStatus;
  lastValidatedAt?: string | Date | null;
  revokedAt?: string | Date | null;

  plaintextAccessToken?: never;
  plaintextRefreshToken?: never;
  rawLwaResponse?: never;
  rawAuthorizationCode?: never;
  rawClientSecret?: never;
};

export type AmazonSpApiCredentialPrismaDelegate = {
  upsert: (args: {
    where: {
      companyId_storeId_marketplaceId_region: {
        companyId: string;
        storeId: string;
        marketplaceId: string;
        region: string;
      };
    };
    create: Record<string, unknown>;
    update: Record<string, unknown>;
  }) => Promise<Record<string, unknown>> | Record<string, unknown>;
};

export type AmazonSpApiEncryptedCredentialRepositoryRealWriteResult = {
  accepted: boolean;
  source: 'amazon-sp-api-credential-repository-real-write';
  repositoryMode: 'mocked-prisma-delegate-real-write-contract';
  operation: 'upsertEncryptedCredentialRealWrite';
  reason:
    | AmazonSpApiEncryptedCredentialRepositoryResult['reason']
    | 'missing_prisma_delegate'
    | 'prisma_upsert_exception';
  messageRedacted: string;
  scopedIdentityReady: boolean;
  encryptedCredentialPayloadReady: boolean;
  mockedPrismaDelegateUsedNow: boolean;
  prismaClientWriteNow: true;
  databaseWriteNow: true;
  tokenPersistenceDatabaseWriteNow: true;
  plaintextTokenDatabaseWriteNow: false;
  repositoryMayCallAmazonNow: false;
  repositoryMayParseLwaResponseNow: false;
  repositoryMayOwnEncryptionNow: false;
  rawTokenReturnedNow: false;
  persistedCredentialShape: {
    id: string | null;
    companyId: string;
    storeId: string;
    marketplaceId: string;
    region: string;
    status: AmazonSpApiCredentialStatus;
    sellingPartnerIdRedacted: string;
    tokenVersion: number;
  } | null;
};

export type AmazonSpApiEncryptedCredentialRepositoryResult = {
  accepted: boolean;
  source: 'amazon-sp-api-encrypted-token-repository-test-double';
  repositoryMode: 'test-double-no-prisma-write';
  operation:
    | 'upsertEncryptedCredential'
    | 'findActiveCredentialForStore'
    | 'markCredentialNeedsReauth'
    | 'revokeCredential'
    | 'updateAccessTokenCache';
  reason:
    | 'ready'
    | 'missing_company_id'
    | 'missing_store_id'
    | 'missing_marketplace_id'
    | 'missing_region'
    | 'missing_selling_partner_id'
    | 'missing_encrypted_refresh_token'
    | 'missing_refresh_token_fingerprint'
    | 'missing_encryption_key_id'
    | 'missing_encryption_algorithm'
    | 'invalid_token_version'
    | 'invalid_status'
    | 'plaintext_token_field_rejected'
    | 'raw_lwa_response_rejected'
    | 'raw_authorization_code_rejected'
    | 'raw_client_secret_rejected'
    | 'revoked_status_requires_revoked_at';
  messageRedacted: string;
  scopedIdentityReady: boolean;
  encryptedCredentialPayloadReady: boolean;
  companyIdPresent: boolean;
  storeIdPresent: boolean;
  marketplaceIdPresent: boolean;
  regionPresent: boolean;
  sellingPartnerIdPresent: boolean;
  encryptedRefreshTokenPresent: boolean;
  encryptedAccessTokenCachePresent: boolean;
  refreshTokenFingerprintPresent: boolean;
  accessTokenFingerprintPresent: boolean;
  encryptionKeyIdPresent: boolean;
  encryptionAlgorithmPresent: boolean;
  tokenVersion: number;
  status: AmazonSpApiCredentialStatus | null;
  prismaClientWriteNow: false;
  databaseWriteNow: false;
  tokenPersistenceDatabaseWriteNow: false;
  plaintextTokenDatabaseWriteNow: false;
  repositoryMayCallAmazonNow: false;
  repositoryMayParseLwaResponseNow: false;
  repositoryMayOwnEncryptionNow: false;
  rawTokenReturnedNow: false;
};

function normalize(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function hasOwn(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function normalizeTokenVersion(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.floor(value)
    : 0;
}

function isValidStatus(value: unknown): value is AmazonSpApiCredentialStatus {
  return (
    value === 'active' ||
    value === 'needs_reauth' ||
    value === 'revoked' ||
    value === 'error'
  );
}

export class AmazonSpApiCredentialRepository {
  async upsertEncryptedCredentialRealWrite(
    input: AmazonSpApiEncryptedCredentialRepositoryInput,
    prismaDelegate: AmazonSpApiCredentialPrismaDelegate | null | undefined,
  ): Promise<AmazonSpApiEncryptedCredentialRepositoryRealWriteResult> {
    const validation = this.validateEncryptedCredentialPayload(
      'upsertEncryptedCredential',
      input,
    );

    const baseResult = (
      accepted: boolean,
      reason: AmazonSpApiEncryptedCredentialRepositoryRealWriteResult['reason'],
      messageRedacted: string,
      persistedCredentialShape: AmazonSpApiEncryptedCredentialRepositoryRealWriteResult['persistedCredentialShape'] = null,
    ): AmazonSpApiEncryptedCredentialRepositoryRealWriteResult => ({
      accepted,
      source: 'amazon-sp-api-credential-repository-real-write',
      repositoryMode: 'mocked-prisma-delegate-real-write-contract',
      operation: 'upsertEncryptedCredentialRealWrite',
      reason,
      messageRedacted,
      scopedIdentityReady: validation.scopedIdentityReady,
      encryptedCredentialPayloadReady: validation.encryptedCredentialPayloadReady,
      mockedPrismaDelegateUsedNow: Boolean(prismaDelegate),
      prismaClientWriteNow: true,
      databaseWriteNow: true,
      tokenPersistenceDatabaseWriteNow: true,
      plaintextTokenDatabaseWriteNow: false,
      repositoryMayCallAmazonNow: false,
      repositoryMayParseLwaResponseNow: false,
      repositoryMayOwnEncryptionNow: false,
      rawTokenReturnedNow: false,
      persistedCredentialShape,
    });

    if (!validation.accepted) {
      return baseResult(false, validation.reason, validation.messageRedacted);
    }

    if (!prismaDelegate || typeof prismaDelegate.upsert !== 'function') {
      return baseResult(
        false,
        'missing_prisma_delegate',
        'Mocked Prisma delegate is required for repository real-write verification.',
      );
    }

    const normalizedInput = {
      companyId: normalize(input.companyId),
      storeId: normalize(input.storeId),
      marketplaceId: normalize(input.marketplaceId),
      region: normalize(input.region),
      sellingPartnerId: normalize(input.sellingPartnerId),
      encryptedRefreshToken: normalize(input.encryptedRefreshToken),
      encryptedAccessTokenCache: normalize(input.encryptedAccessTokenCache),
      accessTokenExpiresAt: input.accessTokenExpiresAt ?? null,
      refreshTokenFingerprint: normalize(input.refreshTokenFingerprint),
      accessTokenFingerprint: normalize(input.accessTokenFingerprint),
      encryptionKeyId: normalize(input.encryptionKeyId),
      encryptionAlgorithm: normalize(input.encryptionAlgorithm),
      tokenVersion: normalizeTokenVersion(input.tokenVersion),
      status: input.status,
      lastValidatedAt: input.lastValidatedAt ?? null,
      revokedAt: input.revokedAt ?? null,
    };

    const now = new Date();

    const createPayload = {
      companyId: normalizedInput.companyId,
      storeId: normalizedInput.storeId,
      marketplaceId: normalizedInput.marketplaceId,
      region: normalizedInput.region,
      sellingPartnerId: normalizedInput.sellingPartnerId,
      encryptedRefreshToken: normalizedInput.encryptedRefreshToken,
      encryptedAccessTokenCache: normalizedInput.encryptedAccessTokenCache || null,
      accessTokenExpiresAt: normalizedInput.accessTokenExpiresAt,
      refreshTokenFingerprint: normalizedInput.refreshTokenFingerprint,
      accessTokenFingerprint: normalizedInput.accessTokenFingerprint || null,
      encryptionKeyId: normalizedInput.encryptionKeyId,
      encryptionAlgorithm: normalizedInput.encryptionAlgorithm,
      tokenVersion: normalizedInput.tokenVersion,
      status: normalizedInput.status,
      connectedAt: now,
      lastValidatedAt: normalizedInput.lastValidatedAt,
      revokedAt: normalizedInput.revokedAt,
    };

    const updatePayload = {
      sellingPartnerId: normalizedInput.sellingPartnerId,
      encryptedRefreshToken: normalizedInput.encryptedRefreshToken,
      encryptedAccessTokenCache: normalizedInput.encryptedAccessTokenCache || null,
      accessTokenExpiresAt: normalizedInput.accessTokenExpiresAt,
      refreshTokenFingerprint: normalizedInput.refreshTokenFingerprint,
      accessTokenFingerprint: normalizedInput.accessTokenFingerprint || null,
      encryptionKeyId: normalizedInput.encryptionKeyId,
      encryptionAlgorithm: normalizedInput.encryptionAlgorithm,
      tokenVersion: normalizedInput.tokenVersion,
      status: normalizedInput.status,
      lastValidatedAt: normalizedInput.lastValidatedAt,
      revokedAt: normalizedInput.revokedAt,
    };

    try {
      const persisted = await prismaDelegate.upsert({
        where: {
          companyId_storeId_marketplaceId_region: {
            companyId: normalizedInput.companyId,
            storeId: normalizedInput.storeId,
            marketplaceId: normalizedInput.marketplaceId,
            region: normalizedInput.region,
          },
        },
        create: createPayload,
        update: updatePayload,
      });

      const persistedId =
        typeof persisted.id === 'string' && persisted.id.trim().length > 0
          ? persisted.id
          : null;

      return baseResult(true, 'ready', 'Encrypted credential persisted through mocked Prisma delegate.', {
        id: persistedId,
        companyId: normalizedInput.companyId,
        storeId: normalizedInput.storeId,
        marketplaceId: normalizedInput.marketplaceId,
        region: normalizedInput.region,
        status: normalizedInput.status,
        sellingPartnerIdRedacted:
          normalizedInput.sellingPartnerId.length <= 4
            ? '****'
            : `${normalizedInput.sellingPartnerId.slice(0, 4)}****`,
        tokenVersion: normalizedInput.tokenVersion,
      });
    } catch (_error) {
      return baseResult(
        false,
        'prisma_upsert_exception',
        'Mocked Prisma delegate upsert failed.',
      );
    }
  }

  upsertEncryptedCredentialTestDouble(
    input: AmazonSpApiEncryptedCredentialRepositoryInput,
  ): AmazonSpApiEncryptedCredentialRepositoryResult {
    return this.validateEncryptedCredentialPayload(
      'upsertEncryptedCredential',
      input,
    );
  }

  findActiveCredentialForStoreTestDouble(input: {
    companyId: string;
    storeId: string;
    marketplaceId: string;
    region: string;
  }): AmazonSpApiEncryptedCredentialRepositoryResult {
    return this.validateEncryptedCredentialPayload('findActiveCredentialForStore', {
      companyId: input.companyId,
      storeId: input.storeId,
      marketplaceId: input.marketplaceId,
      region: input.region,
      sellingPartnerId: 'read-scope-only',
      encryptedRefreshToken: 'read-scope-only',
      refreshTokenFingerprint: 'read-scope-only',
      encryptionKeyId: 'read-scope-only',
      encryptionAlgorithm: 'read-scope-only',
      tokenVersion: 1,
      status: 'active',
    });
  }

  markCredentialNeedsReauthTestDouble(input: {
    companyId: string;
    storeId: string;
    marketplaceId: string;
    region: string;
  }): AmazonSpApiEncryptedCredentialRepositoryResult {
    return this.validateEncryptedCredentialPayload('markCredentialNeedsReauth', {
      companyId: input.companyId,
      storeId: input.storeId,
      marketplaceId: input.marketplaceId,
      region: input.region,
      sellingPartnerId: 'status-update-scope-only',
      encryptedRefreshToken: 'status-update-scope-only',
      refreshTokenFingerprint: 'status-update-scope-only',
      encryptionKeyId: 'status-update-scope-only',
      encryptionAlgorithm: 'status-update-scope-only',
      tokenVersion: 1,
      status: 'needs_reauth',
    });
  }

  revokeCredentialTestDouble(input: {
    companyId: string;
    storeId: string;
    marketplaceId: string;
    region: string;
    revokedAt: string;
  }): AmazonSpApiEncryptedCredentialRepositoryResult {
    return this.validateEncryptedCredentialPayload('revokeCredential', {
      companyId: input.companyId,
      storeId: input.storeId,
      marketplaceId: input.marketplaceId,
      region: input.region,
      sellingPartnerId: 'revoke-scope-only',
      encryptedRefreshToken: 'revoke-scope-only',
      refreshTokenFingerprint: 'revoke-scope-only',
      encryptionKeyId: 'revoke-scope-only',
      encryptionAlgorithm: 'revoke-scope-only',
      tokenVersion: 1,
      status: 'revoked',
      revokedAt: input.revokedAt,
    });
  }

  updateAccessTokenCacheTestDouble(input: {
    companyId: string;
    storeId: string;
    marketplaceId: string;
    region: string;
    encryptedAccessTokenCache: string;
    accessTokenFingerprint: string;
    accessTokenExpiresAt: string;
  }): AmazonSpApiEncryptedCredentialRepositoryResult {
    return this.validateEncryptedCredentialPayload('updateAccessTokenCache', {
      companyId: input.companyId,
      storeId: input.storeId,
      marketplaceId: input.marketplaceId,
      region: input.region,
      sellingPartnerId: 'access-token-cache-scope-only',
      encryptedRefreshToken: 'access-token-cache-scope-only',
      encryptedAccessTokenCache: input.encryptedAccessTokenCache,
      accessTokenFingerprint: input.accessTokenFingerprint,
      accessTokenExpiresAt: input.accessTokenExpiresAt,
      refreshTokenFingerprint: 'access-token-cache-scope-only',
      encryptionKeyId: 'access-token-cache-scope-only',
      encryptionAlgorithm: 'access-token-cache-scope-only',
      tokenVersion: 1,
      status: 'active',
    });
  }

  private validateEncryptedCredentialPayload(
    operation: AmazonSpApiEncryptedCredentialRepositoryResult['operation'],
    input: AmazonSpApiEncryptedCredentialRepositoryInput,
  ): AmazonSpApiEncryptedCredentialRepositoryResult {
    const unsafeInput = input as Record<string, unknown>;

    const companyId = normalize(input.companyId);
    const storeId = normalize(input.storeId);
    const marketplaceId = normalize(input.marketplaceId);
    const region = normalize(input.region);
    const sellingPartnerId = normalize(input.sellingPartnerId);
    const encryptedRefreshToken = normalize(input.encryptedRefreshToken);
    const encryptedAccessTokenCache = normalize(input.encryptedAccessTokenCache);
    const refreshTokenFingerprint = normalize(input.refreshTokenFingerprint);
    const accessTokenFingerprint = normalize(input.accessTokenFingerprint);
    const encryptionKeyId = normalize(input.encryptionKeyId);
    const encryptionAlgorithm = normalize(input.encryptionAlgorithm);
    const tokenVersion = normalizeTokenVersion(input.tokenVersion);
    const status = isValidStatus(input.status) ? input.status : null;

    const result = (
      accepted: boolean,
      reason: AmazonSpApiEncryptedCredentialRepositoryResult['reason'],
      messageRedacted: string,
    ): AmazonSpApiEncryptedCredentialRepositoryResult => ({
      accepted,
      source: 'amazon-sp-api-encrypted-token-repository-test-double',
      repositoryMode: 'test-double-no-prisma-write',
      operation,
      reason,
      messageRedacted,
      scopedIdentityReady:
        companyId.length > 0 &&
        storeId.length > 0 &&
        marketplaceId.length > 0 &&
        region.length > 0,
      encryptedCredentialPayloadReady: accepted,
      companyIdPresent: companyId.length > 0,
      storeIdPresent: storeId.length > 0,
      marketplaceIdPresent: marketplaceId.length > 0,
      regionPresent: region.length > 0,
      sellingPartnerIdPresent: sellingPartnerId.length > 0,
      encryptedRefreshTokenPresent: encryptedRefreshToken.length > 0,
      encryptedAccessTokenCachePresent: encryptedAccessTokenCache.length > 0,
      refreshTokenFingerprintPresent: refreshTokenFingerprint.length > 0,
      accessTokenFingerprintPresent: accessTokenFingerprint.length > 0,
      encryptionKeyIdPresent: encryptionKeyId.length > 0,
      encryptionAlgorithmPresent: encryptionAlgorithm.length > 0,
      tokenVersion,
      status,
      prismaClientWriteNow: false,
      databaseWriteNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      plaintextTokenDatabaseWriteNow: false,
      repositoryMayCallAmazonNow: false,
      repositoryMayParseLwaResponseNow: false,
      repositoryMayOwnEncryptionNow: false,
      rawTokenReturnedNow: false,
    });

    if (hasOwn(unsafeInput, 'plaintextAccessToken')) {
      return result(false, 'plaintext_token_field_rejected', 'Plaintext access token field is rejected.');
    }

    if (hasOwn(unsafeInput, 'plaintextRefreshToken')) {
      return result(false, 'plaintext_token_field_rejected', 'Plaintext refresh token field is rejected.');
    }

    if (hasOwn(unsafeInput, 'rawLwaResponse')) {
      return result(false, 'raw_lwa_response_rejected', 'Raw LWA response field is rejected.');
    }

    if (hasOwn(unsafeInput, 'rawAuthorizationCode')) {
      return result(false, 'raw_authorization_code_rejected', 'Raw authorization code field is rejected.');
    }

    if (hasOwn(unsafeInput, 'rawClientSecret')) {
      return result(false, 'raw_client_secret_rejected', 'Raw client secret field is rejected.');
    }

    if (!companyId) {
      return result(false, 'missing_company_id', 'Company id is required.');
    }

    if (!storeId) {
      return result(false, 'missing_store_id', 'Store id is required.');
    }

    if (!marketplaceId) {
      return result(false, 'missing_marketplace_id', 'Marketplace id is required.');
    }

    if (!region) {
      return result(false, 'missing_region', 'Region is required.');
    }

    if (!sellingPartnerId) {
      return result(false, 'missing_selling_partner_id', 'Selling partner id is required.');
    }

    if (!encryptedRefreshToken) {
      return result(false, 'missing_encrypted_refresh_token', 'Encrypted refresh token is required.');
    }

    if (!refreshTokenFingerprint) {
      return result(false, 'missing_refresh_token_fingerprint', 'Refresh token fingerprint is required.');
    }

    if (!encryptionKeyId) {
      return result(false, 'missing_encryption_key_id', 'Encryption key id is required.');
    }

    if (!encryptionAlgorithm) {
      return result(false, 'missing_encryption_algorithm', 'Encryption algorithm is required.');
    }

    if (tokenVersion <= 0) {
      return result(false, 'invalid_token_version', 'Positive token version is required.');
    }

    if (!status) {
      return result(false, 'invalid_status', 'Credential status is invalid.');
    }

    if (status === 'revoked' && !input.revokedAt) {
      return result(false, 'revoked_status_requires_revoked_at', 'revokedAt is required when status is revoked.');
    }

    return result(
      true,
      'ready',
      'Encrypted credential repository payload accepted by test double; no Prisma write executed.',
    );
  }
}
