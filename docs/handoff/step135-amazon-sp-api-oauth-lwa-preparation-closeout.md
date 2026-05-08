# LedgerSeiri Handoff — Step135 Amazon SP-API OAuth/LWA Preparation Closeout

## Current confirmed baseline

- Latest confirmed main commit after Step135-H: `867bdc1`
- Step135-H completed: Amazon SP-API LWA config diagnostic endpoint runtime smoke.
- This handoff freezes Step135-A through Step135-H before starting Step136 real LWA token exchange enablement.

## Product / system context

LedgerSeiri is a SaaS accounting and operations system for Japanese SMB / e-commerce sellers.

Stable technical baseline:

- Frontend: Next.js / React
- Backend: NestJS
- ORM / DB: Prisma + PostgreSQL
- Deployment: Docker Compose
- Multi-tenant isolation: shared DB/schema with `companyId` row-level isolation
- Import Center route: `/ja/app/data/import`
- API controller base route: `/api/imports`

## Important global guardrails

The Amazon SP-API OAuth/LWA flow is still not allowed to perform real Amazon data ingestion.

Until the next explicit implementation phase, do not do the following:

- Do not call Amazon Reports API.
- Do not call `createReport`, `getReport`, or `getReportDocument`.
- Do not create `ImportJob`.
- Do not create `ImportStagingRow`.
- Do not create or update `Transaction`.
- Do not create or update inventory / inventory movements.
- Do not expose raw `refresh_token`, `access_token`, `client_secret`, `clientId`, `clientSecret`, `authorizationCode`, `lwa_client_secret`, or `amazon_refresh_token` to frontend, DOM, API responses, logs, or smoke output.
- Do not store raw token or client secret in frontend storage.
- Do not wire `exchangeAuthorizationCodeWithLwaLater()` into the OAuth callback route until the dedicated enablement step.

Allowed safety booleans / diagnostic metadata:

- `rawClientSecretReturnedNow: false`
- `rawClientIdReturnedNow: false`
- `rawRefreshTokenReturnedNow: false`
- `rawAccessTokenReturnedNow: false`
- `rawSecretReturnedNow: false`
- `tokenExchangeHttpCallNow: false`
- `lwaHttpCallNow: false`
- `realSpApiRequestNow: false`

These are boundary flags, not raw credentials.

## Completed Step135 milestone chain

### Step135-A — OAuth callback token exchange boundary contract

Commit:

```text
a09211b

Purpose:

Define real LWA token exchange boundary contract.
Acknowledge current callback already uses fake/dry-run exchange and persistence.
Define future real LWA transport contract without implementing it.

Important files:

apps/api/src/imports/dto/amazon-sp-api-oauth-token-exchange-boundary-contract.dto.ts
apps/api/scripts/smoke-amazon-sp-api-oauth-token-exchange-boundary-contract.js
apps/api/package.json

Important smoke:

cd /opt/ledgerseiri/apps/api
npm run smoke:amazon-sp-api-oauth-token-exchange-boundary-contract

Key boundary:

currentTransport: fake-dry-run
nextTransport: real-lwa-http-client-later
tokenExchangeHttpCallNow: false
lwaHttpCallNow: false
realSpApiRequestNow: false
Step135-B — Disabled real LWA token exchange service skeleton

Commit:

3c63f5c

Purpose:

Add exchangeAuthorizationCodeWithLwaLater() skeleton to AmazonSpApiTokenExchangeService.
Keep real LWA HTTP transport disabled.
Do not wire skeleton into callback route.

Important files:

apps/api/src/imports/amazon-sp-api-token-exchange.service.ts
apps/api/scripts/smoke-amazon-sp-api-oauth-token-exchange-service-skeleton.js
apps/api/package.json

Important smoke:

cd /opt/ledgerseiri/apps/api
npm run smoke:amazon-sp-api-oauth-token-exchange-service-skeleton

Important behavior:

exchangeAuthorizationCodeDryRunnable() remains current callback path.
exchangeAuthorizationCodeWithLwaLater() exists but returns disabled result.
enableRealLwaHttpTransport: false
transportMode: real-lwa-disabled
nextImplementationStep: Step135-C
Step135-C — LWA env/config validation contract

Commit:

4a4ab04

Purpose:

Define required/optional LWA configuration boundary.
Contract-only.
No runtime process.env reads in this step.

Required env names defined:

AMAZON_SP_API_LWA_CLIENT_ID
AMAZON_SP_API_LWA_CLIENT_SECRET
AMAZON_SP_API_OAUTH_REDIRECT_URI
AMAZON_SP_API_MARKETPLACE_ID
AMAZON_SP_API_REGION

Optional env names defined:

AMAZON_SP_API_LWA_TOKEN_ENDPOINT
AMAZON_SP_API_LWA_ENVIRONMENT
AMAZON_SP_API_LWA_ENABLE_REAL_HTTP

Important files:

apps/api/src/imports/dto/amazon-sp-api-lwa-env-config-validation-contract.dto.ts
apps/api/scripts/smoke-amazon-sp-api-lwa-env-config-validation-contract.js
apps/api/package.json

Important smoke:

cd /opt/ledgerseiri/apps/api
npm run smoke:amazon-sp-api-lwa-env-config-validation-contract

Important smoke lesson:

The smoke script contains strings like process.env.AMAZON_SP_API_LWA_CLIENT_SECRET only as negative assertion markers.
They are not runtime env reads.
Step135-D — LWA env/config validation service skeleton

Commit:

52bc5f7

Purpose:

Add AmazonSpApiLwaEnvConfigValidationService.
Register service in ImportsModule.
Runtime-safe validator reads env and returns only sanitized presence/status metadata.

Important files:

apps/api/src/imports/amazon-sp-api-lwa-env-config-validation.service.ts
apps/api/src/imports/imports.module.ts
apps/api/scripts/smoke-amazon-sp-api-lwa-env-config-validation-service-skeleton.js
apps/api/package.json

Important smoke:

cd /opt/ledgerseiri/apps/api
npm run smoke:amazon-sp-api-lwa-env-config-validation-service

Service method:

AmazonSpApiLwaEnvConfigValidationService.validateFromProcessEnv()

Returned metadata is sanitized:

clientIdPresent
clientSecretPresent
redirectUriPresent
marketplaceId
region
tokenEndpointHost
environment
missingRequiredEnv
invalidEnv

The service does not return raw client secret, raw client id, access token, refresh token, or authorization code.

Step135-E — LWA env/config validation runtime smoke

Commit:

fa42d3d

Purpose:

Runtime smoke for validator behavior with mock env.
No source logic changes.

Important files:

apps/api/scripts/smoke-amazon-sp-api-lwa-env-config-validation-runtime.js
apps/api/package.json

Important smoke:

cd /opt/ledgerseiri/apps/api
npm run smoke:amazon-sp-api-lwa-env-config-validation-runtime

Validated cases:

Missing env -> missing_required_env
Invalid URL/region/environment -> invalid_env
Valid mock env -> ready
Even with AMAZON_SP_API_LWA_ENABLE_REAL_HTTP=true, result keeps realHttpEnabled=false
No raw secret/client id/token is serialized.
Step135-F — LWA config diagnostic endpoint contract

Commit:

d1d5f2a

Purpose:

Contract-only definition for internal diagnostic endpoint:
GET /api/imports/internal/amazon-sp-api/lwa-config/status

Important files:

apps/api/src/imports/dto/amazon-sp-api-lwa-config-diagnostic-endpoint-contract.dto.ts
apps/api/scripts/smoke-amazon-sp-api-lwa-config-diagnostic-endpoint-contract.js
apps/api/package.json

Important warning:

Step135-F smoke is contract-only.
It asserts the controller route is not implemented yet.
After Step135-G, do not use this smoke as a post-G regression gate because Step135-G intentionally implements the route.
Step135-G — LWA config diagnostic endpoint implementation

Commit:

ab6cabc

Purpose:

Inject AmazonSpApiLwaEnvConfigValidationService into ImportsController.
Implement internal read-only diagnostic endpoint.

Implemented route:

GET /api/imports/internal/amazon-sp-api/lwa-config/status

Controller details:

@UseGuards(JwtAuthGuard)
@Get('internal/amazon-sp-api/lwa-config/status')
amazonSpApiLwaConfigDiagnosticEndpoint(...)

Important files:

apps/api/src/imports/imports.controller.ts
apps/api/scripts/smoke-amazon-sp-api-lwa-config-diagnostic-endpoint-implementation.js
apps/api/package.json

Important smoke:

cd /opt/ledgerseiri/apps/api
npm run smoke:amazon-sp-api-lwa-config-diagnostic-endpoint

Safety behavior:

Requires authenticated user with company scope.
Returns sanitized validator result.
Adds endpoint metadata:
endpointImplementedNow: true
controllerRoute: /api/imports/internal/amazon-sp-api/lwa-config/status
guardedBy: JwtAuthGuard
companyScoped: true
frontendExposedNow: false
rawSecretReturnedNow: false
importJobWriteNow: false
transactionWriteNow: false
inventoryWriteNow: false

Important smoke lessons:

Do not scan the whole controller for clientId: because existing OAuth fake callback contains clientId: 'amzn1.application-oa2-client.step130b'.
Raw credential return checks must isolate the new diagnostic endpoint block only.
Do not run Step135-F contract-only smoke after Step135-G.
Step135-H — LWA config diagnostic endpoint runtime smoke

Commit:

867bdc1

Purpose:

Runtime smoke for newly implemented internal endpoint.
Rebuild/restart API and web.
Verify Nest runtime route mapping.
Verify unauthenticated access returns 401 via direct API and web-origin rewrite.

Important files:

apps/api/scripts/smoke-amazon-sp-api-lwa-config-diagnostic-endpoint-runtime.js
apps/api/package.json

Important smoke:

cd /opt/ledgerseiri/apps/api
API_BASE=http://localhost:3001 WEB_BASE=http://localhost:3000 npm run smoke:amazon-sp-api-lwa-config-diagnostic-endpoint-runtime

Runtime route mapping expected:

Mapped {/api/imports/internal/amazon-sp-api/lwa-config/status, GET}

Unauthenticated expected results:

http://localhost:3001/api/imports/internal/amazon-sp-api/lwa-config/status -> 401
http://localhost:3000/api/imports/internal/amazon-sp-api/lwa-config/status -> 401

This is correct because the endpoint is protected by JwtAuthGuard.

Manual authenticated browser check:

http://localhost:3000/api/imports/internal/amazon-sp-api/lwa-config/status

Expected when logged in:

HTTP 200
source = amazon-sp-api-lwa-env-config-validation-service
endpointImplementedNow = true
guardedBy = JwtAuthGuard
frontendExposedNow = false
rawSecretReturnedNow = false
no raw clientSecret/clientId/accessToken/refreshToken/authorizationCode
Current real runtime state
OAuth callback route

Current callback route:

GET /api/imports/amazon-sp-api/oauth/callback

Current behavior:

Still uses exchangeAuthorizationCodeDryRunnable()
Does not use exchangeAuthorizationCodeWithLwaLater()
Fake exchange still returns sanitized token envelope
Existing callback may persist fake encrypted credential through the already implemented persistence flow
This is intentional until the dedicated Step136 real LWA enablement sequence.

Do not wire real LWA skeleton into callback yet.

Token exchange service

Current service:

AmazonSpApiTokenExchangeService

Current methods:

exchangeAuthorizationCodeDryRunnable()
exchangeAuthorizationCodeWithLwaLater()

Current runtime callback path:

exchangeAuthorizationCodeDryRunnable()

Current disabled future path:

exchangeAuthorizationCodeWithLwaLater()

Boundary:

No real LWA HTTP
No raw token returned
No Reports API
No ledger/import/inventory writes from LWA config work
LWA config validator service

Current service:

AmazonSpApiLwaEnvConfigValidationService

Current method:

validateFromProcessEnv()

Current returned fields are sanitized status/presence metadata only.

It may read env server-side, but must not return:

clientId
clientSecret
accessToken
refreshToken
authorizationCode
lwa_client_secret
amazon_refresh_token
Internal diagnostic endpoint

Current endpoint:

GET /api/imports/internal/amazon-sp-api/lwa-config/status

Characteristics:

Internal diagnostic endpoint
Guarded by JwtAuthGuard
Company-scoped
Not exposed in frontend UI
Read-only
Sanitized
No HTTP to Amazon
No DB writes
Valid regression smoke set after Step135-H

Use these after future changes:

cd /opt/ledgerseiri/apps/api

npm run smoke:amazon-sp-api-lwa-config-diagnostic-endpoint-runtime
npm run smoke:amazon-sp-api-lwa-config-diagnostic-endpoint
npm run smoke:amazon-sp-api-lwa-env-config-validation-runtime
npm run smoke:amazon-sp-api-lwa-env-config-validation-service
npm run smoke:amazon-sp-api-lwa-env-config-validation-contract
npm run smoke:amazon-sp-api-oauth-token-exchange-service-skeleton
npm run smoke:amazon-sp-api-oauth-token-exchange-boundary-contract
npm run build

Do not use as post-implementation regression gates:

npm run smoke:amazon-sp-api-lwa-config-diagnostic-endpoint-contract

Reason:

It is a Step135-F contract-only smoke.
It asserted the route was not yet implemented.
Step135-G intentionally implemented the route.

Also remember from Step134:

npm run smoke:frontend-amazon-sp-api-connection-status-panel-read-backend-contract

should not be used after Step134-B because it was a contract-only smoke that asserted the frontend status helper did not exist yet.

Deployment / runtime verification commands

After source changes touching controller/module/service:

cd /opt/ledgerseiri

docker compose build api web
docker compose up -d api web
docker compose logs api --tail=700 | grep "Mapped {/api/imports/internal/amazon-sp-api/lwa-config/status, GET}"

Expected unauthenticated curl:

curl -i "http://localhost:3001/api/imports/internal/amazon-sp-api/lwa-config/status"
curl -i "http://localhost:3000/api/imports/internal/amazon-sp-api/lwa-config/status"

Expected:

401 Unauthorized

This means route exists, rewrite works, and auth guard is active.

Expected logged-in browser result:

HTTP 200
sanitized diagnostic JSON
Recommended next roadmap
Step136-A — Amazon SP-API real LWA token exchange enablement boundary contract

Recommended next step after this handoff.

Purpose:

Define strict boundary for enabling real LWA token exchange.
Still contract-first.
No real HTTP in Step136-A.

Step136-A should define:

Required config readiness:
validator status must be ready
clientId/clientSecret/redirectUri present
marketplace/region valid
Explicit enable flag:
real HTTP must require a dedicated server-side gate
AMAZON_SP_API_LWA_ENABLE_REAL_HTTP=true alone should not be enough unless contract says so
HTTP transport conditions:
POST to https://api.amazon.com/auth/o2/token
grant_type = authorization_code
code = selected callback authorization code
redirect_uri must match authorization URL redirect URI
Response redaction:
never log or return refresh_token/access_token/client_secret
only sanitized envelope may be returned
Persistence boundary:
encrypted refresh credential input
encrypted access token cache input
no plaintext storage
Non-goals:
no Reports API
no ImportJob
no Transaction
no Inventory movement

Suggested Step136-A files:

apps/api/src/imports/dto/amazon-sp-api-real-lwa-token-exchange-enablement-boundary-contract.dto.ts
apps/api/scripts/smoke-amazon-sp-api-real-lwa-token-exchange-enablement-boundary-contract.js
apps/api/package.json

Suggested commit message:

test: define amazon sp-api real lwa exchange boundary
Later proposed sequence
Step136-A  Real LWA token exchange enablement boundary contract
Step136-B  Real LWA token exchange HTTP client disabled-by-default implementation
Step136-C  LWA HTTP client runtime smoke with mock transport only
Step136-D  Callback route prewire contract for real exchange
Step136-E  Callback route guarded real exchange switch, still disabled by env/gate
Step136-F  Real token exchange sandbox/manual execution runbook
Step137-A  Encrypted token persistence hardening / rotation boundary
Step137-B  Connection status reads real persisted token state
Step138-A  Reconnect / revoke endpoint contract
Step138-B  Reconnect / revoke implementation
Step139-A  Reports API request boundary contract
Step140-A  Amazon order report fetch dry-run
Step141-A  Amazon order report normalized import preview
Step142-A  Amazon order report ImportJob / ImportStagingRow integration
Step143-A  Amazon order report commit to Transaction
Step144-A  Inventory deduction from imported Amazon orders
How to resume in a new window

Start from:

Current latest confirmed main commit:
867bdc1

Current next step:
Step135-I closeout handoff commit, then Step136-A real LWA token exchange enablement boundary contract

Before doing any new script:

cd /opt/ledgerseiri
git fetch origin --prune
git status
git log --oneline -10

Expected clean state before Step136:

Working tree clean
main contains 867bdc1 or later
Step135-A through Step135-H commits present

Critical reminders:

Step135-F smoke is no longer valid after Step135-G.
Step135-G/H implementation smoke and runtime smoke are now the valid diagnostic endpoint gates.
OAuth callback still uses fake dry-run exchange.
Do not wire real LWA token exchange into callback without Step136 enablement contract.
Do not call Reports API or create import/ledger/inventory data during LWA work.
