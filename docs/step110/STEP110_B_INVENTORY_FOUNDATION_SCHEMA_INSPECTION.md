# Step110-B: Inventory Foundation Schema Inspection and Minimal Model Proposal

## 0. Scope

This step inspects the current local LedgerSeiri codebase and proposes the minimal inventory foundation for Step110.

This step is documentation-only.

No Prisma schema change is made.
No migration is generated.
No API code is changed.
No UI code is changed.
No build or docker deployment is required.

---

## 1. Local inspection source

Schema file:

```text
/opt/ledgerseiri/apps/api/prisma/schema.prisma

Generated inspection output directory:

/root/ledgerseiri_step110b_20260506_091551
2. Existing model check
Model	Exists now
Product	YES
InventoryStock	NO
InventoryMovement	YES
Transaction	YES
ImportJob	YES
ImportStagingRow	YES
TransactionAttachment	YES
Account	YES
Store	YES
BankStatementLine	NO
ReconciliationLink	NO
AuditIssue	NO

Schema model windows:

[OK] model Product: /root/ledgerseiri_step110b_20260506_091551/schema_model_Product.txt
[MISS] model InventoryStock
[OK] model InventoryMovement: /root/ledgerseiri_step110b_20260506_091551/schema_model_InventoryMovement.txt
[OK] model Transaction: /root/ledgerseiri_step110b_20260506_091551/schema_model_Transaction.txt
[OK] model ImportJob: /root/ledgerseiri_step110b_20260506_091551/schema_model_ImportJob.txt
[OK] model ImportStagingRow: /root/ledgerseiri_step110b_20260506_091551/schema_model_ImportStagingRow.txt
[OK] model TransactionAttachment: /root/ledgerseiri_step110b_20260506_091551/schema_model_TransactionAttachment.txt
[OK] model Account: /root/ledgerseiri_step110b_20260506_091551/schema_model_Account.txt
[OK] model Store: /root/ledgerseiri_step110b_20260506_091551/schema_model_Store.txt
[MISS] model BankStatementLine
[MISS] model ReconciliationLink
[MISS] model AuditIssue
3. Current structure findings
3.1 Inventory / Product UI

Inventory route hints found:

inventory/status or inventory/alerts present: YES

Step110-B implementation should reuse the existing inventory navigation surface if present.

Recommended target routes:

/[lang]/app/inventory/status
/[lang]/app/inventory/alerts
3.2 API

Inventory / product API hint:

inventory/product/catalog API hint: YES

If no dedicated inventory API exists, add a small dedicated API module instead of extending unrelated transaction APIs.

Recommended API module:

apps/api/src/inventory/inventory.module.ts
apps/api/src/inventory/inventory.controller.ts
apps/api/src/inventory/inventory.service.ts
4. Minimal inventory foundation proposal

Step110-B implementation should introduce three core models only:

Product
InventoryStock
InventoryMovement

Do not introduce the following in Step110-B:

BankStatementLine
ReconciliationLink
AuditIssue
Amazon order deduction parser
bank CSV parser
invoice/evidence audit queue

Those belong to later Step110 phases.

5. Proposed Product model
model Product {
  id        String   @id @default(cuid())
  companyId String
  storeId   String?

  sku       String?
  sellerSku String?
  asin      String?
  title     String

  status    String   @default("ACTIVE")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  inventoryStocks    InventoryStock[]
  inventoryMovements InventoryMovement[]

  @@index([companyId])
  @@index([companyId, storeId])
  @@index([companyId, sku])
  @@index([companyId, sellerSku])
  @@index([companyId, asin])
}
Product rules
companyId is mandatory.
sellerSku should be the primary Amazon mapping key.
asin is useful but not enough as a unique key.
For MVP, prefer indexes first.
Add strict unique constraints only after import behavior is verified.
6. Proposed InventoryStock model
model InventoryStock {
  id        String   @id @default(cuid())
  companyId String
  storeId   String?
  productId String?

  sku        String
  sellerSku  String?
  asin       String?

  fulfillmentChannel String @default("FBA")
  locationCode       String?

  onHandQty    Int @default(0)
  reservedQty  Int @default(0)
  availableQty Int @default(0)
  inboundQty   Int @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  product Product? @relation(fields: [productId], references: [id])

  @@index([companyId])
  @@index([companyId, storeId])
  @@index([companyId, sku])
  @@index([companyId, sellerSku])
  @@index([companyId, productId])
}
InventoryStock rules
InventoryStock is a snapshot.
InventoryMovement is the audit trail.
availableQty should be recalculated after every movement.
Do not use InventoryStock as historical source of truth.
7. Proposed InventoryMovement model
model InventoryMovement {
  id        String   @id @default(cuid())
  companyId String
  storeId   String?
  productId String?

  sku       String
  sellerSku String?
  asin      String?

  movementType   String
  quantityDelta  Int
  quantityBefore Int?
  quantityAfter  Int?

  sourceType    String
  sourceId      String?
  importJobId   String?
  transactionId String?

  occurredAt    DateTime
  businessMonth String?
  memo          String?

  createdAt DateTime @default(now())

  product Product? @relation(fields: [productId], references: [id])

  @@index([companyId])
  @@index([companyId, storeId])
  @@index([companyId, sku])
  @@index([companyId, sellerSku])
  @@index([companyId, productId])
  @@index([companyId, importJobId])
  @@index([companyId, transactionId])
  @@index([companyId, occurredAt])
}
InventoryMovement rules
InventoryMovement is append-only.
Sale import creates SALE_DEDUCTION movement.
Manual correction creates MANUAL_ADJUSTMENT movement.
Return restock creates RETURN_RESTOCK movement.
Never silently edit old movement rows for operational correction.
8. Suggested constants

For first implementation, string fields are acceptable to reduce migration rigidity.

Recommended constants:

export const INVENTORY_MOVEMENT_TYPES = {
  SALE_DEDUCTION: "SALE_DEDUCTION",
  MANUAL_ADJUSTMENT: "MANUAL_ADJUSTMENT",
  PURCHASE_INBOUND: "PURCHASE_INBOUND",
  RETURN_RESTOCK: "RETURN_RESTOCK",
  DAMAGED_LOSS: "DAMAGED_LOSS",
  FBA_RECONCILIATION: "FBA_RECONCILIATION",
  INITIAL_BALANCE: "INITIAL_BALANCE",
} as const;

export const INVENTORY_SOURCE_TYPES = {
  AMAZON_ORDER_REPORT: "AMAZON_ORDER_REPORT",
  MANUAL: "MANUAL",
  IMPORT_JOB: "IMPORT_JOB",
  TRANSACTION: "TRANSACTION",
  FBA_INVENTORY_REPORT: "FBA_INVENTORY_REPORT",
} as const;

Use Prisma enums later only after values stabilize.

9. Minimal API proposal

Minimum endpoints:

GET /api/inventory/stocks
GET /api/inventory/movements
POST /api/inventory/manual-adjustments

Rules:

Every query must be scoped by companyId.
storeId should be preserved when available.
Manual adjustment must create InventoryMovement first, then update InventoryStock.
Do not implement Amazon order deduction in Step110-B.
10. Minimal Web proposal

Reuse existing inventory routes if present:

/[lang]/app/inventory/status
/[lang]/app/inventory/alerts

Inventory status table should show:

SKU
Product title
fulfillment channel
onHandQty
reservedQty
availableQty
inboundQty
stock status

Movement list or drawer should show:

movementType
quantityDelta
sourceType
importJobId
transactionId
occurredAt
memo
11. Step110-B implementation order

After this proposal:

patch Prisma schema
generate migration
add inventory constants / DTOs
add API module / service / controller
add manual adjustment endpoint
connect inventory status page to real API
run build
commit
deploy after UI smoke
12. Guardrails

Do not:

deduct inventory from Amazon order report yet
modify Transaction behavior
modify ImportJob behavior
introduce bank statement models yet
introduce reconciliation models yet
introduce AuditIssue yet
make sellerSku globally unique across all companies
edit stock snapshot without writing a movement

Always:

include companyId
preserve storeId when available
preserve importJobId on movements created from import
keep movement append-only
use InventoryStock only as snapshot
