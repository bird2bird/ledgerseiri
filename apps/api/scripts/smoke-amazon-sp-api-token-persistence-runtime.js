#!/usr/bin/env node
"use strict";

const { PrismaClient, AmazonSpApiConnectionStatus } = require("@prisma/client");
const { AmazonSpApiTokenPersistenceRepository } = require("../dist/src/imports/amazon-sp-api-token-persistence.repository");
const { AmazonSpApiTokenPersistenceService } = require("../dist/src/imports/amazon-sp-api-token-persistence.service");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertNoTokenFields(readModel, label) {
  const serialized = JSON.stringify(readModel);
  assert(!serialized.includes("encryptedRefreshToken"), `${label} leaked encryptedRefreshToken`);
  assert(!serialized.includes("encryptedAccessToken"), `${label} leaked encryptedAccessToken`);
  assert(!serialized.includes("refreshToken:"), `${label} leaked refreshToken marker`);
  assert(!serialized.includes("accessToken:"), `${label} leaked accessToken marker`);
}

async function cleanupFixture(prisma, fixture) {
  const connections = await prisma.amazonSpApiConnection.findMany({
    where: {
      OR: [
        { companyId: fixture.companyId },
        { storeId: fixture.storeId },
        { sellingPartnerId: fixture.sellingPartnerId },
        { appId: fixture.appId },
      ],
    },
    select: { id: true },
  });

  const connectionIds = connections.map((x) => x.id);

  if (connectionIds.length) {
    await prisma.amazonSpApiAccessTokenCache.deleteMany({
      where: { connectionId: { in: connectionIds } },
    });

    await prisma.amazonSpApiCredential.deleteMany({
      where: { connectionId: { in: connectionIds } },
    });

    await prisma.amazonSpApiConnectionAudit.deleteMany({
      where: { connectionId: { in: connectionIds } },
    });

    await prisma.amazonSpApiConnection.deleteMany({
      where: { id: { in: connectionIds } },
    });
  }

  await prisma.store.deleteMany({
    where: {
      id: fixture.storeId,
      companyId: fixture.companyId,
    },
  });

  await prisma.company.deleteMany({
    where: {
      id: fixture.companyId,
    },
  });
}

async function createCompanyStoreFixture(prisma, fixture) {
  await prisma.company.create({
    data: {
      id: fixture.companyId,
      name: `Step125-C Runtime Smoke Company ${fixture.ts}`,
      fiscalMonthStart: 1,
      timezone: "Asia/Tokyo",
      currency: "JPY",
    },
  });

  await prisma.store.create({
    data: {
      id: fixture.storeId,
      companyId: fixture.companyId,
      name: `Step125-C Runtime Smoke Store ${fixture.ts}`,
      platform: "AMAZON",
      region: "JP",
    },
  });
}

async function main() {
  const prisma = new PrismaClient();
  const repository = new AmazonSpApiTokenPersistenceRepository(prisma);
  const service = new AmazonSpApiTokenPersistenceService(repository);

  const ts = Date.now();
  const fixture = {
    ts,
    companyId: `step125c-company-${ts}`,
    storeId: `step125c-store-${ts}`,
    marketplaceId: "A1VC38T7YXB528",
    region: "FE",
    sellingPartnerId: `A-STEP125C-SELLER-${ts}`,
    appId: `amzn1.application-oa2-client.step125c-${ts}`,
  };

  const connectedAt = new Date("2026-05-08T04:00:00.000Z");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  try {
    await cleanupFixture(prisma, fixture);
    await createCompanyStoreFixture(prisma, fixture);

    const created = await service.persistEncryptedRefreshCredential({
      companyId: fixture.companyId,
      storeId: fixture.storeId,
      marketplaceId: fixture.marketplaceId,
      region: fixture.region,
      sellingPartnerId: fixture.sellingPartnerId,
      appId: fixture.appId,
      encryptedRefreshToken: `enc-refresh-token-${ts}`,
      encryptionKeyId: "kms-test-key-step125c",
      encryptionAlgorithm: "AES-256-GCM",
      tokenVersion: 1,
      connectedAt,
      auditMessage: "credentialStored refreshToken=SHOULD_NOT_APPEAR clientSecret=SHOULD_NOT_APPEAR",
      auditMetadataJson: {
        smoke: "step125-c",
        phase: "refreshCredential",
      },
    });

    assert(created.companyId === fixture.companyId, "created read model companyId mismatch");
    assert(created.storeId === fixture.storeId, "created read model storeId mismatch");
    assert(created.marketplaceId === fixture.marketplaceId, "created read model marketplaceId mismatch");
    assert(created.region === fixture.region, "created read model region mismatch");
    assert(created.sellingPartnerId === fixture.sellingPartnerId, "created sellingPartnerId mismatch");
    assert(created.appId === fixture.appId, "created appId mismatch");
    assert(created.status === AmazonSpApiConnectionStatus.CONNECTED, "created status must be CONNECTED");
    assert(created.connectedAt && new Date(created.connectedAt).toISOString() === connectedAt.toISOString(), "created connectedAt mismatch");
    assert(created.revokedAt === null, "created revokedAt must be null");
    assertNoTokenFields(created, "created read model");

    const connection = await prisma.amazonSpApiConnection.findUnique({
      where: {
        companyId_storeId_marketplaceId_region: {
          companyId: fixture.companyId,
          storeId: fixture.storeId,
          marketplaceId: fixture.marketplaceId,
          region: fixture.region,
        },
      },
    });

    assert(connection, "connection row not created");
    assert(connection.status === AmazonSpApiConnectionStatus.CONNECTED, "connection row status mismatch");
    assert(connection.appId === fixture.appId, "connection row appId mismatch");

    const credential = await prisma.amazonSpApiCredential.findUnique({
      where: { connectionId: connection.id },
    });

    assert(credential, "credential row not created");
    assert(credential.encryptedRefreshToken === `enc-refresh-token-${ts}`, "credential encryptedRefreshToken mismatch");
    assert(credential.encryptionKeyId === "kms-test-key-step125c", "credential encryptionKeyId mismatch");
    assert(credential.encryptionAlgorithm === "AES-256-GCM", "credential encryptionAlgorithm mismatch");
    assert(credential.tokenVersion === 1, "credential tokenVersion mismatch");
    assert(credential.rotatedAt instanceof Date, "credential rotatedAt missing");
    assert(credential.revokedAt === null, "credential revokedAt should be null after write");

    const credentialAudit = await prisma.amazonSpApiConnectionAudit.findFirst({
      where: {
        connectionId: connection.id,
        eventType: "credentialStored",
      },
      orderBy: { createdAt: "desc" },
    });

    assert(credentialAudit, "credentialStored audit missing");
    assert(credentialAudit.messageRedacted.includes("[REDACTED]"), "credentialStored audit must redact token-like values");
    assert(!credentialAudit.messageRedacted.includes("SHOULD_NOT_APPEAR"), "credentialStored audit leaked secret-like values");

    const cached = await service.persistEncryptedAccessTokenCache({
      companyId: fixture.companyId,
      storeId: fixture.storeId,
      marketplaceId: fixture.marketplaceId,
      region: fixture.region,
      encryptedAccessToken: `enc-access-token-${ts}`,
      tokenType: "bearer",
      expiresAt,
      scope: "sellingpartnerapi::notifications sellingpartnerapi::migrationTest",
      auditMessage: "accessToken=SHOULD_NOT_APPEAR",
      auditMetadataJson: {
        smoke: "step125-c",
        phase: "accessTokenCache",
      },
    });

    assert(cached.lastTokenRefreshAt !== null, "lastTokenRefreshAt must be set after access token cache write");
    assertNoTokenFields(cached, "access token cache read model");

    const accessCache = await prisma.amazonSpApiAccessTokenCache.findUnique({
      where: { connectionId: connection.id },
    });

    assert(accessCache, "access token cache row not created");
    assert(accessCache.encryptedAccessToken === `enc-access-token-${ts}`, "access token cache encryptedAccessToken mismatch");
    assert(accessCache.tokenType === "bearer", "access token cache tokenType mismatch");
    assert(accessCache.scope === "sellingpartnerapi::notifications sellingpartnerapi::migrationTest", "access token cache scope mismatch");
    assert(accessCache.expiresAt.toISOString() === expiresAt.toISOString(), "access token cache expiresAt mismatch");

    const cacheAudit = await prisma.amazonSpApiConnectionAudit.findFirst({
      where: {
        connectionId: connection.id,
        eventType: "accessTokenCached",
      },
      orderBy: { createdAt: "desc" },
    });

    assert(cacheAudit, "accessTokenCached audit missing");
    assert(cacheAudit.messageRedacted.includes("[REDACTED]"), "accessTokenCached audit must redact token-like values");
    assert(!cacheAudit.messageRedacted.includes("SHOULD_NOT_APPEAR"), "accessTokenCached audit leaked token-like value");

    const status = await service.readConnectionStatus({
      companyId: fixture.companyId,
      storeId: fixture.storeId,
      marketplaceId: fixture.marketplaceId,
      region: fixture.region,
    });

    assert(status, "readConnectionStatus returned null");
    assert(status.status === AmazonSpApiConnectionStatus.CONNECTED, "readConnectionStatus must return CONNECTED before revoke");
    assertNoTokenFields(status, "readConnectionStatus read model");

    const revoked = await service.revokeConnection({
      companyId: fixture.companyId,
      storeId: fixture.storeId,
      marketplaceId: fixture.marketplaceId,
      region: fixture.region,
      auditMessage: "connectionRevoked accessToken=SHOULD_NOT_APPEAR refreshToken=SHOULD_NOT_APPEAR",
      auditMetadataJson: {
        smoke: "step125-c",
        phase: "revoke",
      },
    });

    assert(revoked, "revokeConnection returned null");
    assert(revoked.status === AmazonSpApiConnectionStatus.REVOKED, "revoked status mismatch");
    assert(revoked.revokedAt !== null, "revokedAt must be set");
    assertNoTokenFields(revoked, "revoked read model");

    const revokedConnection = await prisma.amazonSpApiConnection.findUnique({
      where: { id: connection.id },
    });

    assert(revokedConnection.status === AmazonSpApiConnectionStatus.REVOKED, "DB connection status should be REVOKED");
    assert(revokedConnection.revokedAt instanceof Date, "DB revokedAt should be set");

    const revokedCredential = await prisma.amazonSpApiCredential.findUnique({
      where: { connectionId: connection.id },
    });

    assert(revokedCredential, "credential should remain after revoke");
    assert(revokedCredential.revokedAt instanceof Date, "credential revokedAt should be set");

    const deletedCache = await prisma.amazonSpApiAccessTokenCache.findUnique({
      where: { connectionId: connection.id },
    });

    assert(deletedCache === null, "access token cache should be deleted after revoke");

    const revokeAudit = await prisma.amazonSpApiConnectionAudit.findFirst({
      where: {
        connectionId: connection.id,
        eventType: "connectionRevoked",
      },
      orderBy: { createdAt: "desc" },
    });

    assert(revokeAudit, "connectionRevoked audit missing");
    assert(revokeAudit.messageRedacted.includes("[REDACTED]"), "connectionRevoked audit must redact token-like values");
    assert(!revokeAudit.messageRedacted.includes("SHOULD_NOT_APPEAR"), "connectionRevoked audit leaked token-like value");

    const auditCount = await prisma.amazonSpApiConnectionAudit.count({
      where: { connectionId: connection.id },
    });

    assert(auditCount >= 3, "expected at least three audit events");

    console.log("[SMOKE_OK] amazon sp-api token persistence runtime smoke passed");
    console.log(JSON.stringify({
      ok: true,
      step: "Step125-C",
      fixture: {
        companyId: fixture.companyId,
        storeId: fixture.storeId,
        marketplaceId: fixture.marketplaceId,
        region: fixture.region,
      },
      connectionId: connection.id,
      auditCount,
      verified: {
        companyStoreFixtureCreated: true,
        connectionUpsert: true,
        credentialUpsert: true,
        accessTokenCacheUpsert: true,
        readModelNoTokenLeak: true,
        auditRedaction: true,
        revokeStatusAndCacheCleanup: true,
      },
    }, null, 2));
  } finally {
    await cleanupFixture(prisma, fixture);
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("[SMOKE_ERROR]", err);
  process.exitCode = 1;
});
