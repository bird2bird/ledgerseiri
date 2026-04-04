"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  controlPlatformUser,
  fetchPlatformUserInsightDetail,
  fetchPlatformUserInsightsList,
  getPlatformAccessToken,
  isPlatformUnauthorizedError,
  type PlatformUserInsightDetail,
  type PlatformUserInsightRow,
} from "@/core/platform-auth/client";
import { PlatformLanguageSwitch } from "@/components/platform/PlatformLanguageSwitch";
import {
  buildPlatformAuditHref,
  buildPlatformOperationsHref,
  buildPlatformReconciliationHref,
} from "@/core/platform/drilldown";

function formatMoney(v?: number | null) {
  return `¥${Number(v || 0).toLocaleString("ja-JP")}`;
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

function formatDate(value?: string | null, lang: string = "en") {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(lang === "zh-CN" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function getBillingRiskChip(level?: string) {
  switch ((level || "").toLowerCase()) {
    case "high":
      return "border-rose-500/30 bg-rose-500/10 text-rose-200";
    case "medium":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    case "watch":
      return "border-sky-500/30 bg-sky-500/10 text-sky-200";
    case "healthy":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
    default:
      return "border-slate-700 bg-slate-900/70 text-slate-300";
  }
}

function getTimelineTone(tone?: string) {
  switch ((tone || "").toLowerCase()) {
    case "high":
      return "border-rose-500/30 bg-rose-500/10 text-rose-200";
    case "medium":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    case "watch":
      return "border-sky-500/30 bg-sky-500/10 text-sky-200";
    case "healthy":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
    default:
      return "border-slate-700 bg-slate-950/40 text-slate-300";
  }
}

function getRecoveryPriority(row: any) {
  const status = (row?.planStatus || row?.billingStatus || "").toLowerCase();
  if (status === "past_due") return "immediate";
  if (status === "canceled") return "follow-up";
  if (status === "trialing") return "observe";
  return "healthy";
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

function getLastLoginBucket(lastLoginAt?: string | null) {
  if (!lastLoginAt) return "never_logged_in";
  const ts = new Date(lastLoginAt).getTime();
  if (Number.isNaN(ts)) return "dormant";
  const diffDays = (Date.now() - ts) / (1000 * 60 * 60 * 24);
  return diffDays <= 7 ? "active" : "dormant";
}

function getLastLoginBucketChip(bucket?: string) {
  switch ((bucket || "").toLowerCase()) {
    case "active":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
    case "dormant":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    case "never_logged_in":
      return "border-slate-600 bg-slate-900/70 text-slate-300";
    default:
      return "border-slate-700 bg-slate-900/70 text-slate-300";
  }
}




function getLabels(lang: string) {
  if (lang === "zh-CN") {
    return {
      title: "用户管理",
      subtitle: "User 360 / plan / billing / governance",
      reload: "刷新",
      search: "搜索邮箱 / 用户 ID / companyId",
      totalUsers: "总用户数",
      assignedUsers: "已分配用户",
      unassignedUsers: "未分配用户",
      paidUsers: "付费用户",
      billingRiskUsers: "风险用户",
      email: "邮箱",
      joinedAt: "加入时间",
      companyId: "租户ID",
      plan: "Plan",
      billing: "付款状态",
      billingRisk: "付款风险",
      revenue: "月收入估算",
      lastBillingUpdate: "最近账单更新时间",
      actions: "操作",
      detail: "详情",
      assign: "分配",
      unassign: "解除分配",
      identity: "基础信息",
      subscription: "订阅与付款",
      billingIntel: "付款智能",
      billingTimeline: "付款时间线",
      paymentSignals: "付款事件摘要",
      loginActivity: "登录活动",
      lastLoginAt: "最近登录时间",
      lastLoginIp: "最近登录IP",
      lastLoginStatus: "登录活跃度",
      activeUsers: "活跃用户",
      dormantUsers: "沉默用户",
      neverLoggedInUsers: "从未登录",
      loginIp: "登录IP",
      loginMethod: "登录方式",
      userAgent: "User-Agent",
      operations: "最近操作",
      audits: "最近审计",
      requestedBy: "操作者",
      governanceNote: "治理备注",
      openOps: "打开运营中心",
      detailWorkspace: "调查工作台",
      openUserAudit: "打开用户审计",
      openChangedAudit: "仅看变更记录",
      openReviewQueue: "打开审核队列",
      openOperationDetail: "打开操作详情",
      latestOperation: "最新操作聚焦",
      latestAudit: "最新审计聚焦",
      inspectOperationAudit: "查看操作关联审计",
      inspectAuditTimeline: "查看审计时间线",
      closeDetail: "关闭详情",
      noSelection: "选择一个用户以查看详情",
      recoveryPriority: "恢复优先级",
      riskReason: "风险原因",
      latestStatus: "最新状态",
      latestUpdatedAt: "最近状态更新时间",
      hasRevenue: "是否产生收入",
      timelineLength: "时间线事件数",
      followUpWorkspace: "回款跟进工作台",
      immediate: "立即跟进",
      followUp: "后续跟进",
      observe: "持续观察",
      all: "全部",
      riskQueue: "风险队列",
      selectedQueue: "当前队列",
    };
  }

  return {
    title: "Users",
    subtitle: "User 360 / plan / billing / governance",
    reload: "Reload",
    search: "Search email / user id / companyId",
    totalUsers: "Total Users",
    assignedUsers: "Assigned Users",
    unassignedUsers: "Unassigned Users",
    paidUsers: "Paid Users",
    billingRiskUsers: "Billing Risk Users",
    email: "Email",
    joinedAt: "Joined At",
    companyId: "Company ID",
    plan: "Plan",
    billing: "Billing",
    billingRisk: "Billing Risk",
    revenue: "Monthly Revenue",
    lastBillingUpdate: "Last Billing Update",
    actions: "Actions",
    detail: "Detail",
    assign: "Assign",
    unassign: "Unassign",
    identity: "Identity",
    subscription: "Subscription & Billing",
    billingIntel: "Billing Intelligence",
    billingTimeline: "Billing Timeline",
    paymentSignals: "Payment Event Summary",
    loginActivity: "Login Activity",
    lastLoginAt: "Last Login At",
    lastLoginIp: "Last Login IP",
    lastLoginStatus: "Login Activity",
    activeUsers: "Active Users",
    dormantUsers: "Dormant Users",
    neverLoggedInUsers: "Never Logged In",
    loginIp: "Login IP",
    loginMethod: "Login Method",
    userAgent: "User-Agent",
    operations: "Recent Operations",
    audits: "Recent Audits",
    requestedBy: "Requested By",
    governanceNote: "Governance Note",
    openOps: "Open Operations Center",
    detailWorkspace: "Investigation Workspace",
    openUserAudit: "Open User Audit",
    openChangedAudit: "Changed Events Only",
    openReviewQueue: "Open Review Queue",
    openOperationDetail: "Open Operation Detail",
    latestOperation: "Latest Operation Focus",
    latestAudit: "Latest Audit Focus",
    inspectOperationAudit: "Inspect Operation Audit",
    inspectAuditTimeline: "Inspect Audit Timeline",
    closeDetail: "Close Detail",
    noSelection: "Select one user to inspect details",
    recoveryPriority: "Recovery Priority",
    riskReason: "Risk Reason",
    latestStatus: "Latest Status",
    latestUpdatedAt: "Latest Updated At",
    hasRevenue: "Has Revenue",
    timelineLength: "Timeline Events",
    followUpWorkspace: "Billing Follow-up Workspace",
    immediate: "Immediate",
    followUp: "Follow-up",
    observe: "Observe",
    all: "All",
    riskQueue: "Risk Queue",
    selectedQueue: "Selected Queue",
  };
}

export default function PlatformUsersPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";
  const t = getLabels(lang);

  const [initialQueue, setInitialQueue] = useState("all");
  const [rows, setRows] = useState<PlatformUserInsightRow[]>([]);
  const [summary, setSummary] = useState({
    totalUsers: 0,
    assignedUsers: 0,
    unassignedUsers: 0,
    paidUsers: 0,
    billingRiskUsers: 0,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<PlatformUserInsightDetail | null>(null);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function reload() {
    const token = getPlatformAccessToken();
    if (!token) {
      router.replace(`/${lang}/platform-auth/login`);
      return;
    }

    const data = await fetchPlatformUserInsightsList(token);
    setRows(data.items || []);
    setSummary(
      (data.summary as any) || {
        totalUsers: 0,
        assignedUsers: 0,
        unassignedUsers: 0,
        paidUsers: 0,
        billingRiskUsers: 0,
      },
    );

    const nextSelected = selectedId || data.items?.[0]?.id || null;
    setSelectedId(nextSelected);

    if (nextSelected) {
      const d = await fetchPlatformUserInsightDetail(nextSelected, token);
      setDetail(d);
      setDetailOpen(true);
    } else {
      setDetail(null);
      setDetailOpen(false);
    }

    setError("");
  }

  async function selectUser(id: string) {
    const token = getPlatformAccessToken();
    if (!token) {
      router.replace(`/${lang}/platform-auth/login`);
      return;
    }
    setSelectedId(id);
    const d = await fetchPlatformUserInsightDetail(id, token);
    setDetail(d);
    setDetailOpen(true);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const qp = new URLSearchParams(window.location.search);
    const queue = qp.get("queue") || "all";
    const selected = qp.get("selected");
    setInitialQueue(queue);
    if (selected) {
      setSelectedId((prev) => prev ?? selected);
    }
  }, []);

  useEffect(() => {
    reload().catch((e) => {
      if (isPlatformUnauthorizedError(e)) {
        router.replace(`/${lang}/platform-auth/login`);
        return;
      }
      setError(e instanceof Error ? e.message : String(e));
    });
  }, [lang, router]);

  useEffect(() => {
    if (!detailOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [detailOpen]);

  async function onUnassign(id: string) {
    const governanceNote = window.prompt("Provide a reason for user unassign:", "");
    if (governanceNote === null) return;

    const confirmed = window.confirm("Dangerous action: unassign this user from the current tenant?");
    if (!confirmed) return;

    try {
      const token = getPlatformAccessToken();
      if (!token) {
        router.replace(`/${lang}/platform-auth/login`);
        return;
      }

      setBusyId(id);
      setNotice("");
      setError("");

      const result = await controlPlatformUser(id, "unassign", token, undefined, governanceNote);
      const operationId =
        typeof result === "object" && result?.operationId ? result.operationId : "";
      setNotice(`User unassigned successfully.${operationId ? ` Operation: ${operationId}` : ""}`);
      await reload();
    } catch (e) {
      if (isPlatformUnauthorizedError(e)) {
        router.replace(`/${lang}/platform-auth/login`);
        return;
      }
      setError("User unassign failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusyId(null);
    }
  }

  async function onAssign(id: string) {
    const companyId = window.prompt("Input target companyId:", "");
    if (!companyId) return;

    const governanceNote = window.prompt("Provide a reason for user assign:", "");
    if (governanceNote === null) return;

    try {
      const token = getPlatformAccessToken();
      if (!token) {
        router.replace(`/${lang}/platform-auth/login`);
        return;
      }

      setBusyId(id);
      setNotice("");
      setError("");

      const result = await controlPlatformUser(id, "assign", token, companyId, governanceNote);
      const operationId =
        typeof result === "object" && result?.operationId ? result.operationId : "";
      setNotice(`User assigned successfully.${operationId ? ` Operation: ${operationId}` : ""}`);
      await reload();
    } catch (e) {
      if (isPlatformUnauthorizedError(e)) {
        router.replace(`/${lang}/platform-auth/login`);
        return;
      }
      setError("User assign failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusyId(null);
    }
  }

  const workspaceCounts = useMemo(() => {
    const allRows = rows as any[];
    return {
      all: allRows.length,
      risk: allRows.filter(
        (r) =>
          r.billingRiskLevel === "high" ||
          r.billingRiskLevel === "medium" ||
          r.billingRiskLevel === "watch",
      ).length,
      active: allRows.filter((r) => getLastLoginBucket(r.lastLoginAt) === "active").length,
      dormant: allRows.filter((r) => getLastLoginBucket(r.lastLoginAt) === "dormant").length,
      never_logged_in: allRows.filter((r) => getLastLoginBucket(r.lastLoginAt) === "never_logged_in").length,
      past_due: allRows.filter((r) => (r.planStatus || "").toLowerCase() === "past_due").length,
      canceled: allRows.filter((r) => (r.planStatus || "").toLowerCase() === "canceled").length,
      trialing: allRows.filter((r) => (r.planStatus || "").toLowerCase() === "trialing").length,
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let next = [...(rows as any[])];

    if (initialQueue === "risk") {
      next = next.filter(
        (row) =>
          row.billingRiskLevel === "high" ||
          row.billingRiskLevel === "medium" ||
          row.billingRiskLevel === "watch",
      );
    } else if (
      initialQueue === "past_due" ||
      initialQueue === "canceled" ||
      initialQueue === "trialing"
    ) {
      next = next.filter((row) => (row.planStatus || "").toLowerCase() === initialQueue);
    } else if (
      initialQueue === "active" ||
      initialQueue === "dormant" ||
      initialQueue === "never_logged_in"
    ) {
      next = next.filter((row) => getLastLoginBucket(row.lastLoginAt) === initialQueue);
    }

    if (q) {
      next = next.filter((row) =>
        [
          row.id,
          row.email,
          row.companyId || "",
          row.planCode,
          row.planStatus,
          row.billingStatus,
          row.billingRiskLevel || "",
          row.lastLoginAt || "",
          row.lastLoginIp || "",
          getLastLoginBucket(row.lastLoginAt),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }

    next.sort((a, b) => {
      const weight = (p: string) =>
        p === "immediate" ? 0 : p === "follow-up" ? 1 : p === "observe" ? 2 : 9;
      const aw = weight(getRecoveryPriority(a));
      const bw = weight(getRecoveryPriority(b));
      if (aw !== bw) return aw - bw;

      const loginBucketWeight = (row: any) => {
        const bucket = getLastLoginBucket(row.lastLoginAt);
        if (bucket === "active") return 0;
        if (bucket === "dormant") return 1;
        return 2;
      };

      const awLogin = loginBucketWeight(a);
      const bwLogin = loginBucketWeight(b);
      if (awLogin !== bwLogin) return awLogin - bwLogin;

      const atLogin = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
      const btLogin = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
      if (atLogin !== btLogin) return btLogin - atLogin;

      const at = a.subscriptionUpdatedAt ? new Date(a.subscriptionUpdatedAt).getTime() : 0;
      const bt = b.subscriptionUpdatedAt ? new Date(b.subscriptionUpdatedAt).getTime() : 0;
      return bt - at;
    });

    return next;
  }, [rows, search, initialQueue]);

  const billingIntel = (detail as any)?.billingIntelligence || null;
  const billingTimeline = (detail as any)?.billingTimeline || [];
  const paymentSignals = (detail as any)?.paymentEventSummary || null;

  const latestOperation = detail?.recentOperations?.[0] || null;
  const latestAudit = detail?.recentAudits?.[0] || null;

  const userAuditHref = buildPlatformAuditHref(lang, {
      from: "users_detail",
      selected: detail?.profile?.id || "",
      operationId: latestOperation?.id || "",
      candidateId: detail?.profile?.id || "",
      companyId: detail?.profile?.companyId || "",
      page: 1,
      limit: 20,
    });

  const userChangedAuditHref = buildPlatformAuditHref(lang, {
      from: "users_detail",
      selected: detail?.profile?.id || "",
      operationId: latestOperation?.id || "",
      candidateId: detail?.profile?.id || "",
      companyId: detail?.profile?.companyId || "",
      changed: true,
      page: 1,
      limit: 20,
    });

  const userReviewQueueHref = buildPlatformReconciliationHref(lang, {
      from: "users_detail",
      selected: detail?.profile?.id || "",
      operationId: latestOperation?.id || "",
      candidateId: detail?.profile?.id || "",
      companyId: detail?.profile?.companyId || "",
      persistenceKey: latestAudit?.persistenceKey || "",
    });

  const operationsCenterHref = buildPlatformOperationsHref(lang, {
      from: "users_detail",
      selected: latestOperation?.id || detail?.profile?.id || "",
      operationId: latestOperation?.id || "",
      companyId: detail?.profile?.companyId || "",
      candidateId: detail?.profile?.id || "",
    });

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-100">
      <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
        Governance v2: note length policy is active for user assignment controls.
        <br />
        Governance: user assign/unassign now requires operator note + confirmation.
      </div>

      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-cyan-400">{t.subtitle}</div>
          <h2 className="mt-3 text-3xl font-semibold">{t.title}</h2>
        </div>

        <div className="flex items-center gap-3">
          <PlatformLanguageSwitch lang={lang} path="/platform/users" />
          <button
            type="button"
            onClick={() => reload().catch((e) => setError(e instanceof Error ? e.message : String(e)))}
            className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
          >
            {t.reload}
          </button>
        </div>
      </div>

      {notice ? (
        <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{t.totalUsers}</div>
          <div className="mt-2 text-2xl font-semibold">{summary.totalUsers}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{t.assignedUsers}</div>
          <div className="mt-2 text-2xl font-semibold">{summary.assignedUsers}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{t.unassignedUsers}</div>
          <div className="mt-2 text-2xl font-semibold">{summary.unassignedUsers}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{t.paidUsers}</div>
          <div className="mt-2 text-2xl font-semibold">{summary.paidUsers}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{t.billingRiskUsers}</div>
          <div className="mt-2 text-2xl font-semibold">{summary.billingRiskUsers}</div>
        </div>
      </div>

      <div className="mt-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
          <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">{t.followUpWorkspace}</div>
                <div className="mt-1 text-xs text-slate-400">
                  {t.selectedQueue}: <span className="text-slate-100">{initialQueue}</span>
                </div>
              </div>
              <div className="text-xs text-slate-400">{t.riskQueue}</div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/${lang}/platform/users?queue=all`}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  initialQueue === "all"
                    ? getPriorityChip("healthy")
                    : "border-slate-700 bg-slate-900/70 text-slate-300"
                }`}
              >
                {t.all} · {workspaceCounts.all}
              </Link>
              <Link
                href={`/${lang}/platform/users?queue=risk`}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  initialQueue === "risk"
                    ? getPriorityChip("follow-up")
                    : "border-slate-700 bg-slate-900/70 text-slate-300"
                }`}
              >
                {t.riskQueue} · {workspaceCounts.risk}
              </Link>
              <Link
                href={`/${lang}/platform/users?queue=past_due`}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  initialQueue === "past_due"
                    ? getPriorityChip("immediate")
                    : "border-slate-700 bg-slate-900/70 text-slate-300"
                }`}
              >
                {t.immediate} · {workspaceCounts.past_due}
              </Link>
              <Link
                href={`/${lang}/platform/users?queue=canceled`}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  initialQueue === "canceled"
                    ? getPriorityChip("follow-up")
                    : "border-slate-700 bg-slate-900/70 text-slate-300"
                }`}
              >
                {t.followUp} · {workspaceCounts.canceled}
              </Link>
              <Link
                href={`/${lang}/platform/users?queue=trialing`}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  initialQueue === "trialing"
                    ? getPriorityChip("observe")
                    : "border-slate-700 bg-slate-900/70 text-slate-300"
                }`}
              >
                {t.observe} · {workspaceCounts.trialing}
              </Link>
              <Link
                href={`/${lang}/platform/users?queue=active`}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  initialQueue === "active"
                    ? getLastLoginBucketChip("active")
                    : "border-slate-700 bg-slate-900/70 text-slate-300"
                }`}
              >
                {t.activeUsers} · {workspaceCounts.active}
              </Link>
              <Link
                href={`/${lang}/platform/users?queue=dormant`}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  initialQueue === "dormant"
                    ? getLastLoginBucketChip("dormant")
                    : "border-slate-700 bg-slate-900/70 text-slate-300"
                }`}
              >
                {t.dormantUsers} · {workspaceCounts.dormant}
              </Link>
              <Link
                href={`/${lang}/platform/users?queue=never_logged_in`}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  initialQueue === "never_logged_in"
                    ? getLastLoginBucketChip("never_logged_in")
                    : "border-slate-700 bg-slate-900/70 text-slate-300"
                }`}
              >
                {t.neverLoggedInUsers} · {workspaceCounts.never_logged_in}
              </Link>
            </div>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search}
            className="mb-4 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
          />

          <div className="overflow-hidden rounded-2xl border border-slate-800">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/70 text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left">{t.email}</th>
                  <th className="px-4 py-3 text-left">{t.joinedAt}</th>
                  <th className="px-4 py-3 text-left">{t.companyId}</th>
                  <th className="px-4 py-3 text-left">{t.plan}</th>
                  <th className="px-4 py-3 text-left">{t.billing}</th>
                  <th className="px-4 py-3 text-left">{t.billingRisk}</th>
                  <th className="px-4 py-3 text-left">{t.revenue}</th>
                  <th className="px-4 py-3 text-left">{t.lastBillingUpdate}</th>
                  <th className="px-4 py-3 text-left">{t.lastLoginAt}</th>
                  <th className="px-4 py-3 text-left">{t.lastLoginIp}</th>
                  <th className="px-4 py-3 text-left">{t.lastLoginStatus}</th>
                  <th className="px-4 py-3 text-left">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row: any) => {
                  const active = row.id === selectedId;
                  return (
                    <tr
                      key={row.id}
                      className={`border-t border-slate-800 ${active ? "bg-cyan-500/5" : "bg-slate-950/40"}`}
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            selectUser(row.id).catch((e) =>
                              setError(e instanceof Error ? e.message : String(e)),
                            )
                          }
                          className="text-left hover:text-cyan-300"
                        >
                          {row.email}
                        </button>
                      </td>
                      <td className="px-4 py-3">{formatDate(row.joinedAt, lang)}</td>
                      <td className="px-4 py-3">{row.companyId || "-"}</td>
                      <td className="px-4 py-3">
                        <div>{row.planCode}</div>
                        <div className="text-xs text-slate-500">{row.planStatus}</div>
                      </td>
                      <td className="px-4 py-3">{row.billingStatus}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs ${getBillingRiskChip(
                            row.billingRiskLevel,
                          )}`}
                        >
                          {row.billingRiskLevel || "free"}
                        </span>
                      </td>
                      <td className="px-4 py-3">{formatMoney(row.estimatedMonthlyRevenue)}</td>
                      <td className="px-4 py-3">{formatDateTime(row.subscriptionUpdatedAt, lang)}</td>
                      <td className="px-4 py-3">{formatDateTime(row.lastLoginAt, lang)}</td>
                      <td className="px-4 py-3">{row.lastLoginIp || "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs ${getLastLoginBucketChip(
                            getLastLoginBucket(row.lastLoginAt),
                          )}`}
                        >
                          {getLastLoginBucket(row.lastLoginAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              selectUser(row.id).catch((e) =>
                                setError(e instanceof Error ? e.message : String(e)),
                              )
                            }
                            className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                          >
                            {t.detail}
                          </button>
                          <button
                            type="button"
                            onClick={() => onAssign(row.id)}
                            disabled={busyId === row.id}
                            className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-200 disabled:opacity-40"
                          >
                            {t.assign}
                          </button>
                          <button
                            type="button"
                            onClick={() => onUnassign(row.id)}
                            disabled={busyId === row.id}
                            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-200 disabled:opacity-40"
                          >
                            {t.unassign}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {detailOpen ? (
          <>
            <button
              type="button"
              aria-label={t.closeDetail}
              onClick={() => setDetailOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-[1px]"
            />
            <aside className="fixed right-0 top-0 z-50 h-screen w-full max-w-[860px] overflow-y-auto border-l border-slate-800 bg-slate-950 shadow-2xl">
              <div className="min-h-full p-5 sm:p-6">
                {!detail ? (
                  <div className="text-sm text-slate-400">{t.noSelection}</div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold">{detail.profile.email}</div>
                        <div className="mt-1 text-xs text-slate-400">{detail.profile.id}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={operationsCenterHref}
                          className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                        >
                          {t.openOps}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDetailOpen(false)}
                          className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                        >
                          {t.closeDetail}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-4">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{t.identity}</div>
                        <div className="mt-3 space-y-2 text-sm">
                          <div>
                            Email: <span className="text-slate-300">{detail.profile.email}</span>
                          </div>
                          <div>
                            Joined:{" "}
                            <span className="text-slate-300">
                              {formatDate(detail.profile.joinedAt, lang)}
                            </span>
                          </div>
                          <div>
                            Company:{" "}
                            <span className="text-slate-300">
                              {detail.profile.companyId || "-"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          {t.subscription}
                        </div>
                        <div className="mt-3 space-y-2 text-sm">
                          <div>
                            Plan:{" "}
                            <span className="text-slate-300">{detail.subscription.planCode}</span>
                          </div>
                          <div>
                            Status:{" "}
                            <span className="text-slate-300">{detail.subscription.planStatus}</span>
                          </div>
                          <div>
                            Billing:{" "}
                            <span className="text-slate-300">
                              {detail.subscription.billingStatus}
                            </span>
                          </div>
                          <div>
                            Revenue:{" "}
                            <span className="text-slate-300">
                              {formatMoney(detail.subscription.estimatedMonthlyRevenue)}
                            </span>
                          </div>
                          <div>
                            Updated:{" "}
                            <span className="text-slate-300">
                              {formatDateTime(detail.subscription.subscriptionUpdatedAt, lang)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          {t.billingIntel}
                        </div>
                        <div className="mt-3 space-y-2 text-sm">
                          <div>
                            {t.billingRisk}:{" "}
                            <span
                              className={`inline-flex rounded-full border px-2 py-1 text-xs ${getBillingRiskChip(
                                billingIntel?.billingRiskLevel,
                              )}`}
                            >
                              {billingIntel?.billingRiskLevel || "free"}
                            </span>
                          </div>
                          <div>
                            {t.recoveryPriority}:{" "}
                            <span className="text-slate-300">
                              {billingIntel?.recoveryPriority || "-"}
                            </span>
                          </div>
                          <div>
                            {t.riskReason}:{" "}
                            <span className="text-slate-300">{billingIntel?.riskReason || "-"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          {t.paymentSignals}
                        </div>
                        <div className="mt-3 space-y-2 text-sm">
                          <div>
                            {t.latestStatus}:{" "}
                            <span className="text-slate-300">{paymentSignals?.latestStatus || "-"}</span>
                          </div>
                          <div>
                            {t.latestUpdatedAt}:{" "}
                            <span className="text-slate-300">
                              {formatDateTime(paymentSignals?.latestUpdatedAt, lang)}
                            </span>
                          </div>
                          <div>
                            {t.hasRevenue}:{" "}
                            <span className="text-slate-300">
                              {paymentSignals?.hasRevenue ? "YES" : "NO"}
                            </span>
                          </div>
                          <div>
                            {t.timelineLength}:{" "}
                            <span className="text-slate-300">
                              {paymentSignals?.timelineLength ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                            {t.loginActivity}
                          </div>
                          <div className="mt-3 space-y-2 text-sm">
                            <div>
                              {t.lastLoginAt}:{" "}
                              <span className="text-slate-300">
                                {formatDateTime(detail.profile.lastLoginAt, lang)}
                              </span>
                            </div>
                            <div>
                              {t.lastLoginIp}:{" "}
                              <span className="text-slate-300">{detail.profile.lastLoginIp || "-"}</span>
                            </div>
                          </div>
                          <div className="mt-4 space-y-3">
                            {(detail.loginHistory || []).length === 0 ? (
                              <div className="text-sm text-slate-400">No login history.</div>
                            ) : (
                              detail.loginHistory.map((row, idx) => (
                                <div
                                  key={`${row.loggedInAt}-${idx}`}
                                  className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-sm"
                                >
                                  <div className="font-medium">{formatDateTime(row.loggedInAt, lang)}</div>
                                  <div className="mt-1 text-xs text-slate-400">{t.loginIp}: {row.ipAddress || "-"}</div>
                                  <div className="mt-1 text-xs text-slate-400">{t.loginMethod}: {row.loginMethod || "-"}</div>
                                  <div className="mt-1 text-xs text-slate-400">{t.userAgent}: {row.userAgent || "-"}</div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          {t.billingTimeline}
                        </div>
                        <div className="mt-3 space-y-3">
                          {billingTimeline.length === 0 ? (
                            <div className="text-sm text-slate-400">No billing timeline.</div>
                          ) : (
                            billingTimeline.map((row: any, idx: number) => (
                              <div
                                key={`${row.type}-${idx}`}
                                className={`rounded-xl border p-3 text-sm ${getTimelineTone(row.tone)}`}
                              >
                                <div className="font-medium">{row.label}</div>
                                <div className="mt-1 text-xs opacity-80">
                                  {formatDateTime(row.at, lang)}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          {t.detailWorkspace}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {detail?.profile?.companyId ? (
                              <Link
                                href={`/${lang}/platform/tenants?selected=${encodeURIComponent(detail.profile.companyId)}`}
                                className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs text-violet-200 hover:bg-violet-500/15"
                              >
                                Open Tenant
                              </Link>
                            ) : null}
                            <Link
                            href={operationsCenterHref}
                            className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                          >
                            {t.openOps}
                          </Link>
                          <Link
                            href={userAuditHref}
                            className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                          >
                            {t.openUserAudit}
                          </Link>
                          <Link
                            href={userChangedAuditHref}
                            className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200 hover:bg-cyan-500/15"
                          >
                            {t.openChangedAudit}
                          </Link>
                          <Link
                            href={userReviewQueueHref}
                            className="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-500"
                          >
                            {t.openReviewQueue}
                          </Link>
                        </div>

                        <div className="mt-4 grid gap-3 xl:grid-cols-2">
                          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-sm">
                            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                              {t.latestOperation}
                            </div>
                            {latestOperation ? (
                              <>
                                <div className="mt-2 font-medium">
                                  {latestOperation.type} · {latestOperation.status}
                                </div>
                                <div className="mt-1 text-xs text-slate-400">
                                  {latestOperation.scope} · {latestOperation.requestedAt || "-"}
                                </div>
                                <div className="mt-3">
                                  <Link
                                    href={buildPlatformOperationsHref(lang, {
                                        from: "users_detail_latest_operation",
                                        selected: latestOperation.id,
                                        operationId: latestOperation.id,
                                        companyId: detail?.profile?.companyId || "",
                                        candidateId: detail?.profile?.id || "",
                                      })}
                                    className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                                  >
                                    {t.openOperationDetail}
                                  </Link>
                                </div>
                              </>
                            ) : (
                              <div className="mt-2 text-sm text-slate-400">No recent operations.</div>
                            )}
                          </div>

                          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-sm">
                            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                              {t.latestAudit}
                            </div>
                            {latestAudit ? (
                              <>
                                <div className="mt-2 font-medium">
                                  {latestAudit.actionType} · {latestAudit.source}
                                </div>
                                <div className="mt-1 text-xs text-slate-400">
                                  {latestAudit.persistenceKey || "-"} · {latestAudit.createdAt || "-"}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <Link
                                    href={buildPlatformAuditHref(lang, {
                                        from: "users_detail_latest_audit",
                                        selected: detail?.profile?.id || "",
                                        operationId: latestOperation?.id || "",
                                        candidateId: detail?.profile?.id || "",
                                        companyId: detail?.profile?.companyId || "",
                                        persistenceKey: latestAudit.persistenceKey || "",
                                        page: 1,
                                        limit: 20,
                                      })}
                                    className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                                  >
                                    {t.inspectAuditTimeline}
                                  </Link>
                                  <Link
                                    href={buildPlatformReconciliationHref(lang, {
                                        from: "users_detail_latest_audit",
                                        selected: detail?.profile?.id || "",
                                        operationId: latestOperation?.id || "",
                                        candidateId: detail?.profile?.id || "",
                                        companyId: detail?.profile?.companyId || "",
                                        persistenceKey: latestAudit.persistenceKey || "",
                                      })}
                                    className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5 text-xs text-cyan-200 hover:bg-cyan-500/15"
                                  >
                                    {t.openReviewQueue}
                                  </Link>
                                </div>
                              </>
                            ) : (
                              <div className="mt-2 text-sm text-slate-400">No recent audits.</div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          {t.operations}
                        </div>
                        <div className="mt-3 space-y-3">
                          {detail.recentOperations.length === 0 ? (
                            <div className="text-sm text-slate-400">No recent operations.</div>
                          ) : (
                            detail.recentOperations.map((row) => (
                              <div
                                key={row.id}
                                className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-sm"
                              >
                                <div className="font-medium">
                                  {row.type} · {row.status}
                                </div>
                                <div className="mt-1 text-xs text-slate-400">
                                  {t.requestedBy}: {row.requestedByAdminEmail || "-"}
                                </div>
                                <div className="mt-1 text-xs text-slate-400">
                                  {t.governanceNote}: {row.note || "-"}
                                </div>
                                <div className="mt-3">
                                  <Link
                                    href={buildPlatformOperationsHref(lang, {
                                        from: "users_recent_operations",
                                        selected: row.id,
                                        operationId: row.id,
                                        companyId: detail?.profile?.companyId || "",
                                        candidateId: detail?.profile?.id || "",
                                      })}
                                    className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                                  >
                                    {t.openOperationDetail}
                                  </Link>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          {t.audits}
                        </div>
                        <div className="mt-3 space-y-3">
                          {detail.recentAudits.length === 0 ? (
                            <div className="text-sm text-slate-400">No recent audits.</div>
                          ) : (
                            detail.recentAudits.map((row) => (
                              <div
                                key={row.id}
                                className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-sm"
                              >
                                <div className="font-medium">
                                  {row.actionType} · {row.source}
                                </div>
                                <div className="mt-1 text-xs text-slate-400">
                                  {row.persistenceKey || "-"}
                                </div>
                                <div className="mt-1 text-xs text-slate-400">
                                  {row.previousValue || "-"} → {row.nextValue || "-"}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <Link
                                    href={buildPlatformAuditHref(lang, {
                                        from: "users_recent_audits",
                                        selected: detail?.profile?.id || "",
                                        operationId: latestOperation?.id || "",
                                        candidateId: detail?.profile?.id || "",
                                        companyId: detail?.profile?.companyId || "",
                                        persistenceKey: row.persistenceKey || "",
                                        page: 1,
                                        limit: 20,
                                      })}
                                    className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                                  >
                                    {t.inspectAuditTimeline}
                                  </Link>
                                  <Link
                                    href={buildPlatformReconciliationHref(lang, {
                                        from: "users_recent_audits",
                                        selected: detail?.profile?.id || "",
                                        operationId: latestOperation?.id || "",
                                        candidateId: detail?.profile?.id || "",
                                        companyId: detail?.profile?.companyId || "",
                                        persistenceKey: row.persistenceKey || "",
                                      })}
                                    className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5 text-xs text-cyan-200 hover:bg-cyan-500/15"
                                  >
                                    {t.openReviewQueue}
                                  </Link>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </aside>
          </>
        ) : null}
      </div>
    </div>
  );
}
