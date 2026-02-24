# API Contract (Aligned to current implementation)

Generated at: 2026-02-24T08:41:57+08:00
Alignment sources:
- apps/api/src/auth/auth.controller.ts
- apps/api/src/security/session.controller.ts
- apps/api/src/auth/refresh.controller.ts
- apps/api/src/auth/refresh.service.ts
- apps/api/src/auth/auth.service.ts
- apps/api/src/security/csrf.ts
- apps/api/src/security/origin.ts
- apps/api/prisma/schema.prisma

Purpose:
- Lock the interface contract to prevent context drift during modular development.
- This document reflects current actual implementation (paths, cookie names, status codes, header names, token semantics).

---

## 0. Global Conventions (Current)

### 0.1 Routing
- Backend: NestJS
- Reverse proxy: Nginx (same-site deployment)
- Public endpoints are currently mixed: `/auth/*` and `/api/*` (api controllers exist; verify separately).

### 0.2 Access Token (JWT)
Returned in JSON:
```json
{ "accessToken": "string" }
```

Client sends it via:
```
Authorization: Bearer <accessToken>
```

Expiry:
- 60 minutes (env JWT_ACCESS_EXPIRES_MINUTES, default 60)

### 0.3 Refresh Token (JWT) + Cookie
- Cookie name: `__Host-lsrt`
Cookie attributes:
- HttpOnly: true
- SameSite: lax
- Path: /
- Secure: Secure=true only when HTTPS (req.secure==true OR x-forwarded-proto=https)
- Max-Age: 14 days

### 0.4 CSRF (session-bound secret; not auth)
- Issue endpoint: `GET /auth/csrf`
Response JSON:
```json
{ "csrfToken": "string" }
```
Accepted token sources for verification:
- Header: `x-csrf-token`
- OR Body: `csrfToken`

### 0.5 Origin Allowlist (used by refresh/logout)
- env ALLOWED_ORIGINS default: `https://www.ledgerseiri.com,https://ledgerseiri.com`
- SSR/S2S calls with no Origin/Referer: ALLOW

---

## 1. Endpoint Truth Table (Verified)

| Endpoint | Method | Requires Bearer | Requires refresh cookie | Origin check | Response | Notes |
|---|---:|---:|---:|---:|---|---|
| /auth/register | POST | No | No | No | pass-through | AuthService.register(email,password) |
| /auth/login | POST | No | sets cookie | No | 201 { "accessToken":"string" } | sets `__Host-lsrt` cookie |
| /auth/me | GET | Yes (JwtAuthGuard) | No | No | pass-through | AuthService.me(userId) |
| /auth/csrf | GET | No | No | No | { "csrfToken":"string" } | binds secret to session |
| /auth/session-me | GET | Yes (Authorization Bearer) | No | No | { ok:true, userId } | 401 message UNAUTHORIZED=True |
| /auth/session-logout | POST | No | No | No | { "ok":true } | destroys session; clears cookie `lsid` |
| /auth/refresh | POST | No | Yes | Yes | 200 { "accessToken":"string" } | rotation + set new cookie |
| /auth/logout | POST | No | Optional | Yes | 200 { "ok":true } | best-effort revoke; clears `__Host-lsrt` |

---

## 2. DB Dependencies (Auth-related, from Prisma)
- User
- RefreshSession
- PasswordResetToken
- PgSession

---

## 3. Error Code Registry (Observed)
- `BAD_ORIGIN`
- `EMAIL_REQUIRED`
- `NO_REFRESH`
- `REFRESH_EXPIRED`
- `REFRESH_INVALID`
- `REFRESH_NOT_FOUND`
- `REFRESH_REUSE_DETECTED`
- `SESSION_NOT_READY`
- `SESSION_SAVE_FAILED`
- `UNAUTHORIZED`
- `email already registered`
- `email and password required`
- `invalid credentials`

---

## 4. Next Precision Steps (Docs only)
1) Freeze exact response schema for AuthService.register(...) and AuthService.me(...).
2) Confirm CSRF enforcement path in main.ts/security.module.ts (middleware/guard).
3) Decide external API entry strategy: keep /auth/* or migrate to /api/auth/* and mark deprecated routes in this contract.
