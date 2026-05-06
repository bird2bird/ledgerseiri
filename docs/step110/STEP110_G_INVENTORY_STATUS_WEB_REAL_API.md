# Step110-G: Inventory Status Web Wiring to Real API

## Scope

This step wires the inventory status page to the standardized real inventory API.

## Page

- apps/web/src/app/[lang]/app/inventory/status/page.tsx

## API endpoints used

- GET /api/inventory/stocks
- GET /api/inventory/meta
- GET /api/inventory/movements
- POST /api/inventory/manual-adjustments

## Behavior

- Inventory stock list loads from ProductSku / InventoryBalance.
- Inventory movements load from InventoryMovement.
- Manual adjustment creates InventoryMovement and updates InventoryBalance through API.
- No Amazon automatic deduction yet.
- No new DB model.
