# Step110-D-RECOVER: Existing Inventory Alignment Plan

## 0. Purpose

This recovery step fixes the direction of Step110-D after the first schema patch attempt.

The failed Step110-D attempt tried to introduce a parallel `InventoryStock` model and extra fields directly on `Product` / `InventoryMovement`.

After checking the real GitHub `main` schema, this direction is corrected.

Current LedgerSeiri already has an inventory foundation:

- `Product`
- `ProductSku`
- `InventoryBalance`
- `InventoryMovement`

Therefore, the next implementation must reuse these models instead of creating a duplicate inventory stack.

---

## 1. Recovery actions completed

This recovery step performs these actions:

1. Backup current failed local schema patch.
2. Restore `apps/api/prisma/schema.prisma` to current HEAD.
3. Move any untracked partial migration files to backup, if present.
4. Validate restored Prisma schema.
5. Write this corrected alignment plan.

Generated recovery output:

```text
/root/ledgerseiri_step110d_recover_20260506_092755
2. Corrected inventory model interpretation
Product

Product is the product master.

Current role:

Product = product family / product master

Do not put Amazon SKU mapping directly on Product unless later product requirements prove it is necessary.

ProductSku

ProductSku is the correct SKU-level model.

Current role:

ProductSku = sellable SKU / Amazon seller SKU mapping candidate

Current important fields:

companyId
productId
storeId
skuCode
name
costAmount
salePrice

For Amazon order deduction, skuCode should be treated as the first mapping key for seller SKU.

If needed later, add fields to ProductSku, not Product:

asin String?
externalSku String?
fulfillmentChannel String?

But MVP should first try to use existing skuCode.

InventoryBalance

InventoryBalance is already the inventory snapshot model.

Current role:

InventoryBalance = stock snapshot

Current important fields:

companyId
skuId
quantity
reservedQty
alertLevel

Interpretation:

quantity ≈ on hand quantity
reservedQty ≈ reserved quantity
available quantity can be derived as quantity - reservedQty
alertLevel supports low-stock alert logic

Do not add InventoryStock unless later requirements prove InventoryBalance cannot support the required workflow.

InventoryMovement

InventoryMovement is already the inventory audit trail.

Current role:

InventoryMovement = stock movement ledger

Current important fields:

companyId
skuId
type
quantity
occurredAt
memo

Interpretation:

type = IN / OUT / ADJUST
Amazon sale deduction should eventually map to type = OUT
Manual adjustment should map to type = ADJUST
Purchase/restock should map to type = IN
3. Corrected Step110-D implementation target

The next schema implementation should be renamed:

Step110-E:
Existing inventory schema traceability patch and migration

Scope should be smaller and safer:

ProductSku

Possible minimal additions:

asin String?
externalSku String?
fulfillmentChannel String?

Recommended indexes:

@@index([companyId, storeId])
@@index([companyId, asin])
@@index([companyId, externalSku])

But only add externalSku if skuCode is not enough. The default MVP should use skuCode first.

InventoryMovement

Possible minimal traceability additions:

sourceType String?
sourceId String?
importJobId String?
sourceRowNo Int?
transactionId String?
businessMonth String?

Recommended indexes:

@@index([companyId, importJobId])
@@index([companyId, transactionId])
@@index([companyId, businessMonth])

These fields allow inventory deduction to be traced back to Amazon order import rows and generated transactions.

InventoryBalance

No immediate schema change required.

Derived values:

availableQty = quantity - reservedQty

Stock status can be derived:

NEGATIVE_STOCK: quantity < 0
ZERO_STOCK: quantity == 0
LOW_STOCK: quantity <= alertLevel
OK: otherwise
4. Migration problem found

The failed Step110-D attempt hit:

Prisma P3006
Migration `20260311_step32c_invoice_payment_alignment` failed to apply cleanly to the shadow database.
P1014: The underlying table for model `Invoice` does not exist.

This means the next migration step must handle Prisma migration/shadow DB carefully.

Recommended next migration strategy:

First inspect existing migration history.
Check whether production/dev DB schema is ahead of migration history.
Prefer prisma migrate diff / SQL migration review if migration history is inconsistent.
Avoid destructive reset.
Use create-only migration only after the shadow DB issue is understood.
5. Guardrails for next implementation

Do not:

create InventoryStock
duplicate Product
duplicate InventoryMovement
put seller SKU fields on Product without strong reason
run destructive Prisma reset
apply migration directly before reviewing SQL
deduct inventory from Amazon order report in the schema step

Always:

reuse ProductSku for SKU mapping
reuse InventoryBalance for snapshot
reuse InventoryMovement for audit trail
preserve companyId
preserve storeId
add traceability fields to movement before Amazon deduction
keep inventory movement append-only
6. Next step

Proceed to:

Step110-E:
Existing inventory schema traceability patch with migration-history inspection

Step110-E should combine:

migration history inspection
schema patch only for existing inventory models
Prisma format / validate
migration strategy decision
API build
commit

Rollback point before Step110-E:

HEAD after this Step110-D-RECOVER commit

