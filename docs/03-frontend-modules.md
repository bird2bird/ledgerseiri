# Frontend Modules (Current + Planned)

Generated at: 2026-02-23T20:41:41+08:00

## 0. Stack
- Next.js (App Router)
- i18n via `[lang]` routes

## 1. Current Route Tree (from repo)
- /[lang]/lp
- /[lang]/login
- /[lang]/register
- /[lang]/forgot-password
- /[lang]/privacy
- /[lang]/terms
- /[lang]/app
- /[lang]/app/profile
- /[lang]/app/settings
- /[lang]/app/billing
- /[lang]/app/upgrade

## 2. Modules (fill in as you go)

### 2.1 Auth Pages
- Login page: /[lang]/login
- Register page: /[lang]/register
- Forgot password: /[lang]/forgot-password

**TODO**
- [ ] Form validation spec (email/password rules)
- [ ] Error mapping (401/403/429/lockout)
- [ ] Lockout UX (remaining time, support contact)
- [ ] i18n copy table

### 2.2 App Shell / Navigation
- Topbar (language + user menu)
- App layout: /[lang]/app/*

**TODO**
- [ ] Define global fetch wrapper (credentials include, 401 handling)
- [ ] Define “logged-in guard” strategy (middleware vs client guard)

### 2.3 Dashboard
- /[lang]/app

**TODO**
- [ ] KPI widgets list + data contracts
- [ ] Skeleton loading + empty state
- [ ] Time range selector

### 2.4 Stores / Transactions (planned pages)
建议新增（以后再做，不改现有即可）：
- /[lang]/app/stores
- /[lang]/app/transactions
- /[lang]/app/import

## 3. API Integration Checklist (do not implement here)
- All requests must include `credentials: "include"`
- CSRF header usage: align with backend `/auth/csrf`
- Standard error model: { code, message, details? }

