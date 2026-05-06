# Step110-N: Amazon Order Inventory Deduction Entry

## 0. Purpose

This step opens the implementation phase for automatic inventory deduction from Amazon order imports.

The current inventory loop is already working:

- ProductSku is the SKU mapping model.
- InventoryBalance is the inventory snapshot model.
- InventoryMovement is the append-only stock movement model.
- Manual inventory adjustment writes InventoryMovement first and then updates InventoryBalance.
- Inventory status page and inventory alerts page are wired to real APIs.

The next closed-loop target is:

```text
Amazon order report import
-> recognize sold SKU and quantity
-> resolve ProductSku
-> create InventoryMovement OUT
-> update InventoryBalance
-> preserve trace to importJob / row / transaction
-> unresolved SKU goes to audit/manual review
1. Real code facts
Existing Amazon parser

The current imports service already has Amazon order parsing primitives.

Important existing structures/functions:

AmazonPreviewFact
parseAmazonStoreOrdersCsv()
buildStoreOrderPreviewRows()
buildStoreOrderDedupeHash()

AmazonPreviewFact already carries:

rowNo
orderId
orderDate
sku
productName
quantity
amount / grossAmount / netAmount
fulfillment
store

buildStoreOrderPreviewRows() already places key order data into normalizedPayload, including:

module: store-orders
orderId
orderDate
sku
productName
quantity
grossAmount
netAmount
dedupeHash

This means inventory deduction should not start from raw CSV again. It should use already-normalized store-order facts or staging rows.

Existing inventory target

The inventory API/service already supports manual adjustment using these models:

ProductSku
InventoryBalance
InventoryMovement

The deduction logic should reuse the same invariant:

Create InventoryMovement first.
Then update InventoryBalance in the same transaction.
2. Deduction semantics
Movement type

Amazon order sale should create:

InventoryMovement.type = OUT
InventoryMovement.quantity = -abs(order quantity)
InventoryMovement.sourceType = AMAZON_ORDER_IMPORT
Trace fields

Each movement should preserve:

sourceType = AMAZON_ORDER_IMPORT
sourceId = orderId
importJobId = ImportJob.id
sourceRowNo = ImportStagingRow.rowNo or AmazonPreviewFact.rowNo
transactionId = generated Transaction.id when available
businessMonth = normalized business month from orderDate
memo = Amazon order inventory deduction marker

Recommended memo:

[amazon-order-inventory-deduction] orderId=<orderId> sku=<sku> qty=<quantity>
SKU resolution

Resolve ProductSku in this order:

1. ProductSku.companyId + skuCode = Amazon sku
2. ProductSku.companyId + externalSku = Amazon sku
3. If not found, do not deduct inventory.

Do not create ProductSku automatically in the deduction step.

Reason:

Missing SKU mapping should be a manual audit issue, not silent master-data creation.
3. Idempotency

Amazon imports can be re-run, replaced, or retried.

Inventory deduction must be idempotent.

Recommended idempotency key:

companyId
sourceType = AMAZON_ORDER_IMPORT
importJobId
sourceRowNo
sourceId/orderId
sku
quantity

Before creating a new InventoryMovement, check whether an existing movement already exists with:

companyId
sourceType = AMAZON_ORDER_IMPORT
importJobId
sourceRowNo
skuId

If found:

skip duplicate deduction

For replace-existing-months policy, later implementation may need a reversal strategy, but Step110-O should start with safe skip-idempotency.

4. Transaction boundary

Inventory deduction should occur in the same commit workflow that creates store-order Transactions.

Preferred approach:

Inside store-orders commit:
1. create Transaction
2. resolve ProductSku
3. create InventoryMovement OUT with transactionId
4. update InventoryBalance
5. if SKU unresolved, record unresolved result but keep Transaction commit safe

Important guardrail:

A missing ProductSku must not block revenue Transaction creation.

Instead:

Transaction succeeds.
Inventory deduction is skipped.
Unresolved SKU is reported for audit/manual review.
5. Audit / unresolved cases

For Step110-O initial implementation, unresolved SKU can be reported in the commit response and/or written into ImportStagingRow normalizedPayload/matchReason if the existing structure allows it safely.

Minimum unresolved item shape:

{
  rowNo,
  orderId,
  sku,
  quantity,
  reason: "PRODUCT_SKU_NOT_FOUND"
}

Later this should be promoted into a formal AuditIssue queue.

6. Step110-O implementation target

Step110-O should implement a small private helper in ImportsService.

Suggested helper name:

private async applyStoreOrderInventoryDeduction(...)

Suggested inputs:

tx
companyId
transactionId
importJobId
rowNo
businessMonth
payload / fact

Suggested behavior:

1. Extract sku and quantity from normalized payload.
2. Skip if quantity <= 0.
3. Resolve ProductSku by skuCode or externalSku.
4. Skip and return unresolved result if no SKU.
5. Check duplicate InventoryMovement by companyId/sourceType/importJobId/sourceRowNo/skuId.
6. Create InventoryMovement OUT.
7. Upsert InventoryBalance with quantity = current quantity - sold quantity.
8. Return deduction result.

Expected result shape:

{
  deducted: boolean,
  skipped: boolean,
  reason?: string,
  skuId?: string,
  skuCode?: string,
  quantityDelta?: number,
  movementId?: string
}
7. Step110-O guardrails

Do not:

parse Amazon CSV again for inventory
auto-create ProductSku
block Transaction commit on missing SKU
deduct inventory for non-order fee rows
deduct inventory when quantity <= 0
deduct inventory twice for the same import row
touch bank statement or invoice logic
change frontend pages in Step110-O

Do:

reuse normalizedPayload
reuse ProductSku
reuse InventoryBalance
reuse InventoryMovement
preserve transactionId / importJobId / sourceRowNo
return unresolved SKU info for manual audit
8. Suggested test data

Use existing smoke SKU:

STEP110-I-SMOKE-SKU

Recommended test:

Initial quantity: 11
Amazon order quantity: 2
Expected after commit: 9
InventoryMovement: OUT / -2 / AMAZON_ORDER_IMPORT
9. Next step

Proceed to:

Step110-O:
Amazon store-order commit inventory deduction helper

Step110-O should inspect the real store-orders commit function first, then patch only the smallest safe point.
