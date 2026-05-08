-- CreateEnum
CREATE TYPE "AmazonSpApiConnectionStatus" AS ENUM ('AUTHORIZATION_PENDING', 'CONNECTED', 'REVOKED', 'EXPIRED', 'ERROR');

-- CreateTable
CREATE TABLE "AmazonSpApiConnection" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "marketplaceId" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "sellingPartnerId" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "status" "AmazonSpApiConnectionStatus" NOT NULL DEFAULT 'AUTHORIZATION_PENDING',
    "connectedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "lastTokenRefreshAt" TIMESTAMP(3),
    "lastHealthCheckAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "lastErrorMessageRedacted" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmazonSpApiConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmazonSpApiCredential" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "encryptedRefreshToken" TEXT NOT NULL,
    "encryptionKeyId" TEXT NOT NULL,
    "encryptionAlgorithm" TEXT NOT NULL,
    "tokenVersion" INTEGER NOT NULL,
    "rotatedAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmazonSpApiCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmazonSpApiAccessTokenCache" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "encryptedAccessToken" TEXT NOT NULL,
    "tokenType" TEXT NOT NULL,
    "scope" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmazonSpApiAccessTokenCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmazonSpApiConnectionAudit" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "messageRedacted" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AmazonSpApiConnectionAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AmazonSpApiConnection_companyId_idx" ON "AmazonSpApiConnection"("companyId");

-- CreateIndex
CREATE INDEX "AmazonSpApiConnection_storeId_idx" ON "AmazonSpApiConnection"("storeId");

-- CreateIndex
CREATE INDEX "AmazonSpApiConnection_marketplaceId_idx" ON "AmazonSpApiConnection"("marketplaceId");

-- CreateIndex
CREATE INDEX "AmazonSpApiConnection_region_idx" ON "AmazonSpApiConnection"("region");

-- CreateIndex
CREATE INDEX "AmazonSpApiConnection_status_idx" ON "AmazonSpApiConnection"("status");

-- CreateIndex
CREATE INDEX "AmazonSpApiConnection_lastSyncAt_idx" ON "AmazonSpApiConnection"("lastSyncAt");

-- CreateIndex
CREATE UNIQUE INDEX "AmazonSpApiConnection_companyId_storeId_marketplaceId_regio_key" ON "AmazonSpApiConnection"("companyId", "storeId", "marketplaceId", "region");

-- CreateIndex
CREATE UNIQUE INDEX "AmazonSpApiConnection_sellingPartnerId_marketplaceId_region_key" ON "AmazonSpApiConnection"("sellingPartnerId", "marketplaceId", "region");

-- CreateIndex
CREATE UNIQUE INDEX "AmazonSpApiCredential_connectionId_key" ON "AmazonSpApiCredential"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "AmazonSpApiAccessTokenCache_connectionId_key" ON "AmazonSpApiAccessTokenCache"("connectionId");

-- CreateIndex
CREATE INDEX "AmazonSpApiAccessTokenCache_expiresAt_idx" ON "AmazonSpApiAccessTokenCache"("expiresAt");

-- CreateIndex
CREATE INDEX "AmazonSpApiConnectionAudit_companyId_idx" ON "AmazonSpApiConnectionAudit"("companyId");

-- CreateIndex
CREATE INDEX "AmazonSpApiConnectionAudit_storeId_idx" ON "AmazonSpApiConnectionAudit"("storeId");

-- CreateIndex
CREATE INDEX "AmazonSpApiConnectionAudit_connectionId_idx" ON "AmazonSpApiConnectionAudit"("connectionId");

-- CreateIndex
CREATE INDEX "AmazonSpApiConnectionAudit_eventType_idx" ON "AmazonSpApiConnectionAudit"("eventType");

-- CreateIndex
CREATE INDEX "AmazonSpApiConnectionAudit_createdAt_idx" ON "AmazonSpApiConnectionAudit"("createdAt");

-- AddForeignKey
ALTER TABLE "AmazonSpApiConnection" ADD CONSTRAINT "AmazonSpApiConnection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmazonSpApiConnection" ADD CONSTRAINT "AmazonSpApiConnection_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmazonSpApiCredential" ADD CONSTRAINT "AmazonSpApiCredential_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "AmazonSpApiConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmazonSpApiAccessTokenCache" ADD CONSTRAINT "AmazonSpApiAccessTokenCache_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "AmazonSpApiConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmazonSpApiConnectionAudit" ADD CONSTRAINT "AmazonSpApiConnectionAudit_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "AmazonSpApiConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmazonSpApiConnectionAudit" ADD CONSTRAINT "AmazonSpApiConnectionAudit_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmazonSpApiConnectionAudit" ADD CONSTRAINT "AmazonSpApiConnectionAudit_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

