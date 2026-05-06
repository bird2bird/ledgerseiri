# Step110-P: Wire Amazon Inventory Deduction into Store-orders Commit

## Scope

This step wires `applyStoreOrderInventoryDeduction()` into the real `commitImport()` store-orders flow.

## Real anchors used

The real commit code uses:

```text
const created = await tx.transaction.create(...)

The inventory deduction call is inserted after Transaction creation and before the staging row success update.

Behavior

During commit:

Transaction is created from a store-orders staging row.
If module === 'store-orders', inventory deduction helper runs.
The helper receives:
tx
companyId
transactionId = created.id
importJobId
rowNo
businessMonth
normalized payload
ProductSku is resolved by skuCode or externalSku.
InventoryMovement OUT is created.
InventoryBalance is decremented.
Missing SKU does not block Transaction creation.
Response addition

commitImport() now includes:

inventoryDeduction: {
  deductedRows,
  skippedRows,
  unresolvedRows,
  results
}
Guardrails
Only runs for module === 'store-orders'.
No schema change.
No frontend change.
No ProductSku auto-creation.
No bank statement change.
No invoice/evidence change.
Next step

Step110-Q should run an end-to-end store-orders import commit smoke with STEP110-I-SMOKE-SKU and verify:

Transaction created
InventoryMovement OUT created
InventoryBalance decremented
duplicate commit does not double-deduct
