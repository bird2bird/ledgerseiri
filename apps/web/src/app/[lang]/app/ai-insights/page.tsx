"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import { useWorkspaceGate } from "@/hooks/useWorkspaceGate";

type WorkspaceContextResponse = {
  workspace?: {
    slug?: string;
    displayName?: string;
    companyName?: string;
    locale?: string;
  };
  subscription?: {
    planCode?: string;
    status?: string;
    source?: string;
    entitlements?: Record<string, boolean>;
    limits?: {
      maxStores?: number;
      invoiceStorageMb?: number;
      aiChatMonthly?: number;
      aiInvoiceOcrMonthly?: number;
      historyMonths?: number;
    };
  };
};

type UsageResponse = {
  effectiveLimits?: {
    maxStores?: number;
    invoiceStorageMb?: number;
    aiChatMonthly?: number;
    aiInvoiceOcrMonthly?: number;
    historyMonths?: number;
  };
  usage?: {
    storesUsed?: number;
    invoiceStorageMbUsed?: number;
    aiChatUsedMonthly?: number;
    aiInvoiceOcrUsedMonthly?: number;
  };
  utilization?: {
    storesPct?: number;
    invoiceStoragePct?: number;
    aiChatPct?: number;
    aiInvoiceOcrPct?: number;
  };
  overLimit?: {
    stores?: boolean;
    invoiceStorage?: boolean;
    aiChat?: boolean;
    aiInvoiceOcr?: boolean;
  };
  period?: {
    monthKey?: string;
  };
};

type DashboardSummaryResponse = {
  summary?: {
    revenue?: number;
    expense?: number;
    profit?: number;
    cash?: number;
    estimatedTax?: number;
    unpaidAmount?: number;
    unpaidCount?: number;
    inventoryValue?: number;
    inventoryAlertCount?: number;
    runwayMonths?: number;
  };
  businessHealth?: {
    score?: number;
    status?: string;
    headline?: string;
    summary?: string;
    items?: Array<{
      label?: string;
      value?: string;
    }>;
  };
  alerts?: Array<{
    key?: string;
    level?: string;
    title?: string;
    description?: string;
  }>;
};

type ReportSummaryResponse = {
  summary?: Record<string, number>;
};

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function fmtJPY(value?: number | null) {
  return `¥${Math.round(Number(value ?? 0)).toLocaleString("ja-JP")}`;
}

function pct(value?: number | null) {
  return `${Number(value ?? 0).toFixed(0)}%`;
}

function LoadingCard({ text }: { text: string }) {
  return (
    <section className="ls-card-solid rounded-[28px] p-6">
      <div className="text-sm text-slate-500">{text}</div>
    </section>
  );
}

function StatCard(props: {
  title: string;
  value: string;
  helper: string;
  tone?: "default" | "success" | "warning" | "primary";
}) {
  const tone =
    props.tone === "success"
      ? "border-emerald-200 bg-emerald-50"
      : props.tone === "warning"
      ? "border-amber-200 bg-amber-50"
      : props.tone === "primary"
      ? "border-sky-200 bg-sky-50"
      : "border-slate-200 bg-slate-50";

  return (
    <section className={cls("rounded-[24px] border p-5", tone)}>
      <div className="text-xs font-medium text-slate-500">{props.title}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{props.value}</div>
      <div className="mt-2 text-sm text-slate-600">{props.helper}</div>
    </section>
  );
}

function InsightRow(props: {
  title: string;
  detail: string;
  tone?: "default" | "good" | "watch";
}) {
  const tone =
    props.tone === "good"
      ? "border-emerald-200 bg-emerald-50"
      : props.tone === "watch"
      ? "border-amber-200 bg-amber-50"
      : "border-slate-200 bg-white";

  return (
    <div className={cls("rounded-[22px] border p-4", tone)}>
      <div className="text-sm font-semibold text-slate-900">{props.title}</div>
      <div className="mt-2 text-sm leading-6 text-slate-600">{props.detail}</div>
    </div>
  );
}

export default function AiInsightsPage() {
  const params = useParams<{ lang: string }>();
  const lang = normalizeLang(params?.lang) as Lang;
  const gate = useWorkspaceGate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [workspaceCtx, setWorkspaceCtx] = useState<WorkspaceContextResponse | null>(null);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [dashboard, setDashboard] = useState<DashboardSummaryResponse | null>(null);
  const [incomeReport, setIncomeReport] = useState<ReportSummaryResponse | null>(null);
  const [expenseReport, setExpenseReport] = useState<ReportSummaryResponse | null>(null);
  const [profitReport, setProfitReport] = useState<ReportSummaryResponse | null>(null);
  const [cashflowReport, setCashflowReport] = useState<ReportSummaryResponse | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [
          ctxRes,
          usageRes,
          dashRes,
          incomeRes,
          expenseRes,
          profitRes,
          cashRes,
        ] = await Promise.all([
          fetch("/workspace/context", { credentials: "include", cache: "no-store" }),
          fetch("/workspace/usage", { credentials: "include", cache: "no-store" }),
          fetch("/dashboard/summary", { credentials: "include", cache: "no-store" }),
          fetch("/api/reports/income", { credentials: "include", cache: "no-store" }),
          fetch("/api/reports/expense", { credentials: "include", cache: "no-store" }),
          fetch("/api/reports/profit", { credentials: "include", cache: "no-store" }),
          fetch("/api/reports/cashflow", { credentials: "include", cache: "no-store" }),
        ]);

        if (!ctxRes.ok) throw new Error(`/workspace/context failed: ${ctxRes.status}`);
        if (!usageRes.ok) throw new Error(`/workspace/usage failed: ${usageRes.status}`);
        if (!dashRes.ok) throw new Error(`/dashboard/summary failed: ${dashRes.status}`);
        if (!incomeRes.ok) throw new Error(`/api/reports/income failed: ${incomeRes.status}`);
        if (!expenseRes.ok) throw new Error(`/api/reports/expense failed: ${expenseRes.status}`);
        if (!profitRes.ok) throw new Error(`/api/reports/profit failed: ${profitRes.status}`);
        if (!cashRes.ok) throw new Error(`/api/reports/cashflow failed: ${cashRes.status}`);

        const [
          ctxJson,
          usageJson,
          dashJson,
          incomeJson,
          expenseJson,
          profitJson,
          cashJson,
        ] = await Promise.all([
          ctxRes.json(),
          usageRes.json(),
          dashRes.json(),
          incomeRes.json(),
          expenseRes.json(),
          profitRes.json(),
          cashRes.json(),
        ]);

        if (!mounted) return;

        setWorkspaceCtx((ctxJson || null) as WorkspaceContextResponse | null);
        setUsage((usageJson || null) as UsageResponse | null);
        setDashboard((dashJson || null) as DashboardSummaryResponse | null);
        setIncomeReport((incomeJson || null) as ReportSummaryResponse | null);
        setExpenseReport((expenseJson || null) as ReportSummaryResponse | null);
        setProfitReport((profitJson || null) as ReportSummaryResponse | null);
        setCashflowReport((cashJson || null) as ReportSummaryResponse | null);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "failed to load ai insights");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const planCode =
    workspaceCtx?.subscription?.planCode?.toLowerCase?.() ||
    gate.planCode ||
    "starter";

  const aiEnabled =
    planCode === "premium" &&
    (workspaceCtx?.subscription?.entitlements?.aiInsights === true || gate.can("aiInsights"));

  const summary = dashboard?.summary ?? {};
  const businessHealth = dashboard?.businessHealth ?? {};
  const usageSummary = usage?.usage ?? {};
  const util = usage?.utilization ?? {};
  const limits = usage?.effectiveLimits ?? {};

  const derivedInsights = useMemo(() => {
    const revenue = Number(summary.revenue ?? 0);
    const expense = Number(summary.expense ?? 0);
    const profit = Number(summary.profit ?? 0);
    const cash = Number(summary.cash ?? 0);
    const unpaid = Number(summary.unpaidAmount ?? 0);
    const tax = Number(summary.estimatedTax ?? 0);
    const runway = Number(summary.runwayMonths ?? 0);
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    const rows = [];

    rows.push({
      title: "利益率インサイト",
      detail:
        margin >= 20
          ? `利益率は ${margin.toFixed(1)}% で高水準です。現在は売上拡大よりも、回収速度と継続再現性の管理が重要です。`
          : `利益率は ${margin.toFixed(1)}% です。販促費・物流費・固定費の見直し余地があります。`,
      tone: margin >= 20 ? "good" : "watch",
    });

    rows.push({
      title: "未入金リスク",
      detail:
        unpaid > 0
          ? `未入金残高は ${fmtJPY(unpaid)} です。利益が出ていても、実資金の遅延要因になるため請求回収の優先度を上げるべきです。`
          : "現時点で未入金残高は目立っておらず、請求回収のボトルネックは小さい状態です。",
      tone: unpaid > 0 ? "watch" : "good",
    });

    rows.push({
      title: "税負担の見込み",
      detail:
        tax > 0
          ? `概算税額は ${fmtJPY(tax)} です。利益増加に対して納税資金の先取り確保が必要です。`
          : "現時点の概算税額は限定的です。",
      tone: tax > 0 ? "default" : "good",
    });

    rows.push({
      title: "資金余力",
      detail:
        runway >= 12
          ? `Runway は ${runway.toFixed(1)} ヶ月で、短期の資金耐性は十分です。`
          : `Runway は ${runway.toFixed(1)} ヶ月です。固定費と出金構造の再点検が必要です。`,
      tone: runway >= 12 ? "good" : "watch",
    });

    rows.push({
      title: "AI利用余地",
      detail:
        limits.aiChatMonthly && limits.aiChatMonthly > 0
          ? `今月の AI Chat 使用量は ${usageSummary.aiChatUsedMonthly ?? 0} / ${limits.aiChatMonthly} です。`
          : "現在プランでは AI Chat 月次枠はありません。",
      tone:
        limits.aiChatMonthly && limits.aiChatMonthly > 0
          ? "default"
          : "watch",
    });

    return rows;
  }, [summary, usageSummary, limits]);

  if (loading) {
    return <LoadingCard text="AI Insights を読み込み中..." />;
  }

  if (error) {
    return (
      <main className="space-y-6">
        <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-6">
          <div className="text-sm font-semibold text-rose-700">AI Insights の取得に失敗しました</div>
          <div className="mt-2 break-all text-sm text-rose-600">{error}</div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/${lang}/app`}
              className="ls-btn ls-btn-ghost inline-flex px-4 py-2 text-sm font-semibold"
            >
              Dashboard に戻る
            </Link>
            <Link
              href={`/${lang}/app/billing/change`}
              className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold"
            >
              プランを見る
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!aiEnabled) {
    return (
      <main className="space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-white/60 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#334155_100%)] p-7 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
          <div className="inline-flex rounded-full bg-white/12 px-3 py-1 text-[11px] font-medium text-white/90">
            AI Insights
          </div>

          <h1 className="mt-5 text-[34px] font-semibold tracking-tight">AI Insights</h1>
          <div className="mt-3 max-w-3xl text-sm leading-6 text-white/80">
            Dashboard・Reports・Usage を横断して経営インサイトを提示する premium 機能です。
          </div>
        </section>

        <section className="ls-card-solid rounded-[28px] p-6">
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[24px] border border-dashed border-violet-200 bg-violet-50/70 px-6 py-10 text-center">
            <div className="rounded-full border border-violet-200 bg-white px-3 py-1 text-[11px] font-medium text-violet-700">
              Premium Feature
            </div>
            <div className="mt-4 text-2xl font-semibold text-slate-900">
              AI Insights は Premium で利用できます
            </div>
            <div className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              利益率・資金余力・未入金・税負担・利用状況を横断し、経営判断向けの insight を集約表示します。
            </div>

            <div className="mt-8 grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
              <StatCard
                title="Current Plan"
                value={String(planCode).toUpperCase()}
                helper="現在のワークスペース契約"
                tone="primary"
              />
              <StatCard
                title="AI Insights"
                value="Locked"
                helper="premium only"
                tone="warning"
              />
              <StatCard
                title="AI Chat Limit"
                value={String(limits.aiChatMonthly ?? 0)}
                helper="月次 AI Chat 上限"
                tone="default"
              />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={`/${lang}/app/billing/change`}
                className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold"
              >
                Premium を確認
              </Link>
              <Link
                href={`/${lang}/app`}
                className="ls-btn ls-btn-ghost inline-flex px-4 py-2 text-sm font-semibold"
              >
                Dashboard に戻る
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-white/60 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#334155_100%)] p-7 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
        <div className="inline-flex rounded-full bg-white/12 px-3 py-1 text-[11px] font-medium text-white/90">
          AI Insights
        </div>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[34px] font-semibold tracking-tight">AI Insights</h1>
            <div className="mt-3 max-w-3xl text-sm leading-6 text-white/80">
              Dashboard / Reports / Usage の実データを横断して、経営判断向けの insight baseline を表示します。
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/${lang}/app`}
              className="ls-btn ls-btn-ghost inline-flex border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
            >
              Dashboard に戻る
            </Link>
            <Link
              href={`/${lang}/app/reports/profit`}
              className="ls-btn ls-btn-ghost inline-flex border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
            >
              利益分析へ
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <StatCard
          title="Business Health Score"
          value={String(businessHealth.score ?? 0)}
          helper={businessHealth.status || "score"}
          tone="success"
        />
        <StatCard
          title="Revenue"
          value={fmtJPY(summary.revenue)}
          helper="dashboard.summary.revenue"
          tone="primary"
        />
        <StatCard
          title="Profit"
          value={fmtJPY(summary.profit)}
          helper="dashboard.summary.profit"
          tone="success"
        />
        <StatCard
          title="Unpaid"
          value={fmtJPY(summary.unpaidAmount)}
          helper={`未入金件数 ${summary.unpaidCount ?? 0}`}
          tone="warning"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="ls-card-solid rounded-[28px] p-5 xl:col-span-8">
          <div className="text-sm font-semibold text-slate-900">AI Summary</div>
          <div className="mt-1 text-[12px] text-slate-500">
            現在は real data を使った rule-based insight baseline
          </div>

          <div className="mt-5 space-y-4">
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">
                {businessHealth.headline || "経営健全性サマリー"}
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-600">
                {businessHealth.summary || "business health summary unavailable"}
              </div>
            </div>

            {derivedInsights.map((row) => (
              <InsightRow
                key={row.title}
                title={row.title}
                detail={row.detail}
                tone={row.tone as "default" | "good" | "watch"}
              />
            ))}
          </div>
        </section>

        <section className="ls-card-solid rounded-[28px] p-5 xl:col-span-4">
          <div className="text-sm font-semibold text-slate-900">Usage & Limits</div>
          <div className="mt-1 text-[12px] text-slate-500">workspace/usage baseline</div>

          <div className="mt-5 space-y-3">
            <StatCard
              title="AI Chat Used"
              value={`${usageSummary.aiChatUsedMonthly ?? 0} / ${limits.aiChatMonthly ?? 0}`}
              helper={`utilization ${pct(util.aiChatPct)}`}
              tone="default"
            />
            <StatCard
              title="AI OCR Used"
              value={`${usageSummary.aiInvoiceOcrUsedMonthly ?? 0} / ${limits.aiInvoiceOcrMonthly ?? 0}`}
              helper={`utilization ${pct(util.aiInvoiceOcrPct)}`}
              tone="default"
            />
            <StatCard
              title="Stores Used"
              value={`${usageSummary.storesUsed ?? 0} / ${limits.maxStores ?? 0}`}
              helper={`utilization ${pct(util.storesPct)}`}
              tone="primary"
            />
            <StatCard
              title="Period"
              value={usage?.period?.monthKey || "-"}
              helper="usage period"
              tone="default"
            />
          </div>
        </section>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="ls-card-solid rounded-[28px] p-5 xl:col-span-7">
          <div className="text-sm font-semibold text-slate-900">Report Signals</div>
          <div className="mt-1 text-[12px] text-slate-500">
            reports API summary snapshot
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <StatCard
              title="Income Summary"
              value={fmtJPY(Number(incomeReport?.summary?.totalIncome ?? 0))}
              helper={`rows ${Number(incomeReport?.summary?.rowsCount ?? 0)}`}
              tone="success"
            />
            <StatCard
              title="Expense Summary"
              value={fmtJPY(Number(expenseReport?.summary?.totalExpense ?? 0))}
              helper={`rows ${Number(expenseReport?.summary?.rowsCount ?? 0)}`}
              tone="warning"
            />
            <StatCard
              title="Profit Summary"
              value={fmtJPY(Number(profitReport?.summary?.grossProfit ?? 0))}
              helper={`margin ${Number(profitReport?.summary?.marginPct ?? 0).toFixed(1)}%`}
              tone="primary"
            />
            <StatCard
              title="Cashflow Summary"
              value={fmtJPY(Number(cashflowReport?.summary?.netCash ?? 0))}
              helper={`cashIn ${fmtJPY(Number(cashflowReport?.summary?.cashIn ?? 0))}`}
              tone="default"
            />
          </div>
        </section>

        <section className="ls-card-solid rounded-[28px] p-5 xl:col-span-5">
          <div className="text-sm font-semibold text-slate-900">Alert Context</div>
          <div className="mt-1 text-[12px] text-slate-500">
            dashboard alerts snapshot
          </div>

          <div className="mt-5 space-y-3">
            {(dashboard?.alerts ?? []).length === 0 ? (
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                no alerts
              </div>
            ) : (
              (dashboard?.alerts ?? []).map((item, idx) => (
                <div
                  key={`${item.key || "alert"}-${idx}`}
                  className="rounded-[22px] border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="text-sm font-semibold text-slate-900">
                    {item.title || item.key || "alert"}
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">
                    {item.description || item.level || "-"}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
