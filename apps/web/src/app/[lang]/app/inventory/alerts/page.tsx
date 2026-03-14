"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createDrilldownContext,
  fetchInventoryAlertsDrilldown,
  normalizeAlertSeverityParam,
  type AlertSeverity,
  type InventoryAlertRow,
} from "@/core/drilldown/target-pages";
import {
  buildDrilldownHref,
  cloneSearchParams,
  readBaseDrilldownQuery,
  setOrDeleteQueryParam,
} from "@/core/drilldown/query-contract";

const SEVERITY_ITEMS: AlertSeverity[] = ["all", "info", "warning", "critical"];

const LABELS: Record<AlertSeverity, string> = {
  all: "すべて",
  info: "Info",
  warning: "Warning",
  critical: "Critical",
};

function toneClass(severity: Exclude<AlertSeverity, "all">) {
  switch (severity) {
    case "critical":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default function Page() {
  const params = useParams<{ lang: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawFrom = searchParams.get("from");
  const rawStoreId = searchParams.get("storeId");
  const rawRange = searchParams.get("range");
  const { from, storeId, range } = readBaseDrilldownQuery(searchParams);
  void rawFrom;
  void rawStoreId;
  void rawRange;
  const source = searchParams.get("source");
  const severity = normalizeAlertSeverityParam(searchParams.get("severity"));
  const isDashboard = from === "dashboard";

  const [rows, setRows] = useState<InventoryAlertRow[]>([]);
  const [adapterNote, setAdapterNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const ctx = createDrilldownContext({
      from,
      storeId,
      range,
      severity,
    });

    fetchInventoryAlertsDrilldown(severity, ctx)
      .then((res) => {
        if (!mounted) return;
        setRows(res.rows);
        setAdapterNote(res.meta.note ?? "");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [from, storeId, range, source, severity]);

  function updateSeverity(next: AlertSeverity) {
    const qs = cloneSearchParams(searchParams);
    setOrDeleteQueryParam(qs, "severity", next, "all");
    router.replace(buildDrilldownHref(pathname, qs));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">在庫アラート</div>
            <div className="mt-2 text-sm text-slate-500">
              Step39E: base drilldown query 与 inventory-specific query 分层处理。
            </div>
          </div>

          {isDashboard ? (
            <Link
              href={`/${params?.lang ?? "ja"}/app`}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Dashboard に戻る
            </Link>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Store</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{storeId}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Range</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{range}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Source</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{source ?? "-"}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Severity</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{LABELS[severity]}</div>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-500">{adapterNote}</div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="text-lg font-semibold text-slate-900">Severity Filters</div>
        <div className="mt-4 flex flex-wrap gap-2">
          {SEVERITY_ITEMS.map((item) => {
            const active = severity === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => updateSeverity(item)}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {LABELS[item]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="text-lg font-semibold text-slate-900">Alert Rows</div>
        <div className="mt-1 text-sm text-slate-500">query → normalized base query → adapter → render</div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[140px_1fr_100px_100px] gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
            <div>SKU</div>
            <div>Title</div>
            <div>Severity</div>
            <div className="text-right">Stock</div>
          </div>

          {loading ? (
            <div className="px-4 py-8 text-sm text-slate-500">loading...</div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-8 text-sm text-slate-500">no rows</div>
          ) : (
            rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[140px_1fr_100px_100px] gap-4 border-t border-slate-100 px-4 py-3 text-sm"
              >
                <div className="font-medium text-slate-900">{row.sku}</div>
                <div className="text-slate-700">{row.title}</div>
                <div>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${toneClass(row.severity)}`}>
                    {LABELS[row.severity]}
                  </span>
                </div>
                <div className="text-right font-medium text-slate-900">{row.stock}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
