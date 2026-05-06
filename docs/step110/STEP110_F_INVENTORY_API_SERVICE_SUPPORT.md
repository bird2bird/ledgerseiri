# Step110-F: Inventory API / Service Support

## Scope

This step wires API/service support around the existing inventory models:

- ProductSku
- InventoryBalance
- InventoryMovement

## Added / stabilized endpoints

Backward-compatible endpoints:

- GET /api/inventory/balances
- GET /api/inventory/balances/meta
- GET /api/inventory/balances/movements
- POST /api/inventory/balances/movements

Standard inventory endpoints:

- GET /api/inventory/stocks
- GET /api/inventory/meta
- GET /api/inventory/movements
- POST /api/inventory/manual-adjustments

## Manual adjustment rule

Manual adjustment writes InventoryMovement first, then updates InventoryBalance.

## Guardrails

- No Amazon automatic deduction yet.
- No InventoryStock model.
- No bank statement or reconciliation changes.
- Existing inventory snapshot remains InventoryBalance.
- Existing inventory audit trail remains InventoryMovement.
