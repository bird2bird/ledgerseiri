# LedgerSeiri System Architecture

Doc Version: v1.0
Last Updated: 2026-02-27
Owner: System Architect
Status: MVP Stabilization Phase

---

# 1. System Overview

LedgerSeiri is a multi-tenant bookkeeping SaaS designed for Amazon Japan sellers.

The system follows a:

- Contract-driven development model
- Multi-tenant strict isolation model
- JWT-based authentication model
- Same-site secure deployment model

Primary goals:

- Financial correctness
- Tenant isolation
- API stability
- Security first

Non-goals (MVP phase):

- AI automation
- Complex role-based permissions
- Microservice splitting
- Horizontal scaling optimization

---

# 2. High-Level Architecture

Deployment model:

Browser
   ↓
Nginx (same-site reverse proxy)
   ↓
Next.js (Frontend)
   ↓
NestJS (API)
   ↓
Prisma ORM
   ↓
PostgreSQL

All components run under the same primary domain.

Example:

- https://ledgerseiri.com → Next.js
- https://ledgerseiri.com/api/* → NestJS

---

# 3. Trust Boundaries

## 3.1 Client Boundary

The browser is untrusted.

All authorization must be enforced server-side.

Frontend must not assume ownership or permissions.

---

## 3.2 API Boundary

NestJS is the authority for:

- Authentication
- Authorization
- Multi-tenant validation
- Data correctness enforcement

All business validation must occur at API layer.

---

## 3.3 Database Boundary

PostgreSQL is the single source of truth.

Amount normalization must occur before DB write.

Financial calculations must be reproducible from DB data only.

---

# 4. Multi-Tenant Isolation Model

Tenant hierarchy:

User
  ↓
Company
  ↓
Store
  ↓
Transaction

Rules:

1. A user belongs to exactly one company (MVP phase).
2. All Store access must verify companyId ownership.
3. All Transaction access must verify store ownership.
4. No cross-company queries are allowed.

Enforcement:

- Every controller must validate storeId ownership via companyId.
- No raw storeId usage without ownership check.

---

# 5. Authentication Architecture

## 5.1 Access Token

- JWT
- Short-lived
- Sent via Authorization header
- Stateless

Used for:
- All business API access

---

## 5.2 Refresh Token

- HttpOnly cookie
- Name: __Host-lsrt
- Rotation enabled
- Stored in DB with JTI

Reuse detection:
If revoked refresh token reused:
- Revoke entire refresh chain
- Reject request

---

## 5.3 CSRF Protection

CSRF applies only to:

- Cookie-bound endpoints

Verification:

- x-csrf-token header
- or csrfToken in body

---

## 5.4 Origin Protection

POST /auth/refresh and logout must verify:

- Origin header
OR
- Referer prefix

Allowed origins defined in environment variable.

---

# 6. Module Architecture

Backend modules:

- Auth
- Security (CSRF / Origin)
- Company
- Store
- Transaction
- Dashboard

Each module:

- Owns its controller
- Owns Prisma interaction
- Must follow API contract

No module may directly modify another module's data
without going through defined ownership checks.

---

# 7. Financial Integrity Rules

Financial system must follow:

1. Amount sign normalization:
   - SALE → positive
   - FBA_FEE / AD / REFUND → negative
2. Profit = SUM(amount)
3. Dashboard must not calculate profit independently from DB logic.
4. Month boundaries must use UTC normalization.

No derived financial logic in frontend.

---

# 8. Error Handling Strategy

Current state:
Mixed error formats exist.

Target state:
All endpoints follow Error Contract V2.

Migration path:
Frontend normalization first,
Backend standardization later.

---

# 9. Versioning Strategy

API contract must include version header in docs.

Breaking changes require:

1. ADR entry
2. Contract version bump
3. Frontend update
4. Backend migration

---

# 10. Security Assumptions

- Same-site deployment
- HTTPS in production
- Secure cookie flag enabled when HTTPS
- JWT secret and refresh secret separated

No third-party OAuth in MVP.

---

# 11. Scalability Strategy (Post-MVP)

Not implemented yet.

Future considerations:

- Redis for refresh session
- Read replica for analytics
- Background jobs for bulk processing
- Store-level permission roles

---

# 12. Architectural Non-Negotiables

These rules MUST NOT be broken:

1. No API without contract documentation.
2. No cross-tenant access.
3. No silent response shape changes.
4. No financial computation in frontend.
5. No refresh token without rotation.

---

# 13. Architectural Decision Records

All major changes must be logged in:

docs/ADR/

Each ADR must include:

- Context
- Decision
- Alternatives considered
- Consequences

---

# 14. Current Phase Constraints

We are in:

MVP Stabilization Phase

Focus:

- Correctness
- Security
- Stability

Do NOT:

- Introduce AI modules
- Introduce complex RBAC
- Split services prematurely

---

End of Architecture Document
