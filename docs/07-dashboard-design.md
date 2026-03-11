# 07-dashboard-design

## Current state after Step 34B

Dashboard home is now normalized to a single frontend contract:

- Range enum: `7d | 30d | 90d | 12m`
- Frontend fetch route: `/dashboard/summary`
- Frontend no longer mutates API payload shape inside `DashboardHomeV2`
- Mapping layer is consolidated in `apps/web/src/core/dashboard/api.ts`
- Mock data is updated to the same contract as production data

## Render blocks

1. Header
2. KPI primary row
3. KPI secondary row
4. Revenue / Profit trend
5. Cash balance by account
6. Expense breakdown
7. Cash flow trend
8. Tax summary
9. Alerts / tasks
10. Business health
11. Recent transactions
12. Quick actions

## Backend payload sections consumed

- `summary`
- `filters`
- `revenueProfitTrend`
- `cashFlowTrend`
- `cashBalances`
- `expenseBreakdown`
- `taxSummary`
- `alerts`
- `businessHealth`
- `recentTransactions`

## Known assumptions

- Inventory table may be absent; backend safely falls back to zero inventory values
- Cash balance account type from backend uppercase enum is normalized in frontend
- `businessHealth.headline/summary` may be converted into a fallback insight when detailed insights are absent

## Next cleanup direction

- Remove stale mock-only UI wording that is no longer needed
- Add dedicated smoke test for dashboard render consistency
- Optionally align store filter options with live workspace store list
