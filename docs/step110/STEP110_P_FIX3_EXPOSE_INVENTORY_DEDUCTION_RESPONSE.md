# Step110-P-FIX3: Expose Inventory Deduction in Commit Response

## Problem

Step110-P wired inventory deduction into the store-orders commit transaction callback, but the outer `commitImport()` API response did not expose `result.inventoryDeduction`.

This caused Step110-Q E2E smoke to fail even though the import commit itself returned `ok: true`.

## Fix

The outer response now includes:

```text
inventoryDeduction: result.inventoryDeduction

Also fixed callback return formatting around:

inventoryDeduction,
Guardrails
No schema change.
No frontend change.
No import parser change.
No inventory helper behavior change.
Only response exposure and formatting are changed.
Next step

Re-run Step110-Q-FIX1 E2E smoke.
