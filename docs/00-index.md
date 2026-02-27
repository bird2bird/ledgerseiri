# LedgerSeiri Documentation Index

Doc Version: v1.0
Last Updated: 2026-02-27
Owner: System Architect

---

# 1. Purpose

This document is the entry point for all development roles.

All new development windows MUST load this file first.

This project follows:

- Documentation-first policy
- Code-reflective documentation
- Multi-tenant strict isolation
- MVP stabilization strategy

---

# 2. Current System Phase

Phase: MVP Stabilization

Focus:

- Financial correctness
- Security boundary enforcement
- API contract stability
- Refresh rotation correctness

Not in scope:

- AI automation
- Advanced RBAC
- Microservices
- Performance scaling

---

# 3. Source of Truth Hierarchy

If conflict occurs:

1. Actual backend code behavior
2. docs/06-api-contract.md
3. docs/04-auth-session-design.md
4. docs/01-architecture.md
5. Other docs

Documentation must reflect code reality.

---

# 4. Core Documentation Map

## Architecture Layer

- 01-architecture.md  
- 16-security-model.md  

## Authentication Layer

- 04-auth-session-design.md  

## Data Layer

- 05-database-schema.md  

## API Layer

- 06-api-contract.md  

## Feature Layer

- 07-dashboard-design.md  

## Roadmap

- 08-future-roadmap.md  

## ADR

- ADR/*  

---

# 5. Role-Based Required Reading

## System Architect

Must read:

- 01-architecture.md
- 04-auth-session-design.md
- 05-database-schema.md
- 06-api-contract.md
- 16-security-model.md

---

## Backend Lead

Must read:

- 02-backend-modules.md
- 04-auth-session-design.md
- 05-database-schema.md
- 06-api-contract.md
- 16-security-model.md

---

## Frontend Lead

Must read:

- 03-frontend-modules.md
- 06-api-contract.md
- 07-dashboard-design.md
- 04-auth-session-design.md

---

## QA / Security

Must read:

- 04-auth-session-design.md
- 06-api-contract.md
- 16-security-model.md

---

# 6. Contract Stability Rule

Any change to:

- API response shape
- Cookie name
- Path structure
- Error structure
- Financial calculation rule

MUST update docs/06-api-contract.md in the same PR.

---

# 7. Documentation Update Rule

When implementation behavior changes:

- Update relevant document first
- Then implement code change
- Then commit together

No silent behavioral changes allowed.

---

# 8. Non-Negotiable Constraints

- No cross-tenant access
- No financial computation in frontend
- Refresh token must rotate
- Ownership validation must be enforced in every controller
- Code must match documentation

---

End of Index
