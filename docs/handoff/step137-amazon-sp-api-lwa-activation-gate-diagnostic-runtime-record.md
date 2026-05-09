# LedgerSeiri Handoff — Step137 Amazon SP-API LWA Activation Gate Diagnostic Runtime Record

## Current confirmed baseline

- Latest confirmed main commit after Step137-F: `2921177`
- Step137-F completed: Amazon SP-API real LWA activation gate diagnostic endpoint runtime smoke.
- This record closes the diagnostic endpoint runtime verification slice before the next guarded activation design step.

## Product / system context

LedgerSeiri is a SaaS accounting and operations system for Japanese SMB / e-commerce sellers.

Stable technical baseline:

- Frontend: Next.js / React
- Backend: NestJS
- ORM / DB: Prisma + PostgreSQL
- Deployment: Docker Compose
- Multi-tenant isolation: shared DB/schema with `companyId` row-level isolation
- API controller base route: `/api/imports`
- Import Center route: `/ja/app/data/import`

## Completed Step137 milestone chain so far

### Step137-A — Amazon SP-API real LWA activation feature-gate contract

Commit:

```text
cf9d3b5

Purpose:

Define real LWA activation gate contract.
Contract-only.
No activation gate runtime service implementation in this step.
No callback wiring.
No real HTTP.
No token persistence.

Important files:

apps/api/src/imports/dto/amazon-sp-api-real-lwa-activation-feature-gate-contract.dto.ts
apps/api/scripts/smoke-amazon-sp-api-real-lwa-activation-feature-gate-contract.js
apps/api/package.json

Important smoke:

cd /opt/ledgerseiri/apps/api
npm run smoke:amazon-sp-api-real-lwa-activation-feature-gate-contract
Step137-B — Amazon SP-API real LWA activation feature-gate service skeleton

Commit:

eb8c982

Purpose:

Add AmazonSpApiRealLwaActivationGateService.
Add evaluateRealLwaActivationLater().
Register service in ImportsModule.
Keep the activation gate blocking and sanitized.

Important files:

apps/api/src/imports/amazon-sp-api-real-lwa-activation-gate.service.ts
apps/api/src/imports/imports.module.ts
apps/api/scripts/smoke-amazon-sp-api-real-lwa-activation-gate-service-skeleton.js
apps/api/package.json

Important smoke:

cd /opt/ledgerseiri/apps/api
npm run smoke:amazon-sp-api-real-lwa-activation-gate-service

Important boundary:

realHttpAllowedNow: false
realHttpEnabledNow: false
tokenExchangeHttpCallNow: false
lwaHttpCallNow: false
tokenPersistenceDatabaseWriteNow: false
rawAuthorizationCodeReturnedNow: false
rawClientSecretReturnedNow: false
rawAccessTokenReturnedNow: false
rawRefreshTokenReturnedNow: false
Step137-C — Amazon SP-API real LWA activation gate mock runtime smoke

Commit:

5fb41ce

Purpose:

Add runtime smoke for the activation gate service.
Verify all block reasons.
Verify all conditions true still returns activation_gate_skeleton / blocked.
No controller wiring.

Important files:

apps/api/scripts/smoke-amazon-sp-api-real-lwa-activation-gate-mock-runtime.js
apps/api/package.json

Important smoke:

cd /opt/ledgerseiri/apps/api
npm run smoke:amazon-sp-api-real-lwa-activation-gate-mock-runtime

Validated cases:

config_not_ready
client_id_missing
client_secret_missing
token_endpoint_not_https
callback_state_not_trusted
company_id_not_resolved
store_id_not_resolved
server_side_runtime_gate_disabled
environment_not_allowed
company_store_not_allowlisted
operator_confirmation_missing
activation_gate_skeleton
Step137-D — Amazon SP-API LWA activation gate diagnostic endpoint contract

Commit:

a9b5371

Purpose:

Define internal diagnostic endpoint contract.
Contract-only.
No controller implementation in this step.

Planned route:

GET /api/imports/internal/amazon-sp-api/lwa-activation-gate/status

Important files:

apps/api/src/imports/dto/amazon-sp-api-lwa-activation-gate-diagnostic-endpoint-contract.dto.ts
apps/api/scripts/smoke-amazon-sp-api-lwa-activation-gate-diagnostic-endpoint-contract.js
apps/api/package.json

Important smoke:

cd /opt/ledgerseiri/apps/api
npm run smoke:amazon-sp-api-lwa-activation-gate-diagnostic-endpoint-contract

Important warning:

This smoke is contract-only. It asserts the endpoint is not implemented yet. After Step137-E, do not use it as a post-E regression gate.

Step137-E — Amazon SP-API LWA activation gate diagnostic endpoint implementation

Commit:

a18c9a2

Purpose:

Inject AmazonSpApiRealLwaActivationGateService into ImportsController.
Add internal read-only diagnostic endpoint.
Evaluate sanitized config + gate status.
Keep real LWA activation blocked.

Implemented route:

GET /api/imports/internal/amazon-sp-api/lwa-activation-gate/status

Query:

storeId        required
marketplaceId  optional, default A1VC38T7YXB528
region         optional, default JP

Important files:

apps/api/src/imports/imports.controller.ts
apps/api/scripts/smoke-amazon-sp-api-lwa-activation-gate-diagnostic-endpoint-implementation.js
apps/api/package.json

Important smoke:

cd /opt/ledgerseiri/apps/api
npm run smoke:amazon-sp-api-lwa-activation-gate-diagnostic-endpoint

Implemented response safety markers:

source = amazon-sp-api-lwa-activation-gate-diagnostic
endpointImplementedNow = true
guardedBy = JwtAuthGuard
companyScoped = true
frontendExposedNow = false
callbackRuntimeChangedNow = false
oauthCallbackRouteChangedNow = false
realHttpAllowedNow = false
realHttpEnabledNow = false
tokenExchangeHttpCallNow = false
lwaHttpCallNow = false
realSpApiRequestNow = false
tokenPersistenceDatabaseWriteNow = false
reportsApiCallNow = false
importJobWriteNow = false
importStagingRowWriteNow = false
transactionWriteNow = false
inventoryWriteNow = false
rawSecretReturnedNow = false
rawAuthorizationCodeReturnedNow = false
rawClientIdReturnedNow = false
rawClientSecretReturnedNow = false
rawRequestBodyReturnedNow = false
rawLwaResponseReturnedNow = false
rawAccessTokenReturnedNow = false
rawRefreshTokenReturnedNow = false
Step137-F — Amazon SP-API LWA activation gate diagnostic endpoint runtime smoke

Commit:

2921177

Purpose:

Add runtime smoke for the diagnostic endpoint.
Verify endpoint is guarded and non-public.
Verify unauthenticated/invalid token probes return 401/403.
Verify runtime smoke itself does not call real LWA, Reports API, or DB.

Important files:

apps/api/scripts/smoke-amazon-sp-api-lwa-activation-gate-diagnostic-endpoint-runtime.js
apps/api/package.json

Important smoke:

cd /opt/ledgerseiri/apps/api
API_BASE=http://localhost:3001 npm run smoke:amazon-sp-api-lwa-activation-gate-diagnostic-endpoint-runtime

Runtime smoke result:

Step137-F runtime smoke passed:
endpoint is guarded and non-public

Manual authenticated browser check printed by the runtime smoke:

http://localhost:3001/api/imports/internal/amazon-sp-api/lwa-activation-gate/status?storeId=step137-f-store&marketplaceId=A1VC38T7YXB528&region=JP

Expected authenticated sanitized response markers:

source = amazon-sp-api-lwa-activation-gate-diagnostic
endpointImplementedNow = true
guardedBy = JwtAuthGuard
frontendExposedNow = false
realHttpAllowedNow = false
realHttpEnabledNow = false
tokenExchangeHttpCallNow = false
tokenPersistenceDatabaseWriteNow = false
no raw clientSecret/accessToken/refreshToken/authorizationCode/request/response body
Current runtime state after Step137-F
OAuth callback route

Current route:

GET /api/imports/amazon-sp-api/oauth/callback

Current behavior:

Still uses exchangeAuthorizationCodeDryRunnable()
Does not call AmazonSpApiRealLwaActivationGateService.evaluateRealLwaActivationLater()
Does not call orchestrateRealLwaExchangeChainDisabledLater()
Does not call executeRealLwaTokenExchangeHttpLater()
Does not call buildRealLwaTokenExchangeRequestBodyLater()
Does not call exchangeAuthorizationCodeWithLwaLater()
Diagnostic endpoint

Current route:

GET /api/imports/internal/amazon-sp-api/lwa-activation-gate/status

Current behavior:

Guarded by JwtAuthGuard
Requires authenticated user with companyId
Requires storeId query
Returns only sanitized configStatus and gateStatus
Returns realHttpAllowedNow=false
Returns realHttpEnabledNow=false
Returns tokenPersistenceDatabaseWriteNow=false
Returns frontendExposedNow=false
Does not call OAuth callback
Does not call real LWA HTTP
Does not call Reports API
Does not create ImportJob / ImportStagingRow / Transaction / Inventory
Valid regression smoke set after Step137-F

Recommended core smoke set:

cd /opt/ledgerseiri/apps/api

npm run smoke:amazon-sp-api-lwa-activation-gate-diagnostic-endpoint-runtime
npm run smoke:amazon-sp-api-lwa-activation-gate-diagnostic-endpoint
npm run smoke:amazon-sp-api-real-lwa-activation-gate-mock-runtime
npm run smoke:amazon-sp-api-real-lwa-activation-feature-gate-contract

npm run smoke:amazon-sp-api-real-lwa-exchange-chain-mock-runtime
npm run smoke:amazon-sp-api-real-lwa-exchange-chain-disabled
npm run smoke:amazon-sp-api-lwa-http-transport-mock-runtime
npm run smoke:amazon-sp-api-lwa-http-transport-disabled
npm run smoke:amazon-sp-api-lwa-request-body-builder-mock-runtime
npm run smoke:amazon-sp-api-lwa-request-body-builder-disabled
npm run smoke:amazon-sp-api-real-lwa-http-client-mock-runtime
npm run smoke:amazon-sp-api-real-lwa-http-client-disabled-by-default

npm run smoke:amazon-sp-api-lwa-config-diagnostic-endpoint-runtime
npm run smoke:amazon-sp-api-lwa-config-diagnostic-endpoint
npm run smoke:amazon-sp-api-lwa-env-config-validation-runtime
npm run smoke:amazon-sp-api-lwa-env-config-validation-service
npm run smoke:amazon-sp-api-lwa-env-config-validation-contract
npm run smoke:amazon-sp-api-oauth-token-exchange-service-skeleton
npm run smoke:amazon-sp-api-oauth-token-exchange-boundary-contract

npm run build

Do not use these as post-implementation regression gates:

npm run smoke:amazon-sp-api-lwa-request-body-builder-boundary-contract
npm run smoke:amazon-sp-api-lwa-http-execution-boundary-contract
npm run smoke:amazon-sp-api-real-lwa-exchange-chain-boundary-contract
npm run smoke:amazon-sp-api-lwa-activation-gate-diagnostic-endpoint-contract
npm run smoke:amazon-sp-api-real-lwa-activation-gate-service

Reason:

Step136-D was contract-only and asserted request body builder did not exist yet.
Step136-G was contract-only and asserted HTTP transport did not exist yet.
Step136-J was contract-only and asserted chain orchestrator did not exist yet.
Step137-D was contract-only and asserted diagnostic endpoint did not exist yet.
Step137-B skeleton smoke asserted controller did not contain AmazonSpApiRealLwaActivationGateService.
Step137-E intentionally injected the service into controller for the read-only diagnostic endpoint.

Use Step137-E implementation smoke and Step137-C runtime smoke instead of Step137-B skeleton smoke after Step137-E.

Manual browser verification procedure

After deploying or restarting the app:

cd /opt/ledgerseiri
docker compose build api web
docker compose up -d api web
docker compose ps
docker compose logs api --tail=300

Open while logged in:

http://localhost:3000/api/imports/internal/amazon-sp-api/lwa-activation-gate/status?storeId=step137-f-store&marketplaceId=A1VC38T7YXB528&region=JP

or direct API host if using backend port:

http://localhost:3001/api/imports/internal/amazon-sp-api/lwa-activation-gate/status?storeId=step137-f-store&marketplaceId=A1VC38T7YXB528&region=JP

Expected authenticated response:

{
  "source": "amazon-sp-api-lwa-activation-gate-diagnostic",
  "endpointImplementedNow": true,
  "guardedBy": "JwtAuthGuard",
  "companyScoped": true,
  "frontendExposedNow": false,
  "callbackRuntimeChangedNow": false,
  "oauthCallbackRouteChangedNow": false,
  "realHttpAllowedNow": false,
  "realHttpEnabledNow": false,
  "tokenExchangeHttpCallNow": false,
  "lwaHttpCallNow": false,
  "realSpApiRequestNow": false,
  "tokenPersistenceDatabaseWriteNow": false,
  "reportsApiCallNow": false,
  "importJobWriteNow": false,
  "importStagingRowWriteNow": false,
  "transactionWriteNow": false,
  "inventoryWriteNow": false,
  "configStatus": {
    "source": "amazon-sp-api-lwa-env-config-validation-service",
    "status": "ready | missing_required_env | invalid_env"
  },
  "gateStatus": {
    "source": "amazon-sp-api-real-lwa-activation-gate-service-skeleton",
    "gateDecision": "blocked",
    "realHttpAllowedNow": false,
    "realHttpEnabledNow": false
  }
}

Expected no raw values anywhere in response:

clientSecret
client_secret
authorizationCode
spapi_oauth_code
access_token
refresh_token
accessToken
refreshToken
rawRequestBody
rawLwaResponse

Unauthenticated request expected result:

HTTP 401 or HTTP 403

Invalid token request expected result:

HTTP 401 or HTTP 403
Guardrails before Step137-H and later real HTTP work

Do not proceed to real HTTP execution until the following have been explicitly designed in separate contract-first steps:

1. Dedicated real HTTP activation gate.
2. Environment gating stronger than a single env flag.
3. Company/store allowlist or equivalent controlled rollout boundary.
4. Callback state trust binding to companyId/storeId/marketplaceId/region.
5. Sanitized LWA HTTP response envelope.
6. Encrypted token persistence input boundary.
7. No plaintext token database write guarantee.
8. Rollback/reconnect/revoke handling.
9. Manual sandbox/prod OAuth runbook.
Recommended next roadmap
Step137-H — Amazon SP-API real LWA guarded HTTP transport activation contract

Recommended next step.

Purpose:

Define the exact conditions under which executeRealLwaTokenExchangeHttpLater() may eventually perform real HTTP.

Still contract-first:

No real HTTP in Step137-H.
No OAuth callback rewiring in Step137-H.
No token persistence in Step137-H.
No Reports API in Step137-H.
No ImportJob / Transaction / Inventory writes in Step137-H.

Suggested files:

apps/api/src/imports/dto/amazon-sp-api-real-lwa-guarded-http-transport-activation-contract.dto.ts
apps/api/scripts/smoke-amazon-sp-api-real-lwa-guarded-http-transport-activation-contract.js
apps/api/package.json

Suggested commit message:

test: define amazon sp-api real lwa guarded http activation
Later proposed sequence
Step137-H  Real LWA guarded HTTP transport activation contract
Step137-I  Real LWA guarded HTTP transport test-double implementation
Step137-J  Real LWA guarded HTTP transport mock success/failure runtime smoke
Step137-K  Sanitized LWA response envelope contract
Step137-L  Sanitized LWA response parser, still no persistence
Step137-M  Encrypted token persistence input contract
Step137-N  Encrypted token persistence implementation
Step137-O  OAuth callback prewire contract
Step137-P  OAuth callback guarded real-chain switch, disabled by default
Step137-Q  Manual OAuth sandbox/prod runbook
Step138-A  Connection status reads real persisted token state
Step138-B  Reconnect / revoke endpoint contract
Step139-A  Reports API request boundary contract
Step140-A  Amazon order report fetch dry-run
Step141-A  Amazon order report normalized import preview
Step142-A  Amazon order report ImportJob / ImportStagingRow integration
Step143-A  Amazon order report commit to Transaction
Step144-A  Inventory deduction from imported Amazon orders
How to resume in a new window

Start from:

Current latest confirmed main commit:
2921177

Current next step:
Step137-G docs-only runtime/browser verification record commit, then Step137-H guarded HTTP transport activation contract.

Before starting a new script:

cd /opt/ledgerseiri
git fetch origin --prune
git status
git log --oneline -20

Expected clean state:

Working tree clean
main contains 2921177 or later
Step137-A through Step137-F commits present

Critical reminders:

OAuth callback still uses fake dry-run exchange.
Activation gate diagnostic endpoint is read-only and internal.
Diagnostic endpoint may inject AmazonSpApiRealLwaActivationGateService, but OAuth callback must not.
Do not run Step137-D contract-only smoke after Step137-E.
Do not run Step137-B skeleton smoke after Step137-E.
Do not wire OAuth callback to activation gate until a dedicated prewire contract.
Do not enable real LWA HTTP before guarded HTTP activation contract and test-double runtime steps.
Do not persist tokens until encrypted persistence boundary is complete.
Do not call Reports API or create import/ledger/inventory data during LWA activation work.

