import {
  AmazonSpApiCredentialRepository,
  type AmazonSpApiCredentialPrismaDelegate,
  type AmazonSpApiCredentialStatus,
  type AmazonSpApiEncryptedCredentialRepositoryInput,
  type AmazonSpApiEncryptedCredentialRepositoryRealWriteResult,
} from './amazon-sp-api-credential.repository';

export type AmazonSpApiTokenPersistenceOrchestratorInput = {
  companyId: string;
  storeId: string;
  marketplaceId: string;
  region: string;
  sellingPartnerId: string;

  transportAccepted: boolean;
  parserAccepted: boolean;
  persistenceInputAccepted: boolean;

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

export type AmazonSpApiTokenPersistenceOrchestratorRealWriteResult = {
  accepted: boolean;
  source: 'amazon-sp-api-token-persistence-orchestrator-real-write';
  orchestratorMode: 'repository-real-write-wiring-mocked-prisma';
  reason:
    | AmazonSpApiTokenPersistenceOrchestratorResult['reason']
    | 'missing_prisma_delegate'
    | 'repository_real_write_rejected'
    | 'prisma_upsert_exception';
  messageRedacted: string;
  transportAccepted: boolean;
  parserAccepted: boolean;
  persistenceInputAccepted: boolean;
  repositoryAccepted: boolean;
  repositoryReason?: string;
  repositoryMethodCalled: 'upsertEncryptedCredentialRealWrite' | null;
  repositoryMode: 'mocked-prisma-delegate-real-write-contract' | null;
  mockedPrismaDelegateUsedNow: boolean;
  controllerWiringNow: false;
  oauthCallbackWiringNow: false;
  oauthCallbackPersistenceWiringNow: false;
  amazonNetworkCallNow: false;
  prismaClientWriteNow: true;
  databaseWriteNow: true;
  tokenPersistenceDatabaseWriteNow: true;
  plaintextTokenDatabaseWriteNow: false;
  rawTokenReturnedNow: false;
  rawLwaResponseReturnedNow: false;
  rawAccessTokenReturnedNow: false;
  rawRefreshTokenReturnedNow: false;
  persistedCredentialShape: AmazonSpApiEncryptedCredentialRepositoryRealWriteResult['persistedCredentialShape'];
};

export type AmazonSpApiTokenPersistenceOrchestratorResult = {
  accepted: boolean;
  source: 'amazon-sp-api-token-persistence-orchestrator';
  orchestrationMode: 'test-double-no-controller-no-prisma-write';
  reason:
    | 'ready'
    | 'transport_not_accepted'
    | 'parser_not_accepted'
    | 'persistence_input_not_accepted'
    | 'repository_rejected'
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
    | 'raw_client_secret_rejected';
  messageRedacted: string;
  transportAccepted: boolean;
  parserAccepted: boolean;
  persistenceInputAccepted: boolean;
  repositoryAccepted: boolean;
  companyIdPresent: boolean;
  storeIdPresent: boolean;
  marketplaceIdPresent: boolean;
  regionPresent: boolean;
  sellingPartnerIdPresent: boolean;
  encryptedRefreshTokenPresent: boolean;
  refreshTokenFingerprintPresent: boolean;
  encryptionKeyIdPresent: boolean;
  encryptionAlgorithmPresent: boolean;
  tokenVersion: number;
  status: AmazonSpApiCredentialStatus | null;
  repositoryReason?: string;
  rawTokenReturnedNow: false;
  rawLwaResponseReturnedNow: false;
  controllerWiringNow: false;
  oauthCallbackWiringNow: false;
  amazonNetworkCallNow: false;
  prismaClientWriteNow: false;
  databaseWriteNow: false;
  tokenPersistenceDatabaseWriteNow: false;
  plaintextTokenDatabaseWriteNow: false;
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

function isStatus(value: unknown): value is AmazonSpApiCredentialStatus {
  return (
    value === 'active' ||
    value === 'needs_reauth' ||
    value === 'revoked' ||
    value === 'error'
  );
}

export class AmazonSpApiTokenPersistenceOrchestrator {
  constructor(
    private readonly credentialRepository = new AmazonSpApiCredentialRepository(),
  ) {}

  async persistEncryptedTokensRealWrite(
    input: AmazonSpApiTokenPersistenceOrchestratorInput,
    prismaDelegate: AmazonSpApiCredentialPrismaDelegate | null | undefined,
  ): Promise<AmazonSpApiTokenPersistenceOrchestratorRealWriteResult> {
    const unsafeInput = input as Record<string, unknown>;

    const companyId = normalize(input.companyId);
    const storeId = normalize(input.storeId);
    const marketplaceId = normalize(input.marketplaceId);
    const region = normalize(input.region);
    const sellingPartnerId = normalize(input.sellingPartnerId);
    const encryptedRefreshToken = normalize(input.encryptedRefreshToken);
    const refreshTokenFingerprint = normalize(input.refreshTokenFingerprint);
    const encryptionKeyId = normalize(input.encryptionKeyId);
    const encryptionAlgorithm = normalize(input.encryptionAlgorithm);
    const tokenVersion = normalizeTokenVersion(input.tokenVersion);
    const status = isStatus(input.status) ? input.status : null;

    const result = (
      accepted: boolean,
      reason: AmazonSpApiTokenPersistenceOrchestratorRealWriteResult['reason'],
      messageRedacted: string,
      repositoryAccepted = false,
      repositoryReason?: string,
      repositoryMethodCalled: AmazonSpApiTokenPersistenceOrchestratorRealWriteResult['repositoryMethodCalled'] = null,
      repositoryMode: AmazonSpApiTokenPersistenceOrchestratorRealWriteResult['repositoryMode'] = null,
      persistedCredentialShape: AmazonSpApiTokenPersistenceOrchestratorRealWriteResult['persistedCredentialShape'] = null,
    ): AmazonSpApiTokenPersistenceOrchestratorRealWriteResult => ({
      accepted,
      source: 'amazon-sp-api-token-persistence-orchestrator-real-write',
      orchestratorMode: 'repository-real-write-wiring-mocked-prisma',
      reason,
      messageRedacted,
      transportAccepted: input.transportAccepted === true,
      parserAccepted: input.parserAccepted === true,
      persistenceInputAccepted: input.persistenceInputAccepted === true,
      repositoryAccepted,
      repositoryReason,
      repositoryMethodCalled,
      repositoryMode,
      mockedPrismaDelegateUsedNow: Boolean(
        prismaDelegate && typeof prismaDelegate.upsert === 'function',
      ),
      controllerWiringNow: false,
      oauthCallbackWiringNow: false,
      oauthCallbackPersistenceWiringNow: false,
      amazonNetworkCallNow: false,
      prismaClientWriteNow: true,
      databaseWriteNow: true,
      tokenPersistenceDatabaseWriteNow: true,
      plaintextTokenDatabaseWriteNow: false,
      rawTokenReturnedNow: false,
      rawLwaResponseReturnedNow: false,
      rawAccessTokenReturnedNow: false,
      rawRefreshTokenReturnedNow: false,
      persistedCredentialShape,
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

    if (input.transportAccepted !== true) {
      return result(false, 'transport_not_accepted', 'Transport result must be accepted before real-write persistence orchestration.');
    }

    if (input.parserAccepted !== true) {
      return result(false, 'parser_not_accepted', 'Sanitized parser result must be accepted before real-write persistence orchestration.');
    }

    if (input.persistenceInputAccepted !== true) {
      return result(false, 'persistence_input_not_accepted', 'Persistence input builder result must be accepted before real-write repository orchestration.');
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

    if (!prismaDelegate || typeof prismaDelegate.upsert !== 'function') {
      return result(
        false,
        'missing_prisma_delegate',
        'Mocked Prisma delegate is required for orchestrator real-write verification.',
      );
    }

    const repositoryInput: AmazonSpApiEncryptedCredentialRepositoryInput = {
      companyId,
      storeId,
      marketplaceId,
      region,
      sellingPartnerId,
      encryptedRefreshToken,
      encryptedAccessTokenCache: input.encryptedAccessTokenCache ?? null,
      accessTokenExpiresAt: input.accessTokenExpiresAt ?? null,
      refreshTokenFingerprint,
      accessTokenFingerprint: input.accessTokenFingerprint ?? null,
      encryptionKeyId,
      encryptionAlgorithm,
      tokenVersion,
      status,
      lastValidatedAt: input.lastValidatedAt ?? null,
      revokedAt: input.revokedAt ?? null,
    };

    const repositoryResult =
      await this.credentialRepository.upsertEncryptedCredentialRealWrite(
        repositoryInput,
        prismaDelegate,
      );

    if (!repositoryResult.accepted) {
      const orchestratorReason =
        repositoryResult.reason === 'prisma_upsert_exception'
          ? 'prisma_upsert_exception'
          : 'repository_real_write_rejected';

      return result(
        false,
        orchestratorReason,
        'Repository mocked real-write rejected encrypted credential payload.',
        false,
        repositoryResult.reason,
        'upsertEncryptedCredentialRealWrite',
        repositoryResult.repositoryMode,
        repositoryResult.persistedCredentialShape,
      );
    }

    return result(
      true,
      'ready',
      'Token persistence orchestration accepted by mocked Prisma real-write repository; no controller wiring executed.',
      true,
      repositoryResult.reason,
      'upsertEncryptedCredentialRealWrite',
      repositoryResult.repositoryMode,
      repositoryResult.persistedCredentialShape,
    );
  }

  persistTokenExchangeResultTestDouble(
    input: AmazonSpApiTokenPersistenceOrchestratorInput,
  ): AmazonSpApiTokenPersistenceOrchestratorResult {
    const unsafeInput = input as Record<string, unknown>;

    const companyId = normalize(input.companyId);
    const storeId = normalize(input.storeId);
    const marketplaceId = normalize(input.marketplaceId);
    const region = normalize(input.region);
    const sellingPartnerId = normalize(input.sellingPartnerId);
    const encryptedRefreshToken = normalize(input.encryptedRefreshToken);
    const refreshTokenFingerprint = normalize(input.refreshTokenFingerprint);
    const encryptionKeyId = normalize(input.encryptionKeyId);
    const encryptionAlgorithm = normalize(input.encryptionAlgorithm);
    const tokenVersion = normalizeTokenVersion(input.tokenVersion);
    const status = isStatus(input.status) ? input.status : null;

    const result = (
      accepted: boolean,
      reason: AmazonSpApiTokenPersistenceOrchestratorResult['reason'],
      messageRedacted: string,
      repositoryAccepted = false,
      repositoryReason?: string,
    ): AmazonSpApiTokenPersistenceOrchestratorResult => ({
      accepted,
      source: 'amazon-sp-api-token-persistence-orchestrator',
      orchestrationMode: 'test-double-no-controller-no-prisma-write',
      reason,
      messageRedacted,
      transportAccepted: input.transportAccepted === true,
      parserAccepted: input.parserAccepted === true,
      persistenceInputAccepted: input.persistenceInputAccepted === true,
      repositoryAccepted,
      companyIdPresent: companyId.length > 0,
      storeIdPresent: storeId.length > 0,
      marketplaceIdPresent: marketplaceId.length > 0,
      regionPresent: region.length > 0,
      sellingPartnerIdPresent: sellingPartnerId.length > 0,
      encryptedRefreshTokenPresent: encryptedRefreshToken.length > 0,
      refreshTokenFingerprintPresent: refreshTokenFingerprint.length > 0,
      encryptionKeyIdPresent: encryptionKeyId.length > 0,
      encryptionAlgorithmPresent: encryptionAlgorithm.length > 0,
      tokenVersion,
      status,
      repositoryReason,
      rawTokenReturnedNow: false,
      rawLwaResponseReturnedNow: false,
      controllerWiringNow: false,
      oauthCallbackWiringNow: false,
      amazonNetworkCallNow: false,
      prismaClientWriteNow: false,
      databaseWriteNow: false,
      tokenPersistenceDatabaseWriteNow: false,
      plaintextTokenDatabaseWriteNow: false,
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

    if (input.transportAccepted !== true) {
      return result(false, 'transport_not_accepted', 'Transport result must be accepted before persistence orchestration.');
    }

    if (input.parserAccepted !== true) {
      return result(false, 'parser_not_accepted', 'Sanitized parser result must be accepted before persistence orchestration.');
    }

    if (input.persistenceInputAccepted !== true) {
      return result(false, 'persistence_input_not_accepted', 'Persistence input builder result must be accepted before repository orchestration.');
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

    const repositoryInput: AmazonSpApiEncryptedCredentialRepositoryInput = {
      companyId,
      storeId,
      marketplaceId,
      region,
      sellingPartnerId,
      encryptedRefreshToken,
      encryptedAccessTokenCache: input.encryptedAccessTokenCache ?? null,
      accessTokenExpiresAt: input.accessTokenExpiresAt ?? null,
      refreshTokenFingerprint,
      accessTokenFingerprint: input.accessTokenFingerprint ?? null,
      encryptionKeyId,
      encryptionAlgorithm,
      tokenVersion,
      status,
      lastValidatedAt: input.lastValidatedAt ?? null,
      revokedAt: input.revokedAt ?? null,
    };

    const repositoryResult =
      this.credentialRepository.upsertEncryptedCredentialTestDouble(repositoryInput);

    if (!repositoryResult.accepted) {
      return result(
        false,
        'repository_rejected',
        'Repository test-double rejected encrypted credential payload.',
        false,
        repositoryResult.reason,
      );
    }

    return result(
      true,
      'ready',
      'Token persistence orchestration accepted by test double; no controller wiring and no Prisma write executed.',
      true,
      repositoryResult.reason,
    );
  }
}
