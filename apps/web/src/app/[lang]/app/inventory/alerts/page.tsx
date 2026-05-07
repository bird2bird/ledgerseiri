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

type AlertSeverity = "all" | "warning" | "critical";
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
  brand?: string | null;
  category?: string | null;
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

type InventoryMovementRow = {
  id: string;
  skuId: string;
  sku: string;
  skuCode?: string;
  productName?: string | null;
  storeId?: string | null;
  store?: string | null;
  type: "IN" | "OUT" | "ADJUST" | string;
  quantity: number;
  occurredAt: string;
  sourceType?: string | null;
  sourceId?: string | null;
  importJobId?: string | null;
  sourceRowNo?: number | null;
  transactionId?: string | null;
  businessMonth?: string | null;
  memo?: string | null;
  createdAt: string;
};

type InventoryAlertRow = InventoryStockRow & {
  title: string;
  severity: Exclude<AlertSeverity, "all">;
  priority: number;
  recommendedAction: string;
};

type InventoryListResponse = {
  ok: boolean;
  domain: string;
  action: string;
  items: InventoryStockRow[];
  total?: number;
  summary?: {
    total: number;
    healthy: number;
    lowStock: number;
    outOfStock: number;
    negativeStock?: number;
    totalQuantity?: number;
    totalAvailable?: number;
  };
  message?: string;
};

type InventoryMovementResponse = {
  ok: boolean;
  domain: string;
  action: string;
  items: InventoryMovementRow[];
  total?: number;
  message?: string;
};

const SEVERITY_ITEMS: AlertSeverity[] = ["all", "critical", "warning"];

const LABELS: Record<AlertSeverity, string> = {
  all: "すべて",
  warning: "要補充",
  critical: "緊急",
};

function normalizeAlertSeverityParam(v?: string | null): AlertSeverity {
  return (["all", "warning", "critical"].includes(String(v)) ? v : "all") as AlertSeverity;
}

function formatNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("ja-JP") : "0";
}

function formatDateTime(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapStockStatusToSeverity(stockStatus: StockStatus): Exclude<AlertSeverity, "all"> | null {
  if (stockStatus === "negative") return "critical";
  if (stockStatus === "out") return "critical";
  if (stockStatus === "low") return "warning";
  return null;
}

function buildAlertTitle(row: InventoryStockRow) {
  if (row.stockStatus === "negative") return "マイナス在庫が発生しています";
  if (row.stockStatus === "out") return "欠品しています";
  if (row.stockStatus === "low") return "補充確認が必要です";
  return "在庫状況を確認してください";
}

function buildRecommendedAction(row: InventoryStockRow) {
  if (row.stockStatus === "negative") {
    return "直近の注文取込・監査解決・手動調整を確認し、必要に応じて棚卸差分をADJUSTで補正してください。";
  }
  if (row.stockStatus === "out") {
    return "販売継続前に入庫予定、FBA在庫、未反映の注文取込、SKU alias の状態を確認してください。";
  }
  if (row.stockStatus === "low") {
    return "補充計画または alertLevel の妥当性を確認してください。";
  }
  return "追加対応は不要です。";
}

function alertPriority(row: InventoryStockRow) {
  if (row.stockStatus === "negative") return 0;
  if (row.stockStatus === "out") return 1;
  if (row.stockStatus === "low") return 2;
  return 3;
}

function buildAlertRow(row: InventoryStockRow): InventoryAlertRow | null {
  const severity = mapStockStatusToSeverity(row.stockStatus);
  if (!severity) return null;

  return {
    ...row,
    title: buildAlertTitle(row),
    severity,
    priority: alertPriority(row),
    recommendedAction: buildRecommendedAction(row),
  };
}

function severityTone(severity: Exclude<AlertSeverity, "all">) {
  if (severity === "critical") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }
  return "border-amber-200 bg-amber-50 text-amber-800";
}

function statusTone(stockStatus: StockStatus) {
  if (stockStatus === "negative") return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800";
  if (stockStatus === "out") return "border-rose-200 bg-rose-50 text-rose-800";
  if (stockStatus === "low") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

function movementTone(type: string) {
  if (type === "IN") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (type === "OUT") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function movementTraceLabel(movement: InventoryMovementRow) {
  if (movement.sourceType === "INVENTORY_AUDIT_RESOLUTION") return "在庫監査解決";
  if (movement.sourceType === "AMAZON_ORDER_IMPORT") return "Amazon注文取込";
  if (movement.sourceType === "MANUAL_STOCK_ADJUSTMENT") return "手動在庫調整";
  if (movement.importJobId) return "取込データ";
  if (movement.transactionId) return "取引連動";
  return movement.sourceType || "在庫移動";
}

function inventoryStatusHref(lang: string, row: InventoryAlertRow) {
  return `/${lang}/app/inventory/status?sku=${encodeURIComponent(row.skuCode || row.sku)}`;
}

function inventoryAuditHref(lang: string, row?: InventoryAlertRow | null) {
  const sku = row?.skuCode || row?.sku || "";
  return sku ? `/${lang}/app/inventory/audit?sku=${encodeURIComponent(sku)}` : `/${lang}/app/inventory/audit`;
}

function importCenterHref(lang: string, importJobId?: string | null) {
  return importJobId ? `/${lang}/app/data/import?importJobId=${encodeURIComponent(importJobId)}` : "";
}

export default function Page() {
  const params = useParams<{ lang: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { from, storeId, range } = readBaseDrilldownQuery(searchParams);
  const source = searchParams.get("source");
  const severity = normalizeAlertSeverityParam(searchParams.get("severity"));
  const q = searchParams.get("q")?.trim() ?? "";
  const isDashboard = from === "dashboard";
  const lang = params?.lang ?? "ja";

  const [allAlerts, setAllAlerts] = useState<InventoryAlertRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState<InventoryAlertRow | null>(null);
  const [movements, setMovements] = useState<InventoryMovementRow[]>([]);
  const [movementLoading, setMovementLoading] = useState(false);
  const [movementError, setMovementError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    const qs = new URLSearchParams();
    if (storeId && storeId !== "all") qs.set("storeId", storeId);
    if (q) qs.set("q", q);

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

        const rows = Array.isArray(res.items) ? res.items : [];
        const mapped = rows
          .map(buildAlertRow)
          .filter(Boolean)
          .sort((a, b) => {
            const left = a as InventoryAlertRow;
            const right = b as InventoryAlertRow;
            return left.priority - right.priority || left.availableQty - right.availableQty;
          }) as InventoryAlertRow[];

        setAllAlerts(mapped);
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        setAllAlerts([]);
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [storeId, q]);

  async function loadMovements(row: InventoryAlertRow) {
    setMovementLoading(true);
    setMovementError("");

    const qs = new URLSearchParams();
    qs.set("limit", "10");
    qs.set("skuCode", row.skuCode || row.sku);
    if (row.storeId) qs.set("storeId", row.storeId);

    try {
      const res = await fetch(`/api/inventory/movements?${qs.toString()}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`inventory movements request failed: ${res.status}`);
      const json: InventoryMovementResponse = await res.json();
      setMovements(Array.isArray(json.items) ? json.items : []);
    } catch (e: unknown) {
      setMovements([]);
      setMovementError(e instanceof Error ? e.message : String(e));
    } finally {
      setMovementLoading(false);
    }
  }

  function openDrawer(row: InventoryAlertRow) {
    setSelected(row);
    setMovementError("");
    void loadMovements(row);
  }

  function closeDrawer() {
    setSelected(null);
    setMovements([]);
    setMovementError("");
  }

  const rows = useMemo(() => {
    return severity === "all" ? allAlerts : allAlerts.filter((row) => row.severity === severity);
  }, [allAlerts, severity]);

  const summary = useMemo(() => {
    const negative = allAlerts.filter((row) => row.stockStatus === "negative").length;
    const out = allAlerts.filter((row) => row.stockStatus === "out").length;
    const low = allAlerts.filter((row) => row.stockStatus === "low").length;
    return {
      total: allAlerts.length,
      critical: negative + out,
      warning: low,
      negative,
      out,
      low,
    };
  }, [allAlerts]);

  function updateSeverity(next: AlertSeverity) {
    const qs = cloneSearchParams(searchParams);
    setOrDeleteQueryParam(qs, "severity", next, "all");
    router.replace(buildDrilldownHref(pathname, qs));
  }

  function updateQuery(next: string) {
    const qs = cloneSearchParams(searchParams);
    setOrDeleteQueryParam(qs, "q", next, "");
    router.replace(buildDrilldownHref(pathname, qs));
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-bold text-rose-700">Inventory Alerts</div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                在庫リスク管理
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                マイナス在庫・欠品・要補充SKUを優先順位付きで確認します。行を選択すると最近の在庫移動を表示し、在庫状況・在庫監査・Import Center へ遷移できます。
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/${lang}/app/inventory/status`}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                在庫状況へ
              </Link>
              <Link
                href={`/${lang}/app/inventory/audit`}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-800 shadow-sm hover:bg-amber-100"
              >
                在庫監査へ
              </Link>
              {isDashboard ? (
                <Link
                  href={`/${lang}/app`}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-bold text-white shadow-sm hover:bg-slate-800"
                >
                  Dashboard に戻る
                </Link>
              ) : null}
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <KpiCard label="総リスクSKU" value={summary.total} caption="negative / out / low" tone="slate" />
            <KpiCard label="緊急" value={summary.critical} caption="マイナス + 欠品" tone="rose" />
            <KpiCard label="マイナス" value={summary.negative} caption="要即時確認" tone="fuchsia" />
            <KpiCard label="欠品" value={summary.out} caption="販売影響あり" tone="rose" />
            <KpiCard label="要補充" value={summary.low} caption="閾値以下" tone="amber" />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
            <label className="grid gap-1 text-sm font-bold text-slate-700">
              SKU / 商品検索
              <input
                value={q}
                onChange={(e) => updateQuery(e.target.value)}
                placeholder="SKU / ASIN / 商品名"
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
              />
            </label>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Context</div>
              <div className="mt-2 grid gap-1 text-xs font-semibold text-slate-600">
                <div>store: {storeId || "all"}</div>
                <div>range: {range || "-"}</div>
                <div>source: {source || "inventory"}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {SEVERITY_ITEMS.map((item) => {
              const active = severity === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => updateSeverity(item)}
                  className={`rounded-xl border px-4 py-2 text-sm font-black transition ${
                    active
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {LABELS[item]}
                </button>
              );
            })}
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-black text-slate-950">リスクSKU一覧</h2>
              <p className="mt-1 text-xs text-slate-500">
                {loading ? "読み込み中..." : `${rows.length} 件表示。優先度順に並び替え済み。`}
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-500">API: /api/inventory/stocks</div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">SKU / 商品</th>
                  <th className="px-5 py-3">店舗</th>
                  <th className="px-5 py-3 text-right">在庫</th>
                  <th className="px-5 py-3 text-right">利用可能</th>
                  <th className="px-5 py-3 text-right">閾値</th>
                  <th className="px-5 py-3">推奨対応</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm font-medium text-slate-500">
                      loading...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm font-medium text-slate-500">
                      現在、条件に一致する在庫リスクはありません。
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => openDrawer(row)}
                      className={`cursor-pointer transition hover:bg-rose-50/50 ${
                        selected?.skuId === row.skuId ? "bg-rose-50 ring-1 ring-inset ring-rose-200" : ""
                      }`}
                    >
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusTone(row.stockStatus)}`}>
                          {row.stockStatusLabel || row.stockStatus}
                        </span>
                      </td>
                      <td className="min-w-[280px] px-5 py-4">
                        <div className="font-black text-slate-950">{row.skuCode || row.sku}</div>
                        <div className="mt-1 text-sm font-medium text-slate-700">{row.name}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {row.asin ? `ASIN: ${row.asin}` : row.externalSku ? `External: ${row.externalSku}` : "-"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="font-semibold text-slate-800">{row.store}</div>
                        <div className="mt-1 text-xs text-slate-400">{row.fulfillmentChannel || "FBA"}</div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-base font-black text-slate-950">
                        {formatNumber(row.quantity)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-base font-black text-slate-950">
                        {formatNumber(row.availableQty)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-slate-700">
                        {formatNumber(row.alertLevel)}
                      </td>
                      <td className="min-w-[260px] px-5 py-4">
                        <div className={`rounded-2xl border px-3 py-2 text-xs leading-5 ${severityTone(row.severity)}`}>
                          {row.recommendedAction}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="close inventory alert drawer backdrop"
            onClick={closeDrawer}
            className="absolute inset-0 bg-slate-950/30"
          />
          <aside className="relative h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-rose-700">
                    Alert Detail
                  </div>
                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    {selected.skuCode || selected.sku}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{selected.title}</p>
                </div>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  閉じる
                </button>
              </div>
            </div>

            <div className="grid gap-5 p-6">
              <section className={`rounded-3xl border p-5 ${statusTone(selected.stockStatus)}`}>
                <div className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">Recommended Action</div>
                <div className="mt-2 text-base font-black">{selected.title}</div>
                <p className="mt-1 text-sm leading-6 opacity-80">{selected.recommendedAction}</p>

                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  <Metric label="在庫" value={formatNumber(selected.quantity)} />
                  <Metric label="引当" value={formatNumber(selected.reservedQty)} />
                  <Metric label="利用可能" value={formatNumber(selected.availableQty)} />
                  <Metric label="閾値" value={formatNumber(selected.alertLevel)} />
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={inventoryStatusHref(lang, selected)}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-black text-white shadow-sm hover:bg-slate-800"
                  >
                    在庫状況で確認
                  </Link>
                  <Link
                    href={inventoryAuditHref(lang, selected)}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-black text-amber-800 shadow-sm hover:bg-amber-100"
                  >
                    在庫監査へ
                  </Link>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-base font-black text-slate-950">商品・店舗情報</div>
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <Info label="Product" value={selected.productName || selected.name} />
                  <Info label="Store" value={selected.store} />
                  <Info label="ASIN" value={selected.asin || "-"} />
                  <Info label="External SKU" value={selected.externalSku || "-"} />
                  <Info label="Brand" value={selected.brand || "-"} />
                  <Info label="Category" value={selected.category || "-"} />
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-black text-slate-950">最近の在庫移動</div>
                    <p className="mt-1 text-xs text-slate-500">
                      sourceType / importJobId / transactionId から原因を追跡します。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadMovements(selected)}
                    disabled={movementLoading}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {movementLoading ? "更新中" : "更新"}
                  </button>
                </div>

                {movementError ? (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {movementError}
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3">
                  {movementLoading ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-medium text-slate-500">
                      loading...
                    </div>
                  ) : movements.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-medium text-slate-500">
                      movement はありません。
                    </div>
                  ) : (
                    movements.map((movement) => (
                      <div key={movement.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${movementTone(movement.type)}`}>
                              {movement.type}
                            </span>
                            <div className="mt-2 text-sm font-bold text-slate-900">{movementTraceLabel(movement)}</div>
                            <div className="mt-1 text-xs text-slate-500">{formatDateTime(movement.occurredAt)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black text-slate-950">{formatNumber(movement.quantity)}</div>
                            <div className="mt-1 text-xs text-slate-500">{movement.businessMonth || "-"}</div>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                          {movement.importJobId ? (
                            <Link
                              href={importCenterHref(lang, movement.importJobId)}
                              className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-violet-700 hover:bg-violet-100"
                            >
                              Import Center
                            </Link>
                          ) : null}
                          {movement.sourceType === "INVENTORY_AUDIT_RESOLUTION" ? (
                            <Link
                              href={`/${lang}/app/inventory/audit?importJobId=${encodeURIComponent(movement.importJobId || "")}`}
                              className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700 hover:bg-amber-100"
                            >
                              Inventory Audit
                            </Link>
                          ) : null}
                        </div>

                        <div className="mt-3 grid gap-1 text-xs text-slate-500">
                          <div className="break-all">sourceType: {movement.sourceType || "-"}</div>
                          <div className="break-all">sourceId: {movement.sourceId || "-"}</div>
                          <div className="break-all">transactionId: {movement.transactionId || "-"}</div>
                          <div className="break-all">memo: {movement.memo || "-"}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function KpiCard({
  label,
  value,
  caption,
  tone,
}: {
  label: string;
  value: number;
  caption: string;
  tone: "slate" | "rose" | "fuchsia" | "amber";
}) {
  const toneClass =
    tone === "rose"
      ? "border-rose-200 bg-rose-50 text-rose-900"
      : tone === "fuchsia"
        ? "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900"
        : tone === "amber"
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-slate-200 bg-slate-50 text-slate-900";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="text-sm font-bold opacity-80">{label}</div>
      <div className="mt-2 text-2xl font-black">{formatNumber(value)}</div>
      <div className="mt-1 text-xs font-semibold opacity-70">{caption}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white px-4 py-3 shadow-sm">
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-black text-slate-950">{value}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 break-all text-sm font-bold text-slate-900">{value || "-"}</div>
    </div>
  );
}
