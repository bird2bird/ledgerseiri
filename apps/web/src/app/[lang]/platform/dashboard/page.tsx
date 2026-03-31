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
import { PlatformLanguageSwitch } from "@/components/platform/PlatformLanguageSwitch";

type PlanCode = "free" | "starter" | "standard" | "premium";

function formatMoney(v?: number | null) {
  return `¥${Number(v || 0).toLocaleString("ja-JP")}`;
}

function formatSignedNumber(v?: number | null) {
  const n = Number(v || 0);
  return `${n >= 0 ? "+" : ""}${n.toLocaleString("en-US")}`;
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
      return "border-rose-500/30 bg-rose-500/10 text-rose-200";
    case "medium":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    case "watch":
      return "border-sky-500/30 bg-sky-500/10 text-sky-200";
    default:
      return "border-slate-700 bg-slate-900/70 text-slate-300";
  }
}

function getPriorityChip(level?: string) {
  switch ((level || "").toLowerCase()) {
    case "immediate":
      return "border-rose-500/30 bg-rose-500/10 text-rose-200";
    case "follow-up":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    case "observe":
      return "border-sky-500/30 bg-sky-500/10 text-sky-200";
    default:
      return "border-slate-700 bg-slate-900/70 text-slate-300";
  }
}

function getExtraLabels(lang: string) {
  if (lang === "zh-CN") {
    return {
      growthSignals: "增长信号",
      revenueSnapshot: "收入快照",
      operationsSnapshot: "运营快照",
      billingRisk: "付款风险总览",
      paymentIntel: "付款事件智能",
      arpu: "ARPU 估算",
      billingRiskTenants: "风险租户",
      activeTenants: "活跃订阅",
      trialingTenants: "试用中",
      pastDueTenants: "逾期中",
      canceledTenants: "已取消",
      freeTenants: "免费租户",
      topFailureCodes: "主要失败码",
      monthlyAcquisition: "本月新增",
      monthlyReduction: "本月减少",
      netMovement: "净增长",
      paidRatio: "付费占比",
      topPlan: "主力 Plan",
      planArpu: "Plan ARPU",
      newRiskThisMonth: "本月新增风险",
      canceledThisMonth: "本月取消",
      recoveredThisMonth: "本月恢复",
      activeUsers: "活跃付费用户",
      trialingUsers: "试用用户",
      pastDueUsers: "逾期用户",
      canceledUsers: "取消用户",
      atRiskQueue: "高风险用户队列",
      billingWorkspace: "回款跟进工作台",
      immediate: "立即跟进",
      followUp: "后续跟进",
      observe: "持续观察",
      openRiskQueue: "打开风险队列",
      lastBillingUpdate: "最近账单更新时间",
    };
  }
  return {
    growthSignals: "Growth Signals",
    revenueSnapshot: "Revenue Snapshot",
    operationsSnapshot: "Operations Snapshot",
    billingRisk: "Billing Risk Overview",
    paymentIntel: "Payment Event Intelligence",
    arpu: "ARPU Estimate",
    billingRiskTenants: "Risk Tenants",
    activeTenants: "Active",
    trialingTenants: "Trialing",
    pastDueTenants: "Past Due",
    canceledTenants: "Canceled",
    freeTenants: "Free",
    topFailureCodes: "Top failure codes",
    monthlyAcquisition: "Monthly acquisition",
    monthlyReduction: "Monthly reduction",
    netMovement: "Net movement",
    paidRatio: "Paid ratio",
    topPlan: "Top plan",
    planArpu: "Plan ARPU",
    newRiskThisMonth: "New Risk This Month",
    canceledThisMonth: "Canceled This Month",
    recoveredThisMonth: "Recovered This Month",
    activeUsers: "Active Users",
    trialingUsers: "Trialing Users",
    pastDueUsers: "Past Due Users",
    canceledUsers: "Canceled Users",
    atRiskQueue: "At-Risk User Queue",
    billingWorkspace: "Billing Recovery Workspace",
    immediate: "Immediate",
    followUp: "Follow-up",
    observe: "Observe",
    openRiskQueue: "Open Risk Queue",
    lastBillingUpdate: "Last Billing Update",
  };
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

  const executiveCards = useMemo(() => {
    if (!executive) return [];
    return [
      {
        title: dict.executive.totalUsers,
        value: String(executive.totals.totalUsers),
        subtitle: `Tenants ${executive.totals.totalTenants}`,
      },
      {
        title: dict.executive.paidUsers,
        value: String(executive.totals.activePaidUsers),
        subtitle:
          executive.totals.totalUsers > 0
            ? `${((executive.totals.activePaidUsers / executive.totals.totalUsers) * 100).toFixed(1)}%`
            : "0%",
      },
      {
        title: dict.executive.newUsersThisMonth,
        value: `+${executive.totals.newUsersThisMonth}`,
        subtitle: extra.monthlyAcquisition,
      },
      {
        title: dict.executive.churnedUsersThisMonth,
        value: `-${executive.totals.churnedUsersThisMonth}`,
        subtitle: extra.monthlyReduction,
      },
      {
        title: dict.executive.netGrowthThisMonth,
        value: formatSignedNumber(executive.totals.netGrowthThisMonth),
        subtitle: extra.netMovement,
      },
      {
        title: dict.executive.currentMrr,
        value: formatMoney(executive.totals.currentMrr),
        subtitle: "current recurring revenue",
      },
    ];
  }, [executive, dict, extra]);

  const maxTotalUsers = Math.max(
    1,
    ...(executive?.monthlyUserGrowth || []).map((row) => row.totalUsers || 0),
  );

  const paidRatio = executive
    ? executive.totals.totalUsers > 0
      ? ((executive.totals.activePaidUsers / executive.totals.totalUsers) * 100).toFixed(1)
      : "0.0"
    : "0.0";

  const topPlan: { planCode: PlanCode; userCount: number } | null = executive
    ? ([...(executive as any).planBreakdown] as Array<{ planCode: PlanCode; userCount: number }>)
        .sort((a, b) => b.userCount - a.userCount)[0] || null
    : null;

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

  if (loading) return <div className="text-slate-300">Loading dashboard...</div>;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-100">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-cyan-400">{dict.shell.workspace}</div>
          <h2 className="mt-3 text-3xl font-semibold">{dict.shell.dashboard}</h2>
        </div>

        <div className="flex items-center gap-3">
          <PlatformLanguageSwitch lang={lang} path="/platform/dashboard" />
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              reload()
                .catch((e) => setError(e instanceof Error ? e.message : String(e)))
                .finally(() => setLoading(false));
            }}
            className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
          >
            {dict.shell.reload}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-semibold">{dict.executive.title}</div>
          <div className="text-xs text-slate-400">
            {extra.paidRatio} <span className="font-semibold text-slate-100">{paidRatio}%</span>
            {topPlan ? (
              <>
                {" "}· {extra.topPlan} <span className="font-semibold text-slate-100">{dict.plans[topPlan.planCode]}</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {executiveCards.map((card) => (
            <div key={card.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{card.title}</div>
              <div className="mt-3 text-2xl font-semibold">{card.value}</div>
              <div className="mt-2 text-xs text-slate-400">{card.subtitle}</div>
            </div>
          ))}
        </div>
      </div>

      {executive ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">{dict.executive.monthlyUserGrowth}</div>
                <div className="mt-1 text-xs text-slate-400">{dict.dashboard.userGrowthHint}</div>
              </div>
              <Link
                href={`/${lang}/platform/users`}
                className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
              >
                {dict.dashboard.openUsers}
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {(executive as any).monthlyUserGrowth.map((row: any) => (
                <div key={row.month}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                    <span>{row.month}</span>
                    <span>
                      {dict.dashboard.barNew}: {row.newUsers} · {dict.dashboard.barTotal}: {row.totalUsers}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-3 rounded-full bg-cyan-500/70"
                      style={{ width: `${Math.max(4, (row.totalUsers / maxTotalUsers) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-semibold">{dict.executive.planComposition}</div>
              <Link
                href={`/${lang}/platform/tenants`}
                className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
              >
                {dict.dashboard.openTenants}
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {((executive as any).planBreakdown as Array<{
                planCode: PlanCode;
                userCount: number;
                tenantCount: number;
                userRatio: number;
                mrrContribution: number;
                arpuEstimate?: number;
              }>).map((row) => (
                <div key={row.planCode} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{dict.plans[row.planCode]}</div>
                    <div className="text-xs text-slate-400">{row.userRatio}%</div>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-cyan-500/70"
                      style={{ width: `${Math.max(row.userRatio, row.userCount > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-3 text-xs text-slate-400">
                    <div>
                      <div>{dict.executive.userCount}</div>
                      <div className="mt-1 font-semibold text-slate-100">{row.userCount}</div>
                    </div>
                    <div>
                      <div>{dict.executive.tenantCount}</div>
                      <div className="mt-1 font-semibold text-slate-100">{row.tenantCount}</div>
                    </div>
                    <div>
                      <div>{dict.executive.revenue}</div>
                      <div className="mt-1 font-semibold text-slate-100">{formatMoney(row.mrrContribution)}</div>
                    </div>
                    <div>
                      <div>{extra.planArpu}</div>
                      <div className="mt-1 font-semibold text-slate-100">{formatMoney(row.arpuEstimate || 0)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {executive && operationsMetrics ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
            <div className="text-sm font-semibold">{extra.growthSignals}</div>
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{extra.monthlyAcquisition}</div>
                <div className="mt-2 text-2xl font-semibold">+{executive.totals.newUsersThisMonth}</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{extra.monthlyReduction}</div>
                <div className="mt-2 text-2xl font-semibold">-{executive.totals.churnedUsersThisMonth}</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{extra.netMovement}</div>
                <div className="mt-2 text-2xl font-semibold">{formatSignedNumber(executive.totals.netGrowthThisMonth)}</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
            <div className="text-sm font-semibold">{extra.revenueSnapshot}</div>
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Current MRR</div>
                <div className="mt-2 text-2xl font-semibold">{formatMoney(executive.totals.currentMrr)}</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Paid users</div>
                <div className="mt-2 text-2xl font-semibold">{executive.totals.activePaidUsers}</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{extra.arpu}</div>
                <div className="mt-2 text-2xl font-semibold">
                  {executive.totals.activePaidUsers > 0
                    ? formatMoney(Math.round(executive.totals.currentMrr / executive.totals.activePaidUsers))
                    : formatMoney(0)}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
            <div className="text-sm font-semibold">{extra.billingRisk}</div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{extra.billingRiskTenants}</div>
                <div className="mt-2 text-2xl font-semibold">{billingOverview.billingRiskTenants}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{extra.activeTenants}</div>
                  <div className="mt-2 text-xl font-semibold">{billingOverview.activeTenants}</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{extra.trialingTenants}</div>
                  <div className="mt-2 text-xl font-semibold">{billingOverview.trialingTenants}</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{extra.pastDueTenants}</div>
                  <div className="mt-2 text-xl font-semibold">{billingOverview.pastDueTenants}</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{extra.canceledTenants}</div>
                  <div className="mt-2 text-xl font-semibold">{billingOverview.canceledTenants}</div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{extra.freeTenants}</div>
                <div className="mt-2 text-xl font-semibold">{billingOverview.freeTenants}</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-semibold">{extra.operationsSnapshot}</div>
              <Link
                href={`/${lang}/platform/operations`}
                className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
              >
                {dict.dashboard.openOperations}
              </Link>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Total operations</div>
                <div className="mt-2 text-2xl font-semibold">{operationsMetrics.total}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Failed</div>
                  <div className="mt-2 text-xl font-semibold">{operationsMetrics.failed}</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Partial Failed</div>
                  <div className="mt-2 text-xl font-semibold">{operationsMetrics.partialFailed}</div>
                </div>
              </div>

              {operationsAnalytics?.topFailureCodes?.length ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{extra.topFailureCodes}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {operationsAnalytics.topFailureCodes.slice(0, 4).map((row: any) => (
                      <div
                        key={row.code}
                        className="rounded-full border border-rose-500/20 bg-rose-500/5 px-3 py-1.5 text-xs text-rose-200"
                      >
                        {row.code} · {row.count}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {executive ? (
          <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
              <div className="text-sm font-semibold">{extra.paymentIntel}</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{extra.newRiskThisMonth}</div>
                  <div className="mt-2 text-2xl font-semibold">{paymentIntel.newRiskThisMonth}</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{extra.canceledThisMonth}</div>
                  <div className="mt-2 text-2xl font-semibold">{paymentIntel.canceledThisMonth}</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{extra.recoveredThisMonth}</div>
                  <div className="mt-2 text-2xl font-semibold">{paymentIntel.recoveredThisMonth}</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{extra.activeUsers}</div>
                  <div className="mt-2 text-2xl font-semibold">{paymentIntel.activeUsers}</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{extra.trialingUsers}</div>
                  <div className="mt-2 text-2xl font-semibold">{paymentIntel.trialingUsers}</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{extra.pastDueUsers}</div>
                  <div className="mt-2 text-2xl font-semibold">{paymentIntel.pastDueUsers}</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{extra.canceledUsers}</div>
                  <div className="mt-2 text-2xl font-semibold">{paymentIntel.canceledUsers}</div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">{extra.atRiskQueue}</div>
                  <div className="mt-1 text-xs text-slate-400">{extra.billingWorkspace}</div>
                </div>
                <Link
                  href={`/${lang}/platform/users?queue=risk`}
                  className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                >
                  {extra.openRiskQueue}
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/${lang}/platform/users?queue=past_due`}
                  className={`rounded-full border px-3 py-1.5 text-xs ${getPriorityChip("immediate")}`}
                >
                  {extra.immediate} · {recoveryWorkspace.immediateQueueCount}
                </Link>
                <Link
                  href={`/${lang}/platform/users?queue=canceled`}
                  className={`rounded-full border px-3 py-1.5 text-xs ${getPriorityChip("follow-up")}`}
                >
                  {extra.followUp} · {recoveryWorkspace.followUpQueueCount}
                </Link>
                <Link
                  href={`/${lang}/platform/users?queue=trialing`}
                  className={`rounded-full border px-3 py-1.5 text-xs ${getPriorityChip("observe")}`}
                >
                  {extra.observe} · {recoveryWorkspace.observeQueueCount}
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {atRiskUsersPreview.length === 0 ? (
                  <div className="text-sm text-slate-400">No at-risk users.</div>
                ) : (
                  atRiskUsersPreview.map((row: any) => (
                    <Link
                      key={row.id}
                      href={`/${lang}/platform/users?queue=${row.planStatus || "risk"}&selected=${row.id}`}
                      className="block rounded-2xl border border-slate-800 bg-slate-900/70 p-4 hover:bg-slate-900"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">{row.email}</div>
                          <div className="mt-1 text-xs text-slate-400">{row.companyId || "-"}</div>
                        </div>
                        <div className="text-right">
                          <div className={`inline-flex rounded-full border px-2 py-1 text-xs ${getRiskChip(row.billingRiskLevel)}`}>
                            {row.billingRiskLevel}
                          </div>
                          <div className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs ${getPriorityChip(row.recoveryPriority)}`}>
                            {row.recoveryPriority}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
                        <div>Status: <span className="text-slate-200">{row.planStatus}</span></div>
                        <div>Revenue: <span className="text-slate-200">{formatMoney(row.estimatedMonthlyRevenue)}</span></div>
                        <div>{extra.lastBillingUpdate}: <span className="text-slate-200">{formatDateTime(row.subscriptionUpdatedAt, lang)}</span></div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}
    </div>
  );
}
