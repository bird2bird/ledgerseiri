# Step114 Inventory Module Closeout / Handoff

## Current stable point

Step114 Inventory module productization is complete.

Latest expected stable commit:

```text
b024b05 polish: align inventory drilldown links

The working tree must be clean before starting Step115.

Step114 completed scope
Step114-A: Inventory Status page productionization

Main file:

apps/web/src/app/[lang]/app/inventory/status/page.tsx

Completed:

Productionized /ja/app/inventory/status
KPI summary for total SKU, total quantity, available quantity, risk SKU, negative stock
Store/status/search filters
SKU inventory table
Drawer for selected SKU
Manual adjustment form
Recent inventory movements
Selected row highlight
Reverse navigation banner for ?sku= and ?importJobId=

Important anchors:

buildManualAdjustmentMovement
buildInventoryAlertsHref
Movement Trace
Inventory reverse navigation
Step114-B: Inventory movement trace / reverse navigation

Completed:

Movement trace cards in Inventory Status drawer
Structured trace fields:
sourceType
sourceId
importJobId
transactionId
businessMonth
sourceRowNo
memo
Reverse links:
Inventory Status → Import Center
Inventory Status → Inventory Audit
Inventory Status → Transaction placeholder
Inventory Audit resolved drawer → Inventory Status
Inventory Audit resolved drawer → Import Center
Import Center → Inventory Audit
Import Center → Inventory Status

Important anchors:

movementTraceKind
movementTraceLabel
movementTraceTone
movementTraceSummary
buildInventoryStatusSkuHref
buildImportCenterInventoryStatusHref
Step114-C: Manual stock adjustment production hardening

Main backend file:

apps/api/src/inventory/inventory.service.ts

Main frontend file:

apps/web/src/app/[lang]/app/inventory/status/page.tsx

Smoke script:

apps/api/scripts/smoke-inventory-manual-adjustment.js

NPM command:

cd apps/api
npm run smoke:inventory-manual-adjustment

Completed backend contract:

memo is required
IN and OUT require positive quantity
OUT stores negative movement quantity
ADJUST accepts positive or negative delta
ADJUST rejects zero
default sourceType = MANUAL_STOCK_ADJUSTMENT
default sourceId = manual-stock-adjustment:<skuCode>:<isoDate>
default businessMonth is derived from occurredAt
response returns full item.movement

Important backend anchors:

memo is required for manual stock adjustment.
quantity must be positive for IN or OUT movements.
MANUAL_STOCK_ADJUSTMENT
manual-stock-adjustment:
formatBusinessMonthFromDate

Completed frontend behavior:

After manual adjustment success, selected balance updates immediately
New movement is inserted into the drawer movement list immediately
Then stocks and movements are refreshed

Important frontend anchors:

ManualAdjustmentResponse
buildManualAdjustmentMovement
applyManualAdjustmentResult
Step114-D: Inventory Alerts page productionization

Main file:

apps/web/src/app/[lang]/app/inventory/alerts/page.tsx

Completed:

Productionized /ja/app/inventory/alerts
Inventory risk workspace
KPI cards:
total risk SKU
critical
negative
out
low
Severity filters:
all
critical
warning
SKU/product search through q
Risk priority sorting:
negative
out
low
Alert detail drawer
Recent movement trace inside alert drawer
Links to:
Inventory Status
Inventory Audit
Import Center

Important anchors:

Inventory Alerts
在庫リスク管理
Recommended Action
最近の在庫移動
movementTraceLabel
inventoryStatusHref
inventoryAuditHref
importCenterHref
Step114-E: Drill-down final alignment

Files:

apps/web/src/app/[lang]/app/inventory/status/page.tsx
apps/web/src/app/[lang]/app/inventory/alerts/page.tsx
apps/web/src/components/app/jobs/ImportJobsTableCard.tsx
apps/web/src/components/app/dashboard-v2/dashboard-linking.ts
apps/web/src/components/app/dashboard-v2/mock.ts

Completed:

Inventory Status → Inventory Alerts
Inventory Status risk priority → all/critical/warning alerts
Inventory Alerts accepts and displays:
source
importJobId
q
from
severity
Import Center inventory summary → Inventory Alerts
Dashboard stockAlert → /inventory/alerts?from=dashboard&source=dashboard
Dashboard mock stock alert href aligned with severity=warning

Important anchors:

buildInventoryAlertsHref
Inventory drill-down context
buildImportCenterInventoryAlertsHref
inventory/alerts?from=dashboard&source=dashboard
Current key routes
/ja/app/inventory/status
/ja/app/inventory/status?sku=STEP110-I-SMOKE-SKU
/ja/app/inventory/status?importJobId=<importJobId>

/ja/app/inventory/alerts
/ja/app/inventory/alerts?source=inventory-status
/ja/app/inventory/alerts?source=inventory-status&severity=critical
/ja/app/inventory/alerts?source=inventory-status&severity=warning
/ja/app/inventory/alerts?from=dashboard&source=dashboard
/ja/app/inventory/alerts?source=import-center&importJobId=<importJobId>

/ja/app/inventory/audit
/ja/app/inventory/audit?importJobId=<importJobId>
/ja/app/inventory/audit?sku=<skuCode>

/ja/app/data/import
/ja/app/data/import?importJobId=<importJobId>
Current key BFF endpoints
GET  /api/inventory/stocks
GET  /api/inventory/meta
GET  /api/inventory/movements
GET  /api/inventory/audit-issues
GET  /api/inventory/sku-aliases
POST /api/inventory/manual-adjustments
GET  /api/import-jobs
Current smoke commands

Run from repo root unless stated otherwise.

cd /opt/ledgerseiri/apps/web
npm run build
cd /opt/ledgerseiri/apps/api
npm run build
npm run smoke:inventory-manual-adjustment
npm run smoke:inventory-audit-alias

Docker runtime:

cd /opt/ledgerseiri
docker compose build web
docker compose up -d web
docker compose logs web --tail=280
Final regression checklist
Web build
cd /opt/ledgerseiri/apps/web
npm run build

Expected:

✓ Compiled successfully
/[lang]/app/inventory/status
/[lang]/app/inventory/alerts
/[lang]/app/inventory/audit
/[lang]/app/data/import
API build and smoke
cd /opt/ledgerseiri/apps/api
npm run build
npm run smoke:inventory-manual-adjustment
npm run smoke:inventory-audit-alias

Expected:

[SMOKE_OK] inventory manual adjustment rollback smoke passed
[SMOKE_OK] inventory audit alias reprocess rollback smoke passed
Route checks
curl -I http://localhost:3000/ja/app/inventory/status
curl -I "http://localhost:3000/ja/app/inventory/status?sku=STEP110-I-SMOKE-SKU"
curl -I "http://localhost:3000/ja/app/inventory/alerts?source=inventory-status"
curl -I "http://localhost:3000/ja/app/inventory/alerts?source=inventory-status&severity=critical"
curl -I "http://localhost:3000/ja/app/inventory/alerts?source=inventory-status&severity=warning"
curl -I "http://localhost:3000/ja/app/inventory/alerts?from=dashboard&source=dashboard"
curl -I "http://localhost:3000/ja/app/inventory/alerts?source=import-center&importJobId=smoke-import-job"
curl -I "http://localhost:3000/ja/app/data/import?importJobId=smoke-import-job"

Expected: 200, 302, 307, or 308.

BFF checks
curl -i "http://localhost:3000/api/inventory/stocks?limit=3"
curl -i "http://localhost:3000/api/inventory/meta"
curl -i "http://localhost:3000/api/inventory/movements?limit=3"
curl -i "http://localhost:3000/api/inventory/audit-issues?status=ALL&limit=1&offset=0"
curl -i "http://localhost:3000/api/inventory/sku-aliases?limit=1"
curl -i "http://localhost:3000/api/import-jobs"

Expected: mounted response, usually 200.

Guardrails for Step115

Step115 should not rewrite the inventory module.

Step115 should build on the stable contracts established in Step114:

ProductSkuAlias
InventoryAudit
InventoryMovement
InventoryBalance
InventoryDeduction
ImportJob
ImportStagingRow
sourceType
sourceId
importJobId
businessMonth
matchStrategy
Recommended Step115 scope
Step115:
Import Center + Amazon order CSV normalized contract finalization

Recommended Step115-A:

Amazon order normalized payload contract code map

Goals:

Inspect current Amazon CSV parser / commit pipeline.
Identify duplicated parsing paths.
Fix normalized payload type for CSV and future SP-API ingestion.
Ensure CSV import and future API import share one commit pipeline.
Keep inventory deduction source trace stable:
sourceType
sourceId
importJobId
sourceRowNo
businessMonth
transactionId
inventoryDeduction.matchStrategy
Avoid starting Amazon SP-API yet.
Do not start Amazon SP-API yet

Amazon SP-API should start after Step115 normalized contract is stable.

Recommended future sequence:

Step115: Import Center + Amazon order normalized contract
Step116: Amazon SP-API OAuth / connection / token management
Step117: Amazon Orders API ingestion MVP

