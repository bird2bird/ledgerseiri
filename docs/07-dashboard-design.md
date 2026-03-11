# Dashboard Design

## Status
Post-Step33E accepted baseline

## Purpose
Dashboard home is the management summary page driven by real business data.

## Current Data Source
Backend:
- GET /dashboard
- GET /dashboard/summary

Frontend:
- apps/web/src/core/dashboard/api.ts
- apps/web/src/components/app/dashboard-v2/*

## Current KPI Contract
### Primary KPI
- revenue
- expense
- profit
- cash
- estimatedTax

### Secondary KPI
- unpaidAmount
- inventoryValue
- inventoryAlertCount
- runwayMonths

## Current Sections
- Revenue / Profit Trend
- Cash Balance by Account
- Expense Breakdown
- Cash Flow Trend
- Tax Summary
- Alerts
- Business Health
- Recent Transactions
- Quick Actions

## Current Known Constraints
- inventoryValue may fall back to 0 when InventoryBalance table is not available
- dashboard frontend still contains migration compatibility logic and should be simplified in next step

## To Be Updated Next
- exact frontend contract
- exact backend response schema
- mapping table: backend field -> frontend component prop
