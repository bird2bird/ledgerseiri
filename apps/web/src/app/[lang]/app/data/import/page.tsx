"use client";

import { AmazonSpApiConnectionStatusPanel } from "@/components/app/imports/AmazonSpApiConnectionStatusPanel";
import { AmazonSpApiOrdersDryRunPreviewPanel } from "@/components/app/imports/AmazonSpApiOrdersDryRunPreviewPanel";
import { AmazonSpApiOrdersProductionCloseoutPanel } from "@/components/app/imports/AmazonSpApiOrdersProductionCloseoutPanel";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
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


function AmazonOrdersConnectedServicesShell({
  onFetchShell,
  fetchShellMessage,
}: {
  onFetchShell: () => void;
  fetchShellMessage: string;
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
            Step150-D は単一の「取得」入口を有効化しますが、Amazon取得・ImportJob作成・SyncJob作成・DB書き込みは行いません。
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
              title="Step150-D は UI shell のみです。Amazon取得・ImportJob作成・SyncJob作成・DB書き込みは行いません。"
              className="inline-flex rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800"
            >
              取得
            </button>
          </div>
        </div>
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

  function handleAmazonOrdersConnectedServiceFetchShell() {
    setAmazonOrdersFetchShellMessage(
      "取得入口を選択しました。Step150-D は UI shell のみのため、Amazon取得・ImportJob作成・SyncJob作成・DB書き込みは行いません。下の Amazon注文取得 エリアで期間と取得準備を確認してください。"
    );

    if (typeof document !== "undefined") {
      const target = document.querySelector('[data-testid="amazon-sp-api-simple-order-pull-card"]');
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
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
        onFetchShell={handleAmazonOrdersConnectedServiceFetchShell}
        fetchShellMessage={amazonOrdersFetchShellMessage}
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
