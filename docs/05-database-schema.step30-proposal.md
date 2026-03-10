# Step 30 Proposal — Database Schema Extension

This file is a production proposal for extending the current Prisma schema.

## Proposed Additions

### Enums
- AccountType
- TransactionDirection
- TransactionSourceType
- InventoryMovementType
- InvoiceStatus
- JobStatus

### Models
- Account
- FundTransfer
- TransactionCategory
- Product
- ProductSku
- InventoryBalance
- InventoryMovement
- Invoice
- PaymentReceipt
- ImportJob
- ExportJob

## Proposed Upgrades
### Transaction
Add:
- direction
- sourceType
- accountId
- categoryId
- currency
- externalRef
- memo
- updatedAt

## Migration Strategy
1. Do not mutate live schema blindly
2. Compare current schema against proposal
3. Merge relations carefully
4. Generate migration in a dedicated branch/container
5. Verify no duplicate enum/model names

## Notes
- Company remains current workspace tenant root
- Store remains sales channel/store dimension
- WorkspaceSubscription remains billing/entitlement layer
