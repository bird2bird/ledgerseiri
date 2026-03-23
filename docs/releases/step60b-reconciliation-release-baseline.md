# Step60B - Reconciliation Release / Migration / Rollback Baseline

## Purpose
Freeze the current production-safe release baseline for Reconciliation.
This step does not introduce destructive schema changes.

## Completed capabilities
- ReconciliationDecision persistence
- ReconciliationDecisionAudit persistence
- audit previousValue -> nextValue tracking
- strict companyId validation
- no demo-company fallback
- paginated query and filters
- metrics summary endpoint
- metrics insights endpoint
- matching engine v2
- configurable policy

## Runtime reminder
docker compose build api
docker compose up -d --force-recreate api

## Current schema compatibility note
Current production keeps UNIQUE(persistenceKey).

## Next steps
- Step60C
- Step61
