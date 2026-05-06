-- Step110-E: Existing inventory schema traceability patch
-- This migration intentionally reuses existing ProductSku / InventoryBalance / InventoryMovement.
-- It does not create InventoryStock.
-- It only adds traceability fields needed for later Amazon order deduction and inventory audit.

ALTER TABLE "ProductSku"
  ADD COLUMN IF NOT EXISTS "asin" TEXT,
  ADD COLUMN IF NOT EXISTS "externalSku" TEXT,
  ADD COLUMN IF NOT EXISTS "fulfillmentChannel" TEXT NOT NULL DEFAULT 'FBA';

ALTER TABLE "InventoryMovement"
  ADD COLUMN IF NOT EXISTS "sourceType" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceId" TEXT,
  ADD COLUMN IF NOT EXISTS "importJobId" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceRowNo" INTEGER,
  ADD COLUMN IF NOT EXISTS "transactionId" TEXT,
  ADD COLUMN IF NOT EXISTS "businessMonth" TEXT;

CREATE INDEX IF NOT EXISTS "ProductSku_companyId_storeId_idx"
  ON "ProductSku"("companyId", "storeId");

CREATE INDEX IF NOT EXISTS "ProductSku_companyId_asin_idx"
  ON "ProductSku"("companyId", "asin");

CREATE INDEX IF NOT EXISTS "ProductSku_companyId_externalSku_idx"
  ON "ProductSku"("companyId", "externalSku");

CREATE INDEX IF NOT EXISTS "ProductSku_companyId_fulfillmentChannel_idx"
  ON "ProductSku"("companyId", "fulfillmentChannel");

CREATE INDEX IF NOT EXISTS "InventoryMovement_companyId_importJobId_idx"
  ON "InventoryMovement"("companyId", "importJobId");

CREATE INDEX IF NOT EXISTS "InventoryMovement_companyId_transactionId_idx"
  ON "InventoryMovement"("companyId", "transactionId");

CREATE INDEX IF NOT EXISTS "InventoryMovement_companyId_businessMonth_idx"
  ON "InventoryMovement"("companyId", "businessMonth");

CREATE INDEX IF NOT EXISTS "InventoryMovement_companyId_sourceType_idx"
  ON "InventoryMovement"("companyId", "sourceType");

CREATE INDEX IF NOT EXISTS "InventoryMovement_companyId_sourceId_idx"
  ON "InventoryMovement"("companyId", "sourceId");
