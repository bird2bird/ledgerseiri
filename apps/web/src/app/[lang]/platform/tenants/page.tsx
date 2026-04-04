"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchPlatformTenantsList,
  fetchPlatformOperationsList,
  getPlatformAccessToken,
  controlPlatformTenant,
  isPlatformUnauthorizedError,
} from "@/core/platform-auth/client";
import { TenantDetailDrawer } from "@/components/platform/TenantDetailDrawer";
import { PlatformTenantWorkspaceShell } from "@/components/platform/PlatformTenantWorkspaceShell";
import { PlatformTenantIntelligencePanel } from "@/components/platform/PlatformTenantIntelligencePanel";
import { PlatformTenantActionWorkspace } from "@/components/platform/PlatformTenantActionWorkspace";
import type { TenantRow } from "@/components/platform/tenant-types";

export default function PlatformTenantsPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "ja";

  const [rows, setRows] = useState<TenantRow[]>([]);
  const [latestTenantOperation, setLatestTenantOperation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<TenantRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [selectedTenantIdFromUrl, setSelectedTenantIdFromUrl] = useState("");

  async function reload() {
    const token = getPlatformAccessToken();
    if (!token) {
      router.replace(`/${lang}/platform-auth/login`);
      return;
    }

    const [data, opsData] = await Promise.all([
      fetchPlatformTenantsList(token),
      fetchPlatformOperationsList(token, {
        scope: "PLATFORM_TENANT",
        page: 1,
        limit: 1,
      }),
    ]);

    setRows(data);
    setLatestTenantOperation((opsData.items || [])[0] || null);
    setError("");
  }

  useEffect(() => {
    reload()
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [lang, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const selected = new URLSearchParams(window.location.search).get("selected") || "";
    setSelectedTenantIdFromUrl(selected);
  }, []);

  async function onControl(id: string, action: "suspend" | "activate") {
      const governanceNote = window.prompt(
        action === "suspend"
          ? "Provide a reason for tenant suspension:"
          : "Provide a reason for tenant activation:",
        ""
      );
      if (governanceNote === null) return;

      const confirmed = window.confirm(
        action === "suspend"
          ? "Dangerous action: suspend this tenant now?"
          : "Confirm tenant activation now?"
      );
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

      const result = await controlPlatformTenant(id, action, token);
      const operationId =
        typeof result === "object" && result?.operationId ? result.operationId : "";

      setNotice(
        `${action === "suspend" ? "Tenant suspended successfully." : "Tenant activated successfully."}${operationId ? ` Operation: ${operationId}` : ""}`
      );
      await reload();
    } catch (e) {
      if (isPlatformUnauthorizedError(e)) {
        router.replace(`/${lang}/platform-auth/login`);
        return;
      }
      setError(`Tenant ${action} failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusyId(null);
    }
  }

  const matchedSelectedRow = useMemo(() => {
    if (!selectedTenantIdFromUrl) return null;
    return rows.find((row) => row.id === selectedTenantIdFromUrl) || null;
  }, [rows, selectedTenantIdFromUrl]);

  useEffect(() => {
    if (!matchedSelectedRow) return;
    setSelectedRow(matchedSelectedRow);
  }, [matchedSelectedRow]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchSearch =
        !q ||
        row.name.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q);

      const matchStatus = !statusFilter || row.companyStatus === statusFilter;
      const matchPlan = !planFilter || (row.subscriptionPlan || "") === planFilter;

      return matchSearch && matchStatus && matchPlan;
    });
  }, [rows, search, statusFilter, planFilter]);

  if (loading) return <div className="text-slate-300">Loading tenants...</div>;

  return (
    <>
      <PlatformTenantWorkspaceShell
        lang={lang}
        selectedCompanyId={selectedRow?.id || ""}
      />

      <PlatformTenantIntelligencePanel
        lang={lang}
        selectedCompanyId={selectedRow?.id || ""}
        selectedTenantName={selectedRow?.name || ""}
        tenantStatus={selectedRow?.companyStatus || ""}
        tenantPlan={selectedRow?.subscriptionPlan || ""}
        riskSignal={selectedRow?.subscriptionStatus || ""}
        auditHref={
          selectedRow?.id
            ? `/${lang}/platform/audit?companyId=${encodeURIComponent(selectedRow.id)}&page=1&limit=20`
            : `/${lang}/platform/audit?page=1&limit=20`
        }
        operationsHref={
          selectedRow?.id
            ? `/${lang}/platform/operations?companyId=${encodeURIComponent(selectedRow.id)}`
            : `/${lang}/platform/operations`
        }
        usersHref={
          selectedRow?.id
            ? `/${lang}/platform/users?companyId=${encodeURIComponent(selectedRow.id)}`
            : `/${lang}/platform/users`
        }
      />

      <PlatformTenantActionWorkspace
        selectedCompanyId={selectedRow?.id || ""}
        selectedTenantName={selectedRow?.name || ""}
        companyStatus={selectedRow?.companyStatus || ""}
        subscriptionStatus={selectedRow?.subscriptionStatus || ""}
        latestTenantOperation={latestTenantOperation}
        busyId={busyId}
        notice={notice}
        error={error}
        onSuspend={() => {
          if (!selectedRow?.id) return;
          onControl(selectedRow.id, "suspend");
        }}
        onActivate={() => {
          if (!selectedRow?.id) return;
          onControl(selectedRow.id, "activate");
        }}
      />

      <TenantDetailDrawer
        open={drawerOpen}
        row={selectedRow}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedRow(null);
        }}
        onOpenAudit={() => router.push(`/${lang}/platform/audit?companyId=${selectedRow?.id || ""}&page=1&limit=20`)}
      />

      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-100">
        <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">Governance v2: note length policy + protected tenant safety rail are active.<br />Governance: tenant suspend/activate now requires operator note + confirmation.</div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="text-2xl font-semibold">Tenants</div>
          <div className="flex items-center gap-3">
            <Link
              href={`/${lang}/platform/audit?page=1&limit=20`}
              className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
            >
              Audit Entry
            </Link>
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
              Reload
            </button>
          </div>
        </div>

        {latestTenantOperation ? (
          <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
            Latest tenant control operation: <span className="font-semibold text-slate-100">{latestTenantOperation.id}</span> ·
            Status: <span className="font-semibold text-slate-100">{latestTenantOperation.status}</span> ·
            Success: <span className="font-semibold text-slate-100">{latestTenantOperation.successCount ?? 0}</span> ·
            Failed: <span className="font-semibold text-slate-100">{latestTenantOperation.failedCount ?? 0}</span>
            <Link
              href={`/${lang}/platform/operations`}
              className="ml-3 text-cyan-300 hover:text-cyan-200"
            >
              Open Operations Center
            </Link>
          </div>
        ) : null}

        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenant name / id"
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
          >
            <option value="">All tenant status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
          >
            <option value="">All plans</option>
            <option value="STARTER">STARTER</option>
            <option value="STANDARD">STANDARD</option>
            <option value="PREMIUM">PREMIUM</option>
          </select>
        </div>

        <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
          Showing <span className="font-semibold text-slate-100">{filteredRows.length}</span> of{" "}
          <span className="font-semibold text-slate-100">{rows.length}</span> tenants
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
              {filteredRows.map((row) => (
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
                      className="mr-2 rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                      onClick={() => {
                        setSelectedRow(row);
                        setDrawerOpen(true);
                      }}
                    >
                      DETAIL
                    </button>
                    <button
                      className="mr-2 rounded bg-rose-600 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={busyId === row.id}
                      onClick={() => onControl(row.id, "suspend")}
                    >
                      SUSPEND
                    </button>
                    <button
                      className="rounded bg-emerald-600 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={busyId === row.id}
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
    </>
  );
}
