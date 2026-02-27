# Authentication & Session Design

Doc Version: v1.0
Last Updated: 2026-02-27
Owner: System Architect
Status: Implemented (Reflects Current Code Behavior)

---

# 1. Overview

LedgerSeiri uses a hybrid authentication model:

- Access Token (JWT, short-lived)
- Refresh Token (JWT + DB-backed session)
- CSRF protection (session-bound secret)
- Origin verification (refresh endpoints)

This document describes the CURRENT implementation behavior.

It is not a theoretical design.
It reflects the real backend code.

---

# 2. Authentication Model

## 2.1 Access Token

Type: JWT  
Transport: Authorization header  
Format:

Authorization: Bearer <accessToken>

Payload:
{
  sub: userId
}

Expiration:
Controlled by env:

JWT_ACCESS_EXPIRES_MINUTES
Default: 60 minutes

Secret:
process.env.JWT_SECRET

Used for:
- All protected business endpoints
- Guarded by JwtAuthGuard

Stateless:
Access tokens are not stored in DB.

---

# 3. Refresh Token Architecture

## 3.1 Refresh Token Purpose

Used to:

- Re-issue access tokens
- Maintain login session
- Detect reuse attacks

---

## 3.2 Refresh Token Storage

Refresh tokens are:

1. Signed JWT
2. Contain:
   {
     sub: userId,
     jti: uuid,
     typ: "refresh"
   }
3. Stored in database table: refreshSession

DB fields (from Prisma):

- userId
- jti
- expiresAt
- revokedAt
- replacedByJti

---

## 3.3 Cookie Configuration

Refresh token is stored in cookie:

Name:
__Host-lsrt

Attributes:

- HttpOnly: true
- SameSite: lax
- Path: /
- Secure: true ONLY if:
    req.secure === true
    OR
    x-forwarded-proto === https
- Max-Age:
    JWT_REFRESH_EXPIRES_DAYS
    Default: 14 days

Important:
Cookie is NOT accessible via JavaScript.

---

## 3.4 Refresh Token Rotation

On refresh:

1. Verify JWT signature
2. Validate payload structure
3. Fetch DB row by jti
4. Check:

   - row exists
   - userId matches
   - not expired
   - not revoked

If revokedAt is NOT null:

→ Reuse detected

System action:
- Revoke ALL refresh sessions for that user
- Throw REFRESH_REUSE_DETECTED

If valid:

1. Mark old session revoked
2. Create new session (new jti)
3. Issue new refresh token
4. Issue new access token

Rotation is mandatory.
There is no non-rotating refresh flow.

---

# 4. Reuse Detection Logic

If a revoked refresh token is used again:

System performs:

revokeUserAll(userId)

Effect:
- All active sessions are revoked
- User must re-login

This prevents token replay attacks.

---

# 5. Logout Behavior

Logout endpoint:

- Revokes current refresh session (best effort)
- Clears __Host-lsrt cookie

Access token remains valid until expiry (stateless design).

---

# 6. CSRF Protection

CSRF is implemented via:

File: security/csrf.ts

Mechanism:

- Uses express-session ONLY to bind csrfSecret
- Session is NOT used for authentication

Flow:

1. On CSRF token request:
   - If session.csrfSecret not exist:
       generate secret
   - Create token from secret
   - Save session
   - Return { csrfToken }

2. For protected endpoints:
   verifyCsrf(req) checks:

   - Header: x-csrf-token
   OR
   - Body: csrfToken

If verification fails:
Request should be rejected.

Important:
CSRF applies only to cookie-based endpoints.

Access-token-only endpoints are not CSRF-sensitive.

---

# 7. Origin Protection

Implemented in:

security/origin.ts

Function:
sameOriginProtect()

Logic:

For non-GET requests:

1. Read:
   - Origin header
   - Referer header

2. Allowed origins list from env:

ALLOWED_ORIGINS
Default:
https://www.ledgerseiri.com
https://ledgerseiri.com

3. Rules:

If BOTH origin AND referer missing:
→ Allow (SSR / server-to-server)

If origin matches allowlist:
→ Allow

If referer starts with allowed origin:
→ Allow

Else:
→ Return 403 BAD_ORIGIN

Used for:
- Refresh endpoints
- Cookie-sensitive operations

---

# 8. Security Boundaries

## 8.1 Access Token Trust

Access token is trusted only if:

- Valid signature
- Not expired

No blacklist mechanism for access token.

---

## 8.2 Refresh Token Trust

Refresh token trusted only if:

- JWT valid
- DB row exists
- Not expired
- Not revoked
- Not reused

---

## 8.3 Multi-Tenant Isolation

Authentication only proves identity.

Authorization must verify:

- user.companyId
- store.companyId

Auth system does NOT enforce tenant logic.
Controllers must enforce ownership.

---

# 9. Known Limitations (Current Implementation)

1. Access tokens are not revocable.
2. CSRF only applies to cookie-based flows.
3. No rate limiting implemented.
4. No device fingerprinting.
5. No IP binding.
6. No brute-force protection.

These are acceptable in MVP stabilization phase.

---

# 10. Environment Variables Used

JWT_SECRET
JWT_REFRESH_SECRET
JWT_ACCESS_EXPIRES_MINUTES
JWT_REFRESH_EXPIRES_DAYS
ALLOWED_ORIGINS

---

# 11. Migration Considerations

Future improvements may include:

- Redis-backed refresh session
- Access token revocation list
- Device binding
- Refresh token hashing
- Rate limiting middleware

None implemented currently.

---

# 12. Non-Negotiable Security Rules

1. Refresh tokens MUST rotate.
2. Reuse detection MUST revoke all sessions.
3. Refresh token MUST be HttpOnly.
4. JWT secrets MUST be separate.
5. Ownership validation MUST occur in every controller.

---

End of Auth & Session Design
