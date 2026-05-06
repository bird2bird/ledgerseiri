# Step110-A: Closed-loop Data Model and Status Design

## 0. Purpose

Step110 defines the product-level closed loop for LedgerSeiri.

This step is design-only.

No API changes.
No DB changes.
No Prisma migration.
No UI implementation.
No import parser implementation.

---

## 1. Closed-loop Product Boundary

LedgerSeiri should connect the following flows:

1. Amazon order report import
2. SKU / product / quantity recognition
3. automatic inventory deduction
4. income transaction context
5. bank statement import
6. automatic income / expense classification
7. transaction-bank reconciliation
8. invoice / evidence requirement checking
9. missing evidence / missing bank statement warnings
10. manual audit queue

Main exception:

- Cash transactions do not require bank statement matching.
- Cash expenses may still require receipt / invoice evidence.

---

## 2. Existing LedgerSeiri Foundation

Current stable concepts should be reused:

- Transaction
- ImportJob
- ImportStagingRow
- TransactionAttachment
- Import Center
- Income pages
- Expense pages
- Amazon Store Orders
- Store Operation Expenses
- Expense evidence badges
- Import trace navigation

Design principle:

- ImportJob remains the import history source.
- Transaction remains the accounting event.
- InventoryMovement records stock changes.
- BankStatementLine records imported bank rows.
- ReconciliationLink connects transactions and bank lines.
- AuditIssue tracks warnings and manual review.

---

## 3. Core Data Objects

### 3.1 Product

Purpose:

Identify sellable items and connect Amazon SKU / seller SKU / internal SKU.

Suggested fields:

- id
- companyId
- storeId
- sku
- asin
- sellerSku
- title
- status
- createdAt
- updatedAt

Rules:

- companyId is required.
- sellerSku should be unique within company/store scope.
- asin may repeat when sellerSku differs.

---

### 3.2 InventoryStock

Purpose:

Store current stock snapshot.

Suggested fields:

- id
- companyId
- storeId
- productId
- sku
- fulfillmentChannel
- locationCode
- onHandQty
- reservedQty
- availableQty
- inboundQty
- updatedAt

Fulfillment channels:

- FBA
- FBM
- MANUAL
- OTHER

Rule:

availableQty = onHandQty - reservedQty

For MVP, availableQty can be stored and recalculated after each movement.

---

### 3.3 InventoryMovement

Purpose:

Record every stock change as an auditable event.

Suggested fields:

- id
- companyId
- storeId
- productId
- sku
- movementType
- quantityDelta
- quantityBefore
- quantityAfter
- sourceType
- sourceId
- importJobId
- transactionId
- occurredAt
- businessMonth
- memo
- createdAt

Movement types:

- SALE_DEDUCTION
- MANUAL_ADJUSTMENT
- PURCHASE_INBOUND
- RETURN_RESTOCK
- DAMAGED_LOSS
- FBA_RECONCILIATION
- INITIAL_BALANCE

Rules:

- InventoryMovement is append-only.
- InventoryStock is the latest calculated snapshot.
- Historical corrections should be done by corrective movement, not silent edit.

---

### 3.4 Amazon Order Import Row

Normalized Amazon order row should include:

- amazonOrderId
- purchaseDate
- businessMonth
- asin
- sellerSku
- sku
- productName
- quantity
- itemPrice
- itemTax
- shippingPrice
- shippingTax
- promotionDiscount
- promotionDiscountTax
- currency
- fulfillmentChannel

Commit result:

1. create or match Product
2. create income/store-order context
3. create InventoryMovement SALE_DEDUCTION
4. update InventoryStock
5. create AuditIssue when SKU cannot be matched
6. create AuditIssue when stock becomes negative

No stock change during preview.

---

### 3.5 BankStatementLine

Purpose:

Represent imported bank rows independently from accounting transactions.

Suggested fields:

- id
- companyId
- accountId
- importJobId
- sourceFileName
- sourceRowNo
- transactionDate
- valueDate
- description
- payerPayeeName
- amount
- direction
- currency
- balanceAfter
- normalizedHash
- classificationStatus
- reconciliationStatus
- createdAt
- updatedAt

Important rule:

BankStatementLine is not the same as Transaction.

- Transaction = accounting intent
- BankStatementLine = actual money movement

---

### 3.6 ReconciliationLink

Purpose:

Connect Transaction and BankStatementLine.

Suggested fields:

- id
- companyId
- transactionId
- bankStatementLineId
- linkType
- matchConfidence
- amountMatched
- status
- createdBy
- createdAt
- updatedAt

Rules:

- Non-cash income requires at least one confirmed bank statement link.
- Non-cash expense requires at least one confirmed bank statement link.
- One bank line may link to multiple transactions.
- One transaction may link to multiple bank lines.

---

### 3.7 Invoice / Evidence

Existing TransactionAttachment remains the storage layer.

Evidence requirement can initially be derived from:

- Transaction
- TransactionAttachment
- ReconciliationLink
- BankStatementLine
- ledger_scope markers
- transaction type
- category

Evidence status:

- NOT_REQUIRED
- MISSING
- PARTIAL
- SATISFIED
- WAIVED

Expense rules:

- Normal expense requires bank statement link and invoice/evidence.
- Payroll usually requires bank statement but may not require invoice.
- Cash expense does not require bank statement but may require receipt.

---

### 3.8 AuditIssue

Purpose:

Single manual review queue.

Suggested fields:

- id
- companyId
- issueType
- severity
- status
- targetType
- targetId
- relatedImportJobId
- relatedTransactionId
- relatedBankStatementLineId
- relatedProductId
- message
- resolutionNote
- createdAt
- updatedAt
- resolvedAt

Issue types:

- MISSING_BANK_STATEMENT
- MISSING_INVOICE
- UNMATCHED_BANK_LINE
- UNCLASSIFIED_BANK_LINE
- NEGATIVE_INVENTORY
- UNKNOWN_SKU
- AMOUNT_MISMATCH
- DUPLICATE_IMPORT_ROW
- MISSING_PRODUCT_MAPPING
- LOW_CONFIDENCE_CLASSIFICATION

Rule:

AuditIssue is the single queue for manual review.

---

## 4. Status Model

### Transaction status

bankRequirementStatus:

- NOT_REQUIRED
- REQUIRED_MISSING
- SUGGESTED
- MATCHED
- WAIVED

invoiceRequirementStatus:

- NOT_REQUIRED
- REQUIRED_MISSING
- ATTACHED
- WAIVED

auditStatus:

- CLEAN
- WARNING
- NEEDS_REVIEW
- BLOCKED

### Inventory status

stockStatus:

- OK
- LOW_STOCK
- ZERO_STOCK
- NEGATIVE_STOCK
- UNKNOWN_SKU

### Bank line status

classificationStatus:

- UNCLASSIFIED
- AUTO_CLASSIFIED
- RULE_CLASSIFIED
- AI_SUGGESTED
- MANUAL_CLASSIFIED
- IGNORED

reconciliationStatus:

- UNMATCHED
- SUGGESTED
- MATCHED
- PARTIALLY_MATCHED
- IGNORED

---

## 5. Amazon Order Report to Inventory Deduction

Preview:

1. upload Amazon order report
2. create ImportJob
3. parse rows
4. normalize ImportStagingRow
5. detect SKU mapping
6. preview recognized products, unknown SKUs, stock deduction, negative stock risk, duplicate rows

Commit:

1. match product by sellerSku / sku / asin
2. create store-order / income context
3. create InventoryMovement SALE_DEDUCTION
4. update InventoryStock
5. create AuditIssue for unknown SKU or negative stock
6. update ImportJob counts

Idempotency:

dedupeHash should include companyId, storeId, amazonOrderId, sellerSku, row identity, quantity, and amount.

Never deduct inventory twice for the same imported order line.

---

## 6. Bank Statement Import and Classification

Preview:

1. upload bank CSV
2. create ImportJob
3. normalize bank rows
4. detect duplicate normalizedHash
5. run deterministic rules
6. show classification preview

Commit:

1. create BankStatementLine
2. set classificationStatus
3. attempt reconciliation
4. create ReconciliationLink when confidence is high
5. create AuditIssue if unmatched or low confidence

Rules engine runs before AI.

AI should be called only when deterministic rules are insufficient.

---

## 7. Manual Audit Queue

Audit queue aggregates:

- inventory problems
- unmatched bank lines
- transaction without bank line
- expense without invoice
- low confidence classification
- unknown SKU
- duplicate import row
- amount mismatch

Minimum behavior:

- list issues
- filter by severity/status/type
- open target detail
- resolve / ignore / manually link

---

## 8. Implementation Plan

### Step110-B: Inventory foundation

- inspect current Prisma schema
- propose Product / InventoryStock / InventoryMovement models
- add migration only after schema review
- add read APIs
- wire inventory status page to real data

### Step110-C: Amazon order report inventory deduction

- extend Amazon parser
- SKU matching
- create SALE_DEDUCTION movements
- update InventoryStock
- warn unknown SKU / negative stock

### Step110-D: Bank statement import foundation

- BankStatementLine model
- bank CSV preview / commit
- deterministic classification
- unmatched line warning

### Step110-E: Transaction-bank reconciliation

- ReconciliationLink model
- income / expense matching
- required bank statement warning
- manual link / unlink UX

### Step110-F: Invoice/evidence audit

- evidence requirement derivation
- missing invoice warnings
- audit issue queue
- expense page warning integration

---

## 9. Guardrails

Do not:

- deduct inventory during preview
- create duplicate inventory movements
- merge BankStatementLine into Transaction
- require bank statements for cash transactions
- use AI before deterministic rules
- hide missing evidence warnings
- auto-resolve audit issues without trace

Always:

- include companyId in every query
- preserve importJobId traceability
- preserve sourceRowNo when available
- make write operations idempotent
- show manual review when confidence is low

---

## 10. MVP Priority

1. Product / InventoryStock / InventoryMovement
2. Amazon order import to inventory deduction
3. BankStatementLine import
4. ReconciliationLink
5. Evidence requirement warnings
6. AuditIssue queue

Next step:

Step110-B: Inventory foundation schema inspection and minimal model proposal.
