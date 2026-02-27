# Security Model (Reflects Current Implementation)

Doc Version: v1.0
Last Updated: 2026-02-27
Owner: System Architect
Status: Reflects Actual Code Behavior

---

# 1. Security Philosophy

LedgerSeiri currently uses:

- Stateless access tokens
- Rotating refresh tokens
- Cookie-based refresh
- Controller-level ownership enforcement
- Same-origin protection for sensitive endpoints

Security focus:

- Multi-tenant isolation
- Refresh reuse detection
- Ownership validation

Not implemented:

- Rate limiting
- RBAC
- Audit logging
- Device fingerprinting
- Access token revocation

---

# 2. Identity vs Authorization

Authentication proves:

- userId

Authorization must verify:

- user.companyId
- store.companyId

There is no global authorization middleware.

Ownership checks are performed manually inside controllers.

---

# 3. Multi-Tenant Isolation Model

Hierarchy:

User
  ↓
Company
  ↓
Store
  ↓
Transaction

Isolation rules:

1. user.companyId must match store.companyId
2. transaction.storeId must belong to user's company
3. No cross-company query allowed

Enforcement location:

- company.controller.ts
- store.controller.ts
- transaction.controller.ts
- dashboard.controller.ts

Risk:

Ownership logic is duplicated across controllers.
No centralized policy enforcement exists.

---

# 4. Token Security

## 4.1 Access Token

- JWT
- Stateless
- No blacklist
- Expiry only control

Risk:

Access token cannot be revoked early.

---

## 4.2 Refresh Token

- JWT with jti
- Stored in DB
- Rotation required
- Reuse detection implemented

Reuse behavior:

If revoked token reused:
→ revoke all sessions for user

Strength:

Protects against replay attacks.

---

# 5. Cookie Security

Refresh cookie:

Name: __Host-lsrt

Attributes:

- HttpOnly
- SameSite: lax
- Path: /
- Secure only when HTTPS

Access token NOT stored in cookie.

---

# 6. CSRF Model

CSRF uses express-session to store secret.

Session is NOT used for authentication.

CSRF applies to cookie-bound endpoints.

Business APIs protected by JWT guard only.

Risk:

CSRF not enforced on all state-changing endpoints.

---

# 7. Origin Protection

Non-GET endpoints may use sameOriginProtect().

Validation:

- Origin exact match
OR
- Referer startsWith allowed origin
OR
- Both missing (SSR/S2S)

Risk:

Origin check not globally applied.

---

# 8. Data Integrity Protection

Financial integrity:

- Amount normalized before DB write
- Profit = SUM(amount)
- No frontend calculation allowed

No soft-delete mechanism.
Hard delete used in transaction deletion.

---

# 9. Known Security Gaps

The following are NOT implemented:

- Rate limiting
- Brute-force protection
- Password attempt lockout
- Email verification
- IP-based anomaly detection
- Refresh token hashing
- Device binding

Acceptable for MVP phase.

---

# 10. Security Enforcement Rule

All new endpoints must:

- Validate ownership explicitly
- Follow JWT guard
- Avoid direct trust of storeId or companyId from client

---

# 11. Escalation Policy

If new feature:

- Touches auth logic
- Touches refresh logic
- Changes cookie behavior
- Changes ownership rules

Architect approval required.

---

End of Security Model
