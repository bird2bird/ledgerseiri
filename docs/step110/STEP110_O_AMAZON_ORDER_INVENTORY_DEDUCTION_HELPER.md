# Step110-O: Amazon Store-order Commit Inventory Deduction Helper

## Scope

This step adds a private inventory deduction helper to ImportsService.

It does not wire the helper into the store-orders commit flow yet.

## Added helper

```text
applyStoreOrderInventoryDeduction()
Behavior

The helper:

Reads normalized store-order payload.
Extracts SKU and quantity.
Resolves ProductSku by companyId + skuCode or companyId + externalSku.
Skips unresolved SKU without throwing.
Checks duplicate InventoryMovement by trace fields.
Creates InventoryMovement OUT.
Upserts InventoryBalance with quantity decrement.
Returns a structured deduction result.
Trace fields

The helper writes:

sourceType = AMAZON_ORDER_IMPORT
sourceId = orderId
importJobId
sourceRowNo
transactionId
businessMonth
memo = [amazon-order-inventory-deduction] ...
Guardrails
Does not parse Amazon CSV again.
Does not auto-create ProductSku.
Does not block Transaction creation for unresolved SKU.
Does not touch frontend pages.
Does not change schema.
Does not apply DB migrations.
Next step

Step110-P should wire this helper into the real store-orders commit function after Transaction creation.
