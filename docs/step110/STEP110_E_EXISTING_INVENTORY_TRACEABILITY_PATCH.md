# Step110-E: Existing Inventory Traceability Patch

## Scope

This step patches the existing inventory schema without introducing a parallel inventory stack.

## Core decision

Use existing models:

- Product
- ProductSku
- InventoryBalance
- InventoryMovement

Do not create InventoryStock.

## Schema changes

### ProductSku

Added trace/mapping fields:

- asin
- externalSku
- fulfillmentChannel

### InventoryMovement

Added traceability fields:

- sourceType
- sourceId
- importJobId
- sourceRowNo
- transactionId
- businessMonth

## Migration strategy

Previous prisma migrate create-only failed because an older migration did not apply cleanly to the shadow database.

For this step, a manual migration SQL file is created instead of running migrate dev.

Migration:

/opt/ledgerseiri/apps/api/prisma/migrations/20260506093747_step110_existing_inventory_traceability

The migration is not applied by this script.

## Guardrails

- No InventoryStock model.
- No Amazon deduction logic yet.
- No bank statement or reconciliation model.
- No destructive migration command.
- InventoryBalance remains snapshot.
- InventoryMovement remains audit trail.

## Next step

Step110-F should add inventory API/service support around the existing ProductSku / InventoryBalance / InventoryMovement models.
