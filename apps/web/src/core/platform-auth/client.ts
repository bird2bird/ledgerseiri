export const PLATFORM_ACCESS_TOKEN_KEY = "ls_platform_access_token";

export class PlatformUnauthorizedError extends Error {
  constructor(message = "PLATFORM_ACCESS_INVALID") {
    super(message);
    this.name = "PlatformUnauthorizedError";
  }
}

export function isPlatformUnauthorizedError(err: unknown): err is PlatformUnauthorizedError {
  return err instanceof PlatformUnauthorizedError;
}

function throwPlatformApiError(res: Response, data: any, fallback: string): never {
  const message = String(data?.message || fallback || "Platform request failed");

  if (res.status === 401 || res.status === 403) {
    clearPlatformAccessToken();
    throw new PlatformUnauthorizedError(message);
  }

  throw new Error(message);
}

function buildQuery(params?: Record<string, string | number | boolean | null | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function getPlatformApiBase(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
}

export function getPlatformAccessToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(PLATFORM_ACCESS_TOKEN_KEY) || "";
}

export function setPlatformAccessToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PLATFORM_ACCESS_TOKEN_KEY, token);
}

export function clearPlatformAccessToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PLATFORM_ACCESS_TOKEN_KEY);
}

export async function platformLogin(email: string, password: string) {
  const res = await fetch(`${getPlatformApiBase()}/platform-auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwPlatformApiError(res, data, "Platform login failed");

  return data as {
    accessToken: string;
    refreshToken?: string;
    admin: { id: string; email: string; role: string };
    session?: { id: string; expiresAt: string };
  };
}

export async function fetchPlatformProtected(token: string) {
  const res = await fetch(`${getPlatformApiBase()}/platform-auth/protected`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwPlatformApiError(res, data, "Protected request failed");
  return data;
}

export async function fetchPlatformMe() {
  const res = await fetch(`${getPlatformApiBase()}/platform-auth/me`, {
    method: "GET",
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwPlatformApiError(res, data, "Platform me failed");
  return data;
}

export async function fetchPlatformTenantSummary(token: string) {
  const res = await fetch(`${getPlatformApiBase()}/platform/tenants/summary`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwPlatformApiError(res, data, "Platform tenant summary failed");
  return data;
}

export async function fetchPlatformUsersSummary(token: string) {
  const res = await fetch(`${getPlatformApiBase()}/platform/users/summary`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwPlatformApiError(res, data, "Platform users summary failed");
  return data;
}

export async function fetchPlatformReconciliationSummary(token: string) {
  const res = await fetch(`${getPlatformApiBase()}/platform/reconciliation/summary`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwPlatformApiError(res, data, "Platform reconciliation summary failed");
  return data;
}

export async function fetchPlatformRevenueSummary(token: string) {
  const res = await fetch(`${getPlatformApiBase()}/platform/revenue/summary`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwPlatformApiError(res, data, "Revenue summary failed");
  return data;
}

export async function fetchPlatformTenantsList(token: string) {
  const res = await fetch(`${getPlatformApiBase()}/platform/tenants/list`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ([]));
  if (!res.ok) throwPlatformApiError(res, { message: "Platform tenants list failed" }, "Platform tenants list failed");
  return data;
}

export async function fetchPlatformUsersList(token: string) {
  const res = await fetch(`${getPlatformApiBase()}/platform/users/list`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ([]));
  if (!res.ok) throwPlatformApiError(res, { message: "Platform users list failed" }, "Platform users list failed");
  return data;
}

export type PlatformAuditListParams = {
  page?: number;
  limit?: number;
  q?: string;
  actionType?: string;
  source?: string;
  changed?: string;
  companyId?: string;
  candidateId?: string;
  persistenceKey?: string;
};

export type PlatformAuditRow = {
  id: string;
  companyId: string;
  candidateId: string;
  persistenceKey: string | null;
  actionType: string;
  source: string;
  previousValue: string | null;
  nextValue: string | null;
  changed: boolean;
  createdAt: string;
  submittedAt: string;
};

export type PlatformAuditListResponse = {
  items: PlatformAuditRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  filters: Record<string, string | null>;
};

export async function fetchPlatformReconciliationList(
  token: string,
  params?: PlatformAuditListParams
) {
  const res = await fetch(
    `${getPlatformApiBase()}/platform/reconciliation/list${buildQuery(params)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throwPlatformApiError(res, { message: "Platform reconciliation list failed" }, "Platform reconciliation list failed");
  }
  return data as PlatformAuditListResponse;
}

export async function controlPlatformTenant(
  id: string,
  action: "suspend" | "activate",
  token: string,
  note?: string
) {
  const res = await fetch(`${getPlatformApiBase()}/platform/tenants/${id}/${action}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ note: note || "" }),
  });

  const text = await res.text();
  let data: any = text;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text;
  }

  if (!res.ok) throwPlatformApiError(res, { message: typeof data === "string" ? data : data?.message }, "Tenant control failed");
  return data;
}

export async function controlPlatformUser(
  id: string,
  action: "assign" | "unassign",
  token: string,
  companyId?: string,
  note?: string
) {
  const res = await fetch(`${getPlatformApiBase()}/platform/users/${id}/${action}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body:
      action === "assign"
        ? JSON.stringify({ companyId, note: note || "" })
        : JSON.stringify({ note: note || "" }),
  });

  const text = await res.text();
  let data: any = text;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text;
  }

  if (!res.ok) throwPlatformApiError(res, { message: typeof data === "string" ? data : data?.message }, "User control failed");
  return data;
}

export async function overridePlatformReconciliationDecision(
  id: string,
  decision: "APPROVED" | "REJECTED",
  token: string
) {
  const res = await fetch(`${getPlatformApiBase()}/platform/reconciliation/${id}/override`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ decision }),
  });

  const data = await res.json().catch(async () => {
    const text = await res.text().catch(() => "");
    return text ? { message: text } : {};
  });

  if (!res.ok) {
    throwPlatformApiError(
      res,
      data,
      "Platform reconciliation override failed"
    );
  }

  return data;
}

export type PlatformBatchOverrideResult = {
  attempted: number;
  success: number;
  failed: number;
  failedIds: string[];
};

export async function batchOverridePlatformReconciliationDecisions(
  ids: string[],
  decision: "APPROVED" | "REJECTED",
  token: string
) {
  const res = await fetch(`${getPlatformApiBase()}/platform/reconciliation/batch/override`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids, decision }),
  });

  const data = await res.json().catch(async () => {
    const text = await res.text().catch(() => "");
    return text ? { message: text } : {};
  });

  if (!res.ok) {
    throwPlatformApiError(
      res,
      data,
      "Platform reconciliation batch override failed"
    );
  }

  return data as PlatformBatchOverrideResult;
}

export type PlatformReconciliationOpsSummary = {
  totalAuditRows: number;
  changedRows: number;
  adminRows: number;
  overrideRows: number;
  failedSignals: number;
  actionableSignals: number;
  latestAuditAt: string | null;
  filters: {
    companyId: string | null;
    candidateId: string | null;
    persistenceKey: string | null;
  };
};

export async function fetchPlatformReconciliationOpsSummary(
  token: string,
  params?: {
    companyId?: string;
    candidateId?: string;
    persistenceKey?: string;
  }
) {
  const res = await fetch(
    `${getPlatformApiBase()}/platform/reconciliation/ops-summary${buildQuery(params)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throwPlatformApiError(
      res,
      data,
      "Platform reconciliation ops summary failed"
    );
  }

  return data as PlatformReconciliationOpsSummary;
}

export type PlatformOperationRecord = {
  id: string;
  type: string;
  scope: string;
  status: string;
  requestedDecision: string | null;
  requestedByAdminId?: string | null;
  requestedByAdminEmail?: string | null;
  companyId?: string | null;
  candidateId?: string | null;
  persistenceKey?: string | null;
  source?: string | null;
  note?: string | null;
  requestedCount: number;
  successCount: number;
  failedCount: number;
  requestedAt: string;
  completedAt: string | null;
};

export type PlatformOperationItemRecord = {
  id: string;
  operationId: string;
  targetType: string;
  targetId: string;
  companyId: string | null;
  candidateId: string | null;
  persistenceKey: string | null;
  requestedAction: string;
  beforeValue: string | null;
  afterValue: string | null;
  status: string;
  failureCode: string | null;
  failureMessage: string | null;
  auditId: string | null;
  processedAt: string;
};

export type PlatformBatchOperationResponse = {
  operation: PlatformOperationRecord;
  items: PlatformOperationItemRecord[];
  summary: {
    attempted: number;
    success: number;
    failed: number;
    failedIds: string[];
  };
};

export async function batchOverridePlatformReconciliationViaOperation(
  ids: string[],
  decision: "APPROVED" | "REJECTED",
  token: string,
  source = "review_queue",
  note?: string
) {
  const res = await fetch(
    `${getPlatformApiBase()}/platform/reconciliation/operations/batch-override`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ids,
        decision,
        source,
        note: note || null,
      }),
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throwPlatformApiError(
      res,
      data,
      "Platform reconciliation operation batch override failed"
    );
  }

  return data as PlatformBatchOperationResponse;
}

export async function fetchPlatformOperationById(
  id: string,
  token: string
) {
  const res = await fetch(`${getPlatformApiBase()}/platform/operations/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throwPlatformApiError(res, data, "Platform operation fetch failed");
  }

  return data as PlatformOperationRecord & { items: PlatformOperationItemRecord[] };
}

export type PlatformOperationsListResponse = {
  items: PlatformOperationRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  filters: {
    scope: string | null;
    status: string | null;
    q: string | null;
  };
};

export async function fetchPlatformOperationsList(
  token: string,
  params?: {
    scope?: string;
    status?: string;
    q?: string;
    page?: number;
    limit?: number;
  }
) {
  const query = new URLSearchParams();
  if (params?.scope) query.set("scope", params.scope);
  if (params?.status) query.set("status", params.status);
  if (params?.q) query.set("q", params.q);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();

  const res = await fetch(
    `${getPlatformApiBase()}/platform/operations/list${qs ? `?${qs}` : ""}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throwPlatformApiError(res, data, "Platform operations list failed");
  }

  return data as PlatformOperationsListResponse;
}

export async function retryFailedPlatformOperation(
  operationId: string,
  token: string,
  source = "operations_center"
) {
  const res = await fetch(
    `${getPlatformApiBase()}/platform/operations/${operationId}/retry-failed`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ source }),
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throwPlatformApiError(res, data, "Retry failed platform operation failed");
  }

  return data as PlatformBatchOperationResponse;
}

export async function fetchPlatformAuditOperationLink(
  operationId: string,
  token: string
) {
  const res = await fetch(
    `${getPlatformApiBase()}/platform/reconciliation/operation-link?operationId=${encodeURIComponent(operationId)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throwPlatformApiError(res, data, "Platform audit operation link failed");
  }

  return data as {
    operationId: string;
    found: boolean;
    scope?: string;
    status?: string;
    auditIds: string[];
    items: Array<{
      id: string;
      targetId: string;
      auditId: string | null;
      status: string;
    }>;
  };
}

export async function fetchPlatformOperationsMetrics(token: string) {
  const res = await fetch(`${getPlatformApiBase()}/platform/operations/metrics`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throwPlatformApiError(res, data, "Platform operations metrics failed");
  }

  return data as {
    total: number;
    running: number;
    completed: number;
    partialFailed: number;
    failed: number;
    retryCapable: number;
    byScope: Array<{ scope: string; count: number }>;
    topFailureCodes: Array<{ code: string; count: number }>;
  };
}

export async function fetchPlatformOperationsAnalytics(token: string) {
  const res = await fetch(`${getPlatformApiBase()}/platform/operations/analytics`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throwPlatformApiError(res, data, "Platform operations analytics failed");
  }

  return data as {
    failureTrend: Array<{
      id: string;
      requestedAt: string;
      scope: string;
      failedCount: number;
      successCount: number;
      status: string;
    }>;
    scopeByStatus: Array<{ scope: string; status: string; count: number }>;
    retryPerformanceByScope: Array<{
      scope: string;
      total: number;
      retryCapable: number;
      successful: number;
      successRate: number;
    }>;
    topFailureCodes: Array<{ code: string; count: number }>;
    recentFailingTargets: Array<{
      targetId: string;
      count: number;
      scope: string;
      lastFailureCode: string | null;
    }>;
    noisyCompanies: Array<{ companyId: string; count: number }>;
    noisyCandidates: Array<{ candidateId: string; count: number }>;
  };
}



export type PlatformExecutiveSummaryResponse = {
  totals: {
    totalUsers: number;
    activePaidUsers: number;
    totalTenants: number;
    newUsersThisMonth: number;
    churnedUsersThisMonth: number;
    netGrowthThisMonth: number;
    currentMrr: number;
  };
  planBreakdown: Array<{
    planCode: "free" | "starter" | "standard" | "premium";
    userCount: number;
    tenantCount: number;
    userRatio: number;
    mrrContribution: number;
    arpuEstimate?: number;
  }>;
  monthlyUserGrowth: Array<{
    month: string;
    newUsers: number;
    totalUsers: number;
  }>;
  billingOverview?: {
    freeTenants: number;
    activeTenants: number;
    trialingTenants: number;
    pastDueTenants: number;
    canceledTenants: number;
    billingRiskTenants: number;
  };
  paymentEventIntelligence?: {
    newRiskThisMonth: number;
    canceledThisMonth: number;
    recoveredThisMonth: number;
    trialingUsers: number;
    pastDueUsers: number;
    canceledUsers: number;
    activeUsers: number;
  };
  atRiskUsersPreview?: Array<{
    id: string;
    email: string;
    companyId: string | null;
    planCode: "free" | "starter" | "standard" | "premium";
    planStatus: string;
    billingRiskLevel: string;
    recoveryPriority: string;
    subscriptionUpdatedAt: string | null;
    estimatedMonthlyRevenue: number;
  }>;
  billingRecoveryWorkspace?: {
    immediateQueueCount: number;
    followUpQueueCount: number;
    observeQueueCount: number;
    totalAtRiskPreview: number;
  };
  mrrDecomposition?: {
    totalMrr: number;
    activeMrr: number;
    pastDueMrr: number;
    canceledMrr: number;
    atRiskMrr: number;
    trialingPipelineMrr: number;
    freeMrr: number;
    byStatus: {
      active: number;
      trialing: number;
      pastDue: number;
      canceled: number;
      free: number;
    };
    byPlan: Array<{
      planCode: "free" | "starter" | "standard" | "premium";
      currentMrr: number;
      atRiskMrr: number;
      trialingPipelineMrr: number;
      currentSharePct: number;
    }>;
  };
  planMovementInsights?: {
    upgradesThisMonth: number;
    downgradesThisMonth: number;
    activationsThisMonth: number;
    cancellationsThisMonth: number;
    trialingStartsThisMonth: number;
    byPlan: Array<{
      planCode: "free" | "starter" | "standard" | "premium";
      entered: number;
      exited: number;
      net: number;
    }>;
  };
  lifecycleFunnel?: {
    current: {
      trialingNow: number;
      activeNow: number;
      pastDueNow: number;
      canceledNow: number;
    };
    movements: {
      trialStartsThisMonth: number;
      trialToActiveThisMonth: number;
      trialToCanceledThisMonth: number;
      pastDueToActiveThisMonth: number;
      activeToCanceledThisMonth: number;
      recoveryAttemptsThisMonth: number;
    };
    rates: {
      trialConversionRatePct: number;
      recoverySuccessRatePct: number;
    };
  };
  riskRevenueTrend?: Array<{
    month: string;
    atRiskMrr: number;
    recoveredMrr: number;
    canceledMrr: number;
  }>;
  churnRecoveryTrend?: Array<{
    month: string;
    cancellations: number;
    recoveries: number;
    trialConversions: number;
  }>;
  cohortRetentionInsights?: {
    cohorts: Array<{
      cohortMonth: string;
      newUsers: number;
      retainedPaidUsers: number;
      churnedUsers: number;
      currentMrr: number;
    }>;
    summary: {
      retainedPaidCompanies: number;
      churnedPaidCompanies: number;
      expansionMrr: number;
      contractionMrr: number;
    };
  };
  forecastInsights?: {
    projectedNextMonthMrr: number;
    baseline: {
      avgAtRiskMrr: number;
      avgRecoveredMrr: number;
      avgCanceledMrr: number;
      avgRecoveries: number;
      avgCancellations: number;
      avgTrialConversions: number;
    };
    anomalyFlags: {
      riskSpike: boolean;
      recoveryDrop: boolean;
      cancellationSpike: boolean;
      trialConversionDrop: boolean;
    };
    alertLevel: "healthy" | "medium" | "high" | string;
    summary: string;
  };
};

export async function fetchPlatformExecutiveSummary(token: string) {
  const res = await fetch(`${getPlatformApiBase()}/platform/executive-summary`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throwPlatformApiError(res, data, "Platform executive summary failed");
  }

  return data as PlatformExecutiveSummaryResponse;
}


export type PlatformUserInsightRow = {
  id: string;
  email: string;
  companyId: string | null;
  joinedAt: string;
  planCode: "free" | "starter" | "standard" | "premium";
  planStatus: string;
  billingStatus: string;
  estimatedMonthlyRevenue: number;
  subscriptionUpdatedAt: string | null;
  billingRiskLevel?: string;
};

export type PlatformUserInsightDetail = {
  profile: {
    id: string;
    email: string;
    companyId: string | null;
    joinedAt: string;
    lastLoginAt?: string | null;
    lastLoginIp?: string | null;
  };
  subscription: {
    planCode: "free" | "starter" | "standard" | "premium";
    planStatus: string;
    billingStatus: string;
    estimatedMonthlyRevenue: number;
    subscriptionUpdatedAt: string | null;
  };
  billingIntelligence?: {
    billingRiskLevel: string;
    recoveryPriority: string;
    riskReason: string;
  };
  billingTimeline?: Array<{
    type: string;
    label: string;
    at: string | null;
    tone: string;
  }>;
  paymentEventSummary?: {
    latestStatus: string;
    latestUpdatedAt: string | null;
    hasRevenue: boolean;
    timelineLength: number;
  };
  recentOperations: Array<{
    id: string;
    type: string;
    scope: string;
    status: string;
    note: string | null;
    requestedByAdminEmail: string | null;
    requestedAt: string;
    completedAt: string | null;
  }>;
  recentAudits: Array<{
    id: string;
    actionType: string;
    source: string;
    previousValue: string | null;
    nextValue: string | null;
    createdAt: string;
    persistenceKey: string | null;
  }>;
  loginHistory: Array<{
    loggedInAt: string;
    ipAddress: string | null;
    userAgent: string | null;
    loginMethod: string;
    success: boolean;
  }>;
};

export async function fetchPlatformUserInsightsList(token: string) {
  const res = await fetch(`${getPlatformApiBase()}/platform/users-insights/list`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throwPlatformApiError(res, data, "Platform user insights list failed");
  }

  return data as {
    items: PlatformUserInsightRow[];
    summary: {
      totalUsers: number;
      assignedUsers: number;
      unassignedUsers: number;
      paidUsers: number;
        billingRiskUsers: number;
    };
  };
}

export async function fetchPlatformUserInsightDetail(id: string, token: string) {
  const res = await fetch(`${getPlatformApiBase()}/platform/users-insights/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throwPlatformApiError(res, data, "Platform user insight detail failed");
  }

  return data as PlatformUserInsightDetail;
}
