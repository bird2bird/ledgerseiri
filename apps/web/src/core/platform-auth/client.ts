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

export async function controlPlatformTenant(id: string, action: "suspend" | "activate", token: string) {
  const res = await fetch(`${getPlatformApiBase()}/platform/tenants/${id}/${action}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.text();
  if (!res.ok) throwPlatformApiError(res, { message: data }, "Tenant control failed");
  return data;
}

export async function controlPlatformUser(
  id: string,
  action: "assign" | "unassign",
  token: string,
  companyId?: string
) {
  const res = await fetch(`${getPlatformApiBase()}/platform/users/${id}/${action}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: action === "assign" ? JSON.stringify({ companyId }) : undefined,
  });

  const data = await res.text();
  if (!res.ok) throwPlatformApiError(res, { message: data }, "User control failed");
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

export async function fetchPlatformOperationsList(
  token: string,
  params?: {
    scope?: string;
    limit?: number;
  }
) {
  const query = new URLSearchParams();
  if (params?.scope) query.set("scope", params.scope);
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();

  const res = await fetch(
    `${getPlatformApiBase()}/platform/operations/list${qs ? `?${qs}` : ""}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  const data = await res.json().catch(() => ([]));
  if (!res.ok) {
    throwPlatformApiError(res, data, "Platform operations list failed");
  }

  return data as PlatformOperationRecord[];
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

