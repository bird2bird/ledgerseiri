# Step 30A Patch Review Guide

This is a SAFE review artifact.  
No live schema mutation has been applied in Step 30A.

## Files produced
- schema.prisma (unchanged)
- step30-domain-extension.proposal.prisma
- docs/30-data-domain-design.md
- docs/05-database-schema.step30-proposal.md
- docs/06-api-contract.step30-proposal.md

## Review checklist
1. Confirm Company remains tenant root
2. Confirm Store remains channel dimension
3. Confirm Transaction stays unified ledger
4. Confirm new models do not conflict with current model names
5. Confirm enum names do not conflict
6. Confirm Transaction upgrade fields fit current API strategy
7. Confirm ImportJob / ExportJob are acceptable async abstractions

## Step 30B recommendation
In Step 30B:
- inspect current schema
- merge proposed enums/models into live schema carefully
- add missing back-relations to Company / Store / Transaction if needed
- run prisma format
- run prisma validate
- only then build api
