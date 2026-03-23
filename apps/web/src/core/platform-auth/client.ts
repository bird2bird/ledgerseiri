export const PLATFORM_ACCESS_TOKEN_KEY = "ls_platform_access_token";

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

  if (!res.ok) {
    throw new Error(data?.message || "Platform login failed");
  }

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

  if (!res.ok) {
    throw new Error(data?.message || "Protected request failed");
  }

  return data;
}

export async function fetchPlatformMe() {
  const res = await fetch(`${getPlatformApiBase()}/platform-auth/me`, {
    method: "GET",
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || "Platform me failed");
  }

  return data;
}


export async function fetchPlatformTenantSummary(token: string) {
  const res = await fetch(`${getPlatformApiBase()}/platform/tenants/summary`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || "Platform tenant summary failed");
  }

  return data as {
    totalTenants: number;
    tenantsWithUsers: number;
    tenantsWithStores: number;
    subscribedTenants: number;
    createdLast30Days: number;
  };
}


export async function fetchPlatformUsersSummary(token: string) {
  const res = await fetch(`${getPlatformApiBase()}/platform/users/summary`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || "Platform users summary failed");
  }

  return data as {
    totalUsers: number;
    assignedUsers: number;
    unassignedUsers: number;
    newUsers30d: number;
  };
}


export async function fetchPlatformReconciliationSummary(token: string) {
  const res = await fetch(`${getPlatformApiBase()}/platform/reconciliation/summary`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || "Platform reconciliation summary failed");
  }

  return data as {
    totalDecisions: number;
    avgConfidence: number;
    decisions30d: number;
    totalAudits: number;
    audits30d: number;
    latestSubmittedAt: string | null;
    decisionBreakdown: Array<{ decision: string; count: number }>;
  };
}


export async function fetchPlatformRevenueSummary(token: string) {
  const res = await fetch(`${getPlatformApiBase()}/platform/revenue/summary`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error("Revenue summary failed");
  return data;
}

export async function fetchPlatformTenantsList(token: string) {
  const res = await fetch(`${getPlatformApiBase()}/platform/tenants/list`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ([]));

  if (!res.ok) throw new Error("Platform tenants list failed");
  return data;
}


export async function fetchPlatformUsersList(token: string) {
  const res = await fetch(`${getPlatformApiBase()}/platform/users/list`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ([]));

  if (!res.ok) throw new Error("Platform users list failed");
  return data;
}


export async function fetchPlatformReconciliationList(token: string) {
  const res = await fetch(`${getPlatformApiBase()}/platform/reconciliation/list`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ([]));

  if (!res.ok) throw new Error("Platform reconciliation list failed");
  return data;
}

export async function controlPlatformTenant(id: string, action: "suspend" | "activate", token: string) {
  const res = await fetch(`${getPlatformApiBase()}/platform/tenants/${id}/${action}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.text();
  if (!res.ok) throw new Error(data || "Tenant control failed");
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
  if (!res.ok) throw new Error(data || "User control failed");
  return data;
}
