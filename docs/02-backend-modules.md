# Backend Modules (Current + Planned)
Doc Version: v1.4 (2026-02-27)
Generated at: 2026-02-23T20:41:41+08:00  
Source of truth:
- Extracted API: `docs/_generated/api-methods.md`
- Prisma index: `docs/_generated/prisma-model-index.md`

## 0. Runtime / Stack
- Framework: NestJS
- ORM: Prisma + PostgreSQL
- Auth: Session cookie + Refresh rotation (see `docs/04-auth-session-design.md`)
- Reverse proxy: Nginx (same-site deployment)

## 1. Current Controllers & Routes (auto extracted)

> 这里只是“发现到的路由装饰器行”，细节以 `docs/_generated/api-methods.md` 为准。

### 1.1 Controllers
- ## apps/api/src/app.controller.ts
- ## apps/api/src/auth/auth_api.controller.ts
- ## apps/api/src/auth/auth.controller.ts
- ## apps/api/src/auth/password-reset.controller.ts
- ## apps/api/src/auth/refresh_api.controller.ts
- ## apps/api/src/auth/refresh.controller.ts
- ## apps/api/src/company/company_api.controller.ts
- ## apps/api/src/company/company.controller.ts
- ## apps/api/src/dashboard/dashboard_api.controller.ts
- ## apps/api/src/dashboard/dashboard.controller.ts
- ## apps/api/src/health.controller.ts
- ## apps/api/src/security/session_api.controller.ts
- ## apps/api/src/security/session.controller.ts
- ## apps/api/src/store/store_api.controller.ts
- ## apps/api/src/store/store.controller.ts
- ## apps/api/src/transaction/transaction_api.controller.ts
- ## apps/api/src/transaction/transaction.controller.ts

### 1.2 Route decorators
- ## apps/api/src/app.controller.ts :: @Get('health')
- ## apps/api/src/auth/auth.controller.ts :: @Post('register')
- ## apps/api/src/auth/auth.controller.ts :: @Post('login')
- ## apps/api/src/auth/auth.controller.ts :: @Get('me')
- ## apps/api/src/auth/password-reset.controller.ts :: @Post('forgot-password')
- ## apps/api/src/auth/password-reset.controller.ts :: @Post('reset-password')
- ## apps/api/src/auth/refresh.controller.ts :: @Post('/refresh')
- ## apps/api/src/auth/refresh.controller.ts :: @Post('/logout')
- ## apps/api/src/company/company.controller.ts :: @Post('company')
- ## apps/api/src/company/company.controller.ts :: @Get('company')
- ## apps/api/src/dashboard/dashboard.controller.ts :: @Get('dashboard')
- ## apps/api/src/health.controller.ts :: @Get('health')
- ## apps/api/src/security/session.controller.ts :: @Get('csrf')
- ## apps/api/src/security/session.controller.ts :: @Get('session-me')
- ## apps/api/src/security/session.controller.ts :: @Post('session-logout')
- ## apps/api/src/store/store.controller.ts :: @Get('store')
- ## apps/api/src/store/store.controller.ts :: @Post('store')
- ## apps/api/src/transaction/transaction.controller.ts :: @Post('transaction')
- ## apps/api/src/transaction/transaction.controller.ts :: @Get('transaction')
- ## apps/api/src/transaction/transaction.controller.ts :: @Delete('transaction/:id')
- ## apps/api/src/transaction/transaction.controller.ts :: @Post('transaction/bulk')

## 2. Module-by-Module Spec (fill in as you go)

下面每个模块你按同一结构写，就不会丢上下文，也方便分工与避免冲突。

### 2.1 Auth Module
**Scope**
- 注册 / 登录 / Session / Refresh / Logout / Password reset

**Key routes (check extracted)**
- /auth/register
- /auth/login
- /auth/me
- /auth/refresh
- /auth/logout
- /auth/csrf
- /auth/session-me
- /auth/session-logout
- /api/auth/forgot-password
- /api/auth/reset-password

**DB dependencies**
- User
- RefreshSession
- PgSession (connect-pg-simple)
- PasswordResetToken

**Current status**
- Implemented: basic endpoints exist (see extracted methods)
- TBD: lockout policy (10 failures → lock 24h), rate limit, audit logging, email sending

**TODO / Decisions**
- [ ] Define session cookie settings for prod (SameSite, Secure, Domain)
- [ ] Define refresh token rotation + reuse detection policy
- [ ] Implement login failure tracking + lockout
- [ ] Email provider decision (SES / SendGrid / Postmark / SMTP)

---

### 2.2 Company Module
**Scope**
- Company create/read, defaults (timezone/currency/fiscal month)

**DB dependencies**
- Company
- User.companyId relation

**TODO**
- [ ] AuthZ: only company owner/admin can modify
- [ ] Update endpoints (PUT/PATCH)
- [ ] Validation rules

---

### 2.3 Store Module
**Scope**
- Store CRUD (Amazon JP etc.)

**DB dependencies**
- Store -> Company
- Transaction -> Store

**TODO**
- [ ] Pagination, soft delete, unique constraints (companyId+name)
- [ ] Platform/region enums

---

### 2.4 Transaction Module
**Scope**
- Transaction CRUD + bulk import

**DB dependencies**
- Transaction -> Store
- Indexes: storeId+occurredAt, type

**TODO**
- [ ] Import format spec (Amazon settlement, ads, fees)
- [ ] Idempotency key for bulk imports
- [ ] Currency strategy (JPY int now; multi-currency later?)

---

### 2.5 Dashboard Module
**Scope**
- KPI aggregation endpoints

**TODO**
- [ ] Define KPI metrics list (MRR, gross sales, fees, net, ad ROAS)
- [ ] Time window definitions (daily/weekly/monthly, fiscal month)

---

### 2.6 Security Module (CSRF/Origin)
**Scope**
- CSRF issuance/validation, origin checks

**TODO**
- [ ] Confirm prod origin list (ledgerseiri.com, www.ledgerseiri.com)
- [ ] Document threat model + mitigations

---

## 3. DB Model Index (auto extracted)

# Prisma Model Index

Source: apps/api/prisma/schema.prisma
Generated at: 2026-02-23T20:35:54+08:00



## model User

-   id        String   @id @default(cuid())
-   email     String   @unique
-   password  String
-   companyId String?
-   company   Company? @relation(fields: [companyId], references: [id])
-   createdAt DateTime @default(now())
-   refreshSessions RefreshSession[]
-   passwordResetTokens PasswordResetToken[]

## model Company

-   id              String   @id @default(cuid())
-   name            String
-   fiscalMonthStart Int     @default(1)
-   timezone        String   @default("Asia/Tokyo")
-   currency        String   @default("JPY")
-   users           User[]
-   stores          Store[]
-   createdAt       DateTime @default(now())

## model Store

-   id        String   @id @default(cuid())
-   companyId String
-   company   Company  @relation(fields: [companyId], references: [id])
-   name      String
-   platform  String   @default("AMAZON")
-   region    String   @default("JP")
-   createdAt DateTime @default(now())
-   transactions Transaction[]

## enum TransactionType

- SALE
- FBA_FEE
- AD
- REFUND
- OTHER

## model Transaction

-   id         String           @id @default(cuid())
-   storeId    String
-   store      Store            @relation(fields: [storeId], references: [id])
-   type       TransactionType
-   amount     Int
-   currency   String           @default("JPY")
-   occurredAt DateTime
-   memo       String?
-   createdAt  DateTime         @default(now())

## model RefreshSession

-   id            String   @id @default(cuid())
-   userId        String
-   jti           String   @unique
-   createdAt     DateTime @default(now())
-   expiresAt     DateTime
-   revokedAt     DateTime?
-   replacedByJti String?
-   user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

## model PgSession

-   sid    String   @id @db.VarChar
-   sess   Json @db.Json
-   expire DateTime @db.Timestamp(6)

## model PasswordResetToken

-   id         String   @id @default(cuid())
-   userId     String
-   tokenHash  String   @unique
-   createdAt  DateTime @default(now())
-   expiresAt  DateTime
-   usedAt     DateTime?
-   user User @relation(fields: [userId], references: [id], onDelete: Cascade)


