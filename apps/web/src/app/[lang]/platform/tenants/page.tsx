"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchPlatformTenantsList,
  getPlatformAccessToken,
  controlPlatformTenant,
} from "@/core/platform-auth/client";

type TenantRow = {
  id: string;
  name: string;
  companyStatus: string;
  createdAt: string;
  userCount: number;
  storeCount: number;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
};

export default function PlatformTenantsPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "ja";

  const [rows, setRows] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function reload() {
    const token = getPlatformAccessToken();
    if (!token) {
      router.replace(`/${lang}/platform-auth/login`);
      return;
    }
    const data = await fetchPlatformTenantsList(token);
    setRows(data);
  }

  useEffect(() => {
    reload()
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [lang, router]);

  async function onControl(id: string, action: "suspend" | "activate") {
    try {
      const token = getPlatformAccessToken();
      if (!token) {
        router.replace(`/${lang}/platform-auth/login`);
        return;
      }
      await controlPlatformTenant(id, action, token);
      alert(`Tenant ${action} success`);
      await reload();
    } catch (e) {
      alert(`Tenant ${action} failed: ` + e);
    }
  }

  if (loading) return <div className="text-slate-300">Loading tenants...</div>;
  if (error) return <div className="text-rose-300">{error}</div>;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-100">
      <div className="mb-4 text-2xl font-semibold">Tenants</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-slate-400">
            <tr className="border-b border-slate-800">
              <th className="px-3 py-3 text-left">Name</th>
              <th className="px-3 py-3 text-left">Users</th>
              <th className="px-3 py-3 text-left">Stores</th>
              <th className="px-3 py-3 text-left">Plan</th>
              <th className="px-3 py-3 text-left">Tenant Status</th>
              <th className="px-3 py-3 text-left">Billing Status</th>
              <th className="px-3 py-3 text-left">Period End</th>
              <th className="px-3 py-3 text-left">Created</th>
              <th className="px-3 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-800/70">
                <td className="px-3 py-3 font-medium">{row.name}</td>
                <td className="px-3 py-3">{row.userCount}</td>
                <td className="px-3 py-3">{row.storeCount}</td>
                <td className="px-3 py-3">{row.subscriptionPlan || "-"}</td>
                <td className="px-3 py-3">{row.companyStatus}</td>
                <td className="px-3 py-3">{row.subscriptionStatus || "-"}</td>
                <td className="px-3 py-3">{row.currentPeriodEnd || "-"}</td>
                <td className="px-3 py-3">{row.createdAt}</td>
                <td className="px-3 py-3">
                  <button
                    className="mr-2 rounded bg-rose-600 px-2 py-1 text-xs"
                    onClick={() => onControl(row.id, "suspend")}
                  >
                    SUSPEND
                  </button>
                  <button
                    className="rounded bg-emerald-600 px-2 py-1 text-xs"
                    onClick={() => onControl(row.id, "activate")}
                  >
                    ACTIVATE
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
