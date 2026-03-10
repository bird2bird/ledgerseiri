# Step 30 Proposal — API Contract

## Accounts
- GET /api/accounts
- POST /api/accounts
- PATCH /api/accounts/:id
- GET /api/account-balances
- POST /api/fund-transfer

## Transactions
- GET /api/transactions
- POST /api/transactions
- PATCH /api/transactions/:id
- DELETE /api/transactions/:id
- GET /api/transaction-categories

Filters:
- storeId
- accountId
- direction
- categoryId
- dateFrom
- dateTo

## Products / Inventory
- GET /api/products
- POST /api/products
- PATCH /api/products/:id
- GET /api/skus
- POST /api/skus
- GET /api/inventory/balances
- GET /api/inventory/movements
- POST /api/inventory/movements

## Invoices / Payments
- GET /api/invoices
- POST /api/invoices
- PATCH /api/invoices/:id
- GET /api/invoices/unpaid
- GET /api/invoices/history
- POST /api/payments

## Import / Export
- POST /api/import-jobs
- GET /api/import-jobs
- POST /api/export-jobs
- GET /api/export-jobs

## Dashboard
- GET /dashboard/summary
- GET /dashboard/charts
- GET /dashboard/alerts
- GET /dashboard/quick-actions
