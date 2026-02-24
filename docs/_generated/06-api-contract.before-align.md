# API Contract (Skeleton)

Generated at: 2026-02-23T20:45:50+08:00  
Source: `docs/_generated/api-methods.md`

> 目的：把“接口口径”固定下来，后续分模块开发只要对齐这里，就不会丢上下文/产生冲突。  
> 本文件是 **Contract Stub**：你只需要补齐 Request/Response/Error/Notes。

## Global Conventions (Fill & enforce)
- Base URL: (e.g. https://ledgerseiri.com)
- Auth: Session cookie (credentials include)
- CSRF:
  - Issue endpoint: /auth/csrf
  - Header name: (TBD)
- Error model (recommended):
  ```json
  { "code": "STRING", "message": "STRING", "details": {} }
  ```
- Pagination (recommended):
  ```json
  { "items": [], "page": 1, "pageSize": 50, "total": 0 }
  ```

---

## Module: Health

### GET /health
**Owner module**: Health  
**Source**: `apps/api/src/health.controller.ts`  

**Auth**
- Required: (TBD: yes/no)
- Roles/permissions: (TBD)

**Request**
- Params: (TBD)
- Query: (TBD)
- Body: (TBD)

**Response**
- 200: (TBD)
- Example:
```json
{}
```

**Errors**
- 400:
- 401:
- 403:
- 404:
- 409:
- 429:
- 500:

**Notes / TODO**
- [ ] Define exact schema + validation rules
- [ ] Define idempotency / rate limit needs (if any)

---

## Module: Auth

### POST /register
**Owner module**: Auth  
**Source**: `apps/api/src/auth/auth.controller.ts`  

**Auth**
- Required: (TBD: yes/no)
- Roles/permissions: (TBD)

**Request**
- Params: (TBD)
- Query: (TBD)
- Body: (TBD)

**Response**
- 200: (TBD)
- Example:
```json
{}
```

**Errors**
- 400:
- 401:
- 403:
- 404:
- 409:
- 429:
- 500:

**Notes / TODO**
- [ ] Define exact schema + validation rules
- [ ] Define idempotency / rate limit needs (if any)

---

### POST /login
**Owner module**: Auth  
**Source**: `apps/api/src/auth/auth.controller.ts`  

**Auth**
- Required: (TBD: yes/no)
- Roles/permissions: (TBD)

**Request**
- Params: (TBD)
- Query: (TBD)
- Body: (TBD)

**Response**
- 200: (TBD)
- Example:
```json
{}
```

**Errors**
- 400:
- 401:
- 403:
- 404:
- 409:
- 429:
- 500:

**Notes / TODO**
- [ ] Define exact schema + validation rules
- [ ] Define idempotency / rate limit needs (if any)

---

### GET /me
**Owner module**: Auth  
**Source**: `apps/api/src/auth/auth.controller.ts`  

**Auth**
- Required: (TBD: yes/no)
- Roles/permissions: (TBD)

**Request**
- Params: (TBD)
- Query: (TBD)
- Body: (TBD)

**Response**
- 200: (TBD)
- Example:
```json
{}
```

**Errors**
- 400:
- 401:
- 403:
- 404:
- 409:
- 429:
- 500:

**Notes / TODO**
- [ ] Define exact schema + validation rules
- [ ] Define idempotency / rate limit needs (if any)

---

### POST /forgot-password
**Owner module**: Auth  
**Source**: `apps/api/src/auth/password-reset.controller.ts`  

**Auth**
- Required: (TBD: yes/no)
- Roles/permissions: (TBD)

**Request**
- Params: (TBD)
- Query: (TBD)
- Body: (TBD)

**Response**
- 200: (TBD)
- Example:
```json
{}
```

**Errors**
- 400:
- 401:
- 403:
- 404:
- 409:
- 429:
- 500:

**Notes / TODO**
- [ ] Define exact schema + validation rules
- [ ] Define idempotency / rate limit needs (if any)

---

### POST /reset-password
**Owner module**: Auth  
**Source**: `apps/api/src/auth/password-reset.controller.ts`  

**Auth**
- Required: (TBD: yes/no)
- Roles/permissions: (TBD)

**Request**
- Params: (TBD)
- Query: (TBD)
- Body: (TBD)

**Response**
- 200: (TBD)
- Example:
```json
{}
```

**Errors**
- 400:
- 401:
- 403:
- 404:
- 409:
- 429:
- 500:

**Notes / TODO**
- [ ] Define exact schema + validation rules
- [ ] Define idempotency / rate limit needs (if any)

---

### POST /refresh
**Owner module**: Auth  
**Source**: `apps/api/src/auth/refresh.controller.ts`  

**Auth**
- Required: (TBD: yes/no)
- Roles/permissions: (TBD)

**Request**
- Params: (TBD)
- Query: (TBD)
- Body: (TBD)

**Response**
- 200: (TBD)
- Example:
```json
{}
```

**Errors**
- 400:
- 401:
- 403:
- 404:
- 409:
- 429:
- 500:

**Notes / TODO**
- [ ] Define exact schema + validation rules
- [ ] Define idempotency / rate limit needs (if any)

---

### POST /logout
**Owner module**: Auth  
**Source**: `apps/api/src/auth/refresh.controller.ts`  

**Auth**
- Required: (TBD: yes/no)
- Roles/permissions: (TBD)

**Request**
- Params: (TBD)
- Query: (TBD)
- Body: (TBD)

**Response**
- 200: (TBD)
- Example:
```json
{}
```

**Errors**
- 400:
- 401:
- 403:
- 404:
- 409:
- 429:
- 500:

**Notes / TODO**
- [ ] Define exact schema + validation rules
- [ ] Define idempotency / rate limit needs (if any)

---

## Module: Security

### GET /csrf
**Owner module**: Security  
**Source**: `apps/api/src/security/session.controller.ts`  

**Auth**
- Required: (TBD: yes/no)
- Roles/permissions: (TBD)

**Request**
- Params: (TBD)
- Query: (TBD)
- Body: (TBD)

**Response**
- 200: (TBD)
- Example:
```json
{}
```

**Errors**
- 400:
- 401:
- 403:
- 404:
- 409:
- 429:
- 500:

**Notes / TODO**
- [ ] Define exact schema + validation rules
- [ ] Define idempotency / rate limit needs (if any)

---

### GET /session-me
**Owner module**: Security  
**Source**: `apps/api/src/security/session.controller.ts`  

**Auth**
- Required: (TBD: yes/no)
- Roles/permissions: (TBD)

**Request**
- Params: (TBD)
- Query: (TBD)
- Body: (TBD)

**Response**
- 200: (TBD)
- Example:
```json
{}
```

**Errors**
- 400:
- 401:
- 403:
- 404:
- 409:
- 429:
- 500:

**Notes / TODO**
- [ ] Define exact schema + validation rules
- [ ] Define idempotency / rate limit needs (if any)

---

### POST /session-logout
**Owner module**: Security  
**Source**: `apps/api/src/security/session.controller.ts`  

**Auth**
- Required: (TBD: yes/no)
- Roles/permissions: (TBD)

**Request**
- Params: (TBD)
- Query: (TBD)
- Body: (TBD)

**Response**
- 200: (TBD)
- Example:
```json
{}
```

**Errors**
- 400:
- 401:
- 403:
- 404:
- 409:
- 429:
- 500:

**Notes / TODO**
- [ ] Define exact schema + validation rules
- [ ] Define idempotency / rate limit needs (if any)

---

## Module: Company

### POST /company
**Owner module**: Company  
**Source**: `apps/api/src/company/company.controller.ts`  

**Auth**
- Required: (TBD: yes/no)
- Roles/permissions: (TBD)

**Request**
- Params: (TBD)
- Query: (TBD)
- Body: (TBD)

**Response**
- 200: (TBD)
- Example:
```json
{}
```

**Errors**
- 400:
- 401:
- 403:
- 404:
- 409:
- 429:
- 500:

**Notes / TODO**
- [ ] Define exact schema + validation rules
- [ ] Define idempotency / rate limit needs (if any)

---

### GET /company
**Owner module**: Company  
**Source**: `apps/api/src/company/company.controller.ts`  

**Auth**
- Required: (TBD: yes/no)
- Roles/permissions: (TBD)

**Request**
- Params: (TBD)
- Query: (TBD)
- Body: (TBD)

**Response**
- 200: (TBD)
- Example:
```json
{}
```

**Errors**
- 400:
- 401:
- 403:
- 404:
- 409:
- 429:
- 500:

**Notes / TODO**
- [ ] Define exact schema + validation rules
- [ ] Define idempotency / rate limit needs (if any)

---

## Module: Store

### GET /store
**Owner module**: Store  
**Source**: `apps/api/src/store/store.controller.ts`  

**Auth**
- Required: (TBD: yes/no)
- Roles/permissions: (TBD)

**Request**
- Params: (TBD)
- Query: (TBD)
- Body: (TBD)

**Response**
- 200: (TBD)
- Example:
```json
{}
```

**Errors**
- 400:
- 401:
- 403:
- 404:
- 409:
- 429:
- 500:

**Notes / TODO**
- [ ] Define exact schema + validation rules
- [ ] Define idempotency / rate limit needs (if any)

---

### POST /store
**Owner module**: Store  
**Source**: `apps/api/src/store/store.controller.ts`  

**Auth**
- Required: (TBD: yes/no)
- Roles/permissions: (TBD)

**Request**
- Params: (TBD)
- Query: (TBD)
- Body: (TBD)

**Response**
- 200: (TBD)
- Example:
```json
{}
```

**Errors**
- 400:
- 401:
- 403:
- 404:
- 409:
- 429:
- 500:

**Notes / TODO**
- [ ] Define exact schema + validation rules
- [ ] Define idempotency / rate limit needs (if any)

---

## Module: Transaction

### POST /transaction
**Owner module**: Transaction  
**Source**: `apps/api/src/transaction/transaction.controller.ts`  

**Auth**
- Required: (TBD: yes/no)
- Roles/permissions: (TBD)

**Request**
- Params: (TBD)
- Query: (TBD)
- Body: (TBD)

**Response**
- 200: (TBD)
- Example:
```json
{}
```

**Errors**
- 400:
- 401:
- 403:
- 404:
- 409:
- 429:
- 500:

**Notes / TODO**
- [ ] Define exact schema + validation rules
- [ ] Define idempotency / rate limit needs (if any)

---

### GET /transaction
**Owner module**: Transaction  
**Source**: `apps/api/src/transaction/transaction.controller.ts`  

**Auth**
- Required: (TBD: yes/no)
- Roles/permissions: (TBD)

**Request**
- Params: (TBD)
- Query: (TBD)
- Body: (TBD)

**Response**
- 200: (TBD)
- Example:
```json
{}
```

**Errors**
- 400:
- 401:
- 403:
- 404:
- 409:
- 429:
- 500:

**Notes / TODO**
- [ ] Define exact schema + validation rules
- [ ] Define idempotency / rate limit needs (if any)

---

### DELETE /transaction/:id
**Owner module**: Transaction  
**Source**: `apps/api/src/transaction/transaction.controller.ts`  

**Auth**
- Required: (TBD: yes/no)
- Roles/permissions: (TBD)

**Request**
- Params: (TBD)
- Query: (TBD)
- Body: (TBD)

**Response**
- 200: (TBD)
- Example:
```json
{}
```

**Errors**
- 400:
- 401:
- 403:
- 404:
- 409:
- 429:
- 500:

**Notes / TODO**
- [ ] Define exact schema + validation rules
- [ ] Define idempotency / rate limit needs (if any)

---

### POST /transaction/bulk
**Owner module**: Transaction  
**Source**: `apps/api/src/transaction/transaction.controller.ts`  

**Auth**
- Required: (TBD: yes/no)
- Roles/permissions: (TBD)

**Request**
- Params: (TBD)
- Query: (TBD)
- Body: (TBD)

**Response**
- 200: (TBD)
- Example:
```json
{}
```

**Errors**
- 400:
- 401:
- 403:
- 404:
- 409:
- 429:
- 500:

**Notes / TODO**
- [ ] Define exact schema + validation rules
- [ ] Define idempotency / rate limit needs (if any)

---

## Module: Dashboard

### GET /dashboard
**Owner module**: Dashboard  
**Source**: `apps/api/src/dashboard/dashboard.controller.ts`  

**Auth**
- Required: (TBD: yes/no)
- Roles/permissions: (TBD)

**Request**
- Params: (TBD)
- Query: (TBD)
- Body: (TBD)

**Response**
- 200: (TBD)
- Example:
```json
{}
```

**Errors**
- 400:
- 401:
- 403:
- 404:
- 409:
- 429:
- 500:

**Notes / TODO**
- [ ] Define exact schema + validation rules
- [ ] Define idempotency / rate limit needs (if any)

---

## Module: Other

###  /
**Owner module**: Other  
**Source**: `32`  

**Auth**
- Required: (TBD: yes/no)
- Roles/permissions: (TBD)

**Request**
- Params: (TBD)
- Query: (TBD)
- Body: (TBD)

**Response**
- 200: (TBD)
- Example:
```json
{}
```

**Errors**
- 400:
- 401:
- 403:
- 404:
- 409:
- 429:
- 500:

**Notes / TODO**
- [ ] Define exact schema + validation rules
- [ ] Define idempotency / rate limit needs (if any)

---

End.
