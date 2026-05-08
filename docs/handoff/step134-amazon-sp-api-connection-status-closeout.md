# LedgerSeiri Handoff — Step134 Amazon SP-API Connection Status Closeout

## Current confirmed baseline

- Latest confirmed main commit after Step134-C: `03409b1`
- Step134-C completed: Amazon SP-API connection status frontend runtime smoke / browser verification
- This handoff freezes the Step130–Step134 Amazon SP-API OAuth preparation chain before entering Step135 token exchange work.

## Product / system context

LedgerSeiri is a SaaS accounting and operations system for Japanese SMB / e-commerce sellers.

Stable architecture assumptions:

- Frontend: Next.js / React
- Backend: NestJS
- ORM / DB: Prisma + PostgreSQL
- Deployment: Docker Compose
- Multi-tenant isolation: shared DB/schema with `companyId` row-level isolation
- Import Center route: `/ja/app/data/import`
- Current Amazon SP-API work is still connection/OAuth preparation only.

## Important guardrails

The current Amazon SP-API connection flow must remain read-only / preparation-only until Step135 explicitly starts token exchange.

Do not do the following in Step134 closeout or status UI steps:

- Do not call Amazon Reports API.
- Do not call `createReport`, `getReport`, or `getReportDocument`.
- Do not create `ImportJob`.
- Do not create `ImportStagingRow`.
- Do not create or update `Transaction`.
- Do not create or update inventory / inventory movements.
- Do not expose raw `refresh_token`, `access_token`, `client_secret`, `lwa_client_secret`, or `amazon_refresh_token` in frontend, DOM, logs, or Network response.
- Do not store raw token or client secret in `localStorage`, `sessionStorage`, or cookies from frontend code.

Allowed status-level boolean flags:

- `rawTokenReturnedNow?: boolean`
- `clientSecretReturnedNow?: boolean`

These are safety boundary flags, not raw secret values.

## Completed milestone chain

### Step130 series — Amazon SP-API real connection boundary

Purpose:

- Define real connection boundary for Amazon SP-API.
- Keep implementation OAuth-free / sandbox-safe.
- Prevent token DB writes and real SP-API calls before explicit later steps.

Outcome:

- Amazon SP-API real connection preparation boundary established.
- Real token exchange and real report retrieval intentionally deferred.

### Step131 / Step132 series — Frontend connection panel and authorization URL preparation

Purpose:

- Add frontend Amazon SP-API connection panel.
- Add frontend helper for sanitized authorization URL request.
- Keep panel safe: no raw token, no real reports, no ImportJob writes.

Important frontend files:

- `apps/web/src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx`
- `apps/web/src/core/imports/api.ts`

Important helper:

- `requestAmazonSpApiAuthorizationUrl()`

Current connect/reconnect behavior:

- `Amazonと接続` calls authorization URL helper.
- `再接続` calls authorization URL helper with `forceReauthorize=true`.
- `接続を解除` remains disabled until a dedicated revoke endpoint step.

### Step133 series — Backend connection status endpoint

Purpose:

- Provide backend status endpoint for Amazon SP-API connection state.
- Read sanitized status from backend/token persistence boundary.
- Do not perform token exchange, report call, import, transaction, or inventory writes.

Important route:

```text
GET /api/imports/amazon-sp-api/connection/status

Expected query:

storeId=store-step130b-boundary
marketplaceId=A1VC38T7YXB528
region=JP

Expected status values:

NOT_CONNECTED
CONNECTED
RECONNECT_REQUIRED
ERROR
Step134-A — Frontend status read contract

Commit:

b56afc6

Purpose:

Define contract that frontend panel should read backend status endpoint later.
Contract-only.
Explicitly prohibited implementing frontend helper at that stage.

Important files:

apps/api/src/imports/dto/frontend-amazon-sp-api-connection-status-panel-read-backend-contract.dto.ts
apps/api/scripts/smoke-frontend-amazon-sp-api-connection-status-panel-read-backend-contract.js
apps/api/package.json

Important warning:

The Step134-A smoke intentionally fails after Step134-B because it asserts that frontend helper must not exist yet.
Do not run Step134-A contract-only smoke as a post-Step134-B regression gate.
Step134-B — Frontend status read implementation

Commit:

29384f2

Purpose:

Implement frontend helper:
readAmazonSpApiConnectionStatus()
Wire Amazon connection panel initial load and refresh button to backend status endpoint.
Keep frontend read-only and token-safe.

Important files:

apps/web/src/core/imports/api.ts
apps/web/src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx
apps/web/scripts/smoke-amazon-sp-api-frontend-status-read-implementation.js
apps/web/package.json

Frontend behavior:

Initial panel mount calls backend status endpoint.
Clicking 接続状態を更新 calls backend status endpoint again.
Backend status has priority over callback URL hint once endpoint responds.
Callback URL hint remains fallback when status endpoint check fails after callback.

Status label mapping:

NOT_CONNECTED        -> 未接続
CONNECTED            -> 接続済み
RECONNECT_REQUIRED   -> 再接続が必要
ERROR                -> 接続エラー

Known smoke-script lessons:

clientSecretReturnedNow?: boolean and rawTokenReturnedNow?: boolean are safe boolean flags.
inventoryMovementCount is historical inventory audit summary code, not a Step134-B domain write.
Safety comments containing does not call Amazon Reports API are not execution markers.
Step134-C — Frontend runtime smoke / browser verification

Commit:

03409b1

Purpose:

Add runtime smoke for status endpoint and browser verification checklist.
No frontend source logic changes.
No backend logic changes.

Important files:

apps/web/scripts/smoke-amazon-sp-api-frontend-status-runtime.js
apps/web/package.json

Important script:

cd /opt/ledgerseiri/apps/web
WEB_BASE=http://localhost:3000 API_BASE=http://localhost:3001 npm run smoke:amazon-sp-api-frontend-status-runtime

Runtime smoke validates:

Import Center page is inspectable.
Backend status endpoint returns JSON.
Backend status value is expected or empty.
Response does not expose raw token / client secret fields.
Response does not expose report/import/inventory execution markers.

Important runtime note:

If smoke gets socket hang up immediately after Docker web restart, wait until web is ready and rerun.
This happened once because ledgerseiri_web had just started.
Rerun after web readiness wait passed.
Current frontend implementation summary
apps/web/src/core/imports/api.ts

Current Amazon SP-API helpers:

requestAmazonSpApiAuthorizationUrl()
readAmazonSpApiConnectionStatus()

readAmazonSpApiConnectionStatus() calls:

GET /api/imports/amazon-sp-api/connection/status?storeId=store-step130b-boundary&marketplaceId=A1VC38T7YXB528&region=JP

Fetch options:

method: GET
credentials: include
cache: no-store
apps/web/src/components/app/imports/AmazonSpApiConnectionStatusPanel.tsx

Current panel behavior:

On mount:
reads URL callback hint first
calls backend status endpoint
backend status wins once response returns
On 接続状態を更新:
calls backend status endpoint
On Amazonと接続:
calls authorization URL helper
redirects to returned Amazon authorization URL
On 再接続:
calls authorization URL helper with force reauthorize
On 接続を解除:
remains disabled until dedicated revoke endpoint step
Current runtime verification checklist

Manual browser verification:

1. Open:
   http://localhost:3000/ja/app/data/import

2. Open DevTools -> Network

3. Confirm initial GET:
   /api/imports/amazon-sp-api/connection/status?storeId=store-step130b-boundary&marketplaceId=A1VC38T7YXB528&region=JP

4. Click:
   接続状態を更新

5. Confirm the same GET fires again.

6. Confirm badge mapping:
   NOT_CONNECTED        -> 未接続
   CONNECTED            -> 接続済み
   RECONNECT_REQUIRED   -> 再接続が必要
   ERROR                -> 接続エラー

7. Confirm no raw token/client secret appears in DOM or Network response.
Recommended next roadmap
Step134-D — Closeout / handoff

Purpose:

Commit this handoff.
Keep no business logic changes.
Treat Step130–134 as stable pre-token-exchange baseline.
Step135-A — OAuth callback token exchange boundary contract

Recommended next development step after Step134-D.

Purpose:

Define contract for callback token exchange boundary.
Still contract-first.
Specify exact security behavior before implementing real token exchange.

Step135-A should define:

Callback receives state, selling_partner_id, spapi_oauth_code.
Backend validates OAuth state.
Backend exchanges authorization code with LWA token endpoint later.
Step135-A itself should not make real token HTTP calls unless explicitly scoped.
Step135-A should not persist refresh token unless that is explicitly the step target.
No Amazon Reports API call.
No ImportJob / Transaction / Inventory writes.

Recommended Step135-A contract files:

apps/api/src/imports/dto/amazon-sp-api-oauth-token-exchange-boundary-contract.dto.ts
apps/api/scripts/smoke-amazon-sp-api-oauth-token-exchange-boundary-contract.js
apps/api/package.json

Suggested Step135-A commit message:

test: define amazon sp-api oauth token exchange boundary
Later steps

Proposed sequence:

Step135-A  OAuth callback token exchange boundary contract
Step135-B  OAuth token exchange service skeleton, no real HTTP
Step135-C  OAuth token exchange environment/config validation
Step135-D  LWA token endpoint HTTP client boundary, sandbox-safe
Step136-A  Encrypted refresh token persistence contract
Step136-B  Token persistence implementation
Step136-C  Connection status reads persisted token state
Step137-A  Reconnect / revoke endpoint contract
Step137-B  Revoke endpoint implementation
Step138-A  Reports API request boundary contract
Step138-B  Reports API sandbox-safe client skeleton
Step139-A  Amazon order report fetch dry-run
Step140-A  Amazon order report normalized import preview
Step141-A  Amazon order report ImportJob / ImportStagingRow integration
Step142-A  Amazon order report commit to Transaction
Step143-A  Inventory deduction from imported Amazon orders
How to resume in a new window

Start from:

Current latest confirmed main commit:
03409b1

Current next step:
Step134-D closeout handoff commit, then Step135-A OAuth callback token exchange boundary contract

Before doing any new script:

cd /opt/ledgerseiri
git fetch origin --prune
git status
git log --oneline -10

Expected clean state before Step135:

Working tree clean
main contains 03409b1 or later
Step134-B and Step134-C commits present

Critical reminder:

Do not run Step134-A contract-only smoke after Step134-B.
Step134-A smoke is intentionally incompatible with post-Step134-B code.
Use Step134-B and Step134-C smokes for current frontend status-read regression.
