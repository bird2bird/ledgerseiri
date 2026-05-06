# Step110-C: Inventory Foundation Schema Alignment Plan

## 0. Scope

This step aligns Step110-B's inventory proposal with the real existing schema and codebase.

This step is documentation-only.

No Prisma schema change is made.
No migration is generated.
No API code is changed.
No UI code is changed.
No build or docker deployment is required.

---

## 1. Inspection source

Prisma schema:

```text
/opt/ledgerseiri/apps/api/prisma/schema.prisma

Inspection output:

/root/ledgerseiri_step110c_20260506_091842

Extracted schema windows:

[OK] Product: /root/ledgerseiri_step110c_20260506_091842/schema_model_Product.txt
[OK] InventoryMovement: /root/ledgerseiri_step110c_20260506_091842/schema_model_InventoryMovement.txt
[MISS] InventoryStock
[OK] Transaction: /root/ledgerseiri_step110c_20260506_091842/schema_model_Transaction.txt
[OK] ImportJob: /root/ledgerseiri_step110c_20260506_091842/schema_model_ImportJob.txt
[OK] ImportStagingRow: /root/ledgerseiri_step110c_20260506_091842/schema_model_ImportStagingRow.txt
[OK] Store: /root/ledgerseiri_step110c_20260506_091842/schema_model_Store.txt
[OK] Account: /root/ledgerseiri_step110c_20260506_091842/schema_model_Account.txt
2. Key discovery

Step110-B discovered that the current codebase is not empty.

Current model existence:

Model	Exists now
Product	YES
InventoryMovement	YES
InventoryStock	NO
Transaction	YES
ImportJob	YES
ImportStagingRow	YES
Store	YES
Account	YES

Therefore Step110-C implementation must not blindly add duplicate Product or InventoryMovement models.

3. Product model alignment

Existing Product field check:

Field	Exists now
companyId	YES
storeId	NO
sku	NO
sellerSku	NO
asin	NO
title	NO
name	YES
status	NO

Alignment rule:

Reuse existing Product model.
Do not rename existing fields unless absolutely necessary.
If current model uses name instead of title, map UI/API display name to the existing field first.
Add missing Amazon mapping fields only after confirming they are not represented by existing aliases.
Avoid strict unique constraints until import behavior is verified.

Recommended Product alignment:

Required for Step110:
- companyId
- sku or sellerSku
- asin optional
- display name/title/name
- status

If sellerSku is missing:
- add sellerSku String?
- add @@index([companyId, sellerSku])

If asin is missing:
- add asin String?
- add @@index([companyId, asin])
4. InventoryMovement model alignment

Existing InventoryMovement field check:

Field	Exists now
companyId	YES
storeId	NO
productId	NO
sku	YES
sellerSku	NO
asin	NO
movementType	NO
quantityDelta	NO
quantityBefore	NO
quantityAfter	NO
sourceType	NO
sourceId	NO
importJobId	NO
transactionId	NO
occurredAt	YES
businessMonth	NO

Alignment rule:

Reuse existing InventoryMovement model.
Keep movement append-only.
Do not replace movement with stock snapshot.
Add only missing traceability fields needed for Amazon import and manual adjustment.

Recommended minimum fields:

- companyId
- storeId?
- productId?
- sku or sellerSku
- movementType
- quantityDelta
- sourceType
- sourceId?
- importJobId?
- transactionId?
- occurredAt
- businessMonth?

If quantityBefore / quantityAfter are missing:

Add them as nullable Int? for audit clarity.
Do not block MVP if existing movement history cannot backfill them immediately.
5. InventoryStock model alignment

Current InventoryStock existence:

InventoryStock exists now: NO

Since InventoryStock appears to be missing, Step110 implementation should add it as the snapshot model.

Recommended InventoryStock model:

model InventoryStock {
  id        String   @id @default(cuid())
  companyId String
  storeId   String?
  productId String?

  sku        String
  sellerSku  String?
  asin       String?

  fulfillmentChannel String @default("FBA")
  locationCode       String?

  onHandQty    Int @default(0)
  reservedQty  Int @default(0)
  availableQty Int @default(0)
  inboundQty   Int @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  product Product? @relation(fields: [productId], references: [id])

  @@index([companyId])
  @@index([companyId, storeId])
  @@index([companyId, sku])
  @@index([companyId, sellerSku])
  @@index([companyId, productId])
}

Important:

InventoryStock is a snapshot.
InventoryMovement is the audit trail.
Manual adjustment must write InventoryMovement first, then update InventoryStock.
6. API alignment

Inventory API files found:

inventory.module.ts exists: YES
inventory.controller.ts exists: YES
inventory.service.ts exists: YES

Step110 implementation should choose one of these paths:

Path A: dedicated inventory module already exists

Use existing module and add only missing methods:

GET /api/inventory/stocks
GET /api/inventory/movements
POST /api/inventory/manual-adjustments
Path B: no dedicated inventory module exists

Add:

apps/api/src/inventory/inventory.module.ts
apps/api/src/inventory/inventory.controller.ts
apps/api/src/inventory/inventory.service.ts

Do not place inventory write logic inside generic transaction service.

7. Web alignment

Existing inventory routes should be reused:

/[lang]/app/inventory/status
/[lang]/app/inventory/alerts

Step110 implementation should connect these routes to real inventory API gradually.

Initial UI:

Inventory status table:
- SKU
- Product
- fulfillment channel
- onHandQty
- reservedQty
- availableQty
- inboundQty
- stock status

Movement drawer/table:
- movementType
- quantityDelta
- sourceType
- importJobId
- transactionId
- occurredAt
8. Migration strategy for next step

Next implementation step should be:

Step110-D:
Inventory foundation schema patch and migration

But before writing migration:

open the real Product model window
open the real InventoryMovement model window
patch only missing fields
add InventoryStock only if still missing
run prisma format
run migration
run API build/typecheck

Do not add duplicate relation names.

9. Guardrails

Do not:

duplicate Product model
duplicate InventoryMovement model
rename existing production fields without migration plan
deduct inventory from Amazon report yet
modify Transaction write behavior yet
introduce BankStatementLine / ReconciliationLink / AuditIssue yet
make sellerSku globally unique

Always:

include companyId
preserve storeId when available
preserve importJobId on inventory movements
keep InventoryMovement append-only
update InventoryStock only after movement creation
