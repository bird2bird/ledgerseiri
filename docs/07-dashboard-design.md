# Dashboard Design

Generated at: 2026-02-23T20:41:41+08:00

## 0. Goal
- Provide management-grade KPI overview for cross-border e-commerce accounting.

## 1. Data sources (current)
Backend routes: see `docs/_generated/api-methods.md`

### Candidate endpoints
- /dashboard (from dashboard controller)

## 2. KPI Definition (v0)
> 先定义口径，后端实现只要对齐口径即可。

### Revenue
- Gross Sales (sum of SALE)
- Refunds (sum of REFUND)
- Net Sales = Gross - Refunds

### Cost
- FBA Fee (sum of FBA_FEE)
- Ads (sum of AD)

### Profit
- Operating Profit (simple) = Net Sales - FBA Fee - Ads - Other

## 3. Time windows
- Daily (last 7/30)
- Monthly (current month vs last month)
- Fiscal month start: Company.fiscalMonthStart

## 4. Drill-down (planned)
- Click KPI -> filtered transaction list

## 5. Open decisions
- [ ] Currency: multi-currency support policy
- [ ] Store segmentation: per store vs consolidated

