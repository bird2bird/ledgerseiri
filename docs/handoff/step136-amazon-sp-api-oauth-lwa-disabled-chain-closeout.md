# LedgerSeiri Handoff — Step136 Amazon SP-API OAuth/LWA Disabled Real-Chain Closeout

## Current confirmed baseline

- Latest confirmed main commit after Step136-L: `2f22bd9`
- Step136-L completed: Amazon SP-API real LWA exchange chain mock runtime smoke.
- This handoff freezes Step136-A through Step136-L before starting Step137 real HTTP activation / feature-gate design.

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

The Amazon SP-API OAuth/LWA real chain is still disabled.

Do not do the following until a later dedicated Step137+ enablement sequence explicitly allows it:

- Do not wire real LWA exchange into the OAuth callback route.
- Do not execute real HTTP to `https://api.amazon.com/auth/o2/token`.
- Do not use `fetch`, `axios`, `http.request`, `https.request`, `request.write`, or `.post` for LWA token exchange.
- Do not parse raw LWA response into a returned object.
- Do not return raw `access_token`, `refresh_token`, `authorizationCode`, `clientId`, `clientSecret`, raw request body, or raw response body.
- Do not log raw token, raw secret, raw authorization code, raw request body, or raw LWA response.
- Do not write token persistence from the real LWA chain.
- Do not call Amazon Reports API.
- Do not call `createReport`, `getReport`, or `getReportDocument`.
- Do not create `ImportJob`.
- Do not create `ImportStagingRow`.
- Do not create or update `Transaction`.
- Do not create or update inventory / inventory movements.
- Do not expose raw credential material to frontend, DOM, API responses, logs, smoke output, or browser storage.

Allowed safety booleans / diagnostic metadata:

- `rawAuthorizationCodeReturnedNow: false`
- `rawClientIdReturnedNow: false`
- `rawClientSecretReturnedNow: false`
- `rawRequestBodyReturnedNow: false`
- `rawLwaResponseReturnedNow: false`
- `rawAccessTokenReturnedNow: false`
- `rawRefreshTokenReturnedNow: false`
- `tokenExchangeHttpCallNow: false`
- `lwaHttpCallNow: false`
- `realSpApiRequestNow: false`
- `tokenPersistenceDatabaseWriteNow: false`

These are boundary flags, not raw credentials.

## Completed Step136 milestone chain

### Step136-A — Real LWA token exchange enablement boundary contract

Commit:

```text
5226b1f

Purpose:

Define Amazon SP-API real LWA token exchange enablement boundary.
Contract-only.
No real HTTP.
No callback wiring.
No token persistence changes.

Important files:

apps/api/src/imports/dto/amazon-sp-api-real-lwa-token-exchange-enablement-boundary-contract.dto.ts
apps/api/scripts/smoke-amazon-sp-api-real-lwa-token-exchange-enablement-boundary-contract.js
apps/api/package.json

Important smoke:

cd /opt/ledgerseiri/apps/api
npm run smoke:amazon-sp-api-real-lwa-token-exchange-enablement-boundary-contract

Key boundary:

implementsRealLwaHttpClientNow: false
callsLwaTokenEndpointNow: false
tokenPersistenceDatabaseWriteNow: false
realSpApiRequestNow: false
Step136-B — Disabled-by-default real LWA HTTP client implementation

Commit:

8edfa28

Purpose:

Add disabled real LWA HTTP client preparation path.
Preserve no real HTTP execution.
Update legacy Step135 smoke anchors to current future step markers.

Important files:

apps/api/src/imports/amazon-sp-api-token-exchange.service.ts
apps/api/scripts/smoke-amazon-sp-api-real-lwa-http-client-disabled-by-default.js
apps/api/scripts/smoke-amazon-sp-api-oauth-token-exchange-service-skeleton.js
apps/api/scripts/smoke-amazon-sp-api-lwa-env-config-validation-contract.js
apps/api/package.json

Important smoke:

cd /opt/ledgerseiri/apps/api
npm run smoke:amazon-sp-api-real-lwa-http-client-disabled-by-default

Important method / boundary:

prepareRealLwaHttpExchangeRequestDisabled()
tokenExchangeHttpCallNow: false
lwaHttpCallNow: false
tokenPersistenceDatabaseWriteNow: false
realSpApiRequestNow: false
Step136-C — Real LWA HTTP client mock runtime smoke

Commit:

8a01b15

Purpose:

Add mock runtime smoke for disabled real LWA HTTP client preparation path.
No service/controller source changes.

Important files:

apps/api/scripts/smoke-amazon-sp-api-real-lwa-http-client-mock-runtime.js
apps/api/package.json

Important smoke:

cd /opt/ledgerseiri/apps/api
npm run smoke:amazon-sp-api-real-lwa-http-client-mock-runtime

Validated mock cases:

config_validator_not_ready
missing required callback/config fields
invalid token endpoint
valid mock input still returns disabled result
no raw secret/token/request body serialized
no network / DB / Reports execution
Step136-D — LWA request body builder boundary contract

Commit:

dceae6d

Purpose:

Define request body builder boundary.
Contract-only.
No request body builder implementation in this step.

Important files:

apps/api/src/imports/dto/amazon-sp-api-lwa-request-body-builder-boundary-contract.dto.ts
apps/api/scripts/smoke-amazon-sp-api-lwa-request-body-builder-boundary-contract.js
apps/api/package.json

Important warning:

This smoke is contract-only. It asserted the request body builder did not exist yet. After Step136-E, do not use this smoke as a post-E regression gate.

Step136-E — Disabled LWA request body builder implementation

Commit:

8c9a375

Purpose:

Add disabled/sanitized request body builder implementation.
Still does not construct or return raw body.
Still does not execute HTTP.
Still does not wire callback.

Important files:

apps/api/src/imports/amazon-sp-api-token-exchange.service.ts
apps/api/scripts/smoke-amazon-sp-api-lwa-request-body-builder-disabled-implementation.js
apps/api/scripts/smoke-amazon-sp-api-oauth-token-exchange-service-skeleton.js
apps/api/scripts/smoke-amazon-sp-api-lwa-env-config-validation-contract.js
apps/api/scripts/smoke-amazon-sp-api-real-lwa-http-client-disabled-by-default.js
apps/api/scripts/smoke-amazon-sp-api-real-lwa-http-client-mock-runtime.js
apps/api/package.json

Important smoke:

cd /opt/ledgerseiri/apps/api
npm run smoke:amazon-sp-api-lwa-request-body-builder-disabled

Important method / boundary:

buildRealLwaTokenExchangeRequestBodyLater()
source: amazon-sp-api-lwa-request-body-builder-disabled
requestBodyConstructedNow: false
requestBodyLoggedNow: false
requestBodyReturnedToControllerNow: false
requestBodyReturnedToFrontendNow: false
rawRequestBodyReturnedNow: false
Step136-F — LWA request body builder mock runtime smoke

Commit:

e0961fa

Purpose:

Add mock runtime smoke for request body builder.
No service/controller source changes.

Important files:

apps/api/scripts/smoke-amazon-sp-api-lwa-request-body-builder-mock-runtime.js
apps/api/package.json

Important smoke:

cd /opt/ledgerseiri/apps/api
npm run smoke:amazon-sp-api-lwa-request-body-builder-mock-runtime

Validated mock cases:

config_validator_not_ready
missing_authorization_code
mismatched_redirect_uri
missing_client_secret_fingerprint
invalid_token_endpoint
valid mock input still returns server_side_feature_gate_disabled
no raw request body / auth code / client secret serialized
no network / DB / Reports execution
Step136-G — LWA HTTP execution boundary contract

Commit:

ba0e315

Purpose:

Define LWA HTTP transport execution boundary.
Contract-only.
No HTTP transport implementation in this step.

Important files:

apps/api/src/imports/dto/amazon-sp-api-lwa-http-execution-boundary-contract.dto.ts
apps/api/scripts/smoke-amazon-sp-api-lwa-http-execution-boundary-contract.js
apps/api/package.json

Important warning:

This smoke is contract-only. It asserted executeRealLwaTokenExchangeHttpLater() did not exist yet. After Step136-H, do not use this smoke as a post-H regression gate.

Step136-H — Disabled LWA HTTP transport implementation

Commit:

bcc8a92

Purpose:

Add disabled/sanitized LWA HTTP transport method.
Still does not perform HTTP.
Still does not parse or return raw LWA response.
Still does not write token persistence.
Still does not wire callback.

Important files:

apps/api/src/imports/amazon-sp-api-token-exchange.service.ts
apps/api/scripts/smoke-amazon-sp-api-lwa-http-transport-disabled-implementation.js
apps/api/scripts/smoke-amazon-sp-api-oauth-token-exchange-service-skeleton.js
apps/api/scripts/smoke-amazon-sp-api-lwa-env-config-validation-contract.js
apps/api/scripts/smoke-amazon-sp-api-real-lwa-http-client-disabled-by-default.js
apps/api/scripts/smoke-amazon-sp-api-real-lwa-http-client-mock-runtime.js
apps/api/scripts/smoke-amazon-sp-api-lwa-request-body-builder-disabled-implementation.js
apps/api/scripts/smoke-amazon-sp-api-lwa-request-body-builder-mock-runtime.js
apps/api/package.json

Important smoke:

cd /opt/ledgerseiri/apps/api
npm run smoke:amazon-sp-api-lwa-http-transport-disabled

Important method / boundary:

executeRealLwaTokenExchangeHttpLater()
source: amazon-sp-api-lwa-http-transport-disabled
httpTransportPreparedNow: true
httpTransportImplementedNow: true
httpExecutedNow: false
tokenExchangeHttpCallNow: false
lwaHttpCallNow: false
rawLwaResponseParsedNow: false
rawLwaResponseReturnedNow: false
rawAccessTokenReturnedNow: false
rawRefreshTokenReturnedNow: false
Step136-I — LWA HTTP transport mock runtime smoke

Commit:

57d6c29

Purpose:

Add mock runtime smoke for disabled LWA HTTP transport.
No service/controller source changes.

Important files:

apps/api/scripts/smoke-amazon-sp-api-lwa-http-transport-mock-runtime.js
apps/api/package.json

Important smoke:

cd /opt/ledgerseiri/apps/api
npm run smoke:amazon-sp-api-lwa-http-transport-mock-runtime

Validated mock cases:

config_validator_not_ready
request_body_builder_not_ready
invalid_token_endpoint
missing_request_body_fingerprint
invalid_request_body_length
invalid_content_type
invalid_method
valid mock input still returns server_side_feature_gate_disabled
no raw request/response/token serialized
no network / DB / Reports execution
Step136-J — Real LWA exchange chain disabled orchestration contract

Commit:

08f0d70

Purpose:

Define complete disabled real LWA exchange chain orchestration boundary.
Contract-only.
No orchestrator implementation in this step.

Important files:

apps/api/src/imports/dto/amazon-sp-api-real-lwa-exchange-chain-boundary-contract.dto.ts
apps/api/scripts/smoke-amazon-sp-api-real-lwa-exchange-chain-boundary-contract.js
apps/api/package.json

Important warning:

This smoke is contract-only. It asserted orchestrateRealLwaExchangeChainDisabledLater() did not exist yet. After Step136-K, do not use this smoke as a post-K regression gate.

Step136-K — Disabled real LWA exchange chain orchestration implementation

Commit:

7bbdd7e

Purpose:

Add disabled/sanitized real LWA exchange chain orchestrator.
It chains sanitized validation, request-body builder, and disabled HTTP transport metadata.
Still does not wire callback.
Still does not enable real HTTP.
Still does not write token persistence.

Important files:

apps/api/src/imports/amazon-sp-api-token-exchange.service.ts
apps/api/scripts/smoke-amazon-sp-api-real-lwa-exchange-chain-disabled-orchestration.js
apps/api/scripts/smoke-amazon-sp-api-oauth-token-exchange-service-skeleton.js
apps/api/scripts/smoke-amazon-sp-api-lwa-env-config-validation-contract.js
apps/api/scripts/smoke-amazon-sp-api-real-lwa-http-client-disabled-by-default.js
apps/api/scripts/smoke-amazon-sp-api-real-lwa-http-client-mock-runtime.js
apps/api/scripts/smoke-amazon-sp-api-lwa-request-body-builder-disabled-implementation.js
apps/api/scripts/smoke-amazon-sp-api-lwa-request-body-builder-mock-runtime.js
apps/api/scripts/smoke-amazon-sp-api-lwa-http-transport-disabled-implementation.js
apps/api/scripts/smoke-amazon-sp-api-lwa-http-transport-mock-runtime.js
apps/api/package.json

Important smoke:

cd /opt/ledgerseiri/apps/api
npm run smoke:amazon-sp-api-real-lwa-exchange-chain-disabled

Important method / boundary:

orchestrateRealLwaExchangeChainDisabledLater()
source: amazon-sp-api-real-lwa-exchange-chain-disabled
orchestratorPreparedNow: true
orchestratorImplementedNow: true
callbackRuntimeChangedNow: false
controllerRouteChangedNow: false
realHttpEnabledNow: false
tokenExchangeHttpCallNow: false
lwaHttpCallNow: false
realSpApiRequestNow: false
tokenPersistenceDatabaseWriteNow: false
requestBodyConstructedNow: false
requestBodyLoggedNow: false
rawAuthorizationCodeReturnedNow: false
rawClientSecretReturnedNow: false
rawRequestBodyReturnedNow: false
rawLwaResponseReturnedNow: false
rawAccessTokenReturnedNow: false
rawRefreshTokenReturnedNow: false
Step136-L — Real LWA exchange chain mock runtime smoke

Commit:

2f22bd9

Purpose:

Add runtime smoke for disabled real LWA exchange chain.
No service/controller source changes.
Confirms the orchestrator remains disabled and sanitized.

Important files:

apps/api/scripts/smoke-amazon-sp-api-real-lwa-exchange-chain-mock-runtime.js
apps/api/package.json

Important smoke:

cd /opt/ledgerseiri/apps/api
npm run smoke:amazon-sp-api-real-lwa-exchange-chain-mock-runtime

Validated mock cases:

config_validator_not_ready
missing_state
missing_authorization_code
mismatched_redirect_uri
missing_client_secret_fingerprint
invalid_token_endpoint
valid mock input completes disabled chain stages:
validate-config
validate-callback-state
build-request-body
execute-http-transport
blocked at feature-gate
sanitizedDownstreamResults.requestBodyBuilderSource = amazon-sp-api-lwa-request-body-builder-disabled
sanitizedDownstreamResults.httpTransportSource = amazon-sp-api-lwa-http-transport-disabled
no raw request/response/token serialized
no network / DB / Reports execution
controller remains unmodified
Current real runtime state
OAuth callback route

Current callback route:

GET /api/imports/amazon-sp-api/oauth/callback

Current behavior:

Still uses exchangeAuthorizationCodeDryRunnable()
Does not call exchangeAuthorizationCodeWithLwaLater()
Does not call buildRealLwaTokenExchangeRequestBodyLater()
Does not call executeRealLwaTokenExchangeHttpLater()
Does not call orchestrateRealLwaExchangeChainDisabledLater()

Important:

The real LWA chain exists only as disabled/sanitized service methods.
The callback route has not been rewired to the real LWA chain.
The fake/dry-run callback path remains the runtime path.
Current token exchange service methods

Current service:

AmazonSpApiTokenExchangeService

Current methods:

exchangeAuthorizationCodeDryRunnable()
exchangeAuthorizationCodeWithLwaLater()
prepareRealLwaHttpExchangeRequestDisabled()
buildRealLwaTokenExchangeRequestBodyLater()
executeRealLwaTokenExchangeHttpLater()
orchestrateRealLwaExchangeChainDisabledLater()

Current runtime callback path:

exchangeAuthorizationCodeDryRunnable()

Current disabled real-chain path:

orchestrateRealLwaExchangeChainDisabledLater()

Current disabled chain order:

validate-config
validate-callback-state
build-request-body
execute-http-transport
feature-gate blocked

Current disabled chain guarantees:

realHttpEnabledNow: false
tokenExchangeHttpCallNow: false
lwaHttpCallNow: false
realSpApiRequestNow: false
tokenPersistenceDatabaseWriteNow: false
rawAuthorizationCodeReturnedNow: false
rawClientSecretReturnedNow: false
rawRequestBodyReturnedNow: false
rawLwaResponseReturnedNow: false
rawAccessTokenReturnedNow: false
rawRefreshTokenReturnedNow: false
Valid regression smoke set after Step136-L

Use these after future changes:

cd /opt/ledgerseiri/apps/api

npm run smoke:amazon-sp-api-real-lwa-exchange-chain-mock-runtime
npm run smoke:amazon-sp-api-real-lwa-exchange-chain-disabled
npm run smoke:amazon-sp-api-lwa-http-transport-mock-runtime
npm run smoke:amazon-sp-api-lwa-http-transport-disabled
npm run smoke:amazon-sp-api-lwa-request-body-builder-mock-runtime
npm run smoke:amazon-sp-api-lwa-request-body-builder-disabled
npm run smoke:amazon-sp-api-real-lwa-http-client-mock-runtime
npm run smoke:amazon-sp-api-real-lwa-http-client-disabled-by-default
npm run smoke:amazon-sp-api-real-lwa-token-exchange-enablement-boundary-contract
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

Reason:

Step136-D was contract-only and asserted request body builder did not exist yet.
Step136-G was contract-only and asserted HTTP transport did not exist yet.
Step136-J was contract-only and asserted chain orchestrator did not exist yet.
Step136-E/H/K intentionally implemented those disabled components.
Deployment / runtime verification commands

After source changes touching controller/module/service:

cd /opt/ledgerseiri

docker compose build api web
docker compose up -d api web
docker compose logs api --tail=700

For Step136-M itself, this should not be necessary because it is docs-only.

Recommended next roadmap
Step137-A — Amazon SP-API real LWA activation feature-gate contract

Recommended next step after this handoff.

Purpose:

Define activation contract for real LWA HTTP execution.
Still contract-first.
No real HTTP in Step137-A unless explicitly requested later.

Step137-A should define:

Required config readiness:
validator status must be ready
clientId/clientSecret/redirectUri present
token endpoint HTTPS
marketplace/region valid
Explicit server-side feature gate:
AMAZON_SP_API_LWA_ENABLE_REAL_HTTP=true alone should not be enough
require dedicated server-side gate constant / allowlist / environment mode
require company/store scoping
require callback state validation
HTTP execution boundary:
POST to https://api.amazon.com/auth/o2/token
grant_type=authorization_code
code
redirect_uri
client_id
client_secret
strict timeout
no retry initially unless explicitly designed
Response redaction:
never log or return refresh_token
never log or return access_token
never log or return raw response body
return only sanitized result metadata
Persistence boundary:
plaintext token may only enter encryption input
encrypted refresh credential only
encrypted access token cache only
no plaintext token database write
no frontend token exposure
Non-goals:
no Reports API
no ImportJob
no Transaction
no Inventory movement

Suggested Step137-A files:

apps/api/src/imports/dto/amazon-sp-api-real-lwa-activation-feature-gate-contract.dto.ts
apps/api/scripts/smoke-amazon-sp-api-real-lwa-activation-feature-gate-contract.js
apps/api/package.json

Suggested commit message:

test: define amazon sp-api real lwa activation gate
Later proposed sequence
Step137-A  Real LWA activation feature-gate contract
Step137-B  Real LWA activation feature-gate service skeleton
Step137-C  Real LWA activation gate runtime smoke
Step137-D  HTTP transport implementation behind disabled/test gate
Step137-E  Mock HTTP success/failure transport runtime smoke
Step137-F  Token redaction envelope contract
Step137-G  Encrypted token persistence input contract
Step137-H  Encrypted token persistence implementation
Step137-I  OAuth callback prewire contract
Step137-J  OAuth callback guarded real-chain switch, still disabled by default
Step137-K  Manual sandbox / production OAuth runbook
Step138-A  Connection status reads real persisted token state
Step138-B  Reconnect / revoke endpoint contract
Step138-C  Reconnect / revoke implementation
Step139-A  Reports API request boundary contract
Step140-A  Amazon order report fetch dry-run
Step141-A  Amazon order report normalized import preview
Step142-A  Amazon order report ImportJob / ImportStagingRow integration
Step143-A  Amazon order report commit to Transaction
Step144-A  Inventory deduction from imported Amazon orders
How to resume in a new window

Start from:

Current latest confirmed main commit:
2f22bd9

Current next step:
Step136-M closeout handoff commit, then Step137-A real LWA activation feature-gate contract

Before doing any new script:

cd /opt/ledgerseiri
git fetch origin --prune
git status
git log --oneline -15

Expected clean state before Step137:

Working tree clean
main contains 2f22bd9 or later
Step136-A through Step136-L commits present

Critical reminders:

OAuth callback still uses fake dry-run exchange.
The real LWA chain is implemented only as disabled/sanitized service methods.
Do not run Step136-D/G/J contract-only smokes after Step136-E/H/K.
Do not wire real LWA token exchange into callback without Step137 activation-gate contract.
Do not execute real HTTP without explicit Step137+ feature-gate implementation.
Do not write token persistence until encrypted persistence boundary and implementation are explicitly completed.
Do not call Reports API or create import/ledger/inventory data during LWA activation work.
