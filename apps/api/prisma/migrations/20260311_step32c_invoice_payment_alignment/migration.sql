-- ============================================================
-- Step 32C: invoice/payment schema alignment
-- Purpose:
--   Align legacy DB objects to current Prisma schema.prisma
--   for Invoice / PaymentReceipt / InvoiceStatus.
--
-- IMPORTANT:
--   - This migration is intended for NEW / not-yet-patched DBs.
--   - On the CURRENT production DB, changes were already applied
--     manually, so use:
--       npx prisma migrate resolve --applied 20260311_step32c_invoice_payment_alignment
--     instead of re-running this SQL.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1) Align enum InvoiceStatus
-- Legacy DB values:
--   DRAFT, SENT, PARTIAL, PAID, OVERDUE, CANCELLED
-- Target schema values:
--   DRAFT, ISSUED, PARTIALLY_PAID, PAID, OVERDUE, CANCELED
-- ------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'InvoiceStatus' AND e.enumlabel = 'SENT'
  ) THEN
    ALTER TYPE "InvoiceStatus" RENAME VALUE 'SENT' TO 'ISSUED';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'InvoiceStatus' AND e.enumlabel = 'PARTIAL'
  ) THEN
    ALTER TYPE "InvoiceStatus" RENAME VALUE 'PARTIAL' TO 'PARTIALLY_PAID';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'InvoiceStatus' AND e.enumlabel = 'CANCELLED'
  ) THEN
    ALTER TYPE "InvoiceStatus" RENAME VALUE 'CANCELLED' TO 'CANCELED';
  END IF;
END $$;

-- ------------------------------------------------------------
-- 2) Align Invoice columns
-- Legacy DB:
--   invoiceNumber, subtotal, tax, total
-- Target schema:
--   invoiceNo, totalAmount
-- ------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Invoice'
      AND column_name = 'invoiceNumber'
  ) THEN
    ALTER TABLE "Invoice" RENAME COLUMN "invoiceNumber" TO "invoiceNo";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Invoice'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Invoice'
      AND column_name = 'totalAmount'
  ) THEN
    ALTER TABLE "Invoice" ADD COLUMN "totalAmount" INTEGER;
  END IF;
END $$;

-- Fill totalAmount from old columns where relevant
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Invoice'
      AND column_name = 'totalAmount'
  ) THEN

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Invoice'
        AND column_name = 'total'
    ) THEN
      EXECUTE 'UPDATE "Invoice" SET "totalAmount" = COALESCE("totalAmount","total",0)';
    ELSIF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Invoice'
        AND column_name = 'subtotal'
    ) THEN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Invoice'
          AND column_name = 'tax'
      ) THEN
        EXECUTE 'UPDATE "Invoice" SET "totalAmount" = COALESCE("totalAmount","subtotal" + COALESCE("tax",0),0)';
      ELSE
        EXECUTE 'UPDATE "Invoice" SET "totalAmount" = COALESCE("totalAmount","subtotal",0)';
      END IF;
    END IF;

    EXECUTE 'UPDATE "Invoice" SET "totalAmount" = COALESCE("totalAmount",0)';
    EXECUTE 'ALTER TABLE "Invoice" ALTER COLUMN "totalAmount" SET NOT NULL';
  END IF;
END $$;

ALTER TABLE "Invoice" DROP COLUMN IF EXISTS "subtotal";
ALTER TABLE "Invoice" DROP COLUMN IF EXISTS "tax";
ALTER TABLE "Invoice" DROP COLUMN IF EXISTS "total";

-- ------------------------------------------------------------
-- 3) Align PaymentReceipt columns
-- Current schema has no updatedAt
-- ------------------------------------------------------------

ALTER TABLE "PaymentReceipt" DROP COLUMN IF EXISTS "updatedAt";

COMMIT;
