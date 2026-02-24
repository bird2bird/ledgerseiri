# API Contract (Aligned to current implementation)

Generated at: 2026-02-23
Alignment inputs:
- apps/api/src/auth/auth.controller.ts
- apps/api/src/security/session.controller.ts
- apps/api/src/auth/refresh.controller.ts

Purpose:
Lock the interface contract to prevent context drift during modular development.
This contract reflects current actual implementation (paths, cookie names, status codes).

---

## Global Conventions

### Routing
- Backend: NestJS
- Reverse proxy: Nginx (same-site deployment)
- Mixed style currently:
  - /auth/*
  - /api/*

### Access Token
Returned in JSON:
{
  "accessToken": "string"
}

Sent by client via:
Authorization: Bearer <accessToken>

### Refresh Cookie
Name: __Host-lsrt
Attributes:
- HttpOnly: true
- SameSite: lax
- Path: /
- Secure: only when HTTPS (req.secure or x-forwarded-proto=https)
- Max-Age: 14 days

### Session Cookie (CSRF/session layer)
Cleared cookie:
- lsid (path=/)

### Origin Protection
Used on:
- POST /auth/refresh
- POST /auth/logout

Error code when origin invalid:
BAD_ORIGIN

### Current Error Patterns
- EMAIL_REQUIRED (400)
- NO_REFRESH (401)
- UNAUTHORIZED (401)

---

# AUTH MODULE

## POST /auth/register

Auth Required: No

Request Body:
- email: string
- password: string

Response:
- 200 OK
- Body: AuthService.register() return value

---

## POST /auth/login

Auth Required: No

Request Body:
- password: string
- identifier:
    - email OR
    - username OR
    - userName

Behavior:
- Missing identifier → 400 EMAIL_REQUIRED
- Creates refresh session
- Sets cookie: __Host-lsrt
- Returns access token

Response:
- 201 Created
{
  "accessToken": "string"
}

TODO:
- Implement lockout policy (10 failures → 24h)
- Standardize error schema

---

## GET /auth/me

Auth Required: Yes (JwtAuthGuard)

Header:
Authorization: Bearer <accessToken>

Response:
- 200 OK
- Body: AuthService.me(userId)

Errors:
- 401 invalid or expired token

---

# SESSION SECURITY MODULE

## GET /auth/csrf

Auth Required: No

Delegates to csrfTokenHandler()

Return shape: TBD (see csrf.ts)

---

## GET /auth/session-me

Auth Required: Yes (Bearer token)

Header:
Authorization: Bearer <accessToken>

Response:
- 200 OK
{
  "ok": true,
  "userId": "string"
}

Error:
- 401
{
  "message": "UNAUTHORIZED"
}

---

## POST /auth/session-logout

Auth Required: No

Behavior:
- Destroy server session
- Clear cookie: lsid

Response:
- 200 OK
{
  "ok": true
}

---

# REFRESH MODULE

## POST /auth/refresh

Auth: Refresh cookie based
Origin check enforced
Rotation enabled

Request Cookie:
__Host-lsrt=<refreshToken>

Behavior:
- Invalid origin → 401 BAD_ORIGIN
- Missing cookie → 401 NO_REFRESH
- Verify refresh token (sub + jti)
- Validate session / reuse detection
- Rotate session
- Issue new access token
- Set new refresh cookie

Response:
- 200 OK
{
  "accessToken": "string"
}

---

## POST /auth/logout

Auth: Refresh cookie based
Origin check enforced

Request Cookie:
optional __Host-lsrt

Behavior:
- Revoke refresh session (best effort)
- Clear cookie __Host-lsrt

Response:
- 200 OK
{
  "ok": true
}

---

# NEXT PRECISION STEPS

To fully lock contract:
- Review apps/api/src/security/csrf.ts
- Review apps/api/src/security/origin.ts

