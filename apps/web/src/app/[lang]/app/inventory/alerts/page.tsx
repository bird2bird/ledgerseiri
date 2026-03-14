"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { fetchInventoryAlertsDrilldown, type AlertSeverity, type InventoryAlertRow } from "@/core/drilldown/target-pages";

const LABELS: Record<AlertSeverity, string> = {
  all: "すべて",
  info: "Info",
  warning: "Warning",
  critical: "Critical",
};

function toneClass(severity: Exclude<AlertSeverity, "all">) {
  if (severity === "critical") return "border-rose-200 bg-rose-50 text-rose-700";
  if (severity === "warning") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function Page() {
  const params = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const source = searchParams.get("source");
  const rawSeverity = searchParams.get("severity") ?? "all";
  const severity = (["all", "info", "warning", "critical"].includes(rawSeverity)
    ? rawSeverity
    : "all") as AlertSeverity;
  const isDashboard = source === "dashboard";

  const [rows, setRows] = useState<InventoryAlertRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchInventoryAlertsDrilldown(severity)
      .then((res) => {
        if (!active) return;
        setRows(res.rows);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [severity]);

  const criticalCount = useMemo(
    () => rows.filter((x) => x.severity === "critical").length,
    [rows]
  );

  function updateSeverity(next: AlertSeverity) {
    const qs = new URLSearchParams(searchParams.toString());
    if (next === "all") qs.delete("severity");
    else qs.set("severity", next);
    router.replace(`${pathname}?${qs.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-black/5 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">在庫アラート</div>
            <div className="mt-2 text-sm text-slate-500">
              Step39C: severity filter 已绑定 adapter rows 加载层。
            </div>
          </div>

          {isDashboard ? (
            <Link
              href={`/${params?.lang ?? "ja"}/app`}
              className="inline-flex rounded-xl border border-black/10 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Dashboard に戻る
            </Link>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["all", "info", "warning", "critical"] as AlertSeverity[]).map((item) => {
            const active = severity === item;
            return (
              <button
                key={item}
                onClick={() => updateSeverity(item)}
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-black/10 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {LABELS[item]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-black/5 bg-white p-6">
          <div className="text-sm text-slate-500">Current Severity</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{LABELS[severity]}</div>
          <div className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">{rows.length}</div>
          <div className="mt-2 text-sm text-slate-500">critical rows: {criticalCount}</div>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-6">
          <div className="text-lg font-semibold text-slate-900">Alert Rows</div>
          <div className="mt-1 text-sm text-slate-500">query → state → adapter fetch → filtered rows</div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                loading...
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                no rows
              </div>
            ) : (
              rows.map((row) => (
                <div key={row.id} className="rounded-xl border border-black/5 bg-white px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{row.title}</div>
                      <div className="mt-1 text-xs text-slate-500">{row.sku}</div>
                      <div className="mt-1 text-xs text-slate-500">stock: {row.stock}</div>
                    </div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${toneClass(row.severity)}`}>
                      {LABELS[row.severity]}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
