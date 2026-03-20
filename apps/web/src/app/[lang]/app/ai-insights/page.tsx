"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import { useWorkspaceGate } from "@/hooks/useWorkspaceGate";
import { UpgradePromptCard } from "@/components/app/dashboard-v2/UpgradePromptCard";
import {
  getAiInsightsDrilldownHref,
  getAiInsightsInsightHref,
  getAiInsightsPrimaryReportHref,
  getAiInsightsUpgradeHref,
} from "@/components/app/dashboard-v2/dashboard-linking";

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
  href?: string;
}) {
  const tone =
    props.tone === "good"
      ? "border-emerald-200 bg-emerald-50"
      : props.tone === "watch"
      ? "border-amber-200 bg-amber-50"
      : "border-slate-200 bg-white";

  if (props.href) {
    return (
      <Link href={props.href} className={cls("block rounded-[22px] border p-4 transition hover:-translate-y-[1px] hover:shadow-[var(--sh-sm)]", tone)}>
        <div className="text-sm font-semibold text-slate-900">{props.title}</div>
        <div className="mt-2 text-sm leading-6 text-slate-600">{props.detail}</div>
      </Link>
    );
  }

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

  const planCode =
    workspaceCtx?.subscription?.planCode?.toLowerCase?.() ||
    gate.planCode ||
    "starter";

  const upgradeHref = getAiInsightsUpgradeHref(lang);
  const primaryReportHref = getAiInsightsPrimaryReportHref(lang);

  const aiEnabled =
    workspaceCtx?.subscription?.entitlements?.aiInsights === true ||
    gate.can("aiInsights");

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!aiEnabled) {
        if (mounted) {
          setLoading(false);
          setError("");
        }
        return;
      }

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
  }, [aiEnabled]);

  const workspaceName =
    workspaceCtx?.workspace?.displayName ||
    gate.workspace?.displayName ||
    "Workspace";

  const summary = dashboard?.summary ?? {};
  const health = dashboard?.businessHealth ?? {};
  const usageData = usage?.usage ?? {};
  const utilization = usage?.utilization ?? {};
  const effectiveLimits = usage?.effectiveLimits ?? gate.limits ?? {};

  const generatedInsights = useMemo(() => {
    const rows: Array<{ title: string; detail: string; tone?: "default" | "good" | "watch" }> =
      [];

    const marginPct = Number(profitReport?.summary?.marginPct ?? 0);
    const unpaidAmount = Number(summary.unpaidAmount ?? 0);
    const runwayMonths = Number(summary.runwayMonths ?? 0);
    const aiChatUsed = Number(usageData.aiChatUsedMonthly ?? 0);
    const aiChatLimit = Number(effectiveLimits.aiChatMonthly ?? 0);

    if (marginPct >= 20) {
      rows.push({
        title: "利益率は良好です",
        detail: `現在の粗利率は ${marginPct.toFixed(1)}% です。利益構造は安定しています。`,
        tone: "good",
      });
    } else {
      rows.push({
        title: "利益率の監視が必要です",
        detail: `現在の粗利率は ${marginPct.toFixed(1)}% です。費用内訳の見直し候補を確認してください。`,
        tone: "watch",
      });
    }

    if (unpaidAmount > 0) {
      rows.push({
        title: "未入金の回収を優先してください",
        detail: `未回収金額は ${fmtJPY(unpaidAmount)} です。キャッシュ化の優先度が高い状態です。`,
        tone: "watch",
      });
    }

    if (runwayMonths >= 6) {
      rows.push({
        title: "資金余力は確保されています",
        detail: `現在のランウェイは約 ${runwayMonths} ヶ月です。短期の資金繰り余力があります。`,
        tone: "good",
      });
    } else {
      rows.push({
        title: "資金余力を確認してください",
        detail: `現在のランウェイは約 ${runwayMonths} ヶ月です。現金残高と固定費の再確認が必要です。`,
        tone: "watch",
      });
    }

    if (aiChatLimit > 0) {
      rows.push({
        title: "AI 利用枠の状況",
        detail: `今月の AI Chat 使用量は ${aiChatUsed}/${aiChatLimit}（${pct(utilization.aiChatPct)}）です。`,
        tone: "default",
      });
    }

    return rows;
  }, [profitReport, summary.unpaidAmount, summary.runwayMonths, usageData.aiChatUsedMonthly, effectiveLimits.aiChatMonthly, utilization.aiChatPct]);

  if (loading) {
    return <LoadingCard text="AI Insights を読み込み中..." />;
  }

  if (!aiEnabled) {
    const currentPlanLabel =
      planCode === "premium" ? "Premium" : planCode === "standard" ? "Standard" : "Starter";

    return (
      <main className="space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-white/60 bg-[linear-gradient(135deg,#111827_0%,#1f2937_55%,#334155_100%)] p-7 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
            <div>
              <div className="inline-flex rounded-full bg-white/12 px-3 py-1 text-[11px] font-medium text-white/90">
                AI Insights
              </div>

              <h1 className="mt-5 text-[34px] font-semibold tracking-tight">AI Insights</h1>

              <div className="mt-2 text-sm text-white/80">
                利益率、未入金、資金余力、AI 利用枠をもとに経営判断の示唆を提示します。
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] text-white/90">
                  current plan: {currentPlanLabel}
                </span>
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] text-white/90">
                  workspace: {workspaceName}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <div className="rounded-[22px] bg-white/92 p-4 text-slate-900 shadow-sm">
                <div className="text-[11px] font-medium text-slate-500">Required Plan</div>
                <div className="mt-2 text-lg font-semibold">Premium</div>
                <div className="mt-1 text-xs text-slate-500">AI Insights / AI Chat / AI OCR</div>
              </div>

              <div className="rounded-[22px] bg-white/92 p-4 text-slate-900 shadow-sm">
                <div className="text-[11px] font-medium text-slate-500">Current Access</div>
                <div className="mt-2 text-lg font-semibold">Locked</div>
                <div className="mt-1 text-xs text-slate-500">Premium で解放されます</div>
              </div>
            </div>
          </div>
        </section>

        <UpgradePromptCard
          title="AI Insights は Premium で利用できます"
          description="AI 分析、経営示唆、AI Chat / OCR の月次利用枠を Premium プランで解放します。"
          cta="Premium を確認"
          href={upgradeHref}
          targetPlan="premium"
        />

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <StatCard
            title="対象機能"
            value="AI 分析"
            helper="利益率・未入金・資金余力・利用枠の集約表示"
            tone="primary"
          />
          <StatCard
            title="利用条件"
            value="Premium"
            helper="Starter / Standard ではロック表示"
            tone="warning"
          />
          <StatCard
            title="アップグレード先"
            value="Billing"
            helper="プラン比較ページから変更候補を確認"
            tone="default"
          />
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-white/60 bg-[linear-gradient(135deg,#111827_0%,#1f2937_55%,#334155_100%)] p-7 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
          <div>
            <div className="inline-flex rounded-full bg-white/12 px-3 py-1 text-[11px] font-medium text-white/90">
              AI Insights
            </div>

            <h1 className="mt-5 text-[34px] font-semibold tracking-tight">AI Insights</h1>

            <div className="mt-2 text-sm text-white/80">
              ダッシュボードとレポートの実データを集約し、経営状態の示唆を提示します。
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] text-white/90">
                workspace: {workspaceName}
              </span>
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] text-white/90">
                plan: Premium
              </span>
              <Link
                href={primaryReportHref}
                className="ls-btn ls-btn-ghost inline-flex border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
              >
                利益分析へ
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <div className="rounded-[22px] bg-white/92 p-4 text-slate-900 shadow-sm">
              <div className="text-[11px] font-medium text-slate-500">Health Score</div>
              <div className="mt-2 text-lg font-semibold">{health.score ?? 0}</div>
              <div className="mt-1 text-xs text-slate-500">{health.headline ?? "—"}</div>
            </div>

            <div className="rounded-[22px] bg-white/92 p-4 text-slate-900 shadow-sm">
              <div className="text-[11px] font-medium text-slate-500">AI Chat Usage</div>
              <div className="mt-2 text-lg font-semibold">
                {usageData.aiChatUsedMonthly ?? 0} / {effectiveLimits.aiChatMonthly ?? 0}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {usage?.period?.monthKey ?? "current month"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-[28px] border border-rose-200 bg-rose-50 px-4 py-3">
          <div className="text-sm font-semibold text-rose-700">AI Insights の取得に失敗しました</div>
          <div className="mt-1 text-sm text-rose-600">{error}</div>
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <StatCard
          title="売上"
          value={fmtJPY(summary.revenue)}
          helper="dashboard summary"
          tone="primary"
        />
        <StatCard
          title="利益"
          value={fmtJPY(summary.profit)}
          helper={`profit margin ${Number(profitReport?.summary?.marginPct ?? 0).toFixed(1)}%`}
          tone="success"
        />
        <StatCard
          title="未入金"
          value={fmtJPY(summary.unpaidAmount)}
          helper={`${summary.unpaidCount ?? 0} 件の未回収`}
          tone="warning"
        />
        <StatCard
          title="資金余力"
          value={`${summary.runwayMonths ?? 0} ヶ月`}
          helper={`現金 ${fmtJPY(summary.cash)}`}
          tone="default"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <StatCard
          title="Income Report"
          value={fmtJPY(incomeReport?.summary?.totalIncome)}
          helper={`rows ${Number(incomeReport?.summary?.rowsCount ?? 0)}`}
          tone="primary"
        />
        <StatCard
          title="Expense Report"
          value={fmtJPY(expenseReport?.summary?.totalExpense)}
          helper={`rows ${Number(expenseReport?.summary?.rowsCount ?? 0)}`}
          tone="default"
        />
        <StatCard
          title="Cash Flow"
          value={fmtJPY(cashflowReport?.summary?.netCash)}
          helper={`cash in ${fmtJPY(cashflowReport?.summary?.cashIn)}`}
          tone="success"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="ls-card-solid rounded-[28px] p-6">
          <div className="text-sm font-semibold text-slate-900">AI-generated operational insights</div>
          <div className="mt-4 space-y-3">
            {generatedInsights.map((item, index) => (
              <InsightRow
                key={`${item.title}-${index}`}
                title={item.title}
                detail={item.detail}
                tone={item.tone}
                href={getAiInsightsInsightHref(item.title, lang)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <section className="ls-card-solid rounded-[28px] p-6">
            <div className="text-sm font-semibold text-slate-900">利用枠</div>
            <div className="mt-4 space-y-3">
              <StatCard
                title="AI Chat"
                value={`${usageData.aiChatUsedMonthly ?? 0} / ${effectiveLimits.aiChatMonthly ?? 0}`}
                helper={`${pct(usage?.utilization?.aiChatPct)} used`}
                tone="primary"
              />
              <StatCard
                title="AI OCR"
                value={`${usageData.aiInvoiceOcrUsedMonthly ?? 0} / ${effectiveLimits.aiInvoiceOcrMonthly ?? 0}`}
                helper={`${pct(usage?.utilization?.aiInvoiceOcrPct)} used`}
                tone="default"
              />
            </div>
          </section>

          <section className="ls-card-solid rounded-[28px] p-6">
            <div className="text-sm font-semibold text-slate-900">移動先</div>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <Link
                href={getAiInsightsDrilldownHref("profit", lang)}
                className="rounded-[18px] border border-black/5 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
              >
                利益分析
              </Link>
              <Link
                href={getAiInsightsDrilldownHref("cashflow", lang)}
                className="rounded-[18px] border border-black/5 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
              >
                キャッシュフロー
              </Link>
              <Link
                href={getAiInsightsDrilldownHref("unpaid", lang)}
                className="rounded-[18px] border border-black/5 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
              >
                未入金
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
