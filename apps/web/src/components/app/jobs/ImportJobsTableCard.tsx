"use client";

import React from "react";
import { createPortal } from "react-dom";
import type { ImportJobItem } from "@/core/jobs";
import {
  listInventoryAuditIssuesForImportJob,
  readAmazonSpApiOrdersStagingCommitReadiness,
  summarizeInventoryAuditIssuesForImportJob,
  type AmazonSpApiOrdersStagingCommitReadinessResponse,
  type AmazonSpApiOrdersStagingCommitReadinessRow,
  type InventoryAuditImportSummary,
} from "@/core/imports/api";
import { fmtDate } from "./jobs-shared";
import {
  formatRows,
  getImportedAtToneClass,
  getImportCenterJobHint,
  getImportCenterJobTone,
  getImportCenterRowClass,
  getImportCenterStatusClass,
  getImportCenterStatusLabel,
  getStatusFilterValue,
  isImportCenterPendingPreview,
  numberValue,
  summarizeJobs,
} from "./import-center-status";
import {
  buildImportJobSourceHref,
  buildTransactionTraceHref,
  getDomainLabel,
  getImportCenterModuleLabel,
  getImportJobSourceActionHint,
  getImportJobSourceActionLabel,
} from "./import-center-routing";
import {
  EMPTY_IMPORT_JOB_DETAIL_FETCH_STATE,
  fetchImportJobDetailRows,
  type ImportJobDetailFetchState,
} from "./import-center-detail-data";
import {
  getImportedAtLabel,
  getImportCenterSourceTypeLabel,
  shortId,
  uniqueDomains,
} from "./import-center-display";
import {
  CopyFriendlyId,
  DetailDataStateCard,
  DetailField,
  FutureApiContractCard,
  JsonPayloadDetails,
} from "./import-center-drawer-primitives";
import {
  getSelectedImportJobRowClass,
  readImportCenterUrlSelectionInfo,
  syncImportJobIdToUrl,
} from "./import-center-selection";
import { getDrawerActionToneClass } from "./import-center-drawer-tone";






// Step109-Z1-H11-B-IMPORT-CENTER-LIST-STATUS:
// Productize Import Center list/status without changing backend contracts.
// Keep pending-preview semantics aligned with income/expense history:
// PROCESSING + successRows > 0 + failedRows === 0 => 未正式登録.
//
// Step109-Z1-H11-D-IMPORT-CENTER-MODULE-SOURCE-IMPORTED-AT:
// Display ImportJob module/sourceType/importedAt fields returned by H11-C.
//
// Step109-Z1-H11-E-IMPORT-JOB-DETAIL-DRAWER-SKELETON:
// Add frontend-only ImportJob detail drawer using existing list fields.
//
// Step109-Z1-H11-F-IMPORT-JOB-DRAWER-SOURCE-NAVIGATION:
// Polish drawer actions and add source page navigation without backend changes.
//
// Step109-Z1-H11-G-IMPORT-JOB-URL-HIGHLIGHT:
// Read importJobId from URL, auto-open drawer, highlight selected row, and sync URL.
//
// Step109-Z1-H11-G-FIX1-STOP-URL-DRAWER-FLICKER:
// Apply URL importJobId only once per id and avoid redundant replaceState calls.
//
// Step109-Z1-H11-G-FIX2-DRAWER-OVERLAY-NO-BLUR:
// Remove backdrop blur and button overlay to avoid mouse-triggered compositor flicker.
//
// Step109-Z1-H11-G-FIX3-DISABLE-URL-AUTO-DRAWER:
// URL importJobId highlights the row only; users open drawer manually.
//
// Step109-Z1-H11-H-STAGING-ROWS-API-PREPARATION:
// Add frontend-only placeholders and API contract notes for staging rows / transaction trace.
//
// Step109-Z1-H11-K-FETCH-STAGING-TRANSACTIONS:
// Fetch staging rows and transaction trace from H11-J backend detail APIs.
//
// Step109-Z1-H11-K-FIX1-DRAWER-PORTAL:
// Render drawer through document.body to avoid grid/card hover layout flicker.
//
// Step109-Z1-H11-L-DRAWER-DATA-UI-POLISH:
// Polish staging rows / transaction trace display and add trace navigation placeholders.
//
// Step109-Z1-H11-M-B-TRACE-NAVIGATION-ROUTE-ALIGNMENT:
// Route transaction trace links to real business pages instead of missing /transactions.
//
// Step109-Z1-H11-M-F-REV1-A-AMAZON-TRACE-ROUTING:
// Split Amazon import transaction trace links into Store Orders vs Store Operation views.
//
// Step109-Z1-H11-M-G-FIX3-COMPANY-OPERATION-CATEGORY-OTHER:
// Route company-operation-expense to /expenses?category=other because expenses/page.tsx maps category=other to company-operation workspace.
//
// Step109-Z1-H12-B-IMPORT-JOB-DETAIL-UX-POLISH:
// Final polish for ImportJob detail drawer density/header without changing routing/API behavior.
//
// Step109-Z1-H12-C-IMPORT-CENTER-LIST-STATUS-UX-POLISH:
// Polish Import Center list selected-row visibility and status hints without changing routing/drawer behavior.
//
// Step109-Z1-H13-B-IMPORT-CENTER-EDGE-HARDENING:
// Add selected-hidden notice, drawer bottom padding, and stronger hidden-row count messaging.
//
// Step109-Z1-H13-B-FIX1-EMPTY-FILTER-CLEAR-ACTION:
// Add clear filters action to empty filtered list state after selection is cleared.
//
// Step141-F3B-AMAZON-SPAPI-IMPORTJOB-URL-AUTO-DRAWER:
// Auto-open the ImportJob detail drawer only for Amazon SP-API Orders ImportJobs selected by URL.
// This preserves historical generic importJobId highlight-only behavior.
//
// Step141-F3C-AMAZON-SPAPI-STAGING-ROW-SUMMARY:
// Render Amazon SP-API staging row summary fields from normalizedPayloadJson.
// Keep JSON details as-is and do not add Transaction / Inventory writes.
//
// Step141-G2-AMAZON-SPAPI-STAGING-COMMIT-READINESS-UI:
// Wire dry-run readiness into ImportJob drawer for Amazon SP-API Orders.
// Display commit blockers/warnings without creating Transaction or InventoryMovement.
//
// Step141-G2B-AMAZON-SPAPI-READINESS-WORDING:
// Clarify row validation vs whole-ImportJob commit readiness.
// Row READY can still have commit warnings such as SKU未リンク.
//
// Step141-G3-AMAZON-SPAPI-SKU-RESOLUTION-BRIDGE:
// Bridge unresolved Amazon sellerSku rows to the existing inventory audit / SKU resolution workflow.
// This step adds navigation context only and does not create ProductSkuAlias, Transaction, or InventoryMovement.
//
// Step141-H4-AMAZON-SPAPI-IMPORTJOB-DRAWER-DISPLAY-CLEANUP:
// Make Amazon order staging rows readable in the ImportJob drawer.
// Keep JSON details secondary and do not create Transaction / InventoryMovement.
//
// Step141-H5-IMPORT-CENTER-AMAZON-FILTER-NAVIGATION:
// Make Amazon SP-API Orders ImportJobs easier to find in Import Center.
// Add sourceType filter / quick Amazon filter without changing backend or creating writes.



type ImportCenterInventoryAuditSummaryState = {
  loading: boolean;
  error: string;
  summary: InventoryAuditImportSummary | null;
};

const EMPTY_IMPORT_CENTER_INVENTORY_AUDIT_SUMMARY: ImportCenterInventoryAuditSummaryState = {
  loading: false,
  error: "",
  summary: null,
};

type AmazonSpApiCommitReadinessState = {
  loading: boolean;
  error: string;
  data: AmazonSpApiOrdersStagingCommitReadinessResponse | null;
};

const EMPTY_AMAZON_SP_API_COMMIT_READINESS_STATE: AmazonSpApiCommitReadinessState = {
  loading: false,
  error: "",
  data: null,
};

function isAmazonSpApiOrdersImportJob(job?: { sourceType?: string | null } | null) {
  return job?.sourceType === "amazon-sp-api-orders";
}

function uniqueImportCenterSourceTypes(jobs: ImportJobItem[]) {
  return Array.from(
    new Set(
      jobs
        .map((job) => String(job.sourceType || "").trim())
        .filter(Boolean)
    )
  ).sort();
}

function getAmazonSpApiOrdersJobCount(jobs: ImportJobItem[]) {
  return jobs.filter((job) => isAmazonSpApiOrdersImportJob(job)).length;
}

function getImportCenterSourceTypeBadgeClass(sourceType?: string | null) {
  if (sourceType === "amazon-sp-api-orders") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-500";
}

function formatAmazonSpApiReadinessReason(reason: string) {
  if (reason === "UNRESOLVED_SKU_ROWS_PRESENT") return "SKU未リンクの行があります";
  if (reason === "BLOCKED_ROWS_PRESENT") return "ブロックされた行があります";
  if (reason === "IMPORT_JOB_NOT_SUCCEEDED") return "ImportJob が完了していません";
  if (reason === "NO_STAGING_ROWS") return "Staging Row がありません";
  return reason;
}

function formatAmazonSpApiReadinessIssue(issue: string) {
  if (issue === "SKU_NOT_LINKED_TO_TARGET_ENTITY_YET") return "SKU未リンク";
  if (issue === "MISSING_ORDER_IDENTITY") return "注文ID不足";
  if (issue === "MISSING_ITEM_PRICE_AMOUNT") return "金額不足";
  if (issue === "MISSING_DEDUPE_HASH") return "重複判定キー不足";
  if (issue === "DUPLICATE_DEDUPE_HASH_IN_STAGING") return "Staging内重複";
  if (issue === "TRANSACTION_ALREADY_EXISTS_FOR_DEDUPE_HASH") return "登録済みTransactionあり";
  if (issue === "INVENTORY_MOVEMENT_ALREADY_EXISTS_FOR_ROW") return "在庫移動作成済み";
  return issue;
}

function hasImportCenterInventoryAuditSummary(summary?: InventoryAuditImportSummary | null) {
  return Boolean(summary && summary.total > 0);
}

function getImportCenterInventoryAuditSummaryTone(summary?: InventoryAuditImportSummary | null) {
  if (!summary || summary.total <= 0) return "neutral";
  if (summary.unresolvedSkuRows > 0) return "warning";
  if (summary.deductedRows > 0) return "success";
  return "info";
}

function getImportCenterInventoryAuditSummaryClass(summary?: InventoryAuditImportSummary | null) {
  const tone = getImportCenterInventoryAuditSummaryTone(summary);

  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-900";
  if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (tone === "info") return "border-sky-200 bg-sky-50 text-sky-900";

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function formatImportCenterInventoryAuditSummaryLine(summary?: InventoryAuditImportSummary | null) {
  if (!summary || summary.total <= 0) return "在庫監査対象なし";

  return [
    `在庫監査 ${summary.total}`,
    `SKU未匹配 ${summary.skuIssueRows}`,
    `未解決 ${summary.unresolvedSkuRows}`,
    `解決済み ${summary.resolvedSkuRows}`,
    `扣減成功 ${summary.deductedRows}`,
    `在庫移動 ${summary.inventoryMovementCount}`,
  ].join(" / ");
}

function buildImportCenterInventoryAuditHref(importJobId: string) {
  return `/ja/app/inventory/audit?importJobId=${encodeURIComponent(importJobId)}`;
}

function buildImportCenterInventoryStatusHref(importJobId: string) {
  return `/ja/app/inventory/status?importJobId=${encodeURIComponent(importJobId)}`;
}

function buildImportCenterInventoryAlertsHref(importJobId: string) {
  return `/ja/app/inventory/alerts?source=import-center&importJobId=${encodeURIComponent(importJobId)}`;
}

function buildAmazonSpApiSkuResolutionHref(args: {
  importJobId: string;
  rowNo?: number | null;
  sellerSku?: string | null;
  asin?: string | null;
  amazonOrderId?: string | null;
  orderItemId?: string | null;
}) {
  const params = new URLSearchParams();

  params.set("source", "amazon-sp-api-readiness");
  params.set("importJobId", args.importJobId);
  params.set("reason", "sku-unlinked");

  if (args.rowNo !== null && args.rowNo !== undefined) {
    params.set("rowNo", String(args.rowNo));
  }

  if (args.sellerSku && args.sellerSku !== "-") {
    params.set("sellerSku", args.sellerSku);
    params.set("aliasSku", args.sellerSku);
  }

  if (args.asin && args.asin !== "-") {
    params.set("asin", args.asin);
  }

  if (args.amazonOrderId && args.amazonOrderId !== "-") {
    params.set("amazonOrderId", args.amazonOrderId);
  }

  if (args.orderItemId && args.orderItemId !== "-") {
    params.set("orderItemId", args.orderItemId);
  }

  return `/ja/app/inventory/audit?${params.toString()}`;
}

function readRecordValue(source: unknown, key: string): unknown {
  if (!source || typeof source !== "object") return undefined;
  return (source as Record<string, unknown>)[key];
}

function stringifyAmazonSummaryValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number") return Number.isFinite(value) ? value.toLocaleString("ja-JP") : "-";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function formatAmazonMoney(value: unknown, currency: unknown) {
  const amount = typeof value === "number" ? value : Number(value);
  const currencyCode = String(currency || "JPY");

  if (!Number.isFinite(amount)) return "-";

  if (currencyCode === "JPY") {
    return `¥${amount.toLocaleString("ja-JP")}`;
  }

  return `${amount.toLocaleString("ja-JP")} ${currencyCode}`;
}

function formatAmazonOrderCompactValue(value: unknown) {
  const text = stringifyAmazonSummaryValue(value);
  return text === "-" ? "未取得" : text;
}

function formatAmazonQuantity(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "未取得";
  return n.toLocaleString("ja-JP");
}

function resolveAmazonSpApiNormalizedPayload(row: { normalizedPayloadJson?: unknown }) {
  const payload = row.normalizedPayloadJson;
  if (!payload || typeof payload !== "object") return null;
  return payload as Record<string, unknown>;
}

function isAmazonSpApiStagingRow(row: { normalizedPayloadJson?: unknown }) {
  return readRecordValue(resolveAmazonSpApiNormalizedPayload(row), "sourceType") === "amazon-sp-api-orders";
}

function buildAmazonSpApiStagingRowSummary(row: { normalizedPayloadJson?: unknown }) {
  const payload = resolveAmazonSpApiNormalizedPayload(row);
  if (!payload) return null;

  return {
    amazonOrderId: formatAmazonOrderCompactValue(readRecordValue(payload, "amazonOrderId")),
    orderItemId: formatAmazonOrderCompactValue(readRecordValue(payload, "orderItemId")),
    sellerSku: formatAmazonOrderCompactValue(readRecordValue(payload, "sellerSku")),
    asin: formatAmazonOrderCompactValue(readRecordValue(payload, "asin")),
    title: formatAmazonOrderCompactValue(readRecordValue(payload, "title")),
    businessMonth: formatAmazonOrderCompactValue(readRecordValue(payload, "businessMonth")),
    quantityOrdered: formatAmazonQuantity(readRecordValue(payload, "quantityOrdered")),
    quantityShipped: formatAmazonQuantity(readRecordValue(payload, "quantityShipped")),
    itemPrice: formatAmazonMoney(
      readRecordValue(payload, "itemPriceAmount"),
      readRecordValue(payload, "itemCurrencyCode")
    ),
    itemTax: formatAmazonMoney(
      readRecordValue(payload, "itemTaxAmount"),
      readRecordValue(payload, "itemCurrencyCode")
    ),
    shippingPrice: formatAmazonMoney(
      readRecordValue(payload, "shippingPriceAmount"),
      readRecordValue(payload, "itemCurrencyCode")
    ),
    shippingTax: formatAmazonMoney(
      readRecordValue(payload, "shippingTaxAmount"),
      readRecordValue(payload, "itemCurrencyCode")
    ),
    marketplaceId: formatAmazonOrderCompactValue(readRecordValue(payload, "marketplaceId")),
    storeId: formatAmazonOrderCompactValue(readRecordValue(payload, "storeId")),
    region: formatAmazonOrderCompactValue(readRecordValue(payload, "region")),
    sourceType: formatAmazonOrderCompactValue(readRecordValue(payload, "sourceType")),
  };
}

function AmazonSpApiStagingRowSummaryCard(props: {
  importJobId: string;
  row: {
    normalizedPayloadJson?: unknown;
    matchStatus?: string | null;
    businessMonth?: string | null;
    rowNo?: number | null;
  };
  readinessRow?: AmazonSpApiOrdersStagingCommitReadinessRow | null;
}) {
  const { importJobId, row, readinessRow } = props;
  const summary = buildAmazonSpApiStagingRowSummary(row);

  if (!summary || !isAmazonSpApiStagingRow(row)) return null;

  const businessMonth = row.businessMonth || summary.businessMonth || "-";
  const skuResolutionHref = buildAmazonSpApiSkuResolutionHref({
    importJobId,
    rowNo: row.rowNo,
    sellerSku: summary.sellerSku,
    asin: summary.asin,
    amazonOrderId: summary.amazonOrderId,
    orderItemId: summary.orderItemId,
  });

  return (
    <div
      data-testid={`amazon-sp-api-staging-row-summary-${row.rowNo ?? "unknown"}`}
      className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">
            Amazon注文明細
          </div>
          <div className="mt-1 truncate text-sm font-black text-slate-950" title={summary.title}>
            {summary.title}
          </div>
          <div className="mt-1 text-[11px] font-bold text-slate-500">
            Row #{row.rowNo ?? "-"} / businessMonth: {businessMonth}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          <span className="rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-black text-emerald-700">
            {row.matchStatus || "-"}
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-black text-slate-600">
            {businessMonth}
          </span>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-white/80 bg-white px-3 py-3 shadow-sm">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <CopyFriendlyId label="Amazon注文番号" value={summary.amazonOrderId} />
          <CopyFriendlyId label="Order Item ID" value={summary.orderItemId} />
          <CopyFriendlyId label="sellerSku" value={summary.sellerSku} />
          <CopyFriendlyId label="ASIN" value={summary.asin} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-slate-700 sm:grid-cols-4">
        <div className="rounded-xl border border-white/80 bg-white px-3 py-2 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">数量</div>
          <div className="mt-1 font-black text-slate-900">{summary.quantityOrdered}</div>
        </div>
        <div className="rounded-xl border border-white/80 bg-white px-3 py-2 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">出荷数量</div>
          <div className="mt-1 font-black text-slate-900">{summary.quantityShipped}</div>
        </div>
        <div className="rounded-xl border border-white/80 bg-white px-3 py-2 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">商品金額</div>
          <div className="mt-1 font-black text-slate-900">{summary.itemPrice}</div>
        </div>
        <div className="rounded-xl border border-white/80 bg-white px-3 py-2 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">消費税</div>
          <div className="mt-1 font-black text-slate-900">{summary.itemTax}</div>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 text-xs font-bold text-slate-600 sm:grid-cols-3">
        <div className="rounded-xl border border-white/80 bg-white px-3 py-2">
          送料: <span className="font-black text-slate-900">{summary.shippingPrice}</span>
        </div>
        <div className="rounded-xl border border-white/80 bg-white px-3 py-2">
          送料税: <span className="font-black text-slate-900">{summary.shippingTax}</span>
        </div>
        <div className="rounded-xl border border-white/80 bg-white px-3 py-2">
          Region: <span className="font-black text-slate-900">{summary.region}</span>
        </div>
      </div>

      {readinessRow ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-bold text-amber-900">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-black">Row validation: {readinessRow.readiness || "-"}</span>
            {readinessRow.blockers?.length ? (
              <span>Row blockers: {readinessRow.blockers.map(formatAmazonSpApiReadinessIssue).join(" / ")}</span>
            ) : null}
            {readinessRow.warnings?.length ? (
              <span>Commit warning: {readinessRow.warnings.map(formatAmazonSpApiReadinessIssue).join(" / ")}</span>
            ) : null}
          </div>

          {readinessRow.warnings?.includes("SKU_NOT_LINKED_TO_TARGET_ENTITY_YET") ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <a
                href={skuResolutionHref}
                className="inline-flex h-8 items-center justify-center rounded-lg bg-slate-950 px-3 text-[11px] font-black text-white shadow-sm transition hover:bg-slate-800"
              >
                商品SKUにリンク
              </a>
              <span className="text-[11px] font-bold text-amber-800">
                sellerSku / ASIN を引き継いで SKU 監査へ移動します。
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold leading-5 text-slate-500">
        JSON details は下の normalizedPayloadJson に保持しています。このカードは注文確認用の要約です。
      </div>
    </div>
  );
}

function AmazonSpApiCommitReadinessPanel(props: {
  job: ImportJobItem;
  state: AmazonSpApiCommitReadinessState;
}) {
  const { job, state } = props;

  if (!isAmazonSpApiOrdersImportJob(job)) return null;

  const data = state.data;
  const canCommit = data?.canCommit === true;
  const blockedReasons = Array.isArray(data?.commitBlockedReasons) ? data.commitBlockedReasons : [];
  const unresolvedSkuRows = Number(data?.unresolvedSkuRows || 0);
  const commitReadinessLabel = state.loading ? "CHECKING" : canCommit ? "READY" : "BLOCKED";
  const commitReasonLabel =
    !state.loading && !state.error && unresolvedSkuRows > 0
      ? `Reason: SKU未リンク ${unresolvedSkuRows.toLocaleString("ja-JP")}`
      : blockedReasons.length > 0
        ? `Reason: ${blockedReasons.map(formatAmazonSpApiReadinessReason).join(" / ")}`
        : "";

  return (
    <div
      data-testid={`amazon-sp-api-commit-readiness-panel-${job.id}`}
      className={`rounded-2xl border px-4 py-3 ${
        state.error
          ? "border-rose-200 bg-rose-50 text-rose-900"
          : canCommit
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-amber-200 bg-amber-50 text-amber-900"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-black text-slate-950">
            Amazon SP-API Commit Readiness
          </div>
          <div className="mt-1 text-xs font-bold leading-5 opacity-90">
            {state.loading
              ? "正式登録前チェックを読み込んでいます..."
              : state.error
                ? state.error
                : canCommit
                  ? "Commit readiness: READY。正式登録できる状態です。ただし Step141-G2B ではまだ書き込みません。"
                  : commitReasonLabel || "Commit readiness: BLOCKED。正式登録前チェックが未完了です。"}
          </div>
        </div>

        <span
          className={`inline-flex h-9 shrink-0 items-center justify-center rounded-xl border px-3 text-xs font-black shadow-sm ${
            state.loading
              ? "border-slate-200 bg-white text-slate-500"
              : canCommit
                ? "border-emerald-200 bg-white text-emerald-700"
                : "border-amber-200 bg-white text-amber-800"
          }`}
        >
          Commit readiness: {commitReadinessLabel}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-slate-700 sm:grid-cols-4">
        <div className="rounded-xl border border-white/80 bg-white px-3 py-2 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">Row Ready</div>
          <div className="mt-1 font-black text-slate-900">{Number(data?.readyRows || 0).toLocaleString("ja-JP")}</div>
        </div>
        <div className="rounded-xl border border-white/80 bg-white px-3 py-2 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">Row Blocked</div>
          <div className="mt-1 font-black text-slate-900">{Number(data?.blockedRows || 0).toLocaleString("ja-JP")}</div>
        </div>
        <div className="rounded-xl border border-white/80 bg-white px-3 py-2 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">SKU未リンク</div>
          <div className="mt-1 font-black text-slate-900">{Number(data?.unresolvedSkuRows || 0).toLocaleString("ja-JP")}</div>
        </div>
        <div className="rounded-xl border border-white/80 bg-white px-3 py-2 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">Rows</div>
          <div className="mt-1 font-black text-slate-900">{Number(data?.totalRows || 0).toLocaleString("ja-JP")}</div>
        </div>
      </div>

      {Number(data?.unresolvedSkuRows || 0) > 0 ? (
        <div className="mt-3">
          <div className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-bold leading-5 text-amber-900">
            SKU resolution bridge: Amazon sellerSku を既存の商品SKUまたは SKU Alias にリンクすると、
            この ImportJob の commit readiness が再評価可能になります。
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href={buildAmazonSpApiSkuResolutionHref({ importJobId: job.id })}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-950 px-3 text-xs font-black text-white shadow-sm transition hover:bg-slate-800"
            >
              SKU resolution を開始
            </a>
            <a
              href={buildImportCenterInventoryAuditHref(job.id)}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              在庫監査へ移動
            </a>
            <a
              href={buildImportCenterInventoryAlertsHref(job.id)}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-amber-200 bg-white px-3 text-xs font-black text-amber-800 shadow-sm transition hover:bg-amber-50"
            >
              在庫リスク確認
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}


function ImportJobDetailDrawer(props: {
  job: ImportJobItem | null;
  onClose: () => void;
  detailRowsState: ImportJobDetailFetchState;
}) {
  const { job, onClose, detailRowsState } = props;

  if (!job) return null;
  if (typeof document === "undefined") return null;

  const rows = formatRows(job);
  const statusLabel = getImportCenterStatusLabel(job);
  const statusClass = getImportCenterStatusClass(job);
  const sourceHref = buildImportJobSourceHref(job);
  const sourceActionLabel = getImportJobSourceActionLabel(job);
  const sourceActionHint = getImportJobSourceActionHint(job);
  const drawerActionToneClass = getDrawerActionToneClass(job);
  const drawerTone = getImportCenterJobTone(job);
  const [inventoryAuditSummaryState, setInventoryAuditSummaryState] =
    React.useState<ImportCenterInventoryAuditSummaryState>(
      EMPTY_IMPORT_CENTER_INVENTORY_AUDIT_SUMMARY
    );

  React.useEffect(() => {
    let cancelled = false;

    setInventoryAuditSummaryState({
      loading: true,
      error: "",
      summary: null,
    });

    listInventoryAuditIssuesForImportJob(job.id)
      .then((data) => {
        if (cancelled) return;

        setInventoryAuditSummaryState({
          loading: false,
          error: "",
          summary: summarizeInventoryAuditIssuesForImportJob(data),
        });
      })
      .catch((error) => {
        if (cancelled) return;

        setInventoryAuditSummaryState({
          loading: false,
          error: error instanceof Error ? error.message : String(error),
          summary: null,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [job.id]);

  const [amazonSpApiReadinessState, setAmazonSpApiReadinessState] =
    React.useState<AmazonSpApiCommitReadinessState>(
      EMPTY_AMAZON_SP_API_COMMIT_READINESS_STATE
    );

  React.useEffect(() => {
    let cancelled = false;

    if (!isAmazonSpApiOrdersImportJob(job)) {
      setAmazonSpApiReadinessState(EMPTY_AMAZON_SP_API_COMMIT_READINESS_STATE);
      return () => {
        cancelled = true;
      };
    }

    setAmazonSpApiReadinessState({
      loading: true,
      error: "",
      data: null,
    });

    readAmazonSpApiOrdersStagingCommitReadiness(job.id)
      .then((data) => {
        if (cancelled) return;

        setAmazonSpApiReadinessState({
          loading: false,
          error: "",
          data,
        });
      })
      .catch((error) => {
        if (cancelled) return;

        setAmazonSpApiReadinessState({
          loading: false,
          error: error instanceof Error ? error.message : String(error),
          data: null,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [job.id, job.sourceType]);

  const amazonSpApiReadinessRowsByStagingRowId = React.useMemo(() => {
    const map = new Map<string, AmazonSpApiOrdersStagingCommitReadinessRow>();

    for (const row of amazonSpApiReadinessState.data?.rows || []) {
      if (row.stagingRowId) map.set(row.stagingRowId, row);
    }

    return map;
  }, [amazonSpApiReadinessState.data]);

  const inventoryAuditSummary = inventoryAuditSummaryState.summary;
  const inventoryAuditHref = buildImportCenterInventoryAuditHref(job.id);
  const inventoryStatusHref = buildImportCenterInventoryStatusHref(job.id);
  const inventoryAlertsHref = buildImportCenterInventoryAlertsHref(job.id);

  return createPortal(
    <div className="fixed inset-y-0 left-[260px] right-0 z-[1000] pointer-events-none">
      <div
        role="button"
        tabIndex={-1}
        aria-label="ImportJob detail drawer を閉じる"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/25 pointer-events-auto"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[640px] flex-col border-l border-slate-200 bg-white shadow-2xl pointer-events-auto">
        <div className="border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                ImportJob Detail
              </div>
              <h3 className="mt-2 truncate text-xl font-black text-slate-950">
                {job.filename || "-"}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass}`}>
                  {statusLabel}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                  {getDomainLabel(job.domain, job.module)}
                </span>
                {job.sourceType ? (
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-500">
                    {getImportCenterSourceTypeLabel(job.sourceType)}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2 shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">
                    Imported
                  </div>
                  <div className={`mt-1 truncate text-xs font-black ${getImportedAtToneClass(job)}`}>
                    {getImportedAtLabel(job)}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2 shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">
                    Rows
                  </div>
                  <div className="mt-1 text-xs font-black text-slate-900">
                    {rows.label}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2 shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">
                    Success
                  </div>
                  <div className="mt-1 text-xs font-black text-emerald-700">
                    {rows.success.toLocaleString("ja-JP")}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2 shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">
                    Failed
                  </div>
                  <div className="mt-1 text-xs font-black text-rose-700">
                    {rows.failed.toLocaleString("ja-JP")}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-black text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
            >
              ×
            </button>
          </div>

          <div className={`mt-4 rounded-2xl border px-4 py-3 ${drawerActionToneClass}`}>
            <div className="text-sm font-black">
              {getImportCenterJobHint(job)}
            </div>
            <div className="mt-1 text-xs font-semibold leading-5 opacity-90">
              {sourceActionHint}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={sourceHref}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-950 px-3 text-xs font-black text-white shadow-sm transition hover:bg-slate-800"
              >
                {sourceActionLabel}
              </a>
              <a
                href={`/ja/app/data/import?importJobId=${encodeURIComponent(job.id)}`}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Import Center で表示
              </a>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-200 bg-white px-6 py-4">
          <div
            data-testid={`import-center-inventory-audit-summary-${job.id}`}
            className={`rounded-2xl border px-4 py-3 ${getImportCenterInventoryAuditSummaryClass(
              inventoryAuditSummary
            )}`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-sm font-black text-slate-950">
                  Inventory Audit Summary
                </div>
                <div className="mt-1 text-xs font-bold leading-5 opacity-90">
                  {inventoryAuditSummaryState.loading
                    ? "在庫監査サマリーを読み込んでいます..."
                    : inventoryAuditSummaryState.error
                      ? inventoryAuditSummaryState.error
                      : formatImportCenterInventoryAuditSummaryLine(inventoryAuditSummary)}
                </div>
              </div>

              {hasImportCenterInventoryAuditSummary(inventoryAuditSummary) ? (
                <div className="flex shrink-0 flex-wrap gap-2">
                  <a
                    data-testid={`import-center-inventory-audit-link-${job.id}`}
                    href={inventoryAuditHref}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-950 px-3 text-xs font-black text-white shadow-sm transition hover:bg-slate-800"
                  >
                    在庫監査へ移動
                  </a>
                  <a
                    data-testid={`import-center-inventory-status-link-${job.id}`}
                    href={inventoryStatusHref}
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    在庫状況へ
                  </a>
                  <a
                    data-testid={`import-center-inventory-alerts-link-${job.id}`}
                    href={inventoryAlertsHref}
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-black text-rose-800 shadow-sm transition hover:bg-rose-100"
                  >
                    在庫リスクへ
                  </a>
                </div>
              ) : (
                <span className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-500">
                  対象なし
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 pb-24">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailField label="ImportJob ID" value={job.id} mono />
            <DetailField label="Company ID" value={job.companyId} mono />
            <DetailField label="Domain" value={job.domain} />
            <DetailField label="Module" value={getImportCenterModuleLabel(job.module)} />
            <DetailField label="Source Type" value={getImportCenterSourceTypeLabel(job.sourceType)} />
            <DetailField label="Status" value={job.status} />
            <DetailField label="Total Rows" value={rows.label} />
            <DetailField label="Rows Breakdown" value={rows.detail} />
            <DetailField label="Deleted Rows" value={Number(job.deletedRowCount || 0).toLocaleString("ja-JP")} />
            <DetailField label="Month Conflict Policy" value={job.monthConflictPolicy || "-"} />
            <DetailField label="Imported At" value={getImportedAtLabel(job)} />
            <DetailField label="Updated At" value={fmtDate(job.updatedAt)} />
            <DetailField label="Created At" value={fmtDate(job.createdAt)} />
            <DetailField label="File Hash" value={job.fileHash || "-"} mono />
          </div>

          <div className="mt-5 space-y-4">
            <div
              className={`rounded-2xl border p-4 ${
                drawerTone === "danger"
                  ? "border-rose-200 bg-rose-50"
                  : drawerTone === "pendingPreview"
                    ? "border-sky-200 bg-sky-50"
                    : drawerTone === "warning"
                      ? "border-amber-200 bg-amber-50"
                      : "border-slate-200 bg-slate-50"
              }`}
            >
              <div
                className={`text-sm font-black ${
                  drawerTone === "danger"
                    ? "text-rose-900"
                    : drawerTone === "pendingPreview"
                      ? "text-sky-900"
                      : drawerTone === "warning"
                        ? "text-amber-900"
                        : "text-slate-900"
                }`}
              >
                Operation Guidance
              </div>
              <div
                className={`mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 ${
                  drawerTone === "danger"
                    ? "text-rose-700"
                    : drawerTone === "pendingPreview"
                      ? "text-sky-700"
                      : drawerTone === "warning"
                        ? "text-amber-700"
                        : "text-slate-600"
                }`}
              >
                {drawerTone === "danger"
                  ? job.errorMessage || "取込エラーがあります。CSV形式・日付・金額・必須項目を元ページで確認してください。"
                  : drawerTone === "pendingPreview"
                    ? "検証済みですが、正式登録は未完了です。元ページで再検証し、正式登録まで進めてください。"
                    : drawerTone === "warning"
                      ? "登録対象が0件です。重複・スキップ条件・対象月を確認してください。"
                      : job.errorMessage || "登録済みデータと trace 明細を確認できます。"}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <JsonPayloadDetails
                title="File Months"
                value={job.fileMonthsJson}
              />
              <JsonPayloadDetails
                title="Conflict Months"
                value={job.conflictMonthsJson}
                tone="light"
              />
            </div>

            <DetailDataStateCard
              title={`Staging Rows (${detailRowsState.stagingRows.length})`}
              loading={detailRowsState.loading}
              error={detailRowsState.error}
              empty={detailRowsState.stagingRows.length === 0}
            >
              <div className="space-y-3">
                {detailRowsState.stagingRows.slice(0, 12).map((row) => (
                  <div
                    key={row.id}
                    className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-black text-slate-900">
                          Row #{row.rowNo ?? "-"}
                        </div>
                        <div className="mt-1 text-[11px] font-bold text-slate-500">
                          {row.module || "-"} / {row.businessMonth || "-"}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-black text-slate-600">
                          {row.businessMonth || "-"}
                        </span>
                        <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-black text-sky-700">
                          {row.matchStatus || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <CopyFriendlyId label="Target Entity" value={row.targetEntityId} />
                      <CopyFriendlyId label="Dedupe Hash" value={row.dedupeHash} />
                    </div>

                    <AmazonSpApiStagingRowSummaryCard
                      importJobId={job.id}
                      row={row}
                      readinessRow={amazonSpApiReadinessRowsByStagingRowId.get(row.id) || null}
                    />

                    <div className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold leading-5 text-slate-600">
                      Target: <span className="font-black">{row.targetEntityType || "-"}</span>
                      {row.matchReason ? (
                        <span className="ml-2 text-slate-500">{row.matchReason}</span>
                      ) : null}
                    </div>

                    <div className="mt-3 space-y-2">
                      <JsonPayloadDetails
                        title="normalizedPayloadJson"
                        value={row.normalizedPayloadJson}
                      />
                      <JsonPayloadDetails
                        title="rawPayloadJson"
                        value={row.rawPayloadJson}
                        tone="light"
                      />
                    </div>
                  </div>
                ))}

                {detailRowsState.stagingRows.length > 12 ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-700">
                    先頭12件のみ表示しています。全 {detailRowsState.stagingRows.length} 件。詳細確認が必要な場合は対象CSVまたは後続のページング対応で確認します。
                  </div>
                ) : null}
              </div>
            </DetailDataStateCard>

            <DetailDataStateCard
              title={`Transaction Trace (${detailRowsState.transactions.length})`}
              loading={detailRowsState.loading}
              error={detailRowsState.error}
              empty={detailRowsState.transactions.length === 0}
            >
              <div className="space-y-3">
                {detailRowsState.transactions.slice(0, 12).map((tx) => (
                  <div
                    key={tx.id}
                    className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-black text-slate-950">
                          {Number(tx.amount || 0).toLocaleString("ja-JP")} JPY
                        </div>
                        <div className="mt-1 text-[11px] font-bold text-slate-500">
                          {fmtDate(tx.occurredAt)} / {tx.businessMonth || "-"}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-black text-slate-600">
                          {tx.type || "-"}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-black text-slate-600">
                          {tx.direction || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <CopyFriendlyId label="Transaction ID" value={tx.id} />
                      <CopyFriendlyId label="ImportJob ID" value={tx.importJobId} />
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                        Source Row: <span className="font-black">{tx.sourceRowNo ?? "-"}</span>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                        Business Month: <span className="font-black">{tx.businessMonth || "-"}</span>
                      </div>
                    </div>

                    {tx.memo ? (
                      <div className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold leading-5 text-slate-500">
                        {tx.memo}
                      </div>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={buildTransactionTraceHref(job, tx)}
                        className="inline-flex h-8 items-center justify-center rounded-xl bg-slate-950 px-3 text-[11px] font-black text-white shadow-sm transition hover:bg-slate-800"
                      >
                        関連明細へ移動
                      </a>
                      <span className="inline-flex h-8 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-3 text-[11px] font-black text-sky-700">
                        遷移先を自動判定
                      </span>
                    </div>
                  </div>
                ))}

                {detailRowsState.transactions.length > 12 ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-700">
                    先頭12件のみ表示しています。全 {detailRowsState.transactions.length} 件。関連明細への遷移は表示中の trace から実行できます。
                  </div>
                ) : null}
              </div>
            </DetailDataStateCard>

            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-4">
              <div className="text-sm font-black text-slate-900">Detail API</div>
              <div className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                H11-N で Import Center trace navigation の最終回帰は完了済みです。
                Staging Rows と Transaction Trace から、登録結果と関連明細への遷移を確認できます。
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
          >
            閉じる
          </button>
        </div>
      </aside>
    </div>,
    document.body
  );
}

export function ImportJobsTableCard(props: {
  jobs: ImportJobItem[];
}) {
  const [query, setQuery] = React.useState("");
  const [domainFilter, setDomainFilter] = React.useState("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [sourceTypeFilter, setSourceTypeFilter] = React.useState("ALL");
  const [selectedJob, setSelectedJob] = React.useState<ImportJobItem | null>(null);
  const [selectedJobId, setSelectedJobId] = React.useState<string | null>(null);
  const [detailRowsState, setDetailRowsState] = React.useState<ImportJobDetailFetchState>(
    EMPTY_IMPORT_JOB_DETAIL_FETCH_STATE
  );
  const appliedUrlImportJobIdRef = React.useRef<string | null>(null);

  const domains = React.useMemo(() => uniqueDomains(props.jobs), [props.jobs]);

  const sourceTypes = React.useMemo(() => uniqueImportCenterSourceTypes(props.jobs), [props.jobs]);
  const amazonSpApiOrdersJobCount = React.useMemo(
    () => getAmazonSpApiOrdersJobCount(props.jobs),
    [props.jobs]
  );

  const openImportJobDetail = React.useCallback((job: ImportJobItem) => {
    appliedUrlImportJobIdRef.current = job.id;
    setSelectedJob((current) => (current?.id === job.id ? current : job));
    setSelectedJobId((current) => (current === job.id ? current : job.id));
    syncImportJobIdToUrl(job.id);
  }, []);

  const closeImportJobDetail = React.useCallback(() => {
    appliedUrlImportJobIdRef.current = null;
    setSelectedJob(null);
    setSelectedJobId(null);
    setDetailRowsState(EMPTY_IMPORT_JOB_DETAIL_FETCH_STATE);
    syncImportJobIdToUrl(null);
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    if (!selectedJob?.id) {
      setDetailRowsState(EMPTY_IMPORT_JOB_DETAIL_FETCH_STATE);
      return;
    }

    setDetailRowsState({
      loading: true,
      error: null,
      stagingRows: [],
      transactions: [],
    });

    fetchImportJobDetailRows(selectedJob.id)
      .then((data) => {
        if (cancelled) return;
        setDetailRowsState({
          loading: false,
          error: null,
          stagingRows: data.stagingRows,
          transactions: data.transactions,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setDetailRowsState({
          loading: false,
          error: error instanceof Error ? error.message : "detail rows request failed",
          stagingRows: [],
          transactions: [],
        });
      });

    return () => {
      cancelled = true;
    };
  }, [selectedJob?.id]);

  React.useEffect(() => {
    const selectionInfo = readImportCenterUrlSelectionInfo();
    const importJobId = selectionInfo.importJobId;

    if (!importJobId) {
      return;
    }

    setSelectedJobId((current) => (current === importJobId ? current : importJobId));

    const targetJob = props.jobs.find((job) => job.id === importJobId) || null;
    if (!targetJob) {
      setSelectedJob(null);
      return;
    }

    const shouldAutoOpenAmazonSpApiOrdersDrawer =
      targetJob.sourceType === "amazon-sp-api-orders";

    if (!selectionInfo.shouldAutoOpenDrawer && !shouldAutoOpenAmazonSpApiOrdersDrawer) {
      // Step109-Z1-H26-B-FIX-ORDINARY-URL-DETAIL-DRAWER:
      // Ordinary ?importJobId= URLs should highlight the row only on page load.
      // Do not clear selectedJob here after the user manually clicks 詳細;
      // otherwise the URL effect immediately closes the drawer again.
      return;
    }

    if (appliedUrlImportJobIdRef.current === importJobId) {
      return;
    }

    appliedUrlImportJobIdRef.current = importJobId;
    setSelectedJob(targetJob);
  }, [props.jobs]);

  const filteredJobs = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    return props.jobs.filter((job) => {
      const domain = String(job.domain || "").trim();
      const status = getStatusFilterValue(job);
      const sourceType = String(job.sourceType || "").trim();

      if (domainFilter !== "ALL" && domain !== domainFilter) return false;
      if (statusFilter !== "ALL" && status !== statusFilter) return false;
      if (sourceTypeFilter !== "ALL" && sourceType !== sourceTypeFilter) return false;

      if (!q) return true;

      const haystack = [
        job.id,
        job.filename,
        job.domain,
        job.module,
        job.sourceType,
        job.status,
        job.importedAt,
        job.errorMessage,
      ]
        .map((x) => String(x || "").toLowerCase())
        .join(" ");

      return haystack.includes(q);
    });
  }, [domainFilter, props.jobs, query, sourceTypeFilter, statusFilter]);

  const summary = React.useMemo(() => summarizeJobs(filteredJobs), [filteredJobs]);

  const selectedJobExists = React.useMemo(
    () => Boolean(selectedJobId && props.jobs.some((job) => job.id === selectedJobId)),
    [props.jobs, selectedJobId]
  );

  const selectedJobVisibleInFilteredJobs = React.useMemo(
    () => Boolean(selectedJobId && filteredJobs.some((job) => job.id === selectedJobId)),
    [filteredJobs, selectedJobId]
  );

  const selectedJobHiddenByFilter = Boolean(
    selectedJobId && selectedJobExists && !selectedJobVisibleInFilteredJobs
  );

  const hasActiveImportJobListFilters = Boolean(
    query.trim() || domainFilter !== "ALL" || statusFilter !== "ALL" || sourceTypeFilter !== "ALL"
  );

  function clearImportJobListFilters() {
    setQuery("");
    setDomainFilter("ALL");
    setStatusFilter("ALL");
    setSourceTypeFilter("ALL");
  }

  function showAmazonSpApiOrdersOnly() {
    setQuery("");
    setDomainFilter("ALL");
    setStatusFilter("ALL");
    setSourceTypeFilter("amazon-sp-api-orders");
  }

  function clearImportJobSelectionOnly() {
    setSelectedJob(null);
    setSelectedJobId(null);
    syncImportJobIdToUrl(null);
  }


  return (
    <section className="ls-card-solid rounded-[28px] p-5 xl:col-span-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">Import Job List</div>
          <div className="mt-1 text-[12px] text-slate-500">
            ImportJob の状態・件数・未正式登録を確認できます
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            表示 {filteredJobs.length.toLocaleString("ja-JP")} / 全 {props.jobs.length.toLocaleString("ja-JP")}
          </span>
          {amazonSpApiOrdersJobCount > 0 ? (
            <button
              data-testid="import-center-amazon-sp-api-orders-quick-filter"
              type="button"
              onClick={showAmazonSpApiOrdersOnly}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700 transition hover:bg-emerald-100"
            >
              Amazon SP-API Orders {amazonSpApiOrdersJobCount.toLocaleString("ja-JP")}
            </button>
          ) : null}
          {summary.pendingPreview > 0 ? (
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700">
              未正式登録 {summary.pendingPreview.toLocaleString("ja-JP")}
            </span>
          ) : null}
          {summary.danger > 0 ? (
            <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
              失敗 {summary.danger.toLocaleString("ja-JP")}
            </span>
          ) : null}
          {selectedJobId ? (
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700">
              選択中 {selectedJobId.slice(0, 8)}... / 詳細ボタンで開く
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_220px]">
        <label className="block">
          <span className="sr-only">ImportJob search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ファイル名・ドメイン・エラー内容で検索"
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          />
        </label>

        <label className="block">
          <span className="sr-only">Domain filter</span>
          <select
            value={domainFilter}
            onChange={(event) => setDomainFilter(event.target.value)}
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          >
            <option value="ALL">すべてのドメイン</option>
            {domains.map((domain) => (
              <option key={domain} value={domain}>
                {getDomainLabel(domain)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="sr-only">Status filter</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          >
            <option value="ALL">すべての状態</option>
            <option value="SUCCEEDED">成功</option>
            <option value="ZERO_REGISTERED">登録0件</option>
            <option value="FAILED">失敗</option>
            <option value="PENDING_PREVIEW">未正式登録</option>
            <option value="PROCESSING">処理中</option>
            <option value="PENDING">待機中</option>
          </select>
        </label>

        <label className="block">
          <span className="sr-only">Source type filter</span>
          <select
            data-testid="import-center-source-type-filter"
            value={sourceTypeFilter}
            onChange={(event) => setSourceTypeFilter(event.target.value)}
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          >
            <option value="ALL">すべての取込種別</option>
            {sourceTypes.map((sourceType) => (
              <option key={sourceType} value={sourceType}>
                {getImportCenterSourceTypeLabel(sourceType)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
          <div className="text-[11px] font-bold text-emerald-700">成功</div>
          <div className="mt-1 text-lg font-black text-emerald-900">{summary.success}</div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <div className="text-[11px] font-bold text-amber-700">登録0件</div>
          <div className="mt-1 text-lg font-black text-amber-900">{summary.warning}</div>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3">
          <div className="text-[11px] font-bold text-rose-700">失敗</div>
          <div className="mt-1 text-lg font-black text-rose-900">{summary.danger}</div>
        </div>
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3">
          <div className="text-[11px] font-bold text-sky-700">未正式登録</div>
          <div className="mt-1 text-lg font-black text-sky-900">{summary.pendingPreview}</div>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-3">
          <div className="text-[11px] font-bold text-violet-700">処理中</div>
          <div className="mt-1 text-lg font-black text-violet-900">{summary.processing}</div>
        </div>
      </div>

      {selectedJobId && !selectedJobExists ? (
        <div className="mt-5 rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
          <div>URL で指定された ImportJob ID は現在の一覧に見つかりません。</div>
          <div className="mt-1 text-xs font-semibold text-amber-700">
            履歴更新、対象データ、または別環境の ImportJob ID ではないか確認してください。
          </div>
          <button
            type="button"
            onClick={clearImportJobSelectionOnly}
            className="mt-3 inline-flex h-8 items-center justify-center rounded-xl border border-amber-200 bg-white px-3 text-[11px] font-black text-amber-800 shadow-sm transition hover:bg-amber-50"
          >
            選択解除
          </button>
        </div>
      ) : null}

      {selectedJobHiddenByFilter ? (
        <div className="mt-5 rounded-[22px] border border-sky-200 bg-sky-50 p-4 text-sm font-bold leading-6 text-sky-800">
          <div>
            選択中の ImportJob は現在の検索条件・フィルターでは非表示です。
          </div>
          <div className="mt-1 text-xs font-semibold text-sky-700">
            選択中 {selectedJobId?.slice(0, 8)}... を表示するには、検索条件またはフィルターを解除してください。
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={clearImportJobListFilters}
              className="inline-flex h-8 items-center justify-center rounded-xl bg-sky-700 px-3 text-[11px] font-black text-white shadow-sm transition hover:bg-sky-800"
            >
              フィルター解除
            </button>
            <button
              type="button"
              onClick={clearImportJobSelectionOnly}
              className="inline-flex h-8 items-center justify-center rounded-xl border border-sky-200 bg-white px-3 text-[11px] font-black text-sky-800 shadow-sm transition hover:bg-sky-50"
            >
              選択解除
            </button>
          </div>
        </div>
      ) : null}

      {sourceTypeFilter === "amazon-sp-api-orders" ? (
        <div
          data-testid="import-center-amazon-sp-api-orders-filter-active"
          className="mt-5 rounded-[22px] border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-900"
        >
          <div>Amazon SP-API Orders の ImportJob だけを表示しています。</div>
          <div className="mt-1 text-xs font-semibold text-emerald-700">
            注文取得後の ImportJob を選択し、詳細から Amazon注文番号 / sellerSku / ASIN / 金額を確認できます。
          </div>
          <button
            type="button"
            onClick={clearImportJobListFilters}
            className="mt-3 inline-flex h-8 items-center justify-center rounded-xl border border-emerald-200 bg-white px-3 text-[11px] font-black text-emerald-800 shadow-sm transition hover:bg-emerald-100"
          >
            フィルター解除
          </button>
        </div>
      ) : null}

      {props.jobs.length === 0 ? (
        <div className="mt-5 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <div className="text-sm font-bold text-slate-700">ImportJob はまだありません。</div>
          <div className="mt-2 text-xs font-semibold leading-5 text-slate-500">
            収入・支出・Amazon 注文などの CSV/Excel 取込を実行すると、ここに履歴が表示されます。
          </div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="mt-5 rounded-[22px] border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-700">
          <div>条件に一致する ImportJob はありません。検索条件またはフィルターを変更してください。</div>
          {selectedJobId ? (
            <div className="mt-2 text-xs font-semibold text-amber-700">
              選択中の ImportJob がある場合は、上の「フィルター解除」または「選択解除」を使用してください。
            </div>
          ) : null}
          {hasActiveImportJobListFilters ? (
            <button
              type="button"
              onClick={clearImportJobListFilters}
              className="mt-3 inline-flex h-8 items-center justify-center rounded-xl bg-amber-700 px-3 text-[11px] font-black text-white shadow-sm transition hover:bg-amber-800"
            >
              検索条件をクリア
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-[22px] border border-slate-200 bg-white">
          <div className="hidden grid-cols-[minmax(0,1.35fr)_150px_170px_160px] gap-4 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500 lg:grid">
            <div>ファイル / 種別</div>
            <div>状態</div>
            <div>件数</div>
            <div>登録 / 更新</div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredJobs.map((job) => {
              const rows = formatRows(job);

              return (
                <div
                  key={job.id}
                  className={`grid gap-3 px-4 py-4 text-sm transition lg:grid-cols-[minmax(0,1.35fr)_150px_170px_160px] lg:gap-4 ${getImportCenterRowClass(job)} ${getSelectedImportJobRowClass(job, selectedJobId)}`}
                >
                  <div className="min-w-0">
                    <div className="truncate font-bold text-slate-900">
                      {job.filename || "-"}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600">
                        {getDomainLabel(job.domain, job.module)}
                      </span>
                      {job.module ? (
                        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                          {getImportCenterModuleLabel(job.module)}
                        </span>
                      ) : null}
                      {job.sourceType ? (
                        <span
                          data-testid={isAmazonSpApiOrdersImportJob(job) ? "import-center-amazon-sp-api-orders-badge" : undefined}
                          className={`rounded-full border px-2 py-0.5 text-[11px] font-black ${getImportCenterSourceTypeBadgeClass(job.sourceType)}`}
                        >
                          {getImportCenterSourceTypeLabel(job.sourceType)}
                        </span>
                      ) : null}
                      <span className="font-mono text-[11px] font-semibold text-slate-400">
                        {job.id ? `${job.id.slice(0, 8)}...` : "-"}
                      </span>
                    </div>
                    <div className="mt-2 line-clamp-2 text-xs font-semibold text-slate-500">
                      {getImportCenterJobHint(job)}
                    </div>
                    {selectedJobId === job.id && !selectedJob ? (
                      <div className="mt-2 inline-flex rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-black text-sky-700">
                        URLで選択中。詳細ボタンで開けます。
                      </div>
                    ) : null}
                    {isAmazonSpApiOrdersImportJob(job) ? (
                      <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold leading-5 text-emerald-800">
                        Amazon注文取得済み。詳細で Amazon注文番号 / sellerSku / ASIN / 金額を確認できます。
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <div className="mb-1 text-[11px] font-bold text-slate-400 lg:hidden">
                      状態
                    </div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getImportCenterStatusClass(job)}`}>
                      {getImportCenterStatusLabel(job)}
                    </span>
                    <div className="mt-1 text-[11px] font-semibold text-slate-400">
                      raw: {job.status || "-"}
                    </div>
                    <button
                      type="button"
                      onClick={() => openImportJobDetail(job)}
                      className="mt-2 inline-flex h-8 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      詳細
                    </button>
                  </div>

                  <div>
                    <div className="mb-1 text-[11px] font-bold text-slate-400 lg:hidden">
                      件数
                    </div>
                    <div className="font-bold text-slate-800">{rows.label}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">
                      {rows.detail}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 text-[11px] font-bold text-slate-400 lg:hidden">
                      登録 / 更新
                    </div>
                    <div className={`font-bold ${getImportedAtToneClass(job)}`}>
                      登録: {getImportedAtLabel(job)}
                    </div>
                    <div className="mt-1 text-[11px] font-semibold text-slate-500">
                      更新: {fmtDate(job.updatedAt)}
                    </div>
                    <div className="mt-0.5 text-[11px] font-semibold text-slate-400">
                      作成: {fmtDate(job.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ImportJobDetailDrawer
        job={selectedJob}
        onClose={closeImportJobDetail}
        detailRowsState={detailRowsState}
      />
    </section>
  );
}
