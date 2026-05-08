#!/usr/bin/env bash
set -euo pipefail

ROOT="${LEDGERSEIRI_ROOT:-/opt/ledgerseiri}"
API="$ROOT/apps/api"

EXPECTED_COMMIT="${EXPECTED_COMMIT:-8c5c20b9cbbe722f4492835c00f5dffd1816d5b9}"
EXPECTED_MIGRATION_NAME="add_amazon_sp_api_connection_models"

DRY_RUN="${DRY_RUN:-1}"

echo "========== Amazon SP-API migration deploy runbook =========="
echo "[MODE] DRY_RUN=$DRY_RUN"
echo "[ROOT] $ROOT"
echo "[API] $API"

cd "$ROOT"

CURRENT_HEAD="$(git rev-parse HEAD)"
echo "[HEAD] $CURRENT_HEAD"

if [ "$CURRENT_HEAD" != "$EXPECTED_COMMIT" ]; then
  echo "[ERROR] Expected git HEAD $EXPECTED_COMMIT but got $CURRENT_HEAD"
  exit 1
fi

if [ "$(git status --porcelain | wc -l)" != "0" ]; then
  if [ "${DRY_RUN:-1}" = "1" ] && [ "${AMAZON_SP_API_MIGRATION_ALLOW_DIRTY_DRY_RUN_SMOKE:-}" = "YES" ]; then
    echo "[WARN] Working tree is not clean, allowed only for Step124-F dry-run smoke self-test"
    git status
  else
    echo "[ERROR] Working tree is not clean"
    git status
    exit 1
  fi
fi

MIGRATION_FILE="$(find "$API/prisma/migrations" -path "*_${EXPECTED_MIGRATION_NAME}/migration.sql" | sort | tail -1)"

if [ -z "$MIGRATION_FILE" ] || [ ! -f "$MIGRATION_FILE" ]; then
  echo "[ERROR] Migration file not found for $EXPECTED_MIGRATION_NAME"
  exit 1
fi

echo "[MIGRATION_FILE] $MIGRATION_FILE"

python3 <<PY
from pathlib import Path
import re

path = Path("$MIGRATION_FILE")
sql = path.read_text()

required = [
    'CREATE TYPE "AmazonSpApiConnectionStatus"',
    'CREATE TABLE "AmazonSpApiConnection"',
    'CREATE TABLE "AmazonSpApiCredential"',
    'CREATE TABLE "AmazonSpApiAccessTokenCache"',
    'CREATE TABLE "AmazonSpApiConnectionAudit"',
    'ON DELETE RESTRICT',
    'ON UPDATE CASCADE',
    'encryptedRefreshToken',
    'encryptedAccessToken',
]

for marker in required:
    if marker not in sql:
        raise SystemExit(f"[ERROR] migration.sql missing marker: {marker}")

for name, pattern in {
    "DROP_TABLE": r'\\bDROP\\s+TABLE\\b',
    "DROP_COLUMN": r'\\bDROP\\s+COLUMN\\b',
    "DROP_INDEX": r'\\bDROP\\s+INDEX\\b',
    "TRUNCATE": r'\\bTRUNCATE\\b',
    "DELETE_FROM": r'^\\s*DELETE\\s+FROM\\b',
    "UPDATE_ROWS": r'^\\s*UPDATE\\s+',
    "ALTER_TRANSACTION": r'ALTER\\s+TABLE\\s+"?Transaction"?',
    "ALTER_IMPORT_JOB": r'ALTER\\s+TABLE\\s+"?ImportJob"?',
    "ALTER_IMPORT_STAGING_ROW": r'ALTER\\s+TABLE\\s+"?ImportStagingRow"?',
    "ALTER_INVENTORY": r'ALTER\\s+TABLE\\s+"?(InventoryBalance|InventoryMovement)"?',
    "ALTER_PRODUCT": r'ALTER\\s+TABLE\\s+"?(Product|ProductSku|ProductSkuAlias)"?',
    "ALTER_ACCOUNT": r'ALTER\\s+TABLE\\s+"?Account"?',
    "ALTER_INVOICE": r'ALTER\\s+TABLE\\s+"?(Invoice|PaymentReceipt)"?',
    "CASCADE_DELETE": r'ON\\s+DELETE\\s+CASCADE',
    "RENAME": r'\\bRENAME\\b',
}.items():
    if re.search(pattern, sql, flags=re.IGNORECASE | re.MULTILINE):
        raise SystemExit(f"[ERROR] forbidden SQL marker detected: {name}")

print("[OK] migration.sql safety scan passed")
PY

echo
echo "========== Required confirmations =========="
for var in \
  CONFIRM_AMAZON_SP_API_MIGRATION_DEPLOY \
  AMAZON_SP_API_MIGRATION_BACKUP_CONFIRMED \
  AMAZON_SP_API_MIGRATION_DATABASE_TARGET_CONFIRMED \
  AMAZON_SP_API_MIGRATION_MAINTENANCE_WINDOW_CONFIRMED \
  AMAZON_SP_API_MIGRATION_FEATURE_FLAGS_DISABLED
do
  echo "[$var] ${!var:-}"
done

echo
echo "========== Precheck commands =========="
cd "$API"
npx prisma validate
npx prisma generate
npm run build
npm run smoke:amazon-sp-api-create-only-prisma-migration-contract
npm run smoke:amazon-sp-api-migration-deploy-readiness-production-gate-contract

echo
echo "========== Migration status preview =========="
npx prisma migrate status || true

echo
echo "========== Deploy command =========="
echo "npx prisma migrate deploy"

if [ "$DRY_RUN" != "0" ]; then
  echo "[DRY_RUN] Not executing deploy. Set DRY_RUN=0 and all confirmation variables to YES to deploy."
  exit 0
fi

for var in \
  CONFIRM_AMAZON_SP_API_MIGRATION_DEPLOY \
  AMAZON_SP_API_MIGRATION_BACKUP_CONFIRMED \
  AMAZON_SP_API_MIGRATION_DATABASE_TARGET_CONFIRMED \
  AMAZON_SP_API_MIGRATION_MAINTENANCE_WINDOW_CONFIRMED \
  AMAZON_SP_API_MIGRATION_FEATURE_FLAGS_DISABLED
do
  if [ "${!var:-}" != "YES" ]; then
    echo "[ERROR] $var must be YES when DRY_RUN=0"
    exit 1
  fi
done

echo "[CONFIRMED] Executing npx prisma migrate deploy"
npx prisma migrate deploy

echo
echo "========== Post-deploy validation =========="
npx prisma migrate status
npx prisma validate
npx prisma generate
npm run build
npm run smoke:amazon-sp-api-create-only-prisma-migration-contract
npm run smoke:amazon-sp-api-migration-deploy-readiness-production-gate-contract

echo "[OK] Amazon SP-API migration deploy runbook completed"
