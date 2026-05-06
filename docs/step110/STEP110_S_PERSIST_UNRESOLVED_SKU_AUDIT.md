# Step110-S: Persist Unresolved SKU Audit Issue

## Scope

This step persists unresolved Amazon order inventory deduction issues into the existing import staging row.

## Why no new table yet

The current Prisma schema does not include an `AuditIssue` or `ManualReviewQueue` model.

Existing model used for the minimal patch:

```text
ImportStagingRow

Relevant fields:

matchReason
normalizedPayloadJson
importJobId
companyId
module
rowNo
businessMonth
targetEntityType
targetEntityId
Behavior

When store-orders commit creates a Transaction but inventory deduction returns an unresolved result, the service writes an audit payload into the staging row.

Persisted fields
matchReason = INVENTORY_DEDUCTION_UNRESOLVED:<reason>
normalizedPayloadJson.inventoryAudit = {
  scope: inventory,
  status: OPEN,
  severity: warning,
  code,
  reason,
  sku,
  sourceType: AMAZON_ORDER_IMPORT,
  sourceId,
  quantity,
  createdAt,
  message
}
Guardrails
No schema change.
No migration.
No frontend change.
No ProductSku auto-creation.
Transaction commit remains successful.
InventoryMovement is not created for unresolved SKU.
Next step

Step110-T should run an E2E smoke using a missing SKU and verify:

commit response still returns PRODUCT_SKU_NOT_FOUND
Transaction is created
InventoryMovement is not created
ImportStagingRow.matchReason is updated
normalizedPayloadJson.inventoryAudit exists
