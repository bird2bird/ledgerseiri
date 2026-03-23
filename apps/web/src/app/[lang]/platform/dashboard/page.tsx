"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchPlatformMe,
  fetchPlatformProtected,
  fetchPlatformTenantSummary,
  fetchPlatformUsersSummary,
  fetchPlatformReconciliationSummary,
  fetchPlatformRevenueSummary,
  getPlatformAccessToken,
} from "@/core/platform-auth/client";

/* ================= TYPES ================= */

type TenantSummary = {
  totalTenants: number;
  tenantsWithUsers: number;
  tenantsWithStores: number;
  subscribedTenants: number;
  createdLast30Days: number;
};

type UsersSummary = {
  totalUsers: number;
  assignedUsers: number;
  unassignedUsers: number;
  newUsers30d: number;
};

type ReconciliationSummary = {
  totalDecisions: number;
  avgConfidence: number;
  decisions30d: number;
  totalAudits: number;
  audits30d: number;
  latestSubmittedAt: string | null;
  decisionBreakdown: Array<{ decision: string; count: number }>;
};

type RevenueSummary = {
  totalSubscriptions: number;
  activeSubscriptions: number;
  newSubscriptions30d: number;
  mrr: number;
  arpu: number;
};

/* ================= PAGE ================= */

export default function PlatformDashboardPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "ja";

  const [tenantSummary, setTenantSummary] = useState<TenantSummary | null>(null);
  const [usersSummary, setUsersSummary] = useState<UsersSummary | null>(null);
  const [reconciliationSummary, setReconciliationSummary] =
    useState<ReconciliationSummary | null>(null);
  const [revenueSummary, setRevenueSummary] =
    useState<RevenueSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getPlatformAccessToken();

    if (!token) {
      router.replace(`/${lang}/platform-auth/login`);
      return;
    }

    Promise.all([
      fetchPlatformTenantSummary(token),
      fetchPlatformUsersSummary(token),
      fetchPlatformReconciliationSummary(token),
      fetchPlatformRevenueSummary(token),
    ])
      .then(([t, u, r, rev]) => {
        setTenantSummary(t);
        setUsersSummary(u);
        setReconciliationSummary(r);
        setRevenueSummary(rev);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [lang, router]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Platform Dashboard</h2>

      <h3>Revenue</h3>
      <div>MRR: ¥{revenueSummary?.mrr ?? 0}</div>
      <div>Active Subs: {revenueSummary?.activeSubscriptions ?? 0}</div>
      <div>Total Subs: {revenueSummary?.totalSubscriptions ?? 0}</div>
      <div>New Subs (30d): {revenueSummary?.newSubscriptions30d ?? 0}</div>
      <div>ARPU: ¥{revenueSummary?.arpu ?? 0}</div>

      <h3>Users</h3>
      <div>Total: {usersSummary?.totalUsers ?? 0}</div>

      <h3>Tenants</h3>
      <div>Total: {tenantSummary?.totalTenants ?? 0}</div>

      <h3>Reconciliation</h3>
      <div>Total Decisions: {reconciliationSummary?.totalDecisions ?? 0}</div>
    </div>
  );
}
