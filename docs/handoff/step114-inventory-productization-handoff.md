# Step114 Inventory Productization Handoff

## Current baseline

Latest stable milestone:

- Step113-B completed: ProductSkuAlias fallback inventory deduction.
- Step113-C completed: Inventory Audit drawer can create ProductSkuAlias and resolve unresolved SKU audit issues.
- Step113-C-3 completed: drawer UX hardening for open/closed audit states.
- Step113-D-2 completed: reusable API rollback smoke exists.

Reusable regression command:

```bash
cd /opt/ledgerseiri/apps/api
npm run build
npm run smoke:inventory-audit-alias

The smoke validates:

unresolved Inventory Audit fixture
ProductSkuAlias creation
audit issue resolution
INVENTORY_AUDIT_RESOLUTION movement
same alias SKU reprocess
PRODUCT_SKU_ALIAS fallback
InventoryMovement / InventoryBalance / inventoryDeduction metadata
rollback with no persistent DB pollution
Existing business loop
Amazon order import
  -> unmatched seller SKU
  -> Inventory Audit Queue OPEN issue
  -> user selects existing ProductSku in drawer
  -> optional ProductSkuAlias creation
  -> inventory OUT movement from audit resolution
  -> audit issue CLOSED
  -> future same seller SKU import
  -> ProductSkuAlias fallback
  -> automatic inventory deduction
Important files
apps/api/src/imports/imports.service.ts
apps/api/src/inventory/inventory.service.ts
apps/api/src/inventory/inventory.controller.ts
apps/api/scripts/smoke-inventory-audit-alias-reprocess.js
apps/api/package.json
apps/web/src/components/app/inventory/InventoryAuditQueueWorkspace.tsx
apps/web/src/app/api/inventory/[...path]/route.ts
Current verified endpoints
GET  /api/inventory/audit-issues
POST /api/inventory/audit-issues/:id/resolve
GET  /api/inventory/sku-aliases
POST /api/inventory/sku-aliases
GET  /api/inventory/stocks
GET  /api/inventory/movements
POST /api/inventory/manual-adjustments
Step114 recommended scope

Step114 should move from audit/alias closure to inventory module productization.

Step114-A: Inventory status page productionization

Target route:

/[lang]/app/inventory/status

Expected features:

SKU list with current quantity, reserved quantity, available quantity, alert level.
Search by skuCode, product name, ASIN, externalSku.
Filters by store and stock status.
Low/out/negative stock visual states.
Row click opens detail drawer.
Step114-B: Inventory movement drawer

Show movement history for selected SKU:

IN / OUT / ADJUST
quantity
occurredAt
sourceType
sourceId
importJobId
sourceRowNo
businessMonth
memo
reverse links to Import Center or Inventory Audit when possible
Step114-C: Manual stock adjustment

Create manual adjustment UI using the existing backend movement/adjustment contract.

Required guardrails:

Must always create InventoryMovement.
Must update InventoryBalance through movement logic.
Must require reason/memo for manual adjustments.
Do not directly mutate InventoryBalance without movement trace.
Step114-D: Inventory alert page

Target route:

/[lang]/app/inventory/alerts

Rules:

quantity < 0      -> negative stock
quantity <= 0     -> out of stock
available <= alertLevel -> low stock
Step114-E: Dashboard / Import Center links

Add drill-down links from:

Dashboard inventory warning cards
Import Center inventory deduction summary
Store Orders import history
Inventory Audit resolved rows
Development guardrails
Use current shared app shell: Sidebar + Topbar + Content Slot.
Dashboard remains overview/drill-down only.
Keep companyId row isolation.
Prefer one local build + one docker runtime per stage.
For inventory/alias/audit changes, always run:
cd /opt/ledgerseiri/apps/api
npm run build
npm run smoke:inventory-audit-alias
Next command recommendation

Start with a read-only code map before patching Step114:

find apps/web/src/components/app/inventory -maxdepth 2 -type f -print
find apps/web/src/app -path "*inventory*" -type f -print
grep -RIn "inventory/status\\|inventory/alerts\\|manual-adjustments\\|movements\\|stocks" apps/web/src apps/api/src | head -200

