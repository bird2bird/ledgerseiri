# LedgerSeiri Step 30A — Production Data Domain Design

Version: Draft v0.1  
Status: Design baseline for Step 30–35  
Scope: Workspace-aligned SaaS business domain model

---

## 1. Objective

This document defines the production-grade business domain model for LedgerSeiri so that:

- Sidebar pages map to stable data domains
- Dashboard reads from a unified aggregation layer
- Billing entitlements gate features without corrupting domain truth
- Import / Export use a unified job model
- Future CRUD pages can be implemented without redefining field semantics

---

## 2. Domain Boundaries

### 2.1 Workspace / Identity
Core entities:
- Company (current workspace tenant)
- User
- Store
- WorkspaceSubscription

Rules:
- Company is the tenant root.
- Store belongs to Company.
- Subscription governs entitlement and limits, not raw business truth.

### 2.2 Accounts
Core entities:
- Account
- FundTransfer
- AccountBalanceSnapshot (reserved for future)

Purpose:
- Bank / cash / e-wallet / gateway balances
- Account-level cash position
- Internal transfer tracking

Mapped pages:
- /app/accounts
- /app/account-balances
- /app/fund-transfer

### 2.3 Transactions
Core entities:
- Transaction
- TransactionCategory

Purpose:
- Unified revenue / expense / transfer ledger
- Store-linked and account-linked business flow
- Primary source of revenue / expense / profit dashboard metrics

Mapped pages:
- income/*
- expense/*
- dashboard summary/charts

### 2.4 Products / Inventory
Core entities:
- Product
- ProductSku
- InventoryBalance
- InventoryMovement

Purpose:
- Product master
- SKU-level inventory
- Inventory alerts and movement traceability

Mapped pages:
- /app/products
- /app/inventory/status
- /app/inventory/alerts

### 2.5 Invoices / Receivables
Core entities:
- Invoice
- PaymentReceipt

Purpose:
- Billing / receivable tracking
- Partial payment / overdue state
- Payment -> transaction reconciliation path

Mapped pages:
- /app/invoices
- /app/invoices/unpaid
- /app/invoices/history

### 2.6 Dashboard Aggregates
Core entities:
- No source-of-truth table in Step 30A
- Aggregation service only
- Snapshot tables may be added later

Purpose:
- KPI summary
- Charts
- Alerts
- Quick actions derived from feature entitlements and usage

### 2.7 Import / Export
Core entities:
- ImportJob
- ExportJob

Purpose:
- Unified ingestion/export workflow
- Status, auditability, result tracking
- Page-independent import/export UX

Mapped pages:
- /app/data/import
- /app/data/export

---

## 3. Domain-to-Page Mapping

| Page Group | Domain | Source of Truth |
|---|---|---|
| accounts | Accounts | Account |
| account-balances | Accounts | Account + Transaction + FundTransfer |
| fund-transfer | Accounts | FundTransfer |
| income / expense | Transactions | Transaction + TransactionCategory |
| products | Products | Product + ProductSku |
| inventory/status | Inventory | InventoryBalance |
| inventory/alerts | Inventory | InventoryBalance + alert thresholds |
| invoices | Receivables | Invoice |
| invoices/unpaid | Receivables | Invoice |
| invoices/history | Receivables | PaymentReceipt |
| reports/* | Dashboard Aggregates | Aggregation service |
| tax/summary | Dashboard / Tax Aggregate | Aggregation service |
| data/import | Import | ImportJob |
| data/export | Export | ExportJob |

---

## 4. Canonical Rules

### 4.1 Dashboard must not be source of truth
Dashboard only consumes aggregated domain data.

### 4.2 Transactions are unified
Revenue / expense / transfer flows are modeled in Transaction via:
- direction
- sourceType
- category
- store
- account

### 4.3 Billing gates features, not data model
Entitlements determine whether user may access a feature/page/action.  
They must not change business table structure.

### 4.4 Import / Export is a platform capability
It must not be implemented ad hoc per page.

---

## 5. Dashboard Aggregation Rules

### 5.1 Summary KPIs
- Revenue = sum(Transaction.amount where direction=INCOME)
- Expense = sum(Transaction.amount where direction=EXPENSE)
- Profit = Revenue - Expense
- Cash = derived from accounts + transfers + cash transactions
- Unpaid Amount = sum(open invoice receivable)
- Low Inventory SKU Count = inventory below alert level

### 5.2 Charts
- Revenue / profit trend = grouped Transaction
- Expense breakdown = grouped expense category
- Cash flow trend = grouped income / expense / transfer
- Alert feed = invoices overdue + inventory warnings + over-limit usage

---

## 6. Import / Export Unified Flow

### Import
1. Create import job
2. Upload file
3. Parse
4. Field mapping
5. Validate
6. Persist
7. Return result report

### Export
1. Create export job
2. Build filtered dataset
3. Generate file
4. Persist file URL
5. Download via export job status

---

## 7. Acceptance Criteria for Step 30

Step 30 is complete when:
1. Every Sidebar page maps to a stable domain
2. Prisma schema reflects stable domain entities
3. API naming is unified
4. Dashboard query contract is explicit
5. Import/export is job-based
6. Billing and entitlements are orthogonal to business truth

