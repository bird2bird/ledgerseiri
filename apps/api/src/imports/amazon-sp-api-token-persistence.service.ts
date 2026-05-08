import { Injectable } from '@nestjs/common';
import {
  AmazonSpApiConnectionReadModel,
  AmazonSpApiPersistAccessTokenCacheInput,
  AmazonSpApiPersistRefreshCredentialInput,
  AmazonSpApiTokenPersistenceConnectionScope,
  AmazonSpApiTokenPersistenceRepository,
} from './amazon-sp-api-token-persistence.repository';

function assertNonEmpty(value: string, fieldName: string): string {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(`Amazon SP-API token persistence validation failed: ${fieldName} is required.`);
  }

  return normalized;
}

function assertPositiveInteger(value: number, fieldName: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Amazon SP-API token persistence validation failed: ${fieldName} must be a positive integer.`);
  }

  return value;
}

function assertValidDate(value: Date, fieldName: string): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new Error(`Amazon SP-API token persistence validation failed: ${fieldName} must be a valid Date.`);
  }

  return value;
}

@Injectable()
export class AmazonSpApiTokenPersistenceService {
  constructor(private readonly repository: AmazonSpApiTokenPersistenceRepository) {}

  async persistEncryptedRefreshCredential(
    input: AmazonSpApiPersistRefreshCredentialInput,
  ): Promise<AmazonSpApiConnectionReadModel> {
    return this.repository.upsertConnectionWithEncryptedRefreshCredential({
      companyId: assertNonEmpty(input.companyId, 'companyId'),
      storeId: assertNonEmpty(input.storeId, 'storeId'),
      marketplaceId: assertNonEmpty(input.marketplaceId, 'marketplaceId'),
      region: assertNonEmpty(input.region, 'region'),
      sellingPartnerId: assertNonEmpty(input.sellingPartnerId, 'sellingPartnerId'),
      appId: assertNonEmpty(input.appId, 'appId'),
      encryptedRefreshToken: assertNonEmpty(input.encryptedRefreshToken, 'encryptedRefreshToken'),
      encryptionKeyId: assertNonEmpty(input.encryptionKeyId, 'encryptionKeyId'),
      encryptionAlgorithm: assertNonEmpty(input.encryptionAlgorithm, 'encryptionAlgorithm'),
      tokenVersion: assertPositiveInteger(input.tokenVersion, 'tokenVersion'),
      connectedAt: input.connectedAt ? assertValidDate(input.connectedAt, 'connectedAt') : undefined,
      auditMessage: input.auditMessage,
      auditMetadataJson: input.auditMetadataJson,
    });
  }

  async persistEncryptedAccessTokenCache(
    input: AmazonSpApiPersistAccessTokenCacheInput,
  ): Promise<AmazonSpApiConnectionReadModel> {
    return this.repository.upsertAccessTokenCache({
      companyId: assertNonEmpty(input.companyId, 'companyId'),
      storeId: assertNonEmpty(input.storeId, 'storeId'),
      marketplaceId: assertNonEmpty(input.marketplaceId, 'marketplaceId'),
      region: assertNonEmpty(input.region, 'region'),
      encryptedAccessToken: assertNonEmpty(input.encryptedAccessToken, 'encryptedAccessToken'),
      tokenType: assertNonEmpty(input.tokenType, 'tokenType'),
      expiresAt: assertValidDate(input.expiresAt, 'expiresAt'),
      scope: input.scope?.trim() || undefined,
      auditMessage: input.auditMessage,
      auditMetadataJson: input.auditMetadataJson,
    });
  }

  async readConnectionStatus(
    scope: AmazonSpApiTokenPersistenceConnectionScope,
  ): Promise<AmazonSpApiConnectionReadModel | null> {
    return this.repository.readConnectionStatus({
      companyId: assertNonEmpty(scope.companyId, 'companyId'),
      storeId: assertNonEmpty(scope.storeId, 'storeId'),
      marketplaceId: assertNonEmpty(scope.marketplaceId, 'marketplaceId'),
      region: assertNonEmpty(scope.region, 'region'),
    });
  }

  async revokeConnection(
    scope: AmazonSpApiTokenPersistenceConnectionScope & {
      auditMessage?: string;
      auditMetadataJson?: unknown;
    },
  ): Promise<AmazonSpApiConnectionReadModel | null> {
    return this.repository.revokeConnection({
      companyId: assertNonEmpty(scope.companyId, 'companyId'),
      storeId: assertNonEmpty(scope.storeId, 'storeId'),
      marketplaceId: assertNonEmpty(scope.marketplaceId, 'marketplaceId'),
      region: assertNonEmpty(scope.region, 'region'),
      auditMessage: scope.auditMessage,
      auditMetadataJson: scope.auditMetadataJson,
    });
  }
}
