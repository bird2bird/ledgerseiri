"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import { useWorkspaceGate } from "@/hooks/useWorkspaceGate";
import {
  getAiInsightsDrilldownHref,
  getAiInsightsInsightHref,
  getAiInsightsPrimaryReportHref,
  getAiInsightsUpgradeHref,
} from "@/components/app/dashboard-v2/dashboard-linking";
import {
  loadAiInsightsSnapshot,
  type DashboardSummaryResponse,
  type ReportSummaryResponse,
  type UsageResponse,
  type WorkspaceContextResponse,
} from "@/core/ai-insights";
import { AiInsightsHero } from "@/components/app/ai-insights/AiInsightsHero";
import { AiInsightsLockedState } from "@/components/app/ai-insights/AiInsightsLockedState";
import { AiInsightsSummaryStats } from "@/components/app/ai-insights/AiInsightsSummaryStats";
import { AiInsightsReportStats } from "@/components/app/ai-insights/AiInsightsReportStats";
import { AiInsightsOperationalInsightsCard } from "@/components/app/ai-insights/AiInsightsOperationalInsightsCard";
import { AiInsightsUsageCard } from "@/components/app/ai-insights/AiInsightsUsageCard";
import { AiInsightsDestinationsCard } from "@/components/app/ai-insights/AiInsightsDestinationsCard";

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
        const snapshot = await loadAiInsightsSnapshot();

        if (!mounted) return;

        setWorkspaceCtx(snapshot.workspaceCtx);
        setUsage(snapshot.usage);
        setDashboard(snapshot.dashboard);
        setIncomeReport(snapshot.incomeReport);
        setExpenseReport(snapshot.expenseReport);
        setProfitReport(snapshot.profitReport);
        setCashflowReport(snapshot.cashflowReport);
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
    const rows: Array<{ title: string; detail: string; tone?: "default" | "good" | "watch"; href?: string }> =
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
        href: getAiInsightsInsightHref("利益率", lang),
      });
    } else {
      rows.push({
        title: "利益率の監視が必要です",
        detail: `現在の粗利率は ${marginPct.toFixed(1)}% です。費用内訳の見直し候補を確認してください。`,
        tone: "watch",
        href: getAiInsightsInsightHref("利益率", lang),
      });
    }

    if (unpaidAmount > 0) {
      rows.push({
        title: "未入金の回収を優先してください",
        detail: `未回収金額は ${fmtJPY(unpaidAmount)} です。キャッシュ化の優先度が高い状態です。`,
        tone: "watch",
        href: getAiInsightsInsightHref("未入金", lang),
      });
    }

    if (runwayMonths >= 6) {
      rows.push({
        title: "資金余力は確保されています",
        detail: `現在のランウェイは約 ${runwayMonths} ヶ月です。短期の資金繰り余力があります。`,
        tone: "good",
        href: getAiInsightsInsightHref("資金余力", lang),
      });
    } else {
      rows.push({
        title: "資金余力を確認してください",
        detail: `現在のランウェイは約 ${runwayMonths} ヶ月です。現金残高と固定費の再確認が必要です。`,
        tone: "watch",
        href: getAiInsightsInsightHref("資金余力", lang),
      });
    }

    if (aiChatLimit > 0) {
      rows.push({
        title: "AI 利用枠の状況",
        detail: `今月の AI Chat 使用量は ${aiChatUsed}/${aiChatLimit}（${pct(utilization.aiChatPct)}）です。`,
        tone: "default",
        href: undefined,
      });
    }

    return rows;
  }, [
    profitReport,
    summary.unpaidAmount,
    summary.runwayMonths,
    usageData.aiChatUsedMonthly,
    effectiveLimits.aiChatMonthly,
    utilization.aiChatPct,
    lang,
  ]);

  if (loading) {
    return <LoadingCard text="AI Insights を読み込み中..." />;
  }

  if (!aiEnabled) {
    return (
      <AiInsightsLockedState
        planCode={planCode}
        workspaceName={workspaceName}
        upgradeHref={upgradeHref}
      />
    );
  }

  return (
    <main className="space-y-6">
      <AiInsightsHero
        workspaceName={workspaceName}
        primaryReportHref={primaryReportHref}
        health={health}
        usageData={usageData}
        effectiveLimits={effectiveLimits}
        monthKey={usage?.period?.monthKey}
      />

      {error ? (
        <section className="rounded-[28px] border border-rose-200 bg-rose-50 px-4 py-3">
          <div className="text-sm font-semibold text-rose-700">AI Insights の取得に失敗しました</div>
          <div className="mt-1 text-sm text-rose-600">{error}</div>
        </section>
      ) : null}

      <AiInsightsSummaryStats
        summary={summary}
        profitMarginPct={Number(profitReport?.summary?.marginPct ?? 0)}
        fmtJPY={fmtJPY}
      />

      <AiInsightsReportStats
        incomeSummary={incomeReport?.summary}
        expenseSummary={expenseReport?.summary}
        cashflowSummary={cashflowReport?.summary}
        fmtJPY={fmtJPY}
      />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <AiInsightsOperationalInsightsCard items={generatedInsights} />

        <div className="space-y-4">
          <AiInsightsUsageCard
            aiChatUsedMonthly={usageData.aiChatUsedMonthly}
            aiChatMonthly={effectiveLimits.aiChatMonthly}
            aiChatPctText={`${pct(usage?.utilization?.aiChatPct)} used`}
            aiInvoiceOcrUsedMonthly={usageData.aiInvoiceOcrUsedMonthly}
            aiInvoiceOcrMonthly={effectiveLimits.aiInvoiceOcrMonthly}
            aiInvoiceOcrPctText={`${pct(usage?.utilization?.aiInvoiceOcrPct)} used`}
          />

          <AiInsightsDestinationsCard
            profitHref={getAiInsightsDrilldownHref("profit", lang)}
            cashflowHref={getAiInsightsDrilldownHref("cashflow", lang)}
            unpaidHref={getAiInsightsDrilldownHref("unpaid", lang)}
          />
        </div>
      </section>
    </main>
  );
}
