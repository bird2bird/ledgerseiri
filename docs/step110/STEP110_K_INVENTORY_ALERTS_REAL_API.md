# Step110-K: Inventory Alerts Page Real API Wiring

## Scope

This step wires the inventory alerts page to the standard inventory stocks API.

## Page

- apps/web/src/app/[lang]/app/inventory/alerts/page.tsx

## API

- GET /api/inventory/stocks

## Alert mapping

- stockStatus = low -> warning
- stockStatus = out -> critical
- stockStatus = negative -> critical

## Guardrails

- No DB model change.
- No Amazon order deduction.
- No inventory status page change.
- No backend API change.
