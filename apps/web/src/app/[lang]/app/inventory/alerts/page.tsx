"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  buildDrilldownHref,
  cloneSearchParams,
  readBaseDrilldownQuery,
  setOrDeleteQueryParam,
} from "@/core/drilldown/query-contract";

type AlertSeverity = "all" | "info" | "warning" | "critical";
type StockStatus = "healthy" | "low" | "out" | "negative" | string;

type InventoryStockRow = {
  id: string;
  skuId: string;
  sku: string;
  skuCode?: string;
  asin?: string | null;
  externalSku?: string | null;
  fulfillmentChannel?: string | null;
  name: string;
  productName?: string | null;
  store: string;
  storeId?: string | null;
  quantity: number;
  reservedQty: number;
  availableQty: number;
  alertLevel: number;
  stockStatus: StockStatus;
  stockStatusLabel?: string;
  isActive: boolean;
  updatedAt: string;
};

type InventoryAlertRow = {
  id: string;
  sku: string;
  name: string;
  store: string;
  title: string;
  severity: Exclude<AlertSeverity, "all">;
  quantity: number;
  reservedQty: number;
  availableQty: number;
  alertLevel: number;
  stockStatus: StockStatus;
  stockStatusLabel?: string;
};

type InventoryListResponse = {
  ok: boolean;
  domain: string;
  action: string;
  items: InventoryStockRow[];
  total?: number;
  message?: string;
};

const SEVERITY_ITEMS: AlertSeverity[] = ["all", "info", "warning", "critical"];

const LABELS: Record<AlertSeverity, string> = {
  all: "すべて",
  info: "Info",
  warning: "Warning",
  critical: "Critical",
};

function normalizeAlertSeverityParam(v?: string | null): AlertSeverity {
  return (["all", "info", "warning", "critical"].includes(String(v))
    ? v
    : "all") as AlertSeverity;
}

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

function mapStockStatusToSeverity(stockStatus: StockStatus): Exclude<AlertSeverity, "all"> | null {
  if (stockStatus === "negative") return "critical";
  if (stockStatus === "out") return "critical";
  if (stockStatus === "low") return "warning";
  return null;
}

function buildAlertTitle(row: InventoryStockRow) {
  if (row.stockStatus === "negative") return "マイナス在庫が発生しています";
  if (row.stockStatus === "out") return "在庫切れです";
  if (row.stockStatus === "low") return "安全在庫を下回っています";
  return "在庫状況を確認してください";
}

function buildStatusLabel(row: InventoryStockRow) {
  return row.stockStatusLabel || row.stockStatus;
}

export default function Page() {
  const params = useParams<{ lang: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { from, storeId, range } = readBaseDrilldownQuery(searchParams);
  const source = searchParams.get("source");
  const severity = normalizeAlertSeverityParam(searchParams.get("severity"));
  const isDashboard = from === "dashboard";
  const lang = params?.lang ?? "ja";

  const [rows, setRows] = useState<InventoryAlertRow[]>([]);
  const [adapterNote, setAdapterNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    const qs = new URLSearchParams();
    if (storeId && storeId !== "all") qs.set("storeId", storeId);

    fetch(`/api/inventory/stocks?${qs.toString()}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`inventory alerts source failed: ${res.status}`);
        }
        return (await res.json()) as InventoryListResponse;
      })
      .then((res) => {
        if (!mounted) return;

        const allRows = Array.isArray(res.items) ? res.items : [];

        const mapped = allRows
          .map((row) => {
            const sev = mapStockStatusToSeverity(row.stockStatus);
            if (!sev) return null;
            return {
              id: row.id,
              sku: row.skuCode || row.sku,
              name: row.name,
              store: row.store,
              title: buildAlertTitle(row),
              severity: sev,
              quantity: row.quantity,
              reservedQty: row.reservedQty,
              availableQty: row.availableQty,
              alertLevel: row.alertLevel,
              stockStatus: row.stockStatus,
              stockStatusLabel: buildStatusLabel(row),
            } as InventoryAlertRow;
          })
          .filter(Boolean) as InventoryAlertRow[];

        const filtered =
          severity === "all"
            ? mapped
            : mapped.filter((row) => row.severity === severity);

        setRows(filtered);
        setAdapterNote("Step110-K: inventory alerts use standard /api/inventory/stocks source.");
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        setRows([]);
        setError(e instanceof Error ? e.message : String(e));
        setAdapterNote("");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [from, storeId, range, source, severity]);

  const summary = useMemo(() => {
    const critical = rows.filter((row) => row.severity === "critical").length;
    const warning = rows.filter((row) => row.severity === "warning").length;
    const info = rows.filter((row) => row.severity === "info").length;
    return {
      total: rows.length,
      critical,
      warning,
      info,
    };
  }, [rows]);

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
              標準在庫APIから欠品・要補充・マイナス在庫を抽出します。
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${lang}/app/inventory/status`}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              在庫状況へ
            </Link>

            {isDashboard ? (
              <Link
                href={`/${lang}/app`}
                className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Dashboard に戻る
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Store</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{storeId || "all"}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Range</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{range || "-"}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Source</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{source ?? "inventory"}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Severity</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{LABELS[severity]}</div>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-500">
          {error ? error : adapterNote}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm text-slate-500">Total Alerts</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{summary.total}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm text-slate-500">Info</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{summary.info}</div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm text-amber-700">Warning</div>
          <div className="mt-2 text-2xl font-semibold text-amber-900">{summary.warning}</div>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <div className="text-sm text-rose-700">Critical</div>
          <div className="mt-2 text-2xl font-semibold text-rose-900">{summary.critical}</div>
        </div>
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
        <div className="mt-1 text-sm text-slate-500">stocks API → severity mapping → render</div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[150px_1fr_120px_90px_90px_90px] gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
            <div>SKU</div>
            <div>Title</div>
            <div>Severity</div>
            <div className="text-right">Qty</div>
            <div className="text-right">Available</div>
            <div className="text-right">Alert</div>
          </div>

          {loading ? (
            <div className="px-4 py-8 text-sm text-slate-500">loading...</div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-8 text-sm text-slate-500">no rows</div>
          ) : (
            rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[150px_1fr_120px_90px_90px_90px] gap-4 border-t border-slate-100 px-4 py-3 text-sm"
              >
                <div>
                  <div className="font-medium text-slate-900">{row.sku}</div>
                  <div className="mt-1 truncate text-xs text-slate-400">{row.store}</div>
                </div>
                <div>
                  <div className="text-slate-700">{row.title}</div>
                  <div className="mt-1 truncate text-xs text-slate-400">
                    {row.name} / {row.stockStatusLabel}
                  </div>
                </div>
                <div>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${toneClass(row.severity)}`}>
                    {LABELS[row.severity]}
                  </span>
                </div>
                <div className="text-right font-medium text-slate-900">{row.quantity}</div>
                <div className="text-right font-medium text-slate-900">{row.availableQty}</div>
                <div className="text-right font-medium text-slate-900">{row.alertLevel}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
