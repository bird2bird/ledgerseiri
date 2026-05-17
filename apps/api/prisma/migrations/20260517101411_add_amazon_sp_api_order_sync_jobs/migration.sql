-- Step149-F: create-only migration for Amazon Orders historical/background sync state.
-- This migration file is created but not applied by this step.

CREATE TYPE "AmazonSpApiOrderSyncJobStatus" AS ENUM (
  'PENDING',
  'RUNNING',
  'PAUSED',
  'SUCCEEDED',
  'PARTIAL_FAILED',
  'FAILED',
  'CANCELLED'
);

CREATE TYPE "AmazonSpApiOrderSyncSegmentStatus" AS ENUM (
  'PENDING',
  'RUNNING',
  'SUCCEEDED',
  'RETRYABLE_FAILED',
  'FAILED',
  'SKIPPED'
);

CREATE TABLE "AmazonSpApiOrderSyncJob" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "marketplaceId" TEXT NOT NULL,
  "region" TEXT NOT NULL DEFAULT 'JP',
  "requestedStartDate" TIMESTAMP(3) NOT NULL,
  "requestedEndDate" TIMESTAMP(3) NOT NULL,
  "status" "AmazonSpApiOrderSyncJobStatus" NOT NULL DEFAULT 'PENDING',
  "totalSegments" INTEGER NOT NULL DEFAULT 0,
  "completedSegments" INTEGER NOT NULL DEFAULT 0,
  "failedSegments" INTEGER NOT NULL DEFAULT 0,
  "lastCompletedWindowEnd" TIMESTAMP(3),
  "lastErrorCode" TEXT,
  "lastErrorMessage" TEXT,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AmazonSpApiOrderSyncJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AmazonSpApiOrderSyncSegment" (
  "id" TEXT NOT NULL,
  "syncJobId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "marketplaceId" TEXT NOT NULL,
  "segmentIndex" INTEGER NOT NULL,
  "createdAfter" TIMESTAMP(3) NOT NULL,
  "createdBefore" TIMESTAMP(3) NOT NULL,
  "status" "AmazonSpApiOrderSyncSegmentStatus" NOT NULL DEFAULT 'PENDING',
  "nextToken" TEXT,
  "pagesFetched" INTEGER NOT NULL DEFAULT 0,
  "ordersFetched" INTEGER NOT NULL DEFAULT 0,
  "itemsFetched" INTEGER NOT NULL DEFAULT 0,
  "retryAttempts" INTEGER NOT NULL DEFAULT 0,
  "lastErrorCode" TEXT,
  "lastErrorMessage" TEXT,
  "createdImportJobId" TEXT,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AmazonSpApiOrderSyncSegment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ImportJob"
  ADD COLUMN "amazonSpApiOrderSyncJobId" TEXT,
  ADD COLUMN "amazonSpApiOrderSyncSegmentId" TEXT;

CREATE INDEX "AmazonSpApiOrderSyncJob_companyId_storeId_marketplaceId_status_idx"
  ON "AmazonSpApiOrderSyncJob"("companyId", "storeId", "marketplaceId", "status");

CREATE INDEX "AmazonSpApiOrderSyncJob_companyId_createdAt_idx"
  ON "AmazonSpApiOrderSyncJob"("companyId", "createdAt");

CREATE INDEX "AmazonSpApiOrderSyncJob_companyId_requestedStartDate_requestedEndDate_idx"
  ON "AmazonSpApiOrderSyncJob"("companyId", "requestedStartDate", "requestedEndDate");

CREATE UNIQUE INDEX "AmazonSpApiOrderSyncSegment_syncJobId_segmentIndex_key"
  ON "AmazonSpApiOrderSyncSegment"("syncJobId", "segmentIndex");

CREATE INDEX "AmazonSpApiOrderSyncSegment_syncJobId_status_idx"
  ON "AmazonSpApiOrderSyncSegment"("syncJobId", "status");

CREATE INDEX "AmazonSpApiOrderSyncSegment_companyId_storeId_marketplaceId_createdAfter_createdBefore_idx"
  ON "AmazonSpApiOrderSyncSegment"("companyId", "storeId", "marketplaceId", "createdAfter", "createdBefore");

CREATE INDEX "AmazonSpApiOrderSyncSegment_createdImportJobId_idx"
  ON "AmazonSpApiOrderSyncSegment"("createdImportJobId");

CREATE INDEX "ImportJob_amazonSpApiOrderSyncJobId_idx"
  ON "ImportJob"("amazonSpApiOrderSyncJobId");

CREATE INDEX "ImportJob_amazonSpApiOrderSyncSegmentId_idx"
  ON "ImportJob"("amazonSpApiOrderSyncSegmentId");

ALTER TABLE "AmazonSpApiOrderSyncJob"
  ADD CONSTRAINT "AmazonSpApiOrderSyncJob_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AmazonSpApiOrderSyncSegment"
  ADD CONSTRAINT "AmazonSpApiOrderSyncSegment_syncJobId_fkey"
  FOREIGN KEY ("syncJobId") REFERENCES "AmazonSpApiOrderSyncJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AmazonSpApiOrderSyncSegment"
  ADD CONSTRAINT "AmazonSpApiOrderSyncSegment_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AmazonSpApiOrderSyncSegment"
  ADD CONSTRAINT "AmazonSpApiOrderSyncSegment_createdImportJobId_fkey"
  FOREIGN KEY ("createdImportJobId") REFERENCES "ImportJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ImportJob"
  ADD CONSTRAINT "ImportJob_amazonSpApiOrderSyncJobId_fkey"
  FOREIGN KEY ("amazonSpApiOrderSyncJobId") REFERENCES "AmazonSpApiOrderSyncJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ImportJob"
  ADD CONSTRAINT "ImportJob_amazonSpApiOrderSyncSegmentId_fkey"
  FOREIGN KEY ("amazonSpApiOrderSyncSegmentId") REFERENCES "AmazonSpApiOrderSyncSegment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
