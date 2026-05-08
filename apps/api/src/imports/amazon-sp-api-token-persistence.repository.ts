import { Injectable } from '@nestjs/common';
import { AmazonSpApiConnectionStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';

export type AmazonSpApiTokenPersistenceConnectionScope = {
  companyId: string;
  storeId: string;
  marketplaceId: string;
  region: string;
};

export type AmazonSpApiPersistRefreshCredentialInput = AmazonSpApiTokenPersistenceConnectionScope & {
  sellingPartnerId: string;
  appId: string;
  encryptedRefreshToken: string;
  encryptionKeyId: string;
  encryptionAlgorithm: string;
  tokenVersion: number;
  connectedAt?: Date;
  auditMessage?: string;
  auditMetadataJson?: unknown;
};

export type AmazonSpApiPersistAccessTokenCacheInput = AmazonSpApiTokenPersistenceConnectionScope & {
  encryptedAccessToken: string;
  tokenType: string;
  expiresAt: Date;
  scope?: string;
  auditMessage?: string;
  auditMetadataJson?: unknown;
};

export type AmazonSpApiConnectionReadModel = {
  id: string;
  companyId: string;
  storeId: string;
  marketplaceId: string;
  region: string;
  sellingPartnerId: string;
  appId: string;
  status: AmazonSpApiConnectionStatus;
  connectedAt: Date | null;
  revokedAt: Date | null;
  lastTokenRefreshAt: Date | null;
  lastHealthCheckAt: Date | null;
  lastSyncAt: Date | null;
  lastErrorCode: string | null;
  lastErrorMessageRedacted: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function redactSecretLikeText(message: string | undefined): string {
  const source = message?.trim() || 'Amazon SP-API token persistence event';
  return source
    .replace(/refreshToken\s*[:=]\s*[^,\s}]+/gi, 'refreshToken:[REDACTED]')
    .replace(/accessToken\s*[:=]\s*[^,\s}]+/gi, 'accessToken:[REDACTED]')
    .replace(/clientSecret\s*[:=]\s*[^,\s}]+/gi, 'clientSecret:[REDACTED]')
    .replace(/authorizationCode\s*[:=]\s*[^,\s}]+/gi, 'authorizationCode:[REDACTED]');
}

@Injectable()
export class AmazonSpApiTokenPersistenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertConnectionWithEncryptedRefreshCredential(
    input: AmazonSpApiPersistRefreshCredentialInput,
  ): Promise<AmazonSpApiConnectionReadModel> {
    const now = new Date();
    const connectedAt = input.connectedAt ?? now;

    const connection = await this.prisma.amazonSpApiConnection.upsert({
      where: {
        companyId_storeId_marketplaceId_region: {
          companyId: input.companyId,
          storeId: input.storeId,
          marketplaceId: input.marketplaceId,
          region: input.region,
        },
      },
      create: {
        companyId: input.companyId,
        storeId: input.storeId,
        marketplaceId: input.marketplaceId,
        region: input.region,
        sellingPartnerId: input.sellingPartnerId,
        appId: input.appId,
        status: AmazonSpApiConnectionStatus.CONNECTED,
        connectedAt,
        revokedAt: null,
      },
      update: {
        sellingPartnerId: input.sellingPartnerId,
        appId: input.appId,
        status: AmazonSpApiConnectionStatus.CONNECTED,
        connectedAt,
        revokedAt: null,
      },
    });

    await this.prisma.amazonSpApiCredential.upsert({
      where: {
        connectionId: connection.id,
      },
      create: {
        connectionId: connection.id,
        encryptedRefreshToken: input.encryptedRefreshToken,
        encryptionKeyId: input.encryptionKeyId,
        encryptionAlgorithm: input.encryptionAlgorithm,
        tokenVersion: input.tokenVersion,
        rotatedAt: now,
      },
      update: {
        encryptedRefreshToken: input.encryptedRefreshToken,
        encryptionKeyId: input.encryptionKeyId,
        encryptionAlgorithm: input.encryptionAlgorithm,
        tokenVersion: input.tokenVersion,
        rotatedAt: now,
        revokedAt: null,
      },
    });

    await this.appendAudit({
      connectionId: connection.id,
      companyId: input.companyId,
      storeId: input.storeId,
      eventType: 'credentialStored',
      messageRedacted: redactSecretLikeText(input.auditMessage ?? 'Amazon SP-API refresh credential stored'),
      metadataJson: input.auditMetadataJson,
    });

    return this.toReadModel(connection);
  }

  async upsertAccessTokenCache(
    input: AmazonSpApiPersistAccessTokenCacheInput,
  ): Promise<AmazonSpApiConnectionReadModel> {
    const connection = await this.findConnectionForScope(input);

    if (!connection) {
      throw new Error('Amazon SP-API connection not found for scoped access token cache write.');
    }

    const now = new Date();

    await this.prisma.amazonSpApiAccessTokenCache.upsert({
      where: {
        connectionId: connection.id,
      },
      create: {
        connectionId: connection.id,
        encryptedAccessToken: input.encryptedAccessToken,
        tokenType: input.tokenType,
        scope: input.scope,
        expiresAt: input.expiresAt,
      },
      update: {
        encryptedAccessToken: input.encryptedAccessToken,
        tokenType: input.tokenType,
        scope: input.scope,
        expiresAt: input.expiresAt,
      },
    });

    const refreshed = await this.prisma.amazonSpApiConnection.update({
      where: { id: connection.id },
      data: {
        lastTokenRefreshAt: now,
      },
    });

    await this.appendAudit({
      connectionId: connection.id,
      companyId: input.companyId,
      storeId: input.storeId,
      eventType: 'accessTokenCached',
      messageRedacted: redactSecretLikeText(input.auditMessage ?? 'Amazon SP-API access token cached'),
      metadataJson: input.auditMetadataJson,
    });

    return this.toReadModel(refreshed);
  }

  async readConnectionStatus(
    scope: AmazonSpApiTokenPersistenceConnectionScope,
  ): Promise<AmazonSpApiConnectionReadModel | null> {
    const connection = await this.findConnectionForScope(scope);
    return connection ? this.toReadModel(connection) : null;
  }

  async revokeConnection(
    scope: AmazonSpApiTokenPersistenceConnectionScope & {
      auditMessage?: string;
      auditMetadataJson?: unknown;
    },
  ): Promise<AmazonSpApiConnectionReadModel | null> {
    const connection = await this.findConnectionForScope(scope);

    if (!connection) {
      return null;
    }

    const now = new Date();

    const revoked = await this.prisma.amazonSpApiConnection.update({
      where: {
        id: connection.id,
      },
      data: {
        status: AmazonSpApiConnectionStatus.REVOKED,
        revokedAt: now,
      },
    });

    await this.prisma.amazonSpApiCredential.updateMany({
      where: {
        connectionId: connection.id,
      },
      data: {
        revokedAt: now,
      },
    });

    await this.prisma.amazonSpApiAccessTokenCache.deleteMany({
      where: {
        connectionId: connection.id,
      },
    });

    await this.appendAudit({
      connectionId: connection.id,
      companyId: scope.companyId,
      storeId: scope.storeId,
      eventType: 'connectionRevoked',
      messageRedacted: redactSecretLikeText(scope.auditMessage ?? 'Amazon SP-API connection revoked'),
      metadataJson: scope.auditMetadataJson,
    });

    return this.toReadModel(revoked);
  }

  private async findConnectionForScope(scope: AmazonSpApiTokenPersistenceConnectionScope) {
    return this.prisma.amazonSpApiConnection.findUnique({
      where: {
        companyId_storeId_marketplaceId_region: {
          companyId: scope.companyId,
          storeId: scope.storeId,
          marketplaceId: scope.marketplaceId,
          region: scope.region,
        },
      },
    });
  }

  private async appendAudit(input: {
    connectionId: string;
    companyId: string;
    storeId: string;
    eventType: string;
    messageRedacted: string;
    metadataJson?: unknown;
  }) {
    await this.prisma.amazonSpApiConnectionAudit.create({
      data: {
        connectionId: input.connectionId,
        companyId: input.companyId,
        storeId: input.storeId,
        eventType: input.eventType,
        messageRedacted: redactSecretLikeText(input.messageRedacted),
        metadataJson: input.metadataJson ?? undefined,
      },
    });
  }

  private toReadModel(connection: {
    id: string;
    companyId: string;
    storeId: string;
    marketplaceId: string;
    region: string;
    sellingPartnerId: string;
    appId: string;
    status: AmazonSpApiConnectionStatus;
    connectedAt: Date | null;
    revokedAt: Date | null;
    lastTokenRefreshAt: Date | null;
    lastHealthCheckAt: Date | null;
    lastSyncAt: Date | null;
    lastErrorCode: string | null;
    lastErrorMessageRedacted: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): AmazonSpApiConnectionReadModel {
    return {
      id: connection.id,
      companyId: connection.companyId,
      storeId: connection.storeId,
      marketplaceId: connection.marketplaceId,
      region: connection.region,
      sellingPartnerId: connection.sellingPartnerId,
      appId: connection.appId,
      status: connection.status,
      connectedAt: connection.connectedAt,
      revokedAt: connection.revokedAt,
      lastTokenRefreshAt: connection.lastTokenRefreshAt,
      lastHealthCheckAt: connection.lastHealthCheckAt,
      lastSyncAt: connection.lastSyncAt,
      lastErrorCode: connection.lastErrorCode,
      lastErrorMessageRedacted: connection.lastErrorMessageRedacted,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
    };
  }
}
