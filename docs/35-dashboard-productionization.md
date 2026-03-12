# Step 35 Dashboard Productionization

## Goal
Make Dashboard stable enough for SaaS production foundation without changing the Step34B contract.

## Step 35A (Safe Foundation)
- Add 30s in-memory cache in `apps/api/src/dashboard/dashboard.controller.ts`
- Keep current API contract unchanged
- Keep frontend mapping centralized in `apps/web/src/core/dashboard/api.ts`
- Improve frontend fallback behavior
- Keep store selector mock for now
- Harden inventory fallback when `InventoryBalance` table is not migrated yet

## Deferred to next steps
### Step 35B
- Extract `DashboardService`
- Reduce query count
- Move heavy aggregation out of controller

### Step 35C
- Introduce live store options via authenticated API path
- Align dashboard filter options with real workspace stores

### Step 35D
- Cache invalidation after transaction / invoice / payment writes

### Step 35E
- Add observability
- latency log
- slow query log
- request tracing

### Step 35F
- Move dashboard cache to shared module `dashboard-cache.ts`
- Keep dashboard read cache behavior unchanged
- Invalidate dashboard cache automatically after successful write requests to:
  - transactions
  - invoices
  - payments
  - fund-transfer
  - accounts
