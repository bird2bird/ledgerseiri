# Step115 Amazon CSV Normalized Contract Closeout

## Stable point

Step115 Amazon CSV normalized contract final regression is complete after this handoff is committed.

Expected latest Step115 commits:

```text
8810d2c feat: scaffold amazon order normalized contract
041b222 feat: wire amazon order normalized payload contract
03da6e9 test: add amazon order normalized staging smoke
Scope completed

Step115 stabilized the Amazon order CSV normalized payload contract used by Store Orders import and future Amazon API ingestion preparation.

This step did not start Amazon SP-API implementation.

This step did not add an InventoryDeduction table.

This step did not remove legacy normalized payload fields.

Current architecture decision

Inventory deduction metadata remains embedded in:

ImportStagingRow.normalizedPayloadJson.inventoryDeduction

There is no Prisma model named:

InventoryDeduction

Therefore all future logic must treat inventory deduction as part of the normalized staging payload until a deliberate schema migration is designed.

Core files
Normalized contract helper
apps/api/src/imports/amazon-order-normalized-contract.ts

Defines:

AmazonOrderNormalizedPayload
AmazonOrderInventoryDeductionPayload
AmazonOrderInventoryAuditPayload
buildAmazonOrderNormalizedPayload()
assertAmazonOrderNormalizedPayload()
normalizeAmazonSellerSku()
normalizeAmazonOrderBusinessMonth()

Stable contract version:

amazon-order-normalized-v1

Supported source types:

AMAZON_ORDER_CSV
AMAZON_ORDER_SP_API

SP-API is supported only as a future-compatible source type in the helper. It is not implemented.

Imports service wiring
apps/api/src/imports/imports.service.ts

Added:

private buildStoreOrderNormalizedPayload(...)

Store-orders preview/staging generation now uses:

normalizedPayload: this.buildStoreOrderNormalizedPayload({
  fact,
  businessMonth,
  dedupeHash,
})

The helper output is merged with legacy top-level fields, so existing UI and import flows remain compatible.

Normalized payload fields

Newly generated store-orders staging rows should contain:

contractVersion = amazon-order-normalized-v1
sourceType = AMAZON_ORDER_CSV
entityType = transaction
module = store-orders
orderId
amazonOrderId
orderDate
occurredAt
businessMonth
sku
skuCode
sellerSku
normalizedSellerSku
productName
quantity
amount
grossAmount
netAmount
signedAmount
currency
itemSalesAmount
itemSalesTaxAmount
shippingAmount
shippingTaxAmount
promotionAmount
promotionDiscountAmount
promotionDiscountTaxAmount
commissionFeeAmount
fbaFeeAmount
feeAmount
taxAmount
dedupeHash
inventoryDeduction
inventoryAudit
raw

Legacy compatibility fields intentionally remain at top level:

orderId
orderDate
sku
productName
quantity
amount
grossAmount
netAmount
feeAmount
taxAmount
shippingAmount
promotionAmount
commissionFeeAmount
fbaFeeAmount
shippingTaxAmount
promotionDiscountTaxAmount
dedupeHash
Visibility in UI
Import Center

File:

apps/web/src/components/app/jobs/ImportJobsTableCard.tsx

Import Center drawer already displays:

normalizedPayloadJson
rawPayloadJson

via JsonPayloadDetails.

It also keeps inventory reverse-navigation actions:

在庫監査へ移動
在庫状況へ
在庫リスクへ
Store Orders

File:

apps/web/src/components/app/income-store-orders/StoreOrdersWorkspace.tsx

Store Orders continues to expose Amazon order fee/tax fields:

commissionFeeAmount
fbaFeeAmount
shippingTaxAmount
promotionDiscountTaxAmount
Smoke commands

Run from /opt/ledgerseiri/apps/api:

npm run build
npm run smoke:amazon-order-normalized-contract
npm run smoke:amazon-order-normalized-staging-row
npm run smoke:inventory-audit-alias
npm run smoke:inventory-manual-adjustment

Expected markers:

[SMOKE_OK] amazon order normalized contract helper smoke passed
[SMOKE_OK] amazon order normalized staging row rollback smoke passed
[SMOKE_OK] inventory audit alias reprocess rollback smoke passed
[SMOKE_OK] inventory manual adjustment rollback smoke passed

The staging smoke is rollback-safe and must not leave leaked rows.

Leak check expectation:

leakedJobs = 0
leakedRows = 0
Final regression commands
API
cd /opt/ledgerseiri/apps/api
npm run build
npm run smoke:amazon-order-normalized-contract
npm run smoke:amazon-order-normalized-staging-row
npm run smoke:inventory-audit-alias
npm run smoke:inventory-manual-adjustment
Web
cd /opt/ledgerseiri/apps/web
npm run build
Docker runtime
cd /opt/ledgerseiri
docker compose build web
docker compose up -d web
docker compose logs web --tail=300
Routes
curl -I http://localhost:3000/ja/app/data/import
curl -I "http://localhost:3000/ja/app/data/import?importJobId=smoke-import-job"
curl -I http://localhost:3000/ja/app/income/store-orders
curl -I "http://localhost:3000/ja/app/income/store-orders?importJobId=smoke-import-job"
curl -I "http://localhost:3000/ja/app/inventory/audit?importJobId=smoke-import-job"
curl -I "http://localhost:3000/ja/app/inventory/status?importJobId=smoke-import-job"
curl -I "http://localhost:3000/ja/app/inventory/alerts?source=import-center&importJobId=smoke-import-job"

Expected: 200, 302, 307, or 308.

BFF
curl -i http://localhost:3000/api/import-jobs
curl -i "http://localhost:3000/api/import-jobs/detail?importJobId=smoke-import-job"
curl -i "http://localhost:3000/api/inventory/audit-issues?status=ALL&limit=3&offset=0"
curl -i "http://localhost:3000/api/inventory/movements?limit=3"

Expected: mounted response or safe handled error status such as 400/404 for a fake smoke id.

Guardrails for next steps

Do not start Amazon SP-API yet.

Do not add InventoryDeduction model yet.

Do not remove legacy payload fields.

Do not change Store Orders UI semantics during normalized contract hardening.

Do not change inventory alias/audit behavior unless a targeted regression smoke is added.

Recommended next step
Step115-E:
Amazon CSV normalized contract real import fixture smoke

Purpose:

Run a rollback-safe fixture through the real CSV preview/commit path.
Verify the newly created ImportStagingRow has amazon-order-normalized-v1.
Verify legacy Store Orders fields still produce Transaction rows correctly.
Verify inventory audit/deduction embedding still works for direct SKU and alias SKU.
Keep rollback-safe.
Later step
Step116:
Amazon SP-API connection preparation

Start only after Step115-E proves that CSV and future API sources can share the same normalized contract.

