"use client";

import { AmazonSpApiConnectionStatusPanel } from "@/components/app/imports/AmazonSpApiConnectionStatusPanel";
import { AmazonSpApiOrdersDryRunPreviewPanel } from "@/components/app/imports/AmazonSpApiOrdersDryRunPreviewPanel";
import { AmazonSpApiOrdersProductionCloseoutPanel } from "@/components/app/imports/AmazonSpApiOrdersProductionCloseoutPanel";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import {
  preflightAmazonSpApiOrdersGuardedImport,
  previewAmazonSpApiOrdersReal,
  commitAmazonSpApiOrdersRealImportJob,
  listAmazonImportedOrders,
  getAmazonImportedOrderDetail,
  readAmazonSpApiOrdersStagingCommitReadiness,
  readAmazonSpApiOrdersTransactionDryRunProjection,
  readAmazonSpApiOrdersInventoryDryRunProjection,
  readAmazonSpApiOrdersCombinedDryRunProjection,
  readAmazonSpApiOrdersFinalCommitReview,
  type AmazonSpApiOrdersGuardedImportPreflightResponse,
  type AmazonSpApiOrdersRealPreviewResponse,
  type AmazonSpApiOrdersRealImportJobCommitResponse,
  type AmazonImportedOrdersReadModelListResponse,
  type AmazonImportedOrderDetailReadModelResponse,
  type AmazonSpApiOrdersStagingCommitReadinessResponse,
  type AmazonSpApiOrdersTransactionDryRunProjectionResponse,
  type AmazonSpApiOrdersInventoryDryRunProjectionResponse,
  type AmazonSpApiOrdersCombinedDryRunProjectionResponse,
  type AmazonSpApiOrdersFinalCommitReviewResponse,
} from "@/core/imports/api";
import {
  loadImportJobsPageSnapshot,
  type ImportJobItem,
  type ImportMetaResponse,
} from "@/core/jobs";
import { fmtDate, JobsMetricCard } from "@/components/app/jobs/jobs-shared";
import { JobsLoadingState } from "@/components/app/jobs/JobsLoadingState";
import { JobsErrorState } from "@/components/app/jobs/JobsErrorState";
import { ImportJobsHero } from "@/components/app/jobs/ImportJobsHero";
import { ImportJobsTableCard } from "@/components/app/jobs/ImportJobsTableCard";
import { ImportJobsMetaSummaryCard } from "@/components/app/jobs/ImportJobsMetaSummaryCard";
import { ImportWorkspaceShell } from "@/components/app/imports/ImportWorkspaceShell";
import { AmazonSpApiSandboxReadModelPanelShell } from "@/components/app/imports/AmazonSpApiSandboxReadModelPanelShell";

// Step151-B-FETCH-BUTTON-EXECUTION-CONTRACT:
// Frontend-only guarded execution contract for the connected-service「取得」button.
// This does not call preview/import/sync execution endpoints or any write endpoint.
type AmazonOrdersFetchExecutionContractStatus =
  | "idle"
  | "preflight_required"
  | "preflight_checking"
  | "preflight_ready"
  | "preview_required"
  | "confirmation_required"
  | "blocked";

type AmazonOrdersPullRangePreset = "7D" | "30D" | "90D" | "365D" | "CUSTOM";

const AMAZON_ORDERS_FETCH_EXECUTION_CONTRACT_STEPS = [
  {
    key: "preflight_required",
    label: "1. 事前確認",
    description: "会社・店舗・marketplace・取得期間・接続状態を確認します。",
  },
  {
    key: "preflight_checking",
    label: "1.5 事前確認中",
    description: "preflight endpoint で接続状態と取得条件を確認中です。",
  },
  {
    key: "preflight_ready",
    label: "1.6 事前確認OK",
    description: "preflight が READY_FOR_PREVIEW を返しました。プレビュー確認へ進めます。",
  },
  {
    key: "preview_required",
    label: "2. プレビュー",
    description: "real-preview API で取得予定の注文・明細を確認します。",
  },
  {
    key: "confirmation_required",
    label: "3. 明示確認",
    description: "ユーザー確認後に ImportJob / ImportStagingRow を作成します。",
  },
  {
    key: "blocked",
    label: "4. 実行ガード",
    description: "重複実行・未確認実行・範囲未固定・DB書き込みをブロックします。",
  },
] as const;


function AmazonOrdersConnectedServicesShell({
  onFetchShell,
  onPreviewShell,
  onImportCommitShell,
  amazonOrdersPullRangePreset,
  amazonOrdersCustomStartDate,
  amazonOrdersCustomEndDate,
  amazonOrdersImportedReadModelPageSize,
  amazonOrdersImportedReadModelPageIndex,
  amazonOrdersImportedReadModelContentSearch,
  onAmazonOrdersPullRangePresetChange,
  onAmazonOrdersCustomStartDateChange,
  onAmazonOrdersCustomEndDateChange,
  onAmazonOrdersImportedReadModelPageSizeChange,
  onAmazonOrdersImportedReadModelFirstPage,
  onAmazonOrdersImportedReadModelContentSearchChange,
  onAmazonOrdersImportedReadModelPrevPage,
  onAmazonOrdersImportedReadModelNextPage,
  onAmazonOrdersImportedReadModelLastPage,
  fetchShellMessage,
  executionContractStatus,
  preflightResult,
  preflightError,
  realPreviewResult,
  realPreviewLoading,
  realPreviewError,
  realImportJobCommitResult,
  realImportJobCommitLoading,
  realImportJobCommitError,
  importedReadModelList,
  importedReadModelDetail,
  importedReadModelLoading,
  importedReadModelError,
  importedReadModelSelectedOrderId,
  stagingCommitReadiness,
  stagingCommitReadinessLoading,
  stagingCommitReadinessError,
  transactionDryRunProjection,
  transactionDryRunProjectionLoading,
  transactionDryRunProjectionError,
  inventoryDryRunProjection,
  combinedDryRunProjection,
  combinedDryRunProjectionLoading,
  combinedDryRunProjectionError,
  finalCommitReview,
  finalCommitReviewLoading,
  finalCommitReviewError,
  onImportedReadModelRefresh,
  onImportedReadModelOpenDetail,
  onStagingCommitReadinessRefresh,
  onTransactionDryRunProjectionRefresh,
  onCombinedDryRunProjectionRefresh,
  onFinalCommitReviewRefresh,
}: {
  onFetchShell: () => void;
  onPreviewShell: () => void;
  onImportCommitShell: () => void;
  amazonOrdersPullRangePreset: AmazonOrdersPullRangePreset;
  amazonOrdersCustomStartDate: string;
  amazonOrdersCustomEndDate: string;
  amazonOrdersImportedReadModelPageSize: 20 | 50 | 100;
  amazonOrdersImportedReadModelPageIndex: number;
  amazonOrdersImportedReadModelContentSearch: string;
  onAmazonOrdersPullRangePresetChange: (value: AmazonOrdersPullRangePreset) => void;
  onAmazonOrdersCustomStartDateChange: (value: string) => void;
  onAmazonOrdersCustomEndDateChange: (value: string) => void;
  onAmazonOrdersImportedReadModelPageSizeChange: (value: 20 | 50 | 100) => void;
  onAmazonOrdersImportedReadModelFirstPage: () => void;
  onAmazonOrdersImportedReadModelContentSearchChange: (value: string) => void;
  onAmazonOrdersImportedReadModelPrevPage: () => void;
  onAmazonOrdersImportedReadModelNextPage: () => void;
  onAmazonOrdersImportedReadModelLastPage: () => void;
  onImportedReadModelRefresh: () => void;
  onImportedReadModelOpenDetail: (orderId: string) => void;
  onStagingCommitReadinessRefresh: () => void;
  onTransactionDryRunProjectionRefresh: () => void;
  onCombinedDryRunProjectionRefresh: () => void;
  onFinalCommitReviewRefresh: () => void;
  fetchShellMessage: string;
  executionContractStatus: AmazonOrdersFetchExecutionContractStatus;
  preflightResult: AmazonSpApiOrdersGuardedImportPreflightResponse | null;
  preflightError: string;
  realPreviewResult: AmazonSpApiOrdersRealPreviewResponse | null;
  realPreviewLoading: boolean;
  realPreviewError: string;
  realImportJobCommitResult: AmazonSpApiOrdersRealImportJobCommitResponse | null;
  realImportJobCommitLoading: boolean;
  realImportJobCommitError: string;
  importedReadModelList: AmazonImportedOrdersReadModelListResponse | null;
  importedReadModelDetail: AmazonImportedOrderDetailReadModelResponse | null;
  importedReadModelLoading: boolean;
  importedReadModelError: string;
  importedReadModelSelectedOrderId: string;
  stagingCommitReadiness: AmazonSpApiOrdersStagingCommitReadinessResponse | null;
  stagingCommitReadinessLoading: boolean;
  stagingCommitReadinessError: string;
  transactionDryRunProjection: AmazonSpApiOrdersTransactionDryRunProjectionResponse | null;
  transactionDryRunProjectionLoading: boolean;
  transactionDryRunProjectionError: string;
  inventoryDryRunProjection: AmazonSpApiOrdersInventoryDryRunProjectionResponse | null;
  combinedDryRunProjection: AmazonSpApiOrdersCombinedDryRunProjectionResponse | null;
  combinedDryRunProjectionLoading: boolean;
  combinedDryRunProjectionError: string;
  finalCommitReview: AmazonSpApiOrdersFinalCommitReviewResponse | null;
  finalCommitReviewLoading: boolean;
  finalCommitReviewError: string;
}) {
  const importedReadModelOrders = importedReadModelList?.orders ?? [];
  const importedReadModelFirstOrder = importedReadModelOrders[0] ?? null;
  const amazonOrdersImportedReadModelTotalOrders =
    importedReadModelList?.summary?.totalOrders ?? importedReadModelOrders.length;
  const amazonOrdersImportedReadModelTotalPages = Math.max(
    1,
    Math.ceil(amazonOrdersImportedReadModelTotalOrders / amazonOrdersImportedReadModelPageSize),
  );
  const amazonOrdersImportedReadModelHasNext =
    importedReadModelList?.pagination?.hasMore === true &&
    Boolean(importedReadModelList?.pagination?.nextCursor);
  const amazonOrdersImportedReadModelHasPrev = amazonOrdersImportedReadModelPageIndex > 1;
  const importedReadModelDetailOrder =
    importedReadModelDetail?.order ?? importedReadModelDetail?.detail?.order ?? null;
  const importedReadModelDetailItems =
    importedReadModelDetail?.items ?? importedReadModelDetail?.detail?.items ?? [];
  const amazonOrdersFlowStatusLabel = importedReadModelDetail
    ? "明細確認済み"
    : importedReadModelList
      ? "取込完了"
      : realImportJobCommitResult
        ? "取込済み"
        : realPreviewResult
          ? "プレビュー済み"
          : preflightResult?.allowed
            ? "事前確認OK"
            : "取得準備";
  const amazonOrdersFlowStatusTone = importedReadModelDetail
    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
    : importedReadModelList
      ? "border-cyan-300 bg-cyan-50 text-cyan-700"
      : realImportJobCommitResult
        ? "border-violet-300 bg-violet-50 text-violet-700"
        : realPreviewResult
          ? "border-sky-300 bg-sky-50 text-sky-700"
          : preflightResult?.allowed
            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
            : "border-amber-200 bg-amber-50 text-amber-700";
  const stagingCommitReadinessRows = stagingCommitReadiness?.rows ?? [];
  const stagingCommitReadinessBlockedReasons = Array.from(
    new Set([
      ...(stagingCommitReadiness?.commitBlockedReasons ?? []),
      ...stagingCommitReadinessRows.flatMap((row) => row.blockers ?? []),
      ...stagingCommitReadinessRows.flatMap((row) => row.warnings ?? []),
    ]),
  );
  const stagingCommitReadinessPreviewRows = stagingCommitReadinessRows.slice(0, 5);
  const transactionProjectionDrafts = transactionDryRunProjection?.drafts ?? [];
  const transactionProjectionExcluded = transactionDryRunProjection?.excluded ?? [];
  const transactionProjectionPreviewDrafts = transactionProjectionDrafts.slice(0, 5);
  const transactionProjectionPreviewExcluded = transactionProjectionExcluded.slice(0, 5);
  const inventoryProjectionDrafts = inventoryDryRunProjection?.drafts ?? combinedDryRunProjection?.inventory?.drafts ?? [];
  const inventoryProjectionExcluded = inventoryDryRunProjection?.excluded ?? combinedDryRunProjection?.inventory?.excluded ?? [];
  const inventoryProjectionPreviewDrafts = inventoryProjectionDrafts.slice(0, 5);
  const inventoryProjectionPreviewExcluded = inventoryProjectionExcluded.slice(0, 5);
  const finalCommitReviewTransactionPreviewRows = finalCommitReview?.transactionDraftsPreview ?? [];
  const finalCommitReviewInventoryPreviewRows = finalCommitReview?.inventoryDraftsPreview ?? [];
  const finalCommitReviewBlockers = finalCommitReview?.blockers ?? [];
  const finalCommitReviewWarnings = finalCommitReview?.warnings ?? [];

  return (
    <section
      data-testid="data-import-connected-services-shell"
      className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-100"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Connected Services
          </div>
          <h2 className="mt-1 text-xl font-black text-slate-950">
            連携サービス一覧
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
            MoneyForward と同じ操作感で、連携済みサービスごとに取得状態・最終取得日時・明細一覧を確認します。
            Amazon注文は 事前確認 → プレビュー → 取込作成 → 取込済み明細確認 の順に進みます。
            Transaction / Inventory はまだ未反映です。
          </p>
        </div>

        <div
          data-testid="data-import-connected-services-default-range"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-800"
        >
          選択中：{amazonOrdersPullRangePreset === "CUSTOM" ? `${amazonOrdersCustomStartDate || "-"} 〜 ${amazonOrdersCustomEndDate || "-"}` : amazonOrdersPullRangePreset}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
        <div className="grid grid-cols-[minmax(260px,1.8fr)_150px_160px_140px_120px_120px] gap-0 bg-slate-50 text-xs font-black text-slate-500">
          <div className="border-r border-slate-200 px-4 py-3">連携サービス名</div>
          <div className="border-r border-slate-200 px-4 py-3 text-right">資産 / 対象</div>
          <div className="border-r border-slate-200 px-4 py-3">最終取得日時</div>
          <div className="border-r border-slate-200 px-4 py-3">取得状態</div>
          <div className="border-r border-slate-200 px-4 py-3 text-center">明細一覧</div>
          <div className="px-4 py-3 text-center">操作</div>
        </div>

        <div
          data-testid="data-import-connected-service-amazon-orders-row"
          className="grid grid-cols-[minmax(260px,1.8fr)_150px_160px_140px_120px_120px] gap-0 border-t border-slate-200 bg-white text-sm"
        >
          <div className="border-r border-slate-200 px-4 py-4">
            <div className="font-black text-slate-950">
              Amazon.co.jp（出品者アカウント）
            </div>
            <div className="mt-1 text-xs font-bold text-slate-500">
              注文・商品明細・SKU連携・在庫扣減準備
            </div>
            <div
              data-testid="data-import-connected-service-amazon-orders-range-rule"
              className="mt-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-600"
            >
              期間：7日 / 30日 / 90日 / 365日 / カスタム
            </div>
          </div>

          <div className="border-r border-slate-200 px-4 py-4 text-right font-bold text-slate-700">
            Orders
          </div>

          <div
            data-testid="data-import-connected-service-amazon-orders-last-fetched"
            className="border-r border-slate-200 px-4 py-4 text-xs font-bold leading-5 text-slate-600"
          >
            {importedReadModelList ? "取込済み明細を表示中" : realImportJobCommitResult ? "取込作成済み" : realPreviewResult ? "プレビュー済み" : preflightResult?.allowed ? "事前確認OK" : "未取得"}
          </div>

          <div className="border-r border-slate-200 px-4 py-4">
            <span
              data-testid="data-import-connected-service-amazon-orders-status"
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${amazonOrdersFlowStatusTone}`}
            >
              {amazonOrdersFlowStatusLabel}
            </span>
          </div>

          <div className="border-r border-slate-200 px-4 py-4 text-center">
            <a
              data-testid="data-import-connected-service-amazon-orders-view-link"
              href="/ja/app/data/import/amazon-orders"
              className="inline-flex rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-sky-700 shadow-sm hover:bg-sky-50"
            >
              閲覧
            </a>
          </div>

          <div className="px-4 py-4 text-center">
            <button
              data-testid="data-import-connected-service-amazon-orders-fetch-button"
              type="button"
              onClick={onFetchShell}
              title="Amazon注文の取得フローを開始します。事前確認後にプレビュー、明示確認後に ImportJob / ImportStagingRow を作成します。"
              className="inline-flex rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800"
            >
              取得
            </button>
          </div>
        </div>
      </div>

      {/* Step151-W-A-DATA-IMPORT-AMAZON-ORDERS-TABLE:
          MoneyForward-like Amazon order list on the Data Import page.
          Scope: ImportJob / ImportStagingRow / order read model display only.
          Must not create Transaction, Expense, InventoryMovement, settlement, or bank reconciliation records. */}
      <div
        data-testid="data-import-amazon-orders-mf-style-table-panel"
        className="mt-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
              Amazon Orders
            </div>
            <h3 className="mt-1 text-base font-black text-slate-950">
              Amazon注文 明細一覧
            </h3>
            <p
              data-testid="data-import-amazon-orders-mf-style-table-copy"
              className="mt-1 text-xs font-bold leading-5 text-slate-500"
            >
              API取得後に ImportJob / ImportStagingRow に保存された注文を表示します。ここでは注文表示のみ行い、收入・支出・在庫・銀行対帳への書き込みは行いません。
            </p>
          </div>
          <div
            data-testid="data-import-amazon-orders-mf-style-table-boundary"
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800"
          >
            displayOnly=true / writesDatabase=false
          </div>
        </div>

        <div
          data-testid="data-import-amazon-orders-mf-style-filter-bar"
          className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
        >
          <div className="grid gap-3 text-xs font-bold text-slate-700 md:grid-cols-[180px_140px_140px_120px_90px_120px_1fr_110px]">
            <label className="grid gap-1">
              <span className="font-black text-slate-500">連携サービス</span>
              <select
                data-testid="data-import-amazon-orders-mf-style-service-select"
                value="amazon"
                disabled
                className="rounded-lg border border-slate-200 bg-white px-2 py-2 font-bold text-slate-700"
              >
                <option value="amazon">Amazon.co.jp</option>
              </select>
            </label>

            <label className="grid gap-1">
              <span className="font-black text-slate-500">期間</span>
              <select
                data-testid="data-import-amazon-orders-mf-style-range-preset"
                value={amazonOrdersPullRangePreset}
                onChange={(event) =>
                  onAmazonOrdersPullRangePresetChange(event.target.value as AmazonOrdersPullRangePreset)
                }
                className="rounded-lg border border-slate-200 bg-white px-2 py-2 font-bold text-slate-700"
              >
                <option value="7D">過去7日</option>
                <option value="30D">過去30日</option>
                <option value="90D">過去90日</option>
                <option value="365D">過去365日</option>
                <option value="CUSTOM">カスタム</option>
              </select>
            </label>

            <label className="grid gap-1">
              <span className="font-black text-slate-500">開始日</span>
              <input
                data-testid="data-import-amazon-orders-mf-style-start-date"
                type="date"
                value={amazonOrdersCustomStartDate}
                onChange={(event) => onAmazonOrdersCustomStartDateChange(event.target.value)}
                disabled={amazonOrdersPullRangePreset !== "CUSTOM"}
                className="rounded-lg border border-slate-200 bg-white px-2 py-2 font-bold text-slate-700 disabled:bg-slate-100"
              />
            </label>

            <label className="grid gap-1">
              <span className="font-black text-slate-500">終了日</span>
              <input
                data-testid="data-import-amazon-orders-mf-style-end-date"
                type="date"
                value={amazonOrdersCustomEndDate}
                onChange={(event) => onAmazonOrdersCustomEndDateChange(event.target.value)}
                disabled={amazonOrdersPullRangePreset !== "CUSTOM"}
                className="rounded-lg border border-slate-200 bg-white px-2 py-2 font-bold text-slate-700 disabled:bg-slate-100"
              />
            </label>

            <div className="flex items-end">
              <button
                data-testid="data-import-amazon-orders-mf-style-apply-range-button"
                type="button"
                onClick={onImportedReadModelRefresh}
                disabled={importedReadModelLoading}
                className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-black text-sky-700 shadow-sm hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                表示
              </button>
            </div>

            <label className="grid gap-1">
              <span className="font-black text-slate-500">表示件数</span>
              <select
                data-testid="data-import-amazon-orders-mf-style-page-size"
                value={amazonOrdersImportedReadModelPageSize}
                onChange={(event) =>
                  onAmazonOrdersImportedReadModelPageSizeChange(Number(event.target.value) as 20 | 50 | 100)
                }
                className="rounded-lg border border-slate-200 bg-white px-2 py-2 font-bold text-slate-700"
              >
                <option value={20}>20件</option>
                <option value={50}>50件</option>
                <option value={100}>100件</option>
              </select>
            </label>

            <label className="grid gap-1">
              <span className="font-black text-slate-500">内容</span>
              <input
                data-testid="data-import-amazon-orders-mf-style-content-search"
                type="text"
                value={amazonOrdersImportedReadModelContentSearch}
                onChange={(event) => onAmazonOrdersImportedReadModelContentSearchChange(event.target.value)}
                placeholder="注文番号・SKU・商品名"
                className="rounded-lg border border-slate-200 bg-white px-2 py-2 font-bold text-slate-700"
              />
            </label>

            <div className="flex items-end">
              <button
                data-testid="data-import-amazon-orders-mf-style-search-button"
                type="button"
                onClick={onImportedReadModelRefresh}
                disabled={importedReadModelLoading}
                className="w-full rounded-xl bg-slate-800 px-3 py-2 text-xs font-black text-white shadow-sm hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {importedReadModelLoading ? "検索中" : "検索"}
              </button>
            </div>
          </div>
        </div>

        <div
          data-testid="data-import-amazon-orders-mf-style-selected-range"
          className="mt-3 rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-black text-sky-800"
        >
          表示対象期間：
          {amazonOrdersPullRangePreset === "CUSTOM"
            ? `${amazonOrdersCustomStartDate || "-"} 〜 ${amazonOrdersCustomEndDate || "-"}`
            : amazonOrdersPullRangePreset}
        </div>

        <div
          data-testid="data-import-amazon-orders-mf-style-summary"
          className="mt-3 grid gap-2 text-xs font-bold md:grid-cols-5"
        >
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            totalOrders={String(importedReadModelList?.summary?.totalOrders ?? 0)}
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            totalItems={String(importedReadModelList?.summary?.totalItems ?? 0)}
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            amountTotal={String(importedReadModelList?.summary?.amountTotal ?? "-")}
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            page={amazonOrdersImportedReadModelPageIndex}/{amazonOrdersImportedReadModelTotalPages}
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            readOnly={String(importedReadModelList?.readOnly ?? true)}
          </div>
        </div>

        {importedReadModelError ? (
          <div
            data-testid="data-import-amazon-orders-mf-style-error"
            className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800"
          >
            {importedReadModelError}
          </div>
        ) : null}

        <div
          data-testid="data-import-amazon-orders-mf-style-table-wrapper"
          className="mt-3 overflow-x-auto rounded-2xl border border-slate-200"
        >
          <table
            data-testid="data-import-amazon-orders-mf-style-table"
            className="min-w-[1080px] w-full border-collapse bg-white text-xs"
          >
            <thead className="bg-slate-100 text-left font-black text-slate-600">
              <tr>
                <th className="border-b border-r border-slate-200 px-3 py-2">日付</th>
                <th className="border-b border-r border-slate-200 px-3 py-2">内容</th>
                <th className="border-b border-r border-slate-200 px-3 py-2 text-right">金額</th>
                <th className="border-b border-r border-slate-200 px-3 py-2">連携サービス</th>
                <th className="border-b border-r border-slate-200 px-3 py-2">ステータス</th>
                <th className="border-b border-r border-slate-200 px-3 py-2">注文番号</th>
                <th className="border-b border-slate-200 px-3 py-2 text-center">詳細</th>
              </tr>
            </thead>
            <tbody>
              {importedReadModelOrders.length ? (
                importedReadModelOrders.map((order) => (
                  <tr
                    key={`${order.orderId}-${order.importJobId || "no-job"}`}
                    data-testid="data-import-amazon-orders-mf-style-table-row"
                    className="hover:bg-sky-50"
                  >
                    <td className="border-b border-r border-slate-100 px-3 py-2 font-bold text-slate-700">
                      {order.purchaseDate || "-"}
                    </td>
                    <td className="border-b border-r border-slate-100 px-3 py-2 font-bold text-slate-700">
                      <div className="line-clamp-2">{order.content || "-"}</div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        ImportJob={order.importJobId || "-"} / items={String(order.itemCount ?? 0)}
                      </div>
                    </td>
                    <td className="border-b border-r border-slate-100 px-3 py-2 text-right font-black text-slate-900">
                      {order.amount ?? "-"} {order.currency || ""}
                    </td>
                    <td className="border-b border-r border-slate-100 px-3 py-2 font-bold text-slate-700">
                      {order.service || "Amazon.co.jp"}
                    </td>
                    <td className="border-b border-r border-slate-100 px-3 py-2 font-bold text-slate-700">
                      <div>{order.status || "-"}</div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        sku={order.skuStatus} / import={order.importStatus}
                      </div>
                    </td>
                    <td className="border-b border-r border-slate-100 px-3 py-2 font-bold text-slate-700">
                      {order.orderId}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-2 text-center">
                      <button
                        data-testid="data-import-amazon-orders-mf-style-detail-button"
                        type="button"
                        onClick={() => onImportedReadModelOpenDetail(order.orderId)}
                        disabled={importedReadModelLoading}
                        className="rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-black text-sky-700 hover:bg-sky-50 disabled:opacity-60"
                      >
                        詳細
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    data-testid="data-import-amazon-orders-mf-style-empty"
                    colSpan={7}
                    className="px-3 py-8 text-center text-xs font-bold text-slate-500"
                  >
                    まだ注文明細がありません。Amazon注文を取得して ImportJob / ImportStagingRow を作成後、「検索」で表示します。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div
          data-testid="data-import-amazon-orders-mf-style-pagination"
          className="mt-3 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-bold text-slate-700 md:flex-row md:items-center md:justify-between"
        >
          <div>
            {amazonOrdersImportedReadModelPageIndex} / {amazonOrdersImportedReadModelTotalPages} ページ・
            表示 {String(importedReadModelOrders.length)} 件・
            hasMore={String(importedReadModelList?.pagination?.hasMore ?? false)}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              data-testid="data-import-amazon-orders-mf-style-first-page"
              type="button"
              onClick={onAmazonOrdersImportedReadModelFirstPage}
              disabled={importedReadModelLoading || !amazonOrdersImportedReadModelHasPrev}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-black text-slate-700 disabled:opacity-50"
            >
              首页
            </button>
            <button
              data-testid="data-import-amazon-orders-mf-style-prev-page"
              type="button"
              onClick={onAmazonOrdersImportedReadModelPrevPage}
              disabled={importedReadModelLoading || !amazonOrdersImportedReadModelHasPrev}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-black text-slate-700 disabled:opacity-50"
            >
              前一页
            </button>
            <button
              data-testid="data-import-amazon-orders-mf-style-next-page"
              type="button"
              onClick={onAmazonOrdersImportedReadModelNextPage}
              disabled={importedReadModelLoading || !amazonOrdersImportedReadModelHasNext}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-black text-slate-700 disabled:opacity-50"
            >
              后一页
            </button>
            <button
              data-testid="data-import-amazon-orders-mf-style-last-page"
              type="button"
              onClick={onAmazonOrdersImportedReadModelLastPage}
              disabled={importedReadModelLoading || !amazonOrdersImportedReadModelHasNext}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-black text-slate-700 disabled:opacity-50"
            >
              末页
            </button>
          </div>
        </div>

        {importedReadModelDetail ? (
          <div
            data-testid="data-import-amazon-orders-mf-style-detail-panel"
            className="mt-3 rounded-2xl border border-cyan-200 bg-cyan-50 px-3 py-3 text-xs font-bold text-cyan-950"
          >
            <div className="font-black text-cyan-700">注文詳細</div>
            <div className="mt-1">
              order={importedReadModelDetailOrder?.orderId || importedReadModelSelectedOrderId || "-"} /
              items={String(importedReadModelDetailItems.length)}
            </div>
            <div className="mt-1">
              readOnly={String(importedReadModelDetail.readOnly)} /
              writesDatabase={String(importedReadModelDetail.boundaries?.writesDatabase)}
            </div>
          </div>
        ) : null}
      </div>

      <div
        data-testid="data-import-connected-service-amazon-orders-execution-contract"
        className="mt-4 rounded-3xl border border-indigo-200 bg-indigo-50 px-4 py-4"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-700">
              Step151-M Closeout Flow
            </div>
            <h3 className="mt-1 text-sm font-black text-slate-950">
              事前確認 → プレビュー → 取込作成 → 明細確認
            </h3>
            <p
              data-testid="data-import-connected-service-amazon-orders-execution-contract-copy"
              className="mt-1 max-w-3xl text-xs font-bold leading-5 text-indigo-900"
            >
              Amazon注文の単次取得フローを収口しました。ImportJob / ImportStagingRow までは作成済み明細として確認できます。Transaction / Inventory はまだ未反映です。
            </p>
          </div>
          <span
            data-testid="data-import-connected-service-amazon-orders-execution-contract-status"
            className="inline-flex rounded-full border border-indigo-300 bg-white px-2.5 py-1 text-xs font-black text-indigo-700"
          >
            {executionContractStatus}
          </span>
        </div>

        <div
          data-testid="data-import-connected-service-amazon-orders-execution-contract-steps"
          className="mt-3 grid gap-2 md:grid-cols-4"
        >
          {AMAZON_ORDERS_FETCH_EXECUTION_CONTRACT_STEPS.map((step) => (
            <div
              key={step.key}
              data-testid={`data-import-connected-service-amazon-orders-execution-contract-step-${step.key}`}
              className={`rounded-2xl border px-3 py-3 text-xs ${
                executionContractStatus === step.key
                  ? "border-indigo-500 bg-white text-indigo-900 shadow-sm"
                  : "border-indigo-200 bg-white/70 text-indigo-800"
              }`}
            >
              <div className="font-black">{step.label}</div>
              <div className="mt-1 font-bold leading-5">{step.description}</div>
            </div>
          ))}
        </div>

        <div
          data-testid="data-import-connected-service-amazon-orders-execution-contract-boundaries"
          className="mt-3 grid gap-2 md:grid-cols-3"
        >
          <div className="rounded-2xl border border-indigo-200 bg-white px-3 py-2 text-[11px] font-black text-indigo-900">
            callsAmazon=false
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-white px-3 py-2 text-[11px] font-black text-indigo-900">
            createsImportJob=false
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-white px-3 py-2 text-[11px] font-black text-indigo-900">
            writesDatabase=false
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-white px-3 py-2 text-[11px] font-black text-indigo-900">
            writesTransaction=false
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-white px-3 py-2 text-[11px] font-black text-indigo-900">
            writesInventoryMovement=false
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-white px-3 py-2 text-[11px] font-black text-indigo-900">
            requiresExplicitConfirmation=true
          </div>
        </div>

        {/* Step151-M-IMPORT-CENTER-CLOSEOUT-UX:
            Close out the single-pull Amazon Orders flow UX.
            This stabilizes user-facing status copy only and does not change write boundaries. */}
        <div
          data-testid="data-import-connected-service-amazon-orders-closeout-status"
          className="mt-3 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-xs font-bold leading-5 text-emerald-950"
        >
          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
            取込フロー状態
          </div>
          <div
            data-testid="data-import-connected-service-amazon-orders-closeout-status-label"
            className="mt-1 text-sm font-black text-slate-950"
          >
            {amazonOrdersFlowStatusLabel}
          </div>
          <div
            data-testid="data-import-connected-service-amazon-orders-closeout-status-copy"
            className="mt-2 grid gap-2 md:grid-cols-3"
          >
            <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2 font-black">
              取込完了={String(Boolean(importedReadModelList))}
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2 font-black">
              明細確認済み={String(Boolean(importedReadModelDetail))}
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2 font-black">
              Transaction/Inventory はまだ未反映
            </div>
          </div>
        </div>

        <div
          data-testid="data-import-connected-service-amazon-orders-preflight-result"
          className="mt-3 rounded-2xl border border-indigo-200 bg-white px-3 py-3 text-xs font-bold leading-5 text-indigo-900"
        >
          <div className="font-black">Preflight result</div>
          {preflightResult ? (
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              <div data-testid="data-import-connected-service-amazon-orders-preflight-allowed">
                allowed={String(preflightResult.allowed)}
              </div>
              <div data-testid="data-import-connected-service-amazon-orders-preflight-next-action">
                nextAction={preflightResult.nextAction}
              </div>
              <div data-testid="data-import-connected-service-amazon-orders-preflight-reasons">
                reasons={preflightResult.reasons.length ? preflightResult.reasons.join(",") : "none"}
              </div>
              <div data-testid="data-import-connected-service-amazon-orders-preflight-connection">
                connected={String(preflightResult.connectionReadiness.connected)}
              </div>
              <div data-testid="data-import-connected-service-amazon-orders-preflight-date-range">
                locked={String(preflightResult.dateRange.locked)}
              </div>
              <div data-testid="data-import-connected-service-amazon-orders-preflight-boundaries">
                callsAmazon={String(preflightResult.boundaries.callsAmazon)} / createsImportJob={String(preflightResult.boundaries.createsImportJob)}
              </div>
            </div>
          ) : (
            <div className="mt-2 text-indigo-700">
              まだ preflight は実行されていません。
            </div>
          )}
          {preflightError ? (
            <div
              data-testid="data-import-connected-service-amazon-orders-preflight-error"
              className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-800"
            >
              {preflightError}
            </div>
          ) : null}
        </div>

        {/* Step151-F-PREVIEW-SHELL-NO-EXECUTION:
            Preview shell after guarded preflight is ready.
            The button calls real-preview only; ImportJob creation remains behind explicit confirmation. */}
        {preflightResult?.allowed && executionContractStatus === "preflight_ready" ? (
          <div
            data-testid="data-import-connected-service-amazon-orders-preview-shell"
            className="mt-3 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-xs font-bold leading-5 text-emerald-950"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
                  Step151-F Preview Shell
                </div>
                <h3 className="mt-1 text-sm font-black text-slate-950">
                  プレビュー確認の準備ができました
                </h3>
                <p
                  data-testid="data-import-connected-service-amazon-orders-preview-shell-copy"
                  className="mt-1 max-w-3xl text-xs font-bold leading-5 text-emerald-900"
                >
                  preflight_ready 後に取得予定期間・store・marketplace を確認します。「プレビュー確認」で real-preview を実行します。
                </p>
              </div>
              <button
                data-testid="data-import-connected-service-amazon-orders-preview-confirm-button"
                type="button"
                onClick={onPreviewShell}
                disabled={realPreviewLoading}
                title="Step151-G は real-preview のみを呼び出します。ImportJob 作成・DB 書き込み・Transaction/InventoryMovement 作成は行いません。"
                className="inline-flex rounded-xl border border-emerald-300 bg-white px-4 py-2 text-xs font-black text-emerald-800 shadow-sm transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {realPreviewLoading ? "プレビュー取得中..." : "プレビュー確認"}
              </button>
            </div>

            <div
              data-testid="data-import-connected-service-amazon-orders-preview-shell-summary"
              className="mt-4 grid gap-2 md:grid-cols-3"
            >
              <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2">
                <div className="text-[11px] font-black text-emerald-700">取得期間</div>
                <div data-testid="data-import-connected-service-amazon-orders-preview-shell-range">
                  rangePreset={preflightResult.dateRange.rangePreset || "-"} / days={String(preflightResult.dateRange.days ?? "-")}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2">
                <div className="text-[11px] font-black text-emerald-700">開始日時</div>
                <div data-testid="data-import-connected-service-amazon-orders-preview-shell-created-after">
                  {preflightResult.dateRange.createdAfter || "-"}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2">
                <div className="text-[11px] font-black text-emerald-700">終了日時</div>
                <div data-testid="data-import-connected-service-amazon-orders-preview-shell-created-before">
                  {preflightResult.dateRange.createdBefore || "-"}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2">
                <div className="text-[11px] font-black text-emerald-700">Store</div>
                <div data-testid="data-import-connected-service-amazon-orders-preview-shell-store">
                  {preflightResult.scope.storeId}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2">
                <div className="text-[11px] font-black text-emerald-700">Marketplace</div>
                <div data-testid="data-import-connected-service-amazon-orders-preview-shell-marketplace">
                  {preflightResult.scope.marketplaceId}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2">
                <div className="text-[11px] font-black text-emerald-700">Region</div>
                <div data-testid="data-import-connected-service-amazon-orders-preview-shell-region">
                  {preflightResult.scope.region}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2">
                <div className="text-[11px] font-black text-emerald-700">Next action</div>
                <div data-testid="data-import-connected-service-amazon-orders-preview-shell-next-action">
                  {preflightResult.nextAction}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2">
                <div className="text-[11px] font-black text-emerald-700">Guard status</div>
                <div data-testid="data-import-connected-service-amazon-orders-preview-shell-guard-status">
                  connected={String(preflightResult.connectionReadiness.connected)} / locked={String(preflightResult.dateRange.locked)}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2">
                <div className="text-[11px] font-black text-emerald-700">Execution boundary</div>
                <div data-testid="data-import-connected-service-amazon-orders-preview-shell-boundary">
                  callsRealPreview={String(preflightResult.boundaries.callsRealPreview)} / writesDatabase={String(preflightResult.boundaries.writesDatabase)}
                </div>
              </div>
            </div>

            <div
              data-testid="data-import-connected-service-amazon-orders-preview-shell-no-execution-boundaries"
              className="mt-3 grid gap-2 md:grid-cols-5"
            >
              <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2 font-black">
                callsRealPreview=enabledByButton
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2 font-black">
                createsImportJob=false
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2 font-black">
                writesDatabase=false
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2 font-black">
                writesTransaction=false
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-white px-3 py-2 font-black">
                writesInventoryMovement=false
              </div>
            </div>

            {/* Step151-G-REAL-PREVIEW-NO-DB:
                The explicit preview button calls real-preview only.
                ImportJob creation remains behind the separate confirmation button. */}
            <div
              data-testid="data-import-connected-service-amazon-orders-real-preview-result"
              className="mt-3 rounded-3xl border border-sky-200 bg-sky-50 px-4 py-4 text-xs font-bold leading-5 text-sky-950"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-sky-700">
                    Step151-G Real Preview Result
                  </div>
                  <h3 className="mt-1 text-sm font-black text-slate-950">
                    Amazon注文プレビュー結果
                  </h3>
                  <p
                    data-testid="data-import-connected-service-amazon-orders-real-preview-copy"
                    className="mt-1 max-w-3xl text-xs font-bold leading-5 text-sky-900"
                  >
                    real-preview API の結果です。内容確認後、「取込作成」で ImportJob / ImportStagingRow を作成できます。
                  </p>
                </div>
                <span
                  data-testid="data-import-connected-service-amazon-orders-real-preview-status"
                  className="inline-flex rounded-full border border-sky-300 bg-white px-3 py-1 text-xs font-black text-sky-700"
                >
                  {realPreviewLoading ? "loading" : realPreviewResult ? "preview_loaded" : "not_loaded"}
                </span>
              </div>

              {realPreviewError ? (
                <div
                  data-testid="data-import-connected-service-amazon-orders-real-preview-error"
                  className="mt-3 rounded-2xl border border-rose-200 bg-white px-3 py-2 text-rose-800"
                >
                  {realPreviewError}
                </div>
              ) : null}

              {realPreviewResult ? (
                <>
                <div
                  data-testid="data-import-connected-service-amazon-orders-real-preview-summary"
                  className="mt-4 grid gap-2 md:grid-cols-4"
                >
                  <div className="rounded-2xl border border-sky-200 bg-white px-3 py-2">
                    <div className="text-[11px] font-black text-sky-700">Orders</div>
                    <div data-testid="data-import-connected-service-amazon-orders-real-preview-total-orders">
                      {String(realPreviewResult.validationSummary?.totalOrders ?? realPreviewResult.normalizedOrders?.length ?? 0)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-sky-200 bg-white px-3 py-2">
                    <div className="text-[11px] font-black text-sky-700">Items</div>
                    <div data-testid="data-import-connected-service-amazon-orders-real-preview-total-items">
                      {String(realPreviewResult.validationSummary?.totalOrderItems ?? realPreviewResult.normalizedOrderItems?.length ?? 0)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-sky-200 bg-white px-3 py-2">
                    <div className="text-[11px] font-black text-sky-700">Unresolved SKU</div>
                    <div data-testid="data-import-connected-service-amazon-orders-real-preview-unresolved-sku">
                      {String(realPreviewResult.skuResolutionSummary?.unresolvedSkuCount ?? 0)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-sky-200 bg-white px-3 py-2">
                    <div className="text-[11px] font-black text-sky-700">Preview amount</div>
                    <div data-testid="data-import-connected-service-amazon-orders-real-preview-amount">
                      {String(realPreviewResult.transactionImpactPreview?.totalPreviewAmount ?? realPreviewResult.productionVerification?.incomePreviewAmount ?? "-")}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-sky-200 bg-white px-3 py-2">
                    <div className="text-[11px] font-black text-sky-700">Source</div>
                    <div data-testid="data-import-connected-service-amazon-orders-real-preview-source">
                      {realPreviewResult.source || "-"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-sky-200 bg-white px-3 py-2">
                    <div className="text-[11px] font-black text-sky-700">Preview mode</div>
                    <div data-testid="data-import-connected-service-amazon-orders-real-preview-mode">
                      {realPreviewResult.previewMode || "-"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-sky-200 bg-white px-3 py-2">
                    <div className="text-[11px] font-black text-sky-700">Writes DB</div>
                    <div data-testid="data-import-connected-service-amazon-orders-real-preview-writes-db">
                      {String(realPreviewResult.writesDatabase ?? realPreviewResult.controllerWritesDatabase ?? false)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-sky-200 bg-white px-3 py-2">
                    <div className="text-[11px] font-black text-sky-700">ImportJob write</div>
                    <div data-testid="data-import-connected-service-amazon-orders-real-preview-importjob-write">
                      {String(realPreviewResult.importJobWriteNow ?? realPreviewResult.productionVerification?.boundaries?.writesImportJob ?? false)}
                    </div>
                  </div>
                </div>

                {/* Step151-I-IMPORT-CONFIRMATION-SHELL-NO-EXECUTION:
                    Explicit import confirmation shell after real-preview succeeds.
                    In the stabilized flow, the confirmation button calls real-importjob. */}
                <div
                  data-testid="data-import-connected-service-amazon-orders-import-confirmation-shell"
                  className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-xs font-bold leading-5 text-amber-950"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-700">
                        Step151-I Import Confirmation Shell
                      </div>
                      <h3 className="mt-1 text-sm font-black text-slate-950">
                        取込作成の確認
                      </h3>
                      <p
                        data-testid="data-import-connected-service-amazon-orders-import-confirmation-copy"
                        className="mt-1 max-w-3xl text-xs font-bold leading-5 text-amber-900"
                      >
                        real-preview の結果を確認しました。「取込作成」を押すと ImportJob / ImportStagingRow を作成します。Transaction / Inventory はまだ未反映です。
                      </p>
                    </div>

                    <button
                      data-testid="data-import-connected-service-amazon-orders-import-confirm-button"
                      type="button"
                      onClick={onImportCommitShell}
                      disabled={realImportJobCommitLoading}
                      title="Step151-J は ImportJob / ImportStagingRow のみを作成します。Transaction / InventoryMovement は作成しません。"
                      className="inline-flex rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-black text-amber-800 shadow-sm transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {realImportJobCommitLoading ? "取込作成中..." : "取込作成"}
                    </button>
                  </div>

                  <div
                    data-testid="data-import-connected-service-amazon-orders-import-confirmation-summary"
                    className="mt-4 grid gap-2 md:grid-cols-4"
                  >
                    <div className="rounded-2xl border border-amber-200 bg-white px-3 py-2">
                      <div className="text-[11px] font-black text-amber-700">書き込み予定注文数</div>
                      <div data-testid="data-import-connected-service-amazon-orders-import-confirmation-orders">
                        {String(realPreviewResult.validationSummary?.totalOrders ?? realPreviewResult.normalizedOrders?.length ?? 0)}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-white px-3 py-2">
                      <div className="text-[11px] font-black text-amber-700">書き込み予定明細数</div>
                      <div data-testid="data-import-connected-service-amazon-orders-import-confirmation-items">
                        {String(realPreviewResult.validationSummary?.totalOrderItems ?? realPreviewResult.normalizedOrderItems?.length ?? 0)}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-white px-3 py-2">
                      <div className="text-[11px] font-black text-amber-700">未解決 SKU</div>
                      <div data-testid="data-import-connected-service-amazon-orders-import-confirmation-unresolved-sku">
                        {String(realPreviewResult.skuResolutionSummary?.unresolvedSkuCount ?? 0)}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-white px-3 py-2">
                      <div className="text-[11px] font-black text-amber-700">予定金額</div>
                      <div data-testid="data-import-connected-service-amazon-orders-import-confirmation-amount">
                        {String(realPreviewResult.transactionImpactPreview?.totalPreviewAmount ?? realPreviewResult.productionVerification?.incomePreviewAmount ?? "-")}
                      </div>
                    </div>
                  </div>

                  <div
                    data-testid="data-import-connected-service-amazon-orders-import-confirmation-boundaries"
                    className="mt-3 grid gap-2 md:grid-cols-4"
                  >
                    <div className="rounded-2xl border border-amber-200 bg-white px-3 py-2 font-black">
                      nextCreatesImportJob=true
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-white px-3 py-2 font-black">
                      nextCreatesImportStagingRow=true
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-white px-3 py-2 font-black">
                      stillCreatesTransaction=false
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-white px-3 py-2 font-black">
                      stillWritesInventoryMovement=false
                    </div>
                  </div>

                  <div
                    data-testid="data-import-connected-service-amazon-orders-import-confirmation-no-execution"
                    className="mt-3 rounded-2xl border border-amber-200 bg-white px-3 py-2 font-black text-amber-900"
                  >
                    明示確認後のみ ImportJob / ImportStagingRow を作成します。Transaction / Inventory はまだ未反映です。
                  </div>

                  {/* Step151-J-REAL-IMPORTJOB-COMMIT-UI:
                      Explicit confirmation calls real-importjob.
                      This writes ImportJob + ImportStagingRow only.
                      It must not create Transaction or InventoryMovement. */}
                  <div
                    data-testid="data-import-connected-service-amazon-orders-real-importjob-result"
                    className="mt-3 rounded-3xl border border-violet-200 bg-violet-50 px-4 py-4 text-xs font-bold leading-5 text-violet-950"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="text-[11px] font-black uppercase tracking-[0.16em] text-violet-700">
                          Step151-J ImportJob Commit Result
                        </div>
                        <h3 className="mt-1 text-sm font-black text-slate-950">
                          ImportJob / ImportStagingRow 作成結果
                        </h3>
                        <p
                          data-testid="data-import-connected-service-amazon-orders-real-importjob-copy"
                          className="mt-1 max-w-3xl text-xs font-bold leading-5 text-violet-900"
                        >
                          ImportJob と ImportStagingRow を作成しました。Transaction 作成・InventoryMovement 書き込み・historical sync は行いません。
                        </p>
                      </div>
                      <span
                        data-testid="data-import-connected-service-amazon-orders-real-importjob-status"
                        className="inline-flex rounded-full border border-violet-300 bg-white px-3 py-1 text-xs font-black text-violet-700"
                      >
                        {realImportJobCommitLoading ? "loading" : realImportJobCommitResult ? "importjob_created" : "not_created"}
                      </span>
                    </div>

                    {realImportJobCommitError ? (
                      <div
                        data-testid="data-import-connected-service-amazon-orders-real-importjob-error"
                        className="mt-3 rounded-2xl border border-rose-200 bg-white px-3 py-2 text-rose-800"
                      >
                        {realImportJobCommitError}
                      </div>
                    ) : null}

                    {realImportJobCommitResult ? (
                      <div
                        data-testid="data-import-connected-service-amazon-orders-real-importjob-summary"
                        className="mt-4 grid gap-2 md:grid-cols-4"
                      >
                        <div className="rounded-2xl border border-violet-200 bg-white px-3 py-2">
                          <div className="text-[11px] font-black text-violet-700">ImportJob ID</div>
                          <div data-testid="data-import-connected-service-amazon-orders-real-importjob-id">
                            {realImportJobCommitResult.importJobId || "-"}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-violet-200 bg-white px-3 py-2">
                          <div className="text-[11px] font-black text-violet-700">Total rows</div>
                          <div data-testid="data-import-connected-service-amazon-orders-real-importjob-total-rows">
                            {String(realImportJobCommitResult.totalRows ?? "-")}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-violet-200 bg-white px-3 py-2">
                          <div className="text-[11px] font-black text-violet-700">Success rows</div>
                          <div data-testid="data-import-connected-service-amazon-orders-real-importjob-success-rows">
                            {String(realImportJobCommitResult.successRows ?? "-")}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-violet-200 bg-white px-3 py-2">
                          <div className="text-[11px] font-black text-violet-700">Failed rows</div>
                          <div data-testid="data-import-connected-service-amazon-orders-real-importjob-failed-rows">
                            {String(realImportJobCommitResult.failedRows ?? "-")}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-violet-200 bg-white px-3 py-2">
                          <div className="text-[11px] font-black text-violet-700">Writes ImportJob</div>
                          <div data-testid="data-import-connected-service-amazon-orders-real-importjob-writes-importjob">
                            {String(realImportJobCommitResult.boundaries?.writesImportJob ?? realImportJobCommitResult.controllerWritesImportJob ?? false)}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-violet-200 bg-white px-3 py-2">
                          <div className="text-[11px] font-black text-violet-700">Writes Staging</div>
                          <div data-testid="data-import-connected-service-amazon-orders-real-importjob-writes-staging">
                            {String(realImportJobCommitResult.boundaries?.writesImportStagingRow ?? realImportJobCommitResult.controllerWritesImportStagingRows ?? false)}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-violet-200 bg-white px-3 py-2">
                          <div className="text-[11px] font-black text-violet-700">Writes Transaction</div>
                          <div data-testid="data-import-connected-service-amazon-orders-real-importjob-writes-transaction">
                            {String(realImportJobCommitResult.boundaries?.writesTransaction ?? realImportJobCommitResult.controllerWritesTransaction ?? false)}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-violet-200 bg-white px-3 py-2">
                          <div className="text-[11px] font-black text-violet-700">Writes Inventory</div>
                          <div data-testid="data-import-connected-service-amazon-orders-real-importjob-writes-inventory">
                            {String(realImportJobCommitResult.boundaries?.writesInventoryMovement ?? realImportJobCommitResult.controllerWritesInventory ?? false)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        data-testid="data-import-connected-service-amazon-orders-real-importjob-empty"
                        className="mt-3 rounded-2xl border border-violet-200 bg-white px-3 py-2 text-violet-800"
                      >
                        まだ ImportJob は作成されていません。「取込作成」を押すと ImportJob / ImportStagingRow のみを作成します。
                      </div>
                    )}

                    {/* Step151-N-STAGING-COMMIT-READINESS-UI:
                        Read existing ImportStagingRow rows and evaluate future commit readiness.
                        This is readiness-only and must not create Transaction or InventoryMovement. */}
                    <div
                      data-testid="data-import-connected-service-amazon-orders-staging-readiness-panel"
                      className="mt-4 rounded-3xl border border-fuchsia-200 bg-fuchsia-50 px-4 py-4 text-xs font-bold leading-5 text-fuchsia-950"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-fuchsia-700">
                            Step151-N Staging Commit Readiness
                          </div>
                          <h3 className="mt-1 text-sm font-black text-slate-950">
                            Transaction / Inventory 反映準備チェック
                          </h3>
                          <p
                            data-testid="data-import-connected-service-amazon-orders-staging-readiness-copy"
                            className="mt-1 max-w-3xl text-xs font-bold leading-5 text-fuchsia-900"
                          >
                            ImportStagingRow を読み取り、将来の Transaction / InventoryMovement 反映可否を判定します。この段階ではまだ作成・書き込みは行いません。
                          </p>
                        </div>
                        <button
                          data-testid="data-import-connected-service-amazon-orders-staging-readiness-refresh-button"
                          type="button"
                          onClick={onStagingCommitReadinessRefresh}
                          disabled={!realImportJobCommitResult?.importJobId || stagingCommitReadinessLoading}
                          className="inline-flex rounded-xl border border-fuchsia-300 bg-white px-4 py-2 text-xs font-black text-fuchsia-800 shadow-sm transition hover:bg-fuchsia-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {stagingCommitReadinessLoading ? "確認中..." : "反映準備を確認"}
                        </button>
                      </div>

                      {stagingCommitReadinessError ? (
                        <div
                          data-testid="data-import-connected-service-amazon-orders-staging-readiness-error"
                          className="mt-3 rounded-2xl border border-rose-200 bg-white px-3 py-2 text-rose-800"
                        >
                          {stagingCommitReadinessError}
                        </div>
                      ) : null}

                      <div
                        data-testid="data-import-connected-service-amazon-orders-staging-readiness-boundaries"
                        className="mt-3 grid gap-2 md:grid-cols-4"
                      >
                        <div className="rounded-2xl border border-fuchsia-200 bg-white px-3 py-2 font-black">
                          readsImportStagingRow=true
                        </div>
                        <div className="rounded-2xl border border-fuchsia-200 bg-white px-3 py-2 font-black">
                          writesDatabase=false
                        </div>
                        <div className="rounded-2xl border border-fuchsia-200 bg-white px-3 py-2 font-black">
                          transactionWriteNow=false
                        </div>
                        <div className="rounded-2xl border border-fuchsia-200 bg-white px-3 py-2 font-black">
                          inventoryWriteNow=false
                        </div>
                      </div>

                      {stagingCommitReadiness ? (
                        <>
                          <div
                            data-testid="data-import-connected-service-amazon-orders-staging-readiness-summary"
                            className="mt-4 grid gap-2 md:grid-cols-4"
                          >
                            <div className="rounded-2xl border border-fuchsia-200 bg-white px-3 py-2">
                              <div className="text-[11px] font-black text-fuchsia-700">Can commit later</div>
                              <div data-testid="data-import-connected-service-amazon-orders-staging-readiness-can-commit">
                                {String(stagingCommitReadiness.canCommit ?? false)}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-fuchsia-200 bg-white px-3 py-2">
                              <div className="text-[11px] font-black text-fuchsia-700">Ready rows</div>
                              <div data-testid="data-import-connected-service-amazon-orders-staging-readiness-ready-rows">
                                {String(stagingCommitReadiness.readyRows ?? 0)}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-fuchsia-200 bg-white px-3 py-2">
                              <div className="text-[11px] font-black text-fuchsia-700">Blocked rows</div>
                              <div data-testid="data-import-connected-service-amazon-orders-staging-readiness-blocked-rows">
                                {String(stagingCommitReadiness.blockedRows ?? 0)}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-fuchsia-200 bg-white px-3 py-2">
                              <div className="text-[11px] font-black text-fuchsia-700">Unresolved SKU</div>
                              <div data-testid="data-import-connected-service-amazon-orders-staging-readiness-unresolved-sku">
                                {String(stagingCommitReadiness.unresolvedSkuRows ?? 0)}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-fuchsia-200 bg-white px-3 py-2">
                              <div className="text-[11px] font-black text-fuchsia-700">Missing amount</div>
                              <div data-testid="data-import-connected-service-amazon-orders-staging-readiness-missing-amount">
                                {String(stagingCommitReadiness.missingAmountRows ?? 0)}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-fuchsia-200 bg-white px-3 py-2">
                              <div className="text-[11px] font-black text-fuchsia-700">Duplicate</div>
                              <div data-testid="data-import-connected-service-amazon-orders-staging-readiness-duplicate">
                                {String(stagingCommitReadiness.duplicateRows ?? 0)}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-fuchsia-200 bg-white px-3 py-2">
                              <div className="text-[11px] font-black text-fuchsia-700">Existing Transaction</div>
                              <div data-testid="data-import-connected-service-amazon-orders-staging-readiness-existing-transaction">
                                {String(stagingCommitReadiness.existingTransactionRows ?? 0)}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-fuchsia-200 bg-white px-3 py-2">
                              <div className="text-[11px] font-black text-fuchsia-700">Existing Inventory</div>
                              <div data-testid="data-import-connected-service-amazon-orders-staging-readiness-existing-inventory">
                                {String(stagingCommitReadiness.existingInventoryMovementRows ?? 0)}
                              </div>
                            </div>
                          </div>

                          <div
                            data-testid="data-import-connected-service-amazon-orders-staging-readiness-blocked-reasons"
                            className="mt-3 rounded-2xl border border-fuchsia-200 bg-white px-3 py-3"
                          >
                            <div className="text-[11px] font-black text-fuchsia-700">Blocked reasons / warnings</div>
                            <div className="mt-1 text-fuchsia-900">
                              {stagingCommitReadinessBlockedReasons.length
                                ? stagingCommitReadinessBlockedReasons.join(", ")
                                : "none"}
                            </div>
                            <div className="mt-2 grid gap-1 text-[11px] font-black text-fuchsia-800 md:grid-cols-5">
                              <span>unresolved SKU</span>
                              <span>missing amount</span>
                              <span>duplicate order</span>
                              <span>missing target mapping</span>
                              <span>invalid order status</span>
                            </div>
                          </div>

                          <div
                            data-testid="data-import-connected-service-amazon-orders-staging-readiness-rows"
                            className="mt-3 grid gap-2"
                          >
                            {stagingCommitReadinessPreviewRows.map((row) => (
                              <div
                                key={row.stagingRowId}
                                data-testid="data-import-connected-service-amazon-orders-staging-readiness-row"
                                className="rounded-2xl border border-fuchsia-200 bg-white px-3 py-2"
                              >
                                <div className="font-black text-slate-950">
                                  rowNo={row.rowNo} / readiness={row.readiness}
                                </div>
                                <div className="mt-1 text-fuchsia-900">
                                  order={row.amazonOrderId || "-"} / item={row.orderItemId || "-"} / sku={row.sellerSku || "-"}
                                </div>
                                <div className="mt-1 text-fuchsia-900">
                                  blockers={(row.blockers || []).join(",") || "none"} / warnings={(row.warnings || []).join(",") || "none"}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div
                          data-testid="data-import-connected-service-amazon-orders-staging-readiness-empty"
                          className="mt-3 rounded-2xl border border-fuchsia-200 bg-white px-3 py-2 text-fuchsia-800"
                        >
                          まだ readiness は確認されていません。ImportJob 作成後に自動確認されます。
                        </div>
                      )}
                    </div>

                    {/* Step151-PQ-INVENTORY-COMBINED-DRY-RUN-PROJECTION-UI:
                        Project future InventoryMovement drafts and show combined
                        Transaction / Inventory preview. This is dry-run only. */}
                    <div
                      data-testid="data-import-connected-service-amazon-orders-combined-projection-panel"
                      className="mt-4 rounded-3xl border border-orange-200 bg-orange-50 px-4 py-4 text-xs font-bold leading-5 text-orange-950"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-orange-700">
                            Step151-PQ Combined Transaction / Inventory Preview
                          </div>
                          <h3 className="mt-1 text-sm font-black text-slate-950">
                            Transaction / InventoryMovement combined dry-run
                          </h3>
                          <p
                            data-testid="data-import-connected-service-amazon-orders-combined-projection-copy"
                            className="mt-1 max-w-3xl text-xs font-bold leading-5 text-orange-900"
                          >
                            readiness=READY の行から、収入 Transaction draft と在庫減算 InventoryMovement draft を同時に確認します。この段階ではどちらも書き込みません。
                          </p>
                        </div>
                        <button
                          data-testid="data-import-connected-service-amazon-orders-combined-projection-refresh-button"
                          type="button"
                          onClick={onCombinedDryRunProjectionRefresh}
                          disabled={!realImportJobCommitResult?.importJobId || combinedDryRunProjectionLoading}
                          className="inline-flex rounded-xl border border-orange-300 bg-white px-4 py-2 text-xs font-black text-orange-800 shadow-sm transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {combinedDryRunProjectionLoading ? "計算中..." : "Transaction/Inventory preview"}
                        </button>
                      </div>

                      {combinedDryRunProjectionError ? (
                        <div
                          data-testid="data-import-connected-service-amazon-orders-combined-projection-error"
                          className="mt-3 rounded-2xl border border-rose-200 bg-white px-3 py-2 text-rose-800"
                        >
                          {combinedDryRunProjectionError}
                        </div>
                      ) : null}

                      <div
                        data-testid="data-import-connected-service-amazon-orders-combined-projection-boundaries"
                        className="mt-3 grid gap-2 md:grid-cols-4"
                      >
                        <div className="rounded-2xl border border-orange-200 bg-white px-3 py-2 font-black">
                          writesDatabase=false
                        </div>
                        <div className="rounded-2xl border border-orange-200 bg-white px-3 py-2 font-black">
                          createsTransactionNow=false
                        </div>
                        <div className="rounded-2xl border border-orange-200 bg-white px-3 py-2 font-black">
                          createsInventoryMovementNow=false
                        </div>
                        <div className="rounded-2xl border border-orange-200 bg-white px-3 py-2 font-black">
                          historicalSyncNow=false
                        </div>
                      </div>

                      {combinedDryRunProjection ? (
                        <>
                          <div
                            data-testid="data-import-connected-service-amazon-orders-combined-projection-summary"
                            className="mt-4 grid gap-2 md:grid-cols-4"
                          >
                            <div className="rounded-2xl border border-orange-200 bg-white px-3 py-2">
                              <div className="text-[11px] font-black text-orange-700">Transaction drafts</div>
                              <div data-testid="data-import-connected-service-amazon-orders-combined-projection-transaction-rows">
                                {String(combinedDryRunProjection.combined.transactionDraftRows)}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-orange-200 bg-white px-3 py-2">
                              <div className="text-[11px] font-black text-orange-700">Inventory drafts</div>
                              <div data-testid="data-import-connected-service-amazon-orders-combined-projection-inventory-rows">
                                {String(combinedDryRunProjection.combined.inventoryMovementDraftRows)}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-orange-200 bg-white px-3 py-2">
                              <div className="text-[11px] font-black text-orange-700">Amount total</div>
                              <div data-testid="data-import-connected-service-amazon-orders-combined-projection-amount-total">
                                {String(combinedDryRunProjection.combined.amountTotal)}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-orange-200 bg-white px-3 py-2">
                              <div className="text-[11px] font-black text-orange-700">Quantity total</div>
                              <div data-testid="data-import-connected-service-amazon-orders-combined-projection-quantity-total">
                                {String(combinedDryRunProjection.combined.quantityTotal)}
                              </div>
                            </div>
                          </div>

                          <div
                            data-testid="data-import-connected-service-amazon-orders-inventory-projection-drafts"
                            className="mt-3 grid gap-2"
                          >
                            {inventoryProjectionPreviewDrafts.map((draft) => (
                              <div
                                key={draft.stagingRowId}
                                data-testid="data-import-connected-service-amazon-orders-inventory-projection-draft-row"
                                className="rounded-2xl border border-orange-200 bg-white px-3 py-2"
                              >
                                <div className="font-black text-slate-950">
                                  SKU={draft.productSkuCode || draft.productSkuId} / quantity={draft.quantity} / movementType={draft.movementType}
                                </div>
                                <div className="mt-1 text-orange-900">
                                  sourceRow={draft.evidenceSourceRowNo} / order={draft.sourceOrderId || "-"} / dedupeKey={draft.dedupeKey}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div
                            data-testid="data-import-connected-service-amazon-orders-combined-projection-excluded-rows"
                            className="mt-3 rounded-2xl border border-orange-200 bg-white px-3 py-3"
                          >
                            <div className="text-[11px] font-black text-orange-700">Blocked rows excluded from projection</div>
                            {inventoryProjectionPreviewExcluded.length ? (
                              <div className="mt-2 grid gap-2">
                                {inventoryProjectionPreviewExcluded.map((row) => (
                                  <div key={row.stagingRowId} className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-2">
                                    rowNo={row.rowNo} / sku={row.sellerSku || "-"} / reasons={(row.excludedReasons || []).join(",") || "none"}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="mt-1 text-orange-900">none</div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div
                          data-testid="data-import-connected-service-amazon-orders-combined-projection-empty"
                          className="mt-3 rounded-2xl border border-orange-200 bg-white px-3 py-2 text-orange-800"
                        >
                          まだ combined preview は計算されていません。ImportJob 作成後に自動計算されます。
                        </div>
                      )}
                    </div>

                    {/* Step151-R-B-FINAL-COMMIT-REVIEW-UI:
                        Final pre-commit review panel. This is review-only and must not
                        create Transaction or InventoryMovement. */}
                    <div
                      data-testid="data-import-connected-service-amazon-orders-final-commit-review-panel"
                      className="mt-4 rounded-3xl border border-red-200 bg-red-50 px-4 py-4 text-xs font-bold leading-5 text-red-950"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-red-700">
                            Step151-R Final Commit Review
                          </div>
                          <h3 className="mt-1 text-sm font-black text-slate-950">
                            最終反映前レビュー
                          </h3>
                          <p
                            data-testid="data-import-connected-service-amazon-orders-final-commit-review-copy"
                            className="mt-1 max-w-3xl text-xs font-bold leading-5 text-red-900"
                          >
                            Transaction / InventoryMovement を実際に作成する前の最終確認です。この画面では dry-run 結果のみを表示し、DB 書き込みは行いません。
                          </p>
                        </div>
                        <button
                          data-testid="data-import-connected-service-amazon-orders-final-commit-review-refresh-button"
                          type="button"
                          onClick={onFinalCommitReviewRefresh}
                          disabled={!realImportJobCommitResult?.importJobId || finalCommitReviewLoading}
                          className="inline-flex rounded-xl border border-red-300 bg-white px-4 py-2 text-xs font-black text-red-800 shadow-sm transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {finalCommitReviewLoading ? "確認中..." : "最終レビュー"}
                        </button>
                      </div>

                      {finalCommitReviewError ? (
                        <div
                          data-testid="data-import-connected-service-amazon-orders-final-commit-review-error"
                          className="mt-3 rounded-2xl border border-rose-200 bg-white px-3 py-2 text-rose-800"
                        >
                          {finalCommitReviewError}
                        </div>
                      ) : null}

                      <div
                        data-testid="data-import-connected-service-amazon-orders-final-commit-review-boundaries"
                        className="mt-3 grid gap-2 md:grid-cols-5"
                      >
                        <div className="rounded-2xl border border-red-200 bg-white px-3 py-2 font-black">
                          reviewOnly=true
                        </div>
                        <div className="rounded-2xl border border-red-200 bg-white px-3 py-2 font-black">
                          writesDatabase=false
                        </div>
                        <div className="rounded-2xl border border-red-200 bg-white px-3 py-2 font-black">
                          createsTransactionNow=false
                        </div>
                        <div className="rounded-2xl border border-red-200 bg-white px-3 py-2 font-black">
                          createsInventoryMovementNow=false
                        </div>
                        <div className="rounded-2xl border border-red-200 bg-white px-3 py-2 font-black">
                          requiresExplicitConfirmation=true
                        </div>
                      </div>

                      {finalCommitReview ? (
                        <>
                          <div
                            data-testid="data-import-connected-service-amazon-orders-final-commit-review-summary"
                            className="mt-4 grid gap-2 md:grid-cols-4"
                          >
                            <div className="rounded-2xl border border-red-200 bg-white px-3 py-2">
                              <div className="text-[11px] font-black text-red-700">Final can commit</div>
                              <div data-testid="data-import-connected-service-amazon-orders-final-commit-review-can-commit">
                                {String(finalCommitReview.finalCanCommit)}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-red-200 bg-white px-3 py-2">
                              <div className="text-[11px] font-black text-red-700">Transaction rows</div>
                              <div data-testid="data-import-connected-service-amazon-orders-final-commit-review-transaction-rows">
                                {String(finalCommitReview.willCreateTransactionRows)}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-red-200 bg-white px-3 py-2">
                              <div className="text-[11px] font-black text-red-700">Inventory rows</div>
                              <div data-testid="data-import-connected-service-amazon-orders-final-commit-review-inventory-rows">
                                {String(finalCommitReview.willCreateInventoryMovementRows)}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-red-200 bg-white px-3 py-2">
                              <div className="text-[11px] font-black text-red-700">Blocked rows</div>
                              <div data-testid="data-import-connected-service-amazon-orders-final-commit-review-blocked-rows">
                                {String(finalCommitReview.blockedRows)}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-red-200 bg-white px-3 py-2">
                              <div className="text-[11px] font-black text-red-700">Amount total</div>
                              <div data-testid="data-import-connected-service-amazon-orders-final-commit-review-amount-total">
                                {String(finalCommitReview.amountTotal)}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-red-200 bg-white px-3 py-2">
                              <div className="text-[11px] font-black text-red-700">Quantity total</div>
                              <div data-testid="data-import-connected-service-amazon-orders-final-commit-review-quantity-total">
                                {String(finalCommitReview.quantityTotal)}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-red-200 bg-white px-3 py-2">
                              <div className="text-[11px] font-black text-red-700">Dry run</div>
                              <div data-testid="data-import-connected-service-amazon-orders-final-commit-review-dry-run">
                                {String(finalCommitReview.dryRun)}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-red-200 bg-white px-3 py-2">
                              <div className="text-[11px] font-black text-red-700">Review only</div>
                              <div data-testid="data-import-connected-service-amazon-orders-final-commit-review-review-only">
                                {String(finalCommitReview.reviewOnly)}
                              </div>
                            </div>
                          </div>

                          <div
                            data-testid="data-import-connected-service-amazon-orders-final-commit-review-blockers"
                            className="mt-3 rounded-2xl border border-red-200 bg-white px-3 py-3"
                          >
                            <div className="text-[11px] font-black text-red-700">Blockers / warnings</div>
                            <div className="mt-1 text-red-900">
                              blockers={finalCommitReviewBlockers.length ? finalCommitReviewBlockers.join(", ") : "none"}
                            </div>
                            <div className="mt-1 text-red-900">
                              warnings={finalCommitReviewWarnings.length ? finalCommitReviewWarnings.join(", ") : "none"}
                            </div>
                          </div>

                          <div
                            data-testid="data-import-connected-service-amazon-orders-final-commit-review-preview-rows"
                            className="mt-3 grid gap-2 md:grid-cols-2"
                          >
                            <div className="rounded-2xl border border-red-200 bg-white px-3 py-3">
                              <div className="text-[11px] font-black text-red-700">Transaction preview</div>
                              {finalCommitReviewTransactionPreviewRows.length ? (
                                <div className="mt-2 grid gap-2">
                                  {finalCommitReviewTransactionPreviewRows.slice(0, 3).map((draft, index) => (
                                    <div
                                      key={`${String(draft.stagingRowId || index)}-transaction`}
                                      data-testid="data-import-connected-service-amazon-orders-final-commit-review-transaction-preview-row"
                                      className="rounded-xl border border-red-100 bg-red-50 px-3 py-2"
                                    >
                                      amount={String(draft.amount ?? "-")} / order={String(draft.sourceOrderId ?? "-")} / row={String(draft.evidenceSourceRowNo ?? "-")}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="mt-1 text-red-900">none</div>
                              )}
                            </div>

                            <div className="rounded-2xl border border-red-200 bg-white px-3 py-3">
                              <div className="text-[11px] font-black text-red-700">Inventory preview</div>
                              {finalCommitReviewInventoryPreviewRows.length ? (
                                <div className="mt-2 grid gap-2">
                                  {finalCommitReviewInventoryPreviewRows.slice(0, 3).map((draft, index) => (
                                    <div
                                      key={`${String(draft.stagingRowId || index)}-inventory`}
                                      data-testid="data-import-connected-service-amazon-orders-final-commit-review-inventory-preview-row"
                                      className="rounded-xl border border-red-100 bg-red-50 px-3 py-2"
                                    >
                                      sku={String(draft.productSkuCode || draft.productSkuId || "-")} / quantity={String(draft.quantity ?? "-")} / row={String(draft.evidenceSourceRowNo ?? "-")}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="mt-1 text-red-900">none</div>
                              )}
                            </div>
                          </div>

                          <div
                            data-testid="data-import-connected-service-amazon-orders-final-commit-review-no-write-notice"
                            className="mt-3 rounded-2xl border border-red-200 bg-white px-3 py-2 font-black text-red-900"
                          >
                            この Step151-R-B では最終レビューのみです。実際の Transaction / InventoryMovement 作成ボタンはまだ出しません。
                          </div>
                        </>
                      ) : (
                        <div
                          data-testid="data-import-connected-service-amazon-orders-final-commit-review-empty"
                          className="mt-3 rounded-2xl border border-red-200 bg-white px-3 py-2 text-red-800"
                        >
                          まだ final commit review は実行されていません。ImportJob 作成後に最終レビューできます。
                        </div>
                      )}
                    </div>

                    {/* Step151-O-TRANSACTION-DRY-RUN-PROJECTION-UI:
                        Project future Transaction drafts from readiness READY rows only.
                        This is dry-run only and must not create Transaction or InventoryMovement. */}
                    <div
                      data-testid="data-import-connected-service-amazon-orders-transaction-projection-panel"
                      className="mt-4 rounded-3xl border border-lime-200 bg-lime-50 px-4 py-4 text-xs font-bold leading-5 text-lime-950"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-lime-700">
                            Step151-O Transaction Dry-run Projection
                          </div>
                          <h3 className="mt-1 text-sm font-black text-slate-950">
                            Transaction draft preview
                          </h3>
                          <p
                            data-testid="data-import-connected-service-amazon-orders-transaction-projection-copy"
                            className="mt-1 max-w-3xl text-xs font-bold leading-5 text-lime-900"
                          >
                            readiness=READY の ImportStagingRow だけを使い、将来作成する収入 Transaction draft を計算します。この段階では Transaction 作成・InventoryMovement 書き込みは行いません。
                          </p>
                        </div>
                        <button
                          data-testid="data-import-connected-service-amazon-orders-transaction-projection-refresh-button"
                          type="button"
                          onClick={onTransactionDryRunProjectionRefresh}
                          disabled={!realImportJobCommitResult?.importJobId || transactionDryRunProjectionLoading}
                          className="inline-flex rounded-xl border border-lime-300 bg-white px-4 py-2 text-xs font-black text-lime-800 shadow-sm transition hover:bg-lime-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {transactionDryRunProjectionLoading ? "計算中..." : "Transaction draft を確認"}
                        </button>
                      </div>

                      {transactionDryRunProjectionError ? (
                        <div
                          data-testid="data-import-connected-service-amazon-orders-transaction-projection-error"
                          className="mt-3 rounded-2xl border border-rose-200 bg-white px-3 py-2 text-rose-800"
                        >
                          {transactionDryRunProjectionError}
                        </div>
                      ) : null}

                      <div
                        data-testid="data-import-connected-service-amazon-orders-transaction-projection-boundaries"
                        className="mt-3 grid gap-2 md:grid-cols-4"
                      >
                        <div className="rounded-2xl border border-lime-200 bg-white px-3 py-2 font-black">
                          writesDatabase=false
                        </div>
                        <div className="rounded-2xl border border-lime-200 bg-white px-3 py-2 font-black">
                          transactionWriteNow=false
                        </div>
                        <div className="rounded-2xl border border-lime-200 bg-white px-3 py-2 font-black">
                          inventoryWriteNow=false
                        </div>
                        <div className="rounded-2xl border border-lime-200 bg-white px-3 py-2 font-black">
                          historicalSyncNow=false
                        </div>
                      </div>

                      {transactionDryRunProjection ? (
                        <>
                          <div
                            data-testid="data-import-connected-service-amazon-orders-transaction-projection-summary"
                            className="mt-4 grid gap-2 md:grid-cols-4"
                          >
                            <div className="rounded-2xl border border-lime-200 bg-white px-3 py-2">
                              <div className="text-[11px] font-black text-lime-700">Projected rows</div>
                              <div data-testid="data-import-connected-service-amazon-orders-transaction-projection-rows">
                                {String(transactionDryRunProjection.projectedTransactionRows)}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-lime-200 bg-white px-3 py-2">
                              <div className="text-[11px] font-black text-lime-700">Excluded rows</div>
                              <div data-testid="data-import-connected-service-amazon-orders-transaction-projection-excluded">
                                {String(transactionDryRunProjection.excludedRows)}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-lime-200 bg-white px-3 py-2">
                              <div className="text-[11px] font-black text-lime-700">Amount total</div>
                              <div data-testid="data-import-connected-service-amazon-orders-transaction-projection-amount-total">
                                {String(transactionDryRunProjection.amountTotal)} {transactionDryRunProjection.currency}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-lime-200 bg-white px-3 py-2">
                              <div className="text-[11px] font-black text-lime-700">Source</div>
                              <div data-testid="data-import-connected-service-amazon-orders-transaction-projection-source">
                                amazon-sp-api-orders
                              </div>
                            </div>
                          </div>

                          <div
                            data-testid="data-import-connected-service-amazon-orders-transaction-projection-drafts"
                            className="mt-3 grid gap-2"
                          >
                            {transactionProjectionPreviewDrafts.map((draft) => (
                              <div
                                key={draft.stagingRowId}
                                data-testid="data-import-connected-service-amazon-orders-transaction-projection-draft-row"
                                className="rounded-2xl border border-lime-200 bg-white px-3 py-2"
                              >
                                <div className="font-black text-slate-950">
                                  {draft.transactionDate} / {draft.amount} {draft.currency}
                                </div>
                                <div className="mt-1 text-lime-900">
                                  counterparty={draft.counterparty} / source={draft.source} / rowNo={draft.evidenceSourceRowNo}
                                </div>
                                <div className="mt-1 text-lime-900">
                                  order={draft.sourceOrderId || "-"} / item={draft.sourceOrderItemId || "-"} / dedupeHash={draft.dedupeHash}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div
                            data-testid="data-import-connected-service-amazon-orders-transaction-projection-excluded-rows"
                            className="mt-3 rounded-2xl border border-lime-200 bg-white px-3 py-3"
                          >
                            <div className="text-[11px] font-black text-lime-700">Excluded blocked rows</div>
                            {transactionProjectionPreviewExcluded.length ? (
                              <div className="mt-2 grid gap-2">
                                {transactionProjectionPreviewExcluded.map((row) => (
                                  <div key={row.stagingRowId} className="rounded-xl border border-lime-100 bg-lime-50 px-3 py-2">
                                    rowNo={row.rowNo} / order={row.amazonOrderId || "-"} / reasons={(row.excludedReasons || []).join(",") || "none"}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="mt-1 text-lime-900">none</div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div
                          data-testid="data-import-connected-service-amazon-orders-transaction-projection-empty"
                          className="mt-3 rounded-2xl border border-lime-200 bg-white px-3 py-2 text-lime-800"
                        >
                          まだ Transaction draft は計算されていません。ImportJob 作成後に自動計算されます。
                        </div>
                      )}
                    </div>

                    {/* Step151-L-IMPORTED-ORDERS-READ-MODEL-REFRESH-UI:
                        After real-importjob commit succeeds, refresh the imported orders read-model.
                        This reads existing ImportJob / ImportStagingRow only and must not create
                        Transaction, InventoryMovement, historical sync, or any DB write. */}
                    <div
                      data-testid="data-import-connected-service-amazon-orders-imported-read-model-panel"
                      className="mt-4 rounded-3xl border border-cyan-200 bg-cyan-50 px-4 py-4 text-xs font-bold leading-5 text-cyan-950"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-700">
                            Step151-L Imported Orders Read Model
                          </div>
                          <h3 className="mt-1 text-sm font-black text-slate-950">
                            取込後の注文 read-model
                          </h3>
                          <p
                            data-testid="data-import-connected-service-amazon-orders-imported-read-model-copy"
                            className="mt-1 max-w-3xl text-xs font-bold leading-5 text-cyan-900"
                          >
                            ImportJob 作成後に既存の ImportJob / ImportStagingRow から read-model を再取得します。Transaction 作成・InventoryMovement 書き込み・historical sync は行いません。
                          </p>
                        </div>
                        <button
                          data-testid="data-import-connected-service-amazon-orders-imported-read-model-refresh-button"
                          type="button"
                          onClick={onImportedReadModelRefresh}
                          disabled={!realImportJobCommitResult?.importJobId || importedReadModelLoading}
                          className="inline-flex rounded-xl border border-cyan-300 bg-white px-4 py-2 text-xs font-black text-cyan-800 shadow-sm transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {importedReadModelLoading ? "再読込中..." : "取込済み注文を再読込"}
                        </button>
                      </div>

                      {importedReadModelError ? (
                        <div
                          data-testid="data-import-connected-service-amazon-orders-imported-read-model-error"
                          className="mt-3 rounded-2xl border border-rose-200 bg-white px-3 py-2 text-rose-800"
                        >
                          {importedReadModelError}
                        </div>
                      ) : null}

                      <div
                        data-testid="data-import-connected-service-amazon-orders-imported-read-model-boundaries"
                        className="mt-3 grid gap-2 md:grid-cols-5"
                      >
                        <div className="rounded-2xl border border-cyan-200 bg-white px-3 py-2 font-black">
                          readsExistingImportJob=true
                        </div>
                        <div className="rounded-2xl border border-cyan-200 bg-white px-3 py-2 font-black">
                          readsExistingImportStagingRow=true
                        </div>
                        <div className="rounded-2xl border border-cyan-200 bg-white px-3 py-2 font-black">
                          writesDatabase=false
                        </div>
                        <div className="rounded-2xl border border-cyan-200 bg-white px-3 py-2 font-black">
                          writesTransaction=false
                        </div>
                        <div className="rounded-2xl border border-cyan-200 bg-white px-3 py-2 font-black">
                          writesInventoryMovement=false
                        </div>
                      </div>

                      {importedReadModelList ? (
                        <div
                          data-testid="data-import-connected-service-amazon-orders-imported-read-model-summary"
                          className="mt-4 grid gap-2 md:grid-cols-4"
                        >
                          <div className="rounded-2xl border border-cyan-200 bg-white px-3 py-2">
                            <div className="text-[11px] font-black text-cyan-700">Orders</div>
                            <div data-testid="data-import-connected-service-amazon-orders-imported-read-model-total-orders">
                              {String(importedReadModelList.summary?.totalOrders ?? importedReadModelOrders.length)}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-cyan-200 bg-white px-3 py-2">
                            <div className="text-[11px] font-black text-cyan-700">Items</div>
                            <div data-testid="data-import-connected-service-amazon-orders-imported-read-model-total-items">
                              {String(importedReadModelList.summary?.totalItems ?? 0)}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-cyan-200 bg-white px-3 py-2">
                            <div className="text-[11px] font-black text-cyan-700">Unresolved SKU</div>
                            <div data-testid="data-import-connected-service-amazon-orders-imported-read-model-unresolved-sku">
                              {String(importedReadModelList.summary?.unresolvedSkuCount ?? 0)}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-cyan-200 bg-white px-3 py-2">
                            <div className="text-[11px] font-black text-cyan-700">Amount total</div>
                            <div data-testid="data-import-connected-service-amazon-orders-imported-read-model-amount-total">
                              {String(importedReadModelList.summary?.amountTotal ?? "-")}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          data-testid="data-import-connected-service-amazon-orders-imported-read-model-empty"
                          className="mt-3 rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-cyan-800"
                        >
                          まだ read-model は再取得されていません。ImportJob 作成後に自動更新されます。
                        </div>
                      )}

                      {importedReadModelFirstOrder ? (
                        <div
                          data-testid="data-import-connected-service-amazon-orders-imported-read-model-first-order"
                          className="mt-3 rounded-2xl border border-cyan-200 bg-white px-3 py-3"
                        >
                          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="text-[11px] font-black text-cyan-700">Latest imported order</div>
                              <div data-testid="data-import-connected-service-amazon-orders-imported-read-model-first-order-id" className="font-black text-slate-950">
                                {importedReadModelFirstOrder.orderId}
                              </div>
                              <div data-testid="data-import-connected-service-amazon-orders-imported-read-model-first-order-meta" className="mt-1 text-cyan-900">
                                {importedReadModelFirstOrder.content} / {String(importedReadModelFirstOrder.amount ?? "-")} {importedReadModelFirstOrder.currency || ""}
                              </div>
                            </div>
                            <button
                              data-testid="data-import-connected-service-amazon-orders-imported-read-model-detail-button"
                              type="button"
                              onClick={() => onImportedReadModelOpenDetail(importedReadModelFirstOrder.orderId)}
                              disabled={importedReadModelLoading}
                              className="inline-flex rounded-xl border border-cyan-300 bg-cyan-700 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              明細確認
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {importedReadModelDetail ? (
                        <div
                          data-testid="data-import-connected-service-amazon-orders-imported-read-model-detail"
                          className="mt-3 rounded-2xl border border-cyan-200 bg-white px-3 py-3"
                        >
                          <div className="text-[11px] font-black text-cyan-700">Detail</div>
                          <div data-testid="data-import-connected-service-amazon-orders-imported-read-model-detail-order-id" className="font-black text-slate-950">
                            {importedReadModelDetailOrder?.orderId || importedReadModelSelectedOrderId || "-"}
                          </div>
                          <div data-testid="data-import-connected-service-amazon-orders-imported-read-model-detail-item-count" className="mt-1 text-cyan-900">
                            items={String(importedReadModelDetailItems.length)}
                          </div>
                          <div data-testid="data-import-connected-service-amazon-orders-imported-read-model-detail-boundary" className="mt-2 text-cyan-900">
                            readOnly={String(importedReadModelDetail.readOnly)} / writesDatabase={String(importedReadModelDetail.boundaries?.writesDatabase)}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
                </>
              ) : (
                <div
                  data-testid="data-import-connected-service-amazon-orders-real-preview-empty"
                  className="mt-3 rounded-2xl border border-sky-200 bg-white px-3 py-2 text-sky-800"
                >
                  まだ real-preview は実行されていません。「プレビュー確認」を押すと、DB に保存せず取得内容だけを確認します。
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {fetchShellMessage ? (
        <div
          data-testid="data-import-connected-service-amazon-orders-fetch-shell-message"
          className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs font-black leading-5 text-sky-800"
        >
          {fetchShellMessage}
        </div>
      ) : null}
    </section>
  );
}


export default function DataImportPage() {
  const params = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const lang = normalizeLang(params?.lang) as Lang;
  const moduleHint = searchParams.get("module");

  const [jobs, setJobs] = useState<ImportJobItem[]>([]);
  const [meta, setMeta] = useState<ImportMetaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [amazonOrdersFetchShellMessage, setAmazonOrdersFetchShellMessage] = useState("");
  const [
    amazonOrdersFetchExecutionContractStatus,
    setAmazonOrdersFetchExecutionContractStatus,
  ] = useState<AmazonOrdersFetchExecutionContractStatus>("idle");
  const [amazonOrdersPreflightResult, setAmazonOrdersPreflightResult] =
    useState<AmazonSpApiOrdersGuardedImportPreflightResponse | null>(null);
  const [amazonOrdersPreflightError, setAmazonOrdersPreflightError] = useState("");
  const [amazonOrdersRealPreviewResult, setAmazonOrdersRealPreviewResult] =
    useState<AmazonSpApiOrdersRealPreviewResponse | null>(null);
  const [amazonOrdersRealPreviewLoading, setAmazonOrdersRealPreviewLoading] = useState(false);
  const [amazonOrdersRealPreviewError, setAmazonOrdersRealPreviewError] = useState("");
  const [amazonOrdersRealImportJobCommitResult, setAmazonOrdersRealImportJobCommitResult] =
    useState<AmazonSpApiOrdersRealImportJobCommitResponse | null>(null);
  const [amazonOrdersRealImportJobCommitLoading, setAmazonOrdersRealImportJobCommitLoading] = useState(false);
  const [amazonOrdersRealImportJobCommitError, setAmazonOrdersRealImportJobCommitError] = useState("");
  const [amazonOrdersImportedReadModelList, setAmazonOrdersImportedReadModelList] =
    useState<AmazonImportedOrdersReadModelListResponse | null>(null);
  const [amazonOrdersImportedReadModelDetail, setAmazonOrdersImportedReadModelDetail] =
    useState<AmazonImportedOrderDetailReadModelResponse | null>(null);
  const [amazonOrdersImportedReadModelLoading, setAmazonOrdersImportedReadModelLoading] = useState(false);
  const [amazonOrdersImportedReadModelError, setAmazonOrdersImportedReadModelError] = useState("");
  const [amazonOrdersImportedReadModelSelectedOrderId, setAmazonOrdersImportedReadModelSelectedOrderId] = useState("");
  const [amazonOrdersPullRangePreset, setAmazonOrdersPullRangePreset] =
    useState<AmazonOrdersPullRangePreset>("7D");
  const [amazonOrdersCustomStartDate, setAmazonOrdersCustomStartDate] = useState("");
  const [amazonOrdersCustomEndDate, setAmazonOrdersCustomEndDate] = useState("");
  const [amazonOrdersImportedReadModelPageSize, setAmazonOrdersImportedReadModelPageSize] =
    useState<20 | 50 | 100>(20);
  const [amazonOrdersImportedReadModelPageIndex, setAmazonOrdersImportedReadModelPageIndex] = useState(1);
  const [amazonOrdersImportedReadModelCursorStack, setAmazonOrdersImportedReadModelCursorStack] =
    useState<Array<string | null>>([null]);
  const [amazonOrdersImportedReadModelContentSearch, setAmazonOrdersImportedReadModelContentSearch] = useState("");
  const [amazonOrdersStagingCommitReadiness, setAmazonOrdersStagingCommitReadiness] =
    useState<AmazonSpApiOrdersStagingCommitReadinessResponse | null>(null);
  const [amazonOrdersStagingCommitReadinessLoading, setAmazonOrdersStagingCommitReadinessLoading] = useState(false);
  const [amazonOrdersStagingCommitReadinessError, setAmazonOrdersStagingCommitReadinessError] = useState("");
  const [amazonOrdersTransactionDryRunProjection, setAmazonOrdersTransactionDryRunProjection] =
    useState<AmazonSpApiOrdersTransactionDryRunProjectionResponse | null>(null);
  const [amazonOrdersTransactionDryRunProjectionLoading, setAmazonOrdersTransactionDryRunProjectionLoading] = useState(false);
  const [amazonOrdersTransactionDryRunProjectionError, setAmazonOrdersTransactionDryRunProjectionError] = useState("");
  const [amazonOrdersInventoryDryRunProjection, setAmazonOrdersInventoryDryRunProjection] =
    useState<AmazonSpApiOrdersInventoryDryRunProjectionResponse | null>(null);
  const [amazonOrdersCombinedDryRunProjection, setAmazonOrdersCombinedDryRunProjection] =
    useState<AmazonSpApiOrdersCombinedDryRunProjectionResponse | null>(null);
  const [amazonOrdersCombinedDryRunProjectionLoading, setAmazonOrdersCombinedDryRunProjectionLoading] = useState(false);
  const [amazonOrdersCombinedDryRunProjectionError, setAmazonOrdersCombinedDryRunProjectionError] = useState("");
  const [amazonOrdersFinalCommitReview, setAmazonOrdersFinalCommitReview] =
    useState<AmazonSpApiOrdersFinalCommitReviewResponse | null>(null);
  const [amazonOrdersFinalCommitReviewLoading, setAmazonOrdersFinalCommitReviewLoading] = useState(false);
  const [amazonOrdersFinalCommitReviewError, setAmazonOrdersFinalCommitReviewError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const snapshot = await loadImportJobsPageSnapshot();
      setJobs(Array.isArray(snapshot.jobs.items) ? snapshot.jobs.items : []);
      setMeta(snapshot.meta ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to load import jobs");
      setJobs([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    void refreshAmazonOrdersImportedReadModel(undefined, null, 1);
  }, []);

  function deriveAmazonOrdersPullDateRange() {
    const now = new Date();
    const end = new Date(now);
    let start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (amazonOrdersPullRangePreset === "30D") {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (amazonOrdersPullRangePreset === "90D") {
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (amazonOrdersPullRangePreset === "365D") {
      start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    } else if (amazonOrdersPullRangePreset === "CUSTOM") {
      const customStart = amazonOrdersCustomStartDate ? new Date(`${amazonOrdersCustomStartDate}T00:00:00.000+09:00`) : null;
      const customEnd = amazonOrdersCustomEndDate ? new Date(`${amazonOrdersCustomEndDate}T23:59:59.999+09:00`) : null;

      if (customStart && !Number.isNaN(customStart.getTime())) {
        start = customStart;
      }

      if (customEnd && !Number.isNaN(customEnd.getTime())) {
        end.setTime(customEnd.getTime());
      }
    }

    if (start.getTime() > end.getTime()) {
      throw new Error("開始日は終了日以前にしてください。");
    }

    return {
      createdAfter: start.toISOString(),
      createdBefore: end.toISOString(),
      rangePreset: amazonOrdersPullRangePreset,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  }

  async function handleAmazonOrdersConnectedServiceFetchShell() {
    setAmazonOrdersFetchExecutionContractStatus("preflight_checking");
    setAmazonOrdersPreflightResult(null);
    setAmazonOrdersPreflightError("");
    setAmazonOrdersRealPreviewResult(null);
    setAmazonOrdersRealPreviewError("");
    setAmazonOrdersRealPreviewLoading(false);
    setAmazonOrdersRealImportJobCommitResult(null);
    setAmazonOrdersRealImportJobCommitError("");
    setAmazonOrdersRealImportJobCommitLoading(false);
    setAmazonOrdersImportedReadModelList(null);
    setAmazonOrdersImportedReadModelDetail(null);
    setAmazonOrdersImportedReadModelError("");
    setAmazonOrdersImportedReadModelLoading(false);
    setAmazonOrdersImportedReadModelSelectedOrderId("");
    setAmazonOrdersStagingCommitReadiness(null);
    setAmazonOrdersStagingCommitReadinessError("");
    setAmazonOrdersStagingCommitReadinessLoading(false);
    setAmazonOrdersTransactionDryRunProjection(null);
    setAmazonOrdersTransactionDryRunProjectionError("");
    setAmazonOrdersTransactionDryRunProjectionLoading(false);
    setAmazonOrdersInventoryDryRunProjection(null);
    setAmazonOrdersCombinedDryRunProjection(null);
    setAmazonOrdersCombinedDryRunProjectionError("");
    setAmazonOrdersCombinedDryRunProjectionLoading(false);
    setAmazonOrdersFinalCommitReview(null);
    setAmazonOrdersFinalCommitReviewError("");
    setAmazonOrdersFinalCommitReviewLoading(false);
    setAmazonOrdersImportedReadModelList(null);
    setAmazonOrdersImportedReadModelDetail(null);
    setAmazonOrdersImportedReadModelError("");
    setAmazonOrdersImportedReadModelLoading(false);
    setAmazonOrdersImportedReadModelSelectedOrderId("");
    setAmazonOrdersStagingCommitReadiness(null);
    setAmazonOrdersStagingCommitReadinessError("");
    setAmazonOrdersStagingCommitReadinessLoading(false);
    setAmazonOrdersTransactionDryRunProjection(null);
    setAmazonOrdersTransactionDryRunProjectionError("");
    setAmazonOrdersTransactionDryRunProjectionLoading(false);
    setAmazonOrdersInventoryDryRunProjection(null);
    setAmazonOrdersCombinedDryRunProjection(null);
    setAmazonOrdersCombinedDryRunProjectionError("");
    setAmazonOrdersCombinedDryRunProjectionLoading(false);
    setAmazonOrdersFetchShellMessage(
      "取得入口を選択しました。まず preflight で接続状態・取得範囲・明示確認の必要性を確認します。"
    );

    if (typeof document !== "undefined") {
      const target = document.querySelector('[data-testid="data-import-connected-service-amazon-orders-execution-contract"]');
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    try {
      const dateRange = deriveAmazonOrdersPullDateRange();

      const response = await preflightAmazonSpApiOrdersGuardedImport({
        storeId: "step151-d-ui-contract-store",
        marketplaceId: "A1VC38T7YXB528",
        region: "JP",
        createdAfter: dateRange.createdAfter,
        createdBefore: dateRange.createdBefore,
        rangePreset: dateRange.rangePreset,
        explicitOperatorIntent: true,
      });

      setAmazonOrdersPreflightResult(response);
      setAmazonOrdersFetchExecutionContractStatus(response.allowed ? "preflight_ready" : "blocked");
      setAmazonOrdersFetchShellMessage(
        response.allowed
          ? "preflight が完了しました。プレビュー確認へ進めます。"
          : `preflight は blocked です。nextAction=${response.nextAction} / reasons=${response.reasons.join(",") || "none"}`
      );
    } catch (err) {
      setAmazonOrdersFetchExecutionContractStatus("blocked");
      setAmazonOrdersPreflightError(err instanceof Error ? err.message : "preflight failed");
      setAmazonOrdersFetchShellMessage(
        "preflight に失敗しました。Step151-D は preview/import 実行には進みません。"
      );
    }
  }

  async function handleAmazonOrdersRealPreviewShell() {
    if (!amazonOrdersPreflightResult?.allowed) {
      setAmazonOrdersRealPreviewError("preflight_ready の状態でのみプレビュー確認できます。");
      return;
    }

    const createdAfter = amazonOrdersPreflightResult.dateRange.createdAfter;
    const createdBefore = amazonOrdersPreflightResult.dateRange.createdBefore;

    if (!createdAfter || !createdBefore) {
      setAmazonOrdersRealPreviewError("createdAfter / createdBefore が不足しています。");
      return;
    }

    setAmazonOrdersRealPreviewLoading(true);
    setAmazonOrdersRealPreviewError("");
    setAmazonOrdersRealPreviewResult(null);
    setAmazonOrdersRealImportJobCommitResult(null);
    setAmazonOrdersRealImportJobCommitError("");
    setAmazonOrdersRealImportJobCommitLoading(false);
    setAmazonOrdersFetchExecutionContractStatus("preview_required");
    setAmazonOrdersFetchShellMessage(
      "real-preview を実行しています。取得内容を確認中です。"
    );

    try {
      const dateRange = deriveAmazonOrdersPullDateRange();

      const response = await previewAmazonSpApiOrdersReal({
        storeId: amazonOrdersPreflightResult.scope.storeId,
        marketplaceId: amazonOrdersPreflightResult.scope.marketplaceId,
        region: amazonOrdersPreflightResult.scope.region,
        createdAfter,
        createdBefore,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        realPreview: true,
      });

      if (response.writesDatabase !== false) {
        throw new Error("real-preview response must keep writesDatabase=false.");
      }
      if (response.importJobWriteNow !== false) {
        throw new Error("real-preview response must keep importJobWriteNow=false.");
      }
      if (response.transactionWriteNow !== false) {
        throw new Error("real-preview response must keep transactionWriteNow=false.");
      }
      if (response.inventoryWriteNow !== false) {
        throw new Error("real-preview response must keep inventoryWriteNow=false.");
      }

      setAmazonOrdersRealPreviewResult(response);
      setAmazonOrdersFetchShellMessage(
        "real-preview が完了しました。内容確認後、「取込作成」で ImportJob / ImportStagingRow を作成できます。"
      );
    } catch (err) {
      setAmazonOrdersRealPreviewError(err instanceof Error ? err.message : "real-preview failed");
      setAmazonOrdersFetchShellMessage(
        "real-preview に失敗しました。ImportJob 作成・DB 書き込みには進みません。"
      );
    } finally {
      setAmazonOrdersRealPreviewLoading(false);
    }
  }

  function deriveAmazonOrdersFirstPreviewOrderId(result: AmazonSpApiOrdersRealPreviewResponse | null): string {
    const firstOrder = (result?.normalizedOrders as Array<Record<string, unknown>> | undefined)?.[0];
    const orderId = firstOrder?.amazonOrderId ?? firstOrder?.AmazonOrderId ?? firstOrder?.orderId;
    return typeof orderId === "string" ? orderId : "";
  }

  async function refreshAmazonOrdersImportedReadModel(
    orderIdHint?: string,
    cursorOverride?: string | null,
    pageIndexOverride?: number,
  ) {
    setAmazonOrdersImportedReadModelLoading(true);
    setAmazonOrdersImportedReadModelError("");

    try {
      const dateRange = deriveAmazonOrdersPullDateRange();
      const content = amazonOrdersImportedReadModelContentSearch.trim();
      const list = await listAmazonImportedOrders({
        rangePreset: dateRange.rangePreset,
        startDate: dateRange.rangePreset === "CUSTOM" ? dateRange.startDate : undefined,
        endDate: dateRange.rangePreset === "CUSTOM" ? dateRange.endDate : undefined,
        orderId: orderIdHint || undefined,
        content: content || undefined,
        cursor: cursorOverride || undefined,
        limit: amazonOrdersImportedReadModelPageSize,
      });

      if (list.boundaries?.writesDatabase !== false) {
        throw new Error("imported orders read-model must keep writesDatabase=false.");
      }
      if (list.boundaries?.writesTransaction !== false) {
        throw new Error("imported orders read-model must keep writesTransaction=false.");
      }
      if (list.boundaries?.writesInventoryMovement !== false) {
        throw new Error("imported orders read-model must keep writesInventoryMovement=false.");
      }

      setAmazonOrdersImportedReadModelList(list);
      if (pageIndexOverride) {
        setAmazonOrdersImportedReadModelPageIndex(pageIndexOverride);
      }

      const selectedOrder =
        list.orders.find((order) => orderIdHint && order.orderId === orderIdHint) ??
        list.orders[0] ??
        null;

      if (selectedOrder?.orderId) {
        setAmazonOrdersImportedReadModelSelectedOrderId(selectedOrder.orderId);
        await openAmazonOrdersImportedReadModelDetail(selectedOrder.orderId);
      } else {
        setAmazonOrdersImportedReadModelSelectedOrderId("");
        setAmazonOrdersImportedReadModelDetail(null);
      }
    } catch (err) {
      // Step151-W-H:
      // Keep the currently displayed ImportJob / ImportStagingRow order table visible
      // when a refresh fails, including auth/401 errors from adjacent Amazon pull flows.
      // This table is display-only and must not be cleared by a read-model refresh failure.
      setAmazonOrdersImportedReadModelError(err instanceof Error ? err.message : "imported orders read-model refresh failed");
    } finally {
      setAmazonOrdersImportedReadModelLoading(false);
    }
  }

  function handleAmazonOrdersPullRangePresetChange(value: AmazonOrdersPullRangePreset) {
    setAmazonOrdersPullRangePreset(value);
    setAmazonOrdersImportedReadModelPageIndex(1);
    setAmazonOrdersImportedReadModelCursorStack([null]);
  }

  function handleAmazonOrdersImportedReadModelPageSizeChange(value: 20 | 50 | 100) {
    setAmazonOrdersImportedReadModelPageSize(value);
    setAmazonOrdersImportedReadModelPageIndex(1);
    setAmazonOrdersImportedReadModelCursorStack([null]);
  }

  function handleAmazonOrdersImportedReadModelContentSearchChange(value: string) {
    setAmazonOrdersImportedReadModelContentSearch(value);
    setAmazonOrdersImportedReadModelPageIndex(1);
    setAmazonOrdersImportedReadModelCursorStack([null]);
  }

  async function handleAmazonOrdersImportedReadModelFirstPage() {
    setAmazonOrdersImportedReadModelCursorStack([null]);
    await refreshAmazonOrdersImportedReadModel(undefined, null, 1);
  }

  async function handleAmazonOrdersImportedReadModelPrevPage() {
    const prevPageIndex = Math.max(1, amazonOrdersImportedReadModelPageIndex - 1);
    const prevCursor = amazonOrdersImportedReadModelCursorStack[prevPageIndex - 1] || null;
    await refreshAmazonOrdersImportedReadModel(undefined, prevCursor, prevPageIndex);
  }

  async function handleAmazonOrdersImportedReadModelNextPage() {
    const nextCursor = amazonOrdersImportedReadModelList?.pagination?.nextCursor || null;
    if (!nextCursor) return;

    const nextPageIndex = amazonOrdersImportedReadModelPageIndex + 1;
    const nextStack = [...amazonOrdersImportedReadModelCursorStack];
    nextStack[nextPageIndex - 1] = nextCursor;
    setAmazonOrdersImportedReadModelCursorStack(nextStack);

    await refreshAmazonOrdersImportedReadModel(undefined, nextCursor, nextPageIndex);
  }

  async function handleAmazonOrdersImportedReadModelLastPage() {
    setAmazonOrdersImportedReadModelLoading(true);
    setAmazonOrdersImportedReadModelError("");

    try {
      const dateRange = deriveAmazonOrdersPullDateRange();
      let cursor: string | null = null;
      let pageIndex = 1;
      const cursorStack: Array<string | null> = [null];
      const content = amazonOrdersImportedReadModelContentSearch.trim();
      let latest = await listAmazonImportedOrders({
        rangePreset: dateRange.rangePreset,
        startDate: dateRange.rangePreset === "CUSTOM" ? dateRange.startDate : undefined,
        endDate: dateRange.rangePreset === "CUSTOM" ? dateRange.endDate : undefined,
        content: content || undefined,
        limit: amazonOrdersImportedReadModelPageSize,
      });

      while (latest.pagination?.hasMore && latest.pagination?.nextCursor && pageIndex < 200) {
        cursor = latest.pagination.nextCursor;
        pageIndex += 1;
        cursorStack[pageIndex - 1] = cursor;
        latest = await listAmazonImportedOrders({
          rangePreset: dateRange.rangePreset,
          startDate: dateRange.rangePreset === "CUSTOM" ? dateRange.startDate : undefined,
          endDate: dateRange.rangePreset === "CUSTOM" ? dateRange.endDate : undefined,
          content: content || undefined,
          cursor,
          limit: amazonOrdersImportedReadModelPageSize,
        });
      }

      if (latest.boundaries?.writesDatabase !== false) {
        throw new Error("imported orders read-model must keep writesDatabase=false.");
      }
      if (latest.boundaries?.writesTransaction !== false) {
        throw new Error("imported orders read-model must keep writesTransaction=false.");
      }
      if (latest.boundaries?.writesInventoryMovement !== false) {
        throw new Error("imported orders read-model must keep writesInventoryMovement=false.");
      }

      setAmazonOrdersImportedReadModelCursorStack(cursorStack);
      setAmazonOrdersImportedReadModelPageIndex(pageIndex);
      setAmazonOrdersImportedReadModelList(latest);
      setAmazonOrdersImportedReadModelDetail(null);
      setAmazonOrdersImportedReadModelSelectedOrderId("");
    } catch (err) {
      setAmazonOrdersImportedReadModelError(err instanceof Error ? err.message : "imported orders last page failed");
    } finally {
      setAmazonOrdersImportedReadModelLoading(false);
    }
  }

  async function openAmazonOrdersImportedReadModelDetail(orderId: string) {
    if (!orderId) return;

    setAmazonOrdersImportedReadModelLoading(true);
    setAmazonOrdersImportedReadModelError("");
    setAmazonOrdersImportedReadModelSelectedOrderId(orderId);

    try {
      const detail = await getAmazonImportedOrderDetail(orderId);

      if (detail.boundaries?.writesDatabase !== false) {
        throw new Error("imported order detail read-model must keep writesDatabase=false.");
      }
      if (detail.boundaries?.writesTransaction !== false) {
        throw new Error("imported order detail read-model must keep writesTransaction=false.");
      }
      if (detail.boundaries?.writesInventoryMovement !== false) {
        throw new Error("imported order detail read-model must keep writesInventoryMovement=false.");
      }

      setAmazonOrdersImportedReadModelDetail(detail);
    } catch (err) {
      setAmazonOrdersImportedReadModelError(err instanceof Error ? err.message : "imported order detail read-model failed");
      setAmazonOrdersImportedReadModelDetail(null);
    } finally {
      setAmazonOrdersImportedReadModelLoading(false);
    }
  }

  async function refreshAmazonOrdersStagingCommitReadiness(importJobId?: string | null) {
    const normalizedImportJobId = String(importJobId || "").trim();

    if (!normalizedImportJobId) {
      setAmazonOrdersStagingCommitReadinessError("ImportJob ID がないため readiness を確認できません。");
      return;
    }

    setAmazonOrdersStagingCommitReadinessLoading(true);
    setAmazonOrdersStagingCommitReadinessError("");

    try {
      const readiness = await readAmazonSpApiOrdersStagingCommitReadiness(normalizedImportJobId);

      if (readiness.writesDatabase !== false) {
        throw new Error("staging commit readiness must keep writesDatabase=false.");
      }
      if (readiness.transactionWriteNow !== false) {
        throw new Error("staging commit readiness must keep transactionWriteNow=false.");
      }
      if (readiness.inventoryWriteNow !== false) {
        throw new Error("staging commit readiness must keep inventoryWriteNow=false.");
      }

      setAmazonOrdersStagingCommitReadiness(readiness);
    } catch (err) {
      setAmazonOrdersStagingCommitReadinessError(err instanceof Error ? err.message : "staging commit readiness failed");
      setAmazonOrdersStagingCommitReadiness(null);
    } finally {
      setAmazonOrdersStagingCommitReadinessLoading(false);
    }
  }

  async function refreshAmazonOrdersTransactionDryRunProjection(importJobId?: string | null) {
    const normalizedImportJobId = String(importJobId || "").trim();

    if (!normalizedImportJobId) {
      setAmazonOrdersTransactionDryRunProjectionError("ImportJob ID がないため Transaction draft を確認できません。");
      return;
    }

    setAmazonOrdersTransactionDryRunProjectionLoading(true);
    setAmazonOrdersTransactionDryRunProjectionError("");

    try {
      const projection = await readAmazonSpApiOrdersTransactionDryRunProjection(normalizedImportJobId);

      if (projection.writesDatabase !== false) {
        throw new Error("transaction dry-run projection must keep writesDatabase=false.");
      }
      if (projection.transactionWriteNow !== false || projection.createsTransactionNow !== false) {
        throw new Error("transaction dry-run projection must not create Transaction.");
      }
      if (projection.inventoryWriteNow !== false || projection.createsInventoryMovementNow !== false) {
        throw new Error("transaction dry-run projection must not write InventoryMovement.");
      }
      if (projection.historicalSyncNow !== false) {
        throw new Error("transaction dry-run projection must not run historical sync.");
      }

      setAmazonOrdersTransactionDryRunProjection(projection);
    } catch (err) {
      setAmazonOrdersTransactionDryRunProjectionError(err instanceof Error ? err.message : "transaction dry-run projection failed");
      setAmazonOrdersTransactionDryRunProjection(null);
    } finally {
      setAmazonOrdersTransactionDryRunProjectionLoading(false);
    }
  }

  async function refreshAmazonOrdersCombinedDryRunProjection(importJobId?: string | null) {
    const normalizedImportJobId = String(importJobId || "").trim();

    if (!normalizedImportJobId) {
      setAmazonOrdersCombinedDryRunProjectionError("ImportJob ID がないため combined preview を確認できません。");
      return;
    }

    setAmazonOrdersCombinedDryRunProjectionLoading(true);
    setAmazonOrdersCombinedDryRunProjectionError("");

    try {
      const [inventory, combined] = await Promise.all([
        readAmazonSpApiOrdersInventoryDryRunProjection(normalizedImportJobId),
        readAmazonSpApiOrdersCombinedDryRunProjection(normalizedImportJobId),
      ]);

      if (
        inventory.writesDatabase !== false ||
        inventory.inventoryWriteNow !== false ||
        inventory.createsInventoryMovementNow !== false ||
        inventory.createsTransactionNow !== false
      ) {
        throw new Error("inventory dry-run projection must not write DB / Transaction / InventoryMovement.");
      }

      if (
        combined.writesDatabase !== false ||
        combined.transactionWriteNow !== false ||
        combined.inventoryWriteNow !== false ||
        combined.createsTransactionNow !== false ||
        combined.createsInventoryMovementNow !== false ||
        combined.historicalSyncNow !== false
      ) {
        throw new Error("combined dry-run projection must keep all write boundaries false.");
      }

      setAmazonOrdersInventoryDryRunProjection(inventory);
      setAmazonOrdersCombinedDryRunProjection(combined);
    } catch (err) {
      setAmazonOrdersCombinedDryRunProjectionError(err instanceof Error ? err.message : "combined dry-run projection failed");
      setAmazonOrdersInventoryDryRunProjection(null);
      setAmazonOrdersCombinedDryRunProjection(null);
    } finally {
      setAmazonOrdersCombinedDryRunProjectionLoading(false);
    }
  }

  async function refreshAmazonOrdersFinalCommitReview(importJobId?: string | null) {
    const normalizedImportJobId = String(importJobId || "").trim();

    if (!normalizedImportJobId) {
      setAmazonOrdersFinalCommitReviewError("ImportJob ID がないため final commit review を確認できません。");
      return;
    }

    setAmazonOrdersFinalCommitReviewLoading(true);
    setAmazonOrdersFinalCommitReviewError("");

    try {
      const review = await readAmazonSpApiOrdersFinalCommitReview(normalizedImportJobId);

      if (review.writesDatabase !== false) {
        throw new Error("final commit review must keep writesDatabase=false.");
      }
      if (review.transactionWriteNow !== false || review.createsTransactionNow !== false) {
        throw new Error("final commit review must not create Transaction.");
      }
      if (review.inventoryWriteNow !== false || review.createsInventoryMovementNow !== false) {
        throw new Error("final commit review must not create InventoryMovement.");
      }
      if (review.historicalSyncNow !== false) {
        throw new Error("final commit review must not run historical sync.");
      }
      if (review.reviewOnly !== true || review.dryRun !== true) {
        throw new Error("final commit review must remain reviewOnly dryRun.");
      }

      setAmazonOrdersFinalCommitReview(review);
    } catch (err) {
      setAmazonOrdersFinalCommitReviewError(err instanceof Error ? err.message : "final commit review failed");
      setAmazonOrdersFinalCommitReview(null);
    } finally {
      setAmazonOrdersFinalCommitReviewLoading(false);
    }
  }

  async function handleAmazonOrdersRealImportJobCommitShell() {
    if (!amazonOrdersPreflightResult?.allowed || !amazonOrdersRealPreviewResult) {
      setAmazonOrdersRealImportJobCommitError("real-preview 完了後にのみ取込作成できます。");
      return;
    }

    const createdAfter = amazonOrdersPreflightResult.dateRange.createdAfter;
    const createdBefore = amazonOrdersPreflightResult.dateRange.createdBefore;

    if (!createdAfter || !createdBefore) {
      setAmazonOrdersRealImportJobCommitError("createdAfter / createdBefore が不足しています。");
      return;
    }

    setAmazonOrdersRealImportJobCommitLoading(true);
    setAmazonOrdersRealImportJobCommitError("");
    setAmazonOrdersRealImportJobCommitResult(null);
    setAmazonOrdersFetchExecutionContractStatus("confirmation_required");
    setAmazonOrdersFetchShellMessage(
      "ImportJob / ImportStagingRow を作成しています。Transaction / Inventory はまだ未反映です。"
    );

    try {
      const dateRange = deriveAmazonOrdersPullDateRange();

      const response = await commitAmazonSpApiOrdersRealImportJob({
        storeId: amazonOrdersPreflightResult.scope.storeId,
        marketplaceId: amazonOrdersPreflightResult.scope.marketplaceId,
        region: amazonOrdersPreflightResult.scope.region,
        createdAfter,
        createdBefore,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        realPreview: true,
      });

      if (response.controllerWritesTransaction !== false) {
        throw new Error("real-importjob response must keep controllerWritesTransaction=false.");
      }
      if (response.controllerWritesInventory !== false) {
        throw new Error("real-importjob response must keep controllerWritesInventory=false.");
      }
      if (response.boundaries?.writesTransaction !== false) {
        throw new Error("real-importjob response must keep boundaries.writesTransaction=false.");
      }
      if (response.boundaries?.writesInventoryMovement !== false && response.boundaries?.writesInventory !== false) {
        throw new Error("real-importjob response must keep inventory write boundaries=false.");
      }

      setAmazonOrdersRealImportJobCommitResult(response);
      setAmazonOrdersFetchShellMessage(
        `取込完了。期間=${dateRange.startDate}〜${dateRange.endDate} / importJobId=${response.importJobId || "-"} / totalRows=${String(response.totalRows ?? "-")} / Transaction・Inventory はまだ未反映です。`
      );

      await load();
      setAmazonOrdersImportedReadModelCursorStack([null]);
      setAmazonOrdersImportedReadModelPageIndex(1);
      await refreshAmazonOrdersImportedReadModel(undefined, null, 1);

      const firstOrderId = deriveAmazonOrdersFirstPreviewOrderId(amazonOrdersRealPreviewResult);
      if (firstOrderId) {
        await openAmazonOrdersImportedReadModelDetail(firstOrderId);
      }

      await refreshAmazonOrdersStagingCommitReadiness(response.importJobId);
      await refreshAmazonOrdersTransactionDryRunProjection(response.importJobId);
      await refreshAmazonOrdersCombinedDryRunProjection(response.importJobId);
      await refreshAmazonOrdersFinalCommitReview(response.importJobId);
    } catch (err) {
      setAmazonOrdersRealImportJobCommitError(err instanceof Error ? err.message : "real-importjob commit failed");
      setAmazonOrdersFetchShellMessage(
        "ImportJob 作成に失敗しました。Transaction / InventoryMovement 作成には進みません。"
      );
    } finally {
      setAmazonOrdersRealImportJobCommitLoading(false);
    }
  }

  const latestUpdatedAt = useMemo(() => {
    const values = jobs
      .map((x) => {
        const raw = x.updatedAt;
        if (!raw) return Number.NaN;
        return new Date(raw).getTime();
      })
      .filter((x) => Number.isFinite(x));

    if (values.length === 0) return "-";
    return fmtDate(new Date(Math.max(...values)).toISOString());
  }, [jobs]);

  if (loading) {
    return <JobsLoadingState text="import jobs を読み込み中..." />;
  }

  if (error) {
    return (
      <JobsErrorState
        title="データインポート情報の取得に失敗しました"
        error={error}
        onReload={load}
        secondaryHref={`/${lang}/app/settings`}
        secondaryLabel="Settings に戻る"
      />
    );
  }

  return (
    <main className="space-y-6">
      
      <AmazonOrdersConnectedServicesShell
        onFetchShell={() => void handleAmazonOrdersConnectedServiceFetchShell()}
        onPreviewShell={() => void handleAmazonOrdersRealPreviewShell()}
        onImportCommitShell={() => void handleAmazonOrdersRealImportJobCommitShell()}
        amazonOrdersPullRangePreset={amazonOrdersPullRangePreset}
        amazonOrdersCustomStartDate={amazonOrdersCustomStartDate}
        amazonOrdersCustomEndDate={amazonOrdersCustomEndDate}
        amazonOrdersImportedReadModelPageSize={amazonOrdersImportedReadModelPageSize}
        amazonOrdersImportedReadModelPageIndex={amazonOrdersImportedReadModelPageIndex}
        amazonOrdersImportedReadModelContentSearch={amazonOrdersImportedReadModelContentSearch}
        onAmazonOrdersPullRangePresetChange={handleAmazonOrdersPullRangePresetChange}
        onAmazonOrdersCustomStartDateChange={setAmazonOrdersCustomStartDate}
        onAmazonOrdersCustomEndDateChange={setAmazonOrdersCustomEndDate}
        onAmazonOrdersImportedReadModelPageSizeChange={handleAmazonOrdersImportedReadModelPageSizeChange}
        onAmazonOrdersImportedReadModelFirstPage={() => void handleAmazonOrdersImportedReadModelFirstPage()}
        onAmazonOrdersImportedReadModelContentSearchChange={handleAmazonOrdersImportedReadModelContentSearchChange}
        onAmazonOrdersImportedReadModelPrevPage={() => void handleAmazonOrdersImportedReadModelPrevPage()}
        onAmazonOrdersImportedReadModelNextPage={() => void handleAmazonOrdersImportedReadModelNextPage()}
        onAmazonOrdersImportedReadModelLastPage={() => void handleAmazonOrdersImportedReadModelLastPage()}
        fetchShellMessage={amazonOrdersFetchShellMessage}
        executionContractStatus={amazonOrdersFetchExecutionContractStatus}
        preflightResult={amazonOrdersPreflightResult}
        preflightError={amazonOrdersPreflightError}
        realPreviewResult={amazonOrdersRealPreviewResult}
        realPreviewLoading={amazonOrdersRealPreviewLoading}
        realPreviewError={amazonOrdersRealPreviewError}
        realImportJobCommitResult={amazonOrdersRealImportJobCommitResult}
        realImportJobCommitLoading={amazonOrdersRealImportJobCommitLoading}
        realImportJobCommitError={amazonOrdersRealImportJobCommitError}
        importedReadModelList={amazonOrdersImportedReadModelList}
        importedReadModelDetail={amazonOrdersImportedReadModelDetail}
        importedReadModelLoading={amazonOrdersImportedReadModelLoading}
        importedReadModelError={amazonOrdersImportedReadModelError}
        importedReadModelSelectedOrderId={amazonOrdersImportedReadModelSelectedOrderId}
        stagingCommitReadiness={amazonOrdersStagingCommitReadiness}
        stagingCommitReadinessLoading={amazonOrdersStagingCommitReadinessLoading}
        stagingCommitReadinessError={amazonOrdersStagingCommitReadinessError}
        transactionDryRunProjection={amazonOrdersTransactionDryRunProjection}
        transactionDryRunProjectionLoading={amazonOrdersTransactionDryRunProjectionLoading}
        transactionDryRunProjectionError={amazonOrdersTransactionDryRunProjectionError}
        inventoryDryRunProjection={amazonOrdersInventoryDryRunProjection}
        combinedDryRunProjection={amazonOrdersCombinedDryRunProjection}
        combinedDryRunProjectionLoading={amazonOrdersCombinedDryRunProjectionLoading}
        combinedDryRunProjectionError={amazonOrdersCombinedDryRunProjectionError}
        finalCommitReview={amazonOrdersFinalCommitReview}
        finalCommitReviewLoading={amazonOrdersFinalCommitReviewLoading}
        finalCommitReviewError={amazonOrdersFinalCommitReviewError}
        onImportedReadModelRefresh={() => void refreshAmazonOrdersImportedReadModel(deriveAmazonOrdersFirstPreviewOrderId(amazonOrdersRealPreviewResult))}
        onImportedReadModelOpenDetail={(orderId) => void openAmazonOrdersImportedReadModelDetail(orderId)}
        onStagingCommitReadinessRefresh={() => void refreshAmazonOrdersStagingCommitReadiness(amazonOrdersRealImportJobCommitResult?.importJobId)}
        onTransactionDryRunProjectionRefresh={() => void refreshAmazonOrdersTransactionDryRunProjection(amazonOrdersRealImportJobCommitResult?.importJobId)}
        onCombinedDryRunProjectionRefresh={() => void refreshAmazonOrdersCombinedDryRunProjection(amazonOrdersRealImportJobCommitResult?.importJobId)}
        onFinalCommitReviewRefresh={() => void refreshAmazonOrdersFinalCommitReview(amazonOrdersRealImportJobCommitResult?.importJobId)}
      />

      <AmazonSpApiConnectionStatusPanel />
      <AmazonSpApiOrdersDryRunPreviewPanel />
      <AmazonSpApiOrdersProductionCloseoutPanel />
{/* Step122-W: Amazon SP-API sandbox read-model panel UI shell. No fetch / no endpoint call. */}
      <AmazonSpApiSandboxReadModelPanelShell />
      <ImportJobsHero
        lang={lang}
        onReload={load}
        total={meta?.summary?.total ?? 0}
        pending={meta?.summary?.pending ?? 0}
        succeeded={meta?.summary?.succeeded ?? 0}
        latestUpdatedAt={latestUpdatedAt}
      />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <JobsMetricCard
          label="処理中"
          value={meta?.summary?.processing ?? 0}
          helper="PROCESSING"
          tone="primary"
        />
        <JobsMetricCard
          label="失敗"
          value={meta?.summary?.failed ?? 0}
          helper="FAILED"
          tone="warning"
        />
        <JobsMetricCard
          label="利用可能ドメイン"
          value={(meta?.domains?.filter((x) => x.value).length ?? 0).toString()}
          helper="meta.domains"
          tone="success"
        />
        <JobsMetricCard
          label="現在の状態"
          value="foundation active"
          helper="amazon-store-orders preview/create baseline"
        />
      </section>

      <ImportWorkspaceShell moduleHint={moduleHint} />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <ImportJobsTableCard jobs={jobs} />
        <ImportJobsMetaSummaryCard meta={meta} />
      </section>
    </main>
  );
}
