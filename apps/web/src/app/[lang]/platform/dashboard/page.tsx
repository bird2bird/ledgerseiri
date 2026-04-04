"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchPlatformExecutiveSummary,
  fetchPlatformOperationsAnalytics,
  fetchPlatformOperationsMetrics,
  getPlatformAccessToken,
  isPlatformUnauthorizedError,
  type PlatformExecutiveSummaryResponse,
} from "@/core/platform-auth/client";
import { getPlatformAdminDictionary } from "@/core/platform-admin/i18n";
import { PlatformDashboardAtRiskQueuePanel } from "@/components/platform/dashboard/PlatformDashboardAtRiskQueuePanel";
import { PlatformDashboardBillingRiskPanel } from "@/components/platform/dashboard/PlatformDashboardBillingRiskPanel";
import { PlatformDashboardDonutCard } from "@/components/platform/dashboard/PlatformDashboardDonutCard";
import { PlatformDashboardHero } from "@/components/platform/dashboard/PlatformDashboardHero";
import { PlatformDashboardMetricCard } from "@/components/platform/dashboard/PlatformDashboardMetricCard";
import { PlatformDashboardOperationsSnapshot } from "@/components/platform/dashboard/PlatformDashboardOperationsSnapshot";
import { PlatformDashboardPaymentIntelPanel } from "@/components/platform/dashboard/PlatformDashboardPaymentIntelPanel";
import { PlatformDashboardRevenueSnapshot } from "@/components/platform/dashboard/PlatformDashboardRevenueSnapshot";
import { PlatformDashboardSectionCard } from "@/components/platform/dashboard/PlatformDashboardSectionCard";
import { PlatformDashboardVerticalBarTrend } from "@/components/platform/dashboard/PlatformDashboardVerticalBarTrend";
import { buildPlatformUsersHref } from "@/core/platform/drilldown";

type PlanCode = "free" | "starter" | "standard" | "premium";

function formatMoney(v?: number | null) {
  return `¥${Number(v || 0).toLocaleString("ja-JP")}`;
}

function formatSignedNumber(v?: number | null) {
  const n = Number(v || 0);
  return `${n >= 0 ? "+" : ""}${n.toLocaleString("en-US")}`;
}

function formatCompact(v?: number | null) {
  return Number(v || 0).toLocaleString("en-US");
}

function formatDateTime(value?: string | null, lang: string = "en") {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(lang === "zh-CN" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRiskChip(level?: string) {
  switch ((level || "").toLowerCase()) {
    case "high":
      return "border-rose-400/30 bg-rose-400/10 text-rose-100";
    case "medium":
      return "border-amber-400/30 bg-amber-400/10 text-amber-100";
    case "watch":
      return "border-sky-400/30 bg-sky-400/10 text-sky-100";
    default:
      return "border-white/10 bg-white/5 text-slate-200";
  }
}

function getPriorityChip(level?: string) {
  switch ((level || "").toLowerCase()) {
    case "immediate":
      return "border-rose-400/30 bg-rose-400/10 text-rose-100";
    case "follow-up":
      return "border-amber-400/30 bg-amber-400/10 text-amber-100";
    case "observe":
      return "border-sky-400/30 bg-sky-400/10 text-sky-100";
    default:
      return "border-white/10 bg-white/5 text-slate-200";
  }
}

function getExtraLabels(lang: string) {
  if (lang === "zh-CN") {
    return {
      heroTitle: "平台经营分析看板",
      heroSubtitle: "收入、订阅风险、运营动作与回款跟进的一体化总览",
      heroBadgeA: "Executive Overview",
      heroBadgeB: "Billing Risk",
      heroBadgeC: "Operations Intelligence",
      kpiStrip: "核心经营指标",
      userTrend: "用户增长趋势",
      userTrendHint: "展示最近 12 个月新增用户与累计用户规模",
      operationsTrend: "运营失败趋势",
      operationsTrendHint: "展示最近平台操作中失败 / 成功处理情况",
      planComposition: "Plan 结构分布",
      billingComposition: "账单状态分布",
      recoveryComposition: "回收优先级分布",
      revenueSnapshot: "收入快照",
      operationsSnapshot: "运营快照",
      billingRisk: "付款风险总览",
      paymentIntel: "付款事件智能",
      atRiskQueue: "高风险用户队列",
      billingWorkspace: "回款跟进工作台",
      openRiskQueue: "打开风险队列",
      openUsers: "打开 Users",
      openOperations: "打开 Operations",
      openTenants: "打开 Tenants",
      totalUsers: "总用户数",
      totalTenants: "租户数",
      paidUsers: "付费用户",
      paidRatio: "付费占比",
      currentMrr: "当前 MRR",
      currentRevenue: "当前经常性收入",
      netGrowth: "本月净增长",
      netMovement: "净变化",
      riskTenants: "风险租户",
      totalOperations: "运营动作总数",
      failedOps: "失败",
      partialFailedOps: "部分失败",
      newUsers: "本月新增",
      churnedUsers: "本月减少",
      arpu: "ARPU 估算",
      activeTenants: "活跃订阅",
      trialingTenants: "试用中",
      pastDueTenants: "逾期中",
      canceledTenants: "已取消",
      freeTenants: "免费租户",
      activeUsers: "活跃用户",
      dormantUsers: "沉默用户",
      neverLoggedInUsers: "从未登录",
      trialingUsers: "试用用户",
      pastDueUsers: "逾期用户",
      canceledUsers: "取消用户",
      newRiskThisMonth: "本月新增风险",
      recoveredThisMonth: "本月恢复",
      immediate: "立即跟进",
      followUp: "后续跟进",
      observe: "持续观察",
      topFailureCodes: "主要失败码",
      noAtRiskUsers: "当前没有高风险用户。",
      status: "状态",
      revenue: "收入",
      lastBillingUpdate: "最近账单更新时间",
      userCount: "用户数",
      tenantCount: "租户数",
      growthSignals: "增长信号",
      planArpu: "Plan ARPU",
      byScope: "按 Scope 分布",
      monthlyAcquisition: "新增",
      monthlyReduction: "流失",
      backToWorkspaces: "调查工作台快捷入口",
      openAudit: "打开 Audit",
      openReviewQueue: "打开 Review Queue",
      mrrDecomposition: "MRR 分解",
      activeMrr: "活跃 MRR",
      pastDueMrr: "逾期 MRR",
      canceledMrr: "取消 MRR",
      atRiskMrr: "风险 MRR",
      trialingPipelineMrr: "试用转化潜力",
      currentShare: "当前收入占比",
      planMovement: "Plan 变动智能",
      upgradesThisMonth: "本月升级",
      downgradesThisMonth: "本月降级",
      activationsThisMonth: "本月激活",
      cancellationsThisMonth: "本月取消",
      trialingStartsThisMonth: "本月开启试用",
      entered: "流入",
      exited: "流出",
      net: "净流动",
      lifecycleFunnel: "生命周期漏斗",
      trialToActive: "试用转正",
      trialToCanceled: "试用流失",
      pastDueToActive: "逾期恢复",
      activeToCanceled: "活跃流失",
      recoverySuccessRate: "恢复成功率",
      trialConversionRate: "试用转化率",
      currentState: "当前状态",
      movementThisMonth: "本月流动",
      timelineAnalytics: "时间趋势分析",
      atRiskMrrTrend: "风险 MRR 趋势",
      recoveredMrrTrend: "恢复 MRR 趋势",
      canceledMrrTrend: "取消 MRR 趋势",
      churnRecoveryTrend: "流失 / 恢复趋势",
      recoveries: "恢复",
      cancellations: "取消",
      trialConversions: "试用转正",
      cohortRetention: "Cohort / 留存 / 扩张",
      retainedPaidUsers: "留存付费用户",
      expansionMrr: "扩张 MRR",
      contractionMrr: "收缩 MRR",
      retainedPaidCompanies: "留存付费租户",
      churnedPaidCompanies: "流失付费租户",
      cohortMonth: "Cohort 月份",
      forecastAnomaly: "预测 / 异常智能",
      projectedNextMonthMrr: "下月预测 MRR",
      riskSpike: "风险激增",
      recoveryDrop: "恢复下滑",
      cancellationSpike: "取消激增",
      trialConversionDrop: "试用转化下滑",
      anomalySummary: "异常摘要",
      alertLevel: "告警等级",
      healthy: "健康",
      medium: "关注",
      high: "高风险",
    };
  }

  return {
    heroTitle: "Platform Executive Dashboard",
    heroSubtitle: "A visual command center for revenue, billing risk, operations, and recovery workflow.",
    heroBadgeA: "Executive Overview",
    heroBadgeB: "Billing Risk",
    heroBadgeC: "Operations Intelligence",
    kpiStrip: "Core KPIs",
    userTrend: "User Growth Trend",
    userTrendHint: "New users and total users across the latest 12-month window.",
    operationsTrend: "Operations Failure Trend",
    operationsTrendHint: "Recent failed vs successful platform operation outcomes.",
    planComposition: "Plan Composition",
    billingComposition: "Billing Status Composition",
    recoveryComposition: "Recovery Priority Composition",
    revenueSnapshot: "Revenue Snapshot",
    operationsSnapshot: "Operations Snapshot",
    billingRisk: "Billing Risk Overview",
    paymentIntel: "Payment Event Intelligence",
    atRiskQueue: "At-Risk User Queue",
    billingWorkspace: "Billing Recovery Workspace",
    openRiskQueue: "Open Risk Queue",
    openUsers: "Open Users",
    openOperations: "Open Operations",
    openTenants: "Open Tenants",
    totalUsers: "Total Users",
    totalTenants: "Tenants",
    paidUsers: "Paid Users",
    paidRatio: "Paid Ratio",
    currentMrr: "Current MRR",
    currentRevenue: "Current recurring revenue",
    netGrowth: "Net Growth",
    netMovement: "Net movement",
    riskTenants: "Risk Tenants",
    totalOperations: "Total Operations",
    failedOps: "Failed",
    partialFailedOps: "Partial Failed",
    newUsers: "New Users",
    arpu: "ARPU Estimate",
    activeTenants: "Active",
    trialingTenants: "Trialing",
    pastDueTenants: "Past Due",
    canceledTenants: "Canceled",
    freeTenants: "Free",
    activeUsers: "Active Users",
    dormantUsers: "Dormant Users",
    neverLoggedInUsers: "Never Logged In",
    trialingUsers: "Trialing Users",
    pastDueUsers: "Past Due Users",
    canceledUsers: "Canceled Users",
    newRiskThisMonth: "New Risk This Month",
    recoveredThisMonth: "Recovered This Month",
    immediate: "Immediate",
    followUp: "Follow-up",
    observe: "Observe",
    topFailureCodes: "Top Failure Codes",
    noAtRiskUsers: "No at-risk users.",
    status: "Status",
    revenue: "Revenue",
    lastBillingUpdate: "Last Billing Update",
    userCount: "Users",
    tenantCount: "Tenants",
    growthSignals: "Growth Signals",
    planArpu: "Plan ARPU",
    byScope: "By Scope",
    monthlyAcquisition: "Acquisition",
    monthlyReduction: "Reduction",
    backToWorkspaces: "Workspace Shortcuts",
    openAudit: "Open Audit",
    openReviewQueue: "Open Review Queue",
    mrrDecomposition: "MRR Decomposition",
    activeMrr: "Active MRR",
    pastDueMrr: "Past Due MRR",
    canceledMrr: "Canceled MRR",
    atRiskMrr: "At-Risk MRR",
    trialingPipelineMrr: "Trialing Pipeline",
    currentShare: "Current Share",
    planMovement: "Plan Movement Intelligence",
    upgradesThisMonth: "Upgrades This Month",
    downgradesThisMonth: "Downgrades This Month",
    activationsThisMonth: "Activations This Month",
    cancellationsThisMonth: "Cancellations This Month",
    trialingStartsThisMonth: "Trialing Starts This Month",
    entered: "Entered",
    exited: "Exited",
    net: "Net",
    lifecycleFunnel: "Lifecycle Funnel",
    trialToActive: "Trial to Active",
    trialToCanceled: "Trial to Canceled",
    pastDueToActive: "Past Due to Active",
    activeToCanceled: "Active to Canceled",
    recoverySuccessRate: "Recovery Success Rate",
    trialConversionRate: "Trial Conversion Rate",
    currentState: "Current State",
    movementThisMonth: "This Month Movements",
    timelineAnalytics: "Timeline Analytics",
    atRiskMrrTrend: "At-Risk MRR Trend",
    recoveredMrrTrend: "Recovered MRR Trend",
    canceledMrrTrend: "Canceled MRR Trend",
    churnRecoveryTrend: "Churn / Recovery Trend",
    recoveries: "Recoveries",
    cancellations: "Cancellations",
    trialConversions: "Trial Conversions",
    cohortRetention: "Cohort / Retention / Expansion",
    retainedPaidUsers: "Retained Paid Users",
    churnedUsers: "Churned Users",
    expansionMrr: "Expansion MRR",
    contractionMrr: "Contraction MRR",
    retainedPaidCompanies: "Retained Paid Companies",
    churnedPaidCompanies: "Churned Paid Companies",
    cohortMonth: "Cohort Month",
    forecastAnomaly: "Forecast / Anomaly Intelligence",
    projectedNextMonthMrr: "Projected Next-Month MRR",
    riskSpike: "Risk Spike",
    recoveryDrop: "Recovery Drop",
    cancellationSpike: "Cancellation Spike",
    trialConversionDrop: "Trial Conversion Drop",
    anomalySummary: "Anomaly Summary",
    alertLevel: "Alert Level",
    healthy: "Healthy",
    medium: "Watch",
    high: "High Risk",
  };
}

function HorizontalDistribution({
  rows,
  valueKey,
  labelKey,
  formatter,
}: {
  rows: Array<Record<string, any>>;
  valueKey: string;
  labelKey: string;
  formatter?: (n: number) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => Number(r[valueKey] || 0)));
  return (
    <div className="space-y-3">
      {rows.map((row, index) => {
        const value = Number(row[valueKey] || 0);
        return (
          <div key={`${row[labelKey]}-${index}`}>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-300">{row[labelKey]}</span>
              <span className="text-slate-400">{formatter ? formatter(value) : formatCompact(value)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-2.5 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500"
                style={{ width: `${Math.max(4, (value / max) * 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PlatformDashboardPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";
  const dict = getPlatformAdminDictionary(lang);
  const extra = getExtraLabels(lang);

  const [executive, setExecutive] = useState<PlatformExecutiveSummaryResponse | null>(null);
  const [operationsMetrics, setOperationsMetrics] = useState<any | null>(null);
  const [operationsAnalytics, setOperationsAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function reload() {
    const token = getPlatformAccessToken();
    if (!token) {
      router.replace(`/${lang}/platform-auth/login`);
      return;
    }

    const [execSummary, opsMetrics, opsAnalytics] = await Promise.all([
      fetchPlatformExecutiveSummary(token),
      fetchPlatformOperationsMetrics(token),
      fetchPlatformOperationsAnalytics(token),
    ]);

    setExecutive(execSummary);
    setOperationsMetrics(opsMetrics);
    setOperationsAnalytics(opsAnalytics);
    setError("");
  }

  useEffect(() => {
    reload()
      .catch((e) => {
        if (isPlatformUnauthorizedError(e)) {
          router.replace(`/${lang}/platform-auth/login`);
          return;
        }
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => setLoading(false));
  }, [lang, router]);

  const billingOverview = (executive as any)?.billingOverview || {
    freeTenants: 0,
    activeTenants: 0,
    trialingTenants: 0,
    pastDueTenants: 0,
    canceledTenants: 0,
    billingRiskTenants: 0,
  };

  const paymentIntel = (executive as any)?.paymentEventIntelligence || {
    newRiskThisMonth: 0,
    canceledThisMonth: 0,
    recoveredThisMonth: 0,
    trialingUsers: 0,
    pastDueUsers: 0,
    canceledUsers: 0,
    activeUsers: 0,
  };

  const atRiskUsersPreview = (executive as any)?.atRiskUsersPreview || [];
  const recoveryWorkspace = (executive as any)?.billingRecoveryWorkspace || {
    immediateQueueCount: 0,
    followUpQueueCount: 0,
    observeQueueCount: 0,
    totalAtRiskPreview: 0,
  };

  const paidRatio = executive
    ? executive.totals.totalUsers > 0
      ? ((executive.totals.activePaidUsers / executive.totals.totalUsers) * 100).toFixed(1)
      : "0.0"
    : "0.0";

  const executiveCards = useMemo<Array<{
    title: string;
    value: string;
    subtitle: string;
    tone: import("@/components/platform/dashboard/PlatformDashboardMetricCard").PlatformMetricTone;
  }>>(() => {
    if (!executive || !operationsMetrics) return [];
    return [
      {
        title: extra.totalUsers,
        value: formatCompact(executive.totals.totalUsers),
        subtitle: `${extra.totalTenants}: ${formatCompact(executive.totals.totalTenants)}`,
        tone: "cyan",
      },
      {
        title: extra.paidUsers,
        value: formatCompact(executive.totals.activePaidUsers),
        subtitle: `${extra.paidRatio}: ${paidRatio}%`,
        tone: "violet",
      },
      {
        title: extra.currentMrr,
        value: formatMoney(executive.totals.currentMrr),
        subtitle: extra.currentRevenue,
        tone: "emerald",
      },
      {
        title: extra.netGrowth,
        value: formatSignedNumber(executive.totals.netGrowthThisMonth),
        subtitle: `${extra.newUsers}: ${executive.totals.newUsersThisMonth} · ${extra.churnedUsers}: ${executive.totals.churnedUsersThisMonth}`,
        tone: executive.totals.netGrowthThisMonth >= 0 ? "sky" : "rose",
      },
      {
        title: extra.riskTenants,
        value: formatCompact(billingOverview.billingRiskTenants),
        subtitle: `${extra.pastDueTenants}: ${billingOverview.pastDueTenants} · ${extra.canceledTenants}: ${billingOverview.canceledTenants}`,
        tone: "amber",
      },
      {
        title: extra.totalOperations,
        value: formatCompact(operationsMetrics.total || 0),
        subtitle: `${extra.failedOps}: ${operationsMetrics.failed || 0} · ${extra.partialFailedOps}: ${operationsMetrics.partialFailed || 0}`,
        tone: "rose",
      },
    ];
  }, [executive, operationsMetrics, extra, paidRatio]);

  const monthlyGrowthRows = (executive?.monthlyUserGrowth || []).map((row) => ({
    month: row.month,
    newUsers: row.newUsers,
    totalUsers: row.totalUsers,
  }));

  const failureTrendRows = ((operationsAnalytics?.failureTrend || []) as any[])
    .slice(0, 8)
    .reverse()
    .map((row) => ({
      month: String(row.requestedAt || "").slice(5, 10) || row.id?.slice(0, 6) || "-",
      failedCount: Number(row.failedCount || 0),
      successCount: Number(row.successCount || 0),
    }));

  const planRows = (((executive as any)?.planBreakdown || []) as Array<{
    planCode: PlanCode;
    userCount: number;
    tenantCount: number;
    userRatio: number;
    mrrContribution: number;
    arpuEstimate?: number;
  }>);

  const billingCompositionRows = [
    { label: extra.activeTenants, value: billingOverview.activeTenants },
    { label: extra.trialingTenants, value: billingOverview.trialingTenants },
    { label: extra.pastDueTenants, value: billingOverview.pastDueTenants },
    { label: extra.canceledTenants, value: billingOverview.canceledTenants },
    { label: extra.freeTenants, value: billingOverview.freeTenants },
  ];

  const recoveryRows = [
    { label: extra.immediate, value: recoveryWorkspace.immediateQueueCount },
    { label: extra.followUp, value: recoveryWorkspace.followUpQueueCount },
    { label: extra.observe, value: recoveryWorkspace.observeQueueCount },
  ];

  const scopeRows = ((operationsMetrics?.byScope || []) as Array<{ scope: string; count: number }>).map((row) => ({
    label: row.scope,
    count: row.count,
  }));

  const topFailureCodes = ((operationsAnalytics?.topFailureCodes || []) as Array<{ code: string; count: number }>).slice(0, 6);

  const mrrDecompositionSnapshot = (executive as any)?.mrrDecomposition || {
    totalMrr: 0,
    activeMrr: 0,
    pastDueMrr: 0,
    canceledMrr: 0,
    atRiskMrr: 0,
    trialingPipelineMrr: 0,
    freeMrr: 0,
    byStatus: {
      active: 0,
      trialing: 0,
      pastDue: 0,
      canceled: 0,
      free: 0,
    },
    byPlan: [],
  };

  const planMovementSnapshot = (executive as any)?.planMovementInsights || {
    upgradesThisMonth: 0,
    downgradesThisMonth: 0,
    activationsThisMonth: 0,
    cancellationsThisMonth: 0,
    trialingStartsThisMonth: 0,
    byPlan: [],
  };

  const lifecycleFunnelSnapshot = (executive as any)?.lifecycleFunnel || {
    current: {
      trialingNow: 0,
      activeNow: 0,
      pastDueNow: 0,
      canceledNow: 0,
    },
    movements: {
      trialStartsThisMonth: 0,
      trialToActiveThisMonth: 0,
      trialToCanceledThisMonth: 0,
      pastDueToActiveThisMonth: 0,
      activeToCanceledThisMonth: 0,
      recoveryAttemptsThisMonth: 0,
    },
    rates: {
      trialConversionRatePct: 0,
      recoverySuccessRatePct: 0,
    },
  };

  const riskRevenueTrendRows = ((executive as any)?.riskRevenueTrend || []).map((row: any) => ({
    month: row.month,
    atRiskMrr: Number(row.atRiskMrr || 0),
    recoveredMrr: Number(row.recoveredMrr || 0),
    canceledMrr: Number(row.canceledMrr || 0),
  }));

  const churnRecoveryTrendRows = ((executive as any)?.churnRecoveryTrend || []).map((row: any) => ({
    month: row.month,
    cancellations: Number(row.cancellations || 0),
    recoveries: Number(row.recoveries || 0),
    trialConversions: Number(row.trialConversions || 0),
  }));

  const cohortRetentionSnapshot = (executive as any)?.cohortRetentionInsights || {
    cohorts: [],
    summary: {
      retainedPaidCompanies: 0,
      churnedPaidCompanies: 0,
      expansionMrr: 0,
      contractionMrr: 0,
    },
  };

  const forecastSnapshot = (executive as any)?.forecastInsights || {
    projectedNextMonthMrr: 0,
    baseline: {
      avgAtRiskMrr: 0,
      avgRecoveredMrr: 0,
      avgCanceledMrr: 0,
      avgRecoveries: 0,
      avgCancellations: 0,
      avgTrialConversions: 0,
    },
    anomalyFlags: {
      riskSpike: false,
      recoveryDrop: false,
      cancellationSpike: false,
      trialConversionDrop: false,
    },
    alertLevel: "healthy",
    summary: "Stable operating baseline",
  };

  const paymentIntelRows = [
    { label: extra.newRiskThisMonth, value: formatCompact(paymentIntel.newRiskThisMonth) },
    { label: extra.monthlyReduction, value: formatCompact(paymentIntel.canceledThisMonth) },
    { label: extra.recoveredThisMonth, value: formatCompact(paymentIntel.recoveredThisMonth) },
    { label: extra.activeUsers, value: formatCompact(paymentIntel.activeUsers) },
    { label: extra.trialingUsers, value: formatCompact(paymentIntel.trialingUsers) },
    { label: extra.pastDueUsers, value: formatCompact(paymentIntel.pastDueUsers) },
    { label: extra.canceledUsers, value: formatCompact(paymentIntel.canceledUsers) },
  ];

  const atRiskQueueRows = atRiskUsersPreview.map((row: any) => ({
    id: row.id,
    email: row.email,
    companyId: row.companyId,
    billingRiskLevel: row.billingRiskLevel,
    recoveryPriority: row.recoveryPriority,
    planStatus: row.planStatus,
    estimatedMonthlyRevenue: formatMoney(row.estimatedMonthlyRevenue),
    subscriptionUpdatedAt: formatDateTime(row.subscriptionUpdatedAt, lang),
    queue: row.planStatus || "risk",
  }));

  if (loading) {
    return <div className="text-slate-300">Loading dashboard...</div>;
  }

  return (
    <div className="rounded-[32px] border border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.28),transparent_28%),radial-gradient(circle_at_top_right,rgba(6,182,212,0.24),transparent_22%),linear-gradient(180deg,#0c122b_0%,#121737_32%,#0c1028_100%)] p-6 text-slate-100 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
      <PlatformDashboardHero
        lang={lang}
        workspaceLabel={dict.shell.workspace}
        heroTitle={extra.heroTitle}
        heroSubtitle={extra.heroSubtitle}
        heroBadgeA={extra.heroBadgeA}
        heroBadgeB={extra.heroBadgeB}
        heroBadgeC={extra.heroBadgeC}
        totalUsers={formatCompact(executive?.totals.totalUsers || 0)}
        currentMrr={formatMoney(executive?.totals.currentMrr || 0)}
        riskTenants={formatCompact(billingOverview.billingRiskTenants)}
        reloadLabel={dict.shell.reload}
        onReload={() => {
          setLoading(true);
          reload()
            .catch((e) => setError(e instanceof Error ? e.message : String(e)))
            .finally(() => setLoading(false));
        }}
        backToWorkspaces={extra.backToWorkspaces}
        openUsers={extra.openUsers}
        openOperations={extra.openOperations}
        openAudit={extra.openAudit}
        openReviewQueue={extra.openReviewQueue}
      />


      {error ? (
        <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="mt-6">
        <div className="mb-3 text-xs uppercase tracking-[0.28em] text-slate-400">{extra.kpiStrip}</div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {executiveCards.map((card) => (
            <PlatformDashboardMetricCard
              key={card.title}
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
              tone={card.tone}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <PlatformDashboardSectionCard
          title={extra.userTrend}
          subtitle={extra.userTrendHint}
          action={
            <div className="flex flex-wrap gap-2">
              <Link
                href={buildPlatformUsersHref(lang, { queue: "all" })}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-100 hover:bg-white/10"
              >
                {extra.openUsers}
              </Link>
              <Link
                href={buildPlatformUsersHref(lang, { queue: "active" })}
                className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100 hover:bg-emerald-400/15"
              >
                {extra.activeUsers}
              </Link>
              <Link
                href={buildPlatformUsersHref(lang, { queue: "dormant" })}
                className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100 hover:bg-amber-400/15"
              >
                {extra.dormantUsers}
              </Link>
              <Link
                href={buildPlatformUsersHref(lang, { queue: "never_logged_in" })}
                className="rounded-xl border border-slate-500/20 bg-slate-500/10 px-3 py-2 text-xs text-slate-200 hover:bg-slate-500/15"
              >
                {extra.neverLoggedInUsers}
              </Link>
            </div>
          }
        >
          <PlatformDashboardVerticalBarTrend
            rows={monthlyGrowthRows}
            barKey="newUsers"
            lineKey="totalUsers"
            barLabel={extra.monthlyAcquisition}
            lineLabel={extra.totalUsers}
          />
        </PlatformDashboardSectionCard>

        <PlatformDashboardDonutCard
          title={extra.planComposition}
          rows={planRows.map((row) => ({
            label: dict.plans[row.planCode],
            value: row.userCount,
            meta: `${extra.tenantCount}: ${row.tenantCount} · ${extra.revenue}: ${formatMoney(row.mrrContribution)}`,
          }))}
          total={planRows.reduce((sum, row) => sum + row.userCount, 0)}
          colorStops={["#38bdf8", "#22c55e", "#a855f7", "#f59e0b"]}
          renderMeta={(row) => row.meta}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <PlatformDashboardSectionCard
          title={extra.operationsTrend}
          subtitle={extra.operationsTrendHint}
          action={
            <Link
              href={`/${lang}/platform/operations`}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-100 hover:bg-white/10"
            >
              {extra.openOperations}
            </Link>
          }
        >
          <PlatformDashboardVerticalBarTrend
            rows={failureTrendRows}
            barKey="failedCount"
            lineKey="successCount"
            barLabel={extra.failedOps}
            lineLabel="Success"
          />
        </PlatformDashboardSectionCard>

        <div className="grid gap-6">
          <PlatformDashboardDonutCard
            title={extra.billingComposition}
            rows={billingCompositionRows}
            total={billingCompositionRows.reduce((sum, row) => sum + row.value, 0)}
            colorStops={["#38bdf8", "#22c55e", "#f59e0b", "#f97316", "#64748b"]}
          />
          <PlatformDashboardDonutCard
            title={extra.recoveryComposition}
            rows={recoveryRows}
            total={recoveryRows.reduce((sum, row) => sum + row.value, 0)}
            colorStops={["#fb7185", "#f59e0b", "#38bdf8"]}
          />
        </div>
      </div>

      <div className="mt-6">
        <PlatformDashboardSectionCard title={extra.planMovement}>
          <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
              <PlatformDashboardMetricCard
                title={extra.upgradesThisMonth}
                value={formatCompact(planMovementSnapshot.upgradesThisMonth)}
                subtitle={extra.planMovement}
                tone="emerald"
              />
              <PlatformDashboardMetricCard
                title={extra.downgradesThisMonth}
                value={formatCompact(planMovementSnapshot.downgradesThisMonth)}
                subtitle={extra.planMovement}
                tone="amber"
              />
              <PlatformDashboardMetricCard
                title={extra.activationsThisMonth}
                value={formatCompact(planMovementSnapshot.activationsThisMonth)}
                subtitle={extra.activeUsers}
                tone="cyan"
              />
              <PlatformDashboardMetricCard
                title={extra.cancellationsThisMonth}
                value={formatCompact(planMovementSnapshot.cancellationsThisMonth)}
                subtitle={extra.canceledUsers}
                tone="rose"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-4 text-xs uppercase tracking-[0.2em] text-slate-400">{extra.planComposition}</div>
              <div className="space-y-3">
                {((planMovementSnapshot.byPlan || []) as Array<any>).map((row) => (
                  <div key={row.planCode} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-slate-200">{dict.plans[row.planCode as PlanCode]}</span>
                      <span className="text-sm font-semibold text-white">
                        {extra.net}: {row.net >= 0 ? "+" : ""}{row.net}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      {extra.entered}: {row.entered} · {extra.exited}: {row.exited}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PlatformDashboardSectionCard>
      </div>

      <div className="mt-6">
        <PlatformDashboardSectionCard title={extra.forecastAnomaly}>
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="grid gap-4 md:grid-cols-2">
              <PlatformDashboardMetricCard
                title={extra.projectedNextMonthMrr}
                value={formatMoney(forecastSnapshot.projectedNextMonthMrr)}
                subtitle={extra.forecastAnomaly}
                tone="emerald"
              />
              <PlatformDashboardMetricCard
                title={extra.alertLevel}
                value={
                  forecastSnapshot.alertLevel === "high"
                    ? extra.high
                    : forecastSnapshot.alertLevel === "medium"
                      ? extra.medium
                      : extra.healthy
                }
                subtitle={extra.anomalySummary}
                tone={
                  forecastSnapshot.alertLevel === "high"
                    ? "rose"
                    : forecastSnapshot.alertLevel === "medium"
                      ? "amber"
                      : "cyan"
                }
              />
              <PlatformDashboardMetricCard
                title={extra.riskSpike}
                value={forecastSnapshot.anomalyFlags.riskSpike ? "YES" : "NO"}
                subtitle={formatMoney(forecastSnapshot.baseline.avgAtRiskMrr)}
                tone={forecastSnapshot.anomalyFlags.riskSpike ? "rose" : "cyan"}
              />
              <PlatformDashboardMetricCard
                title={extra.recoveryDrop}
                value={forecastSnapshot.anomalyFlags.recoveryDrop ? "YES" : "NO"}
                subtitle={formatMoney(forecastSnapshot.baseline.avgRecoveredMrr)}
                tone={forecastSnapshot.anomalyFlags.recoveryDrop ? "amber" : "cyan"}
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-400">{extra.anomalySummary}</div>
              <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4 text-sm text-slate-200">
                {forecastSnapshot.summary}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-3 text-sm text-slate-200">
                  {extra.cancellationSpike}: {forecastSnapshot.anomalyFlags.cancellationSpike ? "YES" : "NO"}
                </div>
                <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-3 text-sm text-slate-200">
                  {extra.trialConversionDrop}: {forecastSnapshot.anomalyFlags.trialConversionDrop ? "YES" : "NO"}
                </div>
                <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-3 text-sm text-slate-200">
                  Avg Recoveries: {formatCompact(forecastSnapshot.baseline.avgRecoveries)}
                </div>
                <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-3 text-sm text-slate-200">
                  Avg Cancellations: {formatCompact(forecastSnapshot.baseline.avgCancellations)}
                </div>
              </div>
            </div>
          </div>
        </PlatformDashboardSectionCard>
      </div>

      <div className="mt-6">
        <PlatformDashboardSectionCard title={extra.cohortRetention}>
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="grid gap-4 md:grid-cols-2">
              <PlatformDashboardMetricCard
                title={extra.expansionMrr}
                value={formatMoney(cohortRetentionSnapshot.summary.expansionMrr)}
                subtitle={extra.cohortRetention}
                tone="emerald"
              />
              <PlatformDashboardMetricCard
                title={extra.contractionMrr}
                value={formatMoney(cohortRetentionSnapshot.summary.contractionMrr)}
                subtitle={extra.cohortRetention}
                tone="amber"
              />
              <PlatformDashboardMetricCard
                title={extra.retainedPaidCompanies}
                value={formatCompact(cohortRetentionSnapshot.summary.retainedPaidCompanies)}
                subtitle={extra.retainedPaidUsers}
                tone="cyan"
              />
              <PlatformDashboardMetricCard
                title={extra.churnedPaidCompanies}
                value={formatCompact(cohortRetentionSnapshot.summary.churnedPaidCompanies)}
                subtitle={extra.churnedUsers}
                tone="rose"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-400">{extra.cohortMonth}</div>
              <div className="space-y-3">
                {((cohortRetentionSnapshot.cohorts || []) as Array<any>).map((row) => (
                  <div key={row.cohortMonth} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-slate-200">{row.cohortMonth}</span>
                      <span className="text-sm font-semibold text-white">{formatMoney(row.currentMrr)}</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      {extra.retainedPaidUsers}: {formatCompact(row.retainedPaidUsers)} · {extra.churnedUsers}: {formatCompact(row.churnedUsers)} · New: {formatCompact(row.newUsers)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PlatformDashboardSectionCard>
      </div>

      <div className="mt-6">
        <PlatformDashboardSectionCard title={extra.timelineAnalytics}>
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-400">{extra.atRiskMrrTrend}</div>
              <PlatformDashboardVerticalBarTrend
                rows={riskRevenueTrendRows.map((row: { month: string; atRiskMrr: number; recoveredMrr: number; canceledMrr: number }) => ({
                  month: row.month,
                  valueA: row.atRiskMrr,
                  valueB: row.recoveredMrr,
                }))}
                barKey="valueA"
                lineKey="valueB"
                barLabel={extra.atRiskMrrTrend}
                lineLabel={extra.recoveredMrrTrend}
              />
              <div className="mt-3 text-xs text-slate-500">{extra.canceledMrrTrend}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-400">{extra.churnRecoveryTrend}</div>
              <PlatformDashboardVerticalBarTrend
                rows={churnRecoveryTrendRows.map((row: { month: string; cancellations: number; recoveries: number; trialConversions: number }) => ({
                  month: row.month,
                  valueA: row.cancellations,
                  valueB: row.recoveries,
                }))}
                barKey="valueA"
                lineKey="valueB"
                barLabel={extra.cancellations}
                lineLabel={extra.recoveries}
              />
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-400">
                {churnRecoveryTrendRows.map((row: { month: string; cancellations: number; recoveries: number; trialConversions: number }) => (
                  <div key={row.month} className="rounded-xl border border-white/10 bg-black/10 px-2 py-2">
                    <div className="text-slate-500">{row.month}</div>
                    <div>{extra.trialConversions}: {formatCompact(row.trialConversions)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PlatformDashboardSectionCard>
      </div>

      <div className="mt-6">
        <PlatformDashboardSectionCard title={extra.lifecycleFunnel}>
          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
              <PlatformDashboardMetricCard
                title={extra.trialConversionRate}
                value={`${lifecycleFunnelSnapshot.rates.trialConversionRatePct}%`}
                subtitle={extra.trialToActive}
                tone="emerald"
              />
              <PlatformDashboardMetricCard
                title={extra.recoverySuccessRate}
                value={`${lifecycleFunnelSnapshot.rates.recoverySuccessRatePct}%`}
                subtitle={extra.pastDueToActive}
                tone="cyan"
              />
              <PlatformDashboardMetricCard
                title={extra.trialToCanceled}
                value={formatCompact(lifecycleFunnelSnapshot.movements.trialToCanceledThisMonth)}
                subtitle={extra.movementThisMonth}
                tone="amber"
              />
              <PlatformDashboardMetricCard
                title={extra.activeToCanceled}
                value={formatCompact(lifecycleFunnelSnapshot.movements.activeToCanceledThisMonth)}
                subtitle={extra.movementThisMonth}
                tone="rose"
              />
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-400">{extra.currentState}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-black/10 p-3 text-sm text-slate-200">
                    Trialing: {formatCompact(lifecycleFunnelSnapshot.current.trialingNow)}
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/10 p-3 text-sm text-slate-200">
                    Active: {formatCompact(lifecycleFunnelSnapshot.current.activeNow)}
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/10 p-3 text-sm text-slate-200">
                    Past Due: {formatCompact(lifecycleFunnelSnapshot.current.pastDueNow)}
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/10 p-3 text-sm text-slate-200">
                    Canceled: {formatCompact(lifecycleFunnelSnapshot.current.canceledNow)}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-400">{extra.movementThisMonth}</div>
                <div className="space-y-2 text-sm text-slate-200">
                  <div>{extra.trialingStartsThisMonth}: {formatCompact(lifecycleFunnelSnapshot.movements.trialStartsThisMonth)}</div>
                  <div>{extra.trialToActive}: {formatCompact(lifecycleFunnelSnapshot.movements.trialToActiveThisMonth)}</div>
                  <div>{extra.trialToCanceled}: {formatCompact(lifecycleFunnelSnapshot.movements.trialToCanceledThisMonth)}</div>
                  <div>{extra.pastDueToActive}: {formatCompact(lifecycleFunnelSnapshot.movements.pastDueToActiveThisMonth)}</div>
                  <div>{extra.activeToCanceled}: {formatCompact(lifecycleFunnelSnapshot.movements.activeToCanceledThisMonth)}</div>
                </div>
              </div>
            </div>
          </div>
        </PlatformDashboardSectionCard>
      </div>

      <div className="mt-6">
        <PlatformDashboardSectionCard title={extra.mrrDecomposition}>
          <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
              <PlatformDashboardMetricCard
                title={extra.currentMrr}
                value={formatMoney(mrrDecompositionSnapshot.totalMrr)}
                subtitle={extra.currentRevenue}
                tone="emerald"
              />
              <PlatformDashboardMetricCard
                title={extra.activeMrr}
                value={formatMoney(mrrDecompositionSnapshot.activeMrr)}
                subtitle={extra.currentShare}
                tone="cyan"
              />
              <PlatformDashboardMetricCard
                title={extra.pastDueMrr}
                value={formatMoney(mrrDecompositionSnapshot.pastDueMrr)}
                subtitle={extra.atRiskMrr}
                tone="amber"
              />
              <PlatformDashboardMetricCard
                title={extra.trialingPipelineMrr}
                value={formatMoney(mrrDecompositionSnapshot.trialingPipelineMrr)}
                subtitle={extra.paidRatio}
                tone="violet"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-4 text-xs uppercase tracking-[0.2em] text-slate-400">{extra.planComposition}</div>
              <div className="space-y-3">
                {((mrrDecompositionSnapshot.byPlan || []) as Array<any>).map((row) => (
                  <div key={row.planCode}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                      <span className="text-slate-300">{dict.plans[row.planCode as PlanCode]}</span>
                      <span className="text-slate-400">
                        {formatMoney(row.currentMrr)} · {extra.currentShare} {row.currentSharePct}%
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-2.5 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-500 to-violet-500"
                        style={{ width: `${Math.max(4, Number(row.currentSharePct || 0))}%` }}
                      />
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      {extra.atRiskMrr}: {formatMoney(row.atRiskMrr)} · {extra.trialingPipelineMrr}: {formatMoney(row.trialingPipelineMrr)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PlatformDashboardSectionCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <PlatformDashboardRevenueSnapshot
          title={extra.revenueSnapshot}
          currentMrrLabel={extra.currentMrr}
          currentMrrValue={formatMoney(executive?.totals.currentMrr || 0)}
          currentRevenueSubtitle={extra.currentRevenue}
          paidUsersLabel={extra.paidUsers}
          paidUsersValue={formatCompact(executive?.totals.activePaidUsers || 0)}
          paidRatioSubtitle={`${extra.paidRatio}: ${paidRatio}%`}
          arpuLabel={extra.arpu}
          arpuValue={
            executive && executive.totals.activePaidUsers > 0
              ? formatMoney(Math.round(executive.totals.currentMrr / executive.totals.activePaidUsers))
              : formatMoney(0)
          }
          planArpuSubtitle={extra.planArpu}
        />

        <PlatformDashboardBillingRiskPanel
          title={extra.billingRisk}
          riskTenantsLabel={extra.riskTenants}
          riskTenantsValue={formatCompact(billingOverview.billingRiskTenants)}
          riskTenantsSubtitle={`${extra.pastDueTenants} + ${extra.canceledTenants}`}
          activeTenantsLabel={extra.activeTenants}
          activeTenantsValue={formatCompact(billingOverview.activeTenants)}
          trialingTenantsLabel={extra.trialingTenants}
          trialingTenantsValue={formatCompact(billingOverview.trialingTenants)}
          pastDueTenantsLabel={extra.pastDueTenants}
          pastDueTenantsValue={formatCompact(billingOverview.pastDueTenants)}
          canceledTenantsLabel={extra.canceledTenants}
          canceledTenantsValue={formatCompact(billingOverview.canceledTenants)}
          freeTenantsLabel={extra.freeTenants}
          freeTenantsValue={formatCompact(billingOverview.freeTenants)}
        />

        <PlatformDashboardOperationsSnapshot
          lang={lang}
          title={extra.operationsSnapshot}
          openOperationsLabel={extra.openOperations}
          totalOperationsLabel={extra.totalOperations}
          totalOperationsValue={formatCompact(operationsMetrics?.total || 0)}
          byScopeSubtitle={`${extra.byScope}: ${(operationsMetrics?.byScope || []).length || 0}`}
          failedLabel={extra.failedOps}
          failedValue={formatCompact(operationsMetrics?.failed || 0)}
          partialFailedLabel={extra.partialFailedOps}
          partialFailedValue={formatCompact(operationsMetrics?.partialFailed || 0)}
          topFailureCodesLabel={extra.topFailureCodes}
          topFailureCodes={topFailureCodes}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <PlatformDashboardPaymentIntelPanel
          title={extra.paymentIntel}
          rows={paymentIntelRows}
        />

        <PlatformDashboardAtRiskQueuePanel
          lang={lang}
          title={extra.atRiskQueue}
          subtitle={extra.billingWorkspace}
          openRiskQueueLabel={extra.openRiskQueue}
          immediateLabel={extra.immediate}
          immediateCount={formatCompact(recoveryWorkspace.immediateQueueCount)}
          followUpLabel={extra.followUp}
          followUpCount={formatCompact(recoveryWorkspace.followUpQueueCount)}
          observeLabel={extra.observe}
          observeCount={formatCompact(recoveryWorkspace.observeQueueCount)}
          noAtRiskUsersLabel={extra.noAtRiskUsers}
          statusLabel={extra.status}
          revenueLabel={extra.revenue}
          lastBillingUpdateLabel={extra.lastBillingUpdate}
          riskChip={getRiskChip}
          priorityChip={getPriorityChip}
          rows={atRiskQueueRows}
        />
      </div>

      <div className="mt-6">
        <PlatformDashboardSectionCard title={extra.byScope}>
          <HorizontalDistribution
            rows={scopeRows}
            valueKey="count"
            labelKey="label"
          />
        </PlatformDashboardSectionCard>
      </div>
    </div>
  );
}
