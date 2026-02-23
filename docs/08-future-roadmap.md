# Future Roadmap (Module-based)

Generated at: 2026-02-23T20:41:41+08:00

## Guiding principle
- “Small PRs, strict contracts”: each module has DB+API+UI contract first, then implementation.

## Phase 0 (Now): Stabilize foundation
- [x] Repo + branching (main/dev)
- [x] Docs structure
- [x] API/DB extraction (generated docs)
- [ ] CI baseline (lint/test/build)
- [ ] Environment management (.env.example, secrets policy)

## Phase 1: Auth & Security hardening
- [ ] Login failure tracking + lockout policy (10 tries / 24h)
- [ ] Rate limit (per IP + per account)
- [ ] Refresh token reuse detection + rotation rules documented
- [ ] CSRF strategy documented and enforced in frontend

## Phase 2: Accounting core (Store/Transaction)
- [ ] Store CRUD + permissions
- [ ] Transaction list (pagination, filters)
- [ ] Bulk import spec (Amazon settlement)
- [ ] Idempotent import pipeline

## Phase 3: Dashboard v1 (Management KPIs)
- [ ] KPI endpoint contracts
- [ ] Dashboard UI widgets + drill down
- [ ] Export (CSV) for finance

## Phase 4: Subscription & Billing
- [ ] Plan gates (Starter/Standard/AI)
- [ ] Payment provider decision (Stripe / KOMOJU)
- [ ] Trial workflow

## Phase 5: AI features (optional)
- [ ] OCR invoice ingestion
- [ ] Auto categorization
- [ ] Anomaly detection

## Module ownership suggestion
- auth/security
- company/store
- transaction/import
- dashboard/analytics
- billing/subscription
- ai/automation

