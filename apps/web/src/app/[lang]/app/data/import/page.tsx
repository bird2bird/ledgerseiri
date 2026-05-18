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
  type AmazonSpApiOrdersGuardedImportPreflightResponse,
  type AmazonSpApiOrdersRealPreviewResponse,
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
    description: "会社・店舗・marketplace・取得期間・接続状態を確認する段階です。Step151-Bでは実行しません。",
  },
  {
    key: "preflight_checking",
    label: "1.5 事前確認中",
    description: "Step151-Dで preflight endpoint だけを呼び出し、接続状態と取得条件を確認します。",
  },
  {
    key: "preflight_ready",
    label: "1.6 事前確認OK",
    description: "preflight が READY_FOR_PREVIEW を返した状態です。Step151-Dでは preview は呼び出しません。",
  },
  {
    key: "preview_required",
    label: "2. プレビュー",
    description: "プレビューAPIで取得内容を確認する将来段階です。Step151-Dでは呼び出しません。",
  },
  {
    key: "confirmation_required",
    label: "3. 明示確認",
    description: "ユーザー確認後にのみ ImportJob 作成へ進む将来段階です。Step151-Bでは作成しません。",
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
  fetchShellMessage,
  executionContractStatus,
  preflightResult,
  preflightError,
  realPreviewResult,
  realPreviewLoading,
  realPreviewError,
}: {
  onFetchShell: () => void;
  onPreviewShell: () => void;
  fetchShellMessage: string;
  executionContractStatus: AmazonOrdersFetchExecutionContractStatus;
  preflightResult: AmazonSpApiOrdersGuardedImportPreflightResponse | null;
  preflightError: string;
  realPreviewResult: AmazonSpApiOrdersRealPreviewResponse | null;
  realPreviewLoading: boolean;
  realPreviewError: string;
}) {
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
            Step151-B は「取得」入口を guarded execution contract に更新しますが、Amazon取得・ImportJob作成・SyncJob作成・DB書き込みは行いません。
            Step150-D は UI shell のみです。
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
            未取得
          </div>

          <div className="border-r border-slate-200 px-4 py-4">
            <span
              data-testid="data-import-connected-service-amazon-orders-status"
              className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700"
            >
              取得準備
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
              title="Step151-B は実行契約のみです。プレビューAPI・インポート作成API・履歴同期API・DB書き込みは行いません。"
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
              Step151-B Guarded Execution Contract
            </div>
            <h3 className="mt-1 text-sm font-black text-slate-950">
              取得は preview → 明示確認 → ImportJob 作成の順に進めます
            </h3>
            <p
              data-testid="data-import-connected-service-amazon-orders-execution-contract-copy"
              className="mt-1 max-w-3xl text-xs font-bold leading-5 text-indigo-900"
            >
              このステップでは実行契約だけを表示します。プレビューAPI、インポート作成API、履歴同期API、Amazon API、DB書き込みは呼び出しません。
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
            Show a review-only preview shell after guarded preflight is ready.
            This shell does not call real-preview, does not create ImportJob,
            and does not write DB / Transaction / InventoryMovement. */}
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
                  この領域は preflight_ready 後の確認用 shell です。Step151-F では real-preview API、ImportJob 作成、DB 書き込みは実行しません。
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
                This result panel must not trigger real-importjob, ImportJob persistence,
                Transaction creation, or InventoryMovement writes. */}
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
                    この結果は real-preview API の表示専用結果です。ImportJob 作成・DB 書き込み・Transaction/InventoryMovement 作成は行いません。
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
    setAmazonOrdersFetchShellMessage(
      "取得入口を選択しました。Step151-D は preflight endpoint だけを呼び出して、接続状態・取得範囲・明示確認の必要性を確認します。プレビューAPI・インポート作成API・履歴同期API・Amazon API・DB書き込みは行いません。"
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
          ? "preflight が完了しました。次の段階は preview ですが、Step151-D では preview は呼び出しません。"
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
    setAmazonOrdersFetchExecutionContractStatus("preview_required");
    setAmazonOrdersFetchShellMessage(
      "Step151-G: real-preview を実行しています。ImportJob 作成・DB 書き込み・Transaction/InventoryMovement 作成は行いません。"
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
        "real-preview が完了しました。Step151-G では結果表示のみで、ImportJob 作成・DB 書き込みは行いません。"
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
        fetchShellMessage={amazonOrdersFetchShellMessage}
        executionContractStatus={amazonOrdersFetchExecutionContractStatus}
        preflightResult={amazonOrdersPreflightResult}
        preflightError={amazonOrdersPreflightError}
        realPreviewResult={amazonOrdersRealPreviewResult}
        realPreviewLoading={amazonOrdersRealPreviewLoading}
        realPreviewError={amazonOrdersRealPreviewError}
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
