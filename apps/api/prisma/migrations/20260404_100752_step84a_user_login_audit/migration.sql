ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lastLoginIp" TEXT;

CREATE TABLE IF NOT EXISTS "UserLoginEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "loggedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "loginMethod" TEXT NOT NULL DEFAULT 'password',
  "success" BOOLEAN NOT NULL DEFAULT true,
  "failureReason" TEXT,
  CONSTRAINT "UserLoginEvent_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'UserLoginEvent_userId_fkey'
  ) THEN
    ALTER TABLE "UserLoginEvent"
      ADD CONSTRAINT "UserLoginEvent_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "UserLoginEvent_userId_loggedInAt_idx"
  ON "UserLoginEvent"("userId", "loggedInAt");

CREATE INDEX IF NOT EXISTS "UserLoginEvent_loggedInAt_idx"
  ON "UserLoginEvent"("loggedInAt");
