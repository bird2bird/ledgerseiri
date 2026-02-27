# LedgerSeiri Project Context

## Product Vision
LedgerSeiri is a cross-border e-commerce bookkeeping SaaS focused on Amazon Japan sellers.

Target users:
- Individual sellers
- Small 1–5 person teams

Core principles:
- Multi-tenant strict isolation
- Contract-driven development
- Error normalization
- Financial correctness first

## Tech Stack
Backend: NestJS + Prisma + PostgreSQL
Frontend: Next.js
Auth: JWT access + refresh rotation
Deployment: Docker + Nginx

## Current Phase
MVP stabilization phase.

Focus:
- Data correctness
- Security hardening
- Interface stability

Do NOT:
- Add AI features yet
- Over-optimize UI
- Break API contract
