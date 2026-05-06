# Step110-M: Inventory Alerts Final Closeout

## Scope

This step closes out the inventory alert browser/runtime smoke phase.

## Current stable commit before this closeout

```text
6b6385e feat: wire inventory alerts page to real api
```

## Runtime verification

Verified endpoints/pages:

- GET /api/inventory/stocks?q=STEP110-I-SMOKE-SKU
- GET /ja/app/inventory/alerts
- GET /ja/app/inventory/alerts?severity=warning
- GET /ja/app/inventory/alerts?severity=critical
- GET /ja/app/inventory/status

## Final expected seed state

The smoke SKU should remain in low-stock state:

```text
SKU: STEP110-I-SMOKE-SKU
quantity: 11
reservedQty: 7
availableQty: 4
alertLevel: 5
stockStatus: low
stockStatusLabel: 要補充
severity: warning
```

## Browser click checklist

Manual browser smoke:

1. Open /ja/app/inventory/alerts.
2. Confirm inventory alert page loads.
3. Confirm STEP110-I-SMOKE-SKU is visible under warning state.
4. Open /ja/app/inventory/alerts?severity=warning.
5. Confirm STEP110-I-SMOKE-SKU remains visible.
6. Open /ja/app/inventory/alerts?severity=critical.
7. Confirm STEP110-I-SMOKE-SKU is not shown in final low-stock state.
8. Click 「在庫状況へ」.
9. Confirm navigation to /ja/app/inventory/status.

## Closed loop status

Completed inventory foundation loop:

- ProductSku mapping fields
- InventoryBalance snapshot
- InventoryMovement traceability
- Inventory status page real API wiring
- Manual inventory adjustment E2E
- Inventory alerts real API wiring
- Low/out/negative runtime verification

## Next recommended step

Step110-N should start Amazon order inventory deduction design/implementation:

- Map Amazon order report SKU to ProductSku.skuCode / externalSku
- Convert sold quantity to InventoryMovement OUT
- Update InventoryBalance
- Preserve importJobId / sourceRowNo / transactionId trace fields
- Add unresolved SKU audit queue
