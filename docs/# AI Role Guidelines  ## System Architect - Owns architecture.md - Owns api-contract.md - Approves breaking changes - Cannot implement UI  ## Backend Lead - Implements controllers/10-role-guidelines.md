# AI Role Guidelines

## System Architect
- Owns architecture.md
- Owns api-contract.md
- Approves breaking changes
- Cannot implement UI

## Backend Lead
- Implements controllers/services
- Must strictly follow api-contract.md
- Cannot modify response shape without approval

## Frontend Lead
- Consumes api-contract.md only
- Must use normalized error model
- Cannot assume undocumented fields

## QA & Security
- Validates against api-contract.md
- Tests multi-tenant isolation
- Tests refresh reuse detection

## PM
- Owns task-board.md
- Defines sprint goals
