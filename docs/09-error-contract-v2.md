# Error Contract V2 Specification

Status: DESIGN TARGET (Not fully implemented yet)
Applies to: All API modules
Owner: System Architect

---

# 1. Purpose

This document defines the standardized API error format (V2).

Current backend implementation contains multiple inconsistent error shapes:

- `{ error: "message" }`
- `{ ok: false, message: "message" }`
- NestJS default exception format

Goal of V2:

- Single canonical error structure
- Machine-readable error codes
- Stable frontend parsing
- Future i18n support
- Traceability support

---

# 2. Canonical Error Shape (V2)

All errors SHOULD be returned in the following format:

```json
{
  "ok": false,
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable message",
    "httpStatus": 400,
    "details": {},
    "traceId": "optional-string"
  }
}

3. Field Definition
ok

Always false for error responses.

error.code

Stable machine-readable identifier.

MUST be uppercase

MUST use snake case

MUST NOT contain spaces

Example:

STORE_NOT_OWNED

REFRESH_EXPIRED

VALIDATION_ERROR

This field is used by frontend logic branching.

error.message

Human-readable message.

May equal code during MVP phase.

Future: localized message support.

error.httpStatus

Numeric HTTP status code.

Examples:

400

401

403

404

409

429

500

error.details

Optional structured payload.

Used for:

Field validation errors

Bulk import error breakdown

Limit violations

Example:

{
  "fields": [
    { "name": "email", "error": "INVALID_EMAIL" }
  ]
}
error.traceId (Future Reserved)

Optional correlation ID for:

Log tracing

Support debugging

Not required during MVP.

4. Standard Error Code Registry

This registry prevents random code creation.

4.1 Authentication

UNAUTHORIZED

TOKEN_INVALID

TOKEN_EXPIRED

EMAIL_REQUIRED

INVALID_CREDENTIALS

4.2 Refresh Token

BAD_ORIGIN

NO_REFRESH

REFRESH_INVALID

REFRESH_NOT_FOUND

REFRESH_EXPIRED

REFRESH_REUSE_DETECTED

4.3 Session / CSRF

SESSION_NOT_READY

SESSION_SAVE_FAILED

CSRF_MISSING

CSRF_INVALID

4.4 Multi-tenant / Ownership

COMPANY_REQUIRED

STORE_ID_REQUIRED

STORE_NOT_OWNED

4.5 Transaction Module

MONTH_REQUIRED

OCCURRED_AT_INVALID

AMOUNT_INVALID

4.6 Bulk Import

ITEMS_EMPTY

ITEMS_TOO_LARGE

BULK_ITEM_INVALID

4.7 Validation (Future)

VALIDATION_ERROR

5. Compatibility Mode (Current Implementation)

Until backend migration is complete,
frontend MUST normalize the following legacy formats:

Legacy A
{ "error": "message" }
Legacy B
{ "ok": false, "message": "message" }
NestJS default
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}

Frontend must map all of the above into V2 format.

6. Migration Plan

Phase 1:

Keep legacy backend responses

Normalize in frontend layer

Phase 2:

Backend gradually returns V2 shape

Mark legacy shapes as deprecated

Phase 3:

Remove legacy error shapes entirely

7. Non-Goals

This specification does NOT:

Redesign business logic

Change HTTP status codes

Introduce new authentication mechanisms

It only standardizes error structure.

8. Enforcement Rule

Any new endpoint added to the system MUST:

Use a registered error.code

Follow V2 shape

Architect approval required for new error codes.

9. Versioning

Error Contract Version: v2.0
Last Updated: 2026-02-27
Owner: System Architect
