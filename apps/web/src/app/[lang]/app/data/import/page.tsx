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
  type AmazonSpApiOrdersGuardedImportPreflightResponse,
  type AmazonSpApiOrdersRealPreviewResponse,
  type AmazonSpApiOrdersRealImportJobCommitResponse,
  type AmazonImportedOrdersReadModelListResponse,
  type AmazonImportedOrderDetailReadModelResponse,
  type AmazonSpApiOrdersStagingCommitReadinessResponse,
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
  onImportedReadModelRefresh,
  onImportedReadModelOpenDetail,
  onStagingCommitReadinessRefresh,
}: {
  onFetchShell: () => void;
  onPreviewShell: () => void;
  onImportCommitShell: () => void;
  onImportedReadModelRefresh: () => void;
  onImportedReadModelOpenDetail: (orderId: string) => void;
  onStagingCommitReadinessRefresh: () => void;
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
}) {
  const importedReadModelOrders = importedReadModelList?.orders ?? [];
  const importedReadModelFirstOrder = importedReadModelOrders[0] ?? null;
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
          既定の取得期間：最近7日
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
  const [amazonOrdersStagingCommitReadiness, setAmazonOrdersStagingCommitReadiness] =
    useState<AmazonSpApiOrdersStagingCommitReadinessResponse | null>(null);
  const [amazonOrdersStagingCommitReadinessLoading, setAmazonOrdersStagingCommitReadinessLoading] = useState(false);
  const [amazonOrdersStagingCommitReadinessError, setAmazonOrdersStagingCommitReadinessError] = useState("");

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
  }, []);

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
    setAmazonOrdersImportedReadModelList(null);
    setAmazonOrdersImportedReadModelDetail(null);
    setAmazonOrdersImportedReadModelError("");
    setAmazonOrdersImportedReadModelLoading(false);
    setAmazonOrdersImportedReadModelSelectedOrderId("");
    setAmazonOrdersStagingCommitReadiness(null);
    setAmazonOrdersStagingCommitReadinessError("");
    setAmazonOrdersStagingCommitReadinessLoading(false);
    setAmazonOrdersFetchShellMessage(
      "取得入口を選択しました。まず preflight で接続状態・取得範囲・明示確認の必要性を確認します。"
    );

    if (typeof document !== "undefined") {
      const target = document.querySelector('[data-testid="data-import-connected-service-amazon-orders-execution-contract"]');
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    try {
      const now = new Date();
      const createdBefore = now.toISOString();
      const createdAfter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const response = await preflightAmazonSpApiOrdersGuardedImport({
        storeId: "step151-d-ui-contract-store",
        marketplaceId: "A1VC38T7YXB528",
        region: "JP",
        createdAfter,
        createdBefore,
        rangePreset: "7D",
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
      const response = await previewAmazonSpApiOrdersReal({
        storeId: amazonOrdersPreflightResult.scope.storeId,
        marketplaceId: amazonOrdersPreflightResult.scope.marketplaceId,
        region: amazonOrdersPreflightResult.scope.region,
        createdAfter,
        createdBefore,
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

  async function refreshAmazonOrdersImportedReadModel(orderIdHint?: string) {
    setAmazonOrdersImportedReadModelLoading(true);
    setAmazonOrdersImportedReadModelError("");

    try {
      const list = await listAmazonImportedOrders({
        orderId: orderIdHint || undefined,
        limit: 10,
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
      setAmazonOrdersImportedReadModelError(err instanceof Error ? err.message : "imported orders read-model refresh failed");
      setAmazonOrdersImportedReadModelList(null);
      setAmazonOrdersImportedReadModelDetail(null);
      setAmazonOrdersImportedReadModelSelectedOrderId("");
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
      const response = await commitAmazonSpApiOrdersRealImportJob({
        storeId: amazonOrdersPreflightResult.scope.storeId,
        marketplaceId: amazonOrdersPreflightResult.scope.marketplaceId,
        region: amazonOrdersPreflightResult.scope.region,
        createdAfter,
        createdBefore,
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
        `取込完了。importJobId=${response.importJobId || "-"} / totalRows=${String(response.totalRows ?? "-")} / Transaction・Inventory はまだ未反映です。`
      );

      await load();
      await refreshAmazonOrdersImportedReadModel(deriveAmazonOrdersFirstPreviewOrderId(amazonOrdersRealPreviewResult));
      await refreshAmazonOrdersStagingCommitReadiness(response.importJobId);
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
        onImportedReadModelRefresh={() => void refreshAmazonOrdersImportedReadModel(deriveAmazonOrdersFirstPreviewOrderId(amazonOrdersRealPreviewResult))}
        onImportedReadModelOpenDetail={(orderId) => void openAmazonOrdersImportedReadModelDetail(orderId)}
        onStagingCommitReadinessRefresh={() => void refreshAmazonOrdersStagingCommitReadiness(amazonOrdersRealImportJobCommitResult?.importJobId)}
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
