Doc Version: v1.4 (2026-02-27)
API Contract (Aligned to Current Implementation)

Generated manually based on current controllers.

Source of truth:

apps/api/src/auth/auth.controller.ts

apps/api/src/security/session.controller.ts

apps/api/src/auth/refresh.controller.ts

apps/api/src/auth/refresh.service.ts

apps/api/src/security/csrf.ts

apps/api/src/security/origin.ts

apps/api/src/company/company.controller.ts

apps/api/src/store/store.controller.ts

apps/api/src/transaction/transaction.controller.ts

apps/api/src/dashboard/dashboard.controller.ts

apps/api/src/auth/auth.service.ts

apps/api/prisma/schema.prisma

This document reflects actual current behavior, not desired design.

0. Global Conventions
0.1 Authentication (JWT Access Token)

Access token returned as JSON:

{ "accessToken": "string" }

Client must send:

Authorization: Bearer <accessToken>

Access token:

Signed with JWT_SECRET

Expiration: JWT_ACCESS_EXPIRES_MINUTES (default 60 minutes)

0.2 Refresh Token (Cookie Based, Rotation Enabled)

Refresh token:

Cookie name: __Host-lsrt

HttpOnly: true

SameSite: lax

Path: /

Secure: only when HTTPS

Max-Age: 14 days

Signed with JWT_REFRESH_SECRET

TTL controlled by JWT_REFRESH_EXPIRES_DAYS (default 14 days)

Rotation behavior:

Old refresh session row:

revokedAt set

replacedByJti set

New refresh session row inserted

Reuse detection:

If revoked token reused → revoke all sessions → reject

0.3 CSRF (Session Bound Only)

Endpoint:

GET /auth/csrf

Response:

{ "csrfToken": "string" }

Verification reads token from:

Header: x-csrf-token

OR body: csrfToken

Note:

Business APIs (company/store/transaction/dashboard) rely on JWT guard and do NOT explicitly verify CSRF.

0.4 Same-Origin Protection

Used in:

POST /auth/refresh

POST /auth/logout

Allowed if:

Origin header exactly matches ALLOWED_ORIGINS

OR Referer starts with ALLOWED_ORIGINS + "/"

OR both Origin and Referer absent (SSR/S2S)

Default ALLOWED_ORIGINS:

https://www.ledgerseiri.com
https://ledgerseiri.com
0.5 Error Style (Current Reality)

There is no unified error model.

Currently three patterns exist:

Return object style:

{ "error": "message" }

Boolean + message:

{ "ok": false, "message": "message" }

Nest exception:

BadRequestException

UnauthorizedException

Which returns standard Nest error JSON.

1. Auth Module
1.1 POST /auth/register

Auth: No

Request:

{
  "email": "string",
  "password": "string"
}

Response:

200 OK
Returns result of AuthService.register(...)

Possible errors:

400:

"email and password required"

"email already registered"

1.2 POST /auth/login

Auth: No

Request:

{
  "email" OR "username" OR "userName": "string",
  "password": "string"
}

Response:

Status: 201

Sets refresh cookie: __Host-lsrt

Body:

{ "accessToken": "string" }

Errors:

400:

"EMAIL_REQUIRED"

401:

"invalid credentials"

1.3 GET /auth/me

Auth: Yes (JWT Guard)

Header:

Authorization: Bearer <accessToken>

Response:

200 OK
Returns AuthService.me(userId)

401 if token invalid

2. Session Utilities
2.1 GET /auth/session-me

Auth: Bearer token manually verified

Response:

{ "ok": true, "userId": "string" }

Error:

401:

{ "message": "UNAUTHORIZED" }
2.2 POST /auth/session-logout

Destroys express session and clears lsid cookie.

Response:

{ "ok": true }
3. Refresh / Logout
3.1 POST /auth/refresh

Requires:

Refresh cookie __Host-lsrt

Origin validation

Response:

200 OK

Sets new refresh cookie.

Body:

{ "accessToken": "string" }

Errors:

401:

BAD_ORIGIN

NO_REFRESH

REFRESH_INVALID

REFRESH_NOT_FOUND

REFRESH_EXPIRED

REFRESH_REUSE_DETECTED

3.2 POST /auth/logout

Clears refresh cookie.

Response:

{ "ok": true }
4. Company Module
4.1 POST /company

Auth: Yes

Request:

{
  "name": "string?",
  "fiscalMonthStart": number?,
  "timezone": "string?",
  "currency": "string?"
}

Defaults:

name: "My Company"

fiscalMonthStart: 1

timezone: "Asia/Tokyo"

currency: "JPY"

Response:

Company object (Prisma model)

4.2 GET /company

Auth: Yes

If user has no company:

{ "company": null, "stores": [] }

Else:

{
  "company": {...},
  "stores": [...]
}
5. Store Module
5.1 GET /store

Auth: Yes

Response:

If no company:

{ "stores": [] }

Else:

{ "stores": [...] }
5.2 POST /store

Auth: Yes

Request:

{
  "name": "string?",
  "platform": "string?",
  "region": "string?"
}

Defaults:

name: "Amazon JP Store"

platform: "AMAZON"

region: "JP"

If no company:

{ "error": "No company yet. Create company first." }

Else:

Returns Store object.

6. Transaction Module
6.1 POST /transaction

Auth: Yes

Request:

{
  "storeId": "string",
  "type": "SALE | FBA_FEE | AD | REFUND | OTHER",
  "amount": number,
  "occurredAt": ISO string,
  "memo": "string?"
}

Rules:

SALE → positive

FBA_FEE / AD / REFUND → negative

OTHER → numeric as-is

Invalid occurredAt → throws → 500

Errors:

{ "error": "storeId is required" }
{ "error": "Store not found or not owned" }

Success:

Returns created Transaction.

6.2 GET /transaction

Query:

?storeId=xxx&month=YYYY-MM

Errors:

{ "error": "storeId is required" }
{ "error": "month is required, e.g. 2026-02" }
{ "error": "Store not found or not owned" }

Success:

{ "items": [...] }

Sorted by occurredAt desc.
Limit: 500.

6.3 DELETE /transaction/:id

Response:

If not found:

{ "ok": true }

If not owned:

{ "error": "Store not found or not owned" }

Else:

{ "ok": true }
6.4 POST /transaction/bulk

Request:

{
  "storeId": "string",
  "items": [ ... ]
}

Limits:

1 ≤ items ≤ 5000

Errors:

{ "ok": false, "message": "storeId is required" }
{ "ok": false, "message": "Store not found or not owned" }
{ "ok": false, "message": "items is empty" }
{ "ok": false, "message": "items too large (max 5000)" }

Success:

{ "ok": true, "created": number }
7. Dashboard Module
7.1 GET /dashboard

Query:

?storeId=xxx&month=YYYY-MM

Errors same as transaction list.

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

Computation:

Group by type → sum amount

monthNet = SUM(amount)

profit = monthNet

Contract Stability Policy

From this point forward:

Any controller return shape change

Any cookie name change

Any error shape change

Any path change

MUST update this document in same PR.
