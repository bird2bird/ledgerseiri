# API Contract (Aligned to Current Implementation)

Doc Version: v1.1
Last Updated: 2026-02-27
Owner: System Architect
Status: Reflects Actual Backend Behavior

---

# 1. Source of Truth

Controllers and services:

- apps/api/src/auth/auth.controller.ts
- apps/api/src/auth/auth.service.ts
- apps/api/src/auth/refresh.controller.ts
- apps/api/src/auth/refresh.service.ts
- apps/api/src/security/session.controller.ts
- apps/api/src/security/csrf.ts
- apps/api/src/security/origin.ts
- apps/api/src/company/company.controller.ts
- apps/api/src/store/store.controller.ts
- apps/api/src/transaction/transaction.controller.ts
- apps/api/src/dashboard/dashboard.controller.ts
- apps/api/prisma/schema.prisma

This document reflects current code behavior, not desired architecture.

---

# 2. Global Conventions

## 2.1 Access Token (JWT)

Returned as:

{
  "accessToken": "string"
}

Client must send:

Authorization: Bearer <accessToken>

Properties:

- Secret: JWT_SECRET
- Expiration: JWT_ACCESS_EXPIRES_MINUTES (default 60)
- Stateless (not stored in DB)

---

## 2.2 Refresh Token (Cookie + Rotation)

Cookie:

Name: __Host-lsrt  
HttpOnly: true  
SameSite: lax  
Path: /  
Secure: only when HTTPS  
Max-Age: JWT_REFRESH_EXPIRES_DAYS (default 14 days)

Signed with: JWT_REFRESH_SECRET

Rotation:

- Old session: revokedAt set
- replacedByJti set
- New session row inserted
- New refresh cookie issued

Reuse detection:

If revoked token reused:

→ revokeUserAll(userId)  
→ 401 REFRESH_REUSE_DETECTED

---

## 2.3 Error Style (Current Reality)

There is NO unified error model.

Three patterns exist:

1) Direct return object:

{ "error": "message" }

2) Boolean style:

{ "ok": false, "message": "message" }

3) NestJS exception:

{
  "statusCode": number,
  "message": string,
  "error": string
}

Frontend must normalize.

---

# 3. Auth Module

## 3.1 POST /auth/register

Auth: No

Request:

{
  "email": "string",
  "password": "string"
}

Success:
200 OK  
Returns result of AuthService.register()

Errors (400):
- "email and password required"
- "email already registered"

---

## 3.2 POST /auth/login

Auth: No

Request:

{
  "email" OR "username" OR "userName": "string",
  "password": "string"
}

Success:

Status: 201  
Sets cookie: __Host-lsrt  
Body:

{
  "accessToken": "string"
}

Errors:

400:
- "EMAIL_REQUIRED"

401:
- "invalid credentials"

---

## 3.3 GET /auth/me

Auth: Yes (JwtAuthGuard)

Header:
Authorization: Bearer

Success:
200 OK  
Returns user object from AuthService.me()

Error:
401 (Nest UnauthorizedException)

---

# 4. Session Utilities

## 4.1 GET /auth/session-me

Auth: Access token manually verified

Success:

{
  "ok": true,
  "userId": "string"
}

Error:

401:
{
  "message": "UNAUTHORIZED"
}

---

## 4.2 POST /auth/session-logout

Destroys express session  
Clears cookie: lsid

Response:

{
  "ok": true
}

---

# 5. CSRF

## 5.1 GET /auth/csrf

Response:

{
  "csrfToken": "string"
}

Token verification reads from:

Header: x-csrf-token  
OR body: csrfToken

Note:

Business endpoints (company/store/transaction/dashboard)
DO NOT explicitly verify CSRF.

---

# 6. Refresh

## 6.1 POST /auth/refresh

Requires:

- Refresh cookie (__Host-lsrt)
- Origin validation

Success:

200 OK  
Sets new refresh cookie  
Body:

{
  "accessToken": "string"
}

Errors (401):

- BAD_ORIGIN
- NO_REFRESH
- REFRESH_INVALID
- REFRESH_NOT_FOUND
- REFRESH_EXPIRED
- REFRESH_REUSE_DETECTED

---

## 6.2 POST /auth/logout

Clears refresh cookie.

Response:

{
  "ok": true
}

Access token remains valid until expiry.

---

# 7. Company Module

## 7.1 POST /company

Auth: Yes

Request:

{
  "name"?: string,
  "fiscalMonthStart"?: number,
  "timezone"?: string,
  "currency"?: string
}

Defaults:

name: "My Company"  
fiscalMonthStart: 1  
timezone: "Asia/Tokyo"  
currency: "JPY"

Success:
Returns Prisma Company object

Also updates user.companyId.

---

## 7.2 GET /company

Auth: Yes

If no company:

{
  "company": null,
  "stores": []
}

Else:

{
  "company": {...},
  "stores": [...]
}

---

# 8. Store Module

## 8.1 GET /store

Auth: Yes

If no company:

{
  "stores": []
}

Else:

{
  "stores": [...]
}

---

## 8.2 POST /store

Auth: Yes

Request:

{
  "name"?: string,
  "platform"?: string,
  "region"?: string
}

Defaults:

name: "Amazon JP Store"  
platform: "AMAZON"  
region: "JP"

If no company:

{
  "error": "No company yet. Create company first."
}

Success:
Returns Prisma Store object.

---

# 9. Transaction Module

## 9.1 POST /transaction

Auth: Yes

Request:

{
  "storeId": "string",
  "type": "SALE | FBA_FEE | AD | REFUND | OTHER",
  "amount": number,
  "occurredAt": ISO string,
  "memo"?: string
}

Rules:

SALE → positive  
FBA_FEE / AD / REFUND → negative  
OTHER → numeric as-is  

Invalid occurredAt:

Throws unhandled error → 500

Errors:

{ "error": "storeId is required" }
{ "error": "Store not found or not owned" }

Success:
Returns created Prisma Transaction.

---

## 9.2 GET /transaction

Query:

?storeId=xxx&month=YYYY-MM

Errors:

{ "error": "storeId is required" }
{ "error": "month is required, e.g. 2026-02" }
{ "error": "Store not found or not owned" }

Success:

{
  "items": [...]
}

Sorted by occurredAt desc  
Limit: 500

---

## 9.3 DELETE /transaction/:id

If transaction not found:

{
  "ok": true
}

If not owned:

{
  "error": "Store not found or not owned"
}

Else:

{
  "ok": true
}

---

## 9.4 POST /transaction/bulk

Request:

{
  "storeId": "string",
  "items": [ ... ]
}

Constraints:

1 ≤ items ≤ 5000

Errors:

{ "ok": false, "message": "storeId is required" }
{ "ok": false, "message": "Store not found or not owned" }
{ "ok": false, "message": "items is empty" }
{ "ok": false, "message": "items too large (max 5000)" }

Success:

{
  "ok": true,
  "created": number
}

---

# 10. Dashboard Module

## 10.1 GET /dashboard

Query:

?storeId=xxx&month=YYYY-MM

Errors same as GET /transaction

Success:

{
  "storeId": "string",
  "month": "YYYY-MM",
  "sales": number,
  "fbaFees": number,
  "ads": number,
  "refunds": number,
  "other": number,
  "profit": number,
  "monthNet": number,
  "count": number
}

Calculation:

Group by type → SUM(amount)  
monthNet = SUM(amount)  
profit = monthNet  

---

# 11. Contract Stability Policy

From this version forward:

Any of the following changes MUST update this file:

- Path change
- Request body change
- Response shape change
- Cookie name change
- Error behavior change
- HTTP status code change

Code and contract must remain aligned.
