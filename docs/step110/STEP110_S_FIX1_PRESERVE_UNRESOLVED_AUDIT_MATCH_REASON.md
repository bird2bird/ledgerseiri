# Step110-S-FIX1: Preserve Unresolved Inventory Audit matchReason

## Problem

Step110-S persisted unresolved inventory audit data into `ImportStagingRow`, but the later transaction success update overwrote `matchReason` with:

```text
committed to Transaction

The JSON audit payload was preserved, but the row-level review reason was lost.

Fix

The commit flow now keeps the unresolved inventory audit reason after transaction success update:

INVENTORY_DEDUCTION_UNRESOLVED:<reason>

For normal rows, it still uses:

committed to Transaction
Guardrails
No schema change.
No frontend change.
No ProductSku auto-creation.
No InventoryMovement creation for unresolved SKU.
Transaction commit still succeeds.
Next step

Re-run Step110-T unresolved SKU audit persistence E2E smoke.
